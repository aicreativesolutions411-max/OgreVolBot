// Regression guard for the P0 buy/sell double-submit hole found in the QA sweep.
//
// Three independent vectors had to be closed; this locks all three so a refactor can't silently reopen
// them. Source-text assertions (no live chain) mirror the style of manualSellResponsiveness.test.js.
//
//   1. SELL field mismatch — the web terminal sends the dedup id as `tradeAttemptId`, but the server
//      dedup only read `manualSellAttemptId`/`clientRequestId`, so a web sell never engaged the lock and
//      a double-tap fired two real sells. Fix: also read `tradeAttemptId`.
//   2. BUY had no idempotency at all — a retry / 403-retry / multi-tab resend fired a second real buy.
//      Fix: webTradeBuy wraps webTradeBuyCore with cached-result replay + a per-attempt lock.
//   3. CLIENT double-tap — each tap mints a fresh tradeAttemptId, so the server can't pair two separate
//      taps. Only a client in-flight guard can; execQuickBuy had none. Fix: tradeLock/tradeUnlock.

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { effectiveErc20SupplyRaw, tokenPriceInQuote } from "../src/lib/noxaLaunchpad.js";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const vanityMintSource = fs.readFileSync(new URL("../src/lib/vanityMint.js", import.meta.url), "utf8");
const noxaSource = fs.readFileSync(new URL("../src/lib/noxaLaunchpad.js", import.meta.url), "utf8");
const ggSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const polyTradingSource = fs.readFileSync(new URL("../src/lib/polymarketTrading.js", import.meta.url), "utf8");
const polyHubSource = fs.readFileSync(new URL("../web/public/polymarket.html", import.meta.url), "utf8");

test("main website mirrors stay identical", () => {
  assert.equal(indexSource, ggSource, "index.html and gg.html drifted; shared site fixes must ship together");
});

test("desktop and responsive wallet addresses copy when the address itself is clicked", () => {
  const addressButton = functionBody(appSource, "walletAddressCopyHtml");
  assert.match(addressButton, /class="wallet-address-copy"/);
  assert.match(addressButton, /data-copy=/);
  assert.match(functionBody(appSource, "walletsHtml"), /walletAddressCopyHtml\(wallet\.publicKey\)/);
  assert.match(functionBody(appSource, "connectedWalletCardHtml"), /walletAddressCopyHtml\(connected\.publicKey/);
  assert.match(functionBody(appSource, "walletPositionGroupHtml"), /walletAddressCopyHtml\(wallet\.publicKey/);
  assert.match(appSource, /target\.closest\?\.\("\[data-copy\]"\)/);
  assert.match(functionBody(appSource, "copyBrowserText"), /document\.execCommand\?\.\("copy"\)/);
  for (const liveTerminal of [ggSource, indexSource]) {
    assert.match(liveTerminal, /class="addr wallet-address-tap"[^>]+Copy full wallet address/);
    assert.match(liveTerminal, /⧉ Copy full address/);
    assert.match(liveTerminal, /⧉ Tap to copy/);
    assert.match(functionBody(liveTerminal, "copy"), /document\.execCommand\?\.\("copy"\)/);
  }
});

test("desktop bundle plans can leave selected wallets completely manual", () => {
  const bundleUi = functionBody(appSource, "walletExitTargetsHtml");
  const bundleForm = functionBody(appSource, "readBundlePlanForm");
  const planBuilder = functionBody(serverSource, "webCreateManagedBuyPlanCore");
  const guardGate = functionBody(serverSource, "shouldArmWebExitGuardForWallet");

  assert.match(bundleUi, /Hold \/ Manual Only/);
  assert.match(bundleUi, /will not arm TP, SL, ladders, trailing stops, timers, or automatic sells/);
  assert.match(bundleUi, /data-\$\{prefix\}-manual-wallet/);
  assert.match(bundleForm, /manualExitWalletIndexes: checkedWalletIndexes\("bundle-plan-manual"\)/);
  assert.match(serverSource, /function parseWebManualExitWalletIndexes\(/);
  assert.match(planBuilder, /manualExitWalletSet\.has/);
  assert.match(planBuilder, /status: manualExit \? "manual_hold" : "watching"/);
  assert.match(planBuilder, /sellAfterAt: manualExit \? null : sellAfterAt/);
  assert.match(functionBody(serverSource, "planHasPriceExit"), /autoExitDisabled.*manualExit/);
  assert.match(functionBody(serverSource, "walletTakeProfitPct"), /autoExitDisabled.*manualExit.*return 0/);
  assert.match(functionBody(serverSource, "walletStopLossPct"), /autoExitDisabled.*manualExit.*return 0/);
  assert.match(functionBody(serverSource, "nextTakeProfitLadderLevel"), /autoExitDisabled.*manualExit.*return null/);
  assert.match(guardGate, /autoExitDisabled.*manualExit.*return false/);
});

test("desktop funding matches mobile with visible wallet selection and one reviewed transaction", () => {
  const fundingUi = functionBody(appSource, "walletSweepToolsHtml");
  const payload = functionBody(appSource, "additionalWalletFundingPayload");
  const review = functionBody(appSource, "reviewAdditionalWalletFunding");
  const sender = functionBody(serverSource, "webSendSolManyCore");

  assert.match(fundingUi, /Fund Additional Wallets/);
  assert.match(fundingUi, /data-wallet-fund-target/);
  assert.match(fundingUi, /data-wallet-fund-equal/);
  assert.match(fundingUi, /\["0\.05", "0\.1", "0\.15", "0\.25"\]/);
  assert.match(fundingUi, /Review Funding/);
  assert.match(fundingUi, /Advanced: paste outside wallets/);
  assert.match(payload, /sourcePublicKey: source\.publicKey/);
  assert.match(payload, /allocations/);
  assert.match(payload, /createClientAttemptId\("fund-additional-wallets"\)/);
  assert.match(review, /Confirm &amp; Fund Wallets/);
  assert.match(sender, /The funding wallet changed after review/);
  assert.match(sender, /requestedAllocations/);
  assert.match(sender, /new Transaction\(\)/);

  for (const liveTerminal of [ggSource, indexSource]) {
    const liveUi = functionBody(liveTerminal, "additionalWalletFundingHtml");
    const liveReview = functionBody(liveTerminal, "reviewAdditionalWalletFunding");
    const liveSubmit = functionBody(liveTerminal, "confirmAdditionalWalletFunding");
    assert.match(liveUi, /Fund Additional Wallets/);
    assert.match(liveUi, /class="fwTarget"/);
    assert.match(liveUi, /\["0\.05","0\.1","0\.15","0\.25"\]/);
    assert.match(liveReview, /sourcePublicKey:source\.publicKey/);
    assert.match(liveReview, /allocations/);
    assert.match(liveReview, /tradeAttemptId:attemptId\(\)/);
    assert.match(liveSubmit, /\/api\/web\/wallets\/send-sol/);
    assert.match(liveTerminal, /additionalWalletFundingHtml\(\)/);
    assert.match(liveTerminal, /wireAdditionalWalletFunding\(\)/);
  }
});

test("wallet sweeps use saved destinations and explicit source checkboxes on every web layout", () => {
  const classicUi = functionBody(appSource, "walletSweepToolsHtml");
  const classicPayload = functionBody(appSource, "walletSweepSelectionPayload");
  const classicSync = functionBody(appSource, "updateWalletSweepUi");
  const tokenSweep = functionBody(serverSource, "webSweepTokens");

  assert.match(functionBody(appSource, "sweepDestinationEntries"), /Connected wallet/);
  assert.match(classicUi, /data-wallet-sweep-destination-select/);
  assert.match(classicUi, /data-wallet-sweep-target/);
  assert.match(classicUi, /data-wallet-sweep-select="all"/);
  assert.match(classicUi, /data-wallet-sweep-select="none"/);
  assert.match(classicUi, /Other wallet address/);
  assert.match(classicPayload, /selectedSweepWalletIndexes/);
  assert.match(classicPayload, /selectedSweepDestination/);
  assert.match(classicPayload, /createClientAttemptId\("wallet-sweep"\)/);
  assert.match(classicSync, /Destination wallet/);
  assert.match(classicSync, /input\.disabled = isDestination/);
  assert.match(tokenSweep, /wallet\.publicKey.*destination\.toBase58/);

  for (const liveTerminal of [ggSource, indexSource]) {
    const ui = functionBody(liveTerminal, "sweepWalletControlsHtml");
    const sync = functionBody(liveTerminal, "syncSweepWalletControls");
    assert.match(functionBody(liveTerminal, "sweepDestinationEntries"), /Connected wallet/);
    assert.match(ui, /id="swDestSelect"/);
    assert.match(ui, /class="swTarget"/);
    assert.match(ui, /Other wallet address/);
    assert.match(ui, /Sweep selected SOL/);
    assert.match(ui, /Sweep selected tokens/);
    assert.match(sync, /input\.disabled=isDest/);
    assert.match(sync, /Destination wallet/);
    assert.match(functionBody(liveTerminal, "sweepSol"), /tradeAttemptId:attemptId\(\)/);
    assert.match(functionBody(liveTerminal, "sweepTokens"), /tradeAttemptId:attemptId\(\)/);
    assert.match(liveTerminal, /wireSweepWalletControls\(\)/);
  }
});

test("SOL-first prediction trades, payouts, and recovery stay durable and idempotent", () => {
  const funding = functionBody(serverSource, "submitPolySolFunding");
  const cashout = functionBody(serverSource, "startPolyCashout");
  const payout = functionBody(serverSource, "pollManagedPolyPayouts");
  assert.ok(funding.indexOf('current.status = "funding_submitting"') < funding.indexOf("sendLegacyTransaction"));
  assert.ok(cashout.indexOf('current.status = "submitting"') < cashout.indexOf("transferPUsdToBridge"));
  assert.match(serverSource, /runIdempotentMoneyOp\("poly-sol-cashout"/);
  assert.match(payout, /status: "submitting"/);
  assert.match(payout, /claimToken/);
  assert.match(payout, /redeemablePositions/);
  assert.match(polyTradingSource, /negRiskCollateralAdapter: "0xadA2005600Dec949baf300f4C6120000bDB6eAab"/);
  assert.match(polyTradingSource, /executeDepositWalletBatch\(\[call\], depositAddress, deadline\)/);
  assert.doesNotMatch(functionBody(polyTradingSource, "setupAccount"), /builder code is not configured/);
  assert.doesNotMatch(functionBody(polyTradingSource, "placeOrder"), /live orders are not configured/);
  assert.match(polyTradingSource, /config\.builderConfigured \? \{ builderCode: config\.builderCode \} : \{\}/);
  assert.match(serverSource, /web_poly_account_setup_failed/);
  assert.match(polyHubSource, /SETUP PENDING/);
  assert.match(polyHubSource, /setupAvailable/);
  assert.match(serverSource, /crypto\.createHmac\("sha256", CONFIG\.appSecret\)/);
  assert.match(serverSource, /restorePolyRecoveryForUser/);
  assert.match(serverSource, /backupDataToR2\(reason\)/);
});

test("Trade opens the focused cross-chain search with shared recent coins", () => {
  assert.match(ggSource, /function openTradeSearch\(/);
  assert.match(ggSource, /TRADE_RECENTS_KEY="slimewireFunRecents"/);
  assert.match(ggSource, /Search ticker, name, Solana or 0x CA/);
  assert.match(ggSource, /document\.querySelectorAll\("\[data-trade-entry\]"\)\.forEach\(b=>b\.onclick=openTradeSearch\)/);
  assert.match(ggSource, /<span>Recent searches<\/span>/);
  assert.match(ggSource, /function openTradeSearchRow\(row\)/);
  assert.match(ggSource, /state\._nextTradeFocus="buy"/);
  assert.match(ggSource, /data-focus="'\+\(buyFirst\?'buy':'chart'\)\+'"/);
  assert.doesNotMatch(functionBody(ggSource, "openCoinRoute"), /_nextTradeFocus/, "Market rows should stay chart-first");
  assert.match(ggSource, /marketCapLabel:row\.marketCapLabel/);
  assert.match(ggSource, /function writeTradeRecents\(rows\)/);
  assert.match(ggSource, /const addrs=\(rows\|\|\[\]\)\.map\(tradeSearchKey\)/);
  assert.match(ggSource, /byLower=new Map\(Object\.entries\(by\)/);
  assert.match(ggSource, /enrichSearchRows\(recents\)\.then/);
  assert.match(ggSource, /writeTradeRecents\(recents\)/);
  assert.match(ggSource, /rememberTradeRecent\(r\);const th=/);
  assert.doesNotMatch(ggSource, /Fees before trading/);
});

test("unknown market and security fields stay honest while details hydrate", () => {
  assert.match(ggSource, /Feed live · details updating/);
  assert.match(ggSource, /if\(buys==null&&sells==null\)return'<span class="mut">checking<\/span>'/);
  assert.match(ggSource, /const holdersReady=secHoldersReady\(s\)/);
  assert.match(ggSource, /holdersReady&&score!=null/);
  assert.match(ggSource, /const shownVerdict=hardDanger\?verdict:\(holdersReady\?\(verdict\|\|"Risk checked"\):"Risk checking"\)/);
  assert.match(serverSource, /authoritiesLoaded: Boolean\(baseRow\.authoritiesLoaded \|\| heliusMeta\.source \|\| st\.ok\)/);
});

test("first-visit market orientation stays a compact action strip", () => {
  assert.match(ggSource, /Trade Solana \+ Robinhood coins/);
  assert.match(ggSource, /Every advanced tool stays one tap away/);
  assert.doesNotMatch(ggSource, /Find it\. Trade it\./);
});

test("profile login, referral tracking, and Robinhood artwork stay complete", () => {
  assert.match(ggSource, /id="createAccountBtn"/);
  assert.match(ggSource, /function createAccountModal\(/);
  assert.match(ggSource, /d\.message\|\|d\.error/);
  assert.doesNotMatch(ggSource, /d\.error\|\|d\.message/);
  assert.match(ggSource, /function referralTrackerFoldHtml\(/);
  assert.match(ggSource, /id="signOutBtn"/);
  assert.match(ggSource, /class="rh-avatar-shell"/);
  assert.match(serverSource, /async function webReferralTracker\(/);
  assert.match(serverSource, /async function handlePlatformReferralCommand\(/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["referrals", "referralstats"\]\)/);
  assert.match(ggSource, />𝕏 Community<\/a>/);
  assert.doesNotMatch(ggSource, />𝕏 X Community<\/a>/);
  const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  assert.match(funSource, /data-fun-account="create"/);
  assert.match(funSource, /data-save-referral-payout/);
  assert.match(funSource, /data-save-referral-code/);
});

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
      if (paramsDepth === 0) { paramsEnd = index; break; }
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

test("server sell dedup honors the web terminal's tradeAttemptId", () => {
  const body = functionBody(serverSource, "runManualSellCriticalAttempt");
  // The id read must include tradeAttemptId so the existing lock/replay actually engages for web sells.
  assert.match(body, /firstString\(\s*body\.manualSellAttemptId,\s*body\.tradeAttemptId,\s*body\.clientRequestId\s*\)/);
  assert.match(body, /LockService\.withLock/);
});

test("manual sell keeps an outcome-unknown tombstone for 24 hours", () => {
  const body = functionBody(serverSource, "runManualSellCriticalAttempt");
  assert.match(body, /cached\?\.ambiguousError[\s\S]*manualSellAmbiguousReplayError\(cached\)/);
  assert.match(body, /duplicate\?\.ambiguousError[\s\S]*manualSellAmbiguousReplayError\(duplicate\)/);
  assert.match(body, /catch \(error\) \{[\s\S]*error\?\.tradeSubmissionAmbiguous[\s\S]*ambiguousError:/);
  assert.match(body, /idemResultSet\(resultKey,[\s\S]*24 \* 60 \* 60_000\)/);
  const replay = functionBody(serverSource, "manualSellAmbiguousReplayError");
  assert.match(replay, /tradeSubmissionAmbiguous = true/);
  assert.match(replay, /partialHashes/);
});

test("buy path is idempotent: webTradeBuy wraps webTradeBuyCore via runIdempotentMoneyOp", () => {
  // The real buy logic moved into a *Core fn; the public fn delegates to the shared idempotency wrapper.
  assert.match(serverSource, /async function webTradeBuyCore\(userId, body = \{\}\) \{/);
  const wrapper = functionBody(serverSource, "webTradeBuy");
  assert.match(wrapper, /runIdempotentMoneyOp\("web-buy", userId/);
  assert.match(wrapper, /firstString\(body\.tradeAttemptId, body\.clientRequestId\)/);
  assert.match(wrapper, /webTradeBuyCore\(userId, body\)/);
  // The actual swap still happens exactly once, in the core fn.
  assert.match(functionBody(serverSource, "webTradeBuyCore"), /buyTokenForPlan\(/);
});

test("runIdempotentMoneyOp replays the same attempt and serializes concurrent ones", () => {
  const body = functionBody(serverSource, "runIdempotentMoneyOp");
  // No id → runs the task directly (back-compat for callers that don't stamp one).
  assert.match(body, /if \(!id\) return task\(\)/);
  // Cached-result replay for repeats + a lock so two concurrent requests can't both spend.
  assert.match(body, /idemResultGet\(resultKey\)/);
  assert.match(body, /LockService\.withLock/);
  assert.match(body, /idemResultSet\(resultKey, \{ result \}/);
  // Durable-fallback cache so idempotency survives a brief Redis outage in-process.
  assert.match(functionBody(serverSource, "idemResultGet"), /cacheGetJson\(key\)[\s\S]*idemResultStore\.get\(key\)/);
});

test("the other money endpoints (send-sol, volume-bot, distribute) are idempotency-wrapped", () => {
  assert.match(functionBody(serverSource, "webSendSolMany"), /runIdempotentMoneyOp\("web-send-sol", userId/);
  assert.match(serverSource, /async function webSendSolManyCore\(/);
  assert.match(functionBody(serverSource, "webReturnFundsToConnected"), /runIdempotentMoneyOp\("web-return-funds", userId/);
  assert.match(serverSource, /async function webReturnFundsToConnectedCore\(/);
  assert.match(functionBody(serverSource, "webSweepSol"), /runIdempotentMoneyOp\("web-sweep-sol", userId/);
  assert.match(serverSource, /async function webSweepSolCore\(/);
  assert.match(functionBody(serverSource, "webSellAllTokens"), /runIdempotentMoneyOp\("web-sell-all", userId/);
  assert.match(serverSource, /async function webSellAllTokensCore\(/);
  assert.match(functionBody(serverSource, "webStartVolumeBot"), /runIdempotentMoneyOp\("web-volume-start", userId/);
  assert.match(serverSource, /async function webStartVolumeBotCore\(/);
  // Dup-plan guard: never fund a 2nd bot for a coin already running.
  assert.match(functionBody(serverSource, "webStartVolumeBotCore"), /A volume bot is already running for this coin/);
  assert.match(functionBody(serverSource, "webDistributeToFreshWallets"), /runIdempotentMoneyOp\("web-distribute", userId/);
});

test("volume recovery queues active plans before touching ghost wallets", () => {
  const sweep = functionBody(serverSource, "webSweepBackgroundWallets");
  const plansRead = sweep.indexOf("mutateTradePlans(");
  const walletsRead = sweep.indexOf("readWalletStore(");

  assert.ok(plansRead >= 0, "background sweep must atomically update the durable trade-plan store");
  assert.ok(walletsRead >= 0, "background sweep must inspect the user's wallet store");
  assert.ok(plansRead < walletsRead, "active recovery must be queued before any direct background-wallet hydration");
  assert.match(sweep, /web_volume_bot/);
  assert.match(sweep, /plan\.botStage = "sweeping"/);
  assert.match(sweep, /const preserveOneToken = body\.preserveOneToken === undefined/);
  assert.match(sweep, /keepDust: preserveOneToken/);
  assert.match(sweep, /residuePolicy: preserveOneToken \? "one-token-v1" : "none"/);
  assert.match(sweep, /sweepBack: true/);
  assert.match(sweep, /if \(queuedPlans\)/);
  assert.match(sweep, /Recovery started/);
  assert.match(sweep, /Token scan pending; wallet and gas were retained/);
  assert.doesNotMatch(sweep, /getOwnedTokenAccountsWithWarningsCached\([^;]+\.catch\(\(\) => \(\{ accounts: \[\] \}\)\)/);
  assert.match(sweep, /remaining !== null && remaining <= 20_000/);
});

test("volume sweep math converts formatted SOL strings before arithmetic", () => {
  const cleanupGas = functionBody(serverSource, "topUpVolumeCleanupGas");
  const standard = functionBody(serverSource, "processVolumeBotPlan");
  const rolling = functionBody(serverSource, "runRollingVolumeBotStep");
  assert.match(cleanupGas, /Number\(lamportsToSol\(needed\)\)\.toFixed\(4\)/);
  assert.doesNotMatch(cleanupGas, /lamportsToSol\(needed\)\.toFixed/);
  for (const body of [standard, rolling]) {
    assert.doesNotMatch(body, /\+ lamportsToSol\(cleanup\.sentLamports/);
  }
  assert.match(standard, /\+ Number\(lamportsToSol\(cleanup\.sentLamports \|\| 0\)\)/);
  assert.match(rolling, /\+ Number\(lamportsToSol\(cleanup\.sentLamports \|\| 0\)\)/);
});

test("Halt & Release only closes a settled Stop & Sweep and keeps recovery custody discoverable", () => {
  const stop = functionBody(serverSource, "webStopVolumeBot");
  const release = functionBody(serverSource, "webHaltAndReleaseVolumeBot");
  const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");

  assert.match(serverSource, /pathname === "\/api\/web\/volume-bot\/release"[\s\S]{0,220}webHaltAndReleaseVolumeBot\(auth\.userId, body\)/);
  assert.match(release, /body\.confirmRelease !== true/);
  assert.match(release, /String\(entry\.userId\) === String\(userId\)/);
  assert.match(release, /entry\.source === "web_volume_bot"/);
  assert.match(release, /String\(plan\.botStage \|\| ""\)\.toLowerCase\(\) !== "sweeping"/);
  assert.match(release, /const submitReleaseAt = volumeBotSubmittingReleaseAtMs\(plan, pending\)/);
  assert.match(release, /pendingStatus === "submitting" && Date\.now\(\) < submitReleaseAt[\s\S]{0,220}throw volumeBotConflict/);
  assert.match(release, /pending && pendingStatus === "outcome_unknown"/);
  assert.match(release, /const settleAt = volumeBotRecoverySettleAtMs\(plan, plan\.pendingAction\)/);
  assert.match(release, /Date\.now\(\) < settleAt/);
  assert.match(release, /plan\.releasedPendingAction = \{ \.\.\.pending, releasedAt:/);
  assert.match(release, /plan\.pendingAction = null/);
  assert.match(release, /plan\.botStage = "stopped"/);
  assert.match(release, /plan\.status = "completed"/);
  assert.match(release, /plan\.recoveryWorkIncomplete = true/);
  assert.match(release, /web_volume_bot_halt_release/);
  assert.match(release, /plan\.tradingPublicKeys/);
  assert.match(release, /plan\.pool/);
  assert.match(release, /plan\.activeWalletPublicKey/);
  assert.doesNotMatch(release, /pruneVolumeWallet|removeWebWallet|tradingPublicKeys\s*=\s*\[\]|pool\s*=\s*\[\]/);

  assert.match(stop, /const alreadySweeping = String\(plan\.botStage \|\| ""\)\.toLowerCase\(\) === "sweeping"/);
  assert.match(stop, /if \(!alreadySweeping\) plan\.sweepCursor = 0/);
  assert.match(stop, /alreadySweeping \? "Sweep is already in progress; continuing from the current wallet\."/);

  assert.match(appSource, /data-vbot-release/);
  assert.match(appSource, /\/api\/web\/volume-bot\/release/);
  assert.match(funSource, /data-release-volume/);
  assert.match(funSource, /data-stop-volume-plan/);
  assert.match(funSource, /\/api\/web\/volume-bot\/release/);
  assert.match(ggSource, /data-vl-release/);
  assert.match(ggSource, /data-vl-stop/);
  assert.match(ggSource, /\/api\/web\/volume-bot\/release/);

  const rows = functionBody(serverSource, "webVolumeBotRows");
  assert.match(rows, /const active = rows\.filter\([\s\S]{0,120}activeVolumePlanForUser/);
  assert.match(rows, /return \[\.\.\.active, \.\.\.history\.slice/);
});

test("rolling volume keeps a funded ghost wallet recoverable when buy outcome is uncertain", () => {
  const rolling = functionBody(serverSource, "runRollingVolumeBotStep");
  const transferAt = rolling.indexOf('kind: "rolling-fund"');
  const branchEnd = rolling.indexOf("// SELL:", transferAt);

  assert.ok(transferAt >= 0 && branchEnd > transferAt, "rolling buy branch is missing");
  const fundedBuyAttempt = rolling.slice(transferAt, branchEnd);
  assert.match(fundedBuyAttempt, /runVolumeBotExternalAction\(plan, persist/);
  assert.match(fundedBuyAttempt, /kind: "rolling-buy"/);
  assert.match(fundedBuyAttempt, /if \(active === false \|\| plan\.botStage !== "running"\) return/);
  const failureAt = fundedBuyAttempt.indexOf("} catch (error) {");
  assert.ok(failureAt >= 0, "funded rolling buy must retain an explicit recovery path");
  const uncertainFailure = fundedBuyAttempt.slice(failureAt);
  assert.doesNotMatch(
    uncertainFailure,
    /pruneVolumeWallet\(/,
    "a transfer or buy error can be outcome-unknown; never delete that funded signing key"
  );
  assert.match(
    uncertainFailure,
    /(?:plan\.pool\.push|plan\.activeWalletPublicKey\s*=|retain(?:ed)?VolumeWallet|queueVolumeWalletCleanup)/,
    "the funded wallet must remain discoverable by stop/sweep recovery"
  );
});

test("rolling volume is continuous and exact-one-token cleanup is server enforced", () => {
  const start = functionBody(serverSource, "webStartVolumeBotCore");
  const rolling = functionBody(serverSource, "runRollingVolumeBotStep");
  const row = functionBody(serverSource, "webVolumeBotRow");

  assert.match(start, /const keepDust = true/);
  assert.doesNotMatch(start, /const keepDust = Boolean\(body\.keepDust\)/);
  assert.match(start, /rollingWallets: true, continuous: true, maxRounds: 0/);
  assert.match(start, /until Stop or source SOL runs low/);
  assert.doesNotMatch(rolling, /roundsDone\s*<\s*maxRounds|Buy quota reached/);
  assert.match(rolling, /getSolBalanceCached\(decryptWallet\(sourceRecord\)\.publicKey, \{ force: true \}\)/);
  assert.match(rolling, /Source SOL spent/);
  assert.match(row, /continuous: rolling/);
});

test("normal balance hydration excludes hidden volume wallets before any RPC fan-out", () => {
  const balances = functionBody(serverSource, "webBalanceRows");
  const hydrationAt = balances.indexOf("primeSolBalancesBatch(");
  assert.ok(hydrationAt >= 0, "batched balance hydration is missing");

  const beforeHydration = balances.slice(0, hydrationAt);
  assert.match(
    beforeHydration,
    /filter\([\s\S]{0,180}wallet\.volumeBot[\s\S]{0,180}wallet\.ephemeral/,
    "volume/ephemeral wallets must be removed before priming RPC balance reads"
  );
  assert.match(
    balances,
    /runWithConcurrency\((?:visibleWallets|wallets),/,
    "token-account hydration must use the same already-filtered wallet list"
  );
});

test("volume start freezes the source wallet index to the public key selected in Fun", () => {
  const start = functionBody(serverSource, "webStartVolumeBotCore");
  const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");

  assert.match(start, /assertFrozenManagedWallet\(/);
  assert.match(start, /getWalletAt\(store, sourceIndex, userId\)/);
  assert.match(start, /body\.sourceWalletPublicKey/);
  assert.match(funSource, /sourceWalletPublicKey\s*:/);
});

test("wallet/trade-plan/web-auth stores are mutated under a per-file lock", () => {
  assert.match(serverSource, /async function mutateWalletStore\(fn\)/);
  assert.match(serverSource, /async function mutateTradePlans\(fn\)/);
  assert.match(serverSource, /async function mutateWebAuthStore\(fn\)/);
  // The wallet creators/importers/taggers go through it (lost-update = lost funds).
  assert.match(functionBody(serverSource, "createWebWalletSet"), /mutateWalletStore\(/);
  assert.match(functionBody(serverSource, "importWebWallet"), /mutateWalletStore\(/);
  assert.match(functionBody(serverSource, "getSubDepositWallet"), /mutateWalletStore\(/);
  // audit log is capped + locked (was unbounded O(n) write per money op).
  assert.match(functionBody(serverSource, "audit"), /withFileLock\(auditPath\(\)/);
  assert.match(functionBody(serverSource, "audit"), /slice\(-2000\)/);
});

test("subscription grant is idempotent + re-entrancy-guarded (no stacked free time)", () => {
  const body = functionBody(serverSource, "checkSubscriptionPayments");
  assert.match(body, /if \(subWatcherRunning\) return/);
  assert.match(body, /subDepositGrantLedger/);
  assert.match(body, /balLamports - grantedFor >= thresholdLamports/);
});

test("Telegram webhook setup timeouts do not kill the web service deploy", () => {
  const main = functionBody(serverSource, "main");
  assert.match(main, /const webhookReady = await setupWebhook\(\)/);
  assert.match(main, /scheduleWebhookSetupRetry\(\)/);
  assert.match(serverSource, /function scheduleWebhookSetupRetry\(attempt = 1\)/);
  const setup = functionBody(serverSource, "setupWebhook");
  assert.match(setup, /catch \(error\)/);
  assert.match(setup, /setWebhook failed[\s\S]*return false/);
  assert.match(setup, /TELEGRAM_WEBHOOK_SECRET is required/);
});

test("sweeps run bounded-concurrent (not serial N+1) + referral writes are locked", () => {
  assert.match(functionBody(serverSource, "webSweepSolCore"), /runWithConcurrency\(wallets,/);
  assert.match(functionBody(serverSource, "webSweepTokens"), /runWithConcurrency\(wallets,/);
  // Referral payout stats RMW (runs on the fee path) is locked + records every split wallet, not just #1.
  assert.match(functionBody(serverSource, "recordReferralFeePayout"), /mutateWebAuthStore\(/);
  assert.match(functionBody(serverSource, "recordReferralFeePayout"), /wallets\[w\] = \{ lamports:/);
  assert.match(functionBody(serverSource, "updateWebReferralProfile"), /mutateWebAuthStore\(/);
});

test("Meteora dark-rail gate covers the custom-curve branch too", () => {
  const body = functionBody(serverSource, "webLaunchMeteoraDbc");
  // The enablement throw must come BEFORE the customCurve branch (not be nested inside !customCurve).
  const gateIdx = body.indexOf("METEORA_RAIL_NOT_ENABLED");
  const customIdx = body.indexOf("if (customCurve) {");
  assert.ok(gateIdx > -1 && customIdx > -1 && gateIdx < customIdx, "rail gate must precede the custom-curve send path");
  // On-chain confirmation errors are now surfaced, not silently ignored.
  assert.match(body, /METEORA_CONFIG_TX_FAILED|METEORA_POOL_TX_FAILED/);
});

test("vanity pool auto-enables from a pool file + has an owner-gated load endpoint", () => {
  assert.match(serverSource, /function ensureVanityPool\(\)/);
  // Enable when the env flag is on OR a pool file already has keys (no env edit needed once loaded).
  assert.match(functionBody(serverSource, "ensureVanityPool"), /!CONFIG\.launchVanityEnabled && vanityPoolFileKeyCount\(\) === 0/);
  assert.match(serverSource, /async function webLoadVanityPool\(/);
  // Load route is OWNER-KEY gated (it accepts secret mint keypairs).
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/vanity-pool"/);
  assert.match(serverSource, /Owner key required to load the vanity pool/);
});

test("promoter fee-split: stored on the coin + idempotent split-send reusing the proven math", () => {
  // creatorFeeSplit normalized onto the launch payload via the proven referral-split helper.
  assert.match(serverSource, /creatorFeeSplit: normalizeReferralPayoutSplit\(body\.creatorFeeSplit\)/);
  assert.match(functionBody(serverSource, "webSplitCreatorFees"), /runIdempotentMoneyOp\("web-split-fees", userId/);
  assert.match(functionBody(serverSource, "webSplitCreatorFeesCore"), /splitReferralLamports\(/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/split-creator-fees"/);
});

test("creator-fee claim: list launches + in-app claim via PumpPortal collectCreatorFee", () => {
  assert.match(serverSource, /async function webLaunchedCoins\(userId\)/);
  assert.match(serverSource, /pathname === "\/api\/web\/launches"/);
  const claim = functionBody(serverSource, "webClaimCreatorFeesCore");
  assert.match(claim, /action: "collectCreatorFee"/);
  assert.match(claim, /requestPumpPortalLocalTransaction/);
  assert.match(claim, /meteora-dbc/);                       // meteora claim path
  assert.match(claim, /after - before/);                    // reports the SOL that actually landed
  // Empty creator wallets can't pay the claim's own fee -> top up from a sibling + retry, send via
  // plain RPC (no Jito tip so it needs less SOL up front).
  assert.match(claim, /topUpSellFees/);
  assert.match(claim, /isInsufficientFeeError/);
  assert.match(claim, /sendVersionedTransaction/);
  assert.doesNotMatch(claim, /sendPumpTradeTx/);            // must NOT use the Jito-tipped trade path
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/claim-fees"/);
  assert.match(functionBody(serverSource, "webClaimCreatorFees"), /runIdempotentMoneyOp\("web-claim-fees"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /GG\.launchesModal\(\)/);
    assert.match(src, /\/api\/web\/launch\/claim-fees/);
  }
});

test("Robinhood Chain rail: derived EVM wallet + self-deployed ERC-20 (gas-estimated first, idempotent)", () => {
  // Server: routes + idempotent launch that records into the launches tracker.
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/wallet"/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/rh-coin"/);
  assert.match(functionBody(serverSource, "webLaunchRhCoin"), /runIdempotentMoneyOp\(\s*"web-rh-launch"/);
  const core = functionBody(serverSource, "webLaunchRhCoinCore");
  assert.match(core, /rhDeployToken/);
  assert.match(core, /rail: "robinhood"/);
  assert.match(core, /upsertPumpLaunchAttempt/);
  // Chain lib: deterministic EVM key from the wallet's existing seed; estimate gas BEFORE sending so a
  // broken/underfunded deploy costs nothing; fixed-supply no-owner ERC-20 artifact is committed.
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  assert.match(rhLib, /slimewire-evm-v1/);
  assert.match(rhLib, /estimateGas/);
  assert.match(rhLib, /4663/);
  const artifact = JSON.parse(fs.readFileSync(new URL("../src/lib/rh-erc20.json", import.meta.url), "utf8"));
  assert.ok(artifact.bytecode.startsWith("0x") && artifact.bytecode.length > 1000, "compiled ERC-20 bytecode is vendored");
  assert.ok(artifact.abi.some((e) => e.type === "constructor"), "artifact has constructor ABI");
  // UI: 4th rail + deploy branch in both mirrors.
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /data-rail="robinhood"/);
    assert.match(src, /\/api\/web\/launch\/rh-coin/);
    assert.match(src, /function refreshRhSetup/);
  }
});

test("web managed wallets can be renamed without touching wallet secrets", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/wallets\/rename"/);
  const rename = functionBody(serverSource, "renameWebWallet");
  assert.match(rename, /mutateWalletStore\(/);
  assert.match(rename, /wallet\.label = label/);
  assert.doesNotMatch(rename, /decryptWallet\(/);
  assert.doesNotMatch(rename, /encryptedSecretKey\s*=/);
  assert.match(appSource, /data-wallet-rename-input/);
  assert.match(appSource, /data-rename-wallet/);
  assert.match(functionBody(appSource, "renameManagedWallet"), /\/api\/web\/wallets\/rename/);
  assert.match(indexSource, /data-rename-wallet-input/);
  assert.match(indexSource, /data-rename-wallet-btn/);
  assert.match(functionBody(indexSource, "renameWallet"), /\/api\/web\/wallets\/rename/);
});

test("Wallet Launch Snipe is launch-only and supports Solana creators plus Robinhood deployers", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/wallet-launch-snipe"/);
  assert.match(serverSource, /status: "wallet_launch_watch"/);
  assert.match(serverSource, /maybeWalletLaunchSnipe\(entry\)/);
  assert.match(serverSource, /async function instantRhWalletLaunchSnipe/);
  const pumpStreamBlock = serverSource.slice(
    serverSource.indexOf("const pumpPortalStream = createPumpPortalStream"),
    serverSource.indexOf("// --- Live Autopilot")
  );
  assert.match(pumpStreamBlock, /onCreation:[\s\S]*maybeWalletLaunchSnipe\(entry\)/);
  assert.match(pumpStreamBlock, /onTrade:\s*\([^)]*\)\s*=>\s*\{ recordEarlyBuyer/);
  assert.doesNotMatch(pumpStreamBlock.match(/onTrade:[^\n]+/)?.[0] || "", /maybeWalletLaunchSnipe/);
  assert.match(functionBody(serverSource, "normalizeWalletLaunchChain"), /robinhood/);
  assert.match(functionBody(serverSource, "webCreateWalletLaunchSnipe"), /amountEth/);
  assert.match(functionBody(serverSource, "webCancelLaunchWatch"), /row\.status !== "launch_watch" && row\.status !== "wallet_launch_watch" && row\.status !== "copy_wallet_watch"/);
  assert.match(functionBody(serverSource, "webCancelLaunchWatch"), /refreshWalletLaunchWatchCreators/);
  assert.match(functionBody(serverSource, "webLaunchWatches"), /plan\.status === "copy_wallet_watch"/);
  assert.match(functionBody(serverSource, "webLaunchWatchRow"), /type: "kol_copy_wallet"/);
  assert.match(functionBody(serverSource, "executeSolWalletLaunchSnipe"), /webCreateManagedBuyPlan/);
  assert.match(functionBody(serverSource, "executeSolWalletLaunchSnipe"), /trustedLaunchMint: true/);
  assert.match(functionBody(serverSource, "executeRhWalletLaunchSnipe"), /webRhBundleCore/);
  assert.match(functionBody(serverSource, "executeRhWalletLaunchSnipe"), /webRhArmGuard/);
  assert.doesNotMatch(functionBody(serverSource, "executeRhWalletLaunchSnipe"), /webCreateManagedBuyPlan/);
  assert.match(functionBody(serverSource, "processWalletLaunchWatchPlan"), /plan\.seenLaunches = uniqueStrings[\s\S]*executeRhWalletLaunchSnipe[\s\S]*executeSolWalletLaunchSnipe/);
  assert.match(appSource, /Wallet Launch Snipe/);
  assert.match(appSource, /\["walletLaunch", "Wallet Snipe"\]/);
  assert.match(functionBody(appSource, "renderTabs"), /state\.activeTab === "walletLaunch"[\s\S]*launchHtml\(\{ walletLaunchFirst: true \}\)/);
  assert.match(functionBody(appSource, "launchWatchesHtml"), /filter === "wallet"/);
  assert.match(functionBody(appSource, "launchWatchesHtml"), /filter === "manual"[\s\S]*!isWalletLaunch && !isCopyWallet/);
  assert.match(functionBody(appSource, "launchWatchesHtml"), /isWalletLaunch \|\| isCopyWallet \? "Stop" : "Cancel"/);
  assert.match(functionBody(appSource, "cancelLaunchWatch"), /stoppedCopyWallet[\s\S]*state\.activeTab = stoppedWalletLaunch \? "walletLaunch" : stoppedCopyWallet \? "kol" : "launch"/);
  assert.match(functionBody(appSource, "kolCopyWatchesHtml"), /kol_copy_wallet/);
  assert.match(indexSource, /function activeCopyWalletsHtml/);
  assert.match(indexSource, /data-copy-stop/);
  assert.match(indexSource, /\/api\/web\/launch\/cancel/);
  assert.match(appSource, /data-wallet-launch-chain/);
  assert.match(appSource, /data-wallet-launch-start/);
  assert.match(functionBody(appSource, "readWalletLaunchSnipeForm"), /Robinhood launch wallets must be 0x deployer addresses/);
  assert.match(indexSource, /route:"walletLaunch"/);
  assert.match(functionBody(indexSource, "renderWalletLaunch"), /\/api\/web\/wallet-launch-snipe/);
  assert.match(functionBody(indexSource, "renderWalletLaunch"), /Normal buys, sells, and rotations from that wallet are ignored/);
  assert.match(functionBody(indexSource, "loadWalletLaunchWatches"), /\/api\/web\/launch\/watches/);
  assert.match(functionBody(indexSource, "walletLaunchWatchListHtml"), /data-wl-stop/);
  assert.match(functionBody(indexSource, "renderWalletLaunch"), /\/api\/web\/launch\/cancel/);
});

test("site function scan: every GG.* used has an export; every client API path has a server route", () => {
  for (const src of [ggSource, indexSource]) {
    const used = new Set([...src.matchAll(/GG\.([A-Za-z_$][\w$]*)/g)].map((m) => m[1]));
    const start = src.indexOf("window.GG={");
    assert.ok(start > 0, "window.GG export block exists");
    let depth = 0, end = start;
    for (let i = src.indexOf("{", start); i < src.length; i += 1) {
      if (src[i] === "{") depth += 1;
      else if (src[i] === "}") { depth -= 1; if (depth === 0) { end = i + 1; break; } }
    }
    const block = src.slice(start, end);
    const exported = new Set([...block.matchAll(/(?:^|[,{\s])([A-Za-z_$][\w$]*)\s*(?=[:,}])/g)].map((m) => m[1]));
    const missing = [...used].filter((n) => !exported.has(n));
    assert.deepEqual(missing, [], `GG functions used in markup but not exported: ${missing.join(", ")}`);
    const paths = new Set([...src.matchAll(/["'](\/api\/web\/[a-z0-9\-\/]+)["'?]/gi)].map((m) => m[1]));
    const prefixes = [...serverSource.matchAll(/pathname\.startsWith\("([^"]+)"\)/g)].map((m) => m[1]);
    const dead = [...paths].filter((p) => !serverSource.includes(`pathname === "${p}"`) && !prefixes.some((x) => p.startsWith(x)));
    assert.deepEqual(dead, [], `client calls API paths with no server route: ${dead.join(", ")}`);
  }
});

test("Robinhood Chain: coin feed + wallet holdings + SOL->ETH funding (Relay)", () => {
  // Server: public feed + image registry; auth-gated funding swap, idempotent.
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/pairs"/);
  assert.match(serverSource, /pathname\.startsWith\("\/api\/web\/rh\/token-image\/"\)/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/fund-with-sol"/);
  assert.match(functionBody(serverSource, "webRhFundWithSol"), /runIdempotentMoneyOp\("web-rh-fund"/);
  const fund = functionBody(serverSource, "webRhFundWithSolCore");
  assert.match(fund, /relayQuoteSolToRhEth/);
  assert.match(fund, /TransactionMessage/);            // builds + signs the Relay Solana tx
  assert.match(functionBody(serverSource, "webRhPairs"), /rhFeedTokens/);
  assert.match(functionBody(serverSource, "webLaunchRhCoinCore"), /saveRhTokenImage/); // PFP registry
  // Client: Trenches tab + wallet fold + funding button in both mirrors.
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /\["rh","🪶 Robinhood"\]/);
    assert.match(src, /function renderRhBoard/);
    assert.match(src, /\/api\/web\/rh\/pairs\?category=/);
    assert.match(src, /function loadRhWalletPanel/);
    assert.match(src, /\/api\/web\/rh\/fund-with-sol/);
  }
});

test("Robinhood Chain: every user sell automatically returns to SOL through the gas-reserved reverse bridge", () => {
  // Server: auth-gated, idempotent cash-out endpoint that delivers to the wallet's OWN Solana address.
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/bridge-to-sol"/);
  assert.match(functionBody(serverSource, "webRhBridgeToSol"), /runIdempotentMoneyOp\("web-rh-bridge-sol"/);
  const out = functionBody(serverSource, "webRhBridgeToSolCore");
  assert.match(out, /rhBridgeEthToSol/);
  assert.match(out, /keypair\.publicKey\.toBase58\(\)/);        // recipient = the wallet's OWN SOL address
  assert.match(out, /SOLANA_USDC_MINT/);                         // fallback when native SOL has no solver
  assert.match(out, /usdcReceivedRaw/);                          // converts only the exact delivered delta
  assert.match(out, /executeJupiterSwap/);                       // fallback still finishes as native SOL
  assert.match(out, /settlementPending/);                        // honest if cross-chain delivery is still pending
  // Lib: the reverse Relay route (RH 4663 -> Solana, native ETH -> native SOL) with a gas reserve left behind.
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  const bridge = functionBody(rhLib, "rhBridgeEthToSol");
  assert.match(bridge, /originChainId: RH_CHAIN_ID/);
  assert.match(bridge, /destinationChainId: RELAY_SOLANA_CHAIN_ID/);
  assert.match(bridge, /gasReserveEth/);                        // never drains the wallet's gas
  assert.match(bridge, /rhExecuteEvmSteps/);
  assert.match(bridge, /NO_SWAP_ROUTES_FOUND/);
  assert.match(bridge, /solanaUsdc/);
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /side === "sell"[\s\S]*webRhBridgeToSolCore/);
  assert.match(trade, /toLowerCase\(\) !== "rh_volume"/);
  assert.match(trade, /solCashoutError/);
  // Client: ordinary trades remain automatic, while explicit recovery controls stay available.
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /SOL in for buys · SOL back on sells/);
    assert.match(src, /settle back to SOL without another button/);
    assert.match(src, /id="rhOutBtn"/);
    assert.match(src, /id="rhFundBtn"/);
    assert.match(src, /id="rhSendBtn"/);
    assert.match(src, /function rhSendEth/);
    assert.match(src, /\/api\/web\/rh\/send-eth/);
  }
});

test("Robinhood coins are tradeable in-app with SOL-first automatic network conversion", () => {
  // Server: buy/sell endpoint routed through Relay same-chain swaps; sells execute approve+swap in order.
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/trade"/);
  assert.match(functionBody(serverSource, "webRhTrade"), /runIdempotentMoneyOp\("web-rh-trade"/);
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /relayQuoteRhSwap/);
  assert.match(trade, /rhExecuteEvmSteps/);
  assert.match(trade, /rhErc20Balance/);                     // sell sizes off the real on-chain balance
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  assert.match(rhLib, /rhExecuteEvmSteps/);
  assert.match(rhLib, /const est = await wallet\.estimateGas\(request\)/); // every swap tx simulated before sending
  assert.match(rhLib, /request\.gasLimit = \(est \* 16n\) \/ 10n/);        // + gas buffer so tax tokens don't OOG
  // Funding hardening: balance pre-check before quoting + defensive hex prefix strip.
  const fund = functionBody(serverSource, "webRhFundWithSolCore");
  assert.match(fund, /solBal < lamports/);
  assert.match(fund, /replace\(\/\^0x\/i, ""\)/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhTradeModal/);
    assert.match(src, /\/api\/web\/rh\/trade/);
    assert.match(src, /GG\.rhBuy/);
    assert.match(src, /GG\.rhSell/);
    assert.match(src, /One balance, both chains/);           // no manual network-funding section
    assert.match(src, /body\.payCurrency="SOL";body\.amountSol/);
    assert.doesNotMatch(src, /Get Robinhood Chain ETH/);
    assert.match(src, /rhWalSel/);                           // per-wallet ETH accounts in the fold
    // Confident launch copy — no "first"/"no launchpad exists" framing.
    assert.doesNotMatch(src, /no launchpad exists (on it|here)/i);
    assert.doesNotMatch(src, /one of the first devs|You'd be one of the first/i);
  }
});

test("Robinhood ETH sends are wallet-scoped, idempotent, recoverable, and leave network gas", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/send-eth"/);
  assert.match(functionBody(serverSource, "webRhSendEth"), /runIdempotentMoneyOp\([\s\S]*"web-rh-send-eth"/);
  const plan = functionBody(serverSource, "webRhSendEthPlan");
  assert.match(plan, /assertFrozenManagedWallet/);
  assert.match(plan, /sourceAddress\.toLowerCase\(\) === destination\.toLowerCase\(\)/);
  assert.match(plan, /RH_ETH_SEND_RESERVE_WEI/);
  assert.match(plan, /amountWei \+ RH_ETH_SEND_RESERVE_WEI > balanceWei/);
  const send = functionBody(serverSource, "webRhSendEthCore");
  assert.match(send, /rhTransferEth/);
  assert.match(send, /audit\("web_rh_send_eth"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /Robinhood \/ ETH Backup/);
    assert.match(src, /Convert SOL to Robinhood ETH/);
    assert.match(src, /Return ETH to this wallet/);
    assert.match(src, /Send Robinhood ETH to another 0x wallet/);
  }
});

test("Telegram Robinhood quick trades use the funded/holding wallet and keep a durable receipt", () => {
  const callback = functionBody(serverSource, "handleRhQuickTradeCallback");
  assert.match(callback, /selectTgRhSolWallet\(userId, amt\)/);
  assert.match(callback, /walletIndex: String\(selected\.walletIndex\), walletPublicKey: selected\.wallet\.publicKey/);
  assert.match(callback, /selectTgRhTokenWallet\(userId, tokenAddress\)/);
  assert.match(callback, /telegram\("editMessageText"/);             // slow bridge progress becomes the receipt
  assert.match(callback, /createHash\("sha256"\)[\s\S]*query\.id/); // one Telegram tap = one stable attempt
  assert.doesNotMatch(callback, /walletIndex:\s*"1"/);               // never silently force Wallet 1

  const funded = functionBody(serverSource, "selectTgRhSolWallet");
  assert.match(funded, /!wallet\.volumeBot && !wallet\.ephemeral/);   // don't spend from ghost wallets
  assert.match(funded, /2_500_000/);                                  // bridge amount plus Solana fees
  assert.match(funded, /runWithConcurrency/);                          // bounded lookup across multiple wallets

  const holding = functionBody(serverSource, "selectTgRhTokenWallet");
  assert.match(holding, /rhErc20Balance/);
  assert.match(holding, /tokenRaw/);

  const route = functionBody(serverSource, "handleCallback");
  assert.match(route, /callbackOwnsAck[\s\S]*"rqbp:"[\s\S]*"rqb:"[\s\S]*"rqs:"/);
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /walletPublicKey: wallet\.publicKey/);          // freeze wallet through the SOL bridge
  const fund = functionBody(serverSource, "webRhFundWithSolCore");
  assert.match(fund, /assertFrozenManagedWallet/);
});

test("Telegram Buy is CA-first and scan/buy cards recover explicit 24h volume", () => {
  const callback = functionBody(serverSource, "handleCallback");
  assert.match(callback, /case "trade_buy":[\s\S]*step: "dm_buy_ca"/);
  const flow = functionBody(serverSource, "continueFlow");
  assert.match(flow, /case "dm_buy_ca":[\s\S]*resolveScanTargetFromText/);
  assert.match(flow, /sendDmCaBuyPanel/);
  const panel = functionBody(serverSource, "sendDmCaBuyPanel");
  assert.match(panel, /telegramQuickBuyPanelKeyboard/);
  assert.match(panel, /24h Vol/);
  assert.doesNotMatch(panel, /shield|verdict|scam/i); // Buy choice stays a buy panel, not a scan verdict

  const gather = functionBody(serverSource, "gatherSlimeScan");
  assert.match(gather, /scanVolumeWindowValue\("h24", meta, bonding, best\)/);
  const stats = functionBody(serverSource, "scanMarketStatsFromSources");
  assert.match(stats, /volume24h: Number\(volume24h\)/);
  const solCard = functionBody(serverSource, "formatSlimeScanCard");
  assert.match(solCard, /volume24h > 0[\s\S]*<i>24h<\/i>/);
  const solBuyCard = functionBody(serverSource, "postGroupBuy");
  assert.match(solBuyCard, /cardVol24/);
  assert.match(solBuyCard, /24h Vol/);
  const rhVolume = functionBody(serverSource, "rhVolumeInfo");
  assert.match(rhVolume, /info\.vol24/);
  assert.doesNotMatch(rhVolume, /info\.vol1/);
  assert.match(functionBody(serverSource, "postGroupBuyRh"), /24h Vol/);
});

test("RH trading fees stay fixed while the optional referral share comes from the total", () => {
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /const feeBps = BigInt\(CONFIG\.baseTradeFeeBps\)/);
  assert.doesNotMatch(trade, /CONFIG\.baseTradeFeeBps \+ \(referralTarget/);
  assert.match(trade, /splitTradeFeeAllocation/);
  assert.match(trade, /const ownerWei = feeSplit\.ownerAmount/);
  assert.match(trade, /amountRaw -= feeWei/);                // buys: fee off the ETH going in
  assert.match(trade, /rhTransferEth/);                      // skim to the platform RH fee account
  assert.match(trade, /rhFeeEvmWallet/);
  assert.match(trade, /web_rh_fee_skim_failed/);             // failed skim logs, never breaks the trade
  assert.match(trade, /scheduleRhFeeSweep\(\)/);
  const sweep = functionBody(serverSource, "scheduleRhFeeSweep");
  assert.match(sweep, /rhSweepFeesToSol/);
  assert.match(sweep, /CONFIG\.feeWallet/);                  // SOL lands in the SAME fee wallet
  assert.match(sweep, /600_000/);                            // debounced
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  assert.match(rhLib, /slimewire-rh-fee-v1/);                // fee key derived from APP_SECRET
  assert.match(rhLib, /RELAY_SOLANA_CHAIN_ID/);
  assert.match(functionBody(rhLib, "rhSweepFeesToSol"), /gasReserveEth/); // never strands the fee account
});

test("RH board acts like the Solana boards: live MC/liq data, chart, quick-buy, hold-gated sell, positions", () => {
  for (const src of [ggSource, indexSource]) {
    // DexScreener enrichment (indexes Robinhood Chain) fills MC/liq/vol/price/pfp/socials on RH rows.
    assert.match(src, /function rhEnrichRows/);
    assert.match(src, /o\.pair/);                                    // pair address captured -> chart
    assert.match(src, /dexscreener\.com\/robinhood\//);              // chart embed in the trade modal
    assert.match(src, /GG\.rhQuick\(/);                              // ⚡ quick-buy on rows
    assert.match(src, /rhTmSellSec/);                                // sell section exists...
    assert.match(src, /display:none"><div style="font-size:11px[^"]*">Sell/); // ...hidden until holding
    assert.match(src, /Robinhood Chain bags/);                       // RH positions section in Portfolio
    assert.match(src, /GG\.rhSellPos/);
    assert.match(src, /function loadRhPositions/);
  }
});

test("Robinhood Positions discovers every managed wallet live and keeps wallet-scoped actions", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/wallets"/);
  const wallets = functionBody(serverSource, "webRhWallets");
  assert.match(wallets, /walletsForOwner/);
  assert.match(wallets, /!wallet\.volumeBot && !wallet\.ephemeral/);
  assert.match(wallets, /readRhTradeHistory/);                 // confirmed buys fill the indexer gap
  assert.match(wallets, /readPumpLaunchAttempts/);            // creator bag is also a live candidate
  assert.match(wallets, /rhErc20Balance/);                    // positive balance must be proven on-chain
  for (const src of [ggSource, indexSource]) {
    const positions = functionBody(src, "loadRhPositions");
    assert.match(positions, /\/api\/web\/rh\/wallets/);
    assert.match(positions, /heldWallets/);
    assert.match(positions, /GG\.rhSellPos[\s\S]*Number\(w\.walletIndex\)/);
    assert.match(positions, /GG\.rhSendToken[\s\S]*Number\(w\.walletIndex\)/);
    assert.match(positions, /GG\.rhGuardModal[\s\S]*Number\(w\.walletIndex\)/);
    assert.match(functionBody(src, "rhTrade"), /tradeOpts\.walletIndex\|\|state\.activeWallet/);
    assert.match(src, /rhSellPos:async\(a,p,w\)/);
  }
});

test("Robinhood launch-wave buys and sells safely requote without duplicating unknown submissions", () => {
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /fundingTry <= 3/);
  assert.match(trade, /routeRound <= 4/);
  assert.match(trade, /error\?\.tradeSubmissionAmbiguous/);
  assert.match(trade, /isRetryableSwapError/);
  assert.match(trade, /await rhExecuteEvmSteps/);
  const tick = functionBody(serverSource, "rhAutoBundleTick");
  assert.match(tick, /needs_attention/);
  assert.match(tick, /b\.rows/);                               // exact failed wallet is preserved for support/retry
  assert.match(tick, /result\.summary/);
});

test("SlimeCash has native multi-wallet coin positions, exact-wallet sells, and RH fund recovery", () => {
  const cash = fs.readFileSync(new URL("../web/public/cash/cash.js", import.meta.url), "utf8");
  const cashHtml = fs.readFileSync(new URL("../web/public/cash/index.html", import.meta.url), "utf8");
  assert.match(cashHtml, /id="view-trade"/);
  assert.match(cashHtml, /id="cashPositions"/);
  const load = functionBody(cash, "loadCashPositions");
  assert.match(load, /\/api\/web\/positions\?fast=true/);
  assert.match(load, /\/api\/web\/rh\/wallets/);
  assert.match(load, /account\.walletPublicKey/);
  assert.match(load, /data-wallet-index/);
  assert.match(load, /Robinhood ETH wallets/);
  assert.match(load, /data-rh-wallet-tools/);
  const sell = functionBody(cash, "sellCashPosition");
  assert.match(sell, /walletIndex/);
  assert.match(sell, /\/api\/web\/rh\/trade/);
  assert.match(sell, /\/api\/web\/trade\/sell/);
  assert.match(sell, /tradeAttemptId/);
  const recover = functionBody(cash, "cashOutRhWallet");
  assert.match(recover, /\/api\/web\/rh\/bridge-to-sol/);
  assert.match(recover, /amountEth: "all"/);
  assert.match(recover, /rhCashoutAttempt/);                     // retry reuses the same money operation id
  assert.match(recover, /settlementPending/);
});

test("Telegram balances and Positions include Robinhood bags from the managed wallet's derived account", () => {
  const snapshots = functionBody(serverSource, "buildTelegramRhWalletSnapshots");
  assert.match(snapshots, /evmAddressFromSolana/);
  assert.match(snapshots, /rhAddressTokens/);                         // broad indexed holdings
  assert.match(snapshots, /rhErc20Balance/);                          // fresh direct-chain balance
  assert.match(snapshots, /auditPath/);                               // just-bought fallback before indexing
  assert.match(snapshots, /!wallet\.volumeBot && !wallet\.ephemeral/); // never expose operational wallets

  const balances = functionBody(serverSource, "showWalletBalances");
  assert.match(balances, /buildTelegramRhWalletSnapshots/);
  assert.match(balances, /Robinhood tokens:/);
  assert.match(balances, /Robinhood ETH:/);

  const positions = functionBody(serverSource, "showPositionsOverview");
  assert.match(positions, /aggregateTelegramRhPositions/);
  assert.match(positions, /Robinhood Chain bags/);
  assert.match(positions, /callback_data: `rqs:100:\$\{position\.tokenAddress\}`/); // sell from the actual RH holder
});

test("pasting your managed Solana wallet into Telegram also includes its linked Robinhood bags", () => {
  const linked = functionBody(serverSource, "linkedManagedRhWalletScan");
  assert.match(linked, /walletsForOwner\(store, userId\)/);
  assert.match(linked, /entry\.publicKey === solanaAddress/);
  assert.match(linked, /evmAddressFromSolana\(keypair\.secretKey\)/);
  assert.match(linked, /rhWalletScan\(evmAddress/);

  const scan = functionBody(serverSource, "getWalletScan");
  assert.match(scan, /Promise\.all/);
  assert.match(scan, /linkedManagedRhWalletScan\(userId, a\)/);
  assert.match(scan, /mergeLinkedRhWalletScan\(solanaScan, rhScan\)/);

  const card = functionBody(serverSource, "formatWalletScanCard");
  assert.match(card, /Linked RH/);
  assert.match(card, /h\.chain === "robinhood" \? " · RH"/);
});

test("RH rows: quick-buy stays in frame on mobile + fresh coins always get MC (implied-price fallback)", () => {
  for (const src of [ggSource, indexSource]) {
    // Mobile layout contract: name truncates (flex:1;min-width:0), right-side chips fixed, row overflow
    // hidden, and the phone media query tightens .rhrow + hides the $price chip.
    assert.match(src, /flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap/);
    assert.match(src, /\.rhrow\{padding:8px 6px!important/);
    assert.match(src, /\.rhrow \.hideMb\{display:none\}/);
    assert.match(src, /no pool yet/);                          // honest empty-state on rows
    // Full-coverage enrichment: DexScreener caps 30 addrs/call — the board must CHUNK through all rows.
    assert.match(src, /chunks\.push\(addrs\.slice\(i,i\+30\)\)/);
    // One shared exact-address proxy + branded image fallback: no RH surface renders a blank/letter tile.
    assert.match(src, /function rhAvTileHtml/);
    assert.match(src, /function rhAvatarFail/);
    assert.match(src, /\/api\/web\/token-image\?mint=/);
    // Fallback avatars are now deterministic per-coin letter tiles (instant data-URI SVG,
    // unique per address) instead of five repeating mascot PNGs — long-tail RH coins publish
    // no artwork anywhere, so every coin still gets a distinct instant pfp.
    assert.match(src, /function letterAvatar/);
    assert.match(src, /data:image\/svg\+xml/);
    assert.match(src, /rhAvatar\(r,30\)/);
    assert.match(src, /function avatarSourceCandidates/);
    assert.match(src, /gateway\.pinata\.cloud\/ipfs/);
    assert.match(src, /dweb\.link\/ipfs/);
    assert.match(src, /data-avatar-mint/);
  }
  // Server: pool-implied price fallback (tiny quote x on-chain supply) fills MC for unindexed coins.
  assert.match(serverSource, /scheduleRhPriceFill/);
  assert.match(functionBody(serverSource, "webRhPairs"), /rhPriceCache/);
  assert.match(functionBody(serverSource, "webRhPairs"), /totalSupplyUi/);
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  assert.match(rhLib, /rhImpliedPriceUsd/);
  assert.match(rhLib, /rhEthUsd/);
});

test("RH coin click -> full chart+buy SCREEN (Solana-style), editable ⚡ presets, ETH labeled as balance", () => {
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /id="v-rhtrade"/);                       // dedicated view exists
    assert.match(src, /route==="rhtrade"/);                    // routed
    assert.match(src, /function renderRhTrade/);
    assert.match(src, /function rhTradeModal\(address\)\{go\("rhtrade",address\);\}/); // clicks navigate, not modal
    assert.match(src, /height:46vh/);                          // big chart pane
    assert.match(src, /function rhPresets/);                   // editable quick-buy presets
    assert.match(src, /function rhPresetModal/);
    assert.match(src, /ggRhPresets/);
    assert.match(src, /GG\.rhPresetModal/);
    assert.doesNotMatch(src, /ETH<\/b> gas/);                  // balance is ETH, not "gas"
    assert.doesNotMatch(src, /Gas balance:/);
  }
});

test("RH power tools: TP/SL guards + bundle + volume bot, all through the safe trade core", () => {
  // Guards: persisted, price-checked via pool-implied quotes, fired through webRhTradeCore, fail-capped.
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/guards"/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/guards\/cancel"/);
  const tick = functionBody(serverSource, "rhGuardTick");
  assert.match(tick, /rhImpliedPriceUsd/);
  assert.match(tick, /webRhTradeCore/);
  assert.match(tick, /failCount.*>= 3/s);
  assert.match(serverSource, /setInterval\(rhGuardTick/);
  // Bundle + volume both route every trade through webRhTradeCore (fees + gas-estimation inherited).
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/bundle"/);
  assert.match(functionBody(serverSource, "webRhBundle"), /runIdempotentMoneyOp\("web-rh-bundle"/);
  assert.match(functionBody(serverSource, "webRhBundleCore"), /webRhTradeCore/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/volume\/start"/);
  const rhVolumeStart = functionBody(serverSource, "webRhVolumeStart");
  assert.match(rhVolumeStart, /webRhTradeCore/);
  assert.match(rhVolumeStart, /fundSolPerWallet/);
  assert.match(rhVolumeStart, /webRhFundWithSol/);
  assert.match(rhVolumeStart, /payCurrency: solFunded \? "SOL" : "ETH"/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/volume\/stop"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhGuardModal/);
    assert.match(src, /function rhBundleModal/);
    assert.match(src, /function rhVolumeModal/);
    assert.match(functionBody(src, "rhVolumeModal"), /SOL budget per wallet/);
    assert.match(functionBody(src, "rhVolumeModal"), /fundSolPerWallet:fundSol/);
    assert.doesNotMatch(functionBody(src, "rhVolumeModal"), /Min \/ Max \(ETH\)/);
    assert.match(src, /🛠 Robinhood tools/);
    assert.match(src, /GG\.rhGuardModal/);
  }
});

test("Robinhood terminal exposes quick TP and executable market-cap limit orders", () => {
  const arm = functionBody(serverSource, "webRhArmGuard");
  const tick = functionBody(serverSource, "rhGuardTick");
  assert.match(arm, /"limit-buy", "limit-sell"/);
  assert.match(arm, /targetMarketCapUsd/);
  assert.match(arm, /targetPriceUsd = kind !== "exit" && supply > 0 \? targetMarketCapUsd \/ supply/);
  assert.match(arm, /triggerDirection: kind !== "exit" \? \(targetPriceUsd >= entryPriceUsd \? ">=" : "<="\)/);
  assert.match(tick, /hitLimit/);
  assert.match(tick, /kind === "limit-buy" \? "buy" : "sell"/);
  assert.match(tick, /payCurrency: "SOL", amountSol: guard\.amountSol/);
  assert.match(tick, /tradeAttemptId: `rh-order-\$\{guard\.id\}`/);
  for (const src of [ggSource, indexSource]) {
    const trade = functionBody(src, "renderRhTrade");
    const limit = functionBody(src, "rhLimitModal");
    assert.match(trade, /Take profit after buy/);
    assert.match(trade, /data-tp="25"/);
    assert.match(trade, /data-tp="50"/);
    assert.match(trade, /data-tp="100"/);
    assert.match(trade, /GG\.rhLimitModal/);
    assert.match(limit, /Buy at target MC/);
    assert.match(limit, /Sell at target MC/);
    assert.match(limit, /targetMarketCapUsd/);
    assert.match(functionBody(src, "rhBuyAmount"), /rhArmQuickTakeProfit/);
  }
});

test("RH: auto-bundle-when-pool-opens + coin age everywhere + 75% sells", () => {
  // Server: arm store + watcher folded into the guard tick (fires webRhBundleCore on pool detection).
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/auto-bundle"/);
  const abTick = functionBody(serverSource, "rhAutoBundleTick");
  assert.match(abTick, /rhImpliedPriceUsd/);
  assert.match(abTick, /webRhBundleCore/);
  assert.match(abTick, /noPool/);                              // keep waiting until a pool exists
  assert.match(abTick, /status = "firing"/);                  // persist before firing (no double-fire)
  assert.match(abTick, /launchWave: Boolean\(b\.launchWave\)/);
  assert.match(abTick, /walletConfigs: b\.walletConfigs/);
  assert.match(functionBody(serverSource, "webRhArmAutoBundle"), /launchWave: Boolean\(body\.launchWave\)/);
  const bundleCore = functionBody(serverSource, "webRhBundleCore");
  assert.match(bundleCore, /rhLaunchBundleWalletConfigs/);
  assert.match(bundleCore, /configByIndex\.get\(idx\)/);
  assert.match(bundleCore, /webRhArmGuard/);
  assert.match(bundleCore, /runWithConcurrency\(selectedWallets, Math\.min\(20, selectedWallets\.length\), buyOne\)/);
  assert.match(functionBody(serverSource, "rhGuardTick"), /rhAutoBundleTick/); // shares the interval
  // Age on Trending + chart (creation-time cache filled in background).
  assert.match(serverSource, /scheduleRhCreatedFill/);
  assert.match(functionBody(serverSource, "webRhPairs"), /rhCreatedCache/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhAutoBundleModal/);
    assert.match(functionBody(src, "renderLaunch"), /lcBundleWallets/);
    assert.match(functionBody(src, "renderLaunch"), /\/api\/web\/rh\/auto-bundle/);
    assert.match(functionBody(src, "renderLaunch"), /rhBody\.autoBundle=\{walletIndexes:rhBundleWallets,walletConfigs:rhBundleConfigs[\s\S]{0,120}launchWave:true/);
    assert.match(functionBody(src, "renderLaunch"), /!bundleArmed/);
    assert.match(src, /\[25,50,75,100\]/);                     // 75% sell added
    assert.match(src, /Age <b>/);                              // age in the coin-screen stats
    assert.match(src, /⏱/);                                    // age chip on rows
  }
});

test("unified tools: paste either chain's CA + auto round-trip moved to Wallet fold", () => {
  for (const src of [ggSource, indexSource]) {
    // One detector; Bundle + Volume route a 0x… CA into the Robinhood tools automatically.
    assert.match(src, /function detectChain/);
    assert.match(src, /detectChain\(ca\)==="robinhood"\)\{rhBundleModal\(ca\);return;\}/);
    assert.match(src, /detectChain\(ca\)==="robinhood"\)\{rhVolumeModal\(ca\);return;\}/);
    assert.match(src, /Paste a Solana or Robinhood \(0x…\) CA/);
    // Auto round-trip is now a Wallet fold, not a Volume-page box.
    assert.match(src, /function autoRoundTripFoldHtml/);
    assert.match(src, /⚡ Auto round-trip<span class="sub">flip liquid coins/);
    // The old Volume-page auto round-trip box is gone.
    assert.doesNotMatch(src, /wbox[^>]*><h3>⚡ Auto round-trip/);
  }
});

test("RH wallet: SOL-first routing panel + automatic settlement activity trail", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/activity"/);
  const act = functionBody(serverSource, "webRhActivity");
  assert.match(act, /web_rh_trade/);
  assert.match(act, /web_rh_guard_fired/);              // auto-sells surface here
  assert.match(act, /web_rh_bridge_sol/);               // automatic SOL settlement surfaces here
  assert.match(act, /blockscout\.com\/tx\//);            // each row links its on-chain tx
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /Automatic SOL routing/);
    assert.match(src, /SOL in for buys · SOL back on sells/);
    assert.match(src, /function loadRhActivity/);
    assert.match(src, /Auto-sold /);
    assert.match(src, /Returned to SOL/);
    assert.match(src, /\/api\/web\/rh\/activity/);
  }
});

test("RH honeypot guard: sell-sim + holder-reconciliation block real scams (NOT a gas heuristic)", () => {
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  const check = functionBody(rhLib, "rhHoneypotCheck");
  assert.match(check, /transfer/);                       // real transfer sim from a holder
  assert.match(check, /sellable = false/);               // revert -> can't sell -> block
  // Deployer BACKDOOR: creator calling transferFrom (0x23b872dd) to SEIZE a third party's tokens — the
  // exact HOODCAT drain (renounced on-chain, still drained buyers). Proven (burn or >=2 victims) = block.
  assert.match(check, /0x23b872dd/);
  assert.match(check, /backdoorProven/);
  assert.match(check, /SEIZES holders/);
  // DRAIN-SERVICE: the big one. A shared controller contract 16+ operators funnel tokens through — it
  // empties a buyer's balanceOf seconds after they buy with NO Transfer event (HOODCAT + BRODIE both used
  // it). We block any token whose deployer touches the known controller or calls the drain selector.
  assert.match(check, /DRAIN_CONTROLLERS/);
  assert.match(check, /0x2d7aa179b485d25fe89f8e1b26b9f3cc2668f615/);
  assert.match(check, /drainService/);
  assert.match(check, /balance-drain service/);
  // Only a seizure from a REAL WALLET (EOA) counts as a transferFrom drain — a transferFrom out of a
  // factory/pool CONTRACT is legit launchpad liquidity seeding. getCode() separates them; guard it.
  assert.match(check, /getCode/);
  assert.match(check, /launchpad infra/);
  // Buyer reconciliation samples RECENT BUYERS (from the pool), not top holders — top holders are the
  // scammer's own untouched wallets in a selective drain, so sampling them gives a false "ok".
  assert.match(check, /drains buyers/);
  // Gas is NOT a risk signal — every token on this chain is a ~79k-gas proxy, so a gas threshold flagged
  // everything (incl. legit RH stock tokens). Guard against re-introducing a transfer-gas warn.
  assert.doesNotMatch(check, /SIMPLE_TRANSFER_GAS \+ \d/);
  assert.doesNotMatch(check, /runs custom code on every transfer/);
  assert.match(check, /verdict = "block"/);
  // Server hard-blocks a "block" verdict on buys (fail-open only if the scan itself errors).
  assert.match(functionBody(serverSource, "webRhTradeCore"), /rhHoneypotCheck/);
  assert.match(functionBody(serverSource, "webRhTradeCore"), /verdict === "block"/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/safety"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function loadRhSafety/);
    assert.match(src, /verdict==="block"\)\{toast\("⛔ Blocked/);
    assert.match(src, /Scanning coin for honeypot/);
  }
});

test("RH drain audit: flags coins that took your tokens with no sale (received >> held)", () => {
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  const audit = functionBody(rhLib, "rhWalletTokenAudit");
  assert.match(audit, /balanceOf/);
  // Catches BOTH drain vectors: a VISIBLE seizure (a tx you didn't sign — MAXI) and an INVISIBLE balance
  // cut (no transfer — BRODIE). A real sale you signed leaves expected≈0 and is never flagged.
  assert.match(audit, /authorizedOut/);
  assert.match(audit, /seizedValue/);
  assert.match(audit, /const drained =/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/holdings-audit"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function loadRhDrainAudit/);
    assert.match(src, /rug \/ clawback/);
    assert.match(src, /\/api\/web\/rh\/holdings-audit/);
    // A drained bag reads 0 in the balance table — Positions surfaces it as a "rugged" row so a bought
    // coin never silently vanishes ("why isn't it in positions?").
    assert.match(src, /function rhDrainedRowsHtml/);
    assert.match(src, /Rugged bags/);
  }
  // Bottom tools bar is ALWAYS visible on mobile, on EVERY page (mobile has no top nav, so hiding it on
  // the coin/chart view stranded the user with no way to switch tabs). display:flex!important + NO
  // chartmode hide rule = it can never be hidden by a stray state.
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /\.botnav\{display:flex!important/);
    assert.doesNotMatch(src, /body\.chartmode \.botnav\{display:none\}/);
  }
});

test("RH feed: full coverage (holders + activity sources) + Safe tab of proven-safe pairs", () => {
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  // Freshness/coverage: the global time-ordered transfers feed catches launches the holder-sorted list buries.
  assert.match(rhLib, /export async function rhRecentActiveTokens/);
  assert.match(functionBody(rhLib, "rhRecentActiveTokens"), /token-transfers/);
  // Backend merges both sources + a server-side safety cache + a "safe" category that shows only ok/verified.
  assert.match(functionBody(serverSource, "rhFeedTokens"), /rhRecentActiveTokens/);
  assert.match(serverSource, /scheduleRhSafetyFill/);
  // Full coverage: pull the WHOLE universe in the background (not a few pages), + hide stocks (icon) +
  // exclude the scam operation's tokens outright. This board is memecoins only.
  assert.match(rhLib, /export async function rhScamTokenSet/);
  assert.match(serverSource, /scheduleRhUniverse/);
  assert.match(serverSource, /rhListTokens\(45\)/);
  assert.match(serverSource, /rhIsStockOrBluechip/);
  assert.match(serverSource, /robinhood\\.com\|coingecko/);
  assert.match(functionBody(serverSource, "rhFeedTokens"), /scam\.has\(addr\)/);
  assert.match(functionBody(serverSource, "webRhPairs"), /cat === "safe"/);
  assert.match(functionBody(serverSource, "webRhPairs"), /r\.safety === "ok" \|\| r\.safety === "verified"/);
  // UI: a Safe column that requests category=safe, a mobile tab switcher (one clean list, not 4 stacked
  // columns), and copy + socials on each row (parity with the Solana rows).
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /category=safe/);
    assert.match(src, /list-rhs/);
    assert.match(src, /data-rhtab/);       // mobile segmented switcher
    assert.match(src, /rhcol-on/);
    assert.match(src, /class="rhsoc"/);    // copy + socials strip on rows
    assert.match(src, /Copy contract address/);
  }
  // SlimeHood tab: a board of coins launched THROUGH SlimeWire on Robinhood (from the launch store).
  assert.match(functionBody(serverSource, "webRhPairs"), /cat === "slimewire"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function renderSlimeHood/);
    assert.match(src, /category=slimewire/);
    assert.match(src, /SlimeHood/);
    // Robinhood dev/bundle tab is SOL-first; network conversion is hidden behind the server.
    assert.match(src, /lcDevRhNote/);
    assert.match(src, /Min buy \(SOL\)/);
    assert.match(src, /payCurrency:"SOL",minSol/);
  }
  // "Make it buyable" — create + seed a Uniswap V3 pool so a launched coin can be bought. Gas-estimated
  // first (a bad setup reverts in simulation, costs nothing).
  assert.match(rhLib, /export async function rhCreatePoolAndSeed/);
  assert.match(functionBody(rhLib, "rhCreatePoolAndSeed"), /createAndInitializePoolIfNecessary/);
  assert.match(functionBody(rhLib, "rhCreatePoolAndSeed"), /estimateGas/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/create-pool"/);
  assert.match(serverSource, /rhCreatePoolAndSeed/);
  assert.match(functionBody(serverSource, "webRhCreatePool"), /webRhFundWithSol/);
  assert.match(functionBody(serverSource, "webRhBundleCore"), /payCurrency: "SOL"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhAddLiquidityModal/);
    assert.match(src, /\/api\/web\/rh\/create-pool/);
    assert.match(src, /Make it buyable/);
  }
});

test("RH board: per-coin safety badge + 'Safer only' filter + renounce signal", () => {
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  assert.match(functionBody(rhLib, "rhHoneypotCheck"), /ownerRenounced/);   // renounce read + returned
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhScanBoard/);
    assert.match(src, /function rhSaferOnly/);
    assert.match(src, /rhSaferChk/);
    assert.match(src, /class="rhsafe"/);                                    // per-row badge
    // Safer-only hides risky+block rows (the signal that actually catches HOODCAT-class).
    assert.match(src, /verdict==="warn"\|\|v\.verdict==="block"\)\?"none"/);
  }
});

test("RH verified-safe tier: exact-bytecode match to our no-rug contract = the only 100% guarantee", () => {
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  const check = functionBody(rhLib, "rhHoneypotCheck");
  assert.match(check, /getCode\(tokenAddress\)/);
  assert.match(check, /deployedBytecode/);
  assert.match(check, /verdict: "verified"/);
  assert.match(check, /verifiedSafe: true/);
  // Contract must NOT use immutable supply (else per-deploy bytecode differs and match breaks).
  const sol = fs.readFileSync(new URL("../contracts/SlimeTokenRH.sol", import.meta.url), "utf8");
  assert.doesNotMatch(sol, /immutable totalSupply/);
  // Artifact carries the runtime bytecode for the match.
  const artifact = JSON.parse(fs.readFileSync(new URL("../src/lib/rh-erc20.json", import.meta.url), "utf8"));
  assert.ok(artifact.deployedBytecode && artifact.deployedBytecode.startsWith("0x") && artifact.deployedBytecode.length > 1000);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /verdict==="verified"\?"✅"/);
    assert.match(src, /Verified safe/);
  }
});

test("RH creator fee: pump-style venue-side, automatic at launch, NOT baked into the token", () => {
  // Launch stores the enabled fee + recipient (the deployer wallet); it is NOT put in the token contract.
  const launch = functionBody(serverSource, "webLaunchRhCoinCore");
  assert.match(launch, /creatorFeeEnabled/);
  assert.match(launch, /rhCreatorFeeRecipient: creatorFeeEnabled \? result\.deployer/);
  assert.match(launch, /rhCreatorFeeBps: creatorFeeEnabled \? CONFIG\.rhCreatorFeeBps/);
  // Trade pays the creator their % in ETH at the venue (best-effort), separate from the platform fee.
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /creatorFeeBps/);
  assert.match(trade, /rhTransferEth\(keypair\.secretKey, cRecipient/);
  // The token contract itself carries NO fee logic (keeps ✅ Verified): _transfer moves the FULL value,
  // no deduction/skim in the transfer path.
  const sol = fs.readFileSync(new URL("../contracts/SlimeTokenRH.sol", import.meta.url), "utf8");
  assert.match(sol, /balanceOf\[to\] \+= value;/);          // recipient gets the full amount, untaxed
  assert.doesNotMatch(sol, /feeBps|_fee|taxRate|reflectionRate/);
  for (const src of [ggSource, indexSource]) {
    const render = functionBody(src, "renderLaunch");
    assert.doesNotMatch(render, /lcRhCreatorFee/);
    assert.match(render, /creatorFeeEnabled:true/);
    assert.match(render, /Creator fees are automatic/);
  }
});

test("launch form survives navigation + warns on no dev buy", () => {
  for (const src of [ggSource, indexSource]) {
    // Whole-form snapshot/restore so leaving the Launch page and coming back keeps text + images.
    assert.match(src, /function lcSnapshot\(\)/);
    assert.match(src, /function lcRestore\(\)/);
    assert.match(src, /state\.launchForm/);
    assert.match(src, /lroot\.oninput\s*=\s*lcSnapshot/);
    assert.match(src, /lcRestore\(\)/);
    // Image previews are re-shown from persisted state after the rebuild.
    assert.match(src, /state\.launchImg&&\$\("#lcImgPrev"\)/);
    // "No dev buy set" confirmation before launching with an empty first buy.
    assert.match(src, /function confirmModal\(/);
    assert.match(src, /No dev buy set/);
    // The same normalized value drives both the warning and payload, captured before
    // modal/auth awaits can rebuild the form or leave client state out of sync.
    assert.match(src, /function lcReadDevBuyAmount\(\)/);
    assert.match(src, /const requestedDevBuySol=lcReadDevBuyAmount\(\)/);
    assert.match(src, /if\(requestedDevBuySol>0\)\{body\.devBuyEnabled=true;body\.devBuySol=String\(requestedDevBuySol\)/);
  }
});

test("positive launch dev buy amount is authoritative across both web launchers and backend", () => {
  const app = functionBody(appSource, "readLaunchCoinDraft");
  assert.match(app, /const devBuySol = normalizedQuickBuyAmount/);
  assert.match(app, /devBuyEnabled: Number\(devBuySol\) > 0/);
  assert.match(appSource, /toggle\.checked = Number\(clean\) > 0/);
  assert.match(appSource, /data-launch-coin-dev-buy-enabled[^\n]+!event\.target\.checked[\s\S]{0,180}amount\.value = ""/);

  const server = functionBody(serverSource, "webLaunchPumpCoin");
  assert.match(server, /const devBuyAmountSol = cleanLaunchNumber\(body\.devBuySol/);
  assert.match(server, /const devBuyEnabled = devBuyAmountSol > 0/);
  assert.match(server, /amountSol: devBuyAmountSol/);
});

test("launch UI is Pump-simple: Pump + Robinhood only, NFT-ready tabs, dormant tools stay off-page", () => {
  for (const src of [ggSource, indexSource]) {
    const render = functionBody(src, "renderLaunch");
    assert.match(render, /tb\("coin","Coin"\)\+tb\("social","Socials"\)\+tb\("nft","NFT Collection"\)\+tb\("dev","Dev &amp; Bundle"\)/);
    assert.match(render, /data-rail="pump"/);
    assert.match(render, /data-rail="robinhood"/);
    assert.doesNotMatch(render, /data-rail="bonk"|data-rail="meteora"/);
    assert.doesNotMatch(render, /Chat &amp; Live|Presale escrow|Mayhem/);
    assert.match(render, /Coin image/);
    assert.match(render, /Banner/);
    assert.match(render, /Robinhood Chain · pay with SOL/);
    assert.match(src, /Pay only with SOL/);
    assert.doesNotMatch(render, /lcRhFundSol|Min buy \(ETH\)|Max buy \(ETH\)/);
    const tools = src.slice(src.indexOf("const TOOLS=["), src.indexOf("function toolLinkHtml"));
    for (const hiddenTool of ["Launch OS — complete coin operation", "Create a Site With Us", "Coin Social Kit", "Telegram Mini App Muck Map"]) assert.doesNotMatch(tools, new RegExp(hiddenTool));
  }
});

test("launch dev + bundle presets support shared, per-wallet ladders, and manual-only buys end to end", () => {
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function lcReadExitStrategy\(pfx\)/);
    assert.match(src, /Smart ladder/);
    assert.match(src, /Fast ladder/);
    assert.match(src, /Custom ladder/);
    assert.match(src, /Manual only · buy at launch, I sell myself/);
    assert.match(src, /Manual control · this wallet buys at launch with no automatic selling/);
    assert.match(src, /Same settings for every wallet/);
    assert.match(src, /Set each wallet/);
    assert.match(src, /data-lc-bundle-pick/);
    assert.match(src, /id="lcBundle" checked[\s\S]{0,420}<\/div>'\+\s*'<label class="lcheck"><input type="checkbox" id="lcBundleWallets"/);
    assert.match(src, /lcBundleTimingNote/);
    assert.match(src, /Robinhood entries start together as soon as the launch pool is confirmed/);
    assert.match(src, /function loadLaunchBundleInvites\(\)[\s\S]{0,450}if\(ok&&d&&Array\.isArray\(d\.invites\)\)state\.launchInvites=d\.invites/);
    assert.doesNotMatch(src, /state\.launchInvites=ok&&d&&Array\.isArray\(d\.invites\)\?d\.invites:\[\]/);
    assert.match(src, /\[data-ltab\][\s\S]{0,220}lcSnapshot\(\);state\.launchTab/);
    assert.match(src, /b\.dataset\.ltab==="dev"\)\{lcRestore\(\);lcSyncLaunchStrategies\(\);\}/);
    assert.match(src, /#lcRails \[data-rail\][\s\S]{0,180}lcSnapshot\(\);state\.launchRail/);
    assert.match(src, /dwSel\.onchange=\(\)=>\{lcSnapshot\(\);refreshRhSetup\(\)/);
    assert.match(src, /devRh\.innerHTML=rhLaunchDevHtml\(!!state\.rhAutomaticLaunch\);lcRestore\(\)/);
    assert.match(src, /data-lc-stop-toggle checked/);
    assert.match(src, /stopLossPct:stopLossEnabled\?"12":"0"/);
    assert.match(src, /breakEvenAfterTp1:stopLossEnabled/);
    assert.match(src, /Stop loss off[^\n]+no break-even stop/);
    assert.match(src, /if\(preset==="manual"\)return\{preset,manualExit:true,disableAutoExit:true/);
    assert.match(src, /manual=!!\(sel&&sel\.value==="manual"\)/);
    assert.match(src, /id="lcJoinSlEnabled" checked/);
    assert.match(src, /exitMode:mode,stopLossEnabled,stopLossPct:stopLossEnabled\?/);
    assert.match(src, /body\.devExitStrategy=\{\.\.\.lcReadExitStrategy\("lcDev"\),proceedsRouting\}/);
    assert.match(src, /walletConfigs:configs/);
    assert.match(src, /takeProfitLadder/);
  }
  const plans = functionBody(serverSource, "pumpLaunchBundlePlans");
  assert.match(plans, /bundle\.walletConfigs/);
  assert.match(plans, /config\.amountSol \?\? bundle\.amountSol/);
  assert.match(plans, /pumpLaunchExitStrategy\(config, sharedExit\)/);
  const manual = functionBody(serverSource, "pumpLaunchManualExit");
  assert.match(manual, /preset[^\n]+manual/);
  assert.match(manual, /manualExit/);
  assert.match(manual, /disableAutoExit/);
  const strategy = functionBody(serverSource, "pumpLaunchExitStrategy");
  assert.match(strategy, /manualExit: true/);
  assert.match(strategy, /disableAutoExit: true/);
  assert.match(strategy, /takeProfitLadder: \[\]/);
  const fallback = functionBody(serverSource, "firePostLaunchBuysServerSide");
  assert.match(fallback, /groupPumpLaunchPlans\(bundlePlans\)/);
  assert.match(fallback, /plan\.amountSol/);
  assert.match(fallback, /pumpLaunchManualExit\(devExitStrategy\)/);
  assert.match(fallback, /pumpLaunchManualExit\(group\.exitStrategy\)/);
  assert.match(fallback, /dev manual-only/);
  const atomic = functionBody(serverSource, "webLaunchPumpJitoBundle");
  assert.match(atomic, /grossAmountSol: bundlePlan\.amountSol/);
  assert.match(atomic, /const swapLamports = grossLamports - feeLamports/);
  assert.match(atomic, /amount: swapLamports \/ LAMPORTS_PER_SOL/);
  assert.match(atomic, /walletPublicKeys: group\.plans\.map/);
  assert.match(atomic, /returnCoverageDetails: true/);
  assert.match(atomic, /overflowBundlePlans/);
  assert.match(atomic, /filter\(\(entry\) => !pumpLaunchManualExit\(entry\.exitStrategy\)\)/);
  const standard = functionBody(serverSource, "webLaunchPumpPortalLocal");
  assert.match(standard, /firePostLaunchBuysServerSide/);
  assert.match(standard, /postLaunchBuys/);
  const invitedExit = functionBody(serverSource, "launchBundleInviteExit");
  assert.match(invitedExit, /body\.stopLossEnabled === undefined \? true : cleanLaunchBoolean/);
  assert.match(invitedExit, /stopLossPct: "0", breakEvenAfterTp1: false/);
});

test("Jito fallback requires exact candidate proof before recording atomic buys", () => {
  const atomic = functionBody(serverSource, "webLaunchPumpJitoBundle");
  const candidateProof = functionBody(serverSource, "findConfirmedJitoBundleCandidate");
  const provenEvents = functionBody(serverSource, "provenJitoBuyEvents");

  assert.match(candidateProof, /getSignatureStatuses/);
  assert.match(candidateProof, /statuses\.length === candidate\.signatures\.length/);
  assert.match(candidateProof, /confirmationStatus === "confirmed"/);
  assert.match(candidateProof, /confirmationStatus === "finalized"/);
  assert.match(provenEvents, /signatures\.has\(signature\)/);
  assert.match(atomic, /findConfirmedJitoBundleCandidate\([\s\S]*submittedBundleCandidates/);
  assert.match(atomic, /pumpportal-local-fallback-partial/);
  assert.match(atomic, /postLaunchBuysIncomplete: true/);
  assert.match(atomic, /did not replay any uncertain buys/);
  assert.doesNotMatch(atomic, /const atomicReceipts|provenanceId: `pump-jito:/,
    "mint existence must never synthesize atomic buy receipts");
});

test("Jito candidates reconcile durably after submit-response loss or restart", () => {
  const atomic = functionBody(serverSource, "webLaunchPumpJitoBundle");
  const reconcile = functionBody(serverSource, "reconcilePersistedJitoAttempt");
  const duplicateReconcile = functionBody(serverSource, "reconcilePersistedJitoAttemptForUser");

  assert.match(atomic, /buyEvents: item\.buyEvents/);
  assert.match(atomic, /status: "SUBMIT_UNKNOWN"/);
  assert.match(atomic, /pump_launch_jito_submit_unknown/);
  assert.match(atomic, /exactCandidateConfirmed/);
  assert.match(reconcile, /findConfirmedJitoBundleCandidate\(candidates/);
  assert.match(reconcile, /provenJitoBuyEvents\(attempt, candidate\)/);
  assert.match(reconcile, /reconcileJitoAtomicExitIntents\(attempt, candidate\)/);
  assert.match(reconcile, /overflow buys were not part of the all-or-none signed candidate/i);
  assert.match(reconcile, /postLaunchBuysIncomplete: overflowBuysIncomplete > 0/);
  assert.match(reconcile, /recoveryWorkIncomplete/);
  assert.match(reconcile, /status: PUMP_LAUNCH_STATUS\.COMPLETE/);
  assert.match(atomic, /recoveryIntents/);
  assert.match(atomic, /atomicExitGroups/);
  assert.match(atomic, /overflowBuys/);
  assert.match(duplicateReconcile, /String\(item\.userId \|\| ""\) === String\(userId\)/);
  assert.match(serverSource, /reconcilePersistedJitoAttemptForUser\([\s\S]{0,300}auth\.userId/);
  assert.match(serverSource, /attempt = \(await reconcilePersistedJitoAttempt\(attempt, \{ polls: 1 \}\)/);
});

test("Jito fee recovery atomically claims each buy and never retries outcome-unknown debits", () => {
  const claim = functionBody(serverSource, "claimPumpLaunchAtomicFeeReceipt");
  const settle = functionBody(serverSource, "settlePumpLaunchAtomicFeeReceipt");
  const collect = functionBody(serverSource, "collectProvenJitoBuyFees");
  const reconcile = functionBody(serverSource, "reconcilePersistedJitoAttempt");

  assert.match(claim, /withFileLock\(pumpLaunchAttemptsPath\(\)/);
  assert.match(claim, /\["paid", "embedded", "outcome_unknown", "allocation_invalid"\]\.includes\(status\)/);
  assert.match(claim, /status === "submitting"/);
  assert.match(claim, /JITO_FEE_SUBMISSION_STALE_MS/);
  assert.match(claim, /status: "outcome_unknown"/);
  assert.match(claim, /claimId = crypto\.randomUUID\(\)/);
  assert.match(settle, /String\(current\.claimId \|\| ""\) !== wantedClaim/);
  assert.ok(collect.indexOf("claimPumpLaunchAtomicFeeReceipt") < collect.indexOf("collectSolFee("),
    "the durable claim must be written before any fee transfer can submit");
  assert.match(collect, /settlePumpLaunchAtomicFeeReceipt/);
  assert.match(collect, /returnDetails: true/);
  assert.match(collect, /outcomeUnknown \? "outcome_unknown" : "failed"/);
  assert.match(reconcile, /const nextPatch = \{/);
  assert.doesNotMatch(reconcile, /const nextPatch = \{\s*\.\.\.attempt/,
    "a stale attempt snapshot must not overwrite receipts written during collection");
  assert.match(reconcile, /const refreshed = await readPumpLaunchAttempts\(\)/);
  assert.match(reconcile, /atomicFeesIncomplete/);
});

test("Jito fee recovery persists and consumes one immutable per-leg allocation", () => {
  const atomic = functionBody(serverSource, "webLaunchPumpJitoBundle");
  const proven = functionBody(serverSource, "provenJitoBuyEvents");
  const collect = functionBody(serverSource, "collectProvenJitoBuyFees");
  const fee = functionBody(serverSource, "collectSolFee");

  assert.match(atomic, /buildFrozenSolFeeAllocation\(/);
  assert.match(atomic, /feeAllocation: entry\.feeAllocation/);
  assert.match(proven, /validateFrozenSolFeeAllocation\(\{ feeLamports, allocation: event\?\.feeAllocation \}\)/);
  assert.match(collect, /status: "allocation_invalid"/);
  assert.ok(collect.indexOf("if (!event.feeAllocation)") < collect.indexOf("collectSolFee("),
    "a missing allocation must fail closed before any recovery debit");
  assert.match(collect, /feeAllocation: event\.feeAllocation/);
  assert.match(fee, /options\.feeAllocation[\s\S]*feeTargetsFromFrozenAllocation/);
  assert.match(fee, /toPubkey: new PublicKey\(targets\.ownerWallet\)/);
});

test("separate Solana fee legs are unique and expose per-leg completion", () => {
  const fee = functionBody(serverSource, "collectSolFee");
  const send = functionBody(serverSource, "sendLegacyTransaction");

  assert.match(serverSource, /SOL_FEE_MEMO_PROGRAM_ID/);
  assert.match(fee, /addSolFeeMemo\(new Transaction\(\), feeSourceId, "platform"\)/);
  assert.match(fee, /addSolFeeMemo\(new Transaction\(\), feeSourceId, "cashcow"\)/);
  assert.match(fee, /addSolFeeMemo\(new Transaction\(\), feeSourceId, "referral"\)/);
  assert.match(fee, /skipCashCow/);
  assert.match(fee, /skipReferral/);
  assert.match(fee, /options\.returnDetails/);
  assert.match(send, /classifyFeeConfirmation\(\{ confirmation \}\)/);
  assert.match(send, /classifyFeeConfirmation\(\{ error \}\)[\s\S]*markTradeSubmissionAmbiguous/);
  assert.match(send, /transactionFailedOnChain = true/);
  assert.ok(send.lastIndexOf("return await confirmSigned") > send.lastIndexOf("send raw transaction (backup)"),
    "confirmation must run after the send/failover block, never inside its retry catch");
  assert.match(send, /markTradeSubmissionAmbiguous/);
  assert.match(send, /partialHashes = \[signedSignature\]/);
});

test("Fun profile clearly exposes naming, creation, and login recovery", () => {
  const fun = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  assert.match(fun, /Create a profile or log in/);
  assert.match(fun, /data-save-social-profile>Create profile/);
  assert.match(fun, /data-fun-account="login">Log in/);
  assert.match(fun, /data-fun-account="create"/);
  assert.match(fun, /data-fun-account="login"/);
  assert.match(fun, /\/api\/web\/profile\/credentials/);
  assert.match(fun, /\/api\/web\/password-login/);
  assert.match(fun, /Could not reach SlimeWire/);
  assert.match(fun, /location\.origin/);
});

test("shared web profiles accept two-character usernames on every account surface", () => {
  const fun = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  const cash = fs.readFileSync(new URL("../web/public/cash/cash.js", import.meta.url), "utf8");
  const classic = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
  const terminal = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
  assert.match(serverSource, /Username must be 2-24 characters/);
  assert.match(fun, /Username must be 2–24 letters/);
  assert.match(cash, /Username must be 2–24 letters/);
  assert.match(classic, /Username must be 2-24 characters/);
  assert.match(terminal, /Username must be 2-24 characters/);
  for (const source of [serverSource, fun, cash, classic]) {
    assert.doesNotMatch(source, /Username must be 3(?:-|\u2013)24/);
  }
});

test("Fun Discover supports public username search and a saved Following tab", () => {
  const fun = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  const html = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
  assert.match(serverSource, /\/api\/web\/profile\/search/);
  assert.match(serverSource, /async function webSearchPublicTraders\(query\)/);
  assert.match(serverSource, /profile\?\.showOnTraderBoard/);
  assert.match(html, /data-trader-search/);
  assert.match(html, /data-leader-tab="top">Top traders/);
  assert.match(html, /data-leader-tab="following">Following/);
  assert.match(fun, /async function searchTraders\(rawQuery\)/);
  assert.match(fun, /\/api\/web\/profile\/follows/);
  assert.match(fun, /data-follow-trader/);
  assert.match(fun, /Following sends alerts only/);
});

test("creator fee claims auto-run only after new Pump volume, and wallet choice follows Cash to Fun", () => {
  assert.match(serverSource, /function startCreatorFeeAutoClaimRunner\(\)/);
  const auto = functionBody(serverSource, "processCreatorFeeAutoClaims");
  assert.match(auto, /pumpCreatorFeeTradeDelta/);
  assert.match(auto, /creatorFeesAutoClaimPendingVolumeSol/);
  assert.match(auto, /CONFIG\.creatorFeesAutoClaimMinVolumeSol/);
  assert.match(auto, /webClaimCreatorFeesCore/);
  assert.match(auto, /claimedWallets/);
  const claim = functionBody(serverSource, "webClaimCreatorFeesCore");
  assert.match(claim, /creatorFeesAutoClaimStatus: "claimed"/);
  assert.match(claim, /creatorFeesAutoClaimSol: Number\(claimedSol \|\| 0\)/);
  const fun = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  for (const src of [fun, ggSource, indexSource]) assert.match(src, /slimecashActiveWalletIndex/);
});

test("wallet sweep drains regardless of session-funding (no 'fund your session' gate)", () => {
  // Sweeping out a wallet's own SOL/tokens needs only the signing key, NOT a funded session wallet —
  // otherwise one unfunded/expired session wallet aborts the whole "sweep all".
  const sweepSel = functionBody(serverSource, "selectedWebSweepWallets");
  assert.match(sweepSel, /requireTradeReady:\s*false/);
  // webSelectedWallets honours the opt-out by using the lighter signable-only check.
  const sel = functionBody(serverSource, "webSelectedWallets");
  assert.match(sel, /requireTradeReady/);
  assert.match(sel, /assertServerSignableWallet/);
  // The signable check must NOT look at sessionStatus/sessionWallet (that's the trade-ready gate).
  const signable = functionBody(serverSource, "assertServerSignableWallet");
  assert.doesNotMatch(signable, /sessionStatus|sessionWallet/);
});

test("auto round-trip is gated + bounded + sweeps back (flip bot)", () => {
  assert.match(serverSource, /function autoRoundTripEnabled\(\)/);
  assert.match(functionBody(serverSource, "webStartAutoRoundTrip"), /AUTO_ROUNDTRIP_ENABLED|autoRoundTripEnabled\(\)/);
  assert.match(functionBody(serverSource, "webStartAutoRoundTrip"), /statusCode = 501/);
  // Hard cap: every buy is always < 0.1 SOL.
  assert.match(functionBody(serverSource, "webStartAutoRoundTrip"), /0\.099/);
  const run = functionBody(serverSource, "runAutoRoundTrip");
  assert.match(run, /buildLiquidMovers\(\)/);            // picks liquid coins (minimal round-trip loss)
  assert.match(run, /Number\(c\.liquidityUsd\) > 15000/);
  assert.match(run, /sellTokenFromWallet\(wallet, coin\.tokenMint, 100/); // sells right back
  assert.match(run, /drainSolFromWallet/);              // sweeps SOL back at the end
  assert.match(serverSource, /pathname === "\/api\/web\/auto-roundtrip\/start"/);
  // UI wired in both HTML mirrors.
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /\/api\/web\/auto-roundtrip\/start/);
    assert.match(src, /id="artGo"/);
  }
});

test("Season uses durable 3-5 coin low-cap round trips with claim-before-submit recovery", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/season\/start"/);
  assert.match(serverSource, /pathname === "\/api\/web\/season\/status"/);
  assert.match(serverSource, /maxMarketCapUsd: 2_100/);
  assert.match(serverSource, /minTrades: 3/);
  assert.match(serverSource, /maxTrades: 5/);
  assert.match(serverSource, /amountSol: 0\.005/);
  const start = functionBody(serverSource, "webStartSeason");
  assert.match(start, /mutateTradePlans/);
  assert.match(start, /crypto\.randomInt\(SEASON_LIMITS\.minTrades, SEASON_LIMITS\.maxTrades \+ 1\)/);
  assert.match(start, /requireWebAutomationPermission/);
  assert.match(start, /activeVolumePlanForUser/);
  const pick = functionBody(serverSource, "seasonPickCandidate");
  assert.match(pick, /marketCapUsd > 0 && marketCapUsd <= SEASON_LIMITS\.maxMarketCapUsd/);
  assert.match(pick, /seasonCandidateSells\(row\) > 0/);
  assert.match(pick, /autopilotRowHasHardDanger/);
  assert.match(pick, /filterSniperCandidatesForBuy/);
  assert.match(pick, /randomizeRows/);
  const run = functionBody(serverSource, "processSeasonPlan");
  assert.ok(run.indexOf('plan.seasonStage = "buy_submitting"') < run.indexOf('runIdempotentMoneyOp("season-buy"'));
  assert.ok(run.indexOf('plan.seasonStage = "sell_submitting"') < run.indexOf('runIdempotentMoneyOp("season-sell"'));
  assert.match(run, /persistCheckpoint\(\{ seasonActionClaim: true \}\)/);
  assert.match(run, /buyTokenForPlan/);
  assert.match(run, /sellTokenFromWallet/);
  assert.match(run, /tradeSubmissionAmbiguous/);
  assert.match(run, /latestMarketCap > 0 && latestMarketCap <= SEASON_LIMITS\.maxMarketCapUsd/);
  assert.match(functionBody(serverSource, "seasonReconcileUnknown"), /getReliableTokenBalanceForMint/);
  assert.match(functionBody(serverSource, "seasonReconcileUnknown"), /No duplicate order will be sent/);
  assert.doesNotMatch(serverSource, /const seasonRuns = new Map/);
  assert.match(functionBody(serverSource, "processTradePlans"), /plan\.status === "season"/);
  assert.match(appSource, /key: "season", label: "Season"/);
  assert.match(appSource, /data-season-start/);
  assert.match(appSource, /\/api\/web\/season\/start/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function seasonFoldHtml/);
    assert.match(src, /id="seasonGo"/);
    assert.match(src, /\/api\/web\/season\/start/);
  }
});

test("trade history dedupes by on-chain signature (fixes positions 'up double')", () => {
  // A trade recorded twice doubled `received` → portfolio PnL read ~2x. Dedup at the single read path
  // (heals every view + existing data); recordTradeEvents locks the RMW + skips a duplicate.
  assert.match(serverSource, /function tradeEventDedupeKey\(trade\)/);
  // Composite key so a multi-coin bundle tx (one signature, many events) is preserved.
  assert.match(functionBody(serverSource, "tradeEventDedupeKey"), /\$\{sig\}:\$\{trade\.type \|\| ""\}:\$\{trade\.tokenMint \|\| ""\}:\$\{trade\.walletPublicKey \|\| ""\}/);
  assert.match(functionBody(serverSource, "readTradeHistory"), /store\.trades = store\.trades\.filter[\s\S]*tradeEventDedupeKey/);
  const rec = functionBody(serverSource, "recordTradeEvents");
  assert.match(rec, /withFileLock\(tradeHistoryPath\(\)/);
  assert.match(rec, /if \(key && seen\.has\(key\)\) continue/);
});

test("sell auto-funds the fee from a sibling wallet when the holder has no SOL", () => {
  // The fee-less-sell sim error is detected + the sell retried after a top-up.
  assert.match(functionBody(serverSource, "isInsufficientFeeError"), /debit an account but found no record of a prior credit/);
  assert.match(serverSource, /async function topUpSellFees\(/);
  assert.match(functionBody(serverSource, "topUpSellFees"), /SystemProgram\.transfer/);
  assert.match(functionBody(serverSource, "topUpSellFees"), /sell_fee_topup/);
  // webTradeSellCore routes BOTH its attempts through the fee-retry wrapper.
  const body = functionBody(serverSource, "webTradeSellCore");
  assert.match(body, /sellWithFeeRetry\(store, userId, wallet, tokenMint, percent, slippageBps\)/);
  assert.doesNotMatch(body, /await sellTokenFromWallet\(/); // the raw call moved into sellWithFeeRetry
});

test("escrow presales never appear on the public non-custodial board", () => {
  assert.match(serverSource, /ESCROW presales are creator-only[\s\S]*?\.filter\(\(p\) => !p\.escrow\)/);
});

test("presale escrow is fully GATED behind PRESALE_ESCROW_ENABLED (custody stays off)", () => {
  assert.match(serverSource, /function presaleEscrowEnabled\(\)/);
  // Every mutating escrow fn asserts the flag first (501 in test mode).
  assert.match(functionBody(serverSource, "webCreatePresaleEscrow"), /assertPresaleEscrowEnabled\(\)/);
  assert.match(functionBody(serverSource, "webRefundPresaleEscrow"), /assertPresaleEscrowEnabled\(\)/);
  assert.match(functionBody(serverSource, "webFinalizePresaleEscrow"), /assertPresaleEscrowEnabled\(\)/);
  assert.match(functionBody(serverSource, "assertPresaleEscrowEnabled"), /statusCode = 501/);
  // Finalize + refund are idempotent (no double buy/distribute/refund).
  assert.match(functionBody(serverSource, "webFinalizePresaleEscrow"), /runIdempotentMoneyOp\("presale-finalize"/);
  assert.match(functionBody(serverSource, "webRefundPresaleEscrow"), /runIdempotentMoneyOp\("presale-refund"/);
});

for (const [label, source] of [["gg.html", ggSource], ["index.html", indexSource]]) {
  test(`presale escrow is hidden from launch but its gated implementation is preserved (${label})`, () => {
    assert.doesNotMatch(functionBody(source, "renderLaunch"), /GG\.escrowModal/);
    assert.match(source, /escrowModal,renderEscrow,escrowFinalize,escrowRefund,/); // exposed on GG
    assert.match(source, /\/api\/web\/presale\/escrow\/create/);
    assert.match(source, /\/api\/web\/presale\/escrow\/finalize/);
    assert.match(source, /\/api\/web\/presale\/escrow\/refund/);
    assert.match(source, /\/api\/web\/presale\/escrow\?id=/);
  });
  test(`client in-flight guard blocks double-taps on every submit path (${label})`, () => {
    assert.match(source, /function tradeLock\(side,mint\)\{/);
    assert.match(source, /function tradeUnlock\(side,mint\)\{/);
    for (const fn of ["execBuy", "execSell", "execQuickBuy"]) {
      const body = functionBody(source, fn);
      const side = fn === "execSell" ? "sell" : "buy";
      assert.match(body, new RegExp(`if\\(!tradeLock\\("${side}",mint\\)\\)`), `${fn} must take the in-flight lock`);
      assert.match(body, new RegExp(`tradeUnlock\\("${side}",mint\\)`), `${fn} must release the lock`);
    }
  });
}

// ---- TG bot parity: SpyDefiBuyBot / Raidar / MissRose_bot feature guards ----
test("Rose (MissRose parity): captcha verify, fillings, timed mutes, notes, filters, antiflood, purge", () => {
  // Config schema carries the new modules.
  assert.match(functionBody(serverSource, "roseDefaults"), /captcha:\s*false/);
  assert.match(functionBody(serverSource, "roseDefaults"), /goodbye:\s*null/);
  assert.match(functionBody(serverSource, "roseDefaults"), /warnLimit:\s*3/);
  assert.match(functionBody(serverSource, "roseDefaults"), /antiflood:\s*0/);
  assert.match(functionBody(serverSource, "roseDefaults"), /notes:\s*\{\}/);
  assert.match(functionBody(serverSource, "roseDefaults"), /filters:\s*\{\}/);
  // Captcha: mute-on-join + "I'm human" button + verify callback wired in the dispatcher.
  assert.match(serverSource, /async function handleRoseCaptchaCallback\(/);
  assert.match(serverSource, /cap:v:/);
  assert.match(serverSource, /ROSE_CAPTCHA_TIMEOUT_MS[\s\S]*5\s*\*\s*60_000/);
  assert.match(serverSource, /ROSE_CAPTCHA_REMINDER_MS/);
  assert.match(serverSource, /callback_data:\s*`cap:v:\$\{chatId\}:\$\{m\.id\}`/);
  assert.match(serverSource, /chat_id:\s*m\.id[\s\S]*Verify for/);
  assert.match(serverSource, /startsWith\("cap:"\)/);            // routed in the callback dispatcher
  // Welcome/goodbye fillings + duration parsing helpers exist.
  assert.match(serverSource, /function roseFill\(/);
  assert.match(functionBody(serverSource, "roseFill"), /mention/);        // {mention} filling (braces escaped in-source)
  assert.match(functionBody(serverSource, "roseFill"), /chatname\|title/); // {chatname}/{title} filling
  assert.match(serverSource, /function roseParseDuration\(/);
  const rose = functionBody(serverSource, "handleGroupRose");
  assert.match(rose, /\^\\\/\(\?:raid\|next\)/); // X-link raid commands bypass Rose anti-links/filters
  for (const cmd of ["captcha", "tmute", "tban", "antiflood", "setwarnlimit", "setwarnmode", "save", "filter", "report", "purge", "pin"]) {
    assert.ok(rose.includes(`"${cmd}"`) || rose.includes(`'${cmd}'`) || rose.includes(cmd), `Rose must handle /${cmd}`);
  }
  assert.match(rose, /name === "rmfilter"/);
  assert.match(rose, /name === "clearfilters"/);
  assert.match(rose, /setGroupRose\(chatId, \{ filters: \{\} \}\)/);
  const roseLinkRule = serverSource.match(/const ROSE_LINK_RE = [^\r\n]+/)?.[0] || "";
  assert.match(roseLinkRule, /t\\\.me/);                    // real Telegram invite links remain blocked
  assert.doesNotMatch(roseLinkRule, /@\[A-Za-z0-9_/);       // @admin/@user mentions are not links
  // Full mute perm set (not just can_send_messages) so newer Bot API actually mutes.
  assert.match(serverSource, /ROSE_MUTE_PERMS\s*=\s*\{[^}]*can_send_polls:\s*false/);
});

test("Buy bot (SpyDefi parity): whale-tier badge + new-holder flag + volume", () => {
  const buy = functionBody(serverSource, "postGroupBuy");
  assert.match(buy, /MEGA BUY|WHALE|DOLPHIN|FISH|SHRIMP/);        // whale tiers by USD size
  assert.match(buy, /New holder!/);                              // first-seen buyer flag
  assert.match(buy, /groupBuyHolders/);                          // per-token seen-buyer set
  assert.match(buy, /24h Vol/);                                 // explicit 24-hour volume shown on the MC line
  // Bonded coins show "✅ Bonded" — detection uses pump metadata's own graduated
  // flag (+bondPct>=100), not just meta.graduated (false for PumpSwap graduations).
  assert.match(buy, /✅ <b>Bonded<\/b>/);
  assert.match(buy, /bonding\?\.graduated \|\| bonding\?\.isGraduated \|\| \(bondPct != null && bondPct >= 100\)/);
});

test("Buy bot keeps transaction price and market cap aligned on both chains", () => {
  const body = functionBody(serverSource, "resolveGroupBuyMarketSnapshot");
  const first = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) || null;
  const resolve = Function("firstMeaningfulNumber", `return ({
    eventPriceUsd = 0, eventMarketCapUsd = 0, nativeAmount = 0, tokens = 0,
    nativeUsd = 0, scanPriceUsd = 0, scanMarketCapUsd = 0, supply = 0,
    preferReportedSupply = false
  } = {}) => {${body}}`)(first);

  // A direct trade-feed price moves the scan's implied stable supply to the new price.
  assert.deepEqual(resolve({ eventPriceUsd: 0.002, scanPriceUsd: 0.001, scanMarketCapUsd: 1_000_000 }), {
    priceUsd: 0.002, marketCapUsd: 2_000_000, supply: 1_000_000_000, executionPriceUsd: 0
  });
  // Robinhood can derive the exact execution price from ETH spent / tokens received.
  assert.deepEqual(resolve({ nativeAmount: 0.5, nativeUsd: 100, tokens: 100_000, scanPriceUsd: 0.0004, scanMarketCapUsd: 400_000 }), {
    priceUsd: 0.0005, marketCapUsd: 500_000, supply: 1_000_000_000, executionPriceUsd: 0.0005
  });
  // PumpPortal sometimes supplies live MC without a separate price; supply fills that price exactly.
  assert.deepEqual(resolve({ eventMarketCapUsd: 750_000, supply: 1_000_000_000 }), {
    priceUsd: 0.00075, marketCapUsd: 750_000, supply: 1_000_000_000, executionPriceUsd: 0
  });
  // PumpPortal's MC is the post-swap spot while native/tokens is the average fill. The spot wins.
  assert.deepEqual(resolve({ eventPriceUsd: 0.00009, eventMarketCapUsd: 100_000, supply: 1_000_000_000 }), {
    priceUsd: 0.0001, marketCapUsd: 100_000, supply: 1_000_000_000, executionPriceUsd: 0
  });
  // PumpPortal already reports the event MC. A burned-supply coin must retain that direct value instead
  // of recomputing it from a guessed/lagging supply and cutting or multiplying the card MC.
  assert.deepEqual(resolve({ eventPriceUsd: 0.00082, eventMarketCapUsd: 410_000, supply: 500_000_000 }), {
    priceUsd: 0.00082, marketCapUsd: 410_000, supply: 500_000_000, executionPriceUsd: 0
  });
  // Raw base-unit supply is rejected when the scan has a coherent UI-supply implication.
  assert.deepEqual(resolve({ eventPriceUsd: 0.00082, scanPriceUsd: 0.0008, scanMarketCapUsd: 400_000, supply: 500_000_000_000_000 }), {
    priceUsd: 0.00082, marketCapUsd: 410_000, supply: 500_000_000, executionPriceUsd: 0
  });
  // DexScreener's headline MC uses circulating supply. Revalue that same circulating supply at the
  // transaction price instead of multiplying by the larger ERC-20/SPL total supply (the ~$5k drift).
  assert.deepEqual(resolve({
    eventPriceUsd: 0.00004,
    eventMarketCapUsd: 40_000,
    scanPriceUsd: 0.000039,
    scanMarketCapUsd: 35_100,
    supply: 1_000_000_000,
  }), {
    priceUsd: 0.00004, marketCapUsd: 36_000, supply: 900_000_000, executionPriceUsd: 0
  });
  // Pump's live page uses the full bonding-curve supply. A smaller implied supply from a stale/indexed
  // source must not turn its authoritative $8K post-trade MC into a ~$6K card.
  assert.deepEqual(resolve({
    eventMarketCapUsd: 8_000,
    scanPriceUsd: 0.000008,
    scanMarketCapUsd: 6_000,
    supply: 1_000_000_000,
    preferReportedSupply: true,
  }), {
    priceUsd: 0.000008, marketCapUsd: 8_000, supply: 1_000_000_000, executionPriceUsd: 0
  });
  // Sharp-dump regression: a stale Pump page can still say $35K after the transaction feed has
  // reached $14K. The event price must revalue the known supply instead of repeating the stale page.
  assert.deepEqual(resolve({
    eventPriceUsd: 0.000014,
    scanPriceUsd: 0.000035,
    scanMarketCapUsd: 35_000,
    supply: 1_000_000_000,
    preferReportedSupply: true,
  }), {
    priceUsd: 0.000014, marketCapUsd: 14_000, supply: 1_000_000_000, executionPriceUsd: 0
  });
  // The websocket can attach its previous curve MC to a newer transaction. A gross conflict must
  // follow the exact transaction price instead of allowing the stale event MC to win again.
  assert.deepEqual(resolve({
    eventPriceUsd: 0.000004,
    eventMarketCapUsd: 35_000,
    scanPriceUsd: 0.000035,
    scanMarketCapUsd: 35_000,
    supply: 1_000_000_000,
    preferReportedSupply: true,
  }), {
    priceUsd: 0.000004, marketCapUsd: 4_000, supply: 1_000_000_000, executionPriceUsd: 0
  });
  assert.deepEqual(resolve({
    nativeAmount: 0.01,
    nativeUsd: 2_000,
    tokens: 500_000,
    scanPriceUsd: 0.000039,
    scanMarketCapUsd: 35_100,
    supply: 1_000_000_000,
  }), {
    priceUsd: 0.00004, marketCapUsd: 36_000, supply: 900_000_000, executionPriceUsd: 0.00004
  });
  // Real RH regression: Cash Cow burns ~93.47M of its 1B tokens. A gross-supply provider reports
  // ~$33.8k, but the buy card must use the chain-proven effective 906.53M supply (~$30.6k here).
  const cashCow = resolve({
    eventPriceUsd: 0.00003377,
    scanPriceUsd: 0.00003377,
    scanMarketCapUsd: 33_770,
    supply: 906_529_349.9222183,
  });
  assert.equal(cashCow.supply, 906_529_349.9222183);
  assert.ok(cashCow.marketCapUsd > 30_000 && cashCow.marketCapUsd < 31_000);
  assert.equal(cashCow.marketCapUsd, cashCow.priceUsd * cashCow.supply);
  const post = functionBody(serverSource, "postGroupBuy");
  assert.match(post, /resolveGroupBuyMarketSnapshot/);
  assert.match(post, /eventPriceUsd: priceUsd \|\| livePumpPrice/);
  assert.match(post, /eventMarketCapUsd: mcUsd/);
  assert.match(post, /scanMarketCapUsd: livePumpMc \|\| scanMc/);
  assert.doesNotMatch(post, /eventMarketCapUsd: livePumpMc \|\| mcUsd/);
  assert.match(functionBody(serverSource, "postGroupBuyRh"), /resolveGroupBuyMarketSnapshot/);
  assert.match(post, /groupBuyCoherentMarketReference/);
});

test("Robinhood market cap excludes provable burns and uses post-swap spot price", () => {
  const total = 1_000_000_000_000_000_000_000_000_000n;
  const cashCowDead = 93_470_650_077_781_690_383_666_646n;
  assert.equal(
    effectiveErc20SupplyRaw(total, [0n, cashCowDead]),
    906_529_349_922_218_309_616_333_354n
  );
  assert.equal(effectiveErc20SupplyRaw(100n, [40n, 60n]), 0n);
  const oneToOneSqrtPrice = 2n ** 96n;
  assert.equal(tokenPriceInQuote(oneToOneSqrtPrice, 18, 18, true), 1);
  assert.equal(tokenPriceInQuote(oneToOneSqrtPrice, 18, 18, false), 1);
  assert.equal(tokenPriceInQuote(oneToOneSqrtPrice, 6, 18, true), 1e-12);
});

test("Buy bot derives Pump supply and websocket price without a guessed one-billion supply", () => {
  const pumpMeta = functionBody(serverSource, "getPumpFunTokenMetadata");
  const socketTrade = functionBody(serverSource, "onGroupBuyTrade");
  const supply = functionBody(serverSource, "getGroupBuySupply");
  assert.match(pumpMeta, /coin\?\.base_decimals/);
  assert.match(pumpMeta, /totalSupplyRaw \/ \(10 \*\* baseDecimals\)/);
  assert.match(pumpMeta, /supplyUi/);
  assert.match(supply, /fetchTokenSupplyUi\(key\)/);
  assert.match(supply, /pump\?\.supplyUi/);
  assert.match(socketTrade, /\(solAmount \* solUsd\) \/ tokenAmount/);
  assert.match(socketTrade, /d\.priceUsd/);
  assert.match(socketTrade, /d\.priceSol/);
  assert.match(socketTrade, /mcSol \* solUsd/);
  assert.doesNotMatch(socketTrade, /1_000_000_000/);
  const post = functionBody(serverSource, "postGroupBuy");
  assert.match(post, /getPumpFunTokenMetadata\(mint, \{ force: true, cacheTtlMs: 0/);
  assert.match(post, /preferReportedSupply: onCurve/);
});

test("Robinhood buy watcher is decimal-safe, lossless, concurrent, and near-live", () => {
  const meta = functionBody(noxaSource, "poolSwapMeta");
  const buys = functionBody(noxaSource, "fetchPoolBuys");
  const tick = functionBody(serverSource, "rhGroupBuyTick");
  assert.match(meta, /fn: "decimals"/);
  assert.match(meta, /fn: "totalSupply"/);
  assert.match(meta, /ERC20_BURN_ADDRESSES/);
  assert.match(meta, /effectiveErc20SupplyRaw/);
  assert.match(buys, /formatUnits\(-amtToken, tokenDecimals\)/);
  assert.match(buys, /formatUnits\(tokenOut, tokenDecimals\)/);
  assert.match(buys, /formatUnits\([^\n]+quoteDecimals\)/);
  assert.match(buys, /SYNC_TOPIC_V2/);
  assert.match(buys, /sqrtPriceX96/);
  assert.match(buys, /spotPriceQuote/);
  assert.match(buys, /for \(let from = start \+ 1; from <= latest; from \+= span\)/);
  assert.doesNotMatch(buys, /catch\s*\{\s*return \{ toBlock: latest, buys: \[\] \}/);
  assert.match(noxaSource, /export async function fetchRhBlockNumber/);
  assert.match(serverSource, /const RH_GROUP_BUY_POLL_MS = 3_000/);
  assert.match(tick, /rhGroupBuyTickRunning/);
  assert.match(tick, /runWithConcurrency\(\[\.\.\.tracked\], 6/);
  assert.match(tick, /fetchRhBlockNumber\(CONFIG\.rhChainRpcUrl\)/);
  assert.match(tick, /queueRhGroupBuyDelivery/);
  assert.match(tick, /spotPriceQuote: buy\.spotPriceQuote/);
  assert.match(tick, /st\.lastBlock = res\.toBlock/);
  const post = functionBody(serverSource, "postGroupBuyRh");
  assert.match(post, /supply: firstMeaningfulNumber\(supply, info\?\.supply\)/);
  assert.match(post, /eventPriceUsd/);
  assert.match(post, /infoQuoteMatches/);
  assert.match(post, /info\?\.quotePriceUsd/);
});

test("Buy Bot saves and renders Telegram custom emoji entities with a safe fallback", () => {
  const parseSource = functionBody(serverSource, "telegramCustomEmojiFromMessage");
  const markupSource = functionBody(serverSource, "groupBuyEmojiMarkup");
  const stripSource = functionBody(serverSource, "stripTelegramCustomEmojiHtml");
  const parseCustom = Function("message", parseSource);
  const customText = "/setbuyemoji 🐸 0.1";
  const custom = parseCustom({
    text: customText,
    entities: [{ type: "custom_emoji", offset: customText.indexOf("🐸"), length: 2, custom_emoji_id: "5368324170671202286" }]
  });
  assert.deepEqual(custom, { id: "5368324170671202286", fallback: "🐸" });
  const markup = (entry, count) => Function("entry", "count", "escapeTelegramHtml", markupSource)(entry, count, (value) => String(value));
  assert.equal(markup({ buyEmoji: "🐸", buyEmojiId: custom.id }, 3), '<tg-emoji emoji-id="5368324170671202286">🐸</tg-emoji>'.repeat(3));
  const strip = (text) => Function("text", stripSource)(text);
  assert.equal(strip(markup({ buyEmoji: "🐸", buyEmojiId: custom.id }, 2)), "🐸🐸");
  assert.match(functionBody(serverSource, "applyGbInput"), /buyEmojiId = custom\?\.id \|\| ""/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /e\.buyEmojiId = custom\?\.id \|\| ""/);
  assert.match(functionBody(serverSource, "postGroupBuy"), /groupBuyEmojiMarkup\(e, count\)/);
  assert.match(functionBody(serverSource, "postGroupBuyRh"), /groupBuyEmojiMarkup\(e, count\)/);
  assert.match(functionBody(serverSource, "sendGroupAlertMedia"), /stripTelegramCustomEmojiHtml\(caption\)/);
});

test("Buy Bot custom media is atomic, sticky, and retried on temporary Telegram failures", () => {
  const command = functionBody(serverSource, "handleGroupBotCommand");
  const setter = functionBody(serverSource, "setGroupBotMedia");
  const sender = functionBody(serverSource, "sendGroupAlertMedia");
  assert.match(command, /setGroupBotMedia\(chatId, "customMedia", media\)/);
  assert.match(command, /setGroupBotMedia\(chatId, "raidMedia", media\)/);
  assert.match(setter, /mutateGroupBot\(\(store\) =>/);
  assert.match(setter, /e\[`\$\{field\}UpdatedAt`\] = Date\.now\(\)/);
  assert.match(functionBody(serverSource, "groupAlertMediaFor"), /entry\.customMedia/);
  assert.match(sender, /mediaError && groupBuyAlertRetryMs\(mediaError\)/);
  assert.match(sender, /return \{ result: null, hasMedia: false, error: mediaError \}/);
});

test("Robinhood buy cards keep complete market rows during intermittent scan gaps", () => {
  const merge = functionBody(serverSource, "mergeRhGroupBuyInfo");
  const buy = functionBody(serverSource, "postGroupBuyRh");
  assert.match(serverSource, /const rhGroupBuyLastGood = new Map\(\)/);
  assert.match(merge, /priceUsd[\s\S]*mc[\s\S]*liq[\s\S]*vol24/);
  assert.match(buy, /mergeRhGroupBuyInfo\(freshInfo, rhGroupBuyLastGood\.get/);
  assert.match(buy, /Price <b>\$\{priceUsd > 0 \? fmtPx\(priceUsd\) : "n\/a"\}/);
  assert.match(buy, /MC <b>\$\{marketCapUsd > 0 \? fmtUsd0\(marketCapUsd\) : "checking"\}/);
  assert.match(buy, /Liq <b>\$\{info\?\.liq > 0/);
  assert.match(buy, /24h Vol <b>\$\{info\?\.vol24 > 0/);
  const noxaMarkets = functionBody(noxaSource, "readNoxaMarkets");
  assert.match(noxaMarkets, /target: e\.token[\s\S]*fn: "balanceOf"[\s\S]*args: \[e\.pool\]/);
  assert.match(noxaMarkets, /tokenReserve \* priceUsd/);
  assert.match(noxaMarkets, /wethReserve \* eth \+ tokenReserve \* priceUsd/);
  assert.doesNotMatch(noxaMarkets, /liq: wethReserve \* eth[,\s]/);
});

test("coin charts stay trader-focused while Robinhood liquidity remains creator-only", () => {
  for (const src of [ggSource, indexSource]) {
    assert.doesNotMatch(functionBody(src, "renderTrade"), /blinkLinksHtml/);
    const rhChart = functionBody(src, "renderRhTrade");
    assert.doesNotMatch(rhChart, /blinkLinksHtml/);
    assert.doesNotMatch(rhChart, /rhAddLiquidity/);
    assert.match(rhChart, /class="trade rhTradeUnified"/);
    assert.match(rhChart, /class="tradeSide"/);
    assert.match(rhChart, /id="rhTradeTape"/);
    assert.match(rhChart, /loadInlineTape\(address,r,"robinhood","rhTradeTape"\)/);
    assert.match(rhChart, /pays with SOL/);
    assert.match(functionBody(src, "renderTrade"), /id="tradeTape"/);
    assert.match(functionBody(src, "renderLaunch"), />Open trading</);
  }
  assert.match(serverSource, /pathname === "\/api\/web\/token-trades"/);
  assert.match(serverSource, /requestUrl\.searchParams\.get\("network"\)/);
  assert.match(functionBody(serverSource, "fetchGeckoPoolTrades"), /networks\/\$\{network\}\/pools/);
});

test("Raid bot: clean card + overall progress bar + goal-to-go + views + Refresh", () => {
  const card = functionBody(serverSource, "buildRaidProgressCard");
  assert.match(card, /to go/);                                  // "X to go" per metric
  assert.match(card, /raidBar\(overall\)/);                    // one overall progress bar
  assert.doesNotMatch(card, /🟩|🟨|🟥/);                        // colour squares removed
  assert.match(card, /views/);                                  // 👀 views line
  assert.match(card, /callback_data:\s*"rr:"/);                // Refresh button
  assert.match(serverSource, /async function handleRaidRefreshCallback\(/);
  assert.match(serverSource, /startsWith\("rr:"\)/);            // routed in the dispatcher
});

// ---- TG bot polish: buy links, no aggregate card, strict scan, raid typed input ----
test("buy cards use the compact TG/Web/More keyboard", () => {
  // groupBuyMarkup is an arrow const, so slice its region directly.
  const i = serverSource.indexOf("const groupBuyMarkup =");
  assert.notEqual(i, -1, "groupBuyMarkup missing");
  const mk = serverSource.slice(i, i + 1100);
  assert.match(mk, /compactTradeCardKeyboard\(mint, "b"\)/);
  assert.doesNotMatch(mk, /chart-lab\?ca=/);    // old chart-page URL gone
  assert.doesNotMatch(mk, /url: groupBuyQuickBuyUrl/); // old /t redirect gone
  const compact = functionBody(serverSource, "compactTradeCardKeyboard");
  assert.match(compact, /TG Quick Buy/);
  assert.match(compact, /Web Quick Buy/);
  assert.match(compact, /Slime Chart/);
  assert.match(compact, /telegramWebLoginButton/);
  assert.match(compact, /links\.telegramSiteLogin/);
  assert.match(compact, /links\.telegramQuickLogin/);
  assert.match(compact, /if \(src === "b"\)/);
  assert.match(compact, /📊 Dex Chart/);
  assert.match(compact, /dexscreener\.com\/robinhood/);
  assert.match(compact, /dexScreenerUrl\(target\)/);
  assert.match(compact, /callback_data: `buyopen:\$\{src\}:/);
  assert.match(compact, /callback_data: `btm:\$\{src\}:/);
});

test("buy bot posts only real per-buy cards — no 'Buys rolling in' aggregate", () => {
  const body = functionBody(serverSource, "postGroupBuy");
  assert.match(body, /if \(!perBuy\) \{ groupBuyLastAlertAt\.set/); // early-return skips aggregate
  assert.doesNotMatch(serverSource, /Buys rolling in/);            // the card text is gone entirely
});

test("min buy zero keeps every observed Solana and Robinhood buy in an ordered Telegram queue", () => {
  const solPoll = functionBody(serverSource, "pollGroupBuyTrades");
  const collect = functionBody(serverSource, "collectGroupBuyTrades");
  const page = functionBody(serverSource, "fetchGroupBuyTradePage");
  const delivery = functionBody(serverSource, "queueGroupBuyTradeDelivery");
  const rhPoll = functionBody(serverSource, "rhGroupBuyTick");
  const solPost = functionBody(serverSource, "postGroupBuy");
  const rhPost = functionBody(serverSource, "postGroupBuyRh");
  const queue = functionBody(serverSource, "drainGroupBuyAlertQueue");
  assert.match(page, /GROUP_BUY_TRADE_PAGE_LIMIT/);
  assert.match(page, /searchParams\.set\("cursor", cursor\)/);
  assert.match(page, /AbortSignal\.timeout\(5_000\)/);
  assert.match(collect, /pagination\?\.nextCursor/);
  assert.match(collect, /while \(pageCount < GROUP_BUY_TRADE_MAX_PAGES\)/);
  assert.match(collect, /groupBuySeenTx\.set\(mint/); // persists even a successful empty baseline
  assert.match(solPoll, /buys\.reverse\(\)/);
  assert.doesNotMatch(solPoll, /posted >= 6|slice\(0, 6\)|mints\.slice\(0, 30\)/);
  assert.match(solPoll, /runWithConcurrency\(mints, 8/);
  assert.match(solPoll, /groupBuyTradePollRunning/);
  assert.match(delivery, /drainGroupBuyTradeDeliveryQueue/);
  assert.doesNotMatch(rhPoll, /slice\(0, 6\)/);
  assert.match(solPost, /min > 0 && solAmount < min/);
  assert.match(rhPost, /min > 0 && isEthQuote && paidAmount < min/);
  assert.match(solPost, /queueGroupBuyAlert/);
  assert.match(rhPost, /queueGroupBuyAlert/);
  assert.match(functionBody(serverSource, "groupBuyAlertRetryMs"), /retry after/);
  assert.match(queue, /sleep\(1_100\)/);
  assert.match(rhPost, /tap Slime Chart below to open signed in/);
});

test("Pump buy polling is fast, cursor-safe, and does not swallow a new coin's first buy", () => {
  const collect = functionBody(serverSource, "collectGroupBuyTrades");
  const start = functionBody(serverSource, "startGroupBuyBot");
  const scan = functionBody(serverSource, "getGroupBuyScan");
  const post = functionBody(serverSource, "postGroupBuy");
  assert.match(serverSource, /const GROUP_BUY_TRADE_POLL_MS = 1_500/);
  assert.match(serverSource, /const GROUP_BUY_TRADE_MAX_PAGES = 20/);
  assert.match(collect, /A successful empty first read is a real baseline/);
  assert.match(collect, /if \(firstPoll \|\| reachedSeen\) break/);
  assert.match(collect, /new Set\(\[\.\.\.freshIds, \.\.\.seen\]/);
  assert.match(start, /setTimeout\(\(\) => \{ void pollGroupBuyTrades\(\); \}, 1_000\)/);
  assert.match(start, /GROUP_BUY_TRADE_POLL_MS/);
  assert.match(scan, /groupBuyScanInFlight/);
  assert.match(post, /scanFastTimeout\(scanRequest, 1_500, null\)/);
  assert.match(post, /getGroupBuySupply\(mint, cachedScan\)/);
});

test("scan catches real pasted CAs in text without sentence false-positives", () => {
  assert.match(serverSource, /function isLikelySolMint\(/);
  assert.match(functionBody(serverSource, "isLikelySolMint"), /toBytes\(\)\.length === 32/);
  assert.match(serverSource, /function hasExplicitScanAddressHint\(/);
  assert.match(serverSource, /resolveExplicitScanTargetsFromText\(rawGroupText, \[\], 1\)/); // "thoughts on <CA>?"
  assert.match(serverSource, /resolveExplicitScanTargetsFromText\(rawDmText, \[\], 1\)/);    // DM text + CA
  assert.match(serverSource, /isLikelySolMint\(caTok\)/);   // group trigger
  assert.match(serverSource, /isLikelySolMint\(caTokDm\)/); // DM trigger
  // The old space-stripping exec (which concatenated a sentence into a fake CA) is gone.
  assert.ok(!serverSource.includes('.exec(text.replace(/\\s+/g, ""))'), "space-strip CA match must be removed");
});

test("raid setup: click a metric -> type the number; duration in minutes", () => {
  assert.match(serverSource, /async function applyRaidTypedInput\(/);
  assert.match(serverSource, /const raidInputPending = new Map\(\)/);
  assert.match(serverSource, /function raidConfig\(/);
  assert.match(serverSource, /async function setRaidConfig\(/);
  assert.match(serverSource, /\/raidpreset/);
  assert.match(serverSource, /callback_data: "rd:p:quick"/);
  assert.match(serverSource, /callback_data: "rd:p:save"/);
  assert.match(serverSource, /const RAID_DEFAULT_PRESET = \{ targets: \{ likes: 10, rts: 5, replies: 5, bookmarks: 1 \}/);
  assert.match(serverSource, /RAID_DEFAULT_PRESET = \{[^\n]+durationMin: 15/);
  assert.match(serverSource, /const RAID_CONFIG_VERSION = 3/);
  assert.match(functionBody(serverSource, "raidConfig"), /\[5, 120\]\.includes\(Number\(saved\.durationMin\)\)/);
  assert.match(functionBody(serverSource, "raidConfig"), /migrateOldDefault \? RAID_DEFAULT_PRESET\.durationMin/);
  assert.match(functionBody(serverSource, "setRaidConfig"), /version: RAID_CONFIG_VERSION/);
  assert.match(functionBody(serverSource, "writeGroupBot"), /withFileLock\(GROUP_BOT_FILE/);
  assert.doesNotMatch(functionBody(serverSource, "writeGroupBot"), /catch\s*\{/);
  // Callback asks via a POPUP (no chat message -> no flood), not a ladder.
  const cb = functionBody(serverSource, "handleRaidSetupCallback");
  assert.match(cb, /show_alert: true/);
  assert.match(cb, /raidInputPending\.set\(/);
  assert.match(cb, /setRaidConfig\(chatId/);
  assert.match(cb, /d\.durationMin = RAID_DEFAULT_PRESET\.durationMin/);
  assert.match(cb, /await renderRaidSetupCard\(chatId, msgId, d\)/);
  assert.match(cb, /await ack\(notice\)/);
  assert.match(functionBody(serverSource, "handleCallback"), /"rd:"/); // raid callback owns its useful acknowledgement
  assert.doesNotMatch(serverSource, /raidLadderNext/);   // ladder removed
  // The admin's typed number is deleted so it doesn't flood the chat.
  assert.match(functionBody(serverSource, "applyRaidTypedInput"), /deleteMessage.*message\.message_id/);
  // Duration is minutes now.
  assert.match(serverSource, /durationMin/);
  assert.match(functionBody(serverSource, "raidSetupCard"), /Duration: \$\{cleanRaidDuration\(d\.durationMin\)/);
  const raidHandler = functionBody(serverSource, "handleTelegramRaidCommand");
  assert.match(raidHandler, /durationMin: cfg\.durationMin/); // typed-goal shortcut honors the group's preset too
  assert.match(raidHandler, /setup card send failed/);
  assert.match(raidHandler, /Send Messages and Pin Messages/);
  assert.match(raidHandler, /message_thread_id: messageThreadId/); // forum-topic commands answer in the same topic
  const alertSender = functionBody(serverSource, "sendGroupAlertMedia");
  assert.match(serverSource, /async function sendGroupAlertMedia\([^\n]+messageThreadId = null/);
  assert.match(alertSender, /message_thread_id: messageThreadId/);
  assert.match(alertSender, /return \{ result: null, hasMedia: false, error \}/); // retain Telegram's real blocker
  const tweetParser = functionBody(serverSource, "parseTweetId");
  assert.match(tweetParser, /fxtwitter\|vxtwitter\|fixupx/);
  assert.match(tweetParser, /status\\\/\(\\d\+\)/);
  const groupCommand = functionBody(serverSource, "handleGroupBotCommand");
  assert.match(groupCommand, /cmd === "raid" && !arg/);
  const messageHandler = functionBody(serverSource, "handleMessage");
  assert.match(messageHandler, /setGroupBotFeature\(chatId, "raid", true\)/);
  const channelHandler = functionBody(serverSource, "handleChannelPostCommands");
  assert.match(channelHandler, /parseCommandWithArgument\(text, \["raid"\]\)/);
  assert.match(channelHandler, /handleTelegramRaidCommand\(chatId, post/); // posting as a channel still starts raids
  assert.match(channelHandler, /handleTelegramNextRaidCommand\(chatId, post/);
  // A live raid is pinned, and every fifth newer group post replaces it at the bottom without
  // leaving duplicate cards behind. Completion unpins it.
  assert.match(functionBody(serverSource, "startRaidFromDraft"), /pinChatMessage/);
  assert.match(functionBody(serverSource, "startRaidFromDraft"), /messageThreadId: d\.messageThreadId/);
  assert.match(functionBody(serverSource, "queueRaidBehindActive"), /messageThreadId: Number\(draft\.messageThreadId\)/);
  assert.match(functionBody(serverSource, "startRaidFromDraft"), /unpinOtherRaidCardsForChat\(chatId, sent\.result\.message_id\)/);
  assert.match(functionBody(serverSource, "unpinOtherRaidCardsForChat"), /unpinChatMessage/);
  assert.match(functionBody(serverSource, "claimRaidGroupResurface"), /postsSinceRefresh >= 5/);
  const resurface = functionBody(serverSource, "maybeResurfaceActiveRaid");
  assert.match(resurface, /copyMessage/);
  assert.match(resurface, /message_thread_id: job\.ref\.messageThreadId/);
  assert.match(resurface, /pinChatMessage/);
  assert.match(resurface, /unpinChatMessage/);
  assert.match(resurface, /deleteMessage/);
  assert.match(functionBody(serverSource, "handleMessage"), /maybeResurfaceActiveRaid\(chatId, message\.message_id, message\.message_thread_id\)/);
  const cancel = functionBody(serverSource, "cancelActiveRaidForChat");
  assert.match(cancel, /card\.refs = card\.refs\.filter/);
  assert.match(cancel, /Raid cancelled/);
  assert.match(cancel, /unpinChatMessage/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /cancelActiveRaidForChat\(chatId\)/);
  // One active raid per group; later raids persist in FIFO order and auto-start on completion,
  // timeout, refresh completion, resurface completion, or /cancel raid.
  assert.match(serverSource, /async function queueRaidBehindActive\(/);
  assert.match(serverSource, /async function startNextQueuedRaidForChat\(/);
  assert.match(functionBody(serverSource, "readRaidTg"), /s\.queues/);
  assert.match(functionBody(serverSource, "queueRaidBehindActive"), /queue\.push/);
  assert.match(serverSource, /const RAID_QUEUE_MAX = 10/);
  assert.match(functionBody(serverSource, "queueRaidBehindActive"), /slice\(0, RAID_QUEUE_MAX\)/);
  assert.match(functionBody(serverSource, "handleMessage"), /handleTelegramNextRaidCommand\(chatId, message, userId/);
  assert.match(functionBody(serverSource, "handleTelegramNextRaidCommand"), /\/next &lt;X post link&gt;/);
  assert.match(functionBody(serverSource, "handleTelegramNextRaidCommand"), /status\.activeRaid/);
  assert.match(functionBody(serverSource, "raidQueueStatus"), /ref\?\.durationMs/);
  assert.match(functionBody(serverSource, "readRaidTg"), /durationMin: activeDurationMin/);
  assert.match(functionBody(serverSource, "startNextQueuedRaidForChat"), /queue\.shift/);
  assert.match(functionBody(serverSource, "refreshRaidTgCards"), /startNextQueuedRaidForChat/);
  assert.match(functionBody(serverSource, "refreshRaidTgCards"), /Object\.keys\(queuedState\.queues/);
  assert.match(functionBody(serverSource, "cancelActiveRaidForChat"), /startNextQueuedRaidForChat/);
  // The configured duration is a real hard stop independent of the slower X engagement refresh.
  assert.match(serverSource, /const raidExpiryTimers = new Map\(\)/);
  assert.match(functionBody(serverSource, "startRaidFromDraft"), /scheduleRaidHardExpiry\(chatId, res\.tid, startedAt, durationMs\)/);
  assert.match(functionBody(serverSource, "scheduleRaidHardExpiry"), /finishExpiredRaidForChat/);
  const expiry = functionBody(serverSource, "finishExpiredRaidForChat");
  assert.match(expiry, /card\.refs = card\.refs\.filter/);
  assert.match(expiry, /unpinChatMessage/);
  assert.match(expiry, /startNextQueuedRaidForChat/);
  assert.match(expiry, /Raid time is up/);
  assert.match(expiry, /Time for the next raid/);
  assert.match(functionBody(serverSource, "refreshRaidTgCards"), /Hard-stop recovery[\s\S]*finishExpiredRaidForChat[\s\S]*fetchXEngagement/);
  assert.match(functionBody(serverSource, "attachRaidTgCard"), /startedAt: Number\(startedAt\)[\s\S]*durationMs: Number\(durationMs\)/);
});

// ---- Settings hub (multi-level menu) + Shield (in Rose) + separate raid media ----
test("settings menu is multi-level: home -> per-bot sub-menus, clickable toggles + typed inputs", () => {
  assert.match(serverSource, /function groupBotModuleView\(/);
  assert.match(serverSource, /async function groupBotRenderModule\(/);
  const command = functionBody(serverSource, "handleGroupBotCommand");
  assert.match(command, /\(s\|settings\|buybot\|raid\|rose\|scan\)/); // /s opens group settings too
  assert.match(command, /m\[1\]\.toLowerCase\(\) === "s" \? "settings"/);
  assert.match(command, /group-settings-command:\$\{message\.message_id\}/); // one menu per Telegram update
  const cb = functionBody(serverSource, "handleGroupBotCallback");
  assert.match(cb, /gb:m:\(buy\|raid\|rose\|scan/);   // open a module sub-menu
  assert.match(cb, /gb:tog:/);                          // flip a rose/shield boolean
  assert.match(cb, /gb:in:/);                           // typed-input settings
  assert.match(cb, /gb:media:\(buy\|raid\)/);           // media hint
  assert.match(serverSource, /async function applyGbInput\(/);
  assert.match(serverSource, /if \(await applyGbInput\(message, userId\)/); // wired into the router
});

test("group Buy Bot settings load once and recover without destructive empty-store fallback", () => {
  const read = functionBody(serverSource, "readGroupBot");
  const load = functionBody(serverSource, "loadGroupBotStore");
  const write = functionBody(serverSource, "writeGroupBot");
  const merge = functionBody(serverSource, "mergeGroupBotStore");
  const commands = functionBody(serverSource, "registerTelegramBotCommands");

  assert.match(serverSource, /GROUP_BOT_BACKUP_FILE/);
  assert.match(read, /groupBotLoadPromise/);
  assert.match(load, /recovered persistent group settings from backup/);
  assert.match(load, /primaryError\?\.code === "ENOENT" && backupError\?\.code === "ENOENT"/);
  assert.doesNotMatch(read, /catch\s*\{\s*groupBotCache\s*=\s*\{\s*groups:\s*\{\}/);
  assert.match(write, /readJson\(GROUP_BOT_FILE\)/);
  assert.match(write, /mergeGroupBotStore\(persisted, snapshot\)/);
  assert.match(write, /writeJsonFile\(GROUP_BOT_BACKUP_FILE, next\)/);
  assert.match(merge, /features: \{ \.\.\.\(prior\.features \|\| \{\}\), \.\.\.\(next\.features \|\| \{\}\) \}/);
  assert.match(merge, /\["customMedia", "raidMedia"\]/);
  assert.match(merge, /priorUpdatedAt > nextUpdatedAt/);
  assert.match(merge, /keepLegacyCustom/);
  const mergeStores = Function("validGroupBotStore", `return (persisted, incoming) => {${merge}}`)(
    (value) => Boolean(value && typeof value === "object" && value.groups && typeof value.groups === "object" && !Array.isArray(value.groups))
  );
  const custom = { type: "photo", value: "telegram-custom-file-id" };
  const kept = mergeStores(
    { groups: { "-100": { customMedia: custom, customMediaUpdatedAt: 200 } } },
    { groups: { "-100": { customMedia: null, customMediaUpdatedAt: 100 } } }
  );
  assert.deepEqual(kept.groups["-100"].customMedia, custom);
  const legacyKept = mergeStores(
    { groups: { "-200": { customMedia: custom } } },
    { groups: { "-200": { customMedia: null } } }
  );
  assert.deepEqual(legacyKept.groups["-200"].customMedia, custom);
  const cleared = mergeStores(kept, { groups: { "-100": { customMedia: null, customMediaUpdatedAt: 300 } } });
  assert.equal(cleared.groups["-100"].customMedia, null);
  assert.match(commands, /command: "s", description: "Group bot settings \(admins\)"/);
  assert.match(commands, /groupCommands\.filter\(\(item\) => item\.command !== "s"\)/);
});

test("group admins can call admins or recently seen members without flooding", () => {
  assert.match(serverSource, /async function handleGroupMentionCall\(/);
  assert.match(functionBody(serverSource, "handleMessage"), /rememberGroupMentionMember/);
  assert.match(functionBody(serverSource, "handleMessage"), /handleGroupMentionCall\(message, userId\)/);
  const call = functionBody(serverSource, "handleGroupMentionCall");
  assert.match(call, /admin\|admins\|all\|everyone/);
  assert.match(call, /isGroupBotAdmin/);
  assert.match(call, /mention-\$\{mode\}/);
  assert.match(call, /120_000/);
  assert.doesNotMatch(call, /mentions are cooling down/);
  assert.match(call, /groupMentionKnownMembers/);
  assert.match(functionBody(serverSource, "telegramGroupAdmins"), /getChatAdministrators/);
  const known = functionBody(serverSource, "groupMentionKnownMembers");
  assert.match(known, /readGroupKarma/);
  assert.match(known, /readTelegramCalls/);
  assert.match(known, /readCommunitySnipe/);
  assert.match(known, /readRoomBoard/);
  assert.match(functionBody(serverSource, "handleChatMemberUpdate"), /rememberGroupMentionMember/);
  const sendAll = functionBody(serverSource, "sendGroupMentionChunks");
  assert.match(sendAll, /slice\(0, 200\)/);
  assert.match(sendAll, /index \+= 10/); // small batches keep every Telegram mention active
  assert.match(sendAll, /sendGroupMentionEntityBatch/);
  const entityBatch = functionBody(serverSource, "sendGroupMentionEntityBatch");
  assert.match(entityBatch, /type = "mention"/);
  assert.match(entityBatch, /type = "text_mention"/);
  assert.match(entityBatch, /entities/);
  assert.match(serverSource, /"message_reaction"/);
  assert.match(functionBody(serverSource, "handleUpdate"), /update\.message_reaction/);
  assert.match(functionBody(serverSource, "handleCallback"), /rememberGroupMentionMember/);
  assert.match(serverSource, /group-mentions\.json/);
});

test("core group mute commands work even when Rose is off", () => {
  const group = functionBody(serverSource, "handleGroupBotCommand");
  assert.match(group, /\(mute\|unmute\|tmute\)/);
  assert.match(group, /reply_to_message\?\.from/);
  assert.match(group, /I won't mute another group admin/);
  assert.match(group, /restrictChatMember/);
  assert.match(group, /ROSE_MUTE_PERMS/);
  assert.match(group, /ROSE_UNMUTE_PERMS/);
  assert.match(group, /roseParseDuration/);
});

test("owner growth stats track web, Telegram, wallets, groups, and generated sites", () => {
  assert.match(serverSource, /function growthStatsPath\(/);
  assert.match(serverSource, /async function recordTelegramGrowthUser\(/);
  assert.match(serverSource, /async function platformGrowthSnapshot\(/);
  assert.match(serverSource, /async function handlePlatformGrowthCommand\(/);
  assert.match(functionBody(serverSource, "handleMessage"), /adminstats[\s\S]*platformstats/);
  assert.match(functionBody(serverSource, "handleMessage"), /That command is owner-only/);
  assert.match(functionBody(serverSource, "handleMessage"), /platform totals stay private/);
  assert.match(functionBody(serverSource, "walletRecord"), /createdAt: new Date\(\)\.toISOString\(\)/);
  const snapshot = functionBody(serverSource, "platformGrowthSnapshot");
  for (const source of ["readWebAuthStore", "readWalletStore", "readTelegramGroups", "readLaunchOs", "readGrowthStats", "readTradeHistory"]) assert.match(snapshot, new RegExp(source));
  assert.match(serverSource, /function tradeUsageStats\(/);
  assert.match(serverSource, /function countTradedWallets\(/);
  const growth = functionBody(serverSource, "handlePlatformGrowthCommand");
  assert.match(growth, /SlimeWire Owner Analytics/);
  assert.match(growth, /Direct bot users/);
  assert.match(growth, /completed buys\/sells/);
  assert.match(growth, /Top users/);
  assert.match(growth, /Open private dashboard/);
});

test("KOL Call Feed watches public sources, is admin-selected, deduped, and posts one combined scan", () => {
  assert.match(serverSource, /allowed_updates: \["message", "callback_query", "inline_query", "channel_post"/);
  const channel = functionBody(serverSource, "handleChannelPostCommands");
  assert.match(channel, /setKolSourceOptIn\(post\.chat, action === "on"\)/);
  assert.match(channel, /handleKolSourceChannelPost\(post\)/);
  assert.match(channel, /kolfeed-command:\$\{post\.message_id\}/);
  const dispatch = functionBody(serverSource, "handleKolSourceChannelPost");
  assert.match(dispatch, /registered\?\.feedDisabled/);
  assert.match(dispatch, /_publicPreview/);
  assert.match(dispatch, /claimKolCallFeedPost/);
  assert.match(dispatch, /cfg\.on && cfg\.sources\.some/);
  assert.match(dispatch, /const primaryMint = targets\[0\]/);
  assert.match(dispatch, /sendKolTextPostToTarget/);
  assert.doesNotMatch(dispatch, /for \(const mint of targets\)/);
  const forward = functionBody(serverSource, "sendKolCallCardToTarget");
  assert.match(forward, /kolCallDeliveryGuard/);
  assert.doesNotMatch(forward, /telegram\("forwardMessage"/);
  assert.match(forward, /original post/);
  assert.match(forward, /postExcerpt/);
  assert.match(forward, /<blockquote>/);
  assert.match(forward, /handleTelegramLookCommand\(targetChatId, post, mint, \{ skipCooldown: true, contextHtml \}\)/);
  const textPost = functionBody(serverSource, "sendKolTextPostToTarget");
  assert.match(textPost, /KOL Post:/);
  assert.doesNotMatch(textPost, /No CA, coin link or \$ticker/);
  assert.match(textPost, /kolCallDeliveryGuard/);
  const targets = functionBody(serverSource, "kolCallPostTargets");
  assert.match(targets, /resolveExplicitScanTargetsFromText/);
  assert.match(targets, /A selected KOL's \$ticker/);
  assert.match(targets, /isRhContract/);
  assert.match(targets, /isSolMintAddress/);
  const menu = functionBody(serverSource, "groupBotModuleView");
  assert.match(menu, /module === "kol"/);
  assert.match(menu, /Add source channel/);
  const callback = functionBody(serverSource, "handleGroupBotCallback");
  assert.match(callback, /gb:kol:add/);
  assert.match(callback, /gb:kol:rm:/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /kolsource\|callsource/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /kollfeed/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /kolfeed-command:\$\{message\.message_id\}/);
  const input = functionBody(serverSource, "applyKolFeedSourceInput");
  assert.match(input, /resolveKolSourceReference/);
  assert.match(input, /Anonymous group admins/);
  assert.match(input, /Private invite links/);
  assert.match(input, /kolfeed-input:\$\{message\.message_id\}/);
  assert.match(functionBody(serverSource, "handleGroupBotCallback"), /gb:kol:add[\s\S]*sendMessage[\s\S]*promptMsgId/);
  assert.match(functionBody(serverSource, "clearKolFeedInputPrompt"), /deleteMessage/);
  const resolver = functionBody(serverSource, "resolveKolSourceReference");
  assert.match(resolver, /publicLink/);
  assert.match(resolver, /telegram/);
  const publicPoll = functionBody(serverSource, "pollPublicKolSources");
  assert.match(publicPoll, /https:\/\/t\.me\/s\//);
  assert.match(publicPoll, /Math\.min\(10, all\.length\)/);
  assert.match(publicPoll, /First observation is a baseline/);
  assert.match(publicPoll, /slice\(-5\)/);
  assert.match(functionBody(serverSource, "parseTelegramPublicPreview"), /tgme_widget_message_wrap/);
});

test("Shield folds into Rose: scam/ghost/impersonator/auto-whitelist (all off by default)", () => {
  const d = functionBody(serverSource, "roseDefaults");
  assert.match(d, /deleteScam: false/);
  assert.match(d, /deleteDeletedAccounts: false/);
  assert.match(d, /antiImpersonator: false/);
  assert.match(d, /autoWhitelist: 0/);
  assert.match(serverSource, /function isDeletedTgAccount\(/);
  assert.match(serverSource, /async function shieldIsImpersonator\(/);
  const rose = functionBody(serverSource, "handleGroupRose");
  assert.match(rose, /cfg\.deleteScam/);
  assert.match(rose, /cfg\.deleteDeletedAccounts/);
  assert.match(rose, /cfg\.antiImpersonator/);
  assert.match(rose, /whitelisted/);
  // High-confidence scam patterns exist (delete only, non-admin).
  assert.match(serverSource, /const SHIELD_SCAM_RE =/);
});

test("raid has its OWN media, separate from buy art", () => {
  assert.match(serverSource, /\/setraidmedia/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /setGroupBotMedia\(chatId, "raidMedia", media\)/);
  // startRaidFromDraft prefers raidMedia, falls back to customMedia.
  assert.match(functionBody(serverSource, "startRaidFromDraft"), /ge\.raidMedia[\s\S]*ge\.customMedia/);
});

// ---- Whales mode + Web verification portal + Referral contests (phase 2) ----
const verifyHtml = fs.readFileSync(new URL("../web/public/verify.html", import.meta.url), "utf8");

test("verify portal: signed token + holdings check + submit route (read-only, no fund movement)", () => {
  assert.match(serverSource, /function signVerifyToken\(/);
  assert.match(serverSource, /function readVerifyToken\(/);
  assert.match(functionBody(serverSource, "signVerifyToken"), /createHmac\("sha256", verifySecret\(\)\)/);
  assert.match(serverSource, /async function walletTokenUiBalance\(/);
  assert.match(serverSource, /async function handleTgVerifySubmit\(/);
  const sub = functionBody(serverSource, "handleTgVerifySubmit");
  assert.match(sub, /verifyTelegramMiniAppInitData/);         // Telegram identity, not a shareable browser click
  assert.match(sub, /approveChatJoinRequest/);                // pre-entry request is approved only after passing
  assert.match(sub, /nacl\.sign\.detached\.verify/);          // wallet ownership proof
  assert.match(sub, /walletTokenUiBalance/);                  // holdings gate
  assert.match(sub, /restrictChatMember.*ROSE_UNMUTE_PERMS/); // unmute on success
  assert.doesNotMatch(sub, /sendTransaction|signTransaction|buyToken|sellToken/); // never moves funds
  // routes: page (outer handler) + public submit (inside handleWebApiRequest, no session)
  assert.match(serverSource, /requestUrl\.pathname === "\/verify"/);
  assert.match(serverSource, /pathname === "\/api\/tg\/verify\/submit"/);
  // page posts to the endpoint + signs a message (not a tx)
  assert.match(verifyHtml, /\/api\/tg\/verify\/submit/);
  assert.match(verifyHtml, /signMessage/);
  assert.match(verifyHtml, /telegram-web-app\.js/);
  assert.match(verifyHtml, /Telegram\.WebApp\.initData/);
  assert.match(verifyHtml, /Telegram\.WebApp\.close/);
  assert.doesNotMatch(verifyHtml, /signTransaction|sendTransaction/);
});

test("Rose captcha offers a quiet pre-entry Telegram verification portal", () => {
  assert.match(serverSource, /allowed_updates:[^\]]*"chat_join_request"/);
  assert.match(functionBody(serverSource, "handleUpdate"), /update\.chat_join_request[\s\S]*handleChatJoinRequest/);
  const invite = functionBody(serverSource, "ensureRosePortalInviteLink");
  assert.match(invite, /createChatInviteLink/);
  assert.match(invite, /creates_join_request:\s*true/);
  const request = functionBody(serverSource, "handleChatJoinRequest");
  assert.match(request, /user_chat_id/);
  assert.match(request, /web_app:\s*\{\s*url:/);
  assert.match(request, /slimewire\.org/);
  assert.match(request, /joinRequest:\s*true/);
  assert.doesNotMatch(request, /approveChatJoinRequest/);
  assert.match(functionBody(serverSource, "handleGroupRose"), /cfg\.captcha/); // old/public links remain safely muted
});

test("whales / web verify gate new members (mute until verified)", () => {
  assert.match(serverSource, /function whalesConfig\(/);
  assert.match(serverSource, /function webverifyConfig\(/);
  assert.match(serverSource, /function groupNeedsWebVerify\(/);
  assert.match(serverSource, /async function postWebVerifyGate\(/);
  assert.match(functionBody(serverSource, "postWebVerifyGate"), /restrictChatMember.*ROSE_MUTE_PERMS/);
  // gate is wired into the join loop
  assert.match(functionBody(serverSource, "handleGroupRose"), /groupNeedsWebVerify\(entry\)/);
  // banned-fingerprint alt block
  assert.match(functionBody(serverSource, "handleTgVerifySubmit"), /bannedFps/);
  assert.match(serverSource, /async function shieldRecordBannedFp\(/);
});

test("referral contests: unique invite links + join attribution + leaderboard", () => {
  assert.match(serverSource, /async function handleReferralCommand\(/);
  assert.match(serverSource, /async function handleChatMemberUpdate\(/);
  assert.match(serverSource, /createChatInviteLink/);
  assert.match(functionBody(serverSource, "handleChatMemberUpdate"), /\^ref-\d\+\$|ref-/); // parse ref-<id> link name
  // chat_member updates enabled (both webhook + polling) + dispatched
  assert.match(serverSource, /allowed_updates:.*"chat_member"/);
  assert.match(serverSource, /if \(update\.chat_member\)/);
  // commands wired
  assert.match(serverSource, /handleReferralCommand\(message, userId\)/);
});

test("owner DMs cover group joins, every Buy Bot CA path, and proven callers", () => {
  const targets = functionBody(serverSource, "telegramOwnerDmTargets");
  assert.match(targets, /readXReplyState/);                     // persisted /xclaim works immediately after restart
  assert.match(targets, /CONFIG\.adminUserIds/);               // Telegram owner works even without X configuration
  assert.match(functionBody(serverSource, "handleBotChatMembershipUpdate"), /maybeDmOwnerGroupAdded/);
  assert.match(functionBody(serverSource, "maybeDmOwnerGroupAdded"), /sendTelegramOwnerAlert/);
  assert.match(functionBody(serverSource, "maybeDmOwnerFreshBuyBotCoin"), /sendTelegramOwnerAlert/);
  assert.match(functionBody(serverSource, "maybeDmOwnerProvenCall"), /sendTelegramOwnerAlert/);
  // A failed Telegram send must not consume the retry cooldown.
  assert.match(functionBody(serverSource, "maybeDmOwnerFreshBuyBotCoin"), /for \(const owner of delivered\)/);
  assert.match(functionBody(serverSource, "maybeDmOwnerProvenCall"), /for \(const owner of delivered\)/);
  // Auto-paste, /track, and the menu's typed Track coin field all converge on the same hook.
  assert.match(functionBody(serverSource, "setGroupBotToken"), /onGroupBotTokenChanged/);
  assert.match(functionBody(serverSource, "applyGbInput"), /onGroupBotTokenChanged/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /onGroupBotTokenChanged/);
  assert.match(functionBody(serverSource, "connectLaunchOsTelegramGroup"), /onGroupBotTokenChanged/);
  // Plain CA calls are learned even if the room has Scan Bot display turned off.
  const explicitCall = functionBody(serverSource, "recordTelegramGroupAddressCall");
  assert.match(explicitCall, /recordTelegramCall/);
  assert.match(serverSource, /recordTelegramGroupAddressCall\(message, rhCaTok\)/);
  assert.match(serverSource, /recordTelegramGroupAddressCall\(message, bareCa\[1\]\)/);
});

test("phase-2 menu: Referral tile + whales/web-verify toggles routed", () => {
  const cb = functionBody(serverSource, "handleGroupBotCallback");
  assert.match(cb, /gb:m:\(buy\|raid\|rose\|scan\|ref\)/);
  assert.match(cb, /gb:wv:web/);
  assert.match(cb, /gb:wv:whales/);
  assert.match(cb, /gb:ref:start/);
  assert.match(cb, /gb:ref:stop/);
});

// ---- Referral contest v2: SOL/coin rewards + site-conversion bridge + rich board ----
test("referral v2: configurable SOL/coin reward with amount + coin CA", () => {
  assert.match(functionBody(serverSource, "referralConfig"), /rewardKind: "sol", rewardAmount: 0, rewardMint: "", rewardSymbol: ""/);
  const label = functionBody(serverSource, "referralRewardLabel");
  assert.match(label, /rewardKind === "coin"/);
  assert.match(label, /SOL/);
  // reward setup wired in the ref module + input handlers
  assert.match(serverSource, /callback_data: "gb:ref:kind"/);
  assert.match(serverSource, /callback_data: "gb:in:refamount"/);
  assert.match(serverSource, /rewardAmount: Math\.max\(0, Number\(raw\)/);
  assert.match(serverSource, /rewardKind: "coin", rewardMint: raw/);
});
test("referral v2: site-referred user's first trade credits their TG inviter (non-money counter)", () => {
  const conv = functionBody(serverSource, "maybeCreditReferralConversion");
  assert.match(conv, /ev\.type === "buy"/);                       // first trade
  assert.match(conv, /prof && prof\.referredByGroup/);            // captured at web signup
  assert.match(conv, /cfg\.siteCredited\[uid\]/);                 // count each referred user once
  assert.match(conv, /referralBump\(rg\.chatId, rg\.userId, "site"\)/);
  assert.doesNotMatch(conv, /buyTokenForPlan|sendTransaction|sellToken/); // just a counter, no funds move
  // hooked into the single trade choke point + captured on web signup
  assert.match(serverSource, /void maybeCreditReferralConversion\(events\)/);
  assert.match(serverSource, /referredByGroup: groupRef \? \{ chatId: groupRef\.chatId/);
  // /reflink hands out BOTH a group invite and a site link
  assert.match(functionBody(serverSource, "handleReferralCommand"), /referralSiteLink\(code\)/);
});
test("referral v2: rich board (reward + per-source) + non-custodial winner claim", () => {
  const board = functionBody(serverSource, "referralBoardText");
  assert.match(board, /referralRewardLabel/);
  assert.match(board, /tg.*site|site.*tg/);                       // per-source breakdown
  const win = functionBody(serverSource, "referralAnnounceWinners");
  assert.match(win, /walletsForOwner/);                          // shows each winner's payout wallet
  assert.match(win, /referralWinnersCount\(cfg\)/);              // announces the TOP N
  assert.match(win, /rows\.slice\(0, N\)/);
  assert.doesNotMatch(win, /buyTokenForPlan|sendTransaction/);   // admin sends via Wallet → Send; bot never moves funds
  // configurable winner count (top 1/3/5/10) + cycle button
  assert.match(serverSource, /REFERRAL_WINNER_TIERS = \[1, 3, 5, 10\]/);
  assert.match(serverSource, /callback_data: "gb:ref:winners"/);
});
test("SlimeWire Alerts = a menu toggle any admin flips per channel, on the main bot token", () => {
  // surfaced as a toggle in the /settings hub (not just the hidden /slimewire command)
  assert.match(functionBody(serverSource, "groupBotMenuMarkup"), /callback_data: "gb:alerts"/);
  const cb = functionBody(serverSource, "handleGroupBotCallback");
  assert.match(cb, /data === "gb:alerts"/);
  assert.match(cb, /alerts: !cur/);                                  // flips the per-chat opt-in
  // per-group broadcast works on the MAIN bot token (bot is already in the channels), no extra secret
  assert.match(serverSource, /telegramChannelBotToken: process\.env\.TG_CHANNEL_BOT_TOKEN \|\| process\.env\.TELEGRAM_BOT_TOKEN/);
  assert.match(functionBody(serverSource, "runAlphaDropTick"), /groupBridgeFor\(chatId\)\.announce/);
});
test("⚡ one-click group buy fires from the tapper's OWN wallet, idempotent, receipt goes to DM", () => {
  const exec = functionBody(serverSource, "tgExecuteQuickBuy");
  assert.match(exec, /walletsForOwner\(await readWalletStore\(\), userId\)/);   // the tapper's own wallet
  assert.match(exec, /runIdempotentMoneyOp\("tg-quick-buy"/);                   // dedup double-taps
  assert.match(exec, /buyTokenForPlan\(wallet, mint, lamports/);
  assert.match(exec, /if \(!wallet\) return \{ ok: false, needWallet: true \}/); // no wallet → funnel, not crash
  const cb = functionBody(serverSource, "handleQuickBuyCallback");
  assert.match(cb, /quickBuySendReceipt\(userId, mint, amt, r\.result\)/);       // receipt to DM (userId), never the group; now carries live buy result
  assert.match(cb, /noWalletAckText\(await funnelNoWallet\(userId\)\)/);        // no-wallet → DM a Create-Wallet button + guide
  // ⚡ Quick Buy (preset) button on the group scan card + qb: routing (DM receipt) + custom input wired
  assert.match(functionBody(serverSource, "slimeScanKeyboard"), /compactTradeCardKeyboard\(mint, "s"\)/);
  assert.match(functionBody(serverSource, "telegramQuickBuyPanelKeyboard"), /callback_data: `qbp:\$\{target\}`/);
  assert.match(serverSource, /startsWith\("qb:"\)/);
  assert.match(serverSource, /applyTgQuickBuyInput\(message, userId\)/);
});
test("⏰ Limit order = clean in-chat sub-menu builder with tidy auto-deleting typed inputs", () => {
  // The ⏰ button opens the NEW button-driven builder (in whatever chat you tapped it — group or DM).
  assert.match(functionBody(serverSource, "handleLimitOrderCallback"), /openLimitBuilder\(chatId, userId, m\[1\]\)/);
  assert.match(serverSource, /startsWith\("lo2:"\)/);   // builder callbacks routed
  // Builder = per-field sub-menu buttons (Side / Target MC / Amount / Arm), owner-gated per user.
  const cb = functionBody(serverSource, "handleLimitBuilderCallback");
  assert.match(cb, /String\(userId\) !== String\(owner\)/);   // collision-safe in a shared group
  assert.match(cb, /addLimitOrder\(userId, spec\)/);          // Arm creates the order
  assert.match(cb, /promptCleanInput\(chatId, userId/);       // 🎯/💰 buttons prompt ONE tidy value
  // Clean input: consume ONE value, then DELETE both the prompt and the user's reply.
  const ci = functionBody(serverSource, "applyCleanInput");
  assert.match(ci, /deleteMessage", \{ chat_id: chatId, message_id: message\.message_id \}/); // user's reply
  assert.match(ci, /deleteMessage", \{ chat_id: chatId, message_id: pend\.promptMsgId \}/);    // the prompt
  assert.match(ci, /renderLimitBuilder\(chatId, userId\)/);   // re-renders the builder in place
  assert.match(serverSource, /applyCleanInput\(message, userId\)/);   // hooked in the message handler
  // Quick-buy custom amount also uses the clean in-chat input (no DM), via the ⚙️ Preset editor ✏️.
  assert.match(serverSource, /callback_data: `pe:ax:\$\{uid\}`/);
  assert.match(functionBody(serverSource, "handlePresetEditorCallback"), /kind === "ax"/);
});
test("⚡ Quick Buy (preset) + ⚙️ in-group Preset editor: buy your preset + edit amount/TP/SL, no DM", () => {
  // Preset store now holds a one-tap amount + TP/SL, all editable via setBuyPref.
  assert.match(functionBody(serverSource, "userBuyPrefs"), /quickAmount/);
  assert.match(functionBody(serverSource, "userBuyPrefs"), /takeProfitPct/);
  assert.match(functionBody(serverSource, "userBuyPrefs"), /stopLossPct/);
  const setp = functionBody(serverSource, "setBuyPref");
  assert.match(setp, /kind === "amount"/);
  assert.match(setp, /kind === "tp"/);
  assert.match(setp, /kind === "sl"/);
  // Quick Buy preset: buys the tapper's amount then arms their TP/SL via the site auto-exit engine.
  const exec = functionBody(serverSource, "tgExecuteQuickBuyPreset");
  assert.match(exec, /amountSol = .*prefs\.quickAmount/);
  assert.match(exec, /tgExecuteQuickBuy\(userId, mint, amountSol/);
  assert.match(exec, /idempotencyParts/);
  assert.match(exec, /webCreateSingleTradeAutoExitPlan\(userId, r\.wallet, mint/);
  // Routed: qbp: (buy) + pe: (editor) both dispatched.
  assert.match(serverSource, /startsWith\("qbp:"\)/);
  assert.match(serverSource, /startsWith\("pe:"\)/);
  // In-group editor is per-user (owner-gated) and edits the tapper's own pref — collision-safe.
  const ed = functionBody(serverSource, "handlePresetEditorCallback");
  assert.match(ed, /String\(userId\) !== String\(owner\)/);   // someone else's taps don't move it
  assert.match(ed, /setBuyPref\(userId, kindMap\[kind\], Number\(parts\[2\]\)\)/);
});
test("per-user BUY PRESETS: settable in DM, drive the DM receipt's ⚡ buttons + a custom preset", () => {
  assert.match(serverSource, /DEFAULT_BUY_PRESETS = \[0\.5, 1, 2\]/);
  assert.match(functionBody(serverSource, "setBuyPref"), /writeJsonFile\(buyPrefsPath\(\)/);
  assert.match(functionBody(serverSource, "quickBuyReceiptKeyboard"), /userBuyPrefs\(await readBuyPrefs\(\), userId\)/); // receipt uses YOUR presets
  assert.match(functionBody(serverSource, "quickBuyReceiptKeyboard"), /callback_data: `qb:\$\{custom\}:\$\{mint\}`/);     // custom preset one-tap
  assert.match(serverSource, /startsWith\("bp:"\)/);                        // presets menu routed
  assert.match(serverSource, /applyBuyPrefInput\(message, userId\)/);       // typed input wired
  assert.match(serverSource, /text === "\/presets"/);                       // command
});
test("DM terminal hub: trading-first main menu + Settings (presets + slippage), our tools kept", () => {
  const menu = serverSource.slice(serverSource.indexOf("const PUBLIC_MENU"), serverSource.indexOf("const PUBLIC_MENU") + 900);
  assert.match(menu, /callback_data: "buy_prompt"/);
  assert.match(menu, /callback_data: "positions_overview"/);      // sell & positions
  assert.match(menu, /callback_data: "settings_menu"/);
  assert.match(menu, /callback_data: "launch_coin"/);             // our tool
  assert.match(menu, /callback_data: "dm_signals"/);              // alerts
  assert.match(menu, /callback_data: "copy_trade_start"/);        // Copy Trade (input a wallet), replaces Sniper & Copy
  assert.match(menu, /callback_data: "volume_bot"/);              // real Volume Bot (matches the site), replaces ogre_tools_menu
  assert.doesNotMatch(menu, /callback_data: "sniper_menu"/);      // sniper removed from the main menu
  // Lean trading-first menu: Ogre A.I. + Live Pairs/Scans + top-level App/Web are removed
  // (App/Web live under 🔗 Links now; pairs/scans are a richer experience on the site/app).
  assert.doesNotMatch(menu, /callback_data: "ogre_ai_menu"/);
  assert.doesNotMatch(menu, /callback_data: "market_intel_menu"/);
  assert.doesNotMatch(menu, /callback_data: "web_portal"/);
  // Links submenu keeps Get the App but drops Open Web App + Autopilot + Raids per user; old Ogre TG/X
  // links are gone (single SlimeWire website link instead).
  const links = functionBody(serverSource, "showTelegramLinksMenu");
  assert.match(links, /text: "📲 Get the App"/);
  assert.doesNotMatch(links, /callback_data: "web_portal"/);      // Open Web App removed
  assert.doesNotMatch(links, /text: "🤖 Autopilot"/);             // Autopilot removed
  assert.doesNotMatch(links, /text: "⚔️ Raids"/);                 // Raids removed
  assert.doesNotMatch(links, /ogrecoinonsol/);                    // old Ogre TG link gone
  assert.match(links, /text: "🌐 SlimeWire Website"/);            // single site link
  // Settings hub = per-user slippage + presets; the quick-buy USES the user's slippage
  assert.match(serverSource, /SLIP_TIERS = \[300, 500, 1000, 1500, 2500\]/);
  assert.match(functionBody(serverSource, "tgExecuteQuickBuy"), /userBuyPrefs\(await readBuyPrefs\(\), userId\)\.slippageBps/);
  assert.match(serverSource, /startsWith\("st:"\)/);
});
test("Copy Trade (input a wallet): 3-step flow arms the same site copy-wallet watcher", () => {
  // Main-menu button routes to the copy-trade entry, which is registered as a private action.
  assert.match(serverSource, /case "copy_trade_start":\s*\n\s*await startCopyTradeFlow/);
  // 3 session steps: paste wallet -> pick your wallets -> SOL per copied buy.
  assert.match(serverSource, /case "copytrade_wallet":/);
  assert.match(serverSource, /case "copytrade_wallets":/);
  assert.match(serverSource, /case "copytrade_amount":/);
  // Reuses the SAME server-side engine the site uses (webCreateKolCopyWallet) with sane default exits.
  const fin = functionBody(serverSource, "finalizeCopyTrade");
  assert.match(fin, /webCreateKolCopyWallet\(userId, \{/);
  assert.match(fin, /takeProfitPct: "25"/);
  assert.match(fin, /stopLossPct: "8"/);
});
test("Volume Bot (TG): matches the site — rolling ghost pool, offset sells, keepDust, one funding wallet", () => {
  // Main-menu 📈 Volume Bot opens the real volume home; style chosen via vbstyle: callback.
  assert.match(serverSource, /case "volume_bot":\s*\n\s*await showVolumeBotHome/);
  assert.match(serverSource, /startsWith\("vbstyle:"\)/);
  assert.match(serverSource, /case "vbot_ca":/);
  assert.match(serverSource, /case "vbot_source":/);
  // The start path reuses the site engine (webStartVolumeBot) with the exact site behavior:
  const start = functionBody(serverSource, "startVolumeBotWithStyle");
  assert.match(start, /webStartVolumeBot\(userId, \{/);
  assert.match(start, /rollingWallets: true/);   // fresh ghost wallets, never reused
  assert.match(start, /offsetSell: true/);       // a different/older wallet sells (no back-to-back same wallet)
  assert.match(start, /keepDust: true/);         // leaves a sliver of token to pad holders
  assert.match(start, /sweepBack: true/);
  // Stop path sweeps back to source.
  assert.match(functionBody(serverSource, "stopVolumeBotForChat"), /webStopVolumeBot\(userId,/);
});
test("Power Tools + brand footer cleaned: no Sniper Modes / Volume Plans buttons, no old Ogre links", () => {
  const tools = functionBody(serverSource, "showTelegramOgreToolsMenu");
  assert.doesNotMatch(tools, /callback_data: "sniper_modes"/);       // sniper mode removed
  assert.doesNotMatch(tools, /callback_data: "timed_trade_plans"/);  // volume plans removed
  assert.match(tools, /callback_data: "volume_bot"/);                // real volume bot instead
  // Brand footer (appended to nearly every message) drops the old Ogre TG/site/X links.
  const footer = serverSource.slice(serverSource.indexOf("const BRAND_FOOTER"), serverSource.indexOf("const BRAND_FOOTER") + 200);
  assert.doesNotMatch(footer, /ogrecoinonsol/);
  assert.doesNotMatch(footer, /ogremode\.com/);
  assert.doesNotMatch(footer, /twitter\.com\/i\/communities/);
  assert.match(footer, /slimewire\.org/);
});
test("in-DM one-tap SELL (qs:*): own-wallet, idempotent, on the receipt + positions", () => {
  // routed in the dispatcher alongside qb:
  assert.match(serverSource, /startsWith\("qs:"\)/);
  assert.match(serverSource, /handleQuickSellCallback\(query, userId\)/);
  const sell = functionBody(serverSource, "tgExecuteQuickSell");
  assert.match(sell, /walletsForOwner\(await readWalletStore\(\), userId\)/);   // the tapper's OWN wallets
  assert.match(sell, /sellTokenFromWallet\(w, mint, pct, slippageBps/);          // real sell money-path
  assert.match(sell, /runIdempotentMoneyOp\("tg-quick-sell"/);                   // double-tap-proof
  assert.match(sell, /type: "sell", source: "tg-quick-sell"/);                   // recorded for PnL
  // the DM buy receipt now carries in-chat sell buttons (25/50/100%) + Main Menu
  const rk = functionBody(serverSource, "quickBuyReceiptKeyboard");
  assert.match(rk, /callback_data: `qs:100:\$\{mint\}`/);
  assert.match(rk, /callback_data: "main_menu"/);
  // positions overview has per-coin one-tap sell
  assert.match(functionBody(serverSource, "showPositionsOverview"), /callback_data: `qs:100:\$\{position\.tokenMint\}`/);
});
test("⏰ Limit orders: MC-triggered buy/sell, own-wallet, idempotent-claim, paused-safe, auto-expire", () => {
  // persistent store, seeded at boot
  assert.match(serverSource, /function limitOrdersPath\(\)/);
  assert.match(serverSource, /writeJsonIfMissing\(limitOrdersPath\(\), \{ orders: \[\] \}\)/);
  // poller registered + core logic
  assert.match(serverSource, /setInterval\(\(\) => \{ void pollLimitOrders\(\); \}/);
  const poll = functionBody(serverSource, "pollLimitOrders");
  assert.match(poll, /alphaRadarFetchMc\(/);                                        // free MC source (Dex→pump)
  assert.match(poll, /o\.dir === ">=" \? mc >= o\.triggerMc : mc <= o\.triggerMc/);  // trigger evaluation
  assert.match(poll, /settleLimitOrder\(o\.id, "filling"/);                          // CLAIM before executing = no double-fire
  assert.match(poll, /tgExecuteQuickBuy\(o\.userId, o\.mint, o\.amountSol\)/);        // own-wallet buy money-path
  assert.match(poll, /tgExecuteQuickSell\(o\.userId, o\.mint, o\.pct\)/);            // own-wallet sell money-path
  assert.match(poll, /if \(!live\.length \|\| paused\) return/);                     // global pause = don't fire
  // direction auto-derived from MC at arm time (user never reasons about <= vs >=)
  assert.match(functionBody(serverSource, "applyLimitOrderInput"), /triggerMc >= ref \? ">=" : "<="/);
  // guards: per-user cap + expiry + sane SOL bounds
  assert.match(serverSource, /LIMIT_MAX_PER_USER = 25/);
  assert.match(serverSource, /LIMIT_ORDER_TTL_MS/);
  assert.match(serverSource, /LIMIT_MIN_SOL = 0\.01, LIMIT_MAX_SOL = 50/);
  // routed + wired end to end
  assert.match(serverSource, /startsWith\("lo:"\)/);
  assert.match(serverSource, /applyLimitOrderInput\(message, userId\)/);
  assert.match(serverSource, /\(orders\|limit\|dca\)/);                              // /orders /limit /dca command
  assert.match(functionBody(serverSource, "quickBuyReceiptKeyboard"), /callback_data: `lo:new:\$\{mint\}`/);
  assert.match(functionBody(serverSource, "compactCardCategoryKeyboard"), /callback_data: `lo:new:\$\{target\}`/);
  // MC parser is fat-finger-safe (bare small number → $k, k/m suffix honored)
  assert.match(functionBody(serverSource, "parseMcInput"), /m\[2\] === "m"/);
});
test("trader wow-UX: rich receipts (live MC + realized PnL), price alerts, auto-TP ladder", () => {
  // buy receipt now shows live token data (symbol + MC/liq), not just the CA
  assert.match(functionBody(serverSource, "quickBuySendReceipt"), /alphaRadarFetchMc\(mint\)/);
  assert.match(functionBody(serverSource, "quickBuySendReceipt"), /fmtMc\(info\.mc\)/);
  // sell receipt shows realized PnL from trade history
  assert.match(serverSource, /async function realizedPnlForMint/);
  assert.match(functionBody(serverSource, "tgQuickSellReceipt"), /realizedPnlForMint\(userId, mint\)/);
  // price/MC ALERT order type — DM heads-up, no trade; routed + built + stored without an amount
  assert.match(functionBody(serverSource, "pollLimitOrders"), /o\.side === "alert"/);
  assert.match(serverSource, /callback_data: `lo:a:\$\{mint\}`/);
  assert.match(functionBody(serverSource, "handleLimitOrderCallback"), /side: "alert"/);
  assert.match(functionBody(serverSource, "addLimitOrder"), /spec\.side === "sell" \? \{ pct: spec\.pct \} : \{\}/); // alert has no amount field
  // 🎯 Auto-TP ladder arms limit-SELL rungs at MC multiples, one tap from the buy receipt
  assert.match(serverSource, /const TP_LADDERS = \{/);
  assert.match(serverSource, /startsWith\("tp:"\)/);
  assert.match(functionBody(serverSource, "handleTpCallback"), /addLimitOrder\(userId, \{ side: "sell"/);
  assert.match(functionBody(serverSource, "handleTpCallback"), /dir: ">=", pct: rung\.pct/);
  assert.match(functionBody(serverSource, "quickBuyReceiptKeyboard"), /callback_data: `tp:\$\{mint\}`/);
});
test("viral + onboarding: win-flex card, first-run wallet CTA, fee transparency, deposit QR", () => {
  // 📸 personal win-flex from own realized PnL, routed, offered on a winning sell
  assert.match(serverSource, /async function sendUserWinFlex/);
  assert.match(functionBody(serverSource, "sendUserWinFlex"), /realizedPnlForMint\(userId, mint\)/);
  assert.match(serverSource, /startsWith\("wf:"\)/);
  assert.match(functionBody(serverSource, "tgQuickSellReceipt"), /callback_data: `wf:\$\{mint\}`/);
  assert.match(functionBody(serverSource, "tgQuickSellReceipt"), /pnl\.net > 0n && pnl\.pct >= 25/); // only on a real win
  // first-run onboarding: a walletless DM user gets a one-tap create CTA on the menu
  assert.match(functionBody(serverSource, "showMenu"), /walletsForOwner\(await readWalletStore\(\), userId\)\.length === 0/);
  assert.match(functionBody(serverSource, "showMenu"), /Create your free wallet/);
  // fee transparency in settings
  assert.match(functionBody(serverSource, "dmSettingsMenu"), /CONFIG\.baseTradeFeeBps/);
  assert.match(functionBody(serverSource, "dmSettingsMenu"), /Trade fee/);
  assert.match(functionBody(serverSource, "dmSettingsMenu"), /0\.50% goes to SlimeWire and 0\.15% goes to the referrer/);
  // deposit view: QR of the (public) address + wired
  assert.match(serverSource, /async function showDepositView/);
  assert.match(functionBody(serverSource, "showDepositView"), /api\.qrserver\.com/);
  assert.match(serverSource, /callback_data: "deposit_menu"/);
});
test("deferred backlog: migration alerts, wallet convergence, weekly caller contest", () => {
  // 🎓 migration-to-DEX ping folded into Exit Radar (a held bag that left the curve → got DEX liq)
  assert.match(functionBody(serverSource, "pollExitRadar"), /st\.sawCurve && !st\.bornWithLiq && live\.liq > 0 && !st\.migrated/);
  assert.match(functionBody(serverSource, "pollExitRadar"), /just graduated to DEX/);
  // 🚨 wallet convergence: 2+ of a user's tracked wallets buy the same coin in a window
  assert.match(serverSource, /function noteWalletConvergence/);
  assert.match(serverSource, /async function sendWalletConvergenceAlert/);
  assert.match(functionBody(serverSource, "noteWalletConvergence"), /c\.wallets\.size >= 2 && !c\.alerted/);
  assert.match(functionBody(serverSource, "pollTrackedWallets"), /noteWalletConvergence\(uid, sw\.mint, addr, w\.label\)/);
  // 🏆 weekly caller contest: Sunday-gated, once per ISO week per opted-in group, owner-paid prize
  assert.match(serverSource, /async function pollWeeklyCallerContest/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void pollWeeklyCallerContest\(\); \}/);
  assert.match(functionBody(serverSource, "pollWeeklyCallerContest"), /now\.getUTCDay\(\) !== 0/);
  assert.match(functionBody(serverSource, "pollWeeklyCallerContest"), /g\.lastCallerContestWeek === week/);
  assert.match(functionBody(serverSource, "pollWeeklyCallerContest"), /Caller of the Week/);
});
test("live position card + copy-room consensus", () => {
  // 📊 live per-coin manage card, routed with in-place refresh, reachable from Positions
  assert.match(serverSource, /async function showPositionCard/);
  assert.match(serverSource, /match\(\/\^pos:\(\[1-9A-HJ-NP-Za-km-z\]\{32,44\}\)\$\/\)/);
  assert.match(functionBody(serverSource, "showPositionCard"), /buildPositionsOverview\(userId\)/);
  assert.match(functionBody(serverSource, "showPositionsOverview"), /callback_data: `pos:\$\{position\.tokenMint\}`/);
  // 🤝 copy-room consensus: mirror when ≥2 board traders buy the same coin, own wallet, idempotent
  assert.match(serverSource, /async function maybeCopyRoomConsensus/);
  assert.match(serverSource, /void maybeCopyRoomConsensus\(events\)/);
  assert.match(functionBody(serverSource, "maybeCopyRoomConsensus"), /c\.members\.size < ROOM_CONSENSUS_MIN \|\| c\.fired/);
  assert.match(functionBody(serverSource, "maybeCopyRoomConsensus"), /runIdempotentMoneyOp\("copy-consensus"/);
  assert.match(functionBody(serverSource, "maybeCopyRoomConsensus"), /source: "copy_consensus"/);
  assert.match(serverSource, /data === "copy:consensus"/);   // toggle wired
});
test("don't-get-cooked: Jito anti-sandwich path + catastrophic price-impact guard on buys", () => {
  // Jito trade-bundle send path exists (swap+tip bundle, safe RPC re-broadcast fallback, tip only on land)
  assert.match(serverSource, /async function sendPumpTradeTx/);
  assert.match(functionBody(serverSource, "sendPumpTradeTx"), /if \(!CONFIG\.tradeJitoBundle\) return sendVersionedTransaction/);
  assert.match(functionBody(serverSource, "sendPumpTradeTx"), /submitJitoBundle\(bundle/);
  assert.match(functionBody(serverSource, "sendPumpTradeTx"), /re-broadcasting the SAME signed tx via RPC/);
  // price-impact cook-guard: buys only (SOL in), configurable cap, clear message
  assert.match(serverSource, /maxBuyPriceImpact = Math\.min\(0\.95, Math\.max\(0\.05, Number\.parseFloat\(process\.env\.MAX_BUY_PRICE_IMPACT_PCT/);
  const ord = functionBody(serverSource, "createJupiterOrder");
  assert.match(ord, /if \(inputMint === SOL_MINT\)/);
  assert.match(ord, /Math\.abs\(Number\(order\.priceImpactPct\)\)/);
  assert.match(ord, /impact > CONFIG\.maxBuyPriceImpact/);
  assert.match(ord, /Blocked to protect you/);
});
test("vanity pool AUTO-STOCK: gentle bg grinder keeps pump mints stocked, no user-facing alert", () => {
  // config: auto-grind on by default, a target stockpile, tunable worker count
  assert.match(serverSource, /launchVanityAutoGrind: parseBoolean\(process\.env\.LAUNCH_VANITY_AUTOGRIND \|\| "true"\)/);
  assert.match(serverSource, /launchVanityPoolTarget: Math\.max\(1, Math\.min\(500, Number\.parseInt\(process\.env\.LAUNCH_VANITY_POOL_TARGET/);
  // the grinder stores on the MAIN thread via pool.add (no race with a launch pop) + idles at target
  assert.match(serverSource, /async function startVanityAutoGrind/);
  const g = functionBody(serverSource, "startVanityAutoGrind");
  assert.match(g, /new Worker\(workerUrl/);
  assert.match(g, /const size = p\.add\(entry\)/);
  assert.match(g, /size >= CONFIG\.launchVanityPoolTarget\) stopAll\(\)/);
  assert.match(g, /count >= CONFIG\.launchVanityPoolTarget\) \{ if \(_vanityGrindWorkers\.length\) stopAll/);
  assert.match(serverSource, /void startVanityAutoGrind\(\);/);
  // pool.add exists (in-memory + persist, main-thread only)
  assert.match(vanityMintSource, /function add\(entry\)/);
  // the old backend-leaking admin DM is gone (no solana-keygen command shown to users)
  assert.doesNotMatch(serverSource, /async function pollVanityPoolLow/);
  assert.doesNotMatch(serverSource, /solana-keygen grind/);
});

test("every Pump launch requires an exact lowercase pump-ending mint", () => {
  assert.match(serverSource, /launchVanityEnabled: parseBoolean\(process\.env\.LAUNCH_VANITY_ENABLED \|\| "true"\)/);
  assert.match(serverSource, /launchVanitySuffix: \(process\.env\.LAUNCH_VANITY_SUFFIX \|\| "pump"\)/);
  assert.match(serverSource, /LAUNCH_VANITY_POOL_FILE/);
  assert.match(serverSource, /\/var\/data\/vanity-mint-pool\.json/);
  const strictMint = functionBody(serverSource, "generatePumpLaunchMintKeypair");
  assert.match(strictMint, /configuredSuffix !== requiredSuffix/);
  assert.match(strictMint, /!mint\.endsWith\(requiredSuffix\)/);
  assert.match(strictMint, /PUMP_VANITY_POOL_EMPTY/);
  assert.match(strictMint, /No transaction was sent/);
  const bundledLaunch = functionBody(serverSource, "webLaunchPumpJitoBundle");
  assert.match(bundledLaunch, /generatePumpLaunchMintKeypair\(\)/);
  assert.doesNotMatch(bundledLaunch, /const mintKeypair = Keypair\.generate\(\)/);
  const localLaunch = functionBody(serverSource, "webLaunchPumpPortalLocal");
  assert.match(localLaunch, /basePayload\.rail === "pump" \? generatePumpLaunchMintKeypair/);
});
test("🏆⚡ Throne Bundle: atomic Jito waves of 4 by opt-in order, safe RPC fallback", () => {
  assert.match(serverSource, /async function fireCommunitySnipeThroneBundle/);
  assert.match(serverSource, /async function buildSignedPumpBuyTx/);   // build+sign, no send
  const fb = functionBody(serverSource, "fireCommunitySnipeThroneBundle");
  assert.match(fb, /i \+= 4\) chunks\.push\(orderedMembers\.slice\(i, i \+ 4\)\)/);   // waves of 4
  assert.match(fb, /submitJitoBundle\(bundle/);                                       // real atomic Jito bundle
  assert.match(fb, /sendVersionedTransaction\(b\.tx, `throne-bundle fallback/);       // SAME signed tx via RPC = no double-buy, bad wallet can't block the wave
  // AUTO-BUY safety net: a member the bundle couldn't seat gets a FRESH idempotent buy (no manual buy)
  assert.match(fb, /const autoBuyFallback = async/);
  assert.match(fb, /runIdempotentMoneyOp\("community-snipe", userId, `\$\{chatId\}:\$\{mint\}`/); // idempotent → never double-buys
  assert.match(fb, /results\.push\(await autoBuyFallback\(/);
  // co-entry buys now PAY THE FEE: carve it out of the buy + collect it in a separate transfer after
  assert.match(fb, /calculateTradeFeeLamports\(lamports, userId\)/);
  assert.match(fb, /const swapLamports = lamports - feeLamports/);
  assert.match(fb, /collectSolFee\(b\.keypair, b\.feeLamports/);
  // fired only when throneBundle on, members sorted by opt-in time (first-opted-first)
  assert.match(serverSource, /if \(snipe\.throneBundle\) \{/);
  assert.match(serverSource, /sort\(\(a, b\) => \(Number\(a\[1\]\.at\) \|\| 0\) - \(Number\(b\[1\]\.at\) \|\| 0\)\)/);
  // toggle wired (button + handler)
  assert.match(serverSource, /data === "cs:tbundle"/);
  assert.match(serverSource, /callback_data: "cs:tbundle"/);
});
test("launch Jito bundle AUTO-RETRIES with escalating tips before falling back", () => {
  const lb = functionBody(serverSource, "webLaunchPumpJitoBundle");
  // multi-shot escalating tip ladder (not a single shot), env-tunable, capped at Jito's 0.01
  assert.match(lb, /LAUNCH_JITO_TIP_MULTIPLIERS \|\| "3,6,10"/);
  assert.match(lb, /Math\.min\(0\.01, CONFIG\.pumpLaunchJitoTipSol \* multiplier\)/);
  // retry loop rebuilds a FRESH bundle each attempt (all-or-none miss spent nothing) until it lands
  assert.match(lb, /for \(let attempt = 0; attempt < tipSchedule\.length && !landed; attempt \+= 1\)/);
  assert.match(lb, /requestPumpPortalBundleTxs\(/);
  assert.match(lb, /landed = await mintLanded\(attempt === 0 \? 8_000 : 6_000\)/);
  // only after every shot misses does it fall back to the standard launch (never dead-ends)
  assert.match(lb, /if \(!landed\) \{/);
  // Fallback reuses the already-generated mint + metadata, so a late Jito
  // landing cannot create a second token contract.
  assert.match(lb, /webLaunchPumpPortalLocal\(userId, body, basePayload, \{ mintKeypair, metadata \}\)/);
});
test("smooth nav: DM sub-views carry a Main Menu button (no re-/start)", () => {
  for (const fn of ["showTelegramLinksMenu", "showTelegramPortfolioMenu", "showTelegramOgreToolsMenu", "showWalletMenu"]) {
    assert.match(functionBody(serverSource, fn), /callback_data: "main_menu"/, `${fn} needs Main Menu`);
  }
  // the buy prompt + DM signals menu got Main Menu buttons too
  assert.match(serverSource, /🟢 <b>Buy any coin<\/b>[\s\S]{0,400}?callback_data: "main_menu"/);
});

// ---- Shared scammer database: CAS (cas.chat) + SlimeWire cross-group ban list ----
test("known-scammer gate: CAS + cross-group ban list, wired into join + messages + /ban", () => {
  assert.match(serverSource, /async function casBanned\(/);
  assert.match(functionBody(serverSource, "casBanned"), /api\.cas\.chat\/check/);
  assert.match(serverSource, /async function addShieldBan\(/);
  assert.match(serverSource, /async function isSlimeWireBanned\(/);
  assert.match(serverSource, /async function shieldIsKnownScammer\(/);
  assert.match(functionBody(serverSource, "roseDefaults"), /knownScammers: false/);
  const rose = functionBody(serverSource, "handleGroupRose");
  assert.match(rose, /cfg\.knownScammers && await shieldIsKnownScammer/);
  // /ban feeds the shared list so it protects every group.
  assert.match(rose, /void addShieldBan\(tId, chatId\)/);
  // menu toggle wired
  assert.match(serverSource, /GB_TOGGLE_FIELDS = new Set\(\[[^\]]*"knownScammers"/);
});

// ---- OCR image-spam scan (cloud-offloaded so trading is never blocked) ----
test("OCR image scan: cloud-offloaded, concurrency-capped, gated, delete-only", () => {
  assert.match(serverSource, /async function ocrExtractText\(/);
  assert.match(functionBody(serverSource, "ocrExtractText"), /api\.ocr\.space\/parse\/image/); // offloaded, not local
  assert.match(functionBody(serverSource, "ocrExtractText"), /AbortController/);               // timeout
  assert.match(serverSource, /async function shieldOcrScanImage\(/);
  assert.match(serverSource, /SHIELD_OCR = \{ inflight: 0, max: 3 \}/);                        // concurrency cap
  assert.match(functionBody(serverSource, "shieldOcrScanImage"), /SHIELD_OCR\.inflight/);
  assert.match(functionBody(serverSource, "roseDefaults"), /ocrScan: false/);
  const rose = functionBody(serverSource, "handleGroupRose");
  assert.match(rose, /cfg\.ocrScan && Array\.isArray\(message\.photo\)/);
  // never touches trading — pure delete/say
  assert.doesNotMatch(functionBody(serverSource, "shieldOcrScanImage"), /buyToken|sellToken|sendTransaction/);
});

// ---- Scan card buy row: ONE clean Buy button (the 0.5/1/5/custom amount buttons all just opened
// the site, so they were consolidated). The &amount= deep-link helper still exists for the web preload.
test("Sol/RH scan and buy-bot cards share TG Buy, Web Buy, and categorized More", () => {
  const kb = functionBody(serverSource, "slimeScanKeyboard");
  assert.match(kb, /compactTradeCardKeyboard\(mint, "s"\)/);
  const gbi = serverSource.indexOf("const groupBuyMarkup =");
  const gb = serverSource.slice(gbi, gbi + 1300);
  assert.match(gb, /compactTradeCardKeyboard\(mint, "b"\)/);
  assert.doesNotMatch(gb, /Vote", url/);            // 👍 Vote button gone
  assert.doesNotMatch(gb, /TG", url: socials\.tg/); // ✈️ TG button gone
  const compact = functionBody(serverSource, "compactTradeCardKeyboard");
  assert.match(compact, /TG Quick Buy/);
  assert.match(compact, /Web Quick Buy/);
  assert.match(compact, /telegramWebLoginButton/);
  assert.match(compact, /📂 More/);
  const more = functionBody(serverSource, "compactCardMoreKeyboard");
  for (const label of ["Charts & Market", "Research", "Security", "Trade Tools"]) assert.match(more, new RegExp(label));
  const category = functionBody(serverSource, "compactCardCategoryKeyboard");
  assert.match(category, /Set Buy Preset/);
  assert.match(category, /Limit \/ TP-SL/);
  assert.match(category, /robinhoodchain\.blockscout\.com/);
  // no-wallet funnel: tapping ⚡ with no wallet DMs a Create-Wallet button + tells you where to look
  assert.match(serverSource, /async function funnelNoWallet/);
  assert.match(functionBody(serverSource, "funnelNoWallet"), /callback_data: "create_wallets"/);
  assert.match(functionBody(serverSource, "handleQuickBuyCallback"), /noWalletAckText\(await funnelNoWallet\(userId\)\)/);
  assert.match(functionBody(serverSource, "handleQuickBuyPresetCallback"), /noWalletAckText\(await funnelNoWallet\(userId\)\)/);
  assert.match(functionBody(serverSource, "postGroupBuy"), /tap Slime Chart below to open signed in/);
  const rhBuy = functionBody(serverSource, "postGroupBuyRh");
  assert.match(rhBuy, /compactTradeCardKeyboard\(address, "b"\)/);
  assert.match(functionBody(serverSource, "sendRhScanCard"), /compactTradeCardKeyboard\(address, "s"\)/);
  assert.match(rhBuy, /tap Slime Chart below to open signed in/);
});

test("Telegram /buy prioritizes the card coin and posts a compact TG/Web chooser", () => {
  assert.match(serverSource, /async function telegramQuickTradeTarget/);
  const resolver = functionBody(serverSource, "telegramQuickTradeTarget");
  assert.match(resolver, /reply_to_message/);
  assert.match(resolver, /reply_markup\?\.inline_keyboard/);
  assert.match(resolver, /qbp\|rqbp\|dmscan/);
  assert.match(resolver, /buyopen/);
  assert.match(resolver, /\[\?&\]\(\?:ca\|token\)/);
  assert.match(resolver, /buttonHints/);
  assert.match(resolver, /authoritative/);
  assert.match(resolver, /wallet addresses/);
  const panel = functionBody(serverSource, "sendTelegramQuickBuyPanel");
  assert.match(panel, /CA: <code>/);
  assert.match(panel, /TG Buy/);
  assert.match(panel, /Web Buy/);
  assert.match(panel, /callback_data: `buyopen:/);
  assert.match(panel, /links\.quick/);
  assert.doesNotMatch(panel, /sendGroupAlertMedia|gatherRhScan|alphaRadarFetchMc/);
  const open = functionBody(serverSource, "handleTelegramQuickBuyOpenCallback");
  assert.match(open, /editMessageReplyMarkup/);
  assert.match(open, /telegramQuickBuyPanelKeyboard/);
  assert.match(open, /Choose buy amount/);
  assert.match(serverSource, /startsWith\("buyopen:"\)/);
  const keyboard = functionBody(serverSource, "telegramQuickBuyPanelKeyboard");
  assert.match(keyboard, /callback_data: `qb:/);
  assert.match(keyboard, /callback_data: `qbp:/);
  assert.match(keyboard, /callback_data: `rqb:/);
  assert.match(keyboard, /callback_data: `rqbp:/);
  assert.match(keyboard, /Full scan/);
  assert.match(serverSource, /const quickBuyCommand = \/\^\\\/buy/);
  assert.match(serverSource, /sendTelegramQuickBuyPanel\(chatId, userId, message, quickBuyCommand\[1\]/);
  assert.match(functionBody(serverSource, "slimewireTokenLinks"), /\/fun\?quick=1&ca=/);
  assert.match(functionBody(serverSource, "slimewireTokenLinks"), /telegramSiteLogin/);
  assert.match(functionBody(serverSource, "slimewireTokenLinks"), /telegramQuickLogin/);
});

for (const [label, source] of [["gg.html", ggSource], ["index.html", indexSource]]) {
  test(`POS deep-link opens the 1-click buy preloaded with the amount (${label})`, () => {
    assert.match(source, /searchParams\.get\("buy"\)==="1"/);
    assert.match(source, /searchParams\.get\("amount"\)/);
    assert.match(source, /__pendingBuyLink/);
    assert.match(source, /openQuickBuyModal\(pb\.mint,pb\.amount\|\|undefined\)/);
    assert.match(source, /function openQuickBuyModal\(mint,presetAmt\)/); // accepts a preset amount
  });
}

// ---- Cielo-style wallet tracker: smart-money alerts → POS buy card (read-only) ----
test("wallet tracker: cheap-poll + Helius-parse-on-activity, alert funnels to POS buy, menus wired", () => {
  assert.match(serverSource, /async function pollTrackedWallets\(/);
  const poll = functionBody(serverSource, "pollTrackedWallets");
  assert.match(poll, /getSignaturesForAddress/);              // cheap activity detection
  assert.match(poll, /api\.helius\.xyz\/v0\/transactions/);   // parse only fresh sigs
  assert.match(poll, /firstPoll \|\| !fresh\.length/);         // baseline + only-on-activity
  assert.match(functionBody(serverSource, "sendWalletAlert"), /slimeScanKeyboard\(ev\.mint\)/); // POS buy funnel
  assert.doesNotMatch(functionBody(serverSource, "sendWalletAlert"), /buyToken|sellToken|sendTransaction/); // read-only
  // per-user store + cap + menus + commands + typed input all present
  assert.match(serverSource, /const WT_FREE_CAP = 15/);
  assert.match(serverSource, /async function handleWalletTrackerCallback\(/);
  assert.match(serverSource, /async function handleWalletTrackerCommand\(/);
  assert.match(serverSource, /async function applyWtInput\(/);
  assert.match(serverSource, /startsWith\("wt:"\)/);          // routed in the dispatcher
  assert.match(serverSource, /callback_data: "wt:home"/);     // menu button under Scans & Signals
  assert.match(serverSource, /void pollTrackedWallets\(\)/);  // interval started
});

// ---- Cornix-style advanced exits: trailing stop + break-even-after-TP1 (engine already runs them) ----
test("web quick-buy plumbs trailing stop + break-even into the plan (arms only in profit)", () => {
  const fn = functionBody(serverSource, "webCreateSingleTradeAutoExitPlan");
  // parsed from the buy body, clamped, opt-in
  assert.match(fn, /trailingStopPct = Math\.max\(0, Math\.min\(95, Number\(body\.trailingStopPct\) \|\| 0\)\)/);
  // activation defaults to >= trail distance so a trailing stop can NEVER fire at a loss
  assert.match(fn, /trailingActivatePct = trailingStopPct > 0 \? Math\.max\(Number\(body\.trailingActivatePct\) \|\| 0, trailingStopPct\) : 0/);
  assert.match(fn, /breakEvenAfterTp1 = cleanLaunchBoolean\(body\.breakEvenAfterTp1\)/);
  // trailing alone is enough to arm a plan (not gated behind TP/SL)
  assert.match(fn, /!\(trailingStopPct > 0\)/);
  // all four land on the plan object the engine reads
  assert.match(fn, /trailingStopPct,\s*\n\s*trailingActivatePct,\s*\n\s*breakEvenAfterTp1,\s*\n\s*breakEvenStopPct,/);
});
for (const [label, source] of [["gg.html", ggSource], ["index.html", indexSource]]) {
  test(`quick-buy modal exposes advanced exit strategy + sends it (${label})`, () => {
    assert.match(source, /qbTrail/);       // trailing stop % input
    assert.match(source, /qbTrailAct/);    // activation % input
    assert.match(source, /qbBe/);          // break-even-after-TP1 toggle
    // execQuickBuy forwards them to the buy body
    assert.match(source, /body\.trailingStopPct=String\(trail\)/);
    assert.match(source, /body\.trailingActivatePct=String\(trailAct\)/);
    assert.match(source, /body\.breakEvenAfterTp1=true/);
    // trailing alone still arms auto-exit (not dropped to HOLD)
    assert.match(source, /tp\|\|sl\|\|Number\(trail\)>0/);
  });
}

// ---- /leaderboard: channel-only caller board + group stats + top calls ----
test("/leaderboard ranks callers by window; /wins keeps the coin hall of fame", () => {
  // command split: leaderboard/callers -> caller board; halloffame/hof/wins -> coin wins
  assert.match(serverSource, /parseCommandWithArgument\(text, \["leaderboard", "lb", "callers", "topcallers"\]\)/);
  assert.match(serverSource, /handleTelegramCallerLeaderboardCommand\(chatId\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["halloffame", "hof", "wins"\]\)/);
  // four windows, driven off the caller-intel warehouse filtered by firstAt
  const view = functionBody(serverSource, "buildCallerLeaderboardView");
  assert.match(view, /callerIntel\.buildLeaderboards\(scoped, \{ minResolved/);
  assert.match(view, /String\(c\.chatId\) === String\(chatId\)/);
  assert.match(view, /Number\(c\.firstAt\) >= cutoff/);
  assert.match(serverSource, /function bestCallerLeaderboardCall/);
  assert.match(view, /topByCaller/);
  assert.match(view, /hydrateCallerLeaderboardSymbols/);
  assert.match(view, /Group Stats/);
  assert.match(view, /Top Calls/);
  assert.match(view, /callerLeaderboardPoints/);
  assert.match(view, /Stats are isolated to this group/);
  const pointsFn = new Function("caller", functionBody(serverSource, "callerLeaderboardPoints"));
  assert.ok(pointsFn({ score: 0.8, resolved: 20 }) > pointsFn({ score: 0.4, resolved: 2 }), "proven high-quality callers must earn more points");
  assert.ok(pointsFn({ score: 2, resolved: 100 }) <= 10, "display points stay capped at 10");
  for (const k of ["today", "1w", "14d", "1m", "6m"]) assert.ok(serverSource.includes(`key: "${k}"`), `window ${k}`);
  // window buttons routed in the callback dispatcher, editing in place
  assert.match(serverSource, /query\.data\?\.startsWith\("clb:"\)/);
  assert.match(serverSource, /buildCallerLeaderboardView\(win, chatId\)/);
  assert.match(serverSource, /buildCallerLeaderboardView\("14d", chatId\)/);
  assert.doesNotMatch(serverSource, /buildCallerLeaderboardView\((?:win|"14d")\)(?!,)/);
  assert.match(serverSource, /callback_data: `clb:\$\{w\.key\}`/);
});

// ---- Scan bot: PnL/flex brags → rotating SlimeWire image PnL card ----
test("flex brag that names a coin answers with the rotating slime PnL card (Scan-gated, throttled)", () => {
  // detector is tight: needs a gain-brag AND a coin ref
  const det = functionBody(serverSource, "detectFlexBragMint");
  assert.match(det, /pnl\|profit/);
  assert.match(det, /isLikelySolMint\(clean\)/);       // CA wins
  assert.match(det, /return \{ ticker: tag\[1\] \}/);   // else first $ticker
  // renders the real rotating card (renderSlimeCard = 15 per-mint backgrounds) in receipt mode
  const card = functionBody(serverSource, "sendCallFlexImageCard");
  assert.match(card, /renderSlimeCard\(\{/);
  assert.match(card, /receipt: true/);
  assert.match(card, /sendPhoto\(chatId,/);
  assert.match(card, /postCallFlexCard\(chatId, mint, message\)/); // honest text fallback
  // wired into the group handler, rides the Scan toggle, rate-limited
  assert.match(serverSource, /const flex = detectFlexBragMint\(text\)/);
  assert.match(serverSource, /groupBotFeatureOn\(gbEntry, "scan"\)\) && !tgCommandOnCooldown\(chatId, "flexcard"/);
  assert.match(serverSource, /sendCallFlexImageCard\(chatId, flexMint, message\)/);
});

// ---- Competitor "takes": AI Read (Block AI) + Track the Funds (TrackTheFunds) + karma/stats (Combot) ----
test("scan menu exposes 🧠 AI Read + 💸 Track Funds, routed on-demand (zero idle cost)", () => {
  const menu = functionBody(serverSource, "scanMenuKeyboard");
  assert.match(menu, /callback_data: `scan:ai:\$\{mint\}`/);
  assert.match(menu, /callback_data: `scan:funds:\$\{mint\}`/);
  // dispatched only when the button is tapped, editing THIS message (no chat spam)
  assert.match(serverSource, /action === "ai"\) \{\s*\n\s*await handleScanAiRead\(chatId, mint, messageId, isPhoto\)/);
  assert.match(serverSource, /action === "funds"\) \{\s*\n\s*await handleScanTrackFunds\(chatId, mint, messageId, isPhoto\)/);
});
test("AI Read + Track Funds edit the scan card IN PLACE (one thread) with Back-to-card nav", () => {
  // shared in-place editor swaps caption (photo) or text — never posts a new message when messageId is present
  const edit = functionBody(serverSource, "editScanView");
  assert.match(edit, /editMessageCaption/);
  assert.match(edit, /editMessageText/);
  for (const fn of ["handleScanAiRead", "handleScanTrackFunds"]) {
    const body = functionBody(serverSource, fn);
    assert.match(body, /if \(messageId\) await editScanView\(chatId, messageId, isPhoto/, `${fn} edits in place`);
    assert.match(body, /callback_data: `scan:card:\$\{mint\}`/, `${fn} has Back to card`);
  }
  // Back button rebuilds the card in the same message, cooldown-free
  assert.match(serverSource, /action === "card"\)/);
  assert.match(serverSource, /async function rebuildScanCardInPlace\(/);
});
test("AI Read is honest rules-synthesis over signals we already compute (no fake LLM)", () => {
  const ai = functionBody(serverSource, "handleScanAiRead");
  assert.match(ai, /await gatherSlimeScan\(mint\)/);         // reuses the one scan fetch
  assert.match(ai, /shield\?\.score/);
  assert.match(ai, /rug\?\.top10Pct/);
  assert.match(ai, /conviction/);                            // 0-100 grade
  assert.match(ai, /Not financial advice/);                 // honest framing
  assert.doesNotMatch(ai, /buyToken|sellToken|sendTransaction/); // read-only
});
test("Track the Funds is a read-only follow-the-money report reusing scan data", () => {
  const tf = functionBody(serverSource, "handleScanTrackFunds");
  assert.match(tf, /await gatherSlimeScan\(mint\)/);
  assert.match(tf, /top10Pct|topHolders/);
  assert.match(tf, /mintAuthority/);
  assert.match(tf, /devSold/);
  assert.doesNotMatch(tf, /buyToken|sellToken|sendTransaction/);
});
test("group karma stays off the hot path (cheap regex gate) + /stats reuses caller-intel", () => {
  const k = functionBody(serverSource, "maybeAwardKarma");
  assert.match(k, /KARMA_THANKS_RE\.test\(text\)/);          // keyword gate BEFORE touching the store
  assert.match(k, /target\.is_bot \|\| target\.id === giver\.id/); // no self/bot farming
  assert.match(k, /store\.grants\[gk\] === day/);            // per-day anti-farm
  assert.match(serverSource, /void maybeAwardKarma\(message\)\.catch/); // fire-and-forget in the group path
  const stats = functionBody(serverSource, "handleGroupStatsCommand");
  assert.match(stats, /callerIntel\.buildLeaderboards\(calls/); // no new per-message counter
  assert.match(serverSource, /parseCommandWithArgument\(text, \["stats", "groupstats", "activity"\]\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["rep", "karma"\]\)/);
});

// ---- X-post preview resilience: independent mirror fallback (fxtwitter IP-block → still shows media) ----
test("postXPost pulls tweet media from multiple mirrors before the bare-link fallback", () => {
  const parseTweet = functionBody(serverSource, "parseTweetUrl");
  assert.match(parseTweet, /const route = String\(m\[1\]/);
  assert.match(parseTweet, /id: m\[2\]/);                 // route capture must not displace the tweet id
  const fetchTweet = functionBody(serverSource, "fetchTweetData");
  assert.match(fetchTweet, /api\.fxtwitter\.com/);
  assert.match(fetchTweet, /api\.fixupx\.com/);
  assert.match(fetchTweet, /api\.vxtwitter\.com/);       // INDEPENDENT infra fallback
  assert.match(fetchTweet, /media_extended/);             // vxtwitter shape adapter
  const post = functionBody(serverSource, "postXPost");
  assert.match(post, /await fetchTweetData\(t\)/);
  assert.match(post, /sendTelegramVideo/);
  assert.match(post, /sendPhoto/);
});
// The new flex detector must NOT swallow a plain pasted tweet link (that belongs to the X-post preview).
test("flex detector ignores a bare tweet link so the X-post preview still fires", () => {
  const det = functionBody(serverSource, "detectFlexBragMint");
  // it requires a gain-brag keyword; a plain URL has none, so detectFlexBragMint returns null and the
  // message falls through to the tweet handler. Lock that the gate needs a real brag signal.
  assert.match(det, /if \(!gain\) return null/);
});

// ---- Scan card Security block never blank: free on-chain fill when RugCheck is down/unindexed ----
test("scan Security fills from our own RPC when RugCheck returns null (no more n/a wall)", () => {
  const scan = functionBody(serverSource, "gatherSlimeScan");
  assert.match(scan, /scanFastTimeout\(getGeckoTerminalTokenMetadata\(mint, \{ timeoutMs: 3_000 \}\)/); // market fallback for n/a LP/MC/1H stays, but it cannot stall TG/X replies
  assert.match(scan, /scanCachedMarketMeta\(mint\)/); // local/sticky cache fills MC/LIQ/VOL/1H when public APIs blank
  assert.match(scan, /mergeTokenMarketMetadata/);
  assert.match(scan, /const chartRescue = await scanFastTimeout\(buildChartData\(mint, "5m"\), 7_000, null\)/);
  assert.match(scan, /source: "chart-rescue"/);
  const enrich = functionBody(serverSource, "enrichScanSecurityOnchain");
  assert.match(enrich, /getParsedAccountInfo/);                 // mint/freeze authority = ground truth
  assert.match(enrich, /computeOnchainDistribution\(/);          // concentration + holders + dev
  assert.match(enrich, /out\[k\] == null/);                      // only fills gaps, never overwrites RugCheck
  assert.match(enrich, /authoritiesKnown = true/);
  // wired into the one scan fetch everything reuses (card, AI Read, Track Funds, refresh, flex)
  assert.match(serverSource, /enrichScanSecurityOnchain\(mint, rug, bonding\)/);
  // card shows n/a (not a false "revoked") when authority state was never actually read
  const card = functionBody(serverSource, "formatSlimeScanCard");
  assert.match(card, /scanMarketStatsFromSources\(\{ meta, bonding, best, rug, supply, mint \}\)/);
  assert.match(card, /const \{ volume24h, ch24, ch1, buys1, sells1 \} = stats/);
  assert.match(card, /const authKnown = Boolean\(rug && rug\.authoritiesKnown\)/);
  assert.match(card, /authKnown \? \(rug\.mintAuthority \? "🔴 active" : "🟢 none"\)/);
  // RugCheck marks its authority read as definitive so its null == revoked
  assert.match(functionBody(serverSource, "fetchRugcheckFull"), /authoritiesKnown: true/);
});

test("Robinhood address routing proves wallet versus ERC-20 before scan and tracking", () => {
  assert.match(serverSource, /import \{ resolveRhPoolToken, rhResolvedPoolHints \} from "\.\/lib\/rhPoolResolver\.js"/);
  assert.match(functionBody(serverSource, "resolveScanTargetFromText"), /resolveRhPoolToken\(evm\[0\]\)/);
  assert.match(functionBody(serverSource, "resolveExplicitScanTargetsFromText"), /resolveRhPoolToken\(m\)/);
  assert.match(functionBody(serverSource, "resolveAllScanTargetsFromText"), /resolveRhPoolToken\(m\)/);
  assert.match(functionBody(serverSource, "gatherRhScan"), /resolveRhPoolToken\(address\)/);
  assert.match(functionBody(serverSource, "sendRhScanCard"), /address = await resolveRhPoolToken\(address\)/);
  assert.match(functionBody(serverSource, "mergedDexMetadataForToken"), /filter\(\(pair\) => pairMatchesToken\(pair, tokenMint\)\)/);
  assert.match(functionBody(serverSource, "mergedDexMetadataForToken"), /dexPairCompleteness/);
  assert.match(functionBody(serverSource, "gatherSlimeScan"), /mergedDexMetadataForToken\(mint, pairs, best\)/);
  const look = functionBody(serverSource, "handleTelegramLookCommand");
  assert.match(look, /await rhTokenContractProof\(rhAddr\)/);
  assert.match(look, /else await sendWalletScanCard\(chatId, rhAddr, message\?\.from\?\.id \|\| null\)/);
  const xReply = functionBody(serverSource, "buildXReply");
  assert.match(xReply, /const token = await rhTokenContractProof/);
  assert.match(xReply, /if \(!token\.contract\) return await buildXMapReply/);
  const rhScan = functionBody(serverSource, "gatherRhScanUncollapsed");
  assert.match(rhScan, /const poolHints = rhResolvedPoolHints\(a\)/);
  assert.match(rhScan, /hintedPairsPromise/);
  assert.match(rhScan, /mergedDexMetadataForToken\(a, pairs, pair\)/);
  assert.match(rhScan, /aggregateDexPairActivity\(a, pairs\)/);
  assert.match(rhScan, /const contractProof = await rhTokenContractProof\(a\)/);
  assert.match(rhScan, /if \(!contractProof\.contract\) return null/);
  const proof = functionBody(serverSource, "rhTokenContractProof");
  assert.match(proof, /await Promise\.all/);
  assert.match(proof, /rhPromiseTimeout\(isRhContract\(a\)/); // RPC and chain-index proof run together, so their timeouts never stack
  assert.match(proof, /rhTokenInfo\(a\)/); // Blockscout exact token record rescues transient RPC bytecode misses
  assert.match(proof, /api\/v2\/tokens\?q=\$\{encodeURIComponent\(a\)\}&type=ERC-20/); // Render can reach the address-search index when the exact-record route stalls
  assert.match(proof, /rowAddress\.toLowerCase\(\) === key/); // never accept a fuzzy address result as token proof
  assert.match(proof, /api\.dexscreener\.com\/tokens\/v1\/robinhood/); // exact market identity remains a third independent proof if both chain gateways blink
  assert.match(proof, /baseToken\?\.address, pair\?\.quoteToken\?\.address/);
  assert.match(proof, /noxaScanFast\(a/); // chain-native launch record is authoritative when Render cannot reach public indexes
  assert.match(proof, /noxa\?\.token/);
  assert.match(proof, /rpcContract \|\| blockscoutContract \|\| marketContract \|\| noxaContract/);
  assert.match(proof, /normalizeRhBlockscoutToken/);
  assert.match(serverSource, /addressKind: "wallet", chain: "robinhood", matches: \[\]/);
  assert.match(serverSource, /That 0x address is a Robinhood wallet, not an ERC-20 coin contract/);
});

test("provider JSON and fast holder reads stay memory bounded", () => {
  const fetcher = functionBody(serverSource, "fetchJson");
  assert.match(fetcher, /configuredMaxBytes/);
  assert.match(fetcher, /response\.body\?\.getReader/);
  assert.match(fetcher, /Provider response exceeded/);
  const enrich = functionBody(serverSource, "enrichScanSecurityOnchain");
  assert.match(enrich, /computeOnchainDistribution\(\{ mint, creatorWallet: creator, rpcRead, withHolderCount: false \}\)/);
});

// ---- Alpha Radar: "is a big network behind this coin?" (long-term-runner oriented, read-only) ----
test("computeNetworkBacking reuses the observatory's winner/operator/cluster signals", () => {
  const fn = functionBody(serverSource, "computeNetworkBacking");
  assert.match(fn, /smartMoneyScore\(mint\)/);          // proven-winner wallets + KOL
  assert.match(fn, /autopilotClusterRisk\(mint\)/);      // coordinated co-funding
  assert.match(fn, /insiderLaunches\.get\(mint\)/);       // known operator
  assert.match(fn, /backed = winners >= 2 \|\| kol \|\| operator/);
  assert.match(fn, /score/);
});
test("Alpha Radar scan tool: network read + runner shape, edits in place, honest when untracked", () => {
  const fn = functionBody(serverSource, "handleScanAlphaRadar");
  assert.match(fn, /computeNetworkBacking\(mint\)/);
  assert.match(fn, /runner/i);                            // long-term-runner shape, not fast pop
  assert.match(fn, /Not tracked yet/);                    // honest when observatory hasn't seen it
  assert.match(fn, /if \(messageId\) await editScanView\(chatId, messageId, isPhoto/); // in-place, no spam
  assert.doesNotMatch(fn, /buyToken|sellToken|sendTransaction/); // read-only
  // wired into the scan menu + dispatcher
  assert.match(serverSource, /callback_data: `scan:alpha:\$\{mint\}`/);
  assert.match(serverSource, /action === "alpha"\) \{\s*\n\s*await handleScanAlphaRadar/);
});

// ---- Proactive Alpha Radar: long-horizon alerts on network-backed runners (opt-in, read-only) ----
test("Alpha Radar poller watches network-backed coins, alerts only on a held multi-hour climb", () => {
  const poll = functionBody(serverSource, "pollAlphaRadar");
  assert.match(poll, /if \(!targets\.any\) \{ alphaRadarWatch\.clear\(\); return; \}/); // no listeners → don't burn APIs
  assert.match(poll, /computeNetworkBacking\(mint\)/);
  assert.match(poll, /net\.backed && net\.score >= 45/);            // only watch actual network-backed coins
  assert.match(poll, /ageMin >= 45 && nearPeak && net\.backed/);     // long-horizon + holding + still backed
  assert.match(poll, /w\.stages\.has\(stage\)/);                     // staged de-dupe (+40% / 2x / 5x)
  const bc = functionBody(serverSource, "alphaRadarBroadcast");
  assert.match(bc, /targets\.groups/);
  assert.match(bc, /targets\.dms/);
  assert.doesNotMatch(bc, /buyToken|sellToken|sendTransaction/);     // ALERT only, never trades
  assert.match(serverSource, /setInterval\(\(\) => \{ void pollAlphaRadar\(\); \}, 60_000\)/);
});
test("/alpharadar toggles per-group (admin) + DM opt-in", () => {
  const cmd = functionBody(serverSource, "handleAlphaRadarCommand");
  assert.match(cmd, /setAlphaRadarDmSub\(userId, on\)/);            // DM subscription
  assert.match(cmd, /roseAdminIdentity\(chatId\)/);                  // group admin gate
  assert.match(cmd, /setGroupBotFeature\(chatId, "alphaRadar", on\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["alpharadar", "alpha_radar", "alphascan"\]\)/);
  // Legacy Alpha Radar remains DM-only; opted-in groups are migrated to Smart Calls.
  assert.doesNotMatch(functionBody(serverSource, "alphaRadarTargets"), /groupBotFeatureOn/);
  assert.match(functionBody(serverSource, "smartCallTargets"), /groupBotFeatureOn\(entry, "alphaRadar"\)/);
});

// ---- Scan Back reliability + Alpha Radar replaces the short-term plays for opted-in groups ----
test("Back to card restores stashed text instantly (no slow re-fetch that felt broken)", () => {
  const cb = functionBody(serverSource, "handleScanCallback");
  assert.match(cb, /scanCardStash\.set\(String\(messageId\)/);        // stash the card on the way into a sub-view
  assert.match(cb, /const stash = scanCardStash\.get\(String\(messageId\)\)/); // restore on Back
  assert.match(cb, /stash && stash\.text && Date\.now\(\) - stash\.at < 10 \* 60 \* 1000/);
  // rebuild only when there's no fresh stash
  assert.match(cb, /else \{\s*\n\s*await rebuildScanCardInPlace/);
});
test("groups on Alpha Radar get network-backed runners INSTEAD of the short-term SlimeWire plays", () => {
  assert.match(serverSource, /if \(groupBotFeatureOn\(e, "alphaRadar"\)\) alphaRadarGroups\.add\(String\(cid\)\)/);
  assert.match(serverSource, /if \(alphaRadarGroups\.has\(String\(chatId\)\)\) continue;/); // skip the alpha-drop for them
});

// ---- Community Snipe: non-custodial group launch snipe (own wallets, no pool, no obfuscation) ----
test("community snipe fires each member's OWN wallet — never a shared pool", () => {
  const fire = functionBody(serverSource, "fireCommunitySnipe");
  assert.match(fire, /walletsForOwner\(walletStore, userId\)/);   // each member's own wallet
  assert.match(fire, /buyTokenForPlan\(wallet, token, amountLamports/);
  assert.match(fire, /runIdempotentMoneyOp\("community-snipe"/);   // idempotent per member+mint (no double-buy)
  assert.doesNotMatch(fire, /pool|sharedWallet|combined/i);        // NO pooling
  // fire-once: mark fired + disarm BEFORE executing
  assert.match(fire, /snipe\.fired = \{ mint: token, chain, at: Date\.now\(\) \}; snipe\.armed = false;/);
});
test("community snipe is keyed on the creator wallet (unspoofable), armed index drops on fire", () => {
  const m = functionBody(serverSource, "maybeCommunitySnipe");
  assert.match(m, /entry\.event\.traderPublicKey/);                // the dev's launch wallet — follows the wallet
  assert.match(m, /communitySnipeTargetKey\("solana", creator\)/);
  assert.match(m, /communitySnipeArmed\.get\(key\)/);
  assert.match(m, /communitySnipeArmed\.delete\(key\)/); // fire once
  assert.match(serverSource, /try \{ maybeCommunitySnipe\(entry\); \} catch \{\}/); // wired into onCreation
});
test("Robinhood Community Snipe mirrors Solana with SOL-funded own-wallet entries", () => {
  const parse = functionBody(serverSource, "parseCommunitySnipeAddress");
  assert.match(parse, /\^0x\/i/);
  assert.match(parse, /normalizeWalletLaunchAddress\(raw, chain\)/);
  const detect = functionBody(serverSource, "maybeRhCommunitySnipe");
  assert.match(detect, /communitySnipeTargetKey\("robinhood", deployer\)/);
  assert.match(detect, /matchBlock > armedBlock/);                  // never fires an old feed row
  assert.match(detect, /options\.source === "slimewire-launch"/); // exact launch receipt is immediate
  const rhFire = functionBody(serverSource, "fireRhCommunitySnipe");
  assert.match(rhFire, /walletsForOwner\(walletStore, userId\)/);  // each member's own managed wallet
  assert.match(rhFire, /runIdempotentMoneyOp\("community-snipe-rh"/);
  assert.match(rhFire, /webRhTradeCore\(userId/);
  assert.match(rhFire, /payCurrency: "SOL"/);                      // bridge/conversion stays automatic
  assert.match(rhFire, /source: "community-snipe"/);
  assert.match(rhFire, /webRhArmGuard\(userId/);                   // durable RH TP/SL
  assert.match(serverSource, /maybeRhCommunitySnipe\(\{[\s\S]*?source: "slimewire-launch"/);
  assert.match(serverSource, /scheduleRhCommunitySnipePoll\(8_000\)/); // external NOXA deployer watch
  assert.match(serverSource, /void readCommunitySnipe\(\)/);      // armed rooms restore after restart
  assert.match(serverSource, /COMMUNITY_SNIPE_RH_MAX_SOL = 5/);
});
test("community snipe: admin-gated setup, everyone auto-buys, presets optional", () => {
  const cmd = functionBody(serverSource, "handleCommunitySnipeCommand");
  assert.match(cmd, /isTgChatAdmin\(chatId, userId\)/);            // admin-gated arm/wallet
  assert.match(cmd, /amountSol: amt/);                             // each member sets their own SOL amount
  assert.match(cmd, /tpPct: tp, slPct: sl/);                       // TP/SL are the only optional part
  assert.match(serverSource, /parseCommandWithArgument\(text, \["snipe", "communitysnipe", "csnipe"\]\)/);
  // everyone who opts in auto-buys — no alert-only carve-out in the fire path
  assert.doesNotMatch(functionBody(serverSource, "fireCommunitySnipe"), /mode === "alert"/);
});

// ---- Community Snipe menus: button-driven join + dev setup (typed-input capture) ----
test("community snipe is button-driven: tap-to-join amounts, dev setup, preset picker", () => {
  const menu = functionBody(serverSource, "communitySnipeCardMarkup");
  assert.match(menu, /callback_data: "cs:amt:0\.1"/);            // one-tap join amounts
  assert.match(menu, /callback_data: "cs:custom"/);              // custom amount → typed input
  assert.match(menu, /callback_data: "cs:presets"/);             // TP/SL picker
  assert.match(menu, /callback_data: "cs:admin"/);              // dev setup
  const admin = functionBody(serverSource, "communitySnipeAdminMarkup");
  assert.match(admin, /callback_data: "cs:setwallet"/);
  assert.match(admin, /cs:arm|cs:disarm/);
  // callback routed + admin actions gated
  assert.match(serverSource, /startsWith\("cs:"\)/);
  const cb = functionBody(serverSource, "handleCommunitySnipeCallback");
  assert.match(cb, /"cs:admin", "cs:setwallet", "cs:arm", "cs:disarm", "cs:who", "cs:reset"/);
  assert.match(cb, /isTgChatAdmin\(chatId, userId\)/);
  // typed-input capture wired (custom amount / presets / wallet), keyed chatId:userId
  assert.match(serverSource, /await applyCsInput\(message, userId\)/);
  const inp = functionBody(serverSource, "applyCsInput");
  assert.match(inp, /pend\.kind === "custom"/);
  assert.match(inp, /pend\.kind === "presets"/);
  assert.match(inp, /pend\.kind === "wallet"/);
});

// ---- The Room: opt-in verifiable PnL board + skin-in-the-game callers (our unfair in-chat edge) ----
test("Room PnL board is opt-in and shows REAL realized SOL from members' own trades", () => {
  const pnl = functionBody(serverSource, "roomPnlView");
  assert.match(pnl, /roomRealizedByUser/);
  assert.match(functionBody(serverSource, "roomRealizedByUser"), /readTradeHistory/);       // real trade history
  assert.match(functionBody(serverSource, "roomRealizedByUser"), /received.*spent|spent.*received/); // received − spent
  // opt-in only — single toggle button (join/leave in one), always gives visible feedback
  assert.match(serverSource, /callback_data: "room:toggle"/);
  assert.match(serverSource, /data === "room:toggle"/);
  assert.match(serverSource, /await setRoomOptIn\(chatId, userId, query\.from/);
  // every Room view can bounce back to the Trench menu (no dead-end)
  assert.match(functionBody(serverSource, "roomMenuMarkup"), /callback_data: "gb:m:trench"/);
});
test("skin-in-the-game callers: a call only verifies if the (opted-in) caller actually holds it", () => {
  const v = functionBody(serverSource, "roomMaybeVerifyCall");
  assert.match(v, /roomOptedIn\(store, chatId, rec\.callerId\)/);          // opt-in gate
  assert.match(v, /walletTokenUiBalance\(w\.publicKey, mint\)/);            // on-chain holdings check
  assert.match(v, /rec\.verified = true/);
  assert.match(serverSource, /roomMaybeVerifyCall\(rec, chatId, mint\)/);   // hooked into recordTelegramCall
  // the callers board shows ONLY verified calls
  assert.match(functionBody(serverSource, "roomCallersView"), /c\.chatId\) === String\(chatId\) && c\.verified/);
  // command + callback wired
  assert.match(serverSource, /parseCommandWithArgument\(text, \["room", "board", "roompnl"\]\)/);
  assert.match(serverSource, /startsWith\("room:"\)/);
});

// ---- Signals hub + Exit Radar: sell signals nobody gives, one clean opt-in menu ----
test("/signals is one opt-in menu (personal radars + group Smart Calls)", () => {
  const menu = functionBody(serverSource, "signalsMenu");
  assert.match(menu, /callback_data: "sig:exit"/);
  assert.match(menu, /callback_data: "sig:alpha"/);
  assert.match(menu, /callback_data: "sig:galpha"/);        // group alpha toggle (admin)
  assert.match(menu, /callback_data: "sig:roster"/);        // visible active top-30 roster
  assert.match(menu, /Smart Calls/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["signals", "alerts", "radar"\]\)/);
  assert.match(serverSource, /startsWith\("sig:"\)/);
  // group toggle is admin-gated
  assert.match(functionBody(serverSource, "handleSignalsCallback"), /isTgChatAdmin\(chatId, userId\)/);
});
test("Smart Calls keeps today's top 30 plus retained proven winners and only retires weak callers after a real sample", () => {
  assert.match(serverSource, /const SMART_CALL_ROSTER_SIZE = 30/);
  assert.match(serverSource, /const SMART_CALL_PROVEN_SIZE = 45/);
  assert.match(serverSource, /const SMART_CALL_MIN_SAMPLE = 8/);
  assert.match(functionBody(serverSource, "smartCallsPath"), /smart-calls\.json/);
  const roster = functionBody(serverSource, "refreshSmartCallRoster");
  assert.match(roster, /refreshKolscanTop/);                 // live leaderboard refresh
  assert.match(roster, /autoKolWallets/);                   // proven provider winners
  assert.match(roster, /trackedKolWallets/);                // growing KOL database
  assert.match(roster, /walletObs/);                        // SlimeWire's learned winners
  assert.match(roster, /isWinnerWallet/);                   // Solana Tracker seeded + organically proven winners
  assert.match(roster, /stats\.settled >= SMART_CALL_MIN_SAMPLE/);
  assert.match(roster, /liveTopWallets/);                    // today's ranked 30 always stay in the watch set
  assert.match(roster, /row\.proven && !row\.failing/);     // winners beyond rank 30 remain while their proof holds
  assert.match(roster, /SMART_CALL_PROVEN_SIZE/);
  assert.match(functionBody(serverSource, "smartCallRosterView"), /retained proven wallet/);
});
test("Kolscan's structured payload keeps each wallet paired with its own X handle", () => {
  const start = serverSource.indexOf("function parseKolscanTopHtml(");
  const end = serverSource.indexOf("async function fetchKolscanTop(", start);
  assert.ok(start >= 0 && end > start);
  const declaration = serverSource.slice(start, end);
  const parse = new Function("solanaPublicKeyLike", `${declaration}; return parseKolscanTopHtml;`)(
    (wallet) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(wallet || ""))
  );
  const walletA = "BtMBMPkoNbnLF9Xn552guQq528KKXcsNBNNBre3oaQtr";
  const walletB = "8nqtxpFpuXwfXG4pBLsDkkuMMPK9FjSkBMCn542HiM3v";
  const weekly = "6HJetMbdHBuk3mLUainxAPpBpWzDgYbHGTS2TqDAUSX2";
  const html = `x{\"wallet_address\":\"${walletA}\",\"name\":\"No social\",\"twitter\":null,\"timeframe\":1}x{\"wallet_address\":\"${walletB}\",\"name\":\"Theo\",\"twitter\":\"https://x.com/theonomix\",\"timeframe\":1}x{\"wallet_address\":\"${weekly}\",\"twitter\":\"https://x.com/wrongframe\",\"timeframe\":7}`;
  assert.deepEqual(parse(html, 30), { wallets: [walletA, walletB], handles: ["", "theonomix"] });
  const refresh = functionBody(serverSource, "refreshKolscanTop");
  assert.match(refresh, /handles\.length === wallets\.length/); // update both arrays atomically or retain last-good
});
test("Smart Call RPC proof rejects transfers and accepts only a swap with real spend", () => {
  const start = serverSource.indexOf("function smartCallRpcBuyFromTransaction(");
  const end = serverSource.indexOf("async function smartCallParsedWalletBuys(", start);
  assert.ok(start >= 0 && end > start);
  const declaration = serverSource.slice(start, end);
  const wallet = "BtMBMPkoNbnLF9Xn552guQq528KKXcsNBNNBre3oaQtr";
  const mint = "6HJetMbdHBuk3mLUainxAPpBpWzDgYbHGTS2TqDAUSX2";
  const mapBalances = (rows, owner) => new Map(rows.filter((row) => row.owner === owner).map((row) => [row.mint, row.amount]));
  const classify = new Function("detectSwapActivity", "tokenBalanceMapForWallet", "TOP_WALLET_STABLES", "XBOT_TRADE_SKIP_MINTS", "parsedWalletLamportDelta", `${declaration}; return smartCallRpcBuyFromTransaction;`)(
    (tx) => ({ detected: tx.swap === true }), mapBalances, new Set(["SOL"]), new Set(), (tx) => tx.lamportDelta || 0
  );
  const transfer = { swap: false, lamportDelta: 0, meta: { err: null, preTokenBalances: [], postTokenBalances: [{ owner: wallet, mint, amount: 100 }] } };
  assert.equal(classify(transfer, wallet), null, "an incoming transfer/airdrop must never become a first-buy call");
  const buy = { ...transfer, swap: true, lamportDelta: -100_000_000 };
  assert.deepEqual(classify(buy, wallet), { side: "buy", mint, solAmount: 0.1 });
});
test("Smart Call signature cursor baselines once and paginates until the prior seen boundary", async () => {
  const start = serverSource.indexOf("async function smartCallWalletSignatureDelta(");
  const end = serverSource.indexOf("function smartCallHeliusBuyForWallet(", start);
  assert.ok(start >= 0 && end > start);
  const declaration = serverSource.slice(start, end);
  const wallet = "BtMBMPkoNbnLF9Xn552guQq528KKXcsNBNNBre3oaQtr";
  const PublicKey = class { constructor(value) { this.value = value; } };
  const makeCollector = (pages, calls) => new Function("rpcRead", "PublicKey", "SMART_CALL_SIGNATURE_MAX_PAGES", "SMART_CALL_SIGNATURE_PAGE_SIZE", `${declaration}; return smartCallWalletSignatureDelta;`)(
    async (_label, work) => work({ getSignaturesForAddress: async (_key, options) => { calls.push({ ...options }); return pages(options); } }),
    PublicKey, 3, 20
  );
  const latest = Array.from({ length: 20 }, (_, index) => ({ signature: `new-${index}` }));
  const baselineCalls = [];
  const baseline = await makeCollector(() => latest, baselineCalls)({ seenSignatures: {}, signatureCursors: {} }, wallet);
  assert.equal(baseline.hadBaseline, false);
  assert.equal(baselineCalls.length, 1, "first poll must baseline only the latest page, not replay history");
  const catchupCalls = [];
  const catchup = await makeCollector((options) => options.before ? [{ signature: "old-seen" }] : latest, catchupCalls)(
    { seenSignatures: { [wallet]: ["old-seen"] }, signatureCursors: {} }, wallet
  );
  assert.equal(catchupCalls.length, 2);
  assert.equal(catchupCalls[1].before, "new-19");
  assert.equal(catchup.freshSignatures.length, 20);
  assert.equal(catchup.reachedSeen, true);
  assert.equal(catchup.nextCursor, "");
});
test("Smart Calls reject stale catch-up buys and dead markets before a public alert", () => {
  const freshnessStart = serverSource.indexOf("function smartCallBuyIsFresh(");
  const freshnessEnd = serverSource.indexOf("function smartCallMarketIsActive(", freshnessStart);
  assert.ok(freshnessStart >= 0 && freshnessEnd > freshnessStart);
  const isFresh = new Function(`${serverSource.slice(freshnessStart, freshnessEnd)}; return smartCallBuyIsFresh;`)();
  const now = Date.now();
  assert.equal(isFresh({ observedAtMs: now - 30_000 }, now), true, "a just-observed wallet swap remains eligible");
  assert.equal(isFresh({ observedAtMs: now - 2 * 86_400_000 }, now), false, "a two-day-old catch-up signature must never look like a new call");
  assert.equal(isFresh({}, now), false, "an un-timestamped transaction fails closed");

  const marketStart = serverSource.indexOf("function smartCallMarketIsActive(");
  const marketEnd = serverSource.indexOf("async function smartCallCandidateSafety(", marketStart);
  assert.ok(marketStart >= 0 && marketEnd > marketStart);
  const marketIsActive = new Function(`${serverSource.slice(marketStart, marketEnd)}; return smartCallMarketIsActive;`)();
  const leHammer = {
    mc: 2_518,
    liq: 0,
    volume5m: 0,
    volume1h: 0,
    volume24h: 9.18,
    buys5m: 0,
    sells5m: 0,
    buys1h: 0,
    sells1h: 0,
    pairCreatedAt: now - 2 * 86_400_000,
    dexId: "pumpfun"
  };
  assert.equal(marketIsActive(leHammer, now), false, "the exact dead LeHammer market must be suppressed");
  assert.equal(marketIsActive({
    mc: 3_200,
    liq: 0,
    volume5m: 850,
    volume1h: 4_200,
    volume24h: 4_200,
    buys5m: 7,
    sells5m: 3,
    buys1h: 18,
    sells1h: 9,
    pairCreatedAt: now - 8 * 60_000,
    dexId: "pumpfun"
  }, now), true, "an active fresh bonding-curve coin can still alert below $8K");
  assert.equal(marketIsActive({
    mc: 45_000,
    liq: 12_000,
    volume5m: 120,
    volume1h: 2_400,
    volume24h: 38_000,
    buys5m: 2,
    sells5m: 1,
    buys1h: 14,
    sells1h: 8,
    pairCreatedAt: now - 2 * 86_400_000,
    dexId: "raydium"
  }, now), true, "an older coin with real current flow remains eligible");

  const parser = functionBody(serverSource, "smartCallParsedWalletBuys");
  assert.match(parser, /observedAtMs/);
  assert.match(parser, /smartCallBuyIsFresh/);
  const record = functionBody(serverSource, "recordSmartCall");
  assert.match(record, /smartCallCandidateSafety/);
  assert.ok(record.indexOf("smartCallCandidateSafety") < record.lastIndexOf("broadcastSmartCall"), "market proof must happen before any public alert");
});
test("Smart Calls reject dumping rugs and require independently proven caller conviction", () => {
  const marketStart = serverSource.indexOf("function smartCallMarketIsActive(");
  const marketEnd = serverSource.indexOf("async function smartCallCandidateSafety(", marketStart);
  assert.ok(marketStart >= 0 && marketEnd > marketStart);
  const marketIsActive = new Function(`${serverSource.slice(marketStart, marketEnd)}; return smartCallMarketIsActive;`)();
  const now = Date.now();
  const active = {
    mc: 42_000,
    liq: 14_000,
    volume5m: 4_200,
    volume1h: 28_000,
    volume24h: 110_000,
    buys5m: 18,
    sells5m: 9,
    buys1h: 72,
    sells1h: 43,
    priceChange5m: 8,
    priceChange1h: 26,
    pairCreatedAt: now - 40 * 60_000,
    dexId: "raydium"
  };
  assert.equal(marketIsActive(active, now), true, "a healthy buy-led live market remains eligible");
  assert.equal(marketIsActive({ ...active, priceChange5m: -38, buys5m: 4, sells5m: 23 }, now), false, "a live but actively dumping market is not a copy signal");
  assert.equal(marketIsActive({ ...active, priceChange1h: -58, buys1h: 20, sells1h: 91 }, now), false, "one-hour collapse and sell pressure fail closed");
  assert.equal(marketIsActive({ ...active, devSold: true }, now), false, "known dev-sold launches never become recommendations");
  assert.equal(marketIsActive({ ...active, top10Pct: 84 }, now), false, "extreme holder concentration is blocked when known");

  const readyStart = serverSource.indexOf("function smartCallSignalIsReady(");
  const readyEnd = serverSource.indexOf("function smartCallContextHtml(", readyStart);
  assert.ok(readyStart >= 0 && readyEnd > readyStart, "shared caller qualification must exist before message rendering");
  const signalIsReady = new Function(`${serverSource.slice(readyStart, readyEnd)}; return smartCallSignalIsReady;`)();
  assert.equal(signalIsReady({ trigger: "wallet", sourceProfiles: [{ wallet: "wallet-a", cluster: "cluster-a", strong: false, buySol: 0.4 }] }), false, "one merely-ranked wallet is a watch candidate, not a public signal");
  assert.equal(signalIsReady({ trigger: "wallet", sourceProfiles: [
    { wallet: "wallet-a", cluster: "cluster-a", strong: false, buySol: 0.4 },
    { wallet: "wallet-b", cluster: "cluster-b", strong: false, buySol: 0.3 }
  ] }), true, "two independent watched buyers provide real convergence");
  assert.equal(signalIsReady({ trigger: "wallet", sourceProfiles: [
    { wallet: "wallet-a", cluster: "shared-cluster", strong: false, buySol: 0.4 },
    { wallet: "wallet-b", cluster: "shared-cluster", strong: false, buySol: 0.3 }
  ] }), false, "a funded wallet farm cannot fake convergence");
  assert.equal(signalIsReady({ trigger: "wallet", sourceProfiles: [{ wallet: "wallet-a", cluster: "cluster-a", strong: true, buySol: 0.2 }] }), true, "one locally proven high-conviction buyer can alert immediately");
  assert.equal(signalIsReady({ trigger: "wallet", sourceProfiles: [{ wallet: "wallet-a", cluster: "cluster-a", strong: true, buySol: 0.002 }] }), false, "a dust test buy from a strong wallet still waits for confirmation");
  assert.equal(signalIsReady({ trigger: "wallet", sourceProfiles: [
    { wallet: "wallet-a", cluster: "cluster-a", strong: false, buySol: 0.4, at: now - 3 * 60 * 60_000 },
    { wallet: "wallet-b", cluster: "cluster-b", strong: false, buySol: 0.3, at: now }
  ] }), false, "old buys outside the convergence window cannot combine with a new buy");

  const sourceProfile = functionBody(serverSource, "smartCallSourceProfile");
  assert.match(sourceProfile, /winRate >= 60 && trades >= 50/); // provider rank alone is no longer enough
  assert.match(sourceProfile, /copyTier === "A" \|\| copyTier === "B"/); // SlimeWire replay/backtest proof can qualify
  assert.match(sourceProfile, /locallyRugging/); // a newly observed rug removes single-wallet trust quickly

  const record = functionBody(serverSource, "recordSmartCall");
  assert.match(record, /smartCallSignalIsReady/);
  assert.ok(record.indexOf("smartCallSignalIsReady") < record.lastIndexOf("broadcastSmartCall"), "caller proof must happen before public delivery");
  assert.match(functionBody(serverSource, "smartCallWalletTick"), /solAmount: buy\.solAmount/);
});
test("Smart Calls detects only new wallet/post calls and no-ops when no group opted in", () => {
  const wallet = functionBody(serverSource, "smartCallWalletTick");
  assert.match(wallet, /if \(!targets\.any\) return/);       // no listener → no RPC/provider spend
  assert.match(wallet, /hadBaseline/);                       // never replay history on deploy
  assert.match(wallet, /runWithConcurrency\(batch, 5/);       // all polling is bounded-concurrent
  assert.match(wallet, /!allHandled/);                       // transient/partial parser failures retry without cursor holes
  assert.match(wallet, /recordSmartCall/);
  const delta = functionBody(serverSource, "smartCallWalletSignatureDelta");
  assert.match(delta, /getSignaturesForAddress/);
  assert.match(delta, /options\.before = before/);            // busy wallets continue across paginated passes
  assert.match(delta, /SMART_CALL_SIGNATURE_MAX_PAGES/);
  const parsed = functionBody(serverSource, "smartCallParsedWalletBuys");
  assert.match(parsed, /smartCallHeliusBuyForWallet/);        // fast enhanced path, explicitly attributed to watched wallet
  assert.match(parsed, /getParsedTransaction/);              // free RPC fallback
  assert.match(parsed, /checkedSignatures/);                  // only fully checked signatures advance the cursor
  assert.match(functionBody(serverSource, "smartCallHeliusBuyForWallet"), /parseHeliusSwap/);
  const rpcProof = functionBody(serverSource, "smartCallRpcBuyFromTransaction");
  assert.match(rpcProof, /detectSwapActivity\(tx\)\.detected/);
  assert.match(rpcProof, /parsedWalletLamportDelta/);
  assert.match(rpcProof, /incoming transfer\/airdrop is not a buy/);
  const posts = functionBody(serverSource, "smartCallPostTick");
  assert.match(posts, /postBaselines/);                       // X history baseline
  assert.match(posts, /handles\.map.*from:/);                 // one query covers all 30 quickly
  assert.match(posts, /extractMintsFromText/);
  assert.match(posts, /recordSmartCall/);
});
test("Smart Call messages carry website Chart/Quick Buy and verified milestone receipts", () => {
  const record = functionBody(serverSource, "recordSmartCall");
  assert.match(record, /if \(call\)/);                        // one first alert per mint
  assert.ok(record.indexOf("call = state.calls[mint]") < record.lastIndexOf("scanFastTimeout(smartCallCandidateSafety")); // reserve mint before provider await
  assert.match(record, /scanFastTimeout\(smartCallCandidateSafety\(mint\), 5_500/); // bounded safety + live-market snapshot
  assert.match(record, /call\.alertEligible/);                // inactive/dead markets stay tracked but never broadcast
  const keyboard = functionBody(serverSource, "smartCallKeyboard");
  assert.match(keyboard, /links\.site/);
  assert.match(keyboard, /links\.siteBuy/);
  const broadcast = functionBody(serverSource, "broadcastSmartCall");
  assert.match(broadcast, /smartCallContextHtml\(call\)/);
  assert.match(broadcast, /handleTelegramLookCommand/);             // full normal scan card, not a thin alert
  assert.match(broadcast, /contextHtml/);                           // caller identity stays above the scan
  assert.match(functionBody(serverSource, "smartCallContextHtml"), /Called by/);
  assert.match(functionBody(serverSource, "smartCallContextHtml"), /x\.com/);
  assert.match(record, /sourceProfiles/);                           // durable caller name/social/wallet attribution
  const receipts = functionBody(serverSource, "smartCallReceiptTick");
  assert.match(receipts, /SMART_CALL_MILESTONES/);
  assert.match(receipts, /call\.peakMc \/ call\.entryMc/);
  assert.match(receipts, /Verified from the original tracked entry/);
  assert.match(serverSource, /setTimeout\(\(\) => \{ void smartCallWalletTick\(\); \}, 3_000\)/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void smartCallWalletTick\(\); \}, 10_000\)/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void smartCallPostTick\(\); \}, 30_000\)/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void smartCallReceiptTick\(\); \}, 5 \* 60_000\)/);
});
test("Exit Radar pings take-profit on your OWN open bags when a coin tops — advisory, never auto-sells", () => {
  const poll = functionBody(serverSource, "pollExitRadar");
  assert.match(poll, /readExitRadarSubs/);                  // opt-in only
  assert.match(poll, /readTradeHistory/);                   // your own open positions
  assert.match(poll, /p\.buys > 0 && p\.received < p\.spent/); // "still holding the bag" heuristic
  assert.match(poll, /fadePct >= 25 \|\| devSold/);          // top signal: hard fade OR dev dumped
  assert.match(poll, /insiderDevSold/);
  assert.doesNotMatch(poll, /sellToken|buyToken|sendTransaction/); // ADVISORY — it never trades for you
  assert.match(serverSource, /setInterval\(\(\) => \{ void pollExitRadar\(\); \}, 60_000\)/);
});

// ---- Menu reorg: 🎯 Trench super-module with unused Narrative/Graduation hidden ----
test("Trench super-menu folds all trench features into the existing organized settings menu", () => {
  assert.match(functionBody(serverSource, "groupBotMenuMarkup"), /callback_data: "gb:m:trench"/);
  assert.match(functionBody(serverSource, "groupBotModuleView"), /if \(module === "trench"\) return trenchMenuView\(\)/);
  const trench = functionBody(serverSource, "trenchMenuView");
  for (const cb of ["gb:go:snipe", "gb:go:room", "gb:go:signals", "gb:go:lb"]) assert.ok(trench.includes(cb), `trench menu → ${cb}`);
  assert.doesNotMatch(trench, /gb:go:narrative|gb:go:grad/);
  // Trench + its launchers are member-facing: routed BEFORE the settings admin-gate
  const cb = functionBody(serverSource, "handleGroupBotCallback");
  const trenchIdx = cb.indexOf('data === "gb:m:trench"');
  const gateIdx = cb.indexOf("changes settings → admins only");
  assert.ok(trenchIdx > 0 && gateIdx > 0 && trenchIdx < gateIdx, "trench routed before admin gate");
  // /menu (+ /trench /tools) opens the all-users toolkit hub; group /menu + /start route to it too.
  assert.match(serverSource, /parseCommandWithArgument\(text, \["menu", "trench", "tools"\]\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["start", "menu"\]\)/);   // group hub / DM terminal
  // The hub is the all-users toolkit (member-facing), with a buy preset + site/app + admins-only settings.
  assert.match(trench, /callback_data: "pe:open"/);                 // ⚡ set buy preset in chat
  assert.match(trench, /text: "⚙️ Group Settings \(admins\)", callback_data: "gb:home"/);
  assert.match(trench, /🐸 <b>SlimeWire — the room's toolkit<\/b>/);
  // Scan card menu reaches community tools and Smart Calls without the unused Narrative entry.
  const sm = functionBody(serverSource, "scanMenuKeyboard");
  assert.match(sm, /callback_data: "gb:m:trench"/);
  assert.match(sm, /callback_data: "gb:go:signals"/);
  assert.doesNotMatch(sm, /gb:go:narrative|gb:go:grad/);
});
test("Narrative Radar: metas are tappable → LIVE coins only (dedup by ticker, drop dust, top MCs)", () => {
  assert.match(functionBody(serverSource, "narrativeMetas"), /recentLaunchers\.values\(\)/);
  assert.match(functionBody(serverSource, "narrativeMetas"), /counts\.entries\(\)/);   // keyword clustering
  const nar = functionBody(serverSource, "narrativeRadarView");
  assert.match(nar, /callback_data: `nr:m:\$\{w\}`/);                                   // each meta is a button
  const meta = functionBody(serverSource, "narrativeMetaView");
  assert.match(meta, /alphaRadarFetchMc/);                                             // live MC
  assert.match(meta, /c\.mc >= NARRATIVE_MIN_MC/);                                     // drop dead dust
  assert.match(meta, /bySym\.set/);                                                    // dedup by ticker
  assert.match(meta, /sort\(\(a, b\) => b\.mc - a\.mc\)\.slice\(0, 5\)/);              // top 5 by MC
  assert.match(serverSource, /NARRATIVE_MIN_MC = 2700/);
  assert.match(serverSource, /startsWith\("nr:"\)/);                                   // routed
  assert.match(serverSource, /parseCommandWithArgument\(text, \["narrative", "meta"\]\)/);
});
test("Graduation Gauntlet: resilient feed (Moralis-down fallback) + ≥$18k + closest-first + rotate", () => {
  const grad = functionBody(serverSource, "graduationGauntletView");
  assert.match(grad, /webLivePairs\("system", "live", \{ cat: "graduating"/); // resilient path (has pump-frontend fallback), NOT Moralis-only
  assert.doesNotMatch(grad, /buildMoralisPumpCategory/);                       // the Moralis-only call that returned empty is gone
  assert.match(grad, /r\.bondingProgressPct \?\? r\.bondingCurveProgress/);    // read the field the row ACTUALLY has
  assert.match(grad, /mcOf\(r\) >= GRAD_MIN_MC/);                              // ≥$18k
  assert.match(grad, /sort\(\(a, b\) => progOf\(b\) - progOf\(a\)\)/);         // closest-to-bonding first
  assert.match(grad, /gradRotateOffset/);                                     // rotates on refresh
  assert.match(serverSource, /GRAD_MIN_MC = 18000/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["grad", "graduation", "gauntlet"\]\)/);
});
test("SlimeWire plays REMOVED for now — no Top Plays toggle, both play pollers disabled", () => {
  // The 🎯 Top Plays DM toggle is pulled from the Signals menu (Alpha Radar / wallet tracking replace it).
  assert.doesNotMatch(serverSource, /callback_data: "sig:plays"/);
  // Both "SlimeWire plays" pollers are commented out (reversible), so neither DM nor group spam fires.
  assert.doesNotMatch(serverSource, /^\s*setInterval\(\(\) => \{ void pollPlaysSignal\(\); \}/m);
  assert.doesNotMatch(serverSource, /^\s*runAlphaDropTick\(\)\.catch/m);
  // The functions themselves are kept (dead but present) so it's a one-line re-enable if we bring it back.
  assert.match(serverSource, /async function pollPlaysSignal/);
  assert.match(serverSource, /async function runAlphaDropTick/);
});

// ---- Copy-the-room's-best + Launch Room + Proof-of-call (the rest, all in the Trench menu) ----
test("Copy-the-room's-best mirrors a followed trader's buy into the follower's OWN wallet — loop-proof, capped", () => {
  const m = functionBody(serverSource, "maybeCopyRoomBest");
  assert.match(m, /!\/copy_room\/\.test\(String\(e\.source/);          // never mirror a mirror (loop-proof)
  assert.match(m, /walletsForOwner\(walletStore, f\.followerId\)\[0\]/); // follower's OWN wallet
  assert.match(m, /runIdempotentMoneyOp\("copy-room"/);                  // no double-mirror
  assert.match(m, /COPY_MIN_SOL, Math\.min\(COPY_MAX_SOL/);              // capped
  assert.match(m, /source: "copy_room"/);                                // tags the mirror buy
  assert.match(serverSource, /void maybeCopyRoomBest\(events\)\.catch/); // hooked into recordTradeEvents
});
test("Launch Room + Proof-of-call are wired into the Trench menu", () => {
  assert.match(functionBody(serverSource, "trenchMenuView"), /callback_data: "gb:go:copy"/);
  assert.match(functionBody(serverSource, "trenchMenuView"), /callback_data: "gb:go:launch"/);
  assert.match(serverSource, /target === "copy"\) view = await copyMenuView/);
  assert.match(serverSource, /target === "launch"\) view = launchRoomView/);
  // Launch Room announce is admin-gated
  assert.match(functionBody(serverSource, "handleLaunchRoomCallback"), /isTgChatAdmin\(chatId, userId\)/);
  // Proof-of-call shows only VERIFIED winning calls
  assert.match(functionBody(serverSource, "roomReceiptView"), /c\.callerId\) === String\(userId\) && c\.verified/);
  assert.match(serverSource, /data === "room:receipt"/);
  // commands + dispatchers
  assert.match(serverSource, /parseCommandWithArgument\(text, \["copy", "mirror"\]\)/);
  assert.match(serverSource, /startsWith\("copy:"\)/);
  assert.match(serverSource, /startsWith\("lr:"\)/);
  assert.match(serverSource, /await applyCopyInput\(message, userId\)/);
});

// ---- Tweet-to-Snipe (reliable manual fire) + Throne mode (same-second co-entry) on Community Snipe ----
test("Tweet-to-Snipe: admin drops the CA → instant community-snipe fire (X has no reliable free timeline)", () => {
  // admin menu button + input capture + text command
  assert.match(functionBody(serverSource, "communitySnipeAdminMarkup"), /callback_data: "cs:fire"/);
  assert.match(serverSource, /data === "cs:fire"\) \{ csInputPending\.set/);
  const inp = functionBody(serverSource, "applyCsInput");
  assert.match(inp, /pend\.kind === "fire"/);
  assert.match(inp, /void fireCommunitySnipe\(chatId, token, "", "", communitySnipeChain\(s\)\)/);   // fires either chain's pasted CA
  assert.match(serverSource, /if \(sub === "fire"\)/);                     // /snipe fire <CA>
  // admin-gated
  assert.match(serverSource, /sub === "fire" \|\| sub === "throne"/);
});
test("Throne mode: same-second co-entry with aggressive slippage (honest — not fake atomic bundling)", () => {
  assert.match(functionBody(serverSource, "communitySnipeAdminMarkup"), /callback_data: "cs:throne"/);
  const fire = functionBody(serverSource, "fireCommunitySnipe");
  assert.match(fire, /\(snipe\.throneMode \|\| snipe\.throneBundle\) \? 2500 : \(Number\(snipe\.slippageBps\)/); // aggressive fills in throne / throne-bundle mode
  assert.match(fire, /THRONE — the room took it/);
  assert.match(serverSource, /if \(sub === "throne"\)/);
});

// ---- 🐸 SlimeWire PFP maker (free branded profile-pic generator: web + /pfp) --------------------------
test("SlimeWire PFP maker: sharp compositor + public endpoint + /pfp command, all wired", () => {
  const pfpLib = fs.readFileSync(new URL("../src/lib/pfp.js", import.meta.url), "utf8");
  // compositor: cover-crop the source, composite a frame SVG, optional Higgs accent sticker
  assert.match(pfpLib, /export async function makeSlimewirePfp/);
  assert.match(pfpLib, /export async function renderAllSlimewirePfps/);
  assert.match(pfpLib, /export const PFP_FRAMES/);
  assert.match(pfpLib, /fit: "cover", position: "attention"/);       // focus the crop on the face
  for (const id of ["slime", "toxic", "holo", "neon", "crown", "horns"]) assert.match(pfpLib, new RegExp(`id: "${id}"`), `frame ${id}`);
  assert.match(pfpLib, /accentExists/);                              // accent frames only offered when their asset exists
  assert.match(pfpLib, /async function applySlimeGrade/);            // grades the ACTUAL photo (custom, not a slapped-on sticker)
  assert.match(pfpLib, /\.tint\(tintColor\)/);
  // server: public (pre-auth) page + generate endpoint; no wallet/login required
  assert.match(serverSource, /import \{ renderAllSlimewirePfps, makeSlimewirePfp, availableFrames as availablePfpFrames, PFP_FRAMES, renderSlimeStudioGallery, slimeStudioComboCount, makeSlimeStudioPfp, listCharacterFiles, characterPfpCount, makeCharacterPfp \} from "\.\/lib\/pfp\.js"/);
  // 🧟 Character Gallery — pre-made slime-degen characters ("SlimeWire PFP" option)
  assert.match(pfpLib, /export async function makeCharacterPfp/);
  assert.match(pfpLib, /export async function listCharacterFiles/);
  assert.match(serverSource, /pathname === "\/api\/web\/pfp\/characters"/);
  // 🎨 Slime Studio — FREE combinatorial engine (Higgs bg × ring × hat × grade), no per-pic cost
  assert.match(pfpLib, /export async function makeSlimeStudioPfp/);
  assert.match(pfpLib, /export async function renderSlimeStudioGallery/);
  assert.match(pfpLib, /listAssetFiles\(path\.join\(root, "prop"\)\)/); // degen corner-prop category (rocket/diamond/moneybag/bull…)
  assert.match(serverSource, /pathname === "\/api\/web\/pfp\/studio"/);
  assert.match(serverSource, /pathname === "\/api\/web\/pfp\/studio-info"/);
  assert.match(serverSource, /data\.match\(\/\^pfp:st:/);            // TG Slime Studio roll button
  assert.match(serverSource, /pathname === "\/api\/web\/pfp\/generate"/);
  assert.match(serverSource, /"\/pfp", "\/pfp-maker", "\/slime-pfp"/);
  assert.match(serverSource, /function decodePfpImageDataUrl/);
  // Telegram: /pfp turns the user's OWN current avatar into a branded PFP; frame-switch is owner-gated
  assert.match(serverSource, /getUserProfilePhotos/);
  // /pfp = 2-option chooser: 🧟 SlimeWire PFP (roll a character) · 🫠 Slime Your PFP (your pic + assets)
  assert.match(functionBody(serverSource, "handlePfpCommand"), /pfpChooserKeyboard/);
  assert.match(serverSource, /data\.match\(\/\^pfp:char:/);   // roll a pre-made character
  assert.match(serverSource, /data\.match\(\/\^pfp:slime:/);  // slime the tapper's avatar
  assert.match(serverSource, /parseCommandWithArgument\(text, \["pfp", "slimepfp", "avatar"\]\)/);
  assert.match(serverSource, /if \(await handlePfpCallback\(query, userId\)/);
  // web page = 2 options, reaches the origin API
  const pfpHtml = fs.readFileSync(new URL("../web/public/pfp.html", import.meta.url), "utf8");
  assert.match(pfpHtml, /\/api\/web\/pfp\/characters/);
  assert.match(pfpHtml, /\/api\/web\/pfp\/studio/);
  assert.match(pfpHtml, /slimewire-pfp-/);
});

// ---- 🐦 X (Twitter) CA reply bot — unofficial cookie auth, assist/auto modes, DARK by default --------
test("X reply bot: cookie-auth client, mention→scan reply, assist/auto + throttle, owner-gated, dark", () => {
  const xc = fs.readFileSync(new URL("../src/lib/xClient.js", import.meta.url), "utf8");
  // direct signed GraphQL (no paid API, no dead library), env-only secrets, graceful when unconfigured
  assert.match(xc, /import\("x-client-transaction-id"\)/);       // LAZY-loaded (never crashes app boot)
  assert.doesNotMatch(xc, /^import .* from "x-client-transaction-id"/m); // must NOT be a top-level import
  assert.match(xc, /generateTransactionId/);
  assert.match(xc, /scrapeQueryIds/);                           // query ids scraped live (auto-current)
  assert.match(xc, /X_AUTH_TOKEN/); assert.match(xc, /X_CT0/);
  assert.match(xc, /export function xConfigured/);
  assert.match(xc, /export async function xSearchMentions/);
  assert.match(xc, /export async function xReply/);
  assert.match(xc, /SearchTimeline/); assert.match(xc, /CreateTweet/); // read + write ops
  // mentions come from a UNION of the notifications feed + search (either alone can drop a tag), deduped
  assert.match(xc, /notificationMentions/);
  assert.match(functionBody(xc, "xSearchMentions"), /byId/);            // merge-dedupe both sources
  assert.match(xc, /-filter:retweets/);                        // reads OUR mentions
  assert.match(xc, /slimewiredbot/);                            // Telegram-style @SlimeWiredBot tags are searched too
  assert.match(functionBody(xc, "xGetTweet"), /return t \|\| null/); // keep full parent/root fields for thread resolution
  const xcard = fs.readFileSync(new URL("../src/lib/xCard.js", import.meta.url), "utf8");
  assert.match(xcard, /export async function renderXScanCard/);
  // server: DARK unless X_REPLY_ENABLED + cookies; assist (default) vs auto; throttle; idempotent; owner-gated
  const tick = functionBody(serverSource, "xReplyPollTick");
  assert.match(tick, /if \(!xReplyEnabled\(\) \|\| !xConfigured\(\)\) return/);   // dark by default
  assert.match(tick, /X_REPLY_MAX_PER_HOUR/); assert.match(tick, /X_REPLY_MIN_GAP_MS/); // throttle
  assert.match(tick, /if \(state\.seen\[m\.id\]\)/);                             // SEEN-SET is the real dedup (reply once, ever)
  // FLOOR + SEEN model: the floor is only a backlog boundary, NOT a chasing high-water mark, so an
  // out-of-order or pacing-deferred mention can never be skipped forever ("fires when it wants to" fix).
  assert.match(tick, /state\.replyFloorMs/);                                    // backlog floor persisted
  assert.match(tick, /if \(ts && ts <= floor\)/);                               // ignore only ancient backlog
  assert.doesNotMatch(tick, /newHigh/);                                         // no per-mention high-water that skipped un-answered tags
  assert.match(tick, /console\.log\(`\[xreply\]/);                              // observable: logs each tick + reply to Render logs
  assert.match(tick, /if \(auto\)/);                                            // auto vs assist branch
  assert.match(tick, /xReplyOwnerDraft/);                                       // assist = one-tap draft to owner
  assert.match(functionBody(serverSource, "handleXReplyCallback"), /String\(chatId\) !== xReplyOwnerChat\(\)/); // owner-only posting
  assert.match(serverSource, /setInterval\(\(\) => \{ void xReplyPollTick\(\); \}, xPollMs\)/); // poller wired (responsive)
  assert.match(serverSource, /setTimeout\(\(\) => \{ void xReplyPollTick\(\); \}, 10_000\)/);   // + immediate first check on boot
  assert.match(serverSource, /if \(await handleXReplyCallback\(query, userId\)/); // callback dispatch
  assert.match(serverSource, /parseCommandWithArgument\(text, \["xtest", "xstatus"\]\)/); // owner setup check
  assert.match(serverSource, /import \{ xConfigured, xSearchMentions, xReply, xPost, xSearchQuery, xWhoAmI, xHandle, xGetTweet, xLastAuthError, xAuthMode, xAuthReport \} from "\.\/lib\/xClient\.js"/);
  // interactive: replies off a CA, a $ticker, OR the coin in the PARENT post you tagged us under
  assert.match(serverSource, /async function resolveXTargetMint/);
  assert.match(serverSource, /function extractCashtags/);
  assert.match(functionBody(serverSource, "resolveXTargetMint"), /mention\.inReplyToId/);
  // scans the tag, its direct parent AND the thread ROOT, incl. expanded links — "CA on the original post,
  // someone just tags the bot" must resolve even when the reply itself has no contract.
  assert.match(functionBody(serverSource, "resolveXTargetMint"), /mention\.conversationId/);
  assert.match(functionBody(serverSource, "resolveXTargetMint"), /mention\.urls/);
  assert.match(xc, /conversation_id_str/);                             // thread root captured in the client
  assert.match(xc, /expanded_url/);                                    // expanded links captured (t.co hides the CA)
  // auth diagnostics: xClient captures a plain-English reason so /xtest can say WHY it failed
  assert.match(xc, /export function xLastAuthError/);
  assert.match(xc, /export function xAuthReport/);
  assert.match(xc, /X_COOKIES/);                                         // paste-the-whole-cookie option
  // auto-start: replies default ON once X is configured (no extra flag to flip)
  assert.match(serverSource, /function xReplyEnabled\(\) \{ const v = \(process\.env\.X_REPLY_ENABLED/);
  assert.match(serverSource, /function xReplyAuto\(\) \{ const v = \(process\.env\.X_REPLY_AUTO/);
  // 3 stand-out reply modes: Did-It-Rug, Chart Card, Scan-This-Tweet, routed by what the tagger asked
  assert.match(serverSource, /function xIntentFromText/);
  assert.match(serverSource, /async function buildXChartReply/);          // 📈 live candlestick card
  assert.match(serverSource, /async function buildXRugReply/);            // 🛡️ did-it-rug verdict card
  assert.match(serverSource, /function xRugFacts/);
  assert.match(functionBody(serverSource, "buildXChartReply"), /renderCandleChartPng/);
  assert.match(serverSource, /function scanMarketStatsFromSources/);
  assert.match(functionBody(serverSource, "buildXScanReply"), /scanMarketStatsFromSources/);
  assert.match(xcard, /volumeLabel/);
  assert.match(xcard, /HOLDERS/);
  assert.match(xcard, /changeTitle = "1H"/);
  assert.match(xcard, /String\(changeTitle \|\| "1H"\)/);
  assert.match(serverSource, /function scanImageUrlFromScan/);
  assert.match(functionBody(serverSource, "xCoinLogoLive"), /scanImageUrlFromScan\(scan\)/);
  assert.match(functionBody(serverSource, "deliverTelegramSolScan"), /renderSolScanCardPng/);
  assert.match(serverSource, /async function resolveRhTickerToAddress/);
  assert.match(serverSource, /async function resolveTickerToScanTarget/);
  assert.match(functionBody(serverSource, "resolveScanTargetFromText"), /resolveTickerToScanTarget/);
  assert.match(functionBody(serverSource, "resolveAllScanTargetsFromText"), /extractBareTickerHints/);
  assert.match(functionBody(serverSource, "resolveXTargetMint"), /allowBareTickerHints: false/);
  assert.match(functionBody(serverSource, "resolveAllXTargets"), /allowBareTickerHints: false/);
  assert.doesNotMatch(functionBody(serverSource, "xReplyPollTick"), /extractBareTickerHints/);
  assert.match(functionBody(serverSource, "handleTelegramLookCommand"), /resolveScanTargetFromText\(argument\)/);
  assert.match(functionBody(serverSource, "handleXScanCommand"), /allowBareTickerHints: false/);
  assert.match(functionBody(serverSource, "xReplyPollTick"), /no CA\/wallet found yet/);
  assert.match(functionBody(serverSource, "gatherSlimeScan"), /fetchSolanaTrackerTokenReport\(mint, \{ timeoutMs: 3_000 \}\)/);
  assert.match(functionBody(serverSource, "gatherRhScanUncollapsed"), /rhFeedTokens\(\)/);
  assert.match(functionBody(serverSource, "gatherRhScanUncollapsed"), /rhLaunchMetaByAddress\(\)/);
  assert.match(functionBody(serverSource, "gatherRhScanUncollapsed"), /holders/);
  assert.match(functionBody(serverSource, "gatherRhScanUncollapsed"), /aggregateDexPairActivity\(a, pairs\)/);
  assert.match(functionBody(serverSource, "gatherRhScanUncollapsed"), /rhTokenVolumeFallback/);
  assert.match(functionBody(serverSource, "rhTokenVolumeFallback"), /ohlcv\/hour/);
  assert.match(functionBody(serverSource, "gatherSlimeScan"), /webOhlcvPayload\(mint, "1h", \{ poolAddress \}\)/);
  assert.match(functionBody(serverSource, "buildXRhReply"), /rhVolumeInfo\(info\)/);
  assert.match(functionBody(serverSource, "buildXRhReply"), /holderLabel: holdersLabel/);
  assert.match(functionBody(serverSource, "buildXRhReply"), /changeTitle: ch\.title/);
  assert.match(functionBody(serverSource, "renderRhScanCardPng"), /rhScanLogo\(info\)/);
  assert.match(functionBody(serverSource, "recordTelegramCall"), /\^0x\[0-9a-fA-F\]\{40\}\$/);
  assert.match(functionBody(serverSource, "sendRhScanCard"), /recordTelegramCall\(message, address, info\.mc, info\.symbol\)/);
  assert.match(functionBody(serverSource, "sendRhScanCard"), /buildScanCallerFooter\(chatId, address, info\.mc, message\)/);
  assert.match(functionBody(serverSource, "recordTelegramCall"), /channelUsername = message\.sender_chat\?\.username \|\| message\.chat\?\.username/);
  assert.match(functionBody(serverSource, "recordTelegramCall"), /if \(!\(Number\(rec\.entryMc\) > 0\)\) rec\.entryMc = mc/);
  const callerFooter = functionBody(serverSource, "buildScanCallerFooter");
  assert.match(callerFooter, /at \$\{scanFmtMoney\(entry\)\} MC/);
  assert.match(callerFooter, /pct >= 0 \? "🟢" : "🔴"/);
  assert.match(callerFooter, /move pending/);
  assert.match(functionBody(serverSource, "xReplyPollTick"), /xIntentFromText\(m\.text\)/); // intent routed at reply time
  // ANTI-SPAM: reply text carries NO raw URL (X folds link-replies from cold accounts); the card image
  // already shows slimewire.org. Seeded per-tweet variation (wording + card art) beats X's near-duplicate
  // detection on BOTH text and images ("same sentence/same picture to many accounts" = automation signal).
  assert.match(serverSource, /const X_REPLY_CTAS =/);
  assert.match(serverSource, /function makeXVary/);                    // seeded per-reply text variation
  assert.doesNotMatch(functionBody(serverSource, "buildXScanReply"), /textOnly/); // ALWAYS attach a card (rotating design), never image-free
  assert.doesNotMatch(functionBody(serverSource, "buildXScanReply"), /links\.site/);
  assert.doesNotMatch(functionBody(serverSource, "buildXChartReply"), /links\.site/);
  assert.doesNotMatch(functionBody(serverSource, "buildXRugReply"), /links\.site/);
  assert.match(functionBody(serverSource, "xReplyPollTick"), /buildXReply\(target, intent, m\.id\)/); // tweet id seeds variation (target = coin CA or bare wallet for maps)
  assert.match(functionBody(serverSource, "xReplyPollTick"), /buildXScanReply\(target, m\.id\)/); // slow maps fall back to scan instead of no-post
  assert.doesNotMatch(functionBody(serverSource, "xReplyPollTick"), /if \(reply === "__timeout__"\) \{ state\.seen/); // timeout is retryable, not burned forever
  assert.match(functionBody(serverSource, "buildXScanReply"), /scanMarketStatsFromSources\(\{ meta, bonding, best, rug, supply: scan\.supply, mint \}\)/); // supply → MC sanity cross-check (price×supply beats a 1000× source lie)
  assert.match(functionBody(serverSource, "buildXMapReply"), /Liq \$\{stat\("LIQUIDITY"\)\}/);
  // card renderer varies EVERY render (rotating jittered bg + unique grain + mirrored layouts + rotating text)
  assert.match(xcard, /function makeRng/);                             // seeded PRNG drives all choices
  assert.match(xcard, /feTurbulence/);                                 // unique per-card film grain (beats image dedup)
  assert.match(xcard, /const mirror =/);                               // two mirrored layouts
  assert.match(xcard, /const HEADERS =/);                              // rotating header wording
  // reliability: no overlapping ticks; NO hourly cap by default; replies SPACED not deferred
  assert.match(serverSource, /let xPollRunning = false/);              // reentrancy guard
  assert.match(functionBody(serverSource, "xReplyPollTick"), /if \(xPollRunning && \(Date\.now\(\) - xPollRunningAt\) < 120_000\) return/); // SELF-HEALING: force-reset a hung tick after 2min
  assert.match(functionBody(serverSource, "xReplyPollTick"), /mentions fetch timeout/); // mention fetch can't hang the poll
  assert.match(functionBody(serverSource, "xReplyPollTick"), /let lastPostAt =/); // spacing, not defer
});

test("shared scan pipeline stays fast and resilient across Telegram, X, and repeat requests", () => {
  const scan = functionBody(serverSource, "gatherSlimeScan");
  assert.match(serverSource, /const slimeScanCache = new Map\(\)/);
  assert.match(serverSource, /const slimeScanInFlight = new Map\(\)/);
  assert.match(scan, /slimeScanInFlight\.get\(cleanMint\)/); // concurrent X/TG scans share one upstream fan-out
  assert.match(scan, /SCAN_CACHE_TTL_MS/);                    // repeat scans return the fresh shared result
  assert.match(scan, /SCAN_SWR_TTL_MS/);                      // recent scans render now and refresh in background
  assert.match(scan, /backgroundRefreshing: true/);
  assert.match(scan, /SCAN_STALE_TTL_MS/);                    // transient provider blanks keep last-good data
  assert.match(scan, /slimeScanHasMarketEvidence/);           // identity-only/all-n-a reads never poison the fresh cache
  assert.match(scan, /const marketReady =/);
  assert.match(scan, /hedgeMs: 250/);                          // Dex routes hedge instead of timing out serially
  assert.match(scan, /rugFillPromise/);                        // on-chain security fills while market providers load
  assert.match(scan, /mergeSlimeScanResults/);                 // refreshes can only add to the last-good card
  assert.match(scan, /slimeScanCardComplete/);                 // market-only cache entries keep enriching
  assert.match(functionBody(serverSource, "mergeSlimeScanShield"), /slimeShieldHasHardDanger/); // a retry cannot erase a hard-risk verdict
  const mergeRecord = new Function("primary", "fallback", functionBody(serverSource, "mergeSlimeScanRecord"));
  assert.deepEqual(
    mergeRecord({ symbol: "NEW", imageUrl: "", socials: [] }, { symbol: "OLD", imageUrl: "https://cdn.example/pfp.png", socials: ["x"] }),
    { symbol: "NEW", imageUrl: "https://cdn.example/pfp.png", socials: ["x"] },
    "a partial retry must preserve an earlier PFP and non-empty provider arrays"
  );

  const resolvePair = functionBody(serverSource, "resolveDexPairToMint");
  assert.match(resolvePair, /cached\.mint \? 5 \* 60_000 : 10_000/); // a temporary miss is never sticky for 5 minutes
  assert.match(resolvePair, /latest\/dex\/search/);                 // second pair lookup path when the direct endpoint misses
  const resolveTarget = functionBody(serverSource, "resolveScanTargetFromText");
  assert.match(resolveTarget, /consumedPairs/);                      // failed DS lookup cannot mis-scan the pair as a token mint
  assert.ok(
    resolveTarget.indexOf("if (mints.length) return mints[0]") < resolveTarget.indexOf("extractCashtags(blob)"),
    "a pasted CA must remain exact and bypass ambiguous ticker ranking"
  );

  const cashtag = functionBody(serverSource, "resolveCashtagToMint");
  assert.match(cashtag, /fetchMoralisTrendingCoins/);                // live trend membership beats clone liquidity alone
  assert.match(cashtag, /fetchGeckoPools\("trending"/);            // independent public trending source
  assert.match(cashtag, /String\(ticker \|\| ""\).*toLowerCase\(\) !== key/); // exact ticker matches only
  assert.match(cashtag, /tickerCandidateScore/);
  assert.match(cashtag, /tickerCandidateDominance/);
  assert.match(cashtag, /tickerMarketLeadership/);
  assert.match(cashtag, /maxima\.marketCap >= 50_000/);
  assert.match(cashtag, /maxima\.marketCap \* 0\.05/);
  assert.match(cashtag, /maxima\.liquidityUsd \* 0\.10/);
  assert.match(cashtag, /screenTickerCandidateSafety/);             // every returned ticker contract is safety-screened
  assert.match(cashtag, /const safe = screened/);
  assert.match(cashtag, /const mint = safe\[0\]\?\.mint \|\| null/); // fail closed if every candidate is dangerous/unchecked
  assert.match(cashtag, /tickerResolutionMetaCache\.set/);
  const tickerSafety = functionBody(serverSource, "screenTickerCandidateSafety");
  assert.match(tickerSafety, /webSlimeShield/);
  assert.match(tickerSafety, /getMintSafetyInfo/);                    // on-chain authorities do not rely on index text
  assert.match(tickerSafety, /mintAuthority \|\| mintSafety\?\.freezeAuthority/);
  assert.match(tickerSafety, /!mintSafety \|\| !shield/);           // a timed-out safety proof fails closed
  assert.match(tickerSafety, /TOKEN_2022_PROGRAM_ID/);
  assert.match(tickerSafety, /scanRecommendationBlocked/);

  const ticker = functionBody(serverSource, "resolveTickerToScanTarget");
  assert.match(ticker, /const solPromise = resolveCashtagToMint/);  // deep Sol work starts concurrently
  assert.match(ticker, /resolveRhTickerCandidate/);
  assert.match(ticker, /tickerRhClearlyDominates/);                 // decisive RH market returns without waiting for Sol safety
  assert.match(ticker, /providerTimeoutMs: 4_000/);                 // weak Sol dust gets one bounded chain-native retry
  assert.match(ticker, /weakSol.*marketCap.*50_000.*volume24h.*100_000/s);
  assert.match(ticker, /lookupComplete === false.*marketCap/s);     // uncertainty never promotes a micro Sol clone
  assert.match(ticker, /rhLeadership > solLeadership/);             // stronger RH market can beat a weak Sol clone
  const rhTicker = functionBody(serverSource, "resolveRhTickerCandidate");
  assert.match(rhTicker, /if \(chain === "robinhood"\)/);
  assert.match(rhTicker, /tickerMarketLeadership/);
  assert.match(rhTicker, /tickerMarketRowStrength/);                 // one real pair supplies MC+volume; no cross-pair Frankenstein maxima
  assert.match(rhTicker, /candidate\.contractProof \|\| candidate\.dexPair \|\| await scanFastTimeout\(isRhContract/); // exact chain index/live pair proves token
  assert.match(rhTicker, /dexscreener\|geckoterminal/);
  assert.match(rhTicker, /api\.geckoterminal\.com\/api\/v2\/search\/pools/);
  assert.match(rhTicker, /const \[dexData, geckoData, blockscoutRows\] = await Promise\.all/);
  assert.match(rhTicker, /providerTimeoutMs\) \|\| 1_800/);
  assert.match(rhTicker, /rhTickerBlockscoutSearch/);                  // exact chain-native ticker lookup survives DEX index gaps
  assert.match(rhTicker, /rhTickerSymbolIndex/);                       // positive identity remains hot across provider blinks
  assert.match(rhTicker, /const shouldReadFeed = Boolean\(options\.includeFeed\) \|\| candidates\.size === 0/); // heavy universe only runs as last resort
  assert.match(rhTicker, /const indexedResponseComplete = Array\.isArray\(blockscoutRows\)/); // broad DEX arrays are not authoritative RH no-matches
  assert.match(rhTicker, /solDexCandidate/);                          // the independent query can repair a missed dominant Sol result too
  assert.match(rhTicker, /rhTickerDirectMarket/);                   // zero-metric feed matches hydrate by token address
  assert.match(rhTicker, /rhTickerBatchMarkets/);                   // one exact-address batch repairs partial broad search
  assert.match(rhTicker, /rhTickerBlockscoutActivity/);             // exact transfer velocity survives DEX provider outages
  assert.match(rhTicker, /const activityLeader = tickerRhActivityLeader/);
  assert.match(rhTicker, /filter\(\(candidate\) => !tickerRhCandidateHasActiveMarket\(candidate\)\)/);
  assert.match(rhTicker, /sort\(\(a, b\) => b\.holders - a\.holders\)[\s\S]*slice\(0, 4\)/);
  assert.match(rhTicker, /tickerRhSelectCheckedCandidate/);         // multiple identity-only clones fail closed
  assert.match(rhTicker, /pick\.marketCap > 0 \|\| pick\.volume24h > 0/); // an address-only row is not a completed market lookup
  assert.match(rhTicker, /_rhKindCache\.set/);                      // later scan skips duplicate wallet-vs-token RPC work
  const directRh = functionBody(serverSource, "rhTickerDirectMarket");
  assert.match(directRh, /latest\/dex\/tokens/);
  assert.match(directRh, /tokens\/v1\/robinhood/);
  assert.match(directRh, /networks\/robinhood\/tokens/);
  assert.match(directRh, /tickerMarketRowStrength/);
  const batchRh = functionBody(serverSource, "rhTickerBatchMarkets");
  assert.match(batchRh, /tokens\/v1\/robinhood/);
  assert.match(batchRh, /slice\(0, 25\)/);

  const xLogo = functionBody(serverSource, "xCoinLogoLive");
  assert.match(xLogo, /Number\(budgetMs\) \|\| 3_500/); // a cold PFP host cannot consume the whole reply budget
  assert.match(xLogo, /const deadline = Date\.now\(\)/);
  assert.match(xLogo, /Promise\.any/);                   // deduped candidates race instead of timing out serially
  assert.match(xLogo, /facts never wait on a slow PFP/);
});

test("Telegram scan throttling is per token and partial reads still render", () => {
  const look = functionBody(serverSource, "handleTelegramLookCommand");
  assert.match(look, /tgCommandOnCooldown\(chatId, `look:\$\{mint\.toLowerCase\(\)\}`/);
  assert.doesNotMatch(look, /tgCommandOnCooldown\(chatId, "look"/); // a different CA in the same group is not silently dropped
  assert.match(look, /sendChatAction/);                              // visible progress while a cold scan is resolving
  const deliver = functionBody(serverSource, "deliverTelegramSolScan");
  assert.match(deliver, /scan\.rug \|\| scan\.onchain/);           // valid on-chain-only reads still get a card
  assert.match(look, /settleTelegramSolScanCard/);                   // one fast card keeps filling without another post
  assert.match(look, /quickKeyboard = slimeScanPendingKeyboard/);    // no Quick Buy appears before safety proof finishes
  assert.match(functionBody(serverSource, "settleTelegramSolScanCard"), /\[2_500, 6_000, 12_000\]/);
  assert.match(functionBody(serverSource, "settleTelegramSolScanCard"), /mergeSlimeScanResults/);
  const hardRiskKeyboard = functionBody(serverSource, "slimeScanKeyboardForResult");
  assert.match(hardRiskKeyboard, /slimeScanHardTradeRisk/);
  assert.match(hardRiskKeyboard, /slimeScanSafetyProofReady/);
  assert.match(hardRiskKeyboard, /Hard risk · Buy disabled/);        // exact-CA scans warn, but cannot funnel a flagged coin into TG buy

  const messageRouter = functionBody(serverSource, "handleMessage");
  assert.doesNotMatch(messageRouter, /tgCommandOnCooldown\(chatId, "cashtag"/); // handler owns the per-token cooldown
  assert.match(messageRouter, /const cashtag = !text\.trim\(\)\.startsWith\("\/"\) \? extractCashtags\(text\.trim\(\)\)\[0\]/); // $ticker inside a sentence still scans
  assert.match(messageRouter, /gbTicker[\s\S]{0,160}groupBotFeatureOn\(gbTicker, "scan"\)/); // Scan-off groups stay quiet
  assert.match(messageRouter, /Matching the strongest exact/);                  // slow resolution gets an immediate visible acknowledgement
  assert.match(messageRouter, /Couldn't verify a strong exact market/);         // groups never fail silently on an unresolved ticker
  assert.match(functionBody(serverSource, "telegram"), /TELEGRAM_API_TIMEOUT_MS/); // Telegram calls cannot hang forever
});

test("X mention parsing and retry failures cannot starve newer scans", () => {
  const xc = fs.readFileSync(new URL("../src/lib/xClient.js", import.meta.url), "utf8");
  assert.doesNotMatch(functionBody(xc, "parseTweetResult"), /in_reply_to_status_id_str \|\| legacy\.conversation_id_str/);
  assert.doesNotMatch(functionBody(xc, "notificationMentions"), /in_reply_to_status_id_str \|\| t\.conversation_id_str/);

  const resolveAll = functionBody(serverSource, "resolveAllXTargets");
  const ownTargetsAt = resolveAll.indexOf("resolveAllScanTargetsFromText(mention.text");
  const parentFetchAt = resolveAll.indexOf("xGetTweet(pid)");
  assert.ok(ownTargetsAt >= 0 && parentFetchAt > ownTargetsAt, "a ticker explicitly written in the tag must beat the parent coin");

  const tick = functionBody(serverSource, "xReplyPollTick");
  assert.match(tick, /keep queue moving; retry this mention next tick/g);
  assert.doesNotMatch(tick, /writeXReplyState\(state\);\s*break;\s*\/\/ leave it un-seen/);
});

test("site scanner preserves last-good rows and ignores stale responses", () => {
  assert.match(appSource, /let scanLoadVersion = 0/);
  const load = functionBody(appSource, "loadScan");
  assert.match(load, /requestVersion = \+\+scanLoadVersion/);
  assert.match(load, /Scanner refresh timed out/);
  assert.match(load, /previousRows\.length > 0/);
  assert.match(load, /rows: previous\.rows/);
  assert.match(load, /if \(!isCurrentRequest\(\)\) return/);
});

// ---- 🐦🔥 X GROWTH ENGINE — proactive calls, receipts, KOL first-responder, scorecard, persona -----------
test("X DM terminal: link from Telegram, scan/settings/buy/sell over official DMs", () => {
  const xdm = fs.readFileSync(new URL("../src/lib/xDmClient.js", import.meta.url), "utf8");
  assert.match(xdm, /X_DM_OAUTH2_TOKEN|X_DM_ACCESS_TOKEN/);
  assert.match(xdm, /xCookieDmConfigured/);
  assert.match(xdm, /xCookieDmFetchEvents/);
  assert.match(xdm, /xCookieDmSendText/);
  assert.match(xdm, /export function xDmConfigured/);
  assert.match(xdm, /export async function xDmOwnUserId/);
  assert.match(xdm, /export async function xDmFetchEvents/);
  assert.match(xdm, /export async function xDmSendText/);
  assert.match(xdm, /\/dm_events/);
  assert.match(xdm, /\/dm_conversations\/with\/\$\{encodeURIComponent\(id\)\}\/messages/);
  assert.match(serverSource, /import \{ xDmAuthMode, xDmConfigured, xDmFetchEvents, xDmOwnUserId as xDmResolvedOwnUserId, xDmSendText \} from "\.\/lib\/xDmClient\.js"/);
  assert.match(serverSource, /async function handleXLinkCommand/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["xlink"\]\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["xdm", "xdmstatus"\]\)/);
  assert.match(serverSource, /function xDmHelpText/);
  assert.match(serverSource, /function xDmRememberTargets/);
  assert.match(serverSource, /function xDmResolveRecentTarget/);
  assert.match(serverSource, /function xDmSlotMenuText/);
  assert.match(serverSource, /function xDmTradeConfirmText/);
  assert.match(serverSource, /I return a chart and private Trade Pad\. Multiple CAs become coin slots\./);
  assert.match(serverSource, /Fast X DM trading after setup:/);
  assert.match(serverSource, /Menu words: positions \| wallet \| settings/);
  assert.match(serverSource, /Coin slots:/);
  assert.match(serverSource, /chart 1 \| rug 1 \| map 1/);
  assert.match(serverSource, /BUY 1 uses your saved amount and exit preset/);
  assert.match(serverSource, /SELL 1 50 sells 50%/);
  assert.match(serverSource, /Saved \$\{targetList\.length\} new coin slots\. Scanned #1/);
  assert.match(serverSource, /Reply with a coin number for its chart, Trade Pad, and quick actions/);
  assert.match(serverSource, /OPEN SLIMEWIRE CHART \+ TRADE PAD/);
  assert.match(serverSource, /\/x-dm-menu\?t=\$\{encodeURIComponent\(token\)\}/);
  assert.match(serverSource, /signXDmMenuToken\(CONFIG\.appSecret/);
  assert.match(serverSource, /verifyXDmMenuToken\(CONFIG\.appSecret/);
  assert.match(serverSource, /pathname === "\/api\/x-dm\/menu"/);
  const xDmMenu = functionBody(serverSource, "xDmMenuApi");
  for (const action of ["prepare_buy", "prepare_sell", "prepare_bundle_buy", "prepare_bundle_sell", "prepare_copy_wallet", "prepare_copy_launch", "prepare_automation"]) {
    assert.match(xDmMenu, new RegExp(`"${action}"`));
  }
  assert.match(serverSource, /nothing has traded yet/i);
  assert.doesNotMatch(functionBody(serverSource, "xDmHelpText"), /Reply menu:|Buy last coin|Sell help/);
  assert.match(serverSource, /parseXDmBuySlotCommand\(text\)/);
  assert.match(serverSource, /parseXDmSellSlotCommand\(text\)/);
  assert.match(serverSource, /const buyAmountLast = text\.match/);
  assert.match(serverSource, /const sellLastPct = text\.match/);
  assert.match(serverSource, /Reply YES to send\./);
  assert.match(serverSource, /Reply NO to cancel\./);
  assert.match(serverSource, /\^\(yes\|y\|confirm\)\$/);
  assert.match(serverSource, /\^\(no\|n\|cancel\|stop\)\$/);
  assert.match(serverSource, /Only YES, YES <confirm ID>, or NO is accepted/);
  assert.match(serverSource, /ignored stale money event/);
  assert.match(serverSource, /linked SlimeWire account changed/);
  assert.match(serverSource, /Coin slots are 1-6/);
  const xDmHandler = functionBody(serverSource, "xDmHandleEvent");
  assert.ok(
    xDmHandler.indexOf("const invalidBareBuySlot") < xDmHandler.indexOf("const buyAmountLast"),
    "an out-of-range bare integer must be rejected before the legacy latest-coin amount grammar"
  );
  const xDmConfirm = functionBody(serverSource, "xDmConfirmPending");
  assert.match(xDmConfirm, /Number\(rec\.expiresAt\) <= Date\.now\(\)/);
  assert.match(xDmConfirm, /String\(currentLink\.userId\) !== String\(rec\.userId\)/);
  assert.match(xDmConfirm, /xDmEventTimestampMs\(event\)/);
  assert.match(xDmConfirm, /eventAt < pendingAt/);
  assert.match(xDmConfirm, /bareApproval && \(!eventAt \|\| !pendingAt\)/);
  assert.match(functionBody(serverSource, "xDmStartPending"), /payload\.createdAt = Date\.now\(\)/);
  assert.match(xDmHandler, /xDmConfirmPending\(state, senderId, text, event\)/);
  assert.match(xDmHandler, /arrived before this confirmation was staged/);
  assert.match(xDmHandler, /delete state\.pending\[senderId\]/);
  assert.doesNotMatch(functionBody(serverSource, "xDmHelpText"), /bundle \/ volume \/ launch/);
  assert.match(serverSource, /tgExecuteQuickBuyPreset\(userId, rec\.mint, \{ amountSol: rec\.amountSol/);
  assert.match(serverSource, /tgExecuteQuickSell\(userId, rec\.mint, rec\.percent, \{ idempotencyKey:/);
  assert.match(serverSource, /state\.seen\[event\.id\] = Date\.now\(\)/);
  assert.match(serverSource, /state\.failures\[event\.id\]/);
  assert.match(serverSource, /if \(result\?\.ok === false\) throw/);
  assert.match(serverSource, /const scheduleXDmPoll = \(delayMs\) =>/);
  assert.match(serverSource, /scheduleXDmPoll\(active \? xDmActivePollMs : xDmIdlePollMs\)/);
  assert.doesNotMatch(serverSource, /setInterval\(\(\) => \{ void xDmPollTick\(\);/);
});

test("Telegram trending picks fail closed on honeypots and PvP menus can be dismissed", () => {
  const alphaRows = functionBody(serverSource, "telegramAlphaRows");
  const safety = functionBody(serverSource, "screenTickerCandidateSafety");
  const trendingSafety = functionBody(serverSource, "telegramSafetyScreenTrendingRows");
  const ape = functionBody(serverSource, "handleTelegramApeCommand");
  const sharedSafety = functionBody(serverSource, "scanRecommendationBlocked");
  const pvpView = functionBody(serverSource, "pvpArenaView");
  const pvpCallback = functionBody(serverSource, "handlePvpCallback");
  assert.match(alphaRows, /"dexTrending"/);
  assert.match(alphaRows, /telegramSafetyScreenTrendingRows/);
  assert.match(safety, /scanRecommendationBlocked/);
  assert.match(safety, /!mintSafety \|\| !shield/);                 // provider timeouts never become an unchecked recommendation
  assert.match(safety, /untrustedToken2022/);
  assert.match(trendingSafety, /screenTickerCandidateSafety/);       // /alpha checks raw mint safety too
  assert.match(ape, /Promise\.all/);                                 // top fresh candidates screen concurrently, not serially
  assert.match(ape, /screenTickerCandidateSafety/);
  assert.match(sharedSafety, /hasHardBlockedLivePairRisk/);
  assert.match(sharedSafety, /slimeShieldHasHardDanger/);
  assert.match(sharedSafety, /honeypot\|honey\\s\*pot/);
  assert.match(pvpView, /pvp:done/);
  assert.match(serverSource, /text: "✅ Done", callback_data: "pvp:done"/);
  assert.match(pvpCallback, /data === "pvp:done"/);
  assert.match(pvpCallback, /deleteMessage/);
  assert.match(pvpCallback, /editMessageReplyMarkup/);
});

test("Ticker Truth favors the dominant safe market and explains same-symbol clones", () => {
  const score = functionBody(serverSource, "tickerCandidateScore");
  const dominance = functionBody(serverSource, "tickerCandidateDominance");
  const leadership = functionBody(serverSource, "tickerMarketLeadership");
  const credibleMarket = functionBody(serverSource, "tickerCandidateHasCredibleMarket");
  const primaryMarket = functionBody(serverSource, "tickerCandidatePrimaryMarket");
  const truth = functionBody(serverSource, "handleTickerTruthCallback");
  const look = functionBody(serverSource, "handleTelegramLookCommand");
  const keyboard = functionBody(serverSource, "scanResearchKeyboard");
  const mainKeyboard = functionBody(serverSource, "compactTradeCardKeyboard");
  const moreKeyboard = functionBody(serverSource, "compactCardMoreKeyboard");
  assert.match(score, /log\(liquidity\) \* 30/);
  assert.match(score, /log\(marketCap\) \* 18/);
  assert.match(score, /microCapPenalty/);
  assert.match(dominance, /maxima\.marketCap\) \* 60/);
  assert.match(dominance, /maxima\.liquidityUsd\) \* 70/);
  assert.match(leadership, /Math\.sqrt\(mc \* vol\) \* 220/);
  assert.match(leadership, /Math\.min\(mc, vol\) \* 140/);
  assert.match(truth, /exact-symbol contracts found/);
  assert.match(truth, /Unsafe\/unchecked matches are omitted/);
  assert.match(truth, /dominant real market plus live activity/);
  assert.match(look, /tickerScanSelectionLine/);
  assert.match(keyboard, /Ticker Truth/);
  assert.match(keyboard, /Holder Map/);
  assert.match(keyboard, /Airdrop/);
  assert.match(keyboard, /Explain inline/);
  assert.match(keyboard, /Receipts/);
  assert.match(moreKeyboard, /Research/);
  assert.doesNotMatch(mainKeyboard, /Holder Map|Airdrop|Explain inline|Receipts|Ticker Truth/);
  assert.match(serverSource, /startsWith\("tm:"\)/);
  const scoreFn = new Function("candidate", score);
  const dominanceFn = new Function("candidate", "maxima", dominance);
  const leadershipFn = new Function("candidate", "maxima", leadership);
  const credibleMarketFn = new Function("candidate", "maxima", credibleMarket);
  const primaryMarketFn = new Function("tickerCandidateHasCredibleMarket", "tickerMarketRowStrength", "observations", primaryMarket)
    .bind(null, credibleMarketFn, (marketCap, volume24h, liquidityUsd) => {
      const mc = Math.max(0, Number(marketCap) || 0), vol = Math.max(0, Number(volume24h) || 0), liq = Math.max(0, Number(liquidityUsd) || 0);
      return Math.sqrt(mc * vol) + Math.min(mc, vol) + liq * 0.25;
    });
  const rhDominatesFn = new Function("rh", "sol", functionBody(serverSource, "tickerRhClearlyDominates"));
  const rhActiveFn = new Function("candidate", functionBody(serverSource, "tickerRhCandidateHasActiveMarket"));
  const rhActivityFn = new Function("candidates", functionBody(serverSource, "tickerRhActivityLeader"));
  const rhSelectFn = new Function("tickerRhCandidateHasActiveMarket", "tickerRhActivityLeader", "checked", functionBody(serverSource, "tickerRhSelectCheckedCandidate")).bind(null, rhActiveFn, rhActivityFn);
  const established = { marketCap: 509_000, liquidityUsd: 52_000, volume24h: 140_000, holders: 1_100, trendBoost: 0, sources: new Set(["dexscreener"]) };
  const tinyTrendClone = { marketCap: 2_000, liquidityUsd: 1_200, volume24h: 18_000, holders: 90, trendBoost: 55, sources: new Set(["moralis-trending"]) };
  const maxima = { marketCap: established.marketCap, liquidityUsd: established.liquidityUsd, volume24h: established.volume24h };
  const establishedScore = scoreFn(established) + dominanceFn(established, maxima) + leadershipFn(established, maxima);
  const cloneScore = scoreFn(tinyTrendClone) + dominanceFn(tinyTrendClone, maxima) + leadershipFn(tinyTrendClone, maxima);
  assert.ok(establishedScore > cloneScore + 100, `dominant $509K market must decisively beat a $2K trend-feed clone (${establishedScore} vs ${cloneScore})`);
  const oneMetricOnly = { marketCap: 1_000_000, volume24h: 10_000 };
  const balancedLeader = { marketCap: 500_000, volume24h: 500_000 };
  const balancedMaxima = { marketCap: 1_000_000, volume24h: 500_000 };
  assert.ok(leadershipFn(balancedLeader, balancedMaxima) > leadershipFn(oneMetricOnly, balancedMaxima), "a coin strong in both MC and volume must beat a one-metric spike");
  // Live HORSECOCK regression: a wash-volume Meteora clone had only ~$62 of liquidity but millions
  // in reported volume, and used to outrank the real liquid PumpSwap coin around $10K MC.
  const horsecockReal = { mint: "6FNso537P3BecQunQiU34HidxhRRRbSZ1NcMWbNqpump", marketCap: 9_977, liquidityUsd: 7_377, volume24h: 100_375 };
  const horsecockHoneypot = { mint: "EJSob1VrmUzsXgENW2xh678rDQbH6kJDNBWVy6xdxhaV", marketCap: 61_000, liquidityUsd: 62, volume24h: 2_590_000 };
  const horsecockMaxima = { marketCap: horsecockHoneypot.marketCap, liquidityUsd: horsecockReal.liquidityUsd, volume24h: horsecockHoneypot.volume24h };
  assert.equal(credibleMarketFn(horsecockReal, horsecockMaxima), true, "the liquid PumpSwap market must remain eligible");
  assert.equal(credibleMarketFn(horsecockHoneypot, horsecockMaxima), false, "extreme volume on dust liquidity must never win ticker resolution");
  assert.equal(primaryMarketFn([
    { marketCap: 10_128, liquidityUsd: 7_436, volume24h: 100_528, source: "pumpswap" },
    { marketCap: 31_326, liquidityUsd: 0, volume24h: 45_713, source: "pumpfun-bonding" },
    { marketCap: 14_068, liquidityUsd: 8, volume24h: 3, source: "meteora-dust" }
  ]).source, "pumpswap", "one coherent liquid pool must supply MC, liquidity, and volume instead of splicing stale pool maxima");
  assert.match(functionBody(serverSource, "resolveCashtagToMint"), /tickerCandidateHasCredibleMarket/);
  assert.match(functionBody(serverSource, "reconcileIndexedSolTickerCandidate"), /tickerCandidateHasCredibleMarket/);
  const noxaRh = { marketCap: 603_000, volume24h: 2_870_000 };
  const noxaSolClone = { marketCap: 4_200, volume24h: 165 };
  const noxaMaxima = { marketCap: noxaRh.marketCap, volume24h: noxaRh.volume24h };
  assert.ok(leadershipFn(noxaRh, noxaMaxima) > leadershipFn(noxaSolClone, noxaMaxima) * 20, "$NOXA must resolve to its dominant Robinhood market, never the tiny Sol clone");
  assert.equal(rhDominatesFn({ contractProof: true, holders: 2376 }, { marketCap: 4_200, volume24h: 165 }), true, "chain-native holder proof must beat a dust Sol clone while market indexes catch up");
  assert.equal(rhDominatesFn({ contractProof: true, holders: 6961, exactMatches: 20 }, { marketCap: 2_950, volume24h: 297 }), false, "holder-airdropped CASHCOW clone cannot dominate when many exact RH contracts exist");
  assert.equal(rhDominatesFn({ contractProof: true, holders: 2376 }, { marketCap: 500_000, volume24h: 2_000_000 }), false, "identity alone must never displace a strong Sol market");
  const cashcowReal = { address: "0x4ad72e468e38ec204c605f2e058d61e4d79e2ceb", marketCap: 54_833, volume24h: 106_224, liquidityUsd: 21_595 };
  const cashcowNoVolume = { address: "0xff3a8aadd2c6bdb380b2c2e752daf445e2151b09", marketCap: 1_221, volume24h: 0, liquidityUsd: 1_707, holders: 6_961 };
  assert.equal(rhSelectFn([{ candidate: cashcowNoVolume, isContract: true }, { candidate: cashcowReal, isContract: true }]).address, cashcowReal.address, "active CASHCOW market must beat the no-volume holder clone");
  const trashReal = { address: "0xbe4f4bc2ecdca72a6e0d9c963ad71a5869a9fa65", holders: 2_987, activityPerMinute: 600, activityAgeSeconds: 2, activityUniqueTx: 28, activityScore: 350, contractProof: true };
  const trashClone = { address: "0xeb195e198104ffcb8163676758871c83bee7bf5e", holders: 527, activityPerMinute: 66, activityAgeSeconds: 1_800, activityUniqueTx: 35, activityScore: 210, contractProof: true };
  assert.equal(rhSelectFn([{ candidate: trashClone, isContract: true }, { candidate: trashReal, isContract: true }]).address, trashReal.address, "TRASH must use the decisive chain-native activity leader when DEX providers time out");
  assert.equal(rhSelectFn([{ candidate: { ...trashClone, marketCap: 31_000, volume24h: 80_000 }, isContract: true }, { candidate: trashReal, isContract: true }]).address, trashReal.address, "a partial weak clone market response must not beat TRASH's overwhelming chain activity");
  assert.equal(rhDominatesFn({ ...trashReal, activityProof: true, exactMatches: 25 }, { marketCap: 4_563, volume24h: 0 }), true, "active RH TRASH must beat the dust Sol clone selected during the same outage");
  const ambiguousA = { address: "0x1111111111111111111111111111111111111111", activityPerMinute: 8, activityAgeSeconds: 30, activityUniqueTx: 10, activityScore: 120 };
  const ambiguousB = { address: "0x2222222222222222222222222222222222222222", activityPerMinute: 7, activityAgeSeconds: 40, activityUniqueTx: 9, activityScore: 115 };
  assert.equal(rhSelectFn([{ candidate: ambiguousA, isContract: true }, { candidate: ambiguousB, isContract: true }]), null, "similar active clones remain ambiguous instead of being guessed");
  assert.match(functionBody(serverSource, "tickerScanSelectionLine"), /strongest Robinhood/);
  assert.match(functionBody(serverSource, "tickerTruthLine"), /Vol/);
  const rhSend = functionBody(serverSource, "sendRhScanCard");
  assert.match(rhSend, /rhTickerCandidateForTarget/);
  assert.match(rhSend, /Loading full safety, holders, ATH and socials/);
  assert.match(rhSend, /sendPhoto\(chatId, "rh-scan\.jpg", quickPng/); // compressed circular-PFP card avoids Telegram upload timeout
  assert.match(rhSend, /editRhScanTelegramCard/);                    // same card upgrades even when Telegram rejects a media replacement
  assert.match(rhSend, /const cachedComplete = Boolean/);            // only a complete cached card can skip progressive enrichment
  assert.match(rhSend, /mergeRhScanWithTickerCandidate/);             // ticker market facts survive a thin full refresh
  assert.match(rhSend, /quick RH photo failed/);                       // media failure falls straight through to a text card
  const rhPairTarget = functionBody(serverSource, "rhPairTargetToken");
  assert.match(rhPairTarget, /quote\.address/);                       // requested quote-side coins never inherit the base coin identity
  const rhGather = functionBody(serverSource, "gatherRhScanUncollapsed");
  assert.match(rhGather, /pairTarget\.isBase \? pair\?\.priceUsd : null/);
  assert.match(rhGather, /api\.geckoterminal\.com\/api\/v2\/networks\/robinhood\/tokens/); // independent market fallback prevents an all-n/a card when Dex/Blockscout blink
  assert.match(rhGather, /const noxaPromise/);                         // NOXA's slower exact factory read starts concurrently, not after the fast providers already timed out
  assert.match(rhGather, /rhScanSafety\(a\)/);                       // the longer safety pass is shared instead of duplicated across retries
  assert.match(functionBody(serverSource, "rhScanSafety"), /rhSafetyInFlight/);
  assert.match(functionBody(serverSource, "rhTokenContractProof"), /dexRows: Array\.isArray\(dexRows\)/); // reuse the exact Dex response that proved the contract
  assert.match(rhGather, /proofDexRows\.length \? Promise\.resolve\(proofDexRows\)/); // never discard it and make a flaky duplicate request
  assert.match(rhGather, /Array\.isArray\(dsV1\)/);                   // direct Dex token route contributes market data, not only artwork
  assert.doesNotMatch(rhGather, /const \[dsV1,/);                    // do not shadow dsV1 and trigger a TDZ ReferenceError during identity enrichment
  assert.match(rhGather, /rhScanCacheTtl\(cached\.v\)/);              // transient empty results retry in seconds instead of poisoning scans for a minute
  assert.match(rhGather, /if \(rhScanHasMarketEvidence\(v\)\)/);      // never promote an all-zero transient response to last-good
  assert.match(rhGather, /rhImpliedPriceUsd/);                         // non-NOXA fresh pools get a direct implied-price read while indexes catch up
  assert.match(rhGather, /mc = priceUsd \* supply/);                  // implied price restores market cap from the real token supply
  assert.match(rhGather, /else \{\s*rhScanCache\.delete\(key\)/);     // an all-n/a miss cannot poison the next scan, even for five seconds
  assert.match(rhGather, /rhScanLastGood/);                           // intermittent providers cannot erase known-good facts
  const sharedGather = functionBody(serverSource, "gatherRhScan");
  assert.match(sharedGather, /rhScanInFlight/);                       // simultaneous scans share one provider job
  assert.match(sharedGather, /rhScanCardComplete\(shared\.v\)/);     // MC-only shared cache entries cannot freeze the full scan
  assert.match(rhSend, /!rhScanCardComplete\(quickInfo\)/);          // any missing full-card field keeps the background upgrade alive
  assert.match(rhSend, /Object\.assign\(quickInfo, mergedLoaded\)/);  // partial Blockscout identity/holders replace the generic $RH placeholder
  assert.match(rhSend, /\[4_000, 8_000, 15_000, 30_000\]/);           // new pools auto-refresh the same Telegram card through index lag
  assert.match(rhSend, /rhScanCache\.delete/);                         // each bounded retry bypasses the short negative cache
  assert.match(rhSend, /Live providers did not return/);              // exhausted retries end honestly instead of saying "checking" forever
  assert.match(rhSend, /await sleep\(5_000\)/);                       // a settling pass refreshes late PFP + provider fields on the same card
  const rhEdit = functionBody(serverSource, "editRhScanTelegramCard");
  assert.match(rhEdit, /editMessagePhotoBuffer/);
  assert.match(rhEdit, /editMessageCaption/);                          // failed image edits still replace the caption's placeholders
  assert.match(functionBody(serverSource, "renderRhScanCardPng"), /jpeg\(\{ quality: 88/); // high-grain PNG is compressed before TG upload
  assert.match(functionBody(serverSource, "sendPhoto"), /telegramPhotoUpload/);              // MIME/extension match JPEG bytes
  const geckoPool = new Function("firstString", "firstMeaningfulNumber", "rhFiniteNumber", `return function(data, address) {${functionBody(serverSource, "rhGeckoPoolForToken")}}`)(
    (...values) => String(values.find((value) => String(value || "").trim()) || ""),
    (...values) => values.map(Number).find((value) => Number.isFinite(value) && value !== 0) ?? null,
    (value) => Number.isFinite(Number(value)) ? Number(value) : null
  );
  const geckoNoxa = geckoPool({ data: [{
    id: "robinhood_0x121adf3c5fb72be4dfc19d2921c0adbac40614cc",
    relationships: { base_token: { data: { id: "robinhood_0x39e0d9057bd9039cd14590f54de20b9d3457c56e" } }, quote_token: { data: { id: "robinhood_0x0bd7d308f8e1639fab988df18a8011f41eacad73" } } },
    attributes: { address: "0x121adf3c5fb72be4dfc19d2921c0adbac40614cc", base_token_price_usd: "0.00092", fdv_usd: "920000", reserve_in_usd: "94000", volume_usd: { h1: "101000", h24: "3090000" }, price_change_percentage: { h1: "63.8", h24: "501" }, pool_created_at: "2026-06-29T08:33:50Z" }
  }] }, "0x39e0d9057bd9039cd14590f54de20b9d3457c56e");
  assert.deepEqual({ mc: geckoNoxa.marketCapUsd, liq: geckoNoxa.liquidityUsd, vol: geckoNoxa.volume24hUsd, age: geckoNoxa.createdAt }, { mc: 920000, liq: 94000, vol: 3090000, age: "2026-06-29T08:33:50Z" });
  const marketEvidence = new Function("value", functionBody(serverSource, "rhScanHasMarketEvidence"));
  assert.equal(marketEvidence({ priceUsd: 0, mc: 0, liq: 0, vol1: 0, vol24: 0 }), false);
  assert.equal(marketEvidence({ mc: 750_000 }), true);
  const missingRhFields = new Function("rhFiniteNumber", `return function(value) {${functionBody(serverSource, "rhScanMissingCardFields")}}`)(
    (value) => value === null || value === undefined || value === "" ? null : (Number.isFinite(Number(value)) ? Number(value) : null)
  );
  const rhCardComplete = new Function("rhScanMissingCardFields", `return function(value) {${functionBody(serverSource, "rhScanCardComplete")}}`)(missingRhFields);
  const rhCoreComplete = new Function("rhScanMissingCardFields", `return function(value) {${functionBody(serverSource, "rhScanCoreComplete")}}`)(missingRhFields);
  assert.equal(rhCardComplete({ mc: 750_000 }), false, "market cap alone is never a completed scan");
  assert.equal(rhCardComplete({ priceUsd: .001, mc: 750_000, liq: 80_000, vol24: 400_000, holders: 390, createdAt: Date.now() - 60_000, ch1: 2.5, safety: { verdict: "ok" }, imageUrl: "https://cdn.example/coin.png" }), true);
  assert.equal(rhCardComplete({ priceUsd: .001, mc: 750_000, liq: 80_000, vol24: 400_000, holders: 390, createdAt: Date.now() - 60_000, ch1: 2.5, safety: { verdict: "ok" } }), false, "the branded fallback must not count as the coin's real PFP");
  assert.equal(rhCoreComplete({ priceUsd: .001, mc: 750_000, liq: 80_000, vol24: 400_000, holders: 390, createdAt: Date.now() - 60_000, ch1: 2.5, safety: { verdict: "ok" } }), true, "web reads can cache complete facts while Telegram keeps looking for the real PFP");
  assert.doesNotMatch(functionBody(serverSource, "mergeRhTokenRows"), /lastActiveAt/); // activity time is not coin age
  const solLook = functionBody(serverSource, "handleTelegramLookCommand");
  assert.match(solLook, /TG_SCAN_FIRST_RESPONSE_MS/);
  assert.match(solLook, /deliverTelegramSolScan/);
  assert.match(functionBody(serverSource, "deliverTelegramSolScan"), /scanMarketStatsFromSources/); // caller MC matches card facts
  assert.match(functionBody(serverSource, "formatSlimeScanCard"), /Shield\s+<b>/); // explicit safety verdict remains on the full card
  assert.match(functionBody(serverSource, "renderSolScanCardPng"), /xFallbackLogoBuffer/); // every Sol card gets a circular PFP shell
});

test("X growth engine: broadcast-gated proactive posts + receipts + KOL responder + scorecard, tracking always on", () => {
  const xclientSource = fs.readFileSync(new URL("../src/lib/xClient.js", import.meta.url), "utf8");
  // xClient gained a general poster (standalone + quote-tweet) and a general search — receipts/first-responder need them
  assert.match(xclientSource, /export async function xPost\(/);
  assert.match(functionBody(xclientSource, "xPost"), /if \(quoteTweetId\) variables\.attachment_url/); // quote-tweet support
  assert.match(functionBody(xclientSource, "xPost"), /if \(inReplyToId\) variables\.reply/);            // standalone vs reply
  assert.match(xclientSource, /export async function xSearchQuery\(/);
  // master gate: everything that POSTS requires XBOT_BROADCAST (default OFF); tracking + persona are separate
  assert.match(serverSource, /function xBroadcastOn\(\)/);
  assert.match(functionBody(serverSource, "xFeatureOn"), /xBroadcastOn\(\) &&/);        // per-feature AND master
  assert.match(functionBody(serverSource, "xReceiptsTick"), /if \(crossed\.length && xReceiptsOn\(\) && posted < 2\)/); // milestones held until broadcast on
  assert.match(functionBody(serverSource, "xReceiptsTick"), /c\.milestones\.push\(\.\.\.crossed\)/);   // only marked fired after a successful post
  assert.match(functionBody(serverSource, "xPostReceipt"), /quoteTweetId: c\.tweetId/);                // receipt QUOTES our original post
  assert.match(functionBody(serverSource, "xPickAutoCallCandidate"), /computeNetworkBacking/);          // auto-calls reuse the brain
  assert.match(functionBody(serverSource, "xPickAutoCallCandidate"), /if \(s\.coins\[mint\]\) continue/); // never re-call a posted coin
  assert.match(functionBody(serverSource, "xKolWatchTick"), /from:\$\{h\}/);                            // first-responder searches a KOL's own tweets
  assert.match(functionBody(serverSource, "xKolWatchTick"), /XBOT_KOL_FRESH_MIN/);                      // only FRESH KOL calls (tunable window)
  assert.match(functionBody(serverSource, "xKolWatchTick"), /refreshKolscanTop/);                       // pulls kolscan's live top-30 each cycle
  assert.match(serverSource, /const KOLSCAN_SEED_HANDLES = \[/);                                        // hardcoded seed survives an IP-block
  assert.match(functionBody(serverSource, "fetchKolscanTop"), /kolscan\.io\/leaderboard/);              // scrape handles+wallets from the leaderboard
  assert.match(functionBody(serverSource, "xKolWatchHandles"), /_kolscanTopHandles/);                   // watched set = manual ∪ kolscan top-30
  // 🐋 on-chain wallet-follow: today's Top 30 + retained proven winners share the verified TG detector.
  assert.match(serverSource, /const KOLSCAN_SEED_WALLETS = \[/);                                        // top-30 wallets seeded
  const detectBuys = functionBody(serverSource, "xDetectKolBuys");
  assert.match(detectBuys, /smartCallWalletSignatureDelta/);                                           // same gap-safe cursor as Telegram
  assert.match(detectBuys, /smartCallParsedWalletBuys/);                                               // Helius + verified parsed-RPC fallback
  assert.match(detectBuys, /first poll is a baseline/);                                                // never post pre-existing history
  const walletTick = functionBody(serverSource, "xKolTradeTick");
  assert.match(walletTick, /SMART_CALL_WATCH_SIZE/);                                                    // Top 30 plus retained winners
  assert.match(walletTick, /runWithConcurrency\(batch, 5/);
  assert.match(walletTick, /solAmount: b\.solAmount/);
  assert.match(walletTick, /rec\.sourceEligible = tracked\?\.call\?\.sourceEligible === true/);         // Telegram and X use the same measured/convergence proof
  assert.match(walletTick, /rec\.sourceEligible === true/);
  assert.match(walletTick, /!s\.coins\[mint\]/);                                                       // dedup vs everything already surfaced
  assert.match(walletTick, /XBOT_SMARTWALLET_GAP_MIN \|\| 60/);                                       // at most one quality smart-wallet call/hour
  assert.match(walletTick, /XBOT_SMARTWALLET_DAILY \|\| 24/);                                        // hourly cadence remains possible all day
  assert.match(walletTick, /smartWalletPosts\.length >= dailyCap/);
  const smartSafety = functionBody(serverSource, "xSmartWalletCandidateSafety");
  assert.match(smartSafety, /smartCallCandidateSafety/);                                              // X and Telegram share the same proof
  assert.match(smartSafety, /XBOT_SMARTWALLET_MIN_MC/);
  const sharedSmartSafety = functionBody(serverSource, "smartCallCandidateSafety");
  assert.match(sharedSmartSafety, /assertTokenBuyBaseSafety/);                                        // fail closed on authorities/honeypot proof
  assert.match(sharedSmartSafety, /fetchRugcheckFull/);                                               // supply/dev structure is checked before a public call
  assert.match(sharedSmartSafety, /smartCallMarketIsActive/);                                         // dead/inactive markets never become public calls
  const socialCalls = functionBody(serverSource, "xKolWatchTick");
  assert.match(socialCalls, /recordSmartCall/);                                                        // social KOL posts share the same caller + rug proof
  assert.match(socialCalls, /sourceEligible/);
  assert.match(functionBody(serverSource, "xPostKolConvergence"), /SlimeWire-proven wallet just bought/); // individual measured/backtested wallet
  assert.match(functionBody(serverSource, "xPostKolConvergence"), /independent tracked callers are loading/); // multi-wallet convergence call
  assert.match(serverSource, /setInterval\(\(\) => \{ void xKolTradeTick\(\); \}, 10_000\)/);          // scheduled near-live
  // global anti-spam gate on PROACTIVE posts (replies to tags stay ungated)
  assert.match(serverSource, /function xBroadcastGateOk\(\)/);
  assert.match(functionBody(serverSource, "xAutoCallTick"), /if \(!xBroadcastGateOk\(\)\) return/);
  assert.match(functionBody(serverSource, "xReceiptsTick"), /xBroadcastGateOk/);
  assert.match(functionBody(serverSource, "xKolWatchTick"), /if \(!xBroadcastGateOk\(\)\) break/);
  // every proactive post carries the FULL contract on its own line for copy-paste aping
  assert.match(functionBody(serverSource, "xPostText"), /const ca = String\(mint/);
  assert.match(functionBody(serverSource, "xAutoCallText"), /xPostText\(/);
  assert.match(functionBody(serverSource, "xMoverText"), /xPostText\(/);
  assert.match(functionBody(serverSource, "xPostKolConvergence"), /xPostText\(/);
  // degen verdict glow-up (safety verdicts stay clear; only the all-clear green rotates)
  assert.match(functionBody(serverSource, "xVerdict"), /ape-worthy/);
  // tracking is always on (records our reply for later receipts) — independent of the broadcast gate
  assert.match(functionBody(serverSource, "xReplyPollTick"), /await xTrackCoin\(/);
  assert.match(functionBody(serverSource, "xReplyPollTick"), /await xEnrichReplyText\(/);               // memory + persona on replies
  assert.match(functionBody(serverSource, "xEnrichReplyText"), /flagged this \$\{ago\} ago/);           // "saw it Xh ago" memory line
  // schedulers wired
  assert.match(serverSource, /setInterval\(\(\) => \{ void xReceiptsTick\(\); \}/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void xAutoCallTick\(\); \}/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void xKolWatchTick\(\); \}/);
  assert.match(serverSource, /setInterval\(\(\) => \{ void xScorecardTick\(\); \}/);
  // owner controls: /xbot dashboard + /xreply force-reply override, both owner-gated
  assert.match(serverSource, /parseCommandWithArgument\(text, \["xbot"\]\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["xreply", "xr"\]\)/);
  assert.match(functionBody(serverSource, "handleXBotCommand"), /String\(chatId\) !== xReplyOwnerChat\(\)/);
  assert.match(functionBody(serverSource, "handleXForceReplyCommand"), /resolveXTargetMint\(tweet\)/);   // force-reply reuses the poller's resolver
});

// ---- 🗺️ KOL / WALLET MAP — radial holder bubble-map (X + TG + interactive web) -----------------------
test("KOL/wallet map: on-chain holders + ST identity, X 'map' intent + wallet tag, TG /map + drill, web /api/map + /map page", () => {
  // data layer: coin map from free on-chain top holders; wallet map from ST portfolio/trades; token-vs-wallet auto
  assert.match(serverSource, /async function buildTokenHolderMap\(mint\)/);
  assert.match(serverSource, /async function buildWalletMap\(wallet, mode/);
  assert.match(serverSource, /async function buildSubjectMap\(target/);
  assert.match(serverSource, /computeOnchainDistribution\(\{ mint, rpcRead, withHolderCount: false \}\)/); // free holders, skip the mega getProgramAccounts count
  // identity: ONE hour-cached ST leaderboard pull → wallet→{name,twitter,avatar}; unavatar for X pfp
  assert.match(serverSource, /async function mapKolIdentityIndex\(\)/);
  assert.match(serverSource, /unavatar\.io\/twitter\//);
  assert.match(serverSource, /autoKolWallets\.get\(wallet\) \|\| trackedKolWallets\.get\(wallet\)/);
  // render: separate ESM module, avatar embedding + branded background composite
  assert.match(serverSource, /await import\("\.\/lib\/slimeMapRender\.mjs"\)/);
  const mapRender = fs.readFileSync(new URL("../src/lib/slimeMapRender.mjs", import.meta.url), "utf8");
  assert.match(mapRender, /export async function renderSlimeMapPng/);
  assert.match(mapRender, /export async function fetchAvatarDataUri/);       // X pfp → data-uri (resvg can't fetch)
  assert.match(mapRender, /slimewire\.org/);                                 // branding baked in
  // X bot: map intent + bare-wallet tag detection + dispatch
  assert.match(functionBody(serverSource, "xIntentFromText"), /return "map"/);
  assert.match(serverSource, /function extractBareWalletAddress\(text, urls\)/);
  assert.match(functionBody(serverSource, "buildXReply"), /intent === "map"/);
  // TG: /map command, Map button on scan card, map: callback with drill-through
  assert.match(serverSource, /parseCommandWithArgument\(text, \["map", "holders"/);
  assert.match(serverSource, /async function handleMapCallback\(query, userId\)/);
  assert.match(functionBody(serverSource, "scanResearchKeyboard"), /🗺️ Holder Map/);
  assert.match(serverSource, /\["map:", "mapw:", "mape:"\][\s\S]{0,120}startsWith\(prefix\)/);
  // web: public /api/map + /api/map/img BEFORE the auth gate, and /map page route
  const apiIdx = serverSource.indexOf('pathname === "/api/map"');
  const gateIdx = serverSource.indexOf("const auth = await authenticateWebRequest(request)");
  assert.ok(apiIdx > 0 && apiIdx < gateIdx, "/api/map must be registered before the web auth gate");
  assert.match(serverSource, /serveStaticHtmlPage\(response, "map\.html"/);
  // interactive page exists + drills in (click a node → that wallet/coin map)
  const mapHtml = fs.readFileSync(new URL("../web/public/map.html", import.meta.url), "utf8");
  assert.match(mapHtml, /\/api\/map\?/);
  assert.match(mapHtml, /function loadTarget/);
  assert.match(mapHtml, /crumbs/);                                           // breadcrumb drill trail
});

// ---- ✨ AI Slime PFP (fal.ai image-to-image; the real custom slime effect) + looser X throttle --------
test("Airdrop and wallet maps trace Solana/.sol and Robinhood fund flows on web + Telegram", () => {
  const solFunds = functionBody(serverSource, "buildSolanaWalletFundMap");
  const rhFunds = functionBody(serverSource, "buildRhWalletFundMap");
  const rhWallet = functionBody(serverSource, "buildRhWalletMap");
  const solWallet = functionBody(serverSource, "buildWalletMap");
  const flowMap = functionBody(serverSource, "fundFlowRowsToMap");
  assert.match(solFunds, /getSignaturesForAddress/);
  assert.match(solFunds, /v0\/addresses\/\$\{encodeURIComponent\(w\)\}\/transactions/);
  assert.match(solFunds, /nativeTransfers/);
  assert.match(solFunds, /tokenTransfers/);
  assert.match(solFunds, /lookupWalletFunder/);
  assert.match(rhFunds, /robinhoodchain\.blockscout\.com/);
  assert.match(rhFunds, /action=tokentx/);
  assert.match(rhFunds, /startblock=0&endblock=999999999/);
  assert.match(rhWallet, /rhWalletScan/);
  assert.match(rhWallet, /scan\.holdings/);
  assert.match(rhWallet, /scan\.trades/);
  assert.match(rhWallet, /BUYS \/ SELLS/);
  assert.match(solWallet, /recent coins traded/);
  assert.match(solWallet, /flowLabel/);
  assert.match(solWallet, /solWalletScan\(wallet\)/);
  assert.match(flowMap, /mode: "funds"/);
  assert.match(flowMap, /FUNDED/);
  assert.match(flowMap, /FUNDERS/);
  assert.match(functionBody(serverSource, "buildSubjectMap"), /buildRhWalletFundMap/);
  assert.match(functionBody(serverSource, "buildSubjectMap"), /buildSolanaWalletFundMap/);
  assert.match(functionBody(serverSource, "buildRhTokenHolderMap"), /action=getTokenHolders/);
  assert.match(functionBody(serverSource, "buildRhTokenHolderMap"), /item\?\.address_hash\?\.hash/);
  const rhHolderPages = functionBody(serverSource, "fetchRhTokenHolderItems");
  assert.match(rhHolderPages, /page < 2/);
  assert.match(rhHolderPages, /next_page_params/);
  assert.match(rhHolderPages, /items\.length >= 100/);
  assert.match(functionBody(serverSource, "buildRhTokenHolderMap"), /fetchRhTokenHolderItems/);
  assert.match(functionBody(serverSource, "buildRhTokenHolderMap"), /holderSnapshotComplete/);
  assert.match(functionBody(serverSource, "buildRhTokenHolderMap"), /tokenDecimals/);
  assert.match(serverSource, /requestUrl\.searchParams\.get\("domain"\)/);
  assert.match(serverSource, /resolveWalletDomainToAddress\(rawTarget\)/);
  assert.match(serverSource, /"fundmap", "funds", "flow"/);
  assert.match(functionBody(serverSource, "handleTelegramMapCommand"), /resolveWalletDomainToAddress/);
  assert.match(functionBody(serverSource, "handleTelegramMapCommand"), /reply\?\.reply_markup\?\.inline_keyboard/);
  assert.match(functionBody(serverSource, "handleTelegramMapCommand"), /0\[xX\]\[0-9a-fA-F\]\{40\}/);
  assert.ok(functionBody(serverSource, "handleTelegramMapCommand").indexOf("...buttonHints") < functionBody(serverSource, "handleTelegramMapCommand").indexOf("reply?.text"));
  assert.match(functionBody(serverSource, "handleMapCallback"), /parts\[2\] === "funds"/);
  assert.match(functionBody(serverSource, "handleMapCallback"), /forceWallet: parts\[0\] === "mapw"/);
  assert.match(functionBody(serverSource, "mapTelegramDetailLines"), /Recent traded coins/);
  assert.match(functionBody(serverSource, "mapTelegramDetailLines"), /Top current bags/);
  assert.match(functionBody(serverSource, "sendMapCard"), /mapTelegramDetailLines\(map\)/);
  assert.match(functionBody(serverSource, "sendMapCard"), /telegramMapPhotoCandidates\(png\)/);
  assert.match(functionBody(serverSource, "sendMapCard"), /for \(const candidate of candidates\)/);
  assert.match(functionBody(serverSource, "telegramMapPhotoCandidates"), /slimewire-holder-map\.jpg/);
  assert.match(functionBody(serverSource, "telegramMapPhotoCandidates"), /compressionLevel: 9/);
  assert.match(functionBody(serverSource, "sendAirdropSubjectCard"), /sendMapCard\(chatId, target, "funds"\)/);
  const walletCard = functionBody(serverSource, "sendWalletScanCard");
  assert.match(walletCard, /Fund Map/);
  assert.match(walletCard, /mapw:\$\{address\}:funds/);
  assert.match(functionBody(serverSource, "handleMapCallback"), /parts\[0\] !== "mapw"/);
  assert.match(walletCard, /Airdrops Sent/);
  assert.match(walletCard, /airdrop\?ca=\$\{encodeURIComponent\(address\)\}/);
  const walletScan = fs.readFileSync(new URL("../src/lib/walletScan.js", import.meta.url), "utf8");
  assert.match(walletScan, /bsAccountWithV2Fallback\(a, "tokenlist"\)/);
  assert.match(walletScan, /bsAccountWithV2Fallback\(a, "tokentx"\)/);
  assert.match(walletScan, /token-transfers/);
  assert.match(walletScan, /trades: tradeRows\.slice/);
  const mapHtml = fs.readFileSync(new URL("../web/public/map.html", import.meta.url), "utf8");
  assert.match(mapHtml, /\.sol\/\.eth domain, or Robinhood 0x/);
  assert.match(mapHtml, /data-m="funds"/);
  assert.match(mapHtml, /n\.direction==='in'/);
  assert.match(mapHtml, /flowLabel/);
  assert.match(mapHtml, /Recent traded coins/);
  assert.match(mapHtml, /Current bags/);
  assert.match(mapHtml, /map\.kind==='token'\|\|funds\?'wallet':'coin'/);
  const dropHtml = fs.readFileSync(new URL("../web/public/airdrop.html", import.meta.url), "utf8");
  assert.match(dropHtml, /Fund Map/);
  assert.match(dropHtml, /mode=funds/);
  assert.match(dropHtml, /j&&j\.redirect/);
  const mapRender = fs.readFileSync(new URL("../src/lib/slimeMapRender.mjs", import.meta.url), "utf8");
  assert.match(mapRender, /const fundMode = nodes\.some/);
  assert.match(mapRender, /p\.direction === "in"/);
  assert.match(mapRender, /funded this wallet/);
});

test("AI Slime PFP: fal.ai img2img, rotating styles, budget-guarded, dark until FAL_KEY", () => {
  const ai = fs.readFileSync(new URL("../src/lib/aiPfp.js", import.meta.url), "utf8");
  assert.match(ai, /export function aiPfpConfigured/);
  assert.match(ai, /FAL_KEY/);
  assert.match(ai, /https:\/\/fal\.run\//);                          // fal.ai sync endpoint
  assert.match(ai, /image_urls: \[imageDataUrl\]/);                  // image-to-image (repaint the real photo)
  assert.match(ai, /const AI_STYLES = \[/);                          // rotating style options
  // server: styles + generate endpoint, DARK until configured, budget rate-limited, branded output
  assert.match(serverSource, /pathname === "\/api\/web\/pfp\/ai-styles"/);
  assert.match(serverSource, /pathname === "\/api\/web\/pfp\/ai"/);
  assert.match(serverSource, /if \(!aiPfpConfigured\(\)\) \{ sendWebJson\(request, response, 503/);  // dark until FAL_KEY
  assert.match(serverSource, /if \(!aiPfpRateOk\(\)\)/);             // protects the paid budget
  assert.match(serverSource, /async function brandAiPfp/);           // SlimeWire wordmark on the art
  assert.match(serverSource, /data\.match\(\/\^pfp:ai:/);            // TG AI callback
  assert.match(serverSource, /import \{ aiPfpConfigured, aiPfpStyles, aiSlimePfp \} from "\.\/lib\/aiPfp\.js"/);
  const pfpHtml = fs.readFileSync(new URL("../web/public/pfp.html", import.meta.url), "utf8");
  assert.match(pfpHtml, /\/api\/web\/pfp\/ai/);
  assert.match(pfpHtml, /function aiSlime/);
  // X reply throttle: NO hourly cap by default (owner wants it to never go quiet + look broken under load)
  assert.match(functionBody(serverSource, "xReplyPollTick"), /X_REPLY_MAX_PER_HOUR \|\| 0/);
});

test("airdrop and holder maps expose real cluster summaries + liquidity fallbacks", () => {
  const graph = functionBody(serverSource, "mapComputeClusters");
  assert.match(graph, /summary:\s*\{/);
  assert.match(graph, /clusteredPct/);
  assert.match(graph, /direct holder-to-holder funding/i);
  assert.match(graph, /addRelationship\(funder, wallet, "direct"/);
  assert.match(graph, /directLinkCount/);
  assert.match(graph, /mapHolderTokenTransferLinks/);
  assert.match(graph, /addRelationship\(edge\.a, edge\.b, "token"/);
  assert.match(graph, /tokenLinkCount/);
  assert.match(graph, /holderFingerprint/);
  assert.match(graph, /summary\?\.complete/);
  assert.match(graph, /fundersPending/);
  assert.match(graph, /maxSharedFunderChildren/);
  assert.match(graph, /isRh \? Math\.min\(30/);
  assert.match(graph, /clusterIdRemap/);
  assert.match(graph, /windowHours: 24/);
  assert.match(graph, /retryResults/);
  assert.match(graph, /walletCid\.has\(e\.wallet\)/);
  const transferLinks = functionBody(serverSource, "mapHolderTokenTransferLinks");
  assert.match(transferLinks, /tokenTransfers/);
  assert.match(transferLinks, /fromUserAccount/);
  assert.match(transferLinks, /toUserAccount/);
  assert.match(transferLinks, /recentCutoff/);
  const rhTransferLinks = functionBody(serverSource, "rhHolderTokenTransferLinks");
  assert.match(rhTransferLinks, /total\?\.decimals/);
  assert.match(rhTransferLinks, /from === poolAddress \? "buy" : "receive"/);
  assert.match(rhTransferLinks, /to === poolAddress \? "sell" : "send"/);
  const rhFunder = functionBody(serverSource, "lookupRhWalletFunder");
  assert.match(rhFunder, /rhWalletFunderPending/);
  assert.match(rhFunder, /if \(!d \|\| !Array\.isArray\(d\.result\)\) return undefined/);
  const telegramClusterActivity = functionBody(serverSource, "mapTelegramFlowLines");
  assert.match(telegramClusterActivity, /Cluster \$\{String\.fromCharCode/);
  assert.doesNotMatch(telegramClusterActivity, /a holder/);
  const mapKeyboard = functionBody(serverSource, "mapCardKeyboard");
  assert.match(mapKeyboard, /mapDrillButtonText/);
  assert.doesNotMatch(mapKeyboard, /n\.name \|\| "wallet"/);
  assert.match(mapKeyboard, /ethereum \|\| map\.mode === "funds" \? "funds" : "bags"/);
  assert.match(functionBody(serverSource, "mapTelegramClusterLines"), /Connected wallets/);
  assert.match(serverSource, /pathname === "\/api\/airdrop\/graph"/);
  assert.match(serverSource, /summary: graph\.summary \|\| null/);
  const holder = functionBody(serverSource, "buildTokenHolderMap");
  assert.match(holder, /mergeTokenMarketMetadata/);
  assert.match(holder, /liq, ch1/);
  assert.match(holder, /label:\s*"HOLDERS"/);
  assert.match(serverSource, /fetchKolscanIdentities[\s\S]*KOLSCAN_SEED_WALLETS/);
  const drop = functionBody(serverSource, "buildAirdropView");
  assert.match(drop, /BAGS DROPPED/);
  assert.match(drop, /TOP HOLDERS/);
  assert.match(drop, /LIQUIDITY/);
  assert.match(drop, /const flow = \{/);
  assert.match(drop, /sourceLabel/);
  const mapRender = fs.readFileSync(new URL("../src/lib/slimeMapRender.mjs", import.meta.url), "utf8");
  assert.match(mapRender, /flowRows/);
  assert.match(mapRender, /Drop Flow/);
  assert.match(mapRender, /Top transfer paths/);
  assert.match(mapRender, /ACCUMULATING/);
  assert.match(mapRender, /OFFLOADING/);
  const mapHtml = fs.readFileSync(new URL("../web/public/map.html", import.meta.url), "utf8");
  assert.match(mapHtml, /ensureStat/);
  assert.match(mapHtml, /HOLDERS/);
  assert.match(mapHtml, /gr\.edges/);
  assert.match(mapHtml, /kind==='direct'/);
  assert.match(mapHtml, /summary&&gr\.summary\.complete===false/);
  assert.match(mapHtml, /not a final clean result/);
  assert.match(mapHtml, /recent cluster activity/);
  assert.match(mapHtml, /flowNetLabel/);
  assert.match(mapHtml, /action==='buy'/);
  assert.doesNotMatch(mapHtml, /a top holder/);
  assert.match(mapHtml, /wallets ·/);
  const dropHtml = fs.readFileSync(new URL("../web/public/airdrop.html", import.meta.url), "utf8");
  assert.match(dropHtml, /ensureDropStat/);
  assert.match(dropHtml, /dropClusterHulls/);
  assert.match(dropHtml, /Pick airdrops/);
  assert.match(dropHtml, /renderDropClusterLegend/);
  assert.match(dropHtml, /openDropCluster/);
  assert.match(dropHtml, /renderDropClusterEmpty/);
  assert.match(dropHtml, /enrichDropStats/);
});

test("holder map cards show real direct wallet links and an explicit combined cluster total", async () => {
  const { buildMapSvg } = await import(`../src/lib/slimeMapRender.mjs?cluster-link-test=${Date.now()}`);
  const svg = buildMapSvg({
    subject: "$TEST",
    nodes: [
      { i: 0, wallet: "WalletA", pct: 4, usd: 4000, weight: 1, state: "whale" },
      { i: 1, wallet: "WalletB", pct: 2, usd: 2000, weight: 0.5, state: "hold" },
    ],
    clusters: [{ id: 0, size: 2, members: [0, 1], hub: 0, pct: 6, usd: 6000, directLinkCount: 1, sharedLinkCount: 0 }],
    clusterLinks: [{ a: 0, b: 1, source: 0, target: 1, kind: "direct", clusterId: 0 }],
    sidePanel: true,
    W: 1320,
    H: 820,
  });
  assert.match(svg, /COMBINED 6\.0%/);
  assert.match(svg, /1 direct link/);
});

test("volume bot uses a flat 0.05 SOL fee every 50 confirmed market transactions", () => {
  assert.match(serverSource, /VOLUME_BOT_FLAT_FEE_LAMPORTS = Math\.round\(0\.05 \* LAMPORTS_PER_SOL\)/);
  assert.match(serverSource, /VOLUME_BOT_FLAT_FEE_INTERVAL = 50/);
  assert.match(serverSource, /async function settleVolumeBotFlatFee/);
  assert.match(serverSource, /feePolicy: \{ kind: "flat", feeSol: 0\.05, everyTransactions: 50, percentageFeeBps: 0 \}/);
  assert.match(serverSource, /buyTokenForPlan\(record, plan\.tokenMint[\s\S]*?skipTradeFee: true/);
  assert.match(serverSource, /sellTokenFromWallet\(record, plan\.tokenMint[\s\S]*?skipTradeFee: true/);
  assert.match(functionBody(serverSource, "buyTokenForPlan"), /options\.skipTradeFee === true/);
  assert.match(functionBody(serverSource, "sellTokenAmountFromWallet"), /options\.skipTradeFee === true/);
  assert.match(serverSource, /const totalFeeBps = CONFIG\.baseTradeFeeBps/);
  assert.doesNotMatch(serverSource, /referralTradeSurchargeBps/);
});

test("linked NFT manual uploads stay live while the funded studio is safely feature-gated", () => {
  const scenarioSource = fs.readFileSync(new URL("../src/lib/scenarioNft.js", import.meta.url), "utf8");
  assert.match(serverSource, /generationJobs: Array\.isArray\(store\.generationJobs\)/);
  assert.match(serverSource, /async function webNftStudioQuote/);
  assert.match(serverSource, /function signNftStudioQuote/);
  assert.match(serverSource, /function verifyNftStudioQuote/);
  assert.match(serverSource, /async function webStartNftStudioJob/);
  assert.match(serverSource, /async function webGenerateNftStudioPreviews/);
  assert.match(serverSource, /async function webApproveNftStudioPreview/);
  assert.match(serverSource, /async function webRunNftStudioNext/);
  assert.match(serverSource, /async function settleNftStudioJob/);
  assert.match(serverSource, /NFT_STUDIO_ENABLED \|\| "false"/);
  assert.match(serverSource, /enabled: live && scenarioNftConfigured\(\)/);
  assert.match(serverSource, /Upload artwork for this NFT before minting/);
  assert.match(serverSource, /NFT_STUDIO_PLATFORM_FEE_BPS", 1200/);
  assert.match(serverSource, /platformFeeChargedLamports = Math\.ceil\(\(apiExpenseLamports \* platformFeeBps\) \/ 10_000\)/);
  assert.match(serverSource, /settlementFeeLamports = balance > 0/);
  assert.match(serverSource, /refundLamports/);
  assert.match(serverSource, /Generated By", value: "SlimeWire Funded Collection Studio"/);
  assert.match(scenarioSource, /Basic \$\{Buffer\.from/);
  assert.match(scenarioSource, /\/generate\/custom\/\$\{encodeURIComponent\(scenarioNftModelId\(\)\)\}/);
  assert.match(scenarioSource, /\/jobs\/\$\{encodeURIComponent\(jobId\)\}/);
  assert.match(serverSource, /if \(\/collection\/\.test\(iface\)\) return false/);
  for (const file of ["gg.html", "index.html"]) {
    const html = fs.readFileSync(new URL(`../web/public/${file}`, import.meta.url), "utf8");
    assert.match(html, /Funded Collection Studio/);
    assert.match(html, /Generate 4 previews/);
    assert.match(html, /all-in SOL/);
    assert.match(html, /Cancel &amp; refund unused/);
    assert.match(html, /AI NFT generation · Coming soon/);
    assert.match(html, /Upload your own NFT artwork/);
    assert.match(html, /Upload &amp; mint NFT/);
    assert.match(html, /Choose an artwork image before minting/);
    assert.match(html, /renderWalletNfts/);
    assert.match(html, /\["nfts","NFTs"\]/);
  }
});

test("Telegram /index posts a cached top-10 crypto market snapshot with in-place refresh", () => {
  const register = functionBody(serverSource, "registerTelegramBotCommands");
  const handler = functionBody(serverSource, "handleTelegramIndexCommand");
  const fetcher = functionBody(serverSource, "fetchMarketIndexSnapshot");
  const view = functionBody(serverSource, "marketIndexView");
  const messageHandler = functionBody(serverSource, "handleMessage");
  const channelHandler = functionBody(serverSource, "handleChannelPostCommands");

  assert.match(register, /command: "index"/);
  assert.match(fetcher, /api\.coingecko\.com\/api\/v3\/coins\/markets/);
  assert.match(fetcher, /api\.coingecko\.com\/api\/v3\/global/);
  assert.match(fetcher, /api\.alternative\.me\/fng/);
  assert.match(fetcher, /marketIndexCache\.promise/);
  assert.match(handler, /editMessageText/);
  assert.match(view, /Crypto Market Index/);
  assert.match(view, /marketindex:refresh/);
  assert.match(messageHandler, /\["index", "marketindex", "cryptoindex"\]/);
  assert.match(channelHandler, /\["index", "marketindex", "cryptoindex"\]/);
});

test("Telegram /c and /chart render CA, crypto, and stock charts in chat with timeframe buttons", () => {
  const register = functionBody(serverSource, "registerTelegramBotCommands");
  const command = functionBody(serverSource, "handleTelegramChartCommand");
  const tokenChart = functionBody(serverSource, "sendTokenChart");
  const stockResolver = functionBody(serverSource, "resolveYahooStock");
  const stockFetch = functionBody(serverSource, "fetchYahooStockChart");
  const stockChart = functionBody(serverSource, "sendStockChart");
  const cryptoChart = functionBody(serverSource, "sendCryptoChart");
  const callbackHandler = functionBody(serverSource, "handleCallback");
  const messageHandler = functionBody(serverSource, "handleMessage");

  assert.match(register, /command: "chart"/);
  assert.match(command, /sendTokenChart\(chatId, evmCa, "robinhood", "5m"\)/);
  assert.match(command, /sendTokenChart\(chatId, solCa, "solana", "5m"\)/);
  assert.match(command, /resolveYahooStock/);
  assert.match(command, /resolveCoinGeckoId/);
  assert.match(tokenChart, /renderCandleChartPng/);
  assert.match(tokenChart, /editMessagePhotoBuffer/);
  assert.match(stockResolver, /query1\.finance\.yahoo\.com\/v1\/finance\/search/);
  assert.match(stockFetch, /query1\.finance\.yahoo\.com\/v8\/finance\/chart/);
  assert.match(stockChart, /renderCandleChartPng/);
  assert.match(stockChart, /editMessagePhotoBuffer/);
  assert.match(cryptoChart, /editMessagePhotoBuffer/);
  assert.match(callbackHandler, /startsWith\("chartca:"\)/);
  assert.match(callbackHandler, /startsWith\("chartst:"\)/);
  assert.doesNotMatch(messageHandler, /query\.data\?\.startsWith\("chart(?:ca|st):"\)/);
  assert.match(functionBody(serverSource, "handleChannelPostCommands"), /\["chart", "c"\]/);
});

test("Telegram /i resolves a CA, ticker, or coin name into an in-chat market info card", () => {
  const register = functionBody(serverSource, "registerTelegramBotCommands");
  const command = functionBody(serverSource, "handleTelegramInfoCommand");
  const resolver = functionBody(serverSource, "resolveTelegramInfoTarget");
  const card = functionBody(serverSource, "sendTelegramTokenInfoCard");
  const cryptoCard = functionBody(serverSource, "sendTelegramCryptoInfoCard");
  const callbackHandler = functionBody(serverSource, "handleCallback");

  assert.match(register, /command: "i"/);
  assert.match(command, /INFO_MAJOR_CRYPTO_IDS/);
  assert.match(command, /resolveTelegramInfoTarget/);
  assert.match(resolver, /resolveTickerToScanTarget/);
  assert.match(resolver, /webTokenSearch/);
  assert.match(card, /24h High/);
  assert.match(card, /24h Low/);
  assert.match(card, /24h Volume/);
  assert.match(card, /Mkt\. Cap \(FDV\)/);
  assert.match(card, /telegramInfoSocialLine/);
  assert.match(card, /telegramTokenInfoKeyboard/);
  assert.match(cryptoCard, /price_change_percentage_7d_in_currency/);
  assert.match(callbackHandler, /startsWith\("info:"\)/);
  assert.match(callbackHandler, /startsWith\("infocg:"\)/);
  assert.match(functionBody(serverSource, "handleMessage"), /\["i", "info", "coininfo"\]/);
  assert.match(functionBody(serverSource, "handleChannelPostCommands"), /\["i", "info", "coininfo"\]/);
});

test("Buy Bot posts one persisted active-coin statistics recap every eight hours", () => {
  const solBuy = functionBody(serverSource, "postGroupBuy");
  const rhBuy = functionBody(serverSource, "postGroupBuyRh");
  const snapshot = functionBody(serverSource, "buildGroupBuyStatsSnapshot");
  const text = functionBody(serverSource, "groupBuyStatsText");
  const tick = functionBody(serverSource, "pollGroupBuyStats");
  const start = functionBody(serverSource, "startGroupBuyBot");
  const queue = functionBody(serverSource, "queueGroupBuyAlert");

  assert.match(serverSource, /GROUP_BUY_STATS_INTERVAL_MS = 8 \* 60 \* 60_000/);
  assert.match(solBuy, /recordGroupBuyStats\(mint/);
  assert.match(rhBuy, /recordGroupBuyStats\(address/);
  assert.match(snapshot, /gatherSlimeScan|scanMarketStatsFromSources/);
  assert.match(snapshot, /gatherRhScan/);
  assert.match(text, /Market cap/);
  assert.match(text, /Volume 1H/);
  assert.match(text, /Volume 24H/);
  assert.match(text, /Whale buys observed 24H/);
  assert.match(text, /Biggest buy observed 24H/);
  assert.match(text, /Smart-wallet buys observed 24H/);
  assert.match(tick, /groupBotFeatureOn\(entry, "buybot"\)/);
  assert.match(tick, /statsPatches\.set\(String\(chatId\), \{ token, lastAt: now \}\)/);
  assert.match(tick, /now - Number\(entry\.buyStats\.lastAt\) >= GROUP_BUY_STATS_INTERVAL_MS/);
  assert.match(tick, /if \(!delivered\) return/);
  assert.match(tick, /mutateGroupBot\(\(latest\) =>/);
  assert.match(tick, /entry\.buyStats = buyStats/);
  assert.match(queue, /return delivered/);
  assert.match(start, /setInterval\(\(\) => \{ void pollGroupBuyStats\(\); \}, 5 \* 60_000\)/);
});

test("launch participant invites are non-custodial, durable, idempotent, and responsive", () => {
  assert.match(serverSource, /launch-bundle-invites\.json/);
  assert.match(serverSource, /async function createLaunchBundleInvite/);
  assert.match(serverSource, /async function approveLaunchBundleInvite/);
  assert.match(serverSource, /walletsForOwner\(walletStore, participantUserId\)/);
  assert.match(serverSource, /async function reserveLaunchBundleInvites/);
  assert.match(serverSource, /async function fulfillLaunchBundleInvites/);
  assert.match(serverSource, /async function fulfillRhLaunchBundleInvites/);
  assert.match(serverSource, /runIdempotentMoneyOp\("launch-bundle-invite"/);
  assert.match(serverSource, /error\?\.tradeSubmissionAmbiguous/);
  assert.match(serverSource, /attempts < 3/);
  assert.match(serverSource, /!isRetryableSwapError\(error\)/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/bundle-invite"/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/bundle-invite\/approve"/);
  assert.match(serverSource, /pathname === "\/api\/web\/launch\/bundle-invites"/);
  assert.match(serverSource, /participantEntries = await fulfillLaunchBundleInvites/);
  const publicInvite = functionBody(serverSource, "publicLaunchBundleInvite");
  assert.match(publicInvite, /exitConfig/);
  assert.match(publicInvite, /stopLossPct/);
  assert.match(publicInvite, /takeProfitLadder: savedLadder/);
  assert.match(publicInvite, /notifyOnLaunch: Boolean\(invite\.notifyOnLaunch\)/);
  assert.match(publicInvite, /launchNotified: Boolean\(invite\.launchNotifiedAt\)/);
  assert.doesNotMatch(publicInvite, /walletPublicKey:/);
  const approveInvite = functionBody(serverSource, "approveLaunchBundleInvite");
  assert.match(approveInvite, /notifyOnLaunch: cleanLaunchBoolean\(body\.notifyOnLaunch\)/);
  const notifyInvite = functionBody(serverSource, "notifyLaunchBundleInviteParticipants");
  assert.match(notifyInvite, /row\.notifyOnLaunch === true/);
  assert.match(notifyInvite, /!row\.launchNotifiedAt/);
  assert.match(notifyInvite, /invite\.launchNotifiedAt = now/);
  assert.match(notifyInvite, /sendWebPushToUser\(invite\.participantUserId/);
  assert.match(notifyInvite, /url: `\/t\?ca=\$\{encodeURIComponent\(tokenMint\)\}`/);
  const fulfillInvites = functionBody(serverSource, "fulfillLaunchBundleInvites");
  assert.ok(
    fulfillInvites.indexOf("notifyLaunchBundleInviteParticipants") < fulfillInvites.indexOf("buyTokenForPlan"),
    "launch push should fire when the mint is confirmed, without waiting for the participant buy"
  );
  assert.match(serverSource, /function launchWaveEntrySlippageBps/);
  assert.match(fulfillInvites, /const launchWaveSize = store\.invites\.filter/);
  assert.match(fulfillInvites, /launchWaveEntrySlippageBps\(/);
  assert.match(fulfillInvites, /Number\(invite\.entry\?\.attempts \|\| 0\) \+ attempts - 1/);
  assert.match(fulfillInvites, /runWithConcurrency\(pending, Math\.min\(20, pending\.length\)/);
  assert.match(fulfillInvites, /buyTokenForPlan\(wallet, tokenMint, amountLamports, entrySlippageBps/);

  const slippageHelper = Function("requestedBps", "walletCount", "priorAttempts", functionBody(serverSource, "launchWaveEntrySlippageBps"));
  assert.equal(slippageHelper(1500, 1, 0), 3000);
  assert.equal(slippageHelper(1500, 12, 0), 4000);
  assert.equal(slippageHelper(1500, 12, 1), 4500);
  assert.equal(slippageHelper(1500, 12, 2), 5000);
  assert.equal(slippageHelper(1500, 50, 0), 5000);
  assert.equal(slippageHelper(9000, 1, 0), 5000);

  const postLaunchBuys = functionBody(serverSource, "firePostLaunchBuysServerSide");
  assert.match(postLaunchBuys, /entrySlippageBps = launchWaveEntrySlippageBps/);
  assert.match(postLaunchBuys, /slippage: entrySlippagePct/);

  const fulfillRhInvites = functionBody(serverSource, "fulfillRhLaunchBundleInvites");
  assert.match(fulfillRhInvites, /runWithConcurrency\(pending, Math\.min\(20, pending\.length\)/);
  assert.match(fulfillRhInvites, /runIdempotentMoneyOp\(\s*"launch-bundle-invite-rh"/);
  assert.match(fulfillRhInvites, /webRhTradeCore\(participantUserId/);
  assert.match(fulfillRhInvites, /payCurrency: "SOL"/);
  assert.match(fulfillRhInvites, /amountSol: Number\(invite\.amountSol\)/);
  assert.match(fulfillRhInvites, /error\?\.tradeSubmissionAmbiguous/);
  assert.match(fulfillRhInvites, /status: ambiguous \? "OUTCOME_UNKNOWN"/);
  assert.match(fulfillRhInvites, /webRhArmGuard\(participantUserId/);
  const rhLaunch = functionBody(serverSource, "webLaunchRhCoinCore");
  assert.match(rhLaunch, /participantEntriesPromise = participantInviteIds\.length/);
  assert.ok(rhLaunch.indexOf("participantEntriesPromise") < rhLaunch.indexOf("-rh-dev-buy"), "RH participant entries must start before waiting on the optional dev buy");
  assert.match(rhLaunch, /participantEntries = await participantEntriesPromise/);
  const retryInvites = functionBody(serverSource, "resumeLaunchBundleInviteEntries");
  assert.match(retryInvites, /chain === "robinhood"/);
  assert.match(retryInvites, /fulfillRhLaunchBundleInvites/);

  for (const file of ["gg.html", "index.html"]) {
    const html = fs.readFileSync(new URL(`../web/public/${file}`, import.meta.url), "utf8");
    assert.match(html, /focused invite flow is already phone-friendly/);
    assert.match(html, /External participant wallets/);
    assert.match(html, /Create secure invite/);
    assert.match(html, /Manual only — no automatic selling/);
    assert.match(html, /Approve launch entry/);
    assert.match(html, /id="lcJoinNotify"/);
    assert.match(html, /Notify me when the coin launches/);
    assert.match(html, /ensurePushSubscribed\(\)/);
    assert.match(html, /notifyOnLaunch:!!\(notify&&notify\.checked\)/);
    assert.match(html, /Push is ready\. Save the entry to get the launch alert\./);
    assert.match(html, /Your wallet stays yours/);
    assert.match(html, /data-lc-participant-pick/);
    assert.match(html, /participantInviteIds/);
    assert.match(html, /rhBody\.participantInviteIds=participantInviteIds/);
    assert.match(html, /function lcInviteSavedSummary/);
    assert.match(html, /Saved now/);
    assert.match(html, /const cfg=invite\.exitConfig/);
    assert.match(html, /short\(w\.publicKey\)===invite\.walletShort/);
    assert.match(html, /id="lcRouteProceeds"/);
    assert.doesNotMatch(html, /id="lcRouteProceeds"[^>]*checked/);
    assert.match(html, /Pass confirmed sale proceeds to the next wallet/);
    assert.match(html, /It does not create a rebuy or repeat back to the first wallet/);
    assert.match(html, /proceedsRouting=lcReadProceedsRouting\(devIdx\)/);
  }
  const routing = functionBody(serverSource, "routeConfirmedExitProceeds");
  assert.match(routing, /sourceIndex >= order\.length - 1/);
  assert.match(routing, /sourceSignature/);
  assert.match(routing, /status: "submitting"/);
  assert.match(routing, /SystemProgram\.transfer/);
  assert.doesNotMatch(routing, /buyTokenForPlan/);
  assert.match(serverSource, /proceedsRouting = await resolveWebProceedsRouting/);
});
