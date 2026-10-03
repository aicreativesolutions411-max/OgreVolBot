import { PublicKey } from '@solana/web3.js';
import { createDbcProgram, createDammV2Program, DYNAMIC_BONDING_CURVE_PROGRAM_ID, DAMM_V2_PROGRAM_ID, getPriceFromSqrtPrice } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { rewardDammPool } from './tokenRewardDamm.js';
import { readHolderSnapshot } from './holderAllianceSnapshot.js';

export function createTokenRewardSnapshot({ connection, resolver, read = readHolderSnapshot }) {
  const dbc = createDbcProgram(connection, 'finalized').program, damm = createDammV2Program(connection, 'finalized');
  return async (mint, { excluded, program, source }) => {
    if (source !== 'own') return read(mint, { excluded, priceAtSnapshot: async ({ decimals, minContextSlot }) => {
      // Reuse the exact-mint market fallback instead of making the holder
      // payout depend on the shared DexScreener IP being available.
      const asset = await resolver.resolve(mint, { fresh: true });
      if (asset.mint !== mint || asset.decimals !== decimals || !asset.supported || !Number.isFinite(asset.marketCheckedAt) || Math.abs(Date.now() - asset.marketCheckedAt) > 30000) throw new Error('Partner community price could not be freshly verified.');
      const slot = await connection.getSlot({ commitment: 'finalized', minContextSlot });
      return { slot, priceUsd: asset.priceUsd, source: 'verified ' + asset.marketSource + ' USD market quote' };
    } });
    const policy = program.ledger.policy;
    if (mint !== program.mint) throw new Error('Wrong native holder community.');
    return read(mint, { excluded: [...excluded, rewardDammPool(mint, policy.quoteMint).toBase58()], priceAtSnapshot: async ({ decimals, minContextSlot }) => {
      if (decimals !== 6) throw new Error('Native coin precision does not match the launch.');
      const quote = await resolver.resolve(policy.quoteMint, { fresh: true });
      const raw = await connection.getAccountInfoAndContext(new PublicKey(program.pool), { commitment: 'finalized', minContextSlot });
      if (!raw.value?.owner.equals(DYNAMIC_BONDING_CURVE_PROGRAM_ID)) throw new Error('Native reward pool is unavailable.');
      let state = dbc.coder.accounts.decode('virtualPool', raw.value.data).poolState, slot = raw.context.slot;
      if (state.config.toBase58() !== program.config || state.baseMint.toBase58() !== mint || state.creator.toBase58() !== policy.creator) throw new Error('Native reward pool identity changed.');
      if (state.isMigrated) {
        const migrated = await connection.getAccountInfoAndContext(rewardDammPool(mint, policy.quoteMint), { commitment: 'finalized', minContextSlot });
        if (!migrated.value?.owner.equals(DAMM_V2_PROGRAM_ID)) throw new Error('Graduated pool is not finalized yet.');
        state = damm.coder.accounts.decode('pool', migrated.value.data); slot = migrated.context.slot;
        if (state.tokenAMint.toBase58() !== mint || state.tokenBMint.toBase58() !== policy.quoteMint || state.collectFeeMode !== 1) throw new Error('Graduated pool identity changed.');
      } else if (BigInt(state.quoteReserve.toString()) <= 0n) throw new Error('No funded native market price.');
      const priceUsd = getPriceFromSqrtPrice(state.sqrtPrice, decimals, quote.decimals).mul(quote.priceUsd).toString();
      return { slot, priceUsd, source: 'finalized SlimeWire pool × verified quote-token USD price' };
    } });
  };
}
