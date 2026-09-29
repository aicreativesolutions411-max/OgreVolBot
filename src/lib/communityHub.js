import { createHash, randomUUID } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import { holderEligibilityReport } from './launchRewardReport.js';
import { flowScheduleSummary } from './slimeFlows.js';

export const COMMUNITY_CONSENT = '2026-09-28-community-v1';
const WSOL = 'So11111111111111111111111111111111111111112';
const clean = (v, n = 160) => String(v || '').trim().slice(0, n);
const hash = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const amount = value => /^\d+$/.test(String(value ?? '')) ? String(value) : '0';
const iso = n => new Date(n).toISOString();
const owns = (row, userId) => String(row.userId) === String(userId);
function address(value) {
  const key = new PublicKey(String(value || ''));
  if (key.equals(PublicKey.default)) throw new Error('Use a real Solana address.');
  return key.toBase58();
}
function programFor(rows, mint) { return [...rows].reverse().find(a => a.tokenMint === mint && a.status === 'COMPLETE'); }
function connectableProgram(rows,mint,userId) {
  const matches=rows.filter(a=>[a.tokenMint,a.mintPublicKey,a.mint].includes(mint));
  if(matches.some(a=>!owns(a,userId)))throw new Error('This coin is registered to another account.');
  if(matches.some(a=>a.status!=='COMPLETE'))throw new Error('Finish or reconcile the original launch before connecting its fees.');
  if(matches.some(a=>a.launchUtility?.mode&&a.launchUtility.mode!=='creator'||a.holderRewards?.enabled||a.launchHolderRewards?.enabled||a.pumpCashback||a.pumpFeeSharing?.setupSignature||a.pumpFeeSharingIntent||a.promoterFeeSharePct>0))throw new Error('This coin already has a reward program. Manage the original program instead.');
  return matches.at(-1);
}
function termsFor(attempt) {
  const p = attempt.launchUtility || {}, approved=attempt.slimeFlow?.approved;
  return { mint: attempt.tokenMint, creator: attempt.devWalletPublicKey, mode: p.mode,
    creatorShareBps: p.creatorShareBps, ownHolderShareBps: p.ownHolderShareBps,
    partnerHolderShareBps: p.partnerHolderShareBps, partnerMint: p.partnerMint,
    ...(p.recipientShareBps?{recipientShareBps:p.recipientShareBps,...(Array.isArray(p.recipients)?{recipients:p.recipients}:{recipientWallet:p.recipientWallet})}:{}),
    minimumUsd: 20, cadenceHours: flowScheduleSummary(attempt).cadenceHours, asset: 'SOL', permanent: true,
    ...(approved?{program:{approvalHash:approved.hash,minimumLamports:approved.program?.minimumLamports,maximumLamports:approved.program?.maximumLamports}}:{}) };
}
const agreementNote = 'Creator representatives approved these exact terms. This is not approval by every holder or a guarantee. Withdrawing endorsement does not change permanent on-chain fee shares or owed rewards.';
export function publicAgreement(row) {
  return { id: clean(row.id, 80), mint: clean(row.mint, 44), partnerMint: clean(row.partnerMint, 44),
    status: clean(row.status, 30), terms: row.terms, termsHash: clean(row.termsHash, 64), expiresAt: row.expiresAt,
    approvals: (row.approvals || []).map(a => ({wallet:a.wallet, role:a.role, at:a.at})),
    createdAt: row.createdAt, withdrawnAt: row.withdrawnAt || '', note: row.status==='VERIFIED'?agreementNote:row.status==='TERMS_CHANGED'?'These historical approvals no longer match the current program. A fresh agreement is required. Permanent fee shares and unpaid rewards are unchanged.':'Only the approvals listed below are recorded. Pending or withdrawn proposals are not verified partnerships. Withdrawing endorsement does not change permanent on-chain fees or owed rewards.' };
}
function currentAgreement(row,rows,now){
  if(row.status==='PENDING'&&Date.parse(row.expiresAt)<=now)return publicAgreement({...row,status:'EXPIRED'});
  if(['PENDING','VERIFIED'].includes(row.status)){
    const a=programFor(rows,row.mint);
    if(!a||a.pumpFeeSharing?.status!=='ACTIVE'||hash(termsFor(a))!==row.termsHash)return publicAgreement({...row,status:'TERMS_CHANGED'});
  }
  return publicAgreement(row);
}
const goalNote = 'A public expense target, not escrow, an investment, or a verified charity. The permanent fee split continues after this target is reached. Only recorded finalized fee distributions count; the payee controls received funds.';
function publicGoal(g) {
  return { id:g.id, mint:g.mint, title:g.title, description:g.description, payee:g.payee,
    shareBps:g.shareBps, targetLamports:g.targetLamports, paidLamports:g.paidLamports || '0',
    status:BigInt(g.paidLamports || '0') >= BigInt(g.targetLamports) ? 'TARGET_REACHED' : 'FUNDING',
    createdAt:g.createdAt, updatedAt:g.updatedAt || g.createdAt,
    receipts:(g.receipts || []).slice(-30).map(r => ({signature:r.signature,lamports:r.lamports,confirmedAt:r.confirmedAt})),
    receiptCount:(g.receipts || []).length, note:goalNote };
}
function publicReview(r) {
  return {id:r.id,mint:r.mint,creator:r.creator,policy:r.policy,status:r.status,expiresAt:r.expiresAt,
    consentVersion:COMMUNITY_CONSENT,authority:r.authority,attemptId:r.attemptId,
    note:'This does not relaunch or mint a coin. Confirming authorizes the permanent Pump creator-fee split, setup rent and bounded network fees. Existing wallet-wide fees remain with their prior recipient. Holder payouts require funding and complete snapshots.'};
}

