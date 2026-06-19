import { test } from "node:test";
import assert from "node:assert/strict";
import { computeCalibration, computeCalibrationByMode, modeScorecard, bucketStats, computeSignalEdge, MIN_SAMPLE, MAX_SCORE_BONUS, MIN_SIZE_MULT, SIGNAL_WEIGHT_SPAN } from "../src/lib/selfCalibration.js";

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

test("liveOnly calibration ignores paper trades", () => {
  const trades = Array.from({ length: 50 }, () => trade({ paper: true, fs: 62, pnl: -0.02, win: false }));
  const c = computeCalibration(trades, { liveOnly: true });
  assert.equal(c.sample, 0, "paper outcomes do not tune live sessions");
  assert.equal(c.minScoreBonus, 0);
  assert.equal(c.sizeFracCapMult, 1);
});

test("liveOnly calibration computes from live trades only", () => {
  const paperWinners = Array.from({ length: 60 }, () => trade({ paper: true, fs: 74, pnl: 0.05, win: true }));
  const liveLosers = Array.from({ length: 45 }, () => trade({ paper: false, fs: 62, pnl: -0.03, win: false }));
  const c = computeCalibration([...paperWinners, ...liveLosers], { liveOnly: true });
  assert.equal(c.sample, 45);
  assert.ok(c.minScoreBonus > 0 || c.sizeFracCapMult < 1, "live losses tighten live calibration");
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

test("computeCalibrationByMode: liveOnly ignores paper outcomes per mode", () => {
  const paperLosers = Array.from({ length: 50 }, () => trade({ mode: "degen", paper: true, fs: 62, pnl: -0.03, win: false }));
  const liveWinners = Array.from({ length: 50 }, () => trade({ mode: "degen", paper: false, fs: 74, pnl: 0.02, win: true }));
  const byMode = computeCalibrationByMode([...paperLosers, ...liveWinners], { liveOnly: true });
  assert.equal(byMode.degen.sample, 50);
  assert.equal(byMode.degen.minScoreBonus, 0);
  assert.equal(byMode.degen.sizeFracCapMult, 1);
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

// ===== PER-SIGNAL EDGE (offense reweighting) ================================================
test("computeSignalEdge: neutral until the book clears MIN_SAMPLE", () => {
  const few = Array.from({ length: MIN_SAMPLE - 1 }, () => trade({ signals: { dev: true } }));
  const { weights, detail } = computeSignalEdge(few);
  assert.deepEqual(weights, {}, "no learned weights on a thin book");
  assert.deepEqual(detail, {});
});

test("computeSignalEdge: a +EV signal earns weight > 1, a -EV signal earns weight < 1 (bounded)", () => {
  const dev = Array.from({ length: 15 }, () => trade({ pnl: 0.04, win: true, signals: { dev: true } }));
  const x = Array.from({ length: 15 }, () => trade({ pnl: -0.04, win: false, signals: { x: true } }));
  const filler = Array.from({ length: 15 }, () => trade({ pnl: 0, win: false, signals: {} }));
  const { weights } = computeSignalEdge([...dev, ...x, ...filler]);
  assert.ok(weights.dev > 1, "winning signal is leaned into");
  assert.ok(weights.x < 1, "losing signal is faded");
  assert.ok(weights.dev <= 1 + SIGNAL_WEIGHT_SPAN && weights.x >= 1 - SIGNAL_WEIGHT_SPAN, "weights bounded");
});

test("computeSignalEdge: a rarely-fired signal stays neutral (no weight on noise)", () => {
  const dev = Array.from({ length: 40 }, () => trade({ pnl: 0.02, win: true, signals: { dev: true } }));
  const rare = Array.from({ length: 5 }, () => trade({ pnl: 0.5, win: true, signals: { caller: true } }));
  const { weights } = computeSignalEdge([...dev, ...rare]);
  assert.equal(weights.caller, undefined, "under MIN_SIGNAL_SAMPLE → no weight even if it looks great");
});

test("computeCalibration: surfaces signalWeights + signalEdge and notes which signals lean/fade", () => {
  const dev = Array.from({ length: 15 }, () => trade({ pnl: 0.04, win: true, signals: { dev: true } }));
  const x = Array.from({ length: 15 }, () => trade({ pnl: -0.04, win: false, signals: { x: true } }));
  const filler = Array.from({ length: 15 }, () => trade({ pnl: 0, win: false, signals: {} }));
  const c = computeCalibration([...dev, ...x, ...filler]);
  assert.ok(c.signalWeights.dev > 1, "calibration exposes the learned dev weight");
  assert.ok(c.signalEdge.dev && c.signalEdge.dev.n === 15, "signalEdge carries the sub-sample size");
  assert.ok(c.notes.some((n) => /leaning into signals/.test(n)), "notes explain the lean");
});
