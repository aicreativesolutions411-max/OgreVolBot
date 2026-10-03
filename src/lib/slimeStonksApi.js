import crypto from 'node:crypto';
import path from 'node:path';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { createDurableStonksStore, createStonksIntentService, checkStonksEligibility, verifyStonksEdge, stonksError } from './slimeStonksExecution.js';
import { createStonksFreeConnection, createStonksNativeBuilder } from './slimeStonksNative.js';
import { decodeLaunchImageDataUrl, processLaunchImage } from './launchImageProcessor.js';
import { uploadImage, uploadJsonMetadata } from './pinataMetadata.js';

const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const routePrefix = '/api/web/stonks/execution/';
const walletAddress = value => { try { const k = new PublicKey(value); if (!PublicKey.isOnCurve(k.toBytes()) || k.toBase58() !== value) throw Error(); return value; } catch { throw stonksError(400, 'A valid signing wallet is required.'); } };

export function stonksExecutionReadiness(env = process.env) {
  const wallets = String(env.SLIMESTONKS_PILOT_WALLETS || '').split(',').map(v => v.trim()).filter(Boolean);
  const configured = env.SLIMESTONKS_PILOT_ENABLED === 'true' && String(env.SLIMESTONKS_GEO_HMAC_SECRET || '').length >= 32 && wallets.length > 0;
  return { release: 'validation', publicTransactionsEnabled: false, pilotConfigured: configured,
    capabilities: { standardLaunch: configured ? 'eligible-pilot-wallets' : 'disabled', bondingCurveSwap: configured ? 'eligible-pilot-wallets' : 'disabled', rewardLaunch: 'awaiting-payout-validation', graduatedSwap: 'not-enabled', legacyClaim: 'not-enabled', automaticCreatorFees: 'external-automatic-forwarding' },
    checks: [
      { name: 'Native launch and curve-trade construction', status: 'implemented', detail: 'Exact on-chain configuration, transfer fees, minimum output and simulation checks.' },
      { name: 'Signing and duplicate prevention', status: 'implemented', detail: 'Wallet-signed transactions, persistent IDs, exact-byte retries and on-chain receipts.' },
      { name: 'Eligibility enforcement', status: configured ? 'pilot-configured' : 'configuration-required', detail: 'Trusted location verification and an approved eligible pilot wallet are required. U.S., Canadian and U.K. users cannot transact.' },
      { name: 'Live launch adoption and fee delivery', status: 'not-verified', detail: 'An eligible tester must approve a small real launch and confirm indexing and actual fee receipts.' },
      { name: 'Graduated trading and legacy claims', status: 'not-enabled', detail: 'These paths remain unavailable; unsupported actions never fall through to another trading engine.' },
    ] };
}

