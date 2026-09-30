import test from 'node:test';
import assert from 'node:assert/strict';
import { checkFlowReadiness } from '../src/lib/slimeFlowReadiness.js';

const attempt = () => ({id:'owned',status:'COMPLETE',tokenMint:'mint',devWalletPublicKey:'creator',pumpFeeSharing:{status:'ACTIVE',vaultAddress:'vault'},launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:8000,partnerHolderShareBps:0,autoDistribute:true},holderAllianceLedger:{credits:{recipient:'2000000'}},slimeFlow:{draft:{minimumLamports:'1000000'}}});
const deps = () => ({enabled:false,now:()=>100000,readRuntime:async()=>({runner:true,lock:true,creatorKey:true,vaultKey:true}),readChain:async()=>({configMatches:true,accountsValid:true,slot:123,vaultLamports:'100000000',creatorLamports:'10000000'}),readSnapshots:async()=>({own:{slot:123,capturedAt:100000,holders:[{wallet:'private-holder',amount:'1'}]},partner:null})});

test('readiness reports real prerequisites but never equates them to funded validation',async()=>{
  const r=await checkFlowReadiness(attempt(),deps());
  assert.equal(r.ready,false);assert.equal(r.readOnly,true);assert.equal(r.fundedValidationPerformed,false);
  assert.equal(r.checks.find(c=>c.id==='release').state,'blocked');
  assert.equal(r.checks.find(c=>c.id==='vault').state,'pass');
  assert.equal(r.balances.unreservedLamports,'97000000');
  assert.ok(!JSON.stringify(r).includes('private-holder'));
});
test('provider failures stay unknown and redact raw exception URLs and secrets',async()=>{
  const d=deps();d.readChain=async()=>{throw Error('403 https://rpc.test/SECRET?api-key=KEY')};
  const r=await checkFlowReadiness(attempt(),d);assert.equal(r.ready,false);
  assert.equal(r.checks.find(c=>c.id==='chain').state,'unknown');
  assert.doesNotMatch(JSON.stringify(r),/SECRET|api-key|rpc.test/);
});
test('short vaults, unavailable signing records and pending transactions block readiness',async()=>{
  const a=attempt();a.holderAllianceLedger.pending={signature:'pending',rawBase64:'SECRET'};
  const d=deps();d.enabled=true;d.readRuntime=async()=>({runner:true,lock:false,creatorKey:false,vaultKey:true});d.readChain=async()=>({configMatches:true,accountsValid:true,slot:123,vaultLamports:'1',creatorLamports:'1'});
  const r=await checkFlowReadiness(a,d);assert.equal(r.ready,false);
  for(const id of ['lock','creator_key','pending','vault','network_fees'])assert.equal(r.checks.find(c=>c.id===id).state,'blocked',id);
  assert.doesNotMatch(JSON.stringify(r),/SECRET/);
});
test('mismatched config, invalid balances and incomplete holder data fail closed',async()=>{
  for(const patch of [{configMatches:false},{vaultLamports:'1.2'},{vaultLamports:'-1'},{slot:NaN},{accountsValid:false}]){
    const d=deps(),read=d.readChain;d.enabled=true;d.readChain=async()=>({...await read(),...patch});
    assert.equal((await checkFlowReadiness(attempt(),d)).ready,false);
  }
  const d=deps();d.enabled=true;d.readSnapshots=async()=>({own:{slot:123,capturedAt:100000},partner:null});
  assert.equal((await checkFlowReadiness(attempt(),d)).checks.find(c=>c.id==='holders').state,'unknown');
});
test('valid prerequisite checks allow readiness only when release gate is separately enabled',async()=>{
  const d=deps();d.enabled=true;const r=await checkFlowReadiness(attempt(),d);
  assert.equal(r.ready,true);assert.equal(r.fundedValidationPerformed,false);
  assert.equal(r.checks.find(c=>c.id==='holders').state,'pass');
  assert.ok(r.checks.some(c=>c.detail.includes('not a security audit')));
});
test('unsupported coins are rejected before any external reads',async()=>{
  let reads=0;const d=deps();d.readChain=async()=>{reads++;};
  await assert.rejects(checkFlowReadiness({...attempt(),status:'SUBMITTED'},d),/active managed/);
  assert.equal(reads,0);
});
test('old snapshots and unconfirmed config cannot become green checks',async()=>{
  const d=deps();d.enabled=true;d.readSnapshots=async()=>({own:{slot:123,capturedAt:1,holders:[]}});
  assert.equal((await checkFlowReadiness(attempt(),d)).ready,false);
});
