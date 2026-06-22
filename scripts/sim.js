#!/usr/bin/env node
// ============================================================================
// HONEST AUTOPILOT SIMULATOR — the truth-teller the bot never had.
//
// The old backtest (scripts/backtest-copy.js) lied in three ways the research surfaced:
//   1. it entered at the IDEAL price (no latency penalty — but we're 30-120s late),
//   2. it modeled ZERO fees/slippage/Jito-tips (which dominate small bets),
//   3. it EXCLUDED rugs/no-data instead of counting them as the losses they are.
// So it printed +6.8% while the live wallet bled. This script fixes all three and
// runs OUR REAL exit ladder (evalExit from the engine) over REAL price paths
// (GeckoTerminal free 1-min OHLCV — no API key), so we can tune against reality
// for free, before risking SOL — and SEE how much our latency disadvantage costs.
//
// USAGE:
//   node scripts/sim.js --fetch            # build/refresh the real dataset (cached, gitignored)
//   node scripts/sim.js                    # run the sim over the cache + print the scorecard
//   node scripts/sim.js --bet=0.03 --tip=0.001   # override cost assumptions
// ============================================================================
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { aggParams, evalExit } from "../src/lib/autopilotEngine.js";

const GT = "https://api.geckoterminal.com/api/v2/networks/solana";
const PF_LIST = "https://frontend-api-v3.pump.fun/coins";
const PF_CANDLES = "https://swap-api.pump.fun/v1/coins";   // /{mint}/candles?interval=1m&limit=N — works for DEAD coins too
const UA = { "User-Agent": "Mozilla/5.0", Accept: "application/json" };
const DATASET = path.resolve(process.cwd(), "data/sim-dataset.json");
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true]; }));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- cost + execution assumptions (the things the old backtest ignored) --------------------
const BET_SOL = Number(args.bet) || 0.03;        // per-trade size (small bets => fees bite hard)
const TIP_SOL = Number(args.tip) || 0.001;       // Jito tip per side
const GAS_SOL = Number(args.gas) || 0.0006;      // priority + base fee per side
const ROUND_TRIP_FIXED = 2 * (TIP_SOL + GAS_SOL);// tips+gas both sides, in SOL
const FIXED_DRAG = ROUND_TRIP_FIXED / BET_SOL;   // as a fraction of the bet (e.g. ~0.11 on 0.03 SOL)
// Slippage scales with thinness: a $4k pool fills far worse than a $80k one. Per side.
function slipFrac(liqUsd) {
  const l = Number(liqUsd) || 0;
  if (l >= 80000) return 0.015; if (l >= 40000) return 0.025; if (l >= 15000) return 0.04;
  if (l >= 6000) return 0.06; return 0.09;
}

