import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createReadStreamBackoff } from '../src/lib/readStreamBackoff.js';
test('denied stream backs off, redacts secrets and is bounded', () => {
  let now=1000; const b=createReadStreamBackoff({now:()=>now,random:()=>0});
  assert.equal(b.fail(new Error('403 https://host/secret?api-key=SECRET')).category,'authorization');
  assert.equal(b.remaining(),60000);
  assert.doesNotMatch(JSON.stringify(b.state()),/SECRET|https|host/);
  for(let i=0;i<20;i++)b.fail('403');
  assert.equal(b.remaining(),300000);
  now+=300001;assert.equal(b.remaining(),0);
  b.reset();assert.deepEqual(b.state(),{failures:0,retryAt:0,category:'',lastError:''});
});
test('transient and rate-limited failures retain separate retry floors', () => {
  const b=createReadStreamBackoff({now:()=>0,random:()=>0});
  b.fail('socket closed');assert.equal(b.remaining(),3000);
  b.reset();b.fail('429 Too Many Requests');assert.equal(b.remaining(),15000);
});
test('buy wake connection honors retry deadline even when polling calls start repeatedly', () => {
  const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  assert.ok(source.includes('if (groupBuyWakeBackoff.remaining() > 0) return;'));
  assert.ok(source.includes('chainWakeRetryAfterMs: groupBuyWakeBackoff.remaining()'));
});

test('background wake no longer inherits trading RPC credentials and waits for accepted subscriptions',()=>{
  const s=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
  const select=s.slice(s.indexOf('function groupBuyChainWakeUrl()'),s.indexOf('const GROUP_BUY_CHAIN_WAKE_URL'));
  assert.match(select,/wss:\/\/api.mainnet.solana.com/);assert.doesNotMatch(select,/CONFIG\.(?:rpcUrl|readRpcUrl|heliusWsUrl)/);
  const start=s.slice(s.indexOf('function startGroupBuyChainWake()'),s.indexOf('function syncGroupBuyChainWake(mints)'));
  const open=start.slice(start.indexOf('ws.on("open"'),start.indexOf('ws.on("pong"'));
  assert.doesNotMatch(open,/groupBuyWakeBackoff.reset/);
  assert.match(start,/if \(groupBuyChainWakeWs !== ws\) return;/);
  assert.match(start,/Number.isSafeInteger\(subscription\)[\s\S]*?groupBuyWakeBackoff.reset/);
});
