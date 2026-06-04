export const TRADE_SIDE = Object.freeze({
  LONG: "LONG",
  SHORT: "SHORT"
});

export const TRADE_STATUS = Object.freeze({
  OPEN: "OPEN",
  CLOSING: "CLOSING",
  CLOSED: "CLOSED",
  FAILED: "FAILED"
});

export const TP_SL_REASON = Object.freeze({
  STOP_LOSS: "STOP_LOSS",
  TAKE_PROFIT: "TAKE_PROFIT"
});

const OPEN_STATUSES = new Set(["OPEN", "ARMED", "WATCHING", "RETRYING", "TIMER-ONLY", "PRICE-UNAVAILABLE"]);
const CLOSING_STATUSES = new Set(["CLOSING", "SUBMITTING"]);
const CLOSED_STATUSES = new Set(["CLOSED", "SOLD", "CONFIRMED"]);
const FAILED_STATUSES = new Set(["FAILED", "CANCELED", "CANCELLED", "SKIPPED"]);

export function normalizeSymbol(value) {
  return String(value || "")
    .trim()
    .replace(/[\s/_:-]+/g, "")
    .toUpperCase();
}

export function normalizeTradeSide(value) {
  const text = String(value || "").trim().toUpperCase();
  if (["SHORT", "SELL"].includes(text)) return TRADE_SIDE.SHORT;
  return TRADE_SIDE.LONG;
}

export function normalizeTradeStatus(value) {
  const text = String(value || "").trim().toUpperCase();
  if (CLOSED_STATUSES.has(text)) return TRADE_STATUS.CLOSED;
  if (FAILED_STATUSES.has(text)) return TRADE_STATUS.FAILED;
  if (CLOSING_STATUSES.has(text)) return TRADE_STATUS.CLOSING;
  if (OPEN_STATUSES.has(text) || !text) return TRADE_STATUS.OPEN;
  return text;
}

export function numericOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[%,$\s]/g, ""));
  return Number.isFinite(number) ? number : null;
}

export function normalizeTradeInput(trade = {}) {
  const symbol = normalizeSymbol(trade.symbol || trade.tokenMint || trade.market);
  return {
    ...trade,
    id: String(trade.id || trade.tradeId || "").trim(),
    userId: String(trade.userId || "").trim(),
    source: String(trade.source || "unknown").trim().toLowerCase(),
    symbol,
    side: normalizeTradeSide(trade.side),
    entryPrice: numericOrNull(trade.entryPrice),
    currentPrice: numericOrNull(trade.currentPrice),
    stopLoss: numericOrNull(trade.stopLoss),
    takeProfit: numericOrNull(trade.takeProfit),
    status: normalizeTradeStatus(trade.status),
    monitoringEnabled: trade.monitoringEnabled !== false
  };
}

