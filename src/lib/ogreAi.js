function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function textBlob(row = {}) {
  return [
    row.symbol,
    row.name,
    row.category,
    row.source,
    row.dexId,
    row.dexName,
    ...(Array.isArray(row.riskFlags) ? row.riskFlags : []),
    ...(Array.isArray(row.bestPickWarnings) ? row.bestPickWarnings : []),
    row.rugRisk,
    row.exitRisk,
    row.safetyNote
  ].filter(Boolean).join(" ").toLowerCase();
}

export function ogreAiSignalKey(row = {}) {
  return String(row?.tokenMint || row?.mint || row?.address || "").trim();
}

export function ogreAiRiskText(row = {}) {
  return textBlob(row);
}

export function isOgreAiBlockedRisk(row = {}) {
  const text = ogreAiRiskText(row);
  return /\b(hard dump|sell pressure|honeypot|blocked|no route|rug|token-2022|freeze authority|mint authority)\b/i.test(text)
    || /\bmayhem\b/i.test(text)
    || text.includes("pump mayhem");
}

export function ogreAiCandidateStats(row = {}) {
  const score = numberValue(row.bestPickScore, row.score);
  const marketCap = numberValue(row.marketCap, row.fdv);
  const liquidityUsd = numberValue(row.liquidityUsd);
  const volume5m = numberValue(row.volume5m);
  const volumeM15 = numberValue(row.volumeM15);
  const volumeM30 = numberValue(row.volumeM30);
  const volumeH1 = numberValue(row.volumeH1);
  const ageMinutes = row.pairAgeMinutes === null || row.pairAgeMinutes === undefined
    ? null
    : Number(row.pairAgeMinutes);
  const text = textBlob(row);
  const isPump = Boolean(row.isPump)
    || /pump/.test(text)
    || String(row.tokenMint || "").toLowerCase().endsWith("pump");
  const hasActivity = volume5m > 0 || volumeM15 > 0 || volumeM30 > 0 || volumeH1 > 0 || liquidityUsd > 0 || isPump;
  return {
    score,
    marketCap,
    liquidityUsd,
    volume5m,
    volumeM15,
    volumeM30,
    volumeH1,
    ageMinutes: Number.isFinite(ageMinutes) ? ageMinutes : null,
    isPump,
    hasActivity
  };
}

export function ogreAiTierForCandidate(row = {}, defaults = {}, mode = "quick") {
  const tokenMint = ogreAiSignalKey(row);
  if (!tokenMint || isOgreAiBlockedRisk(row)) return null;
  const stats = ogreAiCandidateStats(row);
  if (!stats.hasActivity) return null;

  const minScore = Number(defaults.minScore || 54);
  const maxMarketCap = Number(defaults.maxMarketCap || 750_000);
  const minLiquidityUsd = Number(defaults.minLiquidityUsd || 350);
  const freshAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 90 || stats.isPump;
  const normalAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 1440;
  const modeAgeOk = mode === "fresh" ? freshAgeOk : normalAgeOk;
  if (!modeAgeOk) return null;

  if (
    stats.score >= minScore
    && (!stats.marketCap || stats.marketCap <= maxMarketCap)
    && (!stats.liquidityUsd || stats.liquidityUsd >= minLiquidityUsd)
  ) {
    return "strict";
  }

  if (
    stats.score >= Math.max(35, minScore - 14)
    && (!stats.marketCap || stats.marketCap <= maxMarketCap * 1.4)
    && (!stats.liquidityUsd || stats.liquidityUsd >= Math.max(75, minLiquidityUsd * 0.35))
  ) {
    return "balanced";
  }

  const hasMomentum = stats.volume5m > 0 || stats.volumeM15 > 0 || stats.volumeM30 > 0 || stats.volumeH1 > 0 || stats.isPump;
  if (
    stats.score >= 25
    && hasMomentum
    && (!stats.marketCap || stats.marketCap <= maxMarketCap * 2)
    && (!stats.liquidityUsd || stats.liquidityUsd >= 50 || stats.isPump)
  ) {
    return "available";
  }

  return null;
}

export function compareOgreAiCandidates(a = {}, b = {}) {
  return (numberValue(b.bestPickScore, b.score) - numberValue(a.bestPickScore, a.score))
    || (numberValue(b.volume5m) - numberValue(a.volume5m))
    || (numberValue(b.volumeM15) - numberValue(a.volumeM15))
    || (numberValue(b.volumeH1) - numberValue(a.volumeH1))
    || (numberValue(b.liquidityUsd) - numberValue(a.liquidityUsd))
    || (numberValue(b.pairCreatedAt) - numberValue(a.pairCreatedAt));
}

export function buildOgreAiCandidatePool(rows = [], defaults = {}, mode = "quick") {
  const seen = new Set();
  const tiers = {
    strict: [],
    balanced: [],
    available: [],
    scout: []
  };
  let blocked = 0;
  let duplicate = 0;

  for (const row of rows || []) {
    const key = ogreAiSignalKey(row);
    if (!key) {
      blocked += 1;
      continue;
    }
    if (seen.has(key)) {
      duplicate += 1;
      continue;
    }
    seen.add(key);
    const tier = ogreAiTierForCandidate(row, defaults, mode);
    if (!tier) {
      const stats = ogreAiCandidateStats(row);
      const maxMarketCap = Number(defaults.maxMarketCap || 750_000);
      const ageOk = stats.ageMinutes === null
        || stats.ageMinutes <= (mode === "fresh" ? 180 : 1440)
        || stats.isPump;
      const capOk = !stats.marketCap || stats.marketCap <= maxMarketCap * 3;
      const hasSomeSignal = stats.hasActivity
        || stats.score > 0
        || Array.isArray(row.bestPickInputs) && row.bestPickInputs.length > 0
        || Array.isArray(row.reasons) && row.reasons.length > 0;
      if (ageOk && capOk && hasSomeSignal) {
        tiers.scout.push({ ...row, ogreAiTier: "scout" });
        continue;
      }
      blocked += 1;
      continue;
    }
    tiers[tier].push({ ...row, ogreAiTier: tier });
  }

  for (const tier of Object.keys(tiers)) {
    tiers[tier].sort(compareOgreAiCandidates);
  }

  const selectedTier = tiers.strict.length ? "strict" : tiers.balanced.length ? "balanced" : tiers.available.length ? "available" : tiers.scout.length ? "scout" : "none";
  const candidates = selectedTier === "none" ? [] : tiers[selectedTier];
  return {
    selectedTier,
    candidates,
    tierCounts: {
      strict: tiers.strict.length,
      balanced: tiers.balanced.length,
      available: tiers.available.length,
      scout: tiers.scout.length,
      blocked,
      duplicate
    }
  };
}
