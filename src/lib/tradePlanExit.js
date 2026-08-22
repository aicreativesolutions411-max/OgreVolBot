export function calculateMovePercent({ estimatedOut, basis }) {
  const out = Number(estimatedOut || 0);
  const cost = Number(basis || 0);
  if (!Number.isFinite(out) || !Number.isFinite(cost) || cost <= 0) {
    throw new Error("estimated output and basis must be positive numbers");
  }
  return ((out - cost) / cost) * 100;
}

export function calculateMoveSnapshot({ estimatedOut, basis, feeLamports = 0 }) {
  const grossMovePct = calculateMovePercent({ estimatedOut, basis });
  const out = BigInt(estimatedOut || 0);
  const fee = BigInt(feeLamports || 0);
  const netOut = out > fee ? out - fee : 0n;
  const netMovePct = calculateMovePercent({ estimatedOut: netOut, basis });
  return {
    estimatedOut: out,
    estimatedNetOut: netOut,
    basis: BigInt(basis || 0),
    feeLamports: fee,
    grossMovePct,
    netMovePct,
    movePct: grossMovePct
  };
}

export function stopLossTriggerPercent(stopLossPct, bufferPct = 0) {
  const stop = Number(stopLossPct || 0);
  if (!Number.isFinite(stop) || stop <= 0) return 0;
  const buffer = Number(bufferPct || 0);
  const safeBuffer = Number.isFinite(buffer) ? Math.max(0, buffer) : 0;
  return Math.max(0.1, stop - safeBuffer);
}

export function safeEntryFrictionBaseline({
  movePct,
  stopLossPct = 0,
  stopLossBufferPct = 0,
  maxFrictionPct = 45
} = {}) {
  const move = Number(movePct);
  if (!Number.isFinite(move)) return null;

  // A stop-loss is defined against the user's entry, not against whatever
  // price the worker happens to observe first. Even a reading just above the
  // trigger must not become a new zero and move the real stop deeper.
  if (Number(stopLossPct) > 0) return 0;

  // The first monitor observation is not necessarily an entry-time quote. A
  // fast dump can happen before the worker's first pass, so never normalize an
  // already-breached stop back to 0% as if it were ordinary entry friction.
  const stopTrigger = stopLossTriggerPercent(stopLossPct, stopLossBufferPct);
  if (stopTrigger > 0 && move <= -stopTrigger) return 0;

  const configuredMax = Number(maxFrictionPct);
  const safeMax = Number.isFinite(configuredMax) && configuredMax > 0
    ? configuredMax
    : 45;
  return Math.max(-safeMax, Math.min(0, move));
}

export function isDefinitiveNoLiveTokenBalanceError(error) {
  if (error?.tokenBalanceConfirmedZero === true
    || error?.code === "NO_LIVE_TOKEN_BALANCE"
    || error?.code === "TOKEN_BALANCE_DUST") {
    return true;
  }
  // Provider text is not ownership proof. Pump/Jupiter errors regularly
  // contain phrases such as "no token balance" or "pool not found" while the
  // wallet still owns the bag, so only structured, provenance-bearing errors
  // may close a stop as empty.
  return false;
}

export function hasActionableExitSettings({
  takeProfitPct = 0,
  stopLossPct = 0,
  sellDelaySeconds = 0,
  takeProfitLadder = [],
  trailingStopPct = 0
} = {}) {
  const positive = (value) => Number.isFinite(Number(value)) && Number(value) > 0;
  return positive(takeProfitPct)
    || positive(stopLossPct)
    || positive(sellDelaySeconds)
    || positive(trailingStopPct)
    || (Array.isArray(takeProfitLadder) && takeProfitLadder.some((row) => (
      positive(row && typeof row === "object" ? (row.pct ?? row.takeProfitPct) : row)
    )));
}

