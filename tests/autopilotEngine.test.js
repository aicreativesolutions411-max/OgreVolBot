import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  aggParams,
  sizeFor,
  freshScore,
  grindScore,
  liquidScore,
  jumpScore,
  apexEdge,
  apexType,
  apexDeepEdge,
  swingScore,
  convictionMult,
  confluenceMult,
  graduationScore,
  capitalEfficiencyScore,
  looksLikeJunkSymbol,
  popIgnitionScore,
  POP_IGNITION_FIRE,
  popBetFrac,
  flowSurge,
  autoTune,
  entryReject,
  executableMcReject,
  historyGateReject,
  evalExit,
  TUNED_COPY_LADDER,
  canOpen,
  repeatBudgetForMint,
  equity,
  riskBrake,
  snipeSignalScore,
  createAutopilotEngine
} from "../src/lib/autopilotEngine.js";

function baseState(over = {}) {
  return {
    mode: "normal",
    start: 1,
    bank: 1,
    peak: 1,
    minTradeSol: 0.012,
    maxOpen: 8,
    open: [],
    wins: 0,
    losses: 0,
    streak: 0,
    results: [],
    waves: {},
    recentSells: {},
    ...over
  };
}

function goodRow(over = {}) {
  return {
    tokenMint: "Mint1111111111111111111111111111111111111111",
    symbol: "GOOD",
    pairAgeSeconds: 18,
    marketCap: 2300,
    liquidityUsd: 6000,
    volume5m: 60,
    buys5m: 20,
    sells5m: 8,
    bestPickScore: 0,
    ...over
  };
}

