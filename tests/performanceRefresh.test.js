import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const debugPerfSource = fs.readFileSync(new URL("../scripts/debug-perf.js", import.meta.url), "utf8");
const debugWalletSource = fs.readFileSync(new URL("../scripts/debug-wallet-refresh.js", import.meta.url), "utf8");
const debugPositionsSource = fs.readFileSync(new URL("../scripts/debug-positions-refresh.js", import.meta.url), "utf8");
const debugFrontendPerfSource = fs.readFileSync(new URL("../scripts/debug-frontend-perf.js", import.meta.url), "utf8");
const profileTerminalSource = fs.readFileSync(new URL("../scripts/profile-terminal.js", import.meta.url), "utf8");

function functionBody(name, source = appSource) {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(source);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
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

test("frontend records performance marks, long tasks, render counts, and safe perf events", () => {
  assert.match(appSource, /const PERF_LOG_KEY = "slimewirePerfLog"/);
  assert.match(appSource, /function recordPerfEvent/);
  assert.match(appSource, /function installPerformanceInstrumentation/);
  assert.match(functionBody("installPerformanceInstrumentation"), /PerformanceObserver/);
  assert.match(functionBody("installPerformanceInstrumentation"), /longtask/);
  assert.match(functionBody("installPerformanceInstrumentation"), /interaction-delay/);
  assert.match(functionBody("installPerformanceInstrumentation"), /durationThreshold:\s*80/);
  assert.match(functionBody("render"), /state\.perfRenderCounts/);
  assert.match(functionBody("render"), /recordPerfEvent\(\{[\s\S]*action: "render"/);
  assert.doesNotMatch(functionBody("recordPerfEvent"), /privateKey|seed|Authorization|password/i);
});

test("api and wallet refresh dedupe concurrent display reads without blanking cached cards", () => {
  assert.match(appSource, /const apiInFlight = new Map\(\)/);
  assert.match(functionBody("api"), /apiInFlight\.has\(dedupeKey\)/);
  assert.match(functionBody("api"), /action: "api-dedupe"/);
  assert.match(appSource, /let walletRefreshPromise = null/);
  assert.match(appSource, /let walletRefreshSequence = 0/);
  assert.match(functionBody("refreshWalletState"), /walletRefreshPromise/);
  assert.match(functionBody("refreshWalletState"), /walletRefreshRequestId/);
  assert.match(functionBody("refreshWalletState"), /Promise\.race/);
  assert.match(functionBody("refreshWalletState"), /WALLET_REFRESH_TIMEOUT_MS/);
  assert.match(functionBody("refreshWalletState"), /action: "wallet-refresh-dedupe"/);
  assert.doesNotMatch(functionBody("refreshWalletState"), /state\.balances\s*=\s*\[\]/);
  assert.doesNotMatch(functionBody("refreshWalletState"), /state\.positions\s*=\s*\[\]/);
});

test("manual wallet refresh has normalized status, timeout, disconnected guard, and forced header path", () => {
  const refreshBody = functionBody("refreshWalletState");
  assert.match(appSource, /walletRefreshStatus:\s*"idle"/);
  assert.match(refreshBody, /Wallet not connected/);
  assert.match(refreshBody, /ok:\s*false/);
  assert.match(refreshBody, /state\.walletRefreshStatus = "refreshing"/);
  assert.match(refreshBody, /state\.walletRefreshStatus = "success"/);
  assert.match(refreshBody, /state\.walletRefreshStatus = isTimeout \? "timeout" : "error"/);
  assert.match(refreshBody, /finally/);
  assert.match(functionBody("refreshWalletNow"), /refreshWalletState\(\{ force, reason, deep \}\)/);
  assert.match(appSource, /reason: "manual_header_click"/);
  assert.match(functionBody("loadWalletCore"), /timeoutMs/);
});

test("manual feed controls update immediately and refresh in deferred background tasks", () => {
  assert.match(appSource, /function runDeferredUiTask/);
  assert.match(appSource, /data-refresh-live-pairs[\s\S]*runDeferredUiTask\(\(\) => refreshTerminalFeed/);
  assert.match(appSource, /data-refresh-watchlist[\s\S]*runDeferredUiTask\(\(\) => refreshTerminalFeed/);
  assert.match(appSource, /data-refresh-scan[\s\S]*runDeferredUiTask\(\(\) => refreshTerminalFeed/);
  assert.match(functionBody("scheduleLivePairsAutoRefresh"), /document\.hidden/);
});

test("wallet and positions refresh run in parallel phases and report durations", () => {
  const body = functionBody("loadWalletCore");
  assert.match(body, /positionsPromise = api/);
  assert.match(body, /Promise\.all\(/);
  assert.match(body, /perfMeasure\("wallet-refresh"/);
  assert.match(body, /perfMeasure\("positions-refresh"/);
  assert.match(body, /cacheHit: Boolean\(balances\.cacheHit\)/);
  assert.match(body, /cacheHit: Boolean\(positions\.cacheHit\)/);
});

test("tab switches render cached content before background revalidation", () => {
  assert.match(appSource, /const hasCachedTabData = terminalFeedHasData\(state\.activeTab\)/);
  assert.match(appSource, /render\(\);\s*const refreshPromise = refreshTerminalFeed/);
  assert.match(appSource, /if \(!hasCachedTabData\) await refreshPromise/);
  assert.match(appSource, /perfMeasure\("tab-switch"/);
});

test("backend performance event logging is sanitized and read-only summary endpoints are cached", () => {
  assert.match(serverSource, /function performanceEventsPath/);
  assert.match(serverSource, /pathname === "\/api\/web\/perf-event"/);
  assert.match(serverSource, /function safePerfEventText/);
  assert.match(serverSource, /async function cachedWebSummary/);
  assert.match(serverSource, /cachedWebSummary\("web:balances"/);
  assert.match(serverSource, /cachedWebSummary\("web:positions"/);
  assert.match(serverSource, /cachedWebSummary\("web:pnl"/);
  assert.match(serverSource, /cacheHit: summary\.cacheHit/);
  assert.match(serverSource, /refreshDurationMs: summary\.durationMs/);
  assert.doesNotMatch(functionBody("recordPerformanceEvent", serverSource), /privateKey|seed|Authorization|password/i);
});

test("debug and profile commands are registered and syntax-checked", () => {
  assert.match(packageSource, /"debug:perf": "node scripts\/debug-perf\.js"/);
  assert.match(packageSource, /"profile:terminal": "node scripts\/profile-terminal\.js"/);
  assert.match(packageSource, /"debug:wallet-refresh": "node scripts\/debug-wallet-refresh\.js"/);
  assert.match(packageSource, /"debug:positions-refresh": "node scripts\/debug-positions-refresh\.js"/);
  assert.match(packageSource, /"debug:frontend-perf": "node scripts\/debug-frontend-perf\.js"/);
  assert.match(packageSource, /node --check scripts\/debug-perf\.js/);
  assert.match(packageSource, /node --check scripts\/debug-frontend-perf\.js/);
  assert.match(debugPerfSource, /longTasksOver50ms/);
  assert.match(debugPerfSource, /duplicatedRequests/);
  assert.match(debugWalletSource, /WALLET REFRESH DEBUG/);
  assert.match(debugWalletSource, /cachedMs/);
  assert.match(debugWalletSource, /backgroundRefreshMs/);
  assert.match(debugWalletSource, /p95Ms/);
  assert.match(debugPositionsSource, /POSITIONS REFRESH DEBUG/);
  assert.match(debugPositionsSource, /priceCalls/);
  assert.match(debugPositionsSource, /p95Ms/);
  assert.match(debugFrontendPerfSource, /FRONTEND PERF DEBUG/);
  assert.match(debugFrontendPerfSource, /duplicateIntervals/);
  assert.match(debugFrontendPerfSource, /hiddenPolling/);
  assert.match(debugFrontendPerfSource, /webApiP95Ms/);
  assert.match(profileTerminalSource, /TERMINAL PROFILE/);
});

test("mobile terminal smoothness keeps long rows cheap to paint", () => {
  assert.match(cssSource, /content-visibility:\s*auto/);
  assert.match(cssSource, /@media \(max-width: 640px\), \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /backdrop-filter: none !important/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /animation-duration: 0\.01ms !important/);
});
