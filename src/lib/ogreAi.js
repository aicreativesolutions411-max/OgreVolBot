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

const OGRE_AI_HARD_BLOCKED_RISK_RE = /\b(honeypot|honey\s*pot|mintable|mint authority|freeze authority|freezable|freezeable|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam|liquidity pulled|liquidity removed|liquidity drained|lp pulled|lp removed|lp drained|pool drained|no liquidity|liquidity drain|drained liquidity)\b/i;
const OGRE_AI_ABSURD_MARKET_CAP_USD = 25_000_000;
const OGRE_AI_THIN_LIQUIDITY_MARKET_CAP_USD = 5_000_000;
const OGRE_AI_THIN_LIQUIDITY_RATIO = 0.01;
const OGRE_AI_FRESH_APE_MIN_MC_USD = 2_500;
const OGRE_AI_FRESH_APE_PRIMARY_MAX_MC_USD = 10_000;
const OGRE_AI_FRESH_APE_FALLBACK_MAX_MC_USD = 35_000;
const OGRE_AI_FRESH_APE_MAX_AGE_MINUTES = 75;
const OGRE_AI_FRESH_APE_MIN_STARTING_VOLUME_USD = 60;

function isFreshApeMode(mode) {
  const value = String(mode || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  return value === "fresh_ape" || value === "freshape" || value === "ape";
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
    row.safetyNote,
    row.tokenProgram,
    row.safetyStatus,
    row.slimeShieldVerdict,
    row.devInfoStatus,
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
  const volumeToMarketCap = marketCap > 0 ? volumeMomentumUsd / marketCap : 0;
  const liquidityToMarketCap = marketCap > 0 ? liquidityUsd / marketCap : 0;
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
    volumeToMarketCap,
    liquidityToMarketCap,
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

function ogreAiFreshApeCapInfo(stats = {}, defaults = {}) {
  const minMarketCap = Number(defaults.minMarketCap || OGRE_AI_FRESH_APE_MIN_MC_USD);
  const primaryMax = Number(defaults.preferredMaxMarketCap || OGRE_AI_FRESH_APE_PRIMARY_MAX_MC_USD);
  const fallbackMax = Number(defaults.maxMarketCap || OGRE_AI_FRESH_APE_FALLBACK_MAX_MC_USD);
  const marketCap = Number(stats.marketCap || 0);
  const base = { minMarketCap, primaryMax, fallbackMax, marketCap };
  if (!marketCap) return { ...base, band: "unknown", ok: true, primary: false };
  if (marketCap < minMarketCap) return { ...base, band: "too_low", ok: false, primary: false };
  if (marketCap <= primaryMax) return { ...base, band: "primary", ok: true, primary: true };
  if (marketCap <= fallbackMax) return { ...base, band: "fallback", ok: true, primary: false };
  return { ...base, band: "too_high", ok: false, primary: false };
}

function ogreAiFreshApeHasStartingVolume(stats = {}, defaults = {}) {
  const minVolume = Number(defaults.minStartingVolumeUsd || OGRE_AI_FRESH_APE_MIN_STARTING_VOLUME_USD);
  if (stats.volumeMomentumUsd >= minVolume) return true;
  if (stats.volume5m >= minVolume * 0.65) return true;
  if (stats.volumeToMarketCap >= 0.012 && stats.trades5m >= 1) return true;
  if (stats.buys5m >= 2 && stats.buyPressure >= 0.45) return true;
  if (stats.trades5m >= 2 && stats.buyPressure >= 0.5) return true;
  return stats.positivePriceMomentumPct >= 3 && stats.trades5m >= 1;
}

function ogreAiFreshApeFitScore(row = {}, defaults = {}) {
  const stats = ogreAiCandidateStats(row);
  const cap = ogreAiFreshApeCapInfo(stats, defaults);
  const minVolume = Number(defaults.minStartingVolumeUsd || OGRE_AI_FRESH_APE_MIN_STARTING_VOLUME_USD);
  const startingVolume = ogreAiFreshApeHasStartingVolume(stats, defaults);
  const scoreSignal = clampNumber(stats.score, 0, 100) * 0.18;
  let capFit = 8;
  if (cap.band === "primary") capFit = 28;
  else if (cap.band === "fallback") capFit = 10 - clampNumber((stats.marketCap - cap.primaryMax) / Math.max(cap.fallbackMax - cap.primaryMax, 1), 0, 1) * 8;
  else if (cap.band === "too_low") capFit = -18;
  else if (cap.band === "too_high") capFit = -28;

  let ageSignal = 8;
  if (stats.ageMinutes !== null) {
    if (stats.ageMinutes <= 3) ageSignal = 20;
    else if (stats.ageMinutes <= 8) ageSignal = 17;
    else if (stats.ageMinutes <= 20) ageSignal = 13;
    else if (stats.ageMinutes <= 45) ageSignal = 7;
    else if (stats.ageMinutes <= OGRE_AI_FRESH_APE_MAX_AGE_MINUTES) ageSignal = 1;
    else ageSignal = -clampNumber((stats.ageMinutes - OGRE_AI_FRESH_APE_MAX_AGE_MINUTES) / 45, 0, 3) * 12;
  }

  const volumeSignal = clampNumber(stats.volumeMomentumUsd / Math.max(1, minVolume), 0, 1.8) * 18;
  const relativeVolumeSignal = (
    stats.volumeToMarketCap >= 0.1 ? 12
      : stats.volumeToMarketCap >= 0.05 ? 9
        : stats.volumeToMarketCap >= 0.02 ? 6
          : stats.volumeToMarketCap >= 0.012 ? 3
            : 0
  );
  const tradeSignal = clampNumber(stats.trades5m / 4, 0, 1.2) * 8;
  const buyPressureSignal = clampNumber((stats.buyPressure - 0.45) / 0.3, -1, 1) * 8;
  const momentumSignal = clampNumber(stats.positivePriceMomentumPct / 8, 0, 1.25) * 8;
  const liquidityNeed = Math.max(10, Number(defaults.minLiquidityUsd || 20));
  const liquiditySignal = stats.liquidityUsd
    ? clampNumber(stats.liquidityUsd / liquidityNeed, 0, 1.2) * 6
      + (stats.liquidityToMarketCap >= 0.015 ? 4 : stats.liquidityToMarketCap >= 0.006 ? 2 : 0)
    : (stats.isPump ? 2 : 0);
  const riskPenalty = clampNumber(stats.rugRisk / 8, 0, 12)
    + clampNumber(stats.exitRisk / 9, 0, 12)
    + (/\b(wash|bundle|mutable|unknown risk|low liquidity)\b/i.test(ogreAiRiskText(row)) ? 4 : 0);
  const deadPenalty = startingVolume ? 0 : (
    stats.ageMinutes !== null && stats.ageMinutes <= 10 ? 18 : 28
  );
  return Math.round(clampNumber(
    scoreSignal
      + capFit
      + ageSignal
      + volumeSignal
      + relativeVolumeSignal
      + tradeSignal
      + buyPressureSignal
      + momentumSignal
      + liquiditySignal
      + (startingVolume ? 8 : 0)
      - riskPenalty
      - deadPenalty,
    1,
    100
  ));
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
  if (isFreshApeMode(mode)) return ogreAiFreshApeFitScore(row, defaults);
  const stats = ogreAiCandidateStats(row);
  const targetPct = ogreAiTargetProfitPct(defaults);
  const targetIntensity = clampNumber((targetPct - 25) / 100, 0, 1);
  const highTarget = targetPct >= 80;
  const steadyTarget = targetPct <= 30;
  const scoreSignal = clampNumber(stats.score, 0, 100) * (0.34 - targetIntensity * 0.08);
  const earlyPair = stats.ageMinutes !== null && stats.ageMinutes <= 45;
  const momentumNeed = Math.max(4, targetPct * (earlyPair && highTarget ? 0.11 : 0.18 + targetIntensity * 0.08));
  const momentumSignal = clampNumber(stats.positivePriceMomentumPct / momentumNeed, 0, 1.35) * (18 + targetIntensity * 18);
  const volumeBase = Math.max(
    earlyPair && highTarget ? 120 : 250,
    stats.liquidityUsd * (earlyPair && highTarget ? 0.18 : 0.35),
    targetPct * (earlyPair && highTarget ? 12 : 35)
  );
  const volumeSignal = clampNumber(stats.volumeMomentumUsd / volumeBase, 0, 1.25) * (12 + targetIntensity * 12);
  const liquidityNeed = Math.max(80, Number(defaults.minLiquidityUsd || 350) * (targetIntensity > 0.5 ? 0.55 : 1));
  const liquiditySignal = clampNumber(stats.liquidityUsd / liquidityNeed, 0, 1.15) * (targetIntensity > 0.5 ? 8 : 15);
  const buyPressureSignal = clampNumber((stats.buyPressure - 0.5) / 0.25, -0.8, 1) * (7 + targetIntensity * 5);
  const tradeSignal = clampNumber(stats.trades5m / Math.max(3, targetPct / 12), 0, 1) * (4 + targetIntensity * 4);
  const marketCap = stats.marketCap;
  const maxMarketCap = Number(defaults.maxMarketCap || 750_000);
  let capFit = 8;
  if (marketCap > 0) {
    if (highTarget) {
      const idealLow = 6_000;
      const idealHigh = Math.min(maxMarketCap, 220_000);
      if (marketCap < idealLow) capFit = 4;
      else if (marketCap <= idealHigh) capFit = 20;
      else if (marketCap <= maxMarketCap) capFit = 7;
      else capFit = -clampNumber((marketCap - maxMarketCap) / Math.max(maxMarketCap, 1), 0, 2.5) * 18;
    } else if (steadyTarget) {
      const idealLow = 70_000;
      const idealHigh = Math.min(Math.max(maxMarketCap, 1_200_000), 1_800_000);
      if (marketCap < 15_000) capFit = -8;
      else if (marketCap < idealLow) capFit = 1;
      else if (marketCap <= idealHigh) capFit = 15;
      else capFit = -clampNumber((marketCap - idealHigh) / Math.max(idealHigh, 1), 0, 2) * 8;
    } else {
      const idealLow = targetPct >= 50 ? 15_000 : 25_000;
      const idealHigh = targetPct >= 50 ? Math.min(maxMarketCap, 550_000) : maxMarketCap;
      if (marketCap < idealLow) capFit = 2;
      else if (marketCap <= idealHigh) capFit = 11 + targetIntensity * 8;
      else capFit = -clampNumber((marketCap - idealHigh) / Math.max(idealHigh, 1), 0, 2) * (8 + targetIntensity * 10);
    }
  }
  const age = stats.ageMinutes;
  let ageSignal = 5;
  if (age !== null) {
    if (highTarget) {
      if (age <= 30) ageSignal = 18;
      else if (age <= 90) ageSignal = 12;
      else if (age <= 150) ageSignal = 1;
      else ageSignal = -clampNumber((age - 150) / 150, 0, 2) * 18;
    } else if (steadyTarget) {
      if (age < 5) ageSignal = -10;
      else if (age < 30) ageSignal = 2;
      else if (age <= 360) ageSignal = 14;
      else if (age <= 1440) ageSignal = 8;
      else ageSignal = -clampNumber((age - 1440) / 1440, 0, 2) * 6;
    } else {
      const idealAge = mode === "fresh" ? 90 : targetPct >= 50 ? 240 : 720;
      ageSignal = age <= idealAge ? 7 + targetIntensity * 5 : -clampNumber((age - idealAge) / idealAge, 0, 2) * (4 + targetIntensity * 7);
    }
  }
  const targetShapeBonus = highTarget
    ? (stats.marketCap > 0 && stats.marketCap <= 220_000 ? 8 : 0)
      + (stats.ageMinutes !== null && stats.ageMinutes <= 45 ? 7 : 0)
      + (stats.buyPressure >= 0.62 ? 5 : 0)
    : steadyTarget
      ? (stats.liquidityUsd >= Math.max(800, Number(defaults.minLiquidityUsd || 0)) ? 8 : 0)
        + (stats.ageMinutes !== null && stats.ageMinutes >= 30 && stats.ageMinutes <= 1440 ? 7 : 0)
        + (stats.positivePriceMomentumPct >= 3 && stats.positivePriceMomentumPct <= 35 ? 5 : 0)
      : 0;
  const earlyMomentumBonus = (highTarget || defaults.preferFreshLaunches)
    ? (
        (stats.ageMinutes !== null && stats.ageMinutes <= 5 ? 14 : stats.ageMinutes !== null && stats.ageMinutes <= 12 ? 11 : stats.ageMinutes !== null && stats.ageMinutes <= 30 ? 8 : stats.ageMinutes !== null && stats.ageMinutes <= 60 ? 4 : 0)
        + (stats.marketCap >= 3_000 && stats.marketCap <= 125_000 ? 10 : stats.marketCap > 125_000 && stats.marketCap <= 220_000 ? 5 : 0)
        + (stats.volumeToMarketCap >= 0.08 ? 9 : stats.volumeToMarketCap >= 0.04 ? 6 : stats.volumeToMarketCap >= 0.018 ? 3 : 0)
        + (stats.trades5m >= 10 ? 4 : stats.trades5m >= 4 ? 2 : 0)
      )
    : 0;
  const staleUpsidePenalty = highTarget
    ? (
        (stats.ageMinutes !== null && stats.ageMinutes > 150 ? clampNumber((stats.ageMinutes - 150) / 60, 0, 4) * 8 : 0)
        + (stats.volumeMomentumUsd < Math.max(600, targetPct * 25, stats.marketCap * 0.008) && stats.positivePriceMomentumPct < Math.max(8, targetPct * 0.1) ? 14 : 0)
        + (stats.trades5m > 0 && stats.trades5m < 3 ? 5 : 0)
      )
    : 0;
  const riskPenalty = clampNumber(stats.rugRisk / 8, 0, 12)
    + clampNumber(stats.exitRisk / 9, 0, 12)
    + (/\b(wash|bundle|mutable|unknown risk|low liquidity)\b/i.test(ogreAiRiskText(row)) ? 4 : 0);
  const modeBonus = mode === "fresh" && age !== null && age <= 45 ? 5 : mode === "safer" && stats.liquidityUsd >= liquidityNeed ? 4 : 0;
  return Math.round(clampNumber(
    scoreSignal + momentumSignal + volumeSignal + liquiditySignal + buyPressureSignal + tradeSignal + capFit + ageSignal + targetShapeBonus + earlyMomentumBonus + modeBonus - riskPenalty - staleUpsidePenalty,
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
  if (isFreshApeMode(mode)) {
    const cap = ogreAiFreshApeCapInfo(stats, defaults);
    const maxAgeMinutes = Number(defaults.maxAgeMinutes || OGRE_AI_FRESH_APE_MAX_AGE_MINUTES);
    const freshOk = stats.ageMinutes === null || stats.ageMinutes <= maxAgeMinutes;
    const startingVolume = ogreAiFreshApeHasStartingVolume(stats, defaults);
    const buyIntentOk = stats.trades5m <= 0 || stats.buyPressure >= 0.42 || stats.buys5m >= 1;
    const liquidityOk = !stats.liquidityUsd
      || stats.liquidityUsd >= Number(defaults.minLiquidityUsd || 20)
      || stats.liquidityToMarketCap >= 0.006
      || stats.isPump;
    const scoreOk = stats.score >= Math.max(5, Number(defaults.minScore || 12) - 6)
      || stats.trades5m >= 2
      || stats.volumeToMarketCap >= 0.012;
    if (!freshOk || !cap.ok || !startingVolume || !buyIntentOk || !liquidityOk || !scoreOk) return null;
    if (cap.band === "primary" && targetFit >= 45 && (stats.ageMinutes === null || stats.ageMinutes <= 30)) return "strict";
    if ((cap.band === "primary" || cap.band === "unknown") && targetFit >= 30) return "balanced";
    if ((cap.band === "primary" || cap.band === "fallback" || cap.band === "unknown") && targetFit >= Math.max(18, Number(defaults.minScore || 12))) return "available";
    return null;
  }
  const highTarget = targetPct >= 80;
  const mediumTarget = targetPct >= 50;
  const steadyTarget = targetPct <= 30;
  const earlyPair = stats.ageMinutes !== null && stats.ageMinutes <= 45;
  const superFreshPair = stats.ageMinutes !== null && stats.ageMinutes <= 15;
  const lowMarketCap = stats.marketCap > 0 && stats.marketCap <= Math.min(maxMarketCap, 180_000);
  const highTargetAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 180;
  const freshAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 240;
  const normalAgeOk = stats.ageMinutes === null || stats.ageMinutes <= 1440;
  const modeAgeOk = highTarget ? highTargetAgeOk : mode === "fresh" ? freshAgeOk : normalAgeOk;
  if (!modeAgeOk) return null;

  const highTargetActivityOk = !highTarget
    || stats.volumeMomentumUsd >= Math.max(250, targetPct * 12, stats.marketCap * 0.004)
    || stats.volumeToMarketCap >= 0.012
    || (stats.positivePriceMomentumPct >= Math.max(4, targetPct * 0.055) && stats.trades5m >= (superFreshPair ? 1 : 2))
    || (stats.buyPressure >= 0.58 && stats.trades5m >= (superFreshPair ? 2 : 3))
    || (superFreshPair && lowMarketCap && (stats.isPump || stats.score >= 25));
  const pumpMomentumOk = stats.isPump
    && (stats.ageMinutes === null || stats.ageMinutes <= 180)
    && (stats.volumeMomentumUsd >= Math.max(250, targetPct * 10) || stats.trades5m >= 2 || stats.positivePriceMomentumPct >= Math.max(4, targetPct * 0.05));
  const targetMomentumOk = !highTarget
    || stats.positivePriceMomentumPct >= Math.max(4, targetPct * 0.06)
    || stats.volumeMomentumUsd >= Math.max(350, targetPct * 16)
    || stats.volumeToMarketCap >= 0.015
    || stats.buyPressure >= 0.58
    || (superFreshPair && lowMarketCap && stats.score >= 25)
    || pumpMomentumOk;
  const strictFitNeed = highTarget ? 54 : mediumTarget ? 58 : 54;
  const balancedFitNeed = highTarget ? 38 : mediumTarget ? 44 : 40;
  const availableFitNeed = highTarget ? 24 : mediumTarget ? 32 : 26;
  const strictLiquidityNeed = highTarget ? Math.max(45, minLiquidityUsd * 0.22) : minLiquidityUsd;
  const balancedLiquidityNeed = highTarget ? Math.max(25, minLiquidityUsd * 0.12) : Math.max(75, minLiquidityUsd * 0.35);
  const marketCapLimit = highTarget ? maxMarketCap : mediumTarget ? maxMarketCap * 1.1 : maxMarketCap;
  const targetShapeOk = highTarget
    ? (!stats.marketCap || stats.marketCap <= maxMarketCap) && (stats.ageMinutes === null || stats.ageMinutes <= 180)
    : steadyTarget
      ? (stats.ageMinutes === null || stats.ageMinutes >= 12 || stats.liquidityUsd >= minLiquidityUsd * 2)
      : true;

  if (
    targetFit >= strictFitNeed
    && stats.score >= Math.max(30, minScore - (highTarget ? 18 : mediumTarget ? 8 : 0))
    && targetShapeOk
    && targetMomentumOk
    && highTargetActivityOk
    && (!stats.marketCap || stats.marketCap <= marketCapLimit)
    && (!stats.liquidityUsd || stats.liquidityUsd >= strictLiquidityNeed)
  ) {
    return "strict";
  }

  if (
    targetFit >= balancedFitNeed
    && stats.score >= Math.max(25, minScore - (highTarget ? 26 : 14))
    && targetShapeOk
    && (!highTarget || (targetMomentumOk && highTargetActivityOk))
    && (!stats.marketCap || stats.marketCap <= maxMarketCap * (highTarget ? 1.15 : 1.4))
    && (!stats.liquidityUsd || stats.liquidityUsd >= balancedLiquidityNeed)
  ) {
    return "balanced";
  }

  const hasMomentum = stats.volume5m > 0 || stats.volumeM15 > 0 || stats.volumeM30 > 0 || stats.volumeH1 > 0 || stats.isPump;
  if (
    targetFit >= availableFitNeed
    && stats.score >= (highTarget && earlyPair ? 12 : 20)
    && targetShapeOk
    && hasMomentum
    && (!highTarget || highTargetActivityOk)
    && (!stats.marketCap || stats.marketCap <= maxMarketCap * 2)
    && (!stats.liquidityUsd || stats.liquidityUsd >= (highTarget && earlyPair ? 15 : 50) || stats.isPump)
  ) {
    return "available";
  }

  return null;
}

export function compareOgreAiCandidates(a = {}, b = {}, defaults = {}, mode = "quick") {
  if (isFreshApeMode(mode)) {
    const aStats = ogreAiCandidateStats(a);
    const bStats = ogreAiCandidateStats(b);
    const aCap = ogreAiFreshApeCapInfo(aStats, defaults);
    const bCap = ogreAiFreshApeCapInfo(bStats, defaults);
    return (ogreAiTargetFitScore(b, defaults, mode) - ogreAiTargetFitScore(a, defaults, mode))
      || ((bCap.primary ? 1 : 0) - (aCap.primary ? 1 : 0))
      || (Number(ogreAiFreshApeHasStartingVolume(bStats, defaults)) - Number(ogreAiFreshApeHasStartingVolume(aStats, defaults)))
      || (bStats.volumeToMarketCap - aStats.volumeToMarketCap)
      || (bStats.volumeMomentumUsd - aStats.volumeMomentumUsd)
      || (bStats.buys5m - aStats.buys5m)
      || (numberValue(b.bestPickScore, b.score) - numberValue(a.bestPickScore, a.score))
      || (numberValue(b.pairCreatedAt) - numberValue(a.pairCreatedAt));
  }
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

function signalSet(values = []) {
  const source = Array.isArray(values) ? values : String(values || "").split(/[,\s]+/);
  const set = new Set();
  for (const value of source) {
    const key = String(value || "").trim();
    if (key) set.add(key);
  }
  return set;
}

function ogreAiDiversityScore(row = {}, defaults = {}, mode = "quick", recentSet = new Set(), index = 0) {
  const stats = ogreAiCandidateStats(row);
  if (isFreshApeMode(mode)) {
    const cap = ogreAiFreshApeCapInfo(stats, defaults);
    let score = ogreAiTargetFitScore(row, defaults, mode)
      + numberValue(row.bestPickScore, row.score) * 0.06
      - index * 0.04;
    if (cap.band === "primary") score += 18;
    else if (cap.band === "fallback") score -= 8;
    else if (cap.band === "too_low") score -= 22;
    else if (cap.band === "too_high") score -= 34;
    if (ogreAiFreshApeHasStartingVolume(stats, defaults)) score += 14;
    else score -= 35;
    if (stats.ageMinutes !== null && stats.ageMinutes <= 5) score += 18;
    else if (stats.ageMinutes !== null && stats.ageMinutes <= 15) score += 12;
    else if (stats.ageMinutes !== null && stats.ageMinutes > OGRE_AI_FRESH_APE_MAX_AGE_MINUTES) score -= 28;
    if (recentSet.has(ogreAiSignalKey(row))) score -= 52;
    return score;
  }
  const targetPct = ogreAiTargetProfitPct(defaults);
  const highTarget = targetPct >= 80;
  let score = ogreAiTargetFitScore(row, defaults, mode)
    + numberValue(row.bestPickScore, row.score) * 0.08
    - index * 0.08;

  if (highTarget || defaults.preferFreshLaunches) {
    if (stats.ageMinutes !== null && stats.ageMinutes <= 5) score += 16;
    else if (stats.ageMinutes !== null && stats.ageMinutes <= 15) score += 12;
    else if (stats.ageMinutes !== null && stats.ageMinutes <= 60) score += 6;
    else if (stats.ageMinutes !== null && stats.ageMinutes > 120) score -= 14;
    if (stats.marketCap >= 3_000 && stats.marketCap <= 125_000) score += 12;
    else if (stats.marketCap > 125_000 && stats.marketCap <= 220_000) score += 5;
    if (stats.volumeMomentumUsd >= Math.max(350, targetPct * 16) || stats.volumeToMarketCap >= 0.018) score += 7;
    if (stats.buyPressure >= 0.62 && stats.trades5m >= 4) score += 4;
  }

  if (recentSet.has(ogreAiSignalKey(row))) {
    score -= highTarget || defaults.preferFreshLaunches ? 44 : 24;
  }

  return score;
}

export function diversifyOgreAiCandidates(candidates = [], defaults = {}, mode = "quick", options = {}) {
  const desiredPickCount = Math.max(1, Number(options.desiredPickCount || defaults.desiredPickCount || 1) || 1);
  const recentSet = signalSet(options.recentMints || options.avoidMints || defaults.recentMints || []);
  const base = uniqueBySignalKey(candidates)
    .sort((a, b) => compareOgreAiCandidates(a, b, defaults, mode));
  if (!base.length) return [];

  const shouldRescore = recentSet.size > 0 || defaults.preferFreshLaunches || ogreAiTargetProfitPct(defaults) >= 80;
  if (!shouldRescore) return base;

  const scored = base.map((row, index) => ({
    row,
    index,
    recent: recentSet.has(ogreAiSignalKey(row)),
    score: ogreAiDiversityScore(row, defaults, mode, recentSet, index)
  }));

  const byScore = (a, b) => (b.score - a.score)
    || compareOgreAiCandidates(a.row, b.row, defaults, mode)
    || (a.index - b.index);

  const fresh = scored.filter((entry) => !entry.recent).sort(byScore);
  const deferred = scored.filter((entry) => entry.recent).sort(byScore);
  if (fresh.length >= desiredPickCount) {
    return [...fresh, ...deferred].map((entry) => ({
      ...entry.row,
      ogreAiRecentlyPicked: entry.recent || undefined
    }));
  }

  return [...scored].sort(byScore).map((entry) => ({
    ...entry.row,
    ogreAiRecentlyPicked: entry.recent || undefined
  }));
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
      if (isFreshApeMode(mode)) {
        const cap = ogreAiFreshApeCapInfo(stats, defaults);
        const maxAgeMinutes = Number(defaults.maxAgeMinutes || OGRE_AI_FRESH_APE_MAX_AGE_MINUTES);
        const ageOk = stats.ageMinutes === null || stats.ageMinutes <= maxAgeMinutes;
        const hasSomeSignal = ogreAiFreshApeHasStartingVolume(stats, defaults)
          && (
            stats.score >= 5
            || stats.trades5m >= 1
            || Array.isArray(row.bestPickInputs) && row.bestPickInputs.length > 0
            || Array.isArray(row.reasons) && row.reasons.length > 0
          );
        if (ageOk && cap.ok && hasSomeSignal) {
          tiers.scout.push({
            ...row,
            ogreAiTier: "scout",
            ogreAiTargetFit: ogreAiTargetFitScore(row, defaults, mode),
            ogreAiTargetPct: ogreAiTargetProfitPct(defaults)
          });
          continue;
        }
        blocked += 1;
        continue;
      }
      const maxMarketCap = Number(defaults.maxMarketCap || 750_000);
      const targetPct = ogreAiTargetProfitPct(defaults);
      const earlyTarget = targetPct >= 80 || defaults.preferFreshLaunches;
      const ageOk = stats.ageMinutes === null
        || stats.ageMinutes <= (earlyTarget ? 180 : mode === "fresh" ? 180 : 1440);
      const capOk = !stats.marketCap || stats.marketCap <= maxMarketCap * (earlyTarget ? 1.5 : 3);
      const hasSomeSignal = stats.hasActivity
        || stats.score > 0
        || (earlyTarget && stats.isPump && stats.ageMinutes !== null && stats.ageMinutes <= 45)
        || Array.isArray(row.bestPickInputs) && row.bestPickInputs.length > 0
        || Array.isArray(row.reasons) && row.reasons.length > 0;
      if (ageOk && capOk && hasSomeSignal) {
        tiers.scout.push({
          ...row,
          ogreAiTier: "scout",
          ogreAiTargetFit: ogreAiTargetFitScore(row, defaults, mode),
          ogreAiTargetPct: ogreAiTargetProfitPct(defaults)
        });
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
