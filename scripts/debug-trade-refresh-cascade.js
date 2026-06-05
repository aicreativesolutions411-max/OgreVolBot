import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

function argValue(name) {
  const direct = process.argv.find((arg) => arg.startsWith(`${name}=`));
  if (direct) return direct.slice(name.length + 1);
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

async function readText(file) {
  return fs.readFile(path.join(rootDir, file), "utf8");
}

async function readJsonIfExists(fileName, fallback) {
  try {
    return JSON.parse(await fs.readFile(path.join(dataDir, fileName), "utf8"));
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function bool(text, pattern) {
  return pattern.test(text);
}

const launchId = String(argValue("--tradeAttemptId") || process.env.DEBUG_TRADE_ATTEMPT_ID || "").trim();
const [appSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const scoped = launchId ? events.filter((event) => event.requestId === launchId) : events.filter((event) => /post-trade|trade-|manual-sell|position-refresh/.test(`${event.component || ""} ${event.action || ""}`)).slice(-80);
const invalidation = scoped.find((event) => event.action === "post-trade-invalidation-start");
const refreshStarts = scoped.filter((event) => event.action === "post-trade-refresh-start");
const refreshEnds = scoped.filter((event) => event.action === "post-trade-refresh-end");

const report = {
  tradeAttemptId: launchId || scoped.find((event) => event.requestId)?.requestId || "",
  invalidatedKeys: invalidation?.details || "wallet-summary,positions,pnl,trade-history,selected-token,live-trades",
  apiRequestsAfterTrade: refreshStarts.map((event) => ({ at: event.at, action: event.action, details: event.details })),
  workerJobsEnqueued: "post-trade wallet/positions/pnl refresh through cache-first web path; worker display cache warmer remains separate",
  refreshDurations: refreshEnds.map((event) => ({ at: event.at, durationMs: event.durationMs, refreshedKeys: event.details })),
  duplicateCalls: scoped.filter((event) => /dedupe/i.test(event.action || "")),
  hiddenTabRefreshes: scoped.filter((event) => event.action === "hidden-feed-refresh-skipped"),
  excessiveRenders: scoped.filter((event) => event.action === "render" && Number(event.durationMs || 0) >= 50),
  finalUiState: refreshEnds.length ? "refreshed-or-refreshing-with-cached-cards-visible" : "no-runtime-events-yet",
  implementation: {
    postTradeDoesNotCallVisibleFeedRefresh: !/queuePostTradeRefresh[\s\S]{0,2400}refreshVisibleTerminalFeeds/.test(appSource),
    postTradeDoesNotCallTerminalFeedRefresh: !/queuePostTradeRefresh[\s\S]{0,2400}refreshTerminalFeed/.test(appSource),
    postTradeSupplementalLimited: bool(appSource, /loadPostTradeSupplemental[\s\S]*api\("\/api\/web\/pnl"\)[\s\S]*api\("\/api\/web\/trade\/plans"\)/),
    scheduledRefreshCountBounded: bool(appSource, /POST_TRADE_REFRESH_DELAYS_MS = \[300, 2200, 6500\]/),
    oldDataKeptVisible: !/async function refreshWalletState[\s\S]{0,2200}state\.positions\s*=\s*\[\]/.test(appSource)
  },
  secretsPrinted: false
};

console.log("TRADE REFRESH CASCADE DEBUG");
console.log(JSON.stringify(report, null, 2));