export function verifiedSubmissionSignatureClear(current = {}, incoming = {}) {
  const currentSignature = String(current.submissionSignature || "").trim();
  if (!currentSignature || String(incoming.submissionSignature || "").trim()) return false;
  if (String(incoming.resolvedSubmissionSignature || "").trim() !== currentSignature) return false;
  const currentClaim = String(current.submissionClaimToken || "").trim();
  const resolvedClaim = String(incoming.resolvedSubmissionClaimToken || "").trim();
  if (currentClaim && resolvedClaim !== currentClaim) return false;
  const resolution = String(incoming.submissionResolution || "").trim().toLowerCase();
  if (resolution === "confirmed") return Boolean(incoming.submissionConfirmedAt);
  if (resolution === "failed") return Boolean(incoming.submissionFailedAt);
  if (resolution === "expired") return Boolean(incoming.submissionExpiredAt);
  return false;
}

export function verifiedBuySubmissionSignatureClear(current = {}, incoming = {}) {
  const currentSignature = String(current.buySubmissionSignature || "").trim();
  if (!currentSignature || String(incoming.buySubmissionSignature || "").trim()) return false;
  if (String(incoming.resolvedBuySubmissionSignature || "").trim() !== currentSignature) return false;
  const currentClaim = String(current.buyReservationClaimToken || "").trim();
  const resolvedClaim = String(incoming.resolvedBuyReservationClaimToken || "").trim();
  if (currentClaim && resolvedClaim !== currentClaim) return false;
  const resolution = String(incoming.buySubmissionResolution || "").trim().toLowerCase();
  if (resolution === "confirmed") return Boolean(incoming.buySubmissionConfirmedAt);
  if (resolution === "failed") return Boolean(incoming.buySubmissionFailedAt);
  if (resolution === "expired") return Boolean(incoming.buySubmissionExpiredAt);
  return false;
}

function nonNegativeRawAmount(value) {
  try {
    const amount = BigInt(value);
    return amount >= 0n ? amount : null;
  } catch {
    return null;
  }
}

export function protectedLotAmountFromBalance({
  storedLotRaw,
  currentBalanceRaw,
  preBuyBalanceRaw,
  hasPreBuyBaseline = preBuyBalanceRaw !== undefined && preBuyBalanceRaw !== null
} = {}) {
  const stored = nonNegativeRawAmount(storedLotRaw);
  const current = nonNegativeRawAmount(currentBalanceRaw);

  // Legacy plans did not record the wallet balance before the buy. Preserve
  // their old whole-balance recovery behavior, but never use that fallback for
  // a new protected buy that has an exact pre-buy checkpoint.
  if (!hasPreBuyBaseline) {
    if (stored !== null) return stored > 0n ? stored.toString() : null;
    return current !== null && current > 0n ? current.toString() : null;
  }

  const before = nonNegativeRawAmount(preBuyBalanceRaw);
  if (before === null || current === null) return null;
  const available = current - before;
  if (available <= 0n) return null;
  const protectedLot = stored !== null ? (stored < available ? stored : available) : available;
  return protectedLot > 0n ? protectedLot.toString() : null;
}

export function protectedLotAfterConfirmedSell({ protectedLotRaw, basisLamports, soldRaw } = {}) {
  const lot = nonNegativeRawAmount(protectedLotRaw);
  const sold = nonNegativeRawAmount(soldRaw);
  if (lot === null || sold === null || lot <= 0n || sold <= 0n) return null;

  const remaining = sold >= lot ? 0n : lot - sold;
  const basis = nonNegativeRawAmount(basisLamports);
  const remainingBasis = basis === null || basis <= 0n
    ? null
    : (basis * remaining) / lot;
  return {
    remainingRaw: remaining.toString(),
    remainingBasisLamports: remainingBasis === null ? null : remainingBasis.toString(),
    soldRaw: (sold > lot ? lot : sold).toString()
  };
}

