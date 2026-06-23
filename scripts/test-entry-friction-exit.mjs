// Validates the entry-friction baseline fix: TP/SL must fire on the coin's PRICE move SINCE
// ENTRY, never on the buy+sell round-trip cost that reads negative the instant a buy fills.
import { priceExitDecision } from "../src/lib/tradePlanExit.js";

// Mirror of frictionAdjustedExitEstimate (src/index.js) so we test the exact production logic.
function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
function frictionAdjustedExitEstimate(holder, estimate) {
  if (!holder || !estimate) return estimate;
  if (!Number.isFinite(Number(holder.entryBaselineMovePct)) && Number.isFinite(Number(estimate.movePct))) {
    holder.entryBaselineMovePct = clamp(Number(estimate.movePct), -45, 0);
  }
  if (!Number.isFinite(Number(holder.entryBaselineMarketMovePct)) && Number.isFinite(Number(estimate.marketMovePct))) {
    holder.entryBaselineMarketMovePct = clamp(Number(estimate.marketMovePct), -45, 0);
  }
  const moveBase = Number(holder.entryBaselineMovePct) || 0;
  const marketBase = Number(holder.entryBaselineMarketMovePct) || 0;
  if (!moveBase && !marketBase) return estimate;
  const s = (v, b) => (Number.isFinite(Number(v)) ? Number(v) - b : v);
  return { ...estimate, movePct: s(estimate.movePct, moveBase), marketMovePct: s(estimate.marketMovePct, marketBase) };
}

// Reproduce evaluatePercentMoveCandidates' "trigger on the first crossing candidate" behavior.
function wouldClose(estimate, { takeProfitPct, stopLossPct, stopLossBufferPct = 1.5 }) {
  for (const movePct of [estimate.movePct, estimate.marketMovePct]) {
    if (!Number.isFinite(movePct)) continue;
    const d = priceExitDecision({ movePct, takeProfitPct, stopLossPct, stopLossBufferPct });
    if (d) return d.kind;
  }
  return null;
}

let pass = 0, fail = 0;
function check(name, got, want) {
  const ok = got === want;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  (got ${got ?? "none"}, want ${want ?? "none"})`);
  ok ? pass++ : fail++;
}

const TP = 50, SL = 20; // user arms +50% take-profit / -20% stop-loss

// ---- OLD (buggy) behavior: no baseline. Round-trip move starts at -28% right after a buy. ----
const entryRaw = { movePct: -28, marketMovePct: -12 }; // round-trip vs mid, no movement yet
check("OLD: fresh buy, price unchanged -> (bug) fires stop", wouldClose(entryRaw, { takeProfitPct: TP, stopLossPct: SL }), "stop-loss");

// ---- NEW behavior: baseline captured on first check, then measured from entry. ----
const guard = {}; // fresh guard, no baseline yet
// First check, same instant as buy: round-trip -28, market -12. Should NOT fire (price hasn't moved).
const t0 = frictionAdjustedExitEstimate(guard, { movePct: -28, marketMovePct: -12 });
check("NEW: fresh buy, price unchanged -> no exit", wouldClose(t0, { takeProfitPct: TP, stopLossPct: SL }), null);
check("NEW: baseline(roundtrip) captured", guard.entryBaselineMovePct, -28);
check("NEW: baseline(market) captured", guard.entryBaselineMarketMovePct, -12);

// Price still flat a minute later (readings unchanged): still no exit.
const t1 = frictionAdjustedExitEstimate(guard, { movePct: -28, marketMovePct: -12 });
check("NEW: still flat -> no exit", wouldClose(t1, { takeProfitPct: TP, stopLossPct: SL }), null);

// Coin genuinely drops ~20% in price: round-trip ~-48, market ~-32 -> stop SHOULD fire.
const tDrop = frictionAdjustedExitEstimate(guard, { movePct: -48, marketMovePct: -32 });
check("NEW: real -20% price drop -> stop fires", wouldClose(tDrop, { takeProfitPct: TP, stopLossPct: SL }), "stop-loss");

// Coin genuinely pumps +50% in price: round-trip ~+22, market ~+38 -> TP SHOULD fire.
const tPump = frictionAdjustedExitEstimate(guard, { movePct: 22, marketMovePct: 38 });
check("NEW: real +50% price pump -> take-profit fires", wouldClose(tPump, { takeProfitPct: TP, stopLossPct: SL }), "take-profit");

// A small wobble (-8% price) within the stop should NOT fire.
const tWobble = frictionAdjustedExitEstimate(guard, { movePct: -36, marketMovePct: -20 });
check("NEW: -8% wobble inside stop -> no exit", wouldClose(tWobble, { takeProfitPct: TP, stopLossPct: SL }), null);

// Poisoned first read (-90% degenerate quote) is clamped to -45, so a true rug still trips.
const g2 = {};
frictionAdjustedExitEstimate(g2, { movePct: -90, marketMovePct: -85 });
check("NEW: degenerate first read clamped", g2.entryBaselineMovePct, -45);
const tRug = frictionAdjustedExitEstimate(g2, { movePct: -95, marketMovePct: -90 });
check("NEW: deep rug still trips stop", wouldClose(tRug, { takeProfitPct: TP, stopLossPct: SL }), "stop-loss");

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
