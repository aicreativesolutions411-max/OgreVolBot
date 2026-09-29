import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildLaunchPassport } from '../src/lib/launchPassport.js';
import { buildLaunchRewardReport } from '../src/lib/launchRewardReport.js';
const mint = 'So11111111111111111111111111111111111111112';
const base = () => ({ mint, mode: 'holder_alliance', automatic: true, quoteMint: mint, destinations: [{ id: 'own', label: 'Own holders', shareBps: 7000, tokenMint: mint }], receipts: [] });
test('passport is allowlisted and its downloadable configuration matches the digest', () => {
  const report = { ...base(), secretKey: 'NEVER_PUBLIC', userId: 'private-user', signedBytes: 'secret' };
  const result = buildLaunchPassport(report);
  assert.equal(createHash('sha256').update(result.canonicalJson).digest('hex'), result.digest);
  assert.deepEqual(JSON.parse(result.canonicalJson), result.manifest);
  assert.doesNotMatch(JSON.stringify(result), /NEVER_PUBLIC|private-user|signedBytes/);
  assert.equal(result.attestation, 'saved_configuration_not_creator_signed');
});
test('financial progress and pause status do not change configuration identity; allocations do', () => {
  const report = base(), digest = buildLaunchPassport(report).digest;
  assert.equal(buildLaunchPassport({ ...report, automatic: false, paidLamports: '10000' }).digest, digest);
  report.destinations[0].shareBps = 6000;
  assert.notEqual(buildLaunchPassport(report).digest, digest);
});
test('evidence excludes unverified collections, malformed signatures and invalid dates', () => {
  const result = buildLaunchPassport({ ...base(), collectionReceipts: [
    { signature: '2'.repeat(88), accountingStatus: 'pending', confirmedAt: '2026-09-29' },
    { signature: '3'.repeat(88), accountingStatus: 'verified', confirmedAt: '2026-09-29' },
  ], receipts: [{ signature: 'javascript:bad', confirmedAt: '2026-09-29' }, { signature: '4'.repeat(88), confirmedAt: 'invalid' }] });
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].signature, '3'.repeat(88));
  assert.equal(result.coverage, 'retained_records_only');
});
test('legacy programs do not acquire invented holder rules or assurances', () => {
  const result = buildLaunchPassport({ mint, mode: 'legacy_split', destinations: [] });
  assert.equal(result.manifest.holderRules, null);
  assert.deepEqual(result.manifest.destinations, []);
  assert.equal(result.controls.automation, 'not_applicable');
  assert.equal(buildLaunchPassport({ mint: 'invalid' }), null);
});
test('public rewards response includes the passport, without leaking raw attempt fields', () => {
  const report = buildLaunchRewardReport({ status: 'COMPLETE', tokenMint: mint, devWalletPublicKey: mint, encryptedSecret: 'NEVER_PUBLIC' });
  assert.ok(report.passport?.digest);
  assert.doesNotMatch(JSON.stringify(report), /NEVER_PUBLIC/);
});