export function protectedLotAfterConfirmedBuy({
  initialLotRaw,
  protectedLotRaw,
  basisLamports,
  grossLamports,
  feeLamports,
  boughtRaw,
  boughtBasisLamports,
  boughtGrossLamports,
  boughtFeeLamports
} = {}) {
  const initial = nonNegativeRawAmount(initialLotRaw);
  const remaining = nonNegativeRawAmount(protectedLotRaw);
  const bought = nonNegativeRawAmount(boughtRaw);
  if (initial === null || remaining === null || bought === null || bought <= 0n) return null;

  const basis = nonNegativeRawAmount(basisLamports);
  const boughtBasis = nonNegativeRawAmount(boughtBasisLamports);
  const gross = nonNegativeRawAmount(grossLamports);
  const boughtGross = nonNegativeRawAmount(boughtGrossLamports);
  const fees = nonNegativeRawAmount(feeLamports);
  const boughtFees = nonNegativeRawAmount(boughtFeeLamports);

  return {
    initialRaw: (initial + bought).toString(),
    remainingRaw: (remaining + bought).toString(),
    basisLamports: basis === null || boughtBasis === null ? null : (basis + boughtBasis).toString(),
    grossLamports: gross === null || boughtGross === null ? null : (gross + boughtGross).toString(),
    feeLamports: fees === null || boughtFees === null ? null : (fees + boughtFees).toString(),
    boughtRaw: bought.toString()
  };
}

export function protectedPositionAddRevisionMatches(holder = {}, expectedWalletStateRevision, expectedProtectedLotRevision) {
  const currentWalletRevision = Math.max(0, Number.parseInt(holder.walletStateRevision || 0, 10) || 0);
  const currentLotRevision = Math.max(0, Number.parseInt(holder.protectedLotRevision || 0, 10) || 0);
  const expectedWallet = Number(expectedWalletStateRevision);
  const expectedLot = Number(expectedProtectedLotRevision);
  return Number.isInteger(expectedWallet)
    && expectedWallet >= 0
    && Number.isInteger(expectedLot)
    && expectedLot >= 0
    && currentWalletRevision === expectedWallet
    && currentLotRevision === expectedLot;
}

const PENDING_POSITION_ADD_STATUSES = new Set([
  "pending_buy",
  "arming",
  "needs_attention",
  "outcome_unknown"
]);

export function pendingProtectedPositionAdd(wallet = {}) {
  if (String(wallet?.buyReservationKind || "") !== "position_add") return false;
  const statuses = [wallet?.status, wallet?.exitStatus, wallet?.triggerStatus]
    .map((value) => String(value || "").toLowerCase());
  const unresolvedClaim = Boolean(
    String(wallet?.buyReservationClaimToken || "").trim()
    || String(wallet?.buySubmissionSignature || "").trim()
  );
  return unresolvedClaim && statuses.some((status) => PENDING_POSITION_ADD_STATUSES.has(status));
}

export function preservePendingPositionAddPlanState(currentPlan = {}, incomingPlan = {}, mergedWallets = []) {
  const wallets = Array.isArray(mergedWallets) ? mergedWallets : [];
  const pendingWallet = wallets.find((wallet) => pendingProtectedPositionAdd(wallet));
  if (!pendingWallet) return { ...incomingPlan, wallets };
  const timestamps = [incomingPlan.updatedAt, currentPlan.updatedAt, pendingWallet.updatedAt]
    .map((value) => ({ value, time: Date.parse(value || "") }))
    .filter((entry) => Number.isFinite(entry.time))
    .sort((left, right) => right.time - left.time);
  return {
    ...incomingPlan,
    wallets,
    status: "pending_buy",
    protectionIntent: "pending_buy",
    lastError: pendingWallet.lastError || currentPlan.lastError || incomingPlan.lastError
      || "A protected position add is awaiting on-chain reconciliation.",
    updatedAt: timestamps[0]?.value || incomingPlan.updatedAt || currentPlan.updatedAt || null
  };
}

const AUTHORITATIVE_MANAGED_WALLET_STATUSES = new Set([
  "armed",
  "watching",
  "retrying",
  "triggered",
  "submitting",
  "outcome_unknown",
  "waiting_next_loop",
  "timer-only",
  "price-unavailable",
  "pending_buy",
  "arming",
  "needs_attention",
  "manual_hold"
]);

