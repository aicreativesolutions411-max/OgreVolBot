import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSolWalletPnlSummary, normalizeSolWalletPositions } from "../src/lib/solWalletPnl.js";

test("normalizes Solana Tracker PnL v2 wallet summary without losing nested values", () => {
  const result = normalizeSolWalletPnlSummary({
    summary: {
      pnl: { realized: 887056.11, unrealized: -51516.97, total: 835539.14 },
      invested: 1200,
      proceeds: 2400,
      openPositions: { cost: 500, value: 650 },
      counts: { buys: 12, sells: 9, trades: 21, tokensTraded: 7 },
    },
    analysis: { winRate: 45.13, tokens: { winning: 3, losing: 4 } },
  });
  assert.equal(result.available, true);
  assert.equal(result.totalPnlUsd, 835539.14);
  assert.equal(result.realizedUsd, 887056.11);
  assert.equal(result.unrealizedUsd, -51516.97);
  assert.equal(result.winRate, 45.13);
  assert.equal(result.wins, 3);
  assert.equal(result.losses, 4);
  assert.equal(result.tradeCount, 21);
  assert.equal(result.tokensTraded, 7);
  assert.equal(result.openCostUsd, 500);
  assert.equal(result.openValueUsd, 650);
});

test("missing PnL remains unavailable instead of becoming a fake zero", () => {
  const missing = normalizeSolWalletPnlSummary(null);
  assert.equal(missing.available, false);
  assert.equal(missing.totalPnlUsd, null);

  const sparse = normalizeSolWalletPnlSummary({ summary: { pnl: { realized: null }, counts: {} } });
  assert.equal(sparse.available, false);
  assert.equal(sparse.realizedUsd, null);
  assert.equal(sparse.totalPnlUsd, null);
});

test("normalizes current Solana positions with cost, open PnL, and realized PnL", () => {
  const positions = normalizeSolWalletPositions({ positions: [{
    token: "Mint111",
    meta: { symbol: "$SLIME", name: "Slime" },
    pnl: { realized: 70, unrealized: -10, total: 60 },
    current: { balance: 1234, costBasis: 50, value: 40, price: 0.04 },
    roi: 120,
  }] });
  assert.deepEqual(positions[0], {
    addr: "Mint111", sym: "SLIME", name: "Slime", qty: 1234,
    valueUsd: 40, costUsd: 50, realizedUsd: 70, unrealizedUsd: -10,
    pnlUsd: -10, totalPnlUsd: 60, roiPct: 120, priceUsd: 0.04,
  });
});
