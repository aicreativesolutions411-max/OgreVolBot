// Server-side Fresh-Ape Autopilot engine.
//
// This is the live, always-on, background version of the paper autopilot that
// runs in the browser at /autopilot. The browser version proved the edge on
// real market data with simulated fills; this module ports the SAME decision
// brain server-side so it:
//   - runs inside the Node process (survives closing your phone / app),
//   - executes REAL buys/sells through the battle-tested trade path,
//   - manages many concurrent positions (not a hard cap of 2),
//   - is bounded to a DEDICATED wallet, with a loss cap + timer + kill switch.
//
// Decision logic is pure and exported for tests; all I/O (market reads, buys,
// sells, persistence, clock) is injected so the engine is decoupled from the
// monolith and unit-testable.

export const LAMPORTS_PER_SOL = 1_000_000_000;
const SELL_FEE_FACTOR = 0.985; // round-trip slippage+fee haircut used for synthetic ledger

// ---------------------------------------------------------------------------
// Pure decision helpers (ported from web/public/autopilot.html)
// ---------------------------------------------------------------------------

// Regime + sizing knobs derived from rolling-10 win rate and the current
// streak. HOT regimes size up and loosen the score cutoff; COLD regimes shrink
// size and demand higher-quality entries (but never stop buying).
export function aggParams(state) {
  const recent = state.results.slice(-10);
  const wins = recent.filter((r) => r === "W").length;
  const wr = recent.length >= 4 ? wins / recent.length : 0.5;
  let regime = "NORMAL";
  if (wr >= 0.6) regime = "HOT";
  else if (wr <= 0.3) regime = "COLD";

  const mode = state.mode || "normal";
  const baseFrac = mode === "degen" ? 0.12 : mode === "chill" ? 0.05 : 0.08;

  let streakMult = 1;
  if (state.streak >= 3) streakMult = 1.5;
  else if (state.streak >= 1) streakMult = 1.2;
  else if (state.streak <= -2) streakMult = 0.5;
  else if (state.streak <= -1) streakMult = 0.75;

  const regimeMult = regime === "HOT" ? 1.3 : regime === "COLD" ? 0.6 : 1;

  let tp1 = 25;
  let tp2 = 60;
  const sl = 8;
  if (regime === "HOT") {
    tp1 = 28;
    tp2 = 75;
  } else if (regime === "COLD") {
    tp1 = 20;
    tp2 = 45;
  }

  let minScore = regime === "HOT" ? 34 : regime === "COLD" ? 48 : 40;
  if (mode === "degen") minScore -= 6;
  else if (mode === "chill") minScore += 8;

  return { regime, wr, baseFrac, streakMult, regimeMult, tp1, tp2, sl, minScore };
}

// Position size in SOL: base fraction of cash, scaled by streak + regime,
// clamped so a single trade is never trivially small nor a huge slug of bank.
export function sizeFor(state, P) {
  const cash = state.bank;
  const raw = cash * P.baseFrac * P.streakMult * P.regimeMult;
  const min = state.minTradeSol;
  const max = Math.max(min, cash * 0.22);
  return Math.max(min, Math.min(raw, max));
}

// Fresh-launch fitness score. Higher = a younger, better-funded, buy-led mover.
export function freshScore(row) {
  const age = Number(row.pairAgeSeconds);
  const mc = Number(row.marketCap);
  const vol = Number(row.volume5m);
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;

  let s = 0;
  if (age <= 30) s += 26;
  else if (age <= 120) s += 20;
  else if (age <= 300) s += 14;
  else if (age <= 600) s += 9;
  else s += 4;

  if (mc >= 2500 && mc <= 8000) s += 22;
  else if (mc >= 1800 && mc <= 15000) s += 14;
  else s += 6;

  if (vol >= 120) s += 16;
  else if (vol >= 60) s += 11;
  else if (vol >= 30) s += 7;
  else if (vol >= 18) s += 3;

  const flow = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  s += (flow - 0.5) * 22;

  const prov = Number(row.bestPickScore) || 0;
  s += Math.min(15, prov * 0.15);

  return s;
}