export function authoritativeManagedPlanCoversPosition(entry = {}, plans = []) {
  return (Array.isArray(plans) ? plans : []).some((plan) => {
    if (!plan?.id || String(plan.executionMode || "") !== "managed_server") return false;
    if (String(plan.userId || "") !== String(entry.userId || "")
      || String(plan.tokenMint || "") !== String(entry.tokenMint || "")) return false;
    if (["completed", "closed", "canceled", "cancelled", "failed", "stopped"]
      .includes(String(plan.status || "").toLowerCase())) return false;
    return (Array.isArray(plan.wallets) ? plan.wallets : []).some((wallet) => (
      String(wallet?.publicKey || "") === String(entry.walletPublicKey || "")
      && [wallet?.status, wallet?.exitStatus, wallet?.triggerStatus]
        .some((status) => AUTHORITATIVE_MANAGED_WALLET_STATUSES.has(String(status || "").toLowerCase()))
    ));
  });
}

export function ladderSellAmountRaw({
  initialLotRaw,
  remainingLotRaw,
  currentBalanceRaw,
  sellPercent,
  finalRung = false
} = {}) {
  const initial = nonNegativeRawAmount(initialLotRaw);
  const remaining = nonNegativeRawAmount(remainingLotRaw);
  const current = nonNegativeRawAmount(currentBalanceRaw);
  if (remaining === null || current === null) return 0n;
  const available = remaining < current ? remaining : current;
  if (available <= 0n) return 0n;
  if (finalRung) return available;

  const pct = Number(sellPercent);
  if (initial === null || initial <= 0n || !Number.isFinite(pct) || pct <= 0) {
    return 0n;
  }
  const scaledPct = BigInt(Math.max(1, Math.round(Math.min(100, pct) * 10_000)));
  const target = (initial * scaledPct) / 1_000_000n;
  const nonZeroTarget = target > 0n ? target : 1n;
  return nonZeroTarget < available ? nonZeroTarget : available;
}

function normalizedExitStatuses(row = {}) {
  return [row.status, row.exitStatus, row.triggerStatus]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean);
}

function rowIsStopLossExit(row = {}) {
  return String(row.triggerKind || "").trim().toLowerCase() === "stop-loss"
    || /^stop-loss\b/i.test(String(row.triggerReason || "").trim());
}

function exactExitIdentityMatch(candidate = {}, row = {}) {
  const walletPublicKey = String(candidate.walletPublicKey || "").trim();
  const tokenMint = String(candidate.tokenMint || "").trim();
  if (!walletPublicKey || !tokenMint) return false;
  if (String(row.walletPublicKey || row.publicKey || "").trim() !== walletPublicKey) return false;
  if (String(row.tokenMint || "").trim() !== tokenMint) return false;
  // The on-chain wallet + mint is the money identity. The same imported key
  // can exist under more than one SlimeWire account; userId scoping here would
  // let those accounts create overlapping full-position exits for one bag.
  return true;
}

