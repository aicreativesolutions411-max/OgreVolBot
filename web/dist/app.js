const config = window.OGRE_PORTAL_CONFIG || {};
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

const state = {
  token: getStoredToken(),
  user: null,
  activeTab: "dashboard",
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
  launchResult: null,
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
  selectedTradePresetId: "trade-default-scalp",
  selectedBundlePresetId: "bundle-default-six",
  fastTradePresetStatus: "",
  fastBundlePresetStatus: "",
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
const topLoginPanel = $("[data-top-login]");
const authActions = $("[data-auth-actions]");
const guestActions = $("[data-guest-actions]");
const sessionActions = $("[data-session-actions]");
const dashboardView = $("[data-dashboard]");
const errorBox = $("[data-error]");
const dashboardErrorBox = $("[data-dashboard-error]");

const LIVE_PAIR_BUCKETS = [
  ["live", "Live"],
  ["under1h", "10-59m"],
  ["under3h", "Under 3h"],
  ["under1d", "Under 1d"]
];

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        throw new Error(`${detail} Could not reach SlimeWire right now. Try again in a moment or contact support.`);
      }
    }
  }
  const data = await readApiJson(response);

  if (!response.ok || data.ok === false) {
    const message = data.message || data.error || `HTTP ${response.status}`;
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
    const preview = text.replace(/\s+/g, " ").trim().slice(0, 180);
    return {
      ok: false,
      error: "invalid_api_response",
      message: contentType.includes("text/html")
        ? "SlimeWire API returned a webpage instead of JSON. Check OGRE_API_BASE, WEB_ALLOWED_ORIGIN, and redeploy both Render and Cloudflare."
        : `SlimeWire API returned invalid JSON${preview ? `: ${preview}` : "."}`
    };
  }
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

function loginCredentialsFromForm({ requirePassword = false } = {}) {
  const username = String($("[data-login-username]")?.value || "").trim();
  const password = String($("[data-login-password]")?.value || "");
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
  const status = $("[data-login-status]");
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
    await loadAll();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function passwordLogin() {
  setError("");
  const status = $("[data-login-status]");
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
    await loadAll();
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function createAccountAndConnectWallet() {
  setError("");
  const status = $("[data-login-status]");
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
  } catch (error) {
    setError(error.message);
  }
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
    await loadAll();
  } catch {
    state.token = "";
    clearStoredToken();
    render();
  }
}

