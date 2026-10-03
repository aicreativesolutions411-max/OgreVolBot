import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { createSlimeStonksReader, stonksRequest, normalizeStonksData } from '../src/lib/slimeStonks.js';

const MINT = 'DEW9dSN6QpWyNthphCpMmAbZP1Q4cEKR9xQXAri98WDP';
const QUOTE = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W';
const response = data => new Response(JSON.stringify({ data, meta: { generatedAt: '2026-10-02T20:00:00Z' } }), { headers: { 'content-type': 'application/json' } });
const token = { mint: MINT, name: 'Example', symbol: 'EX', quote: { mint: QUOTE, symbol: 'SPYX', category: 'xstock' }, market: { priceUsd: 0.1, marketCapUsd: 100000, volume24hUsd: 50, priceChange24h: 0 }, mode: 'reward', transferFee: { bps: 100 } };

test('stonks API allows only bounded documented read endpoints', () => {
  assert.equal(stonksRequest('tokens', new URLSearchParams('sort=volume&q=cat&page=2')).path, '/tokens?page=2&pageSize=24&q=cat&sort=volume');
  for (const resource of ['https://evil.test', '../stats', 'tokens/' + MINT + '/fees/claim/submit', 'tokens/' + MINT + '/backing', 'tokens/' + MINT + '/airdrop', 'rewards', 'launches/prepare']) assert.throws(() => stonksRequest(resource, new URLSearchParams()));
  for (const query of ['page=0', 'pageSize=101', 'sort=profit', 'quoteMint=bad', 'q=' + 'x'.repeat(101), 'page=1&page=2', 'url=https://evil.test']) assert.throws(() => stonksRequest('tokens', new URLSearchParams(query)), query);
  assert.throws(() => stonksRequest('launches', new URLSearchParams()), /wallet/i);
  assert.throws(() => stonksRequest('pricing', new URLSearchParams('quoteMint=nope')));
  assert.equal(stonksRequest('tokens/' + MINT + '/rewards', new URLSearchParams()).path, '/tokens/' + MINT + '/rewards');
});

test('normalization preserves unknown versus zero and never invents stock ownership or rewards', () => {
  const out = normalizeStonksData('tokens', { tokens: [token], pagination: { page: 1, total: 1, totalPages: 1 } });
  assert.equal(out.tokens[0].market.priceUsd, 0.1);
  assert.equal(out.tokens[0].market.priceChange24h, 0);
  assert.equal(out.tokens[0].market.liquidityUsd, null);
  assert.equal(out.tokens[0].communityShareBps, null);
  assert.equal(out.tokens[0].transferFeeBps, 100);
  assert.equal(out.tokens[0].quote.mint, QUOTE);
  const pair = normalizeStonksData('pairs', { pairs: [{ mint: QUOTE, symbol: 'A', launchable: true }] }).pairs[0];
  assert.equal(pair.launchLabReady, null, 'an omitted upstream probe must not become approved');
  assert.equal(pair.communityMode, null);
  assert.equal(normalizeStonksData('tokens/' + MINT + '/rewards', { mint: MINT, mode: 'standard', rewards: null }).rewards, null);
});

test('API strips dangerous URLs, malformed mint records and unneeded upstream text', () => {
  const out = normalizeStonksData('tokens', { tokens: [{ ...token, imageUrl: 'javascript:alert(1)', links: { website: 'data:text/html,x', twitter: 'https://x.com/example' }, mystery: 'ignore' }, { mint: 'not-a-mint' }] });
  assert.equal(out.tokens.length, 1);
  assert.equal(out.tokens[0].imageUrl, '');
  assert.equal(out.tokens[0].links.website, '');
  assert.equal(out.tokens[0].links.twitter, 'https://x.com/example');
  assert.equal(out.tokens[0].mystery, undefined);
});

