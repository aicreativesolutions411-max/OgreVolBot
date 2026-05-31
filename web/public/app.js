import {
  canSubmitPerpOrder,
  createPerpsProvider,
  ogreTekRouteStatus,
  resolveOgreTekConfig,
  shouldShowOgreTekNav,
  validatePerpOrder
} from "./perps.js";
import {
  smartChartSuggestion,
  tradeActionLabelFromPreset
} from "./liveTerminalUi.js";

const config = window.OGRE_PORTAL_CONFIG || {};
const ogreTekConfig = resolveOgreTekConfig(config);
const perpsProvider = createPerpsProvider(ogreTekConfig);
const configuredApiBase = String(config.apiBase || "").trim().replace(/\/+$/, "");
const sameOriginApiBase = window.location.origin.replace(/\/+$/, "");
const defaultRenderApiBase = "https://ogrevolbot.onrender.com";
const shareSiteUrl = String(config.shareUrl || config.siteUrl || "https://www.slimewire.org").trim() || "https://www.slimewire.org";
const apiCandidates = [
  configuredApiBase,
  window.location.hostname.endsWith("onrender.com") ? sameOriginApiBase : "",
  defaultRenderApiBase
].filter(Boolean);
let apiBase = apiCandidates[0] || defaultRenderApiBase;
const API_CONNECT_TIMEOUT_MS = 18_000;

function getStoredToken() {
  try {
    return window.localStorage?.getItem("ogreWebToken") || "";
  } catch {
    return "";
  }
}

function setStoredToken(token) {
  try {
    window.localStorage?.setItem("ogreWebToken", token);
  } catch {
    // Private browsing or embedded browsers may block localStorage.
  }
}

function clearStoredToken() {
  try {
    window.localStorage?.removeItem("ogreWebToken");
  } catch {
    // Private browsing or embedded browsers may block localStorage.
  }
}

function getStoredXHandle() {
  try {
    return window.localStorage?.getItem("ogreXHandle") || "";
  } catch {
    return "";
  }
}

function setStoredXHandle(handle) {
  try {
    window.localStorage?.setItem("ogreXHandle", handle);
  } catch {
    // Local share settings are optional.
  }
}

function clearStoredXHandle() {
  try {
    window.localStorage?.removeItem("ogreXHandle");
  } catch {
    // Local share settings are optional.
  }
}

function storedReferralCode() {
  try {
    const url = new URL(window.location.href);
    const fromUrl = String(url.searchParams.get("ref") || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
    if (fromUrl) {
      window.localStorage?.setItem("slimewireReferralCode", fromUrl);
      return fromUrl;
    }
    return String(window.localStorage?.getItem("slimewireReferralCode") || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
  } catch {
    return "";
  }
}

function getStoredLaunchCoinDraft() {
  try {
    return JSON.parse(window.localStorage?.getItem("slimewireLaunchCoinDraft") || "{}") || {};
  } catch {
    return {};
  }
}

function setStoredLaunchCoinDraft(draft) {
  try {
    window.localStorage?.setItem("slimewireLaunchCoinDraft", JSON.stringify(draft || {}));
  } catch {
    // Launch drafts are convenience-only and should not block the terminal.
  }
}

const state = {
  token: getStoredToken(),
  user: null,
  route: window.location.pathname.startsWith("/connect")
    ? "connect"
    : window.location.pathname.startsWith("/terminal") || window.location.pathname.startsWith("/ogre-tek")
      ? "terminal"
      : "intro",
  activeTab: window.location.pathname.includes("/ogre-tek")
    ? "ogreTek"
    : window.location.pathname.includes("/chart")
      ? "smartChart"
    : window.location.pathname.includes("/slime-scope")
      ? "slimeScope"
    : window.location.pathname.includes("/tx-audit")
    ? "txAudit"
    : window.location.pathname.includes("/trade")
      ? "trade"
      : window.location.pathname.includes("/kol")
        ? "kol"
        : "terminal",
  terminalSubtab: "positions",
  terminalSort: "best",
  terminalToken: "",
  smartChartToken: "",
  smartChartZoom: 80,
  terminalAutoToken: "",
  terminalTxSignature: "",
  terminalTxAudit: null,
  terminalTxLoading: false,
  walletRefreshing: false,
  lastWalletRefreshAt: "",
  walletRefreshError: "",
  loading: false,
  wallets: [],
  balances: [],
  positions: [],
  pnl: null,
  scan: null,
  scanMode: "safe",
  tradeToken: "",
  tradeResult: null,
  tradePlanResult: null,
  bundleToken: "",
  bundleResult: null,
  volumeToken: "",
  volumeResult: null,
  sniperResult: null,
  connectedWalletBalance: null,
  livePairs: null,
  livePairsByBucket: {},
  livePairsLoading: false,
  livePairsLoadingByBucket: {},
  livePairsLastUpdatedAt: "",
  livePairsLastUpdatedByBucket: {},
  livePairBucket: "live",
  slimeScopeMode: "new",
  launchResult: null,
  launchCoinDraft: getStoredLaunchCoinDraft(),
  launchCoinStatus: "",
  launchWatches: [],
  kolScan: null,
  kolMode: "hot",
  kolWallet: "",
  kolResult: null,
  kolStatus: "",
  kolLoading: false,
  kolLastUpdatedAt: "",
  presets: { trade: [], bundle: [] },
  watchlist: { rows: [], count: 0 },
  watchlistLoading: false,
  selectedTradePresetId: "",
  selectedBundlePresetId: "",
  quickBuyAmountOverride: "",
  terminalTradeCollapsed: true,
  ogreTek: {
    loading: false,
    error: "",
    markets: [],
    account: null,
    positions: [],
    orders: [],
    selectedMarket: "SOL-PERP",
    direction: "long",
    orderType: "market",
    collateralUsd: "100",
    leverage: "2",
    slippagePct: "0.5",
    priorityFeeLamports: "0",
    limitPrice: "",
    stopPrice: "",
    reviewOpen: false,
    riskAccepted: false,
    status: ""
  },
  fastTradePresetStatus: "",
  fastBundlePresetStatus: "",
  editingTradePresetId: "",
  editingBundlePresetId: "",
  walletRemoveStatus: "",
  restoreResult: null,
  importResult: null,
  backupResult: null,
  downloads: null,
  xHandle: getStoredXHandle(),
  loginCollapsed: true
};
let livePairsTimer = null;
let scanTimer = null;
let kolTimer = null;
let watchlistTimer = null;

const $ = (selector) => document.querySelector(selector);
const writeText = (element, value) => {
  if (element) element.textContent = value;
};
const setText = (selector, value) => {
  writeText($(selector), value);
};
const setHidden = (selector, hidden) => {
  const element = $(selector);
  if (element) element.hidden = hidden;
};
const app = $("[data-app]");
const loginView = $("[data-login]");
const connectView = $("[data-connect]");
const topLoginPanel = $("[data-top-login]");
const authActions = $("[data-auth-actions]");
const guestActions = $("[data-guest-actions]");
const sessionActions = $("[data-session-actions]");
const dashboardView = $("[data-dashboard]");
const errorBox = $("[data-error]");
const dashboardErrorBox = $("[data-dashboard-error]");

const LIVE_PAIR_BUCKETS = [
  ["live", "Live"],
  ["under1h", "Last 1h"],
  ["under3h", "Last 3h"],
  ["under1d", "Last 24h"]
];

const LIVE_PAIR_SORTS = [
  ["best", "Best Picks"],
  ["newest", "Newest"],
  ["volume", "Most Volume"],
  ["liquidity", "Most Liquidity"],
  ["buys", "Most Buys"],
  ["momentum", "Highest Momentum"],
  ["risk", "Highest Risk"]
];

function routeForPath(pathname = window.location.pathname) {
  if (pathname.startsWith("/connect")) return "connect";
  if (pathname.startsWith("/ogre-tek")) return "terminal";
  if (pathname.startsWith("/terminal")) return "terminal";
  return "intro";
}

function tabForPath(pathname = window.location.pathname) {
  if (pathname.includes("/ogre-tek")) return "ogreTek";
  if (pathname.includes("/chart")) return "smartChart";
  if (pathname.includes("/tx-audit")) return "txAudit";
  if (pathname.includes("/slime-scope")) return "slimeScope";
  if (pathname.includes("/trade")) return "trade";
  if (pathname.includes("/kol")) return "kol";
  if (pathname.includes("/live-pairs")) return "live";
  if (pathname.includes("/positions")) return "positions";
  return "terminal";
}

function navigateTo(pathname, tab = null) {
  const nextPath = pathname || "/terminal";
  state.route = routeForPath(nextPath);
  if (state.route === "terminal") state.activeTab = tab || tabForPath(nextPath);
  window.history.pushState({}, "", nextPath);
  render();
}

window.addEventListener("popstate", () => {
  state.route = routeForPath();
  state.activeTab = tabForPath();
  render();
});

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publicErrorMessage(message = "") {
  const text = String(message || "");
  if (/OGRE_API|WEB_ALLOWED|Render|Cloudflare|backend|API returned|invalid JSON|Jupiter|RPC|Helius|MadeOnSol|Solana Tracker|API key/i.test(text)) {
    return "SlimeWire could not complete that request right now. Refresh and try again, or contact support if it continues.";
  }
  return text;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = API_CONNECT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timer);
  }
}

async function wakeApi(base) {
  try {
    await fetchWithTimeout(`${base}/wake`, { cache: "no-store" }, 8_000);
  } catch {
    // Wake checks are best-effort. The main request below reports the real failure.
  }
}

async function api(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  let lastError = null;
  try {
    response = await fetchWithTimeout(apiUrl(path), { ...options, headers, cache: "no-store" });
  } catch (error) {
    lastError = error;
    await wakeApi(apiBase);
    await sleep(900);
    try {
      response = await fetchWithTimeout(apiUrl(path), { ...options, headers, cache: "no-store" });
    } catch (retryError) {
      lastError = retryError;
      for (const fallbackBase of apiCandidates) {
        if (fallbackBase === apiBase) continue;
        try {
          await wakeApi(fallbackBase);
          response = await fetchWithTimeout(`${fallbackBase}${path}`, { ...options, headers, cache: "no-store" });
          apiBase = fallbackBase;
          break;
        } catch (fallbackError) {
          lastError = fallbackError;
        }
      }
      if (!response) {
        const detail = lastError?.name === "AbortError" ? "The request timed out." : "The browser blocked or could not open the request.";
        throw new Error(`${detail} SlimeWire could not connect right now. Try again in a moment.`);
      }
    }
  }
  const data = await readApiJson(response);

  if (!response.ok || data.ok === false) {
    const message = publicErrorMessage(data.message || data.error || `HTTP ${response.status}`);
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    if (response.status === 401) {
      resetWebSession(message);
    }
    throw error;
  }

  return data;
}

async function readApiJson(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    return {
      ok: false,
      error: "invalid_api_response",
      message: contentType.includes("text/html")
        ? "SlimeWire received an unexpected page response. Refresh and try again."
        : "SlimeWire received an unexpected response. Refresh and try again."
    };
  }
}

function policyText(kind) {
  if (kind === "privacy") {
    return [
      "Slime Policy",
      "",
      "SlimeWire only asks for information needed to operate your account, connect wallets you choose, remember saved preferences, and show your trading dashboard.",
      "",
      "Never share seed phrases or private keys with anyone. If you use managed wallets, download and protect your backup files. Wallet actions are your responsibility, and you should review every trade before confirming.",
      "",
      "We do not ask for your X password, Telegram password, wallet seed phrase, or wallet recovery phrase. Public wallet addresses and public on-chain activity may be visible on the blockchain.",
      "",
      "Use SlimeWire only where lawful, keep your own tax and trading records, and contact support if you need account help."
    ].join("\n");
  }
  return [
    "Slimeness",
    "",
    "By using SlimeWire, you agree to use the tools responsibly, follow applicable laws, and understand that crypto trading is risky.",
    "",
    "Trades can fail, move quickly, or receive less than expected because of liquidity, slippage, network conditions, and market volatility. No result or profit is guaranteed.",
    "",
    "You are responsible for checking wallet addresses, token mints, trade settings, fees, backups, and any tax or reporting obligations that apply to you.",
    "",
    "Do not use SlimeWire for unlawful activity, harassment, fraud, or unauthorized access to anyone else's wallet or account."
  ].join("\n");
}

function applyUserFromApi(user) {
  if (!user) return;
  state.user = user;
  if (Object.prototype.hasOwnProperty.call(user, "xHandle")) {
    state.xHandle = cleanXHandle(user.xHandle);
    if (state.xHandle) setStoredXHandle(state.xHandle);
    else clearStoredXHandle();
  } else if (!state.xHandle) {
    state.xHandle = getStoredXHandle();
  }
}

function firstFormValue(selectors) {
  for (const selector of selectors) {
    const element = $(selector);
    if (element && !element.closest("[hidden]")) return String(element.value || "");
  }
  for (const selector of selectors) {
    const element = $(selector);
    if (element) return String(element.value || "");
  }
  return "";
}

function loginStatusElement() {
  const visibleConnectStatus = $("[data-connect-status]");
  if (visibleConnectStatus && !visibleConnectStatus.closest("[hidden]")) return visibleConnectStatus;
  return $("[data-login-status]") || visibleConnectStatus;
}

function visibleElement(selector) {
  const candidates = [...document.querySelectorAll(selector)];
  return candidates.find((element) => !element.closest("[hidden]") && element.offsetParent !== null)
    || candidates.find((element) => !element.closest("[hidden]"))
    || candidates[0]
    || null;
}

function walletConnectStatusElement() {
  return visibleElement("[data-wallet-connect-status]");
}

function loginCredentialsFromForm({ requirePassword = false } = {}) {
  const username = firstFormValue(["[data-connect-login-username]", "[data-login-username]"]).trim();
  const password = firstFormValue(["[data-connect-login-password]", "[data-login-password]"]);
  if (!username && !password && !requirePassword) return {};
  if (!username) throw new Error("Enter your username.");
  if (!password) throw new Error("Enter your password.");
  return { username, password };
}

function resetWebSession(message = "") {
  state.token = "";
  state.user = null;
  state.loading = false;
  clearStoredToken();
  render();
  setError(message || "Your web session expired. Log in, or tap Create Account to start a fresh session.");
}

async function ensureWebAccount(statusElement = null, message = "Creating secure web profile...") {
  if (state.user && state.token) return state.user;
  writeText(statusElement, message);
  const data = await api("/api/web/signup", {
    method: "POST",
    body: JSON.stringify({ referralCode: storedReferralCode() })
  });
  state.token = data.token;
  applyUserFromApi(data.user);
  setStoredToken(state.token);
  return state.user;
}

function setError(message = "") {
  [errorBox, dashboardErrorBox].forEach((box) => {
    if (!box) return;
    box.hidden = !message;
    writeText(box, message);
  });
}

function dexUrl(tokenMint) {
  const mint = String(tokenMint || "").trim();
  return mint ? `https://dexscreener.com/solana/${encodeURIComponent(mint)}` : "#";
}

function kolscanUrl(wallet) {
  const address = String(wallet || "").trim();
  return address ? `https://kolscan.io/account/${encodeURIComponent(address)}` : "https://kolscan.io";
}

