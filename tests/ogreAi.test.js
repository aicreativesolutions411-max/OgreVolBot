import test from "node:test";
import assert from "node:assert/strict";
import {
  buildOgreAiCandidatePool,
  ogreAiTierForCandidate,
  isOgreAiBlockedRisk
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