// Storage and signing are injected. Every state transition uses the caller's
// durable cross-process lock; no request-only financial scheduler is introduced.
export function createCommunityHub({read,write,lock,attempts,wallets,authority,reviewPolicy,connect,verifyReceipt,now=Date.now,id=randomUUID}) {
  const load = async () => { const s=await read(); return {...s,reviews:s.reviews||[],agreements:s.agreements||[],goals:s.goals||[]}; };
  const wallet = async (userId, value) => {
    const key=address(value);
    if (!(await wallets(userId)).some(w=>w.publicKey===key)) throw new Error('Select a managed wallet owned by this account.');
    return key;
  };
  const ownerProgram = async (userId,mint) => {
    const a=programFor(await attempts(),address(mint));
    if (!a || !owns(a,userId)) throw new Error('Owned coin program not found.');
    return a;
  };
  return {
    async review(userId,input) {
      return lock(async()=>{
        const mint=address(input.mint),creator=await wallet(userId,input.wallet);
        const rows=await attempts(),existing=connectableProgram(rows,mint,userId);
        const proof=await authority(mint,creator,{editable:true});
        const policy=await reviewPolicy(input.policy,{rail:'pump',mint,creator});
        if(!['holder_alliance','alliance'].includes(policy.mode)) throw new Error('Choose a holder reward or treasury split.');
        if(policy.partnerMint===mint) throw new Error('Choose a different partner community.');
        const s=await load();
        s.reviews=s.reviews.filter(r=>r.status!=='REVIEWED'||Date.parse(r.expiresAt)>now());
        if(s.reviews.filter(r=>owns(r,userId)&&r.status==='REVIEWED').length>=10) throw new Error('Finish an existing review or wait ten minutes.');
        const r={id:id(),userId:String(userId),mint,creator,policy,authority:proof,status:'REVIEWED',attemptId:existing?.id||`connected-${mint}`,createdAt:iso(now()),expiresAt:iso(now()+600000),consentVersion:COMMUNITY_CONSENT};
        s.reviews.push(r);await write(s);return publicReview(r);
      });
    },
    async confirm(userId,input) {
      return lock(async()=>{
        const s=await load(),r=s.reviews.find(r=>r.id===input.reviewId&&owns(r,userId));
        if(!r) throw new Error('Review not found.');
        if(input.acknowledge!==true) throw new Error('Acknowledge the permanent fee split before confirming.');
        if(r.status==='ACTIVE') return publicReview(r);
        if(r.status==='REVIEWED'&&Date.parse(r.expiresAt)<=now()) throw new Error('Review expired. Check the coin again.');
        await wallet(userId,r.creator);
        if(r.status==='REVIEWED') {
          connectableProgram(await attempts(),r.mint,userId);
          await authority(r.mint,r.creator,{editable:true});
          r.status='CONNECTING';r.confirmedAt=iso(now());await write(s);
        }
        // A saved CONNECTING intent must resume the same attempt; expiry never
        // authorizes a different mint, wallet, split, or replacement transaction.
        const result=await connect(r);
        r.status=result.status==='ACTIVE'?'ACTIVE':'CONNECTING';
        await write(s);return {...publicReview(r),utility:result};
      });
    },
    async propose(userId,input) {
      return lock(async()=>{
        const a=await ownerProgram(userId,input.mint),partnerMint=address(input.partnerMint);
        if(a.tokenMint===partnerMint) throw new Error('Choose a different community.');
        if(a.launchUtility?.mode!=='holder_alliance'||a.launchUtility.partnerMint!==partnerMint||a.pumpFeeSharing?.status!=='ACTIVE') throw new Error('An active holder program naming this recipient community is required.');
        const creator=await wallet(userId,input.wallet);
        if(creator!==a.devWalletPublicKey)throw new Error('Use this coin’s original creator wallet.');
        const proof=await authority(a.tokenMint,creator);
        const s=await load(),terms=termsFor(a),termsHash=hash(terms);
        const same=s.agreements.find(p=>p.termsHash===termsHash&&(p.status==='VERIFIED'||p.status==='PENDING'&&Date.parse(p.expiresAt)>now()));
        if(same)return publicAgreement(same);
        if(s.agreements.filter(p=>owns(p,userId)).length>=100)throw new Error('Partnership record limit reached.');
        const p={id:id(),userId:String(userId),mint:a.tokenMint,partnerMint,terms,termsHash,status:'PENDING',createdAt:iso(now()),expiresAt:iso(now()+7*86400000),approvals:[{userId:String(userId),wallet:creator,role:proof.role,at:iso(now())}]};
        s.agreements.push(p);await write(s);return publicAgreement(p);
      });
    },
    async respond(userId,input) {
      return lock(async()=>{
        const s=await load(),p=s.agreements.find(p=>p.id===input.id);
        if(!p)throw new Error('Partnership not found.');
        if(input.termsHash!==p.termsHash)throw new Error('Review the exact terms again.');
        const w=await wallet(userId,input.wallet);
        if(input.action==='withdraw') {
          if(!p.approvals.some(a=>a.wallet===w&&owns(a,userId)))throw new Error('Only an approving representative can withdraw their endorsement.');
          p.status='WITHDRAWN';p.withdrawnAt=iso(now());await write(s);return publicAgreement(p);
        }
        if(input.action!=='accept'||p.status!=='PENDING'||Date.parse(p.expiresAt)<=now())throw new Error('This proposal is no longer open.');
        const a=programFor(await attempts(),p.mint);
        if(!a||a.pumpFeeSharing?.status!=='ACTIVE'||hash(termsFor(a))!==p.termsHash)throw new Error('Program terms changed; request a new proposal.');
        if(w===p.terms.creator)throw new Error('The other coin’s creator must approve independently.');
        await authority(p.mint,p.terms.creator);
        const proof=await authority(p.partnerMint,w);
        p.approvals.push({userId:String(userId),wallet:w,role:proof.role,at:iso(now())});
        p.status='VERIFIED';p.acceptedAt=iso(now());await write(s);return publicAgreement(p);
      });
    },
    async createGoal(userId,input) {
      return lock(async()=>{
        if(input.acknowledge!==true)throw new Error('Acknowledge that the permanent split continues after the target.');
        const a=await ownerProgram(userId,input.mint),p=a.launchUtility||{};
        if(p.mode!=='alliance'||p.autoDistribute||a.pumpFeeSharing?.status!=='ACTIVE')throw new Error('A manually distributed active treasury split is required. Holder liabilities cannot fund projects.');
        await wallet(userId,a.devWalletPublicKey);await authority(a.tokenMint,a.devWalletPublicKey);
        const raw=String(input.targetSol||'');if(!/^\d{1,7}(?:\.\d{1,9})?$/.test(raw))throw new Error('Enter a positive SOL target with at most nine decimals.');
        const [whole,part='']=raw.split('.'),target=BigInt(whole)*1000000000n+BigInt(part.padEnd(9,'0'));
        if(target<=0n||target>1000000n*1000000000n)throw new Error('SOL target must be above zero and at most one million.');
        const title=clean(input.title,80);if(!title)throw new Error('Give the project a title.');
        const s=await load();if(s.goals.some(g=>g.mint===a.tokenMint))throw new Error('This coin already has a public project target. Its original record stays visible.');
        if(s.goals.filter(g=>owns(g,userId)).length>=50)throw new Error('Project limit reached.');
        const g={id:id(),userId:String(userId),attemptId:a.id,mint:a.tokenMint,title,description:clean(input.description,600),payee:p.partnerWallet,shareBps:p.partnerShareBps,targetLamports:String(target),paidLamports:'0',createdAt:iso(now()),receipts:[],baselineSignatures:(a.allianceDistribution?.receipts||[]).map(r=>r.signature),consentVersion:COMMUNITY_CONSENT};
        s.goals.push(g);await write(s);return publicGoal(g);
      });
    },
    async syncGoal(userId,goalId) {
      return lock(async()=>{
        const s=await load(),g=s.goals.find(g=>g.id===goalId&&owns(g,userId));if(!g)throw new Error('Project not found.');
        const a=await ownerProgram(userId,g.mint);
        if(a.launchUtility?.partnerWallet!==g.payee||a.launchUtility?.partnerShareBps!==g.shareBps)throw new Error('Original project terms do not match the saved program.');
        const seen=new Set([...g.baselineSignatures,...g.receipts.map(r=>r.signature)]);
        const rows=(a.allianceDistribution?.receipts||[]).filter(r=>!seen.has(r.signature)&&Date.parse(r.confirmedAt)>=Date.parse(g.createdAt)).slice(0,10);
        if(g.receipts.length+rows.length>10000)throw new Error('Project receipt limit reached; history preserved.');
        for(const r of rows){
          if(seen.has(r.signature))continue;
          const credit=await verifyReceipt(r.signature,g.payee,a);
          if(credit==null)continue; // not finalized/indexed yet: never guess
          g.receipts.push({signature:r.signature,lamports:amount(credit),confirmedAt:r.confirmedAt});seen.add(r.signature);
          g.paidLamports=String(BigInt(g.paidLamports)+BigInt(amount(credit)));
          g.updatedAt=iso(now());await write(s); // preserve each verified receipt if later RPC calls fail
        }
        return publicGoal(g);
      });
    },
    async dashboard(userId) {
      const s=await load(),ws=await wallets(userId),keys=new Set(ws.map(w=>w.publicKey)),rows=await attempts();
      return {wallets:ws.map(w=>({publicKey:w.publicKey,label:clean(w.label||w.name||'Wallet',64)})),
        reviews:s.reviews.filter(r=>owns(r,userId)).slice(-20).map(publicReview),
        agreements:s.agreements.filter(p=>owns(p,userId)||p.approvals.some(a=>keys.has(a.wallet))).map(p=>currentAgreement(p,rows,now())),
        goals:s.goals.filter(g=>owns(g,userId)).map(publicGoal),
        programs:rows.filter(a=>owns(a,userId)&&a.status==='COMPLETE').map(a=>({mint:a.tokenMint,symbol:clean(a.symbol,16),id:a.id,creator:a.devWalletPublicKey,mode:a.launchUtility?.mode||'creator',status:a.pumpFeeSharing?.status||'ACCRUING',partnerMint:a.launchUtility?.partnerMint||'',terms:termsFor(a),payee:a.launchUtility?.partnerWallet||'',shareBps:a.launchUtility?.partnerShareBps||0,automatic:a.launchUtility?.autoDistribute===true&&!flowScheduleSummary(a).paused}))};
    },
    async publicData({mint,agreementId}={}) {
      const s=await load(),rows=await attempts();
      return {agreements:s.agreements.filter(p=>agreementId?p.id===agreementId:mint?p.mint===mint||p.partnerMint===mint:p.status==='VERIFIED').slice(-100).map(p=>currentAgreement(p,rows,now())),
        goals:s.goals.filter(g=>!mint||g.mint===mint).slice(-100).map(publicGoal)};
    }
  };
}

