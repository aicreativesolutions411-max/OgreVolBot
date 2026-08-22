import test from "node:test";
import assert from "node:assert/strict";
import {
  authoritativeManagedPlanCoversPosition,
  calculateMoveSnapshot,
  confirmedExitNeedsHistoryBackfill,
  hasActionableExitSettings,
  isDefinitiveNoLiveTokenBalanceError,
  ladderSellAmountRaw,
  pendingProtectedPositionAdd,
  preservePendingPositionAddPlanState,
  priceExitDecision,
  protectedLotAfterConfirmedBuy,
  protectedLotAfterConfirmedSell,
  protectedLotAmountFromBalance,
  protectedPositionAddDecision,
  protectedPositionAddRevisionMatches,
  recentStoredPriceExitDecision,
  safeEntryFrictionBaseline,
  sameWalletTokenBuyBlockDecision,
  shouldEmergencySellOnPriceFailure,
  staleSubmittingExit,
  stopLossTriggerPercent,
  verifiedSubmissionSignatureClear
} from "../src/lib/tradePlanExit.js";

test("protected lot recovery never absorbs a wallet's pre-existing bag", () => {
  assert.equal(protectedLotAmountFromBalance({
    storedLotRaw: "25",
    currentBalanceRaw: "150",
    preBuyBalanceRaw: "100"
  }), "25", "a confirmed provider/delta amount remains authoritative");

  assert.equal(protectedLotAmountFromBalance({
    currentBalanceRaw: "150",
    preBuyBalanceRaw: "100"
  }), "50", "only the post-buy increase belongs to this protected lot");

  assert.equal(protectedLotAmountFromBalance({
    currentBalanceRaw: "100",
    preBuyBalanceRaw: "100"
  }), null, "an indexed balance with no increase must not become the whole bag");

  assert.equal(protectedLotAmountFromBalance({
    currentBalanceRaw: "80",
    preBuyBalanceRaw: "100"
  }), null, "a lower current balance must fail closed instead of selling old holdings");

  assert.equal(protectedLotAmountFromBalance({
    storedLotRaw: "50",
    currentBalanceRaw: "100",
    preBuyBalanceRaw: "100"
  }), null, "an external/manual sale cannot make the stop consume the old bag");

  assert.equal(protectedLotAmountFromBalance({
    storedLotRaw: "50",
    currentBalanceRaw: "130",
    preBuyBalanceRaw: "100"
  }), "30", "a stored lot is clamped to the protected tokens still present");

  assert.equal(protectedLotAmountFromBalance({
    currentBalanceRaw: "100",
    hasPreBuyBaseline: false
  }), "100", "legacy plans without a baseline keep their historical recovery path");
});

test("confirmed partial exits reduce both protected tokens and remaining cost basis", () => {
  assert.deepEqual(protectedLotAfterConfirmedSell({
    protectedLotRaw: "50",
    basisLamports: "100000000",
    soldRaw: "20"
  }), {
    remainingRaw: "30",
    remainingBasisLamports: "60000000",
    soldRaw: "20"
  });

  assert.deepEqual(protectedLotAfterConfirmedSell({
    protectedLotRaw: "30",
    basisLamports: "60000000",
    soldRaw: "30"
  }), {
    remainingRaw: "0",
    remainingBasisLamports: "0",
    soldRaw: "30"
  });
});

test("confirmed top-up expands one protected lot and its remaining basis", () => {
  assert.deepEqual(protectedLotAfterConfirmedBuy({
    initialLotRaw: "100",
    protectedLotRaw: "100",
    basisLamports: "500000000",
    grossLamports: "502500000",
    feeLamports: "2500000",
    boughtRaw: "40",
    boughtBasisLamports: "200000000",
    boughtGrossLamports: "201000000",
    boughtFeeLamports: "1000000"
  }), {
    initialRaw: "140",
    remainingRaw: "140",
    basisLamports: "700000000",
    grossLamports: "703500000",
    feeLamports: "3500000",
    boughtRaw: "40"
  });

  assert.equal(protectedLotAfterConfirmedBuy({
    initialLotRaw: "100",
    protectedLotRaw: "100",
    basisLamports: "500000000",
    boughtRaw: "0",
    boughtBasisLamports: "200000000"
  }), null, "a missing confirmed token increase cannot expand protection");
});

