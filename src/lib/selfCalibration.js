// Self-calibration — the learning flywheel that actually learns.
//
// The autopilot records every trade's features + outcome (entryMc, age, freshScore, flow,
// peakPct, pnl, win, rugged, mode, tape...) to autopilot-trades.json. This module reads that
// accumulated history and derives a CONSERVATIVE bias for the next session, so the bot's
// selectivity + sizing track what has actually paid — not constants tuned by hand on one old
// session. The longer it runs, the sharper it gets.
//
// SAFETY CONTRACT (this is real money):
//   • The calibration can only ever make the bot MORE selective / SMALLER, never looser.
//     minScoreBonus >= 0 (raises the entry bar), sizeFracCapMult <= 1 (shrinks max bet).
//   • It stays neutral (zero effect) until there's a real sample (MIN_SAMPLE trades).
//   • It is bounded so one bad stretch can't over-correct into never trading.
//   • It is advisory + reversible: delete the file and defaults return. The live auto-tuner
//     (autoTune) still adapts on top of this baseline every cycle.
// Everything here is pure (no I/O, no clock) so it is unit-testable.

export const MIN_SAMPLE = 40;            // need this many resolved trades before biasing
export const MAX_SCORE_BONUS = 12;       // most we'll raise the entry bar from history
export const MIN_SIZE_MULT = 0.6;        // most we'll shrink the per-bet cap from history
// Per-signal reweighting (the OFFENSE flywheel): how much we lean into / fade each entry signal
// based on its REALIZED EV. The signal flags recorded per trade (rec.signals).
export const SIGNAL_KEYS = ["dev", "kol", "winners", "caller", "x", "entryBand", "flowSurge", "alpha", "grad"];
export const MIN_SIGNAL_SAMPLE = 10;     // a signal needs this many fired trades before we trust its edge
export const SIGNAL_WEIGHT_SPAN = 0.5;   // weights stay within 1 ± this (0.5..1.5)

function num(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }

// A trade "counts" for calibration once it has a real outcome (win flag + realized pnl).
// Paper trades count by default because their outcomes use real market data. Live
// sessions pass liveOnly so real-money tuning is not diluted by paper-only outcomes.
function isCounted(t, opts = {}) {
  if (!(t && (t.win === true || t.win === false) && Number.isFinite(Number(t.pnl)))) return false;
  if (opts.liveOnly && t.paper !== false) return false;
  return true;
}

function winRate(rows) {
  if (!rows.length) return 0;
  return rows.filter((t) => t.win).length / rows.length;
}
function evPerTrade(rows) {
  if (!rows.length) return 0;
  return rows.reduce((a, t) => a + num(t.pnl), 0) / rows.length;
}

// Bucket trades by a key function into { key: { n, win, ev } } for transparency + tuning.
export function bucketStats(trades, keyFn) {
  const m = {};
  for (const t of trades) {
    const k = keyFn(t);
    if (k == null) continue;
    const b = m[k] || { n: 0, wins: 0, pnl: 0 };
    b.n += 1; if (t.win) b.wins += 1; b.pnl += num(t.pnl);
    m[k] = b;
  }
  for (const k of Object.keys(m)) {
    m[k].winRate = Math.round((m[k].wins / m[k].n) * 1000) / 1000;
    m[k].ev = Math.round((m[k].pnl / m[k].n) * 100000) / 100000;
  }
  return m;
}

