import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/styles.css", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const debugManualSellSource = fs.readFileSync(new URL("../scripts/debug-manual-sell.js", import.meta.url), "utf8");
const debugPositionRefreshSource = fs.readFileSync(new URL("../scripts/debug-position-refresh.js", import.meta.url), "utf8");
const debugUiActionLagSource = fs.readFileSync(new URL("../scripts/debug-ui-action-lag.js", import.meta.url), "utf8");
const debugQueuePrioritySource = fs.readFileSync(new URL("../scripts/debug-queue-priority.js", import.meta.url), "utf8");

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
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("manual position sell gives immediate UI feedback and submits one idempotent attempt", () => {
  const body = functionBody(appSource, "sellPositionPercent");
  assert.match(body, /createClientAttemptId\("manual-sell"\)/);
  assert.match(body, /setManualSellAction\(tokenMint, String\(percent\), \{[\s\S]*state: "clicked"/);
  assert.match(body, /manual-sell-click-to-ui/);
  assert.match(body, /activeManualSellAction\(tokenMint, String\(percent\)\)/);
  assert.match(body, /manual-sell-dedupe/);
  assert.match(body, /manualSellAttemptId/);
  assert.match(body, /dedupe: false/);
});

test("manual sell does not wait for full position wallet refresh before updating UI", () => {
  const body = functionBody(appSource, "sellPositionPercent");
  assert.match(body, /queuePostTradeRefresh/);
  assert.doesNotMatch(body, /await refreshAfterTrade/);
  assert.doesNotMatch(body, /refreshVisibleTerminalFeeds/);
  assert.match(functionBody(appSource, "queuePostTradeRefresh"), /refreshWalletState\(\{ force: true, deep: false, reason: "post-trade" \}\)/);
});

test("connected wallet positions sell through browser wallet approval", () => {
  const body = functionBody(appSource, "sellPositionPercent");
  assert.match(body, /portfolioPositions\(\)\.find/);
  assert.match(body, /position\?\.source === "connected-wallet"/);
  assert.match(body, /executeConnectedBrowserTrade\(\{[\s\S]*side: "sell"/);
  assert.match(body, /walletIndex: "connected"/);
  assert.match(body, /browser-manual-sell/);
});

test("backend manual sell uses critical attempt idempotency without changing sell math", () => {
  assert.match(serverSource, /function normalizeManualSellAttemptId/);
  assert.match(serverSource, /async function runManualSellCriticalAttempt/);
  assert.match(serverSource, /manual-sell:/);
  assert.match(serverSource, /LockService\.withLock/);
  assert.match(serverSource, /cacheSetJson\(resultKey, \{ result \}, 120_000\)/);
  assert.match(functionBody(serverSource, "webBundleSellCore"), /sellTokenFromWallet\(wallet, tokenMint, percent, slippageBps, \{ userId \}\)/);
  assert.match(functionBody(serverSource, "webTradeSellCore"), /sellTokenFromWallet\(wallet, tokenMint, percent, slippageBps, \{ userId \}\)/);
});

test("refresh position button turns light green immediately and keeps cached data visible", () => {
  assert.match(appSource, /setPositionRefreshAction\("clicked"/);
  assert.match(appSource, /position-refresh-click-to-state/);
  assert.match(appSource, /now \+ \(nextState === "clicked" \|\| nextState === "success" \? 700 : 0\)/);
  assert.match(cssSource, /button\[data-action-state="clicked"\]/);
  assert.match(cssSource, /rgba\(203, 255, 161/);
  assert.doesNotMatch(functionBody(appSource, "refreshWalletState"), /state\.positions\s*=\s*\[\]/);
  assert.match(functionBody(appSource, "refreshWalletState"), /walletRefreshPromise/);
});

test("debug commands cover manual sell, position refresh, UI action lag, and priority", () => {
  assert.match(packageSource, /"debug:manual-sell": "node scripts\/debug-manual-sell\.js"/);
  assert.match(packageSource, /"debug:position-refresh": "node scripts\/debug-position-refresh\.js"/);
  assert.match(packageSource, /"debug:ui-action-lag": "node scripts\/debug-ui-action-lag\.js"/);
  assert.match(packageSource, /"debug:queue-priority": "node scripts\/debug-queue-priority\.js"/);
  assert.match(packageSource, /node --check scripts\/debug-manual-sell\.js/);
  assert.match(debugManualSellSource, /MANUAL SELL DEBUG/);
  assert.match(debugPositionRefreshSource, /POSITION REFRESH DEBUG/);
  assert.match(debugUiActionLagSource, /UI ACTION LAG DEBUG/);
  assert.match(debugQueuePrioritySource, /QUEUE PRIORITY DEBUG/);
  assert.doesNotMatch(`${debugManualSellSource}\n${debugPositionRefreshSource}\n${debugUiActionLagSource}\n${debugQueuePrioritySource}`, /privateKey|seed|Authorization|session token/i);
});
