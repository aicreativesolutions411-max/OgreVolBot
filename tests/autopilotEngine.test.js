import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggParams,
  sizeFor,
  freshScore,
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

test("engine: loss cap flattens and stops", async () => {
  let t = 0;
  let mc = 5000;
  // Many fresh rows so it deploys most of the bankroll across several positions;
  // tanking them all then drops realized equity below the 70% cap.
  const rows = Array.from({ length: 8 }, (_, i) => goodRow({ tokenMint: `Mint${i}`, symbol: `C${i}` }));
  const engine = createAutopilotEngine({
    getFreshFeed: async () => rows,
    getPairLite: async () => ({ marketCap: mc, liquidityUsd: 6000 }),
    buyToken: async () => ({ ok: true, tokenAmount: "1" }),
    sellPercent: async () => ({ ok: true }),
    now: () => t,
    persist: async () => {}
  });
  await engine.start({ solBudget: 1, minutes: 60, mode: "degen", live: false });
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
