import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { TOKEN_2022_PROGRAM_ID, MintLayout } from '@solana/spl-token';
import bs58 from 'bs58';
import {
  checkStonksEligibility, createStonksIntentService, verifyStonksEdge, createDurableStonksStore,
} from '../src/lib/slimeStonksExecution.js';
import { buildStonksLaunchInstruction, validateStonksLaunch, STONKS_PLATFORMS, STONKS_PROGRAM, stonksRawAmount, createStonksNativeBuilder } from '../src/lib/slimeStonksNative.js';
import { createStonksExecutionApi, stonksExecutionReadiness } from '../src/lib/slimeStonksApi.js';
import { attestStonksRequest } from '../scripts/lib/slimestonks-edge.js';
import nacl from 'tweetnacl';
import { getPdaLaunchpadConfigId, getPdaPlatformAllowConfig, getPdaPlatformCurveRule, getPdaLaunchpadPoolId, getPdaLaunchpadVaultId, LaunchpadConfig, PlatformConfig, LaunchpadPool } from '@raydium-io/raydium-sdk-v2';
import BN from 'bn.js';

const wallet = Keypair.generate(), other = Keypair.generate();
const quote = new PublicKey('XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W');
function fixture() {
  const configId = getPdaLaunchpadConfigId(STONKS_PROGRAM, quote, 0, 0).publicKey;
  const pricing = {
    quote: { mint: quote.toBase58(), decimals: 8, tokenProgram: TOKEN_2022_PROGRAM_ID.toBase58() },
    prices: { observedAt: new Date().toISOString() }, raise: { raw: '1310696504' },
    curve: { programId: STONKS_PROGRAM.toBase58(), configId: configId.toBase58(), curveType: 'ConstantCurve', migrateType: 'cpmm', baseDecimals: 6, supply: '1000000000000000', totalSellA: '793100000000000', vesting: { totalLockedAmount: '0', cliffPeriod: '0', unlockPeriod: '0' }, cpmmCreatorFeeOn: 0, migrateFeeRaw: '0' },
    platform: STONKS_PLATFORMS,
    allowConfig: {}, curveRule: {}, modes: { reward: { transferFeeBps: [100, 300] } }, communityMode: { offeredOnThisQuote: true, shareBps: 3300 },
  };
  for (const [mode, platform] of Object.entries(STONKS_PLATFORMS)) {
    pricing.allowConfig[mode] = getPdaPlatformAllowConfig(STONKS_PROGRAM, new PublicKey(platform), configId).publicKey.toBase58();
    pricing.curveRule[mode] = getPdaPlatformCurveRule(STONKS_PROGRAM, new PublicKey(platform), configId).publicKey.toBase58();
  }
  return { pair: { ...pricing.quote, launchable: true, launchLabReady: true, communityMode: true }, pricing,
    input: { wallet: wallet.publicKey.toBase58(), quoteMint: quote.toBase58(), name: 'Slime example', symbol: 'SLM', mode: 'standard', transferFeeBps: 0, metadataUri: 'https://gateway.pinata.cloud/ipfs/bafkreiexample' } };
}

test('native launch validates exact documented shape and both trailing PDA accounts', () => {
  const f = fixture(), mint = Keypair.generate().publicKey;
  const spec = validateStonksLaunch(f);
  const { instruction, pool } = buildStonksLaunchInstruction(spec, mint);
  assert.equal(instruction.programId.toBase58(), STONKS_PROGRAM.toBase58());
  assert.equal(instruction.keys.length, 17);
  assert.equal(instruction.keys[1].pubkey.toBase58(), wallet.publicKey.toBase58());
  assert.equal(instruction.keys[5].pubkey.toBase58(), pool.toBase58());
  assert.equal(instruction.keys[10].pubkey.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58());
  assert.equal(instruction.keys[11].pubkey.toBase58(), TOKEN_2022_PROGRAM_ID.toBase58());
  assert.equal(instruction.keys.at(-2).pubkey.toBase58(), f.pricing.allowConfig.standard);
  assert.equal(instruction.keys.at(-1).pubkey.toBase58(), f.pricing.curveRule.standard);
  assert.equal(instruction.keys.at(-1).isWritable, false);
  assert.equal(instruction.data[instruction.data.length - 11], 0, 'standard omits transfer fee option');
});