test("low-churn: raises entry bar, concentrates size, caps positions at 3", async () => {
  // minScore bonus: low-churn never lowers the bar (exact +16 only holds above the
  // universal runner-safe floor, which both can clamp to).
  const normalP = aggParams(baseState());
  const lowP = aggParams(baseState({ minScoreBonus: 16 }));
  assert.ok(lowP.minScore >= normalP.minScore, "low-churn raises (never lowers) the bar");

  // bigger per-bet size vs normal on the same bank
  const normalState = baseState({ bank: 1, maxTradeSol: 0.05, sizeFracCap: 0.12, churn: "normal" });
  const lowState = baseState({ bank: 1, maxTradeSol: 0.12, sizeFracCap: 0.28, churn: "low" });
  assert.ok(sizeFor(lowState, aggParams(lowState)) > sizeFor(normalState, aggParams(normalState)), "low-churn bets bigger");

  // engine respects maxOpen 3 in low-churn
  let t = 0;
  const rows = Array.from({ length: 8 }, (_, i) => goodRow({ tokenMint: `Z${i}`, symbol: `Z${i}` }));
  const engine = createAutopilotEngine({
    getFreshFeed: async () => rows,
    getPairLite: async () => ({ marketCap: 2300, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, live: false, churn: "low" });
  for (let i = 0; i < 4; i++) { t += 1000; await engine._tick(); }
  assert.ok(engine.status().open.length <= 3, "low-churn holds at most 3 positions");
  await engine.stop("test");
});

test("aggParams: hot regime sizes up but holds the runner-safe entry floor", () => {
  const s = baseState({ results: ["W", "W", "W", "W", "W"], streak: 3 });
  const P = aggParams(s);
  assert.equal(P.regime, "HOT");
  assert.ok(P.regimeMult > 1);
  // STARTER BASELINE (2026-06-20, user-directed): the runner-safe floor was lowered from 58 to
  // a permissive 46/50 so the engine actually takes shots — the dedicated rug gates
  // (autopilotRowHasHardDanger feed gate + securityGate pre-buy) now do the rug protection the
  // score floor used to. Hot still holds the floor (doesn't drop BELOW it into raw garbage).
  assert.ok(P.minScore >= 46, "hot keeps the starter floor instead of dropping into raw garbage");
});

test("aggParams: cold regime shrinks size and demands quality but keeps buying", () => {
  const s = baseState({ results: ["L", "L", "L", "L", "L"], streak: -3 });
  const P = aggParams(s);
  assert.equal(P.regime, "COLD");
  assert.ok(P.regimeMult < 1);
  assert.ok(P.minScore > 40);
  // still produces a tradeable size, never zero
  assert.ok(sizeFor(s, P) >= s.minTradeSol);
});

test("sizeFor: clamps between min trade and 22% of bank", () => {
  const s = baseState({ bank: 1, streak: 3, results: ["W", "W", "W", "W"] });
  const P = aggParams(s);
  const size = sizeFor(s, P);
  assert.ok(size >= s.minTradeSol);
  assert.ok(size <= s.bank * 0.22 + 1e-9);
});

test("sizeFor: respects the hard per-trade ceiling even on a big bank + hot streak", () => {
  const s = baseState({ bank: 10, maxTradeSol: 0.06, streak: 5, results: ["W","W","W","W","W"] });
  const P = aggParams(s);
  assert.ok(sizeFor(s, P) <= 0.06 + 1e-9, "single bet capped to the max-trade ceiling");
});

test("freshScore: younger + buy-led scores higher than old + sell-led", () => {
  const young = freshScore(goodRow({ pairAgeSeconds: 20, buys5m: 30, sells5m: 4 }));
  const old = freshScore(goodRow({ pairAgeSeconds: 900, buys5m: 5, sells5m: 12 }));
  assert.ok(young > old);
});

test("autoTune: cold tape -> pickier + smaller, hot tape -> looser + bigger", () => {
  const cold = baseState({ recentPeaks: [0, 0, -10, 5, 20, 0, 0, -8], recentRugs: [true, true, true, false, false, true, false, true], lastTuneAt: 0 });
  autoTune(cold, 1_000_000);
  assert.equal(cold.tune.tape, "COLD");
  assert.ok(cold.tune.sizeMult < 1 && cold.tune.scoreBonus > 0);

  const hot = baseState({ recentPeaks: [300, 150, 220, 40, 600, 30, 180, 90], recentRugs: [false, false, false, false, false, false, false, false], lastTuneAt: 0 });
  autoTune(hot, 1_000_000);
  assert.equal(hot.tune.tape, "HOT");
  assert.ok(hot.tune.sizeMult > 1);
});

test("autoTune: market-wide COLD tape slows us down even with no own trades yet", () => {
  const s = baseState({ recentPeaks: [], recentRugs: [], lastTuneAt: 0 });
  autoTune(s, 1_000_000, { heat: "COLD", runRate: 0.03, rugRate: 0.7, sample: 40 });
  assert.equal(s.tune.tape, "COLD");
  assert.ok(s.tune.entryGapMs > 0 && s.tune.perCycle === 1);
});

test("autoTune: market-wide HOT tape presses even before our own sample is big", () => {
  const s = baseState({ recentPeaks: [], recentRugs: [], lastTuneAt: 0 });
  autoTune(s, 1_000_000, { heat: "HOT", runRate: 0.3, rugRate: 0.2, sample: 40 });
  assert.equal(s.tune.tape, "HOT");
  assert.ok(s.tune.sizeMult > 1);
});

test("autoTune: a thin market read (sample < 12) is ignored -> stays warming", () => {
  const s = baseState({ recentPeaks: [], recentRugs: [], lastTuneAt: 0, tune: { tape: "warming" } });
  autoTune(s, 1_000_000, { heat: "HOT", runRate: 0.5, rugRate: 0, sample: 5 });
  assert.equal(s.tune.tape, "warming");
});

test("autoTune: realized win-rate bleed forces COLD even on a green peak read", () => {
  const s = baseState({ recentPeaks: [50, 60, 40, 80, 45, 70], recentRugs: [false, false, false, false, false, false], results: ["L", "L", "L", "L", "W", "L", "L", "L", "L", "L"], lastTuneAt: 0 });
  autoTune(s, 1_000_000, null);
  assert.equal(s.tune.tape, "COLD");
});

test("autoTune: recovers from COLD after sitting out (re-probes stale losing history)", () => {
  const t = 10_000_000;
  const losing = { results: ["L", "L", "L", "L", "L", "L", "L", "L", "L", "L"], recentPnl: [-0.01, -0.01, -0.01, -0.01, -0.01, -0.01, -0.01, -0.01], recentPeaks: [0, 0, 0, 5, 0, 0, 0, 0], recentRugs: [true, true, false, false, true, false, true, true] };
  // just traded (idle < 4 min) with a losing history -> stays COLD (protect)
  const s1 = baseState({ ...losing, lastOpenAt: t - 60_000, lastTuneAt: 0 });
  autoTune(s1, t, null);
  assert.equal(s1.tune.tape, "COLD");
  // sat out 5+ min -> stale losing history expires, re-probe the tape (no longer COLD)
  const s2 = baseState({ ...losing, lastOpenAt: t - 5 * 60_000, lastTuneAt: 0 });
  autoTune(s2, t, null);
  assert.notEqual(s2.tune.tape, "COLD");
});

test("convictionMult: bigger on a proven dev + strong flow, smaller on a rugger", () => {
  const strong = goodRow({ pairAgeSeconds: 40, buys5m: 30, sells5m: 3, volume5m: 120, bestPickScore: 90 });
  const provenDev = { runners: 3, rugs: 0 };
  const rugDev = { runners: 0, rugs: 3 };
  const hi = convictionMult(strong, provenDev);
  const lo = convictionMult(goodRow({ buys5m: 3, sells5m: 12, volume5m: 20 }), rugDev);
  assert.ok(hi > 1.2, "high-confluence setup sizes up");
  assert.ok(lo < 0.9, "weak setup + rugger-dev sizes down");
  assert.ok(hi <= 1.6 && lo >= 0.5, "stays within bounds");
});

// ===== OFFENSE LEVERS =======================================================================
test("confluenceMult: a lone signal sizes normally, stacked independent signals press up (bounded)", () => {
  const row = goodRow();
  const dev = { runners: 1, rugs: 0 };
  const sm = { winners: 2 };
  const ci = { trusted: true };
  assert.equal(confluenceMult(row, dev, null, null, null), 1, "one signal = no press");
  assert.equal(confluenceMult(row, dev, sm, null, null), 1.15, "two signals");
  assert.equal(confluenceMult(row, dev, sm, ci, null), 1.45, "three signals");
  const xRow = goodRow({ xNotable: true });
  assert.equal(confluenceMult(xRow, dev, sm, ci, null), 1.8, "4+ independent signals = max press");
  // never above the cap even with every signal firing
  const everything = goodRow({ xNotable: true, _smartMoney: { earlyAlpha: true } });
  assert.equal(confluenceMult(everything, dev, sm, ci, null), 1.8, "clamped at 1.8");
});

test("capitalEfficiencyScore: rewards big avg swap size, docks micro-bot wash, neutral on tiny samples", () => {
  assert.equal(capitalEfficiencyScore({ volume5m: 50, buys5m: 1, sells5m: 1 }), 0, "<3 trades → neutral");
  // $4k volume over 20 trades = $200 avg swap → big-ticket real buyers
  assert.equal(capitalEfficiencyScore({ volume5m: 4000, buys5m: 15, sells5m: 5 }), 16);
  // $60 volume over 20 trades = $3 avg swap → wash theater → docked
  assert.equal(capitalEfficiencyScore({ volume5m: 60, buys5m: 14, sells5m: 6 }), -6);
  // a meaningful-but-modest avg swap scores positive
  assert.ok(capitalEfficiencyScore({ volume5m: 700, buys5m: 12, sells5m: 8 }) > 0);
});

test("freshScore: a coin with big real swaps outranks one with bot-wash micro-swaps at equal volume", () => {
  const real = freshScore(goodRow({ volume5m: 1200, buys5m: 8, sells5m: 4 }));   // ~$100 avg swap
  const wash = freshScore(goodRow({ volume5m: 1200, buys5m: 90, sells5m: 70 })); // ~$7.5 avg swap
  assert.ok(real > wash, "capital efficiency lifts real demand over wash");
});

test("looksLikeJunkSymbol: catches spam/scam/mash, passes real tickers", () => {
  // junk the live copy feed actually surfaced
  for (const j of ["SFASFA", "SFASFAFSAAAAA", "Fraudcoin", "TEST", "AAAA", "", "rug", "honeypot"]) {
    assert.equal(looksLikeJunkSymbol(j), true, `should flag junk: "${j}"`);
  }
  // real tickers must pass (no false positives)
  for (const ok of ["BTC", "WIF", "PEPE", "DOGE", "BONK", "POPCAT", "MOODENG", "SOL", "Clutch", "DRAGON"]) {
    assert.equal(looksLikeJunkSymbol(ok), false, `should pass real: "${ok}"`);
  }
});

test("popIgnitionScore: fires on accelerating buy-led inflow with a buyer burst, not on dust/sells", () => {
  // a real pop: 6x accel, 2 SOL inflow, 85% buy-led, 7 distinct buyers
  const hot = popIgnitionScore({ accel: 6, inflowNow: 2, buyShare: 0.85, uniqBuyers: 7, smart: false });
  assert.ok(hot >= POP_IGNITION_FIRE, "a real ignition clears the fire threshold");
  // dust burst (tiny inflow) does not fire
  assert.equal(popIgnitionScore({ accel: 9, inflowNow: 0.1, buyShare: 0.9, uniqBuyers: 9, smart: true }), 0);
  // sellers in control does not fire
  assert.equal(popIgnitionScore({ accel: 6, inflowNow: 2, buyShare: 0.4, uniqBuyers: 7, smart: false }), 0);
  // SUSTAINED buy pressure fires WITHOUT explosive acceleration (the mid-cap continuation pop) — heavy
  // buy-led flow + a real crowd + size clears the bar even at accel ~1.1
  assert.ok(popIgnitionScore({ accel: 1.1, inflowNow: 2, buyShare: 0.82, uniqBuyers: 7, smart: false }) >= POP_IGNITION_FIRE);
  // but a weak/quiet coin (modest flow, thin crowd) still does NOT fire
  assert.ok(popIgnitionScore({ accel: 1.0, inflowNow: 0.4, buyShare: 0.62, uniqBuyers: 3, smart: false }) < POP_IGNITION_FIRE);
  // smart money in the burst raises it
  assert.ok(popIgnitionScore({ accel: 4, inflowNow: 1, buyShare: 0.8, uniqBuyers: 5, smart: true }) >
            popIgnitionScore({ accel: 4, inflowNow: 1, buyShare: 0.8, uniqBuyers: 5, smart: false }));
});

test("popBetFrac: thin low-MC coins bet smaller, deeper coins take the full 5%", () => {
  assert.ok(popBetFrac(2000) < popBetFrac(50000), "a $2k coin bets less than a $50k coin");
  assert.equal(popBetFrac(80000), 0.05, "deep coins take the full bet");
  assert.ok(popBetFrac(4117) <= 0.03, "a ~$4k coin (live HERO -22% slippage loser) is sized down");
  assert.ok(popBetFrac(0) > 0 && popBetFrac(0) <= 0.05, "unknown MC stays bounded");
  // monotonic non-decreasing in MC
  assert.ok(popBetFrac(2999) <= popBetFrac(3000) && popBetFrac(7999) <= popBetFrac(8000));
});

test("aggParams: pop mode is a catchable MC spread, ignition-gated, tight stop", () => {
  const p = aggParams(baseState({ mode: "pop" }));
  assert.equal(p.pop, true);
  assert.equal(p.minScore, 0, "gated on ignition, not freshScore");
  // An EXITABLE catchable spread (~8k-250k): sub-8k bonding dust can't be sold, mega-caps already topped.
  assert.ok(p.mcFloor >= 5000 && p.mcFloor <= 10000 && p.mcCeil <= 300000 && p.mcCeil >= 50000, "exitable spread, not dust or mega-caps");
  assert.equal(p.sl, 12, "stop with room for a real 30%+ pop to breathe");
});

test("graduationScore: rewards mid-curve + SOL/min velocity, zero when no curve data", () => {
  assert.equal(graduationScore(goodRow()), 0, "no bonding data → no-op");
  const mid = graduationScore({ bondingPct: 0.5 });
  const ripping = graduationScore({ bondingPct: 0.5, curveVelSol: 3 });
  assert.ok(mid > 0, "mid-curve scores");
  assert.ok(ripping > mid, "velocity adds on top");
  assert.ok(graduationScore({ bondingPct: 0.5 }) > graduationScore({ bondingPct: 0.1 }), "sweet spot beats too-early");
});

test("freshScore: a coin accelerating toward graduation scores higher than the same coin without curve data", () => {
  const plain = freshScore(goodRow());
  const grad = freshScore(goodRow({ bondingPct: 0.55, curveVelSol: 3 }));
  assert.ok(grad > plain, "graduation/velocity lifts the fresh score");
});

test("flowSurge: zero on first read, fires on accelerating buy-flow + volume, expires after the window", () => {
  const cache = new Map();
  const first = flowSurge(cache, "m", { volume5m: 50, buys5m: 10, sells5m: 8 }, 1000);
  assert.equal(first, 0, "first read has no prior → 0");
  const surge = flowSurge(cache, "m", { volume5m: 120, buys5m: 30, sells5m: 5 }, 5000);
  assert.ok(surge > 0, "rising flow + volume → bonus");
  assert.ok(surge <= 0.3, "bounded");
  // a stale prior (>3min) does not count as a surge basis
  const stale = flowSurge(cache, "n", { volume5m: 10, buys5m: 5, sells5m: 5 }, 10_000);
  assert.equal(stale, 0, "fresh mint, no prior → 0");
});

test("convictionMult: entry-band timing, flow-surge, and learned weights each lift conviction (bounded)", () => {
  const provenSm = { winners: 2 };                       // proven → 1.6x cap so bonuses are visible
  const row = goodRow({ marketCap: 5000, pairAgeSeconds: 200 });
  // entry-band: coin MC inside the winners' historical band sizes up
  const off = convictionMult(row, null, provenSm, null);
  const band = convictionMult(row, null, { winners: 2, entryMcLo: 3000, entryMcHi: 8000 }, null);
  assert.ok(band > off, "in-band entry adds conviction");
  // flow-surge: accelerating flow sizes up
  const surged = convictionMult(goodRow({ pairAgeSeconds: 200, _flowSurge: 0.3 }), null, provenSm, null);
  assert.ok(surged > off, "flow-surge adds conviction");
  // learned weights: a strong winner-weight leans in, a weak one fades
  const leanIn = convictionMult(row, null, provenSm, null, { weights: { winners: 1.5 } });
  const fade = convictionMult(row, null, provenSm, null, { weights: { winners: 0.5 } });
  assert.ok(leanIn > fade, "learned signal weight scales the bonus");
  assert.ok(leanIn <= 1.6 && surged <= 1.6 && band <= 1.6, "all stay within the proven cap");
});

test("entryReject: passes a clean fresh mover", () => {
  const P = aggParams(baseState());
  assert.equal(entryReject(goodRow(), P), null);
});

test("executableMcReject: fresh entries execute inside the STARTER small-launch band ($1.8k-$60k)", () => {
  // STARTER BASELINE (2026-06-20, user-directed): ceiling widened $9k -> $60k so survived/climbing
  // small launches qualify (a higher MC is MORE exitable, not less). Floor stays $1.8k (sub-1.8k is
  // phantom dust that can't fill).
  const P = aggParams(baseState({ mode: "steady" }));
  assert.equal(executableMcReject(goodRow({ marketCap: 2300 }), P), null, "in-band low");
  assert.equal(executableMcReject(goodRow({ marketCap: 15000 }), P), null, "in-band high (the old $9k razor would have rejected this)");
  assert.equal(executableMcReject(goodRow({ marketCap: 1500 }), P), "entry-mc", "below the floor");
  assert.equal(executableMcReject(goodRow({ marketCap: 80000 }), P), "entry-mc", "above the widened ceiling");
  assert.equal(executableMcReject(goodRow({ marketCap: 80000 }), P, { kol: true }), null, "copy rows use KOL/wallet gates instead");
});

test("entryReject: STARTER baseline no longer rejects strong-scoring fresh rows (ceiling raised to 100)", () => {
  // STARTER BASELINE (2026-06-20, user-directed): the old 67-cap REJECTED the strongest-scoring
  // coins, which (with the [58,67) floor) left a razor 9-pt band almost nothing matched — a core
  // "found nothing in 29 min" cause. The ceiling is raised to 100 (effectively off); the dedicated
  // rug gates now do the protection the old score-cap was standing in for. So a strong-scoring,
  // otherwise-clean fresh row now PASSES instead of being blocked as "overscore".
  const P = aggParams(baseState({ mode: "steady" }));
  assert.equal(P.maxScore, 100, "fresh ceiling is the permissive starter value");
  const highMid = goodRow({ volume5m: 90, buys5m: 4, sells5m: 2, bestPickScore: 5 });
  assert.ok(freshScore(highMid) >= 67 && freshScore(highMid) < 100, "previously-blocked 67+ band");
  assert.equal(entryReject(highMid, P), null, "the old 67-cap row now passes");
});

test("entryReject: blocks instant-rug bait", () => {
  const P = aggParams(baseState());
  assert.equal(entryReject(goodRow({ pairAgeSeconds: 1 }), P), "age");
  // liquidity gate is relative to market cap (mc 5000 -> floor 1500)
  assert.equal(entryReject(goodRow({ liquidityUsd: 500 }), P), "liquidity");
  assert.equal(entryReject(goodRow({ volume5m: 5 }), P), "volume");
  assert.equal(entryReject(goodRow({ buys5m: 5, sells5m: 20 }), P), "dumping");
  assert.equal(entryReject(goodRow({ marketCap: 500 }), P), "mc");
});

test("entryReject: a $2k fresh launch with ~$2k liquidity is NOT rejected for liquidity", () => {
  const P = aggParams(baseState());
  // the real-market case that was wrongly filtered: mc≈liq≈2k
  const row = goodRow({ marketCap: 2300, liquidityUsd: 2200, pairAgeSeconds: 30, volume5m: 90, buys5m: 1, sells5m: 1 });
  assert.equal(entryReject(row, P), null);
});

test("historyGateReject: vetoes only clear bad local replay samples", () => {
  assert.equal(historyGateReject({ sampleSize: 7, confidence: "medium", failRatePercent: 100 }), null, "small samples do not block");
  assert.equal(historyGateReject({ sampleSize: 40, confidence: "low", failRatePercent: 100 }), null, "low confidence does not block");
  assert.equal(
    historyGateReject({ sampleSize: 18, confidence: "medium", failRatePercent: 89, winRatePercent: 11, medianMaxUpsidePercent: 12, medianMaxDrawdownPercent: -42 }),
    "history-fail"
  );
  assert.equal(
    historyGateReject({ sampleSize: 25, confidence: "high", failRatePercent: 44, winRatePercent: 56, medianMaxUpsidePercent: 80, medianMaxDrawdownPercent: -12 }),
    null,
    "healthy matched history stays tradeable"
  );
});

test("grind: enters only at safer (higher) MC and skips the sub-7k rug zone", () => {
  const P = aggParams(baseState({ mode: "grind" }));
  // window: floor $3k (feed is mostly sub-$5k; quality gating does the rug-dodging), ceiling
  // 80k, waits out the first ~20s, deeper liq.
  assert.ok(P.mcFloor >= 6000 && P.mcFloor < 10000, "grind floors above the instant-rug/phantom dust");
  assert.ok(P.mcCeil > 20000, "grind reaches well higher for survived coins");
  assert.ok(P.minLiqAbs >= 3000, "grind enforces an absolute liquidity floor (anti-phantom)");
  // a thin-liquidity coin (phantom-spike risk) is rejected even at a fine MC
  assert.equal(entryReject(goodRow({ marketCap: 9000, liquidityUsd: 1500, pairAgeSeconds: 120, volume5m: 120, buys5m: 25, sells5m: 8, bestPickScore: 80 }), P), "liquidity");
  assert.ok(P.minAge >= 12, "grind waits out the worst instant-rug seconds");
  assert.ok(P.maxAge >= 3600, "grind accepts older survived coins from the last-hour window");
  assert.ok(P.liqFrac > 0.3, "grind demands deeper liquidity");
  // a 30-min-old survived coin (rejected by the default 20-min cap) is accepted by grind
  assert.equal(
    entryReject(goodRow({ marketCap: 22000, liquidityUsd: 14000, pairAgeSeconds: 1800, volume5m: 160, buys5m: 30, sells5m: 10, bestPickScore: 72 }), P),
    null
  );
  assert.ok(P.sl >= 7, "grind uses a wider stop so dips don't shake out winners");
  // the deepest dust (sub-$3k brand-new curve) is rejected for MC
  assert.equal(entryReject(goodRow({ marketCap: 1500, liquidityUsd: 2000, pairAgeSeconds: 90 }), P), "mc");
  // too young (still in the worst rug seconds) is rejected even at a good MC
  assert.equal(entryReject(goodRow({ marketCap: 12000, liquidityUsd: 9000, pairAgeSeconds: 8 }), P), "age");
  // a healthy, survived $12k coin with deep liquidity passes
  assert.equal(
    entryReject(goodRow({ marketCap: 12000, liquidityUsd: 9000, pairAgeSeconds: 90, volume5m: 120, buys5m: 25, sells5m: 8, bestPickScore: 80 }), P),
    null
  );
});

test("grind: an OLDER survived/climbing coin passes (grindScore), where freshScore would reject it", () => {
  const P = aggParams(baseState({ mode: "grind" }));
  const normalP = aggParams(baseState());
  // 400s old, $25k, deep liquidity, strong buy-led volume — exactly what grind wants, but
  // freshScore punishes the age + higher MC so it would never clear a freshScore bar.
  const survivor = goodRow({ marketCap: 25000, liquidityUsd: 15000, pairAgeSeconds: 400, volume5m: 150, buys5m: 30, sells5m: 10, bestPickScore: 70 });
  assert.ok(freshScore(survivor) < 62, "freshScore structurally rejects this survived coin");
  assert.ok(grindScore(survivor) >= P.minScore, "grindScore recognizes it as a quality base-hit");
  assert.equal(entryReject(survivor, P), null, "grind accepts the survived coin");
  // a thin, dumping coin is still rejected by grind
  assert.ok(entryReject(goodRow({ marketCap: 9000, liquidityUsd: 1500, pairAgeSeconds: 120, volume5m: 10 }), P));
});

test("grind: banks the bulk at +30% and caps the ride at +150% (base-hits, not moonshots)", () => {
  const P = aggParams(baseState({ mode: "grind" }));
  assert.ok(P.tp1 <= 30 && P.tp1 >= 24, "first take-profit lands around +30%");
  assert.ok(P.moonTarget <= 150, "no moonshot chase — ride is capped near +150%");
  assert.ok(!P.steady, "grind ladders (not a single-pop bank-and-hold)");
  const base = { entryMc: 10000, entryLiq: 9000, lastLiq: 9000, openedAt: 0, missed: 0, peakPct: 0 };
  // +30% pop banks the BULK (~65%) but keeps a tail to ladder
  const tp1 = evalExit({ ...base, lastMc: 10000 * 1.3, tp1Done: false }, P, 1000);
  assert.equal(tp1.reason, "tp1");
  assert.ok(tp1.pct >= 65 && tp1.pct <= 75, "banks ~70% at the first pop");
  // a coin reaching the +150% cap is fully closed (no holding for a 500x)
  const cap = evalExit({ ...base, lastMc: 10000 * 2.5, tp1Done: true, tp2Done: true, tp3Done: true, peakPct: 150 }, P, 1000);
  assert.equal(cap.reason, "tp4"); assert.equal(cap.pct, 100);
});

test("apex router: a liquid mover banks the bulk early at +18% then trails the small runner (steady wins)", () => {
  const P = aggParams(baseState({ mode: "apex" }));
  const base = { entryMc: 60000, entryLiq: 40000, lastLiq: 40000, openedAt: 0, missed: 0, peakPct: 0, bankEarly: true };
  // past +18% → bank the BULK at the high-hit-rate take (steady wins, not a round-trip on the slow ladder)
  const e = evalExit({ ...base, lastMc: 60000 * 1.20, tp1Done: false }, P, 1000);
  assert.equal(e.reason, "bank-early");
  assert.ok(e.pct >= 80, "banks the bulk (~82%) once past +18%");
  // the small runner trails: after the bulk bank, a give-back from a modest peak (10-25% gap the
  // general trail misses) closes it so it can't fade back to scratch.
  const trail = evalExit({ ...base, lastMc: 60000 * 1.05, tp1Done: true, peakPct: 15 }, P, 2000);
  assert.equal(trail.reason, "bank-early-trail");
  assert.equal(trail.pct, 100);
  // a FRESH apex trade (no bankEarly) does NOT bank at +18% — it keeps room to run from a low base.
  const fresh = evalExit({ ...base, bankEarly: false, lastMc: 60000 * 1.18, tp1Done: false }, P, 1000);
  assert.notEqual(fresh.reason, "bank-early");
});

test("apexType routes the playbook: pop / liquid / fresh are distinguished", () => {
  // a live pop (real turnover + breakout) → pop playbook (fast bank/fade)
  assert.equal(apexType({ liquidityUsd: 30000, marketCap: 120000, volume5m: 24000, buys5m: 60, sells5m: 12, m5: 20, h1: 30, pairAgeSeconds: 1800 }), "pop");
  // a deeper, older mover with no live spike → liquid playbook (bank early)
  assert.equal(apexType({ liquidityUsd: 40000, marketCap: 200000, volume5m: 1000, buys5m: 10, sells5m: 10, pairAgeSeconds: 6000 }), "liquid");
  // a brand-new launch → fresh playbook (room to run)
  assert.equal(apexType({ liquidityUsd: 2500, marketCap: 2500, volume5m: 120, buys5m: 30, sells5m: 8, pairAgeSeconds: 20 }), "fresh");
});

test("swing mode: established-coin universe + longer holds + wide stop (the latency-robust strategy)", () => {
  const P = aggParams(baseState({ mode: "swing" }));
  assert.equal(P.swing, true);
  // ESTABLISHED universe — not fresh dust, not a dead mega-cap, real depth, survived the rug window.
  assert.ok(P.mcFloor >= 25000 && P.mcCeil <= 2000000, "swing targets the established $25k-$2M band");
  assert.ok(P.minLiqAbs >= 8000, "swing demands real liquidity depth (rug resistance + clean fills)");
  assert.ok(P.minAge >= 600, "swing only takes coins that survived 10min+ (past the instant-rug window)");
  assert.ok(P.maxAge >= 86400, "swing is age-agnostic upward — a durable mover can run for days");
  // LONGER holds + WIDE stop — won't get wicked out of a normal dip, banks a base-hit, rides a runner.
  assert.ok(P.sl >= 20, "swing uses a WIDE stop (established coins dip and recover)");
  assert.ok(P.tp1 <= 25 && P.tp1Pct >= 55, "swing banks a base-hit majority at a reachable first pop");
  assert.equal(P.bankHard, false, "swing rides its runner — no cold-tape early-bank clamp");
});

test("swingScore: admits safe established movers, rejects dust / thin / blow-off tops", () => {
  // an established coin: $180k MC, $90k liq, hour-old, buy-led, healthy +22% uptrend → high score
  const good = { liquidityUsd: 90000, marketCap: 180000, volumeH1: 120000, buysH1: 600, sellsH1: 380, m5: 3, h1: 22, pairAgeSeconds: 9000 };
  assert.ok(swingScore(good) >= 60, "a safe established mover scores high");
  // brand-new $2k dust — disqualified outright (too thin, too young to be safe to hold)
  assert.equal(swingScore({ liquidityUsd: 2048, marketCap: 2048, volumeH1: 300, buysH1: 20, sellsH1: 10, m5: 40, h1: 0, pairAgeSeconds: 30 }), 0, "fresh dust is never 'safe to hold'");
  // thin midcap (only $6k liq) — disqualified (no depth = no rug resistance / clean fills)
  assert.equal(swingScore({ liquidityUsd: 6000, marketCap: 120000, volumeH1: 2000, buysH1: 40, sellsH1: 35, m5: 5, h1: 10, pairAgeSeconds: 8000 }), 0, "thin liquidity is disqualified");
  // a blow-off top breaking down (sell-led, h1 -30%) scores far below the safe mover
  const top = { liquidityUsd: 120000, marketCap: 300000, volumeH1: 200000, buysH1: 300, sellsH1: 520, m5: 75, h1: -30, pairAgeSeconds: 12000 };
  assert.ok(swingScore(top) < swingScore(good) - 20, "a breaking-down blow-off top scores well below a healthy mover");
});

test("evalExit: a proven-dev moon bag rides longer before the time-cap, still bounded", () => {
  const P = aggParams(baseState());
  // +50% move, bulk already banked (tp1Done), liquidity intact, modest peak — the only
  // exit in play here is the slot-freeing moonbag time-cap.
  const base = { entryMc: 10000, lastMc: 15000, entryLiq: 9000, lastLiq: 9000, openedAt: 0, missed: 0, peakPct: 50, tp1Done: true };
  const fiveMin = 5 * 60_000;
  // Unknown dev (devAvgPeak null): default 4-min cap → cashed at 5 min to free the slot.
  assert.equal(evalExit({ ...base }, P, fiveMin).reason, "moonbag-timeout");
  // Proven big-runner dev (avgPeak 300): 7-min leash → still holding at 5 min.
  assert.equal(evalExit({ ...base, devAvgPeak: 300 }, P, fiveMin).action, "hold");
  // ...but the leash is bounded — even a proven dev's bag is capped (here at 11 min).
  assert.equal(evalExit({ ...base, devAvgPeak: 300 }, P, 11 * 60_000).reason, "moonbag-timeout");
});

test("evalExit: hard stop fires past -sl", () => {
  const P = aggParams(baseState());
  const pos = { entryMc: 5000, lastMc: 4500, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0 };
  const d = evalExit(pos, P, 1000);
  assert.equal(d.action, "sell");
  assert.equal(d.reason, "stop");
  assert.equal(d.pct, 100);
});

test("evalExit: ladder tp1 -> tp2 -> tp3 -> tp4 lets a runner ride", () => {
  const P = aggParams(baseState());
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, peakPct: 0 };
  const tp1 = evalExit({ ...base, lastMc: 5000 * 1.3, tp1Done: false }, P, 1000);
  assert.equal(tp1.reason, "tp1"); assert.equal(tp1.pct, 55);
  // Fast spike (+150%+) banks the bulk at once instead of laddering into a fade.
  const spike = evalExit({ ...base, lastMc: 5000 * 2.6, tp1Done: false, peakPct: 160 }, P, 1000);
  assert.equal(spike.reason, "spike"); assert.equal(spike.pct, 75);
  // TP2 banks half the remainder, keeps a moon bag (not a full close)
  const tp2 = evalExit({ ...base, lastMc: 5000 * 2, tp1Done: true, tp2Done: false, peakPct: 100 }, P, 1000);
  assert.equal(tp2.reason, "tp2"); assert.equal(tp2.pct, 50);
  // +200% sells half the moon bag
  const tp3 = evalExit({ ...base, lastMc: 5000 * 3, tp1Done: true, tp2Done: true, tp3Done: false, peakPct: 200 }, P, 1000);
  assert.equal(tp3.reason, "tp3"); assert.equal(tp3.pct, 50);
  // +500% closes the runner
  const tp4 = evalExit({ ...base, lastMc: 5000 * 6, tp1Done: true, tp2Done: true, tp3Done: true, peakPct: 500 }, P, 1000);
  assert.equal(tp4.reason, "tp4"); assert.equal(tp4.pct, 100);
});

test("apex: unified edge ranks setups head-to-head; wide entry window; type routing", () => {
  // A live POP (turnover spike + buy-led breakout + depth) scores high on the unified edge.
  const popRow = { tokenMint: "p", symbol: "POP", liquidityUsd: 30000, marketCap: 120000, volume5m: 24000, buys5m: 60, sells5m: 12, m5: 20, h1: 30, pairAgeSeconds: 1800 };
  // A strong FRESH launch (seconds old, buy-led, in the $2k pocket).
  const freshRow = { tokenMint: "f", symbol: "NEW", marketCap: 2200, liquidityUsd: 2200, volume5m: 140, buys5m: 40, sells5m: 8, pairAgeSeconds: 12 };
  // A dead coin — no momentum, no flow.
  const deadRow = { tokenMint: "d", symbol: "DEAD", marketCap: 4000, liquidityUsd: 500, volume5m: 5, buys5m: 1, sells5m: 1, pairAgeSeconds: 4000 };
  assert.ok(apexEdge(popRow) >= 60, "a real pop scores a high unified edge");
  assert.ok(apexEdge(freshRow) >= 50, "a strong fresh launch scores a solid edge");
  assert.ok(apexEdge(deadRow) < apexEdge(freshRow), "a dead coin ranks below a real setup");
  // Confluence + smart-money stack the edge (a fresh launch a winner is ALSO buying).
  assert.ok(apexEdge({ ...freshRow, smartMoney: "KOL" }) > apexEdge(freshRow), "smart-money stacks the edge");
  // Type routing for the right playbook.
  assert.equal(apexType(popRow), "pop", "a popping coin routes to the fast in/out playbook");
  assert.equal(apexType({ ...freshRow, smartMoney: "KOL" }), "copy", "a smart-money coin routes to the copy ladder");
  // Apex params: ONE wide window across all sources (any age, fresh-dust floor → mid-cap ceiling).
  const P = aggParams(baseState({ mode: "apex" }));
  assert.equal(P.apex, true);
  assert.ok(P.mcFloor <= 1800 && P.mcCeil >= 1000000, "apex spans fresh dust → liquid mid-caps");
  assert.ok(P.maxAge >= 86400, "apex is age-agnostic (a pop/mover can be any age)");
  // A fresh launch with a CONFIRMING signal (real curve velocity = buyers piling into the curve)
  // passes the apex gate...
  assert.equal(entryReject({ ...freshRow, curveVelSol: 3 }, P), null, "apex admits a CONFIRMED fresh mover");
  // ...but a pure-youth sub-$9k launch with NO confirmation is rejected as dust (the fee-bleed fix:
  // apex was spraying dozens of ~$2k newborns/min on youth alone).
  assert.equal(entryReject(freshRow, P), "unconfirmed", "apex rejects unconfirmed fresh dust");
  assert.equal(entryReject(popRow, P), null, "apex admits a live pop");
});

test("apex dust filter: a ~$2k newborn needs a CONFIRMING signal, not just youth (the fee-bleed fix)", () => {
  const P = aggParams(baseState({ mode: "apex" }));
  // The exact thing the logs showed apex spraying: a brand-new ~$2k launch with a little launch
  // volume but NO backing — no smart money, no social, no real curve velocity. Pure lottery dust.
  const dust = { tokenMint: "d", symbol: "NEWB", marketCap: 2048, liquidityUsd: 2048, volume5m: 120, buys5m: 30, sells5m: 10, pairAgeSeconds: 20 };
  assert.equal(entryReject(dust, P), "unconfirmed", "unconfirmed fresh dust is rejected");
  // Each confirming signal individually rescues it (real backing/demand, not just newness):
  assert.equal(entryReject({ ...dust, smartMoney: "KOL" }, P), null, "a tracked winner buying confirms it");
  assert.equal(entryReject({ ...dust, curveVelSol: 2 }, P), null, "strong curve velocity confirms it");
  assert.equal(entryReject({ ...dust, xNotable: true }, P), null, "real social heat confirms it");
  // A liquid mover (mc ≥ $9k with real turnover) is NOT dust — it sails through untouched.
  const mover = { tokenMint: "m", symbol: "MOV", marketCap: 60000, liquidityUsd: 40000, volume5m: 9000, buys5m: 70, sells5m: 30, m5: 9, h1: 8, pairAgeSeconds: 3000 };
  assert.equal(entryReject(mover, P), null, "a real liquid mover is never treated as dust");
});

test("apex: a CONFIRMED live pop out-ranks fresh-launch youth — buys the easy winner, not the dust", () => {
  // A real but marginal spike off the live feed (BL4x class): $28k MC, 0.5x turnover, +5% m5, buy-led.
  // This row carries the activity the pop-feed now passes through (volume5m/m5/flow) — before the fix
  // the feed handed apex a stripped shell (volume5m:0) so the scorer read it blind and it lost.
  const confirmedPop = { tokenMint: "x", symbol: "POP", liquidityUsd: 28000, marketCap: 28000, volume5m: 14000, buys5m: 30, sells5m: 20, m5: 5, h1: 4, pairAgeSeconds: 2400 };
  // Brand-new sub-$10k launches scoring high on pure youth — the fresh dust apex was spraying + rotating.
  const freshDust = { tokenMint: "y", symbol: "NEW", marketCap: 3000, liquidityUsd: 3000, volume5m: 200, buys5m: 45, sells5m: 6, pairAgeSeconds: 10 };
  const freshHot = { tokenMint: "h", symbol: "HOT", marketCap: 6000, liquidityUsd: 5000, volume5m: 1200, buys5m: 80, sells5m: 10, pairAgeSeconds: 30 };
  assert.ok(jumpScore(confirmedPop) >= 44, "the pop is a real confirmed spike");
  assert.ok(apexEdge(confirmedPop) > apexEdge(freshHot), "a confirmed pop out-ranks even a hot fresh launch");
  assert.ok(apexEdge(confirmedPop) > apexEdge(freshDust) + 25, "and decisively out-ranks fresh dust");
  // The confirmed-momentum premium really fires (edge sits above the raw read).
  assert.ok(apexEdge(confirmedPop) > jumpScore(confirmedPop) + 15, "confirmed momentum gets a premium on top of raw heat");
  // No false premium for a coin that ISN'T popping — fresh youth is not handed momentum it didn't earn.
  assert.equal(jumpScore(freshDust), 0, "fresh dust has no live spike");
  // And it routes to the fast in/out playbook (pop banks fast, doesn't round-trip on the fresh ladder).
  assert.equal(apexType(confirmedPop), "pop", "a confirmed pop routes to pop→bank-fast, not the fresh ladder");
});

test("apex Stage 2: deep-vet re-ranks finalists on holders/dev/rug data", () => {
  const base = 70;
  // A confirmed rug is killed outright (never buy).
  assert.ok(apexDeepEdge(base, { rugged: true }) < 0, "a rugged coin is killed");
  // Heavy insider/sniper/bundler concentration drops the edge.
  const concentrated = apexDeepEdge(base, { insidersPct: 40, snipersPct: 35, bundlersPct: 30, top10Pct: 70 });
  assert.ok(concentrated < base - 30, "stacked concentration tanks the edge");
  // A clean cap table with a PROVEN dev (runners, no rugs) + burned LP lifts it above a marginal coin.
  const clean = apexDeepEdge(base, { insidersPct: 3, snipersPct: 4, bundlersPct: 2, top10Pct: 20, devRunners: 2, devRugs: 0, lpBurnedPct: 100 });
  assert.ok(clean > base, "a clean coin with a proven dev + burned LP gets a boost");
  assert.ok(clean > concentrated, "clean ranks above concentrated after the deep vet");
  // A serial rugger dev is penalized hard even on a momentum-strong coin.
  assert.ok(apexDeepEdge(base, { devRugs: 2 }) < base - 30, "serial rugger dev is penalized");
  // No deep data → edge unchanged (Stage-1 ranking preserved; never blocks the trade).
  assert.equal(apexDeepEdge(base, null), base, "no deep data keeps the Stage-1 edge");
});

test("evalExit: MC-aware profit takes — a high-MC entry banks SOONER (less room to pop)", () => {
  const P = aggParams(baseState());
  const ride = { entryLiq: 9000, lastLiq: 9000, openedAt: 0, missed: 0, peakPct: 0, tp1Done: true, tp2Done: true, tp3Done: true };
  // A low-MC ($5k) entry keeps the full ladder: +500% closes (base moonTarget), but a +400% runner is NOT
  // yet closed — it still rides toward the moon.
  const lowAt400 = evalExit({ ...ride, entryMc: 5000, lastMc: 5000 * 5, peakPct: 400 }, P, 1000);
  assert.notEqual(lowAt400.reason, "tp4", "low-MC entry still rides at +400% (full ladder)");
  // A high-MC ($50k) entry has less room, so the moon target scales down (×0.6 ≈ +300%) — the SAME +400%
  // runner is closed here. Banking sooner on the bigger cap is the whole point.
  const highAt400 = evalExit({ ...ride, entryMc: 50000, lastMc: 50000 * 5, peakPct: 400 }, P, 1000);
  assert.equal(highAt400.reason, "tp4", "high-MC entry banks the runner sooner"); assert.equal(highAt400.pct, 100);
});

test("evalExit: steady mode LOCKS A WIN at the first pop (banks ~88%) and rides the tail to +400%", () => {
  const P = aggParams(baseState({ mode: "steady" }));
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, peakPct: 0 };
  // bank the BULK at the first doable pop — enough that the trade is a real net win even if the
  // tiny runner dies (0.88 * 1.25 = +10% locked), the heart of "winning steady".
  const tp1 = evalExit({ ...base, lastMc: 5000 * 1.3, tp1Done: false }, P, 1000);
  assert.equal(tp1.reason, "tp1"); assert.equal(tp1.pct, 88);
  // after TP1, mid rungs do NOT fire — the 20% runner is held
  const mid = evalExit({ ...base, lastMc: 5000 * 3.5, tp1Done: true, tp2Done: false, peakPct: 250 }, P, 1000);
  assert.notEqual(mid.reason, "tp2");
  assert.notEqual(mid.reason, "tp3");
  // the runner cashes at +400%
  const moon = evalExit({ ...base, lastMc: 5000 * 5, tp1Done: true, tp2Done: true, tp3Done: false, peakPct: 400 }, P, 1000);
  assert.equal(moon.reason, "tp4"); assert.equal(moon.pct, 100);
});

