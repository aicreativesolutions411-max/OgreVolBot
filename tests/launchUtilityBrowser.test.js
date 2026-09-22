import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const listeners = {};
const context = vm.createContext({ window: {}, URLSearchParams, document: { addEventListener: (name, fn) => { listeners[name] = fn; } } });
vm.runInContext(readFileSync(new URL('../web/public/launch-utility.js', import.meta.url), 'utf8'), context);
const ui = context.window.SlimeLaunchUtility;

test('utility availability uses the configured API origin, not the static-site HTML fallback', async () => {
  const urls = [];
  const c = vm.createContext({
    window: { OGRE_PORTAL_CONFIG: { apiBase: 'https://app.slimewire.org/' } },
    document: { addEventListener() {} }, URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch: async url => { urls.push(url); return { ok: true, json: async () => ({ usepaid: { available: true }, nftFloor: { available: false } }) }; }
  });
  vm.runInContext(readFileSync(new URL('../web/public/launch-utility.js', import.meta.url), 'utf8'), c);
  await Promise.all([c.window.SlimeLaunchUtility.capabilities(), c.window.SlimeLaunchUtility.capabilities()]);
  assert.deepEqual(urls, ['https://app.slimewire.org/api/web/launch/utility/capabilities']);
});
test('Telegram deep-link prefills utility but can never imply launch consent', () => {
  const draft = ui.prefill('?lc_n=Test&lc_s=TST&lc_dev=0.5&lc_nft=1&lc_utility=usepaid&lc_xpay=alice&consentVersion=2026-09-22&launchAttemptId=other');
  assert.equal(draft.name, 'Test'); assert.equal(draft.devBuySol, '0.5'); assert.equal(draft.nftEnabled, true);
  assert.equal(draft.launchUtility.xHandle, 'alice');
  assert.equal(draft.launchUtility.consentVersion, undefined); assert.equal(draft.launchAttemptId, undefined);
  assert.equal(ui.prefill('?unrelated=true'), null);
  assert.equal(ui.prefill('?lc_n=Test&lc_dev=-1&lc_utility=evil').devBuySol, '0');
});
test('pending fee setup provides owned-attempt recovery, never a second launch button', () => {
  const utility = { launchAttemptId: 'test-id', status: 'PENDING_SETUP', xHandle: 'alice', error: '<script>bad</script>' };
  const html = ui.resultHtml({ launchUtility: utility });
  assert.ok(html.includes('data-launch-utility-retry="test-id"'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!ui.resultHtml({ launchUtility: { ...utility, status: 'ACTIVE' } }).includes('data-launch-utility-retry='));
  assert.ok(!ui.resultHtml({ launchUtility: { ...utility, status: 'CONFLICT' } }).includes('data-launch-utility-retry='));
});
test('all web launch surfaces wire recovery without polling or new wallet creation', () => {
  for (const name of ['app.js', 'fun.js', 'gg.html', 'index.html']) {
    const source = readFileSync(new URL('../web/public/' + name, import.meta.url), 'utf8');
    assert.ok(source.includes('configureRecovery'), name);
  }
  const source = readFileSync(new URL('../web/public/launch-utility.js', import.meta.url), 'utf8');
  assert.ok(!source.includes('setInterval'));
  assert.ok(!source.includes('/api/web/wallet/create'));
});
