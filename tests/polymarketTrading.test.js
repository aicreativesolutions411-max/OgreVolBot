import assert from "node:assert/strict";
import test from "node:test";
import {
  POLYMARKET_CONTRACTS,
  normalizePolymarketTradeIntent,
  polymarketCountryCode,
  polymarketRegionAllowed,
  polymarketTradingConfig
} from "../src/lib/polymarketTrading.js";

test("Polymarket trade intents accept bounded market and limit orders", () => {
  const market = normalizePolymarketTradeIntent({ tokenId: "123", eventId: "7", side: "buy", orderKind: "market", amount: 25 });
  assert.equal(market.side, "BUY");
  assert.equal(market.amount, 25);
  assert.equal(market.price, null);
  const limit = normalizePolymarketTradeIntent({ tokenId: "456", eventId: "8", side: "sell", orderKind: "limit", amount: 12.5, price: .62 });
  assert.equal(limit.side, "SELL");
  assert.equal(limit.price, .62);
  assert.throws(() => normalizePolymarketTradeIntent({ tokenId: "bad", amount: 5 }), /valid Polymarket outcome/);
  assert.throws(() => normalizePolymarketTradeIntent({ tokenId: "123", amount: .5 }), /1 to 100,000/);
  assert.throws(() => normalizePolymarketTradeIntent({ tokenId: "123", amount: 5, orderKind: "limit", price: 2 }), /Limit price/);
});

test("Polymarket region helper is strict for known restricted countries", () => {
  assert.equal(polymarketCountryCode(" us "), "US");
  assert.equal(polymarketCountryCode("USA"), "");
  assert.equal(polymarketRegionAllowed("US"), false);
  assert.equal(polymarketRegionAllowed("CA"), true);
  assert.equal(polymarketRegionAllowed(""), null);
});

test("Polymarket trading remains feature-gated until builder configuration is complete", () => {
  const off = polymarketTradingConfig({});
  assert.equal(off.orderConfigured, false);
  assert.equal(off.relayerConfigured, false);
  const on = polymarketTradingConfig({
    POLYMARKET_BUILDER_CODE: `0x${"ab".repeat(32)}`,
    POLYMARKET_BUILDER_KEY: "key",
    POLYMARKET_BUILDER_SECRET: "secret",
    POLYMARKET_BUILDER_PASSPHRASE: "pass"
  });
  assert.equal(on.orderConfigured, true);
  assert.equal(on.relayerConfigured, true);
  assert.match(POLYMARKET_CONTRACTS.pUsd, /^0x[0-9a-f]{40}$/i);
  assert.match(POLYMARKET_CONTRACTS.exchange, /^0x[0-9a-f]{40}$/i);
});