export function sameWalletTokenBuyBlockDecision(candidate = {}, exits = [], options = {}) {
  const rows = Array.isArray(exits) ? exits : [exits];
  const now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
  const configuredCooldown = Number(options.stopClosedCooldownMs);
  const stopClosedCooldownMs = Number.isFinite(configuredCooldown) && configuredCooldown >= 0
    ? configuredCooldown
    : 30_000;

  for (const row of rows) {
    if (!row || !exactExitIdentityMatch(candidate, row)) continue;
    const statuses = normalizedExitStatuses(row);
    const stopLoss = rowIsStopLossExit(row);

    if (statuses.includes("outcome_unknown") || statuses.includes("needs_attention")) {
      return { blocked: true, reason: "exit_outcome_unknown", row };
    }
    if (statuses.includes("pending_buy") || statuses.includes("arming")) {
      return { blocked: true, reason: "protection_pending", row };
    }
    if (statuses.includes("submitting") || Boolean(row.preSellCheckpointAt && !row.sellSignature)) {
      return { blocked: true, reason: "exit_submitting", row };
    }
    if (stopLoss && (statuses.includes("triggered") || statuses.includes("retrying"))) {
      return { blocked: true, reason: "stop_loss_triggered", row };
    }
    if (statuses.some((status) => [
      "active",
      "armed",
      "watching",
      "retrying",
      "triggered",
      "timer-only",
      "price-unavailable",
      "waiting_next_loop",
      "pending_buy",
      "arming"
    ].includes(status))) {
      return { blocked: true, reason: "exit_active", row };
    }

    const stopClosed = stopLoss && statuses.some((status) => ["sold", "confirmed", "closed"].includes(status));
    if (!stopClosed || stopClosedCooldownMs <= 0) continue;
    const closedAt = Date.parse(String(
      row.soldAt
        || row.confirmedAt
        || row.submissionResolvedAt
        || row.updatedAt
        || ""
    ));
    const closedAgeMs = Number.isFinite(closedAt) ? Math.max(0, now - closedAt) : Number.POSITIVE_INFINITY;
    if (closedAgeMs < stopClosedCooldownMs) {
      return {
        blocked: true,
        reason: "stop_loss_closed_cooldown",
        retryAfterMs: stopClosedCooldownMs - closedAgeMs,
        row
      };
    }
  }

  return { blocked: false, reason: "" };
}