export function buildRewardsInbox(attempts, wallets) {
  const keys=[...new Set(wallets.map(address))], coins=[];let owed=0n,paid=0n;
  const seen=new Set();
  for(const a of [...attempts].reverse()) {
    if(a.status!=='COMPLETE'||a.launchUtility?.mode!=='holder_alliance'||seen.has(a.tokenMint))continue;
    seen.add(a.tokenMint);const ledger=a.holderAllianceLedger||{},schedule=flowScheduleSummary(a);
    for(const wallet of keys) {
      const e=holderEligibilityReport(a,wallet);
      const receipts=(ledger.receipts||[]).flatMap(r=>{
        const n=(r.payments||[]).filter(p=>p.wallet===wallet).reduce((s,p)=>s+BigInt(amount(p.lamports)),0n);
        return n>0n?[{signature:clean(r.signature,100),lamports:String(n),confirmedAt:clean(r.confirmedAt,40)}]:[];
      });
      if(e.owedLamports==='0'&&!receipts.length&&e.own!=='eligible'&&e.partner!=='eligible'&&!e.recipient)continue;
      owed+=BigInt(e.owedLamports);paid+=receipts.reduce((s,r)=>s+BigInt(r.lamports),0n);
      coins.push({mint:a.tokenMint,symbol:clean(a.symbol||a.ticker,16),name:clean(a.tokenName||a.name,64),wallet,eligibility:e,
        owedLamports:e.owedLamports,receipts:receipts.slice(-20),status:a.pumpFeeSharing?.status||'PENDING_SETUP',
        paused:a.allianceDistribution?.automaticPaused===true||schedule.paused,delayed:!!(a.holderLastError||ledger.lastError),cadenceHours:schedule.cadenceHours,
        nextSnapshotAt:ledger.lastSnapshotAt?iso(ledger.lastSnapshotAt+schedule.cadenceHours*3600000):'',minimumPayoutLamports:'1000000'});
    }
  }
  return {asset:'SOL',owedLamports:String(owed),recentPaidLamports:String(paid),coins,
    note:'Paid totals cover retained wallet-specific finalized receipts, not lifetime earnings. Older batch-only receipts cannot be attributed to a wallet. Eligibility is the last completed snapshot, not live holdings. Creator fees remain separate in Wallet.'};
}

