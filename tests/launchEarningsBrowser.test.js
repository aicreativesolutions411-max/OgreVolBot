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
  assert.ok(html.includes('1.000000001 SOL'));assert.ok(html.includes('Check in Wallet'));assert.ok(html.includes('Not attributed'));
  assert.ok(html.includes('&lt;bad&gt;'));assert.ok(!html.includes('javascript:evil'));assert.ok(html.includes('Recorded paid'));
});
test('earnings screen is read-only and has no trading or claim submission',()=>{
  assert.ok(!source.includes('setInterval'));assert.ok(!source.includes("method:'POST'"));assert.ok(!source.includes('signTransaction'));
  const html=readFileSync(new URL('../web/public/launch-earnings.html',import.meta.url),'utf8');
  assert.ok(html.includes('Use my SlimeWire wallets'));assert.ok(html.includes('/wallet'));assert.ok(html.includes('No signature'));
});
