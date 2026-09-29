import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, SystemProgram } from '@solana/web3.js';
import { normalizeHolderAlliance, verifySplitRecipient, allocateHolderCycle, holderLiabilities, HOLDER_ALLIANCE_CONSENT_VERSION, WALLET_SPLIT_CONSENT_VERSION } from '../src/lib/holderAlliance.js';
import { assertLaunchUtilityReady } from '../src/lib/launchUtility.js';
import { settleHolderBatch } from '../src/lib/holderAllianceSettlement.js';
import { buildLaunchRewardReport } from '../src/lib/launchRewardReport.js';
const key=()=>Keypair.generate().publicKey.toBase58();
const creator=key(), recipientWallet=key(), holder=key(), partnerMint=key();
const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:3000,partnerHolderShareBps:3000,recipientShareBps:2000,recipientWallet,partnerMint};
test('one reviewed allocation includes developer, both communities and a pasted wallet',()=>{
  const p=normalizeHolderAlliance(policy);
  assert.equal(p.recipientWallet,recipientWallet);assert.equal(p.recipientShareBps,2000);
  for(const edit of [{recipientWallet:partnerMint},{recipientWallet:SystemProgram.programId.toBase58()},{recipientWallet:'bad'},{recipientShareBps:2001},{recipientShareBps:1900}])assert.throws(()=>normalizeHolderAlliance({...policy,...edit}));
  assert.equal(normalizeHolderAlliance({...policy,ownHolderShareBps:0,partnerHolderShareBps:0,recipientShareBps:8000}).recipientShareBps,8000);
});
test('four-way vault allocation conserves funds and records overlapping holder sources separately',async()=>{
  const snapshots={own:{holders:[{wallet:holder,amount:'1'}]},partner:{holders:[{wallet:holder,amount:'1'}]}};
  let state=allocateHolderCycle({}, {policy,balance:'801000000',snapshots,now:100000000});
  assert.equal(state.credits[holder],'600000000');assert.equal(state.credits[recipientWallet],'200000000');
  assert.equal(holderLiabilities(state),800000000n);
  assert.equal(state.creditSources.own[holder],'300000000');assert.equal(state.creditSources.partner[holder],'300000000');
  await settleHolderBatch({load:async()=>structuredClone(state),save:async v=>{state=v;},prepare:async()=>({signature:'test',rawBase64:'AQ==',blockhash:'block',lastValidBlockHeight:12}),connection:{sendRawTransaction:async()=> 'test',confirmTransaction:async()=>({value:{err:null}})}});
  assert.deepEqual(state.paidBySource,{own:'300000000',partner:'300000000',recipient:'200000000'});
  assert.equal(holderLiabilities(state),0n);
  const report=buildLaunchRewardReport({status:'COMPLETE',tokenMint:key(),devWalletPublicKey:creator,launchUtility:policy,holderAllianceLedger:state});
  assert.equal(report.destinations.find(d=>d.id==='recipient').paidLamports,'200000000');
  assert.equal(report.destinations.find(d=>d.id==='own').paidLamports,'300000000');
  assert.ok(!JSON.stringify(report).includes('rawBase64'));
});
test('wallet-only allocations need no holder snapshot and old unattributed credits stay intact',()=>{
  const p={...policy,ownHolderShareBps:0,partnerHolderShareBps:0,recipientShareBps:8000};
  const state=allocateHolderCycle({credits:{[holder]:'1000000'},paidLamports:'300'}, {policy:p,balance:'4000000',snapshots:{},now:100000000});
  assert.equal(state.credits[holder],'1000000');assert.equal(state.credits[recipientWallet],'2000000');
  assert.equal(holderLiabilities(state),3000000n);
});
test('new wallet destination requires new consent and rejects token accounts before spending',async()=>{
  assert.throws(()=>assertLaunchUtilityReady({...policy,consentVersion:HOLDER_ALLIANCE_CONSENT_VERSION},{rail:'pump'}),/Review/);
  assert.equal(assertLaunchUtilityReady({...policy,consentVersion:WALLET_SPLIT_CONSENT_VERSION},{rail:'pump'}).policy.recipientWallet,recipientWallet);
  const connection={getAccountInfo:async()=>null};
  await verifySplitRecipient(connection,policy,{creator});
  await assert.rejects(verifySplitRecipient(connection,policy,{creator:recipientWallet}),/different/);
  await assert.rejects(verifySplitRecipient(connection,policy,{mint:recipientWallet}),/different/);
  await assert.rejects(verifySplitRecipient(connection,policy,{vault:recipientWallet}),/different/);
  for(const info of [{owner:Keypair.generate().publicKey,data:Buffer.alloc(82)},{owner:SystemProgram.programId,data:Buffer.alloc(80)},{owner:SystemProgram.programId,executable:true}]){
    await assert.rejects(verifySplitRecipient({getAccountInfo:async()=>info},policy),/coin contract/);
  }
  await verifySplitRecipient({getAccountInfo:async()=>({owner:SystemProgram.programId,data:Buffer.alloc(0),executable:false})},policy);
});
test('allocation conserves every lamport across optional destinations, dust and overlapping wallets',()=>{
  const snapshots={own:{holders:[{wallet:recipientWallet,amount:'3'},{wallet:holder,amount:'7'}]},partner:{holders:[{wallet:holder,amount:'1'}]}};
  for(const shares of [[3000,3000,2000],[6000,0,2000],[0,6000,2000],[0,0,8000],[4000,4000,0]])for(const deposit of [0n,1n,7n,8000003n,9999999999999n]){
    const p={...policy,ownHolderShareBps:shares[0],partnerHolderShareBps:shares[1],recipientShareBps:shares[2]};
    const s=allocateHolderCycle({}, {policy:p,balance:String(deposit+1000000n),snapshots,now:100000000});
    assert.equal(holderLiabilities(s),deposit);
    assert.equal(Object.values(s.allocatedBySource).reduce((a,b)=>a+BigInt(b),0n),deposit);
    for(const [wallet,amount] of Object.entries(s.credits))assert.equal(['own','partner','recipient'].reduce((a,k)=>a+BigInt(s.creditSources[k][wallet]||0),0n),BigInt(amount));
  }
  const s=allocateHolderCycle({}, {policy,balance:'8000003',snapshots:{own:{holders:[]},partner:{holders:[]}},now:100000000});
  assert.equal(holderLiabilities(s),7000003n);assert.ok(BigInt(s.carryOwn)>0n);assert.ok(BigInt(s.credits[recipientWallet])>0n);
});
test('unknown signed batch is reconciled once, without losing the source breakdown',async()=>{
  let state=allocateHolderCycle({}, {policy,balance:'801000000',snapshots:{own:{holders:[{wallet:recipientWallet,amount:'1'}]},partner:{holders:[{wallet:recipientWallet,amount:'1'}]}},now:100000000});
  let sends=0;
  const args={load:async()=>structuredClone(state),save:async v=>{state=structuredClone(v)},prepare:async()=>({signature:'saved',rawBase64:'AQ==',blockhash:'block',lastValidBlockHeight:10}),connection:{sendRawTransaction:async()=>{sends++;throw Error('unknown')},getSignatureStatus:async()=>({value:{confirmationStatus:'finalized',err:null}})}};
  await settleHolderBatch(args);assert.equal(state.status,'PENDING');assert.equal(state.paidBySource,undefined);
  await settleHolderBatch(args);await settleHolderBatch(args);
  assert.equal(sends,1);assert.equal(state.receiptCount,1);assert.equal(state.receipts[0].payments.length,1);
  assert.deepEqual(state.paidBySource,{own:'300000000',partner:'300000000',recipient:'200000000'});
});
test('old destination totals are unknown and verified per-coin collections do not double count vault funding',()=>{
  const attempt={status:'COMPLETE',tokenMint:key(),devWalletPublicKey:creator,launchUtility:policy,holderAllianceLedger:{paidLamports:'300',credits:{}},allianceDistribution:{receipts:[{signature:'good',accountingStatus:'verified',totalLamports:'1000',payments:[{wallet:creator,lamports:'200'},{wallet:key(),lamports:'800'}]},{signature:'missing'}]}};
  const report=buildLaunchRewardReport(attempt);
  assert.equal(report.collectionTotalLamports,'1000');assert.equal(report.collectionAccountingPending,true);
  assert.equal(report.destinations[0].paidLamports,'200');assert.equal(report.destinations[1].paidLamports,null);
  assert.equal(report.unattributedPaidLamports,'300');assert.equal(report.collectionReceipts[1].totalLamports,null);
});
test('Cashback and legacy programs are not mislabeled as 100% developer allocations',()=>{
  for(const extra of [{pumpCashback:true},{cashback:true},{isCashbackCoin:true},{holderRewards:{enabled:true}},{launchUtility:{mode:'usepaid'}},{launchUtility:{mode:'nft_floor'}},{creatorFeeSplit:[{wallet:key()}]},{creatorFeeRecipient:key()}]){
    const report=buildLaunchRewardReport({status:'COMPLETE',tokenMint:key(),devWalletPublicKey:creator,...extra});
    assert.equal(report.destinations.length,0);assert.equal(report.creatorShareBps,null);assert.equal(report.collectionTotalLamports,null);
  }
});