export function verifiedAgreementFor(attempt,agreements) {
  const expected=hash(termsFor(attempt));
  return agreements.find(p=>p.status==='VERIFIED'&&p.mint===attempt.tokenMint&&p.termsHash===expected&&p.approvals?.length===2&&p.approvals[0].wallet!==p.approvals[1].wallet)||null;
}

// The caller only accepts signatures recorded by our exact per-coin fee
// distributor, read at finalized commitment. Never accept user-supplied receipts.
export function receiptCredit(tx,payee) {
  if(!tx?.meta||tx.meta.err)throw new Error('Distribution transaction missing or failed.');
  const m=tx.meta,message=tx.transaction?.message;
  const keys=[...(message?.accountKeys||message?.staticAccountKeys||[]),...(m.loadedAddresses?.writable||[]),...(m.loadedAddresses?.readonly||[])].map(k=>String(k.pubkey||k));
  let sol=0n;const i=keys.indexOf(payee);
  if(i>=0){if(![m.preBalances?.[i],m.postBalances?.[i]].every(v=>Number.isSafeInteger(v)&&v>=0))throw new Error('Invalid receipt balance.');sol=BigInt(m.postBalances[i])-BigInt(m.preBalances[i]);}
  const tokenSum=rows=>(rows||[]).filter(r=>r.owner===payee&&r.mint===WSOL).reduce((s,r)=>{
    if(!/^\d+$/.test(r.uiTokenAmount?.amount||''))throw new Error('Invalid receipt token balance.');return s+BigInt(r.uiTokenAmount.amount);
  },0n);
  const total=sol+tokenSum(m.postTokenBalances)-tokenSum(m.preTokenBalances);
  return String(total>0n?total:0n);
}
