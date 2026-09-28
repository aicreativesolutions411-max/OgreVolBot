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
  assert.ok(card.includes('https://dexscreener.com/solana/' + mint)); assert.ok(card.includes('data-copy="' + mint + '"'));
  assert.equal(ui.coinModel({ mint: 'not-a-contract' }), null);
  assert.equal(ui.chartUrl('"><script>'), '');
});
test('launch PFPs use fast exact-CID gateways and retain a bounded fallback list', () => {
  const cid = 'bafkreihei5dvwvm3fjdhgr3fiwspeznxcz3r4jm6s6jjfssqhkoqgjgoyu';
  const sources = Array.from(ui.imageCandidates('https://ipfs.io/ipfs/' + cid));
  assert.deepEqual(sources, ['https://pump.mypinata.cloud/ipfs/' + cid, 'https://gateway.pinata.cloud/ipfs/' + cid, 'https://ipfs.io/ipfs/' + cid]);
  assert.equal(ui.safeImage('ipfs://' + cid), sources[0]);
  assert.deepEqual(Array.from(ui.imageCandidates('javascript:alert(1)')), []);
  assert.deepEqual(Array.from(ui.imageCandidates('https://example.com/coin.png')), ['https://example.com/coin.png']);
  const card = ui.cardHtml(ui.coinModel({ mint, name: 'Bounce', imageUri: 'ipfs://' + cid }));
  assert.ok(card.includes('data-image-sources='));
  assert.ok(card.includes('pump.mypinata.cloud'));
  assert.ok(!card.includes('/api/web/token-image')); // no paid metadata/RPC lookup for decoration
});
test('PFP loader advances on errors/timeouts and never removes an image before trying fallbacks', () => {
  const timers = new Map(); let nextTimer = 0, removed = false;
  const img = { src: '', hidden: true, complete: false, naturalWidth: 0, remove() { removed = true; } };
  const schedule = fn => { timers.set(++nextTimer, fn); return nextTimer; };
  const cancel = id => timers.delete(id);
  ui.loadCoinImage(img, ['https://a.example/coin.png', 'https://b.example/coin.png', 'https://c.example/coin.png'], { schedule, cancel });
  assert.equal(img.src, 'https://a.example/coin.png');
  img.onerror(); assert.equal(img.src, 'https://b.example/coin.png'); assert.equal(removed, false);
  [...timers.values()][0](); assert.equal(img.src, 'https://c.example/coin.png');
  img.naturalWidth = 64; img.onload();
  assert.equal(img.hidden, false); assert.equal(timers.size, 0); assert.equal(removed, false);
  assert.equal(img.onerror, null);
});
test('exhausted PFP gateways leave honest initials without an infinite retry or broken image', () => {
  let removed = false;
  const img = { remove() { removed = true; } };
  ui.loadCoinImage(img, ['https://example.com/coin.png'], { schedule: () => 1, cancel() {} });
  img.onerror(); assert.equal(removed, true); assert.equal(img.onerror, null);
});
test('new draft handoff cannot set money, fee routing, wallet or consent', () => {
  const url = new URL(ui.draftUrl({ name: 'Bright & Green', symbol: 'BG', description: 'A new idea', walletIndex: 3, consentVersion: 'yes', amount: 100, launchUtility: { mode: 'usepaid' } }), 'https://slimewire.org');
  assert.equal(url.hash, '#launch'); assert.equal(url.searchParams.get('from'), 'fun');
  assert.equal(url.searchParams.get('lc_n'), 'Bright & Green');
  assert.deepEqual([...url.searchParams.keys()], ['from', 'lc_n', 'lc_s', 'lc_d']);
});

test('Alliance handoff selects a draft path only, never a wallet, split or payout consent',()=>{
  const url=new URL(ui.draftUrl({name:'Together',symbol:'ALLY',mode:'alliance',partnerWallet:'evil',partnerShareBps:9999,autoDistribute:true,consentVersion:'yes'}),'https://slimewire.org');
  assert.equal(url.searchParams.get('lc_utility'),'alliance');
  assert.deepEqual([...url.searchParams.keys()],['from','lc_n','lc_s','lc_d','lc_utility']);
  assert.equal(ui.coinModel({mint,launchUtility:{mode:'alliance'}}).rewardMode,'alliance');
});
test('launch design is a real responsive UI with existing launch and wallet entry points', () => {
  assert.ok(html.includes('/wallet')); assert.ok(html.includes('/prelaunch'));
  assert.ok(html.includes('id="launch-dialog"')); assert.ok(html.includes('aria-live="polite"'));
  assert.ok(!html.includes('<video')); assert.ok(!source.includes('setInterval'));
  assert.ok(html.includes('Community Alliance')); assert.ok(html.includes('not enabled'));
  for (const unavailable of ['x','business','linkedin','telegram']) assert.ok(!html.includes(`data-route="${unavailable}"`));
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

test('launch search accepts tickers and supported coin links without confusing pair addresses', () => {
  const coin = ui.coinModel({mint, name:'Bounce', symbol:'BOUNCE'});
  assert.equal(ui.filterLaunches([coin], '$bounce', 'all').length, 1);
  assert.equal(ui.filterLaunches([coin], 'https://pump.fun/coin/'+mint+'?ref=x', 'all').length, 1);
  assert.equal(ui.filterLaunches([coin], 'https://slimewire.org/wallet?ca='+mint, 'all').length, 1);
  assert.equal(ui.filterLaunches([coin], mint, 'all').length, 1);
  assert.equal(ui.filterLaunches([coin], mint.toLowerCase(), 'all').length, 0);
  assert.equal(ui.searchQuery('https://dexscreener.com/solana/'+mint).mint, ''); // can be a pool, not a mint
  assert.equal(ui.searchQuery('https://evil.example/coin/'+mint).mint, '');
  assert.equal(ui.walletCoinUrl(mint), '/wallet?ca='+mint);
  assert.equal(ui.walletCoinUrl('javascript:alert(1)'), '/wallet');
});

test('directory filters rewards and sorts recent launches without fabricated rankings', () => {
  const older=ui.coinModel({mint,name:'Old',createdAt:'2026-01-01',rewardMode:'holder_alliance'});
  const newer=ui.coinModel({mint:mint.replace('5','6'),name:'New',createdAt:'2026-09-01'});
  assert.equal(ui.filterLaunches([older,newer], '', 'all')[0].name,'New');
  assert.equal(ui.filterLaunches([older,newer], '', 'community').length,1);
  assert.equal(ui.filterLaunches([older,newer], '', 'creator').length,1);
  assert.ok(!html.includes('Search coins or paste a CA'));
  assert.ok(html.indexOf('id="launch-search"') > html.indexOf('id="explore"'));
  assert.ok(html.includes('id="directory-search"'));
  assert.ok(!ui.cardHtml(newer).includes('Launched through SlimeWire. Open the chart'));
});

test('saved launch templates contain identity and route only, never wallet or spending approval',()=>{
  const result=ui.templateDraft({name:'Saved',symbol:'SAVE',mode:'holder_self',wallet:'secret',consentVersion:'approved',amount:100,launchAttemptId:'original'});
  assert.deepEqual(Object.keys(result),['name','symbol','description','mode']);
  assert.equal(result.mode,'holder_self');
  assert.equal(new URL(ui.draftUrl(result),'https://slimewire.org').searchParams.get('lc_utility'),'holder_self');
  assert.equal(ui.coinModel({mint,launchUtility:{mode:'holder_alliance'}}).rewardMode,'holder_alliance');
});
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
