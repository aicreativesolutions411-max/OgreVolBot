import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID, MINT_SIZE, unpackMint } from '@solana/spl-token';
import { STONKS_CRYPTO_ASSETS, cryptoAssetForMint } from './slimeStonksAssets.js';

export const rewardError = (status, message) => Object.assign(new Error(message), { status });
export function rewardAddress(value) {
  try { const k = new PublicKey(value); if (typeof value !== 'string' || k.toBase58() !== value || k.equals(PublicKey.default)) throw Error(); return value; }
  catch { throw rewardError(422, 'Enter an exact Solana mint or wallet address.'); }
}
const clean = (v, max) => String(v || '').replace(/[\x00-\x1f\x7f]/g, '').slice(0, max);
const https = v => { try { const u = new URL(v); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; } };
const WSOL = 'So11111111111111111111111111111111111111112';

export function inspectRewardMint(mint, info) {
  rewardAddress(mint);
  if (info?.owner?.equals(TOKEN_2022_PROGRAM_ID)) throw rewardError(422, 'Token-2022 payout assets need additional protocol validation; transfer-tax and transfer-hook assets are not enabled.');
  if (!info || info.executable || !info.owner?.equals(TOKEN_PROGRAM_ID) || info.data?.length !== MINT_SIZE) throw rewardError(422, 'That address is not a supported SPL token mint. Paste the coin CA, not a pool or wallet.');
  const parsed = unpackMint(new PublicKey(mint), info, TOKEN_PROGRAM_ID);
  if (!parsed.isInitialized || parsed.decimals > 9) throw rewardError(422, 'This mint is uninitialized or uses unsupported precision.');
  if (parsed.freezeAuthority && mint !== WSOL) throw rewardError(422, 'This payout token has a freeze authority. It is not enabled for automatic distributions.');
  // Asset verification is not a statement about value, backing, issuer permission or investment safety.
  return { mint, decimals: parsed.decimals, tokenProgram: TOKEN_PROGRAM_ID.toBase58(), supplyRaw: parsed.supply.toString(), mintAuthority: parsed.mintAuthority?.toBase58() || null };
}