// PER-SIGNAL EDGE — measure each entry signal's REALIZED EV vs the book baseline and map it to a
// bounded conviction weight (1 ± SIGNAL_WEIGHT_SPAN). This is the offense flywheel: signals that
// actually precede winners get leaned into (weight > 1), ones that don't get faded (weight < 1) —
// automatically, the longer it runs. Returns { weights: {key:number}, detail: {key:{n,ev,winRate,weight}} }.
// Neutral (empty) until there's a real book; each signal stays neutral until it has its own sub-sample,
// so a rarely-fired signal can never swing sizing on noise. Pure + unit-testable.
export function computeSignalEdge(trades, opts = {}) {
  const counted = (trades || []).filter((t) => isCounted(t, opts) && t && t.signals && typeof t.signals === "object");
  const weights = {}, detail = {};
  if (counted.length < (opts.minSample || MIN_SAMPLE)) return { weights, detail };
  const baseEv = evPerTrade(counted);
  const minSig = opts.minSignalSample || MIN_SIGNAL_SAMPLE;
  for (const k of SIGNAL_KEYS) {
    const fired = counted.filter((t) => t.signals[k]);
    if (fired.length < minSig) continue;             // too few to trust → leave neutral (caller treats missing as 1.0)
    const ev = evPerTrade(fired);
    // Edge vs the book baseline mapped to a bounded weight. Scale: a +0.02 SOL/trade edge ≈ full
    // +0.5 lean; clamped both ways so noise / one fat tail can't blow the multiplier out.
    const delta = ev - baseEv;
    const w = 1 + Math.max(-SIGNAL_WEIGHT_SPAN, Math.min(SIGNAL_WEIGHT_SPAN, delta / 0.02));
    weights[k] = Math.round(w * 100) / 100;
    detail[k] = { n: fired.length, ev: Math.round(ev * 100000) / 100000, winRate: Math.round(winRate(fired) * 1000) / 1000, weight: weights[k] };
  }
  return { weights, detail };
}

const fsBucket = (t) => { const fs = num(t.fs); if (!(fs > 0)) return null; if (fs < 60) return "<60"; if (fs < 66) return "60-65"; if (fs < 72) return "66-71"; return "72+"; };
const mcBucket = (t) => { const mc = num(t.entryMc); if (!(mc > 0)) return null; if (mc < 5000) return "<5k"; if (mc < 12000) return "5-12k"; if (mc < 25000) return "12-25k"; if (mc < 60000) return "25-60k"; return "60k+"; };

// Derive the calibration from the trade history. Returns a bounded, never-looser bias plus
// rich diagnostics (so the owner can see WHY it tightened). Neutral until MIN_SAMPLE.
export function computeCalibration(trades, opts = {}) {
  const minSample = opts.minSample || MIN_SAMPLE;
  const counted = (trades || []).filter((t) => isCounted(t, opts));
  const neutral = {
    minScoreBonus: 0, sizeFracCapMult: 1, signalWeights: {}, signalEdge: {},
    sample: counted.length, overallWinRate: 0, evPerTrade: 0,
    byFs: {}, byMc: {}, bestMcBand: null, notes: ["insufficient sample — using defaults"]
  };
  if (counted.length < minSample) return neutral;

  const overallWinRate = Math.round(winRate(counted) * 1000) / 1000;
  const ev = Math.round(evPerTrade(counted) * 100000) / 100000;
  const byFs = bucketStats(counted, fsBucket);
  const byMc = bucketStats(counted, mcBucket);
  const notes = [];

  // 1) ENTRY-BAR BIAS: if the marginal-score buckets (fs < 66) are losing money on a real
  //    sub-sample, raise the bar so the bot demands stronger setups. Scaled by how negative
  //    the EV is and how big the marginal sample is; bounded to MAX_SCORE_BONUS.
  let minScoreBonus = 0;
  const marginal = counted.filter((t) => { const b = fsBucket(t); return b === "<60" || b === "60-65"; });
  if (marginal.length >= 12) {
    const mWin = winRate(marginal);
    const mEv = evPerTrade(marginal);
    if (mEv < 0 || mWin < 0.33) {
      // The worse the marginal bucket bleeds, the higher the bar. ~+4 per clear failure step.
      let b = 0;
      if (mWin < 0.33) b += 4;
      if (mWin < 0.25) b += 4;
      if (mEv < 0) b += 4;
      minScoreBonus = Math.min(MAX_SCORE_BONUS, b);
      notes.push(`marginal fs<66 bleeding (win ${Math.round(mWin * 100)}%, ev ${mEv.toFixed(4)}) → +${minScoreBonus} entry bar`);
    }
  }

  // 2) SIZE BIAS: if the WHOLE recent book is negative-EV, shrink the per-bet cap so a cold
  //    regime costs less while it self-corrects. Never grows size (cap at 1). Bounded floor.
  let sizeFracCapMult = 1;
  if (ev < 0) {
    // Map negative EV to a 0.6..1.0 multiplier; deeper red = smaller bets.
    const sev = Math.min(1, Math.abs(ev) / 0.02); // 0.02 SOL/trade red == full shrink
    sizeFracCapMult = Math.max(MIN_SIZE_MULT, 1 - sev * (1 - MIN_SIZE_MULT));
    sizeFracCapMult = Math.round(sizeFracCapMult * 100) / 100;
    notes.push(`book negative-EV (${ev.toFixed(4)} SOL/trade) → size cap ×${sizeFracCapMult}`);
  }

  // 3) BEST MC BAND (advisory/diagnostic): the band with the best EV among bands with a real
  //    sample. Surfaced for the owner + future use; does NOT auto-move the window (too risky
  //    to auto-retarget the live MC gate from history alone).
  let bestMcBand = null, bestEv = -Infinity;
  for (const [k, b] of Object.entries(byMc)) {
    if (b.n >= 8 && b.ev > bestEv) { bestEv = b.ev; bestMcBand = k; }
  }
  if (bestMcBand) notes.push(`best MC band by EV: ${bestMcBand} (${byMc[bestMcBand].ev} SOL/trade, n=${byMc[bestMcBand].n})`);

  // 4) PER-SIGNAL REWEIGHTING (offense): learn which entry signals actually precede winners and
  //    feed bounded weights back into conviction sizing. Lean in (>1) / fade (<1); never gates entry.
  const signalEdge = computeSignalEdge(counted, opts).detail;
  const signalWeights = {};
  for (const k of Object.keys(signalEdge)) signalWeights[k] = signalEdge[k].weight;
  const leaned = Object.entries(signalWeights).filter(([, w]) => w >= 1.1).map(([k]) => k);
  const faded = Object.entries(signalWeights).filter(([, w]) => w <= 0.9).map(([k]) => k);
  if (leaned.length) notes.push(`leaning into signals: ${leaned.join(", ")}`);
  if (faded.length) notes.push(`fading signals: ${faded.join(", ")}`);
  if (!notes.length) notes.push("history healthy — no tightening applied");

  return { minScoreBonus, sizeFracCapMult, signalWeights, signalEdge, sample: counted.length, overallWinRate, evPerTrade: ev, byFs, byMc, bestMcBand, notes };
}

