import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/fun.css", import.meta.url), "utf8");
const workerSource = fs.readFileSync(new URL("../web/public/fun-sw.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(match, `${name} is missing`);
  const bodyStart = source.indexOf("{", source.indexOf(")", match.index));
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

test("wallet route selects its shell before deferred app startup", () => {
  assert.match(htmlSource, /document\.documentElement\.classList\.add\("wallet-route-prepaint"\)/);
  assert.match(cssSource, /html\.wallet-route-prepaint \.fun-view\[data-view="wallet"\]\{display:block\}/);
  assert.match(cssSource, /wallet-route-prepaint \.fun-view\[data-view="home"\]\{display:none\}/);
  const init = functionBody(funSource, "init");
  assert.ok(init.indexOf("applyInitialRoute(routeParams)") < init.indexOf("await consumeTelegramLoginTicket()"));
  assert.ok(init.indexOf("stageWalletPortfolioCache()") < init.indexOf("await consumeTelegramLoginTicket()"));
  assert.doesNotMatch(init, /applyPortfolioSnapshot\([^)]*cached/);
});

test("shared-session restore paints cached wallet data only after matching a confirmed account", () => {
  const restore = functionBody(funSource, "restoreSharedSession");
  const confirm = functionBody(funSource, "confirmAuthenticatedUser");
  const save = functionBody(funSource, "saveWalletPortfolioCache");
  const safe = functionBody(funSource, "cacheSafePortfolioValue");
  assert.match(functionBody(funSource, "readWalletPortfolioCache"), /24 \* 60 \* 60_000/);
  assert.match(restore, /state\.stagedPortfolioCache\?\.ownerId === restoredUserId/);
  assert.match(restore, /setToken\(COOKIE_SESSION, \{ preserveLocalState: cacheMatches \}\)/);
  assert.match(confirm, /cached\.ownerId !== nextUserId[\s\S]*clearPrivateWalletState/);
  assert.match(confirm, /applyPortfolioSnapshot\(cached\.data, \{ saveCache: false, fromCache: true/);
  assert.match(save, /ownerId = state\.confirmedUserId/);
  assert.match(save, /ownerId !== confirmedAccountId\(\)/);
  assert.match(save, /version: 2, ownerId/);
  assert.match(save, /walletPortfolioCacheSignature\(cacheValue\)/);
  assert.match(save, /signature === state\.walletPortfolioCacheSignature[\s\S]*60000/);
  assert.match(functionBody(funSource, "clearPrivateWalletState"), /state\.walletPortfolioCacheSignature = ""[\s\S]*state\.walletPortfolioCacheSavedAt = 0/);
  assert.match(safe, /secret\|privatekey\|keypair\|seed\|mnemonic\|password/);
  assert.match(functionBody(funSource, "cookieSessionIdentity"), /\/api\/web\/me/);
  const request = functionBody(funSource, "request");
  assert.match(request, /Session identity could not be confirmed/);
  assert.ok(request.indexOf("const identity = await cookieSessionIdentity()") < request.indexOf("result = await execute(true)"));
  assert.match(request, /if \(result\.status === 401/);
  assert.doesNotMatch(request, /\[401, 403\]\.includes\(result\.status\)/);
  assert.ok(request.indexOf("const accountChanged = Boolean(expectedUserId") < request.indexOf("result = await execute(true)"));
  assert.match(request, /accountChanged && String\(options\.method \|\| "GET"\)\.toUpperCase\(\) !== "GET"/);
  assert.match(functionBody(funSource, "adoptCookieSessionUser"), /preserveLocalState: sameConfirmedUser/);
  assert.match(functionBody(funSource, "clearPrivateWalletState"), /state\.accountGeneration \+= 1/);
  assert.match(functionBody(funSource, "accountScopeMatches"), /scope\.userId === state\.confirmedUserId[\s\S]*scope\.token === state\.token[\s\S]*scope\.generation/);
  assert.match(functionBody(funSource, "loadPortfolioSnapshot"), /accountScopeMatches\(accountScope\)[\s\S]*applyPortfolioSnapshot\(result\.data, \{ accountScope \}\)/);
  assert.match(functionBody(funSource, "loadWalletBalancePreview"), /accountScopeMatches\(accountScope\)[\s\S]*applyPortfolioSnapshot\(snapshot, \{ status: "refreshing", accountScope \}\)/);
  assert.match(functionBody(funSource, "loadWalletBalancePreview"), /fast=true\$\{options\.force \? "&force=true" : ""\}/);
  const applySnapshot = functionBody(funSource, "applyPortfolioSnapshot");
  assert.match(applySnapshot, /cashAssets: \{ \.\.\.\(previous\.cashAssets \|\| \{\}\), \.\.\.\(wallet\.cashAssets \|\| \{\}\) \}/);
  assert.match(applySnapshot, /!validSol[\s\S]*previous\.cashAssets\?\.SOL[\s\S]*merged\.cashAssets\.SOL/);
  const balanceSchedule = functionBody(funSource, "scheduleWalletBalanceRefresh");
  assert.match(balanceSchedule, /!document\.hidden/);
  assert.match(balanceSchedule, /loadWalletBalancePreview\(\{ force: true \}\)/);
  assert.match(balanceSchedule, /5_000/);
  assert.match(functionBody(funSource, "loadFunRhPositions"), /accountScopeMatches\(accountScope\)/);
  assert.match(functionBody(funSource, "loadWalletView"), /state\.sessionRestoring[\s\S]*saved balances appear immediately/i);
  assert.match(functionBody(funSource, "renderWalletHero"), /portfolioStatus[\s\S]*Saved ·/);
  assert.match(functionBody(funSource, "registerFunServiceWorkerLater"), /requestIdleCallback/);
});

test("mobile market requests bounded payloads and never invent missing metrics", () => {
  assert.match(functionBody(funSource, "fetchSolFeed"), /query\.set\("view", "mobile"\)/);
  assert.match(functionBody(funSource, "fetchSolFeed"), /query\.set\("limit", String\(MOBILE_FEED_LIMIT\)\)/);
  assert.match(functionBody(funSource, "fetchRhFeed"), /view: "mobile", limit: String\(MOBILE_FEED_LIMIT\)/);
  assert.match(functionBody(funSource, "fetchRhFeed"), /result\.data\?\.stale/);
  assert.match(functionBody(funSource, "fetchRhFeed"), /result\.data\?\.marketUpdatedAt/);
  assert.doesNotMatch(functionBody(funSource, "normalizeSol"), /"checking"/);
  assert.doesNotMatch(functionBody(funSource, "normalizeRh"), /"checking"/);
  assert.match(functionBody(funSource, "coinRowHtml"), /change == null \? "—"/);
  assert.match(functionBody(funSource, "feedNote"), /Live[\s\S]*Stale/);
});

test("mobile feed contracts stay compact and carry explicit freshness", () => {
  const limit = functionBody(serverSource, "mobileMarketFeedLimit");
  const sol = functionBody(serverSource, "compactLivePairForMobile");
  const rh = functionBody(serverSource, "compactRhPairForMobile");
  const payload = functionBody(serverSource, "compactLivePairsPayloadForMobile");
  assert.match(sol, /marketState: stale \? "stale" : "live"/);
  assert.match(sol, /marketUpdatedAt/);
  assert.doesNotMatch(sol, /marketCap:[^\n]+\|\| 0/);
  assert.doesNotMatch(sol, /volumeH24:[^\n]+\|\| 0/);
  assert.match(rh, /marketState: stale \? "stale" : "live"/);
  assert.match(rh, /marketUpdatedAt/);
  assert.doesNotMatch(rh, /marketCapUsd:[^\n]+\|\| 0/);
  assert.match(payload, /\.slice\(0, limit\)/);
  assert.match(serverSource, /requestUrl\.searchParams\.get\("view"\) === "mobile"/);
  assert.match(serverSource, /mobileMarketFeedLimit\(requestUrl\)/);
  assert.match(functionBody(serverSource, "cachedWebRhPairs"), /options\.withMeta/);
  assert.match(limit, /raw == null \|\| raw === "" \? Number\.NaN/);
  assert.match(limit, /: fallback/);
});

test("hidden wallet art and optional tools stay off the first-load critical path", () => {
  assert.match(htmlSource, /data-wallet-route-src="\/assets\/slimewire\/slimewallet-profile-guardian\.png"/);
  assert.match(htmlSource, /data-wallet-lock-src="\/assets\/slimewire\/slimewallet-pfp\.png"/);
  assert.doesNotMatch(htmlSource, /<script[^>]+slimewire-funding/);
  assert.match(functionBody(funSource, "ensureFunFundingAssets"), /loadFunScript\("\/slimewire-funding\.js\?v=8"\)/);
  assert.doesNotMatch(workerSource, /lightweight-charts|fun-indicators/);
  assert.match(workerSource, /if \(isStatic\)[\s\S]*caches\.match\(cacheKey\)[\s\S]*event\.waitUntil/);
});

test("mobile trades end on an honest, recoverable execution receipt", () => {
  const receiptData = functionBody(funSource, "tradeReceiptData");
  const receiptHtml = functionBody(funSource, "tradeReceiptHtml");
  assert.match(receiptData, /trade\.confirmed === true/);
  assert.match(receiptData, /\["confirmed", "landed", "complete", "completed"\]/);
  assert.doesNotMatch(receiptData, /response\.ok/);
  assert.match(receiptData, /trade\.solCashout\?\.outSol/);
  assert.match(receiptData, /trade\.solCashoutError/);
  assert.match(receiptData, /trade\.netSol/);
  assert.match(receiptData, /trade\.autoExitArmed === true/);
  assert.match(receiptData, /trade\.autoExitError/);
  assert.match(receiptData, /options\.guardResult/);
  assert.match(receiptData, /Activity indexing is delayed/);
  assert.match(receiptHtml, /TRADE SUBMITTED/);
  assert.match(receiptHtml, /data-copy-receipt-signature/);
  assert.match(receiptHtml, /data-view-trade-activity/);
  assert.match(receiptHtml, /data-rh-wallet-tools/);
  assert.match(receiptHtml, /Open in explorer/);
  assert.match(functionBody(funSource, "submitTrade"), /guardResult = await post\("\/api\/web\/rh\/guards"/);
  assert.match(funSource, /state\.profileTab = "activity"; closeSheet\(\); setView\("wallet"\); await loadWalletView\(\)/);
});

test("wallet-position and bundle actions keep per-wallet execution receipts", () => {
  const positionSell = functionBody(funSource, "sellFunWalletPosition");
  const bundleSubmit = functionBody(funSource, "submitFunBundle");
  const bundleData = functionBody(funSource, "bundleTradeReceiptData");
  const bundleHtml = functionBody(funSource, "bundleTradeReceiptHtml");
  assert.match(positionSell, /result\.data\.bundle\.results\?\.find/);
  assert.match(positionSell, /tradeReceiptData\(/);
  assert.match(positionSell, /openSheet\(tradeReceiptHtml\(receipt\)\)/);
  assert.match(bundleSubmit, /bundleTradeReceiptData\(result\.data/);
  assert.match(bundleSubmit, /openSheet\(bundleTradeReceiptHtml\(receipt\)\)/);
  assert.match(bundleData, /row\.tx \|\| row\.signature/);
  assert.match(bundleData, /exitStatus/);
  assert.match(bundleData, /recordError/);
  assert.match(bundleHtml, /BUNDLE SUBMITTED/);
  assert.match(bundleHtml, /BUNDLE NOT SUBMITTED/);
  assert.match(bundleHtml, /data-copy-receipt-signature/);
  assert.match(bundleHtml, /never repeat the entire bundle/i);
});
