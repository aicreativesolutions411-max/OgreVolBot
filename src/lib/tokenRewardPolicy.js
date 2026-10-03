import crypto from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { rewardAddress, rewardError } from './tokenRewardAssets.js';

export const TOKEN_REWARD_CADENCE_MS = 12 * 60 * 60 * 1000;
export function rewardWallet(value) {
  const wallet = rewardAddress(value);
  if (!PublicKey.isOnCurve(new PublicKey(wallet).toBytes()) || wallet === '1nc1nerator11111111111111111111111111111111111') throw rewardError(422, 'Choose a normal receiving wallet, not a program or burn address.');
  return wallet;
}
export function normalizeTokenRewardPolicy(input, asset) {
  if (!asset || asset.supported !== true || asset.tokenProgram !== TOKEN_PROGRAM_ID.toBase58() || !Number.isInteger(asset.decimals) || asset.decimals < 0 || asset.decimals > 9) throw rewardError(422, 'Select a supported, verified payout token first.');
  if (rewardAddress(input.quoteMint) !== asset.mint) throw rewardError(422, 'Selected pairing and payout token must match the verified mint.');
  const shares = ['creatorShareBps', 'holderShareBps', 'partnerShareBps'].map(k => input[k] ?? 0);
  if (shares.some(v => !Number.isInteger(v) || v < 0 || v > 10000 || v % 100)) throw rewardError(422, 'Use whole percentages between 0% and 100%.');
  if (shares.reduce((a, b) => a + b, 0) !== 10000) throw rewardError(422, 'Developer and community percentages must total 100%.');
  const creator = rewardWallet(input.creator);
  const partnerMint = shares[2] ? rewardAddress(input.partnerMint || asset.mint) : '';
  return {
    version: 1, rail: 'slimewire-meteora', creator, quoteMint: asset.mint, payoutMint: asset.mint,
    asset: { mint: asset.mint, symbol: String(asset.symbol || '').slice(0, 32), name: String(asset.name || '').slice(0, 80), decimals: asset.decimals, tokenProgram: asset.tokenProgram },
    creatorShareBps: shares[0], holderShareBps: shares[1], partnerShareBps: shares[2], partnerMint,
    cadenceHours: 12, minimumHoldingUsd: 20, funding: 'net-quote-trading-fees', tradingFeeBps: 100,
    transferFeeBps: 0, autoDistribute: true, custody: 'dedicated-service-fee-vault',
    // This is a requested policy, not a claim that a funded/validated program is running.
    consentVersion: 'slimewire-token-rewards-2026-10-03-v1',
  };
}
export const tokenRewardPolicyHash = policy => crypto.createHash('sha256').update(JSON.stringify(policy)).digest('hex');

export function assertTokenRewardPolicy(policy) {
  if (!policy || !policy.asset) throw new Error('Missing reviewed reward policy.');
  const expected = normalizeTokenRewardPolicy(policy, { ...policy.asset, supported: true });
  if (JSON.stringify(policy) !== JSON.stringify(expected)) throw new Error('Reward policy is not the canonical reviewed configuration.');
  return policy;
}
