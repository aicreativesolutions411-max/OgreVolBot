import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { buildLaunchEarnings } from '../src/lib/launchEarnings.js';
const key=()=>Keypair.generate().publicKey.toBase58();
const a=key(),b=key(),mint=key();
test('earnings combine actual destination transfers without counting vault funding twice',()=>{
  const row={status:'COMPLETE',tokenMint:mint,symbol:'TEST',devWalletPublicKey:a,launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:6000,partnerHolderShareBps:0,recipientShareBps:2000,recipients:[{wallet:b,shareBps:2000}]},holderAllianceLedger:{paidByWallet:{[a]:'30',[b]:'40'},credits:{[b]:'20'},paidLamports:'70',lastSnapshotAt:100},allianceDistribution:{receipts:[{signature:'x',accountingStatus:'verified',payments:[{wallet:a,lamports:'10'},{wallet:key(),lamports:'80'}]}]}};
  const r=buildLaunchEarnings([row,row],[a,b,a]);assert.equal(r.coins.length,1);assert.equal(r.paidLamports,'80');assert.equal(r.reservedLamports,'20');assert.equal(r.claimableLamports,null);assert.ok(!JSON.stringify(r).includes('credits'));
  assert.deepEqual(buildLaunchEarnings([row],[key()]).coins,[]);
});
test('wallet-wide creator claims remain unavailable and older payment rows stay a subtotal',()=>{
  const r=buildLaunchEarnings([{status:'COMPLETE',tokenMint:mint,devWalletPublicKey:a}], [a]);assert.equal(r.coins[0].paidLamports,null);assert.equal(r.incomplete,true);assert.equal(r.claimableLamports,null);
  assert.throws(()=>buildLaunchEarnings([],['bad']));
});
