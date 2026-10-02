// Local-only fixture: no app runtime, secrets, signing, RPC or real transfers.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createSlimeBuild} from '../src/lib/slimeBuild.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web/dist');
const mint='29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump';
let data={projects:[]},queue=Promise.resolve();
const context={programs:[{mint,symbol:'DEMO'}],goals:[{id:'fixture-goal',mint,title:'LOCAL EXAMPLE · playable demo',targetLamports:'3000000000',paidLamports:'750000000',payee:'Example treasury',receiptCount:1}]};
const service=createSlimeBuild({read:async()=>structuredClone(data),write:async v=>{data=structuredClone(v);},lock:fn=>{const p=queue.then(fn);queue=p.catch(()=>{});return p;},context:async()=>context});
const example=await service.create('fixture',{requestId:'local-preview-fixture',title:'Playable survival update',category:'game',description:'LOCAL EXAMPLE. A controller-ready survival room, clear enemy feedback and an accessible HUD.',mint,goalId:'fixture-goal',milestones:[{title:'Playable prototype',description:'One complete survival loop with controller input.',budgetSol:'1',dueDate:'2026-11-01'},{title:'Polish and playtest',description:'Readable UI and public test notes.',budgetSol:'2',dueDate:'2026-11-15'}]});
await service.update('fixture',{id:example.id,revision:1,action:'publish',acknowledge:true});
const routes={'/':'home.html','/launch':'launch.html','/launch/rehearsal':'launch-rehearsal.html','/launch/build':'slime-build.html','/launch/community':'launch-community.html','/wallet':'fun.html','/wallet/':'fun.html','/terminal':'terminal.html'};
http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1'),json=(code,obj)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(obj));};
  try{
    if(u.pathname==='/config.js'){res.writeHead(200,{'content-type':'application/javascript'});res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};');return;}
    if(req.method==='GET'&&u.pathname==='/api/web/build/public'){json(200,{ok:true,...await service.publicData({id:u.searchParams.get('project')})});return;}
    if(req.method==='GET'&&u.pathname==='/api/web/build/dashboard'){json(200,{ok:true,...await service.dashboard('fixture')});return;}
    if(req.method==='GET'&&u.pathname==='/api/web/launch/directory'){json(200,{ok:true,launches:[]});return;}
    if(req.method==='POST'&&['/api/web/build/create','/api/web/build/update'].includes(u.pathname)){
      let body='';for await(const c of req){body+=c;if(body.length>18000)throw Error('Body too large');}
      const action=u.pathname.endsWith('/create')?'create':'update';json(200,{ok:true,result:await service[action]('fixture',JSON.parse(body))});return;
    }
    if(u.pathname.startsWith('/api/')||req.method!=='GET'){json(404,{ok:false,error:'Local fixture does not provide this API. No real network request was made.'});return;}
    const file=path.resolve(root,'.'+(routes[u.pathname]?'/'+routes[u.pathname]:u.pathname));if(!file.startsWith(root+path.sep))throw Error('Invalid path');
    let content=await fs.readFile(file);const ext=path.extname(file);
    if(ext==='.html')content=Buffer.from(content.toString().replace('</head>','<script>localStorage.setItem("ogreWebToken","local-fixture-only");</script></head>').replace('</body>','<div style="position:fixed;bottom:0;left:0;z-index:9999;background:#18330c;color:#ddffaa;padding:5px 10px;font:10px system-ui;pointer-events:none">LOCAL TEST DATA · NO REAL FUNDS</div></body>'));
    res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'})[ext]||'application/octet-stream','cache-control':'no-store'});res.end(content);
  }catch(e){json(400,{ok:false,error:e.message});}
}).listen(4181,'127.0.0.1',()=>console.log('Slime Studio local fixture at http://127.0.0.1:4181/launch/build'));
