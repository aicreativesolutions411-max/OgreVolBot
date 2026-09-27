/* Shared by Terminal, the embedded Wallet/Fun launch screen and the legacy app. */
(function () {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const at = (prefix, key) => document.getElementById(prefix + key);
  let capabilitiesPromise;
  function capabilities() {
    if (capabilitiesPromise) return capabilitiesPromise;
    // The public site can be static while the API lives on app.slimewire.org.
    // Match the host application's configuration; never parse its SPA fallback as API data.
    const base = String(window.OGRE_PORTAL_CONFIG?.apiBase || '').trim().replace(/\/+$/, '');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    capabilitiesPromise = fetch(base + '/api/web/launch/utility/capabilities', { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error('Utility availability could not be checked.'); return r.json(); })
      .then(c => { if (!c?.usepaid || !c?.nftFloor) throw new Error('Utility availability is temporarily unavailable.'); return c; })
      .catch(e => { capabilitiesPromise = null; throw e.name === 'AbortError' ? new Error('Availability check timed out. Try again shortly.') : e; })
      .finally(() => clearTimeout(timer));
    return capabilitiesPromise;
  }
  function render(prefix, policy = {}) {
    const mode = policy.mode === 'holder_alliance' && policy.partnerHolderShareBps === 0 ? 'holder_self' : policy.mode || 'creator';
    return `<section class="launch-utility" data-utility-prefix="${esc(prefix)}" aria-label="Creator fee utility">
      <div class="launch-utility-heading"><span>YOUR CREATOR FEES</span><small>Choose once · review before launch</small></div>
      <label for="${prefix}Mode">Where should future creator fees go?</label>
      <select id="${prefix}Mode"><option value="creator" ${mode === 'creator' ? 'selected' : ''}>Keep my fees · claim when I want</option><option value="holder_self" ${mode === 'holder_self' ? 'selected' : ''}>Reward my community · me + my holders</option><option value="holder_alliance" ${mode === 'holder_alliance' ? 'selected' : ''}>Reward two communities · me + both communities</option><option value="alliance" ${mode === 'alliance' ? 'selected' : ''}>Advanced · share with a community treasury wallet</option><option value="nft_floor" hidden disabled ${mode === 'nft_floor' ? 'selected' : ''}>Saved NFT floor route · unavailable</option><option value="usepaid" hidden disabled ${mode === 'usepaid' ? 'selected' : ''}>Saved X payout route · unavailable</option></select>
      <div data-utility-mode="creator"><p class="launch-utility-note">Keep 100% of your creator fees, not all trading fees. New launches default to manual claims in Wallet. Pump claims are wallet-wide: a manual-claim coin pauses automatic creator claims for that wallet, so another coin cannot sweep these fees. An optional NFT collection does not redirect fees.</p></div>
      <div class="launch-utility-note"><b>Trading pair: SOL · Rewards paid in SOL.</b> A recipient community is separate from the trading pair. Other crypto and stock-token pairs are not enabled until their full launch, trade and payout path is verified; stock tokens also require issuer eligibility checks.</div>
      <div data-utility-mode="holder_alliance" hidden>
        <p class="launch-utility-note"><b>Share the fees. Keep it simple.</b> Keep your share and reward selected communities twice daily in SOL. Keep at least 1% for the creator; an unused community can receive 0%.</p>
        <div data-holder-partner><label for="${prefix}HolderPartnerName">Partner community name · not verified affiliation</label><input id="${prefix}HolderPartnerName" maxlength="64" value="${esc(policy.partnerName || '')}" placeholder="Community name">
        <label for="${prefix}PartnerMint">Partner coin · Solana contract address</label><input id="${prefix}PartnerMint" maxlength="44" autocomplete="off" spellcheck="false" value="${esc(policy.partnerMint || '')}" placeholder="Paste the other community’s coin CA">
        </div><div class="launch-utility-grid">${[['CreatorShare','Me',policy.creatorShareBps ?? 2000],['OwnHolderShare','My coin’s holders',policy.ownHolderShareBps ?? 4000],['PartnerHolderShare','Other community',policy.partnerHolderShareBps ?? 4000]].map(([id,label,value])=>`<label>${label} · %<input id="${prefix}${id}" type="number" min="${id==='CreatorShare'?1:0}" max="99" step="1" value="${esc(value/100)}"></label>`).join('')}</div>
        <p class="launch-utility-note" data-holder-split role="status"></p>
        <p class="launch-utility-note"><b>Twice daily · over $20 · proportional to holdings.</b> Small rewards accumulate. The split is permanent; you can pause automatic payouts, but earned rewards remain owed.</p>
        <details><summary>Eligibility, timing &amp; network costs</summary>
        <p class="launch-utility-note"><b>Every 12 hours · holdings over $20.</b> Each community’s share is proportional to its eligible holders’ token balances. Up to 2,000 eligible wallets per community; complete free snapshots plus a verified active Pump curve or an indexed market with $1,000+ liquidity are required. Unavailable data delays payouts, never pays a partial list.</p>
        <p class="launch-utility-note">Small rewards accumulate to 0.001 SOL per wallet. A dedicated encrypted SlimeWire vault retains a 0.001 SOL reserve; the launcher pays network fees (up to 0.0001 SOL per batch of 8) and keeps 0.003 SOL available. Receipts and pause/resume live in Your launches. The permanent split cannot be edited. This is SlimeWire-managed distribution, not Pump’s native holder program.</p>
        </details>
      </div>
      <div data-utility-mode="alliance" hidden>
        <p class="launch-utility-note"><b>Launch together. Share the creator fees.</b> A permanent Pump split between your creator wallet and one community wallet. SOL pairs only.</p>
        <label for="${prefix}PartnerName">Community name · a label, not verified affiliation</label><input id="${prefix}PartnerName" maxlength="64" value="${esc(policy.partnerName || '')}" placeholder="e.g. Nightshift community">
        <label for="${prefix}PartnerWallet">Community SOL wallet · verify the full address</label><input id="${prefix}PartnerWallet" maxlength="44" autocomplete="off" spellcheck="false" value="${esc(policy.partnerWallet || '')}" placeholder="Paste the community-controlled Solana wallet">
        <label for="${prefix}PartnerShare">Community share of creator fees · %</label><input id="${prefix}PartnerShare" type="number" min="1" max="99" step="1" value="${esc((policy.partnerShareBps || 5000) / 100)}">
        <p class="launch-utility-note" data-alliance-split></p>
        <label class="lcheck"><input id="${prefix}AutoDistribute" type="checkbox" ${policy.autoDistribute === true ? 'checked' : ''}> Automatically distribute daily when at least 0.001 SOL has accrued</label>
        <p class="launch-utility-note">The creator wallet pays network costs (up to 0.0001 SOL per distribution) and must keep 0.003 SOL for account rent. Small balances accumulate. You can distribute manually from Your launches. This does not pay individual holders, buy other assets or send X cash. Recipients and percentages cannot be changed after setup.</p>
      </div>
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
    if (mode === 'holder_alliance' || mode === 'holder_self') return { mode:'holder_alliance', partnerName: mode==='holder_self'?'':(at(prefix, 'HolderPartnerName')?.value || '').trim(), partnerMint: mode==='holder_self'?'':(at(prefix, 'PartnerMint')?.value || '').trim(), creatorShareBps: Number(at(prefix, 'CreatorShare')?.value)*100, ownHolderShareBps: Number(at(prefix, 'OwnHolderShare')?.value)*100, partnerHolderShareBps: mode==='holder_self'?0:Number(at(prefix, 'PartnerHolderShare')?.value)*100 };
    if (mode === 'alliance') return { mode, partnerName: (at(prefix, 'PartnerName')?.value || '').trim(), partnerWallet: (at(prefix, 'PartnerWallet')?.value || '').trim(), partnerShareBps: Math.round(Number(at(prefix, 'PartnerShare')?.value) * 100), autoDistribute: at(prefix, 'AutoDistribute')?.checked === true };
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
      const selected = at(prefix, 'Mode').value, mode=selected==='holder_self'?'holder_alliance':selected;
      const partner=root.querySelector('[data-holder-partner]');if(partner)partner.hidden=selected==='holder_self';
      const partnerShare=at(prefix,'PartnerHolderShare');if(partnerShare){partnerShare.closest('label').hidden=selected==='holder_self';if(selected==='holder_self'){partnerShare.value='0';at(prefix,'OwnHolderShare').value=String(100-Number(at(prefix,'CreatorShare').value));}}
      root.querySelectorAll('[data-utility-mode]').forEach(el => { el.hidden = el.dataset.utilityMode !== mode; });
      root.querySelector('.launch-utility-actions').hidden = mode === 'creator';
      const label = at(prefix, 'Availability');
      if (mode !== 'creator') {
        label.textContent = 'Checking availability…';
        capabilities().then(c => { if (at(prefix, 'Mode')?.value !== selected) return; const route = mode === 'holder_alliance' ? c.holderAlliance : mode === 'alliance' ? c.alliance : mode === 'usepaid' ? c.usepaid : c.nftFloor; label.textContent = route?.available ? 'Available · review required' : route?.reason || 'Unavailable on this deployment.'; }).catch(e => { label.textContent = e.message; });
      }
    };
    const split = () => { const value = Number(at(prefix, 'PartnerShare')?.value); const line = root.querySelector('[data-alliance-split]'); if (line) line.textContent = value > 0 && value < 100 ? `${100-value}% creator · ${value}% community` : 'Choose a community share from 1% to 99%.'; const sum=['CreatorShare','OwnHolderShare','PartnerHolderShare'].reduce((a,key)=>a+Number(at(prefix,key)?.value||0),0); const holderLine=root.querySelector('[data-holder-split]'); if(holderLine) holderLine.textContent=sum===100?'100% allocated · permanent after launch':`${sum}% allocated · must total 100%`; };
    root.addEventListener('input', () => { at(prefix, 'Review').hidden = true; split(); onChange(); });
    at(prefix, 'Mode').addEventListener('change', () => {sync();split();onChange();});
    at(prefix, 'Preview').onclick = async () => {
      const button = at(prefix, 'Preview'); button.disabled = true; button.textContent = 'Checking…';
      try { display(prefix, await request({ ...context(), launchUtility: read(prefix) })); }
      catch (e) { display(prefix, { error: e.message }); }
      finally { button.disabled = false; button.textContent = 'Preview fee utility'; }
    };
    sync(); split();
  }
  async function prepare(policy, context, request, confirm) {
    if (!policy || policy.mode === 'creator') return { mode: 'creator' };
    const review = await request({ ...context, launchUtility: policy });
    if (!review.available) throw new Error((review.blockers || ['This utility is unavailable.']).join(' '));
    const approved = await confirm([review.summary, ...review.warnings, ...(review.treasury ? ['Permanent destination: ' + review.treasury] : []), policy.mode === 'holder_alliance' ? 'I verified the partner coin CA and approve the permanent percentages, managed holder vault, eligibility rules and automatic network costs.' : policy.mode === 'alliance' ? 'I checked the full community wallet address and approve this permanent split and the selected distribution schedule.' : 'I have read and accept the UsePaid terms and disclosures for this launch.']);
    if (!approved) throw new Error('Launch paused. No coin was created.');
    return { ...review.policy, consentVersion: review.consentVersion };
  }
  function resultHtml(launch = {}) {
    const utility = launch.launchUtility, nft = launch.nftCollection;
    const warning = launch.warning ? `<p class="launch-utility-blocker">${esc(launch.warning)}</p>` : '';
    if (!utility && !nft && !warning) return '';
    if (utility?.mode === 'holder_alliance') {
      const d=utility.distribution||{}, receipt=s=>`<a href="https://solscan.io/tx/${encodeURIComponent(s)}" target="_blank" rel="noopener noreferrer">Receipt ↗</a>`;
      return `<div class="launch-utility-review">${warning}<b data-utility-status>Community rewards · ${esc(utility.status)}</b><p>${esc(utility.creatorShareBps/100)}% launcher · ${esc(utility.ownHolderShareBps/100)}% own holders${utility.partnerHolderShareBps?` · ${esc(utility.partnerHolderShareBps/100)}% partner holders`:``}</p>${utility.partnerHolderShareBps?`<p>Other community: ${esc(utility.partnerName)}<br><code style="overflow-wrap:anywhere">${esc(utility.partnerMint)}</code></p>`:``}<p>${utility.autoDistribute?'Automatic · every 12 hours':'Automatic payouts paused'} · holdings over $20<br>Paid: ${esc(Number(d.paidLamports||0)/1e9)} SOL · Reserved rewards: ${esc(Number(d.owedLamports||0)/1e9)} SOL</p><p><a href="/launch?rewards=${encodeURIComponent(launch.mint||launch.tokenMint||utility.mint||``)}">Public rewards &amp; eligibility ↗</a></p><p>Holder payout: ${esc(d.status)}${d.nextSnapshotAt?' · Next snapshot '+esc(new Date(d.nextSnapshotAt).toLocaleString()):''}</p><p data-utility-error>${esc(utility.error||d.error||utility.feeDistribution?.error||'')}</p>${utility.signature?`<p>Fee setup: ${receipt(utility.signature)}</p>`:''}<button type="button" data-alliance-daily="${esc(utility.launchAttemptId)}" data-daily-action="${utility.autoDistribute?'pause_daily':'resume_daily'}">${utility.autoDistribute?'Pause':'Resume'} automatic payouts</button>${utility.status==='ACTIVE'?`<button type="button" data-alliance-distribute="${esc(utility.launchAttemptId)}">Check / retry due payouts</button>`:`<button type="button" data-launch-utility-retry="${esc(utility.launchAttemptId)}">Retry fee setup · same coin</button>`}<details><summary>${esc(d.receiptCount||0)} confirmed holder batches</summary>${(d.receipts||[]).slice().reverse().map(r=>`<p>${esc(r.confirmedAt)} · ${esc(Number(r.lamports)/1e9)} SOL · ${esc(r.recipients)} wallets · ${receipt(r.signature)}</p>`).join('')}</details></div>`;
    }
    if (utility?.mode === 'alliance') {
      const d = utility.distribution || {};
      const receipt = signature => `<a href="https://solscan.io/tx/${encodeURIComponent(signature)}" target="_blank" rel="noopener noreferrer">View transaction ↗</a>`;
      return `<div class="launch-utility-review">${warning}<p><b data-utility-status>Community Alliance: ${esc(utility.status)}</b></p><p>${esc(100-utility.partnerShareBps/100)}% creator · ${esc(utility.partnerShareBps/100)}% ${esc(utility.partnerName || 'community')}</p><p>Community wallet: <code style="overflow-wrap:anywhere">${esc(utility.partnerWallet)}</code></p><p>${utility.autoDistribute ? 'Daily distribution enabled' : 'Manual distribution'} · Minimum 0.001 SOL accrued</p>${utility.autoDistributionAuthorized ? `<button type="button" data-alliance-daily="${esc(utility.launchAttemptId)}" data-daily-action="${utility.autoDistribute ? 'pause_daily' : 'resume_daily'}">${utility.autoDistribute ? 'Pause daily payouts' : 'Resume daily payouts'}</button>` : ''}${utility.signature ? `<p>Fee-setup receipt: ${receipt(utility.signature)}</p>` : ''}<p data-utility-error>${esc(utility.error || d.error || '')}</p><p>Distribution: ${esc(d.status || 'NOT_DISTRIBUTED')} ${d.signature ? receipt(d.signature) : ''}</p>${utility.launchAttemptId && utility.status === 'ACTIVE' ? `<button type="button" data-alliance-distribute="${esc(utility.launchAttemptId)}">Distribute fees / refresh receipt</button>` : utility.launchAttemptId && utility.status !== 'CONFLICT' ? `<button type="button" data-launch-utility-retry="${esc(utility.launchAttemptId)}">Retry fee setup · same coin</button>` : ''}${d.receipts?.length ? `<details><summary>${esc(d.receiptCount)} confirmed distributions</summary>${d.receipts.slice().reverse().map(r => `<p>${esc(r.confirmedAt)} · ${receipt(r.signature)}</p>`).join('')}</details>` : ''}${nft ? `<p>NFT collection: ${esc(nft.status)} ${nft.address ? `<a href="https://solscan.io/account/${encodeURIComponent(nft.address)}" target="_blank" rel="noopener noreferrer">View collection ↗</a>` : ''}${nft.error ? ' · '+esc(nft.error) : ''}</p>` : ''}</div>`;
    }
    return `<div class="launch-utility-review">${warning}${nft ? `<p><b>NFT collection: ${esc(nft.status)}</b>${nft.address ? ` · <a href="https://solscan.io/account/${encodeURIComponent(nft.address)}" target="_blank" rel="noopener noreferrer">View on-chain</a>` : ''}</p>${nft.error ? `<p>${esc(nft.error)} · Open NFT &amp; Fees, paste this coin CA and retry the collection only.</p>` : ''}` : ''}${utility ? `<p><b data-utility-status>UsePaid routing: ${esc(utility.status)}</b> · @${esc(utility.xHandle)}</p><p>Cash payouts are managed separately by UsePaid. This status confirms only fee routing.</p>${utility.signature ? `<a href="https://solscan.io/tx/${encodeURIComponent(utility.signature)}" target="_blank" rel="noopener noreferrer">Fee-setup receipt ↗</a>` : ''}<p data-utility-error>${esc(utility.error || '')}</p><a href="https://usepaid.app/explore" target="_blank" rel="noopener noreferrer">Check with UsePaid ↗</a>${utility.launchAttemptId && !['ACTIVE', 'CONFLICT'].includes(utility.status) ? `<button class="recovery-button" type="button" data-launch-utility-retry="${esc(utility.launchAttemptId)}">Retry fee setup · same coin</button>` : ''}` : ''}</div>`;
  }
  let recoveryRequest;
  function configureRecovery(request) { recoveryRequest = request; }
  document.addEventListener('click', async event => {
    const button = event.target.closest?.('[data-launch-utility-retry], [data-alliance-distribute], [data-alliance-daily]');
    if (!button || !recoveryRequest || button.disabled) return;
    event.preventDefault(); event.stopPropagation();
    const box = button.closest('.launch-utility-review'), old = button.textContent;
    button.disabled = true; button.textContent = 'Checking original setup…';
    try {
      const response = await recoveryRequest({ launchAttemptId: button.dataset.launchUtilityRetry || button.dataset.allianceDistribute || button.dataset.allianceDaily, ...(button.dataset.allianceDistribute ? { action: 'distribute' } : button.dataset.allianceDaily ? { action: button.dataset.dailyAction } : {}) });
      if (!response?.ok || !response.utility) throw new Error(response?.error || 'Fee setup could not be checked. No new coin was launched.');
      const utility = response.utility;
      if (['alliance','holder_alliance'].includes(utility.mode)) { box.outerHTML = resultHtml({ launchUtility: utility }); return; }
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
    return { name: get('lc_n', 64), symbol: get('lc_s', 12), description: get('lc_d', 800), x: get('lc_x', 200), telegram: get('lc_tg', 200), website: get('lc_web', 200), devBuySol: /^\d+(?:\.\d{1,9})?$/.test(q.get('lc_dev') || '') ? q.get('lc_dev') : '0', nftEnabled: q.get('lc_nft') === '1', launchUtility: ['creator', 'alliance', 'holder_self', 'holder_alliance', 'usepaid', 'nft_floor'].includes(q.get('lc_utility')) ? { mode: q.get('lc_utility'), xHandle: get('lc_xpay', 16), collectionSymbol: get('lc_collection', 100), partnerName: get('lc_community',64) } : { mode: 'creator' } };
  }
  window.SlimeLaunchUtility = { render, read, wire, prepare, resultHtml, configureRecovery, prefill, capabilities };
})();
