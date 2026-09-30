import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createSocialClaimIdentity } from '../src/lib/socialClaimIdentity.js';
import { createSocialClaimRoutes } from '../src/lib/socialClaimRoutes.js';
import { socialClaimCapabilities } from '../src/lib/socialFeePolicy.js';

const env={SLIME_SOCIAL_IDENTITY_PROVIDER:'privy',SLIME_PRIVY_APP_ID:'slime-test-app',SLIME_X_SESSION_SECRET:'private-test-secret-'.repeat(4),SLIME_X_CALLBACK_URL:'https://app.slimewire.org/api/web/social-claims/callback'};
const profile={type:'twitter_oauth',subject:'1234567890123456789',username:'artist',name:'Artist',latest_verified_at:1000};
const policy={socialRecipients:[{handle:'artist',shareBps:2500}]};
function fixture(overrides={}){
  let data={},time=1000000,account={...profile},reply=null;const calls=[];
  const deps={env:{...env,...overrides},now:()=>time,read:async()=>structuredClone(data),mutate:async fn=>{const copy=structuredClone(data),out=await fn(copy);data=copy;return out;},fetchImpl:async(url,opts)=>{
    calls.push({url,opts});const body=JSON.parse(opts.body);
    if(reply)return reply(url,body);
    return {ok:true,json:async()=>url.endsWith('/init')?{url:'https://x.com/i/oauth2/authorize?client_id=privy-shared'}:{session_update_action:'set',token:'NEVER_STORE_ACCESS_TOKEN',refresh_token:'NEVER_STORE_REFRESH_TOKEN',user:{id:'did:privy:test',linked_accounts:[account]}}};
  }};
  const api=createSocialClaimIdentity(deps);
  return {api,deps,calls,data:()=>data,advance:n=>time+=n,account:p=>account=p,reply:r=>reply=r,async login(){const s=await api.start(),state=JSON.parse(calls.at(-1).opts.body).state_code;return api.finish({provider:'privy',state,code:'broker-code',browser:s.browser});}};
}