test('reader coalesces identical queries, uses cache, and records source freshness', async () => {
  let calls = 0, now = 1000;
  const reader = createSlimeStonksReader({ now: () => now, fetchImpl: async (url, options) => { calls++; assert.equal(options.method, 'GET'); assert.equal(options.redirect, 'error'); assert.ok(url.startsWith('https://www.stonkfun.xyz/api/public/v1/')); return response({ tokens: [token] }); } });
  const [a, b] = await Promise.all([reader.read('tokens'), reader.read('tokens')]);
  assert.deepEqual(a, b); assert.equal(calls, 1);
  assert.equal(a.meta.sourceAsOf, '2026-10-02T20:00:00.000Z');
  await reader.read('tokens'); assert.equal(calls, 1);
  now += 31000; await reader.read('tokens'); assert.equal(calls, 2);
});

test('coin-specific records must identify the exact requested mint', () => {
  for (const suffix of ['', '/rewards', '/fees', '/burns']) {
    const resource = 'tokens/' + MINT + suffix;
    assert.throws(() => normalizeStonksData(resource, suffix ? { mint: QUOTE } : { token: { ...token, mint: QUOTE } }), /match/);
    assert.throws(() => normalizeStonksData(resource, {}), /match/);
  }
});

test('concurrency, cache size and request timeout are bounded', async () => {
  let resolve, calls = 0;
  const reader = createSlimeStonksReader({ maxConcurrent: 1, maxEntries: 1, fetchImpl: async () => {
    calls++; if (calls === 1) await new Promise(r => { resolve = r; });
    return response({ tokens: [token] });
  } });
  const first = reader.read('tokens');
  await assert.rejects(reader.read('tokens', new URLSearchParams('q=other')), e => e.status === 429);
  resolve(); await first;
  await reader.read('tokens', new URLSearchParams('q=other'));
  await reader.read('tokens'); assert.equal(calls, 3, 'the first query was evicted');
  const timeout = createSlimeStonksReader({ timeoutMs: 5, fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('aborted')), { once: true })) });
  await assert.rejects(timeout.read('tokens'), e => e.status === 502);
});

test('upstream denial is not retried or bypassed and messages do not leak response bodies', async () => {
  let calls = 0;
  const reader = createSlimeStonksReader({ fetchImpl: async () => { calls++; return new Response('secret upstream implementation text', { status: 403 }); } });
  await assert.rejects(reader.read('tokens'), e => e.status === 403 && !e.message.includes('secret'));
  await assert.rejects(reader.read('tokens'));
  assert.equal(calls, 1, 'negative cache stops repeated denial traffic');
});

test('oversized, redirected and malformed data fail closed', async () => {
  const oversized = createSlimeStonksReader({ maxBytes: 128, fetchImpl: async () => response({ tokens: Array(100).fill(token) }) });
  await assert.rejects(oversized.read('tokens'));
  const invalid = createSlimeStonksReader({ fetchImpl: async () => new Response('<html>error</html>') });
  await assert.rejects(invalid.read('tokens'));
});

test('upstream rate-limit cooldown applies across different queries', async () => {
  let calls = 0;
  const reader = createSlimeStonksReader({ fetchImpl: async () => { calls++; return new Response('', { status: 429, headers: { 'retry-after': '60' } }); } });
  await assert.rejects(reader.read('tokens'));
  await assert.rejects(reader.read('pairs'));
  assert.equal(calls, 1);
});

