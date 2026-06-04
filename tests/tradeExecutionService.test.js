import test from "node:test";
import assert from "node:assert/strict";
import {
  TradeExecutionService,
  createFakePriceProvider,
  createMemoryTradeStore,
  createCloseOrderRecorder,
  TRADE_STATUS,
  TP_SL_REASON
} from "../src/lib/tradeExecutionService.js";

function openWebTrade(overrides = {}) {
  return {
    id: overrides.id || "trade-web-1",
    userId: overrides.userId || "user-7",
    source: overrides.source || "web",
    symbol: overrides.symbol || "BTCUSDT",
    side: overrides.side || "LONG",
    entryPrice: overrides.entryPrice ?? 100,
    stopLoss: overrides.stopLoss ?? 95,
    takeProfit: overrides.takeProfit ?? 110,
    status: overrides.status || TRADE_STATUS.OPEN,
    monitoringEnabled: overrides.monitoringEnabled ?? true
  };
}

async function runSingleTrade(trade, price) {
  const store = createMemoryTradeStore([trade]);
  const prices = createFakePriceProvider({ [trade.symbol]: price });
  const closeOrders = createCloseOrderRecorder();
  const service = new TradeExecutionService({
    store,
    priceProvider: prices,
    closeOrder: closeOrders,
    logger: { info() {}, warn() {}, error() {} }
  });

  const result = await service.scanOpenTrades();
  return { result, store, closeOrders };
}

test("web-created LONG closes on stop loss", async () => {
  const trade = openWebTrade({
    id: "web-long-stop",
    side: "LONG",
    entryPrice: 100,
    stopLoss: 95,
    takeProfit: 110
  });
  const { result, store, closeOrders } = await runSingleTrade(trade, 94);

  assert.equal(result.checked, 1);
  assert.equal(result.triggered, 1);
  assert.equal(result.closed, 1);
  assert.equal(closeOrders.calls.length, 1);
  assert.equal(closeOrders.calls[0].reason, TP_SL_REASON.STOP_LOSS);
  assert.equal(store.get("web-long-stop").status, TRADE_STATUS.CLOSED);
});

test("web-created LONG closes on take profit", async () => {
  const trade = openWebTrade({
    id: "web-long-profit",
    side: "LONG",
    entryPrice: 100,
    stopLoss: 95,
    takeProfit: 110
  });
  const { result, closeOrders } = await runSingleTrade(trade, 111);

  assert.equal(result.checked, 1);
  assert.equal(result.triggered, 1);
  assert.equal(result.closed, 1);
  assert.equal(closeOrders.calls.length, 1);
  assert.equal(closeOrders.calls[0].reason, TP_SL_REASON.TAKE_PROFIT);
});

test("web-created SHORT closes on stop loss", async () => {
  const trade = openWebTrade({
    id: "web-short-stop",
    side: "SHORT",
    entryPrice: 100,
    stopLoss: 105,
    takeProfit: 90
  });
  const { result, closeOrders } = await runSingleTrade(trade, 106);

  assert.equal(result.checked, 1);
  assert.equal(result.triggered, 1);
  assert.equal(result.closed, 1);
  assert.equal(closeOrders.calls.length, 1);
  assert.equal(closeOrders.calls[0].reason, TP_SL_REASON.STOP_LOSS);
});

test("web-created SHORT closes on take profit", async () => {
  const trade = openWebTrade({
    id: "web-short-profit",
    side: "SHORT",
    entryPrice: 100,
    stopLoss: 105,
    takeProfit: 90
  });
  const { result, closeOrders } = await runSingleTrade(trade, 89);

  assert.equal(result.checked, 1);
  assert.equal(result.triggered, 1);
  assert.equal(result.closed, 1);
  assert.equal(closeOrders.calls.length, 1);
  assert.equal(closeOrders.calls[0].reason, TP_SL_REASON.TAKE_PROFIT);
});

test("duplicate trigger submits close order exactly once", async () => {
  const trade = openWebTrade({
    id: "web-duplicate-stop",
    side: "LONG",
    entryPrice: 100,
    stopLoss: 95,
    takeProfit: 110
  });
  const store = createMemoryTradeStore([trade]);
  const prices = createFakePriceProvider({ BTCUSDT: 94 });
  const closeOrders = createCloseOrderRecorder();
  const service = new TradeExecutionService({
    store,
    priceProvider: prices,
    closeOrder: closeOrders,
    logger: { info() {}, warn() {}, error() {} }
  });

  await Promise.all([
    service.scanOpenTrades(),
    service.scanOpenTrades()
  ]);
  await service.scanOpenTrades();

  assert.equal(closeOrders.calls.length, 1);
  assert.equal(closeOrders.calls[0].tradeId, "web-duplicate-stop");
  assert.equal(closeOrders.calls[0].reason, TP_SL_REASON.STOP_LOSS);
  assert.equal(store.get("web-duplicate-stop").status, TRADE_STATUS.CLOSED);
});
