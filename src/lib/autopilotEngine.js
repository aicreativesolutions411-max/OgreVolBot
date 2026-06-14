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
  const baseFrac = mode === "degen" ? 0.10 : mode === "chill" ? 0.04 : 0.06;

  // Softer streak/regime scaling: a hot streak no longer balloons size right
  // into the next loss cluster (live data showed streak-pumped 0.11+ SOL bets
  // taking 4x-bigger rug/dump hits and erasing the peak). Shrink fast on losses.
  let streakMult = 1;
  if (state.streak >= 3) streakMult = 1.25;
  else if (state.streak >= 1) streakMult = 1.1;
  else if (state.streak <= -2) streakMult = 0.45;
  else if (state.streak <= -1) streakMult = 0.7;

  const regimeMult = regime === "HOT" ? 1.15 : regime === "COLD" ? 0.55 : 1;

  let tp1 = 25;
  let tp2 = 60;
  const sl = 6; // tighter stop — cut losers faster (was 8%)
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
  minScore += state.minScoreBonus || 0; // low-churn raises the bar
  // Runner-SAFE hard floor: log analysis showed the catastrophic instant-rugs
  // cluster at fs <= 56 (they only sneak in during HOT regimes where the bar
  // drops to ~50), while NO observed runner was below fs 58 — including the fs61
  // monsters (TOMMY +711%, normie +338%). So floor low-churn at 57: cuts the
  // garbage, keeps every winner.
  // Self-tuning: the auto-tuner raises the bar in cold/rug-heavy tape and lowers
  // it when runners are frequent.
  minScore += (state.tune && state.tune.scoreBonus) || 0;
  if (state.churn === "low") minScore = Math.max(minScore, 57);

  const mcFloor = 1800; // no MC filter — a low-MC runner (e.g. ZUL +56% @ $1973) stays in

  return { regime, wr, baseFrac, streakMult, regimeMult, tp1, tp2, sl, minScore, mcFloor };
}

// SELF-TUNING / market-regime brain: reads the recent runner & rug rate and sets
// a tape temperature that scales selectivity (scoreBonus) and bet size (sizeMult).
// Cold/rug-heavy -> pickier + smaller (sit back). Hot/runner-rich -> looser +
// bigger (press the edge). Throttled; needs a little history first.
export function autoTune(state, nowMs) {
  if (nowMs - (state.lastTuneAt || 0) < 30_000) return state.tune;
  state.lastTuneAt = nowMs;
  const peaks = (state.recentPeaks || []).slice(-20);
  const rugs = (state.recentRugs || []).slice(-20);
  if (peaks.length < 6) return state.tune;
  // "good" = a trade that actually moved (>=+40%); "big" = >=+100%. Using +40%
  // means a tape hitting +50-90% wins is recognized as warm (it wasn't before,
  // which starved the wins by keeping size tiny).
  const goodRate = peaks.filter((p) => p >= 40).length / peaks.length;
  const bigRate = peaks.filter((p) => p >= 100).length / peaks.length;
  const rugRate = rugs.length ? rugs.filter(Boolean).length / rugs.length : 0;
  if (rugRate > 0.45 && goodRate < 0.12) {
    state.tune = { scoreBonus: 6, sizeMult: 0.7, tape: "COLD" };        // genuinely dead — pull back
  } else if (goodRate >= 0.3 || bigRate >= 0.15) {
    state.tune = { scoreBonus: -2, sizeMult: 1.3, tape: "HOT" };        // tape producing wins — press
  } else {
    state.tune = { scoreBonus: 0, sizeMult: 1, tape: "NORMAL" };
  }
  return state.tune;
}