export function evaluateTpSlTrade(trade = {}, currentPriceOverride = undefined) {
  const normalized = normalizeTradeInput({
    ...trade,
    currentPrice: currentPriceOverride !== undefined ? currentPriceOverride : trade.currentPrice
  });

  const base = {
    tradeId: normalized.id,
    userId: normalized.userId,
    source: normalized.source,
    symbol: normalized.symbol,
    side: normalized.side,
    entryPrice: normalized.entryPrice,
    currentPrice: normalized.currentPrice,
    stopLoss: normalized.stopLoss,
    takeProfit: normalized.takeProfit,
    status: normalized.status,
    eligible: false,
    trigger: null,
    wouldClose: false,
    reason: ""
  };

  if (!normalized.id) return { ...base, reason: "missing trade id" };
  if (!normalized.monitoringEnabled) return { ...base, reason: "monitoring disabled" };
  if (normalized.status !== TRADE_STATUS.OPEN) return { ...base, reason: `status ${normalized.status} is not OPEN` };
  if (!normalized.symbol) return { ...base, reason: "missing symbol" };
  if (!Number.isFinite(normalized.currentPrice)) return { ...base, reason: "missing current price" };
  if (!Number.isFinite(normalized.stopLoss) && !Number.isFinite(normalized.takeProfit)) {
    return { ...base, reason: "missing stopLoss and takeProfit" };
  }

  if (normalized.side === TRADE_SIDE.SHORT) {
    if (Number.isFinite(normalized.stopLoss) && normalized.currentPrice >= normalized.stopLoss) {
      return {
        ...base,
        eligible: true,
        trigger: TP_SL_REASON.STOP_LOSS,
        wouldClose: true,
        reason: `price ${normalized.currentPrice} >= stopLoss ${normalized.stopLoss}`
      };
    }
    if (Number.isFinite(normalized.takeProfit) && normalized.currentPrice <= normalized.takeProfit) {
      return {
        ...base,
        eligible: true,
        trigger: TP_SL_REASON.TAKE_PROFIT,
        wouldClose: true,
        reason: `price ${normalized.currentPrice} <= takeProfit ${normalized.takeProfit}`
      };
    }
    return { ...base, eligible: true, reason: "SHORT price has not crossed TP/SL" };
  }

  if (Number.isFinite(normalized.stopLoss) && normalized.currentPrice <= normalized.stopLoss) {
    return {
      ...base,
      eligible: true,
      trigger: TP_SL_REASON.STOP_LOSS,
      wouldClose: true,
      reason: `price ${normalized.currentPrice} <= stopLoss ${normalized.stopLoss}`
    };
  }
  if (Number.isFinite(normalized.takeProfit) && normalized.currentPrice >= normalized.takeProfit) {
    return {
      ...base,
      eligible: true,
      trigger: TP_SL_REASON.TAKE_PROFIT,
      wouldClose: true,
      reason: `price ${normalized.currentPrice} >= takeProfit ${normalized.takeProfit}`
    };
  }
  return { ...base, eligible: true, reason: "LONG price has not crossed TP/SL" };
}

export function evaluatePercentMoveTpSl({
  tradeId,
  userId,
  source,
  symbol,
  side = TRADE_SIDE.LONG,
  status = TRADE_STATUS.OPEN,
  movePct,
  takeProfitPct = 0,
  stopLossPct = 0,
  stopLossBufferPct = 0,
  monitoringEnabled = true
} = {}) {
  const stopLoss = numericOrNull(stopLossPct);
  const buffer = numericOrNull(stopLossBufferPct) || 0;
  const stopTriggerPct = Number.isFinite(stopLoss) && stopLoss > 0
    ? -Math.max(0.1, stopLoss - Math.max(0, buffer))
    : null;
  const takeProfit = numericOrNull(takeProfitPct);
  const evaluation = evaluateTpSlTrade({
    id: tradeId,
    userId,
    source,
    symbol,
    side,
    entryPrice: 0,
    currentPrice: movePct,
    stopLoss: stopTriggerPct,
    takeProfit: Number.isFinite(takeProfit) && takeProfit > 0 ? takeProfit : null,
    status,
    monitoringEnabled
  });

  let decision = null;
  if (evaluation.trigger === TP_SL_REASON.STOP_LOSS) {
    decision = {
      kind: "stop-loss",
      triggerPct: Math.abs(stopTriggerPct),
      targetPct: stopLoss,
      sellPercent: 100
    };
  } else if (evaluation.trigger === TP_SL_REASON.TAKE_PROFIT) {
    decision = {
      kind: "take-profit",
      triggerPct: takeProfit,
      targetPct: takeProfit
    };
  }

  return {
    ...evaluation,
    decision,
    stopLossTriggerPct: stopTriggerPct,
    takeProfitTriggerPct: takeProfit
  };
}

