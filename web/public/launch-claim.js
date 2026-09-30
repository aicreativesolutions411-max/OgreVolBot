(function(){
  'use strict';
  const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sol=v=>{const n=BigInt(v||0),f=String(n%1000000000n).padStart(9,'0').replace(/0+$/,'');return (n/1000000000n).toLocaleString()+(f?'.'+f:'')+' SOL';};
  let state,review,busy=false;
  async function api(action,body){const r=await fetch('/api/web/social-claims/'+action,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json','X-Slime-CSRF':state?.session?.csrf||''}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(body?90000:12000)});const d=await r.json();if(!r.ok||!d.ok)throw Error(d.error||'Could not reach claims. Please refresh.');return d;}
  const note=(id,message,bad=false)=>{$(id).textContent=message;$(id).classList.toggle('claim-error',bad);};
  async function refresh(){
    $('claim-refresh').disabled=true;
    try{
      state=await api('dashboard');const cap=state.capabilities||{};
      $('claim-availability').textContent=cap.available?'X allocations are claimed as SOL on SlimeWire. Review each receiving address.':cap.reason||'X claims are not available on this deployment.';
      $('claim-signin').hidden=state.loggedIn;$('claim-logout').hidden=!state.loggedIn;$('claim-session').hidden=!state.loggedIn;
      $('claim-signin').disabled=!cap.identityConfigured;$('claim-signin').textContent=cap.identityConfigured?'Continue with X →':'X sign-in · setup pending';
      $('claim-signin').onclick=()=>{if(cap.loginUrl){const u=new URL(cap.loginUrl);if(u.protocol==='https:'&&['slimewire.org','app.slimewire.org'].includes(u.hostname))location.assign(u.href);}};
      if(!state.loggedIn)return;
      $('claim-account').textContent='Signed in as @'+state.session.handle+' · '+state.session.name;
      $('claim-reserved').textContent=sol(state.reservedLamports);$('claim-paid').textContent=sol(state.paidLamports);$('claim-pending').textContent=sol(state.pendingLamports);
      const chosen=$('claim-wallet-choice').value;
      $('claim-wallet-choice').innerHTML='<option value="external">Paste a Solana wallet</option>'+(state.wallets||[]).map(w=>'<option value="'+esc(w.publicKey)+'">'+esc(w.label)+' · '+esc(w.publicKey.slice(0,5))+'…'+esc(w.publicKey.slice(-5))+'</option>').join('');
      if((state.wallets||[]).some(w=>w.publicKey===chosen))$('claim-wallet-choice').value=chosen;
      $('claim-coins').innerHTML=state.coins.length?state.coins.map(c=>`<article class="claim-coin"><div class="claim-coin-top"><div><h3>${esc(c.symbol?'$'+c.symbol:c.name||'Coin allocation')}</h3><small>${esc(c.name)} · ${esc(c.shareBps/100)}% of creator fees</small></div><button type="button" class="button button-primary" data-claim="${esc(c.id)}" ${!cap.available||!c.active||c.paused||c.pending||BigInt(c.reservedLamports)<1000000n?'disabled':''}>${c.pending?'Confirming…':'Review claim →'}</button></div><div class="claim-amount">${esc(sol(c.reservedLamports))} <small>reserved</small></div><p>Received ${esc(sol(c.paidLamports))} · <a href="/launch?rewards=${encodeURIComponent(c.mint)}">Coin fee history ↗</a></p>${c.pending?`<p>Pending ${esc(sol(c.pending.lamports))} to ${esc(c.pending.wallet)}. <a href="https://solscan.io/tx/${encodeURIComponent(c.pending.signature)}" target="_blank" rel="noopener noreferrer">Track transaction ↗</a></p>`:''}${c.error?'<p>'+esc(c.error)+'</p>':''}${c.paused?'<p>New claims are paused for this coin. Allocated fees remain reserved.</p>':''}<details><summary>Recent finalized claims</summary>${c.receipts.length?c.receipts.map(r=>`<p>${esc(sol(r.lamports))} · ${esc(new Date(r.confirmedAt).toLocaleString())}<br>${esc(r.wallet)} · <a href="https://solscan.io/tx/${encodeURIComponent(r.signature)}" target="_blank" rel="noopener noreferrer">Receipt ↗</a></p>`).join(''):'<p>No finalized claims yet.</p>'}</details></article>`).join(''):'<div class="claim-empty">No coin allocations for this X account yet. When a launcher assigns your verified account a fee share, it will appear here. Changing your handle does not transfer your fees.</div>';
    }catch(e){note('claim-status',e.message,true);}finally{$('claim-refresh').disabled=false;}
  }
  $('claim-wallet-choice').onchange=()=>{const v=$('claim-wallet-choice').value;$('claim-address').readOnly=v!=='external';$('claim-address').value=v==='external'?'':v;};
  $('claim-refresh').onclick=refresh;
  $('claim-logout').onclick=async()=>{try{await api('logout',{});location.reload();}catch(e){note('claim-status',e.message,true);}};
  $('claim-coins').onclick=async e=>{const b=e.target.closest('[data-claim]');if(!b||busy||b.disabled)return;busy=true;b.disabled=true;note('claim-status','Checking the exact balance and receiving address…');
    try{const d=await api('review',{attemptId:b.dataset.claim,wallet:$('claim-address').value.trim()});review=d.review;$('claim-ack').checked=false;$('claim-confirm').disabled=true;$('claim-confirm').textContent='Confirm claim';$('claim-review-body').innerHTML='<p>Claiming as <b>@'+esc(state.session.handle)+'</b></p><strong>'+esc(sol(review.lamports))+'</strong><p>Solana receiving wallet</p><code>'+esc(review.wallet)+'</code><p>Coin: '+esc(review.mint)+'</p><p>The coin’s creator funds the network fee. This only claims allocated rewards; it does not access other funds in your wallet.</p>';note('claim-review-status','');$('claim-review').showModal();note('claim-status','');}catch(err){note('claim-status',err.message,true);}finally{busy=false;await refresh();}};
  $('claim-close').onclick=()=>{if(!busy)$('claim-review').close();};
  $('claim-review').addEventListener('cancel',e=>{if(busy)e.preventDefault();});
  $('claim-ack').onchange=()=>{$('claim-confirm').disabled=!$('claim-ack').checked||busy;};
  $('claim-confirm').onclick=async()=>{if(busy||!review||!$('claim-ack').checked)return;busy=true;$('claim-confirm').disabled=true;note('claim-review-status','Submitting this reviewed claim. Please wait for confirmation…');
    try{await api('claim',{ticket:review.ticket,acknowledge:true});$('claim-review').close();note('claim-status','Claim status updated. Only finalized transactions count as received.');review=null;}catch(e){note('claim-review-status',e.message+' Refresh your allocations before trying again.',true);review=null;}finally{busy=false;$('claim-confirm').disabled=true;await refresh();}};
  if(new URLSearchParams(location.search).has('signin')){note('claim-status','X sign-in did not complete. Start again with Continue with X. If setup is pending, no claim has been made.',true);history.replaceState(null,'',location.pathname);}
  refresh();
})();