test('launch refuses stale prices, platform substitution, mismatched quote, changed curve, tax and vesting', () => {
  const mutate = [
    f => { f.pricing.prices.observedAt = '2020-01-01'; },
    f => { f.pricing.platform = { ...f.pricing.platform, standard: other.publicKey.toBase58() }; },
    f => { f.pricing.quote.mint = other.publicKey.toBase58(); },
    f => { f.pricing.curve.supply = '2000000000000000'; },
    f => { f.pricing.curve.vesting.totalLockedAmount = '1'; },
    f => { f.pricing.allowConfig.standard = other.publicKey.toBase58(); },
    f => { f.input.transferFeeBps = 100; },
    f => { f.pair.launchLabReady = null; },
    f => { f.input.name = '😀'.repeat(32); },
  ];
  for (const change of mutate) { const f = fixture(); change(f); assert.throws(() => validateStonksLaunch(f)); }
  const f = fixture(); f.input.mode = 'reward'; f.input.transferFeeBps = 100;
  assert.throws(() => validateStonksLaunch(f), /validation/i, 'taxed launch cannot silently enable before payout validation');
});

test('eligibility fails closed and cannot trust browser geo headers or checkbox alone', () => {
  assert.throws(() => checkStonksEligibility({ country: 'DE' }, {}), /eligibility/i);
  for (const country of ['', 'XX', 'US', 'CA', 'GB', 'IR', 'KP', 'RU', 'BY', 'SY', 'CU']) {
    assert.throws(() => checkStonksEligibility({ verified: true, country }, { eligible: true, adult: true, sanctionsClear: true, assetTermsAccepted: true }));
  }
  assert.equal(checkStonksEligibility({ verified: true, country: 'DE' }, { eligible: true, adult: true, sanctionsClear: true, assetTermsAccepted: true }).country, 'DE');
  const secret = 's'.repeat(40), timestamp = String(Date.now()), path = '/api/web/stonks/execution/prepare', body = '{"a":1}';
  const message = [timestamp, 'DE', 'POST', path, body].join('\n');
  const signature = createHmac('sha256', secret).update(message).digest('hex');
  const headers = { 'x-sw-geo-country': 'DE', 'x-sw-geo-time': timestamp, 'x-sw-geo-signature': signature, 'cf-ipcountry': 'US' };
  assert.equal(verifyStonksEdge({ headers, method: 'POST', path, body }, secret).country, 'DE');
  assert.equal(verifyStonksEdge({ headers, method: 'POST', path, body: '{"a":2}' }, secret).verified, false);
  assert.equal(verifyStonksEdge({ headers: { 'cf-ipcountry': 'DE' }, method: 'POST', path, body }, secret).verified, false);
  assert.equal(verifyStonksEdge({ headers, method: 'POST', path, body }, '').verified, false);
});

function harness(overrides = {}) {
  let database = { version: 1, intents: [] }, sends = 0, builds = 0, now = 1000, status = null;
  let queue = Promise.resolve();
  const store = { mutate: fn => { const job = queue.then(async () => { const draft = structuredClone(database); const result = await fn(draft); database = draft; return result; }); queue = job.catch(() => {}); return job; } };
  const rpc = {
    getSignatureStatuses: async () => ({ value: [status] }), getBlockHeight: async () => 10,
    simulateTransaction: async () => ({ value: { err: null } }),
    sendRawTransaction: async bytes => { sends++; assert.ok(database.intents[0].signedTransaction, 'persist signed bytes before broadcasting'); return bs58.encode(Transaction.from(bytes).signature); }, ...overrides,
  };
  const build = async () => {
    builds++;
    const tx = new Transaction({ feePayer: wallet.publicKey, recentBlockhash: Keypair.generate().publicKey.toBase58() }).add(SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: other.publicKey, lamports: 1 }));
    return { transaction: tx.serialize({ requireAllSignatures: false }).toString('base64'), lastValidBlockHeight: 100, review: { type: 'fixture', mint: quote.toBase58(), inputRaw: '1' } };
  };
  const service = createStonksIntentService({ store, rpc, build, now: () => now });
  const input = { operation: 'buy', wallet: wallet.publicKey.toBase58(), mint: quote.toBase58(), amount: '1', requestId: 'valid-request-id-1234' };
  const sign = prepared => { const tx = Transaction.from(Buffer.from(prepared.transaction, 'base64')); tx.partialSign(wallet); return tx.serialize().toString('base64'); };
  return { service, input, sign, get sends() { return sends; }, get builds() { return builds; }, get db() { return database; }, setStatus: value => { status = value; }, advance: ms => { now += ms; }, store, rpc, build };
}

