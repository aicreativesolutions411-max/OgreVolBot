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

function heartbeatAgeMs(value) {
  const at = Date.parse(value || "");
  return Number.isFinite(at) ? Date.now() - at : null;
}

function workerRunning(lastHeartbeatAt) {
  const age = heartbeatAgeMs(lastHeartbeatAt);
  return Number.isFinite(age) && age < 90_000;
}

const [serverSource, workerSource, workerState, cacheStore] = await Promise.all([
  readText("src/index.js"),
  readText("src/worker.js"),
  readJsonIfExists("tpsl-worker-state.json", {}),
  readJsonIfExists("cache-events.json", { events: [] })
]);

const cacheEvents = Array.isArray(cacheStore.events) ? cacheStore.events : [];
const lockEvents = cacheEvents.filter((event) => /lock/i.test(event.action || "")).slice(-20);
const lastCloseAttempts = Array.isArray(workerState.lastCloseAttempts) ? workerState.lastCloseAttempts.slice(-20) : [];
const lastEvaluatedTrades = Array.isArray(workerState.lastEvaluatedTrades) ? workerState.lastEvaluatedTrades.slice(-20) : [];
const lastWorkerTick = workerState.lastJobRuns?.workerTick || null;
const heartbeatAge = heartbeatAgeMs(workerState.lastHeartbeatAt);

const report = {
  dataDir,
  heartbeat: {
    workerName: workerState.workerName || "",
    serviceRole: workerState.serviceRole || "",
    deployIdPresent: Boolean(workerState.deployId),
    workerRunning: workerRunning(workerState.lastHeartbeatAt),
    lastSeenAt: workerState.lastHeartbeatAt || "",
    heartbeatAgeMs: heartbeatAge,
    lastHeartbeatReason: workerState.lastHeartbeatReason || "",
    stale: !workerRunning(workerState.lastHeartbeatAt)
  },
  jobsRunning: workerState.jobsRunning || {},
  lastJobRuns: {
    workerTick: lastWorkerTick,
    lastWorkerTickAt: workerState.lastWorkerTickAt || "",
    lastWorkerTickStartedAt: workerState.lastWorkerTickStartedAt || ""
  },
  tpSlReconcile: {
    startupReconcileRanAt: workerState.startupReconcileRanAt || "",
    lastReconcile: workerState.lastReconcile || null,
    startupReconcileConfigured: bool(serverSource, /startTpSlStartupReconcile\(\)/) && bool(serverSource, /scheduleTpSlBackendReconcile\("startup"/)
  },
  locks: {
    lockServiceImplemented: bool(serverSource, /const LockService = Object\.freeze/) && bool(serverSource, /async function withCacheLock/),
    workerDisplayCacheLock: bool(serverSource, /worker-display-caches/),
    staleLocksSelfExpire: bool(serverSource, /expiresAt <= now/) && bool(serverSource, /EX/)
  },
  cacheLockEvents: lockEvents,
  workerProcessGuards: {
    refusesWebRole: bool(workerSource, /SERVICE_ROLE=web or RUN_WORKER=false/),
    broadTickOverlapGuard: bool(workerSource, /if \(activeTick\)/),
    fastTpSlOverlapGuard: bool(workerSource, /if \(activeTradePlanTick\)/),
    broadTickSkipsFastPlanLoops: bool(workerSource, /runWebExitGuards: CONFIG\.runTradePlans && !CONFIG\.fastTpSlEnabled/) && bool(workerSource, /runTimedTradePlans: CONFIG\.runTradePlans && !CONFIG\.fastTpSlEnabled/)
  },
  recentTpSlEvaluations: lastEvaluatedTrades,
  recentCloseAttempts: lastCloseAttempts,
  secretsPrinted: false
};

console.log("SLIMEWIRE WORKER HEALTH DEBUG");
console.log(JSON.stringify(report, null, 2));
