// Isolated UI fixture server. No app runtime, secrets, network providers or transfers.
// Usage: node scripts/preview-launch-earnings.mjs
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Keypair} from '@solana/web3.js';
import {buildLaunchEarnings} from '../src/lib/launchEarnings.js';
import {buildLaunchDirectory} from '../src/lib/launchDirectory.js';
import {buildLaunchRewardReport} from '../src/lib/launchRewardReport.js';
import {serveStaticVideo} from '../src/lib/staticVideo.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web/dist');
const key=n=>Keypair.fromSeed(new Uint8Array(32).fill(n)).publicKey.toBase58();
const now=Date.now(),iso=ms=>new Date(ms).toISOString(),dev=key(1),recipient=key(2),vault=key(3);
const attempts=Array.from({length:28},(_,i)=>{
  const total=BigInt(i+1)*1000000000n,paid=total/2n;
  return {status:'COMPLETE',tokenMint:key(i+10),devWalletPublicKey:dev,tokenName:['Midnight Slime','Greenroom','Community Works','After Hours'][i%4]+' '+(i+1),symbol:['SLIME','GREEN','WORK','NIGHT'][i%4]+i,
    imageUri:'/assets/slimewire/svg/slimewire-mark.svg',createdAt:iso(now-(i+1)*86400000),pumpFeeSharing:{status:'ACTIVE',vaultAddress:vault},
    launchUtility:{mode:'holder_alliance',creatorShareBps:2000,ownHolderShareBps:5000,partnerHolderShareBps:1000,partnerMint:key(80),partnerName:'Neighbour community',recipientShareBps:2000,recipients:[{wallet:recipient,shareBps:2000,label:'Community artist'}]},
    allianceDistribution:{automaticPaused:i===2,receipts:[{signature:'fixture-collection-'+i,confirmedAt:iso(now-i*86400000),accountingStatus:'verified',totalLamports:String(total),payments:[{wallet:dev,lamports:String(total/5n)},{wallet:vault,lamports:String(total*4n/5n)}]}]},
    holderAllianceLedger:{paidLamports:String(paid),paidByWallet:{[recipient]:String(paid)},sourceTrackingSince:iso(now-31*86400000),paidBySource:{own:String(paid)},credits:{[recipient]:'75000000'},creditSources:{own:{[recipient]:'75000000'}},lastSnapshotAt:now-3600000,receiptCount:1,
      receipts:[{signature:'fixture-holder-'+i,confirmedAt:iso(now-i*86400000),lamports:String(paid),payments:[{wallet:recipient,lamports:String(paid)}],bySource:{own:String(paid)}}]}};
});
attempts.push({status:'COMPLETE',tokenMint:key(90),devWalletPublicKey:dev,symbol:'LEGACY',tokenName:'Legacy creator example',createdAt:iso(now-45*86400000)});
const server=http.createServer(async(req,res)=>{
  const u=new URL(req.url,'http://127.0.0.1');
  const json=(code,data)=>{res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify(data));};
  if(req.method!=='GET'){json(405,{ok:false});return;}
  try{
    if(u.pathname==='/config.js'){res.writeHead(200,{'content-type':'application/javascript'});res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};');return;}
    if(u.pathname==='/api/web/launch/earnings'){json(200,{ok:true,earnings:buildLaunchEarnings(attempts,u.searchParams.getAll('wallet'),{scope:u.searchParams.get('scope')||'mine',period:u.searchParams.get('period')||'all'})});return;}
    if(u.pathname==='/api/web/launch/rewards'){json(200,{ok:true,report:buildLaunchRewardReport(attempts.find(a=>a.tokenMint===u.searchParams.get('mint')))});return;}
    if(u.pathname==='/api/web/launch/fee-reference'){json(200,{ok:true,reference:{mint:u.searchParams.get('mint'),source:'Pump',scope:'coin_creator',status:'available',asset:'SOL',earnedLamports:'7872559004',claimableLamports:null,checkedAt:iso(now),note:'LOCAL TEST DATA — simulated Pump reference for layout testing only.'}});return;}
    if(u.pathname==='/api/web/launch/directory'){json(200,{ok:true,launches:buildLaunchDirectory(attempts)});return;}
    const route={'/':'home.html','/contact':'contact.html','/games':'games.html','/help':'help.html','/bot':'bot.html','/terminal':'terminal.html','/wallet':'fun.html','/wallet/':'fun.html','/launch/community':'launch-community.html','/launch/earnings':'launch-earnings.html','/launch':'launch.html'}[u.pathname]||u.pathname;
    const file=path.resolve(root,'.'+(route.startsWith('/')?route:'/'+route));
    if(!file.startsWith(root+path.sep)){json(403,{ok:false});return;}
    if(file.endsWith('.mp4')){await serveStaticVideo(res,file,(await fs.stat(file)).size,{method:req.method,range:req.headers.range});return;}
    let bytes=await fs.readFile(file);const ext=path.extname(file);
    if(ext==='.html')bytes=Buffer.from(bytes.toString().replace('<main>','<main><p style="color:#bafa60;font-size:11px">LOCAL TEST DATA — NOT LIVE EARNINGS</p>'));
    res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg'})[ext]||'application/octet-stream'});res.end(bytes);
  }catch(e){json(400,{ok:false,error:e.message});}
});
server.listen(4178,'127.0.0.1',()=>console.log('Read-only fixture preview: http://127.0.0.1:4178/launch/earnings\nFixture wallet: '+dev));
