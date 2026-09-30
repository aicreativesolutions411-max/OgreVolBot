import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { normalizeFlow, flowPolicyHash, evaluateFlow, previewFlow, createSlimeFlows, flowCapabilities, flowScheduleSummary, publicFlow } from '../src/lib/slimeFlows.js';
import { allocateHolderCycle, holderLiabilities } from '../src/lib/holderAlliance.js';

const wallet=Keypair.generate().publicKey.toBase58(),mint=Keypair.generate().publicKey.toBase58();
const recipient=Keypair.generate().publicKey.toBase58();
const definition={name:'Community fund',trigger:{type:'schedule',hours:24},conditions:{minimumSol:'0.1',maximumSol:'1'},actions:['allocate_rewards','settle_rewards']};
const attempt=()=>({id:'launch-1',userId:'alice',status:'COMPLETE',tokenMint:mint,devWalletPublicKey:wallet,pumpFeeSharing:{status:'ACTIVE',vaultAddress:recipient,configAddress:'config'},launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:8000,partnerHolderShareBps:0,autoDistribute:true},holderAllianceLedger:{}});
const NOW=Date.parse('2026-09-29T12:00:00Z');
function fixture({enabled=true,readiness}={}){let record=attempt(),time=NOW,tail=Promise.resolve();const service=createSlimeFlows({enabled,readiness,now:()=>time,attempts:async()=>[structuredClone(record)],load:async id=>id===record.id?structuredClone(record):null,save:async patch=>{record={...record,...structuredClone(patch)};},wallets:async user=>user==='alice'?[{publicKey:wallet}]:[],lock:async(mint,fn)=>{const p=tail.then(fn);tail=p.catch(()=>{});return p;}});return {service,get record(){return record},set record(v){record=v},advance:ms=>time+=ms};}
async function active(f){await f.service.saveDraft('alice',{attemptId:'launch-1',revision:0,definition});const r=await f.service.review('alice',{attemptId:'launch-1',revision:1});return f.service.activate('alice',{attemptId:'launch-1',revision:1,reviewHash:r.review.hash,acknowledge:true});}

test('flow schema uses exact units and rejects unknown actions, triggers, unsafe values and unknown fields',()=>{
  const d=normalizeFlow(definition);assert.equal(d.minimumLamports,'100000000');assert.equal(d.maximumLamports,'1000000000');
  for(const change of [{trigger:{type:'schedule',hours:1}},{trigger:{type:'webhook',url:'http://localhost'}},{conditions:{minimumSol:'1e2',maximumSol:'3'}},{conditions:{minimumSol:'2',maximumSol:'1'}},{actions:['arbitrary_code']},{actions:['settle_rewards','allocate_rewards']},{actions:['allocate_rewards','allocate_rewards']},{name:'',trigger:definition.trigger},{privateKey:'secret'}])assert.throws(()=>normalizeFlow({...definition,...change}));
});
test('policy fingerprint includes recipients, creator, coin and permanent split',()=>{
  const a=attempt();for(const b of [{...a,tokenMint:recipient},{...a,devWalletPublicKey:recipient},{...a,pumpFeeSharing:{...a.pumpFeeSharing,vaultAddress:wallet}},{...a,launchUtility:{...a.launchUtility,creatorShareBps:3000,ownHolderShareBps:7000}}])assert.notEqual(flowPolicyHash(a),flowPolicyHash(b));
});
test('dry run uses hypothetical input, no balance lookup or money movement, includes limits and split',()=>{
  const p=previewFlow(attempt(),definition,'2');assert.equal(p.simulated,true);assert.equal(p.allocatedLamports,'1000000000');assert.equal(p.retainedLamports,'1000000000');assert.equal(p.destinations[0].lamports,'1000000000');assert.match(p.note,/developer/i);
  assert.equal(previewFlow(attempt(),definition,'0.01').allocatedLamports,'0');
});
test('review then activate, durable revisions and ownership; no draft activates itself',async()=>{
  const f=fixture();const draft=await f.service.saveDraft('alice',{attemptId:'launch-1',revision:0,definition});assert.equal(draft.flow.state,'DRAFT');assert.equal(f.record.slimeFlow.approved,undefined);
  await assert.rejects(f.service.review('bob',{attemptId:'launch-1',revision:1}),/owned/);
  await assert.rejects(f.service.saveDraft('alice',{attemptId:'launch-1',revision:0,definition}),/changed/);
  const reviewed=await f.service.review('alice',{attemptId:'launch-1',revision:1});
  await assert.rejects(f.service.activate('alice',{attemptId:'launch-1',revision:1,reviewHash:reviewed.review.hash}),/acknowledge/i);
  await f.service.activate('alice',{attemptId:'launch-1',revision:1,reviewHash:reviewed.review.hash,acknowledge:true});assert.equal(f.record.slimeFlow.state,'ACTIVE');
  await f.service.activate('alice',{attemptId:'launch-1',revision:1,reviewHash:reviewed.review.hash,acknowledge:true});assert.equal(f.record.slimeFlow.history.filter(e=>e.type==='activated').length,1);
});
test('review expiry and changed financial terms prevent activation',async()=>{
  for(const mutate of [f=>f.advance(11*60000),f=>{f.record={...f.record,devWalletPublicKey:recipient};},f=>{f.record.slimeFlow.review.expiresAt='invalid';}]){const f=fixture();await f.service.saveDraft('alice',{attemptId:'launch-1',revision:0,definition});const r=await f.service.review('alice',{attemptId:'launch-1',revision:1});mutate(f);await assert.rejects(f.service.activate('alice',{attemptId:'launch-1',revision:1,reviewHash:r.review.hash,acknowledge:true}));}
});
test('unvalidated deployment allows draft and simulation but fails closed on activation',async()=>{
  const f=fixture({enabled:false});await assert.rejects(active(f),/validation/);assert.equal(f.record.slimeFlow.approved,undefined);assert.equal(flowCapabilities(false).activation.available,false);
});
test('schedule, pause and changed terms block new allocation; old credits remain independent',async()=>{
  const f=fixture();await active(f);let a=f.record;a.holderAllianceLedger={lastSnapshotAt:NOW-12*3600000,credits:{[wallet]:'2000000'}};
  assert.equal(evaluateFlow(a,{now:NOW,availableLamports:'2000000000'}).reason,'schedule');
  a.holderAllianceLedger.lastSnapshotAt=NOW-24*3600000;assert.equal(evaluateFlow(a,{now:NOW,availableLamports:'2000000000'}).allocationLimitLamports,'1000000000');
  assert.equal(evaluateFlow(a,{now:NOW,availableLamports:'1000000'}).reason,'minimum');
  a.slimeFlow.state='PAUSED';assert.equal(evaluateFlow(a,{now:NOW}).reason,'paused');assert.equal(a.holderAllianceLedger.credits[wallet],'2000000');
  a.slimeFlow.state='ACTIVE';a.launchUtility.ownHolderShareBps=7900;a.launchUtility.creatorShareBps=2100;assert.equal(evaluateFlow(a,{now:NOW}).reason,'terms_changed');
});
test('editing active program keeps approved version until a fresh explicit review',async()=>{
  const f=fixture();await active(f);const approved=f.record.slimeFlow.approved;
  await f.service.saveDraft('alice',{attemptId:'launch-1',revision:1,definition:{...definition,trigger:{type:'schedule',hours:48}}});
  assert.deepEqual(f.record.slimeFlow.approved,approved);assert.equal(f.record.slimeFlow.state,'ACTIVE');
});
test('capped allocation preserves liabilities and unallocated vault funds exactly',()=>{
  const a=attempt(),snapshots={own:{holders:[{wallet,amount:'1'}]}};
  const prior={credits:{[wallet]:'200000000'},creditSources:{own:{[wallet]:'200000000'}}};
  const result=allocateHolderCycle(prior,{policy:a.launchUtility,balance:'2201000000',snapshots,now:NOW,allocationLimitLamports:'1000000000'});
  assert.equal(holderLiabilities(result),1200000000n);assert.equal(result.lastSnapshot.newLamports,'1000000000');
  assert.throws(()=>allocateHolderCycle({}, {policy:a.launchUtility,balance:'2000000000',snapshots,now:NOW,allocationLimitLamports:'-1'}),/limit/);
});
test('concurrent draft saves reject stale revision rather than silently overwrite',async()=>{
  const f=fixture();const values=await Promise.allSettled([1,2].map(()=>f.service.saveDraft('alice',{attemptId:'launch-1',revision:0,definition})));assert.equal(values.filter(v=>v.status==='fulfilled').length,1);
});

