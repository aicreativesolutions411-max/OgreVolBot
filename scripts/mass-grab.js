#!/usr/bin/env node
// ============================================================================
// MASS BRAIN GRAB (offline) — pull EVERYTHING from Solana Tracker Premium WITHOUT
// touching the production instance, then write one data file the backend merges on boot.
//
// WHY: the crash-loop came from the Render box doing the heavy ST pulling. This runs OFF
// the box (locally / in a sandbox) so it can hammer Premium freely and the live bot is never
// at risk. Output → data/brain-grab.json, which src/index.js merges into walletObs once on boot.
//
// USAGE:
//   SOLANA_TRACKER_API_KEY=<premium key> node scripts/mass-grab.js [--pages=120] [--limit=100] [--out=data/brain-grab.json]
//
// Pulls the top-trader leaderboard deep, fetches each genuinely-profitable wallet's real
// trade history, and derives HOW it trades (median hold time / entry-MC band / exit multiple) —
// the same record seedWinnerWallet() writes, so the merge is a drop-in.
// ============================================================================

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const BASE = process.env.SOLANA_TRACKER_API_BASE || "https://data.solanatracker.io";
const KEY = process.env.SOLANA_TRACKER_API_KEY || "";

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = a.match(/^--([^=]+)=(.*)$/); return m ? [m[1], m[2]] : [a.replace(/^--/, ""), true];
}));
const MAX_PAGES = Math.max(1, Number(args.pages) || 120);     // 120 pages × 25 = up to 3000 traders
const TRADES_LIMIT = Math.max(20, Number(args.limit) || 100); // trades pulled per wallet (style depth)
const OUT = args.out || "seed/brain-grab.json";
const WIN_MIN = Number(args.winMin) || 55;                    // same proven-winner bar as the live seeder
const TRADES_MIN = Number(args.tradesMin) || 50;
const PER_WALLET_GAP_MS = Number(args.gap) || 110;            // polite pacing between wallet calls
const PER_PAGE_GAP_MS = Number(args.pageGap) || 400;

