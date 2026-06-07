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

test("top refresh can also kick active TP/SL checks after wallet state refresh", () => {
  assert.match(functionBody(appSource, "shouldRunAutoExitCheckAfterWalletRefresh"), /hasActiveTpSlPermission\(\) && hasActiveAutoExitPlans\(\) && !autoExitCheckInFlight/);
  assert.match(appSource, /refreshWalletNow\(\{ force: true, deep: false, reason: "manual_header_click" \}\)[\s\S]*shouldRunAutoExitCheckAfterWalletRefresh\(\)[\s\S]*runTradePlanCheck\(\)/);
});

test("position value estimation falls back to existing Pump and Dex market sources", () => {
  assert.match(serverSource, /async function estimatePositionValueFromMarket/);
  assert.match(functionBody(serverSource, "estimatePositionValue"), /estimatePositionValueFromMarket\(position, new Error\("Jupiter API key missing"\)\)/);
  assert.match(functionBody(serverSource, "estimatePositionValue"), /catch \(error\)[\s\S]*estimatePositionValueFromMarket\(position, error\)/);
  assert.match(functionBody(serverSource, "estimatePositionValueFromMarket"), /getPumpFunTokenMetadata/);
  assert.match(functionBody(serverSource, "estimatePositionValueFromMarket"), /fetchDexScreenerTokenPairsBatch/);
  assert.match(serverSource, /decimals: account\.decimals/);
});
