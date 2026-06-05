import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const workerSource = fs.readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugCacheSource = fs.readFileSync(new URL("../scripts/debug-cache.js", import.meta.url), "utf8");
const debugLoopsSource = fs.readFileSync(new URL("../scripts/debug-web-worker-loops.js", import.meta.url), "utf8");
const debugServiceRoleSource = fs.readFileSync(new URL("../scripts/debug-service-role.js", import.meta.url), "utf8");
const debugWorkerHealthSource = fs.readFileSync(new URL("../scripts/debug-worker-health.js", import.meta.url), "utf8");

function functionBodyFromSource(source, name) {
  const syncStart = source.indexOf(`function ${name}`);
  const asyncStart = source.indexOf(`async function ${name}`);
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} is missing`);
  const paramsStart = source.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") paramsDepth += 1;
    if (char === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("external Redis/KV cache provider is optional, sanitized, and command-checked", () => {
  assert.match(packageSource, /"redis": "\^4\.7\.0"/);
  assert.match(packageSource, /"debug:cache": "node scripts\/debug-cache\.js"/);
  assert.match(packageSource, /"debug:web-worker-loops": "node scripts\/debug-web-worker-loops\.js"/);
  assert.match(packageSource, /"debug:service-role": "node scripts\/debug-service-role\.js"/);
  assert.match(packageSource, /"debug:worker-health": "node scripts\/debug-worker-health\.js"/);
  assert.match(packageSource, /node --check scripts\/debug-cache\.js/);
  assert.match(packageSource, /node --check scripts\/debug-web-worker-loops\.js/);
  assert.match(packageSource, /node --check scripts\/debug-service-role\.js/);
  assert.match(packageSource, /node --check scripts\/debug-worker-health\.js/);
  assert.match(serverSource, /function normalizeCacheProvider/);
  assert.match(serverSource, /async function redisKv/);
  assert.match(serverSource, /async function restKvCommand/);
  assert.match(serverSource, /async function cacheGetJson/);
  assert.match(serverSource, /async function cacheSetJson/);
  assert.match(serverSource, /RENDER_KEY_VALUE_URL/);
  assert.match(serverSource, /CACHE_NAMESPACE|KV_CACHE_NAMESPACE/);
  assert.match(serverSource, /const CacheService = Object\.freeze/);
  assert.match(serverSource, /const LockService = Object\.freeze/);
  assert.match(serverSource, /const DedupeService = Object\.freeze/);
  assert.match(serverSource, /async function withCacheLock/);
  assert.match(serverSource, /async function withCacheDedupe/);
  assert.doesNotMatch(debugCacheSource, /console\.log\(process\.env/i);
  assert.doesNotMatch(debugCacheSource, /redisUrl:\s*process\.env|token:\s*process\.env/i);
  assert.match(debugCacheSource, /RENDER_KEY_VALUE_URL/);
});

test("Helius RPC is the explicit backend provider path and public fallback is disabled by default", () => {
  assert.match(serverSource, /function resolveSolanaRpcConfig/);
  assert.match(serverSource, /HELIUS_RPC_URL/);
  assert.match(serverSource, /HELIUS_DEVELOPER_RPC_URL/);
  assert.match(serverSource, /ALLOW_PUBLIC_RPC_FALLBACK/);
  assert.match(serverSource, /Public Solana RPC fallback is disabled/);
  assert.match(serverSource, /rpcProviderName: CONFIG\.rpcProviderName/);
  assert.match(serverSource, /rpcUrlHost: CONFIG\.rpcUrlHost/);
  assert.match(serverSource, /RPC_RPS_LIMIT/);
  assert.match(serverSource, /DAS_RPS_LIMIT/);
  assert.match(serverSource, /rpcMinIntervalFromRpsMs/);
  assert.match(serverSource, /event: "helius_rpc_call"/);
  assert.match(serverSource, /function rpcStatsSnapshot/);
  assert.match(serverSource, /function recordRpcMetric/);
  assert.doesNotMatch(functionBodyFromSource(serverSource, "loadConfig"), /rpcUrl:\s*process\.env\.SOLANA_RPC_URL \|\| "https:\/\/api\.mainnet-beta\.solana\.com"/);
});

test("web wallet, positions, and pnl summaries return cached data immediately and refresh in background", () => {
  const body = functionBodyFromSource(serverSource, "cachedWebSummary");
  assert.match(body, /memory-hit/);
  assert.match(body, /kv-hit/);
  assert.match(body, /memory-stale-hit-background-refresh/);
  assert.match(body, /kv-stale-hit-background-refresh/);
  assert.match(body, /startWebSummaryRefresh\(key, externalKey, cacheName, builder, ttlMs, staleMs, \{ background: true \}\)/);
  assert.doesNotMatch(body, /await recordCacheEvent/);
  assert.match(serverSource, /cachedWebSummary\("web:balances"/);
  assert.match(serverSource, /cachedWebSummary\("web:positions"/);
  assert.match(serverSource, /cachedWebSummary\("web:pnl"/);
  assert.match(serverSource, /backgroundRefreshing: summary\.backgroundRefreshing/);
  assert.match(serverSource, /stale: summary\.stale/);
  assert.match(serverSource, /lastUpdatedAt: summary\.cachedAt/);
});

test("live pair feeds use shared KV cache and stale rows while background refresh runs", () => {
  const body = functionBodyFromSource(serverSource, "webLivePairs");
  assert.match(body, /web:livePairs:/);
  assert.match(body, /cacheGetJson\(externalKey\)/);
  assert.match(body, /cacheSetJson\(externalKey, displayCacheEnvelope\(value\)/);
  assert.match(body, /cached\.promise && cached\.value/);
  assert.match(body, /backgroundRefreshing: true/);
  assert.match(body, /kv-stale-hit-background-refresh/);
});

test("backend worker warms display caches and keeps TP/SL DB-backed", () => {
  assert.match(serverSource, /async function warmWorkerDisplayCaches/);
  assert.match(serverSource, /result\.displayCaches = await runWorkerTask\("displayCaches"/);
  assert.match(serverSource, /webInternalTpSlRunnersEnabled/);
  assert.match(serverSource, /normalizeServiceRole/);
  assert.match(serverSource, /serviceRole === "web"/);
  assert.match(serverSource, /defaultWebInternalRunners/);
  assert.match(serverSource, /WEB_INTERNAL_TP_SL_RUNNERS_ENABLED/);
  assert.match(serverSource, /function webLocalTpSlReconcileEnabled/);
  assert.match(serverSource, /Web startup TP\/SL reconcile disabled/);
  assert.match(serverSource, /processWebExitGuards/);
  assert.match(serverSource, /processTradePlans/);
  assert.match(serverSource, /processWebPortfolioExits/);
  assert.match(serverSource, /constantTimeStringEquals\(providedSecret, CONFIG\.workerSecret\)/);
  assert.match(workerSource, /fastTpSlEnabled/);
  assert.match(workerSource, /runWebExitGuards: CONFIG\.runTradePlans && !CONFIG\.fastTpSlEnabled/);
  assert.match(workerSource, /runTimedTradePlans: CONFIG\.runTradePlans && !CONFIG\.fastTpSlEnabled/);
  assert.match(workerSource, /warmDisplayCaches: CONFIG\.warmDisplayCaches/);
  assert.match(workerSource, /displayCacheUserLimit: CONFIG\.displayCacheUserLimit/);
  assert.match(workerSource, /SERVICE_ROLE=web or WORKER_DISABLED=true/);
  assert.match(workerSource, /Display cache: \$/);
  assert.match(workerSource, /tradePlanTick/);
});

test("worker refresh jobs use short cache locks and dedupe without making Redis trade source of truth", () => {
  assert.match(serverSource, /worker-display-caches/);
  assert.match(serverSource, /LockService\.withLock\("worker-display-caches"/);
  assert.match(serverSource, /DedupeService\.run\(`worker-feed:\$\{bucket\}:\$\{sort\}`/);
  assert.match(serverSource, /CACHE_CONNECT_TIMEOUT_MS/);
  assert.match(serverSource, /CACHE_CIRCUIT_BREAKER_MS/);
  assert.match(serverSource, /CACHE_ENABLED/);
  assert.match(serverSource, /kvCircuitOpenUntil/);
  assert.match(functionBodyFromSource(serverSource, "redisKv"), /connectTimeout: CONFIG\.cacheConnectTimeoutMs/);
  assert.match(functionBodyFromSource(serverSource, "redisKv"), /kvCircuitOpenUntil = Date\.now\(\) \+ CONFIG\.cacheCircuitBreakerMs/);
  assert.match(serverSource, /display_cache_lock_active/);
  assert.doesNotMatch(functionBodyFromSource(serverSource, "recordTpSlWorkerEvent"), /cacheSetJson|redisKv|restKvCommand/);
  assert.match(debugWorkerHealthSource, /WORKER HEALTH DEBUG/);
  assert.match(debugWorkerHealthSource, /startupReconcileRanAt/);
  assert.match(debugWorkerHealthSource, /workerDisplayCacheLock/);
});

test("TP/SL sell reliability retries PumpPortal pools and reconciles missing token balances", () => {
  assert.match(serverSource, /function pumpPortalSellPoolAttempts/);
  assert.match(serverSource, /\["pump", "pump-amm", "auto"\]/);
  assert.match(serverSource, /for \(const pool of pools\)/);
  assert.match(serverSource, /provider: `pumpportal:\$\{pool\}`/);
  assert.match(serverSource, /function isNoLiveTokenBalanceError/);
  assert.match(serverSource, /no-live-token-balance/);
  assert.match(serverSource, /tp_sl_trade_skipped/);
  assert.match(serverSource, /no live token balance; nothing to sell after/);
});

test("web app has display polling only and debug command proves worker loops stay backend-side", () => {
  assert.doesNotMatch(appSource, /processWebExitGuards|processTradePlans|processWebPortfolioExits|runInternalWorkerTick|WORKER_SECRET|X-Worker-Secret/);
  assert.match(appSource, /scheduleActiveTerminalFeedRefresh/);
  assert.match(appSource, /document\.hidden/);
  assert.match(appSource, /walletRefreshPromise/);
  assert.match(debugLoopsSource, /WEB WORKER LOOP DEBUG/);
  assert.match(debugLoopsSource, /forbiddenWorkerSignals/);
  assert.match(debugLoopsSource, /Browser\/web UI has display polling only/);
  assert.match(debugLoopsSource, /webServiceInternalLoops/);
  assert.match(debugLoopsSource, /broadTickSkipsFastPlanLoops/);
  assert.match(debugLoopsSource, /displayCacheWarmPath/);
  assert.match(debugServiceRoleSource, /SERVICE ROLE DEBUG/);
  assert.match(debugServiceRoleSource, /jobsBlockedByRole/);
  assert.match(debugServiceRoleSource, /web startup\/view TP\/SL reconcile/);
  assert.match(debugLoopsSource, /startupReconcileGated/);
  assert.match(debugServiceRoleSource, /workerTickEndpointEnabled/);
  assert.match(debugServiceRoleSource, /staleHeartbeatRisk/);
  assert.match(debugServiceRoleSource, /rpcProvider/);
});
