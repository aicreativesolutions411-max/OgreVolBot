import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(rootDir, "web", "public", "app.js"), "utf8");

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : "";
}

const token = argValue("token") || "<mintOrTokenAddress>";
const route = `/terminal/chart?token=${encodeURIComponent(token)}&tab=buy&focusAmount=1`;

console.log(JSON.stringify({
  routeMatched: /pathname\.includes\("\/chart"\)/.test(appSource),
  route,
  tokenAddress: token,
  pairAddress: null,
  metadataSource: /selectedSmartChartTokenRow/.test(appSource) ? "selectedSmartChartTokenRow + visible feed fallback" : "unknown",
  chartDataSource: /dexChartEmbedUrl/.test(appSource) ? "DexScreener embed by mint" : "unknown",
  buyPanelLoaded: /function chartTradePanelHtml[\s\S]*data-chart-confirm-buy/.test(appSource),
  sellPanelLoaded: /function chartTradePanelHtml[\s\S]*data-chart-confirm-sell/.test(appSource),
  walletStatus: /walletOptionsHtml\(walletSelected\)/.test(appSource) ? "chart panel uses existing walletOptionsHtml" : "unknown",
  positionStatus: /heldPosition/.test(appSource) ? "chart panel renders tracked position if present" : "unknown",
  publicRouteState: {
    usesDurableTokenParam: /token", mint/.test(appSource) || /params\.set\("token"/.test(appSource),
    parsesRouteTokenOnBoot: /applyChartRouteFromLocation\(\)/.test(appSource)
  }
}, null, 2));
