import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugSource = fs.readFileSync(new URL("../scripts/debug-terminal-feeds.js", import.meta.url), "utf8");
const singleDebugSource = fs.readFileSync(new URL("../scripts/debug-terminal-feed.js", import.meta.url), "utf8");

function parseNumberLiteral(value = "0") {
  return Number(String(value).replaceAll("_", ""));
}

function terminalFeeds() {
  const start = appSource.indexOf("const TERMINAL_FEEDS = [");
  assert.notEqual(start, -1, "TERMINAL_FEEDS registry is missing");
  const end = appSource.indexOf("];", start);
  assert.notEqual(end, -1, "TERMINAL_FEEDS registry is not closed");
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

function byTab(tabKey) {
  return terminalFeeds().find((feed) => feed.tabKey === tabKey);
}

function functionBody(name) {
  return functionBodyFromSource(appSource, name);
}

function functionBodyFromSource(source, name) {
  const syncStart = source.indexOf(`function ${name}`);
  const asyncStart = source.indexOf(`async function ${name}`);
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} is missing`);
  const paramsStart = source.indexOf("(", start);
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
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("terminal feed registry gives every section a category, endpoint, interval, and unique cache key", () => {
  const feeds = terminalFeeds();
  assert.ok(feeds.length >= 18);
  assert.equal(new Set(feeds.map((feed) => feed.tabKey)).size, feeds.length);
  assert.equal(new Set(feeds.map((feed) => feed.cacheKey)).size, feeds.length);
  for (const feed of feeds) {
    assert.ok(feed.label);
    assert.ok(feed.component);
    assert.ok(feed.endpoint);
    assert.ok(feed.category.includes(":"));
    assert.ok(feed.refreshMs >= 5_000);
    assert.ok(feed.staleMs >= feed.refreshMs);
    assert.ok(feed.pageSize > 0, `${feed.tabKey} needs pageSize`);
    assert.ok(feed.maxPageSize >= feed.pageSize, `${feed.tabKey} maxPageSize must cover pageSize`);
  }
});

test("core terminal tabs map to the requested feed categories", () => {
  assert.equal(byTab("terminal").category, "overview:terminal");
  assert.equal(byTab("live").category, "pairs:new");
  assert.equal(byTab("liveTrades").category, "trades:recent");
  assert.equal(byTab("slimeScope").category, "scanner:slime-scope");
  assert.equal(byTab("kol").category, "signals:kol");
  assert.equal(byTab("watchlist").category, "user:watchlist");
  assert.equal(byTab("bundle").category, "bundle:volume");
  assert.equal(byTab("volume").category, "signals:bundle-volume");
  assert.equal(byTab("sniper").category, "scanner:launch-snipe");
  assert.equal(byTab("launchCoin").category, "pump-launch:status");
  assert.equal(byTab("wallets").category, "portfolio:wallets-balances");
  assert.equal(byTab("positions").category, "portfolio:positions");
  assert.equal(byTab("pnl").category, "portfolio:pnl");
  assert.equal(byTab("ogreAi").category, "tool:ogre-ai");
  assert.equal(byTab("ogreTek").category, "perps:ogre-tek");
});

test("terminal load, tab switch, focus return, and manual refresh all use the shared feed refresh path", () => {
  assert.match(functionBody("initializeApp"), /refreshVisibleTerminalFeeds\(\{[\s\S]*reason: "site-load"/);
  assert.match(appSource, /target\.matches\("\[data-tab\]"\)[\s\S]*refreshTerminalFeed\(state\.activeTab,[\s\S]*reason: "tab-switch"/);
  assert.match(functionBody("resumeLiveFeeds"), /refreshTerminalFeed\(state\.activeTab,[\s\S]*reason: "visibility-focus-return"/);
  assert.match(appSource, /target\.matches\("\[data-refresh-feeds\]"\)[\s\S]*refreshVisibleTerminalFeeds\(\{ force: true, reason: "manual-refresh-feeds"/);
  assert.match(appSource, /target\.matches\("\[data-refresh-all\]"\)[\s\S]*refreshTerminalFeed\(state\.activeTab,[\s\S]*reason: "manual-refresh-all"/);
});

test("active tab poller avoids hidden-page and duplicate heavy-tab polling", () => {
  const body = functionBody("scheduleActiveTerminalFeedRefresh");
  assert.match(body, /document\.hidden/);
  assert.match(body, /\["terminal", "live", "slimeScope", "kol", "watchlist", "sniper"\]\.includes\(state\.activeTab\)/);
  assert.match(body, /Math\.max\(5_000, Number\(feed\.refreshMs \|\| 30_000\)\)/);
  assert.match(body, /clearTimeout\(terminalFeedTimer\)/);
  assert.match(functionBody("scheduleLivePairsAutoRefresh"), /loadLivePairs\(\{ silent: true, bucket: state\.livePairBucket, force: true \}\)/);
  assert.doesNotMatch(functionBody("scheduleLivePairsAutoRefresh"), /refreshLivePairBuckets\(\{ silent: true, force: true \}\)/);
});

test("full terminal feed tabs use page-sized windows instead of tiny preview caps", () => {
  assert.ok(byTab("live").pageSize >= 50);
  assert.ok(byTab("live").supportsPagination);
  assert.ok(byTab("slimeScope").pageSize >= 50);
  assert.ok(byTab("slimeScope").supportsPagination);
  assert.ok(byTab("sniper").pageSize >= 36);
  assert.ok(byTab("sniper").supportsPagination);
  assert.ok(byTab("kol").pageSize >= 36);
  assert.ok(byTab("kol").supportsPagination);
  assert.ok(byTab("terminal").previewLimit <= 8);
  assert.match(appSource, /data-terminal-load-more/);
  assert.match(functionBody("livePairsHtml"), /terminalFeedRowsWindow\("live", allRows\)/);
  assert.match(functionBody("slimeScopeHtml"), /terminalFeedRowsWindow\("slimeScope", allRows\)/);
  assert.match(functionBody("sniperRowsHtml"), /terminalFeedRowsWindow\("sniper", allRows\)/);
  assert.match(functionBody("kolRowsHtml"), /terminalFeedRowsWindow\("kol", allRows\)/);
  assert.doesNotMatch(functionBody("slimeScopeHtml"), /limit:\s*30/);
});

test("backend feed endpoints return useful page-sized lists with bounded provider work", () => {
  assert.match(serverSource, /if \(safeBucket === "live"\) return 50/);
  assert.match(serverSource, /if \(safeBucket === "under1h"\) return 60/);
  assert.match(serverSource, /return 75/);
  assert.match(functionBodyFromSource(serverSource, "webSniperScan"), /limit:\s*36/);
  assert.match(functionBodyFromSource(serverSource, "buildWebLivePairs"), /backendReturnedCount:\s*safeRows\.length/);
  assert.match(functionBodyFromSource(serverSource, "filterWebLivePairsForSafety"), /Math\.min\(rows\.length, Math\.max\(limit \* 2, 32\), 120\)/);
});

test("backend stores sanitized terminal feed diagnostics without secrets", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/terminal-feed-event"/);
  assert.match(serverSource, /terminal-feed-events\.json/);
  assert.match(serverSource, /function safeTerminalFeedText/);
  assert.match(serverSource, /async function recordTerminalFeedEvent/);
  const recordBody = serverSource.slice(serverSource.indexOf("async function recordTerminalFeedEvent"), serverSource.indexOf("async function sendWebLoginCode"));
  assert.doesNotMatch(recordBody, /password|privateKey|seed|secret|Authorization/i);
});

test("debug command reports registry, polling, stale data, and feed event state", () => {
  assert.match(packageSource, /"debug:terminal-feeds": "node scripts\/debug-terminal-feeds\.js"/);
  assert.match(packageSource, /"debug:terminal-feed": "node scripts\/debug-terminal-feed\.js"/);
  assert.match(packageSource, /node --check scripts\/debug-terminal-feeds\.js/);
  assert.match(packageSource, /node --check scripts\/debug-terminal-feed\.js/);
  assert.match(debugSource, /parseTerminalFeeds/);
  assert.match(debugSource, /duplicateCacheKeys/);
  assert.match(debugSource, /recentTerminalFeedEvents/);
  assert.match(debugSource, /pollingSignals/);
  assert.match(debugSource, /staticDataSignals/);
  assert.match(debugSource, /pageSize/);
  assert.match(debugSource, /lastRenderedCount/);
  assert.match(singleDebugSource, /TERMINAL FEED DEBUG/);
  assert.match(singleDebugSource, /frontendRenderedCount/);
  assert.match(singleDebugSource, /hasMore/);
});

test("critical icons preload and all runtime images have a global fallback path", () => {
  assert.match(htmlSource, /rel="preload" as="image" href="\.\/assets\/slimewire\/clean-ui\/wallet_icons\/default\/phantom\.png"/);
  assert.match(htmlSource, /rel="preload" as="image" href="\.\/assets\/slimewire\/clean-ui\/wallet_icons\/default\/solflare\.png"/);
  assert.match(htmlSource, /data-fallback-src="\.\/assets\/slimewire\/svg\/icons\/wallet\.svg"/);
  assert.match(appSource, /const SLIMEWIRE_CRITICAL_IMAGE_ASSETS = \[/);
  assert.match(functionBody("installSlimewireImageFallbacks"), /document\.addEventListener\("error", handleSlimewireImageError, true\)/);
  assert.match(functionBody("handleSlimewireImageError"), /fallbackImageForSource\(image\)/);
  assert.match(functionBody("prewarmSlimewireImageAssets"), /new Image\(\)/);
  assert.match(functionBody("initializeApp"), /installSlimewireImageFallbacks\(\)/);
  assert.match(functionBody("initializeApp"), /prewarmSlimewireImageAssets\(\)/);
});
