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
export const TUNED_COPY_LADDER = Object.freeze({
  key: "s10_t40_f70",
  stopPct: 10,
  tp1Pct: 40,
  tp1Frac: 70,
  trailPct: 40,
  moonCapMult: 6
});

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
  // "grind" = the base-hits machine: safer (higher) MC entries, bank small + often.
  // Slightly larger base than normal because the entry filters cut the rug tail, so
  // each (lower-variance) bet can carry a touch more size and still risk less.
  const grind = mode === "grind";
  // "scalp" = LIQUID-mover fast in/out. It trades the last-hour LIQUID feed (real depth, real
  // fills) instead of fresh dust, takes a flexible MC band (NOT low-cap), banks a quick pop and
  // recycles. This is the fix for "finds pairs slowly + phantom +300% marks that don't fill":
  // a liquid coin's mark is actually sellable, so the displayed win is the real win.
  const scalp = mode === "scalp";
  // LIQUID winner-hunt profile = QUICK (scalp) ONLY. We tried routing Steady + Balanced through
  // it too (wide MC, any age, trending/older coins) but the live scorecard was blunt: that book
  // bled (steady ran a 40% rug rate, −EV), while the proven money-maker is the FRESH low-MC pocket
  // (score 62-66, <30s, ~2-2.5k MC — the +EV "normal" engine). So Steady + Balanced now hunt that
  // proven fresh recipe and differ only in how they BANK; Quick stays the experimental liquid/
  // trending wide-net. (See aggParams data note + the autopilot-engine-modes memory.)
  const liquid = scalp;
  // STANDOUT-SIGNAL SNIPER (a mode FAMILY). Snipes ONLY fresh super-low-MC launches that show a
  // hard-to-fake STANDOUT signal (a notable X account attached, a tracked TG caller called it, a
  // proven non-rugging dev, or a proven-winner/KOL in the early buyers) — it leaves the faceless
  // dust. The signals are OR-gated (any one qualifies; more = bigger conviction) and recorded so we
  // learn which ones actually predict winners. Three exit variants, each its OWN labeled mode so
  // each accrues separately-trackable data: snipeTrail (de-risk then trail the 4x tail — the
  // moonshot math), snipeRide (let a bigger piece ride), snipeBank (bank the bulk, small moon tail).
  const snipeTrail = mode === "snipeTrail";
  const snipeRide = mode === "snipeRide";
  const snipeBank = mode === "snipeBank";
  const snipe = snipeTrail || snipeRide || snipeBank;
  // "pop" = REAL-TIME IGNITION rider. PopRadar (index.js) detects a coin POPPING right now from live
  // trade flow (net SOL inflow accelerating + buy-led + a buyer burst) and hands the engine a pre-vetted
  // pop feed; this mode rides the ignition in fast and banks INTO the spike (momentum-fade exit). It's
  // MC-AGNOSTIC by design — flow leads, MC lags — and keeps bets small + even (a pop reverses fast).
  const pop = mode === "pop";
  const baseFrac = mode === "degen" ? 0.10 : mode === "chill" ? 0.04 : scalp ? 0.07 : grind ? 0.07 : snipe ? 0.07 : pop ? 0.06 : 0.06;

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
  let sl = 6; // tighter stop — cut losers faster (was 8%)
  if (regime === "HOT") {
    tp1 = 28;
    tp2 = 75;
  } else if (regime === "COLD") {
    tp1 = 20;
    tp2 = 45;
  }
  // GRIND uses a slightly wider stop so normal dips on calmer higher-MC coins don't
  // shake us out of eventual winners. Real rugs are still cut FAST by the liquidity-pull
  // and feed-death exits (not this %-stop), so this only avoids noise stop-outs → a
  // higher hit-rate, which is the whole point of a steady-win mode.
  if (grind) sl = 8;
  // SCALP cuts losers fast — liquid coins move in smaller, real increments, so a tight 7%
  // stop is a real (fillable) 7% loss, not dust noise. High hit-rate + small losses is the edge.
  if (scalp) sl = 7;
  // SNIPE: a STRONG (tight) stop, per the user — on a super-low-MC fresh pair the absolute SOL at
  // risk is tiny, so we cut a non-runner FAST and cheap (many small stop-outs are fine; the signal-
  // picked winners ridden to 4x pay for them). The rug/liq-pull + feed-death exits fire even faster
  // on an actual rug. Kept at 10 (not 6) so normal first-tick volatility on a fresh curve doesn't
  // shake us out BEFORE the signal-driven run; tune lower if the data says cut harder.
  if (snipe) sl = 10;
  // POP: a pop reverses fast, so a tight 10% stop cuts a fake-out quickly; the momentum-fade exit
  // banks the winners into the spike before they round-trip. Small absolute risk per fast bet.
  if (pop) sl = 12;   // a real 30%+ pop needs room to breathe — a too-tight stop noise-cuts the runners before they run

  let minScore = regime === "HOT" ? 34 : regime === "COLD" ? 48 : 40;
  // degen does NOT loosen the entry bar — a lower bar just apes more rugs (the live data is
  // unambiguous: instant-rugs cluster below the fs floor). degen's aggression comes from BIGGER
  // SIZE ON PROVEN setups + a longer ride (conviction caps + moonTarget below), never a weaker
  // gate. chill is the pickiest; grind gates on its own grindScore scale.
  if (mode === "chill") minScore += 8;
  else if (grind) minScore += 6;
  minScore += state.minScoreBonus || 0; // low-churn raises the bar
  // Runner-SAFE hard floor: log analysis showed the catastrophic instant-rugs
  // cluster at fs <= 56 (they only sneak in during HOT regimes where the bar
  // drops to ~50), while NO observed runner was below fs 58 — including the fs61
  // monsters (TOMMY +711%, normie +338%). So floor low-churn at 57: cuts the
  // garbage, keeps every winner.
  // Self-tuning: the auto-tuner raises the bar in cold/rug-heavy tape and lowers
  // it when runners are frequent.
  minScore += (state.tune && state.tune.scoreBonus) || 0;
  // STARTER BASELINE (2026-06-20, user-directed "act now, tune from there"): the old
  // universal floor (low-churn 60 / else 58) was starving the engine — 29 min, zero
  // entries — because most fresh-feed rows score below 58, so the band [58,67) almost
  // never matched. That floor was written when freshScore was the ONLY rug protection;
  // it no longer is. The dedicated rug gates now run BEFORE this score check:
  //   • autopilotRowHasHardDanger() filters freeze/mint-authority/honeypot/blacklist at
  //     the FEED level (index.js adapters), and
  //   • securityGate() (SlimeShield) re-checks each candidate immediately PRE-BUY.
  // So a lower score floor no longer means "ape rugs" — the actual rugs are caught by
  // those gates, and the score floor's job narrows back to quality. Lowered to let the
  // engine actually take shots; raise back toward 58/60 if live data shows the low band
  // bleeds. (grind/scalp/snipe/pop override this below on their own score scales.)
  // ORIGINAL (tune-back target): Math.max(minScore, state.churn === "low" ? 60 : 58).
  minScore = Math.max(minScore, state.churn === "low" ? 50 : 46);
  // COLD / bleeding / cold-market tape: demand genuinely strong setups (fs ~66+)
  // regardless of regime base — this is what actually stops the fs 61-63 chop churn
  // that bleeds a directionless tape. (scoreBonus alone couldn't reach this.)
  if (state.tune && state.tune.tape === "COLD") minScore = Math.max(minScore, 62);
  // FRESH-PATH CALIBRATION CAP (the "something is off" fix): live data shows the +EV freshScore
  // band is 62-66 — 67+ bleeds. But the bumps above (low-churn +16, calibration, COLD +62) kept
  // RAISING the bar, herding entries UP out of the winning band into the losing 67+ zone. Cap the
  // fresh-path bar so it can't push past the sweet spot. (grind/scalp score on their own scales.)
  if (!liquid && !grind) minScore = Math.min(minScore, 63);
  // GRIND gates on grindScore (survivor-oriented), NOT freshScore — so its bar lives on a
  // different scale. Override to a grindScore threshold (the freshScore floors above don't
  // apply to grind). Stays adaptive: the auto-tuner's scoreBonus still raises it in cold/
  // rug-heavy tape. ~50 passes solid survived coins, filters thin/dumping ones.
  if (grind) minScore = 46 + ((state.tune && state.tune.scoreBonus) || 0);
  // SCALP gates on liquidScore (liquidity + turnover + early buy-led momentum), NOT freshScore —
  // its bar lives on that scale. ~22 passes genuinely liquid/active, buy-led movers: real last-hour
  // rows often lack BOTH m5 momentum AND a reported liquidity number, so a higher bar starved it to
  // zero entries. 22 is reachable from buy-led flow + a sane MC band alone, while still docking
  // thin/fading/dumping coins. Stays adaptive: the auto-tuner's scoreBonus raises it in cold tape.
  if (liquid) minScore = 22 + ((state.tune && state.tune.scoreBonus) || 0);
  // SNIPE gates on the live STANDOUT-SIGNAL score (notable-X / TG caller / proven-dev / proven-winner
  // in the hunt loop), NOT freshScore — so disable the freshScore floor (0) and let the signal gate
  // select. A signal-bearing low-freshScore launch is exactly the target the razor band would miss.
  if (snipe) minScore = 0;
  // POP gates on the live IGNITION score (the pop feed is pre-vetted by PopRadar), NOT freshScore.
  if (pop) minScore = 0;

  // ENTRY MC WINDOW. Default: tiny floor (a low-MC runner like ZUL +56% @ $1973 stays in),
  // ceiling 20k (these are fresh launches). GRIND skips the brand-new sub-$5k curve — where
  // the instant-rugs cluster — and reaches well higher (to $80k) for coins that already
  // SURVIVED the rug window and have real liquidity to fill 30-150% TPs. The floor is the
  // user's "~5k" target; age(45s) + deep liquidity + fs64 + the 0.7x size cap do the
  // rug-dodging, while the wide window keeps enough candidates to actually trade + compound.
  // Live data settled it: $3k floor traded dust that rugged (CHAIR -68% past stop) and
  // phantom-spiked (Specs fake +400% that couldn't fill). Float the floor above the
  // instant-rug/phantom zone. Frequency drops, but that's the price of not bleeding —
  // the real higher-frequency edge is smart-money copy, not aping fresher dust.
  // SCALP takes a FLEXIBLE MC band (not micro dust) — $4k..$12M — where there's enough size to fill
  // a tiny bet. The $4k floor sits just above pure phantom dust but stays reachable in the last-hour
  // window (higher floors starved it); the real depth/quality vetting is liquidScore + the volume
  // gate + fast exits, not the MC floor. grind stays mid; default is the fresh sub-$20k.
  // FRESH-PATH MC WINDOW — DE-OVERFIT (2026-06-18, user-approved). The old razor clamp to 2100-2500
  // (a 400-wide band the engine was fit to on ~1577 trades) is the textbook overfitting signature:
  // a thin profitable slice surrounded by losing neighbors does not survive multiple-testing
  // correction (Bailey/López de Prado, Probability of Backtest Overfitting), and a real edge is
  // robust to widening the band ±20%. Widened to a broad, economically-motivated small-launch range
  // ($1.8k-$9k). The hard liquidity/wash filters + the survival circuit-breaker (riskBrake) do the
  // real work now, not a curve-fit band — and the DEFAULT path is leaned LIQUID (exitable movers),
  // so fresh is no longer the default. (liquid/grind keep their own wide windows.)
  // SNIPE = fresh, super-low-MC launches (the user's "fresh pairs super low mc"): the standout
  // SIGNAL is what selects, not the MC band, so the window is just a sane fresh range.
  const mcFloor = liquid ? 4000 : grind ? 6000 : snipe ? 1500 : pop ? 8000 : 1800;        // pop = EXITABLE band only (sub-8k bonding dust can't be sold — CHFARA's +190% was unsellable). fresh floor 1800 stays: sub-1.8k is phantom dust that can't fill.
  // STARTER BASELINE (2026-06-20): fresh ceiling widened 9000 -> 60000. A higher MC is MORE
  // exitable, not less — capping at $9k excluded every survived/climbing small launch and was a
  // big chunk of the "found nothing" starvation. The fill-safety floor (1800) is unchanged.
  // ORIGINAL fresh ceil (tune-back target): 9000.
  const mcCeil = liquid ? 12000000 : grind ? 80000 : snipe ? 15000 : pop ? 250000 : 60000;     // pop: a catchable spread (8k-250k) covering the visible DexScreener movers, NOT mature $1M+ pumps
  // ANTI-PHANTOM depth floor — applied ONLY to coins that REPORT a liquidity number (see
  // entryReject). A phantom +400% spike comes from a thin curve where one tiny buy moves the marked
  // cap but nothing can fill, so a coin whose KNOWN liquidity is below this floor is rejected.
  // Coins that report no liquidity at all are NOT rejected here (that bypass-closer starved scalp
  // to an empty feed) — liquidScore + the volume gate + fast exits vet those. grind asks for $4k.
  const minLiqAbs = liquid ? 3000 : grind ? 4000 : 0;
  // GRIND waits out the first ~15s (the worst instant-rug/sniper-dump seconds — the fresh
  // feed is mostly sub-30s, so a 45s gate starved it to zero entries) and asks for slightly
  // deeper liquidity than default (cleaner fills, less drain risk) without being so strict
  // it can't find candidates. The 0.7x size cap + liquidity-pull/feed-death exits do the
  // rest of the rug-dodging.
  // AGE: the LIQUID profile basically ignores age — a good coin can run hours or DAYS after launch,
  // so age is a weak signal and the SETUP (liquidScore: real depth + turnover + buy-led momentum)
  // is what decides. Keep only a tiny 30s floor to skip the literal launch-snipe seconds (pure rug
  // roulette, not a setup), and an effectively-unbounded ceiling (~30d) so nothing good is excluded
  // for being "too old". grind targets survived/climbed coins; default stays fresh-launch tight.
  const minAge = liquid ? 30 : grind ? 20 : snipe ? 3 : pop ? 0 : 4;                        // pop = any age (flow-driven)
  const maxAge = liquid ? 2592000 : grind ? 3600 : snipe ? 600 : pop ? 2592000 : 1200;
  // FRESH-PATH AGE CARVE-OUT: the 30-120s band is the single worst age pocket (−1.29 over 509
  // trades, a 15% win rate) — coins that launched, got sniped/pumped, and are mid-dump. <30s
  // (+0.22) and 2-5m (+0.34) both WIN. So the fresh engine skips the 30-120s dead-zone entirely
  // and takes the freshest entries + the survivors past 2 min. (entryReject honors skipMidAge.)
  const skipMidAge = !liquid && !grind && !snipe && !pop;
  // STARTER BASELINE (2026-06-20): fresh maxScore ceiling raised 67 -> 100 (effectively off).
  // The 67-cap was REJECTING the strongest-scoring coins — combined with the [58,67) floor it
  // left a razor 9-point band almost nothing matched, a core "found nothing" cause. The old
  // note (67+ "bleeds even when strong") was from a book where the score floor was the only rug
  // gate; the dedicated rug gates now do that job, so don't throw away high-conviction rows.
  // Re-impose a ceiling (e.g. 67) only if fresh live data shows top-band rows actually bleed.
  // ORIGINAL fresh ceil (tune-back target): 67.
  const maxScore = (!liquid && !grind && !snipe && !pop) ? 100 : Infinity;
  // FRESH-PATH SCORE CEILING: the live book keeps losing on 67+ rows even when they
  // look strong. The best realized pocket is the middle 62-66 band, not the top score band.
  // LIQUID disables the RELATIVE liquidity gate (liqFrac 0): a healthy $1M coin legitimately has
  // liq well under mc*0.3, so the relative test would wrongly reject it. The absolute floor
  // (minLiqAbs, known-thin only) does the real depth check instead.
  const liqFrac = liquid ? 0 : grind ? 0.35 : pop ? 0 : 0.3;   // pop: pump-curve coins, no relative-liq gate

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
    // WIN-LOCK math (the whole point of "winning steady"): bank enough at the first DOABLE pop
    // that the trade books a REAL net win even if the tiny runner then dies. Banking 88% at a
    // +20% pop locks 0.88×1.20 = +5.6% on the WHOLE position before the runner does anything.
    // At the old 80% a +25% pop was exactly breakeven → it booked as a SCRATCH, not a win, which
    // is why steady "popped" but the session never showed green.
    // HIT-RATE: pin the first pop at a FIXED +20% (not the regime 20/25/28). Far more coins touch
    // +20% than +28%, so steady books a small locked win on MANY more trades — higher green-session
    // rate, which is the literal goal of "winning steady". +20% is the floor that still clears fees
    // at an 88% bank (0.88×1.20=+5.6% > the 4% win threshold); going lower would book scratches.
    // The 12% tail still free-rolls to +400% for the occasional moon.
    tp1 = 20; tp1Pct = 88; spikePct = 90; moonTarget = 400;
  } else if (mode === "chill") {
    // CAPITAL PRESERVATION exit: lock the bulk at the first pop, free-roll a small tail to a
    // modest moon — lowest variance, matches chill's "tiny green, almost never red" thesis
    // (the old chill rode the full 500% ladder, which fought its own purpose).
    tp1Pct = 78; spikePct = 85; moonTarget = 300; tp2Pct = 55; tp3Pct = 60;
  } else if (blend) {
    // sell 25% of the ORIGINAL at each rung: 25% @ first pop, then 33% of the 75%
    // remainder @ +100%, then 50% of the 50% remainder @ +200%, ride the last 25%.
    tp1Pct = 25; spikePct = 50; tp2Lvl = 100; tp2Pct = 33; tp3Lvl = 200; tp3Pct = 50; moonTarget = 400;
  } else if (grind) {
    // BASE-HITS ladder: bank the BULK at the first +30% pop (~65%), bank most of the
    // remainder at +70%, ride a small ~14% tail to +120-150% (the rare extra), capped at
    // +150%. No moonshot chase — high realized win-rate, small banks that compound. The
    // first-pop trigger (tp1) is set to ~30% just below.
    tp1 = regime === "HOT" ? 32 : regime === "COLD" ? 24 : 30;
    tp1Pct = 70; spikePct = 82; tp2Lvl = 70; tp2Pct = 60; tp3Lvl = 120; tp3Pct = 60; moonTarget = 150;
  } else if (scalp) {
    // FAST IN/OUT: bank the BULK at the first quick pop (~14%), take most of the rest at +30%,
    // close the sliver by a capped +60% — then recycle into the next liquid mover. NO moonshot
    // chase. The edge is a high hit-rate of small, REALIZABLE wins that compound, not lottery
    // tickets. On liquid coins these pops actually fill, so the banked SOL matches the marked %.
    tp1 = regime === "COLD" ? 11 : regime === "HOT" ? 16 : 14;
    tp1Pct = 80; spikePct = 88; tp2Lvl = 30; tp2Pct = 70; tp3Lvl = 60; tp3Pct = 100; moonTarget = 60;
  } else if (snipe) {
    // STANDOUT-SIGNAL SNIPE exits — three variants, each its OWN labeled mode so each accrues
    // separately-trackable data. All ride the tail AFTER tp1 with the trailing give-back (no mid
    // rungs), which is the fat-right-tail math (1-2 4x's offset many losers — don't clip the runner).
    if (snipeTrail) {
      // DE-RISK then TRAIL (recommended / moonshot math): sell HALF at +40% (recovers ~70% of cost —
      // mostly house money, rug-proofed), then ride the other half on the trail to a 4x+ tail.
      tp1 = 40; tp1Pct = 50; spikePct = 70; moonTarget = 800;
    } else if (snipeRide) {
      // LET IT RIDE: bank a smaller slice later (35% at +60%) and ride a bigger 65% to the moon.
      tp1 = 60; tp1Pct = 35; spikePct = 65; moonTarget = 1000;
    } else {
      // BANK & TAIL (snipeBank): lock the BULK at the first +30% pop (~75% ≈ full principal back),
      // free-roll a small 25% tail to 4x. Safest of the three.
      tp1 = 30; tp1Pct = 75; spikePct = 85; moonTarget = 400;
    }
  } else if (pop) {
    // POP RIDE — RIDE FOR A REAL, FEE-CLEARING MOVE, don't scratch-bank. On a pump coin the round-trip
    // (buy slippage + sell slippage + priority fees) eats ~5-10%, so banking a +1% "win" is a NET LOSS.
    // So the first bank waits for +30% (the floor worth taking), locking HALF there, and rides the other
    // half toward 100-150%. The momentum-fade is no longer a +0% auto-bank — it's a TRAILING lock (banks
    // a real move when it gives back from its peak) + a stagnation cut (exits a non-runner that fizzled).
    tp1 = 30; tp1Pct = 50; spikePct = 50; tp2Lvl = 80; tp2Pct = 50; tp3Lvl = 150; tp3Pct = 100; moonTarget = 150;
  }

  // AUTO-ADAPT — the key lesson from live: the moon-ride only PAYS in a genuinely HOT
  // tape (coins actually climbing). The rest of the time coins pop then dump, so holding
  // a big remnant just round-trips into a loss (blend banked 25% then the 75% dumped,
  // repeatedly). So: RIDE only when HOT; otherwise BANK HARD — lock ~85% at the first
  // pop, hold no mid rungs, small tail to +400%. Blend laddered only when HOT; Normal
  // keeps its ladder unless COLD; Steady always banks hard.
  const tape = (state.tune && state.tune.tape) || "warming";
  const bankHard = steady || tape === "COLD" || (blend && tape !== "HOT");
  // SNIPE keeps its own ladder regardless of tape (the signal is the edge, not the tape) — don't let
  // a COLD-tape bankHard clamp crush the moonshot tail it's built to ride. Its tight stop + early
  // de-risk protect the downside; the post-de-risk tail is house money worth riding for the 4x.
  if (bankHard && !steady && !snipe && !pop) { tp1Pct = Math.max(tp1Pct, 85); spikePct = Math.max(spikePct, 85); moonTarget = Math.min(moonTarget, 400); }

  // Per-mode CONVICTION CAPS — how far ONE bet may scale. degen concentrates size into PROVEN
  // setups (proven dev / smart-money / proven caller) and caps UNPROVEN coins harder, so a weak
  // coin can never carry a big bet; chill never oversizes at all. (Consumed by convictionMult.)
  let unprovenConvCap = 0.7, provenConvCap = 1.6;
  if (mode === "degen") { unprovenConvCap = 0.6; provenConvCap = 1.6; }
  else if (mode === "chill") { provenConvCap = 1.15; }
  // SCALP trades LIQUID coins (real depth = far lower rug risk), so an unproven one can carry a
  // bit more size than the dust modes (0.9x); proven caps a touch lower (1.5x) since these are
  // quick base-hits, not moonshot rides we'd concentrate into.
  else if (scalp) { unprovenConvCap = 0.9; provenConvCap = 1.5; }
  // SNIPE entries are SIGNAL-proven (that's the gate), so a strong-confluence snipe can size up well;
  // a lone weak signal stays modest.
  else if (snipe) { unprovenConvCap = 0.8; provenConvCap = 1.3; }   // snipes are lottery tickets — keep bets SMALL + even (moonshot math), don't size up hard on conviction
  // POP rides a fast ignition — small even bets (it reverses fast); smart-money in the burst can size a touch.
  else if (pop) { unprovenConvCap = 0.8; provenConvCap = 1.3; }
  // degen rides the proven runners it sizes into FURTHER — a higher moon target (unless a COLD
  // tape already pulled it in via the bankHard clamp above).
  if (mode === "degen" && !bankHard) moonTarget = Math.max(moonTarget, 700);

  // SNIPE entry gate: the live standout-signal score (snipeSignalScore in the hunt loop) must clear
  // this. OR-gated — any ONE real signal (a notable X, a trusted TG caller, a proven dev, or a
  // proven-winner early buyer) reaches it; faceless dust with no signal never qualifies.
  const minSnipe = 18;
  return { regime, wr, baseFrac, streakMult, regimeMult, tp1, tp2, sl, minScore, maxScore, mcFloor, mcCeil, minAge, maxAge, skipMidAge, liqFrac, minLiqAbs, steady, blend, grind, scalp, liquid, snipe, snipeTrail, snipeRide, snipeBank, pop, minSnipe, bankHard, tp1Pct, spikePct, moonTarget, tp2Lvl, tp2Pct, tp3Lvl, tp3Pct, unprovenConvCap, provenConvCap };
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
  // Arm the brake FAST — after just 5 closed trades — so a ruggy tape's opening burst
  // (live showed 11 losers in ~3 min before the old 8-trade gate engaged) gets braked
  // sooner. COLD-recovery re-probes every 4 min, so a false-cold self-corrects.
  const realizedWinRate = res.length >= 5 ? res.filter((r) => r === "W").length / res.length : null;
  // Net realized PnL over recent closed trades — catches the "40% win-rate but still
  // net RED" case (lots of tiny wins, a few bigger losses + fees) that a win-rate gate
  // alone misses. If we're genuinely losing money over the last several trades, brake.
  const pnls = (state.recentPnl || []).slice(-12);
  const netRecent = pnls.reduce((a, b) => a + b, 0);
  const realizedBleed = (realizedWinRate !== null && realizedWinRate < 0.35) || (pnls.length >= 5 && netRecent < 0);
  // PROTECT A GREEN SESSION: once up meaningfully, tighten so we don't churn hard-won
  // gains back into a softening tape (works with the bank-the-peak ratchet).
  const sessGain = state.start > 0 ? equity(state) / state.start - 1 : 0;
  const green = sessGain >= 0.15;

  // COLD RECOVERY (deadlock fix): once COLD stops us trading, our realized history
  // never updates — so realizedBleed/ownCold would stay true forever and freeze the bot
  // permanently (observed: 7+ min stuck COLD). If we've actually traded this session and
  // then sat OUT for 4+ min, treat that stale losing history as expired and RE-PROBE the
  // tape (our own COLD signals are suppressed). Only the market-wide gauge — which keeps
  // updating from the 24/7 observatory regardless of our trading — can still hold COLD.
  const probeNow = (state.lastOpenAt || 0) > 0 && (nowMs - state.lastOpenAt) > 4 * 60_000;
  const mktCold = mkt && mkt.heat === "COLD";
  const mktHot = mkt && mkt.heat === "HOT";
  const ownColdRaw = havePeaks && rugRate > 0.45 && goodRate < 0.12;
  const ownCold = !probeNow && ownColdRaw;
  const ownHot = havePeaks && (goodRate >= 0.3 || bigRate >= 0.15);
  const bleed = realizedBleed && !probeNow;
  // We're RE-PROBING a tape that bled (sat out 4+ min, but our underlying read is still
  // bad). Test it with ONE tiny cautious trade instead of a full NORMAL burst — a still
  // dead tape then only costs a single small probe, not a churn of losers.
  const reProbe = probeNow && (realizedBleed || ownColdRaw) && !(ownHot || mktHot);

  // COLD wins ties — protecting capital beats chasing. The market going cold, our own
  // trades going cold, OR our realized results bleeding all slam the brakes: widen the
  // gap between entries, cap concurrent bags, shrink size. This is what stops a dead
  // tape from draining the wallet via churn.
  if (ownCold || bleed || mktCold) {
    // COLD: only take genuinely strong setups. scoreBonus +20 lifts the entry bar to
    // ~fs 60-68 (vs the base ~40-48) so the fs 61-63 churn that bleeds a chop tape gets
    // skipped while the fs 67+ runners still pass. Plus widen entry gap + cap bags.
    state.tune = { scoreBonus: 20, sizeMult: 0.7, tape: "COLD", maxOpenCap: 2, entryGapMs: 15000, perCycle: 1 };
  } else if ((ownHot || mktHot) && !bleed) {
    // Hot — press harder (bigger size, more concurrent, no gap). If already well up,
    // ease off so the session banks green instead of round-tripping it.
    state.tune = { scoreBonus: green ? 2 : -2, sizeMult: green ? 1.0 : 1.35, tape: "HOT", maxOpenCap: green ? 3 : null, entryGapMs: 0, perCycle: green ? 3 : 4 };
  } else if (reProbe) {
    // CAUTIOUS RE-PROBE: one small, selective trade per ~20s to test if the bled tape
    // recovered — not a full NORMAL burst. A winning probe lifts the win-rate and we go
    // NORMAL next; a loser flips straight back to COLD. Stops the dead-tape probe drip.
    state.tune = { scoreBonus: 10, sizeMult: 0.55, tape: "PROBE", maxOpenCap: 1, entryGapMs: 20000, perCycle: 1 };
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
  // AGE + MC scoring REALIGNED to realized EV (1464-trade live audit, see [[autopilot-engine-modes]]):
  // age <30s WON, 30-120s BLED (-1.24); MC $1.8-2.5k WON (+1.22), $2.5-3.5k BLED (-1.41). The old
  // weights rewarded the losing bands (30-120s got +20, $2.5-8k got the top +22) — flip it so the
  // entry bar preferentially admits the proven +EV pocket and starves the bleeders.
  if (age <= 30) s += 26;          // <30s = +EV
  else if (age <= 120) s += 8;     // 30-120s = the WORST age band (-1.29 over 509) — penalize hard
  else if (age <= 300) s += 14;    // 2-5m was +EV (+0.34)
  else if (age <= 600) s += 9;
  else s += 5;

  // MC — DE-OVERFIT: a BROAD small-launch preference, not a razor 2100-2500 spike (curve-fit noise).
  // In-band ($1.8k-$9k) coins all score the same so the band is a WIDE preference; outside it tapers
  // (a soft nudge, never a hard gate — the clamp + liquidity/wash filters gate). Robust to widening.
  if (mc >= 1800 && mc <= 9000) s += 24;
  else if (mc >= 1200 && mc < 1800) s += 12;
  else if (mc <= 30000) s += 12;
  else s += 5;

  if (vol >= 120) s += 16;
  else if (vol >= 60) s += 11;
  else if (vol >= 30) s += 7;
  else if (vol >= 18) s += 3;

  const flow = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  s += (flow - 0.5) * 22;

  const prov = Number(row.bestPickScore) || 0;
  s += Math.min(15, prov * 0.15);

  // GRADUATION / CURVE-VELOCITY bonus — real SOL accelerating into the bonding curve toward
  // graduation is the earliest, hardest-to-fake "this one is going" tell. Bounded so it sharpens
  // the fresh score (lifts a real mover over the bar) without ever dominating it. No-op (0) when
  // the curve data isn't on the row, so DexScreener-only rows score exactly as before.
  s += Math.min(20, graduationScore(row) * 0.45);

  // CAPITAL EFFICIENCY — reward few-but-meaningful swaps, dock micro-bot wash (top ML predictor).
  s += capitalEfficiencyScore(row);

  return s;
}

