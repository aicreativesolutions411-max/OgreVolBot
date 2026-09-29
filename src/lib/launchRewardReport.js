import { PublicKey } from '@solana/web3.js';
import { publicHolderLedger, HOLDER_CADENCE_MS } from './holderAlliance.js';
const text=(v,n=120)=>String(v||'').slice(0,n);
const amount=v=>/^\d+$/.test(String(v||''))?String(v):'0';
function rewardMode(attempt,policy){
  if(policy.mode&&policy.mode!=='creator')return policy.mode;
  if([attempt.pumpCashback,attempt.cashback,attempt.isCashbackCoin].some(v=>v===true))return 'cashback';
  if(attempt.holderRewards?.enabled)return 'legacy_holders';
  if(attempt.creatorFeeSplit?.length||(attempt.creatorFeeRecipient&&attempt.creatorFeeRecipient!==attempt.devWalletPublicKey))return 'legacy_split';
  return 'creator';
}
const snapshot=s=>s?{at:text(s.at,40),own:s.own?{count:Number(s.own.count)||0,slot:Number(s.own.slot)||0,priceUsd:text(s.own.priceUsd,50)}:null,partner:s.partner?{count:Number(s.partner.count)||0,slot:Number(s.partner.slot)||0,priceUsd:text(s.partner.priceUsd,50)}:null}:null;

function feeDestinations(attempt,policy,holder){
  if(!['creator','alliance','holder_alliance'].includes(rewardMode(attempt,policy)))return {destinations:[],collectionTotalLamports:null,collectionReceiptCount:0,collectionAccountingPending:false,collectionReceipts:[],unattributedPaidLamports:'0'};
  const receipts=attempt.allianceDistribution?.receipts||[],verified=receipts.filter(r=>r.accountingStatus==='verified');
  const direct=wallet=>String(verified.reduce((total,r)=>total+(r.payments||[]).filter(p=>p.wallet===wallet).reduce((s,p)=>s+BigInt(amount(p.lamports)),0n),0n));
  const tracked=['alliance','holder_alliance'].includes(policy.mode),partial=receipts.length!==verified.length;
  const ledger=attempt.holderAllianceLedger||{};
  const destination=(id,label,shareBps,address,tokenMint)=>{
    const source=ledger.creditSources?.[id];
    const owed=Object.values(source||{}).reduce((a,b)=>a+BigInt(amount(b)),0n)+BigInt(amount(id==='own'?ledger.carryOwn:id==='partner'?ledger.carryPartner:0));
    return {id,label,shareBps:Number(shareBps)||0,address:text(address,44),tokenMint:text(tokenMint,44),
      paidLamports:ledger.sourceTrackingSince?amount(ledger.paidBySource?.[id]):null,reservedLamports:ledger.sourceTrackingSince?String(owed):null,allocatedLamports:ledger.sourceTrackingSince?amount(ledger.allocatedBySource?.[id]):null,
      coverage:ledger.sourceTrackingSince?'tracked':'not_yet_attributed'};
  };
  const destinations=[{id:'creator',label:'Developer wallet',address:text(attempt.devWalletPublicKey,44),shareBps:holder?policy.creatorShareBps:policy.mode==='alliance'?10000-policy.partnerShareBps:10000,
    paidLamports:tracked?direct(attempt.devWalletPublicKey):null,reservedLamports:null,coverage:tracked?(partial?'partial':'verified_recorded_receipts'):'wallet_wide_only'}];
  if(holder)destinations.push(destination('own','This coin’s holders',policy.ownHolderShareBps,'',attempt.tokenMint),destination('partner',policy.partnerName||'Other community holders',policy.partnerHolderShareBps,'',policy.partnerMint),destination('recipient','Recipient wallet',policy.recipientShareBps,policy.recipientWallet,''));
  else if(policy.mode==='alliance')destinations.push({id:'recipient',label:policy.partnerName||'Recipient wallet',address:text(policy.partnerWallet,44),shareBps:policy.partnerShareBps,paidLamports:direct(policy.partnerWallet),reservedLamports:null,coverage:partial?'partial':'verified_recorded_receipts'});
  return {destinations:destinations.filter(d=>d.shareBps>0),collectionTotalLamports:tracked?String(verified.reduce((a,r)=>a+BigInt(amount(r.totalLamports)),0n)):null,
    collectionReceiptCount:verified.length,collectionAccountingPending:partial,
    collectionReceipts:receipts.slice(-20).map(r=>({signature:text(r.signature,100),confirmedAt:text(r.confirmedAt,40),totalLamports:r.accountingStatus==='verified'?amount(r.totalLamports):null,accountingStatus:r.accountingStatus||'unavailable'})),
    unattributedPaidLamports:holder?String(BigInt(amount(ledger.paidLamports))-['own','partner','recipient'].reduce((a,k)=>a+BigInt(amount(ledger.paidBySource?.[k])),0n)):'0'};
}

