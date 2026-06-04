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

export function shouldEmergencySellOnPriceFailure({ stopLossPct = 0, estimateFailures = 0, minFailures = 2 } = {}) {
  const stop = Number(stopLossPct || 0);
  const failures = Number.parseInt(estimateFailures || 0, 10);
  const threshold = Number.parseInt(minFailures || 2, 10);
  if (!Number.isFinite(stop) || stop <= 0) return false;
  if (!Number.isInteger(failures) || failures <= 0) return false;
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