test("position add eligibility accepts exactly one untouched same-user protected plan", () => {
  const holder = {
    publicKey: "wallet-a",
    status: "watching",
    exitStatus: "watching",
    triggerStatus: "armed",
    tokenOutAmount: "100",
    protectedTokenRemainingRaw: "100",
    basisLamports: "500000000",
    grossLamports: "502500000",
    feeLamports: "2500000",
    preBuyTokenRawAmount: "20",
    buySignature: "original-buy",
    walletStateRevision: 7,
    protectedLotRevision: 3,
    completedTakeProfitLevels: []
  };
  const plan = {
    id: "plan-a",
    userId: "user-a",
    tokenMint: "mint-a",
    status: "watching",
    protectionIntent: "armed",
    executionMode: "managed_server",
    loopCount: 1,
    wallets: [holder]
  };
  const guard = {
    planId: "plan-a",
    userId: "user-a",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    buySignature: "original-buy",
    status: "watching"
  };
  const result = protectedPositionAddDecision({
    userId: "user-a",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a"
  }, [plan], [guard], []);
  assert.equal(result.eligible, true);
  assert.equal(result.plan, plan);
  assert.equal(result.holder, holder);
  assert.equal(protectedPositionAddRevisionMatches(holder, 7, 3), true);
  assert.equal(protectedPositionAddRevisionMatches(holder, 6, 3), false, "a stale reviewed wallet revision fails closed");
  assert.equal(protectedPositionAddRevisionMatches(holder, 7, 2), false, "a stale protected-lot revision fails closed");
});

test("position add eligibility blocks partial, in-flight, duplicate, unlinked, and cross-user protection", () => {
  const holder = {
    publicKey: "wallet-a",
    status: "watching",
    exitStatus: "watching",
    triggerStatus: "armed",
    tokenOutAmount: "100",
    protectedTokenRemainingRaw: "100",
    basisLamports: "500000000",
    preBuyTokenRawAmount: "0",
    buySignature: "buy-a",
    completedTakeProfitLevels: []
  };
  const plan = {
    id: "plan-a",
    userId: "user-a",
    tokenMint: "mint-a",
    status: "watching",
    protectionIntent: "armed",
    executionMode: "managed_server",
    loopCount: 1,
    wallets: [holder]
  };
  const candidate = { userId: "user-a", walletPublicKey: "wallet-a", tokenMint: "mint-a" };
  assert.equal(protectedPositionAddDecision(candidate, [{ ...plan, wallets: [{ ...holder, completedTakeProfitLevels: [0] }] }]).reason, "partial_position");
  assert.equal(protectedPositionAddDecision(candidate, [{ ...plan, wallets: [{ ...holder, buySubmissionSignature: "signed" }] }]).reason, "position_inflight");
  assert.equal(protectedPositionAddDecision(candidate, [plan, { ...plan, id: "plan-b" }]).reason, "multiple_plans");
  assert.equal(protectedPositionAddDecision(candidate, [plan], [{
    userId: "user-a", walletPublicKey: "wallet-a", tokenMint: "mint-a", status: "watching"
  }]).reason, "unlinked_guard");
  assert.equal(protectedPositionAddDecision(candidate, [{ ...plan, userId: "user-b" }]).reason, "cross_user_protection");
  assert.equal(protectedPositionAddDecision(candidate, [{
    ...plan,
    sellAfterAt: "2026-08-22T12:01:00.000Z"
  }], [], [], {
    now: Date.parse("2026-08-22T12:00:00.000Z"),
    timerSafetyWindowMs: 120_000
  }).reason, "timer_due", "a position add cannot race a due timer exit");
  assert.equal(protectedPositionAddDecision(candidate, [plan], [], [{
    walletPublicKey: "wallet-a", tokenMint: "mint-a", status: "outcome_unknown"
  }]).reason, "exit_outcome_unknown");
});

