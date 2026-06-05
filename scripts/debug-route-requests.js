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

function functionBody(name) {
  const marker = `function ${name}`;
  const start = appSource.indexOf(marker);
  if (start === -1) return "";
  const next = appSource.indexOf("\nfunction ", start + marker.length);
  return appSource.slice(start, next === -1 ? undefined : next);
}

const route = argValue("route") || "/terminal/chart";
const refreshBody = functionBody("refreshTerminalFeed");
const smartChartMatch = refreshBody.match(/\} else if \(tabKey === "smartChart"\) \{([\s\S]*?)\n    \} else if \(\["trade"/);
const smartChartBranch = smartChartMatch?.[1] || "";
const apiPaths = [...new Set([...appSource.matchAll(/api\(`([^`]+)`|api\("([^"]+)"/g)].map((match) => match[1] || match[2]).filter(Boolean))];
const chartRequired = [
  "/api/web/chart/bootstrap",
  "/api/web/positions",
  "/api/web/balances",
  "/api/web/wallets"
];

console.log(JSON.stringify({
  route,
  allChartRouteRequests: chartRequired.map((pathName) => ({
    endpoint: pathName,
    requiredForFirstPaint: pathName === "/api/web/chart/bootstrap",
    cacheAware: pathName === "/api/web/chart/bootstrap" || /cachedWebSummary/.test(appSource),
    note: pathName === "/api/web/chart/bootstrap"
      ? "token/pair/embed bootstrap"
      : "account panel only when logged in"
  })),
  sourceApiPathsMentioned: apiPaths.filter((pathName) => /chart|dex-token|wallet|positions|balances|pnl|live-pairs/.test(pathName)).slice(0, 30),
  smartChartRefreshBranch: {
    walletOnly: /refreshWalletState/.test(smartChartBranch),
    livePairsRefreshed: /refreshLivePairBuckets|loadLivePairs/.test(smartChartBranch),
    loadAllRefreshed: /loadAll/.test(smartChartBranch)
  },
  terminalFeedsUnnecessarilyRefreshed: /refreshLivePairBuckets|loadLivePairs|loadKolScan|loadWatchlist|loadAll/.test(smartChartBranch),
  timings: {
    chartRouteStart: /perfMark\("chartRouteStart"\)/.test(appSource),
    tokenHeaderRendered: /perfMark\("tokenHeaderRendered"\)/.test(appSource),
    chartSkeletonRendered: /perfMark\("chartSkeletonRendered"\)/.test(appSource),
    buyPanelReady: /perfMark\("buyPanelReady"\)/.test(appSource)
  }
}, null, 2));
