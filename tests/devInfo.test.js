import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateDevInfoStatus,
  calculateDevWalletStatsFromEvents,
  devInfoSlimeShieldFactor,
  devInfoSummaryFromResult
} from "../src/lib/devInfo.js";
import { computeSlimeShield } from "../src/lib/slimeShield.js";

test("Dev Info returns dump for severe current-token fast sell with medium confidence", () => {
  const result = calculateDevInfoStatus({
    mint: "Mint111111111111111111111111111111111111",
    likelyDevWallet: "9xA1111111111111111111111111111111111111",
    confidence: "medium",
    currentPosition: {
      estimatedSoldPercent: 82,
      firstMajorSellMinutesAfterLaunch: 7,
      positionStatus: "mostly_exited"
    },
    historicalStats: {
      launchesTracked: 8,
      soldMoreThan50Within1hPercent: 62,
      medianFirstSellMinutes: 12
    }
  });

  assert.equal(result.status, "dump");
  assert.equal(result.label, "Dev");
  assert.ok(result.score < 35);
  assert.match(result.summary, /sold|dump|exited/i);
});

test("Dev Info stays unknown when likely dev wallet and confidence are missing", () => {
  const result = calculateDevInfoStatus({
    mint: "Mint222222222222222222222222222222222222",
    confidence: "unknown"
  });

  assert.equal(result.status, "unknown");
  assert.equal(result.label, "");
  assert.equal(result.confidence, "unknown");
  assert.equal(result.likelyDevWallet, null);
  assert.match(result.summary, /No reliable creator wallet/i);
});

test("Dev Info marks low-history creator wallets as new instead of risk or dump", () => {
  const result = calculateDevInfoStatus({
    mint: "Mint333333333333333333333333333333333333",
    likelyDevWallet: "AbC1111111111111111111111111111111111111",
    confidence: "low",
    historicalStats: {
      launchesTracked: 0
    }
  });

  assert.equal(result.status, "new");
  assert.equal(result.label, "New");
  assert.ok(result.score >= 55);
});

test("Dev wallet stats can be derived from stored local events", () => {
  const events = [
    { mint: "A", eventType: "launch", tokenAmount: 100, eventTime: "2026-06-07T00:00:00.000Z" },
    { mint: "A", eventType: "sell", tokenAmount: 70, eventTime: "2026-06-07T00:10:00.000Z" },
    { mint: "B", eventType: "launch", tokenAmount: 100, eventTime: "2026-06-07T01:00:00.000Z" },
    { mint: "B", eventType: "sell", tokenAmount: 20, eventTime: "2026-06-07T03:00:00.000Z" }
  ];
  const stats = calculateDevWalletStatsFromEvents(events, "Wallet1111111111111111111111111111111111");

  assert.equal(stats.launchesTracked, 2);
  assert.equal(stats.soldMoreThan50Within15mPercent, 50);
  assert.equal(stats.soldMoreThan50Within1hPercent, 50);
  assert.equal(stats.heldPast24hPercent, 50);
});

test("Dev wallet stats include source-backed transfer in/out events", () => {
  const events = [
    { mint: "C", eventType: "transfer_in", tokenAmount: 100, eventTime: "2026-06-07T04:00:00.000Z" },
    { mint: "C", eventType: "transfer_out", tokenAmount: 60, eventTime: "2026-06-07T04:14:00.000Z" },
    { mint: "D", eventType: "transfer_in", tokenAmount: 100, eventTime: "2026-06-07T05:00:00.000Z" },
    { mint: "D", eventType: "transfer_out", tokenAmount: 10, eventTime: "2026-06-07T06:00:00.000Z" }
  ];
  const stats = calculateDevWalletStatsFromEvents(events, "Wallet2222222222222222222222222222222222");

  assert.equal(stats.launchesTracked, 2);
  assert.equal(stats.soldMoreThan50Within15mPercent, 50);
  assert.equal(stats.soldMoreThan50Within1hPercent, 50);
});

test("Dev Info summary and SlimeShield factor stay compact", () => {
  const summary = devInfoSummaryFromResult(calculateDevInfoStatus({
    mint: "Mint444444444444444444444444444444444444",
    likelyDevWallet: "Dev1111111111111111111111111111111111111",
    confidence: "medium",
    currentPosition: {
      estimatedSoldPercent: 10,
      positionStatus: "holding"
    },
    historicalStats: {
      launchesTracked: 3,
      soldMoreThan50Within1hPercent: 0,
      heldPast24hPercent: 80
    },
    externalLinks: [{ label: "Solscan", url: "https://solscan.io/account/Dev1111111111111111111111111111111111111" }]
  }));
  const factor = devInfoSlimeShieldFactor(summary);
  const shield = computeSlimeShield({
    tokenMint: summary.mint,
    liquidityUsd: 25_000,
    volumeH1: 12_000,
    pairAgeMinutes: 75,
    bestPickScore: 82,
    devInfoSummary: summary
  });

  assert.equal(summary.label, "Hold");
  assert.equal(summary.launchesTracked, 3);
  assert.equal(summary.externalLinks[0].label, "Solscan");
  assert.equal(factor.severity, "positive");
  assert.match(shield.factors.map((item) => item.key).join(","), /dev_info_hold/);
});