// PER-MODE calibration — the "every mode a winner" enforcer. Each mode's trades are stamped
// (rec.mode), so we compute a separate bias per mode: a mode that's been bleeding auto-tightens
// (higher bar / smaller size) until it's green, independently of the others. Same safety
// contract (never looser; neutral until MIN_SAMPLE per mode). Returns { [mode]: calibration }.
export function computeCalibrationByMode(trades, opts = {}) {
  const byMode = {};
  const modes = new Set();
  for (const t of trades || []) { if (t && t.mode) modes.add(String(t.mode)); }
  for (const m of modes) {
    byMode[m] = computeCalibration((trades || []).filter((t) => t && String(t.mode) === m), opts);
  }
  return byMode;
}

// Per-mode scorecard for the owner /stats — proves (or disproves) each mode is a winner.
// { [mode]: { trades, wins, winRate, ev, avgPeak, rugRate } }.
export function modeScorecard(trades) {
  const m = {};
  for (const t of trades || []) {
    if (!t || !t.mode || !isCounted(t)) continue;
    const k = String(t.mode);
    const b = m[k] || { trades: 0, wins: 0, rugs: 0, pnl: 0, peakSum: 0 };
    b.trades += 1; if (t.win) b.wins += 1; if (t.rugged) b.rugs += 1;
    b.pnl += num(t.pnl); b.peakSum += num(t.peakPct);
    m[k] = b;
  }
  for (const k of Object.keys(m)) {
    const b = m[k];
    b.winRate = Math.round((b.wins / b.trades) * 100);
    b.ev = Math.round((b.pnl / b.trades) * 100000) / 100000;
    b.avgPeak = Math.round(b.peakSum / b.trades);
    b.rugRate = Math.round((b.rugs / b.trades) * 100);
    delete b.pnl; delete b.peakSum; delete b.rugs;
  }
  return m;
}
