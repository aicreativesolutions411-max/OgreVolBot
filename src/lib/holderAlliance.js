import { PublicKey, SystemProgram } from '@solana/web3.js';
export const HOLDER_ALLIANCE_CONSENT_VERSION='2026-09-27-holders-v1';
export const WALLET_SPLIT_CONSENT_VERSION='2026-09-28-wallet-split-v2';
export const HOLDER_CADENCE_MS=12*60*60*1000;
export const HOLDER_MIN_PAYOUT=1000000n;
export const HOLDER_VAULT_RESERVE=1000000n;
export function normalizeHolderAlliance(input={}) {
  const keys=['creatorShareBps','ownHolderShareBps','partnerHolderShareBps','recipientShareBps'];
  const shares=keys.map(k=>Number(k==='recipientShareBps'?(input[k]??0):input[k]));
  if(shares.some(v=>!Number.isSafeInteger(v)||v<0||v>9900||v%100!==0)||shares[0]<100||shares.reduce((a,b)=>a+b,0)!==10000)throw new Error('Use whole percentages totaling 100%. Keep at least 1% for the developer and 1% for another destination. Unused destinations can receive 0%; choose Keep my fees for 100% developer.');
  let partnerMint='';
  if(shares[2]>0){
    let mint;try{mint=new PublicKey(input.partnerMint);}catch{throw new Error('Enter the partner community’s Solana coin address.');}
    if(mint.equals(PublicKey.default)||mint.toBase58()==='So11111111111111111111111111111111111111112')throw new Error('Choose a community token, not native SOL or a burn address.');
    partnerMint=mint.toBase58();
  }
  let recipientWallet='';
  if(shares[3]){
    let key;try{key=new PublicKey(String(input.recipientWallet||'').trim());}catch{throw new Error('Paste a valid Solana recipient wallet address, not a coin contract.');}
    recipientWallet=key.toBase58();
    if(!PublicKey.isOnCurve(key.toBytes())||key.equals(PublicKey.default)||recipientWallet===partnerMint||recipientWallet==='1nc1nerator11111111111111111111111111111111111')throw new Error('Recipient must be a normal Solana wallet, not a token, program or burn address.');
  }
  return {version:shares[3]?2:1,mode:'holder_alliance',partnerMint,partnerName:partnerMint?String(input.partnerName||'Partner community').trim().slice(0,64):'',recipientWallet,...Object.fromEntries(keys.map((k,i)=>[k,shares[i]])),minimumUsd:20,cadenceMs:HOLDER_CADENCE_MS,autoDistribute:true,consentVersion:String(input.consentVersion||'')};
}
export async function verifySplitRecipient(connection,policy,{creator='',mint='',vault=''}={}){
  if(!policy.recipientShareBps)return;
  const normalized=normalizeHolderAlliance(policy),key=new PublicKey(normalized.recipientWallet);
  if([creator,mint,vault].includes(key.toBase58()))throw new Error('Use a recipient wallet different from the developer, coin contract and rewards vault.');
  const info=await connection.getAccountInfo(key,'confirmed');
  if(info&&(!info.owner.equals(SystemProgram.programId)||info.executable||(info.data?.length||0)>0))throw new Error('Recipient is a coin contract, token account or program. Paste a normal SOL receiving wallet.');
}
function fraction(value){
  const m=String(value).match(/^(\d+)(?:\.(\d+))?(?:e([+-]?\d+))?$/i);
  if(!m)throw new Error('A fresh positive USD price is required.');
  const scale=(m[2]||'').length-Number(m[3]||0);
  if(Math.abs(scale)>40)throw new Error('USD price outside supported precision.');
  let n=BigInt(m[1]+(m[2]||'')),d=1n;
  if(scale>=0)d=10n**BigInt(scale);else n*=10n**BigInt(-scale);
  if(n<=0n)throw new Error('A fresh positive USD price is required.');return [n,d];
}
export function eligibleHolderBalances(rows,{decimals,priceUsd,excluded=[]}){
  if(!Number.isInteger(decimals)||decimals<0||decimals>18)throw new Error('Unsupported token decimals.');
  const [n,d]=fraction(priceUsd),balances=new Map(),skip=new Set([...excluded,'1nc1nerator11111111111111111111111111111111111']);
  for(const row of rows){
    const key=new PublicKey(row.wallet);if(!PublicKey.isOnCurve(key.toBytes())||key.equals(PublicKey.default)||skip.has(row.wallet))continue;
    if(!/^\d+$/.test(String(row.amount)))throw new Error('Invalid raw holder balance.');
    balances.set(row.wallet,(balances.get(row.wallet)||0n)+BigInt(row.amount));
  }
  const threshold=20n*d*10n**BigInt(decimals);
  return [...balances].filter(([,amount])=>amount*n>threshold).map(([wallet,amount])=>({wallet,amount:String(amount)})).sort((a,b)=>a.wallet.localeCompare(b.wallet,'en'));
}
export function holderLiabilities(state={}){return Object.values(state.credits||{}).reduce((a,b)=>a+BigInt(b),0n)+BigInt(state.carryOwn||0)+BigInt(state.carryPartner||0);}
export function allocateHolderCycle(state,{policy,balance,snapshots,now=Date.now()}){
  policy=normalizeHolderAlliance(policy);
  if(state.lastSnapshotAt&&now-state.lastSnapshotAt<HOLDER_CADENCE_MS)throw new Error('Holder snapshots are at least 12 hours apart.');
  if(state.pending||state.retryRows)throw new Error('Reconcile the previous payout before a new snapshot.');
  if((!policy.ownHolderShareBps&&BigInt(state.carryOwn||0)>0n)||(!policy.partnerHolderShareBps&&BigInt(state.carryPartner||0)>0n))throw new Error('An inactive allocation has reserved rewards. Reconcile the original policy first.');
  const available=BigInt(balance)-holderLiabilities(state)-HOLDER_VAULT_RESERVE;
  if(available<0n)throw new Error('Vault balance does not cover its reserved holder rewards. No new allocation made.');
  const combined=BigInt(policy.ownHolderShareBps+policy.partnerHolderShareBps+policy.recipientShareBps);
  const recipient=available*BigInt(policy.recipientShareBps)/combined;
  const own=policy.partnerHolderShareBps?available*BigInt(policy.ownHolderShareBps)/combined:policy.ownHolderShareBps?available-recipient:0n;
  const partner=policy.partnerHolderShareBps?available-own-recipient:0n;
  const walletAmount=policy.ownHolderShareBps||policy.partnerHolderShareBps?recipient:available;
  const credits={...(state.credits||{})};
  const creditSources=Object.fromEntries(['own','partner','recipient'].map(k=>[k,{...(state.creditSources?.[k]||{})}]));
  const add=(source,wallet,award)=>{if(!award)return;credits[wallet]=String(BigInt(credits[wallet]||0)+award);creditSources[source][wallet]=String(BigInt(creditSources[source][wallet]||0)+award);};
  const distribute=(amount,snapshot,source)=>{
    if(!Array.isArray(snapshot?.holders))throw new Error('A complete verified holder snapshot is required for both communities.');
    const total=snapshot.holders.reduce((sum,row)=>sum+BigInt(row.amount),0n);let left=amount;
    const seen=new Set();
    for(const row of snapshot.holders){
      if(seen.has(row.wallet)||BigInt(row.amount)<=0n)throw new Error('Invalid or duplicate holder snapshot.');seen.add(row.wallet);
      const award=total?amount*BigInt(row.amount)/total:0n;
      if(award){add(source,row.wallet,award);left-=award;}
    }return String(left);
  };
  const carryOwn=policy.ownHolderShareBps?distribute(own+BigInt(state.carryOwn||0),snapshots.own,'own'):'0';
  const carryPartner=policy.partnerHolderShareBps?distribute(partner+BigInt(state.carryPartner||0),snapshots.partner,'partner'):'0';
  if(policy.recipientShareBps)add('recipient',policy.recipientWallet,walletAmount);
  const allocatedBySource=Object.fromEntries([['own',own],['partner',partner],['recipient',walletAmount]].map(([k,v])=>[k,String(BigInt(state.allocatedBySource?.[k]||0)+v)]));
  const summary=s=>s?{slot:s.slot,priceUsd:s.priceUsd,count:s.holders.length}:null;
  return {...state,version:2,credits,creditSources,allocatedBySource,sourceTrackingSince:state.sourceTrackingSince||now,carryOwn,carryPartner,lastSnapshotAt:now,status:'ALLOCATED',lastError:'',
    allocatedLamports:String(BigInt(state.allocatedLamports||0)+available),
    lastEligibility:{own:policy.ownHolderShareBps?snapshots.own.holders.map(r=>r.wallet):[],partner:policy.partnerHolderShareBps?snapshots.partner.holders.map(r=>r.wallet):[]},
    lastSnapshot:{at:new Date(now).toISOString(),newLamports:String(available),own:policy.ownHolderShareBps?summary(snapshots.own):null,partner:policy.partnerHolderShareBps?summary(snapshots.partner):null}};
}
export function publicHolderLedger(state={}){return {status:state.status||'ACCUMULATING',error:state.lastError||'',paidLamports:state.paidLamports||'0',owedLamports:String(holderLiabilities(state)),lastSnapshot:state.lastSnapshot||null,nextSnapshotAt:state.lastSnapshotAt?new Date(state.lastSnapshotAt+HOLDER_CADENCE_MS).toISOString():'',receiptCount:state.receiptCount||0,receipts:(state.receipts||[]).slice(-20).map(r=>({signature:r.signature,confirmedAt:r.confirmedAt,lamports:r.lamports,recipients:r.recipients})),signature:state.pending?.signature||state.receipts?.at(-1)?.signature||''};}
