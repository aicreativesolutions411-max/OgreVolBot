function numberValue(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clampNumber(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

const OGRE_AI_HARD_BLOCKED_RISK_RE = /\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|token-2022|safety pending|mint check pending)\b/i;
const OGRE_AI_ABSURD_MARKET_CAP_USD = 25_000_000;
const OGRE_AI_THIN_LIQUIDITY_MARKET_CAP_USD = 5_000_000;
const OGRE_AI_THIN_LIQUIDITY_RATIO = 0.01;

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
    row.safetyNote,
    row.tokenProgram,
    row.mintAuthority ? "mint authority" : "",
    row.freezeAuthority ? "freeze authority" : ""
  ].filter(Boolean).join(" ").toLowerCase();
}

export function ogreAiSignalKey(row = {}) {
  return String(row?.tokenMint || row?.mint || row?.address || "").trim();
}

export function ogreAiRiskText(row = {}) {
  return textBlob(row);
}

export function hasOgreAiHardSafetyBlock(row = {}) {
  const text = ogreAiRiskText(row);
  if (OGRE_AI_HARD_BLOCKED_RISK_RE.test(text)) return true;
  if (/\bmayhem\b/i.test(text) || text.includes("pump mayhem")) return true;
  const marketCap = numberValue(row.marketCap, row.fdv);
  const liquidityUsd = numberValue(row.liquidityUsd);
  if (marketCap >= OGRE_AI_ABSURD_MARKET_CAP_USD) return true;
  return marketCap >= OGRE_AI_THIN_LIQUIDITY_MARKET_CAP_USD
    && (!liquidityUsd || liquidityUsd / marketCap < OGRE_AI_THIN_LIQUIDITY_RATIO);
}

export function isOgreAiBlockedRisk(row = {}) {
  return hasOgreAiHardSafetyBlock(row)
    || /\b(hard dump|sell pressure|blocked)\b/i.test(ogreAiRiskText(row));
}

export function ogreAiCandidateStats(row = {}) {
  const score = numberValue(row.bestPickScore, row.score);
  const marketCap = numberValue(row.marketCap, row.fdv);
  const liquidityUsd = numberValue(row.liquidityUsd);
  const volume5m = numberValue(row.volume5m);
  const volumeM15 = numberValue(row.volumeM15);
  const volumeM30 = numberValue(row.volumeM30);
  const volumeH1 = numberValue(row.volumeH1);
  const priceM5 = finiteNumber(row.m5 ?? row.priceChangeM5 ?? row.change5m);
  const priceH1 = finiteNumber(row.h1 ?? row.priceChangeH1 ?? row.change1h);
  const priceH6 = finiteNumber(row.h6 ?? row.priceChangeH6 ?? row.change6h);
  const priceH24 = finiteNumber(row.h24 ?? row.priceChangeH24 ?? row.change24h);
  const buys5m = finiteNumber(row.buys5m ?? row.buyCount5m ?? row.recentBuys);
  const sells5m = finiteNumber(row.sells5m ?? row.sellCount5m ?? row.recentSells);
  const trades5m = numberValue(row.trades5m, row.txns5m, buys5m + sells5m);
  const rugRisk = finiteNumber(row.rugRisk);
  const exitRisk = finiteNumber(row.exitRisk);
  const ageMinutes = row.pairAgeMinutes === null || row.pairAgeMinutes === undefined
    ? null
    : Number(row.pairAgeMinutes);
  const text = textBlob(row);
  const isPump = Boolean(row.isPump)
    || /pump/.test(text)
    || String(row.tokenMint || "").toLowerCase().endsWith("pump");
  const hasActivity = volume5m > 0 || volumeM15 > 0 || volumeM30 > 0 || volumeH1 > 0 || liquidityUsd > 0 || isPump;
  const positivePriceMomentumPct = Math.max(0, priceM5, priceH1 * 0.65, priceH6 * 0.35, priceH24 * 0.15);
  const volumeMomentumUsd = Math.max(volume5m, volumeM15 * 0.5, volumeM30 * 0.32, volumeH1 * 0.18);
  const totalRecentTrades = trades5m || buys5m + sells5m;
  const buyPressure = buys5m + sells5m > 0 ? buys5m / Math.max(1, buys5m + sells5m) : 0.5;
  return {
    score,
    marketCap,
    liquidityUsd,
    volume5m,
    volumeM15,
    volumeM30,
    volumeH1,
    priceM5,
    priceH1,
    priceH6,
    priceH24,
    positivePriceMomentumPct,
    volumeMomentumUsd,
    buys5m,
    sells5m,
    trades5m: totalRecentTrades,
    buyPressure,
    rugRisk,
    exitRisk,
    ageMinutes: Number.isFinite(ageMinutes) ? ageMinutes : null,
    isPump,
    hasActivity
  };
}

