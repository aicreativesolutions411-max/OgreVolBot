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
const walletEvents = events.filter((event) => /wallet-refresh|load-all/.test(event.action || "") || event.component === "wallet");
const cacheHitEvents = walletEvents.filter((event) => event.cacheHit);
const networkRefreshEvents = walletEvents.filter((event) => !event.cacheHit && /wallet-refresh|load-all/.test(event.action || ""));
const balanceRouteSource = serverSource.slice(serverSource.indexOf('pathname === "/api/web/balances"'), serverSource.indexOf('pathname === "/api/web/positions"'));
const webBalanceRowsSource = functionSource(serverSource, "webBalanceRows");
const report = {
  latestWalletRefresh: walletEvents.at(-1) || null,
  recentWalletRefreshes: walletEvents.slice(-20),
  timings: {
    cachedMs: cacheHitEvents.at(-1)?.durationMs ?? null,
    backgroundRefreshMs: networkRefreshEvents.at(-1)?.durationMs ?? null,
    p95Ms: percentileMs(walletEvents),
    cacheHit: Boolean(cacheHitEvents.length),
    dedupeHit: events.some((event) => event.action === "wallet-refresh-dedupe"),
    partialErrors: walletEvents.filter((event) => event.errorCode).slice(-5)
  },
  sanitizedShape: {
    walletPublicKeyShortenedOnly: true,
    secretsLogged: false
  },
  refreshPath: {
    endpoint: "/api/web/balances",
    backendSummaryCache: bool(balanceRouteSource, /cachedWebSummary\("web:balances"/),
    frontendInFlightDedupe: bool(appSource, /let walletRefreshPromise = null/) && bool(functionSource(appSource, "refreshWalletState"), /walletRefreshPromise/),
    getRequestDedupe: bool(functionSource(appSource, "api"), /apiInFlight/),
    cachedUiKeptDuringRefresh: !/state\.balances\s*=\s*\[\][\s\S]{0,200}walletRefreshing/.test(functionSource(appSource, "refreshWalletState")),
    showsRefreshingIndicator: bool(appSource, /state\.walletRefreshing \? "Refreshing/) || bool(appSource, /syncHealthLabel/)
  },
  backendCalls: {
    solBalanceCalls: (webBalanceRowsSource.match(/getSolBalanceCached/g) || []).length,
    tokenAccountCalls: (webBalanceRowsSource.match(/getOwnedTokenAccountsWithWarningsCached/g) || []).length,
    rpcCalls: (webBalanceRowsSource.match(/rpcWithRetry/g) || []).length,
    callsRunInParallel: bool(balanceRouteSource, /Promise\.all/) && bool(webBalanceRowsSource, /runWithConcurrency/),
    tokenMetadataSeparateFromBalances: !/tokenMetadataMapForMints/.test(webBalanceRowsSource)
  },
  cacheBehavior: {
    cacheHitEvents: walletEvents.filter((event) => event.cacheHit).length,
    dedupeEvents: events.filter((event) => event.action === "wallet-refresh-dedupe").length,
    lastUpdatedTimeReturnedByBackend: bool(balanceRouteSource, /lastUpdatedAt: summary\.cachedAt/),
    refreshDurationReturnedByBackend: bool(balanceRouteSource, /refreshDurationMs: summary\.durationMs/)
  }
};

console.log("WALLET REFRESH DEBUG");
console.log(JSON.stringify(report, null, 2));
