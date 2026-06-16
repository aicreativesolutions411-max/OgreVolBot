// Caller Intelligence — the data brain behind "a proven caller just called this".
//
// SlimeWire records every contract address (CA) called in every public Telegram group
// it sits in (who called it, where, the market cap at call time, and the peak it reached
// after). This module is the PURE, testable core that turns that raw call log into:
//   1. an OUTCOME per call (won / lost / flat) by following the coin to its peak, and
//   2. a REPUTATION per caller and per channel (a smoothed, sample-aware win-rate +
//      average multiple), and
//   3. a SIGNAL the autopilot can act on — "this CA was just called by a caller/channel
//      with a proven record" — bounded and gated so a fresh or thin record can't move it.
//
// Everything here is pure (no I/O, no clock) so it is unit-testable and decoupled from
// the monolith. The server feeds it the call records + a clock; it returns verdicts.

// A call "won" when its peak reached this multiple of the entry market cap. 2x is the
// same bar the alpha-call wall uses — a real, bankable move, not noise.
export const WON_MULT = 2;
// A call is "lost" once it's old enough AND has died back to/below this fraction of entry
// (or the coin is gone / unpriceable). Below entry after the window = the call lost money.
export const LOST_MULT = 0.5;
// Time gates: don't judge a call as lost too early (it may still run), and call anything
// that never hit 2x nor died within a day a "flat" (a non-event — neither edge nor loss).
export const LOST_AGE_MS = 60 * 60 * 1000;        // 1h before a below-entry coin is a loss
export const FLAT_AGE_MS = 24 * 60 * 60 * 1000;   // 24h with no 2x and not dead = flat

// Reputation scoring priors. We never trust a raw win-rate: a 1-for-1 caller is not better
// than a 28-for-50 caller. Shrink every win-rate toward the base rate of a 2x with a
// pseudo-count, so confidence grows only with a real sample.
export const BASE_HIT_RATE = 0.15;  // ~prior odds a random fresh-call coin 2x's
export const SHRINK_STRENGTH = 6;   // pseudo-observations of the prior (Bayesian α+β)

// Gate for letting caller-intel influence a trade. Below this many RESOLVED calls we have
// no real read on a caller/channel, so the signal stays neutral regardless of hit-rate.
export const MIN_SAMPLE_FOR_SIGNAL = 8;

function num(v, d = 0) { const n = Number(v); return Number.isFinite(n) ? n : d; }

// Peak multiple a call reached: peakMc / entryMc (>=1 unless it only ever fell).
export function peakMultiple(call) {
  const entry = num(call && call.entryMc);
  const peak = num(call && call.peakMc);
  if (!(entry > 0) || !(peak > 0)) return 0;
  return peak / entry;
}

// Last-seen multiple: where the coin is NOW vs entry. Used to tell a faded runner (won,
// banked) from a coin that round-tripped to death (a loss).
export function lastMultiple(call) {
  const entry = num(call && call.entryMc);
  const last = num(call && call.lastMc);
  if (!(entry > 0)) return 0;
  return last > 0 ? last / entry : 0;
}

// Resolve one call to an outcome given the clock. Returns the fields to MERGE onto the
// call ({ status, outcome, peakX, resolvedAt }) or null if it's still too early to judge
// (keep watching). Idempotent: an already-resolved call returns null (nothing to change).
export function resolveCallOutcome(call, nowMs, opts = {}) {
  if (!call || call.status === "resolved") return null;
  const wonMult = opts.wonMult || WON_MULT;
  const lostMult = opts.lostMult || LOST_MULT;
  const lostAge = opts.lostAgeMs || LOST_AGE_MS;
  const flatAge = opts.flatAgeMs || FLAT_AGE_MS;
  const entry = num(call.entryMc);
  if (!(entry > 0)) return null;                  // no entry mark — can't judge
  const ageMs = nowMs - num(call.firstAt, nowMs);
  const peakX = peakMultiple(call);
  const lastX = lastMultiple(call);

  // WON the moment the peak cleared the bar — banks the call regardless of where it sits
  // now (a +400% caller is right even if it later faded; the call made money).
  if (peakX >= wonMult) {
    return { status: "resolved", outcome: "won", peakX: Math.round(peakX * 100) / 100, resolvedAt: nowMs };
  }
  // LOST once it's had time and has died below the floor (or is unpriceable).
  if (ageMs > lostAge && (lastX <= lostMult || !(num(call.lastMc) > 0))) {
    return { status: "resolved", outcome: "lost", peakX: Math.round(peakX * 100) / 100, resolvedAt: nowMs };
  }
  // FLAT — never ran, never died: a non-event after a full day.
  if (ageMs > flatAge) {
    return { status: "resolved", outcome: "flat", peakX: Math.round(peakX * 100) / 100, resolvedAt: nowMs };
  }
  return null; // still watching
}

// Smoothed (Bayesian) hit-rate: shrinks the raw wins/resolved toward BASE_HIT_RATE with a
// pseudo-count so a tiny sample can't look elite. (wins + α·p0) / (resolved + α).
export function smoothedHitRate(wins, resolved, opts = {}) {
  const a = opts.shrink || SHRINK_STRENGTH;
  const p0 = opts.baseRate != null ? opts.baseRate : BASE_HIT_RATE;
  return (num(wins) + a * p0) / (num(resolved) + a);
}

