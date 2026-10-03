// Crypto quote allowlist, not ticker/category inference. Mint accounts were
// checked on public mainnet RPC at finalized slot 452949954 (2026-10-03).
// Re-check ownership/decimals on chain before preparing every transaction.
const SPL = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
export const STONKS_CRYPTO_ASSETS = Object.freeze([
  { mint: '6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx', symbol: 'STONK', name: 'STONK', decimals: 9, community: true },
  { mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', symbol: 'JUP', name: 'Jupiter', decimals: 6, community: true },
  { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', symbol: 'BONK', name: 'BONK', decimals: 5, community: true },
  { mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', symbol: 'WIF', name: 'dogwifhat', decimals: 6, community: true },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', symbol: 'USDC', name: 'USD Coin', decimals: 6, community: false },
  { mint: 'So11111111111111111111111111111111111111112', symbol: 'wSOL', name: 'Wrapped SOL', decimals: 9, community: false },
].map(row => Object.freeze({ ...row, tokenProgram: SPL })));
const byMint = new Map(STONKS_CRYPTO_ASSETS.map(row => [row.mint, row]));
export const cryptoAssetForMint = mint => byMint.get(mint) || null;
const invalid = message => { throw Object.assign(new Error(message), { status: 422 }); };

export function requireCryptoQuote(quote) {
  const asset = cryptoAssetForMint(quote?.mint);
  if (!asset) invalid('This quote mint is not an enabled crypto pairing. Stock-backed and unreviewed assets are not offered.');
  if (quote.decimals !== asset.decimals || quote.tokenProgram !== asset.tokenProgram) invalid('Quote token decimals or program differ from the pinned crypto asset. Signing is paused.');
  return asset;
}

// This describes the configured external model; it is not proof of settlement,
// an independent distribution engine or permission to enable reward launches.
export function cryptoRewardPolicy({ quote, mode, transferFeeBps, communityShareBps = 0 }) {
  const asset = requireCryptoQuote(quote);
  if (!['standard', 'reward', 'community'].includes(mode)) invalid('Unknown launch model.');
  if (mode === 'standard' ? transferFeeBps !== 0 : ![100, 300].includes(transferFeeBps)) invalid('Unsupported transfer fee for this launch model.');
  if (mode === 'community' && (!asset.community || communityShareBps !== 3300)) invalid('The two-community reward allocation is unavailable or changed.');
  const hasRewards = mode !== 'standard', partner = mode === 'community' ? communityShareBps : 0;
  return Object.freeze({
    version: 1, pairingAsset: asset, rewardAsset: hasRewards ? asset : null,
    funding: hasRewards ? 'transfer-fee' : 'trading-fee', transferFeeBps,
    creatorFeePosition: !hasRewards, ownHolderShareBps: hasRewards ? 10000 - partner : 0,
    quoteHolderShareBps: partner, convertsToSol: false,
    minimumUsd: null, cadenceHours: null, settlement: 'external-distributions', guaranteed: false,
  });
}
