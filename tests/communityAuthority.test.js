import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair,PublicKey,Connection } from '@solana/web3.js';
import { createRequire } from 'node:module';
import { assertCommunityAuthorityState as check,verifyCommunityAuthority } from '../src/lib/communityAuthority.js';
const require=createRequire(import.meta.url);
const {feeSharingConfigPda,getPumpProgram,getPumpAmmProgram,PUMP_PROGRAM_ID,PUMP_AMM_PROGRAM_ID}=require('@pump-fun/pump-sdk');
const BN=require('bn.js');
const mint=Keypair.generate().publicKey,owner=Keypair.generate().publicKey;
const base=()=>({mint:mint.toBase58(),wallet:owner.toBase58(),editable:true,curve:{creator:owner,quoteMint:PublicKey.default,complete:false}});
test('creator is proven from Pump curve; wrong wallet or quote fails closed',()=>{
  assert.equal(check(base()).creator,owner.toBase58());
  assert.throws(()=>check({...base(),wallet:Keypair.generate().publicKey.toBase58()}),/creator/);
  assert.throws(()=>check({...base(),curve:{...base().curve,quoteMint:Keypair.generate().publicKey}}),/SOL-paired/);
  assert.throws(()=>check({...base(),curve:{...base().curve,complete:true}}),/canonical/);
});
test('locked config can attest original creator but cannot be rewritten',()=>{
  const a={...base(),curve:{...base().curve,creator:feeSharingConfigPda(mint)},config:{version:2,mint,admin:owner,adminRevoked:true,shareholders:[]}};
  assert.throws(()=>check(a),/locked/);assert.match(check({...a,editable:false}).role,/Recorded/);
  assert.throws(()=>check({...a,editable:false,config:{...a.config,admin:Keypair.generate().publicKey}}),/creator/);
});
test('only initial version-two single creator config can be connected',()=>{
  const a={...base(),curve:{...base().curve,creator:feeSharingConfigPda(mint)},config:{version:2,mint,admin:owner,adminRevoked:false,shareholders:[{address:owner,shareBps:10000}]}};
  assert.equal(check(a).editable,true);assert.throws(()=>check({...a,config:{...a.config,version:1}}),/locked/);
  assert.throws(()=>check({...a,curve:{...a.curve,isCashbackCoin:true}}),/Cashback/);
});

const offline=new Connection('http://127.0.0.1:8899');
async function curveAccount({complete=false,creator=owner}={}) {
  const data=await getPumpProgram(offline).coder.accounts.encode('bondingCurve',{
    virtualTokenReserves:new BN(1000000000),virtualQuoteReserves:new BN(30000000000),
    realTokenReserves:new BN(100000000),realQuoteReserves:new BN(1000000000),tokenTotalSupply:new BN(1000000000),
    complete,creator,isMayhemMode:false,isCashbackCoin:false,quoteMint:PublicKey.default
  });
  return {owner:PUMP_PROGRAM_ID,data,executable:false,lamports:1,rentEpoch:0};
}
async function poolAccount({coinCreator=owner,baseMint=mint}={}) {
  const data=await getPumpAmmProgram(offline).coder.accounts.encode('pool',{
    poolBump:255,index:0,creator:owner,baseMint,quoteMint:new PublicKey('So11111111111111111111111111111111111111112'),
    lpMint:mint,poolBaseTokenAccount:mint,poolQuoteTokenAccount:owner,lpSupply:new BN(0),coinCreator,isMayhemMode:false,isCashbackCoin:false
  });
  return {owner:PUMP_AMM_PROGRAM_ID,data,executable:false,lamports:1,rentEpoch:0};
}
function rpc(curve,pool=null) { return {getMultipleAccountsInfoAndContext:async(keys,options)=>{
  assert.equal(keys.length,3);assert.equal(options.commitment,'finalized');return {context:{slot:99},value:[curve,null,pool]};
}}; }
test('binary current and legacy creator-bearing Pump curves verify through one finalized free batch',async()=>{
  const account=await curveAccount();
  for(const length of [81,82,83,115]) {
    const proof=await verifyCommunityAuthority(mint,owner,{connection:rpc({...account,data:account.data.subarray(0,length)}),editable:true});
    assert.equal(proof.creator,owner.toBase58());assert.equal(proof.slot,99);
  }
  await assert.rejects(verifyCommunityAuthority(mint,owner,{connection:rpc({...account,data:account.data.subarray(0,80)})}),/creator|incomplete/i);
});
test('graduated authority uses the canonical pool coin creator and rejects wrong mint or creator',async()=>{
  const curve=await curveAccount({complete:true,creator:Keypair.generate().publicKey}),pool=await poolAccount();
  const proof=await verifyCommunityAuthority(mint,owner,{connection:rpc(curve,pool),editable:true});
  assert.equal(proof.creator,owner.toBase58());
  await assert.rejects(verifyCommunityAuthority(mint,owner,{connection:rpc(curve,await poolAccount({coinCreator:Keypair.generate().publicKey}))}),/creator/i);
  await assert.rejects(verifyCommunityAuthority(mint,owner,{connection:rpc(curve,await poolAccount({baseMint:Keypair.generate().publicKey}))}),/canonical|mint/i);
  const legacyPool={...pool,data:pool.data.subarray(0,243)};
  assert.equal((await verifyCommunityAuthority(mint,owner,{connection:rpc(curve,legacyPool)})).creator,owner.toBase58());
});
