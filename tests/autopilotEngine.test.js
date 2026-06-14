import { test } from "node:test";
import assert from "node:assert/strict";
import {
  aggParams,
  sizeFor,
  freshScore,
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

test("aggParams: hot regime sizes up and loosens cutoff", () => {
  const s = baseState({ results: ["W", "W", "W", "W", "W"], streak: 3 });
  const P = aggParams(s);
  assert.equal(P.regime, "HOT");
  assert.ok(P.regimeMult > 1);
  assert.ok(P.minScore < 40);
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

test("freshScore: younger + buy-led scores higher than old + sell-led", () => {
  const young = freshScore(goodRow({ pairAgeSeconds: 20, buys5m: 30, sells5m: 4 }));
  const old = freshScore(goodRow({ pairAgeSeconds: 900, buys5m: 5, sells5m: 12 }));
  assert.ok(young > old);
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
  assert.equal(tp1.reason, "tp1"); assert.equal(tp1.pct, 40);
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