test("a stale watching plan snapshot cannot erase a signed pending position add", () => {
  const pendingWallet = {
    publicKey: "wallet-a",
    status: "outcome_unknown",
    exitStatus: "outcome_unknown",
    triggerStatus: "outcome_unknown",
    buyReservationKind: "position_add",
    buyReservationClaimToken: "claim-a",
    buySubmissionSignature: "signed-add-a",
    lastError: "Signed add outcome is unknown.",
    updatedAt: "2026-08-22T12:02:00.000Z"
  };
  assert.equal(pendingProtectedPositionAdd(pendingWallet), true);
  const merged = preservePendingPositionAddPlanState({
    id: "plan-a",
    status: "pending_buy",
    protectionIntent: "pending_buy",
    wallets: [pendingWallet],
    updatedAt: "2026-08-22T12:02:00.000Z"
  }, {
    id: "plan-a",
    status: "watching",
    protectionIntent: "armed",
    wallets: [{ publicKey: "wallet-a", status: "watching" }],
    updatedAt: "2026-08-22T12:01:00.000Z"
  }, [pendingWallet]);

  assert.equal(merged.status, "pending_buy");
  assert.equal(merged.protectionIntent, "pending_buy");
  assert.equal(merged.wallets[0].buySubmissionSignature, "signed-add-a");
  assert.equal(merged.lastError, "Signed add outcome is unknown.");
});

test("an authoritative managed top-up plan excludes the full-balance portfolio watchdog", () => {
  const entry = { userId: "user-a", walletPublicKey: "wallet-a", tokenMint: "mint-a" };
  const topUpPlan = {
    id: "plan-a",
    userId: "user-a",
    tokenMint: "mint-a",
    executionMode: "managed_server",
    status: "watching",
    protectionIntent: "armed",
    wallets: [{
      publicKey: "wallet-a",
      status: "watching",
      exitStatus: "watching",
      tokenOutAmount: "200",
      protectedTokenRemainingRaw: "200",
      basisLamports: "150",
      positionAddSignatures: ["top-up-signature"]
    }]
  };

  assert.equal(authoritativeManagedPlanCoversPosition(entry, [topUpPlan]), true);
  assert.equal(authoritativeManagedPlanCoversPosition({ ...entry, walletPublicKey: "wallet-b" }, [topUpPlan]), false);
  assert.equal(authoritativeManagedPlanCoversPosition(entry, [{ ...topUpPlan, status: "completed" }]), false);
});

test("ladder rungs allocate the original protected lot and the final rung clears dust", () => {
  const first = ladderSellAmountRaw({
    initialLotRaw: "100",
    remainingLotRaw: "100",
    currentBalanceRaw: "150",
    sellPercent: 40
  });
  assert.equal(first, 40n);
  const second = ladderSellAmountRaw({
    initialLotRaw: "100",
    remainingLotRaw: "60",
    currentBalanceRaw: "110",
    sellPercent: 35
  });
  assert.equal(second, 35n);
  const final = ladderSellAmountRaw({
    initialLotRaw: "100",
    remainingLotRaw: "25",
    currentBalanceRaw: "75",
    sellPercent: 25,
    finalRung: true
  });
  assert.equal(final, 25n);
});

test("required protection needs at least one actionable server exit", () => {
  assert.equal(hasActionableExitSettings({ takeProfitPct: 25 }), true);
  assert.equal(hasActionableExitSettings({ stopLossPct: 8 }), true);
  assert.equal(hasActionableExitSettings({ sellDelaySeconds: 30 }), true);
  assert.equal(hasActionableExitSettings({ trailingStopPct: 12 }), true);
  assert.equal(hasActionableExitSettings({ takeProfitLadder: [{ pct: 50, sellPercent: 25 }] }), true);
  assert.equal(hasActionableExitSettings({
    takeProfitPct: "0",
    stopLossPct: "0",
    sellDelaySeconds: 0,
    trailingStopPct: 0,
    takeProfitLadder: []
  }), false);
});

