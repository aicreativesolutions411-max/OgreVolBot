import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { retainEarningsHistory, earningsEvents } from '../src/lib/launchEarningsHistory.js';
import { buildLaunchEarnings } from '../src/lib/launchEarnings.js';
const key=()=>Keypair.generate().publicKey.toBase58();
const dev=key(),holder=key(),vault=key(),mint=key();
const at='2026-09-29T12:00:00.000Z';
const payment=(signature,lamports,confirmedAt=at)=>({signature,lamports,confirmedAt,payments:[{wallet:holder,lamports}],bySource:{own:lamports}});

test('permanent finalized history survives receipt rotation and deduplicates replay',()=>{
  let state={receipts:[payment('first','10')],receiptCount:1,paidLamports:'10'};
  state=retainEarningsHistory(state,'holder',at);
  state=retainEarningsHistory({...state,receipts:[payment('second','20')],receiptCount:2,paidLamports:'30'},'holder',at);
  state=retainEarningsHistory(state,'holder',at);
  assert.equal(earningsEvents(state,'holder').length,2);
  assert.equal(state.earningsHistory.totalLamports,'30');
  assert.equal(state.earningsHistory.paidByWallet[holder],'30');
  assert.equal(state.earningsHistory.incomplete,false);
});

test('legacy gaps and missing dates are explicit; pending collection receipts never count',()=>{
  const state=retainEarningsHistory({receipts:[payment('kept','10')],receiptCount:5,paidLamports:'90'},'holder',at);
  assert.equal(state.earningsHistory.incomplete,true);
  const direct=retainEarningsHistory({receipts:[{signature:'pending',totalLamports:'999'}, {signature:'ok',accountingStatus:'verified',payments:[{wallet:dev,lamports:'5'}],totalLamports:'5'}]},'collection',at);
  assert.equal(earningsEvents(direct,'collection').length,1);
  assert.equal(direct.earningsHistory.totalLamports,'5');
  assert.equal(earningsEvents(direct,'collection')[0].confirmedAt,'');
});

test('public all-time and rolling periods separate collection from recipient payouts',()=>{
  const row={status:'COMPLETE',tokenMint:mint,devWalletPublicKey:dev,createdAt:'2026-09-01',launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:8000},pumpFeeSharing:{vaultAddress:vault},
    allianceDistribution:{receipts:[{signature:'collection',accountingStatus:'verified',totalLamports:'100',confirmedAt:at,payments:[{wallet:dev,lamports:'20'},{wallet:vault,lamports:'80'}]}]},
    holderAllianceLedger:{paidLamports:'30',paidByWallet:{[holder]:'30'},paidBySource:{own:'30'},sourceTrackingSince:at,credits:{[holder]:'50'},creditSources:{own:{[holder]:'50'}},receipts:[payment('old','10','2026-09-01T12:00:00Z'),payment('new','20')],receiptCount:2}};
  const opts={scope:'all',now:Date.parse('2026-09-29T13:00:00Z')};
  const all=buildLaunchEarnings([row,row],[],opts);
  assert.equal(all.coins.length,1);assert.equal(all.paidLamports,'50');assert.equal(all.collectedLamports,'100');assert.equal(all.developerPaidLamports,'20');assert.equal(all.communityPaidLamports,'30');assert.equal(all.reservedLamports,'50');
  const recent=buildLaunchEarnings([row],[],{...opts,period:'24h'});
  assert.equal(recent.paidLamports,'40');assert.equal(recent.reservedLamports,'50');
  const mine=buildLaunchEarnings([row],[holder],{...opts,scope:'mine'});
  assert.equal(mine.paidLamports,'30');assert.equal(mine.coins[0].totalPaidLamports,'50');
  assert.ok(!JSON.stringify(all).includes('creditSources'));assert.ok(!JSON.stringify(all).includes(vault));
});

test('older cumulative wallet payments remain visible without fabricated dated records',()=>{
  const row={status:'COMPLETE',tokenMint:mint,devWalletPublicKey:dev,launchUtility:{mode:'holder_alliance'},holderAllianceLedger:{paidLamports:'90',paidByWallet:{[holder]:'90'},receiptCount:9,receipts:[payment('kept','10')],credits:{}}};
  const all=buildLaunchEarnings([row],[holder],{now:Date.parse(at)});
  assert.equal(all.paidLamports,'90');assert.equal(all.incomplete,true);
  const recent=buildLaunchEarnings([row],[holder],{period:'24h',now:Date.parse(at)});
  assert.equal(recent.paidLamports,'10');assert.equal(recent.incomplete,true);
  assert.throws(()=>buildLaunchEarnings([],[],{scope:'all',period:'bad'}),/period/i);
});

test('public totals cover every launch, not only the discovery page, and never expose private state',()=>{
  const rows=Array.from({length:105},(_,i)=>({status:'COMPLETE',tokenMint:'mint-'+i,devWalletPublicKey:dev,userId:'PRIVATE_OWNER',encryptedSecret:'SECRET',launchUtility:{mode:'alliance',partnerWallet:holder},allianceDistribution:{pending:{rawBase64:'SIGNED_BYTES'},receipts:[{signature:'sig-'+i,accountingStatus:'verified',totalLamports:'10',confirmedAt:at,payments:[{wallet:dev,lamports:'2'},{wallet:holder,lamports:'8'}]}]}}));
  const r=buildLaunchEarnings(rows,[],{scope:'all'});assert.equal(r.coins.length,105);assert.equal(r.paidLamports,'1050');assert.equal(r.recipientPaidLamports,'840');
  for(const privateValue of ['PRIVATE_OWNER','SECRET','SIGNED_BYTES'])assert.ok(!JSON.stringify(r).includes(privateValue));
});
