import { ComputeBudgetProgram, Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, getAssociatedTokenAddressSync, createAssociatedTokenAccountIdempotentInstruction, unpackMint, getTransferFeeConfig } from '@solana/spl-token';
import { initializeWithToken2022, getPdaLaunchpadAuth, getPdaLaunchpadConfigId, getPdaLaunchpadPoolId, getPdaLaunchpadVaultId, getPdaPlatformAllowConfig, getPdaPlatformCurveRule, LaunchpadConfig, PlatformConfig, LaunchpadPool, Curve, buyExactInInstruction, sellExactInInstruction, getPdaPlatformVault, getPdaCreatorVault } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';
import { stonksError } from './slimeStonksExecution.js';
import { cryptoAssetForMint, requireCryptoQuote, cryptoRewardPolicy } from './slimeStonksAssets.js';

// Fixed mainnet program and documented platform identities. A changed
// upstream API response cannot redirect launch fees or choose another program.
export const STONKS_PROGRAM = new PublicKey('LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj');
export const STONKS_PLATFORMS = Object.freeze({ standard: '4E876qZTE9FJMrBzgVtBrSrzz2TLivB5Y5QXPjB4gZL7', reward: '6BwHHDg3u1854jC8PDLXvR4spTcLNaoBxLJNGC4nTESt', community: 'CUqSiwPs6C4WyntMgaFazLp7wYQfaLp5URbjUP9V7SNi' });
const WITHHELD_AUTH = '5KXDF6QnqhBj72hDtJNkkpFaQVUfbFXNybMsp3DiK6tD';
const API = 'https://www.stonkfun.xyz/api/public/v1';
const fail = message => { throw stonksError(422, message); };
const key = value => { try { return new PublicKey(value); } catch { return fail('Invalid Solana address.'); } };
const eq = (a, b) => String(a) === String(b);
const checked = (yes, message) => { if (!yes) fail(message); };

