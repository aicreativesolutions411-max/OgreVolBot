const BLOCKED_TREND_PATTERN = /\b(?:shooting|murder|killed|dead|death|funeral|suicide|self[ -]?harm|rape|assault|war|terror|bomb|hostage|missing child|school|election|president|senator|congress|disease|outbreak|pandemic|earthquake|hurricane|wildfire|flood|tragedy|memorial|minor|underage|nsfw|porn|nude|hate|slur)\b/i;

const GENERIC_WORDS = new Set([
  "the", "and", "for", "with", "from", "this", "that", "what", "when", "where",
  "viral", "trending", "trend", "meme", "memes", "video", "photo", "today", "official"
]);

export const TREND_LAUNCH_RIGHTS_VERSION = "x-media-v1";
export const TREND_LAUNCH_MIN_RATE = 1;
export const TREND_LAUNCH_MAX_RATE = 4;
export const TREND_LAUNCH_MAX_DAILY = 24;

export function cleanTrendLaunchText(value = "", max = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function normalizeTrendLaunchRate(value) {
  const parsed = Math.round(Number(value) || TREND_LAUNCH_MIN_RATE);
  return Math.max(TREND_LAUNCH_MIN_RATE, Math.min(TREND_LAUNCH_MAX_RATE, parsed));
}

export function normalizeTrendLaunchDailyLimit(value) {
  const parsed = Math.round(Number(value) || 24);
  return Math.max(1, Math.min(TREND_LAUNCH_MAX_DAILY, parsed));
}

export function trendLaunchIntervalMs(launchesPerHour) {
  return Math.ceil(60 * 60 * 1000 / normalizeTrendLaunchRate(launchesPerHour));
}

export function nextTrendLaunchAt(nowMs, launchesPerHour, jitter = 0) {
  const interval = trendLaunchIntervalMs(launchesPerHour);
  const safeJitter = Math.max(-0.15, Math.min(0.15, Number(jitter) || 0));
  return Math.round(Number(nowMs || Date.now()) + interval * (1 + safeJitter));
}

export function trendLaunchDayKey(nowMs = Date.now()) {
  return new Date(Number(nowMs) || Date.now()).toISOString().slice(0, 10);
}

export function trendLaunchRightsAccepted(campaign = {}) {
  return campaign.rightsVersion === TREND_LAUNCH_RIGHTS_VERSION
    && Number.isFinite(Date.parse(String(campaign.rightsAttestedAt || "")));
}

export function isBlockedTrendLaunchContent(value = "") {
  return BLOCKED_TREND_PATTERN.test(cleanTrendLaunchText(value, 1200));
}

export function normalizeTrendLaunchCandidate(row = {}) {
  const id = cleanTrendLaunchText(row.id || row.tweetId || row.postId, 80);
  const text = cleanTrendLaunchText(row.text || row.full_text, 900);
  const trend = cleanTrendLaunchText(row.trend || row.trendName || row.topic, 120);
  const username = cleanTrendLaunchText(row.username || row.authorUsername, 50).replace(/^@+/, "");
  const mediaUrl = cleanTrendLaunchText(row.mediaUrl || row.imageUrl || row.previewImageUrl, 1000);
  if (!id || !text || !mediaUrl || !username || isBlockedTrendLaunchContent(`${trend} ${text}`)) return null;
  const metrics = row.metrics || row.public_metrics || {};
  const likes = Math.max(0, Number(metrics.like_count ?? row.likes) || 0);
  const reposts = Math.max(0, Number(metrics.retweet_count ?? row.reposts) || 0);
  const quotes = Math.max(0, Number(metrics.quote_count ?? row.quotes) || 0);
  const replies = Math.max(0, Number(metrics.reply_count ?? row.replies) || 0);
  const impressions = Math.max(0, Number(metrics.impression_count ?? row.impressions) || 0);
  const createdAt = cleanTrendLaunchText(row.createdAt || row.created_at, 50);
  const ageHours = Math.max(0, (Date.now() - (Date.parse(createdAt) || Date.now())) / 3_600_000);
  const engagement = likes + reposts * 3 + quotes * 2 + replies + Math.log10(1 + impressions) * 18;
  const freshness = Math.max(0, 48 - ageHours) * 2;
  return {
    id,
    trend,
    text,
    username,
    authorId: cleanTrendLaunchText(row.authorId || row.author_id, 80),
    sourceUrl: cleanTrendLaunchText(row.sourceUrl || `https://x.com/${username}/status/${id}`, 1000),
    mediaUrl,
    mediaType: cleanTrendLaunchText(row.mediaType || "photo", 24),
    createdAt,
    metrics: { likes, reposts, quotes, replies, impressions },
    score: Math.round((engagement + freshness + (trend ? 25 : 0)) * 100) / 100
  };
}

export function chooseTrendLaunchCandidate(rows = [], history = [], rng = Math.random) {
  const recent = Array.isArray(history) ? history.slice(-100) : [];
  const usedIds = new Set(recent.map((item) => String(item?.sourceId || item?.candidateId || "")));
  const recentAuthors = new Set(recent.slice(-12).map((item) => String(item?.sourceUsername || item?.username || "").toLowerCase()));
  const recentTrends = new Set(recent.slice(-30).map((item) => String(item?.trend || "").toLowerCase()));
  let candidates = rows
    .map(normalizeTrendLaunchCandidate)
    .filter(Boolean)
    .filter((row) => !usedIds.has(row.id))
    .map((row) => ({
      ...row,
      rotationScore: row.score
        - (recentAuthors.has(row.username.toLowerCase()) ? 80 : 0)
        - (row.trend && recentTrends.has(row.trend.toLowerCase()) ? 60 : 0)
    }))
    .sort((a, b) => b.rotationScore - a.rotationScore);
  // Rotation is a hard preference when alternatives exist, rather than a
  // token score penalty that a single very large account can overwhelm.
  const freshAuthors = candidates.filter((row) => !recentAuthors.has(row.username.toLowerCase()));
  if (freshAuthors.length) candidates = freshAuthors;
  const freshTrends = candidates.filter((row) => !row.trend || !recentTrends.has(row.trend.toLowerCase()));
  if (freshTrends.length) candidates = freshTrends;
  candidates = candidates.slice(0, 6);
  if (!candidates.length) return null;
  const floor = Math.min(...candidates.map((row) => row.rotationScore));
  const weights = candidates.map((row) => Math.max(1, row.rotationScore - floor + 10));
  const total = weights.reduce((sum, value) => sum + value, 0);
  let pick = Math.max(0, Math.min(0.999999, Number(rng()) || 0)) * total;
  for (let index = 0; index < candidates.length; index += 1) {
    pick -= weights[index];
    if (pick <= 0) return candidates[index];
  }
  return candidates[0];
}

function candidateWords(candidate = {}) {
  return cleanTrendLaunchText(`${candidate.trend || ""} ${candidate.text || ""}`, 500)
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/[@#$][\w]+/g, " ")
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !GENERIC_WORDS.has(word.toLowerCase()));
}

export function fallbackTrendLaunchConcept(candidate = {}, usedSymbols = []) {
  const words = candidateWords(candidate);
  const main = cleanTrendLaunchText(candidate.trend || words.slice(0, 3).join(" ") || "Trend Signal", 48);
  const name = main.replace(/^#/, "").replace(/\b\w/g, (letter) => letter.toUpperCase()).slice(0, 32) || "Trend Signal";
  const base = words[0] || name.replace(/[^a-z0-9]/gi, "") || "TREND";
  let symbol = base.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 10) || "TREND";
  const used = new Set((usedSymbols || []).map((value) => String(value || "").toUpperCase()));
  if (used.has(symbol)) {
    const suffix = String(candidate.id || "").replace(/\D/g, "").slice(-2) || "X";
    symbol = `${symbol.slice(0, Math.max(1, 10 - suffix.length))}${suffix}`;
  }
  const excerpt = cleanTrendLaunchText(candidate.text, 150);
  return {
    name,
    symbol,
    description: cleanTrendLaunchText(`${name} is inspired by a current X conversation. ${excerpt}`, 360)
  };
}

export function normalizeTrendLaunchCampaign(input = {}, existing = {}, nowMs = Date.now()) {
  const launchesPerHour = normalizeTrendLaunchRate(input.launchesPerHour ?? existing.launchesPerHour);
  const maxLaunchesPerDay = normalizeTrendLaunchDailyLimit(input.maxLaunchesPerDay ?? existing.maxLaunchesPerDay);
  const devBuySol = Math.max(0, Math.min(5, Number(input.devBuySol ?? existing.devBuySol) || 0));
  const dayKey = trendLaunchDayKey(nowMs);
  const existingDay = String(existing.dayKey || "") === dayKey;
  return {
    ...existing,
    launchesPerHour,
    maxLaunchesPerDay,
    devBuySol,
    walletIndex: Math.max(1, Math.round(Number(input.walletIndex ?? existing.walletIndex) || 1)),
    region: ["worldwide", "us"].includes(String(input.region || existing.region || "worldwide")) ? String(input.region || existing.region || "worldwide") : "worldwide",
    sourceMode: "mixed",
    autoUseSourceMedia: true,
    dayKey,
    launchedToday: existingDay ? Math.max(0, Number(existing.launchedToday) || 0) : 0,
    updatedAt: new Date(nowMs).toISOString()
  };
}

export function trendLaunchDue(campaign = {}, nowMs = Date.now()) {
  if (!campaign.enabled || campaign.status !== "running") return false;
  if (!trendLaunchRightsAccepted(campaign)) return false;
  const normalized = normalizeTrendLaunchCampaign({}, campaign, nowMs);
  if (normalized.launchedToday >= normalized.maxLaunchesPerDay) return false;
  if (campaign.pendingRun?.slotId) return false;
  return Number(campaign.nextRunAt || 0) <= Number(nowMs);
}
