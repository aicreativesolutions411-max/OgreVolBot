import test from 'node:test';
import assert from 'node:assert/strict';
import { Keypair } from '@solana/web3.js';
import { createSocialClaimIdentity, assertSocialOrigin, socialCookie } from '../src/lib/socialClaimIdentity.js';
import { socialClaimCapabilities, SOCIAL_FEE_CONSENT_VERSION } from '../src/lib/socialFeePolicy.js';
import { createSocialClaimTickets, settleSocialClaim, socialClaimDashboard } from '../src/lib/socialClaimSettlement.js';
import { createSocialClaimRoutes } from '../src/lib/socialClaimRoutes.js';
import { normalizeHolderAlliance } from '../src/lib/holderAlliance.js';
import { assertLaunchUtilityReady } from '../src/lib/launchUtility.js';
import { buildLaunchRewardReport } from '../src/lib/launchRewardReport.js';
import { buildLaunchEarnings } from '../src/lib/launchEarnings.js';
const env={SLIME_X_CLIENT_ID:'client',SLIME_X_CLIENT_SECRET:'secret',SLIME_X_SESSION_SECRET:'test-key-'.repeat(8),SLIME_X_APP_BEARER_TOKEN:'lookup',SLIME_X_CALLBACK_URL:'https://app.slimewire.org/api/web/social-claims/callback'};
const policy=normalizeHolderAlliance({creatorShareBps:2000,ownHolderShareBps:0,partnerHolderShareBps:0,recipients:[],socialRecipients:[{handle:'artist',xUserId:'123456789',shareBps:8000,name:'Artist'}],consentVersion:SOCIAL_FEE_CONSENT_VERSION});
const wallet=Keypair.generate().publicKey.toBase58(),mint=Keypair.generate().publicKey.toBase58();
const attempt=()=>({id:'launch1',status:'COMPLETE',tokenMint:mint,tokenName:'Test coin',symbol:'TEST',devWalletPublicKey:Keypair.generate().publicKey.toBase58(),pumpFeeSharing:{status:'ACTIVE',vaultAddress:Keypair.generate().publicKey.toBase58()},launchUtility:policy,holderAllianceLedger:{socialCredits:{'123456789':'2000000'},sourceTrackingSince:1,allocatedBySource:{'x:123456789':'2000000'}}});
function identityFixture(){
  let state={},time=1000000,calls=[];let fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>url.endsWith('/token')?{token_type:'bearer',access_token:'test-access'}:{data:{id:'123456789',username:'artist',name:'Artist'}}};};
  const deps={read:async()=>structuredClone(state),mutate:async fn=>{const copy=structuredClone(state),value=await fn(copy);state=copy;return value;},env,fetchImpl:(...args)=>fetcher(...args),now:()=>time};
  return {api:createSocialClaimIdentity(deps),deps,state:()=>state,calls,advance:n=>time+=n,fetch:f=>fetcher=f};
}
test('configuration cannot bypass the code-level funded-validation hold',()=>{
  assert.equal(socialClaimCapabilities(env).identityConfigured,true);
  assert.equal(socialClaimCapabilities({...env,SLIME_X_CLAIMS_ENABLED:'true'}).available,false);
  assert.equal(socialClaimCapabilities({...env,SLIME_X_CALLBACK_URL:'https://evil.example/callback'}).identityConfigured,false);
  assert.throws(()=>assertLaunchUtilityReady(policy,{rail:'pump'},env),/validation/);
});
test('OAuth uses PKCE S256, encrypted verifier, one-time state and no provider-token storage',async()=>{
  const f=identityFixture(),start=await f.api.start(),url=new URL(start.url),state=url.searchParams.get('state');
  assert.equal(url.searchParams.get('code_challenge_method'),'S256');
  assert.equal(url.searchParams.get('scope'),'tweet.read users.read');
  await assert.rejects(f.api.finish({state,code:'code',browser:'wrong'}),/another browser/);
  const signed=await f.api.finish({state,code:'code',browser:start.browser});
  const verifier=f.calls[0].options.body.get('code_verifier');assert.ok(verifier);
  assert.ok(!JSON.stringify(f.state()).includes(verifier));assert.ok(!JSON.stringify(f.state()).includes('test-access'));assert.ok(!JSON.stringify(f.state()).includes(signed.token));
  assert.equal((await f.api.session(signed.token)).xUserId,'123456789');
  await assert.rejects(f.api.finish({state,code:'code',browser:start.browser}),/expired/);
});
test('OAuth state and claim sessions expire and state survives process restart',async()=>{
  const f=identityFixture(),start=await f.api.start();const restarted=createSocialClaimIdentity(f.deps);
  const signed=await restarted.finish({state:new URL(start.url).searchParams.get('state'),code:'code',browser:start.browser});
  f.advance(3600001);await assert.rejects(restarted.session(signed.token),/expired/);
  const s=await f.api.start();f.advance(600001);await assert.rejects(f.api.finish({state:new URL(s.url).searchParams.get('state'),code:'code',browser:s.browser}),/expired/);
});
test('CSRF, hostile origins and cookie security',async()=>{
  const f=identityFixture(),s=await f.api.start(),signed=await f.api.finish({state:new URL(s.url).searchParams.get('state'),code:'c',browser:s.browser});
  await assert.rejects(f.api.authorize(signed.token,'wrong'),/Refresh/);
  const session=await f.api.session(signed.token);assert.equal((await f.api.authorize(signed.token,session.csrf)).handle,'artist');
  assert.throws(()=>assertSocialOrigin({headers:{origin:'https://evil.example'}}),/SlimeWire/);
  assert.throws(()=>assertSocialOrigin({headers:{}}),/SlimeWire/);
  assert.match(socialCookie('session','opaque',3600),/Secure; HttpOnly; SameSite=Lax/);
  await f.api.logout(signed.token);await assert.rejects(f.api.session(signed.token),/expired/);
});
test('profile resolution pins an official numeric ID; changes, expiry and fabricated IDs fail',async()=>{
  const f=identityFixture(),p=await f.api.resolvePolicy(policy);
  assert.equal(f.api.verifyPolicy(p),p);
  assert.throws(()=>f.api.verifyPolicy({...p,socialRecipients:[{...p.socialRecipients[0],xUserId:'999'}]}),/changed/);
  assert.throws(()=>f.api.verifyPolicy(policy),/Verify/);
  f.advance(900001);assert.throws(()=>f.api.verifyPolicy(p),/expired/);
});
test('failed OAuth exchange consumes state and never reveals the provider response',async()=>{
  const f=identityFixture(),s=await f.api.start(),args={state:new URL(s.url).searchParams.get('state'),code:'code',browser:s.browser};
  f.fetch(async()=>({ok:false,status:403,json:async()=>({secret:'DO_NOT_EXPOSE'})}));
  await assert.rejects(f.api.finish(args),e=>!e.message.includes('DO_NOT_EXPOSE')&&e.statusCode===502);
  await assert.rejects(f.api.finish(args),/expired/);
});
test('review binds exact account, coin, amount and wallet with an expiring signature',()=>{
  let now=1000;const t=createSocialClaimTickets({secret:env.SLIME_X_SESSION_SECRET,now:()=>now}),a=attempt(),r=t.review(a,'123456789',wallet);
  assert.equal(t.verify(r.ticket,'123456789').wallet,wallet);
  assert.throws(()=>t.verify(r.ticket,'999'),/another X/);
  assert.throws(()=>t.verify(r.ticket+'x','123456789'),/changed/);
  assert.throws(()=>t.review(a,'999',wallet),/no allocation/);
  assert.throws(()=>t.review(a,'123456789',a.pumpFeeSharing.vaultAddress),/not the coin/);
  now+=300001;assert.throws(()=>t.verify(r.ticket,'123456789'),/expired/);
});
function settlementFixture(){
  let state=attempt().holderAllianceLedger,sent=0,prepared=0,status=null,failSave=false;
  const intent={id:'claim1',attemptId:'launch1',mint,xUserId:'123456789',wallet,lamports:'2000000'};
  const connection={getSignatureStatus:async()=>({value:status}),getBlockHeight:async()=>10,sendRawTransaction:async()=>{assert.ok(state.socialPending);sent++;return 'sig';},confirmTransaction:async()=>({value:{err:null}})};
  const deps={load:async()=>structuredClone(state),save:async s=>{if(failSave)throw Error('disk');state=structuredClone(s);},prepare:async()=>{prepared++;return {signature:'sig',rawBase64:'Ynl0ZXM=',blockhash:'block',lastValidBlockHeight:100};},connection,intent,enabled:true,now:()=>new Date(2000000).toISOString()};
  return {deps,intent,state:()=>state,set:s=>state=s,sent:()=>sent,prepared:()=>prepared,status:s=>status=s,failSave:()=>failSave=true};
}
test('claim is persisted before send, paid only after finalization and not duplicated',async()=>{
  const f=settlementFixture();await settleSocialClaim(f.deps);
  assert.equal(f.state().socialCredits['123456789'],'0');assert.equal(f.state().paidBySource['x:123456789'],'2000000');assert.equal(f.state().paidByWallet[wallet],'2000000');assert.equal(f.sent(),1);
  f.set({...f.state(),socialCredits:{'123456789':'2000000'}});await settleSocialClaim(f.deps);assert.equal(f.sent(),1);assert.equal(f.state().socialCredits['123456789'],'2000000');
});
test('uncertain send keeps liability; restart reconciles without another send even while disabled',async()=>{
  const f=settlementFixture();f.deps.connection.confirmTransaction=async()=>{throw Error('timeout');};await settleSocialClaim(f.deps);
  assert.equal(f.state().socialCredits['123456789'],'2000000');assert.equal(f.state().paidLamports,undefined);
  await settleSocialClaim({...f.deps,intent:null,enabled:false});assert.equal(f.sent(),1);
  f.status({confirmationStatus:'finalized',err:null});await settleSocialClaim({...f.deps,intent:null,enabled:false});assert.equal(f.state().paidLamports,'2000000');assert.equal(f.sent(),1);
});
test('non-finalized fork error never authorizes replacement',async()=>{
  const f=settlementFixture();f.deps.connection.confirmTransaction=async()=>{throw Error('timeout');};await settleSocialClaim(f.deps);
  f.status({confirmationStatus:'confirmed',err:{InstructionError:[0,'failed']}});await settleSocialClaim(f.deps);assert.ok(f.state().socialPending);assert.equal(f.sent(),1);
});
test('expired or finalized-failed claims retain funds and need a fresh manual review',async()=>{
  const f=settlementFixture();f.deps.connection.confirmTransaction=async()=>{throw Error('timeout');};await settleSocialClaim(f.deps);
  f.deps.connection.getBlockHeight=async()=>500;await settleSocialClaim(f.deps);
  assert.equal(f.state().socialPending,null);assert.equal(f.state().socialCredits['123456789'],'2000000');assert.equal(f.sent(),1);
  await settleSocialClaim(f.deps);assert.equal(f.sent(),1);
});
test('disabled claims, changed balance and failed durable write cannot submit money',async()=>{
  const f=settlementFixture();await assert.rejects(settleSocialClaim({...f.deps,enabled:false}),/disabled/);assert.equal(f.prepared(),0);
  await assert.rejects(settleSocialClaim({...f.deps,intent:{...f.intent,lamports:'3000000'}}),/balance changed/);
  f.failSave();await assert.rejects(settleSocialClaim(f.deps),/disk/);assert.equal(f.sent(),0);
});
test('pending holder batch blocks concurrent claim and leaves both liabilities intact',async()=>{
  const f=settlementFixture();f.set({...f.state(),pending:{signature:'holder'}});await assert.rejects(settleSocialClaim(f.deps),/reconciled/);assert.equal(f.prepared(),0);
});
test('reserved X balances appear per coin but never count as paid',()=>{
  const a=attempt(),d=socialClaimDashboard([a],'123456789'),r=buildLaunchRewardReport(a),e=buildLaunchEarnings([a],[],{scope:'all'});
  assert.equal(d.reservedLamports,'2000000');assert.equal(d.paidLamports,'0');assert.equal(d.coins.length,1);
  assert.equal(socialClaimDashboard([a],'999').coins.length,0);
  assert.equal(r.destinations.find(d=>d.id==='x:123456789').reservedLamports,'2000000');
  assert.equal(e.reservedLamports,'2000000');assert.equal(e.paidLamports,'0');
  assert.ok(!JSON.stringify(d).includes('profileProof'));
});
test('dashboard follows immutable X ID after handle changes',()=>{const a=attempt();a.launchUtility={...policy,socialRecipients:[{...policy.socialRecipients[0],handle:'newname'}]};assert.equal(socialClaimDashboard([a],'123456789').coins.length,1);assert.equal(socialClaimDashboard([a],'artist').coins.length,0);});
test('HTTP start matches HTTPS callback host behind an HTTP reverse proxy',async()=>{
  const f=identityFixture(),headers=[];const route=createSocialClaimRoutes({identity:f.api,send:()=>{throw Error('unexpected JSON');}});
  await route({method:'GET',headers:{host:'app.slimewire.org'}},{writeHead:(s,h)=>headers.push(h),end:()=>{}},new URL('http://app.slimewire.org/api/web/social-claims/start'));
  assert.match(headers[0].Location,/^https:\/\/x.com\/i\/oauth2\/authorize/);assert.ok(headers[0]['Set-Cookie']);
});
test('HTTP missing configuration shows an honest public state without opening a payout',async()=>{
  const f=identityFixture(),identity=createSocialClaimIdentity({...f.deps,env:{}});let result;
  const route=createSocialClaimRoutes({identity,send:(_q,_r,status,body)=>{result={status,body};},attempts:()=>{throw Error('must not read');},execute:()=>{throw Error('must not pay');}});
  await route({method:'GET',headers:{}},{},new URL('https://app.slimewire.org/api/web/social-claims/dashboard'));
  assert.equal(result.status,200);assert.equal(result.body.loggedIn,false);assert.equal(result.body.capabilities.available,false);
});

