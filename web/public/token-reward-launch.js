(function(root){
  'use strict';
  const $=id=>document.getElementById(id);if(!root.document||!$('reward-connect'))return;
  const base=String(root.OGRE_PORTAL_CONFIG?.apiBase||'').replace(/\/+$/,''),prefix=base+'/api/web/token-rewards/';
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const b64=bytes=>btoa(Array.from(bytes,n=>String.fromCharCode(n)).join('')),bytes=v=>Uint8Array.from(atob(v),c=>c.charCodeAt(0));
  const amount=(raw,decimals)=>{const s=String(raw||'0').padStart(decimals+1,'0');return decimals?(s.slice(0,-decimals)+'.'+s.slice(-decimals)).replace(/\.?0+$/,''):s;};
  let provider,wallet='',token='',row,busy=false,poll,epoch=0;
  const say=v=>{$('reward-live-status').textContent=v;};
  async function api(action,body){const response=await fetch(prefix+action,{method:body?'POST':'GET',headers:{Accept:'application/json',...(body?{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})}:{})},credentials:'omit',cache:'no-store',body:body?JSON.stringify({...body,wallet}):undefined});let data;try{data=await response.json();}catch{throw Error('Status could not be loaded. If you signed, check My launches before retrying.');}if(!response.ok||!data.ok){if(response.status===401)token='';throw Error(data.error||'Launch service unavailable.');}return data.data;}
  async function ready(){try{const r=await api('readiness');$('reward-live-readiness').textContent=r.validationEnabled?'Transaction flow ready for approved validation wallets. General release still awaits receipt-based verification.':r.blockers.join(' ');}catch(e){$('reward-live-readiness').textContent=e.message;}}
  function reset(){epoch++;clearTimeout(poll);wallet='';token='';row=null;$('reward-connect').textContent='Connect wallet';$('reward-history').hidden=true;$('reward-launch-details').hidden=true;$('reward-launch-review').innerHTML='';$('reward-ledger').innerHTML='';$('reward-launch-history').innerHTML='';for(const b of $('reward-live-controls').querySelectorAll('button'))b.hidden=true;say('Wallet changed. Reconnect and use My launches to resume safely.');}
  async function connect(){
    provider=root.phantom?.solana||root.solflare||root.solana;
    if(!provider?.connect||!provider.signMessage||!provider.signTransaction)throw Error('Open this page in Phantom or Solflare, or use its browser extension. Never enter recovery words here.');
    await provider.connect();const address=provider.publicKey?.toString();if(!address)throw Error('The wallet did not return an address.');wallet=address;
    const challenge=await api('execution/challenge',{}),signed=await provider.signMessage(new TextEncoder().encode(challenge.message),'utf8');
    if(provider.publicKey?.toString()!==address)throw Error('Wallet changed during verification.');
    const verified=await api('execution/verify',{id:challenge.id,signature:b64(signed.signature||signed)});token=verified.token;
    provider.removeListener?.('accountChanged',reset);provider.on?.('accountChanged',reset);provider.removeListener?.('disconnect',reset);provider.on?.('disconnect',reset);
    $('reward-connect').textContent=wallet.slice(0,5)+'…'+wallet.slice(-5);$('reward-history').hidden=false;$('reward-launch-details').hidden=false;
    if($('reward-creator').value!==wallet){$('reward-creator').value=wallet;$('reward-creator').dispatchEvent(new Event('input',{bubbles:true}));}
    say('Wallet verified. Review the reward plan above, then prepare a transaction. Nothing has been spent.');
  }
  async function web3(){if(root.solanaWeb3)return;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/vendor/solana-web3.iife.min.js';s.onload=resolve;s.onerror=()=>reject(Error('Wallet library could not load.'));document.head.appendChild(s);});}
  async function prepare(){
    if(!token)await connect();const plan=root.SlimeTokenRewards?.currentPlan?.();if(!plan||plan.policy.creator!==wallet)throw Error('Review the reward plan above using this connected developer wallet first.');
    if(!$('reward-image-rights').checked||!$('reward-live-consent').checked)throw Error('Read and confirm the image rights and validation terms.');
    const file=$('reward-image').files[0];if(!file||file.size>3*1024*1024||!['image/png','image/jpeg','image/webp'].includes(file.type))throw Error('Choose a PNG, JPEG or WebP under 3 MB.');
    const imageData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(Error('Could not read image.'));r.readAsDataURL(file);});
    const p=plan.policy,input={name:plan.name,symbol:plan.symbol,creator:wallet,quoteMint:p.quoteMint,creatorShareBps:p.creatorShareBps,holderShareBps:p.holderShareBps,partnerShareBps:p.partnerShareBps,partnerMint:p.partnerMint,
      description:$('reward-description').value.trim(),imageData,imageRights:true,vaultBudgetLamports:Number($('reward-budget').value),consentVersion:p.consentVersion};
    const key='sw-reward-request:'+wallet,h=b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input)))));let saved;try{saved=JSON.parse(sessionStorage.getItem(key)||'null');}catch{}
    input.requestId=saved?.hash===h?saved.id:crypto.randomUUID();try{sessionStorage.setItem(key,JSON.stringify({hash:h,id:input.requestId}));}catch{}
    say('Checking metadata, exact mint, launch costs and transaction simulation…');show(await api('execution/prepare',{input}));
  }
  function show(value){
    row=value;clearTimeout(poll);const r=row.review||{},active=row.status==='ACTIVE';
    $('reward-launch-details').hidden=Boolean(row)&&!['CANCELLED'].includes(row.status);
    $('reward-launch-review').innerHTML='<h3>'+esc(row.symbol)+' · '+esc(row.status.replace(/_/g,' '))+'</h3><dl><dt>Coin CA</dt><dd><code>'+esc(row.mint)+'</code></dd><dt>Pair / payout</dt><dd>'+esc(row.policy.asset.symbol)+'</dd><dt>Developer / holders / partner</dt><dd>'+row.policy.creatorShareBps/100+'% / '+row.policy.holderShareBps/100+'% / '+row.policy.partnerShareBps/100+'%</dd><dt>Network-budget wallet</dt><dd><code>'+esc(row.vault)+'</code></dd><dt>Network budget</dt><dd>'+esc(amount(row.vaultBudgetLamports,9))+' SOL</dd>'+(r.maxSolCostLamports!=null?'<dt>This step · upper estimate</dt><dd>'+esc(amount(r.maxSolCostLamports,9))+' SOL</dd>':'')+'</dl><p>'+esc(r.note||row.error||'')+'</p>'+row.receipts.map(x=>'<a target="_blank" rel="noopener noreferrer" href="https://solscan.io/tx/'+esc(x.signature)+'">'+esc(x.phase)+' receipt ↗</a>').join(' · ')+(row.signature?'<p><a target="_blank" rel="noopener noreferrer" href="https://solscan.io/tx/'+esc(row.signature)+'">Pending transaction ↗</a></p>':'');
    $('reward-sign').hidden=row.status!=='REVIEW'||Date.now()>=row.expiresAt;$('reward-sign').textContent=row.phase==='config'?'Sign step 1 · Configuration':'Sign step 2 · Launch coin';
    if(row.curve)$('reward-launch-review').insertAdjacentHTML('beforeend','<p><b>Fixed curve:</b> 1 billion tokens · 1% trading fee · 100% migrated LP permanently locked.<br>Graduation threshold: '+esc(amount(row.curve.migrationQuoteRaw,row.curve.quoteDecimals))+' '+esc(row.policy.asset.symbol)+'. The $69,000 estimate used '+esc(row.curve.quotePriceUsd)+' USD per quote token when this launch was prepared; it changes with the quote asset price.</p>');
    $('reward-resume').hidden=!['NEXT_STEP','FAILED'].includes(row.status)&&!(row.status==='REVIEW'&&Date.now()>=row.expiresAt);
    $('reward-launch-review').insertAdjacentHTML('beforeend','<p>Custom-pair graduation is not guaranteed to be automatic. If a keeper does not migrate this pool, a separate funded migration is required before DEX trading resumes. <a href="https://migrator.meteora.ag" target="_blank" rel="noopener noreferrer">Official migration tool ↗</a></p>');
    $('reward-refresh').hidden=row.status==='CANCELLED';$('reward-retry').hidden=row.status!=='SUBMITTED';$('reward-cancel').hidden=!(row.phase==='config'&&row.status==='REVIEW'&&!row.receipts.length);
    say(row.error||(active?'Coin finalized and its reward program is registered. Delivery status is shown below.':row.status==='SUBMITTED'?'Signed transaction saved. Awaiting finalization; do not create another launch.':row.status==='NEXT_STEP'?'Step 1 finalized. Continue to review the coin creation and network budget.':row.status==='REVIEW'?'Review the exact amount and wallet before signing. No transaction has been submitted for this step.':row.status));
    if(active)void ledger(row.mint).catch(e=>say(e.message));
    if(['SUBMITTED','ADOPTING'].includes(row.status)&&$('reward-dialog').open){const version=epoch;poll=setTimeout(()=>{if(version===epoch&&!busy)run(async()=>show(await api('execution/status',{id:row.id})));},5000);}
  }
  async function sign(){
    if(!row||row.status!=='REVIEW'||Date.now()>=row.expiresAt)throw Error('Resume this launch to refresh its review.');
    if(!provider||provider.publicKey?.toString()!==wallet){reset();throw Error('Wallet changed. Reconnect.');}await web3();
    const tx=root.solanaWeb3.Transaction.from(bytes(row.transaction));if(tx.feePayer?.toString()!==wallet)throw Error('Signing wallet mismatch.');
    const original=b64(tx.serializeMessage());say('Review this transaction in your wallet.');const signed=await provider.signTransaction(tx);
    if(provider.publicKey?.toString()!==wallet||b64(signed.serializeMessage())!==original)throw Error('The signed message changed. Submission stopped.');
    say('Submitting the saved launch transaction.');show(await api('execution/submit',{id:row.id,signedTransaction:b64(signed.serialize())}));
  }
  async function history(){if(!token)await connect();const rows=await api('execution/history',{});$('reward-launch-history').innerHTML=rows.length?rows.map(r=>'<button type="button" class="stonks-secondary" data-reward-launch-id="'+esc(r.id)+'">'+esc(r.symbol)+' · '+esc(r.status.replace(/_/g,' '))+'</button>').join(''):'<p>No native launches recorded for this wallet.</p>';}
  async function ledger(mint){const p=await api('program?mint='+encodeURIComponent(mint));if(row?.mint!==mint)return;$('reward-ledger').innerHTML='<h3>Realized fees · '+esc(p.asset.symbol)+'</h3><dl><dt>Collected</dt><dd>'+esc(amount(p.collectedRaw,p.asset.decimals))+'</dd><dt>Delivered</dt><dd>'+esc(amount(p.paidRaw,p.asset.decimals))+'</dd><dt>Reserved for recipients</dt><dd>'+esc(amount(p.pendingRaw,p.asset.decimals))+'</dd><dt>Status</dt><dd>'+esc(p.status.replace(/_/g,' '))+'</dd></dl><p>'+esc(p.error||'Payouts run on the server; you can close this page. Each paid amount below has a finalized receipt.')+'</p><button type="button" class="stonks-secondary" data-reward-pause="'+String(!p.paused)+'">'+(p.paused?'Resume payouts':'Pause new payouts')+'</button>'+p.receipts.map(r=>'<p><a href="'+esc(r.url)+'" target="_blank" rel="noopener noreferrer">'+esc(amount(r.amountRaw,p.asset.decimals))+' '+esc(p.asset.symbol)+' · receipt ↗</a></p>').join('');}
  async function run(fn){if(busy)return;busy=true;const buttons=document.querySelectorAll('.reward-execution button');buttons.forEach(b=>b.disabled=true);try{await fn();}catch(e){say(e.message||'Check My launches before retrying.');}finally{busy=false;document.querySelectorAll('.reward-execution button').forEach(b=>b.disabled=false);}}
  $('reward-connect').onclick=()=>run(connect);$('reward-history').onclick=()=>run(history);$('reward-prepare').onclick=()=>run(prepare);$('reward-sign').onclick=()=>run(sign);
  for(const action of ['resume','refresh','retry','cancel'])$('reward-'+action).onclick=()=>run(async()=>{if(row)show(await api('execution/'+(action==='refresh'?'status':action),{id:row.id}));});
  document.querySelector('.reward-execution').addEventListener('click',e=>{const b=e.target.closest('button');if(b?.dataset.rewardLaunchId)run(async()=>show(await api('execution/status',{id:b.dataset.rewardLaunchId})));if(b?.dataset.rewardPause&&row)run(async()=>{await api('execution/pause',{mint:row.mint,paused:b.dataset.rewardPause==='true'});await ledger(row.mint);});});
  root.addEventListener('slime-rewards-open',ready);$('reward-dialog').addEventListener('close',()=>{epoch++;clearTimeout(poll);});root.addEventListener('pagehide',()=>{epoch++;clearTimeout(poll);});
  if($('reward-dialog').open)void ready();
})(typeof window==='undefined'?globalThis:window);
