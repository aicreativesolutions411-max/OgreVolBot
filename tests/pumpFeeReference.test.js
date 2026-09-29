import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { createPumpFeeReferenceReader } from '../src/lib/pumpFeeReference.js';
const key=n=>Keypair.fromSeed(new Uint8Array(32).fill(n)).publicKey.toBase58();
const mint=key(1),creator=key(2),config=key(3),other=key(4);
const attempt={status:'COMPLETE',tokenMint:mint,devWalletPublicKey:creator,launchUtility:{mode:'creator'}};
const chain='solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const sol=n=>({quote:{chainId:chain,address:'So11111111111111111111111111111111111111112'},amount:{raw:n,decimals:9}});
const response=data=>({ok:true,json:async()=>data});
test('Pump creator earnings are explicitly mint-filtered and never treated as paid or claimable',async()=>{
  const calls=[];const read=createPumpFeeReferenceReader({fetchImpl:async url=>{calls.push(url);return response(url.includes('coins-v2')?{mint,creator}:{creator,earned:[sol('9007199254740993')],claimable:{native:'999'},isClaimable:true,series:[]});}});
  const r=await read(attempt);assert.equal(r.earnedLamports,'9007199254740993');assert.equal(r.claimableLamports,null);assert.equal(r.paidLamports,undefined);assert.equal(r.status,'available');
  assert.ok(calls.some(u=>new URL(u).searchParams.get('mint')===mint));assert.ok(calls.every(u=>!u.includes('/totals')));
});
test('empty, malformed, wrong creator and wrong asset results stay unknown, never zero',async()=>{
  for(const data of [{creator,earned:[]},{creator:other,earned:[sol('100')]},{creator,earned:[sol('-1')]},{creator,earned:[{...sol('100'),amount:{raw:'100',decimals:6}}]},{creator,earned:[{...sol('100'),quote:{chainId:chain,address:other}}]}]){
    const read=createPumpFeeReferenceReader({fetchImpl:async u=>response(u.includes('coins-v2')?{mint,creator}:data)});
    const r=await read(attempt);assert.equal(r.earnedLamports,null);assert.notEqual(r.status,'available');
  }
});
test('an explicit source zero is different from absent source data',async()=>{
  const read=createPumpFeeReferenceReader({fetchImpl:async u=>response(u.includes('coins-v2')?{mint,creator}:{creator,earned:[sol('0')]})});
  assert.equal((await read(attempt)).earnedLamports,'0');
});
test('sharing data must match the exact chain, mint and saved config; wallet totals are ignored',async()=>{
  const a={...attempt,launchUtility:{mode:'alliance',creatorShareBps:5000},pumpFeeSharing:{configAddress:config}};
  const row={coin:{chainId:chain,address:mint},configAddress:config,totalEarned:[sol('345')],totalUnclaimed:[sol('123')]};
  const read=createPumpFeeReferenceReader({fetchImpl:async()=>response({coins:[{...row,coin:{chainId:chain,address:other}},row],totals:{earned:[sol('999999999')]}})});
  const r=await read(a);assert.equal(r.earnedLamports,'345');assert.equal(r.awaitingDistributionLamports,'123');assert.equal(r.claimableLamports,null);assert.equal(r.scope,'sharing_config');
  const wrong=createPumpFeeReferenceReader({fetchImpl:async()=>response({coins:[{...row,configAddress:other}]})});
  assert.equal((await wrong(a)).earnedLamports,null);
});
test('requests are coalesced and cached, errors retain a clearly stale reference',async()=>{
  let now=100000,calls=0,fail=false;
  const read=createPumpFeeReferenceReader({now:()=>now,ttlMs:1000,fetchImpl:async u=>{calls++;if(fail)throw Error('provider down');return response(u.includes('coins-v2')?{mint,creator}:{creator,earned:[sol('12')]});}});
  await Promise.all([read(attempt),read(attempt),read(attempt)]);assert.equal(calls,2);
  await read(attempt);assert.equal(calls,2);
  now+=2000;fail=true;const stale=await read(attempt);assert.equal(stale.status,'stale');assert.equal(stale.earnedLamports,'12');assert.equal(stale.checkedAt,new Date(100000).toISOString());
  now+=1800001;assert.equal((await read(attempt)).earnedLamports,null);
});

test('zero-developer holder splits use the saved rewards vault and paginate without fetching wallet totals',async()=>{
  const calls=[],a={...attempt,launchUtility:{mode:'holder_alliance',creatorShareBps:0},pumpFeeSharing:{configAddress:config,vaultAddress:other}};
  const read=createPumpFeeReferenceReader({fetchImpl:async url=>{calls.push(url);return response(calls.length===1?{coins:[],nextCursor:'page/2'}:{coins:[{coin:{chainId:chain,address:mint},configAddress:config,totalEarned:[sol('55')],totalUnclaimed:[sol('11')]}]});}});
  const r=await read(a);assert.equal(r.earnedLamports,'55');assert.equal(r.scope,'sharing_config');assert.equal(calls.length,2);
  assert.ok(calls.every(u=>new URL(u).pathname.endsWith('/'+other)));assert.equal(new URL(calls[1]).searchParams.get('cursor'),'page/2');
});

test('concurrency is bounded and aged references are not retained when the provider is busy',async()=>{
  let now=100000,block=false,release;
  const read=createPumpFeeReferenceReader({now:()=>now,ttlMs:1000,maxConcurrent:1,fetchImpl:async url=>{
    if(block)await new Promise(resolve=>{release=resolve;});
    return response(url.includes('coins-v2')?{mint,creator}:{creator,earned:[sol('12')]});
  }});
  await read(attempt);now+=1800001;block=true;
  const busy=read({...attempt,tokenMint:other});
  assert.equal((await read(attempt)).earnedLamports,null);
  block=false;release();await busy;
});
test('non-completed, invalid and legacy reward modes never trigger provider calls',async()=>{
  let calls=0;const read=createPumpFeeReferenceReader({fetchImpl:async()=>{calls++;throw Error('unexpected');}});
  for(const a of [{...attempt,status:'FAILED'},{...attempt,tokenMint:'bad'},{...attempt,pumpCashback:true},{...attempt,launchUtility:{mode:'usepaid'}}])assert.equal((await read(a)).earnedLamports,null);
  assert.equal(calls,0);
});