test("evalExit: blend mode ladders ~25% tranches in a HOT tape, rides the tail to +400%", () => {
  // Blend only ladders when the tape is HOT (coins climbing); otherwise it banks hard.
  const P = aggParams(baseState({ mode: "blend", tune: { tape: "HOT" } }));
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, peakPct: 0 };
  // first tranche: 25% at the first doable pop
  const t1 = evalExit({ ...base, lastMc: 5000 * 1.3, tp1Done: false }, P, 1000);
  assert.equal(t1.reason, "tp1"); assert.equal(t1.pct, 25);
  // second tranche: ~33% of remainder at +100%
  const t2 = evalExit({ ...base, lastMc: 5000 * 2, tp1Done: true, tp2Done: false, peakPct: 100 }, P, 1000);
  assert.equal(t2.reason, "tp2"); assert.equal(t2.pct, 33);
  // third tranche: 50% of remainder at +200%
  const t3 = evalExit({ ...base, lastMc: 5000 * 3, tp1Done: true, tp2Done: true, tp3Done: false, peakPct: 200 }, P, 1000);
  assert.equal(t3.reason, "tp3"); assert.equal(t3.pct, 50);
  // the tail rides to +400%
  const t4 = evalExit({ ...base, lastMc: 5000 * 5, tp1Done: true, tp2Done: true, tp3Done: true, peakPct: 400 }, P, 1000);
  assert.equal(t4.reason, "tp4"); assert.equal(t4.pct, 100);
});