async function loadAll() {
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

  state.loading = true;
  render();

  try {
    const [wallets, balances, positions, pnl, launchWatches, presets, watchlist] = await Promise.all([
      api("/api/web/wallets"),
      api("/api/web/balances"),
      api("/api/web/positions"),
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
    state.watchlist = watchlist.watchlist || { rows: [], count: 0 };
  } finally {
    state.loading = false;
    render();
  }
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

async function loadLivePairs({ silent = false, bucket = state.livePairBucket, renderOnComplete = true } = {}) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const isActiveBucket = safeBucket === state.livePairBucket;
  state.livePairsLoadingByBucket = { ...state.livePairsLoadingByBucket, [safeBucket]: true };
  state.livePairsLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
  if (!silent && isActiveBucket) state.loading = true;
  if (isActiveBucket || !silent) render();

  try {
    const data = await api(`/api/web/live-pairs?bucket=${encodeURIComponent(safeBucket)}`);
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

async function refreshLivePairBuckets({ silent = false } = {}) {
  await loadLivePairs({ silent, bucket: state.livePairBucket });
  const otherBuckets = LIVE_PAIR_BUCKETS
    .map(([bucket]) => bucket)
    .filter((bucket) => bucket !== state.livePairBucket);
  await Promise.allSettled(otherBuckets.map((bucket) => (
    loadLivePairs({ silent: true, bucket, renderOnComplete: false })
  )));
  if (state.activeTab === "live") render();
}

function scheduleLivePairsAutoRefresh() {
  if (livePairsTimer) {
    clearTimeout(livePairsTimer);
    livePairsTimer = null;
  }

  if (state.activeTab !== "live") return;
  const refreshSeconds = Number(currentLivePairs()?.refreshSeconds || 30);
  const delayMs = Math.max(3, refreshSeconds) * 1000;
  livePairsTimer = setTimeout(() => {
    if (state.activeTab !== "live" || state.livePairsLoading) return;
    refreshLivePairBuckets({ silent: true }).catch((error) => setError(error.message));
  }, delayMs);
}

function scheduleScannerAutoRefresh() {
  if (scanTimer) {
    clearTimeout(scanTimer);
    scanTimer = null;
  }
  if (state.activeTab !== "sniper") return;
  scanTimer = setTimeout(() => {
    if (state.activeTab !== "sniper" || state.loading) return;
    loadScan(state.scanMode, { silent: true }).catch((error) => setError(error.message));
  }, 20_000);
}

function scheduleKolAutoRefresh() {
  if (kolTimer) {
    clearTimeout(kolTimer);
    kolTimer = null;
  }
  if (state.activeTab !== "kol" || state.kolWallet) return;
  kolTimer = setTimeout(() => {
    if (state.activeTab !== "kol" || state.kolLoading || state.kolWallet) return;
    loadKolScan(state.kolMode, "", { silent: true }).catch((error) => setError(error.message));
  }, 60_000);
}

function scheduleWatchlistAutoRefresh() {
  if (watchlistTimer) {
    clearTimeout(watchlistTimer);
    watchlistTimer = null;
  }
  if (state.activeTab !== "watchlist" || !state.user || !state.token) return;
  watchlistTimer = setTimeout(() => {
    if (state.activeTab !== "watchlist") return;
    loadWatchlist({ silent: true }).catch((error) => setError(error.message));
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

function render() {
  if (!app || !loginView || !dashboardView) return;
  app.dataset.loading = state.loading ? "true" : "false";
  loginView.hidden = Boolean(state.user);
  if (topLoginPanel) topLoginPanel.hidden = Boolean(state.user) || state.loginCollapsed;
  if (authActions) authActions.hidden = false;
  if (guestActions) guestActions.hidden = Boolean(state.user);
  if (sessionActions) sessionActions.hidden = !state.user;
  dashboardView.hidden = false;

  setText("[data-user-id]", state.user?.id || "guest");
  setText("[data-wallet-count]", state.wallets.length);
  setText("[data-total-sol]", totalSol().toFixed(4));
  setText("[data-position-count]", state.positions.length);
  setText("[data-realized]", state.pnl?.totals?.realizedSol || "+0 SOL");
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
  renderTabs();
}

function renderTabs() {
  const panel = $("[data-panel]");
  if (!panel) return;
  document.querySelectorAll("[data-tab]").forEach((button) => {
    if (!button.closest(".tabs")) button.removeAttribute("data-active");
  });
  document.querySelectorAll(".tabs [data-tab]").forEach((button) => {
    button.dataset.active = button.dataset.tab === state.activeTab ? "true" : "false";
  });

  if (state.activeTab === "dashboard") panel.innerHTML = dashboardHtml();
  if (state.activeTab === "profile") panel.innerHTML = profileHtml();
  if (state.activeTab === "trade") panel.innerHTML = tradeHtml();
  if (state.activeTab === "bundle") panel.innerHTML = bundleHtml();
  if (state.activeTab === "volume") panel.innerHTML = volumeHtml();
  if (state.activeTab === "live") panel.innerHTML = livePairsHtml();
  if (state.activeTab === "watchlist") panel.innerHTML = watchlistHtml();
  if (state.activeTab === "launch") panel.innerHTML = launchHtml();
  if (state.activeTab === "kol") panel.innerHTML = kolHtml();
  if (state.activeTab === "wallets") panel.innerHTML = walletsHtml();
  if (state.activeTab === "positions") panel.innerHTML = positionsHtml();
  if (state.activeTab === "pnl") panel.innerHTML = pnlHtml();
  if (state.activeTab === "sniper") panel.innerHTML = sniperHtml();
  syncCustomFields(panel);
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
      ${visualCard("visual-aces", "Trade Desk", "Quick buy and sell from one wallet with .10, .50, 1 SOL, max, and percent sell buttons.")}
      ${visualCard("visual-cauldron", "Bundle + Volume", "Buy or sell across selected wallets, then manage timed exits with Volume plans.")}
      ${visualCard("visual-candle", "Launch Snipe", "Preset ticker, wallets, amount, TP/SL, and slippage, then watch live feeds until launch.")}
      ${visualCard("visual-cauldron", "KOL Tracker", "Follow KOL wallets, review their strongest current signals, then trade, bundle, or copy-plan from the same panel.")}
      ${visualCard("visual-candle", "Live Pairs", "Auto-refresh new Pump and fresh-pair listings while the tab is open, with safety-filtered Trade, Bundle, and Share actions.")}
    </section>
    ${importWalletSection()}
    ${backupRestoreSection()}
    ${downloadsHtml()}
  `;
}

function profileHtml() {
  return `
    ${profileIntroHtml()}
    ${accountProfileSection()}
    ${loginSecuritySection()}
    ${connectWalletSection()}
    ${profilePfpSection()}
    ${xConnectSection()}
    ${referralSection()}
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
          <p>${connected ? `Wallet connected: ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}` : "No browser wallet connected yet."}</p>
        </div>
      </div>
      ${connected ? `<button type="button" data-copy="${escapeHtml(connected.publicKey)}">Copy Connected</button>` : `<button type="button" class="primary" data-connect-wallet="solana">Connect Wallet</button>`}
      <button type="button" data-tab="wallets">Open Wallets</button>
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

function visualCard(className, title, body) {
  return `<article class="panel visual-card ${className}"><div><h3>${escapeHtml(title)}</h3><p>${escapeHtml(body)}</p></div></article>`;
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
      <div class="profile-actions">
        <button type="button" data-use-x-avatar ${state.xHandle ? "" : "disabled"}>${xHandle ? `Use ${escapeHtml(xHandle)} PFP` : "Use X PFP"}</button>
        ${hasAvatar ? `<button type="button" data-clear-avatar>Remove</button>` : ""}
      </div>
      <small data-avatar-status>${hasAvatar ? `PFP saved${state.user.avatarSource ? ` from ${escapeHtml(state.user.avatarSource)}` : ""}.` : "Optional. You can also connect X below and use that public profile image."}</small>
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
        <p>Connect Phantom, Solflare, Backpack, or a detected Solana wallet. Public address only.</p>
        <div class="wallet-provider-buttons">
          ${browserWalletChoices().map((wallet) => `
            <button type="button" data-connect-wallet="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} extension not detected"`}>
              ${escapeHtml(wallet.label)}
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
        <small data-x-status>${state.xHandle ? `Saved as @${escapeHtml(state.xHandle)}. Type another handle and save to change it.` : "Enter a handle, then Save X Handle. No X password or API key is stored."}</small>
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
        <p>Connect Phantom, Solflare, Backpack, or another browser Solana wallet. This saves the public address only; it never imports private keys.</p>
      </div>
      <div class="wallet-provider-buttons">
        ${browserWalletChoices().map((wallet) => `
          <button type="button" data-connect-wallet="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} extension not detected"`}>
            ${escapeHtml(wallet.label)}
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
      <small data-x-status>${connected ? `Saved as @${escapeHtml(state.xHandle)}. Enter a different handle and tap Save Different X to change it, or Unlink X to remove it.` : `Enter a handle, then Save X Handle. No X password or API key is stored.`}</small>
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
  return `
    <section class="create-wallet-card referral-card">
      <div>
        <h3>Referral + Trader Board</h3>
        <p>Share SlimeWire and optionally earn the referral split on users you bring in. The trader board is opt-in only.</p>
      </div>
      <label>
        Referral Payout Wallet
        <input data-referral-wallet type="text" placeholder="Wallet for referral fees" value="${escapeHtml(state.user?.referralPayoutWallet || "")}">
      </label>
      <label class="checkbox-line">
        <input data-show-trader-board type="checkbox" ${state.user?.showOnTraderBoard ? "checked" : ""}>
        Show me on Top SlimeWire Traders
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
              <select data-trade-auto-delay data-custom-select="trade-auto-delay">
                <option value="off" selected>No timer</option>
                <option value="5s">5 sec</option>
                <option value="5">5 min</option>
                <option value="15">15 min</option>
                <option value="60">1 hour</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-auto-delay-custom data-custom-for="trade-auto-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
            </label>
            <label>
              Exit Size
              <select data-trade-auto-sell-percent data-custom-select="trade-auto-sell-percent">
                <option value="off">No timer</option>
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
              <select data-trade-plan-delay data-custom-select="trade-plan-delay">
                <option value="off">No timer</option>
                <option value="5s">5 sec</option>
                <option value="1">1 min</option>
                <option value="5" selected>5 min</option>
                <option value="15">15 min</option>
                <option value="60">1 hour</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-plan-delay-custom data-custom-for="trade-plan-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
            </label>
            <label>
              Timer Sell
              <select data-trade-plan-sell-percent data-custom-select="trade-plan-sell-percent">
                <option value="off">No timer</option>
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
          <p>Uses encrypted managed wallets, Jupiter routes, safety precheck, slippage settings, and the same fee logic as the Telegram bot.</p>
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

function walletOptionsHtml() {
  if (!state.wallets.length) {
    return `<option value="1">No managed wallets loaded</option>`;
  }
  return state.wallets.map((wallet) => {
    const balance = state.balances.find((row) => Number(row.index) === Number(wallet.index));
    const sol = balance?.sol !== null && balance?.sol !== undefined ? `${Number(balance.sol).toFixed(4)} SOL` : "balance loading";
    return `<option value="${wallet.index}">${wallet.index}. ${escapeHtml(wallet.label)} - ${sol}</option>`;
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
        <div><dt>Timer Sell</dt><dd>${escapeHtml(timerSellSummary(row))}</dd></div>
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
              <select data-bundle-plan-delay data-custom-select="bundle-plan-delay">
                <option value="off">No timer</option>
                <option value="5s">5 sec</option>
                <option value="1">1 min</option>
                <option value="5" selected>5 min</option>
                <option value="15">15 min</option>
                <option value="60">1 hour</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-delay-custom data-custom-for="bundle-plan-delay" type="text" placeholder="Custom: 45s or 120" hidden>
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
              <select data-bundle-plan-loop-delay data-custom-select="bundle-plan-loop-delay">
                <option value="0" selected>No wait</option>
                <option value="5s">5 sec</option>
                <option value="30s">30 sec</option>
                <option value="1">1 min</option>
                <option value="5">5 min</option>
                <option value="custom">Custom</option>
              </select>
              <input data-bundle-plan-loop-delay-custom data-custom-for="bundle-plan-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
            </label>
            <label>
              Timer Sell
              <select data-bundle-plan-sell-percent data-custom-select="bundle-plan-sell-percent">
                <option value="off">No timer</option>
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
          <p>Use KOL signals as the CA source, then send them into Bundle or arm a copy plan with the exits above.</p>
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

function walletChecksHtml(prefix) {
  const defaultCheckedCount = prefix === "trade-plan" ? 1 : 6;
  return state.wallets.map((wallet, index) => `
    <label class="wallet-check">
      <input type="checkbox" data-${prefix}-wallet value="${wallet.index}" ${index < defaultCheckedCount ? "checked" : ""}>
      <span>${wallet.index}. ${escapeHtml(wallet.label)}</span>
      <code>${escapeHtml(wallet.shortPublicKey || wallet.publicKey)}</code>
    </label>
  `).join("");
}

function walletGroupHtml(prefix) {
  return `
    <label>
      Optional Group Label
      <input data-${prefix}-group type="text" placeholder="Example: Ogre">
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
  if (!presets.length) return `<option value="custom" selected>Custom / manual</option>`;
  return `
    ${presets.map((preset) => `<option value="${escapeHtml(preset.id)}" ${preset.id === selectedId ? "selected" : ""}>${escapeHtml(preset.name)}</option>`).join("")}
    <option value="custom" ${selectedId === "custom" ? "selected" : ""}>Custom / manual</option>
  `;
}

function fastPresetToolbarHtml(context = "scanner") {
  return `
    <section class="preset-toolbar">
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
      ${state.selectedTradePresetId === "custom" ? fastTradePresetBuilderHtml() : ""}
      ${state.selectedBundlePresetId === "custom" ? fastBundlePresetBuilderHtml() : ""}
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
        <label>Fallback Timer <input data-fast-trade-preset-delay type="text" value="off" placeholder="No timer, 5s, 5m"></label>
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
        <label>Fallback Timer <input data-fast-bundle-preset-delay type="text" value="off" placeholder="No timer, 5s, 5m"></label>
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

function tradePresetManagerHtml() {
  return `
    <article class="preset-card">
      <h3>Trade Presets</h3>
      <p>Save up to five one-wallet presets for instant Trade buttons on scanners, watchlists, and KOL signals.</p>
      <label>Name <input data-trade-preset-name type="text" placeholder="Fast scalp"></label>
      <label>Wallet <select data-trade-preset-wallet>${walletOptionsHtml()}</select></label>
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-trade-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-trade-preset-tp type="text" value="25"></label>
        <label>Stop Loss <input data-trade-preset-sl type="text" value="8"></label>
        <label>Fallback Timer <input data-trade-preset-delay type="text" value="off" placeholder="No timer, 5s, 5m"></label>
        <label>Exit % <input data-trade-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-trade-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="trade">Save Trade Preset</button>
      </div>
      ${presetListHtml("trade")}
      <small data-trade-preset-status></small>
    </article>
  `;
}

function bundlePresetManagerHtml() {
  return `
    <article class="preset-card">
      <h3>Bundle Presets</h3>
      <p>Save up to five multi-wallet presets for instant Bundle buttons on scanners, watchlists, and KOL signals.</p>
      <label>Name <input data-bundle-preset-name type="text" placeholder="Six wallet send"></label>
      <div class="wallet-checks preset-wallets">${walletChecksHtml("bundle-preset")}</div>
      ${walletGroupHtml("bundle-preset")}
      <div class="volume-grid compact-grid">
        <label>Buy SOL <input data-bundle-preset-amount type="number" min="0" step="0.01" value="0.1"></label>
        <label>Take Profit <input data-bundle-preset-tp type="text" value="60"></label>
        <label>Stop Loss <input data-bundle-preset-sl type="text" value="10"></label>
        <label>Fallback Timer <input data-bundle-preset-delay type="text" value="off" placeholder="No timer, 5s, 5m"></label>
        <label>Exit % <input data-bundle-preset-sell-percent type="number" min="1" max="100" value="100"></label>
        <label>Slippage BPS <input data-bundle-preset-slippage type="number" min="1" max="5000" value="400"></label>
      </div>
      <div class="card-actions">
        <button type="button" class="primary" data-save-preset="bundle">Save Bundle Preset</button>
      </div>
      ${presetListHtml("bundle")}
      <small data-bundle-preset-status></small>
    </article>
  `;
}

function presetListHtml(kind) {
  const presets = state.presets?.[kind] || [];
  if (!presets.length) return `<p class="muted">No presets loaded yet.</p>`;
  return `
    <div class="preset-list">
      ${presets.map((preset) => `
        <div class="preset-pill" data-readonly="${preset.readonly ? "true" : "false"}">
          <span>${escapeHtml(preset.name)}</span>
          <small>${escapeHtml(preset.amountSol)} SOL | TP ${escapeHtml(preset.takeProfitPct)} | SL ${escapeHtml(preset.stopLossPct)} | ${escapeHtml(preset.sellDelay || "off")}</small>
          ${preset.readonly ? "" : `<button type="button" data-delete-preset="${escapeHtml(kind)}" data-preset-id="${escapeHtml(preset.id)}">Delete</button>`}
        </div>
      `).join("")}
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
            <select data-volume-delay data-custom-select="volume-delay">
              <option value="off">No timer</option>
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="5" selected>5 min</option>
              <option value="15">15 min</option>
              <option value="30">30 min</option>
              <option value="60">1 hour</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-delay-custom data-custom-for="volume-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
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
            <select data-volume-loop-delay data-custom-select="volume-loop-delay">
              <option value="0" selected>No wait</option>
              <option value="5s">5 sec</option>
              <option value="30s">30 sec</option>
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-volume-loop-delay-custom data-custom-for="volume-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
          </label>
          <label>
            Timer Sell
            <select data-volume-sell-percent data-custom-select="volume-sell-percent">
              <option value="off">No timer</option>
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
        <div><dt>Timer Sell</dt><dd>${escapeHtml(timerSellSummary(row))}</dd></div>
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
            <select data-launch-delay data-custom-select="launch-delay">
              <option value="off">No timer</option>
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="3" selected>3 min</option>
              <option value="5">5 min</option>
              <option value="15">15 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-delay-custom data-custom-for="launch-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
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
            <select data-launch-loop-delay data-custom-select="launch-loop-delay">
              <option value="0" selected>No wait</option>
              <option value="5s">5 sec</option>
              <option value="30s">30 sec</option>
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-launch-loop-delay-custom data-custom-for="launch-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
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
            <select data-kol-delay data-custom-select="kol-delay">
              <option value="off">No timer</option>
              <option value="5s">5 sec</option>
              <option value="1">1 min</option>
              <option value="5" selected>5 min</option>
              <option value="15">15 min</option>
              <option value="60">1 hour</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-delay-custom data-custom-for="kol-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
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
            <select data-kol-loop-delay data-custom-select="kol-loop-delay">
              <option value="0" selected>No wait</option>
              <option value="5s">5 sec</option>
              <option value="30s">30 sec</option>
              <option value="1">1 min</option>
              <option value="5">5 min</option>
              <option value="custom">Custom</option>
            </select>
            <input data-kol-loop-delay-custom data-custom-for="kol-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
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
          <p>Paste any public Solana wallet to inspect current holdings, open KOLscan, or arm copy-watch from your selected wallets.</p>
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
            <a href="https://kolscan.io/trades" target="_blank" rel="noreferrer">KOLscan Trades</a>
            <a href="https://kolscan.io/leaderboard" target="_blank" rel="noreferrer">KOLscan Leaderboard</a>
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
  const status = state.kolStatus
    || scan?.message
    || `Pick ${kolModeLabel(state.kolMode)} or tap Refresh.`;
  const details = scan
    ? ` ${Number(scan.kolCount || scan.kols?.length || 0)} KOL wallet(s), ${Number(scan.rows?.length || 0)} token signal(s).`
    : "";
  const updated = state.kolLastUpdatedAt ? ` Last updated ${formatDate(state.kolLastUpdatedAt)}.` : "";
  return `<p class="trade-status kol-status">${escapeHtml(`${status}${state.kolLoading ? "" : details}${updated}`)}</p>`;
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
          <p>${escapeHtml(scan.message || "Live KOL leaderboard loaded.")}</p>
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
            <small>${escapeHtml(kol.volumeLabel || "Volume n/a")} | Last trade: ${escapeHtml(formatDate(kol.lastTradeAt))}</small>
            <div class="card-actions">
              ${kol.solscanUrl ? `<a href="${escapeHtml(kol.solscanUrl)}" target="_blank" rel="noreferrer">Wallet</a>` : ""}
              ${kol.kolscanUrl || kol.wallet ? `<a href="${escapeHtml(kol.kolscanUrl || kolscanUrl(kol.wallet))}" target="_blank" rel="noreferrer">KOLscan</a>` : ""}
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
  const status = $("[data-wallet-connect-status]");
  const provider = walletProviderById(providerId);
  if (!provider) {
    writeText(status, `${walletProviderLabel(providerId)} is not detected in this browser. Install/open the wallet extension, then refresh.`);
    return;
  }

  try {
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
    state.activeTab = "wallets";
    writeText(status, `Connected ${shortAddress(publicKeyText)}.`);
    render();
    loadAll().catch((error) => setError(`Connected wallet saved. Balance refresh failed: ${error.message}`));
  } catch (error) {
    writeText(status, error.message || "Wallet connection was cancelled.");
  }
}

async function disconnectBrowserWallet() {
  const status = $("[data-wallet-connect-status]");
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
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
    await loadAll();
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setBundleStatus(error.message);
  }
}

function presetById(kind, id) {
  return (state.presets?.[kind] || []).find((preset) => preset.id === id) || null;
}

async function quickPresetTrade(tokenMint) {
  const preset = presetById("trade", state.selectedTradePresetId);
  if (!preset || state.selectedTradePresetId === "custom") {
    setError("Save the custom fast trade preset first, then tap Trade again.");
    return;
  }
  try {
    await ensureWebAccount(null, "Opening secure web profile...");
    if (!state.wallets.some((wallet) => String(wallet.index) === String(preset.walletIndex || "1"))) {
      throw new Error("This trade preset wallet is not loaded. Edit it in the Trade tab.");
    }
    const payload = {
      tokenMint,
      walletIndex: preset.walletIndex || "1",
      amountSol: preset.amountSol,
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
    await loadAll();
    state.activeTab = "trade";
    render();
  } catch (error) {
    setError(error.message);
  }
}

async function quickPresetBundle(tokenMint) {
  const preset = presetById("bundle", state.selectedBundlePresetId);
  if (!preset || state.selectedBundlePresetId === "custom") {
    setError("Save the custom fast bundle preset first, then tap Bundle again.");
    return;
  }
  try {
    await ensureWebAccount(null, "Opening secure web profile...");
    const payload = {
      tokenMint,
      walletIndexes: (preset.walletIndexes || []).filter((index) => state.wallets.some((wallet) => String(wallet.index) === String(index))),
      walletGroup: preset.walletGroup || "",
      amountSol: preset.amountSol,
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
    await loadAll();
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setError(error.message);
  }
}

function readPresetForm(kind, source = "manager") {
  const prefix = source === "fast" ? `fast-${kind}` : kind;
  if (kind === "trade") {
    return {
      name: $(`[data-${prefix}-preset-name]`)?.value || "Trade Preset",
      walletIndex: $(`[data-${prefix}-preset-wallet]`)?.value || "1",
      amountSol: $(`[data-${prefix}-preset-amount]`)?.value || "0.1",
      takeProfitPct: $(`[data-${prefix}-preset-tp]`)?.value || "25",
      stopLossPct: $(`[data-${prefix}-preset-sl]`)?.value || "8",
      sellDelay: $(`[data-${prefix}-preset-delay]`)?.value || "off",
      sellPercent: $(`[data-${prefix}-preset-sell-percent]`)?.value || "100",
      slippageBps: $(`[data-${prefix}-preset-slippage]`)?.value || "400"
    };
  }
  return {
    name: $(`[data-${prefix}-preset-name]`)?.value || "Bundle Preset",
    walletIndexes: checkedWalletIndexes(`${prefix}-preset`),
    walletGroup: $(`[data-${prefix}-preset-group]`)?.value?.trim() || "",
    amountSol: $(`[data-${prefix}-preset-amount]`)?.value || "0.1",
    takeProfitPct: $(`[data-${prefix}-preset-tp]`)?.value || "60",
    stopLossPct: $(`[data-${prefix}-preset-sl]`)?.value || "10",
    sellDelay: $(`[data-${prefix}-preset-delay]`)?.value || "off",
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

function setFastPresetStatus(kind, message) {
  if (kind === "trade") state.fastTradePresetStatus = message;
  if (kind === "bundle") state.fastBundlePresetStatus = message;
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
    selectNewestUserPreset(kind, state.presets?.[kind]);
    if (source === "fast") {
      setFastPresetStatus(kind, `Saved "${preset.name}". Tap ${kind === "trade" ? "Trade" : "Bundle"} on any row.`);
    }
    writeText(status, "Preset saved.");
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
    render();
  } catch (error) {
    setError(error.message);
  }
}

async function saveReferralSettings() {
  const status = $("[data-referral-status]");
  try {
    await ensureWebAccount(status, "Opening secure web profile...");
    writeText(status, "Saving referral settings...");
    const data = await api("/api/web/profile/referral", {
      method: "POST",
      body: JSON.stringify({
        referralPayoutWallet: $("[data-referral-wallet]")?.value || "",
        showOnTraderBoard: Boolean($("[data-show-trader-board]")?.checked)
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
  const connected = connectedWalletCardHtml();
  if (!state.wallets.length) return `${create}${connected}${emptyState("No managed bot wallets yet", "Create a wallet set above to trade with bot automation. Connected browser wallets show above as view-only balances.")}`;
  return `
    ${create}
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
    <section class="connected-wallet-card">
      <div>
        <h3>Connected Browser Wallet</h3>
        <p>${escapeHtml(connected.provider || balance.provider || "Solana Wallet")} ${escapeHtml(shortAddress(connected.publicKey))}</p>
        <code>${escapeHtml(connected.publicKey)}</code>
        <small>Balance: ${escapeHtml(sol)} | ${escapeHtml(tokenText)}${escapeHtml(warningText)}</small>
        ${balance.error ? `<small>Check failed: ${escapeHtml(balance.error)}</small>` : ""}
        ${tokenRows ? `<div class="connected-token-list">${tokenRows}</div>` : ""}
        <small>Browser wallets are shown for balance checks. Bot trading uses managed wallets because trades need signing automation.</small>
      </div>
      <div class="card-actions">
        <button data-refresh-all>Refresh</button>
        <button data-copy="${escapeHtml(connected.publicKey)}">Copy</button>
        <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
        <button data-tab="trade">Trade Managed Wallet</button>
        <button data-tab="bundle">Bundle</button>
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
      ${state.positions.map((position) => `
        <article class="row-card position with-avatar">
          ${livePairAvatarHtml(position)}
          <div class="row-main">
            <strong>${escapeHtml(position.symbol || position.shortMint)}</strong>
            <span>${position.uiAmount} tokens across ${position.walletCount} wallet(s)</span>
            ${position.name ? `<small>${escapeHtml(position.name)}</small>` : ""}
            <small>Value: ${position.estimatedValueSol || "unavailable"} SOL | PnL: ${position.openPnlSol || position.realizedSol}</small>
          </div>
          <div class="card-actions">
            ${xShareButton(positionShareText(position))}
            <a href="${position.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
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
    <div class="table-list">
      ${state.pnl.tokens.map((row) => `
        <article class="row-card with-avatar">
          ${livePairAvatarHtml(row)}
          <div class="row-main">
            <strong>${escapeHtml(row.symbol || row.shortMint)}</strong>
            <span>${row.realizedSol} realized | buys ${row.buys} / sells ${row.sells}</span>
            ${row.name ? `<small>${escapeHtml(row.name)}</small>` : ""}
            <small>Latest: ${formatDate(row.lastTradeAt)}</small>
          </div>
          <div class="card-actions">
            ${xShareButton(pnlShareText(row), "Share PnL")}
            <button data-pnl-card="${escapeHtml(row.tokenMint)}">Download Card</button>
            <button data-share-pnl-card="${escapeHtml(row.tokenMint)}" data-share-text="${escapeHtml(pnlShareText(row))}">Share Card</button>
            <a href="${row.dexUrl}" target="_blank" rel="noreferrer">Dex</a>
          </div>
        </article>
      `).join("")}
    </div>
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
    under1h: "10-59 minute pairs. Filters out market caps below $7K.",
    under3h: "One to three hour pairs. Filters out market caps below $7K.",
    under1d: "Three to twenty-four hour pairs. Filters out market caps below $7K."
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
    ${fastPresetToolbarHtml(options.context || "scanner")}
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
    : `<button type="button" data-watch-token="${escapeHtml(row.tokenMint)}" data-watch-symbol="${escapeHtml(row.symbol || "")}" data-watch-name="${escapeHtml(row.name || "")}" data-watch-image="${escapeHtml(row.imageUrl || "")}">${watched ? "Watching" : "Watch"}</button>`;
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
            ${row.websiteUrl ? `<a href="${escapeHtml(row.websiteUrl)}" target="_blank" rel="noreferrer" title="Website">WEB</a>` : ""}
            <button type="button" data-share-x data-share-text="${escapeHtml(shareText)}" title="Share to X">SHARE</button>
            ${telegramShareButton(shareText, "TG")}
          </div>
        </div>
      </div>
      <div class="signal-cell"><span>${escapeHtml(row.pairAgeLabel || formatAgeFromRow(row) || "new")}</span><small>${escapeHtml(row.scalpSetup || row.momentum || `#${index + 1}`)}</small></div>
      <div class="signal-cell"><span>${escapeHtml(row.liquidityLabel || "$0")}</span><small>${formatChangeHtml(row.h1)}</small></div>
      <div class="signal-cell"><span>${escapeHtml(row.marketCapLabel || "$0")}</span><small>${escapeHtml(row.category || row.signalType || "signal")}</small></div>
      <div class="signal-cell"><span>${escapeHtml(row.txnsLabel || row.winRateLabel || "n/a")}</span><small>${escapeHtml(row.valueLabel || row.smartMoney || "")}</small></div>
      <div class="signal-cell"><span>${escapeHtml(row.volumeH1Label || row.volumeLabel || "$0")}</span><small>5m ${escapeHtml(row.volume5mLabel || "$0")}</small></div>
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
  return `<div class="live-pair-avatar fallback">${escapeHtml(label)}</div>`;
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
          <select data-sniper-delay data-custom-select="sniper-delay">
            <option value="off">No timer</option>
            <option value="5s">5 sec</option>
            <option value="1">1 min</option>
            <option value="3" ${isPump ? "selected" : ""}>3 min</option>
            <option value="5" ${isPump ? "" : "selected"}>5 min</option>
            <option value="15">15 min</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-delay-custom data-custom-for="sniper-delay" type="text" placeholder="Custom: 45s, 2, 2h" hidden>
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
          <select data-sniper-loop-delay data-custom-select="sniper-loop-delay">
            <option value="0" selected>No wait</option>
            <option value="5s">5 sec</option>
            <option value="30s">30 sec</option>
            <option value="1">1 min</option>
            <option value="5">5 min</option>
            <option value="custom">Custom</option>
          </select>
          <input data-sniper-loop-delay-custom data-custom-for="sniper-loop-delay" type="text" placeholder="Custom: 30s or 2" hidden>
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
  const target = event.target.closest("button, a");
  if (!target) return;

  if (target.matches("[data-web-signup]")) await createWebAccount();
  if (target.matches("[data-web-password-login]")) await passwordLogin();
  if (target.matches("[data-web-signup-connect]")) await createAccountAndConnectWallet();
  if (target.matches("[data-open-login]")) {
    state.loginCollapsed = !state.loginCollapsed;
    render();
  }
  if (target.matches("[data-browse-guest]")) {
    state.loginCollapsed = true;
    render();
  }
  if (target.matches("[data-logout]")) await logout();
  if (target.matches("[data-connect-x]")) await connectXAccount();
  if (target.matches("[data-open-x-login]")) openXLoginOrProfile();
  if (target.matches("[data-clear-x]")) await disconnectXAccount();
  if (target.matches("[data-save-login-credentials]")) await saveLoginCredentials();
  if (target.matches("[data-save-referral]")) await saveReferralSettings();
  if (target.matches("[data-use-x-avatar]")) await useXProfileAvatar();
  if (target.matches("[data-clear-avatar]")) await updateProfileAvatar({ clear: true }, "Removing PFP...");
  if (target.matches("[data-connect-wallet]")) await connectBrowserWallet(target.dataset.connectWallet);
  if (target.matches("[data-disconnect-wallet]")) await disconnectBrowserWallet();
  if (target.matches("[data-share-x]")) openXShare(target.dataset.shareText || "");
  if (target.matches("[data-share-watch-token-btn]")) shareManualWatch("token");
  if (target.matches("[data-share-watch-kol-btn]")) shareManualWatch("kol");
  if (target.matches("[data-save-preset]")) await savePreset(target.dataset.savePreset);
  if (target.matches("[data-save-fast-preset]")) await savePreset(target.dataset.saveFastPreset, "fast");
  if (target.matches("[data-delete-preset]")) await deletePreset(target.dataset.deletePreset, target.dataset.presetId || "");
  if (target.matches("[data-quick-trade-token]")) await quickPresetTrade(target.dataset.quickTradeToken || "");
  if (target.matches("[data-quick-bundle-token]")) await quickPresetBundle(target.dataset.quickBundleToken || "");
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
      if (state.activeTab === "live") await refreshLivePairBuckets({ silent: true }).catch((error) => setError(error.message));
      else if (state.activeTab === "sniper") await loadScan().catch((error) => setError(error.message));
      else if (state.activeTab === "kol") await loadKolScan().catch((error) => setError(error.message));
      else setError("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades.");
    } else {
      loadAll().catch((error) => setError(error.message));
    }
  }

  if (target.matches("[data-tab]")) {
    state.activeTab = target.dataset.tab;
    if (state.activeTab === "sniper" && !state.scan) {
      await loadScan().catch((error) => setError(error.message));
    }
    if (state.activeTab === "live" && !state.livePairsByBucket[state.livePairBucket]) {
      await refreshLivePairBuckets().catch((error) => setError(error.message));
    }
    if (state.activeTab === "kol" && !state.kolScan) {
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
    await refreshLivePairBuckets().catch((error) => setError(error.message));
  }

  if (target.matches("[data-refresh-watchlist]")) {
    await loadWatchlist().catch((error) => setError(error.message));
  }

  if (target.matches("[data-live-pair-bucket]")) {
    state.livePairBucket = target.dataset.livePairBucket || "live";
    state.livePairs = currentLivePairs();
    state.livePairsLastUpdatedAt = currentLivePairsUpdatedAt();
    render();
    await refreshLivePairBuckets().catch((error) => setError(error.message));
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
    state.selectedTradePresetId = target.value || "custom";
    if (state.selectedTradePresetId === "custom") state.fastTradePresetStatus = "";
    render();
  }
  if (target?.matches?.("[data-fast-bundle-preset]")) {
    state.selectedBundlePresetId = target.value || "custom";
    if (state.selectedBundlePresetId === "custom") state.fastBundlePresetStatus = "";
    render();
  }
  if (target?.matches?.("[data-restore-file]")) {
    await readRestoreFile(target);
  }
  if (target?.matches?.("[data-avatar-file]")) {
    await uploadProfileAvatar(target);
  }
});

loadSession();