export function validateStonksLaunch({ pair, pricing: p, input: i, now = Date.now(), rewardsValidated = false }) {
  checked(pair?.launchable === true && pair.launchLabReady === true, 'This pairing is not ready for on-chain launches.');
  checked(eq(pair.mint, i.quoteMint) && eq(p?.quote?.mint, i.quoteMint) && eq(p.quote.tokenProgram, pair.tokenProgram) && p.quote.decimals === pair.decimals, 'The launch quote does not match this pairing.');
  requireCryptoQuote(pair);
  requireCryptoQuote(p.quote);
  checked(Number.isFinite(Date.parse(p.prices?.observedAt)) && Math.abs(now - Date.parse(p.prices.observedAt)) < 120000, 'Launch pricing is stale. Refresh before signing.');
  const mode = i.mode, curve = p.curve;
  checked(Object.hasOwn(STONKS_PLATFORMS, mode), 'Unknown launch model.');
  checked(eq(curve?.programId, STONKS_PROGRAM) && eq(p.platform?.[mode], STONKS_PLATFORMS[mode]), 'Launch program or fee platform changed; review is required.');
  checked(curve.curveType === 'ConstantCurve' && curve.migrateType === 'cpmm' && curve.baseDecimals === 6 && curve.supply === '1000000000000000' && curve.totalSellA === '793100000000000' && curve.cpmmCreatorFeeOn === 0 && curve.migrateFeeRaw === '0', 'The documented launch shape changed; signing is paused.');
  checked(['totalLockedAmount', 'cliffPeriod', 'unlockPeriod'].every(k => curve.vesting?.[k] === '0'), 'Unexpected vesting in launch parameters.');
  checked(/^[1-9]\d{0,18}$/.test(p.raise?.raw || '') && BigInt(p.raise.raw) < 2n ** 64n, 'Invalid quote-denominated raise target.');
  checked(typeof i.name === 'string' && i.name.trim().length > 0 && Buffer.byteLength(i.name) <= 32 && !/[\x00-\x1f]/.test(i.name) && /^[A-Za-z0-9]{1,10}$/.test(i.symbol || ''), 'Use a name up to 32 UTF-8 bytes and an alphanumeric ticker up to 10 characters.');
  checked(/^https:\/\/gateway\.pinata\.cloud\/ipfs\/[a-zA-Z0-9]+$/.test(i.metadataUri || '') && i.metadataUri.length <= 200, 'Verified launch metadata is required.');
  checked([TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(pair.tokenProgram), 'Unsupported quote token program.');
  checked(mode === 'standard' ? i.transferFeeBps === 0 : rewardsValidated && [100, 300].includes(i.transferFeeBps) && p.modes?.reward?.transferFeeBps?.includes(i.transferFeeBps), 'This fee model has not completed payout validation.');
  if (mode === 'community') checked(pair.communityMode === true && p.communityMode?.offeredOnThisQuote === true && p.communityMode.shareBps === 3300, 'Community allocation is unavailable or has changed.');
  const quote = key(i.quoteMint), platform = key(STONKS_PLATFORMS[mode]), config = getPdaLaunchpadConfigId(STONKS_PROGRAM, quote, 0, 0).publicKey;
  const allow = getPdaPlatformAllowConfig(STONKS_PROGRAM, platform, config).publicKey, rule = getPdaPlatformCurveRule(STONKS_PROGRAM, platform, config).publicKey;
  checked(eq(config, curve.configId) && eq(allow, p.allowConfig?.[mode]) && eq(rule, p.curveRule?.[mode]), 'Derived launch configuration does not match the published configuration.');
  const rewardPolicy = cryptoRewardPolicy({ quote: pair, mode, transferFeeBps: i.transferFeeBps, communityShareBps: p.communityMode?.shareBps });
  return { creator: key(i.wallet), quote, platform, config, allow, rule, quoteProgram: key(pair.tokenProgram), name: i.name.trim(), symbol: i.symbol, metadataUri: i.metadataUri, raiseRaw: p.raise.raw, transferFeeBps: i.transferFeeBps, mode, pricing: p, pair, rewardPolicy };
}

export function buildStonksLaunchInstruction(spec, mint) {
  const pool = getPdaLaunchpadPoolId(STONKS_PROGRAM, mint, spec.quote).publicKey;
  const instruction = initializeWithToken2022(STONKS_PROGRAM, spec.creator, spec.creator, spec.config, spec.platform, getPdaLaunchpadAuth(STONKS_PROGRAM).publicKey, pool, mint, spec.quote,
    getPdaLaunchpadVaultId(STONKS_PROGRAM, pool, mint).publicKey, getPdaLaunchpadVaultId(STONKS_PROGRAM, pool, spec.quote).publicKey, spec.quoteProgram,
    6, spec.name, spec.symbol, spec.metadataUri,
    { type: 'ConstantCurve', supply: new BN('1000000000000000'), totalSellA: new BN('793100000000000'), totalFundRaisingB: new BN(spec.raiseRaw), migrateType: 'cpmm' },
    new BN(0), new BN(0), new BN(0), 0,
    spec.transferFeeBps ? { transferFeeBasePoints: spec.transferFeeBps, maxinumFee: new BN('1000000000000000') } : undefined,
    spec.allow, spec.rule);
  checked(instruction.keys.length === 17 && instruction.keys[10].pubkey.equals(TOKEN_2022_PROGRAM_ID) && instruction.keys[11].pubkey.equals(spec.quoteProgram), 'Launch account shape failed validation.');
  return { instruction, pool };
}

export function stonksRawAmount(value, decimals) {
  checked(typeof value === 'string' && /^(?:0|[1-9]\d{0,15})(?:\.\d{1,18})?$/.test(value) && Number.isInteger(decimals) && decimals >= 0 && decimals <= 18, 'Enter a positive decimal token amount.');
  const [whole, fraction = ''] = value.split('.'); checked(fraction.length <= decimals, 'Too many decimal places for this token.');
  const raw = BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, '0') || '0');
  checked(raw > 0n && raw < 2n ** 64n, 'Token amount is outside the supported range.'); return new BN(raw.toString());
}

