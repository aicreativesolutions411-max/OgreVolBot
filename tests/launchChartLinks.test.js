import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
const c=vm.createContext({window:{},URLSearchParams});vm.runInContext(readFileSync(new URL('../web/public/chart-links.js',import.meta.url),'utf8'),c);
const {legacyTarget,externalChart}=c.window.SlimeChartLinks;const mint='5FQN4usbgWyDd5oyVNF8gan3yXAHS4gxzRGKgYyvpump';
test('old chart-only links lead to exact DexScreener token, with correct chain',()=>{
  assert.equal(legacyTarget({pathname:'/',hash:'#trade/'+mint}),externalChart(mint));
  assert.equal(legacyTarget({pathname:'/fun/',search:'?source=telegram&ca='+mint}),externalChart(mint));
  assert.equal(externalChart('0x09787BdFa8CeEdCce7B57bec351253Ddcc8283EB'),'https://dexscreener.com/robinhood/0x09787BdFa8CeEdCce7B57bec351253Ddcc8283EB');
});
test('wallet, explicit terminal, claims, buy, login, referral and embedded intents stay untouched',()=>{
  for(const pathname of ['/wallet','/wallet/','/terminal','/launch','/t'])assert.equal(legacyTarget({pathname,hash:'#trade/'+mint}),'');
  for(const extra of ['buy=1','quick=1','tokenAuth=x','bundleInvite=x','ref=someone','amount=0.1','action=claim'])assert.equal(legacyTarget({pathname:'/fun',search:'?source=telegram&ca='+mint+'&'+extra}),'');
  assert.equal(legacyTarget({pathname:'/',hash:'#launch'}),'');
  assert.equal(externalChart('javascript:alert(1)'),'');
  assert.equal(externalChart(mint,'robinhood'),'');
});