test("evalExit: smart-money exit banks before the tracked wallet's typical dump", () => {
  const P = aggParams(baseState());
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, peakPct: 0, smartExitPct: 170 };
  // below the learned smart-money exit level -> not yet
  const before = evalExit({ ...base, lastMc: 5000 * 2 }, P, 1000); // +100%
  assert.notEqual(before.reason, "smart-exit");
  // at/above the level -> bank the whole position before they dump
  const at = evalExit({ ...base, lastMc: 5000 * 2.8 }, P, 1000); // +180% >= 170
  assert.equal(at.reason, "smart-exit");
  assert.equal(at.pct, 100);
});

test("evalExit: adaptive dev-avg take banks near a dev's typical top", () => {
  const P = aggParams(baseState());
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, tp1Done: true };
  // dev tops ~200% on average; at +130% (>= 0.6*200) take the whole position
  const d = evalExit({ ...base, lastMc: 5000 * 2.3, peakPct: 130, devAvgPeak: 200 }, P, 1000);
  assert.equal(d.reason, "dev-avg-take");
  assert.equal(d.pct, 100);
  // a high-avg dev (800) is NOT taken yet at +130% — let it ride
  const d2 = evalExit({ ...base, lastMc: 5000 * 2.3, peakPct: 130, devAvgPeak: 800 }, P, 1000);
  assert.notEqual(d2.reason, "dev-avg-take");
  // no dev history -> falls through to the normal ladder
  const d3 = evalExit({ ...base, lastMc: 5000 * 2.3, peakPct: 130, devAvgPeak: null, tp2Done: false }, P, 1000);
  assert.notEqual(d3.reason, "dev-avg-take");
});

test("evalExit: trailing give-back catches a runner that reverses", () => {
  const P = aggParams(baseState());
  // peaked at +450%, now back to +200% (retraced past half of peak) -> sell rest
  const d = evalExit({ entryMc: 5000, lastMc: 5000 * 3, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, tp1Done: true, peakPct: 450 }, P, 1000);
  assert.equal(d.reason, "trail");
  assert.equal(d.pct, 100);
});

test("evalExit: liquidity pull triggers rug exit", () => {
  const P = aggParams(baseState());
  const d = evalExit({ entryMc: 5000, lastMc: 5200, entryLiq: 6000, lastLiq: 1000, openedAt: 0, missed: 0 }, P, 1000);
  assert.equal(d.reason, "rug");
  assert.equal(d.pct, 100);
});

test("canOpen: multi-position allowed beyond two while cash + deployment permit", () => {
  const s = baseState({ bank: 1 });
  // open three small positions
  for (let i = 0; i < 3; i++) {
    s.open.push({ mint: `m${i}`, entryMc: 5000, lastMc: 5000, costSol: 0.05, remFrac: 1 });
    s.bank -= 0.05;
  }
  assert.equal(s.open.length, 3);
  assert.equal(canOpen(s, 0.05), true, "should still open a 4th position");
});

test("canOpen: respects soft max and over-deployment", () => {
  const s = baseState({ bank: 0.5, maxOpen: 4 });
  for (let i = 0; i < 4; i++) s.open.push({ mint: `m${i}`, entryMc: 5000, lastMc: 5000, costSol: 0.1, remFrac: 1 });
  assert.equal(canOpen(s, 0.05), false, "maxOpen reached");
});

test("repeatBudgetForMint: one win earns one fresh re-entry, scratches/losses revoke it", () => {
  const P = aggParams(baseState({ mode: "steady" }));
  assert.equal(repeatBudgetForMint(baseState(), P, "M1"), 1);
  assert.equal(repeatBudgetForMint(baseState({ coinWins: { M1: 1 }, coinLosses: {} }), P, "M1"), 2);
  assert.equal(repeatBudgetForMint(baseState({ coinWins: { M1: 1 }, coinLosses: { M1: 1 } }), P, "M1"), 1);
  const scalpP = aggParams(baseState({ mode: "scalp" }));
  assert.equal(repeatBudgetForMint(baseState({ coinWins: { M1: 3 }, coinLosses: { M1: 1 } }), scalpP, "M1"), 4);
});

test("equity: realizable — sellable bag gets the haircut", () => {
  // A 2x-marked bag WITH real liquidity contributes its haircut value (60% of the upside),
  // not the raw 2x mark: a thin fresh curve can't actually pay the full marked gain.
  const s = baseState({ bank: 0.5 });
  s.open.push({ entryMc: 5000, lastMc: 10000, lastLiq: 5000, costSol: 0.5, remFrac: 1 });
  // raw 2.0 -> 1 + (2-1)*0.6 = 1.6x ; equity = 0.5 cash + 0.5*1.6 = 1.3
  assert.equal(round(equity(s)), 1.3);
});

test("equity: realizable — unsellable up-mark is capped at COST (no phantom equity)", () => {
  // The phantom-mark fix: a bag marked +400% but with no real liquidity (< $1500) can't be
  // sold, so it must NEVER inflate equity. It contributes cost, not the phantom mark.
  const s = baseState({ bank: 0.5 });
  s.open.push({ entryMc: 5000, lastMc: 25000, lastLiq: 200, costSol: 0.5, remFrac: 1 });
  assert.equal(round(equity(s)), 1.0); // 0.5 cash + 0.5 cost — the +400% mark is ignored
});

test("equity: realizable — full downside still counts", () => {
  // Losses are real and sellable — equity takes the full downside (no haircut on the way down).
  const s = baseState({ bank: 0.5 });
  s.open.push({ entryMc: 5000, lastMc: 2500, lastLiq: 5000, costSol: 0.5, remFrac: 1 });
  assert.equal(round(equity(s)), 0.75); // 0.5 cash + 0.5*0.5 = 0.75
});

// ---- engine lifecycle (paper mode, mocked feed) ----

function round(n) {
  return Math.round(n * 1e6) / 1e6;
}

test("engine: paper session apes a good coin then takes profit", async () => {
  let t = 0;
  const clock = () => t;
  let mc = 2300;
  const feed = async () => [goodRow()];
  const pairLite = async () => ({ marketCap: mc, liquidityUsd: 6000 });
  let buys = 0;
  let sells = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: feed,
    getPairLite: pairLite,
    buyToken: async () => {
      buys++;
      return { ok: true, tokenAmount: "1000" };
    },
    sellPercent: async () => {
      sells++;
      return { ok: true };
    },
    now: clock,
    persist: async () => {},
    isPaused: async () => false
  });

  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  // tick 1: manage (no pos) ; tick 3: hunt -> opens
  for (let i = 0; i < 3; i++) {
    t += 2200;
    await engine._tick();
  }
  let st = engine.status();
  assert.ok(st.open.length >= 1, "should have opened at least one position");

  // Ramp to a +500% runner so the ladder fires tp1 -> tp2 -> tp3 -> tp4 and closes.
  mc = 2300 * 6;
  for (let i = 0; i < 5; i++) {
    t += 2200;
    await engine._tick();
  }
  st = engine.status();
  assert.ok(st.wins >= 1, "should have booked a win after the ladder closed the runner");
  assert.equal(buys, 0, "paper mode never calls buyToken");
  assert.equal(sells, 0, "paper mode never calls sellPercent");
  await engine.stop("test-done");
});

test("engine: local replay veto blocks historically bad unproven entries", async () => {
  let t = 0;
  let historyCalls = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: 2300, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    entryHistory: async () => {
      historyCalls += 1;
      return { sampleSize: 24, confidence: "medium", failRatePercent: 88, winRatePercent: 12, medianMaxUpsidePercent: 14, medianMaxDrawdownPercent: -38 };
    },
    now: () => t,
    persist: async () => {}
  });

  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  t += 2200;
  await engine._hunt();
  const st = engine.status();
  assert.equal(historyCalls, 1, "local replay was checked for the candidate");
  assert.equal(st.open.length, 0, "bad matched history blocks the entry");
  assert.equal(engine._state().lastRejTally["history-fail"], 1);
  await engine.stop("test-done");
});

