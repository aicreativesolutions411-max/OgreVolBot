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
