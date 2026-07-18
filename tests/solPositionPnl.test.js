import test from "node:test";
import assert from "node:assert/strict";

import { computeRecoveredSolPositionCost } from "../src/lib/solPositionPnl.js";

test("recovers current weighted cost after buys and a partial sell", () => {
  const result = computeRecoveredSolPositionCost({
    currentQuantity: 75,
    transactions: [
      { tokenDelta: 100, solDeltaLamports: -1_000_010_000, feeLamports: 10_000 },
      { tokenDelta: -25, solDeltaLamports: 300_000_000, feeLamports: 10_000 }
    ]
  });
  assert.equal(result?.costBasisLamports, 750_007_500n);
  assert.equal(result?.buysRecovered, 1);
});

test("refuses to invent cost when transaction history is incomplete", () => {
  assert.equal(computeRecoveredSolPositionCost({
    currentQuantity: 100,
    transactions: [{ tokenDelta: 20, solDeltaLamports: -200_010_000, feeLamports: 10_000 }]
  }), null);
});

test("refuses to price transferred-in tokens from a network fee", () => {
  assert.equal(computeRecoveredSolPositionCost({
    currentQuantity: 100,
    transactions: [{ tokenDelta: 100, solDeltaLamports: -5_000, feeLamports: 5_000 }]
  }), null);
});