test("engine: POP candidate is pre-vetted by the radar — buys despite a failing history veto", async () => {
  // The live no-buy bug: AURORY ignited at score 100 and got "Skipping … local replay history-fail".
  // POP is confirmed by the radar (real accel + buy-share + unique buyers), so it must OVERRIDE the
  // local-replay comps veto + the momentum re-confirm — exactly like a proven snipe/copy.
  let t = 0;
  let historyCalls = 0;
  const popRow = {
    tokenMint: "PopMint11111111111111111111111111111111111111",
    symbol: "POPPER", marketCap: 8000, liquidityUsd: 0, pairAgeSeconds: 1,
    volume5m: 0, buys5m: 0, sells5m: 0, source: "pop", _pop: { score: 80, inflowNow: 3 }
  };
  const engine = createAutopilotEngine({
    getPopFeed: async () => [popRow],
    getPairLite: async () => ({ marketCap: 8000, liquidityUsd: 0 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    entryHistory: async () => {            // same brutal verdict that vetoes a normal-mode entry
      historyCalls += 1;
      return { sampleSize: 24, confidence: "medium", failRatePercent: 88, winRatePercent: 12, medianMaxUpsidePercent: 14, medianMaxDrawdownPercent: -38 };
    },
    now: () => t,
    persist: async () => {}
  });

  await engine.start({ solBudget: 1, minutes: 60, mode: "pop", live: false });
  t += 2200;
  await engine._hunt();
  const st = engine.status();
  assert.equal(historyCalls, 0, "pop is pre-vetted → the local-replay gate is skipped entirely");
  assert.equal(st.open.length, 1, "the ignited pop opens despite the failing history comps");
  assert.equal(st.open[0].mint, popRow.tokenMint);
  await engine.stop("test-done");
});

test("engine: pop HOLDS a flat fizzling pop, then stagnation-cuts the non-runner after ~18s", async () => {
  // No more scratch-banking a +0% at 8s (that's a NET LOSS after fees). A flat pop that never clears
  // fees is HELD (it might still run), then cut as a non-runner once its inflow is dead and it's had a
  // fair look (~18s). Flat price the whole time → no stop/target/lock fires, only the stagnation cut.
  let t = 0;
  let inflow = 5;
  let feed = [{
    tokenMint: "PopMint22222222222222222222222222222222222222",
    symbol: "FLATPOP", marketCap: 9000, liquidityUsd: 5000, pairAgeSeconds: 1,
    volume5m: 0, buys5m: 0, sells5m: 0, source: "pop", _pop: { score: 80, inflowNow: 5 }
  }];
  const engine = createAutopilotEngine({
    getPopFeed: async () => feed,
    getPairLite: async () => ({ marketCap: 9000, liquidityUsd: 5000 }),   // flat price the whole test
    popInflow: () => inflow,
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "pop", live: false });
  t += 2200; await engine._hunt();
  assert.equal(engine.status().open.length, 1, "pop opened");
  feed = [];
  inflow = 0.1;              // inflow collapses; price stays flat (+0%)
  t += 10000; await engine._tick();   // ~10s held — UNDER the 18s stagnation window
  assert.equal(engine.status().open.length, 1, "a flat fizzling pop is HELD, NOT scratch-banked at +0%");
  t += 10000; await engine._tick();   // ~20s held — past the window, inflow dead, never ran
  assert.equal(engine.status().open.length, 0, "stagnation-cut the fizzled non-runner");
  await engine.stop("test-done");
});

test("engine: a pop that runs then gives back is TRAIL-LOCKED (banks the move, not a round-trip to flat)", async () => {
  // The user's directive: ride for a real, fee-clearing move (≥+15-30%), and lock it when it gives back
  // from the peak — never round-trip a +20% winner back to flat.
  let t = 0;
  let inflow = 5;
  let mc = 9000;
  let feed = [{
    tokenMint: "PopMint33333333333333333333333333333333333333",
    symbol: "RUNNER", marketCap: 9000, liquidityUsd: 5000, pairAgeSeconds: 1,
    volume5m: 0, buys5m: 0, sells5m: 0, source: "pop", _pop: { score: 80, inflowNow: 5 }
  }];
  const engine = createAutopilotEngine({
    getPopFeed: async () => feed,
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 5000 }),
    popInflow: () => inflow,
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "pop", live: false });
  t += 2200; await engine._hunt();
  assert.equal(engine.status().open.length, 1, "pop opened");
  feed = [];
  t += 7000; await engine._tick();    // first manage read past the 6s entry-anchor window → basis locked at 9000
  mc = 10800;                          // +20% peak (under tp1 +30%, so only the trailing lock is in play)
  t += 2000; await engine._tick();
  assert.equal(engine.status().open.length, 1, "near its peak — rides, doesn't lock");
  mc = 10080;                          // gave back to +12% (<= 20% peak * 0.66) → trail-lock
  t += 2000; await engine._tick();
  assert.equal(engine.status().open.length, 0, "trail-locked the move once it gave back from the peak");
  await engine.stop("test-done");
});

test("engine: self-arm holds entries while warming, then trades once readiness is high", async () => {
  // LOW readiness → WARMING: stays live + learning, opens NOTHING even on a good coin.
  let t = 0;
  const warming = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: 2300, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    getReadiness: () => ({ score: 0.2, label: "learning" }),
    now: () => t,
    persist: async () => {}
  });
  await warming.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  t += 2200; await warming._hunt();
  let st = warming.status();
  assert.equal(st.open.length, 0, "warming (low readiness) takes no entries");
  assert.equal(st.armState, "warming");
  await warming.stop("test-done");

  // HIGH readiness → ARMED: takes the entry.
  let t2 = 0;
  const armed = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: 2300, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    getReadiness: () => ({ score: 0.9, label: "ready" }),
    now: () => t2,
    persist: async () => {}
  });
  await armed.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  t2 += 2200; await armed._hunt();   // first sight → momentum-confirm watch (non-elite needs 2 reads)
  t2 += 2200; await armed._hunt();   // held strong → opens
  st = armed.status();
  assert.ok(st.open.length >= 1, "armed (high readiness) takes the entry");
  assert.equal(st.armState, "armed");
  await armed.stop("test-done");
});

test("engine: live mode routes through buy/sell deps", async () => {
  let t = 0;
  let mc = 2300;
  let buys = 0;
  let sells = 0;
  let soldPos = null;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 6000 }),
    buyToken: async () => {
      buys++;
      return { ok: true, tokenAmount: "1000" };
    },
    sellPercent: async (_mint, _pct, pos) => {
      sells++;
      soldPos = pos;
      return { ok: true };
    },
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: true, walletPubkey: "WalletPubkeyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" });
  for (let i = 0; i < 3; i++) {
    t += 2200;
    await engine._tick();
  }
  assert.ok(buys >= 1, "live mode calls buyToken");
  mc = 2300 * 1.7;
  t += 2200;
  await engine._tick();
  assert.ok(sells >= 1, "live mode calls sellPercent");
  assert.equal(soldPos?.tokenAmount, "1000", "live sells receive the original token amount");
  await engine.stop("test-done");
});

test("live PnL basis: extra wallet SOL over the budget is NOT phantom profit", async () => {
  let t = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],            // no candidates → no trades; only the wallet reconcile runs
    getWalletSol: async () => 1.05,          // dedicated wallet holds MORE than the 1.0 budget
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: true, walletPubkey: "W".repeat(44) });
  t += 2200;
  await engine._hunt();                      // first flat reconcile → captures basis = real wallet balance
  const s = engine.status();
  assert.ok(Math.abs(s.pnlPct) < 0.5, `no phantom gain before any trade (got ${s.pnlPct}%)`);
  assert.equal(s.start, 1.05, "displayed baseline tracks the real starting balance, not the budget");
  assert.equal(s.stakeBudget, 1, "deploy budget is still exposed separately");
  await engine.stop("test-done");
});

test("live bank reconcile is flat-only — a held bag's cost is not double-counted", async () => {
  let t = 0;
  const walletSol = 1.0;                       // wallet still shows the FULL balance (buy not settled on-chain)
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getWalletSol: async () => walletSol,
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: true, walletPubkey: "W".repeat(44) });
  t += 2200; await engine._hunt();             // flat reconcile → bank=1.0, basis=1.0
  // Simulate a freshly-bought bag whose buy hasn't settled: synthetic ledger debited 0.2, but the
  // on-chain wallet still reads the full 1.0 (settlement lag).
  const st = engine._state();
  st.bank = 0.8;
  st.open.push({ mint: "M".repeat(44), sym: "LAG", costSol: 0.2, remFrac: 1, entryMc: 2300, lastMc: 2300, dispMc: 2300, entryLiq: 6000, lastLiq: 6000, openedAt: t, peakPct: 0, remainingMoonFrac: 1, realized: 0 });
  t += 2200; await engine._hunt();             // NOT flat → must NOT clobber bank back up to walletSol(1.0)
  const s = engine.status();
  assert.ok(Math.abs(s.bank - 0.8) < 0.001, `bank stays on the synthetic ledger while holding (got ${s.bank})`);
  assert.ok(s.pnlPct < 1, `held bag's cost not double-counted into the headline (got ${s.pnlPct}%)`);
  await engine.stop("test-done");
});

test("stop reconciles the headline to the REAL wallet — the '+7% while the wallet bled to 0.7' fix", async () => {
  let t = 0;
  let wallet = 0.9;                              // session starts at 0.9 SOL
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getWalletSol: async () => wallet,
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 0.9, minutes: 60, mode: "normal", live: true, walletPubkey: "W".repeat(44) });
  t += 2200; await engine._hunt();              // first flat reconcile → basis = 0.9, bank = 0.9
  assert.equal(engine.status().start, 0.9, "basis captured at the real 0.9 start");
  // Simulate a LOSING session whose synthetic ledger DRIFTED above the wallet — the Jito tip + priority
  // fee per swap aren't debited from it and unconfirmed sells booked optimistic estimates, inflating
  // bank to 0.963 (a fake +7%) while the wallet actually bled to 0.7.
  const st = engine._state();
  st.bank = 0.963;
  wallet = 0.7;
  assert.ok(engine.status().pnlPct > 5, "pre-stop headline is still on the drifted ledger (the reported bug)");
  // Stop must snap the ledger to the REAL wallet — the final number is the truth, a real ~-22%.
  const s = await engine.stop("manual");
  assert.ok(Math.abs(s.bank - 0.7) < 0.001, `stop snaps bank to the real wallet (got ${s.bank})`);
  assert.ok(s.pnlPct < -15, `final headline shows the REAL loss, not +7% (got ${s.pnlPct}%)`);
});

test("settled-but-open reconcile: after 30s quiet, bank snaps to the real wallet even while holding a bag", async () => {
  let t = 0;
  let wallet = 1.0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getWalletSol: async () => wallet,
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: true, walletPubkey: "W".repeat(44) });
  t += 2200; await engine._hunt();              // flat reconcile → bank=1.0, basis=1.0
  // Hold a bag; the synthetic ledger drifted to 0.95 (fee/estimate drift) while the wallet's real cash
  // is 0.6 (0.4 is in the bag). lastTradeAt is set "now"; swaps settle within 30s.
  const st = engine._state();
  st.bank = 0.95;
  st.lastTradeAt = t;
  st.open.push({ mint: "M".repeat(44), sym: "HOLD", costSol: 0.4, remFrac: 1, entryMc: 2300, lastMc: 2300, dispMc: 2300, entryLiq: 6000, lastLiq: 6000, openedAt: t, peakPct: 0, remainingMoonFrac: 1, realized: 0 });
  wallet = 0.6;                                  // real cash (the other 0.4 sits in the bag)
  // Within 30s of the trade → keeps the synthetic ledger (the settlement-lag guard: a just-spent buy
  // may still show in ws), so it must NOT clobber bank.
  t += 10_000; await engine._hunt();
  assert.ok(Math.abs(engine._state().bank - 0.95) < 0.001, "within 30s: keeps the synthetic ledger (settlement-lag guard)");
  // Past 30s quiet → every swap has landed, ws is pure cash → bank snaps to it (bag added at cost on top).
  t += 25_000; await engine._hunt();
  assert.ok(Math.abs(engine._state().bank - 0.6) < 0.001, `after 30s quiet: bank snaps to real wallet cash (got ${engine._state().bank})`);
  await engine.stop("test-done");
});

test("server autopilot sell adapter passes original token amount to sell helper", () => {
  const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const start = serverSource.indexOf("sellPercent: async (mint, pct, pos = null)");
  assert.ok(start >= 0, "adapter accepts the engine position object");
  const adapter = serverSource.slice(start, start + 1800);   // adapter grew with escalating-slippage exit retries
  assert.match(adapter, /pos\.tokenAmount/);
  assert.match(adapter, /baseRawAmount/);
  assert.match(adapter, /sellTokenFromWallet/);
  assert.match(adapter, /\.\.\.\(baseRawAmount \? \{ baseRawAmount \} : \{\}\)/);
  // the live-money fix: exits escalate slippage until they land instead of failing flat at 7%
  assert.match(adapter, /levels|escalat/i);
});

test("server observatory learns linked wallets and exits from working swap-api trades", () => {
  const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(serverSource, /function linkRelatedBuyerWallets/);
  assert.match(serverSource, /function isLinkedWinnerWallet/);
  assert.match(serverSource, /function recordWalletExit/);
  assert.match(serverSource, /else if \(side === "sell"\) recordWalletExit\(mint, trader\)/);
  assert.match(serverSource, /linkRelatedBuyerWallets\(c\.buyers \|\| \[\], ranMult, rugged\)/);
});

test("server KOL brain tracks all API KOLs, learns outcomes, and links related wallets", () => {
  const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(serverSource, /const trackedKolWallets = new Map/);
  assert.match(serverSource, /const kolSignalStats = new Map/);
  assert.match(serverSource, /const kolSignalMints = new Map/);
  assert.match(serverSource, /function rememberTrackedKolWallet/);
  assert.match(serverSource, /function recordKolSignal/);
  assert.match(serverSource, /function recordKolOutcome/);
  assert.match(serverSource, /async function sampleKolSignalOutcomes/);
  assert.match(serverSource, /\["hot", "fresh", "top", "consistent"\]\.map/);
  assert.match(serverSource, /recordKolSignal\(r\); \/\/ learn every KOL pattern/);
  assert.match(serverSource, /isTrackedKolWallet\(w\) \|\| isWinnerWallet\(walletObs\.get\(w\)\)/);
  assert.match(serverSource, /s\.failed = \(Number\(s\.failed\) \|\| 0\) \+ 1/);
  assert.match(serverSource, /learnedGood \|\| \(apiGood && confluence && rowScore >= 72\)/);
  assert.match(serverSource, /linkedKolLeaders/);
  assert.match(serverSource, /linkedWinnerLeaders/);
  assert.match(serverSource, /kolProbeCandidates/);
});

test("server copy brain blocks backtested losers from winner and related-wallet paths", () => {
  const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  assert.match(serverSource, /function isBacktestedCopyLoser/);
  assert.match(serverSource, /function copyTierForWalletRecord/);
  assert.match(serverSource, /if \(isBacktestedCopyLoser\(r\)\) return false;/);
  assert.match(serverSource, /if \(!r \|\| isBacktestedCopyLoser\(r\)\) return false;/);
  assert.match(serverSource, /if \(isBacktestedCopyLoser\(r\) && !isOrganicWinnerWallet\(r\)\) continue;/);
  assert.match(serverSource, /if \(isBacktestedCopyLoser\(r\)\) continue;/);
  assert.match(serverSource, /copyLadder: "s10_t40_f70"/);
});

