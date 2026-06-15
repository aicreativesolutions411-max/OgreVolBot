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

// Normalized coin name for clone detection. Pump.fun lets anyone mint a coin with
// the same name, so when one pops a swarm of same-name clones floods the feed and
// dumps. Keyed loss memory by normalized name lets us stop re-aping the clones.
export function normSym(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

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
  // UNIVERSAL runner-safe floor: no observed runner was below fs 58 and instant-rugs
  // cluster at fs<=56. This was only enforced for low-churn before, so normal mode
  // could ape fs 34-57 garbage whenever the regime bar dropped (HOT). Floor everyone.
  minScore = Math.max(minScore, state.churn === "low" ? 60 : 58);
  // COLD / bleeding / cold-market tape: demand genuinely strong setups (fs ~66+)
  // regardless of regime base — this is what actually stops the fs 61-63 chop churn
  // that bleeds a directionless tape. (scoreBonus alone couldn't reach this.)
  if (state.tune && state.tune.tape === "COLD") minScore = Math.max(minScore, 62);

  const mcFloor = 1800; // no MC filter — a low-MC runner (e.g. ZUL +56% @ $1973) stays in

  // BANK STYLE — three exit personalities:
  //  • "steady": lock the bulk at the first DOABLE pop (80%) + free-roll 20% to +400%,
  //    skipping mid rungs. Grabs the realizable value; cheap lottery ticket on top.
  //  • "blend": the "4 wallets in one" profile — sell in ~25% tranches as it climbs
  //    (first pop / +100% / +200%) and ride the last ~25% to +400%, so it banks what
  //    it "sees risked" while a tail still rides. A trail protects the whole remainder.
  //  • default ("normal"/etc): bank 55% (spike 75%) and ladder to ~+500%.
  const steady = mode === "steady";
  const blend = mode === "blend";
  let tp1Pct = 55, spikePct = 75, moonTarget = 500, tp2Lvl = tp2, tp2Pct = 50, tp3Lvl = 200, tp3Pct = 50;
  if (steady) {
    tp1Pct = 80; spikePct = 85; moonTarget = 400;
  } else if (blend) {
    // sell 25% of the ORIGINAL at each rung: 25% @ first pop, then 33% of the 75%
    // remainder @ +100%, then 50% of the 50% remainder @ +200%, ride the last 25%.
    tp1Pct = 25; spikePct = 50; tp2Lvl = 100; tp2Pct = 33; tp3Lvl = 200; tp3Pct = 50; moonTarget = 400;
  }

  return { regime, wr, baseFrac, streakMult, regimeMult, tp1, tp2, sl, minScore, mcFloor, steady, blend, tp1Pct, spikePct, moonTarget, tp2Lvl, tp2Pct, tp3Lvl, tp3Pct };
}

