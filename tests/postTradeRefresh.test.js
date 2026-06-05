import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugPostTradeSource = fs.readFileSync(new URL("../scripts/debug-post-trade.js", import.meta.url), "utf8");
const debugCascadeSource = fs.readFileSync(new URL("../scripts/debug-trade-refresh-cascade.js", import.meta.url), "utf8");
const debugCrashesSource = fs.readFileSync(new URL("../scripts/debug-frontend-crashes.js", import.meta.url), "utf8");

function functionBody(source, name) {
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
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")") {
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
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("refreshAfterTrade queues scoped post-trade refresh instead of blocking on wallet refresh", () => {
  const body = functionBody(appSource, "refreshAfterTrade");
  assert.match(body, /queuePostTradeRefresh\(signature, reason\)/);
  assert.doesNotMatch(body, /await refreshWalletState/);
  assert.doesNotMatch(body, /refreshVisibleTerminalFeeds|refreshTerminalFeed/);
});

test("post-trade refresh invalidates only affected keys and never full terminal feeds", () => {
  const body = functionBody(appSource, "queuePostTradeRefresh");
  assert.match(appSource, /POST_TRADE_AFFECTED_KEYS = \["wallet-summary", "positions", "pnl", "trade-history", "selected-token", "live-trades"\]/);
  assert.match(body, /post-trade-invalidation-start/);
  assert.match(body, /refreshWalletState\(\{ force: true, deep: false, reason: "post-trade" \}\)/);
  assert.doesNotMatch(body, /refreshVisibleTerminalFeeds|refreshTerminalFeed|loadKolScan|loadWatchlist|refreshLivePairBuckets/);
});

test("post-trade supplemental refresh does not reload watchlist, launch watches, presets, or hidden feeds", () => {
  const body = functionBody(appSource, "loadPostTradeSupplemental");
  assert.match(body, /api\("\/api\/web\/pnl"\)/);
  assert.match(body, /api\("\/api\/web\/trade\/plans"\)/);
  assert.doesNotMatch(body, /watchlist|launch\/watches|presets|refreshTerminalFeed|refreshVisibleTerminalFeeds/);
});

test("buy and bundle actions acknowledge immediately and dedupe double taps", () => {
  const buyBody = functionBody(appSource, "executeWebBuy");
  assert.match(buyBody, /createClientAttemptId\("trade-buy"\)/);
  assert.match(buyBody, /activeTradeAction\("trade-buy"/);
  assert.match(buyBody, /setTradeAction\("trade-buy"[\s\S]*state: "clicked"/);
  assert.match(buyBody, /trade-click-to-ui/);
  assert.match(buyBody, /trade-backend-ack/);
  assert.match(buyBody, /queuePostTradeRefresh\(data\.trade\?\.signature, "trade-buy"/);
  assert.doesNotMatch(buyBody, /await refreshAfterTrade/);

  const bundleBody = functionBody(appSource, "executeBundle");
  assert.match(bundleBody, /createClientAttemptId\(actionName\)/);
  assert.match(bundleBody, /activeTradeAction\(actionName/);
  assert.match(bundleBody, /setTradeAction\(actionName[\s\S]*state: "clicked"/);
  assert.match(bundleBody, /queuePostTradeRefresh\(firstResultSignature\(data\.bundle\), `bundle-\$\{action\}`/);
  assert.doesNotMatch(bundleBody, /await refreshAfterTrade/);
});

test("post-trade window pauses hidden feed refreshes and keeps cached cards visible", () => {
  assert.match(functionBody(appSource, "resumeLiveFeeds"), /isPostTradeRefreshActive\(\)/);
  assert.match(functionBody(appSource, "resumeLiveFeeds"), /hidden-feed-refresh-skipped/);
  assert.match(functionBody(appSource, "scheduleLivePairsAutoRefresh"), /isPostTradeRefreshActive\(\)/);
  assert.match(functionBody(appSource, "scheduleKolAutoRefresh"), /isPostTradeRefreshActive\(\)/);
  assert.match(functionBody(appSource, "scheduleWatchlistAutoRefresh"), /isPostTradeRefreshActive\(\)/);
  assert.doesNotMatch(functionBody(appSource, "refreshWalletState"), /state\.balances\s*=\s*\[\]|state\.positions\s*=\s*\[\]|state\.pnl\s*=\s*null/);
});

test("frontend crash instrumentation and render boundary are installed", () => {
  assert.match(appSource, /function recordCrashEvent/);
  assert.match(appSource, /window\.addEventListener\("error"/);
  assert.match(appSource, /window\.addEventListener\("unhandledrejection"/);
  assert.match(functionBody(appSource, "render"), /try \{/);
  assert.match(functionBody(appSource, "render"), /render-boundary/);
  assert.match(functionBody(appSource, "initializeApp"), /installCrashInstrumentation\(\)/);
});

test("debug commands cover post-trade cascades and frontend crashes without secrets", () => {
  assert.match(packageSource, /"debug:post-trade": "node scripts\/debug-post-trade\.js"/);
  assert.match(packageSource, /"debug:trade-refresh-cascade": "node scripts\/debug-trade-refresh-cascade\.js"/);
  assert.match(packageSource, /"debug:frontend-crashes": "node scripts\/debug-frontend-crashes\.js"/);
  assert.match(packageSource, /node --check scripts\/debug-post-trade\.js/);
  assert.match(debugPostTradeSource, /POST TRADE DEBUG/);
  assert.match(debugCascadeSource, /TRADE REFRESH CASCADE DEBUG/);
  assert.match(debugCrashesSource, /FRONTEND CRASH DEBUG/);
  assert.doesNotMatch(`${debugPostTradeSource}\n${debugCascadeSource}\n${debugCrashesSource}`, /privateKey|seed|Authorization|session token|decrypted/i);
});