async function createWebAccount() {
  setError("");
  const status = loginStatusElement();
  try {
    const credentials = loginCredentialsFromForm();
    writeText(status, credentials.username ? "Creating saved login..." : "Creating account...");
    const data = await api("/api/web/signup", {
      method: "POST",
      body: JSON.stringify({ ...credentials, referralCode: storedReferralCode() })
    });
    state.token = data.token;
    applyUserFromApi(data.user);
    setStoredToken(state.token);
    state.loginCollapsed = true;
    state.activeTab = "dashboard";
    writeText(status, credentials.username ? "Account created. Login saved." : "Account created.");
    await refreshAfterTrade(data.trade?.signature);
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function passwordLogin() {
  setError("");
  const status = loginStatusElement();
  try {
    const credentials = loginCredentialsFromForm({ requirePassword: true });
    writeText(status, "Logging in...");
    const data = await api("/api/web/password-login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    state.token = data.token;
    applyUserFromApi(data.user);
    setStoredToken(state.token);
    state.loginCollapsed = true;
    state.activeTab = "dashboard";
    writeText(status, "Logged in.");
    await refreshAfterTrade(data.trade?.signature);
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function createAccountAndConnectWallet() {
  setError("");
  const status = loginStatusElement();
  try {
    if (!state.user) {
      const credentials = loginCredentialsFromForm();
      writeText(status, credentials.username ? "Creating saved login..." : "Creating account...");
      const data = await api("/api/web/signup", {
        method: "POST",
        body: JSON.stringify({ ...credentials, referralCode: storedReferralCode() })
      });
      state.token = data.token;
      applyUserFromApi(data.user);
      setStoredToken(state.token);
      state.loginCollapsed = true;
      await loadAll();
    }
    state.activeTab = "profile";
    render();
    await connectBrowserWallet("solana");
    if (state.user) {
      state.route = "terminal";
      window.history.pushState({}, "", "/terminal");
      render();
    }
  } catch (error) {
    setError(error.message);
  }
}

async function createAccountAndOpenWallets() {
  await createWebAccount();
  if (!state.user) return;
  state.route = "terminal";
  state.activeTab = "wallets";
  window.history.pushState({}, "", "/terminal");
  render();
}

async function logout() {
  if (!state.user) {
    state.loginCollapsed = false;
    render();
    loginView?.scrollIntoView?.({ behavior: "smooth", block: "start" });
    return;
  }
  try {
    await api("/api/web/logout", { method: "POST" });
  } catch {
    // Local logout should still work if the backend is offline.
  }
  state.token = "";
  state.user = null;
  clearStoredToken();
  render();
}

async function loadSession() {
  if (!state.token) {
    render();
    return;
  }

  try {
    const data = await api("/api/web/me");
    applyUserFromApi(data.user);
    await refreshAfterTrade(firstResultSignature(data.plan));
  } catch {
    state.token = "";
    clearStoredToken();
    render();
  }
}

async function loadAll(options = {}) {
  if (!state.user || !state.token) {
    state.wallets = [];
    state.balances = [];
    state.positions = [];
    state.pnl = null;
    state.connectedWalletBalance = null;
    state.launchWatches = [];
    state.presets = { trade: [], bundle: [] };
    state.watchlist = { rows: [], count: 0 };
    render();
    return;
  }

  const showLoading = !options.silent;
  if (showLoading) {
    state.loading = true;
    render();
  }

  try {
    const forceQuery = options.force ? "?force=true" : "";
    if (options.skipCore) {
      const [pnl, launchWatches, presets, watchlist] = await Promise.all([
        api("/api/web/pnl"),
        api("/api/web/launch/watches"),
        api("/api/web/presets"),
        api("/api/web/watchlist")
      ]);
      state.pnl = pnl.pnl || null;
      state.launchWatches = launchWatches.watches || [];
      state.presets = presets.presets || { trade: [], bundle: [] };
      ensureSelectedPresetsStillExist();
      state.watchlist = watchlist.watchlist || { rows: [], count: 0 };
      return;
    }
    const [wallets, balances, positions, pnl, launchWatches, presets, watchlist] = await Promise.all([
      api("/api/web/wallets"),
      api(`/api/web/balances${forceQuery}`),
      api(`/api/web/positions${forceQuery}`),
      api("/api/web/pnl"),
      api("/api/web/launch/watches"),
      api("/api/web/presets"),
      api("/api/web/watchlist")
    ]);
    state.wallets = wallets.wallets || [];
    state.balances = balances.balances || [];
    state.connectedWalletBalance = balances.connectedWallet || null;
    state.positions = positions.positions || [];
    state.pnl = pnl.pnl || null;
    state.launchWatches = launchWatches.watches || [];
    state.presets = presets.presets || { trade: [], bundle: [] };
    ensureSelectedPresetsStillExist();
    state.watchlist = watchlist.watchlist || { rows: [], count: 0 };
    if (options.force) {
      state.lastWalletRefreshAt = new Date().toISOString();
      state.walletRefreshError = "";
    }
  } finally {
    if (showLoading) {
      state.loading = false;
    }
    render();
  }
}

async function loadWalletCore(options = {}) {
  if (!state.user || !state.token) return;
  const forceQuery = options.force ? "?force=true" : "";
  const [wallets, balances, positions] = await Promise.all([
    api("/api/web/wallets"),
    api(`/api/web/balances${forceQuery}`),
    api(`/api/web/positions${forceQuery}`)
  ]);
  state.wallets = wallets.wallets || [];
  state.balances = balances.balances || [];
  state.connectedWalletBalance = balances.connectedWallet || null;
  state.positions = positions.positions || [];
  state.lastWalletRefreshAt = new Date().toISOString();
  state.walletRefreshError = "";
}

function normalizeLivePairBucket(bucket) {
  const value = String(bucket || "live");
  return LIVE_PAIR_BUCKETS.some(([id]) => id === value) ? value : "live";
}

function currentLivePairs() {
  return state.livePairsByBucket[state.livePairBucket] || state.livePairs || null;
}

function currentLivePairsUpdatedAt() {
  return state.livePairsLastUpdatedByBucket[state.livePairBucket] || state.livePairsLastUpdatedAt || "";
}

async function loadLivePairs({ silent = false, bucket = state.livePairBucket, renderOnComplete = true, force = false } = {}) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const isActiveBucket = safeBucket === state.livePairBucket;
  state.livePairsLoadingByBucket = { ...state.livePairsLoadingByBucket, [safeBucket]: true };
  state.livePairsLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
  if (!silent && isActiveBucket) state.loading = true;
  if (isActiveBucket || !silent) render();

  try {
    const forceQuery = force ? "&force=true" : "";
    const data = await api(`/api/web/live-pairs?bucket=${encodeURIComponent(safeBucket)}&sort=${encodeURIComponent(state.terminalSort || "best")}${forceQuery}`);
    const value = data.livePairs;
    const updatedAt = value?.refreshedAt || new Date().toISOString();
    state.livePairsByBucket = { ...state.livePairsByBucket, [safeBucket]: value };
    state.livePairsLastUpdatedByBucket = { ...state.livePairsLastUpdatedByBucket, [safeBucket]: updatedAt };
    if (isActiveBucket) {
      state.livePairs = value;
      state.livePairsLastUpdatedAt = updatedAt;
    }
  } finally {
    const nextLoading = { ...state.livePairsLoadingByBucket };
    delete nextLoading[safeBucket];
    state.livePairsLoadingByBucket = nextLoading;
    state.livePairsLoading = Boolean(nextLoading[state.livePairBucket]);
    if (!silent && isActiveBucket) state.loading = false;
    if (renderOnComplete) render();
  }
}

async function refreshLivePairBuckets({ silent = false, force = false } = {}) {
  await loadLivePairs({ silent, bucket: state.livePairBucket, force });
  const otherBuckets = LIVE_PAIR_BUCKETS
    .map(([bucket]) => bucket)
    .filter((bucket) => bucket !== state.livePairBucket);
  await Promise.allSettled(otherBuckets.map((bucket) => (
    loadLivePairs({ silent: true, bucket, renderOnComplete: false, force })
  )));
  if (state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "slimeScope") render();
}

function scheduleLivePairsAutoRefresh() {
  if (livePairsTimer) {
    clearTimeout(livePairsTimer);
    livePairsTimer = null;
  }

  if (state.activeTab !== "live" && state.activeTab !== "terminal" && state.activeTab !== "slimeScope") return;
  const refreshSeconds = Number(currentLivePairs()?.refreshSeconds || 30);
  const delayMs = Math.max(3, refreshSeconds) * 1000;
  livePairsTimer = setTimeout(async () => {
    const onLiveFeed = state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "slimeScope";
    if (!onLiveFeed) return;
    if (state.livePairsLoading) {
      scheduleLivePairsAutoRefresh();
      return;
    }
    try {
      await refreshLivePairBuckets({ silent: true });
    } catch (error) {
      setError(error.message);
    } finally {
      scheduleLivePairsAutoRefresh();
    }
  }, delayMs);
}

function scheduleScannerAutoRefresh() {
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
  if (state.activeTab !== "sniper") return;
  scanTimer = setTimeout(async () => {
    if (state.activeTab !== "sniper") return;
    if (state.loading) {
      scheduleScannerAutoRefresh();
      return;
    }
    try {
      await loadScan(state.scanMode, { silent: true });
    } catch (error) {
      setError(error.message);
    } finally {
      scheduleScannerAutoRefresh();
    }
  }, 20_000);
}

function scheduleKolAutoRefresh() {
  if (kolTimer) {
    clearTimeout(kolTimer);
    kolTimer = null;
  }
  if ((state.activeTab !== "kol" && state.activeTab !== "terminal") || state.kolWallet) return;
  kolTimer = setTimeout(async () => {
    if ((state.activeTab !== "kol" && state.activeTab !== "terminal") || state.kolWallet) return;
    if (state.kolLoading) {
      scheduleKolAutoRefresh();
      return;
    }
    try {
      await loadKolScan(state.kolMode, "", { silent: true });
    } catch (error) {
      setError(error.message);
    } finally {
      scheduleKolAutoRefresh();
    }
  }, 60_000);
}

function scheduleWatchlistAutoRefresh() {
  if (watchlistTimer) {
    clearTimeout(watchlistTimer);
    watchlistTimer = null;
  }
  if ((state.activeTab !== "watchlist" && state.activeTab !== "terminal") || !state.user || !state.token) return;
  watchlistTimer = setTimeout(async () => {
    if (state.activeTab !== "watchlist" && state.activeTab !== "terminal") return;
    try {
      await loadWatchlist({ silent: true });
    } catch (error) {
      setError(error.message);
    } finally {
      scheduleWatchlistAutoRefresh();
    }
  }, 30_000);
}

async function loadScan(mode = state.scanMode, options = {}) {
  const silent = Boolean(options.silent);
  state.scanMode = mode;
  if (!silent) {
    state.loading = true;
    render();
  }

  try {
    const data = await api(`/api/web/sniper/scan?mode=${encodeURIComponent(mode)}`);
    state.scan = data.scan;
  } finally {
    if (!silent) state.loading = false;
    render();
  }
}

async function loadKolScan(mode = state.kolMode, wallet = state.kolWallet, options = {}) {
  const silent = Boolean(options.silent);
  state.kolMode = mode;
  state.kolWallet = String(wallet || "").trim();
  if (!silent) state.loading = true;
  state.kolLoading = true;
  state.kolStatus = state.kolWallet
    ? "Scanning custom KOL wallet..."
    : `Loading ${kolModeLabel(state.kolMode)}...`;
  setError("");
  if (!silent) render();

  try {
    const params = new URLSearchParams({ mode });
    if (state.kolWallet) params.set("wallet", state.kolWallet);
    const data = await api(`/api/web/kol/scan?${params.toString()}`);
    state.kolScan = data.scan;
    state.kolLastUpdatedAt = new Date().toISOString();
    state.kolStatus = data.scan?.message || `${kolModeLabel(state.kolMode)} loaded.`;
  } catch (error) {
    state.kolStatus = error.message || "KOL scan failed.";
    throw error;
  } finally {
    if (!silent) state.loading = false;
    state.kolLoading = false;
    render();
  }
}

async function loadWatchlist(options = {}) {
  if (!state.user || !state.token) return;
  const silent = Boolean(options.silent);
  state.watchlistLoading = true;
  if (!silent) render();
  try {
    const data = await api("/api/web/watchlist");
    state.watchlist = data.watchlist || { rows: [], count: 0 };
  } finally {
    state.watchlistLoading = false;
    render();
  }
}

function totalSol() {
  return state.balances.reduce((sum, row) => sum + Number(row.sol || 0), 0);
}

function secondsSince(isoText) {
  const time = Date.parse(isoText || "");
  if (!Number.isFinite(time)) return null;
  return Math.max(0, Math.floor((Date.now() - time) / 1000));
}

function ageTextFromSeconds(seconds) {
  if (!Number.isFinite(seconds)) return "never";
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function syncHealthLabel() {
  if (state.walletRefreshing) return "Refreshing...";
  if (state.walletRefreshError) return `Sync error: ${state.walletRefreshError}`;
  const seconds = secondsSince(state.lastWalletRefreshAt);
  if (seconds === null) return "Sync not run";
  if (seconds > 45) return `Stale: ${ageTextFromSeconds(seconds)}`;
  return `Synced ${ageTextFromSeconds(seconds)}`;
}

function activePresetSummary() {
  const trade = presetById("trade", state.selectedTradePresetId);
  const bundle = presetById("bundle", state.selectedBundlePresetId);
  const tradeLabel = trade ? `${trade.name} ${trade.amountSol || ""} SOL` : "No trade preset";
  const bundleLabel = bundle ? bundle.name : "No bundle preset";
  return `Preset: ${tradeLabel} | ${bundleLabel}`;
}

async function refreshWalletState({ force = true } = {}) {
  if (!state.user || !state.token) {
    setError("Create or log in before refreshing wallet balances.");
    return;
  }
  if (state.walletRefreshing) return;
  state.walletRefreshing = true;
  state.walletRefreshError = "";
  render();
  try {
    await loadWalletCore({ force });
    state.lastWalletRefreshAt = new Date().toISOString();
    render();
    await loadAll({ force, skipCore: true, silent: true });
  } catch (error) {
    state.walletRefreshError = error.message || "Refresh failed.";
    setError(state.walletRefreshError);
  } finally {
    state.walletRefreshing = false;
    render();
  }
}

async function refreshAfterTrade(signature = "") {
  if (signature) state.lastTradeSignature = signature;
  await refreshWalletState({ force: true });
}

function shouldDeferTerminalRender() {
  const active = document.activeElement;
  if (!active || state.route !== "terminal") return false;
  const tag = String(active.tagName || "").toLowerCase();
  const editable = active.isContentEditable || ["input", "textarea", "select"].includes(tag);
  if (!editable) return false;
  return Boolean(active.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid"));
}

function requestDeferredRender() {
  state.pendingRender = true;
}

function flushDeferredRender() {
  if (!state.pendingRender || shouldDeferTerminalRender()) return;
  state.pendingRender = false;
  render({ force: true });
}

function render(options = {}) {
  if (!app || !loginView || !dashboardView) return;
  if (!options.force && shouldDeferTerminalRender()) {
    requestDeferredRender();
    return;
  }
  state.pendingRender = false;
  app.dataset.loading = state.loading ? "true" : "false";
  app.dataset.route = state.route;
  loginView.hidden = state.route !== "intro";
  if (connectView) connectView.hidden = state.route !== "connect";
  if (topLoginPanel) topLoginPanel.hidden = Boolean(state.user) || state.loginCollapsed;
  setHidden("[data-connect-login-panel]", Boolean(state.user) || state.loginCollapsed);
  if (authActions) authActions.hidden = false;
  if (guestActions) guestActions.hidden = Boolean(state.user);
  if (sessionActions) sessionActions.hidden = !state.user;
  dashboardView.hidden = state.route !== "terminal";
  setHidden("[data-terminal-global-search]", state.route !== "terminal");
  setHidden("[data-top-sync-strip]", state.route !== "terminal");

  setText("[data-user-id]", state.user?.id || "guest");
  setText("[data-wallet-count]", state.wallets.length);
  setText("[data-total-sol]", totalSol().toFixed(4));
  setText("[data-position-count]", state.positions.length);
  setText("[data-realized]", state.pnl?.totals?.realizedSol || "+0 SOL");
  setText("[data-top-sol]", `${totalSol().toFixed(4)} SOL`);
  setText("[data-top-portfolio]", `${state.positions.length} position${state.positions.length === 1 ? "" : "s"}`);
  setText("[data-sync-health]", syncHealthLabel());
  setText("[data-active-preset-label]", activePresetSummary());
  setHidden("[data-refresh-spinner]", !state.walletRefreshing);
  document.querySelectorAll('[data-feature="ogre-tek"]').forEach((element) => {
    element.hidden = !shouldShowOgreTekNav(ogreTekConfig);
  });
  const avatar = $("[data-user-avatar]");
  if (avatar) avatar.innerHTML = userAvatarHtml("SW");
  const topAvatar = $("[data-top-avatar]");
  if (topAvatar) topAvatar.innerHTML = userAvatarHtml("SW");
  const connectedWallet = state.user?.connectedWallet || null;
  setText("[data-connected-wallet-summary]", connectedWallet
    ? `${connectedWallet.provider || "Browser wallet"} connected: ${shortAddress(connectedWallet.publicKey)}`
    : state.user
      ? "No browser wallet connected."
      : "Browse scans now. Create or connect only when you are ready.");
  const logoutButton = $("[data-logout]");
  if (logoutButton) {
    logoutButton.hidden = !state.user;
    writeText(logoutButton, "Log Out");
  }
  if (state.route === "terminal") renderTabs();
}

function renderTabs() {
  const panel = $("[data-panel]");
  if (!panel) return;
  const terminalDockScrollTop = state.activeTab === "terminal"
    ? (panel.querySelector(".terminal-dock")?.scrollTop || 0)
    : 0;
  const terminalWindowScrollTop = state.activeTab === "terminal" ? window.scrollY : 0;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    if (!button.closest(".tabs")) button.removeAttribute("data-active");
  });
  document.querySelectorAll(".tabs [data-tab]").forEach((button) => {
    button.dataset.active = button.dataset.tab === state.activeTab ? "true" : "false";
  });

  if (state.activeTab === "terminal") panel.innerHTML = terminalHtml();
  if (state.activeTab === "dashboard") panel.innerHTML = dashboardHtml();
  if (state.activeTab === "profile") panel.innerHTML = profileHtml();
  if (state.activeTab === "trade") panel.innerHTML = tradeHtml();
  if (state.activeTab === "bundle") panel.innerHTML = bundleHtml();
  if (state.activeTab === "volume") panel.innerHTML = volumeHtml();
  if (state.activeTab === "live") panel.innerHTML = livePairsHtml();
  if (state.activeTab === "liveTrades") panel.innerHTML = liveTradesHtml();
  if (state.activeTab === "slimeScope") panel.innerHTML = slimeScopeHtml();
  if (state.activeTab === "watchlist") panel.innerHTML = watchlistHtml();
  if (state.activeTab === "smartChart") panel.innerHTML = smartChartHtml();
  if (state.activeTab === "launchCoin") panel.innerHTML = launchCoinHtml();
  if (state.activeTab === "launch") panel.innerHTML = launchHtml();
  if (state.activeTab === "kol") panel.innerHTML = kolHtml();
  if (state.activeTab === "wallets") panel.innerHTML = walletsHtml();
  if (state.activeTab === "positions") panel.innerHTML = positionsHtml();
  if (state.activeTab === "pnl") panel.innerHTML = pnlHtml();
  if (state.activeTab === "txAudit") panel.innerHTML = txAuditHtml();
  if (state.activeTab === "sniper") panel.innerHTML = sniperHtml();
  if (state.activeTab === "ogreTek") {
    panel.innerHTML = ogreTekHtml();
    ensureOgreTekData();
  }
  syncCustomFields(panel);
  if (state.activeTab === "terminal") {
    const dock = panel.querySelector(".terminal-dock");
    if (dock) dock.scrollTop = terminalDockScrollTop;
    requestAnimationFrame(() => {
      const delta = Math.abs(window.scrollY - terminalWindowScrollTop);
      if (delta > 8) window.scrollTo(0, terminalWindowScrollTop);
      const nextDock = panel.querySelector(".terminal-dock");
      if (nextDock) nextDock.scrollTop = terminalDockScrollTop;
    });
  }
  scheduleLivePairsAutoRefresh();
  scheduleScannerAutoRefresh();
  scheduleKolAutoRefresh();
  scheduleWatchlistAutoRefresh();
}

function dashboardHtml() {
  return `
    ${accountToolsHtml()}
    ${createWalletSection()}
    <section class="panel-grid">
      ${visualCard("visual-trade", "Trade Desk", "Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.", "trade")}
      ${visualCard("visual-bundle", "Bundle + Volume", "Buy or sell across selected wallets, then manage timed exits with Volume plans.", "bundle")}
      ${visualCard("visual-launch", "Launch Snipe", "Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.", "launch")}
      ${visualCard("visual-kol", "KOL Tracker", "Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.", "kol")}
      ${visualCard("visual-live", "Live Pairs", "Auto-refresh new Pump and fresh-pair listings while the tab is open, with safety-filtered Trade, Bundle, and Share actions.", "live-pairs")}
    </section>
    ${importWalletSection()}
    ${backupRestoreSection()}
    ${downloadsHtml()}
  `;
}

function profileHtml() {
  return `
    <section class="profile-row-shell">
      ${profileIntroHtml()}
      <section class="profile-row-list">
      ${accountProfileSection()}
      ${loginSecuritySection()}
      ${profilePfpSection()}
      ${xConnectSection()}
      </section>
      <details class="profile-extra-details">
        <summary>Badges, referrals, and top trader board</summary>
        <div class="profile-extra-grid">
          ${badgeShowcaseSection()}
          ${referralSection()}
          ${traderBoardSection()}
        </div>
      </details>
    </section>
  `;
}

function profileIntroHtml() {
  return `
    <section class="profile-intro">
      <div>
        <h3>Profile</h3>
        <p>Save your public wallet connection, upload a panel PFP, and connect X for sharing and PFP import.</p>
      </div>
    </section>
  `;
}

function accountProfileSection() {
  const connected = state.user?.connectedWallet;
  return `
    <section class="profile-card account-profile-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${userAvatarHtml("SW")}</div>
        <div>
          <h3>SlimeWire Account</h3>
          <p>${connected ? `Public wallet connected: ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}` : "Save your profile, PFP, X handle, and public wallet identity here."}</p>
        </div>
      </div>
      ${connected ? `<button type="button" data-copy="${escapeHtml(connected.publicKey)}">Copy Connected</button>` : `<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>`}
      <button type="button" data-tab="wallets">Portfolio / Wallets</button>
    </section>
  `;
}

function loginSecuritySection() {
  const username = state.user?.username || "";
  return `
    <section class="profile-card login-security-card">
      <div>
        <h3>Saved Login</h3>
        <p>${username ? `Username saved: ${escapeHtml(username)}. Update the password here any time.` : "Add a username and password so this profile follows you across browsers and devices."}</p>
      </div>
      <label>
        Username
        <input data-profile-username type="text" autocomplete="username" placeholder="slimewire" value="${escapeHtml(username)}">
      </label>
      <label>
        Password
        <input data-profile-password type="password" autocomplete="new-password" placeholder="${state.user?.hasPasswordLogin ? "New password" : "8+ characters"}">
      </label>
      <button type="button" class="primary" data-save-login-credentials>${username ? "Update Login" : "Save Login"}</button>
      <small data-login-security-status>${state.user?.hasPasswordLogin ? "Password login is active for this profile." : "Password is stored as a salted hash. Private keys are not shown or emailed."}</small>
    </section>
  `;
}

function accountToolsHtml() {
  return `
    <section class="account-check-card">
      <div>
        <h3>Wallet Checks</h3>
        <p>Open balances, current token positions, or refresh everything before trading.</p>
      </div>
      <button class="primary" data-tab="wallets">Wallet Balances</button>
      <button data-tab="positions">Open Positions</button>
      <button data-refresh-all>Refresh All</button>
    </section>
  `;
}

function visualCard(className, title, body, icon = "trade") {
  return `
    <article class="panel visual-card ${className}">
      <img class="feature-icon" src="./assets/slimewire/svg/icons/${escapeHtml(icon)}.svg" alt="" aria-hidden="true">
      <div>
        <h3>${escapeHtml(title)}</h3>
        <p>${escapeHtml(body)}</p>
      </div>
    </article>
  `;
}

function profilePfpSection() {
  const hasAvatar = Boolean(state.user?.avatar);
  const xHandle = state.xHandle ? `@${state.xHandle}` : "";
  return `
    <section class="create-wallet-card pfp-card">
      <div class="pfp-row">
        <div class="user-avatar" aria-hidden="true">${userAvatarHtml("SW")}</div>
        <div>
          <h3>Profile PFP</h3>
          <p>Used on the web panel and wallet rows. Uploads are compressed in your browser first, so trading speed is not affected.</p>
        </div>
      </div>
      <label>
        Upload Image
        <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
      </label>
      ${pfpPresetPickerHtml()}
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${state.xHandle ? "" : "disabled"}>${xHandle ? `Use ${escapeHtml(xHandle)} PFP` : "Use X PFP"}</button>
        ${hasAvatar ? `<button type="button" data-clear-avatar>Remove</button>` : ""}
      </div>
      <small data-avatar-status>${hasAvatar ? `PFP saved${state.user.avatarSource ? ` from ${escapeHtml(state.user.avatarSource)}` : ""}.` : "Optional. You can also connect X below and use that public profile image."}</small>
    </section>
  `;
}

function pfpPresetPickerHtml() {
  const presets = [
    ["./assets/slimewire/png/slimewire-mark.png", "SlimeWire"],
    ["./assets/slimewire/png/token-mascots/token-mascot-1.png", "Ogre"],
    ["./assets/slimewire/png/token-mascots/token-mascot-2.png", "Swamp"],
    ["./assets/slimewire/png/token-mascots/token-mascot-3.png", "Moss"],
    ["./assets/slimewire/png/token-mascots/token-mascot-4.png", "Slime"]
  ];
  return `
    <div class="pfp-preset-grid" aria-label="Preset PFP options">
      ${presets.map(([url, label]) => `
        <button type="button" data-preset-avatar="${escapeHtml(url)}" data-avatar-label="${escapeHtml(label)}" aria-label="Use ${escapeHtml(label)} PFP">
          <img src="${escapeHtml(url)}" alt="">
        </button>
      `).join("")}
    </div>
  `;
}

function badgeShowcaseSection() {
  const tradeCount = Number(state.pnl?.totals?.tradeCount || 0);
  const hasWallet = state.wallets.length > 0 || Boolean(state.user?.connectedWallet);
  const badges = [
    ["System Synced", "Earned when your wallet state is fresh.", state.lastUpdatedAt && !state.walletRefreshError, "health"],
    ["Active Preset", "Earned after saving or selecting a fast trade preset.", Boolean(presetById("trade", state.selectedTradePresetId)), "snipe"],
    ["Best Picks Scout", "Earned after opening Live Terminal or Sniper scans.", Boolean(state.livePairRows?.length || state.scan), "best-picks"],
    ["Wallet Ready", "Earned after creating, importing, or connecting a wallet.", hasWallet, "wallet"],
    ["Trader", "Earned after SlimeWire records completed trades.", tradeCount > 0, "trade"],
    ["Live Watcher", "Earned after adding coins to your watchlist.", Boolean(state.watchlist?.length), "watchlist"]
  ];
  return `
    <section class="create-wallet-card badge-showcase-card">
      <div>
        <h3>SlimeWire Badges</h3>
        <p>Badges unlock from actions you take on the panel. They are visual status marks only and do not expose wallets, sources, or private data.</p>
      </div>
      <div class="badge-grid">
        ${badges.map(([label, detail, earned, icon]) => `
          <article class="earned-badge ${earned ? "is-earned" : ""}">
            <img src="./assets/slimewire/svg/icons/${escapeHtml(icon)}.svg" alt="" aria-hidden="true">
            <strong>${escapeHtml(label)}</strong>
            <small>${earned ? "Earned" : "Locked"} - ${escapeHtml(detail)}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function createWalletSection() {
  const connected = state.user?.connectedWallet;
  const hasAvatar = Boolean(state.user?.avatar);
  const xHandle = state.xHandle ? `@${state.xHandle}` : "";
  return `
    <section class="create-wallet-card setup-hub-card">
      <article class="setup-hub-panel">
        <h3>Create Wallet Set</h3>
        <p>Create fresh managed wallets. Backup files download immediately after creation.</p>
        <label>
          Label
          <input data-wallet-label type="text" placeholder="Ogre Web">
        </label>
        <label>
          Count
          <input data-wallet-count-input type="number" min="1" max="20" value="1">
        </label>
        <button class="primary" type="button" data-create-wallets>Create Wallets</button>
        <small data-create-wallet-status></small>
      </article>

      <article class="setup-hub-panel">
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or a detected Solana wallet. Public address only.</p>
        <div class="wallet-provider-buttons">
          ${browserWalletChoices().map((wallet) => `
            <button type="button" data-connect-wallet="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} extension not detected"`}>
              ${escapeHtml(connected ? `Switch ${wallet.label}` : wallet.label)}
            </button>
          `).join("")}
        </div>
        <div class="connected-wallet-box">
          ${connected ? `
            <span>${escapeHtml(connected.provider || "Solana Wallet")}</span>
            <code>${escapeHtml(connected.publicKey)}</code>
            <div class="card-actions compact">
              <button type="button" data-copy="${escapeHtml(connected.publicKey)}">Copy</button>
              <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
              <button type="button" data-connect-wallet="solana">Reconnect</button>
              <button type="button" data-disconnect-wallet>Remove</button>
            </div>
          ` : `<small>No wallet connected yet.</small>`}
        </div>
        <small data-wallet-connect-status>${connected ? `Connected ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}.` : "Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      <article class="setup-hub-panel">
        <div class="pfp-row compact">
          <div class="user-avatar mini" aria-hidden="true">${userAvatarHtml("SW")}</div>
          <div>
            <h3>Profile PFP</h3>
            <p>Upload your panel PFP or pull your public X picture.</p>
          </div>
        </div>
        <label>
          Upload Image
          <input data-avatar-file type="file" accept="image/png,image/jpeg,image/webp">
        </label>
        <div class="profile-actions">
          <button type="button" data-use-x-avatar ${state.xHandle ? "" : "disabled"}>${xHandle ? `Use ${escapeHtml(xHandle)} PFP` : "Use X PFP"}</button>
          ${hasAvatar ? `<button type="button" data-clear-avatar>Remove</button>` : ""}
        </div>
        <small data-avatar-status>${hasAvatar ? `PFP saved${state.user.avatarSource ? ` from ${escapeHtml(state.user.avatarSource)}` : ""}.` : "Optional. Connect X first if you want to use your X PFP."}</small>
      </article>

      <article class="setup-hub-panel">
        <h3>X Profile</h3>
        <p>Save, change, or unlink the handle used for share buttons, watch posts, and PFP import.</p>
        <label>
          X Handle
          <input data-x-handle type="text" placeholder="@yourhandle" value="${escapeHtml(state.xHandle ? `@${state.xHandle}` : "")}">
        </label>
        <div class="profile-actions">
          <button type="button" data-connect-x>${state.xHandle ? "Save Different X" : "Save X Handle"}</button>
          <button type="button" data-open-x-login>${state.xHandle ? "Open X Profile" : "Open X Login"}</button>
          ${state.xHandle ? `<button type="button" class="danger-lite" data-clear-x>Unlink X</button>` : ""}
        </div>
        <small data-x-status>${state.xHandle ? `Saved as @${escapeHtml(state.xHandle)}. Type another handle and save to change it.` : "Enter a handle, then Save X Handle. No X password is stored."}</small>
      </article>
    </section>
  `;
}

function connectWalletSection() {
  const connected = state.user?.connectedWallet;
  return `
    <section class="create-wallet-card wallet-connect-card">
      <div>
        <h3>Connect Wallet</h3>
        <p>Connect, reconnect, or switch Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${browserWalletChoices().map((wallet) => `
          <button type="button" data-connect-wallet="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} extension not detected"`}>
            ${escapeHtml(connected ? `Switch to ${wallet.label}` : wallet.label)}
          </button>
        `).join("")}
      </div>
      <div class="connected-wallet-box">
        ${connected ? `
          <span>${escapeHtml(connected.provider || "Solana Wallet")}</span>
          <code>${escapeHtml(connected.publicKey)}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${escapeHtml(connected.publicKey)}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-connect-wallet="solana">Reconnect</button>
            <button type="button" data-disconnect-wallet>Remove</button>
          </div>
        ` : `
          <span>No browser wallet connected yet.</span>
          <small>Use this for identity, quick copying, and future non-custodial features. Managed bot wallets stay separate.</small>
        `}
      </div>
      <small data-wallet-connect-status>${connected ? `Connected ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}.` : "Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
  `;
}

function xConnectSection() {
  const connected = Boolean(state.xHandle);
  return `
    <section class="create-wallet-card x-connect-card">
      <div>
        <h3>X Profile</h3>
        <p>Save, change, or unlink the X handle used for share buttons on PnL cards, trades, scanner picks, watchlists, KOL signals, and launch watches. Posts always open in X for review first.</p>
      </div>
      <label>
        X Handle
        <input data-x-handle type="text" placeholder="@yourhandle" value="${escapeHtml(state.xHandle ? `@${state.xHandle}` : "")}">
      </label>
      <button type="button" data-connect-x>${connected ? "Save Different X" : "Save X Handle"}</button>
      <button type="button" data-open-x-login>${connected ? "Open X Profile" : "Open X Login"}</button>
      ${connected ? `<button type="button" class="danger-lite" data-clear-x>Unlink X</button>` : ""}
      <small data-x-status>${connected ? `Saved as @${escapeHtml(state.xHandle)}. Enter a different handle and tap Save Different X to change it, or Unlink X to remove it.` : `Enter a handle, then Save X Handle. No X password is stored.`}</small>
    </section>
    <section class="create-wallet-card x-watch-card">
      <div>
        <h3>Share Watch</h3>
        <p>Post a coin, CA, ticker, or KOL you are watching without buying. Good for calls, watchlists, and community alerts.</p>
      </div>
      <label>
        Coin / CA / Ticker
        <input data-share-watch-token type="text" placeholder="Example: $OGRE or token CA">
      </label>
      <label>
        KOL Wallet / Handle
        <input data-share-watch-kol type="text" placeholder="Example: @kol or wallet address">
      </label>
      <div class="share-watch-actions">
        <button type="button" class="primary" data-share-watch-token-btn>Share Coin</button>
        <button type="button" data-share-watch-kol-btn>Share KOL</button>
      </div>
      <small data-share-watch-status></small>
    </section>
  `;
}

function referralSection() {
  const code = state.user?.referralCode || "";
  const link = state.user?.referralLink || (code ? `${shareSiteUrl}?ref=${encodeURIComponent(code)}` : "");
  const stats = state.user?.referralStats || {};
  const referralRows = Array.isArray(stats.referrals) ? stats.referrals : [];
  return `
    <section class="create-wallet-card referral-card">
      <div>
        <h3>Referral</h3>
        <p>Share SlimeWire and optionally earn the referral split on users you bring in. This is separate from the trader board.</p>
      </div>
      <div class="referral-stats-grid">
        <span><small>Total earned</small><strong>${escapeHtml(stats.totalSol || "0")} SOL</strong></span>
        <span><small>Payouts</small><strong>${escapeHtml(stats.payoutCount || 0)}</strong></span>
        <span><small>Referral users</small><strong>${escapeHtml(referralRows.length)}</strong></span>
      </div>
      ${referralRows.length ? `
        <div class="referral-breakdown">
          ${referralRows.slice(0, 6).map((row) => `
            <div class="referral-breakdown-row">
              <span>${escapeHtml(row.userId || "user")}</span>
              <strong>${escapeHtml(row.sol || "0")} SOL</strong>
              <small>${escapeHtml(row.payoutCount || 0)} payout${Number(row.payoutCount || 0) === 1 ? "" : "s"}</small>
            </div>
          `).join("")}
        </div>
      ` : `<small>No referral payouts yet. They will appear here when referred users trade and referral fees are paid.</small>`}
      <label>
        Referral Payout Wallet
        <input data-referral-wallet type="text" placeholder="Wallet for referral fees" value="${escapeHtml(state.user?.referralPayoutWallet || "")}">
      </label>
      <div class="card-actions">
        <button type="button" class="primary" data-save-referral>Save Referral</button>
        ${link ? `<button type="button" data-copy="${escapeHtml(link)}">Copy Link</button>` : ""}
        ${link ? xShareButton(`Trade faster on SlimeWire. Referral: ${link}`, "Share X") : ""}
        ${link ? telegramShareButton(`Trade faster on SlimeWire. Referral: ${link}`, "Share TG") : ""}
      </div>
      <small data-referral-status>${code ? `Your code: ${escapeHtml(code)}${state.user?.referredByCode ? ` | Referred by ${escapeHtml(state.user.referredByCode)}` : ""}` : "Create or log in to get a referral code."}</small>
    </section>
  `;
}

function traderBoardSection() {
  const mode = state.user?.traderBoardWalletMode || "all";
  const selected = Array.isArray(state.user?.traderBoardWalletIndexes)
    ? state.user.traderBoardWalletIndexes
    : state.wallets.map((wallet) => String(wallet.index));
  return `
    <section class="create-wallet-card trader-board-card">
      <div>
        <h3>Top SlimeWire Traders</h3>
        <p>Opt in only if you want your SlimeWire trade stats shown on the KOL board. Choose all bot wallets or only the wallets you want counted.</p>
      </div>
      <label class="checkbox-line">
        <input data-show-trader-board type="checkbox" ${state.user?.showOnTraderBoard ? "checked" : ""}>
        Show me on Top SlimeWire Traders
      </label>
      <label>
        Tracked Wallets
        <select data-trader-board-wallet-mode>
          <option value="all" ${mode === "all" ? "selected" : ""}>All SlimeWire wallets</option>
          <option value="manual" ${mode === "manual" ? "selected" : ""}>Only selected wallets</option>
        </select>
      </label>
      <div class="wallet-checks preset-wallets trader-board-wallets">
        ${state.wallets.length ? walletChecksHtml("trader-board", selected) : `<p class="muted">Create or restore wallets first if you want manual wallet selection.</p>`}
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-trader-board>Save Trader Board</button>
        <button type="button" data-tab="kol">View Top Traders</button>
      </div>
      <small data-trader-board-status>${state.user?.showOnTraderBoard ? "You are opted in. Ranking updates from saved SlimeWire trade history." : "Off by default. Referral is not required."}</small>
    </section>
  `;
}

function backupRestoreSection() {
  return `
    <section class="create-wallet-card restore-card">
      <div>
        <h3>Backup / Restore</h3>
        <p>Load bot backup files or pasted recovery text back into this web account. Keep backup files private.</p>
      </div>
      <label>
        Backup File
        <input data-restore-file type="file" accept=".txt,.json,text/plain,application/json">
      </label>
      <label class="wide-field">
        Backup Text
        <textarea data-restore-text rows="5" placeholder="Paste the wallet-backup text here, or choose the backup .txt file above."></textarea>
      </label>
      <button data-restore-backup>Restore Wallets</button>
      <button type="button" class="secondary" data-export-backup>Download Current Backup</button>
      <small data-restore-status>${state.restoreResult ? escapeHtml(state.restoreResult.message || "Restore complete.") : ""}</small>
      <small data-export-status>${state.backupResult ? escapeHtml(state.backupResult.message || "Backup ready.") : ""}</small>
    </section>
  `;
}

function importWalletSection() {
  return `
    <section class="create-wallet-card restore-card">
      <div>
        <h3>Import Wallet</h3>
        <p>Paste a base58 private key or JSON secret-key array. The bot encrypts it with this account and immediately downloads fresh backup files.</p>
      </div>
      <label>
        Label
        <input data-import-label type="text" placeholder="Imported Wallet">
      </label>
      <label class="wide-field">
        Private Key / Secret Key
        <textarea data-import-secret rows="5" placeholder="Base58 private key or [12,34,...] secret key"></textarea>
      </label>
      <button data-import-wallet>Import</button>
      <small data-import-status>${state.importResult ? escapeHtml(state.importResult.message || "Import complete.") : ""}</small>
    </section>
  `;
}

function downloadsHtml() {
  if (!state.downloads) return "";
  return `
    <section class="download-card">
      <div>
        <h3>Wallet Backups Ready</h3>
        <p>Keep both files private. The recovery file contains raw private keys.</p>
      </div>
      <button data-download="encryptedBackup">Download Bot Backup</button>
      <button data-download="recoveryKeys">Download Solflare Keys</button>
    </section>
  `;
}

function xShareButton(text, label = "Share X") {
  return `<button type="button" data-share-x data-share-text="${escapeHtml(text)}">${escapeHtml(label)}</button>`;
}

function telegramShareButton(text, label = "TG") {
  const body = shareTextWithSite(text);
  const url = `https://t.me/share/url?url=${encodeURIComponent(shareSiteUrl)}&text=${encodeURIComponent(body)}`;
  return `<a href="${escapeHtml(url)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>`;
}

function shareTextWithSite(text) {
  const base = String(text || "").replace(/\s+/g, " ").trim();
  const body = base.length > 210 ? `${base.slice(0, 207).trim()}...` : base;
  return `${body} ${shareSiteUrl}`;
}

function tradeShareText(row) {
  const isBuy = row.type === "buy";
  const amount = isBuy ? `${row.spentSol} SOL` : `${row.netSol} SOL`;
  return `${isBuy ? "Bought" : "Sold"} ${row.shortMint || shortAddress(row.tokenMint)} for ${amount}. Chart ${dexUrl(row.tokenMint)}`;
}

function bundleShareText(row) {
  const action = row.type === "bundle_sell" ? "Bundle sold" : row.source === "web_bundle_plan" ? "Armed bundle auto-exit" : "Bundle bought";
  return `${action} ${row.shortMint || shortAddress(row.tokenMint)} across ${row.successCount || 0}/${row.walletCount || 0} wallet(s).`;
}

function planShareText(row, label = "Armed timed trade") {
  return `${label} on ${row.shortMint || shortAddress(row.tokenMint)} with ${row.successCount || 0}/${row.walletCount || 0} wallet(s), TP ${row.takeProfitSummary || `+${row.takeProfitPct}%`}, SL ${row.stopLossSummary || `-${row.stopLossPct}%`}.`;
}

function pnlShareText(row) {
  return `PnL on ${row.shortMint || shortAddress(row.tokenMint)}: ${row.realizedSol} realized, ${row.buys} buy(s), ${row.sells} sell(s).`;
}

function positionShareText(position) {
  return `Watching ${position.shortMint || shortAddress(position.tokenMint)}: ${position.uiAmount} tokens across ${position.walletCount} wallet(s), PnL ${position.openPnlSol || position.realizedSol || "tracking"}.`;
}

function sniperShareText(row) {
  return `Watching ${row.symbol || shortAddress(row.tokenMint)}: score ${row.score}/100, MC ${row.marketCapLabel}, liq ${row.liquidityLabel}. Chart ${dexUrl(row.tokenMint)}`;
}

function kolShareText(row) {
  return `KOL signal ${row.symbol || shortAddress(row.tokenMint)}: score ${row.score || 0}/100, value ${row.valueLabel || "$0"}, signal ${row.winRateLabel || "n/a"}. Chart ${dexUrl(row.tokenMint)}`;
}

function kolProfileShareText(kol) {
  const name = kol.twitter ? `@${kol.twitter}` : kol.name || kol.shortWallet || shortAddress(kol.wallet);
  return `Watching KOL ${name}: realized ${kol.realizedLabel || "n/a"}, ROI ${kol.roiLabel || "n/a"}, trades ${kol.trades ?? "n/a"}.`;
}

function launchShareText(watch) {
  return `Watching $${watch.ticker} with Launch Snipe: ${watch.walletCount} wallet(s), ${watch.amountSol} SOL each, TP ${watch.takeProfitSummary || `+${watch.takeProfitPct}%`}, SL ${watch.stopLossSummary || `-${watch.stopLossPct}%`}.`;
}

function manualCoinWatchShareText(value) {
  const text = String(value || "").trim();
  const label = text.startsWith("$") ? text : text.length > 30 ? shortAddress(text) : `$${text.replace(/^\$+/, "")}`;
  const chart = text.length > 30 ? ` Chart ${dexUrl(text)}` : "";
  return `Watching ${label}.${chart}`;
}

function manualKolWatchShareText(value) {
  const text = String(value || "").trim();
  const label = text.startsWith("@") ? text : text.length > 30 ? shortAddress(text) : `@${text.replace(/^@+/, "")}`;
  return `Watching KOL ${label}.`;
}

function userAvatarHtml(fallback = "SW") {
  const avatar = String(state.user?.avatar || "").trim();
  if (isSafeAvatarSrc(avatar)) {
    return `<img src="${escapeHtml(avatar)}" alt="">`;
  }
  const ogreAvatar = "./assets/slimewire/png/token-mascots/token-mascot-1.png";
  if (fallback === "SW" || fallback === "OG") {
    return `<img src="${ogreAvatar}" alt="">`;
  }
  const label = String(fallback || "SW").trim().slice(0, 2).toUpperCase() || "SW";
  return `<span>${escapeHtml(label)}</span>`;
}

function isSafeAvatarSrc(value) {
  const text = String(value || "").trim();
  return /^data:image\/(png|jpe?g|webp);base64,/i.test(text) || /^https:\/\/[^\s"'<>]+$/i.test(text);
}

function xAvatarUrl(handle) {
  const clean = cleanXHandle(handle);
  return clean ? `https://unavatar.io/twitter/${encodeURIComponent(clean)}` : "";
}

function xProfileUrl(handle = state.xHandle) {
  const clean = cleanXHandle(handle);
  return clean ? `https://x.com/${encodeURIComponent(clean)}` : "https://x.com/i/flow/login";
}

function kolAvatarSrc(kol = {}) {
  const avatar = String(kol.avatar || kol.image || "").trim();
  if (isSafeAvatarSrc(avatar)) return avatar;
  const directHandle = cleanXHandle(kol.twitter || kol.x || kol.username || "");
  if (directHandle) return xAvatarUrl(directHandle);
  const nameHandle = cleanXHandle(kol.name || kol.kolName || "");
  return nameHandle && nameHandle.length >= 2 ? xAvatarUrl(nameHandle) : "";
}

function kolAvatarLabel(kol = {}) {
  const text = String(kol.twitter || kol.name || kol.kolName || kol.shortWallet || kol.wallet || "KO").trim();
  return text.replace(/^@+/, "").slice(0, 2).toUpperCase() || "KO";
}

function kolAvatarMarkup(kol = {}, className = "kol-avatar") {
  const src = kolAvatarSrc(kol);
  return src
    ? `<img class="${escapeHtml(className)}" src="${escapeHtml(src)}" alt="">`
    : `<div class="${escapeHtml(className)} kol-avatar-fallback" aria-hidden="true">${escapeHtml(kolAvatarLabel(kol))}</div>`;
}

function browserWalletChoices() {
  return [
    { id: "phantom", label: "Phantom", detected: Boolean(walletProviderById("phantom")) },
    { id: "solflare", label: "Solflare", detected: Boolean(walletProviderById("solflare")) },
    { id: "backpack", label: "Backpack", detected: Boolean(walletProviderById("backpack")) },
    { id: "solana", label: "Detected Wallet", detected: Boolean(walletProviderById("solana")) }
  ];
}

function walletProviderById(id) {
  if (id === "phantom") return window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
  if (id === "solflare") return window.solflare || (window.solana?.isSolflare ? window.solana : null);
  if (id === "backpack") return window.backpack?.solana || null;
  if (id === "solana") return window.solana || window.solflare || window.phantom?.solana || window.backpack?.solana || null;
  return null;
}

function walletProviderLabel(id, provider) {
  if (id === "phantom") return "Phantom";
  if (id === "solflare") return "Solflare";
  if (id === "backpack") return "Backpack";
  if (provider?.isPhantom) return "Phantom";
  if (provider?.isSolflare) return "Solflare";
  if (provider?.isBackpack) return "Backpack";
  return "Solana Wallet";
}

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text || "token";
}

function tradeHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create a wallet set above, restore a backup, or import a wallet. After one wallet is saved, the Trade buttons unlock automatically.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>One-Wallet Trade</h3>
            <p>Paste a token CA, pick a wallet, then use fast buy and sell buttons from the webpage.</p>
          </div>
        </div>
        <label>
          Wallet
          <select data-trade-wallet>
            ${walletOptionsHtml()}
          </select>
        </label>
        <label>
          Token CA
          <input data-trade-token type="text" placeholder="Paste Solana token mint" value="${escapeHtml(state.tradeToken)}">
        </label>
        <label>
          Slippage
          <select data-trade-slippage data-custom-select="trade-slippage">
            <option value="300">3% - tighter</option>
            <option value="400" selected>4% - default</option>
            <option value="500">5% - faster fills</option>
            <option value="custom">Custom</option>
          </select>
          <input data-trade-slippage-custom data-custom-for="trade-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
        </label>

        <div class="trade-block">
          <div>
            <h4>Buy</h4>
            <p>Quick SOL amounts include the bot fee and keep the safety reserve. Optional auto-exit arms only the selected wallet.</p>
          </div>
          <div class="quick-grid">
            <button class="primary" data-trade-buy-quick="0.1">Buy .10 SOL</button>
            <button class="primary" data-trade-buy-quick="0.5">Buy .50 SOL</button>
            <button class="primary" data-trade-buy-quick="1">Buy 1 SOL</button>
            <button data-trade-buy-max>Buy Max</button>
          </div>
          <div class="inline-action">
            <input data-buy-custom type="number" min="0" step="0.01" placeholder="Custom SOL">
            <button data-trade-buy-custom>Buy Custom</button>
          </div>
          <div class="volume-grid compact-grid">
            <label>
              Take Profit
              <select data-trade-auto-tp data-custom-select="trade-auto-tp">
                <option value="0" selected>Off</option>
                <option value="15">+15%</option>
                <option value="25">+25%</option>
                <option value="50">+50%</option>
                <option value="100">+100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-auto-tp-custom data-custom-for="trade-auto-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Stop Loss
              <select data-trade-auto-sl data-custom-select="trade-auto-sl">
                <option value="0" selected>Off</option>
                <option value="8">-8%</option>
                <option value="10">-10%</option>
                <option value="15">-15%</option>
                <option value="25">-25%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-auto-sl-custom data-custom-for="trade-auto-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Fallback Timer
              ${fallbackTimerSelectHtml("trade-auto-delay", "data-trade-auto-delay", "off")}
            </label>
            <label>
              Exit Size
              <select data-trade-auto-sell-percent data-custom-select="trade-auto-sell-percent">
                <option value="off">Off</option>
                <option value="50">50%</option>
                <option value="80">80%</option>
                <option value="100" selected>100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-auto-sell-percent-custom data-custom-for="trade-auto-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
            </label>
          </div>
        </div>

        <div class="trade-block">
          <div>
            <h4>Sell</h4>
            <p>Sell buttons use the selected wallet and token CA above.</p>
          </div>
          <div class="quick-grid">
            <button data-trade-sell-quick="25">Sell 25%</button>
            <button data-trade-sell-quick="50">Sell 50%</button>
            <button data-trade-sell-quick="100">Sell 100%</button>
          </div>
          <div class="inline-action">
            <input data-sell-custom type="number" min="1" max="100" step="1" placeholder="Custom %">
            <button data-trade-sell-custom>Sell Custom</button>
          </div>
        </div>

        <div class="trade-block managed-trade-block">
          <div>
            <h4>Managed Buy + Auto Exit</h4>
            <p>Use one wallet, multiple wallets, or a saved group. The bot buys, then watches take-profit, stop-loss, or timer.</p>
          </div>
          <div class="wallet-checks">
            ${walletChecksHtml("trade-plan")}
          </div>
          ${walletGroupHtml("trade-plan")}
          <div class="volume-grid">
            <label>
              Buy Per Wallet
              <select data-trade-plan-amount data-custom-select="trade-plan-amount">
                <option value="0.1" selected>.10 SOL</option>
                <option value="0.5">.50 SOL</option>
                <option value="1">1 SOL</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-plan-amount-custom data-custom-for="trade-plan-amount" type="number" min="0" step="0.01" placeholder="Custom SOL" hidden>
            </label>
            <label>
              Take Profit
              <select data-trade-plan-tp data-custom-select="trade-plan-tp">
                <option value="0">Off</option>
                <option value="15">+15%</option>
                <option value="25" selected>+25%</option>
                <option value="50">+50%</option>
                <option value="100">+100%</option>
                <option value="250">+250%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-plan-tp-custom data-custom-for="trade-plan-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Stop Loss
              <select data-trade-plan-sl data-custom-select="trade-plan-sl">
                <option value="0">Off</option>
                <option value="8" selected>-8%</option>
                <option value="10">-10%</option>
                <option value="15">-15%</option>
                <option value="25">-25%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-plan-sl-custom data-custom-for="trade-plan-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Fallback Sell
              ${fallbackTimerSelectHtml("trade-plan-delay", "data-trade-plan-delay", "5")}
            </label>
            <label>
              Exit Size
              <select data-trade-plan-sell-percent data-custom-select="trade-plan-sell-percent">
                <option value="off">Off</option>
                <option value="50">50%</option>
                <option value="80">80%</option>
                <option value="100" selected>100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-plan-sell-percent-custom data-custom-for="trade-plan-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
            </label>
            <label>
              Slippage
              <select data-trade-plan-slippage data-custom-select="trade-plan-slippage">
                <option value="300">3%</option>
                <option value="400" selected>4%</option>
                <option value="500">5%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-plan-slippage-custom data-custom-for="trade-plan-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
            </label>
          </div>
          ${walletExitTargetsHtml("trade-plan")}
          <button class="primary" data-trade-plan-start>Buy + Watch Exit</button>
        </div>
        <p class="trade-status" data-trade-status>${state.tradeResult ? escapeHtml(state.tradeResult.message || "Trade complete.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>Web Trading</h3>
          <p>Uses encrypted managed wallets, route previews, safety checks, slippage settings, and the same fee logic as the Telegram bot.</p>
        </article>
        <article>
          <h3>Selected Token</h3>
          <code>${state.tradeToken ? escapeHtml(state.tradeToken) : "Paste a CA or tap Trade from a scanner pick."}</code>
          ${state.tradeToken ? `<div class="card-actions">${xShareButton(manualCoinWatchShareText(state.tradeToken), "Share Watch")}</div>` : ""}
        </article>
        ${tradePresetManagerHtml()}
        <article>
          <h3>Balance Check</h3>
          <p>Refresh wallet balances and open positions without leaving this account.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${tradeResultHtml()}
        ${tradePlanResultHtml()}
      </aside>
    </section>
  `;
}

function walletOptionsHtml(selectedIndex = "") {
  if (!state.wallets.length) {
    return `<option value="1">No managed wallets loaded</option>`;
  }
  return state.wallets.map((wallet) => {
    const balance = state.balances.find((row) => Number(row.index) === Number(wallet.index));
    const sol = balance?.sol !== null && balance?.sol !== undefined ? `${Number(balance.sol).toFixed(4)} SOL` : "balance loading";
    return `<option value="${wallet.index}" ${String(wallet.index) === String(selectedIndex || "") ? "selected" : ""}>${wallet.index}. ${escapeHtml(wallet.label)} - ${sol}</option>`;
  }).join("");
}

function tradeResultHtml() {
  if (!state.tradeResult) {
    return `
      <article>
        <h3>Latest Result</h3>
        <p>Your latest web buy or sell recap will appear here after the transaction lands.</p>
      </article>
    `;
  }

  const row = state.tradeResult;
  const isBuy = row.type === "buy";
  return `
    <article class="latest-trade">
      <h3>${isBuy ? "Buy Complete" : "Sell Complete"}</h3>
      <p>${escapeHtml(row.message || "")}</p>
      <dl>
        <div><dt>Wallet</dt><dd>${escapeHtml(row.walletLabel)}</dd></div>
        <div><dt>${isBuy ? "Spent" : "Net"}</dt><dd>${escapeHtml(isBuy ? row.spentSol : row.netSol)} SOL</dd></div>
        <div><dt>Fee</dt><dd>${escapeHtml(row.feeSol || "0")} SOL</dd></div>
      </dl>
      <div class="card-actions">
        <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
        ${xShareButton(tradeShareText(row))}
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function tradePlanResultHtml() {
  if (!state.tradePlanResult) {
    return `
      <article>
        <h3>Managed Exit</h3>
        <p>Use Buy + Watch Exit when you want the token trade to manage TP, SL, and timer exits automatically.</p>
      </article>
    `;
  }

  const row = state.tradePlanResult;
  return `
    <article class="latest-trade">
      <h3>Managed Trade Armed</h3>
      <p>${escapeHtml(row.message || "")}</p>
      <dl>
        <div><dt>Wallets</dt><dd>${escapeHtml(row.walletLabel || `${row.successCount || 0}/${row.walletCount || 0}`)}</dd></div>
        <div><dt>Buy</dt><dd>${escapeHtml(row.amountSol)} SOL</dd></div>
        <div><dt>TP / SL</dt><dd>${escapeHtml(row.takeProfitSummary || `+${row.takeProfitPct}%`)} / ${escapeHtml(row.stopLossSummary || `-${row.stopLossPct}%`)}</dd></div>
        <div><dt>Timer Exit</dt><dd>${escapeHtml(timerSellSummary(row))}</dd></div>
      </dl>
      ${row.results?.length ? `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>` : ""}
      <div class="card-actions">
        <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
        ${xShareButton(planShareText(row, "Armed managed trade"))}
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function bundleHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create or restore wallets above first. Bundle works after the web account has managed wallets saved.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Bundle</h3>
            <p>Buy or sell the same token across selected wallets from one clean panel.</p>
          </div>
          <a class="mini-link" href="${state.bundleToken ? dexUrl(state.bundleToken) : "#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        <label>
          Token CA
          <input data-bundle-token type="text" placeholder="Paste Solana token mint" value="${escapeHtml(state.bundleToken || state.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${walletChecksHtml("bundle")}
        </div>
        ${walletGroupHtml("bundle")}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-bundle-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Sell Percent
            <select data-bundle-percent data-custom-select="bundle-percent">
              <option value="25">25%</option>
              <option value="50">50%</option>
              <option value="100" selected>100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-bundle-percent-custom data-custom-for="bundle-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
          </label>
          <label>
            Slippage
            <select data-bundle-slippage data-custom-select="bundle-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-bundle-slippage-custom data-custom-for="bundle-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        <div class="trade-block">
          <div>
            <h4>Auto Exit After Bundle Buy</h4>
            <p>Optional timed plan for selected wallets. Use presets or type custom targets like 500 or 5x.</p>
          </div>
          <div class="volume-grid">
            <label>
              Fallback Sell
              ${fallbackTimerSelectHtml("bundle-plan-delay", "data-bundle-plan-delay", "5")}
            </label>
            <label>
              Take Profit
              <select data-bundle-plan-tp data-custom-select="bundle-plan-tp">
                <option value="25">+25%</option>
                <option value="60" selected>+60%</option>
                <option value="100">+100%</option>
                <option value="250">+250%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-tp-custom data-custom-for="bundle-plan-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Stop Loss
              <select data-bundle-plan-sl data-custom-select="bundle-plan-sl">
                <option value="0">Off</option>
                <option value="8">-8%</option>
                <option value="10" selected>-10%</option>
                <option value="15">-15%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-sl-custom data-custom-for="bundle-plan-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Repeat
              <select data-bundle-plan-loop data-custom-select="bundle-plan-loop">
                <option value="1" selected>1x</option>
                <option value="5">5x</option>
                <option value="10">10x</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-loop-custom data-custom-for="bundle-plan-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
            </label>
            <label>
              Repeat Wait
              ${repeatWaitSelectHtml("bundle-plan-loop-delay", "data-bundle-plan-loop-delay", "0")}
            </label>
            <label>
              Exit Size
              <select data-bundle-plan-sell-percent data-custom-select="bundle-plan-sell-percent">
                <option value="off">Off</option>
                <option value="50">50%</option>
                <option value="80">80%</option>
                <option value="100" selected>100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-sell-percent-custom data-custom-for="bundle-plan-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
            </label>
          </div>
          ${walletExitTargetsHtml("bundle-plan")}
          <button class="primary" data-bundle-plan>Bundle Buy + Auto Exits</button>
        </div>
        <div class="quick-grid two-wide">
          <button class="primary" data-bundle-buy>Bundle Buy</button>
          <button data-bundle-sell>Bundle Sell</button>
        </div>
        <p class="trade-status" data-bundle-status>${state.bundleResult ? escapeHtml(state.bundleResult.message || "Bundle complete.") : "Ready."}</p>
      </article>
      <aside class="trade-side">
        <article>
          <h3>Multi-Wallet Control</h3>
          <p>Select the exact wallets to use. Each selected wallet must hold enough SOL for buy amount, fees, and reserve.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        <article>
          <h3>Copy Trade / KOL Tracker</h3>
          <p>Use KOL signals as trade ideas, then send them into Bundle or arm a copy plan with the exits above.</p>
          <div class="card-actions">
            <button data-tab="kol">Open KOL Tracker</button>
            ${state.bundleToken ? xShareButton(manualCoinWatchShareText(state.bundleToken), "Share Token") : ""}
          </div>
        </article>
        ${bundlePresetManagerHtml()}
        ${bundleResultHtml()}
      </aside>
    </section>
  `;
}

function bundleResultHtml() {
  if (!state.bundleResult) {
    return `
      <article>
        <h3>Latest Bundle</h3>
        <p>Bundle buy/sell results will show here wallet by wallet.</p>
      </article>
    `;
  }

  const title = state.bundleResult.source === "web_bundle_plan"
    ? "Bundle Auto Exit Plan"
    : state.bundleResult.type === "bundle_sell" ? "Bundle Sell" : "Bundle Buy";
  return `
    <article class="latest-trade">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(state.bundleResult.message || "")}</p>
      <div class="mini-results">
        ${(state.bundleResult.results || []).map((row) => `<span data-ok="${row.ok ? "true" : "false"}">${escapeHtml(row.message)}</span>`).join("")}
      </div>
      <div class="card-actions">
        <button data-copy="${escapeHtml(state.bundleResult.tokenMint)}">Copy CA</button>
        ${xShareButton(bundleShareText(state.bundleResult))}
        <a href="${escapeHtml(state.bundleResult.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function walletChecksHtml(prefix, selectedIndexes = null) {
  const defaultCheckedCount = prefix === "trade-plan" ? 1 : 6;
  const selectedSet = Array.isArray(selectedIndexes) ? new Set(selectedIndexes.map(String)) : null;
  return state.wallets.map((wallet, index) => `
    <label class="wallet-check">
      <input type="checkbox" data-${prefix}-wallet value="${wallet.index}" ${selectedSet ? (selectedSet.has(String(wallet.index)) ? "checked" : "") : (index < defaultCheckedCount ? "checked" : "")}>
      <span>${wallet.index}. ${escapeHtml(wallet.label)}</span>
      <code>${escapeHtml(wallet.shortPublicKey || wallet.publicKey)}</code>
    </label>
  `).join("");
}

function walletGroupHtml(prefix, value = "") {
  return `
    <label>
      Optional Group Label
      <input data-${prefix}-group type="text" placeholder="Example: Ogre" value="${escapeHtml(value)}">
    </label>
  `;
}

function fieldValue(selectSelector, customSelector, fallback = "") {
  const selected = $(selectSelector)?.value || fallback;
  if (selected !== "custom") return selected;
  const custom = $(customSelector)?.value?.trim();
  if (!custom) throw new Error("Enter the custom value first.");
  return custom;
}

function presetOptionsHtml(kind, selectedId = "") {
  const presets = state.presets?.[kind] || [];
  const manualSelected = !selectedId || selectedId === "none" || selectedId === "manual";
  const createLabel = kind === "bundle" ? "Create / edit bundle preset" : "Create / edit trade preset";
  if (!presets.length) {
    return `
      <option value="" ${manualSelected ? "selected" : ""}>No preset / manual</option>
      <option value="custom" ${selectedId === "custom" ? "selected" : ""}>${createLabel}</option>
    `;
  }
  return `
    <option value="" ${manualSelected ? "selected" : ""}>No preset / manual</option>
    ${presets.map((preset) => `<option value="${escapeHtml(preset.id)}" ${preset.id === selectedId ? "selected" : ""}>${escapeHtml(preset.name)}</option>`).join("")}
    <option value="custom" ${selectedId === "custom" ? "selected" : ""}>${createLabel}</option>
  `;
}

function quickBuyInputHtml() {
  return `<input data-quick-buy-amount type="text" inputmode="decimal" autocomplete="off" placeholder="${escapeHtml(activeQuickBuyAmount() || "0.10")}" value="${escapeHtml(state.quickBuyAmountOverride)}">`;
}

function quickBuyPresetBarHtml(context = "scanner") {
  return `
    <div class="terminal-quick-buy-bar" aria-label="Quick buy settings">
      <label>
        Quick Buy SOL
        ${quickBuyInputHtml()}
      </label>
      <label>
        Preset
        <select data-fast-trade-preset="${escapeHtml(context)}">
          ${presetOptionsHtml("trade", state.selectedTradePresetId)}
        </select>
      </label>
    </div>
  `;
}

const FALLBACK_TIMER_OPTIONS = [
  ["off", "No timer"],
  ["5s", "5 sec"],
  ["10s", "10 sec"],
  ["15s", "15 sec"],
  ["30s", "30 sec"],
  ["1", "1 min"],
  ["3", "3 min"],
  ["5", "5 min"],
  ["15", "15 min"],
  ["30", "30 min"],
  ["60", "1 hour"],
  ["120", "2 hours"],
  ["custom", "Custom time"]
];

const REPEAT_WAIT_OPTIONS = [
  ["0", "No wait"],
  ["5s", "5 sec"],
  ["10s", "10 sec"],
  ["15s", "15 sec"],
  ["30s", "30 sec"],
  ["1", "1 min"],
  ["5", "5 min"],
  ["15", "15 min"],
  ["30", "30 min"],
  ["60", "1 hour"],
  ["120", "2 hours"],
  ["custom", "Custom time"]
];

function selectWithCustomHtml({ selectAttr, customAttr, customFor, options, selected = "", customType = "text", customPlaceholder = "Custom time" }) {
  const value = String(selected || "");
  const knownValues = new Set(options.map(([optionValue]) => optionValue));
  const selectValue = knownValues.has(value) ? value : "custom";
  const customValue = selectValue === "custom" && value !== "custom" ? value : "";
  return `
    <select ${selectAttr} data-custom-select="${escapeHtml(customFor)}">
      ${options.map(([optionValue, label]) => `<option value="${escapeHtml(optionValue)}" ${optionValue === selectValue ? "selected" : ""}>${escapeHtml(label)}</option>`).join("")}
    </select>
    <input ${customAttr} data-custom-for="${escapeHtml(customFor)}" type="${escapeHtml(customType)}" value="${escapeHtml(customValue)}" placeholder="${escapeHtml(customPlaceholder)}" ${selectValue === "custom" ? "" : "hidden"}>
  `;
}

function fallbackTimerSelectHtml(customFor, dataAttr, selected = "off") {
  return selectWithCustomHtml({
    selectAttr: `${dataAttr}`,
    customAttr: `${dataAttr}-custom`,
    customFor,
    options: FALLBACK_TIMER_OPTIONS,
    selected,
    customPlaceholder: "Custom: 45s, 20, 2h"
  });
}

function repeatWaitSelectHtml(customFor, dataAttr, selected = "0") {
  return selectWithCustomHtml({
    selectAttr: `${dataAttr}`,
    customAttr: `${dataAttr}-custom`,
    customFor,
    options: REPEAT_WAIT_OPTIONS,
    selected,
    customPlaceholder: "Custom: 30s, 20, 2h"
  });
}

function fastPresetToolbarHtml(context = "scanner") {
  return `
    <section class="preset-toolbar">
      <label class="quick-buy-label">
        Quick Buy SOL
        ${quickBuyInputHtml()}
      </label>
      <label>
        Fast Trade Preset
        <select data-fast-trade-preset="${escapeHtml(context)}">
          ${presetOptionsHtml("trade", state.selectedTradePresetId)}
        </select>
      </label>
      <label>
        Fast Bundle Preset
        <select data-fast-bundle-preset="${escapeHtml(context)}">
          ${presetOptionsHtml("bundle", state.selectedBundlePresetId)}
        </select>
      </label>
      <button type="button" data-tab="trade">Edit Trade Presets</button>
      <button type="button" data-tab="bundle">Edit Bundle Presets</button>
    </section>
  `;
}

function fastTradePresetBuilderHtml() {
  const status = state.fastTradePresetStatus || (state.wallets.length ? "Save this once, then tap Trade on any row." : "Load or connect a wallet before live trading.");
  return `
    <article class="fast-preset-builder" data-fast-preset-builder="trade">
      <div>
        <h4>Custom Fast Trade</h4>
        <p>Pick one wallet and save the buy, profit, stop, timer, exit percent, and slippage settings here.</p>
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-trade-preset-name type="text" value="Custom Trade"></label>
        <label>Wallet <select data-fast-trade-preset-wallet>${walletOptionsHtml()}</select></label>
        <label>Buy SOL <input data-fast-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-trade-preset-tp type="text" value="25" placeholder="25 or 5x"></label>
        <label>Stop Loss <input data-fast-trade-preset-sl type="text" value="8" placeholder="8"></label>
        <label>Fallback Timer ${fallbackTimerSelectHtml("fast-trade-preset-delay", "data-fast-trade-preset-delay", "off")}</label>
        <label>Exit % <input data-fast-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="trade">Save & Use Trade Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-trade-preset-status>${escapeHtml(status)}</small>
      </div>
    </article>
  `;
}

function fastBundlePresetBuilderHtml() {
  const status = state.fastBundlePresetStatus || (state.wallets.length ? "Save this once, then tap Bundle on any row." : "Load wallets before live bundle trading.");
  return `
    <article class="fast-preset-builder" data-fast-preset-builder="bundle">
      <div>
        <h4>Custom Fast Bundle</h4>
        <p>Select wallet numbers or type a group label, then save the same exit and slippage rules for fast Bundle buttons.</p>
      </div>
      <div class="fast-preset-wallets">
        <strong>Wallets</strong>
        <div class="wallet-checks preset-wallets">${walletChecksHtml("fast-bundle-preset")}</div>
        ${walletGroupHtml("fast-bundle-preset")}
      </div>
      <div class="fast-preset-grid">
        <label>Name <input data-fast-bundle-preset-name type="text" value="Custom Bundle"></label>
        <label>Buy SOL <input data-fast-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-fast-bundle-preset-tp type="text" value="60" placeholder="60 or 5x"></label>
        <label>Stop Loss <input data-fast-bundle-preset-sl type="text" value="10" placeholder="10"></label>
        <label>Fallback Timer ${fallbackTimerSelectHtml("fast-bundle-preset-delay", "data-fast-bundle-preset-delay", "off")}</label>
        <label>Exit % <input data-fast-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-fast-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="fast-preset-actions">
        <button type="button" class="primary" data-save-fast-preset="bundle">Save & Use Bundle Preset</button>
        <button type="button" data-tab="wallets">Create / Load Wallets</button>
        <small data-fast-bundle-preset-status>${escapeHtml(status)}</small>
      </div>
    </article>
  `;
}

function editingPreset(kind) {
  const id = kind === "trade" ? state.editingTradePresetId : state.editingBundlePresetId;
  return id ? presetById(kind, id) : null;
}

function setEditingPreset(kind, id) {
  if (kind === "trade") state.editingTradePresetId = id || "";
  if (kind === "bundle") state.editingBundlePresetId = id || "";
}

function tradePresetManagerHtml() {
  const preset = editingPreset("trade");
  const isReadonlyEdit = Boolean(preset?.readonly);
  const saveLabel = preset ? (isReadonlyEdit ? "Save Edited Copy" : "Update Trade Preset") : "Save Trade Preset";
  return `
    <article class="preset-card" data-preset-editor="trade">
      <h3>Trade Presets</h3>
      <p>${preset ? `Editing ${escapeHtml(preset.name)}.${isReadonlyEdit ? " Default presets save as a new custom copy." : ""}` : "Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-trade-preset-id type="hidden" value="${preset && !preset.readonly ? escapeHtml(preset.id) : ""}">
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp" value="${escapeHtml(preset?.name || "")}"></label>
      <label>Wallet <select data-trade-preset-wallet>${walletOptionsHtml(preset?.walletIndex || "")}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="${escapeHtml(preset?.amountSol || "0.1")}"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="${escapeHtml(preset?.takeProfitPct || "25")}"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="${escapeHtml(preset?.stopLossPct || "8")}"></label>
        <label>Fallback Timer ${fallbackTimerSelectHtml("trade-preset-delay", "data-trade-preset-delay", preset?.sellDelay || "off")}</label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="${escapeHtml(preset?.sellPercent || "100")}"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="${escapeHtml(preset?.slippageBps || "400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">${saveLabel}</button>
        ${preset ? `<button type="button" data-cancel-preset-edit="trade">Cancel Edit</button>` : ""}
      </div>
      ${presetListHtml("trade")}
      <small data-trade-preset-status></small>
    </article>
  `;
}

function bundlePresetManagerHtml() {
  const preset = editingPreset("bundle");
  const isReadonlyEdit = Boolean(preset?.readonly);
  const saveLabel = preset ? (isReadonlyEdit ? "Save Edited Copy" : "Update Bundle Preset") : "Save Bundle Preset";
  return `
    <article class="preset-card" data-preset-editor="bundle">
      <h3>Bundle Presets</h3>
      <p>${preset ? `Editing ${escapeHtml(preset.name)}.${isReadonlyEdit ? " Default presets save as a new custom copy." : ""}` : "Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals."}</p>
      <input data-bundle-preset-id type="hidden" value="${preset && !preset.readonly ? escapeHtml(preset.id) : ""}">
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send" value="${escapeHtml(preset?.name || "")}"></label>
      <div class="wallet-checks preset-wallets">${walletChecksHtml("bundle-preset", preset?.walletIndexes || null)}</div>
      ${walletGroupHtml("bundle-preset", preset?.walletGroup || "")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="${escapeHtml(preset?.amountSol || "0.1")}"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="${escapeHtml(preset?.takeProfitPct || "60")}"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="${escapeHtml(preset?.stopLossPct || "10")}"></label>
        <label>Fallback Timer ${fallbackTimerSelectHtml("bundle-preset-delay", "data-bundle-preset-delay", preset?.sellDelay || "off")}</label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="${escapeHtml(preset?.sellPercent || "100")}"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="${escapeHtml(preset?.slippageBps || "400")}"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">${saveLabel}</button>
        ${preset ? `<button type="button" data-cancel-preset-edit="bundle">Cancel Edit</button>` : ""}
      </div>
      ${presetListHtml("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `;
}

function presetListHtml(kind) {
  const presets = state.presets?.[kind] || [];
  if (!presets.length) return `<p class="muted">No presets loaded yet.</p>`;
  const activeId = kind === "trade" ? state.selectedTradePresetId : state.selectedBundlePresetId;
  return `
    <div class="preset-list">
      ${presets.map((preset) => {
        const isActive = preset.id === activeId;
        return `
        <div class="preset-pill" data-readonly="${preset.readonly ? "true" : "false"}" data-active="${isActive ? "true" : "false"}">
          <span>${escapeHtml(preset.name)}</span>
          <small>${escapeHtml(preset.amountSol)} SOL | TP ${escapeHtml(preset.takeProfitPct)} | SL ${escapeHtml(preset.stopLossPct)} | ${escapeHtml(preset.sellDelay || "off")}</small>
          <div class="preset-actions">
            <button type="button" class="${isActive ? "primary" : ""}" data-use-preset="${escapeHtml(kind)}" data-preset-id="${escapeHtml(preset.id)}">${isActive ? "Active" : "Use"}</button>
            <button type="button" data-edit-preset="${escapeHtml(kind)}" data-preset-id="${escapeHtml(preset.id)}">Edit</button>
            <button type="button" data-delete-preset="${escapeHtml(kind)}" data-preset-id="${escapeHtml(preset.id)}">${preset.readonly ? "Remove" : "Delete"}</button>
          </div>
        </div>
      `; }).join("")}
    </div>
  `;
}

function timerSellSummary(row) {
  return Number(row?.sellDelaySeconds || 0) > 0 ? `${row?.sellPercent || 100}%` : "Off";
}

function walletExitTargetsHtml(prefix) {
  return `
    <div class="trade-block">
      <div>
        <h4>Wallet-by-Wallet Exits</h4>
        <p>Optional for multi-wallet entries. Leave on Same to use the normal TP/SL above, or spread targets across wallets.</p>
      </div>
      <div class="volume-grid">
        <label>
          TP Targets
          <select data-${prefix}-wallet-tp data-custom-select="${prefix}-wallet-tp">
            <option value="" selected>Same TP for all</option>
            <option value="spread:25:60">Spread +25% to +60%</option>
            <option value="spread:40:100">Spread +40% to +100%</option>
            <option value="spread:60:250">Spread +60% to +250%</option>
            <option value="custom">Custom list</option>
          </select>
          <input data-${prefix}-wallet-tp-custom data-custom-for="${prefix}-wallet-tp" type="text" placeholder="Example: 25,40,60 or spread:25:100" hidden>
        </label>
        <label>
          SL Targets
          <select data-${prefix}-wallet-sl data-custom-select="${prefix}-wallet-sl">
            <option value="" selected>Same SL for all</option>
            <option value="spread:6:10">Spread -6% to -10%</option>
            <option value="spread:8:15">Spread -8% to -15%</option>
            <option value="spread:10:20">Spread -10% to -20%</option>
            <option value="custom">Custom list</option>
          </select>
          <input data-${prefix}-wallet-sl-custom data-custom-for="${prefix}-wallet-sl" type="text" placeholder="Example: 8,10,12 or spread:8:15" hidden>
        </label>
      </div>
    </div>
  `;
}

function readWalletExitTargets(prefix) {
  return {
    walletTakeProfitTargets: fieldValue(`[data-${prefix}-wallet-tp]`, `[data-${prefix}-wallet-tp-custom]`, ""),
    walletStopLossTargets: fieldValue(`[data-${prefix}-wallet-sl]`, `[data-${prefix}-wallet-sl-custom]`, "")
  };
}

function syncCustomFields(root = document) {
  root.querySelectorAll("[data-custom-for]").forEach((input) => {
    const select = [...document.querySelectorAll("[data-custom-select]")]
      .find((item) => item.dataset.customSelect === input.dataset.customFor);
    const isCustom = select?.value === "custom";
    input.hidden = !isCustom;
    if (!isCustom) input.value = "";
  });
}

function syncTimerSellNoTimer(select) {
  if (!select?.dataset?.customSelect?.endsWith("-sell-percent") || select.value !== "off") return;
  const delayKey = select.dataset.customSelect.replace(/-sell-percent$/, "-delay");
  const delaySelect = document.querySelector(`[data-custom-select="${delayKey}"]`);
  if (delaySelect) delaySelect.value = "off";
  syncCustomFields();
}

function volumeHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create or restore a wallet above first. Volume plans need a saved wallet so they can buy and watch exits.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Volume Plan</h3>
            <p>Buy once, then auto-manage the exit by timer, take-profit, stop-loss, or repeat cycles.</p>
          </div>
          <a class="mini-link" href="${state.volumeToken ? dexUrl(state.volumeToken) : "#"}" target="_blank" rel="noreferrer">Dex</a>
        </div>
        <label>
          Token CA
          <input data-volume-token type="text" placeholder="Paste Solana token mint" value="${escapeHtml(state.volumeToken || state.tradeToken)}">
        </label>
        <div class="wallet-checks">
          ${walletChecksHtml("volume")}
        </div>
        ${walletGroupHtml("volume")}

        <div class="volume-grid">
          <label>
            Buy Amount
            <input data-volume-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Sell After
            ${fallbackTimerSelectHtml("volume-delay", "data-volume-delay", "5")}
          </label>
          <label>
            Take Profit
            <select data-volume-tp data-custom-select="volume-tp">
              <option value="0">Off</option>
              <option value="15">+15%</option>
              <option value="25" selected>+25%</option>
              <option value="50">+50%</option>
              <option value="100">+100%</option>
              <option value="250">+250%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-tp-custom data-custom-for="volume-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-volume-sl data-custom-select="volume-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="25">-25%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-sl-custom data-custom-for="volume-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Repeat
            <select data-volume-loop data-custom-select="volume-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-loop-custom data-custom-for="volume-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            ${repeatWaitSelectHtml("volume-loop-delay", "data-volume-loop-delay", "0")}
          </label>
          <label>
            Exit Size
            <select data-volume-sell-percent data-custom-select="volume-sell-percent">
              <option value="off">Off</option>
              <option value="50">50%</option>
              <option value="80">80%</option>
              <option value="100" selected>100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-sell-percent-custom data-custom-for="volume-sell-percent" type="number" min="1" max="100" step="1" placeholder="Custom %" hidden>
          </label>
          <label>
            Slippage
            <select data-volume-slippage data-custom-select="volume-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-slippage-custom data-custom-for="volume-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>

        ${walletExitTargetsHtml("volume")}
        <button class="primary" data-volume-start>Start Volume Plan</button>
        <p class="trade-status" data-volume-status>${state.volumeResult ? escapeHtml(state.volumeResult.message || "Volume plan armed.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>What It Does</h3>
        <p>Volume is a timed position manager: it buys from selected wallets, then watches for your timer, profit target, or stop-loss. Repeat runs the same managed cycle again after an exit.</p>
        </article>
        <article>
          <h3>Default Setup</h3>
          <p>5 minute fallback timer, +25% take-profit, -8% stop-loss, 4% slippage, 100% exit.</p>
        </article>
        <article>
          <h3>After Entry</h3>
          <p>Refresh balances or view positions after a plan buys or exits.</p>
          <div class="card-actions">
            <button data-refresh-all>Refresh Balances</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
        ${volumeResultHtml()}
      </aside>
    </section>
  `;
}

function volumeResultHtml() {
  if (!state.volumeResult) {
    return `
      <article>
        <h3>Latest Plan</h3>
        <p>Your latest web volume plan recap will show here after the first buy lands.</p>
      </article>
    `;
  }

  const row = state.volumeResult;
  return `
    <article class="latest-trade">
      <h3>Plan Armed</h3>
      <p>${escapeHtml(row.message || "")}</p>
      <dl>
        <div><dt>Wallets</dt><dd>${escapeHtml(row.walletLabel || `${row.successCount || 0}/${row.walletCount || 0}`)}</dd></div>
        <div><dt>Buy</dt><dd>${escapeHtml(row.amountSol)} SOL</dd></div>
        <div><dt>TP / SL</dt><dd>${escapeHtml(row.takeProfitSummary || `+${row.takeProfitPct}%`)} / ${escapeHtml(row.stopLossSummary || `-${row.stopLossPct}%`)}</dd></div>
        <div><dt>Repeat</dt><dd>${escapeHtml(row.loopCount)}x</dd></div>
        <div><dt>Repeat Wait</dt><dd>${escapeHtml(row.loopDelaySeconds || 0)} sec</dd></div>
        <div><dt>Timer Exit</dt><dd>${escapeHtml(timerSellSummary(row))}</dd></div>
      </dl>
      ${row.results?.length ? `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>` : ""}
      <div class="card-actions">
        <button data-copy="${escapeHtml(row.tokenMint)}">Copy CA</button>
        ${xShareButton(planShareText(row, "Armed volume plan"))}
        <a href="${escapeHtml(row.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function launchHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No wallets loaded yet", "Create or restore wallets above first. Launch Snipe needs selected wallets before it can watch and buy a ticker.")}`;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Launch Snipe</h3>
            <p>Preset the ticker, wallets, SOL amount, exits, and slippage. The bot keeps scanning until that ticker appears.</p>
          </div>
        </div>
        <label>
          Ticker
          <input data-launch-ticker type="text" placeholder="Example: OGRE">
        </label>
        <div class="wallet-checks">
          ${walletChecksHtml("launch")}
        </div>
        ${walletGroupHtml("launch")}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-launch-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-launch-tp data-custom-select="launch-tp">
              <option value="0">Off</option>
              <option value="25">+25%</option>
              <option value="40" selected>+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
              <option value="250">+250%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-tp-custom data-custom-for="launch-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-launch-sl data-custom-select="launch-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-sl-custom data-custom-for="launch-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            ${fallbackTimerSelectHtml("launch-delay", "data-launch-delay", "3")}
          </label>
          <label>
            Repeat
            <select data-launch-loop data-custom-select="launch-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-loop-custom data-custom-for="launch-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            ${repeatWaitSelectHtml("launch-loop-delay", "data-launch-loop-delay", "0")}
          </label>
          <label>
            Slippage
            <select data-launch-slippage data-custom-select="launch-slippage">
              <option value="300" selected>3%</option>
              <option value="400">4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-slippage-custom data-custom-for="launch-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        ${walletExitTargetsHtml("launch")}
        <button class="primary" data-launch-start>Start Launch Watch</button>
        <p class="trade-status" data-launch-status>${state.launchResult ? escapeHtml(state.launchResult.message || "Launch watch armed.") : "Ready."}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>How It Works</h3>
          <p>It scans live launch/profile feeds about every ${escapeHtml(launchScanSeconds())} seconds while the bot is online.</p>
        </article>
        <article>
          <h3>Active Watches</h3>
          ${launchWatchesHtml()}
        </article>
      </aside>
    </section>
  `;
}

function launchCoinHtml() {
  const draft = state.launchCoinDraft || {};
  return `
    <section class="trade-layout launch-coin-layout">
      <article class="trade-card launch-coin-card">
        <div class="trade-head">
          <div>
            <h3><span class="launch-pill-icon" aria-hidden="true"></span>Launch Pump Coin</h3>
            <p>Create the Pump launch from SlimeWire when the launch connector is enabled, then auto-load the returned CA into Trade, Bundle, Snipe, or Volume presets.</p>
          </div>
          <span class="pill">Ogre TeK</span>
        </div>

        <details open class="launch-coin-section">
          <summary>Coin Details</summary>
          <div class="volume-grid">
            <label>
              Token Name
              <input data-launch-coin-name type="text" placeholder="Example: Ogre Mode" value="${escapeHtml(draft.name || "")}">
            </label>
            <label>
              Ticker
              <input data-launch-coin-symbol type="text" placeholder="Example: OGRE" value="${escapeHtml(draft.symbol || "")}">
            </label>
            <label class="full-span">
              Description
              <textarea data-launch-coin-description rows="3" placeholder="Short public token description">${escapeHtml(draft.description || "")}</textarea>
            </label>
            <label>
              Image
              <input data-launch-coin-image type="file" accept="image/png,image/jpeg,image/webp,gif">
            </label>
            <label>
              Website
              <input data-launch-coin-website type="url" placeholder="https://..." value="${escapeHtml(draft.website || "")}">
            </label>
            <label>
              X
              <input data-launch-coin-x type="text" placeholder="@handle or URL" value="${escapeHtml(draft.x || "")}">
            </label>
            <label>
              Telegram
              <input data-launch-coin-telegram type="url" placeholder="https://t.me/..." value="${escapeHtml(draft.telegram || "")}">
            </label>
          </div>
        </details>

        <details open class="launch-coin-section">
          <summary>Post-Launch Presets</summary>
          <div class="volume-grid">
            <label>
              Live CA After Launch
              <input data-launch-coin-ca type="text" placeholder="Auto-filled after launch, or paste CA manually" value="${escapeHtml(draft.tokenMint || "")}">
            </label>
            <label>
              Action After Launch
              <select data-launch-coin-action>
                <option value="watch" ${draft.action === "watch" ? "selected" : ""}>Watch only</option>
                <option value="trade" ${draft.action === "trade" ? "selected" : ""}>Auto Trade with one-time setup</option>
                <option value="bundle" ${draft.action === "bundle" ? "selected" : ""}>Auto Bundle with one-time setup</option>
                <option value="launch-watch" ${draft.action === "launch-watch" ? "selected" : ""}>Arm Launch Snipe watcher</option>
              </select>
            </label>
            <label>
              Trade Preset
              <select data-launch-coin-trade-preset>
                ${presetOptionsHtml("trade", draft.tradePresetId || state.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-launch-coin-bundle-preset>
                ${presetOptionsHtml("bundle", draft.bundlePresetId || state.selectedBundlePresetId)}
              </select>
            </label>
            <label>
              Buy SOL Per Wallet
              <input data-launch-coin-amount type="text" inputmode="decimal" autocomplete="off" placeholder="0.1" value="${escapeHtml(draft.amountSol || activeQuickBuyAmount() || "0.1")}">
            </label>
            <label>
              Sell Percent
              <input data-launch-coin-sell-percent type="number" min="1" max="100" step="1" value="${escapeHtml(draft.sellPercent || "100")}">
            </label>
            <label>
              Stop Loss
              <select data-launch-coin-sl data-custom-select="launch-coin-sl">
                <option value="0" ${String(draft.stopLossPct || "") === "0" ? "selected" : ""}>Off</option>
                <option value="8" ${String(draft.stopLossPct || "8") === "8" ? "selected" : ""}>-8%</option>
                <option value="10" ${String(draft.stopLossPct || "") === "10" ? "selected" : ""}>-10%</option>
                <option value="15" ${String(draft.stopLossPct || "") === "15" ? "selected" : ""}>-15%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-launch-coin-sl-custom data-custom-for="launch-coin-sl" type="text" placeholder="Custom SL %" hidden>
            </label>
            <label>
              Take Profit
              <select data-launch-coin-tp data-custom-select="launch-coin-tp">
                <option value="0" ${String(draft.takeProfitPct || "") === "0" ? "selected" : ""}>Off</option>
                <option value="25" ${String(draft.takeProfitPct || "") === "25" ? "selected" : ""}>+25%</option>
                <option value="40" ${String(draft.takeProfitPct || "40") === "40" ? "selected" : ""}>+40%</option>
                <option value="60" ${String(draft.takeProfitPct || "") === "60" ? "selected" : ""}>+60%</option>
                <option value="100" ${String(draft.takeProfitPct || "") === "100" ? "selected" : ""}>+100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-launch-coin-tp-custom data-custom-for="launch-coin-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Fallback Timer
              ${fallbackTimerSelectHtml("launch-coin-delay", "data-launch-coin-delay", draft.sellDelay || "off")}
            </label>
            <label>
              Slippage
              <select data-launch-coin-slippage data-custom-select="launch-coin-slippage">
                <option value="300" ${String(draft.slippageBps || "300") === "300" ? "selected" : ""}>3%</option>
                <option value="400" ${String(draft.slippageBps || "") === "400" ? "selected" : ""}>4%</option>
                <option value="500" ${String(draft.slippageBps || "") === "500" ? "selected" : ""}>5%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-launch-coin-slippage-custom data-custom-for="launch-coin-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
            </label>
            <label class="full-span launch-inline-wallets">
              Wallets / Groups For Post-Launch Buy
              <span class="muted">Use these for this launch only, or pick a saved preset above.</span>
              <div class="wallet-checks preset-wallets">
                ${state.wallets.length ? walletChecksHtml("launch-coin", draft.walletIndexes || null) : `<p class="muted">Create or restore managed wallets first, or use Watch only.</p>`}
              </div>
            </label>
            ${walletGroupHtml("launch-coin", draft.walletGroup || "")}
          </div>
        </details>

        <div class="quick-grid launch-coin-actions">
          <button class="primary" type="button" data-launch-coin-submit>Launch on Pump</button>
          <button type="button" data-launch-coin-save>Save Launch Sheet</button>
          <button type="button" data-launch-coin-use-ca>Use Live CA</button>
          <a href="https://pump.fun/create" target="_blank" rel="noreferrer">Open Pump Create</a>
          <a href="https://marketplace.dexscreener.com/" target="_blank" rel="noreferrer">Pay Dex / Edit Metadata</a>
        </div>
        <p class="trade-status" data-launch-coin-status>${escapeHtml(state.launchCoinStatus || "Ready. Launch on Pump submits through the SlimeWire launch connector when enabled. The official Pump and Dex links remain available as fallback tools.")}</p>
      </article>

      <aside class="trade-side">
        <article>
          <h3>How It Works</h3>
          <p>SlimeWire sends the token details to the configured launch connector, waits for the returned CA, then can route that CA into your selected preset. If the connector is not enabled, save the sheet and use the official fallback links.</p>
        </article>
        <article>
          <h3>Credit Use</h3>
          <p>Saving a draft and opening Pump/Dex links does not use Helius or Jupiter credits. Credits are used later for wallet balance refreshes, quotes, buys, sells, bundles, and active exit monitoring.</p>
        </article>
        <article>
          <h3>Active Launch Watches</h3>
          ${launchWatchesHtml()}
        </article>
      </aside>
    </section>
  `;
}

function readLaunchCoinDraft() {
  const draft = state.launchCoinDraft || {};
  const imageFile = $("[data-launch-coin-image]")?.files?.[0];
  return {
    name: ($("[data-launch-coin-name]")?.value || "").trim(),
    symbol: ($("[data-launch-coin-symbol]")?.value || "").trim().replace(/^\$/, "").toUpperCase(),
    description: ($("[data-launch-coin-description]")?.value || "").trim(),
    imageName: imageFile?.name || draft.imageName || "",
    website: ($("[data-launch-coin-website]")?.value || "").trim(),
    x: ($("[data-launch-coin-x]")?.value || "").trim(),
    telegram: ($("[data-launch-coin-telegram]")?.value || "").trim(),
    tokenMint: ($("[data-launch-coin-ca]")?.value || "").trim(),
    action: $("[data-launch-coin-action]")?.value || "watch",
    tradePresetId: $("[data-launch-coin-trade-preset]")?.value || "",
    bundlePresetId: $("[data-launch-coin-bundle-preset]")?.value || "",
    amountSol: normalizedQuickBuyAmount($("[data-launch-coin-amount]")?.value || draft.amountSol || "0.1") || "0.1",
    sellPercent: $("[data-launch-coin-sell-percent]")?.value || draft.sellPercent || "100",
    walletIndexes: checkedWalletIndexes("launch-coin"),
    walletGroup: $("[data-launch-coin-group]")?.value?.trim() || "",
    stopLossPct: fieldValue("[data-launch-coin-sl]", "[data-launch-coin-sl-custom]", "8"),
    takeProfitPct: fieldValue("[data-launch-coin-tp]", "[data-launch-coin-tp-custom]", "40"),
    sellDelay: fieldValue("[data-launch-coin-delay]", "[data-launch-coin-delay-custom]", "off"),
    slippageBps: fieldValue("[data-launch-coin-slippage]", "[data-launch-coin-slippage-custom]", "300"),
    updatedAt: new Date().toISOString()
  };
}

function launchCoinActionLabel(action) {
  if (action === "bundle") return "Bundle";
  if (action === "launch-watch") return "Launch Snipe";
  if (action === "trade") return "Trade";
  return "Live Terminal";
}

function saveLaunchCoinDraft({ silent = false } = {}) {
  try {
    const draft = readLaunchCoinDraft();
    state.launchCoinDraft = draft;
    setStoredLaunchCoinDraft(draft);
    const label = draft.name || draft.symbol || "launch";
    state.launchCoinStatus = `Saved ${label}. Launch on Pump will use the SlimeWire launch connector when enabled; you can also paste a live CA to route into ${launchCoinActionLabel(draft.action)}.`;
    if (!silent) writeText($("[data-launch-coin-status]"), state.launchCoinStatus);
    return draft;
  } catch (error) {
    state.launchCoinStatus = error.message;
    writeText($("[data-launch-coin-status]"), error.message);
    throw error;
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Image is over 5MB. Use a smaller PNG, JPG, WEBP, or GIF."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.readAsDataURL(file);
  });
}

async function launchCoinImagePayload() {
  const imageFile = $("[data-launch-coin-image]")?.files?.[0];
  if (!imageFile) return {};
  return {
    imageName: imageFile.name,
    imageType: imageFile.type || "application/octet-stream",
    imageDataUrl: await readFileAsDataUrl(imageFile)
  };
}

function applyLaunchCoinMint(draft, tokenMint) {
  const normalizedMint = String(tokenMint || "").trim();
  state.launchCoinDraft = {
    ...(draft || {}),
    tokenMint: normalizedMint,
    updatedAt: new Date().toISOString()
  };
  setStoredLaunchCoinDraft(state.launchCoinDraft);
  state.terminalToken = normalizedMint;
  state.terminalAutoToken = normalizedMint;
  state.tradeToken = normalizedMint;
  state.bundleToken = normalizedMint;
  state.volumeToken = normalizedMint;
  state.smartChartToken = normalizedMint;
  if (draft?.tradePresetId) state.selectedTradePresetId = draft.tradePresetId;
  if (draft?.bundlePresetId) state.selectedBundlePresetId = draft.bundlePresetId;
  if (draft?.amountSol) state.quickBuyAmountOverride = normalizedQuickBuyAmount(draft.amountSol);
}

function launchCoinTradePresetFromDraft(draft = {}) {
  const saved = draft.tradePresetId ? presetById("trade", draft.tradePresetId) : null;
  const walletIndex = (draft.walletIndexes || [])[0] || saved?.walletIndex || saved?.walletIndexes?.[0] || "1";
  return {
    ...(saved || {}),
    walletIndex,
    amountSol: normalizedQuickBuyAmount(draft.amountSol || saved?.amountSol || "0.1") || "0.1",
    takeProfitPct: draft.takeProfitPct ?? saved?.takeProfitPct ?? "40",
    stopLossPct: draft.stopLossPct ?? saved?.stopLossPct ?? "8",
    sellDelay: draft.sellDelay || saved?.sellDelay || "off",
    sellPercent: draft.sellPercent || saved?.sellPercent || "100",
    slippageBps: draft.slippageBps || saved?.slippageBps || "300"
  };
}

function launchCoinBundlePresetFromDraft(draft = {}) {
  const saved = draft.bundlePresetId ? presetById("bundle", draft.bundlePresetId) : null;
  return {
    ...(saved || {}),
    walletIndexes: (draft.walletIndexes?.length ? draft.walletIndexes : saved?.walletIndexes) || [],
    walletGroup: draft.walletGroup || saved?.walletGroup || "",
    amountSol: normalizedQuickBuyAmount(draft.amountSol || saved?.amountSol || "0.1") || "0.1",
    takeProfitPct: draft.takeProfitPct ?? saved?.takeProfitPct ?? "60",
    stopLossPct: draft.stopLossPct ?? saved?.stopLossPct ?? "10",
    sellDelay: draft.sellDelay || saved?.sellDelay || "off",
    sellPercent: draft.sellPercent || saved?.sellPercent || "100",
    slippageBps: draft.slippageBps || saved?.slippageBps || "300"
  };
}

async function useLaunchCoinMint() {
  const draft = saveLaunchCoinDraft({ silent: true });
  const tokenMint = String(draft.tokenMint || "").trim();
  const status = $("[data-launch-coin-status]");
  if (!tokenMint || tokenMint.length < 32) {
    state.launchCoinStatus = "Paste the live token CA from Pump first. SlimeWire will not guess the CA.";
    writeText(status, state.launchCoinStatus);
    return;
  }

  applyLaunchCoinMint(draft, tokenMint);

  const nextTab = draft.action === "bundle"
    ? "bundle"
    : draft.action === "launch-watch"
      ? "launch"
      : draft.action === "trade"
        ? "trade"
        : "terminal";
  state.launchCoinStatus = `Loaded ${shortAddress(tokenMint)} into ${launchCoinActionLabel(draft.action)}. Review the selected preset before sending any trade.`;
  navigateTo("/terminal", nextTab);
  render({ force: true });
}

async function submitLaunchCoin() {
  const status = $("[data-launch-coin-status]");
  try {
    const draft = saveLaunchCoinDraft({ silent: true });
    if (!draft.name) throw new Error("Enter the token name before launching.");
    if (!draft.symbol) throw new Error("Enter the ticker before launching.");

    state.launchCoinStatus = "Submitting launch through SlimeWire...";
    writeText(status, state.launchCoinStatus);

    const imagePayload = await launchCoinImagePayload();
    const data = await api("/api/web/launch/coin", {
      method: "POST",
      body: JSON.stringify({
        ...draft,
        ...imagePayload
      })
    });

    const launch = data.launch || {};
    const tokenMint = String(launch.tokenMint || launch.mint || launch.ca || launch.contractAddress || "").trim();
    const signature = launch.signature ? ` Signature: ${shortAddress(launch.signature)}.` : "";

    if (!tokenMint) {
      state.launchCoinStatus = `Launch submitted, but the launch connector did not return a CA yet.${signature} Paste the CA above when it appears, then tap Use Live CA.`;
      writeText(status, state.launchCoinStatus);
      return;
    }

    applyLaunchCoinMint(draft, tokenMint);
    state.launchCoinStatus = `Launch returned ${shortAddress(tokenMint)}.${signature} Routing into ${launchCoinActionLabel(draft.action)}...`;
    writeText(status, state.launchCoinStatus);

    if (draft.action === "trade") {
      await quickPresetTrade(tokenMint, launchCoinTradePresetFromDraft(draft));
      return;
    }
    if (draft.action === "bundle") {
      await quickPresetBundle(tokenMint, launchCoinBundlePresetFromDraft(draft));
      return;
    }
    if (draft.action === "launch-watch") {
      state.activeTab = "launch";
      navigateTo("/terminal", "launch");
      render({ force: true });
      return;
    }

    navigateTo("/terminal/chart", "smartChart");
    render({ force: true });
  } catch (error) {
    state.launchCoinStatus = error.message || "Launch failed.";
    writeText(status, state.launchCoinStatus);
    setError(state.launchCoinStatus);
  }
}

function launchScanSeconds() {
  const first = state.launchWatches?.[0]?.scanIntervalMs;
  return first ? (first / 1000).toFixed(first % 1000 === 0 ? 0 : 1) : "1.5";
}

function launchWatchesHtml() {
  if (!state.launchWatches.length) return "<p>No active launch watches yet.</p>";
  return `
    <div class="mini-results">
      ${state.launchWatches.map((watch) => `
        <span>
          $${escapeHtml(watch.ticker)} - ${escapeHtml(watch.status)} - ${escapeHtml(watch.walletCount)} wallet(s)
          ${xShareButton(launchShareText(watch), "Share Watch")}
          ${watch.status === "launch_watch" ? `<button data-launch-cancel="${escapeHtml(watch.id)}">Cancel</button>` : ""}
        </span>
      `).join("")}
    </div>
  `;
}

function kolHtml() {
  const configured = state.kolScan?.configured !== false;
  const disabled = state.kolLoading ? "disabled" : "";
  return `
    <section class="section-actions mode-row">
      <button data-kol-mode="hot" data-active="${state.kolMode === "hot"}" ${disabled}>Hot Buys</button>
      <button data-kol-mode="top" data-active="${state.kolMode === "top"}" ${disabled}>Top KOLs</button>
      <button data-kol-mode="consistent" data-active="${state.kolMode === "consistent"}" ${disabled}>Consistent</button>
      <button data-kol-mode="fresh" data-active="${state.kolMode === "fresh"}" ${disabled}>Fresh</button>
      <button data-kol-mode="slimewire" data-active="${state.kolMode === "slimewire"}" ${disabled}>Top SlimeWire</button>
      <button data-kol-refresh ${disabled}>${state.kolLoading ? "Scanning..." : "Refresh"}</button>
    </section>
    <p class="scan-meta">${escapeHtml(kolModeDescription(state.kolMode))}</p>
    ${kolScanStatusHtml()}
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>KOL Copy Setup</h3>
            <p>Pick wallets and exits once, then buy a selected KOL position, send it to Trade/Bundle, or arm Copy Wallet for the next new buy.</p>
          </div>
        </div>
        ${state.wallets.length ? `
          <div class="wallet-checks">
            ${walletChecksHtml("kol")}
          </div>
          ${walletGroupHtml("kol")}
        ` : `
          <p class="trade-status">KOL viewing works now. Create, restore, or import a wallet before using Copy Plan to trade.</p>
          <button class="secondary" data-tab="wallets">Open Wallets</button>
        `}
        <div class="volume-grid">
          <label>
            Buy Per Wallet
            <input data-kol-amount type="number" min="0" step="0.01" value="0.1">
          </label>
          <label>
            Take Profit
            <select data-kol-tp data-custom-select="kol-tp">
              <option value="0">Off</option>
              <option value="15">+15%</option>
              <option value="25" selected>+25%</option>
              <option value="40">+40%</option>
              <option value="60">+60%</option>
              <option value="100">+100%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-tp-custom data-custom-for="kol-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
          </label>
          <label>
            Stop Loss
            <select data-kol-sl data-custom-select="kol-sl">
              <option value="0">Off</option>
              <option value="8" selected>-8%</option>
              <option value="10">-10%</option>
              <option value="15">-15%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-sl-custom data-custom-for="kol-sl" type="text" placeholder="Custom SL %" hidden>
          </label>
          <label>
            Fallback Sell
            ${fallbackTimerSelectHtml("kol-delay", "data-kol-delay", "5")}
          </label>
          <label>
            Repeat
            <select data-kol-loop data-custom-select="kol-loop">
              <option value="1" selected>1x</option>
              <option value="5">5x</option>
              <option value="10">10x</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-loop-custom data-custom-for="kol-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
          </label>
          <label>
            Repeat Wait
            ${repeatWaitSelectHtml("kol-loop-delay", "data-kol-loop-delay", "0")}
          </label>
          <label>
            Slippage
            <select data-kol-slippage data-custom-select="kol-slippage">
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-slippage-custom data-custom-for="kol-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
          </label>
        </div>
        ${walletExitTargetsHtml("kol")}
        <p class="trade-status" data-kol-status>${state.kolResult ? escapeHtml(state.kolResult.message || "KOL copy plan armed.") : configured ? "Ready. Tap Buy Position on a signal below, or Copy Wallet after scanning a public wallet." : "Paste a public wallet for a free holdings scan, or use the links on the right for outside KOL context."}</p>
        ${kolResultHtml()}
      </article>

      <aside class="trade-side">
        <article>
          <h3>Custom KOL Wallet</h3>
          <p>Paste any public Solana wallet to inspect current holdings, open an outside trader profile, or arm copy-watch from your selected wallets.</p>
          <label>
            Wallet Address
            <input data-kol-wallet type="text" placeholder="Paste KOL wallet" value="${escapeHtml(state.kolWallet || "")}">
          </label>
          <div class="card-actions">
            <button data-kol-wallet-scan ${disabled}>${state.kolLoading ? "Scanning..." : "Scan Wallet"}</button>
            ${state.kolWallet ? `<button class="primary" data-kol-copy-wallet="${escapeHtml(state.kolWallet)}" ${disabled}>Copy Wallet Next Buy</button>` : ""}
            ${state.kolWallet ? xShareButton(manualKolWatchShareText(state.kolWallet), "Share KOL") : ""}
          </div>
        </article>
        <article>
          <h3>KOL Tools</h3>
          <p>Open outside KOL dashboards for extra wallet context, then come back here to trade, bundle, or copy from your saved wallets.</p>
          <div class="card-actions">
            <a href="https://kolscan.io/trades" target="_blank" rel="noreferrer">Live Trader Feed</a>
            <a href="https://kolscan.io/leaderboard" target="_blank" rel="noreferrer">Trader Leaderboard</a>
          </div>
        </article>
      </aside>
    </section>
    ${state.kolScan?.kols?.length ? kolSummaryHtml() : ""}
    ${state.kolMode === "slimewire" && state.kolScan
      ? state.kolScan.kols?.length ? "" : emptyState("No SlimeWire traders yet", "Traders appear here only after they opt in from Profile and have site trade history.")
      : state.kolScan ? kolRowsHtml() : emptyState("No KOL scan loaded", "Pick a KOL mode or tap Refresh.")}
  `;
}

function kolScanStatusHtml() {
  const scan = state.kolScan || null;
  const modeLabel = kolModeLabel(state.kolMode);
  const status = state.kolLoading
    ? `Scanning ${modeLabel}`
    : scan ? `${modeLabel} loaded` : `Pick ${modeLabel} or tap Refresh`;
  const kolCount = Number(scan?.kolCount || scan?.kols?.length || 0);
  const signalCount = Number(scan?.rows?.length || 0);
  const updated = state.kolLastUpdatedAt ? formatDate(state.kolLastUpdatedAt) : "Not run";
  return `
    <div class="trade-status kol-status kol-status-grid">
      <span>${escapeHtml(status)}</span>
      <span>${escapeHtml(kolCount)} KOLs</span>
      <span>${escapeHtml(signalCount)} signals</span>
      <span>${escapeHtml(updated)}</span>
    </div>
  `;
}

function kolModeLabel(mode) {
  const map = {
    hot: "Hot Buys",
    top: "Top KOLs",
    consistent: "Consistent",
    fresh: "Fresh",
    slimewire: "Top SlimeWire Traders"
  };
  return map[mode] || map.hot;
}

function kolModeDescription(mode) {
  const map = {
    hot: "Recent high-performing KOLs and the strongest current positions they are holding.",
    top: "Best ranked KOL wallets by realized performance, then their highest-value current token positions.",
    consistent: "KOLs ranked by consistency/win rate from the available leaderboard, then filtered into cleaner copyable positions.",
    fresh: "KOL wallets with the newest activity first, useful when you want faster signal flow.",
    slimewire: "Opt-in SlimeWire users ranked by closed trades and recent activity."
  };
  return map[mode] || map.hot;
}

function kolResultHtml() {
  const row = state.kolResult;
  if (!row?.results?.length) return "";
  return `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>`;
}

function kolSummaryHtml() {
  const scan = state.kolScan || {};
  const kols = (scan.kols || []).filter((kol) => kol.wallet || kol.twitter);
  if (!kols.length || scan.configured === false) return "";
  return `
    <section class="kol-dashboard">
      <div class="trade-head">
        <div>
          <h3>${escapeHtml(scan.label || "KOL Tracker")}</h3>
          <p>${escapeHtml(`${kolModeLabel(state.kolMode)} with ${Number(scan.rows?.length || 0)} current token signal(s).`)}</p>
        </div>
        <span>${escapeHtml(scan.kolCount || kols.length)} tracked</span>
      </div>
      <div class="kol-grid">
        ${kols.slice(0, 12).map((kol, index) => `
          <article class="kol-profile">
            ${kolAvatarMarkup(kol)}
            <div class="pick-top">
              <span>${index + 1}</span>
              <h3>${escapeHtml(kol.name || kol.shortWallet || "KOL Wallet")}</h3>
              <em>${escapeHtml(kol.winRateLabel || "n/a")}</em>
            </div>
            <p>${kol.twitter ? `@${escapeHtml(kol.twitter)}` : escapeHtml(kol.shortWallet || kol.wallet || "")}</p>
            <dl>
              <div><dt>Realized</dt><dd>${escapeHtml(kol.realizedLabel || "n/a")}</dd></div>
              <div><dt>ROI</dt><dd>${escapeHtml(kol.roiLabel || "n/a")}</dd></div>
              <div><dt>Trades</dt><dd>${escapeHtml(kol.trades ?? "n/a")}</dd></div>
            </dl>
            <small>${escapeHtml(kol.source === "slimewire" ? `Tracking ${kol.trackedWalletMode === "manual" ? `${kol.trackedWalletCount || 0} wallet(s)` : "all wallets"}` : (kol.volumeLabel || "Volume n/a"))} | Last trade: ${escapeHtml(formatDate(kol.lastTradeAt))}</small>
            <div class="card-actions">
              ${kol.solscanUrl ? `<a href="${escapeHtml(kol.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>` : ""}
              ${kol.kolscanUrl || kol.wallet ? `<a href="${escapeHtml(kol.kolscanUrl || kolscanUrl(kol.wallet))}" target="_blank" rel="noreferrer">Trader Profile</a>` : ""}
              ${xShareButton(kolProfileShareText(kol), "Share Watch")}
              ${kol.wallet ? `<button data-kol-scan-wallet="${escapeHtml(kol.wallet)}">Scan Positions</button>` : ""}
              ${kol.wallet ? `<button data-kol-copy-wallet="${escapeHtml(kol.wallet)}">Copy Wallet</button>` : ""}
              ${kol.wallet ? `<button data-copy="${escapeHtml(kol.wallet)}">Copy Address</button>` : ""}
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function kolRowsHtml() {
  const scan = state.kolScan || {};
  if (scan.configured === false) {
    return emptyState("KOL Tracker is not connected yet", scan.message || "Use Scan Wallet for a public wallet, or try again later.");
  }
  if (!scan.rows?.length) {
    return emptyState(
      scan.kols?.length ? "No token signals on this refresh" : "No KOL signals found",
      scan.message || "Try Refresh or another mode."
    );
  }
  return tokenSignalRowsHtml(scan.rows.slice(0, 18), {
    context: "kol",
    primaryAction: "quickTrade",
    primaryActionLabel: "Trade",
    shareBuilder: kolShareText
  });
}

async function createWalletSet() {
  const labelInput = $("[data-wallet-label]");
  const countInput = $("[data-wallet-count-input]");
  const status = $("[data-create-wallet-status]");
  if (!labelInput || !countInput || !status) return;
  const buttons = [...document.querySelectorAll("[data-create-wallets]")];
  setError("");
  writeText(status, "Creating wallets...");
  buttons.forEach((button) => {
    button.disabled = true;
    writeText(button, "Creating...");
  });

  try {
    const count = Number.parseInt(countInput.value || "1", 10);
    if (!Number.isInteger(count) || count < 1 || count > 20) {
      throw new Error("Wallet count must be from 1 to 20.");
    }
    await ensureWebAccount(status, "Creating secure web profile for wallet backups...");
    const data = await api("/api/web/wallets/create", {
      method: "POST",
      body: JSON.stringify({
        label: labelInput.value.trim() || "Ogre Web",
        count
      })
    });
    const wallets = Array.isArray(data.wallets) ? data.wallets : [];
    if (!wallets.length) {
      throw new Error(data.message || "Wallet create did not return wallet data. Refresh and try again.");
    }
    state.downloads = data.downloads || null;
    if (data.downloads?.encryptedBackup?.text) {
      downloadText(data.downloads.encryptedBackup.filename, data.downloads.encryptedBackup.text);
    }
    if (data.downloads?.recoveryKeys?.text) {
      downloadText(data.downloads.recoveryKeys.filename, data.downloads.recoveryKeys.text);
    }
    writeText(status, data.downloads
      ? `Created ${wallets.length} wallet(s). Backup downloads started.`
      : `Created ${wallets.length} wallet(s). Use Download Backup before funding.`);
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "wallets";
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      writeText(button, "Create Wallets");
    });
  }
}

async function restoreWalletBackup() {
  const textarea = $("[data-restore-text]");
  const status = $("[data-restore-status]");
  if (!textarea || !status) return;
  const backupText = textarea.value.trim();
  if (!backupText) {
    writeText(status, "Choose a backup file or paste backup text first.");
    return;
  }

  writeText(status, "Restoring wallets...");
  try {
    await ensureWebAccount(status, "Creating secure web profile for restored wallets...");
    const data = await api("/api/web/wallets/restore", {
      method: "POST",
      body: JSON.stringify({ backupText })
    });
    state.restoreResult = data.restore;
    if (data.restore?.downloads) {
      state.downloads = data.restore.downloads;
      if (data.restore.downloads.encryptedBackup) {
        downloadText(data.restore.downloads.encryptedBackup.filename, data.restore.downloads.encryptedBackup.text);
      }
      if (data.restore.downloads.recoveryKeys) {
        downloadText(data.restore.downloads.recoveryKeys.filename, data.restore.downloads.recoveryKeys.text);
      }
    }
    textarea.value = "";
    writeText(status, data.restore?.message || "Restore complete.");
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "wallets";
    render();
  } catch (error) {
    writeText(status, error.message);
  }
}

async function exportWalletBackup() {
  const status = $("[data-export-status]");
  if (!status) return;

  writeText(status, "Building backup files...");
  try {
    await ensureWebAccount(status, "Opening secure web profile...");
    const data = await api("/api/web/wallets/export", {
      method: "POST",
      body: JSON.stringify({})
    });
    state.backupResult = data.backup;
    if (data.backup?.downloads) {
      state.downloads = data.backup.downloads;
      if (data.backup.downloads.encryptedBackup) {
        downloadText(data.backup.downloads.encryptedBackup.filename, data.backup.downloads.encryptedBackup.text);
      }
      if (data.backup.downloads.recoveryKeys) {
        downloadText(data.backup.downloads.recoveryKeys.filename, data.backup.downloads.recoveryKeys.text);
      }
    }
    writeText(status, data.backup?.message || "Backup ready.");
    render();
  } catch (error) {
    writeText(status, error.message);
  }
}

async function importWallet() {
  const labelInput = $("[data-import-label]");
  const secretInput = $("[data-import-secret]");
  const status = $("[data-import-status]");
  if (!labelInput || !secretInput || !status) return;
  const label = labelInput.value.trim() || "Imported Wallet";
  const secret = secretInput.value.trim();
  if (!secret) {
    writeText(status, "Paste a private key or JSON secret-key array first.");
    return;
  }

  writeText(status, "Importing wallet...");
  try {
    await ensureWebAccount(status, "Creating secure web profile for imported wallet...");
    const data = await api("/api/web/wallets/import", {
      method: "POST",
      body: JSON.stringify({ label, secret })
    });
    state.importResult = data.imported;
    if (data.imported?.downloads) {
      state.downloads = data.imported.downloads;
      if (data.imported.downloads.encryptedBackup) {
        downloadText(data.imported.downloads.encryptedBackup.filename, data.imported.downloads.encryptedBackup.text);
      }
      if (data.imported.downloads.recoveryKeys) {
        downloadText(data.imported.downloads.recoveryKeys.filename, data.imported.downloads.recoveryKeys.text);
      }
    }
    secretInput.value = "";
    writeText(status, data.imported?.message || "Import complete.");
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "wallets";
    render();
  } catch (error) {
    writeText(status, error.message);
  }
}

async function removeManagedWallet(walletIndex, walletLabel = "this wallet") {
  const label = String(walletLabel || `Wallet ${walletIndex}`);
  const firstConfirm = window.confirm(`Remove ${label} from this web account?\n\nA backup file and recovery key file will download first. This does not move any SOL or tokens.`);
  if (!firstConfirm) return;
  const finalConfirm = window.confirm(`Final confirmation: remove ${label} from the saved wallet list?\n\nYou can restore it later only from the backup/recovery file.`);
  if (!finalConfirm) return;

  const status = $("[data-wallet-remove-status]");
  state.walletRemoveStatus = `Backing up ${label} before removal...`;
  writeText(status, state.walletRemoveStatus);
  setError("");

  try {
    const data = await api("/api/web/wallets/remove", {
      method: "POST",
      body: JSON.stringify({ walletIndexes: [String(walletIndex)] })
    });
    const result = data.removed || {};
    state.downloads = result.downloads || state.downloads;
    if (result.downloads?.encryptedBackup?.text) {
      downloadText(result.downloads.encryptedBackup.filename, result.downloads.encryptedBackup.text);
    }
    if (result.downloads?.recoveryKeys?.text) {
      downloadText(result.downloads.recoveryKeys.filename, result.downloads.recoveryKeys.text);
    }
    state.walletRemoveStatus = result.message || `Removed ${label}.`;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "wallets";
    render();
  } catch (error) {
    state.walletRemoveStatus = error.message;
    writeText(status, error.message);
    setError(error.message);
  }
}

async function readRestoreFile(input) {
  const status = $("[data-restore-status]");
  const textarea = $("[data-restore-text]");
  const file = input?.files?.[0];
  if (!file || !textarea) return;
  writeText(status, "Reading backup file...");
  try {
    textarea.value = await file.text();
    writeText(status, "Backup loaded. Tap Restore Wallets.");
  } catch (error) {
    writeText(status, `Could not read file: ${error.message}`);
  }
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function connectXAccount() {
  const input = $("[data-x-handle]");
  const status = $("[data-x-status]");
  const handle = cleanXHandle(input?.value || "");
  if (!handle) {
    writeText(status, "Enter a valid X handle first.");
    return;
  }
  const openedWindow = window.open(xProfileUrl(handle), "_blank", "noopener,noreferrer");

  try {
    writeText(status, openedWindow ? `Opening X and saving @${handle}...` : `Saving @${handle}. Allow popups if X did not open.`);
    await ensureWebAccount(status, "Creating secure web profile for X sharing...");
    const data = await api("/api/web/profile/x", {
      method: "POST",
      body: JSON.stringify({ xHandle: handle })
    });
    applyUserFromApi(data.user || { ...state.user, xHandle: data.profile?.xHandle || handle });
    setStoredXHandle(state.xHandle);
    writeText(status, `Connected @${state.xHandle}. Share buttons now open X posts with SlimeWire tagged.`);
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

function openXLoginOrProfile() {
  const status = $("[data-x-status]");
  const inputHandle = cleanXHandle($("[data-x-handle]")?.value || state.xHandle || "");
  const url = xProfileUrl(inputHandle || state.xHandle);
  window.open(url, "_blank", "noopener,noreferrer");
  writeText(status, inputHandle
    ? `Opened X for @${inputHandle}. Tap Connect X after checking the handle.`
    : "Opened X login. Add your handle here after signing in.");
}

async function disconnectXAccount() {
  const status = $("[data-x-status]");
  const input = $("[data-x-handle]");
  try {
    if (!state.user || !state.token) {
      state.xHandle = "";
      if (input) input.value = "";
      clearStoredXHandle();
      writeText(status, "X unlinked. Enter a new handle any time and tap Save X Handle.");
      render();
      return;
    }
    const data = await api("/api/web/profile/x", {
      method: "POST",
      body: JSON.stringify({ clear: true })
    });
    applyUserFromApi(data.user || { ...state.user, xHandle: "" });
    state.xHandle = "";
    if (input) input.value = "";
    clearStoredXHandle();
    writeText(status, "X unlinked. Enter a new handle any time and tap Save X Handle.");
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function updateProfileAvatar(payload, statusText = "Saving PFP...") {
  const status = $("[data-avatar-status]");
  writeText(status, statusText);
  try {
    await ensureWebAccount(status, "Creating secure web profile for PFP...");
    const data = await api("/api/web/profile/avatar", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    applyUserFromApi(data.user || {
      ...state.user,
      avatar: data.profile?.avatarDataUrl || data.profile?.avatarUrl || "",
      avatarSource: data.profile?.avatarSource || "",
      avatarUpdatedAt: data.profile?.avatarUpdatedAt || ""
    });
    writeText(status, state.user.avatar ? "PFP saved." : "PFP removed.");
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function uploadProfileAvatar(input) {
  const status = $("[data-avatar-status]");
  const file = input?.files?.[0];
  if (!file) return;
  if (!/^image\/(png|jpe?g|webp)$/i.test(file.type)) {
    writeText(status, "Use a PNG, JPG, or WebP image.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    writeText(status, "Use an image under 5 MB.");
    return;
  }
  try {
    writeText(status, "Compressing PFP...");
    const avatarDataUrl = await imageFileToAvatarDataUrl(file);
    await updateProfileAvatar({ avatarDataUrl }, "Saving compressed PFP...");
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  } finally {
    input.value = "";
  }
}

function imageFileToAvatarDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not load that image."));
      img.onload = () => {
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("This browser cannot resize images."));
          return;
        }
        const scale = Math.max(size / img.width, size / img.height);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const x = Math.round((size - width) / 2);
        const y = Math.round((size - height) / 2);
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, x, y, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
        if (dataUrl.length > 220_000) {
          reject(new Error("Compressed PFP is still too large. Try a simpler image."));
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result || "");
    };
    reader.readAsDataURL(file);
  });
}

async function presetAvatarToDataUrl(url) {
  const assetBase = document.querySelector('script[src*="app.js"]')?.src || document.baseURI || window.location.href;
  const absoluteUrl = new URL(String(url || ""), assetBase).toString();
  const response = await fetch(absoluteUrl, { cache: "force-cache" });
  if (!response.ok) throw new Error("Could not load that preset PFP.");
  const blob = await response.blob();
  return imageFileToAvatarDataUrl(blob);
}

async function useXProfileAvatar() {
  const url = xAvatarUrl(state.xHandle);
  if (!url) {
    const status = $("[data-avatar-status]");
    writeText(status, "Connect an X handle first.");
    return;
  }
  await updateProfileAvatar({ avatarUrl: url, avatarSource: "x" }, "Saving X PFP...");
}

async function connectBrowserWallet(providerId) {
  const status = walletConnectStatusElement();
  const provider = walletProviderById(providerId);
  if (!provider) {
    writeText(status, `${walletProviderLabel(providerId)} is not detected in this browser. Install/open the wallet extension, then refresh.`);
    return;
  }

  try {
    const existingWallet = state.user?.connectedWallet?.publicKey || state.connectedWalletBalance?.publicKey || "";
    if (existingWallet) {
      const shouldReconnect = window.confirm(
        `Reconnect or switch wallet?\n\nCurrent wallet: ${shortAddress(existingWallet)}\n\nYour wallet extension will open so you can approve the wallet to use on Live Terminal.`
      );
      if (!shouldReconnect) {
        writeText(status, "Wallet connection unchanged.");
        navigateTo("/terminal", "terminal");
        return;
      }
      try {
        await Promise.resolve(provider.disconnect?.());
      } catch {
        // Some providers either do not expose disconnect or reject until the extension is focused.
      }
    }
    writeText(status, `Opening ${walletProviderLabel(providerId, provider)}...`);
    const result = await provider.connect?.({ onlyIfTrusted: false });
    const publicKey = result?.publicKey || provider.publicKey;
    const publicKeyText = publicKey?.toBase58?.() || publicKey?.toString?.() || "";
    if (!publicKeyText) throw new Error("Wallet connected, but no public address was returned.");
    await ensureWebAccount(status, "Creating secure web profile for connected wallet...");
    const data = await api("/api/web/profile/connected-wallet", {
      method: "POST",
      body: JSON.stringify({
        publicKey: publicKeyText,
        provider: walletProviderLabel(providerId, provider)
      })
    });
    applyUserFromApi(data.user || {
      ...state.user,
      connectedWallet: data.profile?.connectedWallet || null
    });
    state.connectedWalletBalance = {
      publicKey: publicKeyText,
      shortPublicKey: shortAddress(publicKeyText),
      provider: walletProviderLabel(providerId, provider),
      tokens: []
    };
    writeText(status, `Connected ${shortAddress(publicKeyText)}. Opening Live Terminal...`);
    navigateTo("/terminal", "terminal");
    await Promise.allSettled([
      loadAll(),
      refreshLivePairBuckets({ silent: true, force: true }),
      loadKolScan(state.kolMode, "", { silent: true })
    ]);
    render({ force: true });
  } catch (error) {
    writeText(status, error.message || "Wallet connection was cancelled.");
  }
}

async function disconnectBrowserWallet() {
  const status = walletConnectStatusElement();
  if (!state.user || !state.token) {
    state.connectedWalletBalance = null;
    writeText(status, "Connected wallet removed.");
    render();
    return;
  }
  try {
    const providerName = state.user?.connectedWallet?.provider || "";
    const provider = providerName.toLowerCase().includes("phantom")
      ? walletProviderById("phantom")
      : providerName.toLowerCase().includes("solflare")
        ? walletProviderById("solflare")
        : providerName.toLowerCase().includes("backpack")
          ? walletProviderById("backpack")
          : walletProviderById("solana");
    await provider?.disconnect?.();
  } catch {
    // Some wallet extensions do not expose disconnect. Clearing the saved public address is enough.
  }

  try {
    const data = await api("/api/web/profile/connected-wallet", {
      method: "POST",
      body: JSON.stringify({ clear: true })
    });
    applyUserFromApi(data.user || {
      ...state.user,
      connectedWallet: null
    });
    state.connectedWalletBalance = null;
    writeText(status, "Connected wallet removed.");
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function saveLoginCredentials() {
  const usernameInput = $("[data-profile-username]");
  const passwordInput = $("[data-profile-password]");
  const status = $("[data-login-security-status]");
  const username = String(usernameInput?.value || "").trim();
  const password = String(passwordInput?.value || "");
  if (!username || !password) {
    writeText(status, "Enter a username and password first.");
    return;
  }

  try {
    await ensureWebAccount(status, "Creating secure web profile...");
    writeText(status, "Saving login...");
    const data = await api("/api/web/profile/credentials", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    applyUserFromApi(data.user || { ...state.user, username, hasPasswordLogin: true });
    if (passwordInput) passwordInput.value = "";
    writeText(status, "Saved. You can now log back in with this username and password.");
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

function cleanXHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@+/, "")
    .replace(/[^a-z0-9_]/gi, "")
    .slice(0, 15);
}

function openXShare(rawText) {
  const text = shareTextWithSite(rawText);
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareSiteUrl)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function shareManualWatch(type) {
  const isKol = type === "kol";
  const input = isKol ? $("[data-share-watch-kol]") : $("[data-share-watch-token]");
  const status = $("[data-share-watch-status]");
  const value = input?.value?.trim() || "";
  if (!value) {
    writeText(status, isKol ? "Enter a KOL handle or wallet first." : "Enter a coin, ticker, or CA first.");
    return;
  }
  openXShare(isKol ? manualKolWatchShareText(value) : manualCoinWatchShareText(value));
  writeText(status, isKol ? "KOL watch post opened in X." : "Coin watch post opened in X.");
}

async function fetchPnlCardBlob(tokenMint) {
  const headers = {};
  if (state.token) headers.Authorization = `Bearer ${state.token}`;
  const response = await fetchWithTimeout(apiUrl(`/api/web/pnl/card?tokenMint=${encodeURIComponent(tokenMint)}`), {
    headers,
    cache: "no-store"
  }, 30_000);
  if (!response.ok) {
    const data = await readApiJson(response);
    throw new Error(data.message || data.error || `Could not build PnL card (${response.status}).`);
  }
  return {
    blob: await response.blob(),
    filename: response.headers.get("x-ogre-filename") || `pnl-card-${shortAddress(tokenMint)}.png`
  };
}

async function downloadPnlCard(tokenMint) {
  const { blob, filename } = await fetchPnlCardBlob(tokenMint);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

async function sharePnlCard(tokenMint, shareText) {
  try {
    const { blob, filename } = await fetchPnlCardBlob(tokenMint);
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "SlimeWire PnL Card",
        text: shareTextWithSite(shareText),
        url: shareSiteUrl,
        files: [file]
      });
      return;
    }
    await downloadPnlCard(tokenMint);
    openXShare(`${shareText} PnL card downloaded and ready to attach.`);
  } catch (error) {
    setError(error.message);
  }
}

function readTradeForm() {
  const walletIndex = $("[data-trade-wallet]")?.value || "";
  const tokenMint = $("[data-trade-token]")?.value?.trim() || "";
  const slippageBps = fieldValue("[data-trade-slippage]", "[data-trade-slippage-custom]", "400");
  if (!walletIndex) throw new Error("Choose a wallet first.");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  state.tradeToken = tokenMint;
  return { walletIndex, tokenMint, slippageBps };
}

function isEnabledTradeTarget(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return Boolean(normalized) && !["0", "off", "none", "no", "disabled"].includes(normalized);
}

function normalizeTimerSellSettings(sellDelay, sellPercent) {
  const normalizedPercent = String(sellPercent || "").trim().toLowerCase();
  if (["0", "off", "none", "no", "disabled"].includes(normalizedPercent)) {
    return { sellDelay: "off", sellPercent: "100" };
  }
  return { sellDelay, sellPercent };
}

function readSingleTradeAutoExit() {
  const takeProfitPct = fieldValue("[data-trade-auto-tp]", "[data-trade-auto-tp-custom]", "0");
  const stopLossPct = fieldValue("[data-trade-auto-sl]", "[data-trade-auto-sl-custom]", "0");
  let sellDelay = fieldValue("[data-trade-auto-delay]", "[data-trade-auto-delay-custom]", "off");
  let sellPercent = fieldValue("[data-trade-auto-sell-percent]", "[data-trade-auto-sell-percent-custom]", "100");
  ({ sellDelay, sellPercent } = normalizeTimerSellSettings(sellDelay, sellPercent));
  const enabled = isEnabledTradeTarget(takeProfitPct)
    || isEnabledTradeTarget(stopLossPct)
    || isEnabledTradeTarget(sellDelay);
  return { enabled, takeProfitPct, stopLossPct, sellDelay, sellPercent };
}

function setTradeStatus(message) {
  const status = $("[data-trade-status]");
  writeText(status, message);
}

async function executeWebBuy(amountSol, amountMode = "fixed") {
  try {
    const form = readTradeForm();
    const payload = {
      tokenMint: form.tokenMint,
      walletIndex: form.walletIndex,
      slippageBps: form.slippageBps
    };
    if (amountMode === "max") {
      payload.amountMode = "max";
    } else {
      const value = Number(amountSol);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a buy amount greater than zero.");
      payload.amountSol = String(value);
    }

    const autoExit = readSingleTradeAutoExit();
    if (autoExit.enabled) {
      Object.assign(payload, {
        autoExit: true,
        takeProfitPct: autoExit.takeProfitPct,
        stopLossPct: autoExit.stopLossPct,
        sellDelay: autoExit.sellDelay,
        sellPercent: autoExit.sellPercent
      });
    }

    setTradeStatus(autoExit.enabled ? "Sending buy and arming auto-exit..." : "Sending buy...");
    const data = await api("/api/web/trade/buy", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.tradeResult = data.trade;
    if (data.trade?.autoExitPlan) {
      state.tradePlanResult = data.trade.autoExitPlan;
    }
    await refreshAfterTrade(data.trade?.signature);
    state.activeTab = "trade";
    render();
  } catch (error) {
    setTradeStatus(error.message);
  }
}

async function executeWebSell(percent) {
  try {
    const form = readTradeForm();
    const value = Number.parseInt(percent, 10);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new Error("Sell percent must be from 1 to 100.");
    }

    setTradeStatus("Sending sell...");
    const data = await api("/api/web/trade/sell", {
      method: "POST",
      body: JSON.stringify({
        tokenMint: form.tokenMint,
        walletIndex: form.walletIndex,
        slippageBps: form.slippageBps,
        percent: value
      })
    });
    state.tradeResult = data.trade;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "trade";
    render();
  } catch (error) {
    setTradeStatus(error.message);
  }
}

function readTradePlanForm() {
  const walletIndexes = checkedWalletIndexes("trade-plan");
  const walletGroup = $("[data-trade-plan-group]")?.value?.trim() || "";
  const tokenMint = $("[data-trade-token]")?.value?.trim() || "";
  const amountSol = fieldValue("[data-trade-plan-amount]", "[data-trade-plan-amount-custom]", "0.1");
  const takeProfitPct = fieldValue("[data-trade-plan-tp]", "[data-trade-plan-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-trade-plan-sl]", "[data-trade-plan-sl-custom]", "8");
  let sellDelay = fieldValue("[data-trade-plan-delay]", "[data-trade-plan-delay-custom]", "5");
  let sellPercent = fieldValue("[data-trade-plan-sell-percent]", "[data-trade-plan-sell-percent-custom]", "100");
  ({ sellDelay, sellPercent } = normalizeTimerSellSettings(sellDelay, sellPercent));
  const slippageBps = fieldValue("[data-trade-plan-slippage]", "[data-trade-plan-slippage-custom]", "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  state.tradeToken = tokenMint;
  state.volumeToken = tokenMint;
  state.bundleToken = tokenMint;
  return {
    walletIndexes,
    walletGroup,
    tokenMint,
    amountSol,
    sellDelay,
    takeProfitPct,
    stopLossPct,
    sellPercent,
    loopCount: "1",
    loopDelay: "0",
    slippageBps,
    ...readWalletExitTargets("trade-plan")
  };
}

async function createTradePlan() {
  try {
    const payload = readTradePlanForm();
    setTradeStatus("Buying and arming managed exit...");
    const data = await api("/api/web/trade/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.tradePlanResult = data.plan;
    state.tradeResult = null;
    await refreshAfterTrade(data.trade?.signature);
    state.activeTab = "trade";
    render();
  } catch (error) {
    setTradeStatus(error.message);
  }
}

function readVolumeForm() {
  const walletIndexes = checkedWalletIndexes("volume");
  const walletGroup = $("[data-volume-group]")?.value?.trim() || "";
  const tokenMint = $("[data-volume-token]")?.value?.trim() || "";
  const amountSol = $("[data-volume-amount]")?.value || "";
  let sellDelay = fieldValue("[data-volume-delay]", "[data-volume-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-volume-tp]", "[data-volume-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-volume-sl]", "[data-volume-sl-custom]", "8");
  const loopCount = fieldValue("[data-volume-loop]", "[data-volume-loop-custom]", "1");
  const loopDelay = fieldValue("[data-volume-loop-delay]", "[data-volume-loop-delay-custom]", "0");
  let sellPercent = fieldValue("[data-volume-sell-percent]", "[data-volume-sell-percent-custom]", "100");
  ({ sellDelay, sellPercent } = normalizeTimerSellSettings(sellDelay, sellPercent));
  const slippageBps = fieldValue("[data-volume-slippage]", "[data-volume-slippage-custom]", "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  state.volumeToken = tokenMint;
  return { walletIndexes, walletGroup, tokenMint, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, loopDelay, sellPercent, slippageBps, ...readWalletExitTargets("volume") };
}

function setVolumeStatus(message) {
  const status = $("[data-volume-status]");
  writeText(status, message);
}

async function createVolumePlan() {
  try {
    const payload = readVolumeForm();
    setVolumeStatus("Buying and arming plan...");
    const data = await api("/api/web/volume/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.volumeResult = data.plan;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "volume";
    render();
  } catch (error) {
    setVolumeStatus(error.message);
  }
}

function readSniperEntryForm(tokenMint) {
  const walletIndexes = checkedWalletIndexes("sniper");
  const walletGroup = $("[data-sniper-group]")?.value?.trim() || "";
  const amountSol = $("[data-sniper-amount]")?.value || "";
  const sellDelay = fieldValue("[data-sniper-delay]", "[data-sniper-delay-custom]", state.scanMode === "pumpsnipe" ? "3" : "5");
  const takeProfitPct = fieldValue("[data-sniper-tp]", "[data-sniper-tp-custom]", state.scanMode === "pumpsnipe" ? "40" : "25");
  const stopLossPct = fieldValue("[data-sniper-sl]", "[data-sniper-sl-custom]", "8");
  const loopCount = fieldValue("[data-sniper-loop]", "[data-sniper-loop-custom]", "1");
  const loopDelay = fieldValue("[data-sniper-loop-delay]", "[data-sniper-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-sniper-slippage]", "[data-sniper-slippage-custom]", state.scanMode === "pumpsnipe" ? "300" : "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Pick a token first.");
  state.tradeToken = tokenMint;
  state.volumeToken = tokenMint;
  state.bundleToken = tokenMint;
  return {
    mode: state.scanMode,
    tokenMint,
    walletIndexes,
    walletGroup,
    amountSol,
    sellDelay,
    takeProfitPct,
    stopLossPct,
    slippageBps,
    loopCount,
    loopDelay,
    ...readWalletExitTargets("sniper")
  };
}

function setSniperStatus(message) {
  const status = $("[data-sniper-status]");
  writeText(status, message);
}

async function createSniperEntry(tokenMint) {
  try {
    const payload = readSniperEntryForm(tokenMint);
    setSniperStatus("Buying and arming exits...");
    const data = await api("/api/web/sniper/entry", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.sniperResult = data.plan;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "sniper";
    render();
  } catch (error) {
    setSniperStatus(error.message);
  }
}

function setKolStatus(message) {
  const status = $("[data-kol-status]");
  writeText(status, message);
}

function readKolPlanForm(tokenMint) {
  const walletIndexes = checkedWalletIndexes("kol");
  const walletGroup = $("[data-kol-group]")?.value?.trim() || "";
  const amountSol = $("[data-kol-amount]")?.value || "";
  const sellDelay = fieldValue("[data-kol-delay]", "[data-kol-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-kol-tp]", "[data-kol-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-kol-sl]", "[data-kol-sl-custom]", "8");
  const loopCount = fieldValue("[data-kol-loop]", "[data-kol-loop-custom]", "1");
  const loopDelay = fieldValue("[data-kol-loop-delay]", "[data-kol-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-kol-slippage]", "[data-kol-slippage-custom]", "400");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!tokenMint) throw new Error("Pick a KOL signal first.");
  state.tradeToken = tokenMint;
  state.volumeToken = tokenMint;
  state.bundleToken = tokenMint;
  return { tokenMint, walletIndexes, walletGroup, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, loopDelay, sellPercent: "100", slippageBps, ...readWalletExitTargets("kol") };
}

function readKolWalletCopyForm(copyWallet) {
  const walletIndexes = checkedWalletIndexes("kol");
  const walletGroup = $("[data-kol-group]")?.value?.trim() || "";
  const amountSol = $("[data-kol-amount]")?.value || "";
  const sellDelay = fieldValue("[data-kol-delay]", "[data-kol-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-kol-tp]", "[data-kol-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-kol-sl]", "[data-kol-sl-custom]", "8");
  const loopCount = fieldValue("[data-kol-loop]", "[data-kol-loop-custom]", "1");
  const loopDelay = fieldValue("[data-kol-loop-delay]", "[data-kol-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-kol-slippage]", "[data-kol-slippage-custom]", "400");
  const wallet = String(copyWallet || state.kolWallet || $("[data-kol-wallet]")?.value || "").trim();
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  if (!wallet) throw new Error("Paste or choose a KOL wallet first.");
  return { copyWallet: wallet, walletIndexes, walletGroup, amountSol, sellDelay, takeProfitPct, stopLossPct, loopCount, loopDelay, sellPercent: "100", slippageBps, ...readWalletExitTargets("kol") };
}

async function createKolCopyPlan(tokenMint) {
  try {
    const payload = readKolPlanForm(tokenMint);
    setKolStatus("Buying and arming KOL copy plan...");
    const data = await api("/api/web/kol/entry", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.kolResult = data.plan;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "kol";
    render();
  } catch (error) {
    setKolStatus(error.message);
  }
}

async function createKolCopyWallet(copyWallet) {
  try {
    const payload = readKolWalletCopyForm(copyWallet);
    setKolStatus("Arming Copy Wallet watch...");
    const data = await api("/api/web/kol/copy-wallet", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.kolResult = data.plan;
    state.kolWallet = payload.copyWallet;
    state.activeTab = "kol";
    render();
  } catch (error) {
    setKolStatus(error.message);
  }
}

function checkedWalletIndexes(prefix) {
  return [...document.querySelectorAll(`[data-${prefix}-wallet]:checked`)].map((input) => input.value);
}

function setBundleStatus(message) {
  const status = $("[data-bundle-status]");
  writeText(status, message);
}

function readBundleForm() {
  const tokenMint = $("[data-bundle-token]")?.value?.trim() || "";
  const walletIndexes = checkedWalletIndexes("bundle");
  const walletGroup = $("[data-bundle-group]")?.value?.trim() || "";
  const amountSol = $("[data-bundle-amount]")?.value || "";
  const percent = fieldValue("[data-bundle-percent]", "[data-bundle-percent-custom]", "100");
  const slippageBps = fieldValue("[data-bundle-slippage]", "[data-bundle-slippage-custom]", "400");
  if (!tokenMint) throw new Error("Paste a token CA first.");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  state.bundleToken = tokenMint;
  return { tokenMint, walletIndexes, walletGroup, amountSol, percent, slippageBps };
}

function readBundlePlanForm() {
  const payload = readBundleForm();
  let sellDelay = fieldValue("[data-bundle-plan-delay]", "[data-bundle-plan-delay-custom]", "5");
  let sellPercent = fieldValue("[data-bundle-plan-sell-percent]", "[data-bundle-plan-sell-percent-custom]", "100");
  ({ sellDelay, sellPercent } = normalizeTimerSellSettings(sellDelay, sellPercent));
  return {
    ...payload,
    sellDelay,
    takeProfitPct: fieldValue("[data-bundle-plan-tp]", "[data-bundle-plan-tp-custom]", "60"),
    stopLossPct: fieldValue("[data-bundle-plan-sl]", "[data-bundle-plan-sl-custom]", "10"),
    loopCount: fieldValue("[data-bundle-plan-loop]", "[data-bundle-plan-loop-custom]", "1"),
    loopDelay: fieldValue("[data-bundle-plan-loop-delay]", "[data-bundle-plan-loop-delay-custom]", "0"),
    sellPercent,
    ...readWalletExitTargets("bundle-plan")
  };
}

async function executeBundle(action) {
  try {
    const payload = readBundleForm();
    setBundleStatus(action === "buy" ? "Sending bundle buy..." : "Sending bundle sell...");
    const data = await api(`/api/web/bundle/${action}`, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.bundleResult = data.bundle;
    await refreshAfterTrade(firstResultSignature(data.bundle));
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setBundleStatus(error.message);
  }
}

async function executeBundlePlan() {
  try {
    const payload = readBundlePlanForm();
    setBundleStatus("Buying and arming bundle exits...");
    const data = await api("/api/web/bundle/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.bundleResult = data.plan;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setBundleStatus(error.message);
  }
}

function presetById(kind, id) {
  return (state.presets?.[kind] || []).find((preset) => preset.id === id) || null;
}

function ensureSelectedPresetsStillExist() {
  if (state.selectedTradePresetId === "custom" || (state.selectedTradePresetId && !presetById("trade", state.selectedTradePresetId))) {
    state.selectedTradePresetId = "";
  }
  if (state.selectedBundlePresetId === "custom" || (state.selectedBundlePresetId && !presetById("bundle", state.selectedBundlePresetId))) {
    state.selectedBundlePresetId = "";
  }
  if (state.editingTradePresetId && !presetById("trade", state.editingTradePresetId)) {
    state.editingTradePresetId = "";
  }
  if (state.editingBundlePresetId && !presetById("bundle", state.editingBundlePresetId)) {
    state.editingBundlePresetId = "";
  }
}

function openManualTradeForToken(tokenMint, tab = "trade", message = "") {
  if (tab === "bundle") {
    state.bundleToken = tokenMint;
  } else {
    state.tradeToken = tokenMint;
  }
  state.activeTab = tab;
  if (message) setError(message);
  window.history.pushState({}, "", "/terminal");
  render({ force: true });
}

async function quickPresetTrade(tokenMint, presetOverride = null) {
  const preset = presetOverride || presetById("trade", state.selectedTradePresetId);
  if (!preset) {
    openManualTradeForToken(tokenMint, "trade", "No fast trade preset selected. Review the manual Trade form, then buy or sell.");
    return;
  }
  try {
    await ensureWebAccount(null, "Opening secure web profile...");
    const walletIndex = preset.walletIndex || (preset.walletIndexes || [])[0] || "1";
    if (!state.wallets.some((wallet) => String(wallet.index) === String(walletIndex))) {
      throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");
    }
    const amountSol = presetOverride ? normalizedQuickBuyAmount(preset.amountSol) : activeQuickBuyAmount(preset);
    if (!amountSol) throw new Error("Set a quick buy amount first.");
    const payload = {
      tokenMint,
      walletIndex,
      amountSol,
      slippageBps: preset.slippageBps,
      autoExit: true,
      takeProfitPct: preset.takeProfitPct,
      stopLossPct: preset.stopLossPct,
      sellDelay: preset.sellDelay || "off",
      sellPercent: preset.sellPercent || "100"
    };
    setError("");
    const data = await api("/api/web/trade/buy", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.tradeResult = data.trade;
    if (data.trade?.autoExitPlan) state.tradePlanResult = data.trade.autoExitPlan;
    state.tradeToken = tokenMint;
    await refreshAfterTrade(data.trade?.signature);
    state.activeTab = "trade";
    render();
  } catch (error) {
    setError(error.message);
  }
}

async function quickPresetBundle(tokenMint, presetOverride = null) {
  const preset = presetOverride || presetById("bundle", state.selectedBundlePresetId);
  if (!preset) {
    openManualTradeForToken(tokenMint, "bundle", "No fast bundle preset selected. Review the Bundle form, then submit.");
    return;
  }
  try {
    await ensureWebAccount(null, "Opening secure web profile...");
    const payload = {
      tokenMint,
      walletIndexes: (preset.walletIndexes || []).filter((index) => state.wallets.some((wallet) => String(wallet.index) === String(index))),
      walletGroup: preset.walletGroup || "",
      amountSol: normalizedQuickBuyAmount(preset.amountSol) || "0.1",
      percent: "100",
      slippageBps: preset.slippageBps,
      sellDelay: preset.sellDelay || "off",
      takeProfitPct: preset.takeProfitPct,
      stopLossPct: preset.stopLossPct,
      sellPercent: preset.sellPercent || "100",
      loopCount: "1",
      loopDelay: "0"
    };
    if (!payload.walletIndexes.length && !payload.walletGroup) {
      throw new Error("This bundle preset does not match any loaded wallets. Edit it in the Bundle tab.");
    }
    setError("");
    const data = await api("/api/web/bundle/plan", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.bundleResult = data.plan;
    state.bundleToken = tokenMint;
    await refreshAfterTrade(firstResultSignature(data.plan));
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setError(error.message);
  }
}

async function sellPositionPercent(tokenMint, percentText = "100") {
  try {
    await ensureWebAccount(null, "Opening secure web profile...");
    const percent = Number.parseInt(percentText, 10);
    if (!tokenMint) throw new Error("Missing token mint for position exit.");
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) throw new Error("Sell percent must be from 1 to 100.");
    const position = state.positions.find((item) => String(item.tokenMint) === String(tokenMint));
    const tokenLabel = position?.symbol || position?.name || shortAddress(tokenMint);
    const ok = window.confirm([
      `Exit ${percent}% of ${tokenLabel}?`,
      `Mint: ${tokenMint}`,
      "Wallets: all managed wallets holding this token",
      "Slippage: 4%",
      "Expected SOL, minimum output, and route details are shown before the sell is submitted."
    ].join("\n"));
    if (!ok) return;
    const data = await api("/api/web/bundle/sell", {
      method: "POST",
      body: JSON.stringify({
        tokenMint,
        walletIndexes: "all",
        percent,
        slippageBps: "400"
      })
    });
    state.bundleResult = data.bundle;
    state.bundleToken = tokenMint;
    state.tradeToken = tokenMint;
    await refreshAfterTrade(firstResultSignature(data.bundle));
    state.activeTab = "positions";
    render();
  } catch (error) {
    setError(error.message);
  }
}

function firstResultSignature(result) {
  if (result?.signature) return result.signature;
  const row = (result?.results || []).find((item) => item.signature);
  return row?.signature || "";
}

async function runTxAudit() {
  const signature = $("[data-tx-audit-signature]")?.value?.trim() || state.terminalTxSignature || "";
  if (!signature) {
    setError("Paste a transaction signature first.");
    return;
  }
  state.terminalTxSignature = signature;
  state.terminalTxLoading = true;
  state.terminalTxAudit = null;
  render();
  try {
    const data = await api(`/api/web/tx-audit?signature=${encodeURIComponent(signature)}`);
    state.terminalTxAudit = data.audit || { error: "No audit data returned." };
  } catch (error) {
    state.terminalTxAudit = { error: error.message || "Transaction audit failed." };
    setError(error.message);
  } finally {
    state.terminalTxLoading = false;
    render();
  }
}

function readPresetForm(kind, source = "manager") {
  const prefix = source === "fast" ? `fast-${kind}` : kind;
  if (kind === "trade") {
    return {
      id: $(`[data-${prefix}-preset-id]`)?.value || "",
      name: $(`[data-${prefix}-preset-name]`)?.value || "Trade Preset",
      walletIndex: $(`[data-${prefix}-preset-wallet]`)?.value || "1",
      amountSol: $(`[data-${prefix}-preset-amount]`)?.value || "0.1",
      takeProfitPct: $(`[data-${prefix}-preset-tp]`)?.value || "25",
      stopLossPct: $(`[data-${prefix}-preset-sl]`)?.value || "8",
      sellDelay: fieldValue(`[data-${prefix}-preset-delay]`, `[data-${prefix}-preset-delay-custom]`, "off"),
      sellPercent: $(`[data-${prefix}-preset-sell-percent]`)?.value || "100",
      slippageBps: $(`[data-${prefix}-preset-slippage]`)?.value || "400"
    };
  }
  return {
    id: $(`[data-${prefix}-preset-id]`)?.value || "",
    name: $(`[data-${prefix}-preset-name]`)?.value || "Bundle Preset",
    walletIndexes: checkedWalletIndexes(`${prefix}-preset`),
    walletGroup: $(`[data-${prefix}-preset-group]`)?.value?.trim() || "",
    amountSol: $(`[data-${prefix}-preset-amount]`)?.value || "0.1",
    takeProfitPct: $(`[data-${prefix}-preset-tp]`)?.value || "60",
    stopLossPct: $(`[data-${prefix}-preset-sl]`)?.value || "10",
    sellDelay: fieldValue(`[data-${prefix}-preset-delay]`, `[data-${prefix}-preset-delay-custom]`, "off"),
    sellPercent: $(`[data-${prefix}-preset-sell-percent]`)?.value || "100",
    slippageBps: $(`[data-${prefix}-preset-slippage]`)?.value || "400"
  };
}

function selectNewestUserPreset(kind, presets) {
  const newest = (presets || []).find((preset) => !preset.readonly);
  if (!newest?.id) return;
  if (kind === "trade") state.selectedTradePresetId = newest.id;
  if (kind === "bundle") state.selectedBundlePresetId = newest.id;
}

function selectPresetId(kind, id) {
  const exists = Boolean(id && presetById(kind, id));
  if (kind === "trade") {
    state.selectedTradePresetId = exists ? id : "";
  }
  if (kind === "bundle") {
    state.selectedBundlePresetId = exists ? id : "";
  }
}

function setFastPresetStatus(kind, message) {
  if (kind === "trade") state.fastTradePresetStatus = message;
  if (kind === "bundle") state.fastBundlePresetStatus = message;
}

function usePreset(kind, id) {
  selectPresetId(kind, id);
  setFastPresetStatus(kind, kind === "trade"
    ? "Trade preset selected. Tap Buy on any live row to use it."
    : "Bundle preset selected. It will not buy until you tap Bundle on a token row.");
  render({ force: true });
}

async function savePreset(kind, source = "manager") {
  const status = source === "fast" ? $(`[data-fast-${kind}-preset-status]`) : $(`[data-${kind}-preset-status]`);
  try {
    await ensureWebAccount(status, "Creating secure web profile for presets...");
    writeText(status, "Saving preset...");
    const preset = readPresetForm(kind, source);
    const data = await api("/api/web/presets", {
      method: "POST",
      body: JSON.stringify({ type: kind, action: "save", preset })
    });
    state.presets = data.presets || state.presets;
    if (preset.id && presetById(kind, preset.id)) {
      selectPresetId(kind, preset.id);
    } else {
      selectNewestUserPreset(kind, state.presets?.[kind]);
    }
    if (source === "manager") setEditingPreset(kind, "");
    if (source === "fast") {
      setFastPresetStatus(kind, `Saved "${preset.name}". Tap ${kind === "trade" ? "Trade" : "Bundle"} on any row.`);
    }
    writeText(status, preset.id ? "Preset updated." : "Preset saved.");
    render();
  } catch (error) {
    if (source === "fast") setFastPresetStatus(kind, error.message);
    writeText(status, error.message);
    setError(error.message);
  }
}

async function deletePreset(kind, id) {
  try {
    const data = await api("/api/web/presets", {
      method: "POST",
      body: JSON.stringify({ type: kind, action: "delete", id })
    });
    state.presets = data.presets || state.presets;
    if (kind === "trade" && state.selectedTradePresetId === id) selectPresetId("trade", "");
    if (kind === "bundle" && state.selectedBundlePresetId === id) selectPresetId("bundle", "");
    if ((kind === "trade" && state.editingTradePresetId === id) || (kind === "bundle" && state.editingBundlePresetId === id)) {
      setEditingPreset(kind, "");
    }
    render();
  } catch (error) {
    setError(error.message);
  }
}

function editPreset(kind, id) {
  setEditingPreset(kind, id);
  state.activeTab = kind === "bundle" ? "bundle" : "trade";
  render({ force: true });
  window.requestAnimationFrame(() => {
    const editor = document.querySelector(`[data-preset-editor="${kind === "bundle" ? "bundle" : "trade"}"]`);
    editor?.scrollIntoView({ behavior: "smooth", block: "start" });
    const firstInput = editor?.querySelector("input:not([type='hidden']), select");
    firstInput?.focus?.({ preventScroll: true });
  });
}

async function saveReferralSettings() {
  const status = $("[data-referral-status]");
  try {
    await ensureWebAccount(status, "Opening secure web profile...");
    writeText(status, "Saving referral settings...");
    const data = await api("/api/web/profile/referral", {
      method: "POST",
      body: JSON.stringify({
        referralPayoutWallet: $("[data-referral-wallet]")?.value || ""
      })
    });
    applyUserFromApi(data.user);
    writeText(status, "Referral settings saved.");
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function saveTraderBoardSettings() {
  const status = $("[data-trader-board-status]");
  try {
    await ensureWebAccount(status, "Opening secure web profile...");
    writeText(status, "Saving trader board settings...");
    const mode = $("[data-trader-board-wallet-mode]")?.value || "all";
    const data = await api("/api/web/profile/referral", {
      method: "POST",
      body: JSON.stringify({
        showOnTraderBoard: Boolean($("[data-show-trader-board]")?.checked),
        traderBoardWalletMode: mode,
        traderBoardWalletIndexes: checkedWalletIndexes("trader-board")
      })
    });
    applyUserFromApi(data.user);
    writeText(status, data.user?.showOnTraderBoard ? "Trader board settings saved. Your board stats will use the selected wallet rule." : "Trader board is off.");
    render();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function updateWatchlist(action, target) {
  const tokenMint = target.dataset.watchToken || target.dataset.unwatchToken || "";
  if (!tokenMint) return;
  try {
    await ensureWebAccount(null, "Opening secure web profile for watchlist...");
    const data = await api("/api/web/watchlist", {
      method: "POST",
      body: JSON.stringify({
        action,
        tokenMint,
        symbol: target.dataset.watchSymbol || "",
        name: target.dataset.watchName || "",
        imageUrl: target.dataset.watchImage || ""
      })
    });
    state.watchlist = data.watchlist || state.watchlist;
    render();
  } catch (error) {
    setError(error.message);
  }
}

function setLaunchStatus(message) {
  const status = $("[data-launch-status]");
  writeText(status, message);
}

function readLaunchForm() {
  const ticker = $("[data-launch-ticker]")?.value?.trim() || "";
  const walletIndexes = checkedWalletIndexes("launch");
  const walletGroup = $("[data-launch-group]")?.value?.trim() || "";
  const amountSol = $("[data-launch-amount]")?.value || "";
  const takeProfitPct = fieldValue("[data-launch-tp]", "[data-launch-tp-custom]", "40");
  const stopLossPct = fieldValue("[data-launch-sl]", "[data-launch-sl-custom]", "8");
  const sellDelay = fieldValue("[data-launch-delay]", "[data-launch-delay-custom]", "3");
  const loopCount = fieldValue("[data-launch-loop]", "[data-launch-loop-custom]", "1");
  const loopDelay = fieldValue("[data-launch-loop-delay]", "[data-launch-loop-delay-custom]", "0");
  const slippageBps = fieldValue("[data-launch-slippage]", "[data-launch-slippage-custom]", "300");
  if (!ticker) throw new Error("Enter a ticker to watch.");
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one wallet or enter a group label.");
  return { ticker, walletIndexes, walletGroup, amountSol, takeProfitPct, stopLossPct, sellDelay, loopCount, loopDelay, slippageBps, ...readWalletExitTargets("launch") };
}

async function startLaunchWatch() {
  try {
    const payload = readLaunchForm();
    setLaunchStatus("Arming launch watch...");
    const data = await api("/api/web/launch/watch", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    state.launchResult = data.watch;
    await loadAll();
    state.activeTab = "launch";
    render();
  } catch (error) {
    setLaunchStatus(error.message);
  }
}

async function cancelLaunchWatch(planId) {
  try {
    const data = await api("/api/web/launch/cancel", {
      method: "POST",
      body: JSON.stringify({ planId })
    });
    state.launchResult = data.watch;
    await loadAll();
    state.activeTab = "launch";
    render();
  } catch (error) {
    setLaunchStatus(error.message);
  }
}

function walletsHtml() {
  const create = `${createWalletSection()}${importWalletSection()}${backupRestoreSection()}${downloadsHtml()}`;
  const walletTools = `
    <details class="wallet-tools-details">
      <summary>
        <span>Wallet Tools / Backup / Import</span>
        <span class="wallet-tools-drop-action">Drop <span class="wallet-tools-caret" aria-hidden="true">v</span></span>
      </summary>
      ${create}
    </details>
  `;
  const connected = connectedWalletCardHtml();
  if (!state.wallets.length) return `${connected}${walletTools}${emptyState("No managed bot wallets yet", "Connect a browser wallet for portfolio view, or open Wallet Tools when you want managed trading wallets.")}`;
  return `
    ${connected}
    ${walletBalanceSummaryHtml()}
    <section class="account-check-card">
      <div>
        <h3>Wallet Actions</h3>
        <p>Refresh balances, view token positions, or remove saved wallet records after backup.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Balances</button>
      <button data-tab="positions">View Positions</button>
      <button data-tab="kol">Open KOL Tracker</button>
      <button data-tab="txAudit">Tx Audit</button>
      <small data-wallet-remove-status>${escapeHtml(state.walletRemoveStatus || "")}</small>
    </section>
    <div class="table-list">
      ${state.wallets.map((wallet) => `
        <article class="row-card">
          <div class="wallet-row-main">
            <div class="user-avatar mini" aria-hidden="true">${userAvatarHtml(String(wallet.index))}</div>
            <div>
            <strong>${wallet.index}. ${escapeHtml(wallet.label)}</strong>
            <code>${wallet.publicKey}</code>
            ${walletBalanceLine(wallet)}
            </div>
          </div>
          <div class="card-actions compact">
            <button data-copy="${wallet.publicKey}">Copy</button>
            <button class="danger-lite" data-remove-wallet="${wallet.index}" data-wallet-label="${escapeHtml(`${wallet.index}. ${wallet.label}`)}">Remove</button>
          </div>
        </article>
      `).join("")}
    </div>
    ${walletTools}
  `;
}

function connectedWalletCardHtml() {
  const connected = state.connectedWalletBalance || state.user?.connectedWallet || null;
  if (!connected?.publicKey) return "";
  const balance = state.connectedWalletBalance || {};
  const sol = Number.isFinite(Number(balance.sol)) ? `${Number(balance.sol).toFixed(4)} SOL` : balance.error ? "Balance error" : "loading";
  const tokenText = Number(balance.tokens?.length || 0) === 1 ? "1 token" : `${Number(balance.tokens?.length || 0)} tokens`;
  const warningText = balance.warnings?.length ? ` | ${balance.warnings.length} warning(s)` : "";
  const tokenRows = (balance.tokens || []).slice(0, 6).map((token) => `
    <a href="${escapeHtml(token.dexUrl || dexUrl(token.mint))}" target="_blank" rel="noreferrer">
      ${livePairAvatarHtml({ ...token, tokenMint: token.mint, symbol: token.symbol || token.shortMint, name: token.name || "" })}
      <span>${escapeHtml(token.symbol || token.shortMint || shortAddress(token.mint))}: ${escapeHtml(token.uiAmount ?? "held")}</span>
    </a>
  `).join("");
  return `
    <section class="connected-wallet-card portfolio-card">
      <div>
        <h3>Portfolio</h3>
        <p>${escapeHtml(connected.provider || balance.provider || "Solana Wallet")} ${escapeHtml(shortAddress(connected.publicKey))}</p>
        <div class="portfolio-metrics">
          <span><small>SOL</small><strong>${escapeHtml(sol)}</strong></span>
          <span><small>Tokens</small><strong>${escapeHtml(tokenText)}</strong></span>
          <span><small>Status</small><strong>${balance.error ? "Needs refresh" : "Synced"}</strong></span>
        </div>
        ${balance.error ? `<small>Check failed: ${escapeHtml(balance.error)}</small>` : ""}
        ${tokenRows ? `<div class="connected-token-list">${tokenRows}</div>` : ""}
        <small>Fast bot execution uses saved managed wallets. Browser wallets stay here as a clean portfolio view.</small>
      </div>
      <div class="card-actions">
        <button data-refresh-all>Refresh</button>
        <button data-copy="${escapeHtml(connected.publicKey)}">Copy</button>
        <button data-tab="txAudit">Tx Audit</button>
        <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
      </div>
    </section>
  `;
}

function walletBalanceSummaryHtml() {
  const tokenTotal = state.balances.reduce((sum, row) => sum + Number(row.tokens?.length || 0), 0);
  const errorCount = state.balances.filter((row) => row.error).length;
  return `
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${state.wallets.length}</strong></div>
      <div><span>Total SOL</span><strong>${totalSol().toFixed(4)}</strong></div>
      <div><span>Token Accounts</span><strong>${tokenTotal}</strong></div>
      <div><span>Balance Errors</span><strong>${errorCount}</strong></div>
    </section>
  `;
}

function walletBalanceLine(wallet) {
  const balance = state.balances.find((row) => Number(row.index) === Number(wallet.index));
  if (!balance) return `<span>Balance: loading</span>`;
  if (balance.error) return `<span>Balance check failed: ${escapeHtml(balance.error)}</span>`;
  const sol = Number.isFinite(Number(balance.sol)) ? `${Number(balance.sol).toFixed(4)} SOL` : "SOL unavailable";
  const tokenText = Number(balance.tokens?.length || 0) === 1 ? "1 token" : `${Number(balance.tokens?.length || 0)} tokens`;
  const warnings = balance.warnings?.length ? ` | ${balance.warnings.length} warning(s)` : "";
  return `<span>Balance: ${escapeHtml(sol)} | ${escapeHtml(tokenText)}${escapeHtml(warnings)}</span>`;
}

function positionsHtml() {
  const header = `
    <section class="account-check-card">
      <div>
        <h3>Open Positions</h3>
        <p>Only current token holdings show here. Use Refresh after buys, sells, or transfers.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
      <button data-tab="pnl">PnL History</button>
    </section>
  `;
  if (!state.positions.length) return `${header}${emptyState("No open positions", "Current token holdings will show here after a wallet holds non-zero tokens.")}`;
  return `
    ${header}
    <div class="table-list">
      ${state.positions.map(positionRowHtml).join("")}
    </div>
  `;
}

function pnlHtml() {
  const header = `
    <section class="account-check-card">
      <div>
        <h3>PnL / Results</h3>
        <p>Refresh after a trade closes, or jump back to open positions and wallet balances.</p>
      </div>
      <button class="primary" data-refresh-all>Refresh PnL</button>
      <button data-tab="positions">Open Positions</button>
      <button data-tab="wallets">Wallet Balances</button>
    </section>
  `;
  if (!state.pnl?.totals?.tradeCount) return `${header}${emptyState("No PnL yet", "Trades made through the bot will show here.")}`;
  return `
    ${header}
    <section class="pnl-summary">
      <div><span>Trades</span><strong>${state.pnl.totals.tradeCount}</strong></div>
      <div><span>Spent</span><strong>${state.pnl.totals.spentSol} SOL</strong></div>
      <div><span>Received</span><strong>${state.pnl.totals.receivedSol} SOL</strong></div>
      <div><span>Realized</span><strong>${state.pnl.totals.realizedSol}</strong></div>
    </section>
    <div class="pnl-portfolio-table">
      <div class="pnl-portfolio-head">
        <span>Token</span>
        <span>Invested</span>
        <span>Sold</span>
        <span>Change</span>
        <span>Avg Hold</span>
        <span>Action</span>
      </div>
      ${state.pnl.tokens.map((row) => `
        <article class="pnl-portfolio-row with-avatar">
          <div class="pnl-token-cell">
            ${livePairAvatarHtml(row)}
            <div>
              <strong>${escapeHtml(row.symbol || row.shortMint)}</strong>
              ${row.name ? `<small>${escapeHtml(row.name)}</small>` : ""}
              <button type="button" class="ca-copy" data-copy="${escapeHtml(row.tokenMint)}">${escapeHtml(shortAddress(row.tokenMint))}</button>
            </div>
          </div>
          <span>${escapeHtml(row.spentSol || "0")} SOL</span>
          <span>${escapeHtml(row.receivedSol || "0")} SOL</span>
          <span class="${String(row.realizedSol || "").startsWith("-") ? "negative" : "positive"}">${escapeHtml(row.realizedSol || "0")}</span>
          <span>${escapeHtml(row.holdTime || "n/a")}<small>Latest ${escapeHtml(formatDate(row.lastTradeAt))}</small></span>
          <div class="card-actions compact">
            ${xShareButton(pnlShareText(row), "Share")}
            <button data-pnl-card="${escapeHtml(row.tokenMint)}">Card</button>
            <button data-share-pnl-card="${escapeHtml(row.tokenMint)}" data-share-text="${escapeHtml(pnlShareText(row))}">Post</button>
            <a href="${row.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function allVisibleSignalRows() {
  const liveRows = Object.values(state.livePairsByBucket || {}).flatMap((feed) => feed?.rows || []);
  const scanRows = state.scan?.rows || [];
  const kolRows = state.kolScan?.rows || [];
  const watchRows = state.watchlist?.rows || [];
  const byMint = new Map();
  for (const row of [...liveRows, ...scanRows, ...kolRows, ...watchRows]) {
    if (isUiMayhemRow(row)) continue;
    const mint = String(row?.tokenMint || "");
    if (mint && !byMint.has(mint)) byMint.set(mint, row);
  }
  return [...byMint.values()];
}

function uniqueSignalRows(rows = []) {
  const byMint = new Map();
  for (const row of rows || []) {
    if (isUiMayhemRow(row)) continue;
    const mint = String(row?.tokenMint || "");
    if (!mint) continue;
    const existing = byMint.get(mint);
    if (!existing || signalRowWeight(row) > signalRowWeight(existing)) byMint.set(mint, row);
  }
  return [...byMint.values()];
}

function signalRowWeight(row = {}) {
  return marketDataWeight(row)
    + Math.min(2, Number(row.bestPickScore || row.score || 0) / 50)
    + (firstUsefulNumber(row.volumeM15, row.volumeM30, row.volumeH1, row.volume5m, row.volumeH24) > 0 ? 1 : 0);
}

function isUiMayhemRow(row = {}) {
  const labels = [
    row?.tokenMint,
    row?.symbol,
    row?.name,
    row?.source,
    row?.category,
    row?.platform,
    row?.market,
    row?.dexId,
    row?.profileSource,
    row?.profile?.source,
    row?.profile?.market,
    row?.profile?.mode,
    row?.metadata?.source,
    row?.metadata?.market,
    row?.metadata?.mode,
    row?.dexPair?.dexId,
    row?.dexPair?.labels,
    row?.labels,
    row?.riskFlags
  ].flat().filter(Boolean).join(" ").toLowerCase();
  return /\bmayhem\b/.test(labels) || labels.includes("pump mayhem") || labels.includes("mayhem mode");
}

function selectedTerminalTokenRow() {
  const allRows = allVisibleSignalRows();
  const rowForMint = (mint) => allRows.find((row) => String(row.tokenMint) === mint) || {
    tokenMint: mint,
    shortMint: shortAddress(mint),
    symbol: shortAddress(mint),
    dexUrl: dexUrl(mint)
  };
  const explicitMint = String(state.terminalToken || state.tradeToken || "").trim();
  if (explicitMint) return rowForMint(explicitMint);
  const autoMint = String(state.terminalAutoToken || "").trim();
  if (autoMint) return rowForMint(autoMint);
  const firstRow = (currentLivePairs()?.rows || [])[0] || allRows[0] || null;
  if (firstRow?.tokenMint) state.terminalAutoToken = String(firstRow.tokenMint);
  return firstRow;
}

function selectedSmartChartTokenRow() {
  const allRows = allVisibleSignalRows();
  const rowForMint = (mint) => allRows.find((row) => String(row.tokenMint || "") === mint) || {
    tokenMint: mint,
    shortMint: shortAddress(mint),
    symbol: shortAddress(mint),
    name: "Custom Token",
    dexUrl: dexUrl(mint),
    pumpUrl: mint.toLowerCase().endsWith("pump") ? `https://pump.fun/coin/${encodeURIComponent(mint)}` : ""
  };
  const explicitMint = String(state.smartChartToken || state.terminalToken || state.tradeToken || "").trim();
  if (explicitMint) return rowForMint(explicitMint);
  return selectedTerminalTokenRow();
}

function dexChartEmbedUrl(mint) {
  return `https://dexscreener.com/solana/${encodeURIComponent(mint)}?embed=1&theme=dark`;
}

function marketDataRowsByMint() {
  const rows = [
    ...Object.values(state.livePairsByBucket || {}).flatMap((feed) => feed?.rows || []),
    ...(state.livePairs?.rows || []),
    ...(state.scan?.rows || []),
    ...(state.kolScan?.rows || []),
    ...(state.watchlist?.rows || [])
  ];
  const byMint = new Map();
  for (const row of rows) {
    if (isUiMayhemRow(row)) continue;
    const mint = String(row?.tokenMint || "");
    if (!mint) continue;
    const existing = byMint.get(mint);
    if (!existing || signalRowWeight(row) > signalRowWeight(existing)) byMint.set(mint, row);
  }
  return byMint;
}

function marketDataWeight(row = {}) {
  return [
    row.marketCap,
    row.liquidityUsd,
    row.volume5m,
    row.volumeM15,
    row.volumeH1,
    row.pairCreatedAt,
    row.imageUrl,
    row.twitterUrl,
    row.telegramUrl,
    row.websiteUrl
  ].reduce((score, value) => score + (value && String(value).toLowerCase() !== "n/a" ? 1 : 0), 0);
}

function mergeMarketDataIntoRows(rows = []) {
  const marketByMint = marketDataRowsByMint();
  return (rows || []).map((row) => mergeMarketData(row, marketByMint.get(String(row?.tokenMint || ""))));
}

function firstUsefulNumber(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

function mergeMarketData(row = {}, market = null) {
  if (!market) return row;
  return {
    ...row,
    imageUrl: row.imageUrl || market.imageUrl || "",
    websiteUrl: row.websiteUrl || market.websiteUrl || "",
    twitterUrl: row.twitterUrl || market.twitterUrl || "",
    telegramUrl: row.telegramUrl || market.telegramUrl || "",
    dexUrl: row.dexUrl || market.dexUrl,
    pumpUrl: row.pumpUrl || market.pumpUrl || "",
    isPump: row.isPump || market.isPump,
    pairCreatedAt: row.pairCreatedAt || market.pairCreatedAt,
    pairAgeSeconds: Number.isFinite(Number(row.pairAgeSeconds)) ? row.pairAgeSeconds : market.pairAgeSeconds,
    pairAgeMinutes: Number.isFinite(Number(row.pairAgeMinutes)) ? row.pairAgeMinutes : market.pairAgeMinutes,
    pairAgeLabel: row.pairAgeLabel || market.pairAgeLabel,
    marketCap: firstUsefulNumber(row.marketCap, market.marketCap, row.fdv, market.fdv),
    fdv: firstUsefulNumber(row.fdv, market.fdv, row.marketCap, market.marketCap),
    marketCapLabel: firstStatLabel(row.marketCapLabel, market.marketCapLabel, compactUsd(row.marketCap), compactUsd(market.marketCap)),
    fdvLabel: firstStatLabel(row.fdvLabel, market.fdvLabel, compactUsd(row.fdv), compactUsd(market.fdv)),
    liquidityUsd: firstUsefulNumber(row.liquidityUsd, market.liquidityUsd),
    liquidityLabel: firstStatLabel(row.liquidityLabel, market.liquidityLabel, compactUsd(row.liquidityUsd), compactUsd(market.liquidityUsd)),
    volume5m: firstUsefulNumber(row.volume5m, market.volume5m),
    volume5mLabel: firstStatLabel(row.volume5mLabel, market.volume5mLabel, compactUsd(row.volume5m), compactUsd(market.volume5m)),
    volumeM15: firstUsefulNumber(row.volumeM15, market.volumeM15),
    volumeM15Label: firstStatLabel(row.volumeM15Label, market.volumeM15Label, compactUsd(row.volumeM15), compactUsd(market.volumeM15)),
    volumeM30: firstUsefulNumber(row.volumeM30, market.volumeM30),
    volumeM30Label: firstStatLabel(row.volumeM30Label, market.volumeM30Label, compactUsd(row.volumeM30), compactUsd(market.volumeM30)),
    volumeH1: firstUsefulNumber(row.volumeH1, market.volumeH1),
    volumeH1Label: firstStatLabel(row.volumeH1Label, row.volumeLabel, market.volumeH1Label, market.volumeLabel, compactUsd(row.volumeH1), compactUsd(market.volumeH1)),
    volumeH24: firstUsefulNumber(row.volumeH24, market.volumeH24),
    volumeH24Label: firstStatLabel(row.volumeH24Label, market.volumeH24Label, compactUsd(row.volumeH24), compactUsd(market.volumeH24)),
    volumeLabel: firstStatLabel(row.volumeLabel, market.volumeLabel, row.volumeH1Label, market.volumeH1Label, compactUsd(row.volumeH1), compactUsd(market.volumeH1)),
    sniperCount: firstUsefulNumber(row.sniperCount, market.sniperCount)
  };
}

function terminalBestPickRows(currentRows = [], kolRows = []) {
  const rows = uniqueSignalRows([
    ...(state.livePairsByBucket.under1d?.rows || []),
    ...(state.livePairsByBucket.under3h?.rows || []),
    ...(state.livePairsByBucket.under1h?.rows || []),
    ...(state.livePairsByBucket.live?.rows || []),
    ...(state.scan?.rows || []),
    ...currentRows,
    ...kolRows
  ]);
  return rows.sort((a, b) => (
    Number(b.bestPickScore || b.score || 0) - Number(a.bestPickScore || a.score || 0)
    || firstUsefulNumber(b.volumeM15, b.volumeM30, b.volumeH1, b.volume5m, b.volumeH24) - firstUsefulNumber(a.volumeM15, a.volumeM30, a.volumeH1, a.volume5m, a.volumeH24)
    || firstUsefulNumber(b.marketCap, b.fdv) - firstUsefulNumber(a.marketCap, a.fdv)
    || compareNewestLiveRows(a, b)
  ));
}

function scoreBadgeHtml(row = {}) {
  const score = Number(row.bestPickScore || row.score || 0);
  const warnings = row.scoreWarnings || row.bestPickWarnings || [];
  const label = score ? `${score}/100` : "n/a";
  return `
    <span class="score-badge" title="${escapeHtml(scoreWhyText(row))}">
      <strong>${escapeHtml(label)}</strong>
      <small>${warnings.length ? "warnings" : "best pick"}</small>
    </span>
  `;
}

function scoreWhyText(row = {}) {
  const inputs = row.scoreBreakdown || row.bestPickInputs || {};
  const parts = Object.entries(inputs).map(([key, value]) => `${key}: ${value}`);
  const warnings = row.scoreWarnings || row.bestPickWarnings || [];
  return [...parts, ...warnings.map((warning) => `warning: ${warning}`)].join(" | ") || "Score uses available liquidity, volume, age, momentum, buys/sells, KOL, and risk signals.";
}

function compactUsd(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "n/a";
  if (number >= 1_000_000) return `$${(number / 1_000_000).toFixed(number >= 10_000_000 ? 0 : 1)}M`;
  if (number >= 1_000) return `$${(number / 1_000).toFixed(number >= 100_000 ? 0 : 1)}K`;
  return `$${Math.round(number)}`;
}

function firstStatLabel(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text && text !== "$0" && text.toLowerCase() !== "n/a") return text;
  }
  return "n/a";
}

function volumeWindowItems(row = {}) {
  return [
    ["15m", firstStatLabel(row.volumeM15Label, compactUsd(row.volumeM15))],
    ["30m", firstStatLabel(row.volumeM30Label, compactUsd(row.volumeM30))],
    ["1h", firstStatLabel(row.volumeH1Label, row.volumeLabel, compactUsd(row.volumeH1))],
    ["24h", firstStatLabel(row.volumeH24Label, compactUsd(row.volumeH24))]
  ];
}

function compactStatsHtml(row = {}) {
  const mc = firstStatLabel(row.marketCapLabel, row.fdvLabel, compactUsd(row.marketCap));
  const liq = firstStatLabel(row.liquidityLabel, compactUsd(row.liquidityUsd));
  const volume = volumeWindowItems(row);
  return `
    <div class="compact-stat-grid">
      <span>MC <b>${escapeHtml(mc)}</b></span>
      <span>Liq <b>${escapeHtml(liq)}</b></span>
      ${volume.map(([label, value]) => `<span>${escapeHtml(label)} <b>${escapeHtml(value)}</b></span>`).join("")}
    </div>
  `;
}

function compactMetricsLineHtml(row = {}) {
  const mc = firstStatLabel(row.marketCapLabel, row.fdvLabel, compactUsd(row.marketCap));
  const liq = firstStatLabel(row.liquidityLabel, compactUsd(row.liquidityUsd));
  const vol15 = firstStatLabel(row.volumeM15Label, compactUsd(row.volumeM15));
  const vol1h = firstStatLabel(row.volumeH1Label, row.volumeLabel, compactUsd(row.volumeH1));
  return `
    <div class="compact-metrics-line">
      <span>MC <b>${escapeHtml(mc)}</b></span>
      <span>Liq <b>${escapeHtml(liq)}</b></span>
      <span>15m <b>${escapeHtml(vol15)}</b></span>
      <span>1h <b>${escapeHtml(vol1h)}</b></span>
    </div>
  `;
}

function miniTokenLinksHtml(row = {}, shareText = "") {
  const text = shareText || livePairShareText(row);
  const sniperCount = Number(row.sniperCount || row.snipers || 0);
  return `
    <div class="compact-link-row">
      <a href="${escapeHtml(row.dexUrl || dexUrl(row.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${row.pumpUrl ? `<a href="${escapeHtml(row.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>` : ""}
      ${row.twitterUrl ? `<a href="${escapeHtml(row.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>` : ""}
      ${row.telegramUrl ? `<a href="${escapeHtml(row.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>` : ""}
      ${row.websiteUrl ? `<a href="${escapeHtml(row.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>` : ""}
      <button type="button" data-share-x data-share-text="${escapeHtml(text)}" title="Share">SHARE</button>
      ${sniperCount > 0 ? `<span class="sniper-pill" title="Sniper count">SCOPE ${escapeHtml(sniperCount)}</span>` : ""}
    </div>
  `;
}

function compareNewestLiveRows(a = {}, b = {}) {
  const aAge = Number(a.pairAgeSeconds);
  const bAge = Number(b.pairAgeSeconds);
  if (Number.isFinite(aAge) && Number.isFinite(bAge) && aAge !== bAge) return aAge - bAge;
  const aCreated = Number(a.pairCreatedAt || 0);
  const bCreated = Number(b.pairCreatedAt || 0);
  if (aCreated || bCreated) return bCreated - aCreated;
  return Number(b.bestPickScore || 0) - Number(a.bestPickScore || 0);
}

function terminalTokenStatsHtml(row = {}) {
  const mc = firstStatLabel(row.marketCapLabel, row.fdvLabel, compactUsd(row.marketCap), compactUsd(row.fdv));
  const liq = firstStatLabel(row.liquidityLabel, compactUsd(row.liquidityUsd));
  const vol15 = firstStatLabel(row.volumeM15Label, compactUsd(row.volumeM15));
  const vol1h = firstStatLabel(row.volumeH1Label, row.volumeLabel, compactUsd(row.volumeH1));
  const vol24 = firstStatLabel(row.volumeH24Label, compactUsd(row.volumeH24));
  return `
    <div class="terminal-token-stats" aria-label="Market stats">
      <span><small>MC</small><strong>${escapeHtml(mc)}</strong></span>
      <span><small>Liq</small><strong>${escapeHtml(liq)}</strong></span>
      <span><small>15m</small><strong>${escapeHtml(vol15)}</strong></span>
      <span><small>1h</small><strong>${escapeHtml(vol1h)}</strong></span>
      <span><small>24h</small><strong>${escapeHtml(vol24)}</strong></span>
    </div>
  `;
}

function terminalSignalRowsHtml(rows, options = {}) {
  const limit = options.limit || 6;
  const actionLabel = options.actionLabel || "Buy";
  const emptyTitle = options.emptyTitle || "No signals loaded";
  const emptyMessage = options.emptyMessage || "Refresh the feed to load current signals.";
  const visibleRows = (rows || []).slice(0, limit);
  if (!visibleRows.length) return emptyState(emptyTitle, emptyMessage);
  return `
    <div class="terminal-token-list">
      ${visibleRows.map((row) => {
        const score = Number(row.bestPickScore || row.score || 0);
        const scoreLabel = score ? `${score}` : "n/a";
        const setup = row.scalpSetup || row.momentum || row.category || "live";
        return `
          <article class="terminal-token-row" data-preview-token="${escapeHtml(row.tokenMint)}">
            ${livePairAvatarHtml(row)}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong>${escapeHtml(row.symbol || row.shortMint || shortAddress(row.tokenMint))}</strong>
                <small>${escapeHtml(row.name || row.category || "Token")}</small>
                <em class="mobile-score-mini" title="${escapeHtml(scoreWhyText(row))}">${escapeHtml(scoreLabel)} score</em>
              </div>
              <button type="button" class="ca-copy" data-copy="${escapeHtml(row.tokenMint)}">${escapeHtml(shortAddress(row.tokenMint))}</button>
              <span class="terminal-token-age">${escapeHtml(row.pairAgeLabel || formatAgeFromRow(row) || "age unknown")} | ${escapeHtml(setup)}</span>
              ${miniTokenLinksHtml(row)}
            </div>
            ${terminalTokenStatsHtml(row)}
            <span class="terminal-score-chip" title="${escapeHtml(scoreWhyText(row))}">
              <strong>${escapeHtml(scoreLabel)}</strong>
              <small>score</small>
            </span>
            <div class="terminal-token-actions">
              <button type="button" class="primary" data-quick-trade-token="${escapeHtml(row.tokenMint)}" title="Buy with active preset">${escapeHtml(actionLabel)}</button>
              <button type="button" data-quick-bundle-token="${escapeHtml(row.tokenMint)}">Bundle</button>
              <button type="button" data-smart-chart-token="${escapeHtml(row.tokenMint)}">Chart</button>
              <button type="button" class="watch-action" data-watch-token="${escapeHtml(row.tokenMint)}" data-watch-symbol="${escapeHtml(row.symbol || "")}" data-watch-name="${escapeHtml(row.name || "")}" data-watch-image="${escapeHtml(row.imageUrl || "")}">${isTokenWatched(row.tokenMint) ? "Saved" : "Watch"}</button>
            </div>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function compactSignalRowsHtml(rows, options = {}) {
  if (options.layout === "terminal") {
    return terminalSignalRowsHtml(rows, options);
  }
  const limit = options.limit || 6;
  const actionLabel = options.actionLabel || "Buy Preset";
  const emptyTitle = options.emptyTitle || "No signals loaded";
  const emptyMessage = options.emptyMessage || "Refresh the feed to load current signals.";
  const visibleRows = (rows || []).slice(0, limit);
  if (!visibleRows.length) return emptyState(emptyTitle, emptyMessage);
  return `
    <div class="compact-signal-list">
      ${visibleRows.map((row) => `
        <article class="compact-signal-row" data-preview-token="${escapeHtml(row.tokenMint)}">
          ${livePairAvatarHtml(row)}
          <div class="compact-signal-main">
            <div>
              <strong>${escapeHtml(row.symbol || row.shortMint || shortAddress(row.tokenMint))}</strong>
              <small>${escapeHtml(row.name || row.category || "Token")}</small>
            </div>
            <button type="button" class="ca-copy" data-copy="${escapeHtml(row.tokenMint)}">${escapeHtml(shortAddress(row.tokenMint))}</button>
            <span>${escapeHtml(row.pairAgeLabel || formatAgeFromRow(row) || "age unknown")} | ${escapeHtml(row.scalpSetup || row.momentum || row.category || "live")}</span>
            ${compactMetricsLineHtml(row)}
            ${miniTokenLinksHtml(row)}
          </div>
          ${scoreBadgeHtml(row)}
          <div class="compact-row-actions">
            <button type="button" class="primary" data-quick-trade-token="${escapeHtml(row.tokenMint)}" title="Buy with active preset">${escapeHtml(actionLabel)}</button>
            <button type="button" data-quick-bundle-token="${escapeHtml(row.tokenMint)}">Bundle</button>
            <button type="button" data-smart-chart-token="${escapeHtml(row.tokenMint)}">Chart</button>
            <button type="button" class="watch-action" data-watch-token="${escapeHtml(row.tokenMint)}" data-watch-symbol="${escapeHtml(row.symbol || "")}" data-watch-name="${escapeHtml(row.name || "")}" data-watch-image="${escapeHtml(row.imageUrl || "")}">${isTokenWatched(row.tokenMint) ? "Saved" : "Watch"}</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function activePresetDetail(kind) {
  const preset = presetById(kind, kind === "trade" ? state.selectedTradePresetId : state.selectedBundlePresetId);
  if (!preset) return "Custom / manual";
  const parts = [
    preset.name,
    `${preset.amountSol} SOL`,
    `TP ${preset.takeProfitPct}`,
    `SL ${preset.stopLossPct}`
  ];
  if (preset.sellDelay && preset.sellDelay !== "off") parts.push(`Timer ${preset.sellDelay}`);
  return parts.join(" | ");
}

function terminalPresetStripHtml() {
  return `
    <section class="terminal-preset-strip">
      <details open>
        <summary>
          <span>Active Presets</span>
          <strong>${escapeHtml(activePresetDetail("trade"))}</strong>
        </summary>
        <div class="terminal-preset-strip-grid">
          <label>
            Trade Preset
            <select data-fast-trade-preset="terminal-strip">
              ${presetOptionsHtml("trade", state.selectedTradePresetId)}
            </select>
          </label>
          <label>
            Bundle Preset
            <select data-fast-bundle-preset="terminal-strip">
              ${presetOptionsHtml("bundle", state.selectedBundlePresetId)}
            </select>
          </label>
          <button type="button" data-edit-selected-preset="trade">Edit Active Trade</button>
          <button type="button" data-edit-selected-preset="bundle">Edit Active Bundle</button>
        </div>
        <div class="ogre-tek-bar">
          <span>Ogre Tek</span>
          <button type="button" data-tab="sniper">Sniper</button>
          <button type="button" data-tab="bundle">Bundle</button>
          <button type="button" data-tab="volume">Volume</button>
          <button type="button" data-tab="launch">Launch Snipe</button>
        </div>
      </details>
    </section>
  `;
}

function formatQuickBuyAmount(value) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return "";
  return number >= 1 ? number.toFixed(2).replace(/\.?0+$/, "") : number.toFixed(3).replace(/0+$/, "").replace(/\.$/, "");
}

function normalizedQuickBuyAmount(value = state.quickBuyAmountOverride) {
  const clean = String(value || "").replace(/[^0-9.]/g, "");
  if (!clean) return "";
  const number = Number(clean);
  if (!Number.isFinite(number) || number <= 0) return "";
  return formatQuickBuyAmount(number);
}

function activeTradePreset() {
  return presetById("trade", state.selectedTradePresetId);
}

function activeQuickBuyAmount(preset = activeTradePreset()) {
  return normalizedQuickBuyAmount() || formatQuickBuyAmount(preset?.amountSol);
}

function rowAgeSeconds(row = {}) {
  const value = Number(row.pairAgeSeconds);
  if (Number.isFinite(value) && value >= 0) return value;
  const created = Number(row.pairCreatedAt || row.createdAt || 0);
  if (created > 0) {
    const timestamp = created < 10_000_000_000 ? created * 1000 : created;
    return Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  }
  return Number.POSITIVE_INFINITY;
}

const SLIME_SCOPE_LIMIT = 30;

function slimeScopeSourceRows() {
  const marketByMint = marketDataRowsByMint();
  return uniqueSignalRows([
    ...(state.livePairs?.rows || []),
    ...(state.livePairsByBucket.live?.rows || []),
    ...(state.livePairsByBucket.under1h?.rows || []),
    ...(state.livePairsByBucket.under3h?.rows || []),
    ...(state.livePairsByBucket.under1d?.rows || []),
    ...(state.scan?.rows || []),
    ...(state.kolScan?.rows || [])
  ])
    .map((row) => mergeMarketData(row, marketByMint.get(String(row?.tokenMint || ""))))
    .filter((row) => row?.tokenMint && !isUiMayhemRow(row));
}

function slimeScopeMarketCap(row = {}) {
  return firstUsefulNumber(row.marketCap, row.fdv);
}

function slimeScopeLiquidity(row = {}) {
  return firstUsefulNumber(row.liquidityUsd);
}

function slimeScopeVolume(row = {}) {
  return firstUsefulNumber(row.volumeM5, row.volume5m, row.volumeM15, row.volumeM30, row.volumeH1, row.volumeH24, row.volumeUsd);
}

function slimeScopePulseScore(row = {}) {
  const score = Number(row.bestPickScore || row.score || 0);
  const volume = slimeScopeVolume(row);
  const liquidity = slimeScopeLiquidity(row);
  const marketCap = slimeScopeMarketCap(row);
  const age = rowAgeSeconds(row);
  const freshness = Number.isFinite(age) ? Math.max(0, 86_400 - age) / 86_400 : 0;
  return (
    score * 1000
    + Math.log10(volume + 1) * 160
    + Math.log10(liquidity + 1) * 120
    + Math.log10(marketCap + 1) * 80
    + freshness * 100
  );
}

function sortSlimeScopeRows(items = []) {
  return [...items].sort((a, b) => (
    slimeScopePulseScore(b) - slimeScopePulseScore(a)
    || compareNewestLiveRows(a, b)
  ));
}

function backfillSlimeScopeRows(primary = [], fallback = [], limit = SLIME_SCOPE_LIMIT) {
  const seen = new Set();
  const output = [];
  for (const row of [...primary, ...fallback]) {
    const mint = String(row?.tokenMint || "");
    if (!mint || seen.has(mint)) continue;
    seen.add(mint);
    output.push(row);
    if (output.length >= limit) break;
  }
  return output;
}

function slimeScopeRows(mode = state.slimeScopeMode) {
  const withMarket = slimeScopeSourceRows();
  const bestFallback = sortSlimeScopeRows(withMarket);
  const recentFallback = [...withMarket].filter((row) => rowAgeSeconds(row) <= 86_400).sort(compareNewestLiveRows);

  if (mode === "graduated") {
    const graduated = sortSlimeScopeRows(withMarket.filter((row) => {
      const marketCap = slimeScopeMarketCap(row);
      const liquidity = slimeScopeLiquidity(row);
      const volume = slimeScopeVolume(row);
      return marketCap >= 7_000 || liquidity >= 1_000 || volume >= 1_000 || Boolean(row.dexUrl && !row.isPump);
    }));
    return backfillSlimeScopeRows(graduated, [...recentFallback, ...bestFallback]);
  }
  if (mode === "graduating") {
    const graduating = sortSlimeScopeRows(withMarket.filter((row) => {
      const marketCap = slimeScopeMarketCap(row);
      const liquidity = slimeScopeLiquidity(row);
      const volume = slimeScopeVolume(row);
      const age = rowAgeSeconds(row);
      return (
        (marketCap >= 2_000 && marketCap < 120_000)
        || (liquidity >= 500 && liquidity < 60_000)
        || (volume > 0 && marketCap < 200_000)
        || (Number.isFinite(age) && age <= 21_600 && (marketCap > 0 || liquidity > 0 || volume > 0))
      );
    }));
    const earlyFallback = sortSlimeScopeRows(withMarket.filter((row) => rowAgeSeconds(row) <= 21_600 || slimeScopeMarketCap(row) < 200_000));
    return backfillSlimeScopeRows(graduating, [...earlyFallback, ...bestFallback]);
  }
  const newest = [...withMarket].filter((row) => rowAgeSeconds(row) <= 3_600).sort(compareNewestLiveRows);
  return backfillSlimeScopeRows(newest, [...recentFallback, ...bestFallback]);
}

function slimeScopeHtml() {
  const modes = [
    ["new", "New"],
    ["graduating", "Graduating"],
    ["graduated", "Graduated"]
  ];
  const rows = slimeScopeRows();
  return `
    <section class="slime-scope-page">
      <div class="terminal-title-row slime-scope-title-row">
        <img class="slime-scope-title-icon" src="./assets/slimewire/svg/icons/slime-scope.svg" alt="" aria-hidden="true">
        <div>
          <h3>Slime Scope</h3>
          <p>Fast pump-style view for new, graduating, and graduated pairs. Mayhem-mode rows stay filtered out.</p>
        </div>
        <span>${rows.length} shown</span>
      </div>
      <div class="command-controls slime-scope-controls">
        <div class="mode-row terminal-modes slime-scope-tabs">
          ${modes.map(([mode, label]) => `<button data-slime-scope-mode="${mode}" data-active="${state.slimeScopeMode === mode}">${label}</button>`).join("")}
        </div>
        ${quickBuyPresetBarHtml("slime-scope")}
        <button class="primary slime-scope-refresh-button" data-refresh-live-pairs>Refresh Scope</button>
      </div>
      <article class="terminal-panel slime-scope-list-panel">
        ${compactSignalRowsHtml(rows, {
          layout: "terminal",
          limit: 30,
          actionLabel: activePresetButtonLabel(),
          emptyTitle: "No Slime Scope pairs yet",
          emptyMessage: "Feeds are refreshing. Try a different scope mode if this stays empty."
        })}
      </article>
    </section>
  `;
}

function terminalHtml() {
  const liveFeed = currentLivePairs();
  const liveRows = uniqueSignalRows(liveFeed?.rows || []);
  const newestLiveRows = [...liveRows].sort(compareNewestLiveRows);
  const kolRows = mergeMarketDataIntoRows(state.kolScan?.rows || []).filter((row) => !isUiMayhemRow(row));
  const bestRows = terminalBestPickRows(liveRows, kolRows);
  const bucketLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
  const lastUpdated = currentLivePairsUpdatedAt();
  const rowTradeLabel = activePresetButtonLabel();
  return `
    <section class="command-terminal no-live-ticket">
      <main class="command-workspace">
        <div class="terminal-title-row command-title">
          <div>
            <h3>Live Terminal</h3>
            <p>Hottest pairs, live launches, KOL signals, positions, and quick execution stay visible from one command center.</p>
          </div>
          <span>${bucketLoading ? "Refreshing" : "Live"}${lastUpdated ? ` | ${escapeHtml(ageTextFromSeconds(secondsSince(lastUpdated) || 0))}` : ""}</span>
        </div>

        <div class="command-controls">
          <div class="mode-row terminal-modes live-pair-buckets">
            ${LIVE_PAIR_BUCKETS.map(([bucket, label]) => {
              const count = state.livePairsByBucket[bucket]?.rows?.length;
              const suffix = Number.isFinite(Number(count)) ? ` (${count})` : "";
              return `<button data-live-pair-bucket="${bucket}" data-active="${state.livePairBucket === bucket}">${label}${suffix}</button>`;
            }).join("")}
          </div>
          <label>
            Sort
            <select data-terminal-sort>
              ${LIVE_PAIR_SORTS.map(([value, label]) => `<option value="${value}" ${state.terminalSort === value ? "selected" : ""}>${label}</option>`).join("")}
            </select>
          </label>
          ${quickBuyPresetBarHtml("terminal-top")}
          <button class="primary" data-refresh-live-pairs>${bucketLoading ? "Refreshing..." : "Refresh Feeds"}</button>
          <button data-top-refresh-wallet>${state.walletRefreshing ? "Refreshing Wallet..." : "Refresh Wallet"}</button>
        </div>

        <section class="command-grid">
          <article class="terminal-panel best-picks-panel">
            <header><h4>Best Picks</h4><span>Score + reasons</span></header>
            ${compactSignalRowsHtml(bestRows, { layout: "terminal", limit: 8, actionLabel: rowTradeLabel, emptyTitle: "No Best Picks yet", emptyMessage: "Refresh Live Pairs to score current pairs." })}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Live Pairs</h4><button data-tab="live">Open</button></header>
            ${compactSignalRowsHtml(newestLiveRows, { layout: "terminal", limit: 12, actionLabel: rowTradeLabel })}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${state.kolLoading ? "Loading..." : "Refresh"}</button></header>
            ${compactSignalRowsHtml(kolRows, { layout: "terminal", limit: 12, actionLabel: rowTradeLabel, emptyTitle: "No KOL signals loaded", emptyMessage: "Refresh KOL Tracker to load signals." })}
          </article>
        </section>

        ${terminalBottomTablesHtml()}
      </main>
    </section>
  `;
}

function activePresetButtonLabel() {
  const preset = activeTradePreset();
  if (!preset) return "Trade";
  const amount = activeQuickBuyAmount(preset);
  if (amount) return `Buy ${amount} SOL`;
  return tradeActionLabelFromPreset(preset, "Trade");
}

function syncQuickBuyActionLabels() {
  const label = activePresetButtonLabel();
  document.querySelectorAll("[data-quick-trade-token]").forEach((button) => {
    writeText(button, label);
  });
}

function openPresetEditorTab(kind) {
  const nextTab = kind === "bundle" ? "bundle" : "trade";
  state.activeTab = nextTab;
  if (nextTab === "trade") state.editingTradePresetId = "";
  if (nextTab === "bundle") state.editingBundlePresetId = "";
  window.history.pushState({}, "", "/terminal");
  render({ force: true });
}

function tokenPreviewHtml(token) {
  if (!token?.tokenMint) return emptyState("No token selected", "Click any row to preview it here without leaving the live feeds.");
  const hasPosition = state.positions.some((position) => String(position.tokenMint) === String(token.tokenMint));
  return `
    <div class="token-preview-card with-avatar">
      ${livePairAvatarHtml(token)}
      <div>
        <strong>${escapeHtml(token.symbol || token.shortMint || shortAddress(token.tokenMint))}</strong>
        <small>${escapeHtml(token.name || token.category || "Token")}</small>
        <button type="button" class="ca-copy" data-copy="${escapeHtml(token.tokenMint)}">${escapeHtml(shortAddress(token.tokenMint))}</button>
      </div>
    </div>
    <dl class="mini-stats">
      <div><dt>Age</dt><dd>${escapeHtml(token.pairAgeLabel || formatAgeFromRow(token) || "age unknown")}</dd></div>
      <div><dt>Liquidity</dt><dd>${escapeHtml(token.liquidityLabel || "n/a")}</dd></div>
      <div><dt>MC / FDV</dt><dd>${escapeHtml(token.marketCapLabel || "n/a")}</dd></div>
      <div><dt>Volume</dt><dd>${escapeHtml(token.volumeH1Label || token.volumeLabel || "n/a")}</dd></div>
      <div><dt>Score</dt><dd>${escapeHtml(token.bestPickScore ? `${token.bestPickScore}/100` : "n/a")}</dd></div>
      <div><dt>Position</dt><dd>${hasPosition ? "Held" : "None"}</dd></div>
    </dl>
    <div class="card-actions compact">
      <a href="${escapeHtml(token.dexUrl || dexUrl(token.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      ${token.pumpUrl ? `<a href="${escapeHtml(token.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>` : ""}
      <button class="primary" data-quick-trade-token="${escapeHtml(token.tokenMint)}">${escapeHtml(activePresetButtonLabel())}</button>
      <button data-quick-bundle-token="${escapeHtml(token.tokenMint)}">Bundle</button>
      ${hasPosition ? `<button data-position-sell="${escapeHtml(token.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>` : ""}
    </div>
    <small class="score-breakdown">Why: ${escapeHtml(scoreWhyText(token))}</small>
  `;
}

function smartChartHtml() {
  const token = selectedSmartChartTokenRow();
  const mint = String(token?.tokenMint || "").trim();
  const heldPosition = mint ? state.positions.find((position) => String(position.tokenMint) === mint) : null;
  const relatedRows = mint
    ? uniqueSignalRows([
        token,
        ...allVisibleSignalRows().filter((row) => String(row.tokenMint || "") === mint)
      ]).filter(Boolean).slice(0, 5)
    : terminalBestPickRows().slice(0, 5);
  const suggestion = smartChartSuggestion(token || {});
  const chartZoom = Math.min(120, Math.max(65, Number(state.smartChartZoom) || 80));
  if (!mint) {
    return `
      <section class="smart-chart-terminal">
        <div class="terminal-title-row">
          <div>
            <h3>Smart Chart</h3>
            <p>Paste a token CA or open Chart from any row to load a focused chart workspace.</p>
          </div>
        </div>
        <div class="smart-chart-search">
          <input data-smart-chart-input placeholder="Paste token CA" autocomplete="off">
          <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
        </div>
        <div class="terminal-panel">
          <div class="terminal-title-row">
            <h3>Suggested tokens</h3>
          </div>
          ${compactSignalRowsHtml(relatedRows, {
            layout: "terminal",
            limit: 5,
            actionLabel: activePresetButtonLabel(),
            emptyTitle: "No chart picks loaded",
            emptyMessage: "Refresh feeds, then open Smart Chart again."
          })}
        </div>
      </section>
    `;
  }
  return `
    <section class="smart-chart-terminal">
      <div class="terminal-title-row">
        <div>
          <h3>Smart Chart</h3>
          <p>Chart, scanner stats, live signals, and preset actions for the selected token.</p>
        </div>
        <button type="button" data-tab="terminal">Back to Live Terminal</button>
      </div>
      <div class="smart-chart-search">
        <input data-smart-chart-input value="${escapeHtml(mint)}" placeholder="Paste token CA" autocomplete="off">
        <button class="primary" type="button" data-smart-chart-open>Open Chart</button>
      </div>
      <div class="smart-chart-grid">
        <article class="terminal-panel smart-chart-main">
          <div class="smart-chart-token-header">
            ${livePairAvatarHtml(token)}
            <div>
              <strong>${escapeHtml(token.symbol || token.shortMint || shortAddress(mint))}</strong>
              <small>${escapeHtml(token.name || token.category || "Token")}</small>
              <button type="button" class="ca-copy" data-copy="${escapeHtml(mint)}">${escapeHtml(shortAddress(mint))}</button>
            </div>
            <div class="smart-chart-links">
              ${miniTokenLinksHtml(token)}
            </div>
          </div>
          <div class="smart-chart-frame" style="--smart-chart-scale: ${chartZoom / 100};">
            <iframe title="DexScreener chart for ${escapeHtml(token.symbol || shortAddress(mint))}" src="${escapeHtml(dexChartEmbedUrl(mint))}" loading="lazy"></iframe>
          </div>
          <label class="smart-chart-zoom">
            <span>Zoom</span>
            <input data-smart-chart-zoom type="range" min="65" max="120" step="5" value="${escapeHtml(chartZoom)}">
            <strong>${escapeHtml(chartZoom)}%</strong>
          </label>
          <small class="score-breakdown">If the embedded chart does not load, use the DEX link above.</small>
        </article>
        <aside class="terminal-panel smart-chart-side">
          <h3>${escapeHtml(token.symbol || "Token")} setup</h3>
          ${terminalTokenStatsHtml(token)}
          <div class="smart-chart-suggestion">
            <strong>Smart read</strong>
            <p>${escapeHtml(suggestion)}</p>
          </div>
          <div class="smart-chart-actions">
            <button class="primary" type="button" data-quick-trade-token="${escapeHtml(mint)}">${escapeHtml(activePresetButtonLabel())}</button>
            <button type="button" data-quick-bundle-token="${escapeHtml(mint)}">Bundle</button>
            <button type="button" data-use-token-volume="${escapeHtml(mint)}">Volume</button>
            <button type="button" data-watch-token="${escapeHtml(mint)}">${isTokenWatched(mint) ? "Saved" : "Watch"}</button>
            ${heldPosition ? `<button type="button" class="danger" data-position-sell="${escapeHtml(mint)}" data-position-sell-percent="100">Exit 100%</button>` : ""}
          </div>
        </aside>
      </div>
      <div class="smart-chart-bottom-grid">
        <article class="terminal-panel">
          <div class="terminal-title-row">
            <h3>Related signals</h3>
            <button type="button" data-refresh-feeds>Refresh</button>
          </div>
          ${compactSignalRowsHtml(relatedRows, {
            layout: "terminal",
            limit: 5,
            actionLabel: activePresetButtonLabel(),
            emptyTitle: "No related signals",
            emptyMessage: "This token is loaded from CA. Refresh feeds to look for matching signals."
          })}
        </article>
        <article class="terminal-panel">
          <div class="terminal-title-row">
            <h3>Position</h3>
            <button type="button" data-refresh-wallet>Refresh Wallet</button>
          </div>
          ${heldPosition ? `<div class="table-list compact-table">${positionRowHtml(heldPosition)}</div>` : emptyState("No position", "No current SlimeWire position is tracked for this token.")}
        </article>
      </div>
    </section>
  `;
}

function terminalTradePanelHtml(token, collapsed = false) {
  const heldPosition = token?.tokenMint ? state.positions.find((position) => String(position.tokenMint) === String(token.tokenMint)) : null;
  const activeTrade = activePresetDetail("trade");
  const activeBundle = activePresetDetail("bundle");
  if (collapsed) {
    return `
      <article class="order-ticket terminal-ticket terminal-ticket-collapsed">
        <button type="button" class="terminal-ticket-collapsed-button" data-toggle-terminal-ticket aria-label="Open trade panel">
          <span>Trade</span>
          <strong>‹</strong>
        </button>
      </article>
    `;
  }
  return `
    <article class="order-ticket terminal-ticket">
      <div class="terminal-ticket-header">
        <div>
          <span>Trade Panel</span>
          <small>${escapeHtml(activeTrade)}</small>
        </div>
        <button type="button" class="terminal-ticket-toggle" data-toggle-terminal-ticket aria-label="Hide trade panel">›</button>
      </div>
        <div class="ticket-collapse-body">
          <p>Row trades use the active preset. Managed wallets can run saved fast actions; browser wallets still ask for approval.</p>
          <div class="segmented-control">
            <button data-tab="trade">Buy / Sell</button>
            <button data-tab="trade">Manual CA</button>
          </div>

          <details class="side-preset-details">
            <summary>
              <span>Active Presets</span>
              <small>${escapeHtml(activeBundle)}</small>
            </summary>
            <label>
              Trade Preset
              <select data-fast-trade-preset="terminal">
                ${presetOptionsHtml("trade", state.selectedTradePresetId)}
              </select>
            </label>
            <label>
              Bundle Preset
              <select data-fast-bundle-preset="terminal">
                ${presetOptionsHtml("bundle", state.selectedBundlePresetId)}
              </select>
            </label>
            <div class="quick-grid">
              <button type="button" data-edit-selected-preset="trade">Edit Trade Preset</button>
              <button type="button" data-edit-selected-preset="bundle">Edit Bundle Preset</button>
            </div>
          </details>

          <div class="ticket-balance-row">
            <span>${totalSol().toFixed(4)} SOL</span>
            <button data-top-refresh-wallet>${state.walletRefreshing ? "Refreshing..." : "Refresh Balance"}</button>
          </div>
          ${token?.tokenMint ? `
            <code>${escapeHtml(token.tokenMint)}</code>
            <div class="quick-grid">
              <button class="primary" data-quick-trade-token="${escapeHtml(token.tokenMint)}">${escapeHtml(activePresetButtonLabel())}</button>
              <button data-quick-bundle-token="${escapeHtml(token.tokenMint)}">Bundle</button>
              <button data-smart-chart-token="${escapeHtml(token.tokenMint)}">Chart</button>
              <button data-use-token-volume="${escapeHtml(token.tokenMint)}">Volume</button>
              <button data-tab="sniper">Snipe</button>
            </div>
            ${heldPosition ? `
              <div class="exit-strip">
                <strong>Position held</strong>
                <button data-position-sell="${escapeHtml(token.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
                <button data-position-sell="${escapeHtml(token.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
                <button data-position-sell="${escapeHtml(token.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
              </div>
            ` : ""}
          ` : emptyState("No token selected", "Click a live pair, KOL signal, watchlist row, or paste a CA in the top search.")}
          <small>${escapeHtml(syncHealthLabel())}</small>
        </div>
    </article>
  `;
}

function terminalBottomTablesHtml() {
  const tabs = [
    ["positions", "Positions"],
    ["orders", "Open Orders"],
    ["history", "Order History"],
    ["wallets", "Wallets"],
    ["kol", "KOL Signals"],
    ["sniper", "Sniper Logs"],
    ["tx", "Transaction Audit"],
    ["reconcile", "Balance Reconciliation"]
  ];
  return `
    <section class="terminal-panel terminal-bottom">
      <div class="mode-row terminal-modes compact">
        ${tabs.map(([id, label]) => `<button data-terminal-subtab="${id}" data-active="${state.terminalSubtab === id}">${label}</button>`).join("")}
      </div>
      ${terminalSubtabHtml()}
    </section>
  `;
}

function terminalSubtabHtml() {
  if (state.terminalSubtab === "orders") return stopLossAuditHtml();
  if (state.terminalSubtab === "history") return liveTradeRowsHtml(12);
  if (state.terminalSubtab === "wallets") return walletBalanceSummaryHtml();
  if (state.terminalSubtab === "kol") return compactSignalRowsHtml(mergeMarketDataIntoRows(state.kolScan?.rows || []), { layout: "terminal", limit: 12 });
  if (state.terminalSubtab === "sniper") return state.scan ? tokenSignalRowsHtml(state.scan.rows || [], { context: "sniper", primaryAction: "snipe", primaryActionLabel: "Snipe", hideToolbar: true }) : emptyState("No sniper scan loaded", "Open Sniper or refresh a scan mode.");
  if (state.terminalSubtab === "tx") return txAuditHtml(true);
  if (state.terminalSubtab === "reconcile") return balanceReconciliationHtml();
  return positionsTableHtml(6);
}

function positionsTableHtml(limit = 25) {
  if (!state.positions.length) return emptyState("No open positions", "Open token holdings will show here after refresh.");
  return `
    <div class="table-list compact-table">
      ${state.positions.slice(0, limit).map(positionRowHtml).join("")}
    </div>
  `;
}

function positionRowHtml(position) {
  return `
    <article class="row-card position with-avatar">
      ${livePairAvatarHtml(position)}
      <div class="row-main">
        <strong>${escapeHtml(position.symbol || position.shortMint)}</strong>
        <span>${escapeHtml(position.uiAmount)} tokens across ${escapeHtml(position.walletCount)} wallet(s)</span>
        ${position.name ? `<small>${escapeHtml(position.name)}</small>` : ""}
        <small>Value: ${escapeHtml(position.estimatedValueSol || "Price unavailable")} SOL | PnL: ${escapeHtml(position.openPnlSol || position.realizedSol || "Price unavailable")}</small>
        ${position.valueError ? `<small class="warning-text">Price warning: ${escapeHtml(position.valueError)}</small>` : ""}
      </div>
      <div class="card-actions compact">
        <button data-position-sell="${escapeHtml(position.tokenMint)}" data-position-sell-percent="25">Sell 25%</button>
        <button data-position-sell="${escapeHtml(position.tokenMint)}" data-position-sell-percent="50">Sell 50%</button>
        <button class="primary" data-position-sell="${escapeHtml(position.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>
        <button data-position-sell-custom="${escapeHtml(position.tokenMint)}">Custom %</button>
        ${xShareButton(positionShareText(position))}
        <a href="${escapeHtml(position.dexUrl || dexUrl(position.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
      </div>
    </article>
  `;
}

function liveTradeRowsHtml(limit = 10) {
  const trades = state.pnl?.trades || [];
  if (!trades.length) return emptyState("No live trade history yet", "Submitted web trades will appear here after refresh.");
  return `
    <div class="live-trade-list">
      ${trades.slice(0, limit).map((trade) => `
        <article class="live-trade-row">
          <strong>${escapeHtml(String(trade.type || "").toUpperCase())} ${escapeHtml(trade.shortMint || shortAddress(trade.tokenMint))}</strong>
          <span>${escapeHtml(trade.walletLabel || "wallet")} | ${escapeHtml(trade.solAmount || "0")} SOL</span>
          <small>${escapeHtml(formatDate(trade.timestamp))}</small>
          <div class="card-actions compact">
            ${trade.tokenMint ? `<button data-preview-token="${escapeHtml(trade.tokenMint)}">Preview</button><button data-quick-trade-token="${escapeHtml(trade.tokenMint)}">${escapeHtml(activePresetButtonLabel())}</button>` : ""}
            ${trade.signature ? `<a href="https://solscan.io/tx/${encodeURIComponent(trade.signature)}" target="_blank" rel="noreferrer">Tx</a>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function liveTradesHtml() {
  return `
    <section class="terminal-layout live-trades-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Live Trades</h3>
            <p>Recent web trade activity, fast token preview, and active preset buys stay connected to the terminal.</p>
          </div>
          <span>${state.pnl?.trades?.length || 0} trades</span>
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-top-refresh-wallet>Refresh Trades</button>
          <button data-tab="terminal">Command Center</button>
          <button data-tab="pnl">PnL</button>
        </div>
        ${liveTradeRowsHtml(25)}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${terminalTradePanelHtml(selectedTerminalTokenRow())}
      </aside>
    </section>
  `;
}

function stopLossAuditHtml() {
  const plans = [state.tradePlanResult, state.bundleResult, state.volumeResult, state.sniperResult, state.kolResult, state.launchResult].filter(Boolean);
  if (!plans.length) {
    return emptyState("No active audit item loaded", "Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Browser wallets are manual-only; managed wallets can be watched by SlimeWire while your session is active.");
  }
  return `
    <div class="table-list compact-table">
      ${plans.map((plan) => `
        <article class="row-card">
          <div class="row-main">
            <strong>${escapeHtml(plan.label || plan.type || "Managed Exit")}</strong>
            <span>Status: ${escapeHtml(plan.status || "watching")} | TP ${escapeHtml(plan.takeProfitSummary || plan.takeProfitPct || "off")} | SL ${escapeHtml(plan.stopLossSummary || plan.stopLossPct || "off")}</span>
            <small>Execution mode: managed wallet watcher when SlimeWire is active. Browser-connected wallets require manual signing.</small>
            ${plan.message ? `<small>${escapeHtml(plan.message)}</small>` : ""}
          </div>
          <div class="card-actions compact">
            <button data-top-refresh-wallet>Refresh Status</button>
            <button data-tab="positions">Positions</button>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function balanceReconciliationHtml() {
  const balanceErrors = state.balances.filter((row) => row.error);
  const warningCount = state.balances.reduce((sum, row) => sum + Number(row.warnings?.length || 0), 0);
  return `
    <section class="account-check-card reconciliation-card">
      <div>
        <h3>Balance Reconciliation</h3>
        <p>Compares the app wallet list against the latest on-chain SOL and SPL token refresh. Positions are kept visible even when price data is unavailable.</p>
        <small>Last updated: ${escapeHtml(ageTextFromSeconds(secondsSince(state.lastWalletRefreshAt)))} | Warnings: ${warningCount} | Errors: ${balanceErrors.length}</small>
      </div>
      <button class="primary" data-top-refresh-wallet>${state.walletRefreshing ? "Refreshing..." : "Force Refresh"}</button>
    </section>
    ${balanceErrors.length ? `
      <div class="table-list compact-table">
        ${balanceErrors.map((row) => `<article class="row-card"><strong>${escapeHtml(row.label || `Wallet ${row.index}`)}</strong><span>${escapeHtml(row.error)}</span></article>`).join("")}
      </div>
    ` : emptyState("Wallet state synced", "No balance errors reported by the last refresh.")}
  `;
}

function txAuditHtml(compact = false) {
  const audit = state.terminalTxAudit;
  return `
    <section class="${compact ? "tx-audit compact" : "terminal-layout tx-audit"}">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Tx Audit</h3>
            <p>Paste a Solana transaction signature to see finalized status, SOL/token deltas, created token accounts, programs, logs, and whether balances should refresh.</p>
          </div>
          <span>${state.terminalTxLoading ? "Fetching" : "Ready"}</span>
        </div>
        <div class="inline-action">
          <input data-tx-audit-signature type="text" placeholder="Solana transaction signature" value="${escapeHtml(state.terminalTxSignature || "")}">
          <button class="primary" data-run-tx-audit>${state.terminalTxLoading ? "Auditing..." : "Audit Tx"}</button>
        </div>
        ${audit ? txAuditResultHtml(audit) : emptyState("No transaction loaded", "Use this when a wallet balance looks stale or a trade needs accounting review.")}
      </main>
      ${compact ? "" : `<aside class="trade-side order-ticket-stack">${stopLossAuditHtml()}${balanceReconciliationHtml()}</aside>`}
    </section>
  `;
}

function txAuditResultHtml(audit) {
  if (audit.error) return `<article class="row-card"><strong>Audit failed</strong><span>${escapeHtml(audit.error)}</span></article>`;
  return `
    <section class="pnl-summary tx-summary">
      <div><span>Status</span><strong>${escapeHtml(audit.status || "unknown")}</strong></div>
      <div><span>Fee</span><strong>${escapeHtml(audit.feeSol || "0")} SOL</strong></div>
      <div><span>Slot</span><strong>${escapeHtml(audit.slot || "n/a")}</strong></div>
      <div><span>Refresh</span><strong>${audit.shouldRefreshBalances ? "Yes" : "No"}</strong></div>
    </section>
    <div class="table-list compact-table">
      <article class="row-card"><strong>Fee payer</strong><code>${escapeHtml(audit.feePayer || "unknown")}</code></article>
      <article class="row-card"><strong>SOL deltas</strong><span>${(audit.solDeltas || []).map((row) => `${shortAddress(row.account)} ${row.deltaSol}`).join(" | ") || "none"}</span></article>
      <article class="row-card"><strong>Token deltas</strong><span>${(audit.tokenDeltas || []).map((row) => `${shortAddress(row.owner || row.account)} ${row.deltaUiAmount} ${shortAddress(row.mint)}`).join(" | ") || "none"}</span></article>
      <article class="row-card"><strong>Created token accounts</strong><span>${(audit.createdAssociatedTokenAccounts || []).map((row) => shortAddress(row.account)).join(", ") || "none detected"}</span></article>
      <article class="row-card"><strong>Programs</strong><span>${(audit.programs || []).join(", ") || "n/a"}</span></article>
      ${audit.explorerUrl ? `<article class="row-card"><strong>Explorer</strong><a href="${escapeHtml(audit.explorerUrl)}" target="_blank" rel="noreferrer">Open Solscan</a></article>` : ""}
    </div>
    <details class="raw-log-panel">
      <summary>Raw logs</summary>
      <pre>${escapeHtml((audit.logs || []).join("\n") || "No logs returned.")}</pre>
    </details>
  `;
}

function livePairsHtml() {
  const activeLivePairs = currentLivePairs();
  const rows = activeLivePairs?.rows || [];
  const activeBucketLabel = LIVE_PAIR_BUCKETS.find(([bucket]) => bucket === state.livePairBucket)?.[1] || "Live";
  const lastUpdatedAt = currentLivePairsUpdatedAt();
  const bucketLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
  const status = bucketLoading
    ? "Scanning live pairs..."
    : activeLivePairs?.message || "Live Pairs refreshes while this tab is open.";
  return `
    <section class="terminal-layout live-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Live Pairs</h3>
            <p>Newest Pump/new-pair listings with fast metadata refresh. Trade safety checks run before any buy.</p>
          </div>
          <span>${escapeHtml(activeBucketLabel)} | ${escapeHtml(rows.length)} shown</span>
        </div>
        <div class="mode-row terminal-modes live-pair-buckets">
          ${LIVE_PAIR_BUCKETS.map(([bucket, label]) => {
            const count = state.livePairsByBucket[bucket]?.rows?.length;
            const suffix = Number.isFinite(Number(count)) ? ` (${count})` : "";
            return `<button data-live-pair-bucket="${bucket}" data-active="${state.livePairBucket === bucket}">${label}${suffix}</button>`;
          }).join("")}
        </div>
        <div class="live-control-strip">
          <div>
            <strong>${escapeHtml(activeBucketLabel)} Feed</strong>
            <span>${escapeHtml(livePairBucketDescription(state.livePairBucket))}</span>
          </div>
          <div class="card-actions compact">
            <label class="compact-label">Sort
              <select data-terminal-sort>
                ${LIVE_PAIR_SORTS.map(([value, label]) => `<option value="${value}" ${state.terminalSort === value ? "selected" : ""}>${label}</option>`).join("")}
              </select>
            </label>
            <button class="primary" data-refresh-live-pairs>${bucketLoading ? "Scanning..." : "Refresh Feed"}</button>
            <button data-tab="trade">Trade</button>
            <button data-tab="bundle">Bundle</button>
            <button data-tab="volume">Volume</button>
          </div>
          <small>${escapeHtml(status)}${lastUpdatedAt ? ` Updated ${escapeHtml(formatDate(lastUpdatedAt))}.` : ""}</small>
        </div>
        ${rows.length ? livePairRowsHtml(rows) : emptyState("No live pairs yet", "Keep this tab open or tap Refresh Live. Trade safety checks run before any buy.")}
      </main>
    </section>
  `;
}

function livePairBucketDescription(bucket) {
  const descriptions = {
    live: "Fresh launch feed. Focuses on pairs that just appeared, usually under 10 minutes old.",
    under1h: "Pairs created in the last 60 minutes, with lower-quality tiny caps pushed down.",
    under3h: "Pairs created in the last 3 hours, refreshed with broader liquidity and volume data.",
    under1d: "Pairs created in the last 24 hours, ranked by current liquidity, volume, momentum, and risk."
  };
  return descriptions[bucket] || descriptions.live;
}

function watchlistHtml() {
  if (!state.user || !state.token) {
    return `${createWalletSection()}${emptyState("Create or log in to save a watchlist", "You can browse scanners as a guest. Tap Watch after creating an account to save coins here.")}`;
  }
  const rows = state.watchlist?.rows || [];
  return `
    <section class="terminal-layout watchlist-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Watchlist</h3>
            <p>Saved coins refresh while this tab is open. Use Trade or Bundle presets when you are ready.</p>
          </div>
          <span>${rows.length} watched</span>
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-watchlist>${state.watchlistLoading ? "Refreshing..." : "Refresh Watchlist"}</button>
          <button data-tab="live">Live Pairs</button>
          <button data-tab="sniper">Sniper</button>
          <button data-tab="kol">KOL Tracker</button>
        </div>
        ${rows.length ? tokenSignalRowsHtml(rows, { context: "watchlist", shareBuilder: (row) => manualCoinWatchShareText(row.tokenMint) }) : emptyState("No watched coins yet", "Tap Watch on Live Pairs, Sniper, or KOL signals to save coins here.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        <article class="order-ticket">
          <h3>Fast Actions</h3>
          <p>Rows use your saved Trade and Bundle presets. Edit presets from the Trade or Bundle tabs any time.</p>
          <div class="card-actions action-grid">
            <button data-tab="trade">Trade Presets</button>
            <button data-tab="bundle">Bundle Presets</button>
          </div>
        </article>
      </aside>
    </section>
  `;
}

function livePairRowsHtml(rows) {
  return tokenSignalRowsHtml(rows, { context: "live", shareBuilder: livePairShareText });
}

function tokenSignalRowsHtml(rows, options = {}) {
  const shareBuilder = options.shareBuilder || livePairShareText;
  return `
    ${options.hideToolbar ? "" : fastPresetToolbarHtml(options.context || "scanner")}
    <div class="signal-list">
      <div class="signal-header">
        <span>Pair Info</span>
        <span>Age</span>
        <span>Current Liquidity</span>
        <span>FDV / MC</span>
        <span>Txns</span>
        <span>Volume</span>
        <span>Action</span>
      </div>
      ${rows.map((row, index) => tokenSignalRowHtml(row, index, { ...options, shareText: shareBuilder(row) })).join("")}
    </div>
  `;
}

function tokenSignalRowHtml(row, index, options = {}) {
  const watched = isTokenWatched(row.tokenMint);
  const shareText = options.shareText || livePairShareText(row);
  const actionLabel = options.primaryActionLabel || "Trade";
  const primaryAction = options.primaryAction || "quickTrade";
  const watchButton = options.context === "watchlist"
    ? `<button type="button" data-unwatch-token="${escapeHtml(row.tokenMint)}">Remove</button>`
    : `<button type="button" class="watch-action" data-watch-token="${escapeHtml(row.tokenMint)}" data-watch-symbol="${escapeHtml(row.symbol || "")}" data-watch-name="${escapeHtml(row.name || "")}" data-watch-image="${escapeHtml(row.imageUrl || "")}">${watched ? "Saved" : "Watch"}</button>`;
  return `
    <article class="signal-row">
      <div class="signal-token">
        ${livePairAvatarHtml(row)}
        <div>
          <div class="signal-name-row">
            <strong>${escapeHtml(row.symbol || row.shortMint || shortAddress(row.tokenMint))}</strong>
            <small>${escapeHtml(row.name || row.category || "Token")}</small>
          </div>
          <button type="button" class="ca-copy" data-copy="${escapeHtml(row.tokenMint)}">${escapeHtml(shortAddress(row.tokenMint))}</button>
          <div class="signal-links">
            <a href="${escapeHtml(row.dexUrl || dexUrl(row.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
            ${row.pumpUrl ? `<a href="${escapeHtml(row.pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>` : ""}
            ${row.twitterUrl ? `<a href="${escapeHtml(row.twitterUrl)}" target="_blank" rel="noreferrer" title="X">X</a>` : ""}
            ${row.telegramUrl ? `<a href="${escapeHtml(row.telegramUrl)}" target="_blank" rel="noreferrer" title="Telegram">TG</a>` : ""}
            ${row.websiteUrl ? `<a href="${escapeHtml(row.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>` : ""}
            <button type="button" data-share-x data-share-text="${escapeHtml(shareText)}" title="Share to X">SHARE</button>
            ${telegramShareButton(shareText, "TG")}
            ${Number(row.sniperCount || 0) > 0 ? `<span class="sniper-pill" title="Sniper count">SCOPE ${escapeHtml(row.sniperCount)}</span>` : ""}
          </div>
        </div>
      </div>
      <div class="signal-cell"><span>${escapeHtml(row.pairAgeLabel || formatAgeFromRow(row) || "new")}</span><small>${escapeHtml(row.scalpSetup || row.momentum || `#${index + 1}`)}</small></div>
      <div class="signal-cell"><span>${escapeHtml(firstStatLabel(row.liquidityLabel, compactUsd(row.liquidityUsd)))}</span><small>${formatChangeHtml(row.h1)}</small></div>
      <div class="signal-cell"><span>${escapeHtml(firstStatLabel(row.marketCapLabel, compactUsd(row.marketCap)))}</span><small>${escapeHtml(row.category || row.signalType || "signal")}</small></div>
      <div class="signal-cell"><span>${escapeHtml(row.txnsLabel || row.winRateLabel || "n/a")}</span><small>${escapeHtml(row.bestPickScore ? `Score ${row.bestPickScore}/100` : row.valueLabel || row.smartMoney || "")}</small></div>
      <div class="signal-cell volume-windows">
        <span>${escapeHtml(firstStatLabel(row.volumeH1Label, row.volumeLabel, compactUsd(row.volumeH1)))}</span>
        <small>${volumeWindowItems(row).map(([label, value]) => `${label} ${value}`).join(" | ")}</small>
      </div>
      <div class="signal-actions">
        ${primaryAction === "snipe" ? `<button type="button" class="primary" data-sniper-buy="${escapeHtml(row.tokenMint)}">${escapeHtml(actionLabel)}</button>` : `<button type="button" class="primary" data-quick-trade-token="${escapeHtml(row.tokenMint)}">${escapeHtml(actionLabel)}</button>`}
        <button type="button" data-quick-bundle-token="${escapeHtml(row.tokenMint)}">Bundle</button>
        ${watchButton}
      </div>
    </article>
  `;
}

function isTokenWatched(tokenMint) {
  const mint = String(tokenMint || "");
  return Boolean((state.watchlist?.rows || []).some((row) => String(row.tokenMint) === mint));
}

function formatAgeFromRow(row) {
  const seconds = Number(row.pairAgeSeconds);
  if (Number.isFinite(seconds)) {
    if (seconds < 60) return `${Math.max(1, Math.floor(seconds))}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }
  const minutes = Number(row.pairAgeMinutes);
  if (Number.isFinite(minutes)) return `${Math.max(0, Math.round(minutes))}m`;
  return "";
}

function formatChangeHtml(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number) || number === 0) return "trend n/a";
  const sign = number > 0 ? "+" : "";
  return `<span class="${number >= 0 ? "positive" : "negative"}">${sign}${number.toFixed(Math.abs(number) >= 10 ? 0 : 1)}%</span>`;
}

function livePairAvatarHtml(row) {
  const label = String(row.symbol || row.name || row.shortMint || "?").trim().slice(0, 2).toUpperCase() || "?";
  if (row.imageUrl) {
    return `<div class="live-pair-avatar"><img src="${escapeHtml(row.imageUrl)}" alt="${escapeHtml(row.symbol || row.name || "Token")}" loading="lazy" onerror="this.hidden=true;"><span>${escapeHtml(label)}</span></div>`;
  }
  const mascot = tokenMascotIndex(row.tokenMint || row.symbol || row.name);
  return `<div class="live-pair-avatar fallback with-mascot"><img src="./assets/slimewire/png/token-mascots/token-mascot-${mascot}.png" alt="" aria-hidden="true"><span>${escapeHtml(label)}</span></div>`;
}

function tokenMascotIndex(value = "") {
  const text = String(value || "");
  let total = 0;
  for (let index = 0; index < text.length; index += 1) total += text.charCodeAt(index);
  return (total % 5) + 1;
}

function livePairShareText(row) {
  return `Live pair ${row.symbol || shortAddress(row.tokenMint)} spotted on SlimeWire: MC ${row.marketCapLabel || "n/a"}, liq ${row.liquidityLabel || "n/a"}, age ${row.pairAgeLabel || "new"}.`;
}

function sniperHtml() {
  const modes = [
    ["safe", "Safe Picks"],
    ["smart", "Smart Accumulation"],
    ["fast", "Fast Movers"],
    ["pumpsnipe", "PumpSnipe"],
    ["moonshot", "Low MC"],
    ["meme", "Narratives"],
    ["long", "Long Term"]
  ];
  const activeLabel = modes.find(([mode]) => mode === state.scanMode)?.[1] || "Picks";
  return `
    <section class="terminal-layout sniper-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>OgreSniper</h3>
            <p>${escapeHtml(sniperModeDescription(state.scanMode))}</p>
          </div>
          <span>${escapeHtml(activeLabel)}</span>
        </div>
        <div class="mode-row terminal-modes">
          ${modes.map(([mode, label]) => `<button data-scan-mode="${mode}" data-active="${state.scanMode === mode}">${label}</button>`).join("")}
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-scan>Refresh ${escapeHtml(activeLabel)}</button>
          <button data-tab="trade">Trade Desk</button>
          <button data-tab="bundle">Bundle</button>
          <button data-tab="live">Live Pairs</button>
        </div>
        ${state.scan ? sniperRowsHtml() : emptyState("No scan loaded", "Pick a mode or tap Refresh Picks.")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${sniperSetupHtml()}
      </aside>
    </section>
  `;
}

function sniperModeDescription(mode) {
  const descriptions = {
    safe: "Safer-looking picks with stronger liquidity, cleaner trend, lower risk flags, and no obvious dump/sell-pressure pattern.",
    smart: "Accumulation-style picks: buyer pressure, steady volume, and cleaner momentum without obvious sell pressure.",
    fast: "Fast movers with volume picking up and a cleaner short-term trend for quicker in-and-out trades.",
    pumpsnipe: "Very early pump-style launches, usually lower market cap, with enough volume/liquidity to attempt a quick trade.",
    moonshot: "Low market-cap picks targeting the 4k-40k range, with fallback up to 60k only when the cleaner low-cap pool is thin.",
    meme: "Narrative picks based on token metadata/keywords plus volume and trend checks. Add a social feed later for true social velocity.",
    long: "Longer-hold candidates with steadier accumulation signals and less short-term dump pressure."
  };
  return descriptions[mode] || descriptions.safe;
}

function sniperSetupHtml() {
  if (!state.wallets.length) {
    return emptyState("Create wallets to snipe", "Sniper can scan without wallets, but buying needs at least one managed wallet.");
  }

  const isPump = state.scanMode === "pumpsnipe";
  return `
    <section class="trade-card sniper-setup">
      <div class="trade-head">
        <div>
          <h3>${isPump ? "PumpSnipe Setup" : "Sniper Buy Setup"}</h3>
          <p>Select wallets once, then tap Snipe on any pick. Amount is per selected wallet.</p>
        </div>
      </div>
      <div class="wallet-checks">
        ${walletChecksHtml("sniper")}
      </div>
      ${walletGroupHtml("sniper")}
      <div class="volume-grid">
        <label>
          Buy Per Wallet
          <input data-sniper-amount type="number" min="0" step="0.01" value="0.1">
        </label>
        <label>
          Take Profit
          <select data-sniper-tp data-custom-select="sniper-tp">
            <option value="0">Off</option>
            <option value="15">+15%</option>
            <option value="25" ${isPump ? "" : "selected"}>+25%</option>
            <option value="40" ${isPump ? "selected" : ""}>+40%</option>
            <option value="50">+50%</option>
            <option value="100">+100%</option>
            <option value="250">+250%</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-tp-custom data-custom-for="sniper-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
        </label>
        <label>
          Stop Loss
          <select data-sniper-sl data-custom-select="sniper-sl">
            <option value="0">Off</option>
            <option value="8" selected>-8%</option>
            <option value="10">-10%</option>
            <option value="15">-15%</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-sl-custom data-custom-for="sniper-sl" type="text" placeholder="Custom SL %" hidden>
        </label>
        <label>
          Fallback Sell
          ${fallbackTimerSelectHtml("sniper-delay", "data-sniper-delay", isPump ? "3" : "5")}
        </label>
        <label>
          Repeat
          <select data-sniper-loop data-custom-select="sniper-loop">
            <option value="1" selected>1x</option>
            <option value="5">5x</option>
            <option value="10">10x</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-loop-custom data-custom-for="sniper-loop" type="number" min="1" max="10" step="1" placeholder="Custom 1-10" hidden>
        </label>
        <label>
          Repeat Wait
          ${repeatWaitSelectHtml("sniper-loop-delay", "data-sniper-loop-delay", "0")}
        </label>
        <label>
          Slippage
          <select data-sniper-slippage data-custom-select="sniper-slippage">
            <option value="300" ${isPump ? "selected" : ""}>3%</option>
            <option value="400" ${isPump ? "" : "selected"}>4%</option>
            <option value="500">5%</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-slippage-custom data-custom-for="sniper-slippage" type="number" min="1" max="5000" step="1" placeholder="Custom bps" hidden>
        </label>
      </div>
      ${walletExitTargetsHtml("sniper")}
      <p class="trade-status" data-sniper-status>${state.sniperResult ? escapeHtml(state.sniperResult.message || "Sniper plan armed.") : "Ready. Tap Snipe on a pick below."}</p>
      ${sniperResultHtml()}
    </section>
  `;
}

function sniperResultHtml() {
  const row = state.sniperResult;
  if (!row?.results?.length) return "";
  return `<div class="mini-results">${row.results.map((item) => `<span data-ok="${item.ok ? "true" : "false"}">${escapeHtml(item.message || item)}</span>`).join("")}</div>`;
}

function sniperRowsHtml() {
  if (!state.scan.rows.length) {
    return emptyState("No usable picks", "Refresh again or choose a different mode.");
  }
  return `
    <p class="scan-meta">${escapeHtml(state.scan.label)} | scored ${state.scan.scanned} | qualified ${state.scan.qualified} | mode-fit ${state.scan.modeFit} | display pool ${state.scan.displayPool || 0}</p>
    ${tokenSignalRowsHtml(state.scan.rows, { context: "sniper", primaryAction: "snipe", primaryActionLabel: "Snipe", shareBuilder: sniperShareText })}
  `;
}

function ogreTekWalletAddress() {
  return state.user?.connectedWallet?.publicKey || "";
}

function ogreTekMarket() {
  return state.ogreTek.markets.find((market) => market.symbol === state.ogreTek.selectedMarket) || state.ogreTek.markets[0] || null;
}

function ogreTekOrderRequest() {
  return {
    marketSymbol: state.ogreTek.selectedMarket,
    direction: state.ogreTek.direction,
    orderType: state.ogreTek.orderType,
    collateralUsd: state.ogreTek.collateralUsd,
    leverage: state.ogreTek.leverage,
    slippagePct: state.ogreTek.slippagePct,
    priorityFeeLamports: state.ogreTek.priorityFeeLamports,
    limitPrice: state.ogreTek.limitPrice,
    stopPrice: state.ogreTek.stopPrice
  };
}

function ogreTekValidation() {
  return validatePerpOrder(ogreTekOrderRequest(), ogreTekMarket(), state.ogreTek.account, ogreTekConfig);
}

function formatOgreUsd(value, digits = 2) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  if (Math.abs(number) >= 1_000_000_000) return `$${(number / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(number) >= 1_000_000) return `$${(number / 1_000_000).toFixed(2)}M`;
  if (Math.abs(number) >= 1_000) return `$${(number / 1_000).toFixed(1)}K`;
  return `$${number.toFixed(digits)}`;
}

function formatOgrePrice(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  if (number >= 1_000) return `$${number.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  return `$${number.toFixed(number >= 10 ? 2 : 4)}`;
}

function formatOgrePct(value, digits = 3) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "n/a";
  return `${number >= 0 ? "+" : ""}${number.toFixed(digits)}%`;
}

function ogreTekFreshness(value) {
  const time = Date.parse(value || "");
  if (!time) return "not loaded";
  const seconds = Math.max(0, Math.round((Date.now() - time) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m ago`;
}

function updateOgreTekDraftFromDom() {
  document.querySelectorAll("[data-ogre-tek-field]").forEach((field) => {
    const key = field.dataset.ogreTekField;
    if (!key || !(key in state.ogreTek)) return;
    if (field.type === "checkbox") state.ogreTek[key] = Boolean(field.checked);
    else state.ogreTek[key] = field.value;
  });
}

async function ensureOgreTekData() {
  if (!ogreTekConfig.enabled || state.ogreTek.loading || state.ogreTek.markets.length || state.ogreTek.error) return;
  await loadOgreTekData({ silent: true }).catch((error) => {
    state.ogreTek.error = publicErrorMessage(error.message);
    render({ force: true });
  });
}

async function loadOgreTekData({ force = false, silent = false } = {}) {
  if (!ogreTekConfig.enabled) return;
  if (state.ogreTek.loading && !force) return;
  state.ogreTek.loading = true;
  state.ogreTek.error = "";
  if (!silent) render({ force: true });
  try {
    const walletAddress = ogreTekWalletAddress();
    const [markets, account, positions, orders] = await Promise.all([
      perpsProvider.getMarkets(),
      perpsProvider.getAccount(walletAddress),
      perpsProvider.getPositions(walletAddress),
      perpsProvider.getOpenOrders(walletAddress)
    ]);
    state.ogreTek.markets = markets || [];
    state.ogreTek.account = account || null;
    state.ogreTek.positions = positions || [];
    state.ogreTek.orders = orders || [];
    if (!state.ogreTek.markets.some((market) => market.symbol === state.ogreTek.selectedMarket)) {
      state.ogreTek.selectedMarket = state.ogreTek.markets[0]?.symbol || "SOL-PERP";
    }
    state.ogreTek.status = `Updated ${new Date().toLocaleTimeString()}`;
  } catch (error) {
    state.ogreTek.error = publicErrorMessage(error.message);
  } finally {
    state.ogreTek.loading = false;
    render({ force: true });
  }
}

function ogreTekComingSoonHtml() {
  return `
    <section class="ogre-tek-page">
      <article class="ogre-tek-header ogre-tek-coming-soon">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Perp Mode is staged but hidden</h2>
          <p>Turn on the Ogre Tek feature flag when you are ready to test the perps terminal. Existing trade, bundle, volume, and sniper tools stay untouched.</p>
        </div>
        <span class="slime-status-badge">Coming Soon</span>
      </article>
    </section>
  `;
}

function ogreTekHtml() {
  if (ogreTekRouteStatus(ogreTekConfig) !== "enabled") return ogreTekComingSoonHtml();
  const connected = Boolean(ogreTekWalletAddress());
  const market = ogreTekMarket();
  const validation = ogreTekValidation();
  const quote = validation.quote;
  const account = state.ogreTek.account;
  const canReview = validation.ok && !state.ogreTek.loading;
  const providerStatus = state.ogreTek.error ? "Provider Error" : state.ogreTek.loading ? "Loading" : "Ready";
  const reviewButtonText = ogreTekConfig.demoMode ? "Review Demo Trade" : "Review Trade";
  const confirmButtonText = ogreTekConfig.demoMode ? "Confirm Demo Review" : "Confirm Order";
  const confirmDisabled = ogreTekConfig.demoMode
    ? !state.ogreTek.riskAccepted || !validation.ok
    : !canSubmitPerpOrder({ validation, riskAccepted: state.ogreTek.riskAccepted, demoMode: ogreTekConfig.demoMode });

  return `
    <section class="ogre-tek-page">
      <article class="ogre-tek-header">
        <div>
          <p class="eyebrow">Ogre Tek</p>
          <h2>Ogre Tek</h2>
          <p>Perpetual trading terminal for swamp-level execution.</p>
        </div>
        <div class="ogre-tek-badges">
          <span class="slime-status-badge">${ogreTekConfig.demoMode ? "Demo Mode" : "Live Adapter"}</span>
          <span class="slime-status-badge" data-ok="${connected ? "true" : "false"}">${connected ? "Wallet Connected" : "Wallet Disconnected"}</span>
          <span class="slime-status-badge" data-ok="${state.ogreTek.error ? "false" : "true"}">${escapeHtml(providerStatus)}</span>
        </div>
      </article>

      <article class="ogre-risk-copy">
        Perpetual futures are leveraged derivatives. You can lose your collateral and may be liquidated. This interface does not provide financial advice.
      </article>

      ${state.ogreTek.error ? `<p class="error dashboard-error">${escapeHtml(state.ogreTek.error)}</p>` : ""}

      <section class="ogre-tek-grid">
        <div class="ogre-tek-main">
          <article class="slime-panel ogre-market-panel">
            <div class="panel-title-row">
              <div>
                <h3>Perps Markets</h3>
                <p>${escapeHtml(state.ogreTek.status || "Demo market data loads when the tab opens.")}</p>
              </div>
              <button type="button" data-ogre-tek-refresh>${state.ogreTek.loading ? "Refreshing..." : "Refresh"}</button>
            </div>
            ${ogreMarketsHtml()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Open Positions</h3>
              <span>${state.ogreTek.positions.length} open</span>
            </div>
            ${ogrePositionsHtml()}
          </article>

          <article class="slime-panel">
            <div class="panel-title-row">
              <h3>Orders</h3>
              <span>Open, trigger, and history</span>
            </div>
            ${ogreOrdersHtml()}
          </article>
        </div>

        <aside class="ogre-tek-side">
          <article class="slime-panel ogre-ticket">
            <h3>Trading Ticket</h3>
            <div class="ogre-ticket-tabs">
              <button type="button" data-ogre-tek-side="long" data-active="${state.ogreTek.direction === "long"}">Long</button>
              <button type="button" data-ogre-tek-side="short" data-active="${state.ogreTek.direction === "short"}">Short</button>
            </div>
            <label>
              Market
              <select data-ogre-tek-field="selectedMarket">
                ${state.ogreTek.markets.map((item) => `<option value="${escapeHtml(item.symbol)}" ${item.symbol === state.ogreTek.selectedMarket ? "selected" : ""}>${escapeHtml(item.symbol)}</option>`).join("")}
              </select>
            </label>
            <label>
              Order Type
              <select data-ogre-tek-field="orderType">
                ${["market", "limit", "stop", "take-profit", "stop-loss"].map((type) => `<option value="${type}" ${state.ogreTek.orderType === type ? "selected" : ""}>${escapeHtml(type.replace("-", " ").toUpperCase())}</option>`).join("")}
              </select>
            </label>
            <div class="ogre-ticket-grid">
              <label>
                Collateral USD
                <input data-ogre-tek-field="collateralUsd" type="number" min="0" step="1" value="${escapeHtml(state.ogreTek.collateralUsd)}">
              </label>
              <label>
                Leverage
                <input data-ogre-tek-field="leverage" type="range" min="1" max="${escapeHtml(ogreTekConfig.maxLeverage)}" step="0.5" value="${escapeHtml(state.ogreTek.leverage)}">
                <span>${escapeHtml(state.ogreTek.leverage)}x max ${escapeHtml(ogreTekConfig.maxLeverage)}x</span>
              </label>
              <label>
                Limit Price
                <input data-ogre-tek-field="limitPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${escapeHtml(state.ogreTek.limitPrice)}">
              </label>
              <label>
                Stop / Trigger
                <input data-ogre-tek-field="stopPrice" type="number" min="0" step="0.01" placeholder="Optional" value="${escapeHtml(state.ogreTek.stopPrice)}">
              </label>
              <label>
                Slippage %
                <input data-ogre-tek-field="slippagePct" type="number" min="0" max="10" step="0.1" value="${escapeHtml(state.ogreTek.slippagePct)}">
              </label>
              <label>
                Priority Fee
                <input data-ogre-tek-field="priorityFeeLamports" type="number" min="0" step="1000" value="${escapeHtml(state.ogreTek.priorityFeeLamports)}">
              </label>
            </div>
            ${ogreQuoteHtml(quote, market)}
            ${ogreValidationHtml(validation)}
            <button class="primary" type="button" data-ogre-tek-review ${canReview ? "" : "disabled"}>${escapeHtml(reviewButtonText)}</button>
            <button type="button" data-ogre-tek-place-trade disabled>Place Trade</button>
            <button type="button" data-ogre-tek-demo-action="kill">Emergency Close / Kill Switch</button>
          </article>

          <article class="slime-panel ogre-account-panel">
            <h3>Risk Shield</h3>
            ${ogreAccountHtml(account)}
          </article>
        </aside>
      </section>
      ${state.ogreTek.reviewOpen ? ogreRiskModalHtml({ validation, quote, market, confirmButtonText, confirmDisabled }) : ""}
    </section>
  `;
}

function ogreMarketsHtml() {
  if (state.ogreTek.loading && !state.ogreTek.markets.length) return emptyState("Loading markets", "Ogre Tek is loading demo perps markets.");
  if (!state.ogreTek.markets.length) return emptyState("No markets available", "No allowed perps markets are available for this provider.");
  return `
    <div class="ogre-market-grid">
      ${state.ogreTek.markets.map((market) => `
        <button type="button" class="ogre-market-card" data-ogre-tek-market="${escapeHtml(market.symbol)}" data-active="${market.symbol === state.ogreTek.selectedMarket}">
          <span>${escapeHtml(market.symbol)}</span>
          <strong>${formatOgrePrice(market.indexPrice)}</strong>
          <small>Oracle ${formatOgrePrice(market.oraclePrice)} | 24h ${formatOgrePct(market.change24hPct, 2)}</small>
          <small>Funding ${formatOgrePct(market.fundingRatePct, 3)} | OI ${formatOgreUsd(market.openInterestUsd, 0)}</small>
          <small>Fresh ${escapeHtml(ogreTekFreshness(market.updatedAt))}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function ogreQuoteHtml(quote, market) {
  return `
    <div class="ogre-quote-grid">
      <span><small>Index</small><strong>${formatOgrePrice(market?.indexPrice)}</strong></span>
      <span><small>Position</small><strong>${formatOgreUsd(quote?.positionSizeUsd)}</strong></span>
      <span><small>Liquidation</small><strong>${formatOgrePrice(quote?.liquidationPrice)}</strong></span>
      <span><small>Fees</small><strong>${formatOgreUsd(quote?.takerFeeUsd)}</strong></span>
      <span><small>Funding Impact</small><strong>${formatOgreUsd(quote?.fundingImpactUsd)}</strong></span>
      <span><small>Max Loss</small><strong>${formatOgreUsd(quote?.maxLossUsd)}</strong></span>
    </div>
  `;
}

function ogreValidationHtml(validation) {
  const errors = validation.errors || [];
  const warnings = validation.warnings || [];
  if (!errors.length && !warnings.length) return `<p class="trade-status" data-ok="true">Ogre Guardrails passed for demo review.</p>`;
  return `
    <div class="ogre-risk-list">
      ${errors.map((error) => `<p data-kind="error">${escapeHtml(error)}</p>`).join("")}
      ${warnings.map((warning) => `<p data-kind="warning">${escapeHtml(warning)}</p>`).join("")}
    </div>
  `;
}

function ogrePositionsHtml() {
  if (!ogreTekWalletAddress()) return emptyState("Wallet disconnected", "Connect Phantom, Solflare, Backpack, or another detected Solana wallet to view perps account data.");
  if (!state.ogreTek.positions.length) return emptyState("No open positions", "Mock positions will appear here when the provider reports them.");
  return `
    <div class="ogre-tek-table">
      <div class="ogre-table-head"><span>Position</span><span>Size</span><span>Entry / Mark</span><span>Liq</span><span>PnL</span><span>Actions</span></div>
      ${state.ogreTek.positions.map((position) => `
        <div class="ogre-table-row">
          <span><strong>${escapeHtml(position.marketSymbol)}</strong><small>${escapeHtml(position.side)} | margin ${formatOgrePct(position.marginRatioPct, 1)}</small></span>
          <span>${formatOgreUsd(position.sizeUsd)}<small>collateral ${formatOgreUsd(position.collateralUsd)}</small></span>
          <span>${formatOgrePrice(position.entryPrice)}<small>mark ${formatOgrePrice(position.markPrice)}</small></span>
          <span>${formatOgrePrice(position.liquidationPrice)}</span>
          <span data-positive="${Number(position.unrealizedPnlUsd) >= 0}">${formatOgreUsd(position.unrealizedPnlUsd)}</span>
          <span class="ogre-row-actions">
            <button type="button" data-ogre-tek-demo-action="close">Close</button>
            <button type="button" data-ogre-tek-demo-action="collateral">Add Collateral</button>
            <button type="button" data-ogre-tek-demo-action="reduce">Reduce</button>
            <button type="button" data-ogre-tek-demo-action="tpsl">Set TP/SL</button>
          </span>
        </div>
      `).join("")}
    </div>
  `;
}

function ogreOrdersHtml() {
  if (!ogreTekWalletAddress()) return emptyState("Wallet disconnected", "Connect a wallet to load open and trigger orders.");
  if (!state.ogreTek.orders.length) return emptyState("No orders", "Open, trigger, and history orders will list here when a real adapter is configured.");
  return `
    <div class="ogre-tek-table ogre-tek-table-small">
      <div class="ogre-table-head"><span>Order</span><span>Trigger</span><span>Size</span><span>Status</span><span>Action</span></div>
      ${state.ogreTek.orders.map((order) => `
        <div class="ogre-table-row">
          <span><strong>${escapeHtml(order.marketSymbol)}</strong><small>${escapeHtml(order.type)} ${escapeHtml(order.side)}</small></span>
          <span>${formatOgrePrice(order.triggerPrice)}</span>
          <span>${formatOgreUsd(order.sizeUsd)}</span>
          <span>${escapeHtml(order.status || "open")}</span>
          <span><button type="button" data-ogre-tek-demo-action="cancel">Cancel</button></span>
        </div>
      `).join("")}
    </div>
  `;
}

function ogreAccountHtml(account) {
  if (!account?.connected) return `<p>Connect a wallet to load collateral, health, positions, and margin risk.</p>`;
  return `
    <div class="ogre-account-grid">
      <span><small>Wallet SOL</small><strong>${Number(account.walletBalanceSol || 0).toFixed(4)}</strong></span>
      <span><small>Available Collateral</small><strong>${formatOgreUsd(account.availableCollateralUsd)}</strong></span>
      <span><small>Used Margin</small><strong>${formatOgreUsd(account.usedMarginUsd)}</strong></span>
      <span><small>Unrealized PnL</small><strong>${formatOgreUsd(account.unrealizedPnlUsd)}</strong></span>
      <span><small>Health</small><strong>${escapeHtml(account.healthScore || 0)}/100</strong></span>
      <span><small>Daily Loss Limit</small><strong>${formatOgreUsd(account.dailyLossLimitUsd)}</strong></span>
      <span><small>Max Leverage</small><strong>${escapeHtml(account.maxLeverageAllowed || ogreTekConfig.maxLeverage)}x</strong></span>
      <span><small>Account Freshness</small><strong>${escapeHtml(ogreTekFreshness(account.updatedAt))}</strong></span>
    </div>
  `;
}

function ogreRiskModalHtml({ validation, quote, market, confirmButtonText, confirmDisabled }) {
  const order = validation.order || {};
  return `
    <div class="ogre-tek-modal-backdrop" role="presentation">
      <article class="ogre-tek-modal" role="dialog" aria-modal="true" aria-label="Ogre Tek risk confirmation">
        <div class="panel-title-row">
          <div>
            <h3>Risk Confirmation</h3>
            <p>Review every estimate before any wallet signature.</p>
          </div>
          <button type="button" data-ogre-tek-close-review>Close</button>
        </div>
        <div class="ogre-review-grid">
          <span><small>Direction</small><strong>${escapeHtml(order.direction || "long")}</strong></span>
          <span><small>Market</small><strong>${escapeHtml(order.marketSymbol || market?.symbol || "n/a")}</strong></span>
          <span><small>Collateral</small><strong>${formatOgreUsd(order.collateralUsd)}</strong></span>
          <span><small>Leverage</small><strong>${escapeHtml(order.leverage || 0)}x</strong></span>
          <span><small>Entry Estimate</small><strong>${formatOgrePrice(quote?.entryPrice)}</strong></span>
          <span><small>Liquidation Estimate</small><strong>${formatOgrePrice(quote?.liquidationPrice)}</strong></span>
          <span><small>Fees</small><strong>${formatOgreUsd(quote?.takerFeeUsd)}</strong></span>
          <span><small>Funding Rate</small><strong>${formatOgrePct(market?.fundingRatePct, 3)}</strong></span>
          <span><small>Max Loss Warning</small><strong>${formatOgreUsd(quote?.maxLossUsd)}</strong></span>
        </div>
        ${ogreValidationHtml(validation)}
        <label class="ogre-risk-check">
          <input type="checkbox" data-ogre-tek-risk-accepted ${state.ogreTek.riskAccepted ? "checked" : ""}>
          I understand leveraged perpetual trading can result in liquidation.
        </label>
        <div class="ogre-modal-actions">
          <button type="button" data-ogre-tek-close-review>Cancel</button>
          <button class="primary" type="button" data-ogre-tek-confirm-review ${confirmDisabled ? "disabled" : ""}>${escapeHtml(confirmButtonText)}</button>
        </div>
      </article>
    </div>
  `;
}

function emptyState(title, body) {
  return `<article class="empty"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></article>`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value) {
  const date = new Date(value || "");
  return Number.isNaN(date.getTime()) ? "unknown" : date.toLocaleString();
}

document.addEventListener("click", async (event) => {
  const source = event.target instanceof Element
    ? event.target
    : event.target?.parentElement;
  const target = source?.closest?.("button, a, [data-preview-token]");
  if (!target) return;

  if (target.matches("[data-nav-route]")) {
    event.preventDefault();
    navigateTo(target.dataset.navRoute || "/terminal", target.dataset.tab || null);
    return;
  }
  if (target.matches("[data-policy]")) {
    event.preventDefault();
    window.alert(policyText(target.dataset.policy === "privacy" ? "privacy" : "terms"));
    return;
  }
  if (target.matches("[data-top-refresh-wallet]")) {
    await refreshWalletState({ force: true });
    return;
  }
  if (target.matches("[data-ogre-tek-refresh]")) {
    await loadOgreTekData({ force: true }).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-ogre-tek-market]")) {
    state.ogreTek.selectedMarket = target.dataset.ogreTekMarket || state.ogreTek.selectedMarket;
    state.ogreTek.reviewOpen = false;
    render({ force: true });
    return;
  }
  if (target.matches("[data-ogre-tek-side]")) {
    state.ogreTek.direction = target.dataset.ogreTekSide === "short" ? "short" : "long";
    state.ogreTek.reviewOpen = false;
    render({ force: true });
    return;
  }
  if (target.matches("[data-ogre-tek-review]")) {
    updateOgreTekDraftFromDom();
    state.ogreTek.reviewOpen = true;
    state.ogreTek.riskAccepted = false;
    render({ force: true });
    return;
  }
  if (target.matches("[data-ogre-tek-close-review]")) {
    state.ogreTek.reviewOpen = false;
    state.ogreTek.riskAccepted = false;
    render({ force: true });
    return;
  }
  if (target.matches("[data-ogre-tek-confirm-review]")) {
    updateOgreTekDraftFromDom();
    const validation = ogreTekValidation();
    if (!state.ogreTek.riskAccepted || !validation.ok) {
      state.ogreTek.status = "Risk confirmation is incomplete.";
    } else if (ogreTekConfig.demoMode) {
      state.ogreTek.status = "Demo review confirmed. No live transaction was submitted.";
      state.ogreTek.reviewOpen = false;
      state.ogreTek.riskAccepted = false;
    } else {
      state.ogreTek.status = "Live perps adapter is not wired in this build.";
      state.ogreTek.reviewOpen = false;
      state.ogreTek.riskAccepted = false;
    }
    render({ force: true });
    return;
  }
  if (target.matches("[data-ogre-tek-demo-action]")) {
    const action = target.dataset.ogreTekDemoAction || "action";
    state.ogreTek.status = `Demo mode: ${action.replace(/-/g, " ")} is staged for the real provider adapter. No transaction was submitted.`;
    render({ force: true });
    return;
  }
  if (target.matches("[data-toggle-terminal-ticket]")) {
    state.terminalTradeCollapsed = !state.terminalTradeCollapsed;
    render({ force: true });
    return;
  }
  if (target.matches("[data-global-token-open]")) {
    const token = $("[data-global-token-search]")?.value?.trim() || "";
    if (token) {
      state.terminalToken = token;
      state.terminalAutoToken = token;
      state.tradeToken = token;
      state.bundleToken = token;
      state.volumeToken = token;
      state.smartChartToken = token;
      state.activeTab = "smartChart";
      state.route = "terminal";
      window.history.pushState({}, "", "/terminal/chart");
      render();
    }
    return;
  }
  if (target.matches("[data-preview-token]")) {
    const token = target.dataset.previewToken || "";
    if (token) {
      state.terminalToken = token;
      state.terminalAutoToken = token;
      state.tradeToken = token;
      state.bundleToken = token;
      state.volumeToken = token;
      render();
    }
    return;
  }
  if (target.matches("[data-terminal-subtab]")) {
    state.terminalSubtab = target.dataset.terminalSubtab || "positions";
    render();
    return;
  }
  if (target.matches("[data-position-sell]")) {
    await sellPositionPercent(target.dataset.positionSell || "", target.dataset.positionSellPercent || "100");
    return;
  }
  if (target.matches("[data-position-sell-custom]")) {
    const percent = window.prompt("Sell what percent of this position?", "100");
    if (percent) await sellPositionPercent(target.dataset.positionSellCustom || "", percent);
    return;
  }
  if (target.matches("[data-run-tx-audit]")) {
    await runTxAudit();
    return;
  }

  if (target.matches("[data-connect-login-toggle]")) {
    state.loginCollapsed = !state.loginCollapsed;
    render();
    return;
  }
  if (target.matches("[data-connect-password-login]")) {
    await passwordLogin();
    return;
  }
  if (target.matches("[data-connect-create-account]")) {
    await createWebAccount();
    return;
  }
  if (target.matches("[data-connect-create-wallet]")) {
    await createAccountAndOpenWallets();
    return;
  }
  if (target.matches("[data-web-signup]")) await createWebAccount();
  if (target.matches("[data-web-password-login]")) await passwordLogin();
  if (target.matches("[data-web-signup-connect]")) await createAccountAndConnectWallet();
  if (target.matches("[data-open-login]")) {
    state.loginCollapsed = !state.loginCollapsed;
    render();
  }
  if (target.matches("[data-browse-guest]")) {
    state.loginCollapsed = true;
    state.route = "terminal";
    state.activeTab = "terminal";
    window.history.pushState({}, "", "/terminal");
    render();
    await Promise.allSettled([
      refreshLivePairBuckets({ silent: true }),
      loadKolScan(state.kolMode, "", { silent: true })
    ]);
    render();
    return;
  }
  if (target.matches("[data-logout]")) await logout();
  if (target.matches("[data-connect-x]")) await connectXAccount();
  if (target.matches("[data-open-x-login]")) openXLoginOrProfile();
  if (target.matches("[data-clear-x]")) await disconnectXAccount();
  if (target.matches("[data-save-login-credentials]")) await saveLoginCredentials();
  if (target.matches("[data-save-referral]")) await saveReferralSettings();
  if (target.matches("[data-save-trader-board]")) await saveTraderBoardSettings();
  if (target.matches("[data-use-x-avatar]")) await useXProfileAvatar();
  if (target.matches("[data-clear-avatar]")) await updateProfileAvatar({ clear: true }, "Removing PFP...");
  if (target.matches("[data-preset-avatar]")) {
    const status = $("[data-avatar-status]");
    writeText(status, "Loading preset PFP...");
    try {
      const avatarDataUrl = await presetAvatarToDataUrl(target.dataset.presetAvatar);
      await updateProfileAvatar({
        avatarDataUrl,
        avatarSource: target.dataset.avatarLabel || "preset"
      }, "Saving preset PFP...");
    } catch (error) {
      writeText(status, error.message);
      setError(error.message);
    }
  }
  if (target.matches("[data-launch-coin-save]")) {
    saveLaunchCoinDraft();
    return;
  }
  if (target.matches("[data-launch-coin-submit]")) {
    await submitLaunchCoin();
    return;
  }
  if (target.matches("[data-launch-coin-use-ca]")) {
    await useLaunchCoinMint();
    return;
  }
  if (target.matches("[data-connect-wallet]")) await connectBrowserWallet(target.dataset.connectWallet);
  if (target.matches("[data-disconnect-wallet]")) await disconnectBrowserWallet();
  if (target.matches("[data-share-x]")) openXShare(target.dataset.shareText || "");
  if (target.matches("[data-share-watch-token-btn]")) shareManualWatch("token");
  if (target.matches("[data-share-watch-kol-btn]")) shareManualWatch("kol");
  if (target.matches("[data-save-preset]")) {
    await savePreset(target.dataset.savePreset);
    return;
  }
  if (target.matches("[data-save-fast-preset]")) {
    await savePreset(target.dataset.saveFastPreset, "fast");
    return;
  }
  if (target.matches("[data-use-preset]")) {
    usePreset(target.dataset.usePreset, target.dataset.presetId || "");
    return;
  }
  if (target.matches("[data-edit-preset]")) {
    editPreset(target.dataset.editPreset, target.dataset.presetId || "");
    return;
  }
  if (target.matches("[data-edit-selected-preset]")) {
    const kind = target.dataset.editSelectedPreset === "bundle" ? "bundle" : "trade";
    const id = kind === "bundle" ? state.selectedBundlePresetId : state.selectedTradePresetId;
    if (id && id !== "custom") {
      editPreset(kind, id);
    } else {
      openPresetEditorTab(kind);
    }
    return;
  }
  if (target.matches("[data-cancel-preset-edit]")) {
    setEditingPreset(target.dataset.cancelPresetEdit, "");
    render();
    return;
  }
  if (target.matches("[data-delete-preset]")) {
    await deletePreset(target.dataset.deletePreset, target.dataset.presetId || "");
    return;
  }
  if (target.matches("[data-quick-trade-token]")) await quickPresetTrade(target.dataset.quickTradeToken || "");
  if (target.matches("[data-quick-bundle-token]")) await quickPresetBundle(target.dataset.quickBundleToken || "");
  if (target.matches("[data-smart-chart-token]")) {
    const tokenMint = target.dataset.smartChartToken || "";
    state.smartChartToken = tokenMint;
    state.terminalToken = tokenMint;
    state.tradeToken = tokenMint;
    state.bundleToken = tokenMint;
    state.volumeToken = tokenMint;
    state.activeTab = "smartChart";
    state.route = "terminal";
    window.history.pushState({}, "", "/terminal/chart");
    render();
    return;
  }
  if (target.matches("[data-smart-chart-open]")) {
    const tokenMint = String($("[data-smart-chart-input]")?.value || "").trim();
    if (!tokenMint) {
      setError("Paste a token CA first.");
      return;
    }
    state.smartChartToken = tokenMint;
    state.terminalToken = tokenMint;
    state.tradeToken = tokenMint;
    state.bundleToken = tokenMint;
    state.volumeToken = tokenMint;
    state.activeTab = "smartChart";
    state.route = "terminal";
    window.history.pushState({}, "", "/terminal/chart");
    render();
    return;
  }
  if (target.matches("[data-refresh-feeds]")) {
    await refreshLivePairBuckets({ force: true }).catch((error) => setError(error.message));
    if (!state.kolScan) await loadKolScan().catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-watch-token]")) await updateWatchlist("add", target);
  if (target.matches("[data-unwatch-token]")) await updateWatchlist("remove", target);
  if (target.matches("[data-pnl-card]")) {
    try {
      await downloadPnlCard(target.dataset.pnlCard);
    } catch (error) {
      setError(error.message);
    }
  }
  if (target.matches("[data-share-pnl-card]")) {
    await sharePnlCard(target.dataset.sharePnlCard, target.dataset.shareText || "");
  }
  if (target.matches("[data-create-wallets]")) await createWalletSet();
  if (target.matches("[data-restore-backup]")) await restoreWalletBackup();
  if (target.matches("[data-export-backup]")) await exportWalletBackup();
  if (target.matches("[data-import-wallet]")) await importWallet();
  if (target.matches("[data-remove-wallet]")) await removeManagedWallet(target.dataset.removeWallet || "", target.dataset.walletLabel || "");
  if (target.matches("[data-download]")) {
    const file = state.downloads?.[target.dataset.download];
    if (file) downloadText(file.filename, file.text);
  }
  if (target.matches("[data-trade-buy-quick]")) {
    await executeWebBuy(target.dataset.tradeBuyQuick);
  }
  if (target.matches("[data-trade-buy-max]")) {
    await executeWebBuy(null, "max");
  }
  if (target.matches("[data-trade-buy-custom]")) {
    await executeWebBuy($("[data-buy-custom]")?.value);
  }
  if (target.matches("[data-trade-sell-quick]")) {
    await executeWebSell(target.dataset.tradeSellQuick);
  }
  if (target.matches("[data-trade-sell-custom]")) {
    await executeWebSell($("[data-sell-custom]")?.value);
  }
  if (target.matches("[data-trade-plan-start]")) {
    await createTradePlan();
  }
  if (target.matches("[data-volume-start]")) {
    await createVolumePlan();
  }
  if (target.matches("[data-sniper-buy]")) {
    await createSniperEntry(target.dataset.sniperBuy);
  }
  if (target.matches("[data-kol-mode]")) {
    state.kolWallet = "";
    await loadKolScan(target.dataset.kolMode).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-refresh]")) {
    await loadKolScan(state.kolMode, state.kolWallet).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-wallet-scan]")) {
    await loadKolScan(state.kolMode, $("[data-kol-wallet]")?.value || "").catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-scan-wallet]")) {
    await loadKolScan(state.kolMode, target.dataset.kolScanWallet || "").catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-copy]")) {
    await createKolCopyPlan(target.dataset.kolCopy);
    return;
  }
  if (target.matches("[data-kol-copy-wallet]")) {
    await createKolCopyWallet(target.dataset.kolCopyWallet || "");
    return;
  }
  if (target.matches("[data-kol-trade]")) {
    state.tradeToken = target.dataset.kolTrade || "";
    state.activeTab = "trade";
    render();
    return;
  }
  if (target.matches("[data-kol-bundle]")) {
    state.bundleToken = target.dataset.kolBundle || "";
    state.activeTab = "bundle";
    render();
    return;
  }
  if (target.matches("[data-bundle-buy]")) {
    await executeBundle("buy");
  }
  if (target.matches("[data-bundle-sell]")) {
    await executeBundle("sell");
  }
  if (target.matches("[data-bundle-plan]")) {
    await executeBundlePlan();
  }
  if (target.matches("[data-launch-start]")) {
    await startLaunchWatch();
  }
  if (target.matches("[data-launch-cancel]")) {
    await cancelLaunchWatch(target.dataset.launchCancel);
  }
  if (target.matches("[data-use-token]")) {
    state.tradeToken = target.dataset.useToken || "";
    state.volumeToken = target.dataset.useToken || "";
    state.bundleToken = target.dataset.useToken || "";
    state.activeTab = "trade";
    render();
  }
  if (target.matches("[data-use-token-bundle]")) {
    state.bundleToken = target.dataset.useTokenBundle || "";
    state.tradeToken = state.bundleToken;
    state.volumeToken = state.bundleToken;
    state.activeTab = "bundle";
    render();
  }
  if (target.matches("[data-use-token-volume]")) {
    state.volumeToken = target.dataset.useTokenVolume || "";
    state.tradeToken = state.volumeToken;
    state.bundleToken = state.volumeToken;
    state.activeTab = "volume";
    render();
  }
  if (target.matches("[data-refresh-all]")) {
    if (!state.user || !state.token) {
      if (state.activeTab === "live" || state.activeTab === "terminal") await refreshLivePairBuckets({ silent: true }).catch((error) => setError(error.message));
      else if (state.activeTab === "sniper") await loadScan().catch((error) => setError(error.message));
      else if (state.activeTab === "kol") await loadKolScan().catch((error) => setError(error.message));
      else setError("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades.");
    } else {
      refreshWalletState({ force: true }).catch((error) => setError(error.message));
    }
  }

  if (target.matches("[data-tab]")) {
    state.activeTab = target.dataset.tab;
    if (state.activeTab === "ogreTek") {
      state.route = "terminal";
      window.history.pushState({}, "", "/ogre-tek");
      await loadOgreTekData({ silent: true }).catch((error) => setError(error.message));
      render();
      return;
    }
    if (state.route !== "terminal") {
      state.route = "terminal";
      window.history.pushState({}, "", "/terminal");
    }
    if (state.activeTab === "smartChart") {
      window.history.pushState({}, "", "/terminal/chart");
    } else if (state.activeTab === "slimeScope") {
      window.history.pushState({}, "", "/terminal/slime-scope");
    } else if (window.location.pathname.includes("/terminal/chart") || window.location.pathname.includes("/terminal/slime-scope")) {
      window.history.pushState({}, "", "/terminal");
    }
    if (state.activeTab === "sniper" && !state.scan) {
      await loadScan().catch((error) => setError(error.message));
    }
    if (state.activeTab === "slimeScope") {
      await refreshLivePairBuckets({ silent: true }).catch((error) => setError(error.message));
    } else if ((state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "smartChart") && !state.livePairsByBucket[state.livePairBucket]) {
      await refreshLivePairBuckets().catch((error) => setError(error.message));
    }
    if ((state.activeTab === "kol" || state.activeTab === "terminal" || state.activeTab === "smartChart") && !state.kolScan) {
      await loadKolScan().catch((error) => setError(error.message));
    }
    if (state.activeTab === "watchlist" && state.user && state.token) {
      await loadWatchlist({ silent: true }).catch((error) => setError(error.message));
    }
    render();
  }

  if (target.matches("[data-refresh-scan]")) {
    await loadScan().catch((error) => setError(error.message));
  }

  if (target.matches("[data-refresh-live-pairs]")) {
    await refreshLivePairBuckets({ force: true }).catch((error) => setError(error.message));
  }

  if (target.matches("[data-refresh-watchlist]")) {
    await loadWatchlist().catch((error) => setError(error.message));
  }

  if (target.matches("[data-live-pair-bucket]")) {
    state.livePairBucket = target.dataset.livePairBucket || "live";
    state.livePairs = currentLivePairs();
    state.livePairsLastUpdatedAt = currentLivePairsUpdatedAt();
    render();
    await refreshLivePairBuckets({ force: true }).catch((error) => setError(error.message));
  }

  if (target.matches("[data-slime-scope-mode]")) {
    state.slimeScopeMode = target.dataset.slimeScopeMode || "new";
    state.activeTab = "slimeScope";
    render();
    await refreshLivePairBuckets({ force: true }).catch((error) => setError(error.message));
  }

  if (target.matches("[data-scan-mode]")) {
    await loadScan(target.dataset.scanMode).catch((error) => setError(error.message));
  }

  const copyValue = target.getAttribute("data-copy");
  if (copyValue) {
    const originalLabel = target.getAttribute("data-copy-label") || target.textContent || "Copy";
    await navigator.clipboard.writeText(copyValue);
    writeText(target, "Copied");
    setTimeout(() => { writeText(target, originalLabel); }, 1000);
  }
});

document.addEventListener("change", async (event) => {
  const target = event.target;
  if (target?.matches?.("[data-custom-select]")) {
    syncCustomFields();
    syncTimerSellNoTimer(target);
  }
  if (target?.matches?.("[data-fast-trade-preset]")) {
    const nextPresetId = target.value || "";
    if (nextPresetId === "custom") {
      openPresetEditorTab("trade");
      return;
    }
    state.selectedTradePresetId = nextPresetId;
    state.fastTradePresetStatus = state.selectedTradePresetId
      ? "Trade preset selected. Tap Trade or Buy on a token row to use it."
      : "No fast trade preset selected. Token rows open the manual Trade form.";
    render();
  }
  if (target?.matches?.("[data-quick-buy-amount]")) {
    state.quickBuyAmountOverride = normalizedQuickBuyAmount(target.value);
    target.value = state.quickBuyAmountOverride;
    syncQuickBuyActionLabels();
  }
  if (target?.matches?.("[data-fast-bundle-preset]")) {
    const nextPresetId = target.value || "";
    if (nextPresetId === "custom") {
      openPresetEditorTab("bundle");
      return;
    }
    state.selectedBundlePresetId = nextPresetId;
    state.fastBundlePresetStatus = state.selectedBundlePresetId
      ? "Bundle preset selected. It will not buy until you tap a Bundle button."
      : "No fast bundle preset selected. Bundle rows open the manual Bundle form.";
    render();
  }
  if (target?.matches?.("[data-terminal-sort]")) {
    state.terminalSort = target.value || "best";
    await refreshLivePairBuckets({ silent: true }).catch((error) => setError(error.message));
    render();
  }
  if (target?.matches?.("[data-ogre-tek-field]")) {
    updateOgreTekDraftFromDom();
    state.ogreTek.reviewOpen = false;
    render({ force: true });
  }
  if (target?.matches?.("[data-ogre-tek-risk-accepted]")) {
    state.ogreTek.riskAccepted = Boolean(target.checked);
    render({ force: true });
  }
  if (target?.matches?.("[data-restore-file]")) {
    await readRestoreFile(target);
  }
  if (target?.matches?.("[data-avatar-file]")) {
    await uploadProfileAvatar(target);
  }
});

document.addEventListener("focusout", () => {
  setTimeout(flushDeferredRender, 50);
});

document.addEventListener("input", (event) => {
  const target = event.target;
  if (target?.matches?.("[data-quick-buy-amount]")) {
    state.quickBuyAmountOverride = String(target.value || "").replace(/[^0-9.]/g, "").slice(0, 12);
    syncQuickBuyActionLabels();
    return;
  }
  if (target?.matches?.("[data-smart-chart-zoom]")) {
    state.smartChartZoom = Math.min(120, Math.max(65, Number(target.value) || 80));
    const label = target.closest(".smart-chart-zoom")?.querySelector("strong");
    if (label) writeText(label, `${state.smartChartZoom}%`);
    const frame = target.closest(".smart-chart-main")?.querySelector(".smart-chart-frame");
    if (frame) frame.style.setProperty("--smart-chart-scale", String(state.smartChartZoom / 100));
    return;
  }
  if (!target?.matches?.("[data-ogre-tek-field]")) return;
  updateOgreTekDraftFromDom();
  if (target.type === "range") render({ force: true });
});

function resumeLiveFeeds() {
  if (state.route !== "terminal") return;
  if (state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "slimeScope") {
    refreshLivePairBuckets({ silent: true }).catch((error) => setError(error.message));
    scheduleLivePairsAutoRefresh();
  }
  if ((state.activeTab === "kol" || state.activeTab === "terminal") && !state.kolWallet) {
    loadKolScan(state.kolMode, "", { silent: true }).catch((error) => setError(error.message));
    scheduleKolAutoRefresh();
  }
  if ((state.activeTab === "watchlist" || state.activeTab === "terminal") && state.user && state.token) {
    loadWatchlist({ silent: true }).catch((error) => setError(error.message));
    scheduleWatchlistAutoRefresh();
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeLiveFeeds();
});

window.addEventListener("focus", resumeLiveFeeds);

async function initializeApp() {
  await loadSession();
  if (state.route === "terminal") {
    await Promise.allSettled([
      refreshLivePairBuckets({ silent: true }),
      loadKolScan(state.kolMode, "", { silent: true })
    ]);
    if (state.activeTab === "ogreTek") {
      await loadOgreTekData({ silent: true }).catch((error) => setError(error.message));
    }
    render();
  }
}

initializeApp();
