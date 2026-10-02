import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const listeners = {};
const context = vm.createContext({ window: {}, URLSearchParams, document: { addEventListener: (name, fn) => { listeners[name] = fn; } } });
vm.runInContext(readFileSync(new URL('../web/public/launch-utility.js', import.meta.url), 'utf8'), context);
const ui = context.window.SlimeLaunchUtility;

test('unavailable X claims are not advertised to new launchers, while old draft rows remain visible',()=>{
  assert.match(ui.render('new',{mode:'holder_alliance'}),/<details data-social-recipients hidden/);
  assert.equal(ui.socialEditorVisible(false,'holder_alliance',0),false);
  assert.equal(ui.socialEditorVisible(true,'holder_alliance',0),true);
  assert.equal(ui.socialEditorVisible(false,'holder_alliance',1),true);
  assert.equal(ui.socialEditorVisible(true,'holder_self',1),false);
});

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

test('shared templates preserve draft recipients but strip spending, consent and execution state',()=>{
  const wallet='5FQN4usbgWyDd5oyVNF8gan3yXAHS4gxzRGKgYyvpump';
  const template=ui.templateDraft({name:'Coin',symbol:'TST',description:'Draft',walletIndex:4,devBuySol:5,launchAttemptId:'bad',launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:4000,partnerHolderShareBps:0,recipients:[{wallet,shareBps:4000,label:'Team',secret:'no'}],consentVersion:'approved',autoDistribute:true}});
  assert.equal(template.launchUtility.recipients[0].wallet,wallet);
  assert.equal(template.launchUtility.recipientShareBps,4000);
  assert.equal(template.walletIndex,undefined);assert.equal(template.devBuySol,undefined);
  assert.equal(template.launchUtility.consentVersion,undefined);
  assert.equal(template.launchUtility.autoDistribute,undefined);
  assert.equal(template.launchUtility.recipients[0].secret,undefined);
  const link=ui.templateLink(template);assert.ok(link.startsWith('https://slimewire.org/launch?template='));
  const parsed=ui.prefill('?lc_template='+encodeURIComponent(JSON.stringify(template))+'&lc_dev=5&walletIndex=7');
  assert.equal(parsed.devBuySol,'0');assert.equal(parsed.sharedTemplate,true);
  assert.equal(parsed.launchUtility.recipients[0].wallet,wallet);
  assert.throws(()=>ui.parseTemplate('x'.repeat(20000)),/template/i);
  assert.equal(ui.prefill('?lc_template=not-json'),null);
  assert.equal(ui.templateDraft({launchUtility:{mode:'usepaid',xHandle:'alice'}}).launchUtility.mode,'creator');
});

test('terminal and wallet launch workspace preserve the complete draft policy across navigation',()=>{
  for(const name of ['index.html','gg.html']){
    const source=readFileSync(new URL('../web/public/'+name,import.meta.url),'utf8');
    assert.ok(source.includes('lcUtilityPolicy:d.launchUtility'));
    assert.ok(source.includes('f.lcUtilityPolicy=SlimeLaunchUtility.read("lcUtility")'));
    assert.ok(source.includes('SlimeLaunchUtility.render("lcUtility",state.launchForm?.lcUtilityPolicy||{})'));
  }
});

test('multi-recipient editor escapes labels and maintains valid-total feedback',()=>{
  const html=ui.recipientEditor('r',{recipients:[{wallet:'abc',shareBps:2500,label:'<team>'},{wallet:'def',shareBps:1000,label:'Second'}]});
  assert.ok(html.includes('&lt;team&gt;'));assert.ok(html.includes('Add recipient'));assert.ok(html.includes('data-recipient-row'));
  assert.equal(ui.draftError({mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:4000,partnerHolderShareBps:0,recipients:[]}), 'Fee percentages must total 100%.');
  assert.equal(ui.draftError({mode:'creator'}),'');
});

test('X drafts preserve percentages but never import profile proof or identity approval',()=>{
  const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:0,partnerHolderShareBps:0,recipients:[],socialRecipients:[{handle:'artist',xUserId:'123',shareBps:8000,name:'Artist',profileProof:'secret-proof'}]};
  const draft=ui.templateDraft({launchUtility:policy});
  assert.equal(draft.launchUtility.socialRecipients[0].shareBps,8000);
  assert.equal(draft.launchUtility.socialRecipients[0].xUserId,undefined);
  assert.equal(draft.launchUtility.socialRecipients[0].profileProof,undefined);
  assert.equal(ui.draftError(draft.launchUtility),'');
  assert.ok(ui.render('x',policy).includes('X recipients · claim SOL'));
  assert.ok(!ui.render('x',policy).includes('value="holder_self" selected'));
});

test('X drafts cannot silently change the share total or accept duplicate handles',()=>{
  const p={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:0,partnerHolderShareBps:0,recipients:[],socialRecipients:[{handle:'artist',shareBps:8000}]};
  assert.equal(ui.draftError(p),'');
  assert.match(ui.draftError({...p,creatorShareBps:3000}),/100%/);
  assert.match(ui.draftError({...p,socialRecipients:[{handle:'Artist',shareBps:4000},{handle:'artist',shareBps:4000}]}),/duplicate/);
});

test('claim page uses same-origin HttpOnly session flow, exact review, and no simulated live earnings',()=>{
  const page=readFileSync(new URL('../web/public/launch-claim.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../web/public/launch-claim.js',import.meta.url),'utf8');
  assert.ok(page.includes('id="claim-signin" disabled'));assert.ok(page.includes('id="claim-confirm" type="button" disabled'));
  assert.ok(js.includes("credentials:'same-origin'"));assert.ok(js.includes("'X-Slime-CSRF'"));
  assert.ok(!js.includes('localStorage'));assert.ok(!js.includes('setInterval'));assert.ok(!js.includes('DEMO'));
});
