export const LIVE_PAIR_BUCKETS = Object.freeze({
  live: { label: "Fresh Launches", minMinutes: 0, maxMinutes: 120 },
  under1h: { label: "Last 1h", minMinutes: 0, maxMinutes: 60 },
  under3h: { label: "Last 3h", minMinutes: 0, maxMinutes: 180 },
  under1d: { label: "Last 24h", minMinutes: 0, maxMinutes: 1440 }
});

export function normalizeLivePairBucket(bucket) {
  const normalized = String(bucket || "live").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
  const map = {
    live: "live",
    fresh: "live",
    last1h: "under1h",
    under1h: "under1h",
    onehour: "under1h",
    hour: "under1h",
    lasthour: "under1h",
    last3h: "under3h",
    under3h: "under3h",
    threehour: "under3h",
    last24h: "under1d",
    under1d: "under1d",
    day: "under1d",
    under24h: "under1d"
  };
  return map[normalized] || "live";
}

export function livePairBucketLabel(bucket) {
  return LIVE_PAIR_BUCKETS[normalizeLivePairBucket(bucket)]?.label || LIVE_PAIR_BUCKETS.live.label;
}

export function normalizePairTimestamp(value, now = Date.now()) {
  if (value === null || value === undefined || value === "") return null;
  let timestamp = null;

  if (typeof value === "number" || /^[0-9]+(?:\.[0-9]+)?$/.test(String(value).trim())) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) return null;
    timestamp = numeric < 1_000_000_000_000 ? numeric * 1000 : numeric;
  } else {
    const parsed = Date.parse(String(value));
    if (!Number.isFinite(parsed)) return null;
    timestamp = parsed;
  }

  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  if (timestamp > now + 5 * 60 * 1000) return null;
  return timestamp;
}

export function pairAgeMinutes(row, now = Date.now()) {
  if (row?.pairCreatedAt) {
    const createdAt = normalizePairTimestamp(row.pairCreatedAt, now);
    if (createdAt) return Math.max(0, (now - createdAt) / 60_000);
  }

  const trustedFallback = row?.trustPairAge === true
    || ["source-age", "trusted-source-age"].includes(String(row?.pairAgeSource || "").toLowerCase());
  if (!trustedFallback) return null;

  const seconds = Number(row?.pairAgeSeconds);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds / 60;

  const minutes = Number(row?.pairAgeMinutes);
  if (Number.isFinite(minutes) && minutes >= 0) return minutes;

  return null;
}

export function isLivePairInBucket(row, bucket, now = Date.now()) {
  const safeBucket = normalizeLivePairBucket(bucket);
  const window = LIVE_PAIR_BUCKETS[safeBucket] || LIVE_PAIR_BUCKETS.live;
  const age = pairAgeMinutes(row, now);
  if (age === null) return false;
  return age >= window.minMinutes && age < window.maxMinutes;
}

export function formatLivePairAge(row, now = Date.now()) {
  const age = pairAgeMinutes(row, now);
  if (age === null) return "age unknown";
  const seconds = Math.max(0, Math.floor(age * 60));
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 180) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

function parseLiveNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const compact = raw.replace(/[$,%_\s,]/g, "");
  const match = compact.match(/^([-+]?\d*\.?\d+)([kmb])?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  if (suffix === "k") return number * 1_000;
  if (suffix === "m") return number * 1_000_000;
  if (suffix === "b") return number * 1_000_000_000;
  return number;
}