// Aggregate a set of calls (already filtered to one caller or one channel) into a
// reputation record. flat counts as a resolved non-win (it dilutes hit-rate, correctly —
// a caller who mostly calls nothing-burgers is not a good caller).
export function aggregateReputation(calls, opts = {}) {
  let total = 0, resolved = 0, wins = 0, losses = 0, flats = 0;
  let peakSum = 0, bestPeakX = 0, lastCallAt = 0;
  for (const c of calls || []) {
    total += 1;
    lastCallAt = Math.max(lastCallAt, num(c.firstAt));
    if (c.status === "resolved") {
      resolved += 1;
      const px = num(c.peakX) || peakMultiple(c);
      peakSum += px;
      if (px > bestPeakX) bestPeakX = px;
      if (c.outcome === "won") wins += 1;
      else if (c.outcome === "lost") losses += 1;
      else flats += 1;
    }
  }
  const hitRate = resolved > 0 ? wins / resolved : 0;
  const smoothed = smoothedHitRate(wins, resolved, opts);
  const avgPeakX = resolved > 0 ? peakSum / resolved : 0;
  // Trust score 0..1: smoothed hit-rate weighted up by the average multiple won (a caller
  // whose wins are big 5x's is worth more than one whose wins barely tag 2x), bounded.
  const magnitude = Math.min(1.5, 0.6 + Math.min(avgPeakX, 6) / 10); // ~0.6..1.2
  const score = Math.max(0, Math.min(1, smoothed * magnitude));
  return {
    total, resolved, wins, losses, flats,
    hitRate: Math.round(hitRate * 1000) / 1000,
    smoothedHitRate: Math.round(smoothed * 1000) / 1000,
    avgPeakX: Math.round(avgPeakX * 100) / 100,
    bestPeakX: Math.round(bestPeakX * 100) / 100,
    score: Math.round(score * 1000) / 1000,
    lastCallAt
  };
}

// Group all calls by caller and by channel, returning ranked reputation leaderboards.
// `minResolved` hides callers/channels we can't judge yet from the leaderboard.
export function buildLeaderboards(callsMap, opts = {}) {
  const minResolved = opts.minResolved || 3;
  const calls = Array.isArray(callsMap) ? callsMap : Object.values(callsMap || {});
  const byCaller = new Map();
  const byChannel = new Map();
  for (const c of calls) {
    const cid = c.callerId != null ? String(c.callerId) : (c.callerName || "anon");
    const chid = c.chatId != null ? String(c.chatId) : "";
    if (!byCaller.has(cid)) byCaller.set(cid, { id: cid, name: c.callerName || cid, calls: [] });
    byCaller.get(cid).calls.push(c);
    if (chid) {
      if (!byChannel.has(chid)) byChannel.set(chid, { id: chid, name: c.chatTitle || chid, calls: [] });
      byChannel.get(chid).calls.push(c);
    }
  }
  const rank = (m) => [...m.values()]
    .map((g) => ({ id: g.id, name: g.name, ...aggregateReputation(g.calls, opts) }))
    .filter((r) => r.resolved >= minResolved)
    .sort((a, b) => b.score - a.score || b.resolved - a.resolved);
  return { callers: rank(byCaller), channels: rank(byChannel) };
}

// THE TRADE SIGNAL. Given the reputations of the caller and channel that called a mint,
// return a bounded conviction contribution for the autopilot:
//   { trusted, callerScore, channelScore, convictionDelta, reason }
// convictionDelta is added to the engine's conviction multiplier (see convictionMult).
// It is NEVER negative (caller-intel only ADDS confidence; it never vetoes — on-chain
// gates still own rejection) and is capped so a single social signal can't dominate the
// proven-dev / smart-money reads. It stays 0 until the record clears MIN_SAMPLE_FOR_SIGNAL.
export function callerSignal(callerRep, channelRep, opts = {}) {
  const minSample = opts.minSample || MIN_SAMPLE_FOR_SIGNAL;
  const maxDelta = opts.maxDelta != null ? opts.maxDelta : 0.4;
  const eligible = (rep) => rep && rep.resolved >= minSample && rep.smoothedHitRate >= (opts.minHitRate || 0.4);
  const cOk = eligible(callerRep);
  const chOk = eligible(channelRep);
  if (!cOk && !chOk) {
    return { trusted: false, callerScore: callerRep ? callerRep.score : 0, channelScore: channelRep ? channelRep.score : 0, convictionDelta: 0, reason: "no proven caller/channel record" };
  }
  // Take the stronger of the two proven scores; a proven caller in a proven channel adds a
  // little extra (confluence), still capped at maxDelta.
  const cScore = cOk ? callerRep.score : 0;
  const chScore = chOk ? channelRep.score : 0;
  const base = Math.max(cScore, chScore);
  const confluence = cOk && chOk ? 0.1 : 0;
  const convictionDelta = Math.max(0, Math.min(maxDelta, base * maxDelta + confluence));
  const who = cOk && chOk ? "proven caller + channel" : cOk ? "proven caller" : "proven channel";
  return {
    trusted: true,
    callerScore: Math.round(cScore * 1000) / 1000,
    channelScore: Math.round(chScore * 1000) / 1000,
    convictionDelta: Math.round(convictionDelta * 1000) / 1000,
    reason: who
  };
}
