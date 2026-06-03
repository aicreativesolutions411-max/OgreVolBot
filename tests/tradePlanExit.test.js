import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateMoveSnapshot,
  priceExitDecision,
  shouldEmergencySellOnPriceFailure,
  stopLossTriggerPercent
} from "../src/lib/tradePlanExit.js";

test("stop-loss trigger uses configured early buffer", () => {
  assert.equal(stopLossTriggerPercent(8, 1.5), 6.5);
  assert.equal(priceExitDecision({
    movePct: -6.49,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), null);
  assert.deepEqual(priceExitDecision({
    movePct: -6.5,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), {
    kind: "stop-loss",
    triggerPct: 6.5,
    targetPct: 8,
    sellPercent: 100
  });
});

test("take-profit triggers at configured gain", () => {
  assert.equal(priceExitDecision({
    movePct: 24.99,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), null);
  assert.deepEqual(priceExitDecision({
    movePct: 25,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5
  }), {
    kind: "take-profit",
    triggerPct: 25,
    targetPct: 25
  });
});

test("move snapshot keeps trigger move gross while reporting net fee move", () => {
  const snapshot = calculateMoveSnapshot({
    basis: 1000n,
    estimatedOut: 1250n,
    feeLamports: 50n
  });

  assert.equal(snapshot.grossMovePct, 25);
  assert.equal(snapshot.netMovePct, 20);
  assert.equal(snapshot.movePct, 25);
  assert.equal(snapshot.estimatedOut, 1250n);
  assert.equal(snapshot.estimatedNetOut, 1200n);
});

test("stop-loss buffer cannot make trigger zero", () => {
  assert.equal(stopLossTriggerPercent(1, 10), 0.1);
  assert.equal(priceExitDecision({
    movePct: -0.09,
    stopLossPct: 1,
    stopLossBufferPct: 10
  }), null);
  assert.deepEqual(priceExitDecision({
    movePct: -0.1,
    stopLossPct: 1,
    stopLossBufferPct: 10
  }), {
    kind: "stop-loss",
    triggerPct: 0.1,
    targetPct: 1,
    sellPercent: 100
  });
});

test("stop-loss emergency sell arms after repeated price estimate failures", () => {
  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 8,
    estimateFailures: 1,
    minFailures: 2
  }), false);

  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 8,
    estimateFailures: 2,
    minFailures: 2
  }), true);
});

test("price estimate failure emergency does not trigger without stop-loss", () => {
  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 0,
    estimateFailures: 10,
    minFailures: 2
  }), false);

  assert.equal(shouldEmergencySellOnPriceFailure({
    stopLossPct: 8,
    estimateFailures: 0,
    minFailures: 2
  }), false);
});
