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
  assert.match(panel, /data-fast-trade-preset="chart-panel"/);
  assert.match(panel, /data-chart-buy-tp/);
  assert.match(panel, /data-chart-buy-sl/);
  assert.match(panel, /data-chart-buy-delay/);
  assert.match(panel, /data-chart-confirm-buy/);
  assert.match(panel, /data-chart-confirm-sell/);
  assert.match(panel, /managedDefaultWallet/);
  assert.match(panel, /presetWalletIndex/);
  assert.match(panel, /walletSelected = state\.chartBuyWalletIndex \|\| \(connected\?\.publicKey \? "connected" : \(presetWalletIndex \|\| managedDefaultWallet\)\)/);
  assert.match(panel, /selectedConnectedWallet/);
  assert.match(panel, /chartSlippageBps/);
  assert.match(panel, /chartTakeProfitPct/);
  assert.match(panel, /chartStopLossPct/);
  assert.match(panel, /chartSellDelay/);
  assert.match(panel, /chartSellPercent/);
  assert.match(panel, /data-chart-trade-status/);
  assert.match(panel, /Sell 25%/);
  assert.match(panel, /Sell 50%/);
  assert.match(panel, /Sell 100%/);
  assert.match(functionBody(appSource, "readChartTradeAutoExit"), /data-chart-buy-tp/);
  assert.match(functionBody(appSource, "executeQuickBuyAmount"), /autoExit[\s\S]*takeProfitPct[\s\S]*stopLossPct/);
  assert.match(functionBody(appSource, "confirmConnectedBrowserTrade"), /Next step: approve the transaction in your wallet/);
  assert.doesNotMatch(panel, /Quick Buy Drawer/);
  assert.doesNotMatch(panel, /data-protected-buy-open/);
  assert.doesNotMatch(panel, /chart-trade-links/);
  assert.match(functionBody(appSource, "smartChartHtml"), /chartTradePanelHtml\(token, heldPosition\)/);
  assert.match(functionBody(appSource, "applyChartRouteFromLocation"), /params\.get\("token"\)/);
});

test("Chart page uses a clean DEX chart and transactions workspace", () => {
  const chart = functionBody(appSource, "smartChartHtml");
  assert.match(chart, /smart-chart-clean-terminal/);
  assert.match(chart, /smartChartMarketBarHtml\(token, heldPosition\)/);
  assert.match(chart, /smartChartDexFrameHtml\(token, "chartTxns"\)/);
  assert.match(chart, /chartTradePanelHtml\(token, heldPosition\)/);
  assert.doesNotMatch(chart, /smartChartViewTabsHtml\(chartView\)/);
  assert.doesNotMatch(chart, /smartChartQuickActionsHtml\(token, heldPosition\)/);
  assert.doesNotMatch(chart, /smart-chart-bottom-grid/);
  assert.match(functionBody(appSource, "smartChartTransactionsHtml"), /smartChartDexFrameHtml\(token, "txns"\)/);
  assert.match(functionBody(appSource, "smartChartInfoPanelHtml"), /smartChartDexFrameHtml\(token, "info"\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-frame-loading/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /fetchpriority="high"/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /setAttribute\('data-loaded','true'\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-mint/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-mode/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-src/);
  assert.match(functionBody(appSource, "pumpChartSvgHtml"), /const snapshotMode =/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /queueSmartChartBootstrap\(token\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /smartChartFrameUrl\(token, mode\)/);
  assert.match(functionBody(appSource, "smartChartDexFrameHtml"), /data-chart-resolving/);
  assert.doesNotMatch(functionBody(appSource, "smartChartDexFrameHtml"), /smartChartPumpPanelHtml\(token, mode\)/);
  assert.doesNotMatch(functionBody(appSource, "smartChartDexFrameHtml"), /data-slime-pump-source/);
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
  assert.match(functionBody(appSource, "render"), /captureSmartChartFrameForRender/);
  assert.match(functionBody(appSource, "render"), /restoreSmartChartFrameAfterRender/);
  assert.match(functionBody(appSource, "restoreSmartChartFrameAfterRender"), /replaceWith\(snapshot\.frame\)/);
  assert.match(functionBody(appSource, "refreshTerminalFeed"), /preserveSmartChartFrame: state\.activeTab === "smartChart" && tabKey === "smartChart"/);
  assert.match(functionBody(appSource, "refreshWalletState"), /preserveSmartChartFrame: state\.activeTab === "smartChart"/);
  assert.match(chartCssSource, /WEB_WALLET_CHART_REFRESH_CLEANUP_20260608_V2/);
  assert.match(chartCssSource, /smart-chart-clean-grid[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(292px, 360px\)/);
  assert.match(chartCssSource, /smart-chart-clean-main \.smart-chart-frame[\s\S]*height: clamp\(540px, 70vh, 780px\)/);
  assert.match(chartCssSource, /smart-chart-market-bar[\s\S]*grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(chartCssSource, /smart-chart-market-bar[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
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