// SELF-TUNING / market-regime brain: reads the recent runner & rug rate and sets
// a tape temperature that scales selectivity (scoreBonus) and bet size (sizeMult).
// Cold/rug-heavy -> pickier + smaller (sit back). Hot/runner-rich -> looser +
// bigger (press the edge). Throttled; needs a little history first.
export function autoTune(state, nowMs, marketTape = null) {
  if (nowMs - (state.lastTuneAt || 0) < 30_000) return state.tune;
  state.lastTuneAt = nowMs;
  const peaks = (state.recentPeaks || []).slice(-20);
  const rugs = (state.recentRugs || []).slice(-20);
  // MARKET-WIDE TAPE: the heat of the WHOLE observed market (thousands of launches),
  // not just our own trades. This is what lets the engine "think like it's always
  // watching" — it can go cold the instant the broad market dumps, and press when
  // the whole market is running, even before our own sample is big enough to know.
  const mkt = marketTape && marketTape.sample >= 12 ? marketTape : null;
  const havePeaks = peaks.length >= 6;
  // Nothing to learn from yet (no own history AND no market read) — stay warming.
  if (!havePeaks && !mkt) return state.tune;
  // "good" = a trade that actually moved (>=+40%); "big" = >=+100%. Using +40%
  // means a tape hitting +50-90% wins is recognized as warm.
  const goodRate = havePeaks ? peaks.filter((p) => p >= 40).length / peaks.length : 0;
  const bigRate = havePeaks ? peaks.filter((p) => p >= 100).length / peaks.length : 0;
  const rugRate = havePeaks && rugs.length ? rugs.filter(Boolean).length / rugs.length : 0;
  // REALIZED win-rate over recent CLOSED trades (W/L) — catches a flat/chop tape that
  // isn't rug-heavy on peaks but keeps handing us small net losses.
  const res = (state.results || []).slice(-15);
  const realizedWinRate = res.length >= 8 ? res.filter((r) => r === "W").length / res.length : null;
  // Net realized PnL over recent closed trades — catches the "40% win-rate but still
  // net RED" case (lots of tiny wins, a few bigger losses + fees) that a win-rate gate
  // alone misses. If we're genuinely losing money over the last several trades, brake.
  const pnls = (state.recentPnl || []).slice(-12);
  const netRecent = pnls.reduce((a, b) => a + b, 0);
  const realizedBleed = (realizedWinRate !== null && realizedWinRate < 0.30) || (pnls.length >= 8 && netRecent < 0);
  // PROTECT A GREEN SESSION: once up meaningfully, tighten so we don't churn hard-won
  // gains back into a softening tape (works with the bank-the-peak ratchet).
  const sessGain = state.start > 0 ? equity(state) / state.start - 1 : 0;
  const green = sessGain >= 0.15;

  const mktCold = mkt && mkt.heat === "COLD";
  const mktHot = mkt && mkt.heat === "HOT";
  const ownCold = havePeaks && rugRate > 0.45 && goodRate < 0.12;
  const ownHot = havePeaks && (goodRate >= 0.3 || bigRate >= 0.15);

  // COLD wins ties — protecting capital beats chasing. The market going cold, our own
  // trades going cold, OR our realized results bleeding all slam the brakes: widen the
  // gap between entries, cap concurrent bags, shrink size. This is what stops a dead
  // tape from draining the wallet via churn.
  if (ownCold || realizedBleed || mktCold) {
    // COLD: only take genuinely strong setups. scoreBonus +20 lifts the entry bar to
    // ~fs 60-68 (vs the base ~40-48) so the fs 61-63 churn that bleeds a chop tape gets
    // skipped while the fs 67+ runners still pass. Plus widen entry gap + cap bags.
    state.tune = { scoreBonus: 20, sizeMult: 0.7, tape: "COLD", maxOpenCap: 2, entryGapMs: 15000, perCycle: 1 };
  } else if ((ownHot || mktHot) && !realizedBleed) {
    // Hot — press harder (bigger size, more concurrent, no gap). If already well up,
    // ease off so the session banks green instead of round-tripping it.
    state.tune = { scoreBonus: green ? 2 : -2, sizeMult: green ? 1.0 : 1.35, tape: "HOT", maxOpenCap: green ? 3 : null, entryGapMs: 0, perCycle: green ? 3 : 4 };
  } else {
    // Normal — more selective than before so marginal setups in a directionless tape
    // don't nickel-and-dime the bankroll; tighten harder once green to defend gains.
    state.tune = { scoreBonus: green ? 12 : 6, sizeMult: green ? 0.85 : 1, tape: "NORMAL", maxOpenCap: green ? 3 : null, entryGapMs: green ? 4000 : 0, perCycle: green ? 2 : 3 };
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
export function convictionMult(row, rep, sm) {
  let c = 1.0;
  if (rep) {
    if (rep.runners >= 2 && rep.rugs === 0) c += 0.4;        // proven runner-dev
    else if (rep.runners >= 1 && rep.rugs === 0) c += 0.2;   // promising
    else if (rep.rugs >= 1 && rep.runners === 0) c -= 0.3;   // rug-leaning
  }
  // SMART MONEY: proven-winner wallets or tracked KOLs already aping this coin.
  // Bonus signal only — boosts conviction, never gates entry. Bonded, never huge.
  if (sm) {
    if (sm.kol) c += 0.3;                                    // a tracked KOL is in early buyers
    if (sm.winners >= 2) c += 0.3;                           // multiple proven winners aping
    else if (sm.winners >= 1) c += 0.2;                      // one proven winner aping
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
  // CRITICAL: freshness/score do NOT predict instant-rugs. Only let conviction size
  // ABOVE base for a dev with a PROVEN runner history (and no rugs). Unknown/unproven
  // coins are capped at 1.0x so one instant-rug can't blow a big bet (the log showed
  // 0.045 SOL = 18% bets on fresh coins gapping -37% past the stop).
  // Allow sizing ABOVE base for a proven runner-dev OR a strong smart-money read
  // (a tracked KOL, or multiple proven-winner wallets in the early buyers). Lone
  // unproven coins stay capped at 1.0x so one instant-rug can't blow a big bet.
  const proven = (rep && rep.runners >= 1 && rep.rugs === 0) || (sm && (sm.kol || sm.winners >= 2));
  return Math.max(0.5, Math.min(proven ? 1.6 : 1.0, c));
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

  // Liquidity pulled out from under us — get out at any price. Fire FAST: a 30%
  // liquidity drop is already a rug in progress; dumping here (instead of waiting
  // for -40% or the price to fully crater) is what saves the most on rugs.
  if (pos.entryLiq > 400 && pos.lastLiq > 0 && pos.lastLiq < pos.entryLiq * 0.7) {
    return { action: "sell", pct: 100, reason: "rug", move };
  }
  // Feed dying + already underwater = almost always a rug killing the trades. Don't
  // wait the full blind-exit window — bail immediately to cap the loss.
  if (pos.missed >= 1 && move <= -4) {
    return { action: "sell", pct: 100, reason: "rug-feed", move };
  }
  // We lost the live feed for this coin and it's been a bit — exit blind (faster now).
  if (pos.missed >= 2 && held > 8_000) {
    return { action: "sell", pct: 100, reason: "feed-lost", move };
  }
  // Trailing give-back once in profit — protects the moon bag at ANY peak (a
  // position that took TP1 then fades must NOT be allowed to ride into a loss;
  // that was the gap that let a +26% TP1 coin bleed to -13%). Tighter the higher
  // it ran: give back ~28% from a huge peak, ~38% medium, 50% otherwise.
  if (pos.tp1Done && peak >= 25) {
    // Tighter than before — honest fills showed moon bags fading far below their marked
    // peak before the old looser trail fired, so bank the remainder closer to the top.
    const keep = peak >= 500 ? 0.85 : peak >= 300 ? 0.8 : peak >= 150 ? 0.72 : 0.55;
    if (move <= peak * keep) {
      return { action: "sell", pct: 100, reason: "trail", move };
    }
  }
  // Hard stop — ALWAYS a backstop (including the moon bag after TP1), so nothing
  // can ride past -sl unprotected.
  if (move <= -P.sl) {
    return { action: "sell", pct: 100, reason: "stop", move };
  }
  // FAST-SPIKE CAPTURE: a coin already +150%+ is a fast pump that fades fast and fills
  // below the marked price on a thin curve — bank the BULK now near the spike instead
  // of laddering into a fading price. Honest fills showed a +358%-marked runner only
  // netted ~+74% riding the slow ladder; grab it. Keep a small runner for the monster.
  if (!pos.tp1Done && move >= 150) {
    return { action: "sell", pct: P.spikePct || 75, reason: "spike", move };
  }
  // TP1: bank the first DOABLE pop. steady mode banks 80% here (locks the realizable
  // win); default banks 55%.
  if (!pos.tp1Done && move >= P.tp1) {
    return { action: "sell", pct: P.tp1Pct || 55, reason: "tp1", move };
  }
  // Mid rungs only in the laddered styles (normal/blend). steady HOLDS the runner
  // after TP1 — no mid-rung selling — so its 20% can reach the moon target.
  if (!P.steady) {
    // TP2: next tranche (blend = ~33% of remainder @ +100%; normal = 50% @ P.tp2).
    if (pos.tp1Done && !pos.tp2Done && move >= (P.tp2Lvl || P.tp2)) {
      return { action: "sell", pct: P.tp2Pct || 50, reason: "tp2", move };
    }
    // TP3 (+200%): next tranche.
    if (pos.tp2Done && !pos.tp3Done && move >= (P.tp3Lvl || 200)) {
      return { action: "sell", pct: P.tp3Pct || 50, reason: "tp3", move };
    }
  }
  // Moon target: close the runner out (+400% steady/blend, +500% normal).
  if ((pos.tp3Done || P.steady) && move >= (P.moonTarget || 500)) {
    return { action: "sell", pct: 100, reason: "tp4", move };
  }
  // Moon-bag TIME CAP: once the bulk is banked (tp1Done), don't let a small remnant
  // hog a maxOpen slot for minutes waiting for a moon that isn't coming. Cash it and
  // free the slot so the bot keeps hunting. This is the fix for "stuck — no buys for
  // minutes": a couple of riding bags (e.g. one sitting at +210% between the trail and
  // the moon target) used to fill every slot and freeze new entries indefinitely.
  if (pos.tp1Done && held > 4 * 60_000) {
    return { action: "sell", pct: 100, reason: "moonbag-timeout", move };
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
    // Total-equity peak (working + already-vaulted) for the always-on bank-the-peak
    // ratchet, so sweeping profit to the vault never looks like a giveback.
    peakTotal: opts.solBudget,
    lastOpenAt: 0,
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
    // Concurrent-position cap. Lowered the normal default 8 -> 5 so a session that
    // doesn't pass maxOpen can't over-deploy the whole bankroll into one dumping
    // wave (the "losing fast" pattern). The panel sends an explicit value (default 3).
    maxOpen: opts.maxOpen || (lowChurn ? 3 : 5),
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
    // Per-coin loss memory: stop re-aping a coin that keeps stopping us out this
    // session (the log showed one coin entered 6x, almost all losses).
    coinLosses: {},
    // Per-NAME loss memory: clones of a hot name flood the feed and dump. After a
    // name loses, cool off / cap re-entries on that name (different mints, same name).
    symLosses: {},
    // Adaptive "tape" auto-tuner: reads recent runner/rug rate and nudges the
    // bar + bet size — press in hot tape, sit back in cold. (autoTune mutates it.)
    // Warming = no tape data yet (and where restarted sessions live). Start SMALL and
    // open at most 2 per cycle so an instant-rug wave can't gut the bankroll before
    // the brain has any read. Sizing opens up once the tape proves itself (autoTune).
    tune: { scoreBonus: 0, sizeMult: 0.6, tape: "warming", maxOpenCap: null, entryGapMs: 0, perCycle: 2 },
    recentPeaks: [],
    recentRugs: [],
    recentPnl: [],
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
    smartMoney = () => null,
    smartMoneyReady = () => false,
    smartMoneyFeed = async () => [],
    getMarketTape = () => null,
    recordTrade = () => {},
    exitMs = 1000,
    huntMs = 5000
  } = deps;

  let state = null;
  let exitTimer = null;
  let huntTimer = null;
  let inExit = false;
  let inHunt = false;
  let huntStartedAt = 0;   // watchdog: when the current hunt cycle began
  let exitStartedAt = 0;   // watchdog: when the current exit cycle began
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
    // Watchdog (see safeHunt): never let one hung cycle permanently stop exit management.
    if (inExit && now() - exitStartedAt < 30_000) return;
    inExit = true;
    exitStartedAt = now();
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

      // BANK-THE-PEAK RATCHET (always on, no toggle): the #1 fix for "up +12%/+20%
      // then bled to the -20% cap". Track the TOTAL-equity peak (working + already
      // vaulted, so vault sweeps don't look like a giveback). Once the session has
      // peaked >= +8%, never let it give back more than HALF that gain — flatten and
      // bank the green. (e.g. peak +20% -> locks ~+10% instead of bleeding to -20%.)
      const totalEq = eq + (state.secured || 0);
      if (totalEq > (state.peakTotal || state.start)) state.peakTotal = totalEq;
      {
        const peakGain = (state.peakTotal || state.start) - state.start;
        if (peakGain >= state.start * 0.08) {
          const floor = state.start + peakGain * 0.5; // give back at most half the gain
          // LOCK & CONTINUE (only when genuinely GREEN): instead of ending the run,
          // sweep the locked profit to the safe/bank wallet and KEEP TRADING the stake,
          // then re-anchor the peak so the ratchet arms fresh. A peak can also be an
          // UNREALIZED spike that reverts before the sell fills — if the giveback lands
          // below +3% we never treat it as a lock (the loss cap guards real downside).
          if (totalEq <= floor && totalEq >= state.start * 1.03) {
            const peakPctLog = round((state.peakTotal / state.start - 1) * 100, 1);
            const dest = state.vault && state.vault.destination;
            let banked = 0;
            if (dest && state.live) {
              try {
                const free = (Number(state.walletSol) || state.bank) - state.start - 0.02; // profit above the stake
                if (free >= 0.01) {
                  const res = await sweepProfit(dest, free);
                  if (res && res.ok) {
                    banked = Number(res.sentSol) || free;
                    state.secured = (state.secured || 0) + banked;
                    try { const ws2 = await getWalletSol(); if (Number.isFinite(ws2) && ws2 >= 0) { state.walletSol = ws2; state.bank = ws2; } } catch {}
                  }
                }
              } catch (e) { record("warn", `lock sweep failed: ${e && e.message}`); }
            }
            // Re-anchor the peak to the current total so the ratchet disarms and re-arms
            // on the NEXT green run instead of stopping. Session keeps going.
            state.peakTotal = equity(state) + (state.secured || 0);
            state.peak = equity(state);
            if (banked > 0) record("info", `🏦 Banked +${round(banked, 4)} SOL to safe wallet at peak +${peakPctLog}% — still running (${round(state.secured, 4)} SOL secured).`);
            else record("info", `🔒 Locked peak +${peakPctLog}% — re-anchored, still running${dest ? "" : " (set a safe wallet to auto-send profit out)"}.`);
            return;
          }
          // Peak was unrealized and round-tripped to ~flat/red — don't end the session
          // on it. Re-anchor the peak so we don't sit permanently armed off a phantom
          // spike; the loss cap still guards the downside.
          if (totalEq < state.start * 1.03 && state.peakTotal > state.start * 1.10) {
            state.peakTotal = Math.max(totalEq, state.start);
          }
        }
      }

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
    // WATCHDOG: if a prior cycle's await hung (a feed fetch / RPC / sweep that never
    // resolved), inHunt would stay true forever and freeze all new entries — looking
    // exactly like a stall (exits keep running, but nothing new is bought). After 90s
    // assume the previous cycle is dead and proceed, so a single hang can't permanently
    // brick the hunter.
    if (inHunt && now() - huntStartedAt < 90_000) return;
    inHunt = true;
    huntStartedAt = now();
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
    let realProceeds = null; // actual SOL the wallet received this sell (live only)
    if (state.live) {
      try {
        const res = await sellPercent(pos.mint, pct, pos);
        if (res && res.ok === false) throw new Error("sell rejected");
        if (res && Number.isFinite(res.receivedSol)) realProceeds = Number(res.receivedSol);
      } catch (e) {
        pos.sellFails = (pos.sellFails || 0) + 1;
        const noBalance = /no token balance|rounded to zero/i.test((e && e.message) || "");
        const ageMs = now() - pos.openedAt;
        // Throttle the log — only the first failure (don't spam every tick).
        if (pos.sellFails === 1) record("warn", `sell ${pos.sym} failing (${reason}): ${e && e.message}`);
        // "no token balance" on a fresh position is usually the BUY still settling /
        // the new token account not yet indexed by the RPC — NOT a real loss. Writing
        // it off at 10s was booking full-size losses (e.g. -0.03) on coins whose tokens
        // we actually hold, just hadn't indexed yet — one of those wipes ~6-8 small
        // wins. Give a fresh buy up to 30s to become readable before writing it off.
        // Distinguish a REAL holding from a PHANTOM (a buy that never delivered tokens
        // but whose marked price still moves). The only proof we actually hold tokens
        // is that a sell ALREADY returned SOL (realized>0) — the MARKED price (peakPct)
        // is NOT proof and must never protect a position, or a phantom that marks +115%
        // rides forever inflating equity and never sells (exactly the "deep" case).
        const reallyHeld = pos.countedWin || (pos.realized || 0) > 0;
        if (noBalance && reallyHeld) return;             // confirmed real holding, flaky read → retry indefinitely
        if (noBalance && ageMs < 30_000) return;         // fresh buy may still be settling → retry briefly
        if (!noBalance && pos.sellFails < 8) return;     // other transient errors: more retries before giving up
        failedTerminal = true;                           // 30s+ no balance & never returned SOL → phantom/failed buy → write off
      }
    }

    // Book the REAL SOL received when live (the actual fill), falling back to the
    // marked-price estimate only for paper or when the fill amount wasn't returned.
    // This is THE fix for "log shows +0.48 wins but the wallet is down": a moon bag
    // marked at +480% that really fills at +40% now books +40%, so win/loss counts,
    // the ledger, and the learning data all reflect what the wallet actually got.
    const estProceeds = pos.costSol * portionOfOriginal * (1 + move / 100) * SELL_FEE_FACTOR;
    const proceeds = failedTerminal ? 0 : (realProceeds != null ? realProceeds : estProceeds);
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
      else if (reason === "spike") { pos.tp1Done = true; pos.tp2Done = true; } // bulk banked; small runner trails
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
    // FAILED ENTRY: the buy never delivered readable tokens (e.g. tx didn't land), so
    // we never actually held a position. That's an execution failure, NOT a losing
    // trade — counting it as an L poisoned the W/L, the learning data, and the tape
    // gauge, and showed a scary full-size "loss" the wallet reconciliation undoes.
    // Free the slot, note it, and move on without booking it as a trade outcome.
    if (/-failed$/.test(reason || "") && !pos.countedWin && totalProceeds === 0) {
      state.recentSells[pos.mint] = now();
      record("warn", `⚠️ ${pos.sym} entry didn't fill (${reason}) — not a trade, freeing slot`);
      return;
    }
    const win = pos.countedWin || totalProceeds > pos.costSol;
    // Win already counted at the moment proceeds passed cost; only a trade that
    // closes WITHOUT ever recovering its entry counts as a loss.
    if (win) {
      if (!pos.countedWin) markWin(pos);
    } else {
      markLoss(pos);
      state.coinLosses[pos.mint] = (state.coinLosses[pos.mint] || 0) + 1; // remember repeat losers
      const ns = normSym(pos.sym);                                          // remember losing NAMES (clone swarms)
      if (ns) {
        const e = state.symLosses[ns] || { count: 0, at: 0 };
        e.count += 1; e.at = now();
        state.symLosses[ns] = e;
      }
    }
    state.recentSells[pos.mint] = now();
    const pnl = totalProceeds - pos.costSol;
    // Feed the self-tuner: recent peaks + rug flags.
    state.recentPeaks.push(Math.round(pos.peakPct || 0));
    if (state.recentPeaks.length > 30) state.recentPeaks.shift();
    state.recentRugs.push(/rug/.test(reason) || pnl <= -pos.costSol * 0.5);
    if (state.recentRugs.length > 30) state.recentRugs.shift();
    state.recentPnl = state.recentPnl || [];
    state.recentPnl.push(pnl); // realized net per closed trade -> feeds the net-PnL bleed brake
    if (state.recentPnl.length > 20) state.recentPnl.shift();
    record(win ? "info" : "warn", `${win ? "✅" : "🔴"} ${pos.sym} CLOSE ${reason} ${pnl >= 0 ? "+" : ""}${round(pnl, 4)} SOL`);

    // Learning flywheel: record EVERY trade's features + outcome — paper too. Paper
    // outcomes use real market data (a rug in paper is a real rug), so they're valid
    // signal: the brain now learns dev reputation + win/rug patterns from every paper
    // session you run, not just live money. This is the "data god" — always learning.
    {
      const rugged = /rug/.test(reason) || pnl <= -pos.costSol * 0.5;
      try {
        recordTrade({
          mint: pos.mint, sym: pos.sym, dev: pos.dev || null,
          entryMc: Math.round(pos.entryMc), entryAge: pos.entryAge, entrySniper: pos.entrySniper,
          entryVol5m: pos.entryVol5m, entryBuys: pos.entryBuys, entrySells: pos.entrySells,
          fs: pos.fs, peakPct: Math.round(pos.peakPct || 0), pnl: round(pnl, 4),
          win, rugged, reason, mode: state.mode, churn: state.churn, paper: !state.live, at: now()
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
    if (!Array.isArray(rows) || !rows.length) {
      if (now() - (state.lastScanLogAt || 0) > 45_000) {
        state.lastScanLogAt = now();
        record("info", "🔍 scanning — feed quiet (0 fresh pairs right now)");
      }
      return;
    }
    // Cache fresh prices from the feed so open positions update fast (used in manageExits).
    const t = now();
    for (const r of rows) {
      if (r && r.tokenMint) {
        const mc = Number(r.marketCap) || 0;
        if (mc > 0) lastFeed.set(r.tokenMint, { mc, liq: Number(r.liquidityUsd) || 0, at: t });
      }
    }
    autoTune(state, now(), getMarketTape ? getMarketTape() : null); // adapt to our tape + the whole-market tape
    const P = aggParams(state);
    const held = new Set(state.open.map((p) => p.mint));
    const nowMs = now();

    const scored = rows
      .filter((r) => r && r.tokenMint && !held.has(r.tokenMint))
      .filter((r) => (state.coinLosses[r.tokenMint] || 0) < 2)  // stop re-aping a repeat loser
      .filter((r) => {
        // Wave cooldown: allow re-entry on a coin we sold, but not within 45s.
        const last = state.recentSells[r.tokenMint];
        return !last || nowMs - last > 45_000;
      })
      .filter((r) => {
        // CLONE-SWARM guard: when a NAME just lost (different mint, same name flooding
        // the feed), stop aping its clones — cap at 2 same-name losses/session and a
        // 60s cooldown after any same-name loss. This kills the MistCoin/MIST x5 churn.
        const e = state.symLosses[normSym(r.symbol)];
        if (!e) return true;
        if (e.count >= 2) return false;
        return nowMs - (e.at || 0) > 60_000;
      })
      .map((r) => ({ r, reject: entryReject(r, P), fs: freshScore(r) }))
      .filter((x) => !x.reject)
      .sort((a, b) => b.fs - a.fs);

    // THROTTLE (built-in anti-churn): space out entries and cap how many ride at
    // once based on tape. Cold tape -> ~1 entry / 15s, max 2 open; normal -> 1 / 5s;
    // hot -> press (3 per cycle, no gap). This is what stops the 100+ fee-bleed
    // losses in a runnerless tape without raising the entry bar (runners stay in).
    const tune = state.tune || {};
    const gap = tune.entryGapMs || 0;
    if (gap > 0 && nowMs - (state.lastOpenAt || 0) < gap) return;
    const maxNow = Math.min(state.maxOpen, tune.maxOpenCap || state.maxOpen);
    const perCycle = Math.max(1, tune.perCycle || 1);
    let openedThisCycle = 0;

    for (const cand of scored) {
      if (state.stopped || now() >= state.endAt) break; // never open after a stop/timer
      if (state.open.length >= maxNow) break;            // tape-aware concurrent cap
      // Dev-reputation skip: avoid wallets that have rugged us repeatedly with no
      // runner to show for it (the one rug signal you CAN read — the dev's history).
      const dev = getDevWallet(cand.r.tokenMint);
      const rep = dev ? devReputation(dev) : null;
      if (rep && rep.rugs >= 2 && rep.runners === 0) {
        record("info", `⛔ skip ${cand.r.symbol} — dev rugged ${rep.rugs}x before`);
        continue;
      }
      // Smart-money read — proven-winner wallets / tracked KOLs in the early buyers.
      // Bonus signal: it only bumps conviction, it never gates entry (main scan rules).
      const sm = smartMoney ? smartMoney(cand.r.tokenMint) : null;
      // Conviction = confluence of proven-dev rep + buy flow + freshness + score + smart money.
      const conv = convictionMult(cand.r, rep, sm);
      if (sm) record("info", `🐳 smart money on ${cand.r.symbol} — ${sm.kol ? "KOL " : ""}${sm.winners || 0} winner-wallet(s) → conv ${conv.toFixed(2)}`);
      // ADAPTIVE QUALITY GATE (smarter picks): when the tape is risky, take ONLY the
      // highest-confluence setups; stay permissive when it's hot/warming so runners
      // aren't missed. This is what makes it "best picks per situation" instead of
      // aping everything into a dumping tape.
      const minConv = tune.tape === "COLD" ? 0.95 : tune.tape === "NORMAL" ? 0.7 : 0;
      if (conv < minConv) continue;
      let size = Math.max(state.minTradeSol, Math.min(sizeFor(state, P) * conv, state.maxTradeSol));
      if (!canOpen(state, size)) break;
      await openPosition(cand.r, size, cand.fs, dev, rep);
      state.lastOpenAt = now();
      openedThisCycle += 1;
      if (openedThisCycle >= perCycle) break;            // don't machine-gun the whole feed at once
    }

    // SELF-ACTIVATING SMART-MONEY ENTRIES — no toggle. Once the wallet observatory
    // has built up enough proven-winner history on its OWN (paper feeds it 24/7),
    // the bot ALSO starts taking follow plays on coins that tracked winner-wallets /
    // KOLs are buying right now — including ones the fresh-ape scan never surfaced
    // (e.g. higher-MC coins past the freshness gate). Works in paper AND live. The
    // main fresh scan above is completely unchanged; these are pure bonus entries,
    // and every smart-money position still rides the same rug/stop/trailing exits.
    if (smartMoneyReady() && state.open.length < maxNow && openedThisCycle < perCycle) {
      let smRows = [];
      try { smRows = await smartMoneyFeed(); } catch (e) { record("warn", `smart-money feed: ${e && e.message}`); }
      for (const r of (smRows || [])) {
        if (state.stopped || now() >= state.endAt) break;
        if (state.open.length >= maxNow) break;
        if (openedThisCycle >= perCycle) break;
        if (!r || !r.tokenMint || held.has(r.tokenMint)) continue;
        if ((state.coinLosses[r.tokenMint] || 0) >= 2) continue; // don't re-ape a repeat loser
        const last = state.recentSells[r.tokenMint];
        if (last && now() - last < 45_000) continue;             // wave cooldown
        const dev = getDevWallet(r.tokenMint);
        const rep = dev ? devReputation(dev) : null;
        if (rep && rep.rugs >= 2 && rep.runners === 0) continue;  // dev rug history still vetoes
        const sm = r._smartMoney || (smartMoney ? smartMoney(r.tokenMint) : null);
        if (!sm || !(sm.kol || sm.winners >= 1)) continue;
        const conv = convictionMult(r, rep, sm);
        if (conv < 1.0) continue;                                 // must carry real smart-money confluence
        let size = Math.max(state.minTradeSol, Math.min(sizeFor(state, P) * conv, state.maxTradeSol));
        if (!canOpen(state, size)) break;
        record("info", `🐳 smart-money entry ${r.symbol || shortMint(r.tokenMint)} @ MC $${Math.round(Number(r.marketCap) || 0)} — ${sm.kol ? "KOL " : ""}${sm.winners || 0} winner-wallet(s) → conv ${conv.toFixed(2)}`);
        await openPosition(r, size, freshScore(r), dev, rep);
        state.lastOpenAt = now();
        openedThisCycle += 1;
      }
    }

    // SCAN HEARTBEAT: when a cycle opens nothing, surface WHY at most once per ~45s so
    // the panel proves the bot is alive + scanning (not stuck) — shows the tape, how
    // many fresh pairs are in the feed, how many passed the quality bar, and the best
    // score available right now.
    if (openedThisCycle === 0 && now() - (state.lastScanLogAt || 0) > 45_000) {
      state.lastScanLogAt = now();
      const best = scored[0] ? Math.round(scored[0].fs) : 0;
      record("info", `🔍 scanning (${tune.tape || "warming"}) — ${rows.length} fresh, ${scored.length} passed the bar${scored.length ? `, best fs ${best}` : ""}; holding for a clean setup`);
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
