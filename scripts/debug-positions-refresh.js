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

const [appSource, serverSource, perfStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readJsonIfExists("performance-events.json", { events: [] })
]);

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const positionEvents = events.filter((event) => /positions-refresh/.test(event.action || "") || event.component === "positions");
const cacheHitEvents = positionEvents.filter((event) => event.cacheHit);
const networkRefreshEvents = positionEvents.filter((event) => !event.cacheHit && /positions-refresh/.test(event.action || ""));
const positionsRouteSource = serverSource.slice(serverSource.indexOf('pathname === "/api/web/positions"'), serverSource.indexOf('pathname === "/api/web/pnl"'));
const buildPositionsSource = functionSource(serverSource, "buildPositionsOverview");
const webPositionRowsSource = functionSource(serverSource, "webPositionRows");
const appLoadWalletCoreSource = functionSource(appSource, "loadWalletCore");
const report = {
  latestPositionsRefresh: positionEvents.at(-1) || null,
  recentPositionsRefreshes: positionEvents.slice(-20),
  timings: {
    cachedMs: cacheHitEvents.at(-1)?.durationMs ?? null,
    backgroundRefreshMs: networkRefreshEvents.at(-1)?.durationMs ?? null,
    cacheHit: Boolean(cacheHitEvents.length),
    positionsCount: positionEvents.at(-1)?.resultCount ?? null,
    openCount: null,
    priceCalls: (buildPositionsSource.match(/currentPrice|estimatedValueLamports|positionValue/g) || []).length,
    slowestStep: [...positionEvents].sort((a, b) => Number(b.durationMs || 0) - Number(a.durationMs || 0)).at(0) || null
  },
  sanitizedShape: {
    walletPublicKeyShortenedOnly: true,
    secretsLogged: false
  },
  refreshPath: {
    endpoint: "/api/web/positions",
    backendSummaryCache: bool(positionsRouteSource, /cachedWebSummary\("web:positions"/),
    frontendRunsAlongsideWalletRefresh: bool(appLoadWalletCoreSource, /positionsPromise = api/) && bool(appLoadWalletCoreSource, /Promise\.all/),
    cachedUiKeptDuringRefresh: !/state\.positions\s*=\s*\[\][\s\S]{0,200}walletRefreshing/.test(functionSource(appSource, "refreshWalletState")),
    positionRefreshTimedSeparately: bool(appLoadWalletCoreSource, /perfMeasure\("positions-refresh"/)
  },
  backendCalls: {
    walletTokenAccountsUseConcurrency: bool(buildPositionsSource, /runWithConcurrency\(wallets/),
    valueEstimatesLimitedToTopOpenRows: bool(buildPositionsSource, /rows\.slice\(0, 5\)/),
    metadataResolvedAfterPositionMath: bool(webPositionRowsSource, /tokenMetadataMapForMints/) && bool(webPositionRowsSource, /estimatedValueLamports/),
    metadataTimeoutBounded: bool(webPositionRowsSource, /timeoutMs:\s*2_000/) && bool(webPositionRowsSource, /pumpTimeoutMs:\s*1_000/)
  },
  cacheBehavior: {
    cacheHitEvents: positionEvents.filter((event) => event.cacheHit).length,
    lastUpdatedTimeReturnedByBackend: bool(positionsRouteSource, /lastUpdatedAt: summary\.cachedAt/),
    refreshDurationReturnedByBackend: bool(positionsRouteSource, /refreshDurationMs: summary\.durationMs/)
  }
};

console.log("POSITIONS REFRESH DEBUG");
console.log(JSON.stringify(report, null, 2));
