import test from "node:test";
import assert from "node:assert/strict";
import { computeSlimeShield, slimeShieldVerdictFromScore } from "../src/lib/slimeShield.js";

test("SlimeShield returns BUY for a clean cached setup", () => {
  const result = computeSlimeShield({
    tokenMint: "CleanMint111",
    liquidityUsd: 52_000,
    pairAgeMinutes: 95,
    volumeM15: 24_000,
    buys5m: 22,
    sells5m: 7,
    bestPickScore: 84,
    riskFlags: []
  });

  assert.equal(result.mint, "CleanMint111");
  assert.equal(result.verdict, "BUY");
  assert.equal(result.confidence, "high");
  assert.equal(result.suggestedAction, "normal_buy");
  assert.ok(result.score >= 75);
  assert.ok(result.factors.some((factor) => factor.key === "liquidity_clean"));
});

test("SlimeShield keeps missing signals honest with low confidence", () => {
  const result = computeSlimeShield({ tokenMint: "WarmingMint111" });

  assert.equal(result.verdict, "CAUTION");
  assert.equal(result.confidence, "low");
  assert.match(result.summary, /Trade small|protection/i);
  assert.ok(result.factors.some((factor) => factor.key === "liquidity_unknown"));
  assert.ok(result.factors.some((factor) => factor.key === "age_unknown"));
});

test("SlimeShield marks severe cached hard flags as AVOID", () => {
  const result = computeSlimeShield({
    tokenMint: "DangerMint111",
    liquidityUsd: 18_000,
    pairAgeMinutes: 30,
    volumeM15: 15_000,
    buys5m: 10,
    sells5m: 9,
    riskFlags: ["honeypot warning"]
  });

  assert.equal(result.verdict, "AVOID");
  assert.equal(result.suggestedAction, "avoid");
  assert.ok(result.factors.some((factor) => factor.key === "hard_flag"));
});

test("SlimeShield folds KOL dump risk into local scoring without external reads", () => {
  const mixed = computeSlimeShield({
    tokenMint: "KolMixedMint111",
    liquidityUsd: 8_500,
    pairAgeMinutes: 18,
    volumeM15: 7_000,
    buys5m: 8,
    sells5m: 7,
    kolDumpRiskPercent: 38
  });
  const highRisk = computeSlimeShield({
    tokenMint: "KolRiskMint111",
    liquidityUsd: 8_500,
    pairAgeMinutes: 18,
    volumeM15: 7_000,
    buys5m: 8,
    sells5m: 7,
    kolDumpRiskPercent: 62
  });

  assert.ok(mixed.score > highRisk.score);
  assert.ok(mixed.factors.some((factor) => factor.key === "kol_mixed"));
  assert.ok(highRisk.factors.some((factor) => factor.key === "kol_dump_risk"));
});

test("SlimeShield verdict thresholds keep severe risk factors above score thresholds blocked", () => {
  assert.equal(slimeShieldVerdictFromScore(78, []), "BUY");
  assert.equal(slimeShieldVerdictFromScore(67, []), "CAUTION");
  assert.equal(slimeShieldVerdictFromScore(52, []), "RISK");
  assert.equal(slimeShieldVerdictFromScore(78, [{ severity: "risk", weight: -36 }]), "AVOID");
});
