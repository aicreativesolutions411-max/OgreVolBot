import test from "node:test";
import assert from "node:assert/strict";

import {
  createXDmPadSession,
  hashXDmPadSession,
  pruneXDmPadSessions,
  resolveXDmPadSession,
  revokeXDmPadSession,
  revokeXDmPadSessionsForSender,
  X_DM_PAD_ABSOLUTE_MS,
  X_DM_PAD_IDLE_MS,
  X_DM_PAD_SESSION_KIND
} from "../src/lib/xDmPadSession.js";

const SCOPE = { senderId: "x-123", userId: "tg-456", mint: "So11111111111111111111111111111111111111112", slot: "1" };

test("X Trade Pad exchanges a handoff for a scoped opaque 30-day session", () => {
  const state = {};
  const created = createXDmPadSession(state, SCOPE, { now: 1_000, token: "opaque-session" });
  assert.equal(created.token, "opaque-session");
  assert.equal(state.menuSessions[hashXDmPadSession(created.token)].userId, SCOPE.userId);
  const resolved = resolveXDmPadSession(state, created.token, { now: 10_000 });
  assert.equal(resolved.record.senderId, SCOPE.senderId);
  assert.equal(resolved.record.mint, SCOPE.mint);
  assert.equal(resolved.record.expiresAt, 10_000 + X_DM_PAD_IDLE_MS);
});

test("X Trade Pad session slides while active but never exceeds its 90-day absolute life", () => {
  const state = {};
  createXDmPadSession(state, SCOPE, { now: 1_000, token: "sliding" });
  for (const day of [29, 58, 87]) {
    assert.notEqual(resolveXDmPadSession(state, "sliding", { now: 1_000 + day * 24 * 60 * 60_000 }), null);
  }
  const nearAbsolute = 1_000 + X_DM_PAD_ABSOLUTE_MS - 1_000;
  const resolved = resolveXDmPadSession(state, "sliding", { now: nearAbsolute });
  assert.equal(resolved.record.expiresAt, 1_000 + X_DM_PAD_ABSOLUTE_MS);
  assert.equal(resolveXDmPadSession(state, "sliding", { now: 1_000 + X_DM_PAD_ABSOLUTE_MS }), null);
});

test("X Trade Pad sessions are revocable individually and when an X account relinks", () => {
  const state = {};
  createXDmPadSession(state, SCOPE, { now: 1_000, token: "one" });
  createXDmPadSession(state, { ...SCOPE, mint: "11111111111111111111111111111111" }, { now: 2_000, token: "two" });
  assert.equal(revokeXDmPadSession(state, "one"), true);
  assert.equal(resolveXDmPadSession(state, "one", { now: 3_000 }), null);
  assert.equal(revokeXDmPadSessionsForSender(state, SCOPE.senderId), 1);
  assert.equal(resolveXDmPadSession(state, "two", { now: 3_000 }), null);
});

test("X Trade Pad never stores the raw bearer", () => {
  const state = {};
  createXDmPadSession(state, SCOPE, { now: 1_000, token: "do-not-store-raw" });
  const serialized = JSON.stringify(state);
  assert.equal(serialized.includes("do-not-store-raw"), false);
  assert.deepEqual(Object.keys(state.menuSessions), [hashXDmPadSession("do-not-store-raw")]);
  assert.match(Object.keys(state.menuSessions)[0], /^[a-f0-9]{64}$/);
});

test("X Trade Pad session renewal is persisted periodically, not on every request", () => {
  const state = {};
  createXDmPadSession(state, SCOPE, { now: 1_000, token: "renewal" });
  assert.equal(resolveXDmPadSession(state, "renewal", { now: 60_000 }).dirty, false);
  assert.equal(resolveXDmPadSession(state, "renewal", { now: 5 * 60_000 + 60_000 }).dirty, true);
});

test("X Trade Pad prunes malformed, expired, and excess per-sender sessions", () => {
  const state = { menuSessions: {
    malformed: { kind: X_DM_PAD_SESSION_KIND, senderId: "x", userId: "tg" },
    expired: {
      kind: X_DM_PAD_SESSION_KIND,
      ...SCOPE,
      expiresAt: 9_000,
      absoluteExpiresAt: 99_000,
      lastUsedAt: 1
    }
  } };
  pruneXDmPadSessions(state, { now: 10_000 });
  assert.deepEqual(state.menuSessions, {});

  for (let i = 0; i < 9; i += 1) {
    createXDmPadSession(state, SCOPE, { now: 20_000 + i, token: `session-${i}` });
  }
  assert.equal(Object.keys(state.menuSessions).length, 8);
  assert.equal(state.menuSessions[hashXDmPadSession("session-0")], undefined);
  assert.equal(state.menuSessions[hashXDmPadSession("session-8")]?.senderId, SCOPE.senderId);
});

test("X Trade Pad bounds the global session store without penalizing active senders", () => {
  const now = 100_000;
  const state = { menuSessions: {} };
  for (let i = 0; i < 5_001; i += 1) {
    state.menuSessions[`hash-${i}`] = {
      kind: X_DM_PAD_SESSION_KIND,
      ...SCOPE,
      senderId: `sender-${i}`,
      lastUsedAt: i,
      expiresAt: now + X_DM_PAD_IDLE_MS,
      absoluteExpiresAt: now + X_DM_PAD_ABSOLUTE_MS
    };
  }
  pruneXDmPadSessions(state, { now });
  assert.equal(Object.keys(state.menuSessions).length, 5_000);
  assert.equal(state.menuSessions["hash-0"], undefined);
  assert.equal(state.menuSessions["hash-5000"]?.senderId, "sender-5000");
});
