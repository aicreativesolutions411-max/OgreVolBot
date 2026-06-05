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

function functionSource(source = "", name = "") {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(source);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  if (start < 0) return "";
  const paramsStart = source.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  return "";
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

const [appSource, serverSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const refreshWalletStateSource = functionSource(appSource, "refreshWalletState");
const positionEvents = events.filter((event) => event.component === "positions" || /position-refresh|positions-refresh/.test(event.action || ""));
const clickEvents = positionEvents.filter((event) => event.action === "position-refresh-click-to-state");
const cacheHits = positionEvents.filter((event) => event.cacheHit);
const errors = positionEvents.filter((event) => event.errorCode).slice(-5);

const report = {
  latestPositionRefresh: positionEvents.at(-1) || null,
  recentPositionRefreshes: positionEvents.slice(-20),
  timings: {
    clickToGreenMs: clickEvents.at(-1)?.durationMs ?? null,
    cachedResponseMs: cacheHits.at(-1)?.durationMs ?? null,
    backgroundRefreshMs: positionEvents.filter((event) => /positions-refresh/.test(event.action || "") && !event.cacheHit).at(-1)?.durationMs ?? null,
    p95Ms: percentileMs(positionEvents),
    cacheHit: Boolean(cacheHits.length),
    dedupeHit: positionEvents.some((event) => /dedupe/.test(event.action || "")),
    slowestStep: [...positionEvents].sort((a, b) => Number(b.durationMs || 0) - Number(a.durationMs || 0)).at(0) || null,
    lastUpdatedAt: positionEvents.at(-1)?.at || "",
    stale: Boolean(positionEvents.at(-1)?.stale),
    errors
  },
  implementation: {
    buttonTurnsLightGreenImmediately: bool(appSource, /position-refresh-click-to-state/) && bool(appSource, /setPositionRefreshAction\("clicked"/),
    visibleStateHeldAtLeast500ms: bool(appSource, /now \+ \(nextState === "clicked" \|\| nextState === "success" \? 700 : 0\)/),
    cachedDataKeptVisible: !/state\.positions\s*=\s*\[\]/.test(refreshWalletStateSource),
    repeatedClicksDedupe: bool(appSource, /wallet-refresh-dedupe/) && bool(appSource, /walletRefreshPromise/),
    backendSummaryCache: bool(serverSource, /cachedWebSummary\("web:positions"/),
    metadataDoesNotBlockMath: bool(serverSource, /metadataResolvedAfterPositionMath|tokenMetadataMapForMints/) || bool(serverSource, /timeoutMs:\s*2_000/)
  },
  secretsPrinted: false
};

console.log("POSITION REFRESH DEBUG");
console.log(JSON.stringify(report, null, 2));
