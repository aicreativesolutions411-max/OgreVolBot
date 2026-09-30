import { assertSocialOrigin, socialCookie, socialCookieValue } from './socialClaimIdentity.js';
import { socialClaimDashboard, socialDestination } from './socialClaimSettlement.js';

export function createSocialClaimRoutes({identity,tickets,attempts,execute,verifyDestination,managedWallets,readBody,send}){
  return async function handle(request,response,url){
    if(!url.pathname.startsWith('/api/web/social-claims/'))return false;
    const action=url.pathname.slice('/api/web/social-claims/'.length),token=socialCookieValue(request,'session');
    const json=(status,data,headers={})=>send(request,response,status,data,'https://app.slimewire.org,https://slimewire.org',{'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...headers});
    const redirect=(location,cookies=[])=>{response.writeHead(303,{Location:location,'Cache-Control':'no-store','Referrer-Policy':'no-referrer',...(cookies.length?{'Set-Cookie':cookies}:{})});response.end();};
    try{
      // Do not inherit the older portal's permissive CORS policy for identity,
      // CSRF tokens or wallet lists. Top-level OAuth navigation has no Origin.
      if(request.headers.origin)assertSocialOrigin(request);
      const cap=identity.capabilities();
      if(request.method==='GET'&&action==='capabilities'){json(200,{ok:true,...cap});return true;}
      if(request.method==='GET'&&action==='start'){
        if(!cap.identityConfigured){redirect('/launch/claim?signin=unavailable');return true;}
        // Host-only cookies: begin and finish on the registered callback origin.
        const canonical=new URL(cap.loginUrl);
        if(url.host!==canonical.host){redirect(cap.loginUrl);return true;}
        const start=await identity.start();redirect(start.url,[socialCookie('state',start.browser,600)]);return true;
      }
      if(request.method==='GET'&&action==='callback'){
        try{
          const hosted=cap.identityProvider==='privy',params=url.searchParams;
          const stateKey=hosted?'privy_oauth_state':'state',codeKey=hosted?'privy_oauth_code':'code';
          if(params.getAll(stateKey).length!==1||params.getAll(codeKey).length!==1||params.has('error')||params.has('privy_oauth_error'))throw new Error('Invalid sign-in callback.');
          if(hosted?(params.getAll('privy_oauth_provider').length!==1||params.get('privy_oauth_provider')!=='twitter'||params.has('code')||params.has('state')):(params.has('privy_oauth_code')||params.has('privy_oauth_state')||params.has('privy_oauth_provider')))throw new Error('Sign-in providers cannot be mixed.');
          const result=await identity.finish({state:params.get(stateKey),code:params.get(codeKey),provider:hosted?'privy':'x',browser:socialCookieValue(request,'state')});
          if(token)await identity.logout(token);
          redirect('/launch/claim',[socialCookie('session',result.token,3600),socialCookie('state','',0)]);
        }catch{redirect('/launch/claim?signin=failed',[socialCookie('state','',0)]);}
        return true;
      }
      if(request.method==='GET'&&action==='dashboard'){
        let session;try{session=await identity.session(token);}catch(e){if(e.statusCode!==401&&e.statusCode!==503)throw e;json(200,{ok:true,loggedIn:false,capabilities:cap});return true;}
        const wallets=await managedWallets(request).catch(()=>[]);
        json(200,{ok:true,loggedIn:true,session,capabilities:cap,wallets:wallets.map(w=>({label:String(w.label||w.name||'SlimeWallet').slice(0,60),publicKey:w.publicKey})),...socialClaimDashboard(await attempts(),session.xUserId)});return true;
      }
      if(request.method!=='POST'){json(404,{ok:false,error:'Claim endpoint not found.'});return true;}
      assertSocialOrigin(request);
      const session=await identity.authorize(token,request.headers['x-slime-csrf']);
      if(action==='logout'){await identity.logout(token);json(200,{ok:true},{'Set-Cookie':socialCookie('session','',0)});return true;}
      if(!cap.available){json(503,{ok:false,error:cap.reason});return true;}
      const body=await readBody(request,4000);
      if(action==='review'){
        const a=(await attempts()).find(a=>a.id===body.attemptId);if(!a)throw new Error('Coin allocation not found.');
        const wallet=socialDestination(body.wallet),review=tickets.review(a,session.xUserId,wallet);
        await verifyDestination(wallet,a);
        json(200,{ok:true,review});return true;
      }
      if(action==='claim'){
        if(body.acknowledge!==true)throw new Error('Confirm the receiving address and amount first.');
        const intent=tickets.verify(body.ticket,session.xUserId);
        await execute(intent);
        json(200,{ok:true,...socialClaimDashboard(await attempts(),session.xUserId)});return true;
      }
      json(404,{ok:false,error:'Claim endpoint not found.'});return true;
    }catch(e){json(e.statusCode||400,{ok:false,error:String(e.message||'Claim unavailable. Please refresh.').slice(0,240)});return true;}
  };
}
