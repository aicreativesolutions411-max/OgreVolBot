import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

async function readText(file) {
  return fs.readFile(path.join(rootDir, file), "utf8");
}

async function readJsonIfExists(fileName, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, fileName), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function bool(text, pattern) {
  return pattern.test(text);
}

function groupCounts(events, keyFn) {
  const counts = new Map();
  for (const event of events) {
    const key = keyFn(event);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key, count]) => ({ key, count }));
}

function percentileMs(events, quantile = 0.95) {
  const values = events
    .map((event) => Number(event.durationMs || 0))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const index = Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1);
  return values[index];
}

const [appSource, cssSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("web/public/slimewire-final-overrides.css"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const longTasks = events.filter((event) => event.action === "long-task" && Number(event.durationMs || 0) >= 50).slice(-30);
const renderEvents = events.filter((event) => event.action === "render");
const apiDedupeEvents = events.filter((event) => event.action === "api-dedupe");
const walletDedupeEvents = events.filter((event) => event.action === "wallet-refresh-dedupe");

const report = {
  longTasks: {
    count: longTasks.length,
    latest: longTasks.at(-1) || null,
    over100ms: longTasks.filter((event) => Number(event.durationMs || 0) >= 100).length,
    p95Ms: percentileMs(longTasks)
  },
  webApiP95Ms: percentileMs(events.filter((event) => event.component === "api" || /api|refresh|load-all/.test(event.action || ""))),
  excessiveRenders: groupCounts(renderEvents, (event) => event.details || event.component || "render"),
  duplicateIntervals: {
    terminalFeedTimerSingleton: bool(appSource, /let terminalFeedTimer = null/) && bool(appSource, /clearTimeout\(terminalFeedTimer\)/),
    livePairsTimerSingleton: bool(appSource, /let livePairsTimer = null/) && bool(appSource, /clearTimeout\(livePairsTimer\)/),
    scannerTimerSingleton: bool(appSource, /let scanTimer = null/) && bool(appSource, /clearTimeout\(scanTimer\)/),
    kolTimerSingleton: bool(appSource, /let kolTimer = null/) && bool(appSource, /clearTimeout\(kolTimer\)/),
    watchlistTimerSingleton: bool(appSource, /let watchlistTimer = null/) && bool(appSource, /clearTimeout\(watchlistTimer\)/)
  },
  hiddenPolling: {
    documentHiddenGuard: bool(appSource, /document\.hidden/),
    activeHeavyFeedOnly: bool(appSource, /state\.activeTab/) && bool(appSource, /scheduleActiveTerminalFeedRefresh/),
    hiddenTabsPausedOrSlowed: bool(appSource, /document\.hidden/) && bool(appSource, /return/),
    hiddenLivePairBucketsNotWarmedByDefault: bool(appSource, /warmAll = false/) && !bool(appSource, /livePairsBackgroundWarmupTick/)
  },
  liveRendering: {
    batchedLivePairRender: bool(appSource, /function scheduleLivePairsRender/) && bool(appSource, /batched-live-render/),
    activeBucketOnlyRefresh: bool(appSource, /async function refreshLivePairBuckets\(\{ silent = false, force = false, warmAll = false \}/),
    visibilityResumeSingleOwner: bool(appSource, /visibility-focus-return/) && !bool(appSource, /resumeLiveFeeds\(\)[\s\S]*refreshLivePairBuckets\(/)
  },
  slowComponents: [...events]
    .sort((a, b) => Number(b.durationMs || 0) - Number(a.durationMs || 0))
    .slice(0, 15)
    .map((event) => ({
      at: event.at,
      route: event.route,
      component: event.component,
      action: event.action,
      durationMs: event.durationMs,
      cacheHit: event.cacheHit,
      stale: event.stale,
      errorCode: event.errorCode
    })),
  dedupe: {
    apiDedupeEvents: apiDedupeEvents.length,
    walletRefreshDedupeEvents: walletDedupeEvents.length,
    requestDedupeImplemented: bool(appSource, /const apiInFlight = new Map\(\)/) && bool(appSource, /apiInFlight\.has\(dedupeKey\)/),
    walletDedupeImplemented: bool(appSource, /let walletRefreshPromise = null/) && bool(appSource, /wallet-refresh-dedupe/)
  },
  mobilePaintCost: {
    contentVisibility: bool(cssSource, /content-visibility:\s*auto/),
    reducedMobileBlur: bool(cssSource, /backdrop-filter: none !important/),
    reducedMotion: bool(cssSource, /prefers-reduced-motion/),
    lazyImages: bool(appSource, /loading="lazy"/) || bool(appSource, /loading: "lazy"/)
  },
  consoleErrorsWarnings: {
    capturedByCommand: false,
    note: "This command reports stored frontend performance events and static risk checks. Use browser console for live warnings."
  },
  secretsPrinted: false
};

console.log("SLIMEWIRE FRONTEND PERF DEBUG");
console.log(JSON.stringify(report, null, 2));
