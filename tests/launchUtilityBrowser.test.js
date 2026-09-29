import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const listeners = {};
const context = vm.createContext({ window: {}, URLSearchParams, document: { addEventListener: (name, fn) => { listeners[name] = fn; } } });
vm.runInContext(readFileSync(new URL('../web/public/launch-utility.js', import.meta.url), 'utf8'), context);
const ui = context.window.SlimeLaunchUtility;

test('Alliance is selectable, retired routes cannot be newly selected, and automatic distribution is opt-in', () => {
  const html=ui.render('test',{});
  assert.ok(html.includes('value="alliance"'));
  assert.ok(!html.includes('value="usepaid"'));
  assert.ok(html.includes('RecipientShare'));
  assert.ok(html.includes('NOT a coin CA'));
  assert.ok(html.includes('value="nft_floor" hidden disabled'));
  assert.ok(!/<input[^>]+AutoDistribute[^>]+checked/.test(html));
  const draft=ui.prefill('?lc_n=Test&lc_utility=alliance&lc_community=Friends&partnerWallet=evil&autoDistribute=true&consentVersion=yes');
  assert.equal(draft.launchUtility.mode,'alliance');
  assert.equal(draft.launchUtility.partnerName,'Friends');
  assert.equal(draft.launchUtility.partnerWallet,undefined);
  assert.equal(draft.launchUtility.autoDistribute,undefined);
});

test('Alliance review requires explicit approval and returns only server-reviewed policy and consent',async()=>{
  const policy={mode:'alliance',partnerWallet:'wallet',partnerShareBps:3000};let lines;
  const request=async()=>({available:true,policy,summary:'30% community',warnings:['Permanent'],treasury:'wallet',consentVersion:'version'});
  await assert.rejects(ui.prepare(policy,{},request,async()=>false),/No coin was created/);
  const result=await ui.prepare(policy,{},request,async x=>{lines=x;return true;});
  assert.equal(result.consentVersion,'version');
  assert.ok(lines.some(x=>x.includes('full community wallet')));
  assert.ok(!lines.join(' ').includes('UsePaid terms'));
  await assert.rejects(ui.prepare(policy,{},async()=>({available:false,blockers:['Offline']}),async()=>true),/Offline/);
});

test('Alliance result exposes setup and distribution receipts without claiming X cash or invented totals',()=>{
  const utility={mode:'alliance',launchAttemptId:'original',status:'ACTIVE',partnerWallet:'wallet',partnerShareBps:3000,partnerName:'<script>',signature:'setup',distribution:{status:'CONFIRMED',signature:'payout',receiptCount:1,receipts:[{signature:'payout',confirmedAt:'today'}]}};
  const html=ui.resultHtml({launchUtility:utility});
  assert.ok(html.includes('70% creator'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('data-alliance-distribute="original"'));
  assert.ok(html.includes('solscan.io/tx/payout'));
  assert.ok(!html.includes('UsePaid'));
});

test('utility availability uses the configured API origin, not the static-site HTML fallback', async () => {
  const urls = [];
  const c = vm.createContext({
    window: { OGRE_PORTAL_CONFIG: { apiBase: 'https://app.slimewire.org/' } },
    document: { addEventListener() {} }, URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch: async url => { urls.push(url); return { ok: true, json: async () => ({ holderAlliance: { available: true }, alliance: { available: true } }) }; }
  });
  vm.runInContext(readFileSync(new URL('../web/public/launch-utility.js', import.meta.url), 'utf8'), c);
  await Promise.all([c.window.SlimeLaunchUtility.capabilities(), c.window.SlimeLaunchUtility.capabilities()]);
  assert.deepEqual(urls, ['https://app.slimewire.org/api/web/launch/utility/capabilities']);
});
test('Telegram deep-link prefills utility but can never imply launch consent', () => {
  const draft = ui.prefill('?lc_n=Test&lc_s=TST&lc_dev=0.5&lc_nft=1&lc_utility=usepaid&lc_xpay=alice&consentVersion=2026-09-22&launchAttemptId=other');
  assert.equal(draft.name, 'Test'); assert.equal(draft.devBuySol, '0.5'); assert.equal(draft.nftEnabled, true);
  assert.equal(draft.launchUtility.xHandle, undefined);
  assert.equal(draft.launchUtility.mode, 'creator');
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
