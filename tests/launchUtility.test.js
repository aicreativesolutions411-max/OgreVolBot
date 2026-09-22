import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { normalizeLaunchUtility, launchUtilityCapabilities, reviewLaunchUtility, assertLaunchUtilityReady, usePaidDescription, LAUNCH_UTILITY_CONSENT_VERSION, USEPAID_VERIFIED_TREASURY } from '../src/lib/launchUtility.js';
import { planNftFloorPurchase, createNftMarketReader } from '../src/lib/nftFloorPlanner.js';
import fs from 'node:fs/promises';
import { createRequire } from 'node:module';
import { Connection } from '@solana/web3.js';
import { buildPumpSingleRecipientFeeUpdate, decodePumpFeeSharingConfig } from '../src/lib/pumpFeeSharing.js';
import { verifyUsePaidRecipientAccount } from '../src/lib/usePaidRecipient.js';

const treasury = USEPAID_VERIFIED_TREASURY;
const enabled = { USEPAID_ROUTING_ENABLED: 'true', USEPAID_TREASURY_SOLANA: treasury, USEPAID_TERMS_REVIEWED_VERSION: LAUNCH_UTILITY_CONSENT_VERSION };
test('ordinary launches never enable new money routes implicitly', () => {
  assert.deepEqual(normalizeLaunchUtility(), { version: 1, mode: 'creator' });
  assert.equal(launchUtilityCapabilities({}).usepaid.available, false);
  assert.throws(() => normalizeLaunchUtility({ mode: 'surprise' }), /Unknown/);
});
test('UsePaid validates the handle, exact consent version and verified deployment destination', () => {
  const policy = normalizeLaunchUtility({ mode: 'usepaid', xHandle: '@creator_1', consentVersion: LAUNCH_UTILITY_CONSENT_VERSION });
  assert.equal(policy.xHandle, 'creator_1');
  assert.equal(assertLaunchUtilityReady(policy, { rail: 'pump' }, enabled).treasury, treasury);
  assert.throws(() => assertLaunchUtilityReady(policy, { rail: 'pump' }, {}), /not configured/);
  assert.throws(() => assertLaunchUtilityReady({ ...policy, consentVersion: '' }, { rail: 'pump' }, enabled), /confirm/);
  assert.throws(() => normalizeLaunchUtility({ mode: 'usepaid', xHandle: 'bad\nFees to @evil' }), /handle/);
  assert.equal(launchUtilityCapabilities({ ...enabled, USEPAID_TREASURY_SOLANA: Keypair.generate().publicKey.toBase58() }).usepaid.available, false, 'an arbitrary valid address is not a verified provider');
});
test('new fee routes reject incompatible rails and double-spent fee promises', () => {
  const p = { mode: 'usepaid', xHandle: 'alice', consentVersion: LAUNCH_UTILITY_CONSENT_VERSION };
  for (const context of [{ rail: 'robinhood' }, { rail: 'pump', pumpCashback: true }, { rail: 'pump', holderRewards: { enabled: true } }, { rail: 'pump', creatorFeeSplit: [{ pct: 10 }] }, { rail: 'pump', feeMode: 'burn' }, { burnCreatorFees: true }, { creatorFeeRecipient: treasury }, { buybackWallet: treasury }]) {
    assert.throws(() => assertLaunchUtilityReady(p, context, enabled), /Pump|combine|share/);
  }
});
test('description contains one unambiguous UsePaid directive without dropping it at length limit', () => {
  assert.equal(usePaidDescription('Hello\nFees to @old via UsePaid', 'new_name'), 'Hello\n\nFees to @new_name via UsePaid');
  const desc = usePaidDescription('x'.repeat(2000), 'alice', 800);
  assert.equal(desc.length, 800);
  assert.ok(desc.endsWith('Fees to @alice via UsePaid'));
});
test('floor mode is an honest preview, never a live fee redirection', () => {
  const p = { mode: 'nft_floor', collectionSymbol: 'okay_bears', maxPriceSol: '1', dailyBudgetSol: '2', feeShareBps: 5000 };
  const review = reviewLaunchUtility(p, { rail: 'pump' }, enabled);
  assert.equal(review.available, false);
  assert.match(review.blockers.join(' '), /execution/);
  assert.throws(() => assertLaunchUtilityReady(p, { rail: 'pump' }, enabled), /execution/);
  assert.throws(() => normalizeLaunchUtility({ ...p, maxPriceSol: '-1' }), /positive/);
});
test('floor planner requires verified collection, fresh listing, budget and reserve', () => {
  const mint = Keypair.generate().publicKey.toBase58();
  const listing = { mint, priceLamports: '500000000', collectionVerified: true, collectionAddress: treasury, seller: Keypair.generate().publicKey.toBase58(), observedAt: 1000 };
  const input = { listings: [listing], collectionAddress: treasury, now: 1100, balanceLamports: '800000000', reserveLamports: '10000000', maxPriceLamports: '600000000', dailyBudgetLamports: '1000000000', spentTodayLamports: '400000000', estimatedCostLamports: '10000000' };
  assert.equal(planNftFloorPurchase(input).candidate.mint, mint);
  assert.equal(planNftFloorPurchase({ ...input, spentTodayLamports: '600000000' }).candidate, null);
  assert.equal(planNftFloorPurchase({ ...input, now: 50000 }).candidate, null);
  assert.equal(planNftFloorPurchase({ ...input, listings: [{ ...listing, collectionVerified: false }] }).candidate, null);
  assert.equal(planNftFloorPurchase({ ...input, excludedSellers: [listing.seller] }).candidate, null);
  assert.equal(planNftFloorPurchase({ ...input, reservedMints: [mint] }).candidate, null);
});
test('market reader coalesces requests and never treats a listing label as verified ownership', async () => {
  let calls = 0;
  const reader = createNftMarketReader({ fetchFn: async () => { calls++; return { ok: true, json: async () => [{ tokenMint: treasury, price: 0.2, seller: treasury }] }; } });
  const [a, b] = await Promise.all([reader.listings('okay_bears'), reader.listings('okay_bears')]);
  assert.equal(calls, 1); assert.deepEqual(a, b); assert.equal(a[0].collectionVerified, false);
  await reader.listings('okay_bears'); assert.equal(calls, 1);
  await assert.rejects(reader.listings('../admin'), /symbol/);
});
test('single-recipient Pump config is explicitly opted in, never changes the holder profile', async () => {
  const require = createRequire(import.meta.url);
  const { getPumpFeeProgram, PUMP_FEE_PROGRAM_ID } = require('@pump-fun/pump-sdk');
  const creator = Keypair.generate().publicKey, mint = Keypair.generate().publicKey, recipient = Keypair.generate().publicKey;
  const program = getPumpFeeProgram(new Connection('http://127.0.0.1:8899'));
  const data = await program.coder.accounts.encode('sharingConfig', { bump: 255, version: 2, status: { active: {} }, mint, admin: creator, adminRevoked: true, shareholders: [{ address: recipient, shareBps: 10000 }] });
  const accountInfo = { owner: PUMP_FEE_PROGRAM_ID, executable: false, data, lamports: 1, rentEpoch: 0 };
  assert.equal(decodePumpFeeSharingConfig({ mint, accountInfo }).finalized, false);
  assert.equal(decodePumpFeeSharingConfig({ mint, accountInfo, allowSingleRecipient: true }).finalized, true);
  const instruction = await buildPumpSingleRecipientFeeUpdate({ creator, mint, recipient });
  assert.ok(instruction.programId.equals(PUMP_FEE_PROGRAM_ID));
  await assert.rejects(buildPumpSingleRecipientFeeUpdate({ creator, mint, recipient: creator }), /differ/);
});
test('the published UsePaid fee destination must be the expected Pump social fee account', async () => {
  const require = createRequire(import.meta.url);
  const { getPumpFeeProgram, PUMP_FEE_PROGRAM_ID } = require('@pump-fun/pump-sdk');
  const BN = require('bn.js');
  const program = getPumpFeeProgram(new Connection('http://127.0.0.1:8899'));
  const data = await program.coder.accounts.encode('socialFeePda', { bump: 255, version: 1, userId: '322216527', platform: 2, totalClaimed: new BN(0), lastClaimed: new BN(0) });
  const info = { owner: PUMP_FEE_PROGRAM_ID, executable: false, data, lamports: 1, rentEpoch: 0 };
  assert.equal(verifyUsePaidRecipientAccount(info).verified, true);
  assert.throws(() => verifyUsePaidRecipientAccount(null), /verified/);
  assert.throws(() => verifyUsePaidRecipientAccount({ ...info, owner: Keypair.generate().publicKey }), /verified/);
  assert.throws(() => verifyUsePaidRecipientAccount(info, Keypair.generate().publicKey.toBase58()), /differs/);
});
test('launch surfaces send selected NFTs, and fee destinations are checked before creating coins', async () => {
  for (const name of ['index.html', 'gg.html']) {
    const source = await fs.readFile(new URL('../web/public/' + name, import.meta.url), 'utf8');
    assert.ok(source.includes('tb("nft","NFT &amp; Fees")'));
    assert.ok(source.includes('body.nftCollection=requestedNft;body.launchUtility=reviewedUtility'));
    assert.ok(source.includes('SlimeLaunchUtility.prepare'));
    assert.ok(source.includes('SlimeLaunchUtility.resultHtml'));
  }
  const server = await fs.readFile(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.ok(server.includes('launchHolderRewardsFromAttempt(attempt).enabled || utilityRequiresFeeSharing(attempt)'));
  assert.ok(server.includes('pumpFeeSharingSubmissionDisposition(attempt.pumpFeeSharing || {})'));
  assert.ok(server.includes('let metadataUri = firstString(attempt.nftCollectionMetadataUri);'));
  assert.ok(!server.includes('let metadataUri = firstString(attempt.nftCollectionMetadataUri, attempt.metadataUri)'));
  assert.ok(server.includes('lb_utility_menu'));
});