// Hard entry gates — filter instant-rug bait while keeping genuine fresh
// movers. Returns null if the row passes, or a string reason if rejected.
export function entryReject(row, P) {
  const age = Number(row.pairAgeSeconds);
  const mc = Number(row.marketCap);
  const liq = Number(row.liquidityUsd) || 0;
  const vol = Number(row.volume5m) || 0;
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;

  // Anti-rug, calibrated to the REAL fresh-launch market: a $2k-MC pump coin
  // legitimately has ~$2k liquidity, so an absolute liq floor rejects everything.
  // Gate liquidity RELATIVE to market cap (catches genuine drains) and lean on
  // the fast exit-side rug/stop protection for the rest. buys/sells counts are
  // unreliable on brand-new bonding-curve pairs, so use volume as the activity
  // signal and only reject on a clear heavy dump.
  if (!Number.isFinite(age) || age < 4 || age > 1200) return "age";
  if (!Number.isFinite(mc) || mc < 1800 || mc > 20000) return "mc";
  if (liq > 0 && liq < mc * 0.3) return "liquidity";
  if (vol < 25) return "volume";
  if (buys > 0 && sells > buys * 2 + 3) return "dumping";
  if (freshScore(row) < P.minScore) return "score";
  return null;
}

// Decide what to do with one open position given a fresh market read.
// Returns { action: 'hold' | 'sell', pct, reason } where pct is fraction to sell.
// Decide what to do with one open position. `pct` is the % of the CURRENTLY
// REMAINING bag to sell. Ladder: bank profit early, then let a moon bag ride to
// big multiples — protected by a trailing give-back so a runner that spikes and
// reverses (e.g. +450% then dumps) is sold on the way down, not at zero.
export function evalExit(pos, P, nowMs) {
  const move = pos.entryMc > 0 ? (pos.lastMc / pos.entryMc - 1) * 100 : 0;
  const peak = Math.max(pos.peakPct || 0, move);
  const held = nowMs - pos.openedAt;

  // Liquidity pulled out from under us — get out at any price.
  if (pos.entryLiq > 400 && pos.lastLiq > 0 && pos.lastLiq < pos.entryLiq * 0.5) {
    return { action: "sell", pct: 100, reason: "rug", move };
  }
  // We lost the live feed for this coin and it's been a while — exit blind.
  if (pos.missed >= 2 && held > 18_000) {
    return { action: "sell", pct: 100, reason: "feed-lost", move };
  }
  // Trailing give-back: once we've banked first profit and it has run, dump the
  // rest if it retraces to half of its peak gain. This is what catches the
  // "+450% then tanked" round-trip — it would exit near +225%, not at 0.
  if (pos.tp1Done && peak >= 40 && move <= peak * 0.5) {
    return { action: "sell", pct: 100, reason: "trail", move };
  }
  // Hard stop, but only before we've taken any profit (after TP1 the trail owns it).
  if (!pos.tp1Done && move <= -P.sl) {
    return { action: "sell", pct: 100, reason: "stop", move };
  }
  // TP1: bank 40%, let the rest ride.
  if (!pos.tp1Done && move >= P.tp1) {
    return { action: "sell", pct: 40, reason: "tp1", move };
  }
  // TP2: bank half of what's left, keep a moon bag for a real runner.
  if (pos.tp1Done && !pos.tp2Done && move >= P.tp2) {
    return { action: "sell", pct: 50, reason: "tp2", move };
  }
  // TP3 (+200%): sell half the moon bag.
  if (pos.tp2Done && !pos.tp3Done && move >= 200) {
    return { action: "sell", pct: 50, reason: "tp3", move };
  }
  // TP4 (+500%): close the runner out.
  if (pos.tp3Done && move >= 500) {
    return { action: "sell", pct: 100, reason: "tp4", move };
  }
  // Stale: held 3 min and never really moved.
  if (held > 180_000 && move < P.tp1) {
    return { action: "sell", pct: 100, reason: "stale", move };
  }
  return { action: "hold", move };
}

