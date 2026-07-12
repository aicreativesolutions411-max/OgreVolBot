"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const API_BASE = window.OGRE_PORTAL_CONFIG?.apiBase || "https://ogrevolbot.onrender.com";
  const TOKEN_KEY = "ogreWebToken";
  const RECENTS_KEY = "slimewireFunRecents";
  const ACTIVE_PRESET_KEY = "slimewireFunTradePreset";
  const TOKEN_FALLBACK = "/assets/slimewire/png/slimewire-mark.png";
  const SLIME_PFPS = [
    "f_f648203a.png", "f_cc8f54e4.png", "f_c9dc667d.png", "f_c4f3d050.png", "f_c20374ef.png",
    "f_bb7b4bd6.png", "f_959b04a3.png", "f_94d9b765.png", "f_874a4027.png", "f_83fe78aa.png",
    "f_791eac34.png", "f_58ccc46f.png", "f_5734221c.png", "f_41fa2ec9.png", "f_392761e3.png",
    "f_378c4265.png", "f_31afd7c0.png", "f_19d62e28.png", "f_18b229f8.png", "f_03966060.png"
  ];
  const TOOL_ICONS = "/assets/slimewire/png/icons/";
  const IS_QUICK_ROUTE = /^\/quick(?:\.html)?\/?$/i.test(location.pathname) || new URLSearchParams(location.search).get("quick") === "1";
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
    detailTab: "setup",
    chartInterval: "15",
    chartMode: "chart",
    coinCalls: [],
    positions: [],
    launches: [],
    tradeBusy: false,
    presets: { trade: [], bundle: [] },
    activePresetId: localStorage.getItem(ACTIVE_PRESET_KEY) || "",
    volumePoll: null,
    recents: readLocal(RECENTS_KEY, []),
    feedCache: new Map(),
    feedRequestVersion: 0,
    feedTimer: null,
    imageHydrateVersion: 0,
    resolvedCoinImages: new Map(),
    quickBuyKey: "",
    quickAmount: "0.1",
    quickPanel: "trade"
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
  function mascot(value) { return value ? `/assets/slimewire/png/token-mascots/token-mascot-${(hashCode(value) % 5) + 1}.png` : TOKEN_FALLBACK; }
  function coinBadge(coin = {}) {
    const key = coinKey(coin), raw = String(coin.symbol || coin.name || "?").replace(/^\$+/, "").trim();
    const label = (raw.match(/[a-z0-9]/gi) || ["?"]).slice(0, 2).join("").toUpperCase();
    const hue = hashCode(key || raw) % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 72% 34%)"/><stop offset="1" stop-color="hsl(${(hue + 42) % 360} 75% 12%)"/></linearGradient></defs><rect width="96" height="96" rx="22" fill="url(#g)"/><circle cx="76" cy="20" r="18" fill="#8bff38" opacity=".16"/><text x="48" y="59" text-anchor="middle" fill="#f5ffe9" font-family="Arial,sans-serif" font-size="31" font-weight="800">${label}</text></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }
  function slimePfp(value) { return `/pfp/mapfaces/${SLIME_PFPS[hashCode(value) % SLIME_PFPS.length]}`; }
  function normalizeImageUrl(value) {
    const url = String(value || "").trim();
    if (url.startsWith("ipfs://")) return `https://ipfs.io/ipfs/${url.slice(7).replace(/^ipfs\//, "")}`;
    if (url.startsWith("/api/")) return `${API_BASE}${url}`;
    return url;
  }
  function directCoinImage(coin) { return normalizeImageUrl(coin?.imageUrl || coin?.avatarUrl || coin?.imageUri || coin?.iconUrl || coin?.logoUrl || coin?.meta?.imageUrl || coin?.metadata?.image || coin?.image); }
  function coinProxyImage(coin) {
    const key = coinKey(coin);
    return key ? `${API_BASE}/api/web/token-image?mint=${encodeURIComponent(key)}` : "";
  }
  function coinImage(coin) {
    const key = coinKey(coin);
    const remembered = key ? state.resolvedCoinImages.get(key.toLowerCase()) : "";
    if (remembered) return remembered;
    const direct = directCoinImage(coin);
    const proxy = coinProxyImage(coin);
    // IPFS gateways are much more reliable through the bounded server proxy, which can try alternates.
    if (direct && !/(?:ipfs\/|gateway\.pinata\.cloud|ipfs\.io)/i.test(direct)) return direct;
    if (proxy) return proxy;
    if (direct) return direct;
    return coinBadge(coin);
  }
  function coinImageAttrs(coin) {
    const key = coinKey(coin), proxy = coinProxyImage(coin), direct = directCoinImage(coin);
    return `src="${escapeHtml(coinImage(coin))}" data-token-image data-coin-image-key="${escapeHtml(key.toLowerCase())}" data-coin-symbol="${escapeHtml(coin.symbol || coin.name || "?")}" data-chain="${coin?.chain === "robinhood" ? "rh" : "sol"}" data-direct-image="${escapeHtml(direct)}" data-proxy-image="${escapeHtml(proxy)}"`;
  }
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
  async function loadMe() { if (!state.token) return null; const result = await request("/api/web/me", { noRetry: true }); if (result.ok) state.user = result.data?.user || null; return state.user; }

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
  async function loadPresets() {
    if (!state.token) return state.presets;
    const result = await request("/api/web/presets");
    if (result.ok && result.data?.ok) state.presets = result.data.presets || { trade: [], bundle: [] };
    if (!state.presets.trade.some((preset) => preset.id === state.activePresetId)) state.activePresetId = "";
    return state.presets;
  }
  function activePreset() { return state.presets.trade.find((preset) => preset.id === state.activePresetId) || null; }
  function activeWallet() { return state.wallets.find((wallet) => wallet.index === state.activeWallet) || state.wallets[0] || null; }
  function paintWalletPill() {
    const pill = $(".wallet-pill"), label = $("[data-wallet-balance]");
    const wallet = activeWallet();
    pill?.classList.toggle("ready", Boolean(wallet));
    if (label) label.textContent = wallet ? `◎ ${Number(wallet.sol || 0).toFixed(3)}` : (state.token ? "+ Wallet" : "Connect");
  }

  function normalizeSol(row) {
    return { ...row, chain: "solana", address: row.tokenMint, marketCap: Number(row.marketCap || row.marketCapUsd || row.fdv || 0), liquidity: Number(row.liquidityUsd || row.liquidity?.usd || row.reserveUsd || 0), holders: Number(row.holderCount || row.holders || row.holdersCount || 0), volume: Number(row.volumeH1 || row.volumeH24 || row.volume5m || 0), volumeLabel: row.volumeLabel || row.volumeH1Label || row.volume5mLabel || "checking", change: Number(row.m5 ?? row.h1 ?? row.priceChange?.h1), age: ageLabel(row), imageUrl: row.imageUrl || row.avatarUrl || row.imageUri || row.logoUrl || row.meta?.imageUrl || row.metadata?.image || "" };
  }
  function normalizeRh(row) {
    return { ...row, chain: "robinhood", tokenMint: row.address, marketCap: Number(row.marketCapUsd || row.mc || 0), liquidity: Number(row.liquidityUsd || row.liq || row.liquidity?.usd || 0), holders: Number(row.holderCount || row.holders || row.holdersCount || 0), volume: Number(row.volume24hUsd || row.vol24 || row.vol1 || 0), volumeLabel: row.volumeLabel || row.volume24hLabel || (Number(row.volume24hUsd || row.vol24 || row.vol1 || 0) > 0 ? "" : "checking"), change: Number(row.priceChange1h ?? row.ch1 ?? row.priceChange24h ?? row.ch24), age: ageLabel(row), imageUrl: row.imageUrl || row.localImagePath || row.iconUrl || row.imageUri || row.logoUrl || row.metadata?.image || "" };
  }
  const FEED_CONFIG = {
    movers: { bucket: "live", sort: "best", rh: "trending", note: "Live movers ranked by signal" },
    new: { bucket: "live", sort: "fresh", rh: "new", note: "Fresh launches across both chains" },
    soon: { bucket: "live", sort: "best", cat: "graduating", rh: "soon", note: "$17K–$40K market cap across both chains" },
    graduated: { bucket: "graduated", sort: "best", cat: "graduated", rh: "safe", note: "Established pools with active trading" }
  };
  async function fetchSolFeed(config, force = false) {
    const query = new URLSearchParams({ bucket: config.bucket, sort: config.sort }); if (config.cat) query.set("cat", config.cat);
    if (force) query.set("force", "true");
    const result = await request(`/api/web/live-pairs?${query}`);
    return result.ok ? (result.data?.livePairs?.rows || []).map(normalizeSol) : [];
  }
  async function fetchRhFeed(config) {
    const result = await request(`/api/web/rh/pairs?category=${encodeURIComponent(config.rh || "trending")}`, { timeout: 5000 });
    return result.ok ? (result.data?.rows || []).map(normalizeRh) : [];
  }
  function sortAndDedupeFeed(rows, feed) {
    const visible = feed === "soon"
      ? rows.filter((row) => Number(row.marketCap) >= 17_000 && Number(row.marketCap) <= 40_000)
      : rows;
    const unique = [...new Map(visible.filter((row) => coinKey(row)).map((row) => [coinKey(row).toLowerCase(), row])).values()];
    const feedAge = (row) => {
      const label = String(row.age || "").toLowerCase();
      if (label === "new") return 0;
      const match = label.match(/^(\d+)(s|m|h|d)$/);
      if (match) return Number(match[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[match[2]] || 1);
      const seconds = Number(row.pairAgeSeconds);
      if (Number.isFinite(seconds) && seconds > 0) return seconds;
      const created = Date.parse(row.createdAt || "");
      return Number.isFinite(created) ? Math.max(0, (Date.now() - created) / 1000) : Infinity;
    };
    return unique.sort(feed === "new"
      ? (a, b) => feedAge(a) - feedAge(b)
      : (a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }
  function scheduleFeedRefresh(delay = state.chain === "solana" ? 8000 : 12000) {
    clearTimeout(state.feedTimer);
    if (document.hidden || state.view !== "home") return;
    state.feedTimer = setTimeout(async () => {
      if (document.hidden || state.view !== "home") return;
      try { await loadFeed(true, { silent: true }); }
      finally { scheduleFeedRefresh(); }
    }, delay);
  }
  async function loadFeed(force = false, options = {}) {
    const version = ++state.feedRequestVersion, selectedChain = state.chain, selectedFeed = state.feed;
    const config = FEED_CONFIG[state.feed] || FEED_CONFIG.movers;
    const cacheKey = `${state.chain}:${state.feed}`;
    const cached = state.feedCache.get(cacheKey);
    if (!force && cached && Date.now() - cached.at < 15_000) { state.rows = cached.rows; hydrateSelectedFromFeed(); renderCoinList(); scheduleFeedRefresh(); return; }
    if (!options.silent && !state.rows.length) $("[data-coin-list]").innerHTML = '<div class="skeleton-list"></div>';
    $("[data-feed-note]").textContent = config.note;
    let rows = [];
    if (selectedChain === "solana") rows = await fetchSolFeed(config, force && !options.silent);
    else if (selectedChain === "robinhood") rows = await fetchRhFeed(config);
    else {
      const solPromise = fetchSolFeed(config, force && !options.silent), rhPromise = fetchRhFeed(config);
      const sol = await solPromise;
      if (version !== state.feedRequestVersion || selectedChain !== state.chain || selectedFeed !== state.feed) return;
      state.rows = sortAndDedupeFeed(sol, selectedFeed); renderCoinList(); void hydrateMissingCoinArt(version);
      const rh = await rhPromise; rows = [...sol.slice(0, 32), ...rh.slice(0, 24)];
    }
    if (version !== state.feedRequestVersion || selectedChain !== state.chain || selectedFeed !== state.feed) return;
    state.rows = sortAndDedupeFeed(rows, selectedFeed);
    state.feedCache.set(cacheKey, { at: Date.now(), rows: state.rows });
    hydrateSelectedFromFeed();
    renderCoinList();
    void hydrateMissingCoinArt(version);
    scheduleFeedRefresh();
  }
  async function hydrateMissingCoinArt(version) {
    // Feed endpoints already queue metadata hydration. Avoid the former 12 expensive token-search calls;
    // the next silent refresh merges the cache while each image independently uses its fast proxy fallback.
    state.imageHydrateVersion = version;
  }
  function hydrateSelectedFromFeed() {
    if (state.view !== "coin" || !state.selected) return;
    const key = coinKey(state.selected).toLowerCase();
    const match = state.rows.find((row) => coinKey(row).toLowerCase() === key);
    if (!match) return;
    state.selected = { ...state.selected, ...match };
    addRecent(state.selected);
    renderCoinShell();
  }
  function coinRowHtml(coin, index = 0) {
    const key = coinKey(coin), chain = coin.chain === "robinhood" ? "rh" : "sol";
    const change = Number(coin.change), changeClass = Number.isFinite(change) ? (change >= 0 ? "up" : "down") : "";
    return `<button class="coin-row" type="button" data-open-coin="${escapeHtml(key)}" data-chain-kind="${chain}">
      <span class="coin-avatar" style="background-image:url('${coinBadge(coin)}')"><img ${coinImageAttrs(coin)} alt="" loading="${index < 10 ? "eager" : "lazy"}" decoding="async" referrerpolicy="no-referrer"><i class="chain-badge ${chain}">${chain === "rh" ? "RH" : "SOL"}</i></span>
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
    if (view !== "home") clearTimeout(state.feedTimer);
    $$("[data-view]").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    $$("[data-nav]").forEach((node) => node.classList.toggle("active", node.dataset.nav === view || (view === "coin" && node.dataset.nav === "home")));
    $(".fun-header").style.display = ["coin", "quick"].includes(view) ? "none" : "flex";
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
  async function openCoin(key, chainHint = "", options = {}) {
    const chain = chainHint === "rh" || isRh(key) ? "robinhood" : "solana";
    let coin = state.rows.find((row) => coinKey(row).toLowerCase() === String(key).toLowerCase()) || { address: key, tokenMint: key, chain };
    state.selected = coin;
    state.selectedDetail = null;
    state.coinCalls = [];
    state.detailTab = "setup";
    state.chartInterval = "15";
    state.chartMode = "chart";
    addRecent(coin);
    const quick = Boolean(options.quick || IS_QUICK_ROUTE);
    setView(quick ? "quick" : "coin", { hideNav: quick });
    if (quick) renderQuickRoute(); else renderCoinShell();
    history.replaceState(null, "", quick ? `/quick?ca=${encodeURIComponent(key)}` : `#coin/${encodeURIComponent(key)}`);
    const path = chain === "robinhood" ? `/api/web/rh/token?address=${encodeURIComponent(key)}` : `/api/web/token-read?mint=${encodeURIComponent(key)}`;
    const detailPromise = request(path);
    void loadPositions().then(() => { if (state.view === "coin" && coinKey(state.selected).toLowerCase() === String(key).toLowerCase()) renderPositionCard(); });
    const searchResult = await request(`/api/web/token-search?q=${encodeURIComponent(key)}`);
    const searchMatch = searchResult.ok
      ? (searchResult.data?.matches || []).find((row) => coinKey(row).toLowerCase() === String(key).toLowerCase())
      : null;
    if (searchMatch) {
      coin = chain === "robinhood"
        ? normalizeRh({ ...coin, ...searchMatch, address: searchMatch.address || key })
        : normalizeSol({ ...coin, ...searchMatch, tokenMint: key });
      state.selected = coin;
      addRecent(coin);
      if (quick) renderQuickRoute(); else renderCoinShell();
    }
    const detailResult = await detailPromise;
    if (detailResult.ok && detailResult.data?.ok) {
      const raw = detailResult.data.coin || detailResult.data;
      coin = chain === "robinhood" ? normalizeRh({ ...coin, ...raw, address: raw.address || key, marketCapUsd: raw.mc || raw.marketCapUsd, volume24hUsd: raw.vol24 || raw.volume24hUsd, priceChange1h: raw.ch1, createdAt: raw.createdAt }) : normalizeSol({ ...coin, ...raw, tokenMint: key, marketCap: raw.marketCapUsd, volumeH24: raw.volumeH24, h1: raw.changeH1 });
      state.selected = coin;
      state.selectedDetail = raw;
      addRecent(coin);
      if (quick) renderQuickRoute(); else renderCoinShell();
    } else if (quick) renderQuickRoute(); else renderDetailPanel();
  }

  function quickSafetyLabel(coin = {}) {
    const verdict = String(coin.safety?.verdict || coin.shield?.verdict || state.selectedDetail?.safety?.verdict || state.selectedDetail?.shield?.verdict || "").toLowerCase();
    if (["verified", "ok", "safe", "pass"].includes(verdict)) return { text: verdict === "verified" ? "Contract verified" : "Checks clear", pending: false };
    if (["block", "danger", "honeypot"].includes(verdict)) return { text: "High-risk contract", pending: true };
    if (verdict === "warn") return { text: "Review warnings", pending: true };
    return { text: "Checks loading", pending: true };
  }

  function quickWalletPanel() {
    const wallet = activeWallet();
    if (!wallet) return `<div class="quick-wallet-card"><div class="quick-wallet-title"><b>Set up a wallet</b><span>Your coin stays selected</span></div><div class="quick-wallet-actions"><button class="primary" type="button" data-create-wallet>Create</button><button type="button" data-manage-wallets>Connect / restore</button><button type="button" data-manage-wallets>Import</button></div><p class="quick-wallet-note">Create a new SlimeWire wallet or restore an existing backup/private key. You can add and rename multiple wallets, then fund one manually with SOL.</p></div>`;
    const options = state.wallets.map((item) => `<option value="${item.index}" ${item.index === state.activeWallet ? "selected" : ""}>${escapeHtml(item.label || `Wallet ${item.index}`)} · ${Number(item.sol || 0).toFixed(4)} SOL</option>`).join("");
    return `<div class="quick-wallet-card"><div class="quick-wallet-title"><b>Trade wallet</b><span>${state.wallets.length} wallet${state.wallets.length === 1 ? "" : "s"} loaded</span></div><select data-quick-wallet-select>${options}</select><div class="quick-wallet-actions"><button class="primary" type="button" data-receive>Fund</button><button type="button" data-manage-wallets>Manage wallets</button><button type="button" data-create-wallet>+ Add wallet</button></div><p class="quick-wallet-note">One SOL wallet trades both chains. Robinhood buys convert from SOL automatically.</p></div>`;
  }

  function renderQuickRoute() {
    const content = $("[data-quick-route-content]"), walletPill = $(".quick-wallet-pill"), input = $("[data-quick-ca]");
    if (!content) return;
    const wallet = activeWallet();
    if (walletPill) walletPill.textContent = wallet ? `${wallet.label || "Wallet"} · ${Number(wallet.sol || 0).toFixed(3)} SOL` : "Connect wallet";
    const coin = state.selected, key = coinKey(coin);
    $(".quick-view")?.classList.toggle("has-coin", Boolean(key));
    if (input && key && input.value !== key) input.value = key;
    if (!key) {
      content.innerHTML = `<div class="quick-route-empty"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><b>Paste a coin to begin</b><p>Quick amounts, presets, bundle entry, and wallet setup will appear here.</p></div>${quickWalletPanel()}`;
      return;
    }
    const chain = coin.chain === "robinhood" ? "rh" : "sol", safety = quickSafetyLabel(coin), preset = activePreset();
    const change = Number(coin.change), amount = state.quickAmount || "0.1";
    const symbol = String(coin.symbol || "").replace(/^\$+/, "");
    const tokenLabel = symbol ? `$${symbol}` : short(key);
    const holders = Number(coin.holders || coin.holderCount || state.selectedDetail?.holders || 0);
    const presetName = preset ? escapeHtml(preset.name) : "Manual preset";
    const presetSummary = preset ? `TP +${escapeHtml(preset.takeProfitPct || "off")}% · SL -${escapeHtml(preset.stopLossPct || "off")}%` : "Add TP / SL ›";
    const reviewLabel = wallet ? `Review ${escapeHtml(amount)} SOL buy` : "Set up wallet to buy";
    const panelTabs = `<div class="quick-panel-tabs" role="tablist">${[["trade", "⚡", "Buy"], ["chart", "▥", "Chart"], ["tools", "•••", "More"]].map(([id, icon, label]) => `<button class="${state.quickPanel === id ? "active" : ""}" type="button" data-quick-panel="${id}"><i>${icon}</i>${label}</button>`).join("")}</div>`;
    const quickDock = `<div class="quick-bottom-dock"><button type="button" data-quick-panel="trade"><span>Selected amount</span><b>${escapeHtml(amount)} SOL</b></button><button class="quick-review" type="button" data-quick-review>${reviewLabel}<i>›</i></button></div>`;
    const tradePanel = `<div class="quick-action-body"><div class="quick-amounts">${["0.1", "0.5", "1"].map((value) => `<button class="${amount === value ? "active" : ""}" type="button" data-quick-select-amount="${value}"><i>◎</i>${value} SOL</button>`).join("")}<button class="${!["0.1", "0.5", "1"].includes(amount) ? "active" : ""}" type="button" data-quick-custom-focus><i>＋</i>Custom</button></div><div class="quick-custom-row"><input data-quick-custom-amount inputmode="decimal" value="${!["0.1", "0.5", "1"].includes(amount) ? escapeHtml(amount) : ""}" placeholder="Enter custom SOL amount"><button type="button" data-quick-set-custom>Use</button></div><button class="quick-preset-line" type="button" data-manage-presets><span><i>⚡</i>${presetName}</span><b>${presetSummary}</b></button><button class="quick-review" type="button" data-quick-review>${reviewLabel}<i>›</i></button></div>`;
    const chartSrc = coin.chain === "robinhood" ? `https://dexscreener.com/robinhood/${encodeURIComponent(coin.pairAddress || key)}?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0&interval=5` : `https://dexscreener.com/solana/${encodeURIComponent(coin.pairAddress || key)}?embed=1&theme=dark&trades=0&info=0&chartLeftToolbar=0&interval=5`;
    const chartPanel = `<div class="quick-inline-chart"><iframe src="${chartSrc}" title="${escapeHtml(coin.symbol || "coin")} chart" loading="eager"></iframe></div>${quickDock}`;
    const toolsPanel = `<div class="quick-tools-grid"><button type="button" data-manage-presets><i>◎</i><b>Presets</b><span>TP, stop loss and ladders</span><em>›</em></button><button type="button" data-quick-bundle><i>♙</i><b>Bundle Buy</b><span>Split across wallets</span><em>›</em></button><button type="button" data-manage-wallets><i>▣</i><b>Wallets</b><span>Add, fund or switch</span><em>›</em></button><button type="button" data-link-tool="safety"><i>◇</i><b>SlimeShield</b><span>Contract safety read</span><em>›</em></button></div>${quickDock}<button class="quick-back-buy" type="button" data-quick-panel="trade">← Back to Buy</button>`;
    const activePanel = state.quickPanel === "chart" ? chartPanel : state.quickPanel === "tools" ? toolsPanel : tradePanel;
    content.innerHTML = `<article class="quick-token-card"><div class="quick-token-head"><span class="coin-avatar" style="background-image:url('${coinBadge(coin)}')"><img ${coinImageAttrs(coin)} alt=""><i class="chain-badge ${chain}">${chain === "rh" ? "RH" : "SOL"}</i></span><div class="quick-token-name"><b>${escapeHtml(tokenLabel)}</b><button type="button" data-copy-coin>${escapeHtml(short(key))}<i>▣</i></button><span>${chain === "rh" ? "Robinhood Chain · funded with SOL" : "Solana quick trade"}</span></div><span class="quick-safety ${safety.pending ? "pending" : ""}">${escapeHtml(safety.text)}</span></div><div class="quick-market-grid"><div><span>MC</span><b>${escapeHtml(formatUsd(coin.marketCap || coin.mc))}</b></div><div><span>LIQ</span><b>${escapeHtml(formatUsd(coin.liquidity || coin.liq || coin.liquidityUsd))}</b></div><div><span>HOLDERS</span><b>${holders > 0 ? holders.toLocaleString() : "—"}</b></div><div><span>VOL</span><b>${escapeHtml(coin.volume > 0 ? formatUsd(coin.volume) : (coin.volumeLabel || "checking"))}</b></div><div><span>1H</span><b class="${Number.isFinite(change) ? (change >= 0 ? "up" : "down") : ""}">${escapeHtml(formatPct(change))}</b></div></div>${panelTabs}${activePanel}</article>${state.quickPanel === "trade" ? quickWalletPanel() : ""}`;
  }

  async function loadQuickTarget(raw = "") {
    const value = String(raw || "").trim();
    if (!value) { toast("Paste a contract address or token link.", true); return; }
    const direct = value.match(/0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44}/)?.[0] || "";
    if (direct) { await openCoin(direct, isRh(direct) ? "rh" : "sol", { quick: true }); return; }
    const result = await request(`/api/web/token-search?q=${encodeURIComponent(value)}`);
    const match = result.ok ? result.data?.matches?.[0] : null;
    if (!match || !coinKey(match)) { toast("Could not find a coin in that text or link.", true); return; }
    await openCoin(coinKey(match), match.chain === "robinhood" ? "rh" : "sol", { quick: true });
  }
  function renderCoinShell() {
    const coin = state.selected || {}, key = coinKey(coin), chain = coin.chain === "robinhood" ? "rh" : "sol";
    $("[data-coin-mini]").innerHTML = `<div class="coin-identity"><img ${coinImageAttrs(coin)} style="background-image:url('${coinBadge(coin)}')" alt="" decoding="async" referrerpolicy="no-referrer"><div><b>${escapeHtml(coin.symbol || short(key))}</b><span>${chain === "rh" ? "Robinhood Chain" : "Solana"} · ${escapeHtml(short(key))}</span></div></div><div class="coin-head-quote"><b>${formatUsd(coin.marketCap || coin.mc)}</b><span class="${Number(coin.change) >= 0 ? "up" : "down"}">${formatPct(coin.change)} · 1H</span></div>`;
    $("[data-coin-stats]").innerHTML = `<div><span>Market cap</span><b>${formatUsd(coin.marketCap || coin.mc)}</b></div><div><span>Liquidity</span><b>${formatUsd(coin.liquidity || coin.liq || coin.liquidityUsd)}</b></div><div><span>Holders</span><b>${Number(coin.holders || coin.holderCount) > 0 ? Number(coin.holders || coin.holderCount).toLocaleString() : "checking"}</b></div><div><span>Volume</span><b>${coin.volume > 0 ? formatUsd(coin.volume) : escapeHtml(coin.volumeLabel || "checking")}</b></div>`;
    renderChart();
    renderQuickTrade();
    renderPositionCard();
    renderDetailPanel();
  }
  function renderChart() {
    const coin = state.selected || {}, key = coinKey(coin), frame = $("[data-chart-frame]");
    const trades = state.chartMode === "transactions" ? 1 : 0;
    const src = coin.chain === "robinhood"
      ? `https://dexscreener.com/robinhood/${encodeURIComponent(coin.pairAddress || key)}?embed=1&theme=dark&trades=${trades}&info=0&chartLeftToolbar=0&interval=${state.chartInterval}`
      : `https://dexscreener.com/solana/${encodeURIComponent(coin.pairAddress || key)}?embed=1&theme=dark&trades=${trades}&info=0&chartLeftToolbar=0&interval=${state.chartInterval}`;
    $$("[data-chart-interval]").forEach((button) => button.classList.toggle("active", button.dataset.chartInterval === state.chartInterval));
    $$("[data-chart-mode]").forEach((button) => button.classList.toggle("active", button.dataset.chartMode === state.chartMode));
    if (frame.dataset.src === src && frame.querySelector("iframe")) return;
    frame.dataset.src = src;
    frame.innerHTML = `<div class="chart-loader"><span></span><p>Loading ${state.chartMode === "transactions" ? "transactions" : "live chart"}</p></div><iframe src="${src}" title="${escapeHtml(coin.symbol || "coin")} ${state.chartMode}" loading="eager" onload="this.previousElementSibling?.remove()"></iframe>`;
  }
  async function loadPositions() {
    if (!state.token) return [];
    const result = await request("/api/web/positions?fast=true");
    if (result.ok && result.data?.ok) state.positions = result.data.positions || [];
    return state.positions;
  }
  function currentPosition() { const key = coinKey(state.selected); return state.positions.find((position) => String(position.tokenMint || "").toLowerCase() === key.toLowerCase()) || null; }
  function renderQuickTrade() {
    const wallet = activeWallet(), amounts = ["0.1", "0.5", "1"], preset = activePreset();
    const balance = wallet ? `${Number(wallet.sol || 0).toFixed(4)} SOL` : "Connect wallet";
    const presetChips = state.presets.trade.slice(0, 4).map((item) => `<button type="button" class="preset-chip ${item.id === state.activePresetId ? "active" : ""}" data-activate-preset="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`).join("");
    $("[data-quick-trade]").innerHTML = `<div class="quick-wallet-line"><span>Available <b>${escapeHtml(balance)}</b></span><button type="button" data-nav="wallet">${wallet ? escapeHtml(wallet.label || "Wallet") : "Set up"} ›</button></div><div class="quick-buy-row">${amounts.map((amount) => `<button type="button" data-quick-buy="${amount}">${amount} SOL</button>`).join("")}</div><div class="quick-custom"><input data-custom-quick-amount inputmode="decimal" placeholder="Custom SOL" aria-label="Custom SOL amount"><button type="button" data-custom-quick-buy>Buy</button></div>${presetChips ? `<div class="preset-chips"><button type="button" class="preset-chip ${preset ? "" : "active"}" data-activate-preset="">Manual</button>${presetChips}</div>` : ""}<button class="preset-strip" type="button" data-manage-presets><span>${preset ? `Preset · ${escapeHtml(preset.name)}` : "Preset · Manual"}</span><b>${preset ? `${escapeHtml(preset.takeProfitPct || "off")}% TP · ${escapeHtml(preset.stopLossPct || "off")}% SL` : "Add or edit ›"}</b></button>`;
  }
  function renderPositionCard() {
    const position = currentPosition(), card = $("[data-position-card]");
    if (!position) { card.className = "position-card empty"; card.innerHTML = "No open SlimeWire position on this coin yet. Your chart and safety read stay available."; return; }
    const pnl = Number(position.openPnlSol), pct = Number(position.openPnlPercent), cls = pnl >= 0 ? "up" : "down";
    card.className = "position-card";
    card.innerHTML = `<div class="pos-head"><span>YOUR POSITION</span><span>${escapeHtml(position.walletCount || 1)} wallet${Number(position.walletCount) === 1 ? "" : "s"}</span></div><div class="pos-main"><div><b>◎ ${Number(position.estimatedValueSol || 0).toFixed(4)}</b><span>${Number(position.uiAmount || 0).toLocaleString()} ${escapeHtml(position.symbol || state.selected?.symbol || "tokens")}</span></div><strong class="${cls}">${Number.isFinite(pnl) ? `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} SOL` : "—"}<small>${Number.isFinite(pct) ? ` ${formatPct(pct)}` : ""}</small></strong></div>`;
  }
  function renderDetailPanel() {
    const coin = state.selected || {}, detail = state.selectedDetail || {}, panel = $("[data-detail-panel]");
    if (state.detailTab === "calls") { renderCoinCalls(); return; }
    if (state.detailTab === "holders") {
      const holders = Number(coin.holders || detail.holders || detail.rugcheck?.holders || 0);
      panel.innerHTML = `<div class="read-card"><h3>Holder read</h3><p>${holders > 0 ? `${holders.toLocaleString()} holders are currently visible.` : "Holder count is not available from the current source yet."} Open the wallet map for distribution and connected-wallet context.</p><div class="factor-list"><span>${holders > 0 ? `${holders.toLocaleString()} holders` : "count pending"}</span><span>on-chain view</span></div></div><button class="tool-card" type="button" data-link-tool="map"><b>Open wallet map</b><span>Distribution, clusters, and fund paths</span></button>`;
      return;
    }
    if (state.detailTab === "about") {
      panel.innerHTML = `<div class="read-card"><h3>${escapeHtml(coin.name || coin.symbol || "Coin")}</h3><p>${escapeHtml(coin.description || detail.summary || detail.shield?.summary || "Live market data and contract context from SlimeWire's existing providers.")}</p><div class="factor-list"><span>${coin.chain === "robinhood" ? "Robinhood Chain" : "Solana"}</span><span>${escapeHtml(ageLabel(coin))}</span><span>${escapeHtml(short(coinKey(coin)))}</span></div></div>`;
      return;
    }
    const rh = coin.chain === "robinhood";
    panel.innerHTML = `<div class="read-card"><h3>Fast trade presets</h3><p>Pick a starting setup, review it, then submit. Exits keep running on the server after you close the page.</p></div><div class="strategy-grid">
      <button class="strategy-card" type="button" data-trade-strategy="quick"><b>Quick scalp</b><span>TP +25% · SL -10%</span></button>
      <button class="strategy-card" type="button" data-trade-strategy="protect"><b>Protect profit</b><span>TP +50% · SL -15%</span></button>
      <button class="strategy-card" type="button" data-trade-strategy="ladder"><b>${rh ? "Scale out" : "Profit ladder"}</b><span>${rh ? "TP +50% · sell safely" : "25% at +50 / +100 / +200"}</span></button>
      <button class="strategy-card" type="button" data-trade-strategy="runner"><b>Let it run</b><span>${rh ? "TP +100% · SL -20%" : "Trailing 20% · break-even"}</span></button>
    </div><p class="fineprint">SlimeShield safety remains in Tools. Presets never bypass trade review or honeypot protection.</p>`;
  }
  async function renderCoinCalls(force = false) {
    const panel = $("[data-detail-panel]"), coin = state.selected || {}, key = coinKey(coin);
    if (coin.chain === "robinhood") { panel.innerHTML = `<div class="read-card"><h3>Robinhood calls are next</h3><p>Public calls currently use verified Solana market-cap snapshots. Robinhood support will appear only when it can use the same honest tracking.</p></div>`; return; }
    if (!state.coinCalls.length || force) panel.innerHTML = '<div class="skeleton-list" style="height:120px"></div>';
    const result = await request(`/api/web/calls?mint=${encodeURIComponent(key)}`);
    if (state.detailTab !== "calls" || coinKey(state.selected).toLowerCase() !== key.toLowerCase()) return;
    state.coinCalls = result.ok ? (result.data?.calls || []) : [];
    const rows = state.coinCalls.map((call) => `<div class="call-row"><img class="slime-pfp" src="${slimePfp(call.handle)}" alt=""><div><b>${call.profileSlug ? `<button type="button" data-open-trader="${escapeHtml(call.profileSlug)}">${escapeHtml(call.handle || "caller")}</button>` : escapeHtml(call.handle || "caller")} · ${escapeHtml(String(call.side || "call").toUpperCase())}</b><span>Called at ${escapeHtml(formatUsd(call.entryMcUsd))} · ${escapeHtml(call.outcome || call.status || "open")}</span>${call.note ? `<p>${escapeHtml(call.note)}</p>` : ""}</div></div>`).join("");
    panel.innerHTML = `<div class="read-card"><h3>Call it at market cap</h3><p>Your entry market cap is captured by the server. Calls become public proof—not a copy trade.</p><div class="call-actions">${["bullish", "bearish", "warning", "question"].map((side) => `<button type="button" data-post-call="${side}">${side}</button>`).join("")}</div></div>${rows || emptyState("No calls yet", "Be first to leave a tracked call on this coin.")}`;
  }
  async function postCoinCall(side, button) {
    if (!(await ensureAccount())) { toast("Sign in to post a call.", true); return; }
    button.disabled = true;
    try {
      const result = await post("/api/web/calls", { tokenMint: coinKey(state.selected), side, source: "fun" });
      if (result.ok && result.data?.ok) { toast(`Called ${side} at current market cap`); state.coinCalls = []; await renderCoinCalls(true); }
      else toast(result.data?.error || result.data?.message || "Could not post call", true);
    } finally { button.disabled = false; }
  }

  async function loadLeaders() {
    const hero = $("[data-leader-hero]"), list = $("[data-leader-list]");
    hero.innerHTML = '<div class="skeleton-list" style="height:160px"></div>'; list.innerHTML = '<div class="skeleton-list"></div>';
    const [result, socialResult] = await Promise.all([request("/api/web/proof"), request("/api/web/slimewire-traders")]);
    const leaders = result.ok ? (result.data?.topCallers || []) : [], social = socialResult.ok ? (socialResult.data?.traders || []) : [];
    if (!leaders.length && !social.length) { hero.innerHTML = emptyState("Caller proof is warming", "Check again after tracked calls resolve."); list.innerHTML = ""; return; }
    if (!leaders.length) { const firstSocial = social[0]; hero.innerHTML = `<button class="leader-card" type="button" data-open-trader="${escapeHtml(firstSocial.username)}"><div class="leader-name"><img class="slime-pfp" src="${escapeHtml(firstSocial.avatar || slimePfp(firstSocial.username))}" alt=""><div><h3>${escapeHtml(firstSocial.name)}</h3><p>${escapeHtml(firstSocial.trades || 0)} public trades · follow alerts only</p></div></div><div class="leader-score">${escapeHtml(firstSocial.roiLabel || "building")}<small>public profile</small></div></button>`; list.innerHTML = social.slice(1).map(traderRowHtml).join(""); return; }
    const first = leaders[0], name = first.name || first.callerName || first.id || "Top caller";
    hero.innerHTML = `<div class="leader-card"><div class="leader-name"><img class="slime-pfp" src="${slimePfp(name)}" alt=""><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(first.calls || first.resolved || 0)} tracked calls · public receipts</p></div></div><div class="leader-score">${Math.round(Number(first.smoothedHitRate || first.hitRate || 0) * 100)}% <small>verified hit rate</small></div></div>`;
    list.innerHTML = `${social.length ? `<div class="read-card"><h3>Trader profiles</h3><p>Follow activity alerts without copy trading.</p></div>${social.map(traderRowHtml).join("")}` : ""}${leaders.slice(1, 11).map((leader, index) => { const n = leader.name || leader.callerName || leader.id || `Caller ${index + 2}`; return `<div class="leader-row"><span class="leader-rank">${index + 2}</span><img class="slime-pfp" src="${slimePfp(n)}" alt=""><div class="leader-copy"><b>${escapeHtml(n)}</b><span>${escapeHtml(leader.calls || leader.resolved || 0)} resolved · best ${escapeHtml(leader.bestPeakX || "—")}x</span></div><div class="leader-hit">${Math.round(Number(leader.smoothedHitRate || leader.hitRate || 0) * 100)}%<small>hit rate</small></div></div>`; }).join("")}`;
  }
  function traderRowHtml(trader) { return `<button class="leader-row" type="button" data-open-trader="${escapeHtml(trader.username || "")}"><span class="leader-rank">◎</span><img class="slime-pfp" src="${escapeHtml(trader.avatar || slimePfp(trader.username || trader.name))}" alt=""><div class="leader-copy"><b>${escapeHtml(trader.name || trader.username)}</b><span>${escapeHtml(trader.trades || 0)} trades · ${escapeHtml(trader.realizedLabel || "building")}</span></div><div class="leader-hit">${escapeHtml(trader.roiLabel || "n/a")}<small>ROI</small></div></button>`; }
  async function openTraderProfile(username) {
    const result = await request(`/api/web/profile/public?username=${encodeURIComponent(username)}`);
    if (!result.ok || !result.data?.profile) { toast("Profile is not available.", true); return; }
    const profile = result.data.profile, follows = state.token ? await request("/api/web/profile/follows") : null;
    const following = (follows?.data?.follows || []).some((item) => item.username === profile.username);
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(profile.avatar || slimePfp(profile.username))}" alt=""><div><h2>@${escapeHtml(profile.username)}</h2><p>${escapeHtml(profile.followerCount || 0)} followers · ${escapeHtml(profile.stats.trades || 0)} public trades</p></div></div><div class="read-card"><h3>${escapeHtml(profile.stats.realizedLabel || "Building record")}</h3><p>${escapeHtml(profile.stats.roiLabel || "n/a")} ROI · ${escapeHtml(profile.stats.buys || 0)} buys · ${escapeHtml(profile.stats.sells || 0)} sells</p></div><button class="submit-trade" type="button" data-follow-trader="${escapeHtml(profile.username)}" data-following="${following ? "true" : "false"}">${following ? "Unfollow trade alerts" : "Follow trade alerts"}</button><p class="fineprint">Alerts only—following never trades for you.</p>`);
  }
  async function toggleTraderFollow(button) {
    if (!(await ensureAccount())) return;
    const follow = button.dataset.following !== "true", result = await post("/api/web/profile/follow", { username: button.dataset.followTrader, follow });
    if (result.ok && result.data?.ok) { toast(follow ? "Trade alerts followed" : "Trade alerts unfollowed"); await openTraderProfile(button.dataset.followTrader); }
    else toast(result.data?.error || "Could not update follow", true);
  }

  async function loadWalletView() {
    const panel = $("[data-profile-panel]");
    if (state.token) await Promise.all([loadWallets(), loadPositions()]);
    renderWalletHero();
    if (!state.token && state.profileTab === "social") { renderSocialProfile(); return; }
    if (!state.token) {
      panel.innerHTML = emptyState("Your mobile wallet starts here", "Tap Deposit or Receive when you are ready. SlimeWire creates the account only when you use it.");
      return;
    }
    if (state.profileTab === "positions") renderWalletPositions();
    else if (state.profileTab === "activity") loadWalletActivity();
    else if (state.profileTab === "created") loadCreatedCoins();
    else renderSocialProfile();
    if (!state.wallets.length) panel.innerHTML = emptyState("Your mobile wallet starts here", "Create a managed SlimeWire wallet to trade and keep server-side exits working while the app is closed.");
  }
  function renderWalletHero() {
    const wallet = activeWallet(), hero = $("[data-wallet-hero]");
    if (!wallet) { hero.innerHTML = `<img class="wallet-pfp" src="${slimePfp("guest")}" alt=""><h1>Slime guest</h1><p>No wallet created yet</p><div class="wallet-total">Ready when you are</div>`; return; }
    hero.innerHTML = `<img class="wallet-pfp" src="${slimePfp(wallet.publicKey)}" alt=""><h1>${escapeHtml(wallet.label || "Slime wallet")}</h1><p>${escapeHtml(short(wallet.publicKey))}</p><div class="wallet-total">◎ ${Number(wallet.sol || 0).toFixed(4)} available</div>`;
  }
  function renderSocialProfile() {
    const panel = $("[data-profile-panel]"), user = state.user || {};
    panel.innerHTML = `<div class="read-card"><h3>Your public trader profile</h3><p>Choose a username, publish your opted-in trade record, and let people follow alerts. Following never places or copies a trade.</p></div><div class="preset-editor"><div class="field"><label>Username</label><input data-profile-username value="${escapeHtml(user.username || "")}" maxlength="24" placeholder="slimetrader"></div><div class="field"><label>${user.hasPasswordLogin ? "New password (required to change username)" : "Password"}</label><input type="password" data-profile-password autocomplete="new-password" placeholder="8+ characters"></div><label class="check-row"><input type="checkbox" data-profile-public ${user.showOnTraderBoard ? "checked" : ""}> Show my opted-in trading profile publicly</label><button class="submit-trade" type="button" data-save-social-profile>Save profile</button><button class="recovery-button" type="button" data-enable-push>Enable trade alerts on this device</button><p class="fineprint" data-social-status>Profile alerts are informational only. SlimeWire will never auto-buy from a follow.</p></div>`;
  }
  async function saveSocialProfile(button) {
    if (!(await ensureAccount())) return;
    const username = String($("[data-profile-username]")?.value || "").trim(), password = String($("[data-profile-password]")?.value || "");
    if (!username || password.length < 8) { toast("Add a username and password of at least 8 characters.", true); return; }
    button.disabled = true;
    try {
      const credentials = await post("/api/web/profile/credentials", { username, password });
      if (!credentials.ok || !credentials.data?.ok) { toast(credentials.data?.error || "Could not save profile", true); return; }
      const visibility = await post("/api/web/profile/referral", { showOnTraderBoard: Boolean($("[data-profile-public]")?.checked), traderBoardWalletMode: "all" });
      if (!visibility.ok || !visibility.data?.ok) { toast(visibility.data?.error || "Could not publish profile", true); return; }
      state.user = visibility.data.user || credentials.data.user || state.user; toast("Trader profile saved"); renderSocialProfile();
    } finally { button.disabled = false; }
  }
  function urlBase64ToUint8Array(value) { const padding = "=".repeat((4 - value.length % 4) % 4), raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map((char) => char.charCodeAt(0))); }
  async function enableFunPush(button) {
    if (!(await ensureAccount())) return;
    button.disabled = true;
    try {
      const key = await request("/api/web/push/key");
      if (!key.ok || !key.data?.enabled || !key.data.publicKey) { toast("Push alerts are not configured yet.", true); return; }
      const registration = await navigator.serviceWorker.register("/sw.js"); await navigator.serviceWorker.ready;
      if (await Notification.requestPermission() !== "granted") { toast("Notification permission was not granted.", true); return; }
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key.data.publicKey) });
      const result = await post("/api/web/push/subscribe", { subscription: subscription.toJSON() });
      toast(result.ok ? "Trade alerts enabled on this device" : "Could not enable alerts", !result.ok);
    } finally { button.disabled = false; }
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
  function closeSheet() { clearTimeout(state.volumePoll); state.volumePoll = null; $("[data-sheet-overlay]").hidden = true; $("[data-sheet-content]").innerHTML = ""; }
  function toolCard(icon, label, note, action, attr = "data-tool-action") { return `<button class="tool-card" type="button" ${attr}="${escapeHtml(action)}"><img src="${TOOL_ICONS}${escapeHtml(icon)}.png" alt=""><b>${escapeHtml(label)}</b><span>${escapeHtml(note)}</span></button>`; }
  async function openTools(global = false) {
    const coin = state.selected || {}, key = coinKey(coin), creator = key && state.launches.some((launch) => String(launch.mint || launch.tokenAddress || "").toLowerCase() === key.toLowerCase());
    openSheet(`<div class="sheet-title"><img src="${global ? "/assets/slimewire/png/slimewire-mark.png" : escapeHtml(coinImage(coin))}" alt=""><div><h2>${global ? "SlimeWire tools" : `$${escapeHtml(coin.symbol || short(key))} tools`}</h2><p>Power when you need it. Clean chart when you do not.</p></div></div><div class="tool-grid">
      ${!global ? toolCard("positions", "TP / SL", "Server-side exits", "exits") : ""}
      ${!global ? toolCard("wallet", "Wallet map", "Holders and flows", "map") : ""}
      ${!global ? toolCard("warning", "Safety", "Full contract read", "safety") : ""}
      ${toolCard("trade", "Swap", "SOL and RH funding", "swap")}
      ${toolCard("pnl", "Volume bot", "Open the full rolling-wallet engine", "volume")}
      ${toolCard("bundle", "Bundle", "Multi-wallet entry", "bundle")}
      ${toolCard("kol", "Copy trade", "Follow a wallet", "copy")}
      ${toolCard("snipe", "Launch sniper", "Watch deployers", "sniper")}
      ${toolCard("launch", "Launch", "Solana or Robinhood", "launch")}
      ${toolCard("pnl", "Full portfolio", "PnL and receipts", "portfolio")}
      ${creator && coin.chain === "robinhood" ? toolCard("health", "Creator liquidity", "Your launched coin", "liquidity") : ""}
    </div><p class="fineprint">Trading automation continues server-side after this page closes. Creator liquidity appears only for coins tied to your launch history.</p>`);
  }
  function tradeStrategyPreset(name, rh = false) {
    if (name === "quick") return { tp: "25", sl: "10" };
    if (name === "protect") return { tp: "50", sl: "15", be: true };
    if (name === "ladder") return rh ? { tp: "50", sl: "15" } : { sl: "15", ladder: "smart", be: true };
    if (name === "runner") return rh ? { tp: "100", sl: "20" } : { sl: "20", trail: "20", trailArm: "25", be: true };
    return {};
  }
  function presetTradeOptions(preset = {}) {
    const ladder = Array.isArray(preset.takeProfitLadder) ? preset.takeProfitLadder : [];
    return { amount: preset.amountSol || "0.1", tp: preset.takeProfitPct || "", sl: preset.stopLossPct || "", slip: preset.slippageBps || "400", ladder: ladder.length ? "custom" : "", customLadder: ladder, presetId: preset.id || "" };
  }
  function presetSummary(preset) {
    const ladder = Array.isArray(preset.takeProfitLadder) && preset.takeProfitLadder.length;
    return `${preset.amountSol || "0.1"} SOL · ${ladder ? `${preset.takeProfitLadder.length}-step ladder` : `TP ${preset.takeProfitPct || "off"}%`} · SL ${preset.stopLossPct || "off"}%`;
  }
  async function openPresetManager(editId = "") {
    if (!(await ensureAccount())) { toast("Could not open presets.", true); return; }
    await loadPresets();
    const editing = state.presets.trade.find((preset) => preset.id === editId) || {};
    const rows = state.presets.trade.length ? state.presets.trade.map((preset) => `<div class="preset-manage-row ${preset.id === state.activePresetId ? "active" : ""}"><div><b>${escapeHtml(preset.name || "Trade preset")}${preset.id === state.activePresetId ? " · Active" : ""}</b><span>${escapeHtml(presetSummary(preset))}</span></div><div><button type="button" data-use-trade-preset="${escapeHtml(preset.id)}">Use</button><button type="button" data-edit-trade-preset="${escapeHtml(preset.id)}">Edit</button><button class="danger" type="button" data-delete-trade-preset="${escapeHtml(preset.id)}">×</button></div></div>`).join("") : '<div class="read-card"><h3>No saved presets</h3><p>Create one below for fast chart trading.</p></div>';
    const ladder = Array.isArray(editing.takeProfitLadder) ? editing.takeProfitLadder : [];
    openSheet(`<div class="sheet-title"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><div><h2>Quick-buy presets</h2><p>Add, edit, and switch without leaving the chart</p></div></div><div class="preset-manager-list">${rows}</div><div class="preset-editor"><input type="hidden" data-preset-id value="${escapeHtml(editing.id || "")}"><div class="field"><label>Name</label><input data-preset-name value="${escapeHtml(editing.name || "")}" placeholder="Fast scalp"></div><div class="field-row"><div class="field"><label>Buy SOL</label><input data-preset-amount inputmode="decimal" value="${escapeHtml(editing.amountSol || "0.1")}"></div><div class="field"><label>Slippage bps</label><input data-preset-slip inputmode="numeric" value="${escapeHtml(editing.slippageBps || "400")}"></div></div><div class="field-row"><div class="field"><label>Take profit %</label><input data-preset-tp inputmode="decimal" value="${escapeHtml(editing.takeProfitPct || "25")}"></div><div class="field"><label>Stop loss %</label><input data-preset-sl inputmode="decimal" value="${escapeHtml(editing.stopLossPct || "10")}"></div></div><details ${ladder.length ? "open" : ""}><summary>Optional profit ladder</summary><div class="field-row"><div class="field"><label>Targets %</label><input data-preset-ladder-targets value="${escapeHtml(ladder.map((stage) => stage.pct).join(", "))}" placeholder="50, 100, 200"></div><div class="field"><label>Sell % each</label><input data-preset-ladder-sells value="${escapeHtml(ladder.map((stage) => stage.sellPercent).join(", "))}" placeholder="25, 25, 25"></div></div></details><button class="submit-trade" type="button" data-save-trade-preset>${editing.id ? "Update preset" : "Save preset"}</button></div>`);
  }
  async function saveTradePreset() {
    const name = String($("[data-preset-name]")?.value || "").trim(), amountSol = String($("[data-preset-amount]")?.value || "").trim();
    if (!name || !(Number(amountSol) > 0)) { toast("Add a name and valid SOL amount.", true); return; }
    const targets = String($("[data-preset-ladder-targets]")?.value || "").split(",").map(Number).filter((value) => value > 0);
    const sells = String($("[data-preset-ladder-sells]")?.value || "").split(",").map(Number);
    const preset = { id: $("[data-preset-id]")?.value || "", name, amountSol, takeProfitPct: $("[data-preset-tp]")?.value || "", stopLossPct: $("[data-preset-sl]")?.value || "", slippageBps: $("[data-preset-slip]")?.value || "400", sellPercent: "100", sellDelay: "off", walletIndex: String(state.activeWallet || 1), takeProfitLadder: targets.slice(0, 3).map((pct, index) => ({ pct, sellPercent: sells[index] > 0 ? sells[index] : Math.floor(100 / targets.length) })) };
    const result = await post("/api/web/presets", { type: "trade", action: "save", preset });
    if (!result.ok || !result.data?.ok) { toast(result.data?.error || "Could not save preset", true); return; }
    state.presets = result.data.presets; const saved = state.presets.trade.find((item) => item.id === result.data.savedPresetId); if (saved) { state.activePresetId = saved.id; localStorage.setItem(ACTIVE_PRESET_KEY, saved.id); }
    toast(preset.id ? "Preset updated" : "Preset saved"); renderQuickTrade(); await openPresetManager();
  }
  function openTradeSheet(side = "buy", preset = {}) {
    const coin = state.selected || {}, rh = coin.chain === "robinhood", key = coinKey(coin), wallet = activeWallet();
    if (side === "buy" && activePreset()) preset = { ...presetTradeOptions(activePreset()), ...preset };
    const amount = preset.amount || (rh ? "0.05" : "0.1"), tp = preset.tp || "", sl = preset.sl || "";
    const wallets = state.wallets.length ? state.wallets.map((item) => `<option value="${item.index}" ${item.index === state.activeWallet ? "selected" : ""}>${escapeHtml(item.label || `Wallet ${item.index}`)} · ${Number(item.sol || 0).toFixed(3)} SOL</option>`).join("") : '<option value="">Create a wallet first</option>';
    const buyFields = `<div class="field"><label>${rh ? "Spend SOL · auto-converts for Robinhood" : "Buy amount · SOL"}</label><input data-trade-amount inputmode="decimal" value="${escapeHtml(amount)}" aria-label="Trade amount"><div class="amount-chips">${(rh ? ["0.01", "0.025", "0.05", "0.1"] : ["0.05", "0.1", "0.25", "0.5"]).map((value) => `<button type="button" data-amount-chip="${value}">${value}</button>`).join("")}</div></div>
      <div class="field-row"><div class="field"><label>Take profit %</label><input data-trade-tp inputmode="decimal" value="${escapeHtml(tp)}" placeholder="off"></div><div class="field"><label>Stop loss %</label><input data-trade-sl inputmode="decimal" value="${escapeHtml(sl)}" placeholder="off"></div></div>
      ${!rh ? `<details ${preset.ladder || preset.trail ? "open" : ""}><summary style="color:var(--muted);font-size:11px">Ladder, trailing stop & break-even</summary><input type="hidden" data-trade-ladder value="${escapeHtml(preset.ladder || "")}"><div class="ladder-presets"><button type="button" data-ladder-preset="" class="${preset.ladder ? "" : "active"}">Single TP</button><button type="button" data-ladder-preset="smart" class="${preset.ladder === "smart" ? "active" : ""}">25% ladder</button><button type="button" data-ladder-preset="fast" class="${preset.ladder === "fast" ? "active" : ""}">Fast ladder</button></div><div class="field-row"><div class="field"><label>Trailing stop %</label><input data-trade-trail inputmode="decimal" value="${escapeHtml(preset.trail || "")}" placeholder="off"></div><div class="field"><label>Arm after +%</label><input data-trade-trail-arm inputmode="decimal" value="${escapeHtml(preset.trailArm || "")}" placeholder="auto"></div></div><label class="check-row"><input type="checkbox" data-trade-be ${preset.be ? "checked" : ""}> Move stop to break-even after TP1</label></details>` : '<p class="fineprint">Your SOL wallet funds this trade automatically. No separate Robinhood wallet setup or manual ETH conversion is required.</p>'}`;
    const sellFields = `<div class="field"><label>Sell percent</label><input data-trade-percent inputmode="numeric" value="100"><div class="amount-chips">${[25, 50, 75, 100].map((value) => `<button type="button" data-percent-chip="${value}">${value}%</button>`).join("")}</div></div>${rh ? '<label class="check-row"><input type="checkbox" data-rh-cashout checked> Convert received ETH back to SOL automatically</label>' : ""}`;
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>${escapeHtml(coin.symbol || short(key))}</h2><p>${rh ? "Robinhood · one SOL wallet" : "Solana"} · ${escapeHtml(short(key))}</p></div></div>
      <div class="trade-toggle"><button class="${side === "buy" ? "active buy" : ""}" type="button" data-sheet-side="buy">Buy</button><button class="${side === "sell" ? "active sell" : ""}" type="button" data-sheet-side="sell">Sell</button></div>
      <div class="field"><label>Wallet</label><select data-trade-wallet>${wallets}</select></div>${side === "buy" ? buyFields : sellFields}
      <button class="submit-trade ${side}" type="button" ${wallet ? `data-submit-trade data-side="${side}"` : "data-create-wallet"}>${wallet ? `${side === "buy" ? "Buy" : "Sell"} ${escapeHtml(coin.symbol || "coin")}` : "Create wallet to trade"}</button><p class="fineprint">Review before submitting. Automated exits keep running on the server after this page closes.</p>`);
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
    await loadWallets(true); renderWalletHero(); renderWalletPositions(); if (state.view === "quick") renderQuickRoute(); toast("Wallet created. Backups downloaded—store them safely."); return true;
  }
  function downloadText(filename, text) { const blob = new Blob([text], { type: "text/plain" }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = filename || "slimewire-backup.txt"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  function downloadWalletFiles(downloads = {}) { for (const item of [downloads.encryptedBackup, downloads.recoveryKeys].filter((entry) => entry?.text)) downloadText(item.filename, item.text); }
  async function openWalletManager() {
    if (state.token) await loadWallets();
    const rows = state.wallets.length ? state.wallets.map((wallet) => `<div class="wallet-manage-row"><div><b>${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}${wallet.index === state.activeWallet ? " · Active" : ""}</b><span>${escapeHtml(short(wallet.publicKey))} · ${Number(wallet.sol || 0).toFixed(4)} SOL</span><span class="wallet-rename"><input data-wallet-rename-input="${wallet.index}" value="${escapeHtml(wallet.label || "")}" maxlength="40"><button type="button" data-rename-wallet="${wallet.index}">Rename</button></span></div><div><button type="button" data-select-wallet="${wallet.index}">Use</button> <button class="danger" type="button" data-remove-wallet="${wallet.index}" data-wallet-key="${escapeHtml(wallet.publicKey)}">Remove</button></div></div>`).join("") : '<div class="read-card"><h3>No wallet loaded</h3><p>Create a new wallet or restore one from a saved backup. Backup files download automatically.</p></div>';
    openSheet(`<div class="sheet-title"><img src="${slimePfp(activeWallet()?.publicKey || "wallet-manager")}" alt=""><div><h2>Wallet manager</h2><p>One SOL wallet trades both supported chains</p></div></div><div class="wallet-manager-list">${rows}</div><div class="wallet-manager-actions"><button type="button" data-create-wallet>+ Add wallet</button><button type="button" data-export-wallets ${state.wallets.length ? "" : "disabled"}>Download backups</button></div><div class="wallet-restore-box"><label class="file-button">Choose backup file<input type="file" data-wallet-backup-file accept=".txt,.json,application/json,text/plain" hidden></label><textarea data-wallet-backup-text placeholder="Or paste an encrypted backup, recovery file, or private key"></textarea><button class="submit-trade" type="button" data-restore-wallet>Restore / import wallet</button><p class="wallet-manager-status" data-wallet-manager-status></p></div><p class="fineprint">Each Solana wallet deterministically controls its Robinhood address. Buy with SOL; SlimeWire converts automatically. Keep both downloaded backup files private.</p>`);
  }
  async function renameWallet(index) {
    const label = String($(`[data-wallet-rename-input="${index}"]`)?.value || "").trim();
    if (!label) { toast("Enter a wallet name.", true); return; }
    const result = await post("/api/web/wallets/rename", { walletIndex: Number(index), label });
    if (!result.ok || !result.data?.ok) { toast(result.data?.error || "Could not rename wallet", true); return; }
    state.wallets = result.data.wallets || state.wallets; paintWalletPill(); renderWalletHero(); toast("Wallet renamed"); await openWalletManager();
  }
  async function exportWallets() {
    const status = $("[data-wallet-manager-status]"); if (status) status.textContent = "Building backup files…";
    if (!(await ensureAccount())) { if (status) status.textContent = "Could not open your account."; return; }
    const result = await post("/api/web/wallets/export", {});
    if (result.ok && result.data?.ok) { downloadWalletFiles(result.data.backup?.downloads); if (status) status.textContent = result.data.backup?.message || "Backups downloaded."; }
    else if (status) status.textContent = result.data?.error || "Backup failed.";
  }
  async function restoreWallet() {
    const status = $("[data-wallet-manager-status]"), text = String($("[data-wallet-backup-text]")?.value || "").trim();
    if (!text) { if (status) status.textContent = "Choose a file or paste backup text first."; return; }
    if (status) status.textContent = "Restoring wallet…";
    if (!(await ensureAccount())) { if (status) status.textContent = "Could not open your account."; return; }
    const before = state.wallets.length;
    let result = await post("/api/web/wallets/restore", { backupText: text });
    let restored = Number(result.data?.restore?.restoredCount || 0);
    if (!result.ok || !restored) {
      result = await post("/api/web/wallets/import", { secret: text, label: "Restored wallet" });
      restored = Number(result.data?.imported?.importedCount || 0);
    }
    if (result.ok && restored > 0) {
      downloadWalletFiles(result.data?.restore?.downloads || result.data?.imported?.downloads);
      await loadWallets(true); renderWalletHero(); renderWalletPositions(); toast("Wallet restored");
      if (state.view === "quick") { closeSheet(); renderQuickRoute(); } else await openWalletManager();
    } else if (status) status.textContent = result.data?.error || `No wallet was restored${before ? ". Existing wallets are unchanged." : "."}`;
  }
  async function removeWallet(index, publicKey) {
    const wallet = state.wallets.find((item) => Number(item.index) === Number(index));
    if (!wallet || !confirm(`Back up and remove ${wallet.label || `Wallet ${index}`}? This does not move its funds.`)) return;
    const result = await post("/api/web/wallets/remove", publicKey ? { publicKeys: [publicKey] } : { walletIndexes: [String(index)] });
    if (!result.ok || !result.data?.ok) { toast(result.data?.error || "Could not remove wallet", true); return; }
    downloadWalletFiles(result.data.removed?.downloads);
    if (Array.isArray(result.data.removed?.wallets)) state.wallets = result.data.removed.wallets; else await loadWallets(true);
    state.activeWallet = state.wallets[0]?.index || null; paintWalletPill(); renderWalletHero(); toast("Wallet backed up and removed"); await openWalletManager();
  }
  async function ensureTradeReady() { if (!(await ensureAccount())) return false; if (!state.wallets.length) await loadWallets(); if (!state.wallets.length) { closeSheet(); setView("wallet"); toast("Create a wallet first.", true); return false; } await ensureAutomation(); return true; }
  async function executeFunQuickBuy(button, rawAmount) {
    const amount = String(rawAmount || "").trim(), coin = state.selected || {}, key = coinKey(coin), preset = activePreset();
    if (!(Number(amount) > 0) || !key) { toast("Enter a valid SOL amount.", true); return; }
    const lockKey = `${key.toLowerCase()}:${state.activeWallet || "wallet"}`;
    if (state.quickBuyKey || state.tradeBusy) return;
    state.quickBuyKey = lockKey; state.tradeBusy = true; button.disabled = true; const oldText = button.textContent; button.textContent = "Buying…";
    try {
      if (!(await ensureTradeReady())) return;
      const walletIndex = Number(state.activeWallet), rh = coin.chain === "robinhood", tp = preset?.takeProfitPct || "", sl = preset?.stopLossPct || "";
      let result;
      if (rh) {
        result = await post("/api/web/rh/trade", { walletIndex, side: "buy", tokenAddress: key, payCurrency: "SOL", amountSol: amount, tradeAttemptId: attemptId("fun-quick-rh") });
        if (result.ok && result.data?.ok && (Number(tp) > 0 || Number(sl) > 0)) await post("/api/web/rh/guards", { walletIndex, tokenAddress: key, symbol: coin.symbol || "", takeProfitPct: tp, stopLossPct: sl, sellPercent: "100", entryPriceUsd: coin.priceUsd || 0 });
      } else {
        const ladder = Array.isArray(preset?.takeProfitLadder) ? preset.takeProfitLadder : [];
        const body = { tokenMint: key, walletIndex, amountSol: amount, slippageBps: preset?.slippageBps || "400", tradeAttemptId: attemptId("fun-quick-sol") };
        if (tp || sl || ladder.length) Object.assign(body, { autoExit: true, takeProfitPct: tp, stopLossPct: sl, sellPercent: preset?.sellPercent || "100", sellDelay: preset?.sellDelay || "off", takeProfitLadder: ladder });
        else body.disableAutoExit = true;
        result = await post("/api/web/trade/buy", body);
      }
      if (result.ok && result.data?.ok) { toast(`Bought ${coin.symbol || "coin"} · ${amount} SOL`); setTimeout(async () => { await Promise.all([loadWallets(true), loadPositions()]); renderCoinShell(); }, 1600); }
      else toast(result.data?.message || result.data?.error || "Quick buy failed", true);
    } finally { state.quickBuyKey = ""; state.tradeBusy = false; button.disabled = false; button.textContent = oldText; }
  }
  async function submitTrade(button) {
    const side = button.dataset.side, coin = state.selected || {}, key = coinKey(coin), walletIndex = Number($("[data-trade-wallet]")?.value || state.activeWallet), rh = coin.chain === "robinhood";
    if (state.tradeBusy) return;
    state.tradeBusy = true; button.disabled = true; button.textContent = "Submitting…";
    let result, cashoutWarning = false;
    try {
      if (!(await ensureTradeReady())) return;
      if (rh) {
        const body = { walletIndex, side, tokenAddress: key, tradeAttemptId: attemptId("fun-rh") };
        if (side === "buy") { body.payCurrency = "SOL"; body.amountSol = $("[data-trade-amount]").value; }
        else body.percent = $("[data-trade-percent]").value;
        result = await post("/api/web/rh/trade", body);
        if (result.ok && result.data?.ok && side === "buy" && (Number($("[data-trade-tp]")?.value) > 0 || Number($("[data-trade-sl]")?.value) > 0)) await post("/api/web/rh/guards", { walletIndex, tokenAddress: key, symbol: coin.symbol || "", takeProfitPct: $("[data-trade-tp]").value, stopLossPct: $("[data-trade-sl]").value, sellPercent: "100", entryPriceUsd: coin.priceUsd || 0 });
        if (result.ok && result.data?.ok && side === "sell" && $("[data-rh-cashout]")?.checked) {
          const cashout = await post("/api/web/rh/bridge-to-sol", { walletIndex, amountEth: "all", tradeAttemptId: attemptId("fun-rh-cashout") });
          if (!cashout.ok || !cashout.data?.ok) cashoutWarning = true;
        }
      } else {
        const body = { tokenMint: key, walletIndex, tradeAttemptId: attemptId("fun-sol"), slippageBps: side === "sell" ? "1200" : "500" };
        if (side === "buy") {
          body.amountSol = $("[data-trade-amount]").value;
          const tp = $("[data-trade-tp]")?.value || "", sl = $("[data-trade-sl]")?.value || "", trail = $("[data-trade-trail]")?.value || "", ladder = $("[data-trade-ladder]")?.value || "";
          if (tp || sl || Number(trail) > 0 || ladder) { body.autoExit = true; body.takeProfitPct = tp; body.stopLossPct = sl; body.sellPercent = "100"; body.sellDelay = "off"; if (ladder === "custom") body.takeProfitLadder = activePreset()?.takeProfitLadder || []; if (ladder === "smart") body.takeProfitLadder = [{ pct: 50, sellPercent: 25 }, { pct: 100, sellPercent: 25 }, { pct: 200, sellPercent: 25 }]; if (ladder === "fast") body.takeProfitLadder = [{ pct: 25, sellPercent: 40 }, { pct: 50, sellPercent: 35 }, { pct: 100, sellPercent: 25 }]; if (Number(trail) > 0) { body.trailingStopPct = trail; body.trailingActivatePct = $("[data-trade-trail-arm]")?.value || ""; } if ($("[data-trade-be]")?.checked) body.breakEvenAfterTp1 = true; }
          else body.disableAutoExit = true;
        } else body.percent = $("[data-trade-percent]").value;
        result = await post(`/api/web/trade/${side}`, body);
      }
      if (result.ok && result.data?.ok) { toast(cashoutWarning ? "Sold; ETH cash-out remains available in Wallet." : `${side === "buy" ? "Buy" : "Sell"} submitted`, cashoutWarning); closeSheet(); setTimeout(async () => { await Promise.all([loadWallets(true), loadPositions()]); renderCoinShell(); }, 2200); }
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

  function volumeWalletOptions() { return state.wallets.map((wallet) => `<option value="${wallet.index}" ${wallet.index === state.activeWallet ? "selected" : ""}>${escapeHtml(wallet.label || `Wallet ${wallet.index}`)} · ${Number(wallet.sol || 0).toFixed(3)} SOL</option>`).join(""); }
  async function openVolumeSheet() {
    if (!(await ensureAccount())) { toast("Connect a wallet to configure volume.", true); return; }
    await loadWallets();
    if (!state.wallets.length) { await openWalletManager(); return; }
    const coin = state.selected || {}, key = coinKey(coin), rh = coin.chain === "robinhood" || isRh(key);
    if (rh) {
      openSheet(`<div class="sheet-title"><img ${coinImageAttrs(coin)} alt=""><div><h2>Robinhood volume</h2><p>Native controls · ${escapeHtml(coin.symbol || short(key))}</p></div></div><div class="read-card"><h3>Round-trip engine</h3><p>Fund the derived Robinhood wallet from SOL, then run randomized rounds. Stop waits for the current action to finish.</p></div><div class="field"><label>Token contract</label><input data-volume-token value="${escapeHtml(key)}"></div><div class="field"><label>Wallet</label><select data-volume-wallet>${volumeWalletOptions()}</select></div><div class="field-row"><div class="field"><label>Fund from SOL first</label><input data-rh-volume-fund inputmode="decimal" value="0" placeholder="0.2"></div><div class="field"><label>Rounds</label><input data-volume-rounds inputmode="numeric" value="3"></div></div><div class="field-row"><div class="field"><label>Min ETH trade</label><input data-volume-min inputmode="decimal" value="0.002"></div><div class="field"><label>Max ETH trade</label><input data-volume-max inputmode="decimal" value="0.01"></div></div><div class="volume-actions"><button class="submit-trade" type="button" data-start-volume>Start</button><button type="button" data-stop-volume>Stop</button></div><div data-volume-status class="volume-status">Checking status…</div><p class="fineprint">Robinhood rounds use the selected derived wallet. SOL funding is converted automatically before the run when entered.</p>`);
    } else {
      openSheet(`<div class="sheet-title"><img ${coinImageAttrs(coin)} alt=""><div><h2>Rolling wallet volume</h2><p>Fresh ghost wallets · offset sells · automatic sweep</p></div></div><div class="read-card"><h3>Natural cadence controls</h3><p>Buys and sells use different points in the rolling wallet pool, varied sizes, and the selected pattern. It keeps running server-side.</p></div><div class="field"><label>Token contract</label><input data-volume-token value="${escapeHtml(key)}" placeholder="Solana contract address"></div><div class="field"><label>Fund from wallet</label><select data-volume-wallet>${volumeWalletOptions()}</select></div><div class="field-row"><div class="field"><label>Min buy SOL</label><input data-volume-min inputmode="decimal" value="0.012"></div><div class="field"><label>Max buy SOL</label><input data-volume-max inputmode="decimal" value="0.03"></div></div><div class="field-row"><div class="field"><label>Cadence</label><select data-volume-speed><option value="20">Calm</option><option value="8" selected>Natural</option><option value="3">Fast</option></select></div><div class="field"><label>Pattern</label><select data-volume-pattern><option value="organic" selected>Organic mix</option><option value="waves">Waves</option><option value="steady">Steady</option><option value="ladder">Uptrend bias</option></select></div></div><label class="check-row"><input type="checkbox" data-volume-keep-dust checked> Leave one small token residue in each retired wallet</label><label class="check-row"><input type="checkbox" data-volume-offset checked> Offset sells to older wallets</label><div class="volume-actions"><button class="submit-trade" type="button" data-start-volume>Start</button><button type="button" data-stop-volume>Stop & sweep</button></div><button class="recovery-button" type="button" data-sweep-volume>Sweep any stranded ghost wallets</button><div data-volume-status class="volume-status">Checking status…</div><p class="fineprint">Wallet addresses cannot be burned. Empty ghost wallets are drained, removed from your list, and retired automatically. Keeping residue intentionally preserves a tiny token balance.</p>`);
    }
    pollFunVolume(rh);
  }
  function volumeStatusHtml(rows = []) {
    if (!rows.length) return "No active run.";
    return rows.slice(0, 3).map((bot) => { const stats = bot.stats || {}, running = !["done", "stopped"].includes(bot.stage) && bot.status !== "completed"; return `<div class="volume-run"><b>${escapeHtml(bot.shortMint || short(bot.tokenMint))}<span>${escapeHtml(running ? bot.stage || "running" : "complete")}</span></b><p>Buys ${Number(stats.buys || 0)} · sells ${Number(stats.sells || 0)} · volume ${Number(stats.volumeSol || 0).toFixed(3)} SOL${Number(stats.sweptSol || 0) ? ` · swept ${Number(stats.sweptSol).toFixed(3)}` : ""}</p>${(bot.log || []).slice(0, 4).map((row) => `<small>${escapeHtml(typeof row === "string" ? row : row.message || "")}</small>`).join("")}</div>`; }).join("");
  }
  async function pollFunVolume(rh) {
    clearTimeout(state.volumePoll);
    const status = $("[data-volume-status]"); if (!status) return;
    const result = await request(rh ? "/api/web/rh/volume/status" : "/api/web/volume-bot");
    if (status && result.ok) status.innerHTML = rh ? (result.data?.status === "idle" ? "No active run." : `<div class="volume-run"><b>${escapeHtml(result.data?.status || "running")}</b><p>Round ${Number(result.data?.done || 0)} / ${Number(result.data?.rounds || 0)}</p>${(result.data?.trades || []).slice(-4).reverse().map((trade) => `<small>${trade.ok ? `Wallet ${trade.walletIndex} · ${escapeHtml(trade.amountEth)} ETH` : escapeHtml(trade.error || "Trade failed")}</small>`).join("")}</div>`) : volumeStatusHtml(result.data?.bots || []);
    if ($("[data-volume-status]")) state.volumePoll = setTimeout(() => pollFunVolume(rh), 4000);
  }
  async function startFunVolume(button) {
    if (!(await ensureTradeReady())) return;
    const token = String($("[data-volume-token]")?.value || "").trim(), rh = isRh(token), walletIndex = Number($("[data-volume-wallet]")?.value || state.activeWallet), min = $("[data-volume-min]")?.value || "", max = $("[data-volume-max]")?.value || "";
    if (!token || !(Number(min) > 0) || !(Number(max) >= Number(min))) { toast("Check the contract and min/max size.", true); return; }
    button.disabled = true; button.textContent = "Starting…";
    let result;
    if (rh) {
      const fundSol = Number($("[data-rh-volume-fund]")?.value || 0);
      if (fundSol > 0) {
        const funded = await post("/api/web/rh/fund-with-sol", { walletIndex, amountSol: String(fundSol), tradeAttemptId: attemptId("fun-rh-volume-fund") });
        if (!funded.ok || !funded.data?.ok) { button.disabled = false; button.textContent = "Start"; toast(funded.data?.error || "SOL funding failed", true); return; }
      }
      result = await post("/api/web/rh/volume/start", { tokenAddress: token, walletIndexes: [walletIndex], rounds: $("[data-volume-rounds]")?.value || "3", minEth: min, maxEth: max });
    } else {
      const pattern = $("[data-volume-pattern]")?.value || "organic", delaySecs = $("[data-volume-speed]")?.value || "8";
      result = await post("/api/web/volume-bot/start", { tokenMint: token, sourceWalletIndex: walletIndex, rollingWallets: true, buyAmountSol: String((Number(min) + Number(max)) / 2), minBuyAmountSol: min, maxBuyAmountSol: max, poolSize: "3", maxRounds: "250", sellPercent: "100", buyBias: pattern === "ladder" ? "75" : "55", delaySecs, slippageBps: 600, sweepBack: true, keepDust: Boolean($("[data-volume-keep-dust]")?.checked), offsetSell: Boolean($("[data-volume-offset]")?.checked), staggerPattern: pattern, tradeAttemptId: attemptId("fun-volume") });
    }
    button.disabled = false; button.textContent = "Start";
    if (result.ok && result.data?.ok) { toast("Volume run started"); pollFunVolume(rh); } else toast(result.data?.error || result.data?.message || "Could not start volume", true);
  }
  async function stopFunVolume() {
    const token = String($("[data-volume-token]")?.value || "").trim(), rh = isRh(token);
    if (rh) await post("/api/web/rh/volume/stop", {});
    else { const current = await request("/api/web/volume-bot"), run = (current.data?.bots || []).find((bot) => bot.status !== "completed" && !["done", "stopped"].includes(bot.stage)); if (!run) { toast("No active run.", true); return; } await post("/api/web/volume-bot/stop", { planId: run.id }); }
    toast(rh ? "Stopping after the current action" : "Stopping, draining, and sweeping back"); pollFunVolume(rh);
  }
  async function sweepFunVolume() { const result = await post("/api/web/wallets/sweep-background", {}); toast(result.ok && result.data?.ok ? (result.data.summary || "Background wallets swept") : (result.data?.error || "Sweep failed"), !(result.ok && result.data?.ok)); pollFunVolume(false); }
  async function openBundleSheet() {
    if (!(await ensureAccount())) return;
    await loadWallets();
    const coin = state.selected || {}, key = coinKey(coin), rh = coin.chain === "robinhood";
    if (!key) { closeSheet(); openSearch(); toast("Choose a coin for the bundle."); return; }
    const checks = state.wallets.map((wallet) => `<label class="check-row"><input type="checkbox" data-bundle-wallet value="${wallet.index}" ${wallet.index === state.activeWallet ? "checked" : ""}> ${escapeHtml(wallet.label || `Wallet ${wallet.index}`)} · ${Number(wallet.sol || 0).toFixed(3)} SOL</label>`).join("");
    openSheet(`<div class="sheet-title"><img ${coinImageAttrs(coin)} alt=""><div><h2>Bundle entry</h2><p>${escapeHtml(coin.symbol || short(key))} · native ${rh ? "Robinhood" : "Solana"} controls</p></div></div><div class="read-card"><h3>Choose wallets</h3><p>Each checked wallet submits its own entry. Review the total before starting.</p></div><div class="bundle-wallets">${checks}</div>${rh ? '<div class="field-row"><div class="field"><label>Min ETH</label><input data-bundle-min value="0.002"></div><div class="field"><label>Max ETH</label><input data-bundle-max value="0.01"></div></div>' : '<div class="field"><label>SOL per wallet</label><input data-bundle-amount value="0.1" inputmode="decimal"></div>'}<button class="submit-trade" type="button" data-submit-bundle>Submit bundle</button><p class="fineprint">Bundle entries use your managed wallets and existing backend protections. They do not require the classic layout.</p>`);
  }
  async function submitFunBundle(button) {
    if (!(await ensureTradeReady())) return;
    const coin = state.selected || {}, key = coinKey(coin), walletIndexes = $$('[data-bundle-wallet]:checked').map((input) => Number(input.value));
    if (!walletIndexes.length) { toast("Choose at least one wallet.", true); return; }
    button.disabled = true; button.textContent = "Submitting…";
    const result = coin.chain === "robinhood"
      ? await post("/api/web/rh/bundle", { tokenAddress: key, walletIndexes, minEth: $("[data-bundle-min]")?.value, maxEth: $("[data-bundle-max]")?.value, tradeAttemptId: attemptId("fun-rh-bundle") })
      : await post("/api/web/bundle/buy", { tokenMint: key, walletIndexes, amountSol: $("[data-bundle-amount]")?.value, slippageBps: 600, tradeAttemptId: attemptId("fun-bundle") });
    button.disabled = false; button.textContent = "Submit bundle";
    if (result.ok && result.data?.ok) { toast("Bundle submitted"); closeSheet(); } else toast(result.data?.error || result.data?.message || "Bundle failed", true);
  }

  function handleTool(action) {
    const coin = state.selected || {}, key = coinKey(coin);
    if (action === "exits") { openExitSheet(); return; }
    if (action === "map") { location.href = `/map?target=${encodeURIComponent(key)}`; return; }
    if (action === "safety") { const shield = state.selectedDetail?.shield || state.selectedDetail?.safety || coin.safety || {}; openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>SlimeShield safety</h2><p>${escapeHtml(coin.symbol || short(key))}</p></div></div><div class="read-card"><h3>${escapeHtml(String(shield.verdict || "Live safety read").toUpperCase())}${Number.isFinite(Number(shield.score)) ? ` · ${Math.round(Number(shield.score))}/100` : ""}</h3><p>${escapeHtml(shield.summary || "Safety data is still resolving. Trading protection and honeypot checks remain active.")}</p></div>`); return; }
    if (action === "swap") { if (key) openTradeSheet("buy"); else { closeSheet(); openSearch(); } return; }
    if (action === "bundle") { openBundleSheet(); return; }
    if (action === "portfolio") { closeSheet(); state.profileTab = "positions"; setView("wallet"); return; }
    if (action === "liquidity") { location.href = `/#rhtrade/${encodeURIComponent(key)}`; return; }
    if (action === "volume") { openVolumeSheet(); return; }
    if (action === "watch") { ensureAccount().then((ready) => ready ? post("/api/web/watchlist", { tokenMint: key, action: "add", symbol: coin.symbol || "", name: coin.name || "", imageUrl: coin.imageUrl || "" }) : { ok: false }).then((result) => toast(result.ok ? "Saved to Watchlist" : "Could not save coin", !result.ok)); closeSheet(); return; }
    if (action === "telegram") { window.open(`https://t.me/${window.OGRE_PORTAL_CONFIG?.telegramBotUsername || "SlimeWiredBot"}?start=scan_${encodeURIComponent(key)}`, "_blank", "noopener"); return; }
    const routes = { copy: "copy", sniper: "sniper", launch: "launch" };
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
    const chartInterval = event.target.closest("[data-chart-interval]"); if (chartInterval) { state.chartInterval = chartInterval.dataset.chartInterval || "15"; renderChart(); return; }
    const chartMode = event.target.closest("[data-chart-mode]"); if (chartMode) { state.chartMode = chartMode.dataset.chartMode || "chart"; renderChart(); return; }
    const postCallButton = event.target.closest("[data-post-call]"); if (postCallButton) { await postCoinCall(postCallButton.dataset.postCall, postCallButton); return; }
    const openTrader = event.target.closest("[data-open-trader]"); if (openTrader) { await openTraderProfile(openTrader.dataset.openTrader); return; }
    const followTrader = event.target.closest("[data-follow-trader]"); if (followTrader) { await toggleTraderFollow(followTrader); return; }
    const profile = event.target.closest("[data-profile]"); if (profile) { state.profileTab = profile.dataset.profile; $$("[data-profile]").forEach((button) => button.classList.toggle("active", button === profile)); loadWalletView(); return; }
    if (event.target.closest("[data-open-tools]")) { await loadCreatedCoinsSilently(); openTools(false); return; }
    if (event.target.closest("[data-open-global-tools]")) { openTools(true); return; }
    if (event.target.closest("[data-manage-presets]")) { await openPresetManager(); return; }
    if (event.target.closest("[data-save-trade-preset]")) { await saveTradePreset(); return; }
    const usePreset = event.target.closest("[data-use-trade-preset]"); if (usePreset) { state.activePresetId = usePreset.dataset.useTradePreset; localStorage.setItem(ACTIVE_PRESET_KEY, state.activePresetId); renderQuickTrade(); toast("Preset active"); await openPresetManager(); return; }
    const editPreset = event.target.closest("[data-edit-trade-preset]"); if (editPreset) { await openPresetManager(editPreset.dataset.editTradePreset); return; }
    const deletePreset = event.target.closest("[data-delete-trade-preset]"); if (deletePreset) { const id = deletePreset.dataset.deleteTradePreset; const result = await post("/api/web/presets", { type: "trade", action: "delete", id, preset: { id } }); if (result.ok && result.data?.ok) { state.presets = result.data.presets; if (state.activePresetId === id) { state.activePresetId = ""; localStorage.removeItem(ACTIVE_PRESET_KEY); } renderQuickTrade(); toast("Preset removed"); await openPresetManager(); } else toast(result.data?.error || "Could not remove preset", true); return; }
    const activatePreset = event.target.closest("[data-activate-preset]"); if (activatePreset) { state.activePresetId = activatePreset.dataset.activatePreset || ""; if (state.activePresetId) localStorage.setItem(ACTIVE_PRESET_KEY, state.activePresetId); else localStorage.removeItem(ACTIVE_PRESET_KEY); renderQuickTrade(); toast(state.activePresetId ? "Preset active" : "Manual buys active"); return; }
    const quickBuy = event.target.closest("[data-quick-buy]"); if (quickBuy) { await executeFunQuickBuy(quickBuy, quickBuy.dataset.quickBuy); return; }
    const customQuickBuy = event.target.closest("[data-custom-quick-buy]"); if (customQuickBuy) { await executeFunQuickBuy(customQuickBuy, $("[data-custom-quick-amount]")?.value); return; }
    const strategy = event.target.closest("[data-trade-strategy]"); if (strategy) { if (!state.wallets.length) await loadWallets(); openTradeSheet("buy", tradeStrategyPreset(strategy.dataset.tradeStrategy, state.selected?.chain === "robinhood")); return; }
    const trade = event.target.closest("[data-open-trade]"); if (trade) { if (!state.wallets.length) await loadWallets(); openTradeSheet(trade.dataset.openTrade); return; }
    const side = event.target.closest("[data-sheet-side]"); if (side) { openTradeSheet(side.dataset.sheetSide); return; }
    const amountChip = event.target.closest("[data-amount-chip]"); if (amountChip) { $("[data-trade-amount]").value = amountChip.dataset.amountChip; return; }
    const percentChip = event.target.closest("[data-percent-chip]"); if (percentChip) { $("[data-trade-percent]").value = percentChip.dataset.percentChip; return; }
    const ladder = event.target.closest("[data-ladder-preset]"); if (ladder) { $("[data-trade-ladder]").value = ladder.dataset.ladderPreset; $$("[data-ladder-preset]").forEach((button) => button.classList.toggle("active", button === ladder)); return; }
    const submit = event.target.closest("[data-submit-trade]"); if (submit) { await submitTrade(submit); return; }
    if (event.target.closest("[data-arm-exits]")) { await armExits(); return; }
    const tool = event.target.closest("[data-tool-action]"); if (tool) { handleTool(tool.dataset.toolAction); return; }
    const linkTool = event.target.closest("[data-link-tool]"); if (linkTool) { handleTool(linkTool.dataset.linkTool); return; }
    const quickChain = event.target.closest("[data-search-chain]"); if (quickChain) { closeSearch(); state.chain = quickChain.dataset.searchChain; $$("[data-chain]").forEach((button) => button.classList.toggle("active", button.dataset.chain === state.chain)); setView("home"); loadFeed(true); return; }
    if (event.target.closest("[data-deposit]") || event.target.closest("[data-receive]")) { walletReceive(); return; }
    if (event.target.closest("[data-manage-wallets]")) { await openWalletManager(); return; }
    const quickPanel = event.target.closest("[data-quick-panel]"); if (quickPanel) { state.quickPanel = quickPanel.dataset.quickPanel || "trade"; renderQuickRoute(); return; }
    const quickAmount = event.target.closest("[data-quick-select-amount]"); if (quickAmount) { state.quickAmount = quickAmount.dataset.quickSelectAmount || "0.1"; renderQuickRoute(); return; }
    if (event.target.closest("[data-quick-custom-focus]")) { $("[data-quick-custom-amount]")?.focus(); return; }
    if (event.target.closest("[data-quick-set-custom]")) { const amount = String($("[data-quick-custom-amount]")?.value || "").trim(); if (!(Number(amount) > 0)) { toast("Enter a valid SOL amount.", true); return; } state.quickAmount = amount; renderQuickRoute(); return; }
    if (event.target.closest("[data-quick-review]")) { if (!activeWallet()) { await openWalletManager(); return; } openTradeSheet("buy", { amount: state.quickAmount || "0.1" }); return; }
    if (event.target.closest("[data-quick-bundle]")) { await openBundleSheet(); return; }
    const saveProfile = event.target.closest("[data-save-social-profile]"); if (saveProfile) { await saveSocialProfile(saveProfile); return; }
    const enablePush = event.target.closest("[data-enable-push]"); if (enablePush) { await enableFunPush(enablePush); return; }
    if (event.target.closest("[data-create-wallet]")) { if (await createWallet()) { if (state.view === "quick") { closeSheet(); renderQuickRoute(); } else await openWalletManager(); } return; }
    if (event.target.closest("[data-export-wallets]")) { await exportWallets(); return; }
    if (event.target.closest("[data-restore-wallet]")) { await restoreWallet(); return; }
    const remove = event.target.closest("[data-remove-wallet]"); if (remove) { await removeWallet(remove.dataset.removeWallet, remove.dataset.walletKey); return; }
    const select = event.target.closest("[data-select-wallet]"); if (select) { state.activeWallet = Number(select.dataset.selectWallet); paintWalletPill(); renderWalletHero(); renderQuickTrade(); if (state.view === "quick") renderQuickRoute(); await openWalletManager(); return; }
    const rename = event.target.closest("[data-rename-wallet]"); if (rename) { await renameWallet(rename.dataset.renameWallet); return; }
    const startVolume = event.target.closest("[data-start-volume]"); if (startVolume) { await startFunVolume(startVolume); return; }
    if (event.target.closest("[data-stop-volume]")) { await stopFunVolume(); return; }
    if (event.target.closest("[data-sweep-volume]")) { await sweepFunVolume(); return; }
    const submitBundle = event.target.closest("[data-submit-bundle]"); if (submitBundle) { await submitFunBundle(submitBundle); return; }
    if (event.target.closest("[data-copy-wallet]")) { const wallet = activeWallet(); if (wallet) { await navigator.clipboard?.writeText(wallet.publicKey); toast("Wallet address copied"); } return; }
    if (event.target.closest("[data-price-alert]")) { openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(state.selected || {}))}" alt=""><div><h2>Coin alerts</h2><p>Keep the chart clean and send alerts where they matter.</p></div></div><div class="tool-grid">${toolCard("watchlist", "Watch coin", "Save to your list", "watch")}${toolCard("warning", "Telegram alert", "Open SlimeWiredBot", "telegram")}</div>`); return; }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-quick-wallet-select]")) { state.activeWallet = Number(event.target.value); paintWalletPill(); renderQuickRoute(); return; }
    if (!event.target.matches("[data-wallet-backup-file]")) return;
    const file = event.target.files?.[0], textarea = $("[data-wallet-backup-text]"), status = $("[data-wallet-manager-status]");
    if (!file || !textarea) return;
    const reader = new FileReader();
    reader.onload = () => { textarea.value = String(reader.result || "").trim(); if (status) status.textContent = `Loaded ${file.name}. Tap Restore / import wallet.`; };
    reader.onerror = () => { if (status) status.textContent = "Could not read that file. Paste the backup text instead."; };
    reader.readAsText(file);
  });
  document.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" || !event.target.matches("[data-custom-quick-amount]")) return;
    event.preventDefault(); const button = $("[data-custom-quick-buy]"); if (button) await executeFunQuickBuy(button, event.target.value);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(state.feedTimer);
    else if (state.view === "home") { void loadFeed(true, { silent: true }); scheduleFeedRefresh(); }
  });

  document.addEventListener("error", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches("[data-token-image]")) return;
    const proxy = image.dataset.proxyImage || "", direct = image.dataset.directImage || "";
    const current = image.currentSrc || image.src || "";
    if (proxy && !current.startsWith(proxy)) { image.src = proxy; return; }
    if (direct && !current.startsWith(direct) && !/(?:ipfs\/|gateway\.pinata\.cloud|ipfs\.io)/i.test(direct)) { image.src = direct; return; }
    image.removeAttribute("data-token-image");
    image.src = coinBadge({
      address: image.dataset.coinImageKey || image.closest("[data-open-coin]")?.dataset.openCoin || state.selected && coinKey(state.selected),
      symbol: image.dataset.coinSymbol || state.selected?.symbol || "?"
    });
  }, true);
  document.addEventListener("load", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches("[data-token-image]")) return;
    const key = image.dataset.coinImageKey || "";
    if (key && image.naturalWidth > 1 && !/token-mascot-|slimewire-mark/.test(image.currentSrc || image.src)) {
      state.resolvedCoinImages.set(key, image.currentSrc || image.src);
      if (state.resolvedCoinImages.size > 200) state.resolvedCoinImages.delete(state.resolvedCoinImages.keys().next().value);
    }
  }, true);

  $("[data-search-input]").addEventListener("input", (event) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(event.target.value), 280); });
  window.addEventListener("hashchange", () => { const match = location.hash.match(/^#coin\/(.+)$/); if (match) openCoin(decodeURIComponent(match[1])); });
  async function loadCreatedCoinsSilently() { if (!state.token || state.launches.length) return; const result = await request("/api/web/launches"); if (result.ok) state.launches = result.data?.coins || []; }

  async function init() {
    paintWalletPill();
    if (!IS_QUICK_ROUTE) loadFeed();
    if (state.token) Promise.all([loadMe(), loadWallets(), loadPositions(), loadPresets(), loadCreatedCoinsSilently()]).then(() => { if (state.view === "coin") renderQuickTrade(); if (state.view === "quick") renderQuickRoute(); }).catch(() => {});
    if (IS_QUICK_ROUTE) {
      setView("quick", { hideNav: true });
      renderQuickRoute();
      const params = new URLSearchParams(location.search), ca = params.get("ca") || params.get("token") || "";
      if (ca) void loadQuickTarget(ca);
    } else {
      const match = location.hash.match(/^#coin\/(.+)$/); if (match) openCoin(decodeURIComponent(match[1]));
    }
  }
  $("[data-quick-paste-form]")?.addEventListener("submit", (event) => { event.preventDefault(); void loadQuickTarget($("[data-quick-ca]")?.value); });
  $("[data-quick-clipboard]")?.addEventListener("click", async () => { try { const text = await navigator.clipboard.readText(); if ($("[data-quick-ca]")) $("[data-quick-ca]").value = text; await loadQuickTarget(text); } catch { $("[data-quick-ca]")?.focus(); toast("Paste into the field, then tap Load.", true); } });
  init();
})();
