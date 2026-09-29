import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {Keypair,PublicKey,SystemProgram} from '@solana/web3.js';
import bs58 from 'bs58';
import {readLaunchFeeReceipt} from '../src/lib/launchFeeReceipt.js';
import {settleLaunchAlliance} from '../src/lib/launchAllianceSettlement.js';
const require=createRequire(import.meta.url),{PUMP_PROGRAM_ID,PUMP_SDK}=require('@pump-fun/pump-sdk'),BN=require('bn.js');
const key=()=>Keypair.generate().publicKey,WSOL='So11111111111111111111111111111111111111112',TOKEN='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
function fixture({token=false}={}){
  const mint=key(),config=key(),creator=key(),vault=key(),ata=key(),vat=key();
  const keys=[PUMP_PROGRAM_ID,SystemProgram.programId,config,mint,creator,vault,new PublicKey(TOKEN),ata,vat];
  const event=PUMP_SDK.offlinePumpProgram.coder.types.encode('distributeCreatorFeesEvent',{timestamp:new BN(1),mint,bondingCurve:key(),sharingConfig:config,admin:creator,shareholders:[{address:creator,shareBps:2000},{address:vault,shareBps:8000}],distributed:new BN(1000),quoteMint:PublicKey.default});
  const instructions=[{programIdIndex:0,accounts:[],data:bs58.encode(Buffer.concat([Buffer.alloc(8),Buffer.from([165,55,129,112,4,179,202,40]),event]))}];
  for(const [index,amount] of [[4,200],[5,800]]){
    const data=Buffer.alloc(token?9:12);if(token){data[0]=3;data.writeBigUInt64LE(BigInt(amount),1);}else{data.writeUInt32LE(2);data.writeBigUInt64LE(BigInt(amount),4);}
    instructions.push({programIdIndex:token?6:1,accounts:token?[2,index+3]:[2,index],data:bs58.encode(data)});
  }
  const tx={transaction:{signatures:['sig'],message:{staticAccountKeys:keys}},meta:{err:null,innerInstructions:[{index:0,instructions}],postTokenBalances:token?[{mint:WSOL,owner:creator.toBase58(),accountIndex:7},{mint:WSOL,owner:vault.toBase58(),accountIndex:8}]:[]}};
  return {tx,args:{signature:'sig',mint:mint.toBase58(),configAddress:config.toBase58(),recipients:[creator.toBase58(),vault.toBase58()]}};
}
test('actual SDK event plus native transfers reconciles exact per-coin recipient amounts',()=>{
  for(const token of [false,true]){const {tx,args}=fixture({token}),r=readLaunchFeeReceipt(tx,args);assert.equal(r.accountingStatus,'verified');assert.equal(r.totalLamports,'1000');assert.deepEqual(r.payments.map(p=>p.lamports),['200','800']);}
});

test('period filters use the finalized chain timestamp when it is available',()=>{
  const {tx,args}=fixture();tx.blockTime=1790683200;
  assert.equal(readLaunchFeeReceipt(tx,args).confirmedAt,new Date(tx.blockTime*1000).toISOString());
});
test('wrong coin, missing event, failed transaction and mismatched transfers are never reported as earned fees',()=>{
  const {tx,args}=fixture();
  for(const change of [{mint:key().toBase58()},{signature:'other'},{configAddress:key().toBase58()},{recipients:[key().toBase58()]}])assert.throws(()=>readLaunchFeeReceipt(tx,{...args,...change}));
  const failed=structuredClone(tx);failed.meta.err={InstructionError:[0,'Custom']};assert.throws(()=>readLaunchFeeReceipt(failed,args));
  const missing={...tx,meta:{...tx.meta,innerInstructions:[]}};assert.throws(()=>readLaunchFeeReceipt(missing,args));
  tx.meta.innerInstructions[0].instructions.pop();assert.throws(()=>readLaunchFeeReceipt(tx,args),/reconcile/);
});
test('accounting recovery rotates past unavailable history and never resubmits a payment',async()=>{
  let state={receipts:[{signature:'unavailable'},{signature:'available'}]},sends=0;const reads=[];
  const args={load:async()=>structuredClone(state),save:async s=>{state=s},prepare:async()=>null,connection:{sendRawTransaction:async()=>{sends++}},now:()=>new Date().toISOString(),readReceipt:async signature=>{reads.push(signature);if(signature==='unavailable')throw Error('pruned');return {accountingStatus:'verified',totalLamports:'100',payments:[]}}};
  await settleLaunchAlliance(args);await settleLaunchAlliance(args);
  assert.deepEqual(reads,['unavailable','available']);assert.equal(sends,0);assert.equal(state.receipts[1].totalLamports,'100');
});
