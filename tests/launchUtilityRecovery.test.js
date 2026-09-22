import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { feeSetupSubmissionDisposition, launchDraftFingerprint, launchConfirmationMatches, telegramLaunchExitStrategy } from '../src/lib/launchUtilityRecovery.js';

const intent = { setupSignature: 'signature', setupLastValidBlockHeight: 100 };
const rpc = (value, height = 101) => ({ getSignatureStatus: async () => ({ value }), getBlockHeight: async () => height });
test('fee setup rebuilds an expired unseen signature, not a null-response wrapper', async () => {
  assert.deepEqual(await feeSetupSubmissionDisposition(intent, rpc(null)), { rebuild: true, reason: 'expired_unseen' });
  assert.equal((await feeSetupSubmissionDisposition(intent, rpc(null, 100))).rebuild, false);
  assert.equal((await feeSetupSubmissionDisposition({ setupSignature: 'sig' }, rpc(null))).rebuild, false);
});
test('fee setup never treats RPC failure or an invalid response as absent on chain', async () => {
  for (const getSignatureStatus of [async () => { throw new Error('offline'); }, async () => null, async () => ({ unexpected: true })]) {
    assert.equal((await feeSetupSubmissionDisposition(intent, { ...rpc(null), getSignatureStatus })).rebuild, false);
  }
  assert.equal((await feeSetupSubmissionDisposition(intent, { ...rpc(null), getBlockHeight: async () => { throw new Error('offline'); } })).rebuild, false);
});
test('fee setup reconciles the expiry lookup race and finalized height', async () => {
  let queries = 0;
  const result = await feeSetupSubmissionDisposition(intent, {
    getSignatureStatus: async (_sig, opts) => { assert.equal(opts.searchTransactionHistory, true); return { value: ++queries === 1 ? null : { err: null, confirmationStatus: 'confirmed' } }; },
    getBlockHeight: async commitment => { assert.equal(commitment, 'finalized'); return 101; }
  });
  assert.equal(queries, 2); assert.equal(result.rebuild, false);
  assert.equal((await feeSetupSubmissionDisposition(intent, rpc({ err: { InstructionError: [0, 'InvalidArgument'] } }))).rebuild, true);
  assert.equal((await feeSetupSubmissionDisposition(intent, rpc({ err: null, confirmationStatus: 'processed' }))).rebuild, false);
});
test('Telegram launch consent binds the whole draft, wallet, recipient and user', () => {
  const d = { name: 'Test', symbol: 'TEST', devBuySol: '0.1', utilityMode: 'usepaid', utilityXHandle: 'alice' };
  const fingerprint = launchDraftFingerprint(d, 'wallet-a', 'treasury-a');
  const confirmation = { id: 'review-1', userId: 42, fingerprint };
  const check = overrides => launchConfirmationMatches(confirmation, { id: 'review-1', userId: 42, fingerprint, ...overrides });
  assert.equal(check({}), true);
  for (const overrides of [{ id: 'stale' }, { userId: 7 }, { fingerprint: launchDraftFingerprint({ ...d, devBuySol: '10' }, 'wallet-a', 'treasury-a') }, { fingerprint: launchDraftFingerprint(d, 'wallet-b', 'treasury-a') }, { fingerprint: launchDraftFingerprint(d, 'wallet-a', 'treasury-b') }]) assert.equal(check(overrides), false);
});
test('all recovery entry points use the hardened disposition and stable launch confirmation', () => {
  const server = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.match(server, /return feeSetupSubmissionDisposition\(state, connection\)/);
  assert.match(server, /launchAttemptId: d\.confirmation\.id/);
  assert.match(server, /launchConfirmationMatches\(d\.confirmation/);
  assert.match(server, /callback_data: `lb_confirm:\$\{d\.confirmation\.id\}`/);
});
test('Telegram exits persist in the original durable buy and manual means no automatic exit', () => {
  assert.equal(telegramLaunchExitStrategy(0).manualExit, true);
  assert.equal(telegramLaunchExitStrategy(0).takeProfitPct, '0');
  assert.equal(telegramLaunchExitStrategy(2).takeProfitPct, '100');
  assert.equal(telegramLaunchExitStrategy(3).stopLossPct, '0');
  assert.throws(() => telegramLaunchExitStrategy(-2), /supported/);
  const source = readFileSync(new URL('../src/index.js', import.meta.url), 'utf8');
  assert.ok(source.includes('devExitStrategy: telegramLaunchExitStrategy(d.autoExitX)'));
  assert.ok(source.includes('autoExitX > 1 && mint && !isPumpPortalLocalLaunch()'), 'never create a second exit over the durable local plan');
});