test('duplicate prepare is coalesced durably; changed payload under same key is rejected', async () => {
  const h = harness(); const [a, b] = await Promise.all([h.service.prepare(h.input), h.service.prepare(h.input)]);
  assert.equal(a.intentId, b.intentId); assert.equal(h.builds, 1);
  await assert.rejects(h.service.prepare({ ...h.input, amount: '2' }), /different/i);
  await assert.rejects(h.service.prepare({ ...h.input, requestId: 'another-request-id-1234' }), /unresolved/i);
});

test('signed message and all signatures must match; wrong wallet cannot inspect or submit', async () => {
  const h = harness(), p = await h.service.prepare(h.input);
  const tx = Transaction.from(Buffer.from(p.transaction, 'base64'));
  tx.instructions[0] = SystemProgram.transfer({ fromPubkey: wallet.publicKey, toPubkey: other.publicKey, lamports: 2 }); tx.partialSign(wallet);
  await assert.rejects(h.service.submit(p.intentId, h.input.wallet, tx.serialize().toString('base64')), /match/i);
  await assert.rejects(h.service.status(p.intentId, other.publicKey.toBase58()), /found/i);
  await assert.rejects(h.service.submit(p.intentId, h.input.wallet, p.transaction), /signature/i);
  assert.equal(h.sends, 0);
});

test('ambiguous send survives restart and never builds a replacement transaction', async () => {
  const h = harness({ sendRawTransaction: async () => { throw Error('network timeout'); } });
  const p = await h.service.prepare(h.input), signed = h.sign(p);
  const result = await h.service.submit(p.intentId, h.input.wallet, signed);
  assert.equal(result.status, 'submitted_unknown'); assert.ok(result.signature);
  const restart = createStonksIntentService({ store: h.store, rpc: h.rpc, build: h.build, now: () => 2000 });
  assert.equal((await restart.prepare(h.input)).intentId, p.intentId);
  h.setStatus({ err: null, confirmationStatus: 'confirmed', slot: 20 });
  assert.equal((await restart.status(p.intentId, h.input.wallet)).status, 'confirmed');
  assert.equal(h.builds, 1);
});

test('concurrent submit only broadcasts once and confirmation is based on chain receipt', async () => {
  const h = harness(), p = await h.service.prepare(h.input), signed = h.sign(p);
  const [a,b] = await Promise.all([h.service.submit(p.intentId,h.input.wallet,signed), h.service.submit(p.intentId,h.input.wallet,signed)]);
  assert.equal(h.sends,1); assert.equal(a.signature,b.signature); assert.notEqual(a.status,'confirmed');
  h.setStatus({err:null,confirmationStatus:'finalized',slot:30});
  assert.equal((await h.service.status(p.intentId,h.input.wallet)).status,'finalized');
});

test('expired unsigned intent and failed simulation cannot be broadcast', async () => {
  const h = harness(), p = await h.service.prepare(h.input); h.advance(121000);
  await assert.rejects(h.service.submit(p.intentId,h.input.wallet,h.sign(p)),/expired/i); assert.equal(h.sends,0);
  const bad = harness({simulateTransaction:async()=>({value:{err:{InstructionError:[1,'Custom']}}})});
  const bp=await bad.service.prepare(bad.input);
  await assert.rejects(bad.service.submit(bp.intentId,bad.input.wallet,bad.sign(bp)),/simulation/i); assert.equal(bad.sends,0);
});

test('decimal conversion is exact and never rounds floating point or excess precision', () => {
  assert.equal(stonksRawAmount('0.00000001', 8).toString(), '1');
  assert.equal(stonksRawAmount('12345678.12345678', 8).toString(), '1234567812345678');
  for (const value of ['1e-3', '-1', '0', '0.000000001', '1.234567891', 'NaN', ' 1', '18446744073709551616']) assert.throws(() => stonksRawAmount(value, 8));
});

