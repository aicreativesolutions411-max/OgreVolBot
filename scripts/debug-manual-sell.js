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

function percentileMs(events, quantile = 0.95) {
  const values = events
    .map((event) => Number(event.durationMs || 0))
    .filter((value) => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b);
  if (!values.length) return null;
  const index = Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1);
  return values[index];
}

function detailValue(details = "", key = "") {
  const match = String(details || "").match(new RegExp(`${key}=([^;]+)`));
  return match ? match[1].trim() : "";
}

const [appSource, serverSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const manualEvents = events.filter((event) => event.component === "manual-sell" || /manual-sell/.test(event.action || ""));
const backendEvents = manualEvents.filter((event) => /backend/.test(event.action || ""));
const uiAckEvents = manualEvents.filter((event) => event.action === "manual-sell-click-to-ui");
const requestEvents = manualEvents.filter((event) => event.action === "manual-sell-request");
const latestBackend = backendEvents.at(-1) || null;

const report = {
  last20ManualSellAttempts: manualEvents.slice(-20),
  timings: {
    clickToUiMs: uiAckEvents.at(-1)?.durationMs ?? null,
    frontendRequestMs: requestEvents.at(-1)?.durationMs ?? null,
    backendTotalMs: latestBackend?.durationMs ?? null,
    backendP95Ms: percentileMs(backendEvents),
    slowestBackendStep: latestBackend ? detailValue(latestBackend.details, "slowest") : "",
    queueWaitMs: latestBackend ? Number(detailValue(latestBackend.details, "queueWaitMs") || 0) : null,
    cacheHit: Boolean(latestBackend?.cacheHit),
    status: latestBackend ? detailValue(latestBackend.details, "status") : ""
  },
  implementation: {
    immediateUiFeedback: bool(appSource, /manual-sell-click-to-ui/) && bool(appSource, /setManualSellAction\(tokenMint, String\(percent\), \{[\s\S]*state: "clicked"/),
    idempotencyKeyCreatedOnClick: bool(appSource, /createClientAttemptId\("manual-sell"\)/),
    doubleClickDedupe: bool(appSource, /manual-sell-dedupe/) && bool(appSource, /activeManualSellAction/),
    backendCriticalAttemptScope: bool(serverSource, /runManualSellCriticalAttempt/) && bool(serverSource, /manual-sell:/),
    postSellRefreshQueued: bool(appSource, /queuePostTradeRefresh/) && !/sellPositionPercent[\s\S]{0,1800}await refreshAfterTrade/.test(appSource),
    noFullTerminalFeedRefreshBeforeSellResponse: !/sellPositionPercent[\s\S]{0,1800}refreshVisibleTerminalFeeds/.test(appSource)
  },
  providerAndTx: {
    txSignatureStoredInTradeResponse: bool(serverSource, /signature: result\.signature/) || bool(serverSource, /signature: sell\.signature/),
    txSignaturePrintedByDebug: false,
    note: "Tx signatures stay in trade responses/audit data; this debug command avoids printing them unless a safe perf event already recorded one."
  },
  secretsPrinted: false
};

console.log("MANUAL SELL DEBUG");
console.log(JSON.stringify(report, null, 2));
