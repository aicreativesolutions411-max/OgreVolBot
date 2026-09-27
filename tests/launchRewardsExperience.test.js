import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { normalizeHolderAlliance, allocateHolderCycle, HOLDER_CADENCE_MS } from '../src/lib/holderAlliance.js';
import { readHolderCommunities } from '../src/lib/holderAllianceSnapshot.js';
import { buildLaunchRewardReport, holderEligibilityReport } from '../src/lib/launchRewardReport.js';
const mint=Keypair.generate().publicKey.toBase58(), wallet=Keypair.generate().publicKey.toBase58();
const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:8000,partnerHolderShareBps:0};
test('own community rewards do not require a second token or query its holders',async()=>{
  const normalized=normalizeHolderAlliance(policy);
  assert.equal(normalized.partnerMint,'');
  const called=[];
  const snapshots=await readHolderCommunities(mint,normalized,{read:async m=>{called.push(m);return {holders:[{wallet,amount:'3'}],capturedAt:Date.now(),slot:123,priceUsd:'1'};}});
  assert.deepEqual(called,[mint]);
  const state=allocateHolderCycle({}, {policy,balance:'1001000000',snapshots,now:100000000});
  assert.equal(state.credits[wallet],'1000000000');
  assert.equal(state.carryPartner,'0');
  assert.equal(state.lastSnapshot.partner,null);
  assert.deepEqual(state.lastEligibility.own,[wallet]);
});
test('unused own community is skipped; active partner requires a verified mint',async()=>{
  const p={...policy,partnerMint:mint,ownHolderShareBps:0,partnerHolderShareBps:8000};
  const called=[];
  await readHolderCommunities('unused',p,{read:async m=>{called.push(m);return {holders:[],capturedAt:Date.now()};}});
  assert.deepEqual(called,[mint]);
  assert.throws(()=>normalizeHolderAlliance({...p,partnerMint:''}));
  assert.throws(()=>normalizeHolderAlliance({...policy,ownHolderShareBps:0}));
  assert.throws(()=>normalizeHolderAlliance({...policy,ownHolderShareBps:7999,partnerHolderShareBps:1}));
});
test('zero-share pools cannot absorb or reassign an old liability',()=>{
  assert.throws(()=>allocateHolderCycle({carryPartner:'1'}, {policy,balance:'1001000000',snapshots:{own:{holders:[]}},now:100000000}),/reserved|allocation/i);
});
test('public reward report exposes only completed launches and confirmed accounting',()=>{
  const attempt={status:'COMPLETE',tokenMint:mint,symbol:'TEST',launchUtility:policy,devWalletPublicKey:wallet,pumpFeeSharing:{status:'ACTIVE',vaultAddress:wallet},holderAllianceLedger:{paidLamports:'25',allocatedLamports:'100',credits:{[wallet]:'75'},lastSnapshotAt:100000000,lastSnapshot:{own:{count:1,priceUsd:'2',slot:3},partner:null},lastEligibility:{own:[wallet],partner:[]},pending:{rawBase64:'SECRET',signature:'pending'},receipts:[{signature:'paid',lamports:'25',recipients:1,confirmedAt:'2026-09-27'}]},secretKey:'SECRET'};
  const report=buildLaunchRewardReport(attempt);
  assert.equal(report.paidLamports,'25');assert.equal(report.owedLamports,'75');
  assert.equal(report.nextSnapshotAt,new Date(100000000+HOLDER_CADENCE_MS).toISOString());
  assert.equal(report.receipts[0].signature,'paid');
  assert.ok(!JSON.stringify(report).includes('SECRET'));
  assert.equal(report.lastEligibility,undefined);assert.equal(report.credits,undefined);
  assert.equal(buildLaunchRewardReport({...attempt,status:'FAILED'}),null);
  const eligible=holderEligibilityReport(attempt,wallet);
  assert.equal(eligible.own,'eligible');assert.equal(eligible.partner,'not_selected');assert.equal(eligible.owedLamports,'75');
  assert.equal(holderEligibilityReport({...attempt,holderAllianceLedger:{}},wallet).own,'unknown');
});
test('creator-only report never invents coin-specific earnings from wallet-wide claims',()=>{
  const report=buildLaunchRewardReport({status:'COMPLETE',tokenMint:mint,creatorFeeClaimMode:'manual',claimedCreatorFeesSol:999});
  assert.equal(report.mode,'creator');assert.equal(report.claimMode,'manual');
  assert.equal(report.paidLamports,null);assert.equal(report.accountingScope,'wallet');
});
