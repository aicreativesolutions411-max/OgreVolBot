import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugSource = fs.readFileSync(new URL("../scripts/debug-terminal-feeds.js", import.meta.url), "utf8");

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

function byTab(tabKey) {
  return terminalFeeds().find((feed) => feed.tabKey === tabKey);
}

function functionBody(name) {
  const syncStart = appSource.indexOf(`function ${name}`);
  const asyncStart = appSource.indexOf(`async function ${name}`);
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} is missing`);
  const paramsStart = appSource.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "(") paramsDepth += 1;
    if (char === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = appSource.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(bodyStart + 1, index);
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
  assert.match(packageSource, /node --check scripts\/debug-terminal-feeds\.js/);
  assert.match(debugSource, /parseTerminalFeeds/);
  assert.match(debugSource, /duplicateCacheKeys/);
  assert.match(debugSource, /recentTerminalFeedEvents/);
  assert.match(debugSource, /pollingSignals/);
  assert.match(debugSource, /staticDataSignals/);
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