test('schedule reporting honors deployment activation gate and preserves approved cadence',async()=>{
  const f=fixture();await active(f);
  assert.deepEqual(flowScheduleSummary(f.record,{enabled:false}),{cadenceHours:24,paused:true,program:true});
  assert.deepEqual(flowScheduleSummary(f.record,{enabled:true}),{cadenceHours:24,paused:false,program:true});
  for(const field of ['not-a-date',-1,1.5])assert.equal(evaluateFlow({...f.record,holderAllianceLedger:{lastSnapshotAt:field}}).reason,'invalid_program');
  assert.equal(evaluateFlow({...f.record,status:'SUBMITTED'}).reason,'invalid_program');
});

test('owned program projection excludes transaction bytes, keys and full payout liabilities',async()=>{
  const f=fixture();await active(f);f.record.vaultPrivateKey='DO_NOT_EXPOSE';
  f.record.holderAllianceLedger={credits:{[wallet]:'4000000'},pending:{rawBase64:'DO_NOT_EXPOSE'},receipts:[{signature:'public-signature',rawBase64:'DO_NOT_EXPOSE',lamports:'1000000',payments:[{wallet,lamports:'1000000'}]}]};
  const projected=publicFlow(f.record);assert.ok(!JSON.stringify(projected).includes('DO_NOT_EXPOSE'));
  assert.equal(projected.receipts[0].signature,'public-signature');assert.equal(projected.credits,undefined);assert.equal(projected.receipts[0].payments,undefined);
});

test('live prerequisite checks require ownership, coalesce clicks and do not mutate state',async()=>{
  let calls=0;const f=fixture({readiness:async()=>{calls++;return {readOnly:true,ready:false};}}),before=structuredClone(f.record);
  await assert.rejects(f.service.readiness('bob',{attemptId:'launch-1'}),/owned/);assert.equal(calls,0);
  const r=await Promise.all([1,2,3].map(()=>f.service.readiness('alice',{attemptId:'launch-1'})));
  assert.equal(calls,1);assert.equal(r[0].readOnly,true);assert.deepEqual(f.record,before);
  f.advance(60001);await f.service.readiness('alice',{attemptId:'launch-1'});assert.equal(calls,2);
});
test('readiness rejects concurrent changed terms and does not reuse reports for a changed coin',async()=>{
  let finish;const f=fixture({readiness:()=>new Promise(r=>{finish=r;})});
  const check=f.service.readiness('alice',{attemptId:'launch-1'});await new Promise(r=>setImmediate(r));
  f.record={...f.record,updatedAt:'changed'};finish({readOnly:true,ready:true});
  await assert.rejects(check,/changed/);
  await assert.rejects(f.service.readiness('alice',{attemptId:'launch-1'}),/one minute/);
});
