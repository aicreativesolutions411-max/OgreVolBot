import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOgreAiCandidatePool,
  ogreAiTierForCandidate,
  isOgreAiBlockedRisk,
  ogreAiTargetFitScore
} from "../src/lib/ogreAi.js";

const defaults = {
  minScore: 54,
  maxMarketCap: 750_000,
  minLiquidityUsd: 350
};

test("Ogre A.I. falls back to balanced picks when strict is empty", () => {
  const rows = [
    {
      tokenMint: "BalancedMint",
      bestPickScore: 43,
      marketCap: 80_000,
      liquidityUsd: 200,
      volume5m: 800,
      pairAgeMinutes: 12
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, defaults, "quick");
  assert.equal(pool.selectedTier, "balanced");
  assert.equal(pool.tierCounts.strict, 0);
  assert.equal(pool.tierCounts.balanced, 1);
  assert.equal(pool.candidates[0].tokenMint, "BalancedMint");
});

test("Ogre A.I. can use best available momentum when strict and balanced are empty", () => {
  const rows = [
    {
      tokenMint: "AvailableMint",
      bestPickScore: 31,
      marketCap: 120_000,
      liquidityUsd: 90,
      volumeM15: 1400,
      pairAgeMinutes: 20
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, defaults, "quick");
  assert.equal(pool.selectedTier, "available");
  assert.equal(pool.tierCounts.available, 1);
  assert.equal(pool.candidates[0].tokenMint, "AvailableMint");
});

test("Ogre A.I. falls back to scout rows when live stats are incomplete", () => {
  const rows = [
    {
      tokenMint: "ScoutMint",
      bestPickScore: 18,
      marketCap: 95_000,
      liquidityUsd: 0,
      volume5m: 0,
      pairAgeMinutes: 15,
      bestPickInputs: ["fresh listing"]
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, defaults, "quick");
  assert.equal(pool.selectedTier, "scout");
  assert.equal(pool.tierCounts.scout, 1);
  assert.equal(pool.candidates[0].tokenMint, "ScoutMint");
});

test("Ogre A.I. still blocks high risk and mayhem rows", () => {
  assert.equal(isOgreAiBlockedRisk({ riskFlags: ["hard dump"] }), true);
  assert.equal(isOgreAiBlockedRisk({ category: "Pump Mayhem" }), true);
  assert.equal(isOgreAiBlockedRisk({ riskFlags: ["clean"], bestPickWarnings: [] }), false);

  assert.equal(ogreAiTierForCandidate({
    tokenMint: "RugMint",
    bestPickScore: 99,
    marketCap: 50_000,
    liquidityUsd: 10_000,
    volume5m: 25_000,
    riskFlags: ["honeypot"]
  }, defaults, "quick"), null);
});

test("Ogre A.I. does not starve pending safety rows before buy precheck", () => {
  const pendingRow = {
    tokenMint: "PendingSafetyMint",
    bestPickScore: 58,
    marketCap: 85_000,
    liquidityUsd: 1_200,
    volume5m: 4_000,
    pairAgeMinutes: 8,
    safetyStatus: "pending",
    safetyNote: "Safety pending; buy precheck required",
    riskFlags: ["unknownRisk"]
  };

  assert.equal(isOgreAiBlockedRisk(pendingRow), false);
  assert.equal(ogreAiTierForCandidate(pendingRow, defaults, "quick"), "strict");
});

test("Ogre A.I. prefers strict candidates over fallback tiers", () => {
  const pool = buildOgreAiCandidatePool([
    {
      tokenMint: "FallbackMint",
      bestPickScore: 35,
      marketCap: 100_000,
      liquidityUsd: 100,
      volume5m: 900,
      pairAgeMinutes: 30
    },
    {
      tokenMint: "StrictMint",
      bestPickScore: 66,
      marketCap: 90_000,
      liquidityUsd: 2_000,
      volume5m: 600,
      pairAgeMinutes: 10
    }
  ], defaults, "quick");

  assert.equal(pool.selectedTier, "strict");
  assert.equal(pool.candidates.length, 1);
  assert.equal(pool.candidates[0].tokenMint, "StrictMint");
});

test("Ogre A.I. ranks 100% target picks by fast upside fit", () => {
  const rows = [
    {
      tokenMint: "SaferButSleepyMint",
      bestPickScore: 78,
      marketCap: 650_000,
      liquidityUsd: 8_000,
      volume5m: 500,
      m5: 2,
      buys5m: 3,
      sells5m: 3,
      pairAgeMinutes: 45
    },
    {
      tokenMint: "HundredTargetMint",
      bestPickScore: 48,
      marketCap: 85_000,
      liquidityUsd: 900,
      volume5m: 8_500,
      m5: 22,
      h1: 38,
      buys5m: 17,
      sells5m: 4,
      pairAgeMinutes: 9
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 100, targetTakeProfitPct: 100, desiredPickCount: 1 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "HundredTargetMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. 100% target favors very fresh low market-cap momentum", () => {
  const rows = [
    {
      tokenMint: "OlderStableMint",
      bestPickScore: 82,
      marketCap: 780_000,
      liquidityUsd: 12_000,
      volume5m: 900,
      m5: 4,
      h1: 7,
      buys5m: 5,
      sells5m: 4,
      pairAgeMinutes: 180
    },
    {
      tokenMint: "FreshLowMcMint",
      bestPickScore: 46,
      marketCap: 64_000,
      liquidityUsd: 850,
      volume5m: 6_500,
      m5: 24,
      h1: 31,
      buys5m: 18,
      sells5m: 5,
      pairAgeMinutes: 4
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 100, targetTakeProfitPct: 100, desiredPickCount: 1, maxMarketCap: 350_000, minLiquidityUsd: 120 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "FreshLowMcMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. ranks 25% target picks toward cleaner quick exits", () => {
  const rows = [
    {
      tokenMint: "RawMoonshotMint",
      bestPickScore: 44,
      marketCap: 55_000,
      liquidityUsd: 220,
      volume5m: 5_500,
      m5: 20,
      buys5m: 12,
      sells5m: 5,
      pairAgeMinutes: 7
    },
    {
      tokenMint: "CleanTwentyFiveMint",
      bestPickScore: 68,
      marketCap: 180_000,
      liquidityUsd: 3_500,
      volume5m: 1_800,
      m5: 7,
      buys5m: 10,
      sells5m: 4,
      pairAgeMinutes: 22
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 25, targetTakeProfitPct: 25, desiredPickCount: 1 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "CleanTwentyFiveMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. 25% target favors older stable breakout over raw fresh moonshot", () => {
  const rows = [
    {
      tokenMint: "RawFreshMoonshotMint",
      bestPickScore: 58,
      marketCap: 28_000,
      liquidityUsd: 260,
      volume5m: 7_500,
      m5: 36,
      buys5m: 16,
      sells5m: 6,
      pairAgeMinutes: 2
    },
    {
      tokenMint: "OlderStableBreakoutMint",
      bestPickScore: 69,
      marketCap: 240_000,
      liquidityUsd: 7_500,
      volume5m: 1_800,
      volumeH1: 9_000,
      m5: 5,
      h1: 12,
      buys5m: 9,
      sells5m: 4,
      pairAgeMinutes: 180
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 25, targetTakeProfitPct: 25, desiredPickCount: 1, minLiquidityUsd: 800, maxMarketCap: 1_400_000 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "OlderStableBreakoutMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. fills requested stacks from fallback tiers after strict picks", () => {
  const pool = buildOgreAiCandidatePool([
    {
      tokenMint: "BalancedFillMint",
      bestPickScore: 42,
      marketCap: 95_000,
      liquidityUsd: 180,
      volume5m: 1_100,
      m5: 5,
      pairAgeMinutes: 16
    },
    {
      tokenMint: "StrictFillMint",
      bestPickScore: 66,
      marketCap: 90_000,
      liquidityUsd: 2_000,
      volume5m: 600,
      m5: 6,
      pairAgeMinutes: 10
    }
  ], { ...defaults, desiredPickCount: 2 }, "quick");

  assert.equal(pool.selectedTier, "strict");
  assert.equal(pool.candidates.length, 2);
  assert.equal(pool.candidates[0].tokenMint, "StrictFillMint");
  assert.equal(pool.candidates[1].tokenMint, "BalancedFillMint");
});
