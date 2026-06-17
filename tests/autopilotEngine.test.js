import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggParams,
  sizeFor,
  freshScore,
  grindScore,
  liquidScore,
  convictionMult,
  autoTune,
  entryReject,
  evalExit,
  canOpen,
  equity,
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
    pairAgeSeconds: 60,
    marketCap: 5000,
    liquidityUsd: 6000,
    volume5m: 120,
    buys5m: 20,
    sells5m: 8,
    bestPickScore: 40,
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
  const rows = Array.from({ length: 8 }, (_, i) => goodRow({ tokenMint: `Z${i}`, symbol: `Z${i}`, bestPickScore: 100 }));
  const engine = createAutopilotEngine({
    getFreshFeed: async () => rows,
    getPairLite: async () => ({ marketCap: 5000, liquidityUsd: 6000 }),
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
  // Hot sizes up, but never apes below fs 58 (instant-rugs cluster <=56; no runner <58).
  assert.ok(P.minScore >= 58, "hot keeps the safe floor instead of dropping into garbage");
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

test("entryReject: passes a clean fresh mover", () => {
  const P = aggParams(baseState());
  assert.equal(entryReject(goodRow(), P), null);
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
  const row = goodRow({ marketCap: 2300, liquidityUsd: 2200, pairAgeSeconds: 30, volume5m: 90, buys5m: 1, sells5m: 0 });
  assert.equal(entryReject(row, P), null);
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

test("evalExit: steady mode banks 80% at the first pop and rides 20% to +400%", () => {
  const P = aggParams(baseState({ mode: "steady" }));
  const base = { entryMc: 5000, entryLiq: 6000, lastLiq: 6000, openedAt: 0, missed: 0, peakPct: 0 };
  // bank 80% at the first doable pop
  const tp1 = evalExit({ ...base, lastMc: 5000 * 1.3, tp1Done: false }, P, 1000);
  assert.equal(tp1.reason, "tp1"); assert.equal(tp1.pct, 80);
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

test("equity: cash plus marked-to-market open positions", () => {
  const s = baseState({ bank: 0.5 });
  s.open.push({ entryMc: 5000, lastMc: 10000, costSol: 0.5, remFrac: 1 });
  assert.equal(round(equity(s)), 1.5);
});

// ---- engine lifecycle (paper mode, mocked feed) ----

function round(n) {
  return Math.round(n * 1e6) / 1e6;
}

test("engine: paper session apes a good coin then takes profit", async () => {
  let t = 0;
  const clock = () => t;
  let mc = 5000;
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
  mc = 5000 * 6;
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

test("engine: live mode routes through buy/sell deps", async () => {
  let t = 0;
  let mc = 5000;
  let buys = 0;
  let sells = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 6000 }),
    buyToken: async () => {
      buys++;
      return { ok: true, tokenAmount: "1000" };
    },
    sellPercent: async () => {
      sells++;
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
  mc = 5000 * 1.7;
  t += 2200;
  await engine._tick();
  assert.ok(sells >= 1, "live mode calls sellPercent");
  await engine.stop("test-done");
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
    getPairLite: async () => ({ marketCap: 5000, liquidityUsd: 6000 }),
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
  let mc = 5000;
  // Many fresh rows so it deploys most of the bankroll across several positions;
  // tanking them all then drops realized equity below the 70% cap. Use ELITE-score rows
  // (very fresh + high provenance => fs >= 72) so they bypass momentum-confirmation and
  // deploy immediately — this test is about the loss-cap backstop, not entry selectivity.
  const rows = Array.from({ length: 8 }, (_, i) => goodRow({ tokenMint: `Mint${i}`, symbol: `C${i}`, pairAgeSeconds: 20, bestPickScore: 95 }));
  const engine = createAutopilotEngine({
    getFreshFeed: async () => rows,
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  // Tighter loss cap (10%) + explicit maxTradeSol so the backstop is exercised independently
  // of per-trade size tuning. The unproven-coin conviction cap (0.7x) keeps total deployment
  // conservative (~19% of bank across 5 positions), so a 20% cap would sit just out of reach;
  // 10% definitively breaches when every position is tanked. This test verifies the loss-cap
  // backstop FIRES, not the entry-sizing math.
  await engine.start({ solBudget: 1, minutes: 60, mode: "degen", live: false, maxTradeSol: 0.1, lossCapFrac: 0.1 });
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
  assert.ok(degen.minScore >= 58, "degen still respects the universal fs floor");
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
});

test("convictionMult: honors per-mode caps (degen unproven 0.6, chill proven 1.15)", () => {
  const row = { buys5m: 8, sells5m: 1, volume5m: 80, pairAgeSeconds: 40, marketCap: 9000 };
  const proven = { runners: 3, rugs: 0 };
  assert.ok(convictionMult(row, null, null, null, { unprovenCap: 0.6, provenCap: 1.6 }) <= 0.6 + 1e-9, "degen caps unproven at 0.6");
  assert.ok(convictionMult(row, proven, null, null, { unprovenCap: 0.6, provenCap: 1.6 }) > 0.6, "proven sizes above the unproven cap");
  assert.ok(convictionMult(row, proven, { kol: true, winners: 3 }, null, { unprovenCap: 0.7, provenCap: 1.15 }) <= 1.15 + 1e-9, "chill never oversizes past 1.15");
});

test("engine: per-mode session loss cap (degen 15%, chill 12%, normal 20%)", async () => {
  let t = 0;
  const mk = () => createAutopilotEngine({ getFreshFeed: async () => [], getPairLite: async () => null, buyToken: async () => ({ ok: true }), sellPercent: async () => ({ ok: true }), now: () => t, persist: async () => {} });
  for (const [mode, cap] of [["degen", 0.15], ["chill", 0.12], ["normal", 0.20]]) {
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

test("scalp: flexible higher-MC window, hard $20k liquidity floor, fast bank-and-recycle exits", () => {
  const P = aggParams(baseState({ mode: "scalp" }));
  assert.ok(P.scalp, "scalp flag is set");
  assert.ok(P.mcFloor >= 6000 && P.mcFloor < 15000, "scalp floors above the dust zone but reachable in the last-hour window");
  assert.ok(P.mcCeil >= 1000000, "scalp reaches into the millions (flexible MC)");
  assert.ok(P.minLiqAbs >= 3000, "scalp enforces a hard absolute liquidity floor (anti-phantom, but achievable)");
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
  // Thin liquidity (< $3k) is rejected even at a fine MC — this is the phantom-mark guard.
  assert.equal(entryReject(goodRow({ marketCap: 500000, liquidityUsd: 2000, pairAgeSeconds: 600, volume5m: 5000, buys5m: 30, sells5m: 10 }), P), "liquidity");
  // Low-cap dust is out of scalp's window entirely.
  assert.equal(entryReject(goodRow({ marketCap: 4000, liquidityUsd: 25000, pairAgeSeconds: 600, volume5m: 5000 }), P), "mc");
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

// ── Honest, non-jumping live display ────────────────────────────────────────────────────────

test("status: headline PnL is realized-anchored — a phantom open mark never inflates it (the no-phantom fix)", async () => {
  let t = 0;
  const engine = createAutopilotEngine({
    getFreshFeed: async () => [goodRow()],
    getPairLite: async () => ({ marketCap: 5000, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1000" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "normal", live: false });
  for (let i = 0; i < 3; i++) { t += 2200; await engine._tick(); }
  const live = engine._state();
  assert.ok(live.open.length >= 1, "opened a position");

  // PHANTOM-SPIKE the open bag's marked price to a fantasy +300% that can't actually fill.
  live.open[0].lastMc = live.open[0].entryMc * 4;
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
  let mc = 5000;
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
  mc = 5000 * 0.9;
  for (let i = 0; i < 3; i++) { t += 2200; await engine._tick(); }
  const s = engine.status();
  assert.equal(s.open.length, 0, "the loser was sold");
  assert.ok(s.pnlPct < 0, "headline is red after a real loss");
  // With no open bags, realized and marked agree exactly — nothing phantom can pull it back green.
  assert.equal(s.pnlPct, s.markedPnlPct, "no open bags → realized == marked (no phantom wiggle)");
  await engine.stop("test");
});
