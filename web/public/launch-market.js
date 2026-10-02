(function(root){
  'use strict';
  const validMint=v=>typeof v==='string'&&/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(v);
  const number=(v,positive=false)=>{
    if((typeof v!=='number'&&typeof v!=='string')||String(v).trim()==='')return null;
    const n=Number(v);return Number.isFinite(n)&&(!positive||n>0)?n:null;
  };
  const nonnegative=v=>{const n=number(v);return n!==null&&n>=0?n:null;};
  function selectMarket(mint,pairs,asOf=Date.now()){
    const pair=(Array.isArray(pairs)?pairs:[]).filter(p=>p?.chainId==='solana'&&p.baseToken?.address===mint)
      .sort((a,b)=>(nonnegative(b.liquidity?.usd)||0)-(nonnegative(a.liquidity?.usd)||0))[0];
    if(!pair)return {status:'unavailable',asOf};
    return {status:'ready',asOf,marketCap:number(pair.marketCap,true),fdv:number(pair.fdv,true),price:number(pair.priceUsd,true),liquidity:nonnegative(pair.liquidity?.usd),volume24h:nonnegative(pair.volume?.h24),change24h:number(pair.priceChange?.h24)};
  }
  // Public market quotes only. Fee accounting is separate and never waits here.
  // One request at a time, up to 30 exact mints per request, with shared promises.
  function createReader({fetchImpl=(...args)=>root.fetch(...args),now=Date.now,ttlMs=60000,retryMs=15000,timeoutMs=5000,maxEntries=180}={}){
    const cache=new Map(),pending=new Map();let queue=Promise.resolve();
    function remember(mint,value){
      cache.delete(mint);cache.set(mint,{value,expires:now()+(value.status==='ready'?ttlMs:retryMs)});
      while(cache.size>Math.max(1,maxEntries))cache.delete(cache.keys().next().value);
      return value;
    }
    async function batch(mints){
      const controller=new AbortController();let timer;
      try{
        const rows=await Promise.race([
          Promise.resolve().then(()=>fetchImpl('https://api.dexscreener.com/tokens/v1/solana/'+mints.join(','),{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'})).then(r=>{if(!r.ok)throw Error('Market data unavailable');return r.json();}),
          new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Market lookup timed out'));},timeoutMs);})
        ]);
        if(!Array.isArray(rows))throw Error('Invalid market response');
        const asOf=now();return Object.fromEntries(mints.map(m=>[m,remember(m,selectMarket(m,rows,asOf))]));
      }catch{return Object.fromEntries(mints.map(m=>[m,remember(m,{status:'error',asOf:now()})]));}
      finally{clearTimeout(timer);}
    }
    async function read(mints){
      const requested=[...new Set(mints.filter(validMint))],missing=requested.filter(m=>!pending.has(m)&&!(cache.get(m)?.expires>now()));
      for(let i=0;i<missing.length;i+=30){
        const mints=missing.slice(i,i+30),work=queue.then(()=>batch(mints));queue=work.then(()=>{},()=>{});
        for(const mint of mints){const p=work.then(rows=>rows[mint]).finally(()=>{if(pending.get(mint)===p)pending.delete(mint);});pending.set(mint,p);}
      }
      return Object.fromEntries(await Promise.all(requested.map(async m=>[m,await (pending.get(m)||Promise.resolve(cache.get(m)?.value))])));
    }
    return {read,peek:mint=>cache.get(mint)?.value,clear:()=>cache.clear()};
  }
  root.SlimeLaunchMarket={validMint,selectMarket,createReader};
})(window);