export function createStonksFreeConnection() {
  // Deliberately does not read the application's paid/Helius RPC configuration.
  return new Connection('https://api.mainnet-beta.solana.com', { commitment: 'confirmed', disableRetryOnRateLimit: true,
    fetch: (url, options) => fetch(url, { ...options, signal: AbortSignal.timeout(12000) }) });
}

export function createStonksNativeBuilder({ rpc, metadata, fetchImpl = fetch, now = Date.now, rewardsValidated = false }) {
  async function data(route) {
    const response = await fetchImpl(API + route, { headers: { Accept: 'application/json' }, redirect: 'error', credentials: 'omit', signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw stonksError(response.status === 403 ? 403 : 502, response.status === 403 ? 'This operation is unavailable under current access rules.' : 'Current launch configuration could not be verified.');
    const reader = response.body.getReader(); let size = 0; const chunks = [];
    try { while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 1500000) throw Error('Size'); chunks.push(Buffer.from(value)); } return JSON.parse(Buffer.concat(chunks).toString('utf8')).data; }
    catch { throw stonksError(502, 'Invalid market configuration response.'); } finally { await reader.cancel().catch(() => {}); }
  }
  async function finish(wallet, instructions, review, extraSigners = []) {
    const block = await rpc.getLatestBlockhash('confirmed');
    const tx = new Transaction({ feePayer: wallet, ...block }).add(ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 }), ...instructions);
    if (extraSigners.length) tx.partialSign(...extraSigners);
    const before = await rpc.getBalance(wallet, 'confirmed');
    const [simulation, networkFee] = await Promise.all([
      rpc.simulateTransaction(VersionedTransaction.deserialize(tx.serialize({ requireAllSignatures: false })), { sigVerify: false, commitment: 'confirmed', accounts: { encoding: 'base64', addresses: [wallet.toBase58()] } }),
      rpc.getFeeForMessage(tx.compileMessage(), 'confirmed'),
    ]);
    if (simulation.value.err) throw stonksError(422, 'Launch or swap simulation failed. No transaction was sent. Check token balances and SOL for network fees.');
    const after = simulation.value.accounts?.[0]?.lamports, fee = networkFee.value;
    checked(Number.isSafeInteger(after) && Number.isSafeInteger(fee), 'Network cost could not be verified.');
    // Simulation balance already includes the fee; quote a conservative upper bound.
    const maxSolCostLamports = Math.max(fee, before - after) + fee;
    checked(before >= maxSolCostLamports + 1000000, 'Keep enough SOL for account rent, network fees and a small reserve.');
    checked(maxSolCostLamports <= 100000000, 'Unexpected SOL debit above the safety cap. No transaction was sent.');
    return { transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'), lastValidBlockHeight: block.lastValidBlockHeight,
      review: { ...review, network: 'mainnet-beta', maxSolCostLamports, networkFeeLamports: fee, priorityFeeLamports: 6000, simulationSlot: simulation.context.slot, simulatedAt: now() } };
  }
  async function launch(input) {
    const [catalog, pricing] = await Promise.all([data('/pairs?launchable=true&launchLabReady=true'), data('/launchlab/pricing?quoteMint=' + key(input.quoteMint).toBase58())]);
    const pair = catalog.pairs?.find(p => p.mint === input.quoteMint);
    // Validate before any upload; the real metadata URI is substituted afterwards.
    const preliminary = validateStonksLaunch({ pair, pricing, input: { ...input, metadataUri: 'https://gateway.pinata.cloud/ipfs/pending' }, now: now(), rewardsValidated });
    const accounts = await rpc.getMultipleAccountsInfo([preliminary.config, preliminary.platform, preliminary.allow, preliminary.rule, preliminary.quote], 'confirmed');
    checked(accounts.slice(0, 4).every(a => a?.owner.equals(STONKS_PROGRAM)), 'Launch configuration accounts are missing or owned by a different program.');
    const config = LaunchpadConfig.decode(accounts[0].data), platform = PlatformConfig.decode(accounts[1].data);
    checked(config.mintB.equals(preliminary.quote) && config.curveType === 0 && config.migrateFee.isZero() && accounts[4]?.owner.equals(preliminary.quoteProgram), 'On-chain quote configuration differs from the reviewed launch.');
    if (preliminary.transferFeeBps) checked(platform.transferFeeExtensionAuth.toBase58() === WITHHELD_AUTH, 'Holder reward authority differs from the documented collector.');
    const mintInfo = unpackMint(preliminary.quote, accounts[4], preliminary.quoteProgram);
    checked(mintInfo.decimals === pair.decimals && mintInfo.isInitialized, 'Quote token decimals or initialization do not match.');
    const metadataUri = await metadata(input);
    const spec = validateStonksLaunch({ pair, pricing, input: { ...input, metadataUri }, now: now(), rewardsValidated });
    const mint = Keypair.generate(), { instruction, pool } = buildStonksLaunchInstruction(spec, mint.publicKey);
    return finish(spec.creator, [instruction], { operation: 'launch', name: spec.name, symbol: spec.symbol, mint: mint.publicKey.toBase58(), pool: pool.toBase58(), creator: input.wallet, quoteMint: input.quoteMint, quoteSymbol: spec.rewardPolicy.pairingAsset.symbol, feeModel: spec.mode, transferFeeBps: spec.transferFeeBps, rewardPolicy: spec.rewardPolicy, creatorFees: spec.rewardPolicy.creatorFeePosition ? 'Forwarded automatically by external infrastructure after indexing; delivery is not guaranteed by confirmation.' : 'No separate creator-fee position. Holder rewards use the pairing asset, not SOL conversion.', metadataUri, devBuy: false, supply: '1000000000', raiseTargetRaw: spec.raiseRaw, raiseTargetDecimals: pair.decimals }, [mint]);
  }
  async function swap(input) {
    checked(['buy', 'sell'].includes(input.operation), 'Unsupported operation.');
    checked(Number.isInteger(input.slippageBps) && input.slippageBps >= 10 && input.slippageBps <= 500, 'Slippage must be between 0.1% and 5%.');
    const mint = key(input.mint), wallet = key(input.wallet), record = await data('/tokens/' + mint.toBase58());
    checked(record.token?.mint === input.mint && record.token.launchpad === 'launchlab', 'A verified native LaunchLab market is required.');
    const quoteAsset = cryptoAssetForMint(record.token.quote?.mint);
    checked(quoteAsset, 'This market is not paired with an enabled crypto quote asset.');
    const quote = key(record.token.quote?.mint), poolId = getPdaLaunchpadPoolId(STONKS_PROGRAM, mint, quote).publicKey;
    checked(record.token.pool === poolId.toBase58(), 'Indexed pool does not match the native market.');
    const poolAccount = await rpc.getAccountInfo(poolId, 'confirmed');
    checked(poolAccount?.owner.equals(STONKS_PROGRAM), 'The pool is unavailable or has changed programs.');
    const pool = LaunchpadPool.decode(poolAccount.data);
    checked(pool.status === 0, 'This coin has migrated or paused. Graduated-pool trading is not enabled here yet.');
    checked(pool.mintA.equals(mint) && pool.mintB.equals(quote) && Object.values(STONKS_PLATFORMS).includes(pool.platformId.toBase58()), 'The on-chain market does not match this coin.');
    const infos = await rpc.getMultipleAccountsInfo([pool.configId, pool.platformId, mint, quote], 'confirmed');
    checked(infos[0]?.owner.equals(STONKS_PROGRAM) && infos[1]?.owner.equals(STONKS_PROGRAM), 'Invalid market configuration ownership.');
    const config = LaunchpadConfig.decode(infos[0].data), platform = PlatformConfig.decode(infos[1].data);
    checked(config.curveType === 0 && config.mintB.equals(quote), 'This market uses an unsupported curve.');
    const programs = infos.slice(2).map(info => { checked(info && [TOKEN_PROGRAM_ID.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58()].includes(info.owner.toBase58()), 'Unsupported token owner.'); return info.owner; });
    const mints = [unpackMint(mint, infos[2], programs[0]), unpackMint(quote, infos[3], programs[1])];
    requireCryptoQuote({ mint: quote.toBase58(), decimals: mints[1].decimals, tokenProgram: programs[1].toBase58() });
    checked(mints[0].decimals === pool.mintDecimalsA && mints[1].decimals === pool.mintDecimalsB, 'Token decimals differ from the pool.');
    const slot = await rpc.getSlot('confirmed'), buying = input.operation === 'buy';
    const amount = stonksRawAmount(input.amount, mints[buying ? 1 : 0].decimals);
    const common = { poolInfo: pool, protocolFeeRate: config.tradeFeeRate, platformFeeRate: platform.feeRate, creatorFeeRate: platform.creatorFeeRate, curveType: config.curveType, shareFeeRate: new BN(0), transferFeeConfigA: getTransferFeeConfig(mints[0]) || undefined, transferFeeConfigB: getTransferFeeConfig(mints[1]) || undefined, slot };
    const calculation = buying ? Curve.buyExactIn({ ...common, amountB: amount }) : Curve.sellExactIn({ ...common, amountA: amount });
    const expected = buying ? calculation.amountA.amount.sub(calculation.amountA.fee || new BN(0)) : calculation.amountB;
    const minimum = expected.muln(10000 - input.slippageBps).divn(10000);
    checked(minimum.gt(new BN(0)), 'The minimum received amount is zero. Choose a larger amount.');
    const atas = [getAssociatedTokenAddressSync(mint, wallet, false, programs[0]), getAssociatedTokenAddressSync(quote, wallet, false, programs[1])];
    const source = await rpc.getTokenAccountBalance(atas[buying ? 1 : 0], 'confirmed').catch(() => null);
    checked(source?.value?.amount && new BN(source.value.amount).gte(amount), 'Insufficient input-token balance. Trades here use the displayed quote asset, not automatic SOL conversion.');
    const instruction = (buying ? buyExactInInstruction : sellExactInInstruction)(STONKS_PROGRAM, wallet, getPdaLaunchpadAuth(STONKS_PROGRAM).publicKey, pool.configId, pool.platformId, poolId,
      atas[0], atas[1], pool.vaultA, pool.vaultB, mint, quote, programs[0], programs[1], getPdaPlatformVault(STONKS_PROGRAM, pool.platformId, quote).publicKey, getPdaCreatorVault(STONKS_PROGRAM, pool.creator, quote).publicKey,
      buying && calculation.amountB.lt(amount) ? calculation.amountB : amount, minimum, new BN(0));
    const target = buying ? 0 : 1;
    return finish(wallet, [createAssociatedTokenAccountIdempotentInstruction(wallet, atas[target], wallet, target === 0 ? mint : quote, programs[target]), instruction],
      { operation: input.operation, mint: input.mint, symbol: record.token.symbol, quoteMint: quote.toBase58(), quoteSymbol: quoteAsset.symbol, inputRaw: amount.toString(), inputDecimals: mints[buying ? 1 : 0].decimals, expectedOutputRaw: expected.toString(), minOutputRaw: minimum.toString(), outputDecimals: mints[buying ? 0 : 1].decimals, slippageBps: input.slippageBps, transferFeesIncluded: true, quoteOnly: true });
  }
  return async input => input.operation === 'launch' ? launch(input) : swap(input);
}
