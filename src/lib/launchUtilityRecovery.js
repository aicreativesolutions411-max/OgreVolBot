import { createHash } from 'node:crypto';

// A null *value* is a successful lookup with no observed transaction. A failed
// RPC call is not the same thing and must never authorize a fresh signature.
export async function feeSetupSubmissionDisposition(state, connection) {
  const signature = String(state?.setupSignature || '');
  if (!signature) return { rebuild: true, reason: 'not_submitted' };
  let response;
  try { response = await connection.getSignatureStatus(signature, { searchTransactionHistory: true }); }
  catch { return { rebuild: false, reason: 'status_unavailable' }; }
  if (!response || !Object.hasOwn(response, 'value')) return { rebuild: false, reason: 'invalid_status_response' };
  const value = response.value;
  if (value?.err) return { rebuild: true, reason: 'failed_on_chain', error: JSON.stringify(value.err) };
  if (value) return { rebuild: false, reason: value.confirmationStatus || 'processed' };
  const expiry = Number(state.setupLastValidBlockHeight || 0);
  if (!Number.isSafeInteger(expiry) || expiry <= 0) return { rebuild: false, reason: 'unknown_without_expiry' };
  let height;
  try { height = await connection.getBlockHeight('finalized'); }
  catch { return { rebuild: false, reason: 'block_height_unavailable' }; }
  if (!Number.isSafeInteger(height) || height < 0) return { rebuild: false, reason: 'block_height_unavailable' };
  if (height <= expiry) return { rebuild: false, reason: 'signed_transaction_still_live' };
  // Close the race between the first lookup and block-height observation.
  try { response = await connection.getSignatureStatus(signature, { searchTransactionHistory: true }); }
  catch { return { rebuild: false, reason: 'status_unavailable' }; }
  if (!response || !Object.hasOwn(response, 'value')) return { rebuild: false, reason: 'invalid_status_response' };
  if (response.value?.err) return { rebuild: true, reason: 'failed_on_chain', error: JSON.stringify(response.value.err) };
  if (response.value) return { rebuild: false, reason: response.value.confirmationStatus || 'processed' };
  return { rebuild: true, reason: 'expired_unseen' };
}

// Bind the Telegram confirmation to the whole visible draft, the selected
// creator and the reviewed permanent recipient—not only the utility dropdown.
export function launchDraftFingerprint(draft, creatorAddress, treasury = '') {
  const keys = ['name', 'symbol', 'description', 'imageDataUrl', 'imageName', 'devBuySol',
    'x', 'telegram', 'website', 'autoExitX', 'nftEnabled', 'utilityMode', 'utilityXHandle', 'utilityCollection'];
  const payload = Object.fromEntries(keys.map(key => [key, draft[key] ?? null]));
  return createHash('sha256').update(JSON.stringify({ payload, creatorAddress, treasury })).digest('hex');
}

export function launchConfirmationMatches(confirmation, { id, userId, fingerprint }) {
  return !!confirmation && confirmation.id === id && String(confirmation.userId) === String(userId)
    && confirmation.fingerprint === fingerprint;
}

export function telegramLaunchExitStrategy(value) {
  const multiple = Number(value || 0);
  if (![0, 2, 3, 5, 10].includes(multiple)) throw new Error('Review a supported Telegram launch exit target.');
  return multiple === 0
    ? { preset: 'manual', manualExit: true, disableAutoExit: true, takeProfitPct: '0', stopLossPct: '0' }
    : { takeProfitPct: String((multiple - 1) * 100), stopLossPct: '0', sellPercent: '100', sellDelay: 'off' };
}