export function protectedPositionAddDecision(candidate = {}, plans = [], guards = [], receipts = [], options = {}) {
  const walletPublicKey = String(candidate.walletPublicKey || "").trim();
  const tokenMint = String(candidate.tokenMint || "").trim();
  const userId = String(candidate.userId || "").trim();
  if (!walletPublicKey || !tokenMint || !userId) return { eligible: false, reason: "missing_identity" };
  const terminalPlans = new Set(["canceled", "cancelled", "stopped", "closed", "completed"]);
  const matchingPlans = (Array.isArray(plans) ? plans : []).filter((plan) => (
    String(plan?.tokenMint || "") === tokenMint
    && !terminalPlans.has(String(plan?.status || "").toLowerCase())
    && (Array.isArray(plan?.wallets) ? plan.wallets : []).some((holder) => String(holder?.publicKey || "") === walletPublicKey)
  ));
  if (matchingPlans.some((plan) => String(plan?.userId || "") !== userId)) {
    return { eligible: false, reason: "cross_user_protection" };
  }
  if (matchingPlans.length !== 1) return { eligible: false, reason: matchingPlans.length ? "multiple_plans" : "no_active_plan" };
  const plan = matchingPlans[0];
  const holders = Array.isArray(plan.wallets) ? plan.wallets : [];
  const holder = holders.find((row) => String(row?.publicKey || "") === walletPublicKey);
  const holderStatuses = [holder?.status, holder?.exitStatus].map((value) => String(value || "").toLowerCase());
  const triggerStatus = String(holder?.triggerStatus || "").toLowerCase();
  const initial = nonNegativeRawAmount(holder?.tokenOutAmount);
  const remaining = nonNegativeRawAmount(holder?.protectedTokenRemainingRaw);
  const basis = nonNegativeRawAmount(holder?.basisLamports);
  const partial = (Array.isArray(holder?.completedTakeProfitLevels) && holder.completedTakeProfitLevels.length > 0)
    || (Array.isArray(holder?.partialExitSignatures) && holder.partialExitSignatures.length > 0)
    || (nonNegativeRawAmount(holder?.protectedTokenSoldRaw) || 0n) > 0n
    || (initial !== null && remaining !== null && initial !== remaining);
  const inFlight = Boolean(holder?.submissionClaimToken
    || holder?.submissionSignature
    || holder?.buyReservationClaimToken
    || holder?.buySubmissionSignature
    || holder?.manualSellClaimToken);
  const now = Number.isFinite(Number(options.now)) ? Number(options.now) : Date.now();
  const configuredTimerWindow = Number(options.timerSafetyWindowMs);
  const timerSafetyWindowMs = Number.isFinite(configuredTimerWindow) && configuredTimerWindow >= 0
    ? configuredTimerWindow
    : 120_000;
  const sellAfterAt = Date.parse(String(holder?.sellAfterAt || plan?.sellAfterAt || ""));
  const timerDueSoon = Number.isFinite(sellAfterAt) && sellAfterAt <= now + timerSafetyWindowMs;
  const exactCheckpoint = holder && Object.prototype.hasOwnProperty.call(holder, "preBuyTokenRawAmount")
    && initial !== null && initial > 0n
    && remaining !== null && remaining > 0n
    && basis !== null && basis > 0n
    && Boolean(String(holder.buySignature || "").trim());
  if (String(plan.status || "").toLowerCase() !== "watching"
    || String(plan.protectionIntent || "armed").toLowerCase() !== "armed"
    || String(plan.executionMode || "") !== "managed_server"
    || Number.parseInt(plan.loopCount || 1, 10) !== 1
    || holders.length !== 1
    || !holderStatuses.every((status) => ["watching", "armed", "timer-only"].includes(status))
    || !["watching", "armed", "timer-only", "price-unavailable"].includes(triggerStatus)
    || holder?.autoExitDisabled
    || holder?.manualExit
    || inFlight
    || timerDueSoon
    || partial
    || !exactCheckpoint) {
    return { eligible: false, reason: partial ? "partial_position" : inFlight ? "position_inflight" : timerDueSoon ? "timer_due" : "unsafe_plan_state" };
  }

  const activeGuards = (Array.isArray(guards) ? guards : []).filter((guard) => (
    String(guard?.walletPublicKey || guard?.publicKey || "") === walletPublicKey
    && String(guard?.tokenMint || "") === tokenMint
    && !normalizedExitStatuses(guard).some((status) => ["sold", "confirmed", "failed", "canceled", "cancelled", "skipped"].includes(status))
  ));
  if (activeGuards.length > 1) return { eligible: false, reason: "multiple_guards" };
  if (activeGuards.some((guard) => !guard.planId
    || String(guard.planId) !== String(plan.id || "")
    || String(guard.userId || "") !== userId
    || (guard.buySignature && String(guard.buySignature) !== String(holder.buySignature)))) {
    return { eligible: false, reason: "unlinked_guard" };
  }
  if (activeGuards.some((guard) => normalizedExitStatuses(guard).some((status) => (
    ["submitting", "outcome_unknown", "needs_attention", "retrying", "triggered"].includes(status)
  )))) return { eligible: false, reason: "guard_inflight" };

  const conflict = sameWalletTokenBuyBlockDecision(candidate, Array.isArray(receipts) ? receipts : [receipts], options);
  if (conflict.blocked) return { eligible: false, reason: conflict.reason };
  return { eligible: true, reason: "", plan, holder };
}

function exitReceiptSignature(receipt = {}) {
  return String(receipt.sellSignature || receipt.signature || "").trim();
}

function matchingSellHistoryEvent(receipt = {}, event = {}) {
  const signature = exitReceiptSignature(receipt);
  if (!signature || String(event.signature || "").trim() !== signature) return false;
  if (String(event.type || "").trim().toLowerCase() !== "sell") return false;

  const tokenMint = String(receipt.tokenMint || "").trim();
  const walletPublicKey = String(receipt.walletPublicKey || receipt.publicKey || "").trim();
  if (tokenMint && String(event.tokenMint || "").trim() !== tokenMint) return false;
  if (walletPublicKey && String(event.walletPublicKey || "").trim() !== walletPublicKey) return false;
  // A signature-only/zero-output row is not complete history. The confirmed
  // receipt worker must remain eligible to enrich it after the exact wallet
  // lamport delta becomes available.
  try {
    return BigInt(event.solLamportsReceived || 0) > 0n;
  } catch {
    return false;
  }
}

