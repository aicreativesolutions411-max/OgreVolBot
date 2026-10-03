import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import bs58 from 'bs58';

export const stonksError = (status, message) => Object.assign(new Error(message), { status });
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const terminal = new Set(['failed', 'expired', 'confirmed', 'finalized']);
const blockedCountries = new Set(['US', 'CA', 'GB', 'CU', 'IR', 'KP', 'SY', 'RU', 'BY', 'XX', 'ZZ', 'T1']);

// Only a trusted edge may assert location. Never trust CF-IPCountry, X-Forwarded-For,
// or a country sent by the browser directly to the public Render origin.
export function verifyStonksEdge({ headers, method, path: requestPath, body = '' }, secret, now = Date.now()) {
  const country = String(headers['x-sw-geo-country'] || ''), time = String(headers['x-sw-geo-time'] || ''), signature = String(headers['x-sw-geo-signature'] || '');
  if (typeof secret !== 'string' || secret.length < 32 || !/^[A-Z]{2}$/.test(country) || !/^\d{13}$/.test(time) || Math.abs(now - Number(time)) > 30000 || !/^[a-f0-9]{64}$/.test(signature)) return { verified: false, country: '' };
  const expected = crypto.createHmac('sha256', secret).update([time, country, method, requestPath, body].join('\n')).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex')) ? { verified: true, country } : { verified: false, country: '' };
}

export function checkStonksEligibility(edge, consent) {
  if (edge?.verified !== true || !/^[A-Z]{2}$/.test(edge.country || '')) throw stonksError(403, 'Transaction eligibility cannot be verified. Trading remains unavailable.');
  if (blockedCountries.has(edge.country)) throw stonksError(403, 'Transactions are unavailable in this jurisdiction. Market browsing is still available.');
  if (!consent || ['eligible', 'adult', 'sanctionsClear', 'assetTermsAccepted'].some(k => consent[k] !== true)) throw stonksError(403, 'Confirm the eligibility and asset-risk statements before continuing.');
  return { country: edge.country };
}

export function createDurableStonksStore(file) {
  let queue = Promise.resolve();
  return { mutate(fn) {
    const run = queue.then(async () => {
      await fs.mkdir(path.dirname(file), { recursive: true });
      // Cross-process exclusion: never expire or steal a financial writer's lock.
      let lock;
      try { lock = await fs.open(file + '.lock', 'wx', 0o600); }
      catch { throw stonksError(503, 'Transaction storage is busy. No new transaction was sent.'); }
      const tmp = file + '.' + crypto.randomUUID() + '.tmp';
      try {
        let db;
        try { db = JSON.parse(await fs.readFile(file, 'utf8')); }
        catch (e) { if (e.code !== 'ENOENT') throw stonksError(503, 'Transaction history needs attention. Execution is paused.'); db = { version: 1, intents: [] }; }
        if (db.version !== 1 || !Array.isArray(db.intents)) throw stonksError(503, 'Transaction history needs attention. Execution is paused.');
        const result = await fn(db);
        const handle = await fs.open(tmp, 'wx', 0o600);
        try { await handle.writeFile(JSON.stringify(db)); await handle.sync(); } finally { await handle.close(); }
        await fs.rename(tmp, file);
        return result;
      } finally { await fs.unlink(tmp).catch(() => {}); await lock.close(); await fs.unlink(file + '.lock'); }
    });
    queue = run.catch(() => {}); return run;
  } };
}

function publicIntent(row) {
  return { intentId: row.id, operation: row.operation, wallet: row.wallet, status: row.status, review: row.review,
    transaction: row.status === 'prepared' ? row.transaction : undefined, expiresAt: row.expiresAt,
    signature: row.signature || null, slot: row.slot || null, createdAt: row.createdAt, updatedAt: row.updatedAt,
    message: row.message || '', receipt: row.signature ? 'https://solscan.io/tx/' + row.signature : null };
}

