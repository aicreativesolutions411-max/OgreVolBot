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
const pumpLiveConfig = config.pumpLive || {};
const ogreTekConfig = resolveOgreTekConfig(config);
const SHOW_STAGED_PERPS_NAV = false;
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
const API_CONNECT_TIMEOUT_MS = 60_000;
const WALLET_REFRESH_TIMEOUT_MS = 15_000;
const POSITIONS_REFRESH_TIMEOUT_MS = 10_000;
const POSITIONS_FAST_REFRESH_TIMEOUT_MS = 8_000;
const API_LONG_ACTION_TIMEOUT_MS = 180_000;
const MOBILE_WALLET_PENDING_KEY = "slimewireMobileWalletPending";
const MOBILE_WALLET_PENDING_BACKUP_KEY = "slimewireMobileWalletPendingBackup";
const MOBILE_WALLET_SESSION_PREFIX = "slimewireMobileWalletSession:";
const PERF_LOG_KEY = "slimewirePerfLog";
const CRASH_LOG_KEY = "slimewireCrashLog";
const TERMINAL_FEED_LOG_KEY = "slimewireTerminalFeedLog";
const PERF_POST_MIN_DURATION_MS = 150;
const LOCAL_DIAGNOSTIC_WRITE_DEBOUNCE_MS = 1_500;
const WALLET_REFRESH_FORCE_COOLDOWN_MS = 10_000;
const LIVE_PAIRS_RENDER_DEBOUNCE_MS = 140;
const LIVE_PAIRS_INFLIGHT_RENDER_REASON = "live-pairs-inflight";
const POST_TRADE_REFRESH_DELAYS_MS = [1200, 4500, 10000];
const APP_WATCHDOG_INTERVAL_MS = 15_000;
const APP_RESUME_REFRESH_DEBOUNCE_MS = 650;
const POSITION_REFRESH_STALE_LOCK_MS = 30_000;
const POST_TRADE_AFFECTED_KEYS = ["wallet-summary", "positions", "pnl", "trade-history", "selected-token", "live-trades"];
const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_LOOKUP = new Map([...BASE58_ALPHABET].map((char, index) => [char, index]));

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

function getStoredPerfLog() {
  try {
    const rows = JSON.parse(window.localStorage?.getItem(PERF_LOG_KEY) || "[]");
    return Array.isArray(rows) ? rows.slice(-100) : [];
  } catch {
    return [];
  }
}

function getStoredCrashLog() {
  try {
    const rows = JSON.parse(window.localStorage?.getItem(CRASH_LOG_KEY) || "[]");
    return Array.isArray(rows) ? rows.slice(-50) : [];
  } catch {
    return [];
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

function getStoredNavTekOpen() {
  try {
    return window.localStorage?.getItem("slimewireNavTekOpen") === "true";
  } catch {
    return false;
  }
}

function setStoredNavTekOpen(open) {
  try {
    window.localStorage?.setItem("slimewireNavTekOpen", open ? "true" : "false");
  } catch {
    // Navigation preference is convenience-only.
  }
}

const state = {
  token: getStoredToken(),
  user: null,
  route: window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/account/login")
    ? "login"
    : window.location.pathname.startsWith("/connect")
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
  smartChartTokenRef: null,
  smartChartDexResolution: {},
  smartChartDexResolving: {},
  smartChartBootstrap: {},
  smartChartBootstrapLoading: {},
  smartChartPrefetchLog: [],
  smartChartZoom: 100,
  smartChartView: "chart",
  chartTradeTab: new URLSearchParams(window.location.search || "").get("tab") === "sell" ? "sell" : "buy",
  chartFocusAmountInput: new URLSearchParams(window.location.search || "").get("focusAmount") === "1",
  chartScrollIntoView: window.location.pathname.includes("/terminal/chart"),
  terminalAutoToken: "",
  terminalTxSignature: "",
  terminalTxAudit: null,
  terminalTxLoading: false,
  walletRefreshing: false,
  walletRefreshStatus: "idle",
  walletRefreshRequestId: 0,
  lastWalletRefreshAt: "",
  walletRefreshError: "",
  postTradeRefresh: { active: false, attemptId: "", action: "", invalidatedKeys: [], refreshedKeys: [], requestCount: 0, errors: [] },
  positionRefreshAction: { state: "idle", startedAt: 0, minUntil: 0, error: "" },
  manualSellActions: {},
  tradeActionLocks: {},
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
  tradePlans: [],
  bundleToken: "",
  bundleResult: null,
  volumeToken: "",
  volumeResult: null,
  sniperResult: null,
  ogreAiResult: null,
  ogreAiStatus: "",
  ogreAiLoading: false,
  ogreAgentOpen: false,
  ogreAgentLoading: false,
  ogreAgentStatus: "",
  ogreAgentMessages: [],
  connectedWalletBalance: null,
  livePairs: null,
  livePairsByBucket: {},
  livePairsLoading: false,
  livePairsLoadingByBucket: {},
  livePairsLastUpdatedAt: "",
  livePairsLastUpdatedByBucket: {},
  livePairsRefreshErrorByBucket: {},
  livePairBucket: "live",
  slimeScopeMode: "new",
  terminalFeeds: {},
  terminalFeedLog: [],
  terminalFeedVisibleLimits: {},
  perfLog: getStoredPerfLog(),
  crashLog: getStoredCrashLog(),
  perfRenderCounts: {},
  perfInstrumentationInstalled: false,
  launchResult: null,
  launchCoinDraft: getStoredLaunchCoinDraft(),
  launchCoinStatus: "",
  launchWatches: [],
  pumpLiveStatus: "",
  pumpLiveLastActionAt: 0,
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
  quickBuyModal: { open: false, tokenMint: "", amountSol: "", walletIndex: "", slippageBps: "400", status: "", source: "", error: "", tradeAttemptId: "" },
  quickBuyLast: null,
  terminalTradeCollapsed: true,
  navTekOpen: getStoredNavTekOpen(),
  walletConnectMenuOpen: false,
  walletConnectReturnPath: "/terminal",
  walletConnectStatus: "",
  automationDelegationStatus: "",
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
  walletSweepStatus: "",
  loginModalOpen: window.location.pathname.startsWith("/login") || window.location.pathname.startsWith("/account/login") || new URLSearchParams(window.location.search || "").get("login") === "1",
  loginModalTab: "login",
  loginReturnTo: "",
  lastLockInClickAt: 0,
  restoreResult: null,
  importResult: null,
  backupResult: null,
  downloads: null,
  xHandle: getStoredXHandle(),
  loginCollapsed: true
};
let livePairsTimer = null;
let livePairsTimerKey = "";
const livePairsWarmupKeys = new Set();
let scanTimer = null;
let scanTimerKey = "";
let kolTimer = null;
let kolTimerKey = "";
let watchlistTimer = null;
let watchlistTimerKey = "";
let terminalFeedTimer = null;
let terminalFeedTimerKey = "";
let walletBackgroundRefreshTimer = null;
let postTradeRefreshTimers = [];
let positionRefreshVisualTimer = null;
let positionsValueRefreshTimer = null;
let autoExitCheckInFlight = false;
let walletRefreshPromise = null;
let positionsRefreshPromise = null;
let positionsRefreshPromiseKey = "";
let lastWalletForceRefreshAt = 0;
let walletRefreshSequence = 0;
let positionsRefreshSequence = 0;
let ogreAiRunInFlight = null;
const livePairsLoadInFlight = new Map();
const livePairsLoadVersionsByBucket = {};
const apiInFlight = new Map();
const pendingPerfPosts = [];
let perfPostTimer = null;
let perfLogPersistTimer = null;
let crashLogPersistTimer = null;
let terminalFeedLogPersistTimer = null;
let livePairsRenderTimer = null;
let livePairsRenderRaf = 0;
let livePairsRenderReasons = new Set();
let appWatchdogTimer = null;
let resumeLiveFeedsTimer = null;
let lastRenderCompletedAt = Date.now();

function scheduleLivePairsRender(reason = "live-pairs-batch") {
  if (reason) {
    livePairsRenderReasons.add(String(reason));
  }
  if (livePairsRenderTimer || livePairsRenderRaf) return;
  const flush = () => {
    const details = Array.from(livePairsRenderReasons);
    livePairsRenderTimer = null;
    livePairsRenderReasons = new Set();
    livePairsRenderRaf = 0;
    if (state.route !== "terminal") return;
    if (!["terminal", "live", "slimeScope"].includes(state.activeTab)) return;
    recordPerfEvent({
      component: "livePairs",
      action: "batched-live-render",
      durationMs: 0,
      resultCount: Array.isArray(currentLivePairs()?.rows) ? currentLivePairs().rows.length : 0,
      details: details.length ? details.slice(-3).join(" | ") : reason
    });
    render();
  };
  livePairsRenderTimer = window.setTimeout(() => {
    livePairsRenderRaf = window.requestAnimationFrame(flush);
  }, LIVE_PAIRS_RENDER_DEBOUNCE_MS);
}

const $ = (selector) => document.querySelector(selector);

function runDeferredUiTask(task) {
  window.setTimeout(() => {
    Promise.resolve()
      .then(task)
      .catch((error) => {
        if (typeof setError === "function") {
          setError(error?.message || "Action failed.");
        } else {
          console.warn(error);
        }
      });
  }, 0);
}
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
const loginModal = $("[data-login-modal]");
const authActions = $("[data-auth-actions]");
const guestActions = $("[data-guest-actions]");
const sessionActions = $("[data-session-actions]");
const dashboardView = $("[data-dashboard]");
const errorBox = $("[data-error]");
const dashboardErrorBox = $("[data-dashboard-error]");

const LIVE_PAIR_BUCKETS = [
  ["live", "Fresh"],
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

/*
Terminal feed registry. Keep each tab/category/cacheKey distinct so one tab
cannot accidentally display or refresh another tab's data.
tabKey | label | component | endpoint | category | refreshMs | staleMs | cacheKey
*/
const TERMINAL_FEEDS = [
  { tabKey: "terminal", label: "Live Terminal", component: "terminalHtml", endpoint: "composite:/api/web/live-pairs+/api/web/kol/scan+/api/web/watchlist", category: "overview:terminal", refreshMs: 15_000, staleMs: 30_000, cacheKey: "terminal:overview", pageSize: 12, maxPageSize: 24, previewLimit: 8, supportsPagination: false },
  { tabKey: "live", label: "Live Pairs - New Solana Pairs", component: "livePairsHtml", endpoint: "/api/web/live-pairs", category: "pairs:new", refreshMs: 15_000, staleMs: 30_000, cacheKey: "pairs:{bucket}:{sort}", pageSize: 50, maxPageSize: 100, previewLimit: 12, supportsPagination: true },
  { tabKey: "liveTrades", label: "Live Trades - Recent Swaps", component: "liveTradesHtml", endpoint: "/api/web/pnl", category: "trades:recent", refreshMs: 8_000, staleMs: 20_000, cacheKey: "trades:recent", pageSize: 50, maxPageSize: 100, previewLimit: 10, supportsPagination: true },
  { tabKey: "slimeScope", label: "Slime Scope - Scanner Picks", component: "slimeScopeHtml", endpoint: "composite:/api/web/live-pairs+/api/web/sniper/scan", category: "scanner:slime-scope", refreshMs: 20_000, staleMs: 45_000, cacheKey: "scanner:slime-scope:{scopeMode}", pageSize: 50, maxPageSize: 100, previewLimit: 12, supportsPagination: true },
  { tabKey: "kol", label: "KOL Tracker - Social/KOL Signals", component: "kolHtml", endpoint: "/api/web/kol/scan", category: "signals:kol", refreshMs: 60_000, staleMs: 120_000, cacheKey: "signals:kol:{kolMode}:{kolWallet}", pageSize: 36, maxPageSize: 72, previewLimit: 12, supportsPagination: true },
  { tabKey: "watchlist", label: "Watchlist - Your Saved Pairs", component: "watchlistHtml", endpoint: "/api/web/watchlist", category: "user:watchlist", refreshMs: 20_000, staleMs: 45_000, cacheKey: "user:watchlist", pageSize: 50, maxPageSize: 100, previewLimit: 12, supportsPagination: true },
  { tabKey: "smartChart", label: "Smart Chart - Selected Token", component: "smartChartHtml", endpoint: "composite:/api/web/positions", category: "token:selected-chart", refreshMs: 30_000, staleMs: 60_000, cacheKey: "token:selected-chart:{tokenMint}", pageSize: 5, maxPageSize: 10, previewLimit: 5, supportsPagination: false },
  { tabKey: "trade", label: "Trade - Selected Token Panel", component: "tradeHtml", endpoint: "composite:/api/web/balances+/api/web/positions", category: "trade:selected-token", refreshMs: 20_000, staleMs: 45_000, cacheKey: "trade:selected-token:{tokenMint}", pageSize: 1, maxPageSize: 1, previewLimit: 1, supportsPagination: false },
  { tabKey: "bundle", label: "Bundle Volume - Bundle Actions", component: "bundleHtml", endpoint: "composite:/api/web/balances+/api/web/positions", category: "bundle:volume", refreshMs: 25_000, staleMs: 60_000, cacheKey: "bundle:volume:{tokenMint}", pageSize: 1, maxPageSize: 1, previewLimit: 1, supportsPagination: false },
  { tabKey: "volume", label: "Bundle Volume - Volume Flags", component: "volumeHtml", endpoint: "composite:/api/web/live-pairs+/api/web/balances", category: "signals:bundle-volume", refreshMs: 25_000, staleMs: 60_000, cacheKey: "signals:bundle-volume:{tokenMint}", pageSize: 1, maxPageSize: 1, previewLimit: 1, supportsPagination: false },
  { tabKey: "sniper", label: "Sniper - Launch Snipe Candidates", component: "sniperHtml", endpoint: "/api/web/sniper/scan", category: "scanner:launch-snipe", refreshMs: 20_000, staleMs: 45_000, cacheKey: "scanner:launch-snipe:{scanMode}", pageSize: 36, maxPageSize: 72, previewLimit: 12, supportsPagination: true },
  { tabKey: "launch", label: "Launch Snipe - Launch Watches", component: "launchHtml", endpoint: "/api/web/launch/watches", category: "launch:watches", refreshMs: 15_000, staleMs: 35_000, cacheKey: "launch:watches", pageSize: 20, maxPageSize: 40, previewLimit: 8, supportsPagination: false },
  { tabKey: "launchCoin", label: "Pump Launch - Launch Status", component: "launchCoinHtml", endpoint: "/api/web/launch/watches", category: "pump-launch:status", refreshMs: 20_000, staleMs: 60_000, cacheKey: "pump-launch:status", pageSize: 10, maxPageSize: 20, previewLimit: 5, supportsPagination: false },
  { tabKey: "wallets", label: "Wallets/Balances", component: "walletsHtml", endpoint: "composite:/api/web/wallets+/api/web/balances", category: "portfolio:wallets-balances", refreshMs: 20_000, staleMs: 45_000, cacheKey: "portfolio:wallets-balances", pageSize: 25, maxPageSize: 50, previewLimit: 8, supportsPagination: false },
  { tabKey: "positions", label: "Positions", component: "positionsHtml", endpoint: "/api/web/positions", category: "portfolio:positions", refreshMs: 12_000, staleMs: 30_000, cacheKey: "portfolio:positions", pageSize: 25, maxPageSize: 50, previewLimit: 8, supportsPagination: false },
  { tabKey: "pnl", label: "PnL", component: "pnlHtml", endpoint: "/api/web/pnl", category: "portfolio:pnl", refreshMs: 20_000, staleMs: 45_000, cacheKey: "portfolio:pnl", pageSize: 50, maxPageSize: 100, previewLimit: 10, supportsPagination: false },
  { tabKey: "ogreAi", label: "Ogre A.I.", component: "ogreAiHtml", endpoint: "local:ogre-ai-results", category: "tool:ogre-ai", refreshMs: 30_000, staleMs: 90_000, cacheKey: "tool:ogre-ai", pageSize: 10, maxPageSize: 20, previewLimit: 5, supportsPagination: false },
  { tabKey: "ogreTek", label: "Ogre TeK / Perp Mode", component: "ogreTekHtml", endpoint: "local:perps-provider", category: "perps:ogre-tek", refreshMs: 30_000, staleMs: 90_000, cacheKey: "perps:ogre-tek", pageSize: 25, maxPageSize: 50, previewLimit: 8, supportsPagination: false }
];
const TERMINAL_FEED_MAP = Object.fromEntries(TERMINAL_FEEDS.map((feed) => [feed.tabKey, feed]));

const SLIMEWIRE_CRITICAL_IMAGE_ASSETS = [
  "./assets/slimewire/png/slimewire-mark.png",
  "./assets/slimewire/svg/icons/wallet.svg",
  "./assets/slimewire/svg/icons/terminal.svg",
  "./assets/slimewire/svg/icons/chart.svg",
  "./assets/slimewire/svg/icons/refresh.svg",
  "./assets/slimewire/svg/powered-by-ogres-badge.svg",
  "./assets/slimewire/clean-ui/wallet_icons/default/phantom.png",
  "./assets/slimewire/clean-ui/wallet_icons/default/solflare.png",
  "./assets/slimewire/png/providers/phantom-orb.jpg",
  "./assets/slimewire/png/providers/solflare-orb.jpg",
  "./assets/slimewire/png/token-mascots/token-mascot-1.png",
  "./assets/slimewire/png/token-mascots/token-mascot-2.png",
  "./assets/slimewire/png/token-mascots/token-mascot-3.png"
];

function absoluteAssetUrl(value = "") {
  try {
    return new URL(value, window.location.href).href;
  } catch {
    return String(value || "");
  }
}

function imageSourceMatches(image, fallbackSrc = "") {
  const current = image?.currentSrc || image?.src || image?.getAttribute?.("src") || "";
  return absoluteAssetUrl(current) === absoluteAssetUrl(fallbackSrc);
}

function fallbackImageForSource(image) {
  const explicit = image?.dataset?.fallbackSrc || image?.getAttribute?.("data-fallback-src") || "";
  if (explicit && !imageSourceMatches(image, explicit)) return explicit;
  const source = String(image?.currentSrc || image?.src || image?.getAttribute?.("src") || "").toLowerCase();
  if (source.includes("phantom")) return walletChoiceIcon("phantom");
  if (source.includes("solflare")) return walletChoiceIcon("solflare");
  if (source.includes("wallet") || source.includes("/icons/")) return "./assets/slimewire/svg/icons/wallet.svg";
  if (source.includes("powered-by") || source.includes("wordmark") || source.includes("slimewire-mark")) return "./assets/slimewire/png/slimewire-mark.png";
  return tokenMascotSrc(image?.alt || source || "slimewire");
}

function logImageFallback(image, fallbackSrc = "", action = "fallback") {
  try {
    console.info("[slimewire_image_fallback]", {
      action,
      className: String(image?.className || "").slice(0, 80),
      fallbackKind: fallbackSrc.includes("phantom")
        ? "phantom"
        : fallbackSrc.includes("solflare")
          ? "solflare"
          : fallbackSrc.includes("wallet.svg")
            ? "wallet"
            : fallbackSrc.includes("token-mascot")
              ? "token-mascot"
              : "brand"
    });
  } catch {
    // Visual fallback logging is best-effort only.
  }
}

function handleSlimewireImageError(event) {
  const image = event?.target;
  if (typeof HTMLImageElement !== "undefined" && !(image instanceof HTMLImageElement)) return;
  if (!image || image.dataset?.fallbackApplied === "true") {
    if (image) image.hidden = true;
    return;
  }
  const fallbackSrc = fallbackImageForSource(image);
  if (!fallbackSrc || imageSourceMatches(image, fallbackSrc)) {
    image.hidden = true;
    logImageFallback(image, "", "hidden");
    return;
  }
  image.dataset.fallbackApplied = "true";
  image.loading = image.loading || "eager";
  image.src = fallbackSrc;
  logImageFallback(image, fallbackSrc, "fallback");
}

function installSlimewireImageFallbacks() {
  if (installSlimewireImageFallbacks.installed) return;
  installSlimewireImageFallbacks.installed = true;
  document.addEventListener("error", handleSlimewireImageError, true);
}

function prewarmSlimewireImageAssets() {
  if (prewarmSlimewireImageAssets.started) return;
  prewarmSlimewireImageAssets.started = true;
  for (const src of SLIMEWIRE_CRITICAL_IMAGE_ASSETS) {
    try {
      const image = new Image();
      image.decoding = "async";
      image.loading = "eager";
      image.src = src;
    } catch {
      // Preloading critical icons should never block the app.
    }
  }
}

function routeForPath(pathname = window.location.pathname) {
  if (pathname.startsWith("/login") || pathname.startsWith("/account/login")) return "login";
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

function closeTransientInteractionLayers({ keepLogin = false } = {}) {
  state.walletConnectMenuOpen = false;
  if (!keepLogin) state.loginModalOpen = false;
  if (state.quickBuyModal?.open) {
    state.quickBuyModal = { ...state.quickBuyModal, open: false, status: "", error: "" };
  }
  syncInteractionLocks();
}

function navigateTo(pathname, tab = null) {
  const startedAt = perfNow();
  const nextPath = pathname || "/terminal";
  state.route = routeForPath(nextPath);
  closeTransientInteractionLayers({ keepLogin: state.route === "login" });
  if (state.route === "login") state.loginModalOpen = true;
  if (state.route === "terminal") state.activeTab = tab || tabForPath(nextPath);
  window.history.pushState({}, "", nextPath);
  applyChartRouteFromLocation();
  render();
  perfMeasure("route-change", startedAt, {
    component: "router",
    details: nextPath
  });
}

window.addEventListener("popstate", () => {
  state.route = routeForPath();
  closeTransientInteractionLayers({ keepLogin: state.route === "login" });
  if (state.route === "login") state.loginModalOpen = true;
  state.activeTab = tabForPath();
  applyChartRouteFromLocation();
  render();
});

function apiUrl(path) {
  return `${apiBase}${path}`;
}

function perfNow() {
  try {
    return window.performance?.now?.() || Date.now();
  } catch {
    return Date.now();
  }
}

function perfMark(name) {
  try {
    window.performance?.mark?.(name);
  } catch {
    // Performance marks are diagnostic only.
  }
}

function safePerfText(value = "", max = 90) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\w .:/?&=#@,+-]/g, "")
    .trim()
    .slice(0, max);
}

function queuePerfPost(payload = {}) {
  pendingPerfPosts.push(payload);
  if (pendingPerfPosts.length > 10) pendingPerfPosts.splice(0, pendingPerfPosts.length - 10);
  if (perfPostTimer) return;
  perfPostTimer = window.setTimeout(() => {
    perfPostTimer = null;
    const batch = pendingPerfPosts.splice(0, pendingPerfPosts.length);
    for (const event of batch) {
      try {
        const body = JSON.stringify(event);
        if (navigator.sendBeacon) {
          const blob = new Blob([body], { type: "application/json" });
          if (navigator.sendBeacon(apiUrl("/api/web/perf-event"), blob)) continue;
        }
        fetch(apiUrl("/api/web/perf-event"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true
        }).catch(() => {});
      } catch {
        // Performance reporting must never affect app behavior.
      }
    }
  }, 750);
}

function scheduleDiagnosticLogPersist(key, valueFactory, timerName) {
  if (timerName === "perf" && perfLogPersistTimer) return;
  if (timerName === "crash" && crashLogPersistTimer) return;
  if (timerName === "feed" && terminalFeedLogPersistTimer) return;
  const persist = () => {
    try {
      window.localStorage?.setItem(key, JSON.stringify(valueFactory() || []));
    } catch {
      // Local diagnostic history is optional.
    }
  };
  const timer = window.setTimeout(() => {
    if (timerName === "perf") perfLogPersistTimer = null;
    if (timerName === "crash") crashLogPersistTimer = null;
    if (timerName === "feed") terminalFeedLogPersistTimer = null;
    persist();
  }, LOCAL_DIAGNOSTIC_WRITE_DEBOUNCE_MS);
  if (timerName === "perf") perfLogPersistTimer = timer;
  if (timerName === "crash") crashLogPersistTimer = timer;
  if (timerName === "feed") terminalFeedLogPersistTimer = timer;
}

function recordPerfEvent(event = {}) {
  const durationMs = Number(event.durationMs);
  const payload = {
    at: new Date().toISOString(),
    route: safePerfText(event.route || state.route || routeForPath(), 40),
    component: safePerfText(event.component || "", 60),
    action: safePerfText(event.action || "", 70),
    durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : 0,
    resultCount: Number.isFinite(Number(event.resultCount)) ? Math.max(0, Math.round(Number(event.resultCount))) : 0,
    cacheHit: Boolean(event.cacheHit),
    stale: Boolean(event.stale),
    requestId: safePerfText(event.requestId || "", 80),
    errorCode: safePerfText(event.errorCode || "", 60),
    details: safePerfText(event.details || "", 140)
  };
  state.perfLog = [...(state.perfLog || []), payload].slice(-100);
  scheduleDiagnosticLogPersist(PERF_LOG_KEY, () => state.perfLog, "perf");
  if (payload.durationMs >= PERF_POST_MIN_DURATION_MS || /refresh|long-task|route|tab-switch|dedupe|manual-sell|ui-action|interaction-delay/i.test(payload.action)) {
    queuePerfPost(payload);
  }
  return payload;
}

function perfMeasure(action, startedAt, event = {}) {
  recordPerfEvent({
    ...event,
    action,
    durationMs: perfNow() - startedAt
  });
}

window.SlimeWireChartFrameLoaded = function SlimeWireChartFrameLoaded(mode = "chart", mint = "") {
  perfMark("chartFirstPaint");
  recordPerfEvent({
    component: "smartChart",
    action: "chart-first-paint",
    durationMs: 0,
    cacheHit: Boolean(smartChartBootstrapForMint(mint)?.cacheHit),
    stale: Boolean(smartChartBootstrapForMint(mint)?.stale),
    details: `${safePerfText(mode, 20)}:${safePerfText(mint, 60)}`
  });
};

function recordCrashEvent(event = {}) {
  const payload = {
    at: new Date().toISOString(),
    route: safePerfText(event.route || state.route || routeForPath(), 40),
    actionBeforeCrash: safePerfText(event.actionBeforeCrash || state.postTradeRefresh?.action || "", 70),
    errorCode: safePerfText(event.errorCode || event.name || "FRONTEND_ERROR", 60),
    message: safePerfText(event.message || "", 160),
    component: safePerfText(event.component || "", 80),
    requestId: safePerfText(event.requestId || state.postTradeRefresh?.attemptId || "", 80),
    caughtByBoundary: Boolean(event.caughtByBoundary)
  };
  state.crashLog = [...(state.crashLog || []), payload].slice(-50);
  scheduleDiagnosticLogPersist(CRASH_LOG_KEY, () => state.crashLog, "crash");
  queuePerfPost({
    ...payload,
    component: payload.component || "frontend-crash",
    action: "frontend-crash",
    durationMs: 0,
    details: payload.message
  });
  return payload;
}

function installCrashInstrumentation() {
  if (state.crashInstrumentationInstalled) return;
  state.crashInstrumentationInstalled = true;
  window.addEventListener("error", (event) => {
    if (event?.target && event.target !== window) return;
    recordCrashEvent({
      errorCode: event?.error?.name || "WINDOW_ERROR",
      message: event?.message || event?.error?.message || "Window error",
      component: "window.onerror"
    });
  });
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason || {};
    recordCrashEvent({
      errorCode: reason?.name || "UNHANDLED_REJECTION",
      message: reason?.message || String(reason || "Unhandled promise rejection"),
      component: "window.unhandledrejection"
    });
  });
}

function createClientAttemptId(prefix = "attempt") {
  const normalized = String(prefix || "attempt").replace(/[^\w-]/g, "").slice(0, 24) || "attempt";
  return globalThis.crypto?.randomUUID?.()
    ? `${normalized}-${globalThis.crypto.randomUUID()}`
    : `${normalized}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function tradeActionKey(action = "", tokenMint = "", detail = "") {
  return `${String(action || "").trim()}:${String(tokenMint || "").trim()}:${String(detail || "").trim()}`;
}

function activeTradeAction(action = "", tokenMint = "", detail = "") {
  const key = tradeActionKey(action, tokenMint, detail);
  const exact = state.tradeActionLocks?.[key];
  if (exact && ["clicked", "submitting", "submitted", "confirming"].includes(exact.state)) return exact;
  return null;
}

function setTradeAction(action = "", tokenMint = "", detail = "", patch = {}) {
  const key = tradeActionKey(action, tokenMint, detail);
  const current = state.tradeActionLocks?.[key] || {};
  state.tradeActionLocks = {
    ...(state.tradeActionLocks || {}),
    [key]: {
      ...current,
      action,
      tokenMint,
      detail,
      updatedAt: new Date().toISOString(),
      ...patch
    }
  };
  applyActionButtonStates();
}

function clearTradeActionLater(action = "", tokenMint = "", detail = "", delayMs = 2400) {
  const key = tradeActionKey(action, tokenMint, detail);
  window.setTimeout(() => {
    const current = state.tradeActionLocks?.[key];
    if (!current || ["clicked", "submitting", "confirming"].includes(current.state)) return;
    const next = { ...(state.tradeActionLocks || {}) };
    delete next[key];
    state.tradeActionLocks = next;
    applyActionButtonStates();
    render();
  }, delayMs);
}

function manualSellKey(tokenMint = "", percent = "") {
  return `${String(tokenMint || "").trim()}:${String(percent || "").trim()}`;
}

function activeManualSellAction(tokenMint = "", percent = "") {
  const exact = state.manualSellActions?.[manualSellKey(tokenMint, percent)];
  if (exact && ["clicked", "submitting", "submitted", "confirming"].includes(exact.state)) return exact;
  return Object.entries(state.manualSellActions || {})
    .find(([key, action]) => key.startsWith(`${String(tokenMint || "").trim()}:`) && ["clicked", "submitting", "submitted", "confirming"].includes(action?.state))?.[1] || null;
}

function setManualSellAction(tokenMint, percent, patch = {}) {
  const key = manualSellKey(tokenMint, percent);
  const current = state.manualSellActions?.[key] || {};
  state.manualSellActions = {
    ...(state.manualSellActions || {}),
    [key]: {
      ...current,
      tokenMint,
      percent: String(percent || current.percent || "100"),
      updatedAt: new Date().toISOString(),
      ...patch
    }
  };
  applyActionButtonStates();
}

function clearManualSellActionLater(tokenMint, percent, delayMs = 2_400) {
  const key = manualSellKey(tokenMint, percent);
  window.setTimeout(() => {
    const current = state.manualSellActions?.[key];
    if (!current || ["clicked", "submitting", "confirming"].includes(current.state)) return;
    const next = { ...(state.manualSellActions || {}) };
    delete next[key];
    state.manualSellActions = next;
    applyActionButtonStates();
    render();
  }, delayMs);
}

function setPositionRefreshAction(nextState, patch = {}) {
  const now = perfNow();
  const startedAt = patch.startedAt || state.positionRefreshAction?.startedAt || now;
  state.positionRefreshAction = {
    state: nextState,
    startedAt,
    minUntil: Math.max(state.positionRefreshAction?.minUntil || 0, now + (nextState === "clicked" || nextState === "success" ? 700 : 0)),
    error: "",
    updatedAt: new Date().toISOString(),
    ...patch
  };
  applyActionButtonStates();
}

function finishPositionRefreshAction(nextState, patch = {}) {
  const minUntil = state.positionRefreshAction?.minUntil || 0;
  const delayMs = Math.max(0, minUntil - perfNow());
  if (positionRefreshVisualTimer) window.clearTimeout(positionRefreshVisualTimer);
  positionRefreshVisualTimer = window.setTimeout(() => {
    positionRefreshVisualTimer = null;
    setPositionRefreshAction(nextState, patch);
    render();
    if (nextState === "success") {
      window.setTimeout(() => {
        if (state.positionRefreshAction?.state === "success") {
          state.positionRefreshAction = { state: "idle", startedAt: 0, minUntil: 0, error: "" };
          applyActionButtonStates();
          render();
        }
      }, 900);
    }
  }, delayMs);
}

function buttonBaseLabel(button) {
  if (!button) return "";
  if (!button.dataset.baseLabel) button.dataset.baseLabel = button.textContent.trim() || "Refresh";
  return button.dataset.baseLabel;
}

function applyActionButtonStates() {
  if (document.hidden) return;
  document.querySelectorAll("[data-position-sell]").forEach((button) => {
    const tokenMint = button.dataset.positionSell || "";
    const percent = button.dataset.positionSellPercent || "";
    const action = activeManualSellAction(tokenMint, percent);
    const base = buttonBaseLabel(button);
    const exact = state.manualSellActions?.[manualSellKey(tokenMint, percent)];
    const busy = Boolean(action);
    button.disabled = busy;
    button.dataset.actionState = exact?.state || action?.state || "idle";
    if (!busy) {
      button.textContent = base;
    } else if (exact?.state === "submitted" || exact?.state === "confirming") {
      button.textContent = "Submitted";
    } else {
      button.textContent = "Selling...";
    }
  });

  const currentTradeToken = String(state.tradeToken || $("[data-trade-token]")?.value || "").trim();
  document.querySelectorAll("[data-trade-buy-quick], [data-trade-buy-max], [data-buy-custom]").forEach((button) => {
    const detail = button.dataset.tradeBuyQuick || (button.matches("[data-trade-buy-max]") ? "max" : "custom");
    const action = activeTradeAction("trade-buy", currentTradeToken, detail);
    const base = buttonBaseLabel(button);
    button.disabled = Boolean(action);
    button.dataset.actionState = action?.state || "idle";
    button.textContent = action ? (action.state === "submitted" ? "Submitted" : "Buying...") : base;
  });

  document.querySelectorAll("[data-quick-trade-token]").forEach((button) => {
    const tokenMint = button.dataset.quickTradeToken || "";
    const preset = activeTradePreset();
    const detail = activeQuickBuyAmount(preset) || preset?.amountSol || "quick";
    const action = activeTradeAction("trade-buy", tokenMint, String(detail));
    const base = buttonBaseLabel(button);
    button.disabled = Boolean(action);
    button.dataset.actionState = action?.state || "idle";
    button.textContent = action ? (action.state === "submitted" ? "Submitted" : "Buying...") : base;
  });

  document.querySelectorAll("[data-trade-sell-quick], [data-sell-custom]").forEach((button) => {
    const detail = button.dataset.tradeSellQuick || "custom";
    const action = activeTradeAction("trade-sell", currentTradeToken, detail);
    const base = buttonBaseLabel(button);
    button.disabled = Boolean(action);
    button.dataset.actionState = action?.state || "idle";
    button.textContent = action ? (action.state === "submitted" ? "Submitted" : "Selling...") : base;
  });

  const currentBundleToken = String(state.bundleToken || $("[data-bundle-token]")?.value || "").trim();
  document.querySelectorAll("[data-bundle-buy], [data-bundle-sell]").forEach((button) => {
    const actionName = button.matches("[data-bundle-buy]") ? "bundle-buy" : "bundle-sell";
    const action = activeTradeAction(actionName, currentBundleToken, "bundle");
    const base = buttonBaseLabel(button);
    button.disabled = Boolean(action);
    button.dataset.actionState = action?.state || "idle";
    button.textContent = action ? (action.state === "submitted" ? "Submitted" : actionName === "bundle-buy" ? "Buying..." : "Selling...") : base;
  });

  const paintRefreshButton = (button, refreshState) => {
    const base = buttonBaseLabel(button);
    button.dataset.actionState = refreshState;
    if (refreshState === "clicked" || refreshState === "refreshing") {
      button.textContent = "Refreshing...";
    } else if (refreshState === "success") {
      button.textContent = "Updated";
    } else if (refreshState === "error") {
      button.textContent = "Failed";
    } else {
      button.textContent = base;
    }
  };
  const actionRefreshState = state.positionRefreshAction?.state || "idle";
  document.querySelectorAll("[data-refresh-all]").forEach((button) => {
    paintRefreshButton(button, actionRefreshState);
  });
  const topRefreshState = state.walletRefreshing ? "refreshing" : actionRefreshState;
  document.querySelectorAll("[data-top-refresh-wallet]").forEach((button) => {
    paintRefreshButton(button, topRefreshState);
  });
}

function installPerformanceInstrumentation() {
  if (state.perfInstrumentationInstalled) return;
  state.perfInstrumentationInstalled = true;
  perfMark("slimewire:app-boot");
  try {
    if (!("PerformanceObserver" in window)) return;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (Number(entry.duration || 0) < 50) continue;
        recordPerfEvent({
          component: "main-thread",
          action: "long-task",
          durationMs: entry.duration,
          details: entry.name || "longtask"
        });
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // Some browsers do not expose long task timing.
  }
  try {
    if (!("PerformanceObserver" in window)) return;
    const eventObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const duration = Number(entry.duration || 0);
        if (duration < 80) continue;
        recordPerfEvent({
          component: "input",
          action: "interaction-delay",
          durationMs: duration,
          details: entry.name || entry.entryType || "event"
        });
      }
    });
    eventObserver.observe({ type: "event", buffered: true, durationThreshold: 80 });
  } catch {
    // Event Timing is not available in every browser.
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function publicErrorMessage(message = "", options = {}) {
  const text = String(message || "");
  if (options.preserveSafeError) return text;
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
  const { timeoutMs = API_CONNECT_TIMEOUT_MS, preserveSafeError = false, dedupe = true, ...fetchOptions } = options || {};
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const startedAt = perfNow();
  const dedupeKey = dedupe && method === "GET"
    ? `${method}:${path}:${state.token ? state.token.slice(0, 12) : "guest"}`
    : "";
  if (dedupeKey && apiInFlight.has(dedupeKey)) {
    recordPerfEvent({
      component: "api",
      action: "api-dedupe",
      durationMs: 0,
      cacheHit: true,
      details: path
    });
    return apiInFlight.get(dedupeKey);
  }

  const requestPromise = (async () => {
  const headers = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {})
  };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  let response;
  let lastError = null;
  try {
    response = await fetchWithTimeout(apiUrl(path), { ...fetchOptions, headers, cache: "no-store" }, timeoutMs);
  } catch (error) {
    lastError = error;
    await wakeApi(apiBase);
    await sleep(900);
    try {
      response = await fetchWithTimeout(apiUrl(path), { ...fetchOptions, headers, cache: "no-store" }, timeoutMs);
    } catch (retryError) {
      lastError = retryError;
      for (const fallbackBase of apiCandidates) {
        if (fallbackBase === apiBase) continue;
        try {
          await wakeApi(fallbackBase);
          response = await fetchWithTimeout(`${fallbackBase}${path}`, { ...fetchOptions, headers, cache: "no-store" }, timeoutMs);
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
    const isLaunchError = preserveSafeError || path === "/api/web/launch/coin" || Boolean(data.launchAttemptId || data.launch?.launchAttemptId);
    const message = publicErrorMessage(data.message || data.launch?.failureReason || data.error || `HTTP ${response.status}`, {
      preserveSafeError: isLaunchError
    });
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    error.code = data.errorCode || data.launch?.errorCode || data.error || "";
    error.stage = data.stage || data.launch?.stage || "";
    error.launchAttemptId = data.launchAttemptId || data.launch?.launchAttemptId || "";
    error.providerStatus = data.providerStatus || data.launch?.providerStatus || null;
    if (response.status === 401) {
      resetWebSession(message);
    }
    throw error;
  }

  perfMeasure("api-request", startedAt, {
    component: "api",
    details: path,
    resultCount: Array.isArray(data?.rows) ? data.rows.length : 0
  });
  return data;
  })();

  if (dedupeKey) {
    apiInFlight.set(dedupeKey, requestPromise);
    requestPromise.then(() => {
      if (apiInFlight.get(dedupeKey) === requestPromise) apiInFlight.delete(dedupeKey);
    }, () => {
      if (apiInFlight.get(dedupeKey) === requestPromise) apiInFlight.delete(dedupeKey);
    });
  }

  return requestPromise;
}

async function readApiJson(response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    const normalizedText = text.toLowerCase();
    const oversized = response.status === 413 || normalizedText.includes("payload too large") || normalizedText.includes("request entity too large");
    return {
      ok: false,
      error: oversized ? "payload_too_large" : "invalid_api_response",
      message: oversized
        ? "Launch upload is too large. Use a smaller token image and try again."
        : contentType.includes("text/html")
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
    const element = visibleElement(selector);
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
  return visibleElement("[data-login-status]") || visibleConnectStatus;
}

function visibleElement(selector) {
  const candidates = [...document.querySelectorAll(selector)];
  return candidates.find((element) => !element.closest("[hidden]") && element.offsetParent !== null)
    || candidates.find((element) => !element.closest("[hidden]"))
    || candidates[0]
    || null;
}

function walletConnectStatusElement() {
  return visibleElement("[data-wallet-connect-modal] [data-wallet-connect-status]")
    || visibleElement("[data-wallet-connect-status]");
}

function setWalletConnectStatus(message = "") {
  state.walletConnectStatus = String(message || "");
  writeText(walletConnectStatusElement(), state.walletConnectStatus);
}

function walletInstallGuidance(providerId = "solana") {
  const label = walletProviderLabel(providerId);
  if (isMobileWalletPlatform()) {
    if (mobileWalletConnectBaseUrl(providerId)) {
      return `${label} is not injected in this browser. Tap Open ${label} to use the mobile wallet connect flow, or choose another wallet option.`;
    }
    if (walletBrowseDeepLink(providerId)) {
      return `${label} is not injected in this browser. Use Open ${label} to continue in the wallet app, or choose another wallet option.`;
    }
    return `${label} is not available in this browser. Install or open the wallet app, or choose another wallet option.`;
  }
  return `${label} extension not found. Install or unlock ${label}, or choose another wallet.`;
}

function logWalletConnectFailure(providerId = "solana", error = null, extra = {}) {
  const provider = walletProviderById(providerId);
  const detail = {
    walletName: walletProviderLabel(providerId, provider),
    userId: state.user?.id || "",
    route: state.route,
    adapterReadyState: provider ? "detected" : "not_detected",
    errorName: error?.name || "",
    errorMessage: String(error?.message || error || "").slice(0, 240),
    ...extra
  };
  try {
    console.warn("[slimewire_wallet_connect]", detail);
  } catch {
    // Console logging should never block wallet connection.
  }
}

function focusLoginField(connectPanel = state.route === "connect") {
  window.setTimeout(() => {
    const selector = state.loginModalOpen
      ? `[data-login-modal-${state.loginModalTab === "create" ? "create" : "login"}-section] [data-login-username], [data-login-modal-${state.loginModalTab === "create" ? "create" : "login"}-section] [data-login-password]`
      : connectPanel
        ? "[data-connect-login-username], [data-connect-login-password]"
        : "[data-login-username], [data-login-password]";
    const input = visibleElement(selector);
    input?.focus?.();
  }, 0);
}

function currentReturnPath() {
  try {
    return `${window.location.pathname || "/terminal"}${window.location.search || ""}${window.location.hash || ""}`;
  } catch {
    return "/terminal";
  }
}

function loginFallbackRoute(returnTo = currentReturnPath()) {
  return `/login?returnTo=${encodeURIComponent(returnTo || "/terminal")}`;
}

function safeLoginEventText(value = "", max = 80) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\w .:/?&=#@-]/g, "")
    .trim()
    .slice(0, max);
}

function recordLockInClicked(source = "unknown") {
  const now = Date.now();
  if (now - Number(state.lastLockInClickAt || 0) < 300) return;
  state.lastLockInClickAt = now;
  const detail = {
    route: safeLoginEventText(state.route || routeForPath(), 40),
    viewport: Math.round(window.innerWidth || 0),
    source: safeLoginEventText(source, 60),
    at: new Date(now).toISOString()
  };
  try {
    const history = JSON.parse(window.localStorage?.getItem("slimewireLockInClicks") || "[]");
    history.push(detail);
    window.localStorage?.setItem("slimewireLockInClicks", JSON.stringify(history.slice(-10)));
  } catch {
    // Local click history is only diagnostic.
  }
  try {
    console.info("LOCK_IN_CLICKED", detail);
  } catch {
    // Safe diagnostic logging should never block login.
  }
  try {
    void api("/api/web/lock-in-clicked", {
      method: "POST",
      timeoutMs: 3000,
      body: JSON.stringify(detail)
    }).catch(() => {});
  } catch {
    // Server logging is best-effort.
  }
}

function openLoginModal({ defaultTab = "login", returnTo = currentReturnPath(), source = "unknown", connectPanel = state.route === "connect" } = {}) {
  recordLockInClicked(source);
  state.loginModalOpen = true;
  state.loginModalTab = defaultTab === "create" ? "create" : "login";
  state.loginReturnTo = returnTo || currentReturnPath();
  state.loginCollapsed = false;
  state.walletConnectMenuOpen = false;
  if (!loginModal && !topLoginPanel) {
    window.location.assign(loginFallbackRoute(state.loginReturnTo));
    return;
  }
  render({ force: true });
  focusLoginField(connectPanel);
}

function openLoginPanel(options = {}) {
  openLoginModal(options);
}

function isMobileWalletPlatform() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || "");
}

function appBrowseUrl() {
  try {
    const url = new URL(window.location.href);
    url.hash = "";
    return url.toString();
  } catch {
    return window.location.href;
  }
}

function appBrowseRef() {
  try {
    return new URL(window.location.href).origin;
  } catch {
    return "https://slimewire.org";
  }
}

function walletBrowseDeepLink(providerId = "") {
  if (!isMobileWalletPlatform()) return "";
  const appUrl = encodeURIComponent(appBrowseUrl());
  const ref = encodeURIComponent(appBrowseRef());
  if (providerId === "phantom") return `https://phantom.app/ul/browse/${appUrl}?ref=${ref}`;
  if (providerId === "solflare") return `https://solflare.com/ul/v1/browse/${appUrl}?ref=${ref}`;
  return "";
}

function walletInstallUrl(providerId = "") {
  if (providerId === "phantom") return "https://phantom.app/download";
  if (providerId === "solflare") return "https://solflare.com/download";
  if (providerId === "backpack") return "https://backpack.app/download";
  return "";
}

function walletChoiceIcon(providerId = "") {
  if (providerId === "phantom") return "./assets/slimewire/clean-ui/wallet_icons/default/phantom.png";
  if (providerId === "solflare") return "./assets/slimewire/clean-ui/wallet_icons/default/solflare.png";
  return "./assets/slimewire/svg/icons/wallet.svg";
}

function base58Encode(bytes) {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (!source.length) return "";
  let value = 0n;
  for (const byte of source) value = (value << 8n) + BigInt(byte);
  let encoded = "";
  while (value > 0n) {
    const mod = Number(value % 58n);
    encoded = BASE58_ALPHABET[mod] + encoded;
    value /= 58n;
  }
  for (const byte of source) {
    if (byte !== 0) break;
    encoded = "1" + encoded;
  }
  return encoded || "1";
}

function base58Decode(value = "") {
  const text = String(value || "").trim();
  if (!text) return new Uint8Array();
  let decoded = 0n;
  for (const char of text) {
    const index = BASE58_LOOKUP.get(char);
    if (index === undefined) throw new Error("Invalid wallet callback encoding.");
    decoded = decoded * 58n + BigInt(index);
  }
  const bytes = [];
  while (decoded > 0n) {
    bytes.unshift(Number(decoded & 255n));
    decoded >>= 8n;
  }
  for (const char of text) {
    if (char !== "1") break;
    bytes.unshift(0);
  }
  return new Uint8Array(bytes);
}

function mobileWalletCallbackUrl(providerId = "phantom", stateId = "", returnPath = state.walletConnectReturnPath || "/terminal", pendingConnectId = "") {
  const url = new URL(returnPath || window.location.pathname || "/terminal", window.location.origin);
  url.searchParams.delete("sw_wallet");
  url.searchParams.delete("sw_wallet_state");
  url.searchParams.delete("sw_wallet_pending");
  url.searchParams.delete("phantom_encryption_public_key");
  url.searchParams.delete("solflare_encryption_public_key");
  url.searchParams.delete("nonce");
  url.searchParams.delete("data");
  url.searchParams.delete("errorCode");
  url.searchParams.delete("errorMessage");
  url.searchParams.set("sw_wallet", providerId);
  url.searchParams.set("sw_wallet_state", stateId);
  if (pendingConnectId) url.searchParams.set("sw_wallet_pending", pendingConnectId);
  return url.toString();
}

function cleanMobileWalletCallbackParams() {
  try {
    const url = new URL(window.location.href);
    [
      "sw_wallet",
      "sw_wallet_state",
      "sw_wallet_pending",
      "phantom_encryption_public_key",
      "solflare_encryption_public_key",
      "nonce",
      "data",
      "errorCode",
      "errorMessage"
    ].forEach((param) => url.searchParams.delete(param));
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    // URL cleanup is cosmetic; never block a completed wallet callback.
  }
}

function readMobileWalletPending() {
  try {
    const raw = window.sessionStorage?.getItem(MOBILE_WALLET_PENDING_KEY)
      || window.localStorage?.getItem(MOBILE_WALLET_PENDING_BACKUP_KEY)
      || "{}";
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function storeMobileWalletPending(pending) {
  try {
    window.sessionStorage?.setItem(MOBILE_WALLET_PENDING_KEY, JSON.stringify(pending));
  } catch {
    // Session storage can be blocked in some mobile hand-offs.
  }
  try {
    window.localStorage?.setItem(MOBILE_WALLET_PENDING_BACKUP_KEY, JSON.stringify(pending));
  } catch {
    // Local backup is best-effort; server pending state is the durable path.
  }
}

function clearMobileWalletPending() {
  try {
    window.sessionStorage?.removeItem(MOBILE_WALLET_PENDING_KEY);
  } catch {
    // Session cleanup is best-effort.
  }
  try {
    window.localStorage?.removeItem(MOBILE_WALLET_PENDING_BACKUP_KEY);
  } catch {
    // Local cleanup is best-effort.
  }
}

function mobileWalletProviderKeyParam(providerId = "") {
  return providerId === "solflare" ? "solflare_encryption_public_key" : "phantom_encryption_public_key";
}

function mobileWalletConnectBaseUrl(providerId = "") {
  if (providerId === "phantom") return "https://phantom.app/ul/v1/connect";
  if (providerId === "solflare") return "https://solflare.com/ul/v1/connect";
  return "";
}

function mobileWalletConnectUrl(providerId = "", pending = {}) {
  const base = mobileWalletConnectBaseUrl(providerId);
  if (!base) return "";
  const url = new URL(base);
  url.searchParams.set("app_url", appBrowseUrl());
  url.searchParams.set("redirect_link", mobileWalletCallbackUrl(providerId, pending.stateId, pending.returnPath, pending.pendingConnectId));
  url.searchParams.set("dapp_encryption_public_key", pending.dappEncryptionPublicKey);
  url.searchParams.set("cluster", "mainnet-beta");
  return url.toString();
}

function mobileWalletPlatformLabel() {
  if (/Android/i.test(navigator.userAgent || "")) return "android";
  if (/iPhone|iPad|iPod/i.test(navigator.userAgent || "")) return "ios";
  return isMobileWalletPlatform() ? "mobile" : "desktop";
}

function mobileWalletConnectAvailable(providerId = "") {
  return isMobileWalletPlatform()
    && Boolean(mobileWalletConnectBaseUrl(providerId));
}

function mobileWalletBrowserLabel() {
  const ua = navigator.userAgent || "";
  if (/CriOS|Chrome/i.test(ua)) return "chrome";
  if (/Safari/i.test(ua) && !/Chrome|CriOS/i.test(ua)) return "safari";
  if (/Firefox|FxiOS/i.test(ua)) return "firefox";
  return "mobile-browser";
}

async function createServerMobileWalletPending(providerId = "", returnPath = "/terminal") {
  try {
    const data = await api("/api/web/mobile-wallet/start", {
      method: "POST",
      timeoutMs: API_CONNECT_TIMEOUT_MS,
      body: JSON.stringify({
        provider: providerId,
        intendedRoute: returnPath,
        platform: mobileWalletPlatformLabel(),
        browser: mobileWalletBrowserLabel()
      })
    });
    if (!data.pendingConnectId || !data.stateId || !data.dappEncryptionPublicKey) return null;
    return {
      providerId,
      pendingConnectId: data.pendingConnectId,
      stateId: data.stateId,
      returnPath: data.intendedRoute || returnPath,
      dappEncryptionPublicKey: data.dappEncryptionPublicKey,
      createdAt: Date.now(),
      expiresAt: data.expiresAt || "",
      serverManaged: true
    };
  } catch (error) {
    logWalletConnectFailure(providerId, error, {
      action: "mobile_connect_pending_start_failed",
      connectionFlow: "deeplink_connect",
      platform: mobileWalletPlatformLabel()
    });
    return null;
  }
}

function createLocalMobileWalletPending(providerId = "", returnPath = "/terminal") {
  if (!window.nacl?.box?.keyPair || !window.crypto?.getRandomValues) return null;
  const keyPair = window.nacl.box.keyPair();
  const stateBytes = new Uint8Array(16);
  window.crypto.getRandomValues(stateBytes);
  return {
    providerId,
    stateId: base58Encode(stateBytes),
    returnPath,
    dappEncryptionPublicKey: base58Encode(keyPair.publicKey),
    dappEncryptionSecretKey: base58Encode(keyPair.secretKey),
    createdAt: Date.now(),
    serverManaged: false
  };
}

async function startMobileWalletConnect(providerId = "", { returnPath = state.walletConnectReturnPath || "/terminal" } = {}) {
  if (!mobileWalletConnectAvailable(providerId)) return false;
  const pending = await createServerMobileWalletPending(providerId, returnPath)
    || createLocalMobileWalletPending(providerId, returnPath);
  if (!pending) return false;
  storeMobileWalletPending(pending);
  const link = mobileWalletConnectUrl(providerId, pending);
  if (!link) return false;
  const label = walletProviderLabel(providerId);
  setWalletConnectStatus(`Opening ${label} mobile connect. Approve in the wallet app, then return to SlimeWire.`);
  logWalletConnectFailure(providerId, null, {
    action: "mobile_connect_redirect",
    adapterReadyState: "mobile_redirect",
    connectionFlow: "deeplink_connect",
    platform: mobileWalletPlatformLabel()
  });
  window.location.assign(link);
  return true;
}

function openMobileWalletBrowse(providerId = "") {
  const label = walletProviderLabel(providerId);
  const link = walletBrowseDeepLink(providerId);
  if (!link) return false;
  setWalletConnectStatus(`Opening ${label}. If mobile connect is unavailable, use the wallet browser and return to SlimeWire.`);
  logWalletConnectFailure(providerId, null, {
    action: "mobile_browse_redirect",
    adapterReadyState: "mobile_browse",
    connectionFlow: "browse_fallback",
    platform: mobileWalletPlatformLabel()
  });
  window.location.href = link;
  return true;
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

function pumpUrl(tokenMint) {
  const mint = String(tokenMint || "").trim();
  return mint ? `https://pump.fun/coin/${encodeURIComponent(mint)}` : "#";
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
    state.loginModalOpen = false;
    state.activeTab = "dashboard";
    writeText(status, credentials.username ? "Account created. Login saved." : "Account created.");
    queuePostTradeRefresh(data.trade?.signature, "account-create");
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
    state.loginModalOpen = false;
    state.activeTab = "dashboard";
    writeText(status, "Logged in.");
    queuePostTradeRefresh(data.trade?.signature, "password-login");
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

function emailLoginValueFromForm() {
  return firstFormValue(["[data-connect-login-email]", "[data-login-email]"]).trim();
}

function emailCodeValueFromForm() {
  return firstFormValue(["[data-connect-login-code]", "[data-login-code]"]).trim();
}

async function sendEmailLoginCode() {
  setError("");
  const status = loginStatusElement();
  try {
    const email = emailLoginValueFromForm();
    if (!email) throw new Error("Enter the email saved on your web account.");
    writeText(status, "Sending login code...");
    const data = await api("/api/web/email-code", {
      method: "POST",
      body: JSON.stringify({ email })
    });
    writeText(status, data.emailSent ? "Code sent. Check your email, then enter it here." : "Code requested. Check your email if delivery is configured.");
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

async function emailCodeLogin() {
  setError("");
  const status = loginStatusElement();
  try {
    const code = emailCodeValueFromForm();
    if (!code) throw new Error("Enter the login code from your email.");
    writeText(status, "Checking login code...");
    const data = await api("/api/web/login", {
      method: "POST",
      body: JSON.stringify({ code })
    });
    state.token = data.token;
    applyUserFromApi(data.user);
    setStoredToken(state.token);
    state.loginCollapsed = true;
    state.loginModalOpen = false;
    state.activeTab = "dashboard";
    writeText(status, "Logged in.");
    queuePostTradeRefresh(data.trade?.signature, "email-code-login");
  } catch (error) {
    writeText(status, error.message);
    setError(error.message);
  }
}

function decryptMobileWalletPayload(providerId = "", params = new URLSearchParams()) {
  const pending = readMobileWalletPending();
  const stateId = params.get("sw_wallet_state") || "";
  if (!pending.stateId || pending.stateId !== stateId || pending.providerId !== providerId) {
    throw new Error("Wallet callback did not match the pending SlimeWire connection.");
  }
  if (Date.now() - Number(pending.createdAt || 0) > 20 * 60 * 1000) {
    throw new Error("Wallet connection expired. Open Connect Wallet and try again.");
  }
  const providerPublicKey = params.get(mobileWalletProviderKeyParam(providerId)) || "";
  const nonce = params.get("nonce") || "";
  const data = params.get("data") || "";
  if (!providerPublicKey || !nonce || !data) {
    throw new Error("Wallet approval did not return the expected connection data.");
  }
  const nacl = window.nacl;
  if (!nacl?.box?.before || !nacl.box.open?.after) {
    throw new Error("Mobile wallet connection helper did not load. Refresh and try again.");
  }
  const sharedSecret = nacl.box.before(
    base58Decode(providerPublicKey),
    base58Decode(pending.dappEncryptionSecretKey)
  );
  const decrypted = nacl.box.open.after(base58Decode(data), base58Decode(nonce), sharedSecret);
  if (!decrypted) throw new Error("Unable to verify the wallet approval response.");
  const payload = JSON.parse(new TextDecoder().decode(decrypted));
  const publicKey = String(payload.public_key || payload.publicKey || "").trim();
  if (!publicKey) throw new Error("Wallet approved, but no public address was returned.");
  return {
    publicKey,
    session: String(payload.session || ""),
    walletEncryptionPublicKey: providerPublicKey,
    dappEncryptionPublicKey: pending.dappEncryptionPublicKey,
    returnPath: pending.returnPath || "/terminal"
  };
}

async function completeMobileWalletConnection(providerId = "", connection = {}) {
  const status = walletConnectStatusElement();
  await ensureWebAccount(status, "Creating secure web profile for connected wallet...");
  const data = await api("/api/web/profile/connected-wallet", {
    method: "POST",
    body: JSON.stringify({
      publicKey: connection.publicKey,
      provider: walletProviderLabel(providerId)
    })
  });
  applyUserFromApi(data.user || {
    ...state.user,
    connectedWallet: data.profile?.connectedWallet || null
  });
  state.connectedWalletBalance = {
    publicKey: connection.publicKey,
    shortPublicKey: shortAddress(connection.publicKey),
    provider: walletProviderLabel(providerId),
    tokens: []
  };
  try {
    window.sessionStorage?.setItem(`${MOBILE_WALLET_SESSION_PREFIX}${providerId}`, JSON.stringify({
      providerId,
      publicKey: connection.publicKey,
      session: connection.session,
      walletEncryptionPublicKey: connection.walletEncryptionPublicKey,
      dappEncryptionPublicKey: connection.dappEncryptionPublicKey,
      connectedAt: new Date().toISOString()
    }));
  } catch {
    // Session persistence is optional; the public wallet is already saved server-side.
  }
  clearMobileWalletPending();
  cleanMobileWalletCallbackParams();
  state.walletConnectMenuOpen = false;
  setWalletConnectStatus(`Connected ${shortAddress(connection.publicKey)}. Opening Live Terminal...`);
  navigateTo(connection.returnPath || state.walletConnectReturnPath || "/terminal", "terminal");
  render({ force: true });
  refreshTerminalEntryInBackground("mobile-wallet-connect");
}

function mobileWalletCallbackBody(providerId = "", params = new URLSearchParams()) {
  return {
    provider: providerId,
    pendingConnectId: params.get("sw_wallet_pending") || readMobileWalletPending().pendingConnectId || "",
    stateId: params.get("sw_wallet_state") || "",
    queryKeys: [...params.keys()].filter((key) => key !== "data" && key !== "nonce"),
    walletEncryptionPublicKey: params.get(mobileWalletProviderKeyParam(providerId)) || "",
    nonce: params.get("nonce") || "",
    data: params.get("data") || "",
    errorCode: params.get("errorCode") || "",
    errorMessage: params.get("errorMessage") || ""
  };
}

async function applyServerMobileWalletFinalization(providerId = "", data = {}) {
  if (data.token) {
    state.token = data.token;
    setStoredToken(state.token);
  }
  applyUserFromApi(data.user || {
    ...state.user,
    connectedWallet: data.connectedWallet || data.profile?.connectedWallet || null
  });
  const publicKey = data.publicKey || data.connectedWallet?.publicKey || data.profile?.connectedWallet?.publicKey || "";
  if (publicKey) {
    state.connectedWalletBalance = {
      publicKey,
      shortPublicKey: shortAddress(publicKey),
      provider: data.provider || walletProviderLabel(providerId),
      tokens: []
    };
  }
  clearMobileWalletPending();
  cleanMobileWalletCallbackParams();
  state.walletConnectMenuOpen = false;
  setWalletConnectStatus(publicKey ? `Connected ${shortAddress(publicKey)}. Opening Live Terminal...` : "Wallet connected. Opening Live Terminal...");
  navigateTo(data.finalRedirectRoute || state.walletConnectReturnPath || "/terminal", "terminal");
  render({ force: true });
  refreshTerminalEntryInBackground("mobile-wallet-callback");
}

async function completeServerMobileWalletCallback(providerId = "", params = new URLSearchParams()) {
  const data = await api("/api/web/mobile-wallet/callback", {
    method: "POST",
    timeoutMs: API_CONNECT_TIMEOUT_MS,
    body: JSON.stringify(mobileWalletCallbackBody(providerId, params))
  });
  await applyServerMobileWalletFinalization(providerId, data);
  return true;
}

async function handleMobileWalletReturn() {
  const params = new URLSearchParams(window.location.search || "");
  const providerId = params.get("sw_wallet") || "";
  if (!["phantom", "solflare"].includes(providerId)) return false;
  state.walletConnectMenuOpen = true;
  const label = walletProviderLabel(providerId);
  const pendingConnectId = params.get("sw_wallet_pending") || "";
  const errorCode = params.get("errorCode") || "";
  const errorMessage = params.get("errorMessage") || "";
  if (errorCode || errorMessage) {
    if (pendingConnectId) {
      await completeServerMobileWalletCallback(providerId, params).catch(() => {});
    }
    clearMobileWalletPending();
    cleanMobileWalletCallbackParams();
    setWalletConnectStatus(`${label} did not connect: ${errorMessage || errorCode || "request cancelled"}. Choose another wallet or try again.`);
    logWalletConnectFailure(providerId, new Error(errorMessage || errorCode || "Wallet connect cancelled"), {
      action: "mobile_connect_cancelled",
      connectionFlow: "deeplink_connect",
      platform: mobileWalletPlatformLabel()
    });
    render({ force: true });
    return true;
  }
  try {
    setWalletConnectStatus(`Finishing ${label} mobile connection...`);
    if (pendingConnectId) {
      await completeServerMobileWalletCallback(providerId, params);
    } else {
      const connection = decryptMobileWalletPayload(providerId, params);
      await completeMobileWalletConnection(providerId, connection);
    }
  } catch (error) {
    if (pendingConnectId) {
      try {
        const connection = decryptMobileWalletPayload(providerId, params);
        await completeMobileWalletConnection(providerId, connection);
      } catch {
        setWalletConnectStatus(`${label} mobile connection could not finish: ${error.message}`);
        logWalletConnectFailure(providerId, error, {
          action: "mobile_connect_callback_failed",
          connectionFlow: "deeplink_connect",
          platform: mobileWalletPlatformLabel()
        });
        cleanMobileWalletCallbackParams();
        render({ force: true });
      }
    } else {
      setWalletConnectStatus(`${label} mobile connection could not finish: ${error.message}`);
      logWalletConnectFailure(providerId, error, {
        action: "mobile_connect_callback_failed",
        connectionFlow: "deeplink_connect",
        platform: mobileWalletPlatformLabel()
      });
      cleanMobileWalletCallbackParams();
      render({ force: true });
    }
  }
  return true;
}

async function createAccountAndConnectWallet() {
  setError("");
  const status = walletConnectStatusElement() || loginStatusElement();
  try {
    writeText(status, "Choose a wallet provider to connect.");
    openWalletConnectChooser({ returnPath: "/terminal" });
  } catch (error) {
    writeText(status, error.message);
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
    render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
    void refreshWalletState({ force: false, deep: false, reason: "session-load" }).catch((error) => {
      state.walletRefreshError = error.message || "Wallet refresh failed.";
      render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
    });
  } catch {
    state.token = "";
    clearStoredToken();
    render();
  }
}

async function loadAll(options = {}) {
  const startedAt = perfNow();
  if (!state.user || !state.token) {
    state.wallets = [];
    state.balances = [];
    state.positions = [];
    state.pnl = null;
    state.connectedWalletBalance = null;
    state.launchWatches = [];
    state.presets = { trade: [], bundle: [] };
    state.tradePlans = [];
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
      const [pnl, launchWatches, presets, watchlist, tradePlans] = await Promise.all([
        api("/api/web/pnl"),
        api("/api/web/launch/watches"),
        api("/api/web/presets"),
        api("/api/web/watchlist"),
        api("/api/web/trade/plans")
      ]);
      state.pnl = pnl.pnl || null;
      state.launchWatches = launchWatches.watches || [];
      state.presets = presets.presets || { trade: [], bundle: [] };
      ensureSelectedPresetsStillExist();
      state.watchlist = watchlist.watchlist || { rows: [], count: 0 };
      state.tradePlans = tradePlans.plans || [];
      ensureAutoExitWatchForActivePlans();
      return;
    }
    const [wallets, balances, positions, pnl, launchWatches, presets, watchlist, tradePlans] = await Promise.all([
      api("/api/web/wallets"),
      api(`/api/web/balances${forceQuery}`),
      api(`/api/web/positions${forceQuery}`),
      api("/api/web/pnl"),
      api("/api/web/launch/watches"),
      api("/api/web/presets"),
      api("/api/web/watchlist"),
      api("/api/web/trade/plans")
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
    state.tradePlans = tradePlans.plans || [];
    ensureAutoExitWatchForActivePlans();
    if (options.force) {
      state.lastWalletRefreshAt = new Date().toISOString();
      state.walletRefreshError = "";
    }
  } finally {
    perfMeasure("load-all", startedAt, {
      component: "wallet",
      resultCount: (state.balances?.length || 0) + (state.positions?.length || 0),
      details: options.skipCore ? "skip-core" : "core"
    });
    if (showLoading) {
      state.loading = false;
    }
    render();
  }
}

async function loadWalletCore(options = {}) {
  if (!state.user || !state.token) return;
  const startedAt = perfNow();
  const requestId = options.requestId || 0;
  const isStaleWalletRefresh = () => requestId && state.walletRefreshRequestId !== requestId;
  const forceQuery = options.force ? "?force=true" : "";
  const positionsForceQuery = options.force || options.deep ? "?force=true" : "";
  const timeoutMs = options.timeoutMs || API_CONNECT_TIMEOUT_MS;
  const walletsPromise = api("/api/web/wallets", { timeoutMs });
  const balancesPromise = api(`/api/web/balances${forceQuery}`, { timeoutMs });
  const tradePlansPromise = api("/api/web/trade/plans", { timeoutMs });
  const [wallets, balances, tradePlans] = await Promise.all([
    walletsPromise,
    balancesPromise,
    tradePlansPromise
  ]);
  if (isStaleWalletRefresh()) return;
  state.wallets = wallets.wallets || [];
  state.balances = balances.balances || [];
  state.connectedWalletBalance = balances.connectedWallet || null;
  state.tradePlans = tradePlans.plans || [];
  ensureAutoExitWatchForActivePlans();
  state.lastWalletRefreshAt = new Date().toISOString();
  state.walletRefreshError = "";
  perfMeasure("wallet-refresh", startedAt, {
    component: "wallet",
    resultCount: state.balances.length,
    cacheHit: Boolean(balances.cacheHit),
    details: `wallets=${state.wallets.length};connected=${Boolean(state.connectedWalletBalance)}`
  });
  if (options.progress !== false) render({ preserveSmartChartFrame: Boolean(options.preserveSmartChartFrame) });
  if (options.deep) {
    const positionsStartedAt = perfNow();
    const positionsPromise = api(`/api/web/positions${positionsForceQuery}`, { timeoutMs }).catch((error) => ({ __error: error }));
    try {
      const positions = await positionsPromise;
      if (positions?.__error) throw positions.__error;
      if (isStaleWalletRefresh()) return;
      state.positions = positions.positions || [];
      state.lastWalletRefreshAt = new Date().toISOString();
      state.walletRefreshError = "";
      perfMeasure("positions-refresh", positionsStartedAt, {
        component: "positions",
        resultCount: state.positions.length,
        cacheHit: Boolean(positions.cacheHit),
        details: `open=${state.positions.length}`
      });
    } catch (error) {
      state.walletRefreshError = error.message || "Position refresh failed.";
      perfMeasure("positions-refresh", positionsStartedAt, {
        errorCode: error?.code || error?.name || "POSITIONS_REFRESH_FAILED",
        component: "positions",
        details: publicErrorMessage(error?.message || "Position refresh failed.")
      });
    }
  }
}

function positionRowsNeedValueRefresh(rows = state.positions) {
  return (Array.isArray(rows) ? rows : []).some((position) => {
    const hasEstimatedValue = position?.estimatedValueSol !== null && position?.estimatedValueSol !== undefined && position?.estimatedValueSol !== "";
    return Boolean(position?.valuePending || (!hasEstimatedValue && /refreshing|updating|background/i.test(position?.valueError || "")));
  });
}

function schedulePositionsValueRefresh(delayMs = 300, reason = "positions-value-followup") {
  if (!state.user || !state.token) return;
  if (positionsValueRefreshTimer) window.clearTimeout(positionsValueRefreshTimer);
  positionsValueRefreshTimer = window.setTimeout(() => {
    positionsValueRefreshTimer = null;
    refreshWalletPositions({
      force: true,
      fast: false,
      silent: true,
      followUpValues: false,
      reason,
      timeoutMs: POSITIONS_REFRESH_TIMEOUT_MS
    }).then((refreshed) => {
      if (refreshed) {
        state.lastWalletRefreshAt = new Date().toISOString();
        render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
      }
    }).catch(() => {});
  }, Math.max(0, Number(delayMs) || 0));
}

function mergePositionRefreshRows(nextRows = [], previousRows = [], options = {}) {
  const previousByMint = new Map((Array.isArray(previousRows) ? previousRows : []).map((row) => [String(row?.tokenMint || ""), row]));
  return (Array.isArray(nextRows) ? nextRows : []).map((row) => {
    const previous = previousByMint.get(String(row?.tokenMint || ""));
    if (!previous || options.fast === false) return row;
    const rowPending = Boolean(row?.valuePending || /refreshing|updating|background/i.test(row?.valueError || ""));
    const previousHasValue = previous.estimatedValueSol !== null && previous.estimatedValueSol !== undefined && previous.estimatedValueSol !== "";
    if (!rowPending || !previousHasValue) return row;
    return {
      ...row,
      estimatedValueSol: previous.estimatedValueSol,
      openPnlSol: previous.openPnlSol,
      openPnlPercent: previous.openPnlPercent,
      valuePending: false,
      valueError: ""
    };
  });
}

function refreshPortfolioSupplemental(reason = "portfolio-supplemental") {
  if (!state.user || !state.token) return;
  const startedAt = perfNow();
  Promise.allSettled([
    api("/api/web/balances?force=true", { timeoutMs: POSITIONS_REFRESH_TIMEOUT_MS }),
    api("/api/web/pnl?force=true", { timeoutMs: POSITIONS_REFRESH_TIMEOUT_MS })
  ]).then(([balancesResult, pnlResult]) => {
    if (balancesResult.status === "fulfilled") {
      state.balances = balancesResult.value.balances || state.balances || [];
      state.connectedWalletBalance = balancesResult.value.connectedWallet || state.connectedWalletBalance || null;
    }
    if (pnlResult.status === "fulfilled") {
      state.pnl = pnlResult.value.pnl || state.pnl || null;
    }
    state.lastWalletRefreshAt = new Date().toISOString();
    perfMeasure("portfolio-supplemental-refresh", startedAt, {
      component: "wallet",
      resultCount: (state.balances?.length || 0) + (state.positions?.length || 0),
      details: reason
    });
    render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
  }).catch(() => {});
}

async function refreshWalletPositions(options = {}) {
  if (!state.user || !state.token) return;
  const startedAt = perfNow();
  const params = new URLSearchParams();
  if (options.force) params.set("force", "true");
  if (options.fast !== false) params.set("fast", "true");
  const query = params.toString() ? `?${params.toString()}` : "";
  const requestKey = query || "full";
  if (positionsRefreshPromise && positionsRefreshPromiseKey === requestKey) return positionsRefreshPromise;
  const requestId = ++positionsRefreshSequence;
  positionsRefreshPromiseKey = requestKey;
  positionsRefreshPromise = (async () => {
    try {
      const positions = await api(`/api/web/positions${query}`, {
        timeoutMs: options.timeoutMs || (options.fast === false ? POSITIONS_REFRESH_TIMEOUT_MS : POSITIONS_FAST_REFRESH_TIMEOUT_MS)
      });
      state.positions = mergePositionRefreshRows(positions.positions || state.positions || [], state.positions || [], options);
      state.lastWalletRefreshAt = new Date().toISOString();
      state.walletRefreshError = "";
      perfMeasure("positions-refresh", startedAt, {
        component: "positions",
        resultCount: state.positions.length,
        cacheHit: Boolean(positions.cacheHit),
        details: `${options.reason || (options.silent ? "silent" : "refresh")};fast=${options.fast !== false}`
      });
      if (options.followUpValues && options.fast !== false && positionRowsNeedValueRefresh(state.positions)) {
        schedulePositionsValueRefresh(350, `${options.reason || "positions"}-values`);
      }
      return true;
    } catch (error) {
      if (!options.silent) {
        state.walletRefreshError = error.message || "Position refresh failed.";
      }
      perfMeasure("positions-refresh", startedAt, {
        errorCode: error?.code || error?.name || "POSITIONS_REFRESH_FAILED",
        component: "positions",
        details: publicErrorMessage(error?.message || "Position refresh failed.")
      });
      return false;
    } finally {
      if (positionsRefreshSequence === requestId) {
        positionsRefreshPromise = null;
        positionsRefreshPromiseKey = "";
      }
    }
  })();
  return positionsRefreshPromise;
}

async function refreshPositionsOnly(options = {}) {
  if (!state.user || !state.token) {
    setError("Connect your wallet before refreshing positions.");
    finishPositionRefreshAction("error", { error: "Wallet not connected" });
    return;
  }
  const startedAt = perfNow();
  setPositionRefreshAction("refreshing", {
    startedAt: state.positionRefreshAction?.startedAt || startedAt
  });
  state.walletRefreshError = "";
  setText("[data-sync-health]", syncHealthLabel());
  applyActionButtonStates();
  await sleep(20);
  try {
    const refreshed = await refreshWalletPositions({
      force: Boolean(options.force),
      fast: true,
      silent: false,
      followUpValues: true,
      reason: options.reason || "positions-only",
      timeoutMs: POSITIONS_FAST_REFRESH_TIMEOUT_MS
    });
    if (!refreshed) throw new Error(state.walletRefreshError || "Position refresh failed.");
    state.lastWalletRefreshAt = new Date().toISOString();
    finishPositionRefreshAction("success", { error: "" });
    refreshPortfolioSupplemental(`${options.reason || "positions-only"}-balances-pnl`);
    if (positionRowsNeedValueRefresh(state.positions)) {
      schedulePositionsValueRefresh(250, `${options.reason || "positions-only"}-full-values`);
    }
    perfMeasure("positions-only-refresh", startedAt, {
      component: "positions",
      resultCount: state.positions.length,
      details: options.reason || "positions-only"
    });
  } catch (error) {
    const message = error?.message || "Position refresh failed.";
    state.walletRefreshError = message;
    finishPositionRefreshAction("error", { error: publicErrorMessage(message) });
    setError(message);
    perfMeasure("positions-only-refresh", startedAt, {
      errorCode: error?.code || error?.name || "POSITIONS_REFRESH_FAILED",
      component: "positions",
      details: publicErrorMessage(message)
    });
  } finally {
    render();
  }
}

function selectedTerminalFeedToken() {
  return String(state.smartChartToken || state.tradeToken || state.bundleToken || state.volumeToken || state.terminalToken || "").trim();
}

function terminalFeedDefinition(tabKey = state.activeTab) {
  return TERMINAL_FEED_MAP[tabKey] || null;
}

function terminalFeedCacheKey(feed = terminalFeedDefinition()) {
  const template = String(feed?.cacheKey || feed?.tabKey || "terminal:unknown");
  return template
    .replace("{bucket}", normalizeLivePairBucket(state.livePairBucket))
    .replace("{sort}", String(state.terminalSort || "best"))
    .replace("{scopeMode}", String(state.slimeScopeMode || "new"))
    .replace("{kolMode}", String(state.kolMode || "hot"))
    .replace("{kolWallet}", state.kolWallet ? shortAddress(state.kolWallet) : "global")
    .replace("{scanMode}", String(state.scanMode || "safe"))
    .replace("{tokenMint}", selectedTerminalFeedToken() ? shortAddress(selectedTerminalFeedToken()) : "none");
}

function terminalFeedNumber(tabKey = state.activeTab, field = "pageSize", fallback = 25) {
  const feed = terminalFeedDefinition(tabKey);
  const number = Number(feed?.[field]);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function terminalFeedPageSize(tabKey = state.activeTab) {
  return terminalFeedNumber(tabKey, "pageSize", 25);
}

function terminalFeedMaxPageSize(tabKey = state.activeTab) {
  return Math.max(terminalFeedPageSize(tabKey), terminalFeedNumber(tabKey, "maxPageSize", terminalFeedPageSize(tabKey)));
}

function terminalFeedSupportsPagination(tabKey = state.activeTab) {
  return Boolean(terminalFeedDefinition(tabKey)?.supportsPagination);
}

function terminalFeedVisibleLimitKey(tabKey = state.activeTab) {
  const feed = terminalFeedDefinition(tabKey) || { tabKey };
  return `${tabKey}:${terminalFeedCacheKey(feed)}`;
}

function terminalFeedVisibleLimit(tabKey = state.activeTab, total = 0) {
  const key = terminalFeedVisibleLimitKey(tabKey);
  const pageSize = terminalFeedPageSize(tabKey);
  const maxPageSize = terminalFeedMaxPageSize(tabKey);
  const saved = Number(state.terminalFeedVisibleLimits?.[key] || 0);
  const desired = Number.isFinite(saved) && saved > 0 ? saved : pageSize;
  const totalNumber = Number(total || 0);
  const bounded = Math.min(Math.max(pageSize, desired), maxPageSize);
  return totalNumber > 0 ? Math.min(bounded, totalNumber) : bounded;
}

function resetTerminalFeedVisibleLimit(tabKey = state.activeTab) {
  const key = terminalFeedVisibleLimitKey(tabKey);
  if (!state.terminalFeedVisibleLimits?.[key]) return;
  const next = { ...(state.terminalFeedVisibleLimits || {}) };
  delete next[key];
  state.terminalFeedVisibleLimits = next;
}

function increaseTerminalFeedVisibleLimit(tabKey = state.activeTab, total = 0) {
  const key = terminalFeedVisibleLimitKey(tabKey);
  const current = terminalFeedVisibleLimit(tabKey, total);
  const pageSize = terminalFeedPageSize(tabKey);
  const maxPageSize = terminalFeedMaxPageSize(tabKey);
  const totalNumber = Number(total || 0);
  const nextLimit = Math.min(maxPageSize, totalNumber > 0 ? totalNumber : maxPageSize, current + pageSize);
  state.terminalFeedVisibleLimits = {
    ...(state.terminalFeedVisibleLimits || {}),
    [key]: nextLimit
  };
  return nextLimit;
}

function terminalFeedRowsWindow(tabKey = state.activeTab, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  return list.slice(0, terminalFeedVisibleLimit(tabKey, list.length));
}

function terminalFeedHasMoreRows(tabKey = state.activeTab, rows = []) {
  const list = Array.isArray(rows) ? rows : [];
  return terminalFeedSupportsPagination(tabKey) && list.length > terminalFeedVisibleLimit(tabKey, list.length);
}

function terminalFeedLoadMoreHtml(tabKey = state.activeTab, rows = [], label = "rows") {
  const list = Array.isArray(rows) ? rows : [];
  if (!terminalFeedHasMoreRows(tabKey, list)) return "";
  const shown = terminalFeedVisibleLimit(tabKey, list.length);
  return `
    <div class="feed-load-more-row">
      <small>${escapeHtml(shown)} of ${escapeHtml(list.length)} ${escapeHtml(label)} shown</small>
      <button type="button" data-terminal-load-more="${escapeHtml(tabKey)}">Load More</button>
    </div>
  `;
}

function terminalFeedRuntime(tabKey = state.activeTab) {
  return state.terminalFeeds[tabKey] || {};
}

function terminalFeedLastUpdatedAt(tabKey = state.activeTab) {
  if (tabKey === "live" || tabKey === "terminal") return currentLivePairsUpdatedAt();
  if (tabKey === "slimeScope") return currentLivePairsUpdatedAt();
  if (tabKey === "kol") return state.kolLastUpdatedAt || "";
  if (tabKey === "watchlist") return terminalFeedRuntime("watchlist").lastFetchAt || "";
  if (["wallets", "positions", "trade", "bundle", "volume", "smartChart"].includes(tabKey)) return state.lastWalletRefreshAt || terminalFeedRuntime(tabKey).lastFetchAt || "";
  if (tabKey === "liveTrades" || tabKey === "pnl") return terminalFeedRuntime(tabKey).lastFetchAt || "";
  if (tabKey === "launch" || tabKey === "launchCoin") return terminalFeedRuntime(tabKey).lastFetchAt || "";
  if (tabKey === "sniper") return terminalFeedRuntime(tabKey).lastFetchAt || "";
  if (tabKey === "ogreTek") return terminalFeedRuntime(tabKey).lastFetchAt || "";
  return terminalFeedRuntime(tabKey).lastFetchAt || "";
}

function terminalFeedResultCount(tabKey = state.activeTab) {
  if (tabKey === "terminal") return Number(currentLivePairs()?.rows?.length || 0) + Number(state.kolScan?.rows?.length || 0);
  if (tabKey === "live") return Number(currentLivePairs()?.rows?.length || 0);
  if (tabKey === "liveTrades") return Number(state.pnl?.trades?.length || 0);
  if (tabKey === "slimeScope") return Number(slimeScopeRows?.(state.slimeScopeMode)?.length || 0);
  if (tabKey === "kol") return Number(state.kolScan?.rows?.length || 0);
  if (tabKey === "watchlist") return Number(state.watchlist?.rows?.length || 0);
  if (tabKey === "smartChart") return selectedTerminalFeedToken() ? 1 : Number(terminalBestPickRows?.()?.length || 0);
  if (tabKey === "trade") return selectedTerminalFeedToken() ? 1 : 0;
  if (tabKey === "bundle" || tabKey === "volume") return selectedTerminalFeedToken() ? 1 : 0;
  if (tabKey === "sniper") return Number(state.scan?.rows?.length || 0);
  if (tabKey === "launch" || tabKey === "launchCoin") return Number(state.launchWatches?.length || 0);
  if (tabKey === "wallets") return Number(state.wallets?.length || 0) + Number(state.balances?.length || 0);
  if (tabKey === "positions") return Number(state.positions?.length || 0);
  if (tabKey === "pnl") return Number(state.pnl?.trades?.length || 0);
  if (tabKey === "ogreAi") return state.ogreAiResult ? 1 : 0;
  if (tabKey === "ogreTek") return Number(state.ogreTek?.markets?.length || 0) + Number(state.ogreTek?.positions?.length || 0);
  return 0;
}

function terminalFeedRenderedCount(tabKey = state.activeTab) {
  const resultCount = terminalFeedResultCount(tabKey);
  if (["live", "liveTrades", "slimeScope", "kol", "watchlist", "sniper"].includes(tabKey)) {
    return Math.min(resultCount, terminalFeedVisibleLimit(tabKey, resultCount));
  }
  return resultCount;
}

function terminalFeedIsStale(tabKey = state.activeTab) {
  const feed = terminalFeedDefinition(tabKey);
  if (!feed) return false;
  const lastUpdated = Date.parse(terminalFeedLastUpdatedAt(tabKey) || "");
  if (!Number.isFinite(lastUpdated)) return true;
  return Date.now() - lastUpdated > Number(feed.staleMs || 30_000);
}

function terminalFeedHasData(tabKey = state.activeTab) {
  return terminalFeedResultCount(tabKey) > 0 || Boolean(terminalFeedLastUpdatedAt(tabKey));
}

function terminalFeedEventPayload(tabKey = state.activeTab, event = {}) {
  const feed = terminalFeedDefinition(tabKey) || {};
  return {
    tabKey,
    label: feed.label || tabKey,
    category: feed.category || "unknown",
    endpoint: feed.endpoint || "",
    cacheKey: terminalFeedCacheKey(feed),
    requestId: event.requestId || "",
    status: event.status || "unknown",
    reason: event.reason || "",
    resultCount: Number(event.resultCount || 0),
    renderedCount: Number(event.renderedCount ?? terminalFeedRenderedCount(tabKey) ?? 0),
    pageSize: terminalFeedPageSize(tabKey),
    maxPageSize: terminalFeedMaxPageSize(tabKey),
    supportsPagination: terminalFeedSupportsPagination(tabKey),
    hasMore: Boolean(event.hasMore ?? (terminalFeedResultCount(tabKey) > terminalFeedRenderedCount(tabKey))),
    nextCursor: String(event.nextCursor || "").slice(0, 80),
    stale: Boolean(event.stale),
    errorCode: String(event.errorCode || "").slice(0, 80),
    errorMessage: String(event.errorMessage || "").slice(0, 160),
    at: new Date().toISOString()
  };
}

function recordTerminalFeedEvent(tabKey = state.activeTab, event = {}) {
  const payload = terminalFeedEventPayload(tabKey, event);
  state.terminalFeedLog = [...(state.terminalFeedLog || []), payload].slice(-20);
  scheduleDiagnosticLogPersist(TERMINAL_FEED_LOG_KEY, () => state.terminalFeedLog, "feed");
  const important = payload.status === "error"
    || payload.status === "timeout"
    || /manual|post-trade|visibility|resume/i.test(payload.reason || "")
    || Boolean(payload.stale && payload.resultCount === 0);
  if (important) {
    try {
      void api("/api/web/terminal-feed-event", {
        method: "POST",
        timeoutMs: 2500,
        body: JSON.stringify(payload)
      }).catch(() => {});
    } catch {
      // Server-side debug history is best-effort.
    }
  }
  return payload;
}

function markTerminalFeedStart(tabKey = state.activeTab, options = {}) {
  const feed = terminalFeedDefinition(tabKey);
  if (!feed) return "";
  const requestId = globalThis.crypto?.randomUUID?.() || `feed-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  state.terminalFeeds = {
    ...state.terminalFeeds,
    [tabKey]: {
      ...terminalFeedRuntime(tabKey),
      label: feed.label,
      category: feed.category,
      endpoint: feed.endpoint,
      cacheKey: terminalFeedCacheKey(feed),
      refreshMs: feed.refreshMs,
      staleMs: feed.staleMs,
      pageSize: feed.pageSize,
      maxPageSize: feed.maxPageSize,
      supportsPagination: Boolean(feed.supportsPagination),
      inFlight: true,
      lastRequestId: requestId,
      lastReason: options.reason || "refresh",
      lastStartedAt: new Date().toISOString()
    }
  };
  return requestId;
}

function markTerminalFeedDone(tabKey = state.activeTab, requestId = "", status = "success", extra = {}) {
  const feed = terminalFeedDefinition(tabKey);
  if (!feed) return;
  const resultCount = terminalFeedResultCount(tabKey);
  const renderedCount = terminalFeedRenderedCount(tabKey);
  const nextRuntime = {
    ...terminalFeedRuntime(tabKey),
    label: feed.label,
    category: feed.category,
    endpoint: feed.endpoint,
    cacheKey: terminalFeedCacheKey(feed),
    refreshMs: feed.refreshMs,
    staleMs: feed.staleMs,
    pageSize: feed.pageSize,
    maxPageSize: feed.maxPageSize,
    supportsPagination: Boolean(feed.supportsPagination),
    inFlight: false,
    lastRequestId: requestId,
    lastStatus: status,
    lastFetchAt: new Date().toISOString(),
    resultCount,
    renderedCount,
    hasMore: resultCount > renderedCount,
    stale: status !== "success" || terminalFeedIsStale(tabKey),
    errorCode: extra.errorCode || "",
    errorMessage: extra.errorMessage || ""
  };
  state.terminalFeeds = {
    ...state.terminalFeeds,
    [tabKey]: nextRuntime
  };
  recordTerminalFeedEvent(tabKey, {
    requestId,
    status,
    reason: nextRuntime.lastReason,
    resultCount,
    renderedCount,
    hasMore: nextRuntime.hasMore,
    stale: nextRuntime.stale,
    errorCode: nextRuntime.errorCode,
    errorMessage: nextRuntime.errorMessage
  });
}

function tabNeedsAccountFeed(tabKey = state.activeTab) {
  return ["watchlist", "wallets", "positions", "pnl", "liveTrades", "trade", "bundle", "volume", "smartChart", "launch", "launchCoin"].includes(tabKey);
}

async function refreshTerminalFeed(tabKey = state.activeTab, options = {}) {
  const startedAt = perfNow();
  const feed = terminalFeedDefinition(tabKey);
  if (!feed) return null;
  if (options.ifStale && terminalFeedHasData(tabKey) && !terminalFeedIsStale(tabKey)) return terminalFeedRuntime(tabKey);
  if (terminalFeedRuntime(tabKey).inFlight && !options.force) return terminalFeedRuntime(tabKey);
  if (tabNeedsAccountFeed(tabKey) && !state.user && !["smartChart", "trade", "bundle", "volume"].includes(tabKey)) {
    markTerminalFeedDone(tabKey, "", "skipped", { errorCode: "ACCOUNT_REQUIRED", errorMessage: "Account or wallet required." });
    return terminalFeedRuntime(tabKey);
  }

  const requestId = markTerminalFeedStart(tabKey, options);
  try {
    if (tabKey === "terminal") {
      const tasks = [
        refreshLivePairBuckets({ silent: true, force: Boolean(options.force) })
      ];
      if (!state.kolWallet) tasks.push(loadKolScan(state.kolMode, "", { silent: true }));
      await Promise.allSettled(tasks);
    } else if (tabKey === "live") {
      await loadLivePairs({ silent: options.silent !== false, bucket: state.livePairBucket, force: Boolean(options.force) });
    } else if (tabKey === "liveTrades") {
      if (state.user && state.token) await loadAll({ silent: true, skipCore: true, force: Boolean(options.force) });
    } else if (tabKey === "slimeScope") {
      const scopeMode = String(state.slimeScopeMode || "new");
      const scopeBucket = slimeScopeLivePairBucketForMode(scopeMode);
      await loadLivePairs({ silent: true, bucket: scopeBucket, renderOnComplete: false, force: Boolean(options.force) });
      if (!state.scan || scopeMode === "graduating" || scopeMode === "graduated") {
        await loadScan(state.scanMode, { silent: true, force: Boolean(options.force) }).catch(() => {});
      }
      if (!state.kolScan && (scopeMode === "steady" || scopeMode === "graduating")) {
        await loadKolScan(state.kolMode, state.kolWallet, { silent: true }).catch(() => {});
      }
    } else if (tabKey === "kol") {
      await loadKolScan(state.kolMode, state.kolWallet, { silent: options.silent !== false });
    } else if (tabKey === "watchlist") {
      await loadWatchlist({ silent: options.silent !== false });
    } else if (tabKey === "sniper") {
      await loadScan(state.scanMode, { silent: options.silent !== false });
    } else if (tabKey === "positions") {
      if (state.user && state.token) {
        await refreshWalletPositions({
          force: Boolean(options.force),
          fast: true,
          silent: true,
          reason: options.reason || "positions-feed-refresh",
          timeoutMs: POSITIONS_FAST_REFRESH_TIMEOUT_MS
        });
      }
    } else if (["wallets", "pnl"].includes(tabKey)) {
      if (state.user && state.token) await refreshWalletState({ force: Boolean(options.force), deep: false });
    } else if (tabKey === "smartChart") {
      if (state.user && state.token) await refreshWalletState({ force: Boolean(options.force), deep: false });
    } else if (["trade", "bundle", "volume"].includes(tabKey)) {
      const tasks = [refreshLivePairBuckets({ silent: true, force: Boolean(options.force) })];
      if (state.user && state.token) tasks.push(loadAll({ silent: true, skipCore: true, force: Boolean(options.force) }));
      await Promise.allSettled(tasks);
    } else if (tabKey === "launch" || tabKey === "launchCoin") {
      if (state.user && state.token) await loadAll({ silent: true, skipCore: true, force: Boolean(options.force) });
    } else if (tabKey === "ogreTek") {
      await loadOgreTekData({ silent: true }).catch((error) => {
        state.ogreTek.error = error.message;
      });
    }
    markTerminalFeedDone(tabKey, requestId, "success");
    return terminalFeedRuntime(tabKey);
  } catch (error) {
    markTerminalFeedDone(tabKey, requestId, "error", {
      errorCode: error?.code || error?.name || "REFRESH_FAILED",
      errorMessage: publicErrorMessage(error?.message || "Feed refresh failed.")
    });
    if (options.throwOnError) throw error;
    return terminalFeedRuntime(tabKey);
  } finally {
    perfMeasure("feed-refresh", startedAt, {
      component: feed.component || tabKey,
      resultCount: terminalFeedResultCount(tabKey),
      cacheHit: Boolean(terminalFeedRuntime(tabKey).cacheHit),
      stale: terminalFeedIsStale(tabKey),
      requestId: terminalFeedRuntime(tabKey).lastRequestId || "",
      errorCode: terminalFeedRuntime(tabKey).errorCode || "",
      details: `${tabKey}:${terminalFeedCacheKey(feed)}`
    });
    if (options.render !== false) {
      render({
        force: true,
        preserveSmartChartFrame: state.activeTab === "smartChart" && tabKey === "smartChart"
      });
    }
  }
}

async function refreshVisibleTerminalFeeds(options = {}) {
  const active = state.activeTab || "terminal";
  const tasks = [refreshTerminalFeed(active, { ...options, reason: options.reason || "visible-refresh" })];
  const results = await Promise.allSettled(tasks);
  return results;
}

function refreshTerminalEntryInBackground(reason = "terminal-entry") {
  if (state.route !== "terminal") return;
  void refreshVisibleTerminalFeeds({ silent: true, ifStale: true, reason }).catch((error) => setError(error.message));
  if (state.user && state.token) {
    void refreshWalletState({ force: true, deep: false, reason }).catch((error) => {
      state.walletRefreshError = error.message || "Wallet refresh failed.";
      render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
    });
  }
}

function scheduleActiveTerminalFeedRefresh() {
  const clearActiveTimer = () => {
    if (terminalFeedTimer) clearTimeout(terminalFeedTimer);
    terminalFeedTimer = null;
    terminalFeedTimerKey = "";
  };
  if (state.route !== "terminal" || document.hidden) {
    clearActiveTimer();
    return;
  }
  const feed = terminalFeedDefinition(state.activeTab);
  if (!feed || ["terminal", "live", "slimeScope", "kol", "watchlist", "sniper"].includes(state.activeTab)) {
    clearActiveTimer();
    return;
  }
  const delayMs = Math.max(5_000, Number(feed.refreshMs || 30_000));
  const nextKey = `${state.activeTab}:${terminalFeedCacheKey(feed)}:${delayMs}`;
  if (terminalFeedTimer && terminalFeedTimerKey === nextKey) return;
  clearActiveTimer();
  terminalFeedTimerKey = nextKey;
  terminalFeedTimer = setTimeout(async () => {
    terminalFeedTimer = null;
    terminalFeedTimerKey = "";
    if (state.route !== "terminal" || document.hidden) return;
    await refreshTerminalFeed(state.activeTab, {
      silent: true,
      force: true,
      ifStale: true,
      reason: "active-tab-auto"
    }).catch((error) => setError(error.message));
    scheduleActiveTerminalFeedRefresh();
  }, delayMs);
}

function normalizeLivePairBucket(bucket) {
  const value = String(bucket || "live");
  return LIVE_PAIR_BUCKETS.some(([id]) => id === value) ? value : "live";
}

function slimeScopeLivePairBucketForMode(mode = state.slimeScopeMode) {
  const value = String(mode || "new");
  if (value === "steady") return "under1h";
  if (value === "graduating") return "under3h";
  if (value === "graduated") return "under1d";
  return "live";
}

function currentLivePairs() {
  return state.livePairsByBucket[state.livePairBucket] || state.livePairs || null;
}

function currentLivePairsUpdatedAt() {
  return state.livePairsLastUpdatedByBucket[state.livePairBucket] || state.livePairsLastUpdatedAt || "";
}

async function loadLivePairs({ silent = false, bucket = state.livePairBucket, renderOnComplete = true, force = false } = {}) {
  const startedAt = perfNow();
  const safeBucket = normalizeLivePairBucket(bucket);
  const isActiveBucket = safeBucket === state.livePairBucket;
  const requestSort = state.terminalSort || "best";
  const requestKey = `${safeBucket}:${requestSort}:${force ? "force" : "poll"}`;
  const existingLoad = livePairsLoadInFlight.get(requestKey);
  if (existingLoad?.promise) {
    state.livePairsLoadingByBucket = { ...state.livePairsLoadingByBucket, [safeBucket]: existingLoad.requestId };
    state.livePairsLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
    if (!silent && isActiveBucket) state.loading = true;
    if (isActiveBucket || !silent) {
      scheduleLivePairsRender(LIVE_PAIRS_INFLIGHT_RENDER_REASON);
    }
    return existingLoad.promise;
  }

  const requestId = `${Date.now()}:${Math.random().toString(16).slice(2)}`;
  const requestVersion = (livePairsLoadVersionsByBucket[safeBucket] || 0) + 1;
  livePairsLoadVersionsByBucket[safeBucket] = requestVersion;
  const isCurrentRequest = () => livePairsLoadVersionsByBucket[safeBucket] === requestVersion;

  state.livePairsLoadingByBucket = { ...state.livePairsLoadingByBucket, [safeBucket]: requestId };
  state.livePairsLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
  if (!silent && isActiveBucket) state.loading = true;
  if (isActiveBucket || !silent) {
    scheduleLivePairsRender(LIVE_PAIRS_INFLIGHT_RENDER_REASON);
  }

  const loadPromise = (async () => {
    try {
      const forceQuery = force ? "&force=true" : "";
      const livePairsUrl = `/api/web/live-pairs?bucket=${encodeURIComponent(safeBucket)}&sort=${encodeURIComponent(requestSort)}${forceQuery}`;
      const data = await Promise.race([
        api(livePairsUrl),
        new Promise((_, reject) => window.setTimeout(() => reject(new Error("Live feed refresh timed out.")), 12_000))
      ]);
      const label = LIVE_PAIR_BUCKETS.find(([id]) => id === safeBucket)?.[1] || "Live";
      const previous = state.livePairsByBucket[safeBucket] || (isActiveBucket ? state.livePairs : null);
      let value = data.livePairs || {
        bucket: safeBucket,
        rows: [],
        refreshedAt: new Date().toISOString(),
        refreshSeconds: 5,
        message: `${label} feed returned no rows yet. Retrying automatically.`
      };
      const valueRows = Array.isArray(value?.rows) ? value.rows : [];
      const previousRows = Array.isArray(previous?.rows) ? previous.rows : [];
      if (valueRows.length === 0 && previousRows.length > 0) {
        value = {
          ...previous,
          ...value,
          rows: previous.rows,
          stale: true,
          emptyRefresh: true,
          message: `${label} is scanning for fresh rows. Showing the last good feed until the next qualifying refresh.`
        };
      }
      if (!isCurrentRequest()) return value;
      const updatedAt = value?.refreshedAt || new Date().toISOString();
      const nextErrors = { ...(state.livePairsRefreshErrorByBucket || {}) };
      delete nextErrors[safeBucket];
      state.livePairsRefreshErrorByBucket = nextErrors;
      state.livePairsByBucket = { ...state.livePairsByBucket, [safeBucket]: value };
      state.livePairsLastUpdatedByBucket = { ...state.livePairsLastUpdatedByBucket, [safeBucket]: updatedAt };
      if (isActiveBucket) {
        state.livePairs = value;
        state.livePairsLastUpdatedAt = updatedAt;
      }
      return value;
    } catch (error) {
      const message = publicErrorMessage(error?.message || "Live feed refresh failed.");
      const label = LIVE_PAIR_BUCKETS.find(([id]) => id === safeBucket)?.[1] || "Live";
      const previous = state.livePairsByBucket[safeBucket] || (isActiveBucket ? state.livePairs : null);
      const staleValue = previous
        ? {
            ...previous,
            stale: true,
            refreshError: message,
            message: `Showing last good ${label} feed. Refresh failed, retrying automatically.`
          }
        : {
            bucket: safeBucket,
            rows: [],
            refreshedAt: new Date().toISOString(),
            refreshSeconds: 5,
            stale: true,
            refreshError: message,
            message: `${label} refresh failed. Retrying automatically.`
          };
      if (!isCurrentRequest()) return staleValue;
      state.livePairsRefreshErrorByBucket = { ...(state.livePairsRefreshErrorByBucket || {}), [safeBucket]: message };
      state.livePairsByBucket = { ...state.livePairsByBucket, [safeBucket]: staleValue };
      state.livePairsLastUpdatedByBucket = { ...state.livePairsLastUpdatedByBucket, [safeBucket]: staleValue.refreshedAt };
      if (isActiveBucket) {
        state.livePairs = staleValue;
        state.livePairsLastUpdatedAt = staleValue.refreshedAt;
      }
      return staleValue;
    } finally {
      if (!isCurrentRequest()) return;
      const latestRows = state.livePairsByBucket?.[safeBucket]?.rows || [];
      perfMeasure("live-pairs-refresh", startedAt, {
        component: "livePairs",
        resultCount: Array.isArray(latestRows) ? latestRows.length : 0,
        stale: Boolean(state.livePairsByBucket?.[safeBucket]?.stale),
        errorCode: state.livePairsRefreshErrorByBucket?.[safeBucket] ? "LIVE_PAIRS_REFRESH_FAILED" : "",
        details: `${safeBucket}:${requestSort}`
      });
      const nextLoading = { ...state.livePairsLoadingByBucket };
      if (nextLoading[safeBucket] === requestId || nextLoading[safeBucket] === true) {
        delete nextLoading[safeBucket];
        state.livePairsLoadingByBucket = nextLoading;
      }
      state.livePairsLoading = Boolean(nextLoading[state.livePairBucket]);
      if (!silent && isActiveBucket) state.loading = false;
      if (renderOnComplete) {
        if (isActiveBucket && ["terminal", "live", "slimeScope"].includes(state.activeTab)) {
          scheduleLivePairsRender("load-live-pairs-complete");
        } else {
          render();
        }
      }
    }
  })();

  livePairsLoadInFlight.set(requestKey, {
    requestId,
    requestVersion,
    safeBucket,
    promise: loadPromise
  });
  loadPromise.finally(() => {
    const current = livePairsLoadInFlight.get(requestKey);
    if (current?.requestId === requestId) {
      livePairsLoadInFlight.delete(requestKey);
    }
  });
  return loadPromise;
}

async function refreshLivePairBuckets({ silent = false, force = false, warmAll = false } = {}) {
  await loadLivePairs({ silent, bucket: state.livePairBucket, force });
  if (warmAll) {
    const otherBuckets = LIVE_PAIR_BUCKETS
      .map(([bucket]) => bucket)
      .filter((bucket) => bucket !== state.livePairBucket);
    await Promise.allSettled(otherBuckets.map((bucket) => (
      loadLivePairs({ silent: true, bucket, renderOnComplete: false, force })
    )));
  }
  if (state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "slimeScope") {
    scheduleLivePairsRender(warmAll ? "live-pair-buckets-warm-all" : "live-pair-active-bucket");
  }
}

function scheduleLivePairsAutoRefresh() {
  const clearLiveTimer = () => {
    if (livePairsTimer) clearTimeout(livePairsTimer);
    livePairsTimer = null;
    livePairsTimerKey = "";
  };
  if (isPostTradeRefreshActive() || document.hidden || (state.activeTab !== "live" && state.activeTab !== "terminal" && state.activeTab !== "slimeScope")) {
    clearLiveTimer();
    return;
  }
  const refreshSeconds = Number(currentLivePairs()?.refreshSeconds || 30);
  const minRefreshSeconds = state.activeTab === "slimeScope" ? 12 : 8;
  const delayMs = Math.max(minRefreshSeconds, refreshSeconds) * 1000;
  const nextKey = `${state.activeTab}:${state.livePairBucket}:${state.terminalSort}:${delayMs}`;
  if (livePairsTimer && livePairsTimerKey === nextKey) return;
  clearLiveTimer();
  livePairsTimerKey = nextKey;
  livePairsTimer = setTimeout(async () => {
    livePairsTimer = null;
    livePairsTimerKey = "";
    if (document.hidden) {
      scheduleLivePairsAutoRefresh();
      return;
    }
    const onLiveFeed = state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "slimeScope";
    if (!onLiveFeed) return;
    if (state.livePairsLoading) {
      scheduleLivePairsAutoRefresh();
      return;
    }
    try {
      await loadLivePairs({ silent: true, bucket: state.livePairBucket, force: false });
    } catch {
      // Keep the last good feed visible; the next timer retry reports status inline.
    } finally {
      scheduleLivePairsAutoRefresh();
    }
  }, delayMs);
}

function ensureLivePairsWarmup({ force = false } = {}) {
  if (isPostTradeRefreshActive()) return;
  const onLiveFeed = state.activeTab === "live" || state.activeTab === "terminal" || state.activeTab === "slimeScope";
  if (!onLiveFeed) return;
  const bucket = normalizeLivePairBucket(state.livePairBucket);
  const key = `${bucket}:${state.terminalSort || "best"}`;
  if (livePairsWarmupKeys.has(key) || state.livePairsLoadingByBucket[bucket]) return;
  if (!force && state.livePairsByBucket[bucket]) return;

  livePairsWarmupKeys.add(key);
  window.setTimeout(() => {
    void refreshLivePairBuckets({ silent: true, force: true, warmAll: false })
      .catch((error) => setError(error.message))
      .finally(() => {
        livePairsWarmupKeys.delete(key);
        scheduleLivePairsAutoRefresh();
      });
  }, 0);
}

function scheduleScannerAutoRefresh() {
  const clearScanTimer = () => {
    if (scanTimer) clearTimeout(scanTimer);
    scanTimer = null;
    scanTimerKey = "";
  };
  if (document.hidden || state.activeTab !== "sniper") {
    clearScanTimer();
    return;
  }
  const nextKey = `${state.activeTab}:${state.scanMode}`;
  if (scanTimer && scanTimerKey === nextKey) return;
  clearScanTimer();
  scanTimerKey = nextKey;
  scanTimer = setTimeout(async () => {
    scanTimer = null;
    scanTimerKey = "";
    if (document.hidden) {
      scheduleScannerAutoRefresh();
      return;
    }
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
  const clearKolTimer = () => {
    if (kolTimer) clearTimeout(kolTimer);
    kolTimer = null;
    kolTimerKey = "";
  };
  if (isPostTradeRefreshActive() || document.hidden || (state.activeTab !== "kol" && state.activeTab !== "terminal") || state.kolWallet) {
    clearKolTimer();
    return;
  }
  const nextKey = `${state.activeTab}:${state.kolMode}`;
  if (kolTimer && kolTimerKey === nextKey) return;
  clearKolTimer();
  kolTimerKey = nextKey;
  kolTimer = setTimeout(async () => {
    kolTimer = null;
    kolTimerKey = "";
    if (document.hidden) {
      scheduleKolAutoRefresh();
      return;
    }
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
  const clearWatchlistTimer = () => {
    if (watchlistTimer) clearTimeout(watchlistTimer);
    watchlistTimer = null;
    watchlistTimerKey = "";
  };
  if (isPostTradeRefreshActive() || document.hidden || (state.activeTab !== "watchlist" && state.activeTab !== "terminal") || !state.user || !state.token) {
    clearWatchlistTimer();
    return;
  }
  const nextKey = `${state.activeTab}:${state.user?.id || "guest"}`;
  if (watchlistTimer && watchlistTimerKey === nextKey) return;
  clearWatchlistTimer();
  watchlistTimerKey = nextKey;
  watchlistTimer = setTimeout(async () => {
    watchlistTimer = null;
    watchlistTimerKey = "";
    if (document.hidden) {
      scheduleWatchlistAutoRefresh();
      return;
    }
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
  const startedAt = perfNow();
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
    perfMeasure("scanner-refresh", startedAt, {
      component: "sniper",
      resultCount: Array.isArray(state.scan?.candidates) ? state.scan.candidates.length : 0,
      details: mode
    });
    if (!silent) state.loading = false;
    render();
  }
}

async function loadKolScan(mode = state.kolMode, wallet = state.kolWallet, options = {}) {
  const startedAt = perfNow();
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
    perfMeasure("kol-refresh", startedAt, {
      component: "kol",
      resultCount: Array.isArray(state.kolScan?.rows) ? state.kolScan.rows.length : Array.isArray(state.kolScan?.signals) ? state.kolScan.signals.length : 0,
      errorCode: state.kolStatus && /failed/i.test(state.kolStatus) ? "KOL_REFRESH_FAILED" : "",
      details: state.kolWallet ? "wallet" : mode
    });
    if (!silent) state.loading = false;
    state.kolLoading = false;
    render();
  }
}

async function loadWatchlist(options = {}) {
  if (!state.user || !state.token) return;
  const startedAt = perfNow();
  const silent = Boolean(options.silent);
  state.watchlistLoading = true;
  if (!silent) render();
  try {
    const data = await api("/api/web/watchlist");
    state.watchlist = data.watchlist || { rows: [], count: 0 };
  } finally {
    perfMeasure("watchlist-refresh", startedAt, {
      component: "watchlist",
      resultCount: state.watchlist?.count || state.watchlist?.rows?.length || 0
    });
    state.watchlistLoading = false;
    render();
  }
}

function managedSolTotal() {
  return state.balances.reduce((sum, row) => sum + Number(row.sol || 0), 0);
}

function connectedWalletSol() {
  const sol = Number(state.connectedWalletBalance?.sol);
  return Number.isFinite(sol) && sol > 0 ? sol : 0;
}

function totalSol() {
  return managedSolTotal() + connectedWalletSol();
}

function connectedWalletTokenRows() {
  const connected = state.connectedWalletBalance || state.user?.connectedWallet || null;
  if (!connected?.publicKey) return [];
  return (state.connectedWalletBalance?.tokens || []).filter((token) => token?.mint || token?.tokenMint).map((token) => {
    const mint = String(token.mint || token.tokenMint || "").trim();
    return {
      tokenMint: mint,
      shortMint: token.shortMint || shortAddress(mint),
      symbol: token.symbol || token.shortMint || shortAddress(mint),
      name: token.name || "",
      imageUrl: token.imageUrl || token.imageUri || "",
      imageUri: token.imageUri || token.imageUrl || "",
      dexUrl: token.dexUrl || dexUrl(mint),
      pumpUrl: pumpUrl(mint),
      uiAmount: token.uiAmount ?? "held",
      walletCount: 1,
      buys: 0,
      sells: 0,
      spentSol: "0",
      receivedSol: "0",
      realizedSol: "+0",
      estimatedValueSol: null,
      openPnlSol: null,
      openPnlPercent: null,
      valuePending: false,
      valueError: "",
      viewOnly: true,
      source: "connected-wallet"
    };
  });
}

function portfolioPositions() {
  const seen = new Set();
  const rows = [];
  for (const row of [...(state.positions || []), ...connectedWalletTokenRows()]) {
    const mint = String(row?.tokenMint || row?.mint || "").trim();
    if (!mint || seen.has(mint)) continue;
    seen.add(mint);
    rows.push(row);
  }
  return rows;
}

function portfolioWalletCount() {
  const connected = state.connectedWalletBalance?.publicKey || state.user?.connectedWallet?.publicKey || "";
  return state.wallets.length + (connected ? 1 : 0);
}

function portfolioRealizedPnlLabel() {
  return state.pnl?.totals?.realizedSol || "+0 SOL";
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
  if (state.walletRefreshing || state.walletRefreshStatus === "refreshing") return "Syncing...";
  if (state.walletRefreshStatus === "timeout") return "Sync delayed";
  if (state.walletRefreshError || state.walletRefreshStatus === "error") return `Sync failed - retry`;
  const seconds = secondsSince(state.lastWalletRefreshAt);
  if (seconds === null) return "Sync not run";
  if (seconds > 45) return `Stale: ${ageTextFromSeconds(seconds)}`;
  return seconds < 5 ? "Synced just now" : `Synced ${ageTextFromSeconds(seconds)}`;
}

function activePresetSummary() {
  const trade = presetById("trade", state.selectedTradePresetId);
  const bundle = presetById("bundle", state.selectedBundlePresetId);
  const tradeLabel = trade ? `${trade.name || "Trade"} ${trade.amountSol || ""} SOL`.trim() : "Manual";
  const bundleLabel = bundle ? (bundle.name || "Bundle") : "No bundle";
  return `Preset ${tradeLabel} | ${bundleLabel}`;
}

async function loadPostTradeSupplemental() {
  if (!state.user || !state.token) return;
  const startedAt = perfNow();
  try {
    const [pnl, tradePlans] = await Promise.allSettled([
      api("/api/web/pnl"),
      api("/api/web/trade/plans")
    ]);
    if (pnl.status === "fulfilled") state.pnl = pnl.value.pnl || state.pnl || null;
    if (tradePlans.status === "fulfilled") {
      state.tradePlans = tradePlans.value.plans || state.tradePlans || [];
      ensureAutoExitWatchForActivePlans();
    }
    perfMeasure("post-trade-supplemental-refresh", startedAt, {
      component: "post-trade",
      resultCount: (state.tradePlans?.length || 0) + (state.pnl ? 1 : 0),
      details: "pnl,trade-plans"
    });
  } catch (error) {
    perfMeasure("post-trade-supplemental-refresh", startedAt, {
      component: "post-trade",
      errorCode: error?.code || error?.name || "POST_TRADE_SUPPLEMENTAL_FAILED",
      details: publicErrorMessage(error?.message || "Post-trade supplemental refresh failed.")
    });
  }
}

function scheduleWalletBackgroundRefresh(delayMs = 900, options = {}) {
  if (walletBackgroundRefreshTimer) {
    window.clearTimeout(walletBackgroundRefreshTimer);
  }
  walletBackgroundRefreshTimer = window.setTimeout(async () => {
    walletBackgroundRefreshTimer = null;
    if (!state.user || !state.token) return;
    try {
      if (options.reason === "post-trade") {
        await Promise.all([
          loadPostTradeSupplemental(),
          refreshWalletPositions({ force: false })
        ]);
      } else {
        await Promise.all([
          loadAll({ force: false, skipCore: true, silent: true }),
          refreshWalletPositions({ force: false, silent: true })
        ]);
      }
    } catch (error) {
      state.walletRefreshError = error.message || "Background refresh failed.";
      render();
    }
  }, delayMs);
}

async function refreshWalletState({ force = false, deep = false, reason = "manual" } = {}) {
  if (!state.user || !state.token) {
    state.walletRefreshing = false;
    state.walletRefreshStatus = "idle";
    state.walletRefreshError = "Wallet not connected";
    setText("[data-sync-health]", "Wallet not connected");
    finishPositionRefreshAction("error", { error: "Wallet not connected" });
    render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
    return {
      ok: false,
      data: null,
      error: "Wallet not connected",
      durationMs: 0,
      fromCache: false,
      degraded: true
    };
  }
  const normalizedReason = String(reason || "").toLowerCase();
  const isManualHeaderRefresh = normalizedReason === "manual_header_click";
  const isPostTradeRefresh = normalizedReason.includes("post-trade");
  if (force && !deep && !isPostTradeRefresh && !isManualHeaderRefresh && Date.now() - lastWalletForceRefreshAt < WALLET_REFRESH_FORCE_COOLDOWN_MS) {
    force = false;
    recordPerfEvent({
      component: "wallet",
      action: "wallet-refresh-force-throttled",
      durationMs: 0,
      cacheHit: true,
      details: normalizedReason || "manual"
    });
  } else if (force && !deep && !isPostTradeRefresh) {
    lastWalletForceRefreshAt = Date.now();
  }
  if (walletRefreshPromise) {
    recordPerfEvent({
      component: "wallet",
      action: "wallet-refresh-dedupe",
      durationMs: 0,
      cacheHit: true,
      details: force ? "force-shared" : "shared"
    });
    if (state.positionRefreshAction?.state === "clicked") {
      setPositionRefreshAction("refreshing", { startedAt: state.positionRefreshAction.startedAt || perfNow() });
    }
    return walletRefreshPromise.finally(() => {
      if (["clicked", "refreshing"].includes(state.positionRefreshAction?.state)) {
        const failed = state.walletRefreshStatus === "error" || state.walletRefreshStatus === "timeout";
        finishPositionRefreshAction(failed ? "error" : "success", { error: failed ? publicErrorMessage(state.walletRefreshError || "Refresh delayed") : "" });
      }
    });
  }
  const startedAt = perfNow();
  const requestId = ++walletRefreshSequence;
  state.walletRefreshRequestId = requestId;
  walletRefreshPromise = (async () => {
    let result = {
      ok: false,
      data: null,
      error: "",
      durationMs: 0,
      fromCache: false,
      degraded: false
    };
    if (state.positionRefreshAction?.state === "clicked") {
      setPositionRefreshAction("refreshing", { startedAt: state.positionRefreshAction.startedAt || startedAt });
    }
    state.walletRefreshing = true;
    state.walletRefreshStatus = "refreshing";
    state.walletRefreshError = "";
    setText("[data-sync-health]", syncHealthLabel());
    setHidden("[data-refresh-spinner]", false);
    applyActionButtonStates();
    await sleep(20);
    try {
      await Promise.race([
        loadWalletCore({
          force,
          deep,
          preserveSmartChartFrame: state.activeTab === "smartChart",
          requestId,
          timeoutMs: WALLET_REFRESH_TIMEOUT_MS
        }),
        new Promise((_, reject) => window.setTimeout(() => reject(Object.assign(new Error("Wallet refresh timed out."), { code: "TIMEOUT" })), WALLET_REFRESH_TIMEOUT_MS))
      ]);
      if (state.walletRefreshRequestId !== requestId) {
        result = {
          ok: false,
          data: null,
          error: "Stale wallet refresh ignored.",
          durationMs: perfNow() - startedAt,
          fromCache: false,
          degraded: true
        };
        return result;
      }
      if (state.walletRefreshRequestId === requestId) {
        state.lastWalletRefreshAt = new Date().toISOString();
        state.walletRefreshStatus = "success";
      }
      if (deep) {
        await loadAll({ force, skipCore: true, silent: true });
      } else {
        if (isManualHeaderRefresh || isPostTradeRefresh) {
          void refreshWalletPositions({
            force: true,
            fast: true,
            silent: true,
            followUpValues: true,
            reason: `${reason}-positions-fast`,
            timeoutMs: POSITIONS_FAST_REFRESH_TIMEOUT_MS
          }).then((refreshed) => {
            if (refreshed) render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
          }).catch(() => {});
        }
        scheduleWalletBackgroundRefresh(900, { reason });
      }
      perfMeasure("wallet-refresh-total", startedAt, {
        component: "wallet",
        resultCount: (state.balances?.length || 0) + (state.positions?.length || 0),
        details: deep ? "deep" : `core-plus-background:${reason}`
      });
      finishPositionRefreshAction("success", { error: "" });
      result = {
        ok: true,
        data: {
          balances: state.balances,
          positions: state.positions,
          pnl: state.pnl
        },
        error: "",
        durationMs: perfNow() - startedAt,
        fromCache: false,
        degraded: false
      };
    } catch (error) {
      const isTimeout = error?.code === "TIMEOUT" || /timed out|timeout/i.test(String(error?.message || ""));
      if (state.walletRefreshRequestId === requestId) {
        state.walletRefreshStatus = isTimeout ? "timeout" : "error";
        state.walletRefreshError = error.message || "Refresh failed.";
      }
      perfMeasure("wallet-refresh-total", startedAt, {
        component: "wallet",
        errorCode: error?.code || error?.name || "WALLET_REFRESH_FAILED",
        details: publicErrorMessage(state.walletRefreshError)
      });
      finishPositionRefreshAction("error", { error: publicErrorMessage(state.walletRefreshError) });
      setError(state.walletRefreshError);
      result = {
        ok: false,
        data: {
          balances: state.balances,
          positions: state.positions,
          pnl: state.pnl
        },
        error: publicErrorMessage(state.walletRefreshError),
        durationMs: perfNow() - startedAt,
        fromCache: false,
        degraded: true
      };
    } finally {
      if (state.walletRefreshRequestId === requestId) {
        state.walletRefreshing = false;
      }
      walletRefreshPromise = null;
      render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
    }
    return result;
  })();
  return walletRefreshPromise;
}

async function refreshWalletNow({ force = true, reason = "manual_header_click", deep = false } = {}) {
  return refreshWalletState({ force, reason, deep });
}

function isPostTradeRefreshActive() {
  return Boolean(state.postTradeRefresh?.active) && Number(state.postTradeRefresh?.activeUntil || 0) > Date.now();
}

async function refreshAfterTrade(signature = "", reason = "legacy-post-trade") {
  queuePostTradeRefresh(signature, reason);
}

function queuePostTradeRefresh(signature = "", reason = "post-trade", options = {}) {
  if (signature) state.lastTradeSignature = signature;
  if (postTradeRefreshTimers.length) {
    postTradeRefreshTimers.forEach((timer) => window.clearTimeout(timer));
    postTradeRefreshTimers = [];
  }
  const attemptId = options.tradeAttemptId || createClientAttemptId("post-trade");
  const affectedKeys = Array.isArray(options.affectedKeys) && options.affectedKeys.length
    ? options.affectedKeys.slice(0, 12).map((item) => safePerfText(item, 48))
    : POST_TRADE_AFFECTED_KEYS;
  state.postTradeRefresh = {
    active: true,
    attemptId,
    action: safePerfText(reason, 70),
    signaturePresent: Boolean(signature),
    invalidatedKeys: affectedKeys,
    refreshedKeys: [],
    requestCount: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    activeUntil: Date.now() + 12_000
  };
  recordPerfEvent({
    component: "post-trade",
    action: "post-trade-invalidation-start",
    durationMs: 0,
    requestId: attemptId,
    resultCount: affectedKeys.length,
    details: affectedKeys.join(",")
  });
  POST_TRADE_REFRESH_DELAYS_MS.forEach((delay) => {
    const timer = window.setTimeout(() => {
      postTradeRefreshTimers = postTradeRefreshTimers.filter((item) => item !== timer);
      const requestCount = Number(state.postTradeRefresh?.requestCount || 0) + 1;
      state.postTradeRefresh = {
        ...(state.postTradeRefresh || {}),
        requestCount
      };
      recordPerfEvent({
        component: "post-trade",
        action: "post-trade-refresh-start",
        durationMs: 0,
        requestId: attemptId,
        resultCount: state.postTradeRefresh.requestCount,
        details: reason
      });
      const startedAt = perfNow();
      const refreshTask = requestCount <= 1
        ? refreshWalletState({ force: true, deep: false, reason: "post-trade" })
        : Promise.all([
          refreshWalletPositions({
            force: true,
            fast: true,
            silent: true,
            followUpValues: true,
            reason: "post-trade-light",
            timeoutMs: POSITIONS_FAST_REFRESH_TIMEOUT_MS
          }),
          loadPostTradeSupplemental()
        ]);
      void refreshTask.catch((error) => {
        state.walletRefreshError = error.message || "Post-trade refresh failed.";
        state.postTradeRefresh = {
          ...(state.postTradeRefresh || {}),
          errors: [...(state.postTradeRefresh?.errors || []), publicErrorMessage(error.message || "Post-trade refresh failed.")].slice(-5)
        };
        recordPerfEvent({
          component: "post-trade",
          action: "position-refresh-post-trade-error",
          durationMs: perfNow() - startedAt,
          requestId: attemptId,
          errorCode: error?.code || error?.name || "POST_TRADE_REFRESH_FAILED",
          details: reason
        });
        render();
      }).finally(() => {
        state.postTradeRefresh = {
          ...(state.postTradeRefresh || {}),
          refreshedKeys: [...new Set([...(state.postTradeRefresh?.refreshedKeys || []), "wallet-summary", "positions", "pnl"])],
          active: postTradeRefreshTimers.length > 0,
          activeUntil: postTradeRefreshTimers.length > 0 ? Date.now() + 8_000 : Date.now()
        };
        recordPerfEvent({
          component: "post-trade",
          action: "post-trade-refresh-end",
          durationMs: perfNow() - startedAt,
          requestId: attemptId,
          resultCount: (state.balances?.length || 0) + (state.positions?.length || 0),
          details: state.postTradeRefresh.refreshedKeys.join(",")
        });
        render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
      });
    }, delay);
    postTradeRefreshTimers.push(timer);
  });
  applyActionButtonStates();
}

function shouldDeferTerminalRender() {
  if (document.hidden && state.route === "terminal") return true;
  const active = document.activeElement;
  if (!active || state.route !== "terminal") return false;
  const tag = String(active.tagName || "").toLowerCase();
  const editable = active.isContentEditable || ["input", "textarea", "select"].includes(tag);
  if (!editable) return false;
  return Boolean(active.closest(".fast-preset-builder, .preset-toolbar, .terminal-quick-buy-bar, .command-controls, .live-control-strip, .terminal-preset-strip, .preset-card, .order-ticket, .order-ticket-stack, .terminal-dock, .trade-side, .volume-grid, .sniper-setup, .wallet-exit-grid, .pump-launch-form, .launch-coin-form, .profile-grid, .preset-manager, .trade-panel, .terminal-side-panel, [data-preserve-focus]"));
}

function requestDeferredRender() {
  state.pendingRender = true;
}

function flushDeferredRender() {
  if (!state.pendingRender || shouldDeferTerminalRender()) return;
  state.pendingRender = false;
  render({ force: true });
}

function setRouteSectionHidden(element, hidden) {
  if (!element) return;
  element.hidden = hidden;
  element.dataset.routeViewHidden = hidden ? "true" : "false";
  element.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function syncShellRouteVisibility() {
  if (!app || !loginView || !dashboardView) return;
  const hasWalletContext = Boolean(state.user?.connectedWallet || state.connectedWalletBalance?.publicKey || state.wallets.length);
  app.dataset.loading = state.loading ? "true" : "false";
  app.dataset.route = state.route;
  app.dataset.walletConnected = hasWalletContext ? "true" : "false";
  setRouteSectionHidden(loginView, !["intro", "login"].includes(state.route));
  setRouteSectionHidden(connectView, state.route !== "connect");
  setRouteSectionHidden(dashboardView, state.route !== "terminal");
  setHidden("[data-terminal-global-search]", state.route !== "terminal");
  setHidden("[data-top-sync-strip]", state.route !== "terminal");
}

function syncInteractionLocks() {
  const loginOpen = Boolean(loginModal && state.loginModalOpen);
  const quickBuyOpen = Boolean(state.quickBuyModal?.open);
  document.body.classList.toggle("login-modal-open", loginOpen);
  document.body.classList.toggle("quick-buy-modal-open", quickBuyOpen);
  if (!loginOpen && !quickBuyOpen) {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
  const walletModal = $("[data-wallet-connect-modal]");
  if (walletModal) walletModal.style.pointerEvents = walletModal.hidden ? "none" : "";
  const quickBuyRoot = $("[data-quick-buy-modal-root]");
  if (quickBuyRoot) quickBuyRoot.style.pointerEvents = quickBuyRoot.hidden ? "none" : "";
}

function appShellLooksCollapsed(element, minHeight = 48) {
  if (!element || document.hidden) return false;
  try {
    const rect = element.getBoundingClientRect();
    return rect.width < 24 || rect.height < minHeight;
  } catch (_error) {
    return false;
  }
}

function forceAppShellPaint(reason = "resume") {
  if (!app || document.hidden) return;
  syncShellRouteVisibility();
  syncInteractionLocks();
  const marker = `${Date.now()}:${reason}`;
  const previousTransform = app.style.transform;
  app.dataset.resumePaint = marker;
  app.style.transform = previousTransform ? `${previousTransform} translateZ(0)` : "translateZ(0)";
  void app.offsetHeight;
  window.requestAnimationFrame(() => {
    if (!app || app.dataset.resumePaint !== marker) return;
    app.style.transform = previousTransform;
    delete app.dataset.resumePaint;
  });
}

function appShellNeedsRecovery() {
  if (!app) return false;
  if (app.dataset.route !== state.route) return true;
  const modalClassStuck = document.body.classList.contains("login-modal-open") && (!loginModal || loginModal.hidden || !state.loginModalOpen);
  const quickBuyClassStuck = document.body.classList.contains("quick-buy-modal-open") && !state.quickBuyModal?.open;
  if (modalClassStuck || quickBuyClassStuck) return true;
  if (appShellLooksCollapsed(app, 80)) return true;
  if (state.route !== "terminal") return false;
  const panel = $("[data-panel]");
  if (dashboardView?.hidden) return true;
  if (appShellLooksCollapsed(dashboardView, 80)) return true;
  if (panel && appShellLooksCollapsed(panel, 32)) return true;
  if (panel && !panel.children.length && !String(panel.textContent || "").trim()) return true;
  const visibleSection = [loginView, connectView, dashboardView].some((section) => section && !section.hidden);
  return !visibleSection;
}

function recoverStaleUiLocks(reason = "watchdog") {
  const refresh = state.positionRefreshAction || {};
  const refreshAgeMs = refresh.startedAt ? Math.max(0, perfNow() - Number(refresh.startedAt || 0)) : 0;
  if ((refresh.state === "clicked" || refresh.state === "refreshing") && refreshAgeMs > POSITION_REFRESH_STALE_LOCK_MS) {
    finishPositionRefreshAction("error", { error: "Refresh delayed" });
    recordPerfEvent({
      component: "positions",
      action: "stale-position-refresh-lock-cleared",
      durationMs: refreshAgeMs,
      details: reason
    });
  }
  if (state.walletRefreshing && !walletRefreshPromise) {
    state.walletRefreshing = false;
    state.walletRefreshStatus = state.walletRefreshStatus === "refreshing" ? "timeout" : state.walletRefreshStatus;
    setHidden("[data-refresh-spinner]", true);
  }
  syncInteractionLocks();
  applyActionButtonStates();
}

function recoverAppShell(reason = "watchdog", options = {}) {
  recoverStaleUiLocks(reason);
  if (!appShellNeedsRecovery()) {
    if (options.forcePaint) forceAppShellPaint(reason);
    return false;
  }
  recordPerfEvent({
    component: "app-shell",
    action: "recover-blank-shell",
    durationMs: Math.max(0, Date.now() - lastRenderCompletedAt),
    details: `${reason}:${state.route}:${state.activeTab || ""}`
  });
  closeTransientInteractionLayers({ keepLogin: state.route === "login" });
  syncShellRouteVisibility();
  forceAppShellPaint(reason);
  render({ force: true, preserveSmartChartFrame: state.activeTab === "smartChart" });
  return true;
}

function render(options = {}) {
  if (!app || !loginView || !dashboardView) return;
  syncShellRouteVisibility();
  if (!options.force && shouldDeferTerminalRender()) {
    requestDeferredRender();
    return;
  }
  const startedAt = perfNow();
  const renderKey = `${state.route}:${state.activeTab || "none"}`;
  try {
  state.perfRenderCounts = {
    ...(state.perfRenderCounts || {}),
    [renderKey]: (state.perfRenderCounts?.[renderKey] || 0) + 1
  };
  state.pendingRender = false;
  const hasWalletContext = Boolean(state.user?.connectedWallet || state.connectedWalletBalance?.publicKey || state.wallets.length);
  syncShellRouteVisibility();
  app.dataset.activeTab = state.activeTab || "";
  const preserveSmartChartPanel = Boolean(
    options.preserveSmartChartFrame
    && state.route === "terminal"
    && state.activeTab === "smartChart"
    && document.querySelector("[data-panel] .smart-chart-frame iframe")
  );
  const hasLoginModal = Boolean(loginModal);
  const loginModalVisible = Boolean(hasLoginModal && state.loginModalOpen);
  if (topLoginPanel) topLoginPanel.hidden = hasLoginModal || Boolean(state.user) || state.loginCollapsed;
  setHidden("[data-connect-login-panel]", hasLoginModal || Boolean(state.user) || state.loginCollapsed);
  if (loginModal) {
    loginModal.hidden = !loginModalVisible;
    loginModal.setAttribute("aria-hidden", loginModalVisible ? "false" : "true");
    document.body.classList.toggle("login-modal-open", loginModalVisible);
    document.querySelectorAll("[data-login-tab]").forEach((button) => {
      const active = button.dataset.loginTab === state.loginModalTab;
      button.dataset.active = active ? "true" : "false";
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    setHidden("[data-login-modal-login-section]", state.loginModalTab !== "login");
    setHidden("[data-login-modal-create-section]", state.loginModalTab !== "create");
  } else {
    document.body.classList.remove("login-modal-open");
  }
  if (authActions) authActions.hidden = false;
  if (guestActions) guestActions.hidden = Boolean(state.user);
  if (sessionActions) sessionActions.hidden = !state.user;
  syncShellRouteVisibility();

  setText("[data-user-id]", state.user?.id || "guest");
  setText("[data-wallet-count]", portfolioWalletCount());
  setText("[data-total-sol]", totalSol().toFixed(4));
  const positionRows = portfolioPositions();
  setText("[data-position-count]", positionRows.length);
  setText("[data-realized]", portfolioRealizedPnlLabel());
  setText("[data-top-sol]", `${totalSol().toFixed(4)} SOL`);
  setText("[data-top-portfolio]", `${positionRows.length} position${positionRows.length === 1 ? "" : "s"}`);
  setText("[data-sync-health]", hasWalletContext ? syncHealthLabel() : "Sync idle");
  setText("[data-active-preset-label]", activePresetSummary());
  updateTopTpSlStatus();
  setHidden("[data-refresh-spinner]", !state.walletRefreshing);
  document.querySelectorAll('[data-feature="ogre-tek"]').forEach((element) => {
    element.hidden = !SHOW_STAGED_PERPS_NAV || !shouldShowOgreTekNav(ogreTekConfig);
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
  if (state.route === "terminal" && !preserveSmartChartPanel) renderTabs();
  renderWalletConnectModal();
  renderQuickBuyModal();
  renderOgreAgent();
  syncInteractionLocks();
  applyActionButtonStates();
  const durationMs = perfNow() - startedAt;
  if (durationMs >= 16 || state.perfRenderCounts[renderKey] % 20 === 0) {
    recordPerfEvent({
      component: "render",
      action: "render",
      durationMs,
      resultCount: state.perfRenderCounts[renderKey],
      details: renderKey
    });
  }
  lastRenderCompletedAt = Date.now();
  } catch (error) {
    syncShellRouteVisibility();
    syncInteractionLocks();
    recordCrashEvent({
      component: "render-boundary",
      errorCode: error?.name || "RENDER_FAILED",
      message: error?.message || "Render failed",
      caughtByBoundary: true
    });
    const panel = $("[data-panel]");
    if (state.route === "terminal" && panel) {
      dashboardView.hidden = false;
      panel.innerHTML = `
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. Tap retry to redraw this panel without closing the window.</p>
            <button type="button" class="primary" data-refresh-all>Retry Position Refresh</button>
          </article>
        </section>
      `;
    } else if (state.route === "terminal" && dashboardView) {
      dashboardView.hidden = false;
      dashboardView.innerHTML = `
        <section class="terminal-error-boundary">
          <article class="slime-panel">
            <h2>SlimeWire caught a display error</h2>
            <p>Your trade state is safe. The display refresh failed, but the app did not reload or submit another order.</p>
            <button type="button" class="primary" data-refresh-all>Retry Position Refresh</button>
          </article>
        </section>
      `;
    }
    setError("Display refresh failed. Your trade was not resubmitted. Tap Retry Position Refresh.");
  }
}

function updateTopTpSlStatus() {
  const button = $("[data-tpsl-status-button]");
  if (!button) return;
  const label = $("[data-tpsl-status-label]");
  const permission = state.user?.automationPermission || {};
  const permissionActive = Boolean(state.user?.automationPermissionActive);
  const revoked = Boolean(permission.revokedAt);
  const expiresAt = Date.parse(permission.expiresAt || "");
  const expired = Boolean(permission.enabled) && Number.isFinite(expiresAt) && expiresAt <= Date.now();
  const stateName = permissionActive ? "enabled" : revoked || expired ? "invalid" : "disabled";
  button.dataset.tpslState = stateName;
  const text = stateName === "enabled"
    ? "TP/SL Enabled"
    : stateName === "invalid"
      ? "Re-enable TP/SL"
      : "Enable TP/SL";
  writeText(label, text);
  button.setAttribute("aria-label", `${text}. Stop loss and take profit require wallet auto-sell approval.`);
  button.title = stateName === "enabled"
    ? `Server exits enabled${permission.expiresAt ? ` until ${formatDate(permission.expiresAt)}` : ""}.`
    : "Stop loss and take profit require wallet auto-sell approval.";
}

function requestSmartChartScrollIntoView(panel = document) {
  const scrollToChart = () => {
    const chart = panel.querySelector?.(".smart-chart-terminal") || document.querySelector(".smart-chart-terminal");
    if (!chart) return;
    const top = Math.max(0, chart.getBoundingClientRect().top + window.scrollY);
    window.scrollTo({ top, behavior: "auto" });
  };
  requestAnimationFrame(() => {
    scrollToChart();
    window.setTimeout(scrollToChart, 80);
    window.setTimeout(scrollToChart, 280);
    window.setTimeout(scrollToChart, 800);
  });
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
  document.querySelectorAll(".tabs .nav-tool-group").forEach((group) => {
    const hasActiveChild = Boolean(group.querySelector('[data-active="true"]'));
    group.open = hasActiveChild || Boolean(state.navTekOpen);
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
  if (state.activeTab === "ogreAi") panel.innerHTML = ogreAiHtml();
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
  if (state.activeTab === "smartChart" && state.chartFocusAmountInput) {
    requestAnimationFrame(() => {
      const input = $("[data-chart-buy-amount]");
      if (input) input.focus();
      state.chartFocusAmountInput = false;
    });
  }
  if (state.activeTab === "smartChart" && state.chartScrollIntoView) {
    requestSmartChartScrollIntoView(panel);
    state.chartScrollIntoView = false;
  }
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
  ensureLivePairsWarmup();
  scheduleLivePairsAutoRefresh();
  scheduleScannerAutoRefresh();
  scheduleKolAutoRefresh();
  scheduleWatchlistAutoRefresh();
  scheduleActiveTerminalFeedRefresh();
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
              <button type="button" data-disconnect-wallet>Disconnect</button>
            </div>
          ` : `<small>No wallet connected yet.</small>`}
        </div>
        <small data-wallet-connect-status>${connected ? `Connected ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}.` : "Pick a wallet. Your extension will ask you to approve."}</small>
      </article>

      ${automationDelegationHtml()}

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
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
        ` : `
          <span>No browser wallet connected yet.</span>
          <small>Use this for identity, quick copying, and future non-custodial features. Managed bot wallets stay separate.</small>
        `}
      </div>
      <small data-wallet-connect-status>${connected ? `Connected ${escapeHtml(connected.shortPublicKey || shortAddress(connected.publicKey))}.` : "Pick a wallet above. The wallet extension will ask you to approve the connection."}</small>
    </section>
    ${automationDelegationHtml({ compact: true })}
  `;
}

function automationDelegationHtml({ compact = false } = {}) {
  const connected = state.user?.connectedWallet;
  const managedCount = Array.isArray(state.wallets) ? state.wallets.length : 0;
  const permission = state.user?.automationPermission || {};
  const permissionActive = Boolean(state.user?.automationPermissionActive);
  const expires = permission.expiresAt ? formatDate(permission.expiresAt) : "";
  const status = state.automationDelegationStatus || (managedCount
    ? `${managedCount} managed automation wallet(s) available. ${permissionActive ? `Server exits enabled until ${expires}.` : "Enable permission before using auto TP/SL."}`
    : "Create one automation wallet before relying on server-side exits.");
  return `
    <article class="setup-hub-panel automation-delegation-card ${compact ? "compact" : ""}">
      <div class="delegation-heading">
        <span class="delegation-mode-badge">${permissionActive ? "Automation Enabled" : "TP/SL Permission Required"}</span>
        <h3>Automation Wallet</h3>
      </div>
      <p>Server-side stop-loss, take-profit, and timer exits run only from managed/imported SlimeWire wallets after you enable this permission. Browser-connected Phantom/Solflare wallets still require wallet approval unless a separate audited session-key provider is added later.</p>
      <ul class="delegation-steps">
        <li>Scope: managed/imported SlimeWire wallets only.</li>
        <li>Allowed actions: TP/SL exits and timer exits.</li>
        <li>Limit: sells up to 100% of the tracked position; revoke anytime.</li>
      </ul>
      <div class="profile-actions">
        ${permissionActive ? `<button type="button" class="danger-lite" data-automation-permission="revoke">Revoke Server Exits</button>` : `<button class="primary" type="button" data-automation-permission="enable">Enable Server Exits</button>`}
        <button class="primary" type="button" data-create-automation-wallet>${managedCount ? "Create Another" : "Create Automation Wallet"}</button>
        <button type="button" data-tab="wallets">Manage Wallets</button>
        ${connected ? `<button type="button" data-connect-wallet="solana">Switch Connected Wallet</button>` : ""}
      </div>
      <small data-automation-delegation-status>${escapeHtml(status)}</small>
    </article>
  `;
}

function openWalletConnectChooser({ returnPath = "/terminal" } = {}) {
  state.walletConnectMenuOpen = true;
  state.walletConnectReturnPath = returnPath || "/terminal";
  state.walletConnectStatus = state.user?.connectedWallet
    ? `Connected ${shortAddress(state.user.connectedWallet.publicKey)}. Pick a provider to reconnect or switch.`
    : "Pick a wallet. Your extension will ask you to approve.";
  render({ force: true });
}

function renderWalletConnectModal() {
  const modal = $("[data-wallet-connect-modal]");
  if (!modal) return;
  if (!state.walletConnectMenuOpen) {
    modal.hidden = true;
    modal.innerHTML = "";
    return;
  }

  const connected = state.user?.connectedWallet || state.connectedWalletBalance;
  modal.hidden = false;
  modal.innerHTML = `
    <div class="wallet-connect-backdrop" data-wallet-connect-close></div>
    <section class="wallet-connect-dialog" role="dialog" aria-modal="true" aria-label="Connect wallet">
      <div class="wallet-connect-dialog-head">
        <div>
          <h3>${connected ? "Reconnect Wallet" : "Connect Wallet"}</h3>
          <p>${connected ? "Switch to a different wallet or disconnect the current public wallet." : "Connect Phantom, Solflare, Backpack, or another Solana wallet. Private keys never leave your wallet."}</p>
        </div>
        <button type="button" class="icon-button" data-wallet-connect-close aria-label="Close wallet connection panel">x</button>
      </div>
      ${connected ? `
        <div class="connected-wallet-box modal-connected-wallet">
          <span>${escapeHtml(connected.provider || "Solana Wallet")}</span>
          <code>${escapeHtml(connected.publicKey || "")}</code>
          <div class="card-actions compact">
            <button type="button" data-copy="${escapeHtml(connected.publicKey || "")}">Copy</button>
            <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey || "")}" target="_blank" rel="noreferrer">Solscan</a>
            <button type="button" data-disconnect-wallet>Disconnect</button>
          </div>
        </div>
      ` : ""}
      <div class="wallet-provider-buttons modal-wallet-provider-buttons">
        ${browserWalletChoices().map((wallet) => `
          <button type="button" class="wallet-provider-choice" data-connect-wallet-provider="${wallet.id}" ${wallet.detected ? "" : `title="${escapeHtml(wallet.label)} ${wallet.mobileRedirect ? "mobile flow available" : "extension not detected"}"`}>
            <img src="${escapeHtml(wallet.icon)}" alt="" aria-hidden="true">
            <span>
              <strong>${escapeHtml(connected ? `Switch to ${wallet.label}` : wallet.mobileRedirect ? `Open ${wallet.label}` : wallet.label)}</strong>
              <small>${wallet.detected ? "Detected - connect prompt opens here" : wallet.mobileRedirect ? "Mobile wallet flow" : "Install/open wallet or choose another"}</small>
            </span>
          </button>
        `).join("")}
        <button type="button" class="wallet-provider-choice" data-connect-create-wallet>
          <img src="./assets/slimewire/svg/icons/wallet.svg" alt="" aria-hidden="true">
          <span>
            <strong>Create Managed Wallet</strong>
            <small>Use a SlimeWire-managed wallet for backend automation.</small>
          </span>
        </button>
      </div>
      <small class="connect-status" data-wallet-connect-status>${escapeHtml(state.walletConnectStatus || "")}</small>
    </section>
  `;
}

function quickBuyModalHtml() {
  const modal = state.quickBuyModal || {};
  const token = selectedSmartChartTokenRow()?.tokenMint === modal.tokenMint
    ? selectedSmartChartTokenRow()
    : tokenRefFromMint(modal.tokenMint, { source: modal.source || "quick-buy-modal" });
  return `
    <div class="quick-buy-backdrop" data-quick-buy-close></div>
    <section class="quick-buy-dialog" role="dialog" aria-modal="true" aria-label="Quick Buy">
      <div class="quick-buy-head">
        <div class="with-avatar">
          ${livePairAvatarHtml(token)}
          <div>
            <h3>Quick Buy</h3>
            <p>${escapeHtml(token.symbol || shortAddress(modal.tokenMint))} - ${escapeHtml(shortAddress(modal.tokenMint))}</p>
          </div>
        </div>
        <button type="button" class="icon-button" data-quick-buy-close aria-label="Close Quick Buy">x</button>
      </div>
      <label>
        Wallet
        <select data-quick-buy-modal-wallet>
          ${walletOptionsHtml(modal.walletIndex || (connectedBrowserWallet()?.publicKey ? "connected" : ""))}
        </select>
      </label>
      <label>
        SOL amount
        <input data-quick-buy-modal-amount type="number" min="0" step="0.01" inputmode="decimal" value="${escapeHtml(modal.amountSol || "")}" placeholder="0.10">
      </label>
      <label>
        Slippage
        <select data-quick-buy-modal-slippage>
          <option value="300" ${String(modal.slippageBps || "400") === "300" ? "selected" : ""}>3%</option>
          <option value="400" ${String(modal.slippageBps || "400") === "400" ? "selected" : ""}>4%</option>
          <option value="500" ${String(modal.slippageBps || "400") === "500" ? "selected" : ""}>5%</option>
        </select>
      </label>
      <div class="quick-buy-presets">
        ${["0.1", "0.25", "0.5", "1"].map((amount) => `<button type="button" data-quick-buy-modal-preset="${amount}">${amount} SOL</button>`).join("")}
      </div>
      <div class="quick-buy-actions">
        <button type="button" data-token-trade="${escapeHtml(modal.tokenMint || "")}" data-token-trade-source="quick-buy-modal">Open Full Trade</button>
        <button type="button" class="primary" data-quick-buy-confirm>Confirm Buy</button>
      </div>
      ${modal.status ? `<small class="connect-status">${escapeHtml(modal.status)}</small>` : ""}
      ${modal.error ? `<small class="warning-text">${escapeHtml(modal.error)}</small>` : ""}
    </section>
  `;
}

function renderQuickBuyModal() {
  let modal = $("[data-quick-buy-modal-root]");
  if (!modal) {
    modal = document.createElement("div");
    modal.setAttribute("data-quick-buy-modal-root", "");
    document.body.appendChild(modal);
  }
  if (!state.quickBuyModal?.open) {
    modal.hidden = true;
    modal.innerHTML = "";
    document.body.classList.remove("quick-buy-modal-open");
    return;
  }
  modal.hidden = false;
  modal.innerHTML = quickBuyModalHtml();
  document.body.classList.add("quick-buy-modal-open");
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
  const avatar = normalizeImageUrl(state.user?.avatar || "");
  if (isSafeAvatarSrc(avatar)) {
    return `<img src="${escapeHtml(avatar)}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${tokenMascotSrc("ogre")}';">`;
  }
  const ogreAvatar = tokenMascotSrc("ogre");
  if (fallback === "SW" || fallback === "OG") {
    return `<img src="${ogreAvatar}" alt="">`;
  }
  const label = String(fallback || "SW").trim().slice(0, 2).toUpperCase() || "SW";
  return `<span>${escapeHtml(label)}</span>`;
}

function isSafeAvatarSrc(value) {
  const text = String(value || "").trim();
  return /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(text) || /^https?:\/\/[^\s"'<>]+$/i.test(text);
}

function normalizeImageUrl(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^ipfs:\/\//i.test(text)) {
    const path = text.replace(/^ipfs:\/\//i, "").replace(/^ipfs\//i, "");
    return path ? `https://ipfs.io/ipfs/${encodeURIComponent(path).replace(/%2F/g, "/")}` : "";
  }
  if (/^\/\//.test(text)) return `https:${text}`;
  if (/^https?:\/\/[^\s"'<>]+$/i.test(text)) return text;
  if (/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(text)) return text;
  return "";
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
  const avatar = normalizeImageUrl(kol.avatar || kol.image || "");
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
    ? `<img class="${escapeHtml(className)}" src="${escapeHtml(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.hidden=true;">`
    : `<div class="${escapeHtml(className)} kol-avatar-fallback" aria-hidden="true">${escapeHtml(kolAvatarLabel(kol))}</div>`;
}

function browserWalletChoices() {
  const mobile = isMobileWalletPlatform();
  return [
    { id: "phantom", label: "Phantom", detected: Boolean(walletProviderById("phantom")), mobileRedirect: mobile && Boolean(mobileWalletConnectBaseUrl("phantom")), installUrl: walletInstallUrl("phantom"), icon: walletChoiceIcon("phantom") },
    { id: "solflare", label: "Solflare", detected: Boolean(walletProviderById("solflare")), mobileRedirect: mobile && Boolean(mobileWalletConnectBaseUrl("solflare")), installUrl: walletInstallUrl("solflare"), icon: walletChoiceIcon("solflare") },
    { id: "backpack", label: "Backpack", detected: Boolean(walletProviderById("backpack")), mobileRedirect: false, installUrl: walletInstallUrl("backpack"), icon: walletChoiceIcon("backpack") },
    { id: "solana", label: "Detected Wallet", detected: Boolean(walletProviderById("solana")), mobileRedirect: false, installUrl: "", icon: walletChoiceIcon("solana") }
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

function connectedBrowserWallet() {
  return state.user?.connectedWallet || state.connectedWalletBalance || null;
}

function connectedBrowserWalletOptionHtml(selectedIndex = "") {
  const connected = connectedBrowserWallet();
  if (!connected?.publicKey) return "";
  const selected = String(selectedIndex || "") === "connected" || (!selectedIndex && !state.wallets.length);
  const provider = connected.provider || "Browser Wallet";
  return `<option value="connected" ${selected ? "selected" : ""}>${escapeHtml(provider)} - ${escapeHtml(shortAddress(connected.publicKey))}</option>`;
}

function shortAddress(value) {
  const text = String(value || "");
  return text.length > 10 ? `${text.slice(0, 4)}...${text.slice(-4)}` : text || "token";
}

function tradeHtml() {
  const connected = connectedBrowserWallet();
  const hasManagedWallets = state.wallets.length > 0;
  if (!hasManagedWallets && !connected?.publicKey) {
    return `
      <section class="trade-layout">
        <article class="trade-card">
          <div class="trade-head">
            <div>
              <h3>Connect to Trade</h3>
              <p>Connect Phantom, Solflare, Backpack, or another Solana wallet to open the manual trade panel immediately.</p>
            </div>
          </div>
          <div class="card-actions">
            <button class="primary" type="button" data-web-signup-connect>Connect Wallet</button>
            <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
          </div>
        </article>
      </section>
    `;
  }

  return `
    <section class="trade-layout">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>One-Wallet Trade</h3>
            <p>${connected?.publicKey ? "Connected browser wallets open your wallet approval prompt. Managed wallets stay available for server-side automation." : "Paste a token CA, pick a wallet, then use fast buy and sell buttons from the webpage."}</p>
          </div>
        </div>
        <label>
          Wallet
          <select data-trade-wallet>
            ${walletOptionsHtml(connected?.publicKey && !hasManagedWallets ? "connected" : "")}
          </select>
        </label>
        ${connected?.publicKey ? `<small class="trade-wallet-note">Browser wallet trades require wallet approval and do not expose private keys. TP/SL automation still requires managed SlimeWire wallets.</small>` : ""}
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
            <p>Quick SOL amounts include the bot fee and keep the safety reserve. Auto-exit defaults to TP +25% and SL -8% for the selected wallet.</p>
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
                <option value="0">Off</option>
                <option value="15">+15%</option>
                <option value="25" selected>+25%</option>
                <option value="50">+50%</option>
                <option value="100">+100%</option>
                <option value="custom">Custom</option>
              </select>
              <input data-trade-auto-tp-custom data-custom-for="trade-auto-tp" type="text" placeholder="Custom: 500 or 5x" hidden>
            </label>
            <label>
              Stop Loss
              <select data-trade-auto-sl data-custom-select="trade-auto-sl">
                <option value="0">Off</option>
                <option value="8" selected>-8%</option>
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

        ${hasManagedWallets ? `<div class="trade-block managed-trade-block">
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
        </div>` : `<div class="trade-block managed-trade-block">
          <div>
            <h4>Automation Wallets</h4>
            <p>Optional: create a managed SlimeWire wallet only when you want backend TP/SL, timed exits, bundle, sniper, or Ogre A.I. automation.</p>
          </div>
          <div class="card-actions">
            <button type="button" data-connect-create-wallet>Create Managed Wallet</button>
          </div>
        </div>`}
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
  const connectedOption = connectedBrowserWalletOptionHtml(selectedIndex);
  const managedOptions = state.wallets.map((wallet) => {
    const balance = state.balances.find((row) => Number(row.index) === Number(wallet.index));
    const sol = balance?.sol !== null && balance?.sol !== undefined ? `${Number(balance.sol).toFixed(4)} SOL` : "balance loading";
    return `<option value="${wallet.index}" ${String(wallet.index) === String(selectedIndex || "") ? "selected" : ""}>${wallet.index}. ${escapeHtml(wallet.label)} - ${sol}</option>`;
  }).join("");
  if (connectedOption || managedOptions) return `${connectedOption}${managedOptions}`;
  return `<option value="">No wallet connected</option>`;
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

function ogreAiResultHtml() {
  if (!state.ogreAiResult) {
    return `
      <article class="latest-trade ogre-ai-result-card">
        <h3>Ogre A.I. Orders</h3>
        <p>Start an automation run to scan best picks, buy with selected managed wallets, and arm TP/SL exits.</p>
      </article>
    `;
  }

  const row = state.ogreAiResult;
  const plans = Array.isArray(row.plans) ? row.plans : [];
  const picks = Array.isArray(row.picks) ? row.picks : [];
  const errors = Array.isArray(row.errors) ? row.errors : [];
  return `
    <article class="latest-trade ogre-ai-result-card">
      <h3>${plans.length ? "Ogre A.I. Armed" : picks.length ? "Ogre A.I. Picked" : "Ogre A.I. Orders"}</h3>
      <p>${escapeHtml(row.message || "")}</p>
      <dl>
        <div><dt>Mode</dt><dd>${escapeHtml(row.mode || "quick")}</dd></div>
        <div><dt>Tier</dt><dd>${escapeHtml(row.selectedTier || "n/a")}</dd></div>
        <div><dt>Scanned</dt><dd>${escapeHtml(row.scanned || 0)}</dd></div>
        <div><dt>Qualified</dt><dd>${escapeHtml(row.qualified || 0)}</dd></div>
        <div><dt>Plans</dt><dd>${escapeHtml(row.armedCount || plans.length)}</dd></div>
      </dl>
      ${row.tierCounts ? `<small>Strict ${escapeHtml(row.tierCounts.strict || 0)} | Balanced ${escapeHtml(row.tierCounts.balanced || 0)} | Available ${escapeHtml(row.tierCounts.available || 0)} | Scout ${escapeHtml(row.tierCounts.scout || 0)}</small>` : ""}
      <div class="ogre-ai-pick-list">
        ${plans.map((plan) => {
          const pick = plan.pick || {};
          return `
            <div class="ogre-ai-pick-card">
              <strong>${escapeHtml(pick.symbol || plan.shortMint || "Pick")}</strong>
              <span>${escapeHtml(pick.name || plan.tokenMint || "")}</span>
              <small>Score ${escapeHtml(pick.score || "n/a")} | MC ${escapeHtml(pick.marketCapLabel || "n/a")} | Liq ${escapeHtml(pick.liquidityLabel || "n/a")} | Age ${escapeHtml(pick.ageLabel || "n/a")}</small>
              ${Array.isArray(pick.reasons) && pick.reasons.length ? `<small>${pick.reasons.map((reason) => escapeHtml(reason)).join(" | ")}</small>` : ""}
              <small>${escapeHtml(plan.message || "")}</small>
              <div class="card-actions compact">
                <button data-copy="${escapeHtml(plan.tokenMint)}">Copy CA</button>
                <a href="${escapeHtml(pick.dexUrl || plan.dexUrl || dexUrl(plan.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
                ${pick.pumpUrl ? `<a href="${escapeHtml(pick.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>` : ""}
              </div>
            </div>
          `;
        }).join("")}
        ${!plans.length ? picks.map((pick) => `
          <div class="ogre-ai-pick-card">
            <strong>${escapeHtml(pick.symbol || pick.shortMint || "Pick")}</strong>
            <span>${escapeHtml(pick.name || pick.tokenMint || "")}</span>
            <small>Score ${escapeHtml(pick.score || "n/a")} | MC ${escapeHtml(pick.marketCapLabel || "n/a")} | Liq ${escapeHtml(pick.liquidityLabel || "n/a")} | Age ${escapeHtml(pick.ageLabel || "n/a")}</small>
            ${Array.isArray(pick.reasons) && pick.reasons.length ? `<small>${pick.reasons.map((reason) => escapeHtml(reason)).join(" | ")}</small>` : ""}
            <small>Buy not armed. Review the error below before retrying.</small>
            <div class="card-actions compact">
              <button data-copy="${escapeHtml(pick.tokenMint)}">Copy CA</button>
              <a href="${escapeHtml(pick.dexUrl || dexUrl(pick.tokenMint))}" target="_blank" rel="noreferrer">Dex</a>
              ${pick.pumpUrl ? `<a href="${escapeHtml(pick.pumpUrl)}" target="_blank" rel="noreferrer">Pump</a>` : ""}
            </div>
          </div>
        `).join("") : ""}
      </div>
      ${errors.length ? `<div class="mini-results">${errors.map((item) => `<span data-ok="false">${escapeHtml(item.shortMint || item.tokenMint)}: ${escapeHtml(item.message || "failed")}</span>`).join("")}</div>` : ""}
    </article>
  `;
}

function ogreAiHtml() {
  if (!state.wallets.length) {
    return `${createWalletSection()}${emptyState("No managed wallets loaded", "Ogre A.I. needs managed/imported SlimeWire wallets so the server can submit TP/SL and timer exits after it buys.")}`;
  }

  return `
    <section class="trade-layout ogre-ai-terminal">
      <article class="trade-card">
        <div class="trade-head">
          <div>
            <h3>Ogre A.I.</h3>
            <p>Automation mode for managed wallets: scan best-pick feeds, buy selected setups, and arm exits from one command panel.</p>
          </div>
          <span class="sync-pill">Managed server exits</span>
        </div>

        <div class="ogre-ai-grid" data-preserve-focus>
          <label>
            Mode
            <select data-ogre-ai-mode>
              <option value="quick">Quick Scalp</option>
              <option value="fresh">Fresh Launches</option>
              <option value="safer">Safer Flow</option>
            </select>
          </label>
          <label>
            SOL per wallet
            <input data-ogre-ai-amount inputmode="decimal" placeholder="0.1" value="0.1">
          </label>
          <label>
            Orders to stack
            <select data-ogre-ai-runs>
              <option value="1">1 order</option>
              <option value="2">2 orders</option>
              <option value="3">3 orders</option>
              <option value="5">5 orders</option>
              <option value="10">10 orders</option>
              <option value="25">25 orders</option>
            </select>
          </label>
          ${selectWithCustomHtml({
            selectAttr: "data-ogre-ai-tp",
            customAttr: "data-ogre-ai-tp-custom",
            customFor: "ogre-ai-tp",
            selected: "25",
            customType: "number",
            customPlaceholder: "Custom TP %",
            options: [
              ["15", "+15%"],
              ["25", "+25%"],
              ["40", "+40%"],
              ["60", "+60%"],
              ["100", "+100%"],
              ["custom", "Custom"]
            ]
          })}
          ${selectWithCustomHtml({
            selectAttr: "data-ogre-ai-sl",
            customAttr: "data-ogre-ai-sl-custom",
            customFor: "ogre-ai-sl",
            selected: "8",
            customType: "number",
            customPlaceholder: "Custom SL %",
            options: [
              ["8", "-8%"],
              ["10", "-10%"],
              ["15", "-15%"],
              ["off", "No stop loss"],
              ["custom", "Custom"]
            ]
          })}
          ${fallbackTimerSelectHtml("ogre-ai-delay", "data-ogre-ai-delay", "5")}
          ${selectWithCustomHtml({
            selectAttr: "data-ogre-ai-slippage",
            customAttr: "data-ogre-ai-slippage-custom",
            customFor: "ogre-ai-slippage",
            selected: "400",
            customType: "number",
            customPlaceholder: "Custom bps",
            options: [
              ["300", "3%"],
              ["400", "4%"],
              ["500", "5%"],
              ["custom", "Custom"]
            ]
          })}
          <label>
            Min score
            <input data-ogre-ai-min-score type="number" min="1" max="100" step="1" placeholder="Auto">
          </label>
        </div>

        <div class="wallet-grid">
          ${walletChecksHtml("ogre-ai")}
        </div>
        ${walletGroupHtml("ogre-ai")}

        <div class="card-actions">
          <button class="primary" type="button" data-ogre-ai-start ${state.ogreAiLoading ? "disabled" : ""}>${state.ogreAiLoading ? "Scanning..." : "Start Ogre A.I."}</button>
          <button type="button" data-tab="live">Review Live Pairs</button>
          <button type="button" data-tab="positions">Positions</button>
        </div>
        <small data-ogre-ai-status>${escapeHtml(state.ogreAiStatus || "No guarantees. Best-pick automation can lose money in fast meme markets; TP/SL execution depends on route/liquidity and managed-wallet server exits.")}</small>
      </article>

      <aside class="trade-side">
        ${automationDelegationHtml({ compact: true })}
        <article>
          <h3>How It Runs</h3>
          <p>Ogre A.I. pulls from live best-pick feeds, filters obvious high-risk setups, buys with your selected managed wallets, and arms 100% bag exits using the TP/SL/timer settings above.</p>
          <ul class="delegation-steps">
            <li>Use small sizing first.</li>
            <li>Server exits require managed/imported wallets.</li>
            <li>Stop orders are triggers, not guaranteed prices.</li>
          </ul>
        </article>
        ${ogreAiResultHtml()}
      </aside>
    </section>
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

function walletSelectOptionsHtml(selectedIndex = "") {
  if (!state.wallets.length) return `<option value="">No managed wallets loaded</option>`;
  return state.wallets.map((wallet, index) => {
    const value = String(wallet.index ?? index + 1);
    const label = `${value}. ${wallet.label || "Wallet"} ${wallet.shortPublicKey || shortAddress(wallet.publicKey || "")}`;
    return `<option value="${escapeHtml(value)}" ${String(selectedIndex) === value ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }).join("");
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

function launchCoinLiveMint(draft = state.launchCoinDraft || {}) {
  return String(
    draft.tokenMint ||
      draft.mint ||
      draft.ca ||
      state.launchWatches?.[0]?.tokenMint ||
      state.launchWatches?.[0]?.mint ||
      state.smartChartToken?.tokenMint ||
      state.smartChartToken?.mint ||
      ""
  ).trim();
}

function pumpLiveProviderConfigured() {
  return Boolean(
    pumpLiveConfig &&
      pumpLiveConfig.enabled &&
      (pumpLiveConfig.provider || pumpLiveConfig.playbackBaseUrl || pumpLiveConfig.ingestUrl)
  );
}

function pumpLiveProviderLabel() {
  const provider = String(pumpLiveConfig.provider || "").trim();
  return provider ? provider.toUpperCase() : "Provider not configured";
}

function pumpLivePlaybackUrl(mint) {
  const base = String(pumpLiveConfig.playbackBaseUrl || "").trim();
  if (!base || !mint) return "";
  if (base.includes("{mint}")) return base.replace(/\{mint\}/g, encodeURIComponent(mint));
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}mint=${encodeURIComponent(mint)}`;
}

function pumpLiveShortMint(mint) {
  if (!mint) return "No CA yet";
  return mint.length > 14 ? `${mint.slice(0, 6)}...${mint.slice(-6)}` : mint;
}

function pumpLiveStreamRouteId(mint) {
  const safe = mint ? `${mint.slice(0, 6)}-${mint.slice(-6)}` : "pending-ca";
  return `slime-pump-live-${safe}`;
}

function pumpLivePanelHtml(draft = state.launchCoinDraft || {}) {
  const mint = launchCoinLiveMint(draft);
  const configured = pumpLiveProviderConfigured();
  const playbackUrl = pumpLivePlaybackUrl(mint);
  const status =
    state.pumpLiveStatus ||
    (mint
      ? configured
        ? "Ready to stage Pump Live for this launch."
        : "Provider hooks ready. Add Pump Live envs to enable real video."
      : "Launch or paste a CA to stage Pump Live.");
  const disabled = mint ? "" : "disabled";
  const videoFrame =
    configured && playbackUrl
      ? `<iframe class="pump-live-frame" src="${escapeHtml(playbackUrl)}" title="Pump Live preview" loading="lazy" allow="autoplay; fullscreen; picture-in-picture"></iframe>`
      : `<div class="pump-live-placeholder"><span>LIVE</span><strong>Pump Live standby</strong><p>Video stays off Render until a streaming provider is configured.</p></div>`;

  return `
    <section class="launch-coin-card pump-live-panel" data-pump-live-panel>
      <div class="pump-live-head">
        <div>
          <p class="panel-kicker">Pump Live</p>
          <h4>Live launch studio</h4>
          <p>Keep the launch, chart, transactions, and creator controls inside Slime.</p>
        </div>
        <span class="pump-live-pill ${configured ? "ready" : "standby"}">${escapeHtml(configured ? "provider ready" : "standby")}</span>
      </div>
      <div class="pump-live-grid">
        <div class="pump-live-video">
          ${videoFrame}
        </div>
        <div class="pump-live-stack">
          <div class="pump-live-stat"><span>Launch CA</span><strong>${escapeHtml(pumpLiveShortMint(mint))}</strong></div>
          <div class="pump-live-stat"><span>Provider</span><strong>${escapeHtml(pumpLiveProviderLabel())}</strong></div>
          <div class="pump-live-stat"><span>Chart mode</span><strong>Pump chart + txns</strong></div>
          <div class="pump-live-stat"><span>Stream route</span><strong>${escapeHtml(pumpLiveStreamRouteId(mint))}</strong></div>
        </div>
      </div>
      <div class="quick-grid pump-live-controls">
        <button type="button" data-pump-live-action="go" ${disabled}>Go Live</button>
        <button type="button" data-pump-live-action="chart" ${disabled}>Chart + Txns</button>
        <button type="button" data-pump-live-action="copy" ${disabled}>Copy Stream ID</button>
        <button type="button" data-pump-live-action="obs" ${disabled}>OBS / Mobile Setup</button>
        <button type="button" data-pump-live-action="end" ${disabled}>End Live</button>
      </div>
      <p class="pump-live-status">${escapeHtml(status)}</p>
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
              <input data-launch-coin-image type="file" accept="image/*,.png,.jpg,.jpeg,.webp,.gif,.heic,.heif,.avif">
              <span class="muted">SlimeWire converts common phone and desktop images during launch. Use a clear square JPG, PNG, WEBP, or screenshot for best results.</span>
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
          <summary>Creator / Dev Wallet</summary>
          <div class="volume-grid">
            <label>
              Creator Fee
              <select data-launch-coin-creator-fee>
                <option value="0" ${String(draft.creatorFeeBps || "0") === "0" ? "selected" : ""}>None</option>
                <option value="50" ${String(draft.creatorFeeBps || "") === "50" ? "selected" : ""}>0.5%</option>
                <option value="100" ${String(draft.creatorFeeBps || "") === "100" ? "selected" : ""}>1%</option>
                <option value="200" ${String(draft.creatorFeeBps || "") === "200" ? "selected" : ""}>2%</option>
              </select>
            </label>
            <label>
              Creator Fee Wallet
              <input data-launch-coin-fee-recipient type="text" placeholder="Optional wallet address" value="${escapeHtml(draft.creatorFeeRecipient || "")}">
            </label>
            <label>
              Fee Handling
              <select data-launch-coin-fee-mode>
                <option value="standard" ${(draft.feeMode || "standard") === "standard" ? "selected" : ""}>Standard</option>
                <option value="dev" ${draft.feeMode === "dev" ? "selected" : ""}>Send creator fees to dev wallet</option>
                <option value="buyback" ${draft.feeMode === "buyback" ? "selected" : ""}>Route creator fees to buyback wallet</option>
                <option value="burn" ${draft.feeMode === "burn" ? "selected" : ""}>Burn creator fees when supported</option>
                <option value="split" ${draft.feeMode === "split" ? "selected" : ""}>Split dev / buyback</option>
              </select>
            </label>
            <label>
              Buyback Wallet
              <input data-launch-coin-buyback-wallet type="text" placeholder="Optional buyback wallet" value="${escapeHtml(draft.buybackWallet || "")}">
            </label>
            <label class="switch-row">
              <input data-launch-coin-burn-creator-fees type="checkbox" ${draft.burnCreatorFees ? "checked" : ""}>
              <span>Burn creator fees when supported by the launch connector</span>
            </label>
            <label class="switch-row">
              <input data-launch-coin-dev-buy-enabled type="checkbox" ${draft.devBuyEnabled ? "checked" : ""}>
              <span>Run Dev Wallet Initial Buy before the post-launch preset</span>
            </label>
            <label>
              Dev Wallet
              <select data-launch-coin-dev-wallet>
                ${walletSelectOptionsHtml(draft.devWalletIndex || (draft.walletIndexes || [])[0] || "")}
              </select>
            </label>
            <label>
              Dev Buy SOL (launch amount)
              <input data-launch-coin-dev-buy-sol type="text" inputmode="decimal" autocomplete="off" placeholder="0.05" value="${escapeHtml(draft.devBuySol || "")}">
            </label>
            <p class="muted full-span">Set the dev wallet buy amount here. After launch, SlimeWire can run the Dev Wallet Initial Buy first, then continue into your selected post-launch action.</p>
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

        ${pumpLivePanelHtml(draft)}

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
          <h3>Launch Checklist</h3>
          <p>Confirm the token details, image, dev buy amount, fee handling, and post-launch action before submitting. If direct launch is unavailable, save the sheet and use the fallback links.</p>
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
    creatorFeeBps: $("[data-launch-coin-creator-fee]")?.value || draft.creatorFeeBps || "0",
    creatorFeeRecipient: ($("[data-launch-coin-fee-recipient]")?.value || "").trim(),
    feeMode: $("[data-launch-coin-fee-mode]")?.value || draft.feeMode || "standard",
    buybackWallet: ($("[data-launch-coin-buyback-wallet]")?.value || "").trim(),
    burnCreatorFees: Boolean($("[data-launch-coin-burn-creator-fees]")?.checked),
    devBuyEnabled: Boolean($("[data-launch-coin-dev-buy-enabled]")?.checked),
    devWalletIndex: $("[data-launch-coin-dev-wallet]")?.value || draft.devWalletIndex || "",
    devBuySol: normalizedQuickBuyAmount($("[data-launch-coin-dev-buy-sol]")?.value || draft.devBuySol || "") || "",
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

function readRawFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read that image file."));
    reader.readAsDataURL(file);
  });
}

function imageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not preview that image for compression."));
    image.src = dataUrl;
  });
}

function dataUrlMimeType(dataUrl, fallback = "application/octet-stream") {
  const match = String(dataUrl || "").match(/^data:([^;,]+)[;,]/i);
  return match?.[1] || fallback;
}

async function readFileAsDataUrl(file) {
  if (!file) return "";
  const maxRawBytes = 8 * 1024 * 1024;
  const maxCompressedPayloadBytes = 420_000;
  const maxBackendPayloadBytes = 10_750_000;
  if (file.size > maxRawBytes) {
    throw new Error("Image is over 8MB. Use a smaller phone screenshot, PNG, JPG, WEBP, GIF, HEIC/HEIF, or AVIF.");
  }

  const rawDataUrl = await readRawFileAsDataUrl(file);
  if (file.type === "image/gif" || /\.(?:gif|heic|heif|avif)$/i.test(file.name || "")) {
    if (rawDataUrl.length > maxBackendPayloadBytes) {
      throw new Error("Image is too large for backend conversion. Use a smaller phone screenshot, PNG, JPG, or WEBP.");
    }
    return rawDataUrl;
  }

  try {
    const image = await imageFromDataUrl(rawDataUrl);
    const maxSide = 384;
    const scale = Math.min(1, maxSide / Math.max(image.width || maxSide, image.height || maxSide));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round((image.width || maxSide) * scale));
    canvas.height = Math.max(1, Math.round((image.height || maxSide) * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    const attempts = [
      ["image/webp", 0.76],
      ["image/webp", 0.64],
      ["image/webp", 0.52],
      ["image/webp", 0.42],
      ["image/jpeg", 0.72],
      ["image/jpeg", 0.58],
      ["image/jpeg", 0.46],
      ["image/jpeg", 0.36]
    ];
    for (const [type, quality] of attempts) {
      const compressed = canvas.toDataURL(type, quality);
      if (compressed.length <= maxCompressedPayloadBytes) return compressed;
    }
  } catch (error) {
    const status = $("[data-launch-coin-status]");
    const message = "Preview unavailable; SlimeWire will try to convert this image during launch.";
    state.launchCoinStatus = message;
    writeText(status, message);
    console.info("[SlimeWire launch image]", {
      step: "preview_unavailable_backend_convert",
      fileName: file.name || "",
      reportedMime: file.type || "",
      bytes: file.size || 0,
      reason: error?.message || ""
    });
    if (rawDataUrl.length <= maxBackendPayloadBytes) return rawDataUrl;
  }

  if (rawDataUrl.length <= maxBackendPayloadBytes) {
    const status = $("[data-launch-coin-status]");
    const message = "Image will be converted on the backend during launch.";
    state.launchCoinStatus = message;
    writeText(status, message);
    return rawDataUrl;
  }

  throw new Error("Token image is too large for upload. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");
}

async function launchCoinImagePayload() {
  const imageFile = $("[data-launch-coin-image]")?.files?.[0];
  if (!imageFile) return {};
  const imageDataUrl = await readFileAsDataUrl(imageFile);
  return {
    imageName: imageFile.name,
    imageType: dataUrlMimeType(imageDataUrl, imageFile.type || "application/octet-stream"),
    imageDataUrl
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

function launchCoinDevBuyPresetFromDraft(draft = {}) {
  const saved = draft.tradePresetId ? presetById("trade", draft.tradePresetId) : null;
  const walletIndex = draft.devWalletIndex || (draft.walletIndexes || [])[0] || saved?.walletIndex || saved?.walletIndexes?.[0] || "1";
  return {
    ...(saved || {}),
    walletIndex,
    walletIndexes: [walletIndex],
    amountSol: normalizedQuickBuyAmount(draft.devBuySol || draft.amountSol || saved?.amountSol || "0.05") || "0.05",
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

    state.launchCoinStatus = "Preparing image for SlimeWire backend conversion...";
    writeText(status, state.launchCoinStatus);

    const imagePayload = await launchCoinImagePayload();
    const launchAttemptId = globalThis.crypto?.randomUUID?.()
      || `launch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const requestPayload = {
      ...draft,
      ...imagePayload,
      launchAttemptId
    };
    const requestBody = JSON.stringify(requestPayload);
    if (requestBody.length > 11_500_000) {
      throw new Error("Launch upload is still too large. Use a smaller phone screenshot, PNG, JPG, WEBP, or GIF and try again.");
    }
    console.info("[SlimeWire pump launch]", {
      launchAttemptId,
      step: "frontend_submit",
      symbol: draft.symbol,
      selectedDevWalletId: draft.selectedDevWalletId || draft.devWalletIndex || draft.devWalletPublicKey || ""
    });
    state.launchCoinStatus = `Submitting launch through SlimeWire... Launch ID: ${launchAttemptId}`;
    writeText(status, state.launchCoinStatus);

    const data = await api("/api/web/launch/coin", {
      method: "POST",
      body: requestBody,
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS,
      preserveSafeError: true
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

    if (draft.devBuyEnabled) {
      state.launchCoinStatus = `Launch returned ${shortAddress(tokenMint)}.${signature} Running Dev Wallet Initial Buy first...`;
      writeText(status, state.launchCoinStatus);
      await quickPresetTrade(tokenMint, launchCoinDevBuyPresetFromDraft(draft));
      state.launchCoinStatus = `Dev Wallet Initial Buy submitted. Continuing post-launch ${launchCoinActionLabel(draft.action)} setup...`;
      writeText(status, state.launchCoinStatus);
    }

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
    const suffix = error.launchAttemptId && !String(error.message || "").includes(error.launchAttemptId)
      ? ` Launch ID: ${error.launchAttemptId}.`
      : "";
    state.launchCoinStatus = `${error.message || "Launch failed."}${suffix}`;
    console.error("[SlimeWire pump launch]", {
      launchAttemptId: error.launchAttemptId || "",
      stage: error.stage || "",
      code: error.code || "",
      providerStatus: error.providerStatus || null,
      message: error.message || "Launch failed."
    });
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
  const allRows = scan.rows || [];
  const rows = terminalFeedRowsWindow("kol", allRows);
  if (!allRows.length) {
    return emptyState(
      scan.kols?.length ? "No token signals on this refresh" : "No KOL signals found",
      scan.message || "Try Refresh or another mode."
    );
  }
  return `
    <div class="terminal-title-row feed-depth-title">
      <div>
        <h3>${escapeHtml(kolModeLabel(state.kolMode))} Signals</h3>
        <p>KOL Tracker - Social/KOL Signals</p>
      </div>
      <span>${rows.length}/${allRows.length} signals shown</span>
    </div>
    ${tokenSignalRowsHtml(rows, {
      context: "kol",
      primaryAction: "quickTrade",
      primaryActionLabel: "Trade",
      shareBuilder: kolShareText
    })}
    ${terminalFeedLoadMoreHtml("kol", allRows, "KOL signals")}
  `;
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "wallet-create");
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

async function createAutomationWallet() {
  const status = $("[data-automation-delegation-status]");
  const buttons = [...document.querySelectorAll("[data-create-automation-wallet]")];
  setError("");
  state.automationDelegationStatus = "Creating automation wallet...";
  writeText(status, state.automationDelegationStatus);
  buttons.forEach((button) => {
    button.disabled = true;
    writeText(button, "Creating...");
  });

  try {
    await ensureWebAccount(status, "Creating secure web profile for automation wallet backups...");
    const connected = state.user?.connectedWallet;
    const label = connected?.publicKey
      ? `Automation ${shortAddress(connected.publicKey)}`
      : "Automation Wallet";
    const data = await api("/api/web/wallets/create", {
      method: "POST",
      body: JSON.stringify({ label, count: 1 })
    });
    const wallets = Array.isArray(data.wallets) ? data.wallets : [];
    if (!wallets.length) {
      throw new Error(data.message || "Automation wallet create did not return wallet data. Refresh and try again.");
    }
    state.downloads = data.downloads || null;
    if (data.downloads?.encryptedBackup?.text) {
      downloadText(data.downloads.encryptedBackup.filename, data.downloads.encryptedBackup.text);
    }
    if (data.downloads?.recoveryKeys?.text) {
      downloadText(data.downloads.recoveryKeys.filename, data.downloads.recoveryKeys.text);
    }
    state.automationDelegationStatus = "Automation wallet created. Backup downloads started. Fund it before using server-side TP/SL.";
    queuePostTradeRefresh(firstResultSignature(data.plan), "automation-wallet-create");
    state.activeTab = "wallets";
    render({ force: true });
  } catch (error) {
    state.automationDelegationStatus = error.message;
    writeText(status, error.message);
    setError(error.message);
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      writeText(button, "Create Automation Wallet");
    });
  }
}

async function updateAutomationPermission(action = "enable") {
  const status = $("[data-automation-delegation-status]");
  const buttons = [...document.querySelectorAll("[data-automation-permission]")];
  const enable = action !== "revoke";
  state.automationDelegationStatus = enable ? "Enabling server exits..." : "Revoking server exits...";
  writeText(status, state.automationDelegationStatus);
  buttons.forEach((button) => {
    button.disabled = true;
    writeText(button, enable ? "Enabling..." : "Revoking...");
  });

  try {
    await ensureWebAccount(status, "Creating secure web profile for automation permission...");
    const data = await api("/api/web/profile/automation", {
      method: "POST",
      body: JSON.stringify({ action: enable ? "enable" : "revoke", ttlHours: 720 })
    });
    applyUserFromApi(data.user || {
      ...state.user,
      automationPermission: data.profile?.automationPermission || null
    });
    const permission = state.user?.automationPermission || {};
    state.automationDelegationStatus = enable
      ? `Server exits enabled for managed wallets until ${formatDate(permission.expiresAt)}.`
      : "Server exits revoked. Existing plans stay visible but new auto-exit plans require permission again.";
    render({ force: true });
  } catch (error) {
    state.automationDelegationStatus = error.message;
    writeText(status, error.message);
    setError(error.message);
  } finally {
    buttons.forEach((button) => {
      button.disabled = false;
      writeText(button, button.dataset.automationPermission === "revoke" ? "Revoke Server Exits" : "Enable Server Exits");
    });
  }
}

async function runTradePlanCheck() {
  if (!state.user || !state.token) {
    setError("Log in or create a web account before checking server exits.");
    return;
  }
  if (autoExitCheckInFlight) {
    state.automationDelegationStatus = "TP/SL check is already running. Keeping the existing sell check active.";
    render();
    return;
  }
  autoExitCheckInFlight = true;
  state.walletRefreshing = true;
  render();
  try {
    const data = await api("/api/web/trade/plans/run", {
      method: "POST",
      body: JSON.stringify({}),
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS
    });
    state.tradePlans = data.plans || state.tradePlans || [];
    const runner = data.runner || {};
    if (runner.skipped) {
      const activeFor = Number(runner.activeForMs || 0);
      const activeText = activeFor > 0 ? ` for ${Math.ceil(activeFor / 1000)}s` : "";
      state.automationDelegationStatus = runner.reason === "trade_plan_runner_active"
        ? `TP/SL runner is already checking exits${activeText}. It will keep retrying without starting a duplicate sell.`
        : `TP/SL check skipped: ${runner.reason || "runner busy"}.`;
      await loadWalletCore({ force: true });
      return;
    }
    state.automationDelegationStatus = autoExitRunnerSummary(runner);
    await loadWalletCore({ force: true });
  } catch (error) {
    state.automationDelegationStatus = error.message;
    state.walletRefreshError = error.message;
    setError(error.message);
  } finally {
    autoExitCheckInFlight = false;
    state.walletRefreshing = false;
    render();
  }
}

function autoExitRunnerSummary(runner = {}) {
  if (runner.skipped) return `TP/SL skipped: ${runner.reason || "runner busy"}.`;
  const checked = Number(runner.checkedWallets || 0);
  const triggered = Number(runner.triggeredWallets || 0);
  const sold = Number(runner.soldWallets || 0);
  const failed = Number(runner.failedWallets || 0);
  const lastMessage = Array.isArray(runner.messages) && runner.messages.length ? ` Last: ${runner.messages[runner.messages.length - 1]}` : "";
  return `TP/SL checked ${checked}, triggered ${triggered}, sold ${sold}, failed ${failed}.${lastMessage}`;
}

function hasActiveAutoExitPlans() {
  const activeWalletStatuses = new Set(["armed", "watching", "retrying", "submitting", "waiting_next_loop", "timer-only"]);
  return (state.tradePlans || []).some((plan) => {
    const status = String(plan.status || "").toLowerCase();
    if (status === "launch_watch") return true;
    if (status !== "watching") return false;
    if (Number(plan.activeWallets || 0) > 0) return true;
    return (plan.wallets || []).some((wallet) => activeWalletStatuses.has(String(wallet.status || wallet.exitStatus || "").toLowerCase()));
  });
}

function ensureAutoExitWatchForActivePlans() {
  if (hasActiveAutoExitPlans()) {
    state.automationDelegationStatus = state.automationDelegationStatus
      || "Server TP/SL worker is monitoring active plans.";
  }
}

function scheduleAutoExitChecks() {
  state.automationDelegationStatus = "Server TP/SL worker armed. Monitoring continues even if this browser closes.";
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
    await refreshWalletState({ force: true, deep: true });
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
    await refreshWalletState({ force: true, deep: true });
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "wallet-remove");
    state.activeTab = "wallets";
    render();
  } catch (error) {
    state.walletRemoveStatus = error.message;
    writeText(status, error.message);
    setError(error.message);
  }
}

function walletSweepSelectionPayload() {
  const indexes = String($("[data-wallet-sweep-indexes]")?.value || "all").trim() || "all";
  const walletIndexes = indexes.toLowerCase() === "all"
    ? "all"
    : indexes.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean);
  return {
    walletIndexes,
    walletGroup: String($("[data-wallet-sweep-group]")?.value || "").trim(),
    destination: String($("[data-wallet-sweep-destination]")?.value || "").trim(),
    tokenMint: String($("[data-wallet-sweep-token]")?.value || "").trim(),
    slippageBps: String($("[data-wallet-sweep-slippage]")?.value || "1500").trim()
  };
}

function walletSendManyPayload() {
  const sourceIndex = String($("[data-wallet-send-from]")?.value || "1").trim();
  const managedTargetText = String($("[data-wallet-send-managed-targets]")?.value || "").trim();
  const managedGroup = String($("[data-wallet-send-group]")?.value || "").trim().toLowerCase();
  const pastedDestinations = String($("[data-wallet-send-destinations]")?.value || "").trim();
  const managedIndexes = managedTargetText.toLowerCase() === "all"
    ? state.wallets
      .map((wallet) => Number(wallet.index))
      .filter((index) => Number.isFinite(index) && String(index) !== sourceIndex)
    : managedTargetText
      .split(/[,\s]+/)
      .map((item) => Number.parseInt(item, 10))
      .filter((index) => Number.isInteger(index) && index > 0 && String(index) !== sourceIndex);
  const groupIndexes = managedGroup
    ? state.wallets
      .filter((wallet) => {
        const label = String(wallet.label || "").toLowerCase();
        return label === managedGroup || label.startsWith(`${managedGroup} `);
      })
      .map((wallet) => Number(wallet.index))
      .filter((index) => Number.isFinite(index) && String(index) !== sourceIndex)
    : [];
  const managedDestinations = [...new Set([...managedIndexes, ...groupIndexes])]
    .map((index) => state.wallets.find((wallet) => Number(wallet.index) === index)?.publicKey)
    .filter(Boolean);
  const destinations = [
    pastedDestinations,
    managedDestinations.join("\n")
  ].filter(Boolean).join("\n");

  return {
    fromWalletIndex: sourceIndex,
    amountSol: String($("[data-wallet-send-amount]")?.value || "").trim(),
    splitAll: Boolean($("[data-wallet-send-all]")?.checked),
    destinations
  };
}

function summarizeSweepResult(result) {
  if (!result) return "Action complete.";
  const lines = [result.summary || "Action complete."];
  if (Array.isArray(result.rows)) {
    const detail = result.rows.slice(0, 6).map((row) => {
      const label = row.walletLabel || `Wallet ${row.walletIndex || "?"}`;
      const status = row.ok ? "ok" : "failed";
      return `${label}: ${status} - ${row.message || row.signature || "done"}`;
    });
    lines.push(...detail);
    if (result.rows.length > detail.length) lines.push(`...${result.rows.length - detail.length} more wallet(s).`);
  }
  if (result.signature) lines.push(`Tx: ${result.signature}`);
  return lines.join("\n");
}

async function runWalletSweepAction(action) {
  const status = $("[data-wallet-sweep-status]");
  state.walletSweepStatus = "Running wallet action...";
  writeText(status, state.walletSweepStatus);
  setError("");

  try {
    await ensureWebAccount(status, "Opening secure web profile...");
    const endpointByAction = {
      "sweep-sol": "/api/web/wallets/sweep-sol",
      "sweep-tokens": "/api/web/wallets/sweep-tokens",
      "sell-all": "/api/web/wallets/sell-all-tokens",
      "sell-all-sweep": "/api/web/wallets/sell-all-tokens",
      "send-sol-many": "/api/web/wallets/send-sol"
    };
    const endpoint = endpointByAction[action];
    if (!endpoint) throw new Error("Unknown wallet action.");

    const payload = action === "send-sol-many" ? walletSendManyPayload() : walletSweepSelectionPayload();
    if (action === "sell-all") payload.destination = "";
    if (action === "sell-all-sweep" && !payload.destination) {
      throw new Error("Enter a destination wallet for Sell Tokens + Send SOL.");
    }

    const data = await api(endpoint, {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS
    });
    state.walletSweepStatus = summarizeSweepResult(data.sweep);
    writeText(status, state.walletSweepStatus);
    await refreshWalletState({ force: true, deep: true });
    state.activeTab = "wallets";
    render();
  } catch (error) {
    state.walletSweepStatus = error.message;
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

async function connectBrowserWallet(providerId, options = {}) {
  const status = walletConnectStatusElement();
  const provider = walletProviderById(providerId);
  if (!provider) {
    if (await startMobileWalletConnect(providerId, options)) return;
    if (openMobileWalletBrowse(providerId)) return;
    const message = walletInstallGuidance(providerId);
    setWalletConnectStatus(message);
    logWalletConnectFailure(providerId, new Error(message), {
      action: "provider_missing",
      platform: isMobileWalletPlatform() ? "mobile" : "desktop"
    });
    return;
  }

  try {
    const existingWallet = state.user?.connectedWallet?.publicKey || state.connectedWalletBalance?.publicKey || "";
    if (existingWallet) {
      const shouldReconnect = options.confirmSwitch === false
        ? true
        : window.confirm(
            `Reconnect or switch wallet?\n\nCurrent wallet: ${shortAddress(existingWallet)}\n\nYour wallet extension will open so you can approve the wallet to use on Live Terminal.`
          );
      if (!shouldReconnect) {
        setWalletConnectStatus("Wallet connection unchanged.");
        navigateTo("/terminal", "terminal");
        return;
      }
      try {
        await Promise.resolve(provider.disconnect?.());
      } catch {
        // Some providers either do not expose disconnect or reject until the extension is focused.
      }
    }
    setWalletConnectStatus(`Opening ${walletProviderLabel(providerId, provider)}...`);
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
    state.walletConnectMenuOpen = false;
    setWalletConnectStatus(`Connected ${shortAddress(publicKeyText)}. Opening Live Terminal...`);
    navigateTo(options.returnPath || state.walletConnectReturnPath || "/terminal", "terminal");
    render({ force: true });
    refreshTerminalEntryInBackground("browser-wallet-connect");
  } catch (error) {
    const message = error.message || "Wallet connection was cancelled.";
    setWalletConnectStatus(message);
    logWalletConnectFailure(providerId, error, { action: "connect_failed" });
  }
}

async function disconnectBrowserWallet() {
  const status = walletConnectStatusElement();
  if (!state.user || !state.token) {
    state.connectedWalletBalance = null;
    setWalletConnectStatus("Connected wallet disconnected.");
    render({ force: true });
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
    setWalletConnectStatus("Connected wallet disconnected.");
    render({ force: true });
  } catch (error) {
    setWalletConnectStatus(error.message);
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

function isConnectedTradeWallet(walletIndex = "") {
  return String(walletIndex || "").trim().toLowerCase() === "connected";
}

function bytesToBase64(bytes) {
  const chunks = [];
  const size = 0x8000;
  for (let index = 0; index < bytes.length; index += size) {
    chunks.push(String.fromCharCode(...bytes.subarray(index, index + size)));
  }
  return btoa(chunks.join(""));
}

function base64ToBytes(value = "") {
  const binary = atob(String(value || ""));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function providerIdForConnectedWallet(connected = connectedBrowserWallet()) {
  const provider = String(connected?.provider || "").trim().toLowerCase();
  if (provider.includes("phantom")) return "phantom";
  if (provider.includes("solflare")) return "solflare";
  if (provider.includes("backpack")) return "backpack";
  return "solana";
}

async function connectedTradeProvider() {
  const connected = connectedBrowserWallet();
  if (!connected?.publicKey) throw new Error("Connect Phantom, Solflare, or another wallet before trading.");
  const providerId = providerIdForConnectedWallet(connected);
  const provider = walletProviderById(providerId) || walletProviderById("solana");
  if (!provider) {
    openWalletConnectModal({ returnPath: "/terminal/trade" });
    throw new Error(`${connected.provider || "Connected wallet"} is not available in this browser. Reconnect it or choose another wallet.`);
  }
  const providerKey = provider.publicKey?.toBase58?.() || provider.publicKey?.toString?.() || "";
  if (providerKey !== connected.publicKey) {
    const result = await provider.connect?.({ onlyIfTrusted: false });
    const nextKey = result?.publicKey?.toBase58?.() || result?.publicKey?.toString?.() || provider.publicKey?.toBase58?.() || provider.publicKey?.toString?.() || "";
    if (nextKey !== connected.publicKey) {
      throw new Error(`Wallet mismatch. SlimeWire has ${shortAddress(connected.publicKey)} connected, but the browser returned ${shortAddress(nextKey)}. Reconnect the wallet you want to trade with.`);
    }
  }
  return { provider, connected };
}

async function signBrowserTradeTransaction(transactionBase64, provider) {
  if (!transactionBase64 || typeof transactionBase64 !== "string") {
    throw new Error("SlimeWire could not build a wallet approval transaction. Try again or choose another token.");
  }
  if (!window.solanaWeb3?.VersionedTransaction) {
    throw new Error("Solana wallet signing library did not load. Refresh the page and try again.");
  }
  if (typeof provider.signTransaction !== "function") {
    throw new Error("This wallet does not expose signTransaction here. Reconnect with Phantom/Solflare or use the wallet in-app browser.");
  }
  const tx = window.solanaWeb3.VersionedTransaction.deserialize(base64ToBytes(transactionBase64));
  const signed = await provider.signTransaction(tx);
  return bytesToBase64(signed.serialize());
}

async function executeConnectedBrowserTrade({ side, form, actionDetail, amountSol = "", amountMode = "", percent = "", attemptId }) {
  const { provider, connected } = await connectedTradeProvider();
  const order = await api("/api/web/browser-trade/order", {
    method: "POST",
    body: JSON.stringify({
      side,
      tokenMint: form.tokenMint,
      walletPublicKey: connected.publicKey,
      slippageBps: form.slippageBps,
      amountSol,
      amountMode,
      percent,
      tradeAttemptId: attemptId
    }),
    dedupe: false,
    timeoutMs: API_LONG_ACTION_TIMEOUT_MS
  });
  setTradeStatus(`Approve ${side} in ${connected.provider || "your wallet"}...`);
  const signedTransaction = await signBrowserTradeTransaction(order.order?.transaction, provider);
  setTradeStatus("Submitting signed trade...");
  const result = await api("/api/web/browser-trade/execute", {
    method: "POST",
    body: JSON.stringify({
      browserTradeAttemptId: order.order?.browserTradeAttemptId,
      signedTransaction
    }),
    dedupe: false,
    timeoutMs: API_LONG_ACTION_TIMEOUT_MS
  });
  state.tradeResult = result.trade;
  setTradeStatus(result.trade?.message || `${side === "buy" ? "Buy" : "Sell"} submitted from connected wallet.`);
  setTradeAction(side === "buy" ? "trade-buy" : "trade-sell", form.tokenMint, actionDetail, {
    state: "submitted",
    signature: result.trade?.signature || ""
  });
  queuePostTradeRefresh(result.trade?.signature, `browser-${side}`, { tradeAttemptId: attemptId });
  return result.trade;
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
  const takeProfitPct = fieldValue("[data-trade-auto-tp]", "[data-trade-auto-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-trade-auto-sl]", "[data-trade-auto-sl-custom]", "8");
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
  const clickStartedAt = perfNow();
  let actionDetail = amountMode === "max" ? "max" : String(amountSol || "custom");
  let tradeAttemptId = "";
  try {
    const form = readTradeForm();
    actionDetail = amountMode === "max" ? "max" : String(amountSol || "custom");
    const active = activeTradeAction("trade-buy", form.tokenMint, actionDetail);
    if (active) {
      recordPerfEvent({
        component: "post-trade",
        action: "trade-action-dedupe",
        durationMs: perfNow() - clickStartedAt,
        cacheHit: true,
        requestId: active.tradeAttemptId || "",
        details: `trade-buy:${shortAddress(form.tokenMint)}:${actionDetail}`
      });
      return;
    }
    tradeAttemptId = createClientAttemptId("trade-buy");
    const payload = {
      tokenMint: form.tokenMint,
      walletIndex: form.walletIndex,
      slippageBps: form.slippageBps,
      tradeAttemptId
    };
    if (amountMode === "max") {
      payload.amountMode = "max";
    } else {
      const value = Number(amountSol);
      if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a buy amount greater than zero.");
      payload.amountSol = String(value);
    }

    if (isConnectedTradeWallet(form.walletIndex)) {
      setTradeAction("trade-buy", form.tokenMint, actionDetail, {
        state: "clicked",
        tradeAttemptId,
        clickedAt: new Date().toISOString()
      });
      recordPerfEvent({
        component: "post-trade",
        action: "browser-trade-click-to-ui",
        durationMs: perfNow() - clickStartedAt,
        requestId: tradeAttemptId,
        details: `browser-buy:${shortAddress(form.tokenMint)}:${actionDetail}`
      });
      render();
      setTradeStatus("Building wallet-approved buy...");
      await sleep(20);
      await executeConnectedBrowserTrade({
        side: "buy",
        form,
        actionDetail,
        amountSol: payload.amountSol || "",
        amountMode: payload.amountMode || "fixed",
        attemptId: tradeAttemptId
      });
      state.activeTab = "trade";
      render();
      clearTradeActionLater("trade-buy", form.tokenMint, actionDetail, 3000);
      return;
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

    setTradeAction("trade-buy", form.tokenMint, actionDetail, {
      state: "clicked",
      tradeAttemptId,
      clickedAt: new Date().toISOString()
    });
    recordPerfEvent({
      component: "post-trade",
      action: "trade-click-to-ui",
      durationMs: perfNow() - clickStartedAt,
      requestId: tradeAttemptId,
      details: `trade-buy:${shortAddress(form.tokenMint)}:${actionDetail}`
    });
    render();
    setTradeStatus(autoExit.enabled ? "Sending buy and arming auto-exit..." : "Sending buy...");
    await sleep(20);
    const requestStartedAt = perfNow();
    setTradeAction("trade-buy", form.tokenMint, actionDetail, { state: "submitting" });
    const data = await api("/api/web/trade/buy", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        clientClickToUiMs: Math.round(requestStartedAt - clickStartedAt)
      }),
      dedupe: false
    });
    recordPerfEvent({
      component: "post-trade",
      action: "trade-backend-ack",
      durationMs: perfNow() - requestStartedAt,
      requestId: tradeAttemptId,
      resultCount: data.trade?.signature ? 1 : 0,
      details: "trade-buy"
    });
    state.tradeResult = data.trade;
    if (data.trade?.autoExitPlan) {
      state.tradePlanResult = data.trade.autoExitPlan;
      setTradeStatus(data.trade.autoExitPlan.shortMessage || "Buy landed and auto-exit is armed.");
      scheduleAutoExitChecks();
    } else if (data.trade?.autoExitRequested) {
      setTradeStatus("Buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.");
    }
    setTradeAction("trade-buy", form.tokenMint, actionDetail, {
      state: "submitted",
      signature: data.trade?.signature || ""
    });
    queuePostTradeRefresh(data.trade?.signature, "trade-buy", { tradeAttemptId });
    state.activeTab = "trade";
    render();
    clearTradeActionLater("trade-buy", form.tokenMint, actionDetail, 3000);
  } catch (error) {
    if (tradeAttemptId) {
      setTradeAction("trade-buy", state.tradeToken || $("[data-trade-token]")?.value || "", actionDetail, {
        state: "error",
        error: publicErrorMessage(error.message || "Buy failed")
      });
      clearTradeActionLater("trade-buy", state.tradeToken || $("[data-trade-token]")?.value || "", actionDetail, 4000);
    }
    recordPerfEvent({
      component: "post-trade",
      action: "trade-action-error",
      durationMs: perfNow() - clickStartedAt,
      requestId: tradeAttemptId,
      errorCode: error?.code || error?.name || "TRADE_BUY_FAILED",
      details: publicErrorMessage(error.message || "Buy failed")
    });
    setTradeStatus(error.message);
  }
}

async function executeWebSell(percent) {
  const clickStartedAt = perfNow();
  const manualSellAttemptId = createClientAttemptId("manual-sell");
  let form = null;
  let detail = String(percent || "custom");
  try {
    form = readTradeForm();
    const value = Number.parseInt(percent, 10);
    detail = String(value || detail);
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new Error("Sell percent must be from 1 to 100.");
    }
    const active = activeTradeAction("trade-sell", form.tokenMint, detail);
    if (active) {
      recordPerfEvent({
        component: "manual-sell",
        action: "manual-sell-dedupe",
        durationMs: perfNow() - clickStartedAt,
        cacheHit: true,
        requestId: active.tradeAttemptId || "",
        details: `${shortAddress(form.tokenMint)}:${value}`
      });
      return;
    }

    setTradeAction("trade-sell", form.tokenMint, detail, {
      state: "clicked",
      tradeAttemptId: manualSellAttemptId,
      clickedAt: new Date().toISOString()
    });
    setTradeStatus("Sending sell...");
    recordPerfEvent({
      component: "manual-sell",
      action: "manual-sell-click-to-ui",
      durationMs: perfNow() - clickStartedAt,
      requestId: manualSellAttemptId,
      details: `${shortAddress(form.tokenMint)}:${value}`
    });
    render();
    await sleep(20);
    const requestStartedAt = perfNow();
    setTradeAction("trade-sell", form.tokenMint, detail, { state: "submitting" });
    if (isConnectedTradeWallet(form.walletIndex)) {
      await executeConnectedBrowserTrade({
        side: "sell",
        form,
        actionDetail: detail,
        percent: String(value),
        attemptId: manualSellAttemptId
      });
      state.activeTab = "trade";
      render();
      clearTradeActionLater("trade-sell", form.tokenMint, detail, 3000);
      return;
    }
    const data = await api("/api/web/trade/sell", {
      method: "POST",
      body: JSON.stringify({
        tokenMint: form.tokenMint,
        walletIndex: form.walletIndex,
        slippageBps: form.slippageBps,
        percent: value,
        manualSellAttemptId,
        clientClickToUiMs: Math.round(requestStartedAt - clickStartedAt)
      }),
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS,
      dedupe: false
    });
    recordPerfEvent({
      component: "manual-sell",
      action: "manual-sell-request",
      durationMs: perfNow() - requestStartedAt,
      requestId: manualSellAttemptId,
      resultCount: data.trade?.signature ? 1 : 0,
      details: "single-wallet"
    });
    state.tradeResult = data.trade;
    setTradeStatus(data.trade?.signature ? "Submitted. Refreshing position in the background..." : "Sell submitted. Refreshing position in the background...");
    setTradeAction("trade-sell", form.tokenMint, detail, {
      state: "submitted",
      signature: data.trade?.signature || ""
    });
    queuePostTradeRefresh(data.trade?.signature || firstResultSignature(data.trade), "manual-sell-trade");
    state.activeTab = "trade";
    render();
    clearTradeActionLater("trade-sell", form.tokenMint, detail, 3000);
  } catch (error) {
    if (form?.tokenMint) {
      setTradeAction("trade-sell", form.tokenMint, detail, {
        state: "error",
        error: publicErrorMessage(error.message || "Sell failed")
      });
      clearTradeActionLater("trade-sell", form.tokenMint, detail, 4000);
    }
    recordPerfEvent({
      component: "manual-sell",
      action: "manual-sell-error",
      durationMs: perfNow() - clickStartedAt,
      requestId: manualSellAttemptId,
      errorCode: error?.code || error?.name || "MANUAL_SELL_FAILED",
      details: publicErrorMessage(error.message || "Sell failed")
    });
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
    queuePostTradeRefresh(data.trade?.signature, "trade-plan");
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "volume-plan");
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "sniper-entry");
    state.activeTab = "sniper";
    render();
  } catch (error) {
    setSniperStatus(error.message);
  }
}

function readOgreAiForm() {
  const walletIndexes = checkedWalletIndexes("ogre-ai");
  const walletGroup = $("[data-ogre-ai-group]")?.value?.trim() || "";
  const amountSol = $("[data-ogre-ai-amount]")?.value?.trim() || "";
  const mode = $("[data-ogre-ai-mode]")?.value || "quick";
  const runCount = $("[data-ogre-ai-runs]")?.value || "1";
  const sellDelay = fieldValue("[data-ogre-ai-delay]", "[data-ogre-ai-delay-custom]", "5");
  const takeProfitPct = fieldValue("[data-ogre-ai-tp]", "[data-ogre-ai-tp-custom]", "25");
  const stopLossPct = fieldValue("[data-ogre-ai-sl]", "[data-ogre-ai-sl-custom]", "8");
  const slippageBps = fieldValue("[data-ogre-ai-slippage]", "[data-ogre-ai-slippage-custom]", "400");
  const minScore = $("[data-ogre-ai-min-score]")?.value?.trim() || "";
  if (!walletIndexes.length && !walletGroup) throw new Error("Choose at least one managed wallet or enter a group label.");
  if (!amountSol) throw new Error("Enter SOL per wallet for Ogre A.I.");
  return {
    walletIndexes,
    walletGroup,
    mode,
    amountSol,
    runCount,
    sellDelay,
    takeProfitPct,
    stopLossPct,
    sellPercent: "100",
    slippageBps,
    minScore
  };
}

function setOgreAiStatus(message) {
  state.ogreAiStatus = message || "";
  const status = $("[data-ogre-ai-status]");
  writeText(status, state.ogreAiStatus);
}

async function startOgreAiRun() {
  if (ogreAiRunInFlight) {
    setOgreAiStatus("Ogre A.I. is already scanning. Please wait for completion.");
    return;
  }
  const runToken = Symbol("ogre-ai-run");
  try {
    const payload = readOgreAiForm();
    state.ogreAiLoading = true;
    ogreAiRunInFlight = runToken;
    setOgreAiStatus("Scanning live feeds and arming managed exits...");
    render();
    const data = await api("/api/web/ogre-ai/start", {
      method: "POST",
      body: JSON.stringify(payload),
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS
    });
    state.ogreAiResult = data.ogreAi;
    state.tradePlanResult = data.ogreAi?.plans?.[0] || state.tradePlanResult;
    setOgreAiStatus(data.ogreAi?.message || "Ogre A.I. run armed.");
    queuePostTradeRefresh(firstResultSignature(data.ogreAi?.plans?.[0]), "ogre-ai-run");
    state.activeTab = "ogreAi";
    render();
  } catch (error) {
    setOgreAiStatus(error.message);
    setError(error.message);
  } finally {
    state.ogreAiLoading = false;
    if (ogreAiRunInFlight === runToken) ogreAiRunInFlight = null;
    render();
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "kol-copy-plan");
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
  const clickStartedAt = perfNow();
  let payload = null;
  let tradeAttemptId = "";
  const actionName = action === "buy" ? "bundle-buy" : "bundle-sell";
  try {
    payload = readBundleForm();
    const active = activeTradeAction(actionName, payload.tokenMint, "bundle");
    if (active) {
      recordPerfEvent({
        component: "post-trade",
        action: "trade-action-dedupe",
        durationMs: perfNow() - clickStartedAt,
        cacheHit: true,
        requestId: active.tradeAttemptId || "",
        details: `${actionName}:${shortAddress(payload.tokenMint)}`
      });
      return;
    }
    tradeAttemptId = createClientAttemptId(actionName);
    setTradeAction(actionName, payload.tokenMint, "bundle", {
      state: "clicked",
      tradeAttemptId,
      clickedAt: new Date().toISOString()
    });
    recordPerfEvent({
      component: "post-trade",
      action: "trade-click-to-ui",
      durationMs: perfNow() - clickStartedAt,
      requestId: tradeAttemptId,
      details: `${actionName}:${shortAddress(payload.tokenMint)}`
    });
    render();
    setBundleStatus(action === "buy" ? "Sending bundle buy..." : "Sending bundle sell...");
    await sleep(20);
    const requestStartedAt = perfNow();
    setTradeAction(actionName, payload.tokenMint, "bundle", { state: "submitting" });
    const data = await api(`/api/web/bundle/${action}`, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        tradeAttemptId,
        clientClickToUiMs: Math.round(requestStartedAt - clickStartedAt)
      }),
      dedupe: false
    });
    recordPerfEvent({
      component: "post-trade",
      action: "trade-backend-ack",
      durationMs: perfNow() - requestStartedAt,
      requestId: tradeAttemptId,
      resultCount: data.bundle?.successCount || 0,
      details: actionName
    });
    state.bundleResult = data.bundle;
    setTradeAction(actionName, payload.tokenMint, "bundle", {
      state: "submitted",
      signature: firstResultSignature(data.bundle)
    });
    queuePostTradeRefresh(firstResultSignature(data.bundle), `bundle-${action}`, { tradeAttemptId });
    state.activeTab = "bundle";
    render();
    clearTradeActionLater(actionName, payload.tokenMint, "bundle", 3000);
  } catch (error) {
    if (payload?.tokenMint) {
      setTradeAction(actionName, payload.tokenMint, "bundle", {
        state: "error",
        error: publicErrorMessage(error.message || "Bundle trade failed")
      });
      clearTradeActionLater(actionName, payload.tokenMint, "bundle", 4000);
    }
    recordPerfEvent({
      component: "post-trade",
      action: "trade-action-error",
      durationMs: perfNow() - clickStartedAt,
      requestId: tradeAttemptId,
      errorCode: error?.code || error?.name || "BUNDLE_TRADE_FAILED",
      details: publicErrorMessage(error.message || "Bundle trade failed")
    });
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "bundle-plan");
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

function tokenRefFromMint(tokenMint = "", extra = {}) {
  const mint = String(tokenMint || "").trim();
  const row = mint
    ? allVisibleSignalRows().find((item) => String(item?.tokenMint || "") === mint)
    : null;
  return {
    chain: "solana",
    tokenMint: mint,
    tokenAddress: mint,
    mint,
    pairAddress: row?.pairAddress || row?.pairId || extra.pairAddress || "",
    symbol: row?.symbol || extra.symbol || shortAddress(mint),
    name: row?.name || extra.name || "Token",
    imageUri: row?.imageUrl || extra.imageUri || "",
    source: extra.source || row?.source || row?.category || "",
    dex: row?.dexId || extra.dex || "",
    pool: row?.pool || extra.pool || "",
    pumpUrl: row?.pumpUrl || extra.pumpUrl || "",
    isPump: Boolean(row?.isPump || extra.isPump || mint.toLowerCase().endsWith("pump")),
    graduated: Boolean(row?.graduated || row?.isGraduated || row?.bonded || row?.isBonded || extra.graduated || extra.isGraduated || extra.bonded || extra.isBonded),
    isGraduated: Boolean(row?.isGraduated || row?.graduated || row?.bonded || row?.isBonded || extra.isGraduated || extra.graduated || extra.bonded || extra.isBonded),
    bonded: Boolean(row?.bonded || row?.isBonded || row?.graduated || row?.isGraduated || extra.bonded || extra.isBonded || extra.graduated || extra.isGraduated),
    isBonded: Boolean(row?.isBonded || row?.bonded || row?.graduated || row?.isGraduated || extra.isBonded || extra.bonded || extra.graduated || extra.isGraduated)
  };
}

function tokenRefFromRow(row = {}, extra = {}) {
  return tokenRefFromMint(row?.tokenMint || row?.mint || row?.tokenAddress || "", {
    ...extra,
    pairAddress: row?.pairAddress || row?.pairId || extra.pairAddress || "",
    symbol: row?.symbol || extra.symbol || "",
    name: row?.name || extra.name || "",
    imageUri: row?.imageUrl || row?.imageUri || extra.imageUri || "",
    source: extra.source || row?.source || row?.category || "",
    dex: row?.dexId || extra.dex || "",
    pool: row?.pool || extra.pool || "",
    pumpUrl: row?.pumpUrl || extra.pumpUrl || "",
    isPump: row?.isPump || extra.isPump,
    graduated: row?.graduated || row?.isGraduated || row?.bonded || row?.isBonded || extra.graduated || extra.isGraduated || extra.bonded || extra.isBonded,
    isGraduated: row?.isGraduated || row?.graduated || row?.bonded || row?.isBonded || extra.isGraduated || extra.graduated || extra.bonded || extra.isBonded,
    bonded: row?.bonded || row?.isBonded || row?.graduated || row?.isGraduated || extra.bonded || extra.isBonded || extra.graduated || extra.isGraduated,
    isBonded: row?.isBonded || row?.bonded || row?.graduated || row?.isGraduated || extra.isBonded || extra.bonded || extra.graduated || extra.isGraduated
  });
}

function applyTokenRefToState(tokenRef = {}) {
  const mint = String(tokenRef.tokenMint || tokenRef.mint || tokenRef.tokenAddress || "").trim();
  if (!mint) return "";
  state.smartChartTokenRef = {
    ...tokenRef,
    tokenMint: mint,
    tokenAddress: mint,
    mint
  };
  rememberSmartChartDexResolution(state.smartChartTokenRef);
  state.terminalToken = mint;
  state.terminalAutoToken = mint;
  state.tradeToken = mint;
  state.bundleToken = mint;
  state.volumeToken = mint;
  state.smartChartToken = mint;
  return mint;
}

function buildTokenChartPath(mint, options = {}) {
  const params = new URLSearchParams();
  params.set("token", mint);
  const tab = options.defaultTab === "sell" ? "sell" : options.defaultTab === "chart" ? "chart" : "buy";
  params.set("tab", tab);
  if (["chart", "chartTxns", "txns", "info"].includes(options.view)) params.set("view", options.view);
  if (options.focusAmountInput) params.set("focusAmount", "1");
  if (options.source) params.set("source", String(options.source).slice(0, 40));
  if (options.returnTo) params.set("returnTo", options.returnTo);
  return `/terminal/chart?${params.toString()}`;
}

function isUnbondedPumpToken(row = {}) {
  const mint = String(row?.tokenMint || row?.mint || row?.tokenAddress || "").trim();
  const text = `${row?.source || ""} ${row?.category || ""} ${row?.dex || ""} ${row?.pool || ""}`.toLowerCase();
  const isPump = Boolean(row?.isPump || row?.pumpUrl || mint.toLowerCase().endsWith("pump") || text.includes("pump"));
  const bonded = Boolean(row?.graduated || row?.isGraduated || row?.bonded || row?.isBonded || row?.complete || row?.completed || row?.bondingComplete || row?.raydiumPool || row?.poolAddress);
  return Boolean(isPump && !bonded);
}

function preferredSmartChartView(tokenRef = {}, options = {}) {
  if (["chart", "chartTxns", "txns", "info"].includes(options.view)) return options.view;
  if (options.defaultTab === "chart" && isUnbondedPumpToken(tokenRef)) return "chartTxns";
  return "chart";
}

function openTokenChart(tokenRef = {}, options = {}) {
  perfMark("chartRouteStart");
  const routeStartedAt = perfNow();
  const mint = applyTokenRefToState(tokenRef);
  if (!mint) {
    setError("Select a token before opening the chart.");
    return;
  }
  prefetchTokenChart(tokenRef, { source: options.source || "token-entry" });
  state.chartTradeTab = options.defaultTab === "sell" ? "sell" : options.defaultTab === "chart" ? "buy" : "buy";
  state.smartChartView = preferredSmartChartView(state.smartChartTokenRef || tokenRef, options);
  state.chartFocusAmountInput = Boolean(options.focusAmountInput);
  state.chartScrollIntoView = true;
  state.activeTab = "smartChart";
  state.route = "terminal";
  state.quickBuyModal = { ...state.quickBuyModal, open: false, status: "", error: "" };
  const path = buildTokenChartPath(mint, {
    defaultTab: options.defaultTab || "buy",
    view: state.smartChartView,
    focusAmountInput: options.focusAmountInput,
    source: options.source || "token-entry",
    returnTo: options.returnTo || currentReturnPath()
  });
  window.history.pushState({}, "", path);
  render({ force: true });
  perfMeasure("chart-route-open", routeStartedAt, {
    component: "smartChart",
    cacheHit: Boolean(smartChartBootstrapForMint(mint)?.cacheHit || smartChartResolvedDex(mint)?.pairAddress),
    details: `${mint}:${options.source || "token-entry"}`
  });
}

function applyChartRouteFromLocation() {
  if (!window.location.pathname.includes("/terminal/chart")) return;
  perfMark("chartRouteStart");
  const routeStartedAt = perfNow();
  const params = new URLSearchParams(window.location.search || "");
  const token = String(params.get("token") || params.get("mint") || "").trim();
  if (token) {
    const tokenRef = tokenRefFromMint(token, { source: params.get("source") || "route" });
    applyTokenRefToState(tokenRef);
    prefetchTokenChart(tokenRef, { source: params.get("source") || "route" });
  }
  state.chartTradeTab = params.get("tab") === "sell" ? "sell" : "buy";
  state.smartChartView = ["chartTxns", "txns", "info"].includes(params.get("view")) ? params.get("view") : "chart";
  state.chartFocusAmountInput = params.get("focusAmount") === "1";
  state.chartScrollIntoView = true;
  state.route = "terminal";
  state.activeTab = "smartChart";
  perfMeasure("chart-route-apply", routeStartedAt, {
    component: "smartChart",
    cacheHit: Boolean(smartChartBootstrapForMint(token)?.cacheHit || smartChartResolvedDex(token)?.pairAddress),
    details: token
  });
}

function openQuickBuy(tokenRef = {}, options = {}) {
  const mint = applyTokenRefToState(tokenRef);
  if (!mint) {
    setError("Select a token before quick buying.");
    return;
  }
  const rawRow = rawSignalRowForMint(mint);
  if (rawRow && isUiBlockedSignalRow(rawRow)) {
    setError("Safety block: this token has mintable/freezable/honeypot-style risk signals and cannot be quick bought.");
    return;
  }
  const preset = options.preset || activeTradePreset();
  const amount = preset && !options.forceModal ? activeQuickBuyAmount(preset) : "";
  const hasPresetWallet = preset?.walletIndex || (preset?.walletIndexes || [])[0];
  if (preset && amount && hasPresetWallet && !options.forceModal) {
    void quickPresetTrade(mint, options.preset || null);
    return;
  }
  const connected = connectedBrowserWallet();
  state.quickBuyModal = {
    open: true,
    tokenMint: mint,
    amountSol: amount || state.quickBuyAmountOverride || "",
    walletIndex: connected?.publicKey ? "connected" : (state.wallets[0]?.index ? String(state.wallets[0].index) : ""),
    slippageBps: "400",
    status: amount ? `Preset ${amount} SOL loaded. Confirm when ready.` : "Enter a SOL amount to quick buy.",
    source: options.source || "quick-buy",
    error: "",
    tradeAttemptId: ""
  };
  render({ force: true });
  requestAnimationFrame(() => $("[data-quick-buy-modal-amount]")?.focus());
}

function closeQuickBuyModal() {
  state.quickBuyModal = { ...state.quickBuyModal, open: false, status: "", error: "" };
  render({ force: true });
}

function readQuickBuyModalForm() {
  const tokenMint = String(state.quickBuyModal?.tokenMint || "").trim();
  const walletIndex = String($("[data-quick-buy-modal-wallet]")?.value || state.quickBuyModal?.walletIndex || "").trim();
  const amountSol = normalizedQuickBuyAmount($("[data-quick-buy-modal-amount]")?.value || state.quickBuyModal?.amountSol || "");
  const slippageBps = String($("[data-quick-buy-modal-slippage]")?.value || state.quickBuyModal?.slippageBps || "400").trim();
  if (!tokenMint) throw new Error("Select a token before quick buying.");
  if (!walletIndex) throw new Error("Choose a wallet before quick buying.");
  if (!amountSol) throw new Error("Enter a SOL amount greater than zero.");
  return { tokenMint, walletIndex, amountSol, slippageBps };
}

async function executeQuickBuyAmount({ tokenMint, walletIndex, amountSol, slippageBps = "400", source = "quick-buy" }) {
  const value = Number(amountSol);
  if (!Number.isFinite(value) || value <= 0) throw new Error("Enter a SOL amount greater than zero.");
  const tradeAttemptId = createClientAttemptId("quick-buy");
  state.quickBuyLast = {
    source,
    tokenMint,
    walletConnected: isConnectedTradeWallet(walletIndex),
    customAmountValid: true,
    presetAmount: "",
    tradeAttemptId,
    status: "submitting",
    error: ""
  };
  setTradeAction("trade-buy", tokenMint, String(amountSol), {
    state: "clicked",
    tradeAttemptId,
    clickedAt: new Date().toISOString()
  });
  state.quickBuyModal = {
    ...state.quickBuyModal,
    status: "Submitting quick buy...",
    error: "",
    tradeAttemptId
  };
  render({ force: true });
  await sleep(20);

  const form = { tokenMint, walletIndex, slippageBps };
  if (isConnectedTradeWallet(walletIndex)) {
    const trade = await executeConnectedBrowserTrade({
      side: "buy",
      form,
      actionDetail: String(amountSol),
      amountSol: String(value),
      amountMode: "fixed",
      attemptId: tradeAttemptId
    });
    state.quickBuyLast = { ...state.quickBuyLast, status: "submitted" };
    return trade;
  }

  const data = await api("/api/web/trade/buy", {
    method: "POST",
    body: JSON.stringify({
      tokenMint,
      walletIndex,
      amountSol: String(value),
      slippageBps,
      tradeAttemptId
    }),
    dedupe: false,
    timeoutMs: API_LONG_ACTION_TIMEOUT_MS
  });
  state.tradeResult = data.trade;
  queuePostTradeRefresh(data.trade?.signature, "quick-buy-custom", { tradeAttemptId });
  setTradeAction("trade-buy", tokenMint, String(amountSol), {
    state: "submitted",
    signature: data.trade?.signature || ""
  });
  state.quickBuyLast = { ...state.quickBuyLast, status: "submitted" };
  return data.trade;
}

async function confirmQuickBuyModal() {
  try {
    const form = readQuickBuyModalForm();
    state.quickBuyModal = { ...state.quickBuyModal, ...form, status: "Validating quick buy...", error: "" };
    const trade = await executeQuickBuyAmount({ ...form, source: state.quickBuyModal?.source || "quick-buy-modal" });
    state.quickBuyModal = {
      ...state.quickBuyModal,
      open: false,
      status: trade?.message || "Quick buy submitted.",
      error: ""
    };
    state.activeTab = "smartChart";
    render({ force: true });
    clearTradeActionLater("trade-buy", form.tokenMint, form.amountSol, 3000);
  } catch (error) {
    state.quickBuyLast = {
      ...(state.quickBuyLast || {}),
      status: "failed",
      error: publicErrorMessage(error.message || "Quick buy failed.")
    };
    state.quickBuyModal = {
      ...state.quickBuyModal,
      status: "",
      error: publicErrorMessage(error.message || "Quick buy failed.")
    };
    render({ force: true });
  }
}

async function quickPresetTrade(tokenMint, presetOverride = null) {
  const clickStartedAt = perfNow();
  const preset = presetOverride || presetById("trade", state.selectedTradePresetId);
  let actionDetail = "quick";
  if (!preset) {
    openQuickBuy(tokenRefFromMint(tokenMint, { source: "missing-preset" }), {
      source: "missing-preset",
      forceModal: true
    });
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
    actionDetail = String(amountSol);
    const active = activeTradeAction("trade-buy", tokenMint, actionDetail);
    if (active) {
      recordPerfEvent({
        component: "post-trade",
        action: "trade-action-dedupe",
        durationMs: perfNow() - clickStartedAt,
        cacheHit: true,
        requestId: active.tradeAttemptId || "",
        details: `quick-preset:${shortAddress(tokenMint)}:${amountSol}`
      });
      return;
    }
    const tradeAttemptId = createClientAttemptId("quick-trade");
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
    setTradeAction("trade-buy", tokenMint, actionDetail, {
      state: "clicked",
      tradeAttemptId,
      clickedAt: new Date().toISOString()
    });
    setError("");
    state.tradeToken = tokenMint;
    render();
    await sleep(20);
    const requestStartedAt = perfNow();
    setTradeAction("trade-buy", tokenMint, actionDetail, { state: "submitting" });
    const data = await api("/api/web/trade/buy", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        tradeAttemptId,
        clientClickToUiMs: Math.round(requestStartedAt - clickStartedAt)
      }),
      dedupe: false,
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS
    });
    state.tradeResult = data.trade;
    if (data.trade?.autoExitPlan) {
      state.tradePlanResult = data.trade.autoExitPlan;
      setError(data.trade.autoExitPlan.shortMessage || "Quick buy landed and auto-exit is armed.");
      scheduleAutoExitChecks();
    } else if (data.trade?.autoExitRequested) {
      setError("Quick buy landed, but auto-exit was not armed. Use Positions to exit manually or create a managed plan.");
    }
    state.tradeToken = tokenMint;
    setTradeAction("trade-buy", tokenMint, actionDetail, {
      state: "submitted",
      signature: data.trade?.signature || ""
    });
    queuePostTradeRefresh(data.trade?.signature, "quick-preset-trade", { tradeAttemptId });
    state.activeTab = "trade";
    render();
    clearTradeActionLater("trade-buy", tokenMint, actionDetail, 3000);
  } catch (error) {
    if (tokenMint) {
      setTradeAction("trade-buy", tokenMint, actionDetail, {
        state: "error",
        error: publicErrorMessage(error.message || "Quick buy failed")
      });
      clearTradeActionLater("trade-buy", tokenMint, actionDetail, 4000);
    }
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
      amountSol: presetOverride
        ? (normalizedQuickBuyAmount(preset.amountSol) || "0.1")
        : activeBundleQuickBuyAmount(preset),
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
    queuePostTradeRefresh(firstResultSignature(data.plan), "quick-preset-bundle");
    state.activeTab = "bundle";
    render();
  } catch (error) {
    setError(error.message);
  }
}

async function sellPositionPercent(tokenMint, percentText = "100") {
  const clickStartedAt = perfNow();
  let percent = Number.parseInt(percentText, 10);
  let manualSellAttemptId = "";
  try {
    await ensureWebAccount(null, "Opening secure web profile...");
    if (!tokenMint) throw new Error("Missing token mint for position exit.");
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) throw new Error("Sell percent must be from 1 to 100.");
    const active = activeManualSellAction(tokenMint, String(percent));
    if (active) {
      recordPerfEvent({
        component: "manual-sell",
        action: "manual-sell-dedupe",
        durationMs: perfNow() - clickStartedAt,
        cacheHit: true,
        requestId: active.manualSellAttemptId || "",
        details: `${shortAddress(tokenMint)}:${percent}`
      });
      return;
    }
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
    manualSellAttemptId = createClientAttemptId("manual-sell");
    setManualSellAction(tokenMint, String(percent), {
      state: "clicked",
      manualSellAttemptId,
      clickedAt: new Date().toISOString()
    });
    recordPerfEvent({
      component: "manual-sell",
      action: "manual-sell-click-to-ui",
      durationMs: perfNow() - clickStartedAt,
      requestId: manualSellAttemptId,
      details: `${shortAddress(tokenMint)}:${percent}`
    });
    state.activeTab = "positions";
    setError("");
    render();
    await sleep(20);
    const requestStartedAt = perfNow();
    setManualSellAction(tokenMint, String(percent), { state: "submitting" });
    const data = await api("/api/web/bundle/sell", {
      method: "POST",
      body: JSON.stringify({
        tokenMint,
        walletIndexes: "all",
        percent,
        slippageBps: "400",
        manualSellAttemptId,
        clientClickToUiMs: Math.round(requestStartedAt - clickStartedAt)
      }),
      timeoutMs: API_LONG_ACTION_TIMEOUT_MS,
      dedupe: false
    });
    recordPerfEvent({
      component: "manual-sell",
      action: "manual-sell-request",
      durationMs: perfNow() - requestStartedAt,
      requestId: manualSellAttemptId,
      resultCount: data.bundle?.successCount || 0,
      details: data.bundle?.duplicate ? "duplicate" : "submitted"
    });
    state.bundleResult = data.bundle;
    state.bundleToken = tokenMint;
    state.tradeToken = tokenMint;
    setManualSellAction(tokenMint, String(percent), {
      state: data.bundle?.duplicate ? "submitted" : "submitted",
      signature: firstResultSignature(data.bundle),
      backendMs: data.bundle?.manualSellTiming?.backendMs || null
    });
    queuePostTradeRefresh(firstResultSignature(data.bundle), "manual-sell-position");
    state.activeTab = "positions";
    render();
    clearManualSellActionLater(tokenMint, String(percent), 3_000);
  } catch (error) {
    if (tokenMint && Number.isInteger(percent)) {
      setManualSellAction(tokenMint, String(percent), {
        state: "error",
        error: publicErrorMessage(error.message || "Sell failed")
      });
      clearManualSellActionLater(tokenMint, String(percent), 4_000);
    }
    recordPerfEvent({
      component: "manual-sell",
      action: "manual-sell-error",
      durationMs: perfNow() - clickStartedAt,
      requestId: manualSellAttemptId,
      errorCode: error?.code || error?.name || "MANUAL_SELL_FAILED",
      details: publicErrorMessage(error.message || "Sell failed")
    });
    setError(error.message);
    render();
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

function walletSweepToolsHtml() {
  return `
    <section class="account-check-card wallet-sweep-card wallet-command-card">
      <div>
        <h3>Sweep / Exit / Recover</h3>
        <p>Sell or transfer from saved managed wallets, then send SOL or tokens to any wallet address you paste.</p>
      </div>
      <label>Wallet numbers
        <input data-wallet-sweep-indexes value="all" placeholder="all or 1,2,3">
      </label>
      <label>Group label
        <input data-wallet-sweep-group placeholder="Optional group name">
      </label>
      <label>Destination wallet
        <input data-wallet-sweep-destination placeholder="Wallet to receive SOL or tokens">
      </label>
      <label>Token mint
        <input data-wallet-sweep-token placeholder="Optional: leave blank for all tokens">
      </label>
      <label>Sell slippage bps
        <input data-wallet-sweep-slippage type="number" min="50" max="5000" step="50" value="1500">
      </label>
      <div class="card-actions compact">
        <button class="primary" data-wallet-sweep-action="sell-all-sweep">Sell All + Send SOL</button>
        <button data-wallet-sweep-action="sell-all">Sell All Tokens</button>
        <button data-wallet-sweep-action="sweep-sol">Sweep SOL</button>
        <button data-wallet-sweep-action="sweep-tokens">Send Tokens</button>
      </div>
      <small>Use Sell All + Send SOL to exit tokens across selected wallets and drain SOL to one destination. Token transfer keeps tokens as tokens. Browser-only wallets still require wallet approval and are not swept by this managed-wallet tool.</small>
      <small data-wallet-sweep-status>${escapeHtml(state.walletSweepStatus || "")}</small>
    </section>
    <section class="account-check-card wallet-sweep-card wallet-command-card">
      <div>
        <h3>Fund / Split SOL</h3>
        <p>Fund many wallets from one managed source wallet. Paste any destination wallets, one per line.</p>
      </div>
      <label>Source wallet #
        <input data-wallet-send-from type="number" min="1" step="1" value="1">
      </label>
      <label>Amount per wallet
        <input data-wallet-send-amount inputmode="decimal" placeholder="0.05">
      </label>
      <label>Managed destination wallet numbers
        <input data-wallet-send-managed-targets placeholder="all or 2,3,4">
      </label>
      <label>Managed destination group
        <input data-wallet-send-group placeholder="Optional group name">
      </label>
      <label class="inline-check">
        <input data-wallet-send-all type="checkbox">
        Split available SOL evenly
      </label>
      <label>Destination wallets
        <textarea data-wallet-send-destinations rows="4" placeholder="One wallet per line"></textarea>
      </label>
      <div class="card-actions compact">
        <button class="primary" data-wallet-sweep-action="send-sol-many">Fund Wallets</button>
      </div>
      <small>Use managed destination numbers/groups to fund saved wallets, or paste outside wallets. Split mode keeps the configured safety reserve and estimated network fees in the source wallet.</small>
    </section>
  `;
}

function walletsHtml() {
  const create = `${walletSweepToolsHtml()}${createWalletSection()}${importWalletSection()}${backupRestoreSection()}${downloadsHtml()}`;
  const walletTools = `
    <details class="wallet-tools-details" open>
      <summary>
        <span>Sweep / Fund / Backup / Import</span>
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
        <button type="button" data-connect-wallet="solana">Reconnect</button>
        <button type="button" data-disconnect-wallet>Disconnect</button>
        <button data-tab="txAudit">Tx Audit</button>
        <a href="https://solscan.io/account/${encodeURIComponent(connected.publicKey)}" target="_blank" rel="noreferrer">Solscan</a>
      </div>
    </section>
  `;
}

function walletBalanceSummaryHtml() {
  const tokenTotal = state.balances.reduce((sum, row) => sum + Number(row.tokens?.length || 0), 0) + connectedWalletTokenRows().length;
  const errorCount = state.balances.filter((row) => row.error).length;
  return `
    <section class="pnl-summary wallet-summary">
      <div><span>Wallets</span><strong>${portfolioWalletCount()}</strong></div>
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
  const rows = portfolioPositions();
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
  if (!rows.length) return `${header}${emptyState("No open positions", "Current token holdings will show here after a wallet holds non-zero tokens.")}`;
  return `
    ${header}
    <div class="table-list">
      ${rows.map(positionRowHtml).join("")}
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
  return visibleSignalRowsFromRawRows(allRawSignalRows());
}

function allRawSignalRows() {
  const liveRows = Object.values(state.livePairsByBucket || {}).flatMap((feed) => feed?.rows || []);
  const scanRows = state.scan?.rows || [];
  const kolRows = state.kolScan?.rows || [];
  const watchRows = state.watchlist?.rows || [];
  return [...liveRows, ...scanRows, ...kolRows, ...watchRows];
}

function rawSignalRowForMint(tokenMint = "") {
  const mint = String(tokenMint || "");
  if (!mint) return null;
  return allRawSignalRows().find((row) => String(row?.tokenMint || "") === mint) || null;
}

function blockRawSignalTokenIfUnsafe(tokenMint = "") {
  const row = rawSignalRowForMint(tokenMint);
  if (!row || !isUiBlockedSignalRow(row)) return false;
  setError("Safety block: this feed token has mintable/freezable/honeypot-style risk signals.");
  return true;
}

function visibleSignalRowsFromRawRows(rows = []) {
  const byMint = new Map();
  for (const row of rows || []) {
    if (isUiFeedDisplayBlockedSignalRow(row)) continue;
    const mint = String(row?.tokenMint || "");
    if (mint && !byMint.has(mint)) byMint.set(mint, row);
  }
  return [...byMint.values()];
}

function uniqueSignalRows(rows = []) {
  const byMint = new Map();
  for (const row of rows || []) {
    if (isUiFeedDisplayBlockedSignalRow(row)) continue;
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

function isUiBlockedSignalRow(row = {}) {
  if (isUiMayhemRow(row)) return true;
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
    row?.labels,
    row?.riskFlags,
    row?.bestPickWarnings,
    row?.scoreWarnings,
    row?.safetyNote,
    row?.tokenProgram,
    row?.mintAuthority ? "mint authority" : "",
    row?.freezeAuthority ? "freeze authority" : ""
  ].flat().filter(Boolean).join(" ").toLowerCase();
  if (/\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|token-2022)\b/i.test(labels)) {
    return true;
  }
  const marketCap = firstUsefulNumber(row.marketCap, row.fdv);
  const liquidityUsd = firstUsefulNumber(row.liquidityUsd);
  return marketCap >= 100_000_000 && (!liquidityUsd || liquidityUsd / marketCap < 0.01);
}

function isUiFeedDisplayBlockedSignalRow(row = {}) {
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
    row?.labels,
    row?.riskFlags,
    row?.bestPickWarnings,
    row?.scoreWarnings,
    row?.safetyNote
  ].flat().filter(Boolean).join(" ").toLowerCase();
  if (/\b(honeypot|honey\s*pot|blacklist|rug|scam)\b/i.test(labels)) {
    return true;
  }
  const marketCap = firstUsefulNumber(row.marketCap, row.fdv);
  const liquidityUsd = firstUsefulNumber(row.liquidityUsd);
  return marketCap >= 100_000_000 && (!liquidityUsd || liquidityUsd / marketCap < 0.01);
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
  const savedRef = state.smartChartTokenRef || null;
  const rowForMint = (mint) => allRows.find((row) => String(row.tokenMint || "") === mint) || {
    ...(String(savedRef?.tokenMint || "") === mint ? savedRef : {}),
    tokenMint: mint,
    shortMint: shortAddress(mint),
    symbol: savedRef?.symbol || shortAddress(mint),
    name: savedRef?.name || "Custom Token",
    imageUrl: savedRef?.imageUrl || savedRef?.imageUri || "",
    pairAddress: savedRef?.pairAddress || savedRef?.pairId || "",
    dexUrl: savedRef?.dexUrl || dexUrl(savedRef?.pairAddress || mint),
    pumpUrl: mint.toLowerCase().endsWith("pump") ? `https://pump.fun/coin/${encodeURIComponent(mint)}` : ""
  };
  const explicitMint = String(state.smartChartToken || state.terminalToken || state.tradeToken || "").trim();
  if (explicitMint) return mergeSmartChartDexResolution(rowForMint(explicitMint));
  return mergeSmartChartDexResolution(selectedTerminalTokenRow());
}

function chartAddressForToken(tokenOrMint = {}) {
  if (typeof tokenOrMint === "string") return String(tokenOrMint || "").trim();
  return String(
    tokenOrMint?.pairAddress
    || tokenOrMint?.pairId
    || tokenOrMint?.dexPair?.pairAddress
    || tokenOrMint?.dexPair?.pairId
    || tokenOrMint?.tokenMint
    || tokenOrMint?.mint
    || ""
  ).trim();
}

const SMART_CHART_DEX_RESOLVE_TTL_MS = 5 * 60 * 1000;
const SMART_CHART_DEX_RESOLVE_RETRY_MS = 45 * 1000;
const SMART_CHART_BOOTSTRAP_TTL_MS = 10 * 60 * 1000;
const SMART_CHART_INTERACTION_PREFETCH_MIN_INTERVAL_MS = 700;
const SMART_CHART_INTERACTION_PREFETCH_WINDOW_MS = 6_000;
const SMART_CHART_INTERACTION_PREFETCH_MAX_PER_WINDOW = 4;
const SMART_CHART_INTERACTION_PREFETCH_SAME_MINT_MS = 30_000;

function smartChartBootstrapForMint(tokenMint = "") {
  const mint = String(tokenMint || "").trim();
  if (!mint) return null;
  const cached = state.smartChartBootstrap?.[mint] || null;
  if (!cached) return null;
  const ageMs = Date.now() - Number(cached.loadedAt || cached.resolvedAt || 0);
  if (cached.status === "failed") return ageMs < SMART_CHART_DEX_RESOLVE_RETRY_MS ? cached : null;
  return ageMs < SMART_CHART_BOOTSTRAP_TTL_MS ? cached : null;
}

function smartChartResolvedDex(tokenMint = "") {
  const mint = String(tokenMint || "").trim();
  const cached = mint ? (state.smartChartDexResolution?.[mint] || smartChartBootstrapForMint(mint)) : null;
  if (!cached) return null;
  const ageMs = Date.now() - Number(cached.resolvedAt || 0);
  if (cached.status === "failed") return ageMs < SMART_CHART_DEX_RESOLVE_RETRY_MS ? cached : null;
  return ageMs < SMART_CHART_DEX_RESOLVE_TTL_MS ? cached : null;
}

function mergeSmartChartDexResolution(row = null) {
  if (!row) return row;
  const mint = String(row.tokenMint || row.mint || row.tokenAddress || "").trim();
  const resolved = smartChartResolvedDex(mint);
  if (!resolved || resolved.status === "failed") return row;
  return {
    ...row,
    pairAddress: row.pairAddress || resolved.pairAddress || "",
    pairId: row.pairId || resolved.pairAddress || "",
    dexUrl: row.dexUrl || resolved.dexUrl || resolved.pairUrl || "",
    dexId: row.dexId || resolved.dexId || "",
    dexName: row.dexName || resolved.dexName || resolved.dexId || "",
    symbol: row.symbol || resolved.symbol || shortAddress(mint),
    name: row.name || resolved.name || "Token",
    imageUrl: row.imageUrl || resolved.imageUrl || "",
    marketCap: row.marketCap || resolved.marketCap || 0,
    fdv: row.fdv || resolved.fdv || 0,
    liquidityUsd: row.liquidityUsd || resolved.liquidityUsd || 0,
    volume: row.volume || resolved.volume || null,
    txns: row.txns || resolved.txns || null
  };
}

function rememberSmartChartBootstrap(chart = {}) {
  const mint = String(chart.tokenMint || chart.tokenAddress || chart.mint || "").trim();
  if (!mint) return;
  const loadedAt = Date.now();
  const nextChart = {
    ...chart,
    tokenMint: mint,
    tokenAddress: mint,
    status: chart.errorCode ? "failed" : "resolved",
    loadedAt,
    resolvedAt: loadedAt
  };
  state.smartChartBootstrap = {
    ...(state.smartChartBootstrap || {}),
    [mint]: nextChart
  };
  if (nextChart.pairAddress || nextChart.dexUrl || nextChart.symbol || nextChart.name) {
    rememberSmartChartDexResolution({
      ...nextChart,
      mint,
      imageUri: nextChart.imageUrl || nextChart.imageUri || "",
      dex: nextChart.dexId || nextChart.dexName || ""
    });
  }
}

function rememberSmartChartDexResolution(tokenRef = {}) {
  const mint = String(tokenRef.tokenMint || tokenRef.mint || tokenRef.tokenAddress || "").trim();
  const pairAddress = String(tokenRef.pairAddress || tokenRef.pairId || "").trim();
  if (!mint || (!pairAddress && !tokenRef.dexUrl && !tokenRef.symbol && !tokenRef.name)) return;
  state.smartChartDexResolution = {
    ...(state.smartChartDexResolution || {}),
    [mint]: {
      ...(state.smartChartDexResolution?.[mint] || {}),
      tokenMint: mint,
      pairAddress,
      dexUrl: tokenRef.dexUrl || dexUrl(pairAddress || mint),
      dexId: tokenRef.dex || tokenRef.dexId || "",
      symbol: tokenRef.symbol || "",
      name: tokenRef.name || "",
      imageUrl: tokenRef.imageUri || tokenRef.imageUrl || "",
      status: "resolved",
      resolvedAt: Date.now()
    }
  };
}

function queueSmartChartDexResolution(token = {}) {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  if (!mint) return false;
  const pairAddress = String(token?.pairAddress || token?.pairId || "").trim();
  if (pairAddress) {
    rememberSmartChartDexResolution({ ...token, tokenMint: mint, pairAddress });
    return false;
  }
  if (smartChartBootstrapForMint(mint)?.pairAddress) return false;
  const cached = smartChartResolvedDex(mint);
  if (cached?.pairAddress) return false;
  if (cached?.status === "failed") return false;
  if (state.smartChartDexResolving?.[mint]) return true;
  state.smartChartDexResolving = { ...(state.smartChartDexResolving || {}), [mint]: true };
  window.setTimeout(() => {
    void resolveSmartChartDexPair(mint).catch(() => {});
  }, 0);
  return true;
}

function queueSmartChartBootstrap(token = {}, options = {}) {
  const mint = String(token?.tokenMint || token?.mint || token?.tokenAddress || state.smartChartToken || "").trim();
  if (!mint) return false;
  if (!options.force && smartChartBootstrapForMint(mint)?.status === "resolved") return false;
  if (state.smartChartBootstrapLoading?.[mint]) return true;
  state.smartChartBootstrapLoading = { ...(state.smartChartBootstrapLoading || {}), [mint]: true };
  window.setTimeout(() => {
    void resolveSmartChartDexPair(mint, { source: options.source || "chart-bootstrap" }).catch(() => {});
  }, 0);
  return true;
}

function prefetchTokenChart(tokenRef = {}, options = {}) {
  const mint = String(tokenRef?.tokenMint || tokenRef?.mint || tokenRef?.tokenAddress || "").trim();
  if (!mint) return false;
  rememberSmartChartDexResolution(tokenRef);
  queueSmartChartBootstrap(tokenRef, { source: options.source || "prefetch" });
  state.smartChartPrefetchLog = [
    ...(state.smartChartPrefetchLog || []),
    {
      at: new Date().toISOString(),
      tokenMint: mint,
      source: options.source || "prefetch",
      routeChunkPrefetched: true,
      metadataPrefetched: Boolean(tokenRef.symbol || tokenRef.name || tokenRef.imageUri || tokenRef.imageUrl),
      candlesPrefetched: false,
      dedupeHit: Boolean(state.smartChartBootstrapLoading?.[mint] || smartChartBootstrapForMint(mint)),
      cacheTtlMs: SMART_CHART_BOOTSTRAP_TTL_MS
    }
  ].slice(-20);
  return true;
}

async function resolveSmartChartDexPair(mint = "") {
  const tokenMint = String(mint || "").trim();
  if (!tokenMint) return null;
  try {
    const startedAt = perfNow();
    const data = await api(`/api/web/chart/bootstrap?token=${encodeURIComponent(tokenMint)}`, { timeoutMs: 4_500 });
    const resolved = data.chart || data.dexToken || {};
    rememberSmartChartBootstrap(resolved);
    perfMeasure("chart-bootstrap", startedAt, {
      component: "smartChart",
      cacheHit: Boolean(resolved.cacheHit),
      stale: Boolean(resolved.stale),
      details: `${tokenMint}:${resolved.chartProvider || "dexscreener-embed"}`
    });
    if (state.route === "terminal" && state.activeTab === "smartChart" && String(state.smartChartToken || "") === tokenMint) {
      render({ force: true });
    }
    return resolved;
  } catch (error) {
    state.smartChartDexResolution = {
      ...(state.smartChartDexResolution || {}),
      [tokenMint]: {
        tokenMint,
        status: "failed",
        error: publicErrorMessage(error?.message || "DEX pair lookup failed."),
        resolvedAt: Date.now()
      }
    };
    if (state.route === "terminal" && state.activeTab === "smartChart" && String(state.smartChartToken || "") === tokenMint) {
      render({ force: true });
    }
    return null;
  } finally {
    const nextResolving = { ...(state.smartChartDexResolving || {}) };
    delete nextResolving[tokenMint];
    state.smartChartDexResolving = nextResolving;
    const nextLoading = { ...(state.smartChartBootstrapLoading || {}) };
    delete nextLoading[tokenMint];
    state.smartChartBootstrapLoading = nextLoading;
  }
}

function dexChartEmbedUrl(tokenOrMint, options = {}) {
  const address = chartAddressForToken(tokenOrMint);
  const params = new URLSearchParams({
    embed: "1",
    theme: "dark",
    trades: options.trades ? "1" : "0",
    info: options.info ? "1" : "0"
  });
  return `https://dexscreener.com/solana/${encodeURIComponent(address)}?${params.toString()}`;
}

function smartChartFrameUrl(token = {}, mode = "chart") {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  const bootstrap = smartChartBootstrapForMint(mint);
  if (mode === "info" && bootstrap?.infoUrl) return bootstrap.infoUrl;
  if ((mode === "chartTxns" || mode === "txns") && (bootstrap?.chartTxnsUrl || bootstrap?.txnsUrl)) {
    return bootstrap.chartTxnsUrl || bootstrap.txnsUrl;
  }
  if (bootstrap?.chartUrl) return bootstrap.chartUrl;
  return dexChartEmbedUrl(token, { trades: mode === "chartTxns" || mode === "txns", info: mode === "info" });
}

function pumpChartSeries(token = {}) {
  const mint = String(token?.tokenMint || token?.mint || state.smartChartToken || "");
  const seed = hashStringToInt(mint || token?.symbol || "pump");
  const base = Math.max(1, firstUsefulNumber(token.marketCap, token.fdv, token.liquidityUsd, 10_000));
  const momentum = firstUsefulNumber(
    token.m5,
    token.h1,
    token.priceChange?.m5,
    token.priceChange?.h1,
    token.priceChange5m,
    token.priceChange1h,
    0
  );
  const progress = Math.max(4, Math.min(96, slimeScopeProgressPct(token) || firstUsefulNumber(token.bondingProgressPct, token.pumpProgress, 12)));
  const volatility = Math.max(2, Math.min(22, Math.abs(momentum) || firstUsefulNumber(token.volume5m, token.volumeM15, token.volumeH1, 0) / Math.max(1, base) * 100));
  return Array.from({ length: 22 }, (_item, index) => {
    const wave = Math.sin((index + (seed % 11)) / 2.2) * volatility;
    const drift = ((index / 21) - 0.5) * (momentum || progress / 3);
    const jitter = (((seed >> (index % 8)) & 7) - 3) * 0.7;
    return Math.max(1, base * (1 + (wave + drift + jitter) / 100));
  });
}

function pumpActivityMetric(token = {}, ...keys) {
  for (const key of keys) {
    const direct = Number(token?.[key]);
    if (Number.isFinite(direct) && direct > 0) return direct;
    const nested = key.split(".").reduce((value, part) => value?.[part], token);
    const nestedNumber = Number(nested);
    if (Number.isFinite(nestedNumber) && nestedNumber > 0) return nestedNumber;
  }
  return 0;
}

function smartChartPumpPanelHtml(token = {}, mode = "chart") {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  const activityOnly = mode === "txns";
  const progress = Math.max(0, Math.min(100, slimeScopeProgressPct(token) || firstUsefulNumber(token.bondingProgressPct, token.pumpProgress, 0)));
  const mc = firstStatLabel(token.marketCapLabel, token.fdvLabel, compactUsd(token.marketCap), compactUsd(token.fdv));
  const liq = firstStatLabel(token.liquidityLabel, compactUsd(token.liquidityUsd));
  const vol = firstStatLabel(token.volumeM15Label, token.volume5mLabel, token.volumeLabel, compactUsd(token.volumeM15), compactUsd(token.volume5m), compactUsd(token.volumeH1));
  return `
    <div class="smart-chart-frame smart-chart-dex-frame smart-chart-pump-frame${activityOnly ? " pump-activity-only-frame" : ""}" data-loaded="true" data-chart-resolving="false">
      <div class="terminal-title-row">
        <div>
          <h4>${activityOnly ? "Pump Transactions" : "Pump Chart"}</h4>
          <p>${activityOnly ? "Native SlimeWire Pump activity view for this unbonded launch." : "Native SlimeWire launch chart for unbonded Pump tokens."}</p>
        </div>
        <span class="sniper-pill">${progress ? `${progress.toFixed(0)}% bonded` : "pre-bond"}</span>
      </div>
      ${activityOnly ? "" : `
        <div class="pump-native-chart">
          ${pumpChartSvgHtml(token)}
        </div>
        <dl class="mini-stats">
          <div><dt>MC / FDV</dt><dd>${escapeHtml(mc)}</dd></div>
          <div><dt>Liquidity</dt><dd>${escapeHtml(liq)}</dd></div>
          <div><dt>Volume</dt><dd>${escapeHtml(vol)}</dd></div>
          <div><dt>Status</dt><dd>${isUnbondedPumpToken(token) ? "Pump curve" : "Bonded"}</dd></div>
        </dl>
      `}
      ${mode === "chart" ? "" : smartChartPumpActivityHtml(token)}
      <small>${escapeHtml(mode === "chart" ? "Use Chart + Txns for the Pump activity panel. Trading controls stay live on the right." : activityOnly ? "Transactions shows Pump activity only. Use Chart + Txns when you want both together." : "Chart + Txns keeps Pump chart and activity inside SlimeWire.")}</small>
    </div>
  `;
}

function smartChartDexFrameHtml(token = {}, mode = "chart") {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  const isTransactions = mode === "chartTxns" || mode === "txns";
  const isInfo = mode === "info";
  const isPumpChart = Boolean(pumpUrlForRow(token) && isUnbondedPumpToken(token) && ["chart", "chartTxns", "txns"].includes(mode));
  if (isPumpChart) return smartChartPumpPanelHtml(token, mode);
  const resolvingPair = queueSmartChartBootstrap(token) || queueSmartChartDexResolution(token);
  const title = isInfo
    ? `DexScreener info for ${token.symbol || shortAddress(mint)}`
    : isPumpChart
      ? `Pump chart and transactions for ${token.symbol || shortAddress(mint)}`
      : isTransactions
      ? `DexScreener chart and transactions for ${token.symbol || shortAddress(mint)}`
      : `DexScreener chart for ${token.symbol || shortAddress(mint)}`;
  const className = [
    "smart-chart-frame",
    "smart-chart-dex-frame",
    isTransactions ? "smart-chart-transactions-frame" : "",
    mode === "chartTxns" ? "smart-chart-combined-frame" : "",
    isInfo ? "smart-chart-info-frame" : ""
  ].filter(Boolean).join(" ");
  const loadingLabel = isPumpChart ? "Loading Pump chart..." : isInfo ? "Loading token info..." : isTransactions ? "Loading DEX transactions..." : "Loading DEX chart...";
  const frameLoadingLabel = resolvingPair && !isPumpChart ? "Loading DEX chart while resolving fastest pair..." : loadingLabel;
  return `
    <div class="${escapeHtml(className)}" data-chart-frame-loading="${escapeHtml(frameLoadingLabel)}" data-chart-resolving="${resolvingPair ? "true" : "false"}">
      <iframe title="${escapeHtml(title)}" src="${escapeHtml(smartChartFrameUrl(token, mode))}" loading="eager" fetchpriority="high" referrerpolicy="no-referrer-when-downgrade" onload="this.closest('.smart-chart-frame')?.setAttribute('data-loaded','true'); window.SlimeWireChartFrameLoaded?.('${escapeHtml(mode)}','${escapeHtml(mint)}')" allowfullscreen></iframe>
    </div>
  `;
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

function parseUiNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const compact = raw.replace(/[$,%_\s,]/g, "");
  const match = compact.match(/^([-+]?\d*\.?\d+)([kmb])?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  if (suffix === "k") return number * 1_000;
  if (suffix === "m") return number * 1_000_000;
  if (suffix === "b") return number * 1_000_000_000;
  return number;
}

function firstUsefulNumber(...values) {
  for (const value of values) {
    const number = parseUiNumber(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  for (const value of values) {
    const number = parseUiNumber(value);
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

function pairRiskBadgesHtml(row = {}) {
  const flags = new Set((row.riskFlags || []).map((flag) => String(flag)));
  if (row.safetyStatus === "pending") flags.add("risk check pending");
  if (row.safetyStatus === "warning") flags.add("risk warning");
  if (row.mintAuthority) flags.add("mint active");
  if (row.freezeAuthority) flags.add("freeze active");
  if (row.tokenProgram && /token-?2022/i.test(String(row.tokenProgram))) flags.add("token-2022");
  if (!flags.size && row.safetyNote && !/passed/i.test(String(row.safetyNote))) flags.add(row.safetyNote);
  const labels = [...flags]
    .filter(Boolean)
    .slice(0, 4)
    .map((flag) => String(flag).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").trim());
  if (!labels.length) return "";
  return `<div class="signal-links risk-links">${labels.map((label) => `<span class="sniper-pill" title="Risk flag">${escapeHtml(label)}</span>`).join("")}</div>`;
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

function pumpUrlForRow(row = {}) {
  const existing = String(row.pumpUrl || "").trim();
  if (existing) return existing;
  const mint = String(row.tokenMint || row.mint || "").trim();
  if (!mint) return "";
  return Boolean(row.isPump) || mint.toLowerCase().endsWith("pump")
    ? `https://pump.fun/coin/${encodeURIComponent(mint)}`
    : "";
}

function miniTokenLinksHtml(row = {}, shareText = "") {
  const text = shareText || livePairShareText(row);
  const sniperCount = Number(row.sniperCount || row.snipers || 0);
  const pumpUrl = pumpUrlForRow(row);
  return `
    <div class="compact-link-row">
      <a href="${escapeHtml(row.dexUrl || dexUrl(row.tokenMint))}" target="_blank" rel="noreferrer" title="DexScreener">DEX</a>
      ${pumpUrl ? `<a href="${escapeHtml(pumpUrl)}" target="_blank" rel="noreferrer" title="Pump">PUMP</a>` : ""}
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

function hashStringToInt(value = "") {
  let hash = 0;
  for (let i = 0; i < String(value).length; i += 1) {
    hash = ((hash << 5) - hash) + String(value).charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function tokenMintKey(row = {}) {
  return String(row.tokenMint || row.mint || row.address || row.pairAddress || "").trim().toLowerCase();
}

function terminalRotationKey(scope = "") {
  const feed = currentLivePairs();
  return [
    scope,
    state.livePairBucket,
    state.terminalSort,
    feed?.refreshCount || "",
    state.livePairsLastUpdatedByBucket[state.livePairBucket] || state.livePairsLastUpdatedAt || "",
    state.kolScan?.refreshCount || "",
    state.kolScan?.refreshedAt || state.kolLastUpdatedAt || ""
  ].join(":");
}

function rotatedDisplayRows(rows = [], limit = 12, rotateKey = "", stickyCount = 0) {
  const uniqueRows = uniqueSignalRows(rows || []);
  const max = Math.max(0, Number(limit) || uniqueRows.length);
  if (!max) return [];
  if (!rotateKey || uniqueRows.length <= max) return uniqueRows.slice(0, max);
  const stickySize = Math.min(Math.max(0, Number(stickyCount) || 0), Math.max(0, max - 1), uniqueRows.length);
  const stickyRows = uniqueRows.slice(0, stickySize);
  const pool = uniqueRows.slice(stickySize);
  if (!pool.length) return stickyRows.slice(0, max);
  const offset = hashStringToInt(rotateKey) % pool.length;
  const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
  return [...stickyRows, ...rotated].slice(0, max);
}

function removeRowsByMints(rows = [], mintSet = new Set()) {
  return (rows || []).filter((row) => {
    const key = tokenMintKey(row);
    return !key || !mintSet.has(key);
  });
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
  const actionLabel = options.actionLabel || "Trade";
  const emptyTitle = options.emptyTitle || "No signals loaded";
  const emptyMessage = options.emptyMessage || "Refresh the feed to load current signals.";
  const visibleRows = rotatedDisplayRows(rows || [], limit, options.rotateKey || "", options.stickyCount || 0);
  if (!visibleRows.length) return emptyState(emptyTitle, emptyMessage);
  return `
    <div class="terminal-token-list">
      ${visibleRows.map((row) => {
        const score = Number(row.bestPickScore || row.score || 0);
        const scoreLabel = score ? `${score}` : "n/a";
        const setup = row.scalpSetup || row.momentum || row.category || "live";
        return `
          <article class="terminal-token-row" data-token-chart="${escapeHtml(row.tokenMint)}" data-token-chart-source="terminal-row">
            ${livePairAvatarHtml(row)}
            <div class="terminal-token-main">
              <div class="terminal-token-title">
                <strong data-token-chart="${escapeHtml(row.tokenMint)}" data-token-chart-source="terminal-title">${escapeHtml(row.symbol || row.shortMint || shortAddress(row.tokenMint))}</strong>
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
              <button type="button" class="primary" data-token-trade="${escapeHtml(row.tokenMint)}" data-token-trade-source="terminal-row" title="Open chart and buy/sell panel">${escapeHtml(actionLabel)}</button>
              <button type="button" data-quick-buy-token="${escapeHtml(row.tokenMint)}" data-quick-buy-source="terminal-row" title="Quick buy with preset or custom SOL amount">${escapeHtml(quickBuyButtonLabel())}</button>
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
  const actionLabel = options.actionLabel || "Trade";
  const emptyTitle = options.emptyTitle || "No signals loaded";
  const emptyMessage = options.emptyMessage || "Refresh the feed to load current signals.";
  const visibleRows = rotatedDisplayRows(rows || [], limit, options.rotateKey || "", options.stickyCount || 0);
  if (!visibleRows.length) return emptyState(emptyTitle, emptyMessage);
  return `
    <div class="compact-signal-list">
      ${visibleRows.map((row) => `
        <article class="compact-signal-row" data-token-chart="${escapeHtml(row.tokenMint)}" data-token-chart-source="compact-row">
          ${livePairAvatarHtml(row)}
          <div class="compact-signal-main">
            <div>
              <strong data-token-chart="${escapeHtml(row.tokenMint)}" data-token-chart-source="compact-title">${escapeHtml(row.symbol || row.shortMint || shortAddress(row.tokenMint))}</strong>
              <small>${escapeHtml(row.name || row.category || "Token")}</small>
            </div>
            <button type="button" class="ca-copy" data-copy="${escapeHtml(row.tokenMint)}">${escapeHtml(shortAddress(row.tokenMint))}</button>
            <span>${escapeHtml(row.pairAgeLabel || formatAgeFromRow(row) || "age unknown")} | ${escapeHtml(row.scalpSetup || row.momentum || row.category || "live")}</span>
            ${compactMetricsLineHtml(row)}
            ${miniTokenLinksHtml(row)}
          </div>
          ${scoreBadgeHtml(row)}
          <div class="compact-row-actions">
            <button type="button" class="primary" data-token-trade="${escapeHtml(row.tokenMint)}" data-token-trade-source="compact-row" title="Open chart and buy/sell panel">${escapeHtml(actionLabel)}</button>
            <button type="button" data-quick-buy-token="${escapeHtml(row.tokenMint)}" data-quick-buy-source="compact-row" title="Quick buy with preset or custom SOL amount">${escapeHtml(quickBuyButtonLabel())}</button>
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

function activeBundlePreset() {
  return presetById("bundle", state.selectedBundlePresetId);
}

function activeQuickBuyAmount(preset = activeTradePreset()) {
  return normalizedQuickBuyAmount() || formatQuickBuyAmount(preset?.amountSol);
}

function activeBundleQuickBuyAmount(preset = activeBundlePreset()) {
  return normalizedQuickBuyAmount() || formatQuickBuyAmount(preset?.amountSol) || "0.1";
}

function rowAgeSeconds(row = {}) {
  const created = Number(row.pairCreatedAt || row.createdAt || 0);
  if (created > 0) {
    const timestamp = created < 10_000_000_000 ? created * 1000 : created;
    return Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  }
  const trustedSourceAge = ["source-age", "trusted-source-age"].includes(String(row.pairAgeSource || "").toLowerCase());
  const value = Number(row.pairAgeSeconds);
  if (trustedSourceAge && Number.isFinite(value) && value >= 0) return value;
  return Number.POSITIVE_INFINITY;
}

const SLIME_SCOPE_LIMIT = 100;
const SLIME_SCOPE_NEW_MAX_AGE_SECONDS = 7200;
const SLIME_SCOPE_FRESH_MAX_MARKET_CAP = 750_000;
const SLIME_SCOPE_STEADY_MAX_AGE_SECONDS = 86_400;
const SLIME_SCOPE_STEADY_MAX_MARKET_CAP = 2_000_000;

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
    .filter((row) => row?.tokenMint && !isUiFeedDisplayBlockedSignalRow(row));
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

function isFreshSlimeScopeRow(row = {}) {
  if (isGraduatedSlimeScopeRow(row)) return false;
  const age = rowAgeSeconds(row);
  if (!Number.isFinite(age) || age < 0 || age > SLIME_SCOPE_NEW_MAX_AGE_SECONDS) return false;
  const marketCap = slimeScopeMarketCap(row);
  if (marketCap > SLIME_SCOPE_FRESH_MAX_MARKET_CAP) return false;
  return slimeScopeProgressPct(row) < 70;
}

function isGraduatingSlimeScopeRow(row = {}) {
  if (isGraduatedSlimeScopeRow(row)) return false;
  const progress = slimeScopeProgressPct(row);
  const marketCap = slimeScopeMarketCap(row);
  return progress >= 70 || marketCap >= 45_000;
}

function isSteadySlimeScopeRow(row = {}) {
  if (isFreshSlimeScopeRow(row) || isGraduatingSlimeScopeRow(row) || isGraduatedSlimeScopeRow(row)) return false;
  const age = rowAgeSeconds(row);
  if (Number.isFinite(age) && (age < 0 || age > SLIME_SCOPE_STEADY_MAX_AGE_SECONDS)) return false;
  const marketCap = slimeScopeMarketCap(row);
  if (marketCap > SLIME_SCOPE_STEADY_MAX_MARKET_CAP) return false;
  return slimeScopeLiquidity(row) > 0
    || slimeScopeVolume(row) > 0
    || Number(row.bestPickScore || row.score || 0) > 0
    || Array.isArray(row.reasons) && row.reasons.length > 0;
}

function slimeScopeTextBlob(row = {}) {
  return [
    row.tokenMint,
    row.symbol,
    row.name,
    row.source,
    row.category,
    row.dexId,
    row.dexName,
    row.poolType,
    row.platform,
    row.raydiumPool,
    row.pairUrl,
    ...(row.riskFlags || []),
    ...(row.reasons || [])
  ].filter(Boolean).join(" ").toLowerCase();
}

function slimeScopeProgressPct(row = {}) {
  const direct = firstUsefulNumber(
    row.bondingProgressPct,
    row.bondingProgress,
    row.bonding_curve_progress,
    row.bondingCurveProgress,
    row.pumpProgress,
    row.graduationProgress,
    row.completion,
    row.completePct
  );
  if (direct > 0) return direct <= 1 ? direct * 100 : direct;
  const marketCap = slimeScopeMarketCap(row);
  const text = slimeScopeTextBlob(row);
  const isPump = Boolean(row.isPump) || text.includes("pump") || String(row.tokenMint || "").toLowerCase().endsWith("pump");
  if (isPump && marketCap > 0) return Math.max(1, Math.min(99, (marketCap / 69_000) * 100));
  return 0;
}

function isGraduatedSlimeScopeRow(row = {}) {
  if (row.isGraduated || row.graduated || row.bonded || row.isBonded || row.complete || row.completed || row.bondingComplete) return true;
  if (row.raydiumPool || row.raydium_pool || row.poolAddress) return true;
  const text = slimeScopeTextBlob(row);
  if (/\b(graduated|bonded|bonding complete|complete)\b/.test(text)) return true;
  const isPump = Boolean(row.isPump) || text.includes("pump") || String(row.tokenMint || "").toLowerCase().endsWith("pump");
  return Boolean(isPump && /\b(raydium|meteora|orca)\b/.test(text));
}

function classifySlimeScopeRow(row = {}) {
  if (isGraduatedSlimeScopeRow(row)) return "graduated";
  const explicit = String(row.slimeScopeCategory || "").trim().toLowerCase();
  if (explicit === "graduated") return "graduated";
  if (isGraduatingSlimeScopeRow(row) || explicit === "graduating") return "graduating";
  if (isFreshSlimeScopeRow(row)) return "new";
  if (explicit === "steady" || explicit === "unknown" || isSteadySlimeScopeRow(row)) return "steady";
  return "steady";
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
  const category = mode === "graduated"
    ? "graduated"
    : mode === "graduating"
      ? "graduating"
      : mode === "steady"
        ? "steady"
        : "new";
  const primary = withMarket.filter((row) => classifySlimeScopeRow(row) === category);
  const fallback = withMarket.filter((row) => {
    const rowCategory = classifySlimeScopeRow(row);
    if (category === "graduated") return rowCategory === "graduated" || isGraduatedSlimeScopeRow(row);
    if (category === "graduating") return rowCategory === "graduating" || isGraduatingSlimeScopeRow(row);
    if (category === "steady") return rowCategory === "steady" || isSteadySlimeScopeRow(row);
    return rowCategory === "new" || isFreshSlimeScopeRow(row);
  });
  const sortedPrimary = category === "new" ? [...primary].sort(compareNewestLiveRows) : sortSlimeScopeRows(primary);
  const sortedFallback = category === "new" ? uniqueSignalRows(fallback).sort(compareNewestLiveRows) : sortSlimeScopeRows(fallback);
  return backfillSlimeScopeRows(sortedPrimary, sortedFallback);
}
function slimeScopeHtml() {
  const modes = [
    ["new", "New"],
    ["steady", "Steady"],
    ["graduating", "Graduating"],
    ["graduated", "Graduated"]
  ];
  const allRows = slimeScopeRows();
  const rows = terminalFeedRowsWindow("slimeScope", allRows);
  return `
    <section class="slime-scope-page">
      <div class="terminal-title-row slime-scope-title-row">
        <span class="slime-scope-title-icon" aria-hidden="true"></span>
        <div>
          <h3>Slime Scope</h3>
          <p>Fast pump-style view for new, steady, graduating, and graduated pairs. Scam-risk rows stay filtered out.</p>
        </div>
        <span>${rows.length}/${allRows.length} shown</span>
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
          limit: Math.max(1, rows.length),
          actionLabel: "Trade",
          emptyTitle: "No Slime Scope pairs yet",
          emptyMessage: "Feeds are refreshing. Try a different scope mode if this stays empty."
        })}
        ${terminalFeedLoadMoreHtml("slimeScope", allRows, "Slime Scope pairs")}
      </article>
    </section>
  `;
}

function terminalHtml() {
  const liveFeed = currentLivePairs();
  const liveRows = uniqueSignalRows(liveFeed?.rows || []);
  const newestLiveRows = [...liveRows].sort(compareNewestLiveRows);
  const kolRows = mergeMarketDataIntoRows(state.kolScan?.rows || []).filter((row) => !isUiFeedDisplayBlockedSignalRow(row));
  const bestRows = terminalBestPickRows(liveRows, kolRows);
  const bestDisplayRows = rotatedDisplayRows(bestRows, 8, terminalRotationKey("best-picks"), 2);
  const bestMintSet = new Set(bestDisplayRows.map(tokenMintKey).filter(Boolean));
  const liveDisplaySource = removeRowsByMints(newestLiveRows, bestMintSet);
  const liveDisplayRows = rotatedDisplayRows(
    liveDisplaySource.length ? liveDisplaySource : newestLiveRows,
    12,
    terminalRotationKey("live-pairs"),
    0
  );
  const usedMintSet = new Set([
    ...bestMintSet,
    ...liveDisplayRows.map(tokenMintKey).filter(Boolean)
  ]);
  const kolDisplaySource = removeRowsByMints(kolRows, usedMintSet);
  const kolDisplayRows = rotatedDisplayRows(
    kolDisplaySource.length ? kolDisplaySource : kolRows,
    12,
    terminalRotationKey("kol-signals"),
    1
  );
  const bucketLoading = Boolean(state.livePairsLoadingByBucket[state.livePairBucket]);
  const lastUpdated = currentLivePairsUpdatedAt();
  const rowTradeLabel = "Trade";
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
            ${compactSignalRowsHtml(bestDisplayRows, { layout: "terminal", limit: 8, actionLabel: rowTradeLabel, emptyTitle: "No Best Picks yet", emptyMessage: "Refresh Live Pairs to score current pairs." })}
          </article>
          <article class="terminal-panel live-pairs-panel">
            <header><h4>Live Pairs</h4><button data-tab="live">Open</button></header>
            ${compactSignalRowsHtml(liveDisplayRows, { layout: "terminal", limit: 12, actionLabel: rowTradeLabel })}
          </article>
          <article class="terminal-panel kol-panel">
            <header><h4>KOL Signals</h4><button data-kol-refresh>${state.kolLoading ? "Loading..." : "Refresh"}</button></header>
            ${compactSignalRowsHtml(kolDisplayRows, { layout: "terminal", limit: 12, actionLabel: rowTradeLabel, emptyTitle: "No KOL signals loaded", emptyMessage: "Refresh KOL Tracker to load signals." })}
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

function quickBuyButtonLabel() {
  const preset = activeTradePreset();
  const amount = activeQuickBuyAmount(preset);
  return amount ? `Quick Buy ${amount}` : "Quick Buy";
}

function syncQuickBuyActionLabels() {
  const label = quickBuyButtonLabel();
  document.querySelectorAll("[data-quick-buy-token]").forEach((button) => {
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
  const hasPosition = portfolioPositions().some((position) => String(position.tokenMint) === String(token.tokenMint));
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
      ${pumpUrlForRow(token) ? `<a href="${escapeHtml(pumpUrlForRow(token))}" target="_blank" rel="noreferrer">Pump</a>` : ""}
      <button class="primary" data-token-trade="${escapeHtml(token.tokenMint)}" data-token-trade-source="token-preview">Trade</button>
      <button data-quick-buy-token="${escapeHtml(token.tokenMint)}" data-quick-buy-source="token-preview">${escapeHtml(quickBuyButtonLabel())}</button>
      <button data-quick-bundle-token="${escapeHtml(token.tokenMint)}">Bundle</button>
      ${hasPosition ? `<button data-position-sell="${escapeHtml(token.tokenMint)}" data-position-sell-percent="100">Exit 100%</button>` : ""}
    </div>
    <small class="score-breakdown">Why: ${escapeHtml(scoreWhyText(token))}</small>
  `;
}

function smartChartViewTabsHtml(activeView = "chart") {
  const tabs = [
    ["chart", "Chart"],
    ["chartTxns", "Chart + Txns"],
    ["txns", "Transactions"],
    ["info", "Info"]
  ];
  return `
    <div class="smart-chart-mode-tabs" role="tablist" aria-label="Smart Chart view">
      ${tabs.map(([value, label]) => `<button type="button" data-smart-chart-view="${value}" data-active="${activeView === value}">${label}</button>`).join("")}
    </div>
  `;
}

function tradesForToken(mint = "") {
  const key = String(mint || "").trim();
  if (!key) return [];
  return (state.pnl?.trades || []).filter((trade) => String(trade?.tokenMint || trade?.mint || "").trim() === key);
}

function smartChartTransactionsHtml(token = {}, heldPosition = null) {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  const trades = tradesForToken(mint);
  const isPumpMarket = Boolean(pumpUrlForRow(token) && isUnbondedPumpToken(token));
  const marketLink = isPumpMarket ? pumpUrlForRow(token) : token.dexUrl || dexUrl(chartAddressForToken(token) || mint);
  const marketLabel = isPumpMarket ? "Pump" : "DEX";
  return `
    <section class="smart-chart-transactions-panel" data-smart-chart-transactions>
      <div class="terminal-title-row">
        <div>
          <h4>${escapeHtml(marketLabel)} Transactions</h4>
          <p>Live market activity from ${escapeHtml(marketLabel)}. SlimeWire trade history appears below when this wallet has traded the token.</p>
        </div>
        <a href="${escapeHtml(marketLink)}" target="_blank" rel="noreferrer">Open ${escapeHtml(marketLabel)} Feed</a>
      </div>
      ${smartChartDexFrameHtml(token, "txns")}
      ${trades.length ? `
        <div class="smart-chart-local-trades">
          <h4>SlimeWire Trades</h4>
          ${liveTradeRowsHtml(Math.max(6, trades.length), trades)}
        </div>
      ` : `
        <div class="smart-chart-empty-transactions">
          <strong>${heldPosition ? "Position loaded" : "Watching live market"}</strong>
          <span>DEX transactions are loaded above. SlimeWire wallet trades appear here after buys/sells refresh.</span>
        </div>
      `}
    </section>
  `;
}

function smartChartInfoPanelHtml(token = {}, heldPosition = null) {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  const suggestion = smartChartSuggestion(token || {});
  return `
    <section class="smart-chart-info-panel">
      <div class="terminal-title-row">
        <div>
          <h4>Token Info</h4>
          <p>Stats, links, and SlimeWire context for ${escapeHtml(token.symbol || shortAddress(mint))}.</p>
        </div>
      </div>
      ${smartChartDexFrameHtml(token, "info")}
      ${terminalTokenStatsHtml(token)}
      <div class="smart-chart-suggestion">
        <strong>Smart read</strong>
        <p>${escapeHtml(suggestion)}</p>
      </div>
      <dl class="mini-stats">
        <div><dt>Mint</dt><dd><button type="button" class="ca-copy" data-copy="${escapeHtml(mint)}">${escapeHtml(shortAddress(mint))}</button></dd></div>
        <div><dt>Position</dt><dd>${heldPosition ? "Held" : "None tracked"}</dd></div>
        <div><dt>Source</dt><dd>${escapeHtml(token.source || token.category || token.dexId || "market")}</dd></div>
      </dl>
      <div class="compact-link-row">
        ${miniTokenLinksHtml(token)}
      </div>
    </section>
  `;
}

function chartTradePanelHtml(token = {}, heldPosition = null) {
  const mint = String(token?.tokenMint || state.smartChartToken || "").trim();
  const activeTab = state.chartTradeTab === "sell" ? "sell" : "buy";
  const connected = connectedBrowserWallet();
  const walletSelected = connected?.publicKey ? "connected" : "";
  const positionSummary = heldPosition
    ? `${escapeHtml(heldPosition.uiAmount || "Position")} tokens | ${escapeHtml(heldPosition.estimatedValueSol || "value n/a")} SOL`
    : "No SlimeWire position tracked for this token.";
  return `
    <div class="chart-trade-panel">
      <div class="chart-trade-tabs" role="tablist" aria-label="Token trade panel">
        <button type="button" data-chart-trade-tab="buy" data-active="${activeTab === "buy"}">Buy</button>
        <button type="button" data-chart-trade-tab="sell" data-active="${activeTab === "sell"}">Sell</button>
      </div>
      ${activeTab === "buy" ? `
        <div class="chart-trade-form" data-chart-trade-panel="buy">
          <label>
            Wallet
            <select data-chart-buy-wallet>
              ${walletOptionsHtml(walletSelected)}
            </select>
          </label>
          <label>
            Buy SOL
            <input data-chart-buy-amount type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.10" value="${escapeHtml(state.quickBuyAmountOverride || "")}">
          </label>
          <div class="quick-buy-presets chart-buy-presets">
            ${["0.1", "0.25", "0.5", "1"].map((amount) => `<button type="button" data-chart-buy-preset="${amount}">${amount} SOL</button>`).join("")}
          </div>
          <label>
            Slippage
            <select data-chart-buy-slippage>
              <option value="300">3%</option>
              <option value="400" selected>4%</option>
              <option value="500">5%</option>
            </select>
          </label>
          <small>${connected?.publicKey ? `${escapeHtml(connected.provider || "Browser wallet")} approval opens in wallet.` : "Choose a connected browser wallet or managed wallet."}</small>
          <button type="button" class="primary chart-confirm-button" data-chart-confirm-buy="${escapeHtml(mint)}">Confirm Buy</button>
          <button type="button" data-quick-buy-token="${escapeHtml(mint)}" data-quick-buy-source="chart-panel">Quick Buy Drawer</button>
        </div>
      ` : `
        <div class="chart-trade-form" data-chart-trade-panel="sell">
          <p class="chart-position-summary">${positionSummary}</p>
          <div class="quick-grid">
            <button type="button" data-position-sell="${escapeHtml(mint)}" data-position-sell-percent="25" ${heldPosition ? "" : "disabled"}>Sell 25%</button>
            <button type="button" data-position-sell="${escapeHtml(mint)}" data-position-sell-percent="50" ${heldPosition ? "" : "disabled"}>Sell 50%</button>
            <button type="button" class="danger" data-position-sell="${escapeHtml(mint)}" data-position-sell-percent="100" ${heldPosition ? "" : "disabled"}>Sell 100%</button>
          </div>
          <label>
            Custom sell %
            <input data-chart-sell-percent type="number" min="1" max="100" step="1" inputmode="numeric" placeholder="100" ${heldPosition ? "" : "disabled"}>
          </label>
          <button type="button" data-chart-confirm-sell="${escapeHtml(mint)}" ${heldPosition ? "" : "disabled"}>Confirm Custom Sell</button>
        </div>
      `}
      <div class="chart-trade-links">
        <button type="button" data-quick-bundle-token="${escapeHtml(mint)}">Bundle</button>
        <button type="button" data-use-token-volume="${escapeHtml(mint)}">Volume</button>
        <button type="button" data-watch-token="${escapeHtml(mint)}">${isTokenWatched(mint) ? "Saved" : "Watch"}</button>
      </div>
    </div>
  `;
}

function smartChartHtml() {
  const token = selectedSmartChartTokenRow();
  const mint = String(token?.tokenMint || "").trim();
  const heldPosition = mint ? portfolioPositions().find((position) => String(position.tokenMint) === mint) : null;
  const relatedRows = mint
    ? uniqueSignalRows([
        token,
        ...allVisibleSignalRows().filter((row) => String(row.tokenMint || "") === mint)
      ]).filter(Boolean).slice(0, 5)
    : rotatedDisplayRows(terminalBestPickRows(), 5, terminalRotationKey("smart-chart-suggest"), 1);
  const rawChartView = String(state.smartChartView || "chart");
  const chartView = ["chart", "chartTxns", "txns", "info"].includes(rawChartView) ? rawChartView : "chart";
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
            actionLabel: "Trade",
            rotateKey: terminalRotationKey("smart-chart-empty"),
            stickyCount: 1,
            emptyTitle: "No chart picks loaded",
            emptyMessage: "Refresh feeds, then open Smart Chart again."
          })}
        </div>
      </section>
    `;
  }
  perfMark("tokenHeaderRendered");
  perfMark("chartSkeletonRendered");
  perfMark("buyPanelReady");
  recordPerfEvent({
    component: "smartChart",
    action: "chart-shell-rendered",
    durationMs: 0,
    cacheHit: Boolean(smartChartBootstrapForMint(mint)?.cacheHit || smartChartResolvedDex(mint)?.pairAddress),
    stale: Boolean(smartChartBootstrapForMint(mint)?.stale),
    details: mint
  });
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
          ${smartChartViewTabsHtml(chartView)}
          ${chartView === "chart" ? `
            ${smartChartDexFrameHtml(token, "chart")}
            <small class="score-breakdown">${isUnbondedPumpToken(token) ? "Pump launches render natively inside Slime until they bond." : "If the embedded chart does not load, use the DEX link above."}</small>
          ` : chartView === "chartTxns" ? `
            ${smartChartDexFrameHtml(token, "chartTxns")}
            <small class="score-breakdown">Chart + Txns uses Pump before bonding and DexScreener after bonding. Use Transactions for the dedicated market feed view.</small>
          ` : chartView === "txns" ? `
            ${smartChartTransactionsHtml(token, heldPosition)}
          ` : `
            ${smartChartInfoPanelHtml(token, heldPosition)}
          `}
        </article>
        <aside class="terminal-panel smart-chart-side">
          <h3>${escapeHtml(token.symbol || "Token")} setup</h3>
          ${terminalTokenStatsHtml(token)}
          ${chartTradePanelHtml(token, heldPosition)}
        </aside>
      </div>
      ${chartView !== "txns" && chartView !== "info" ? `<div class="smart-chart-bottom-grid">
        <article class="terminal-panel">
          <div class="terminal-title-row">
            <h3>Related signals</h3>
            <button type="button" data-refresh-feeds>Refresh</button>
          </div>
          ${compactSignalRowsHtml(relatedRows, {
            layout: "terminal",
            limit: 5,
            actionLabel: "Trade",
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
      </div>` : ""}
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
          <strong>â€¹</strong>
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
        <button type="button" class="terminal-ticket-toggle" data-toggle-terminal-ticket aria-label="Hide trade panel">â€º</button>
      </div>
        <div class="ticket-collapse-body">
          <p>Trade opens the full chart page. Quick Buy uses a saved preset or asks for a custom SOL amount.</p>
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
              <button class="primary" data-token-trade="${escapeHtml(token.tokenMint)}" data-token-trade-source="terminal-ticket">Trade</button>
              <button data-quick-buy-token="${escapeHtml(token.tokenMint)}" data-quick-buy-source="terminal-ticket">${escapeHtml(quickBuyButtonLabel())}</button>
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
  if (state.terminalSubtab === "kol") {
    const rows = mergeMarketDataIntoRows(state.kolScan?.rows || []).filter((row) => !isUiFeedDisplayBlockedSignalRow(row));
    return compactSignalRowsHtml(rows, {
      layout: "terminal",
      limit: 12,
      rotateKey: terminalRotationKey("bottom-kol"),
      stickyCount: 1
    });
  }
  if (state.terminalSubtab === "sniper") return state.scan ? tokenSignalRowsHtml(state.scan.rows || [], { context: "sniper", primaryAction: "snipe", primaryActionLabel: "Snipe", hideToolbar: true }) : emptyState("No sniper scan loaded", "Open Sniper or refresh a scan mode.");
  if (state.terminalSubtab === "tx") return txAuditHtml(true);
  if (state.terminalSubtab === "reconcile") return balanceReconciliationHtml();
  return positionsTableHtml(6);
}

function positionsTableHtml(limit = 25) {
  const rows = portfolioPositions();
  if (!rows.length) return emptyState("No open positions", "Open token holdings will show here after refresh.");
  return `
    <div class="table-list compact-table">
      ${rows.slice(0, limit).map(positionRowHtml).join("")}
    </div>
  `;
}

function positionRowHtml(position) {
  const hasEstimatedValue = position.estimatedValueSol !== null && position.estimatedValueSol !== undefined && position.estimatedValueSol !== "";
  const hasOpenPnl = position.openPnlSol !== null && position.openPnlSol !== undefined && position.openPnlSol !== "";
  const isValueUpdating = Boolean(position.valuePending || (!hasEstimatedValue && /refreshing|updating|background/i.test(position.valueError || "")));
  const isConnectedWalletPosition = Boolean(position.viewOnly || position.source === "connected-wallet");
  const valueLabel = hasEstimatedValue
    ? `${position.estimatedValueSol} SOL`
    : isValueUpdating
      ? "updating"
      : isConnectedWalletPosition
        ? "tracking"
        : "Price unavailable";
  const pnlLabel = hasOpenPnl
    ? position.openPnlSol
    : isValueUpdating
      ? "updating"
      : isConnectedWalletPosition
        ? "realized only"
        : "Price unavailable";
  const valueStatus = position.valueError
    ? isValueUpdating
      ? "Value updating in background"
      : `Price warning: ${position.valueError}`
    : isConnectedWalletPosition && !hasEstimatedValue
      ? "Connected wallet holding - live value pending"
    : "";
  return `
    <article class="row-card position with-avatar">
      ${livePairAvatarHtml(position)}
      <div class="row-main">
        <strong>${escapeHtml(position.symbol || position.shortMint)}</strong>
        <span>${escapeHtml(position.uiAmount)} tokens across ${escapeHtml(position.walletCount)} wallet(s)</span>
        ${position.name ? `<small>${escapeHtml(position.name)}</small>` : ""}
        <small>Value: ${escapeHtml(valueLabel)} | PnL: ${escapeHtml(pnlLabel)}</small>
        ${valueStatus ? `<small class="${isValueUpdating ? "muted-text" : "warning-text"}">${escapeHtml(valueStatus)}</small>` : ""}
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

function liveTradeRowsHtml(limit = 10, sourceTrades = null) {
  const trades = Array.isArray(sourceTrades) ? sourceTrades : state.pnl?.trades || [];
  if (!trades.length) return emptyState("No live trade history yet", "Submitted web trades will appear here after refresh.");
  return `
    <div class="live-trade-list">
      ${trades.slice(0, limit).map((trade) => `
        <article class="live-trade-row">
          <strong>${escapeHtml(String(trade.type || "").toUpperCase())} ${escapeHtml(trade.shortMint || shortAddress(trade.tokenMint))}</strong>
          <span>${escapeHtml(trade.walletLabel || "wallet")} | ${escapeHtml(trade.solAmount || "0")} SOL</span>
          <small>${escapeHtml(formatDate(trade.timestamp))}</small>
          <div class="card-actions compact">
            ${trade.tokenMint ? `<button data-token-chart="${escapeHtml(trade.tokenMint)}" data-token-chart-source="live-trades">Chart</button><button data-quick-buy-token="${escapeHtml(trade.tokenMint)}" data-quick-buy-source="live-trades">${escapeHtml(quickBuyButtonLabel())}</button>` : ""}
            ${trade.signature ? `<a href="https://solscan.io/tx/${encodeURIComponent(trade.signature)}" target="_blank" rel="noreferrer">Tx</a>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function liveTradesHtml() {
  const allTrades = state.pnl?.trades || [];
  const trades = terminalFeedRowsWindow("liveTrades", allTrades);
  return `
    <section class="terminal-layout live-trades-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Live Trades</h3>
            <p>Recent web trade activity, fast token preview, and active preset buys stay connected to the terminal.</p>
          </div>
          <span>${trades.length}/${allTrades.length} trades shown</span>
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-top-refresh-wallet>Refresh Trades</button>
          <button data-tab="terminal">Command Center</button>
          <button data-tab="pnl">PnL</button>
        </div>
        ${liveTradeRowsHtml(trades.length || terminalFeedPageSize("liveTrades"), trades)}
        ${terminalFeedLoadMoreHtml("liveTrades", allTrades, "trades")}
      </main>
      <aside class="trade-side order-ticket-stack">
        ${terminalTradePanelHtml(selectedTerminalTokenRow())}
      </aside>
    </section>
  `;
}

function stopLossAuditHtml() {
  const serverPlans = Array.isArray(state.tradePlans) ? state.tradePlans : [];
  const localPlans = [state.tradePlanResult, state.bundleResult, state.volumeResult, state.sniperResult, state.kolResult, state.launchResult]
    .filter(Boolean)
    .map((plan) => ({ ...plan, localOnly: true }));
  const plans = serverPlans.length ? serverPlans : localPlans;
  if (!plans.length) {
    return emptyState("No active audit item loaded", "Managed exits show status here after you create a trade, bundle, volume, sniper, KOL, or launch plan. Server-side TP/SL only auto-executes from managed automation wallets. Phantom and Solflare browser wallets require manual approval unless a future audited delegation/session feature is enabled.");
  }
  return `
    <div class="table-list compact-table">
      ${plans.map((plan) => `
        <article class="row-card stop-loss-audit-card">
          <div class="row-main">
            <strong>${escapeHtml(plan.label || plan.type || plan.source || "Managed Exit")} ${plan.shortMint ? `<code>${escapeHtml(plan.shortMint)}</code>` : ""}</strong>
            <span>Status: ${escapeHtml(plan.status || "watching")} | Active wallets: ${escapeHtml(plan.activeWallets ?? "?")}/${escapeHtml(plan.walletCount ?? "?")} | TP ${escapeHtml(plan.takeProfitSummary || plan.takeProfitPct || "off")} | SL ${escapeHtml(plan.stopLossSummary || plan.stopLossPct || "off")}</span>
            <small>Execution mode: ${escapeHtml(plan.executionMode || "managed_server")} ${plan.automationPermissionExpiresAt ? `| permission expires ${escapeHtml(formatDate(plan.automationPermissionExpiresAt))}` : ""}</small>
            ${plan.automationPermissionExpiresAt && !plan.automationPermissionActive ? `<small class="warning-text">Automation permission is expired. New auto-exit plans require enabling server exits again.</small>` : ""}
            ${plan.localOnly ? `<small class="warning-text">Latest local result only. Refresh Status to load server watcher rows.</small>` : ""}
            ${plan.message ? `<small>${escapeHtml(plan.message)}</small>` : ""}
            ${plan.wallets?.length ? `<div class="audit-wallet-list">${plan.wallets.map(stopLossAuditWalletHtml).join("")}</div>` : ""}
          </div>
          <div class="card-actions compact">
            <button data-top-refresh-wallet>Refresh Status</button>
            <button data-run-trade-plans>${state.walletRefreshing ? "Checking..." : "Run TP/SL Check"}</button>
            <button data-tab="positions">Positions</button>
            ${plan.tokenMint ? `<button data-copy="${escapeHtml(plan.tokenMint)}">Copy CA</button>` : ""}
            ${plan.dexUrl ? `<a class="button-like" href="${escapeHtml(plan.dexUrl)}" target="_blank" rel="noreferrer">Dex</a>` : ""}
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function stopLossAuditWalletHtml(wallet = {}) {
  const lastCheck = wallet.lastTriggerCheckAt || wallet.lastCheckedAt || "";
  const status = wallet.triggerStatus || wallet.exitStatus || wallet.status || "watching";
  const move = wallet.lastMovePct ?? wallet.lastGrossMovePct;
  const moveLabel = Number.isFinite(Number(move)) ? `${Number(move).toFixed(2)}%` : "not checked";
  const netMove = Number.isFinite(Number(wallet.lastNetMovePct)) ? ` net ${Number(wallet.lastNetMovePct).toFixed(2)}%` : "";
  const retry = wallet.retryAfterAt ? ` | retry ${ageTextFromSeconds(secondsSince(wallet.retryAfterAt))}` : "";
  const lastError = wallet.lastError || wallet.lastPriceEstimateError || "";
  const stopLossLine = Number.isFinite(Number(wallet.lastStopLossPct))
    ? `SL ${Number(wallet.lastStopLossPct).toFixed(2).replace(/\.00$/, "")}% triggers at -${Number(wallet.lastStopLossTriggerPct || wallet.lastStopLossPct).toFixed(2).replace(/\.00$/, "")}%`
    : "SL off";
  const takeProfitLine = Number.isFinite(Number(wallet.lastTakeProfitPct))
    ? `TP +${Number(wallet.lastTakeProfitPct).toFixed(2).replace(/\.00$/, "")}%`
    : "TP off";
  const triggerReadout = `should SL: ${wallet.lastShouldTriggerStopLoss === true ? "yes" : "no"} | should TP: ${wallet.lastShouldTriggerTakeProfit === true ? "yes" : "no"}`;
  return `
    <div class="audit-wallet-row">
      <div>
        <strong>${escapeHtml(wallet.label || "Wallet")}</strong>
        <span>${escapeHtml(wallet.shortPublicKey || "")}</span>
      </div>
      <div>
        <span>${escapeHtml(status)}${wallet.triggerKind ? ` / ${escapeHtml(wallet.triggerKind)}` : ""}</span>
        <small>Move ${escapeHtml(moveLabel)}${escapeHtml(netMove)} | checked ${escapeHtml(ageTextFromSeconds(secondsSince(lastCheck)))}${escapeHtml(retry)}</small>
        <small>${escapeHtml(stopLossLine)} | ${escapeHtml(takeProfitLine)} | ${escapeHtml(triggerReadout)} | Source: ${escapeHtml(wallet.lastTriggerPriceSource || wallet.lastEstimateSource || "unknown")}</small>
        ${wallet.triggerReason ? `<small>Reason: ${escapeHtml(wallet.triggerReason)}</small>` : ""}
        ${wallet.sellSignature ? `<small>Sell tx: ${escapeHtml(wallet.sellSignature)}</small>` : ""}
        ${lastError ? `<small class="warning-text">Error: ${escapeHtml(lastError)}</small>` : ""}
      </div>
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
  const allRows = activeLivePairs?.rows || [];
  const rows = terminalFeedRowsWindow("live", allRows);
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
          <span>${escapeHtml(activeBucketLabel)} | ${escapeHtml(rows.length)}/${escapeHtml(allRows.length)} shown</span>
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
        ${terminalFeedLoadMoreHtml("live", allRows, `${activeBucketLabel} pairs`)}
      </main>
    </section>
  `;
}

function livePairBucketDescription(bucket) {
  const descriptions = {
    live: "Fresh launch feed. Focuses on pairs that just appeared, usually under 60 seconds old.",
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
  const allRows = state.watchlist?.rows || [];
  const rows = terminalFeedRowsWindow("watchlist", allRows);
  return `
    <section class="terminal-layout watchlist-terminal">
      <main class="terminal-main">
        <div class="terminal-title-row">
          <div>
            <h3>Watchlist</h3>
            <p>Saved coins refresh while this tab is open. Use Trade for the chart page or Quick Buy for fast preset/custom buys.</p>
          </div>
          <span>${rows.length}/${allRows.length} watched</span>
        </div>
        <div class="section-actions terminal-actions">
          <button class="primary" data-refresh-watchlist>${state.watchlistLoading ? "Refreshing..." : "Refresh Watchlist"}</button>
          <button data-tab="live">Live Pairs</button>
          <button data-tab="sniper">Sniper</button>
          <button data-tab="kol">KOL Tracker</button>
        </div>
        ${rows.length ? tokenSignalRowsHtml(rows, { context: "watchlist", shareBuilder: (row) => manualCoinWatchShareText(row.tokenMint) }) : emptyState("No watched coins yet", "Tap Watch on Live Pairs, Sniper, or KOL signals to save coins here.")}
        ${terminalFeedLoadMoreHtml("watchlist", allRows, "watched pairs")}
      </main>
      <aside class="trade-side order-ticket-stack">
        <article class="order-ticket">
          <h3>Fast Actions</h3>
          <p>Quick Buy uses your saved preset when available, or asks for a custom SOL amount.</p>
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
  const visibleRows = uniqueSignalRows(rows);
  if (!visibleRows.length) {
    return `
      ${options.hideToolbar ? "" : fastPresetToolbarHtml(options.context || "scanner")}
      ${emptyState(options.emptyTitle || "Scanning signals", options.emptyMessage || "No rows are visible in this category yet. The feed keeps the last good data and refreshes in the background.")}
    `;
  }
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
      ${visibleRows.map((row, index) => tokenSignalRowHtml(row, index, { ...options, shareText: shareBuilder(row) })).join("")}
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
    <article class="signal-row" data-token-chart="${escapeHtml(row.tokenMint)}" data-token-chart-source="${escapeHtml(options.context || "signal-row")}">
      <div class="signal-token">
        ${livePairAvatarHtml(row)}
        <div>
          <div class="signal-name-row">
            <strong data-token-chart="${escapeHtml(row.tokenMint)}" data-token-chart-source="${escapeHtml(options.context || "signal-title")}">${escapeHtml(row.symbol || row.shortMint || shortAddress(row.tokenMint))}</strong>
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
          ${pairRiskBadgesHtml(row)}
        </div>
      </div>
      <div class="signal-cell"><span>${escapeHtml(row.pairAgeLabel || formatAgeFromRow(row) || "age unknown")}</span><small>${escapeHtml(row.scalpSetup || row.momentum || `#${index + 1}`)}</small></div>
      <div class="signal-cell"><span>${escapeHtml(firstStatLabel(row.liquidityLabel, compactUsd(row.liquidityUsd)))}</span><small>${formatChangeHtml(row.h1)}</small></div>
      <div class="signal-cell"><span>${escapeHtml(firstStatLabel(row.marketCapLabel, compactUsd(row.marketCap)))}</span><small>${escapeHtml(row.category || row.signalType || "signal")}</small></div>
      <div class="signal-cell"><span>${escapeHtml(row.txnsLabel || row.winRateLabel || "n/a")}</span><small>${escapeHtml(row.bestPickScore ? `Score ${row.bestPickScore}/100` : row.valueLabel || row.smartMoney || "")}</small></div>
      <div class="signal-cell volume-windows">
        <span>${escapeHtml(firstStatLabel(row.volumeH1Label, row.volumeLabel, compactUsd(row.volumeH1)))}</span>
        <small>${volumeWindowItems(row).map(([label, value]) => `${label} ${value}`).join(" | ")}</small>
      </div>
      <div class="signal-actions">
        ${primaryAction === "snipe" ? `<button type="button" class="primary" data-sniper-buy="${escapeHtml(row.tokenMint)}">${escapeHtml(actionLabel)}</button>` : `<button type="button" class="primary" data-token-trade="${escapeHtml(row.tokenMint)}" data-token-trade-source="${escapeHtml(options.context || "signal-row")}">Trade</button><button type="button" data-quick-buy-token="${escapeHtml(row.tokenMint)}" data-quick-buy-source="${escapeHtml(options.context || "signal-row")}">${escapeHtml(quickBuyButtonLabel())}</button>`}
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
  const seconds = rowAgeSeconds(row);
  if (Number.isFinite(seconds)) {
    if (seconds < 60) return `${Math.max(1, Math.floor(seconds))}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  }
  const trustedSourceAge = ["source-age", "trusted-source-age"].includes(String(row.pairAgeSource || "").toLowerCase());
  const minutes = trustedSourceAge ? Number(row.pairAgeMinutes) : Number.NaN;
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
  const fallbackSrc = tokenMascotSrc(row.tokenMint || row.symbol || row.name);
  const safeFallbackSrc = escapeHtml(fallbackSrc);
  const imageUrl = normalizeImageUrl(row.imageUrl);
  if (imageUrl) {
    return `<div class="live-pair-avatar"><img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(row.symbol || row.name || "Token")}" loading="lazy" decoding="async" fetchpriority="low" width="42" height="42" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='${safeFallbackSrc}';"><span>${escapeHtml(label)}</span></div>`;
  }
  return `<div class="live-pair-avatar fallback with-mascot"><img src="${safeFallbackSrc}" alt="" aria-hidden="true" loading="lazy" decoding="async" fetchpriority="low" width="42" height="42" onerror="this.hidden=true;"><span>${escapeHtml(label)}</span></div>`;
}

function tokenMascotIndex(value = "") {
  const text = String(value || "");
  let total = 0;
  for (let index = 0; index < text.length; index += 1) total += text.charCodeAt(index);
  return (total % 5) + 1;
}

function tokenMascotSrc(value = "") {
  return `./assets/slimewire/png/token-mascots/token-mascot-${tokenMascotIndex(value)}.png`;
}

function livePairShareText(row) {
  return `Live pair ${row.symbol || shortAddress(row.tokenMint)} spotted on SlimeWire: MC ${row.marketCapLabel || "n/a"}, liq ${row.liquidityLabel || "n/a"}, age ${row.pairAgeLabel || formatAgeFromRow(row) || "age unknown"}.`;
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
  const allRows = state.scan.rows || [];
  const rows = terminalFeedRowsWindow("sniper", allRows);
  if (!allRows.length) {
    return emptyState("No usable picks", "Refresh again or choose a different mode.");
  }
  return `
    <p class="scan-meta">${escapeHtml(state.scan.label)} | ${rows.length}/${allRows.length} shown | scored ${state.scan.scanned} | qualified ${state.scan.qualified} | mode-fit ${state.scan.modeFit} | display pool ${state.scan.displayPool || 0}</p>
    ${tokenSignalRowsHtml(rows, { context: "sniper", primaryAction: "snipe", primaryActionLabel: "Snipe", shareBuilder: sniperShareText })}
    ${terminalFeedLoadMoreHtml("sniper", allRows, "snipe candidates")}
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

function ogreAgentInitialMessage() {
  return {
    role: "assistant",
    text: "Ogre Agent ready. Ask me how to use the panel, or tell me to open charts, refresh feeds, show positions, or prepare a buy/sell for confirmation.",
    actions: [
      { label: "Show Positions", type: "open_tab", tab: "positions" },
      { label: "Refresh Feeds", type: "refresh_feeds" },
      { label: "Best Picks", type: "open_tab", tab: "ogreAi" }
    ]
  };
}

function ogreAgentMessages() {
  if (!Array.isArray(state.ogreAgentMessages) || !state.ogreAgentMessages.length) {
    state.ogreAgentMessages = [ogreAgentInitialMessage()];
  }
  return state.ogreAgentMessages;
}

function ogreAgentContext() {
  return {
    route: state.route,
    activeTab: state.activeTab,
    smartChartToken: state.smartChartToken || "",
    tradeToken: state.tradeToken || "",
    livePairBucket: state.livePairBucket || "",
    slimeScopeMode: state.slimeScopeMode || "",
    walletConnected: Boolean(state.user?.connectedWallet || state.connectedWalletBalance?.publicKey),
    walletCount: portfolioWalletCount(),
    positionCount: portfolioPositions().length,
    totalSol: totalSol().toFixed(4),
    selectedTradePreset: activePresetDetail("trade"),
    selectedBundlePreset: activePresetDetail("bundle")
  };
}

function ogreAgentActionLabel(action = {}) {
  return String(action.label || action.type || "Run").slice(0, 40);
}

function ogreAgentMessageHtml(message = {}, messageIndex = 0) {
  const actions = Array.isArray(message.actions) ? message.actions.slice(0, 4) : [];
  return `
    <div class="ogre-agent-message ${message.role === "user" ? "user" : "assistant"}">
      <p>${escapeHtml(message.text || "")}</p>
      ${actions.length ? `<div class="ogre-agent-actions">${actions.map((action, actionIndex) => `<button type="button" data-ogre-agent-action="${messageIndex}:${actionIndex}">${escapeHtml(ogreAgentActionLabel(action))}</button>`).join("")}</div>` : ""}
    </div>
  `;
}

function ogreAgentHtml() {
  const open = Boolean(state.ogreAgentOpen);
  const messages = ogreAgentMessages();
  return `
    <div class="ogre-agent-shell ${open ? "is-open" : ""}" data-ogre-agent-root>
      <button type="button" class="ogre-agent-bubble" data-ogre-agent-toggle aria-label="Open Ogre Agent" aria-expanded="${open ? "true" : "false"}">
        <img src="./assets/slimewire/clean-ui/side_nav_icons/active/ogre_ai.png" alt="Ogre Agent">
        <span>Ask</span>
      </button>
      <section class="ogre-agent-panel" ${open ? "" : "hidden"} aria-live="polite">
        <header>
          <div>
            <span>Ogre Agent</span>
            <small>Panel help + safe task staging</small>
          </div>
          <button type="button" data-ogre-agent-close aria-label="Close Ogre Agent">×</button>
        </header>
        <div class="ogre-agent-feed" data-ogre-agent-feed>
          ${messages.map(ogreAgentMessageHtml).join("")}
          ${state.ogreAgentLoading ? `<div class="ogre-agent-message assistant"><p>Ogre is thinking...</p></div>` : ""}
        </div>
        <div class="ogre-agent-composer">
          <textarea data-ogre-agent-input rows="2" placeholder="Ask: buy this CA with 25% preset, show positions, how do I use TP/SL..."></textarea>
          <button type="button" data-ogre-agent-send ${state.ogreAgentLoading ? "disabled" : ""}>Send</button>
        </div>
        ${state.ogreAgentStatus ? `<small class="ogre-agent-status">${escapeHtml(state.ogreAgentStatus)}</small>` : ""}
      </section>
    </div>
  `;
}

function renderOgreAgent() {
  let root = document.querySelector("[data-ogre-agent-mount]");
  if (!root) {
    root = document.createElement("div");
    root.dataset.ogreAgentMount = "true";
    document.body.appendChild(root);
  }
  root.innerHTML = ogreAgentHtml();
  const feed = root.querySelector("[data-ogre-agent-feed]");
  if (feed) feed.scrollTop = feed.scrollHeight;
}

function pushOgreAgentMessage(message = {}) {
  state.ogreAgentMessages = [...ogreAgentMessages(), message].slice(-16);
}

function ogreAgentActionFromKey(key = "") {
  const [messageIndexText, actionIndexText] = String(key).split(":");
  const message = ogreAgentMessages()[Number(messageIndexText)];
  return message?.actions?.[Number(actionIndexText)] || null;
}

async function runOgreAgentAction(action = {}) {
  const type = String(action.type || "");
  const tokenMint = String(action.tokenMint || action.mint || state.smartChartToken || state.tradeToken || "").trim();
  if (type === "open_tab") {
    state.route = "terminal";
    state.activeTab = action.tab || "terminal";
    window.history.pushState({}, "", action.path || "/terminal");
    render({ force: true });
    return;
  }
  if (type === "open_chart" || type === "prepare_buy") {
    if (!tokenMint) {
      state.ogreAgentStatus = "Paste a token CA in the message first.";
      renderOgreAgent();
      return;
    }
    openTokenChart(tokenRefFromMint(tokenMint, { source: "ogre-agent" }), {
      defaultTab: type === "prepare_buy" ? "buy" : "chart",
      focusAmountInput: type === "prepare_buy",
      source: "ogre-agent"
    });
    return;
  }
  if (type === "prepare_sell") {
    state.route = "terminal";
    state.activeTab = "positions";
    window.history.pushState({}, "", "/terminal");
    state.ogreAgentStatus = action.percent ? `Sell ${action.percent}% staged. Use the position card confirm buttons.` : "Open Positions and use the sell confirm buttons.";
    render({ force: true });
    return;
  }
  if (type === "refresh_wallet") {
    runDeferredUiTask(() => refreshWalletNow({ force: true, reason: "ogre_agent" }));
    state.ogreAgentStatus = "Wallet refresh started.";
    renderOgreAgent();
    return;
  }
  if (type === "refresh_feeds") {
    runDeferredUiTask(() => refreshVisibleTerminalFeeds({ force: true, reason: "ogre_agent" }));
    state.ogreAgentStatus = "Feed refresh started.";
    renderOgreAgent();
    return;
  }

  if (action.type === "open_quick_buy") {
    const tokenMint = String(action.tokenMint || action.mint || state.selectedToken?.mint || state.selectedToken?.pairAddress || "").trim();
    if (!tokenMint) {
      state.ogreAgentStatus = "Send me a token address first, then I can open the buy panel.";
      renderOgreAgent();
      return;
    }
    openQuickBuy(tokenMint, { source: "ogre-agent-open-buy", forceModal: true });
    state.ogreAgentStatus = "Buy panel opened. Review it and confirm with your wallet.";
    renderOgreAgent();
    return;
  }

  if (action.type === "confirm_buy") {
    const tokenMint = String(action.tokenMint || action.mint || state.selectedToken?.mint || state.selectedToken?.pairAddress || "").trim();
    const amountSol = Number(action.amountSol || action.sol || action.amount || 0);
    if (!tokenMint || !Number.isFinite(amountSol) || amountSol <= 0) {
      if (tokenMint) openQuickBuy(tokenMint, { source: "ogre-agent-buy-missing-amount", forceModal: true });
      state.ogreAgentStatus = tokenMint
        ? "Buy panel opened. Pick the SOL amount and confirm with your wallet."
        : "Tell me the token address and amount, like: buy 0.1 SOL of CA.";
      renderOgreAgent();
      return;
    }
    const shortMint = typeof shortAddress === "function" ? shortAddress(tokenMint) : tokenMint;
    const confirmed = window.confirm(`Ogre Agent will prepare a ${amountSol} SOL buy for ${shortMint}. You will still need to confirm in your wallet. Continue?`);
    if (!confirmed) {
      state.ogreAgentStatus = "Buy canceled.";
      renderOgreAgent();
      return;
    }
    const walletIndex = Number.isFinite(Number(action.walletIndex)) ? Number(action.walletIndex) : 0;
    const slippageBps = Number.isFinite(Number(action.slippageBps)) ? Number(action.slippageBps) : undefined;
    state.ogreAgentLoading = true;
    state.ogreAgentStatus = `Preparing ${amountSol} SOL buy...`;
    renderOgreAgent();
    try {
      const result = await executeQuickBuyAmount({ tokenMint, walletIndex, amountSol, slippageBps, source: "ogre-agent-confirm-buy" });
      state.ogreAgentStatus = result?.ok === false
        ? (result.error || result.message || "Buy failed. Check wallet/RPC status and retry.")
        : "Buy submitted. Refreshing wallet and positions in the background.";
      if (typeof refreshWalletNow === "function") void refreshWalletNow({ force: true, reason: "ogre_agent_buy" });
      if (typeof refreshPositionsNow === "function") void refreshPositionsNow({ force: true, reason: "ogre_agent_buy" });
    } catch (error) {
      state.ogreAgentStatus = error?.message || "Buy failed. Check wallet/RPC status and retry.";
    } finally {
      state.ogreAgentLoading = false;
      renderOgreAgent();
    }
    return;
  }

  if (action.type === "confirm_sell") {
    const tokenMint = String(action.tokenMint || action.mint || action.ca || state.selectedToken?.mint || state.selectedToken?.pairAddress || "").trim();
    const percent = String(action.percent || action.percentText || "100").replace(/[^0-9.]/g, "") || "100";
    if (!tokenMint) {
      state.activeTab = "positions";
      state.ogreAgentStatus = "I opened Positions. Pick a token or tell me the CA to sell.";
      render();
      return;
    }
    state.ogreAgentLoading = true;
    state.ogreAgentStatus = `Preparing sell ${percent}%...`;
    renderOgreAgent();
    try {
      await sellPositionPercent(tokenMint, percent);
      state.ogreAgentStatus = `Sell ${percent}% submitted. Refreshing wallet and positions in the background.`;
      if (typeof refreshWalletNow === "function") void refreshWalletNow({ force: true, reason: "ogre_agent_sell" });
      if (typeof refreshPositionsNow === "function") void refreshPositionsNow({ force: true, reason: "ogre_agent_sell" });
    } catch (error) {
      state.ogreAgentStatus = error?.message || "Sell failed. Check wallet/RPC status and retry.";
    } finally {
      state.ogreAgentLoading = false;
      renderOgreAgent();
    }
    return;
  }  state.ogreAgentStatus = "Action noted. Ask Ogre to open a panel, chart, refresh, or prepare a trade.";
  renderOgreAgent();
}

async function sendOgreAgentMessage() {
  const input = document.querySelector("[data-ogre-agent-input]");
  const message = String(input?.value || "").trim();
  if (!message || state.ogreAgentLoading) return;
  if (input) input.value = "";
  pushOgreAgentMessage({ role: "user", text: message, actions: [] });
  state.ogreAgentLoading = true;
  state.ogreAgentStatus = "";
  renderOgreAgent();
  try {
    const data = await api("/api/web/ogre-agent/chat", {
      method: "POST",
      body: JSON.stringify({ message, context: ogreAgentContext() }),
      timeoutMs: 14_000,
      dedupe: false,
      preserveSafeError: true
    });
    pushOgreAgentMessage({
      role: "assistant",
      text: data?.agent?.reply || "I can help with panel functions, charts, positions, presets, and safe task staging.",
      actions: data?.agent?.actions || []
    });
    state.ogreAgentStatus = data?.agent?.modelPowered ? "AI reply" : "Fast local Ogre reply";
  } catch (error) {
    pushOgreAgentMessage({
      role: "assistant",
      text: "Ogre Agent is still here, but the server reply timed out. I can still open panels, refresh feeds, and stage chart actions.",
      actions: [
        { label: "Refresh Feeds", type: "refresh_feeds" },
        { label: "Positions", type: "open_tab", tab: "positions" },
        { label: "Live Terminal", type: "open_tab", tab: "terminal" }
      ]
    });
    state.ogreAgentStatus = error?.message || "Agent reply failed.";
  } finally {
    state.ogreAgentLoading = false;
    renderOgreAgent();
  }
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

function markLockInPointerHandled(target) {
  try {
    target.dataset.lockInPointerHandledAt = String(Date.now());
  } catch {
    // Dataset markers are only to avoid duplicate touch+click handling.
  }
}

function lockInPointerRecentlyHandled(target) {
  const handledAt = Number(target?.dataset?.lockInPointerHandledAt || 0);
  return Number.isFinite(handledAt) && Date.now() - handledAt < 900;
}

document.addEventListener("pointerup", (event) => {
  const source = event.target instanceof Element
    ? event.target
    : event.target?.parentElement;
  const target = source?.closest?.("[data-open-login], [data-connect-login-toggle]");
  if (!target) return;
  event.preventDefault();
  markLockInPointerHandled(target);
  openLoginModal({
    connectPanel: target.matches("[data-connect-login-toggle]") || state.route === "connect",
    source: target.matches("[data-connect-login-toggle]") ? "connect-lock-in" : "top-lock-in"
  });
}, { capture: true });

document.addEventListener("keydown", (event) => {
  const agentInput = event.target?.closest?.("[data-ogre-agent-input]");
  if (agentInput && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void sendOgreAgentMessage();
    return;
  }

  if (event.key !== "Escape") return;

  if (state.ogreAgentOpen) {
    state.ogreAgentOpen = false;
    state.ogreAgentStatus = "";
    renderOgreAgent();
    return;
  }

  if (!state.loginModalOpen && !state.quickBuyModal?.open) return;
  if (state.quickBuyModal?.open) {
    closeQuickBuyModal();
    return;
  }
  state.loginCollapsed = true;
  state.loginModalOpen = false;
  render({ force: true });
});

function prefetchTokenChartFromElement(element = null, source = "interaction") {
  const target = element?.closest?.("[data-token-trade], [data-token-chart], [data-preview-token]");
  if (!target) return false;
  const mint = target.dataset.tokenTrade || target.dataset.tokenChart || target.dataset.previewToken || "";
  if (!mint) return false;
  const sourceHint = String(source || "");
  const isInteractionPrefetch = sourceHint.includes("prefetch");
  if (isInteractionPrefetch) {
    const now = Date.now();
    const lastAt = Number(state.smartChartInteractionPrefetchAt || 0);
    const seen = state.smartChartInteractionPrefetchSeen || {};
    if (lastAt && now - lastAt < SMART_CHART_INTERACTION_PREFETCH_MIN_INTERVAL_MS) return false;
    if (Number(seen[mint] || 0) && now - Number(seen[mint]) < SMART_CHART_INTERACTION_PREFETCH_SAME_MINT_MS) return false;
    const recent = (state.smartChartInteractionPrefetchRecent || []).filter((at) => now - Number(at || 0) < SMART_CHART_INTERACTION_PREFETCH_WINDOW_MS);
    if (recent.length >= SMART_CHART_INTERACTION_PREFETCH_MAX_PER_WINDOW) {
      state.smartChartInteractionPrefetchRecent = recent;
      return false;
    }
    state.smartChartInteractionPrefetchAt = now;
    state.smartChartInteractionPrefetchRecent = [...recent, now];
    state.smartChartInteractionPrefetchSeen = { ...seen, [mint]: now };
  }
  return prefetchTokenChart(tokenRefFromMint(mint, {
    source: target.dataset.tokenTradeSource || target.dataset.tokenChartSource || source
  }), {
    source: target.dataset.tokenTradeSource || target.dataset.tokenChartSource || source
  });
}

document.addEventListener("pointerenter", (event) => {
  prefetchTokenChartFromElement(event.target instanceof Element ? event.target : null, "pointer-prefetch");
}, true);

document.addEventListener("touchstart", (event) => {
  prefetchTokenChartFromElement(event.target instanceof Element ? event.target : null, "touch-prefetch");
}, { capture: true, passive: true });

document.addEventListener("focusin", (event) => {
  prefetchTokenChartFromElement(event.target instanceof Element ? event.target : null, "focus-prefetch");
}, true);

document.addEventListener("click", async (event) => {
  const source = event.target instanceof Element
    ? event.target
    : event.target?.parentElement;
  const tekSummary = source?.closest?.(".tabs .nav-tool-group summary");
  if (tekSummary) {
    event.preventDefault();
    const group = tekSummary.closest(".nav-tool-group");
    state.navTekOpen = !Boolean(group?.open);
    setStoredNavTekOpen(state.navTekOpen);
    if (group) group.open = state.navTekOpen;
    return;
  }  const target = source?.closest?.("button, a, [data-preview-token], [data-token-chart], [data-token-trade], [data-quick-buy-token], [data-quick-trade-token]");
  if (!target) return;

  if (target.matches("[data-ogre-agent-toggle]")) {
    state.ogreAgentOpen = !state.ogreAgentOpen;
    state.ogreAgentStatus = state.ogreAgentOpen ? state.ogreAgentStatus : "";
    renderOgreAgent();
    return;
  }

  if (target.matches("[data-ogre-agent-close]")) {
    state.ogreAgentOpen = false;
    state.ogreAgentStatus = "";
    renderOgreAgent();
    return;
  }

  if (target.matches("[data-ogre-agent-send]")) {
    void sendOgreAgentMessage();
    return;
  }

  if (target.matches("[data-ogre-agent-action]")) {
    const actionKey = target.dataset.ogreAgentAction;
    const action = (state.ogreAgentMessages || [])
      .flatMap((message) => Array.isArray(message.actions) ? message.actions : [])
      .find((item) => item.key === actionKey || item.label === actionKey || item.type === actionKey);
    void runOgreAgentAction(action || { type: actionKey });
    return;
  }

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
    const clickStartedAt = perfNow();
    setPositionRefreshAction("clicked", { startedAt: clickStartedAt });
    recordPerfEvent({
      component: "ui-action",
      action: "position-refresh-click-to-state",
      durationMs: perfNow() - clickStartedAt,
      details: "top-refresh-wallet"
    });
    refreshWalletNow({ force: true, deep: false, reason: "manual_header_click" }).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-ogre-tek-refresh]")) {
    await loadOgreTekData({ force: true }).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-ogre-ai-start]")) {
    await startOgreAiRun();
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
      openTokenChart(tokenRefFromMint(token, { source: "global-search" }), {
        defaultTab: "buy",
        focusAmountInput: true,
        source: "global-search"
      });
    }
    return;
  }
  if (target.matches("[data-token-chart]")) {
    event.preventDefault();
    const mint = target.dataset.tokenChart || target.dataset.previewToken || "";
    if (blockRawSignalTokenIfUnsafe(mint)) return;
    openTokenChart(tokenRefFromMint(target.dataset.tokenChart || target.dataset.previewToken || "", {
      source: target.dataset.tokenChartSource || "token-card"
    }), {
      defaultTab: target.dataset.tokenChartTab || "chart",
      focusAmountInput: false,
      source: target.dataset.tokenChartSource || "token-card"
    });
    return;
  }
  if (target.matches("[data-token-trade]")) {
    event.preventDefault();
    event.stopPropagation();
    const mint = target.dataset.tokenTrade || "";
    if (blockRawSignalTokenIfUnsafe(mint)) return;
    openTokenChart(tokenRefFromMint(target.dataset.tokenTrade || "", {
      source: target.dataset.tokenTradeSource || "trade-button"
    }), {
      defaultTab: "buy",
      focusAmountInput: true,
      source: target.dataset.tokenTradeSource || "trade-button"
    });
    return;
  }
  if (target.matches("[data-quick-buy-token]")) {
    event.preventDefault();
    event.stopPropagation();
    openQuickBuy(tokenRefFromMint(target.dataset.quickBuyToken || "", {
      source: target.dataset.quickBuySource || "quick-buy-button"
    }), {
      source: target.dataset.quickBuySource || "quick-buy-button"
    });
    return;
  }
  if (target.matches("[data-quick-buy-close]")) {
    event.preventDefault();
    closeQuickBuyModal();
    return;
  }
  if (target.matches("[data-quick-buy-modal-preset]")) {
    event.preventDefault();
    state.quickBuyModal = {
      ...state.quickBuyModal,
      amountSol: target.dataset.quickBuyModalPreset || "",
      status: `${target.dataset.quickBuyModalPreset || ""} SOL selected.`,
      error: ""
    };
    render({ force: true });
    return;
  }
  if (target.matches("[data-quick-buy-confirm]")) {
    event.preventDefault();
    await confirmQuickBuyModal();
    return;
  }
  if (target.matches("[data-preview-token]")) {
    const token = target.dataset.previewToken || "";
    if (token) {
      openTokenChart(tokenRefFromMint(token, { source: "preview-card" }), {
        defaultTab: "chart",
        source: "preview-card"
      });
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
    if (!lockInPointerRecentlyHandled(target)) openLoginPanel({ connectPanel: true, source: "connect-lock-in" });
    return;
  }
  if (target.matches("[data-login-tab]")) {
    state.loginModalTab = target.dataset.loginTab === "create" ? "create" : "login";
    render({ force: true });
    focusLoginField(false);
    return;
  }
  if (target.matches("[data-connect-password-login]")) {
    await passwordLogin();
    return;
  }
  if (target.matches("[data-send-email-code]")) {
    await sendEmailLoginCode();
    return;
  }
  if (target.matches("[data-web-code-login]")) {
    await emailCodeLogin();
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
  if (target.matches("[data-close-login]")) {
    state.loginCollapsed = true;
    state.loginModalOpen = false;
    render({ force: true });
    return;
  }
  if (target.matches("[data-web-signup-connect]")) {
    await createAccountAndConnectWallet();
    return;
  }
  if (target.matches("[data-open-login]")) {
    if (!lockInPointerRecentlyHandled(target)) openLoginPanel({ connectPanel: state.route === "connect", source: "top-lock-in" });
    return;
  }
  if (target.matches("[data-browse-guest]")) {
    state.loginCollapsed = true;
    state.route = "terminal";
    state.activeTab = "terminal";
    window.history.pushState({}, "", "/terminal");
    render();
    refreshTerminalEntryInBackground("browse-terminal");
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
  if (target.matches("[data-connect-wallet]")) {
    const providerId = target.dataset.connectWallet || "solana";
    if (providerId && providerId !== "solana") {
      await connectBrowserWallet(providerId, { returnPath: "/terminal" });
      return;
    }
    openWalletConnectChooser({ returnPath: "/terminal" });
    return;
  }
  if (target.matches("[data-connect-wallet-provider]")) {
    await connectBrowserWallet(target.dataset.connectWalletProvider || "solana", { returnPath: "/terminal" });
    return;
  }
  if (target.matches("[data-wallet-connect-close]")) {
    state.walletConnectMenuOpen = false;
    render({ force: true });
    return;
  }
  if (target.matches("[data-disconnect-wallet]")) {
    await disconnectBrowserWallet();
    return;
  }
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
  if (target.matches("[data-quick-trade-token]")) {
    event.preventDefault();
    event.stopPropagation();
    openQuickBuy(tokenRefFromMint(target.dataset.quickTradeToken || "", { source: "legacy-quick-trade" }), {
      source: "legacy-quick-trade"
    });
    return;
  }
  if (target.matches("[data-quick-bundle-token]")) await quickPresetBundle(target.dataset.quickBundleToken || "");
  if (target.matches("[data-smart-chart-token]")) {
    openTokenChart(tokenRefFromMint(target.dataset.smartChartToken || "", { source: "chart-button" }), {
      defaultTab: "chart",
      source: "chart-button"
    });
    return;
  }
  if (target.matches("[data-smart-chart-view]")) {
    const nextView = target.dataset.smartChartView || "chart";
    state.smartChartView = ["chart", "chartTxns", "txns", "info"].includes(nextView) ? nextView : "chart";
    render();
    return;
  }
  if (target.matches("[data-chart-trade-tab]")) {
    state.chartTradeTab = target.dataset.chartTradeTab === "sell" ? "sell" : "buy";
    render({ force: true });
    if (state.chartTradeTab === "buy") requestAnimationFrame(() => $("[data-chart-buy-amount]")?.focus());
    return;
  }
  if (target.matches("[data-chart-buy-preset]")) {
    const input = $("[data-chart-buy-amount]");
    if (input) input.value = target.dataset.chartBuyPreset || "";
    state.quickBuyAmountOverride = normalizedQuickBuyAmount(target.dataset.chartBuyPreset || "");
    syncQuickBuyActionLabels();
    return;
  }
  if (target.matches("[data-chart-confirm-buy]")) {
    const tokenMint = target.dataset.chartConfirmBuy || state.smartChartToken || "";
    try {
      await executeQuickBuyAmount({
        tokenMint,
        walletIndex: $("[data-chart-buy-wallet]")?.value || "",
        amountSol: normalizedQuickBuyAmount($("[data-chart-buy-amount]")?.value || ""),
        slippageBps: $("[data-chart-buy-slippage]")?.value || "400",
        source: "chart-buy-panel"
      });
      state.chartTradeTab = "buy";
      render({ force: true });
    } catch (error) {
      setError(error.message);
    }
    return;
  }
  if (target.matches("[data-chart-confirm-sell]")) {
    const percent = $("[data-chart-sell-percent]")?.value || "";
    if (percent) await sellPositionPercent(target.dataset.chartConfirmSell || "", percent);
    return;
  }
  if (target.matches("[data-smart-chart-open]")) {
    const tokenMint = String($("[data-smart-chart-input]")?.value || "").trim();
    if (!tokenMint) {
      setError("Paste a token CA first.");
      return;
    }
    openTokenChart(tokenRefFromMint(tokenMint, { source: "smart-chart-search" }), {
      defaultTab: "buy",
      focusAmountInput: true,
      source: "smart-chart-search"
    });
    return;
  }
  if (target.matches("[data-refresh-feeds]")) {
    runDeferredUiTask(() => refreshVisibleTerminalFeeds({ force: true, reason: "manual-refresh-feeds" }));
    return;
  }
  if (target.matches("[data-terminal-load-more]")) {
    const tabKey = target.dataset.terminalLoadMore || state.activeTab;
    increaseTerminalFeedVisibleLimit(tabKey, terminalFeedResultCount(tabKey));
    recordTerminalFeedEvent(tabKey, {
      requestId: terminalFeedRuntime(tabKey).lastRequestId || "",
      status: terminalFeedRuntime(tabKey).lastStatus || "render",
      reason: "load-more",
      resultCount: terminalFeedResultCount(tabKey),
      renderedCount: terminalFeedRenderedCount(tabKey),
      hasMore: terminalFeedResultCount(tabKey) > terminalFeedRenderedCount(tabKey),
      stale: terminalFeedIsStale(tabKey),
      errorCode: terminalFeedRuntime(tabKey).errorCode || "",
      errorMessage: terminalFeedRuntime(tabKey).errorMessage || ""
    });
    render({ force: true });
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
  if (target.matches("[data-create-automation-wallet]")) await createAutomationWallet();
  if (target.matches("[data-tpsl-status-button]")) {
    if (target.dataset.tpslState === "enabled") {
      state.activeTab = "profile";
      navigateTo("/terminal", "profile");
      state.automationDelegationStatus = state.automationDelegationStatus || "Server exits are enabled for managed wallets.";
      render({ force: true });
    } else {
      await updateAutomationPermission("enable");
    }
    return;
  }
  if (target.matches("[data-automation-permission]")) await updateAutomationPermission(target.dataset.automationPermission || "enable");
  if (target.matches("[data-run-trade-plans]")) await runTradePlanCheck();
  if (target.matches("[data-restore-backup]")) await restoreWalletBackup();
  if (target.matches("[data-export-backup]")) await exportWalletBackup();
  if (target.matches("[data-import-wallet]")) await importWallet();
  if (target.matches("[data-remove-wallet]")) await removeManagedWallet(target.dataset.removeWallet || "", target.dataset.walletLabel || "");
  if (target.matches("[data-wallet-sweep-action]")) await runWalletSweepAction(target.dataset.walletSweepAction || "");
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
    state.kolMode = target.dataset.kolMode || state.kolMode;
    resetTerminalFeedVisibleLimit("kol");
    await refreshTerminalFeed("kol", { force: true, reason: "kol-mode-switch" }).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-refresh]")) {
    await refreshTerminalFeed("kol", { force: true, reason: "manual-kol-refresh" }).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-wallet-scan]")) {
    state.kolWallet = String($("[data-kol-wallet]")?.value || "").trim();
    resetTerminalFeedVisibleLimit("kol");
    await refreshTerminalFeed("kol", { force: true, reason: "kol-wallet-scan" }).catch((error) => setError(error.message));
    return;
  }
  if (target.matches("[data-kol-scan-wallet]")) {
    state.kolWallet = String(target.dataset.kolScanWallet || "").trim();
    resetTerminalFeedVisibleLimit("kol");
    await refreshTerminalFeed("kol", { force: true, reason: "kol-signal-wallet-scan" }).catch((error) => setError(error.message));
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
    const clickStartedAt = perfNow();
    setPositionRefreshAction("clicked", { startedAt: clickStartedAt });
    recordPerfEvent({
      component: "ui-action",
      action: "position-refresh-click-to-state",
      durationMs: perfNow() - clickStartedAt,
      details: state.activeTab || "terminal"
    });
    if (!state.user || !state.token) {
      if (terminalFeedDefinition(state.activeTab)) await refreshTerminalFeed(state.activeTab, { force: true, reason: "manual-refresh-all" }).catch((error) => setError(error.message));
      else setError("Browsing is open. Create or connect a profile when you want saved wallets, balances, or trades.");
      finishPositionRefreshAction("success");
    } else {
      const refreshStartedAt = perfNow();
      if (state.activeTab === "positions") {
        refreshPositionsOnly({ force: true, reason: "manual-positions-refresh" }).catch((error) => {
          finishPositionRefreshAction("error", { error: publicErrorMessage(error?.message || "Position refresh failed") });
          setError(error.message);
          render();
        });
      } else {
        refreshWalletNow({ force: true, deep: false, reason: "manual_refresh_all" }).catch((error) => setError(error.message));
        refreshTerminalFeed(state.activeTab, { force: true, reason: "manual-refresh-all" }).catch((error) => setError(error.message));
      }
      perfMeasure("position-refresh-request-start", refreshStartedAt, {
        component: "positions",
        cacheHit: false,
        details: state.activeTab || "terminal"
      });
    }
  }

  if (target.matches("[data-tab]")) {
    const startedAt = perfNow();
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
    const hasCachedTabData = terminalFeedHasData(state.activeTab);
    render();
    const refreshPromise = refreshTerminalFeed(state.activeTab, {
      silent: true,
      ifStale: true,
      force: !hasCachedTabData,
      reason: "tab-switch"
    }).catch((error) => setError(error.message));
    if (!hasCachedTabData) await refreshPromise;
    perfMeasure("tab-switch", startedAt, {
      component: "terminal",
      cacheHit: hasCachedTabData,
      details: state.activeTab
    });
  }

  if (target.matches("[data-refresh-scan]")) {
    runDeferredUiTask(() => refreshTerminalFeed("sniper", { force: true, reason: "manual-sniper-refresh" }));
  }

  const refreshLivePairsButton = target.closest?.("[data-refresh-live-pairs]");
  if (refreshLivePairsButton) {
    const feedKey = state.activeTab === "slimeScope" ? "slimeScope" : state.activeTab === "terminal" ? "terminal" : "live";
    runDeferredUiTask(() => refreshTerminalFeed(feedKey, { force: true, reason: "manual-live-refresh" }));
  }

  if (target.matches("[data-refresh-watchlist]")) {
    runDeferredUiTask(() => refreshTerminalFeed("watchlist", { force: true, reason: "manual-watchlist-refresh" }));
  }

  const livePairBucketButton = target.closest?.("[data-live-pair-bucket]");
  if (livePairBucketButton) {
    state.livePairBucket = livePairBucketButton.dataset.livePairBucket || "live";
    state.livePairs = currentLivePairs();
    state.livePairsLastUpdatedAt = currentLivePairsUpdatedAt();
    resetTerminalFeedVisibleLimit("live");
    resetTerminalFeedVisibleLimit("slimeScope");
    render();
    runDeferredUiTask(() => refreshTerminalFeed(state.activeTab === "terminal" ? "terminal" : "live", { force: true, reason: "live-bucket-switch" }));
  }

  const slimeScopeModeButton = target.closest?.("[data-slime-scope-mode]");
  if (slimeScopeModeButton) {
    state.slimeScopeMode = slimeScopeModeButton.dataset.slimeScopeMode || "new";
    state.activeTab = "slimeScope";
    resetTerminalFeedVisibleLimit("slimeScope");
    render();
    runDeferredUiTask(() => refreshTerminalFeed("slimeScope", { force: true, reason: "slime-scope-mode-switch" }));
  }

  if (target.matches("[data-scan-mode]")) {
    resetTerminalFeedVisibleLimit("sniper");
    state.scanMode = target.dataset.scanMode || state.scanMode;
    render();
    runDeferredUiTask(() => loadScan(state.scanMode));
  }

  const copyValue = target.getAttribute("data-copy");
  if (copyValue) {
    const originalLabel = target.getAttribute("data-copy-label") || target.textContent || "Copy";
    await navigator.clipboard.writeText(copyValue);
    writeText(target, "Copied");
    setTimeout(() => { writeText(target, originalLabel); }, 1000);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (state.quickBuyModal?.open) {
    closeQuickBuyModal();
    return;
  }
  if (state.walletConnectMenuOpen) {
    state.walletConnectMenuOpen = false;
    render({ force: true });
    return;
  }
  if (!state.loginCollapsed) {
    state.loginCollapsed = true;
    render({ force: true });
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
    resetTerminalFeedVisibleLimit("live");
    resetTerminalFeedVisibleLimit("slimeScope");
    render();
    runDeferredUiTask(() => refreshLivePairBuckets({ silent: true, force: true }));
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
    state.smartChartZoom = Math.min(115, Math.max(60, Number(target.value) || 72));
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

function resumeLiveFeeds(event = null) {
  if (document.hidden) return;
  const resumeReason = event?.persisted ? "pageshow-bfcache" : "visibility-return";
  const recovered = recoverAppShell(resumeReason, { forcePaint: true });
  flushDeferredRender();
  if (!recovered && event?.persisted && state.route === "terminal") {
    render({ force: true, preserveSmartChartFrame: state.activeTab === "smartChart" });
  }
  if (resumeLiveFeedsTimer) window.clearTimeout(resumeLiveFeedsTimer);
  resumeLiveFeedsTimer = window.setTimeout(() => {
    resumeLiveFeedsTimer = null;
    if (document.hidden || state.route !== "terminal") return;
    if (isPostTradeRefreshActive()) {
      recordPerfEvent({
        component: "post-trade",
        action: "hidden-feed-refresh-skipped",
        durationMs: 0,
        requestId: state.postTradeRefresh?.attemptId || "",
        details: state.activeTab || "terminal"
      });
      return;
    }
    refreshTerminalFeed(state.activeTab, {
      silent: true,
      ifStale: true,
      force: false,
      reason: "visibility-focus-return"
    }).catch((error) => setError(error.message));
    if (state.user && state.token && terminalFeedIsStale("positions")) {
      refreshWalletPositions({
        force: false,
        fast: true,
        silent: true,
        reason: "visibility-position-resume",
        timeoutMs: POSITIONS_FAST_REFRESH_TIMEOUT_MS
      }).catch(() => {});
    }
    scheduleLivePairsAutoRefresh();
    scheduleKolAutoRefresh();
    scheduleWatchlistAutoRefresh();
    scheduleActiveTerminalFeedRefresh();
  }, APP_RESUME_REFRESH_DEBOUNCE_MS);
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) resumeLiveFeeds();
});

window.addEventListener("focus", resumeLiveFeeds);
window.addEventListener("pageshow", resumeLiveFeeds);
window.addEventListener("online", resumeLiveFeeds);
window.addEventListener("pagehide", () => {
  if (!resumeLiveFeedsTimer) return;
  window.clearTimeout(resumeLiveFeedsTimer);
  resumeLiveFeedsTimer = null;
});

function startAppWatchdog() {
  if (appWatchdogTimer) window.clearInterval(appWatchdogTimer);
  appWatchdogTimer = window.setInterval(() => {
    if (document.hidden) return;
    recoverAppShell("watchdog");
  }, APP_WATCHDOG_INTERVAL_MS);
}

async function initializeApp() {
  installPerformanceInstrumentation();
  installCrashInstrumentation();
  installSlimewireImageFallbacks();
  startAppWatchdog();
  prewarmSlimewireImageAssets();
  applyChartRouteFromLocation();
  await handleMobileWalletReturn();
  render();
  await loadSession();
  if (state.route === "terminal") {
    void refreshVisibleTerminalFeeds({
      silent: true,
      ifStale: true,
      reason: "site-load"
    }).catch((error) => setError(error.message));
    if (state.activeTab === "ogreTek") {
      await loadOgreTekData({ silent: true }).catch((error) => setError(error.message));
    }
    render({ preserveSmartChartFrame: state.activeTab === "smartChart" });
  }
}

initializeApp();


function setPumpLiveStatus(message) {
  state.pumpLiveStatus = message;
  state.pumpLiveLastActionAt = Date.now();
  render();
}

function currentPumpLiveToken() {
  const draft = typeof collectLaunchCoinDraft === "function" ? collectLaunchCoinDraft() : state.launchCoinDraft || {};
  const mint = launchCoinLiveMint(draft);
  return {
    tokenMint: mint,
    mint,
    address: mint,
    name: draft.name || draft.tokenName || "Pump launch",
    symbol: draft.symbol || draft.ticker || "PUMP",
    dexId: "pumpfun",
    source: "pump-live",
    bonded: false,
    isBonded: false,
    bondingStatus: "pump"
  };
}

function handlePumpLiveClick(event) {
  const button = event.target.closest("[data-pump-live-action]");
  if (!button) return;
  event.preventDefault();

  const action = button.getAttribute("data-pump-live-action");
  const token = currentPumpLiveToken();
  const mint = token.tokenMint;
  if (!mint) {
    setPumpLiveStatus("Paste or launch a CA first, then Pump Live can attach to it.");
    return;
  }

  if (action === "chart") {
    if (typeof openTokenChart === "function") {
      openTokenChart(token, { defaultTab: "chart", view: "chartTxns", source: "pump-live" });
      setPumpLiveStatus("Opened Pump chart with transactions inside Slime.");
    } else {
      setPumpLiveStatus("Chart panel is still loading. Try again in a moment.");
    }
    return;
  }

  if (action === "copy") {
    const routeId = pumpLiveStreamRouteId(mint);
    navigator.clipboard?.writeText(routeId).then(
      () => setPumpLiveStatus("Copied Pump Live stream route ID."),
      () => setPumpLiveStatus("Stream route ID ready: " + routeId)
    );
    return;
  }

  if (action === "obs") {
    const providerNote = pumpLiveProviderConfigured()
      ? "Use the configured provider ingest URL for OBS or mobile live setup."
      : "Set PUMP_LIVE_PROVIDER plus ingest/playback envs before real video goes live.";
    setPumpLiveStatus(providerNote);
    return;
  }

  if (action === "end") {
    setPumpLiveStatus("Pump Live ended for this launch. Chart and transactions stay available.");
    return;
  }

  if (action === "go") {
    if (!pumpLiveProviderConfigured()) {
      setPumpLiveStatus("Pump Live UI is ready. Configure provider envs to enable real video without loading Render.");
      return;
    }
    setPumpLiveStatus("Pump Live staged. Start the stream from your provider, OBS, or mobile app.");
  }
}

document.addEventListener("click", handlePumpLiveClick);



/* SLIME_STABLE_PUMP_CHART_V2: one local chart renderer, compact controls, no global feed side effects. */
function slimePumpChartEscape(value) {
  const text = String(value ?? "");
  if (typeof escapeHtml === "function") return escapeHtml(text);
  return text.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function slimePumpChartToken(input) {
  if (input && typeof input === "object") return input.token || input.pair || input.item || input;
  return state.smartChartToken || {};
}

function slimePumpChartId(token) {
  return String(token.tokenMint || token.mint || token.address || token.pairAddress || token.poolAddress || token.baseMint || token.ca || "").trim();
}

function slimePumpChartShort(value) {
  const text = String(value || "");
  return text.length > 14 ? `${text.slice(0, 6)}...${text.slice(-6)}` : text;
}

function slimePumpChartNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (value == null || value === "") return NaN;
  const parsed = Number(String(value).replace(/[$,%\s,]/g, ""));
  return Number.isFinite(parsed) ? parsed : NaN;
}

function slimePumpChartValue(row) {
  const fields = [row.priceUsd, row.priceUSD, row.usdPrice, row.tokenPriceUsd, row.price, row.close, row.c, row.marketCap, row.mc, row.fdv, row.liquidityUsd];
  for (const field of fields) {
    const value = slimePumpChartNumber(field);
    if (Number.isFinite(value) && value > 0) return value;
  }
  return NaN;
}

function slimePumpChartTime(row) {
  const value = row.time || row.timestamp || row.blockTime || row.createdAt || row.updatedAt || row.date;
  if (!value) return Date.now();
  if (typeof value === "number") return value < 100000000000 ? value * 1000 : value;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric < 100000000000 ? numeric * 1000 : numeric;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function slimePumpChartArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  return value.items || value.rows || value.data || value.trades || value.transactions || [];
}

function slimePumpChartMatches(row, token, ids) {
  if (!ids.length) return false;
  const haystack = [row.tokenMint, row.mint, row.address, row.pairAddress, row.poolAddress, row.baseMint, row.ca, row.symbol, row.baseSymbol, row.tokenSymbol, row.name, row.tokenName]
    .map((value) => String(value || "").toLowerCase())
    .join(" ");
  return ids.some((id) => haystack.includes(id));
}


/* SLIME_CHART_SNAPSHOT_FALLBACK_V1: draw a labeled snapshot curve from real token stats when tick feed is still warming. */
function slimePumpChartSeed(text = "") {
  return String(text || "").split("").reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 17);
}

function slimePumpChartFallbackBase(token = {}) {
  const values = [
    token.priceUsd, token.priceUSD, token.usdPrice, token.tokenPriceUsd, token.price,
    token.marketCap, token.marketCapUsd, token.mc, token.fdv, token.fdvUsd,
    token.liquidityUsd, token.liquidity?.usd, token.volume5m, token.volumeM15,
    token.volumeH1, token.volumeH24, token.volume?.m5, token.volume?.h1, token.volume?.h24
  ].map(slimePumpChartNumber).filter((value) => Number.isFinite(value) && value > 0);
  if (values.length) return values[0];
  const progress = typeof slimeScopeProgressPct === "function" ? Number(slimeScopeProgressPct(token)) : NaN;
  if (Number.isFinite(progress) && progress > 0) return Math.max(1, progress * 1000);
  const ageMinutes = Number(token.ageMinutes || token.pairAgeMinutes || token.launchAgeMinutes || 0);
  return Math.max(1, ageMinutes || 1);
}

function slimePumpChartFallbackEvents(tokenInput) {
  const token = slimePumpChartToken(tokenInput);
  const id = slimePumpChartId(token) || token.symbol || token.name || "slime";
  const base = slimePumpChartFallbackBase(token);
  const seed = slimePumpChartSeed(id);
  const liquidity = Math.max(1, slimePumpChartNumber(token.liquidityUsd || token.liquidity?.usd) || base);
  const volume = Math.max(0, slimePumpChartNumber(token.volume5m || token.volumeM15 || token.volumeH1 || token.volume?.m5 || token.volume?.h1) || 0);
  const progress = typeof slimeScopeProgressPct === "function" ? Math.max(0, Math.min(100, Number(slimeScopeProgressPct(token)) || 0)) : 0;
  const activityBias = Math.max(-8, Math.min(18, (volume / liquidity) * 18 + progress / 12));
  const now = Date.now();
  return Array.from({ length: 34 }, (_item, index) => {
    const phase = (index + (seed % 13)) / 4.2;
    const wave = Math.sin(phase) * (3.5 + (seed % 7) * 0.28);
    const drift = ((index / 33) - 0.5) * activityBias;
    const micro = (((seed >> (index % 11)) & 7) - 3) * 0.32;
    const value = Math.max(0.0000001, base * (1 + (wave + drift + micro) / 100));
    return {
      row: { ...token, snapshotFallback: true },
      value,
      time: now - (33 - index) * 15_000,
      side: "snapshot"
    };
  });
}
function slimePumpChartEvents(tokenInput) {
  const token = slimePumpChartToken(tokenInput);
  const ids = [slimePumpChartId(token), token.symbol, token.baseSymbol, token.name]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter((value, index, arr) => value.length >= 3 && arr.indexOf(value) === index);
  const sources = [
    { direct: true, rows: token.candles },
    { direct: true, rows: token.chartCandles },
    { direct: true, rows: token.priceHistory },
    { direct: true, rows: token.trades },
    { direct: true, rows: token.transactions },
    { direct: true, rows: token.recentTrades },
    { direct: true, rows: token.sourceEvents },
    { direct: false, rows: state.liveTrades },
    { direct: false, rows: state.liveTradeRows },
    { direct: false, rows: state.tradeTape },
    { direct: false, rows: state.recentTrades },
    { direct: false, rows: state.pumpTrades },
    { direct: false, rows: state.pumpActivity },
    { direct: false, rows: state.livePairs },
    { direct: false, rows: state.livePairsRows },
    { direct: false, rows: state.freshPairs },
    { direct: false, rows: state.slimeScopePairs }
  ];
  const events = [];
  for (const source of sources) {
    const rows = slimePumpChartArray(source.rows).slice(-350);
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      if (!source.direct && !slimePumpChartMatches(row, token, ids)) continue;
      const value = slimePumpChartValue(row);
      if (!Number.isFinite(value) || value <= 0) continue;
      const sideRaw = String(row.side || row.type || row.action || row.tradeType || "").toLowerCase();
      events.push({ row, value, time: slimePumpChartTime(row), side: sideRaw.includes("sell") ? "sell" : sideRaw.includes("buy") ? "buy" : "trade" });
    }
  }
  const snapshot = slimePumpChartValue(token);
  if (Number.isFinite(snapshot) && snapshot > 0) events.push({ row: token, value: snapshot, time: Date.now(), side: "snapshot" });
  return events.sort((a, b) => a.time - b.time).filter((event, index, arr) => index === 0 || event.time !== arr[index - 1].time || event.value !== arr[index - 1].value).slice(-120);
}

function slimePumpChartFormat(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (value >= 1000000) return `$${(value / 1000000).toFixed(value >= 10000000 ? 1 : 2)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(value >= 10000 ? 1 : 2)}K`;
  if (value >= 1) return `$${value.toFixed(value >= 100 ? 0 : 3)}`;
  return `$${value.toPrecision(3)}`;
}

function slimePumpChartSource() {
  const raw = String(state.pumpChartSource || "slime").toLowerCase();
  return raw === "pump" || raw === "dex" ? raw : "slime";
}

function pumpChartSvgHtml(tokenInput = {}, options = {}) {
  const token = slimePumpChartToken(tokenInput);
  const mint = slimePumpChartId(token);
  const source = slimePumpChartSource();
  const mode = String(state.pumpChartMode || "line").toLowerCase() === "candles" ? "candles" : "line";
  const timeframe = String(state.pumpChartTimeframe || "5m");
  const events = slimePumpChartEvents(token);
  const recent = events.slice(-70);
  const values = recent.map((event) => event.value);
  const min = values.length ? Math.min(...values) : NaN;
  const max = values.length ? Math.max(...values) : NaN;
  const width = 720;
  const height = 260;
  const pad = 22;
  const range = Number.isFinite(max - min) && max !== min ? max - min : 1;
  const pointX = (index) => recent.length <= 1 ? width / 2 : pad + (index / (recent.length - 1)) * (width - pad * 2);
  const pointY = (value) => height - pad - ((value - (Number.isFinite(min) ? min : 0)) / range) * (height - pad * 2);
  const linePath = recent.map((event, index) => `${index ? "L" : "M"}${pointX(index).toFixed(1)},${pointY(event.value).toFixed(1)}`).join(" ");
  const areaPath = recent.length > 1 ? `${linePath} L${pointX(recent.length - 1).toFixed(1)},${height - pad} L${pointX(0).toFixed(1)},${height - pad} Z` : "";
  const candleWidth = Math.max(4, Math.min(12, (width - pad * 2) / Math.max(recent.length * 2, 1)));
  const candleSvg = recent.map((event, index) => {
    const previous = recent[Math.max(0, index - 1)] || event;
    const open = previous.value;
    const close = event.value;
    const high = Math.max(open, close);
    const low = Math.min(open, close);
    const x = pointX(index);
    const yOpen = pointY(open);
    const yClose = pointY(close);
    const yHigh = pointY(high);
    const yLow = pointY(low);
    const up = close >= open;
    return `<g class="slime-pump-candle ${up ? "up" : "down"}"><line x1="${x.toFixed(1)}" y1="${yHigh.toFixed(1)}" x2="${x.toFixed(1)}" y2="${yLow.toFixed(1)}" /><rect x="${(x - candleWidth / 2).toFixed(1)}" y="${Math.min(yOpen, yClose).toFixed(1)}" width="${candleWidth.toFixed(1)}" height="${Math.max(2, Math.abs(yClose - yOpen)).toFixed(1)}" rx="2" /></g>`;
  }).join("");
  const dexUrl = mint ? `https://dexscreener.com/solana/${encodeURIComponent(mint)}?embed=1&theme=dark&trades=1&info=0` : "";
  const chartBody = source === "dex" && dexUrl
    ? `<iframe class="slime-pump-dex-frame" src="${slimePumpChartEscape(dexUrl)}" title="Dex chart" loading="lazy"></iframe>`
    : recent.length > 1
      ? `<svg class="slime-pump-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><defs><linearGradient id="slimePumpArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#7cff4f" stop-opacity="0.34"/><stop offset="100%" stop-color="#7cff4f" stop-opacity="0.02"/></linearGradient></defs><path class="slime-pump-area" d="${areaPath}" />${mode === "candles" ? candleSvg : `<path class="slime-pump-line" d="${linePath}" />`}</svg>`
      : `<div class="slime-pump-wait"><strong>Waiting for live feed</strong><span>${source === "pump" ? "Pump pre-bonding ticks" : "Slime live ticks"} will draw here from real feed data only.</span></div>`;

  return `
    <div class="slime-pump-chart-card" data-slime-pump-chart>
      <div class="slime-pump-chart-top">
        <div class="slime-pump-source-row">
          ${["slime", "pump", "dex"].map((item) => `<button type="button" class="${source === item ? "active" : ""}" data-slime-pump-source="${item}">${item === "slime" ? "Slime" : item === "pump" ? "Pump" : "Dex"}</button>`).join("")}
        </div>
        <div class="slime-pump-chart-row">
          <button type="button" class="${mode === "line" ? "active" : ""}" data-slime-pump-mode="line">Line</button>
          <button type="button" class="${mode === "candles" ? "active" : ""}" data-slime-pump-mode="candles">Candles</button>
          ${["1m", "5m", "15m", "1h", "4h"].map((item) => `<button type="button" class="${timeframe === item ? "active" : ""}" data-slime-pump-time="${item}">${item}</button>`).join("")}
          ${snapshotMode ? `<span class="slime-pump-snapshot-dot">Snapshot</span>` : `<span class="slime-pump-live-dot">Live</span>`}
        </div>
      </div>
      <div class="slime-pump-chart-body">${chartBody}</div>
      <div class="slime-pump-metrics">
        <div><span>Latest</span><strong>${slimePumpChartEscape(slimePumpChartFormat(values[values.length - 1]))}</strong></div>
        <div><span>Range</span><strong>${slimePumpChartEscape(Number.isFinite(min) && Number.isFinite(max) ? `${slimePumpChartFormat(min)} - ${slimePumpChartFormat(max)}` : "n/a")}</strong></div>
        <div><span>Source</span><strong>${slimePumpChartEscape(snapshotMode ? "Slime snapshot" : source === "slime" ? "Slime default" : source === "pump" ? "Pump on-site" : "Dex on-site")}</strong></div>
      </div>
    </div>`;
}

function smartChartPumpActivityHtml(tokenInput = {}) {
  const events = slimePumpChartEvents(tokenInput).slice(-40).reverse();
  const rows = events.map((event) => {
    const age = Math.max(0, Math.floor((Date.now() - event.time) / 1000));
    const ageText = age < 60 ? `${age}s` : `${Math.floor(age / 60)}m`;
    const row = event.row || {};
    const wallet = row.wallet || row.owner || row.trader || row.signer || row.user || "wallet";
    return `<div class="slime-pump-tape-row ${event.side}"><span>${slimePumpChartEscape(ageText)}</span><strong>${slimePumpChartEscape(event.side)}</strong><span>${slimePumpChartEscape(slimePumpChartFormat(event.value))}</span><span>${slimePumpChartEscape(slimePumpChartShort(wallet))}</span></div>`;
  }).join("");
  return `<section class="pump-native-activity slime-pump-tape"><div class="slime-pump-tape-head"><h4>Live Transactions</h4><span>${events.length} events</span></div><div class="slime-pump-tape-list">${rows || `<div class="slime-pump-wait small"><strong>No live transactions yet</strong><span>Rows appear as the feed sees buys and sells.</span></div>`}</div></section>`;
}

function slimePumpChartRerender() {
  if (state.slimePumpChartRendering) return;
  state.slimePumpChartRendering = true;
  requestAnimationFrame(() => {
    state.slimePumpChartRendering = false;
    if (typeof render === "function") render();
  });
}

document.addEventListener("click", (event) => {
  const source = event.target.closest("[data-slime-pump-source]");
  const mode = event.target.closest("[data-slime-pump-mode]");
  const time = event.target.closest("[data-slime-pump-time]");
  const button = source || mode || time;
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  if (source) state.pumpChartSource = source.getAttribute("data-slime-pump-source") || "slime";
  if (mode) state.pumpChartMode = mode.getAttribute("data-slime-pump-mode") || "line";
  if (time) state.pumpChartTimeframe = time.getAttribute("data-slime-pump-time") || "5m";
  slimePumpChartRerender();
});

if (!window.__slimeStablePumpChartTimer) {
  window.__slimeStablePumpChartTimer = setInterval(() => {
    if (document.visibilityState !== "visible") return;
    if (!document.querySelector("[data-slime-pump-chart]")) return;
    slimePumpChartRerender();
  }, 8000);
}




