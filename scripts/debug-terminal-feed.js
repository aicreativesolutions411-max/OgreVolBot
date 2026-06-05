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
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function parseNumberLiteral(value = "0") {
  const parsed = Number(String(value).replaceAll("_", ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTerminalFeeds(appSource = "") {
  const start = appSource.indexOf("const TERMINAL_FEEDS = [");
  if (start < 0) return [];
  const end = appSource.indexOf("];", start);
  if (end < 0) return [];
  const block = appSource.slice(start, end);
  const feeds = [];
  const pattern = /\{[^\n]*tabKey:\s*"([^"]+)"[^\n]*\}/g;
  for (const match of block.matchAll(pattern)) {
    const item = match[0];
    const value = (field) => item.match(new RegExp(`${field}:\\s*"([^"]*)"`))?.[1] || "";
    const number = (field) => parseNumberLiteral(item.match(new RegExp(`${field}:\\s*([0-9_]+)`))?.[1] || "0");
    feeds.push({
      tabKey: match[1],
      label: value("label"),
      component: value("component"),
      endpoint: value("endpoint"),
      category: value("category"),
      refreshMs: number("refreshMs"),
      staleMs: number("staleMs"),
      cacheKey: value("cacheKey"),
      pageSize: number("pageSize"),
      maxPageSize: number("maxPageSize"),
      previewLimit: number("previewLimit"),
      supportsPagination: /supportsPagination:\s*true/.test(item)
    });
  }
  return feeds;
}

function argValue(name, fallback = "") {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);
  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

function bool(text, pattern) {
  return pattern.test(text);
}

const tabArg = argValue("tab", "slimeScope");
const [appSource, serverSource] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js")
]);
const eventsStore = await readJsonIfExists("terminal-feed-events.json", { events: [] });
const feeds = parseTerminalFeeds(appSource);
const feed = feeds.find((item) => item.tabKey.toLowerCase() === String(tabArg).toLowerCase());

if (!feed) {
  console.error(`Unknown terminal tab '${tabArg}'. Known tabs: ${feeds.map((item) => item.tabKey).join(", ")}`);
  process.exit(1);
}

const events = (eventsStore.events || []).filter((event) => event?.tabKey === feed.tabKey);
const latest = events.at(-1) || {};
const report = {
  tabKey: feed.tabKey,
  label: feed.label,
  component: feed.component,
  category: feed.category,
  endpoint: feed.endpoint,
  cacheKey: feed.cacheKey,
  queryParams: {
    category: feed.category,
    bucket: feed.cacheKey.includes("{bucket}") ? "live|under1h|under3h|under1d" : null,
    sort: feed.cacheKey.includes("{sort}") ? "best|newest|volume|liquidity|buys|momentum|risk" : null,
    mode: feed.cacheKey.includes("{scopeMode}") ? "new|graduating|graduated" : feed.cacheKey.includes("{scanMode}") ? "safe|smart|fast|pumpsnipe|moonshot|meme|long" : null
  },
  providerSource: feed.endpoint.startsWith("composite:") ? "backend-composite" : feed.endpoint.startsWith("local:") ? "local-ui-state" : "backend-endpoint",
  pageSize: feed.pageSize,
  maxPageSize: feed.maxPageSize,
  previewLimit: feed.previewLimit,
  supportsPagination: feed.supportsPagination,
  lastEvent: latest.at ? {
    at: latest.at,
    status: latest.status,
    reason: latest.reason,
    rawProviderCount: latest.rawProviderCount ?? null,
    backendReturnedCount: latest.resultCount ?? null,
    frontendRenderedCount: latest.renderedCount ?? null,
    pageSize: latest.pageSize ?? feed.pageSize,
    nextCursor: latest.nextCursor || null,
    hasMore: Boolean(latest.hasMore),
    stale: Boolean(latest.stale),
    errorCode: latest.errorCode || "",
    errorMessage: latest.errorMessage || ""
  } : null,
  staticAudit: {
    frontendUsesWindowing: bool(appSource, new RegExp(`terminalFeedRowsWindow\\("${feed.tabKey}"`)),
    frontendHasLoadMore: bool(appSource, new RegExp(`terminalFeedLoadMoreHtml\\("${feed.tabKey}"`)),
    endpointHasBackendMetadata: feed.tabKey === "live"
      ? bool(serverSource, /backendReturnedCount/) && bool(serverSource, /pageSize:\s*targetLimit/)
      : feed.tabKey === "sniper"
        ? bool(serverSource, /pageSize:\s*36/)
        : true,
    anyStaticMockDataSignal: /samplePair|staticPair|mockPair|demoPair/i.test(appSource)
  },
  recentEvents: events.slice(-10)
};

console.log(`TERMINAL FEED DEBUG ${feed.tabKey}`);
console.log(JSON.stringify(report, null, 2));
