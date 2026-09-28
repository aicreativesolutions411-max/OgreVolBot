import { PublicKey, SystemProgram } from '@solana/web3.js';
import { createRequire } from 'node:module';
import { eligibleHolderBalances } from './holderAlliance.js';
const {PUMP_SDK,PUMP_PROGRAM_ID,bondingCurvePda}=createRequire(import.meta.url)('@pump-fun/pump-sdk');
const SOL='So11111111111111111111111111111111111111112';
const PROGRAMS=new Set(['TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA','TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb']);
// Never spend RPC on an unused community. Both active snapshots must finish
// successfully and be fresh before callers may allocate any funds.
export async function readHolderCommunities(mint,policy,{read=readHolderSnapshot,excluded=[],now=Date.now}={}){
  const started=now();
  const [own,partner]=await Promise.all([
    policy.ownHolderShareBps>0?read(mint,{excluded}):null,
    policy.partnerHolderShareBps>0?read(policy.partnerMint,{excluded}):null
  ]);
  if(now()-started>60000||[own,partner].some(s=>s&&(!Number.isFinite(s.capturedAt)||now()-s.capturedAt>60000)))throw new Error('Holder snapshots took too long. Retrying without allocating partial data.');
  return {own,partner};
}
export function pumpCurveUsdPrice(curve,decimals,solUsd){
  if(!curve||curve.complete||curve.isMayhemMode||!Number.isInteger(decimals)||decimals<0||decimals>18)throw new Error('No supported active Pump curve price.');
  if(!curve.quoteMint?.equals(PublicKey.default)&&curve.quoteMint?.toBase58()!==SOL)throw new Error('Only SOL-quoted Pump curves are supported.');
  const tokens=Number(curve.virtualTokenReserves?.toString()),quote=Number(curve.virtualQuoteReserves?.toString()),real=Number(curve.realQuoteReserves?.toString());
  const price=(quote/1e9)/(tokens/10**decimals)*Number(solUsd);
  if(!(tokens>0&&quote>0&&real>0&&Number(solUsd)>0&&Number.isFinite(price)&&price>0))throw new Error('No funded Pump curve price.');
  return String(price);
}
// Dedicated free reads: never fall back to a paid RPC or a truncated top list.
export async function readHolderSnapshot(mint,{fetchImpl=fetch,excluded=[]}={}){
  mint=new PublicKey(mint).toBase58();
  const deadline=AbortSignal.timeout(25000);
  const request=async(url,options={})=>{
    const response=await fetchImpl(url,{...options,signal:AbortSignal.any([deadline,AbortSignal.timeout(15000)])});
    if(!response.ok)throw new Error(`Holder snapshot source unavailable (${response.status}); funds stay reserved.`);
    let size=0;const chunks=[];
    for await(const chunk of response.body){size+=chunk.length;if(size>24*1024*1024)throw new Error('Holder list exceeds safe snapshot size; no partial payout.');chunks.push(chunk);}
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  };
  const rpc=async(method,params)=>{
    for(let attempt=0;attempt<3;attempt++){
      const body=await request('https://api.mainnet-beta.solana.com',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})});
      // Public load-balanced nodes can trail the finalized snapshot briefly.
      // Keep minContextSlot; never "fix" this by accepting older recipient data.
      if(body.error?.code===-32016&&attempt<2){await new Promise(resolve=>setTimeout(resolve,500));continue;}
      if(body.error||!Object.hasOwn(body,'result'))throw new Error(`Complete free holder snapshot unavailable (${method}: ${String(body.error?.message||'invalid response').slice(0,140)}); rewards remain reserved.`);return body.result;
    }
  };
  const info=await rpc('getAccountInfo',[mint,{encoding:'jsonParsed',commitment:'finalized'}]);
  const program=info?.value?.owner,decimals=info?.value?.data?.parsed?.info?.decimals;
  if(!PROGRAMS.has(program)||!Number.isInteger(decimals))throw new Error('Partner must be a verified Solana token mint.');
  const [accounts,market]=await Promise.all([
    rpc('getProgramAccounts',[program,{commitment:'finalized',encoding:'base64',withContext:true,dataSlice:{offset:0,length:166},filters:[{memcmp:{offset:0,bytes:mint}},...(program.startsWith('Tokenkeg')?[{dataSize:165}]:[])]}]),
    request(`https://api.dexscreener.com/latest/dex/tokens/${mint}`)
  ]);
  if(!Number.isSafeInteger(accounts?.context?.slot)||!Array.isArray(accounts?.value))throw new Error('Incomplete holder snapshot; no rewards allocated.');
  const pair=(market.pairs||[]).filter(p=>p.chainId==='solana'&&p.baseToken?.address===mint&&Number(p.priceUsd)>0&&Number(p.liquidity?.usd)>=1000).sort((a,b)=>Number(b.liquidity.usd)-Number(a.liquidity.usd))[0];
  let priceUsd=pair?.priceUsd,priceSource='DexScreener USD quote';
  if(!priceUsd){
    const [curveInfo,solMarket]=await Promise.all([
      rpc('getAccountInfo',[bondingCurvePda(mint).toBase58(),{encoding:'base64',commitment:'finalized',minContextSlot:accounts.context.slot}]),
      request(`https://api.dexscreener.com/latest/dex/tokens/${SOL}`)
    ]);
    const solPair=(solMarket.pairs||[]).filter(p=>p.chainId==='solana'&&p.baseToken?.address===SOL&&Number(p.priceUsd)>0&&Number(p.liquidity?.usd)>=100000).sort((a,b)=>Number(b.liquidity.usd)-Number(a.liquidity.usd))[0];
    if(curveInfo?.value?.owner!==PUMP_PROGRAM_ID.toBase58()||!solPair)throw new Error('No verified active Pump curve or liquid indexed USD market. Fees accumulate until pricing is available.');
    const data=Buffer.from(curveInfo.value.data[0],'base64');
    if(data.length<81)throw new Error('Incomplete Pump curve account; rewards remain reserved.');
    const curve=PUMP_SDK.decodeBondingCurveNullable({...curveInfo.value,data});
    priceUsd=pumpCurveUsdPrice(curve,decimals,solPair.priceUsd);priceSource='finalized Pump SOL curve + liquid SOL/USD quote';
  }
  const seen=new Set();
  const rows=accounts.value.map(row=>{
    if(seen.has(row.pubkey)||row.account?.owner!==program||row.account?.executable||row.account?.space<165)throw new Error('Invalid or duplicate token account; snapshot rejected.');seen.add(row.pubkey);
    const data=Buffer.from(row.account.data?.[0]||'','base64');
    if(data.length<165||new PublicKey(data.subarray(0,32)).toBase58()!==mint||![1,2].includes(data[108])||(row.account.space>165&&data[165]!==2))throw new Error('Truncated, wrong-mint or invalid holder account.');
    return {wallet:new PublicKey(data.subarray(32,64)).toBase58(),amount:String(data.readBigUInt64LE(64))};
  });
  if(BigInt(info.value.data.parsed.info.supply||0)>0n&&!rows.some(row=>BigInt(row.amount)>0n))throw new Error('Nonzero mint supply but no token balances returned. Snapshot rejected.');
  const holders=eligibleHolderBalances(rows,{decimals,priceUsd,excluded});
  // Verify recipients are system wallets, excluding on-curve program accounts.
  const verified=[];
  if(holders.length>2000)throw new Error('Community exceeds the current 2,000 eligible-wallet safety limit. No partial holder payout.');
  for(let i=0;i<holders.length;i+=100){
    const batch=holders.slice(i,i+100),result=await rpc('getMultipleAccounts',[batch.map(r=>r.wallet),{encoding:'base64',commitment:'finalized',minContextSlot:accounts.context.slot,dataSlice:{offset:0,length:0}}]);
    if(result?.value?.length!==batch.length)throw new Error('Incomplete recipient verification; no partial payout.');
    result.value.forEach((account,j)=>{if(!account||(account.owner===SystemProgram.programId.toBase58()&&!account.executable))verified.push(batch[j]);});
  }
  return {mint,slot:accounts.context.slot,priceUsd:String(priceUsd),decimals,holders:verified,capturedAt:Date.now(),source:'Solana finalized accounts + '+priceSource};
}
