import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const chartLabSource = fs.readFileSync(new URL("../web/public/chart-lab.html", import.meta.url), "utf8");
const terminalSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const tokenPageSource = fs.readFileSync(new URL("../web/public/t.html", import.meta.url), "utf8");
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
  assert.match(frame, /data-chart-resolving/);
  assert.doesNotMatch(frame, /before loading the iframe/);
  assert.doesNotMatch(frame, /smart-chart-pair-resolving/);
  assert.match(frame, /window\.SlimeWireChartFrameLoaded/);
  assert.match(functionBody(appSource, "smartChartFrameUrl"), /bootstrap\?\.chartUrl/);

  const refresh = functionBody(appSource, "refreshTerminalFeed");
  const smartChartBranchStart = refresh.indexOf('tabKey === "smartChart"');
  assert.notEqual(smartChartBranchStart, -1, "smartChart refresh branch missing");
  const smartChartBranch = refresh.slice(smartChartBranchStart, refresh.indexOf('} else if (["trade"', smartChartBranchStart));
  assert.match(smartChartBranch, /refreshWalletState/);
  assert.doesNotMatch(smartChartBranch, /refreshLivePairBuckets|loadLivePairs|loadKolScan|loadWatchlist|loadAll/);
});

test("native chart uses our server first and a pool-scoped browser fallback only for blank Robinhood candles", () => {
  assert.match(chartLabSource, /\/api\/chart\?ca=/);
  assert.match(chartLabSource, /function loadReal\(\)\{ if\(!CA\)return; loadBootstrap\(\); loadServer\(\); loadDex\(\); \}/);
  assert.match(chartLabSource, /setInterval\(loadServer,15000\)/);
  assert.match(chartLabSource, /applyStats\(d,false\)/);
  assert.match(chartLabSource, /applyTradeTicks\(d\.trades\)/);
  assert.match(chartLabSource, /id="s_holders"/);
  const fallback = functionBody(chartLabSource, "loadGeckoFallback");
  assert.match(fallback, /NETWORK!==['"]robinhood['"]\|\|bars\.length>2\|\|!dexPair/);
  assert.match(fallback, /api\.geckoterminal\.com\/api\/v2\/networks\/robinhood\/pools/);
  assert.match(fallback, /token=['"]?\+dexTokenSide/);
  assert.match(functionBody(chartLabSource, "loadServer"), /&pool=/);
  assert.match(functionBody(chartLabSource, "candlesFromTradeRows"), /Math\.floor\(stamp\/sec\)\*sec/);
  assert.match(chartLabSource, /slimewire:rh-pool-trades/);
  assert.match(functionBody(chartLabSource, "applyChartData"), /cs\.length<3&&bars\.length>=3/);
  assert.match(functionBody(terminalSource, "loadInlineTape"), /postMessage\(\{type:"slimewire:rh-pool-trades"/);
});

test("native chart never hides real candles behind the optional slime texture", () => {
  assert.match(chartLabSource, /upColor:'#33e08a'/);
  assert.match(chartLabSource, /downColor:'#ff445c'/);
  assert.match(chartLabSource, /Slime\/blood is enhancement only/);
  assert.doesNotMatch(chartLabSource, /applyOptions\(\{upColor:'rgba\(0,0,0,0\)'/);
  assert.match(functionBody(terminalSource, "rhNativeChartFrame"), /cv=3/);
});

test("native chart API uses Solana Tracker primary with swap-api fallback", () => {
  const body = functionBody(serverSource, "buildChartData");
  assert.match(body, /solanaTrackerJson\(`\/chart\/\$\{mint\}\?type=\$\{encodeURIComponent\(tf\)\}&currency=usd`/);
  assert.match(body, /Array\.isArray\(st\.oclhv\)/);
  assert.match(body, /swap-api\.pump\.fun\/v1\/coins\/\$\{mint\}\/candles/);
  assert.match(body, /swap-api\.pump\.fun\/v2\/coins\/\$\{mint\}\/trades/);
  assert.match(serverSource, /const CHART_TRADE_CACHE = new Map\(\)/);
  assert.match(body, /CHART_TRADE_CACHE\.set\(mint, \{ at: Date\.now\(\), trades \}\)/);
  assert.match(body, /lastTrades && Date\.now\(\) - lastTrades\.at < 2 \* 60 \* 1000/);
  assert.match(body, /source: candleSource/);
  assert.doesNotMatch(body, /gtFetch|GT_API|fetchGeckoOhlcv|resolveGeckoPoolForMint/);
});

test("native chart accepts Robinhood CAs and uses the saved Sushi pool before public indexing", () => {
  assert.match(serverSource, /const rhMint = normalizeRobinhoodTokenAddress\(cmint\)/);
  assert.match(serverSource, /await buildRhChartData\(rhMint/);
  assert.match(serverSource, /poolAddress: requestUrl\.searchParams\.get\("pool"\)/);
  const body = functionBody(serverSource, "buildRhChartData");
  assert.match(body, /requestedPool = normalizeRobinhoodTokenAddress\(options\.poolAddress\)/);
  assert.match(body, /rhLaunchMetaByAddress/);
  assert.match(body, /launch\?\.pairAddress/);
  assert.match(body, /webOhlcvPayload\(address, tf, \{ network: "robinhood", poolAddress: launchPool/);
  assert.match(body, /fetchGeckoPoolTrades\(poolAddress, \{ network: "robinhood"/);
  assert.match(body, /source = "current-price-anchor"/);
  assert.match(body, /pairAddress: poolAddress/);
});

test("chart bootstrap and browser fast path are chain-aware for Robinhood", () => {
  const bootstrap = functionBody(serverSource, "buildWebChartBootstrap");
  assert.match(bootstrap, /chartNetworkForAddress\(mint\) === "robinhood"/);
  assert.match(bootstrap, /rhLaunchMetaByAddress/);
  assert.match(bootstrap, /providerSource = "slimewire-launch-store"/);
  assert.match(functionBody(serverSource, "fetchDexScreenerTokenPairsFallback"), /\? "robinhood" : "solana"/);
  assert.match(functionBody(appSource, "fastDirectDexLookup"), /\? "robinhood" : "solana"/);
  assert.match(chartLabSource, /NETWORK=\/\^0x\[0-9a-f\]\{40\}\$\/i\.test\(CA\)\?'robinhood':'solana'/);
  assert.match(chartLabSource, /toLowerCase\(\)===NETWORK/);
  assert.match(functionBody(appSource, "tokenRefFromMint"), /\? "robinhood" : "solana"/);
});

test("classic mobile terminal hydrates a pasted Robinhood CA from the saved Sushi launch", () => {
  const hydrate = functionBody(terminalSource, "rhHydrateChartRow");
  assert.match(hydrate, /\/api\/web\/chart\/bootstrap\?token=/);
  assert.match(hydrate, /pairAddress/);
  assert.match(functionBody(terminalSource, "rhNativeChartFrame"), /\/chart-lab\?ca=/);
  assert.match(functionBody(terminalSource, "renderRhTrade"), /Promise\.all\(\[rhEnrichRows\(\[r\]\),rhHydrateChartRow\(r\)\]\)/);
  assert.match(functionBody(terminalSource, "renderRhTrade"), /id="rhTvAvatar"/);
  assert.match(functionBody(chartLabSource, "loadBootstrap"), /\/api\/web\/chart\/bootstrap\?token=/);
  assert.doesNotMatch(chartLabSource, /id="s_mc">\$182K|id="s_liq">\$44K|id="s_bs">612 \/ 287/);
  assert.match(tokenPageSource, /\^0x\[0-9a-f\]\{40\}\$\/i\.test\(rawMint\)/);
});

test("chart prefetch and debug commands are wired", () => {
  assert.match(functionBody(appSource, "prefetchTokenChart"), /queueSmartChartBootstrap/);
  const interactionPrefetch = functionBody(appSource, "prefetchTokenChartFromElement");
  assert.match(interactionPrefetch, /SMART_CHART_INTERACTION_PREFETCH_MIN_INTERVAL_MS/);
  assert.match(interactionPrefetch, /SMART_CHART_INTERACTION_PREFETCH_MAX_PER_WINDOW/);
  assert.match(interactionPrefetch, /smartChartInteractionPrefetchSeen/);
  assert.match(appSource, /pointerenter[\s\S]*prefetchTokenChartFromElement/);
  assert.match(appSource, /touchstart[\s\S]*prefetchTokenChartFromElement/);
  assert.match(appSource, /focusin[\s\S]*prefetchTokenChartFromElement/);
  assert.match(packageSource, /debug:chart-load/);
  assert.match(packageSource, /debug:chart-prefetch/);
  assert.match(packageSource, /debug:route-requests/);
});
