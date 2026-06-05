import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const workerSource = fs.readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugCacheSource = fs.readFileSync(new URL("../scripts/debug-cache.js", import.meta.url), "utf8");
const debugLoopsSource = fs.readFileSync(new URL("../scripts/debug-web-worker-loops.js", import.meta.url), "utf8");

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
  assert.match(packageSource, /node --check scripts\/debug-cache\.js/);
  assert.match(packageSource, /node --check scripts\/debug-web-worker-loops\.js/);
  assert.match(serverSource, /function normalizeCacheProvider/);
  assert.match(serverSource, /async function redisKv/);
  assert.match(serverSource, /async function restKvCommand/);
  assert.match(serverSource, /async function cacheGetJson/);
  assert.match(serverSource, /async function cacheSetJson/);
  assert.match(serverSource, /CACHE_NAMESPACE|KV_CACHE_NAMESPACE/);
  assert.doesNotMatch(debugCacheSource, /console\.log\(process\.env/i);
  assert.doesNotMatch(debugCacheSource, /redisUrl:\s*process\.env|token:\s*process\.env/i);
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
  assert.match(serverSource, /processWebExitGuards/);
  assert.match(serverSource, /processTradePlans/);
  assert.match(serverSource, /processWebPortfolioExits/);
  assert.match(serverSource, /constantTimeStringEquals\(providedSecret, CONFIG\.workerSecret\)/);
  assert.match(workerSource, /warmDisplayCaches: CONFIG\.warmDisplayCaches/);
  assert.match(workerSource, /displayCacheUserLimit: CONFIG\.displayCacheUserLimit/);
  assert.match(workerSource, /Display cache: \$/);
  assert.match(workerSource, /tradePlanTick/);
});

test("web app has display polling only and debug command proves worker loops stay backend-side", () => {
  assert.doesNotMatch(appSource, /processWebExitGuards|processTradePlans|processWebPortfolioExits|runInternalWorkerTick|WORKER_SECRET|X-Worker-Secret/);
  assert.match(appSource, /scheduleActiveTerminalFeedRefresh/);
  assert.match(appSource, /document\.hidden/);
  assert.match(appSource, /walletRefreshPromise/);
  assert.match(debugLoopsSource, /WEB WORKER LOOP DEBUG/);
  assert.match(debugLoopsSource, /forbiddenWorkerSignals/);
  assert.match(debugLoopsSource, /Browser\/web UI has display polling only/);
  assert.match(debugLoopsSource, /displayCacheWarmPath/);
});
