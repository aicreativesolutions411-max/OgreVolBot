(function(root){
  'use strict';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sol(value){if(value===null||value===undefined)return 'Not attributed';try{const n=BigInt(value),f=String(n%1000000000n).padStart(9,'0').replace(/0+$/,'');return String(n/1000000000n)+(f?'.'+f:'')+' SOL';}catch{return 'Not attributed';}}
  const short=v=>String(v||'').slice(0,5)+'…'+String(v||'').slice(-4);
  function earningsHtml(data){
    return `<div class="reward-totals earnings-totals"><div><small>Recorded paid · selected wallets</small><b>${esc(sol(data.paidLamports))}</b></div><div><small>Reserved rewards · not paid</small><b>${esc(sol(data.reservedLamports))}</b></div><div><small>Creator fees available to claim</small><b><a href="/wallet">Check in Wallet ↗</a></b></div></div>
      <p class="hub-note">${esc(data.note)}${data.incomplete?' Some coin histories are partial; the total above is a verified subtotal.':''}</p>
      <div class="earnings-coins">${(data.coins||[]).map(c=>{
        const sources=root.SlimeLaunchPad?.imageCandidates(c.imageUrl)||[];
        return `<article class="hub-panel earnings-coin"><header><div class="coin-avatar"><span class="coin-initial">${esc((c.symbol||c.name||'?').slice(0,2))}</span>${sources.length?`<img data-earnings-image="${esc(JSON.stringify(sources))}" alt="" hidden decoding="async" referrerpolicy="no-referrer">`:''}</div><div><h2>${esc(c.symbol?'$'+c.symbol:c.name||short(c.mint))}</h2><p>${esc(c.name||'')} · ${esc((c.roles||[]).join(' · '))}</p></div><span class="small-tag">${esc(c.paused?'PAUSED':c.delayed?'DELAYED':c.automatic?'12H REWARDS':'RECORDED')}</span></header>
          <div class="reward-totals"><div><small>Recorded paid to your wallets</small><b>${esc(sol(c.paidLamports))}</b></div><div><small>Reserved · not yet paid</small><b>${esc(sol(c.reservedLamports))}</b></div></div>
          ${c.partial?'<p class="form-note">Partial history. Unavailable older earnings are not estimated.</p>':''}
          ${c.automatic?`<p class="form-note">${c.nextSnapshotAt?'Next snapshot due '+esc(new Date(c.nextSnapshotAt).toLocaleString()):'Waiting for the first completed snapshot.'} · subject to funds, eligibility and complete data. Minimum payout 0.001 SOL; smaller rewards accumulate.</p>`:''}
          <details class="receipt-list"><summary>${esc(c.receipts?.length||0)} recent wallet-specific receipts</summary>${(c.receipts||[]).map(r=>`<p>${esc(sol(r.lamports))} · ${esc(r.kind)}<br>${esc(r.confirmedAt?new Date(r.confirmedAt).toLocaleString():'Date unavailable')} · <a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noopener noreferrer">Finalized receipt ↗</a></p>`).join('')||'<p>No retained wallet-specific receipt yet.</p>'}</details>
          <div class="hub-actions"><a class="button button-outline" href="/launch?rewards=${encodeURIComponent(c.mint)}">All fee destinations ↗</a><a class="text-button" href="/wallet?ca=${encodeURIComponent(c.mint)}">Open coin in Wallet ↗</a></div></article>`;
      }).join('')||'<div class="empty-panel"><h3>No recorded earnings yet.</h3><p>No matching creator program, saved eligibility, unpaid credit or retained receipt was found for these wallets. This does not mean the wallets have no tokens or funds.</p></div>'}</div>`;
  }
  root.SlimeEarnings={sol,earningsHtml};if(!root.document?.getElementById('earnings-content'))return;
  const $=id=>document.getElementById(id),API=String(root.OGRE_PORTAL_CONFIG?.apiBase||'').replace(/\/+$/,''),status=t=>{$('earnings-status').textContent=t;};
  let epoch=0,controller,stops=[];
  const stopImages=()=>{stops.forEach(f=>f());stops=[];};
  async function read(){
    const wallets=[...new Set($('earnings-wallets').value.trim().split(/[\s,]+/).filter(Boolean))];
    if(!wallets.length||wallets.length>25||wallets.some(w=>!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(w))){status('Enter 1–25 full Solana wallet addresses, separated by lines or commas.');return;}
    const id=++epoch;controller?.abort();controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);
    stopImages();$('earnings-content').innerHTML='';$('earnings-content').setAttribute('aria-busy','true');status('Reading saved, finalized records…');
    try{const q=new URLSearchParams();wallets.forEach(w=>q.append('wallet',w));const r=await fetch(API+'/api/web/launch/earnings?'+q,{signal:controller.signal,cache:'no-store',credentials:'omit'}),d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Earnings could not be loaded.');if(id!==epoch)return;
      $('earnings-content').innerHTML=earningsHtml(d.earnings);status(wallets.length+' wallet'+(wallets.length===1?'':'s')+' · updated '+new Date().toLocaleTimeString());
      $('earnings-content').querySelectorAll('[data-earnings-image]').forEach(img=>stops.push(root.SlimeLaunchPad.loadCoinImage(img,JSON.parse(img.dataset.earningsImage))));
    }catch(e){if(id===epoch)status(e.name==='AbortError'?'Loading timed out. Tap Show earnings to retry.':e.message);}finally{clearTimeout(timer);if(id===epoch)$('earnings-content').setAttribute('aria-busy','false');}
  }
  $('earnings-form').onsubmit=e=>{e.preventDefault();read();};
  $('earnings-connected').onclick=()=>{const wallet=root.solana?.publicKey?.toString?.()||root.phantom?.solana?.publicKey?.toString?.();if(!wallet){status('No browser wallet is connected. Paste its public address—no connection is required for this check.');return;}$('earnings-wallets').value=wallet;read();};
  $('earnings-clear').onclick=()=>{++epoch;controller?.abort();stopImages();$('earnings-wallets').value='';$('earnings-wallet-choices').innerHTML='';$('earnings-content').innerHTML='';$('earnings-content').setAttribute('aria-busy','false');status('Cleared. No wallet list is stored in this browser.');};
  $('earnings-managed').onclick=async()=>{
    const button=$('earnings-managed');button.disabled=true;let auth='';try{auth=localStorage.getItem('ogreWebToken')||'';}catch{}
    try{if(!auth)throw Error('Sign in through Wallet on this site, then return here. You can also paste public wallet addresses without signing in.');
      const r=await fetch(API+'/api/web/community/dashboard',{headers:{Authorization:'Bearer '+auth},cache:'no-store',signal:AbortSignal.timeout(12000)}),data=await r.json();if(!r.ok||!data.ok)throw Error('Reconnect through Wallet, then retry.');
      const wallets=(data.wallets||[]).slice(0,25);if(!wallets.length)throw Error('No managed wallets found for this account.');
      $('earnings-wallet-choices').innerHTML='<p class="form-note">Select the wallets to include:</p>'+wallets.map(w=>`<label class="earnings-wallet-choice"><input type="checkbox" value="${esc(w.publicKey)}" checked> <span>${esc(w.label||'Wallet')} · ${esc(short(w.publicKey))}</span></label>`).join('')+'<button type="button" class="button button-outline" id="earnings-use-selected">Show selected wallets</button>';
      $('earnings-use-selected').onclick=()=>{$('earnings-wallets').value=[...$('earnings-wallet-choices').querySelectorAll('input:checked')].map(el=>el.value).join('\n');read();};status('Choose which of your wallets to include.');
    }catch(e){status(e.name==='TimeoutError'?'Wallet list timed out. Try again.':e.message);}finally{button.disabled=false;}
  };
})(window);
