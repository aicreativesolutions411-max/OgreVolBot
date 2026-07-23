"use strict";

(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const API_BASE = window.OGRE_PORTAL_CONFIG?.apiBase || location.origin;
  const TOKEN_KEY = "ogreWebToken";
  const RECENTS_KEY = "slimewireFunRecents";
  const ACTIVE_PRESET_KEY = "slimewireFunTradePreset";
  const ACTIVE_WALLET_KEY = "slimecashActiveWalletIndex";
  const FUN_PENDING_FUND_KEY = "slimewireFunPendingWalletFund:v1";
  const WALLET_BACKUP_MARK_PREFIX = "slimewireFunWalletBackedUp:v1:";
  const WALLET_BACKUP_REMINDER_KEY = "slimewireFunWalletBackupReminder:v1";
  const TOKEN_FALLBACK = "/assets/slimewire/png/slimewire-mark.png";
  const SLIME_PFPS = [
    "f_f648203a.png", "f_cc8f54e4.png", "f_c9dc667d.png", "f_c4f3d050.png", "f_c20374ef.png",
    "f_bb7b4bd6.png", "f_959b04a3.png", "f_94d9b765.png", "f_874a4027.png", "f_83fe78aa.png",
    "f_791eac34.png", "f_58ccc46f.png", "f_5734221c.png", "f_41fa2ec9.png", "f_392761e3.png",
    "f_378c4265.png", "f_31afd7c0.png", "f_19d62e28.png", "f_18b229f8.png", "f_03966060.png"
  ];
  const TOOL_ICONS = "/assets/slimewire/png/icons/";
  const IS_QUICK_ROUTE = /^\/quick(?:\.html)?\/?$/i.test(location.pathname) || new URLSearchParams(location.search).get("quick") === "1";
  const ROUTE_PARAMS = new URLSearchParams(location.search);
  const FROM_CASH = ROUTE_PARAMS.get("from") === "cash";
  // Referral capture (mobile visitors land here directly now): /?ref=CODE — same ggRef key the
  // desktop terminal uses, so attribution survives whichever surface the friend signs up on.
  try { const refIn = String(ROUTE_PARAMS.get("ref") || "").replace(/[^A-Za-z0-9_$.-]/g, "").slice(0, 32); if (refIn) localStorage.setItem("ggRef", refIn); } catch { /* storage blocked */ }
  const state = {
    token: localStorage.getItem(TOKEN_KEY) || "",
    user: null,
    wallets: [],
    solUsd: 0,
    activeWallet: Number(localStorage.getItem(ACTIVE_WALLET_KEY)) || null,
    chain: FROM_CASH ? "solana" : "all",
    feed: FROM_CASH ? "new" : "movers",
    rows: [],
    searchRows: [],
    selected: null,
    selectedDetail: null,
    view: "home",
    previousView: "home",
    profileTab: "positions",
    leaderTab: "top",
    traderSearch: "",
    detailTab: "setup",
    chartInterval: "15",
    chartMode: "chart",
    coinCalls: [],
    positions: [],
    rhWalletPosition: null,
    positionValuePromise: null,
    positionValueForceRequested: false,
    positionLoadVersion: 0,
    launches: [],
    tradeBusy: false,
    presets: { trade: [], bundle: [] },
    activePresetId: localStorage.getItem(ACTIVE_PRESET_KEY) || "",
    volumePoll: null,
    seasonPoll: null,
    seasonRun: null,
    seasonBusy: false,
    recents: readLocal(RECENTS_KEY, []),
    feedCache: new Map(),
    feedRequestVersion: 0,
    searchRequestVersion: 0,
    feedTimer: null,
    imageHydrateVersion: 0,
    resolvedCoinImages: new Map(),
    coinImageRetryTimers: new Map(),
    coinImageRetryAttempts: new Map(),
    rhCoinImageMisses: new Map(),
    rhCoinImageInFlight: new Map(),
    quickBuyKey: "",
    quickAmount: "0.1",
    quickPanel: "trade",
    pendingSolSend: null,
    pendingTokenSend: null,
    pendingWalletManagerAction: null,
    launchReturnView: "home",
    toolReturnView: "home",
    activeTool: "",
    deferredInstall: null
  };

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
  }
  function readLocal(key, fallback) { try { const parsed = JSON.parse(localStorage.getItem(key) || "null"); return parsed ?? fallback; } catch { return fallback; } }
  function saveLocal(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
  function walletBackupMarkKey(publicKey) { return `${WALLET_BACKUP_MARK_PREFIX}${String(publicKey || "").trim()}`; }
  function walletBackedUp(walletOrKey) {
    const publicKey = typeof walletOrKey === "string" ? walletOrKey : walletOrKey?.publicKey;
    if (!publicKey) return false;
    try { return localStorage.getItem(walletBackupMarkKey(publicKey)) === "1"; } catch { return false; }
  }
  function markWalletBackedUp(walletOrKey) {
    const publicKey = typeof walletOrKey === "string" ? walletOrKey : walletOrKey?.publicKey;
    if (!publicKey) return;
    try { localStorage.setItem(walletBackupMarkKey(publicKey), "1"); } catch {}
  }
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
    // Always paint a real image while exact metadata is resolving. Letter tiles looked like missing
    // artwork; the branded token mascot makes every row complete without pretending it is coin metadata.
    return mascot(coinKey(coin) || coin.symbol || coin.name || "token");
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
  async function resolvedCoinImageFromMetadata(image) {
    const key = image?.dataset?.coinImageKey || "";
    if (!key || image.dataset.coinImageResolving === "1") return "";
    image.dataset.coinImageResolving = "1";
    try {
      // Versioned URL evicts any old CDN/browser response that cached a normal pending lookup.
      const result = await request(`/api/web/token-avatar?mint=${encodeURIComponent(key)}&v=3`, { timeout: 7_500, noRetry: true });
      const avatar = result.data?.avatar;
      return avatar?.state === "ready" ? normalizeImageUrl(avatar.avatarUrl) : "";
    } finally { delete image.dataset.coinImageResolving; }
    return "";
  }
  function probeCoinImage(url) {
    if (!url || /token-mascot-|slimewire-mark|\/pfp\//i.test(url)) return Promise.resolve("");
    return new Promise((resolve) => {
      const probe = new Image();
      const timer = setTimeout(() => resolve(""), 5_000);
      const finish = (value) => { clearTimeout(timer); resolve(value); };
      probe.onload = () => finish(probe.naturalWidth > 1 ? url : "");
      probe.onerror = () => finish("");
      probe.referrerPolicy = "no-referrer";
      probe.src = url;
    });
  }
  async function workingCoinImage(image) {
    const metadata = await resolvedCoinImageFromMetadata(image).catch(() => "");
    const candidates = [...new Set([
      normalizeImageUrl(image?.dataset?.directImage || ""),
      metadata,
      normalizeImageUrl(image?.dataset?.proxyImage || "")
    ].filter(Boolean))];
    const tested = await Promise.all(candidates.map(probeCoinImage));
    return tested.find(Boolean) || "";
  }
  function rememberCoinImage(key, url) {
    const normalizedKey = String(key || "").toLowerCase();
    if (!normalizedKey || !url) return;
    state.resolvedCoinImages.set(normalizedKey, url);
    state.coinImageRetryAttempts.delete(normalizedKey);
    const timer = state.coinImageRetryTimers.get(normalizedKey);
    if (timer) clearTimeout(timer);
    state.coinImageRetryTimers.delete(normalizedKey);
    $$('[data-token-image]').filter((image) => image.dataset.coinImageKey === normalizedKey).forEach((image) => {
      if ((image.currentSrc || image.src) !== url) image.src = url;
    });
    if (state.resolvedCoinImages.size > 200) state.resolvedCoinImages.delete(state.resolvedCoinImages.keys().next().value);
  }
  function scheduleCoinImageRetry(image) {
    const key = String(image?.dataset?.coinImageKey || "").toLowerCase();
    if (!key || state.resolvedCoinImages.has(key) || state.coinImageRetryTimers.has(key)) return;
    const attempt = state.coinImageRetryAttempts.get(key) || 0;
    const delay = [8_000, 15_000, 30_000, 60_000][Math.min(attempt, 3)];
    state.coinImageRetryAttempts.set(key, attempt + 1);
    const timer = setTimeout(async () => {
      state.coinImageRetryTimers.delete(key);
      const target = $$('[data-token-image]').find((candidate) => candidate.dataset.coinImageKey === key);
      if (!target) return;
      const resolved = await workingCoinImage(target);
      if (resolved) rememberCoinImage(key, resolved);
      else scheduleCoinImageRetry(target);
    }, delay);
    state.coinImageRetryTimers.set(key, timer);
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
  function post(path, body, options = {}) { return request(path, { ...options, method: "POST", headers: { ...(options.headers || {}), "Content-Type": "application/json" }, body: JSON.stringify(body || {}) }); }
  function apiMessage(data, fallback) { return String(data?.message || data?.error || fallback || "Something went wrong."); }
  function setToken(token) { state.token = token || ""; if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }
  async function loadMe() { if (!state.token) return null; const result = await request("/api/web/me", { noRetry: true }); if (result.ok) state.user = result.data?.user || null; return state.user; }

  function clearTelegramLoginTicketFromUrl() {
    const clean = new URL(location.href);
    clean.searchParams.delete("tg_login");
    history.replaceState(history.state, "", `${clean.pathname}${clean.search}${clean.hash}`);
  }

  async function consumeTelegramLoginTicket() {
    const ticket = String(ROUTE_PARAMS.get("tg_login") || "").trim();
    if (!ticket) return false;
    try {
      const result = await post("/api/web/telegram-login/exchange", { ticket }, { noRetry: true, timeout: 10_000 });
      if (!result.ok || !result.data?.token) throw new Error(apiMessage(result.data, "Telegram sign-in expired. Tap the card again."));
      setToken(result.data.token);
      state.user = result.data.user || null;
      toast("Signed in from Telegram");
      return true;
    } catch (error) {
      toast(error.message || "Telegram sign-in expired. Tap the card again.", true);
      return false;
    } finally {
      clearTelegramLoginTicketFromUrl();
    }
  }

  async function ensureAccount() {
    if (state.token && state.user) return true;
    if (state.token) {
      const check = await request("/api/web/me", { noRetry: true });
      if (check.ok) { state.user = check.data?.user || check.data?.me || null; return true; }
      if (check.status !== 401) return true;
      setToken("");
    }
    const result = await post("/api/web/signup", { ref: localStorage.getItem("ggRef") || "" });
    if (result.ok && result.data?.token) { setToken(result.data.token); state.user = result.data.user || null; return true; }
    return false;
  }
  async function ensureAutomation() { if (!state.token) return; await post("/api/web/profile/automation", { action: "enable" }); }
  async function loadWallets(force = false) {
    if (!state.token) return [];
    const result = await request(`/api/web/balances${force ? "?force=true" : ""}`);
    if (result.ok && result.data?.ok) {
      state.wallets = (result.data.balances || []).filter((wallet) => !wallet.volumeBot);
      state.solUsd = Math.max(0, Number(result.data.solUsd) || state.solUsd || 0);
      if (!state.activeWallet || !state.wallets.some((wallet) => wallet.index === state.activeWallet)) state.activeWallet = state.wallets[0]?.index || null;
      if (state.activeWallet) localStorage.setItem(ACTIVE_WALLET_KEY, String(state.activeWallet));
      paintWalletPill();
      renderCashHandoff();
      renderHomeReadiness();
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
  function portfolioSolTotal() {
    const liquidSol = state.wallets.reduce((sum, wallet) => sum + Math.max(0, Number(wallet.sol) || 0), 0);
    const coinsSol = state.positions.reduce((sum, position) => {
      const value = positionEstimatedSol(position);
      return sum + (value || 0);
    }, 0);
    return { liquidSol, coinsSol, totalSol: liquidSol + coinsSol };
  }
  function compactSol(value) {
    const amount = Math.max(0, Number(value) || 0);
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
    if (amount >= 100) return amount.toFixed(1);
    if (amount >= 10) return amount.toFixed(2);
    return amount.toFixed(3);
  }
  function formatWalletUsd(value) {
    if (value == null || !Number.isFinite(Number(value))) return "—";
    const amount = Math.max(0, Number(value));
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(amount >= 10000000 ? 0 : 1)}M`;
    if (amount >= 100000) return `$${Math.round(amount / 1000)}K`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount.toFixed(2)}`;
  }
  function positionNumber(value) {
    if (value == null || value === "") return null;
    const number = Number(typeof value === "string" ? value.replaceAll(",", "") : value);
    return Number.isFinite(number) ? number : null;
  }
  function positionQuantity(position) {
    for (const value of [position?.uiAmountNum, position?.uiAmount]) {
      const number = positionNumber(value);
      if (number != null && number > 0) return number;
    }
    return null;
  }
  function positionPercent(value) {
    const cleaned = typeof value === "string" ? value.trim().replace(/%$/, "") : value;
    return positionNumber(cleaned);
  }
  function positionEstimatedSol(position) {
    const number = positionNumber(position?.estimatedValueSol);
    return number != null && number >= 0 ? number : null;
  }
  function positionOpenPnl(position) {
    const buys = positionNumber(position?.buys), spentSol = positionNumber(position?.spentSol);
    if (buys != null && buys > 0 && spentSol != null && spentSol > 0) return positionNumber(position?.openPnlSol);
    const recoveredSolCost = positionNumber(position?.costBasisSol);
    if (position?.pnlSource === "onchain-rpc" && recoveredSolCost != null && recoveredSolCost > 0) {
      return positionNumber(position?.openPnlSol);
    }
    const recoveredCost = positionNumber(position?.costBasisUsd);
    if (position?.pnlSource === "onchain-wallet" && recoveredCost != null && recoveredCost > 0) {
      return positionNumber(position?.openPnlUsd);
    }
    return null;
  }
  function positionPnlUnit(position) {
    return position?.pnlSource === "onchain-wallet" ? "USD" : "SOL";
  }
  function positionValueText(position, pendingText = "Value updating…") {
    const value = positionEstimatedSol(position);
    if (value != null) return `${formatPositionSol(value)} SOL`;
    const valueUsd = positionNumber(position?.estimatedValueUsd);
    if (valueUsd != null) return formatWalletUsd(valueUsd);
    return position?.valuePending ? pendingText : "Value unavailable";
  }
  function displayablePositions(rows) {
    return (Array.isArray(rows) ? rows : []).filter((position) => {
      const mint = String(position?.tokenMint || "").trim();
      return mint && position?.source !== "connected-wallet" && positionQuantity(position) != null;
    });
  }
  function formatTokenQuantity(value) {
    const number = positionNumber(value);
    if (number == null || number <= 0) return "";
    if (number >= 1_000_000_000) return `${(number / 1_000_000_000).toFixed(2).replace(/\.00$/, "")}B`;
    if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(2).replace(/\.00$/, "")}M`;
    if (number >= 1_000) return number.toLocaleString("en-US", { maximumFractionDigits: 4 });
    if (number >= 1) return number.toLocaleString("en-US", { maximumFractionDigits: 6 });
    return number.toLocaleString("en-US", { maximumSignificantDigits: 6 });
  }
  function formatPositionSol(value) {
    const number = positionNumber(value);
    if (number == null || number < 0) return "";
    if (number === 0) return "0";
    if (number >= 1) return number.toLocaleString("en-US", { maximumFractionDigits: 4 });
    return number.toLocaleString("en-US", { minimumFractionDigits: Math.min(4, Math.max(0, Math.ceil(-Math.log10(number)))), maximumSignificantDigits: 6 });
  }
  function paintWalletPill() {
    const pill = $(".wallet-pill"), label = $("[data-wallet-balance]");
    const wallet = activeWallet();
    pill?.classList.toggle("ready", Boolean(wallet));
    if (!label) return;
    if (!wallet) {
      label.innerHTML = `<b>${state.token ? "+ Wallet" : "Connect"}</b><small>WALLET</small>`;
      return;
    }
    label.innerHTML = `<b>${compactSol(wallet.sol)} SOL</b><small>AVAILABLE</small>`;
  }

  function renderCashHandoff() {
    const handoff = $("[data-cash-handoff]");
    if (!handoff) return;
    handoff.hidden = !FROM_CASH;
    if (!FROM_CASH) return;
    const wallet = activeWallet();
    handoff.innerHTML = `<div><span>SLIMECASH TO FUN</span><b>${wallet ? `${Number(wallet.sol || 0).toFixed(3)} SOL ready to trade` : "Your wallet is ready when you are"}</b></div><button type="button" data-open-search>Paste a CA</button>`;
  }

  function renderHomeReadiness() {
    const target = $("[data-home-readiness]");
    if (!target) return;
    const wallet = activeWallet();
    if (!wallet) {
      target.innerHTML = `<section class="readiness-card"><div><span>START HERE</span><h2>Connect, fund, and trade.</h2><p>Choose Coinbase, Phantom, Solflare, or copy a wallet address. Nothing moves until you approve it.</p></div><div class="readiness-steps"><b>1 <i>Choose source</i></b><b>2 <i>Approve SOL</i></b><b>3 <i>Trade</i></b></div><button type="button" data-wallet-entry>Connect &amp; fund</button></section>`;
      return;
    }
    const sol = Number(wallet.sol || 0);
    const backedUp = walletBackedUp(wallet);
    const { totalSol } = portfolioSolTotal();
    const totalUsd = state.solUsd > 0 ? totalSol * state.solUsd : null;
    target.innerHTML = `<section class="readiness-card ready"><div class="readiness-summary"><div><span>WALLET READY</span><h2>${sol > 0 ? `${sol.toFixed(3)} SOL ready` : "Add SOL to trade"}</h2><p>${backedUp ? (sol > 0 ? "Pick a coin and choose your amount." : "Add SOL from Phantom, Solflare, or another Solana wallet.") : "Save this wallet backup before trading on another device."}</p></div><div class="wallet-cash-total"><span>TOTAL VALUE</span><b>${formatWalletUsd(totalUsd)}</b><small>SOL + COINS</small></div></div><div class="readiness-steps"><b class="done">OK <i>Wallet</i></b><b class="${backedUp ? "done" : "needs-action"}">${backedUp ? "OK" : "2"} <i>Backup</i></b><b>${sol > 0 ? "OK" : "3"} <i>${sol > 0 ? "Funded" : "Add SOL"}</i></b></div><div class="readiness-actions"><button type="button" data-deposit>${sol > 0 ? "Add more SOL" : "Add SOL"}</button><button class="secondary" type="button" data-backup-wallet data-wallet-index="${wallet.index}" data-wallet-key="${escapeHtml(wallet.publicKey)}">${backedUp ? "Download backup again" : "Backup this wallet"}</button></div></section>`;
  }

  function normalizeSol(row) {
    return { ...row, chain: "solana", address: row.tokenMint, marketCap: Number(row.marketCap || row.marketCapUsd || row.fdv || 0), liquidity: Number(row.liquidityUsd || row.liquidity?.usd || row.reserveUsd || 0), holders: Number(row.holderCount || row.holders || row.holdersCount || 0), volume: Number(row.volumeH24 || row.volumeH1 || row.volumeUsd || row.volume5m || 0), volumeLabel: row.volumeLabel || row.volumeH1Label || row.volume5mLabel || "checking", change: Number(row.m5 ?? row.h1 ?? row.priceChange?.h1), age: ageLabel(row), imageUrl: row.imageUrl || row.avatarUrl || row.imageUri || row.logoUrl || row.meta?.imageUrl || row.metadata?.image || "" };
  }
  function normalizeRh(row) {
    const marketCap = Number(row.marketCapUsd || row.marketCap || row.mc || row.fdv || 0);
    const volume = Number(row.volume24hUsd || row.volumeH24 || row.volumeUsd || row.vol24 || row.vol1 || row.volume?.h24 || 0);
    return { ...row, chain: "robinhood", tokenMint: row.address || row.tokenMint, address: row.address || row.tokenMint, marketCap, liquidity: Number(row.liquidityUsd || row.liquidity || row.liq || row.liquidity?.usd || 0), holders: Number(row.holderCount || row.holders || row.holdersCount || 0), volume, volumeLabel: row.volumeLabel || row.volume24hLabel || (volume > 0 ? "" : "checking"), change: Number(row.priceChange1h ?? row.m5 ?? row.h1 ?? row.ch1 ?? row.priceChange24h ?? row.ch24), age: ageLabel(row), imageUrl: row.imageUrl || row.localImagePath || row.iconUrl || row.imageUri || row.logoUrl || row.metadata?.image || "" };
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
  async function fetchRhFeed(config, force = false) {
    const query = new URLSearchParams({ category: config.rh || "trending" });
    if (force) query.set("force", "true");
    const result = await request(`/api/web/rh/pairs?${query}`, { timeout: 5000 });
    return result.ok ? (result.data?.rows || []).map(normalizeRh) : [];
  }
  function sortAndDedupeFeed(rows, feed) {
    const visible = feed === "soon"
      ? rows.filter((row) => Number(row.marketCap) >= 17_000 && Number(row.marketCap) <= 40_000)
      : rows;
    const unique = [...new Map(visible.filter((row) => coinKey(row)).map((row) => [coinKey(row).toLowerCase(), row])).values()];
    // Fresh sources often emit clusters of look-alike launches. Keep the first
    // source-ranked instance in the compact feed; contract search stays complete.
    const seenLaunchNames = new Set();
    const uncluttered = unique.filter((row) => {
      if (row.chain !== "solana" || feed !== "new") return true;
      const label = `${row.symbol || ""}|${row.name || ""}`.toLowerCase().replace(/[^a-z0-9]+/g, "");
      if (!label) return true;
      if (seenLaunchNames.has(label)) return false;
      seenLaunchNames.add(label);
      return true;
    });
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
    return uncluttered.sort(feed === "new"
      ? (a, b) => feedAge(a) - feedAge(b)
      : (a, b) => (b.marketCap || 0) - (a.marketCap || 0));
  }
  function scheduleFeedRefresh(delay = state.feed === "new" ? 5000 : state.chain === "solana" ? 8000 : 10000) {
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
    if (!force && cached && Date.now() - cached.at < 15_000) { state.rows = cached.rows; hydrateSelectedFromFeed(); renderCoinList(); $(`[data-feed-note]`).textContent = `${config.note} · updated ${Math.max(1, Math.round((Date.now() - cached.at) / 1000))}s ago`; scheduleFeedRefresh(); return; }
    if (!options.silent && !state.rows.length) $("[data-coin-list]").innerHTML = '<div class="skeleton-list"></div>';
    $("[data-feed-note]").textContent = config.note;
    let rows = [];
    const hardRefresh = force && !options.silent;
    if (selectedChain === "solana") rows = await fetchSolFeed(config, hardRefresh);
    else if (selectedChain === "robinhood") rows = await fetchRhFeed(config, hardRefresh);
    else {
      const solPromise = fetchSolFeed(config, hardRefresh), rhPromise = fetchRhFeed(config, hardRefresh);
      const [sol, rh] = await Promise.all([solPromise, rhPromise]);
      const previousRows = cached?.rows?.length ? cached.rows : state.rows;
      const stableSol = sol.length ? sol : previousRows.filter((row) => row.chain === "solana");
      const stableRh = rh.length ? rh : previousRows.filter((row) => row.chain === "robinhood");
      rows = [...stableSol.slice(0, 32), ...stableRh.slice(0, 24)];
    }
    if (version !== state.feedRequestVersion || selectedChain !== state.chain || selectedFeed !== state.feed) return;
    const nextRows = sortAndDedupeFeed(rows, selectedFeed);
    // A brief provider timeout must not flash an empty market. Keep the last good rows while the
    // next refresh is already scheduled.
    state.rows = nextRows.length ? nextRows : (cached?.rows?.length ? cached.rows : state.rows);
    state.feedCache.set(cacheKey, { at: Date.now(), rows: state.rows });
    $(`[data-feed-note]`).textContent = `${config.note} · updated now`;
    hydrateSelectedFromFeed();
    renderCoinList();
    void hydrateMissingCoinArt(version);
    scheduleFeedRefresh();
  }
  async function hydrateMissingCoinArt(version) {
    state.imageHydrateVersion = version;
    // GeckoTerminal explicitly permits browser reads (CORS *) and indexes exact Robinhood contract
    // metadata before several server-side feeds. Resolve only the rows actually painted on this device,
    // with a bounded client-IP budget, then share the answer across every matching image in the page.
    const visibleKeys = new Set($$('[data-token-image][data-chain="rh"]').map((image) => image.dataset.coinImageKey).filter(Boolean));
    const rows = state.rows.filter((row) => {
      const key = coinKey(row).toLowerCase();
      const missedAt = state.rhCoinImageMisses.get(key) || 0;
      return row.chain === "robinhood" && visibleKeys.has(key) && !directCoinImage(row)
        && !state.resolvedCoinImages.has(key) && Date.now() - missedAt > 5 * 60_000;
    }).slice(0, 12);
    let cursor = 0;
    const resolveOne = async (row) => {
      const key = coinKey(row).toLowerCase();
      if (!key || state.rhCoinImageInFlight.has(key)) return state.rhCoinImageInFlight.get(key) || "";
      const task = (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4_000);
        try {
          const response = await fetch(`https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${encodeURIComponent(key)}/info`, {
            signal: controller.signal,
            headers: { "Accept": "application/json" }
          });
          if (!response.ok) return "";
          const payload = await response.json();
          const metadata = payload?.data?.attributes || {};
          if (String(metadata.address || "").toLowerCase() !== key) return "";
          const candidate = normalizeImageUrl(metadata.image_url || metadata.imageUrl || metadata.image?.large || metadata.image?.small || "");
          const working = await probeCoinImage(candidate);
          if (!working) return "";
          row.imageUrl = working;
          rememberCoinImage(key, working);
          return working;
        } catch { return ""; }
        finally { clearTimeout(timer); }
      })().finally(() => state.rhCoinImageInFlight.delete(key));
      state.rhCoinImageInFlight.set(key, task);
      const resolved = await task;
      if (!resolved) state.rhCoinImageMisses.set(key, Date.now());
      return resolved;
    };
    const workers = Array.from({ length: Math.min(4, rows.length) }, async () => {
      while (cursor < rows.length && state.imageHydrateVersion === version) {
        const row = rows[cursor++];
        await resolveOne(row);
      }
    });
    await Promise.all(workers);
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
    if (!state.rows.length) { container.innerHTML = emptyState("No coins in this view", "Try another chain or category."); return; }
    if (state.chain !== "all") { container.innerHTML = state.rows.slice(0, 18).map(coinRowHtml).join(""); return; }
    const sol = state.rows.filter((row) => row.chain === "solana").slice(0, 4);
    const rh = state.rows.filter((row) => row.chain === "robinhood").slice(0, 5);
    const shelf = (title, note, rows, chain = "") => rows.length ? `<section class="market-shelf"><div><h3>${title}</h3><p>${note}</p>${chain ? `<button class="market-shelf-action" type="button" data-chain="${chain}">See all →</button>` : ""}</div>${rows.map(coinRowHtml).join("")}</section>` : "";
    container.innerHTML = `${shelf("Fresh Solana", "Early launches with live on-chain context", sol, "solana")}${shelf("Robinhood movers", "Established movement on Robinhood Chain", rh, "robinhood")}`;
  }
  function emptyState(title, body) { return `<div class="empty-state"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><b>${escapeHtml(title)}</b><span>${escapeHtml(body || "")}</span></div>`; }

  function setView(view, options = {}) {
    if (view !== state.view) state.previousView = state.view === "coin" ? state.previousView : state.view;
    state.view = view;
    if (view !== "home") clearTimeout(state.feedTimer);
    $$("[data-view]").forEach((node) => node.classList.toggle("active", node.dataset.view === view));
    $$("[data-nav]").forEach((node) => node.classList.toggle("active", node.dataset.nav === view || (view === "coin" && node.dataset.nav === "home")));
    $(".fun-header").style.display = ["coin", "quick", "launch", "tool"].includes(view) ? "none" : "flex";
    $(".bottom-nav").style.display = options.hideNav ? "none" : "grid";
    $("[data-open-global-tools]")?.classList.toggle("active", ["launch", "tool"].includes(view));
    window.scrollTo({ top: 0, behavior: "instant" });
    if (view === "home") loadFeed();
    if (view === "leaders") loadLeaders();
    if (view === "wallet") loadWalletView();
  }
  function addRecent(coin) {
    const key = coinKey(coin); if (!key) return;
    const old = state.recents.find((item) => item.key.toLowerCase() === key.toLowerCase()) || {};
    const recent = { ...old, key, chain: coin.chain || old.chain, symbol: (coin.symbol && coin.symbol !== short(key)) ? coin.symbol : (old.symbol || short(key)), name: coin.name || old.name || "", imageUrl: coin.imageUrl || coin.avatarUrl || old.imageUrl || "", marketCap: Number(coin.marketCap || coin.mc) || old.marketCap || null, marketCapLabel: coin.marketCapLabel || old.marketCapLabel || "", liquidityUsd: Number(coin.liquidityUsd || coin.liquidity || coin.liq) || old.liquidityUsd || null, liquidityLabel: coin.liquidityLabel || old.liquidityLabel || "" };
    state.recents = [recent, ...state.recents.filter((item) => item.key.toLowerCase() !== key.toLowerCase())].slice(0, 8);
    saveLocal(RECENTS_KEY, state.recents);
  }
  async function openCoin(key, chainHint = "", options = {}) {
    const chain = chainHint === "rh" || isRh(key) ? "robinhood" : "solana";
    let coin = [...state.rows, ...state.searchRows].find((row) => coinKey(row).toLowerCase() === String(key).toLowerCase()) || { address: key, tokenMint: key, chain };
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
    const dexMarketPromise = chain === "robinhood"
      ? funDexBatch([key]).then((by) => by[key] || Object.entries(by).find(([address]) => address.toLowerCase() === String(key).toLowerCase())?.[1] || null).catch(() => null)
      : Promise.resolve(null);
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
    const [detailResult, dexMarket] = await Promise.all([detailPromise, dexMarketPromise]);
    if (detailResult.ok && detailResult.data?.ok) {
      const raw = detailResult.data.coin || detailResult.data;
      coin = chain === "robinhood" ? normalizeRh({ ...coin, ...raw, address: raw.address || key, marketCapUsd: dexMarket?.mc || raw.mc || raw.marketCapUsd, liquidityUsd: dexMarket?.liq || raw.liq || raw.liquidityUsd, volume24hUsd: dexMarket?.v24 || raw.vol24 || raw.volume24hUsd, imageUrl: coin.imageUrl || dexMarket?.img || raw.imageUrl || raw.iconUrl, priceChange1h: raw.ch1, createdAt: raw.createdAt }) : normalizeSol({ ...coin, ...raw, tokenMint: key, marketCap: raw.marketCapUsd, volumeH24: raw.volumeH24, h1: raw.changeH1 });
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
    if (!wallet) return `<div class="quick-wallet-card"><div class="quick-wallet-title"><b>Set up a wallet</b><span>Your coin stays selected</span></div><div class="quick-wallet-actions"><button class="primary" type="button" data-wallet-entry>Connect &amp; fund</button><button type="button" data-manage-wallets>Restore</button><button type="button" data-manage-wallets>Import</button></div><p class="quick-wallet-note">Fund automatically from Phantom or Solflare, use Coinbase, or copy an address for any other wallet.</p></div>`;
    const options = state.wallets.map((item) => `<option value="${item.index}" ${item.index === state.activeWallet ? "selected" : ""}>${escapeHtml(item.label || `Wallet ${item.index}`)} · ${Number(item.sol || 0).toFixed(4)} SOL</option>`).join("");
    return `<div class="quick-wallet-card"><div class="quick-wallet-title"><b>Trade wallet</b><span>${state.wallets.length} wallet${state.wallets.length === 1 ? "" : "s"} loaded</span></div><select data-quick-wallet-select>${options}</select><div class="quick-wallet-actions"><button class="primary" type="button" data-deposit>Fund</button><button type="button" data-manage-wallets>Manage wallets</button><button type="button" data-create-wallet>+ Add wallet</button></div><p class="quick-wallet-note">One SOL wallet trades both chains. Robinhood buys convert from SOL automatically.</p></div>`;
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
    $("[data-coin-mini]").innerHTML = `<div class="coin-identity"><img ${coinImageAttrs(coin)} style="background-image:url('${coinBadge(coin)}')" alt="" decoding="async" referrerpolicy="no-referrer"><div><b>${escapeHtml(coin.symbol || short(key))}</b><button class="coin-ca-button" type="button" data-copy-coin title="Copy ${escapeHtml(key)}"><span>${chain === "rh" ? "Robinhood Chain" : "Solana"} · ${escapeHtml(short(key))}</span><i>▣</i></button></div></div><div class="coin-head-quote"><b>${formatUsd(coin.marketCap || coin.mc)}</b><span class="${Number(coin.change) >= 0 ? "up" : "down"}">${formatPct(coin.change)} · 1H</span></div>`;
    $("[data-coin-stats]").innerHTML = `<div><span>Market cap</span><b>${formatUsd(coin.marketCap || coin.mc)}</b></div><div><span>Liquidity</span><b>${formatUsd(coin.liquidity || coin.liq || coin.liquidityUsd)}</b></div><div><span>Holders</span><b>${Number(coin.holders || coin.holderCount) > 0 ? Number(coin.holders || coin.holderCount).toLocaleString() : "checking"}</b></div><div><span>Volume</span><b>${coin.volume > 0 ? formatUsd(coin.volume) : escapeHtml(coin.volumeLabel || "checking")}</b></div>`;
    $(`[data-coin-mini] .coin-head-quote`)?.insertAdjacentHTML("beforebegin", `<a class="coin-community-link" href="/community?ca=${encodeURIComponent(key)}">Community</a>`);
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
    frame.dataset.token = key;
    frame.dataset.chain = coin.chain === "robinhood" ? "robinhood" : "solana";
    frame.dataset.poolAddress = String(coin.pairAddress || "");
    // Feed/search rows are normalized around the selected base token. Passing the
    // known pool lets indicator candles skip a redundant provider lookup.
    frame.dataset.tokenSide = "base";
    if (frame.dataset.src === src && frame.querySelector("iframe")) return;
    frame.dataset.src = src;
    frame.innerHTML = `<div class="chart-loader"><span></span><p>Loading ${state.chartMode === "transactions" ? "transactions" : "live chart"}</p></div><iframe src="${src}" title="${escapeHtml(coin.symbol || "coin")} ${state.chartMode}" loading="eager" onload="this.previousElementSibling?.remove()"></iframe>`;
    document.dispatchEvent(new CustomEvent("slimewire:chart-rendered", { detail: { key, chain: frame.dataset.chain, poolAddress: frame.dataset.poolAddress } }));
  }
  window.SlimeWireFunChart = {
    render: renderChart,
    setMode(mode) {
      state.chartMode = mode === "transactions" ? "transactions" : "chart";
      renderChart();
    }
  };
  function paintPositionSurfaces() {
    paintWalletPill();
    renderHomeReadiness();
    if (state.view === "wallet" && state.profileTab === "positions") renderWalletPositions();
    if (state.view === "coin") renderPositionCard();
  }
  async function loadValuedPositions(version, options = {}) {
    const requestedForce = Boolean(options.force);
    if (state.positionValuePromise) {
      // A completed trade must not lose its forced refresh just because the
      // initial background valuation request is still finishing. Coalesce all
      // overlapping callers into one guaranteed follow-up.
      if (requestedForce) state.positionValueForceRequested = true;
      return state.positionValuePromise;
    }
    const force = requestedForce || state.positionValueForceRequested;
    state.positionValueForceRequested = false;
    const authToken = state.token;
    let needsFreshFollowup = false;
    const refresh = (async () => {
      const result = await request(`/api/web/positions${force ? "?force=true" : ""}`);
      if (!authToken || authToken !== state.token || version !== state.positionLoadVersion || !result.ok || !result.data?.ok) return state.positions;
      needsFreshFollowup = !force && Boolean(result.data.stale || result.data.backgroundRefreshing);
      state.positions = displayablePositions(result.data.positions);
      paintPositionSurfaces();
      return state.positions;
    })();
    state.positionValuePromise = refresh;
    try {
      return await refresh;
    } finally {
      if (state.positionValuePromise === refresh) state.positionValuePromise = null;
      if (version !== state.positionLoadVersion || state.positionValueForceRequested) {
        void loadValuedPositions(state.positionLoadVersion, { force: state.positionValueForceRequested });
      }
      else if (needsFreshFollowup && authToken === state.token) void loadValuedPositions(version, { force: true });
    }
  }
  async function loadPositions(options = {}) {
    if (!state.token) return [];
    const authToken = state.token;
    const version = ++state.positionLoadVersion;
    const result = await request(`/api/web/positions?fast=true${options.force ? "&force=true" : ""}`);
    if (authToken !== state.token || version !== state.positionLoadVersion) return state.positions;
    if (result.ok && result.data?.ok) state.positions = displayablePositions(result.data.positions);
    paintPositionSurfaces();
    void loadValuedPositions(version, { force: Boolean(options.force) });
    return state.positions;
  }
  function currentPosition() { const key = coinKey(state.selected); return state.positions.find((position) => String(position.tokenMint || "").toLowerCase() === key.toLowerCase()) || null; }
  function renderQuickTrade() {
    const wallet = activeWallet(), amounts = ["0.1", "0.5", "1"], preset = activePreset();
    const balance = wallet ? `${Number(wallet.sol || 0).toFixed(4)} SOL` : "Connect wallet";
    const presetChips = state.presets.trade.slice(0, 4).map((item) => `<button type="button" class="preset-chip ${item.id === state.activePresetId ? "active" : ""}" data-activate-preset="${escapeHtml(item.id)}">${escapeHtml(item.name)}</button>`).join("");
    $("[data-quick-trade]").innerHTML = `<div class="quick-wallet-line"><span>Available <b>${escapeHtml(balance)}</b></span><button type="button" data-nav="wallet">${wallet ? escapeHtml(wallet.label || "Wallet") : "Set up"} ›</button></div><div class="quick-buy-row">${amounts.map((amount) => `<button type="button" data-review-buy="${amount}">Review ${amount} SOL</button>`).join("")}</div><div class="quick-custom"><input data-custom-review-amount inputmode="decimal" placeholder="Custom SOL" aria-label="Custom SOL amount"><button type="button" data-custom-review-buy>Review</button></div>${presetChips ? `<div class="preset-chips"><button type="button" class="preset-chip ${preset ? "" : "active"}" data-activate-preset="">Manual</button>${presetChips}</div>` : ""}<button class="preset-strip" type="button" data-manage-presets><span>${preset ? `Preset · ${escapeHtml(preset.name)}` : "Preset · Manual"}</span><b>${preset ? `${escapeHtml(preset.takeProfitPct || "off")}% TP · ${escapeHtml(preset.stopLossPct || "off")}% SL` : "Add or edit ›"}</b></button>`;
  }
  function renderPositionCard() {
    const position = currentPosition(), card = $("[data-position-card]");
    if (!position) { card.className = "position-card empty"; card.innerHTML = "No open SlimeWire position on this coin yet. Your chart and safety read stay available."; return; }
    const quantity = positionQuantity(position);
    if (quantity == null) { card.className = "position-card empty"; card.innerHTML = "No open SlimeWire position on this coin yet. Your chart and safety read stay available."; return; }
    const valueSol = positionEstimatedSol(position), pnl = positionOpenPnl(position), pnlUnit = positionPnlUnit(position), pct = pnl == null ? null : positionPercent(position.openPnlPercent), cls = pnl == null ? "" : (pnl >= 0 ? "up" : "down");
    card.className = "position-card";
    card.innerHTML = `<div class="pos-head"><span>YOUR POSITION</span><span>${escapeHtml(position.walletCount || 1)} wallet${Number(position.walletCount) === 1 ? "" : "s"}</span></div><div class="pos-main"><div><b>${valueSol != null ? `◎ ${escapeHtml(formatPositionSol(valueSol))} SOL` : escapeHtml(positionValueText(position))}</b><span>${escapeHtml(formatTokenQuantity(quantity))} ${escapeHtml(position.symbol || state.selected?.symbol || "tokens")}</span></div><strong class="${cls}">${pnl != null ? (pnlUnit === "USD" ? `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(2)}` : `${pnl >= 0 ? "+" : ""}${pnl.toFixed(4)} SOL`) : ""}<small>${pct != null ? ` ${formatPct(pct)}` : ""}</small></strong></div>`;
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
    if (state.leaderTab === "following") {
      if (!state.token) {
        hero.innerHTML = emptyState("Your followed traders live here", "Create a profile or log in, then follow any public username.");
        list.innerHTML = '<button class="submit-trade discover-login" type="button" data-nav="wallet">Open Profile</button>';
        return;
      }
      const result = await request("/api/web/profile/follows");
      const follows = result.ok ? (result.data?.follows || []) : [];
      hero.innerHTML = `<div class="read-card discover-summary"><span>FOLLOWING</span><h3>${follows.length} trader${follows.length === 1 ? "" : "s"}</h3><p>Open a profile for public proof, or unfollow directly from this list.</p></div>`;
      list.innerHTML = follows.length ? follows.map((trader) => traderActionRowHtml(trader, true)).join("") : emptyState("No followed traders yet", "Search a username above or explore Top traders.");
      return;
    }
    const [result, socialResult] = await Promise.all([request("/api/web/proof"), request("/api/web/slimewire-traders")]);
    const leaders = result.ok ? (result.data?.topCallers || []) : [], social = socialResult.ok ? (socialResult.data?.traders || []) : [];
    if (!leaders.length && !social.length) { hero.innerHTML = emptyState("Caller proof is warming", "Check again after tracked calls resolve."); list.innerHTML = ""; return; }
    if (!leaders.length) { const firstSocial = social[0]; hero.innerHTML = `<button class="leader-card" type="button" data-open-trader="${escapeHtml(firstSocial.username)}"><div class="leader-name"><img class="slime-pfp" src="${escapeHtml(firstSocial.avatar || slimePfp(firstSocial.username))}" alt=""><div><h3>${escapeHtml(firstSocial.name)}</h3><p>${escapeHtml(firstSocial.trades || 0)} public trades · follow alerts only</p></div></div><div class="leader-score">${escapeHtml(firstSocial.roiLabel || "building")}<small>public profile</small></div></button>`; list.innerHTML = social.slice(1).map(traderRowHtml).join(""); return; }
    const first = leaders[0], name = first.name || first.callerName || first.id || "Top caller";
    hero.innerHTML = `<div class="leader-card"><div class="leader-name"><img class="slime-pfp" src="${slimePfp(name)}" alt=""><div><h3>${escapeHtml(name)}</h3><p>${escapeHtml(first.calls || first.resolved || 0)} tracked calls · public receipts</p></div></div><div class="leader-score">${Math.round(Number(first.smoothedHitRate || first.hitRate || 0) * 100)}% <small>verified hit rate</small></div></div>`;
    list.innerHTML = `${social.length ? `<div class="read-card"><h3>Trader profiles</h3><p>Follow activity alerts without copy trading.</p></div>${social.map(traderRowHtml).join("")}` : ""}${leaders.slice(1, 11).map((leader, index) => { const n = leader.name || leader.callerName || leader.id || `Caller ${index + 2}`; return `<div class="leader-row"><span class="leader-rank">${index + 2}</span><img class="slime-pfp" src="${slimePfp(n)}" alt=""><div class="leader-copy"><b>${escapeHtml(n)}</b><span>${escapeHtml(leader.calls || leader.resolved || 0)} resolved · best ${escapeHtml(leader.bestPeakX || "—")}x</span></div><div class="leader-hit">${Math.round(Number(leader.smoothedHitRate || leader.hitRate || 0) * 100)}%<small>hit rate</small></div></div>`; }).join("")}`;
  }
  function traderRowHtml(trader) { return `<button class="leader-row" type="button" data-open-trader="${escapeHtml(trader.username || "")}"><span class="leader-rank">◎</span><img class="slime-pfp" src="${escapeHtml(trader.avatar || slimePfp(trader.username || trader.name))}" alt=""><div class="leader-copy"><b>${escapeHtml(trader.name || trader.username)}</b><span>${escapeHtml(trader.trades || 0)} trades · ${escapeHtml(trader.realizedLabel || "building")}</span></div><div class="leader-hit">${escapeHtml(trader.roiLabel || "n/a")}<small>ROI</small></div></button>`; }
  function traderActionRowHtml(trader, following = false) {
    const username = trader.username || "", detail = trader.trades != null ? `${trader.trades || 0} trades · ${trader.realizedLabel || "building"}` : trader.followerCount != null ? `${trader.followerCount || 0} followers · public profile` : "Public trader profile";
    return `<div class="trader-result"><button class="trader-result-main" type="button" data-open-trader="${escapeHtml(username)}"><img class="slime-pfp" src="${escapeHtml(trader.avatar || slimePfp(username || trader.name))}" alt=""><span><b>@${escapeHtml(username)}</b><small>${escapeHtml(detail)}</small></span></button><button class="follow-chip ${following ? "following" : ""}" type="button" data-follow-trader="${escapeHtml(username)}" data-following="${following ? "true" : "false"}">${following ? "Following" : "Follow"}</button></div>`;
  }
  async function searchTraders(rawQuery) {
    const query = String(rawQuery || "").trim().replace(/^@+/, "");
    if (!query) { state.traderSearch = ""; state.leaderTab = "top"; syncLeaderTabs(); await loadLeaders(); return; }
    state.traderSearch = query; state.leaderTab = "search"; syncLeaderTabs();
    const hero = $("[data-leader-hero]"), list = $("[data-leader-list]");
    hero.innerHTML = '<div class="skeleton-list" style="height:100px"></div>'; list.innerHTML = '<div class="skeleton-list"></div>';
    const [result, followResult] = await Promise.all([request(`/api/web/profile/search?q=${encodeURIComponent(query)}`), state.token ? request("/api/web/profile/follows") : Promise.resolve(null)]);
    const traders = result.ok ? (result.data?.traders || []) : [], followed = new Set((followResult?.data?.follows || []).map((item) => String(item.username || "").toLowerCase()));
    hero.innerHTML = `<div class="read-card discover-summary"><span>USERNAME SEARCH</span><h3>${traders.length ? `${traders.length} result${traders.length === 1 ? "" : "s"}` : "No public match"}</h3><p>${traders.length ? `Profiles matching @${escapeHtml(query)}. Following sends alerts only.` : `Try the trader's exact SlimeWire username.`}</p></div>`;
    list.innerHTML = traders.length ? traders.map((trader) => traderActionRowHtml(trader, followed.has(String(trader.username || "").toLowerCase()))).join("") : emptyState("No trader found", "Only public SlimeWire profiles appear in username search.");
  }
  function syncLeaderTabs() { $$('[data-leader-tab]').forEach((button) => button.classList.toggle("active", button.dataset.leaderTab === state.leaderTab)); }
  async function openTraderProfile(username) {
    const result = await request(`/api/web/profile/public?username=${encodeURIComponent(username)}`);
    if (!result.ok || !result.data?.profile) { toast("Profile is not available.", true); return; }
    const profile = result.data.profile, follows = state.token ? await request("/api/web/profile/follows") : null;
    const following = (follows?.data?.follows || []).some((item) => item.username === profile.username);
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(profile.avatar || slimePfp(profile.username))}" alt=""><div><h2>@${escapeHtml(profile.username)}</h2><p>${escapeHtml(profile.followerCount || 0)} followers · ${escapeHtml(profile.stats.trades || 0)} public trades</p></div></div><div class="read-card"><h3>${escapeHtml(profile.stats.realizedLabel || "Building record")}</h3><p>${escapeHtml(profile.stats.roiLabel || "n/a")} ROI · ${escapeHtml(profile.stats.buys || 0)} buys · ${escapeHtml(profile.stats.sells || 0)} sells</p></div><button class="submit-trade" type="button" data-follow-trader="${escapeHtml(profile.username)}" data-following="${following ? "true" : "false"}">${following ? "Unfollow trade alerts" : "Follow trade alerts"}</button><p class="fineprint">Alerts only—following never trades for you.</p>`);
  }
  async function toggleTraderFollow(button) {
    if (!state.token && !(await ensureAccount())) return;
    const follow = button.dataset.following !== "true", result = await post("/api/web/profile/follow", { username: button.dataset.followTrader, follow });
    if (result.ok && result.data?.ok) {
      toast(follow ? "Trade alerts followed" : "Trade alerts unfollowed");
      if (button.closest("[data-sheet-content]")) await openTraderProfile(button.dataset.followTrader);
      else if (state.leaderTab === "following") await loadLeaders();
      else { button.dataset.following = follow ? "true" : "false"; button.textContent = follow ? "Following" : "Follow"; button.classList.toggle("following", follow); }
    }
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
    if (state.profileTab === "positions") { renderWalletPositions(); void loadFunRhPositions(); }
    else if (state.profileTab === "activity") loadWalletActivity();
    else if (state.profileTab === "created") loadCreatedCoins();
    else renderSocialProfile();
    if (!state.wallets.length && state.profileTab !== "social") panel.innerHTML = emptyState("Your mobile wallet starts here", "Create a managed SlimeWire wallet to trade and keep server-side exits working while the app is closed.");
  }
  function renderWalletHero() {
    const wallet = activeWallet(), hero = $("[data-wallet-hero]");
    if (!wallet) { hero.innerHTML = `<img class="wallet-pfp" src="${slimePfp("guest")}" alt=""><h1>Slime guest</h1><p>No wallet created yet</p><div class="wallet-total">Ready when you are</div>`; return; }
    const sol = positionNumber(wallet.sol) ?? 0;
    hero.innerHTML = `<img class="wallet-pfp" src="${slimePfp(wallet.publicKey)}" alt=""><h1>${escapeHtml(wallet.label || "Slime wallet")}</h1><button class="wallet-hero-address" type="button" data-copy-wallet-address="${escapeHtml(wallet.publicKey)}" aria-label="Copy full wallet address"><b>${escapeHtml(short(wallet.publicKey))}</b><span>Tap to copy full address</span></button><div class="wallet-total-line"><div class="wallet-total"><b>◎ ${sol.toFixed(4)} SOL</b><span>Available in this wallet</span></div><button class="wallet-backup-button" type="button" data-backup-wallet data-wallet-index="${wallet.index}" data-wallet-key="${escapeHtml(wallet.publicKey)}">Backup wallet</button></div>`;
  }
  function renderSocialProfile() {
    const panel = $("[data-profile-panel]"), user = state.user || {};
    if (!state.token) {
      panel.innerHTML = `<div class="read-card account-welcome"><span>YOUR SLIMEWIRE PROFILE</span><h3>Keep your wallets, referrals, and settings together.</h3><p>Create a profile for a clean login on any device, or log in to bring your account back.</p><div class="account-actions"><button class="submit-trade" type="button" data-fun-account="create">Create profile</button><button class="recovery-button" type="button" data-fun-account="login">Log in</button></div></div><p class="fineprint">You can still browse without an account. A wallet is only created when you ask for one.</p>`;
      return;
    }
    const tracker = user.referralTracker || {}, rows = Array.isArray(tracker.rows) ? tracker.rows : [];
    const trackerRows = rows.slice(0, 20).map((row) => `<div class="referral-row"><span><b>${escapeHtml(row.profileName || "Referral")}</b><small>${escapeHtml(row.shortWallet || "No wallet yet")} · ${Number(row.tradeCount || 0)} trades</small></span><strong>${escapeHtml(row.volumeSol || "0")} SOL<small>${escapeHtml(row.earnedSol || "0")} SOL earned</small></strong></div>`).join("");
    const earnedSol = user.referralStats?.totalSol || "0";
    const namingCard = user.username ? "" : `<div class="read-card account-welcome"><span>PROFILE SETUP</span><h3>Create a profile or log in.</h3><p>Name and secure the wallets already on this account, or log in to an existing SlimeWire profile.</p><div class="field"><label>Profile name</label><input data-profile-username minlength="2" maxlength="24" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="Choose a profile name"></div><div class="field"><label>Password</label><input data-profile-password type="password" autocomplete="new-password" placeholder="8+ characters"></div><div class="account-actions"><button class="submit-trade" type="button" data-save-social-profile>Create profile</button><button class="recovery-button" type="button" data-fun-account="login">Log in</button></div><p class="fineprint">Creating a profile keeps your current wallets and settings. Logging in opens an existing profile.</p></div>`;
    panel.innerHTML = `<div class="read-card account-status"><span>ACCOUNT</span><h3>${escapeHtml(user.username ? `@${user.username}` : "Profile not named yet")}</h3><p>${user.hasPasswordLogin ? "Login protected · available on your other devices" : "Add a username and password so this profile can be recovered anywhere."}</p></div><div class="read-card"><h3>Invite &amp; earn 💸</h3><p>Choose a clean link ending, then share it. When invited traders trade, your referral earnings are tracked here.</p><div class="field referral-link-field"><label>Your link</label><input readonly value="${escapeHtml(user.referralLink || location.origin)}"></div><div class="field"><label>Custom link ending</label><input data-referral-code value="${escapeHtml(user.referralCode || "")}" maxlength="32" placeholder="YOURNAME"></div><div class="account-actions"><button class="submit-trade" type="button" data-save-referral-code>Save link</button><button class="recovery-button" type="button" data-copy-invite>Copy invite link</button></div></div><div class="referral-stats"><div><b>${Number(tracker.count || 0)}</b><span>Referrals</span></div><div><b>${Number(tracker.activeCount || 0)}</b><span>Active</span></div><div><b>${escapeHtml(tracker.volumeSol || "0")}</b><span>SOL volume</span></div><div><b>${escapeHtml(earnedSol)}</b><span>SOL earned</span></div></div><details class="profile-drawer"><summary>Referral tracker <span>${Number(tracker.count || 0)} users</span></summary><div class="profile-drawer-body">${trackerRows || '<p>No referrals yet. Your first signup will appear here even before they trade.</p>'}</div></details><details class="profile-drawer"><summary>Referral payout wallet <span>${user.referralPayoutWallet ? escapeHtml(short(user.referralPayoutWallet)) : "Set wallet"}</span></summary><div class="profile-drawer-body"><p>Your earned fees are paid to this Solana wallet. Leave it blank to use your main SlimeWire wallet.</p><div class="field"><label>Payout wallet</label><input data-referral-payout value="${escapeHtml(user.referralPayoutWallet || "")}" placeholder="Solana wallet address"></div><button class="submit-trade" type="button" data-save-referral-payout>Save payout wallet</button></div></details><div class="read-card"><h3>Your public trader profile</h3><p>Publish only your opted-in trade record and let people follow alerts. Following never places or copies a trade.</p></div><div class="preset-editor"><div class="field"><label>Username</label><input data-profile-username value="${escapeHtml(user.username || "")}" minlength="2" maxlength="24" placeholder="slimetrader"></div><div class="field"><label>${user.hasPasswordLogin ? "New password (only needed to change login)" : "Password"}</label><input type="password" data-profile-password autocomplete="new-password" placeholder="8+ characters"></div><label class="check-row"><input type="checkbox" data-profile-public ${user.showOnTraderBoard ? "checked" : ""}> Show my opted-in trading profile publicly</label><button class="submit-trade" type="button" data-save-social-profile>Save profile</button><button class="recovery-button" type="button" data-enable-push>Enable trade alerts on this device</button><button class="recovery-button danger-button" type="button" data-fun-sign-out>Sign out on this device</button><p class="fineprint" data-social-status>Profile alerts are informational only. SlimeWire will never auto-buy from a follow.</p></div><a class="fineprint" style="display:block;text-align:center;padding:14px 0 4px" href="/?desktop=1">🖥 Switch to the desktop site</a>`;
    if (namingCard) {
      panel.insertAdjacentHTML("afterbegin", namingCard);
      const statusCard = panel.querySelector(".account-status");
      if (statusCard) statusCard.remove();
      const oldEditor = panel.querySelector(".preset-editor");
      if (oldEditor) oldEditor.querySelectorAll("[data-profile-username], [data-profile-password], [data-save-social-profile]").forEach((node) => {
        const field = node.closest(".field");
        (field || node).hidden = true;
      });
    }
  }
  async function saveSocialProfile(button) {
    const username = String($("[data-profile-username]")?.value || "").trim(), password = String($("[data-profile-password]")?.value || "");
    if (!/^[a-z0-9][a-z0-9_.-]{1,23}$/i.test(username)) { toast("Username must be 2–24 letters, numbers, dots, dashes, or underscores.", true); return; }
    const credentialsChanged = username.toLowerCase() !== String(state.user?.username || "").toLowerCase() || Boolean(password);
    if (credentialsChanged && password.length < 8) { toast("Use a password of at least 8 characters to change your login.", true); return; }
    button.disabled = true;
    try {
      let credentials = { data: { user: state.user } };
      if (credentialsChanged) {
        credentials = await post("/api/web/profile/credentials", { username, password });
        if (!credentials.ok || !credentials.data?.ok) { toast(apiMessage(credentials.data, "Could not save profile"), true); return; }
        await downloadFunAccountBackup();
      }
      const visibility = await post("/api/web/profile/referral", { showOnTraderBoard: Boolean($("[data-profile-public]")?.checked), traderBoardWalletMode: "all" });
      if (!visibility.ok || !visibility.data?.ok) { toast(apiMessage(visibility.data, "Could not publish profile"), true); return; }
      state.user = visibility.data.user || credentials.data.user || state.user; toast("Trader profile saved"); renderSocialProfile();
    } finally { button.disabled = false; }
  }
  function openFunAccount(mode = "login") {
    const create = mode === "create";
    openSheet(`<div class="sheet-title"><img src="${slimePfp(create ? "create-profile" : "login-profile")}" alt=""><div><h2>${create ? "Create your profile" : "Welcome back"}</h2><p>${create ? "One login for wallets, referrals, and settings" : "Log in to restore your SlimeWire account"}</p></div></div><div class="field"><label>Username</label><input data-fun-account-user autocomplete="username" minlength="2" maxlength="24" autocapitalize="off" spellcheck="false" placeholder="slimetrader"></div><div class="field"><label>Password</label><input data-fun-account-pass type="password" autocomplete="${create ? "new-password" : "current-password"}" placeholder="8+ characters"></div><button class="submit-trade" type="button" data-submit-fun-account="${create ? "create" : "login"}">${create ? "Create profile" : "Log in"}</button><button class="recovery-button" type="button" data-fun-account="${create ? "login" : "create"}">${create ? "Already have one? Log in" : "New here? Create profile"}</button><p class="fineprint" data-fun-account-status>${create ? "Creating a profile does not create or fund a wallet." : "Use the same username and password you saved before."}</p>`);
  }
  async function submitFunAccount(button, mode) {
    const username = String($("[data-fun-account-user]")?.value || "").trim(), password = String($("[data-fun-account-pass]")?.value || ""), status = $("[data-fun-account-status]");
    if (!/^[a-z0-9][a-z0-9_.-]{1,23}$/i.test(username)) { status.textContent = "Username must be 2–24 letters, numbers, dots, dashes, or underscores."; return; }
    if (password.length < 8) { status.textContent = "Password must be at least 8 characters."; return; }
    button.disabled = true; button.textContent = mode === "create" ? "Creating…" : "Logging in…";
    const result = await post(mode === "create" ? "/api/web/signup" : "/api/web/password-login", { username, password, ref: localStorage.getItem("ggRef") || "" });
    if (!result.ok || !result.data?.ok || !result.data?.token) { status.textContent = result.status === 0 ? "Could not reach SlimeWire. Check your connection and try again." : apiMessage(result.data, mode === "create" ? "Could not create profile." : "Could not log in."); button.disabled = false; button.textContent = mode === "create" ? "Create profile" : "Log in"; return; }
    setToken(result.data.token); state.user = result.data.user || null; closeSheet();
    if (mode === "create") await downloadFunAccountBackup();
    await Promise.all([loadMe(), loadWallets(), loadPresets(), loadPositions()]);
    renderWalletHero(); renderSocialProfile(); paintWalletPill(); toast(mode === "create" ? "Profile created" : "Welcome back");
  }
  async function saveFunReferralCode(button) {
    const code = String($("[data-referral-code]")?.value || "").trim();
    if (!/^[a-z0-9][a-z0-9_-]{2,31}$/i.test(code)) { toast("Use 3–32 letters, numbers, dashes, or underscores.", true); return; }
    button.disabled = true; button.textContent = "Saving…";
    const result = await post("/api/web/profile/referral", { code });
    button.disabled = false; button.textContent = "Save link";
    if (!result.ok || !result.data?.ok) { toast(apiMessage(result.data, "Could not save that link"), true); return; }
    state.user = result.data.user || state.user; renderSocialProfile(); toast("Referral link updated");
  }
  async function saveFunReferralPayout(button) {
    const wallet = String($("[data-referral-payout]")?.value || "").trim();
    button.disabled = true; button.textContent = "Saving…";
    const result = await post("/api/web/profile/referral", wallet ? { wallet } : { clearPayout: true });
    button.disabled = false; button.textContent = "Save payout wallet";
    if (!result.ok || !result.data?.ok) { toast(apiMessage(result.data, "Could not save payout wallet"), true); return; }
    state.user = result.data.user || state.user; renderSocialProfile(); toast(wallet ? "Payout wallet saved" : "Using your main wallet for payouts");
  }
  function urlBase64ToUint8Array(value) { const padding = "=".repeat((4 - value.length % 4) % 4), raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from([...raw].map((char) => char.charCodeAt(0))); }
  async function enableFunPush(button) {
    if (!(await ensureAccount())) return;
    button.disabled = true;
    try {
      const key = await request("/api/web/push/key");
      if (!key.ok || !key.data?.enabled || !key.data.publicKey) { toast("Push alerts are not configured yet.", true); return; }
      const registration = await navigator.serviceWorker.register("/fun-sw.js", { scope: "/fun/", updateViaCache: "none" }); await navigator.serviceWorker.ready;
      if (await Notification.requestPermission() !== "granted") { toast("Notification permission was not granted.", true); return; }
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(key.data.publicKey) });
      const result = await post("/api/web/push/subscribe", { subscription: subscription.toJSON() });
      toast(result.ok ? "Trade alerts enabled on this device" : "Could not enable alerts", !result.ok);
    } finally { button.disabled = false; }
  }
  function renderWalletPositions() {
    const panel = $("[data-profile-panel]");
    const groups = state.wallets.map((wallet) => ({ wallet, summary: walletAssetSummary(wallet) })).filter((group) => group.summary.assets.length);
    const groupsHtml = groups.map(({ wallet, summary }) => {
      const coinValue = summary.coinsSol > 0 ? `${formatPositionSol(summary.coinsSol)} SOL` : (summary.hasPendingValue ? "Pricing…" : "0 SOL");
      const rows = summary.assets.map((asset) => {
        const pnlPercent = positionOpenPnl(asset) == null ? null : positionPercent(asset.openPnlPercent);
        const pnlClass = pnlPercent == null ? "" : (pnlPercent >= 0 ? "up" : "down");
        return `
        <article class="fun-wallet-position-row">
          <button class="fun-position-coin" type="button" data-open-coin="${escapeHtml(asset.tokenMint)}" data-chain-kind="sol">
            <img ${coinImageAttrs(asset)} alt="">
            <span><b>${escapeHtml(asset.symbol || short(asset.tokenMint))}</b><small>${escapeHtml(formatTokenQuantity(asset.quantity))} tokens</small></span>
            <strong><span>${asset.valueSol == null ? "Pricing…" : `${escapeHtml(formatPositionSol(asset.valueSol))} SOL`}</span><small class="position-holding-pnl ${pnlClass}">${pnlPercent == null ? "PnL —" : `${escapeHtml(formatPct(pnlPercent))} PnL`}</small></strong>
          </button>
          <div class="fun-position-sell-grid">
            ${[25, 50, 100].map((percent) => `<button type="button" class="${percent === 100 ? "danger" : ""}" data-fun-position-sell="${escapeHtml(asset.tokenMint)}" data-fun-position-percent="${percent}" data-fun-position-wallet="${escapeHtml(wallet.publicKey)}" data-fun-position-wallet-label="${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}">${percent}%</button>`).join("")}
            <button type="button" data-fun-position-custom="${escapeHtml(asset.tokenMint)}" data-fun-position-wallet="${escapeHtml(wallet.publicKey)}" data-fun-position-wallet-label="${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}" data-fun-position-symbol="${escapeHtml(asset.symbol || short(asset.tokenMint))}">Custom</button>
          </div>
          <button class="fun-position-send" type="button" data-fun-send-token="${escapeHtml(asset.tokenMint)}" data-fun-send-wallet-index="${wallet.index}" data-fun-send-wallet="${escapeHtml(wallet.publicKey)}" data-fun-send-wallet-label="${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}" data-fun-send-symbol="${escapeHtml(asset.symbol || short(asset.tokenMint))}" data-fun-send-balance="${escapeHtml(String(asset.quantity))}">Send tokens</button>
        </article>`;
      }).join("");
      return `<section class="fun-wallet-position-group"><header><span><b>${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}</b><button class="fun-wallet-group-address" type="button" data-copy-wallet-address="${escapeHtml(wallet.publicKey)}">${escapeHtml(short(wallet.publicKey))} · Copy</button></span><strong>${escapeHtml(coinValue)}</strong></header>${rows}</section>`;
    }).join("");
    const rh = state.rhWalletPosition;
    const active = activeWallet();
    const rhRows = rh && active && Number(rh.walletIndex) === Number(active.index)
      ? (rh.tokens || []).filter((token) => Number(token.uiAmount || 0) > 0).map((token) => {
          const pnl = positionNumber(token.pnlPercent);
          const pnlClass = pnl == null ? "" : (pnl >= 0 ? "up" : "down");
          return `<article class="fun-wallet-position-row">
            <button class="fun-position-coin" type="button" data-open-coin="${escapeHtml(token.address)}" data-chain-kind="robinhood">
              <img ${coinImageAttrs({ ...token, chain: "robinhood", tokenMint: token.address, imageUrl: token.iconUrl })} alt="">
              <span><b>${escapeHtml(token.symbol || short(token.address))}</b><small>${escapeHtml(formatTokenQuantity(token.uiAmount))} tokens · RH</small></span>
              <strong><span>${token.valueUsd == null ? "Pricing…" : escapeHtml(formatWalletUsd(token.valueUsd))}</span><small class="position-holding-pnl ${pnlClass}">${pnl == null ? "PnL —" : `${escapeHtml(formatPct(pnl))} PnL`}</small></strong>
            </button>
            <button class="fun-position-send" type="button" data-fun-send-token="${escapeHtml(token.address)}" data-fun-send-chain="robinhood" data-fun-send-wallet-index="${active.index}" data-fun-send-wallet="${escapeHtml(active.publicKey)}" data-fun-send-wallet-label="${escapeHtml(active.label || `Wallet ${active.index}`)}" data-fun-send-symbol="${escapeHtml(token.symbol || short(token.address))}" data-fun-send-balance="${escapeHtml(String(token.uiAmount))}">Send tokens</button>
          </article>`;
        }).join("") : "";
    const rhHtml = rhRows ? `<section class="fun-wallet-position-group"><header><span><b>Robinhood Chain</b><small>${escapeHtml(short(rh.address || ""))}</small></span><strong>${escapeHtml(String(rh.eth || "0"))} ETH</strong></header>${rhRows}</section>` : "";
    panel.innerHTML = `<div class="position-actions"><button type="button" data-send-sol>Send SOL</button><button type="button" data-receive>Receive</button></div>${groupsHtml || (!rhHtml ? emptyState("No open positions", "Coins you buy through SlimeWire appear here.") : "")}${rhHtml}`;
  }

  async function loadFunRhPositions(force = false) {
    const wallet = activeWallet();
    if (!state.token || !wallet) { state.rhWalletPosition = null; return null; }
    if (!force && state.rhWalletPosition && Number(state.rhWalletPosition.walletIndex) === Number(wallet.index)) return state.rhWalletPosition;
    const result = await request(`/api/web/rh/wallet?walletIndex=${encodeURIComponent(wallet.index)}`);
    if (!result.ok || !result.data?.ok || Number(activeWallet()?.index) !== Number(wallet.index)) return null;
    state.rhWalletPosition = { ...result.data, walletIndex: wallet.index };
    if (state.view === "wallet" && state.profileTab === "positions") renderWalletPositions();
    return state.rhWalletPosition;
  }

  function openFunWalletPositionCustom(button) {
    const mint = String(button.dataset.funPositionCustom || "");
    const walletPublicKey = String(button.dataset.funPositionWallet || "");
    const walletLabel = String(button.dataset.funPositionWalletLabel || "Wallet");
    const symbol = String(button.dataset.funPositionSymbol || short(mint));
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(mascot(mint))}" alt=""><div><h2>Custom sell</h2><p>${escapeHtml(symbol)} · ${escapeHtml(walletLabel)}</p></div></div><div class="field"><label>Percent to sell from this wallet</label><input data-fun-custom-sell-percent inputmode="numeric" type="number" min="1" max="100" step="1" value="100"><div class="amount-chips">${[10, 25, 50, 75, 100].map((percent) => `<button type="button" data-fun-custom-percent="${percent}">${percent}%</button>`).join("")}</div></div><button class="submit-trade sell" type="button" data-fun-position-sell="${escapeHtml(mint)}" data-fun-position-percent="custom" data-fun-position-wallet="${escapeHtml(walletPublicKey)}" data-fun-position-wallet-label="${escapeHtml(walletLabel)}">Review custom sell</button><p class="fineprint">Only this wallet is sold. Your other wallets holding ${escapeHtml(symbol)} stay untouched.</p>`);
  }

  async function sellFunWalletPosition(button) {
    if (!(await ensureTradeReady())) return;
    const tokenMint = String(button.dataset.funPositionSell || "").trim();
    const walletPublicKey = String(button.dataset.funPositionWallet || "").trim();
    const walletLabel = String(button.dataset.funPositionWalletLabel || "Wallet").trim();
    const rawPercent = button.dataset.funPositionPercent === "custom" ? $("[data-fun-custom-sell-percent]")?.value : button.dataset.funPositionPercent;
    const percent = Number.parseInt(String(rawPercent || ""), 10);
    if (!tokenMint || !walletPublicKey || !Number.isInteger(percent) || percent < 1 || percent > 100) { toast("Choose a sell percent from 1 to 100.", true); return; }
    if (!confirm(`Sell ${percent}% from ${walletLabel}? Other wallets stay untouched.`)) return;
    button.disabled = true;
    const oldText = button.textContent;
    button.textContent = "Selling…";
    const result = await post("/api/web/bundle/sell", { tokenMint, walletIndexes: [], walletPublicKeys: [walletPublicKey], percent, slippageBps: "400", manualSellAttemptId: attemptId("fun-wallet-sell") });
    if (result.ok && result.data?.ok && Number(result.data.bundle?.successCount || 0) > 0) {
      toast(`Sold ${percent}% from ${walletLabel}`);
      closeSheet();
      await Promise.all([loadWallets(true), loadPositions({ force: true })]);
      renderWalletPositions();
    } else {
      const failure = result.data?.bundle?.results?.find((row) => !row.ok)?.message;
      toast(failure || result.data?.message || result.data?.error || "Sell failed", true);
      button.disabled = false;
      button.textContent = oldText;
    }
  }

  function tokenSendDisplayAmount(balance, percent) {
    const value = Number(balance) * Number(percent) / 100;
    if (!Number.isFinite(value) || value <= 0) return "";
    return value.toLocaleString("en-US", { useGrouping: false, maximumSignificantDigits: 12 });
  }

  function openFunTokenSend(button) {
    const tokenMint = String(button.dataset.funSendToken || "").trim();
    const chain = button.dataset.funSendChain === "robinhood" ? "robinhood" : "solana";
    const walletIndex = Number(button.dataset.funSendWalletIndex || 0);
    const walletPublicKey = String(button.dataset.funSendWallet || "").trim();
    const walletLabel = String(button.dataset.funSendWalletLabel || "Wallet").trim();
    const symbol = String(button.dataset.funSendSymbol || short(tokenMint)).trim();
    const balance = Number(button.dataset.funSendBalance || 0);
    if (!tokenMint || !walletIndex || !walletPublicKey || !(balance > 0)) {
      toast("Refresh this position before sending.", true);
      return;
    }
    state.pendingTokenSend = {
      chain, tokenMint, walletIndex, walletPublicKey, walletLabel, symbol, balance,
      percent: 100, amount: tokenSendDisplayAmount(balance, 100), destination: "", sendAttemptId: ""
    };
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage({ tokenMint }))}" alt=""><div><h2>Send ${escapeHtml(symbol)}</h2><p>${escapeHtml(walletLabel)} · ${escapeHtml(formatTokenQuantity(balance))} available</p></div></div>
      <div class="field"><label>Amount</label><input data-send-token-amount inputmode="decimal" value="${escapeHtml(state.pendingTokenSend.amount)}" data-send-token-percent="100"><div class="amount-chips">${[25, 50, 100].map((percent) => `<button type="button" class="${percent === 100 ? "active" : ""}" data-set-send-token-percent="${percent}">${percent}%</button>`).join("")}</div></div>
      <div class="field"><label>Destination ${chain === "robinhood" ? "Robinhood Chain" : "Solana"} wallet</label><input data-send-token-destination autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${chain === "robinhood" ? "0x…" : "Paste wallet address"}"></div>
      <button class="submit-trade" type="button" data-review-token-send>Review send</button>
      <p class="fineprint">This transfers ${escapeHtml(symbol)} as tokens. It does not sell or swap them. On-chain transfers cannot be reversed.</p>`);
  }

  function reviewFunTokenSend() {
    const pending = state.pendingTokenSend;
    if (!pending) return;
    const amountInput = $("[data-send-token-amount]");
    const destination = String($("[data-send-token-destination]")?.value || "").trim();
    const amount = String(amountInput?.value || "").trim();
    const percent = Number(amountInput?.dataset.sendTokenPercent || 0);
    const validDestination = pending.chain === "robinhood"
      ? /^0x[0-9a-fA-F]{40}$/.test(destination)
      : /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(destination);
    if (!validDestination) {
      toast(`Enter a valid ${pending.chain === "robinhood" ? "Robinhood Chain" : "Solana"} wallet address.`, true);
      return;
    }
    if (!(Number(amount) > 0) || Number(amount) > pending.balance * 1.000000001) {
      toast("Enter an amount within this wallet's token balance.", true);
      return;
    }
    state.pendingTokenSend = {
      ...pending, destination, amount, percent: percent > 0 ? percent : 0,
      sendAttemptId: attemptId("fun-token-send")
    };
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage({ tokenMint: pending.tokenMint }))}" alt=""><div><h2>Confirm token send</h2><p>${escapeHtml(pending.symbol)} · ${escapeHtml(pending.walletLabel)}</p></div></div>
      <div class="read-card"><h3>${escapeHtml(amount)} ${escapeHtml(pending.symbol)}</h3><p>To ${escapeHtml(short(destination))}</p></div>
      <button class="submit-trade" type="button" data-confirm-token-send>Send tokens</button>
      <p class="fineprint">Check the token, amount, chain, and destination carefully. This cannot be reversed.</p>`);
  }

  async function confirmFunTokenSend(button) {
    const pending = state.pendingTokenSend;
    if (!pending || button.disabled) return;
    button.disabled = true;
    button.textContent = "Sending…";
    const isRh = pending.chain === "robinhood";
    const result = await post(isRh ? "/api/web/rh/send-token" : "/api/web/wallets/send-token", {
      walletIndex: pending.walletIndex,
      walletPublicKey: pending.walletPublicKey,
      ...(isRh ? { tokenAddress: pending.tokenMint } : { tokenMint: pending.tokenMint }),
      destination: pending.destination,
      ...(pending.percent > 0 ? { percent: pending.percent } : { amount: pending.amount }),
      sendAttemptId: pending.sendAttemptId
    }, { timeout: 95_000, noRetry: true });
    if (!result.ok || !result.data?.ok) {
      button.disabled = false;
      button.textContent = "Send tokens";
      toast(apiMessage(result.data, "Token send failed."), true);
      return;
    }
    const sent = result.data.transfer?.amount || pending.amount;
    state.pendingTokenSend = null;
    await Promise.all([loadWallets(true), loadPositions({ force: true }), isRh ? loadFunRhPositions(true) : Promise.resolve(null)]);
    renderWalletHero();
    renderWalletPositions();
    closeSheet();
    toast(`${sent} ${pending.symbol} sent`);
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
    if (!state.launches.length) { panel.innerHTML = emptyState("No launches yet", "Coins launched through SlimeWire appear here with creator-only controls."); return; }
    const pumpLaunches = state.launches.filter((coin) => String(coin.rail || "pump").toLowerCase() === "pump" && coin.devWalletIndex);
    const lastClaim = pumpLaunches.find((coin) => Number(coin.creatorFeeClaimedSol || 0) > 0);
    const pendingVolume = pumpLaunches.reduce((sum, coin) => sum + Number(coin.creatorFeePendingVolumeSol || 0), 0);
    const feeCard = pumpLaunches.length ? `<div class="read-card account-status"><span>PUMP CREATOR FEES</span><h3>${lastClaim ? `${Number(lastClaim.creatorFeeClaimedSol).toFixed(6)} SOL claimed last` : "Accruing on-chain"}</h3><p>Pump creator fees are separate from SlimeWire trade fees. Auto-claim watches new activity, or claim a coin now. ${pendingVolume > 0 ? `${pendingVolume.toFixed(3)} SOL of new trade volume is waiting for the next automatic check.` : "An empty claim is never shown as earnings."}</p></div>` : "";
    panel.innerHTML = feeCard + state.launches.map((coin) => {
      const key = coin.mint || coin.tokenAddress || coin.address || "", rh = ["robinhood", "rh"].includes(String(coin.rail || "").toLowerCase()) || isRh(key);
      const feeStatus = rh ? ({ claimed: "Sushi fees sent to creator", watching: "Sushi fees auto-collecting", nothing_to_claim: "No Sushi fees yet", failed: "Sushi fee retry queued", creator_wallet_missing: "Creator wallet unavailable" }[String(coin.rhPoolFeeStatus || "watching")] || "Sushi fees auto-collecting") : ({ claimed: "Claimed", watching: "Watching", nothing_to_claim: "No fees yet", failed: "Claim retry available", activity_unavailable: "Checking activity" }[String(coin.creatorFeeStatus || "watching")] || "Watching");
      const claim = !rh && coin.devWalletIndex ? `<button class="recovery-button" type="button" data-claim-creator-fees="${Number(coin.devWalletIndex)}" data-claim-creator-mint="${escapeHtml(key)}">Claim fees</button>` : "";
      return `<div class="created-coin-wrap"><button class="coin-row" type="button" data-open-coin="${escapeHtml(key)}" data-chain-kind="${rh ? "rh" : "sol"}"><span class="coin-avatar"><img src="${escapeHtml(coin.imageUri || mascot(key))}" alt=""></span><span class="coin-info"><span class="coin-title"><b>${escapeHtml(coin.symbol || short(key))}</b><span>${escapeHtml(coin.name || "")}</span></span><span class="coin-meta"><i>${escapeHtml(coin.rail || "Solana")}</i><i>${escapeHtml(feeStatus)}</i></span></span><span class="coin-value"><b>Open</b><span>CREATOR</span></span></button>${claim}</div>`;
    }).join("");
  }

  async function claimFunCreatorFees(button) {
    if (!(await ensureTradeReady()) || button.disabled) return;
    const walletIndex = Number(button.dataset.claimCreatorFees || 0), mint = String(button.dataset.claimCreatorMint || "");
    if (!walletIndex || !mint) { toast("Creator wallet is unavailable.", true); return; }
    button.disabled = true; button.textContent = "Claiming…";
    const result = await post("/api/web/launch/claim-fees", { walletIndex, rail: "pump", mint, tradeAttemptId: attemptId("fun-claim-creator-fees") }, { timeout: 75_000, noRetry: true });
    if (result.ok && result.data?.ok) {
      const claimed = Number(result.data.claimedSol || 0);
      toast(claimed > 0 ? `${claimed.toFixed(6)} SOL creator fees claimed` : "Creator-fee claim confirmed");
      await loadCreatedCoins();
    } else {
      button.disabled = false; button.textContent = "Claim fees";
      toast(apiMessage(result.data, "No Pump creator fees are ready yet."), true);
    }
  }

  function openSearch() {
    const overlay = $("[data-search-overlay]"), input = $("[data-search-input]"); overlay.hidden = false; renderSearchHome(); setTimeout(() => input.focus(), 30);
  }
  function closeSearch() { state.searchRequestVersion += 1; $("[data-search-overlay]").hidden = true; $("[data-search-input]").value = ""; }
  function renderSearchHome(refreshLive = true) {
    const content = $("[data-search-content]");
    // Big names doing well: the highest-liquidity coins from the live feed, one tap to open.
    const topLiq = (state.rows || []).filter((row) => Number(row.liquidityUsd) > 0).sort((a, b) => Number(b.liquidityUsd) - Number(a.liquidityUsd)).slice(0, 6);
    content.innerHTML = `<h3>Recent searches</h3><div class="recent-list">${state.recents.length ? state.recents.map((item) => { const rh = item.chain === "robinhood", mc = item.marketCapLabel || formatUsd(item.marketCap); return `<button type="button" data-open-coin="${escapeHtml(item.key)}" data-chain-kind="${rh ? "rh" : "sol"}"><span class="recent-avatar"><img src="${escapeHtml(item.imageUrl || mascot(item.key))}" alt=""><i class="chain-badge ${rh ? "rh" : "sol"}">${rh ? "RH" : "SOL"}</i></span><span><b>${escapeHtml(item.symbol || short(item.key))}</b><small>${escapeHtml((item.name ? `${item.name} · ` : "") + short(item.key))}</small></span><em>${mc !== "—" ? `MC ${escapeHtml(mc)}` : "recent"}</em></button>`; }).join("") : '<span style="color:var(--muted);font-size:11px">Your recent coins stay on this device.</span>'}</div>${topLiq.length ? `<h3 style="margin-top:24px">💧 Top liquidity</h3><div class="coin-list">${topLiq.map(coinRowHtml).join("")}</div>` : ""}<h3 style="margin-top:24px">Quick routes</h3><div class="tool-grid"><button class="tool-card" type="button" data-search-chain="solana"><b>Solana movers</b><span>Live market feed</span></button><button class="tool-card" type="button" data-search-chain="robinhood"><b>Robinhood</b><span>New chain coins</span></button><button class="tool-card" type="button" data-nav="leaders"><b>Discover traders</b><span>Follow alerts · public proof</span></button></div>`;
    if (refreshLive && state.recents.length) {
      const version = ++state.searchRequestVersion;
      refreshRecentSearches().then((changed) => {
        const input = $("[data-search-input]");
        if (!changed || version !== state.searchRequestVersion || !input || input.value.trim() || $("[data-search-overlay]").hidden) return;
        renderSearchHome(false);
      });
    }
  }
  let searchTimer = null;
  function normalizeSearchCoin(row = {}) {
    const key = String(row.address || row.tokenMint || row.key || "").trim();
    const chain = String(row.chain || "").toLowerCase();
    return chain === "robinhood" || chain === "rh" || isRh(key)
      ? normalizeRh({ ...row, address: key, tokenMint: key })
      : normalizeSol({ ...row, tokenMint: key, address: key });
  }
  function mergeSearchCoin(current, incoming) {
    if (!current) return incoming;
    const merged = { ...current, ...incoming };
    for (const field of ["marketCap", "liquidity", "holders", "volume"]) {
      merged[field] = Number(incoming[field]) > 0 ? Number(incoming[field]) : Number(current[field] || 0);
    }
    merged.imageUrl = directCoinImage(incoming) || directCoinImage(current) || "";
    merged.volumeLabel = merged.volume > 0 ? "" : (incoming.volumeLabel || current.volumeLabel || "checking");
    return merged;
  }
  function addSearchMatches(target, incoming) {
    for (const raw of (incoming || [])) {
      const coin = normalizeSearchCoin(raw), key = coinKey(coin).toLowerCase();
      if (!key) continue;
      const index = target.findIndex((item) => coinKey(item).toLowerCase() === key);
      if (index >= 0) target[index] = mergeSearchCoin(target[index], coin);
      else target.push(coin);
    }
  }
  function searchRelevance(coin, rawQuery) {
    const q = String(rawQuery || "").trim().replace(/^\$+/, "").toLowerCase(), qn = q.replace(/\s+/g, "");
    const symbol = String(coin.symbol || "").toLowerCase(), name = String(coin.name || "").toLowerCase(), nn = name.replace(/\s+/g, "");
    const key = coinKey(coin).toLowerCase();
    if (key === q) return 5;
    if (symbol === q || nn === qn) return 4;
    if (symbol.startsWith(q) || name.startsWith(q) || nn.startsWith(qn)) return 3;
    return symbol.includes(q) || name.includes(q) || nn.includes(qn) ? 2 : 0;
  }
  function sortSearchMatches(matches, query) {
    return matches.sort((a, b) => searchRelevance(b, query) - searchRelevance(a, query) || searchRank(a, b));
  }
  function localSearchMatches(query) {
    const q = String(query || "").trim().replace(/^\$+/, "").toLowerCase();
    if (!q) return [];
    const pool = [...state.rows];
    for (const entry of state.feedCache.values()) pool.push(...(entry?.rows || []));
    pool.push(...state.recents.map((item) => ({ ...item, address: item.key, tokenMint: item.key })));
    const matches = [];
    addSearchMatches(matches, pool.filter((row) => searchRelevance(normalizeSearchCoin(row), q) > 0));
    return sortSearchMatches(matches, q).slice(0, 14);
  }
  function searchCoinRowHtml(coin, index = 0) {
    const key = coinKey(coin), chain = coin.chain === "robinhood" ? "rh" : "sol";
    const change = Number(coin.change), changeClass = Number.isFinite(change) ? (change >= 0 ? "up" : "down") : "";
    return `<button class="coin-row search-coin-row" type="button" data-open-coin="${escapeHtml(key)}" data-chain-kind="${chain}"><span class="coin-avatar" style="background-image:url('${coinBadge(coin)}')"><img ${coinImageAttrs(coin)} alt="" loading="${index < 8 ? "eager" : "lazy"}" decoding="async" referrerpolicy="no-referrer"><i class="chain-badge ${chain}">${chain === "rh" ? "RH" : "SOL"}</i></span><span class="coin-info"><span class="coin-title"><b>${escapeHtml(coin.symbol || short(key))}</b><span>${escapeHtml(coin.name || "")}</span></span><span class="coin-meta"><i>24h ${escapeHtml(coin.volume > 0 ? formatUsd(coin.volume) : (coin.volumeLabel || "loading"))}</i><i>Liq ${escapeHtml(formatUsd(coin.liquidity))}</i><i class="${changeClass}">${escapeHtml(formatPct(change))}</i></span></span><span class="coin-value"><b>${escapeHtml(formatUsd(coin.marketCap))}</b><span>MARKET CAP</span></span></button>`;
  }
  function renderSearchMatches(content, matches, query, pending = false) {
    const rows = sortSearchMatches(matches.slice(), query).slice(0, 14);
    state.searchRows = rows;
    content.innerHTML = rows.length
      ? `<h3>Results · ${pending ? "updating live data" : "live market data"}</h3><div class="coin-list">${rows.map(searchCoinRowHtml).join("")}</div>`
      : (pending ? '<div class="skeleton-list"></div>' : emptyState("No exact match", "Paste the full Solana or Robinhood contract address."));
  }
  // Name/ticker search hits DexScreener straight from the phone (the server IP is rate-limited,
  // the user's isn't), then falls back to the backend. "cashcow" matches "Cash Cow" via
  // space-stripped comparison; results always order top liquidity -> lowest.
  async function clientTokenSearch(q) {
    try {
      const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`, { headers: { Accept: "application/json" } });
      const data = await res.json();
      const qq = q.toLowerCase(), qn = qq.replace(/\s+/g, "");
      const seen = new Set(), out = [];
      for (const p of (data.pairs || [])) {
        const chain = String(p.chainId || "").toLowerCase();
        if (chain !== "solana" && chain !== "robinhood") continue;
        const b = p.baseToken || {}; const mint = String(b.address || ""); if (!mint) continue;
        const key = `${chain}:${mint.toLowerCase()}`; if (seen.has(key)) continue;
        const sym = String(b.symbol || "").toLowerCase(), nm = String(b.name || "").toLowerCase(), nmn = nm.replace(/\s+/g, "");
        if (!(sym.includes(qq) || nm.includes(qq) || (qn && (sym.includes(qn) || nmn.includes(qn))))) continue;
        seen.add(key);
        out.push({ tokenMint: mint, address: mint, chain, symbol: b.symbol || "", name: b.name || "", imageUrl: (p.info && p.info.imageUrl) || "", liquidityUsd: Number((p.liquidity && p.liquidity.usd) || 0), volumeUsd: Number((p.volume && p.volume.h24) || 0), marketCap: Number(p.marketCap || p.fdv || 0) });
      }
      out.sort(searchRank);
      return out.slice(0, 14);
    } catch { return null; }
  }
  // Rank by market cap (big names first), liquidity as the tiebreak for coins with no MC yet.
  function searchRank(a, b) { return (Number(b.marketCap || b.marketCapUsd || 0) || Number(b.liquidityUsd || 0)) - (Number(a.marketCap || a.marketCapUsd || 0) || Number(a.liquidityUsd || 0)); }
  // Fresh pull of full stats (MC / volume / liquidity / pfp) straight from DexScreener for search
  // rows, so no field is ever blank — the same data the feed shows.
  async function funDexBatch(addrs) {
    const list = Array.from(new Set((addrs || []).filter(Boolean))).slice(0, 30);
    if (!list.length) return {};
    try {
      const j = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${list.join(",")}`).then((x) => x.ok ? x.json() : null);
      const by = {};
      for (const p of ((j && j.pairs) || [])) {
        const m = p.baseToken && p.baseToken.address; if (!m) continue;
        const liq = Number((p.liquidity && p.liquidity.usd) || 0);
        if (by[m] && by[m]._liq >= liq) continue;
        by[m] = { _liq: liq, mc: Number(p.marketCap || p.fdv || 0), liq, v24: Number((p.volume && p.volume.h24) || 0), v1: Number((p.volume && p.volume.h1) || 0), img: (p.info && p.info.imageUrl) || "", m5: Number((p.priceChange && (p.priceChange.m5 ?? p.priceChange.h1))) };
      }
      return by;
    } catch { return {}; }
  }
  async function enrichSearchMatches(matches) {
    const addrs = matches.map((m) => m.tokenMint || m.address).filter(Boolean);
    if (!addrs.length) return;
    const parts = await Promise.all([funDexBatch(addrs.slice(0, 30)), funDexBatch(addrs.slice(30, 60))]);
    const by = Object.assign({}, parts[0], parts[1]);
    const byLower = new Map(Object.entries(by).map(([key, value]) => [key.toLowerCase(), value]));
    for (const m of matches) {
      const key = String(m.tokenMint || m.address || m.key || ""), o = by[key] || byLower.get(key.toLowerCase()); if (!o) continue;
      if (o.mc > 0) { m.marketCap = o.mc; m.marketCapUsd = o.mc; }
      if (o.liq > 0) m.liquidityUsd = o.liq;
      const v = o.v24 || o.v1; if (v > 0) { m.volumeH24 = v; m.volumeUsd = v; }
      if (o.img && !m.imageUrl) m.imageUrl = o.img;
      if (Number.isFinite(o.m5)) m.m5 = o.m5;
    }
  }
  async function refreshRecentSearches() {
    const rows = state.recents.map((item) => ({ ...item, address: item.key, tokenMint: item.key }));
    await enrichSearchMatches(rows);
    let changed = false;
    state.recents = rows.map((row, index) => {
      const current = state.recents[index] || {}, marketCap = Number(row.marketCap || row.marketCapUsd || 0), liquidity = Number(row.liquidityUsd || row.liquidity || 0), volume = Number(row.volumeH24 || row.volumeUsd || 0);
      const next = { ...current, symbol: row.symbol || current.symbol, name: row.name || current.name, imageUrl: row.imageUrl || current.imageUrl, marketCap: marketCap > 0 ? marketCap : current.marketCap, marketCapLabel: marketCap > 0 ? "" : current.marketCapLabel, liquidityUsd: liquidity > 0 ? liquidity : current.liquidityUsd, volumeUsd: volume > 0 ? volume : current.volumeUsd, marketUpdatedAt: marketCap > 0 ? Date.now() : current.marketUpdatedAt };
      if (JSON.stringify(next) !== JSON.stringify(current)) changed = true;
      return next;
    });
    if (changed) saveLocal(RECENTS_KEY, state.recents);
    return changed;
  }
  async function runSearch(query) {
    const content = $("[data-search-content]");
    const trimmed = query.trim(), version = ++state.searchRequestVersion;
    if (!trimmed) { renderSearchHome(); return; }
    const matches = localSearchMatches(trimmed);
    renderSearchMatches(content, matches, trimmed, true);
    const stillCurrent = () => version === state.searchRequestVersion && $("[data-search-input]").value.trim() === trimmed;
    const paint = (incoming = []) => {
      if (!stillCurrent()) return false;
      addSearchMatches(matches, incoming);
      renderSearchMatches(content, matches, trimmed, true);
      return true;
    };
    const direct = /^(0x[0-9a-fA-F]{40}|[1-9A-HJ-NP-Za-km-z]{32,44})$/.test(trimmed);
    const tasks = [];
    if (!direct) tasks.push(clientTokenSearch(trimmed).then((rows) => paint(rows || [])).catch(() => false));
    tasks.push(request(`/api/web/token-search?q=${encodeURIComponent(trimmed)}`).then((result) => paint(result.ok ? (result.data?.matches || []) : [])).catch(() => false));
    await Promise.allSettled(tasks);
    if (!stillCurrent()) return;
    await enrichSearchMatches(matches);
    if (!stillCurrent()) return;
    const normalized = matches.map(normalizeSearchCoin);
    matches.splice(0, matches.length, ...normalized);
    renderSearchMatches(content, matches, trimmed, false);
  }

  function openSheet(html) { $("[data-sheet-content]").innerHTML = html; $("[data-sheet-overlay]").hidden = false; }
  function closeSheet() { clearTimeout(state.volumePoll); state.volumePoll = null; clearTimeout(state.seasonPoll); state.seasonPoll = null; $("[data-sheet-overlay]").hidden = true; $("[data-sheet-content]").innerHTML = ""; }

  function funSeasonStage(run = {}) {
    const labels = {
      choosing: "Finding a live coin under $2.1K market cap",
      buy_ready: "Preparing the next buy",
      buy_submitting: "Buying",
      buy_outcome_unknown: "Checking the buy confirmation",
      holding: "Exiting back to SOL",
      sell_submitting: "Selling back to SOL",
      sell_outcome_unknown: "Checking the sell confirmation",
      attention: "Paused safely",
      done: "Complete"
    };
    return labels[run.stage] || (run.status === "completed" ? "Complete" : "Ready to start");
  }

  function funSeasonWalletOptions(selectedIndex = "") {
    return state.wallets.map((wallet) => `<option value="${wallet.index}" ${String(wallet.index) === String(selectedIndex || state.activeWallet || "") ? "selected" : ""}>${escapeHtml(wallet.label || `Wallet ${wallet.index}`)} · ${Math.max(0, Number(wallet.sol) || 0).toFixed(4)} SOL</option>`).join("");
  }

  function renderSeasonSheet() {
    const run = state.seasonRun;
    const active = run?.status === "season";
    const progress = run ? `${Number(run.tradesCompleted || 0)} / ${Number(run.tradesTarget || 0)}` : "0 / 3-5";
    const trades = Array.isArray(run?.trades) ? run.trades.slice().reverse() : [];
    openSheet(`<div data-season-panel><div class="sheet-title"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><div><h2>Season</h2><p>Fast low-cap round trips from one SOL wallet</p></div></div><div class="read-card"><h3>${escapeHtml(funSeasonStage(run || {}))}</h3><p>Progress ${escapeHtml(progress)}${run?.current?.symbol ? ` · $${escapeHtml(run.current.symbol)} · $${Math.round(Number(run.current.marketCapUsd) || 0).toLocaleString()} MC` : ""}</p></div><div class="field"><label>Season wallet</label><select data-season-wallet ${active ? "disabled" : ""}>${funSeasonWalletOptions(run?.walletIndex || "")}</select></div><button class="submit-trade" type="button" data-season-start ${state.seasonBusy || active ? "disabled" : ""}>${state.seasonBusy ? "Starting…" : active ? "Season running" : "Start Season"}</button><p class="fineprint">Season randomly runs 3-5 tiny 0.005 SOL buys on active Solana coins at or below $2.1K market cap and targets each exit back to SOL within 30 seconds. Low-cap coins can move sharply and losses are possible.</p>${run?.lastError ? `<div class="read-card"><h3>Needs attention</h3><p>${escapeHtml(run.lastError)}</p></div>` : ""}${trades.length ? `<div class="wallet-manager-list">${trades.map((trade) => `<div class="wallet-manage-row"><span><b>$${escapeHtml(trade.symbol || short(trade.tokenMint || "Coin"))}</b><span>$${Math.round(Number(trade.marketCapUsd) || 0).toLocaleString()} MC</span></span><b>${escapeHtml(trade.status || "closed")}</b></div>`).join("")}</div>` : ""}</div>`);
  }

  function scheduleFunSeasonPoll() {
    clearTimeout(state.seasonPoll);
    state.seasonPoll = null;
    if (state.seasonRun?.status !== "season" || !$('[data-season-panel]')) return;
    state.seasonPoll = setTimeout(() => { state.seasonPoll = null; void refreshFunSeason(); }, 1_500);
  }

  async function refreshFunSeason() {
    const panel = $('[data-season-panel]');
    if (!state.token || !panel) return;
    const runId = state.seasonRun?.id || "";
    const result = await request(`/api/web/season/status${runId ? `?runId=${encodeURIComponent(runId)}` : ""}`);
    if (!panel.isConnected) return;
    if (result.ok && result.data?.ok) {
      state.seasonRun = result.data.run || null;
      renderSeasonSheet();
    } else if (result.status !== 0) toast(apiMessage(result.data, "Could not refresh Season."), true);
    scheduleFunSeasonPoll();
  }

  async function openFunSeason() {
    if (!(await ensureAccount())) { toast("Could not open your wallet account.", true); return; }
    await loadWallets(true);
    if (!state.wallets.length) { await openWalletManager(); toast("Create or restore a wallet before starting Season.", true); return; }
    state.seasonRun = null;
    renderSeasonSheet();
    await refreshFunSeason();
  }

  async function startFunSeason(button) {
    if (state.seasonBusy || state.seasonRun?.status === "season") return;
    const walletIndex = String($('[data-season-wallet]')?.value || "");
    if (!walletIndex) { toast("Choose a Season wallet.", true); return; }
    if (!window.confirm("Start Season with real funds? It will make 3-5 tiny low-cap buys and sell each back to SOL. Losses are possible.")) return;
    state.seasonBusy = true;
    button.disabled = true;
    button.textContent = "Starting…";
    await ensureAutomation();
    const result = await post("/api/web/season/start", { walletIndex, tradeAttemptId: attemptId("fun-season") }, { timeout: 75_000, noRetry: true });
    state.seasonBusy = false;
    if (!result.ok || !result.data?.ok) {
      toast(apiMessage(result.data, "Season could not start."), true);
      if (button.isConnected) renderSeasonSheet();
      return;
    }
    state.seasonRun = result.data.run || null;
    toast("Season started");
    if (button.isConnected) renderSeasonSheet();
    scheduleFunSeasonPoll();
  }
  const WalletFunding = window.SlimeWireFunding;
  function fundingProvider(kind) { return WalletFunding?.provider(kind) || null; }
  function fundingProviderLabel(kind) { return WalletFunding?.label(kind, fundingProvider(kind)) || "Solana wallet"; }
  function isMobileWalletPlatform() { return Boolean(WalletFunding?.isMobile()); }
  let funFundingLaunchInFlight = false;
  function setFunFundingButtonsDisabled(disabled) {
    $$('[data-fund-wallet]').forEach((item) => {
      item.disabled = disabled;
      item.classList.toggle("busy", disabled);
    });
  }
  function releaseFunFundingLaunch() {
    funFundingLaunchInFlight = false;
    setFunFundingButtonsDisabled(false);
  }
  function openFundingSheet(note = "") {
    const wallet = activeWallet();
    const destination = wallet
      ? `<div class="fund-wallet-summary"><span>Funding</span><b>${escapeHtml(wallet.label || "SlimeWire wallet")}</b><small>${escapeHtml(short(wallet.publicKey))} · ${Number(wallet.sol || 0).toFixed(4)} SOL</small></div>`
      : `<div class="fund-wallet-summary"><span>New trading wallet</span><b>Created only when you continue</b><small>Your encrypted backup downloads during the funding setup.</small></div>`;
    openSheet(`<div class="sheet-title"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><div><h2>Add SOL</h2><p>Enter once, then approve in your wallet</p></div></div>${destination}<div class="field"><label>SOL amount</label><input data-fund-sol inputmode="decimal" value="0.1" aria-label="SOL funding amount"><div class="amount-chips">${["0.1", "0.25", "0.5", "1"].map((amount) => `<button type="button" data-fund-amount="${amount}">${amount}</button>`).join("")}</div></div>${note ? `<p class="fund-note" data-funding-status>${escapeHtml(note)}</p>` : '<p class="fund-note" data-funding-status>The exact amount is prefilled. Approve in your wallet, then return here for automatic confirmation.</p>'}<div class="fund-source-grid">
      <button type="button" data-fund-coinbase><i class="fund-provider-mark coinbase">C</i><b>Coinbase</b><span>Coinbase account checkout</span></button>
      <button type="button" data-fund-wallet="phantom"><img src="/assets/slimewire/clean-ui/wallet_icons/default/phantom.png" alt=""><b>Phantom</b><span>Open and approve</span></button>
      <button type="button" data-fund-wallet="solflare"><img src="/assets/slimewire/clean-ui/wallet_icons/default/solflare.png" alt=""><b>Solflare</b><span>Open and approve</span></button>
      <button type="button" data-fund-copy><i class="fund-provider-mark copy">⧉</i><b>${wallet ? "Copy address" : "Create & copy"}</b><span>Fund from anywhere else</span></button>
    </div><p class="fineprint">The exact amount is prefilled in your wallet. After approval, return to SlimeWire and confirmation completes automatically; SlimeWire never receives your wallet keys.</p>`);
  }
  async function startWalletFunding(kind, button) {
    if (!["phantom", "solflare"].includes(kind)) return;
    const amountSol = Number($("[data-fund-sol]")?.value || 0);
    const status = $("[data-funding-status]");
    if (!Number.isFinite(amountSol) || amountSol < 0.005 || amountSol > 10) {
      if (status) status.textContent = "Enter 0.005 to 10 SOL.";
      toast("Enter 0.005 to 10 SOL.", true);
      return;
    }
    const label = fundingProviderLabel(kind);
    if (funFundingLaunchInFlight) {
      toast("Wallet funding is already opening.");
      return;
    }
    funFundingLaunchInFlight = true;
    setFunFundingButtonsDisabled(true);
    let handedOff = false;
    try {
      if (!(await ensureAccount())) return;
      const provider = fundingProvider(kind);
      if (!provider) {
        if (isMobileWalletPlatform()) {
          handedOff = await startFunMobileExactFunding(button, kind, amountSol);
          return;
        }
        if (status) status.textContent = `${label} is not connected here. Open SlimeWire on your phone or copy the wallet address.`;
        toast(`${label} is not connected in this browser.`, true);
        return;
      }
      if (status) status.textContent = `Connecting ${label}…`;
      const connected = await provider.connect();
      const publicKey = String(connected?.publicKey || provider.publicKey || "");
      if (!publicKey) throw new Error(`Could not read your ${label} address.`);
      await submitWalletFunding(button, kind, amountSol, { provider, publicKey });
    } catch (error) {
      const message = error?.message || `${label} connection was cancelled.`;
      if (status) status.textContent = message;
      toast(message, true);
    } finally {
      if (handedOff) setTimeout(releaseFunFundingLaunch, 2500);
      else releaseFunFundingLaunch();
    }
  }
  async function submitWalletFunding(button, kind, amountSol, { provider, publicKey }) {
    if (!provider || typeof provider.signTransaction !== "function") throw new Error("This wallet cannot approve the transfer here.");
    let wallet = activeWallet();
    button.disabled = true;
    const status = $("[data-funding-status]");
    try {
      if (status) status.textContent = "Preparing one exact SOL transfer…";
      const saved = await post("/api/web/profile/connected-wallet", { publicKey, provider: kind });
      if (!saved.ok || !saved.data?.ok) throw new Error(apiMessage(saved.data, "Could not verify the connected wallet."));
      if (!wallet) {
        const createdWallet = await post("/api/web/wallets/create", { label: "SlimeWire Go", count: 1 });
        if (!createdWallet.ok || !createdWallet.data?.ok || !createdWallet.data?.wallets?.length) throw new Error(apiMessage(createdWallet.data, "Could not create the trading wallet."));
        const downloads = createdWallet.data.downloads || {};
        for (const item of [downloads.encryptedBackup, downloads.recoveryKeys].filter(Boolean)) downloadText(item.filename, item.text);
        const createdRow = createdWallet.data.wallets[0];
        state.activeWallet = Number(createdRow.index);
        localStorage.setItem(ACTIVE_WALLET_KEY, String(createdRow.index));
        await loadWallets();
        wallet = activeWallet() || createdRow;
      }
      const created = await post("/api/web/wallet-funding/create", { walletIndex: wallet.index, amountSol: String(amountSol) });
      if (!created.ok || !created.data?.ok || !created.data?.order?.transaction) throw new Error(apiMessage(created.data, "Could not prepare wallet funding."));
      const order = created.data.order;
      if (status) status.textContent = `Approve exactly ${amountSol} SOL in ${fundingProviderLabel(kind)}.`;
      const signedTransaction = await WalletFunding.signSerialized(provider, order.transaction);
      if (status) status.textContent = "Confirming your deposit on Solana…";
      const attemptBody = { walletFundingAttemptId: order.walletFundingAttemptId, signedTransaction };
      const executed = await request("/api/web/wallet-funding/execute", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(attemptBody), timeout: 70_000 });
      if (!executed.ok || !executed.data?.ok) throw new Error(apiMessage(executed.data, "Funding did not confirm. Check your wallet and try again."));
      if (order.walletIndex) {
        state.activeWallet = Number(order.walletIndex);
        localStorage.setItem(ACTIVE_WALLET_KEY, String(order.walletIndex));
      }
      await loadWallets(true);
      closeSheet();
      setView("wallet");
      renderWalletHero();
      renderWalletPositions();
      toast(`${amountSol} SOL funded successfully.`);
    } catch (error) {
      const message = error?.message || "Funding failed. No extra transfer was sent.";
      if (status) status.textContent = message;
      button.disabled = false;
      throw error;
    }
  }

  async function ensureFunFundingWallet() {
    let wallet = activeWallet();
    if (wallet) return wallet;
    if (!(await createWallet())) throw new Error("Could not create the destination wallet.");
    wallet = activeWallet();
    if (!wallet) throw new Error("Could not load the destination wallet.");
    return wallet;
  }

  function readPendingFunFunding() {
    const pending = readLocal(FUN_PENDING_FUND_KEY, null);
    if (!pending || Date.now() - Number(pending.startedAt || 0) > 30 * 60_000) {
      try { localStorage.removeItem(FUN_PENDING_FUND_KEY); } catch {}
      return null;
    }
    return pending;
  }

  async function startFunMobileExactFunding(button, kind, amountSol) {
    const status = $("[data-funding-status]");
    const label = fundingProviderLabel(kind);
    if (button) { button.disabled = true; button.classList.add("busy"); }
    try {
      if (!WalletFunding?.createSolanaPayReference || !WalletFunding?.solanaPayTransferUrl) {
        throw new Error("Mobile wallet funding is still loading. Try again.");
      }
      const wallet = await ensureFunFundingWallet();
      const reference = WalletFunding.createSolanaPayReference();
      const startedAt = Date.now();
      const payUri = WalletFunding.solanaPayTransferUrl({
        recipient: wallet.publicKey,
        amountSol,
        reference,
        label: "SlimeWire",
        message: "Fund your SlimeWire trading wallet"
      });
      saveLocal(FUN_PENDING_FUND_KEY, {
        walletIndex: wallet.index,
        amountSol,
        reference,
        startedAt
      });
      if (status) status.textContent = `Opening your wallet to approve ${amountSol} SOL…`;
      closeSheet();
      location.assign(payUri);
      return true;
    } catch (error) {
      const message = error?.message || `Could not open ${label}.`;
      openFundingSheet(message);
      toast(message, true);
      if (button?.isConnected) { button.disabled = false; button.classList.remove("busy"); }
      return false;
    }
  }

  let pendingFunFundingCheck = null;
  let pendingFunFundingTimers = [];
  function cancelPendingFunFundingPolls() {
    pendingFunFundingTimers.forEach((timer) => clearTimeout(timer));
    pendingFunFundingTimers = [];
  }
  function checkPendingFunFunding() {
    if (pendingFunFundingCheck) return pendingFunFundingCheck;
    pendingFunFundingCheck = checkPendingFunFundingOnce().finally(() => {
      pendingFunFundingCheck = null;
    });
    return pendingFunFundingCheck;
  }

  async function checkPendingFunFundingOnce() {
    const pending = readPendingFunFunding();
    if (!pending || !state.token) {
      cancelPendingFunFundingPolls();
      return false;
    }
    if (pending.reference && pending.walletIndex) {
      const result = await post("/api/web/wallet-funding/status", {
        walletIndex: pending.walletIndex,
        amountSol: pending.amountSol,
        reference: pending.reference,
        startedAt: pending.startedAt
      });
      if (result.ok && result.data?.confirmed) {
        try { localStorage.removeItem(FUN_PENDING_FUND_KEY); } catch {}
        cancelPendingFunFundingPolls();
        state.activeWallet = Number(pending.walletIndex);
        localStorage.setItem(ACTIVE_WALLET_KEY, String(pending.walletIndex));
        await loadWallets(true);
        renderWalletHero();
        renderWalletPositions();
        toast(`${pending.amountSol} SOL funded successfully.`);
        return true;
      }
      if (!result.ok && [400, 401, 404, 409, 410].includes(result.status)) {
        const message = apiMessage(result.data, "That funding request could not be verified. Start again.");
        try { localStorage.removeItem(FUN_PENDING_FUND_KEY); } catch {}
        cancelPendingFunFundingPolls();
        toast(message, true);
        return false;
      }
      return false;
    }
    await loadWallets(true);
    const wallet = state.wallets.find((item) => Number(item.index) === Number(pending.walletIndex));
    const expected = Number(pending.amountSol || 0);
    if (!wallet || expected <= 0 || Number(wallet.sol || 0) < Number(pending.baselineSol || 0) + Math.max(0.00001, expected * 0.98)) return false;
    try { localStorage.removeItem(FUN_PENDING_FUND_KEY); } catch {}
    cancelPendingFunFundingPolls();
    state.activeWallet = Number(wallet.index);
    localStorage.setItem(ACTIVE_WALLET_KEY, String(wallet.index));
    renderWalletHero();
    renderWalletPositions();
    toast(`${pending.amountSol} SOL funded successfully.`);
    return true;
  }

  function resumePendingFunFunding() {
    cancelPendingFunFundingPolls();
    if (!readPendingFunFunding()) return;
    pendingFunFundingTimers = [0, 2000, 5000, 10000, 20000, 30000].map((delay) => setTimeout(() => {
      if (readPendingFunFunding()) void checkPendingFunFunding();
    }, delay));
  }
  async function writeClipboardText(value) {
    const text = String(value || "").trim();
    if (!text) throw new Error("Nothing to copy.");
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand?.("copy");
    field.remove();
    if (!copied) throw new Error("Clipboard unavailable.");
  }
  async function copyWalletAddress(address) {
    try {
      await writeClipboardText(address);
      toast("Full wallet address copied");
      return true;
    } catch {
      toast("Could not copy automatically. Open Receive and press the full address.", true);
      return false;
    }
  }
  async function copyFundingAddress() {
    if (!activeWallet() && !(await createWallet())) return;
    const wallet = activeWallet();
    walletReceive();
    if (!wallet) return;
    await copyWalletAddress(wallet.publicKey);
  }
  async function startCoinbaseFunding(button) {
    if (button) button.disabled = true;
    if (!(await ensureAccount())) {
      if (button) button.disabled = false;
      toast("Could not start Coinbase funding. Try again.", true);
      return;
    }
    location.assign("/cash?sheet=addcash&from=fun");
  }
  function runningStandalone() { return window.matchMedia?.("(display-mode: standalone)")?.matches || navigator.standalone === true; }
  const FUN_INSTALL_HOST = "app.slimewire.org";
  function funInstallOrigin() { return `https://${FUN_INSTALL_HOST}/fun/?install=1`; }
  function showFunInstallGuide() {
    const dedicated = location.hostname === FUN_INSTALL_HOST;
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent || "");
    const steps = dedicated
      ? (ios
        ? ["Tap Share in Safari.", "Choose Add to Home Screen.", "Confirm Add for a separate SlimeWire Go icon."]
        : ["Tap Install SlimeWire Go below.", "Confirm the browser prompt.", "Go appears as the focused mobile SlimeWire app."])
      : ["Open the mobile install page below.", "Your browser will open SlimeWire Go.", "Install it for a focused mobile trading layout."];
    openSheet(`<div class="sheet-title"><img src="/assets/slimewire/png/slimewire-mark.png" alt=""><div><h2>Install SlimeWire Go</h2><p>Keep this focused mobile layout as its own app.</p></div></div><div class="read-card"><h3>Mobile app install</h3>${steps.map((step, index) => `<p>${index + 1}. ${escapeHtml(step)}</p>`).join("")}</div><button class="submit-trade" type="button" data-install-fun>${dedicated ? "Install SlimeWire Go" : "Open mobile install page"}</button><p class="fineprint">Browsers always require your confirmation; a website cannot silently force an install.</p>`);
  }
  async function openFunInstall() {
    if (state.deferredInstall) {
      const promptEvent = state.deferredInstall;
      state.deferredInstall = null;
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice.catch(() => null);
      if (choice?.outcome === "accepted") { toast("SlimeWire Go installed"); closeSheet(); }
      return;
    }
    if (location.hostname !== FUN_INSTALL_HOST) {
      if (/android/i.test(navigator.userAgent || "")) location.href = `intent://${FUN_INSTALL_HOST}/fun/?install=1#Intent;scheme=https;package=com.android.chrome;end`;
      else window.open(funInstallOrigin(), "_blank", "noopener");
      return;
    }
    showFunInstallGuide();
    toast(runningStandalone() ? "SlimeWire Go is already open as an app" : "Use your browser menu if the prompt is not ready");
  }
  function toolCard(icon, label, note, action, attr = "data-tool-action") { return `<button class="tool-card" type="button" ${attr}="${escapeHtml(action)}"><img src="${TOOL_ICONS}${escapeHtml(icon)}.png" alt=""><b>${escapeHtml(label)}</b><span>${escapeHtml(note)}</span></button>`; }
  async function openTools(global = false) {
    const coin = state.selected || {}, key = coinKey(coin), creator = key && state.launches.some((launch) => String(launch.mint || launch.tokenAddress || "").toLowerCase() === key.toLowerCase());
    openSheet(`<div class="sheet-title"><img src="${global ? "/assets/slimewire/png/slimewire-mark.png" : escapeHtml(coinImage(coin))}" alt=""><div><h2>${global ? "More" : `$${escapeHtml(coin.symbol || short(key))} tools`}</h2><p>${global ? "Cash, profile, traders, and automation in one place." : "Power when you need it. Clean chart when you do not."}</p></div></div><div class="tool-grid">
      ${global ? toolCard("wallet", "SlimeCash", "Send, receive, and fund", "cash") : ""}
      ${global ? toolCard("kol", "Profile", "Account and social settings", "profile") : ""}
      ${global ? toolCard("pnl", "Traders", "Calls and public proof", "traders") : ""}
      ${!global ? toolCard("positions", "TP / SL", "Server-side exits", "exits") : ""}
      ${!global ? toolCard("wallet", "Wallet map", "Holders and flows", "map") : ""}
      ${!global ? toolCard("warning", "Safety", "Full contract read", "safety") : ""}
      ${toolCard("trade", "Swap", "SOL and RH funding", "swap")}
      ${toolCard("pnl", "Volume bot", "Rolling-wallet controls", "volume")}
      ${toolCard("bundle", "Bundle", "Multi-wallet entry", "bundle")}
      ${toolCard("kol", "Trader copy", "Follow a public wallet", "copy")}
      ${toolCard("snipe", "Launch snipe", "Watch ticker or name", "sniper")}
      ${toolCard("snipe", "Wallet launch snipe", "Watch creator or deployer", "walletLaunch")}
      ${toolCard("launch", "Launch", "Solana or Robinhood", "launch")}
      ${toolCard("pnl", "Full portfolio", "PnL and receipts", "portfolio")}
      ${global ? toolCard("wallet", "Install SlimeWire Go", "Focused mobile layout", "install") : ""}
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
    const sellFields = `<div class="field"><label>Sell percent</label><input data-trade-percent inputmode="numeric" value="100"><div class="amount-chips">${[25, 50, 75, 100].map((value) => `<button type="button" data-percent-chip="${value}">${value}%</button>`).join("")}</div></div>${rh ? '<p class="fineprint">Sale proceeds return to this SOL wallet automatically.</p>' : ""}`;
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>${escapeHtml(coin.symbol || short(key))}</h2><p>${rh ? "Robinhood · one SOL wallet" : "Solana"} · ${escapeHtml(short(key))}</p></div></div>
      <div class="trade-toggle"><button class="${side === "buy" ? "active buy" : ""}" type="button" data-sheet-side="buy">Buy</button><button class="${side === "sell" ? "active sell" : ""}" type="button" data-sheet-side="sell">Sell</button></div>
      <div class="field"><label>Wallet</label><select data-trade-wallet>${wallets}</select></div>${side === "buy" ? buyFields : sellFields}
      <button class="submit-trade ${side}" type="button" ${wallet ? `data-submit-trade data-side="${side}"` : "data-wallet-entry"}>${wallet ? `${side === "buy" ? "Buy" : "Sell"} ${escapeHtml(coin.symbol || "coin")}` : "Fund wallet to trade"}</button><p class="fineprint">Review before submitting. Automated exits keep running on the server after this page closes.</p>`);
  }
  function openExitSheet() {
    const coin = state.selected || {};
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>Auto exits</h2><p>Protect your existing ${escapeHtml(coin.symbol || "coin")} position</p></div></div><div class="field-row"><div class="field"><label>Take profit %</label><input data-exit-tp inputmode="decimal" value="50"></div><div class="field"><label>Stop loss %</label><input data-exit-sl inputmode="decimal" value="15"></div></div><div class="field"><label>Sell % when hit</label><input data-exit-percent inputmode="numeric" value="100"></div><button class="submit-trade" type="button" data-arm-exits>Arm server-side exits</button><p class="fineprint">The backend monitors and executes this rule. The browser does not need to stay open.</p>`);
  }
  function parseMarketCapInput(value) {
    const match = String(value || "").trim().toLowerCase().replace(/[$,\s]/g, "").match(/^([0-9]*\.?[0-9]+)(k|m|b)?$/);
    if (!match) return 0;
    let amount = Number(match[1]);
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    if (match[2] === "k") amount *= 1e3;
    else if (match[2] === "m") amount *= 1e6;
    else if (match[2] === "b") amount *= 1e9;
    return Math.round(amount);
  }
  function marketOrderStatusHtml(order) {
    const side = String(order.kind || order.side || "").includes("buy") ? "BUY" : "SELL";
    const target = Number(order.targetMarketCapUsd || order.triggerMc || 0);
    const status = String(order.status || "active");
    const amount = side === "BUY" ? `${order.amountSol || "?"} SOL` : `${order.sellPercent || order.pct || 100}%`;
    return `<div class="preset-manage-row"><div><b>${side} / ${escapeHtml(formatUsd(target))}</b><span>${escapeHtml(amount)} / ${escapeHtml(status.replace(/_/g, " "))}</span></div>${["active", "armed"].includes(status) ? `<div><button class="danger" type="button" aria-label="Cancel order" data-cancel-market-order="${escapeHtml(order.id)}" data-order-chain="${escapeHtml(order.chain || "solana")}">X</button></div>` : ""}</div>`;
  }
  async function refreshMarketOrderList() {
    const target = $("[data-market-order-list]"), key = coinKey(state.selected);
    if (!target || !key) return;
    const result = await request(`/api/web/market-orders?token=${encodeURIComponent(key)}`);
    const rows = result.ok && result.data?.ok ? (result.data.orders || []) : [];
    target.innerHTML = rows.length ? rows.map(marketOrderStatusHtml).join("") : '<div class="read-card"><h3>No orders on this coin</h3><p>Buy triggers and exits will stay active on the server after you close the app.</p></div>';
  }
  async function openMarketOrdersSheet() {
    if (!(await ensureAccount())) { toast("Log in to create orders.", true); return; }
    if (!state.wallets.length) await loadWallets();
    const coin = state.selected || {}, key = coinKey(coin), wallet = activeWallet(), currentMc = Number(coin.marketCap || coin.mc || state.selectedDetail?.mc || state.selectedDetail?.marketCapUsd || 0);
    if (!wallet) { openFundingSheet(); return; }
    const wallets = state.wallets.map((item) => `<option value="${item.index}" ${item.index === state.activeWallet ? "selected" : ""}>${escapeHtml(item.label || `Wallet ${item.index}`)} / ${Number(item.sol || 0).toFixed(3)} SOL</option>`).join("");
    openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(coin))}" alt=""><div><h2>Market-cap orders</h2><p>${escapeHtml(coin.symbol || short(key))} / current MC ${escapeHtml(formatUsd(currentMc))}</p></div></div>
      <div class="field"><label>Wallet</label><select data-order-wallet>${wallets}</select></div>
      <div class="read-card"><h3>Auto buy</h3><div class="field-row"><div class="field"><label>Buy when MC touches</label><input data-order-buy-mc inputmode="decimal" placeholder="30k"></div><div class="field"><label>Spend SOL</label><input data-order-buy-sol inputmode="decimal" value="0.1"></div></div></div>
      <div class="read-card"><h3>Profit ladder</h3><div class="field-row"><div class="field"><label>MC targets</label><input data-order-ladder-mc placeholder="75k, 100k, 150k"></div><div class="field"><label>Sell % at each</label><input data-order-ladder-sell placeholder="25, 25, 50"></div></div></div>
      <div class="read-card"><h3>Stop loss by MC</h3><div class="field-row"><div class="field"><label>Exit if MC touches</label><input data-order-stop-mc inputmode="decimal" placeholder="20k"></div><div class="field"><label>Sell %</label><input data-order-stop-sell inputmode="numeric" value="100"></div></div></div>
      <button class="submit-trade" type="button" data-submit-market-orders>Arm selected orders</button><p class="fineprint">Use any one section or combine them. Targets automatically work above or below the current MC and keep running server-side.</p><div class="preset-manager-list" data-market-order-list><div class="read-card"><p>Loading active orders...</p></div></div>`);
    await refreshMarketOrderList();
  }
  async function submitMarketOrders(button) {
    const coin = state.selected || {}, key = coinKey(coin), walletIndex = Number($("[data-order-wallet]")?.value || state.activeWallet || 1), wallet = state.wallets.find((item) => item.index === walletIndex) || activeWallet();
    const orders = [], buyMcText = String($("[data-order-buy-mc]")?.value || "").trim(), buyMc = parseMarketCapInput(buyMcText), buySol = Number($("[data-order-buy-sol]")?.value || 0);
    if (buyMcText) {
      if (!buyMc || !(buySol >= 0.005)) { toast("Add a valid buy MC and SOL amount.", true); return; }
      orders.push({ side: "buy", targetMarketCapUsd: buyMc, amountSol: buySol });
    }
    const ladderTargets = String($("[data-order-ladder-mc]")?.value || "").split(",").map(parseMarketCapInput).filter((value) => value > 0).slice(0, 4);
    const ladderSells = String($("[data-order-ladder-sell]")?.value || "").split(",").map(Number);
    ladderTargets.forEach((target, index) => orders.push({ side: "sell", targetMarketCapUsd: target, sellPercent: ladderSells[index] > 0 ? ladderSells[index] : Math.max(1, Math.floor(100 / ladderTargets.length)) }));
    const stopMc = parseMarketCapInput($("[data-order-stop-mc]")?.value), stopSell = Number($("[data-order-stop-sell]")?.value || 100);
    if (stopMc) orders.push({ side: "sell", targetMarketCapUsd: stopMc, sellPercent: stopSell });
    if (!orders.length) { toast("Add a buy target, profit target, or stop loss.", true); return; }
    if (orders.some((order) => order.side === "sell" && (!(order.sellPercent >= 1) || order.sellPercent > 100))) { toast("Sell percentages must be 1-100%.", true); return; }
    button.disabled = true; button.textContent = "Arming...";
    await ensureAutomation();
    const result = await post("/api/web/market-orders", { token: key, symbol: coin.symbol || "", walletIndex: String(walletIndex), walletPublicKey: wallet?.publicKey || "", currentMarketCapUsd: Number(coin.marketCap || coin.mc || 0), entryPriceUsd: Number(coin.priceUsd || state.selectedDetail?.priceUsd || 0), orders });
    button.disabled = false; button.textContent = "Arm selected orders";
    if (!result.ok || !result.data?.ok) { toast(apiMessage(result.data, "Could not arm orders"), true); return; }
    toast(`${result.data.armed?.length || orders.length} order${orders.length === 1 ? "" : "s"} armed`);
    await refreshMarketOrderList();
  }
  async function cancelMarketOrder(button) {
    button.disabled = true;
    const result = await post("/api/web/market-orders/cancel", { id: button.dataset.cancelMarketOrder, chain: button.dataset.orderChain || "solana" });
    if (!result.ok) toast(apiMessage(result.data, "Could not cancel order"), true);
    else toast("Order cancelled");
    await refreshMarketOrderList();
  }
  async function createWallet() {
    if (!(await ensureAccount())) { toast("Could not start your account.", true); return false; }
    const previousWallets = new Set(state.wallets.map((wallet) => String(wallet.publicKey || "")));
    const result = await post("/api/web/wallets/create", { label: "SlimeWire Go", count: 1 });
    if (!result.ok || !result.data?.ok) { toast(result.data?.message || result.data?.error || "Wallet creation failed", true); return false; }
    const downloads = result.data.downloads || {};
    const downloaded = downloadWalletFiles(downloads);
    await loadWallets(true);
    if (downloaded > 0) {
      const created = state.wallets.filter((wallet) => !previousWallets.has(String(wallet.publicKey || "")));
      for (const wallet of created) markWalletBackedUp(wallet);
    }
    renderHomeReadiness(); renderWalletHero(); renderWalletPositions(); if (state.view === "quick") renderQuickRoute(); toast("Wallet created. Backups downloaded—store them safely."); return true;
  }
  function downloadText(filename, text) { const blob = new Blob([text], { type: "text/plain" }), url = URL.createObjectURL(blob), link = document.createElement("a"); link.href = url; link.download = filename || "slimewire-backup.txt"; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000); }
  function downloadWalletFiles(downloads = {}) {
    const files = [downloads.encryptedBackup, downloads.recoveryKeys].filter((entry) => entry?.text);
    for (const item of files) downloadText(item.filename, item.text);
    return files.length;
  }
  async function downloadFunAccountBackup() {
    const result = await post("/api/web/cash/account-backup", {});
    if (!result.ok || !result.data?.accountBackup?.text) return false;
    downloadText(result.data.accountBackup.filename, result.data.accountBackup.text);
    return true;
  }
  function walletPositionAssets(wallet = {}) {
    const quantities = new Map();
    for (const token of Array.isArray(wallet.tokens) ? wallet.tokens : []) {
      const mint = String(token?.mint || token?.tokenMint || "").trim();
      const quantity = positionNumber(token?.uiAmount);
      if (!mint || quantity == null || quantity <= 0) continue;
      quantities.set(mint.toLowerCase(), (quantities.get(mint.toLowerCase()) || 0) + quantity);
    }
    return displayablePositions(state.positions).map((position) => {
      const mint = String(position.tokenMint || "").trim();
      const quantity = quantities.get(mint.toLowerCase()) || 0;
      if (!mint || quantity <= 0) return null;
      const totalQuantity = positionQuantity(position);
      const totalValueSol = positionEstimatedSol(position);
      const valueSol = totalValueSol != null && totalQuantity != null && totalQuantity > 0
        ? totalValueSol * Math.min(1, quantity / totalQuantity)
        : null;
      return { ...position, quantity, valueSol };
    }).filter(Boolean);
  }
  function walletAssetSummary(wallet = {}) {
    const assets = walletPositionAssets(wallet);
    const liquidSol = Math.max(0, Number(wallet.sol) || 0);
    const coinsSol = assets.reduce((sum, asset) => sum + (asset.valueSol == null ? 0 : asset.valueSol), 0);
    const hasPendingValue = assets.some((asset) => asset.valueSol == null);
    const totalSol = liquidSol + coinsSol;
    return { assets, liquidSol, coinsSol, hasPendingValue, totalSol, totalUsd: state.solUsd > 0 ? totalSol * state.solUsd : null };
  }
  function walletManagerRowHtml(wallet) {
    const summary = walletAssetSummary(wallet);
    const pendingMark = summary.hasPendingValue ? "+" : "";
    const coinValue = summary.assets.length
      ? (summary.coinsSol > 0 ? `${formatPositionSol(summary.coinsSol)}${pendingMark} SOL` : "Pricing...")
      : "0 SOL";
    const totalUsd = formatWalletUsd(summary.totalUsd);
    const totalLabel = totalUsd === "—" ? `${formatPositionSol(summary.totalSol)}${pendingMark} SOL` : `${totalUsd}${pendingMark}`;
    const assetRows = summary.assets.map((asset) => {
      const pnl = positionOpenPnl(asset) == null ? null : positionPercent(asset.openPnlPercent);
      return `<button class="wallet-asset-row" type="button" data-open-coin="${escapeHtml(asset.tokenMint)}" data-chain-kind="sol"><img ${coinImageAttrs(asset)} alt=""><span><b>${escapeHtml(asset.symbol || short(asset.tokenMint))}</b><small>${escapeHtml(formatTokenQuantity(asset.quantity))} tokens · ${pnl == null ? "PnL —" : `${escapeHtml(formatPct(pnl))} PnL`}</small></span><strong>${asset.valueSol == null ? "Pricing..." : `${escapeHtml(formatPositionSol(asset.valueSol))} SOL`}</strong></button>`;
    }).join("");
    const positionDetails = summary.assets.length
      ? `<details class="wallet-assets"><summary><span>Coin positions</span><b>${summary.assets.length} token${summary.assets.length === 1 ? "" : "s"} ›</b></summary><div>${assetRows}</div></details>`
      : `<div class="wallet-assets-empty">No coin positions in this wallet</div>`;
    const backupLabel = walletBackedUp(wallet) ? "Backup again" : "Backup";
    return `<div class="wallet-manage-row" data-wallet-manager-row="${wallet.index}"><label class="wallet-batch-check" title="Select wallet"><input type="checkbox" data-wallet-batch-select="${wallet.index}" checked><span></span></label><div class="wallet-manage-copy"><b>${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}${wallet.index === state.activeWallet && String(wallet.label || "").trim().toLowerCase() !== "main" ? " · Main" : ""}</b><button class="wallet-manager-address" type="button" data-copy-wallet-address="${escapeHtml(wallet.publicKey)}"><span>${escapeHtml(short(wallet.publicKey))}</span><small>Copy full address</small></button><div class="wallet-value-strip"><span><small>SOL</small><b>${escapeHtml(formatPositionSol(summary.liquidSol))}</b></span><span><small>COINS</small><b>${escapeHtml(coinValue)}</b></span><span><small>TOTAL</small><b>${escapeHtml(totalLabel)}</b></span></div>${positionDetails}<span class="wallet-fund-amount"><input data-wallet-fund-amount="${wallet.index}" inputmode="decimal" placeholder="SOL for this wallet" aria-label="SOL amount for ${escapeHtml(wallet.label || `Wallet ${wallet.index}`)}"></span><span class="wallet-rename"><input data-wallet-rename-input="${wallet.index}" value="${escapeHtml(wallet.label || "")}" maxlength="40"><button type="button" data-rename-wallet="${wallet.index}">Rename</button></span></div><div class="wallet-row-actions"><button type="button" data-select-wallet="${wallet.index}" ${wallet.index === state.activeWallet ? "disabled" : ""}>${wallet.index === state.activeWallet ? "Active" : "Main"}</button><button type="button" data-wallet-funds="${wallet.index}">Only</button><button type="button" data-backup-wallet data-wallet-index="${wallet.index}" data-wallet-key="${escapeHtml(wallet.publicKey)}">${backupLabel}</button><button class="danger" type="button" data-remove-wallet="${wallet.index}" data-wallet-key="${escapeHtml(wallet.publicKey)}">Remove</button></div></div>`;
  }
  async function openWalletManager() {
    if (state.token) {
      await Promise.all([loadWallets(), loadPositions()]);
      await loadValuedPositions(state.positionLoadVersion);
    }
    state.pendingWalletManagerAction = null;
    const rows = state.wallets.length ? state.wallets.map(walletManagerRowHtml).join("") : '<div class="read-card"><h3>No wallet loaded</h3><p>Create a new wallet or restore one from a saved backup. Backup files download automatically.</p></div>';
    const walletOptions = state.wallets.map((wallet) => `<option value="${wallet.index}" ${wallet.index === state.activeWallet ? "selected" : ""}>${escapeHtml(wallet.label || `Wallet ${wallet.index}`)} · ${Number(wallet.sol || 0).toFixed(4)} SOL</option>`).join("");
    openSheet(`<div class="sheet-title"><img src="${slimePfp(activeWallet()?.publicKey || "wallet-manager")}" alt=""><div><h2>Wallet manager</h2><p>See SOL and coin value per wallet, then fund or consolidate the wallets you select.</p></div></div>
      <div class="wallet-select-bar"><button type="button" data-wallet-select-all>All</button><button type="button" data-wallet-select-none>None</button><span data-wallet-selected-count>${state.wallets.length} selected</span></div>
      <div class="wallet-manager-list">${rows}</div>
      <div class="wallet-manager-actions"><button type="button" data-create-wallet>+ Add one wallet</button><button type="button" data-export-wallets ${state.wallets.length ? "" : "disabled"}>Download backups</button></div>
      ${state.wallets.length > 1 ? `<section class="wallet-batch-card" data-wallet-funding-card><div class="wallet-batch-heading"><div><h3>Fund selected wallets</h3><p>One review, one transaction.</p></div></div><div class="field"><label>Fund from</label><select data-wallet-fund-source>${walletOptions}</select></div><div class="wallet-mode-toggle"><button class="active" type="button" data-wallet-fund-mode="equal">Same amount each</button><button type="button" data-wallet-fund-mode="custom">Different amounts</button></div><div class="field" data-wallet-equal-funding><label>SOL per wallet</label><input data-wallet-fund-equal inputmode="decimal" value="0.1" placeholder="0.1"></div><button class="submit-trade" type="button" data-review-wallet-fund>Review funding</button><p class="fineprint">The Main/source wallet is never funded into itself. Network fees are shown by Solana when submitted.</p></section>` : ""}
      ${state.wallets.length ? `<section class="wallet-batch-card" data-wallet-consolidate-card><div class="wallet-batch-heading"><div><h3>Sell &amp; consolidate</h3><p>Use the selected wallets, or tap Only on a wallet above.</p></div></div><div class="field"><label>Sweep SOL into</label><select data-wallet-consolidate-destination>${walletOptions}</select></div><div class="wallet-consolidate-actions"><button type="button" data-review-wallet-action="sell">Sell all tokens</button><button type="button" data-review-wallet-action="sweep">Sweep SOL</button><button class="primary" type="button" data-review-wallet-action="sell-sweep">Sell tokens + sweep</button></div><p class="fineprint">Selling swaps every sellable token to SOL. Sweeping drains transferable SOL into the wallet above and keeps network fees covered.</p></section>` : ""}
      <details class="wallet-restore-box"><summary>Restore or import a wallet</summary><label class="file-button">Choose backup file<input type="file" data-wallet-backup-file accept=".txt,.json,application/json,text/plain" hidden></label><textarea data-wallet-backup-text placeholder="Or paste an encrypted backup, recovery file, or private key"></textarea><button class="submit-trade" type="button" data-restore-wallet>Restore / import wallet</button></details><p class="wallet-manager-status" data-wallet-manager-status></p><p class="fineprint">Each Solana wallet deterministically controls its Robinhood address. Keep downloaded backup files private.</p>`);
    updateWalletManagerSelection();
    updateWalletFundingSource();
  }
  function selectedManagerWalletIndexes() {
    return $$('[data-wallet-batch-select]:checked').map((input) => Number(input.dataset.walletBatchSelect)).filter(Number.isInteger);
  }
  function updateWalletManagerSelection() {
    const count = selectedManagerWalletIndexes().length;
    const label = $("[data-wallet-selected-count]");
    if (label) label.textContent = `${count} selected`;
  }
  function setWalletManagerSelection(indexes) {
    const selected = new Set(indexes.map(Number));
    $$('[data-wallet-batch-select]').forEach((input) => { input.checked = selected.has(Number(input.dataset.walletBatchSelect)); });
    updateWalletManagerSelection();
  }
  function setWalletFundingMode(mode = "equal") {
    const custom = mode === "custom";
    $(".wallet-manager-list")?.classList.toggle("custom-funding", custom);
    $("[data-wallet-equal-funding]")?.classList.toggle("hidden", custom);
    $$('[data-wallet-fund-mode]').forEach((button) => button.classList.toggle("active", button.dataset.walletFundMode === mode));
    updateWalletFundingSource();
  }
  function updateWalletFundingSource() {
    const sourceIndex = Number($("[data-wallet-fund-source]")?.value || state.activeWallet);
    $$("[data-wallet-manager-row]").forEach((row) => row.classList.toggle("funding-source", Number(row.dataset.walletManagerRow) === sourceIndex));
  }
  function focusWalletFunds(index) {
    setWalletManagerSelection([Number(index)]);
    $("[data-wallet-consolidate-card]")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
  function reviewWalletFunding() {
    const sourceWalletIndex = Number($("[data-wallet-fund-source]")?.value || state.activeWallet);
    const mode = $("[data-wallet-fund-mode].active")?.dataset.walletFundMode || "equal";
    const targets = selectedManagerWalletIndexes().filter((index) => index !== sourceWalletIndex);
    if (!targets.length) { toast("Select at least one wallet other than the funding wallet.", true); return; }
    if (targets.length > 20) { toast("Fund up to 20 wallets at a time.", true); return; }
    const equalAmount = String($("[data-wallet-fund-equal]")?.value || "").trim();
    const allocations = targets.map((index) => {
      const wallet = state.wallets.find((item) => Number(item.index) === index);
      const amountSol = mode === "equal" ? equalAmount : String($(`[data-wallet-fund-amount="${index}"]`)?.value || "").trim();
      return { walletIndex: index, label: wallet?.label || `Wallet ${index}`, destination: wallet?.publicKey || "", amountSol };
    });
    if (allocations.some((allocation) => !allocation.destination || !(Number(allocation.amountSol) > 0))) {
      toast(mode === "equal" ? "Enter a valid SOL amount per wallet." : "Enter a SOL amount for every selected wallet.", true);
      return;
    }
    const source = state.wallets.find((wallet) => Number(wallet.index) === sourceWalletIndex);
    const totalSol = allocations.reduce((sum, allocation) => sum + Number(allocation.amountSol), 0);
    if (Number(source?.sol || 0) <= totalSol) { toast("The funding wallet needs enough SOL for the total plus network fees.", true); return; }
    state.pendingWalletManagerAction = { kind: "fund", sourceWalletIndex, allocations, totalSol, attemptId: attemptId("wallet-batch-fund") };
    openSheet(`<div class="sheet-title"><img src="${slimePfp(source?.publicKey || "fund-wallets")}" alt=""><div><h2>Review wallet funding</h2><p>${allocations.length} wallet${allocations.length === 1 ? "" : "s"} from ${escapeHtml(source?.label || `Wallet ${sourceWalletIndex}`)}</p></div></div><div class="read-card"><h3>${totalSol.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")} SOL total</h3><p>${allocations.map((allocation) => `${escapeHtml(allocation.label)} · ${escapeHtml(allocation.amountSol)} SOL`).join("<br>")}</p></div><button class="submit-trade" type="button" data-confirm-wallet-manager-action>Fund selected wallets</button><button class="sheet-secondary" type="button" data-manage-wallets>Edit selection</button><p class="fineprint">This sends one Solana transaction containing one transfer per selected wallet. It cannot be reversed.</p>`);
  }
  function reviewWalletAction(kind) {
    const destinationIndex = Number($("[data-wallet-consolidate-destination]")?.value || state.activeWallet);
    const destinationWallet = state.wallets.find((wallet) => Number(wallet.index) === destinationIndex);
    const selected = selectedManagerWalletIndexes();
    if (!selected.length) { toast("Select at least one wallet.", true); return; }
    if (!destinationWallet) { toast("Choose the wallet that should receive the SOL.", true); return; }
    const walletIndexes = kind === "sweep" ? selected.filter((index) => index !== destinationIndex) : selected;
    if (!walletIndexes.length && kind === "sweep") { toast("Select another wallet to sweep into this one.", true); return; }
    const labels = selected.map((index) => state.wallets.find((wallet) => Number(wallet.index) === index)?.label || `Wallet ${index}`);
    state.pendingWalletManagerAction = { kind, walletIndexes, selectedWalletIndexes: selected, destination: destinationWallet.publicKey, destinationIndex, attemptId: attemptId(`wallet-${kind}`) };
    const title = kind === "sell" ? "Sell all tokens" : kind === "sweep" ? "Sweep all SOL" : "Sell tokens & sweep SOL";
    const actionLabel = kind === "sell" ? "Sell selected token balances" : kind === "sweep" ? "Sweep selected SOL" : "Sell & sweep selected wallets";
    openSheet(`<div class="sheet-title"><img src="${slimePfp(destinationWallet.publicKey)}" alt=""><div><h2>${title}</h2><p>${selected.length} selected wallet${selected.length === 1 ? "" : "s"}</p></div></div><div class="read-card"><h3>${escapeHtml(labels.join(", "))}</h3><p>${kind === "sell" ? "Every sellable token will be swapped to SOL." : `SOL will finish in ${escapeHtml(destinationWallet.label || `Wallet ${destinationIndex}`)} (${escapeHtml(short(destinationWallet.publicKey))}).`}</p></div><button class="submit-trade" type="button" data-confirm-wallet-manager-action>${actionLabel}</button><button class="sheet-secondary" type="button" data-manage-wallets>Edit selection</button><p class="fineprint">On-chain sells and transfers cannot be reversed. Failed or unsellable token balances stay in their original wallet and are reported in the result.</p>`);
  }
  async function confirmWalletManagerAction(button) {
    const pending = state.pendingWalletManagerAction;
    if (!pending || button.disabled) return;
    button.disabled = true;
    button.textContent = pending.kind === "fund" ? "Funding wallets…" : pending.kind === "sell" ? "Selling tokens…" : "Consolidating…";
    let path, body;
    if (pending.kind === "fund") {
      path = "/api/web/wallets/send-sol";
      body = { fromWalletIndex: pending.sourceWalletIndex, sourcePublicKey: state.wallets.find((wallet) => Number(wallet.index) === pending.sourceWalletIndex)?.publicKey || "", allocations: pending.allocations.map(({ destination, amountSol }) => ({ destination, amountSol })), sendAttemptId: pending.attemptId };
    } else if (pending.kind === "sell") {
      path = "/api/web/wallets/sell-all-tokens";
      body = { walletIndexes: pending.walletIndexes, clientRequestId: pending.attemptId };
    } else if (pending.kind === "sweep") {
      path = "/api/web/wallets/sweep-sol";
      body = { walletIndexes: pending.walletIndexes, destination: pending.destination, clientRequestId: pending.attemptId };
    } else {
      path = "/api/web/wallets/return-to-connected";
      body = { walletIndexes: pending.selectedWalletIndexes, destination: pending.destination, clientRequestId: pending.attemptId };
    }
    const result = await post(path, body, { timeout: 180_000 });
    if (!result.ok || !result.data?.ok) {
      button.disabled = false;
      button.textContent = "Try again";
      toast(apiMessage(result.data, "Wallet action failed."), true);
      return;
    }
    const summary = result.data?.sweep?.summary || result.data?.summary || "Wallet action complete.";
    state.pendingWalletManagerAction = null;
    await loadWallets(true);
    await loadPositions();
    renderWalletHero();
    renderWalletPositions();
    toast(summary);
    await openWalletManager();
  }
  async function renameWallet(index) {
    const label = String($(`[data-wallet-rename-input="${index}"]`)?.value || "").trim();
    if (!label) { toast("Enter a wallet name.", true); return; }
    const result = await post("/api/web/wallets/rename", { walletIndex: Number(index), label });
    if (!result.ok || !result.data?.ok) { toast(result.data?.error || "Could not rename wallet", true); return; }
    state.wallets = result.data.wallets || state.wallets; paintWalletPill(); renderWalletHero(); toast("Wallet renamed"); await openWalletManager();
  }
  async function exportWallets(button = null, options = {}) {
    const status = $("[data-wallet-manager-status]"); if (status) status.textContent = "Building backup files…";
    const oldLabel = button?.textContent || "";
    if (button) { button.disabled = true; button.textContent = "Preparing…"; }
    try {
      if (!(await ensureAccount())) { if (status) status.textContent = "Could not open your account."; toast("Could not open your account.", true); return; }
      const requestBody = options.walletPublicKey || options.walletIndex
        ? { publicKey: options.walletPublicKey || "", walletIndex: options.walletIndex || "" }
        : {};
      const result = await post("/api/web/wallets/export", requestBody);
      if (result.ok && result.data?.ok) {
        const downloads = result.data.backup?.downloads || {};
        let count = 0;
        if (options.recoveryOnly && downloads.recoveryKeys?.text) {
          downloadText(downloads.recoveryKeys.filename, downloads.recoveryKeys.text);
          count = 1;
        } else if (!options.recoveryOnly) {
          count = downloadWalletFiles(downloads);
        }
        if (!count) { if (status) status.textContent = "Backup file was unavailable."; toast("Backup file was unavailable.", true); return; }
        if (options.recoveryOnly) {
          const selected = state.wallets.find((wallet) => String(wallet.publicKey || "") === String(options.walletPublicKey || "") || Number(wallet.index) === Number(options.walletIndex));
          markWalletBackedUp(selected || options.walletPublicKey);
        } else {
          for (const wallet of state.wallets) markWalletBackedUp(wallet);
        }
        renderHomeReadiness();
        const message = options.recoveryOnly && count === 1
          ? "Selected wallet recovery key downloaded. Keep it private."
          : (count === 2 ? "Both wallet backup files downloaded." : (result.data.backup?.message || "Wallet backup downloaded."));
        if (status) status.textContent = message;
        toast(message);
      } else {
        const message = result.data?.error || "Backup failed.";
        if (status) status.textContent = message;
        toast(message, true);
      }
    } finally {
      if (button) { button.disabled = false; button.textContent = oldLabel || "Backup wallet"; }
    }
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
    state.activeWallet = state.wallets[0]?.index || null;if(state.activeWallet)localStorage.setItem(ACTIVE_WALLET_KEY,String(state.activeWallet));else localStorage.removeItem(ACTIVE_WALLET_KEY); paintWalletPill(); renderWalletHero(); toast("Wallet backed up and removed"); await openWalletManager();
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
      if (result.ok && result.data?.ok) { toast(`Bought ${coin.symbol || "coin"} · ${amount} SOL`); setTimeout(async () => { await Promise.all([loadWallets(true), loadPositions({ force: true })]); renderCoinShell(); }, 1600); }
      else toast(result.data?.message || result.data?.error || "Quick buy failed", true);
    } finally { state.quickBuyKey = ""; state.tradeBusy = false; button.disabled = false; button.textContent = oldText; }
  }
  async function submitTrade(button) {
    const side = button.dataset.side, coin = state.selected || {}, key = coinKey(coin), walletIndex = Number($("[data-trade-wallet]")?.value || state.activeWallet), rh = coin.chain === "robinhood";
    if (state.tradeBusy) return;
    state.tradeBusy = true; button.disabled = true; button.textContent = "Submitting…";
    let result;
    try {
      if (!(await ensureTradeReady())) return;
      if (rh) {
        const body = { walletIndex, side, tokenAddress: key, tradeAttemptId: attemptId("fun-rh") };
        if (side === "buy") { body.payCurrency = "SOL"; body.amountSol = $("[data-trade-amount]").value; }
        else body.percent = $("[data-trade-percent]").value;
        result = await post("/api/web/rh/trade", body);
        if (result.ok && result.data?.ok && side === "buy" && (Number($("[data-trade-tp]")?.value) > 0 || Number($("[data-trade-sl]")?.value) > 0)) await post("/api/web/rh/guards", { walletIndex, tokenAddress: key, symbol: coin.symbol || "", takeProfitPct: $("[data-trade-tp]").value, stopLossPct: $("[data-trade-sl]").value, sellPercent: "100", entryPriceUsd: coin.priceUsd || 0 });
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
      if (result.ok && result.data?.ok) { toast(side === "sell" && rh && result.data?.solCashout?.outSol ? `Sold · ${result.data.solCashout.outSol} SOL returned` : `${side === "buy" ? "Buy" : "Sell"} submitted`); closeSheet(); setTimeout(async () => { await Promise.all([loadWallets(true), loadPositions({ force: true })]); renderCoinShell(); }, 2200); }
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
  async function openVolumeSheet(tokenOverride = "") {
    if (!(await ensureAccount())) { toast("Connect a wallet to configure volume.", true); return; }
    await loadWallets();
    if (!state.wallets.length) { await openWalletManager(); return; }
    const coin = state.selected || {}, selectedKey = coinKey(coin), key = String(tokenOverride || selectedKey).trim();
    // A pasted contract is authoritative. This keeps a global/previously-opened
    // Solana panel from submitting a valid Robinhood address to the wrong flow.
    const rh = isRh(key) || (!tokenOverride && coin.chain === "robinhood");
    if (rh) {
      openSheet(`<div class="sheet-title"><img ${coinImageAttrs(coin)} alt=""><div><h2>Robinhood volume</h2><p>Native controls · ${escapeHtml(coin.symbol || short(key))}</p></div></div>
        <div class="read-card"><h3>Fresh-wallet round trips</h3><p>Convert SOL once, then a NEW throwaway wallet each cycle buys, sells (leaving one token), sweeps the ETH back to your funding wallet, and retires — running until you Stop or the SOL runs low. When it ends, the leftover ETH is auto-converted back to SOL.</p></div>
        <div class="field"><label>Token contract</label><input data-volume-token data-volume-chain="robinhood" value="${escapeHtml(key)}"></div>
        <div class="field"><label>Funding wallet</label><select data-volume-wallet>${volumeWalletOptions()}</select></div>
        <div class="field"><label>SOL budget</label><input data-rh-volume-fund inputmode="decimal" value="0.10" placeholder="0.10"></div>
        <input type="hidden" data-volume-rounds value="1">
        <div class="volume-actions"><button class="submit-trade" type="button" data-start-volume>Start with SOL</button><button type="button" data-stop-volume>Stop &amp; sweep</button></div>
        <div data-volume-status class="volume-status">Checking status…</div><p class="fineprint">One SOL→ETH conversion up front; each cycle sweeps its ETH back, so at most one cycle is ever exposed. On Stop the leftover ETH is bridged back to SOL automatically.</p>`);
    } else {
      openSheet(`<div class="sheet-title"><img ${coinImageAttrs(coin)} alt=""><div><h2>Volume bot</h2><p>Auto buy → sell → sweep → new wallet, until you Stop</p></div></div>
        <div class="read-card"><h3>How it runs</h3><p>Round-trip funds a fresh wallet, buys, sells it back down to one token, sweeps the SOL to your funding wallet, retires the wallet, and repeats — until Stop or your SOL runs out. Rolling pool keeps a few wallets open for a more organic tape.</p></div>
        <div class="field"><label>Token contract</label><input data-volume-token data-volume-chain="solana" value="${escapeHtml(key)}" placeholder="Solana contract address"></div>
        <div class="field"><label>Fund from wallet</label><select data-volume-wallet>${volumeWalletOptions()}</select></div>
        <div class="field"><label>Start with</label><select data-volume-funding><option value="sol" selected>SOL balance</option><option value="token">Held target token</option></select></div>
        <div class="field" data-volume-token-funding hidden><label>Token slice to seed</label><select data-volume-token-percent><option value="10">10%</option><option value="25" selected>25%</option><option value="50">50%</option></select></div>
        <p class="fineprint" data-volume-token-funding-note hidden>The slice sells once to seed rolling capital. Existing SOL stays protected, a small SOL gas balance is required, and recovered value returns as SOL.</p>
        <div class="field"><label>Style</label><select data-volume-pool><option value="1" selected>Round-trip · one wallet at a time</option><option value="3">Rolling pool · 3 wallets (organic)</option><option value="5">Wide pool · 5 wallets</option></select></div>
        <div class="field-row"><div class="field"><label>Min buy SOL</label><input data-volume-min inputmode="decimal" value="0.012"></div><div class="field"><label>Max buy SOL</label><input data-volume-max inputmode="decimal" value="0.03"></div></div>
        <div class="field-row"><div class="field"><label>Cadence</label><select data-volume-speed><option value="20">Calm</option><option value="8" selected>Natural</option><option value="3">Fast</option></select></div><div class="field"><label>Pattern</label><select data-volume-pattern><option value="organic" selected>Organic mix</option><option value="waves">Waves</option><option value="steady">Steady</option><option value="ladder">Uptrend bias</option></select></div></div>
        <div class="check-row"><span aria-hidden="true">✓</span> Retire each wallet with exactly 1 target token and zero native SOL</div>
        <label class="check-row"><input type="checkbox" data-volume-offset checked> Offset sells to older wallets (rolling pool only)</label>
        <div class="volume-actions"><button class="submit-trade" type="button" data-start-volume>Start</button><button type="button" data-stop-volume>Stop & sweep</button></div>
        <button class="recovery-button" type="button" data-sweep-volume>Sweep any stranded ghost wallets</button>
        <div data-volume-status class="volume-status">Checking status…</div><p class="fineprint">Wallet addresses cannot be burned. Empty ghost wallets are drained, removed from your list, and retired automatically. Keeping residue intentionally preserves a tiny token balance.</p>`);
    }
    pollFunVolume(rh);
  }
  function funVolumeRunActive(bot) {
    return Boolean(bot) && bot.status !== "completed" && !["done", "stopped"].includes(String(bot.stage || "").toLowerCase());
  }
  function volumeStatusHtml(rows = []) {
    if (!rows.length) return "No active run.";
    const activeRows = rows.filter(funVolumeRunActive);
    const displayRows = [...activeRows, ...rows.filter((bot) => !funVolumeRunActive(bot)).slice(0, Math.max(0, 3 - activeRows.length))];
    return displayRows.map((bot) => {
      const stats = bot.stats || {}, running = funVolumeRunActive(bot);
      const sweeping = running && String(bot.stage || "").toLowerCase() === "sweeping";
      const action = sweeping
        ? (bot.canRelease === false
          ? '<button class="recovery-button" type="button" disabled>Settling last action...</button>'
          : `<button class="recovery-button danger-button" type="button" data-release-volume="${escapeHtml(bot.id)}">Halt &amp; Release</button>`)
        : (running ? `<button class="recovery-button" type="button" data-stop-volume-plan="${escapeHtml(bot.id)}">Stop &amp; sweep</button>` : "");
      const logLines = (bot.log || []).slice(-8).reverse().map((row) => `<small>${escapeHtml(typeof row === "string" ? row : row.message || "")}</small>`).join("");
      const funding = bot.fundingAsset === "token" ? `${Number(bot.tokenSeedPercent || 0)}% held token` : "SOL";
      return `<div class="volume-run"><b>${escapeHtml(bot.shortMint || short(bot.tokenMint))}<span>${escapeHtml(running ? bot.stage || "running" : "complete")}</span></b><p>${escapeHtml(funding)} · buys ${Number(stats.buys || 0)} · sells ${Number(stats.sells || 0)} · volume ${Number(stats.volumeSol || 0).toFixed(3)} SOL${Number(stats.sweptSol || 0) ? ` · swept ${Number(stats.sweptSol).toFixed(3)}` : ""}</p><div class="volume-log">${logLines || '<small>Starting…</small>'}</div>${action}</div>`;
    }).join("");
  }
  async function pollFunVolume(rh) {
    clearTimeout(state.volumePoll);
    const status = $("[data-volume-status]"); if (!status) return;
    const result = await request(rh ? "/api/web/rh/volume/status" : "/api/web/volume-bot");
    if (status && result.ok) {
      if (!rh) { status.innerHTML = volumeStatusHtml(result.data?.bots || []); }
      else if (result.data?.status === "idle") { status.innerHTML = "No active run."; }
      else {
        const d = result.data, churn = d.mode === "churn";
        const runningRh = ["funding", "running", "stopping"].includes(String(d.status || ""));
        const head = churn ? `Cycles ${Number(d.done || 0)}` : `Round ${Number(d.done || 0)} / ${Number(d.rounds || 0)}`;
        const logLines = (d.log || []).slice(-8).reverse().map((row) => `<small>${escapeHtml(typeof row === "string" ? row : row.message || "")}</small>`).join("");
        const tradeLines = logLines ? "" : (d.trades || []).slice(-5).reverse().map((t) => `<small>${t.ok ? `Wallet ${t.walletIndex} · buy + sell` : escapeHtml(t.error || "Trade failed")}</small>`).join("");
        const stopBtn = runningRh ? `<button class="recovery-button danger-button" type="button" data-stop-volume>Stop &amp; sweep</button>` : "";
        const cashed = (!runningRh && Number(d.cashedOutSol) > 0) ? `<p class="volume-cashed">Cashed out ${Number(d.cashedOutSol).toFixed(4)} SOL back to your wallet.</p>` : "";
        status.innerHTML = `<div class="volume-run"><b>${escapeHtml(d.tokenAddress ? short(d.tokenAddress) : "Robinhood")}<span>${escapeHtml(d.status || "running")}</span></b><p>${head} · ${Number(d.fundSolPerWallet || 0).toFixed(3)} SOL${churn ? " · fresh wallet each cycle" : ""}</p><div class="volume-log">${logLines || tradeLines || '<small>Starting…</small>'}</div>${cashed}${stopBtn}</div>`;
      }
    }
    if ($("[data-volume-status]")) state.volumePoll = setTimeout(() => pollFunVolume(rh), 4000);
  }
  async function startFunVolume(button) {
    if (!(await ensureTradeReady())) return;
    const tokenField = $("[data-volume-token]"), token = String(tokenField?.value || "").trim(), configuredRh = tokenField?.dataset.volumeChain === "robinhood", detectedRh = isRh(token), rh = detectedRh, walletIndex = Number($("[data-volume-wallet]")?.value || state.activeWallet), min = $("[data-volume-min]")?.value || "", max = $("[data-volume-max]")?.value || "";
    const fundingAsset = $("[data-volume-funding]")?.value === "token" ? "token" : "sol";
    const tokenSeedPercent = fundingAsset === "token" ? Number($("[data-volume-token-percent]")?.value || 25) : 0;
    if (configuredRh !== detectedRh) { openVolumeSheet(token); toast(`Switched to the ${detectedRh ? "Robinhood" : "Solana"} volume controls. Review the settings and tap Start.`); return; }
    if (!token || (!rh && (!(Number(min) > 0) || !(Number(max) >= Number(min))))) { toast(rh ? "Check the Robinhood contract." : "Check the contract and min/max size.", true); return; }
    if (!rh && fundingAsset === "token" && !confirm(`Sell ${tokenSeedPercent}% of this wallet's current target-token balance once to seed the volume bot? Existing SOL stays protected and recovered value returns as SOL.`)) return;
    button.disabled = true; button.textContent = "Starting…";
    let result;
    if (rh) {
      const fundSol = Number($("[data-rh-volume-fund]")?.value || 0);
      if (!(fundSol >= 0.005) || fundSol > 5) { button.disabled = false; button.textContent = "Start with SOL"; toast("Enter 0.005 to 5 SOL.", true); return; }
      button.textContent = "Converting SOL…";
      result = await post("/api/web/rh/volume/start", { tokenAddress: token, walletIndexes: [walletIndex], rounds: $("[data-volume-rounds]")?.value || "3", payCurrency: "SOL", fundSolPerWallet: String(fundSol) });
    } else {
      const pattern = $("[data-volume-pattern]")?.value || "organic", delaySecs = $("[data-volume-speed]")?.value || "8";
      const sourceWallet = state.wallets.find((wallet) => Number(wallet.index) === walletIndex);
      const poolSize = $("[data-volume-pool]")?.value || "1";   // 1 = clean round-trip, one wallet at a time
      result = await post("/api/web/volume-bot/start", { tokenMint: token, sourceWalletIndex: walletIndex, sourceWalletPublicKey: sourceWallet?.publicKey || "", fundingAsset, tokenSeedPercent, rollingWallets: true, buyAmountSol: String((Number(min) + Number(max)) / 2), minBuyAmountSol: min, maxBuyAmountSol: max, poolSize, maxRounds: "0", sellPercent: "100", buyBias: pattern === "ladder" ? "75" : "55", delaySecs, slippageBps: 600, sweepBack: true, keepDust: true, offsetSell: Boolean($("[data-volume-offset]")?.checked), staggerPattern: pattern, tradeAttemptId: attemptId("fun-volume") });
    }
    button.disabled = false; button.textContent = rh ? "Start with SOL" : "Start";
    if (result.ok && result.data?.ok) { toast("Volume run started"); pollFunVolume(rh); }
    else if (!rh) {
      toast(result.data?.error || result.data?.message || "Could not start volume", true);
      pollFunVolume(false);
    } else toast(result.data?.error || result.data?.message || "Could not start volume", true);
  }
  async function stopFunVolume() {
    const token = String($("[data-volume-token]")?.value || "").trim(), rh = isRh(token);
    let result;
    if (rh) result = await post("/api/web/rh/volume/stop", {});
    else {
      const current = await request("/api/web/volume-bot"), run = (current.data?.bots || []).find((bot) => bot.tokenMint === token && funVolumeRunActive(bot));
      if (!run) { toast("No active run for this coin.", true); return; }
      return stopFunVolumePlan(run.id);
    }
    if (!(result?.ok && result.data?.ok)) { toast(result?.data?.error || "Could not stop this run", true); return; }
    toast(rh ? "Stopping after the current action" : "Stopping, draining, and sweeping back"); pollFunVolume(rh);
  }
  async function stopFunVolumePlan(planId) {
    if (!planId) return;
    const result = await post("/api/web/volume-bot/stop", { planId });
    if (!(result?.ok && result.data?.ok)) { toast(result?.data?.error || result?.data?.message || "Could not stop this run", true); return; }
    toast("Stopping, draining, and sweeping back");
    pollFunVolume(false);
  }
  async function releaseFunVolume(planId) {
    if (!planId) return;
    if (!confirm("Halt this run and release its source wallet? No new trades will be submitted. Any already-submitted transaction may still settle, and retained ghost wallets stay recoverable.")) return;
    const result = await post("/api/web/volume-bot/release", { planId, confirmRelease: true });
    if (!(result.ok && result.data?.ok)) {
      toast(result.data?.error || result.data?.message || "Could not release this run yet", true);
      pollFunVolume(false);
      return;
    }
    toast("Run halted. You can start a new volume run now.");
    pollFunVolume(false);
  }
  async function sweepFunVolume(attempt = 0) {
    if (state.volumeSweepPending) return;
    state.volumeSweepPending = true;
    const result = await post("/api/web/wallets/sweep-background", { preserveOneToken: true }, { timeout: 180_000, noRetry: true });
    state.volumeSweepPending = false;
    const ok = Boolean(result.ok && result.data?.ok);
    const keepFollowing = ok && attempt < 120 && (result.data?.queued || Number(result.data?.pending || 0) > 0);
    if (attempt === 0 || !keepFollowing) toast(ok ? (result.data.summary || "Background wallet recovery started") : (result.data?.error || "Sweep failed"), !ok);
    pollFunVolume(false);
    if (keepFollowing) {
      clearTimeout(state.volumeSweepFollowup);
      state.volumeSweepFollowup = setTimeout(() => sweepFunVolume(attempt + 1), 5_000);
    }
  }
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
    if (action === "cash") { location.assign("/cash/?from=fun"); return; }
    if (action === "poly") { location.assign("/polymarket"); return; }
    if (action === "profile") { closeSheet(); state.profileTab = "social"; $$('[data-profile]').forEach((button) => button.classList.toggle("active", button.dataset.profile === "social")); setView("wallet"); loadWalletView(); return; }
    if (action === "traders") { closeSheet(); setView("leaders"); return; }
    if (action === "portfolio") { closeSheet(); state.profileTab = "positions"; setView("wallet"); return; }
    if (action === "liquidity") { openFunTool("liquidity", { route: `rhtrade/${encodeURIComponent(key)}`, title: "Open trading", note: "Create or manage Robinhood liquidity · stays inside SlimeWire Go" }); return; }
    if (action === "volume") { openVolumeSheet(); return; }
    if (action === "watch") { ensureAccount().then((ready) => ready ? post("/api/web/watchlist", { tokenMint: key, action: "add", symbol: coin.symbol || "", name: coin.name || "", imageUrl: coin.imageUrl || "" }) : { ok: false }).then((result) => toast(result.ok ? "Saved to Watchlist" : "Could not save coin", !result.ok)); closeSheet(); return; }
    if (action === "telegram") { window.open(`https://t.me/${window.OGRE_PORTAL_CONFIG?.telegramBotUsername || "SlimeWiredBot"}?start=scan_${encodeURIComponent(key)}`, "_blank", "noopener"); return; }
    if (action === "install") { openFunInstall(); return; }
    if (action === "launch") { openFunLaunch(); return; }
    if (["copy", "sniper", "walletLaunch"].includes(action)) { openFunTool(action); return; }
  }

  const FUN_TOOL_ROUTES = {
    copy: { route: "copy", title: "Trader copy", note: "Follow a public wallet · stays inside SlimeWire Go" },
    sniper: { route: "sniper", title: "Launch snipe", note: "Watch a ticker or name · runs server-side" },
    walletLaunch: { route: "walletLaunch", title: "Wallet launch snipe", note: "Watch a creator or deployer · runs server-side" }
  };
  function openFunTool(action, override = null) {
    const config = override || FUN_TOOL_ROUTES[action];
    if (!config) return;
    if (state.view !== "tool") state.toolReturnView = state.view || "home";
    state.activeTool = action;
    closeSheet();
    setView("tool");
    const title = $("[data-tool-view-title]"), note = $("[data-tool-view-note]"), frame = $("[data-tool-frame]");
    if (title) title.textContent = config.title;
    if (note) note.textContent = config.note;
    if (frame) {
      const nextSrc = `/?from=fun&embed=fun-tool#${config.route}`;
      if (frame.dataset.tool !== action || !frame.src) {
        frame.dataset.tool = action;
        frame.setAttribute("aria-busy", "true");
        frame.addEventListener("load", () => frame.removeAttribute("aria-busy"), { once: true });
        frame.src = nextSrc;
      }
    }
    history.replaceState(null, "", `#tool/${encodeURIComponent(action)}`);
  }
  function closeFunTool() {
    state.activeTool = "";
    history.replaceState(null, "", "#");
    setView(state.toolReturnView && state.toolReturnView !== "tool" ? state.toolReturnView : "home");
    if (state.token) Promise.all([loadWallets(true), loadPositions({ force: true })]).catch(() => {});
  }

  function openFunLaunch() {
    if (state.view !== "launch") state.launchReturnView = state.view || "home";
    closeSheet();
    setView("launch");
    const frame = $("[data-launch-frame]");
    if (frame) {
      frame.setAttribute("aria-busy", "true");
      frame.addEventListener("load", () => frame.removeAttribute("aria-busy"), { once: true });
      // A launch is a new action, not a navigation back into the last coin.
      // Reload the embedded launcher every time so Cash -> Fun and repeated
      // mobile launches always begin with an empty form and a fresh attempt id.
      frame.src = `/?from=fun&embed=fun-launch&freshLaunch=1&v=nft-manager-2&t=${Date.now()}#launch`;
    }
    history.replaceState(null, "", "#launch");
  }
  function closeFunLaunch() {
    history.replaceState(null, "", "#");
    setView(state.launchReturnView && state.launchReturnView !== "launch" ? state.launchReturnView : "home");
    if (state.token) Promise.all([loadWallets(true), loadPositions({ force: true }), loadCreatedCoinsSilently()]).catch(() => {});
  }

  async function openSendSolSheet() {
    if (!(await ensureAccount())) { toast("Could not open your account.", true); return; }
    await loadWallets(true);
    const wallet = activeWallet();
    if (!wallet) { openFundingSheet(); toast("Create or restore a wallet first.", true); return; }
    state.pendingSolSend = null;
    const walletOptions = state.wallets.map((item) => `<option value="${item.index}" ${item.index === wallet.index ? "selected" : ""}>${escapeHtml(item.label || `Wallet ${item.index}`)} · ${Number(item.sol || 0).toFixed(5)} SOL</option>`).join("");
    openSheet(`<div class="sheet-title"><img src="${slimePfp(wallet.publicKey)}" alt=""><div><h2>Send SOL</h2><p>From a SlimeWire managed wallet</p></div></div>
      <div class="field"><label>From</label><select data-send-sol-wallet>${walletOptions}</select></div>
      <div class="field"><label>Destination</label><input data-send-sol-destination autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="Solana wallet address"></div>
      <div class="field"><label>Amount · SOL</label><input data-send-sol-amount inputmode="decimal" placeholder="0.1"><div class="amount-chips"><button type="button" data-send-sol-chip="0.1">0.1</button><button type="button" data-send-sol-chip="0.5">0.5</button><button type="button" data-send-sol-chip="1">1</button><button type="button" data-send-sol-all>All</button></div></div>
      <div class="field"><label>Spend PIN · only if enabled</label><input data-send-sol-pin type="password" inputmode="numeric" autocomplete="off" placeholder="Optional"></div>
      <button class="submit-trade" type="button" data-review-sol-send>Review send</button>
      <p class="fineprint" data-send-sol-status>All drains the transferable balance after the exact network and app fees are calculated by the server.</p>`);
  }

  function selectFunSendAll() {
    const walletIndex = Number($("[data-send-sol-wallet]")?.value || state.activeWallet);
    const wallet = state.wallets.find((item) => Number(item.index) === walletIndex) || activeWallet();
    if (!wallet || !(Number(wallet.sol) > 0)) { toast("This wallet has no SOL to send.", true); return; }
    const input = $("[data-send-sol-amount]");
    if (input) { input.value = Number(wallet.sol).toFixed(9).replace(/0+$/, "").replace(/\.$/, ""); input.dataset.sendAll = "true"; }
    $$('[data-send-sol-all]').forEach((button) => button.classList.add("active"));
    const status = $("[data-send-sol-status]");
    if (status) status.textContent = "All available SOL selected. Final transferable amount is calculated at confirmation.";
  }

  function reviewFunSolSend() {
    const destination = String($("[data-send-sol-destination]")?.value || "").trim();
    const amountInput = $("[data-send-sol-amount]");
    const amountSol = String(amountInput?.value || "").trim();
    const sendAll = amountInput?.dataset.sendAll === "true";
    const walletIndex = Number($("[data-send-sol-wallet]")?.value || state.activeWallet);
    const spendPin = String($("[data-send-sol-pin]")?.value || "").trim();
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(destination)) { toast("Enter a valid Solana destination.", true); return; }
    if (!sendAll && !(Number(amountSol) > 0)) { toast("Enter a SOL amount or choose All.", true); return; }
    const wallet = state.wallets.find((item) => Number(item.index) === walletIndex);
    if (!wallet) { toast("Choose a wallet.", true); return; }
    state.pendingSolSend = { destination, amountSol, sendAll, walletIndex, spendPin, sendAttemptId: attemptId("fun-send-sol") };
    openSheet(`<div class="sheet-title"><img src="${slimePfp(wallet.publicKey)}" alt=""><div><h2>Confirm send</h2><p>${escapeHtml(wallet.label || `Wallet ${walletIndex}`)}</p></div></div>
      <div class="read-card"><h3>${sendAll ? "All available SOL" : `${escapeHtml(amountSol)} SOL`}</h3><p>To ${escapeHtml(short(destination))}</p></div>
      <button class="submit-trade" type="button" data-confirm-sol-send>Send SOL</button>
      <button class="sheet-secondary" type="button" data-send-sol>Edit</button>
      <p class="fineprint">This is an on-chain transfer and cannot be reversed. All is fee-aware and drains the transferable balance.</p>`);
  }

  async function confirmFunSolSend(button) {
    const pending = state.pendingSolSend;
    if (!pending || button.disabled) return;
    button.disabled = true;
    button.textContent = "Sending…";
    const result = await post("/api/web/cash/send", {
      fromWalletIndex: pending.walletIndex,
      destination: pending.destination,
      asset: "SOL",
      ...(pending.sendAll ? { sendAll: true } : { amountSol: pending.amountSol }),
      ...(pending.spendPin ? { spendPin: pending.spendPin } : {}),
      sendAttemptId: pending.sendAttemptId
    }, { timeout: 75_000 });
    if (!result.ok || !result.data?.ok) {
      button.disabled = false;
      button.textContent = "Send SOL";
      toast(apiMessage(result.data, "SOL send failed."), true);
      return;
    }
    const sent = Number(result.data.amountSol || 0);
    state.pendingSolSend = null;
    await loadWallets(true);
    await loadPositions();
    renderWalletHero();
    renderWalletPositions();
    closeSheet();
    toast(sent > 0 ? `${sent.toFixed(6)} SOL sent` : "SOL sent");
  }

  function walletReceive() {
    const wallet = activeWallet();
    if (!wallet) { openFundingSheet("Choose a funding source, or use Create & copy for a manual deposit address."); return; }
    openSheet(`<div class="sheet-title"><img src="${slimePfp(wallet.publicKey)}" alt=""><div><h2>Receive SOL</h2><p>${escapeHtml(wallet.label || "Slime wallet")}</p></div></div><div class="read-card"><h3>Solana address</h3><button class="wallet-full-address" type="button" data-copy-wallet-address="${escapeHtml(wallet.publicKey)}"><code>${escapeHtml(wallet.publicKey)}</code><span>Tap address to copy</span></button></div><button class="submit-trade" type="button" data-copy-wallet-address="${escapeHtml(wallet.publicKey)}">Copy address</button><p class="fineprint">Only send Solana assets to this address. Robinhood ETH uses the derived RH address available in the full wallet tools.</p>`);
  }

  document.addEventListener("click", async (event) => {
    const nav = event.target.closest("[data-nav]"); if (nav) { closeSearch(); closeSheet(); setView(nav.dataset.nav); return; }
    if (event.target.closest("[data-open-search]")) { openSearch(); return; }
    if (event.target.closest("[data-open-cash]")) { location.assign("/cash/?from=fun"); return; }
    if (event.target.closest("[data-close-search]")) { closeSearch(); return; }
    if (event.target.closest("[data-close-sheet]")) { closeSheet(); return; }
    if (event.target.closest("[data-wallet-entry]")) { if (state.token) await loadWallets(true); openFundingSheet(); return; }
    if (event.target.closest("[data-deposit]")) { if (state.token) await loadWallets(true); openFundingSheet(); return; }
    if (event.target.closest("[data-season-open]")) { await openFunSeason(); return; }
    const seasonStart = event.target.closest("[data-season-start]"); if (seasonStart) { await startFunSeason(seasonStart); return; }
    const backupWallet = event.target.closest("[data-backup-wallet]"); if (backupWallet) { await exportWallets(backupWallet, { recoveryOnly: true, walletPublicKey: backupWallet.dataset.walletKey || activeWallet()?.publicKey || "", walletIndex: backupWallet.dataset.walletIndex || activeWallet()?.index || "" }); return; }
    if (event.target.closest("[data-send-sol]")) { await openSendSolSheet(); return; }
    if (event.target.closest("[data-send-sol-all]")) { selectFunSendAll(); return; }
    const sendSolChip = event.target.closest("[data-send-sol-chip]"); if (sendSolChip) { const input = $("[data-send-sol-amount]"); if (input) { input.value = sendSolChip.dataset.sendSolChip; delete input.dataset.sendAll; } $$('[data-send-sol-all]').forEach((button) => button.classList.remove("active")); return; }
    if (event.target.closest("[data-review-sol-send]")) { reviewFunSolSend(); return; }
    const confirmSolSend = event.target.closest("[data-confirm-sol-send]"); if (confirmSolSend) { await confirmFunSolSend(confirmSolSend); return; }
    if (event.target.closest("[data-receive]")) { walletReceive(); return; }
    const fundCoinbase = event.target.closest("[data-fund-coinbase]"); if (fundCoinbase) { await startCoinbaseFunding(fundCoinbase); return; }
    const fundWallet = event.target.closest("[data-fund-wallet]"); if (fundWallet) { await startWalletFunding(fundWallet.dataset.fundWallet, fundWallet); return; }
    const fundAmount = event.target.closest("[data-fund-amount]"); if (fundAmount) { const input = $("[data-fund-sol]"); if (input) input.value = fundAmount.dataset.fundAmount; return; }
    if (event.target.closest("[data-fund-copy]")) { await copyFundingAddress(); return; }
    const customWalletSell = event.target.closest("[data-fun-position-custom]"); if (customWalletSell) { openFunWalletPositionCustom(customWalletSell); return; }
    const customWalletPercent = event.target.closest("[data-fun-custom-percent]"); if (customWalletPercent) { const input = $("[data-fun-custom-sell-percent]"); if (input) input.value = customWalletPercent.dataset.funCustomPercent; return; }
    const walletPositionSell = event.target.closest("[data-fun-position-sell]"); if (walletPositionSell) { await sellFunWalletPosition(walletPositionSell); return; }
    const sendToken = event.target.closest("[data-fun-send-token]"); if (sendToken) { openFunTokenSend(sendToken); return; }
    const sendTokenPercent = event.target.closest("[data-set-send-token-percent]"); if (sendTokenPercent) { const input = $("[data-send-token-amount]"); const pending = state.pendingTokenSend; if (input && pending) { const percent = Number(sendTokenPercent.dataset.setSendTokenPercent || 0); input.value = tokenSendDisplayAmount(pending.balance, percent); input.dataset.sendTokenPercent = String(percent); pending.percent = percent; $$('[data-set-send-token-percent]').forEach((item) => item.classList.toggle("active", item === sendTokenPercent)); } return; }
    if (event.target.closest("[data-review-token-send]")) { reviewFunTokenSend(); return; }
    const confirmTokenSend = event.target.closest("[data-confirm-token-send]"); if (confirmTokenSend) { await confirmFunTokenSend(confirmTokenSend); return; }
    const claimCreatorFees = event.target.closest("[data-claim-creator-fees]"); if (claimCreatorFees) { await claimFunCreatorFees(claimCreatorFees); return; }
    const coinButton = event.target.closest("[data-open-coin]"); if (coinButton) { closeSearch(); closeSheet(); await openCoin(coinButton.dataset.openCoin, coinButton.dataset.chainKind); return; }
    const chainButton = event.target.closest("[data-chain]"); if (chainButton) { state.chain = chainButton.dataset.chain; $$("[data-chain]").forEach((button) => button.classList.toggle("active", button.dataset.chain === state.chain)); loadFeed(true); return; }
    const feedButton = event.target.closest("[data-feed]"); if (feedButton) { state.feed = feedButton.dataset.feed; $$("[data-feed]").forEach((button) => button.classList.toggle("active", button === feedButton)); loadFeed(); return; }
    const leaderTab = event.target.closest("[data-leader-tab]"); if (leaderTab) { state.leaderTab = leaderTab.dataset.leaderTab || "top"; state.traderSearch = ""; const input = $("[data-trader-search]"); if (input) input.value = ""; syncLeaderTabs(); await loadLeaders(); return; }
    if (event.target.closest("[data-refresh-feed]")) { loadFeed(true); return; }
    if (event.target.closest("[data-launch-back]")) { closeFunLaunch(); return; }
    if (event.target.closest("[data-tool-back]")) { closeFunTool(); return; }
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
    if (event.target.closest("[data-install-fun]")) { await openFunInstall(); return; }
    if (event.target.closest("[data-manage-presets]")) { await openPresetManager(); return; }
    if (event.target.closest("[data-save-trade-preset]")) { await saveTradePreset(); return; }
    const usePreset = event.target.closest("[data-use-trade-preset]"); if (usePreset) { state.activePresetId = usePreset.dataset.useTradePreset; localStorage.setItem(ACTIVE_PRESET_KEY, state.activePresetId); renderQuickTrade(); toast("Preset active"); await openPresetManager(); return; }
    const editPreset = event.target.closest("[data-edit-trade-preset]"); if (editPreset) { await openPresetManager(editPreset.dataset.editTradePreset); return; }
    const deletePreset = event.target.closest("[data-delete-trade-preset]"); if (deletePreset) { const id = deletePreset.dataset.deleteTradePreset; const result = await post("/api/web/presets", { type: "trade", action: "delete", id, preset: { id } }); if (result.ok && result.data?.ok) { state.presets = result.data.presets; if (state.activePresetId === id) { state.activePresetId = ""; localStorage.removeItem(ACTIVE_PRESET_KEY); } renderQuickTrade(); toast("Preset removed"); await openPresetManager(); } else toast(result.data?.error || "Could not remove preset", true); return; }
    const activatePreset = event.target.closest("[data-activate-preset]"); if (activatePreset) { state.activePresetId = activatePreset.dataset.activatePreset || ""; if (state.activePresetId) localStorage.setItem(ACTIVE_PRESET_KEY, state.activePresetId); else localStorage.removeItem(ACTIVE_PRESET_KEY); renderQuickTrade(); toast(state.activePresetId ? "Preset active" : "Manual buys active"); return; }
    const reviewBuy = event.target.closest("[data-review-buy]"); if (reviewBuy) { if (!state.wallets.length) await loadWallets(); openTradeSheet("buy", { amount: reviewBuy.dataset.reviewBuy }); return; }
    const customReviewBuy = event.target.closest("[data-custom-review-buy]"); if (customReviewBuy) { const amount = String($("[data-custom-review-amount]")?.value || "").trim(); if (!(Number(amount) > 0)) { toast("Enter a valid SOL amount.", true); return; } if (!state.wallets.length) await loadWallets(); openTradeSheet("buy", { amount }); return; }
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
    if (event.target.closest("[data-open-cash]")) { location.assign("/cash?sheet=addcash"); return; }
    if (event.target.closest("[data-manage-wallets]")) { await openWalletManager(); return; }
    const quickPanel = event.target.closest("[data-quick-panel]"); if (quickPanel) { state.quickPanel = quickPanel.dataset.quickPanel || "trade"; renderQuickRoute(); return; }
    const quickAmount = event.target.closest("[data-quick-select-amount]"); if (quickAmount) { state.quickAmount = quickAmount.dataset.quickSelectAmount || "0.1"; renderQuickRoute(); return; }
    if (event.target.closest("[data-quick-custom-focus]")) { $("[data-quick-custom-amount]")?.focus(); return; }
    if (event.target.closest("[data-quick-set-custom]")) { const amount = String($("[data-quick-custom-amount]")?.value || "").trim(); if (!(Number(amount) > 0)) { toast("Enter a valid SOL amount.", true); return; } state.quickAmount = amount; renderQuickRoute(); return; }
    if (event.target.closest("[data-quick-review]")) { if (!activeWallet()) { openFundingSheet(); return; } openTradeSheet("buy", { amount: state.quickAmount || "0.1" }); return; }
    if (event.target.closest("[data-quick-bundle]")) { await openBundleSheet(); return; }
    const accountMode = event.target.closest("[data-fun-account]"); if (accountMode) { openFunAccount(accountMode.dataset.funAccount || "login"); return; }
    const submitAccount = event.target.closest("[data-submit-fun-account]"); if (submitAccount) { await submitFunAccount(submitAccount, submitAccount.dataset.submitFunAccount || "login"); return; }
    const saveReferral = event.target.closest("[data-save-referral-code]"); if (saveReferral) { await saveFunReferralCode(saveReferral); return; }
    const savePayout = event.target.closest("[data-save-referral-payout]"); if (savePayout) { await saveFunReferralPayout(savePayout); return; }
    if (event.target.closest("[data-fun-sign-out]")) { if (confirm("Sign out on this device? Your wallets stay on your account.")) { setToken(""); state.user = null; state.wallets = []; state.positions = []; state.activeWallet = null; paintWalletPill(); renderWalletHero(); renderSocialProfile(); toast("Signed out"); } return; }
    const copyInvite = event.target.closest("[data-copy-invite]"); if (copyInvite) { const link = state.user?.referralLink || location.origin; if (navigator.share) { try { await navigator.share({ title: "SlimeWire", text: "Trade coins with me on SlimeWire", url: link }); return; } catch { /* fell through to copy */ } } navigator.clipboard?.writeText(link).then(() => toast("Invite link copied"), () => toast("Could not copy", true)); return; }
    const saveProfile = event.target.closest("[data-save-social-profile]"); if (saveProfile) { await saveSocialProfile(saveProfile); return; }
    const enablePush = event.target.closest("[data-enable-push]"); if (enablePush) { await enableFunPush(enablePush); return; }
    if (event.target.closest("[data-create-wallet]")) { if (await createWallet()) { if (state.view === "quick") { closeSheet(); renderQuickRoute(); } else await openWalletManager(); } return; }
    if (event.target.closest("[data-wallet-select-all]")) { setWalletManagerSelection(state.wallets.map((wallet) => wallet.index)); return; }
    if (event.target.closest("[data-wallet-select-none]")) { setWalletManagerSelection([]); return; }
    const walletFunds = event.target.closest("[data-wallet-funds]"); if (walletFunds) { focusWalletFunds(walletFunds.dataset.walletFunds); return; }
    const fundingMode = event.target.closest("[data-wallet-fund-mode]"); if (fundingMode) { setWalletFundingMode(fundingMode.dataset.walletFundMode); return; }
    if (event.target.closest("[data-review-wallet-fund]")) { reviewWalletFunding(); return; }
    const walletAction = event.target.closest("[data-review-wallet-action]"); if (walletAction) { reviewWalletAction(walletAction.dataset.reviewWalletAction); return; }
    const confirmWalletAction = event.target.closest("[data-confirm-wallet-manager-action]"); if (confirmWalletAction) { await confirmWalletManagerAction(confirmWalletAction); return; }
    const exportButton = event.target.closest("[data-export-wallets]"); if (exportButton) { await exportWallets(exportButton); return; }
    if (event.target.closest("[data-restore-wallet]")) { await restoreWallet(); return; }
    const remove = event.target.closest("[data-remove-wallet]"); if (remove) { await removeWallet(remove.dataset.removeWallet, remove.dataset.walletKey); return; }
    const select = event.target.closest("[data-select-wallet]"); if (select) { state.activeWallet = Number(select.dataset.selectWallet);localStorage.setItem(ACTIVE_WALLET_KEY,String(state.activeWallet)); paintWalletPill(); renderWalletHero(); renderQuickTrade(); if (state.view === "quick") renderQuickRoute(); await openWalletManager(); return; }
    const rename = event.target.closest("[data-rename-wallet]"); if (rename) { await renameWallet(rename.dataset.renameWallet); return; }
    const startVolume = event.target.closest("[data-start-volume]"); if (startVolume) { await startFunVolume(startVolume); return; }
    if (event.target.closest("[data-stop-volume]")) { await stopFunVolume(); return; }
    const stopVolumePlan = event.target.closest("[data-stop-volume-plan]"); if (stopVolumePlan) { await stopFunVolumePlan(stopVolumePlan.dataset.stopVolumePlan); return; }
    const releaseVolume = event.target.closest("[data-release-volume]"); if (releaseVolume) { await releaseFunVolume(releaseVolume.dataset.releaseVolume); return; }
    if (event.target.closest("[data-sweep-volume]")) { await sweepFunVolume(); return; }
    const submitBundle = event.target.closest("[data-submit-bundle]"); if (submitBundle) { await submitFunBundle(submitBundle); return; }
    const walletAddressCopy = event.target.closest("[data-copy-wallet-address]"); if (walletAddressCopy) { await copyWalletAddress(walletAddressCopy.dataset.copyWalletAddress); return; }
    if (event.target.closest("[data-copy-wallet]")) { const wallet = activeWallet(); if (wallet) await copyWalletAddress(wallet.publicKey); return; }
    if (event.target.closest("[data-market-orders]")) { await openMarketOrdersSheet(); return; }
    const submitMarketOrder = event.target.closest("[data-submit-market-orders]"); if (submitMarketOrder) { await submitMarketOrders(submitMarketOrder); return; }
    const cancelOrder = event.target.closest("[data-cancel-market-order]"); if (cancelOrder) { await cancelMarketOrder(cancelOrder); return; }
    if (event.target.closest("[data-price-alert]")) { openSheet(`<div class="sheet-title"><img src="${escapeHtml(coinImage(state.selected || {}))}" alt=""><div><h2>Coin alerts</h2><p>Keep the chart clean and send alerts where they matter.</p></div></div><div class="tool-grid">${toolCard("watchlist", "Watch coin", "Save to your list", "watch")}${toolCard("warning", "Telegram alert", "Open SlimeWiredBot", "telegram")}</div>`); return; }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-volume-funding]")) {
      const tokenFunding = event.target.value === "token";
      $$("[data-volume-token-funding], [data-volume-token-funding-note]").forEach((node) => { node.hidden = !tokenFunding; });
      return;
    }
    if (event.target.matches("[data-quick-wallet-select]")) { state.activeWallet = Number(event.target.value);localStorage.setItem(ACTIVE_WALLET_KEY,String(state.activeWallet)); paintWalletPill(); renderQuickRoute(); return; }
    if (event.target.matches("[data-send-sol-wallet]")) { const input = $("[data-send-sol-amount]"); if (input?.dataset.sendAll === "true") selectFunSendAll(); return; }
    if (event.target.matches("[data-wallet-batch-select]")) { updateWalletManagerSelection(); return; }
    if (event.target.matches("[data-wallet-fund-source]")) { updateWalletFundingSource(); return; }
    if (!event.target.matches("[data-wallet-backup-file]")) return;
    const file = event.target.files?.[0], textarea = $("[data-wallet-backup-text]"), status = $("[data-wallet-manager-status]");
    if (!file || !textarea) return;
    const reader = new FileReader();
    reader.onload = () => { textarea.value = String(reader.result || "").trim(); if (status) status.textContent = `Loaded ${file.name}. Tap Restore / import wallet.`; };
    reader.onerror = () => { if (status) status.textContent = "Could not read that file. Paste the backup text instead."; };
    reader.readAsText(file);
  });
  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-volume-token]")) {
      const token = String(event.target.value || "").trim();
      const configuredRh = event.target.dataset.volumeChain === "robinhood";
      const detectedRh = isRh(token);
      const looksSolana = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(token);
      if ((detectedRh && !configuredRh) || (looksSolana && configuredRh)) {
        openVolumeSheet(token);
        toast(`Switched to ${detectedRh ? "Robinhood" : "Solana"} volume controls.`);
      }
      return;
    }
    if (!event.target.matches("[data-send-token-amount]")) return;
    delete event.target.dataset.sendTokenPercent;
    if (state.pendingTokenSend) state.pendingTokenSend.percent = 0;
    $$('[data-set-send-token-percent]').forEach((button) => button.classList.remove("active"));
  });
  document.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" || !event.target.matches("[data-custom-review-amount]")) return;
    event.preventDefault(); const amount = String(event.target.value || "").trim(); if (Number(amount) > 0) openTradeSheet("buy", { amount });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) clearTimeout(state.feedTimer);
    else {
      resumePendingFunFunding();
      if (state.view === "home") { void loadFeed(true, { silent: true }); scheduleFeedRefresh(); }
    }
  });
  window.addEventListener("focus", resumePendingFunFunding);
  window.addEventListener("pageshow", resumePendingFunFunding);

  document.addEventListener("error", async (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches("[data-token-image]")) return;
    const current = image.currentSrc || image.src || "";
    const resolved = await workingCoinImage(image);
    if (resolved && resolved !== current) { rememberCoinImage(image.dataset.coinImageKey, resolved); return; }
    image.src = coinBadge({
      address: image.dataset.coinImageKey || image.closest("[data-open-coin]")?.dataset.openCoin || state.selected && coinKey(state.selected),
      symbol: image.dataset.coinSymbol || state.selected?.symbol || "?"
    });
    scheduleCoinImageRetry(image);
  }, true);
  document.addEventListener("load", (event) => {
    const image = event.target;
    if (!(image instanceof HTMLImageElement) || !image.matches("[data-token-image]")) return;
    const key = image.dataset.coinImageKey || "";
    if (key && image.naturalWidth > 1 && !/token-mascot-|slimewire-mark/.test(image.currentSrc || image.src)) {
      rememberCoinImage(key, image.currentSrc || image.src);
    }
  }, true);

  $("[data-search-input]").addEventListener("input", (event) => { clearTimeout(searchTimer); searchTimer = setTimeout(() => runSearch(event.target.value), 130); });
  $("[data-trader-search-form]")?.addEventListener("submit", (event) => { event.preventDefault(); void searchTraders($("[data-trader-search]")?.value); });
  window.addEventListener("hashchange", () => {
    const match = location.hash.match(/^#coin\/(.+)$/);
    if (match) openCoin(decodeURIComponent(match[1]));
    else if (/^#launch\/?$/i.test(location.hash)) openFunLaunch();
    else {
      const toolMatch = location.hash.match(/^#tool\/(copy|sniper|walletLaunch)$/i);
      if (toolMatch) openFunTool(toolMatch[1].toLowerCase() === "walletlaunch" ? "walletLaunch" : toolMatch[1].toLowerCase());
    }
  });
  async function loadCreatedCoinsSilently() { if (!state.token || state.launches.length) return; const result = await request("/api/web/launches"); if (result.ok) state.launches = result.data?.coins || []; }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    state.deferredInstall = event;
    if (new URLSearchParams(location.search).get("install") === "1") showFunInstallGuide();
  });
  window.addEventListener("appinstalled", () => {
    state.deferredInstall = null;
    toast("SlimeWire Go installed");
    closeSheet();
  });

  async function init() {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/fun-sw.js", { scope: "/fun/", updateViaCache: "none" }).catch(() => {});
    await consumeTelegramLoginTicket();
    paintWalletPill();
    renderCashHandoff();
    renderHomeReadiness();
    $$('[data-chain]').forEach((button) => button.classList.toggle("active", button.dataset.chain === state.chain));
    $$('[data-feed]').forEach((button) => button.classList.toggle("active", button.dataset.feed === state.feed));
    if (!IS_QUICK_ROUTE) loadFeed();
    if (state.token) Promise.all([loadMe(), loadWallets(), loadPositions(), loadPresets(), loadCreatedCoinsSilently()]).then(() => {
      renderCashHandoff(); renderHomeReadiness(); resumePendingFunFunding();
      const firstWallet = state.wallets[0];
      if (firstWallet && !walletBackedUp(firstWallet)) {
        try {
          if (sessionStorage.getItem(WALLET_BACKUP_REMINDER_KEY) !== firstWallet.publicKey) {
            sessionStorage.setItem(WALLET_BACKUP_REMINDER_KEY, firstWallet.publicKey);
            toast("Back up Wallet 1 before using another device.");
          }
        } catch {}
      }
      if (state.view === "coin") renderQuickTrade(); if (state.view === "quick") renderQuickRoute();
    }).catch(() => {});
    const routeParams = new URLSearchParams(location.search);
    resumePendingFunFunding();
    if (IS_QUICK_ROUTE) {
      setView("quick", { hideNav: true });
      renderQuickRoute();
      const ca = routeParams.get("ca") || routeParams.get("token") || "";
      if (ca) void loadQuickTarget(ca);
    } else {
      // Telegram's Slime Chart button uses a query-string CA because Android/PWA
      // handoffs can drop #fragments. On /fun that means the full coin/chart view,
      // while /quick and quick=1 continue to open the compact buy panel above.
      const linkedCa = routeParams.get("ca") || routeParams.get("token") || "";
      const match = location.hash.match(/^#coin\/(.+)$/); if (linkedCa) openCoin(linkedCa);
      else if (match) openCoin(decodeURIComponent(match[1]));
      else if (/^#launch\/?$/i.test(location.hash)) openFunLaunch();
      else {
        const toolMatch = location.hash.match(/^#tool\/(copy|sniper|walletLaunch)$/i);
        if (toolMatch) openFunTool(toolMatch[1].toLowerCase() === "walletlaunch" ? "walletLaunch" : toolMatch[1].toLowerCase());
      }
      if (routeParams.get("tab") === "wallet") setView("wallet");
      if (routeParams.get("profile") === "1") {
        state.profileTab = "social";
        $$('[data-profile]').forEach((button) => button.classList.toggle("active", button.dataset.profile === "social"));
        setView("wallet");
      }
    }
    if (routeParams.get("install") === "1") setTimeout(showFunInstallGuide, 350);
  }
  $("[data-quick-paste-form]")?.addEventListener("submit", (event) => { event.preventDefault(); void loadQuickTarget($("[data-quick-ca]")?.value); });
  $("[data-quick-clipboard]")?.addEventListener("click", async () => { try { const text = await navigator.clipboard.readText(); if ($("[data-quick-ca]")) $("[data-quick-ca]").value = text; await loadQuickTarget(text); } catch { $("[data-quick-ca]")?.focus(); toast("Paste into the field, then tap Load.", true); } });
  init();
})();
