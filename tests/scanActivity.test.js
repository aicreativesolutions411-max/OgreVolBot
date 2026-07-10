import test from "node:test";
import assert from "node:assert/strict";
import { aggregateDexPairActivity, volumeFallbackFromOhlcv } from "../src/lib/scanActivity.js";

test("scan activity sums volume across unique token pools", () => {
  const mint = "TokenMint";
  const result = aggregateDexPairActivity(mint, [
    {
      pairAddress: "pool-a",
      baseToken: { address: mint },
      quoteToken: { address: "SOL" },
      volume: { m5: 20, h1: 100, h24: 1_000 },
      txns: { h1: { buys: 4, sells: 2 }, h24: { buys: 30, sells: 10 } },
    },
    {
      pairAddress: "pool-b",
      baseToken: { address: "USDC" },
      quoteToken: { address: mint },
      volume: { m5: 5, h1: 75, h24: 500 },
      txns: { h1: { buys: 3, sells: 1 }, h24: { buys: 20, sells: 8 } },
    },
    {
      pairAddress: "pool-b", // duplicate provider row must not double-count
      baseToken: { address: "USDC" },
      quoteToken: { address: mint },
      volume: { h24: 500 },
    },
    {
      pairAddress: "other-token",
      baseToken: { address: "OTHER" },
      quoteToken: { address: "SOL" },
      volume: { h24: 9_999 },
    },
  ]);

  assert.deepEqual(result.volume, { m5: 25, h1: 175, h24: 1_500 });
  assert.deepEqual(result.txns.h1, { buys: 7, sells: 3 });
  assert.deepEqual(result.txns.h24, { buys: 50, sells: 18 });
});

test("Gecko hourly candles recover exact 24h scan volume", () => {
  const candles = Array.from({ length: 30 }, (_, index) => ({ t: 1_000 + index * 3_600, v: index + 1 }));
  const result = volumeFallbackFromOhlcv({ source: "geckoterminal", candles });
  const expected24h = candles.slice(-24).reduce((sum, row) => sum + row.v, 0);
  assert.deepEqual(result, { volume: { h24: expected24h, h1: 30 }, source: "gecko-ohlcv" });
});

test("fresh Pump trade candles stay honestly labelled as recent volume", () => {
  const result = volumeFallbackFromOhlcv({
    source: "pumpportal",
    candles: [{ t: 100, v: 12.5 }, { t: 200, v: 7.5 }, { t: 300, v: 0 }],
  });
  assert.deepEqual(result, { volumeRecentUsd: 20, source: "recent-trade-tape" });
});