test('retry uses exactly saved bytes, never re-signs or replaces; missing chain result stays unknown', async () => {
  const h = harness(), p = await h.service.prepare(h.input), signed = h.sign(p);
  await h.service.submit(p.intentId, h.input.wallet, signed); h.advance(16000);
  assert.equal((await h.service.retry(p.intentId, h.input.wallet)).status, 'submitted_unknown');
  assert.equal(h.sends, 2); assert.equal(h.builds, 1); assert.equal(h.db.intents[0].signedTransaction, signed);
  h.advance(500000); assert.equal((await h.service.status(p.intentId, h.input.wallet)).status, 'submitted_unknown');
  await assert.rejects(h.service.prepare({ ...h.input, requestId: 'a-second-request-12345' }), /unresolved/);
});

test('durable store persists across instances and refuses corruption or another writer', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'slimestonks-test-')), file = path.join(directory, 'intents.json');
  try {
    const first = createDurableStonksStore(file); await first.mutate(db => { db.intents.push({ id: 'test' }); });
    assert.equal(await createDurableStonksStore(file).mutate(db => db.intents.length), 1);
    await fs.writeFile(file + '.lock', ''); await assert.rejects(first.mutate(() => {}), /busy/); await fs.unlink(file + '.lock');
    await fs.writeFile(file, 'broken'); await assert.rejects(first.mutate(() => {}), /history/);
    assert.equal(await fs.readFile(file, 'utf8'), 'broken', 'corruption must never silently reset the ledger');
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('trusted edge MAC strips spoofed headers and server verifies the exact forwarded request', async () => {
  const env = { SLIMESTONKS_GEO_HMAC_SECRET: 'h'.repeat(48) };
  const req = new Request('https://slimewire.org/api/web/stonks/execution/prepare', { method: 'POST', body: '{"safe":true}', headers: { 'x-sw-geo-country': 'DE', 'x-sw-geo-signature': 'spoof' } });
  Object.defineProperty(req, 'cf', { value: { country: 'US' } });
  const signed = await attestStonksRequest(req, env), headers = Object.fromEntries(signed.headers);
  const proof = verifyStonksEdge({ headers, method: signed.method, path: '/api/web/stonks/execution/prepare', body: await signed.text() }, env.SLIMESTONKS_GEO_HMAC_SECRET);
  assert.equal(proof.country, 'US'); assert.equal(proof.verified, true);
  const noKey = await attestStonksRequest(new Request(req.url, { headers: { 'x-sw-geo-signature': 'spoof' } }), {}); assert.equal(noKey.headers.has('x-sw-geo-signature'), false);
});

test('API is off by default, strict on origin and geography, and wallet proof is one-use', async () => {
  assert.equal(stonksExecutionReadiness({}).pilotConfigured, false);
  assert.equal(stonksExecutionReadiness({ SLIMESTONKS_PILOT_ENABLED: 'true' }).publicTransactionsEnabled, false);
  const env = { SLIMESTONKS_PILOT_ENABLED: 'true', SLIMESTONKS_PILOT_WALLETS: wallet.publicKey.toBase58(), SLIMESTONKS_GEO_HMAC_SECRET: 's'.repeat(48) };
  let result;
  const api = createStonksExecutionApi({ env, readBody: async req => req.body, sendJson: (_req, _res, status, payload) => { result = { status, payload }; } });
  const consent = { eligible: true, adult: true, sanctionsClear: true, assetTermsAccepted: true };
  async function call(action, payload = {}, { country = 'DE', origin = 'https://slimewire.org', signed = true } = {}) {
    const p = '/api/web/stonks/execution/' + action, body = JSON.stringify({ wallet: wallet.publicKey.toBase58(), consent, ...payload }), timestamp = String(Date.now());
    const signature = createHmac('sha256', env.SLIMESTONKS_GEO_HMAC_SECRET).update([timestamp, country, 'POST', p, body].join('\n')).digest('hex');
    const headers = { origin, 'content-type': 'application/json', 'cf-ipcountry': 'DE', ...(signed ? { 'x-sw-geo-country': country, 'x-sw-geo-time': timestamp, 'x-sw-geo-signature': signature } : {}) };
    await api.route({ method: 'POST', headers, body }, {}, new URL(p, 'https://slimewire.org')); return result;
  }
  assert.equal((await call('challenge', {}, { signed: false })).status, 403);
  assert.equal((await call('challenge', {}, { country: 'US' })).status, 403);
  assert.equal((await call('challenge', {}, { origin: 'https://evil.invalid' })).status, 403);
  const challenge = (await call('challenge')).payload.data;
  const signature = Buffer.from(nacl.sign.detached(Buffer.from(challenge.message), wallet.secretKey)).toString('base64');
  assert.equal((await call('verify', { id: challenge.id, signature })).status, 200);
  assert.equal((await call('verify', { id: challenge.id, signature })).status, 401);
  assert.equal((await call('prepare', { input: {} })).status, 401);
  const disabled = createStonksExecutionApi({ env: {}, readBody: () => assert.fail('disabled route must not parse or act on transaction data'), sendJson: (_r, _s, status) => { result = status; } });
  await disabled.route({ method: 'POST', headers: {} }, {}, new URL('https://slimewire.org/api/web/stonks/execution/prepare'));
  assert.equal(result, 503);
});

test('full native launch prepares a simulated two-signer transaction without spending or holding wallet keys', async () => {
  const f = fixture();
  function encoded(layout, fields) { const buffer = Buffer.alloc(layout.span); const defaults = layout.decode(buffer); layout.encode({ ...defaults, ...fields }, buffer); return buffer; }
  const account = (data, owner = STONKS_PROGRAM) => ({ data, owner, lamports: 10000000, executable: false });
  const config = encoded(LaunchpadConfig, { mintB: quote, curveType: 0 });
  const platform = encoded(PlatformConfig, {});
  const mintData = Buffer.alloc(MintLayout.span); MintLayout.encode({ mintAuthorityOption: 0, mintAuthority: PublicKey.default, supply: 10000000000000n, decimals: 8, isInitialized: true, freezeAuthorityOption: 0, freezeAuthority: PublicKey.default }, mintData);
  let simulations = 0, uploads = 0;
  const rpc = {
    getMultipleAccountsInfo: async () => [account(config), account(platform), account(Buffer.alloc(8)), account(Buffer.alloc(8)), account(mintData, TOKEN_2022_PROGRAM_ID)],
    getLatestBlockhash: async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 1234 }),
    getBalance: async () => 1000000000,
    getFeeForMessage: async () => ({ value: 16000 }),
    simulateTransaction: async tx => { simulations++; assert.equal(tx.signatures.length, 2); return { context: { slot: 100 }, value: { err: null, accounts: [{ lamports: 970000000 }] } }; },
    sendRawTransaction: async () => { assert.fail('preparation must not send a transaction'); },
  };
  const builder = createStonksNativeBuilder({ rpc, metadata: async () => { uploads++; return f.input.metadataUri; }, fetchImpl: async url => new Response(JSON.stringify({ data: url.includes('/pairs') ? { pairs: [f.pair] } : f.pricing })) });
  const result = await builder({ ...f.input, operation: 'launch' });
  const transaction = Transaction.from(Buffer.from(result.transaction, 'base64'));
  assert.equal(result.review.creator, wallet.publicKey.toBase58()); assert.equal(result.review.devBuy, false);
  assert.equal(transaction.signatures.length, 2); assert.equal(transaction.signatures[0].signature, null);
  assert.ok(transaction.signatures[1].signature); assert.equal(transaction.verifySignatures(false), true);
  assert.equal(result.lastValidBlockHeight, 1234); assert.equal(simulations, 1); assert.equal(uploads, 1);
  assert.ok(result.review.maxSolCostLamports > 30000000);
  rpc.simulateTransaction = async () => ({ value: { err: 'insufficient funds' } });
  await assert.rejects(builder({ ...f.input, operation: 'launch' }), /simulation failed/i);
});

