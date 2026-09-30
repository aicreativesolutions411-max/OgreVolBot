import { createHash, createHmac, randomBytes, timingSafeEqual, createCipheriv, createDecipheriv } from 'node:crypto';
import { socialClaimCapabilities, normalizeSocialRecipients } from './socialFeePolicy.js';
const hash=v=>createHash('sha256').update(String(v)).digest('hex');
const random=()=>randomBytes(32).toString('base64url');
const same=(a,b)=>{const x=Buffer.from(String(a||'')),y=Buffer.from(String(b||''));return x.length===y.length&&timingSafeEqual(x,y);};
const error=(message,statusCode=400)=>Object.assign(new Error(message),{statusCode});
function profile(data){
  if(!/^[1-9][0-9]{0,24}$/.test(String(data?.id||''))||!/^[A-Za-z0-9_]{1,15}$/.test(data?.username||''))throw error('X did not return a verified account identity.',502);
  return {xUserId:String(data.id),handle:data.username,name:String(data.name||data.username).slice(0,80)};
}

// mutate must atomically read/update/write a private durable store. Provider
// access tokens are used once for /users/me and are never persisted or logged.
export function createSocialClaimIdentity({read,mutate,env=process.env,fetchImpl=fetch,now=Date.now}){
  const config=socialClaimCapabilities(env),key=createHash('sha256').update('slime-x-state:'+String(env.SLIME_X_SESSION_SECRET||'')).digest();
  const sign=value=>createHmac('sha256',String(env.SLIME_X_SESSION_SECRET||'')).update(value).digest('base64url');
  const seal=value=>{const iv=randomBytes(12),c=createCipheriv('aes-256-gcm',key,iv),body=Buffer.concat([c.update(value,'utf8'),c.final()]);return Buffer.concat([iv,c.getAuthTag(),body]).toString('base64url');};
  const unseal=value=>{const b=Buffer.from(value,'base64url'),d=createDecipheriv('aes-256-gcm',key,b.subarray(0,12));d.setAuthTag(b.subarray(12,28));return Buffer.concat([d.update(b.subarray(28)),d.final()]).toString('utf8');};
  const prune=s=>{s.states=(s.states||[]).filter(r=>r.expiresAt>now());s.sessions=(s.sessions||[]).filter(r=>r.expiresAt>now());s.lookups=(s.lookups||[]).filter(r=>r.at>now()-60000);};
  async function request(url,options={}){
    let r;try{r=await fetchImpl(url,{...options,redirect:'error',signal:AbortSignal.timeout(8000)});}catch{throw error('X identity verification is temporarily unavailable. Please try again.',502);}
    if(!r.ok)throw error(r.status===429?'X verification is busy. Please try again shortly.':'X identity access is unavailable. SlimeWire must check its X app configuration.',r.status===429?429:502);
    try{return await r.json();}catch{throw error('X returned an invalid verification response.',502);}
  }
  function requireIdentity(){if(!config.identityConfigured)throw error(config.reason,503);}
  function makeProof(p){const payload=Buffer.from(JSON.stringify({...p,expiresAt:now()+900000})).toString('base64url');return payload+'.'+sign('profile:'+payload);}
  const service={
    capabilities(){return {...config,loginUrl:config.identityConfigured?new URL('/api/web/social-claims/start',env.SLIME_X_CALLBACK_URL).href:''};},
    async start(){
      requireIdentity();const state=random(),browser=random(),verifier=random();
      await mutate(s=>{prune(s);if(s.states.length>=1000)throw error('Sign-in is busy. Please try again shortly.',429);s.states.push({hash:hash(state),browser:hash(browser),verifier:seal(verifier),expiresAt:now()+600000});});
      const u=new URL('https://x.com/i/oauth2/authorize');
      u.search=new URLSearchParams({response_type:'code',client_id:env.SLIME_X_CLIENT_ID,redirect_uri:env.SLIME_X_CALLBACK_URL,scope:'tweet.read users.read',state,code_challenge:createHash('sha256').update(verifier).digest('base64url'),code_challenge_method:'S256'}).toString();
      return {url:u.href,browser};
    },
    async finish({state,code,browser}){
      requireIdentity();if(!/^[\w-]{43}$/.test(state||'')||!browser||!code||String(code).length>2048)throw error('Sign-in expired. Start again from the claim page.');
      const saved=await mutate(s=>{prune(s);const i=s.states.findIndex(r=>same(r.hash,hash(state))&&same(r.browser,hash(browser)));if(i<0)throw error('Sign-in expired or belongs to another browser. Please start again.');return s.states.splice(i,1)[0];});
      const body=new URLSearchParams({grant_type:'authorization_code',code:String(code),redirect_uri:env.SLIME_X_CALLBACK_URL,code_verifier:unseal(saved.verifier)});
      const token=await request('https://api.x.com/2/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Authorization:'Basic '+Buffer.from(encodeURIComponent(env.SLIME_X_CLIENT_ID)+':'+encodeURIComponent(env.SLIME_X_CLIENT_SECRET)).toString('base64')},body});
      if(!token.access_token||String(token.token_type).toLowerCase()!=='bearer')throw error('X sign-in did not complete. Please try again.',502);
      const p=profile((await request('https://api.x.com/2/users/me',{headers:{Authorization:'Bearer '+token.access_token}})).data);
      const session=random(),csrf=random();
      await mutate(s=>{prune(s);if(s.sessions.length>=10000)throw error('Sign-in capacity reached. Try again later.',503);s.sessions.push({...p,hash:hash(session),csrf,createdAt:now(),expiresAt:now()+3600000});});
      return {token:session,profile:p};
    },
    async session(token){
      requireIdentity();if(!/^[\w-]{43}$/.test(token||''))throw error('Sign in with X to view or claim your fees.',401);
      const row=(await read()).sessions?.find(r=>same(r.hash,hash(token))&&r.expiresAt>now());
      if(!row)throw error('Your X session expired. Sign in again.',401);
      return {xUserId:row.xUserId,handle:row.handle,name:row.name,csrf:row.csrf,expiresAt:row.expiresAt};
    },
    async authorize(token,csrf){const s=await service.session(token);if(!same(s.csrf,csrf))throw error('Refresh this page before confirming the claim.',403);return s;},
    async logout(token){await mutate(s=>{prune(s);s.sessions=s.sessions.filter(r=>!same(r.hash,hash(token)));});},
    async resolvePolicy(policy){
      const rows=normalizeSocialRecipients(policy.socialRecipients);if(!rows.length)return policy;
      if(!config.lookupConfigured)throw error(config.reason,503);
      const result=[];
      for(const row of rows){
        // Global bounded lookup budget; no scraping, background polling or paid RPC.
        await mutate(s=>{prune(s);if(s.lookups.length>=20)throw error('Profile verification is busy. Try again in a minute.',429);s.lookups.push({at:now()});});
        const p=profile((await request('https://api.x.com/2/users/by/username/'+encodeURIComponent(row.handle),{headers:{Authorization:'Bearer '+env.SLIME_X_APP_BEARER_TOKEN}})).data);
        if(p.handle.toLowerCase()!==row.handle.toLowerCase())throw error('This X handle changed. Review the current profile again.');
        result.push({...p,shareBps:row.shareBps,profileProof:makeProof(p)});
      }
      return {...policy,socialRecipients:normalizeSocialRecipients(result)};
    },
    verifyPolicy(policy){
      for(const row of normalizeSocialRecipients(policy.socialRecipients)){
        requireIdentity();const [body,signature,...extra]=row.profileProof.split('.');
        if(extra.length||!body||!same(sign('profile:'+body),signature))throw error('Verify the X recipient profile before launching.');
        let p;try{p=JSON.parse(Buffer.from(body,'base64url').toString('utf8'));}catch{throw error('Invalid X profile verification.');}
        if(p.expiresAt<=now()||p.xUserId!==row.xUserId||p.handle!==row.handle||p.name!==row.name)throw error('X recipient verification expired or changed. Review the profile again.');
      }
      return policy;
    }
  };
  return service;
}

export function socialCookie(name,value,maxAge){return `__Host-slime-x-${name}=${value}; Path=/; Max-Age=${maxAge}; Secure; HttpOnly; SameSite=Lax`;}
export function socialCookieValue(request,name){return String(request.headers.cookie||'').split(';').map(v=>v.trim()).find(v=>v.startsWith(`__Host-slime-x-${name}=`))?.split('=').slice(1).join('=')||'';}
export function assertSocialOrigin(request){
  if(!['https://slimewire.org','https://app.slimewire.org'].includes(request.headers.origin))throw error('Open the claim page on SlimeWire before continuing.',403);
}
