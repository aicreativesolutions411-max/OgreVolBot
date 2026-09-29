import { PublicKey } from '@solana/web3.js';
import { normalizeLaunchAlliance, ALLIANCE_CONSENT_VERSION } from './launchAlliance.js';
import { normalizeHolderAlliance, HOLDER_ALLIANCE_CONSENT_VERSION, WALLET_SPLIT_CONSENT_VERSION, MULTI_WALLET_CONSENT_VERSION, MAX_FEE_RECIPIENTS, splitRecipients } from './holderAlliance.js';

// Consent is intentionally not a persistent/global checkbox. It accompanies one
// reviewed launch and is versioned whenever the irreversible provider terms change.
export const LAUNCH_UTILITY_CONSENT_VERSION = '2026-09-22';
// Official /launch → Register → "Pump fee-sharing address", checked 2026-09-22.
// This is public protocol configuration, not a private key. A changed provider
// address requires a code review as well as deployment configuration.
export const USEPAID_VERIFIED_TREASURY = 'FfLpuH4WPn2MR8Lqn1MpwQc1HtAPPqL3qvMWZjnFHGpv';
const MODES = new Set(['creator', 'alliance', 'holder_alliance', 'nft_floor', 'usepaid']);
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
  if (mode === 'alliance') return normalizeLaunchAlliance(input);
  if (mode === 'holder_alliance') return normalizeHolderAlliance(input);
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
  // Provider cash payouts are paused. Old deployment env must NOT authorize
  // new irreversible routing. Existing finalized routes remain readable.
  const usepaidAvailable = false;
  return {
    version: 1, consentVersion: LAUNCH_UTILITY_CONSENT_VERSION,
    linkedCollection: { available: true, chains: ['solana'], standard: 'metaplex-core' },
    alliance: { available: true, chains: ['solana'], rail: 'pump', quote: 'SOL', recipients: 2, consentVersion: ALLIANCE_CONSENT_VERSION },
    holderAlliance: { available: true, chains: ['solana'], rail: 'pump', quote: 'SOL', minimumUsd: 20, cadenceHours: 12, consentVersion: HOLDER_ALLIANCE_CONSENT_VERSION, walletSplitConsentVersion: WALLET_SPLIT_CONSENT_VERSION, multiWalletConsentVersion:MULTI_WALLET_CONSENT_VERSION,maxRecipients:MAX_FEE_RECIPIENTS },
    nftFloor: { available: false, previewAvailable: true, reason: 'NFT floor purchases need a verified marketplace execution adapter; preview only. No fees will be redirected.', custody: 'A separate vault per coin is required before activation.' },
    usepaid: { available: usepaidAvailable, treasury: usepaidAvailable ? treasury : '',
      reason: 'X cash payouts are unavailable. New UsePaid routing is disabled while provider payouts are paused.',
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
  if (policy.mode === 'alliance') {
    summary = `Community Alliance: permanently route ${policy.partnerShareBps / 100}% of future creator fees to ${policy.partnerName} (${policy.partnerWallet}); ${100 - policy.partnerShareBps / 100}% stays with the creator wallet.`;
    warnings.push('This is a direct wallet split, not individual holder rewards or NFT purchases.', 'The finalized Pump fee recipients and percentages cannot be changed. Verify the full destination address before signing.', 'A community name is supplied by the launcher; it is not independent proof of endorsement or control.', policy.autoDistribute ? 'Daily distribution is authorized from collected creator fees. The creator wallet pays network costs; small balances accumulate until economical to distribute.' : 'Fees accrue on-chain. Use Distribute fees to pay both recipients; the creator wallet pays network costs.');
    warnings.push('The creator wallet also pays fee-sharing account rent and setup network costs. The pre-launch balance check reserves these costs plus 0.003 SOL for later distribution account rent. Distribution requires at least 0.001 SOL accrued and caps its network fee at 0.0001 SOL.');
  }
  if (policy.mode === 'holder_alliance') {
    summary = `Fee split: ${policy.creatorShareBps/100}% to the developer, ${policy.ownHolderShareBps/100}% to this coin’s eligible holders${policy.partnerHolderShareBps ? `, ${policy.partnerHolderShareBps/100}% to holders of ${policy.partnerName} (${policy.partnerMint})` : ''}${splitRecipients(policy).map(r=>`, ${r.shareBps/100}% to ${r.label||'recipient wallet'} (${r.wallet})`).join('')}. Paid in SOL; this is not a custom trading pair.`;
    if(policy.recipientShareBps)warnings.push('Verify the full recipient wallet, not a token CA. Its share passes through the same dedicated rewards vault and is paid on the 12-hour cycle, without a holder balance requirement or recipient signup. Incomplete active holder snapshots delay the entire allocation. Transfers are irreversible.');
    warnings.push('Permanent Pump fee split: launcher plus a dedicated encrypted SlimeWire holder vault. Individual holder payouts are managed by SlimeWire, not Pump’s native reward program. Keep a backup of the creator wallet.',
      'Every 12 hours, complete finalized holder snapshots and fresh USD quotes determine eligibility: strictly more than $20 of the respective token. Each community’s allocation is weighted by eligible token balances. Owning both coins can qualify a wallet for both allocations.',
      'Requires a funded, verified SOL Pump curve or an indexed USD market with at least $1,000 liquidity, and no more than 2,000 eligible wallets per community. Missing prices, incomplete lists or unavailable free RPC delay the cycle; funds stay reserved. This is a snapshot, not a continuous-holding requirement.',
      'The holder vault retains 0.001 SOL as a reserve. Each wallet’s rewards accumulate until at least 0.001 SOL can be sent. Pools, program accounts and burn addresses are excluded. A community with no eligible holders keeps its allocation for a later cycle.',
      'The creator wallet pays fee-sharing setup rent and payout network costs: at most 0.0001 SOL per transaction, batches of up to 8 recipient wallets. Keep at least 0.003 SOL plus fees available. You may pause automatic execution; earned holder and receiving-wallet credits remain owed. No rewards are guaranteed without trading fees.',
      'The percentages, partner token and receiving wallet cannot be edited after launch. Naming another community does not prove endorsement or partnership.');
  }
  if (policy.mode === 'nft_floor') {
    blockers.push(capabilities.nftFloor.reason);
    summary = `${policy.feeShareBps / 100}% of creator fees proposed for ${policy.collectionSymbol}; maximum ${policy.maxPriceSol} SOL per NFT and ${policy.dailyBudgetSol} SOL per day. Preview only.`;
    warnings.push('A marketplace collection name is not proof of authenticity or affiliation. On-chain collection verification is required before any purchase.', 'The preview never spends money, redirects fees, burns NFTs or runs a lottery.');
  }
  return { policy, available: !blockers.length, summary, blockers, warnings, treasury: policy.mode === 'usepaid' ? capabilities.usepaid.treasury : policy.mode === 'alliance' ? policy.partnerWallet : '', consentVersion: policy.mode === 'holder_alliance' ? (Array.isArray(policy.recipients)?MULTI_WALLET_CONSENT_VERSION:policy.recipientShareBps ? WALLET_SPLIT_CONSENT_VERSION : HOLDER_ALLIANCE_CONSENT_VERSION) : policy.mode === 'alliance' ? ALLIANCE_CONSENT_VERSION : capabilities.consentVersion };
}
export function assertLaunchUtilityReady(input, context = {}, env = process.env) {
  const review = reviewLaunchUtility(input, context, env);
  if (!review.available) fail(review.blockers.join(' '));
  if (review.policy.mode === 'usepaid' && review.policy.consentVersion !== LAUNCH_UTILITY_CONSENT_VERSION) fail('Review and confirm the permanent UsePaid fee destination for this launch.');
  if (review.policy.mode === 'alliance' && review.policy.consentVersion !== ALLIANCE_CONSENT_VERSION) fail('Review and confirm the permanent Community Alliance fee split for this launch.');
  if (review.policy.mode === 'holder_alliance' && review.policy.consentVersion !== review.consentVersion) fail('Review and confirm every permanent fee allocation, recipient wallet and automatic network cost for this launch.');
  return review;
}
export function usePaidDescription(description, handle, limit = 800) {
  const directive = `Fees to @${normalizeXRecipient(handle)} via UsePaid`;
  const clean = String(description || '').replace(/Fees\s+to\s+@[^\s]+\s+via\s+UsePaid/gi, '').trim();
  const body = clean.slice(0, Math.max(0, limit - directive.length - 2)).trimEnd();
  return body ? `${body}\n\n${directive}` : directive;
}
export function utilityRequiresFeeSharing(attempt = {}) { return ['usepaid', 'alliance', 'holder_alliance'].includes(attempt.launchUtility?.mode); }
export function utilityFeeSharingMatches(config, treasury) {
  return !!(config?.finalized && config.shareholders?.length === 1 && config.shareholders[0].address.toBase58() === treasury && config.shareholders[0].shareBps === 10000);
}
