import test from "node:test";
import assert from "node:assert/strict";
import {
  computeBestPickScore,
  classifySlimeScopePair,
  formatLivePairAge,
  isGraduatedSlimeScopePair,
  isPairVisibleForCategory,
  isLivePairInBucket,
  normalizePairTimestamp,
  pairRiskFlags,
  pairAgeMinutes,
  PAIR_CATEGORIES,
  PAIR_FILTER_MODES,
  slimeScopeProgressPct,
  sortLivePairs
} from "../src/lib/liveTerminal.js";

const NOW = Date.UTC(2026, 4, 26, 18, 0, 0);
const minutesAgo = (minutes) => NOW - minutes * 60_000;

test("normalizes seconds and milliseconds timestamps", () => {
  assert.equal(normalizePairTimestamp(Math.floor(minutesAgo(30) / 1000), NOW), minutesAgo(30));
  assert.equal(normalizePairTimestamp(minutesAgo(30), NOW), minutesAgo(30));
});

test("live-pair windows use pair creation age accurately", () => {
  const thirtySeconds = { pairCreatedAt: NOW - 30_000 };
  const thirtyMinutes = { pairCreatedAt: minutesAgo(30) };
  const twoHours = { pairCreatedAt: minutesAgo(120) };
  const fiveHours = { pairCreatedAt: minutesAgo(300) };
  const twentyThreeHours = { pairCreatedAt: minutesAgo(23 * 60) };
  const twentyFiveHours = { pairCreatedAt: minutesAgo(25 * 60) };
  const missing = {};

  assert.equal(isLivePairInBucket(thirtySeconds, "live", NOW), true);
  assert.equal(isLivePairInBucket(thirtyMinutes, "live", NOW), true);
  assert.equal(isLivePairInBucket(thirtyMinutes, "under1h", NOW), true);
  assert.equal(isLivePairInBucket(twoHours, "live", NOW), false);
  assert.equal(isLivePairInBucket(twoHours, "under1h", NOW), false);
  assert.equal(isLivePairInBucket(twoHours, "under3h", NOW), true);
  assert.equal(isLivePairInBucket(fiveHours, "under3h", NOW), false);
  assert.equal(isLivePairInBucket(twentyThreeHours, "under1d", NOW), true);
  assert.equal(isLivePairInBucket(twentyFiveHours, "under1d", NOW), false);
  assert.equal(isLivePairInBucket(missing, "under1d", NOW), false);
});

test("age badge reports unknown when no pair timestamp is available", () => {
  assert.equal(pairAgeMinutes({}, NOW), null);
  assert.equal(formatLivePairAge({}, NOW), "age unknown");
});

test("untrusted source age does not fake a fresh listing", () => {
  const sourceClaimedFresh = { pairAgeSeconds: 0, pairAgeMinutes: 0 };

  assert.equal(pairAgeMinutes(sourceClaimedFresh, NOW), null);
  assert.equal(formatLivePairAge(sourceClaimedFresh, NOW), "age unknown");
  assert.equal(isLivePairInBucket(sourceClaimedFresh, "live", NOW), false);
});

test("explicit trusted source age can be used as fallback", () => {
  const trustedFresh = { pairAgeSeconds: 30, pairAgeSource: "source-age" };

  assert.equal(pairAgeMinutes(trustedFresh, NOW), 0.5);
  assert.equal(formatLivePairAge(trustedFresh, NOW), "30s");
  assert.equal(isLivePairInBucket(trustedFresh, "live", NOW), true);
});

test("best picks rank stronger candidates above weak or risky candidates", () => {
  const strong = {
    pairCreatedAt: minutesAgo(12),
    liquidityUsd: 25_000,
    volume5m: 9_000,
    volumeH1: 45_000,
    marketCap: 42_000,
    buys5m: 36,
    sells5m: 11,
    m5: 18,
    kolSignalCount: 2,
    riskFlags: []
  };
  const weak = {
    pairCreatedAt: minutesAgo(12),
    liquidityUsd: 0,
    volume5m: 0,
    volumeH1: 0,
    marketCap: 0,
    buys5m: 2,
    sells5m: 14,
    m5: -25,
    riskFlags: ["sell pressure", "mint warning"]
  };

  const strongScore = computeBestPickScore(strong, NOW);
  const weakScore = computeBestPickScore(weak, NOW);
  assert.ok(strongScore.score > weakScore.score);
  assert.ok(weakScore.warnings.includes("liquidity unknown"));
  assert.equal(sortLivePairs([weak, strong], "best", NOW)[0], strong);
});

