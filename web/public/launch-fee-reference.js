(function(root){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const valid=m=>/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(m||'');
  function sol(v){if(v===null||v===undefined||!/^\d{1,30}$/.test(String(v)))return 'Not available';const n=BigInt(v),f=String(n%1000000000n).padStart(9,'0').replace(/0+$/,'');return n/1000000000n+(f?'.'+f:'')+' SOL';}
  function render(mint,r=null){
    if(!valid(mint))return '';
    const earned=r?.earnedLamports,known=earned!==null&&earned!==undefined,stamp=r?.checkedAt&&Number.isFinite(Date.parse(r.checkedAt))?new Date(r.checkedAt).toLocaleString():'';
    const status=!r?'Checking Pump…':r.status==='stale'?'Cached · refresh delayed':known?'Pump-reported':'Not available from Pump';
    return '<section class="pump-fee-reference" aria-label="Pump fee reference"><header><span>PUMP REFERENCE</span><a href="https://pump.fun/coin/'+encodeURIComponent(mint)+'" target="_blank" rel="noopener noreferrer">View on Pump ↗</a></header><div class="pump-fee-metrics"><div><small>Creator fees earned · '+(r?.scope==='sharing_config'?'sharing configuration':'all time')+'</small><strong>'+esc(!r?'Loading…':sol(earned))+'</strong><span class="pump-fee-state" data-stale="'+(r?.status==='stale')+'">'+esc(status)+'</span></div><div><small>'+(r?.scope==='sharing_config'?'Awaiting distribution · coin pool':'Available to claim')+'</small>'+(r?.scope==='sharing_config'?'<b>'+esc(sol(r.awaitingDistributionLamports))+'</b><span>Not your personal balance</span>':'<a class="pump-wallet-link" href="/wallet">Check in Wallet ↗</a><span>Creator balances may span coins</span>')+'</div></div><p class="pump-fee-caption">Earned is not paid. This reference is not added to verified payout totals.'+(stamp?' Checked '+esc(stamp)+'.':'')+'</p><details><summary>Source &amp; coverage</summary><p>'+esc(r?.note||'Reading Pump’s coin-specific SOL earnings. Missing information stays unavailable, not zero. Verified SlimeWire payments below load independently.')+'</p>'+(r?.providerAsOf?'<p>Provider data as of '+esc(new Date(r.providerAsOf).toLocaleString())+'.</p>':'')+'</details></section>';
  }
  function mount(node,mint,api=''){
    if(!node||!valid(mint))return ()=>{};
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);let active=true;
    node.innerHTML=render(mint);
    fetch(api+'/api/web/launch/fee-reference?mint='+encodeURIComponent(mint),{credentials:'omit',signal:controller.signal}).then(async response=>{
      const data=await response.json();if(!response.ok||!data.ok||data.reference?.mint!==mint)throw Error('unavailable');
      if(active&&node.isConnected)node.innerHTML=render(mint,data.reference);
    }).catch(()=>{if(active&&node.isConnected)node.innerHTML=render(mint,{status:'unavailable',note:'Pump’s reference is temporarily unavailable. Verified payout records remain unchanged. Reopen this coin or use Refresh to retry.'});}).finally(()=>clearTimeout(timer));
    return ()=>{active=false;clearTimeout(timer);controller.abort();};
  }
  root.SlimeFeeReference={render,mount,sol};
})(window);
