import { PublicKey } from '@solana/web3.js';

// Authorized white-label data adapter. This is NOT a website reverse proxy.
// No credentials, wallet keys, RPC, jobs or transaction relaying are involved.
// Keep the provider private to this module; do not turn it into a general proxy.
const ORIGIN = 'https://www.stonkfun.xyz';
const API = ORIGIN + '/api/public/v1';
const text = (v, limit = 100) => typeof v === 'string' ? v.replace(/[\u0000-\u001f]/g, '').slice(0, limit) : '';
const num = v => typeof v === 'number' && Number.isFinite(v) ? v : null;
const positive = v => num(v) !== null && v >= 0 ? v : null;
const flag = v => typeof v === 'boolean' ? v : null;
const raw = v => typeof v === 'string' && /^\d{1,80}$/.test(v) ? v : null;
const date = v => typeof v === 'string' && Number.isFinite(Date.parse(v)) ? new Date(v).toISOString() : null;
const list = (v, max = 100) => Array.isArray(v) ? v.slice(0, max) : [];
const obj = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const fail = (status, message, retryAfter = 0) => Object.assign(new Error(message), { status, retryAfter });

function mint(value) {
  if (typeof value !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) return '';
  try { return new PublicKey(value).toBase58() === value ? value : ''; } catch { return ''; }
}
function url(value) {
  if (typeof value !== 'string' || value.length > 2000) return '';
  try { const u = new URL(value, value.startsWith('/api/asset/quote-logo/') ? ORIGIN : undefined); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
function asset(v = {}) {
  return { mint: mint(v.mint), symbol: text(v.symbol, 32), name: text(v.name, 100), decimals: Number.isInteger(v.decimals) && v.decimals >= 0 && v.decimals <= 18 ? v.decimals : null,
    imageUrl: url(v.imageUrl || v.logoUrl), category: text(v.category, 32), categoryLabel: text(v.categoryLabel, 40) };
}
function token(v = {}) {
  const m = obj(v.market);
  return { mint: mint(v.mint), pool: mint(v.pool), name: text(v.name), symbol: text(v.symbol, 32), imageUrl: url(v.imageUrl || v.logoUrl), quote: asset(obj(v.quote)),
    mode: ['reward', 'standard'].includes(v.mode) ? v.mode : 'unknown', launchpad: text(v.launchpad, 24), creator: mint(v.creator), createdAt: date(v.createdAt), graduatedAt: date(v.graduatedAt),
    status: ['new', 'aboutToGraduate', 'graduated'].includes(v.status) ? v.status : 'unknown', graduationProgress: num(v.graduationProgress) === null ? null : Math.max(0, Math.min(1, v.graduationProgress)),
    transferFeeBps: positive(v.transferFee?.bps), communityShareBps: positive(v.communityMode?.shareBps), flywheelActive: v.flywheel?.active === true,
    market: { priceUsd: positive(m.priceUsd), marketCapUsd: positive(m.marketCapUsd), fdvUsd: positive(m.fdvUsd), volume24hUsd: positive(m.volume24hUsd), liquidityUsd: positive(m.liquidityUsd), priceChange24h: num(m.priceChange24h), peakMarketCapUsd: positive(m.peakMarketCapUsd) },
    links: { website: url(v.links?.website), twitter: url(v.links?.twitter), telegram: url(v.links?.telegram) } };
}
function pagination(v = {}) { return { page: positive(v.page) ?? 1, pageSize: positive(v.pageSize) ?? 24, total: positive(v.total), totalPages: positive(v.totalPages) }; }
function rewards(v) {
  if (!v || typeof v !== 'object') return null;
  return { distributedRaw: raw(v.distributedRaw), distributedTokens: positive(v.distributedTokens), undistributedRaw: raw(v.undistributedRaw), undistributedTokens: positive(v.undistributedTokens),
    queuedTokens: positive(v.queuedTokens), inFlightTokens: positive(v.inFlightTokens), strandedTokens: positive(v.strandedTokens), payoutCount: positive(v.payoutCount), holderCount: positive(v.holderCount), lastPayoutAt: date(v.lastPayoutAt), asset: asset(v.asset || {}) };
}

export function stonksRequest(resource, params = new URLSearchParams()) {
  const p = new URLSearchParams(params), q = new URLSearchParams();
  let path, allowed = [];
  const requireMint = key => { const v = mint(p.get(key)); if (!v) throw fail(400, 'Enter a valid Solana ' + (key === 'creator' ? 'wallet address.' : 'coin address.')); q.set(key, v); };
  const choice = (key, values) => { const v = p.get(key); if (v) { if (!values.includes(v)) throw fail(400, 'Invalid market filter.'); q.set(key, v); } };
  const integer = (key, fallback, max) => { const v = p.get(key) ?? String(fallback); if (!/^\d{1,6}$/.test(v) || Number(v) < 1 || Number(v) > max) throw fail(400, 'Invalid page size or page.'); q.set(key, String(Number(v))); };
  if (resource === 'tokens' || resource === 'launches') {
    path = '/' + resource; allowed = ['page', 'pageSize', 'mode'];
    integer('page', 1, 10000); integer('pageSize', 24, 50); choice('mode', ['reward', 'standard']);
    if (resource === 'tokens') {
      allowed.push('q', 'sort', 'category', 'status', 'quoteMint');
      const search = p.get('q'); if (search) { if (search.length > 100 || /[\u0000-\u001f]/.test(search)) throw fail(400, 'Search must be 100 characters or fewer.'); q.set('q', search.trim()); }
      choice('sort', ['marketCap', 'volume', 'newest']); choice('status', ['new', 'aboutToGraduate', 'graduated']);
      if (p.get('quoteMint')) requireMint('quoteMint');
    } else { allowed.push('creator'); requireMint('creator'); }
  } else if (resource === 'pairs') { path = '/pairs'; allowed = ['category']; }
  else if (resource === 'stats') { path = '/stats'; }
  else if (resource === 'pricing') { path = '/launchlab/pricing'; allowed = ['quoteMint']; requireMint('quoteMint'); }
  else {
    const match = /^tokens\/([1-9A-HJ-NP-Za-km-z]{32,44})(?:\/(rewards|fees|burns))?$/.exec(resource);
    if (!match || !mint(match[1])) throw fail(404, 'This market resource is not available.');
    path = '/' + resource;
    if (match[2] === 'burns') { allowed = ['limit']; integer('limit', 10, 25); }
  }
  if (p.get('category')) {
    const category = p.get('category'); if (!/^[a-z][a-z0-9_-]{0,30}$/.test(category)) throw fail(400, 'Invalid pairing category.'); q.set('category', category);
  }
  for (const key of p.keys()) if (!allowed.includes(key) || p.getAll(key).length !== 1) throw fail(400, 'Unsupported or repeated market parameter.');
  q.sort();
  return { path: path + (q.size ? '?' + q : ''), ttl: resource === 'pairs' ? 300000 : resource === 'pricing' ? 15000 : 30000 };
}

export function normalizeStonksData(resource, input) {
  const d = obj(input);
  const requestedMint = resource.startsWith('tokens/') ? resource.split('/')[1] : '';
  if (requestedMint && (resource.split('/').length === 2 ? mint(d.token?.mint) : mint(d.mint)) !== requestedMint) throw fail(502, 'The market response does not match the requested coin.');
  if (resource === 'tokens' || resource === 'launches') {
    const key = resource === 'tokens' ? 'tokens' : 'launches';
    if (!Array.isArray(d[key])) throw fail(502, 'Market data is temporarily unavailable.');
    return { [key]: list(d[key], 50).map(token).filter(t => t.mint), pagination: pagination(d.pagination) };
  }
  if (resource === 'pairs') {
    if (!Array.isArray(d.pairs)) throw fail(502, 'Pairing data is temporarily unavailable.');
    return { pairs: list(d.pairs, 2000).map(v => ({ ...asset(v), launchable: flag(v.launchable), launchLabReady: flag(v.launchLabReady), communityMode: flag(v.communityMode), symbolAmbiguous: v.symbolAmbiguous === true })).filter(p => p.mint) };
  }
  if (resource === 'stats') return { tokens: { total: positive(d.tokens?.total), graduated: positive(d.tokens?.graduated), rewardLaunches: positive(d.tokens?.rewardLaunches), totalMarketCapUsd: positive(d.tokens?.totalMarketCapUsd), totalVolume24hUsd: positive(d.tokens?.totalVolume24hUsd) }, config: { launchLabEnabled: flag(d.config?.launchLabEnabled), rewardLaunchesEnabled: flag(d.config?.rewardLaunchesEnabled) }, execution: { launch: false, swap: false, claim: false, reason: 'Native transaction signing and end-to-end settlement validation are not enabled in this release.' } };
  if (resource === 'pricing') return { quote: asset(obj(d.quote)), raise: { raw: raw(d.raise?.raw), units: positive(d.raise?.units) }, marketCap: { startUsd: positive(d.marketCap?.startUsd), graduationUsd: positive(d.marketCap?.graduationUsd) }, observedAt: date(d.prices?.observedAt), totalSupplyTokens: positive(d.curve?.totalSupplyTokens), transferFeeBps: list(d.modes?.reward?.transferFeeBps, 10).filter(v => Number.isInteger(v) && v >= 0 && v <= 10000), community: { shareBps: positive(d.communityMode?.shareBps), available: flag(d.communityMode?.offeredOnThisQuote) } };
  if (resource.endsWith('/rewards')) return { mint: mint(d.mint), mode: text(d.mode, 20), quote: asset(obj(d.quote)), rewards: rewards(d.rewards), base: rewards(d.base) };
  if (resource.endsWith('/fees')) {
    const c = obj(d.claimable);
    const side = v => v ? { ...asset(v), amountRaw: raw(v.amountRaw), amountTokens: positive(v.amountTokens) } : null;
    return { mint: mint(d.mint), mode: text(d.mode, 20), claimable: d.claimable ? { base: side(c.base), quote: side(c.quote) } : null, scope: text(d.scope, 40), automatic: /automati|forward|launchlab/i.test(String(d.reason || '')), hasCreatorFees: d.mode === 'reward' ? false : null };
  }
  if (resource.endsWith('/burns')) return { totals: { amountTokens: positive(d.totals?.amountTokens), valueUsdAtBurn: positive(d.totals?.valueUsdAtBurn), burnCount: positive(d.totals?.burnCount), lastBurnAt: date(d.totals?.lastBurnAt), symbol: text(d.totals?.symbol, 32) }, burns: list(d.burns, 25).map(v => ({ signature: /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(v.signature || '') ? v.signature : '', amountTokens: positive(v.amountTokens), valueUsdAtBurn: positive(v.valueUsdAtBurn), burnedAt: date(v.burnedAt) })) };
  if (!d.token || !mint(d.token.mint)) throw fail(404, 'This coin has not been indexed.');
  return { token: token(d.token), launch: d.launch ? token(d.launch) : null };
}

async function jsonBounded(response, maxBytes) {
  if (Number(response.headers.get('content-length')) > maxBytes) throw fail(502, 'The market response is too large.');
  const reader = response.body?.getReader();
  if (!reader) throw fail(502, 'Empty market response.');
  let length = 0; const chunks = [];
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > maxBytes) throw fail(502, 'The market response is too large.'); chunks.push(Buffer.from(value)); }
    return JSON.parse(Buffer.concat(chunks, length).toString('utf8'));
  } finally { await reader.cancel().catch(() => {}); }
}