test('Privy setup needs no X developer keys but never removes financial hold',()=>{
  const c=socialClaimCapabilities(env);
  assert.equal(c.identityProvider,'privy');assert.equal(c.identityConfigured,true);
  assert.equal(c.recipientLookup,'verified-only');assert.equal(c.arbitraryRecipientLookup,false);assert.equal(c.available,false);
  assert.equal(socialClaimCapabilities({...env,SLIME_PRIVY_APP_ID:''}).identityConfigured,false);
  assert.equal(socialClaimCapabilities({...env,SLIME_SOCIAL_IDENTITY_PROVIDER:'reclaim'}).identityConfigured,false);
  assert.equal(socialClaimCapabilities({...env,SLIME_X_CALLBACK_URL:'https://evil.example/callback'}).identityConfigured,false);
});
test('hosted login sends a PKCE challenge, binds browser and saves no provider tokens',async()=>{
  const f=fixture(),s=await f.api.start(),init=JSON.parse(f.calls[0].opts.body);
  assert.equal(init.provider,'twitter');assert.equal(init.redirect_to,env.SLIME_X_CALLBACK_URL);
  assert.equal(f.calls[0].opts.headers['privy-app-id'],env.SLIME_PRIVY_APP_ID);
  assert.equal(f.calls[0].opts.redirect,'error');
  await assert.rejects(f.api.finish({provider:'privy',state:init.state_code,code:'c',browser:'wrong'}),/another browser/);
  const login=await f.api.finish({provider:'privy',state:init.state_code,code:'c',browser:s.browser});
  const exchange=JSON.parse(f.calls[1].opts.body);
  assert.equal(createHash('sha256').update(exchange.code_verifier).digest('base64url'),init.code_challenge);
  assert.equal((await f.api.session(login.token)).xUserId,profile.subject);
  const stored=JSON.stringify(f.data());for(const secret of [exchange.code_verifier,init.state_code,login.token,'NEVER_STORE'])assert.ok(!stored.includes(secret));
  await assert.rejects(f.api.finish({provider:'privy',state:init.state_code,code:'c',browser:s.browser}),/expired/);
});
test('hosted identity survives restart and rejects expired state and provider mix-up',async()=>{
  const f=fixture(),s=await f.api.start(),state=JSON.parse(f.calls[0].opts.body).state_code;
  await assert.rejects(f.api.finish({provider:'x',state,code:'c',browser:s.browser}),/provider/);
  const restarted=createSocialClaimIdentity(f.deps),login=await restarted.finish({provider:'privy',state,code:'c',browser:s.browser});
  assert.equal((await restarted.session(login.token)).handle,'artist');
  const next=await f.api.start(),expired=JSON.parse(f.calls.at(-1).opts.body).state_code;f.advance(600001);
  await assert.rejects(f.api.finish({provider:'privy',state:expired,code:'c',browser:next.browser}),/expired/);
});
test('reject linked email, stale X, future timestamp and numeric rather than string X IDs',async()=>{
  for(const account of [{...profile,type:'email'},{...profile,latest_verified_at:1},{...profile,latest_verified_at:999999},{...profile,subject:1234567890123456789},{...profile,username:'bad/name'}]){
    const f=fixture();f.account(account);await assert.rejects(f.login(),/verified|fresh|identity/i);assert.equal(f.data().sessions?.length||0,0);
  }
});
test('reject ambiguous X accounts and incomplete MFA/session responses',async()=>{
  for(const result of [{session_update_action:'ignore',token:'token',user:{id:'did:privy:test',linked_accounts:[profile]}},{session_update_action:'set',token:'token',user:{id:'did:privy:test',linked_accounts:[profile,{...profile,subject:'111'}]}},{session_update_action:'set',user:{id:'did:privy:test',linked_accounts:[profile]}}]){
    const f=fixture();f.reply(async(url)=>({ok:true,json:async()=>url.endsWith('/init')?{url:'https://x.com/i/oauth2/authorize'}:result}));
    await assert.rejects(f.login(),/identity|fresh|complete/i);
  }
});
test('hosted auth refuses malicious redirects and hides provider errors',async()=>{
  for(const url of ['https://evil.example/','https://x.com.evil.example/','http://x.com/i/oauth2/authorize','https://x.com@evil.example/','https://x.com/i/oauth2/authorize#fragment']){
    const f=fixture();f.reply(async()=>({ok:true,json:async()=>({url})}));await assert.rejects(f.api.start(),/redirect/);
  }
  const f=fixture();f.reply(async()=>({ok:false,status:403,json:async()=>({error:'DO_NOT_EXPOSE'})}));
  await assert.rejects(f.api.start(),e=>e.statusCode===502&&!e.message.includes('DO_NOT_EXPOSE'));
});
test('without lookup API unknown and expired recipients fail closed; fresh verified profile is pinned',async()=>{
  const f=fixture();await assert.rejects(f.api.resolvePolicy(policy),/sign in|verified/i);
  await f.login();const resolved=await f.api.resolvePolicy(policy);
  assert.equal(resolved.socialRecipients[0].xUserId,profile.subject);assert.equal(f.api.verifyPolicy(resolved),resolved);
  assert.equal(f.calls.length,2,'no X lookup request is made');
  assert.throws(()=>f.api.verifyPolicy({...resolved,socialRecipients:[{...resolved.socialRecipients[0],xUserId:'999'}]}),/changed/);
  f.advance(900001);await assert.rejects(f.api.resolvePolicy(policy),/sign in|verified/i);
});
test('fresh login replaces obsolete handle mapping and never rewrites existing entitlements',async()=>{
  const f=fixture();await f.login();f.account({...profile,username:'newname'});await f.login();
  await assert.rejects(f.api.resolvePolicy(policy),/sign in|verified/i);
  const p=await f.api.resolvePolicy({socialRecipients:[{handle:'newname',shareBps:2500}]});assert.equal(p.socialRecipients[0].xUserId,profile.subject);
});
test('recent verified recipient mapping has an expiry no later than original proof',async()=>{
  const f=fixture();await f.login();f.advance(899000);const p=await f.api.resolvePolicy(policy);f.advance(1001);
  assert.throws(()=>f.api.verifyPolicy(p),/expired/);
});
test('hosted callback accepts only its own parameter format and clears state on failure',async()=>{
  const f=fixture(),s=await f.api.start(),state=JSON.parse(f.calls[0].opts.body).state_code;let headers;
  const route=createSocialClaimRoutes({identity:f.api,send:()=>{throw Error('unexpected');}});
  const request={method:'GET',headers:{cookie:'__Host-slime-x-state='+s.browser}},response={writeHead:(_s,h)=>headers=h,end:()=>{}};
  await route(request,response,new URL('https://app.slimewire.org/api/web/social-claims/callback?privy_oauth_state='+state+'&privy_oauth_code=c&privy_oauth_provider=twitter'));
  assert.equal(headers.Location,'/launch/claim');assert.match(headers['Set-Cookie'][0],/__Host-slime-x-session=/);
  await route(request,response,new URL('https://app.slimewire.org/api/web/social-claims/callback?state='+state+'&code=c'));
  assert.equal(headers.Location,'/launch/claim?signin=failed');
});
test('hosted callback rejects duplicate parameters, non-X providers and errors',async()=>{
  for(const extra of ['&privy_oauth_code=second','&privy_oauth_state=second','&privy_oauth_provider=google','&error=denied','&privy_oauth_error=denied']){
    const f=fixture(),s=await f.api.start(),state=JSON.parse(f.calls[0].opts.body).state_code;let headers;
    const route=createSocialClaimRoutes({identity:f.api,send:()=>{throw Error('unexpected');}});
    await route({method:'GET',headers:{cookie:'__Host-slime-x-state='+s.browser}},{writeHead:(_s,h)=>headers=h,end:()=>{}},new URL('https://app.slimewire.org/api/web/social-claims/callback?privy_oauth_state='+state+'&privy_oauth_code=c&privy_oauth_provider=twitter'+extra));
    assert.equal(headers.Location,'/launch/claim?signin=failed');assert.equal(f.calls.length,1);
  }
});
test('failed broker exchange consumes the state and cannot retry the same code',async()=>{
  const f=fixture(),s=await f.api.start(),state=JSON.parse(f.calls[0].opts.body).state_code,args={provider:'privy',state,code:'c',browser:s.browser};
  f.reply(async()=>({ok:false,status:429}));await assert.rejects(f.api.finish(args),e=>e.statusCode===429);
  await assert.rejects(f.api.finish(args),/expired/);assert.equal(f.calls.length,2);
});
test('provider switch invalidates old sessions and hosted sign-in never opens payment gate',async()=>{
  const f=fixture(),login=await f.login(),session=await f.api.session(login.token);let result;
  const other=createSocialClaimIdentity({...f.deps,env:{...env,SLIME_SOCIAL_IDENTITY_PROVIDER:'x',SLIME_X_CLIENT_ID:'client',SLIME_X_CLIENT_SECRET:'secret'}});
  await assert.rejects(other.session(login.token),/expired/);
  const route=createSocialClaimRoutes({identity:f.api,send:(_q,_r,status,body)=>result={status,body},execute:()=>{throw Error('MUST NOT TRANSFER');},readBody:()=>{throw Error('MUST NOT READ');}});
  await route({method:'POST',headers:{origin:'https://app.slimewire.org',cookie:'__Host-slime-x-session='+login.token,'x-slime-csrf':session.csrf}},{},new URL('https://app.slimewire.org/api/web/social-claims/claim'));
  assert.equal(result.status,503);assert.match(result.body.error,/validation/);
});
test('sign-in attempts are bounded even when provider initialization fails',async()=>{
  const f=fixture();f.reply(async()=>({ok:false,status:503}));
  for(let i=0;i<60;i++)await assert.rejects(f.api.start(),e=>e.statusCode===502);
  await assert.rejects(f.api.start(),e=>e.statusCode===429);assert.equal(f.calls.length,60);assert.equal(f.data().states.length,0);
});
