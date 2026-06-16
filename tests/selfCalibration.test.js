import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCalibration, computeCalibrationByMode, modeScorecard, bucketStats, MIN_SAMPLE, MAX_SCORE_BONUS, MIN_SIZE_MULT } from "../src/lib/selfCalibration.js";

function trade(over = {}) {
  return { fs: 70, entryMc: 8000, pnl: 0.01, win: true, rugged: false, ...over };
}

test("neutral until the sample clears MIN_SAMPLE", () => {
  const c = computeCalibration(Array.from({ length: MIN_SAMPLE - 1 }, () => trade()));
  assert.equal(c.minScoreBonus, 0);
  assert.equal(c.sizeFracCapMult, 1);
});

test("a healthy, profitable book applies no tightening", () => {
  const trades = Array.from({ length: 60 }, (_, i) => trade({ fs: 72, pnl: 0.02, win: true }));
  const c = computeCalibration(trades);
  assert.equal(c.minScoreBonus, 0);
  assert.equal(c.sizeFracCapMult, 1);
  assert.ok(c.overallWinRate > 0.9);
});

test("bleeding marginal-score trades raise the entry bar (bounded)", () => {
  // 40 strong winners + 20 marginal (fs<66) losers → marginal bucket bleeds.
  const strong = Array.from({ length: 40 }, () => trade({ fs: 74, pnl: 0.02, win: true }));
  const marginal = Array.from({ length: 20 }, () => trade({ fs: 62, pnl: -0.02, win: false }));
  const c = computeCalibration([...strong, ...marginal]);
  assert.ok(c.minScoreBonus > 0, "raises the bar when marginal setups bleed");
  assert.ok(c.minScoreBonus <= MAX_SCORE_BONUS, "bounded");
});

test("a net-negative book shrinks the size cap but never below the floor", () => {
  const trades = Array.from({ length: 50 }, () => trade({ fs: 70, pnl: -0.03, win: false }));
  const c = computeCalibration(trades);
  assert.ok(c.sizeFracCapMult < 1, "shrinks size on a red book");
  assert.ok(c.sizeFracCapMult >= MIN_SIZE_MULT, "never below the floor");
});

test("calibration is never looser than default (the safety contract)", () => {
  // Even with absurdly bad data, bonus >= 0 and mult <= 1.
  const trades = Array.from({ length: 80 }, (_, i) => trade({ fs: 50, pnl: -0.1, win: false }));
  const c = computeCalibration(trades);
  assert.ok(c.minScoreBonus >= 0 && c.sizeFracCapMult <= 1);
});

test("bucketStats computes per-bucket win-rate and EV", () => {
  const b = bucketStats([trade({ pnl: 0.02, win: true }), trade({ pnl: -0.01, win: false })], () => "x");
  assert.equal(b.x.n, 2);
  assert.equal(b.x.wins, 1);
  assert.equal(b.x.winRate, 0.5);
});

test("paper trades are valid signal (counted)", () => {
  const trades = Array.from({ length: 50 }, () => trade({ paper: true, fs: 62, pnl: -0.02, win: false }));
  const c = computeCalibration(trades);
  assert.equal(c.sample, 50, "paper outcomes count");
});

test("identifies the best MC band by EV", () => {
  const lo = Array.from({ length: 20 }, () => trade({ entryMc: 3000, pnl: -0.01, win: false }));
  const mid = Array.from({ length: 20 }, () => trade({ entryMc: 8000, pnl: 0.03, win: true }));
  const c = computeCalibration([...lo, ...mid]);
  assert.equal(c.bestMcBand, "5-12k");
});

test("computeCalibrationByMode: a bleeding mode tightens independently of a healthy one", () => {
  const degen = Array.from({ length: 50 }, (_, i) => trade({ mode: "degen", fs: 62, pnl: -0.02, win: false }));
  const grind = Array.from({ length: 50 }, () => trade({ mode: "grind", fs: 74, pnl: 0.02, win: true }));
  const byMode = computeCalibrationByMode([...degen, ...grind]);
  assert.ok(byMode.degen.minScoreBonus > 0 || byMode.degen.sizeFracCapMult < 1, "bleeding degen tightens");
  assert.equal(byMode.grind.minScoreBonus, 0, "healthy grind untouched");
  assert.equal(byMode.grind.sizeFracCapMult, 1);
});

test("computeCalibrationByMode: a mode under the min sample stays neutral", () => {
  const few = Array.from({ length: 10 }, () => trade({ mode: "chill", pnl: -0.05, win: false }));
  const byMode = computeCalibrationByMode(few);
  assert.equal(byMode.chill.minScoreBonus, 0);
  assert.equal(byMode.chill.sizeFracCapMult, 1);
});

test("modeScorecard: computes per-mode win-rate, EV, avg-peak, rug-rate", () => {
  const trades = [
    trade({ mode: "grind", win: true, pnl: 0.02, peakPct: 40, rugged: false }),
    trade({ mode: "grind", win: false, pnl: -0.01, peakPct: 5, rugged: false }),
    trade({ mode: "degen", win: false, pnl: -0.05, peakPct: 0, rugged: true })
  ];
  const sc = modeScorecard(trades);
  assert.equal(sc.grind.trades, 2);
  assert.equal(sc.grind.wins, 1);
  assert.equal(sc.grind.winRate, 50);
  assert.equal(sc.degen.rugRate, 100);
});
