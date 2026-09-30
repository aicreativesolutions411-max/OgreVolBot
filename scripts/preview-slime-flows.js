// Local-only UI + API fixture. Never loads .env, production state or signing code.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSlimeFlows, flowCapabilities } from '../src/lib/slimeFlows.js';
import { checkFlowReadiness } from '../src/lib/slimeFlowReadiness.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web/dist');
let record={id:'preview-coin',userId:'preview',status:'COMPLETE',tokenMint:'29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump',symbol:'DEMO',tokenName:'Local simulation only',devWalletPublicKey:'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9',pumpFeeSharing:{status:'ACTIVE',vaultAddress:'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9',configAddress:'local-fixture'},launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:8000,partnerHolderShareBps:0,autoDistribute:true},holderAllianceLedger:{}};
let queue=Promise.resolve();
const service=createSlimeFlows({enabled:true,readiness:a=>checkFlowReadiness(a,{enabled:false,readRuntime:async()=>({runner:true,lock:true,creatorKey:true,vaultKey:true}),readChain:async()=>({configMatches:true,accountsValid:true,slot:123,vaultLamports:'100000000',creatorLamports:'10000000'}),readSnapshots:async()=>({own:{slot:123,capturedAt:Date.now(),holders:[{wallet:'fictional',amount:'1'}]}})}),attempts:async()=>[structuredClone(record)],load:async id=>id===record.id?structuredClone(record):null,save:async p=>{record={...record,...structuredClone(p)};},wallets:async()=>[{publicKey:record.devWalletPublicKey}],lock:async(m,fn)=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;}});
const contentTypes={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer(async(req,res)=>{
  const send=(code,body)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  try{
    const u=new URL(req.url,'http://127.0.0.1:4318');
    if(u.pathname.startsWith('/api/')){
      const name=u.pathname.replace('/api/web/flows/','');
      if(name==='capabilities'&&req.method==='GET')return send(200,{ok:true,...flowCapabilities(true)});
      if(req.headers.authorization!=='Bearer local-preview-no-signing')return send(401,{ok:false,error:'Local preview session required.'});
      if(name==='dashboard'&&req.method==='GET')return send(200,{ok:true,...await service.dashboard('preview')});
      if(req.method!=='POST')return send(404,{ok:false});
      let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>12000)return send(413,{ok:false});}
      const body=JSON.parse(raw),method={readiness:'readiness',draft:'saveDraft',preview:'preview',review:'review',activate:'activate',pause:'pause'}[name];
      if(!method)return send(404,{ok:false});
      return send(200,{ok:true,result:await service[method]('preview',body)});
    }
    if(req.method!=='GET')return send(405,{ok:false});
    if(u.pathname==='/config.js'){res.writeHead(200,{'Content-Type':'text/javascript'});return res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};localStorage.setItem("ogreWebToken","local-preview-no-signing");');}
    const name=u.pathname==='/'||u.pathname==='/launch/flows'?'launch-flows.html':decodeURIComponent(u.pathname.slice(1));
    const target=path.resolve(root,name);if(!target.startsWith(root+path.sep))return send(403,{ok:false});
    let body=await fs.readFile(target);if(name==='launch-flows.html')body=Buffer.from(body.toString().replace('<main>','<main><p class="flow-notice">LOCAL SIMULATION — no wallet keys, no RPC, no money movement. Demo coin state is fictional.</p>'));
    res.writeHead(200,{'Content-Type':contentTypes[path.extname(target)]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
  }catch(e){send(400,{ok:false,error:e.message});}
});
server.listen(4318,'127.0.0.1',()=>console.log('No-funds Slime Flows preview: http://127.0.0.1:4318/launch/flows'));