export function ogreAiTargetProfitPct(defaults = {}) {
  return clampNumber(numberValue(
    defaults.takeProfitPct,
    defaults.targetTakeProfitPct,
    defaults.defaultTakeProfitPct,
    25
  ) || 25, 5, 500);
}

export function ogreAiTargetFitScore(row = {}, defaults = {}, mode = "quick") {
  const stats = ogreAiCandidateStats(row);
  const targetPct = ogreAiTargetProfitPct(defaults);
  const targetIntensity = clampNumber((targetPct - 25) / 100, 0, 1);
  const scoreSignal = clampNumber(stats.score, 0, 100) * (0.34 - targetIntensity * 0.08);
  const momentumNeed = Math.max(6, targetPct * (0.18 + targetIntensity * 0.08));
  const momentumSignal = clampNumber(stats.positivePriceMomentumPct / momentumNeed, 0, 1.35) * (18 + targetIntensity * 18);
  const volumeBase = Math.max(250, stats.liquidityUsd * 0.35, targetPct * 35);
  const volumeSignal = clampNumber(stats.volumeMomentumUsd / volumeBase, 0, 1.25) * (12 + targetIntensity * 12);
  const liquidityNeed = Math.max(80, Number(defaults.minLiquidityUsd || 350) * (targetIntensity > 0.5 ? 0.55 : 1));
  const liquiditySignal = clampNumber(stats.liquidityUsd / liquidityNeed, 0, 1.15) * (targetIntensity > 0.5 ? 8 : 15);
  const buyPressureSignal = clampNumber((stats.buyPressure - 0.5) / 0.25, -0.8, 1) * (7 + targetIntensity * 5);
  const tradeSignal = clampNumber(stats.trades5m / Math.max(3, targetPct / 12), 0, 1) * (4 + targetIntensity * 4);
  const marketCap = stats.marketCap;
  const maxMarketCap = Number(defaults.maxMarketCap || 750_000);
  let capFit = 8;
  if (marketCap > 0) {
    const idealLow = targetPct >= 80 ? 8_000 : targetPct >= 50 ? 15_000 : 25_000;
    const idealHigh = targetPct >= 80 ? Math.min(maxMarketCap, 260_000) : targetPct >= 50 ? Math.min(maxMarketCap, 550_000) : maxMarketCap;
    if (marketCap < idealLow) capFit = targetPct >= 80 ? 5 : 2;
    else if (marketCap <= idealHigh) capFit = 11 + targetIntensity * 8;
    else capFit = -clampNumber((marketCap - idealHigh) / Math.max(idealHigh, 1), 0, 2) * (8 + targetIntensity * 10);
  }
  const age = stats.ageMinutes;
  let ageSignal = 5;
  if (age !== null) {
    const idealAge = mode === "fresh" || targetPct >= 80 ? 90 : targetPct >= 50 ? 240 : 720;
    ageSignal = age <= idealAge ? 7 + targetIntensity * 5 : -clampNumber((age - idealAge) / idealAge, 0, 2) * (4 + targetIntensity * 7);
  }
  const riskPenalty = clampNumber(stats.rugRisk / 8, 0, 12)
    + clampNumber(stats.exitRisk / 9, 0, 12)
    + (/\b(wash|bundle|mutable|unknown risk|low liquidity)\b/i.test(ogreAiRiskText(row)) ? 4 : 0);
  const modeBonus = mode === "fresh" && age !== null && age <= 45 ? 5 : mode === "safer" && stats.liquidityUsd >= liquidityNeed ? 4 : 0;
  return Math.round(clampNumber(
    scoreSignal + momentumSignal + volumeSignal + liquiditySignal + buyPressureSignal + tradeSignal + capFit + ageSignal + modeBonus - riskPenalty,
    1,
    100
  ));
}

