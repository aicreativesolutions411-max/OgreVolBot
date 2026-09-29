import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, statSync } from 'node:fs';
const read=n=>readFileSync(new URL('../'+n,import.meta.url),'utf8');
const context=vm.createContext({window:{}});
vm.runInContext(read('web/public/launch-fee-reference.js'),context);
const ui=context.window.SlimeFeeReference,mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';
test('source panel distinguishes unknown, explicit zero, earned and claimable',()=>{
  assert.equal(ui.sol(null),'Not available');assert.equal(ui.sol('0'),'0 SOL');assert.equal(ui.sol('9007199254740993'),'9007199.254740993 SOL');
  const html=ui.render(mint,{earnedLamports:'7872559004',status:'available',note:'<unsafe>',claimableLamports:'999'});
  assert.match(html,/7.872559004 SOL/);assert.match(html,/Earned is not paid/);assert.match(html,/Check in Wallet/);assert.match(html,/&lt;unsafe&gt;/);assert.doesNotMatch(html,/999/);
  assert.doesNotMatch(ui.render(mint,{earnedLamports:null,status:'unavailable'}),/>0 SOL</);
  assert.match(ui.render(mint,{earnedLamports:'12',status:'stale'}),/Cached · refresh delayed/);
  assert.equal(ui.render('javascript:evil'), '');
});
test('Pump source stays outside accounting, loads on detail only and does not block saved rewards',()=>{
  const js=read('web/public/launch-fee-reference.js');assert.doesNotMatch(js,/setInterval|signTransaction|method:.*POST/);
  assert.match(read('web/public/launch-pad.js'),/SlimeFeeReference\.mount/);
  assert.match(read('web/public/launch-earnings.js'),/SlimeFeeReference\.mount/);
  assert.doesNotMatch(read('src/lib/launchEarnings.js'),/readPumpFeeReference/);
  assert.doesNotMatch(read('src/lib/launchRewardReport.js'),/readPumpFeeReference/);
  for(const page of ['launch.html','launch-earnings.html'])assert.match(read('web/public/'+page),/launch-fee-reference\.js/);
});
test('homepage has unique fast lazy artwork and a direct public earnings entry',()=>{
  const html=read('web/public/home.html');
  for(const name of ['telegram-signal-v1','games-horde-v1','fees-flow-v1']){
    assert.match(html,new RegExp(name+'\\.webp[^>]+loading="lazy"'));
    assert.ok(statSync(new URL('../web/public/assets/slimewire/home/'+name+'.webp',import.meta.url)).size<180000);
  }
  assert.match(html,/href="\/launch\/earnings">View earnings/);
});