// Explicit public allowlist. Never serialize an attempt, credits, signed bytes,
// wallet ownership, private vault data or the complete eligibility list.
export function buildLaunchRewardReport(attempt={}){
  if(attempt.status!=='COMPLETE'||!attempt.tokenMint)return null;
  const policy=attempt.launchUtility||{},mode=rewardMode(attempt,policy),holder=mode==='holder_alliance';
  const ledger=holder?publicHolderLedger(attempt.holderAllianceLedger):null;
  return {
    mint:text(attempt.tokenMint,64),name:text(attempt.tokenName||attempt.name||attempt.metadataJson?.name,64),symbol:text(attempt.symbol||attempt.ticker,16),
    mode,
    asset:'SOL',quoteMint:'So11111111111111111111111111111111111111112',
    accountingScope:holder?'coin_holder_vault':'wallet',
    claimMode:attempt.creatorFeeClaimMode==='manual'?'manual':'auto',
    creatorShareBps:holder?policy.creatorShareBps:policy.mode==='alliance'?10000-policy.partnerShareBps:mode==='creator'?10000:null,
    ownHolderShareBps:holder?policy.ownHolderShareBps:0,partnerHolderShareBps:holder?policy.partnerHolderShareBps:0,
    recipientShareBps:holder?(policy.recipientShareBps||0):0,recipientWallet:holder?text(policy.recipientWallet,44):'',
    ...feeDestinations(attempt,policy,holder),
    partnerMint:holder?text(policy.partnerMint,44):'',partnerName:text(policy.partnerName,64),
    affiliation:'Not verified — naming a community does not imply endorsement.',
    status:holder?text(attempt.pumpFeeSharing?.status||'PENDING_SETUP'):policy.mode==='alliance'?text(attempt.pumpFeeSharing?.status):'ACCRUING',
    automatic:holder&&attempt.allianceDistribution?.automaticPaused!==true,
    paidLamports:ledger?amount(ledger.paidLamports):null,owedLamports:ledger?amount(ledger.owedLamports):null,
    allocatedLamports:ledger?amount(attempt.holderAllianceLedger?.allocatedLamports):null,
    distributionStatus:ledger?.status||'',minimumUsd:holder?20:null,cadenceHours:holder?HOLDER_CADENCE_MS/3600000:null,
    nextSnapshotAt:ledger?.nextSnapshotAt||'',lastSnapshot:snapshot(ledger?.lastSnapshot),
    receiptCount:ledger?.receiptCount||0,
    receipts:(attempt.holderAllianceLedger?.receipts||[]).slice(-20).map(r=>({signature:text(r.signature,100),lamports:amount(r.lamports),recipients:Number(r.recipients)||0,confirmedAt:text(r.confirmedAt,40),bySource:Object.fromEntries(['own','partner','recipient','unattributed'].filter(k=>r.bySource?.[k]).map(k=>[k,amount(r.bySource[k])]))})),
    delayed:holder&&!!(attempt.holderLastError||attempt.holderAllianceLedger?.lastError),
    note:holder?'Finalized recorded payments only. Developer payments and vault funding are counted from verified per-coin Pump receipts; vault funding is not counted a second time as recipient income. Reserved amounts are not paid. Older unclassified history and unavailable receipts are not estimated. Network/data failures can delay the 12-hour schedule.':policy.mode==='alliance'?'Only verified per-coin distribution receipts count toward these destination totals. Unavailable historical receipts are not estimated.':mode==='creator'?'Standard creator claims may cover several coins. Check wallet-wide balances in Wallet; per-coin earnings are not estimated.':mode==='cashback'?'This coin uses the existing Pump Cashback program, not a 100% developer allocation. Check the appropriate reward balances in Wallet; per-coin destination amounts are not available here.':'This coin has a legacy fee program. Its existing configuration remains unchanged. Destination-level amounts and percentages are unavailable in this report; they are not assumed to belong to the developer.'
  };
}
export function holderEligibilityReport(attempt,wallet){
  const key=new PublicKey(wallet);if(!PublicKey.isOnCurve(key.toBytes()))throw new Error('Enter an ordinary Solana wallet address.');
  const policy=attempt.launchUtility||{},ledger=attempt.holderAllianceLedger||{};
  const result=side=>!policy[side==='own'?'ownHolderShareBps':'partnerHolderShareBps']?'not_selected':!Array.isArray(ledger.lastEligibility?.[side])?'unknown':ledger.lastEligibility[side].includes(key.toBase58())?'eligible':'not_eligible';
  return {wallet:key.toBase58(),asOf:ledger.lastSnapshot?.at||'',own:result('own'),partner:result('partner'),recipient:policy.recipientShareBps>0&&policy.recipientWallet===key.toBase58(),owedLamports:amount(ledger.credits?.[key.toBase58()]),
    note:'Based on the last completed snapshot, not live holdings. More than $20 is required at each snapshot; pools, program and burn accounts are excluded. No snapshot means eligibility is unknown.'};
}
