(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clean = (value, max = 100) => String(value || '').trim().slice(0, max);
  const isMint = value => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) || /^0x[\da-f]{40}$/i.test(value);
  function safeImage(value) {
    try { const raw = clean(value, 2048).replace(/^ipfs:\/\/(?:ipfs\/)?/i, 'https://pump.mypinata.cloud/ipfs/'); const u = new URL(raw); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function imageCandidates(value) {
    const raw = safeImage(value); if (!raw) return [];
    const url = new URL(raw), path = url.pathname.match(/^\/ipfs\/((?:Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})(?:\/[^?#]*)?)$/);
    // The CID identifies the exact same uploaded artwork on each gateway. No
    // ticker search, generated substitute, wallet preload or paid RPC lookup.
    return path ? [...new Set(['https://pump.mypinata.cloud/ipfs/' + path[1], 'https://gateway.pinata.cloud/ipfs/' + path[1], raw])] : [raw];
  }
  function loadCoinImage(img, sources, { schedule = setTimeout, cancel = clearTimeout } = {}) {
    let index = 0, timer, finished = false;
    const stop = () => { finished = true; cancel(timer); img.onload = null; img.onerror = null; };
    const next = () => {
      if (finished) return;
      cancel(timer);
      if (index >= sources.length) { stop(); img.remove(); return; }
      img.src = sources[index++];
      timer = schedule(next, 4500);
    };
    img.hidden = true;
    img.onload = () => { if (img.naturalWidth > 0) { img.hidden = false; stop(); } else next(); };
    img.onerror = next;
    next();
    return stop;
  }
  function coinModel(row) {
    const mint = clean(row?.mint, 64); if (!isMint(mint)) return null;
    return { mint, name: clean(row.name, 64) || clean(row.symbol, 16) || mint.slice(0, 5) + '…' + mint.slice(-4), symbol: clean(row.symbol, 16),
      description: clean(row.description, 180), imageUrl: safeImage(row.imageUrl) || safeImage(row.imageUri), createdAt: clean(row.createdAt, 40),
      chain: /^0x/i.test(mint) ? 'Robinhood' : 'Solana', status: clean(row.status, 40) || 'COMPLETE', origin: row.origin === 'connected' ? 'connected' : 'launched',
      rewardMode: row.rewardMode || (['alliance','holder_alliance'].includes(row.launchUtility?.mode) ? row.launchUtility.mode : row.launchUtility ? 'external' : row.pumpCashback ? 'cashback' : row.holderRewards?.enabled ? 'holders' : 'creator') };
  }
  function chartUrl(mint) { return isMint(mint) ? 'https://dexscreener.com/' + (/^0x/i.test(mint) ? 'robinhood/' : 'solana/') + encodeURIComponent(mint) : ''; }
  function walletCoinUrl(mint) { return isMint(mint) ? '/wallet?ca=' + encodeURIComponent(mint) : '/wallet'; }
  function searchQuery(value) {
    const raw = clean(value, 2048);
    let candidate = raw;
    try {
      const u = new URL(raw), host = u.hostname.toLowerCase().replace(/^www\./, '');
      if (u.protocol !== 'https:' || u.username || u.password) candidate = '';
      else if (host === 'pump.fun' && /^\/coin\/[^/]+\/?$/.test(u.pathname)) candidate = decodeURIComponent(u.pathname.split('/')[2]);
      else if (host === 'slimewire.org') candidate = u.searchParams.get('ca') || u.searchParams.get('token') || u.searchParams.get('rewards') || (u.hash.match(/^#(?:rhtrade|trade)\/([^/?#]+)$/) || [])[1] || '';
      else candidate = ''; // Dex links may identify a pool: never guess a token from one.
    } catch { /* A name, ticker or raw contract is not a URL. */ }
    return { raw, mint: isMint(candidate) ? candidate : '', text: raw.replace(/^\$/, '').toLowerCase() };
  }
  function filterLaunches(coins, value = '', route = 'all') {
    const q = searchQuery(value);
    return coins.filter(c => (route === 'all' || (route === 'community' ? ['holder_alliance','holders','alliance'].includes(c.rewardMode) : c.rewardMode === 'creator')) &&
      (!q.raw || (q.mint ? (/^0x/i.test(q.mint) ? c.mint.toLowerCase() === q.mint.toLowerCase() : c.mint === q.mint) : [c.name,c.symbol].some(v => v.toLowerCase().includes(q.text)) || c.mint.includes(q.raw))))
      .sort((a,b) => (Date.parse(b.createdAt)||0) - (Date.parse(a.createdAt)||0));
  }
  function draftUrl(draft) {
    const q = new URLSearchParams({ from: 'fun', lc_n: clean(draft.name, 32), lc_s: clean(draft.symbol, 10), lc_d: clean(draft.description, 800) });
    if (['alliance','holder_alliance','holder_self'].includes(draft.mode)) q.set('lc_utility', draft.mode);
    // Draft-only handoff to the existing reviewed launcher. No wallet, funds,
    // consent, fee recipient or execution identifier can be set by this page.
    return '/?' + q.toString() + '#launch';
  }
  function dateLabel(value) { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'; }
  const rewardLabels = { creator: 'Keep my fees', cashback: 'Cash back', holders: 'Legacy holder rewards', holder_alliance: 'Community rewards', alliance: 'Treasury wallet split', external: 'External fee route' };
  function templateDraft(value={}) { return {name:clean(value.name,32),symbol:clean(value.symbol,10).replace(/[^a-z\d]/gi,''),description:clean(value.description,800),mode:['creator','holder_self','holder_alliance','alliance'].includes(value.mode)?value.mode:'creator'}; }
  function cardHtml(coin) {
    const symbol = coin.symbol ? '$' + coin.symbol : 'Ticker unavailable';
    const status = coin.status === 'COMPLETE' ? coin.chain.toUpperCase() : coin.status.replace(/_/g, ' ');
    const sources = imageCandidates(coin.imageUrl);
    return '<article class="coin-card"><div class="coin-top"><div class="coin-avatar"><span class="coin-initial" aria-hidden="true">' + esc((coin.symbol || coin.name).slice(0, 2).toUpperCase()) + '</span>' + (sources.length ? '<img data-image-sources="' + esc(JSON.stringify(sources)) + '" alt="" hidden decoding="async" referrerpolicy="no-referrer">' : '') + '</div><span class="small-tag">' + esc(status) + '</span></div>' +
      '<h3 class="coin-title" title="' + esc(coin.name) + '">' + esc(coin.name) + '</h3><p class="coin-symbol">' + esc(symbol) + ' / ' + esc(coin.chain) + '</p>' +
      (coin.description ? '<p class="coin-description">' + esc(coin.description) + '</p>' : '') +
      '<div class="coin-meta"><span>Creator fees</span><strong>' + esc(rewardLabels[coin.rewardMode] || 'Not recorded') + '</strong></div><div class="coin-meta"><span>' + (coin.origin === 'connected' ? 'Connected' : 'Launched') + '</span><strong>' + esc(dateLabel(coin.createdAt)) + '</strong></div><div class="coin-actions"><a href="' + chartUrl(coin.mint) + '" target="_blank" rel="noopener noreferrer">Chart ↗</a><button class="copy-ca" type="button" data-copy="' + esc(coin.mint) + '" aria-label="Copy ' + esc(coin.name) + ' contract address">' + esc(coin.mint.slice(0, 4) + '…' + coin.mint.slice(-4)) + ' ⧉</button></div></article>';
  }
  root.SlimeLaunchPad = { esc, safeImage, imageCandidates, loadCoinImage, isMint, coinModel, chartUrl, walletCoinUrl, searchQuery, filterLaunches, draftUrl, cardHtml, templateDraft };
  if (!root.document?.getElementById('launch-dialog')) return;
  const $ = id => document.getElementById(id), dialog = $('launch-dialog');
  const API = String(root.OGRE_PORTAL_CONFIG?.apiBase || '').trim().replace(/\/+$/, '');
  let view = location.hash === '#mine' ? 'mine' : 'explore', rows = [], limit = 6, requestId = 0, controller, routeFilter = 'all', loaded = false, updatedAt = '';
  let imageObserver, imageStops = [];
  function stopImages() { imageObserver?.disconnect(); imageObserver = null; imageStops.forEach(stop => stop()); imageStops = []; }
  function startImages() {
    const start = img => imageStops.push(loadCoinImage(img, JSON.parse(img.dataset.imageSources)));
    // Observe the avatar shell (the image is hidden until decoded). Off-screen
    // cards don't download or consume their timeout before the user reaches them.
    if (root.IntersectionObserver) imageObserver = new root.IntersectionObserver((entries, observer) => {
      entries.filter(entry => entry.isIntersecting && entry.target.isConnected).forEach(entry => { observer.unobserve(entry.target); const img = entry.target.querySelector('img'); if (img) start(img); });
    }, { rootMargin: '200px' });
    $('coin-grid').querySelectorAll('img[data-image-sources]').forEach(img => imageObserver ? imageObserver.observe(img.parentElement) : start(img));
  }
  let previousFocus;
  const draft = { name: '', symbol: '', description: '', mode: 'creator' };
  function openDialog(title, content) {
    if (!dialog.open) previousFocus = document.activeElement;
    $('dialog-body').innerHTML = '<h2 class="dialog-title" id="dialog-title">' + esc(title) + '</h2>' + content;
    if (!dialog.open) dialog.showModal();
    $('close-dialog').focus();
  }
  dialog.addEventListener('close', () => previousFocus?.focus?.());
  $('close-dialog').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  const launchLink = '<a class="button button-primary" href="/?from=fun#launch">Open launch workspace <span class="arrow">↗</span></a>';
  function routeDialog(route) {
    const routes = {
      wallet: ['Wallet rewards', 'Available in launch setup', 'Choose your managed creator wallet when launching. Creator fees accrue to that wallet unless you deliberately choose a different reward mode. Review wallet-wide balances and claim from the Wallet app. Manual recipient splits remain in the existing launch workspace; this page does not silently assign a new fee wallet.'],
      alliance: ['Community Alliance', 'Permanent on-chain split', 'Give a community a direct share of your coin’s creator fees. Choose its SOL wallet and percentage; your creator wallet keeps the remainder. Review both recipients, then launch. Fees accrue in a per-coin Pump sharing account, with manual or daily distributions and transaction receipts. This is a wallet split—not individual-holder rewards, stock exposure or an endorsement.'],
      holder_alliance: ['Three shares. Two communities.', 'Holder Alliance · automatic every 12 hours', 'Choose a share for yourself, your new coin’s holders and another Solana community’s holders. Each community’s pool is split proportionally among wallets holding strictly over $20 of its token. Complete finalized snapshots and verified Pump-curve or indexed USD pricing are required; no partial lists. Small rewards accumulate. Review the permanent percentages, managed vault and network costs in launch setup.'],
      project: ['Projects & communities', 'Wallet route available', 'Create a coin for your project and choose its creator wallet. You can include project socials and add an optional NFT collection. Verified project profiles and multi-platform identity payments are not enabled yet.']
    };
    const r = routes[route] || routes.wallet;
    openDialog(r[0], '<span class="dialog-status">' + esc(r[1]) + '</span><p class="dialog-copy">' + esc(r[2]) + '</p>' + (route === 'alliance' ? '<ol class="reward-steps"><li><span>01</span><div><b>Choose your community</b><small>Name + community-controlled SOL wallet</small></div></li><li><span>02</span><div><b>Review the permanent split</b><small>Verify the full address and both percentages</small></div></li><li><span>03</span><div><b>Launch & track distributions</b><small>Same-coin recovery and on-chain receipts</small></div></li></ol><p class="dialog-copy">Distributions need at least 0.001 SOL accrued. The creator wallet pays network costs, capped at 0.0001 SOL per distribution, and keeps a 0.003 SOL account-rent reserve.</p>' : '') + '<div class="dialog-actions">' + (route === 'holder_alliance' ? '<button type="button" class="button button-primary" data-start-holders>Set up three shares ↗</button>' : route === 'alliance' ? '<button type="button" class="button button-primary" data-start-alliance>Start an Alliance ↗</button>' : launchLink) + '</div>');
  }
  function recipientsDialog() {
    openDialog('Your fees. Your choice.', '<p class="dialog-copy">Choose who benefits from your creator fees—not every trading fee. All new rewards are in SOL. You approve exact percentages and costs before launch.</p><div class="route-list">' + [['creator','Keep my fees','Keep 100% of creator fees. Claim when you want.','01'],['holder_self','Reward my community','You + your coin’s eligible holders. Twice daily.','02'],['holder_alliance','Reward two communities','You + your holders + another coin’s holders.','03']].map(r=>'<button type="button" class="route-option" data-start-mode="'+r[0]+'"><span><b>'+r[1]+'</b><small>'+r[2]+'</small></span><em>'+r[3]+' ↗</em></button>').join('')+'</div><p class="dialog-copy">Holder rewards use a complete snapshot: strictly over $20, proportional to eligible token balances. Small rewards accumulate; unavailable data can delay payouts. Community names are not verified endorsements.</p><details><summary>Advanced · community treasury wallet</summary><p class="dialog-copy">Pay a community-controlled wallet instead of individual holders. Manual or daily distribution; separate from the twice-daily holder program.</p><button class="button button-outline" type="button" data-start-mode="alliance">Set up a wallet split ↗</button></details>');
  }
  function paymentsDialog() {
    openDialog('Rewards. With receipts.', '<p class="dialog-copy">On any coin below, open <b>Rewards &amp; receipts</b> for confirmed holder payouts, reserved rewards, the next snapshot and your eligibility at the last completed snapshot.</p><div class="route-list"><a class="route-option" href="/wallet"><span><b>Claim my creator fees</b><small>Standard Pump claims are wallet-wide and can include multiple coins.</small></span><em>WALLET ↗</em></a><a class="route-option" href="/?from=fun#launch"><span><b>Manage my rewards program</b><small>Pause, resume or retry payouts from Your launches. Reserved rewards remain owed.</small></span><em>MANAGE ↗</em></a></div><p class="dialog-copy">Only finalized holder transactions count as paid. Snapshot delays and small balances are shown honestly—no estimated returns.</p>');
  }
  function createDialog() {
    openDialog('Make it yours.', '<ol class="launch-progress" aria-label="Launch steps"><li>01 Coin</li><li>02 Fees</li><li>03 Pair</li><li>04 Review</li></ol><form class="create-form" id="create-form"><div class="form-row"><div><label for="coin-name">Coin name</label><input id="coin-name" name="name" maxlength="32" required placeholder="Your next idea" autocomplete="off" value="' + esc(draft.name) + '"></div><div><label for="coin-ticker">Ticker</label><input id="coin-ticker" name="symbol" minlength="2" maxlength="10" pattern="[A-Za-z0-9]+" required placeholder="TICKER" autocomplete="off" value="' + esc(draft.symbol) + '"></div></div><label for="coin-description">Description <span>· optional</span></label><textarea id="coin-description" name="description" maxlength="800" placeholder="What is this coin about?">' + esc(draft.description) + '</textarea><label for="coin-launch-mode">Who receives your creator fees?</label><select id="coin-launch-mode">'+[['creator','Keep my fees · claim when I want'],['holder_self','Reward my community · me + my holders'],['holder_alliance','Reward two communities · me + both communities'],['alliance','Advanced · community treasury wallet']].map(([value,label])=>'<option value="'+value+'" '+(draft.mode===value?'selected':'')+'>'+label+'</option>').join('')+'</select><div class="pair-summary"><span>TRADING PAIR</span><b>SOL</b><p>Fees and rewards are paid in SOL. Selecting another community does not change the pair or convert rewards to its token.</p></div><p class="form-note"><strong>Nothing launches yet.</strong> Next, add artwork, set exact percentages, choose your wallet and optional bundles, then review the permanent choices and full costs.</p><div class="dialog-actions"><button type="submit" class="button button-primary">Continue to full review ↗</button><button type="button" id="save-template" class="button button-outline">Save template</button><button type="button" id="load-template" class="text-button">Load saved</button><button type="button" id="remove-template" class="text-button">Delete saved</button></div><p id="template-status" class="form-note" role="status"></p></form>');
    $('create-form').addEventListener('input', () => { draft.name = $('coin-name').value; draft.symbol = $('coin-ticker').value; draft.description = $('coin-description').value; draft.mode = $('coin-launch-mode').value; });
    $('save-template').onclick=()=>{try{localStorage.setItem('slimeLaunchTemplateV1',JSON.stringify(templateDraft(draft)));$('template-status').textContent='Saved on this device. No wallet, approval or payment information is saved.';}catch{$('template-status').textContent='This browser could not save the template.';}};
    $('load-template').onclick=()=>{try{const saved=localStorage.getItem('slimeLaunchTemplateV1');if(!saved){$('template-status').textContent='No saved template on this device.';return;}Object.assign(draft,templateDraft(JSON.parse(saved)));createDialog();$('template-status').textContent='Template loaded. Recipients and costs still require a new review.';}catch{$('template-status').textContent='Saved template could not be read.';}};
    $('remove-template').onclick=()=>{try{localStorage.removeItem('slimeLaunchTemplateV1');$('template-status').textContent='Saved template deleted. Your current draft is unchanged.';}catch{$('template-status').textContent='Could not remove the saved template.';}};
    $('create-form').addEventListener('submit', event => { event.preventDefault(); if (!draft.name.trim() || !draft.symbol.trim()) return; location.assign(draftUrl(draft)); });
  }
  let rewardsRequest=0;
  async function rewardsDialog(mint,wallet=''){
    if(!isMint(mint))return;
    const id=++rewardsRequest;
    openDialog('Rewards & receipts','<p class="dialog-copy" role="status">Loading confirmed records…</p>');
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
    try{
      const response=await fetch(API+'/api/web/launch/rewards?mint='+encodeURIComponent(mint)+(wallet?'&wallet='+encodeURIComponent(wallet):''),{signal:controller.signal,credentials:'omit',cache:wallet?'no-store':'default'});
      const data=await response.json();if(!response.ok||!data.ok)throw Error(data.error||'Rewards are temporarily unavailable.');
      if(id!==rewardsRequest||!dialog.open)return;
      const r=data.report,sol=value=>(Number(value||0)/1e9).toLocaleString(undefined,{maximumFractionDigits:9});
      const holder=r.mode==='holder_alliance';
      const stats=holder?'<div class="reward-totals"><div><small>Confirmed paid</small><b>'+sol(r.paidLamports)+' SOL</b></div><div><small>Reserved · not yet paid</small><b>'+sol(r.owedLamports)+' SOL</b></div><div><small>Allocated to holders</small><b>'+sol(r.allocatedLamports)+' SOL</b></div></div><p class="dialog-copy">'+esc(r.creatorShareBps/100)+'% creator · '+esc(r.ownHolderShareBps/100)+'% own holders'+(r.partnerHolderShareBps?' · '+esc(r.partnerHolderShareBps/100)+'% '+esc(r.partnerName):'')+'<br><b>'+(r.automatic?'Automatic · twice daily':'Automatic payouts paused')+'</b><br>'+(r.nextSnapshotAt?'Next snapshot due: '+esc(new Date(r.nextSnapshotAt).toLocaleString()):'First snapshot: waiting for funds and complete data.')+(r.delayed?'<br>Delayed: rewards remain reserved. The creator can check recovery in Your launches.':'')+'</p><p class="dialog-copy">Last eligible counts: '+(r.lastSnapshot?.own?esc(r.lastSnapshot.own.count)+' own holders':'own snapshot pending')+(r.partnerHolderShareBps?' · '+(r.lastSnapshot?.partner?esc(r.lastSnapshot.partner.count):'pending')+' partner holders':'')+'. '+esc(r.affiliation)+'</p>':'<p class="dialog-copy">'+esc(r.note)+'</p><a class="button button-primary" href="/wallet">Open wallet & claim ↗</a>';
      const labels={eligible:'Eligible at last snapshot',not_eligible:'Not eligible at last snapshot',not_selected:'Not part of this rewards program',unknown:'No verified snapshot yet'};
      const eligibility=data.eligibility?'<div class="pair-summary"><b>'+esc(labels[data.eligibility.own])+'</b>'+(r.partnerHolderShareBps?'<p>Other community: '+esc(labels[data.eligibility.partner])+'</p>':'')+'<p>Your reserved rewards: '+sol(data.eligibility.owedLamports)+' SOL</p><p>'+esc(data.eligibility.note)+'</p>'+(data.eligibility.asOf?'<small>As of '+esc(new Date(data.eligibility.asOf).toLocaleString())+'</small>':'')+'</div>':'';
      openDialog((r.symbol?'$'+r.symbol:'Coin')+' · rewards',stats+(holder?'<form class="create-form" id="eligibility-form"><label for="holder-wallet">Check your wallet · read only</label><input id="holder-wallet" maxlength="44" autocomplete="off" placeholder="Paste your Solana wallet" value="'+esc(wallet)+'"><div class="dialog-actions"><button type="submit" class="button button-outline">Check last snapshot</button><button type="button" id="use-connected-wallet" class="text-button">Use connected wallet</button></div><p id="eligibility-note" class="form-note" role="status">No signature or payment required. Eligibility refreshes at each payout snapshot, not continuously.</p></form>'+eligibility+'<details class="receipt-list"><summary>'+esc(r.receiptCount)+' confirmed payout batches</summary>'+(r.receipts||[]).slice().reverse().map(tx=>'<p>'+esc(new Date(tx.confirmedAt).toLocaleString())+' · '+sol(tx.lamports)+' SOL · '+esc(tx.recipients)+' wallets <a href="https://solscan.io/tx/'+encodeURIComponent(tx.signature)+'" target="_blank" rel="noopener noreferrer">Receipt ↗</a></p>').join('')+'</details><p class="dialog-copy">'+esc(r.note)+'</p>':'')+'<div class="dialog-actions"><a class="button button-outline" href="'+chartUrl(mint)+'" target="_blank" rel="noopener noreferrer">DexScreener ↗</a><button type="button" class="text-button" id="share-rewards">Copy rewards link</button><button type="button" class="text-button" id="refresh-rewards">Refresh</button></div><p id="share-status" class="form-note" role="status"></p>');
      if(holder){$('eligibility-form').onsubmit=e=>{e.preventDefault();const value=$('holder-wallet').value.trim();if(!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)){$('eligibility-note').textContent='Enter a valid Solana wallet address.';return;}rewardsDialog(mint,value);};$('use-connected-wallet').onclick=()=>{const key=root.solana?.publicKey?.toString?.()||root.phantom?.solana?.publicKey?.toString?.();if(key)rewardsDialog(mint,key);else $('eligibility-note').textContent='No browser wallet is connected here. Paste your public wallet address to check without connecting.';};}
      const communityLink=document.createElement('a');communityLink.className='button button-outline';communityLink.href=r.agreementId?'/launch/community?agreement='+encodeURIComponent(r.agreementId)+'#partners':'/launch/community#inbox';communityLink.textContent=r.agreementId?'View verified creator agreement ↗':'Open community rewards inbox ↗';$('dialog-body').appendChild(communityLink);
      $('refresh-rewards').onclick=()=>rewardsDialog(mint,wallet);
      $('share-rewards').onclick=async()=>{const link='https://slimewire.org/launch?rewards='+encodeURIComponent(mint);try{await navigator.clipboard.writeText(link);$('share-status').textContent='Rewards link copied. Share it with your community.';}catch{$('share-status').textContent=link;}};
    }catch(error){if(id===rewardsRequest&&dialog.open)openDialog('Rewards unavailable','<p class="dialog-copy">'+esc(error.name==='AbortError'?'Loading timed out. Please retry.':error.message)+'</p><button class="button button-outline" type="button" data-rewards="'+esc(mint)+'">Retry</button>');}
    finally{clearTimeout(timer);}
  }
  function featureDialog(key) {
    const features = {
      rewards: ['Reward options', 'Keep creator rewards, configure SlimeWire holder rewards, or choose a Community Alliance wallet split in NFT & Fees. These are separate alternatives—not overlapping promises for the same fees. Review permanent choices before launch. Existing Cashback coins retain their claims; new Cashback creation is unavailable.'],
      bundle: ['Launch together.', 'Choose managed wallets and amounts, then add participant invites where needed. The existing launcher shows which buys can be bundled and which run after confirmation. A participant must approve their own entry; no purchase happens from this page.'],
      nft: ['A coin. A collection.', 'Add an optional Metaplex Core collection under NFT & Fees in launch setup. Your creator wallet controls it. A collection does not automatically redirect creator fees or buy NFTs. Marketplace indexing is not guaranteed.']
    };
    const f = features[key]; if (!f) return;
    openDialog(f[0], '<p class="dialog-copy">' + esc(f[1]) + '</p><div class="dialog-actions">' + launchLink + '</div>');
  }
  function empty(title, copy, action = '') { return '<div class="empty-panel"><h3>' + esc(title) + '</h3><p>' + esc(copy) + '</p>' + action + '</div>'; }
  function paint() {
    stopImages();
    const q = searchQuery($('launch-search').value);
    const filtered = filterLaunches(rows, q.raw, routeFilter);
    const missing = q.raw || routeFilter !== 'all';
    const actions = missing ? '<button class="button button-outline" type="button" data-reset-directory>Clear filters</button>' + (q.mint ? '<a class="button button-primary" href="'+walletCoinUrl(q.mint)+'">Open this coin in Wallet ↗</a>' : '<a class="text-link" href="/wallet">Looking for any coin? Open Wallet ↗</a>') : '<button class="button button-primary" type="button" data-dialog="create">Create a coin ↗</button>';
    $('coin-grid').innerHTML = filtered.length ? filtered.slice(0, limit).map(cardHtml).join('') : empty(missing ? 'No matching SlimeWire launches.' : view === 'mine' ? 'Your next idea starts here.' : 'The next launch could be yours.', missing ? (q.mint ? 'This address is not in the current launch results. It may be an older launch, outside SlimeWire, or excluded by the selected filter. Wallet can open the coin without placing a trade.' : 'This is a directory of recent SlimeWire launches, not a search across every coin. Try its name, $ticker or exact token address, or clear the selected filter.') : 'Completed launches appear here once they are recorded. No demo coins or estimated earnings are shown.', actions);
    $('launch-status').textContent = filtered.length + ' of ' + rows.length + (view === 'mine' ? ' recorded launches' : ' recent launches') + (updatedAt ? ' · Updated '+updatedAt : '');
    $('clear-search').hidden = !q.raw;
    document.querySelectorAll('[data-launch-filter]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.launchFilter === routeFilter)));
    $('show-more').hidden = filtered.length <= limit;
    $('coin-grid').querySelectorAll('.coin-card').forEach((card,i)=>{ const coin=filtered[i]; if(!coin)return;const action=document.createElement('button');action.type='button';action.className='reward-detail-button';action.dataset.rewards=coin.mint;action.textContent='Rewards & receipts ↗';card.appendChild(action); });
    startImages();
  }
  async function load() {
    stopImages();
    const id = ++requestId; controller?.abort(); controller = new AbortController();
    const thisController = controller, signal = thisController.signal, timer = setTimeout(() => thisController.abort(), 12000);
    const mine = view === 'mine'; rows = []; loaded = false; $('coin-grid').innerHTML = ''; $('show-more').hidden = true;
    $('coin-grid').setAttribute('aria-busy', 'true'); $('refresh-launches').disabled = true;
    $('launch-status').textContent = 'Loading ' + (mine ? 'your launches' : 'launches') + '…';
    $('launches-title').textContent = mine ? 'My launches' : 'Explore launches';
    $('directory-kicker').textContent = mine ? 'YOUR IDEAS. YOUR LAUNCHES.' : 'MADE HERE. GOING PLACES.';
    $('directory-description').textContent = mine ? 'Your recorded launches. Review each fee route and its receipts.' : 'Recent SlimeWire launches. See who receives the creator fees, then open the payout records. Listing is not an endorsement.';
    document.querySelectorAll('[data-view]').forEach(el => { if (el.dataset.view === view) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    try {
      let token = ''; if (mine) { try { token = localStorage.getItem('ogreWebToken') || ''; } catch { /* privacy mode */ } }
      if (mine && !token) { $('launch-status').textContent = ''; $('coin-grid').innerHTML = empty('Connect your SlimeWire account.', 'Open the launch workspace on this site to connect or restore your account, then return here to see your launches.', launchLink); return; }
      const r = await fetch(API + (mine ? '/api/web/launches' : '/api/web/launch/directory'), { signal, credentials: 'omit', cache: mine ? 'no-store' : 'default', headers: mine ? { Authorization: 'Bearer ' + token } : {} });
      if (mine && [401, 403].includes(r.status)) throw new Error('Reconnect your account in the launch workspace to load your launches.');
      if (!r.ok) throw new Error('Launches could not be loaded. Tap Refresh to try again.');
      const data = await r.json();
      if (!data?.ok || !Array.isArray(mine ? data.coins : data.launches)) throw new Error('Launch data is temporarily unavailable. Please retry.');
      if (id !== requestId) return;
      rows = (mine ? data.coins : data.launches).map(coinModel).filter(Boolean); loaded = true; updatedAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); paint();
    } catch (error) {
      if (id !== requestId) return;
      $('launch-status').textContent = error.name === 'AbortError' ? 'Loading took too long. Tap Refresh to try again.' : error.message;
      $('coin-grid').innerHTML = empty('Your launchpad is still ready.', 'The directory is temporarily unavailable. You can open the launch workspace or manage your wallet while we reconnect.', launchLink);
    } finally { clearTimeout(timer); if (id === requestId) { $('coin-grid').setAttribute('aria-busy', 'false'); $('refresh-launches').disabled = false; } }
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('button,a'); if (!button) return;
    if (button.hasAttribute('data-start-alliance')) { draft.mode = 'alliance'; createDialog(); }
    if (button.hasAttribute('data-start-holders')) { draft.mode = 'holder_alliance'; createDialog(); }
    if (button.dataset.dialog) ({ create: createDialog, recipients: recipientsDialog, payments: paymentsDialog }[button.dataset.dialog])?.();
    if (button.dataset.route) routeDialog(button.dataset.route);
    if (button.dataset.feature) featureDialog(button.dataset.feature);
    if (button.dataset.copy) {
      try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = 'Copied ✓'; setTimeout(() => { if (button.isConnected) button.textContent = button.dataset.copy.slice(0, 4) + '…' + button.dataset.copy.slice(-4) + ' ⧉'; }, 1500); }
      catch { openDialog('Copy contract address', '<p class="dialog-copy">Select and copy the address below.</p><div class="create-form"><label for="copy-address">Contract address</label><input readonly id="copy-address" value="' + esc(button.dataset.copy) + '"></div>'); $('copy-address').select(); }
    }
    if(button.dataset.rewards) rewardsDialog(button.dataset.rewards);
    if(button.dataset.startMode){draft.mode=button.dataset.startMode;createDialog();}
    if(button.dataset.launchFilter){routeFilter=button.dataset.launchFilter;limit=6;if(loaded)paint();}
    if(button.hasAttribute('data-reset-directory')){routeFilter='all';$('launch-search').value='';limit=6;if(loaded)paint();}
  });
  $('launch-search').addEventListener('input', () => { limit = 6; if (loaded) paint(); });
  $('clear-search').addEventListener('click', () => { $('launch-search').value='';limit=6;if(loaded)paint();$('launch-search').focus(); });
  $('show-more').addEventListener('click', () => { limit += 6; paint(); });
  $('refresh-launches').addEventListener('click', load);
  root.addEventListener('hashchange', () => { const next = location.hash === '#mine' ? 'mine' : 'explore'; if (next !== view) { view = next; limit = 6; routeFilter='all'; $('launch-search').value = ''; load(); } });
  root.addEventListener('storage', event => { if (view === 'mine' && (event.key === 'ogreWebToken' || event.key === null)) load(); });
  // No background polling, wallet preloading, or automatic financial actions.
  load();
  const sharedRewards=new URLSearchParams(root.location?.search||'').get('rewards');if(isMint(sharedRewards))rewardsDialog(sharedRewards);
})(window);
