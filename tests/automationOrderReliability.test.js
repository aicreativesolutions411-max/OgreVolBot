import test from "node:test";
import assert from "node:assert/strict";
import {
  automationExitNeedsAttention,
  automationExitReplacementBlocked,
  automationOrderIsActivelyMonitored,
  rotatingUniqueWindow,
  staleAutomationClaim
} from "../src/lib/automationOrderReliability.js";

test("rotating order windows eventually inspect mints beyond the first batch", () => {
  const mints = Array.from({ length: 30 }, (_, index) => `mint-${index + 1}`);
  const first = rotatingUniqueWindow(mints, 0, 12);
  const second = rotatingUniqueWindow(mints, first.nextCursor, 12);
  const third = rotatingUniqueWindow(mints, second.nextCursor, 12);
  const inspected = new Set([...first.items, ...second.items, ...third.items]);

  assert.equal(first.items.length, 12);
  assert.equal(inspected.size, 30);
  assert.ok(second.items.includes("mint-13"));
  assert.ok(third.items.includes("mint-30"));
});

test("order window deduplicates tokens without losing circular fairness", () => {
  const first = rotatingUniqueWindow(["a", "a", "b", "c"], 2, 2);
  assert.deepEqual(first.items, ["c", "a"]);
  assert.equal(first.nextCursor, 1);
});

test("unknown submission outcomes are visible but never treated as monitored", () => {
  assert.equal(automationOrderIsActivelyMonitored("solana", "armed"), true);
  assert.equal(automationOrderIsActivelyMonitored("robinhood", "active"), true);
  assert.equal(automationOrderIsActivelyMonitored("solana", "outcome_unknown"), false);
  assert.equal(automationOrderIsActivelyMonitored("robinhood", "outcome_unknown"), false);
});

test("stale claim detection honors the configured safety window", () => {
  const now = Date.parse("2026-08-21T12:02:00.000Z");
  assert.equal(staleAutomationClaim("2026-08-21T12:00:00.000Z", now, 90_000), true);
  assert.equal(staleAutomationClaim("2026-08-21T12:01:00.000Z", now, 90_000), false);
  assert.equal(staleAutomationClaim("not-a-date", now, 90_000), false);
});

test("exit replacement stays blocked until an unresolved submission is reconciled", () => {
  assert.equal(automationExitNeedsAttention("watching", "submitting"), true);
  assert.equal(automationExitNeedsAttention("outcome_unknown"), true);
  assert.equal(automationExitNeedsAttention("needs_attention"), true);
  assert.equal(automationExitNeedsAttention("watching", "armed"), false);
  assert.equal(automationExitReplacementBlocked({ status: "watching", preSellCheckpointAt: "2026-08-21T12:00:00.000Z" }), true);
  assert.equal(automationExitReplacementBlocked({ status: "sold", preSellCheckpointAt: "2026-08-21T12:00:00.000Z", sellSignature: "sig" }), false);
});
