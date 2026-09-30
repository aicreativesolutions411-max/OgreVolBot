import { createHash } from 'node:crypto';

// Identity only: no embedded wallet creation, signing or fee custody at Privy.
// Wire format follows Privy's published JS SDK core 0.77.0 OAuthApi,
// @privy-io/routes 0.4.2 and @privy-io/api-types 0.23.0. Live provider validation
// is a separate release prerequisite; never fall back to scraping X cookies.
const fail=(message,statusCode=502)=>Object.assign(new Error(message),{statusCode});
export function createPrivyClaimProvider({env,fetchImpl=fetch,now=Date.now}){
  async function request(action,body){
    let response;
    try{
      response=await fetchImpl('https://auth.privy.io/api/v1/oauth/'+action,{
        method:'POST',redirect:'error',signal:AbortSignal.timeout(12000),
        headers:{'Content-Type':'application/json',Accept:'application/json','privy-app-id':env.SLIME_PRIVY_APP_ID},
        body:JSON.stringify(body)
      });
    }catch{throw fail('Hosted X verification is temporarily unavailable. Please try again.');}
    if(!response.ok)throw fail(response.status===429?'Hosted X sign-in is busy. Please try again shortly.':'Hosted X sign-in could not complete. SlimeWire must check its identity provider setup.',response.status===429?429:502);
    try{return await response.json();}catch{throw fail('Hosted X verification returned an invalid response.');}
  }
  return {
    async start({state,verifier}){
      const data=await request('init',{provider:'twitter',redirect_to:env.SLIME_X_CALLBACK_URL,state_code:state,code_challenge:createHash('sha256').update(verifier).digest('base64url')});
      let url;try{url=new URL(data.url);}catch{throw fail('Hosted sign-in returned an invalid redirect.');}
      if(url.protocol!=='https:'||!['x.com','twitter.com'].includes(url.hostname)||url.pathname!=='/i/oauth2/authorize'||url.username||url.password||url.port||url.hash)throw fail('Hosted sign-in returned an untrusted redirect.');
      return url.href;
    },
    async finish({state,code,verifier,createdAt}){
      // This server obtains identity directly from the broker using the saved
      // PKCE verifier; browser-supplied user objects/JWT claims are never trusted.
      const data=await request('authenticate',{authorization_code:code,state_code:state,code_verifier:verifier,mode:'login-or-sign-up'});
      if(data.session_update_action!=='set'||typeof (data.privy_access_token||data.token)!=='string'||!(data.privy_access_token||data.token)||!String(data.user?.id||'').startsWith('did:privy:'))throw fail('Hosted X identity verification did not complete.');
      const accounts=data.user?.linked_accounts;
      const xs=Array.isArray(accounts)?accounts.filter(a=>a.type==='twitter_oauth'):[];
      if(xs.length!==1)throw fail('Hosted X sign-in must return exactly one verified X identity.');
      const a=xs[0],verifiedAt=a.latest_verified_at*1000;
      if(!Number.isFinite(createdAt)||typeof a.latest_verified_at!=='number'||!Number.isFinite(verifiedAt)||verifiedAt<createdAt-30000||verifiedAt>now()+30000)throw fail('A fresh X sign-in is required. An older linked profile cannot authorize a claim.');
      if(typeof a.subject!=='string'||!/^[1-9][0-9]{0,24}$/.test(a.subject)||!/^[A-Za-z0-9_]{1,15}$/.test(a.username||''))throw fail('Hosted X sign-in did not return a verified numeric account identity.');
      return {xUserId:a.subject,handle:a.username,name:String(a.name||a.username).slice(0,80)};
    }
  };
}
