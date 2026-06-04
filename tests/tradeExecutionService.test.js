import test from "node:test";
import assert from "node:assert/strict";
import {
  TradeExecutionService,
  createFakePriceProvider,
  createMemoryTradeStore,
  createCloseOrderRecorder,
  evaluatePercentMoveCandidates,
  exitProviderOrder,
  openLotsFromTradeEvents,
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

test("after one take profit closes, another web trade still triggers", async () => {
  const first = openWebTrade({
    id: "web-first-profit",
    symbol: "FIRSTUSDT",
    takeProfit: 110
  });
  const second = openWebTrade({
    id: "web-second-profit",
    symbol: "SECONDUSDT",
    takeProfit: 110
  });
  const store = createMemoryTradeStore([first, second]);
  const prices = createFakePriceProvider({
    FIRSTUSDT: 111,
    SECONDUSDT: 100
  });
  const closeOrders = createCloseOrderRecorder();
  const service = new TradeExecutionService({
    store,
    priceProvider: prices,
    closeOrder: closeOrders,
    logger: { info() {}, warn() {}, error() {} }
  });

  await service.scanOpenTrades();
  assert.equal(closeOrders.calls.length, 1);
  assert.equal(closeOrders.calls[0].tradeId, "web-first-profit");
  assert.equal(closeOrders.calls[0].reason, TP_SL_REASON.TAKE_PROFIT);

  prices.set("SECONDUSDT", 111);
  await service.scanOpenTrades();

  assert.equal(closeOrders.calls.length, 2);
  assert.equal(closeOrders.calls[1].tradeId, "web-second-profit");
  assert.equal(closeOrders.calls[1].reason, TP_SL_REASON.TAKE_PROFIT);
});

test("close-order error does not stop monitor from scanning other web trades", async () => {
  const failing = openWebTrade({
    id: "web-close-error",
    symbol: "FAILUSDT",
    stopLoss: 95
  });
  const succeeding = openWebTrade({
    id: "web-close-after-error",
    symbol: "OKUSDT",
    stopLoss: 95
  });
  const store = createMemoryTradeStore([failing, succeeding]);
  const prices = createFakePriceProvider({
    FAILUSDT: 94,
    OKUSDT: 94
  });
  const calls = [];
  const service = new TradeExecutionService({
    store,
    priceProvider: prices,
    closeOrder: {
      async closeTrade(trade, evaluation) {
        calls.push(evaluation.tradeId);
        if (evaluation.tradeId === "web-close-error") {
          throw new Error("simulated close failure");
        }
        return { signature: "fake-success" };
      }
    },
    logger: { info() {}, warn() {}, error() {} }
  });

  const result = await service.scanOpenTrades();

  assert.equal(result.triggered, 2);
  assert.equal(result.failed, 1);
  assert.equal(result.closed, 1);
  assert.deepEqual(calls, ["web-close-error", "web-close-after-error"]);
  assert.equal(store.get("web-close-error").status, TRADE_STATUS.FAILED);
  assert.equal(store.get("web-close-after-error").status, TRADE_STATUS.CLOSED);
});

test("market move candidate triggers take profit when quote move lags chart", () => {
  const evaluation = evaluatePercentMoveCandidates({
    tradeId: "ogre-market-profit",
    userId: "user-7",
    source: "ogre_ai",
    symbol: "PUMPUSDC",
    side: "LONG",
    status: TRADE_STATUS.OPEN,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5,
    moves: [
      { source: "jupiter", movePct: 12 },
      { source: "dexscreener", movePct: 50 }
    ]
  });

  assert.equal(evaluation.wouldClose, true);
  assert.equal(evaluation.trigger, TP_SL_REASON.TAKE_PROFIT);
  assert.equal(evaluation.priceSource, "dexscreener");
  assert.equal(evaluation.triggerMovePct, 50);
});

test("quote move candidate still triggers stop loss when chart lags quote", () => {
  const evaluation = evaluatePercentMoveCandidates({
    tradeId: "ogre-quote-stop",
    userId: "user-7",
    source: "ogre_ai",
    symbol: "PUMPUSDC",
    side: "LONG",
    status: TRADE_STATUS.OPEN,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5,
    moves: [
      { source: "jupiter", movePct: -10 },
      { source: "dexscreener", movePct: -3 }
    ]
  });

  assert.equal(evaluation.wouldClose, true);
  assert.equal(evaluation.trigger, TP_SL_REASON.STOP_LOSS);
  assert.equal(evaluation.priceSource, "jupiter");
  assert.equal(evaluation.triggerMovePct, -10);
});

test("market move candidate triggers stop loss when quote move lags chart", () => {
  const evaluation = evaluatePercentMoveCandidates({
    tradeId: "ogre-market-stop",
    userId: "user-7",
    source: "ogre_ai",
    symbol: "PUMPUSDC",
    side: "LONG",
    status: TRADE_STATUS.OPEN,
    takeProfitPct: 25,
    stopLossPct: 8,
    stopLossBufferPct: 1.5,
    moves: [
      { source: "jupiter", movePct: -2 },
      { source: "dexscreener", movePct: -12 }
    ]
  });

  assert.equal(evaluation.wouldClose, true);
  assert.equal(evaluation.trigger, TP_SL_REASON.STOP_LOSS);
  assert.equal(evaluation.priceSource, "dexscreener");
  assert.equal(evaluation.triggerMovePct, -12);
});

test("open lot basis ignores prior profitable round trip before new stop loss", () => {
  const open = openLotsFromTradeEvents([
    {
      type: "buy",
      timestamp: "2026-06-04T10:00:00.000Z",
      solLamportsSpent: "100000000",
      tokenAmount: "1000",
      source: "ogre_ai",
      signature: "buy-1"
    },
    {
      type: "sell",
      timestamp: "2026-06-04T10:02:00.000Z",
      solLamportsReceived: "130000000",
      tokenAmount: "1000",
      source: "ogre_ai_exit",
      signature: "sell-1"
    },
    {
      type: "buy",
      timestamp: "2026-06-04T10:05:00.000Z",
      solLamportsSpent: "100000000",
      tokenAmount: "2000",
      source: "ogre_ai",
      signature: "buy-2"
    }
  ]);

  assert.equal(open.basisLamports, 100000000n);
  assert.equal(open.tokenAmount, 2000n);
});

test("price-exit sells prefer PumpPortal before Jupiter to avoid slow stop-loss exits", () => {
  assert.deepEqual(exitProviderOrder({
    priceExit: true,
    pumpPortalSellFallbackEnabled: true
  }), ["pumpportal", "jupiter"]);
});

test("non-price sells keep Jupiter first with PumpPortal fallback", () => {
  assert.deepEqual(exitProviderOrder({
    priceExit: false,
    pumpPortalSellFallbackEnabled: true
  }), ["jupiter", "pumpportal"]);
});
