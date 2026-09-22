import { PublicKey } from '@solana/web3.js';

// Consent is intentionally not a persistent/global checkbox. It accompanies one
// reviewed launch and is versioned whenever the irreversible provider terms change.
export const LAUNCH_UTILITY_CONSENT_VERSION = '2026-09-22';
// Official /launch → Register → "Pump fee-sharing address", checked 2026-09-22.
// This is public protocol configuration, not a private key. A changed provider
// address requires a code review as well as deployment configuration.
export const USEPAID_VERIFIED_TREASURY = 'FfLpuH4WPn2MR8Lqn1MpwQc1HtAPPqL3qvMWZjnFHGpv';
const MODES = new Set(['creator', 'nft_floor', 'usepaid']);
const fail = (message) => { const error = new Error(message); error.statusCode = 400; error.code = 'LAUNCH_UTILITY_INVALID'; throw error; };
export function normalizeXRecipient(value) {
  const handle = String(value || '').trim().replace(/^@/, '');
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle)) fail('Enter one valid X handle, without a URL.');
  return handle;
}
function positiveSol(value, label) {
  const text = String(value ?? '').trim();
  if (!/^\d+(?:\.\d{1,9})?$/.test(text) || !(Number(text) > 0) || Number(text) > 10000) fail(`${label} must be a positive SOL amount (up to 10,000).`);
  return text;
}
export function normalizeLaunchUtility(input = {}) {
  const mode = String(input?.mode || 'creator').toLowerCase();
  if (!MODES.has(mode)) fail('Unknown launch fee utility.');
  if (mode === 'creator') return { version: 1, mode };
  if (mode === 'usepaid') return { version: 1, mode, xHandle: normalizeXRecipient(input.xHandle), consentVersion: String(input.consentVersion || '') };
  const collectionSymbol = String(input.collectionSymbol || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(collectionSymbol)) fail('Enter the Magic Eden collection symbol, not a wallet address or URL.');
  const feeShareBps = Number(input.feeShareBps ?? 5000);
  if (!Number.isInteger(feeShareBps) || feeShareBps < 100 || feeShareBps > 10000) fail('NFT budget share must be 1–100% of creator fees.');
  return { version: 1, mode, collectionSymbol, feeShareBps,
    maxPriceSol: positiveSol(input.maxPriceSol, 'Maximum NFT price'),
    dailyBudgetSol: positiveSol(input.dailyBudgetSol, 'Daily NFT budget'),
    disposition: 'hold' };
}
export function launchUtilityCapabilities(env = process.env) {
  let treasury = '';
  try { const key = new PublicKey(String(env.USEPAID_TREASURY_SOLANA || '')); if (!key.equals(PublicKey.default)) treasury = key.toBase58(); } catch { /* no guessed recipient */ }
  const usepaidAvailable = env.USEPAID_ROUTING_ENABLED === 'true' && treasury === USEPAID_VERIFIED_TREASURY && env.USEPAID_TERMS_REVIEWED_VERSION === LAUNCH_UTILITY_CONSENT_VERSION;
  return {
    version: 1, consentVersion: LAUNCH_UTILITY_CONSENT_VERSION,
    linkedCollection: { available: true, chains: ['solana'], standard: 'metaplex-core' },
    nftFloor: { available: false, previewAvailable: true, reason: 'NFT floor purchases need a verified marketplace execution adapter; preview only. No fees will be redirected.', custody: 'A separate vault per coin is required before activation.' },
    usepaid: { available: usepaidAvailable, treasury: usepaidAvailable ? treasury : '',
      reason: usepaidAvailable ? '' : 'UsePaid routing is not configured with a verified treasury and reviewed terms.',
      creatorFeeShareBps: 10000, recipientShareBps: 8000, providerBuybackBps: 2000,
      verifiedAt: '2026-09-22', sourceUrl: 'https://usepaid.app/launch',
      docsUrl: 'https://usepaid.app/docs', termsUrl: 'https://usepaid.app/legal/terms', disclosuresUrl: 'https://usepaid.app/legal/disclosures' }
  };
}
export function reviewLaunchUtility(input, context = {}, env = process.env) {
  const policy = normalizeLaunchUtility(input);
  const capabilities = launchUtilityCapabilities(env);
  const blockers = [];
  const warnings = [];
  let summary = 'Keep the existing creator-fee and reward settings. No new fee destination.';
  if (policy.mode !== 'creator') {
    if (String(context.rail || 'pump').toLowerCase() !== 'pump') blockers.push('These creator-fee utilities currently support Pump launches on Solana only.');
    if (context.pumpCashback || context.holderRewards?.enabled || context.creatorFeeSplit?.length || context.burnCreatorFees || context.creatorFeeRecipient || context.feeRecipient || context.buybackWallet || ['buyback', 'burn', 'split'].includes(context.feeMode)) blockers.push('Do not combine this fee destination with Cash back, holder rewards, promoter shares, custom fee recipients, burn or buyback routing.');
  }
  if (policy.mode === 'usepaid') {
    if (!capabilities.usepaid.available) blockers.push(capabilities.usepaid.reason);
    summary = `Permanently route 100% of future creator fees to UsePaid for @${policy.xHandle}. UsePaid reports an 80% recipient / 20% $PAID buy-and-burn split.`;
    warnings.push('You give up creator-fee claims for this coin. This cannot be reversed after the Pump sharing config is finalized.', 'UsePaid is a third-party custodian, not SlimeWire or X. Payout timing and X Money eligibility are controlled by the provider; cash receipt is not guaranteed.', 'UsePaid reports that unclaimed payments can expire and return to its treasury. Review its current terms before confirming.');
    warnings.push('UsePaid does not publish its operator’s legal identity in its terms. Naming an X account does not mean that person endorses your coin.');
  }
  if (policy.mode === 'nft_floor') {
    blockers.push(capabilities.nftFloor.reason);
    summary = `${policy.feeShareBps / 100}% of creator fees proposed for ${policy.collectionSymbol}; maximum ${policy.maxPriceSol} SOL per NFT and ${policy.dailyBudgetSol} SOL per day. Preview only.`;
    warnings.push('A marketplace collection name is not proof of authenticity or affiliation. On-chain collection verification is required before any purchase.', 'The preview never spends money, redirects fees, burns NFTs or runs a lottery.');
  }
  return { policy, available: !blockers.length, summary, blockers, warnings, treasury: policy.mode === 'usepaid' ? capabilities.usepaid.treasury : '', consentVersion: capabilities.consentVersion };
}
export function assertLaunchUtilityReady(input, context = {}, env = process.env) {
  const review = reviewLaunchUtility(input, context, env);
  if (!review.available) fail(review.blockers.join(' '));
  if (review.policy.mode === 'usepaid' && review.policy.consentVersion !== LAUNCH_UTILITY_CONSENT_VERSION) fail('Review and confirm the permanent UsePaid fee destination for this launch.');
  return review;
}
export function usePaidDescription(description, handle, limit = 800) {
  const directive = `Fees to @${normalizeXRecipient(handle)} via UsePaid`;
  const clean = String(description || '').replace(/Fees\s+to\s+@[^\s]+\s+via\s+UsePaid/gi, '').trim();
  const body = clean.slice(0, Math.max(0, limit - directive.length - 2)).trimEnd();
  return body ? `${body}\n\n${directive}` : directive;
}
export function utilityRequiresFeeSharing(attempt = {}) { return attempt.launchUtility?.mode === 'usepaid'; }
export function utilityFeeSharingMatches(config, treasury) {
  return !!(config?.finalized && config.shareholders?.length === 1 && config.shareholders[0].address.toBase58() === treasury && config.shareholders[0].shareBps === 10000);
}
