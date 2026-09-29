// Offline visual QA. No dotenv, network, production stores, wallets or signing.
// The example amounts below are fixtures, never served by the real application.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {Keypair} from '@solana/web3.js';
import {launchUtilityCapabilities,reviewLaunchUtility} from '../src/lib/launchUtility.js';
import {buildLaunchRewardReport} from '../src/lib/launchRewardReport.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web/public');
const publicKey=()=>Keypair.generate().publicKey.toBase58();
const mint=publicKey(),creator=publicKey(),recipient=publicKey(),partnerMint=publicKey();
const policy={mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:3000,partnerHolderShareBps:3000,recipientShareBps:2000,recipientWallet:recipient,partnerMint,partnerName:'Example community'};
const report=buildLaunchRewardReport({status:'COMPLETE',tokenMint:mint,symbol:'DEMO',devWalletPublicKey:creator,launchUtility:policy,pumpFeeSharing:{status:'ACTIVE'},holderAllianceLedger:{sourceTrackingSince:Date.now(),paidLamports:'700000000',allocatedLamports:'800000000',credits:{[recipient]:'100000000'},creditSources:{recipient:{[recipient]:'100000000'}},paidBySource:{own:'300000000',partner:'300000000',recipient:'100000000'},allocatedBySource:{own:'300000000',partner:'300000000',recipient:'200000000'}},allianceDistribution:{receipts:[{signature:'offline-demo-not-a-transaction',accountingStatus:'verified',totalLamports:'1000000000',payments:[{wallet:creator,lamports:'200000000'}]}]}});
const sandbox=vm.createContext({window:{},URLSearchParams,document:{addEventListener(){}}});
vm.runInContext(await fs.readFile(path.join(root,'launch-utility.js'),'utf8'),sandbox);
const form=sandbox.window.SlimeLaunchUtility.render('qa',policy);
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
http.createServer(async(req,res)=>{
  const json=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
  res.setHeader('Cache-Control','no-store');
  try{
    const url=new URL(req.url,'http://localhost');
    if(url.pathname==='/api/web/launch/utility/review'&&req.method==='POST'){
      let body='';for await(const chunk of req){body+=chunk;if(body.length>16000)throw Error('Too large');}
      const input=JSON.parse(body);return json(200,{ok:true,...reviewLaunchUtility(input.launchUtility,{rail:'pump'})});
    }
    if(req.method!=='GET')return json(403,{error:'No money operations in offline preview.'});
    if(url.pathname==='/config.js'){res.setHeader('Content-Type','text/javascript');return res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};');}
    if(url.pathname==='/api/web/launch/utility/capabilities')return json(200,{ok:true,...launchUtilityCapabilities()});
    if(url.pathname==='/api/web/launch/directory')return json(200,{ok:true,launches:[{mint,symbol:'DEMO',name:'Offline example · not a real launch',rewardMode:'holder_alliance'}]});
    if(url.pathname==='/api/web/launch/rewards')return json(200,{ok:true,report});
    if(url.pathname==='/api/web/community/public')return json(200,{ok:true,agreements:[],goals:[]});
    if(url.pathname.startsWith('/api/'))return json(403,{error:'Accounts and financial actions are disabled in offline preview.'});
    if(url.pathname==='/fees-preview'){
      res.setHeader('Content-Type','text/html; charset=utf-8');
      return res.end('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline fee split QA</title><link rel="stylesheet" href="/launch-pad.css"><link rel="stylesheet" href="/launch-utility.css"><style>body{padding:20px}main{max-width:720px;margin:auto}input,select{max-width:100%;box-sizing:border-box}input{color:inherit;background:#0c160e;border:1px solid #384f32;padding:12px;border-radius:8px}</style><script src="/config.js"></script><script src="/launch-utility.js"></script></head><body><main><p>OFFLINE QA · sample addresses only · no funds or launches</p>'+form+'<p><a href="/launch?rewards='+mint+'">Preview per-coin fee report ↗</a> · <a href="/">Homepage</a></p><pre id="readback" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></main><script>SlimeLaunchUtility.wire("qa",{context:()=>({rail:"pump"}),request:async body=>{const r=await fetch("/api/web/launch/utility/review",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});return r.json()},onChange:()=>document.getElementById("readback").textContent=JSON.stringify(SlimeLaunchUtility.read("qa"),null,2)});</script></body></html>');
    }
    const routes={'/':'home.html','/launch':'launch.html','/launch/community':'launch-community.html'};
    const relative=routes[url.pathname]||decodeURIComponent(url.pathname).replace(/^\/+/,''),file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep))return json(400,{error:'Invalid path'});
    const content=await fs.readFile(file);res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.end(content);
  }catch(e){json(400,{error:e.message});}
}).listen(4186,'127.0.0.1',()=>console.log('Offline fee UI: http://127.0.0.1:4186/fees-preview'));
