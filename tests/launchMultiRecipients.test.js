import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { normalizeHolderAlliance, verifySplitRecipient, allocateHolderCycle, holderLiabilities } from '../src/lib/holderAlliance.js';
import { assertLaunchUtilityReady, reviewLaunchUtility } from '../src/lib/launchUtility.js';
import { settleHolderBatch } from '../src/lib/holderAllianceSettlement.js';
import { buildLaunchRewardReport, holderEligibilityReport } from '../src/lib/launchRewardReport.js';
const key=()=>Keypair.generate().publicKey.toBase58();
const a=key(),b=key(),creator=key(),mint=key();
const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:4000,partnerHolderShareBps:0,recipients:[{wallet:a,shareBps:1000,label:'Art'},{wallet:b,shareBps:3000,label:'Team'}]};
test('multi-wallet policy preserves exact shares and requires its own consent',()=>{
  const p=normalizeHolderAlliance(policy);assert.equal(p.version,3);assert.equal(p.recipientShareBps,4000);assert.equal(p.recipients.length,2);
  assert.throws(()=>assertLaunchUtilityReady({...policy,consentVersion:'2026-09-28-wallet-split-v2'}),/Review/);
  const review=reviewLaunchUtility(policy);assert.ok(review.summary.includes(a));assert.ok(review.summary.includes(b));
  assert.equal(assertLaunchUtilityReady({...policy,consentVersion:review.consentVersion}).policy.version,3);
  for(const recipients of [[{wallet:a,shareBps:2000},{wallet:a,shareBps:2000}],[{wallet:a,shareBps:4001}],[{wallet:'bad',shareBps:4000}],Array.from({length:11},()=>({wallet:key(),shareBps:100}))])assert.throws(()=>normalizeHolderAlliance({...policy,recipients}));
  assert.throws(()=>normalizeHolderAlliance({...policy,recipientShareBps:1000}),/total/i);
});
test('every receiver is checked before spending',async()=>{
  const checked=[];await verifySplitRecipient({getAccountInfo:async k=>{checked.push(k.toBase58());return null;}},policy,{creator,mint});assert.deepEqual(checked,[a,b]);
  await assert.rejects(verifySplitRecipient({getAccountInfo:async k=>k.toBase58()===b?{owner:SystemProgram.programId,data:Buffer.alloc(82)}:null},policy),/coin contract/);
  await assert.rejects(verifySplitRecipient({getAccountInfo:async()=>null},policy,{creator:b}),/different/);
});
test('multi-wallet allocation conserves dust, overlapping holder payouts and idempotent source receipts',async()=>{
  for(const n of [0n,1n,7n,800000003n]){
    const s=allocateHolderCycle({}, {policy,balance:String(n+1000000n),snapshots:{own:{holders:[{wallet:a,amount:'1'}]}},now:100000000});assert.equal(holderLiabilities(s),n);
  }
  let state=allocateHolderCycle({}, {policy,balance:'801000000',snapshots:{own:{holders:[{wallet:a,amount:'1'}]}},now:100000000});
  assert.equal(state.credits[a],'500000000');assert.equal(state.credits[b],'300000000');
  let sends=0;const args={load:async()=>structuredClone(state),save:async s=>{state=structuredClone(s)},prepare:async()=>({signature:'one',rawBase64:'AQ==',blockhash:'b',lastValidBlockHeight:10}),connection:{sendRawTransaction:async()=>{sends++;throw Error('unknown');},getSignatureStatus:async()=>({value:{confirmationStatus:'finalized',err:null}})}};
  await settleHolderBatch(args);await settleHolderBatch(args);await settleHolderBatch(args);assert.equal(sends,1);
  assert.equal(state.paidByWallet[a],'500000000');assert.equal(state.paidByWallet[b],'300000000');
  const attempt={status:'COMPLETE',tokenMint:mint,devWalletPublicKey:creator,launchUtility:normalizeHolderAlliance(policy),holderAllianceLedger:state};
  const r=buildLaunchRewardReport(attempt);assert.equal(r.destinations.find(d=>d.address===a).paidLamports,'100000000');assert.equal(r.destinations.find(d=>d.address===b).paidLamports,'300000000');assert.equal(r.unattributedPaidLamports,'0');
  assert.equal(holderEligibilityReport(attempt,b).recipient,true);assert.ok(!JSON.stringify(r).includes('rawBase64'));
});

test('ten recipients settle in bounded batches and preserve cumulative wallet totals after receipt rotation',async()=>{
  const recipients=Array.from({length:10},()=>({wallet:key(),shareBps:900}));
  const p={mode:'holder_alliance',creatorShareBps:1000,ownHolderShareBps:0,partnerHolderShareBps:0,recipients};
  let state=allocateHolderCycle({}, {policy:p,balance:'19000000',snapshots:{},now:100000000}),sends=0,prepares=0;
  const args={load:async()=>structuredClone(state),save:async s=>{state=structuredClone(s)},prepare:async rows=>{assert.ok(rows.length<=8);return {signature:'batch-'+(++prepares),rawBase64:'AQ==',blockhash:'b',lastValidBlockHeight:10}},connection:{sendRawTransaction:async()=>{sends++;return 'sent';},getSignatureStatus:async()=>({value:{confirmationStatus:'finalized',err:null}})}};
  for(let i=0;i<5;i++)await settleHolderBatch(args);
  assert.equal(sends,2);assert.equal(state.paidLamports,'18000000');assert.equal(Object.keys(state.credits).length,0);
  for(const r of recipients)assert.equal(state.paidByWallet[r.wallet],'1800000');
  state.receipts=[];
  const report=buildLaunchRewardReport({status:'COMPLETE',tokenMint:mint,devWalletPublicKey:creator,launchUtility:normalizeHolderAlliance(p),holderAllianceLedger:state});
  assert.equal(report.destinations.filter(d=>d.id.startsWith('recipient:')).length,10);assert.equal(report.unattributedPaidLamports,'0');
});
