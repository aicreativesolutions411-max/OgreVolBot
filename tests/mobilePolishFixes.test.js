import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(source);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
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

test("mobile sponsor and KOL ticker uses explicit open state so links are clickable", () => {
  assert.match(appSource, /function syncMarketTickerMenuState/);
  assert.match(appSource, /function toggleMarketTickerItem/);
  assert.match(functionBody(appSource, "initializeMarketTickerInteractions"), /event\.preventDefault\(\);[\s\S]*toggleMarketTickerItem/);
  assert.match(cssSource, /MOBILE_TERMINAL_DENSITY_FINAL_20260607_V2/);
  assert.match(cssSource, /is-ticker-menu-open[\s\S]*overflow: visible !important/);
  assert.match(cssSource, /swamp-ticker-item\[open\] \.swamp-ticker-links[\s\S]*position: fixed|swamp-ticker-item\[open\] \.swamp-ticker-links[\s\S]*z-index: 2147483003/);
});

test("mobile terminal account controls and pair actions stay compact", () => {
  assert.match(htmlSource, /<span>Profile<\/span>/);
  assert.doesNotMatch(htmlSource, /SW Profile/);
  assert.match(cssSource, /top-profile-avatar[\s\S]*display: none !important/);
  assert.match(cssSource, /top-auth-group button[\s\S]*min-height: 31px !important/);
  assert.match(cssSource, /top-sync-strip button[\s\S]*min-height: 31px !important/);
  assert.match(cssSource, /terminal-token-actions,[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/);
  assert.match(cssSource, /terminal-token-actions button,[\s\S]*min-height: 28px !important/);
});

test("final mobile density pass keeps ticker menus and trading controls small", () => {
  assert.match(cssSource, /MOBILE_TRADER_DENSITY_AND_SCROLL_POLISH_20260607_V3/);
  assert.match(cssSource, /swamp-ticker-item\[open\] \.swamp-ticker-links[\s\S]*position: fixed !important[\s\S]*width: min\(218px, calc\(100vw - 22px\)\) !important/);
  assert.match(cssSource, /top-sync-strip \[data-top-refresh-wallet\][\s\S]*display: none !important/);
  assert.match(cssSource, /\[data-dashboard\] > \.metrics[\s\S]*grid-template-columns: repeat\(4, minmax\(0, 1fr\)\) !important/);
  assert.match(cssSource, /command-controls > button\[data-refresh-live-pairs\][\s\S]*height: 28px !important/);
  assert.match(cssSource, /terminal-token-actions button,[\s\S]*height: 24px !important/);
  assert.match(cssSource, /tabs \.nav-tool-group\[open\] button[\s\S]*display: flex !important/);
});

test("mobile-only compression keeps wallet and controls out of the way", () => {
  assert.match(cssSource, /MOBILE_ONLY_TERMINAL_COMPRESSION_20260607_V4/);
  assert.match(functionBody(appSource, "toggleMarketTickerItem"), /--ticker-menu-left[\s\S]*--ticker-menu-top/);
  assert.match(cssSource, /swamp-ticker-item\[open\] \.swamp-ticker-links[\s\S]*left: var\(--ticker-menu-left/);
  assert.match(cssSource, /top-sync-strip \[data-top-refresh-wallet\][\s\S]*display: inline-flex !important/);
  assert.match(cssSource, /top-sync-strip \[data-sync-health\][\s\S]*display: none !important/);
  assert.match(cssSource, /\[data-dashboard\] > \.metrics[\s\S]*display: none !important/);
  assert.match(cssSource, /terminal-title-row > span[\s\S]*display: none !important/);
  assert.match(cssSource, /command-controls \.terminal-quick-buy-bar[\s\S]*display: contents !important/);
  assert.match(cssSource, /terminal-launch-filter:not\(\.is-open\) \.terminal-launch-filter-head span[\s\S]*display: none !important/);
  assert.match(cssSource, /tabs \.nav-tool-group\[open\] button[\s\S]*height: 36px !important/);
});

test("mobile right rail is fixed and Ogre Tools stays user-controlled", () => {
  assert.match(cssSource, /MOBILE_STABLE_RIGHT_RAIL_AND_STATUS_STRIP_20260608_V1/);
  assert.match(cssSource, /\[data-dashboard\] > \.tabs[\s\S]*position: fixed !important/);
  assert.match(cssSource, /\[data-dashboard\] > \.tabs[\s\S]*overflow-x: hidden !important[\s\S]*overflow-y: auto !important/);
  assert.match(cssSource, /tabs \.nav-tool-group,[\s\S]*tabs \.nav-tool-group\[open\][\s\S]*overflow: hidden !important/);
  assert.match(functionBody(appSource, "renderTabs"), /hasStoredNavTekPreference\(\)[\s\S]*hasActiveChild/);
  assert.match(cssSource, /top-sync-strip \.top-wallet-disconnected,[\s\S]*data-active-preset-label[\s\S]*display: none !important/);
});

test("mobile bottom bar + chips expose every tool without a wall of tabs", () => {
  // Mobile now uses a fixed 5-section bottom bar + a chip row instead of the long tab
  // strip, so nothing is missed (Pump Launch / Sniper / Ogre A.I. are now surfaced).
  assert.match(htmlSource, /<nav class="section-bar" data-section-bar/);
  assert.match(htmlSource, /<div class="subnav-chips" data-subnav-chips/);
  // Section bar + chips render from the NAV_SECTIONS source of truth.
  assert.match(appSource, /const NAV_SECTIONS = \[/);
  assert.match(appSource, /function syncMobileNav\(\)/);
  assert.match(functionBody(appSource, "syncMobileNav"), /data-section-bar[\s\S]*data-subnav-chips/);
  assert.match(appSource, /target\.matches\("\[data-nav-section\]"\)/);
  // The previously-buried high-value tabs are now first-class nav entries.
  for (const tab of ["launchCoin", "sniper", "ogreAi"]) {
    assert.match(appSource, new RegExp(`tab: "${tab}"`));
  }
  // CSS: the desktop tab strip is hidden on mobile and the top section bar takes over.
  assert.match(cssSource, /\[data-app\]\[data-route="terminal"\] \.tabs \{ display: none; \}/);
  assert.match(cssSource, /\.section-bar \{\s*display: flex;/);
  // Every desktop nav label still exists (full tool list), just regrouped into 5 sections.
  const labels = [...htmlSource.matchAll(/<button[^>]*data-label="([^"]+)"[^>]*>/g)]
    .filter((match) => !/\shidden(?:\s|>|=)/.test(match[0]))
    .map((match) => match[1]);
  assert.deepEqual(labels, ["Live", "Cooks", "Scope", "Trades", "KOL", "Watch", "Swap", "Chart", "Sniper", "Launch", "Watches", "Bundle", "Tek", "A.I.", "Wallets", "Pos", "PnL", "Home"]);
});

test("mobile REC and wallet connect controls stay tappable in one sync row", () => {
  assert.match(htmlSource, /data-top-wallet-connect/);
  assert.match(functionBody(appSource, "updateClipFarmControl"), /data-clip-record data-supported=/);
  assert.doesNotMatch(functionBody(appSource, "updateClipFarmControl"), /data-clip-record \$\{supported \? "" : "disabled"\}/);
  assert.match(functionBody(appSource, "clipFarmMobileFallbackSupported"), /canvas\.toBlob/);
  assert.match(functionBody(appSource, "startClipFarmRecording"), /startClipFarmMobileFallbackRecording\(\)/);
  assert.match(functionBody(appSource, "startClipFarmMobileFallbackRecording"), /Recording mobile clip/);
  assert.match(functionBody(appSource, "drawClipFarmFallbackFrame"), /Fresh Live Picks/);
  assert.match(functionBody(appSource, "clipFarmExtensionForMime"), /image\\\/png/);
  assert.match(functionBody(appSource, "showClipFarmUnsupportedMessage"), /blocked both screen recording and SlimeWire clip fallback/);
  assert.match(functionBody(appSource, "showClipFarmUnsupportedMessage"), /window\.alert\(message\)/);
  assert.match(functionBody(appSource, "updateTopWalletConnectStatus"), /data-top-wallet-connect/);
  assert.match(appSource, /target\.matches\("\[data-top-wallet-connect\]"\)[\s\S]*openWalletConnectChooser\(\{ returnPath: "\/terminal" \}\)/);
  assert.match(cssSource, /MOBILE_REC_AND_WALLET_CONNECT_ROW_20260608_V1/);
  assert.match(cssSource, /top-sync-strip[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\) !important/);
  assert.match(cssSource, /clip-record-button\[data-supported="false"\][\s\S]*cursor: pointer !important/);
});

test("mobile feed refresh preserves scroll and avoids the start flicker render", () => {
  assert.match(functionBody(appSource, "captureStableFeedScrollSnapshot"), /documentY:[\s\S]*panelScrollTop:[\s\S]*dashboardScrollTop:/);
  assert.match(functionBody(appSource, "restoreStableFeedScrollSnapshot"), /restoreRawScrollPositions[\s\S]*document\.scrollingElement/);
  assert.match(appSource, /refreshTerminalFeed\(feedKey, \{[\s\S]*renderStart: false,[\s\S]*userInitiated: true/);
});

test("top refresh can also kick active TP/SL checks after wallet state refresh", () => {
  assert.match(functionBody(appSource, "shouldRunAutoExitCheckAfterWalletRefresh"), /hasActiveTpSlPermission\(\) && hasActiveAutoExitPlans\(\) && !autoExitCheckInFlight/);
  assert.match(appSource, /refreshWalletNow\(\{ force: true, deep: false, reason: "manual_header_click" \}\)[\s\S]*shouldRunAutoExitCheckAfterWalletRefresh\(\)[\s\S]*runTradePlanCheck\(/);
});

test("auto exit follow-up checks are quiet on mobile unless an exit fires", () => {
  const runCheck = functionBody(appSource, "runTradePlanCheck");
  const scheduler = functionBody(appSource, "scheduleAutoExitChecks");
  assert.match(appSource, /let autoExitWatchTimers = \[\]/);
  assert.match(runCheck, /const silent = Boolean\(options\.silent\)/);
  assert.match(runCheck, /if \(!silent\) \{[\s\S]*state\.walletRefreshing = true/);
  assert.match(runCheck, /if \(!silent\) \{[\s\S]*state\.walletRefreshing = false/);
  assert.match(runCheck, /silent && \(exitSold > 0 \|\| exitTriggered > 0\)/);
  assert.match(scheduler, /clearAutoExitWatchTimers\(\)/);
  assert.match(scheduler, /runTradePlanCheck\(\{[\s\S]*silent: true,[\s\S]*refreshWallet: false/);
  assert.match(cssSource, /MOBILE_REFRESH_NO_FLICKER_20260608_V1/);
});

test("position value estimation falls back to existing Pump and Dex market sources", () => {
  assert.match(serverSource, /async function estimatePositionValueFromMarket/);
  assert.match(functionBody(serverSource, "estimatePositionValue"), /estimatePositionValueFromMarket\(position, new Error\("Jupiter API key missing"\)\)/);
  assert.match(functionBody(serverSource, "estimatePositionValue"), /catch \(error\)[\s\S]*estimatePositionValueFromMarket\(position, error\)/);
  assert.match(functionBody(serverSource, "estimatePositionValueFromMarket"), /getPumpFunTokenMetadata/);
  assert.match(functionBody(serverSource, "estimatePositionValueFromMarket"), /fetchDexScreenerTokenPairsBatch/);
  assert.match(serverSource, /decimals: account\.decimals/);
});
