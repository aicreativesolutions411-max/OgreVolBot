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
      chain: /^0x/i.test(mint) ? 'Robinhood' : 'Solana', status: clean(row.status, 40) || 'COMPLETE',
      rewardMode: row.rewardMode || (row.launchUtility?.mode === 'alliance' ? 'alliance' : row.launchUtility ? 'external' : row.pumpCashback ? 'cashback' : row.holderRewards?.enabled ? 'holders' : 'creator') };
  }
  function chartUrl(mint) { return isMint(mint) ? '/t?ca=' + encodeURIComponent(mint) : ''; }
  function draftUrl(draft) {
    const q = new URLSearchParams({ from: 'fun', lc_n: clean(draft.name, 32), lc_s: clean(draft.symbol, 10), lc_d: clean(draft.description, 800) });
    if (draft.mode === 'alliance') q.set('lc_utility', 'alliance');
    // Draft-only handoff to the existing reviewed launcher. No wallet, funds,
    // consent, fee recipient or execution identifier can be set by this page.
    return '/?' + q.toString() + '#launch';
  }
  function dateLabel(value) { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'; }
  const rewardLabels = { creator: 'Creator wallet', cashback: 'Cash back', holders: 'Holder rewards', alliance: 'Community Alliance', external: 'External fee route' };
  function cardHtml(coin) {
    const symbol = coin.symbol ? '$' + coin.symbol : 'Ticker unavailable';
    const status = coin.status === 'COMPLETE' ? coin.chain.toUpperCase() : coin.status.replace(/_/g, ' ');
    const sources = imageCandidates(coin.imageUrl);
    return '<article class="coin-card"><div class="coin-top"><div class="coin-avatar"><span class="coin-initial" aria-hidden="true">' + esc((coin.symbol || coin.name).slice(0, 2).toUpperCase()) + '</span>' + (sources.length ? '<img data-image-sources="' + esc(JSON.stringify(sources)) + '" alt="" hidden decoding="async" referrerpolicy="no-referrer">' : '') + '</div><span class="small-tag">' + esc(status) + '</span></div><h3 class="coin-title" title="' + esc(coin.name) + '">' + esc(coin.name) + '</h3><p class="coin-symbol">' + esc(symbol) + ' / ' + esc(coin.chain) + '</p><p class="coin-description">' + esc(coin.description || 'Launched through SlimeWire. Open the chart to research this coin.') + '</p><div class="coin-meta"><span>Reward route</span><strong>' + esc(rewardLabels[coin.rewardMode] || 'Not recorded') + '</strong></div><div class="coin-meta"><span>Launched</span><strong>' + esc(dateLabel(coin.createdAt)) + '</strong></div><div class="coin-actions"><a href="' + chartUrl(coin.mint) + '">View chart ↗</a><button class="copy-ca" type="button" data-copy="' + esc(coin.mint) + '" aria-label="Copy ' + esc(coin.name) + ' contract address">' + esc(coin.mint.slice(0, 4) + '…' + coin.mint.slice(-4)) + ' ⧉</button></div></article>';
  }
  root.SlimeLaunchPad = { esc, safeImage, imageCandidates, loadCoinImage, isMint, coinModel, chartUrl, draftUrl, cardHtml };
  if (!root.document?.getElementById('launch-dialog')) return;
  const $ = id => document.getElementById(id), dialog = $('launch-dialog');
  const API = String(root.OGRE_PORTAL_CONFIG?.apiBase || '').trim().replace(/\/+$/, '');
  let view = location.hash === '#mine' ? 'mine' : 'explore', rows = [], limit = 6, requestId = 0, controller;
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
      project: ['Projects & communities', 'Wallet route available', 'Create a coin for your project and choose its creator wallet. You can include project socials and add an optional NFT collection. Verified project profiles and multi-platform identity payments are not enabled yet.']
    };
    const r = routes[route] || routes.wallet;
    openDialog(r[0], '<span class="dialog-status">' + esc(r[1]) + '</span><p class="dialog-copy">' + esc(r[2]) + '</p>' + (route === 'alliance' ? '<ol class="reward-steps"><li><span>01</span><div><b>Choose your community</b><small>Name + community-controlled SOL wallet</small></div></li><li><span>02</span><div><b>Review the permanent split</b><small>Verify the full address and both percentages</small></div></li><li><span>03</span><div><b>Launch & track distributions</b><small>Same-coin recovery and on-chain receipts</small></div></li></ol><p class="dialog-copy">Distributions need at least 0.001 SOL accrued. The creator wallet pays network costs, capped at 0.0001 SOL per distribution, and keeps a 0.003 SOL account-rent reserve.</p>' : '') + '<div class="dialog-actions">' + (route === 'alliance' ? '<button type="button" class="button button-primary" data-start-alliance>Start an Alliance ↗</button>' : launchLink) + '</div>');
  }
  function recipientsDialog() {
    openDialog('Choose where it goes.', '<p class="dialog-copy">Only supported launch paths are offered. Review recipients and costs before signing.</p><div class="route-list">' + [['wallet', 'Creator wallet', 'SOL creator rewards in your selected wallet', 'SOLO'], ['alliance', 'Community Alliance', 'Permanent creator + community wallet split', 'TOGETHER'], ['project', 'Projects', 'Launch with your project’s creator wallet', 'PROJECT']].map(r => '<button class="route-option" type="button" data-route="' + r[0] + '"><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span><em>' + r[3] + ' ↗</em></button>').join('') + '</div>');
  }
  function paymentsDialog() {
    openDialog('Fees. Not guesswork.', '<p class="dialog-copy">Standard Pump claims can cover multiple coins; they remain wallet-wide. Alliance distributions use the coin’s own sharing account and show confirmed transaction receipts. We do not invent per-coin dollar earnings.</p><div class="route-list"><a class="route-option" href="/wallet"><span><b>SOL creator rewards</b><small>Balances, claims and receipts in your wallet.</small></span><em>OPEN ↗</em></a><a class="route-option" href="/?from=fun#launch"><span><b>Alliance distributions</b><small>Open Your launches to distribute or check receipts.</small></span><em>MANAGE ↗</em></a></div>');
  }
  function createDialog() {
    openDialog('Make it yours.', '<p class="dialog-copy">Give your coin an identity. Next, add artwork, choose your wallet and review rewards, bundles and launch costs.</p><form class="create-form" id="create-form"><div class="form-row"><div><label for="coin-name">Coin name</label><input id="coin-name" name="name" maxlength="32" required placeholder="Your next idea" autocomplete="off" value="' + esc(draft.name) + '"></div><div><label for="coin-ticker">Ticker</label><input id="coin-ticker" name="symbol" minlength="2" maxlength="10" pattern="[A-Za-z0-9]+" required placeholder="TICKER" autocomplete="off" value="' + esc(draft.symbol) + '"></div></div><label for="coin-description">Description <span>· optional</span></label><textarea id="coin-description" name="description" maxlength="800" placeholder="What is this coin about?">' + esc(draft.description) + '</textarea><p class="form-note"><strong>Nothing launches on this step.</strong> The next screen uses your existing SlimeWire launch setup. You will review all costs, recipients and irreversible choices before confirming.</p><button type="submit" class="button button-primary">Continue to launch setup <span class="arrow" aria-hidden="true">↗</span></button></form>');
    $('create-form').querySelector('.form-note').insertAdjacentHTML('beforebegin', '<label for="coin-launch-mode">Launch path</label><select id="coin-launch-mode"><option value="creator" '+(draft.mode === 'creator' ? 'selected' : '')+'>Standard · creator / holder rewards</option><option value="alliance" '+(draft.mode === 'alliance' ? 'selected' : '')+'>Community Alliance · creator + community wallet</option></select><p class="dialog-copy">The next screen collects and reviews the community wallet and split. No recipient or payment is pre-approved here.</p>');
    $('create-form').addEventListener('input', () => { draft.name = $('coin-name').value; draft.symbol = $('coin-ticker').value; draft.description = $('coin-description').value; draft.mode = $('coin-launch-mode').value; });
    $('create-form').addEventListener('submit', event => { event.preventDefault(); if (!draft.name.trim() || !draft.symbol.trim()) return; location.assign(draftUrl(draft)); });
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
    const q = $('launch-search').value.trim().toLowerCase();
    const filtered = rows.filter(c => [c.name, c.symbol, c.mint].some(v => v.toLowerCase().includes(q)));
    $('coin-grid').innerHTML = filtered.length ? filtered.slice(0, limit).map(cardHtml).join('') : empty(q ? 'No matching launches.' : view === 'mine' ? 'Your next idea starts here.' : 'The next launch could be yours.', q ? 'Try another name, ticker or contract address. This directory only lists SlimeWire launches.' : 'Completed launches appear here once they are recorded. No demo coins or estimated earnings are shown.', '<button class="button button-primary" type="button" data-dialog="create">Create a coin ↗</button>');
    $('show-more').hidden = filtered.length <= limit;
    startImages();
  }
  async function load() {
    stopImages();
    const id = ++requestId; controller?.abort(); controller = new AbortController();
    const thisController = controller, signal = thisController.signal, timer = setTimeout(() => thisController.abort(), 12000);
    const mine = view === 'mine'; rows = []; $('coin-grid').innerHTML = ''; $('show-more').hidden = true;
    $('coin-grid').setAttribute('aria-busy', 'true'); $('refresh-launches').disabled = true;
    $('launch-status').textContent = 'Loading ' + (mine ? 'your launches' : 'launches') + '…';
    $('launches-title').textContent = mine ? 'My launches' : 'Explore launches';
    $('directory-kicker').textContent = mine ? 'YOUR IDEAS. YOUR LAUNCHES.' : 'MADE HERE. GOING PLACES.';
    $('directory-description').textContent = mine ? 'Your recorded launches. Rewards remain in the receiving wallet.' : 'Real Solana coins launched through SlimeWire. Listing is not an endorsement.';
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
      rows = (mine ? data.coins : data.launches).map(coinModel).filter(Boolean); paint();
      $('launch-status').textContent = rows.length ? rows.length + (rows.length === 1 ? ' launch' : ' launches') + ' · Updated ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    } catch (error) {
      if (id !== requestId) return;
      $('launch-status').textContent = error.name === 'AbortError' ? 'Loading took too long. Tap Refresh to try again.' : error.message;
      $('coin-grid').innerHTML = empty('Your launchpad is still ready.', 'The directory is temporarily unavailable. You can open the launch workspace or manage your wallet while we reconnect.', launchLink);
    } finally { clearTimeout(timer); if (id === requestId) { $('coin-grid').setAttribute('aria-busy', 'false'); $('refresh-launches').disabled = false; } }
  }
  document.addEventListener('click', async event => {
    const button = event.target.closest('button,a'); if (!button) return;
    if (button.hasAttribute('data-start-alliance')) { draft.mode = 'alliance'; createDialog(); }
    if (button.dataset.dialog) ({ create: createDialog, recipients: recipientsDialog, payments: paymentsDialog }[button.dataset.dialog])?.();
    if (button.dataset.route) routeDialog(button.dataset.route);
    if (button.dataset.feature) featureDialog(button.dataset.feature);
    if (button.dataset.copy) {
      try { await navigator.clipboard.writeText(button.dataset.copy); button.textContent = 'Copied ✓'; setTimeout(() => { if (button.isConnected) button.textContent = button.dataset.copy.slice(0, 4) + '…' + button.dataset.copy.slice(-4) + ' ⧉'; }, 1500); }
      catch { openDialog('Copy contract address', '<p class="dialog-copy">Select and copy the address below.</p><div class="create-form"><label for="copy-address">Contract address</label><input readonly id="copy-address" value="' + esc(button.dataset.copy) + '"></div>'); $('copy-address').select(); }
    }
  });
  $('launch-search').addEventListener('input', () => { limit = 6; if (rows.length) paint(); });
  $('show-more').addEventListener('click', () => { limit += 6; paint(); });
  $('refresh-launches').addEventListener('click', load);
  root.addEventListener('hashchange', () => { const next = location.hash === '#mine' ? 'mine' : 'explore'; if (next !== view) { view = next; limit = 6; $('launch-search').value = ''; load(); } });
  root.addEventListener('storage', event => { if (view === 'mine' && (event.key === 'ogreWebToken' || event.key === null)) load(); });
  // No background polling, wallet preloading, or automatic financial actions.
  load();
})(window);
