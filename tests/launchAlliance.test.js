import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair, PublicKey } from '@solana/web3.js';
import { normalizeLaunchAlliance, allianceShareholders, allianceConfigMatches, ALLIANCE_CONSENT_VERSION } from '../src/lib/launchAlliance.js';
import { launchUtilityCapabilities, assertLaunchUtilityReady, LAUNCH_UTILITY_CONSENT_VERSION, USEPAID_VERIFIED_TREASURY } from '../src/lib/launchUtility.js';
const creator = Keypair.generate().publicKey;
const partner = Keypair.generate().publicKey;
const policy = { mode:'alliance', partnerWallet:partner.toBase58(), partnerName:'Nightshift community', partnerShareBps:3000, consentVersion:ALLIANCE_CONSENT_VERSION };

test('unavailable X cash routing stays blocked even with legacy production env enabled', () => {
  const env = { USEPAID_ROUTING_ENABLED:'true', USEPAID_TREASURY_SOLANA:USEPAID_VERIFIED_TREASURY, USEPAID_TERMS_REVIEWED_VERSION:LAUNCH_UTILITY_CONSENT_VERSION };
  assert.equal(launchUtilityCapabilities(env).usepaid.available,false);
  assert.throws(()=>assertLaunchUtilityReady({mode:'usepaid',xHandle:'alice',consentVersion:LAUNCH_UTILITY_CONSENT_VERSION},{rail:'pump'},env),/unavailable|paused|disabled/i);
});
test('alliance policies normalize exact wallets and integer creator fee shares', () => {
  const p=normalizeLaunchAlliance(policy);
  assert.equal(p.partnerShareBps,3000);
  const recipients=allianceShareholders(p,creator);
  assert.deepEqual(recipients.map(r=>r.shareBps),[7000,3000]);
  assert.ok(recipients[0].address.equals(creator));
  assert.ok(recipients[1].address.equals(partner));
});
test('alliance fails closed on invalid or duplicate destinations and shares', () => {
  for(const partnerShareBps of [0,10000,10001,-1,1.5,NaN])assert.throws(()=>normalizeLaunchAlliance({...policy,partnerShareBps}),/share/i);
  for(const partnerWallet of ['', 'invalid',PublicKey.default.toBase58()])assert.throws(()=>normalizeLaunchAlliance({...policy,partnerWallet}),/wallet/i);
  assert.throws(()=>allianceShareholders({...policy,partnerWallet:creator.toBase58()},creator),/different/i);
});
test('alliance verification matches every on-chain recipient, share, mint profile and finalization', () => {
  const shareholders=allianceShareholders(policy,creator);
  const config={finalized:true,shareholders};
  assert.equal(allianceConfigMatches(config,policy,creator),true);
  assert.equal(allianceConfigMatches({...config,finalized:false},policy,creator),false);
  assert.equal(allianceConfigMatches({...config,shareholders:[...shareholders,{address:Keypair.generate().publicKey,shareBps:1}]},policy,creator),false);
  assert.equal(allianceConfigMatches({...config,shareholders:shareholders.map(r=>({...r,shareBps:r.shareBps+1}))},policy,creator),false);
});
test('alliance requires explicit consent and excludes competing reward promises', () => {
  assert.equal(assertLaunchUtilityReady(policy,{rail:'pump'}).policy.mode,'alliance');
  assert.throws(()=>assertLaunchUtilityReady({...policy,consentVersion:''},{rail:'pump'}),/review|confirm/i);
  for(const context of [{rail:'robinhood'},{rail:'meteora'},{holderRewards:{enabled:true}},{pumpCashback:true},{creatorFeeSplit:[{pct:20}]},{feeMode:'burn'}])assert.throws(()=>assertLaunchUtilityReady(policy,context),/Pump|combine|share/i);
});
