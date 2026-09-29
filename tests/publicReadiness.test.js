import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
function journey(){const c={URL,URLSearchParams};vm.runInNewContext(read('web/public/site-journey.js'),c);return c.SlimeJourney;}
test('return destinations are allowlisted paths, never external redirects or payment approvals',()=>{
  const j=journey();
  assert.equal(j.safeReturn('/launch/community?mint=abc#connect'),'/launch/community?mint=abc#connect');
  for(const s of ['https://evil.test','//evil.test','/\\evil.test','/api/web/trade','/launch/community?token=secret','/wallet?buy=1','/launch/community%0a'])assert.equal(j.safeReturn(s),'',s);
});

test('public wallet redirects preserve incoming coin, activity and launch-return parameters',()=>{
  const redirects=read('web/public/_redirects');
  for(const route of ['/wallet','/wallet/','/wallet/*','/wallet.html']){
    const row=redirects.split(/\r?\n/).find(line=>line.trim().split(/\s+/)[0]===route);
    assert.equal(row.trim().split(/\s+/)[1],'https://app.slimewire.org/wallet');
  }
});
test('readiness never implies funding, authority or transaction simulation passed locally',()=>{
  const j=journey(); const rows=j.readiness({name:'Example',symbol:'EX',splitError:''});
  assert.equal(rows.filter(r=>r.state==='ready').length,2);
  assert.equal(rows.filter(r=>r.state==='review').length,3);
  assert.ok(rows.some(r=>/simulation/.test(r.label)));
  assert.equal(j.readiness({name:'',symbol:'',splitError:'Must total 100%'}).filter(r=>r.state==='fix').length,2);
});
test('games uses the published Steam trailer without autoplay or third-party player',()=>{
  const h=read('web/public/games.html');
  assert.match(h,/<video[^>]*controls[^>]*preload="none"[^>]*playsinline/);
  assert.match(h,/left4sol-steam-trailer\.mp4/);assert.doesNotMatch(h,/<video[^>]*autoplay/);
  assert.match(h,/Watch the gameplay trailer/);assert.match(h,/Coming soon on Steam/);
});
test('guest wallet and missing valuations are not shown as confirmed zero',()=>{
  const js=read('web/public/fun.js');
  assert.match(js,/<h1>Not connected<\/h1>/);
  assert.doesNotMatch(js,/valueUsd == null \? "\$0\.00"/);
  assert.match(js,/Backup.*Fund.*Explore/s);
});
test('help accurately distinguishes managed wallets, local lock and safe recovery',()=>{
  const h=read('web/public/help.html');
  for(const s of ['server can sign','does not stop server-side','outcome is unknown','network fees','protective exits'])assert.ok(h.includes(s),s);
  assert.match(h,/id="recovery"/);assert.match(h,/id="fees"/);assert.match(h,/id="security"/);
  assert.doesNotMatch(h,/guaranteed|fully audited|bank-grade|risk-free/);
});
test('coin artwork lookup is exact-mint, coalesced and free; provider failure stays unavailable',async()=>{
  const c={URL,URLSearchParams,AbortSignal,Promise};c.window=c;vm.runInNewContext(read('web/public/launch-pad.js'),c);
  const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';let calls=0;
  const resolver=c.SlimeLaunchPad.createImageResolver(async url=>{calls++;assert.equal(url,'https://api.dexscreener.com/latest/dex/tokens/'+mint);return {ok:true,json:async()=>({pairs:[{chainId:'solana',baseToken:{address:'other'},info:{imageUrl:'https://wrong.test/a.png'},liquidity:{usd:1000}},{chainId:'solana',baseToken:{address:mint},info:{imageUrl:'https://correct.test/a.png'},liquidity:{usd:1}}]})};});
  const [a,b]=await Promise.all([resolver(mint),resolver(mint)]);assert.equal(calls,1);assert.equal(a[0],'https://correct.test/a.png');assert.equal(b[0],a[0]);
  assert.equal((await resolver('bad')).length,0);assert.equal(calls,1);
  const fail=c.SlimeLaunchPad.createImageResolver(async()=>{throw Error('offline');});assert.equal((await fail(mint)).length,0);
});
test('terminal percentage display keeps missing data distinct from genuine zero',()=>{
  for(const file of ['index.html','gg.html']){
    const code=read('web/public/'+file).match(/function pctNum\(v\)\{[^\n]+/)[0];
    const c={};vm.runInNewContext(code,c);
    for(const v of [null,undefined,'',{}, {priceChange:null}])assert.equal(c.pctNum(v),null);
    assert.equal(c.pctNum(0),0);assert.equal(c.pctNum({priceChange:12}),12);assert.equal(c.pctNum('-5.2'),-5.2);
  }
});
test('X inbox backoff is capped and does not skip queued trade receipt handling',()=>{
  const s=read('src/index.js');const c={};vm.runInNewContext(s.match(/function xDmInboxBackoffMs\(failures\) \{[^\n]+/)[0],c);
  assert.equal(c.xDmInboxBackoffMs(1),15000);assert.equal(c.xDmInboxBackoffMs(3),60000);assert.equal(c.xDmInboxBackoffMs(100),300000);
  const tick=s.slice(s.indexOf('async function xDmPollTick()'),s.indexOf('async function handleXDmStatusCommand'));
  assert.match(tick,/Date.now\(\) < xDmInboxRetryAt[\s\S]*?await xDmFlushReceiptOutbox\(state\)/);
  assert.match(tick,/xDmFetchEvents[\s\S]*?xDmInboxFailures = 0/);
});