// Whether the engine may open another position right now. Multi-position by
// design: gated on available cash, total deployment, and a generous soft cap —
// NOT a hard 2-position limit. Moon bags can sit while it keeps hunting.
export function canOpen(state, sizeSol) {
  if (state.open.length >= state.maxOpen) return false;
  if (sizeSol > state.bank) return false;
  if (state.bank - sizeSol < 0) return false;
  const deployed = state.open.reduce((a, p) => a + p.costSol * p.remFrac, 0);
  const eq = equity(state);
  if (eq > 0 && (deployed + sizeSol) / eq > 0.9) return false;
  return true;
}

export function equity(state) {
  const openVal = state.open.reduce((a, p) => {
    const move = p.entryMc > 0 ? p.lastMc / p.entryMc : 1;
    return a + p.costSol * p.remFrac * move;
  }, 0);
  return state.bank + openVal;
}

// ---------------------------------------------------------------------------
// Stateful engine
// ---------------------------------------------------------------------------

function freshState(opts) {
  return {
    mode: opts.mode || "normal",
    live: Boolean(opts.live),
    walletPubkey: opts.walletPubkey || null,
    start: opts.solBudget,
    bank: opts.solBudget,
    peak: opts.solBudget,
    walletSol: null,
    minTradeSol: opts.minTradeSol || 0.012,
    maxOpen: opts.maxOpen || 8,
    open: [],
    wins: 0,
    losses: 0,
    streak: 0,
    results: [],
    waves: {},
    recentSells: {},
    tradeNo: 0,
    tickN: 0,
    startedAt: opts.startedAt,
    endAt: opts.endAt,
    stopped: false,
    stopReason: null
  };
}

