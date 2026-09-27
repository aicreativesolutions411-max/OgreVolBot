import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Keypair,PublicKey,SystemProgram,Transaction} from '@solana/web3.js';
import bs58 from 'bs58';
import {allianceShareholders,allianceConfigMatches,ALLIANCE_CONSENT_VERSION} from '../src/lib/launchAlliance.js';
import {assertLaunchUtilityReady} from '../src/lib/launchUtility.js';
import {settleLaunchAlliance} from '../src/lib/launchAllianceSettlement.js';
import {feeSetupSubmissionDisposition} from '../src/lib/launchUtilityRecovery.js';
import {pumpFeeSharingSetupFundingTarget} from '../src/lib/pumpRewardDurability.js';
import {normalizeHolderAlliance,allocateHolderCycle,HOLDER_CADENCE_MS,HOLDER_MIN_PAYOUT,HOLDER_VAULT_RESERVE,HOLDER_ALLIANCE_CONSENT_VERSION} from '../src/lib/holderAlliance.js';
import {settleHolderBatch} from '../src/lib/holderAllianceSettlement.js';
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const code=source.slice(source.indexOf('async function reconcileLaunchAlliance('),source.indexOf('function pumpHolderRewardEffectiveShareBps('));

// Evaluate only the two application functions with fully offline dependencies.
// Never import/start the bot or use a funded/network wallet in tests.
function fixture({auto=true,active=true}={}) {
  const creator=Keypair.generate(),partnerSigner=Keypair.generate(),partner=partnerSigner.publicKey,mint=Keypair.generate().publicKey,configAddress=Keypair.generate().publicKey;
  let record={id:'attempt',userId:'owner',tokenMint:mint.toBase58(),devWalletPublicKey:creator.publicKey.toBase58(),launchUtility:{mode:'alliance',partnerName:'Community',partnerWallet:partner.toBase58(),partnerShareBps:3000,autoDistribute:auto,consentVersion:ALLIANCE_CONSENT_VERSION},pumpFeeSharing:{status:active?'ACTIVE':'PENDING_SETUP'}};
  let config={exists:active,finalized:active,address:configAddress,shareholders:active?allianceShareholders(record.launchUtility,creator.publicKey):[]};
  const calls={sends:0,setup:0,balances:0,resume:0,locks:[]};
  const connection={
    getAccountInfo:async()=>null,
    getMinimumBalanceForRentExemption:async()=>2000000,
    getBalance:async()=>100000000,
    getLatestBlockhash:async()=>({blockhash:Keypair.generate().publicKey.toBase58(),lastValidBlockHeight:100}),
    getFeeForMessage:async()=>({value:5000}),
    sendRawTransaction:async bytes=>{calls.sends++;return bs58.encode(Transaction.from(bytes).signature);},
    confirmTransaction:async()=>({value:{err:null}}),
    getSignatureStatus:async()=>({value:{confirmationStatus:'confirmed'}})
  };
  const context={connection,Keypair,PublicKey,SystemProgram,Transaction,bs58,Buffer,allianceShareholders,allianceConfigMatches,assertLaunchUtilityReady,settleLaunchAlliance,pumpFeeSharingSetupFundingTarget,
    normalizeHolderAlliance,allocateHolderCycle,HOLDER_CADENCE_MS,HOLDER_MIN_PAYOUT,HOLDER_VAULT_RESERVE,settleHolderBatch,
    pumpHolderRewardVaultWallet:async()=>({keypair:partnerSigner}),
    readHolderSnapshot:async()=>({slot:100,priceUsd:'1',capturedAt:Date.now(),holders:[{wallet:creator.publicKey.toBase58(),amount:'1'}]}),
    PUMP_HOLDER_REWARD_CONFIG_RENT_SPACE:1024,
    LockService:{withLock:async(key,_ttl,fn)=>{calls.locks.push(key);return fn();}},
    withMoneyCacheLock:async(key,_ttl,fn)=>{calls.locks.push(key);return fn();},
    pumpFeeSharingAttemptId:a=>a.id,pumpFeeSharingMint:a=>a.tokenMint,
    freshPumpFeeSharingAttempt:async()=>record,
    readPumpFeeSharingConfig:async()=>config,
    launchUtilityPublic:a=>a,
    patchPumpFeeSharingState:async(_id,patch)=>{record={...record,pumpFeeSharing:{...record.pumpFeeSharing,...patch}};return record;},
    upsertPumpLaunchAttempt:async patch=>{record={...record,...patch};},
    resumeLaunchBundleInvitesAfterFeeSharing:async()=>{calls.resume++;},
    resumePumpPostLaunchBuysAfterFeeSharing:async()=>{calls.resume++;},
    pumpFeeSharingInitialCreatorConfig:c=>c.editable===true,
    pumpFeeSharingSubmissionDisposition:state=>feeSetupSubmissionDisposition(state,connection),
    readWalletStore:async()=>({}),walletsForOwner:()=>[{publicKey:creator.publicKey.toBase58()}],decryptWallet:()=>creator,
    getPumpFeeSharingAddresses:()=>({sharingConfig:configAddress,canonicalPool:Keypair.generate().publicKey}),
    buildPumpFeeSharingCreateConfigInstruction:async()=>({step:'create'}),
    buildPumpFeeSharingOneTimeUpdateInstruction:async args=>{assert.equal(args.holderRewardsVault,partner.toBase58());assert.equal(args.holderRewardsShareBps,3000);return {step:'split'};},
    submitPumpFeeSharingSetupTransaction:async({instructions})=>{calls.setup++;assert.equal(instructions.length,2);config={exists:true,finalized:true,address:configAddress,shareholders:allianceShareholders(record.launchUtility,creator.publicKey)};},
    getPumpRewardBalances:async({wallet})=>{assert.ok(wallet.equals(configAddress),'fees must be per-coin, not wallet-wide');calls.balances++;return {creator:{totalAtomic:'10000000'}};},
    buildPumpFeeSharingDistributionInstructions:async()=>({sharingConfig:config,instructions:[SystemProgram.transfer({fromPubkey:creator.publicKey,toPubkey:partner,lamports:1})]}),
    audit:async()=>{}
  };
  const sandbox=vm.createContext(context);vm.runInContext(code,sandbox);
  return {creator,partner,connection,calls,context:sandbox,get record(){return record;},set record(value){record=value;},set config(value){config=value;},get config(){return config;},setup:()=>sandbox.reconcileLaunchAlliance(record),distribute:options=>sandbox.distributeLaunchAlliance(record,options)};
}

