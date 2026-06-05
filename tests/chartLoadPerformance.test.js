import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} missing`);
  const next = source.indexOf("\nfunction ", start + marker.length);
  return source.slice(start, next === -1 ? undefined : next);
}

test("chart route renders shell from route token and starts bootstrap without blocking", () => {
  const applyRoute = functionBody(appSource, "applyChartRouteFromLocation");
  assert.match(applyRoute, /params\.get\("token"\)/);
  assert.match(applyRoute, /applyTokenRefToState\(tokenRef\)/);
  assert.match(applyRoute, /prefetchTokenChart\(tokenRef/);
  assert.match(applyRoute, /state\.activeTab = "smartChart"/);

  const chartHtml = functionBody(appSource, "smartChartHtml");
  assert.match(chartHtml, /perfMark\("tokenHeaderRendered"\)/);
  assert.match(chartHtml, /perfMark\("chartSkeletonRendered"\)/);
  assert.match(chartHtml, /perfMark\("buyPanelReady"\)/);
  assert.match(chartHtml, /chartTradePanelHtml\(token, heldPosition\)/);
});

test("chart bootstrap is cached, deduped, and served through a dedicated endpoint", () => {
  assert.match(serverSource, /const CHART_BOOTSTRAP_FRESH_MS = 15 \* 1000/);
  assert.match(serverSource, /const CHART_BOOTSTRAP_STALE_MS = 30 \* 60 \* 1000/);
  assert.match(serverSource, /let chartBootstrapSharedCache = new Map/);
  assert.match(functionBody(serverSource, "webChartBootstrap"), /CacheService\.getJson/);
  assert.match(functionBody(serverSource, "webChartBootstrap"), /DedupeService\.run/);
  assert.match(functionBody(serverSource, "buildWebChartBootstrap"), /fetchDexScreenerTokenPairsBatch/);
  assert.match(functionBody(serverSource, "buildWebChartBootstrap"), /fetchDexScreenerTokenPairsFallback/);
  assert.match(serverSource, /https:\/\/api\.dexscreener\.com\/latest\/dex\/tokens/);
  assert.match(functionBody(serverSource, "storeWebChartBootstrap"), /CacheService\.setJson/);
  assert.match(serverSource, /pathname === "\/api\/web\/chart\/bootstrap"/);
});

test("chart iframe uses cached bootstrap URLs and does not wait on feed refresh", () => {
  const frame = functionBody(appSource, "smartChartDexFrameHtml");
  assert.match(frame, /smartChartFrameUrl\(token, mode\)/);
  assert.match(frame, /queueSmartChartBootstrap\(token\)/);
  assert.match(frame, /window\.SlimeWireChartFrameLoaded/);
  assert.match(functionBody(appSource, "smartChartFrameUrl"), /bootstrap\?\.chartUrl/);

  const refresh = functionBody(appSource, "refreshTerminalFeed");
  const smartChartBranchStart = refresh.indexOf('tabKey === "smartChart"');
  assert.notEqual(smartChartBranchStart, -1, "smartChart refresh branch missing");
  const smartChartBranch = refresh.slice(smartChartBranchStart, refresh.indexOf('} else if (["trade"', smartChartBranchStart));
  assert.match(smartChartBranch, /refreshWalletState/);
  assert.doesNotMatch(smartChartBranch, /refreshLivePairBuckets|loadLivePairs|loadKolScan|loadWatchlist|loadAll/);
});

test("chart prefetch and debug commands are wired", () => {
  assert.match(functionBody(appSource, "prefetchTokenChart"), /queueSmartChartBootstrap/);
  assert.match(appSource, /pointerenter[\s\S]*prefetchTokenChartFromElement/);
  assert.match(appSource, /touchstart[\s\S]*prefetchTokenChartFromElement/);
  assert.match(appSource, /focusin[\s\S]*prefetchTokenChartFromElement/);
  assert.match(packageSource, /debug:chart-load/);
  assert.match(packageSource, /debug:chart-prefetch/);
  assert.match(packageSource, /debug:route-requests/);
});