// SURVIVOR score for GRIND — the steady-win mode wants coins that already SURVIVED the
// rug window and are climbing, which freshScore structurally rejects (it rewards <30s age
// and $2.5-8k MC, the opposite of grind's target). This scores what actually matters for a
// safer base-hit: real recent VOLUME (the coin is alive + tradeable), BUY-led flow,
// LIQUIDITY depth (clean fills + rug resistance), a sane MC band, and site provenance —
// with no youth penalty. ~0..100; grind gates on this instead of freshScore.
export function grindScore(row) {
  const mc = Number(row.marketCap) || 0;
  const vol = Number(row.volume5m) || 0;
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;
  const liq = Number(row.liquidityUsd) || 0;
  const prov = Number(row.bestPickScore) || 0;
  let s = 0;
  // Real recent volume = live + sellable (the #1 survival signal).
  if (vol >= 200) s += 28; else if (vol >= 100) s += 22; else if (vol >= 50) s += 14; else if (vol >= 25) s += 7;
  // Buy-led flow (up to ~+27 for heavily buy-dominant).
  const flow = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  s += Math.max(0, flow - 0.45) * 50;
  // Liquidity depth relative to MC — fills the 30% TP cleanly + resists drains.
  const lr = mc > 0 ? liq / mc : 0;
  if (lr >= 0.6) s += 18; else if (lr >= 0.45) s += 12; else if (lr >= 0.35) s += 6;
  // MC sweet spot for steady +30% moves (not dust, not too heavy to move). The live feed
  // is mostly sub-$5k, so a small $3-5k band keeps grind trading on quality movers there.
  if (mc >= 6000 && mc <= 45000) s += 16; else if (mc >= 5000 && mc <= 80000) s += 9; else if (mc >= 3000 && mc <= 80000) s += 6;
  // Site provenance / best-pick quality.
  s += Math.min(14, prov * 0.14);
  return s;
}

// LIQUID-MOVER score for SCALP — the fast in/out mode wants a coin with REAL depth (clean fills,
// no phantom marks), live turnover (it's actually trading), buy-led 5m flow, and EARLY upward
// momentum it can scalp the front of (rising but not already blown off the top). It deliberately
// does NOT reward youth or microcaps (the opposite of freshScore). ~0..100; scalp gates on this.
// JUMP-POINT engine — detects a tradeable MOMENTUM SURGE ("jump point") on a coin of ANY age:
// fresh OR launched months ago and suddenly waking up. This is the second profit engine beside
// copy-trade — get IN on the surge, get OUT fast. Returns 0 for anything that isn't a real jump
// (early-returns), and a 0..100+ heat score for a clean one. Built only from data we already pull
// (turnover, 5m flow, m5/h1 from DexScreener/swap-api) — no new feed, no Helius.
//   Thesis (per market research): a jump = volume SPIKE (5m volume large vs the pool) + BUY-led
//   flow + price breaking UP, and PERSISTENCE matters — a 1h-green move is durable, a lone 5m
//   spike usually reverses (distribution). We score all four and demand real, sellable depth.
export function jumpScore(row) {
  const liq = Number(row.liquidityUsd) || 0;
  const mc = Number(row.marketCap) || 0;
  const vol = Number(row.volume5m) || 0;
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;
  const m5 = Number(row.m5);   // 5-min price change %
  const h1 = Number(row.h1);   // 1-hr price change %
  if (!(liq >= 4000) || !(mc >= 8000)) return 0;                 // never chase a surge we can't exit
  let s = 0;
  // 1) VOLUME SPIKE via turnover (5m volume / pool depth). A coin trading a big fraction of its
  //    liquidity in 5 minutes is ON FIRE; below a floor it isn't a jump at all.
  const turn = liq > 0 ? vol / liq : 0;
  if (turn >= 1.0) s += 34; else if (turn >= 0.6) s += 26; else if (turn >= 0.35) s += 18; else if (turn >= 0.18) s += 10; else return 0;
  // 2) BUY PRESSURE — a surge must be buyers lifting, not a sell climax / distribution.
  const flow = (buys + sells) > 0 ? buys / (buys + sells) : 0.5;
  if (flow >= 0.7) s += 24; else if (flow >= 0.6) s += 16; else if (flow >= 0.52) s += 8; else return 0;
  // 3) THE JUMP itself — price breaking UP in the 5m window. Reward the clean breakout; the
  //    blow-off top (already +140%) is too late to chase.
  if (Number.isFinite(m5)) {
    if (m5 >= 8 && m5 <= 60) s += 26;
    else if (m5 >= 3 && m5 < 8) s += 14;
    else if (m5 > 60 && m5 <= 140) s += 10;
    else if (m5 < 0) return 0;
  }
  // 4) PERSISTENCE — a 1h-green move has legs; a deeply red 1h is a dead-cat bounce, skip.
  if (Number.isFinite(h1)) { if (h1 >= 10) s += 16; else if (h1 >= 0) s += 8; else if (h1 <= -30) s -= 14; }
  // 5) tradeable MC band — room to pop, depth to fill our exit.
  if (mc >= 20000 && mc <= 8000000) s += 8; else if (mc <= 20000000) s += 4;
  return Math.max(0, s);
}

export function liquidScore(row) {
  const liq = Number(row.liquidityUsd) || 0;
  const mc = Number(row.marketCap) || 0;
  const vol = Number(row.volume5m) || 0;
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;
  const m5 = Number(row.m5);   // 5-min price change %
  const h1 = Number(row.h1);   // 1-hr price change %
  let s = 0;
  // REAL depth = clean fills + slippage resistance + a sellable mark (the whole point of scalp).
  // Tiers reward the realistic last-hour range ($6-60k+) so a decent liquid coin clears the bar
  // even when momentum (m5) data is missing from the feed row.
  if (liq >= 60000) s += 24; else if (liq >= 30000) s += 19; else if (liq >= 15000) s += 14; else if (liq >= 8000) s += 11; else if (liq >= 5000) s += 8; else if (liq >= 3000) s += 5;
  // Turnover (recent volume / liquidity) — proves the coin is actively trading, not a stagnant
  // pool we couldn't exit. Too little volume relative to depth = dead, skip.
  const turn = liq > 0 ? vol / liq : 0;
  if (turn >= 0.5) s += 16; else if (turn >= 0.25) s += 11; else if (turn >= 0.1) s += 6;
  // Buy-led 5m flow (up to ~+27 for heavily buy-dominant).
  const flow = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  s += Math.max(0, flow - 0.45) * 50;
  // EARLY upward momentum: scalp the front of a push, not the blowoff top. Sweet spot rising but
  // < ~40% in 5m. Already-extended (+40-80%) gets a little; fading (<= -8%) is docked hard.
  if (Number.isFinite(m5)) {
    if (m5 >= 3 && m5 <= 40) s += 16;
    else if (m5 > 40 && m5 <= 80) s += 6;
    else if (m5 > 0 && m5 < 3) s += 8;
    else if (m5 <= -8) s -= 12;
  }
  // Don't catch a knife mid-dump: a deeply red 1h trend is a falling coin, scalp wants stable/up.
  if (Number.isFinite(h1) && h1 <= -25) s -= 10;
  // Sane MC band for a small bag to move ~12% on our flow without being dust or a mega-cap.
  if (mc >= 30000 && mc <= 5000000) s += 10; else if (mc >= 15000 && mc <= 12000000) s += 5;
  // JUMP-POINT bonus: a coin mid-surge (volume spike + buy-led breakout) is exactly what the
  // get-in/get-out engine wants — let it lift a marginal liquid row over the bar. Bounded so it
  // sharpens, never dominates, the depth/flow base score.
  s += Math.min(22, jumpScore(row) * 0.22);
  // GRADUATION / CURVE-VELOCITY bonus — for a still-bonding liquid mover, real SOL accelerating
  // toward graduation is a strong, unfakeable continuation tell. Bounded; 0 when no curve data.
  s += Math.min(16, graduationScore(row) * 0.36);
  // CAPITAL EFFICIENCY — meaningful avg swap size beats micro-bot wash (top ML predictor).
  s += capitalEfficiencyScore(row);
  return s;
}