export function evaluatePercentMoveCandidates({
  moves = [],
  tradeId,
  userId,
  source,
  symbol,
  side = TRADE_SIDE.LONG,
  status = TRADE_STATUS.OPEN,
  takeProfitPct = 0,
  stopLossPct = 0,
  stopLossBufferPct = 0,
  monitoringEnabled = true
} = {}) {
  const candidates = (moves || [])
    .map((move) => ({
      priceSource: String(move?.source || move?.priceSource || "unknown"),
      movePct: numericOrNull(move?.movePct ?? move)
    }))
    .filter((move) => Number.isFinite(move.movePct));

  if (!candidates.length) {
    return evaluatePercentMoveTpSl({
      tradeId,
      userId,
      source,
      symbol,
      side,
      status,
      movePct: null,
      takeProfitPct,
      stopLossPct,
      stopLossBufferPct,
      monitoringEnabled
    });
  }

  let firstEvaluation = null;
  for (const candidate of candidates) {
    const evaluation = evaluatePercentMoveTpSl({
      tradeId,
      userId,
      source,
      symbol,
      side,
      status,
      movePct: candidate.movePct,
      takeProfitPct,
      stopLossPct,
      stopLossBufferPct,
      monitoringEnabled
    });
    evaluation.priceSource = candidate.priceSource;
    evaluation.triggerMovePct = candidate.movePct;
    evaluation.reason = evaluation.reason
      ? `${evaluation.reason} via ${candidate.priceSource}`
      : `checked via ${candidate.priceSource}`;
    firstEvaluation ||= evaluation;
    if (evaluation.wouldClose) return evaluation;
  }

  return firstEvaluation;
}

export function tpSlLogEntry(event, fields = {}) {
  const normalized = normalizeTradeInput({
    id: fields.tradeId || fields.id,
    userId: fields.userId,
    source: fields.source,
    symbol: fields.symbol || fields.tokenMint,
    side: fields.side,
    entryPrice: fields.entryPrice,
    currentPrice: fields.currentPrice,
    stopLoss: fields.stopLoss,
    takeProfit: fields.takeProfit,
    status: fields.status,
    monitoringEnabled: fields.monitoringEnabled
  });
  return {
    event,
    tradeId: normalized.id,
    userId: normalized.userId,
    source: normalized.source,
    symbol: normalized.symbol,
    side: normalized.side,
    entryPrice: normalized.entryPrice,
    currentPrice: normalized.currentPrice,
    stopLoss: normalized.stopLoss,
    takeProfit: normalized.takeProfit,
    status: normalized.status,
    reason: fields.reason || "",
    trigger: fields.trigger || null,
    priceSource: fields.priceSource || null,
    triggerMovePct: numericOrNull(fields.triggerMovePct),
    eligible: Boolean(fields.eligible),
    wouldClose: Boolean(fields.wouldClose),
    closed: Boolean(fields.closed),
    signature: fields.signature || null,
    at: fields.at || new Date().toISOString()
  };
}

export function exitProviderOrder({ priceExit = false, pumpPortalSellFallbackEnabled = true } = {}) {
  if (priceExit && pumpPortalSellFallbackEnabled) return ["pumpportal", "jupiter"];
  if (pumpPortalSellFallbackEnabled) return ["jupiter", "pumpportal"];
  return ["jupiter"];
}

export function formatTpSlDebugRow(evaluation = {}) {
  const trigger = evaluation.trigger || "NONE";
  return [
    `tradeId=${evaluation.tradeId || ""}`,
    `source=${evaluation.source || ""}`,
    `userId=${evaluation.userId || ""}`,
    `symbol=${evaluation.symbol || ""}`,
    `side=${evaluation.side || ""}`,
    `entry=${evaluation.entryPrice ?? "n/a"}`,
    `current=${evaluation.currentPrice ?? "n/a"}`,
    `stopLoss=${evaluation.stopLoss ?? "n/a"}`,
    `takeProfit=${evaluation.takeProfit ?? "n/a"}`,
    `status=${evaluation.status || ""}`,
    `eligible=${Boolean(evaluation.eligible)}`,
    `trigger=${trigger}`,
    `priceSource=${evaluation.priceSource || "n/a"}`,
    `wouldClose=${Boolean(evaluation.wouldClose)}`,
    `reason=${evaluation.reason || ""}`
  ].join(" ");
}

