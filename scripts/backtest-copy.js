#!/usr/bin/env node
// ============================================================================
// COPY-REPLAY BACKTEST (offline) — validate WHICH of our proven wallets actually
// make US money when copied, at MACHINE speed. For each wallet: pull its historical
// BUYS, pull the token's ST chart from each buy forward, and walk OUR exit ladder
// over the real price path (TP/stop in chronological order). Tally per-wallet
// copy-edge (win rate, avg realized multiple, PnL). Runs OFF the box — zero instance
// risk — and compresses what would be months of paper into minutes.
//
// USAGE:
//   SOLANA_TRACKER_API_KEY=<key> node scripts/backtest-copy.js [--wallets=120] [--buys=20] [--windowH=6] [--out=seed/backtest-results.json]
// ============================================================================

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const BASE = process.env.SOLANA_TRACKER_API_BASE || "https://data.solanatracker.io";
const KEY = process.env.SOLANA_TRACKER_API_KEY || "";
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true]; }));
const MAX_WALLETS = Math.max(1, Number(args.wallets) || 120);   // top-ranked wallets (the ones the poller watches)
const MAX_BUYS = Math.max(3, Number(args.buys) || 20);          // buys replayed per wallet
const WINDOW_H = Math.max(1, Number(args.windowH) || 6);        // hours of price path to replay after each buy
const MIN_AGE_H = 2;                                            // buy must be old enough that a path exists
const GRAB = args.grab || "seed/brain-grab.json";
const OUT = args.out || "seed/backtest-results.json";
if (!KEY) { console.error("ERROR: set SOLANA_TRACKER_API_KEY"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0;
async function stJson(p, { tries = 3 } = {}) {
  const url = `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
  for (let i = 0; i < tries; i++) {
    try {
      calls++;
      const res = await fetch(url, { headers: { Accept: "application/json", "x-api-key": KEY } });
      if (res.status === 429) { await sleep(1200 * (i + 1)); continue; }
      if (!res.ok) return null;
      return await res.json();
    } catch { if (i === tries - 1) return null; await sleep(400 * (i + 1)); }
  }
  return null;
}

// OUR steady exit ladder — the "lock a real win" profile. Walk candles in time order: stop and TP are
// resolved chronologically (pessimistic: if a candle spans both, assume stop hit first). After TP1 the
// 12% moon bag rides with a trailing give-back, capped. Returns realized multiple of the FULL position.
const LADDER = { stopPct: 12, tp1Pct: 25, tp1Frac: 0.88, trailPct: 40, moonCap: 6 };
function simLadder(candles, entry, P = LADDER) {
  if (!Array.isArray(candles) || !candles.length || !(entry > 0)) return null;
  const stop = entry * (1 - P.stopPct / 100);
  const tp1 = entry * (1 + P.tp1Pct / 100);
  const banked = P.tp1Frac * (1 + P.tp1Pct / 100);   // realized from the 88% sold at +25%
  let tp1Hit = false, peak = entry;
  for (const c of candles) {
    const lo = Number(c.low), hi = Number(c.high);
    if (!tp1Hit) {
      if (lo <= stop) return { mult: 1 - P.stopPct / 100, outcome: "stop" };   // stopped before any TP
      if (hi >= tp1) { tp1Hit = true; peak = Math.max(peak, hi); }
    } else {
      peak = Math.max(peak, hi);
      if (lo <= peak * (1 - P.trailPct / 100)) {
        const moonExit = Math.min(peak * (1 - P.trailPct / 100), entry * P.moonCap);
        return { mult: banked + (1 - P.tp1Frac) * (moonExit / entry), outcome: "tp+moon" };
      }
    }
  }
  if (!tp1Hit) { const last = Number(candles[candles.length - 1].close); return { mult: last / entry, outcome: "open" }; }
  const moonExit = Math.min(peak, entry * P.moonCap);
  return { mult: banked + (1 - P.tp1Frac) * (moonExit / entry), outcome: "tp+moonEnd" };
}

function walletBuys(trades) {
  const seen = new Set(); const buys = [];
  for (const t of (trades || [])) {
    const to = t && t.to;
    if (!(to && to.address && to.address !== SOL_MINT)) continue;       // BUY = SOL -> token
    if (!(t.from && t.from.address === SOL_MINT)) continue;
    if (seen.has(to.address)) continue;                                  // first buy per token only
    const raw = Number(t.time) || 0; const tsec = raw > 1e12 ? Math.floor(raw / 1000) : raw;
    const px = Number(to.priceUsd) || 0;
    if (!tsec || !(px > 0)) continue;
    seen.add(to.address);
    buys.push({ mint: to.address, t: tsec, px });
  }
  return buys;
}

async function main() {
  const nowSec = Math.floor(Date.now() / 1000);
  const grab = JSON.parse(await readFile(path.resolve(process.cwd(), GRAB), "utf8"));
  // rank wallets the same way the live poller does (organic > seed PnL/win > early-alpha skill)
  const ranked = Object.entries(grab.wallets || {}).map(([w, r]) => {
    let q = 0;
    if (r.seeded) q += Math.min(400, Number(r.seedPnl) || 0) + (Number(r.seedWin) || 0);
    if (r.earlyAlpha) q += 150 + Math.min(250, ((Number(r.earlyRunners) || 0) - 1) * 50) + Math.min(100, (Number(r.earlyRoi) || 0) / 2);
    return { w, q, r };
  }).sort((a, b) => b.q - a.q).slice(0, MAX_WALLETS);
  console.log(`[backtest] ${ranked.length} top wallets × up to ${MAX_BUYS} buys, ${WINDOW_H}h replay window, ladder ${JSON.stringify(LADDER)}`);

  const perWallet = [];
  let allTrades = 0, allWins = 0, multSum = 0, allNoData = 0;
  for (let i = 0; i < ranked.length; i++) {
    const { w, r } = ranked[i];
    const d = await stJson(`/wallet/${encodeURIComponent(w)}/trades?limit=100`);
    const buys = walletBuys(d && d.trades).filter((b) => (nowSec - b.t) > MIN_AGE_H * 3600).slice(0, MAX_BUYS);
    let n = 0, wins = 0, sum = 0, noData = 0; const outcomes = {};
    for (const b of buys) {
      const to = b.t + WINDOW_H * 3600;
      const ch = await stJson(`/chart/${b.mint}?type=1m&time_from=${b.t}&time_to=${to}`);
      const candles = (ch && ch.oclhv) || [];
      const res = simLadder(candles, b.px);
      if (!res) { noData++; await sleep(70); continue; }   // no chart path (often rugged/dead) — track for honesty
      n++; sum += res.mult; if (res.mult >= 1.04) wins++;
      outcomes[res.outcome] = (outcomes[res.outcome] || 0) + 1;
      await sleep(70);
    }
    allNoData += noData;
    if (n >= 3) {
      const avg = sum / n;
      perWallet.push({ wallet: w, trades: n, winRate: Math.round((wins / n) * 100), avgMult: Math.round(avg * 1000) / 1000, edgePct: Math.round((avg - 1) * 1000) / 10, seeded: !!r.seeded, earlyAlpha: !!r.earlyAlpha, earlyRunners: r.earlyRunners || null, outcomes });
      allTrades += n; allWins += wins; multSum += sum;
    }
    if ((i + 1) % 20 === 0) console.log(`[backtest] ${i + 1}/${ranked.length} wallets, ${allTrades} sims, ${calls} ST calls`);
    await sleep(60);
  }
  perWallet.sort((a, b) => b.avgMult - a.avgMult);
  const coveragePct = (allTrades + allNoData) ? Math.round((allTrades / (allTrades + allNoData)) * 100) : 0;
  const overall = { wallets: perWallet.length, sims: allTrades, noChartData: allNoData, chartCoveragePct: coveragePct, winRate: allTrades ? Math.round((allWins / allTrades) * 100) : 0, avgMult: allTrades ? Math.round((multSum / allTrades) * 1000) / 1000 : 0, edgePerTradePct: allTrades ? Math.round((multSum / allTrades - 1) * 1000) / 10 : 0 };
  const out = { meta: { ranAtMs: Date.now(), ladder: LADDER, windowH: WINDOW_H, stCalls: calls, overall }, perWallet };
  const outPath = path.resolve(process.cwd(), OUT);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out, null, 0));
  console.log(`\n[backtest] === RESULTS ===`);
  console.log(`overall: ${overall.sims} copy-sims across ${overall.wallets} wallets → win ${overall.winRate}%, avg mult ${overall.avgMult}x, edge ${overall.edgePerTradePct}%/trade`);
  console.log(`chart coverage: ${overall.chartCoveragePct}% (${overall.noChartData} buys had NO chart path — likely rugged/dead; absolute win% is survivorship-OPTIMISTIC, RANKING is the reliable signal)`);
  console.log(`TOP 10 copy-edge wallets:`);
  for (const p of perWallet.slice(0, 10)) console.log(`  ${p.wallet.slice(0, 8)}.. ${p.avgMult}x  win ${p.winRate}%  (${p.trades} sims${p.earlyAlpha ? `, alpha×${p.earlyRunners}` : ""})`);
  console.log(`WORST 5:`);
  for (const p of perWallet.slice(-5)) console.log(`  ${p.wallet.slice(0, 8)}.. ${p.avgMult}x  win ${p.winRate}%  (${p.trades} sims)`);
  console.log(`→ ${outPath} (${calls} ST calls)`);
}
main().catch((e) => { console.error("[backtest] fatal", e); process.exit(1); });
