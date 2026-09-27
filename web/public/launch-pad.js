(function (root) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clean = (value, max = 100) => String(value || '').trim().slice(0, max);
  const isMint = value => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value) || /^0x[\da-f]{40}$/i.test(value);
  function safeImage(value) {
    try { const u = new URL(clean(value, 2048)); return u.protocol === 'https:' && !u.username && !u.password ? u.href : ''; } catch { return ''; }
  }
  function coinModel(row) {
    const mint = clean(row?.mint, 64); if (!isMint(mint)) return null;
    return { mint, name: clean(row.name, 64) || clean(row.symbol, 16) || mint.slice(0, 5) + '…' + mint.slice(-4), symbol: clean(row.symbol, 16),
      description: clean(row.description, 180), imageUrl: safeImage(row.imageUrl || row.imageUri), createdAt: clean(row.createdAt, 40),
      chain: /^0x/i.test(mint) ? 'Robinhood' : 'Solana', status: clean(row.status, 40) || 'COMPLETE',
      rewardMode: row.rewardMode || (row.launchUtility ? 'external' : row.pumpCashback ? 'cashback' : row.holderRewards?.enabled ? 'holders' : 'creator') };
  }
  function chartUrl(mint) { return isMint(mint) ? '/t?ca=' + encodeURIComponent(mint) : ''; }
  function draftUrl(draft) {
    const q = new URLSearchParams({ from: 'fun', lc_n: clean(draft.name, 64), lc_s: clean(draft.symbol, 12), lc_d: clean(draft.description, 800) });
    // Draft-only handoff to the existing reviewed launcher. No wallet, funds,
    // consent, fee recipient or execution identifier can be set by this page.
    return '/?' + q.toString() + '#launch';
  }
  function dateLabel(value) { const d = new Date(value); return Number.isFinite(d.getTime()) ? d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'; }
  const rewardLabels = { creator: 'Creator wallet', cashback: 'Cash back', holders: 'Holder rewards', external: 'External fee route' };
  function cardHtml(coin) {
    const symbol = coin.symbol ? '$' + coin.symbol : 'Ticker unavailable';
    const status = coin.status === 'COMPLETE' ? coin.chain.toUpperCase() : coin.status.replace(/_/g, ' ');
    return '<article class="coin-card"><div class="coin-top"><div class="coin-avatar"><span class="coin-initial" aria-hidden="true">' + esc((coin.symbol || coin.name).slice(0, 2).toUpperCase()) + '</span>' + (coin.imageUrl ? '<img src="' + esc(coin.imageUrl) + '" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer">' : '') + '</div><span class="small-tag">' + esc(status) + '</span></div><h3 class="coin-title" title="' + esc(coin.name) + '">' + esc(coin.name) + '</h3><p class="coin-symbol">' + esc(symbol) + ' / ' + esc(coin.chain) + '</p><p class="coin-description">' + esc(coin.description || 'Launched through SlimeWire. Open the chart to research this coin.') + '</p><div class="coin-meta"><span>Reward route</span><strong>' + esc(rewardLabels[coin.rewardMode] || 'Not recorded') + '</strong></div><div class="coin-meta"><span>Launched</span><strong>' + esc(dateLabel(coin.createdAt)) + '</strong></div><div class="coin-actions"><a href="' + chartUrl(coin.mint) + '">View chart ↗</a><button class="copy-ca" type="button" data-copy="' + esc(coin.mint) + '" aria-label="Copy ' + esc(coin.name) + ' contract address">' + esc(coin.mint.slice(0, 4) + '…' + coin.mint.slice(-4)) + ' ⧉</button></div></article>';
  }
  root.SlimeLaunchPad = { esc, safeImage, isMint, coinModel, chartUrl, draftUrl, cardHtml };
  if (!root.document?.getElementById('launch-dialog')) return;
  const $ = id => document.getElementById(id), dialog = $('launch-dialog');
  const API = String(root.OGRE_PORTAL_CONFIG?.apiBase || '').trim().replace(/\/+$/, '');
  let view = location.hash === '#mine' ? 'mine' : 'explore', rows = [], limit = 6, requestId = 0, controller;
  let previousFocus;
  const draft = { name: '', symbol: '', description: '' };
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
      x: ['X creator payouts', 'Provider paused', 'UsePaid currently reports that X Money payouts are paused. Its fee route is permanent and sends 100% of creator fees to the provider, not your creator wallet. On-chain routing is not proof that someone received cash. No X cash claim is offered here.'],
      business: ['Business recipients', 'Not enabled yet', 'The planned flow starts with a business profile and verifies who controls its payout destination. A Google listing alone is not payment authorization. Business search, ownership verification and cash payout providers still need to be connected.'],
      linkedin: ['LinkedIn recipients', 'Not enabled yet', 'The planned recipient flow will require identity verification and a supported payout account. Adding a profile link is not enough to pay that person, and does not make them an endorser of a token.'],
      telegram: ['Telegram recipients', 'Not enabled yet', 'Telegram-linked payout identities are planned. Today you can launch and manage wallets with the SlimeWire bot, but a Telegram handle is not yet an automatic cash or wallet payout destination.'],
      project: ['Projects & communities', 'Wallet route available', 'Create a coin for your project and choose its creator wallet. You can include project socials and add an optional NFT collection. Verified project profiles and multi-platform identity payments are not enabled yet.']
    };
    const r = routes[route] || routes.wallet, paused = route === 'x';
    openDialog(r[0], '<span class="dialog-status ' + (paused ? 'paused' : '') + '">' + esc(r[1]) + '</span><p class="dialog-copy">' + esc(r[2]) + '</p>' + (paused ? '<p class="dialog-copy">Status checked September 27, 2026. <a href="https://usepaid.app/docs" target="_blank" rel="noopener noreferrer">Check the provider’s latest update ↗</a></p>' : '') + '<div class="dialog-actions">' + (['wallet', 'project'].includes(route) ? launchLink : '<button type="button" class="button button-outline" data-route="wallet">View wallet rewards ↗</button>') + '</div>');
  }
  function recipientsDialog() {
    openDialog('Choose where it goes.', '<p class="dialog-copy">Start with a supported reward route. Other recipient types are visible here with their actual availability.</p><div class="route-list">' + [['wallet', 'Creator wallet', 'SOL creator rewards in your selected wallet', 'AVAILABLE'], ['x', 'X creators', 'Cash payouts through an external provider', 'PAUSED'], ['business', 'Google businesses', 'Verified business and payout destination', 'PLANNED'], ['linkedin', 'LinkedIn', 'Verified professional identity', 'PLANNED'], ['telegram', 'Telegram', 'Account-linked recipient payments', 'PLANNED'], ['project', 'Projects', 'Launch with your project’s creator wallet', 'WALLET ROUTE']].map(r => '<button class="route-option" type="button" data-route="' + r[0] + '"><span><b>' + r[1] + '</b><small>' + r[2] + '</small></span><em>' + r[3] + ' ↗</em></button>').join('') + '</div>');
  }
  function paymentsDialog() {
    openDialog('Fees. Not guesswork.', '<p class="dialog-copy">Creator rewards are shown in the receiving wallet. Pump claims can cover multiple coins, so this page does not invent per-coin earnings or combine them into an unsupported dollar total.</p><div class="route-list"><a class="route-option" href="/wallet"><span><b>SOL creator rewards</b><small>Open your wallet for balances, claims and receipts.</small></span><em>OPEN ↗</em></a><button class="route-option" data-route="x" type="button"><span><b>X Money / UsePaid</b><small>Provider payouts paused. No cash claim available here.</small></span><em>STATUS ↗</em></button></div><p class="dialog-copy">Cash payment integrations and custom quote pairs are not activated by this redesign. Existing fee assignments and recovery records are unchanged.</p>');
  }
  function createDialog() {
    openDialog('Make it yours.', '<p class="dialog-copy">Give your coin an identity. Next, add artwork, choose your wallet and review rewards, bundles and launch costs.</p><form class="create-form" id="create-form"><div class="form-row"><div><label for="coin-name">Coin name</label><input id="coin-name" name="name" maxlength="64" required placeholder="Your next idea" autocomplete="off" value="' + esc(draft.name) + '"></div><div><label for="coin-ticker">Ticker</label><input id="coin-ticker" name="symbol" maxlength="12" required placeholder="TICKER" autocomplete="off" value="' + esc(draft.symbol) + '"></div></div><label for="coin-description">Description <span>· optional</span></label><textarea id="coin-description" name="description" maxlength="800" placeholder="What is this coin about?">' + esc(draft.description) + '</textarea><p class="form-note"><strong>Nothing launches on this step.</strong> The next screen uses your existing SlimeWire launch setup. You will review all costs, recipients and irreversible choices before confirming.</p><button type="submit" class="button button-primary">Continue to launch setup <span class="arrow" aria-hidden="true">↗</span></button></form>');
    $('create-form').addEventListener('input', () => { draft.name = $('coin-name').value; draft.symbol = $('coin-ticker').value; draft.description = $('coin-description').value; });
    $('create-form').addEventListener('submit', event => { event.preventDefault(); if (!draft.name.trim() || !draft.symbol.trim()) return; location.assign(draftUrl(draft)); });
  }
  function featureDialog(key) {
    const features = {
      rewards: ['Reward options', 'Keep creator rewards, choose Pump Cash back, or configure supported holder rewards in launch setup. These modes have different ownership and claim rules. Permanent choices are explicitly reviewed before launch.'],
      bundle: ['Launch together.', 'Choose managed wallets and amounts, then add participant invites where needed. The existing launcher shows which buys can be bundled and which run after confirmation. A participant must approve their own entry; no purchase happens from this page.'],
      nft: ['A coin. A collection.', 'Add an optional Metaplex Core collection under NFT & Fees in launch setup. Your creator wallet controls it. A collection does not automatically redirect creator fees. NFT floor purchases are preview-only, and marketplace indexing is not guaranteed.']
    };
    const f = features[key]; if (!f) return;
    openDialog(f[0], '<p class="dialog-copy">' + esc(f[1]) + '</p><div class="dialog-actions">' + launchLink + '</div>');
  }
  function empty(title, copy, action = '') { return '<div class="empty-panel"><h3>' + esc(title) + '</h3><p>' + esc(copy) + '</p>' + action + '</div>'; }
  function paint() {
    const q = $('launch-search').value.trim().toLowerCase();
    const filtered = rows.filter(c => [c.name, c.symbol, c.mint].some(v => v.toLowerCase().includes(q)));
    $('coin-grid').innerHTML = filtered.length ? filtered.slice(0, limit).map(cardHtml).join('') : empty(q ? 'No matching launches.' : view === 'mine' ? 'Your next idea starts here.' : 'The next launch could be yours.', q ? 'Try another name, ticker or contract address. This directory only lists SlimeWire launches.' : 'Completed launches appear here once they are recorded. No demo coins or estimated earnings are shown.', '<button class="button button-primary" type="button" data-dialog="create">Create a coin ↗</button>');
    $('show-more').hidden = filtered.length <= limit;
    $('coin-grid').querySelectorAll('img').forEach(img => img.addEventListener('error', () => img.remove(), { once: true }));
  }
  async function load() {
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
