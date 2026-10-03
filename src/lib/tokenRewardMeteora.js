import { PublicKey, Transaction, ComputeBudgetProgram, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, createTransferCheckedInstruction, unpackAccount, decodeCloseAccountInstruction, NATIVE_MINT } from '@solana/spl-token';
import { DynamicBondingCurveClient, buildCurveWithTwoSegments, TokenType, TokenAuthorityOption, CollectFeeMode, MigratedCollectFeeMode, MigrationOption, MigrationFeeOption, DammV2DynamicFeeMode, ActivationType, BaseFeeMode } from '@meteora-ag/dynamic-bonding-curve-sdk';
import BN from 'bn.js';
import bs58 from 'bs58';
import { inspectRewardMint } from './tokenRewardAssets.js';
import { rewardWallet, assertTokenRewardPolicy } from './tokenRewardPolicy.js';
import { rewardRaw } from './tokenRewardLedger.js';
import { createRewardDammCollector } from './tokenRewardDamm.js';

// Independent SlimeWire rail. No external platform IDs or fee authorities.
// Do not call with an external StonkFun pool: registration checks every authority.
export function tokenRewardCurve(asset, { initialMarketCapUsd = 5000, migrationMarketCapUsd = 69000 } = {}) {
  const price = Number(asset.priceUsd);
  if (!asset.supported || !Number.isFinite(price) || price <= 0 || !Number.isInteger(asset.decimals) || asset.decimals < 0 || asset.decimals > 9) throw new Error('A verified quote token and USD price are required.');
  if (!Number.isFinite(initialMarketCapUsd) || !Number.isFinite(migrationMarketCapUsd) || initialMarketCapUsd < 500 || migrationMarketCapUsd < initialMarketCapUsd * 2 || migrationMarketCapUsd > 1000000) throw new Error('Invalid launch curve bounds.');
  const params = buildCurveWithTwoSegments({
    initialMarketCap: initialMarketCapUsd / price, migrationMarketCap: migrationMarketCapUsd / price,
    percentageSupplyOnMigration: 20,
    activationType: ActivationType.Timestamp,
    // One token of the billion-token supply is reserved for SDK integer
    // rounding at migration and disclosed in the unsigned launch review.
    token: { tokenType: TokenType.SPLToken, tokenBaseDecimal: 6, tokenQuoteDecimal: asset.decimals, tokenAuthorityOption: TokenAuthorityOption.Immutable, totalTokenSupply: 1000000000, leftover: 1 },
    fee: { baseFeeParams: { baseFeeMode: BaseFeeMode.FeeSchedulerLinear, feeSchedulerParam: { startingFeeBps: 100, endingFeeBps: 100, numberOfPeriod: 0, totalDuration: 0 } }, dynamicFeeEnabled: false, collectFeeMode: CollectFeeMode.QuoteToken, creatorTradingFeePercentage: 0, poolCreationFee: 0, enableFirstSwapWithMinFee: false },
    migration: { migrationOption: MigrationOption.MET_DAMM_V2, migrationFeeOption: MigrationFeeOption.Customizable, migrationFee: { feePercentage: 0, creatorFeePercentage: 0 }, migratedPoolFee: { collectFeeMode: MigratedCollectFeeMode.QuoteToken, dynamicFee: DammV2DynamicFeeMode.Disabled, poolFeeBps: 100 } },
    // LP is locked; reward rights stay with this coin's dedicated fee vault.
    liquidityDistribution: { partnerPermanentLockedLiquidityPercentage: 100, partnerLiquidityPercentage: 0, creatorPermanentLockedLiquidityPercentage: 0, creatorLiquidityPercentage: 0 },
    lockedVesting: { totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0, totalVestingDuration: 0, cliffDurationFromMigrationTime: 0 },
  });
  if (params.migrationQuoteThreshold.lte(new BN(0)) || params.migrationQuoteThreshold.gt(new BN('18446744073709551615'))) throw new Error('The quote amount is outside the launch protocol bounds.');
  return params;
}

