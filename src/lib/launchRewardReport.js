import { PublicKey } from '@solana/web3.js';
import { publicHolderLedger, HOLDER_CADENCE_MS } from './holderAlliance.js';
const text=(v,n=120)=>String(v||'').slice(0,n);
const amount=v=>/^\d+$/.test(String(v||''))?String(v):'0';
const snapshot=s=>s?{at:text(s.at,40),own:s.own?{count:Number(s.own.count)||0,slot:Number(s.own.slot)||0,priceUsd:text(s.own.priceUsd,50)}:null,partner:s.partner?{count:Number(s.partner.count)||0,slot:Number(s.partner.slot)||0,priceUsd:text(s.partner.priceUsd,50)}:null}:null;

// Explicit public allowlist. Never serialize an attempt, credits, signed bytes,
// wallet ownership, private vault data or the complete eligibility list.
export function buildLaunchRewardReport(attempt={}){
  if(attempt.status!=='COMPLETE'||!attempt.tokenMint)return null;
  const policy=attempt.launchUtility||{},holder=policy.mode==='holder_alliance';
  const ledger=holder?publicHolderLedger(attempt.holderAllianceLedger):null;
  return {
    mint:text(attempt.tokenMint,64),name:text(attempt.tokenName||attempt.name||attempt.metadataJson?.name,64),symbol:text(attempt.symbol||attempt.ticker,16),
    mode:holder?'holder_alliance':policy.mode|| (attempt.holderRewards?.enabled?'legacy_holders':'creator'),
    asset:'SOL',quoteMint:'So11111111111111111111111111111111111111112',
    accountingScope:holder?'coin_holder_vault':'wallet',
    claimMode:attempt.creatorFeeClaimMode==='manual'?'manual':'auto',
    creatorShareBps:holder?policy.creatorShareBps:policy.mode==='alliance'?10000-policy.partnerShareBps:10000,
    ownHolderShareBps:holder?policy.ownHolderShareBps:0,partnerHolderShareBps:holder?policy.partnerHolderShareBps:0,
    partnerMint:holder?text(policy.partnerMint,44):'',partnerName:text(policy.partnerName,64),
    affiliation:'Not verified — naming a community does not imply endorsement.',
    status:holder?text(attempt.pumpFeeSharing?.status||'PENDING_SETUP'):policy.mode==='alliance'?text(attempt.pumpFeeSharing?.status):'ACCRUING',
    automatic:holder&&attempt.allianceDistribution?.automaticPaused!==true,
    paidLamports:ledger?amount(ledger.paidLamports):null,owedLamports:ledger?amount(ledger.owedLamports):null,
    allocatedLamports:ledger?amount(attempt.holderAllianceLedger?.allocatedLamports):null,
    distributionStatus:ledger?.status||'',minimumUsd:holder?20:null,cadenceHours:holder?HOLDER_CADENCE_MS/3600000:null,
    nextSnapshotAt:ledger?.nextSnapshotAt||'',lastSnapshot:snapshot(ledger?.lastSnapshot),
    receiptCount:ledger?.receiptCount||0,
    receipts:(ledger?.receipts||[]).map(r=>({signature:text(r.signature,100),lamports:amount(r.lamports),recipients:Number(r.recipients)||0,confirmedAt:text(r.confirmedAt,40)})),
    delayed:holder&&!!(attempt.holderLastError||attempt.holderAllianceLedger?.lastError),
    note:holder?'Finalized holder payments only. Reserved amounts are not yet paid. Network/data failures can delay the 12-hour schedule.':'Standard creator claims may cover several coins. Check wallet-wide balances in Wallet; per-coin earnings are not estimated.'
  };
}
export function holderEligibilityReport(attempt,wallet){
  const key=new PublicKey(wallet);if(!PublicKey.isOnCurve(key.toBytes()))throw new Error('Enter an ordinary Solana wallet address.');
  const policy=attempt.launchUtility||{},ledger=attempt.holderAllianceLedger||{};
  const result=side=>!policy[side==='own'?'ownHolderShareBps':'partnerHolderShareBps']?'not_selected':!Array.isArray(ledger.lastEligibility?.[side])?'unknown':ledger.lastEligibility[side].includes(key.toBase58())?'eligible':'not_eligible';
  return {wallet:key.toBase58(),asOf:ledger.lastSnapshot?.at||'',own:result('own'),partner:result('partner'),owedLamports:amount(ledger.credits?.[key.toBase58()]),
    note:'Based on the last completed snapshot, not live holdings. More than $20 is required at each snapshot; pools, program and burn accounts are excluded. No snapshot means eligibility is unknown.'};
}
