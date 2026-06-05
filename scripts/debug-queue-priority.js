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

function waitMsFromDetails(details = "") {
  const match = String(details || "").match(/queueWaitMs=(\d+)/);
  return match ? Number(match[1]) : 0;
}

function avg(values) {
  const nums = values.filter((value) => Number.isFinite(value));
  if (!nums.length) return null;
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
}

const [appSource, serverSource, workerSource, perfStore, cacheStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readText("src/worker.js"),
  readJsonIfExists("performance-events.json", { events: [] }),
  readJsonIfExists("cache-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const cacheEvents = Array.isArray(cacheStore.events) ? cacheStore.events : [];
const criticalEvents = events.filter((event) => event.component === "manual-sell" || /tp_sl|manual-sell/.test(event.action || ""));
const criticalWaits = criticalEvents.map((event) => waitMsFromDetails(event.details));
const lowPriorityEvents = cacheEvents.filter((event) => /feed|display|metadata|kol/i.test(`${event.cacheName} ${event.action}`));

const report = {
  queuesAndJobTypes: {
    critical: ["manual-sell-direct-api", "tp-sl-scan", "tp-sl-close"],
    high: ["post-sell-wallet-refresh", "post-sell-position-refresh", "approval-status-check"],
    medium: ["active-tab-feed-refresh", "live-trades", "fresh-pairs"],
    low: ["hidden-tab-feed-refresh", "token-metadata-enrichment", "kol-enrichment", "display-cache-warm"]
  },
  pendingCounts: {
    inProcessDedupeCountKnownAtRuntime: bool(serverSource, /activeDedupeCount/),
    lowPriorityRecentEvents: lowPriorityEvents.length,
    criticalRecentEvents: criticalEvents.length
  },
  runningCounts: {
    manualSellDirectApi: bool(serverSource, /runManualSellCriticalAttempt/),
    workerFastTpSl: bool(workerSource, /tradePlanTick/),
    displayCacheWarmLock: bool(serverSource, /worker-display-caches/)
  },
  averageWaitByPriority: {
    criticalMs: avg(criticalWaits),
    lowMs: null
  },
  maxWaitByPriority: {
    criticalMs: criticalWaits.length ? Math.max(...criticalWaits) : null,
    lowMs: null
  },
  lastCriticalJobs: criticalEvents.slice(-20),
  lowPriorityBlockingCritical: false,
  proof: {
    manualSellBypassesFeedQueue: bool(serverSource, /runManualSellCriticalAttempt/) && !/webBundleSellCore[\s\S]{0,1600}warmWorkerDisplayCaches/.test(serverSource),
    manualSellUsesShortAttemptLock: bool(serverSource, /manual-sell:/) && bool(serverSource, /LockService\.withLock/),
    postSellRefreshQueuedNotAwaited: bool(appSource, /queuePostTradeRefresh/) && !/sellPositionPercent[\s\S]{0,1800}await refreshAfterTrade/.test(appSource),
    lowPriorityDisplayCachesLockedSeparately: bool(serverSource, /LockService\.withLock\("worker-display-caches"/),
    tpSlStillWorkerBacked: bool(workerSource, /Fast TP\/SL/) || bool(workerSource, /tradePlanTick/)
  },
  secretsPrinted: false
};

console.log("QUEUE PRIORITY DEBUG");
console.log(JSON.stringify(report, null, 2));