export function createSlimeStonksReader({ fetchImpl = fetch, now = Date.now, maxBytes = 2 * 1024 * 1024, timeoutMs = 10000, maxEntries = 120, maxConcurrent = 6 } = {}) {
  const cache = new Map(), pending = new Map(); let cooldown = 0, starts = [];
  const remember = (key, entry) => { cache.delete(key); cache.set(key, entry); while (cache.size > maxEntries) cache.delete(cache.keys().next().value); };
  async function read(resource, params = new URLSearchParams()) {
    const spec = stonksRequest(resource, params), key = spec.path, time = now(), saved = cache.get(key);
    if (saved && saved.until > time) { if (saved.error) throw saved.error; return saved.value; }
    if (pending.has(key)) return pending.get(key);
    if (cooldown > time) throw fail(429, 'Market refresh is cooling down. Please retry shortly.', Math.ceil((cooldown - time) / 1000));
    starts = starts.filter(t => time - t < 60000);
    if (pending.size >= maxConcurrent || starts.length >= 120) throw fail(429, 'Market refresh is busy. Please retry shortly.', 5);
    starts.push(time);
    const job = (async () => {
      const controller = new AbortController(), timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetchImpl(API + spec.path, { method: 'GET', headers: { Accept: 'application/json' }, credentials: 'omit', redirect: 'error', signal: controller.signal });
        if (!response.ok) {
          if (response.status === 429) { const retry = response.headers.get('retry-after'), seconds = /^\d+$/.test(retry || '') ? Number(retry) : (Date.parse(retry || '') - Date.now()) / 1000; cooldown = now() + Math.max(10000, Math.min(300000, (Number.isFinite(seconds) ? seconds : 30) * 1000)); }
          await response.body?.cancel().catch(() => {});
          throw fail([403, 404, 429].includes(response.status) ? response.status : 502, response.status === 403 ? 'This data request is not available under current access rules.' : response.status === 404 ? 'This coin has not been indexed.' : 'Market data is temporarily unavailable. Please retry.');
        }
        const body = await jsonBounded(response, maxBytes), data = normalizeStonksData(resource, body.data);
        const value = { ok: true, data, meta: { checkedAt: new Date(now()).toISOString(), sourceAsOf: date(body.meta?.generatedAt), cacheSeconds: spec.ttl / 1000, scope: 'external-market-network', network: 'mainnet-beta' } };
        remember(key, { value, until: now() + spec.ttl }); return value;
      } catch (error) {
        const safe = error.status ? error : fail(502, 'Market data is temporarily unavailable. Please retry.');
        remember(key, { error: safe, until: now() + 10000 }); throw safe;
      } finally { clearTimeout(timer); pending.delete(key); }
    })();
    pending.set(key, job); return job;
  }
  return { read };
}