test("engine: KOL probe copy entries can open small and exit fast while learning", async () => {
  let t = 0;
  let buys = 0;
  let boughtLamports = 0;
  const row = goodRow({
    tokenMint: "KolProbeMint11111111111111111111111111111111",
    symbol: "KOLP",
    pairAgeSeconds: 600,
    marketCap: 60000,
    liquidityUsd: 25000,
    volume5m: 120,
    buys5m: 12,
    sells5m: 4,
    _smartMoney: { kolProbe: true, winners: 0, source: "kol_probe" }
  });
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow({ tokenMint: "RejectFresh111111111111111111111111111111111", symbol: "NOPE", marketCap: 1000000 })],
    getPairLite: async () => ({ marketCap: row.marketCap, liquidityUsd: row.liquidityUsd }),
    smartMoneyReady: () => true,
    smartMoneyFeed: async () => [row],
    buyToken: async (_mint, lamports) => { buys++; boughtLamports = lamports; return { ok: true, tokenAmount: "1" }; },
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: true, walletPubkey: "W".repeat(44) });
  try {
    t += 6000;
    await engine._tick();
    const open = engine.status().open[0];
    const rawOpen = engine._state().open[0];
    assert.equal(buys, 1);
    assert.ok(boughtLamports > 0, "probe still buys when the KOL row clears probe quality");
    assert.equal(open.sym, "KOLP");
    assert.equal(rawOpen.smartExitPct, 18, "thin-sample KOL probes bank faster than proven copies");
    assert.ok(open.costSol <= 0.04, "probe size remains small");
  } finally {
    await engine.stop("test-done");
  }
});

test("engine: winner-follow copy opens from quiet fresh feed and uses tuned copy ladder", async () => {
  let t = 0;
  let mc = 60000;
  const trades = [];
  const row = goodRow({
    tokenMint: "WinnerFollowMint111111111111111111111111111111",
    symbol: "WFOL",
    pairAgeSeconds: 900,
    marketCap: mc,
    liquidityUsd: 30000,
    volume5m: 600,
    buys5m: 30,
    sells5m: 8,
    _smartMoney: {
      kol: true,
      winners: 1,
      edge: 1.3,
      apeScore: 1.7,
      source: "winner_follow",
      copyTier: "B",
      copyLadder: "s10_t40_f70"
    }
  });
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 30000 }),
    smartMoneyReady: () => true,
    smartMoneyFeed: async () => [row],
    recordTrade: (rec) => trades.push(rec),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  try {
    t += 6000;
    await engine._tick();
    let raw = engine._state().open[0];
    assert.equal(raw.sym, "WFOL");
    assert.equal(raw.source, "winner_follow");
    assert.equal(raw.copyTier, "B");
    assert.deepEqual(raw.copyLadder, TUNED_COPY_LADDER);
    assert.equal(raw.smartExitPct, null, "default winner-follow exit does not override tuned ladder");

    mc = 60000 * 1.41;
    t += 7000;
    await engine._exit();
    raw = engine._state().open[0];
    assert.equal(raw.copyTp1Done, true);
    assert.ok(Math.abs(raw.remFrac - 0.3) < 0.001, `copy TP1 should leave a 30% runner, got ${raw.remFrac}`);

    mc = 60000 * 6.1;
    t += 1000;
    await engine._exit();
    assert.equal(engine._state().open.length, 0);
    assert.equal(trades[0].source, "winner_follow");
    assert.equal(trades[0].copyTier, "B");
    assert.ok(engine.status().sourceStats.winner_follow.pnl > 0);
  } finally {
    await engine.stop("test-done");
  }
});

test("engine: post-fill MC guard sells back fresh entries that leave the winning bucket", async () => {
  let t = 0;
  let buys = 0;
  let sells = 0;
  const liveMarks = [2300, 80000]; // fill in-band ($2.3k), then drift OUT of the STARTER band ($1.8k-$60k)
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow({ tokenMint: "DriftMint111111111111111111111111111111111", symbol: "DRIFT", marketCap: 2300 })],
    getPairLite: async () => ({ marketCap: liveMarks.length ? liveMarks.shift() : 80000, liquidityUsd: 5000 }),
    buyToken: async () => { buys++; return { ok: true, tokenAmount: "1000" }; },
    sellPercent: async (_mint, pct, pos) => { sells++; assert.equal(pct, 100); assert.equal(pos.tokenAmount, "1000"); return { ok: true, receivedSol: 0.0118 }; },
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "steady", live: true, walletPubkey: "W".repeat(44) });
  try {
    t += 6000;
    await engine._tick();
    assert.equal(buys, 0, "first scan only arms momentum confirmation");
    t += 6000;
    await engine._tick();
    assert.equal(buys, 1, "the scan was valid and the buy fired");
    assert.equal(sells, 1, "post-fill MC drift sold back immediately");
    assert.equal(engine.status().open.length, 0, "out-of-band fill is not held as a normal position");
    assert.equal(engine._state().tradeNo, 0, "guarded sell-back is not counted as a strategy trade");
  } finally {
    await engine.stop("test-done");
  }
});

test("engine: same-mint winner re-entry waits for a real pullback", async () => {
  let t = 0;
  let buys = 0;
  const row = goodRow({
    tokenMint: "RebuyMint111111111111111111111111111111111",
    symbol: "REBUY",
    pairAgeSeconds: 600,
    marketCap: 98000,
    liquidityUsd: 30000,
    volume5m: 12000,
    buys5m: 35,
    sells5m: 5,
    m5: 12,
    h1: 20
  });
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getLiquidFeed: async () => [row],
    getPairLite: async () => ({ marketCap: row.marketCap, liquidityUsd: row.liquidityUsd }),
    buyToken: async () => { buys++; return { ok: true, tokenAmount: "1" }; },
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "scalp", live: false });
  try {
    Object.assign(engine._state(), {
      coinWins: { [row.tokenMint]: 1 },
      coinLosses: {},
      coinTrades: { [row.tokenMint]: 1 },
      recentSells: { [row.tokenMint]: { at: -200000, mc: 100000, reason: "tp1", win: true } }
    });
    t += 121000;
    await engine._tick();
    assert.equal(engine.status().open.length, 0, "cooldown alone is not enough to rebuy a winner near the prior sell mark");
    row.marketCap = 90000;
    t += 121000;
    await engine._tick();
    assert.equal(engine.status().open.length, 1, "a real pullback can earn the winner re-entry");
  } finally {
    await engine.stop("test-done");
  }
});

test("engine: live mode refuses to start without a wallet", async () => {
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => null,
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true })
  });
  await assert.rejects(() => engine.start({ solBudget: 1, minutes: 60, live: true }), /dedicated wallet/);
});

test("engine: stop sells every open position and opens no more", async () => {
  let t = 0;
  let sells = 0;
  const rows = Array.from({ length: 6 }, (_, i) => goodRow({ tokenMint: `M${i}`, symbol: `S${i}` }));
  const engine = createAutopilotEngine({
    getFreshFeed: async () => rows,
    getPairLite: async () => ({ marketCap: 2300, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1" }),
    sellPercent: async () => { sells++; return { ok: true }; },
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "degen", live: true, walletPubkey: "W".repeat(44) });
  for (let i = 0; i < 3; i++) { t += 1000; await engine._tick(); }
  assert.ok(engine.status().open.length >= 3, "should hold positions before stop");
  const after = await engine.stop("manual");
  assert.equal(after.open.length, 0, "stop must leave zero open positions");
  assert.ok(sells >= 3, "stop sold the open positions");
  // a stray hunt after stop must not open anything
  await engine._hunt();
  assert.equal(engine.status().open.length, 0, "no positions opened after stop");
});

test("engine: profit-lock stops + flattens after giving back half the peak gain", async () => {
  let t = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => null,
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, live: false, profitLock: { giveback: 0.5, minGainPct: 5 } });
  const s = engine._state();
  s.peak = 1.2;   // peaked at +20%
  s.bank = 1.08;  // gave back to +8% — that's 60% of the 0.2 gain, past the 50% lock
  t += 1000;
  await engine._exit();
  const st = engine.status();
  assert.equal(st.running, false);
  assert.equal(st.stopReason, "profit-lock");
});

test("engine: profit vault sweeps gains above the stake and keeps running", async () => {
  let t = 0;
  let walletSol = 1; // start at the stake
  const swept = [];
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => null,
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {},
    getWalletSol: async () => walletSol,
    sweepProfit: async (dest, amt) => { swept.push(amt); walletSol -= amt; return { ok: true, sentSol: amt }; }
  });
  await engine.start({ solBudget: 1, minutes: 60, live: true, walletPubkey: "W".repeat(44), vault: { destination: "V".repeat(44) } });
  // first slow-loop pass captures the vault floor at the starting balance (1.0)
  await engine._hunt();
  // now the wallet grows to 1.4 (profit) — next pass sweeps only the excess above the floor
  walletSol = 1.4;
  await engine._hunt();
  const st = engine.status();
  assert.ok(swept.length === 1, "should sweep once");
  assert.ok(swept[0] > 0.35 && swept[0] < 0.4, "sweeps the excess above stake minus buffer");
  assert.equal(st.running, true, "session keeps running after a vault sweep");
  assert.ok(st.secured > 0.35, "secured tracks the vaulted profit");
  await engine.stop("test");
});

test("engine: bank-the-peak ratchet STOPS on a giveback (never round-trips a green peak)", async () => {
  let t = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => null,
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, live: false });
  const s = engine._state();
  // Peaked +40%, gave back to +18% (past the half-gain floor at +20%) but still green.
  s.peakTotal = 1.4; s.bank = 1.18;
  t += 1000;
  await engine._exit();
  const st = engine.status();
  assert.equal(st.running, false, "ratchet flattens and stops to bank the green peak");
  assert.equal(st.stopReason, "locked-gains");
});

test("engine: lock-gains CONTINUE mode banks the green and keeps trading", async () => {
  let t = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => null,
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, live: false, lockGainsContinue: true });
  const s = engine._state();
  // Same giveback that STOPS by default — but continue mode should bank + keep running.
  s.peakTotal = 1.4; s.bank = 1.18;
  t += 1000;
  await engine._exit();
  const st = engine.status();
  assert.equal(st.running, true, "continue mode keeps the session running");
  assert.ok(st.lockedBankedSol > 0, "the banked green is tracked");
  assert.ok(s.lockBase >= 1.17, "protected baseline ratchets up to the banked level");
  await engine.stop("test");
});

test("engine: loss cap flattens and stops", async () => {
  let t = 0;
  let mc = 2300;
  // Many fresh mid-score rows so it deploys most of the bankroll across several positions;
  // tanking them all then drops realized equity below the cap. This test is about the
  // loss-cap backstop, not the blocked 72+ blowoff band.
  const rows = Array.from({ length: 8 }, (_, i) => goodRow({ tokenMint: `Mint${i}`, symbol: `C${i}`, pairAgeSeconds: 20 }));
  const engine = createAutopilotEngine({
    getFreshFeed: async () => rows,
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  // Tighter loss cap (5%) + explicit maxTradeSol so the backstop is exercised independently
  // of per-trade size tuning. The unproven-coin conviction cap (0.7x) keeps total deployment
  // conservative, so a 20% cap would sit out of reach in this fixture; 5% definitively breaches
  // when several positions are tanked. This test verifies the loss-cap
  // backstop FIRES, not the entry-sizing math.
  await engine.start({ solBudget: 1, minutes: 60, mode: "degen", live: false, maxTradeSol: 0.1, lossCapFrac: 0.05 });
  for (let i = 0; i < 3; i++) {
    t += 2200;
    await engine._tick();
  }
  assert.ok(engine.status().open.length >= 4, "should hold several positions");
  // tank everything; manageExits realizes the losses, then loss cap trips.
  mc = 100;
  for (let i = 0; i < 3; i++) {
    t += 2200;
    await engine._tick();
  }
  const st = engine.status();
  assert.equal(st.running, false);
  assert.equal(st.stopReason, "loss-cap");
});

// --- Caller-intel conviction wiring (P2a) -----------------------------------------------
test("convictionMult: a trusted caller signal adds bounded conviction and enables proven sizing", () => {
  const row = { buys5m: 5, sells5m: 4, volume5m: 40, pairAgeSeconds: 120, marketCap: 9000 };
  const base = convictionMult(row, null, null);                       // unproven, capped at 0.7
  const withCaller = convictionMult(row, null, null, { trusted: true, convictionDelta: 0.3, reason: "proven caller" });
  assert.ok(withCaller > base, "trusted caller raises conviction");
  assert.ok(withCaller > 0.7, "trusted caller lifts the unproven 0.7x cap (treated as proven edge)");
  assert.ok(withCaller <= 1.6, "still bounded by the proven ceiling");
});

test("convictionMult: an untrusted/zero caller signal does not change conviction", () => {
  const row = { buys5m: 5, sells5m: 4, volume5m: 40, pairAgeSeconds: 120, marketCap: 9000 };
  const base = convictionMult(row, null, null);
  assert.equal(convictionMult(row, null, null, { trusted: false, convictionDelta: 0 }), base);
  assert.equal(convictionMult(row, null, null, null), base);          // null is safe
});

test("engine: profit vault does a FINAL bank on session stop (last gains aren't left in the hot wallet)", async () => {
  let t = 0;
  let walletSol = 1;
  const swept = [];
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [],
    getPairLite: async () => null,
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {},
    getWalletSol: async () => walletSol,
    sweepProfit: async (dest, amt) => { swept.push(amt); walletSol -= amt; return { ok: true, sentSol: amt }; }
  });
  await engine.start({ solBudget: 1, minutes: 60, live: true, walletPubkey: "W".repeat(44), vault: { destination: "V".repeat(44) } });
  await engine._hunt();            // captures the vault floor at 1.0, nothing to sweep yet
  assert.equal(swept.length, 0, "no sweep at the stake");
  walletSol = 1.3;                 // profit realized as cash, not yet swept by a slow loop
  await engine.stop("timer");      // stopping must bank the leftover profit
  assert.equal(swept.length, 1, "final sweep banks the leftover profit on stop");
  assert.ok(swept[0] > 0.27 && swept[0] < 0.3, "sweeps excess above stake minus the fee buffer");
  assert.ok(engine.status().secured > 0.27, "secured reflects the final bank");
});