// Position size in SOL: base fraction of cash, scaled by streak + regime,
// clamped so a single trade is never trivially small nor a huge slug of bank.
export function sizeFor(state, P) {
  const cash = state.bank;
  // Low-churn sizes up (fewer, higher-conviction bets); normal stays modest.
  const fracCap = state.sizeFracCap || 0.12;
  const baseFrac = state.churn === "low" ? Math.max(P.baseFrac, 0.12) : P.baseFrac;
  const tapeMult = (state.tune && state.tune.sizeMult) || 1; // self-tuner: press in hot tape, shrink in cold
  const raw = cash * baseFrac * P.streakMult * P.regimeMult * tapeMult;
  const min = state.minTradeSol;
  // Cap any single bet at fracCap of cash AND the per-trade ceiling — one
  // instant-dump can't be allowed to erase several wins.
  const max = Math.max(min, Math.min(cash * fracCap, state.maxTradeSol || 0.06));
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

// CONVICTION: how hard to bet a setup (0.5x..1.6x of base size). Trades like a
// pro — size scales with confluence: proven dev + heavy buy flow + freshness +
// strong score → bigger; marginal/risky → smaller. Bounded; final size still
// clamped to the per-trade ceiling by the caller.
export function convictionMult(row, rep) {
  let c = 1.0;
  if (rep) {
    if (rep.runners >= 2 && rep.rugs === 0) c += 0.4;        // proven runner-dev
    else if (rep.runners >= 1 && rep.rugs === 0) c += 0.2;   // promising
    else if (rep.rugs >= 1 && rep.runners === 0) c -= 0.3;   // rug-leaning
  }
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;
  const vol = Number(row.volume5m) || 0;
  const flow = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  if (flow >= 0.8 && vol >= 60) c += 0.2;                    // strong, well-funded buy flow
  else if (flow <= 0.45) c -= 0.15;                          // sellers leading
  const age = Number(row.pairAgeSeconds) || 9999;
  if (age <= 60) c += 0.15;                                  // very fresh = best entries
  if (freshScore(row) >= 70) c += 0.15;                      // top-tier setup
  return Math.max(0.5, Math.min(1.6, c));
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
  if (!Number.isFinite(mc) || mc < (P.mcFloor || 1800) || mc > 20000) return "mc";
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

  // ADAPTIVE dev-style take: if this dev's coins historically top around X%, bank
  // the whole position as it nears ~60% of that level — don't hold a +200%-style
  // dev's coin hoping for +500. Scales per dev: avg 200 -> take ~120; avg 800 ->
  // ride to ~480. (Only once the dev has enough history; null = use the ladder.)
  if (pos.devAvgPeak && pos.devAvgPeak >= 80 && move >= 40 && move >= pos.devAvgPeak * 0.6) {
    return { action: "sell", pct: 100, reason: "dev-avg-take", move };
  }

  // Liquidity pulled out from under us — get out at any price. Fire EARLIER
  // (40% liquidity drop, not 50%) to cut the big full-position rug losses.
  if (pos.entryLiq > 400 && pos.lastLiq > 0 && pos.lastLiq < pos.entryLiq * 0.6) {
    return { action: "sell", pct: 100, reason: "rug", move };
  }
  // We lost the live feed for this coin and it's been a while — exit blind.
  if (pos.missed >= 2 && held > 18_000) {
    return { action: "sell", pct: 100, reason: "feed-lost", move };
  }
  // Trailing give-back once in profit — protects the moon bag at ANY peak (a
  // position that took TP1 then fades must NOT be allowed to ride into a loss;
  // that was the gap that let a +26% TP1 coin bleed to -13%). Tighter the higher
  // it ran: give back ~28% from a huge peak, ~38% medium, 50% otherwise.
  if (pos.tp1Done && peak >= 25) {
    // Tighter the higher it ran — lock more of a big runner (5x+ gives back only ~18%).
    const keep = peak >= 500 ? 0.82 : peak >= 300 ? 0.74 : peak >= 150 ? 0.62 : 0.5;
    if (move <= peak * keep) {
      return { action: "sell", pct: 100, reason: "trail", move };
    }
  }
  // Hard stop — ALWAYS a backstop (including the moon bag after TP1), so nothing
  // can ride past -sl unprotected.
  if (move <= -P.sl) {
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
  // LOW-CHURN: be patient — far fewer, higher-conviction shots, each sized to
  // actually win big (concentrate capital instead of diluting into a swarm of
  // tiny bets). This is the "win big and often, not every second" profile.
  const lowChurn = opts.churn === "low";
  const budget = opts.solBudget || 0;
  return {
    mode: opts.mode || "normal",
    churn: lowChurn ? "low" : "normal",
    live: Boolean(opts.live),
    walletPubkey: opts.walletPubkey || null,
    start: opts.solBudget,
    bank: opts.solBudget,
    peak: opts.solBudget,
    walletSol: null,
    minTradeSol: opts.minTradeSol || 0.012,
    // Per-trade HARD ceiling — caps risk per bet so a rug can't gut the wallet.
    // User-set value wins; otherwise a conservative budget-scaled default (low
    // enough that even a big "whole wallet" can't auto-size into 0.3 SOL bets).
    maxTradeSol: opts.maxTradeSol || Math.max(0.05, budget * (lowChurn ? 0.06 : 0.04)),
    // Fraction-of-cash cap per bet (low-churn concentrates capital).
    sizeFracCap: lowChurn ? 0.28 : 0.12,
    // Entry-quality bump: low-churn takes stronger setups (no hard filter — keeps runners).
    minScoreBonus: lowChurn ? 16 : 0,
    // Few concurrent positions so each runner is meaningful + dry powder stays free.
    maxOpen: opts.maxOpen || (lowChurn ? 3 : 8),
    // Optional session profit-lock: once up >= minGainPct, stop + flatten if
    // equity gives back `giveback` fraction of the peak gain. null = off.
    profitLock: opts.profitLock || null,
    // Session loss cap: stop + flatten if working equity falls this far below the
    // stake. Default -20%; clamped 5%-50%.
    lossCapFrac: Math.max(0.05, Math.min(0.5, Number(opts.lossCapFrac) > 0 ? Number(opts.lossCapFrac) : 0.20)),
    // Recent big-win (>=5x) records for the panel's downloadable PnL cards.
    bigWins: [],
    // Optional PROFIT VAULT: sweep realized profit above the working stake to a
    // separate wallet, keep trading the stake (set-and-forget 12h protection).
    // { destination, minSweep } — null = off. secured = cumulative SOL vaulted.
    vault: opts.vault || null,
    secured: 0,
    // Wallet balance captured at session start — the vault only sweeps profit
    // ABOVE this, so it never touches funds you started with (set on first reconcile).
    vaultFloor: null,
    open: [],
    wins: 0,
    losses: 0,
    streak: 0,
    results: [],
    waves: {},
    recentSells: {},
    // Adaptive "tape" auto-tuner: reads recent runner/rug rate and nudges the
    // bar + bet size — press in hot tape, sit back in cold. (autoTune mutates it.)
    tune: { scoreBonus: 0, sizeMult: 1, tape: "warming" },
    recentPeaks: [],
    recentRugs: [],
    lastTuneAt: 0,
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
    getInstantMc = () => null,
    sweepProfit = async () => ({ ok: false }),
    onBigWin = () => {},
    getDevWallet = () => null,
    devReputation = () => null,
    recordTrade = () => {},
    exitMs = 1000,
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
    if (!state || state.stopped) return status();
    // 1) Flip the flag FIRST so any in-flight exit/hunt iteration bails out and
    //    stops opening new positions (openPosition/hunt check state.stopped).
    state.stopped = true;
    state.stopReason = reason;
    // 2) Wait for any in-flight loop iteration to finish so flatten has exclusive
    //    access to state.open (no concurrent splice/push corrupting it).
    for (let i = 0; i < 40 && (inExit || inHunt); i++) {
      await new Promise((r) => setTimeout(r, 50));
    }
    // 3) Flatten with retries — catches anything a finishing hunt slipped in.
    let tries = 0;
    while (state.open.length && tries < 8) {
      try {
        await flatten(reason);
      } catch (e) {
        record("warn", `flatten on stop failed: ${e && e.message}`);
      }
      tries += 1;
    }
    record("info", `Autopilot STOP (${reason}) — ${state.open.length === 0 ? "all positions flat" : `WARNING ${state.open.length} still open`}`);
    await savePoint();
    return status();
  }

  // Sell everything immediately (loss cap / timer / kill switch).
  async function flatten(reason) {
    for (const pos of [...state.open]) {
      await doSell(pos, 100, reason);
    }
  }

  // Latest in-memory price for a position (pump tick), falling back to the last
  // value the loop saw. Used so the displayed numbers are live on every poll,
  // not just as fresh as the last exit-loop pass.
  function liveMcFor(pos) {
    const m = Number(getInstantMc(pos.mint));
    return m > 0 ? m : pos.lastMc;
  }

  function status() {
    if (!state) return { running: false };
    const workingEquity = state.bank + state.open.reduce((a, p) => {
      const mv = p.entryMc > 0 ? liveMcFor(p) / p.entryMc : 1;
      return a + p.costSol * p.remFrac * mv;
    }, 0);
    // Total includes profit already swept to the vault (safe SOL).
    const totalEquity = workingEquity + (state.secured || 0);
    return {
      running: running(),
      live: state.live,
      mode: state.mode,
      churn: state.churn,
      maxOpen: state.maxOpen,
      tape: state.tune ? state.tune.tape : null,
      betMult: state.tune ? state.tune.sizeMult : 1,
      wallet: state.walletPubkey,
      start: state.start,
      bank: round(state.bank),
      walletSol: state.walletSol == null ? null : round(state.walletSol),
      secured: round(state.secured || 0),
      vault: state.vault ? state.vault.destination : null,
      equity: round(totalEquity),
      peak: round(state.peak),
      pnlPct: round(((totalEquity / state.start) - 1) * 100, 2),
      wins: state.wins,
      losses: state.losses,
      streak: state.streak,
      open: state.open.map((p) => ({
        sym: p.sym,
        mint: p.mint,
        costSol: round(p.costSol),
        remFrac: p.remFrac,
        movePct: round(p.entryMc > 0 ? (liveMcFor(p) / p.entryMc - 1) * 100 : 0, 2),
        heldS: Math.round((now() - p.openedAt) / 1000)
      })),
      tradeNo: state.tradeNo,
      bigWins: (state.bigWins || []).slice(-12).reverse(),
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

      if (equity(state) <= state.start * (1 - state.lossCapFrac)) {
        record("warn", `Loss cap hit (-${Math.round(state.lossCapFrac * 100)}%) at equity ${round(equity(state))} SOL — flattening.`);
        await stop("loss-cap");
        return;
      }

      await manageExits();
      const eq = equity(state);
      if (eq > state.peak) state.peak = eq;

      // Session profit-lock: once we've made real money, don't let a green peak
      // bleed back. Stop + flatten if equity gives back `giveback` of the gain.
      // Ignored when the profit VAULT is active — the vault sweeps profit out
      // (which lowers working equity), which would otherwise look like a giveback
      // and end the session. Vault + profit-lock are mutually exclusive by design.
      if (state.profitLock && !state.vault && state.peak > state.start) {
        const gain = state.peak - state.start;
        const minGain = state.start * ((state.profitLock.minGainPct || 5) / 100);
        const giveback = state.profitLock.giveback || 0.5;
        if (gain >= minGain && eq <= state.peak - gain * giveback) {
          record("info", `🔒 Profit-lock: peak +${round((state.peak / state.start - 1) * 100, 1)}%, gave back ${Math.round(giveback * 100)}% of gains → locking +${round((eq / state.start - 1) * 100, 1)}%`);
          await stop("profit-lock");
          return;
        }
      }
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
          if (Number.isFinite(ws) && ws >= 0) {
            state.walletSol = ws;
            state.bank = ws;
            // Capture the starting wallet balance once — the vault floor.
            if (state.vaultFloor == null) state.vaultFloor = ws;
          }
        } catch {}
      }

      // PROFIT VAULT: any free SOL above the working stake is realized profit —
      // sweep it to the vault wallet and keep trading the stake. Gains physically
      // leave the trading wallet, so a cold streak can never claw them back.
      if (state.vault && state.vault.destination && state.live && Number.isFinite(state.walletSol)) {
        // Keep the FULL balance you started the session with — only profit above
        // it is swept. (Previously kept only the stake `start`, which on a wallet
        // bigger than the stake swept your existing balance to the vault.)
        const keep = Math.max(state.start, state.vaultFloor || 0);
        const buffer = 0.02;               // leave a little for trade fees
        const minSweep = state.vault.minSweep || 0.05;
        const excess = state.walletSol - keep - buffer;
        if (excess >= minSweep) {
          try {
            const res = await sweepProfit(state.vault.destination, excess);
            if (res && res.ok) {
              const sent = Number(res.sentSol) || excess;
              state.secured = (state.secured || 0) + sent;
              record("info", `🏦 Vault: secured +${round(sent, 4)} SOL (total ${round(state.secured, 4)} SOL safe)`);
              try {
                const ws2 = await getWalletSol();
                if (Number.isFinite(ws2) && ws2 >= 0) { state.walletSol = ws2; state.bank = ws2; }
              } catch {}
            } else {
              record("warn", `vault sweep skipped: ${(res && res.error) || "send failed"}`);
            }
          } catch (e) {
            record("warn", `vault sweep error: ${e && e.message}`);
          }
        }
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
        const ageMs = now() - pos.openedAt;
        // Throttle the log — only the first failure (don't spam every tick).
        if (pos.sellFails === 1) record("warn", `sell ${pos.sym} failing (${reason}): ${e && e.message}`);
        // "no token balance" on a fresh position is usually the BUY still settling
        // on-chain — retry until it's readable. But cap the wait at 10s (settles in
        // <5s normally); past that the buy never delivered tokens, so write it off
        // and free the slot instead of hogging it (low-churn only has 3 slots).
        if (noBalance && ageMs < 10_000) return;        // young: buy still settling, retry
        if (!noBalance && pos.sellFails < 5) return;    // other transient errors: a few retries
        failedTerminal = true;                          // persistent / no-tokens → write off
      }
    }

    // Credit estimated proceeds for a real/paper fill only. A terminal live
    // failure books zero so the synthetic bank can't drift above the real wallet
    // (the wallet balance reconciliation is the true source of truth either way).
    const proceeds = failedTerminal ? 0 : pos.costSol * portionOfOriginal * (1 + move / 100) * SELL_FEE_FACTOR;
    state.bank += proceeds;
    pos.realized = (pos.realized || 0) + proceeds;

    // Count a WIN the moment booked proceeds pass the entry cost — i.e. you've
    // pulled out more SOL than you put in (locked profit, can't reverse). This
    // is counted once, even while a moon bag keeps riding.
    if (!pos.countedWin && pos.realized > pos.costSol) {
      markWin(pos);
      record("info", `✅ ${pos.sym} IN PROFIT — recovered entry +${round(pos.realized - pos.costSol, 4)} SOL (moon bag still riding)`);
    }

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

  function markWin(pos) {
    if (pos.countedWin) return;
    pos.countedWin = true;
    state.wins += 1;
    state.results.push("W");
    state.streak = state.streak >= 0 ? state.streak + 1 : 1;
    if (state.results.length > 40) state.results.shift();
  }
  function markLoss(pos) {
    state.losses += 1;
    state.results.push("L");
    state.streak = state.streak <= 0 ? state.streak - 1 : -1;
    if (state.results.length > 40) state.results.shift();
  }

  function finalizePosition(pos, reason) {
    const idx = state.open.indexOf(pos);
    if (idx >= 0) state.open.splice(idx, 1);
    const totalProceeds = pos.realized || 0;
    const win = pos.countedWin || totalProceeds > pos.costSol;
    // Win already counted at the moment proceeds passed cost; only a trade that
    // closes WITHOUT ever recovering its entry counts as a loss.
    if (win) {
      if (!pos.countedWin) markWin(pos);
    } else {
      markLoss(pos);
    }
    state.recentSells[pos.mint] = now();
    const pnl = totalProceeds - pos.costSol;
    // Feed the self-tuner: recent peaks + rug flags.
    state.recentPeaks.push(Math.round(pos.peakPct || 0));
    if (state.recentPeaks.length > 30) state.recentPeaks.shift();
    state.recentRugs.push(/rug/.test(reason) || pnl <= -pos.costSol * 0.5);
    if (state.recentRugs.length > 30) state.recentRugs.shift();
    record(win ? "info" : "warn", `${win ? "✅" : "🔴"} ${pos.sym} CLOSE ${reason} ${pnl >= 0 ? "+" : ""}${round(pnl, 4)} SOL`);

    // Learning flywheel: record this trade's features + outcome (live only).
    if (state.live) {
      const rugged = /rug/.test(reason) || pnl <= -pos.costSol * 0.5;
      try {
        recordTrade({
          mint: pos.mint, sym: pos.sym, dev: pos.dev || null,
          entryMc: Math.round(pos.entryMc), entryAge: pos.entryAge, entrySniper: pos.entrySniper,
          entryVol5m: pos.entryVol5m, entryBuys: pos.entryBuys, entrySells: pos.entrySells,
          fs: pos.fs, peakPct: Math.round(pos.peakPct || 0), pnl: round(pnl, 4),
          win, rugged, reason, mode: state.mode, churn: state.churn, at: now()
        });
      } catch {}
    }
    // Win card trigger: BIG wins only — peaked >= +300%.
    if (win && (pos.peakPct || 0) >= 300) {
      const winData = {
        symbol: pos.sym,
        mint: pos.mint,
        gainPct: Math.round(pos.peakPct),
        multiple: Math.round((1 + pos.peakPct / 100) * 10) / 10,
        entryMc: Math.round(pos.entryMc),
        peakMc: Math.round(pos.entryMc * (1 + pos.peakPct / 100)),
        profitSol: round(pnl, 4),
        // For the site-style PnL card (spent/received/held).
        costSol: round(pos.costSol, 6),
        receivedSol: round(totalProceeds, 6),
        openedAt: pos.openedAt,
        closedAt: now(),
        at: now()
      };
      state.bigWins.push(winData);
      if (state.bigWins.length > 12) state.bigWins.shift();
      if (state.live) { try { onBigWin(winData); } catch {} }
    }
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
    autoTune(state, now()); // adapt selectivity + size to the current tape
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
      if (state.stopped || now() >= state.endAt) break; // never open after a stop/timer
      // Dev-reputation skip: avoid wallets that have rugged us repeatedly with no
      // runner to show for it (the one rug signal you CAN read — the dev's history).
      const dev = getDevWallet(cand.r.tokenMint);
      const rep = dev ? devReputation(dev) : null;
      if (rep && rep.rugs >= 2 && rep.runners === 0) {
        record("info", `⛔ skip ${cand.r.symbol} — dev rugged ${rep.rugs}x before`);
        continue;
      }
      // Conviction sizing — bet bigger on high-confluence setups, smaller on
      // marginal ones (proven dev + buy flow + freshness + score). Still capped.
      const conv = convictionMult(cand.r, rep);
      let size = Math.max(state.minTradeSol, Math.min(sizeFor(state, P) * conv, state.maxTradeSol));
      if (!canOpen(state, size)) break;
      await openPosition(cand.r, size, cand.fs, dev, rep);
    }
  }

  async function openPosition(row, sizeSol, fs, dev, rep) {
    if (!state || state.stopped) return; // never open once stopped
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
      // If a Stop landed while this buy was in flight, sell it straight back so
      // we never leave an untracked position open after Stop.
      if (state.stopped) {
        try { await sellPercent(mint, 100, { mint, tokenAmount }); } catch {}
        record("warn", `bought ${sym} during stop — sold back`);
        return;
      }
    } else if (state.stopped) {
      return;
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
      fs: round(fs, 1),
      // Features captured for the learning flywheel.
      dev: dev || null,
      // This dev's historical avg peak (>=3 trades) drives the adaptive exit.
      devAvgPeak: (rep && rep.trades >= 3 && rep.avgPeak >= 80) ? rep.avgPeak : null,
      entryAge: Number(row.pairAgeSeconds) || null,
      entrySniper: Number(row.sniperCount) || 0,
      entryVol5m: Number(row.volume5m) || 0,
      entryBuys: Number(row.buys5m) || 0,
      entrySells: Number(row.sells5m) || 0
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
