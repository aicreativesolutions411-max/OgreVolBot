import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../web/public/launch-pad.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../web/public/launch.html', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, URL, URLSearchParams });
vm.runInContext(source, context);
const ui = context.window.SlimeLaunchPad;
const mint = '5FQN4usbgWyDd5oyVNF8gan3yXAHS4gxzRGKgYyvpump';

test('launch cards escape user metadata, retain ticker, reject unsafe images and link correct CA', () => {
  const c = ui.coinModel({ mint, name: '<img src=x onerror=alert(1)>', symbol: 'BOUNCE', imageUrl: 'javascript:alert(1)' });
  const card = ui.cardHtml(c);
  assert.ok(card.includes('&lt;img')); assert.ok(card.includes('$BOUNCE'));
  assert.ok(!card.includes('<img src=x')); assert.ok(!card.includes('javascript:'));
  assert.ok(card.includes('/t?ca=' + mint)); assert.ok(card.includes('data-copy="' + mint + '"'));
  assert.equal(ui.coinModel({ mint: 'not-a-contract' }), null);
  assert.equal(ui.chartUrl('"><script>'), '');
});
test('new draft handoff cannot set money, fee routing, wallet or consent', () => {
  const url = new URL(ui.draftUrl({ name: 'Bright & Green', symbol: 'BG', description: 'A new idea', walletIndex: 3, consentVersion: 'yes', amount: 100, launchUtility: { mode: 'usepaid' } }), 'https://slimewire.org');
  assert.equal(url.hash, '#launch'); assert.equal(url.searchParams.get('from'), 'fun');
  assert.equal(url.searchParams.get('lc_n'), 'Bright & Green');
  assert.deepEqual([...url.searchParams.keys()], ['from', 'lc_n', 'lc_s', 'lc_d']);
});
test('launch design is a real responsive UI with existing launch and wallet entry points', () => {
  assert.ok(html.includes('/wallet')); assert.ok(html.includes('/prelaunch'));
  assert.ok(html.includes('id="launch-dialog"')); assert.ok(html.includes('aria-live="polite"'));
  assert.ok(!html.includes('<video')); assert.ok(!source.includes('setInterval'));
  assert.ok(html.includes('Provider paused')); assert.ok(html.includes('not enabled'));
  assert.ok(!source.includes('method: \'POST\''));
  const css = readFileSync(new URL('../web/public/launch-pad.css', import.meta.url), 'utf8');
  assert.ok(css.includes('@media(max-width:640px)')); assert.ok(css.includes('prefers-reduced-motion'));
});

function boot({ hash = '', token = '', response = { ok: true, launches: [] }, status = 200 } = {}) {
  const nodes = new Map(), requests = [], storageReads = [], events = {};
  const node = id => { if (!nodes.has(id)) nodes.set(id, { innerHTML: '', textContent: '', value: '', hidden: false, disabled: false, attributes: {}, dataset: {}, addEventListener() {}, setAttribute(k, v) { this.attributes[k] = v; }, removeAttribute(k) { delete this.attributes[k]; }, querySelectorAll: () => [] }); return nodes.get(id); };
  const document = { getElementById: node, querySelectorAll: () => [], addEventListener() {}, activeElement: null };
  const window = { document, OGRE_PORTAL_CONFIG: { apiBase: 'https://app.slimewire.org/' }, addEventListener: (type, fn) => { events[type] = fn; } };
  const sandbox = vm.createContext({ window, document, URL, URLSearchParams, location: { hash }, localStorage: { getItem: key => { storageReads.push(key); return token; } }, AbortController, setTimeout, clearTimeout, fetch: async (url, options) => { requests.push({ url, options }); return { ok: status < 400, status, json: async () => response }; } });
  vm.runInContext(source, sandbox);
  return { nodes, requests, storageReads, events, sandbox };
}
const settle = () => new Promise(resolve => setImmediate(resolve));
test('public explore loads once without touching account or paid RPC endpoints', async () => {
  const b = boot({ response: { ok: true, launches: [{ mint, name: 'Bounce', symbol: 'BOUNCE' }] } }); await settle();
  assert.equal(b.requests.length, 1); assert.equal(b.storageReads.length, 0);
  assert.equal(b.requests[0].url, 'https://app.slimewire.org/api/web/launch/directory');
  assert.deepEqual(Object.keys(b.requests[0].options.headers), []);
  assert.ok(b.nodes.get('coin-grid').innerHTML.includes('$BOUNCE'));
  assert.equal(b.nodes.get('coin-grid').attributes['aria-busy'], 'false');
});
test('My launches requires a session and never treats public coins as owned', async () => {
  const loggedOut = boot({ hash: '#mine' }); await settle();
  assert.equal(loggedOut.requests.length, 0);
  assert.ok(loggedOut.nodes.get('coin-grid').innerHTML.includes('Connect your SlimeWire account'));
  const owned = boot({ hash: '#mine', token: 'test-session', response: { ok: true, coins: [{ mint, name: 'Owned', symbol: 'OWN' }] } }); await settle();
  assert.equal(owned.requests[0].url, 'https://app.slimewire.org/api/web/launches');
  assert.equal(owned.requests[0].options.headers.Authorization, 'Bearer test-session');
  assert.equal(owned.requests[0].options.cache, 'no-store');
  assert.ok(owned.nodes.get('coin-grid').innerHTML.includes('$OWN'));
});
test('failed directory gives a retry state, not invented or empty-success data', async () => {
  const b = boot({ status: 503 }); await settle();
  assert.match(b.nodes.get('launch-status').textContent, /Refresh/);
  assert.equal(b.nodes.get('refresh-launches').disabled, false);
  assert.ok(b.nodes.get('coin-grid').innerHTML.includes('temporarily unavailable'));
  assert.ok(!b.nodes.get('coin-grid').innerHTML.includes('coin-card'));
});
test('account sign-out in another tab clears previously owned launch cards', async () => {
  const b = boot({ hash: '#mine', token: 'session', response: { ok: true, coins: [{ mint, name: 'Owned', symbol: 'OWN' }] } }); await settle();
  assert.ok(b.nodes.get('coin-grid').innerHTML.includes('$OWN'));
  b.sandbox.localStorage.getItem = () => '';
  b.events.storage({ key: 'ogreWebToken' }); await settle();
  assert.ok(!b.nodes.get('coin-grid').innerHTML.includes('$OWN'));
  assert.ok(b.nodes.get('coin-grid').innerHTML.includes('Connect your SlimeWire account'));
});
