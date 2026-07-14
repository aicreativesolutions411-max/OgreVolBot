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

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const vanityMintSource = fs.readFileSync(new URL("../src/lib/vanityMint.js", import.meta.url), "utf8");
const noxaSource = fs.readFileSync(new URL("../src/lib/noxaLaunchpad.js", import.meta.url), "utf8");
const ggSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");

test("main website mirrors stay identical", () => {
  assert.equal(indexSource, ggSource, "index.html and gg.html drifted; shared site fixes must ship together");
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
  assert.match(functionBody(serverSource, "webStartVolumeBot"), /runIdempotentMoneyOp\("web-volume-start", userId/);
  assert.match(serverSource, /async function webStartVolumeBotCore\(/);
  // Dup-plan guard: never fund a 2nd bot for a coin already running.
  assert.match(functionBody(serverSource, "webStartVolumeBotCore"), /A volume bot is already running for this coin/);
  assert.match(functionBody(serverSource, "webDistributeToFreshWallets"), /runIdempotentMoneyOp\("web-distribute", userId/);
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
  assert.match(functionBody(serverSource, "webSweepSol"), /runWithConcurrency\(wallets,/);
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
  assert.match(functionBody(serverSource, "webLaunchRhCoin"), /runIdempotentMoneyOp\("web-rh-launch"/);
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

test("Robinhood Chain: cash ETH back out to SOL (reverse Relay bridge, idempotent, gas-reserved)", () => {
  // Server: auth-gated, idempotent cash-out endpoint that delivers to the wallet's OWN Solana address.
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/bridge-to-sol"/);
  assert.match(functionBody(serverSource, "webRhBridgeToSol"), /runIdempotentMoneyOp\("web-rh-bridge-sol"/);
  const out = functionBody(serverSource, "webRhBridgeToSolCore");
  assert.match(out, /rhBridgeEthToSol/);
  assert.match(out, /keypair\.publicKey\.toBase58\(\)/);        // recipient = the wallet's OWN SOL address
  // Lib: the reverse Relay route (RH 4663 -> Solana, native ETH -> native SOL) with a gas reserve left behind.
  const rhLib = fs.readFileSync(new URL("../src/lib/robinhoodChain.js", import.meta.url), "utf8");
  const bridge = functionBody(rhLib, "rhBridgeEthToSol");
  assert.match(bridge, /originChainId: RH_CHAIN_ID/);
  assert.match(bridge, /destinationChainId: RELAY_SOLANA_CHAIN_ID/);
  assert.match(bridge, /gasReserveEth/);                        // never drains the wallet's gas
  assert.match(bridge, /rhExecuteEvmSteps/);
  // Client: cash-out button + handler in both mirrors.
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhBridgeToSol/);
    assert.match(src, /\/api\/web\/rh\/bridge-to-sol/);
    assert.match(src, /Cash out ETH → SOL/);
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

test("RH trading fees: normal coins match Solana, token rewards are scoped, and platform fees sweep to SOL", () => {
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /partnerTradeFeePolicy\(partner\)/);
  assert.match(trade, /feePolicy\.totalBps/);
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
    assert.match(src, /token-mascots\/token-mascot-/);
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
  assert.match(functionBody(serverSource, "webRhVolumeStart"), /webRhTradeCore/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/volume\/stop"/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhGuardModal/);
    assert.match(src, /function rhBundleModal/);
    assert.match(src, /function rhVolumeModal/);
    assert.match(src, /🛠 Robinhood tools/);
    assert.match(src, /GG\.rhGuardModal/);
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
  assert.match(functionBody(serverSource, "rhGuardTick"), /rhAutoBundleTick/); // shares the interval
  // Age on Trending + chart (creation-time cache filled in background).
  assert.match(serverSource, /scheduleRhCreatedFill/);
  assert.match(functionBody(serverSource, "webRhPairs"), /rhCreatedCache/);
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function rhAutoBundleModal/);
    assert.match(functionBody(src, "renderLaunch"), /lcRhAutoBundle/);
    assert.match(functionBody(src, "renderLaunch"), /\/api\/web\/rh\/auto-bundle/);
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

test("RH wallet: plain ETH balance panel + activity trail (where did the money go)", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/activity"/);
  const act = functionBody(serverSource, "webRhActivity");
  assert.match(act, /web_rh_trade/);
  assert.match(act, /web_rh_guard_fired/);              // auto-sells surface here
  assert.match(act, /blockscout\.com\/tx\//);            // each row links its on-chain tx
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /Your Robinhood ETH \(spendable balance\)/);
    assert.match(src, /lands right back here/);           // explains where auto-sell proceeds go
    assert.match(src, /function loadRhActivity/);
    assert.match(src, /Auto-sold /);
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
  }
});

test("launch UI is Pump-simple: Pump + Robinhood only, three clean tabs, dormant tools stay off-page", () => {
  for (const src of [ggSource, indexSource]) {
    const render = functionBody(src, "renderLaunch");
    assert.match(render, /tb\("coin","Coin"\)\+tb\("social","Socials"\)\+tb\("dev","Dev &amp; Bundle"\)/);
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

test("launch dev + bundle presets support shared and per-wallet ladders end to end", () => {
  for (const src of [ggSource, indexSource]) {
    assert.match(src, /function lcReadExitStrategy\(pfx\)/);
    assert.match(src, /Smart ladder/);
    assert.match(src, /Fast ladder/);
    assert.match(src, /Custom ladder/);
    assert.match(src, /Same settings for every wallet/);
    assert.match(src, /Set each wallet/);
    assert.match(src, /data-lc-bundle-pick/);
    assert.match(src, /body\.devExitStrategy=lcReadExitStrategy\("lcDev"\)/);
    assert.match(src, /walletConfigs:configs/);
    assert.match(src, /takeProfitLadder/);
  }
  const plans = functionBody(serverSource, "pumpLaunchBundlePlans");
  assert.match(plans, /bundle\.walletConfigs/);
  assert.match(plans, /config\.amountSol \?\? bundle\.amountSol/);
  assert.match(plans, /pumpLaunchExitStrategy\(config, sharedExit\)/);
  const fallback = functionBody(serverSource, "firePostLaunchBuysServerSide");
  assert.match(fallback, /groupPumpLaunchPlans\(bundlePlans\)/);
  assert.match(fallback, /plan\.amountSol/);
  const atomic = functionBody(serverSource, "webLaunchPumpJitoBundle");
  assert.match(atomic, /amount: bundlePlan\.amountSol/);
  assert.match(atomic, /walletIndexes: group\.plans\.map/);
  assert.match(atomic, /overflowBundlePlans/);
  const standard = functionBody(serverSource, "webLaunchPumpPortalLocal");
  assert.match(standard, /firePostLaunchBuysServerSide/);
  assert.match(standard, /postLaunchBuys/);
});

test("Fun profile clearly exposes naming, creation, and login recovery", () => {
  const fun = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  assert.match(fun, /Choose your profile name and login/);
  assert.match(fun, /Create profile login/);
  assert.match(fun, /Already have a profile\? Log in/);
  assert.match(fun, /data-fun-account="create"/);
  assert.match(fun, /data-fun-account="login"/);
  assert.match(fun, /\/api\/web\/profile\/credentials/);
  assert.match(fun, /\/api\/web\/password-login/);
  assert.match(fun, /Could not reach SlimeWire/);
  assert.match(fun, /location\.origin/);
});

test("creator fee claims auto-run only after new Pump volume, and wallet choice follows Cash to Fun", () => {
  assert.match(serverSource, /function startCreatorFeeAutoClaimRunner\(\)/);
  const auto = functionBody(serverSource, "processCreatorFeeAutoClaims");
  assert.match(auto, /pumpCreatorFeeTradeDelta/);
  assert.match(auto, /creatorFeesAutoClaimPendingVolumeSol/);
  assert.match(auto, /CONFIG\.creatorFeesAutoClaimMinVolumeSol/);
  assert.match(auto, /webClaimCreatorFeesCore/);
  assert.match(auto, /claimedWallets/);
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

test("Robinhood buy cards keep complete market rows during intermittent scan gaps", () => {
  const merge = functionBody(serverSource, "mergeRhGroupBuyInfo");
  const buy = functionBody(serverSource, "postGroupBuyRh");
  assert.match(serverSource, /const rhGroupBuyLastGood = new Map\(\)/);
  assert.match(merge, /priceUsd[\s\S]*mc[\s\S]*liq[\s\S]*vol24/);
  assert.match(buy, /mergeRhGroupBuyInfo\(freshInfo, rhGroupBuyLastGood\.get/);
  assert.match(buy, /Price <b>\$\{priceUsd > 0 \? fmtPx\(priceUsd\) : "n\/a"\}/);
  assert.match(buy, /MC <b>\$\{info\?\.mc > 0 \? fmtUsd0\(info\.mc\) : "checking"\}/);
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
    assert.match(functionBody(src, "renderLaunch"), />Open trading</);
  }
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
  const rhPoll = functionBody(serverSource, "rhGroupBuyTick");
  const solPost = functionBody(serverSource, "postGroupBuy");
  const rhPost = functionBody(serverSource, "postGroupBuyRh");
  const queue = functionBody(serverSource, "drainGroupBuyAlertQueue");
  assert.match(solPoll, /trades\?limit=100/);
  assert.match(solPoll, /fresh\.reverse\(\)/);
  assert.doesNotMatch(solPoll, /posted >= 6|slice\(0, 6\)|mints\.slice\(0, 30\)/);
  assert.match(solPoll, /mints\.slice\(i, i \+ 30\)/);
  assert.doesNotMatch(rhPoll, /slice\(0, 6\)/);
  assert.match(solPost, /min > 0 && solAmount < min/);
  assert.match(rhPost, /min > 0 && ethAmount < min/);
  assert.match(solPost, /queueGroupBuyAlert/);
  assert.match(rhPost, /queueGroupBuyAlert/);
  assert.match(functionBody(serverSource, "groupBuyAlertRetryMs"), /retry after/);
  assert.match(queue, /sleep\(1_100\)/);
  assert.match(rhPost, /const funUrl = slimewireTokenLinks\(address\)\.site/);
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
  assert.match(serverSource, /RAID_DEFAULT_PRESET = \{[\s\S]*durationMin: 5/);
  assert.match(functionBody(serverSource, "raidConfig"), /Number\(saved\.durationMin\) === 120 \? 5/);
  assert.match(functionBody(serverSource, "setRaidConfig"), /version: 2/);
  // Callback asks via a POPUP (no chat message -> no flood), not a ladder.
  const cb = functionBody(serverSource, "handleRaidSetupCallback");
  assert.match(cb, /show_alert: true/);
  assert.match(cb, /raidInputPending\.set\(/);
  assert.match(cb, /setRaidConfig\(chatId/);
  assert.doesNotMatch(serverSource, /raidLadderNext/);   // ladder removed
  // The admin's typed number is deleted so it doesn't flood the chat.
  assert.match(functionBody(serverSource, "applyRaidTypedInput"), /deleteMessage.*message\.message_id/);
  // Duration is minutes now.
  assert.match(serverSource, /durationMin/);
  assert.match(functionBody(serverSource, "raidSetupCard"), /Duration: \$\{Number\(d\.durationMin\)/);
  const raidHandler = functionBody(serverSource, "handleTelegramRaidCommand");
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
  // Five minutes is a real hard stop independent of the slower X engagement refresh.
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
  assert.match(command, /group-settings-command:\$\{message\.message_id\}/); // one menu per Telegram update
  const cb = functionBody(serverSource, "handleGroupBotCallback");
  assert.match(cb, /gb:m:\(buy\|raid\|rose\|scan/);   // open a module sub-menu
  assert.match(cb, /gb:tog:/);                          // flip a rose/shield boolean
  assert.match(cb, /gb:in:/);                           // typed-input settings
  assert.match(cb, /gb:media:\(buy\|raid\)/);           // media hint
  assert.match(serverSource, /async function applyGbInput\(/);
  assert.match(serverSource, /if \(await applyGbInput\(message, userId\)/); // wired into the router
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
  assert.match(functionBody(serverSource, "handleMessage"), /That command is for SlimeWire admins/);
  assert.match(functionBody(serverSource, "handleMessage"), /platform totals stay private/);
  assert.match(functionBody(serverSource, "walletRecord"), /createdAt: new Date\(\)\.toISOString\(\)/);
  const snapshot = functionBody(serverSource, "platformGrowthSnapshot");
  for (const source of ["readWebAuthStore", "readWalletStore", "readTelegramGroups", "readLaunchOs", "readGrowthStats", "readTradeHistory"]) assert.match(snapshot, new RegExp(source));
  assert.match(serverSource, /function tradeUsageStats\(/);
  assert.match(serverSource, /function countTradedWallets\(/);
  const growth = functionBody(serverSource, "handlePlatformGrowthCommand");
  assert.match(growth, /SlimeWire Growth/);
  assert.match(growth, /traded wallets/);
  assert.match(growth, /completed buys\/sells/);
  assert.match(growth, /Trading users/);
  assert.match(growth, /bot groups/);
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
  assert.match(serverSource, /e\.raidMedia = media/);
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
  assert.doesNotMatch(verifyHtml, /signTransaction|sendTransaction/);
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
  assert.match(functionBody(serverSource, "dmSettingsMenu"), /CONFIG\.bundleFeeBps/);
  assert.match(functionBody(serverSource, "dmSettingsMenu"), /Trade fee/);
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
  assert.match(fb, /const feeLamports = calculateFeeLamports\(lamports\)/);
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
  assert.match(lb, /webLaunchPumpPortalLocal\(userId, body, basePayload\)/);
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
  assert.match(functionBody(serverSource, "postGroupBuy"), /slimewire\.org · chart, trade &amp; tools/);
  const rhBuy = functionBody(serverSource, "postGroupBuyRh");
  assert.match(rhBuy, /compactTradeCardKeyboard\(address, "b"\)/);
  assert.match(functionBody(serverSource, "sendRhScanCard"), /compactTradeCardKeyboard\(address, "s"\)/);
  assert.match(rhBuy, /slimewire\.org · chart, trade &amp; tools/);
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
  assert.match(look, /else await sendWalletScanCard\(chatId, rhAddr\)/);
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
  // targets = opted-in groups (feature toggle) + DM subscribers
  assert.match(functionBody(serverSource, "alphaRadarTargets"), /groupBotFeatureOn\(e, "alphaRadar"\)/);
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
  assert.match(fire, /buyTokenForPlan\(wallet, mint, amountLamports/);
  assert.match(fire, /runIdempotentMoneyOp\("community-snipe"/);   // idempotent per member+mint (no double-buy)
  assert.doesNotMatch(fire, /pool|sharedWallet|combined/i);        // NO pooling
  // fire-once: mark fired + disarm BEFORE executing
  assert.match(fire, /snipe\.fired = \{ mint, at: Date\.now\(\) \}; snipe\.armed = false;/);
});
test("community snipe is keyed on the creator wallet (unspoofable), armed index drops on fire", () => {
  const m = functionBody(serverSource, "maybeCommunitySnipe");
  assert.match(m, /entry\.event\.traderPublicKey/);                // the dev's launch wallet — follows the wallet
  assert.match(m, /communitySnipeArmed\.get\(String\(creator\)\)/);
  assert.match(m, /communitySnipeArmed\.delete\(String\(creator\)\)/); // fire once
  assert.match(serverSource, /try \{ maybeCommunitySnipe\(entry\); \} catch \{\}/); // wired into onCreation
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
test("/signals is one opt-in menu (Exit Radar + Alpha Radar toggles)", () => {
  const menu = functionBody(serverSource, "signalsMenu");
  assert.match(menu, /callback_data: "sig:exit"/);
  assert.match(menu, /callback_data: "sig:alpha"/);
  assert.match(menu, /callback_data: "sig:galpha"/);        // group alpha toggle (admin)
  assert.match(serverSource, /parseCommandWithArgument\(text, \["signals", "alerts", "radar"\]\)/);
  assert.match(serverSource, /startsWith\("sig:"\)/);
  // group toggle is admin-gated
  assert.match(functionBody(serverSource, "handleSignalsCallback"), /isTgChatAdmin\(chatId, userId\)/);
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

// ---- Menu reorg: 🎯 Trench super-module in the Rose-style settings menu + Narrative/Graduation ----
test("Trench super-menu folds all trench features into the existing organized settings menu", () => {
  assert.match(functionBody(serverSource, "groupBotMenuMarkup"), /callback_data: "gb:m:trench"/);
  assert.match(functionBody(serverSource, "groupBotModuleView"), /if \(module === "trench"\) return trenchMenuView\(\)/);
  const trench = functionBody(serverSource, "trenchMenuView");
  for (const cb of ["gb:go:snipe", "gb:go:room", "gb:go:signals", "gb:go:lb", "gb:go:narrative", "gb:go:grad"]) assert.ok(trench.includes(cb), `trench menu → ${cb}`);
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
  // Scan card menu reaches the community tools (per-coin) via the Room Tools + Narratives entries.
  const sm = functionBody(serverSource, "scanMenuKeyboard");
  assert.match(sm, /callback_data: "gb:m:trench"/);
  assert.match(sm, /callback_data: "gb:go:narrative"/);
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
  assert.match(inp, /void fireCommunitySnipe\(chatId, mint, "", ""\)/);   // fires on the pasted CA
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
  assert.match(functionBody(serverSource, "handleTelegramLookCommand"), /scanImageUrlFromScan\(scan\)/);
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
  assert.match(cashtag, /webSlimeShield/);                           // every returned ticker contract is safety-screened
  assert.match(cashtag, /scanRecommendationBlocked/);
  assert.match(cashtag, /const safe = screened/);
  assert.match(cashtag, /const mint = safe\[0\]\?\.mint \|\| null/); // fail closed if every candidate is dangerous/unchecked
  assert.match(cashtag, /tickerResolutionMetaCache\.set/);

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
  assert.match(look, /scan\.rug \|\| scan\.onchain/);              // valid on-chain-only reads still get a card

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
  const safety = functionBody(serverSource, "telegramRecommendationBlocked");
  const sharedSafety = functionBody(serverSource, "scanRecommendationBlocked");
  const pvpView = functionBody(serverSource, "pvpArenaView");
  const pvpCallback = functionBody(serverSource, "handlePvpCallback");
  assert.match(alphaRows, /"dexTrending"/);
  assert.match(alphaRows, /telegramSafetyScreenTrendingRows/);
  assert.match(safety, /scanRecommendationBlocked/);
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
  assert.match(rhSend, /editMessagePhotoBuffer/);                    // same card upgrades to the real PFP + full facts
  assert.match(rhSend, /if \(!\(cachedScan/);                        // raw 0x CAs get the progressive path too
  assert.match(rhSend, /mergeRhScanWithTickerCandidate/);             // ticker market facts survive a thin full refresh
  assert.match(rhSend, /quick RH photo failed/);                       // media failure falls straight through to a text card
  const rhPairTarget = functionBody(serverSource, "rhPairTargetToken");
  assert.match(rhPairTarget, /quote\.address/);                       // requested quote-side coins never inherit the base coin identity
  const rhGather = functionBody(serverSource, "gatherRhScanUncollapsed");
  assert.match(rhGather, /pairTarget\.isBase \? pair\?\.priceUsd : null/);
  assert.match(rhGather, /api\.geckoterminal\.com\/api\/v2\/networks\/robinhood\/tokens/); // independent market fallback prevents an all-n/a card when Dex/Blockscout blink
  assert.match(rhGather, /const noxaPromise/);                         // NOXA's slower exact factory read starts concurrently, not after the fast providers already timed out
  assert.match(rhGather, /Array\.isArray\(dsV1\)/);                   // direct Dex token route contributes market data, not only artwork
  assert.doesNotMatch(rhGather, /const \[dsV1,/);                    // do not shadow dsV1 and trigger a TDZ ReferenceError during identity enrichment
  assert.match(rhGather, /rhScanCacheTtl\(cached\.v\)/);              // transient empty results retry in seconds instead of poisoning scans for a minute
  assert.match(rhGather, /if \(rhScanHasMarketEvidence\(v\)\)/);      // never promote an all-zero transient response to last-good
  assert.match(rhGather, /rhImpliedPriceUsd/);                         // non-NOXA fresh pools get a direct implied-price read while indexes catch up
  assert.match(rhGather, /mc = priceUsd \* supply/);                  // implied price restores market cap from the real token supply
  assert.match(rhGather, /else \{\s*rhScanCache\.delete\(key\)/);     // an all-n/a miss cannot poison the next scan, even for five seconds
  assert.match(rhGather, /rhScanLastGood/);                           // intermittent providers cannot erase known-good facts
  assert.match(functionBody(serverSource, "gatherRhScan"), /rhScanInFlight/); // simultaneous scans share one provider job
  assert.match(rhSend, /!rhScanHasMarketEvidence\(mergedLoaded\)/);   // keep the progressive warning instead of presenting n/a as a completed scan
  assert.match(rhSend, /Object\.assign\(quickInfo, mergedLoaded\)/);  // partial Blockscout identity/holders replace the generic $RH placeholder
  assert.match(rhSend, /\[4_000, 8_000, 15_000, 30_000\]/);           // new pools auto-refresh the same Telegram card through index lag
  assert.match(rhSend, /rhScanCache\.delete/);                         // each bounded retry bypasses the short negative cache
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
  assert.doesNotMatch(functionBody(serverSource, "mergeRhTokenRows"), /lastActiveAt/); // activity time is not coin age
  const solLook = functionBody(serverSource, "handleTelegramLookCommand");
  assert.match(solLook, /TG_SCAN_FIRST_RESPONSE_MS/);
  assert.match(solLook, /deliverTelegramSolScan/);
  assert.match(solLook, /scanMarketStatsFromSources/);                // caller MC matches the card's selected market
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
  // 🐋 on-chain wallet-follow: convergence of kolscan top-30 WALLETS → X post (reuses the TG buy-detector)
  assert.match(serverSource, /const KOLSCAN_SEED_WALLETS = \[/);                                        // top-30 wallets seeded
  assert.match(functionBody(serverSource, "xDetectKolBuys"), /parseHeliusSwap/);                        // same swap parser as the wallet tracker
  assert.match(functionBody(serverSource, "xDetectKolBuys"), /firstPoll/);                              // baseline first poll — never post pre-existing history
  assert.match(functionBody(serverSource, "xKolTradeTick"), /rec\.wallets\.size >= need/);              // fire only on CONVERGENCE (≥N KOLs same coin)
  assert.match(functionBody(serverSource, "xKolTradeTick"), /!s\.coins\[mint\]/);                       // dedup vs everything already surfaced
  assert.match(functionBody(serverSource, "xPostKolConvergence"), /top kolscan KOLs are loading/);      // the smart-money post
  assert.match(serverSource, /setInterval\(\(\) => \{ void xKolTradeTick\(\); \}/);                     // scheduled
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
  assert.match(serverSource, /startsWith\("map:"\)/);
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
  assert.match(serverSource, /requestUrl\.searchParams\.get\("domain"\)/);
  assert.match(serverSource, /resolveSolDomainToAddress\(rawTarget\)/);
  assert.match(serverSource, /"fundmap", "funds", "flow"/);
  assert.match(functionBody(serverSource, "handleTelegramMapCommand"), /resolveSolDomainToAddress/);
  assert.match(functionBody(serverSource, "handleMapCallback"), /parts\[2\] === "funds"/);
  assert.match(functionBody(serverSource, "handleMapCallback"), /forceWallet: parts\[0\] === "mapw"/);
  assert.match(functionBody(serverSource, "mapTelegramDetailLines"), /Recent traded coins/);
  assert.match(functionBody(serverSource, "mapTelegramDetailLines"), /Top current bags/);
  assert.match(functionBody(serverSource, "sendMapCard"), /mapTelegramDetailLines\(map\)/);
  assert.match(functionBody(serverSource, "sendAirdropSubjectCard"), /sendMapCard\(chatId, target, "funds"\)/);
  const walletCard = functionBody(serverSource, "sendWalletScanCard");
  assert.match(walletCard, /Fund Map/);
  assert.match(walletCard, /mapw:\$\{address\}:funds/);
  assert.match(walletCard, /Airdrops Sent/);
  assert.match(walletCard, /airdrop\?ca=\$\{encodeURIComponent\(address\)\}/);
  const walletScan = fs.readFileSync(new URL("../src/lib/walletScan.js", import.meta.url), "utf8");
  assert.match(walletScan, /bsAccountWithV2Fallback\(a, "tokenlist"\)/);
  assert.match(walletScan, /bsAccountWithV2Fallback\(a, "tokentx"\)/);
  assert.match(walletScan, /token-transfers/);
  assert.match(walletScan, /trades: tradeRows\.slice/);
  const mapHtml = fs.readFileSync(new URL("../web/public/map.html", import.meta.url), "utf8");
  assert.match(mapHtml, /\.sol domain, or Robinhood 0x/);
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
  const mapHtml = fs.readFileSync(new URL("../web/public/map.html", import.meta.url), "utf8");
  assert.match(mapHtml, /ensureStat/);
  assert.match(mapHtml, /HOLDERS/);
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
