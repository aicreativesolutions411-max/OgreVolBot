import { test } from "node:test";
import assert from "node:assert/strict";
import {
  peakMultiple,
  lastMultiple,
  resolveCallOutcome,
  smoothedHitRate,
  aggregateReputation,
  buildLeaderboards,
  callerSignal,
  WON_MULT,
  LOST_AGE_MS,
  FLAT_AGE_MS,
  MIN_SAMPLE_FOR_SIGNAL
} from "../src/lib/callerIntel.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function call(over = {}) {
  return { mint: "m", chatId: "c1", chatTitle: "Chan", callerId: 7, callerName: "@x", entryMc: 10000, peakMc: 10000, lastMc: 10000, firstAt: 0, lastAt: 0, status: "watching", outcome: null, ...over };
}

test("peak/last multiples compute from MC", () => {
  assert.equal(peakMultiple(call({ entryMc: 10000, peakMc: 25000 })), 2.5);
  assert.equal(lastMultiple(call({ entryMc: 10000, lastMc: 4000 })), 0.4);
  assert.equal(peakMultiple(call({ entryMc: 0 })), 0); // no entry mark
});

test("a call that hit 2x peak resolves WON immediately, even if faded now", () => {
  const c = call({ entryMc: 10000, peakMc: 30000, lastMc: 12000, firstAt: 0 });
  const r = resolveCallOutcome(c, 5 * 60 * 1000); // only 5 min later
  assert.equal(r.outcome, "won");
  assert.equal(r.peakX, 3);
  assert.equal(r.status, "resolved");
});

test("a coin that died below the floor after the window resolves LOST", () => {
  const c = call({ entryMc: 10000, peakMc: 13000, lastMc: 3000, firstAt: 0 });
  assert.equal(resolveCallOutcome(c, HOUR / 2), null);          // too early to call it lost
  const r = resolveCallOutcome(c, LOST_AGE_MS + 1000);
  assert.equal(r.outcome, "lost");
});

test("unpriceable (gone) coin after the window resolves LOST", () => {
  const c = call({ entryMc: 10000, peakMc: 11000, lastMc: 0, firstAt: 0 });
  const r = resolveCallOutcome(c, LOST_AGE_MS + 1000);
  assert.equal(r.outcome, "lost");
});

test("a coin that never ran nor died resolves FLAT after a day", () => {
  const c = call({ entryMc: 10000, peakMc: 14000, lastMc: 12000, firstAt: 0 });
  assert.equal(resolveCallOutcome(c, 6 * HOUR), null);          // still watching
  const r = resolveCallOutcome(c, FLAT_AGE_MS + 1000);
  assert.equal(r.outcome, "flat");
});

test("resolveCallOutcome is idempotent on already-resolved calls", () => {
  const c = call({ status: "resolved", outcome: "won" });
  assert.equal(resolveCallOutcome(c, DAY), null);
});

test("smoothed hit-rate shrinks tiny samples toward the base rate", () => {
  const perfectSmall = smoothedHitRate(1, 1);     // 1-for-1
  const proven = smoothedHitRate(28, 50);         // 56% over 50
  assert.ok(perfectSmall < proven, "a 1/1 caller must not outrank a 28/50 caller");
  assert.ok(perfectSmall < 1, "tiny sample never reads as 100%");
});

test("aggregateReputation counts wins/losses/flats and scores by sample + magnitude", () => {
  const calls = [
    call({ status: "resolved", outcome: "won", peakX: 4 }),
    call({ status: "resolved", outcome: "won", peakX: 2.2 }),
    call({ status: "resolved", outcome: "lost", peakX: 1.1 }),
    call({ status: "resolved", outcome: "flat", peakX: 1.4 }),
    call({ status: "watching" })
  ];
  const rep = aggregateReputation(calls);
  assert.equal(rep.total, 5);
  assert.equal(rep.resolved, 4);
  assert.equal(rep.wins, 2);
  assert.equal(rep.losses, 1);
  assert.equal(rep.flats, 1);
  assert.equal(rep.hitRate, 0.5);
  assert.ok(rep.score > 0 && rep.score <= 1);
  assert.equal(rep.bestPeakX, 4);
});

test("buildLeaderboards ranks proven callers above thin ones and hides sub-threshold", () => {
  const proven = Array.from({ length: 10 }, (_, i) => call({ callerId: 1, callerName: "@pro", status: "resolved", outcome: i < 6 ? "won" : "lost", peakX: i < 6 ? 3 : 1 }));
  const thin = [call({ callerId: 2, callerName: "@thin", status: "resolved", outcome: "won", peakX: 9 })];
  const noise = [call({ callerId: 3, callerName: "@watch", status: "watching" })];
  const { callers } = buildLeaderboards([...proven, ...thin, ...noise], { minResolved: 3 });
  assert.equal(callers.length, 1, "only the proven caller clears minResolved=3");
  assert.equal(callers[0].name, "@pro");
});

test("callerSignal stays neutral until the record clears the min sample", () => {
  const thin = aggregateReputation(Array.from({ length: MIN_SAMPLE_FOR_SIGNAL - 1 }, () => call({ status: "resolved", outcome: "won", peakX: 3 })));
  const sig = callerSignal(thin, null);
  assert.equal(sig.trusted, false);
  assert.equal(sig.convictionDelta, 0);
});

test("callerSignal gives a bounded positive delta for a proven caller, never negative", () => {
  const strong = aggregateReputation(Array.from({ length: 20 }, (_, i) => call({ status: "resolved", outcome: i < 13 ? "won" : "lost", peakX: i < 13 ? 4 : 1 })));
  const sig = callerSignal(strong, null, { maxDelta: 0.4 });
  assert.equal(sig.trusted, true);
  assert.ok(sig.convictionDelta > 0 && sig.convictionDelta <= 0.4);
});

test("callerSignal adds a confluence bump when caller AND channel are both proven", () => {
  const mk = () => aggregateReputation(Array.from({ length: 20 }, (_, i) => call({ status: "resolved", outcome: i < 13 ? "won" : "lost", peakX: i < 13 ? 4 : 1 })));
  const both = callerSignal(mk(), mk(), { maxDelta: 0.4 });
  const one = callerSignal(mk(), null, { maxDelta: 0.4 });
  assert.ok(both.convictionDelta >= one.convictionDelta);
  assert.ok(both.convictionDelta <= 0.4, "still capped");
});

test("a losing caller produces no positive signal", () => {
  const loser = aggregateReputation(Array.from({ length: 20 }, (_, i) => call({ status: "resolved", outcome: i < 2 ? "won" : "lost", peakX: i < 2 ? 2.1 : 1 })));
  const sig = callerSignal(loser, null);
  assert.equal(sig.convictionDelta, 0);
});
