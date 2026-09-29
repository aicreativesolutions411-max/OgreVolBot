(function(root){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sol(value){if(value===null||value===undefined)return 'Not attributed';try{const n=BigInt(value),f=String(n%1000000000n).padStart(9,'0').replace(/0+$/,'');return String(n/1000000000n)+(f?'.'+f:'')+' SOL';}catch{return 'Not attributed';}}
  const short=v=>String(v||'').slice(0,5)+'…'+String(v||'').slice(-4);
  const date=(v,time=false)=>Number.isFinite(Date.parse(v||''))?(time?new Date(v).toLocaleString():new Date(v).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})):'Date unavailable';
  const periodName={all:'All time','24h':'Past 24 hours','7d':'Past 7 days','30d':'Past 30 days'};
  const coinName=c=>c.symbol?'$'+c.symbol:c.name||short(c.mint);
  function avatar(c){
    const sources=root.SlimeLaunchPad?.imageCandidates(c.imageUrl)||[];
    return '<div class="coin-avatar"><span class="coin-initial" aria-hidden="true">'+esc((c.symbol||c.name||'?').slice(0,2))+'</span>'+('<img data-image-mint="'+esc(c.mint)+'" data-earnings-image="'+esc(JSON.stringify(sources))+'" alt="" hidden decoding="async" referrerpolicy="no-referrer">')+'</div>';
  }
  function summaryHtml(data){
    const mine=data.scope!=='all',coins=data.coins||[],known=!coins.length||coins.some(c=>c.paidLamports!==null&&c.paidLamports!==undefined)||BigInt(data.paidLamports||0)>0n;
    const pendingKnown=!coins.length||coins.some(c=>c.reservedLamports!==null&&c.reservedLamports!==undefined)||BigInt(data.reservedLamports||0)>0n;
    const total=known?sol(data.paidLamports):'Not attributed',note=!known?'These coins use wallet-wide claims or incomplete historical records.':data.incomplete?'Recorded subtotal · some history is unavailable':'Verified recorded payments';
    const stat=(label,value)=>'<div><small>'+esc(label)+'</small><b>'+value+'</b></div>';
    const sides=mine?stat('Pending payout · current',esc(sol(pendingKnown?data.reservedLamports:null)))+stat('Available to claim','<a href="/wallet">Check in Wallet ↗</a>')+stat('Coins in your view',esc(coins.length)):
      stat('Developer payments',esc(sol(known?data.developerPaidLamports:null)))+stat('Holder communities',esc(sol(known?data.communityPaidLamports:null)))+stat('Receiving wallets',esc(sol(known?data.recipientPaidLamports:null)))+(BigInt(data.unattributedPaidLamports||0)>0n?stat('Older, unclassified payouts',esc(sol(data.unattributedPaidLamports))):'');
    return '<div class="earn-overview"><div class="earn-hero-value"><small>'+esc(mine?'Total received':'Total paid out')+' · '+esc(periodName[data.period||'all'])+'</small><strong>'+esc(total.replace(/ SOL$/,''))+(known?'<span class="earn-total-unit"> SOL</span>':'')+'</strong><p>'+esc(note)+(data.trackedSince?' · Tracked since '+esc(date(data.trackedSince)):'')+'</p></div><div class="earn-side-stats">'+sides+'</div></div>'+
      '<details class="earn-coverage"><summary>'+esc(data.incomplete?'About these totals · partial coverage':'How these totals are counted')+'</summary><p>'+esc(data.note||'Recorded paid amounts are verified payments, not estimates.')+'</p>'+(data.unknownCoins?'<p>'+esc(data.unknownCoins)+' coin(s) have no per-coin attribution. Unavailable is not zero.</p>':'')+'<p>Amounts are in SOL. Pending balances are current, regardless of the selected period. '+(mine?'This is fee income—not wallet balance or trading P&amp;L.':'Public totals include all recorded SlimeWire launches.')+'</p></details>';
  }
  function filteredCoins(data,{search='',sort='earned',role='all'}={}){
    const q=search.trim().toLowerCase();
    return (data.coins||[]).filter(c=>(!q||[c.name,c.symbol,c.mint].some(v=>String(v||'').toLowerCase().includes(q)))&&(role==='all'||(c.roles||[]).some(r=>role==='holder'?/holder|Rewards recipient/i.test(r):r===role)))
      .slice().sort((a,b)=>{if(sort==='newest')return (Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0);if(a.paidLamports==null)return b.paidLamports==null?0:1;if(b.paidLamports==null)return -1;const x=BigInt(a.paidLamports),y=BigInt(b.paidLamports);return x===y?0:x>y?-1:1;});
  }
  function paymentRows(coins){
    return coins.flatMap(c=>(c.receipts||[]).map(r=>({...r,coin:c}))).sort((a,b)=>(Date.parse(b.confirmedAt)||0)-(Date.parse(a.confirmedAt)||0));
  }
  function paymentsHtml(rows,{limit=25,identity=true}={}){
    if(!rows.length)return '<div class="earn-empty"><h3>No recorded payments here yet.</h3><p>Try another period. Pending allocations are not payments.</p></div>';
    return '<table class="earn-table"><thead><tr><th>'+ (identity?'Coin / payment':'Payment') +'</th><th>Amount</th><th>Date</th><th>Receipt</th></tr></thead><tbody>'+rows.slice(0,limit).map(r=>'<tr><td>'+(identity?'<div class="earn-coin-name">'+avatar(r.coin)+'<div><b>'+esc(coinName(r.coin))+'</b><small>'+esc(r.kind)+'</small></div></div>':esc(r.kind))+'</td><td data-label="Paid" class="earn-amount">'+esc(sol(r.lamports))+'</td><td data-label="Finalized" class="earn-payment-date">'+esc(date(r.confirmedAt,true))+'</td><td class="earn-action-cell"><a class="earn-receipt-link" href="https://solscan.io/tx/'+encodeURIComponent(r.signature)+'" target="_blank" rel="noopener noreferrer">Receipt ↗</a></td></tr>').join('')+'</tbody></table>';
  }
  function listHtml(data,options={}){
    const {tab='coins',limit=25}=options,coins=filteredCoins(data,options),mine=data.scope!=='all';
    if(!coins.length)return '<div class="earn-empty"><h3>No matching coins.</h3><p>'+((data.coins||[]).length?'Clear the search or role filter to see your other coins.':'Recorded launches and payments will appear here. No estimated earnings or demo coins are included.')+'</p></div>';
    if(tab==='payments'){const rows=paymentRows(coins);return paymentsHtml(rows,{limit})+(rows.length>limit?'<button class="earn-more" type="button" data-earn-more>Show more payments ↓</button>':'')+(coins.some(c=>(c.receiptCount||0)>(c.receipts||[]).length)?'<p class="earn-detail-note">Showing up to 100 recent receipts per coin. Totals include the full recorded history.</p>':'');}
    return '<table class="earn-table"><thead><tr><th>Coin</th><th>'+(mine?'You received':'Paid out')+'</th><th>Pending · current</th><th>Coin total · all time</th><th></th></tr></thead><tbody>'+coins.slice(0,limit).map(c=>'<tr><td><div class="earn-coin-name">'+avatar(c)+'<div><b>'+esc(coinName(c))+'</b><small>'+esc(c.name||short(c.mint))+(mine&&c.roles?.length?' · '+esc(c.roles.join(' / ')):'')+'</small></div></div></td><td class="earn-amount earn-paid-cell" data-label="'+(mine?'You received':'Paid out')+'">'+esc(sol(c.paidLamports))+(c.partial?'<small>Recorded subtotal</small>':'')+'</td><td class="earn-amount earn-pending-cell" data-label="Pending · current">'+esc(c.reservedLamports===null?'—':sol(c.reservedLamports))+(c.paused?'<small>Paused</small>':c.delayed?'<small>Delayed</small>':c.automatic?'<small>12h rewards</small>':'')+'</td><td class="earn-amount earn-total-cell" data-label="Coin total · all time">'+esc(sol(c.totalPaidLamports))+'</td><td class="earn-action-cell"><button type="button" class="earn-view-coin" data-earn-coin="'+esc(c.mint)+'" aria-label="View '+esc(coinName(c))+' earnings">View ↗</button></td></tr>').join('')+'</tbody></table>'+(coins.length>limit?'<button class="earn-more" type="button" data-earn-more>Show more coins ↓</button>':'');
  }
  function detailHtml(c,report,period='all'){
    const collection=report?.collectionTotalLamports;
    return '<div class="earn-detail-identity">'+avatar(c)+'<div><h2 id="earnings-detail-title">'+esc(coinName(c))+'</h2><p>'+esc(c.name||'')+' · '+esc(short(c.mint))+'</p></div></div>'+
      '<div class="earn-mini-stats"><div><small>Coin total paid · all time</small><b>'+esc(sol(c.totalPaidLamports))+'</b></div><div><small>Fees collected · recorded</small><b>'+esc(sol(collection))+'</b></div></div>'+
      '<div class="earn-tabs" role="group" aria-label="Coin earnings details"><button type="button" data-detail-tab="split" aria-pressed="true">Fee split</button><button type="button" data-detail-tab="payments" aria-pressed="false">Payments</button></div>'+
      '<section data-detail-panel="split">'+(report?'<dl class="earn-destinations">'+(report.destinations||[]).map(d=>'<div class="earn-destination"><dt><strong>'+esc(d.shareBps/100)+'%</strong>'+esc(d.label)+(d.address?'<small><a href="https://solscan.io/account/'+encodeURIComponent(d.address)+'" target="_blank" rel="noopener noreferrer">'+esc(short(d.address))+' ↗</a></small>':d.tokenMint?'<small>Community · '+esc(short(d.tokenMint))+'</small>':'')+'</dt><dd>'+esc(sol(d.paidLamports))+' paid<small>'+esc(d.reservedLamports===null?'Pending not attributed':sol(d.reservedLamports)+' pending')+'</small></dd></div>').join('')+'</dl>'+(!(report.destinations||[]).length?'<p class="earn-detail-note">Per-destination records are unavailable for this fee program.</p>':''):'<p class="earn-detail-note" role="status">Loading the verified fee split…</p>')+
      (c.automatic?'<p class="earn-detail-note">Automatic holder rewards · every 12 hours. '+(c.nextSnapshotAt?'Next snapshot due '+esc(date(c.nextSnapshotAt,true))+'. ':'')+'Subject to funds, eligibility and complete data. Payments below 0.001 SOL accumulate.</p>':c.paused?'<p class="earn-detail-note">Automatic payouts are paused. Existing reserved rewards remain owed.</p>':'')+
      (c.delayed?'<p class="earn-detail-note">Payouts are delayed. Reserved rewards remain owed.</p>':'')+
      '<details class="earn-coverage"><summary>Accounting &amp; coverage</summary><p>'+esc(report?.note||'Only verified recorded payments are shown. Unavailable balances are not zero.')+'</p>'+(c.partial?'<p>Some older history is unavailable. '+(c.trackedSince?'Recorded since '+esc(date(c.trackedSince))+'.':'')+'</p>':'')+'</details></section>'+
      '<section data-detail-panel="payments" hidden><p class="earn-detail-note">'+esc(periodName[period])+' · '+esc(c.receiptCount??c.receipts?.length??0)+' recorded payments'+((c.receiptCount||0)>100?' · latest 100 shown':'')+'</p>'+paymentsHtml((c.receipts||[]).map(r=>({...r,coin:c})),{limit:100,identity:false})+'</section>'+
      '<div class="hub-actions"><a class="button button-outline" href="/wallet?ca='+encodeURIComponent(c.mint)+'">Open coin in Wallet ↗</a><a class="text-button" href="/launch?rewards='+encodeURIComponent(c.mint)+'">Eligibility &amp; launch options ↗</a><button type="button" class="text-button" data-share-earnings="'+esc(c.mint)+'">Copy link</button></div><p id="earnings-detail-status" class="earn-status" role="status"></p>';
  }
  function earningsHtml(data,options={}){return summaryHtml(data)+listHtml(data,options);}
  root.SlimeEarnings={sol,earningsHtml,summaryHtml,listHtml,detailHtml,filteredCoins,paymentRows};
  if(!root.document?.getElementById('earnings-content'))return;
  const $=id=>document.getElementById(id),API=String(root.OGRE_PORTAL_CONFIG?.apiBase||'').replace(/\/+$/,''),status=t=>{$('earnings-status').textContent=t;},walletStatus=t=>{$('earnings-wallet-status').textContent=t;};
  let scope='all',period='all',tab='coins',limit=25,epoch=0,controller,data=null,detailEpoch=0,detailController,stops=[],detailStops=[],returnFocus;
  let selectedWallets=[],managedEpoch=0,sharedCoinOpened=false;
  const stopImages=()=>{stops.forEach(f=>f());stops=[];};
  const loadImages=(element,list)=>{
    const images=element.querySelectorAll('[data-earnings-image]');
    const start=img=>list.push(root.SlimeLaunchPad.loadCoinImage(img,JSON.parse(img.dataset.earningsImage),{mint:img.dataset.imageMint}));
    if(!root.IntersectionObserver){images.forEach(start);return;}
    // Observe the visible avatar wrapper, not its initially hidden image.
    const visibleObserver=new root.IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){visibleObserver.unobserve(entry.target);const img=entry.target.querySelector('[data-earnings-image]');if(img)start(img);}}),{rootMargin:'240px'});
    images.forEach(img=>visibleObserver.observe(img.parentElement));list.push(()=>visibleObserver.disconnect());
  };
  const options=()=>({tab,limit,search:$('earnings-search').value,sort:$('earnings-sort').value,role:scope==='mine'?$('earnings-role').value:'all'});
  function paint(){
    if(!data)return;stopImages();
    $('earnings-summary').innerHTML=summaryHtml(data);$('earnings-content').innerHTML=listHtml(data,options());loadImages($('earnings-content'),stops);
  }
  function syncControls(){
    document.querySelectorAll('[data-earn-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.earnScope===scope)));
    document.querySelectorAll('[data-earn-period]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.earnPeriod===period)));
    document.querySelectorAll('[data-earn-tab]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.earnTab===tab)));
    $('earnings-role').hidden=scope!=='mine';$('earnings-sort').hidden=tab==='payments';
    $('earnings-wallet-open').textContent=selectedWallets.length?selectedWallets.length+' wallet'+(selectedWallets.length===1?'':'s')+' selected':'Choose wallets';
  }
  function openWallets(){returnFocus=document.activeElement;$('earnings-wallet-dialog').showModal();$('earnings-wallets').focus();}
  async function read(){
    const id=++epoch;controller?.abort();controller=new AbortController();const active=controller,timer=setTimeout(()=>active.abort(),12000);
    data=null;stopImages();syncControls();$('earnings-content').innerHTML='';$('earnings-summary').setAttribute('aria-busy','true');
    if(scope==='mine'&&!selectedWallets.length){clearTimeout(timer);$('earnings-summary').innerHTML='<div class="earn-empty"><h3>Your earnings, together.</h3><p>Choose your SlimeWire wallets, a connected wallet, or paste public addresses.</p><button type="button" class="button button-primary" data-pick-wallets>Choose wallets ↗</button></div>';$('earnings-summary').setAttribute('aria-busy','false');status('No wallet connection or signature is required to view earnings.');return;}
    $('earnings-summary').innerHTML='<div class="earn-loading">Loading verified records…</div>';status('Reading saved payments…');
    try{
      const q=new URLSearchParams({scope,period});if(scope==='mine')selectedWallets.forEach(w=>q.append('wallet',w));
      const r=await fetch(API+'/api/web/launch/earnings?'+q,{signal:active.signal,cache:'no-store',credentials:'omit'}),d=await r.json();
      if(!r.ok||!d.ok)throw Error(d.error||'Earnings could not be loaded.');if(id!==epoch)return;
      data=d.earnings;paint();status((scope==='all'?'All recorded SlimeWire launches':selectedWallets.length+' selected wallet'+(selectedWallets.length===1?'':'s'))+' · Updated '+new Date(d.earnings.asOf||Date.now()).toLocaleTimeString());
      const mint=new URLSearchParams(location.search).get('coin');if(mint&&!sharedCoinOpened&&!$('earnings-detail').open){const c=data.coins.find(c=>c.mint===mint);if(c){sharedCoinOpened=true;showCoin(c.mint);}}
    }catch(e){if(id===epoch){$('earnings-summary').innerHTML='<div class="earn-empty"><h3>Records are temporarily unavailable.</h3><p>Nothing has been submitted. Tap Refresh to retry.</p></div>';status(e.name==='AbortError'?'Loading timed out. Please refresh.':e.message);}}
    finally{clearTimeout(timer);if(id===epoch)$('earnings-summary').setAttribute('aria-busy','false');}
  }
  async function showCoin(mint){
    const c=data?.coins.find(c=>c.mint===mint);if(!c)return;
    const dialog=$('earnings-detail');if(!dialog.open){returnFocus=document.activeElement;dialog.showModal();}
    const id=++detailEpoch;detailController?.abort();detailController=new AbortController();const active=detailController,timer=setTimeout(()=>active.abort(),10000);
    const render=r=>{detailStops.forEach(f=>f());detailStops=[];$('earnings-detail-body').innerHTML=detailHtml(c,r,period);loadImages($('earnings-detail-body'),detailStops);};
    render(null);dialog.querySelector('[data-close]').focus();
    try{const response=await fetch(API+'/api/web/launch/rewards?mint='+encodeURIComponent(mint),{signal:active.signal,credentials:'omit'}),r=await response.json();if(!response.ok||!r.ok)throw Error(r.error||'Fee split could not be loaded.');if(id!==detailEpoch||!dialog.open)return;render(r.report);}
    catch(e){if(id===detailEpoch&&dialog.open){$('earnings-detail-status').textContent='Fee split unavailable. '+(e.name==='AbortError'?'Request timed out.':e.message);const b=document.createElement('button');b.type='button';b.className='text-button';b.textContent='Retry fee split';b.onclick=()=>showCoin(mint);$('earnings-detail-status').appendChild(b);}}
    finally{clearTimeout(timer);}
  }
  function applyWallets(){
    const wallets=[...new Set($('earnings-wallets').value.trim().split(/[\s,]+/).filter(Boolean))];
    if(!wallets.length||wallets.length>25||wallets.some(w=>!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w))){walletStatus('Enter 1–25 full Solana wallet addresses, separated by lines or commas.');return;}
    selectedWallets=wallets;scope='mine';limit=25;walletStatus('');$('earnings-wallet-dialog').close();read();
  }
  $('earnings-form').onsubmit=e=>{e.preventDefault();applyWallets();};
  $('earnings-wallet-open').onclick=openWallets;$('earnings-refresh').onclick=read;
  $('earnings-search').oninput=()=>{limit=25;paint();};$('earnings-sort').onchange=()=>{limit=25;paint();};$('earnings-role').onchange=()=>{limit=25;paint();};
  document.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.close){$(b.dataset.close).close();return;}
    if(b.hasAttribute('data-pick-wallets')){openWallets();return;}
    if(b.dataset.earnScope){scope=b.dataset.earnScope;limit=25;read();return;}
    if(b.dataset.earnPeriod){period=b.dataset.earnPeriod;limit=25;read();return;}
    if(b.dataset.earnTab){tab=b.dataset.earnTab;limit=25;syncControls();paint();return;}
    if(b.hasAttribute('data-earn-more')){limit+=25;paint();return;}
    if(b.dataset.earnCoin){showCoin(b.dataset.earnCoin);return;}
    if(b.dataset.detailTab){$('earnings-detail').querySelectorAll('[data-detail-tab]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));$('earnings-detail').querySelectorAll('[data-detail-panel]').forEach(x=>x.hidden=x.dataset.detailPanel!==b.dataset.detailTab);return;}
    if(b.dataset.shareEarnings){const link='https://slimewire.org/launch/earnings?coin='+encodeURIComponent(b.dataset.shareEarnings);try{await navigator.clipboard.writeText(link);$('earnings-detail-status').textContent='Coin earnings link copied.';}catch{$('earnings-detail-status').textContent=link;}}
  });
  for(const id of ['earnings-wallet-dialog','earnings-detail']){
    const d=$(id);d.addEventListener('close',()=>{if(id==='earnings-detail'){++detailEpoch;detailController?.abort();detailStops.forEach(f=>f());detailStops=[];}else ++managedEpoch;returnFocus?.focus?.();});
    d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});
  }
  $('earnings-connected').onclick=()=>{const wallet=root.solana?.publicKey?.toString?.()||root.phantom?.solana?.publicKey?.toString?.();if(!wallet){walletStatus('No browser wallet is connected. Paste its public address—no connection is required.');return;}$('earnings-wallets').value=wallet;applyWallets();};
  $('earnings-clear').onclick=()=>{++managedEpoch;selectedWallets=[];$('earnings-wallets').value='';$('earnings-wallet-choices').innerHTML='';walletStatus('Cleared. No wallet list is stored in this browser.');if(scope==='mine')read();else syncControls();};
  $('earnings-managed').onclick=async()=>{
    const button=$('earnings-managed'),id=++managedEpoch;button.disabled=true;let auth='';try{auth=localStorage.getItem('ogreWebToken')||'';}catch{}
    try{
      if(!auth)throw Error('Sign in through Wallet, then return here. You can also paste public addresses without signing in.');
      const r=await fetch(API+'/api/web/community/dashboard',{headers:{Authorization:'Bearer '+auth},cache:'no-store',signal:AbortSignal.timeout(12000)}),d=await r.json();if(id!==managedEpoch)return;if(!r.ok||!d.ok)throw Error('Reconnect through Wallet, then retry.');
      const wallets=(d.wallets||[]).slice(0,25);if(!wallets.length)throw Error('No managed wallets found for this account.');
      $('earnings-wallet-choices').innerHTML='<p class="form-note">Choose the wallets to include:</p>'+wallets.map(w=>'<label class="earnings-wallet-choice"><input type="checkbox" value="'+esc(w.publicKey)+'" checked><span>'+esc(w.label||'Wallet')+' · '+esc(short(w.publicKey))+'</span></label>').join('')+'<button type="button" class="button button-outline" id="earnings-use-selected">Show selected wallets</button>';
      $('earnings-use-selected').onclick=()=>{$('earnings-wallets').value=[...$('earnings-wallet-choices').querySelectorAll('input:checked')].map(x=>x.value).join('\n');applyWallets();};walletStatus('Choose which wallets to include.');
    }catch(e){if(id===managedEpoch)walletStatus(e.name==='TimeoutError'?'Wallet list timed out. Try again.':e.message);}finally{button.disabled=false;}
  };
  read();
})(window);
