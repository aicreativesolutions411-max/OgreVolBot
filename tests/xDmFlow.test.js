import test from "node:test";
import assert from "node:assert/strict";

import {
  parseXDmBuySlotCommand,
  parseXDmSellSlotCommand,
  isStaleXDmMoneyEvent,
  validateXDmBuyAmount,
  xDmEventTimestampMs,
  X_DM_BUY_LIMITS,
  X_DM_SELL_PERCENTAGES
} from "../src/lib/xDmFlow.js";

test("X DM buy grammar always treats the first integer as the coin slot", () => {
  assert.deepEqual(parseXDmBuySlotCommand("buy 1"), { slot: 1, amountSol: null });
  assert.deepEqual(parseXDmBuySlotCommand("buy 1 0.1"), { slot: 1, amountSol: 0.1 });
  assert.deepEqual(parseXDmBuySlotCommand("BUY 2 1 SOL"), { slot: 2, amountSol: 1 });
  assert.deepEqual(parseXDmBuySlotCommand("buy 5 1"), { slot: 5, amountSol: 1 });
  assert.deepEqual(parseXDmBuySlotCommand("ape 6 .25"), { slot: 6, amountSol: 0.25 });
});

test("X DM buy grammar rejects amount-first and invalid slot forms", () => {
  assert.equal(parseXDmBuySlotCommand("buy 0.1 1"), null);
  assert.equal(parseXDmBuySlotCommand("buy 7 0.1"), null);
  assert.equal(parseXDmBuySlotCommand("buy 0"), null);
});

test("X DM buy grammar reports valid-slot amounts outside safety bounds", () => {
  assert.deepEqual(parseXDmBuySlotCommand("buy 1 0.0001"), {
    slot: 1,
    amountSol: null,
    error: `Buy amount must be ${X_DM_BUY_LIMITS.minSol}-${X_DM_BUY_LIMITS.maxSol} SOL.`
  });
  assert.deepEqual(parseXDmBuySlotCommand("buy 3 50.1"), {
    slot: 3,
    amountSol: null,
    error: `Buy amount must be ${X_DM_BUY_LIMITS.minSol}-${X_DM_BUY_LIMITS.maxSol} SOL.`
  });
  assert.match(parseXDmBuySlotCommand("buy 1 0").error, /Buy amount must be/);
  assert.match(parseXDmBuySlotCommand("buy 1 51").error, /Buy amount must be/);
});

test("X DM buy validation never silently clamps an unsafe amount", () => {
  assert.equal(validateXDmBuyAmount("0.001"), 0.001);
  assert.equal(validateXDmBuyAmount(50), 50);
  assert.equal(validateXDmBuyAmount(0), null);
  assert.equal(validateXDmBuyAmount(50.001), null);
  assert.equal(validateXDmBuyAmount("not-a-number"), null);
});

test("X DM trade events reject stale or future money commands but keep read-only scans", () => {
  const now = Date.parse("2026-07-09T12:00:00.000Z");
  const old = { id: "1", createdAt: "2026-07-09T11:50:00.000Z" };
  const fresh = { id: "2", createdAt: String(now - 30_000) };
  assert.equal(isStaleXDmMoneyEvent(old, "buy 1", { now }), true);
  assert.equal(isStaleXDmMoneyEvent(old, "YES", { now }), true);
  assert.equal(isStaleXDmMoneyEvent(old, "scan So11111111111111111111111111111111111111112", { now }), false);
  assert.equal(isStaleXDmMoneyEvent(fresh, "sell 1 50", { now }), false);
  assert.equal(xDmEventTimestampMs({ createdAt: String(Math.floor(now / 1000)) }), now);
  const snowflake = ((BigInt(now) - 1288834974657n) << 22n).toString();
  assert.equal(xDmEventTimestampMs({ id: snowflake }), now);
});

test("X DM sell grammar uses slot first and only supported percentages", () => {
  assert.deepEqual(parseXDmSellSlotCommand("sell 1 25"), { slot: 1, percent: 25 });
  assert.deepEqual(parseXDmSellSlotCommand("SELL 6 100%"), { slot: 6, percent: 100 });
  assert.equal(parseXDmSellSlotCommand("sell 50 1"), null);
  assert.equal(parseXDmSellSlotCommand("sell 1 20"), null);
  assert.equal(parseXDmSellSlotCommand("sell 7 50"), null);
  assert.deepEqual(X_DM_SELL_PERCENTAGES, [25, 50, 75, 100]);
});