export function ogreAiTierForCandidate(row = {}, defaults = {}, mode = "quick") {
  const tokenMint = ogreAiSignalKey(row);
  if (!tokenMint || isOgreAiBlockedRisk(row)) return null;
  const stats = ogreAiCandidateStats(row);
  if (!stats.hasActivity) return null;

  const targetPct = ogreAiTargetProfitPct(defaults);
  const targetFit = ogreAiTargetFitScore(row, defaults, mode);
  const minScore = Number(defaults.minScore || 54);
  const maxMarketCap = Number(defaults.maxMarketCap || 750_000);
  const minLiquidityUsd = Number(defaults.minLiquidityUsd || 350);
  const highTarget = targetPct >= 80;
  const mediumTarget = targetPct >= 50;
  const freshAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 90 || stats.isPump;
  const normalAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 1440;
  const modeAgeOk = mode === "fresh" ? freshAgeOk : normalAgeOk;
  if (!modeAgeOk) return null;

  const targetMomentumOk = !highTarget
    || stats.positivePriceMomentumPct >= Math.max(8, targetPct * 0.12)
    || stats.volumeMomentumUsd >= Math.max(1_200, targetPct * 45)
    || stats.buyPressure >= 0.62
    || stats.isPump;
  const strictFitNeed = highTarget ? 62 : mediumTarget ? 58 : 54;
  const balancedFitNeed = highTarget ? 48 : mediumTarget ? 44 : 40;
  const availableFitNeed = highTarget ? 36 : mediumTarget ? 32 : 26;
  const strictLiquidityNeed = highTarget ? Math.max(90, minLiquidityUsd * 0.45) : minLiquidityUsd;
  const balancedLiquidityNeed = highTarget ? Math.max(60, minLiquidityUsd * 0.2) : Math.max(75, minLiquidityUsd * 0.35);
  const marketCapLimit = highTarget ? maxMarketCap * 0.9 : mediumTarget ? maxMarketCap * 1.1 : maxMarketCap;

  if (
    targetFit >= strictFitNeed
    && stats.score >= Math.max(30, minScore - (highTarget ? 18 : mediumTarget ? 8 : 0))
    && targetMomentumOk
    && (!stats.marketCap || stats.marketCap <= marketCapLimit)
    && (!stats.liquidityUsd || stats.liquidityUsd >= strictLiquidityNeed)
  ) {
    return "strict";
  }

  if (
    targetFit >= balancedFitNeed
    && stats.score >= Math.max(25, minScore - (highTarget ? 26 : 14))
    && (!highTarget || targetMomentumOk || stats.volumeMomentumUsd > 0)
    && (!stats.marketCap || stats.marketCap <= maxMarketCap * (highTarget ? 1.15 : 1.4))
    && (!stats.liquidityUsd || stats.liquidityUsd >= balancedLiquidityNeed)
  ) {
    return "balanced";
  }

  const hasMomentum = stats.volume5m > 0 || stats.volumeM15 > 0 || stats.volumeM30 > 0 || stats.volumeH1 > 0 || stats.isPump;
  if (
    targetFit >= availableFitNeed
    && stats.score >= 20
    && hasMomentum
    && (!stats.marketCap || stats.marketCap <= maxMarketCap * 2)
    && (!stats.liquidityUsd || stats.liquidityUsd >= 50 || stats.isPump)
  ) {
    return "available";
  }

  return null;
}

export function compareOgreAiCandidates(a = {}, b = {}, defaults = {}, mode = "quick") {
  return (ogreAiTargetFitScore(b, defaults, mode) - ogreAiTargetFitScore(a, defaults, mode))
    || (numberValue(b.bestPickScore, b.score) - numberValue(a.bestPickScore, a.score))
    || (ogreAiCandidateStats(b).positivePriceMomentumPct - ogreAiCandidateStats(a).positivePriceMomentumPct)
    || (numberValue(b.volume5m) - numberValue(a.volume5m))
    || (numberValue(b.volumeM15) - numberValue(a.volumeM15))
    || (numberValue(b.volumeH1) - numberValue(a.volumeH1))
    || (numberValue(b.liquidityUsd) - numberValue(a.liquidityUsd))
    || (numberValue(b.pairCreatedAt) - numberValue(a.pairCreatedAt));
}

function uniqueBySignalKey(rows = []) {
  const seen = new Set();
  const next = [];
  for (const row of rows || []) {
    const key = ogreAiSignalKey(row);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    next.push(row);
  }
  return next;
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
      if (isOgreAiBlockedRisk(row)) {
        blocked += 1;
        continue;
      }
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
    tiers[tier].push({
      ...row,
      ogreAiTier: tier,
      ogreAiTargetFit: ogreAiTargetFitScore(row, defaults, mode),
      ogreAiTargetPct: ogreAiTargetProfitPct(defaults)
    });
  }

  for (const tier of Object.keys(tiers)) {
    tiers[tier].sort((a, b) => compareOgreAiCandidates(a, b, defaults, mode));
  }

  const selectedTier = tiers.strict.length ? "strict" : tiers.balanced.length ? "balanced" : tiers.available.length ? "available" : tiers.scout.length ? "scout" : "none";
  const tierOrder = ["strict", "balanced", "available", "scout"];
  const desiredPickCount = Math.max(1, Number(defaults.desiredPickCount || 1));
  const selectedIndex = Math.max(0, tierOrder.indexOf(selectedTier));
  const candidates = selectedTier === "none"
    ? []
    : uniqueBySignalKey(
      (desiredPickCount > tiers[selectedTier].length
        ? tierOrder.slice(selectedIndex).flatMap((tier) => tiers[tier])
        : tiers[selectedTier])
    ).sort((a, b) => compareOgreAiCandidates(a, b, defaults, mode));
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
