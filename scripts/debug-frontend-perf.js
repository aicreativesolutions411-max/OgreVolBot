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
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key, count]) => ({ key, count }));
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

const [terminalHtml, terminalProSource, indicatorSource, terminalProCss, perfStore] = await Promise.all([
  readText("web/public/index.html"),
  readText("web/public/terminal-pro.js"),
  readText("web/public/fun-indicators.js"),
  readText("web/public/terminal-pro.css"),
  readJsonIfExists("performance-events.json", { events: [] })
]);
const inlineAppSource = terminalHtml.match(/<script>\s*("use strict";[\s\S]*?\}\)\(\);)\s*<\/script>(?=\s*<script src="\/terminal-pro\.js)/)?.[1] || "";
const inlineShellCss = terminalHtml.match(/<style>\s*(:root\{[\s\S]*?)<\/style>/)?.[1] || "";
if (!inlineAppSource || !inlineShellCss) throw new Error("Could not identify the active Terminal source blocks in web/public/index.html");
const appSource = `${inlineAppSource}\n${terminalProSource}\n${indicatorSource}`;
const cssSource = `${inlineShellCss}\n${terminalProCss}`;

const events = Array.isArray(perfStore.events) ? perfStore.events : [];
const longTasks = events.filter((event) => event.action === "long-task" && Number(event.durationMs || 0) >= 50).slice(-30);
const renderEvents = events.filter((event) => event.action === "render");
const apiDedupeEvents = events.filter((event) => event.action === "api-dedupe");
const walletDedupeEvents = events.filter((event) => event.action === "wallet-refresh-dedupe");

const report = {
  longTasks: {
    count: longTasks.length,
    latest: longTasks.at(-1) || null,
    over100ms: longTasks.filter((event) => Number(event.durationMs || 0) >= 100).length,
    p95Ms: percentileMs(longTasks)
  },
  webApiP95Ms: percentileMs(events.filter((event) => event.component === "api" || /api|refresh|load-all/.test(event.action || ""))),
  excessiveRenders: groupCounts(renderEvents, (event) => event.details || event.component || "render"),
  duplicateIntervals: {
    routeFeedTimerSingleton: bool(appSource, /pollT:null/) && bool(appSource, /clearTimeout\(state\.pollT\)/),
    transactionTimerSingleton: bool(appSource, /txPollT:null/) && bool(appSource, /clearTimeout\(state\.txPollT\)/),
    chartStatsTimerSingleton: bool(appSource, /let statPollT=null/) && bool(appSource, /clearTimeout\(statPollT\)/),
    chatTimerSingleton: bool(appSource, /let chatPollT=null/) && bool(appSource, /clearTimeout\(chatPollT\)/),
    portfolioTimerSingleton: bool(appSource, /let portfolioPollT=null/) && bool(appSource, /clearTimeout\(portfolioPollT\)/)
  },
  hiddenPolling: {
    documentHiddenGuard: bool(appSource, /document\.hidden/),
    activeRouteOnly: bool(appSource, /if\(state\.route===/) && bool(appSource, /state\.pollT=setTimeout/),
    walletBalancePausedWhenHidden: bool(appSource, /state\.token&&!document\.hidden\)refreshWallets/),
    portfolioPausedWhenHidden: bool(appSource, /state\.route==="portfolio"[\s\S]{0,120}!document\.hidden/)
  },
  liveRendering: {
    cachedPositionsPaintFirst: bool(appSource, /Seed positions from the last session/) && bool(appSource, /paint from whatever we already have/),
    activeRouteOnlyRefresh: bool(appSource, /if\(state\.route==="trending"\)renderTrending\(\)/),
    visibilityResumeSingleOwner: bool(appSource, /document\.addEventListener\("visibilitychange"/) && bool(appSource, /clearTimeout\(state\.pollT\)/)
  },
  slowComponents: [...events]
    .sort((a, b) => Number(b.durationMs || 0) - Number(a.durationMs || 0))
    .slice(0, 15)
    .map((event) => ({
      at: event.at,
      route: event.route,
      component: event.component,
      action: event.action,
      durationMs: event.durationMs,
      cacheHit: event.cacheHit,
      stale: event.stale,
      errorCode: event.errorCode
    })),
  dedupe: {
    apiDedupeEvents: apiDedupeEvents.length,
    walletRefreshDedupeEvents: walletDedupeEvents.length,
    requestDedupeImplemented: bool(appSource, /apiInFlight|requestInFlight|dedupeKey/),
    walletDedupeImplemented: bool(appSource, /walletRefreshPromise|wallet-refresh-dedupe/)
  },
  mobilePaintCost: {
    contentVisibility: bool(cssSource, /content-visibility:\s*auto/),
    reducedMobileBlur: bool(cssSource, /backdrop-filter: none !important/),
    reducedMotion: bool(cssSource, /prefers-reduced-motion/),
    lazyImages: bool(appSource, /loading="lazy"/) || bool(appSource, /loading: "lazy"/)
  },
  consoleErrorsWarnings: {
    capturedByCommand: false,
    note: "This command reports stored frontend performance events and static risk checks. Use browser console for live warnings."
  },
  sourceAudited: "web/public/index.html + terminal-pro.js + fun-indicators.js",
  secretsPrinted: false
};

console.log("SLIMEWIRE FRONTEND PERF DEBUG");
console.log(JSON.stringify(report, null, 2));
