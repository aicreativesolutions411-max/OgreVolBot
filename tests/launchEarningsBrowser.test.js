import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const context=vm.createContext({window:{},URL,URLSearchParams});
const source=readFileSync(new URL('../web/public/launch-earnings.js',import.meta.url),'utf8');
vm.runInContext(source,context);
const ui=context.window.SlimeEarnings;
test('earnings are precise, escaped and distinguish unknown claims from zero',()=>{
  assert.equal(ui.sol('123456789123456789'),'123456789.123456789 SOL');assert.equal(ui.sol(null),'Not attributed');
  const html=ui.earningsHtml({paidLamports:'1000000001',reservedLamports:'20',claimableLamports:null,note:'<unsafe>',coins:[{mint:'abc',symbol:'<bad>',name:'Name',imageUrl:'javascript:evil',roles:['Developer'],paidLamports:null,reservedLamports:null,receipts:[],partial:true}]});
  assert.ok(html.includes('1.000000001'));assert.ok(html.includes('Check in Wallet'));assert.ok(html.includes('Not attributed'));
  assert.ok(html.includes('&lt;bad&gt;'));assert.ok(!html.includes('javascript:evil'));assert.ok(html.includes('Total received'));
});

test('compact views filter roles and coins, sort exact amounts, and keep unknowns last',()=>{
  const data={scope:'all',coins:[{mint:'a',symbol:'LOW',paidLamports:'9007199254740992',roles:['Developer']},{mint:'b',symbol:'HIGH',paidLamports:'9007199254740993',roles:['Receiving wallet']},{mint:'c',symbol:'UNKNOWN',paidLamports:null,roles:[]}]};
  assert.equal(ui.filteredCoins(data)[0].symbol,'HIGH');assert.equal(ui.filteredCoins(data)[2].symbol,'UNKNOWN');
  assert.equal(ui.filteredCoins(data,{role:'Developer'}).length,1);assert.equal(ui.filteredCoins(data,{search:'high'})[0].mint,'b');
  assert.ok(ui.listHtml(data).includes('data-earn-coin="a"'));
  assert.ok(ui.summaryHtml({...data,paidLamports:'0',reservedLamports:'0',period:'7d'}).includes('Past 7 days'));
  const detail=ui.detailHtml({...data.coins[0],totalPaidLamports:'10',receipts:[]},{collectionTotalLamports:'15',destinations:[{label:'<wallet>',shareBps:10000,paidLamports:'10',reservedLamports:null}]});
  assert.ok(detail.includes('&lt;wallet&gt;'));assert.ok(detail.includes('Fees collected'));assert.ok(detail.includes('data-detail-panel="payments"'));
});
test('earnings screen is read-only and has no trading or claim submission',()=>{
  assert.ok(!source.includes('setInterval'));assert.ok(!source.includes("method:'POST'"));assert.ok(!source.includes('signTransaction'));
  const html=readFileSync(new URL('../web/public/launch-earnings.html',import.meta.url),'utf8');
  assert.ok(html.includes('Use my SlimeWire wallets'));assert.ok(html.includes('/wallet'));assert.ok(html.includes('No signature'));
});

test('entirely unattributed legacy history is not presented as zero earnings',()=>{
  const data={scope:'all',period:'all',paidLamports:'0',reservedLamports:'0',developerPaidLamports:'0',communityPaidLamports:'0',recipientPaidLamports:'0',incomplete:true,unknownCoins:1,coins:[{paidLamports:null,reservedLamports:null}]};
  assert.ok(ui.summaryHtml(data).includes('Not attributed'));assert.ok(!ui.summaryHtml(data).includes('0 SOL'));
  assert.ok(!ui.summaryHtml({...data,scope:'mine'}).includes('0 SOL'));
  assert.ok(ui.summaryHtml({...data,coins:[{paidLamports:'0',reservedLamports:'0'}]}).includes('earn-total-unit'));
});

test('public lists hide test launches while wallet earnings and accounting totals are preserved',()=>{
  const coins=[{mint:'a',symbol:'TEST',hiddenFromDiscovery:true,paidLamports:'1000000000'},{mint:'b',symbol:'REAL',paidLamports:'2000000000'}];
  assert.equal(ui.filteredCoins({scope:'all',coins}).length,1);
  assert.equal(ui.filteredCoins({scope:'mine',coins}).length,2);
  const html=ui.summaryHtml({scope:'all',coins,paidLamports:'3000000000'});
  assert.ok(html.includes('Test coins are hidden'));assert.ok(html.includes('3<span'));
});
test('coin rows and details expose the full copy CA and exact DexScreener link',()=>{
  const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';
  const c={mint,symbol:'L4S',name:'Left4Sol',paidLamports:'0',totalPaidLamports:'0',receipts:[]};
  for(const html of [ui.listHtml({scope:'all',coins:[c]}),ui.detailHtml(c,null)]){
    assert.ok(html.includes('data-copy-ca="'+mint+'"'));assert.ok(html.includes('https://dexscreener.com/solana/'+mint));
    assert.ok(html.includes('data-market-mint="'+mint+'"'));
  }
  assert.equal(ui.coinLinks({mint:'javascript:alert(1)'}),'');
});
test('market values label FDV honestly, show freshness and distinguish zero change from missing',()=>{
  const html=ui.marketHtml({status:'ready',marketCap:12345,fdv:20000,change24h:0,asOf:1000});
  assert.ok(html.includes('$12.35K'));assert.ok(html.includes('0.0%'));assert.ok(html.includes('DexScreener'));
  const fallback=ui.marketHtml({status:'ready',marketCap:null,fdv:20000,change24h:null,asOf:1000});
  assert.ok(fallback.includes('FDV'));assert.ok(fallback.includes('MC unavailable'));assert.ok(!fallback.includes('0.0%'));
  assert.ok(ui.marketHtml({status:'error',asOf:1000}).includes('Unavailable'));
  assert.ok(!ui.marketHtml({status:'error',asOf:1000}).includes('$0'));
});
test('copy uses the complete case-sensitive mint and surfaces blocked clipboard writes',async()=>{
  const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';let copied='';
  await ui.copyContractAddress(mint,async value=>{copied=value;});assert.equal(copied,mint);
  await assert.rejects(ui.copyContractAddress('bad',async()=>{}),/Invalid contract/);
  await assert.rejects(ui.copyContractAddress(mint,async()=>{throw Error('blocked');}),/blocked/);
  assert.ok(source.includes("input.readOnly=true"));assert.ok(source.includes('input.select()'));
});