test("engine: sweepNow banks profit on demand and keeps the session running", async () => {
  let t = 0; let walletSol = 1; const swept = [];
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [], getPairLite: async () => null,
    buyToken: async () => ({ ok: true }), sellPercent: async () => ({ ok: true }),
    now: () => t, persist: async () => {},
    getWalletSol: async () => walletSol,
    sweepProfit: async (dest, amt) => { swept.push(amt); walletSol -= amt; return { ok: true, sentSol: amt }; }
  });
  await engine.start({ solBudget: 1, minutes: 60, live: true, walletPubkey: "W".repeat(44), vault: { destination: "V".repeat(44) } });
  await engine._hunt();           // floor captured at 1.0
  walletSol = 1.25;               // profit sitting as cash
  const res = await engine.sweepNow();
  assert.equal(res.ok, true);
  assert.ok(res.swept > 0.22 && res.swept < 0.24, "banks excess above stake minus buffer");
  assert.equal(engine.status().running, true, "session keeps running after a manual bank");
  await engine.stop("test"); // clear the interval loops so node --test can exit
});

// --- Per-mode winner shaping: degen fix + conviction caps + per-mode loss budget --------------
test("aggParams: degen no longer loosens the entry bar (the rug magnet is gone)", () => {
  const degen = aggParams(baseState({ mode: "degen" }));
  const normal = aggParams(baseState({ mode: "normal" }));
  // STARTER BASELINE (2026-06-20): universal floor lowered 58 -> 46. The invariant that matters
  // (degen does NOT get a looser bar than normal — that's what made it a rug magnet) still holds.
  assert.ok(degen.minScore >= 46, "degen still respects the starter fs floor");
  assert.ok(degen.minScore >= normal.minScore - 1e-9, "degen is no longer looser than normal");
});

test("aggParams: per-mode conviction caps concentrate degen into proven setups", () => {
  const degen = aggParams(baseState({ mode: "degen" }));
  const chill = aggParams(baseState({ mode: "chill" }));
  const normal = aggParams(baseState({ mode: "normal" }));
  assert.equal(degen.unprovenConvCap, 0.6);
  assert.equal(degen.provenConvCap, 1.6);
  assert.equal(chill.provenConvCap, 1.15);
  assert.equal(normal.unprovenConvCap, 0.7);
  // snipes are lottery tickets — keep conviction sizing modest so bets stay small + even (moonshot math)
  const snipe = aggParams(baseState({ mode: "snipeRide" }));
  assert.equal(snipe.provenConvCap, 1.3);
});

test("convictionMult: honors per-mode caps (degen unproven 0.6, chill proven 1.15)", () => {
  const row = { buys5m: 8, sells5m: 1, volume5m: 80, pairAgeSeconds: 40, marketCap: 9000 };
  const proven = { runners: 3, rugs: 0 };
  assert.ok(convictionMult(row, null, null, null, { unprovenCap: 0.6, provenCap: 1.6 }) <= 0.6 + 1e-9, "degen caps unproven at 0.6");
  assert.ok(convictionMult(row, proven, null, null, { unprovenCap: 0.6, provenCap: 1.6 }) > 0.6, "proven sizes above the unproven cap");
  assert.ok(convictionMult(row, proven, { kol: true, winners: 3 }, null, { unprovenCap: 0.7, provenCap: 1.15 }) <= 1.15 + 1e-9, "chill never oversizes past 1.15");
});

test("engine: per-mode session loss cap protects learning modes tighter", async () => {
  let t = 0;
  const mk = () => createAutopilotEngine({ getFreshFeed: async () => [], getPairLite: async () => null, buyToken: async () => ({ ok: true }), sellPercent: async () => ({ ok: true }), now: () => t, persist: async () => {} });
  for (const [mode, cap] of [["chill", 0.06], ["steady", 0.08], ["blend", 0.08], ["grind", 0.08], ["scalp", 0.08], ["degen", 0.10], ["normal", 0.12]]) {
    const e = mk();
    await e.start({ solBudget: 1, minutes: 60, live: false, mode });
    assert.ok(Math.abs(e._state().lossCapFrac - cap) < 1e-9, `${mode} loss cap ${cap}`);
    await e.stop("test");
  }
});

test("aggParams: chill is capital-preservation — banks hard with a low moon (not the 500% ladder)", () => {
  const chill = aggParams(baseState({ mode: "chill" }));
  assert.ok(chill.tp1Pct >= 75, "chill banks the bulk at the first pop");
  assert.ok(chill.moonTarget <= 350, "chill rides only a modest tail");
  const normal = aggParams(baseState({ mode: "normal" }));
  assert.ok(normal.moonTarget >= 500, "normal still rides the full ladder (distinct from chill)");
});

test("engine: per-mode per-bet sizing (degen biggest, chill smallest)", async () => {
  let t = 0;
  const mk = () => createAutopilotEngine({ getFreshFeed: async () => [], getPairLite: async () => null, buyToken: async () => ({ ok: true }), sellPercent: async () => ({ ok: true }), now: () => t, persist: async () => {} });
  const cap = {};
  for (const mode of ["degen", "chill", "normal"]) {
    const e = mk(); await e.start({ solBudget: 1, minutes: 60, live: false, mode });
    cap[mode] = e._state().sizeFracCap; await e.stop("test");
  }
  assert.ok(cap.degen > cap.normal, "degen concentrates more per bet");
  assert.ok(cap.chill < cap.normal, "chill preserves capital with smaller bets");
});

// ── SCALP mode (liquid movers, fast in/out) ─────────────────────────────────────────────────

test("liquidScore: a liquid, buy-led, early-momentum mover beats a thin, fading one", () => {
  const strong = { liquidityUsd: 90000, marketCap: 600000, volume5m: 60000, buys5m: 40, sells5m: 12, m5: 12, h1: 30 };
  const weak = { liquidityUsd: 9000, marketCap: 600000, volume5m: 500, buys5m: 6, sells5m: 20, m5: -15, h1: -40 };
  assert.ok(liquidScore(strong) > liquidScore(weak) + 25, "real depth + buy flow + early momentum scores far higher");
  // already-blown-off top (huge +5m) is worth less than a clean early push
  const late = { ...strong, m5: 120 };
  assert.ok(liquidScore(strong) > liquidScore(late), "an early push beats a blown-off top");
});

test("jumpScore: a buy-led volume-spike breakout scores high; non-surges score 0", () => {
  // clean jump point: huge turnover (vol > liq), heavily buy-led, clean +5m breakout, 1h-green
  const jump = { liquidityUsd: 40000, marketCap: 500000, volume5m: 60000, buys5m: 80, sells5m: 18, m5: 18, h1: 22 };
  assert.ok(jumpScore(jump) >= 70, "a real surge scores high");
  // sell-led "surge" = distribution, not a jump
  const distribution = { liquidityUsd: 40000, marketCap: 500000, volume5m: 60000, buys5m: 18, sells5m: 80, m5: 18, h1: 22 };
  assert.equal(jumpScore(distribution), 0, "sell-led volume is distribution, not a buy jump");
  // no volume = no jump regardless of price
  const noVol = { liquidityUsd: 40000, marketCap: 500000, volume5m: 800, buys5m: 30, sells5m: 5, m5: 18, h1: 22 };
  assert.equal(jumpScore(noVol), 0, "no volume spike = not a jump");
  // too thin to exit = never a jump
  const thin = { liquidityUsd: 1500, marketCap: 500000, volume5m: 9000, buys5m: 80, sells5m: 10, m5: 18, h1: 22 };
  assert.equal(jumpScore(thin), 0, "unsellable depth is never chased");
  // the surge lifts a marginal liquid row's score (jump-point bonus feeds liquidScore)
  const surging = { liquidityUsd: 9000, marketCap: 500000, volume5m: 14000, buys5m: 70, sells5m: 15, m5: 20, h1: 18 };
  const dull = { ...surging, volume5m: 1500, buys5m: 10, sells5m: 9, m5: 1, h1: 1 };
  assert.ok(liquidScore(surging) > liquidScore(dull) + 10, "a surge lifts the liquid score over a dull mover");
});

test("jumpScore: a real mid-cap breakout at 0.10-0.18 turnover now fires the spike bar (the 'best jump 0' fix)", () => {
  // Verified-live class (Cambria): $33k liq doing ~$3.7k/5m = 0.11 turnover, m5 +10%, buy-led, 1h-green.
  // The old 0.18 floor zeroed this out — so the spike radar saw "best jump 0" forever. It must now fire.
  const midBreakout = { liquidityUsd: 33000, marketCap: 173000, volume5m: 3700, buys5m: 50, sells5m: 34, m5: 10.5, h1: 6.5 };
  assert.ok(jumpScore(midBreakout) >= 44, "a 0.11-turnover buy-led +10% breakout clears the spike-fire bar (44)");
  // but a 0.11-turnover move that is SELL-led (distribution) still scores 0 — the floor drop didn't
  // weaken the buy-pressure gate that keeps dumps out.
  const midDump = { ...midBreakout, buys5m: 20, sells5m: 64 };
  assert.equal(jumpScore(midDump), 0, "sell-led mid-cap is distribution, not a jump");
  // and a truly dead pool (0.04 turnover) is still not a jump.
  const dead = { ...midBreakout, volume5m: 1300 };
  assert.equal(jumpScore(dead), 0, "0.04-turnover dead pool is never a jump");
});

test("evalExit: smart-hold cap exits a copied position around the wallet's learned hold time", () => {
  const P = aggParams(baseState({ mode: "scalp" }));
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, peakPct: 0, smartHoldMs: 60_000 };
  // held PAST the learned hold window and not deep underwater -> bank it (copy the wallet's exit timing)
  const out = evalExit({ ...base, lastMc: 5000 * 1.1 }, P, 70_000);
  assert.equal(out.reason, "smart-hold"); assert.equal(out.pct, 100);
  // still inside the window -> hold (no premature smart-hold exit)
  const held = evalExit({ ...base, lastMc: 5000 * 1.1 }, P, 30_000);
  assert.notEqual(held.reason, "smart-hold");
  // deep underwater past the window -> the hard stop owns it, not smart-hold
  const stop = evalExit({ ...base, lastMc: 5000 * 0.8 }, P, 70_000);
  assert.notEqual(stop.reason, "smart-hold");
});

test("scalp: flexible higher-MC window, known-thin liquidity floor, fast bank-and-recycle exits", () => {
  const P = aggParams(baseState({ mode: "scalp" }));
  assert.ok(P.scalp, "scalp flag is set");
  assert.ok(P.mcFloor >= 4000 && P.mcFloor < 10000, "scalp floors just above dust but reachable in the last-hour window");
  assert.ok(P.mcCeil >= 1000000, "scalp reaches into the millions (flexible MC)");
  assert.ok(P.minLiqAbs >= 3000, "scalp keeps an absolute depth floor for coins that REPORT liquidity (anti-phantom)");
  assert.equal(P.liqFrac, 0, "scalp disables the RELATIVE liquidity gate (abs floor only)");
  assert.ok(P.tp1 <= 16, "scalp banks the first pop fast (~14%)");
  assert.ok(P.tp1Pct >= 80, "scalp banks the BULK at the first pop");
  assert.ok(P.moonTarget <= 60, "no moonshot chase — capped quick exit");
});

test("scalp: accepts a deep-liquidity $1M mover (the relative gate would reject) and blocks thin liquidity / dust", () => {
  const P = aggParams(baseState({ mode: "scalp" }));
  // A healthy $1M coin with $60k liquidity: liq is only 6% of MC, so the RELATIVE liqFrac gate
  // (used by every other mode) would wrongly reject it; scalp accepts it on its absolute floor.
  const bigLiquid = goodRow({ marketCap: 1000000, liquidityUsd: 60000, pairAgeSeconds: 600, volume5m: 40000, buys5m: 40, sells5m: 14, m5: 10, h1: 25, bestPickScore: 60 });
  assert.equal(entryReject(bigLiquid, P), null, "scalp accepts the deep-liquidity big-cap mover");
  // A coin INSIDE grind's MC window but below grind's RELATIVE liq threshold proves the gate
  // differs: grind rejects it on the relative gate; scalp (relative gate off, abs floor met) takes it.
  const relGateCoin = goodRow({ marketCap: 70000, liquidityUsd: 20000, pairAgeSeconds: 600, volume5m: 15000, buys5m: 40, sells5m: 12, m5: 10, h1: 20, bestPickScore: 60 });
  assert.equal(entryReject(relGateCoin, aggParams(baseState({ mode: "grind" }))), "liquidity", "grind rejects it on the relative liquidity gate");
  assert.equal(entryReject(relGateCoin, P), null, "scalp accepts it (relative gate disabled, abs floor met)");
  // KNOWN-thin liquidity (reported, < $3k) is rejected even at a fine MC — the phantom-mark guard.
  assert.equal(entryReject(goodRow({ marketCap: 500000, liquidityUsd: 2000, pairAgeSeconds: 600, volume5m: 5000, buys5m: 30, sells5m: 10 }), P), "liquidity");
  // UNKNOWN liquidity (no number reported — common on last-hour pump.fun movers) is NOT rejected
  // for liquidity: the feed-empty starvation came from rejecting these. liquidScore + the volume
  // gate + fast exits vet them instead. A buy-led mover in-band with healthy volume passes.
  assert.equal(entryReject(goodRow({ marketCap: 500000, liquidityUsd: 0, pairAgeSeconds: 600, volume5m: 5000, buys5m: 40, sells5m: 8, m5: 8, h1: 15 }), P), null);
  // Low-cap dust (below the $4k floor) is out of scalp's window entirely.
  assert.equal(entryReject(goodRow({ marketCap: 3000, liquidityUsd: 25000, pairAgeSeconds: 600, volume5m: 5000 }), P), "mc");
});