test("entry friction baseline never absorbs an already-breached first stop observation", () => {
  assert.equal(safeEntryFrictionBaseline({
    movePct: -30,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), 0);

  assert.equal(safeEntryFrictionBaseline({
    movePct: -6.5,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), 0);

  assert.equal(safeEntryFrictionBaseline({
    movePct: -3,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), 0);

  assert.equal(safeEntryFrictionBaseline({
    movePct: -6.49,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), 0, "a first quote just above the trigger cannot move the stop deeper");
});

test("entry friction baseline stays bounded and can never become a take-profit credit", () => {
  assert.equal(safeEntryFrictionBaseline({ movePct: -80 }), -45);
  assert.equal(safeEntryFrictionBaseline({ movePct: 12 }), 0);
  assert.equal(safeEntryFrictionBaseline({ movePct: "not-a-number" }), null);
});

test("pool routing failures are not proof of an empty token balance", () => {
  assert.equal(isDefinitiveNoLiveTokenBalanceError(new Error("PumpPortal: pool not found | Jupiter: request timed out")), false);
  assert.equal(isDefinitiveNoLiveTokenBalanceError(new Error("pool account not found")), false);
  assert.equal(isDefinitiveNoLiveTokenBalanceError(new Error("no live token balance")), false);
  assert.equal(isDefinitiveNoLiveTokenBalanceError(new Error("PumpPortal: no token balance | Jupiter: timed out")), false);
  assert.equal(isDefinitiveNoLiveTokenBalanceError(new Error("sell amount rounded to zero")), false);
  assert.equal(isDefinitiveNoLiveTokenBalanceError({
    code: "NO_LIVE_TOKEN_BALANCE",
    tokenBalanceConfirmedZero: true,
    message: "provider wording changed"
  }), true);
  assert.equal(isDefinitiveNoLiveTokenBalanceError({ code: "TOKEN_BALANCE_DUST" }), true);
});

test("same wallet and token buy is blocked while any prior managed exit is active or unresolved", () => {
  const candidate = { userId: "7", walletPublicKey: "wallet-a", tokenMint: "mint-a" };
  const triggered = sameWalletTokenBuyBlockDecision(candidate, [{
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    status: "retrying",
    triggerKind: "stop-loss"
  }]);
  assert.equal(triggered.blocked, true);
  assert.equal(triggered.reason, "stop_loss_triggered");

  const unknown = sameWalletTokenBuyBlockDecision(candidate, [{
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    exitStatus: "outcome_unknown"
  }]);
  assert.equal(unknown.blocked, true);
  assert.equal(unknown.reason, "exit_outcome_unknown");

  const submitting = sameWalletTokenBuyBlockDecision(candidate, [{
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    status: "watching",
    preSellCheckpointAt: "2026-08-21T12:00:00.000Z"
  }]);
  assert.equal(submitting.blocked, true);
  assert.equal(submitting.reason, "exit_submitting");

  const watching = sameWalletTokenBuyBlockDecision(candidate, [{
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    status: "watching",
    triggerKind: "take-profit"
  }]);
  assert.equal(watching.blocked, true);
  assert.equal(watching.reason, "exit_active");

  const pending = sameWalletTokenBuyBlockDecision(candidate, [{
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    status: "pending_buy"
  }]);
  assert.equal(pending.blocked, true);
  assert.equal(pending.reason, "protection_pending");
});

test("recently closed stop blocks re-entry only for the configured cooldown", () => {
  const now = Date.parse("2026-08-21T12:00:30.000Z");
  const candidate = { walletPublicKey: "wallet-a", tokenMint: "mint-a" };
  const exit = {
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    status: "sold",
    triggerReason: "stop-loss -12.0%",
    soldAt: "2026-08-21T12:00:00.000Z"
  };

  const coolingDown = sameWalletTokenBuyBlockDecision(candidate, [exit], {
    now,
    stopClosedCooldownMs: 60_000
  });
  assert.equal(coolingDown.blocked, true);
  assert.equal(coolingDown.reason, "stop_loss_closed_cooldown");
  assert.equal(coolingDown.retryAfterMs, 30_000);

  assert.equal(sameWalletTokenBuyBlockDecision(candidate, [exit], {
    now,
    stopClosedCooldownMs: 30_000
  }).blocked, false);

  assert.equal(sameWalletTokenBuyBlockDecision(candidate, [{
    ...exit,
    soldAt: "2026-08-21T12:00:31.000Z"
  }], {
    now,
    stopClosedCooldownMs: 60_000
  }).blocked, true, "minor cross-service clock skew must fail closed");
});

test("buy block decision is scoped to exact wallet and token", () => {
  const riskyExit = {
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a",
    status: "submitting",
    triggerKind: "stop-loss"
  };
  assert.equal(sameWalletTokenBuyBlockDecision({
    userId: "7",
    walletPublicKey: "wallet-b",
    tokenMint: "mint-a"
  }, [riskyExit]).blocked, false);
  assert.equal(sameWalletTokenBuyBlockDecision({
    userId: "7",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-b"
  }, [riskyExit]).blocked, false);
  assert.equal(sameWalletTokenBuyBlockDecision({
    userId: "a-different-account",
    walletPublicKey: "wallet-a",
    tokenMint: "mint-a"
  }, [riskyExit]).blocked, true, "the on-chain wallet and mint remain the money identity across imported accounts");
});

test("a persisted signed exit can only clear after exact failed or expired reconciliation", () => {
  const current = { submissionClaimToken: "claim-a", submissionSignature: "sig-a" };
  assert.equal(verifiedSubmissionSignatureClear(current, {
    submissionClaimToken: "claim-a",
    submissionSignature: null,
    status: "retrying"
  }), false, "an unsigned stale snapshot cannot erase a signed checkpoint");
  assert.equal(verifiedSubmissionSignatureClear(current, {
    submissionSignature: null,
    resolvedSubmissionClaimToken: "claim-a",
    resolvedSubmissionSignature: "sig-a",
    submissionResolution: "failed",
    submissionFailedAt: "2026-08-21T12:00:00.000Z"
  }), true);
  assert.equal(verifiedSubmissionSignatureClear(current, {
    submissionSignature: null,
    resolvedSubmissionClaimToken: "claim-a",
    resolvedSubmissionSignature: "sig-a",
    submissionResolution: "confirmed",
    submissionConfirmedAt: "2026-08-21T12:00:00.000Z"
  }), true, "a confirmed tranche can clear its old checkpoint before the next claim");
  assert.equal(verifiedSubmissionSignatureClear(current, {
    submissionSignature: null,
    resolvedSubmissionClaimToken: "claim-b",
    resolvedSubmissionSignature: "sig-a",
    submissionResolution: "expired",
    submissionExpiredAt: "2026-08-21T12:00:00.000Z"
  }), false, "the wrong claim cannot clear a signed checkpoint");
});

test("confirmed exit receipt requests one idempotent history backfill", () => {
  const receipt = {
    status: "sold",
    exitStatus: "confirmed",
    sellSignature: "sell-sig",
    tokenMint: "mint-a",
    walletPublicKey: "wallet-a"
  };
  assert.equal(confirmedExitNeedsHistoryBackfill(receipt), true);
  assert.equal(confirmedExitNeedsHistoryBackfill({ ...receipt, historyRecordedAt: "2026-08-21T12:00:00.000Z" }), false);
  assert.equal(confirmedExitNeedsHistoryBackfill(receipt, []), true);
  assert.equal(confirmedExitNeedsHistoryBackfill(receipt, [{
    type: "sell",
    signature: "sell-sig",
    tokenMint: "mint-a",
    walletPublicKey: "wallet-a",
    solLamportsReceived: "0"
  }]), true, "a signature-only zero row must remain eligible for exact proceeds repair");
  assert.equal(confirmedExitNeedsHistoryBackfill(receipt, [{
    type: "sell",
    signature: "sell-sig",
    tokenMint: "mint-a",
    walletPublicKey: "wallet-a",
    solLamportsReceived: "975"
  }]), false);
});

test("history backfill requires a confirmed sell and an exact receipt identity", () => {
  assert.equal(confirmedExitNeedsHistoryBackfill({
    status: "outcome_unknown",
    sellSignature: "sell-sig"
  }, []), false);
  assert.equal(confirmedExitNeedsHistoryBackfill({
    status: "sold"
  }, []), false);

  const receipt = {
    status: "sold",
    sellSignature: "sell-sig",
    tokenMint: "mint-a",
    walletPublicKey: "wallet-a"
  };
  assert.equal(confirmedExitNeedsHistoryBackfill(receipt, [{
    type: "sell",
    signature: "sell-sig",
    tokenMint: "mint-b",
    walletPublicKey: "wallet-a"
  }]), true);
  assert.equal(confirmedExitNeedsHistoryBackfill(receipt, [{
    type: "buy",
    signature: "sell-sig",
    tokenMint: "mint-a",
    walletPublicKey: "wallet-a"
  }]), true);
});

test("stop-loss trigger uses configured early buffer", () => {
  assert.equal(stopLossTriggerPercent(8, 1.5), 6.5);
  assert.equal(priceExitDecision({
    movePct: -6.49,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), null);
  assert.deepEqual(priceExitDecision({
    movePct: -6.5,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), {
    kind: "stop-loss",
    triggerPct: 6.5,
    targetPct: 8,
    sellPercent: 100
  });
});

test("take-profit triggers at configured gain", () => {
  assert.equal(priceExitDecision({
    movePct: 24.99,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), null);
  assert.deepEqual(priceExitDecision({
    movePct: 25,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), {
    kind: "take-profit",
    triggerPct: 25,
    targetPct: 25
  });
});

test("move snapshot keeps trigger move gross while reporting net fee move", () => {
  const snapshot = calculateMoveSnapshot({
    basis: 1000n,
    estimatedOut: 1250n,
    feeLamports: 50n
  });

  assert.equal(snapshot.grossMovePct, 25);
  assert.equal(snapshot.netMovePct, 20);
  assert.equal(snapshot.movePct, 25);
  assert.equal(snapshot.estimatedOut, 1250n);
  assert.equal(snapshot.estimatedNetOut, 1200n);
});

test("stop-loss buffer cannot make trigger zero", () => {
  assert.equal(stopLossTriggerPercent(1, 10), 0.1);
  assert.equal(priceExitDecision({
    movePct: -0.09,
    stopLossPct: 1,
    stopLossBufferPct: 10
  }), null);
  assert.deepEqual(priceExitDecision({
    movePct: -0.1,
    stopLossPct: 1,
    stopLossBufferPct: 10
  }), {
    kind: "stop-loss",
    triggerPct: 0.1,
    targetPct: 1,
    sellPercent: 100
  });
});

test("stop-loss emergency sell arms after repeated price estimate failures", () => {
  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 8,
    estimateFailures: 1,
    minFailures: 2
  }), false);

  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 8,
    estimateFailures: 2,
    minFailures: 2
  }), true);
});

test("price estimate failure emergency does not trigger without stop-loss", () => {
  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 0,
    estimateFailures: 10,
    minFailures: 2
  }), false);

  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 8,
    estimateFailures: 0,
    minFailures: 2
  }), false);
});

