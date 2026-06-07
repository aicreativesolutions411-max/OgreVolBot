import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const chartCssSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const publicIndexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugEntrySource = fs.readFileSync(new URL("../scripts/debug-trade-entrypoints.js", import.meta.url), "utf8");
const debugChartSource = fs.readFileSync(new URL("../scripts/debug-chart-route.js", import.meta.url), "utf8");
const debugChartLoadSource = fs.readFileSync(new URL("../scripts/debug-chart-load.js", import.meta.url), "utf8");
const debugChartPrefetchSource = fs.readFileSync(new URL("../scripts/debug-chart-prefetch.js", import.meta.url), "utf8");
const debugRouteRequestsSource = fs.readFileSync(new URL("../scripts/debug-route-requests.js", import.meta.url), "utf8");
const debugQuickBuySource = fs.readFileSync(new URL("../scripts/debug-quick-buy.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const marker = `function ${name}`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} missing`);
  const next = source.indexOf("\nfunction ", start + marker.length);
  return source.slice(start, next === -1 ? undefined : next);
}

test("Trade and token-card clicks open chart route instead of buying", () => {
  const openChart = functionBody(appSource, "openTokenChart");
  assert.match(openChart, /window\.history\.pushState\(\{\}, "", path\)/);
  assert.match(openChart, /buildTokenChartPath/);
  assert.match(openChart, /chartScrollIntoView = true/);
  assert.doesNotMatch(openChart, /quickPresetTrade|executeWebBuy|\/api\/web\/trade\/buy/);

  const clickHandlerSlice = appSource.slice(appSource.indexOf('document.addEventListener("click"'));
  assert.match(clickHandlerSlice, /\[data-token-chart\]/);
  assert.match(clickHandlerSlice, /\[data-token-trade\]/);
  assert.match(clickHandlerSlice, /openTokenChart\(tokenRefFromMint\(target\.dataset\.tokenTrade/);
  assert.match(clickHandlerSlice, /event\.stopPropagation\(\)/);
});

test("Quick Buy is separate and validates custom SOL amount", () => {
  const openQuickBuy = functionBody(appSource, "openQuickBuy");
  assert.match(openQuickBuy, /quickBuyModal/);
  assert.match(openQuickBuy, /forceModal/);

  const confirmQuickBuy = functionBody(appSource, "confirmQuickBuyModal");
  assert.match(confirmQuickBuy, /readQuickBuyModalForm\(\)/);
  assert.match(confirmQuickBuy, /executeQuickBuyAmount/);

  const readQuickBuy = functionBody(appSource, "readQuickBuyModalForm");
  assert.match(readQuickBuy, /Enter a SOL amount greater than zero/);
  assert.match(readQuickBuy, /normalizedQuickBuyAmount/);

  const executeQuickBuy = functionBody(appSource, "executeQuickBuyAmount");
  assert.match(executeQuickBuy, /createClientAttemptId\("quick-buy"\)/);
  assert.match(executeQuickBuy, /executeConnectedBrowserTrade\(\{[\s\S]*side: "buy"/);
  assert.match(executeQuickBuy, /\/api\/web\/trade\/buy/);
});

test("Rendered feed/card rows use Trade plus Quick Buy labels, not ambiguous quick-trade markup", () => {
  const terminalRows = functionBody(appSource, "terminalSignalRowsHtml");
  assert.match(terminalRows, /data-token-trade/);
  assert.match(terminalRows, /data-quick-buy-token/);
  assert.match(terminalRows, /slimeShieldMiniHtml\(row\)/);
  assert.doesNotMatch(terminalRows, /slimeShieldChipHtml\(row\)/);
  assert.match(functionBody(appSource, "compactSignalRowsHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "compactSignalRowsHtml"), /data-quick-buy-token/);
  assert.match(functionBody(appSource, "tokenSignalRowHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "tokenSignalRowHtml"), /data-quick-buy-token/);
  assert.match(functionBody(appSource, "tokenPreviewHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "tokenPreviewHtml"), /data-quick-buy-token/);
  assert.doesNotMatch(terminalRows, /data-quick-trade-token/);
  assert.doesNotMatch(functionBody(appSource, "tokenSignalRowHtml"), /data-quick-trade-token/);
});

test("Live pair action buttons stay even and visibly colored", () => {
  assert.match(chartCssSource, /terminal-token-actions[\s\S]*repeat\(5, minmax\(72px, 1fr\)\)/);
  assert.match(chartCssSource, /button\[data-quick-buy-token\][\s\S]*linear-gradient/);
  assert.match(chartCssSource, /button\[data-quick-bundle-token\][\s\S]*linear-gradient/);
  assert.match(chartCssSource, /button\[data-smart-chart-token\][\s\S]*linear-gradient/);
  assert.match(chartCssSource, /terminal-token-actions button\.watch-action[\s\S]*linear-gradient/);
});

test("Live pair stats stay bold, green, and compact", () => {
  assert.match(chartCssSource, /live pair stat readability/);
  assert.match(chartCssSource, /terminal-token-stats span[\s\S]*display: grid/);
  assert.match(chartCssSource, /terminal-token-stats span[\s\S]*grid-template-rows: 12px 19px/);
  assert.match(chartCssSource, /terminal-token-stats span[\s\S]*height: 44px/);
  assert.match(chartCssSource, /terminal-token-stats span[\s\S]*transform: translateY\(2px\)/);
  assert.match(chartCssSource, /terminal-token-stats small[\s\S]*grid-row: 1/);
  assert.match(chartCssSource, /terminal-token-stats small[\s\S]*color: rgba\(170, 255, 143, 0\.76\)/);
  assert.match(chartCssSource, /terminal-token-stats small[\s\S]*font-size: 9\.5px/);
  assert.match(chartCssSource, /terminal-token-stats small[\s\S]*font-weight: 950/);
  assert.match(chartCssSource, /terminal-token-stats strong[\s\S]*grid-row: 2/);
  assert.match(chartCssSource, /terminal-token-stats strong[\s\S]*color: #ecffe6/);
  assert.match(chartCssSource, /terminal-token-stats strong[\s\S]*font-size: 13\.5px/);
  assert.match(chartCssSource, /terminal-token-stats strong[\s\S]*font-weight: 1000/);
  assert.match(chartCssSource, /terminal-token-stats strong[\s\S]*text-overflow: clip/);
});

test("Chart route has professional Buy and Sell panel", () => {
  const panel = functionBody(appSource, "chartTradePanelHtml");
  assert.match(panel, /data-chart-trade-tab="buy"/);
  assert.match(panel, /data-chart-trade-tab="sell"/);
  assert.match(panel, /data-chart-confirm-buy/);
  assert.match(panel, /data-chart-confirm-sell/);
  assert.match(panel, /Sell 25%/);
  assert.match(panel, /Sell 50%/);
  assert.match(panel, /Sell 100%/);
  assert.match(functionBody(appSource, "smartChartHtml"), /chartTradePanelHtml\(token, heldPosition\)/);
  assert.match(functionBody(appSource, "applyChartRouteFromLocation"), /params\.get\("token"\)/);
});

test("Chart page uses full chart view with transactions and info tabs", () => {
  const chart = functionBody(appSource, "smartChartHtml");
  assert.match(functionBody(appSource, "smartChartViewTabsHtml"), /\["chart", "Chart"\]/);
  assert.match(functionBody(appSource, "smartChartViewTabsHtml"), /\["chartTxns", "Chart \+ Txns"\]/);
  assert.match(functionBody(appSource, "smartChartViewTabsHtml"), /\["txns", "Transactions"\]/);
  assert.match(functionBody(appSource, "smartChartViewTabsHtml"), /\["info", "Info"\]/);
  assert.match(chart, /chartView === "chart"[\s\S]*smartChartDexFrameHtml\(token, "chart"\)/);
  assert.match(chart, /chartView === "chartTxns"[\s\S]*smartChartDexFrameHtml\(token, "chartTxns"\)/);
  assert.match(chart, /chartView === "txns"[\s\S]*smartChartTransactionsHtml\(token, heldPosition\)/);
  assert.match(chart, /smartChartInfoPanelHtml\(token, heldPosition\)/);
  assert.match(functionBody(appSource, "smartChartTransactionsHtml"), /smartChartDexFrameHtml\(token, "txns"\)/);
  assert.match(functionBody(appSource, "smartChartInfoPanelHtml"), /smartChartDexFrameHtml\(token, "info"\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-frame-loading/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /fetchpriority="high"/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /setAttribute\('data-loaded','true'\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /queueSmartChartBootstrap\(token\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /smartChartFrameUrl\(token, mode\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-resolving/);
  assert.doesNotMatch(functionBody(appSource, "smartChartDexFrameHtml"), /before loading the iframe/);
  assert.match(functionBody(appSource, "resolveSmartChartDexPair"), /\/api\/web\/chart\/bootstrap\?token=/);
  assert.match(functionBody(appSource, "openTokenChart"), /prefetchTokenChart\(tokenRef/);
  assert.match(functionBody(appSource, "applyChartRouteFromLocation"), /prefetchTokenChart\(tokenRef/);
  assert.match(appSource, /pointerenter[\s\S]*prefetchTokenChartFromElement/);
  assert.match(appSource, /touchstart[\s\S]*prefetchTokenChartFromElement/);
  assert.match(functionBody(appSource, "mergeSmartChartDexResolution"), /pairAddress: row\.pairAddress \|\| resolved\.pairAddress/);
  assert.match(functionBody(appSource, "chartAddressForToken"), /pairAddress/);
  assert.match(functionBody(appSource, "applyTokenRefToState"), /smartChartTokenRef/);
  assert.match(functionBody(appSource, "applyTokenRefToState"), /rememberSmartChartDexResolution/);
  assert.match(functionBody(appSource, "requestSmartChartScrollIntoView"), /window\.scrollTo\(\{ top, behavior: "auto" \}\)/);
  assert.match(functionBody(appSource, "renderTabs"), /chartScrollIntoView[\s\S]*requestSmartChartScrollIntoView\(panel\)/);
  assert.match(functionBody(appSource, "render"), /app\.dataset\.activeTab = state\.activeTab \|\| ""/);
  assert.match(functionBody(appSource, "render"), /preserveSmartChartPanel[\s\S]*\.smart-chart-frame iframe/);
  assert.match(functionBody(appSource, "refreshTerminalFeed"), /preserveSmartChartFrame: state\.activeTab === "smartChart" && tabKey === "smartChart"/);
  assert.match(functionBody(appSource, "refreshWalletState"), /preserveSmartChartFrame: state\.activeTab === "smartChart"/);
  assert.match(chartCssSource, /\[data-active-tab="smartChart"\][\s\S]*\[data-dashboard\] > \.metrics/);
  assert.doesNotMatch(chartCssSource, /\[data-active-tab="smartChart"\]\s+\[data-dashboard\] > \.tabs,[\s\S]*display: none/);
  assert.match(chartCssSource, /\[data-active-tab="smartChart"\][\s\S]*\[data-dashboard\] > \.tabs[\s\S]*position: sticky/);
  assert.match(chartCssSource, /\[data-active-tab="smartChart"\][\s\S]*\.terminal-global-search/);
  assert.match(chartCssSource, /\[data-active-tab="smartChart"\][\s\S]*\.top-sync-strip/);
  assert.match(chartCssSource, /\.smart-chart-frame::before/);
  assert.match(chartCssSource, /\.smart-chart-pair-resolving/);
  assert.match(chartCssSource, /\.smart-chart-frame\[data-loaded="true"\]::before/);
  assert.match(publicIndexSource, /preconnect" href="https:\/\/dexscreener\.com"/);
  assert.match(publicIndexSource, /preconnect" href="https:\/\/api\.dexscreener\.com"/);
});

test("Chart pair resolver is exposed through a safe backend endpoint", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/dex-token"/);
  assert.match(serverSource, /pathname === "\/api\/web\/chart\/bootstrap"/);
  assert.match(serverSource, /const ChartDataService = Object\.freeze/);
  assert.match(serverSource, /getChartBootstrap: webChartBootstrap/);
  assert.match(serverSource, /resolvePairForChart/);
  assert.match(serverSource, /getCachedCandles/);
  assert.match(serverSource, /revalidateCandles/);
  assert.match(serverSource, /chartBootstrapSharedCache/);
  assert.match(serverSource, /CacheService\.getJson/);
  assert.match(serverSource, /CacheService\.setJson/);
  assert.match(serverSource, /DedupeService\.run\(`web:chart-bootstrap/);
  assert.match(serverSource, /async function webDexToken/);
  assert.match(serverSource, /async function buildWebChartBootstrap/);
  assert.match(serverSource, /fetchDexScreenerTokenPairsBatch\(\[mint\]/);
  assert.match(serverSource, /bestDexPairForToken\(mint, pairs\)/);
  assert.match(serverSource, /pairAddress/);
  assert.doesNotMatch(functionBody(serverSource, "webDexToken"), /privateKey|secretKey|JWT|sessionToken/i);
});

test("Debug commands are wired and sanitized", () => {
  assert.match(packageSource, /debug:trade-entrypoints/);
  assert.match(packageSource, /debug:chart-route/);
  assert.match(packageSource, /debug:chart-load/);
  assert.match(packageSource, /debug:chart-prefetch/);
  assert.match(packageSource, /debug:route-requests/);
  assert.match(packageSource, /debug:quick-buy/);
  assert.match(debugChartLoadSource, /unrelatedFeedRefreshesTriggered/);
  assert.match(debugChartPrefetchSource, /prefetchSources/);
  assert.match(debugRouteRequestsSource, /terminalFeedsUnnecessarilyRefreshed/);
  assert.doesNotMatch(`${debugEntrySource}\n${debugChartSource}\n${debugChartLoadSource}\n${debugChartPrefetchSource}\n${debugRouteRequestsSource}\n${debugQuickBuySource}`, /privateKey|secretKey|seed phrase|Authorization|JWT/i);
});