test('browser helpers escape metadata, keep quote assets separate and expose exact feature readiness', () => {
  const context = vm.createContext({ URL, URLSearchParams, Intl });
  vm.runInContext(readFileSync(new URL('../web/public/slimestonks.js', import.meta.url), 'utf8'), context);
  const ui = context.SlimeStonks;
  assert.equal(ui.usd(null), 'Unavailable');
  assert.equal(ui.amount(null, 'ABC'), 'Unavailable');
  assert.match(ui.amount(0, 'ABC'), /0 ABC/);
  assert.doesNotMatch(ui.tokenCard({ ...token, imageUrl: 'javascript:alert(1)', symbol: '<script>x</script>', market: {} }), /<script>|javascript:/);
  assert.match(ui.tokenCard({ ...token, market: {} }), /Unavailable/);
  assert.equal(ui.launchReadiness({ launchable: true, launchLabReady: null }, null).ready, false);
  assert.equal(ui.launchReadiness({ launchable: false, launchLabReady: true }, {}).ready, false);
  const rows = [{ mint: MINT, symbol: 'SAME' }, { mint: QUOTE, symbol: 'SAME' }];
  assert.equal(ui.filterPairs(rows, QUOTE, '').length, 1);
  const rewards = ui.rewardHtml({ quote: { symbol: 'SPYX' }, rewards: { distributedTokens: 12, undistributedTokens: 0 }, base: { distributedTokens: 300, asset: { symbol: 'EX' } } });
  assert.match(rewards, /12 SPYX/); assert.match(rewards, /300 EX/);
  assert.match(rewards, /Not a personal claimable balance/);
  assert.doesNotMatch(rewards, /312/);
  assert.match(ui.feeHtml({ claimable: { quote: { amountTokens: 0, symbol: 'SPYX' } }, scope: 'creator-quote-vault' }, { ...token, mode: 'standard' }), /Shared creator\/quote vault/);
  assert.match(ui.feeHtml({}, { mode: 'standard' }), /Unavailable is not zero/);
});

test('SlimeStonks is a separate white-label page with no wallet or execution preload', () => {
  const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
  const html = read('web/public/slimestonks.html'), js = read('web/public/slimestonks.js');
  assert.doesNotMatch(html + js, /stonkfun|powered by|partnered with|<iframe/i);
  assert.match(html, /SlimeStonks/);
  assert.match(html, /United States/);
  assert.match(html, /not direct ownership/i);
  assert.doesNotMatch(js, /sendTransaction|signTransaction|setInterval|privateKey|secretKey/);
  assert.match(read('web/public/home.html'), /href="\/slimestonks"/);
  assert.match(read('src/index.js'), /serveStaticHtmlPage\(response, "slimestonks.html"/);
  assert.match(read('scripts/lib/site-branding.js'), /slimestonks\.html/);
});

test('readiness uses the configured public data origin but financial requests stay on the trusted edge', async () => {
  const nodes = new Map(), requests = [];
  const document = {
    getElementById(id) {
      if (!nodes.has(id)) nodes.set(id, { checked: true, hidden: false, textContent: '', innerHTML: '',
        showModal() {}, addEventListener() {}, setAttribute() {}, removeAttribute() {}, querySelectorAll: () => [] });
      return nodes.get(id);
    },
    querySelectorAll: () => [], addEventListener() {},
  };
  const window = { document, OGRE_PORTAL_CONFIG: { apiBase: 'https://app.slimewire.org/' },
    phantom: { solana: { connect: async () => {}, publicKey: { toString: () => MINT }, signMessage() {}, signTransaction() {} } } };
  const context = vm.createContext({ window, document, fetch: async (url, options) => {
    requests.push({ url, method: options.method || 'GET' });
    if (options.method === 'POST') throw Error('Mock stops before any signature or transaction');
    return { ok: true, json: async () => ({ ok: true, data: { pilotConfigured: false, checks: [] } }) };
  } });
  vm.runInContext(readFileSync(new URL('../web/public/slimestonks-transactions.js', import.meta.url), 'utf8'), context);
  assert.equal(requests.length, 0, 'no request or wallet connection during script load');
  await window.SlimeStonksTransactions.open();
  assert.equal(requests[0].url, 'https://app.slimewire.org/api/web/stonks/execution/readiness');
  assert.equal(nodes.get('tx-pilot').hidden, true);
  assert.match(nodes.get('tx-status').textContent, /Public transactions are not live/);
  await nodes.get('tx-connect').onclick();
  assert.deepEqual(requests[1], { url: '/api/web/stonks/execution/challenge', method: 'POST' });
});