export function reduceOpenLots(lots, sellTokenAmount) {
  let remaining = BigInt(sellTokenAmount || 0);
  if (remaining <= 0n) return;

  while (remaining > 0n && lots.length) {
    const lot = lots[0];
    if (lot.remainingTokens <= remaining) {
      remaining -= lot.remainingTokens;
      lots.shift();
      continue;
    }

    const keptTokens = lot.remainingTokens - remaining;
    lot.basisLamports = (lot.basisLamports * keptTokens) / lot.remainingTokens;
    lot.remainingTokens = keptTokens;
    remaining = 0n;
  }
}

export function summarizeOpenLots(lots) {
  return lots.reduce((summary, lot) => ({
    basisLamports: summary.basisLamports + lot.basisLamports,
    tokenAmount: summary.tokenAmount + lot.remainingTokens
  }), { basisLamports: 0n, tokenAmount: 0n });
}

export function openLotsFromTradeEvents(events = []) {
  const lots = [];
  let fallbackBasisLamports = 0n;

  for (const event of [...events].sort((left, right) => Date.parse(left.timestamp || "") - Date.parse(right.timestamp || ""))) {
    if (event.type === "buy") {
      const basisLamports = BigInt(event.solLamportsSpent || 0);
      const tokenAmount = BigInt(event.tokenAmount || 0);
      if (basisLamports <= 0n) continue;
      if (tokenAmount > 0n) {
        lots.push({
          basisLamports,
          originalTokens: tokenAmount,
          remainingTokens: tokenAmount,
          signature: event.signature || "",
          source: event.source || ""
        });
      } else {
        fallbackBasisLamports += basisLamports;
      }
    } else if (event.type === "sell") {
      reduceOpenLots(lots, BigInt(event.tokenAmount || 0));
    }
  }

  const open = summarizeOpenLots(lots);
  return {
    basisLamports: open.basisLamports > 0n ? open.basisLamports : fallbackBasisLamports,
    tokenAmount: open.tokenAmount,
    lots
  };
}

export class TradeExecutionService {
  constructor({ store, priceProvider, closeOrder, logger = console } = {}) {
    if (!store) throw new Error("TradeExecutionService requires a store");
    if (!priceProvider) throw new Error("TradeExecutionService requires a priceProvider");
    if (!closeOrder) throw new Error("TradeExecutionService requires a closeOrder");
    this.store = store;
    this.priceProvider = priceProvider;
    this.closeOrder = closeOrder;
    this.logger = logger;
  }

  async scanOpenTrades() {
    const trades = await this.store.listOpenTradesWithTpSl();
    const summary = {
      checked: 0,
      skipped: 0,
      triggered: 0,
      closed: 0,
      failed: 0,
      messages: []
    };

    for (const trade of trades) {
      const normalized = normalizeTradeInput(trade);
      let currentPrice;
      try {
        currentPrice = await this.priceProvider.currentPrice(normalized);
      } catch (error) {
        const message = `price unavailable: ${error.message}`;
        summary.skipped += 1;
        summary.messages.push(`${normalized.id}: ${message}`);
        this.log("warn", tpSlLogEntry("tp_sl_trade_skipped", {
          ...normalized,
          tradeId: normalized.id,
          reason: message
        }));
        continue;
      }

      const evaluation = evaluateTpSlTrade(normalized, currentPrice);
      summary.checked += 1;
      this.log("info", tpSlLogEntry("tp_sl_trade_monitored", evaluation));

      if (!evaluation.eligible || !evaluation.wouldClose) {
        if (!evaluation.eligible) summary.skipped += 1;
        continue;
      }

      summary.triggered += 1;
      const claimed = await this.store.markClosing(evaluation.tradeId, {
        reason: evaluation.trigger,
        detail: evaluation.reason,
        currentPrice: evaluation.currentPrice
      });
      if (!claimed) {
        summary.skipped += 1;
        this.log("info", tpSlLogEntry("tp_sl_trade_skipped", {
          ...evaluation,
          reason: "close already claimed"
        }));
        continue;
      }

      this.log("info", tpSlLogEntry("tp_sl_trade_triggered", evaluation));
      try {
        const close = await this.closeOrder.closeTrade(normalized, evaluation);
        await this.store.markClosed(evaluation.tradeId, {
          reason: evaluation.trigger,
          detail: evaluation.reason,
          currentPrice: evaluation.currentPrice,
          signature: close?.signature || ""
        });
        summary.closed += 1;
        this.log("info", tpSlLogEntry("tp_sl_trade_closed", {
          ...evaluation,
          closed: true,
          signature: close?.signature || ""
        }));
      } catch (error) {
        await this.store.markFailed(evaluation.tradeId, {
          reason: evaluation.trigger,
          detail: error.message,
          currentPrice: evaluation.currentPrice
        });
        summary.failed += 1;
        this.log("error", tpSlLogEntry("tp_sl_trade_failed", {
          ...evaluation,
          reason: error.message
        }));
      }
    }

    return summary;
  }