test("recent stored price breach can rescue a failed fresh quote", () => {
  const now = Date.parse("2026-06-04T12:00:00.000Z");
  assert.deepEqual(recentStoredPriceExitDecision({
    movePct: -50,
    lastCheckedAt: "2026-06-04T11:59:58.000Z",
    now,
    maxAgeMs: 300000,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), {
    kind: "stop-loss",
    triggerPct: 6.5,
    targetPct: 8,
    sellPercent: 100
  });

  assert.deepEqual(recentStoredPriceExitDecision({
    movePct: 50,
    lastCheckedAt: "2026-06-04T11:59:58.000Z",
    now,
    maxAgeMs: 300000,
    takeProfitPct: 25
  }), {
    kind: "take-profit",
    triggerPct: 25,
    targetPct: 25
  });
});

test("stale stored price breach is ignored", () => {
  assert.equal(recentStoredPriceExitDecision({
    movePct: -50,
    lastCheckedAt: "2026-06-04T11:00:00.000Z",
    now: Date.parse("2026-06-04T12:00:00.000Z"),
    maxAgeMs: 300000,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), null);
});

test("stale submitting price exits are eligible for retry", () => {
  const now = Date.parse("2026-06-04T12:00:00.000Z");
  assert.equal(staleSubmittingExit({
    status: "submitting",
    triggerReason: "stop-loss -8.25% (armed 8%)",
    lastSellAttemptAt: "2026-06-04T11:59:40.000Z",
    now,
    staleMs: 15000
  }), true);

  assert.equal(staleSubmittingExit({
    status: "submitting",
    triggerReason: "take-profit +25.00%",
    lastSellAttemptAt: "2026-06-04T11:59:58.000Z",
    now,
    staleMs: 15000
  }), false);

  assert.equal(staleSubmittingExit({
    status: "submitting",
    triggerReason: "timer",
    lastSellAttemptAt: "2026-06-04T11:59:00.000Z",
    now,
    staleMs: 15000
  }), false);
});