// ============================================================================
// FETCH — build a REAL, survivorship-HONEST dataset: sample NEW pools (the full
// population the bot fishes in — mostly failures) + trending (the movers), and pull
// each one's 1-min OHLCV from launch forward. Cached so re-runs are free + offline.
// ============================================================================
async function gt(p, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(`${GT}${p}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8000) });
      if (res.status === 429) { await sleep(2000 * (i + 1)); continue; }   // brief backoff, don't grind
      if (!res.ok) return null;
      return await res.json();
    } catch { await sleep(400 * (i + 1)); }   // timeout/network → short retry, never hang
  }
  return null;
}
async function pf(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(9000) });
      if (res.status === 429) { await sleep(1500 * (i + 1)); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { await sleep(400 * (i + 1)); }
  }
  return null;
}
// The UNBIASED population: pump.fun lists every launch by creation time (incl. the ~90% that die).
// We sample coins old enough (created `minAgeH`..`maxAgeH` ago) that their full life has played out.
async function pumpCoinList({ minAgeH = 3, maxAgeH = 30, want = 120 }) {
  const now = Date.now(); const out = []; const seen = new Set();
  for (let offset = 0; offset <= 8000 && out.length < want; offset += 50) {
    const arr = await pf(`${PF_LIST}?offset=${offset}&limit=50&sort=created_timestamp&order=DESC&includeNsfw=true`);
    const coins = Array.isArray(arr) ? arr : (arr && arr.coins) || [];
    if (!coins.length) break;
    for (const c of coins) {
      const created = Number(c.created_timestamp) || 0; const ageH = (now - created) / 3600_000;
      if (ageH < minAgeH) continue;                 // too young — life not played out yet
      if (ageH > maxAgeH) return out;               // walked past the window (list is DESC) — stop
      const mint = c.mint || c.coin_mint; if (!mint || seen.has(mint)) continue; seen.add(mint);
      out.push({ pool: mint, mint, name: c.symbol || c.name || "", createdAt: created,
        fdv: Number(c.usd_market_cap) || 0, liqUsd: Math.max(2000, (Number(c.usd_market_cap) || 0) * 0.12) });
    }
    process.stderr.write(`[sim]   listing… offset=${offset} kept=${out.length}\n`);
    await sleep(900);
  }
  return out;
}
async function fetchDataset() {
  const want = Number(args.want) || 140, minAgeH = Number(args.minAge) || 3, maxAgeH = Number(args.maxAge) || 30;
  process.stderr.write(`[sim] sampling pump.fun FULL population (created ${minAgeH}-${maxAgeH}h ago, want ${want})…\n`);
  const pools = await pumpCoinList({ minAgeH, maxAgeH, want });
  process.stderr.write(`[sim] ${pools.length} real coins; pulling pump.fun 1-min candles (checkpointing each)…\n`);
  await mkdir(path.dirname(DATASET), { recursive: true });
  const tokens = [];
  for (let i = 0; i < pools.length; i++) {
    const p = pools[i];
    const arr = await pf(`${PF_CANDLES}/${p.mint}/candles?interval=1m&limit=240`);
    const raw = Array.isArray(arr) ? arr : (arr && arr.candles) || [];
    const candles = raw.map((c) => ({ t: Math.floor((Number(c.timestamp) || 0) / 1000), o: +c.open, h: +c.high, l: +c.low, c: +c.close, v: +c.volume }))
      .filter((c) => c.o > 0 && c.h > 0 && c.l > 0 && c.c > 0).sort((a, b) => a.t - b.t);   // oldest-first
    // Keep coins with enough life to detect a pop + its aftermath. The pop-then-dump LOSERS have plenty
    // of candles (the dump takes minutes); never-traded dust gets few candles + no pop → excluded (the
    // bot wouldn't buy it). This is the honest population: winners AND the dumps that hid in DEX data.
    if (candles.length >= 8) tokens.push({ ...p, candles });   // include fast-deaths (≥8 = a detectable pop + its aftermath)
    await writeFile(DATASET, JSON.stringify({ ranAtMs: Date.now(), partial: i < pools.length - 1, tokens }, null, 0));
    if ((i + 1) % 10 === 0 || i === pools.length - 1) process.stderr.write(`[sim]   ${i + 1}/${pools.length}  kept=${tokens.length}\n`);
    await sleep(900);
  }
  await writeFile(DATASET, JSON.stringify({ ranAtMs: Date.now(), partial: false, tokens }, null, 0));
  process.stderr.write(`[sim] cached ${tokens.length} tokens → ${DATASET}\n`);
  return tokens;
}

// ============================================================================
// ENTRY SIGNAL — approximate the bot's actual trigger from OHLCV: a "pop" = a 5-min
// price breakout (close up vs 5 candles ago) on a volume surge (this minute's volume
// well above the recent median). Mirrors jumpScore's m5-breakout + turnover gate.
// Returns the candle index where the bot WOULD first see the pop (before our latency).
// ============================================================================
function findSignal(candles) {
  const med = (arr) => { const s = [...arr].sort((a, b) => a - b); return s[Math.floor(s.length / 2)] || 0; };
  // Start EARLY (i>=3) with an adaptive lookback so a launch-pump-then-die coin ALSO trips the signal
  // (and becomes the loss it really is) — not just the sustained pops, which would bias to survivors.
  for (let i = 3; i < candles.length - 2; i++) {
    const back = Math.min(5, i);
    const mvt = candles[i].c / candles[i - back].c - 1;            // price change over the lookback
    const vMed = med(candles.slice(Math.max(0, i - 10), i).map((c) => c.v)) || 1;
    const surge = candles[i].v / Math.max(1e-9, vMed);            // volume vs recent median
    // breakout on a volume surge — the "pop" the bot detects (it can't catch the literal first tick).
    if (mvt >= 0.05 && mvt <= 0.80 && surge >= 1.8) return i;
  }
  return -1;
}

// ============================================================================
// SIM ONE TRADE — enter LATE (latencyMin candles after the signal, at the worse
// price + slippage), then walk OUR REAL evalExit ladder forward, realizing each
// sell at that candle's price minus slippage, and subtracting the fixed tip+gas
// drag. Returns the NET realized multiple of the bet (1.0 = breakeven after costs).
// ============================================================================
function reasonToFlags(pos, reason) {  // mirror the host's doSell tp-done mapping
  if (reason === "tp1" || reason === "copy-tp1") pos.tp1Done = true;
  else if (reason === "tp2") pos.tp2Done = true;
  else if (reason === "tp3") pos.tp3Done = true;
  else if (reason === "spike" || reason === "bank-early") { pos.tp1Done = true; pos.tp2Done = true; }
}
function simTrade(token, P, latencyMin) {
  const C = token.candles;
  const sig = findSignal(C);
  if (sig < 0) return null;                                        // never popped in our view → not a candidate
  const entryIdx = sig + Math.max(0, latencyMin);                 // WE ARE LATE: enter latencyMin minutes after the pop
  if (entryIdx >= C.length - 1) return { net: 1 - FIXED_DRAG, outcome: "too-late-no-fill", costsOnly: true };
  const slip = slipFrac(token.liqUsd);
  const entryPx = C[entryIdx].o * (1 + slip);                     // pay UP on entry (late + slippage)
  const fwd = C.slice(entryIdx);
  const entryMc = (Number(token.fdv) || 20000) * (C[entryIdx].o / C[sig].o); // mc scaled to where we actually buy
  const pos = {
    entryMc, lastMc: entryMc, entryLiq: token.liqUsd || 6000, lastLiq: token.liqUsd || 6000,
    openedAt: 0, missed: 0, peakPct: 0, tp1Done: false, tp2Done: false, tp3Done: false,
    costSol: BET_SOL, remFrac: 1, bankEarly: P.__bankEarly || false
  };
  let realizedMult = 0;                                            // sum of (fraction sold × gross multiple at that price)
  for (let k = 1; k < fwd.length; k++) {
    const px = fwd[k].c;
    pos.lastMc = entryMc * (px / entryPx);
    const move = (px / entryPx - 1) * 100;
    pos.peakPct = Math.max(pos.peakPct || 0, move);
    const e = evalExit(pos, P, k * 60_000);
    if (e && e.action === "sell") {
      const frac = (e.pct >= 100 ? 1 : e.pct / 100) * pos.remFrac;
      const fill = (px * (1 - slip)) / entryPx;                   // pay DOWN on exit (slippage)
      realizedMult += frac * fill;
      pos.remFrac -= frac;
      reasonToFlags(pos, e.reason);
      if (pos.remFrac <= 1e-6) { return finish(realizedMult, e.reason); }
    }
  }
  // ran out of candles holding a remainder — mark it out at the last close (path may be dead = ~0)
  const last = fwd[fwd.length - 1].c;
  realizedMult += pos.remFrac * ((last * (1 - slip)) / entryPx);
  return finish(realizedMult, "ride-end");
  function finish(grossMult, outcome) {
    const net = grossMult - FIXED_DRAG;                            // subtract the tip+gas drag (fraction of bet)
    return { net, outcome, grossMult, entryMc, liqUsd: token.liqUsd };
  }
}

// ============================================================================
// RUN — sweep latency 0/30/60/120s so we SEE how the edge collapses with our delay,
// and report net PnL, win rate, reward:risk, rug share. Uses the REAL apex params.
// ============================================================================
function summarize(results) {
  const r = results.filter(Boolean);
  if (!r.length) return null;
  const nets = r.map((x) => x.net);
  const wins = nets.filter((x) => x > 0.04);                      // a real (fee-clearing) win
  const losses = nets.filter((x) => x < -0.04);
  const rugs = nets.filter((x) => x <= -0.85);                    // near-total loss
  const sum = nets.reduce((a, b) => a + b, 0);
  const avgWin = wins.length ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
  return {
    trades: r.length, winRate: Math.round((wins.length / r.length) * 100),
    netPerTradePct: Math.round((sum / r.length) * 1000) / 10,     // avg net % per trade after ALL costs
    totalNetSol: Math.round(sum * BET_SOL * 1000) / 1000,         // SOL P/L if each was one BET_SOL trade
    avgWinPct: Math.round(avgWin * 1000) / 10, avgLossPct: Math.round(avgLoss * 1000) / 10,
    rr: avgLoss ? Math.round((avgWin / Math.abs(avgLoss)) * 100) / 100 : 0,
    rugPct: Math.round((rugs.length / r.length) * 100), best: Math.round(Math.max(...nets) * 1000) / 10
  };
}
async function run() {
  let ds;
  try { ds = JSON.parse(await readFile(DATASET, "utf8")); }
  catch { console.error(`[sim] no dataset — run: node scripts/sim.js --fetch`); process.exit(1); }
  const tokens = ds.tokens || [];
  const P = { ...aggParams({ mode: "apex", results: [], wins: 0, losses: 0, scratches: 0, recentRugs: [], streak: 0, start: 1, bank: 1, maxOpen: 3, minTradeSol: 0.01, maxTradeSol: 0.1 }) };
  console.log(`[sim] ${tokens.length} real tokens · bet ${BET_SOL} SOL · fixed drag ${(FIXED_DRAG * 100).toFixed(1)}% (tips+gas) · slippage 1.5-9%/side\n`);
  const popped = tokens.filter((t) => findSignal(t.candles) >= 0).length;
  console.log(`[sim] ${popped}/${tokens.length} tokens produced a pop signal the bot would chase\n`);
  // (1) LATENCY SWEEP — 1-min candles, so latency is in CANDLE-MINUTES. Our real lateness is ~1-3 min
  //     (the DexScreener m5 window is itself a trailing 5-min average + cache + confirmed-buy latency).
  const fmt = (s) => `${String(s.trades).padStart(5)}  ${String(s.winRate).padStart(3)}%  ${String(s.netPerTradePct + "%").padStart(8)}   ${String(s.totalNetSol).padStart(8)}   ${String(s.avgWinPct + "%").padStart(6)}  ${String(s.avgLossPct + "%").padStart(7)}  ${String(s.rr).padStart(5)}  ${String(s.rugPct + "%").padStart(4)}   ${s.best}%`;
  console.log(`LATE BY   trades  win%   net/trade   total SOL   avgWin   avgLoss   R:R    rug%   bestTrade`);
  for (const latMin of [0, 1, 2, 3]) {
    const s = summarize(tokens.map((t) => simTrade(t, P, latMin)));
    if (!s) { console.log(`${latMin}min: no fills`); continue; }
    const tag = latMin === 0 ? "0(ideal)" : `${latMin}min`;
    console.log(`${tag.padEnd(8)} ${fmt(s)}`);
  }
  // (2) EXIT-LADDER COMPARISON at OUR real latency (2 min late): does banking early beat riding?
  console.log(`\nEXIT @2min late   trades  win%   net/trade   total SOL   avgWin   avgLoss   R:R    rug%   bestTrade`);
  const sFresh = summarize(tokens.map((t) => simTrade(t, { ...P, __bankEarly: false }, 2)));
  const sBank = summarize(tokens.map((t) => simTrade(t, { ...P, __bankEarly: true }, 2)));
  if (sFresh) console.log(`ride (fresh)      ${fmt(sFresh)}`);
  if (sBank) console.log(`bank-early        ${fmt(sBank)}`);
  console.log(`\n[sim] read: net/trade is AFTER tips+gas+slippage+rugs. "0(ideal)" is the fantasy the old`);
  console.log(`      backtest measured; "2min" is OUR reality (we're that late). If net/trade is negative at`);
  console.log(`      2min, the strategy LOSES no matter how the thresholds are tuned — the fix is SPEED, not knobs.`);
}

// ============================================================================
// SWEEP — run MANY simulations across a grid of exit knobs at OUR real latency and
// rank by net-per-trade-after-costs. This is the "tweak for best results" loop: it
// answers "is there ANY exit config that's net-positive once we pay latency+fees?"
// ============================================================================
async function sweep() {
  let ds; try { ds = JSON.parse(await readFile(DATASET, "utf8")); } catch { console.error(`[sim] no dataset — run --fetch`); process.exit(1); }
  const tokens = ds.tokens || [];
  const base = aggParams({ mode: "apex", results: [], wins: 0, losses: 0, scratches: 0, recentRugs: [], streak: 0, start: 1, bank: 1, maxOpen: 3, minTradeSol: 0.01, maxTradeSol: 0.1 });
  const LAT = Number(args.lat) || 2;   // candle-minutes late (our reality ~1-3)
  const popped = tokens.filter((t) => findSignal(t.candles) >= 0).length;
  const grid = [];
  for (const tp1 of [12, 18, 25, 40, 60]) for (const tp1Pct of [60, 80, 100]) for (const sl of [20, 30, 45, 65]) grid.push({ tp1, tp1Pct, sl });
  const rows = [];
  for (const g of grid) {
    const P = { ...base, tp1: g.tp1, tp1Pct: g.tp1Pct, sl: g.sl };
    const s = summarize(tokens.map((t) => simTrade(t, P, LAT)));
    if (s) rows.push({ ...g, net: s.netPerTradePct, win: s.winRate, trades: s.trades, rug: s.rugPct, totalSol: s.totalNetSol });
  }
  rows.sort((a, b) => b.net - a.net);
  console.log(`\n[sim] SWEEP · ${tokens.length} tokens · ${popped} produced a tradeable pop · ${LAT}min late · ${grid.length} exit configs`);
  console.log(`\nBEST configs (net-per-trade after tips+gas+slippage+rugs):`);
  console.log(`  tp1    bank%   stop    net/trade   win%   rug%   total SOL`);
  for (const r of rows.slice(0, 12)) console.log(`  +${String(r.tp1 + "%").padEnd(5)} ${String(r.tp1Pct + "%").padEnd(6)} -${String(r.sl + "%").padEnd(5)} ${String(r.net + "%").padStart(8)}   ${String(r.win).padStart(3)}%  ${String(r.rug + "%").padStart(4)}   ${r.totalSol}`);
  console.log(`\nWORST 3:`);
  for (const r of rows.slice(-3)) console.log(`  +${String(r.tp1 + "%").padEnd(5)} ${String(r.tp1Pct + "%").padEnd(6)} -${String(r.sl + "%").padEnd(5)} ${String(r.net + "%").padStart(8)}   ${String(r.win).padStart(3)}%`);
  const pos = rows.filter((r) => r.net > 0).length;
  console.log(`\n[sim] ${pos}/${grid.length} configs are NET-POSITIVE after costs at ${LAT}min latency.`);
  console.log(`      If 0 are positive, no exit tuning saves it — the loss is entry/timing, exactly as diagnosed.`);
}

if (args.fetch) { await fetchDataset(); }
else if (args.sweep) { await sweep(); }
else { await run(); }
