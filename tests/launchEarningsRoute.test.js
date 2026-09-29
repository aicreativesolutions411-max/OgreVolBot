import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildLaunchEarnings} from '../src/lib/launchEarnings.js';
const source=readFileSync(new URL('../src/index.js',import.meta.url),'utf8');
const start=source.indexOf('    if (request.method === "GET" && pathname === "/api/web/launch/earnings")');
const end=source.indexOf('    if (request.method === "GET" && pathname === "/api/web/launch/directory")',start);
assert.ok(start>0&&end>start);
const route=new (Object.getPrototypeOf(async function(){}).constructor)('request','response','requestUrl','pathname','buildLaunchEarnings','readPumpLaunchAttempts','sendWebJson','sendCachedWebJson',source.slice(start,end));
async function query(search){
  let result;
  await route({method:'GET'},{setHeader(){}},new URL('https://example.test/api/web/launch/earnings?'+search),'/api/web/launch/earnings',buildLaunchEarnings,async()=>({attempts:[]}),
    (req,res,status,data,cors='',headers={})=>{result={status,data,cache:headers['Cache-Control']||'no-store'};},
    (req,res,status,data,cache)=>{result={status,data,cache};});
  return result;
}
test('public earnings uses the cached sender; wallet-specific earnings explicitly forbids shared caching',async()=>{
  const all=await query('scope=all');assert.equal(all.status,200);assert.equal(all.cache,'public, max-age=30');assert.equal(all.data.earnings.scope,'all');
  const mine=await query('wallet=AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9');assert.equal(mine.status,200);assert.equal(mine.cache,'private, no-store');
  for(const q of ['','scope=all&period=bad','scope=bad','wallet=bad'])assert.equal((await query(q)).status,400);
});
