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

function bool(text, pattern) {
  return pattern.test(text);
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
  const pattern = /\{\s*tabKey:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*component:\s*"([^"]+)",\s*endpoint:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*refreshMs:\s*([0-9_]+),\s*staleMs:\s*([0-9_]+),\s*cacheKey:\s*"([^"]+)"/g;
  for (const match of block.matchAll(pattern)) {
    feeds.push({
      tabKey: match[1],
      label: match[2],
      component: match[3],
      endpoint: match[4],
      category: match[5],
      refreshMs: parseNumberLiteral(match[6]),
      staleMs: parseNumberLiteral(match[7]),
      cacheKey: match[8]
    });
  }
  return feeds;
}

function duplicates(items, key) {
  const groups = new Map();
  for (const item of items) {
    const value = item[key];
    groups.set(value, [...(groups.get(value) || []), item.tabKey]);
  }
  return [...groups.entries()]
    .filter(([, tabKeys]) => tabKeys.length > 1)
    .map(([value, tabKeys]) => ({ value, tabKeys }));
}

function staticDataSignals(appSource = "", serverSource = "") {
  return {
    appStaticPairRows: /samplePair|staticPair|mockPair|demoPair/i.test(appSource),
    localOgreTekMockProvider: /provider:\s*String\(process\.env\.OGRE_TEK_PROVIDER \|\| "mock"\)/.test(serverSource),
    localOnlyFeeds: (appSource.match(/endpoint:\s*"local:/g) || []).length
  };
}

function pollingSignals(appSource = "") {
  const timers = ["livePairsTimer", "scanTimer", "kolTimer", "watchlistTimer", "terminalFeedTimer"];
  return Object.fromEntries(timers.map((timer) => [timer, bool(appSource, new RegExp(`let ${timer} = null`))]));
}

function functionSource(source = "", name = "") {
  const start = source.indexOf(`function ${name}`);
  const asyncStart = source.indexOf(`async function ${name}`);
  const functionStart = start >= 0 && (asyncStart < 0 || start < asyncStart) ? start : asyncStart;
  if (functionStart < 0) return "";
  const paramsStart = source.indexOf("(", functionStart);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "(") paramsDepth += 1;
    if (char === ")") {
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
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(functionStart, index + 1);
    }
  }
  return "";
}

const [appSource, serverSource, packageSource] = await Promise.all([
  readText("web/public/app.js"),
  readText("src/index.js"),
  readText("package.json")
]);
const eventsStore = await readJsonIfExists("terminal-feed-events.json", { events: [] });
const feeds = parseTerminalFeeds(appSource);
const recordTerminalFeedEventSource = functionSource(serverSource, "recordTerminalFeedEvent");

const report = {
  feedRegistry: feeds,
  registryChecks: {
    feedCount: feeds.length,
    duplicateCacheKeys: duplicates(feeds, "cacheKey"),
    duplicateCategories: duplicates(feeds, "category"),
    hasRequiredTabs: {
      livePairs: feeds.some((feed) => feed.tabKey === "live" && feed.category === "pairs:new"),
      liveTrades: feeds.some((feed) => feed.tabKey === "liveTrades" && feed.category === "trades:recent"),
      slimeScope: feeds.some((feed) => feed.tabKey === "slimeScope" && feed.category === "scanner:slime-scope"),
      kolTracker: feeds.some((feed) => feed.tabKey === "kol" && feed.category === "signals:kol"),
      watchlist: feeds.some((feed) => feed.tabKey === "watchlist" && feed.category === "user:watchlist")
    }
  },
  refreshWiring: {
    sharedHookPresent: bool(appSource, /async function refreshTerminalFeed/),
    visibleRefreshPresent: bool(appSource, /async function refreshVisibleTerminalFeeds/),
    activePollerPresent: bool(appSource, /function scheduleActiveTerminalFeedRefresh/),
    siteLoadRefresh: bool(appSource, /reason:\s*"site-load"/),
    tabSwitchRefresh: bool(appSource, /reason:\s*"tab-switch"/),
    visibilityFocusRefresh: bool(appSource, /reason:\s*"visibility-focus-return"/),
    manualRefreshRoutesThroughRegistry: bool(appSource, /data-refresh-feeds[\s\S]*refreshVisibleTerminalFeeds/) && bool(appSource, /data-refresh-all[\s\S]*refreshTerminalFeed/)
  },
  backendDiagnostics: {
    terminalFeedEventEndpoint: bool(serverSource, /\/api\/web\/terminal-feed-event/),
    terminalFeedEventsFile: bool(serverSource, /terminal-feed-events\.json/),
    serverSanitizesFeedEvents: bool(recordTerminalFeedEventSource, /safeTerminalFeedText\(body\.tabKey/) && !/(password|privateKey|seed|secret|Authorization)/i.test(recordTerminalFeedEventSource)
  },
  iconLoading: {
    globalFallbackInstalled: bool(appSource, /function installSlimewireImageFallbacks/),
    capturePhaseErrorHandler: bool(appSource, /addEventListener\("error", handleSlimewireImageError, true\)/),
    criticalPrewarm: bool(appSource, /function prewarmSlimewireImageAssets/) && bool(appSource, /SLIMEWIRE_CRITICAL_IMAGE_ASSETS/),
    providerFallbackAttributes: bool(appSource, /walletChoiceIcon\("phantom"\)/) && bool(appSource, /walletChoiceIcon\("solflare"\)/)
  },
  staticDataSignals: staticDataSignals(appSource, serverSource),
  pollingSignals: pollingSignals(appSource),
  packageScriptPresent: bool(packageSource, /"debug:terminal-feeds"/),
  recentTerminalFeedEvents: (eventsStore.events || []).slice(-20)
};

console.log("TERMINAL FEEDS DEBUG");
console.log(JSON.stringify(report, null, 2));
