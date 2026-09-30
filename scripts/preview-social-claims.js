// Local UI fixture only. No credentials, RPC, X calls, signing or real transfers.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web/dist');
const wallet='AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9';
const demo={ok:true,loggedIn:true,session:{handle:'local_preview',name:'Local preview only',csrf:'mock'},capabilities:{available:true,identityConfigured:true},wallets:[{label:'DEMO SlimeWallet',publicKey:wallet}],reservedLamports:'42500000',paidLamports:'1812500000',pendingLamports:'0',coins:[{id:'preview',mint:wallet,symbol:'DEMO',name:'Fictional UI fixture',shareBps:1000,reservedLamports:'42500000',paidLamports:'1812500000',active:true,paused:false,receipts:[]}]};
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
http.createServer(async(req,res)=>{
  const json=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  try{
    const u=new URL(req.url,'http://127.0.0.1:4321');
    if(u.pathname.startsWith('/api/web/social-claims/')){
      if(u.pathname.endsWith('/dashboard'))return json(200,req.headers.cookie?.includes('preview_signedout=1')?{ok:true,loggedIn:false,capabilities:{available:false,identityConfigured:false,reason:'LOCAL PREVIEW — X identity setup and funded validation pending.'}}:demo);
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>5000)return json(413,{ok:false});}const b=JSON.parse(raw||'{}');
      if(u.pathname.endsWith('/review')){if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(b.wallet||''))return json(400,{ok:false,error:'Paste a valid Solana receiving wallet.'});return json(200,{ok:true,review:{ticket:'no-funds-fixture',mint:wallet,wallet:b.wallet,lamports:'42500000'}});}
      if(u.pathname.endsWith('/claim'))return json(200,{ok:true,simulation:true});
      return json(404,{ok:false});
    }
    if(u.pathname==='/mobile'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end('<html><body style="margin:0;background:#292b2a;color:white;font:14px sans-serif"><p>LOCAL MOBILE PREVIEW · 390 × 844 · no money</p><iframe title="Mobile claims" src="/launch/claim" style="border:0;width:390px;height:844px"></iframe></body></html>');}
    const name=u.pathname==='/'||u.pathname==='/launch/claim'?'launch-claim.html':u.pathname==='/launch'?'launch.html':decodeURIComponent(u.pathname.slice(1));
    const file=path.resolve(root,name);if(!file.startsWith(root+path.sep))return json(403,{ok:false});
    let body=await fs.readFile(file);if(name==='launch-claim.html')body=Buffer.from(body.toString().replace('<main id="claim-content">','<main id="claim-content"><p class="claim-notice">LOCAL SIMULATION — fictional balances. No X login, keys, RPC or transactions.</p>'));
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store',...(name==='launch-claim.html'?{'Set-Cookie':'preview_signedout='+(u.searchParams.has('signedout')?'1':'0')+'; Path=/; SameSite=Lax'}:{})});res.end(body);
  }catch(e){json(404,{ok:false,error:e.message});}
}).listen(4321,'127.0.0.1',()=>console.log('No-funds claim UI preview: http://127.0.0.1:4321/launch/claim'));