test('public methods cannot reach claims, and POST needs session, CSRF and an open gate',async()=>{
  const f=identityFixture(),s=await f.api.start(),login=await f.api.finish({state:new URL(s.url).searchParams.get('state'),code:'c',browser:s.browser}),session=await f.api.session(login.token);let out;
  const route=createSocialClaimRoutes({identity:f.api,send:(_q,_r,status,body)=>out={status,body},execute:()=>{throw Error('MUST NOT EXECUTE');},readBody:()=>{throw Error('MUST NOT READ BODY');}});
  const req={method:'POST',headers:{origin:'https://app.slimewire.org',cookie:'__Host-slime-x-session='+login.token,'x-slime-csrf':session.csrf}};
  await route(req,{},new URL('https://app.slimewire.org/api/web/social-claims/claim'));assert.equal(out.status,503);
  await route({...req,headers:{...req.headers,origin:'https://evil.example'}},{},new URL('https://app.slimewire.org/api/web/social-claims/claim'));assert.equal(out.status,403);
  await route({...req,method:'GET'},{},new URL('https://app.slimewire.org/api/web/social-claims/claim'));assert.equal(out.status,404);
  await route({...req,method:'GET',headers:{...req.headers,origin:'https://evil.example'}},{},new URL('https://app.slimewire.org/api/web/social-claims/dashboard'));assert.equal(out.status,403);
});

test('manual pending claim wakes the durable reconciliation runner',async()=>{
  const {readFile}=await import('node:fs/promises');const source=await readFile(new URL('../src/index.js',import.meta.url),'utf8');
  assert.ok(source.includes('...(ledger.socialPending ? { holderNextCheckAt: Date.now() } : {})'));
  assert.ok(source.includes('return ledger.socialPending || ledger.pending'));
});
