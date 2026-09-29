import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { normalizeHolderAlliance, allocateHolderCycle, eligibleHolderBalances, holderLiabilities, HOLDER_CADENCE_MS } from '../src/lib/holderAlliance.js';
import { settleHolderBatch } from '../src/lib/holderAllianceSettlement.js';
import { assertLaunchUtilityReady, utilityRequiresFeeSharing } from '../src/lib/launchUtility.js';
import { HOLDER_ALLIANCE_CONSENT_VERSION } from '../src/lib/holderAlliance.js';
import { launchDraftFingerprint } from '../src/lib/launchUtilityRecovery.js';
const partnerMint=Keypair.generate().publicKey.toBase58();
const a=Keypair.generate().publicKey.toBase58(), b=Keypair.generate().publicKey.toBase58();
const policy={mode:'holder_alliance',partnerMint,creatorShareBps:2000,ownHolderShareBps:4000,partnerHolderShareBps:4000};
test('holder route needs per-launch consent, rejects competing fees, binds every Telegram split field',()=>{
  assert.throws(()=>assertLaunchUtilityReady(policy,{rail:'pump'}),/Review/);
  const reviewed={...policy,consentVersion:HOLDER_ALLIANCE_CONSENT_VERSION};
  assert.equal(assertLaunchUtilityReady(reviewed,{rail:'pump'}).policy.minimumUsd,20);
  assert.equal(utilityRequiresFeeSharing({launchUtility:policy}),true);
  for(const context of [{rail:'robinhood'},{holderRewards:{enabled:true}},{creatorFeeSplit:[{}]},{pumpCashback:true}])assert.throws(()=>assertLaunchUtilityReady(reviewed,context));
  const draft={utilityMode:'holder_alliance'};
  for(const key of ['utilityPartnerMint','utilityCreatorPercent','utilityOwnPercent','utilityHolderPartnerPercent'])assert.notEqual(launchDraftFingerprint(draft,a),launchDraftFingerprint({...draft,[key]:'changed'},a));
});
test('three reviewed shares total exactly 100%; invalid/missing allocations fail',()=>{
  assert.equal(normalizeHolderAlliance(policy).cadenceMs,HOLDER_CADENCE_MS);
  for(const edit of [{creatorShareBps:0},{ownHolderShareBps:4001},{partnerMint:'bad'},{partnerHolderShareBps:NaN}]) assert.throws(()=>normalizeHolderAlliance({...policy,...edit}));
});
test('strictly over $20, aggregated accounts, exact decimals and case-sensitive addresses',()=>{
  const rows=[{wallet:a,amount:'10000000'},{wallet:a,amount:'10000001'},{wallet:b,amount:'20000000'}];
  assert.deepEqual(eligibleHolderBalances(rows,{decimals:6,priceUsd:'1'}),[{wallet:a,amount:'20000001'}]);
  assert.throws(()=>eligibleHolderBalances(rows,{decimals:6,priceUsd:'0'}));
  assert.deepEqual(eligibleHolderBalances([{wallet:a,amount:'2100000000'}],{decimals:6,priceUsd:'1e-2'}),[{wallet:a,amount:'2100000000'}]);
});
test('split new funds proportionally, preserve dust and never reallocate liabilities',()=>{
  const snapshots={own:{holders:[{wallet:a,amount:'1'},{wallet:b,amount:'3'}]},partner:{holders:[{wallet:a,amount:'2'}]}};
  const s=allocateHolderCycle({}, {policy,balance:'1001000000',snapshots,now:100000000});
  assert.equal(s.credits[a],'625000000');assert.equal(s.credits[b],'375000000');
  assert.equal(holderLiabilities(s),1000000000n);
  assert.throws(()=>allocateHolderCycle(s,{policy,balance:'1001000000',snapshots,now:100000001}),/12 hours/);
  const next=allocateHolderCycle(s,{policy,balance:'1001000000',snapshots,now:100000000+HOLDER_CADENCE_MS});
  assert.deepEqual(next.credits,s.credits);
});
test('community with no eligible holders retains its own share, not paid to the other',()=>{
  const s=allocateHolderCycle({}, {policy,balance:'1000011',snapshots:{own:{holders:[]},partner:{holders:[{wallet:a,amount:'1'},{wallet:b,amount:'1'}]}},now:100000000});
  assert.equal(s.carryOwn,'5');assert.equal(s.carryPartner,'0');
  assert.equal(s.credits[a],'3');assert.equal(holderLiabilities(s),11n);
});
function fixture(state={credits:{[a]:'1000000'}}){let stored=structuredClone(state),sent=0;return {get state(){return stored},get sent(){return sent},load:async()=>structuredClone(stored),save:async s=>{stored=structuredClone(s)},prepare:async()=>({signature:'sig',rawBase64:'AQ==',blockhash:'hash',lastValidBlockHeight:10}),connection:{getSignatureStatus:async()=>({value:{confirmationStatus:'finalized',err:null}}),getBlockHeight:async()=>11,sendRawTransaction:async()=>{sent++;return 'sig'},confirmTransaction:async()=>({value:{err:null}})}};}
test('persist intent before sending; finalized receipt debits exactly once',async()=>{
  const f=fixture();await settleHolderBatch(f);assert.equal(f.sent,1);assert.equal(f.state.paidLamports,'1000000');assert.equal(f.state.credits[a],undefined);
  await settleHolderBatch(f);assert.equal(f.sent,1);
});
test('failed persistence prevents transmission',async()=>{
  const f=fixture();await assert.rejects(settleHolderBatch({...f,save:async()=>{throw Error('disk')}}));assert.equal(f.sent,0);
});
test('unknown or confirmed-but-not-finalized payouts never duplicated, including while paused',async()=>{
  const f=fixture({credits:{[a]:'1000000'},pending:{signature:'sig',lastValidBlockHeight:10,rows:[{wallet:a,lamports:'1000000'}]}});
  f.connection.getSignatureStatus=async()=>({value:{confirmationStatus:'confirmed',err:null}});
  await settleHolderBatch({...f,paused:true});assert.equal(f.sent,0);assert.ok(f.state.pending);
  f.connection.getSignatureStatus=async()=>({value:{confirmationStatus:'finalized',err:null}});
  await settleHolderBatch({...f,paused:true});assert.equal(f.state.paidLamports,'1000000');assert.equal(f.sent,0);
});
test('expired unseen intent uses frozen recipients, not a fresh holdings snapshot',async()=>{
  const rows=[{wallet:a,lamports:'1000000'}];const f=fixture({credits:{[a]:'1000000',[b]:'2000000'},pending:{signature:'old',lastValidBlockHeight:10,rows}});
  f.connection.getSignatureStatus=async()=>({value:null});let prepared;
  await settleHolderBatch({...f,prepare:async r=>{prepared=r;return f.prepare()}});
  assert.deepEqual(prepared,rows);assert.equal(f.state.credits[b],'2000000');
});
test('non-finalized failed transactions are not replaced while fork outcome is uncertain',async()=>{
  const f=fixture({credits:{[a]:'1000000'},pending:{signature:'sig',lastValidBlockHeight:10,rows:[{wallet:a,lamports:'1000000'}]}});
  f.connection.getSignatureStatus=async()=>({value:{confirmationStatus:'confirmed',err:{InstructionError:[0,'error']}}});
  await settleHolderBatch(f);assert.equal(f.sent,0);assert.ok(f.state.pending);
});
test('final receipt write failure remains reconcilable without a second send',async()=>{
  const f=fixture();let saves=0;
  await assert.rejects(settleHolderBatch({...f,save:async s=>{if(++saves===2)throw Error('disk');await f.save(s)}}));
  assert.ok(f.state.pending);assert.equal(f.sent,1);
  await settleHolderBatch(f);assert.equal(f.sent,1);assert.equal(f.state.paidLamports,'1000000');
});

test('finalized settlement retains the rotated receipt and per-wallet lifetime history atomically',async()=>{
  const receipts=Array.from({length:100},(_,i)=>({signature:'old-'+i,confirmedAt:'2026-09-01T12:00:00Z',lamports:'1000000',payments:[{wallet:a,lamports:'1000000'}],bySource:{own:'1000000'}}));
  const f=fixture({credits:{[a]:'1000000'},paidLamports:'100000000',paidByWallet:{[a]:'100000000'},receiptCount:100,receipts});
  await settleHolderBatch(f);
  assert.equal(f.state.receipts.length,100);assert.equal(f.state.earningsHistory.events.length,101);
  assert.equal(f.state.earningsHistory.totalLamports,'101000000');assert.equal(f.state.earningsHistory.paidByWallet[a],'101000000');assert.equal(f.state.earningsHistory.incomplete,false);
  await settleHolderBatch(f);assert.equal(f.sent,1);assert.equal(f.state.earningsHistory.events.length,101);
});
