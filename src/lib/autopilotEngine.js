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

  if (!Number.isFinite(age) || age < 4 || age > 1200) return "age";
  if (!Number.isFinite(mc) || mc < 1800 || mc > 20000) return "mc";
  if (liq > 0 && liq < 2500) return "liquidity";
  if (buys < 2) return "buyers";
  if (vol < 25) return "volume";
  if (sells > buys * 1.3) return "dumping";
  if (freshScore(row) < P.minScore) return "score";
  return null;
}

// Decide what to do with one open position given a fresh market read.
// Returns { action: 'hold' | 'sell', pct, reason } where pct is fraction to sell.
export function evalExit(pos, P, nowMs) {
  const move = pos.entryMc > 0 ? (pos.lastMc / pos.entryMc - 1) * 100 : 0;
  const held = nowMs - pos.openedAt;

  // Liquidity pulled out from under us — get out at any price.
  if (pos.entryLiq > 400 && pos.lastLiq > 0 && pos.lastLiq < pos.entryLiq * 0.5) {
    return { action: "sell", pct: 100, reason: "rug", move };
  }
  // We lost the live feed for this coin and it's been a while — exit blind.
  if (pos.missed >= 2 && held > 18_000) {
    return { action: "sell", pct: 100, reason: "feed-lost", move };
  }
  // Hard stop.
  if (move <= -P.sl) {
    return { action: "sell", pct: 100, reason: "stop", move };
  }
  // First take-profit: bank 40%, let the rest ride as a moon bag.
  if (!pos.tp1Done && move >= P.tp1) {
    return { action: "sell", pct: 40, reason: "tp1", move };
  }
  // Second take-profit: close it.
  if (move >= P.tp2) {
    return { action: "sell", pct: 100, reason: "tp2", move };
  }
  // Stale: held 3 min without hitting a target.
  if (held > 180_000) {
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
    tickMs = 2200,
    huntEvery = 3
  } = deps;

  let state = null;
  let timer = null;
  let inTick = false;
  const logRing = [];

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
    timer = setInterval(() => {
      void safeTick();
    }, tickMs);
    return status();
  }

  // Re-attach to a persisted session after a restart/redeploy. Positions keep
  // being managed; hunting resumes only if still inside the timer window.
  async function resume(snap) {
    if (!snap || snap.stopped) return false;
    if (now() >= snap.endAt && snap.open.length === 0) return false;
    state = snap;
    record("info", `Autopilot RESUME ${state.live ? "LIVE" : "PAPER"} · ${state.open.length} open · bank ${state.bank.toFixed(4)} SOL`);
    timer = setInterval(() => {
      void safeTick();
    }, tickMs);
    return true;
  }

  async function stop(reason = "manual") {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    if (state && !state.stopped) {
      state.stopped = true;
      state.stopReason = reason;
      record("info", `Autopilot STOP (${reason})`);
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

  async function safeTick() {
    if (inTick) return; // never overlap; real fills can take a few seconds
    inTick = true;
    try {
      await tick();
    } catch (e) {
      record("error", `tick error: ${e && e.message}`);
    } finally {
      inTick = false;
    }
  }

  async function tick() {
    if (!running()) return;
    state.tickN += 1;

    // External emergency stop respected.
    if (await isPaused()) {
      await flatten("emergency-stop");
      await stop("emergency-stop");
      return;
    }

    // Timer expired: stop hunting, flatten, end.
    if (now() >= state.endAt) {
      await flatten("timer");
      await stop("timer");
      return;
    }

    // Loss cap: protect the dedicated bankroll.
    if (equity(state) <= state.start * 0.7) {
      record("warn", `Loss cap hit at equity ${round(equity(state))} SOL — flattening.`);
      await flatten("loss-cap");
      await stop("loss-cap");
      return;
    }

    // Manage every open position every tick (fast exits).
    await manageExits();

    // Hunt for new entries every Nth tick.
    if (state.tickN % huntEvery === 0) {
      await hunt();
    }

    const eq = equity(state);
    if (eq > state.peak) state.peak = eq;
    await savePoint();
  }

  async function manageExits() {
    const P = aggParams(state);
    for (const pos of [...state.open]) {
      let lite = null;
      try {
        lite = await getPairLite(pos.mint);
      } catch {
        lite = null;
      }
      if (lite && Number(lite.marketCap) > 0) {
        pos.lastMc = Number(lite.marketCap);
        if (Number(lite.liquidityUsd) > 0) pos.lastLiq = Number(lite.liquidityUsd);
        pos.missed = 0;
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
    let ok = true;
    if (state.live) {
      try {
        const res = await sellPercent(pos.mint, pct, pos);
        ok = res && res.ok !== false;
      } catch (e) {
        ok = false;
        pos.sellFails = (pos.sellFails || 0) + 1;
        record("warn", `sell ${pos.sym} failed (${reason}): ${e && e.message}`);
        // Give up after repeated failures so a stuck token can't wedge the loop.
        if (pos.sellFails < 4) return;
        ok = false;
      }
    }

    // Synthetic ledger update (drives sizing; real wallet is source of truth).
    const proceeds = pos.costSol * portionOfOriginal * (1 + move / 100) * SELL_FEE_FACTOR;
    state.bank += proceeds;
    pos.realized = (pos.realized || 0) + proceeds;

    if (pct >= 100 || frac >= 1) {
      // Closing the position.
      pos.remFrac = 0;
      finalizePosition(pos, reason);
    } else {
      pos.remFrac = pos.remFrac * (1 - frac);
      if (reason === "tp1") pos.tp1Done = true;
      record("info", `🟡 ${pos.sym} ${reason.toUpperCase()} sold ${pct}% @ ${round(move, 1)}%`);
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
      realized: 0,
      fs: round(fs, 1)
    };
    state.open.push(pos);
    record("info", `🟢 APED ${sym} ${round(sizeSol, 4)} SOL @ MC $${Math.round(entryMc)} (fs ${pos.fs})`);
  }

  return { start, stop, resume, status, snapshot, _tick: safeTick, _state: () => state };
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
