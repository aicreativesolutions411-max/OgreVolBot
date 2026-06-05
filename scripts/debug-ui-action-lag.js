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

function groupCounts(events, keyFn) {
  const counts = new Map();
  for (const event of events) {
    const key = keyFn(event);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([key, count]) => ({ key, count }));
}

const [appSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const actionEvents = events.filter((event) => ["ui-action", "manual-sell", "input"].includes(event.component) || /click-to-state|click-to-ui|interaction-delay/.test(event.action || ""));
const longTasks = events.filter((event) => event.action === "long-task" && Number(event.durationMs || 0) >= 50);
const renderEvents = events.filter((event) => event.action === "render");

const report = {
  last20ButtonActions: actionEvents.slice(-20).map((event) => ({
    at: event.at,
    action: event.action,
    component: event.component,
    clickToStateChangeMs: /click-to-state|click-to-ui/.test(event.action || "") ? event.durationMs : null,
    requestId: event.requestId,
    errorCode: event.errorCode,
    details: event.details
  })),
  requestTimings: events.filter((event) => /manual-sell-request|api-request|position-refresh/.test(event.action || "")).slice(-20),
  longTasksOver50ms: longTasks.slice(-20),
  excessiveRenderCounts: groupCounts(renderEvents, (event) => event.details || event.component || "render"),
  implementation: {
    eventTimingObserver: bool(appSource, /interaction-delay/) && bool(appSource, /durationThreshold:\s*80/),
    manualSellUiAck: bool(appSource, /manual-sell-click-to-ui/),
    refreshUiAck: bool(appSource, /position-refresh-click-to-state/),
    hiddenPollingGuarded: bool(appSource, /document\.hidden/) && bool(appSource, /scheduleActiveTerminalFeedRefresh/),
    requestDedupe: bool(appSource, /const apiInFlight = new Map\(\)/)
  },
  secretsPrinted: false
};

console.log("UI ACTION LAG DEBUG");
console.log(JSON.stringify(report, null, 2));