// CONVICTION: how hard to bet a setup (0.5x..1.6x of base size). Trades like a
// pro — size scales with confluence: proven dev + heavy buy flow + freshness +
// strong score → bigger; marginal/risky → smaller. Bounded; final size still
// clamped to the per-trade ceiling by the caller.
export function convictionMult(row, rep, sm, ci, caps = {}) {
  let c = 1.0;
  // LEARNED signal weights (self-calibration; see computeSignalEdge). Each signal's conviction
  // bonus is multiplied by what that signal has ACTUALLY earned in our realized trade history
  // (bounded 0.5..1.5; 1.0 = neutral / no sample yet). This closes the loop: signals that
  // predict winners get leaned into, ones that don't quietly fade — automatically, the longer
  // it runs. Weights only ever scale the POSITIVE bonuses; safety penalties stay full-strength.
  const W = caps.weights || null;
  const wt = (k) => { const w = W && Number(W[k]); return Number.isFinite(w) ? Math.max(0.5, Math.min(1.5, w)) : 1; };
  if (rep) {
    if (rep.runners >= 2 && rep.rugs === 0) c += 0.4 * wt("dev");   // proven runner-dev
    else if (rep.runners >= 1 && rep.rugs === 0) c += 0.2 * wt("dev"); // promising
    else if (rep.rugs >= 1 && rep.runners === 0) c -= 0.3;   // rug-leaning (penalty: never weighted down)
  }
  // SMART MONEY: proven-winner wallets or tracked KOLs already aping this coin.
  // Bonus signal only — boosts conviction, never gates entry. Bonded, never huge.
  if (sm) {
    if (sm.kol) c += 0.3 * wt("kol");                        // a tracked KOL is in early buyers
    else if (sm.kolProbe) c += 0.05;                          // unproven KOL probe: learn small, don't size like edge
    if (sm.winners >= 2) c += 0.3 * wt("winners");           // multiple proven winners aping
    else if (sm.winners >= 1) c += 0.2 * wt("winners");      // one proven winner aping
  }
  // CALLER INTEL: a Telegram caller / channel with a PROVEN call→2x record just called this
  // coin. Pure bonus conviction (never a veto), already bounded + sample-gated by the
  // callerSignal scorer — front-runs the crowd that follows good alpha groups. Stays 0 until
  // a caller/channel has a real resolved record, so it can't be gamed by a fresh account.
  if (ci && ci.convictionDelta > 0) c += ci.convictionDelta * wt("caller");
  // ENTRY-BAND TIMING: the proven winner-wallets we're following have a HISTORICAL entry-MC band
  // (where they've actually bought). A coin whose MC sits INSIDE that band means we're entering at
  // their proven point — front-running them where it's worked before. Pure bonus, bounded, no veto.
  const mc = Number(row.marketCap) || 0;
  const bandLo = Number(sm && sm.entryMcLo) || 0;
  const bandHi = Number(sm && sm.entryMcHi) || 0;
  if (mc > 0 && bandLo > 0 && bandHi > bandLo && mc >= bandLo && mc <= bandHi) c += 0.15 * wt("entryBand");
  // FLOW-SURGE: buy-flow / volume ACCELERATING vs the prior read (the hunt loop attaches the
  // surge strength as row._flowSurge). Rising flow catches the turn AS it happens rather than
  // after; bounded so it sharpens conviction without dominating. Helps clear the gate + sizes up.
  const surge = Number(row._flowSurge) || 0;
  if (surge > 0) c += Math.min(0.3, surge) * wt("flowSurge");
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;
  const vol = Number(row.volume5m) || 0;
  const flow = buys + sells > 0 ? buys / (buys + sells) : 0.5;
  if (flow >= 0.8 && vol >= 60) c += 0.2;                    // strong, well-funded buy flow
  else if (flow <= 0.45) c -= 0.15;                          // sellers leading
  // WASH/BUNDLE guard: real momentum is many small txns; a big volume number from only a
  // handful of transactions is wash-trading / bundled bait (the strongest rug tell). Size
  // DOWN on it rather than hard-reject (counts can be noisy on brand-new curves).
  if (vol >= 80 && (buys + sells) > 0 && (buys + sells) < 8) c -= 0.3;
  const age = Number(row.pairAgeSeconds) || 9999;
  if (age <= 60) c += 0.15;                                  // very fresh = best entries
  // freshScore rewards <30s age / $2.5-8k MC — meaningless for SCALP's liquid, minutes-old,
  // higher-MC coins (every one would score low and get docked). Skip the freshScore-derived
  // size tweaks for scalp; its own liquidScore gate already vetted setup quality.
  const noEdge = !(rep && rep.runners >= 1) && !(sm && (sm.kol || sm.kolProbe || sm.winners >= 1)) && !(ci && ci.trusted);
  if (!caps.scalp) {
    const fsv = freshScore(row);
    // NOTE: we used to size UP on fs>=70 ("top-tier"). The live scorecard killed that idea — the
    // 72+ band has the BEST win-rate (29%) but LOSES the most SOL (−0.93), i.e. its losers are
    // bigger than its wins. Sizing up there was throwing more money at the worst-EV band. The
    // proven +EV pocket is the mid 62-66 band. So no fs-based size-UP anymore — score gates entry,
    // it does NOT earn a bigger bet (only PROVEN dev / smart-money confluence sizes up, below).
    // SIZE DOWN the lowest-confidence bets: no proven dev, no smart money, only a marginal
    // score. A rug/dump on these gaps PAST any stop, so betting smaller shrinks the hit.
    if (noEdge && fsv < 66) c -= 0.25;
  }
  // CRITICAL: freshness/score do NOT predict instant-rugs. Only let conviction size
  // ABOVE base for a dev with a PROVEN runner history (and no rugs). Unknown/unproven
  // coins are capped at 1.0x so one instant-rug can't blow a big bet (the log showed
  // 0.045 SOL = 18% bets on fresh coins gapping -37% past the stop).
  // Allow sizing ABOVE base for a proven runner-dev OR a strong smart-money read
  // (a tracked KOL, or multiple proven-winner wallets in the early buyers). Lone
  // unproven coins stay capped at 1.0x so one instant-rug can't blow a big bet.
  const proven = (rep && rep.runners >= 1 && rep.rugs === 0) || (sm && (sm.kol || sm.winners >= 2)) || (ci && ci.trusted);
  // Per-mode caps (default 0.7x unproven / 1.6x proven). degen concentrates into proven setups
  // (unproven 0.6x); chill never oversizes (proven 1.15x). See aggParams.
  const provenCap = Number.isFinite(caps.provenCap) ? caps.provenCap : 1.6;
  const unprovenCap = Number.isFinite(caps.unprovenCap) ? caps.unprovenCap : 0.7;
  // Unproven coins (no proven dev, no smart money) are capped at 0.7x base — even ELITE fs.
  // Live proof: fs75 DATASS/Puffins rugged -70/-94% at full size for -0.065/-0.084. Since
  // score can't predict a rug, the only protection is a smaller bet on every unproven coin;
  // proven-dev / smart-money setups still size up to 1.6x where the edge is real.
  return Math.max(0.5, Math.min(proven ? provenCap : unprovenCap, c));
}

// CONFLUENCE multiplier — size UP HARD when multiple INDEPENDENT hard signals stack on the same
// coin. convictionMult's per-signal bonuses saturate at its 1.6x proven cap, so the rare gold
// setup (proven dev + winner wallets + trusted caller + notable-X all firing) bets identically to
// a single lukewarm signal. That leaves the best edge on the table. Independent confirmation is
// statistically far safer than any one signal, so this lifts the ceiling ONLY when >=2 distinct
// signal TYPES agree — applied on TOP of convictionMult and still clamped to the per-trade ceiling
// (maxTradeSol) by the caller, so absolute risk never exceeds the hard cap. Pure + exported.
//   row may carry xNotable/xClout (notable-X) and _smartMoney.earlyAlpha (first-buyer roster);
//   snipeRec (when present) carries already-resolved signal flags from snipeSignalScore.
export function confluenceMult(row, rep, sm, ci, snipeRec) {
  let n = 0;
  if (rep && rep.runners >= 1 && rep.rugs === 0) n += 1;                       // proven runner-dev
  if (sm && (sm.kol || sm.winners >= 1)) n += 1;                              // smart money in early
  if (ci && ci.trusted) n += 1;                                              // proven caller called it
  const xHot = (row && (row.xNotable || Number(row.xClout) >= 1)) || (snipeRec && snipeRec.signals && snipeRec.signals.x);
  if (xHot) n += 1;                                                          // notable-X clout
  if (row && row._smartMoney && row._smartMoney.earlyAlpha) n += 1;          // first-buyer roster alpha
  if (n <= 1) return 1;          // a lone signal sizes normally (convictionMult already handled it)
  if (n === 2) return 1.15;      // two independent confirmations
  if (n === 3) return 1.45;      // strong confluence
  return 1.8;                    // 4+ independent signals — the gold setup, press it (still capped)
}

// GRADUATION / CURVE-VELOCITY score — proximity to the pump.fun Raydium graduation threshold plus
// the velocity of real SOL flowing into the bonding curve. This is the ONE tell a scammer can't
// fake: real SOL is real SOL, and a coin accelerating toward graduation is the strongest "this one
// is going" signal — it fires BEFORE price/MC visibly move, so it's the earliest possible entry.
// Built only from the free in-memory PumpPortal trade stream (no RPC, no paid feed). Pure; returns
// 0 when the curve data isn't on the row (graceful — a DexScreener-only row is never penalized).
//   row.bondingPct  — 0..1 fraction of the curve filled (index.js derives it from vSolInBondingCurve)
//   row.curveVelSol — SOL/min flowing into the curve over the recent trade window
export function graduationScore(row) {
  let s = 0;
  const pct = Number(row && row.bondingPct);
  if (Number.isFinite(pct) && pct > 0) {
    // Sweet spot 35-85% filled = committed momentum with room left before graduation (post-grad
    // the curve pop is already gone). Building (15-35%) earns less; nearly-graduated is small+late.
    if (pct >= 0.35 && pct <= 0.85) s += 22;
    else if (pct >= 0.15 && pct < 0.35) s += 12;
    else if (pct > 0.85 && pct < 1) s += 9;
    else if (pct >= 0.02) s += 4;
  }
  const vel = Number(row && row.curveVelSol);
  if (Number.isFinite(vel) && vel > 0) {
    if (vel >= 3) s += 24;          // ripping toward graduation
    else if (vel >= 1.2) s += 16;
    else if (vel >= 0.5) s += 9;
    else if (vel >= 0.2) s += 4;
  }
  return s;
}

// CAPITAL-EFFICIENCY — the single best graduation predictor in the live ML studies: real demand is
// a FEW MEANINGFUL swaps, not hundreds of micro-bot trades. avg swap size = volume / trade count.
// Big avg swap = real money walking in; sub-$15 avg across many trades = wash-trade theater (the
// easiest metric to fake, so we DOCK it instead of rewarding raw buy/holder counts). Pure; bounded.
export function capitalEfficiencyScore(row) {
  const vol = Number(row.volume5m) || 0;
  const trades = (Number(row.buys5m) || 0) + (Number(row.sells5m) || 0);
  if (trades < 3 || vol <= 0) return 0;        // too little to judge → neutral
  const avg = vol / trades;
  if (avg >= 120) return 16;                    // big-ticket real buyers
  if (avg >= 60) return 12;
  if (avg >= 30) return 8;
  if (avg >= 15) return 4;
  return -6;                                    // many tiny swaps = bot wash → demote (not hard-reject)
}

// FLOW-SURGE — detect buy-flow / turnover ACCELERATING vs this coin's previous read. Returns a
// bounded 0..0.3 conviction bonus and updates the per-mint cache in place. A coin whose buy SHARE
// and VOLUME are both RISING is turning up right now — we want to be early on that move, not late.
// Pure aside from the cache it owns; needs two reads of the same mint to fire (0 on the first).
export function flowSurge(cache, mint, row, nowMs) {
  if (!cache || !mint) return 0;
  const vol = Number(row.volume5m) || 0;
  const buys = Number(row.buys5m) || 0;
  const sells = Number(row.sells5m) || 0;
  const flow = (buys + sells) > 0 ? buys / (buys + sells) : 0.5;
  const prev = cache.get(mint);
  if (cache.size > 6000) { for (const [k, v] of cache) { if (nowMs - v.at > 300_000) cache.delete(k); } }
  cache.set(mint, { vol, flow, at: nowMs });
  if (!prev || !(nowMs - prev.at > 0) || nowMs - prev.at > 180_000) return 0; // need a recent prior read
  let s = 0;
  if (flow >= 0.55 && flow > prev.flow + 0.05) s += 0.15;      // buy-share rising off a buy-led base
  if (vol > 0 && prev.vol > 0 && vol > prev.vol * 1.4) s += 0.15; // turnover accelerating (growing interest)
  return Math.min(0.3, s);
}

// JUNK-SYMBOL filter — the live copy/snipe feeds surfaced obvious garbage (SFASFA, SFASFAFSAAAAA,
// Fraudcoin, TEST) because spammy "winner" wallets touch everything; they just scratch out on fees +
// waste slots. Cheap, CONSERVATIVE tells (low false-positive on real tickers like BTC/WIF/PEPE/DOGE):
// scam/test keywords, 4+ identical chars in a row, or a short unit repeated to form the whole symbol
// on a 6+ char name. Pure + exported. When unsure it returns false (don't block a real coin).
export function looksLikeJunkSymbol(sym) {
  const s = String(sym || "").trim();
  if (!s || s.length > 24) return true;                              // empty / absurdly long = junk
  if (/\b(test|fake|rug|scam)\b/i.test(s) || /fraud|honeypot|rugpull|ponzi/i.test(s)) return true;
  if (/(.)\1{3,}/i.test(s)) return true;                             // AAAA / !!!! = mash/spam
  if (s.length >= 6) {                                               // SFASFA = "SFA" x2
    for (let u = 2; u <= Math.floor(s.length / 2); u++) {
      const unit = s.slice(0, u);
      if (unit.repeat(Math.ceil(s.length / u)).slice(0, s.length) === s) return true;
    }
  }
  return false;
}

// A buy that fails for these reasons will fail again ALL session, so blacklist the mint and stop
// re-attempting it (live log: a Token-2022 coin got re-tried 8x in a row — pure wasted cycles + churn).
function isUnbuyable(msg) { return /safety|token-?2022|trusted .*pool|no .*route|unsupported|honeypot/i.test(String(msg || "")); }
function noteUnbuyable(state, mint) {
  if (!state || !mint) return;
  if (!(state.unbuyable instanceof Set)) state.unbuyable = new Set();
  state.unbuyable.add(mint);
  if (state.unbuyable.size > 800) { const a = [...state.unbuyable]; state.unbuyable = new Set(a.slice(a.length - 600)); }
}

// POP IGNITION — score how hard a coin is "popping RIGHT NOW" from its live trade flow (computed by
// index.js PopRadar over rolling ~3s buckets off swap-api + the PumpPortal stream). The LEADING tells
// of a pop STARTING — get in as it ignites, not after: net SOL inflow ACCELERATING vs its own baseline,
// buy-led (sellers drying up), a BURST of distinct buyers (a real crowd, not one wallet), real absolute
// size, and (bonus) smart money in the burst. MC-AGNOSTIC by design — flow leads, MC lags. Pure +
// exported. metrics: { accel, inflowNow, buyShare, uniqBuyers, smart }. ~0..100; high = igniting NOW.
export function popIgnitionScore(m) {
  const inflowNow = Number(m && m.inflowNow) || 0;   // SOL bought in the latest ~3s bucket
  const accel = Number(m && m.accel) || 0;           // inflowNow / its recent baseline inflow
  const buyShare = Number(m && m.buyShare) || 0;     // buys / (buys+sells) in the latest bucket
  const uniq = Number(m && m.uniqBuyers) || 0;       // distinct buyers in the latest bucket
  if (inflowNow < 0.18) return 0;                    // a dust burst is not a real pop
  if (buyShare < 0.6) return 0;                       // must be clearly buy-led
  let s = 0;
  // TWO ignition patterns, EITHER can fire (so we catch a fresh launch AND a mid-cap continuation pop):
  //  1) ACCELERATION — the explosive 0->burst of a fresh launch (a quiet coin suddenly ripping).
  if (accel >= 5) s += 42; else if (accel >= 3) s += 32; else if (accel >= 2) s += 22; else if (accel >= 1.3) s += 14; else if (accel >= 1.0) s += 6;
  //  2) SUSTAINED BUY PRESSURE — a coin that's ALREADY trading (mid-cap, any age) whose baseline isn't
  //     near-zero so its accel stays ~1, but it's getting hammered with buy-led flow + a real crowd =
  //     a price pop in progress. This is why it "wasn't buying" mid-caps: accel alone missed them.
  if (buyShare >= 0.88) s += 26; else if (buyShare >= 0.78) s += 18; else if (buyShare >= 0.68) s += 10; else if (buyShare >= 0.6) s += 4;
  if (uniq >= 10) s += 22; else if (uniq >= 6) s += 15; else if (uniq >= 4) s += 9; else if (uniq >= 3) s += 4;  // breadth = real crowd
  if (inflowNow >= 4) s += 16; else if (inflowNow >= 1.5) s += 11; else if (inflowNow >= 0.7) s += 6; else if (inflowNow >= 0.35) s += 3;  // absolute size
  if (m && m.smart) s += 12;                          // smart money in the burst = front-run signal
  return Math.min(100, s);
}
export const POP_IGNITION_FIRE = 42;   // ignition score at/above which a coin is "popping" -> top-priority entry

// SLIPPAGE-AWARE POP SIZING: fraction of bank to risk per pop, scaled by the coin's MC. Thin low-MC
// curves slip HARD on exit (live: a 5%-bank bet in a $4k coin faded "+0%" but realized -22% — the sell
// craters the curve), so bet SMALL there; a deeper higher-MC coin can absorb a full bet. This rebalances
// the inverted asymmetry (losers bigger than winners) without touching the moon-bag upside.
export function popBetFrac(mc) {
  const m = Number(mc) || 0;
  if (m < 3000) return 0.02;        // ultra-thin: tiny bet, slippage tax is brutal
  if (m < 8000) return 0.03;
  if (m < 25000) return 0.04;
  return 0.05;                      // 25k-100k: deeper curve absorbs the full 5%-of-bank bet
}

// STANDOUT-SIGNAL score for the SNIPER — the hard-to-fake "this launch sticks out" tells, OR-gated
// (any ONE qualifies; more = higher score -> bigger conviction). Pure + exported for tests. Reads the
// live signal objects the hunt loop already gathers (dev rep, smart-money, caller intel) plus an
// optional notable-X read attached to the row (row.xNotable / row.xClout, populated by index.js).
// Returns { score, signals } so the caller can record WHICH signals fired -> we learn over time which
// actually predict winners (the user's "make it all but not require all, then see what's working").
export function snipeSignalScore(row, rep, sm, ci) {
  let s = 0;
  const signals = {};
  // Notable X/Twitter account attached to the launch — the hardest-to-fake signal (a real big-name
  // account is expensive to fake; volume/holders are cheap). row.xClout: 0 none / 1 known-sizable /
  // 2 big-name; row.xNotable is a boolean shortcut.
  const xClout = Number(row && row.xClout) || 0;
  if ((row && row.xNotable) || xClout >= 1) { s += xClout >= 2 ? 40 : xClout >= 1 ? 28 : 20; signals.x = true; }
  // A tracked TG caller/channel with a proven call->2x record called this exact mint.
  if (ci && ci.trusted) { s += 34; signals.caller = true; }
  else if (ci && ci.convictionDelta > 0) { s += 14; signals.callerProbe = true; }
  // Proven dev wallet — past coins that RAN and never rugged.
  if (rep && rep.runners >= 1 && rep.rugs === 0) { s += rep.runners >= 2 ? 30 : 22; signals.dev = true; }
  // A proven-winner / tracked KOL wallet is already in the early buyers.
  if (sm && sm.kol) { s += 30; signals.kol = true; }
  else if (sm && sm.winners >= 2) { s += 28; signals.winners = true; }
  else if (sm && sm.winners >= 1) { s += 18; signals.winner = true; }
  return { score: s, signals };
}

