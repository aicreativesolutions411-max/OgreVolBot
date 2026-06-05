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

async function fileSize(file) {
  try {
    const stat = await fs.stat(path.join(rootDir, file));
    return stat.size;
  } catch {
    return 0;
  }
}

async function imageStats(dir) {
  const absolute = path.join(rootDir, dir);
  let count = 0;
  let bytes = 0;
  async function walk(folder) {
    let entries = [];
    try {
      entries = await fs.readdir(folder, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(entry.name)) {
        count += 1;
        bytes += (await fs.stat(full)).size;
      }
    }
  }
  await walk(absolute);
  return { count, bytes };
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
    .slice(0, 10)
    .map(([key, count]) => ({ key, count }));
}

const [appSource, serverSource, packageSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readText("package.json"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const recent = events.slice(-50);
const report = {
  slowestRoutesComponents: [...events]
    .sort((a, b) => Number(b.durationMs || 0) - Number(a.durationMs || 0))
    .slice(0, 12)
    .map((event) => ({
      at: event.at,
      route: event.route,
      component: event.component,
      action: event.action,
      durationMs: event.durationMs,
      resultCount: event.resultCount,
      cacheHit: event.cacheHit,
      errorCode: event.errorCode
    })),
  longTasksOver50ms: events
    .filter((event) => event.action === "long-task" && Number(event.durationMs || 0) >= 50)
    .slice(-20),
  largestRenderCounts: groupCounts(events.filter((event) => event.action === "render"), (event) => event.details || event.component || "render"),
  pollingIntervals: {
    livePairsTimer: bool(appSource, /let livePairsTimer = null/) && bool(appSource, /scheduleLivePairsAutoRefresh/),
    scanTimer: bool(appSource, /let scanTimer = null/) && bool(appSource, /scheduleScannerAutoRefresh/),
    kolTimer: bool(appSource, /let kolTimer = null/) && bool(appSource, /scheduleKolAutoRefresh/),
    watchlistTimer: bool(appSource, /let watchlistTimer = null/) && bool(appSource, /scheduleWatchlistAutoRefresh/),
    terminalFeedTimer: bool(appSource, /let terminalFeedTimer = null/) && bool(appSource, /scheduleActiveTerminalFeedRefresh/)
  },
  hiddenPollingIntervals: {
    documentHiddenGuard: bool(appSource, /document\.hidden/),
    heavyTabAutoPollPaused: bool(appSource, /\["terminal", "live", "slimeScope", "kol", "watchlist", "sniper"\]\.includes\(state\.activeTab\)/),
    activeHeavyFeedOnly: bool(appSource, /loadLivePairs\(\{ silent: true, bucket: state\.livePairBucket, force: true \}\)/)
  },
  duplicatedRequests: {
    apiDedupeEvents: events.filter((event) => event.action === "api-dedupe").length,
    walletRefreshDedupeEvents: events.filter((event) => event.action === "wallet-refresh-dedupe").length,
    dedupeByPath: groupCounts(events.filter((event) => event.action === "api-dedupe"), (event) => event.details || "unknown")
  },
  bundleChunks: {
    "web/dist/app.js": await fileSize("web/dist/app.js"),
    "web/dist/tailwind.css": await fileSize("web/dist/tailwind.css"),
    "web/dist/slimewire-final-overrides.css": await fileSize("web/dist/slimewire-final-overrides.css"),
    "web/public/app.js": await fileSize("web/public/app.js")
  },
  imageLoading: await imageStats("web/dist/assets"),
  consoleErrorsWarnings: {
    capturedByCommand: false,
    note: "Use the browser console for live console errors; this command reports stored app performance events and static risk signals."
  },
  instrumentation: {
    frontendPerfEvents: bool(appSource, /function recordPerfEvent/),
    longTaskObserver: bool(appSource, /PerformanceObserver/) && bool(appSource, /longtask/),
    backendPerfEndpoint: bool(serverSource, /\/api\/web\/perf-event/),
    backendSanitizesPerfEvents: bool(serverSource, /function safePerfEventText/) && !/recordPerformanceEvent[\s\S]{0,1200}(privateKey|seed|Authorization|password)/i.test(serverSource),
    packageScriptPresent: bool(packageSource, /"debug:perf": "node scripts\/debug-perf\.js"/)
  },
  recentPerformanceEvents: recent
};

console.log("SLIMEWIRE PERFORMANCE DEBUG");
console.log(JSON.stringify(report, null, 2));
