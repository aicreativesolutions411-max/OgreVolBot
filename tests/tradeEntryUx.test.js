import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugEntrySource = fs.readFileSync(new URL("../scripts/debug-trade-entrypoints.js", import.meta.url), "utf8");
const debugChartSource = fs.readFileSync(new URL("../scripts/debug-chart-route.js", import.meta.url), "utf8");
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
  assert.match(functionBody(appSource, "terminalSignalRowsHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "terminalSignalRowsHtml"), /data-quick-buy-token/);
  assert.match(functionBody(appSource, "compactSignalRowsHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "compactSignalRowsHtml"), /data-quick-buy-token/);
  assert.match(functionBody(appSource, "tokenSignalRowHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "tokenSignalRowHtml"), /data-quick-buy-token/);
  assert.match(functionBody(appSource, "tokenPreviewHtml"), /data-token-trade/);
  assert.match(functionBody(appSource, "tokenPreviewHtml"), /data-quick-buy-token/);
  assert.doesNotMatch(functionBody(appSource, "terminalSignalRowsHtml"), /data-quick-trade-token/);
  assert.doesNotMatch(functionBody(appSource, "tokenSignalRowHtml"), /data-quick-trade-token/);
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
  assert.match(functionBody(appSource, "chartAddressForToken"), /pairAddress/);
  assert.match(functionBody(appSource, "applyTokenRefToState"), /smartChartTokenRef/);
});

test("Debug commands are wired and sanitized", () => {
  assert.match(packageSource, /debug:trade-entrypoints/);
  assert.match(packageSource, /debug:chart-route/);
  assert.match(packageSource, /debug:quick-buy/);
  assert.doesNotMatch(`${debugEntrySource}\n${debugChartSource}\n${debugQuickBuySource}`, /privateKey|secretKey|seed phrase|Authorization|JWT/i);
});
