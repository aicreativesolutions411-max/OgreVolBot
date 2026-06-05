import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const appSource = fs.readFileSync(path.join(rootDir, "web", "public", "app.js"), "utf8");
const serverSource = fs.readFileSync(path.join(rootDir, "src", "index.js"), "utf8");

function argValue(name) {
  const prefix = `--${name}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length).trim() : "";
}

function publicBaseUrl() {
  return String(process.env.SLIMEWIRE_API_BASE || process.env.API_BASE || "https://ogrevolbot.onrender.com")
    .replace(/\/+$/, "");
}

function safeText(value = "", max = 160) {
  return String(value || "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/[^\w .:/?&=#@,+-]/g, "")
    .trim()
    .slice(0, max);
}

async function fetchChartBootstrap(token) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  const started = Date.now();
  try {
    const url = `${publicBaseUrl()}/api/web/chart/bootstrap?token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { signal: controller.signal });
    const text = await response.text();
    let data = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    return {
      ok: response.ok && data.ok !== false,
      status: response.status,
      durationMs: Date.now() - started,
      chart: data.chart || null,
      error: response.ok ? "" : safeText(text, 180)
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      durationMs: Date.now() - started,
      chart: null,
      error: safeText(error?.message || "fetch failed")
    };
  } finally {
    clearTimeout(timer);
  }
}

const token = argValue("token") || "9zxzh4kFDM6nqLY3MnRTnr3YYyMj1wTEQT4EiCYjpump";
const route = `/terminal/chart?token=${encodeURIComponent(token)}&tab=chart&source=terminal-row`;
const bootstrap = await fetchChartBootstrap(token);
const chart = bootstrap.chart || {};
const refreshMatch = appSource.match(/\} else if \(tabKey === "smartChart"\) \{([\s\S]*?)\n    \} else if \(\["trade"/);
const smartChartBranch = refreshMatch?.[1] || "";
const smartChartBranchUsesWallet = /refreshWalletState/.test(smartChartBranch);
const smartChartBranchRefreshesFeeds = /refreshLivePairBuckets|loadLivePairs|loadKolScan|loadWatchlist|loadAll/.test(smartChartBranch);

console.log(JSON.stringify({
  route,
  token,
  pairAddress: chart.pairAddress || "",
  metadataSource: chart.metadataSource || "",
  pairResolutionMs: Number(chart.pairResolutionMs || chart.timings?.pairResolveMs || 0),
  chartProvider: chart.chartProvider || (/dexScreenerEmbedUrl/.test(appSource) ? "dexscreener-embed" : "unknown"),
  candleCacheKey: chart.candleCacheKey || "",
  candleCacheHit: Boolean(chart.candleCacheHit || chart.cacheHit),
  candleFetchMs: Number(chart.candleFetchMs || chart.timings?.candleMs || 0),
  chartLibraryLoadMs: Number(chart.chartLibraryLoadMs || chart.timings?.chartLibMs || 0),
  tokenHeaderReadyMs: /perfMark\("tokenHeaderRendered"\)/.test(appSource) ? 0 : null,
  chartSkeletonReadyMs: /perfMark\("chartSkeletonRendered"\)/.test(appSource) ? 0 : null,
  chartFirstPaintMs: /chart-first-paint/.test(appSource) ? "iframe-onload" : null,
  buyPanelReadyMs: /perfMark\("buyPanelReady"\)/.test(appSource) ? 0 : null,
  cacheHit: Boolean(chart.cacheHit),
  stale: Boolean(chart.stale),
  requestsFiredOnRouteOpen: [
    "/api/web/chart/bootstrap",
    smartChartBranchUsesWallet ? "/api/web/wallets|balances|positions when logged in only" : ""
  ].filter(Boolean),
  unrelatedFeedRefreshesTriggered: smartChartBranchRefreshesFeeds,
  backendEndpointPresent: /pathname === "\/api\/web\/chart\/bootstrap"/.test(serverSource),
  frontendUsesBootstrapEndpoint: /\/api\/web\/chart\/bootstrap\?token=/.test(appSource),
  fetchStatus: bootstrap.status,
  fetchMs: bootstrap.durationMs,
  errors: bootstrap.error ? [bootstrap.error] : []
}, null, 2));
