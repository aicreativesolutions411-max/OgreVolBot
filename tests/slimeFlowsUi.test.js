import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createSlimeFlowsClient } from '../web/public/slime-flows-sdk.js';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const source=read('web/public/launch-flows.js'),html=read('web/public/launch-flows.html'),index=read('src/index.js');
const window={document:{getElementById:()=>null}};vm.runInNewContext(source,{window});
test('flow UI escapes names, addresses and provider messages; exact SOL formatting',()=>{
  const ui=window.SlimeFlowsUI;assert.equal(ui.sol('9007199254740993001'),'9007199254.740993001');
  const h=ui.previewHtml({allocatedLamports:'1000000000',retainedLamports:'1',destinations:[{label:'<script>bad</script>',lamports:'1'}],note:'<img onerror=bad>'});assert.doesNotMatch(h,/<script>|<img/);assert.match(h,/&lt;script&gt;/);
  const p=ui.policyHtml({policy:{creatorShareBps:1000,ownHolderShareBps:0,partnerHolderShareBps:0,recipients:[{label:'<evil>',wallet:'<wallet>',shareBps:9000}]}});assert.doesNotMatch(p,/<evil>|<wallet>/);
});
test('UI provides a real review, separates allocations from payments, no auto POST or polls',()=>{
  assert.match(html,/flow-ack/);assert.match(html,/No arbitrary code/);assert.match(source,/Allocations · not payments/);assert.match(source,/Coin payment receipts/);assert.doesNotMatch(source,/setInterval\(/);
  assert.match(source,/reviewHash:review.review.hash/);assert.match(source,/caps\?\.activation\?\.available/);assert.match(source,/No background polling, no automatic POST/);
});
test('all write and private read routes occur after authentication; public only exposes capabilities',()=>{
  const privateRoute=index.indexOf('pathname === "/api/web/flows/dashboard"'),auth=index.lastIndexOf('const auth =',privateRoute);
  assert.ok(auth>0&&privateRoute>auth);assert.ok(index.indexOf('pathname === "/api/web/flows/capabilities"')<auth);
  const route=index.slice(privateRoute,index.indexOf('pathname === "/api/web/community/dashboard"',privateRoute));
  assert.match(route,/auth.userId/);assert.match(route,/readJsonRequestBody\(request, 12000\)/);assert.match(route,/private, no-store/);
  const handler=index.slice(index.indexOf('if (/^\\/flows'),index.indexOf('if (/^\\/(rewards|community'));
  assert.match(handler,/isPrivateChat/);assert.doesNotMatch(handler,/\.activate\(|decryptWallet|sendRawTransaction/);
});
test('production collection and allocation use gate; settlement reconciliation remains separate',()=>{
  assert.match(index,/SLIME_FLOWS_VALIDATED_VERSION === "2026-09-29-v1"/);
  assert.match(index,/holderCrankOnly && !last.pending && !evaluateFlow/);
  assert.match(index,/allocationLimitLamports: decision.allocationLimitLamports/);
  assert.match(index,/flowRun: decision.runId/);
  assert.match(read('web/public/_redirects'),/\/launch\/flows\s+https:\/\/app.slimewire.org\/launch\/flows\s+302/);
});
test('SDK does not auto-request or follow redirects with bearer tokens; activation explicit',async()=>{
  const calls=[];const client=createSlimeFlowsClient({baseUrl:'https://example.test',getToken:()=> 'test-only',fetchImpl:async(url,options)=>{calls.push({url:String(url),options});return {ok:true,json:async()=>({ok:true,result:{state:'DRAFT'}})};}});
  assert.equal(calls.length,0);await client.saveDraft({attemptId:'owned',revision:0});assert.equal(calls.length,1);assert.equal(calls[0].options.redirect,'error');assert.equal(calls[0].options.headers.Authorization,'Bearer test-only');assert.ok(!calls[0].url.includes('test-only'));
  await assert.rejects(createSlimeFlowsClient({getToken:()=>''}).dashboard(),/session/);
  assert.throws(()=>createSlimeFlowsClient({baseUrl:'http://external.example'}),/HTTPS/);
});
