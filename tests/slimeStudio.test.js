import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const load=file=>{const c={URL,URLSearchParams};vm.runInNewContext(read('web/public/'+file),c);return c;};
test('rehearsal conserves hypothetical lamports and separates rounding from allocations',()=>{
  const r=load('launch-rehearsal.js').SlimeRehearsal;
  const model=r.preview({fees:'1.000000001',creator:20,own:40,partner:20,wallet:20});
  assert.equal(model.totalLamports,'1000000001');assert.equal(model.roundingLamports,'1');
  assert.equal(model.rows.reduce((n,x)=>n+BigInt(x.lamports),BigInt(model.roundingLamports)),1000000001n);
  assert.equal(r.preview({fees:'0',creator:100,own:0,partner:0,wallet:0}).rows[0].lamports,'0');
});
test('rehearsal rejects invalid fee plans and never assumes earnings or funds',()=>{
  const r=load('launch-rehearsal.js').SlimeRehearsal;
  for(const creator of [-1,0,1.5,NaN,101])assert.throws(()=>r.preview({fees:'1',creator,own:100-creator,partner:0,wallet:0}));
  for(const fees of ['-1','Infinity','NaN','1e9','1000001','0.0000000001'])assert.throws(()=>r.preview({fees,creator:100,own:0,partner:0,wallet:0}));
  assert.throws(()=>r.preview({fees:'1',creator:20,own:20,partner:20,wallet:20}),/100/);
  const js=read('web/public/launch-rehearsal.js');assert.doesNotMatch(js,/fetch\(|\/api\/|setInterval|signTransaction|sendTransaction/);
});
test('rehearsal handoff contains only an editable fee draft, never hypothetical money or consent',()=>{
  const r=load('launch-rehearsal.js').SlimeRehearsal;
  const draft=r.draft({name:'Example',symbol:'EX',fees:'10',creator:20,own:60,partner:0,wallet:20,recipientWallet:'wallet',devWallet:'secret',approve:true});
  assert.equal(draft.mode,'holder_alliance');assert.equal(draft.launchUtility.recipients[0].shareBps,2000);
  assert.doesNotMatch(JSON.stringify(draft),/fees|devWallet|approve|secret|budget|buySol/);
});
test('tool search supports synonyms and all destinations are navigation only',()=>{
  const t=load('slime-tools.js').SlimeTools;
  for(const q of ['backup','sweep','bundle','preset','stop loss','build','fees','scan'])assert.ok(t.search(q).length,q);
  assert.ok(t.search('definitely-unknown-tool').length===0);
  for(const item of t.items){assert.ok(item.href.startsWith('/')&&!item.href.startsWith('//'));assert.doesNotMatch(item.href,/\/api\/|token=|approve=|execute=|buy=|sell=/);}
  assert.doesNotMatch(read('web/public/slime-tools.js'),/fetch\(|localStorage|setInterval|sendTransaction/);
});
test('Build UI escapes user content and permits only safe external evidence',()=>{
  const ui=load('slime-build.js').SlimeBuildUI;
  assert.equal(ui.esc('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
  for(const u of ['javascript:alert(1)','data:text/html,hi','https://me:password@example.org'])assert.equal(ui.safeEvidence(u),'');
  assert.equal(ui.safeEvidence('https://example.org/build'),'https://example.org/build');
  assert.equal(ui.sol(null),'Not available');assert.equal(ui.sol('0'),'0 SOL');
  assert.equal(ui.label('ACCEPTED'),'Creator accepted');
});
test('wallet tool deep links only allow opening known screens',()=>{
  const js=read('web/public/fun.js'),c={URLSearchParams};
  vm.runInNewContext(js.match(/function requestedWalletTool\(routeParams\) \{[\s\S]*?\n  \}/)[0],c);
  for(const tool of ['wallets','bundle','presets'])assert.equal(c.requestedWalletTool(new URLSearchParams({tool})),tool);
  for(const tool of ['send','sell','approve','fund','constructor','__proto__'])assert.equal(c.requestedWalletTool(new URLSearchParams({tool})), '');
  const block=js.slice(js.indexOf('async function openRequestedWalletTool('),js.indexOf('function applyInitialRoute('));
  assert.doesNotMatch(block,/post\(|confirmWalletManagerAction|saveTradePreset|signTransaction|amountSol|destination:/);
  assert.match(block,/if \(!state.token\)/);
});
test('new Build endpoints preserve authentication and bounded read-only public access',()=>{
  const s=read('src/index.js');
  assert.ok(s.indexOf('pathname === "/api/web/build/public"')<s.indexOf('pathname === "/api/web/build/dashboard"'));
  const privateRoutes=s.slice(s.indexOf('pathname === "/api/web/build/dashboard"'),s.indexOf('pathname === "/api/web/community/dashboard"'));
  assert.match(privateRoutes,/dashboard\(auth.userId\)/);assert.match(privateRoutes,/\[action\]\(auth.userId, body\)/);assert.match(privateRoutes,/18000/);assert.match(privateRoutes,/private, no-store/);
  assert.doesNotMatch(read('src/lib/slimeBuild.js'),/sendTransaction|signTransaction|getBalance|fetch\(|setInterval/);
});