export function confirmedExitNeedsHistoryBackfill(receipt = {}, historyEvents = null) {
  const signature = exitReceiptSignature(receipt);
  if (!signature) return false;

  const statuses = normalizedExitStatuses(receipt);
  const confirmed = statuses.some((status) => ["sold", "confirmed", "closed"].includes(status));
  if (!confirmed) return false;

  if (Array.isArray(historyEvents)) {
    return !historyEvents.some((event) => matchingSellHistoryEvent(receipt, event));
  }

  return receipt.historyRecorded !== true
    && !String(receipt.historyRecordedAt || receipt.tradeHistoryRecordedAt || "").trim();
}

export function priceExitDecision({ movePct, takeProfitPct = 0, stopLossPct = 0, stopLossBufferPct = 0 }) {
  const move = Number(movePct);
  if (!Number.isFinite(move)) return null;

  const stopTrigger = stopLossTriggerPercent(stopLossPct, stopLossBufferPct);
  if (stopTrigger > 0 && move <= -stopTrigger) {
    return {
      kind: "stop-loss",
      triggerPct: stopTrigger,
      targetPct: Number(stopLossPct),
      sellPercent: 100
    };
  }

  const takeProfit = Number(takeProfitPct || 0);
  if (Number.isFinite(takeProfit) && takeProfit > 0 && move >= takeProfit) {
    return {
      kind: "take-profit",
      triggerPct: takeProfit,
      targetPct: takeProfit
    };
  }

  return null;
}

export function recentStoredPriceExitDecision({
  movePct,
  lastCheckedAt,
  now = Date.now(),
  maxAgeMs = 300000,
  takeProfitPct = 0,
  stopLossPct = 0,
  stopLossBufferPct = 0
} = {}) {
  const checkedAt = Date.parse(lastCheckedAt || "");
  if (!Number.isFinite(checkedAt)) return null;

  const safeNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const safeMaxAgeMs = Number.isFinite(Number(maxAgeMs)) && Number(maxAgeMs) > 0
    ? Number(maxAgeMs)
    : 300000;
  if (safeNow - checkedAt > safeMaxAgeMs) return null;

  return priceExitDecision({
    movePct,
    takeProfitPct,
    stopLossPct,
    stopLossBufferPct
  });
}

export function shouldEmergencySellOnPriceFailure({ stopLossPct = 0, estimateFailures = 0, minFailures = 2, planCreatedAt = null, graceMs = 0 } = {}) {
  const stop = Number(stopLossPct || 0);
  const failures = Number.parseInt(estimateFailures || 0, 10);
  const threshold = Number.parseInt(minFailures || 2, 10);
  if (!Number.isFinite(stop) || stop <= 0) return false;
  if (!Number.isInteger(failures) || failures <= 0) return false;
  // Fresh-launch grace: a token bought seconds ago has NO Jupiter route yet, so
  // quote failures are expected, not a dying token. Tripping the emergency here
  // sold (or tried to sell) launch bags within minutes of every launch.
  if (planCreatedAt && graceMs > 0) {
    const ageMs = Date.now() - Date.parse(planCreatedAt);
    if (Number.isFinite(ageMs) && ageMs >= 0 && ageMs < graceMs) return false;
  }
  const safeThreshold = Number.isInteger(threshold) && threshold > 0 ? threshold : 2;
  return failures >= safeThreshold;
}

export function staleSubmittingExit({
  status,
  exitStatus,
  triggerReason,
  lastSellAttemptAt,
  now = Date.now(),
  staleMs = 15000
} = {}) {
  const normalizedStatus = String(exitStatus || status || "").toLowerCase();
  if (normalizedStatus !== "submitting") return false;
  if (!/^stop-loss\b|^take-profit\b/i.test(String(triggerReason || ""))) return false;

  const safeNow = Number.isFinite(Number(now)) ? Number(now) : Date.now();
  const safeStaleMs = Number.isFinite(Number(staleMs)) && Number(staleMs) > 0 ? Number(staleMs) : 15000;
  const attemptedAt = Date.parse(lastSellAttemptAt || "");
  if (!Number.isFinite(attemptedAt)) return true;
  return safeNow - attemptedAt >= safeStaleMs;
}