// Hard entry gates — filter instant-rug bait while keeping genuine fresh
// movers. Returns null if the row passes, or a string reason if rejected.
export function entryReject(row, P) {
  // POP mode is gated by the live IGNITION score (PopRadar pre-vets the feed) — the generic
  // age/MC/volume gates don't apply (flow leads, MC lags). The ignition is the entry signal; the
  // tight stop + momentum-fade exit are the protection. So a pre-vetted pop row always passes here.
  if (P && P.pop) return null;
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
  // NOTE: use Number.isFinite guards (not `|| default`) so a deliberate 0 (e.g. SCALP's liqFrac=0
  // = "no relative gate") is honored instead of being coerced back to the default by `0 || x`.
  const minAge = Number.isFinite(P.minAge) ? P.minAge : 4;
  const maxAge = Number.isFinite(P.maxAge) ? P.maxAge : 1200;
  const mcFloor = Number.isFinite(P.mcFloor) ? P.mcFloor : 1800;
  const mcCeil = Number.isFinite(P.mcCeil) ? P.mcCeil : 20000;
  const liqFrac = Number.isFinite(P.liqFrac) ? P.liqFrac : 0.3;
  if (!Number.isFinite(age) || age < minAge || age > maxAge) return "age";
  // Skip the proven 30-120s dead-zone on the fresh path (−1.29 over 509 trades) — see aggParams.
  if (P.skipMidAge && Number.isFinite(age) && age > 30 && age < 120) return "midage";
  if (!Number.isFinite(mc) || mc < mcFloor || mc > mcCeil) return "mc";
  if (liqFrac > 0 && liq > 0 && liq < mc * liqFrac) return "liquidity";
  // GRIND/SCALP absolute depth floor — kills coins whose KNOWN liquidity is genuinely thin (the
  // ones that flash fake +400% but can't fill). NOTE: only rejects when liquidity is REPORTED and
  // below the floor. Many real last-hour movers (esp. pump.fun curves) report NO liquidity number
  // at all; rejecting those (the old `!(liq>0)` bypass-closer) starved scalp to an empty feed and
  // it never traded. Unknown-liq rows are let through and judged by liquidScore + the volume gate
  // below; scalp's fast in/out exits + honest realized-anchored display handle the residual risk.
  if (P.minLiqAbs && liq > 0 && liq < P.minLiqAbs) return "liquidity";
  // SNIPE buys super-early on a STANDOUT SIGNAL, before the volume necessarily shows up — so it only
  // needs a non-dead pulse, not the fresh path's $25 floor. The standout-signal gate does the real
  // selecting in the hunt loop; here we just skip a literally-dead launch.
  if (vol < (P.snipe ? 5 : 25)) return "volume";
  if (buys > 0 && sells > buys * 2 + 3) return "dumping";
  // MOMENTUM-CONFIRMED entry for the LIQUID-mover path: only ape a coin that is actively being
  // BOUGHT right now (buy-led last-5m flow), not one that's flat or fading. This is the fix for
  // "we buy movers that then dump" — the 42%-stop bleed. Needs a real flow sample (>=12 trades) so
  // thin/unknown-flow rows still pass and get judged by liquidScore; require buys to clearly lead.
  if (P.liquid && (buys + sells) >= 12 && buys < sells * 1.15) return "fading";
  // WASH/BUNDLE disqualifier (liquid/grind paths only — minutes-to-hours-old coins have reliable
  // tx counts, unlike a brand-new bonding curve where counts are noisy and this would starve the
  // feed). A real volume number from only a handful of trades is the classic wash/bundled-bait
  // signature — the single most defensible manipulation tell (high volume + very few txns). Reject
  // outright rather than just sizing down, since on the LIQUID path we trade ON that volume.
  if ((P.liquid || P.grind) && vol >= 80 && (buys + sells) > 0 && (buys + sells) < 6) return "wash";
  // SCALP scores liquid movers (liquidScore); GRIND scores survivors (grindScore); the rest use
  // freshScore. Each mode's gate lives on its own scale (see the minScore overrides in aggParams).
  const setupScore = P.liquid ? liquidScore(row) : P.grind ? grindScore(row) : freshScore(row);
  if (setupScore < P.minScore) return "score";
  // FRESH-PATH SCORE CEILING — reject the 67+ bleeder zone (see aggParams maxScore). Entry becomes a
  // BAND (~62-66), the proven +EV pocket where the runners actually live, not just a floor.
  if (Number.isFinite(P.maxScore) && setupScore >= P.maxScore) return "overscore";
  return null;
}

