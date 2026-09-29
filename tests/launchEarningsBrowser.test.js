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
