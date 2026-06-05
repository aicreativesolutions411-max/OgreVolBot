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

const [appSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const crashes = events.filter((event) => event.action === "frontend-crash" || event.component === "frontend-crash");

const report = {
  recentCrashes: crashes.slice(-20).map((event) => ({
    at: event.at,
    route: event.route,
    actionBeforeCrash: event.actionBeforeCrash || event.details,
    errorCode: event.errorCode,
    message: event.details || "",
    requestId: event.requestId,
    caughtByBoundary: Boolean(event.caughtByBoundary)
  })),
  implementation: {
    windowOnErrorCaptured: bool(appSource, /window\.addEventListener\("error"/),
    unhandledRejectionCaptured: bool(appSource, /window\.addEventListener\("unhandledrejection"/),
    renderBoundaryCaught: bool(appSource, /caughtByBoundary: true/) && bool(appSource, /terminal-error-boundary/),
    crashLogStoredSafely: bool(appSource, /CRASH_LOG_KEY/) && bool(appSource, /safePerfText/)
  },
  secretsPrinted: false
};

console.log("FRONTEND CRASH DEBUG");
console.log(JSON.stringify(report, null, 2));