// Conservative local-history veto. Replay data is noisy, so it only blocks when
// there is a meaningful sample and the matched setups were clearly bad expectancy.
export function historyGateReject(history) {
  if (!history || typeof history !== "object") return null;
  const sample = Number(history.sampleSize) || 0;
  if (sample < 12 || String(history.confidence || "").toLowerCase() === "low") return null;
  const failRate = Number(history.failRatePercent);
  const winRate = Number(history.winRatePercent);
  const upside = Number(history.medianMaxUpsidePercent);
  const drawdown = Number(history.medianMaxDrawdownPercent);
  if (Number.isFinite(failRate) && failRate >= 78 && (!Number.isFinite(upside) || upside < 35)) return "history-fail";
  if (Number.isFinite(winRate) && winRate <= 22 && Number.isFinite(upside) && upside < 25) return "history-ev";
  if (Number.isFinite(drawdown) && drawdown <= -35 && (!Number.isFinite(upside) || upside < 35) && (!Number.isFinite(winRate) || winRate <= 35)) {
    return "history-drawdown";
  }
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
  if (pos.copyLadder) {
    const stopPct = Number(pos.copyLadder.stopPct) || TUNED_COPY_LADDER.stopPct;
    const tp1Pct = Number(pos.copyLadder.tp1Pct) || TUNED_COPY_LADDER.tp1Pct;
    const tp1Frac = Number(pos.copyLadder.tp1Frac) || TUNED_COPY_LADDER.tp1Frac;
    const trailPct = Number(pos.copyLadder.trailPct) || TUNED_COPY_LADDER.trailPct;
    const moonCapMult = Number(pos.copyLadder.moonCapMult) || TUNED_COPY_LADDER.moonCapMult;
    if (move <= -stopPct) {
      return { action: "sell", pct: 100, reason: "copy-stop", move };
    }
    if (move >= (moonCapMult - 1) * 100) {
      return { action: "sell", pct: 100, reason: "copy-moon", move };
    }
    if (!pos.copyTp1Done && !pos.tp1Done && move >= tp1Pct) {
      return { action: "sell", pct: tp1Frac, reason: "copy-tp1", move };
    }
    if ((pos.copyTp1Done || pos.tp1Done) && peak >= tp1Pct) {
      const keep = Math.max(0.2, Math.min(0.95, 1 - trailPct / 100));
      if (move <= peak * keep) {
        return { action: "sell", pct: 100, reason: "copy-trail", move };
      }
    }
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
  if (!pos.copyLadder && move <= -P.sl) {
    return { action: "sell", pct: 100, reason: "stop", move };
  }
  // SMART-MONEY EXIT: proven winner wallets are in this coin, and we've learned the gain
  // level where the earliest of them historically sells. Bank our WHOLE position just
  // before that — get out ahead of the smart money's dump instead of riding into it.
  if (pos.smartExitPct && move >= pos.smartExitPct) {
    return { action: "sell", pct: 100, reason: "smart-exit", move };
  }
  // SMART-HOLD CAP (Phase 2): we're copying wallets whose learned hold time we know — get OUT
  // around when they usually sell rather than riding past them. Once we're held past their typical
  // window AND not deep underwater (let the hard stop handle real losers), bank it. This is the
  // per-wallet, per-style "in-and-out" exit; only fires when a copied wallet's hold style is learned.
  if (pos.smartHoldMs && held >= pos.smartHoldMs && move > -P.sl) {
    return { action: "sell", pct: 100, reason: "smart-hold", move };
  }
  // FAST-SPIKE CAPTURE: a coin already +150%+ is a fast pump that fades fast and fills
  // below the marked price on a thin curve — bank the BULK now near the spike instead
  // of laddering into a fading price. Honest fills showed a +358%-marked runner only
  // netted ~+74% riding the slow ladder; grab it. Keep a small runner for the monster.
  if (!pos.copyLadder && !pos.tp1Done && move >= 150) {
    return { action: "sell", pct: P.spikePct || 75, reason: "spike", move };
  }
  // TP1: bank the first DOABLE pop. steady mode banks 80% here (locks the realizable
  // win); default banks 55%.
  if (!pos.copyLadder && !pos.tp1Done && move >= P.tp1) {
    return { action: "sell", pct: P.tp1Pct || 55, reason: "tp1", move };
  }
  // Mid rungs only in the laddered styles (normal/blend) AND only when not banking
  // hard. steady / cold-tape bankHard HOLD the small runner after TP1 — no mid-rung
  // selling — so the tail can reach the moon target and a chop tape can't round-trip it.
  if (!pos.copyLadder && !P.steady && !P.bankHard && !P.snipe) {
    // TP2: next tranche (blend = ~33% of remainder @ +100%; normal = 50% @ P.tp2).
    if (pos.tp1Done && !pos.tp2Done && move >= (P.tp2Lvl || P.tp2)) {
      return { action: "sell", pct: P.tp2Pct || 50, reason: "tp2", move };
    }
    // TP3 (+200%): next tranche.
    if (pos.tp2Done && !pos.tp3Done && move >= (P.tp3Lvl || 200)) {
      return { action: "sell", pct: P.tp3Pct || 50, reason: "tp3", move };
    }
  }
  // Moon target: close the runner out (+400% steady/blend/cold, +500% normal).
  if ((pos.tp3Done || P.steady || P.bankHard || P.snipe) && move >= (P.moonTarget || 500)) {
    return { action: "sell", pct: 100, reason: "tp4", move };
  }
  // Moon-bag TIME CAP: once the bulk is banked (tp1Done), don't let a small remnant
  // hog a maxOpen slot for minutes waiting for a moon that isn't coming. Cash it and
  // free the slot so the bot keeps hunting. This is the fix for "stuck — no buys for
  // minutes": a couple of riding bags (e.g. one sitting at +210% between the trail and
  // the moon target) used to fill every slot and freeze new entries indefinitely.
  // PROVEN-DEV LEASH (richer observatory use): a coin from a dev whose history shows big
  // average peaks has earned a longer ride before the slot-freeing time-cap fires — so we
  // don't cash a proven runner-dev's moon bag early. Sample-gated (devAvgPeak is only set
  // when the dev has >=3 trades & avg peak >=80%), bounded 4→10 min, and it ONLY extends the
  // hold — the trailing give-back, hard stop, and rug/feed exits still protect the bag the
  // whole time. Unknown devs (the vast majority) keep the default 4 min: behavior unchanged.
  const moonHoldMs = ((pos.devAvgPeak || 0) >= 400 ? 10 : (pos.devAvgPeak || 0) >= 200 ? 7 : 4) * 60_000;
  if (pos.tp1Done && held > moonHoldMs) {
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
  // CORRELATED-EXPOSURE CAP: rugs cluster (same deployer cohort / souring tape), so total at-risk
  // capital across ALL open bags is treated as one bet and capped. New sessions default to 0.6 of
  // equity (riskBrake); older snapshots without the field keep the prior 0.9 so behavior is unchanged.
  const exposureCap = Number.isFinite(state.exposureCapFrac) ? state.exposureCapFrac : 0.9;
  if (eq > 0 && (deployed + sizeSol) / eq > exposureCap) return false;
  return true;
}

export function executableMcReject(row, P, sm = null) {
  if (!P || P.liquid || P.grind) return null;
  // Smart-money/copy rows can be outside the fresh-launch pocket; they are gated
  // by their own learned-wallet/KOL rules and fast smart exits.
  if (sm && (sm.kol || sm.kolProbe || sm.winners >= 1)) return null;
  const mc = Number(row?.marketCap);
  if (!(mc > 0)) return null;
  if (mc < P.mcFloor || mc > P.mcCeil) return "entry-mc";
  return null;
}

export function repeatBudgetForMint(state, P, mint) {
  const key = String(mint || "");
  const wins = Number(state?.coinWins?.[key]) || 0;
  const losses = Number(state?.coinLosses?.[key]) || 0; // scratches count here too
  const netWins = Math.max(0, wins - losses);
  if (P && P.liquid) return 2 + Math.min(2, netWins);
  return 1 + Math.min(1, netWins);
}

export function symbolCooldownMs(P) {
  return P && P.liquid ? 180_000 : 90_000;
}

function recentSellAt(rec) {
  return typeof rec === "number" ? rec : Number(rec?.at || 0) || 0;
}

function recentSellMc(rec) {
  return typeof rec === "object" && rec ? Number(rec.mc || 0) || 0 : 0;
}

// THE realizable multiple for an open bag — the ONE place the haircut lives so the internal
// equity, the displayed marked equity, and the per-position % can never drift apart (drift is
// exactly how phantom-mark bugs creep back). What a bag could ACTUALLY BANK if sold right now:
//   • unrealized UPSIDE discounted to ~60% and capped at 4x — a thin fresh curve cannot really
//     pay out a marked +400%; what fills is far less.
//   • DOWNSIDE counts in full — that loss is real and sellable.
//   • a bag with no real liquidity (lastLiq < $1500) is capped at COST — a phantom up-mark on a
//     coin you literally can't sell must never read as profit anywhere.
// Uses the median-smoothed dispMc when present (steady, no single-tick flicker), else lastMc.
export function realizableMove(p) {
  const raw = p.entryMc > 0 ? (Number(p.dispMc) || Number(p.lastMc) || p.entryMc) / p.entryMc : 1;
  let mv = raw >= 1 ? 1 + (Math.min(raw, 4) - 1) * 0.6 : Math.max(0, raw);
  if ((Number(p.lastLiq) || 0) < 1500) mv = Math.min(mv, 1);
  return mv;
}

// REALIZABLE equity — open bags valued at realizableMove(), not the optimistic curve mark.
// This is the single source of truth for every risk decision (loss-cap, peak ratchet, canOpen,
// the self-tuner gain), so the bot can never "feel up +27%" on a phantom mark and then watch it
// evaporate the moment it tries to sell. Matches the displayed marked equity in status().
export function equity(state) {
  const openVal = state.open.reduce((a, p) => a + p.costSol * p.remFrac * realizableMove(p), 0);
  return state.bank + openVal;
}

// ---------------------------------------------------------------------------
// RISK CIRCUIT-BREAKER (survival-first). With -100% rug tails, surviving the bad runs
// matters more than a better entry — so this is the piece that actually makes "come out
// even or a little ahead" reachable. DOWNSIDE-ONLY by construction: it can only PAUSE new
// entries or SHRINK size when the book is bleeding; it never loosens or sizes up. Pure +
// exported for tests. Returns { openHalt, reason, sizeMult, exposureCapFrac }:
//   • openHalt          — open NO new position this tick (exits keep running on the fast loop)
//   • sizeMult          — multiply the computed bet (two-tier de-risk before a hard halt)
//   • exposureCapFrac   — max TOTAL at-risk capital as a fraction of equity (rugs correlate, so
//                         concurrent bets are treated as one bet and the total is capped)
// Guards: (1) a loss-CLUSTER cooldown — N real losses in a row trip a real cool-off (longer than
// the 90s chop nudge); (2) a ROLLING-DAILY two-tier loss stop measured vs equity at the day anchor,
// so a long set-and-sleep run gets a FRESH daily risk budget each 24h (halve size at half the
// budget, halt at the full budget); (3) a correlated-exposure cap (enforced by canOpen). The day
// anchor is rolled by the engine every 24h.
export function riskBrake(state, nowMs) {
  const exposureCapFrac = Number.isFinite(state.exposureCapFrac) ? state.exposureCapFrac : 0.6;
  const out = { openHalt: false, reason: null, sizeMult: 1, exposureCapFrac };
  // The HARD HALTS are OPT-IN (`riskHalts`). Default OFF so a TESTING run never auto-pauses — the
  // user wants to keep trading through losses to see whether it can pick more winners than losers
  // (a few 4x+ offset many small losers). Turn it on for hands-off set-and-sleep banking. The gentle
  // size de-risk + exposure cap below always apply (they shrink, never stop).
  const haltsOn = state.riskHalts === true;
  // (1) Loss-cluster cooldown — a burst of real losses pauses opening for a true cool-off so a
  // correlated rug wave can't drain the wallet trade-by-trade.
  if (haltsOn && state.consecHaltUntil && nowMs < state.consecHaltUntil) {
    return { ...out, openHalt: true, reason: "loss-cluster cooldown" };
  }
  // (2) Rolling daily loss, two-tier — measured against equity at the day anchor.
  const dayBase = state.dayAnchorEquity > 0 ? state.dayAnchorEquity : state.start;
  const frac = Number.isFinite(state.dailyLossFrac) && state.dailyLossFrac > 0 ? state.dailyLossFrac : 0.10;
  if (dayBase > 0) {
    const dd = 1 - equity(state) / dayBase;          // fraction down on the rolling day
    if (haltsOn && dd >= frac) return { ...out, openHalt: true, reason: `daily loss -${Math.round(frac * 100)}%` };
    if (dd >= frac / 2) out.sizeMult = 0.5;          // tier 1: half the daily budget spent -> halve size
  }
  // (3) Pre-cluster de-risk: shrink as real losses accumulate, BEFORE the hard cluster halt, so a
  // souring tape gets felt out with smaller bets instead of full size straight into the cluster.
  const cl = state.consecLosses || 0;
  if (cl >= 2) out.sizeMult = Math.min(out.sizeMult, 0.6);
  else if (cl >= 1) out.sizeMult = Math.min(out.sizeMult, 0.8);
  return out;
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
  // SELF-CALIBRATION bias (from historical outcomes; see lib/selfCalibration.js). Bounded +
  // never-looser by contract: a non-negative score bonus raises the entry bar, a <=1 size
  // multiplier shrinks the per-bet cap. Absent/zero = unchanged behavior.
  const cal = opts.calibration || {};
  const calScoreBonus = Math.max(0, Math.min(12, Number(cal.minScoreBonus) || 0));
  const calSizeMult = Math.max(0.5, Math.min(1, Number(cal.sizeFracCapMult) || 1));
  // LEARNED per-signal weights (computeSignalEdge): bounded 0.5..1.5 multipliers for each signal's
  // conviction bonus, derived from realized per-signal EV. Null/absent = neutral (treated as 1.0),
  // so this is a pure UPGRADE that only takes effect once a real sample exists. Sizing-only.
  const signalWeights = (cal && cal.signalWeights && typeof cal.signalWeights === "object") ? cal.signalWeights : null;
  return {
    mode: opts.mode || "normal",
    churn: lowChurn ? "low" : "normal",
    live: Boolean(opts.live),
    // HARD risk halts (daily-loss + consecutive-loss auto-pause). The host defaults this ON for LIVE
    // money (off for paper), so a bad small-live tuning run can't bleed the wallet. Without carrying
    // it through here, freshState dropped it and the halts never engaged.
    riskHalts: Boolean(opts.riskHalts),
    walletPubkey: opts.walletPubkey || null,
    start: opts.solBudget,
    bank: opts.solBudget,
    // PnL BASIS — the denominator the headline % is measured against. Paper: the budget (= bank).
    // Live: captured as the REAL wallet balance at session start (first flat reconcile), so the
    // headline tracks actual money change instead of (fullWallet / budget − 1), which showed a
    // phantom gain whenever the wallet held more SOL than the chosen budget. null until captured.
    equityBasis: opts.live ? null : opts.solBudget,
    peak: opts.solBudget,
    // Total-equity peak (working + already-vaulted) for the always-on bank-the-peak
    // ratchet, so sweeping profit to the vault never looks like a giveback.
    peakTotal: opts.solBudget,
    // Protected baseline for the bank-the-peak ratchet. In "continue" mode it steps UP
    // each time a green is banked, so the next cycle guards the new, higher floor.
    lockBase: opts.solBudget,
    // When true, the bank-the-peak ratchet BANKS the green and KEEPS TRADING (flatten +
    // re-baseline, vault sweeps on the slow loop) instead of stopping the session.
    // Default false = stop (the original safe behavior, unchanged for everyone else).
    lockGainsContinue: Boolean(opts.lockGainsContinue),
    lockedBankedSol: 0,
    lastOpenAt: 0,
    walletSol: null,
    minTradeSol: opts.minTradeSol || 0.012,
    // Per-trade HARD ceiling — caps risk per bet so a rug can't gut the wallet. User-set value
    // wins; otherwise a budget-scaled default that's PER-MODE so each mode's identity is real:
    // degen bets bigger (6%), chill smaller (3%), everyone else 4%. Low-churn concentrates (6%).
    maxTradeSol: opts.maxTradeSol || Math.max(0.05, budget * (lowChurn ? 0.06 : opts.mode === "degen" ? 0.06 : opts.mode === "chill" ? 0.03 : opts.mode === "scalp" ? 0.05 : 0.04)),
    // Fraction-of-cash cap per bet. Per-mode: degen concentrates into proven setups (16%), chill
    // preserves capital (8%), scalp sizes moderate on clean-fill liquid coins (14%), default 12%;
    // low-churn 28%. Calibration can only SHRINK this (×<=1).
    sizeFracCap: (lowChurn ? 0.28 : opts.mode === "degen" ? 0.16 : opts.mode === "chill" ? 0.08 : opts.mode === "scalp" ? 0.14 : 0.12) * calSizeMult,
    // Entry-quality bump: low-churn takes stronger setups (no hard filter — keeps runners).
    // Calibration ADDS to this (raises the bar) when marginal-score setups have been bleeding.
    minScoreBonus: (lowChurn ? 16 : 0) + calScoreBonus,
    // Self-calibration snapshot in effect this session (for the status/log; null = defaults).
    calibration: cal && (calScoreBonus || calSizeMult < 1) ? { minScoreBonus: calScoreBonus, sizeFracCapMult: calSizeMult } : null,
    // Few concurrent positions so each runner is meaningful + dry powder stays free.
    // Concurrent-position cap. Lowered the normal default 8 -> 5 so a session that
    // doesn't pass maxOpen can't over-deploy the whole bankroll into one dumping
    // wave (the "losing fast" pattern). The panel sends an explicit value (default 3).
    maxOpen: opts.maxOpen || (lowChurn ? 3 : 5),
    // Optional session profit-lock: once up >= minGainPct, stop + flatten if
    // equity gives back `giveback` fraction of the peak gain. null = off.
    profitLock: opts.profitLock || null,
    // Session loss cap: stop + flatten if working equity falls this far below the stake.
    // Per-mode default when the user doesn't set one: the more AGGRESSIVE the mode, the TIGHTER
    // the cap — tight defaults keep learning modes from bleeding a session while the model
    // is discovering which KOL/wallet buckets are actually working. User value wins.
    lossCapFrac: Math.max(0.05, Math.min(0.5, Number(opts.lossCapFrac) > 0 ? Number(opts.lossCapFrac)
      : (opts.mode === "chill" ? 0.06
        : opts.mode === "degen" ? 0.10
          : (opts.mode === "steady" || opts.mode === "blend" || opts.mode === "grind" || opts.mode === "scalp") ? 0.08
            : 0.12))),
    // RISK CIRCUIT-BREAKER tunables + state (see riskBrake). Downside-only; user values win.
    //  • dailyLossFrac: rolling-24h loss budget — a set-and-sleep run gets a FRESH budget each day
    //    instead of one lifetime cap; halve size at half the budget, halt opening at the full budget.
    //  • consecLossLimit: real losses in a row that trip a cool-off (longer than the 90s chop nudge).
    //  • exposureCapFrac: cap on TOTAL at-risk capital as a fraction of equity (rugs correlate).
    // riskHalts OPT-IN (default OFF): the hard daily/cluster HALTS only engage when the user turns
    // them on (set-and-sleep). OFF = testing mode: keep trading through losses, only the gentle size
    // de-risk + exposure cap apply. The user can flip this + set dailyLossFrac from the panel.
    riskHalts: Boolean(opts.riskHalts),
    dailyLossFrac: Math.max(0.03, Math.min(0.5, Number(opts.dailyLossFrac) > 0 ? Number(opts.dailyLossFrac) : 0.10)),
    consecLossLimit: Math.max(2, Math.min(10, Number(opts.consecLossLimit) || 4)),
    consecCooldownMs: Math.max(60_000, Number(opts.consecCooldownMs) || 15 * 60_000),
    exposureCapFrac: Math.max(0.2, Math.min(1, Number(opts.exposureCapFrac) > 0 ? Number(opts.exposureCapFrac) : 0.6)),
    consecLosses: 0,
    consecHaltUntil: 0,
    dayAnchorAt: opts.startedAt || 0,
    dayAnchorEquity: opts.solBudget,
    lastBrakeLogAt: 0,
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
    scratches: 0,
    sourceStats: {},
    blocked: 0,
    streak: 0,
    results: [],
    waves: {},
    // Momentum-confirmation memory (cold-tape only): a fresh unproven coin must hold
    // strength across two scans before we ape, so single-tick spike-then-dump bait is
    // skipped. { [mint]: { at, mc } }.
    watching: {},
    // Sit-out-the-chop: when set in the future, fresh sniping is paused (capital
    // preservation) while smart-money copies + open-position exits keep running.
    chopPauseUntil: 0,
    // Closed-trade count at the last chop trip — the guard only re-arms after NEW trades
    // close, so a cooldown actually resumes instead of re-pausing on stale bleed signals.
    chopTrippedAtTrades: 0,
    recentSells: {},
    // Last time we APED each coin NAME — blocks piling into a clone swarm (same name,
    // different mints) 3x in seconds before any loss registers (ASTROGUY/Bob x3).
    recentApeNames: {},
    // Per-coin loss memory: stop re-aping a coin that keeps stopping us out this
    // session (the log showed one coin entered 6x, almost all losses).
    coinLosses: {},
    // Per-coin SESSION trade counter (wins included): caps how many times we recycle the SAME
    // mint so the bot spreads across DIFFERENT movers instead of churning one or two coins all
    // session ("it only traded 2 coins / keeps aping the same one"). See DIVERSIFY in hunt().
    coinTrades: {},
    // Per-coin SESSION win counter: a coin that WON for us earns a higher re-entry allowance so
    // the bot can rebuy a dip on a proven winner and trade it again, while meh/losing coins keep
    // the tight cap (so it doesn't spam the same old pairs). See DIVERSIFY in hunt().
    coinWins: {},
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
    // SCALP's feed: liquid last-hour movers (real depth + volume). Defaults to the fresh feed
    // if the host didn't wire it, so scalp degrades gracefully instead of starving.
    getLiquidFeed = null,
    // POP mode feed: real-time IGNITION candidates from PopRadar (index.js). Null = pop mode degrades
    // to no candidates (it simply won't trade) when unwired.
    getPopFeed = null,
    // popFading(mint) -> true once the inflow that drove a pop has DECELERATED (momentum-fade exit).
    popFading = () => false,
    // popInflow(mint) -> the coin's CURRENT buy-inflow (SOL/8s). The engine tracks the peak SINCE
    // ENTRY on the position itself and fades against THAT — robust, no reliance on host-side maps.
    popInflow = () => 0,
    getPairLite,
    buyToken,
    sellPercent,
    // INSIDER-LAUNCH dev-dump tripwire: returns true once the creator wallet of `mint` has SOLD.
    // The host (index.js) watches creators of insider launches via swap-api and flips this; the
    // engine exits 100% the instant it's true. Default false = feature off when unwired.
    devSold = () => false,
    // (mint, creator) -> register a COPY/smart-money position's coin for the same real-time rug-watch
    // the insider launches get, so devSold() can flip on a distribution precursor. No-op when unwired.
    noteRugWatch = () => {},
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
    clusterRisk = () => null,   // (mint) -> { risk:0..1, reason } | null  (funding-graph rug filter)
    securityGate = async () => null,   // (row) -> { danger:true, reason } | null  (on-chain SlimeShield rug block, pre-buy)
    smartMoneyReady = () => false,
    smartMoneyFeed = async () => [],
    callerIntel = () => null,   // (mint) -> { signal:{convictionDelta,reason,trusted}, caller, channel } | null
    getMarketTape = () => null,
    entryHistory = async () => null,
    symbolLoserCount = () => 0,
    recordTrade = () => {},
    // SELF-ARM: 0..1 readiness from the learning warehouse (proven wallets learned, their styles
    // learned, KOL roster, measured EV). The bot stays LIVE + learning and only starts pulling the
    // trigger — and scales size — as this rises. Default 1 = fully armed (no change unless wired).
    getReadiness = () => ({ score: 1, label: "ready" }),
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

  const _logDedup = new Map(); // msg -> last console-emit time (noise guard)
  function record(level, msg, data) {
    const entry = { at: now(), level, msg, data: data || null };
    logRing.push(entry);                       // full history kept for the /log endpoint (never deduped)
    if (logRing.length > 400) logRing.shift();
    // LOG NOISE GUARD: the hunt loop re-evaluates the SAME coins every ~5s, so identical info lines
    // (SNIPE / Skipping / Avoiding ...) repeated ~12x/min and blew out the log stream. Suppress an
    // IDENTICAL info message from the console/live feed within 45s. Warnings/errors ALWAYS emit.
    if (level !== "warn" && level !== "error") {
      const t = now();
      if (t - (_logDedup.get(msg) || 0) < 45_000) return;
      _logDedup.set(msg, t);
      if (_logDedup.size > 2000) { for (const [k, v] of _logDedup) if (t - v > 120_000) _logDedup.delete(k); }
    }
    try {
      log(level, msg, data);
    } catch {}
  }

  function bumpSymLoss(sym) {
    const ns = normSym(sym);
    if (!ns) return;
    const e = state.symLosses[ns] || { count: 0, at: 0 };
    e.count += 1;
    e.at = now();
    state.symLosses[ns] = e;
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
    // FINAL BANK: flatten turned the open bags into cash in the trading wallet; sweep that
    // realized profit to the safe wallet now, because the slow loop won't run again once
    // stopped. Without this the last batch of gains sat un-swept in the hot wallet until the
    // next session — exactly the money a losing streak could later give back. Best-effort.
    if (state.vault && state.vault.destination && state.live) {
      try { await doVaultSweep({ final: true }); } catch (e) { record("warn", `final vault sweep failed: ${e && e.message}`); }
    }
    record("info", `Autopilot STOP (${reason}) — ${state.open.length === 0 ? "all positions flat" : `WARNING ${state.open.length} still open`}${state.secured ? ` · ${round(state.secured, 4)} SOL banked to safe wallet` : ""}`);
    await savePoint();
    return status();
  }

  // Sell everything immediately (loss cap / timer / kill switch).
  async function flatten(reason) {
    for (const pos of [...state.open]) {
      await doSell(pos, 100, reason);
    }
  }

  // (Display now reads the median-smoothed pos.lastMc directly — see status() — instead of the
  // raw single-tick getInstantMc, which is what made the live numbers flicker. getInstantMc is
  // still injected for any future fast-path use, but the headline/display no longer depend on it.)

  function status() {
    if (!state) return { running: false };
    // ── HONEST, NON-JUMPING DISPLAY ────────────────────────────────────────────────────────
    // The headline number is REALIZED-anchored: open bags are valued at COST (break-even), so
    // the equity / PnL% the user sees ONLY moves when a trade actually closes and SOL lands in
    // the bank. This is the fix for "I sold 3 losses in a row but it showed positive" and "it
    // jumps everywhere / shows +300% for a second": a phantom mark on a thin curve can no longer
    // inflate the headline, because unrealized marks are not counted in it at all. After three
    // real losses the headline is red, full stop — you always know exactly where you stand.
    //
    // The optimistic/marked view (what the open bags are CURRENTLY worth, haircut) is still
    // exposed SEPARATELY (markedEquity / markedPnlPct / unrealizedSol) and clearly labeled as
    // not-yet-banked, so the UI can show "realized +5% · unrealized +12% (riding)" without ever
    // passing the speculative number off as your actual result.
    const deployedCost = state.open.reduce((a, p) => a + p.costSol * p.remFrac, 0);
    // Realized equity: cash on hand + vaulted + open bags AT COST. Moves only on closed trades.
    const realizedEquity = state.bank + (state.secured || 0) + deployedCost;
    // PnL basis: the real starting balance (live) or the budget (paper). Measuring against this —
    // not the budget when the live wallet held extra SOL — is what stops the phantom "+5% before
    // any trade". Falls back to start until the first flat reconcile captures it.
    const basis = Number(state.equityBasis) > 0 ? Number(state.equityBasis) : state.start;
    // Marked equity: open bags at their smoothed, haircut mark (full downside, but unrealized
    // gains discounted to ~60% and hard-capped at 4x — and using the median-smoothed pos.lastMc,
    // NOT the raw single-tick getInstantMc that made the per-position number flicker).
    // Marked equity: open bags at their realizable haircut (see realizableMove) — the SAME
    // number the internal equity() risk machinery uses, so the displayed "riding" value and the
    // bot's own sense of where it stands are one and the same. A bag we can't actually sell is
    // capped at cost, so a phantom up-mark on a thin coin can't inflate it. The realized headline
    // is unaffected (it's always at cost).
    const markedOpenVal = state.open.reduce((a, p) => a + p.costSol * p.remFrac * realizableMove(p), 0);
    const markedEquity = state.bank + (state.secured || 0) + markedOpenVal;
    const unrealizedSol = markedOpenVal - deployedCost; // unbanked paper P/L on open bags (haircut)
    return {
      running: running(),
      live: state.live,
      mode: state.mode,
      churn: state.churn,
      maxOpen: state.maxOpen,
      // SELF-ARM: where the bot is on the "ready to trade" curve. armState: warming|probe|armed.
      readiness: state.readiness ? Math.round((Number(state.readiness.score) || 0) * 100) : null,
      readinessLabel: state.readiness ? state.readiness.label : null,
      armState: state.armState || null,
      armFloorPct: Math.round((Number.isFinite(state.armFloor) ? state.armFloor : 0.55) * 100),
      tape: state.tune ? state.tune.tape : null,
      betMult: state.tune ? state.tune.sizeMult : 1,
      wallet: state.walletPubkey,
      // Display baseline = the PnL basis (real starting balance live / budget paper), so "start"
      // and pnl% are coherent. The raw deploy budget is exposed separately as stakeBudget.
      start: round(basis),
      stakeBudget: state.start,
      bank: round(state.bank),
      walletSol: state.walletSol == null ? null : round(state.walletSol),
      secured: round(state.secured || 0),
      lockGainsContinue: Boolean(state.lockGainsContinue),
      lockedBankedSol: round(state.lockedBankedSol || 0),
      vault: state.vault ? state.vault.destination : null,
      // HEADLINE = realized-anchored (open bags at cost) — the consistent "where am I" number.
      equity: round(realizedEquity),
      peak: round(state.peak),
      pnlPct: round(((realizedEquity / basis) - 1) * 100, 2),
      // SECONDARY = marked / unrealized, clearly separate so it's never mistaken for the result.
      markedEquity: round(markedEquity),
      markedPnlPct: round(((markedEquity / basis) - 1) * 100, 2),
      unrealizedSol: round(unrealizedSol, 4),
      openValueSol: round(markedOpenVal, 4),
      wins: state.wins,
      losses: state.losses,
      scratches: state.scratches || 0,
      sourceStats: Object.fromEntries(Object.entries(state.sourceStats || {}).map(([k, v]) => [k, { ...v, pnl: round(v.pnl || 0, 4) }])),
      blocked: state.blocked || 0,
      streak: state.streak,
      open: state.open.map((p) => {
        // REALIZABLE move shown per position — NOT the optimistic curve mark. Same haircut as the
        // marked equity and the internal equity() (60% of the upside, full downside, capped at COST
        // when the bag isn't actually sellable). This is the fix for "it shows +27% but no way am I
        // up that": the % is now what you could BANK selling now, not the phantom thin-curve mark.
        const mv = realizableMove(p);
        return { sym: p.sym, mint: p.mint, source: p.source || "fresh", copyTier: p.copyTier || null, costSol: round(p.costSol), remFrac: p.remFrac, movePct: round((mv - 1) * 100, 2), heldS: Math.round((now() - p.openedAt) / 1000) };
      }),
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

      // Roll the 24h risk-day anchor for the rolling-daily circuit-breaker (riskBrake): a long
      // set-and-sleep run gets a FRESH daily loss budget each day instead of one lifetime cap, so a
      // bad day pauses new entries but the next day resumes (never "stuck off" — it keeps hunting).
      {
        const nowMs = now();
        if (nowMs - (state.dayAnchorAt || state.startedAt || nowMs) >= 24 * 60 * 60 * 1000) {
          state.dayAnchorAt = nowMs;
          state.dayAnchorEquity = equity(state);
        }
      }

      await manageExits();
      const eq = equity(state);
      if (eq > state.peak) state.peak = eq;

      // BANK-THE-PEAK RATCHET (always on, no toggle): the #1 fix for "up +12%/+20%
      // then bled to the -20% cap". Track the TOTAL-equity peak (working + already
      // vaulted, so vault sweeps don't look like a giveback). Once the session has
      // peaked >= +8%, never let it give back more than HALF that gain — flatten and
      // bank the green. (e.g. peak +20% -> locks ~+10% instead of bleeding to -20%.)
      // BANK-THE-PEAK RATCHET (HARD STOP — the protection that prevents "+29% peak bled
      // to the -35% loss cap"). peakTotal is a HIGH-WATER mark (only goes up — never
      // re-anchored down; re-anchoring down was the bug that let a green peak round-trip
      // into a deep loss). Once the session has peaked >= +10%, if it gives back HALF that
      // gain while still green, FLATTEN AND STOP — bank the green, end the run. The profit
      // vault (if set) has already been sweeping gains to safety while running; this is the
      // backstop that locks the rest. Come back green and restart to keep going.
      const totalEq = eq + (state.secured || 0);
      if (totalEq > (state.peakTotal || state.start)) state.peakTotal = totalEq;
      {
        const base = state.lockBase || state.start;
        const peakGain = (state.peakTotal || base) - base;
        if (peakGain >= base * 0.10) {
          const floor = base + peakGain * 0.5; // give back at most half the peak gain
          if (totalEq <= floor && totalEq >= base * 1.02) {
            if (state.lockGainsContinue) {
              // BANK & KEEP GOING: realize the open bags so the green is booked, ratchet the
              // protected floor UP to the banked level, and continue hunting. If a profit
              // vault is set, the booked profit sweeps to the safe wallet on the next slow
              // tick. The banked green can never round-trip; the session keeps running.
              await flatten("locked-gains-bank");
              const eqNow = equity(state);
              const totalNow = eqNow + (state.secured || 0);
              state.lockedBankedSol = round((state.lockedBankedSol || 0) + (totalNow - base), 4);
              state.lockBase = totalNow;   // ratchet the protected baseline up
              state.peakTotal = totalNow;  // fresh peak from the banked level
              state.peak = eqNow;
              record("info", `🔒 Banked +${round((totalNow / state.start - 1) * 100, 1)}% (locked ${round(totalNow - base, 4)} SOL · ${state.lockedBankedSol} SOL secured this run) — re-baselined and CONTINUING. Your gains are protected; hunting again.`);
            } else {
              record("info", `🔒 Locked gains: peak +${round((state.peakTotal / base - 1) * 100, 1)}% gave back half → banked +${round((totalEq / base - 1) * 100, 1)}% and STOPPED (never round-trip a green session).`);
              await stop("locked-gains");
              return;
            }
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

  // PROFIT VAULT sweep — bank realized profit above the working stake to the safe wallet.
  // Used both on the slow loop (continuous, keep trading the stake) and as a FINAL sweep on
  // session end (so the last batch of profit is banked, not left in the hot wallet). Keeps
  // the FULL balance you started with (max(start, vaultFloor)) + a fee buffer; only profit
  // above that is ever swept, so principal is never touched. Counts consecutive failures so
  // a bad address / RPC outage escalates to a visible warning instead of silently dropping.
  async function doVaultSweep(opts = {}) {
    if (!(state && state.vault && state.vault.destination && state.live)) return 0;
    if (opts.final || opts.manual || !Number.isFinite(state.walletSol)) {
      try {
        const ws = await getWalletSol();
        if (Number.isFinite(ws) && ws >= 0) {
          state.walletSol = ws;
          if (state.vaultFloor == null) state.vaultFloor = ws;
          if (state.open.length === 0) { state.bank = ws; if (state.equityBasis == null) state.equityBasis = ws + (state.secured || 0); }
        }
      } catch {}
    }
    if (!Number.isFinite(state.walletSol)) return 0;
    const keep = Math.max(state.start, state.vaultFloor || 0);
    const buffer = 0.02;               // leave a little for trade fees
    // Final (session-end) and manual ("bank now") sweeps bank even small leftover profit —
    // the slow-loop sweep keeps dry powder; these don't need to. Only the fee buffer stays.
    const minSweep = (opts.final || opts.manual) ? 0.005 : (state.vault.minSweep || 0.05);
    const excess = state.walletSol - keep - buffer;
    if (excess < minSweep) return 0;
    try {
      const res = await sweepProfit(state.vault.destination, excess);
      if (res && res.ok) {
        const sent = Number(res.sentSol) || excess;
        state.secured = (state.secured || 0) + sent;
        state.vaultFails = 0;
        record("info", `🏦 Vault: secured +${round(sent, 4)} SOL (total ${round(state.secured, 4)} SOL safe)${opts.final ? " — final bank on session end" : opts.manual ? " — manual bank" : ""}`);
        try { const ws2 = await getWalletSol(); if (Number.isFinite(ws2) && ws2 >= 0) { state.walletSol = ws2; state.bank = ws2; } } catch {}
        return sent;
      } else {
        state.vaultFails = (state.vaultFails || 0) + 1;
        record(state.vaultFails >= 3 ? "warn" : "info", `vault sweep skipped: ${(res && res.error) || "send failed"}${state.vaultFails >= 3 ? ` — ⚠️ ${state.vaultFails} in a row; verify the safe-wallet address / RPC` : ""}`);
      }
    } catch (e) {
      state.vaultFails = (state.vaultFails || 0) + 1;
      record("warn", `vault sweep error: ${e && e.message}`);
    }
    return 0;
  }

  // Manual "bank profit now" — sweep gains above the stake on demand without stopping the
  // session. Returns the SOL swept (0 if nothing was above the floor).
  async function sweepNow() {
    if (!running()) return { ok: false, error: "not running", swept: 0 };
    if (!(state.vault && state.vault.destination)) return { ok: false, error: "no safe wallet set", swept: 0 };
    if (!state.live) return { ok: false, error: "paper session", swept: 0 };
    const swept = await doVaultSweep({ manual: true });
    await savePoint();
    return { ok: true, swept: round(swept || 0, 4), secured: round(state.secured || 0, 4) };
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
            // Capture the starting wallet balance once — the vault floor.
            if (state.vaultFloor == null) state.vaultFloor = ws;
            // Reconcile the cash ledger to the REAL wallet ONLY when FLAT. Then ws is pure cash and
            // can't double-count a held bag's cost (deployedCost is added on top in equity/status).
            // While positions are open we trust the synthetic ledger (debited on buy at openPosition,
            // credited on sell at finalize) — it's immune to on-chain settlement lag, which was
            // inflating equity (full wallet still showed the just-spent SOL while the bag also
            // counted). Going flat snaps bank back to truth, absorbing any fee/slippage drift.
            if (state.open.length === 0) {
              state.bank = ws;
              // Lock the PnL basis to the real starting balance the first time we're flat with a
              // known wallet — so the headline reads "money change since start", never a phantom.
              if (state.equityBasis == null) state.equityBasis = ws + (state.secured || 0);
            }
          }
        } catch {}
      }

      // PROFIT VAULT: sweep realized profit above the working stake to the safe wallet and
      // keep trading the stake. Gains physically leave the hot wallet, so a cold streak can
      // never claw them back. (Shared helper — also runs as a final bank on session end.)
      await doVaultSweep();

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
        // One-time entry anchor: lock the basis to the FIRST live read (same source as every tick
        // after), within a few seconds of opening, so a fresh position starts at ~0% — no phantom
        // "instantly up" from a scan-vs-live mismatch. The time guard avoids hiding a real move if
        // the first read is unusually late.
        if (pos.anchorPending) {
          pos.anchorPending = false;
          if (now() - pos.openedAt < 6000) { pos.entryMc = mc; if (liq > 0) pos.entryLiq = liq; }
        }
        pos.lastMc = mc; // RAW latest — the stop / rug / TP exits read this so they stay maximally responsive
        // Median-smoothed mark for DISPLAY ONLY: a single thin-curve phantom tick (one tiny buy/sell
        // that jerks the marked cap) can no longer make the shown % jump up or down — it takes a
        // SUSTAINED move (≥3 of the last 5 reads) to move the displayed number. Exits stay on raw
        // lastMc so a real crash still trips the stop instantly. (This is the actual "median-smoothed
        // pos.lastMc" the display comment always promised but never had.)
        (pos.mcSamples = pos.mcSamples || []).push(mc);
        if (pos.mcSamples.length > 5) pos.mcSamples.shift();
        const _sorted = pos.mcSamples.slice().sort((a, b) => a - b);
        pos.dispMc = _sorted[Math.floor(_sorted.length / 2)];
        if (liq > 0) pos.lastLiq = liq;
        pos.missed = 0;
        const movePct = pos.entryMc > 0 ? (pos.lastMc / pos.entryMc - 1) * 100 : 0;
        // Cap recorded peak at +900% so a phantom marketCap spike (unsellable) can't set
        // a fake peak that flashes a "4200% win" or skews the trailing/learning stats.
        pos.peakPct = Math.max(pos.peakPct || 0, Math.min(movePct, 900));
      } else {
        pos.missed = (pos.missed || 0) + 1;
      }
      // RUG-FLOW TRIPWIRE (insider-launch machine): the coin doesn't have to last — when the host's
      // flow watcher sees a MAIN PUMPER (a linked alt / top accumulator) EXIT its position, we bail
      // 100% ahead of the rug. (NOT the creator's early bait-flip — that head-fake is filtered host-
      // side.) Checked before the normal ladder so it always wins. Fast cache lookup.
      if ((pos.insider || pos.rugWatch) && pos.devWallet && !pos.devDumpHandled) {
        let dumped = false;
        try { dumped = await devSold(pos.mint, pos.devWallet); } catch {}
        if (dumped) {
          pos.devDumpHandled = true;
          record("warn", `🚨 rug-flow tripwire: ${pos.sym} — a main pumper is dumping, exiting 100% ahead of the rug`);
          await doSell(pos, 100, "rug-flow");
          continue;
        }
      }
      // POP MC-SCALED TARGET: bank 100% when the move hits the entry-MC-scaled ceiling (higher MC banks
      // a smaller multiple, lower MC rides bigger). The fast tp1 ladder already locked the bulk; this
      // closes the riding tail at the right ceiling for its market cap.
      if (pos.pop && pos.popMoonTarget && mc > 0) {
        const mvT = pos.entryMc > 0 ? (mc / pos.entryMc - 1) * 100 : 0;
        if (mvT >= pos.popMoonTarget) {
          record("info", `🎯 pop target ${pos.sym} +${mvT.toFixed(0)}% (ceiling for $${Math.round(pos.entryMc)} MC) — banking`);
          await doSell(pos, 100, "pop-target");
          continue;
        }
      }
      // POP EXIT CONTROL — ride for a REAL, fee-clearing move; never scratch-bank a +1% (that's a net
      // LOSS after ~5-10% round-trip fees). Two ways out besides the ladder (tp1 +30% / moon 100-150%)
      // and the stop: a TRAILING LOCK (it ran a fee-clearing amount, then gives back from its peak →
      // bank the move) and a STAGNATION CUT (the pop fizzled and never cleared fees → exit the
      // non-runner near breakeven instead of bleeding to the stop — "good if it sees it's not going").
      if (pos.pop && !pos.popFadeHandled && mc > 0) {
        const mv = pos.entryMc > 0 ? (mc / pos.entryMc - 1) * 100 : 0;
        pos.popPeakMove = Math.max(pos.popPeakMove || 0, mv);          // best gain seen since entry
        const inflow = (() => { try { return Number(popInflow(pos.mint)) || 0; } catch { return 0; } })();
        if (inflow > (pos.popPeakInflow || 0)) pos.popPeakInflow = inflow;
        const inflowDead = (pos.popPeakInflow || 0) >= 0.3 && inflow < pos.popPeakInflow * 0.35;
        const heldS = (now() - (pos.openedAt || now())) / 1000;
        // TRAILING LOCK: once it's run a real, fee-clearing amount (≥+15%), bank when it gives back ~a
        // third from the peak — lock the move instead of round-tripping a winner back to flat.
        if ((pos.popPeakMove || 0) >= 15 && mv <= (pos.popPeakMove || 0) * 0.66) {
          pos.popFadeHandled = true;
          record("info", `🔒 pop-lock: ${pos.sym} +${mv.toFixed(0)}% (peaked +${(pos.popPeakMove || 0).toFixed(0)}%) — banking the move`);
          await doSell(pos, 100, "pop-fade");
          continue;
        }
        // STAGNATION CUT: the pop's buying has died AND it never cleared fees (peaked under +15%) after a
        // fair look — exit the non-runner now rather than drift down to the stop. Holds at least ~18s so
        // a slow-building pop still gets its chance to run.
        if (inflowDead && heldS >= 18 && (pos.popPeakMove || 0) < 15) {
          pos.popFadeHandled = true;
          record("info", `🌫️ pop-fizzle: ${pos.sym} ${mv >= 0 ? "+" : ""}${mv.toFixed(0)}% — pop died without a real move, exiting the non-runner`);
          await doSell(pos, 100, "pop-fade");
          continue;
        }
        // else HOLD — let it run toward tp1 (+30%) / moon (100-150%); the -12% stop guards the downside.
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

    // Book the REAL SOL received when live (the actual fill). This is THE fix for
    // "log shows +0.48 wins but the wallet is down": a moon bag marked at +480% that
    // really fills at +40% must book +40%, so win/loss counts, the ledger, the peak, and
    // the learning data all reflect what the wallet actually got.
    // Phantoms are fake GAINS, not losses. When live and the swap didn't report a fill
    // amount: only DISTRUST a large marked GAIN (an unsellable spike on thin liquidity, e.g.
    // +729% on a $3k coin) — book ~breakeven for that sold portion so no phantom win inflates
    // the ledger/peak. Losses and modest moves are trustworthy (no phantom risk), so book the
    // estimate — otherwise a real -27% exit was being written off as a full -100% loss.
    // Either way the 5s wallet reconcile sets the bank to the true balance.
    const estProceeds = pos.costSol * portionOfOriginal * (1 + move / 100) * SELL_FEE_FACTOR;
    let proceeds;
    if (failedTerminal) proceeds = 0;
    else if (realProceeds != null) proceeds = realProceeds;
    else if (state.live && move > 25) {
      proceeds = pos.costSol * portionOfOriginal; // ~breakeven on the unconfirmed portion
      record("warn", `${pos.sym} ${reason}: +${round(move, 1)}% marked but no on-chain fill — booking ~breakeven (no phantom win); wallet reconcile confirms.`);
    } else {
      proceeds = estProceeds;
    }
    state.bank += proceeds;
    pos.realized = (pos.realized || 0) + proceeds;

    // Count a WIN only when booked proceeds clear the entry cost by a real, FEE-CLEARING
    // margin (>=4%). Recovering by a hair (+0.0003 SOL) is NOT a win — buy+sell fees ate
    // it, so it's a scratch. Counting those as wins is what made "3W/1L" show while the
    // wallet bled. Honest accounting: a win must actually put SOL in your pocket.
    if (!pos.countedWin && pos.realized >= pos.costSol * 1.04) {
      markWin(pos);
      record("info", `✅ ${pos.sym} IN PROFIT — locked +${round(pos.realized - pos.costSol, 4)} SOL (moon bag still riding)`);
    }

    if (pct >= 100 || frac >= 1 || failedTerminal) {
      // Closing the position.
      pos.remFrac = 0;
      finalizePosition(pos, failedTerminal ? `${reason}-failed` : reason);
    } else {
      pos.remFrac = pos.remFrac * (1 - frac);
      if (reason === "tp1") pos.tp1Done = true;
      else if (reason === "copy-tp1") { pos.tp1Done = true; pos.copyTp1Done = true; }
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
    // A win breaks the loss cluster -> clear the de-risk counter AND any active cooldown (resume).
    state.consecLosses = 0;
    state.consecHaltUntil = 0;
    if (state.results.length > 40) state.results.shift();
  }
  function markLoss(pos) {
    state.losses += 1;
    state.results.push("L");
    state.streak = state.streak <= 0 ? state.streak - 1 : -1;
    // RISK BRAKE: count real losses in a row; a cluster trips a real cool-off on NEW entries
    // (exits keep running). Longer + harder than the 90s chop nudge — this is the survival stop.
    state.consecLosses = (state.consecLosses || 0) + 1;
    if (state.riskHalts && state.consecLosses >= (state.consecLossLimit || 4) && (!state.consecHaltUntil || now() > state.consecHaltUntil)) {
      state.consecHaltUntil = now() + (state.consecCooldownMs || 15 * 60_000);
      record("warn", `🧯 ${state.consecLosses} losses in a row — pausing new entries ~${Math.round((state.consecCooldownMs || 900000) / 60000)}m (exits stay live).`);
    }
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
      state.recentSells[pos.mint] = { at: now(), mc: Number(pos.lastMc || pos.entryMc) || 0, reason };
      record("warn", `⚠️ ${pos.sym} entry didn't fill (${reason}) — not a trade, freeing slot`);
      return;
    }
    const net = totalProceeds - pos.costSol;
    // HONEST W/L/scratch. A win must clear fees (>=4% net). A loss is a real net loss
    // beyond the fee deadband (<=-2.5%). Everything between is a SCRATCH — fees ate it —
    // and counts as neither a win nor a loss so the panel reflects reality, not fee-churn.
    const win = pos.countedWin || net >= pos.costSol * 0.04;
    const realLoss = net <= -pos.costSol * 0.025;
    if (win) {
      if (!pos.countedWin) markWin(pos);
      state.coinWins[pos.mint] = (state.coinWins[pos.mint] || 0) + 1; // proven winner → earns dip-rebuys
    } else if (realLoss) {
      markLoss(pos);
      state.coinLosses[pos.mint] = (state.coinLosses[pos.mint] || 0) + 1; // remember repeat losers
      bumpSymLoss(pos.sym);                                                  // remember losing NAMES (clone swarms)
    } else {
      // SCRATCH — near-breakeven; fees roughly cancelled it. Track it (so the bleed is
      // visible) but don't poison W/L. Repeat-scratch coins still get a cooldown.
      state.scratches = (state.scratches || 0) + 1;
      state.coinLosses[pos.mint] = (state.coinLosses[pos.mint] || 0) + 1;
      bumpSymLoss(pos.sym);
    }
    state.recentSells[pos.mint] = { at: now(), mc: Number(pos.lastMc || pos.entryMc) || 0, reason, win };
    const pnl = net;
    const source = pos.source || "fresh";
    state.sourceStats = state.sourceStats || {};
    const ss = state.sourceStats[source] || { n: 0, wins: 0, losses: 0, scratches: 0, pnl: 0 };
    ss.n += 1;
    if (win) ss.wins += 1;
    else if (realLoss) ss.losses += 1;
    else ss.scratches += 1;
    ss.pnl = round((ss.pnl || 0) + pnl, 6);
    state.sourceStats[source] = ss;
    // Feed the self-tuner: recent peaks + rug flags.
    state.recentPeaks.push(Math.round(pos.peakPct || 0));
    if (state.recentPeaks.length > 30) state.recentPeaks.shift();
    state.recentRugs.push(/rug/.test(reason) || pnl <= -pos.costSol * 0.5);
    if (state.recentRugs.length > 30) state.recentRugs.shift();
    state.recentPnl = state.recentPnl || [];
    state.recentPnl.push(pnl); // realized net per closed trade -> feeds the net-PnL bleed brake
    if (state.recentPnl.length > 20) state.recentPnl.shift();
    const outcomeIcon = win ? "✅" : realLoss ? "🔴" : "⚪";
    const outcomeWord = win ? "WIN" : realLoss ? "LOSS" : "scratch (fees)";
    record(realLoss ? "warn" : "info", `${outcomeIcon} ${pos.sym} CLOSE ${reason} ${outcomeWord} ${pnl >= 0 ? "+" : ""}${round(pnl, 4)} SOL`);

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
          win, rugged, reason, source, copyTier: pos.copyTier || null, copyEdge: pos.copyEdge ?? null,
          signals: pos.signalFlags || null,   // which hard signals fired at entry (signal-EV learning)
          mode: state.mode, churn: state.churn, paper: !state.live, at: now()
        });
      } catch {}
    }
    // Win card trigger: BIG REALIZED wins only — what actually BANKED, not a phantom peak that
    // never filled. The old gate used pos.peakPct (the marked high), so a coin that flashed +400%
    // on a thin curve but was sold for +12% still screamed "4x monster win" — exactly the "it says
    // I got a 4x I never got close to" bug. Gate + report on the REALIZED multiple instead.
    const realizedPct = pos.costSol > 0 ? (totalProceeds / pos.costSol - 1) * 100 : 0;
    if (win && realizedPct >= 100) {
      const winData = {
        symbol: pos.sym,
        mint: pos.mint,
        gainPct: Math.round(realizedPct),
        multiple: Math.round((totalProceeds / Math.max(pos.costSol, 1e-9)) * 10) / 10,
        entryMc: Math.round(pos.entryMc),
        peakMc: Math.round(pos.entryMc * (1 + (pos.peakPct || 0) / 100)),
        peakPct: Math.round(pos.peakPct || 0),
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
    // SCALP prefers the LIQUID last-hour feed (real depth → realizable marks). But the last-hour
    // window is often thin, so rather than sit idle forever it FALLS BACK to the fresh feed and
    // trades those with its fast in/out exits — a trading scalp beats a waiting one. (The honest
    // realized-anchored display keeps phantom dust marks out of the headline regardless.)
    const useLiquid = state.mode === "scalp" && typeof getLiquidFeed === "function";
    const usePop = state.mode === "pop" && typeof getPopFeed === "function";
    try {
      rows = usePop ? await getPopFeed() : useLiquid ? await getLiquidFeed() : await getFreshFeed();
      // POP feed can be empty between ignitions — that's correct (no pop = no trade); don't fall back
      // to the fresh feed (that would defeat the whole "only enter on a real pop" point).
      if (useLiquid && (!Array.isArray(rows) || !rows.length)) rows = await getFreshFeed();
    } catch (e) {
      record("warn", `feed error: ${e && e.message}`);
      return;
    }
    if (!Array.isArray(rows)) rows = [];
    if (!rows.length) {
      if (now() - (state.lastScanLogAt || 0) > 45_000) {
        state.lastScanLogAt = now();
        const fsrc = usePop ? "pop" : useLiquid ? "liquid" : "fresh";
        record("info", `🔍 scanning — feed quiet (mode=${state.mode} feed=${fsrc}, 0 candidates right now)`);
      }
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
    // Prune stale momentum-watch entries (a coin we eyed but that didn't hold/return).
    for (const m of Object.keys(state.watching || {})) {
      if (nowMs - (state.watching[m].at || 0) > 60_000) delete state.watching[m];
    }

    // DIVERSIFY: how many times we'll trade the SAME mint in one session before moving on. Scalp
    // recycles liquid movers, so allow a couple recycles — but cap it so the bot spreads across
    // DIFFERENT coins instead of churning one or two ("it only traded 2 coins"). Re-entry cooldown
    // is also longer for scalp so a just-sold coin doesn't immediately jump back to the front.
    // DIVERSIFY vs REBUY-WINNERS: cap same-coin churn so it doesn't spam the same old pairs, BUT
    // a coin that has WON for us this session earns extra re-entries — so it can buy a dip on a
    // proven winner and trade it again (the wave cooldown below makes it wait for the pullback, not
    // rebuy the top). Meh/losing coins keep the tight cap.
    const maxFor = (mint) => repeatBudgetForMint(state, P, mint);
    const reentryCoolMs = P.liquid ? 120_000 : 45_000;
    const nameCoolMs = symbolCooldownMs(P);
    const scoredAll = rows
      .filter((r) => r && r.tokenMint && !held.has(r.tokenMint))
      .filter((r) => !(state.unbuyable && state.unbuyable.has(r.tokenMint)))   // skip coins that already failed the buy (Token-2022 etc.)
      .filter((r) => (state.coinLosses[r.tokenMint] || 0) < 2)  // stop re-aping a repeat loser
      .filter((r) => (state.coinTrades[r.tokenMint] || 0) < maxFor(r.tokenMint)) // DIVERSIFY (winners earn more re-entries)
      .filter((r) => {
        // Wave cooldown: allow re-entry on a coin we sold, but space it out (longer for scalp).
        const last = state.recentSells[r.tokenMint];
        const lastAt = recentSellAt(last);
        if (lastAt && nowMs - lastAt <= reentryCoolMs) return false;
        const wins = Number(state.coinWins[r.tokenMint] || 0);
        const losses = Number(state.coinLosses[r.tokenMint] || 0);
        const lastMc = recentSellMc(last);
        const curMc = Number(r.marketCap) || 0;
        // A winner may earn a re-entry, but only on a real pullback. Otherwise the
        // bot just buys the same pump again after cooldown and gives back the win.
        if (wins > losses && lastMc > 0 && curMc > lastMc * 0.93) return false;
        return true;
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
      .filter((r) => symbolLoserCount(r.symbol) < 3) // CROSS-SESSION: skip serial-rug names (e.g. LONGDOG) that have lost us money 3+ times all-time
      .filter((r) => {
        // PILE-IN guard: clone swarms flood the feed as different mints with the SAME
        // name and get bought repeatedly before any loss registers. Never hold two of
        // the same name at once, and don't re-ape a name immediately after a sell/open.
        const ns = normSym(r.symbol);
        if (state.open.some((p) => normSym(p.sym) === ns)) return false;
        const a = state.recentApeNames[ns];
        return !a || nowMs - a > nameCoolMs;
      })
      .map((r) => ({ r, reject: entryReject(r, P), fs: P.pop ? (Number(r._pop && r._pop.score) || 50) : P.liquid ? liquidScore(r) : P.grind ? grindScore(r) : freshScore(r) }));
    // Reject-reason tally so a persistently-dry feed shows WHY (mc/age/liquidity/score/etc.)
    // — turns "0 passed the bar" into an actionable breakdown in the scan heartbeat.
    const rejTally = {};
    for (const x of scoredAll) { if (x.reject) rejTally[x.reject] = (rejTally[x.reject] || 0) + 1; }
    state.lastRejTally = rejTally;
    const scored = scoredAll
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
    let historyChecks = 0;
    // Per-mint flow cache for FLOW-SURGE acceleration detection (ephemeral; survives across cycles
    // on state, re-created if a restore dropped the Map type). Owned/pruned by flowSurge().
    const flowCache = (state.flowCache instanceof Map) ? state.flowCache : (state.flowCache = new Map());

    // ===== SELF-ARM READINESS — "it starts when it feels it has enough" =====================
    // The bot stays LIVE and learning continuously; this decides WHEN it actually starts taking
    // entries and HOW BIG. Below the arm floor it OBSERVES (keeps feeding the brain) and only takes
    // an occasional tiny PROBE so it keeps sampling live; as readiness climbs it ramps size up to
    // full. autoArm is on by default; set state.autoArm=false to trade immediately (legacy behavior).
    const ready = (() => { try { return getReadiness() || null; } catch { return null; } })() || { score: 1, label: "ready" };
    state.readiness = ready;
    const armFloor = Number.isFinite(state.armFloor) ? state.armFloor : 0.55;
    const autoArm = state.autoArm !== false;
    // POP mode acts on the LIVE radar ignition, not the slow self-learned edge — a real pop is gone in
    // seconds, so it never sits in "warming". (Pop bets are capped tiny at 5% of bank, so this is safe.)
    const armed = !autoArm || P.pop || (Number(ready.score) || 0) >= armFloor;
    // While warming, take ONE tiny learning probe every ~2 min so the data keeps building from real fills.
    const probeNow = autoArm && !armed && (nowMs - (state.lastProbeAt || 0) > 120_000);
    // Size ramp: just-armed → 45% size, full confidence (score 1) → 100%. Probes use the floor size.
    const readyMult = armed ? Math.max(0.45, Math.min(1, 0.45 + 0.55 * ((Number(ready.score) || 0) - armFloor) / Math.max(0.001, 1 - armFloor))) : 0;
    if (autoArm && !armed && !probeNow) {
      // Not enough learned edge yet — observe + manage exits this cycle, don't open new risk.
      state.armState = "warming";
      if (nowMs - (state.lastWarmLogAt || 0) > 60_000) {   // throttle: don't spam every 5s cycle
        state.lastWarmLogAt = nowMs;
        record("info", `🧠 Warming up — learning the winners + their style (readiness ${Math.round((Number(ready.score) || 0) * 100)}%, arms at ${Math.round(armFloor * 100)}%)`);
      }
      return;
    }
    state.armState = probeNow ? "probe" : "armed";
    if (probeNow) state.lastProbeAt = nowMs;

    // SIT OUT THE CHOP (capital preservation): a COLD tape we're ALSO bleeding into is the
    // death-by-fees trap that turns a flat day red. Pause FRESH sniping for a ~4m cool-off
    // and resume when the tape warms or the timer passes — but KEEP taking smart-money copy
    // entries below (the edge that still works in chop) and keep managing open exits.
    const recentP = (state.recentPnl || []).slice(-8);
    const recentNet = recentP.reduce((a, b) => a + b, 0);
    // Count trailing consecutive losers — the FAST trip so a burst can't bleed 8 trades.
    let lossStreak = 0;
    for (let i = recentP.length - 1; i >= 0; i--) { if (recentP[i] < 0) lossStreak++; else break; }
    // NET-DRAWDOWN trip (tape-agnostic): catches the SCATTERED chop the streak-trip misses —
    // a win sprinkled between losers keeps resetting the streak while the session quietly
    // bleeds (e.g. +4% peak → -2.6%). If the last several closes net materially negative, OR
    // we've given back a real chunk from the session peak, pause regardless of tape.
    const netBleed = recentP.length >= 5 && recentNet < -(state.start * 0.02);
    const peakGiveback = (state.peakTotal || state.start) > state.start &&
      (equity(state) + (state.secured || 0)) <= (state.peakTotal || state.start) - state.start * 0.05;
    // CRITICAL: a pause is a COOLDOWN, then it RESUMES. The bleed signals (recentPnl, peak)
    // don't change while paused (nothing closes), so without this the guard would re-arm
    // every 4m forever and the bot could never trade its way back. Only (re)trip when NEW
    // trades have closed since the last trip — i.e. fresh evidence of bleeding after a resume.
    const closedCount = (state.wins || 0) + (state.losses || 0);
    const freshSincePause = closedCount > (state.chopTrippedAtTrades || 0);
    const trip = freshSincePause && (lossStreak >= 3 || netBleed || (tune.tape === "COLD" && recentP.length >= 5 && recentNet < 0) || (peakGiveback && recentNet < 0));
    if (trip && (!state.chopPauseUntil || nowMs > state.chopPauseUntil)) {
      state.chopPauseUntil = nowMs + 90_000; // short 90s cool-off, then resume — never feel "stopped"
      state.chopTrippedAtTrades = closedCount; // won't re-arm until new trades close
      const why = lossStreak >= 3 ? `${lossStreak} losses in a row`
        : netBleed ? `net ${round(recentNet, 4)} SOL over last ${recentP.length}`
        : peakGiveback ? "gave back from session peak"
        : "COLD + bleeding";
      record("info", `🧊 Chop guard: ${why} — cooling off ~3m, then resuming. Smart-money copies + exits stay live.`);
    }
    if (tune.tape === "HOT") state.chopPauseUntil = 0; // tape warmed → resume immediately
    const chopPaused = Boolean(state.chopPauseUntil && nowMs < state.chopPauseUntil);

    // RISK CIRCUIT-BREAKER: a HARD halt (loss-cluster cooldown or the rolling-daily loss stop)
    // pauses ALL new entries this cycle — fresh AND smart-money copy — because rug risk is
    // correlated (a souring tape/cohort hits everything). Exits keep running on the fast loop, so
    // open bags are still managed and capital comes back; opening resumes when it cools / the day
    // rolls. Its sizeMult (the softer two-tier de-risk) is threaded into the bet sizes below.
    const brake = riskBrake(state, nowMs);
    if (brake.openHalt) {
      if (!state.lastBrakeLogAt || nowMs - state.lastBrakeLogAt > 60_000) {
        state.lastBrakeLogAt = nowMs;
        record("info", `🧯 Risk brake: ${brake.reason} — pausing new entries (exits stay live; resumes when it cools / the day rolls).`);
      }
      return;
    }

    let smartRowsForCycle = null;
    if (smartMoneyReady() && !P.pop && state.open.length < maxNow && openedThisCycle < perCycle) {
      try { smartRowsForCycle = await smartMoneyFeed(); } catch (e) { record("warn", `smart-money feed: ${e && e.message}`); smartRowsForCycle = []; }
    }
    const freshCycleCap = Array.isArray(smartRowsForCycle) && smartRowsForCycle.length
      ? Math.max(0, perCycle - 1)
      : perCycle;

    for (const cand of scored) {
      if (chopPaused) break;                            // sitting out the chop — no fresh snipes
      if (state.stopped || now() >= state.endAt) break; // never open after a stop/timer
      if (openedThisCycle >= freshCycleCap) break;       // reserve capacity for live copy rows
      if (looksLikeJunkSymbol(cand.r.symbol)) { state.blocked = (state.blocked || 0) + 1; continue; } // skip obvious junk/spam (SFASFA/Fraudcoin/TEST)
      if (state.open.length >= maxNow) {
        // CAPITAL ROTATION — "don't sit in a dead bag while a better winner is right there." At
        // capacity, dump the weakest DEAD-FLAT position to free a slot for a clearly-stronger setup,
        // so capital chases live momentum instead of decaying in a stagnant coin. Conservative so it
        // never churns fees: only bags held >90s that are FLAT (not winning, not stopped), NOT already
        // banking (tp1) and NOT riding toward a smart-money exit; only swap for a meaningfully higher
        // score; and at most one rotation per ~30s.
        let weak = null;
        if (nowMs - (state.lastRotateAt || 0) >= 30_000) {
          for (const p of state.open) {
            const heldS = (now() - p.openedAt) / 1000;
            const mv = p.entryMc > 0 ? ((Number(p.lastMc) || p.entryMc) / p.entryMc - 1) * 100 : 0;
            if (heldS < 90 || p.tp1Done) continue;                              // fair chance / already working
            if (p.smartExitPct && mv >= p.smartExitPct * 0.5) continue;         // riding toward a smart exit
            if (mv > 8 || mv < -4) continue;                                    // only dead-flat (winners ride, losers hit the stop)
            if (!weak || mv < weak.mv) weak = { p, mv };
          }
        }
        if (!weak || !(cand.fs >= (weak.p.fs || 0) + 8)) break;                 // nothing worth rotating → respect the cap
        record("info", `🔄 Rotate: dump flat ${weak.p.sym} (${round(weak.mv, 1)}%) → stronger ${cand.r.symbol} (${P.liquid ? "ls" : "fs"} ${Math.round(cand.fs)})`);
        try { await doSell(weak.p, 100, "rotate"); } catch (e) { record("warn", `rotate sell failed: ${e && e.message}`); break; }
        state.lastRotateAt = nowMs;
        // slot freed → fall through and open this stronger candidate
      }
      // Within-cycle pile-in guard: don't open a 2nd of the same NAME we just opened
      // this very cycle (a clone can appear multiple times in one feed refresh).
      if (state.open.some((p) => normSym(p.sym) === normSym(cand.r.symbol))) continue;
      // Dev-reputation skip: avoid wallets that have rugged us repeatedly with no
      // runner to show for it (the one rug signal you CAN read — the dev's history).
      const dev = getDevWallet(cand.r.tokenMint);
      const rep = dev ? devReputation(dev) : null;
      if (rep && rep.rugs >= 2 && rep.runners === 0) {
        state.blocked = (state.blocked || 0) + 1; // weak-setup skip — drives the panel's "avoided" clip
        record("info", `🛡️ Avoiding ${cand.r.symbol} — weak setup`);
        continue;
      }
      // Smart-money read — proven-winner wallets / tracked KOLs in the early buyers.
      // Bonus signal: it only bumps conviction, it never gates entry (main scan rules).
      const sm = smartMoney ? smartMoney(cand.r.tokenMint) : null;
      // Caller intel — a proven Telegram caller/channel called this coin (front-run the
      // crowd that follows good alpha). Pure bonus conviction; sample-gated + bounded.
      const ciRec = callerIntel ? callerIntel(cand.r.tokenMint) : null;
      const ci = ciRec && ciRec.signal ? ciRec.signal : null;
      // STANDOUT-SIGNAL SNIPE GATE: only ape a fresh launch that shows a hard-to-fake standout signal
      // (notable X / trusted TG caller / proven dev / proven-winner early buyer), OR-gated. Faceless
      // dust with no signal is skipped here — this is what separates "snipe the standouts" from
      // "ape every launch". We record which signals fired so we learn which actually predict winners.
      let snipeRec = null;
      if (P.snipe) {
        snipeRec = snipeSignalScore(cand.r, rep, sm, ci);
        if (snipeRec.score < P.minSnipe) {
          state.blocked = (state.blocked || 0) + 1;
          continue;
        }
        record("info", `🎯 SNIPE ${cand.r.symbol} — signals [${Object.keys(snipeRec.signals).join(",") || "?"}] score ${Math.round(snipeRec.score)}`);
      }
      // Conviction = confluence of proven-dev rep + buy flow + freshness + score + smart money + caller intel.
      cand.r._flowSurge = flowSurge(flowCache, cand.r.tokenMint, cand.r, nowMs);   // acceleration bonus (#5)
      const conv = convictionMult(cand.r, rep, sm, ci, { unprovenCap: P.unprovenConvCap, provenCap: P.provenConvCap, scalp: P.liquid, weights: state.signalWeights });
      if (sm) record("info", `🐳 smart money on ${cand.r.symbol} — ${sm.kol ? "KOL " : ""}${sm.winners || 0} winner-wallet(s) → conv ${conv.toFixed(2)}`);
      if (ci && ci.trusted) record("info", `📣 caller intel on ${cand.r.symbol} — ${ci.reason} (+${ci.convictionDelta.toFixed(2)} conv) → conv ${conv.toFixed(2)}`);
      // ADAPTIVE QUALITY GATE (smarter picks): when the tape is risky, take ONLY the
      // highest-confluence setups; stay permissive when it's hot/warming so runners
      // aren't missed. This is what makes it "best picks per situation" instead of
      // aping everything into a dumping tape.
      const minConv = tune.tape === "COLD" ? 0.95 : tune.tape === "NORMAL" ? 0.7 : 0;
      if (conv < minConv && !P.pop) continue;   // POP is pre-vetted by the live radar — generic conviction comps can't see the ignition
      // MOMENTUM CONFIRMATION: an unproven, NON-elite setup must show SUSTAINED strength —
      // still passing the bar on a 2nd scan within 30s with its MC holding (not already
      // fading) — before we ape. This kills the marginal fs 61-67 burst-churn that bleeds a
      // session (the log showed PvP/CHAIRS/MANNN/SNDK all scratching/stopping). It applies
      // in COLD tape OR for any marginal score (fs < 72) in any tape; ELITE setups (fs 72+),
      // proven-dev history, or smart-money plays still enter instantly so real runners and
      // the strongest fresh movers are never missed. Also re-confirms a coin that already
      // stopped us this session (coinLosses>0) so we stop instantly re-aping a chopper.
      // A passing SNIPE candidate counts as PROVEN: the standout signal (notable X / trusted caller /
      // proven dev / winner early-buyer) IS the reason to buy, so it OVERRIDES the generic red-tape
      // comps veto (historyGateReject) + the momentum re-confirm — exactly like a proven copy. Without
      // this, live logs showed notable-X snipes ('🎯 SNIPE … signals [x]') getting 'history-fail'
      // skipped in a red tape and never buying. The tight stop + de-risk-trail + rug-flow tripwire are
      // the protection here, not the comps veto.
      // POP candidates are PRE-VETTED by the live radar (real accel + buy-share + unique-buyer ignition),
      // so — exactly like a proven snipe/copy — they OVERRIDE the local-replay comps veto (history-fail)
      // and the 30s momentum re-confirm. Live logs proved this was the no-buy bug: AURORY ignited at
      // score 100 and got "Skipping … local replay history-fail" because the radar's confirmation was
      // invisible to the generic unproven-coin gauntlet. The tiny 5%-bank bet + pop-fade/MC-scaled exits
      // are the protection here, not the comps veto (which can't see a coin that's seconds old).
      const proven = (rep && rep.runners >= 1 && rep.rugs === 0) || (sm && (sm.kol || sm.winners >= 2)) || (ci && ci.trusted) || (P.snipe && snipeRec && snipeRec.score >= P.minSnipe) || Boolean(P && P.pop);
      // FUNDING-GRAPH CLUSTER RUG FILTER (Brain 4): when a coin's early buyers concentrate in ONE
      // funding source it's a coordinated insider net behind a "clean" chart. Extreme concentration
      // on an UNPROVEN coin → skip (don't donate to the rug). Lesser concentration → shrink the bet.
      // No-op when we haven't mapped enough funders (cr === null), so it never starves the feed.
      const cr = clusterRisk ? clusterRisk(cand.r.tokenMint) : null;
      if (cr && cr.risk >= 0.85 && !proven) {
        state.blocked = (state.blocked || 0) + 1;
        rejTally.cluster = (rejTally.cluster || 0) + 1;
        state.lastRejTally = rejTally;
        record("info", `🕸️ Avoiding ${cand.r.symbol} — insider cluster (${cr.reason})`);
        continue;
      }
      const clusterMult = cr && cr.risk > 0 ? Math.max(0.5, 1 - cr.risk * 0.4) : 1;
      // SCALP scores on the liquidScore scale (top setups ~45-80). A liquid, buy-led mover's real
      // depth + scalp's tight 7% stop / fast ~14% bank already handle the risk confirmation guards
      // against — so a solid scalp setup (>=44, a clearly buy-led in-band mover) enters INSTANTLY.
      // This is also the "it only traded 2 coins" fix: a higher bar meant only the 1-2 persistent
      // deep coins ever cleared instant entry while transient distinct movers timed out waiting for
      // a 30s re-confirm. A lower instant bar + the per-coin diversify cap spreads trades across
      // MANY more coins. Only marginal setups (22-44) or ones we already traded/lost get one confirm.
      if (!proven && historyChecks < 8 && typeof entryHistory === "function") {
        historyChecks += 1;
        let history = null;
        try { history = await entryHistory(cand.r); } catch {}
        const historyReject = historyGateReject(history);
        if (historyReject) {
          state.blocked = (state.blocked || 0) + 1;
          rejTally[historyReject] = (rejTally[historyReject] || 0) + 1;
          state.lastRejTally = rejTally;
          record("info", `Skipping ${cand.r.symbol || shortMint(cand.r.tokenMint)} - local replay ${historyReject}`);
          continue;
        }
      }
      const elite = P.liquid ? cand.fs >= 44 : cand.fs >= 72;
      const stoppedBefore = (state.coinLosses[cand.r.tokenMint] || 0) > 0;
      const needsConfirm = !proven && (stoppedBefore || tune.tape === "COLD" || !elite);
      if (needsConfirm) {
        const w = state.watching[cand.r.tokenMint];
        const curMc = Number(cand.r.marketCap) || 0;
        if (!w || nowMs - w.at > 30_000) { state.watching[cand.r.tokenMint] = { at: nowMs, mc: curMc }; continue; }
        if (curMc < w.mc * 0.92) { delete state.watching[cand.r.tokenMint]; continue; } // momentum faded → skip
        delete state.watching[cand.r.tokenMint]; // held strong across two reads → take it
      }
      // Readiness ramp: scale entry size by learned confidence; a warming-stage PROBE is floor-size.
      // CONFLUENCE press (#1): when >=2 INDEPENDENT hard signals stack, size up above the conviction
      // cap (still clamped to maxTradeSol) — the gold setups earn the biggest bets.
      const confl = confluenceMult(cand.r, rep, sm, ci, snipeRec);
      let size = Math.max(state.minTradeSol, Math.min(sizeFor(state, P) * conv * confl * clusterMult * readyMult * (brake.sizeMult || 1), state.maxTradeSol));
      // SNIPE BET CAP — moonshot math needs MANY small EVEN bets so a rare 4x pays for the losers; no
      // single snipe may exceed 5% of bank (live proof: one 16%-of-bank snipe ate ~80% of a session loss).
      if (P.snipe || P.pop) size = Math.max(state.minTradeSol, Math.min(size, state.bank * (P.pop ? popBetFrac(cand.r.marketCap) : 0.05)));   // snipe/pop: small even bets; pop scales DOWN on thin low-MC curves (slippage)
      if (probeNow) size = state.minTradeSol;
      if (!canOpen(state, size)) break;
      await openPosition(cand.r, size, cand.fs, dev, rep, sm, P);
      state.lastOpenAt = now();
      openedThisCycle += 1;
      if (probeNow) break;                               // one tiny learning trade, then resume observing
      if (openedThisCycle >= freshCycleCap) break;        // don't machine-gun the whole feed at once
    }

    // SELF-ACTIVATING SMART-MONEY ENTRIES — no toggle. Once the wallet observatory
    // has built up enough proven-winner history on its OWN (paper feeds it 24/7),
    // the bot ALSO starts taking follow plays on coins that tracked winner-wallets /
    // KOLs are buying right now — including ones the fresh-ape scan never surfaced
    // (e.g. higher-MC coins past the freshness gate). Works in paper AND live. The
    // main fresh scan above is completely unchanged; these are pure bonus entries,
    // and every smart-money position still rides the same rug/stop/trailing exits.
    // COPY-TRADE / KOL TRACKER: also enter coins our tracked smart-money wallets / KOLs are buying
    // — the bot uses the whole observatory (thousands of dev + wallet outcomes), not just the
    // momentum scan. LIQUID modes used to opt out (the feed can surface fresh dust); now they take
    // these too but ONLY when the coin has REAL, sellable liquidity (verified below), so a
    // copy-trade can't drag scalp into an unsellable phantom. Non-liquid modes keep the old path.
    if (smartMoneyReady() && !P.pop && state.open.length < maxNow && openedThisCycle < perCycle) {
      let smRows = smartRowsForCycle;
      if (!Array.isArray(smRows)) {
        smRows = [];
        try { smRows = await smartMoneyFeed(); } catch (e) { record("warn", `smart-money feed: ${e && e.message}`); }
      }
      for (const r of (smRows || [])) {
        if (state.stopped || now() >= state.endAt) break;
        if (state.open.length >= maxNow) break;
        if (openedThisCycle >= perCycle) break;
        if (!r || !r.tokenMint || held.has(r.tokenMint)) continue;
        if (state.unbuyable && state.unbuyable.has(r.tokenMint)) continue;   // already failed the buy (Token-2022 etc.)
        if ((state.coinLosses[r.tokenMint] || 0) >= 2) continue; // don't re-ape a repeat loser
        if ((state.coinTrades[r.tokenMint] || 0) >= maxFor(r.tokenMint)) continue; // DIVERSIFY (winners earn more)
        const ns = normSym(r.symbol);
        if (ns) {
          const se = state.symLosses[ns];
          if (se && (se.count >= 2 || nowMs - (se.at || 0) <= 60_000)) continue;
          if (state.open.some((p) => normSym(p.sym) === ns)) continue;
          const lastNameApe = state.recentApeNames[ns];
          if (lastNameApe && nowMs - lastNameApe <= nameCoolMs) continue;
        }
        if (symbolLoserCount(r.symbol) >= 3) continue;
        const last = state.recentSells[r.tokenMint];
        const lastAt = recentSellAt(last);
        if (lastAt && now() - lastAt < 45_000) continue;         // wave cooldown
        const wins = Number(state.coinWins[r.tokenMint] || 0);
        const losses = Number(state.coinLosses[r.tokenMint] || 0);
        const lastMc = recentSellMc(last);
        const curMc = Number(r.marketCap) || 0;
        if (wins > losses && lastMc > 0 && curMc > lastMc * 0.93) continue;
        const dev = getDevWallet(r.tokenMint);
        const rep = dev ? devReputation(dev) : null;
        if (rep && rep.rugs >= 2 && rep.runners === 0) continue;  // dev rug history still vetoes
        const sm = r._smartMoney || (smartMoney ? smartMoney(r.tokenMint) : null);
        if (!sm || !(sm.kol || sm.kolProbe || sm.winners >= 1)) continue;
        if (looksLikeJunkSymbol(r.symbol)) continue;             // don't copy spammy "winners" into obvious junk coins
        // BACKTEST GATE: if the wallets in this coin are validated copy-LOSERS (avg btMult < ~1), don't
        // copy them — the tune proved it bleeds. Untested (edge null) still passes on the live signal.
        if (sm.edge != null && sm.edge < 0.98) continue;
        // LIQUID modes only copy-trade into SELLABLE coins — verify real depth (the feed row may
        // not carry liquidity; confirm via getPairLite) so a copy can't be an unsellable phantom.
        if (P.liquid) {
          let liq = Number(r.liquidityUsd) || 0;
          if (liq < 3000 && typeof getPairLite === "function") {
            try { const pl = await getPairLite(r.tokenMint); liq = Number(pl && pl.liquidityUsd) || 0; if (pl && pl.marketCap) r.marketCap = r.marketCap || pl.marketCap; } catch {}
          }
          if (liq < 3000) continue; // not realizable → skip for liquid modes
        }
        const ciRec = callerIntel ? callerIntel(r.tokenMint) : null;
        const ci = ciRec && ciRec.signal ? ciRec.signal : null;
        r._flowSurge = flowSurge(flowCache, r.tokenMint, r, nowMs);  // acceleration bonus (#5)
        const conv = convictionMult(r, rep, sm, ci, { unprovenCap: P.unprovenConvCap, provenCap: P.provenConvCap, scalp: P.liquid, weights: state.signalWeights });
        const minCopyConv = sm.kolProbe ? 0.5 : 1.0;
        if (conv < minCopyConv) continue;                          // proven copies need confluence; probes stay small
        // EDGE-WEIGHTED SIZING: bet BIGGER when the buying wallets are validated printers (btMult>1),
        // smaller when untested/neutral. Bounded 0.6x–1.6x so one number can't blow the size out.
        const edgeMult = sm.edge != null ? Math.max(0.6, Math.min(1.6, sm.edge)) : 0.85;
        // CONFLUENCE press (#1): stack independent signals -> size up above the conviction cap.
        const confl = confluenceMult(r, rep, sm, ci, null);
        // CLUSTER RUG FILTER (Brain 4): proven wallets are in it so we don't veto, but shrink the bet
        // when this coin's early buyers concentrate in one funder (the rug-flow tripwire covers exit).
        const cr = clusterRisk ? clusterRisk(r.tokenMint) : null;
        const clusterMult = cr && cr.risk > 0 ? Math.max(0.5, 1 - cr.risk * 0.4) : 1;
        let size = Math.max(state.minTradeSol, Math.min(sizeFor(state, P) * conv * confl * clusterMult * readyMult * edgeMult * (brake.sizeMult || 1), state.maxTradeSol));
        if (P.snipe || P.pop) size = Math.max(state.minTradeSol, Math.min(size, state.bank * (P.pop ? popBetFrac(r.marketCap) : 0.05)));   // snipe/pop bet cap; pop scales DOWN on thin low-MC curves (slippage)
        if (!canOpen(state, size)) break;
        record("info", `🐳 copy-trade ${r.symbol || shortMint(r.tokenMint)} @ MC $${Math.round(Number(r.marketCap) || 0)} — ${sm.kolProbe ? "probe " : ""}${sm.winners || 0} winner${sm.edge != null ? ` · edge ${sm.edge}x` : ""}${sm.apeScore != null ? ` · ape ${sm.apeScore}` : ""} → conv ${conv.toFixed(2)}`);
        await openPosition(r, size, P.liquid ? liquidScore(r) : freshScore(r), dev, rep, sm, P);
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
      // When nothing passed, show the reject breakdown (why) so a dry feed is diagnosable.
      const rej = state.lastRejTally || {};
      const rejStr = (!scored.length && Object.keys(rej).length)
        ? ` [${Object.entries(rej).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" ")}]`
        : "";
      record("info", `🔍 scanning (${tune.tape || "warming"}) — ${rows.length} ${P.liquid ? "liquid" : "fresh"}, ${scored.length} passed the bar${scored.length ? `, best ${P.liquid ? "ls" : "fs"} ${best}` : ""}${rejStr}; holding for a clean setup`);
    }
  }

  async function openPosition(row, sizeSol, fs, dev, rep, sm, P = null) {
    if (!state || state.stopped) return; // never open once stopped
    const mint = row.tokenMint;
    const sym = row.symbol || row.baseToken?.symbol || shortMint(mint);
    let entryMc = Number(row.marketCap) || 0;
    let entryLiq = Number(row.liquidityUsd) || 0;
    if (entryMc <= 0) return;
    // Start the live pump trade-tick stream for this coin so prices update instantly.
    try { onOpen(mint); } catch {}

    const scanMcReject = executableMcReject({ ...row, marketCap: entryMc }, P, sm);
    if (scanMcReject) {
      record("info", `Skipping ${sym} - executable MC $${Math.round(entryMc)} left the proven band before buy`);
      return;
    }

    // The scan row can be stale by the time a live order is about to fire. Re-read
    // the same mark used for exits and refuse fresh-path entries that are no longer
    // in the proven MC pocket before spending SOL.
    try {
      const lite = await getPairLite(mint);
      const liveMc = Number(lite && lite.marketCap) || 0;
      if (liveMc > 0) {
        const liveReject = executableMcReject({ ...row, marketCap: liveMc }, P, sm);
        if (liveReject) {
          record("info", `Skipping ${sym} - live MC $${Math.round(liveMc)} left the proven band before buy`);
          return;
        }
        entryMc = liveMc;
      }
      const liveLiq = Number(lite && lite.liquidityUsd) || 0;
      if (liveLiq > 0) entryLiq = liveLiq;
    } catch {}

    // PRE-BUY RUG HARD-GATE: an on-chain SlimeShield read (active mint/freeze authority, Token-2022,
    // honeypot-style danger) — the same block the Ogre AI pick surface already runs, which the hunt
    // loop lacked. Only ever PREVENTS a bad buy; never forces one. Fresh-ape semantics: only genuine
    // danger blocks, so a thin-but-clean fresh launch still gets through. The cheap feed-level gate
    // (autopilotRowHasHardDanger) already drops known rugs upstream; this is the authoritative
    // on-chain confirmation right before SOL moves.
    try {
      const gate = await securityGate(row);
      if (gate && gate.danger) {
        noteUnbuyable(state, mint);
        record("warn", `Blocked ${sym} - ${gate.reason || "on-chain rug danger (mint/freeze authority / honeypot)"}`);
        return;
      }
    } catch {}

    let tokenAmount = null;
    if (state.live) {
      const lamports = Math.floor(sizeSol * LAMPORTS_PER_SOL);
      try {
        const res = await buyToken(mint, lamports);
        if (!res || res.ok === false) {
          if (isUnbuyable((res && res.error) || "")) noteUnbuyable(state, mint);   // don't re-attempt an un-buyable coin
          record("warn", `buy ${sym} rejected${res && res.error ? `: ${res.error}` : ""}`);
          return;
        }
        tokenAmount = res.tokenAmount || res.outputAmount || null;
      } catch (e) {
        const msg = (e && e.message) || "";
        if (isUnbuyable(msg)) noteUnbuyable(state, mint);   // Token-2022 / no-trusted-pool = permanently un-buyable this session
        record("warn", `buy ${sym} failed: ${msg}`);
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

    // ANCHOR the entry to the REALIZABLE mark right after the fill — read from the SAME live price
    // source the display uses for lastMc (getPairLite). Without this, entry stays the stale SCAN
    // price while lastMc jumps to the post-buy live price (our own buy moved the curve + spread),
    // so a brand-new position shows "instantly up" when it isn't. Anchoring makes it start at ~0%
    // and only show green on a REAL move past entry. Falls back to the scan price if the read fails.
    try {
      const lite = await getPairLite(mint);
      const liteMc = Number(lite && lite.marketCap) || 0;
      if (liteMc > 0) entryMc = liteMc;
      const liteLiq = Number(lite && lite.liquidityUsd) || 0;
      if (liteLiq > 0) entryLiq = liteLiq;
    } catch {}

    const postFillReject = executableMcReject({ ...row, marketCap: entryMc }, P, sm);
    if (postFillReject) {
      if (state.live) {
        try {
          const res = await sellPercent(mint, 100, { mint, tokenAmount });
          if (res && res.ok === false) throw new Error("sell rejected");
          record("warn", `Entry guard sold back ${sym} - post-fill MC $${Math.round(entryMc)} outside proven band`);
          return;
        } catch (e) {
          record("warn", `Entry guard could not sell back ${sym}: ${e && e.message}; tracking position for exits`);
        }
      } else {
        record("info", `Skipping ${sym} - post-fill MC $${Math.round(entryMc)} outside proven band`);
        return;
      }
    }

    state.bank -= sizeSol;
    state.tradeNo += 1;
    const source = sm ? (sm.source || "smart_money") : "fresh";
    const copyTier = sm ? (sm.copyTier || null) : null;
    const copyEdge = sm && sm.edge != null ? Number(sm.edge) : null;
    const tunedCopy = Boolean(sm && source === "winner_follow" && !sm.kolProbe && (sm.copyLadder || sm.kol || (sm.winners || 0) >= 2 || (copyEdge != null && copyEdge >= 1.2)));
    const smartExitPct = sm
      ? (source === "winner_follow"
        ? (sm.learnedExit && sm.exitMult ? Math.max(30, Math.min(400, Math.round((sm.exitMult - 1) * 100 * 0.85))) : null)
        : (sm.exitMult ? Math.max(30, Math.min(400, Math.round((sm.exitMult - 1) * 100 * 0.85))) : sm.kolProbe ? 18 : 35))
      : null;
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
      // The first confirmed live read in manageExits locks the true entry basis (same price source
      // we compare every tick), so a fresh buy can't flash "instantly up" from a source mismatch.
      anchorPending: true,
      missed: 0,
      tp1Done: false,
      tp2Done: false,
      tp3Done: false,
      peakPct: 0,
      realized: 0,
      fs: round(fs, 1),
      source,
      copyTier,
      copyEdge: Number.isFinite(copyEdge) ? copyEdge : null,
      copyLadder: tunedCopy ? TUNED_COPY_LADDER : null,
      // Features captured for the learning flywheel.
      dev: dev || null,
      // This dev's historical avg peak (>=3 trades) drives the adaptive exit.
      devAvgPeak: (rep && rep.trades >= 3 && rep.avgPeak >= 80) ? rep.avgPeak : null,
      entryAge: Number(row.pairAgeSeconds) || null,
      entrySniper: Number(row.sniperCount) || 0,
      entryVol5m: Number(row.volume5m) || 0,
      entryBuys: Number(row.buys5m) || 0,
      entrySells: Number(row.sells5m) || 0,
      // SMART-MONEY / COPY EXIT — "ride the pop, get out before they dump":
      //  • If we've LEARNED the smart wallet's exit (exitMult), bank at ~85% of their typical exit
      //    gain — out just ahead of the earliest one.
      //  • If smart money is in but we DON'T know their exit yet (a KOL / freshly-learned wallet),
      //    still bank the pop fast at a default (+35%) instead of riding into the dump. This is the
      //    "in-and-out, win steady" behavior for copy-trades — they flip fast, so we flip faster.
      //  • No smart money → null → use the normal mode ladder.
      smartExitPct,
      // PHASE 2 — trade the COPIED wallets in THEIR style: if we've learned how long the proven
      // winners on this coin typically hold, cap our hold near that (just under, ×0.9) so we're
      // OUT around when they sell, not riding past them. Bounded 20s..6min for a scalp copy. Stays
      // null until a wallet's hold style has accrued (Phase 1 data), so it's a graceful no-op early.
      smartHoldMs: (sm && sm.holdMsCap > 0) ? Math.max(20_000, Math.min(360_000, Math.round(sm.holdMsCap * 0.9))) : null,
      // INSIDER-LAUNCH machine: a KNOWN/linked wallet DEPLOYED this coin and we got in early. The
      // coin doesn't have to last — the dev-dump tripwire (manageExits) flips us out 100% the instant
      // the creator wallet sells, beating the rug out the door. devWallet = the creator we watch.
      insider: Boolean(row._smartMoney && row._smartMoney.insider),
      devWallet: (row._smartMoney && row._smartMoney.devWallet) || dev || null
    };
    // LEARNING FLYWHEEL (#3): record WHICH hard signals fired at entry so self-calibration can
    // measure each signal's realized EV over time and feed learned weights back into conviction
    // sizing — leaning into the signals that actually predict winners. Pure capture; no behavior
    // change here. caller intel is re-read (cheap map lookup) since it isn't passed into openPosition.
    {
      let ciSig = null;
      try { const ciR = callerIntel ? callerIntel(mint) : null; ciSig = ciR && ciR.signal ? ciR.signal : null; } catch {}
      const bLo = Number(sm && sm.entryMcLo) || 0, bHi = Number(sm && sm.entryMcHi) || 0;
      pos.signalFlags = {
        dev: Boolean(rep && rep.runners >= 1 && rep.rugs === 0),
        kol: Boolean(sm && sm.kol),
        winners: Boolean(sm && sm.winners >= 1),
        caller: Boolean(ciSig && ciSig.trusted),
        x: Boolean(row && (row.xNotable || Number(row.xClout) >= 1)),
        entryBand: Boolean(entryMc > 0 && bLo > 0 && bHi > bLo && entryMc >= bLo && entryMc <= bHi),
        flowSurge: Number(row && row._flowSurge) > 0,
        alpha: Boolean(row && row._smartMoney && row._smartMoney.earlyAlpha),
        grad: graduationScore(row) >= 20
      };
    }
    // PRECURSOR EXITS (Brain 5): copy/smart-money positions get the SAME real-time rug-watch insider
    // launches get — don't race the whale's sell, bail on the operator/cluster DISTRIBUTION precursor.
    // Register the coin's dev/operator so the host's rug-flow tripwire (devSold) can cover this mint.
    if (!pos.insider && sm && (sm.kol || sm.kolProbe || sm.winners >= 1) && pos.devWallet) {
      pos.rugWatch = true;
      try { noteRugWatch(mint, pos.devWallet, sym); } catch {}
    }
    // POP RIDE: mark the position so manageExits can run the momentum-FADE exit (bank into the spike
    // the instant the inflow that drove the pop decelerates) + the MC-SCALED tail ceiling: higher entry
    // MC = a smaller realistic pop, so bank a smaller multiple ("50k 1x is great"); lower MC rides
    // bigger ("10k can 2x easy"). The fast tp1 ladder banks the bulk; this caps where the tail closes.
    pos.pop = Boolean(P && P.pop);
    if (pos.pop) {
      const mcE = pos.entryMc || 0;
      pos.popMoonTarget = mcE >= 50000 ? 90 : mcE >= 25000 ? 110 : mcE >= 10000 ? 130 : 150;   // aim 100-150% (higher MC banks a touch sooner)
      pos.popPeakInflow = (() => { try { return Number(popInflow(mint)) || 0; } catch { return 0; } })();   // peak buy-inflow SINCE ENTRY (fade reference)
    }
    state.open.push(pos);
    state.recentApeNames[normSym(sym)] = now(); // remember the NAME to block clone-swarm pile-ins
    state.coinTrades[pos.mint] = (state.coinTrades[pos.mint] || 0) + 1; // DIVERSIFY: count session trades per mint
    record("info", `🟢 APED ${sym} ${round(sizeSol, 4)} SOL @ MC $${Math.round(entryMc)} (fs ${pos.fs})`);
  }

  // _tick drives one full step (exit pass + hunt pass) for deterministic tests.
  return {
    start, stop, resume, status, snapshot, sweepNow,
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