export function createStonksExecutionApi({ dataDir, readBody, sendJson, env = process.env, now = Date.now, rpc: injectedRpc, store: injectedStore, build: injectedBuild } = {}) {
  const challenges = new Map(), sessions = new Map(), limits = new Map();
  let service;
  const prune = map => { for (const [k, v] of map) if (v.expires <= now()) map.delete(k); };
  const origins = new Set(['https://slimewire.org', 'https://www.slimewire.org', 'https://ogrevolbot.onrender.com']);
  function limited(key, max = 12) {
    prune(limits); const row = limits.get(key) || { count: 0, expires: now() + 60000 };
    if (limits.size >= 2000 || ++row.count > max) throw stonksError(429, 'Please wait a minute before trying again.'); limits.set(key, row);
  }
  function pilot(wallet) {
    const allowed = String(env.SLIMESTONKS_PILOT_WALLETS || '').split(',').map(v => v.trim());
    if (!stonksExecutionReadiness(env).pilotConfigured || !allowed.includes(wallet)) throw stonksError(503, 'Public transactions are not enabled. This integration is awaiting eligible-wallet validation.');
  }
  async function uploadMetadata(input) {
    if (input.imageRights !== true || typeof input.description !== 'string' || input.description.length > 1000 || typeof input.imageData !== 'string' || input.imageData.length > 4200000 || !/^data:image\/(png|jpeg|webp);base64,/.test(input.imageData)) throw stonksError(400, 'Add a PNG, JPEG or WebP under 3 MB and confirm your image rights.');
    const source = decodeLaunchImageDataUrl(input.imageData, { name: input.name, symbol: input.symbol });
    const processed = await processLaunchImage(source, { maxInputBytes: 3 * 1024 * 1024, outputSize: 1000 });
    const image = await uploadImage({ image: processed });
    const metadata = await uploadJsonMetadata({ metadata: { name: input.name.trim(), symbol: input.symbol, description: input.description.trim(), image: image.imageUri, showName: true, createdOn: 'https://slimewire.org/slimestonks' }, filename: input.symbol.toLowerCase() + '-metadata.json' });
    return metadata.uri;
  }
  const engine = () => {
    if (!service) {
      const rpc = injectedRpc || createStonksFreeConnection(), store = injectedStore || createDurableStonksStore(path.join(dataDir, 'slimestonks-intents.json'));
      service = createStonksIntentService({ rpc, store, build: injectedBuild || createStonksNativeBuilder({ rpc, metadata: uploadMetadata }), now,
        audit: event => console.info('slimestonks_execution', JSON.stringify(event)) });
    }
    return service;
  };
  return { async route(request, response, url) {
    if (!url.pathname.startsWith(routePrefix)) return false;
    const send = (status, payload) => sendJson(request, response, status, payload, '', { 'Cache-Control': 'no-store' });
    const action = url.pathname.slice(routePrefix.length);
    try {
      if (request.method === 'GET' && action === 'readiness') { send(200, { ok: true, data: stonksExecutionReadiness(env) }); return true; }
      if (request.method !== 'POST' || !['challenge', 'verify', 'prepare', 'submit', 'status', 'history', 'retry'].includes(action)) throw stonksError(405, 'Unsupported transaction action.');
      if (!stonksExecutionReadiness(env).pilotConfigured) throw stonksError(503, 'Public transactions are not enabled. Eligible-wallet validation is still required.');
      if (!origins.has(String(request.headers.origin || '')) || !/^application\/json(?:;|$)/i.test(String(request.headers['content-type'] || ''))) throw stonksError(403, 'Use the SlimeWire page to review this action.');
      // Read once: the edge MAC binds method, path and the EXACT request body.
      const rawBody = await readBody(request, 4300000);
      const edge = verifyStonksEdge({ headers: request.headers, method: request.method, path: url.pathname + url.search, body: rawBody }, env.SLIMESTONKS_GEO_HMAC_SECRET, now());
      let body; try { body = JSON.parse(rawBody); } catch { throw stonksError(400, 'Invalid JSON request.'); }
      checkStonksEligibility(edge, body.consent);
      const wallet = walletAddress(body.wallet); pilot(wallet); limited('wallet:' + wallet, action === 'status' ? 30 : 12);
      prune(challenges); prune(sessions);
      if (action === 'challenge') {
        if (challenges.size >= 500) throw stonksError(429, 'Wallet verification is busy. Retry shortly.');
        const id = crypto.randomUUID(), expires = now() + 180000;
        const message = ['SlimeWire SlimeStonks', 'Domain: https://slimewire.org', 'Wallet: ' + wallet, 'Purpose: Verify wallet ownership for transaction reviews. This message does not authorize a transfer.', 'Nonce: ' + id, 'Expires: ' + new Date(expires).toISOString()].join('\n');
        challenges.set(id, { wallet, message, expires }); send(200, { ok: true, data: { id, message, expires } }); return true;
      }
      if (action === 'verify') {
        const challenge = challenges.get(body.id); challenges.delete(body.id);
        const signature = typeof body.signature === 'string' && body.signature.length <= 100 ? Buffer.from(body.signature, 'base64') : Buffer.alloc(0);
        if (!challenge || challenge.wallet !== wallet || signature.length !== 64 || !nacl.sign.detached.verify(Buffer.from(challenge.message), signature, new PublicKey(wallet).toBytes())) throw stonksError(401, 'Wallet verification expired or did not match. Connect again.');
        if (sessions.size >= 500) throw stonksError(429, 'Wallet verification is busy. Retry shortly.');
        const token = crypto.randomBytes(32).toString('base64url'), expires = now() + 30 * 60000;
        sessions.set(digest(token), { wallet, expires }); send(200, { ok: true, data: { token, expires, wallet } }); return true;
      }
      const token = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(String(request.headers.authorization || ''))?.[1];
      const session = token && sessions.get(digest(token));
      if (!session || session.wallet !== wallet) throw stonksError(401, 'Connect and verify this wallet again.');
      let result;
      if (action === 'prepare') {
        limited('prepare:' + wallet, 3);
        const i = body.input;
        if (!i || i.wallet !== wallet || !['launch', 'buy', 'sell'].includes(i.operation)) throw stonksError(400, 'Transaction wallet or operation does not match.');
        // Custodial keys, supplied transactions, arbitrary metadata URLs and fee
        // recipients are not accepted at this boundary.
        const allowed = new Set(['wallet', 'operation', 'requestId', 'quoteMint', 'mint', 'name', 'symbol', 'mode', 'transferFeeBps', 'imageData', 'imageRights', 'description', 'amount', 'slippageBps']);
        if (Object.keys(i).some(k => !allowed.has(k))) throw stonksError(400, 'Unsupported transaction field.');
        result = await engine().prepare(i);
      } else if (action === 'submit') result = await engine().submit(body.intentId, wallet, body.signedTransaction);
      else if (action === 'retry') result = await engine().retry(body.intentId, wallet);
      else if (action === 'status') result = await engine().status(body.intentId, wallet);
      else result = await engine().history(wallet);
      send(200, { ok: true, data: result });
    } catch (e) {
      const status = [400, 401, 403, 404, 405, 409, 413, 422, 429, 502, 503].includes(e.status || e.statusCode) ? (e.status || e.statusCode) : 503;
      send(status, { ok: false, error: e.status ? e.message : 'This operation could not be verified. Check transaction history before trying again.' });
    }
    return true;
  } };
}