test('actual Alliance setup verifies exact on-chain shares before resuming buys and never repeats finalized setup',async()=>{
  const f=fixture({active:false});
  await f.setup();assert.equal(f.record.pumpFeeSharing.status,'ACTIVE');assert.equal(f.calls.setup,1);assert.equal(f.calls.resume,2);
  await f.setup();assert.equal(f.calls.setup,1);
});

function holderFixture(){
  const f=fixture();f.record={...f.record,launchUtility:normalizeHolderAlliance({mode:'holder_alliance',partnerMint:Keypair.generate().publicKey.toBase58(),creatorShareBps:2000,ownHolderShareBps:4000,partnerHolderShareBps:4000,consentVersion:HOLDER_ALLIANCE_CONSENT_VERSION}),pumpFeeSharing:{...f.record.pumpFeeSharing,vaultAddress:f.partner.toBase58()},allianceDistribution:{lastCheckedAt:new Date().toISOString()}};
  f.config={...f.config,shareholders:allianceShareholders({partnerWallet:f.partner.toBase58(),partnerShareBps:8000},f.creator.publicKey)};
  f.connection.getBalance=async key=>key.equals(f.partner)?9000000:100000000;
  return f;
}
test('actual holder integration pays both community allocations once and respects 12-hour cadence',async()=>{
  const f=holderFixture();await f.distribute({force:true});assert.equal(f.calls.sends,1);assert.equal(f.record.holderAllianceLedger.paidLamports,'8000000');
  assert.equal(f.record.holderAllianceLedger.lastSnapshot.own.count,1);assert.equal(f.record.holderAllianceLedger.lastSnapshot.partner.count,1);
  await f.distribute({force:true});assert.equal(f.calls.sends,1,'manual refresh must not create an early snapshot');
});
test('actual holder integration fails closed before allocation when either snapshot fails',async()=>{
  const f=holderFixture();let calls=0;f.context.readHolderSnapshot=async()=>{if(++calls===2)throw Error('incomplete partner');return {holders:[{wallet:f.creator.publicKey.toBase58(),amount:'1'}],capturedAt:Date.now()};};
  await assert.rejects(f.distribute(),/incomplete partner/);assert.equal(f.calls.sends,0);assert.equal(f.record.holderAllianceLedger,undefined);
});
test('actual holder integration pause preserves credits and prevents new signing',async()=>{
  const f=holderFixture();f.record={...f.record,holderAllianceLedger:{credits:{[f.creator.publicKey.toBase58()]:'2000000'}}};
  await f.context.setAllianceDistributionPaused(f.record,true);await f.distribute({force:true});assert.equal(f.calls.sends,0);assert.equal(f.record.holderAllianceLedger.credits[f.creator.publicKey.toBase58()],'2000000');
  await f.context.setAllianceDistributionPaused(f.record,false);await f.distribute();assert.equal(f.calls.sends,1);
});
test('actual holder fee setup uses the unique vault for the combined holder share before enabling buys',async()=>{
  const f=holderFixture();f.record={...f.record,pumpFeeSharing:{...f.record.pumpFeeSharing,status:'PENDING_SETUP'}};f.config={...f.config,exists:false,finalized:false,shareholders:[]};
  let ensured=0,built=0;
  f.context.ensurePumpHolderRewardVault=async()=>{ensured++;};
  f.context.buildPumpFeeSharingOneTimeUpdateInstruction=async args=>{built++;assert.equal(args.holderRewardsVault,f.partner.toBase58());assert.equal(args.holderRewardsShareBps,8000);return {};};
  f.context.submitPumpFeeSharingSetupTransaction=async()=>{f.config={...f.config,exists:true,finalized:true,shareholders:allianceShareholders({partnerWallet:f.partner.toBase58(),partnerShareBps:8000},f.creator.publicKey)};};
  await f.setup();assert.equal(ensured,1);assert.equal(built,1);assert.equal(f.record.pumpFeeSharing.status,'ACTIVE');assert.equal(f.calls.resume,2);
});
test('actual Alliance setup refuses conflicting shares, untrusted recipient accounts and missing rent',async()=>{
  const conflict=fixture({active:false});conflict.config={...conflict.config,exists:true,finalized:true,shareholders:[]};await conflict.setup();assert.equal(conflict.record.pumpFeeSharing.status,'CONFLICT');assert.equal(conflict.calls.setup,0);
  const bad=fixture({active:false});bad.connection.getAccountInfo=async()=>({owner:Keypair.generate().publicKey,executable:true});await assert.rejects(bad.setup(),/normal SOL wallet/);assert.equal(bad.calls.setup,0);
  const low=fixture({active:false});low.connection.getBalance=async()=>0;await low.setup();assert.equal(low.record.pumpFeeSharing.status,'SETUP_NEEDS_FUNDING');assert.equal(low.calls.setup,0);assert.equal(low.calls.resume,0);
});
test('actual Alliance setup does not resign an unknown transaction',async()=>{
  const f=fixture({active:false});f.record={...f.record,pumpFeeSharing:{status:'PENDING_SETUP',setupSignature:'unknown',setupLastValidBlockHeight:100}};f.connection.getSignatureStatus=async()=>{throw Error('offline');};await f.setup();assert.equal(f.calls.setup,0);
});
test('actual distribution uses per-coin fees and checks the daily cadence before RPC or signing',async()=>{
  const f=fixture();await f.distribute();assert.equal(f.calls.sends,1);assert.equal(f.record.allianceDistribution.receipts.length,1);
  await f.distribute();await f.distribute({force:true});assert.equal(f.calls.sends,1);assert.equal(f.calls.balances,1);
  const manual=fixture({auto:false});await manual.distribute();assert.equal(manual.calls.balances,0);await manual.distribute({force:true});assert.equal(manual.calls.sends,1);
});
test('actual distribution fails closed on shares, fee estimates, insufficient payer balance and tiny accruals',async()=>{
  const changed=fixture();changed.config={...changed.config,shareholders:[]};await assert.rejects(changed.distribute(),/shares differ/);assert.equal(changed.calls.sends,0);
  for(const value of [null,100001,-1]){const f=fixture();f.connection.getFeeForMessage=async()=>({value});await assert.rejects(f.distribute(),/fee is unavailable/);assert.equal(f.calls.sends,0);}
  const poor=fixture();poor.connection.getBalance=async()=>3000000;await assert.rejects(poor.distribute(),/network fees/);assert.equal(poor.calls.sends,0);
  const tiny=fixture();tiny.context.getPumpRewardBalances=async()=>({creator:{totalAtomic:'999999'}});await tiny.distribute();assert.equal(tiny.record.allianceDistribution.status,'ACCUMULATING');assert.equal(tiny.calls.sends,0);
});

