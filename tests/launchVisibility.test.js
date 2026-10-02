import test from 'node:test';
import assert from 'node:assert/strict';
import {Keypair} from '@solana/web3.js';
import {isTestLaunch} from '../src/lib/launchVisibility.js';
import {buildLaunchDirectory} from '../src/lib/launchDirectory.js';
import {buildLaunchEarnings} from '../src/lib/launchEarnings.js';

const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';
test('test names and tickers are hidden without matching ordinary words',()=>{
  for(const name of ['Test','Slimewire.org test','Slimewire.org testing','Launch TEST_12','test2','Ｔｅｓｔ'])assert.equal(isTestLaunch({tokenName:name}),true,name);
  assert.equal(isTestLaunch({symbol:'TEST'}),true);
  assert.equal(isTestLaunch({metadataJson:{name:'A test launch'}}),true);
  for(const name of ['Contest','Testament','Latest','Pumptaur','Left4Sol'])assert.equal(isTestLaunch({tokenName:name}),false,name);
});
test('public discovery hides tests and cannot resurrect an older duplicate',()=>{
  const rows=[{status:'COMPLETE',tokenMint:mint,tokenName:'Old name',symbol:'OLD'},{status:'COMPLETE',tokenMint:mint,tokenName:'Test',symbol:'TEST'}];
  const before=JSON.stringify(rows);
  assert.deepEqual(buildLaunchDirectory(rows),[]);
  assert.equal(JSON.stringify(rows),before);
});
test('hiding discovery never deletes accounting records, owed funds or personal history',()=>{
  const wallet=Keypair.generate().publicKey.toBase58();
  const row={status:'COMPLETE',tokenMint:mint,tokenName:'Test',devWalletPublicKey:wallet,launchUtility:{mode:'holder_alliance'},holderAllianceLedger:{paidLamports:'30',paidByWallet:{[wallet]:'30'},credits:{[wallet]:'20'}}};
  for(const scope of ['all','mine']){
    const r=buildLaunchEarnings([row],[wallet],{scope});
    assert.equal(r.coins.length,1);assert.equal(r.coins[0].hiddenFromDiscovery,true);
    assert.equal(r.paidLamports,'30');assert.equal(r.reservedLamports,'20');
  }
});
