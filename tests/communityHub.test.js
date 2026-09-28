import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { createCommunityHub, buildRewardsInbox, publicAgreement, receiptCredit, verifiedAgreementFor } from '../src/lib/communityHub.js';
import { publicHolderLedger } from '../src/lib/holderAlliance.js';
const key=()=>Keypair.generate().publicKey.toBase58();
const mint=key(),partner=key(),creator=key(),other=key(),holder=key();
const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:4000,partnerHolderShareBps:4000,partnerMint:partner,consentVersion:'test'};
function fixture(){
  let store={},rows=[],calls=0,t=1000000;
  const hub=createCommunityHub({read:async()=>structuredClone(store),write:async s=>{store=structuredClone(s);},lock:async fn=>fn(),now:()=>t,id:()=>`id${++calls}`,
    attempts:async()=>rows,wallets:async uid=>[{publicKey:uid==='u'?creator:other}],
    authority:async(m,w,{editable=false}={})=>{if(w!==(m===mint?creator:other))throw Error('Not this coin creator');return{mint:m,creator:w,editable:true,role:'Pump creator',checkedAt:new Date(t).toISOString()};},
    reviewPolicy:async p=>({...p}),connect:async r=>{const a={id:r.attemptId,tokenMint:r.mint,userId:r.userId,devWalletPublicKey:r.creator,status:'COMPLETE',launchUtility:r.policy,pumpFeeSharing:{status:'ACTIVE'}};rows.push(a);return {status:'ACTIVE'};},
    verifyReceipt:async()=> '1000000'});
  return {hub,get store(){return store;},get rows(){return rows;},set rows(v){rows=v;},advance:()=>{t+=700000;}};
}
test('existing coin review never submits; confirmation binds frozen terms and ownership',async()=>{
  const f=fixture(),r=await f.hub.review('u',{mint,wallet:creator,policy});assert.equal(f.rows.length,0);
  await assert.rejects(f.hub.confirm('x',{reviewId:r.id,acknowledge:true}),/not found/i);
  await assert.rejects(f.hub.confirm('u',{reviewId:r.id}),/permanent/i);
  await f.hub.confirm('u',{reviewId:r.id,acknowledge:true,policy:{creatorShareBps:9900}});
  assert.equal(f.rows[0].launchUtility.creatorShareBps,2000);
  await f.hub.confirm('u',{reviewId:r.id,acknowledge:true});assert.equal(f.rows.length,1);
});
test('expired reviews and foreign wallets cannot configure fees',async()=>{
  const f=fixture();await assert.rejects(f.hub.review('u',{mint,wallet:other,policy}),/wallet/i);
  const r=await f.hub.review('u',{mint,wallet:creator,policy});f.advance();await assert.rejects(f.hub.confirm('u',{reviewId:r.id,acknowledge:true}),/expired/i);
});
test('review cannot overwrite another account or a pre-existing reward program',async()=>{
  const f=fixture();f.rows=[{id:'a',tokenMint:mint,userId:'x',status:'COMPLETE'}];await assert.rejects(f.hub.review('u',{mint,wallet:creator,policy}),/account/i);
  f.rows=[{id:'a',tokenMint:mint,userId:'u',status:'COMPLETE',launchUtility:policy}];await assert.rejects(f.hub.review('u',{mint,wallet:creator,policy}),/already/i);
});
test('partnership requires each coin creator, exact terms and cannot silently change fees',async()=>{
  const f=fixture();f.rows=[{id:'a',tokenMint:mint,status:'COMPLETE',userId:'u',devWalletPublicKey:creator,launchUtility:policy,pumpFeeSharing:{status:'ACTIVE'}}];
  const p=await f.hub.propose('u',{mint,partnerMint:partner,wallet:creator});assert.equal(p.status,'PENDING');
  await assert.rejects(f.hub.respond('u',{id:p.id,wallet:creator,action:'accept',termsHash:p.termsHash}),/creator/i);
  await assert.rejects(f.hub.respond('v',{id:p.id,wallet:other,action:'accept',termsHash:'changed'}),/terms/i);
  const a=await f.hub.respond('v',{id:p.id,wallet:other,action:'accept',termsHash:p.termsHash});assert.equal(a.status,'VERIFIED');assert.equal(a.approvals.length,2);
  const r=await f.hub.respond('v',{id:p.id,wallet:other,action:'withdraw',termsHash:p.termsHash});assert.equal(r.status,'WITHDRAWN');assert.match(r.note,/does not change/i);
  assert.equal(f.rows[0].launchUtility.creatorShareBps,2000);
});
test('self partnerships and unrelated target coins are rejected',async()=>{
  const f=fixture();f.rows=[{id:'a',tokenMint:mint,status:'COMPLETE',userId:'u',devWalletPublicKey:creator,launchUtility:policy,pumpFeeSharing:{status:'ACTIVE'}}];
  await assert.rejects(f.hub.propose('u',{mint,partnerMint:mint,wallet:creator}),/different/i);
  await assert.rejects(f.hub.propose('u',{mint,partnerMint:key(),wallet:creator}),/recipient/i);
});
test('public partnership has no internal user IDs or execution credentials',()=>{
  const a=publicAgreement({id:'a',userId:'SECRET',mint,partnerMint:partner,status:'VERIFIED',terms:policy,approvals:[{userId:'SECRET',wallet:creator,at:'now'}],signedBytes:'SECRET'});
  assert.ok(!JSON.stringify(a).includes('SECRET'));
});
test('inbox uses wallet-specific finalized receipts, never the batch total',()=>{
  const a={tokenMint:mint,status:'COMPLETE',symbol:'TEST',launchUtility:policy,holderAllianceLedger:{credits:{[holder]:'2000000'},lastEligibility:{own:[holder],partner:[]},receipts:[{signature:'sig',lamports:'9000000',confirmedAt:'now',payments:[{wallet:holder,lamports:'1000000'},{wallet:other,lamports:'8000000'}]},{signature:'legacy',lamports:'999999'}]}};
  const inbox=buildRewardsInbox([a],[holder]);assert.equal(inbox.owedLamports,'2000000');assert.equal(inbox.recentPaidLamports,'1000000');assert.equal(inbox.coins[0].receipts.length,1);assert.ok(!JSON.stringify(inbox).includes(other));
});
test('inbox includes historical paid recipients even if no longer eligible',()=>{
  const a={tokenMint:mint,status:'COMPLETE',launchUtility:policy,holderAllianceLedger:{receipts:[{signature:'paid',payments:[{wallet:holder,lamports:'9'}]}]}};
  assert.equal(buildRewardsInbox([a],[holder]).coins.length,1);
});
test('goal requires the owned active manual treasury split; no invented automatic stop',async()=>{
  const f=fixture();f.rows=[{id:'a',tokenMint:mint,status:'COMPLETE',userId:'u',devWalletPublicKey:creator,launchUtility:{mode:'alliance',partnerWallet:other,partnerShareBps:2500,autoDistribute:false},pumpFeeSharing:{status:'ACTIVE'},allianceDistribution:{receipts:[]}}];
  await assert.rejects(f.hub.createGoal('u',{mint,title:'Art',targetSol:'0.1'}),/acknowledge/i);
  const g=await f.hub.createGoal('u',{mint,title:'Art',targetSol:'0.1',acknowledge:true});assert.equal(g.payee,other);assert.equal(g.targetLamports,'100000000');assert.match(g.note,/permanent/i);
  await assert.rejects(f.hub.createGoal('u',{mint,title:'Again',targetSol:'0.1',acknowledge:true}),/already/i);
});
test('goal receipts are finalized, scoped to stored distributions, and counted once',async()=>{
  const f=fixture();f.rows=[{id:'a',tokenMint:mint,status:'COMPLETE',userId:'u',devWalletPublicKey:creator,launchUtility:{mode:'alliance',partnerWallet:other,partnerShareBps:2500,autoDistribute:false},pumpFeeSharing:{status:'ACTIVE'},allianceDistribution:{receipts:[]}}];
  const g=await f.hub.createGoal('u',{mint,title:'Art',targetSol:'0.1',acknowledge:true});
  f.rows[0].allianceDistribution.receipts=[{signature:'sig',confirmedAt:new Date(1001000).toISOString()}];
  assert.equal((await f.hub.syncGoal('u',g.id)).paidLamports,'1000000');assert.equal((await f.hub.syncGoal('u',g.id)).paidLamports,'1000000');
  await assert.rejects(f.hub.syncGoal('v',g.id),/not found/i);
});
test('receipt credit excludes other owners and rejects failed/malformed transactions',()=>{
  const tx={meta:{err:null,preBalances:[10,20],postBalances:[10,120],preTokenBalances:[],postTokenBalances:[]},transaction:{message:{accountKeys:[creator,other]}}};
  assert.equal(receiptCredit(tx,other),'100');assert.throws(()=>receiptCredit({...tx,meta:{...tx.meta,err:{bad:true}}},other),/failed/i);
  assert.throws(()=>receiptCredit({...tx,meta:{...tx.meta,postBalances:[10,NaN]}},other),/balance/i);
});
test('public holder ledger never exposes the new wallet-level receipt map',()=>{
  const publicLedger=publicHolderLedger({receipts:[{signature:'s',lamports:'1',recipients:1,payments:[{wallet:holder,lamports:'1'}]}]});
  assert.ok(!JSON.stringify(publicLedger).includes(holder));assert.equal(publicLedger.receipts[0].lamports,'1');
});
test('project balance counts native SOL plus WSOL without treating another owner as the payee',()=>{
  const tx={meta:{err:null,preBalances:[100],postBalances:[100],preTokenBalances:[{owner:other,mint:'So11111111111111111111111111111111111111112',uiTokenAmount:{amount:'5'}}],postTokenBalances:[{owner:other,mint:'So11111111111111111111111111111111111111112',uiTokenAmount:{amount:'105'}},{owner:creator,mint:'So11111111111111111111111111111111111111112',uiTokenAmount:{amount:'99999'}}]},transaction:{message:{accountKeys:[other]}}};
  assert.equal(receiptCredit(tx,other),'100');
});
test('public verified badge binds the current program and disappears after withdrawal',async()=>{
  const f=fixture();f.rows=[{id:'a',tokenMint:mint,status:'COMPLETE',userId:'u',devWalletPublicKey:creator,launchUtility:policy,pumpFeeSharing:{status:'ACTIVE'}}];
  const p=await f.hub.propose('u',{mint,partnerMint:partner,wallet:creator});
  assert.equal(verifiedAgreementFor(f.rows[0],[p]),null);
  const a=await f.hub.respond('v',{id:p.id,wallet:other,action:'accept',termsHash:p.termsHash});
  assert.equal(verifiedAgreementFor(f.rows[0],[a]).id,p.id);
  assert.equal(verifiedAgreementFor({...f.rows[0],launchUtility:{...policy,creatorShareBps:3000}},[a]),null);
  const withdrawn=await f.hub.respond('v',{id:p.id,wallet:other,action:'withdraw',termsHash:p.termsHash});
  assert.equal(verifiedAgreementFor(f.rows[0],[withdrawn]),null);
});
test('a pending launch with the same mint is never imported into a second program',async()=>{
  const f=fixture();f.rows=[{id:'pending',userId:'u',mintPublicKey:mint,status:'SUBMITTED'}];
  await assert.rejects(f.hub.review('u',{mint,wallet:creator,policy}),/original launch/);
});