test('native curve buys and sells encode a nonzero minimum, exact amounts and refuse migrated or substituted pools', async () => {
  const mint = Keypair.generate().publicKey, configId = getPdaLaunchpadConfigId(STONKS_PROGRAM, quote, 0, 0).publicKey, platformId = new PublicKey(STONKS_PLATFORMS.standard);
  const poolId = getPdaLaunchpadPoolId(STONKS_PROGRAM, mint, quote).publicKey;
  function encoded(layout, fields) { const buffer = Buffer.alloc(layout.span); layout.encode({ ...layout.decode(buffer), ...fields }, buffer); return buffer; }
  const fields = { mintA: mint, mintB: quote, configId, platformId, creator: wallet.publicKey, mintDecimalsA: 6, mintDecimalsB: 8, status: 0,
    supply: new BN('1000000000000000'), totalSellA: new BN('793100000000000'), virtualA: new BN('1073025605751775'), virtualB: new BN('462611918'), realA: new BN('100000000000000'), realB: new BN('100000000'), totalFundRaisingB: new BN('1310696504'),
    vaultA: getPdaLaunchpadVaultId(STONKS_PROGRAM, poolId, mint).publicKey, vaultB: getPdaLaunchpadVaultId(STONKS_PROGRAM, poolId, quote).publicKey };
  const account = (data, owner = STONKS_PROGRAM) => ({ data, owner, executable: false, lamports: 10000000 });
  const mintInfo = decimals => { const data = Buffer.alloc(MintLayout.span); MintLayout.encode({ mintAuthorityOption: 0, mintAuthority: PublicKey.default, supply: 1000000000000000n, decimals, isInitialized: true, freezeAuthorityOption: 0, freezeAuthority: PublicKey.default }, data); return account(data, TOKEN_2022_PROGRAM_ID); };
  const token = { mint: mint.toBase58(), pool: poolId.toBase58(), symbol: 'EX', launchpad: 'launchlab', quote: { mint: quote.toBase58(), symbol: 'SPYX' } };
  const rpc = {
    getAccountInfo: async () => account(encoded(LaunchpadPool, fields)),
    getMultipleAccountsInfo: async () => [account(encoded(LaunchpadConfig, { mintB: quote, curveType: 0, tradeFeeRate: new BN(5000) })), account(encoded(PlatformConfig, { feeRate: new BN(10000), creatorFeeRate: new BN(5000) })), mintInfo(6), mintInfo(8)],
    getSlot: async () => 400000000,
    getTokenAccountBalance: async () => ({ value: { amount: '1000000000000000' } }),
    getLatestBlockhash: async () => ({ blockhash: Keypair.generate().publicKey.toBase58(), lastValidBlockHeight: 500 }),
    getBalance: async () => 1000000000, getFeeForMessage: async () => ({ value: 11000 }),
    simulateTransaction: async () => ({ context: { slot: 100 }, value: { err: null, accounts: [{ lamports: 996000000 }] } }),
  };
  const build = createStonksNativeBuilder({ rpc, fetchImpl: async () => new Response(JSON.stringify({ data: { token } })) });
  for (const [operation, amount] of [['buy', '0.01'], ['sell', '100000']]) {
    const out = await build({ operation, mint: mint.toBase58(), wallet: wallet.publicKey.toBase58(), amount, slippageBps: 100 });
    const transaction = Transaction.from(Buffer.from(out.transaction, 'base64')), instruction = transaction.instructions.at(-1);
    assert.equal(instruction.programId.toBase58(), STONKS_PROGRAM.toBase58()); assert.ok(BigInt(out.review.minOutputRaw) > 0n);
    assert.equal(instruction.data.readBigUInt64LE(16).toString(), out.review.minOutputRaw);
    assert.equal(BigInt(out.review.minOutputRaw), BigInt(out.review.expectedOutputRaw) * 9900n / 10000n);
    assert.equal(transaction.signatures.length, 1); assert.equal(transaction.signatures[0].signature, null);
  }
  fields.status = 1; await assert.rejects(build({ operation: 'buy', mint: mint.toBase58(), wallet: wallet.publicKey.toBase58(), amount: '0.01', slippageBps: 100 }), /migrated/);
  fields.status = 0; token.pool = other.publicKey.toBase58(); await assert.rejects(build({ operation: 'buy', mint: mint.toBase58(), wallet: wallet.publicKey.toBase58(), amount: '0.01', slippageBps: 100 }), /match/);
});
