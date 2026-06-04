import {
  TradeExecutionService,
  createCloseOrderRecorder,
  createFakePriceProvider,
  createMemoryTradeStore,
  TRADE_STATUS,
  TP_SL_REASON
} from "../src/lib/tradeExecutionService.js";

const crossedWhileOffline = {
  id: "smoke-offline-crossed-long-stop",
  userId: "smoke-user",
  source: "web",
  symbol: "SMOKESOL",
  side: "LONG",
  entryPrice: 100,
  stopLoss: 95,
  takeProfit: 110,
  status: TRADE_STATUS.OPEN,
  monitoringEnabled: true
};

const store = createMemoryTradeStore([crossedWhileOffline]);
const prices = createFakePriceProvider({ SMOKESOL: 94 });
const closeOrders = createCloseOrderRecorder();
const service = new TradeExecutionService({
  store,
  priceProvider: prices,
  closeOrder: closeOrders,
  logger: { info() {}, warn() {}, error() {} }
});

console.log("TP/SL CATCHUP SMOKE");
console.log("scenario=open trade crossed stop loss while worker was offline; startup reconcile scans persisted OPEN trade");
const first = await service.scanOpenTrades();
const second = await service.scanOpenTrades();
console.log(`firstScan=${JSON.stringify(first)}`);
console.log(`secondScan=${JSON.stringify(second)}`);
console.log(`closeOrderCalls=${closeOrders.calls.length}`);
console.log(`closeReason=${closeOrders.calls[0]?.reason || ""}`);
console.log(`finalStatus=${store.get(crossedWhileOffline.id)?.status || ""}`);

if (closeOrders.calls.length !== 1) {
  throw new Error(`expected exactly one close order, got ${closeOrders.calls.length}`);
}
if (closeOrders.calls[0].reason !== TP_SL_REASON.STOP_LOSS) {
  throw new Error(`expected STOP_LOSS, got ${closeOrders.calls[0].reason}`);
}
if (store.get(crossedWhileOffline.id)?.status !== TRADE_STATUS.CLOSED) {
  throw new Error(`expected CLOSED, got ${store.get(crossedWhileOffline.id)?.status}`);
}