test('daily payout pause survives reload and cannot enable an unapproved automatic schedule',async()=>{
  const f=fixture();await f.context.setAllianceDistributionPaused(f.record,true);await f.distribute();assert.equal(f.calls.sends,0);assert.equal(f.record.allianceDistribution.automaticPaused,true);
  await f.context.setAllianceDistributionPaused(f.record,false);await f.distribute();assert.equal(f.calls.sends,1);
  const manual=fixture({auto:false});await assert.rejects(manual.context.setAllianceDistributionPaused(manual.record,false),/did not authorize/);
});
test('paused daily payouts reconcile pending confirmation without replacing expired transactions',async()=>{
  const confirmed=fixture();confirmed.record={...confirmed.record,allianceDistribution:{automaticPaused:true,pending:{signature:'saved',lastValidBlockHeight:100}}};
  await confirmed.distribute();assert.equal(confirmed.record.allianceDistribution.receipts[0].signature,'saved');assert.equal(confirmed.calls.sends,0);
  const expired=fixture();expired.record={...expired.record,allianceDistribution:{automaticPaused:true,pending:{signature:'expired',lastValidBlockHeight:100}}};
  expired.connection.getSignatureStatus=async()=>({value:null});expired.connection.getBlockHeight=async()=>101;
  await expired.distribute();assert.equal(expired.calls.sends,0);assert.equal(expired.calls.balances,0);assert.equal(expired.record.allianceDistribution.pending,null);assert.equal(expired.record.allianceDistribution.automaticPaused,true);
});
test('launch integration reserves Alliance setup costs, gates every buy, and requires owned payout requests',()=>{
  assert.ok(source.includes('requiredBufferSol: CONFIG.pumpLaunchRequiredBufferSol + allianceSetupReserveSol'));
  assert.ok(source.includes('normalizeHolderRewardPolicy(basePayload.holderRewards).enabled || utilityRequiresFeeSharing({ launchUtility })'));
  assert.ok(source.includes('launchHolderRewardsFromAttempt(attempt).enabled || utilityRequiresFeeSharing(attempt)'));
  const route=source.slice(source.indexOf('pathname === "/api/web/launch/utility/retry"'),source.indexOf('pathname === "/api/web/launch/claim-fees"'));
  assert.ok(route.indexOf('String(attempt.userId) !== String(auth.userId)')<route.indexOf('distributeLaunchAlliance'));
  const telegram=source.slice(source.indexOf('if (data.startsWith("lb_alliance_daily:"))'),source.indexOf('if (data.startsWith("lb_alliance_pay:"))'));
  assert.ok(telegram.indexOf('String(attempt.userId) !== String(userId)')<telegram.indexOf('setAllianceDistributionPaused'));
});
