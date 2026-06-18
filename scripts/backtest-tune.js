#!/usr/bin/env node
// ============================================================================
// ULTIMATE TUNE (offline) — sweep exit-ladder params AND rank wallets in ONE pass.
// For each proven wallet's historical buys, fetch the ST price path ONCE and simulate
// EVERY candidate exit ladder on it (so the param sweep is nearly free). Outputs:
//   1) the best exit ladder (stop / TP1 / TP1-fraction grid) by edge-per-trade, and
//   2) every wallet's copy-edge UNDER that best ladder (to keep the winners, cut dead weight).
// Off-box → zero instance risk. Compresses months of paper into minutes.
//
// USAGE: SOLANA_TRACKER_API_KEY=<key> node scripts/backtest-tune.js [--wallets=200] [--buys=25] [--windowH=8] [--grab=seed/brain-grab.json] [--out=seed/tune-results.json]
// ============================================================================
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const BASE = process.env.SOLANA_TRACKER_API_BASE || "https://data.solanatracker.io";
const KEY = process.env.SOLANA_TRACKER_API_KEY || "";
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true]; }));
const MAX_WALLETS = Math.max(1, Number(args.wallets) || 200);
const MAX_BUYS = Math.max(3, Number(args.buys) || 25);
const WINDOW_H = Math.max(1, Number(args.windowH) || 8);
const MIN_AGE_H = 2;
const GRAB = args.grab || "seed/brain-grab.json";
const OUT = args.out || "seed/tune-results.json";
const MIN_SIMS_LADDER = Number(args.minSims) || 300;   // a ladder needs this many sims to be trusted
if (!KEY) { console.error("ERROR: set SOLANA_TRACKER_API_KEY"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0;
async function stJson(p) {
  const url = `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
  for (let i = 0; i < 3; i++) {
    try { calls++; const res = await fetch(url, { headers: { Accept: "application/json", "x-api-key": KEY } });
      if (res.status === 429) { await sleep(1200 * (i + 1)); continue; }
      if (!res.ok) return null; return await res.json();
    } catch { if (i === 2) return null; await sleep(400 * (i + 1)); }
  }
  return null;
}

// Candidate ladder grid: stop %, TP1 %, fraction sold at TP1 (1.0 = bank all, no moon). Moon rides the
// rest with a 40% trailing give-back, capped 6x. ~27 configs — all CPU, candles fetched once.
const LADDERS = [];
for (const stopPct of [10, 15, 22]) for (const tp1Pct of [15, 25, 40]) for (const tp1Frac of [0.7, 0.88, 1.0]) {
  LADDERS.push({ key: `s${stopPct}_t${tp1Pct}_f${Math.round(tp1Frac * 100)}`, stopPct, tp1Pct, tp1Frac, trailPct: 40, moonCap: 6 });
}
function simLadder(candles, entry, P) {
  if (!Array.isArray(candles) || !candles.length || !(entry > 0)) return null;
  const stop = entry * (1 - P.stopPct / 100), tp1 = entry * (1 + P.tp1Pct / 100);
  const banked = P.tp1Frac * (1 + P.tp1Pct / 100);
  let tp1Hit = false, peak = entry;
  for (const c of candles) {
    const lo = Number(c.low), hi = Number(c.high);
    if (!tp1Hit) {
      if (lo <= stop) return 1 - P.stopPct / 100;                 // stopped first (pessimistic on same-candle)
      if (hi >= tp1) { tp1Hit = true; peak = Math.max(peak, hi); if (P.tp1Frac >= 1) return banked; }
    } else {
      peak = Math.max(peak, hi);
      if (lo <= peak * (1 - P.trailPct / 100)) { const x = Math.min(peak * (1 - P.trailPct / 100), entry * P.moonCap); return banked + (1 - P.tp1Frac) * (x / entry); }
    }
  }
  if (!tp1Hit) return Number(candles[candles.length - 1].close) / entry;
  const x = Math.min(peak, entry * P.moonCap); return banked + (1 - P.tp1Frac) * (x / entry);
}

function walletBuys(trades) {
  const seen = new Set(), buys = [];
  for (const t of (trades || [])) {
    const to = t && t.to;
    if (!(to && to.address && to.address !== SOL_MINT)) continue;
    if (!(t.from && t.from.address === SOL_MINT)) continue;
    if (seen.has(to.address)) continue;
    const raw = Number(t.time) || 0, tsec = raw > 1e12 ? Math.floor(raw / 1000) : raw, px = Number(to.priceUsd) || 0;
    if (!tsec || !(px > 0)) continue;
    seen.add(to.address); buys.push({ mint: to.address, t: tsec, px });
  }
  return buys;
}

async function main() {
  const nowSec = Math.floor(Date.now() / 1000);
  const grab = JSON.parse(await readFile(path.resolve(process.cwd(), GRAB), "utf8"));
  const ranked = Object.entries(grab.wallets || {}).map(([w, r]) => {
    let q = 0;
    if (r.seeded) q += Math.min(400, Number(r.seedPnl) || 0) + (Number(r.seedWin) || 0);
    if (r.earlyAlpha) q += 150 + Math.min(250, ((Number(r.earlyRunners) || 0) - 1) * 50) + Math.min(100, (Number(r.earlyRoi) || 0) / 2);
    return { w, q, r };
  }).sort((a, b) => b.q - a.q).slice(0, MAX_WALLETS);
  console.log(`[tune] ${ranked.length} wallets × up to ${MAX_BUYS} buys, ${WINDOW_H}h window, ${LADDERS.length} ladders`);

  const ladderAgg = LADDERS.map(() => ({ sims: 0, wins: 0, sum: 0 }));
  const walletAgg = new Map();          // wallet -> ladders[].{sims,wins,sum}
  let totalSims = 0, noData = 0;
  for (let i = 0; i < ranked.length; i++) {
    const { w } = ranked[i];
    const d = await stJson(`/wallet/${encodeURIComponent(w)}/trades?limit=100`);
    const buys = walletBuys(d && d.trades).filter((b) => (nowSec - b.t) > MIN_AGE_H * 3600).slice(0, MAX_BUYS);
    if (!walletAgg.has(w)) walletAgg.set(w, LADDERS.map(() => ({ sims: 0, wins: 0, sum: 0 })));
    const wa = walletAgg.get(w);
    for (const b of buys) {
      const ch = await stJson(`/chart/${b.mint}?type=1m&time_from=${b.t}&time_to=${b.t + WINDOW_H * 3600}`);
      const candles = (ch && ch.oclhv) || [];
      if (!candles.length) { noData++; await sleep(60); continue; }
      for (let li = 0; li < LADDERS.length; li++) {
        const m = simLadder(candles, b.px, LADDERS[li]);
        if (m == null) continue;
        ladderAgg[li].sims++; ladderAgg[li].sum += m; if (m >= 1.04) ladderAgg[li].wins++;
        wa[li].sims++; wa[li].sum += m; if (m >= 1.04) wa[li].wins++;
      }
      totalSims++;
      await sleep(60);
    }
    if ((i + 1) % 25 === 0) console.log(`[tune] ${i + 1}/${ranked.length} wallets, ${totalSims} buys simmed, ${calls} ST calls`);
    await sleep(50);
  }

  const ladderTable = LADDERS.map((L, li) => ({ ...L, sims: ladderAgg[li].sims, winRate: ladderAgg[li].sims ? Math.round(ladderAgg[li].wins / ladderAgg[li].sims * 100) : 0, avgMult: ladderAgg[li].sims ? Math.round(ladderAgg[li].sum / ladderAgg[li].sims * 1000) / 1000 : 0, edgePct: ladderAgg[li].sims ? Math.round((ladderAgg[li].sum / ladderAgg[li].sims - 1) * 1000) / 10 : 0 }))
    .sort((a, b) => b.avgMult - a.avgMult);
  const best = ladderTable.filter((l) => l.sims >= MIN_SIMS_LADDER)[0] || ladderTable[0];
  const bestIdx = LADDERS.findIndex((L) => L.key === best.key);
  const perWallet = [...walletAgg.entries()].map(([w, arr]) => { const a = arr[bestIdx]; return a.sims >= 3 ? { wallet: w, sims: a.sims, winRate: Math.round(a.wins / a.sims * 100), avgMult: Math.round(a.sum / a.sims * 1000) / 1000 } : null; })
    .filter(Boolean).sort((a, b) => b.avgMult - a.avgMult);
  const coveragePct = (totalSims + noData) ? Math.round(totalSims / (totalSims + noData) * 100) : 0;

  const out = { meta: { ranAtMs: Date.now(), windowH: WINDOW_H, stCalls: calls, totalBuysSimmed: totalSims, chartCoveragePct: coveragePct, bestLadder: best }, ladderTable, perWallet };
  const outPath = path.resolve(process.cwd(), OUT);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 0));
  console.log(`\n[tune] === RESULTS (chart coverage ${coveragePct}% — RANKING reliable, absolute % survivorship-optimistic) ===`);
  console.log(`BEST LADDER: ${best.key}  stop -${best.stopPct}% / TP1 +${best.tp1Pct}% sell ${Math.round(best.tp1Frac * 100)}%  → avg ${best.avgMult}x, win ${best.winRate}%, ${best.sims} sims`);
  console.log(`Top 8 ladders:`); for (const l of ladderTable.slice(0, 8)) console.log(`  ${l.key.padEnd(14)} avg ${l.avgMult}x  win ${l.winRate}%  (${l.sims} sims)`);
  console.log(`Worst 3 ladders:`); for (const l of ladderTable.slice(-3)) console.log(`  ${l.key.padEnd(14)} avg ${l.avgMult}x  win ${l.winRate}%`);
  console.log(`Top 10 wallets under best ladder:`); for (const p of perWallet.slice(0, 10)) console.log(`  ${p.wallet.slice(0, 8)}.. ${p.avgMult}x win ${p.winRate}% (${p.sims})`);
  console.log(`→ ${outPath} (${calls} ST calls, ${perWallet.length} wallets ranked)`);
}
main().catch((e) => { console.error("[tune] fatal", e); process.exit(1); });
