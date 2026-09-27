import test from 'node:test';
import assert from 'node:assert/strict';
import {Keypair,PublicKey,SystemProgram} from '@solana/web3.js';
import {readHolderSnapshot,pumpCurveUsdPrice} from '../src/lib/holderAllianceSnapshot.js';
const mint=Keypair.generate().publicKey.toBase58(),holder=Keypair.generate().publicKey;
function fixture({program='TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',price='1',amount=21000000n,duplicate=false,recipientOwner=SystemProgram.programId.toBase58(),marketMint=mint,incomplete=false,fail=false,accountType=2,state=1,accountMint=mint}={}){
  const calls=[];
  const fetchImpl=async(url,options)=>{
    calls.push(url);if(fail)return new Response('{}',{status:429});
    if(url.includes('dexscreener'))return Response.json({pairs:[{chainId:'solana',baseToken:{address:marketMint},priceUsd:price,liquidity:{usd:2000}}]});
    assert.equal(url,'https://api.mainnet-beta.solana.com');const {method,params}=JSON.parse(options.body);
    let result;
    if(method==='getAccountInfo')result={value:{owner:program,data:{parsed:{info:{decimals:6}}}}};
    else if(method==='getProgramAccounts'){
      assert.equal(params[0],program);assert.equal(params[1].commitment,'finalized');assert.equal(params[1].filters[0].memcmp.bytes,mint);
      const data=Buffer.alloc(program.startsWith('Tokenz')?166:165);new PublicKey(accountMint).toBuffer().copy(data);holder.toBuffer().copy(data,32);data.writeBigUInt64LE(amount,64);data[108]=state;if(data.length>165)data[165]=accountType;
      const account={pubkey:'account',account:{owner:program,space:program.startsWith('Tokenz')?170:165,data:[data.toString('base64'),'base64']}};
      result={context:{slot:123},value:duplicate?[account,account]:[account]};
    }else if(method==='getMultipleAccounts')result={context:{slot:123},value:incomplete?[]:[{owner:recipientOwner,executable:false}]};
    else throw Error('Unexpected RPC '+method);
    return Response.json({result});
  };return {fetchImpl,calls};
}
test('complete free snapshots support SPL and Token-2022 with exact raw balances',async()=>{
  for(const program of ['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb']){
    const f=fixture({program}),s=await readHolderSnapshot(mint,f);assert.equal(s.holders[0].wallet,holder.toBase58());assert.equal(s.holders[0].amount,'21000000');assert.equal(s.slot,123);assert.equal(f.calls.length,4);
  }
});
test('reject unavailable, duplicate, incomplete, wrong-token and unpriced data instead of a top-holder fallback',async()=>{
  for(const options of [{fail:true},{duplicate:true},{incomplete:true},{marketMint:Keypair.generate().publicKey.toBase58()},{price:'0'},{accountType:1},{state:0},{accountMint:Keypair.generate().publicKey.toBase58()}])await assert.rejects(readHolderSnapshot(mint,fixture(options)));
});
test('exclude program-owned recipients, exact-$20 holdings and explicit vaults',async()=>{
  assert.equal((await readHolderSnapshot(mint,fixture({recipientOwner:Keypair.generate().publicKey.toBase58()}))).holders.length,0);
  assert.equal((await readHolderSnapshot(mint,fixture({amount:20000000n}))).holders.length,0);
  assert.equal((await readHolderSnapshot(mint,{...fixture(),excluded:[holder.toBase58()]})).holders.length,0);
});
test('pre-graduation pricing verifies active SOL curve and real reserves; no synthetic liquidity promise',()=>{
  const curve={quoteMint:PublicKey.default,virtualTokenReserves:1000000000000000n,virtualQuoteReserves:30000000000n,realQuoteReserves:1000000000n,complete:false};
  assert.ok(Math.abs(Number(pumpCurveUsdPrice(curve,6,'100'))-0.000003)<1e-15);
  for(const edit of [{complete:true},{isMayhemMode:true},{realQuoteReserves:0n},{quoteMint:Keypair.generate().publicKey}])assert.throws(()=>pumpCurveUsdPrice({...curve,...edit},6,'100'));
  assert.throws(()=>pumpCurveUsdPrice(curve,6,'NaN'));
});
