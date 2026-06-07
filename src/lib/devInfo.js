const STATUS_LABELS = Object.freeze({
  unknown: "?",
  new: "New",
  hold: "Hold",
  mixed: "Mixed",
  risk: "Risk",
  dump: "Dump"
});

const CONFIDENCE_ORDER = Object.freeze({
  unknown: 0,
  low: 1,
  medium: 2,
  high: 3
});

function normalizeStatus(value = "") {
  const status = String(value || "").trim().toLowerCase();
  return Object.hasOwn(STATUS_LABELS, status) ? status : "unknown";
}

function normalizeConfidence(value = "") {
  const confidence = String(value || "").trim().toLowerCase();
  return Object.hasOwn(CONFIDENCE_ORDER, confidence) ? confidence : "unknown";
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
}

function hasMediumConfidence(confidence = "unknown") {
  return CONFIDENCE_ORDER[normalizeConfidence(confidence)] >= CONFIDENCE_ORDER.medium;
}

function median(values = []) {
  const sorted = values.map(numberOrNull).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function devInfoSummaryForStatus(status = "unknown", confidence = "unknown", reasons = []) {
  const topReason = Array.isArray(reasons) ? reasons.find(Boolean) : "";
  if (status === "hold") return topReason || "Likely dev wallet is still holding.";
  if (status === "mixed") return topReason || "Dev wallet history is mixed.";
  if (status === "risk") return topReason || "Likely dev wallet has fast-sell history.";
  if (status === "dump") return topReason || "Likely dev wallet sold quickly or has repeated dump behavior.";
  if (status === "new") return "Limited dev-wallet history. Treat this as a new launch wallet.";
  return confidence === "unknown"
    ? "No reliable creator wallet detected yet."
    : "Not enough wallet behavior history yet.";
}

function suggestedActionForStatus(status = "unknown") {
  if (status === "mixed") return "Consider smaller size or Protected Buy.";
  if (status === "risk") return "High-risk dev behavior. Use small size or watch only.";
  if (status === "dump") return "Avoid recommended unless you understand the risk.";
  return "Check SlimeShield and liquidity before buying.";
}

function normalizeCurrentPosition(currentPosition = null, mint = "", likelyDevWallet = null) {
  if (!currentPosition || typeof currentPosition !== "object") {
    return null;
  }
  return {
    mint: String(currentPosition.mint || mint || "").trim(),
    likelyDevWallet: currentPosition.likelyDevWallet || likelyDevWallet || null,
    initialTokenAmount: numberOrNull(currentPosition.initialTokenAmount),
    initialSupplyPercent: numberOrNull(currentPosition.initialSupplyPercent),
    currentTokenAmount: numberOrNull(currentPosition.currentTokenAmount),
    currentSupplyPercent: numberOrNull(currentPosition.currentSupplyPercent),
    estimatedSoldPercent: numberOrNull(currentPosition.estimatedSoldPercent),
    firstMajorSellAt: currentPosition.firstMajorSellAt || null,
    firstMajorSellMinutesAfterLaunch: numberOrNull(currentPosition.firstMajorSellMinutesAfterLaunch),
    lastSellAt: currentPosition.lastSellAt || null,
    positionStatus: ["unknown", "holding", "partial_exit", "mostly_exited", "exited"].includes(currentPosition.positionStatus)
      ? currentPosition.positionStatus
      : "unknown"
  };
}

function normalizeHistoricalStats(stats = null, likelyDevWallet = null) {
  if (!stats || typeof stats !== "object") {
    return {
      likelyDevWallet,
      launchesTracked: 0,
      recentLaunches: []
    };
  }
  return {
    likelyDevWallet: stats.likelyDevWallet || likelyDevWallet || null,
    launchesTracked: Math.max(0, Math.round(numberOrNull(stats.launchesTracked) || 0)),
    medianFirstSellMinutes: numberOrNull(stats.medianFirstSellMinutes),
    medianHoldMinutes: numberOrNull(stats.medianHoldMinutes),
    soldMoreThan50Within15mPercent: numberOrNull(stats.soldMoreThan50Within15mPercent),
    soldMoreThan50Within1hPercent: numberOrNull(stats.soldMoreThan50Within1hPercent),
    heldPast24hPercent: numberOrNull(stats.heldPast24hPercent),
    bestPriorLaunchReturnPercent: numberOrNull(stats.bestPriorLaunchReturnPercent),
    worstPriorLaunchReturnPercent: numberOrNull(stats.worstPriorLaunchReturnPercent),
    recentLaunches: Array.isArray(stats.recentLaunches) ? stats.recentLaunches.slice(0, 10) : []
  };
}

export function calculateDevWalletStatsFromEvents(events = [], walletAddress = "") {
  const rows = Array.isArray(events) ? events.filter(Boolean) : [];
  const launchesByMint = new Map();
  for (const event of rows) {
    const mint = String(event.mint || event.tokenMint || "").trim();
    if (!mint) continue;
    const bucket = launchesByMint.get(mint) || { mint, buys: [], sells: [], launchAt: null };
    const eventType = String(event.eventType || event.event_type || "").toLowerCase();
    const eventTime = event.eventTime || event.event_time || event.createdAt || event.created_at || null;
    const timestamp = eventTime ? Date.parse(eventTime) : Number.NaN;
    const amount = numberOrNull(event.tokenAmount ?? event.token_amount ?? event.amount);
    if (eventType === "launch") bucket.launchAt = Number.isFinite(timestamp) ? timestamp : bucket.launchAt;
    if (eventType === "buy" || eventType === "launch" || eventType === "liquidity_add") {
      bucket.buys.push({ timestamp, amount });
      if (!bucket.launchAt && Number.isFinite(timestamp)) bucket.launchAt = timestamp;
    }
    if (eventType === "sell" || eventType === "liquidity_remove") {
      bucket.sells.push({ timestamp, amount, supplyPercent: numberOrNull(event.supplyPercent ?? event.supply_percent) });
    }
    launchesByMint.set(mint, bucket);
  }

  const launchRows = [...launchesByMint.values()].map((launch) => {
    const buyAmount = launch.buys.reduce((sum, item) => sum + Math.max(0, numberOrNull(item.amount) || 0), 0);
    const sellAmount = launch.sells.reduce((sum, item) => sum + Math.max(0, numberOrNull(item.amount) || 0), 0);
    const estimatedSoldPercent = buyAmount > 0 ? Math.min(100, (sellAmount / buyAmount) * 100) : null;
    const firstSell = launch.sells
      .filter((item) => Number.isFinite(item.timestamp))
      .sort((a, b) => a.timestamp - b.timestamp)[0] || null;
    const firstSellMinutes = firstSell && Number.isFinite(launch.launchAt)
      ? Math.max(0, (firstSell.timestamp - launch.launchAt) / 60_000)
      : null;
    return {
      mint: launch.mint,
      firstSellMinutes,
      estimatedSoldPercent,
      outcomeLabel: estimatedSoldPercent === null
        ? "unknown"
        : estimatedSoldPercent >= 70
          ? "dumped"
          : estimatedSoldPercent >= 35
            ? "partial_exit"
            : "held"
    };
  });

  const launchesTracked = launchRows.length;
  const sold50Within15 = launchRows.filter((row) => Number(row.estimatedSoldPercent) >= 50 && Number(row.firstSellMinutes) <= 15).length;
  const sold50Within60 = launchRows.filter((row) => Number(row.estimatedSoldPercent) >= 50 && Number(row.firstSellMinutes) <= 60).length;
  const heldPast24 = launchRows.filter((row) => row.estimatedSoldPercent !== null && Number(row.estimatedSoldPercent) < 50).length;
  return {
    likelyDevWallet: walletAddress || null,
    launchesTracked,
    medianFirstSellMinutes: median(launchRows.map((row) => row.firstSellMinutes)),
    medianHoldMinutes: median(launchRows.map((row) => row.firstSellMinutes)),
    soldMoreThan50Within15mPercent: launchesTracked ? (sold50Within15 / launchesTracked) * 100 : null,
    soldMoreThan50Within1hPercent: launchesTracked ? (sold50Within60 / launchesTracked) * 100 : null,
    heldPast24hPercent: launchesTracked ? (heldPast24 / launchesTracked) * 100 : null,
    bestPriorLaunchReturnPercent: null,
    worstPriorLaunchReturnPercent: null,
    recentLaunches: launchRows.slice(-10)
  };
}

export function calculateDevInfoStatus(input = {}) {
  const mint = String(input.mint || input.tokenMint || "").trim();
  const likelyDevWallet = String(input.likelyDevWallet || input.creatorWallet || input.launchWallet || "").trim() || null;
  const confidence = normalizeConfidence(input.confidence);
  const currentPosition = normalizeCurrentPosition(input.currentPosition, mint, likelyDevWallet);
  const historicalStats = normalizeHistoricalStats(input.historicalStats, likelyDevWallet);
  const linkedWalletSignals = {
    sameFundingWalletSeenBefore: Boolean(input.linkedWalletSignals?.sameFundingWalletSeenBefore),
    sameCreatorSeenBefore: Boolean(input.linkedWalletSignals?.sameCreatorSeenBefore),
    linkedWalletCount: Math.max(0, Math.round(numberOrNull(input.linkedWalletSignals?.linkedWalletCount) || 0)),
    recentLinkedWalletSellCount: Math.max(0, Math.round(numberOrNull(input.linkedWalletSignals?.recentLinkedWalletSellCount) || 0)),
    notes: Array.isArray(input.linkedWalletSignals?.notes) ? input.linkedWalletSignals.notes.slice(0, 8) : []
  };
  const riskReasons = [];
  const positiveReasons = [];
  let score = 70;

  if (!likelyDevWallet || confidence === "unknown") {
    const status = "unknown";
    return {
      mint,
      pairAddress: input.pairAddress || "",
      likelyDevWallet,
      confidence,
      status,
      label: STATUS_LABELS[status],
      score: 50,
      summary: devInfoSummaryForStatus(status, confidence),
      currentPosition,
      historicalStats,
      linkedWalletSignals,
      riskReasons: ["No reliable creator wallet detected yet."],
      positiveReasons,
      suggestedAction: suggestedActionForStatus(status),
      updatedAt: input.updatedAt || new Date().toISOString()
    };
  }

  const estimatedSold = currentPosition ? numberOrNull(currentPosition.estimatedSoldPercent) : null;
  const firstSellMinutes = currentPosition ? numberOrNull(currentPosition.firstMajorSellMinutesAfterLaunch) : null;
  const currentSupplyPercent = currentPosition ? numberOrNull(currentPosition.currentSupplyPercent) : null;
  const launchesTracked = Number(historicalStats.launchesTracked || 0);
  const medianFirstSell = numberOrNull(historicalStats.medianFirstSellMinutes);
  const sold50In15 = numberOrNull(historicalStats.soldMoreThan50Within15mPercent);
  const sold50In1h = numberOrNull(historicalStats.soldMoreThan50Within1hPercent);
  const heldPast24h = numberOrNull(historicalStats.heldPast24hPercent);

  if (Number.isFinite(estimatedSold) && estimatedSold > 50 && Number.isFinite(firstSellMinutes) && firstSellMinutes <= 15) {
    score -= 35;
    riskReasons.push(`Likely dev sold ${Math.round(estimatedSold)}% within ${Math.max(1, Math.round(firstSellMinutes))}m on this token.`);
  } else if (Number.isFinite(estimatedSold) && estimatedSold > 50 && Number.isFinite(firstSellMinutes) && firstSellMinutes <= 60) {
    score -= 25;
    riskReasons.push(`Likely dev sold ${Math.round(estimatedSold)}% within the first hour on this token.`);
  }
  if (Number.isFinite(estimatedSold) && estimatedSold >= 70 && Number.isFinite(firstSellMinutes) && firstSellMinutes <= 15) {
    riskReasons.push("Hard flag: likely dev exited most of the initial allocation quickly.");
  }
  if (Number.isFinite(currentSupplyPercent) && currentSupplyPercent < 10) {
    score -= 20;
    riskReasons.push("Current dev holding looks low versus the initial allocation.");
  }
  if (currentPosition?.positionStatus === "holding" || (Number.isFinite(estimatedSold) && estimatedSold < 35)) {
    score += 10;
    positiveReasons.push("Likely dev wallet is still holding a meaningful position.");
  }

  if (Number.isFinite(medianFirstSell) && medianFirstSell < 15 && launchesTracked >= 2) {
    score -= 20;
    riskReasons.push(`Median first sell across tracked launches is ${Math.max(1, Math.round(medianFirstSell))}m.`);
  }
  if (Number.isFinite(sold50In1h) && sold50In1h >= 50 && launchesTracked >= 2) {
    score -= 25;
    riskReasons.push(`Prior launches sold >50% within 1h about ${Math.round(sold50In1h)}% of the time.`);
  } else if (Number.isFinite(sold50In1h) && sold50In1h >= 30 && launchesTracked >= 2) {
    score -= 12;
    riskReasons.push(`Prior launch exits are mixed: ${Math.round(sold50In1h)}% sold >50% within 1h.`);
  }
  if (Number.isFinite(heldPast24h) && heldPast24h >= 60 && launchesTracked >= 2) {
    score += 10;
    positiveReasons.push(`Wallet held past 24h on ${Math.round(heldPast24h)}% of tracked launches.`);
  }
  if (Number.isFinite(sold50In1h) && sold50In1h < 20 && launchesTracked >= 2) {
    score += 10;
    positiveReasons.push("Fast-sell history is low across tracked launches.");
  }

  if (linkedWalletSignals.sameFundingWalletSeenBefore || linkedWalletSignals.sameCreatorSeenBefore) {
    score -= 15;
    riskReasons.push("Funding or creator wallet has appeared on prior launches.");
  }
  if (linkedWalletSignals.recentLinkedWalletSellCount > 0) {
    const penalty = Math.min(25, 10 + linkedWalletSignals.recentLinkedWalletSellCount * 5);
    score -= penalty;
    riskReasons.push(`${linkedWalletSignals.recentLinkedWalletSellCount} linked wallet sell signal(s) are cached.`);
  } else {
    score += 5;
    positiveReasons.push("No recent linked-wallet sells are cached.");
  }

  const finalScore = clampScore(score);
  const severeFastSell = Number.isFinite(estimatedSold)
    && Number.isFinite(firstSellMinutes)
    && ((estimatedSold >= 70 && firstSellMinutes <= 15) || (estimatedSold >= 90 && firstSellMinutes <= 60));
  let status = "mixed";
  if (launchesTracked < 2 && !riskReasons.length && !severeFastSell) {
    status = "new";
  } else if (severeFastSell && hasMediumConfidence(confidence)) {
    status = "dump";
  } else if (finalScore < 35 && hasMediumConfidence(confidence)) {
    status = "dump";
  } else if (finalScore < 55) {
    status = "risk";
  } else if (finalScore < 75) {
    status = "mixed";
  } else if (hasMediumConfidence(confidence)) {
    status = "hold";
  } else {
    status = "mixed";
  }

  const summary = devInfoSummaryForStatus(status, confidence, status === "hold" ? positiveReasons : riskReasons);
  return {
    mint,
    pairAddress: input.pairAddress || "",
    likelyDevWallet,
    confidence,
    status,
    label: STATUS_LABELS[normalizeStatus(status)],
    score: finalScore,
    summary,
    currentPosition,
    historicalStats,
    linkedWalletSignals,
    riskReasons,
    positiveReasons,
    suggestedAction: suggestedActionForStatus(status),
    updatedAt: input.updatedAt || new Date().toISOString()
  };
}

export function devInfoSummaryFromResult(result = {}) {
  const status = normalizeStatus(result.status);
  return {
    mint: String(result.mint || "").trim(),
    status,
    label: result.label || STATUS_LABELS[status],
    confidence: normalizeConfidence(result.confidence),
    summary: result.summary || devInfoSummaryForStatus(status, result.confidence),
    likelyDevWallet: result.likelyDevWallet || null,
    updatedAt: result.updatedAt || new Date().toISOString()
  };
}

export function devInfoSlimeShieldFactor(summary = {}) {
  const status = normalizeStatus(summary.status);
  if (status === "hold") {
    return {
      key: "dev_info_hold",
      label: "Dev Info",
      severity: "positive",
      message: "Likely dev wallet is still holding.",
      weight: 6
    };
  }
  if (status === "mixed") {
    return {
      key: "dev_info_mixed",
      label: "Dev Info",
      severity: "caution",
      message: "Dev wallet history is mixed.",
      weight: -8
    };
  }
  if (status === "risk") {
    return {
      key: "dev_info_risk",
      label: "Dev Info",
      severity: "risk",
      message: "Likely dev wallet has fast-sell history.",
      weight: -18
    };
  }
  if (status === "dump") {
    return {
      key: "dev_info_dump",
      label: "Dev Info",
      severity: "risk",
      message: "Likely dev wallet sold quickly or has repeated dump behavior.",
      weight: -30
    };
  }
  if (status === "new") {
    return {
      key: "dev_info_limited",
      label: "Dev Info",
      severity: "neutral",
      message: "Dev wallet history is limited.",
      weight: -2
    };
  }
  return {
    key: "dev_info_unknown",
    label: "Dev Info",
    severity: "neutral",
    message: "Dev wallet history is limited.",
    weight: -4
  };
}

export const DEV_INFO_STATUS_LABELS = STATUS_LABELS;