if (!KEY) { console.error("ERROR: set SOLANA_TRACKER_API_KEY"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let calls = 0;
async function stJson(p, { tries = 3 } = {}) {
  const url = `${BASE}${p.startsWith("/") ? p : `/${p}`}`;
  for (let i = 0; i < tries; i++) {
    try {
      calls += 1;
      const res = await fetch(url, { headers: { Accept: "application/json", "x-api-key": KEY } });
      if (res.status === 429) { await sleep(1500 * (i + 1)); continue; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) { if (i === tries - 1) throw e; await sleep(500 * (i + 1)); }
  }
  return null;
}

// Derive a wallet's STYLE from raw ST trades (verified shape: from/to swap sides; the non-SOL side
// carries marketCap + priceUsd; the trade carries time). Pairs first-buy → last-sell per token.
function deriveStyle(trades) {
  const byTok = {};
  for (const t of (trades || [])) {
    const tk = (t.to && t.to.address && t.to.address !== SOL_MINT) ? t.to
      : ((t.from && t.from.address && t.from.address !== SOL_MINT) ? t.from : null);
    if (!tk || !tk.address) continue;
    const isBuy = Boolean(t.to && t.to.address === tk.address);
    const raw = Number(t.time) || 0; const tsec = raw > 1e12 ? raw / 1000 : raw;
    (byTok[tk.address] = byTok[tk.address] || []).push({ isBuy, t: tsec, mc: Number(tk.marketCap) || 0, px: Number(tk.priceUsd) || 0 });
  }
  const holds = [], entryMcs = [], exitMults = [];
  for (const mint in byTok) {
    const ev = byTok[mint].sort((a, b) => a.t - b.t);
    const buy = ev.find((e) => e.isBuy);
    const sell = [...ev].reverse().find((e) => !e.isBuy);
    if (buy && sell && sell.t >= buy.t) {
      holds.push(sell.t - buy.t);
      if (buy.mc > 0) entryMcs.push(buy.mc);
      if (buy.px > 0 && sell.px > 0) exitMults.push(sell.px / buy.px);
    }
  }
  const med = (a) => a.length ? a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)] : null;
  return {
    holdMs: med(holds) != null ? Math.round(med(holds) * 1000) : null,
    entryMc: med(entryMcs), exitMult: med(exitMults), tokens: Object.keys(byTok).length
  };
}

// PHASE 2 — FIRST-BUYER ALPHA: wallets that repeatedly got into RUNNER tokens early AND made money.
// The lifetime-PnL leaderboard (phase 1) misses these — they're the "in before it ran" wallets we most
// want to copy. We scan first-buyers of many current runner tokens, keep only PROFITABLE early entries,
// and qualify a wallet when it shows that across >= FB_MIN_RUNNERS independent runners (repeat = skill).
const FB_TOKENS = Number(args.fbTokens ?? 300);       // how many runner tokens to scan (0 = skip phase 2)
const FB_MIN_RUNNERS = Number(args.fbMinRunners || 2); // appear early+profitable in >= N distinct runners
const FB_LIMIT = Number(args.fbLimit || 100);

async function gatherRunnerTokens(max) {
  const mints = new Set();
  for (const ep of ["/tokens/trending", "/tokens/volume", "/tokens/multi/graduated", "/tokens/latest"]) {
    if (mints.size >= max) break;
    try {
      const d = await stJson(ep);
      for (const it of (Array.isArray(d) ? d : [])) {
        const m = (it && it.token && it.token.mint) || (it && it.mint);
        if (m && m !== SOL_MINT) mints.add(m);
        if (mints.size >= max) break;
      }
    } catch (e) { console.warn(`[mass-grab] runner list ${ep} failed: ${e.message}`); }
    await sleep(PER_PAGE_GAP_MS);
  }
  return [...mints].slice(0, max);
}

async function firstBuyerPhase(wallets) {
  if (FB_TOKENS <= 0) return { skipped: true };
  const tokens = await gatherRunnerTokens(FB_TOKENS);
  console.log(`[mass-grab] phase2: scanning first-buyers of ${tokens.length} runner tokens`);
  const tally = new Map();                            // wallet -> { runners:Set, pnl, invested }
  let fbCalls = 0, scannedTok = 0;
  for (const tok of tokens) {
    let buyers = [];
    try { buyers = (await stJson(`/first-buyers/${tok}?limit=${FB_LIMIT}`)) || []; fbCalls++; } catch {}
    for (const b of (Array.isArray(buyers) ? buyers : [])) {
      const w = b && b.wallet; if (!w) continue;
      const total = Number(b.total) || 0;             // realized + unrealized profit on this token
      if (total <= 0) continue;                       // ONLY profitable early entries are alpha
      let g = tally.get(w); if (!g) { g = { runners: new Set(), pnl: 0, invested: 0 }; tally.set(w, g); }
      g.runners.add(tok); g.pnl += total; g.invested += Number(b.total_invested) || 0;
    }
    scannedTok++;
    if (scannedTok % 50 === 0) console.log(`[mass-grab] phase2: ${scannedTok}/${tokens.length} tokens, ${tally.size} profitable early-buyers so far`);
    await sleep(90);
  }
  const kept = [...tally.entries()].filter(([, g]) => g.runners.size >= FB_MIN_RUNNERS)
    .sort((a, b) => b[1].runners.size - a[1].runners.size || b[1].pnl - a[1].pnl);
  console.log(`[mass-grab] phase2: ${tally.size} profitable early-buyers → ${kept.length} repeat (>=${FB_MIN_RUNNERS} runners), ${fbCalls} first-buyer calls`);
  let added = 0;
  for (const [w, g] of kept) {
    let trades = [];
    try { const d = await stJson(`/wallet/${encodeURIComponent(w)}/trades?limit=${TRADES_LIMIT}`); trades = (d && d.trades) || []; } catch {}
    const style = deriveStyle(trades);
    const N = 10;
    const rec = wallets[w] || { coins: 0, ran: 0, rugged: 0, peakSum: 0 };
    rec.earlyAlpha = true;
    rec.earlyRunners = g.runners.size;
    rec.earlyPnl = Math.round(g.pnl);
    rec.earlyRoi = g.invested > 0 ? Math.round((g.pnl / g.invested) * 100) : null;
    if (!(rec.holdN > 0) && style.holdMs != null) { rec.holdMsSum = style.holdMs * N; rec.holdN = N; }
    if (!(rec.entryMcN > 0) && style.entryMc != null) { rec.entryMcSum = style.entryMc * N; rec.entryMcN = N; }
    if (!(rec.exitN > 0) && style.exitMult != null) { rec.exitSum = style.exitMult * N; rec.exitN = N; }
    if (!wallets[w]) added++;
    wallets[w] = rec;
    await sleep(PER_WALLET_GAP_MS);
  }
  return { tokens: tokens.length, candidates: tally.size, kept: kept.length, added, fbCalls };
}

async function main() {
  console.log(`[mass-grab] base=${BASE} pages<=${MAX_PAGES} tradesLimit=${TRADES_LIMIT} winMin=${WIN_MIN} tradesMin=${TRADES_MIN} fbTokens=${FB_TOKENS}`);
  const wallets = {};
  let scanned = 0, seeded = 0;
  for (let page = 1; page <= MAX_PAGES; page++) {
    let data;
    try { data = await stJson(`/top-traders/all/${page}`); }
    catch (e) { console.warn(`[mass-grab] leaderboard p${page} failed: ${e.message}; stopping`); break; }
    const rows = (data && data.wallets) || [];
    if (!rows.length) { console.log(`[mass-grab] page ${page} empty — leaderboard exhausted`); break; }
    let pageSeeded = 0;
    for (const row of rows) {
      scanned += 1;
      const w = row && row.wallet, s = row && row.summary;
      if (!w || !s) continue;
      if ((Number(s.winPercentage) || 0) < WIN_MIN) continue;
      if (((Number(s.totalWins) || 0) + (Number(s.totalLosses) || 0)) < TRADES_MIN) continue;
      if ((Number(s.total) || 0) <= 0) continue;
      if (wallets[w]) continue; // dedupe across pages
      let trades = [];
      try { const d = await stJson(`/wallet/${encodeURIComponent(w)}/trades?limit=${TRADES_LIMIT}`); trades = (d && d.trades) || []; }
      catch { /* keep the wallet with summary-only stats */ }
      const style = deriveStyle(trades);
      const N = 10; // pre-load running averages so the style is usable immediately (matches seedWinnerWallet)
      const rec = {
        seeded: true,
        seedWin: Number(s.winPercentage) || 0,
        seedTrades: (Number(s.totalWins) || 0) + (Number(s.totalLosses) || 0),
        seedPnl: Number(s.total) || 0,
        coins: 0, ran: 0, rugged: 0, peakSum: 0
      };
      if (style.holdMs != null) { rec.holdMsSum = style.holdMs * N; rec.holdN = N; }
      if (style.entryMc != null) { rec.entryMcSum = style.entryMc * N; rec.entryMcN = N; }
      if (style.exitMult != null) { rec.exitSum = style.exitMult * N; rec.exitN = N; }
      wallets[w] = rec;
      seeded += 1; pageSeeded += 1;
      await sleep(PER_WALLET_GAP_MS);
    }
    console.log(`[mass-grab] page ${page}: +${pageSeeded} winners (total ${seeded} from ${scanned} scanned, ${calls} ST calls)`);
    if (data && data.hasNext === false) { console.log(`[mass-grab] hasNext=false — leaderboard done`); break; }
    await sleep(PER_PAGE_GAP_MS);
  }
  console.log(`[mass-grab] phase1 done: ${seeded} leaderboard winners. Starting phase2 (first-buyer alpha)...`);
  let fb = { skipped: true };
  try { fb = await firstBuyerPhase(wallets); } catch (e) { console.warn(`[mass-grab] phase2 failed: ${e.message}`); }
  const total = Object.keys(wallets).length;
  const out = {
    meta: { grabbedAtMs: Date.now(), source: "solana-tracker/top-traders+first-buyers", scanned, leaderboardWinners: seeded, firstBuyer: fb, totalWallets: total, stCalls: calls, winMin: WIN_MIN, tradesMin: TRADES_MIN, version: 2 },
    wallets
  };
  const outPath = path.resolve(process.cwd(), OUT);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(out));
  console.log(`[mass-grab] DONE — ${total} wallets (${seeded} leaderboard + ${(fb && fb.added) || 0} early-alpha), ${scanned} scanned, ${calls} ST calls → ${outPath} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`);
}

main().catch((e) => { console.error("[mass-grab] fatal", e); process.exit(1); });