  log(level, entry) {
    const logger = this.logger || console;
    const method = typeof logger[level] === "function" ? logger[level].bind(logger) : logger.info?.bind(logger);
    if (method) method(JSON.stringify(entry));
  }
}

export function createFakePriceProvider(initialPrices = {}) {
  const prices = new Map();
  for (const [symbol, price] of Object.entries(initialPrices || {})) {
    prices.set(normalizeSymbol(symbol), Number(price));
  }
  return {
    set(symbol, price) {
      prices.set(normalizeSymbol(symbol), Number(price));
    },
    async currentPrice(trade) {
      const symbol = normalizeSymbol(trade.symbol || trade.tokenMint || trade.market);
      const price = prices.get(symbol);
      if (!Number.isFinite(price)) {
        throw new Error(`missing fake price for ${symbol || "unknown symbol"}`);
      }
      return price;
    }
  };
}

export function createCloseOrderRecorder() {
  const calls = [];
  return {
    calls,
    async closeTrade(trade, evaluation) {
      const call = {
        tradeId: evaluation.tradeId,
        userId: evaluation.userId,
        source: evaluation.source,
        symbol: evaluation.symbol,
        side: evaluation.side,
        reason: evaluation.trigger,
        detail: evaluation.reason,
        currentPrice: evaluation.currentPrice,
        submittedAt: new Date().toISOString(),
        signature: `fake-close-${calls.length + 1}`
      };
      calls.push(call);
      return call;
    }
  };
}

export function createMemoryTradeStore(initialTrades = []) {
  const trades = new Map();
  for (const trade of initialTrades) {
    const normalized = normalizeTradeInput(trade);
    trades.set(normalized.id, { ...trade, ...normalized });
  }

  return {
    get(id) {
      return trades.get(String(id));
    },
    async listOpenTradesWithTpSl() {
      return [...trades.values()].filter((trade) => {
        const normalized = normalizeTradeInput(trade);
        return normalized.status === TRADE_STATUS.OPEN
          && normalized.monitoringEnabled
          && (Number.isFinite(normalized.stopLoss) || Number.isFinite(normalized.takeProfit));
      });
    },
    async markClosing(id, update = {}) {
      const key = String(id);
      const trade = trades.get(key);
      if (!trade || normalizeTradeStatus(trade.status) !== TRADE_STATUS.OPEN) return false;
      Object.assign(trade, {
        status: TRADE_STATUS.CLOSING,
        closingReason: update.reason || "",
        closingDetail: update.detail || "",
        closingPrice: update.currentPrice ?? null,
        closingAt: new Date().toISOString()
      });
      return true;
    },
    async markClosed(id, update = {}) {
      const trade = trades.get(String(id));
      if (!trade) return false;
      Object.assign(trade, {
        status: TRADE_STATUS.CLOSED,
        closeReason: update.reason || "",
        closeDetail: update.detail || "",
        closePrice: update.currentPrice ?? null,
        closeSignature: update.signature || "",
        closedAt: new Date().toISOString()
      });
      return true;
    },
    async markFailed(id, update = {}) {
      const trade = trades.get(String(id));
      if (!trade) return false;
      Object.assign(trade, {
        status: TRADE_STATUS.FAILED,
        failedReason: update.reason || "",
        failedDetail: update.detail || "",
        failedPrice: update.currentPrice ?? null,
        failedAt: new Date().toISOString()
      });
      return true;
    }
  };
}
