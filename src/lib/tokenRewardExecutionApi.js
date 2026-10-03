import crypto from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import { rewardError, rewardAddress } from './tokenRewardAssets.js';
import { rewardWallet } from './tokenRewardPolicy.js';

export function createTokenRewardExecutionApi({ runtime, readBody, sendJson, now = Date.now, env = process.env }) {
  const challenges = new Map(), sessions = new Map(), limits = new Map();
  const digest = v => crypto.createHash('sha256').update(v).digest('hex');
  const origins = new Set(['https://slimewire.org', 'https://www.slimewire.org', 'https://app.slimewire.org']);
  if (env.NODE_ENV !== 'production') origins.add('http://127.0.0.1:4186');
  const prune = m => { for (const [k, v] of m) if (v.expires <= now()) m.delete(k); };
  function limit(key, max) { prune(limits); const row = limits.get(key) || { count: 0, expires: now() + 60000 }; if (limits.size >= 2000 || ++row.count > max) throw rewardError(429, 'Please wait a minute before trying again.'); limits.set(key, row); }
  return { async route(req, res, url) {
    const prefix = '/api/web/token-rewards/execution/'; if (!url.pathname.startsWith(prefix)) return false;
    const send = (s, data) => sendJson(req, res, s, data, '', { 'Cache-Control': 'no-store' });
    try {
      const action = url.pathname.slice(prefix.length);
      if (req.method !== 'POST' || url.searchParams.size || !['challenge', 'verify', 'prepare', 'resume', 'submit', 'status', 'retry', 'history', 'cancel', 'pause'].includes(action)) throw rewardError(405, 'Unsupported reward action.');
      if (!runtime) throw rewardError(503, 'Live reward validation is not configured.');
      if (!origins.has(req.headers.origin) || !/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw rewardError(403, 'Use the SlimeWire page to review this action.');
      let body; try { body = JSON.parse(await readBody(req, action === 'prepare' ? 4300000 : 8192)); } catch { throw rewardError(400, 'Invalid request.'); }
      const wallet = rewardWallet(body?.wallet); limit('wallet:' + wallet, ['status', 'history'].includes(action) ? 30 : 12);
      if (!runtime.canLaunch(wallet)) throw rewardError(403, 'This wallet is not approved for the first live validation launch. General release is still awaiting receipt-based verification.');
      prune(challenges); prune(sessions);
      if (action === 'challenge') {
        if (challenges.size >= 500) throw rewardError(429, 'Wallet verification is busy.');
        const id = crypto.randomUUID(), expires = now() + 180000;
        const message = ['SlimeWire native token rewards', 'Domain: https://slimewire.org', 'Wallet: ' + wallet,
          'Purpose: Verify wallet ownership for launch reviews. This message does not authorize a transfer.', 'Nonce: ' + id, 'Expires: ' + new Date(expires).toISOString()].join('\n');
        challenges.set(id, { wallet, message, expires }); send(200, { ok: true, data: { id, message, expires } }); return true;
      }
      if (action === 'verify') {
        const row = challenges.get(body.id); challenges.delete(body.id);
        const sig = typeof body.signature === 'string' && body.signature.length <= 100 ? Buffer.from(body.signature, 'base64') : Buffer.alloc(0);
        if (!row || row.wallet !== wallet || sig.length !== 64 || !nacl.sign.detached.verify(Buffer.from(row.message), sig, new PublicKey(wallet).toBytes())) throw rewardError(401, 'Wallet verification expired or did not match.');
        if (sessions.size >= 500) throw rewardError(429, 'Wallet verification is busy.');
        const token = crypto.randomBytes(32).toString('base64url'), expires = now() + 1800000;
        sessions.set(digest(token), { wallet, expires }); send(200, { ok: true, data: { token, wallet, expires } }); return true;
      }
      const token = /^Bearer ([\w-]{43})$/.exec(req.headers.authorization || '')?.[1], session = token && sessions.get(digest(token));
      if (!session || session.wallet !== wallet) throw rewardError(401, 'Connect and verify this wallet again.');
      let data;
      if (action === 'prepare') { limit('prepare:' + wallet, 2); if (body.input?.creator !== wallet) throw rewardError(403, 'The developer must be the connected signing wallet.'); data = await runtime.launches.prepare(body.input); }
      else if (action === 'history') data = await runtime.launches.history(wallet);
      else if (action === 'pause') {
        const program = await runtime.rewards.read(rewardAddress(body.mint)); if (!program || program.policy.creator !== wallet || typeof body.paused !== 'boolean') throw rewardError(403, 'Only the launch developer can pause or resume this reward program.');
        await runtime.rewards.pause(body.mint, body.paused); data = await runtime.rewards.read(body.mint);
      } else {
        if (!/^[a-f0-9]{40}$/.test(body.id || '')) throw rewardError(400, 'Invalid launch ID.');
        data = action === 'submit' ? await runtime.launches.submit(body.id, wallet, body.signedTransaction) : await runtime.launches[action](body.id, wallet);
      }
      send(200, { ok: true, data });
    } catch (e) {
      const code = [400, 401, 403, 404, 405, 409, 413, 422, 429, 502, 503].includes(e.status || e.statusCode) ? (e.status || e.statusCode) : 503;
      send(code, { ok: false, error: e.status ? e.message : 'This action could not be verified. Check your existing launch status before retrying.' });
    }
    return true;
  } };
}