function firstPositiveNumber(...values) {
  for (const value of values) {
    const number = parseLiveNumber(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  return 0;
}

export const PAIR_FILTER_MODES = Object.freeze({
  ALL: "ALL",
  SAFE: "SAFE",
  MAYHEM: "MAYHEM",
  CUSTOM: "CUSTOM"
});

export const PAIR_CATEGORIES = Object.freeze({
  FRESH: "fresh",
  NEW: "new",
  LIVE: "live",
  STEADY: "steady",
  GRADUATING: "graduating",
  GRADUATED: "graduated",
  MARKET_INTEL: "marketIntel",
  WATCHLIST: "watchlist",
  BUNDLE_VOLUME: "bundleVolume"
});

const HARD_BLOCKED_PAIR_RISK_RE = /\b(honeypot|honey\s*pot|blacklist|cannot sell|can't sell|sell disabled|sell blocked|trading disabled|no sell|no route|rug|scam)\b/i;
const ABSURD_THIN_LIQUIDITY_MARKET_CAP_USD = 100_000_000;
const ABSURD_THIN_LIQUIDITY_RATIO = 0.01;
const BROAD_NEW_WINDOW_MINUTES = 120;
const FRESH_LAUNCH_WINDOW_MINUTES = 30;
const PUMP_GRADUATING_MIN_MARKET_CAP_USD = 45_000;
const PUMP_GRADUATING_MAX_MARKET_CAP_USD = 180_000;
const PUMP_GRADUATED_MARKET_CAP_HINT_USD = 250_000;

function textBlob(row = {}) {
  return [
    row.source,
    row.category,
    row.status,
    row.dexId,
    row.dexName,
    row.market,
    row.platform,
    row.profileSource,
    row.labels,
    row.riskFlags,
    row.bestPickWarnings,
    row.scoreWarnings,
    row.safetyNote,
    row.tokenProgram,
    row.mintAuthority ? "mint authority" : "",
    row.freezeAuthority ? "freeze authority" : ""
  ].flat().filter(Boolean).join(" ").toLowerCase();
}

export function hasHardBlockedLivePairRisk(row = {}) {
  const text = textBlob(row);
  if (HARD_BLOCKED_PAIR_RISK_RE.test(text)) return true;
  const marketCap = firstPositiveNumber(row.marketCap, row.fdv);
  const liquidityUsd = firstPositiveNumber(row.liquidityUsd);
  return marketCap >= ABSURD_THIN_LIQUIDITY_MARKET_CAP_USD
    && (!liquidityUsd || liquidityUsd / marketCap < ABSURD_THIN_LIQUIDITY_RATIO);
}

export function pairRiskFlags(row = {}) {
  const text = textBlob(row);
  const flags = new Set(Array.isArray(row.riskFlags) ? row.riskFlags.map((flag) => String(flag)) : []);
  if (row.mintAuthority || /\b(mintable|mint authority|mint active)\b/i.test(text)) flags.add("mintAuthorityActive");
  if (row.freezeAuthority || /\b(freeze authority|freezable|freezeable|freeze active)\b/i.test(text)) flags.add("freezeAuthorityActive");
  if (row.isFreezeable || row.freezeable || row.freezable) flags.add("isFreezeable");
  if (row.mutableMetadata || /\bmutable metadata\b/i.test(text)) flags.add("mutableMetadata");
  if (row.tokenProgram && /token-?2022/i.test(String(row.tokenProgram))) flags.add("token2022");
  if (/\bmayhem\b/i.test(text)) flags.add("mayhemFlag");
  if (row.missingMetadata || (!row.name && !row.symbol && !row.imageUrl)) flags.add("missingMetadata");
  if (row.unknownRisk || row.safetyStatus === "pending" || row.safetyStatus === "unknown") flags.add("unknownRisk");
  if (hasHardBlockedLivePairRisk(row)) flags.add("honeypotSuspected");
  const liquidityUsd = firstPositiveNumber(row.liquidityUsd);
  if (liquidityUsd === 0) flags.add("lowLiquidity");
  const volume5m = firstPositiveNumber(row.volume5m, row.volumeM5);
  const volume1h = firstPositiveNumber(row.volumeH1, row.volume1h, row.volumeUsd);
  if (!volume5m && !volume1h) flags.add("lowVolume");
  return [...flags];
}

export function classifyPairCategory(row = {}, now = Date.now()) {
  if (isGraduatedSlimeScopePair(row)) return PAIR_CATEGORIES.GRADUATED;
  const progress = slimeScopeProgressPct(row);
  const marketCap = firstPositiveNumber(row.marketCap, row.fdv);
  const inGraduatingMarketCapBand = marketCap >= PUMP_GRADUATING_MIN_MARKET_CAP_USD
    && marketCap <= PUMP_GRADUATING_MAX_MARKET_CAP_USD;
  if ((progress >= 70 && (!marketCap || marketCap <= PUMP_GRADUATING_MAX_MARKET_CAP_USD)) || inGraduatingMarketCapBand) {
    return PAIR_CATEGORIES.GRADUATING;
  }

  const ageMinutes = pairAgeMinutes(row, now);
  const hints = [
    row.category,
    row.categoryHint,
    row.categoryHints,
    row.slimeScopeCategory,
    row.liveLabel,
    row.source,
    row.status
  ].flat().filter(Boolean).join(" ").toLowerCase();
  if ((Number.isFinite(ageMinutes) && ageMinutes >= 0 && ageMinutes <= BROAD_NEW_WINDOW_MINUTES) || /\b(fresh|new|launch|just listed|seconds old)\b/.test(hints)) {
    return PAIR_CATEGORIES.NEW;
  }

  const liquidityUsd = firstPositiveNumber(row.liquidityUsd);
  const volume = firstPositiveNumber(row.volume5m, row.volumeM5, row.volumeH1, row.volume1h, row.volumeUsd);
  const score = firstPositiveNumber(row.bestPickScore, row.score);
  if (liquidityUsd || volume || score) return PAIR_CATEGORIES.STEADY;

  return PAIR_CATEGORIES.STEADY;
}

export function isPairVisibleForCategory(row = {}, category = PAIR_CATEGORIES.LIVE, mode = PAIR_FILTER_MODES.ALL, now = Date.now()) {
  if (hasHardBlockedLivePairRisk(row)) return false;
  const safeMode = String(mode || PAIR_FILTER_MODES.ALL).toUpperCase();
  const flags = pairRiskFlags(row);
  if (safeMode === PAIR_FILTER_MODES.SAFE && flags.some((flag) => /mintAuthorityActive|freezeAuthorityActive|isFreezeable|mayhemFlag|honeypotSuspected|token2022/i.test(flag))) {
    return false;
  }
  if (safeMode === PAIR_FILTER_MODES.MAYHEM && !flags.some((flag) => /mayhem|mintAuthority|freezeAuthority|unknownRisk|lowLiquidity|lowVolume/i.test(flag))) {
    return false;
  }
  if (String(category) === PAIR_CATEGORIES.WATCHLIST) return true;
  if (String(category) === PAIR_CATEGORIES.BUNDLE_VOLUME) return true;

  const classified = classifyPairCategory(row, now);
  const ageMinutes = pairAgeMinutes(row, now);
  if (category === PAIR_CATEGORIES.FRESH || category === PAIR_CATEGORIES.NEW) {
    const hints = [
      row.category,
      row.categoryHint,
      row.categoryHints,
      row.slimeScopeCategory,
      row.liveLabel,
      row.source,
      row.status
    ].flat().filter(Boolean).join(" ").toLowerCase();
    const freshSignal = /\b(fresh|new|launch|just listed|seconds old|pump)\b/.test(hints);
    return classified === PAIR_CATEGORIES.NEW
      || freshSignal
      || (Number.isFinite(ageMinutes) && ageMinutes >= 0 && ageMinutes <= BROAD_NEW_WINDOW_MINUTES);
  }
  if (category === PAIR_CATEGORIES.GRADUATING) return classified === PAIR_CATEGORIES.GRADUATING;
  if (category === PAIR_CATEGORIES.GRADUATED) return classified === PAIR_CATEGORIES.GRADUATED;
  if (category === PAIR_CATEGORIES.STEADY) return classified === PAIR_CATEGORIES.STEADY;
  if (category === PAIR_CATEGORIES.MARKET_INTEL) {
    const liquidityUsd = firstPositiveNumber(row.liquidityUsd);
    const volume = firstPositiveNumber(row.volume5m, row.volumeM5, row.volumeH1, row.volume1h, row.volumeUsd);
    const score = firstPositiveNumber(row.bestPickScore, row.score);
    return liquidityUsd >= 1_000 || volume >= 1_000 || score >= 50 || classified === PAIR_CATEGORIES.GRADUATING;
  }
  return true;
}

export function slimeScopeProgressPct(row = {}) {
  const direct = firstPositiveNumber(
    row.bondingProgressPct,
    row.bondingProgress,
    row.bonding_curve_progress,
    row.bondingCurveProgress,
    row.pumpProgress,
    row.graduationProgress,
    row.completion,
    row.completePct
  );
  if (direct > 0) {
    return Math.max(0, Math.min(100, direct <= 1 ? direct * 100 : direct));
  }

  const marketCap = firstPositiveNumber(row.marketCap, row.fdv);
  const isPump = Boolean(row.isPump) || /pump/.test(textBlob(row)) || String(row.tokenMint || "").toLowerCase().endsWith("pump");
  if (isPump && marketCap > 0) {
    return Math.max(0, Math.min(99, (marketCap / 69_000) * 100));
  }
  return 0;
}

export function isGraduatedSlimeScopePair(row = {}) {
  if (row.isGraduated === true || row.graduated === true || row.bonded === true || row.isBonded === true) return true;
  if (row.complete === true || row.completed === true || row.bondingComplete === true) return true;
  if (row.raydiumPool || row.raydium_pool || row.poolAddress) return true;
  const text = textBlob(row);
  if (/\b(graduated|bonded|bonding complete|complete)\b/.test(text)) return true;
  const isPump = Boolean(row.isPump) || String(row.tokenMint || "").toLowerCase().endsWith("pump") || text.includes("pump");
  const marketCap = firstPositiveNumber(row.marketCap, row.fdv);
  if (isPump && marketCap >= PUMP_GRADUATED_MARKET_CAP_HINT_USD) return true;
  return isPump && /\b(raydium|meteora|orca)\b/.test(text);
}

export function classifySlimeScopePair(row = {}, now = Date.now()) {
  return classifyPairCategory(row, now);
}

export function computeBestPickScore(row = {}, now = Date.now()) {
  const age = pairAgeMinutes(row, now);
  const liquidityUsd = Number(row.liquidityUsd || 0);
  const volume5m = Number(row.volume5m || 0);
  const volumeH1 = Number(row.volumeH1 || row.volumeUsd || 0);
  const marketCap = Number(row.marketCap || row.fdv || 0);
  const buys = Number(row.buys5m || row.buysH1 || row.txns?.buys || row.buys || 0);
  const sells = Number(row.sells5m || row.sellsH1 || row.txns?.sells || row.sells || 0);
  const buyPressure = Number(row.buyPressure || (sells > 0 ? buys / sells : buys > 0 ? 2 : 1));
  const momentumPct = Math.max(Number(row.m5 || 0), Number(row.h1 || 0) * 0.55, Number(row.h6 || 0) * 0.25);
  const kolSignals = Number(row.kolSignalCount || row.kolCount || 0);
  const riskFlags = Array.isArray(row.riskFlags) ? row.riskFlags : [];
  const warnings = [];
  if (hasHardBlockedLivePairRisk(row)) {
    return {
      score: 1,
      label: "Blocked",
      inputs: {
        freshness: 0,
        liquidity: 0,
        volume: 0,
        momentum: 0,
        buyPressure: 0,
        kol: 0,
        marketCapFit: 0,
        riskPenalty: 100
      },
      warnings: ["hard safety block"]
    };
  }

  const freshness = age === null
    ? 8
    : age <= 5 ? 20
    : age <= 30 ? 18
    : age <= 60 ? 15
    : age <= 180 ? 11
    : age <= 1440 ? 7
    : 2;
  if (age === null) warnings.push("age unknown");

  const liquidity = liquidityUsd > 0 ? Math.min(18, Math.log10(Math.max(10, liquidityUsd)) * 3.6) : 3;
  if (!liquidityUsd) warnings.push("liquidity unknown");

  const volume = volume5m || volumeH1
    ? Math.min(18, Math.log10(Math.max(1, volume5m * 4 + volumeH1)) * 3.2)
    : 2;
  if (!volume5m && !volumeH1) warnings.push("volume unknown");

  const pressure = Math.max(-8, Math.min(12, Math.round((buyPressure - 1) * 10)));
  const momentum = Math.max(-10, Math.min(16, momentumPct * 0.45));
  const kol = Math.min(10, kolSignals * 2);
  const marketCapFit = marketCap > 0 && marketCap <= 60_000
    ? 8
    : marketCap > 0 && marketCap <= 250_000
      ? 5
      : marketCap > 0 && marketCap <= 1_000_000
        ? 2
        : 0;
  if (!marketCap) warnings.push("market cap unknown");

  const hardRisk = riskFlags.filter((flag) => /dump|sell pressure|freeze|mint|honeypot|blocked/i.test(String(flag))).length;
  const riskPenalty = hardRisk * 12 + Number(row.rugRisk || 0) * 0.12 + Number(row.exitRisk || 0) * 0.08;
  const score = Math.max(1, Math.min(100, Math.round(24 + freshness + liquidity + volume + pressure + momentum + kol + marketCapFit - riskPenalty)));

  return {
    score,
    label: score >= 80 ? "A" : score >= 65 ? "B" : score >= 50 ? "C" : "Watch",
    inputs: {
      freshness: Math.round(freshness),
      liquidity: Math.round(liquidity),
      volume: Math.round(volume),
      momentum: Math.round(momentum),
      buyPressure: Math.round(pressure),
      kol,
      marketCapFit,
      riskPenalty: Math.round(riskPenalty)
    },
    warnings
  };
}

export function sortLivePairs(rows = [], sort = "best", now = Date.now()) {
  const copied = [...rows];
  const value = String(sort || "best").toLowerCase();
  const numeric = (row, key) => Number(row?.[key] || 0);

  if (value === "newest") {
    return copied.sort((a, b) => (normalizePairTimestamp(b.pairCreatedAt, now) || 0) - (normalizePairTimestamp(a.pairCreatedAt, now) || 0));
  }
  if (value === "volume") return copied.sort((a, b) => numeric(b, "volumeH1") - numeric(a, "volumeH1") || numeric(b, "volume5m") - numeric(a, "volume5m"));
  if (value === "liquidity") return copied.sort((a, b) => numeric(b, "liquidityUsd") - numeric(a, "liquidityUsd"));
  if (value === "buys") return copied.sort((a, b) => numeric(b, "buys5m") + numeric(b, "buysH1") - numeric(a, "buys5m") - numeric(a, "buysH1"));
  if (value === "momentum") return copied.sort((a, b) => Math.max(numeric(b, "m5"), numeric(b, "h1")) - Math.max(numeric(a, "m5"), numeric(a, "h1")));
  if (value === "risk") return copied.sort((a, b) => numeric(b, "rugRisk") + numeric(b, "exitRisk") - numeric(a, "rugRisk") - numeric(a, "exitRisk"));

  return copied.sort((a, b) => {
    const aScore = Number(a.bestPickScore || a.score || computeBestPickScore(a, now).score);
    const bScore = Number(b.bestPickScore || b.score || computeBestPickScore(b, now).score);
    return bScore - aScore
      || (normalizePairTimestamp(b.pairCreatedAt, now) || 0) - (normalizePairTimestamp(a.pairCreatedAt, now) || 0);
  });
}
