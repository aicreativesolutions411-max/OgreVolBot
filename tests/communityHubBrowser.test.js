import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../web/public/launch-community.js',import.meta.url),'utf8');
const window={document:{getElementById:()=>null}};vm.runInNewContext(source,{window});
const ui=window.SlimeCommunity;
test('community display uses exact decimal SOL amounts and escapes untrusted content',()=>{
  assert.equal(ui.sol('1000000001'),'1.000000001');assert.equal(ui.sol('9007199254740993000'),'9007199254.740993');
  const html=ui.policyFacts({mode:'alliance',partnerWallet:'<script>bad</script>',partnerShareBps:1000},'creator');
  assert.ok(!html.includes('<script>'));assert.match(html,/90% creator/);
});
test('inbox distinguishes reserved, finalized and old snapshot state without auto claiming',()=>{
  const html=ui.inboxHtml({owedLamports:'500000',recentPaidLamports:'1000000',note:'Last snapshot, not live',coins:[]});
  assert.match(html,/Reserved · not yet paid/);assert.match(html,/not lifetime/);assert.match(html,/No saved eligible/);
  assert.ok(!html.includes('onclick='));
});
test('setup and project payments require explicit review checkboxes; no automatic POST or polling',()=>{
  assert.match(source,/Confirm permanent fee setup/);assert.match(source,/Distribute accrued creator fees/);
  assert.match(source,/name="acknowledge" required/);assert.match(source,/termsHash:p.termsHash/);
  assert.doesNotMatch(source,/setInterval\(/);
  assert.match(source,/Only explicit user actions can POST/);
  assert.match(source,/publicData\.agreements/);
});
test('wallet and Telegram link to inbox without changing the wallet theme or triggering payments',()=>{
  const gg=fs.readFileSync(new URL('../web/public/gg.html',import.meta.url),'utf8');
  assert.match(gg,/href="\/launch\/community#inbox"/);
  const index=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.match(index,/command: "rewards"/);assert.match(index,/command: "community"/);
  const command=index.slice(index.indexOf('if (/^\\/(rewards|community|connectcoin)'),index.indexOf('if (text === "/launch"'));
  assert.match(command,/isPrivateChat/);assert.doesNotMatch(command,/sendRawTransaction|hub\.confirm|decryptWallet/);
});

test('connecting an existing coin cannot wake old launch purchase callbacks',()=>{
  const index=fs.readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  const start=index.indexOf('async function reconcileLaunchAlliance(');
  const active=index.slice(start,index.indexOf('if (allianceConfigMatches(',start));
  assert.match(active,/if \(!attempt\.communityConnection\)\s*\{\s*void resumeLaunchBundleInvitesAfterFeeSharing\(attempt\)/);
});

test('public community entry routes to the wallet origin instead of the terminal SPA',()=>{
  const redirects=fs.readFileSync(new URL('../web/public/_redirects',import.meta.url),'utf8');
  assert.match(redirects,/^\/launch\/community\s+https:\/\/app\.slimewire\.org\/launch\/community\s+302$/m);
  assert.match(redirects,/^\/launch\/community\/\s+https:\/\/app\.slimewire\.org\/launch\/community\s+302$/m);
});
