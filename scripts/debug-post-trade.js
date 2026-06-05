import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));

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

function related(event = {}) {
  return /post-trade|trade-click|trade-backend|manual-sell|position-refresh-post-trade|frontend-crash/i.test(`${event.component || ""} ${event.action || ""}`);
}

const [appSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const postTradeEvents = events.filter(related);
const attempts = postTradeEvents.filter((event) => /click-to-ui|trade-click-to-ui|post-trade-invalidation-start/.test(event.action || ""));
const latestAttemptId = [...postTradeEvents].reverse().find((event) => event.requestId)?.requestId || "";
const latestEvents = latestAttemptId ? postTradeEvents.filter((event) => event.requestId === latestAttemptId) : [];

const report = {
  last20TradeAttempts: attempts.slice(-20).map((event) => ({
    at: event.at,
    tradeAttemptId: event.requestId,
    action: event.action,
    route: event.route,
    clickToUiMs: /click-to-ui|trade-click-to-ui/.test(event.action || "") ? event.durationMs : null,
    details: event.details,
    errorCode: event.errorCode
  })),
  latestAttempt: {
    tradeAttemptId: latestAttemptId,
    backendAckMs: latestEvents.find((event) => event.action === "trade-backend-ack")?.durationMs ?? null,
    invalidatedKeys: latestEvents.find((event) => event.action === "post-trade-invalidation-start")?.details || "",
    refreshedKeys: latestEvents.filter((event) => event.action === "post-trade-refresh-end").at(-1)?.details || "",
    requestCountAfterTrade: latestEvents.filter((event) => event.action === "post-trade-refresh-start").length,
    duplicateRefreshesDetected: latestEvents.filter((event) => /dedupe/i.test(event.action || "")).length,
    errorsOrCrashes: latestEvents.filter((event) => event.errorCode || event.action === "frontend-crash")
  },
  implementation: {
    refreshAfterTradeQueuesOnly: bool(appSource, /async function refreshAfterTrade[\s\S]{0,160}queuePostTradeRefresh/) && !/async function refreshAfterTrade[\s\S]{0,500}await refreshWalletState/.test(appSource),
    affectedKeysOnly: bool(appSource, /POST_TRADE_AFFECTED_KEYS/) && !/queuePostTradeRefresh[\s\S]{0,2200}refreshVisibleTerminalFeeds/.test(appSource),
    noGlobalFeedInvalidation: !/queuePostTradeRefresh[\s\S]{0,2200}refreshTerminalFeed/.test(appSource),
    cacheFirstWalletRefresh: bool(appSource, /loadPostTradeSupplemental/) && bool(appSource, /reason: "post-trade"/),
    hiddenFeedsPausedDuringPostTrade: bool(appSource, /isPostTradeRefreshActive\(\)[\s\S]{0,220}hidden-feed-refresh-skipped/),
    crashBoundaryInstalled: bool(appSource, /recordCrashEvent/) && bool(appSource, /render-boundary/)
  },
  secretsPrinted: false
};

console.log("POST TRADE DEBUG");
console.log(JSON.stringify(report, null, 2));
