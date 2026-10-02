import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {Keypair} from '@solana/web3.js';
const source=readFileSync(new URL('../web/public/launch-market.js',import.meta.url),'utf8');
const context=vm.createContext({window:{},AbortController,setTimeout,clearTimeout,URL});
vm.runInContext(source,context);
const {selectMarket,createReader}=context.window.SlimeLaunchMarket;
const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';
const pair=(extra={})=>({chainId:'solana',baseToken:{address:mint},liquidity:{usd:1000},marketCap:12345,fdv:20000,priceUsd:'0.000012345',priceChange:{h24:-4.5},volume:{h24:120},...extra});
test('market data requires an exact base mint on Solana and selects the deepest pool',()=>{
  const r=selectMarket(mint,[pair({marketCap:99,liquidity:{usd:2000}}),pair(),pair({chainId:'ethereum',liquidity:{usd:1e9}}),pair({baseToken:{address:mint.toLowerCase()},liquidity:{usd:1e10}}),pair({baseToken:{address:'other'},quoteToken:{address:mint},liquidity:{usd:1e11}})],100);
  assert.equal(r.marketCap,99);assert.equal(r.asOf,100);assert.equal(r.change24h,-4.5);
  assert.equal(selectMarket(mint,[],100).status,'unavailable');
});
test('unknown market cap stays unknown; FDV is separate and bad numbers are discarded',()=>{
  const r=selectMarket(mint,[pair({marketCap:null,fdv:2000,liquidity:{usd:-1},volume:{h24:'bad'},priceUsd:0,priceChange:{h24:Infinity}})],100);
  assert.equal(r.marketCap,null);assert.equal(r.fdv,2000);assert.equal(r.liquidity,null);assert.equal(r.volume24h,null);assert.equal(r.price,null);assert.equal(r.change24h,null);
  assert.equal(selectMarket(mint,[pair({marketCap:0,fdv:0,priceChange:{h24:0},volume:{h24:0}})],100).change24h,0);
});
test('read batches and coalesces mints, caches positives and refreshes on expiry',async()=>{
  let calls=0,now=1000;
  const reader=createReader({now:()=>now,ttlMs:100,fetchImpl:async(url,opts)=>{calls++;assert.equal(opts.credentials,'omit');assert.ok(url.startsWith('https://api.dexscreener.com/tokens/v1/solana/'));return {ok:true,json:async()=>[pair()]};}});
  const [a,b]=await Promise.all([reader.read([mint,mint,'bad']),reader.read([mint])]);
  assert.equal(calls,1);assert.equal(a[mint].marketCap,12345);assert.equal(b[mint].marketCap,12345);
  await reader.read([mint]);assert.equal(calls,1);now+=101;await reader.read([mint]);assert.equal(calls,2);
  reader.clear();await reader.read([mint]);assert.equal(calls,3);
});
test('provider requests have at most 30 mints and errors use a short retry cache',async()=>{
  const mints=Array.from({length:61},()=>Keypair.generate().publicKey.toBase58());let calls=0,now=1000;
  const reader=createReader({now:()=>now,retryMs:10,fetchImpl:async url=>{calls++;assert.ok(url.split('/').at(-1).split(',').length<=30);return {ok:false,status:429};}});
  const r=await reader.read(mints);assert.equal(calls,3);assert.equal(Object.keys(r).length,61);assert.equal(r[mints[0]].status,'error');
  await reader.read([mints[0]]);assert.equal(calls,3);now+=11;await reader.read([mints[0]]);assert.equal(calls,4);
});
test('market lookup times out, releases pending entries and allows retry',async()=>{
  let calls=0,now=1000;
  const reader=createReader({now:()=>now,retryMs:1,timeoutMs:5,fetchImpl:async()=>{calls++;return new Promise(()=>{});}});
  assert.equal((await reader.read([mint]))[mint].status,'error');
  now+=2;await reader.read([mint]);assert.equal(calls,2);
});
test('the browser cache is bounded and no paid API or polling is introduced',async()=>{
  const mints=Array.from({length:4},()=>Keypair.generate().publicKey.toBase58());
  const reader=createReader({maxEntries:2,fetchImpl:async()=>({ok:true,json:async()=>[]})});
  await reader.read(mints);assert.equal(reader.peek(mints[0]),undefined);assert.ok(reader.peek(mints[3]));
  assert.ok(!/setInterval|helius|alchemy|api-key/i.test(source));
});
