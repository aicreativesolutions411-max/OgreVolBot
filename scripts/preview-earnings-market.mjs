// Local-only visual fixture. No app runtime, authentication, RPC or transfers.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web/dist');
const coins=[
  {mint:'29tonWkkMa9XZEF2iR8RXqkXWmPBiuKWbBUCCsFZpump',name:'Left4Sol',symbol:'L4S'},
  {mint:'5FNhSf3Hwjpg676Mjy2KSRNFg9apC7Njsq83ehTVpump',name:'Pumptaur',symbol:'PUMPTAUR'},
  {mint:'6e99v4tJrVmE8qfETH6vZ9Y5zXZQXfewKQ9NiQf3QfBq',name:'Test',symbol:'TEST',hiddenFromDiscovery:true}
].map(c=>({...c,imageUrl:'/assets/slimewire/svg/slimewire-mark.svg',createdAt:'2026-10-01T12:00:00Z',paidLamports:'1250000000',totalPaidLamports:'1250000000',reservedLamports:'250000000',roles:['Developer'],receipts:[],receiptCount:0,automatic:true,cadenceHours:12}));
http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1'),json=(code,value)=>{res.writeHead(code,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(value));};
  try{
    if(req.method!=='GET'){json(405,{ok:false,error:'Read-only local fixture.'});return;}
    if(u.pathname==='/config.js'){res.writeHead(200,{'content-type':'application/javascript'});res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};');return;}
    if(u.pathname==='/api/web/launch/earnings'){json(200,{ok:true,earnings:{scope:u.searchParams.get('scope')||'all',period:u.searchParams.get('period')||'all',asOf:new Date().toISOString(),paidLamports:'3750000000',reservedLamports:'750000000',developerPaidLamports:'3750000000',communityPaidLamports:'0',recipientPaidLamports:'0',coins,note:'LOCAL EXAMPLE PAYMENTS ONLY. Not actual earnings.'}});return;}
    if(u.pathname==='/api/web/launch/rewards'){json(200,{ok:true,report:{collectionTotalLamports:'1500000000',destinations:[{label:'Example developer',shareBps:10000,paidLamports:'1250000000',reservedLamports:'250000000'}],note:'LOCAL EXAMPLE ONLY.'}});return;}
    if(u.pathname.startsWith('/api/')){json(404,{ok:false,error:'Not provided by this local fixture.'});return;}
    const file=path.resolve(root,'.'+(['/','/launch/earnings'].includes(u.pathname)?'/launch-earnings.html':u.pathname));
    if(!file.startsWith(root+path.sep))throw Error('Invalid path');
    let content=await fs.readFile(file);const ext=path.extname(file);
    if(ext==='.html')content=Buffer.from(content.toString().replace('</body>','<div style="position:fixed;bottom:0;left:0;z-index:9999;background:#18330c;color:#ddffaa;padding:5px 10px;font:10px system-ui;pointer-events:none">LOCAL TEST PAYMENTS · NO REAL FUNDS</div></body>'));
    res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'})[ext]||'application/octet-stream','cache-control':'no-store'});res.end(content);
  }catch(e){json(404,{ok:false,error:e.message});}
}).listen(4182,'127.0.0.1',()=>console.log('Read-only earnings fixture: http://127.0.0.1:4182/launch/earnings'));