export function createStonksIntentService({ store, rpc, build, now = Date.now, maxRecords = 2000, audit = () => {} }) {
  const log = (row, reason) => audit({ tradeId: row.id || row.intentId, userId: 'wallet:' + row.wallet, symbol: row.review?.symbol || '', side: row.operation, entryPrice: null, currentPrice: null, stopLoss: null, takeProfit: null, status: row.status, reason });
  const owned = (db, id, wallet) => {
    const row = db.intents.find(r => r.id === id && r.wallet === wallet);
    if (!row) throw stonksError(404, 'Transaction not found for this wallet.');
    return row;
  };
  async function prepare(input) {
    if (!['launch', 'buy', 'sell'].includes(input.operation) || !/^[a-zA-Z0-9_-]{16,100}$/.test(input.requestId || '')) throw stonksError(400, 'Invalid transaction request.');
    try { if (!PublicKey.isOnCurve(new PublicKey(input.wallet).toBytes())) throw Error(); } catch { throw stonksError(400, 'Connect a valid signing wallet.'); }
    const requestHash = digest(JSON.stringify(input)), id = digest(input.wallet + ':' + input.requestId).slice(0, 40);
    const prepared = await store.mutate(async db => {
      const old = db.intents.find(r => r.id === id);
      if (old) { if (old.requestHash !== requestHash) throw stonksError(409, 'This request ID was already used for a different transaction.'); return publicIntent(old); }
      const resource = input.operation === 'launch' ? input.quoteMint : input.mint;
      if (db.intents.some(r => r.wallet === input.wallet && r.operation === input.operation && r.resource === resource && !terminal.has(r.status))) throw stonksError(409, 'This wallet has an unresolved transaction for this coin. Check its receipt before trying again.');
      if (db.intents.length >= maxRecords) throw stonksError(503, 'Transaction history requires maintenance before new transactions can be prepared.');
      const built = await build(input);
      const tx = Transaction.from(Buffer.from(built.transaction, 'base64'));
      if (!tx.feePayer?.equals(new PublicKey(input.wallet)) || !Number.isSafeInteger(built.lastValidBlockHeight)) throw stonksError(502, 'Transaction construction did not match the connected wallet.');
      const row = { id, requestHash, wallet: input.wallet, operation: input.operation, resource, status: 'prepared',
        transaction: built.transaction, messageHash: digest(tx.serializeMessage()), lastValidBlockHeight: built.lastValidBlockHeight,
        review: built.review, createdAt: now(), updatedAt: now(), expiresAt: now() + 90000 };
      db.intents.push(row); return publicIntent(row);
    });
    log(prepared, 'review_requested'); return prepared;
  }
  async function status(id, wallet) {
    const row = await store.mutate(db => structuredClone(owned(db, id, wallet)));
    if (terminal.has(row.status)) return publicIntent(row);
    if (!row.signature) {
      if (row.expiresAt <= now()) return store.mutate(db => { const r = owned(db, id, wallet); if (!r.signature) { r.status = 'expired'; r.updatedAt = now(); } return publicIntent(r); });
      return publicIntent(row);
    }
    let chain;
    try { chain = (await rpc.getSignatureStatuses([row.signature], { searchTransactionHistory: true })).value[0]; }
    catch { return publicIntent(row); } // Unknown must never become failed or success.
    const reconciled = await store.mutate(db => {
      const r = owned(db, id, wallet);
      if (chain?.err && ['confirmed', 'finalized'].includes(chain.confirmationStatus)) { r.status = 'failed'; r.message = 'The transaction failed on-chain. Review the receipt before retrying.'; }
      else if (chain && ['confirmed', 'finalized'].includes(chain.confirmationStatus)) { r.status = chain.confirmationStatus; r.slot = chain.slot; r.message = r.operation === 'launch' ? 'Confirmed on-chain. Indexing and fee delivery must be checked separately.' : 'Confirmed on-chain. Actual execution amounts are in the receipt.'; }
      // A missing receipt is ambiguous even after blockhash expiry. Do not unlock
      // a replacement purchase based on one RPC node failing to find history.
      r.updatedAt = now(); return publicIntent(r);
    });
    if (reconciled.status !== row.status) log(reconciled, 'chain_receipt_reconciled');
    return reconciled;
  }
  async function submit(id, wallet, signedTransaction, { retry = false } = {}) {
    if (typeof signedTransaction !== 'string' || signedTransaction.length > 1800) throw stonksError(400, 'Invalid signed transaction.');
    let tx;
    try { tx = Transaction.from(Buffer.from(signedTransaction, 'base64')); } catch { throw stonksError(400, 'Invalid signed transaction.'); }
    const reservation = await store.mutate(db => {
      const row = owned(db, id, wallet);
      if (digest(tx.serializeMessage()) !== row.messageHash) throw stonksError(400, 'The signed transaction does not match the reviewed transaction.');
      if (!tx.verifySignatures()) throw stonksError(400, 'A required wallet signature is missing or invalid.');
      const signature = bs58.encode(tx.signature);
      if (row.signature && row.signature !== signature) throw stonksError(409, 'This transaction already has a different signature.');
      if (terminal.has(row.status)) return { done: publicIntent(row) };
      if (row.signature && (!retry || now() - row.lastBroadcastAttemptAt < 15000)) return { done: publicIntent(row) };
      if (!row.signature && row.expiresAt <= now()) throw stonksError(409, 'The unsigned review expired. Refresh its status before preparing again.');
      row.signature = signature; row.signedTransaction = signedTransaction; row.status = 'submitted_unknown'; row.updatedAt = now(); row.lastBroadcastAttemptAt = now();
      row.message = 'Signed transaction saved. Awaiting on-chain confirmation; do not create a replacement.';
      return { row: structuredClone(row) };
    });
    if (reservation.done) return reservation.done;
    const row = reservation.row;
    log(row, retry ? 'same_signed_bytes_retry_requested' : 'signed_intent_persisted_before_broadcast');
    let height;
    try { height = await rpc.getBlockHeight('confirmed'); } catch { return publicIntent(row); }
    if (height > row.lastValidBlockHeight) return status(id, wallet);
    // Simulate the exact signed message (no blockhash replacement) before sending.
    let simulation;
    try { simulation = await rpc.simulateTransaction(VersionedTransaction.deserialize(Buffer.from(signedTransaction, 'base64')), { sigVerify: true, commitment: 'confirmed' }); }
    catch { return publicIntent(row); }
    if (simulation.value.err) {
      // A retry may simulate "already initialized" after an earlier ambiguous send.
      // Keep that original operation unresolved until a receipt is found.
      if (retry) return status(id, wallet);
      await store.mutate(db => { const r = owned(db, id, wallet); r.status = 'failed'; r.message = 'Preflight simulation failed. Nothing was broadcast by SlimeWire.'; r.updatedAt = now(); });
      log({ ...row, status: 'failed' }, 'preflight_simulation_failed_no_broadcast');
      throw stonksError(422, 'Transaction simulation failed. Nothing was broadcast by SlimeWire.');
    }
    try {
      const result = await rpc.sendRawTransaction(Buffer.from(row.signedTransaction, 'base64'), { skipPreflight: false, maxRetries: 2, preflightCommitment: 'confirmed' });
      if (result !== row.signature) throw Error('Unexpected signature');
    } catch { /* Exact bytes/signature are already durable. Never rebuild on timeout. */ }
    return status(id, wallet);
  }
  async function history(wallet) { return store.mutate(db => db.intents.filter(r => r.wallet === wallet).slice(-30).reverse().map(publicIntent)); }
  async function retry(id, wallet) {
    const current = await status(id, wallet);
    if (terminal.has(current.status)) return current;
    const signed = await store.mutate(db => owned(db, id, wallet).signedTransaction);
    if (!signed) throw stonksError(409, 'There is no saved signed transaction to retry.');
    return submit(id, wallet, signed, { retry: true });
  }
  return { prepare, submit, status, history, retry };
}