export function createAutopilotEngine(deps) {
  const {
    getFreshFeed,
    getPairLite,
    buyToken,
    sellPercent,
    now = () => Date.now(),
    log = () => {},
    persist = async () => {},
    isPaused = async () => false,
    onOpen = () => {},
    getWalletSol = async () => null,
    exitMs = 1200,
    huntMs = 5000
  } = deps;

  let state = null;
  let exitTimer = null;
  let huntTimer = null;
  let inExit = false;
  let inHunt = false;
  const logRing = [];
  const lastFeed = new Map(); // mint -> {mc, liq, at} — fresh prices from the live feed

  function record(level, msg, data) {
    const entry = { at: now(), level, msg, data: data || null };
    logRing.push(entry);
    if (logRing.length > 400) logRing.shift();
    try {
      log(level, msg, data);
    } catch {}
  }

  function snapshot() {
    return state ? JSON.parse(JSON.stringify(state)) : null;
  }

  async function savePoint() {
    try {
      await persist(snapshot());
    } catch (e) {
      record("warn", `persist failed: ${e && e.message}`);
    }
  }

  function running() {
    return Boolean(state && !state.stopped);
  }

  async function start(opts) {
    if (running()) throw new Error("Autopilot already running. Stop it first.");
    if (!(opts.solBudget > 0)) throw new Error("solBudget must be > 0 SOL.");
    if (opts.live && !opts.walletPubkey) {
      throw new Error("Live mode requires a resolved dedicated wallet.");
    }
    const startedAt = now();
    const minutes = Math.max(1, Number(opts.minutes) || 60);
    state = freshState({
      ...opts,
      startedAt,
      endAt: startedAt + minutes * 60_000
    });
    record("info", `Autopilot START ${state.live ? "LIVE" : "PAPER"} ${state.start} SOL · ${minutes}m · ${state.mode}`, {
      live: state.live,
      wallet: state.walletPubkey
    });
    await savePoint();
    startLoops();
    return status();
  }

  // Two independent loops: a fast exit/price loop (in-memory pump ticks, so
  // P&L and stops update near-instantly) and a slower hunt loop (the heavy live
  // feed fetch + new buys), so a slow feed pull never delays price updates.
  function startLoops() {
    stopLoops();
    exitTimer = setInterval(() => { void safeExit(); }, exitMs);
    huntTimer = setInterval(() => { void safeHunt(); }, huntMs);
  }
  function stopLoops() {
    if (exitTimer) { clearInterval(exitTimer); exitTimer = null; }
    if (huntTimer) { clearInterval(huntTimer); huntTimer = null; }
  }

  // Re-attach to a persisted session after a restart/redeploy. Positions keep
  // being managed; hunting resumes only if still inside the timer window.
  async function resume(snap) {
    if (!snap || snap.stopped) return false;
    if (now() >= snap.endAt && snap.open.length === 0) return false;
    state = snap;
    // Re-subscribe open positions to the live tick stream so they price instantly.
    for (const pos of state.open) {
      try { onOpen(pos.mint); } catch {}
    }
    record("info", `Autopilot RESUME ${state.live ? "LIVE" : "PAPER"} · ${state.open.length} open · bank ${state.bank.toFixed(4)} SOL`);
    startLoops();
    return true;
  }

  async function stop(reason = "manual") {
    stopLoops();
    if (state && !state.stopped) {
      // Selling out is the whole point of Stop — flatten every open position
      // (real sells in live mode) before we mark the session done.
      const hadOpen = state.open.length;
      try {
        await flatten(reason);
      } catch (e) {
        record("warn", `flatten on stop failed: ${e && e.message}`);
      }
      state.stopped = true;
      state.stopReason = reason;
      record("info", `Autopilot STOP (${reason})${hadOpen ? ` — flattened ${hadOpen} position(s)` : ""}`);
      await savePoint();
    }
    return status();
  }

  // Sell everything immediately (loss cap / timer / kill switch).
  async function flatten(reason) {
    for (const pos of [...state.open]) {
      await doSell(pos, 100, reason);
    }
  }

  function status() {
    if (!state) return { running: false };
    return {
      running: running(),
      live: state.live,
      mode: state.mode,
      wallet: state.walletPubkey,
      start: state.start,
      bank: round(state.bank),
      walletSol: state.walletSol == null ? null : round(state.walletSol),
      equity: round(equity(state)),
      peak: round(state.peak),
      pnlPct: round(((equity(state) / state.start) - 1) * 100, 2),
      wins: state.wins,
      losses: state.losses,
      streak: state.streak,
      open: state.open.map((p) => ({
        sym: p.sym,
        mint: p.mint,
        costSol: round(p.costSol),
        remFrac: p.remFrac,
        movePct: round(p.entryMc > 0 ? (p.lastMc / p.entryMc - 1) * 100 : 0, 2),
        heldS: Math.round((now() - p.openedAt) / 1000)
      })),
      tradeNo: state.tradeNo,
      endsInS: Math.max(0, Math.round((state.endAt - now()) / 1000)),
      stopped: state.stopped,
      stopReason: state.stopReason,
      log: logRing.slice(-40)
    };
  }

  // FAST loop: prices + exits + safety. In-memory pump ticks make this nearly
  // instant; it never does the heavy feed fetch.
  async function safeExit() {
    if (inExit) return;
    inExit = true;
    try {
      if (!running()) return;
      state.tickN += 1;

      if (await isPaused()) { await stop("emergency-stop"); return; }
      if (now() >= state.endAt) { await stop("timer"); return; }

      if (equity(state) <= state.start * 0.7) {
        record("warn", `Loss cap hit at equity ${round(equity(state))} SOL — flattening.`);
        await stop("loss-cap");
        return;
      }

      await manageExits();
      const eq = equity(state);
      if (eq > state.peak) state.peak = eq;
    } catch (e) {
      record("error", `exit loop error: ${e && e.message}`);
    } finally {
      inExit = false;
    }
  }

  // SLOW loop: wallet reconciliation, hunting for new entries (heavy feed fetch),
  // and persistence. Runs independently so it can't stall the exit loop.
  async function safeHunt() {
    if (inHunt) return;
    inHunt = true;
    try {
      if (!running()) return;

      // Reconcile to the REAL wallet balance so the displayed numbers and
      // position sizing track actual SOL, not a drifting synthetic ledger.
      if (state.live) {
        try {
          const ws = await getWalletSol();
          if (Number.isFinite(ws) && ws >= 0) { state.walletSol = ws; state.bank = ws; }
        } catch {}
      }

      if (now() < state.endAt) await hunt();
      await savePoint();
    } catch (e) {
      record("error", `hunt loop error: ${e && e.message}`);
    } finally {
      inHunt = false;
    }
  }

  async function manageExits() {
    const P = aggParams(state);
    for (const pos of [...state.open]) {
      let mc = 0;
      let liq = 0;
      // Primary = getPairLite, which reads the live pump trade tick (in-memory,
      // sub-second) for bonding-curve coins; the recently-cached feed is the
      // fallback when there's no fresh tick yet.
      try {
        const lite = await getPairLite(pos.mint);
        if (lite && Number(lite.marketCap) > 0) {
          mc = Number(lite.marketCap);
          liq = Number(lite.liquidityUsd) || 0;
        }
      } catch {}
      if (!(mc > 0)) {
        const fed = lastFeed.get(pos.mint);
        if (fed && now() - fed.at < 12000 && fed.mc > 0) {
          mc = fed.mc;
          liq = fed.liq;
        }
      }
      if (mc > 0) {
        pos.lastMc = mc;
        if (liq > 0) pos.lastLiq = liq;
        pos.missed = 0;
        const movePct = pos.entryMc > 0 ? (pos.lastMc / pos.entryMc - 1) * 100 : 0;
        pos.peakPct = Math.max(pos.peakPct || 0, movePct);
      } else {
        pos.missed = (pos.missed || 0) + 1;
      }
      const decision = evalExit(pos, P, now());
      if (decision.action === "sell") {
        await doSell(pos, decision.pct, decision.reason);
      }
    }
  }

  async function doSell(pos, pct, reason) {
    const move = pos.entryMc > 0 ? (pos.lastMc / pos.entryMc - 1) * 100 : 0;
    const frac = pct / 100;
    const portionOfOriginal = pos.remFrac * frac;
    let failedTerminal = false;
    if (state.live) {
      try {
        const res = await sellPercent(pos.mint, pct, pos);
        if (res && res.ok === false) throw new Error("sell rejected");
      } catch (e) {
        pos.sellFails = (pos.sellFails || 0) + 1;
        const noBalance = /no token balance|rounded to zero/i.test((e && e.message) || "");
        record("warn", `sell ${pos.sym} failed (${reason}): ${e && e.message}`);
        // Transient error: keep the position and retry next tick. But "no token
        // balance" (tokens gone/dust) or repeated failures are terminal — write
        // the portion off at ZERO so the ledger can't show SOL we don't have.
        if (!noBalance && pos.sellFails < 4) return;
        failedTerminal = true;
      }
    }

    // Credit estimated proceeds for a real/paper fill only. A terminal live
    // failure books zero so the synthetic bank can't drift above the real wallet
    // (the wallet balance reconciliation is the true source of truth either way).
    const proceeds = failedTerminal ? 0 : pos.costSol * portionOfOriginal * (1 + move / 100) * SELL_FEE_FACTOR;
    state.bank += proceeds;
    pos.realized = (pos.realized || 0) + proceeds;

    if (pct >= 100 || frac >= 1 || failedTerminal) {
      // Closing the position.
      pos.remFrac = 0;
      finalizePosition(pos, failedTerminal ? `${reason}-failed` : reason);
    } else {
      pos.remFrac = pos.remFrac * (1 - frac);
      if (reason === "tp1") pos.tp1Done = true;
      else if (reason === "tp2") pos.tp2Done = true;
      else if (reason === "tp3") pos.tp3Done = true;
      record("info", `🟡 ${pos.sym} ${reason.toUpperCase()} sold ${pct}% @ ${round(move, 1)}% (moon bag rides)`);
    }
  }

  function finalizePosition(pos, reason) {
    const idx = state.open.indexOf(pos);
    if (idx >= 0) state.open.splice(idx, 1);
    const totalProceeds = pos.realized || 0;
    const win = totalProceeds >= pos.costSol;
    if (win) {
      state.wins += 1;
      state.results.push("W");
      state.streak = state.streak >= 0 ? state.streak + 1 : 1;
    } else {
      state.losses += 1;
      state.results.push("L");
      state.streak = state.streak <= 0 ? state.streak - 1 : -1;
    }
    if (state.results.length > 40) state.results.shift();
    state.recentSells[pos.mint] = now();
    const pnl = totalProceeds - pos.costSol;
    record(win ? "info" : "warn", `${win ? "✅" : "🔴"} ${pos.sym} CLOSE ${reason} ${pnl >= 0 ? "+" : ""}${round(pnl, 4)} SOL`);
  }

  async function hunt() {
    let rows = [];
    try {
      rows = await getFreshFeed();
    } catch (e) {
      record("warn", `feed error: ${e && e.message}`);
      return;
    }
    if (!Array.isArray(rows) || !rows.length) return;
    // Cache fresh prices from the feed so open positions update fast (used in manageExits).
    const t = now();
    for (const r of rows) {
      if (r && r.tokenMint) {
        const mc = Number(r.marketCap) || 0;
        if (mc > 0) lastFeed.set(r.tokenMint, { mc, liq: Number(r.liquidityUsd) || 0, at: t });
      }
    }
    const P = aggParams(state);
    const held = new Set(state.open.map((p) => p.mint));
    const nowMs = now();

    const scored = rows
      .filter((r) => r && r.tokenMint && !held.has(r.tokenMint))
      .filter((r) => {
        // Wave cooldown: allow re-entry on a coin we sold, but not within 45s.
        const last = state.recentSells[r.tokenMint];
        return !last || nowMs - last > 45_000;
      })
      .map((r) => ({ r, reject: entryReject(r, P), fs: freshScore(r) }))
      .filter((x) => !x.reject)
      .sort((a, b) => b.fs - a.fs);

    for (const cand of scored) {
      const size = sizeFor(state, P);
      if (!canOpen(state, size)) break;
      await openPosition(cand.r, size, cand.fs);
    }
  }

  async function openPosition(row, sizeSol, fs) {
    const mint = row.tokenMint;
    const sym = row.symbol || row.baseToken?.symbol || shortMint(mint);
    const entryMc = Number(row.marketCap) || 0;
    const entryLiq = Number(row.liquidityUsd) || 0;
    if (entryMc <= 0) return;
    // Start the live pump trade-tick stream for this coin so prices update instantly.
    try { onOpen(mint); } catch {}

    let tokenAmount = null;
    if (state.live) {
      const lamports = Math.floor(sizeSol * LAMPORTS_PER_SOL);
      try {
        const res = await buyToken(mint, lamports);
        if (!res || res.ok === false) {
          record("warn", `buy ${sym} rejected`);
          return;
        }
        tokenAmount = res.tokenAmount || res.outputAmount || null;
      } catch (e) {
        record("warn", `buy ${sym} failed: ${e && e.message}`);
        return;
      }
    }

    state.bank -= sizeSol;
    state.tradeNo += 1;
    const pos = {
      mint,
      sym,
      entryMc,
      lastMc: entryMc,
      entryLiq,
      lastLiq: entryLiq,
      costSol: sizeSol,
      tokenAmount,
      remFrac: 1,
      openedAt: now(),
      missed: 0,
      tp1Done: false,
      tp2Done: false,
      tp3Done: false,
      peakPct: 0,
      realized: 0,
      fs: round(fs, 1)
    };
    state.open.push(pos);
    record("info", `🟢 APED ${sym} ${round(sizeSol, 4)} SOL @ MC $${Math.round(entryMc)} (fs ${pos.fs})`);
  }

  // _tick drives one full step (exit pass + hunt pass) for deterministic tests.
  return {
    start, stop, resume, status, snapshot,
    _tick: async () => { await safeExit(); await safeHunt(); },
    _exit: safeExit,
    _hunt: safeHunt,
    _state: () => state
  };
}

// ---------------------------------------------------------------------------
// small utils
// ---------------------------------------------------------------------------
function round(n, d = 4) {
  const f = Math.pow(10, d);
  return Math.round(Number(n) * f) / f;
}
function shortMint(m) {
  const s = String(m || "");
  return s.length > 8 ? `${s.slice(0, 4)}..${s.slice(-4)}` : s;
}