// Unsigned construction only. Both config and pool must be finalized and adopted
// with the exact reviewed policy before any automatic collector can register them.
export async function buildTokenRewardLaunch({ connection, asset, policy, config, baseMint, vault, name, symbol, uri, client, now = Date.now }) {
  assertTokenRewardPolicy(policy);
  if (policy.quoteMint !== asset.mint || policy.payoutMint !== asset.mint) throw new Error('Pair and reward mint do not match.');
  if (!Number.isFinite(asset.checkedAt) || asset.checkedAt > now() || now() - asset.checkedAt > 30000) throw new Error('Pairing verification expired. Refresh the quote and review the launch again.');
  rewardWallet(vault); if (vault === policy.creator) throw new Error('Use a dedicated fee vault for this launch.');
  if (!name?.trim() || Buffer.byteLength(name) > 32 || !/^[A-Za-z0-9]{1,10}$/.test(symbol || '') || !/^https:\/\/gateway\.pinata\.cloud\/ipfs\/[A-Za-z0-9]+$/.test(uri || '')) throw new Error('Verified launch identity and metadata are required.');
  const actual = inspectRewardMint(asset.mint, await connection.getAccountInfo(new PublicKey(asset.mint), 'finalized'));
  if (actual.decimals !== asset.decimals || actual.tokenProgram !== asset.tokenProgram) throw new Error('Quote mint changed since review.');
  const sdk = client || DynamicBondingCurveClient.create(connection, 'finalized');
  return sdk.partner.createConfigAndPoolWithFirstBuy({ config: new PublicKey(config), feeClaimer: new PublicKey(vault), leftoverReceiver: new PublicKey(policy.creator), quoteMint: new PublicKey(asset.mint), payer: new PublicKey(policy.creator), ...tokenRewardCurve(asset),
    preCreatePoolParam: { name: name.trim(), symbol, uri, poolCreator: new PublicKey(policy.creator), baseMint: new PublicKey(baseMint) } });
}

export function tokenRewardTransferInstructions({ asset, vault, rows }) {
  const owner = new PublicKey(rewardWallet(vault)), mint = new PublicKey(asset.mint);
  if (asset.tokenProgram !== TOKEN_PROGRAM_ID.toBase58() || !Number.isInteger(asset.decimals) || asset.decimals < 0 || asset.decimals > 9 || !rows.length || rows.length > 4) throw new Error('Unsupported payout asset or batch size.');
  const seen = new Set(), source = getAssociatedTokenAddressSync(mint, owner);
  return rows.flatMap(row => {
    const wallet = rewardWallet(row.wallet), amount = rewardRaw(row.amountRaw);
    if (wallet === vault || seen.has(wallet) || amount <= 0n || amount >= 2n ** 64n) throw new Error('Invalid or duplicate payout recipient.'); seen.add(wallet);
    const receiver = new PublicKey(wallet), destination = getAssociatedTokenAddressSync(mint, receiver);
    return [createAssociatedTokenAccountIdempotentInstruction(owner, destination, receiver, mint), createTransferCheckedInstruction(source, mint, destination, owner, amount, asset.decimals)];
  });
}

export function retainWrappedRewardVault(tx, owner) {
  // The SDK appends CloseAccount for SOL fee claims. That would unwrap ALL
  // existing rewards, including balances already owed to other recipients.
  // Keep its claim + ATA setup intact and remove only that exact final cleanup.
  // A changed SDK shape fails closed instead of deleting arbitrary instructions.
  const last = tx.instructions.at(-1), ata = getAssociatedTokenAddressSync(NATIVE_MINT, owner);
  let close;
  try { close = decodeCloseAccountInstruction(last); } catch { throw new Error('SOL fee-claim cleanup changed; collection needs review.'); }
  if (!close.keys.account.pubkey.equals(ata) || !close.keys.destination.pubkey.equals(owner) || !close.keys.authority.pubkey.equals(owner) || last.keys.length !== 3) throw new Error('Unexpected SOL cleanup account; no collection prepared.');
  tx.instructions.pop();
  return tx;
}

