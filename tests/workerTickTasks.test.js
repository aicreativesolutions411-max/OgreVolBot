import test from "node:test";
import assert from "node:assert/strict";
import {
  duePeriodicTask,
  workerTickTaskFlags
} from "../src/lib/workerTickTasks.js";

test("fast TP/SL tick can skip broad portfolio scanning while keeping web guards and plans hot", () => {
  const flags = workerTickTaskFlags({
    runTradePlans: true,
    runPortfolioExits: false,
    runWebExitGuards: true,
    runTimedTradePlans: true
  }, {
    workerTickRunTradePlans: true
  });

  assert.equal(flags.portfolioExits, false);
  assert.equal(flags.webExitGuards, true);
  assert.equal(flags.tradePlans, true);
});

test("worker tick defaults remain backward compatible", () => {
  const flags = workerTickTaskFlags({}, {
    workerTickRunTradePlans: true
  });

  assert.deepEqual(flags, {
    portfolioExits: true,
    webExitGuards: true,
    tradePlans: true
  });
});

test("periodic task only runs when its interval is due", () => {
  assert.equal(duePeriodicTask(10_000, 0, 30_000), true);
  assert.equal(duePeriodicTask(10_000, 9_000, 30_000), false);
  assert.equal(duePeriodicTask(40_000, 9_000, 30_000), true);
});
