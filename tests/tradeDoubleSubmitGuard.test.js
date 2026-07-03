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
const ggSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");

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

test("Robinhood coins are tradeable in-app (Relay swap, gas-estimated, idempotent) + funded from Swap", () => {
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
    assert.match(src, /Get Robinhood Chain ETH/);            // Swap page section
    assert.match(src, /rhWalSel/);                           // per-wallet ETH accounts in the fold
    // Confident launch copy — no "first"/"no launchpad exists" framing.
    assert.doesNotMatch(src, /no launchpad exists (on it|here)/i);
    assert.doesNotMatch(src, /one of the first devs|You'd be one of the first/i);
  }
});

test("RH trading fees: same bps as Solana, skimmed in ETH, auto-converted to SOL at FEE_WALLET", () => {
  const trade = functionBody(serverSource, "webRhTradeCore");
  assert.match(trade, /CONFIG\.bundleFeeBps/);               // SAME fee rate as Solana trades
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
    // Letter-tile avatar fallback: no RH coin ever renders without a "pfp".
    assert.match(src, /function rhAvTileHtml/);
    assert.match(src, /rhAvatar\(r,30\)/);
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
    assert.match(src, /Auto-bundle when it gets a pool/);
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
    // Robinhood dev/bundle tab is ETH-aware (no SOL fields under the Robinhood rail).
    assert.match(src, /lcDevRhNote/);
  }
  // "Make it buyable" — create + seed a Uniswap V3 pool so a launched coin can be bought. Gas-estimated
  // first (a bad setup reverts in simulation, costs nothing).
  assert.match(rhLib, /export async function rhCreatePoolAndSeed/);
  assert.match(functionBody(rhLib, "rhCreatePoolAndSeed"), /createAndInitializePoolIfNecessary/);
  assert.match(functionBody(rhLib, "rhCreatePoolAndSeed"), /estimateGas/);
  assert.match(serverSource, /pathname === "\/api\/web\/rh\/create-pool"/);
  assert.match(serverSource, /rhCreatePoolAndSeed/);
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

test("RH creator fee: pump-style venue-side, opt-in, paid to creator, NOT baked into the token", () => {
  // Launch stores the opt-in + recipient (the deployer wallet); it is NOT put in the token contract.
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
    assert.match(src, /lcRhCreatorFee/);
    assert.match(src, /Earn creator fees/);
    assert.match(src, /creatorFeeEnabled:/);
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
  test(`presale escrow UI is wired to the gated escrow endpoints (${label})`, () => {
    assert.match(source, /onclick="GG\.escrowModal\(\)"/);          // entry point on the Launch page
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
  assert.match(serverSource, /startsWith\("cap:"\)/);            // routed in the callback dispatcher
  // Welcome/goodbye fillings + duration parsing helpers exist.
  assert.match(serverSource, /function roseFill\(/);
  assert.match(functionBody(serverSource, "roseFill"), /mention/);        // {mention} filling (braces escaped in-source)
  assert.match(functionBody(serverSource, "roseFill"), /chatname\|title/); // {chatname}/{title} filling
  assert.match(serverSource, /function roseParseDuration\(/);
  const rose = functionBody(serverSource, "handleGroupRose");
  for (const cmd of ["captcha", "tmute", "tban", "antiflood", "setwarnlimit", "setwarnmode", "save", "filter", "report", "purge", "pin"]) {
    assert.ok(rose.includes(`"${cmd}"`) || rose.includes(`'${cmd}'`) || rose.includes(cmd), `Rose must handle /${cmd}`);
  }
  // Full mute perm set (not just can_send_messages) so newer Bot API actually mutes.
  assert.match(serverSource, /ROSE_MUTE_PERMS\s*=\s*\{[^}]*can_send_polls:\s*false/);
});

test("Buy bot (SpyDefi parity): whale-tier badge + new-holder flag + volume", () => {
  const buy = functionBody(serverSource, "postGroupBuy");
  assert.match(buy, /MEGA BUY|WHALE|DOLPHIN|FISH|SHRIMP/);        // whale tiers by USD size
  assert.match(buy, /New holder!/);                              // first-seen buyer flag
  assert.match(buy, /groupBuyHolders/);                          // per-token seen-buyer set
  assert.match(buy, /Vol \$\{?|· Vol /);                         // volume shown on the MC line
  // Bonded coins show "✅ Bonded" — detection uses pump metadata's own graduated
  // flag (+bondPct>=100), not just meta.graduated (false for PumpSwap graduations).
  assert.match(buy, /✅ <b>Bonded<\/b>/);
  assert.match(buy, /bonding\?\.graduated \|\| bonding\?\.isGraduated \|\| \(bondPct != null && bondPct >= 100\)/);
});

test("Raid bot: clean card (no colour squares / bars) + goal-to-go + views + Refresh", () => {
  const card = functionBody(serverSource, "buildRaidProgressCard");
  assert.match(card, /to go/);                                  // "X to go" per metric
  assert.doesNotMatch(card, /raidBar\(/);                       // progress bar removed
  assert.doesNotMatch(card, /🟩|🟨|🟥/);                        // colour squares removed
  assert.match(card, /views/);                                  // 👀 views line
  assert.match(card, /callback_data:\s*"rr:"/);                // Refresh button
  assert.match(serverSource, /async function handleRaidRefreshCallback\(/);
  assert.match(serverSource, /startsWith\("rr:"\)/);            // routed in the dispatcher
});

// ---- TG bot polish: buy links, no aggregate card, strict scan, raid typed input ----
test("buy card Chart/Buy open the NEW terminal (not old chart-lab / /t)", () => {
  // groupBuyMarkup is an arrow const, so slice its region directly.
  const i = serverSource.indexOf("const groupBuyMarkup =");
  assert.notEqual(i, -1, "groupBuyMarkup missing");
  const mk = serverSource.slice(i, i + 600);
  assert.match(mk, /slimewireTokenLinks\(mint\)/);
  assert.match(mk, /url: links\.site\b/);       // Chart -> new terminal
  assert.match(mk, /url: links\.siteBuy\b/);    // Buy   -> new terminal (buy view)
  assert.doesNotMatch(mk, /chart-lab\?ca=/);    // old chart-page URL gone
  assert.doesNotMatch(mk, /url: groupBuyQuickBuyUrl/); // old /t redirect gone
});

test("buy bot posts only real per-buy cards — no 'Buys rolling in' aggregate", () => {
  const body = functionBody(serverSource, "postGroupBuy");
  assert.match(body, /if \(!perBuy\) \{ groupBuyLastAlertAt\.set/); // early-return skips aggregate
  assert.doesNotMatch(serverSource, /Buys rolling in/);            // the card text is gone entirely
});

test("scan only fires on a real mint (32-byte decode) — no sentence false-positives", () => {
  assert.match(serverSource, /function isLikelySolMint\(/);
  assert.match(functionBody(serverSource, "isLikelySolMint"), /toBytes\(\)\.length === 32/);
  assert.match(serverSource, /isLikelySolMint\(caTok\)/);   // group trigger
  assert.match(serverSource, /isLikelySolMint\(caTokDm\)/); // DM trigger
  // The old space-stripping exec (which concatenated a sentence into a fake CA) is gone.
  assert.ok(!serverSource.includes('.exec(text.replace(/\\s+/g, ""))'), "space-strip CA match must be removed");
});

test("raid setup: click a metric -> type the number; duration in minutes", () => {
  assert.match(serverSource, /async function applyRaidTypedInput\(/);
  assert.match(serverSource, /const raidInputPending = new Map\(\)/);
  // Callback asks via a POPUP (no chat message -> no flood), not a ladder.
  const cb = functionBody(serverSource, "handleRaidSetupCallback");
  assert.match(cb, /show_alert: true/);
  assert.match(cb, /raidInputPending\.set\(/);
  assert.doesNotMatch(serverSource, /raidLadderNext/);   // ladder removed
  // The admin's typed number is deleted so it doesn't flood the chat.
  assert.match(functionBody(serverSource, "applyRaidTypedInput"), /deleteMessage.*message\.message_id/);
  // Duration is minutes now.
  assert.match(serverSource, /durationMin/);
  assert.match(functionBody(serverSource, "raidSetupCard"), /Duration: \$\{Number\(d\.durationMin\)/);
});

// ---- Settings hub (multi-level menu) + Shield (in Rose) + separate raid media ----
test("settings menu is multi-level: home -> per-bot sub-menus, clickable toggles + typed inputs", () => {
  assert.match(serverSource, /function groupBotModuleView\(/);
  assert.match(serverSource, /async function groupBotRenderModule\(/);
  const cb = functionBody(serverSource, "handleGroupBotCallback");
  assert.match(cb, /gb:m:\(buy\|raid\|rose\|scan/);   // open a module sub-menu
  assert.match(cb, /gb:tog:/);                          // flip a rose/shield boolean
  assert.match(cb, /gb:in:/);                           // typed-input settings
  assert.match(cb, /gb:media:\(buy\|raid\)/);           // media hint
  assert.match(serverSource, /async function applyGbInput\(/);
  assert.match(serverSource, /if \(await applyGbInput\(message, userId\)/); // wired into the router
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

// ---- Maestro-style POS buy card: in-group amount buttons → preloaded 1-click buy ----
test("scan card is a point-of-sale: instant-buy amount buttons deep-link with &amount=", () => {
  assert.match(serverSource, /function slimewireBuyUrl\(/);
  assert.match(functionBody(serverSource, "slimewireBuyUrl"), /buy=1/);
  assert.match(functionBody(serverSource, "slimewireBuyUrl"), /&amount=/);
  const kb = functionBody(serverSource, "slimeScanKeyboard");
  assert.match(kb, /slimewireBuyUrl\(mint, 0\.5\)/);
  assert.match(kb, /slimewireBuyUrl\(mint, 1\)/);
  assert.match(kb, /slimewireBuyUrl\(mint, 5\)/);
  assert.match(kb, /⚡ Buy 1/);
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

// ---- /leaderboard: top-10 best CALLERS with today/1w/1m/6m window buttons ----
test("/leaderboard ranks callers by window; /wins keeps the coin hall of fame", () => {
  // command split: leaderboard/callers -> caller board; halloffame/hof/wins -> coin wins
  assert.match(serverSource, /parseCommandWithArgument\(text, \["leaderboard", "lb", "callers", "topcallers"\]\)/);
  assert.match(serverSource, /handleTelegramCallerLeaderboardCommand\(chatId\)/);
  assert.match(serverSource, /parseCommandWithArgument\(text, \["halloffame", "hof", "wins"\]\)/);
  // four windows, driven off the caller-intel warehouse filtered by firstAt
  const view = functionBody(serverSource, "buildCallerLeaderboardView");
  assert.match(view, /callerIntel\.buildLeaderboards\(scoped, \{ minResolved/);
  assert.match(view, /Number\(c\.firstAt\) >= cutoff/);
  for (const k of ["today", "1w", "1m", "6m"]) assert.ok(serverSource.includes(`key: "${k}"`), `window ${k}`);
  // window buttons routed in the callback dispatcher, editing in place
  assert.match(serverSource, /query\.data\?\.startsWith\("clb:"\)/);
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
