import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workerSource = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");

test("fast trade worker sends RH guards without duplicating broad limit-order polling", () => {
  assert.match(workerSource, /runRhGuards: CONFIG\.runRhGuards,/);
  assert.match(workerSource, /runLimitOrders: false,/);
  assert.match(workerSource, /runWebExitGuards: false,/);
});

test("broad trade worker owns limit orders and only falls back to RH guards when fast polling is disabled", () => {
  assert.match(workerSource, /runRhGuards: CONFIG\.taskSet === "trade" \? CONFIG\.runRhGuards && !CONFIG\.fastTpSlEnabled : false,/);
  assert.match(workerSource, /runLimitOrders: CONFIG\.taskSet === "trade" \? CONFIG\.runLimitOrders : false,/);
  assert.match(workerSource, /runWebExitGuards: CONFIG\.taskSet === "trade" \? CONFIG\.runTradePlans : false,/);
});

test("trade worker task families can be disabled independently", () => {
  assert.match(workerSource, /WORKER_TICK_RUN_RH_GUARDS \|\| "true"/);
  assert.match(workerSource, /WORKER_TICK_RUN_LIMIT_ORDERS \|\| "true"/);
});

test("configured worker timeout is not silently shortened for the fast trade tick", () => {
  assert.match(workerSource, /const timeoutMs = CONFIG\.timeoutMs;/);
  assert.doesNotMatch(workerSource, /Math\.min\(CONFIG\.timeoutMs, 15_000\)/);
});
