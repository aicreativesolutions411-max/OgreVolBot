/* Shared by Terminal, the embedded Wallet/Fun launch screen and the legacy app. */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const at = (prefix, key) => document.getElementById(prefix + key);
  let capabilitiesPromise;
  const capabilities = () => capabilitiesPromise || (capabilitiesPromise = fetch('/api/web/launch/utility/capabilities').then(r => { if (!r.ok) throw new Error('Utility availability could not be checked.'); return r.json(); }).catch(e => { capabilitiesPromise = null; throw e; }));
  function render(prefix, policy = {}) {
    const mode = policy.mode || 'creator';
    return `<section class="launch-utility" data-utility-prefix="${esc(prefix)}" aria-label="Creator fee utility">
      <div class="launch-utility-heading"><span>CREATOR FEE UTILITY</span><small>Optional · existing rewards stay available</small></div>
      <label for="${prefix}Mode">Where should future creator fees go?</label>
      <select id="${prefix}Mode"><option value="creator" ${mode === 'creator' ? 'selected' : ''}>Keep my current creator / reward settings</option><option value="nft_floor" ${mode === 'nft_floor' ? 'selected' : ''}>NFT floor budget · preview</option><option value="usepaid" ${mode === 'usepaid' ? 'selected' : ''}>X payouts via UsePaid · availability check</option></select>
      <div data-utility-mode="creator"><p class="launch-utility-note">No new fee recipient. Your current creator wallet, Cash back or holder-reward choice is preserved. Creating an NFT collection below does not redirect fees.</p></div>
      <div data-utility-mode="nft_floor" hidden><p class="launch-utility-note">Explore a collection and capped budget. Preview only: no NFT purchases or fee redirection until a verified execution adapter is available.</p>
        <label for="${prefix}Collection">Magic Eden collection symbol</label><input id="${prefix}Collection" maxlength="100" placeholder="e.g. okay_bears" value="${esc(policy.collectionSymbol || '')}">
        <div class="launch-utility-grid"><label>Creator-fee share %<input id="${prefix}Share" type="number" min="1" max="100" step="1" value="${esc((policy.feeShareBps || 5000) / 100)}"></label><label>Maximum price / NFT · SOL<input id="${prefix}Max" inputmode="decimal" value="${esc(policy.maxPriceSol || '0.1')}"></label><label>Daily budget · SOL<input id="${prefix}Daily" inputmode="decimal" value="${esc(policy.dailyBudgetSol || '0.5')}"></label></div>
        <p class="launch-utility-note">Planned custody: separate vault per coin; hold purchased NFTs. No shared treasury, automatic burn or lottery. The floor preview is not an affiliation claim.</p></div>
      <div data-utility-mode="usepaid" hidden><label for="${prefix}Handle">X recipient</label><input id="${prefix}Handle" maxlength="16" placeholder="@recipient" autocomplete="off" value="${esc(policy.xHandle || '')}">
        <p class="launch-utility-note"><b>Permanent: 100% to UsePaid.</b> Its published split is 80% for the recipient and 20% for $PAID buy-and-burn. You cannot reclaim this coin’s creator fees or combine this with other fee rewards.</p>
        <p class="launch-utility-note">Cash payouts are handled by UsePaid, subject to its terms and X Money eligibility—not guaranteed by SlimeWire. Unclaimed payments may expire. <a href="https://usepaid.app/docs" target="_blank" rel="noopener noreferrer">How it works</a> · <a href="https://usepaid.app/legal/terms" target="_blank" rel="noopener noreferrer">Terms</a> · <a href="https://usepaid.app/legal/disclosures" target="_blank" rel="noopener noreferrer">Disclosures</a></p></div>
      <div class="launch-utility-actions" hidden><button type="button" id="${prefix}Preview">Preview fee utility</button><span id="${prefix}Availability" class="launch-utility-note" role="status"></span></div>
      <div id="${prefix}Review" class="launch-utility-review" role="status" aria-live="polite" hidden></div>
    </section>`;
  }
  function read(prefix) {
    const mode = at(prefix, 'Mode')?.value || 'creator';
    if (mode === 'usepaid') return { mode, xHandle: (at(prefix, 'Handle')?.value || '').trim() };
    if (mode === 'nft_floor') return { mode, collectionSymbol: (at(prefix, 'Collection')?.value || '').trim(), feeShareBps: Number(at(prefix, 'Share')?.value) * 100, maxPriceSol: at(prefix, 'Max')?.value, dailyBudgetSol: at(prefix, 'Daily')?.value };
    return { mode: 'creator' };
  }
  function display(prefix, review) {
    const box = at(prefix, 'Review'); if (!box) return;
    box.hidden = false;
    box.innerHTML = `<b>${esc(review.summary || review.error || 'Review unavailable')}</b>${(review.blockers || []).map(t => `<p class="launch-utility-blocker">${esc(t)}</p>`).join('')}${(review.warnings || []).map(t => `<p>${esc(t)}</p>`).join('')}${review.treasury ? `<p>Permanent destination: <code>${esc(review.treasury)}</code></p>` : ''}${review.marketError ? `<p>${esc(review.marketError)}</p>` : ''}${review.listings?.length ? `<p>Public listings · not yet verified on-chain</p><ul>${review.listings.slice(0, 5).map(r => `<li><a href="https://magiceden.io/item-details/${encodeURIComponent(r.mint)}" target="_blank" rel="noopener noreferrer">${esc(r.mint.slice(0, 6))}…${esc(r.mint.slice(-4))}</a> · ${esc(r.priceSol)} SOL</li>`).join('')}</ul><a href="https://magiceden.io/marketplace/${encodeURIComponent(review.policy.collectionSymbol)}" target="_blank" rel="noopener noreferrer">View collection on Magic Eden ↗</a>` : ''}`;
  }
  function wire(prefix, { request, context = () => ({}), onChange = () => {} }) {
    const root = at(prefix, 'Mode')?.closest('.launch-utility'); if (!root || root.dataset.wired) return;
    root.dataset.wired = 'true';
    const sync = () => {
      const mode = at(prefix, 'Mode').value;
      root.querySelectorAll('[data-utility-mode]').forEach(el => { el.hidden = el.dataset.utilityMode !== mode; });
      root.querySelector('.launch-utility-actions').hidden = mode === 'creator';
      const label = at(prefix, 'Availability');
      if (mode !== 'creator') {
        label.textContent = 'Checking availability…';
        capabilities().then(c => { if (at(prefix, 'Mode')?.value !== mode) return; const route = mode === 'usepaid' ? c.usepaid : c.nftFloor; label.textContent = route.available ? 'Available · review required' : route.reason; }).catch(e => { label.textContent = e.message; });
      }
    };
    root.addEventListener('input', () => { at(prefix, 'Review').hidden = true; onChange(); });
    at(prefix, 'Mode').addEventListener('change', sync);
    at(prefix, 'Preview').onclick = async () => {
      const button = at(prefix, 'Preview'); button.disabled = true; button.textContent = 'Checking…';
      try { display(prefix, await request({ ...context(), launchUtility: read(prefix) })); }
      catch (e) { display(prefix, { error: e.message }); }
      finally { button.disabled = false; button.textContent = 'Preview fee utility'; }
    };
    sync();
  }
  async function prepare(policy, context, request, confirm) {
    if (!policy || policy.mode === 'creator') return { mode: 'creator' };
    const review = await request({ ...context, launchUtility: policy });
    if (!review.available) throw new Error((review.blockers || ['This utility is unavailable.']).join(' '));
    const approved = await confirm([review.summary, ...review.warnings, 'Permanent destination: ' + review.treasury, 'I have read and accept the UsePaid terms and disclosures for this launch.']);
    if (!approved) throw new Error('Launch paused. No coin was created.');
    return { ...review.policy, consentVersion: review.consentVersion };
  }
  function resultHtml(launch = {}) {
    const utility = launch.launchUtility, nft = launch.nftCollection;
    const warning = launch.warning ? `<p class="launch-utility-blocker">${esc(launch.warning)}</p>` : '';
    if (!utility && !nft && !warning) return '';
    return `<div class="launch-utility-review">${warning}${nft ? `<p><b>NFT collection: ${esc(nft.status)}</b>${nft.address ? ` · <a href="https://solscan.io/account/${encodeURIComponent(nft.address)}" target="_blank" rel="noopener noreferrer">View on-chain</a>` : ''}</p>${nft.error ? `<p>${esc(nft.error)} · Open NFT &amp; Fees, paste this coin CA and retry the collection only.</p>` : ''}` : ''}${utility ? `<p><b data-utility-status>UsePaid routing: ${esc(utility.status)}</b> · @${esc(utility.xHandle)}</p><p>Cash payouts are managed separately by UsePaid. This status confirms only fee routing.</p>${utility.signature ? `<a href="https://solscan.io/tx/${encodeURIComponent(utility.signature)}" target="_blank" rel="noopener noreferrer">Fee-setup receipt ↗</a>` : ''}<p data-utility-error>${esc(utility.error || '')}</p><a href="https://usepaid.app/explore" target="_blank" rel="noopener noreferrer">Check with UsePaid ↗</a>${utility.launchAttemptId && !['ACTIVE', 'CONFLICT'].includes(utility.status) ? `<button class="recovery-button" type="button" data-launch-utility-retry="${esc(utility.launchAttemptId)}">Retry fee setup · same coin</button>` : ''}` : ''}</div>`;
  }
  let recoveryRequest;
  function configureRecovery(request) { recoveryRequest = request; }
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-launch-utility-retry]');
    if (!button || !recoveryRequest || button.disabled) return;
    event.preventDefault(); event.stopPropagation();
    const box = button.closest('.launch-utility-review'), old = button.textContent;
    button.disabled = true; button.textContent = 'Checking original setup…';
    try {
      const response = await recoveryRequest({ launchAttemptId: button.dataset.launchUtilityRetry });
      if (!response?.ok || !response.utility) throw new Error(response?.error || 'Fee setup could not be checked. No new coin was launched.');
      const utility = response.utility;
      box.querySelector('[data-utility-status]').textContent = 'UsePaid routing: ' + utility.status;
      box.querySelector('[data-utility-error]').textContent = utility.error || (utility.status === 'ACTIVE' ? 'The original fee route is active on-chain.' : 'The original setup is still pending. Do not launch this coin again.');
      if (['ACTIVE', 'CONFLICT'].includes(utility.status)) button.hidden = true;
    } catch (error) { box.querySelector('[data-utility-error]').textContent = error.message; }
    finally { button.disabled = false; button.textContent = old; }
  });
  // URL input is a draft only. No account, wallet, launch ID or consent can be
  // supplied by a deep link; the user must review everything in the destination.
  function prefill(search) {
    const q = new URLSearchParams(search);
    if (!q.has('lc_n') && !q.has('lc_s')) return null;
    const get = (key, max) => (q.get(key) || '').slice(0, max);
    return { name: get('lc_n', 64), symbol: get('lc_s', 12), description: get('lc_d', 800), x: get('lc_x', 200), telegram: get('lc_tg', 200), website: get('lc_web', 200), devBuySol: /^\d+(?:\.\d{1,9})?$/.test(q.get('lc_dev') || '') ? q.get('lc_dev') : '0', nftEnabled: q.get('lc_nft') === '1', launchUtility: ['creator', 'usepaid', 'nft_floor'].includes(q.get('lc_utility')) ? { mode: q.get('lc_utility'), xHandle: get('lc_xpay', 16), collectionSymbol: get('lc_collection', 100) } : { mode: 'creator' } };
  }
  window.SlimeLaunchUtility = { render, read, wire, prepare, resultHtml, configureRecovery, prefill };
})();
