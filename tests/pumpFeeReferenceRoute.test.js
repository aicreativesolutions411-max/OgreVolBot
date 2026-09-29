import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PublicKey } from '@solana/web3.js';
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const start=source.indexOf('    if (request.method === "GET" && pathname === "/api/web/launch/fee-reference")');
const end=source.indexOf('    if (request.method === "GET" && pathname === "/api/web/launch/rewards")',start);
assert.ok(start>0&&end>start);
const route=new (Object.getPrototypeOf(async function(){}).constructor)('request','response','requestUrl','pathname','PublicKey','readPumpLaunchAttempts','readPumpFeeReference','sendWebJson','sendCachedWebJson',source.slice(start,end));
const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';
test('only completed recorded launches can query Pump; route never claims or changes accounting',async()=>{
  let reads=0,calls=0,out;
  const run=async(value,attempts=[])=>{
    await route({method:'GET'},{},new URL('https://example.test/api/web/launch/fee-reference?mint='+value),'/api/web/launch/fee-reference',PublicKey,async()=>{reads++;return {attempts};},async a=>{calls++;return {mint:a.tokenMint,earnedLamports:'12'};},(q,r,status,data)=>out={status,data},(q,r,status,data,cache)=>out={status,data,cache});return out;
  };
  assert.equal((await run('bad')).status,400);assert.equal(reads,0);
  assert.equal((await run(mint)).status,404);assert.equal(calls,0);
  assert.equal((await run(mint,[{tokenMint:mint,status:'FAILED'}])).status,404);assert.equal(calls,0);
  const good=await run(mint,[{tokenMint:mint,status:'COMPLETE'}]);assert.equal(good.status,200);assert.equal(good.cache,'public, max-age=30');assert.equal(calls,1);
  assert.doesNotMatch(source.slice(start,end),/connection\.|upsert|sendTransaction|claimCreator/);
});
