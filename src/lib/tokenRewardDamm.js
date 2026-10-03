import { PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, unpackAccount } from '@solana/spl-token';
import { createDammV2Program, deriveDammV2PoolAddress, deriveDammV2PoolAuthority, deriveDammV2EventAuthority, deriveDammV2TokenVaultAddress, derivePositionAddress, DAMM_V2_PROGRAM_ID, DAMM_V2_MIGRATION_FEE_ADDRESS, MigrationFeeOption } from '@meteora-ag/dynamic-bonding-curve-sdk';

const number = v => BigInt(v.toString());
const u256 = bytes => { if (bytes?.length !== 32) throw new Error('Invalid fee accumulator.'); return BigInt('0x' + Buffer.from(bytes).reverse().toString('hex')); };
const MAX64 = (1n << 64n) - 1n;
// Matches DAMM v2's wrapping U256 accumulator / Q128 liquidity and saturating
// U64 fees. Used only to avoid empty claims; finalized balance deltas are the
// sole source of realized revenue in the ledger.
export function dammQuoteFees(pool, position) {
  const liquidity = number(position.unlockedLiquidity) + number(position.vestedLiquidity) + number(position.permanentLockedLiquidity);
  const delta = (u256(pool.feeBPerLiquidity) - u256(position.feeBPerTokenCheckpoint) + (1n << 256n)) % (1n << 256n);
  const accrued = liquidity * delta >> 128n;
  const owed = number(position.feeBPending) + (accrued > MAX64 ? MAX64 : accrued);
  return owed > MAX64 ? MAX64 : owed;
}

export function rewardDammPool(baseMint, quoteMint) {
  return deriveDammV2PoolAddress(new PublicKey(DAMM_V2_MIGRATION_FEE_ADDRESS[MigrationFeeOption.Customizable]), new PublicKey(baseMint), new PublicKey(quoteMint));
}

export function createRewardDammCollector({ connection, owner, program = createDammV2Program(connection, 'finalized') }) {
  async function inspect(baseMint, quoteMint) {
    const pool = rewardDammPool(baseMint, quoteMint), state = await program.account.pool.fetch(pool, 'finalized');
    const base = new PublicKey(baseMint), quote = new PublicKey(quoteMint);
    // DBC migration explicitly assigns base=A, quote=B. DAMM's fee enum is
    // different from DBC's: ONLY token B is 1 (not DBC QuoteToken's 0).
    if (!state.tokenAMint.equals(base) || !state.tokenBMint.equals(quote) || state.collectFeeMode !== 1 || state.tokenAFlag !== 0 || state.tokenBFlag !== 0 ||
        !state.tokenAVault.equals(deriveDammV2TokenVaultAddress(pool, base)) || !state.tokenBVault.equals(deriveDammV2TokenVaultAddress(pool, quote))) throw new Error('Graduated pool does not match the reviewed quote-only reward policy.');
    return { pool, state, base, quote };
  }
  async function prepare({ baseMint, quoteMint, minimumRaw }) {
    const { pool, state, base, quote } = await inspect(baseMint, quoteMint);
    const accounts = await connection.getTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID }, 'finalized');
    if (!Array.isArray(accounts.value) || accounts.value.length > 32) throw new Error('Fee-vault position inventory needs review.');
    const matches = [];
    for (const { pubkey, account } of accounts.value) {
      const nft = unpackAccount(pubkey, account, TOKEN_2022_PROGRAM_ID);
      if (!nft.owner.equals(owner) || nft.amount !== 1n) continue;
      const position = derivePositionAddress(nft.mint), value = await program.account.position.fetchNullable(position, 'finalized');
      if (!value || !value.pool.equals(pool)) continue;
      if (!value.nftMint.equals(nft.mint) || number(value.permanentLockedLiquidity) <= 0n || number(value.unlockedLiquidity) !== 0n || number(value.vestedLiquidity) !== 0n) throw new Error('Reward position is not the expected permanently locked LP.');
      matches.push({ position, value, nftAccount: pubkey });
    }
    if (matches.length !== 1) throw new Error('The dedicated vault must own exactly one matching graduated fee position.');
    const position = matches[0];
    if (dammQuoteFees(state, position.value) < BigInt(minimumRaw)) return null;
    const tokenAAccount = getAssociatedTokenAddressSync(base, owner), tokenBAccount = getAssociatedTokenAddressSync(quote, owner);
    const claim = await program.methods.claimPositionFee().accountsStrict({ poolAuthority: deriveDammV2PoolAuthority(), pool, position: position.position,
      tokenAAccount, tokenBAccount, tokenAVault: state.tokenAVault, tokenBVault: state.tokenBVault, tokenAMint: base, tokenBMint: quote,
      positionNftAccount: position.nftAccount, owner, tokenAProgram: TOKEN_PROGRAM_ID, tokenBProgram: TOKEN_PROGRAM_ID,
      eventAuthority: deriveDammV2EventAuthority(), program: DAMM_V2_PROGRAM_ID }).instruction();
    // Never close a wSOL account here: it may already contain reserved rewards.
    return new Transaction().add(createAssociatedTokenAccountIdempotentInstruction(owner, tokenAAccount, owner, base),
      createAssociatedTokenAccountIdempotentInstruction(owner, tokenBAccount, owner, quote), claim);
  }
  return { inspect, prepare };
}
