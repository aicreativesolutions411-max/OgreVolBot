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
      endpoint: value("endpoint"),
      category: value("category"),
      cacheKey: value("cacheKey"),
      pageSize: number("pageSize"),
      maxPageSize: number("maxPageSize"),
      refreshMs: number("refreshMs"),
      staleMs: number("staleMs"),
      supportsPagination: /supportsPagination:\s*true/.test(item)
    });
  }
  return feeds;
}

function bool(text, pattern) {
  return pattern.test(text);
}

const [appSource, cssSource, perfStore, feedStore] = await Promise.all([
  readText("web/public/app.js"),
  readText("web/public/slimewire-final-overrides.css"),
  readJsonIfExists("performance-events.json", { events: [] }),
  readJsonIfExists("terminal-feed-events.json", { events: [] })
]);

const feeds = parseTerminalFeeds(appSource);
const perfEvents = Array.isArray(perfStore.events) ? perfStore.events : [];
const feedEvents = Array.isArray(feedStore.events) ? feedStore.events : [];
const latestFeedByTab = new Map();
for (const event of feedEvents) {
  if (event?.tabKey) latestFeedByTab.set(event.tabKey, event);
}

const report = {
  terminalFeeds: feeds.map((feed) => ({
    ...feed,
    latestStatus: latestFeedByTab.get(feed.tabKey)?.status || null,
    latestResultCount: latestFeedByTab.get(feed.tabKey)?.resultCount ?? null,
    latestRenderedCount: latestFeedByTab.get(feed.tabKey)?.renderedCount ?? null,
    hasMore: latestFeedByTab.get(feed.tabKey)?.hasMore ?? null
  })),
  tabSwitchPerformance: perfEvents
    .filter((event) => event.action === "tab-switch" || event.action === "feed-refresh")
    .slice(-25),
  mainThreadWork: {
    longTasksOver50ms: perfEvents.filter((event) => event.action === "long-task" && Number(event.durationMs || 0) >= 50).slice(-20),
    terminalRenderEvents: perfEvents.filter((event) => event.action === "render" && String(event.details || "").startsWith("terminal")).slice(-20)
  },
  smoothnessGuards: {
    cachedTabRenderBeforeRefresh: bool(appSource, /const hasCachedTabData = terminalFeedHasData\(state\.activeTab\)/) && bool(appSource, /if \(!hasCachedTabData\) await refreshPromise/),
    getRequestDedupe: bool(appSource, /const apiInFlight = new Map\(\)/),
    windowedFeedRows: bool(appSource, /terminalFeedRowsWindow/) && bool(appSource, /data-terminal-load-more/),
    cssContentVisibility: bool(cssSource, /content-visibility:\s*auto/),
    hiddenHeavyPollingPaused: bool(appSource, /\["terminal", "live", "slimeScope", "kol", "watchlist", "sniper"\]\.includes\(state\.activeTab\)/),
    mobileReducedEffects: bool(cssSource, /@media \(max-width: 760px\), \(prefers-reduced-motion: reduce\)/) || bool(cssSource, /prefers-reduced-motion/)
  }
};

console.log("TERMINAL PROFILE");
console.log(JSON.stringify(report, null, 2));
