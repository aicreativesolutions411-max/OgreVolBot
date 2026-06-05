import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(rootDir, "web", "public", "app.js"), "utf8");

const patterns = [
  ["tokenChart", /data-token-chart/g, "opens chart/trade page; never executes trade"],
  ["tradeButton", /data-token-trade/g, "opens chart/trade page with Buy panel"],
  ["quickBuy", /data-quick-buy-token/g, "quick buy preset or custom SOL drawer"],
  ["legacyQuickTrade", /data-quick-trade-token/g, "legacy alias only; should not be rendered by current rows"],
  ["positionSell", /data-position-sell/g, "existing manual sell handler"],
  ["chartConfirmBuy", /data-chart-confirm-buy/g, "chart Buy panel confirm through existing endpoints"],
  ["chartConfirmSell", /data-chart-confirm-sell/g, "chart Sell custom percent"]
];

const rows = patterns.map(([key, regex, behavior]) => ({
  key,
  count: [...appSource.matchAll(regex)].length,
  behavior,
  canExecuteTrade: key === "quickBuy" || key === "legacyQuickTrade" || key === "positionSell" || key === "chartConfirmBuy" || key === "chartConfirmSell"
}));

function functionBody(name) {
  const marker = `function ${name}`;
  const start = appSource.indexOf(marker);
  if (start === -1) return "";
  const next = appSource.indexOf("\nfunction ", start + marker.length);
  return appSource.slice(start, next === -1 ? undefined : next);
}

const openTokenChartBody = functionBody("openTokenChart");

const handlerSummary = {
  hasOpenTokenChart: /function openTokenChart/.test(appSource),
  hasOpenQuickBuy: /function openQuickBuy/.test(appSource),
  hasQuickBuyModal: /function quickBuyModalHtml/.test(appSource),
  quickBuyStopsPropagation: /data-quick-buy-token[\s\S]*?event\.stopPropagation\(\)/.test(appSource),
  tradeButtonStopsPropagation: /data-token-trade[\s\S]*?event\.stopPropagation\(\)/.test(appSource),
  chartClickExecutesBuy: /(executeWebBuy|quickPresetTrade|\/api\/web\/trade\/buy)/.test(openTokenChartBody)
};

console.log(JSON.stringify({
  route: "/terminal/chart?token=<mint>&tab=buy",
  entrypoints: rows,
  handlerSummary,
  notes: [
    "Trade/profile/card entrypoints route to chart only.",
    "Quick Buy is the only row/card action allowed to begin a buy flow.",
    "Output is source-derived and sanitized; no secrets are read."
  ]
}, null, 2));
