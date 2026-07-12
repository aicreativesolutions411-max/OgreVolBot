"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const API_BASE = window.OGRE_PORTAL_CONFIG?.apiBase || "https://ogrevolbot.onrender.com";
  const TOKEN_KEY = "ogreWebToken";
  const RECENTS_KEY = "slimewireFunRecents";
  const TOKEN_MASCOTS = [1, 2, 3, 4, 5].map((n) => `/assets/slimewire/png/token-mascots/token-mascot-${n}.png`);
  const SLIME_PFPS = [
    "f_f648203a.png", "f_cc8f54e4.png", "f_c9dc667d.png", "f_c4f3d050.png", "f_c20374ef.png",
    "f_bb7b4bd6.png", "f_959b04a3.png", "f_94d9b765.png", "f_874a4027.png", "f_83fe78aa.png",
    "f_791eac34.png", "f_58ccc46f.png", "f_5734221c.png", "f_41fa2ec9.png", "f_392761e3.png",
    "f_378c4265.png", "f_31afd7c0.png", "f_19d62e28.png", "f_18b229f8.png", "f_03966060.png"
  ];
  const TOOL_ICONS = "/assets/slimewire/png/icons/";
  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    user: null,
    wallets: [],
    activeWallet: null,
    chain: "all",
    feed: "movers",
    rows: [],
    selected: null,
    selectedDetail: null,
    view: "home",
    previousView: "home",
    profileTab: "positions",
    detailTab: "signal",
    positions: [],
    launches: [],
    tradeBusy: false,
    recents: readLocal(RECENTS_KEY, []),
    feedCache: new Map()
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function readLocal(key, fallback) { try { const parsed = JSON.parse(localStorage.getItem(key) || "null"); return parsed ?? fallback; } catch { return fallback; } }
  function saveLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function hashCode(value) { let hash = 0; for (const char of String(value || "slime")) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0; return Math.abs(hash); }
  function short(value) { const text = String(value || ""); return text.length > 12 ? `${text.slice(0, 5)}…${text.slice(-4)}` : text; }
  function formatUsd(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return "—";
    if (number >= 1e9) return `$${(number / 1e9).toFixed(2)}B`;
    if (number >= 1e6) return `$${(number / 1e6).toFixed(2)}M`;
    if (number >= 1e3) return `$${(number / 1e3).toFixed(number >= 100_000 ? 0 : 1)}K`;
    if (number < 1) return `$${number.toPrecision(3)}`;
    return `$${number.toFixed(2)}`;
  }
  function formatPct(value) { const number = Number(value); return Number.isFinite(number) ? `${number >= 0 ? "+" : ""}${number.toFixed(1)}%` : "—"; }
  function ageLabel(value) {
    let seconds = Number(value?.pairAgeSeconds ?? value);
    if (!Number.isFinite(seconds) && value?.createdAt) seconds = (Date.now() - Date.parse(value.createdAt)) / 1000;
    if (!Number.isFinite(seconds) || seconds < 0) return "new";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  }
  function isRh(value) { return /^0x[0-9a-fA-F]{40}$/.test(String(value || "").trim()); }
  function coinKey(coin) { return String(coin?.address || coin?.tokenMint || "").trim(); }
  function mascot(value) { return TOKEN_MASCOTS[hashCode(value) % TOKEN_MASCOTS.length]; }
  function slimePfp(value) { return `/pfp/mapfaces/${SLIME_PFPS[hashCode(value) % SLIME_PFPS.length]}`; }
  function coinImage(coin) { return coin?.imageUrl || coin?.image || mascot(coinKey(coin)); }
  function attemptId(prefix = "fun") { return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`; }
  function toast(message, error = false) { const node = $("[data-toast]"); node.textContent = message; node.className = `toast show${error ? " error" : ""}`; clearTimeout(node._timer); node._timer = setTimeout(() => node.className = "toast", 3600); }

  async function request(path, options = {}) {
    const execute = async () => {
      const headers = { ...(options.headers || {}) };
      if (state.token) headers.Authorization = `Bearer ${state.token}`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), options.timeout || 20_000);
      try {
        const response = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: options.signal || controller.signal });
        let data = null; try { data = await response.json(); } catch {}
        return { ok: response.ok, status: response.status, data };
      } catch (error) { return { ok: false, status: 0, data: null, error }; }
      finally { clearTimeout(timer); }
    };
    let result = await execute();
    if ([401, 403].includes(result.status) && state.token && !options.noRetry) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      result = await execute();
    }
    return result;
  }
  function post(path, body) { return request(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }); }
  function setToken(token) { state.token = token || ""; if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }

  async function ensureAccount() {
    if (state.token) {
      const check = await request("/api/web/me", { noRetry: true });
      if (check.ok) { state.user = check.data?.user || check.data?.me || null; return true; }
      if (check.status !== 401) return true;
      setToken("");
    }
    const result = await post("/api/web/signup", {});
    if (result.ok && result.data?.token) { setToken(result.data.token); state.user = result.data.user || null; return true; }
    return false;
  }
  async function ensureAutomation() { if (!state.token) return; await post("/api/web/profile/automation", { action: "enable" }); }
  async function loadWallets(force = false) {
    if (!state.token) return [];
    const result = await request(`/api/web/balances${force ? "?force=true" : ""}`);
    if (result.ok && result.data?.ok) {
      state.wallets = result.data.balances || [];
      if (!state.activeWallet || !state.wallets.some((wallet) => wallet.index === state.activeWallet)) state.activeWallet = state.wallets[0]?.index || null;
      paintWalletPill();
    }
    return state.wallets;
  }
  function activeWallet() { return state.wallets.find((wallet) => wallet.index === state.activeWallet) || state.wallets[0] || null; }
  function paintWalletPill() {
    const pill = $(".wallet-pill"), label = $("[data-wallet-balance]");
    const wallet = activeWallet();
    pill?.classList.toggle("ready", Boolean(wallet));
    if (label) label.textContent = wallet ? `◎ ${Number(wallet.sol || 0).toFixed(3)}` : (state.token ? "+ Wallet" : "Connect");
  }

  function normalizeSol(row) {
    return { ...row, chain: "solana", address: row.tokenMint, marketCap: Number(row.marketCap || row.marketCapUsd || row.fdv || 0), volume: Number(row.volumeH1 || row.volumeH24 || row.volume5m || 0), volumeLabel: row.volumeLabel || row.volumeH1Label || row.volume5mLabel || "checking", change: Number(row.m5 ?? row.h1 ?? row.priceChange?.h1), age: ageLabel(row), imageUrl: row.imageUrl || row.avatarUrl || "" };
  }
  function normalizeRh(row) {
    return { ...row, chain: "robinhood", tokenMint: row.address, marketCap: Number(row.marketCapUsd || row.mc || 0), volume: Number(row.volume24hUsd || row.vol24 || row.vol1 || 0), volumeLabel: row.volumeLabel || row.volume24hLabel || (Number(row.volume24hUsd || row.vol24 || row.vol1 || 0) > 0 ? "" : "checking"), change: Number(row.priceChange1h ?? row.ch1 ?? row.priceChange24h ?? row.ch24), age: ageLabel(row), imageUrl: row.imageUrl || row.iconUrl || "" };
  }
  const FEED_CONFIG = {
    movers: { bucket: "live", sort: "best", rh: "trending", note: "Live movers ranked by signal" },
    new: { bucket: "live", sort: "fresh", rh: "new", note: "Fresh launches across both chains" },
    soon: { bucket: "live", sort: "best", cat: "graduating", rh: "new", note: "Coins approaching their next market stage" },
    graduated: { bucket: "graduated", sort: "best", cat: "graduated", rh: "safe", note: "Established pools with active trading" }
  };
  async function fetchSolFeed(config) {
    const query = new URLSearchParams({ bucket: config.bucket, sort: config.sort }); if (config.cat) query.set("cat", config.cat);
    const result = await request(`/api/web/live-pairs?${query}`);
    return result.ok ? (result.data?.livePairs?.rows || []).map(normalizeSol) : [];
  }
  async function fetchRhFeed(config) {
    const result = await request(`/api/web/rh/pairs?category=${encodeURIComponent(config.rh || "trending")}`);
    return result.ok ? (result.data?.rows || []).map(normalizeRh) : [];
  }
  async function loadFeed(force = false) {
    const config = FEED_CONFIG[state.feed] || FEED_CONFIG.movers;
    const cacheKey = `${state.chain}:${state.feed}`;
    const cached = state.feedCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.at < 15_000) { state.rows = cached.rows; renderCoinList(); return; }
    $("[data-coin-list]").innerHTML = '<div class="skeleton-list"></div>';
    $("[data-feed-note]").textContent = config.note;
    let rows = [];
    if (state.chain === "solana") rows = await fetchSolFeed(config);
    else if (state.chain === "robinhood") rows = await fetchRhFeed(config);
    else { const [sol, rh] = await Promise.all([fetchSolFeed(config), fetchRhFeed(config)]); rows = [...sol.slice(0, 24), ...rh.slice(0, 16)].sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0)); }
    state.rows = rows;
    state.feedCache.set(cacheKey, { at: Date.now(), rows });
    renderCoinList();
  }
  function coinRowHtml(coin) {
    const key = coinKey(coin), chain = coin.chain === "robinhood" ? "rh" : "sol";
    const change = Number(coin.change), changeClass = Number.isFinite(change) ? (change >= 0 ? "up" : "down") : "";
    return `<button class="coin-row" type="button" data-open-coin="${escapeHtml(key)}" data-chain-kind="${chain}">
      <span class="coin-avatar"><img src="${escapeHtml(coinImage(coin))}" alt="" onerror="this.src='${mascot(key)}'"><i class="chain-badge ${chain}">${chain === "rh" ? "RH" : "SOL"}</i></span>
      <span class="coin-info"><span class="coin-title"><b>${escapeHtml(coin.symbol || short(key))}</b><span>${escapeHtml(coin.name || "")}</span>${coin.live ? '<i class="live-tag">LIVE</i>' : ""}</span><span class="coin-meta"><i>${escapeHtml(coin.age || "new")}</i><i>Vol ${escapeHtml(coin.volume > 0 ? formatUsd(coin.volume) : (coin.volumeLabel || "checking"))}</i><i class="${changeClass}">${escapeHtml(formatPct(change))}</i></span></span>
      <span class="coin-value"><b>${escapeHtml(formatUsd(coin.marketCap))}</b><span>MARKET CAP</span></span>
    </button>`;
  }
  function renderCoinList() {
    const container = $("[data-coin-list]");
    container.innerHTML = state.rows.length ? state.rows.slice(0, 50).map(coinRowHtml).join("") : emptyState("No coins in this view", "Try another chain or category.");
  }
  function emptyState(title, body) { return `<div class="empty-state"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><b>${escapeHtml(title)}</b><span>${escapeHtml(body || "")}</span></div>`; }

  function setView(view, options = {}) {
    if (view !== state.view) state.previousView = state.view === "coin" ? state.previousView : state.view;
    state.view = view;
    $$("[data-view]").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    $$("[data-nav]").forEach((node) => node.classList.toggle("active", node.dataset.nav === view || (view === "coin" && node.dataset.nav === "home")));
    $(".fun-header").style.display = view === "coin" ? "none" : "flex";
    $(".bottom-nav").style.display = options.hideNav ? "none" : "grid";
    window.scrollTo({ top: 0, behavior: "instant" });
    if (view === "home") loadFeed();
    if (view === "leaders") loadLeaders();
    if (view === "wallet") loadWalletView();
  }
  function addRecent(coin) {
    const key = coinKey(coin); if (!key) return;
    state.recents = [{ key, chain: coin.chain, symbol: coin.symbol || short(key), name: coin.name || "", imageUrl: coin.imageUrl || "" }, ...state.recents.filter((item) => item.key.toLowerCase() !== key.toLowerCase())].slice(0, 8);
    saveLocal(RECENTS_KEY, state.recents);
  }
  async function openCoin(key, chainHint = "") {
    const chain = chainHint === "rh" || isRh(key) ? "robinhood" : "solana";
    let coin = state.rows.find((row) => coinKey(row).toLowerCase() === String(key).toLowerCase()) || { address: key, tokenMint: key, chain };
    state.selected = coin;
    state.selectedDetail = null;
    state.detailTab = "signal";
    addRecent(coin);
    setView("coin", { hideNav: false });
    renderCoinShell();
    history.replaceState(null, "", `#coin/${encodeURIComponent(key)}`);
    const path = chain === "robinhood" ? `/api/web/rh/token?address=${encodeURIComponent(key)}` : `/api/web/token-read?mint=${encodeURIComponent(key)}`;
    const [detailResult] = await Promise.all([request(path), loadPositions()]);
    if (detailResult.ok && detailResult.data?.ok) {
      const raw = detailResult.data.coin || detailResult.data;
      coin = chain === "robinhood" ? normalizeRh({ ...coin, ...raw, address: raw.address || key, marketCapUsd: raw.mc || raw.marketCapUsd, volume24hUsd: raw.vol24 || raw.volume24hUsd, priceChange1h: raw.ch1, createdAt: raw.createdAt }) : normalizeSol({ ...coin, ...raw, tokenMint: key, marketCap: raw.marketCapUsd, volumeH24: raw.volumeH24, h1: raw.changeH1 });
      state.selected = coin;
      state.selectedDetail = raw;
      addRecent(coin);
      renderCoinShell();
    } else renderDetailPanel();
  }
  function renderCoinShell() {
    const coin = state.selected || {}, key = coinKey(coin), chain = coin.chain === "robinhood" ? "rh" : "sol";
    $("[data-coin-mini]").innerHTML = `<img src="${escapeHtml(coinImage(coin))}" alt="" onerror="this.src='${mascot(key)}'"><div><b>${escapeHtml(coin.symbol || short(key))}</b><span>${chain === "rh" ? "Robinhood Chain" : "Solana"} · ${escapeHtml(short(key))}</span></div>`;
    $("[data-coin-stats]").innerHTML = `<div><span>Market cap</span><b>${formatUsd(coin.marketCap || coin.mc)}</b></div><div><span>Volume</span><b>${coin.volume > 0 ? formatUsd(coin.volume) : escapeHtml(coin.volumeLabel || "checking")}</b></div><div><span>1H change</span><b class="${Number(coin.change) >= 0 ? "up" : "down"}">${formatPct(coin.change)}</b></div>`;
    renderChart();
    renderPositionCard();
    renderDetailPanel();
  }
  function renderChart() {
    const coin = state.selected || {}, key = coinKey(coin), frame = $("[data-chart-frame]");
    const src = coin.chain === "robinhood"
      ? `https://dexscreener.com/robinhood/${encodeURIComponent(coin.pairAddress || key)}?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0&interval=15`
      : `https://dexscreener.com/solana/${encodeURIComponent(coin.pairAddress || key)}?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0&interval=15`;
    frame.innerHTML = `<div class="chart-loader"><span></span><p>Loading live chart</p></div><iframe src="${src}" title="${escapeHtml(coin.symbol || "coin")} chart" loading="eager" onload="this.previousElementSibling?.remove()"></iframe>`;
  }
  async function loadPositions() {
    if (!state.token) return [];
    const result = await request("/api/web/positions?fast=true");
    if (result.ok && result.data?.ok) state.positions = result.data.positions || [];
    return state.positions;
  }
  function currentPosition() { const key = coinKey(state.selected); return state.positions.find((position) => String(position.tokenMint || "").toLowerCase() === key.toLowerCase()) || null; }
  function renderPositionCard() {
    const position = currentPosition(), card = $("[data-position-card]");
    if (!position) { card.className = "position-card empty"; card.innerHTML = "No open SlimeWire position on this coin yet. Your chart and safety read stay available."; return; }
    const pnl = Number(position.openPnlSol), pct = Number(position.openPnlPercent), cls = pnl >= 0 ? "up" : "down";
    card.className = "position-card";
    card.innerHTML = `<div class="pos-head"><span>YOUR POSITION</span><span>${escapeHtml(position.walletCount || 1)} wallet${Number(position.walletCount) === 1 ? "" : "s"}</span></div><div class="pos-main"><div><b>◎ ${Number(position.estimatedValueSol || 0).toFixed(4)}</b><span>${Number(position.uiAmount || 0).toLocaleString()} ${escapeHtml(position.symbol || state.selected?.symbol || "tokens")}</span></div><strong class="${cls}">${Number.isFinite(pnl) ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} SOL` : "—"}<small>${Number.isFinite(pct) ? ` ${formatPct(pct)}` : ""}</small></strong></div>`;
  }
  function renderDetailPanel() {
    const coin = state.selected || {}, detail = state.selectedDetail || {}, panel = $("[data-detail-panel]");
    if (state.detailTab === "holders") {
      const holders = Number(coin.holders || detail.holders || detail.rugcheck?.holders || 0);
      panel.innerHTML = `<div class="read-card"><h3>Holder read</h3><p>${holders > 0 ? `${holders.toLocaleString()} holders are currently visible.` : "Holder count is not available from the current source yet."} Open the wallet map for distribution and connected-wallet context.</p><div class="factor-list"><span>${holders > 0 ? `${holders.toLocaleString()} holders` : "count pending"}</span><span>on-chain view</span></div></div><button class="tool-card" type="button" data-link-tool="map"><b>Open wallet map</b><span>Distribution, clusters, and fund paths</span></button>`;
      return;
    }
    if (state.detailTab === "about") {
      panel.innerHTML = `<div class="read-card"><h3>${escapeHtml(coin.name || coin.symbol || "Coin")}</h3><p>${escapeHtml(coin.description || detail.summary || detail.shield?.summary || "Live market data and contract context from SlimeWire's existing providers.")}</p><div class="factor-list"><span>${coin.chain === "robinhood" ? "Robinhood Chain" : "Solana"}</span><span>${escapeHtml(ageLabel(coin))}</span><span>${escapeHtml(short(coinKey(coin)))}</span></div></div>`;
      return;
    }
    const shield = detail.shield || detail.safety || coin.safety || {}, verdict = String(shield.verdict || "checking").toUpperCase();
    const score = Number(shield.score); const reasons = shield.factors || shield.reasons || [];
    panel.innerHTML = `<div class="read-card"><div class="signal-line"><div class="signal-score">${Number.isFinite(score) ? Math.round(score) : verdict.slice(0, 3)}</div><div><h3 style="margin:0">SlimeShield signal</h3><p>${escapeHtml(shield.summary || (verdict === "CHECKING" ? "Finishing the live safety read. Market data is already available." : verdict))}</p></div></div>${reasons.length ? `<div class="factor-list">${reasons.slice(0, 4).map((item) => `<span>${escapeHtml(item.label || item)}</span>`).join("")}</div>` : ""}</div>${detail.calls?.length ? `<div class="read-card"><h3>First-call proof</h3><p>${escapeHtml(detail.calls[0].callerName || "Tracked caller")} called this around ${formatUsd(detail.calls[0].entryMc)}. Public proof stays separate from hype.</p></div>` : ""}`;
  }

  async function loadLeaders() {
    const hero = $("[data-leader-hero]"), list = $("[data-leader-list]");
    hero.innerHTML = '<div class="skeleton-list" style="height:160px"></div>'; list.innerHTML = '<div class="skeleton-list"></div>';
    const result = await request("/api/web/proof");
    const leaders = result.ok ? (result.data?.topCallers || []) : [];
    if (!leaders.length) { hero.innerHTML = emptyState("Caller proof is warming", "Check again after tracked calls resolve."); list.innerHTML = ""; return; }
    const first = leaders[0], name = first.name || first.callerName || first.id || "Top caller";
    hero.innerHTML = `<div class="leader-card"><div class="leader-name"><img class="slime-pfp" src="${slimePfp(name)}" alt=""><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(first.calls || first.resolved || 0)} tracked calls · public receipts</p></div></div><div class="leader-score">${Math.round(Number(first.smoothedHitRate || first.hitRate || 0) * 100)}% <small>verified hit rate</small></div></div>`;
    list.innerHTML = leaders.slice(1, 11).map((leader, index) => { const n = leader.name || leader.callerName || leader.id || `Caller ${index + 2}`; return `<div class="leader-row"><span class="leader-rank">${index + 2}</span><img class="slime-pfp" src="${slimePfp(n)}" alt=""><div class="leader-copy"><b>${escapeHtml(n)}</b><span>${escapeHtml(leader.calls || leader.resolved || 0)} resolved · best ${escapeHtml(leader.bestPeakX || "—")}x</span></div><div class="leader-hit">${Math.round(Number(leader.smoothedHitRate || leader.hitRate || 0) * 100)}%<small>hit rate</small></div></div>`; }).join("");
  }

  async function loadWalletView() {
    const panel = $("[data-profile-panel]");
    if (state.token) await Promise.all([loadWallets(), loadPositions()]);
    renderWalletHero();
    if (!state.token) {
      panel.innerHTML = emptyState("Your mobile wallet starts here", "Tap Deposit or Receive when you are ready. SlimeWire creates the account only when you use it.");
      return;
    }
    if (state.profileTab === "positions") renderWalletPositions();
    else if (state.profileTab === "activity") loadWalletActivity();
    else loadCreatedCoins();
    if (!state.wallets.length) panel.innerHTML = emptyState("Your mobile wallet starts here", "Create a managed SlimeWire wallet to trade and keep server-side exits working while the app is closed.");
  }
  function renderWalletHero() {
    const wallet = activeWallet(), hero = $("[data-wallet-hero]");
    if (!wallet) { hero.innerHTML = `<img class="wallet-pfp" src="${slimePfp("guest")}" alt=""><h1>Slime guest</h1><p>No wallet created yet</p><div class="wallet-total">Ready when you are</div>`; return; }
    hero.innerHTML = `<img class="wallet-pfp" src="${slimePfp(wallet.publicKey)}" alt=""><h1>${escapeHtml(wallet.label || "Slime wallet")}</h1><p>${escapeHtml(short(wallet.publicKey))}</p><div class="wallet-total">◎ ${Number(wallet.sol || 0).toFixed(4)} available</div>`;
  }
  function renderWalletPositions() {
    const panel = $("[data-profile-panel]");
    panel.innerHTML = state.positions.length ? state.positions.map((position) => { const pnl = Number(position.openPnlSol), key = position.tokenMint; return `<button class="position-row coin-row" type="button" data-open-coin="${escapeHtml(key)}" data-chain-kind="sol"><img src="${escapeHtml(position.imageUrl || mascot(key))}" alt=""><span><b>${escapeHtml(position.symbol || short(key))}</b><span>${Number(position.uiAmount || 0).toLocaleString()} tokens · ${escapeHtml(position.walletCount || 1)} wallet</span></span><strong class="position-pnl ${pnl >= 0 ? "up" : "down"}">${Number.isFinite(pnl) ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)}◎` : "—"}</strong></button>`; }).join("") : emptyState("No open positions", "Coins you buy through SlimeWire appear here.");
  }
  async function loadWalletActivity() {
    const panel = $("[data-profile-panel]"); panel.innerHTML = '<div class="skeleton-list"></div>';
    const [sol, rh] = await Promise.all([request("/api/web/pnl"), request("/api/web/rh/activity")]);
    const rows = [
      ...((sol.data?.pnl?.trades || []).map((row) => ({ ...row, chain: "SOL", at: row.at || row.createdAt, label: row.symbol || short(row.tokenMint), side: row.type || row.side }))),
      ...((rh.data?.activity || rh.data?.rows || []).map((row) => ({ ...row, chain: "RH", at: row.at || row.createdAt, label: row.symbol || short(row.tokenAddress), side: row.side || row.action })))
    ].sort((a, b) => Date.parse(b.at || 0) - Date.parse(a.at || 0)).slice(0, 35);
    panel.innerHTML = rows.length ? rows.map((row) => `<div class="position-row"><img src="${slimePfp(row.walletPublicKey || row.label)}" alt=""><span><b>${escapeHtml(String(row.side || "trade").toUpperCase())} ${escapeHtml(row.label || "coin")}</b><span>${escapeHtml(row.chain)} · ${escapeHtml(new Date(row.at || Date.now()).toLocaleDateString())}</span></span><strong>${escapeHtml(row.solAmount || row.amountSol || row.amountEth || "")}</strong></div>`).join("") : emptyState("No activity yet", "Buys, sells, funding, and launches will show here.");
  }
  async function loadCreatedCoins() {
    const panel = $("[data-profile-panel]"); panel.innerHTML = '<div class="skeleton-list"></div>';
    const result = await request("/api/web/launches"); state.launches = result.ok ? (result.data?.coins || []) : [];
    panel.innerHTML = state.launches.length ? state.launches.map((coin) => { const key = coin.mint || coin.tokenAddress || coin.address || ""; const rh = ["robinhood", "rh"].includes(String(coin.rail || "").toLowerCase()) || isRh(key); return `<button class="coin-row" type="button" data-open-coin="${escapeHtml(key)}" data-chain-kind="${rh ? "rh" : "sol"}"><span class="coin-avatar"><img src="${escapeHtml(coin.imageUri || mascot(key))}" alt=""></span><span class="coin-info"><span class="coin-title"><b>${escapeHtml(coin.symbol || short(key))}</b><span>${escapeHtml(coin.name || "")}</span></span><span class="coin-meta"><i>${escapeHtml(coin.rail || "Solana")}</i><i>${escapeHtml(coin.status || "created")}</i></span></span><span class="coin-value"><b>Open</b><span>CREATOR</span></span></button>`; }).join("") : emptyState("No launches yet", "Coins launched through SlimeWire appear here with creator-only controls.");
  }

  function openSearch() {
    const overlay = $("[data-search-overlay]"), input = $("[data-search-input]"); overlay.hidden = false; renderSearchHome(); setTimeout(() => input.focus(), 30);
  }
  function closeSearch() { $("[data-search-overlay]").hidden = true; $("[data-search-input]").value = ""; }
  function renderSearchHome() {
    const content = $("[data-search-content]");
    content.innerHTML = `<h3>Recent searches</h3><div class="recent-chips">${state.recents.length ? state.recents.map((item) => `<button type="button" data-open-coin="${escapeHtml(item.key)}" data-chain-kind="${item.chain === "robinhood" ? "rh" : "sol"}">${escapeHtml(item.symbol || short(item.key))}</button>`).join("") : '<span style="color:var(--muted);font-size:11px">Your recent coins stay on this device.</span>'}</div><h3 style="margin-top:24px">Quick routes</h3><div class="tool-grid"><button class="tool-card" type="button" data-search-chain="solana"><b>Solana movers</b><span>Live market feed</span></button><button class="tool-card" type="button" data-search-chain="robinhood"><b>Robinhood</b><span>New chain coins</span></button><button class="tool-card" type="button" data-nav="leaders"><b>Top callers</b><span>Public proof</span></button></div>`;
  }
  let searchTimer = null;
  async function runSearch(query) {
    const content = $("[data-search-content]");
    if (!query.trim()) { renderSearchHome(); return; }
    content.innerHTML = '<div class="skeleton-list"></div>';
    const result = await request(`/api/web/token-search?q=${encodeURIComponent(query.trim())}`);
    const rows = result.ok ? (result.data?.matches || []).map((row) => (row.chain === "robinhood" ? normalizeRh({ ...row, address: row.address || row.tokenMint }) : normalizeSol(row))) : [];
    content.innerHTML = rows.length ? `<h3>Results</h3><div class="coin-list">${rows.map(coinRowHtml).join("")}</div>` : emptyState("No exact match", "Paste the full Solana or Robinhood contract address.");
  }

  function openSheet(html) { $("[data-sheet-content]").innerHTML = html; $("[data-sheet-overlay]").hidden = false; }
  function closeSheet() { $("[data-sheet-overlay]").hidden = true; $("[data-sheet-content]").innerHTML = ""; }
  function toolCard(icon, label, note, action, attr = "data-tool-action") { return `<button class="tool-card" type="button" ${attr}="${escapeHtml(action)}"><img src="${TOOL_ICONS}${escapeHtml(icon)}.png" alt=""><b>${escapeHtml(label)}</b><span>${escapeHtml(note)}</span></button>`; }
  async function openTools(global = false) {
    const coin = state.selected || {}, key = coinKey(coin), creator = key && state.launches.some((launch) => String(launch.mint || launch.tokenAddress || "").toLowerCase() === key.toLowerCase());
    openSheet(`<div class="sheet-title"><img src="${global ? "/assets/slimewire/png/slimewire-mark.png" : escapeHtml(coinImage(coin))}" alt=""><div><h2>${global ? "SlimeWire tools" : `$${escapeHtml(coin.symbol || short(key))} tools`}</h2><p>Power when you need it. Clean chart when you do not.</p></div></div><div class="tool-grid">
      ${!global ? toolCard("positions", "TP / SL", "Server-side exits", "exits") : ""}
      ${!global ? toolCard("wallet", "Wallet map", "Holders and flows", "map") : ""}
      ${!global ? toolCard("warning", "Safety", "Full contract read", "safety") : ""}
      ${toolCard("trade", "Swap", "SOL and RH funding", "swap")}
      ${toolCard("bundle", "Bundle", "Multi-wallet entry", "bundle")}
      ${toolCard("kol", "Copy trade", "Follow a wallet", "copy")}
      ${toolCard("snipe", "Launch sniper", "Watch deployers", "sniper")}
      ${toolCard("launch", "Launch", "Solana or Robinhood", "launch")}
      ${toolCard("pnl", "Full portfolio", "PnL and receipts", "portfolio")}
      ${creator && coin.chain === "robinhood" ? toolCard("health", "Creator liquidity", "Your launched coin", "liquidity") : ""}
    </div><p class="fineprint">Trading automation continues server-side after this page closes. Creator liquidity appears only for coins tied to your launch history.</p>`);
  }
  function openTradeSheet(side = "buy") {
    const coin = state.selected || {}, rh = coin.chain === "robinhood", key = coinKey(coin), wallet = activeWallet();
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>${escapeHtml(coin.symbol || short(key))}</h2><p>${rh ? "Robinhood Chain" : "Solana"} · ${escapeHtml(short(key))}</p></div></div>
      <div class="trade-toggle"><button class="${side === "buy" ? "active buy" : ""}" type="button" data-sheet-side="buy">Buy</button><button class="${side === "sell" ? "active sell" : ""}" type="button" data-sheet-side="sell">Sell</button></div>
      <div class="field"><label>Wallet</label><select data-trade-wallet>${state.wallets.length ? state.wallets.map((item) => `<option value="${item.index}" ${item.index === state.activeWallet ? "selected" : ""}>${escapeHtml(item.label || `Wallet ${item.index}`)} · ◎${Number(item.sol || 0).toFixed(3)}</option>`).join("") : '<option value="">Create a wallet first</option>'}</select></div>
      ${side === "buy" ? `<div class="field"><label>${rh ? "Pay with" : "Amount"}</label>${rh ? '<select data-pay-currency><option value="SOL">SOL · auto-convert to RH ETH</option><option value="ETH">Robinhood ETH</option></select>' : ""}<input data-trade-amount inputmode="decimal" value="${rh ? "0.05" : "0.1"}" aria-label="Trade amount"><div class="amount-chips">${(rh ? ["0.01", "0.025", "0.05", "0.1"] : ["0.05", "0.1", "0.25", "0.5"]).map((amount) => `<button type="button" data-amount-chip="${amount}">${amount}</button>`).join("")}</div></div><div class="field-row"><div class="field"><label>Take profit %</label><input data-trade-tp inputmode="decimal" placeholder="off"></div><div class="field"><label>Stop loss %</label><input data-trade-sl inputmode="decimal" placeholder="off"></div></div>${!rh ? '<details><summary style="color:var(--muted);font-size:11px">Advanced exit strategy</summary><div class="field-row"><div class="field"><label>Trailing stop %</label><input data-trade-trail inputmode="decimal" placeholder="off"></div><div class="field"><label>Arm after +%</label><input data-trade-trail-arm inputmode="decimal" placeholder="auto"></div></div><label class="check-row"><input type="checkbox" data-trade-be> Move stop to break-even after TP1</label></details>' : ""}` : `<div class="field"><label>Sell percent</label><input data-trade-percent inputmode="numeric" value="100"><div class="amount-chips">${[25, 50, 75, 100].map((amount) => `<button type="button" data-percent-chip="${amount}">${amount}%</button>`).join("")}</div></div>`}
      <button class="submit-trade ${side}" type="button" data-submit-trade data-side="${side}" ${wallet ? "" : "disabled"}>${wallet ? `${side === "buy" ? "Buy" : "Sell"} ${escapeHtml(coin.symbol || "coin")}` : "Create a wallet first"}</button><p class="fineprint">Review the amount before submitting. TP/SL runs on the server, so it keeps watching after you close the app.</p>`);
  }
  function openExitSheet() {
    const coin = state.selected || {};
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>Auto exits</h2><p>Protect your existing ${escapeHtml(coin.symbol || "coin")} position</p></div></div><div class="field-row"><div class="field"><label>Take profit %</label><input data-exit-tp inputmode="decimal" value="50"></div><div class="field"><label>Stop loss %</label><input data-exit-sl inputmode="decimal" value="15"></div></div><div class="field"><label>Sell % when hit</label><input data-exit-percent inputmode="numeric" value="100"></div><button class="submit-trade" type="button" data-arm-exits>Arm server-side exits</button><p class="fineprint">The backend monitors and executes this rule. The browser does not need to stay open.</p>`);
  }
  async function createWallet() {
    if (!(await ensureAccount())) { toast("Could not start your account.", true); return false; }
    const result = await post("/api/web/wallets/create", { label: "SlimeWire Fun", count: 1 });
    if (!result.ok || !result.data?.ok) { toast(result.data?.message || result.data?.error || "Wallet creation failed", true); return false; }
    const downloads = result.data.downloads || {};
    for (const item of [downloads.encryptedBackup, downloads.recoveryKeys].filter(Boolean)) downloadText(item.filename, item.text);
    await loadWallets(true); renderWalletHero(); renderWalletPositions(); toast("Wallet created. Backups downloaded—store them safely."); return true;
  }
  function downloadText(filename, text) { const blob = new Blob([text], { type: "text/plain" }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = filename || "slimewire-backup.txt"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  async function ensureTradeReady() { if (!(await ensureAccount())) return false; if (!state.wallets.length) await loadWallets(); if (!state.wallets.length) { closeSheet(); setView("wallet"); toast("Create a wallet first.", true); return false; } await ensureAutomation(); return true; }
  async function submitTrade(button) {
    if (state.tradeBusy || !(await ensureTradeReady())) return;
    const side = button.dataset.side, coin = state.selected || {}, key = coinKey(coin), walletIndex = Number($("[data-trade-wallet]")?.value || state.activeWallet), rh = coin.chain === "robinhood";
    state.tradeBusy = true; button.disabled = true; button.textContent = "Submitting…";
    let result;
    try {
      if (rh) {
        const body = { walletIndex, side, tokenAddress: key, tradeAttemptId: attemptId("fun-rh") };
        if (side === "buy") { const currency = $("[data-pay-currency]")?.value || "SOL", amount = $("[data-trade-amount]").value; body.payCurrency = currency; if (currency === "SOL") body.amountSol = amount; else body.amountEth = amount; }
        else body.percent = $("[data-trade-percent]").value;
        result = await post("/api/web/rh/trade", body);
        if (result.ok && side === "buy" && (Number($("[data-trade-tp]")?.value) > 0 || Number($("[data-trade-sl]")?.value) > 0)) await post("/api/web/rh/guards", { walletIndex, tokenAddress: key, symbol: coin.symbol || "", takeProfitPct: $("[data-trade-tp]").value, stopLossPct: $("[data-trade-sl]").value, sellPercent: "100", entryPriceUsd: coin.priceUsd || 0 });
      } else {
        const body = { tokenMint: key, walletIndex, tradeAttemptId: attemptId("fun-sol"), slippageBps: side === "sell" ? "1200" : "500" };
        if (side === "buy") {
          body.amountSol = $("[data-trade-amount]").value;
          const tp = $("[data-trade-tp]")?.value || "", sl = $("[data-trade-sl]")?.value || "", trail = $("[data-trade-trail]")?.value || "";
          if (tp || sl || Number(trail) > 0) { body.autoExit = true; body.takeProfitPct = tp; body.stopLossPct = sl; body.sellPercent = "100"; body.sellDelay = "off"; if (Number(trail) > 0) { body.trailingStopPct = trail; body.trailingActivatePct = $("[data-trade-trail-arm]")?.value || ""; } if ($("[data-trade-be]")?.checked) body.breakEvenAfterTp1 = true; }
          else body.disableAutoExit = true;
        } else body.percent = $("[data-trade-percent]").value;
        result = await post(`/api/web/trade/${side}`, body);
      }
      if (result.ok && result.data?.ok) { toast(`${side === "buy" ? "Buy" : "Sell"} submitted`); closeSheet(); setTimeout(async () => { await Promise.all([loadWallets(true), loadPositions()]); renderCoinShell(); }, 2200); }
      else toast(result.data?.message || result.data?.error || `${side} failed`, true);
    } finally { state.tradeBusy = false; button.disabled = false; button.textContent = `${side === "buy" ? "Buy" : "Sell"} ${coin.symbol || "coin"}`; }
  }
  async function armExits() {
    if (!(await ensureTradeReady())) return;
    const coin = state.selected || {}, key = coinKey(coin), tp = $("[data-exit-tp]")?.value || "", sl = $("[data-exit-sl]")?.value || "", percent = $("[data-exit-percent]")?.value || "100";
    const result = coin.chain === "robinhood"
      ? await post("/api/web/rh/guards", { walletIndex: state.activeWallet, tokenAddress: key, symbol: coin.symbol || "", takeProfitPct: tp, stopLossPct: sl, sellPercent: percent, entryPriceUsd: coin.priceUsd || 0 })
      : await post("/api/web/positions/arm-exits", { tokenMint: key, takeProfitPct: tp, stopLossPct: sl, sellPercent: percent, sellDelay: "off" });
    if (result.ok && result.data?.ok) { toast("TP/SL armed on the server"); closeSheet(); } else toast(result.data?.message || result.data?.error || "Could not arm exits", true);
  }

  function handleTool(action) {
    const coin = state.selected || {}, key = coinKey(coin);
    if (action === "exits") { openExitSheet(); return; }
    if (action === "map") { location.href = `/map?target=${encodeURIComponent(key)}`; return; }
    if (action === "safety") { closeSheet(); state.detailTab = "signal"; setView("coin"); $$("[data-detail]").forEach((button) => button.classList.toggle("active", button.dataset.detail === "signal")); renderDetailPanel(); return; }
    if (action === "liquidity") { location.href = `/#rhtrade/${encodeURIComponent(key)}`; return; }
    if (action === "watch") { ensureAccount().then((ready) => ready ? post("/api/web/watchlist", { tokenMint: key, action: "add", symbol: coin.symbol || "", name: coin.name || "", imageUrl: coin.imageUrl || "" }) : { ok: false }).then((result) => toast(result.ok ? "Saved to Watchlist" : "Could not save coin", !result.ok)); closeSheet(); return; }
    if (action === "telegram") { window.open(`https://t.me/${window.OGRE_PORTAL_CONFIG?.telegramBotUsername || "SlimeWiredBot"}?start=scan_${encodeURIComponent(key)}`, "_blank", "noopener"); return; }
    const routes = { swap: "swap", bundle: "bundle", copy: "copy", sniper: "sniper", launch: "launch", portfolio: "portfolio" };
    if (routes[action]) location.href = `/#${routes[action]}`;
  }
  function walletReceive() {
    const wallet = activeWallet();
    if (!wallet) { createWallet(); return; }
    openSheet(`<div class="sheet-title"><img src="${slimePfp(wallet.publicKey)}" alt=""><div><h2>Receive SOL</h2><p>${escapeHtml(wallet.label || "Slime wallet")}</p></div></div><div class="read-card"><h3>Solana address</h3><p style="word-break:break-all">${escapeHtml(wallet.publicKey)}</p></div><button class="submit-trade" type="button" data-copy-wallet>Copy address</button><p class="fineprint">Only send Solana assets to this address. Robinhood ETH uses the derived RH address available in the full wallet tools.</p>`);
  }

  document.addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-nav]"); if (nav) { closeSearch(); closeSheet(); setView(nav.dataset.nav); return; }
    if (event.target.closest("[data-open-search]")) { openSearch(); return; }
    if (event.target.closest("[data-close-search]")) { closeSearch(); return; }
    if (event.target.closest("[data-close-sheet]")) { closeSheet(); return; }
    const coinButton = event.target.closest("[data-open-coin]"); if (coinButton) { closeSearch(); closeSheet(); await openCoin(coinButton.dataset.openCoin, coinButton.dataset.chainKind); return; }
    const chainButton = event.target.closest("[data-chain]"); if (chainButton) { state.chain = chainButton.dataset.chain; $$("[data-chain]").forEach((button) => button.classList.toggle("active", button === chainButton)); loadFeed(true); return; }
    const feedButton = event.target.closest("[data-feed]"); if (feedButton) { state.feed = feedButton.dataset.feed; $$("[data-feed]").forEach((button) => button.classList.toggle("active", button === feedButton)); loadFeed(); return; }
    if (event.target.closest("[data-refresh-feed]")) { loadFeed(true); return; }
    if (event.target.closest("[data-coin-back]")) { history.replaceState(null, "", "#"); setView(state.previousView || "home"); return; }
    if (event.target.closest("[data-copy-coin]")) { navigator.clipboard?.writeText(coinKey(state.selected)); toast("Contract copied"); return; }
    const detail = event.target.closest("[data-detail]"); if (detail) { state.detailTab = detail.dataset.detail; $$("[data-detail]").forEach((button) => button.classList.toggle("active", button === detail)); renderDetailPanel(); return; }
    const profile = event.target.closest("[data-profile]"); if (profile) { state.profileTab = profile.dataset.profile; $$("[data-profile]").forEach((button) => button.classList.toggle("active", button === profile)); loadWalletView(); return; }
    if (event.target.closest("[data-open-tools]")) { await loadCreatedCoinsSilently(); openTools(false); return; }
    if (event.target.closest("[data-open-global-tools]")) { openTools(true); return; }
    const trade = event.target.closest("[data-open-trade]"); if (trade) { if (!state.wallets.length) await loadWallets(); openTradeSheet(trade.dataset.openTrade); return; }
    const side = event.target.closest("[data-sheet-side]"); if (side) { openTradeSheet(side.dataset.sheetSide); return; }
    const amountChip = event.target.closest("[data-amount-chip]"); if (amountChip) { $("[data-trade-amount]").value = amountChip.dataset.amountChip; return; }
    const percentChip = event.target.closest("[data-percent-chip]"); if (percentChip) { $("[data-trade-percent]").value = percentChip.dataset.percentChip; return; }
    const submit = event.target.closest("[data-submit-trade]"); if (submit) { await submitTrade(submit); return; }
    if (event.target.closest("[data-arm-exits]")) { await armExits(); return; }
    const tool = event.target.closest("[data-tool-action]"); if (tool) { handleTool(tool.dataset.toolAction); return; }
    const linkTool = event.target.closest("[data-link-tool]"); if (linkTool) { handleTool(linkTool.dataset.linkTool); return; }
    const quickChain = event.target.closest("[data-search-chain]"); if (quickChain) { closeSearch(); state.chain = quickChain.dataset.searchChain; $$("[data-chain]").forEach((button) => button.classList.toggle("active", button.dataset.chain === state.chain)); setView("home"); loadFeed(true); return; }
    if (event.target.closest("[data-deposit]") || event.target.closest("[data-receive]")) { walletReceive(); return; }
    if (event.target.closest("[data-copy-wallet]")) { const wallet = activeWallet(); if (wallet) { await navigator.clipboard?.writeText(wallet.publicKey); toast("Wallet address copied"); } return; }
    if (event.target.closest("[data-price-alert]")) { openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(state.selected || {}))}" alt=""><div><h2>Coin alerts</h2><p>Keep the chart clean and send alerts where they matter.</p></div></div><div class="tool-grid">${toolCard("watchlist", "Watch coin", "Save to your list", "watch")}${toolCard("warning", "Telegram alert", "Open SlimeWiredBot", "telegram")}</div>`); return; }
  });

  $("[data-search-input]").addEventListener("input", (event) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(event.target.value), 280); });
  window.addEventListener("hashchange", () => { const match = location.hash.match(/^#coin\/(.+)$/); if (match) openCoin(decodeURIComponent(match[1])); });
  async function loadCreatedCoinsSilently() { if (!state.token || state.launches.length) return; const result = await request("/api/web/launches"); if (result.ok) state.launches = result.data?.coins || []; }

  async function init() {
    paintWalletPill();
    loadFeed();
    if (state.token) Promise.all([loadWallets(), loadPositions(), loadCreatedCoinsSilently()]).catch(() => {});
    const match = location.hash.match(/^#coin\/(.+)$/); if (match) openCoin(decodeURIComponent(match[1]));
  }
  init();
})();
