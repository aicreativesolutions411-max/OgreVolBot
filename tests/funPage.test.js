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
const funWorker = fs.readFileSync(new URL("../web/public/fun-sw.js", import.meta.url), "utf8");
const rhChain = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
const terminalApp = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const desktopHtml = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const desktopAliasHtml = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");

test("/fun is a standalone no-store mobile surface with Cloudflare pretty-URL support", () => {
  assert.match(server, /requestUrl\.pathname === "\/fun"[\s\S]{0,300}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  assert.doesNotMatch(redirects, /^\/fun(?:\/\*)?\s+\/fun\.html/m);
  assert.match(html, /<script src="\/config\.js"><\/script>/);
  const scriptVersion = html.match(/<script defer src="\/fun\.js\?v=(\d+)"><\/script>/)?.[1];
  assert.equal(scriptVersion, "53", "SlimeWire Go should publish the current app build");
  assert.match(funWorker, new RegExp(`\\/fun\\.js\\?v=${scriptVersion}`));
});

test("/fun is installable as a separate PWA with a dedicated-origin escape", () => {
  assert.equal(manifest.id, "/slimewire-fun-app");
  assert.equal(manifest.start_url, "/fun/?src=slimewire-fun-pwa");
  assert.equal(manifest.scope, "/fun/");
  assert.match(html, /fun-manifest\.webmanifest\?v=2/);
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /FUN_INSTALL_HOST = "app\.slimewire\.org"/);
  assert.match(js, /Install SlimeWire Go/);
  assert.match(js, /register\("\/fun-sw\.js", \{ scope: "\/fun\/", updateViaCache: "none" \}\)/);
  assert.match(funWorker, /slimewire-fun-v45/);
  assert.match(JSON.stringify(manifest.icons), /fun-app-icon-512\.png/);
  assert.doesNotMatch(funWorker, /pathname\.startsWith\("\/api\/"\)[\s\S]{0,80}cache\.put/);
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
  assert.match(js, /coin\.volumeLabel \|\| "checking"/);
  assert.doesNotMatch(html, /community chat/i);
  assert.match(html, /class="feed-search-btn"[\s\S]{0,140}data-open-search[\s\S]{0,100}Search CA/);
  assert.match(css, /\.feed-actions\{display:flex/);
});

test("Fun Launch keeps the complete existing launcher inside the Go layout", () => {
  assert.match(html, /data-view="launch"[\s\S]{0,500}data-launch-frame/);
  assert.match(js, /function openFunLaunch\(\)/);
  assert.match(js, /frame\.src = `\/\?from=fun&embed=fun-launch&freshLaunch=1/);
  assert.match(js, /t=\$\{Date\.now\(\)\}/);
  assert.match(js, /action === "launch"[\s\S]{0,100}openFunLaunch\(\)/);
  assert.doesNotMatch(js, /location\.assign\("\/\?from=fun#launch"\)/);
  assert.match(css, /\.launch-view\.active/);
  for (const page of [desktopHtml, desktopAliasHtml]) {
    assert.match(page, /const funLaunchHandoff = q\.get\("from"\) === "fun"/);
    assert.match(page, /\^#launch\(\?:\\\/\|\$\)\/i\.test\(location\.hash \|\| ""\)/);
    assert.match(page, /if \(funLaunchHandoff\) return;/);
    assert.match(page, /const embed=new URLSearchParams\(location\.search\)\.get\("embed"\);if\(embed===\"fun-launch\"\)/);
    assert.match(page, /body\.fun-launch-embed \.topbar/);
  }
});

test("/fun hides the SlimeCash handoff unless the route came from cash", () => {
  assert.match(html, /class="cash-handoff" data-cash-handoff hidden/);
  assert.match(css, /\.cash-handoff\[hidden\]\{display:none\}/);
  assert.match(js, /const FROM_CASH = ROUTE_PARAMS\.get\("from"\) === "cash"/);
  assert.match(js, /handoff\.hidden = !FROM_CASH/);
  assert.match(js, /SLIMECASH TO FUN/);
  assert.match(html, /fun\.css\?v=34/);
  assert.match(funWorker, /slimewire-fun-v45/);
  assert.match(funWorker, /fun\.css\?v=34/);
});

test("/fun keeps the wallet funding card compact and scannable", () => {
  assert.match(css, /\[data-home-readiness\] \.readiness-card\{gap:9px/);
  assert.match(css, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(js, /<span>WALLET READY<\/span>/);
  assert.match(js, /"Add SOL to trade"/);
  assert.match(js, /"Add SOL from Phantom, Solflare, or another Solana wallet\."/);
  assert.match(html, /fun\.js\?v=53/);
  assert.match(funWorker, /fun\.js\?v=53/);
});

test("Connect and Deposit share one simple funding flow without surprise wallet downloads", () => {
  assert.match(html, /class="wallet-pill" type="button" data-wallet-entry/);
  assert.match(html, /data-deposit>Deposit<\/button><button type="button" data-send-sol>Send SOL<\/button><button type="button" data-receive>Receive/);
  assert.match(html, /class="quick-wallet-pill" type="button" data-wallet-entry/);
  for (const marker of ["data-fund-coinbase", 'data-fund-wallet="phantom"', 'data-fund-wallet="solflare"', "data-fund-copy", "data-fund-sol"]) assert.match(js, new RegExp(marker));
  assert.doesNotMatch(js, /data-fund-wallet="other"/);
  assert.match(js, /function openFundingSheet/);
  assert.match(html, /\/slimewire-funding\.js\?v=8/);
  assert.match(js, /startCoinbaseFunding/);
  assert.match(js, /\/api\/web\/wallets\/create/);
  assert.match(js, /\/api\/web\/wallet-funding\/create/);
  assert.match(js, /\/api\/web\/wallet-funding\/execute/);
  assert.match(js, /startFunMobileExactFunding/);
  const mobileLaunch = js.slice(js.indexOf("async function startFunMobileExactFunding"), js.indexOf("async function checkPendingFunFunding"));
  const pendingCheck = js.slice(js.indexOf("async function checkPendingFunFunding"), js.indexOf("function resumePendingFunFunding"));
  assert.match(mobileLaunch, /WalletFunding\.createSolanaPayReference\(\)/);
  assert.match(mobileLaunch, /WalletFunding\.solanaPayTransferUrl\(\{/);
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
  assert.match(funWorker, /const FUN_CACHE = "slimewire-fun-v45"/);
  assert.match(funWorker, /\/slimewire-funding\.js\?v=8/);
  assert.match(funWorker, /self\.skipWaiting\(\)/);
  assert.match(funWorker, /self\.clients\.claim\(\)/);
  assert.match(funWorker, /key\.startsWith\("slimewire-fun-"\) && key !== FUN_CACHE/);
  assert.doesNotMatch(funWorker, /slimewire-mwa/i);
  assert.match(js, /register\("\/fun-sw\.js", \{ scope: "\/fun\/", updateViaCache: "none" \}\)/);
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

test("web positions require user-mint acquisition proof while preserving managed-wallet sweeps", () => {
  const shared = server.slice(server.indexOf("async function buildPositionsOverview"), server.indexOf("async function showSniperScan"));
  const normalizer = server.slice(server.indexOf("function normalizeWebTokenHolding"), server.indexOf("function positionValueCacheKey"));
  const projection = server.slice(server.indexOf("function webPrimaryPositionProjection"), server.indexOf("async function estimatePositionValueFromMarket"));
  const webRows = server.slice(server.indexOf("async function webPositionRows"), server.indexOf("async function webPnlSummary"));
  assert.match(shared, /for \(const account of accounts\.filter\(\(item\) => item\.rawAmount > 0n\)\)/);
  assert.match(shared, /options\.webPortfolioOnly[\s\S]{0,180}!wallet\.volumeBot && !wallet\.ephemeral/);
  assert.doesNotMatch(shared, /webPortfolioOnly[\s\S]{0,180}!wallet\.sessionWallet/);
  assert.match(shared, /tradeType === "launch" && positiveBigIntOrZero\(trade\.solLamportsSpent\) > 0n/);
  assert.match(projection, /hasAcquisitionProvenance = Number\(position\?\.buys \|\| 0\) > 0/);
  assert.match(projection, /positiveBigIntOrZero\(position\?\.spent\) > 0n/);
  assert.doesNotMatch(projection, /buyWallets/);
  assert.match(webRows, /\.map\(webPrimaryPositionProjection\)/);
  assert.match(webRows, /webPortfolioOnly: true/);
  assert.match(webRows, /position\.buys > 0 && position\.spent > 0n/);
  assert.doesNotMatch(server.slice(server.indexOf("async function estimatePositionValueFromMarket"), server.indexOf("async function pnlSummaryText")), /accounts\.slice\(0, 8\)/);

  const positiveBigIntOrZero = (value) => { try { const parsed = BigInt(String(value ?? "0")); return parsed > 0n ? parsed : 0n; } catch { return 0n; } };
  const project = Function("positiveBigIntOrZero", `${normalizer}\n${projection}\nreturn webPrimaryPositionProjection;`)(positiveBigIntOrZero);
  const swept = project({ tokenMint: "mint", buys: 1, sells: 0, spent: 100n, received: 0n, accounts: [
    { walletPublicKey: "destination-wallet", rawAmount: 123400n, decimals: 2 }
  ] });
  assert.equal(swept.walletCount, 1);
  assert.equal(swept.rawAmount, 123400n);
  assert.equal(swept.uiAmount, 1234);
  assert.equal(project({ tokenMint: "spam", buys: 0, spent: 0n, accounts: [{ walletPublicKey: "wallet", rawAmount: 1n, decimals: 0 }] }), null);
});

test("position cache warmer fills the connected-wallet scoped v2 fast and full keys from one snapshot", () => {
  const route = server.slice(server.indexOf('pathname === "/api/web/positions"'), server.indexOf('pathname === "/api/web/pnl"'));
  const warmer = server.slice(server.indexOf("async function warmWorkerDisplayCaches"), server.indexOf("function normalizeWorkerList"));
  assert.match(route, /webPositionConnectedScope\(profile\)/);
  assert.match(warmer, /webPositionConnectedScope\(profile\)/);
  assert.match(warmer, /cachedWebSummary\("web:positions:v2:" \+ connectedScope/);
  assert.match(warmer, /cachedWebSummary\("web:positions:v2:fast:" \+ connectedScope/);
  assert.doesNotMatch(warmer, /cachedWebSummary\("web:positions",/);
  assert.match(warmer, /let positionsValuePromise = null/);
  assert.match(warmer, /positionsValuePromise = webPositionSummary\(userId, \{ force, fast: false \}\)/);
  assert.match(warmer, /Promise\.all\(\[[\s\S]*buildPositionsValue[\s\S]*buildPositionsValue/);
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
  assert.match(html, /<b>More<\/b>/);
  assert.match(js, /location\.assign\("\/cash\/\?from=fun"\)/);
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
  assert.match(js, /const totalUsd = state\.solUsd > 0 \? totalSol \* state\.solUsd : null/);
  assert.match(js, /class="wallet-cash-total"[\s\S]{0,180}TOTAL VALUE[\s\S]{0,180}SOL \+ COINS/);
  assert.match(css, /\.readiness-summary\{display:grid;grid-template-columns:minmax\(0,1fr\) auto/);
  assert.match(server, /getSolUsdPrice\(\{ timeoutMs: 1_800 \}\)[\s\S]{0,200}return \{ balances, connectedWallet, solUsd \}/);
  assert.match(js, /function paintPositionSurfaces\(\)[\s\S]{0,160}paintWalletPill\(\);[\s\S]{0,80}renderHomeReadiness\(\)/);
  assert.match(js, /async function loadPositions\(options = \{\}\)[\s\S]{0,600}paintPositionSurfaces\(\)/);
});

test("/fun backs up every wallet, auto-backs up new wallets, and keeps backup-all explicit", () => {
  assert.match(js, /data-backup-wallet data-wallet-index="\$\{wallet\.index\}" data-wallet-key="\$\{escapeHtml\(wallet\.publicKey\)\}">Backup wallet/);
  assert.match(js, /function walletManagerRowHtml\(wallet\)[\s\S]{0,3500}data-backup-wallet data-wallet-index="\$\{wallet\.index\}" data-wallet-key="\$\{escapeHtml\(wallet\.publicKey\)\}"/);
  assert.match(js, /const previousWallets = new Set\(state\.wallets\.map[\s\S]{0,650}for \(const wallet of created\) markWalletBackedUp\(wallet\)/);
  assert.match(js, /sessionStorage\.getItem\(WALLET_BACKUP_REMINDER_KEY\)[\s\S]{0,260}Back up Wallet 1 before using another device/);
  assert.match(js, /const requestBody = options\.walletPublicKey \|\| options\.walletIndex[\s\S]{0,180}publicKey: options\.walletPublicKey[\s\S]{0,100}walletIndex: options\.walletIndex/);
  assert.match(js, /post\("\/api\/web\/wallets\/export", requestBody\)/);
  assert.match(js, /exportWallets\(backupWallet, \{ recoveryOnly: true, walletPublicKey: backupWallet\.dataset\.walletKey[\s\S]{0,180}walletIndex: backupWallet\.dataset\.walletIndex/);
  assert.match(js, /downloads\.recoveryKeys\?\.text[\s\S]{0,180}downloadText\(downloads\.recoveryKeys\.filename, downloads\.recoveryKeys\.text\)/);
  assert.match(js, /Selected wallet recovery key downloaded\. Keep it private\./);
  assert.match(js, /markWalletBackedUp\(selected \|\| options\.walletPublicKey\)/);
  const allFiles = js.slice(js.indexOf("function downloadWalletFiles"), js.indexOf("async function downloadFunAccountBackup"));
  assert.match(allFiles, /downloads\.encryptedBackup, downloads\.recoveryKeys/);
  assert.match(js, /const exportButton = event\.target\.closest\("\[data-export-wallets\]"\)[\s\S]{0,100}exportWallets\(exportButton\)/);
  assert.match(css, /\.wallet-total-line\{display:flex/);
  assert.match(css, /\.wallet-backup-button\{/);
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
  assert.match(loads, /request\(`\/api\/web\/positions\?fast=true\$\{options\.force/);
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
  assert.match(js, /loadPositions\(\{ force: true \}\)/);
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
  assert.match(js, /\/api\/web\/rh\/bridge-to-sol/);
  assert.match(js, /if \(state\.token\) Promise\.all\(\[loadMe\(\), loadWallets\(\), loadPositions\(\), loadPresets\(\), loadCreatedCoinsSilently\(\)\]\)/);
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
  assert.match(js, /marketCapLabel: coin\.marketCapLabel/);
  assert.match(js, /class="recent-list"/);
  assert.match(css, /\.recent-list>button\{display:grid/);
  assert.match(server, /rhListTokens\(1\)[\s\S]{0,120}rhRecentActiveTokens\(1\)/);
});

test("coin art stays metadata-first while wallet identities use slime PFPs", () => {
  assert.match(js, /\/pfp\/mapfaces\//);
  assert.match(js, /coin\?\.metadata\?\.image/);
  assert.match(js, /row\.imageUri \|\| row\.logoUrl \|\| row\.meta\?\.imageUrl \|\| row\.metadata\?\.image/);
  assert.match(js, /token-mascots\/token-mascot-/);
  assert.match(js, /function coinBadge/);
  assert.match(js, /data-coin-symbol/);
  assert.match(html, /assets\/slimewire\/png\/slimewire-mark\.png/);
  assert.doesNotMatch(js, /pfp\/characters/);
  assert.match(js, /hydrateSelectedFromFeed\(\)/);
  assert.match(js, /request\(`\/api\/web\/token-search\?q=\$\{encodeURIComponent\(key\)\}`\)/);
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
  assert.match(js, /const detailPromise = request\(path\)/);
  assert.ok(js.indexOf("const searchResult = await request") < js.indexOf("const detailResult = await detailPromise"));
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
  assert.match(js, /row\.marketCapUsd \|\| row\.marketCap \|\| row\.mc/);
  assert.match(js, /row\.volume24hUsd \|\| row\.volumeH24 \|\| row\.volumeUsd/);
  assert.match(js, />24h \$\{escapeHtml\(coin\.volume/);
  assert.match(js, />Liq \$\{escapeHtml\(formatUsd\(coin\.liquidity\)\)\}/);
  assert.match(js, /class="coin-ca-button"[^>]+data-copy-coin/);
  assert.match(css, /\.coin-ca-button\{/);
});

test("coin setup exposes fast buys, ladder exits, one-wallet RH trades, and the full volume engine", () => {
  assert.match(html, /data-quick-trade/);
  assert.match(html, /data-detail="setup">Trade setup/);
  assert.match(js, /data-trade-strategy="ladder"/);
  assert.match(js, /data-ladder-preset="smart"/);
  assert.match(js, /payCurrency = "SOL"/);
  assert.match(js, /Convert received ETH back to SOL automatically/);
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
});

test("/fun indicator paint uses real OHLC candles for Fibonacci, RSI, MACD, and harmonics", () => {
  for (const marker of ['data-indicators-toggle', 'data-indicator-kind="fib"', 'data-indicator-kind="rsi"', 'data-indicator-kind="macd"', 'data-indicator-kind="harmonics"', 'data-indicator-panels']) assert.match(html, new RegExp(marker));
  assert.match(html, /aria-controls="slimeIndicatorDrawer"/);
  assert.match(html, /data-indicator-status role="status" aria-live="polite"/);
  assert.match(html, /vendor\/lightweight-charts\.standalone\.production\.js/);
  assert.ok(html.indexOf("lightweight-charts.standalone.production.js") < html.indexOf("fun-indicators.js"));
  assert.match(html, /fun-indicators\.js\?v=7/);
  assert.match(funWorker, /fun-indicators\.js\?v=7/);
  assert.match(funWorker, /fun\.css\?v=34/);
  assert.match(indicators, /\/api\/chart\?ca=/);
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
  assert.match(indicators, /CANDLE_TIMEOUT_MS = 6_500/);
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
  assert.match(indicators, /Overlays are only marked active after they are painted on real candles/);
  assert.match(indicators, /regular chart restored/i);
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
  assert.match(js, /\/quick\?ca=\$\{encodeURIComponent\(key\)\}/);
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

test("wallet manager batch-funds exact allocations and can sell or consolidate selected wallets", () => {
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
});

test("wallet manager shows SOL, priced coin positions, and total value for every wallet", () => {
  assert.match(js, /function walletPositionAssets\(wallet = \{\}\)/);
  assert.match(js, /Array\.isArray\(wallet\.tokens\)/);
  assert.match(js, /totalValueSol \* Math\.min\(1, quantity \/ totalQuantity\)/);
  for (const marker of ["wallet-value-strip", "Coin positions", "No coin positions in this wallet", "SOL", "COINS", "TOTAL"]) {
    assert.match(js + css, new RegExp(marker));
  }
  assert.match(js, /await loadValuedPositions\(state\.positionLoadVersion\)/);
});

test("positions are grouped by wallet with scoped 25, 50, 100, and custom sells", () => {
  for (const marker of ["fun-wallet-position-group", "data-fun-position-sell", "data-fun-position-custom", "data-fun-custom-sell-percent"]) {
    assert.match(js + css, new RegExp(marker));
  }
  assert.match(js, /walletPublicKeys: \[walletPublicKey\]/);
  assert.match(js, /Other wallets stay untouched/);
  assert.match(terminalApp, /function walletPositionGroups\(\)/);
  assert.match(terminalApp, /data-position-sell-wallet=/);
  assert.match(terminalApp, /walletPublicKeys: scopedWalletPublicKey \? \[scopedWalletPublicKey\] : \[\]/);
  assert.match(server, /walletPositions,/);
  assert.match(server, /walletPublicKey: holding\.walletPublicKey/);
});

test("wallet holdings show real PnL and send Solana or Robinhood tokens without selling", () => {
  assert.match(server, /pathname === "\/api\/web\/wallets\/send-token"/);
  assert.match(server, /runIdempotentMoneyOp\(\s*"web-send-token"/);
  assert.match(server, /createTransferCheckedInstruction\(/);
  assert.match(server, /pathname === "\/api\/web\/rh\/send-token"/);
  assert.match(server, /runIdempotentMoneyOp\(\s*"web-rh-send-token"/);
  assert.match(rhChain, /export async function rhTransferErc20/);
  assert.match(js, /data-fun-send-token=/);
  assert.match(js, /data-review-token-send/);
  assert.match(js, /position-holding-pnl/);
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

test("selected degen hero art is optimized and referenced from the v3 banner", () => {
  assert.match(css, /fun-hero-v3\.webp/);
  assert.ok(fs.statSync(new URL("../web/public/assets/slimewire/fun-hero-v3.webp", import.meta.url)).size < 100_000);
});
