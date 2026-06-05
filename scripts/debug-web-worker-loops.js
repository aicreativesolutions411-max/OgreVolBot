import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(file) {
  return fs.readFile(path.join(rootDir, file), "utf8");
}

function matches(text, pattern) {
  return pattern.test(text);
}

function timerNames(source = "") {
  const names = [];
  const patterns = [
    /let\s+(\w*Timer)\s*=\s*null/g,
    /let\s+(\w*RefreshTimer)\s*=\s*null/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      names.push(match[1]);
    }
  }
  return [...new Set(names)].sort();
}

const [appSource, serverSource, workerSource, packageSource] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readText("src/worker.js"),
  readText("package.json")
]);

const forbiddenWorkerSignals = [
  "processTradePlans",
  "processWebExitGuards",
  "processWebPortfolioExits",
  "runInternalWorkerTick",
  "workerTickSecretFromRequest",
  "X-Worker-Secret",
  "WORKER_SECRET",
  "tradePlanTick",
  "runPortfolioExits"
];

const browserWorkerSignals = forbiddenWorkerSignals.filter((signal) => appSource.includes(signal));
const browserTimers = timerNames(appSource);
const browserPollingLoops = browserTimers.filter((name) => !/livePairs|scan|kol|watchlist|terminalFeed|walletBackground|postTrade|perfPost|positionRefreshVisual/i.test(name));

const report = {
  webRunsWorkerLoops: browserWorkerSignals.length > 0 || browserPollingLoops.length > 0,
  browserWorkerSignals,
  browserTimers,
  browserPollingLoops,
  allowedBrowserLoops: {
    liveFeedUiPolling: matches(appSource, /scheduleLivePairsAutoRefresh/),
    activeTabPollingGuarded: matches(appSource, /function scheduleActiveTerminalFeedRefresh/) && matches(appSource, /document\.hidden/),
    hiddenHeavyTabsPaused: matches(appSource, /\["terminal", "live", "slimeScope", "kol", "watchlist", "sniper"\]\.includes\(state\.activeTab\)/),
    walletRefreshIsDedupeNotWorkerLoop: matches(appSource, /let walletRefreshPromise = null/)
  },
  backendWorkerLoops: {
    workerTickEndpoint: matches(serverSource, /async function runInternalWorkerTick/),
    dbBackedTpSlGuards: matches(serverSource, /processWebExitGuards/) && matches(serverSource, /processTradePlans/),
    workerSecretRequired: matches(serverSource, /constantTimeStringEquals\(providedSecret, CONFIG\.workerSecret\)/),
    displayCacheWarmPath: matches(serverSource, /async function warmWorkerDisplayCaches/)
  },
  webServiceInternalLoops: {
    tpSlIntervalsGated: matches(serverSource, /CONFIG\.webInternalTpSlRunnersEnabled/) && matches(serverSource, /WEB_INTERNAL_TP_SL_RUNNERS_ENABLED/),
    defaultOffWhenWorkerTickEnabled: matches(serverSource, /workerTickEnabled \? "false" : "true"/),
    startupReconcileGated: matches(serverSource, /function webLocalTpSlReconcileEnabled/) && matches(serverSource, /Web startup TP\/SL reconcile disabled/)
  },
  renderWorkerProcess: {
    standaloneWorkerIntervals: matches(workerSource, /setInterval\(\(\) => void tick\(\), CONFIG\.intervalMs\)/),
    fastTpSlInterval: matches(workerSource, /setInterval\(\(\) => void tradePlanTick\(\), CONFIG\.tradePlanIntervalMs\)/),
    broadTickSkipsFastPlanLoops: matches(workerSource, /runWebExitGuards: CONFIG\.runTradePlans && !CONFIG\.fastTpSlEnabled/) && matches(workerSource, /runTimedTradePlans: CONFIG\.runTradePlans && !CONFIG\.fastTpSlEnabled/),
    warmDisplayCachesSent: matches(workerSource, /warmDisplayCaches: CONFIG\.warmDisplayCaches/)
  },
  packageScripts: {
    worker: matches(packageSource, /"worker": "node worker\.js"/),
    debugRegistered: matches(packageSource, /"debug:web-worker-loops": "node scripts\/debug-web-worker-loops\.js"/)
  },
  conclusion: browserWorkerSignals.length === 0 && browserPollingLoops.length === 0
    ? "Browser/web UI has display polling only. Web-service interval runners and local startup/view TP/SL reconcile are gated off when the Render worker owns ticks. Worker loops run in the Render worker process."
    : "Review browserWorkerSignals/browserPollingLoops before deploy."
};

console.log("WEB WORKER LOOP DEBUG");
console.log(JSON.stringify(report, null, 2));
