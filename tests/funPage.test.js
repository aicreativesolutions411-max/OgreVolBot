import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../web/public/fun.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const indicators = fs.readFileSync(new URL("../web/public/fun-indicators.js", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../web/public/fun-manifest.webmanifest", import.meta.url), "utf8"));
const walletManifest = JSON.parse(fs.readFileSync(new URL("../web/public/wallet-manifest.webmanifest", import.meta.url), "utf8"));
const funWorker = fs.readFileSync(new URL("../web/public/fun-sw.js", import.meta.url), "utf8");
const rhChain = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
const terminalApp = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const desktopHtml = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const desktopAliasHtml = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const chartLab = fs.readFileSync(new URL("../web/public/chart-lab.html", import.meta.url), "utf8");
const publicHeaders = fs.readFileSync(new URL("../web/public/_headers", import.meta.url), "utf8");
const left4solHtml = fs.readFileSync(new URL("../web/public/left4sol.html", import.meta.url), "utf8");

function walletMarketHelpers() {
  const start = js.indexOf("function marketNumber(...values)");
  const end = js.indexOf("function freshnessAgeLabel", start);
  assert.ok(start >= 0 && end > start, "wallet market helpers should remain extractable");
  return Function(`"use strict";${js.slice(start, end)};return { mergeLiveMarketSnapshot };`)();
}

function walletDexBatchWith(fetchImpl) {
  const start = js.indexOf("async function funDexBatch");
  const end = js.indexOf("async function enrichSearchMatches", start);
  assert.ok(start >= 0 && end > start, "wallet Dex loader should remain extractable");
  const positive = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) ?? null;
  return Function("fetch", "isRh", "positiveMarketNumber", `"use strict";${js.slice(start, end)};return funDexBatch;`)(fetchImpl, (address) => /^0x/i.test(String(address || "")), positive);
}

function chartParentMarketBridgeWith(postMessage, token = "0x1111111111111111111111111111111111111111") {
  const start = chartLab.indexOf("function marketStamp(s)");
  const end = chartLab.indexOf("function applyStats", start);
  assert.ok(start >= 0 && end > start, "chart market bridge should remain extractable");
  const parent = { postMessage };
  const window = { parent };
  const location = { origin: "https://slimewire.test" };
  return Function("window", "location", "CA", `"use strict";${chartLab.slice(start, end)};return { postParentMarket };`)(window, location, token);
}

test("/fun is a standalone no-store mobile surface with Cloudflare pretty-URL support", () => {
  assert.match(server, /requestUrl\.pathname === "\/fun"[\s\S]{0,300}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  assert.doesNotMatch(redirects, /^\/fun(?:\/\*)?\s+\/fun\.html/m);
  assert.match(html, /<script src="\/config\.js"><\/script>/);
  const scriptVersion = html.match(/<script defer src="\/fun\.js\?v=(\d+)"><\/script>/)?.[1];
  assert.equal(scriptVersion, "90", "SlimeWire Go should publish the current app build");
  assert.match(funWorker, new RegExp(`\\/fun\\.js\\?v=${scriptVersion}`));
});

test("/left4sol hands desktop and mobile directly to the raw full-viewport game without an itch referrer", () => {
  const player = "https://html-classic.itch.zone/html/18456748-1846134/index.html?v=1785516296";
  const routeStart = server.indexOf('requestUrl.pathname === "/left4sol"');
  assert.ok(routeStart >= 0, "the Node origin should recognize the branded game route");
  const route = server.slice(routeStart - 120, routeStart + 520);
  assert.match(route, /request\.method === "GET" \|\| request\.method === "HEAD"/);
  assert.match(route, /requestUrl\.pathname\.startsWith\("\/left4sol\/"\)/);
  assert.match(route, /serveStaticHtmlPage\(response, "left4sol\.html", "no-store, max-age=0", \{/);
  assert.match(route, /"Cache-Control": "no-store, max-age=0"/);
  assert.match(route, /"Referrer-Policy": "no-referrer"/);
  assert.match(redirects, /^\/left4sol\s+\/left4sol\.html\s+200$/m);
  assert.match(redirects, /^\/left4sol\/\s+\/left4sol\.html\s+200$/m);
  assert.match(redirects, /^\/left4sol\/\*\s+\/left4sol\.html\s+200$/m);
  assert.match(left4solHtml, new RegExp(player.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(left4solHtml, /<meta name="referrer" content="no-referrer">/);
  assert.match(left4solHtml, /location\.replace\(gameUrl\)/);
  assert.doesNotMatch(left4solHtml, /<iframe/i);
  assert.match(left4solHtml, /rel="noreferrer"/);
  assert.match(publicHeaders, /\/left4sol[\s\S]{0,160}Referrer-Policy: no-referrer/);
});

test("/wallet is a dedicated lazy SlimeWallet surface with in-app SOL and ETH trading", () => {
  assert.match(server, /requestUrl\.pathname === "\/wallet"[\s\S]{0,180}Location: "\/wallet\/\?install=1"/);
  assert.match(server, /requestUrl\.pathname === "\/wallet\/"[\s\S]{0,260}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  for (const route of ["/wallet", "/wallet/", "/wallet/*", "/wallet.html"]) {
    assert.match(redirects, new RegExp(`^${route.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\s+https:\\/\\/app\\.slimewire\\.org\\/wallet\\/\\?install=1\\s+302$`, "m"));
  }
  assert.doesNotMatch(redirects, /^\/wallet(?:\/\*)?\s+\/fun\.html/m);
  assert.match(html, /data-view="wallet-swap"/);
  assert.match(html, /data-view="wallet-asset"/);
  assert.match(js, /data-wallet-ca-form/);
  assert.match(html, /data-wallet-preset-copy/);
  assert.match(html, /aria-label="Wallet navigation"/);
  assert.match(js, /const IS_WALLET_ROUTE/);
  assert.match(html, /document\.documentElement\.classList\.add\("wallet-route-prepaint"\)/);
  assert.match(js, /function applyInitialRoute\(routeParams\)/);
  assert.match(js, /scope: IS_WALLET_ROUTE \? "\/wallet\/" : "\/fun\/"/);
  assert.equal(walletManifest.id, "/slimewallet-app");
  assert.equal(walletManifest.name, "SlimeWallet");
  assert.equal(walletManifest.start_url, "/wallet/?src=slimewallet-pwa");
  assert.equal(walletManifest.scope, "/wallet/");
  assert.match(html, /wallet-manifest\.webmanifest\?v=2/);
  assert.match(html, /wallet-install-head[^>]+data-install-fun hidden[^>]+><span>Install<\/span>/);
  assert.match(js, /if \(routeParams\.get\("install"\) === "1"\) setTimeout\(showFunInstallGuide, 350\)/);
  assert.match(funWorker, /IS_WALLET_WORKER/);
  assert.match(funWorker, /slimewallet-v30/);
  assert.match(JSON.stringify(walletManifest.icons), /slimewallet-icon-512\.png/);
  assert.match(js, /WALLET_BRAND_ASSET = "\/assets\/slimewire\/slimewallet-icon-192\.png"/);
  assert.match(css, /slimewallet-vault-bg\.webp/);
  assert.match(html, /slimewallet-profile-guardian\.png/);
  assert.doesNotMatch(funWorker, /slimewallet-profile-guardian\.png/);
  assert.match(js, /\$\$\('\[data-wallet-route-src\]'\)/);
  assert.match(js, /FUN_INSTALL_HOST\}\/\$\{IS_WALLET_ROUTE \? "wallet" : "fun"\}/);
  assert.match(js, /Supported routes stay simple: SOL buys a coin; selling a held coin returns SOL automatically\./);
  assert.match(js, /\/chart-lab\?ca=\$\{encodeURIComponent\(key\)\}/);
  assert.match(css, /body\.wallet-only/);
  assert.match(css, /\.wallet-swap-card/);
  assert.match(css, /\.wallet-inline-chart/);
});

test("SlimeWallet Swap matches the premium mockup and supports real asset flipping", () => {
  const swap = js.slice(js.indexOf("function renderWalletSwap"), js.indexOf("function selectedWalletHolding"));
  assert.match(swap, /wallet-swap-head/);
  assert.match(swap, /Secure route/);
  assert.match(swap, /data-wallet-swap-reverse/);
  assert.match(swap, /direction-sell/);
  assert.match(swap, /state\.walletSwapSide === "sell"/);
  assert.match(swap, /Review sell \$\{amount\}%/);
  assert.match(swap, /walletSwapCoinButton\(coin, "pay"/);
  assert.match(swap, /walletSwapNativeButton\("receive"\)/);
  assert.doesNotMatch(swap, /wallet-swap-direct-search/);
  assert.match(js, /state\.walletSwapPickerRole = state\.walletSwapSide === "sell" \? "pay" : "receive"/);
  assert.match(js, /state\.walletSwapAnimate = true;[\s\S]{0,80}renderWalletSwap\(\)/);
  const reverseHandler = js.slice(js.indexOf('event.target.closest("[data-wallet-swap-reverse]")'), js.indexOf('const walletSwapCoin ='));
  assert.doesNotMatch(reverseHandler, /!coinKey\(state\.selected\)[\s\S]{0,80}openWalletSwapAssetPicker/);
  assert.match(reverseHandler, /state\.walletSwapSide = state\.walletSwapSide === "sell" \? "buy" : "sell"/);
  assert.match(js, /event\.target\.querySelector\("\[data-wallet-swap-asset-input\]"\)/);
  assert.match(swap, /class="wallet-preset-settings"/);
  assert.match(swap, /aria-label="Open trade presets"/);
  assert.match(swap, /<small>Presets<\/small>/);
  assert.match(swap, /walletSwapRecentHtml\(side\)/);
  assert.match(css, /Obsidian Glass Swap v2/);
  assert.match(css, /\[data-view="wallet-swap"\] \.wallet-preset-settings/);
  assert.match(css, /\.wallet-swap-card:before[^\n]+content:none/);
  assert.match(css, /Reference-matched Swap/);
  assert.doesNotMatch(css, /slimewallet-swap-(?:bg|liquid)-v1\.webp/);
  assert.match(css, /is-flipping \.wallet-swap-side\.pay\{animation:walletSwapEnterFromBelow/);
  assert.match(css, /is-flipping \.wallet-swap-side\.receive\{animation:walletSwapEnterFromAbove/);
  assert.doesNotMatch(css, /direction-sell[^\n]+wallet-swap-reverse span[^\n]+rotate/);
  assert.match(css, /walletSwapEnterFromAbove/);
  assert.match(css, /wallet-swap-reverse:before\{content:none\}/);
  assert.doesNotMatch(css, /wallet-swap-reverse:before\{content:""/);
  assert.doesNotMatch(funWorker, /slimewallet-swap-(?:bg|liquid)-v1\.webp/);
});

test("SlimeWallet Swap picker exposes every wallet coin, recent CA, and resilient artwork", () => {
  const picker = js.slice(js.indexOf("function walletSwapCoinButton"), js.indexOf("function renderWalletSwap"));
  assert.match(picker, /function walletSwapSolanaAssets/);
  assert.match(picker, /Array\.isArray\(wallet\.tokens\)/);
  assert.match(picker, /state\.rhWalletPosition\?\.tokens/);
  assert.match(picker, /Coins in this wallet/);
  assert.match(picker, /Recent contracts/);
  assert.match(picker, /data-wallet-swap-asset-form/);
  assert.match(picker, /coinImageAttrs\(coin\)/);
  assert.match(js, /function nativeAssetIcon/);
  assert.match(js, /data-wallet-swap-select-coin/);
  assert.match(js, /openTradeSheet\("sell", \{ percent: state\.walletSwapSellPercent \}\)/);
  assert.match(css, /\.wallet-native-icon\.eth/);
  assert.match(css, /\.wallet-swap-picker-row/);
});

test("SlimeWallet paints balances before the full positions and Robinhood portfolio", () => {
  assert.match(js, /async function loadWalletBalancePreview\(options = \{\}\)/);
  assert.match(js, /api\/web\/balances\?fast=true\$\{options\.force \? "&force=true" : ""\}/);
  assert.match(js, /const initialRefresh = state\.token \? loadWalletBalancePreview\(\) : null/);
  const walletLoad = js.slice(js.indexOf("async function loadWalletView"), js.indexOf("function walletFreshnessText"));
  assert.ok(walletLoad.indexOf("renderWalletHero();") < walletLoad.indexOf("if (initialRefresh) await initialRefresh"));
  assert.match(js, /void loadPortfolioSnapshot\(\)\.then/);
  assert.match(js, /data-export-wallets>Back up all wallets/);
  assert.match(css, /\.wallet-backup-hero/);
  const scheduler = js.slice(js.indexOf("function scheduleWalletBalanceRefresh"), js.indexOf("async function hydrateFunRhBalances"));
  assert.match(scheduler, /!document\.hidden && state\.token && state\.confirmedUserId/);
  assert.match(scheduler, /loadWalletBalancePreview\(\{ force: true \}\)/);
  assert.match(scheduler, /5_000/);
  assert.match(js, /if \(document\.hidden\) \{[\s\S]{0,180}clearTimeout\(state\.walletBalanceTimer\)/);
});

test("SlimeWallet and Go load exact wallet-wide Pump rewards after spendable balances", () => {
  assert.match(html, /data-pump-rewards hidden aria-live="polite"/);
  assert.match(js, /function formatPumpRewardSol/);
  assert.match(js, /\/api\/web\/pump\/rewards\?walletIndex=/);
  assert.match(js, /post\("\/api\/web\/pump\/rewards\/claim"/);
  assert.match(js, /accountScopeMatches\(accountScope\)/);
  assert.match(js, /Number\(activeWallet\(\)\?\.index\) !== walletIndex/);
  assert.match(js, /if \(initialRefresh\) await initialRefresh;[\s\S]{0,140}queuePumpRewardsLoad/);
  assert.match(js, /function creatorRewardWallet/);
  assert.match(js, /Boolean\(row\.creatorEligible\)/);
  assert.match(js, /row\.creatorLaunchCount/);
  assert.match(js, /Claimed lifetime/);
  assert.match(js, /pump-dev-badge/);
  assert.match(js, /isCreator \? rewardRow\("creator", "Creator fees ready"/);
  assert.match(js, /rewardRow\("cashback", "Trader cash back ready"/);
  assert.match(js, /class="pump-rewards-fold"/);
  assert.match(js, /Creator & trader rewards/);
  assert.match(js, /Live on-chain earnings, separate from spendable SOL until claimed/);
  assert.match(js, /PumpSwap may pay WSOL when this wallet already has a WSOL account/);
  assert.match(css, /\.pump-rewards-card\.creator-wallet/);
  assert.match(css, /\.pump-creator-summary/);
  assert.match(css, /\.pump-rewards-fold>summary/);
  assert.match(js, /result\.data\.payoutAsset/);
  assert.match(js, /PumpSwap proceeds remain WSOL in this wallet's existing WSOL account/);
  assert.match(js, /pump-cashback-badge/);
  assert.match(js, /function updateFunInstallVisibility/);
  assert.match(js, /install\.hidden = !IS_WALLET_ROUTE \|\| runningStandalone\(\)/);
  assert.match(js, /if \(state\.deferredInstall\)[\s\S]{0,160}promptEvent\.prompt\(\)/);
});

test("SlimeWire Go also adopts the fast authenticated wallet list before full portfolio hydration", () => {
  const init = js.slice(js.indexOf("async function init()"));
  assert.match(init, /loadWalletBalancePreview\(\)/);
  assert.match(init, /void loadPortfolioSnapshot\(\)\.then/);
  assert.ok(init.indexOf("loadWalletBalancePreview()") < init.indexOf("void loadPortfolioSnapshot().then"));
  assert.doesNotMatch(init, /\[loadMe\(\), loadWallets\(\), loadPositions\(\)/);
});

test("SlimeWallet shares one secure account session and keeps wallet management in app", () => {
  assert.match(server, /const WEB_SESSION_COOKIE = "sw_session"/);
  assert.match(server, /Domain=\.slimewire\.org/);
  assert.match(server, /"HttpOnly"/);
  assert.match(server, /"SameSite=Lax"/);
  assert.match(server, /Access-Control-Allow-Credentials/);
  assert.match(server, /function webAuthTokensFromRequest/);
  assert.match(server, /request\.headers\.cookie/);
  assert.match(server, /pathname === "\/api\/web\/me"[\s\S]{0,260}webSessionCookie\(request, auth\.token, auth\.expiresAt\)/);
  for (const source of [js, terminalApp]) assert.match(source, /credentials: "include"/);
  assert.match(js, /async function restoreSharedSession/);
  const init = js.slice(js.indexOf("async function init()"));
  assert.ok(init.indexOf("await restoreSharedSession()") < init.indexOf("if (state.token) Promise.all"));
  assert.match(js, /✓ Signed in/);
  assert.match(js, /data-manage-wallets>Manage \/ restore/);
  assert.match(js, /data-export-wallets>Back up all wallets/);
  assert.match(js, /data-restore-wallets>Restore \/ import wallet/);
  assert.match(js, /data-create-wallet>Create new wallet/);
  assert.match(js, /function walletProfileManagementHtml\(\)/);
  assert.match(js, /Log in \/ switch profile/);
  assert.match(js, /WALLET MANAGEMENT/);
  assert.match(js, /data-manage-wallets>Manage wallets/);
  assert.match(js, /data-restore-wallets>Restore \/ import/);
  assert.match(js, /wallet-profile-open/);
  assert.match(css, /\.wallet-only\.wallet-profile-open \[data-wallet-hero\]/);
  const manager = js.slice(js.indexOf("async function openWalletManager"), js.indexOf("function selectedManagerWalletIndexes"));
  assert.match(manager, /if \(!state\.token\) \{ openFunAccount\("login"\); return; \}/);
  assert.doesNotMatch(manager, /await Promise\.all\(\[loadWallets/);
  assert.match(manager, /encrypted backup, recovery file, Phantom\/Solflare private key/);
});

test("/fun is installable as a separate PWA with a dedicated-origin escape", () => {
  assert.equal(manifest.id, "/slimewire-fun-app");
  assert.equal(manifest.start_url, "/fun/?src=slimewire-fun-pwa");
  assert.equal(manifest.scope, "/fun/");
  assert.match(html, /fun-manifest\.webmanifest\?v=2/);
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /FUN_INSTALL_HOST = "app\.slimewire\.org"/);
  assert.match(js, /Install SlimeWire Go/);
  assert.match(js, /register\("\/fun-sw\.js", \{ scope: IS_WALLET_ROUTE \? "\/wallet\/" : "\/fun\/", updateViaCache: "none" \}\)/);
  assert.match(funWorker, /slimewire-fun-v87/);
  assert.match(JSON.stringify(manifest.icons), /fun-app-icon-512\.png/);
  assert.doesNotMatch(funWorker, /pathname\.startsWith\("\/api\/"\)[\s\S]{0,80}cache\.put/);
});

test("Quick Buy uses an intentional SOL mark instead of the broken target glyph", () => {
  const quick = js.slice(js.indexOf("function renderQuickRoute"), js.indexOf("function renderWalletPositions"));
  assert.match(quick, /class="sol-amount-mark">S<\/i>/);
  assert.doesNotMatch(quick, /<i>◎<\/i>/);
  assert.match(css, /\.quick-amounts button i\.sol-amount-mark/);
  assert.doesNotMatch(js, /<b>◎ \$\{sol\.toFixed\(4\)\} SOL<\/b>/);
  assert.doesNotMatch(js, /`◎ \$\{escapeHtml\(formatPositionSol\(valueSol\)\)\} SOL`/);
});

test("/fun keeps the reference layout clean while carrying SlimeWire features", () => {
  for (const marker of ["data-view=\"home\"", "data-view=\"leaders\"", "data-view=\"wallet\"", "data-view=\"coin\"", "bottom-nav", "trade-dock", "data-open-tools", "data-open-trade=\"buy\"", "data-open-trade=\"sell\""]) assert.match(html, new RegExp(marker));
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\(min-width:760px\)/);
  assert.match(js, /TP \/ SL/);
  assert.match(js, /trailingStopPct/);
  assert.match(js, /breakEvenAfterTp1/);
  assert.match(js, /takeProfitLadder/);
  assert.match(js, /payCurrency/);
  assert.match(js, /Robinhood Chain/);
  assert.match(js, /coin\.volumeLabel \|\| "Unavailable"/);
  assert.doesNotMatch(html, /community chat/i);
  assert.match(html, /class="feed-search-btn"[\s\S]{0,140}data-open-search[\s\S]{0,100}Search CA/);
  assert.match(css, /\.feed-actions\{display:flex/);
});

test("Fun New feed overlays live Pump launches and refreshes both chains without blanking", () => {
  assert.match(server, /realtimeOverlay: true/);
  assert.match(server, /getCreationCandidates\(\{ maxAgeMs: 30 \* 60_000, limit: 100 \}\)/);
  assert.match(server, /const freshMs = cat === "new" \? 4_000 : 10_000/);
  assert.match(server, /cachedWebRhPairs\(requestUrl\.searchParams\.get\("category"\)[\s\S]{0,180}\{ force, withMeta: true \}/);
  assert.match(js, /state\.feed === "new" \? 5000/);
  assert.match(js, /query\.set\("force", "true"\)/);
  assert.match(js, /const stableSol = sol\.ok \? sol\.rows/);
  assert.match(js, /const stableRh = rh\.ok \? rh\.rows/);
});

test("Fun Launch keeps the Pump launcher inside the Go layout", () => {
  assert.match(html, /data-view="launch"[\s\S]{0,500}data-launch-frame/);
  assert.match(js, /function openFunLaunch\(\)/);
  assert.match(js, /frame\.src = `\/\?from=fun&embed=fun-launch&launchMode=pump&freshLaunch=1/);
  assert.match(js, /t=\$\{Date\.now\(\)\}/);
  assert.match(js, /action === "launch"[\s\S]{0,100}openFunLaunch\(\)/);
  assert.match(js, /data-wallet-launch-coin/);
  assert.match(js, /state\.launchReturnView = "wallet"; openFunLaunch\(\)/);
  assert.doesNotMatch(js, /location\.assign\("\/\?from=fun#launch"\)/);
  assert.match(css, /\.launch-view\.active/);
  for (const page of [desktopHtml, desktopAliasHtml]) {
    assert.match(page, /const funLaunchHandoff = q\.get\("from"\) === "fun"/);
    assert.match(page, /\^#launch\(\?:\\\/\|\$\)\/i\.test\(location\.hash \|\| ""\)/);
    assert.match(page, /if \(funLaunchHandoff\) return;/);
    assert.match(page, /const query=new URLSearchParams\(location\.search\),embed=query\.get\("embed"\);if\(embed===\"fun-launch\"\)/);
    assert.match(page, /if\(query\.get\("bundleInvite"\)\)document\.body\.classList\.add\("bundle-invite-flow"\)/);
    assert.match(page, /body\.fun-launch-embed \.topbar/);
  }
});

test("/fun hides the SlimeCash handoff unless the route came from cash", () => {
  assert.match(html, /class="cash-handoff" data-cash-handoff hidden/);
  assert.match(css, /\.cash-handoff\[hidden\]\{display:none\}/);
  assert.match(js, /const FROM_CASH = ROUTE_PARAMS\.get\("from"\) === "cash"/);
  assert.match(js, /handoff\.hidden = !FROM_CASH/);
  assert.match(js, /SLIMECASH TO FUN/);
  assert.match(html, /fun\.css\?v=66/);
  assert.match(funWorker, /slimewire-fun-v87/);
  assert.match(funWorker, /fun\.css\?v=66/);
  assert.match(css, /\.wallet-bottom-nav\[hidden\]\{display:none!important\}/);
  assert.match(js, /walletNav\.hidden = hideWalletNav/);
});

test("/fun keeps the wallet funding card compact and scannable", () => {
  assert.match(css, /\[data-home-readiness\] \.readiness-card\{gap:9px/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(js, /<span>WALLET READY<\/span>/);
  assert.match(js, /"Add SOL to trade"/);
  assert.match(js, /"Add SOL from Phantom, Solflare, or another Solana wallet\."/);
  assert.match(html, /fun\.js\?v=90/);
  assert.match(funWorker, /fun\.js\?v=90/);
});

test("Fun volume switches pasted contracts to their authoritative chain", () => {
  const openVolume = js.slice(js.indexOf("async function openVolumeSheet"), js.indexOf("function funVolumeRunActive"));
  const startVolume = js.slice(js.indexOf("async function startFunVolume"), js.indexOf("async function stopFunVolume"));
  assert.match(openVolume, /const rh = isRh\(key\) \|\| \(!tokenOverride && coin\.chain === "robinhood"\)/);
  assert.match(startVolume, /detectedRh = isRh\(token\), rh = detectedRh/);
  assert.match(startVolume, /openVolumeSheet\(token\)/);
  assert.doesNotMatch(startVolume, /This volume panel is set up for/);
  assert.match(js, /event\.target\.matches\("\[data-volume-token\]"\)/);
  assert.match(js, /Switched to \$\{detectedRh \? "Robinhood" : "Solana"\} volume controls/);
});

test("Connect and Deposit share one simple funding flow without surprise wallet downloads", () => {
  assert.match(html, /class="wallet-pill" type="button" data-wallet-entry/);
  assert.match(html, /data-deposit>Deposit<\/button>/);
  assert.match(html, /data-send-sol>Send SOL<\/button>/);
  assert.match(html, /data-receive>Receive<\/button>/);
  assert.match(html, /class="quick-wallet-pill" type="button" data-wallet-entry/);
  for (const marker of ["data-fund-coinbase", 'data-fund-wallet="phantom"', 'data-fund-wallet="solflare"', "data-fund-copy", "data-fund-sol"]) assert.match(js, new RegExp(marker));
  assert.doesNotMatch(js, /data-fund-wallet="other"/);
  assert.match(js, /function openFundingSheet/);
  assert.doesNotMatch(html, /<script[^>]+slimewire-funding\.js/);
  assert.match(js, /loadFunScript\("\/slimewire-funding\.js\?v=8"\)/);
  assert.match(js, /startCoinbaseFunding/);
  assert.match(js, /\/api\/web\/wallets\/create/);
  assert.match(js, /\/api\/web\/wallet-funding\/create/);
  assert.match(js, /\/api\/web\/wallet-funding\/execute/);
  assert.match(js, /startFunMobileExactFunding/);
  const mobileLaunch = js.slice(js.indexOf("async function startFunMobileExactFunding"), js.indexOf("async function checkPendingFunFunding"));
  const pendingCheck = js.slice(js.indexOf("async function checkPendingFunFunding"), js.indexOf("function resumePendingFunFunding"));
  assert.match(mobileLaunch, /const funding = walletFunding\(\)/);
  assert.match(mobileLaunch, /funding\.createSolanaPayReference\(\)/);
  assert.match(mobileLaunch, /funding\.solanaPayTransferUrl\(\{/);
  assert.match(mobileLaunch, /location\.assign\(payUri\)/);
  assert.doesNotMatch(mobileLaunch, /setTimeout|baselineSol/);
  assert.match(pendingCheck, /post\("\/api\/web\/wallet-funding\/status"/);
  assert.match(pendingCheck, /if \(pending\.reference && pending\.walletIndex\)[\s\S]*return false;\s*}\s*await loadWallets/);
  assert.doesNotMatch(js, /startMobileConnect|startMobileSign|consumeMobileCallback|mobileSession|authorizeAndSignMobile|supportsMwa|resumeFunMobileFunding/);
  const startFundingBody = js.slice(js.indexOf("async function startWalletFunding"), js.indexOf("async function submitWalletFunding"));
  assert.doesNotMatch(startFundingBody, /location\.assign\(fundingWalletBrowseUrl/);
  assert.doesNotMatch(js, /event\.target\.closest\("\[data-deposit\]"\) \|\| event\.target\.closest\("\[data-receive\]"\)/);
  const openFundingBody = js.slice(js.indexOf("function openFundingSheet"), js.indexOf("async function startWalletFunding"));
  assert.doesNotMatch(openFundingBody, /createWallet\(|ensureAccount\(|downloadText\(/);
  assert.doesNotMatch(js, /function openFundingAmountSheet/);
  const receiveBody = js.slice(js.indexOf("function walletReceive"), js.indexOf('document.addEventListener("click"'));
  assert.doesNotMatch(receiveBody, /createWallet\(/);
  assert.match(server, /pathname === "\/api\/web\/wallet-funding\/create"/);
  assert.match(server, /pathname === "\/api\/web\/wallet-funding\/execute"/);
  assert.match(server, /async function createWebWalletFundingOrder/);
  assert.match(server, /const tx = buildWalletFundingTransaction\(\{/);
  assert.match(server, /ComputeBudgetProgram\.setComputeUnitLimit\(\{ units: 200_000 \}\)/);
  assert.match(server, /ComputeBudgetProgram\.setComputeUnitPrice\(\{ microLamports: 5_000 \}\)/);
  assert.match(server, /async function executeWebWalletFunding/);
  assert.match(server, /destinationPublicKey \|\| order\.sessionWalletPublicKey/);
  assert.match(server, /volumeBot: Boolean\(wallet\.volumeBot \|\| wallet\.ephemeral\)/);
  assert.match(js, /\.filter\(\(wallet\) => !wallet\.volumeBot\)/);
  assert.match(server, /SetLoadedAccountsDataSizeLimit/);
  assert.match(server, /\[0, 1, 2, 3, 4\]\.includes\(type\)/);
  assert.match(server, /priorityFeeLamports > maxPriorityFeeLamports/);
  assert.match(server, /transfers\.length !== 1/);
  assert.match(server, /BigInt\(transfer\.lamports\) !== amountLamports/);
});

test("Fun PWA refreshes exact funding assets without deleting another app's cache", () => {
  assert.match(funWorker, /"slimewire-fun-v87"/);
  assert.doesNotMatch(funWorker, /\/slimewire-funding\.js\?v=8/);
  assert.match(js, /loadFunScript\("\/slimewire-funding\.js\?v=8"\)/);
  assert.match(funWorker, /self\.skipWaiting\(\)/);
  assert.match(funWorker, /self\.clients\.claim\(\)/);
  assert.match(funWorker, /key\.startsWith\(FUN_CACHE_PREFIX\) && key !== FUN_CACHE/);
  assert.doesNotMatch(funWorker, /slimewire-mwa/i);
  assert.match(js, /register\("\/fun-sw\.js", \{ scope: IS_WALLET_ROUTE \? "\/wallet\/" : "\/fun\/", updateViaCache: "none" \}\)/);
});

test("connected funding wallets stay separate from managed positions", () => {
  const serverPositions = server.slice(server.indexOf("async function buildPositionsOverview"), server.indexOf("async function estimatePositionValue"));
  const clientPositions = terminalApp.slice(terminalApp.indexOf("function portfolioPositions"), terminalApp.indexOf("function portfolioRealizedPnlLabel"));
  assert.doesNotMatch(serverPositions, /connectedWalletPublicKey|connectedWallet: true/);
  assert.doesNotMatch(clientPositions, /connectedWalletTokenRows|connectedWalletBalance/);
  assert.doesNotMatch(terminalApp, /function connectedWalletTokenRows/);
  assert.match(terminalApp, /Funding wallet connected/);
  assert.match(terminalApp, /never mixed into your SlimeWire portfolio/);
});

test("web positions preserve tracked and market-backed managed-wallet holdings without admitting unmarketed dust", () => {
  const shared = server.slice(server.indexOf("async function buildPositionsOverview"), server.indexOf("async function showSniperScan"));
  const normalizer = server.slice(server.indexOf("function normalizeWebTokenHolding"), server.indexOf("function positionValueCacheKey"));
  const projection = server.slice(server.indexOf("function webPositionHasMarketEvidence"), server.indexOf("async function estimatePositionValueFromMarket"));
  const webRows = server.slice(server.indexOf("async function webPositionRows"), server.indexOf("async function webPnlSummary"));
  assert.match(shared, /for \(const account of accounts\.filter\(\(item\) => item\.rawAmount > 0n\)\)/);
  assert.match(shared, /options\.webPortfolioOnly[\s\S]{0,180}!wallet\.volumeBot && !wallet\.ephemeral/);
  assert.doesNotMatch(shared, /webPortfolioOnly[\s\S]{0,180}!wallet\.sessionWallet/);
  assert.match(shared, /tradeType === "launch" && positiveBigIntOrZero\(trade\.solLamportsSpent\) > 0n/);
  assert.match(projection, /hasAcquisitionProvenance = Number\(position\?\.buys \|\| 0\) > 0/);
  assert.match(projection, /positiveBigIntOrZero\(position\?\.spent\) > 0n/);
  assert.match(projection, /webPositionHasMarketEvidence/);
  assert.match(projection, /hasBuyProvenance: hasAcquisitionProvenance/);
  assert.match(projection, /hasMarketEvidence/);
  assert.doesNotMatch(projection, /buyWallets/);
  assert.match(webRows, /webPrimaryPositionProjection\(position, metadataByMint\.get\(position\.tokenMint\)/);
  assert.match(webRows, /tokenMetadataMapForMints\(candidates\.map/);
  assert.match(webRows, /webPortfolioOnly: true/);
  assert.match(webRows, /position\.buys > 0 && position\.spent > 0n/);
  assert.doesNotMatch(server.slice(server.indexOf("async function estimatePositionValueFromMarket"), server.indexOf("async function pnlSummaryText")), /accounts\.slice\(0, 8\)/);

  const positiveBigIntOrZero = (value) => { try { const parsed = BigInt(String(value ?? "0")); return parsed > 0n ? parsed : 0n; } catch { return 0n; } };
  const firstString = (...values) => values.find((value) => typeof value === "string" && value.trim()) || "";
  const firstMeaningfulNumber = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) || null;
  const project = Function("positiveBigIntOrZero", "firstString", "firstMeaningfulNumber", `${normalizer}\n${projection}\nreturn webPrimaryPositionProjection;`)(positiveBigIntOrZero, firstString, firstMeaningfulNumber);
  const swept = project({ tokenMint: "mint", buys: 1, sells: 0, spent: 100n, received: 0n, accounts: [
    { walletPublicKey: "destination-wallet", rawAmount: 123400n, decimals: 2 }
  ] });
  assert.equal(swept.walletCount, 1);
  assert.equal(swept.rawAmount, 123400n);
  assert.equal(swept.uiAmount, 1234);
  const recovered = project({ tokenMint: "CTTqPmJqnDPuTquiBmoQgvgHug8eG9rXvFaXpFetpump", buys: 0, spent: 0n, accounts: [
    { walletPublicKey: "wallet", rawAmount: 1439697019817n, decimals: 6 }
  ] });
  assert.equal(recovered.uiAmount, 1439697.019817);
  assert.equal(recovered.marketVerified, true);
  assert.equal(recovered.acquisitionTracked, false);
  const marketBacked = project({ tokenMint: "market-mint", buys: 0, spent: 0n, accounts: [
    { walletPublicKey: "wallet", rawAmount: 2500n, decimals: 2 }
  ] }, { pairAddress: "pool-address", liquidityUsd: 1000 });
  assert.equal(marketBacked.uiAmount, 25);
  assert.equal(marketBacked.marketVerified, true);
  assert.equal(project({ tokenMint: "spam", buys: 0, spent: 0n, accounts: [{ walletPublicKey: "wallet", rawAmount: 1n, decimals: 0 }] }), null);
});

test("market-backed positions recover honest wallet PnL without converting missing values to zero", () => {
  const recovery = server.slice(server.indexOf("function mergeRecoveredWebPositionPnl"), server.indexOf("async function webPositionRows"));
  const webRows = server.slice(server.indexOf("async function webPositionRows"), server.indexOf("async function webPnlSummary"));
  assert.match(recovery, /normalizeSolWalletPositions/);
  assert.match(recovery, /filter: "holding"/);
  assert.match(recovery, /finiteWalletNumber\(row\.unrealizedUsd, row\.pnlUsd\)/);
  assert.match(recovery, /costBasisUsd/);
  assert.match(recovery, /openPnlPercent/);
  assert.match(recovery, /recoverWebPositionPnlFromRpc/);
  assert.match(recovery, /getSignaturesForAddress/);
  assert.match(recovery, /getParsedTransaction/);
  assert.match(recovery, /computeRecoveredSolPositionCost/);
  assert.match(webRows, /costBasisSol: recoveredCostBasisLamports/);
  assert.match(webRows, /recoveredOpenPnl !== null \? "onchain-rpc"/);
  assert.match(webRows, /recoveredWebPositionPnlByMint\(\s*limited\.slice\(0, 10\)/);
  assert.match(terminalApp, /position\?\.pnlSource === "onchain-wallet"/);
  assert.match(terminalApp, /position\?\.pnlSource === "onchain-rpc"/);
  assert.match(terminalApp, /position\.openPnlUsd/);
  assert.match(js, /position\?\.openPnlUsd/);
  assert.match(js, /position\?\.costBasisUsd/);
  assert.match(js, /position\?\.pnlSource === "onchain-rpc"/);

  const mergeSource = recovery.slice(0, recovery.indexOf("async function recoveredWebPositionPnlByMint"));
  const merge = Function("finiteWalletNumber", `${mergeSource}; return mergeRecoveredWebPositionPnl;`)(
    (...values) => {
      for (const value of values) {
        if (value == null || value === "" || typeof value === "boolean") continue;
        const number = Number(value);
        if (Number.isFinite(number)) return number;
      }
      return null;
    }
  );
  const aggregate = { costBasisUsd: 0, estimatedValueUsd: 0, openPnlUsd: 0, hasCost: false, hasValue: false, hasPnl: false, walletCount: 0 };
  merge(aggregate, { costUsd: null, valueUsd: null, unrealizedUsd: null, pnlUsd: null });
  assert.equal(aggregate.hasCost, false);
  assert.equal(aggregate.hasPnl, false);
  merge(aggregate, { costUsd: 50, valueUsd: 40, unrealizedUsd: -10, pnlUsd: null });
  assert.deepEqual({ cost: aggregate.costBasisUsd, value: aggregate.estimatedValueUsd, pnl: aggregate.openPnlUsd }, { cost: 50, value: 40, pnl: -10 });
});

test("Fun chart exposes server-side market-cap buy, ladder, and stop-loss orders", () => {
  assert.match(html, /data-market-orders>[^<]*Orders/);
  assert.match(js, /function parseMarketCapInput/);
  assert.match(js, /data-order-buy-mc/);
  assert.match(js, /data-order-ladder-mc/);
  assert.match(js, /data-order-stop-mc/);
  assert.match(js, /post\("\/api\/web\/market-orders"/);
  assert.match(js, /post\("\/api\/web\/market-orders\/cancel"/);
  assert.match(js, /keep running server-side/);
  assert.match(server, /async function webCreateMarketCapOrders/);
  assert.match(server, /source: "web"/);
  assert.match(server, /webTradeBuy\(o\.userId/);
  assert.match(server, /webTradeSell\(o\.userId/);
  assert.match(server, /webRhArmGuard\(userId/);
  assert.match(server, /pathname === "\/api\/web\/market-orders"/);
});

test("speculative position and PnL cache warming remains disabled", () => {
  const warmer = server.slice(server.indexOf("async function warmWorkerDisplayCaches"), server.indexOf("function normalizeWorkerList"));
  assert.match(server, /const workerTickWarmDisplayCaches = false/);
  assert.match(server, /const workerDisplayCacheUserLimit = 0/);
  assert.match(warmer, /webPositionConnectedScope\(profile\)/);
  assert.match(warmer, /cachedWebSummary\("web:positions:v2:" \+ connectedScope/);
  assert.match(warmer, /cachedWebSummary\("web:positions:v2:fast:" \+ connectedScope/);
  assert.match(warmer, /positionsValuePromise = webPositionSummary\(userId, \{ force, fast: true \}\)/);
});

test("forced web summary refresh waits out an older in-flight build before rebuilding", async () => {
  const helperSource = server.match(/async function refreshWebSummaryAfterInflight\(inflight, refresh\) \{[\s\S]*?\n\}/)?.[0] || "";
  assert.ok(helperSource, "refreshWebSummaryAfterInflight is missing");
  const refreshAfterInflight = Function(`${helperSource}\nreturn refreshWebSummaryAfterInflight;`)();
  let release;
  let refreshes = 0;
  const olderBuild = new Promise((resolve) => { release = resolve; });
  const forced = refreshAfterInflight(olderBuild, () => {
    refreshes += 1;
    return { value: "fresh" };
  });
  await Promise.resolve();
  assert.equal(refreshes, 0);
  release({ value: "old" });
  assert.deepEqual(await forced, { value: "fresh" });
  assert.equal(refreshes, 1);
  await assert.doesNotReject(() => refreshAfterInflight(Promise.reject(new Error("old failed")), () => ({ value: "recovered" })));

  const cached = server.slice(server.indexOf("async function cachedWebSummary"), server.indexOf("async function sendWebLoginCode"));
  assert.match(cached, /if \(force\) \{[\s\S]*force-inflight-queued[\s\S]*refreshWebSummaryAfterInflight\(cached\.promise/);
  assert.match(cached, /startWebSummaryRefresh\(key, externalKey, cacheName, builder, ttlMs, staleMs/);
});

test("confirmed launch buys create exact idempotent web-position provenance", () => {
  const fallback = server.slice(server.indexOf("async function firePostLaunchBuysServerSide"), server.indexOf("async function webLaunchPumpJitoBundle"));
  const jito = server.slice(server.indexOf("async function webLaunchPumpJitoBundle"), server.indexOf("async function webLaunchMeteoraDbc"));
  const exactCandidate = server.slice(server.indexOf("async function findConfirmedJitoBundleCandidate"), server.indexOf("function provenJitoBuyEvents"));
  const reconcile = server.slice(server.indexOf("async function reconcilePersistedJitoAttempt"), server.indexOf("async function reconcilePersistedJitoAttemptForUser"));
  const meteora = server.slice(server.indexOf("async function webLaunchMeteoraDbc"), server.indexOf("async function webLaunchPumpPortalLocal"));
  assert.match(fallback, /source: "pump_launch_raw_buy"/);
  assert.match(fallback, /walletPublicKey: keypair\.publicKey\.toBase58\(\)/);
  assert.match(fallback, /signature\s*\n\s*}\]\);/);
  assert.match(jito, /const txSignature = bs58\.encode\(tx\.signatures\[0\]\)/);
  assert.match(jito, /submittedBundleCandidates\.push\(candidate\)/);
  assert.match(jito, /candidate\s*=\s*\{[\s\S]*signatures: attemptSignatures[\s\S]*buyEvents: attemptBuyEvents/);
  assert.match(exactCandidate, /getSignatureStatuses\(candidate\.signatures, \{ searchTransactionHistory: true \}\)/);
  assert.match(jito, /if \(landedBuyEvents\.length\) \{[\s\S]*await recordTradeEvents\(landedBuyEvents\)/);
  assert.match(reconcile, /const missingEvents = events\.filter[\s\S]*await recordTradeEvents\(missingEvents\)/);
  assert.match(jito, /signature: txSignature/);
  assert.match(jito, /atomicReceiptPending: !atomicReceiptsRecorded/);
  assert.match(meteora, /if \(devBuySol > 0\) \{[\s\S]*source: "meteora_launch"/);
  assert.match(meteora, /walletPublicKey: creatorPk/);
  assert.match(server, /return `\$\{sig}:\$\{trade\.type \|\| ""}:\$\{trade\.tokenMint \|\| ""}:\$\{trade\.walletPublicKey \|\| ""}`/);
  assert.match(server, /`provenance:\$\{provenanceId}:\$\{trade\.type \|\| ""}:\$\{trade\.tokenMint \|\| ""}:\$\{trade\.walletPublicKey \|\| ""}`/);
});

test("ordinary community snipes persist their acquired position", () => {
  const community = server.slice(server.indexOf("async function fireCommunitySnipe(chatId"), server.indexOf("const tgQuickBuyPending"));
  assert.match(community, /source: "community-snipe"/);
  assert.match(community, /solLamportsSpent: String\(buyResult\.amountLamports \|\| amountLamports\)/);
  assert.match(community, /tokenAmount: buyResult\.tokenDeltaAmount \|\| buyResult\.outputAmount \|\| null/);
  assert.match(community, /signature: buyResult\.signature/);
});

test("live autopilot trades persist user-owned position receipts", () => {
  const adapter = server.slice(server.indexOf("buyToken: async (mint, lamports)"), server.indexOf("async function startLiveAutopilotResume"));
  assert.match(adapter, /userId: String\(autopilotWalletRecord\.ownerId\)/);
  assert.match(adapter, /type: "buy",[\s\S]{0,80}source: "autopilot"/);
  assert.match(adapter, /solLamportsSpent: String\(res\.amountLamports \|\| lamports\)/);
  assert.match(adapter, /tokenAmount: String\(res\.tokenDeltaAmount\)/);
  assert.match(adapter, /type: "sell",[\s\S]{0,80}source: "autopilot"/);
  assert.match(adapter, /solLamportsReceived: res\?\.outputLamports/);
});

test("Fun exposes Send SOL and fee-aware All from wallet and positions", () => {
  assert.match(html, /data-send-sol>Send SOL/);
  assert.match(js, /function openSendSolSheet/);
  assert.match(js, /data-send-sol-all/);
  assert.match(js, /pending\.sendAll \? \{ sendAll: true \}/);
  assert.match(js, /post\("\/api\/web\/cash\/send"/);
  assert.match(js, /panel\.innerHTML = `<div class="position-actions"><button type="button" data-send-sol/);
});

test("/fun and SlimeCash share the mobile shell", () => {
  assert.match(html, /data-open-cash/);
  assert.match(html, /<b>Cash<\/b>/);
  assert.doesNotMatch(html, /href="\/polymarket"/);
  assert.doesNotMatch(html, /<b>Poly<\/b>/);
  assert.match(html, /<b>More<\/b>/);
  assert.match(js, /location\.assign\("\/cash\/\?from=fun"\)/);
  assert.match(js, /action === "poly"[\s\S]{0,80}location\.assign\("\/polymarket"\)/);
  assert.doesNotMatch(js, /"Poly Hub", "Markets, bets, and PnL", "poly"/);
  assert.match(js, /action === "cash"/);
  assert.match(js, /action === "traders"/);
  assert.match(js, /routeParams\.get\("profile"\) === "1"/);
  assert.match(js, /downloadFunAccountBackup/);
  assert.match(js, /\/api\/web\/cash\/account-backup/);
});

test("/fun keeps SOL in the header and shows SOL plus coins as cash in the funding card", () => {
  assert.match(html, /class="wallet-pill-copy" data-wallet-balance/);
  assert.match(js, /function portfolioSolTotal\(\)/);
  assert.match(js, /position\?\.estimatedValueSol/);
  assert.match(js, /totalSol: liquidSol \+ coinsSol/);
  assert.match(js, /compactSol\(wallet\.sol\)/);
  assert.match(js, /<small>AVAILABLE<\/small>/);
  assert.match(js, /const totalUsd = baseUsd == null \? null : baseUsd \+ rhEth \* Math\.max\(0, state\.rhEthUsd\)/);
  assert.match(js, /class="wallet-cash-total"[\s\S]{0,180}TOTAL VALUE[\s\S]{0,180}SOL \+ COINS \+ RH ETH/);
  assert.match(css, /\.readiness-summary\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(server, /getSolUsdPrice\(\{ timeoutMs: fast \? 900 : 1_800 \}\)[\s\S]{0,220}return \{ balances, connectedWallet, solUsd, fast \}/);
  assert.match(js, /function paintPositionSurfaces\(\)[\s\S]{0,160}paintWalletPill\(\);[\s\S]{0,80}renderHomeReadiness\(\)/);
  assert.match(js, /async function loadPositions\(options = \{\}\)[\s\S]{0,600}paintPositionSurfaces\(\)/);
});

test("Fun exposes the complete paired Robinhood ETH wallet without hiding recovery controls", () => {
  assert.match(js, /function openFunRhWalletTools/);
  assert.match(js, /data-rh-wallet-tools="\$\{wallet\.index\}"/);
  assert.match(js, /\/api\/web\/rh\/fund-with-sol/);
  assert.match(js, /\/api\/web\/rh\/bridge-to-sol/);
  assert.match(js, /\/api\/web\/rh\/send-eth/);
  assert.match(js, /Manual ETH sends keep a protected network reserve/);
  assert.match(js, /const rhEthUsd = Math\.max\(0, Number\(wallet\.rhEth\)/);
  assert.match(js, /Solana address[\s\S]{0,800}Robinhood Chain address/);
});

test("/fun backs up every wallet, auto-backs up new wallets, and keeps backup-all explicit", () => {
  assert.match(js, /data-backup-wallet data-wallet-index="\$\{wallet\.index\}" data-wallet-key="\$\{escapeHtml\(wallet\.publicKey\)\}">Solflare \/ Phantom Backup/);
  assert.match(js, /function walletManagerRowHtml\(wallet\)[\s\S]{0,5000}data-backup-wallet data-wallet-index="\$\{wallet\.index\}" data-wallet-key="\$\{escapeHtml\(wallet\.publicKey\)\}"/);
  assert.match(js, /const previousWallets = new Set\(state\.wallets\.map[\s\S]{0,650}for \(const wallet of created\) markWalletBackedUp\(wallet\)/);
  assert.match(js, /sessionStorage\.getItem\(WALLET_BACKUP_REMINDER_KEY\)[\s\S]{0,260}Back up Wallet 1 before using another device/);
  assert.match(js, /const requestBody = options\.walletPublicKey \|\| options\.walletIndex[\s\S]{0,180}publicKey: options\.walletPublicKey[\s\S]{0,100}walletIndex: options\.walletIndex/);
  assert.match(js, /post\("\/api\/web\/wallets\/export", requestBody\)/);
  assert.match(js, /exportWallets\(backupWallet, \{ recoveryOnly: true, walletPublicKey: backupWallet\.dataset\.walletKey[\s\S]{0,180}walletIndex: backupWallet\.dataset\.walletIndex/);
  assert.match(js, /downloads\.recoveryKeys\?\.text[\s\S]{0,180}downloadText\(downloads\.recoveryKeys\.filename, downloads\.recoveryKeys\.text\)/);
  assert.match(js, /downloads\.evmRecoveryKeys\?\.text[\s\S]{0,180}downloadText\(downloads\.evmRecoveryKeys\.filename, downloads\.evmRecoveryKeys\.text\)/);
  assert.match(js, /Solflare\/Phantom backup downloaded\. Open the file for load steps and keep it private\./);
  assert.match(js, /markWalletBackedUp\(selected \|\| options\.walletPublicKey\)/);
  const allFiles = js.slice(js.indexOf("function downloadWalletFiles"), js.indexOf("async function downloadFunAccountBackup"));
  assert.match(allFiles, /downloads\.encryptedBackup, downloads\.recoveryKeys, downloads\.evmRecoveryKeys/);
  assert.match(js, /const exportButton = event\.target\.closest\("\[data-export-wallets\]"\)[\s\S]{0,100}exportWallets\(exportButton\)/);
  assert.match(css, /\.wallet-total-line\{display:flex/);
  assert.match(css, /\.wallet-backup-button\{/);
});

test("Phantom and iPhone wallet backups use a save sheet instead of navigating to a blob URL", () => {
  const mobileSave = js.slice(
    js.indexOf("function mobileBackupSaveRequired"),
    js.indexOf("async function downloadFunAccountBackup")
  );
  assert.match(mobileSave, /iPhone\|iPad\|iPod/);
  assert.match(mobileSave, /Phantom\|Solflare/);
  assert.match(mobileSave, /if \(mobileBackupSaveRequired\(\)\) \{[\s\S]{0,120}openMobileBackupSave\(prepared\)/);
  assert.match(mobileSave, /data-save-mobile-backup/);
  assert.match(mobileSave, /Save to Files/);
  assert.match(mobileSave, /navigator\.share\(\{ title: "Save SlimeWire wallet backup", files: \[file\] \}\)/);
  assert.match(mobileSave, /await copyMobileBackupFile\(index, button\)/);
  assert.ok(
    mobileSave.indexOf("if (mobileBackupSaveRequired())") < mobileSave.indexOf("URL.createObjectURL(blob)"),
    "mobile wallet browsers must exit into the save sheet before blob downloads are created"
  );
  assert.match(html, /\/fun\.js\?v=90/, "the fixed wallet script must bypass Phantom's long-lived asset cache");
});

test("the root terminal also batches Phantom wallet backups behind a direct save tap", () => {
  for (const source of [desktopHtml, desktopAliasHtml]) {
    const start = source.indexOf("function mobileBackupSaveRequired");
    const end = source.indexOf("// ---------- API + auth ----------", start);
    const mobileSave = source.slice(start, end);
    assert.ok(start >= 0 && end > start, "root wallet backup helper should remain extractable");
    assert.match(mobileSave, /iPhone\|iPad\|iPod\|Phantom\|Solflare/);
    assert.match(mobileSave, /pendingMobileBackupFiles\.push\(file\)/);
    assert.match(mobileSave, /Save \/ share file/);
    assert.match(mobileSave, /navigator\.share\(\{title:"Save SlimeWire wallet backup",files:\[file\]\}\)/);
    assert.ok(
      mobileSave.indexOf("if(mobileBackupSaveRequired())") < mobileSave.indexOf("URL.createObjectURL(b)"),
      "Phantom must be diverted before the root terminal creates a blob URL"
    );
  }
});

test("wallet creation automatically sends both backup formats with outside-wallet load guidance", () => {
  const createWallet = js.slice(js.indexOf("async function createWallet()"), js.indexOf("function walletPositionAssets"));
  const ensureDesktopAccount = terminalApp.slice(terminalApp.indexOf("async function ensureWebAccount"), terminalApp.indexOf("async function createWebAccount"));
  assert.match(createWallet, /downloads\.encryptedBackup, downloads\.recoveryKeys, downloads\.evmRecoveryKeys/);
  assert.match(createWallet, /Solana and Robinhood\/EVM backups downloaded/);
  assert.match(terminalApp, /Solflare \/ Phantom Backup/);
  assert.match(terminalApp, /No username or named profile is required/);
  assert.match(terminalApp, /Open Phantom to load/);
  assert.match(terminalApp, /Open Solflare to load/);
  assert.match(ensureDesktopAccount, /if \(state\.token\)[\s\S]{0,500}api\("\/api\/web\/me"/);
  assert.ok(ensureDesktopAccount.indexOf('api("/api/web/me"') < ensureDesktopAccount.indexOf('api("/api/web/signup"'), "an existing anonymous wallet session must be recovered before creating another account");
  assert.match(server, /LOAD IN PHANTOM/);
  assert.match(server, /Import Private Key and select Solana/);
  assert.match(server, /LOAD IN SOLFLARE/);
  assert.match(server, /Base58 secret key/);
  assert.match(server, /derivedPublicKey !== wallet\.publicKey/);
  assert.match(server, /Recovery key verification failed/);
  assert.match(server, /autoSendRecoveryKeyFile: parseBoolean\(process\.env\.AUTO_SEND_RECOVERY_KEY_FILE \|\| "true"\)/);
});

test("web wallet exports exclude ghost wallets, retain funded sessions, and validate active key plus stable index", () => {
  const route = server.slice(
    server.indexOf('pathname === "/api/web/wallets/export"'),
    server.indexOf('pathname === "/api/web/wallets/import"')
  );
  assert.match(route, /const body = await readJsonRequestBody\(request\)/);
  assert.match(route, /exportWebWalletBackup\(auth\.userId, body\)/);

  const eligibleSource = server.slice(
    server.indexOf("function webBackupEligibleWallet"),
    server.indexOf("async function exportWebWalletBackup")
  );
  const eligible = Function(`${eligibleSource}; return webBackupEligibleWallet;`)();
  assert.equal(eligible({ publicKey: "managed" }), true);
  assert.equal(eligible({ publicKey: "volume", volumeBot: true }), false);
  assert.equal(eligible({ publicKey: "ephemeral", ephemeral: true }), false);
  assert.equal(eligible({ publicKey: "pending-session", sessionWallet: true, sessionStatus: "pending-funding" }), false);
  assert.equal(eligible({ publicKey: "funded-session", sessionWallet: true, sessionStatus: "funded" }), true);
  assert.equal(eligible({ publicKey: "selected-session", sessionWallet: true }, { exactSelection: true }), true);

  const exportSource = server.slice(
    server.indexOf("async function exportWebWalletBackup"),
    server.indexOf("async function importWebWallet")
  );
  assert.match(exportSource, /const eligible = owned\.filter\(\(wallet\) => webBackupEligibleWallet\(wallet\)\)/);
  assert.match(exportSource, /body\.publicKey \|\| body\.walletPublicKey/);
  assert.match(exportSource, /const byIndex = requestedIndex \? owned\[requestedIndex - 1\] : null/);
  assert.match(exportSource, /byPublicKey\?\.publicKey !== byIndex\?\.publicKey/);
  assert.match(exportSource, /!webBackupEligibleWallet\(requestedWallet, \{ exactSelection: true \}\)/);
  assert.ok(
    exportSource.indexOf("const wallets = requestedWallet ? [requestedWallet] : eligible")
      < exportSource.indexOf("webBackupDownloadsForWallets"),
    "both encrypted and recovery documents must receive only the selected/eligible wallet list"
  );
  assert.match(exportSource, /scope: singleWallet \? "active-wallet" : "all-managed"/);

  const encryptedBackupSource = server.slice(
    server.indexOf("function buildWalletBackupDocument"),
    server.indexOf("function walletBackupFilename")
  );
  assert.match(encryptedBackupSource, /wallet\.sessionWallet \? \{/);
  for (const field of ["sessionWallet", "sessionStatus", "sourceConnectedWallet", "sessionExpiresAt", "sessionBudgetLamports"]) {
    assert.match(encryptedBackupSource, new RegExp(`${field}:`));
  }
  const restoreSource = server.slice(
    server.indexOf("function backupSessionWalletMetadata"),
    server.indexOf("function encryptedSecretFromBackup")
  );
  assert.match(restoreSource, /\.\.\.backupSessionWalletMetadata\(wallet\)/);
});

test("/fun paints real token quantities and asynchronously replaces pending SOL values", () => {
  const numberSource = js.slice(js.indexOf("function positionNumber"), js.indexOf("function positionQuantity"));
  const positionNumber = Function(`${numberSource}; return positionNumber;`)();
  assert.equal(positionNumber("1,234,567"), 1_234_567);
  assert.equal(positionNumber("NaN"), null);
  assert.equal(positionNumber(Infinity), null);

  const quantitySource = js.slice(js.indexOf("function positionNumber"), js.indexOf("function positionEstimatedSol"));
  const positionQuantity = Function(`${quantitySource}; return positionQuantity;`)();
  assert.equal(positionQuantity({ uiAmountNum: 1_234_567, uiAmount: "NaN" }), 1_234_567);
  assert.equal(positionQuantity({ uiAmount: "1,234,567" }), 1_234_567);
  assert.equal(positionQuantity({ uiAmountNum: 0, uiAmount: "NaN" }), null);

  const valueSource = js.slice(js.indexOf("function positionEstimatedSol"), js.indexOf("function positionOpenPnl"));
  const positionEstimatedSol = Function(`"use strict"; ${numberSource}; ${valueSource}; return positionEstimatedSol;`)();
  assert.equal(positionEstimatedSol({ estimatedValueSol: "0" }), 0, "a known zero value is not an unavailable quote");
  assert.equal(positionEstimatedSol({ estimatedValueSol: null }), null);

  const loads = js.slice(js.indexOf("function paintPositionSurfaces"), js.indexOf("function currentPosition"));
  assert.match(loads, /loadPortfolioSnapshot\(\{ force: Boolean\(options\.force\) \}\)/);
  assert.match(loads, /request\(`\/api\/web\/positions\$\{force \? "\?force=true"/);
  assert.match(loads, /state\.positionValuePromise/);
  assert.match(loads, /state\.positionValueForceRequested = true/);
  assert.match(loads, /const force = requestedForce \|\| state\.positionValueForceRequested/);
  assert.match(loads, /version !== state\.positionLoadVersion \|\| state\.positionValueForceRequested/);
  assert.match(loads, /version !== state\.positionLoadVersion/);
  assert.match(loads, /result\.data\.stale \|\| result\.data\.backgroundRefreshing/);
  assert.match(loads, /loadValuedPositions\(version, \{ force: true \}\)/);
  assert.match(loads, /renderWalletPositions\(\)/);
  assert.match(loads, /renderPositionCard\(\)/);

  const card = js.slice(js.indexOf("function renderPositionCard"), js.indexOf("function renderDetailPanel"));
  const portfolio = js.slice(js.indexOf("function renderWalletPositions"), js.indexOf("async function loadWalletActivity"));
  assert.doesNotMatch(card + portfolio, /Number\(position\.(?:uiAmount|estimatedValueSol|openPnlSol)/);
  assert.match(js, /position\?\.valuePending \? pendingText : "Value unavailable"/);
  assert.match(js, /pendingText = "Value updating…"/);
  assert.match(portfolio, /"Pricing…"/);
  assert.match(js, /position\?\.source !== "connected-wallet" && positionQuantity\(position\) != null/);
  assert.match(js, /loadPortfolioSnapshot\(\{ force: true \}\)/);
});

test("/fun reuses authenticated money APIs with idempotency and lazy user actions", () => {
  assert.match(js, /const TOKEN_KEY = "ogreWebToken"/);
  assert.match(js, /headers\.Authorization = `Bearer \$\{state\.token\}`/);
  assert.match(js, /tradeAttemptId: attemptId\("fun-rh"\)/);
  assert.match(js, /tradeAttemptId: attemptId\("fun-sol"\)/);
  assert.match(js, /data-submit-trade/);
  assert.match(js, /async function submitTrade/);
  assert.match(js, /\/api\/web\/positions\/arm-exits/);
  assert.match(js, /\/api\/web\/rh\/guards/);
  assert.match(js, /Sale proceeds return to this SOL wallet automatically/);
  assert.doesNotMatch(js, /data-rh-cashout/);
  assert.match(js, /else if \(!state\.confirmedUserId\) await loadMe\(\)/);
  assert.match(js, /if \(state\.token\) Promise\.all\(\[[\s\S]{0,180}loadWalletBalancePreview\(\)[\s\S]{0,180}loadPresets\(\)/);
  assert.doesNotMatch(js, /const accountReady = await ensureAccount\(\)/);
});

test("Fun makes Pump creator fees visible and manually claimable", () => {
  assert.match(js, /PUMP CREATOR FEES/);
  assert.match(js, /creatorFeePendingVolumeSol/);
  assert.match(js, /data-claim-creator-fees/);
  assert.match(js, /async function claimFunCreatorFees/);
  assert.match(js, /\/api\/web\/launch\/claim-fees/);
  assert.match(css, /\.created-coin-wrap/);
  assert.match(server, /creatorFeeStatus:/);
  assert.match(server, /creatorFeeClaimedSol:/);
  assert.match(server, /creatorFeeClaimMode:/);
  assert.match(js, /data-pump-wallet-backup/);
  assert.match(js, /Pump wallet backup/);
});

test("unified search and Robinhood detail support the two-chain mobile experience", () => {
  assert.ok(server.indexOf('pathname === "/api/web/token-search"') < server.indexOf("const auth = await authenticateWebRequest(request)"));
  assert.match(server, /pathname === "\/api\/web\/rh\/token"/);
  assert.match(server, /gatherRhScan\(address\)/);
  assert.match(server, /\["solana", "robinhood"\]\.includes/);
  assert.match(server, /chain: "robinhood"/);
  assert.match(js, /\/api\/web\/token-search\?q=/);
  assert.match(js, /\/api\/web\/rh\/token\?address=/);
  assert.match(js, /\/api\/web\/token-read\?mint=/);
  assert.match(js, /const RECENTS_KEY = "slimewireFunRecents"/);
  assert.match(js, /async function refreshRecentSearches\(\)/);
  assert.match(js, /await enrichSearchMatches\(rows\)/);
  assert.match(js, /saveLocal\(RECENTS_KEY, state\.recents\)/);
  assert.match(js, /renderSearchHome\(false\)/);
  assert.match(js, /marketCapLabel: coin\.marketCapLabel/);
  assert.match(js, /class="recent-list"/);
  assert.match(css, /\.recent-list>button\{display:grid/);
  assert.match(server, /rhListTokens\(1\)[\s\S]{0,160}rhRecentActiveTokens\(options\.fresh \? 2 : 1\)/);
});

test("coin art stays metadata-first while wallet identities use slime PFPs", () => {
  assert.match(js, /\/pfp\/mapfaces\//);
  assert.match(js, /coin\?\.metadata\?\.image/);
  assert.match(js, /row\.imageUri \|\| row\.logoUrl \|\| row\.meta\?\.imageUrl \|\| row\.metadata\?\.image/);
  assert.match(js, /token-mascots\/token-mascot-/);
  assert.match(js, /function coinBadge/);
  assert.match(js, /data-coin-symbol/);
  assert.match(html, /assets\/slimewire\/png\/slimewire-mark-64\.png/);
  assert.doesNotMatch(js, /pfp\/characters/);
  assert.match(js, /hydrateSelectedFromFeed\(\)/);
  assert.match(js, /request\(`\/api\/web\/token-search\?q=\$\{encodeURIComponent\(targetKey\)\}`\)/);
  assert.match(server, /token-pairs\/v1\/robinhood/);
  assert.match(server, /const meta = await getDexTokenMetadata\(mint/);
  assert.match(server, /enrichRhFeedArtwork/);
  assert.match(server, /RH_NOXA_PUBLIC_API/);
  assert.match(server, /rhNoxaArtworkMap/);
  assert.match(server, /rhBankrArtworkMap/);
  assert.match(server, /getRhOnchainLaunchMetadata/);
  assert.match(server, /rhTokenContractUri/);
  assert.match(rhChain, /export async function rhTokenContractUri[\s\S]{0,500}contract\.contractURI\(\)/);
  assert.match(server, /ready \? "public, max-age=86400, stale-while-revalidate=604800" : "no-store, max-age=0"/);
  assert.match(server, /function sendWebTokenImageUnavailable[\s\S]{0,260}"Cache-Control": "no-store, max-age=0"/);
  assert.match(server, /row\?\.address && !row\.imageUrl/);
  assert.match(server, /const artworkPromise = enrichRhFeedArtwork\(rows\)/);
  assert.match(server, /await artworkPromise/);
  assert.match(server, /token-pairs\/v1\/robinhood/);
  assert.match(js, /\/api\/web\/token-image\?mint=/);
  assert.match(js, /\/api\/web\/token-avatar\?mint=/);
  assert.match(js, /resolvedCoinImageFromMetadata/);
  assert.match(js, /resolvedCoinImages: new Map/);
  assert.match(js, /coinImageRetryTimers: new Map/);
  assert.match(js, /coinImageRetryAttempts: new Map/);
  assert.match(js, /state\.resolvedCoinImages\.set/);
  assert.match(js, /function probeCoinImage\(url\)/);
  assert.match(js, /async function workingCoinImage\(image\)/);
  assert.match(js, /function scheduleCoinImageRetry\(image\)/);
  assert.match(js, /\[8_000, 15_000, 30_000, 60_000\]/);
  assert.match(js, /const probe = new Image\(\)/);
  assert.match(js, /probe\.onload = \(\) =>/);
  assert.doesNotMatch(js, /if \(proxy && !current\.startsWith\(proxy\)\) \{ image\.src = proxy/);
  assert.doesNotMatch(js, /removeAttribute\("data-token-image"\)/);
  assert.match(js, /background-image:url\('\$\{coinBadge\(coin\)\}'\)/);
  assert.match(js, /return mascot\(coinKey\(coin\)/);
  assert.match(css, /\.coin-avatar,\.coin-identity img\{background-position:center/);
  assert.match(js, /gateway\\\.pinata/);
  assert.doesNotMatch(js, /retries < 3/);
  assert.match(server, /fetchLogoBuffer\(avatar\.avatarUrl, 96, 2_600\)/);
  assert.match(server, /fetchRawTokenImageBuffer\(avatar\.avatarUrl, 2_400\)/);
  assert.match(server, /raw\.buffer\.length <= 128 \* 1024/);
  assert.match(server, /tokenImageFetchInFlight\.size < 12/);
  assert.match(server, /TOKEN_IMAGE_RESPONSE_CACHE_MAX = 160/);
  assert.match(server, /TOKEN_AVATAR_FAIL_TTL_MS = 60 \* 1000/);
  assert.match(server, /cached\.imageUrl \? 30 \* 24 \* 60 \* 60_000 : 60_000/);
  assert.match(server, /rhScanIdentityMapLoad\(\)/);
  assert.match(server, /scheduleTokenAvatarLookup\(row\.address, row\)/);
  assert.match(server, /!row\.imageUrl && row\.iconUrl/);
  // Regression: visible RH rows resolve exact-address metadata client-side while the server proxy
  // prioritizes the same request and waits long enough for contractURI/IPFS artwork.
  assert.match(js, /api\.geckoterminal\.com\/api\/v2\/networks\/robinhood\/tokens\/\$\{encodeURIComponent\(key\)\}\/info/);
  assert.match(js, /String\(metadata\.address \|\| ""\)\.toLowerCase\(\) !== key/);
  assert.match(js, /state\.rhCoinImageMisses/);
  assert.match(js, /rememberCoinImage\(key, working\)/);
  assert.match(server, /TOKEN_AVATAR_PRIORITY_CONCURRENCY = 8/);
  assert.match(server, /waitForTokenAvatarRecord\(mint, avatar, 5_500\)/);
  assert.match(server, /getRhOnchainLaunchMetadata\(address\)[\s\S]{0,260}robinhood-contract-metadata/);
  assert.match(server, /getRhOpenSeaArtwork\(address, 3_200\)/);
  assert.match(server, /exactPrefix = `https:\/\/i2c\.seadn\.io\/robinhood\/\$\{key\}\//);
  assert.match(server, /while \(bytes < 320_000\)/);
  assert.match(server, /String\(row\?\.baseToken\?\.address \|\| ""\)\.toLowerCase\(\) === key/);
  assert.match(js, /const detailTask = request\(path\)\.then/);
  assert.match(js, /const searchTask = request\(`\/api\/web\/token-search/);
  assert.match(js, /const dexTask = funDexBatch\(\[targetKey\], chain\)/);
  assert.match(js, /await Promise\.allSettled\(\[searchTask, detailTask, dexTask, multiWalletTask\]\)/);
});

test("coin details omit the redundant risk strip while safety remains available in Tools", () => {
  assert.doesNotMatch(html, /data-slime-radar/);
  assert.doesNotMatch(js, /function renderSlimeRadar\(/);
  assert.doesNotMatch(js, />Risk read</);
  assert.match(js, /data-link-tool="safety"/);
  assert.match(js, /SlimeShield safety/);
});

test("coin search paints cached matches immediately, preserves the newest query, and shows complete market data", () => {
  assert.match(js, /searchRequestVersion: 0/);
  assert.match(js, /const matches = localSearchMatches\(trimmed\);\s*renderSearchMatches\(content, matches, trimmed, true\)/);
  assert.match(js, /version === state\.searchRequestVersion/);
  assert.match(js, /Promise\.allSettled\(tasks\)/);
  assert.match(js, /\[\.\.\.state\.rows, \.\.\.state\.searchRows\]\.find/);
  assert.match(js, /state\.searchRows = rows/);
  assert.match(js, /positiveMarketNumber\(row\.marketCapUsd, row\.marketCap, row\.mc, row\.fdv\)/);
  assert.match(js, /positiveMarketNumber\(row\.volume24hUsd, row\.volumeH24, row\.volumeUsd/);
  assert.match(js, />24h \$\{escapeHtml\(volume\)\}/);
  assert.match(js, />Liq \$\{escapeHtml\(formatUsd\(coin\.liquidity\)\)\}/);
  assert.match(js, /class="coin-ca-button"[^>]+data-copy-coin/);
  assert.match(css, /\.coin-ca-button\{/);
});

test("mobile coin details expose a large reliable contract copy and paste/search action", () => {
  assert.match(html, /class="coin-contract-bar" data-coin-contract/);
  assert.match(js, /class="coin-contract-copy"[^>]+data-copy-coin/);
  assert.match(js, />Copy CA<\/b>/);
  assert.match(js, /class="coin-contract-search"[^>]+data-open-search>Paste \/ search/);
  assert.match(js, /await writeClipboardText\(coinKey\(state\.selected\)\)/);
  assert.match(css, /\.coin-contract-copy,\.coin-contract-search\{min-height:45px/);
});

test("coin setup exposes fast buys, ladder exits, one-wallet RH trades, and the full volume engine", () => {
  assert.match(html, /data-quick-trade/);
  assert.match(html, /data-detail="setup">Trade setup/);
  assert.match(js, /data-trade-strategy="ladder"/);
  assert.match(js, /data-ladder-preset="smart"/);
  assert.match(js, /payCurrency = "SOL"/);
  assert.match(js, /Sale proceeds return to this SOL wallet automatically/);
  assert.match(js, /amounts = \["0\.1", "0\.5", "1"\]/);
  assert.match(js, /async function executeFunQuickBuy/);
  assert.match(js, /data-quick-custom-amount/);
  assert.match(js, /slippageBps: preset\?\.slippageBps \|\| "400"/);
  assert.match(js, /data-manage-presets/);
  assert.match(js, /\/api\/web\/presets/);
  assert.match(js, /action === "volume"[\s\S]{0,80}openVolumeSheet/);
  assert.match(js, /\/api\/web\/volume-bot\/start/);
  assert.match(js, /\/api\/web\/volume-bot\/stop/);
  assert.match(js, /\/api\/web\/wallets\/sweep-background/);
  assert.match(js, /sweep-background", \{ preserveOneToken: true \}, \{ timeout: 180_000, noRetry: true \}/);
  assert.match(js, /setTimeout\(\(\) => sweepFunVolume\(attempt \+ 1\), 5_000\)/);
  assert.match(js, /\/api\/web\/rh\/volume\/start/);
  assert.match(js, /payCurrency: "SOL", fundSolPerWallet/);
  assert.doesNotMatch(js, /Min ETH trade|Max ETH trade/);
});

test("balanced pro chart keeps core stats visible and adds working chart/transaction controls", () => {
  for (const marker of ['data-chart-interval="1"', 'data-chart-interval="5"', 'data-chart-interval="15"', 'data-chart-interval="60"', 'data-chart-mode="chart"', 'data-chart-mode="transactions"']) assert.match(html, new RegExp(marker));
  assert.match(css, /\.chart-card\{height:418px/);
  assert.match(css, /grid-template-columns:repeat\(4,1fr\)/);
  for (const label of ["Market cap", "Liquidity", "Holders", "Volume"]) assert.match(js, new RegExp(`>${label}<`));
  assert.match(js, /trades=\$\{trades\}/);
  assert.match(js, /interval=\$\{state\.chartInterval\}/);
  assert.match(js, /frame\.dataset\.src === src/);
  assert.match(js, /const hasPair = Boolean\(pairAddress/);
  assert.match(js, /\/chart-lab\?ca=\$\{encodeURIComponent\(key\)\}/);
  assert.match(js, /pairAddress: String\(p\.pairAddress \|\| ""\)/);
});

test("/fun indicator paint uses real OHLC candles for Fibonacci, RSI, MACD, and harmonics", () => {
  for (const marker of ['data-indicators-toggle', 'data-indicator-kind="fib"', 'data-indicator-kind="rsi"', 'data-indicator-kind="macd"', 'data-indicator-kind="harmonics"', 'data-indicator-panels']) assert.match(html, new RegExp(marker));
  assert.match(html, /aria-controls="slimeIndicatorDrawer"/);
  assert.match(html, /data-indicator-status role="status" aria-live="polite"/);
  assert.doesNotMatch(html, /vendor\/lightweight-charts\.standalone\.production\.js/);
  assert.doesNotMatch(html, /fun-indicators\.js\?v=7/);
  assert.match(js, /loadFunScript\("\/vendor\/lightweight-charts\.standalone\.production\.js"\)/);
  assert.match(js, /loadFunScript\("\/fun-indicators\.js\?v=7"\)/);
  assert.doesNotMatch(funWorker, /fun-indicators\.js\?v=7/);
  assert.match(funWorker, /fun\.css\?v=66/);
  assert.match(indicators, /new URLSearchParams\(\{ ca: key, tf: timeframe \}\)/);
  assert.match(indicators, /`\$\{API_BASE\}\/api\/chart\?\$\{query\.toString\(\)\}`/);
  assert.match(indicators, /api\.geckoterminal\.com\/api\/v2\/networks\/\$\{network\}\/pools/);
  assert.match(indicators, /function fibonacciPanel/);
  assert.match(indicators, /function rsiSeries\(values, period = 14\)/);
  assert.match(indicators, /function macdSeries/);
  assert.match(indicators, /function mountNativeAnalysis/);
  assert.match(indicators, /addCandlestickSeries/);
  assert.match(indicators, /createPriceLine/);
  assert.match(html, /data-fib-settings hidden/);
  assert.match(indicators, /slimewireFunFibSettings:v1/);
  assert.match(indicators, /data-fib-lookback/);
  assert.match(indicators, /data-fib-field="color"/);
  assert.match(indicators, /data-fib-field="style"/);
  assert.match(indicators, /data-fib-add/);
  assert.match(indicators, /data-fib-reset/);
  assert.match(indicators, /fibSettings\.levels\.filter/);
  assert.match(indicators, /data-analysis-price/);
  assert.match(indicators, /emaSeries\(values, 12\)/);
  assert.match(indicators, /emaSeries\(values, 26\)/);
  assert.match(indicators, /emaSeries\(macd\.slice\(first\), 9\)/);
  assert.doesNotMatch(indicators, /Robinhood candle history is not connected/);
  assert.match(indicators, /function isRobinhood/);
  assert.match(indicators, /new URLSearchParams\(location\.search\)\.get\("ca"\)/);
  assert.doesNotMatch(indicators, /Math\.random/);
  assert.doesNotMatch(indicators, /completed candles/i);
  assert.match(indicators, /AUTO_REFRESH_MS = 25_000/);
  assert.match(indicators, /CANDLE_TIMEOUT_MS = 9_000/);
  assert.match(indicators, /pendingCandleRequests/);
  assert.match(indicators, /new AbortController\(\)/);
  assert.match(indicators, /function resolveBrowserGeckoPool/);
  assert.match(indicators, /reserve_in_usd/);
  assert.match(indicators, /volume_usd\?\.h24/);
  assert.match(indicators, /source: "geckoterminal browser", stale: false/);
  assert.match(indicators, /cached fallback/);
  assert.match(indicators, /key !== selectedKey\(\) \|\| timeframe !== activeTimeframe\(\)/);
  assert.match(indicators, /data-chart-mode="transactions"/);
  assert.match(indicators, /coinView\?\.classList\.contains\("active"\)/);
  assert.match(indicators, /let analysisActive = false/);
  assert.match(indicators, /data-analysis-back/);
  assert.match(indicators, /data-fib-settings-open/);
  assert.match(html, /data-harmonic-settings hidden/);
  assert.match(indicators, /slimewireFunHarmonics:v1/);
  assert.match(indicators, /\["bat", "gartley", "shark", "butterfly", "crab", "five0"\]/);
  assert.match(indicators, /function harmonicSwingPivots/);
  assert.match(indicators, /function harmonicCandidate/);
  assert.match(indicators, /function findHarmonicPatterns/);
  assert.match(indicators, /function paintHarmonicPattern/);
  assert.match(indicators, /addLineSeries/);
  assert.match(indicators, /setMarkers/);
  assert.match(indicators, /harmonicName\(match\.pattern\)\} PRZ/);
  assert.match(indicators, /data-harmonic-lookback/);
  assert.match(indicators, /data-harmonic-pivot/);
  assert.match(indicators, /data-harmonic-tolerance/);
  assert.match(indicators, /analysisActive && enabled\[button\.dataset\.indicatorKind\]/);
  assert.match(indicators, /function activateAnalysis[\s\S]{0,160}analysisActive = true/);
  assert.match(indicators, /function restoreProviderChart[\s\S]{0,260}providerMarkup\.get/);
  assert.match(indicators, /if \(!analysisActive\) \{ clearTimeout\(autoRefreshTimer\); return; \}/);
  assert.doesNotMatch(indicators, /if \(anyEnabled\(\)\) scheduleRender\(0\);/);
  assert.match(js, /setMode\(mode\)/);
  assert.match(css, /\.indicator-drawer/);
  assert.match(css, /\.chart-card\.indicators-open\{height:auto\}/);
  assert.match(css, /\.indicator-button\{min-height:36px/);
  assert.match(css, /\.indicator-picker button\{min-height:36px/);
  assert.match(css, /\.fib-settings\{/);
  assert.match(css, /\.harmonic-settings\{/);
  assert.match(css, /\.harmonic-chart-badge/);
});

test("/fun RSI, MACD, and Fibonacci calculations match known fixtures", () => {
  const functionSource = (name, nextName) => {
    const start = indicators.indexOf(`  function ${name}`);
    const end = indicators.indexOf(`\n  function ${nextName}`, start);
    assert.notEqual(start, -1, `${name} source missing`);
    assert.notEqual(end, -1, `${nextName} boundary missing`);
    return indicators.slice(start, end);
  };

  const rsiSource = functionSource("rsiSeries", "rsiPanel");
  const rsiSeries = Function(`${rsiSource}\nreturn rsiSeries;`)();
  const flatRsi = rsiSeries(Array(20).fill(10));
  const risingRsi = rsiSeries(Array.from({ length: 20 }, (_, index) => index + 1));
  assert.equal(flatRsi.at(-1), 50);
  assert.equal(risingRsi.at(-1), 100);

  const macdSource = functionSource("emaSeries", "macdPanel");
  const macdSeries = Function(`${macdSource}\nreturn macdSeries;`)();
  const macd = macdSeries(Array.from({ length: 40 }, (_, index) => index + 1));
  assert.equal(macd.signal.findIndex(Number.isFinite), 33);
  assert.ok(Math.abs(macd.macd[33] - 7) < 1e-10);
  assert.ok(Math.abs(macd.histogram[33]) < 1e-10);

  const fibSource = functionSource("fibonacciPanel", "rsiSeries");
  const fibonacciPanel = Function("emptyPanel", "linePanel", "fmtPrice", "pointsPath", `${fibSource}\nreturn fibonacciPanel;`)(
    (title, message) => ({ title, message }),
    (title, subtitle, valueLabel) => ({ title, subtitle, valueLabel }),
    (value) => Number(value).toFixed(2),
    () => ""
  );
  const upswing = fibonacciPanel([{ h: 12, l: 10, c: 11 }, { h: 15, l: 11, c: 14 }, { h: 20, l: 12, c: 19 }]);
  const downswing = fibonacciPanel([{ h: 20, l: 15, c: 18 }, { h: 18, l: 12, c: 13 }, { h: 17, l: 10, c: 11 }]);
  assert.match(upswing.subtitle, /Recent 3-candle upswing/);
  assert.equal(upswing.valueLabel, "61.8% 13.82");
  assert.match(downswing.subtitle, /Recent 3-candle downswing/);
  assert.equal(downswing.valueLabel, "61.8% 16.18");
});

test("/fun harmonic ratios recognize Carney-style Bat, Gartley, Butterfly, Crab, Shark, and 5-0 fixtures", () => {
  const scoreStart = indicators.indexOf("  function harmonicRatioScore");
  const candidateEnd = indicators.indexOf("\n  function findHarmonicPatterns", scoreStart);
  assert.notEqual(scoreStart, -1);
  assert.notEqual(candidateEnd, -1);
  const candidateSource = indicators.slice(scoreStart, candidateEnd);
  const harmonicCandidate = Function(`${candidateSource}\nreturn harmonicCandidate;`)();
  const points = (prices) => prices.map((price, index) => ({ price, kind: index % 2 ? "high" : "low", index, time: index + 1 }));
  const fixtures = {
    bat: [100, 200, 150, 180, 111.4],
    gartley: [100, 200, 138.2, 183, 121.4],
    butterfly: [100, 200, 121.4, 170, 73],
    crab: [100, 200, 150, 190, 38.2],
    five0: [100, 200, 50, 320, 185],
    shark: [100, 200, 50, 320, 298]
  };
  for (const [pattern, prices] of Object.entries(fixtures)) {
    const match = harmonicCandidate(points(prices), pattern, 0.18);
    assert.ok(match, `${pattern} fixture should match`);
    assert.equal(match.pattern, pattern);
    assert.ok(match.confidence >= 58 && match.confidence <= 98);
  }
  assert.equal(harmonicCandidate(points(fixtures.bat), "gartley", 0.08), null, "Bat geometry must not be mislabeled as strict Gartley");
});

test("/fun live feeds reject stale responses and refresh only the visible view", () => {
  assert.match(js, /feedRequestVersion/);
  assert.match(js, /version !== state\.feedRequestVersion/);
  assert.match(js, /document\.hidden \|\| state\.view !== "home"/);
  assert.match(js, /document\.addEventListener\("visibilitychange"/);
  assert.match(js, /sortAndDedupeFeed/);
  assert.match(js, /hydrateMissingCoinArt/);
  assert.match(js, /const \[sol, rh\] = await Promise\.all\(\[solPromise, rhPromise\]\)/);
  assert.doesNotMatch(js, /state\.rows = sortAndDedupeFeed\(sol, selectedFeed\); renderCoinList\(\)/);
  assert.match(server, /chunks\.map\(\(chunk\) => fetchJson/);
  assert.match(server, /\.slice\(0, 50\)/);
  assert.match(server, /Never block the feed on dozens of explorer creation-time reads/);
  assert.match(js, /Number\(row\.marketCap\) >= 17_000 && Number\(row\.marketCap\) <= 40_000/);
  assert.match(js, /rh: "soon"/);
  assert.match(server, /cat === "soon"/);
  assert.doesNotMatch(server, /await Promise\.all\(slice\.map\(async \(r\) => \{ r\.createdAt = await rhTokenCreationTime/);
});

test("/fun has editable presets, tracked calls, and informational profile follows", () => {
  assert.match(server, /savedPresetId/);
  assert.match(server, /defaultIds\.has\(rawId\)[\s\S]{0,100}hiddenWebPresetIds/);
  assert.match(html, /data-detail="calls"/);
  assert.match(js, /\/api\/web\/calls/);
  assert.match(js, /\/api\/web\/profile\/public/);
  assert.match(js, /\/api\/web\/profile\/follow/);
  assert.match(server, /notifyProfileTradeFollowers\(insertedEvents\)/);
  assert.match(server, /Trade alert only — nothing was copied/);
});

test("/quick preloads social coins and keeps wallet setup inside the fast trade flow", () => {
  assert.match(server, /requestUrl\.pathname === "\/quick"[\s\S]{0,240}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  assert.match(redirects, /^\/quick\s+\/fun\.html\s+200$/m);
  assert.match(redirects, /^\/quick\/\*\s+\/fun\.html\s+200$/m);
  for (const marker of ["data-view=\"quick\"", "data-quick-paste-form", "data-quick-route-content", "data-quick-clipboard"]) assert.match(html, new RegExp(marker));
  assert.match(js, /IS_QUICK_ROUTE/);
  assert.match(js, /new URLSearchParams\(location\.search\)/);
  assert.match(js, /\/quick\?ca=\$\{encodeURIComponent\(targetKey\)\}/);
  assert.match(js, /data-quick-select-amount/);
  assert.match(js, /data-quick-review/);
  assert.match(js, /data-quick-bundle/);
  assert.match(js, /data-quick-wallet-select/);
  assert.match(js, /data-quick-panel/);
  assert.match(js, /quick-inline-chart/);
  assert.match(js, /quick-bottom-dock/);
  assert.match(js, /Bundle Buy/);
  assert.match(css, /High-fidelity quick-buy states/);
  assert.doesNotMatch(js, /class="quick-secondary"><a href="\/fun#coin/);
  assert.match(js, /Connect &amp; fund/);
  assert.match(js, /Your coin stays selected/);
});

test("wallet manager can create, restore, export, select, and safely remove wallets", () => {
  for (const path of ["/api/web/wallets/create", "/api/web/wallets/restore", "/api/web/wallets/import", "/api/web/wallets/export", "/api/web/wallets/remove", "/api/web/wallets/rename"]) assert.match(js, new RegExp(path.replaceAll("/", "\\/")));
  for (const marker of ["data-manage-wallets", "data-wallet-backup-file", "data-select-wallet", "data-remove-wallet", "data-rename-wallet"]) assert.match(html + js, new RegExp(marker));
});

test("Wallet, Go, and Cash expose the same multi-wallet trade flow", () => {
  const cash = fs.readFileSync(new URL("../web/public/cash/cash.js", import.meta.url), "utf8");
  const cashHtml = fs.readFileSync(new URL("../web/public/cash/index.html", import.meta.url), "utf8");
  assert.match(html, /class="wallet-multi-strip"[^>]+data-multi-wallet-entry/);
  assert.match(js, /async function openMultiWalletEntry\(\)/);
  assert.match(js, /openSearch\(\{ multiWallet: true \}\)/);
  assert.match(js, /multiWallet: selectingMultiWallet/);
  assert.match(js, /class="wallet-asset-multi"[^>]+data-multi-wallet-entry/);
  assert.match(html, /Bundle \/ multi-wallet/);
  assert.match(cashHtml, /id="cashWalletMultiTradeBtn"[^>]*>Bundle \/ multi-wallet</);
  assert.match(cash, /cashWalletMultiTradeBtn[^\n]+openCashMultiTrade/);
});

test("SlimeWallet surfaces launch copying beside bundle tools without adding another tab", () => {
  assert.match(html, /class="wallet-multi-strip wallet-copy-launch-strip"[^>]+data-copy-launches-entry/);
  assert.match(html, /Copy coin launches/);
  assert.match(html, /Auto-buy only new coins launched by a wallet/);
  assert.match(js, /data-copy-launches-entry[\s\S]*openFunTool\("walletLaunch"\)/);
  assert.match(js, /walletLaunch: \{ route: "walletLaunch", title: "Copy coin launches"/);
});

test("mobile wallet addresses are visible and tap-to-copy from the hero, manager, positions, and Receive", () => {
  assert.match(js, /class="wallet-hero-address"[^>]+data-copy-wallet-address/);
  assert.match(js, /Tap to copy full address/);
  assert.match(js, /class="wallet-manager-address"[^>]+data-copy-wallet-address/);
  assert.match(js, /class="fun-wallet-group-address"[^>]+data-copy-wallet-address/);
  assert.match(js, /class="wallet-full-address"[^>]+data-copy-wallet-address/);
  assert.match(js, /<code>\$\{escapeHtml\(wallet\.publicKey\)\}<\/code>/);
  assert.match(js, /async function copyWalletAddress\(address\)/);
  assert.match(js, /event\.target\.closest\("\[data-copy-wallet-address\]"\)/);
  assert.match(js, /document\.execCommand\?\.\("copy"\)/);
  for (const marker of ["wallet-hero-address", "wallet-manager-address", "wallet-full-address"]) assert.match(css, new RegExp(marker));
});

test("wallet manager batch-funds exact allocations and can sell or consolidate selected wallets", () => {
  const cash = fs.readFileSync(new URL("../web/public/cash/cash.js", import.meta.url), "utf8");
  const cashHtml = fs.readFileSync(new URL("../web/public/cash/index.html", import.meta.url), "utf8");
  for (const path of ["/api/web/wallets/send-sol", "/api/web/wallets/sell-all-tokens", "/api/web/wallets/sweep-sol", "/api/web/wallets/return-to-connected"]) {
    assert.match(js, new RegExp(path.replaceAll("/", "\\/")));
  }
  for (const marker of ["data-wallet-batch-select", "data-wallet-fund-mode", "data-wallet-fund-amount", "data-review-wallet-fund", "data-review-wallet-action", "data-confirm-wallet-manager-action"]) {
    assert.match(js, new RegExp(marker));
  }
  assert.match(js, /count:\s*1/);
  assert.match(js, /allocations:\s*pending\.allocations\.map/);
  assert.match(server, /requestedAllocations = Array\.isArray\(body\.allocations\)/);
  assert.match(server, /Each destination wallet can appear only once/);
  assert.match(server, /The funding wallet changed after review/);
  assert.match(server, /totalSol:\s*lamportsToSol\(totalLamports\)/);
  assert.match(js, /data-wallet-consolidate-destination>[\s\S]*Outside wallet…/);
  assert.match(js, /data-wallet-consolidate-custom/);
  assert.match(js, /kind !== "sell" && !\/\^\[1-9A-HJ-NP-Za-km-z\]/);
  assert.match(cashHtml, /id="multiFundsSellBtn"[^>]*>Sell all tokens</);
  assert.match(cashHtml, /id="multiFundsSweepBtn"[^>]*>Sweep SOL</);
  assert.match(cashHtml, /id="multiFundsSellSweepBtn"[^>]*>Sell tokens \+ sweep</);
  assert.match(cash, /mode === "sell"/);
  assert.match(cash, /\/api\/web\/wallets\/sell-all-tokens/);
  assert.match(html, /data-wallet-consolidate-entry>[\s\S]*Sell all &amp; sweep/);
  assert.match(js, /data-wallet-consolidate-from-bundle/);
  assert.match(js, /openWalletManager\(\{ consolidate: true, selectedIndexes \}\)/);
  assert.match(js, /Sell all tokens \+ sweep SOL/);
});

test("wallet manager shows SOL, priced coin positions, and total value for every wallet", () => {
  assert.match(js, /function walletPositionHolding\(position = \{\}, wallet = \{\}\)/);
  assert.match(js, /function walletPositionAssets\(wallet = \{\}\)/);
  assert.match(js, /Array\.isArray\(position\.walletPositions\)/);
  assert.match(js, /totalValueSol \* share/);
  assert.match(js, /allocationPct:[\s\S]*asset\.valueSol \/ totalSol \* 100/);
  for (const marker of ["wallet-value-strip", "Coin positions", "No coin positions in this wallet", "SOL", "COINS", "TOTAL"]) {
    assert.match(js + css, new RegExp(marker));
  }
  assert.match(js, /await loadValuedPositions\(state\.positionLoadVersion\)/);
});

test("positions are grouped by wallet with scoped 25, 50, 75, 100, and custom sells on both chains", () => {
  for (const marker of ["walletRouteSolanaPositionGroup", "walletRouteRobinhoodGroups", "fun-wallet-position-group", "data-fun-position-sell", "data-fun-position-custom", "data-fun-custom-sell-percent", "CURRENT ALLOCATION", "BAG SHARE", "No token positions", "Send SOL"]) {
    assert.match(js + css, new RegExp(marker));
  }
  assert.match(js, /\[25, 50, 75, 100\]\.map/);
  assert.match(js, /data-fun-position-wallet-index=/);
  assert.match(js, /data-fun-position-chain="robinhood"/);
  assert.match(js, /walletPublicKeys: \[walletPublicKey\]/);
  assert.match(js, /request\("\/api\/web\/rh\/wallets"/);
  assert.match(js, /post\("\/api\/web\/rh\/bundle\/sell"/);
  assert.match(js, /Other wallets stay untouched/);
  assert.match(terminalApp, /function walletPositionGroups\(\)/);
  assert.match(terminalApp, /data-position-sell-wallet=/);
  assert.match(terminalApp, /walletPublicKeys: scopedWalletPublicKey \? \[scopedWalletPublicKey\] : \[\]/);
  assert.match(server, /walletPositions,/);
  assert.match(server, /walletPublicKey: holding\.walletPublicKey/);
});

test("wallet holdings can send Solana or Robinhood tokens and SOL from the exact selected wallet", () => {
  assert.match(server, /pathname === "\/api\/web\/wallets\/send-token"/);
  assert.match(server, /runIdempotentMoneyOp\(\s*"web-send-token"/);
  assert.match(server, /createTransferCheckedInstruction\(/);
  assert.match(server, /pathname === "\/api\/web\/rh\/send-token"/);
  assert.match(server, /runIdempotentMoneyOp\(\s*"web-rh-send-token"/);
  assert.match(rhChain, /export async function rhTransferErc20/);
  assert.match(js, /data-fun-send-token=/);
  assert.match(js, /data-fun-send-wallet-index=/);
  assert.match(js, /data-review-token-send/);
  assert.match(js, /\[25, 50, 75, 100\]\.map\(\(percent\) => `<button[^`]+data-set-send-token-percent/);
  assert.match(js, /data-send-sol-wallet-index=/);
  assert.match(js, /data-send-sol-wallet-public-key=/);
  assert.match(js, /sourcePublicKey: pending\.sourcePublicKey/);
  assert.match(js, /post\("\/api\/web\/cash\/send"/);
  assert.match(js, /data-send-sol-pin/);
  assert.match(js, /noRetry: true/);
  assert.match(server, /async function cashSendAllSolPlan[\s\S]{0,700}assertFrozenManagedWallet\([\s\S]{0,250}firstString\(body\.sourcePublicKey, body\.fromWalletPublicKey, body\.walletPublicKey\)/);
  assert.match(server, /async function webCashSendSolCore[\s\S]{0,700}assertFrozenManagedWallet\([\s\S]{0,250}firstString\(body\.sourcePublicKey, body\.fromWalletPublicKey, body\.walletPublicKey\)/);
  assert.match(server, /async function webCashSend[\s\S]{0,1000}enforceCashSpendSecurity\(userId, sendBody, existingStore\)/);
  assert.match(js, /loadFunRhPositions/);
  assert.match(terminalApp, /data-position-send-token=/);
  assert.match(terminalApp, /function tokenSendDialog/);
  assert.match(terminalApp, /walletPositionPnlPercent/);
  for (const source of [desktopHtml, desktopAliasHtml]) {
    assert.match(source, /function sendTokenModal/);
    assert.match(source, /function rhSendTokenModal/);
    assert.match(source, /pnlPercent/);
  }
});

test("wallet token details reuse the chart's exact live market snapshot", () => {
  assert.match(js, /function mergeLiveMarketSnapshot\(coin = \{\}, snapshot = \{\}\)/);
  assert.match(js, /function positiveMarketNumber\(\.\.\.values\)/);
  assert.match(js, /incomingPriority > existingPriority/);
  assert.match(js, /snapshot\.vol24, snapshot\.v24/);
  assert.match(js, /funDexBatch\(\[targetKey\], chain\)/);
  assert.match(js, /String\(p\.chainId \|\| ""\)\.toLowerCase\(\) !== expected/);
  assert.match(js, /marketSource: "browser-dex", marketPriority: 40/);
  assert.match(js, /cv=wallet76/);
  assert.match(js, /coinRequestVersion: 0/);
  assert.match(js, /requestVersion === state\.coinRequestVersion/);
  assert.match(js, /event\.data\?\.type !== "slimewire:chart-market"/);
  assert.match(js, /event\.source !== chartFrame\.contentWindow/);
  assert.match(js, /refreshWalletAssetMarketUi\(\);/);
  assert.match(js, /liveHoldingValueUsd \?\? reportedValueUsd/);
  assert.match(js, /data-wallet-market="marketCap"/);
  assert.match(chartLab, /function postParentMarket\(s\)/);
  assert.match(chartLab, /postParentMarket\(\{priceUsd:price,mc:mc,liq:liq,vol24:vol24/);
  assert.match(chartLab, /window\.parent\.postMessage\(\{type:'slimewire:chart-market',token:CA,market:market\},location\.origin\)/);
  assert.match(chartLab, /if\(!baseMatches\)\{if\(bars\.length<3\)loadGeckoFallback\(\);return \{symbol:/);
  assert.match(chartLab, /var version=\+\+chartLoadVersion,requestedTf=TF/);
  assert.match(chartLab, /version!==chartLoadVersion\|\|requestedTf!==TF/);
  assert.match(chartLab, /requestedTf===TF&&rows\.length\?applyChartData/);
  for (const route of ["/chart", "/chart-lab", "/chart-lab.html", "/chart-preview", "/chart-preview.html"]) {
    assert.match(publicHeaders, new RegExp(`^${route.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\n  Cache-Control: no-store, max-age=0, must-revalidate$`, "m"));
  }
  assert.match(server, /serveStaticHtmlPage\(response, "chart-lab\.html", "no-store, max-age=0"\)/);
});

test("wallet market merges ignore zeroes and respect live-source priority and timestamps", () => {
  const { mergeLiveMarketSnapshot } = walletMarketHelpers();
  const browser = {
    priceUsd: 1.25, marketCap: 100_000, liquidity: 25_000, volumeH24: 8_000,
    marketSource: "browser-dex", marketPriority: 40, marketUpdatedAt: 200
  };

  const zeroUpdate = mergeLiveMarketSnapshot(browser, {
    priceUsd: 0, mc: 0, liq: 0, v24: 0,
    marketSource: "chart-server", marketPriority: 20, marketUpdatedAt: 900
  });
  assert.equal(zeroUpdate.priceUsd, 1.25);
  assert.equal(zeroUpdate.marketCap, 100_000);
  assert.equal(zeroUpdate.liquidity, 25_000);
  assert.equal(zeroUpdate.volume, 8_000);
  assert.equal(zeroUpdate.marketUpdatedAt, 200, "zero payloads must not be stamped as fresh");

  const lowerPriority = mergeLiveMarketSnapshot(browser, {
    price: 9, marketCapUsd: 900_000, liquidityUsd: 90_000, vol24: 90_000,
    marketSource: "chart-server", marketPriority: 20, marketUpdatedAt: 900
  });
  assert.deepEqual(
    [lowerPriority.priceUsd, lowerPriority.mc, lowerPriority.liq, lowerPriority.v24],
    [1.25, 100_000, 25_000, 8_000]
  );
  assert.equal(lowerPriority.marketSource, "browser-dex");
  assert.equal(lowerPriority.marketPriority, 40);

  const aliasUpdate = mergeLiveMarketSnapshot(browser, {
    price: 1.5, marketCapUsd: 120_000, liquidityUsd: 30_000, v24: 12_000,
    marketSource: "browser-dex", marketPriority: 40, marketUpdatedAt: 300
  });
  assert.deepEqual(
    [aliasUpdate.priceUsd, aliasUpdate.price, aliasUpdate.marketCap, aliasUpdate.mc, aliasUpdate.liquidity, aliasUpdate.liq, aliasUpdate.volume, aliasUpdate.vol24, aliasUpdate.v24],
    [1.5, 1.5, 120_000, 120_000, 30_000, 30_000, 12_000, 12_000, 12_000]
  );
  assert.equal(aliasUpdate.marketUpdatedAt, 300);

  const olderPeer = mergeLiveMarketSnapshot(aliasUpdate, {
    priceUsd: 2, marketPriority: 40, marketUpdatedAt: 250
  });
  assert.equal(olderPeer.priceUsd, 1.5, "an older equal-priority response cannot win a race");

  const sparseBrowser = { priceUsd: 2, marketPriority: 40, marketUpdatedAt: 500, marketSource: "browser-dex" };
  const filled = mergeLiveMarketSnapshot(sparseBrowser, { mc: 50_000, v24: 2_500, marketPriority: 20, marketUpdatedAt: 600 });
  assert.equal(filled.priceUsd, 2);
  assert.equal(filled.marketCap, 50_000, "a lower-priority source may fill a missing card");
  assert.equal(filled.volume, 2_500);
  assert.equal(filled.marketPriority, 40);
  assert.equal(filled.marketUpdatedAt, 500);

  const untimed = mergeLiveMarketSnapshot({}, { priceUsd: 3, marketPriority: 20, marketUpdatedAt: 0 });
  assert.equal(untimed.marketUpdatedAt, 0, "an undated cached payload must not become fresh at merge time");
});

test("embedded wallet chart publishes all four live market cards to its parent", () => {
  const calls = [];
  const token = "0x1111111111111111111111111111111111111111";
  const { postParentMarket } = chartParentMarketBridgeWith((...args) => calls.push(args), token);

  postParentMarket({
    priceUsd: "0.000229",
    mc: "392000",
    liq: "85000",
    vol24: "12000",
    symbol: "DIH",
    name: "Dih",
    marketSource: "browser-dex",
    marketPriority: 40,
    marketUpdatedAt: 1_234
  });

  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], [{
    type: "slimewire:chart-market",
    token,
    market: {
      priceUsd: 0.000229,
      mc: 392_000,
      liq: 85_000,
      vol24: 12_000,
      symbol: "DIH",
      name: "Dih",
      marketSource: "browser-dex",
      marketPriority: 40,
      marketUpdatedAt: 1_234
    }
  }, "https://slimewire.test"]);

  postParentMarket({ priceUsd: 0, mc: 0, liq: 0, vol24: 0 });
  assert.equal(calls.length, 1, "an empty provider response must not blank the wallet cards");
});

test("wallet Dex enrichment only accepts target-as-base market values", async () => {
  const target = "0x1111111111111111111111111111111111111111";
  const other = "0x2222222222222222222222222222222222222222";
  const pairs = [
    {
      chainId: "robinhood", pairAddress: "0xquote", baseToken: { address: other, symbol: "OTHER" },
      quoteToken: { address: target, symbol: "TARGET" }, priceUsd: "999", marketCap: 999_000,
      liquidity: { usd: 999_000 }, volume: { h24: 999_000 }
    },
    {
      chainId: "ethereum", pairAddress: "0xwrongchain", baseToken: { address: target, symbol: "WRONG" },
      priceUsd: "88", marketCap: 88_000, liquidity: { usd: 88_000 }, volume: { h24: 88_000 }
    },
    {
      chainId: "robinhood", pairAddress: "0xbase", baseToken: { address: target, symbol: "RIGHT", name: "Right token" },
      quoteToken: { address: other, symbol: "OTHER" }, priceUsd: "2", marketCap: 20_000,
      liquidity: { usd: 4_000 }, volume: { h24: 3_000 }
    }
  ];
  const funDexBatch = walletDexBatchWith(async () => ({ ok: true, json: async () => ({ pairs }) }));
  const result = await funDexBatch([target], "robinhood");
  assert.equal(result[target].priceUsd, 2);
  assert.equal(result[target].mc, 20_000);
  assert.equal(result[target].symbol, "RIGHT");
  assert.equal(result[target].marketPriority, 40);
  assert.equal(result[target].marketSource, "browser-dex");
  assert.equal(result[other], undefined, "a quote-side match cannot publish the base token's metrics");

  const quoteOnly = walletDexBatchWith(async () => ({ ok: true, json: async () => ({ pairs: [pairs[0]] }) }));
  assert.deepEqual(await quoteOnly([target], "robinhood"), {});
});

test("selected degen hero art is optimized and referenced from the v3 banner", () => {
  assert.match(css, /fun-hero-v3\.webp/);
  assert.ok(fs.statSync(new URL("../web/public/assets/slimewire/fun-hero-v3.webp", import.meta.url)).size < 100_000);
});