test("newest sort uses pair creation timestamp, not trade time", () => {
  const olderPairRecentTrade = {
    pairCreatedAt: minutesAgo(90),
    lastTradeAt: minutesAgo(1)
  };
  const newerPairOldTrade = {
    pairCreatedAt: minutesAgo(10),
    lastTradeAt: minutesAgo(9)
  };

  assert.equal(sortLivePairs([olderPairRecentTrade, newerPairOldTrade], "newest", NOW)[0], newerPairOldTrade);
});

test("slime scope separates fresh, graduating, and graduated pump pairs", () => {
  const fresh = { tokenMint: "abcPump", isPump: true, pairCreatedAt: NOW - 30_000, marketCap: 2_500 };
  const steadyPump = { tokenMint: "oldPump", isPump: true, pairCreatedAt: minutesAgo(180), marketCap: 2_500, liquidityUsd: 12_000 };
  const almostBonded = { tokenMint: "defPump", isPump: true, pairCreatedAt: minutesAgo(20), marketCap: 60_000 };
  const bonded = { tokenMint: "ghiPump", isPump: true, graduated: true, pairCreatedAt: minutesAgo(120), marketCap: 80_000 };

  assert.equal(classifySlimeScopePair(fresh, NOW), "new");
  assert.equal(classifySlimeScopePair(steadyPump, NOW), "steady");
  assert.equal(classifySlimeScopePair(almostBonded, NOW), "graduating");
  assert.equal(classifySlimeScopePair(bonded, NOW), "graduated");
  assert.ok(slimeScopeProgressPct(almostBonded) >= 70);
});

test("fresh/new discovery shows risky new rows in all mode but hides them in safe mode", () => {
  const freezeableFresh = {
    tokenMint: "freezePump",
    isPump: true,
    pairCreatedAt: minutesAgo(4),
    marketCap: 8_000,
    liquidityUsd: 400,
    freezeAuthority: "abc",
    mintAuthority: "def"
  };
  const unknownRiskFresh = {
    tokenMint: "unknownPump",
    isPump: true,
    pairCreatedAt: minutesAgo(8),
    marketCap: 6_000,
    safetyStatus: "pending"
  };
  const mayhemFresh = {
    tokenMint: "mayhemPump",
    isPump: true,
    pairCreatedAt: minutesAgo(12),
    marketCap: 9_000,
    riskFlags: ["mayhemFlag"]
  };

  assert.equal(isPairVisibleForCategory(freezeableFresh, PAIR_CATEGORIES.FRESH, PAIR_FILTER_MODES.ALL, NOW), true);
  assert.equal(isPairVisibleForCategory(unknownRiskFresh, PAIR_CATEGORIES.NEW, PAIR_FILTER_MODES.ALL, NOW), true);
  assert.equal(isPairVisibleForCategory(mayhemFresh, PAIR_CATEGORIES.NEW, PAIR_FILTER_MODES.ALL, NOW), true);
  assert.equal(isPairVisibleForCategory(freezeableFresh, PAIR_CATEGORIES.FRESH, PAIR_FILTER_MODES.SAFE, NOW), false);
  assert.deepEqual(pairRiskFlags(freezeableFresh).filter((flag) => /Authority/.test(flag)).sort(), ["freezeAuthorityActive", "mintAuthorityActive"]);
});

test("slime scope parses compact market-cap and progress strings", () => {
  const almostBonded = { tokenMint: "defPump", isPump: true, marketCap: "$60K" };
  const percentProgress = { tokenMint: "abcPump", isPump: true, bondingProgressPct: "87%" };

  assert.equal(classifySlimeScopePair(almostBonded, NOW), "graduating");
  assert.equal(slimeScopeProgressPct(percentProgress), 87);
});

test("slime scope treats pump pairs on graduation DEXes as graduated", () => {
  const raydiumPump = {
    tokenMint: "rayPump",
    isPump: true,
    dexId: "raydium",
    source: "raydium"
  };

  assert.equal(isGraduatedSlimeScopePair(raydiumPump), true);
  assert.equal(classifySlimeScopePair(raydiumPump, NOW), "graduated");
});

test("slime scope does not keep high market-cap pump tokens in graduating", () => {
  const alreadyRunning = {
    tokenMint: "bigPump",
    isPump: true,
    pairCreatedAt: minutesAgo(90),
    marketCap: 2_000_000
  };

  assert.equal(isGraduatedSlimeScopePair(alreadyRunning), true);
  assert.equal(classifySlimeScopePair(alreadyRunning, NOW), "graduated");
});