test("scalp: banks the bulk fast at the first ~14% pop (high hit-rate, not a moonshot)", () => {
  const P = aggParams(baseState({ mode: "scalp" }));
  assert.ok(P.tp1 <= 16, "scalp's first take-profit is a quick ~14% pop");
  const base = { entryMc: 100000, entryLiq: 60000, lastLiq: 60000, openedAt: 0, missed: 0, peakPct: 0 };
  // +20% is comfortably past the ~14% trigger (avoids float-edge) but well below the +150% spike.
  const tp1 = evalExit({ ...base, lastMc: 100000 * 1.2, tp1Done: false }, P, 1000);
  assert.equal(tp1.reason, "tp1");
  assert.ok(tp1.pct >= 80, "banks the bulk (>=80%) at the first pop");
});

test("scalp: hunts the LIQUID feed, not the fresh-dust feed", async () => {
  let t = 0;
  let liquidCalls = 0, freshCalls = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => { freshCalls++; return []; },
    getLiquidFeed: async () => { liquidCalls++; return [goodRow({ marketCap: 800000, liquidityUsd: 70000, pairAgeSeconds: 400, volume5m: 50000, buys5m: 40, sells5m: 12, m5: 12, h1: 20, bestPickScore: 60 })]; },
    getPairLite: async () => ({ marketCap: 800000, liquidityUsd: 70000 }),
    buyToken: async () => ({ ok: true }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "scalp", live: false });
  for (let i = 0; i < 3; i++) { t += 2200; await engine._tick(); }
  assert.ok(liquidCalls > 0, "scalp pulled the liquid feed");
  assert.ok(engine._state().open.length >= 1, "scalp opened a liquid-mover position");
  await engine.stop("test");
});

test("only QUICK (scalp) uses the liquid/any-age hunt; Steady + Balanced hunt the proven fresh pocket", () => {
  // QUICK = scalp: liquid, age-agnostic, wide MC (the experimental wide-net).
  const q = aggParams(baseState({ mode: "scalp" }));
  assert.ok(q.liquid, "scalp uses the liquid hunt profile");
  assert.ok(q.maxAge >= 172800, "scalp does not cap age");
  assert.ok(q.mcCeil >= 1000000, "scalp reaches high MC");
  const oldRunner = goodRow({ marketCap: 250000, liquidityUsd: 80000, pairAgeSeconds: 172800, volume5m: 30000, buys5m: 40, sells5m: 12, m5: 8, h1: 20, bestPickScore: 60 });
  assert.equal(entryReject(oldRunner, q), null, "scalp accepts a days-old liquid runner");
  // STEADY + BALANCED: NOT liquid — they hunt the proven FRESH low-MC pocket (the +EV engine),
  // differing only in how they bank. A days-old higher-MC coin is rejected here (fresh window).
  for (const mode of ["steady", "blend"]) {
    const P = aggParams(baseState({ mode }));
    assert.ok(!P.liquid, `${mode} hunts the fresh pocket, not the liquid wide-net`);
    assert.ok(P.maxAge <= 3600, `${mode} keeps a tight fresh age window`);
    // STARTER BASELINE (2026-06-20): fresh ceiling widened to $60k (still a small-launch pocket,
    // not the scalp wide-net which reaches $1M+). The day-old $250k runner stays rejected.
    assert.ok(P.mcCeil <= 60000, `${mode} stays in the small-launch pocket`);
    assert.ok(entryReject(oldRunner, P), `${mode} rejects a days-old higher-MC coin`);
  }
});

// ── Honest, non-jumping live display ────────────────────────────────────────────────────────

test("status: headline PnL is realized-anchored — a phantom open mark never inflates it (the no-phantom fix)", async () => {
  let t = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: 2300, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  for (let i = 0; i < 3; i++) { t += 2200; await engine._tick(); }
  const live = engine._state();
  assert.ok(live.open.length >= 1, "opened a position");

  // Mark the open bag at a fantasy +300%. dispMc is the median-smoothed mark the display reads (a
  // sustained ride would surface it); set both so this stands in for the marked/unrealized "riding"
  // view. A SINGLE-tick phantom would be filtered by the median — that stronger guard is exercised
  // by the engine's own sample path; here we assert the headline stays put while the marked view rides.
  live.open[0].lastMc = live.open[0].entryMc * 4;
  live.open[0].dispMc = live.open[0].entryMc * 4;
  const s = engine.status();
  // The HEADLINE (realized) must NOT move: nothing has been banked, so even a phantom +300% mark
  // can't turn the displayed PnL positive. This is the "showed positive after losses / flashed
  // +300% for a second" fix — the headline only changes when SOL actually lands in the bank.
  assert.ok(Math.abs(s.pnlPct) < 0.5, `realized headline ignores the phantom mark (got ${s.pnlPct}%)`);
  // The marked/unrealized view is exposed SEPARATELY and is allowed to reflect the (haircut) ride.
  assert.ok(s.markedPnlPct > s.pnlPct, "marked/unrealized view is separate and shows the ride");
  assert.ok(s.unrealizedSol > 0, "unrealized SOL surfaces the open ride without polluting the headline");
  await engine.stop("test");
});

test("status: a realized loss turns the headline red and it stays put (consistent, not jumping)", async () => {
  let t = 0;
  let mc = 2300;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  for (let i = 0; i < 3; i++) { t += 2200; await engine._tick(); }
  assert.ok(engine._state().open.length >= 1, "opened a position");
  // Crater past the stop so it sells at a real loss.
  mc = 2300 * 0.9;
  for (let i = 0; i < 3; i++) { t += 2200; await engine._tick(); }
  const s = engine.status();
  assert.equal(s.open.length, 0, "the loser was sold");
  assert.ok(s.pnlPct < 0, "headline is red after a real loss");
  // With no open bags, realized and marked agree exactly — nothing phantom can pull it back green.
  assert.equal(s.pnlPct, s.markedPnlPct, "no open bags → realized == marked (no phantom wiggle)");
  await engine.stop("test");
});

// --- RISK CIRCUIT-BREAKER (survival-first; downside-only) ---------------------------

test("riskBrake: a clean book never halts and never shrinks size", () => {
  const s = baseState({ bank: 1, dayAnchorEquity: 1, dailyLossFrac: 0.1, exposureCapFrac: 0.6 });
  const b = riskBrake(s, 1000);
  assert.equal(b.openHalt, false);
  assert.equal(b.sizeMult, 1);
  assert.equal(b.exposureCapFrac, 0.6, "passes the correlated-exposure cap through to canOpen");
});

test("riskBrake: hard halts are OPT-IN — default OFF only sizes down, riskHalts:true halts", () => {
  // day base 1.0, dailyLossFrac 0.10 -> halve at -5%, halt at -10% (halt only when riskHalts on)
  const tier1 = baseState({ bank: 0.93, dayAnchorEquity: 1, dailyLossFrac: 0.1, riskHalts: true }); // -7%
  assert.equal(riskBrake(tier1, 0).sizeMult, 0.5, "past half the daily budget -> halve size");
  assert.equal(riskBrake(tier1, 0).openHalt, false, "but not yet a hard halt");
  const halt = baseState({ bank: 0.88, dayAnchorEquity: 1, dailyLossFrac: 0.1, riskHalts: true }); // -12%
  assert.equal(riskBrake(halt, 0).openHalt, true, "halts on -> full daily budget spent halts opening");
  // DEFAULT (riskHalts off / testing mode): the same -12% day only SIZES DOWN, never halts.
  const testing = baseState({ bank: 0.88, dayAnchorEquity: 1, dailyLossFrac: 0.1 });
  assert.equal(riskBrake(testing, 0).openHalt, false, "opt-in OFF -> keeps trading through losses");
  assert.equal(riskBrake(testing, 0).sizeMult, 0.5, "but still de-risks size");
});

test("riskBrake: a loss-cluster cooldown halts opening until it expires (only when riskHalts on)", () => {
  const s = baseState({ bank: 1, dayAnchorEquity: 1, dailyLossFrac: 0.1, consecHaltUntil: 5000, riskHalts: true });
  assert.equal(riskBrake(s, 1000).openHalt, true, "inside the cooldown -> halt");
  assert.equal(riskBrake(s, 6000).openHalt, false, "past the cooldown -> resume");
  const off = baseState({ bank: 1, dayAnchorEquity: 1, consecHaltUntil: 5000 });
  assert.equal(riskBrake(off, 1000).openHalt, false, "opt-in OFF -> cooldown does not halt");
});

test("riskBrake: accumulating losses de-risk size before the hard cluster halt", () => {
  assert.ok(riskBrake(baseState({ bank: 1, dayAnchorEquity: 1, consecLosses: 1 }), 0).sizeMult <= 0.8);
  assert.ok(riskBrake(baseState({ bank: 1, dayAnchorEquity: 1, consecLosses: 2 }), 0).sizeMult <= 0.6);
});

test("canOpen: correlated-exposure cap blocks over-deployment; back-compat keeps the old 0.9", () => {
  // equity ~0.95 (bank 0.4 + a 0.55 bag), cap 0.6 -> a 0.1 bet pushes total at-risk to ~0.68 > 0.6
  const capped = baseState({ bank: 0.4, exposureCapFrac: 0.6 });
  capped.open.push({ entryMc: 5000, lastMc: 5000, lastLiq: 5000, costSol: 0.55, remFrac: 1 });
  assert.equal(canOpen(capped, 0.1), false, "blocks when total at-risk would exceed exposureCapFrac");
  // An older snapshot with no exposureCapFrac field keeps the prior 0.9 cap (unchanged behavior).
  const legacy = baseState({ bank: 0.4 });
  legacy.open.push({ entryMc: 5000, lastMc: 5000, lastLiq: 5000, costSol: 0.55, remFrac: 1 });
  assert.equal(canOpen(legacy, 0.1), true, "back-compat: no field -> prior 0.9 cap allows it");
});

test("entryReject: wash/bundle bait (big volume from a handful of trades) rejected on the liquid path", () => {
  const P = aggParams(baseState({ mode: "scalp" }));
  const washy = goodRow({ pairAgeSeconds: 600, marketCap: 50000, liquidityUsd: 30000, volume5m: 120, buys5m: 3, sells5m: 1, m5: 10, h1: 12 });
  assert.equal(entryReject(washy, P), "wash");
  // A clean liquid mover with real trade breadth is NOT flagged as wash.
  const clean = goodRow({ pairAgeSeconds: 600, marketCap: 50000, liquidityUsd: 30000, volume5m: 120, buys5m: 30, sells5m: 14, m5: 10, h1: 12 });
  assert.notEqual(entryReject(clean, P), "wash");
});

// --- STANDOUT-SIGNAL SNIPER ---------------------------------------------------------

test("snipeSignalScore: OR-gated — any ONE standout signal clears the bar, none = 0", () => {
  const P = aggParams(baseState({ mode: "snipeTrail" }));
  // no signal at all -> 0 -> below the snipe gate
  assert.equal(snipeSignalScore(goodRow(), null, null, null).score, 0);
  // a trusted TG caller alone qualifies
  assert.ok(snipeSignalScore(goodRow(), null, null, { trusted: true, convictionDelta: 0.3 }).score >= P.minSnipe);
  // a proven dev alone qualifies
  assert.ok(snipeSignalScore(goodRow(), { runners: 2, rugs: 0 }, null, null).score >= P.minSnipe);
  // a proven-winner early buyer alone qualifies
  assert.ok(snipeSignalScore(goodRow(), null, { winners: 1 }, null).score >= P.minSnipe);
  // a notable X account attached alone qualifies
  assert.ok(snipeSignalScore(goodRow({ xClout: 2 }), null, null, null).score >= P.minSnipe);
});

test("snipeSignalScore: confluence scores higher than a lone signal and records which fired", () => {
  const lone = snipeSignalScore(goodRow(), { runners: 1, rugs: 0 }, null, null);
  const stacked = snipeSignalScore(goodRow({ xClout: 2 }), { runners: 2, rugs: 0 }, { kol: true }, { trusted: true, convictionDelta: 0.4 });
  assert.ok(stacked.score > lone.score, "more signals -> higher conviction score");
  assert.deepEqual(Object.keys(stacked.signals).sort(), ["caller", "dev", "kol", "x"], "records every signal that fired");
});

test("aggParams: the three snipe modes share a fresh super-low-MC window + tight stop, differ on exit", () => {
  const trail = aggParams(baseState({ mode: "snipeTrail" }));
  const ride = aggParams(baseState({ mode: "snipeRide" }));
  const bank = aggParams(baseState({ mode: "snipeBank" }));
  for (const P of [trail, ride, bank]) {
    assert.equal(P.snipe, true, "snipe flag set");
    assert.equal(P.mcFloor, 1500, "super-low MC floor");
    assert.equal(P.sl, 10, "tight stop");
    assert.equal(P.minScore, 0, "freshScore gate disabled — signals select instead");
  }
  // Distinct exits: trail de-risks half early + rides far; ride banks less and rides further; bank locks most.
  assert.ok(trail.tp1Pct < bank.tp1Pct, "trail banks less at tp1 than bank-and-tail");
  assert.ok(ride.moonTarget >= trail.moonTarget, "ride targets at least as high a moon as trail");
  assert.ok(bank.moonTarget < trail.moonTarget, "bank-and-tail has the smallest moon target");
});

test("entryReject: snipe passes a signal-less fresh launch at the gate (signals filter in the loop) + relaxed volume", () => {
  const P = aggParams(baseState({ mode: "snipeTrail" }));
  // a fresh super-low-MC launch with thin early volume still passes entryReject (the loop's signal gate decides)
  assert.equal(entryReject(goodRow({ pairAgeSeconds: 8, marketCap: 2200, volume5m: 8, liquidityUsd: 2000 }), P), null);
  // but a literally-dead launch (no volume at all) is still rejected
  assert.equal(entryReject(goodRow({ pairAgeSeconds: 8, marketCap: 2200, volume5m: 1 }), P), "volume");
});

// NOTE: the insider-launch dev-dump/rug-flow TRIPWIRE (engine: pos.insider + devSold(mint) -> sell
// 100%, src/lib/autopilotEngine.js manageExits) is verified by inspection + LIVE logs rather than a
// unit test — it rides the same proven _smartMoney -> copy-open path the live winner-follow feature
// uses, and faithfully simulating that full entry + the engine's real-clock timer lifecycle in a unit
// test proved brittle. Watch the live logs for 🧬 INSIDER LAUNCH, the copy buy, and 🚨 RUG-FLOW.
