import { PublicKey, SystemProgram } from '@solana/web3.js';
import { createRequire } from 'node:module';
import bs58 from 'bs58';
const {PUMP_PROGRAM_ID,PUMP_SDK}=createRequire(import.meta.url)('@pump-fun/pump-sdk');
const WSOL='So11111111111111111111111111111111111111112';
const TOKEN='TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const discriminator=Buffer.from([165,55,129,112,4,179,202,40]);

// Only our saved distribution signature is passed here, fetched at finalized
// commitment. Count actual inner transfers, never quotes, wallet-wide balances,
// gas refunds or rent returned by close-account instructions.
export function readLaunchFeeReceipt(tx,{signature,mint,configAddress,recipients}){
  if(!tx?.meta||tx.meta.err||String(tx.transaction?.signatures?.[0])!==signature)throw new Error('Finalized fee receipt unavailable.');
  const m=tx.transaction.message,keys=[...(m.accountKeys||m.staticAccountKeys||[]),...(tx.meta.loadedAddresses?.writable||[]),...(tx.meta.loadedAddresses?.readonly||[])].map(k=>String(k.pubkey||k));
  if(!keys.includes(configAddress))throw new Error('Receipt is not for this coin fee account.');
  const owners=new Map();
  for(const row of [...(tx.meta.preTokenBalances||[]),...(tx.meta.postTokenBalances||[])])if(row.mint===WSOL&&row.owner)owners.set(keys[row.accountIndex],row.owner);
  const credits=Object.fromEntries(recipients.map(wallet=>[wallet,0n]));let event=null;
  for(const group of tx.meta.innerInstructions||[])for(const ix of group.instructions||[]){
    const program=keys[ix.programIdIndex];let data;try{data=Buffer.from(bs58.decode(ix.data||''));}catch{continue;}
    if(program===PUMP_PROGRAM_ID.toBase58()&&data.length>16&&data.subarray(8,16).equals(discriminator)){
      const decoded=PUMP_SDK.decodeDistributeCreatorFeesEvent(data.subarray(16));
      if(decoded.mint.toBase58()!==mint||decoded.sharingConfig.toBase58()!==configAddress||![WSOL,PublicKey.default.toBase58()].includes(decoded.quoteMint.toBase58()))continue;
      if(event)throw new Error('Ambiguous fee distribution events.');event=decoded;
    }
    let destination='',amount=0n;
    if(program===SystemProgram.programId.toBase58()&&data.length===12&&data.readUInt32LE(0)===2){destination=keys[ix.accounts[1]];amount=data.readBigUInt64LE(4);}
    if(program===TOKEN&&data.length>=9&&[3,12].includes(data[0])){destination=owners.get(keys[ix.accounts[data[0]===3?1:2]])||'';amount=data.readBigUInt64LE(1);}
    if(Object.hasOwn(credits,destination))credits[destination]+=amount;
  }
  if(!event)throw new Error('Verified Pump fee event is not indexed yet.');
  const actual=Object.values(credits).reduce((a,b)=>a+b,0n);
  if(actual!==BigInt(event.distributed.toString())||!event.shareholders.every(s=>recipients.includes(s.address.toBase58()))||event.shareholders.length!==recipients.length)throw new Error('Fee event and recipient transfers do not reconcile.');
  return {totalLamports:String(actual),payments:recipients.map(wallet=>({wallet,lamports:String(credits[wallet])})),accountingStatus:'verified',
    ...(Number.isSafeInteger(tx.blockTime)&&tx.blockTime>0?{confirmedAt:new Date(tx.blockTime*1000).toISOString()}: {})};
}
