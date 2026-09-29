import { PublicKey } from '@solana/web3.js';

const API='https://frontend-api-v3.pump.fun';
const CHAIN='solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
const SOL='So11111111111111111111111111111111111111112';
const key=v=>{try{return new PublicKey(v).toBase58();}catch{return '';}};
function solAmount(rows){
  if(!Array.isArray(rows))return null;
  const legs=rows.filter(r=>r?.quote?.chainId===CHAIN&&r.quote.address===SOL);
  if(!legs.length||legs.some(r=>r.amount?.decimals!==9||typeof r.amount?.raw!=='string'||!/^\d{1,30}$/.test(r.amount.raw)))return null;
  return String(legs.reduce((n,r)=>n+BigInt(r.amount.raw),0n));
}
const base=mint=>({source:'Pump',sourceUrl:'https://pump.fun/coin/'+mint,mint,asset:'SOL',status:'unavailable',scope:'coin_creator',earnedLamports:null,claimableLamports:null,awaitingDistributionLamports:null,checkedAt:'',providerAsOf:'',note:'Pump has not returned an attributable SOL earnings figure. Unavailable does not mean zero.'});

// Read-only reference, not accounting or an execution dependency. No RPC, claims,
// transfers, background timers, account-wide /totals fallback or volume estimates.
// Pump's current frontend contract documents /fees/creator?mint and per-coin
// /fees/shareholder rows. These public endpoints may change: fail closed.
export function createPumpFeeReferenceReader({fetchImpl=globalThis.fetch,now=Date.now,ttlMs=120000,maxEntries=500,maxConcurrent=4}={}){
  const cache=new Map(),pending=new Map();
  async function json(url){
    const r=await fetchImpl(url,{headers:{accept:'application/json'},signal:AbortSignal.timeout(3500),redirect:'error'});
    if(!r.ok){const error=Error('Pump reference unavailable');error.reasonCode=Number.isInteger(r.status)?'provider_http_'+r.status:'provider_unavailable';throw error;}
    return r.json();
  }
  async function load(a,mint,creator,mode){
    const result=base(mint);
    if(mode==='creator'){
      // Only completed local launches reach here. Their recorded creator is the
      // attribution key; a second metadata service must not gate the fee read.
      const data=await json(API+'/fees/creator/'+creator+'?'+new URLSearchParams({mint,period:'30d',interval:'1d'}));
      if(data?.creator!==creator)return {...result,reasonCode:'creator_mismatch'};
      result.earnedLamports=solAmount(data.earned);
      result.note='Pump-reported all-time creator earnings for this coin in SOL. Earned is not paid out or available to claim. Other quote assets are not included; wallet-wide balances stay in Wallet.';
      if(Number.isSafeInteger(data.asOf)&&data.asOf>0&&data.asOf<=now())result.providerAsOf=new Date(data.asOf).toISOString();
    }else{
      const config=key(a.pumpFeeSharing?.configAddress);
      if(!config)return result;
      const holder=mode==='holder_alliance';
      const bps=holder?Number(a.launchUtility?.creatorShareBps):10000-Number(a.launchUtility?.partnerShareBps||0);
      const shareholder=bps>0?creator:key(a.pumpFeeSharing?.vaultAddress||a.launchUtility?.partnerWallet);
      if(!shareholder)return result;
      let cursor='';
      for(let page=0;page<3;page++){
        const data=await json(API+'/fees/shareholder/'+shareholder+(cursor?'?cursor='+encodeURIComponent(cursor):''));
        if(!Array.isArray(data?.coins))return result;
        const row=data.coins.find(r=>r?.coin?.chainId===CHAIN&&r.coin.address===mint&&r.configAddress===config);
        if(row){
          result.scope='sharing_config';result.earnedLamports=solAmount(row.totalEarned);result.awaitingDistributionLamports=solAmount(row.totalUnclaimed);
          result.note='Pump-reported SOL earnings for this coin’s saved fee-sharing configuration. Awaiting distribution is the coin’s fee pool, not your wallet balance. Earlier creator-vault earnings and other quote assets are not included. Recipient payouts are verified separately.';
          break;
        }
        if(typeof data.nextCursor!=='string'||!data.nextCursor||data.nextCursor===cursor||data.nextCursor.length>2048)break;
        cursor=data.nextCursor;
      }
    }
    result.status=result.earnedLamports===null?'unavailable':'available';
    result.checkedAt=new Date(now()).toISOString();
    return result;
  }
  return async function read(a={}){
    const mint=key(a.tokenMint),creator=key(a.devWalletPublicKey),mode=a.launchUtility?.mode||'creator';
    const empty=base(mint);
    if(a.status!=='COMPLETE'||!mint||!creator||!['creator','alliance','holder_alliance'].includes(mode)||[a.pumpCashback,a.cashback,a.isCashbackCoin,a.holderRewards?.enabled].includes(true)||a.creatorFeeSplit?.length||(mode==='creator'&&a.creatorFeeRecipient&&a.creatorFeeRecipient!==creator))return {...empty,reasonCode:'unsupported_launch'};
    const id=[mint,creator,mode,a.pumpFeeSharing?.configAddress||'',a.pumpFeeSharing?.vaultAddress||'',a.launchUtility?.partnerWallet||'',a.launchUtility?.creatorShareBps??'',a.launchUtility?.partnerShareBps??''].join(':');
    const old=cache.get(id);
    const stale=()=>old?.value.earnedLamports!=null&&now()-Date.parse(old.value.checkedAt)<1800000?{...old.value,status:'stale'}:empty;
    if(old&&now()<old.expires)return {...old.value};
    if(pending.has(id))return {...await pending.get(id)};
    if(pending.size>=maxConcurrent)return stale();
    const job=(async()=>{
      let value;
      try{value=await load(a,mint,creator,mode);}catch(error){value={...stale(),reasonCode:/^provider_http_\d{3}$/.test(error.reasonCode||'')?error.reasonCode:error.name==='TimeoutError'?'provider_timeout':'provider_unavailable'};}
      cache.delete(id);cache.set(id,{value,expires:now()+(value.status==='available'?ttlMs:30000)});
      while(cache.size>maxEntries)cache.delete(cache.keys().next().value);
      return value;
    })();
    pending.set(id,job);
    try{return {...await job};}finally{pending.delete(id);}
  };
}
export const readPumpFeeReference=createPumpFeeReferenceReader();