export function createRewardAssetResolver({ rpc, fetchImpl = fetch, now = Date.now, trackerApiKey = process.env.SOLANA_TRACKER_API_KEY || '', trackerDailyLimit = 60 } = {}) {
  let connection = rpc;
  const getRpc = () => connection ||= new Connection('https://api.mainnet-beta.solana.com', { commitment: 'finalized', disableRetryOnRateLimit: true, fetch: (url, opts) => fetchImpl(url, { ...opts, signal: AbortSignal.timeout(10000) }) });
  const cache = new Map(), pending = new Map(), marketCache = new Map(), marketPending = new Map();
  let requests = [], trackerRequests = [], dexRetryAt = 0, trackerRetryAt = 0;
  // This is a per-process safety ceiling, not an account-wide billing meter.
  // Existing keyed REST data is fallback-only: no timers, polling or paid RPC.
  const trackerLimit = Number.isSafeInteger(trackerDailyLimit) ? Math.max(0, Math.min(60, trackerDailyLimit)) : 60;
  async function cached(key, ttl, work) {
    const hit = cache.get(key); if (hit?.until > now()) { if (hit.error) throw hit.error; return structuredClone(hit.value); }
    if (pending.has(key)) return structuredClone(await pending.get(key));
    requests = requests.filter(t => now() - t < 60000);
    if (pending.size >= 4 || requests.length >= 60) throw rewardError(429, 'Token lookup is busy. Please retry shortly.');
    requests.push(now());
    const job = (async () => {
      try { const value = await work(); cache.set(key, { until: now() + ttl, value }); return value; }
      catch (e) { const error = e.status ? e : rewardError(502, 'Token data could not be verified. Try again shortly.'); cache.set(key, { until: now() + 5000, error }); throw error; }
      finally { pending.delete(key); while (cache.size > 100) cache.delete(cache.keys().next().value); }
    })();
    pending.set(key, job); return structuredClone(await job);
  }
  async function marketJson(url, headers = {}) {
    const r = await fetchImpl(url, { signal: AbortSignal.timeout(10000), redirect: 'error', credentials: 'omit', headers: { Accept: 'application/json', ...headers } });
    if (!r.ok) { await r.body?.cancel().catch(() => {}); throw Object.assign(rewardError(r.status === 429 ? 429 : 502, 'Token market lookup is temporarily unavailable.'), { upstreamStatus: r.status }); }
    let size = 0; const chunks = [];
    for await (const c of r.body) { size += c.length; if (size > 1500000) throw rewardError(502, 'Token response is too large.'); chunks.push(c); }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  }
  async function market(query, exact = '') {
    const key = exact || query.toLowerCase(), hit = marketCache.get(key);
    if (hit?.until > now()) return hit.rows;
    if (marketPending.has(key)) return marketPending.get(key);
    const job = (async () => {
      let primaryError = rewardError(429, 'Token market lookup is temporarily unavailable.');
      if (now() >= dexRetryAt) {
        try {
          // Use the current chain-specific endpoint for exact-mint reads, not
          // the legacy multi-chain endpoint. A 429 still stops primary retries.
          const route = exact ? '/tokens/v1/solana/' + exact : '/latest/dex/search?q=' + encodeURIComponent(query);
          const body = await marketJson('https://api.dexscreener.com' + route);
          const rows = candidates(Array.isArray(body) ? body : Array.isArray(body.pairs) ? body.pairs : [], exact, 'dexscreener');
          if (rows.length || !trackerApiKey) return rows;
        } catch (e) {
          primaryError = e.status ? e : rewardError(502, 'Token market lookup is temporarily unavailable.');
          dexRetryAt = now() + (e.status === 429 ? 60000 : 15000);
        }
      }
      if (!trackerApiKey || now() < trackerRetryAt) throw primaryError;
      trackerRequests = trackerRequests.filter(t => now() - t < 86400000);
      if (trackerRequests.length >= trackerLimit || trackerRequests.filter(t => now() - t < 3600000).length >= 10) throw rewardError(429, 'The fallback lookup budget is temporarily exhausted. Please try again later.');
      trackerRequests.push(now());
      try {
        // The secret is sent only to this fixed provider host. Redirects are
        // forbidden and exact-CA results are filtered again after promoted rows.
        const params = new URLSearchParams({ query: exact || query, limit: '12', sortBy: 'liquidityUsd', sortOrder: 'desc' });
        const body = await marketJson('https://data.solanatracker.io/search?' + params, { 'x-api-key': trackerApiKey });
        if (body?.status !== 'success' || !Array.isArray(body.data)) throw rewardError(502, 'Token market lookup is temporarily unavailable.');
        return candidates(body.data.map(row => ({ chainId: 'solana', baseToken: { address: row.mint, symbol: row.symbol, name: row.name }, priceUsd: row.priceUsd, liquidity: { usd: row.liquidityUsd }, info: { imageUrl: row.image } })), exact, 'solana-tracker');
      } catch (e) {
        trackerRetryAt = now() + ([401, 402, 403].includes(e.upstreamStatus) ? 900000 : e.status === 429 ? 60000 : 300000);
        throw rewardError(e.status === 429 ? 429 : 502, 'Token market lookup is temporarily unavailable.');
      }
    })().then(rows => {
      // A selection and its immediate review share one market request. The
      // finalized mint check is still refreshed for the signing/plan review.
      marketCache.set(key, { rows, until: now() + (exact ? 20000 : 300000) });
      while (marketCache.size > 100) marketCache.delete(marketCache.keys().next().value);
      return rows;
    }).finally(() => marketPending.delete(key));
    marketPending.set(key, job); return job;
  }
  function candidates(rows, exact = '', marketSource = 'dexscreener') {
    const result = new Map();
    for (const p of rows) {
      if (p.chainId !== 'solana' || !p.baseToken || (exact && p.baseToken.address !== exact)) continue;
      let mint; try { mint = rewardAddress(p.baseToken.address); } catch { continue; }
      const liquidityUsd = Number(p.liquidity?.usd), priceUsd = Number(p.priceUsd);
      if (!Number.isFinite(liquidityUsd) || liquidityUsd < 0 || !Number.isFinite(priceUsd) || priceUsd <= 0) continue;
      if ((result.get(mint)?.liquidityUsd ?? -1) >= liquidityUsd) continue;
      const known = cryptoAssetForMint(mint);
      result.set(mint, { mint, symbol: known?.symbol || clean(p.baseToken.symbol, 32), name: known?.name || clean(p.baseToken.name, 80), imageUrl: https(p.info?.imageUrl), liquidityUsd, priceUsd: String(p.priceUsd), referenceMint: Boolean(known), verified: false, marketSource, marketCheckedAt: now() });
    }
    return [...result.values()].sort((a, b) => b.liquidityUsd - a.liquidityUsd);
  }
  async function search(query) {
    const q = String(query || '').trim().replace(/^\$/, '');
    if (!q || q.length > 80 || !/^[\p{L}\p{N} ._-]+$/u.test(q)) throw rewardError(400, 'Enter a ticker, coin name or Solana contract address.');
    let exact = ''; try { exact = rewardAddress(q); } catch { /* Tickers are never resolved to an arbitrary first match. */ }
    return cached('search:' + (exact || q.toLowerCase()), 60000, async () => {
      const rows = [...await market(q, exact)];
      // A look-alike can report more liquidity than a known reference mint.
      // Rank a reviewed ticker identity first without selecting or endorsing it.
      const exactReference = t => t.referenceMint && t.symbol.toLowerCase() === q.toLowerCase();
      if (!exact) rows.sort((a, b) => Number(exactReference(b)) - Number(exactReference(a)) || b.liquidityUsd - a.liquidityUsd);
      // An unindexed CA can still be inspected on chain; never substitute a similarly named mint.
      if (exact && !rows.length) return [{ mint: exact, symbol: cryptoAssetForMint(exact)?.symbol || 'Unknown token', name: 'Exact address · market data unavailable', imageUrl: '', verified: false }];
      return rows.slice(0, 12);
    });
  }
  async function resolve(mint, { fresh = false } = {}) {
    rewardAddress(mint); if (fresh) cache.delete('mint:' + mint);
    return cached('mint:' + mint, 30000, async () => {
      const [chain, rows] = await Promise.all([getRpc().getAccountInfoAndContext(new PublicKey(mint), 'finalized'), market(mint, mint)]);
      const identity = inspectRewardMint(mint, chain.value), best = rows.find(row => row.mint === mint);
      if (!Number.isSafeInteger(chain.context?.slot)) throw rewardError(502, 'No finalized mint verification slot returned.');
      if (!best || best.liquidityUsd < 10000) throw rewardError(422, 'A liquid indexed market with at least $10,000 liquidity is required for a custom pairing. No token was selected.');
      return { ...best, ...identity, verified: true, supported: true, slot: chain.context.slot, checkedAt: now(), warnings: ['Not a safety endorsement. Confirm the exact mint; tickers are not unique.', ...(identity.mintAuthority ? ['This token still has a mint authority; its supply can change.'] : [])] };
    });
  }
  return { search, resolve, suggested: STONKS_CRYPTO_ASSETS.map(({ mint, symbol, name }) => ({ mint, symbol, name })) };
}
