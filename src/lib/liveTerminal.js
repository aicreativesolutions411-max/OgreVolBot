export const LIVE_PAIR_BUCKETS = Object.freeze({
  live: { label: "Live", minMinutes: 0, maxMinutes: 10 },
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
    row.riskFlags
  ].flat().filter(Boolean).join(" ").toLowerCase();
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
  return isPump && /\b(raydium|meteora|orca)\b/.test(text);
}

export function classifySlimeScopePair(row = {}, now = Date.now()) {
  if (isGraduatedSlimeScopePair(row)) return "graduated";

  const progress = slimeScopeProgressPct(row);
  const marketCap = firstPositiveNumber(row.marketCap, row.fdv);
  if (progress >= 70 || marketCap >= 45_000) return "graduating";

  const age = pairAgeMinutes(row, now);
  const isPump = Boolean(row.isPump) || /pump/.test(textBlob(row)) || String(row.tokenMint || "").toLowerCase().endsWith("pump");
  if (isPump || age === null || age <= 60) return "new";
  return "unknown";
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