export function createTokenRewardDriver({ connection, signer, client, dammCollector }) {
  const sdk = client || DynamicBondingCurveClient.create(connection, 'finalized');
  const owner = signer.publicKey, vault = owner.toBase58();
  const graduated = dammCollector || createRewardDammCollector({ connection, owner });
  async function inspect(program) {
    assertTokenRewardPolicy(program.ledger.policy);
    if (program.vault !== vault) throw new Error('Wrong fee-vault signer.');
    const p = program.ledger.policy, pool = await sdk.state.getPool(new PublicKey(program.pool));
    const state = pool?.poolState;
    if (!state || state.config.toBase58() !== program.config || state.baseMint.toBase58() !== program.ledger.mint || state.creator.toBase58() !== p.creator) throw new Error('Pool does not match the registered launch.');
    const config = await sdk.state.getPoolConfig(new PublicKey(program.config));
    if (!config || config.quoteMint.toBase58() !== p.quoteMint || config.feeClaimer.toBase58() !== vault || config.leftoverReceiver.toBase58() !== p.creator ||
        config.creatorTradingFeePercentage !== 0 || config.collectFeeMode !== CollectFeeMode.QuoteToken || config.quoteTokenFlag !== 0 || config.tokenType !== TokenType.SPLToken || config.tokenDecimal !== 6 ||
        config.partnerPermanentLockedLiquidityPercentage !== 100 || config.partnerLiquidityPercentage !== 0 || config.creatorLiquidityPercentage !== 0 || config.creatorPermanentLockedLiquidityPercentage !== 0 ||
        config.migrationOption !== MigrationOption.MET_DAMM_V2 || config.migrationFeeOption !== MigrationFeeOption.Customizable || config.migratedCollectFeeMode !== MigratedCollectFeeMode.QuoteToken || config.migratedPoolFeeBps !== 100) throw new Error('Pool fee authority, asset or allocation does not match the reviewed policy.');
    const mint = new PublicKey(p.payoutMint), parsed = inspectRewardMint(p.payoutMint, await connection.getAccountInfo(mint, 'finalized'));
    if (parsed.decimals !== p.asset.decimals) throw new Error('Payout decimals changed.');
    return { state, config, mint, ata: getAssociatedTokenAddressSync(mint, owner) };
  }
  async function finish(tx, program, kind, rows = []) {
    const block = await connection.getLatestBlockhash('finalized'); tx.feePayer = owner; tx.recentBlockhash = block.blockhash;
    tx.instructions.unshift(ComputeBudgetProgram.setComputeUnitLimit({ units: 300000 }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 }));
    tx.sign(signer);
    const raw = tx.serialize(); if (raw.length > 1232) throw new Error('Payout transaction is too large; no transaction sent.');
    const [balance, fee, rent] = await Promise.all([connection.getBalance(owner, 'finalized'), connection.getFeeForMessage(tx.compileMessage(), 'finalized'), connection.getMinimumBalanceForRentExemption(165)]);
    const worstRent = rent * (kind === 'payout' ? rows.length : 2), cap = program.maxNetworkCostLamports;
    if (!Number.isSafeInteger(cap) || cap <= 0 || !Number.isSafeInteger(fee.value) || fee.value + worstRent > cap || balance < fee.value + worstRent + 5000000) throw new Error('Fee vault needs SOL for the reviewed network/rent budget. Tokens remain reserved.');
    const sim = await connection.simulateTransaction(VersionedTransaction.deserialize(raw), { sigVerify: true, commitment: 'confirmed' });
    if (sim.value.err) throw new Error('Reward transaction simulation failed. Nothing submitted.');
    return { kind, rows, signature: bs58.encode(tx.signature), rawBase64: raw.toString('base64'), blockhash: block.blockhash, lastValidBlockHeight: block.lastValidBlockHeight, mint: program.ledger.policy.payoutMint, networkCostCapLamports: cap };
  }
  return {
    async verify(program) { await inspect(program); return true; },
    async balance(program) { const { ata, mint } = await inspect(program), info = await connection.getAccountInfo(ata, 'finalized'); if (!info) return '0'; const account = unpackAccount(ata, info); if (!account.owner.equals(owner) || !account.mint.equals(mint) || account.isFrozen) throw new Error('Invalid reward vault token account.'); return account.amount.toString(); },
    async prepareCollection(program) {
      const { state, mint } = await inspect(program);
      const done = program.collectionSources || [];
      const amount = new BN(state.partnerQuoteFee.toString());
      // Final DBC fees remain claimable after graduation. Collect both sources,
      // once each per cycle, instead of abandoning the old pool's balance.
      if (!done.includes('dbc') && !amount.isZero() && amount.gte(new BN(program.minimumCollectionRaw))) {
        const tx = await sdk.partner.claimPartnerTradingFeeToReceiver({ feeClaimer: owner, payer: owner, pool: new PublicKey(program.pool), receiver: owner, maxBaseAmount: new BN(0), maxQuoteAmount: amount });
        if (mint.equals(NATIVE_MINT)) retainWrappedRewardVault(tx, owner);
        return { ...await finish(tx, program, 'collection'), collectionSource: 'dbc' };
      }
      if (state.isMigrated && !done.includes('damm-v2')) {
        const tx = await graduated.prepare({ baseMint: program.ledger.mint, quoteMint: mint.toBase58(), minimumRaw: program.minimumCollectionRaw });
        if (tx) return { ...await finish(tx, program, 'collection'), collectionSource: 'damm-v2' };
      }
      return null;
    },
    async preparePayout(program, rows) { await inspect(program); return finish(new Transaction().add(...tokenRewardTransferInstructions({ asset: program.ledger.policy.asset, vault, rows })), program, 'payout', rows); },
    async broadcast(pending) { const tx = Transaction.from(Buffer.from(pending.rawBase64, 'base64')); if (!tx.verifySignatures() || !tx.feePayer.equals(owner) || bs58.encode(tx.signature) !== pending.signature) throw new Error('Saved reward transaction failed signature checks.'); return connection.sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 2 }); },
    async receipt(program, pending) {
      const status = (await connection.getSignatureStatuses([pending.signature], { searchTransactionHistory: true })).value[0];
      if (!status || status.confirmationStatus !== 'finalized') return { status: 'unknown' };
      if (status.err) return { status: 'failed', finalized: true };
      const tx = await connection.getTransaction(pending.signature, { commitment: 'finalized', maxSupportedTransactionVersion: 0 });
      if (!tx || tx.meta?.err || !tx.meta || !tx.transaction?.signatures?.includes(pending.signature)) return { status: 'unknown' };
      const { mint, ata } = await inspect(program), message = tx.transaction.message;
      const keys = message.staticAccountKeys || message.accountKeys;
      const index = keys?.findIndex(k => k.toBase58() === ata.toBase58());
      if (!(index >= 0)) throw new Error('Confirmed receipt does not include the payout vault.');
      const amountAt = values => { const row = values?.find(r => r.accountIndex === index); if (!row) return 0n; if (row.mint !== mint.toBase58() || row.owner !== vault || row.uiTokenAmount.decimals !== program.ledger.policy.asset.decimals) throw new Error('Confirmed reward token identity differs from the ledger.'); return rewardRaw(row.uiTokenAmount.amount); };
      const before = amountAt(tx.meta.preTokenBalances), after = amountAt(tx.meta.postTokenBalances), delta = after - before;
      if (pending.kind === 'collection') { if (delta <= 0n) throw new Error('No realized quote-token fees found in collection receipt.'); return { status: 'finalized', finalized: true, signature: pending.signature, mint: mint.toBase58(), amountRaw: String(delta), slot: tx.slot }; }
      const total = pending.rows.reduce((a, r) => a + rewardRaw(r.amountRaw), 0n);
      if (delta !== -total) throw new Error('Payout vault debit does not match the saved allocation.');
      for (const row of pending.rows) {
        const dest = getAssociatedTokenAddressSync(mint, new PublicKey(row.wallet)), destinationIndex = keys.findIndex(k => k.equals(dest));
        const pre = tx.meta.preTokenBalances.find(r => r.accountIndex === destinationIndex), post = tx.meta.postTokenBalances.find(r => r.accountIndex === destinationIndex);
        if (!post || post.mint !== mint.toBase58() || post.owner !== row.wallet || post.uiTokenAmount.decimals !== program.ledger.policy.asset.decimals || (pre && (pre.mint !== post.mint || pre.owner !== row.wallet)) || rewardRaw(post.uiTokenAmount.amount) - rewardRaw(pre?.uiTokenAmount?.amount || '0') !== rewardRaw(row.amountRaw)) throw new Error('A recipient did not receive the exact saved payout.');
      }
      return { status: 'finalized', finalized: true, signature: pending.signature, mint: mint.toBase58(), slot: tx.slot };
    },
  };
}
