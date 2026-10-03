(function (root) {
  'use strict';
  // The public readiness GET follows the site's configured data origin. All
  // wallet/session and execution requests must still use the same-origin edge;
  // the general data API override cannot assert user geography.
  const $ = id => document.getElementById(id);
  const readOnlyApiBase = String(root.OGRE_PORTAL_CONFIG?.apiBase || '').replace(/\/+$/, '');
  let provider, wallet = '', token = '', consent, readiness, intent, request, lastFocus, busy = false;
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const b64 = bytes => btoa(Array.from(bytes, n => String.fromCharCode(n)).join(''));
  const bytes = value => Uint8Array.from(atob(value), c => c.charCodeAt(0));
  const rawAmount = (value, decimals) => { const s = String(value || '0').padStart(decimals + 1, '0'); return decimals ? (s.slice(0, -decimals) + '.' + s.slice(-decimals)).replace(/\.?0+$/, '') : s; };
  function message(text) { $('tx-status').textContent = text; }
  function resetWallet() { provider = undefined; wallet = ''; token = ''; intent = undefined; $('tx-connect').textContent = 'Connect wallet'; $('tx-sign').hidden = true; $('tx-history').hidden = true; message('Wallet disconnected or changed. Review again with the selected wallet.'); }
  async function api(action, body) {
    const apiBase = action === 'readiness' && !body ? readOnlyApiBase : '';
    const response = await fetch(apiBase + '/api/web/stonks/execution/' + action, body ? {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, credentials: 'omit', cache: 'no-store', body: JSON.stringify({ ...body, wallet: body.wallet || wallet, consent }),
    } : { credentials: 'omit', cache: 'no-store', headers: { Accept: 'application/json' } });
    let result; try { result = await response.json(); } catch { throw Error('Status could not be read. If you signed, check history before starting another transaction.'); }
    if (!response.ok || !result.ok) { if (response.status === 401) token = ''; throw Error(result.error || 'Transaction service unavailable.'); }
    return result.data;
  }
  function riskConsent() {
    consent = { eligible: $('tx-eligible').checked, adult: $('tx-adult').checked, sanctionsClear: $('tx-sanctions').checked, assetTermsAccepted: $('tx-risk').checked };
    if (Object.values(consent).some(v => v !== true)) throw Error('Read and confirm each eligibility statement first.');
  }
  async function loadWeb3() {
    if (root.solanaWeb3) return;
    await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = '/vendor/solana-web3.iife.min.js'; script.onload = resolve; script.onerror = () => reject(Error('Wallet signing library could not load.')); document.head.appendChild(script); });
  }
  async function connect() {
    riskConsent();
    // No automatic connection or signatures on page load.
    provider = root.phantom?.solana || root.solflare || root.solana;
    if (!provider?.connect || !provider.signMessage || !provider.signTransaction) throw Error('Open this page inside Phantom or Solflare, or enable its browser extension. Never enter a recovery phrase here.');
    await provider.connect(); wallet = provider.publicKey?.toString();
    if (!wallet) throw Error('The wallet did not return a public address.');
    const challenge = await api('challenge', { wallet });
    const signed = await provider.signMessage(new TextEncoder().encode(challenge.message), 'utf8');
    const verified = await api('verify', { wallet, id: challenge.id, signature: b64(signed.signature || signed) });
    if (provider.publicKey?.toString() !== wallet) { resetWallet(); throw Error('Wallet changed during verification.'); }
    token = verified.token; $('tx-connect').textContent = wallet.slice(0, 5) + '…' + wallet.slice(-5); $('tx-history').hidden = false;
    provider.removeListener?.('accountChanged', resetWallet); provider.on?.('accountChanged', resetWallet);
    provider.removeListener?.('disconnect', resetWallet); provider.on?.('disconnect', resetWallet);
    message('Connected. Nothing has been spent. Prepare a review to see the exact transaction.');
  }
  function showIntent(row) {
    intent = row; const r = row.review || {}, isLaunch = row.operation === 'launch';
    $('tx-review').innerHTML = '<h3>' + (isLaunch ? 'Launch review' : esc(row.operation === 'buy' ? 'Buy review' : 'Sell review')) + '</h3><dl>' +
      '<dt>Wallet</dt><dd class="stonks-wrap">' + esc(row.wallet) + '</dd><dt>Coin</dt><dd>' + esc(r.symbol || r.name || r.mint) + '</dd>' +
      (isLaunch ? '<dt>Model</dt><dd>' + esc(r.feeModel) + ' · ' + esc(r.transferFeeBps / 100) + '% transfer fee</dd><dt>Pairing</dt><dd>' + esc(r.quoteSymbol) + '</dd><dt>Developer buy</dt><dd>None</dd><dt>Creator fees</dt><dd>Automatic forwarding after indexing; verify actual receipts.</dd>' : '<dt>Maximum input</dt><dd>' + esc(rawAmount(r.inputRaw, r.inputDecimals)) + ' ' + esc(row.operation === 'buy' ? r.quoteSymbol : r.symbol) + '</dd><dt>Minimum received</dt><dd>' + esc(rawAmount(r.minOutputRaw, r.outputDecimals)) + ' ' + esc(row.operation === 'buy' ? r.symbol : r.quoteSymbol) + '</dd><dt>Slippage</dt><dd>' + esc(r.slippageBps / 100) + '%</dd>') +
      '<dt>Estimated SOL upper bound</dt><dd>' + esc(rawAmount(r.maxSolCostLamports, 9)) + ' SOL · rent and network</dd><dt>State</dt><dd>' + esc(row.status.replace(/_/g, ' ')) + '</dd></dl>' +
      (row.receipt ? '<a class="stonks-secondary" href="' + esc(row.receipt) + '" target="_blank" rel="noopener noreferrer">Open on-chain receipt ↗</a>' : '') +
      '<p class="stonks-data-note">' + esc(row.message || 'This is not executed. Check the wallet, coin, amounts and fee model before signing.') + '</p>';
    $('tx-sign').hidden = row.status !== 'prepared'; $('tx-refresh').hidden = false; $('tx-retry').hidden = row.status !== 'submitted_unknown';
    if (row.status === 'prepared') message('Review expires at ' + new Date(row.expiresAt).toLocaleTimeString() + '. Signing will submit this exact transaction.');
    else message(row.message || row.status);
    if (['confirmed', 'finalized', 'failed', 'expired'].includes(row.status)) { try { sessionStorage.removeItem('sw-stonks-request:' + wallet); } catch { /* Storage is optional; server deduplication is authoritative. */ } }
  }
  async function requestId(payload) {
    const hash = b64(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(payload)))));
    const key = 'sw-stonks-request:' + wallet;
    let previous; try { previous = JSON.parse(sessionStorage.getItem(key) || 'null'); } catch { /* No stored request. */ }
    if (previous?.hash === hash && previous.id) return previous.id;
    const id = crypto.randomUUID(); try { sessionStorage.setItem(key, JSON.stringify({ hash, id })); } catch { /* Unresolved duplicates still blocked server-side. */ } return id;
  }
  async function prepare() {
    if (!token) await connect(); riskConsent(); await loadWeb3();
    const input = { ...request, wallet };
    if (input.operation === 'launch') {
      input.description = $('tx-description').value.trim(); input.imageRights = $('tx-image-rights').checked;
      const file = $('tx-image').files[0]; if (!file || file.size > 3 * 1024 * 1024 || !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw Error('Choose a PNG, JPEG or WebP under 3 MB.');
      if (!input.imageRights) throw Error('Confirm you have rights to use the image.');
      input.imageData = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(Error('Could not read the image.')); reader.readAsDataURL(file); });
    } else { input.operation = $('tx-side').value; input.amount = $('tx-amount').value.trim(); input.slippageBps = Number($('tx-slippage').value); }
    input.requestId = await requestId(input); message('Checking fresh chain configuration, balances and simulation…'); showIntent(await api('prepare', { input }));
  }
  async function sign() {
    if (!intent || intent.status !== 'prepared') return;
    if (Date.now() >= intent.expiresAt) throw Error('This review expired. Check its status, then prepare again.');
    if (!provider || provider.publicKey?.toString() !== wallet) { resetWallet(); throw Error('Wallet changed. Connect again.'); }
    const tx = root.solanaWeb3.Transaction.from(bytes(intent.transaction));
    if (tx.feePayer?.toString() !== wallet) throw Error('Transaction wallet mismatch. Signing stopped.');
    const original = b64(tx.serializeMessage()); message('Review the transaction in your wallet.');
    const signed = await provider.signTransaction(tx);
    if (b64(signed.serializeMessage()) !== original || provider.publicKey?.toString() !== wallet) throw Error('The signed transaction changed. Submission stopped.');
    message('Submitting the signed transaction. Do not start another if the connection drops.');
    showIntent(await api('submit', { intentId: intent.intentId, signedTransaction: b64(signed.serialize()) }));
  }
  async function history() {
    if (!token) await connect(); const rows = await api('history', {});
    $('tx-history-list').innerHTML = rows.length ? rows.map(r => '<button type="button" class="stonks-history-item" data-intent="' + esc(r.intentId) + '"><b>' + esc(r.review?.symbol || r.operation) + '</b><span>' + esc(r.operation) + ' · ' + esc(r.status.replace(/_/g, ' ')) + '</span><small>' + esc(new Date(r.createdAt).toLocaleString()) + '</small></button>').join('') : '<p class="stonks-data-note">No SlimeStonks transactions recorded for this wallet.</p>';
  }
  async function run(fn) {
    if (busy) return; busy = true; $('tx-actions').setAttribute('aria-busy', 'true');
    $('tx-actions').querySelectorAll('button').forEach(b => b.disabled = true);
    try { await fn(); } catch (error) { message(error.message || 'Could not verify this action. Check history before retrying.'); }
    finally { busy = false; $('tx-actions').removeAttribute('aria-busy'); $('tx-actions').querySelectorAll('button').forEach(b => b.disabled = false); }
  }
  async function open(input = null) {
    if (busy) return;
    lastFocus = document.activeElement; request = input; intent = undefined; $('tx-review').innerHTML = ''; $('tx-history-list').innerHTML = ''; message('Checking transaction readiness…');
    $('tx-sign').hidden = true; $('tx-refresh').hidden = true; $('tx-retry').hidden = true; $('tx-pilot').hidden = true;
    for (const dialog of document.querySelectorAll('dialog[open]')) dialog.close(); $('transaction-dialog').showModal();
    try {
      readiness = await api('readiness');
      $('tx-readiness').innerHTML = readiness.checks.map(c => '<div><b>' + esc(c.name) + '</b><span class="stonks-data-note">' + esc(c.status.replace(/-/g, ' ')) + '</span><p>' + esc(c.detail) + '</p></div>').join('');
      const allowed = readiness.pilotConfigured && (!input || input.operation !== 'launch' || input.mode === 'standard');
      $('tx-pilot').hidden = !allowed;
      $('tx-prepare').hidden = !input;
      $('tx-launch-fields').hidden = input?.operation !== 'launch'; $('tx-swap-fields').hidden = !input || input.operation === 'launch';
      if (input && input.operation !== 'launch') { $('tx-quote-label').textContent = 'Buys spend ' + (input.quoteSymbol || 'the quote token') + '; sells receive it. No automatic SOL conversion. SOL pairings currently use wrapped SOL.'; request = { operation: 'buy', mint: input.mint }; }
      message(allowed ? 'Private validation only. Read eligibility before connecting. Public trading is not enabled.' : 'Public transactions are not live. Browse markets and save plans; no wallet signature or payment is requested.');
    } catch (e) { message(e.message); }
  }
  $('tx-connect').onclick = () => run(connect); $('tx-prepare').onclick = () => run(prepare); $('tx-sign').onclick = () => run(sign);
  $('tx-refresh').onclick = () => run(async () => { if (intent) showIntent(await api('status', { intentId: intent.intentId })); });
  $('tx-retry').onclick = () => run(async () => { if (intent) showIntent(await api('retry', { intentId: intent.intentId })); });
  $('tx-history').onclick = () => run(history);
  $('tx-history-list').onclick = e => { const id = e.target.closest('[data-intent]')?.dataset.intent; if (id) run(async () => showIntent(await api('status', { intentId: id }))); };
  $('transaction-dialog').addEventListener('close', () => lastFocus?.focus?.());
  document.addEventListener('click', e => { if (e.target.closest('[data-stonks-readiness]')) open(); });
  root.SlimeStonksTransactions = { open };
})(window);
