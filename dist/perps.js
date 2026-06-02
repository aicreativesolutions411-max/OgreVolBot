const TRUE_VALUES = new Set(["1", "true", "yes", "on", "enabled"]);

/**
 * @typedef {Object} PerpsProvider
 * @property {() => Promise<Array>} getMarkets
 * @property {(marketSymbol: string) => Promise<Object|null>} getMarket
 * @property {(walletAddress: string) => Promise<Object>} getAccount
 * @property {(walletAddress: string) => Promise<Array>} getPositions
 * @property {(walletAddress: string) => Promise<Array>} getOpenOrders
 * @property {() => Promise<Array>} getFundingRates
 * @property {(orderRequest: Object) => Promise<Object>} quoteOrder
 * @property {(orderRequest: Object) => Promise<Object>} buildOpenPositionTx
 * @property {(closeRequest: Object) => Promise<Object>} buildClosePositionTx
 * @property {(cancelRequest: Object) => Promise<Object>} buildCancelOrderTx
 * @property {(tx: Object) => Promise<Object>} simulateTx
 * @property {(tx: Object) => Promise<string>} sendSignedTx
 */

export const DEFAULT_OGRE_TEK_CONFIG = Object.freeze({
  enabled: false,
  demoMode: true,
  provider: "mock",
  maxLeverage: 5,
  maxPositionSize: 10_000,
  dailyLossLimit: 500,
  allowedMarkets: ["SOL-PERP", "BTC-PERP", "ETH-PERP"],
  emergencyDisabled: false,
  staleMarketMs: 60_000,
  staleAccountMs: 60_000
});

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  return TRUE_VALUES.has(String(value).trim().toLowerCase());
}

function toFiniteNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numericInput(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return Number(value);
}

function toMarketList(value, fallback) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  const parsed = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : [...fallback];
}

export function resolveOgreTekConfig(raw = {}) {
  const nested = raw.ogreTek && typeof raw.ogreTek === "object" ? raw.ogreTek : {};
  const merged = { ...raw, ...nested };
  const maxLeverage = Math.max(1, toFiniteNumber(merged.maxLeverage ?? merged.OGRE_TEK_MAX_LEVERAGE, DEFAULT_OGRE_TEK_CONFIG.maxLeverage));
  return {
    enabled: toBool(merged.enabled ?? merged.ogreTekEnabled ?? merged.enableOgreTek ?? merged.NEXT_PUBLIC_ENABLE_OGRE_TEK ?? merged.OGRE_TEK_ENABLED, DEFAULT_OGRE_TEK_CONFIG.enabled),
    demoMode: toBool(merged.demoMode ?? merged.ogreTekDemoMode ?? merged.OGRE_TEK_DEMO_MODE, DEFAULT_OGRE_TEK_CONFIG.demoMode),
    provider: String(merged.provider ?? merged.ogreTekProvider ?? merged.OGRE_TEK_PROVIDER ?? DEFAULT_OGRE_TEK_CONFIG.provider).trim().toLowerCase() || DEFAULT_OGRE_TEK_CONFIG.provider,
    maxLeverage,
    maxPositionSize: Math.max(0, toFiniteNumber(merged.maxPositionSize ?? merged.OGRE_TEK_MAX_POSITION_SIZE, DEFAULT_OGRE_TEK_CONFIG.maxPositionSize)),
    dailyLossLimit: Math.max(0, toFiniteNumber(merged.dailyLossLimit ?? merged.OGRE_TEK_DAILY_LOSS_LIMIT, DEFAULT_OGRE_TEK_CONFIG.dailyLossLimit)),
    allowedMarkets: toMarketList(merged.allowedMarkets ?? merged.OGRE_TEK_ALLOWED_MARKETS, DEFAULT_OGRE_TEK_CONFIG.allowedMarkets),
    emergencyDisabled: toBool(merged.emergencyDisabled ?? merged.OGRE_TEK_EMERGENCY_DISABLED, DEFAULT_OGRE_TEK_CONFIG.emergencyDisabled),
    staleMarketMs: Math.max(5_000, toFiniteNumber(merged.staleMarketMs ?? merged.OGRE_TEK_STALE_MARKET_MS, DEFAULT_OGRE_TEK_CONFIG.staleMarketMs)),
    staleAccountMs: Math.max(5_000, toFiniteNumber(merged.staleAccountMs ?? merged.OGRE_TEK_STALE_ACCOUNT_MS, DEFAULT_OGRE_TEK_CONFIG.staleAccountMs))
  };
}

export function shouldShowOgreTekNav(config = DEFAULT_OGRE_TEK_CONFIG) {
  return Boolean(config.enabled);
}

export function ogreTekRouteStatus(config = DEFAULT_OGRE_TEK_CONFIG) {
  return config.enabled ? "enabled" : "coming-soon";
}

function nowMinus(ms) {
  return new Date(Date.now() - ms).toISOString();
}

function mockMarket(symbol, indexPrice, change24hPct, fundingRatePct, openInterestUsd) {
  return {
    symbol,
    baseSymbol: symbol.replace("-PERP", ""),
    indexPrice,
    oraclePrice: indexPrice * 0.9997,
    change24hPct,
    fundingRatePct,
    openInterestUsd,
    liquidityUsd: openInterestUsd * 0.18,
    updatedAt: new Date().toISOString()
  };
}

export class MockPerpsProvider {
  constructor(config = DEFAULT_OGRE_TEK_CONFIG) {
    this.config = config;
    this.name = "Mock Demo Provider";
  }

  async getMarkets() {
    const markets = [
      mockMarket("SOL-PERP", 172.32, 4.18, 0.012, 248_000_000),
      mockMarket("BTC-PERP", 67_842.15, 2.49, 0.008, 642_000_000),
      mockMarket("ETH-PERP", 3_245.67, 3.21, -0.003, 390_000_000)
    ];
    return markets.filter((market) => this.config.allowedMarkets.includes(market.symbol));
  }

  async getMarket(marketSymbol) {
    const markets = await this.getMarkets();
    return markets.find((market) => market.symbol === marketSymbol) || null;
  }

  async getAccount(walletAddress) {
    const connected = Boolean(walletAddress);
    return {
      walletAddress: walletAddress || "",
      connected,
      walletBalanceSol: connected ? 3.2471 : 0,
      availableCollateralUsd: connected ? 528.42 : 0,
      usedMarginUsd: connected ? 46.8 : 0,
      unrealizedPnlUsd: connected ? 12.45 : 0,
      healthScore: connected ? 91 : 0,
      dailyLossUsedUsd: connected ? 0 : 0,
      dailyLossLimitUsd: this.config.dailyLossLimit,
      maxLeverageAllowed: this.config.maxLeverage,
      updatedAt: new Date().toISOString()
    };
  }

  async getPositions(walletAddress) {
    if (!walletAddress) return [];
    return [
      {
        id: "mock-sol-long",
        marketSymbol: "SOL-PERP",
        side: "long",
        sizeUsd: 682.14,
        collateralUsd: 170.54,
        entryPrice: 167.9,
        markPrice: 172.32,
        liquidationPrice: 129.14,
        unrealizedPnlUsd: 17.96,
        marginRatioPct: 24.1,
        openedAt: nowMinus(42 * 60_000)
      }
    ];
  }

  async getOpenOrders(walletAddress) {
    if (!walletAddress) return [];
    return [
      {
        id: "mock-tp-sol",
        marketSymbol: "SOL-PERP",
        side: "sell",
        type: "take-profit",
        triggerPrice: 188,
        sizeUsd: 341.07,
        status: "watching",
        createdAt: nowMinus(20 * 60_000)
      }
    ];
  }

  async getFundingRates() {
    const markets = await this.getMarkets();
    return markets.map((market) => ({
      marketSymbol: market.symbol,
      fundingRatePct: market.fundingRatePct,
      updatedAt: market.updatedAt
    }));
  }

  async quoteOrder(orderRequest) {
    const market = await this.getMarket(orderRequest.marketSymbol);
    if (!market) throw new Error("Market is not available in Ogre Tek.");
    return calculatePerpQuote(market, orderRequest, this.config);
  }

  async buildOpenPositionTx() {
    throw new Error("Demo mode is active. Configure a real perps provider before building live transactions.");
  }

  async buildClosePositionTx() {
    throw new Error("Demo mode is active. Configure a real perps provider before building live transactions.");
  }

  async buildCancelOrderTx() {
    throw new Error("Demo mode is active. Configure a real perps provider before building live transactions.");
  }

  async simulateTx() {
    return { ok: false, message: "No live transaction exists in demo mode." };
  }

  async sendSignedTx() {
    throw new Error("Ogre Tek demo mode never submits live transactions.");
  }
}

class UnconfiguredPerpsProvider {
  constructor(name) {
    this.name = name;
  }

  async getMarkets() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async getMarket() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async getAccount() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async getPositions() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async getOpenOrders() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async getFundingRates() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async quoteOrder() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async buildOpenPositionTx() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async buildClosePositionTx() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async buildCancelOrderTx() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async simulateTx() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }

  async sendSignedTx() {
    throw new Error(`${this.name} adapter is not configured yet.`);
  }
}

export class DriftPerpsProvider extends UnconfiguredPerpsProvider {
  constructor() {
    super("Drift perps");
  }
}

export class JupiterPerpsProvider extends UnconfiguredPerpsProvider {
  constructor() {
    super("Jupiter perps");
  }
}

export function createPerpsProvider(config = DEFAULT_OGRE_TEK_CONFIG) {
  if (config.provider === "drift") return new DriftPerpsProvider(config);
  if (config.provider === "jupiter") return new JupiterPerpsProvider(config);
  return new MockPerpsProvider(config);
}

export function normalizePerpOrder(order = {}) {
  return {
    marketSymbol: String(order.marketSymbol || "SOL-PERP").trim().toUpperCase(),
    direction: String(order.direction || "long").toLowerCase() === "short" ? "short" : "long",
    orderType: String(order.orderType || "market").toLowerCase(),
    collateralUsd: numericInput(order.collateralUsd, 0),
    leverage: numericInput(order.leverage, 1),
    slippagePct: numericInput(order.slippagePct, 0.5),
    priorityFeeLamports: Math.max(0, numericInput(order.priorityFeeLamports, 0)),
    limitPrice: order.limitPrice === "" || order.limitPrice === undefined ? null : toFiniteNumber(order.limitPrice, null),
    stopPrice: order.stopPrice === "" || order.stopPrice === undefined ? null : toFiniteNumber(order.stopPrice, null)
  };
}

export function calculatePerpQuote(market, orderInput, config = DEFAULT_OGRE_TEK_CONFIG) {
  const order = normalizePerpOrder(orderInput);
  const entryPrice = order.orderType === "limit" && Number.isFinite(order.limitPrice) && order.limitPrice > 0
    ? order.limitPrice
    : Number(market?.indexPrice || 0);
  const leverage = Math.min(Math.max(order.leverage, 1), config.maxLeverage);
  const collateralUsd = Math.max(0, order.collateralUsd);
  const positionSizeUsd = collateralUsd * leverage;
  const quantity = entryPrice > 0 ? positionSizeUsd / entryPrice : 0;
  const maintenanceBuffer = 0.9 / leverage;
  const liquidationPrice = entryPrice > 0
    ? order.direction === "long"
      ? entryPrice * Math.max(0.01, 1 - maintenanceBuffer)
      : entryPrice * (1 + maintenanceBuffer)
    : NaN;
  const takerFeeUsd = positionSizeUsd * 0.0006;
  const fundingImpactUsd = positionSizeUsd * (Number(market?.fundingRatePct || 0) / 100);
  const slippageUsd = positionSizeUsd * (Math.max(order.slippagePct, 0) / 100);
  return {
    marketSymbol: order.marketSymbol,
    direction: order.direction,
    orderType: order.orderType,
    collateralUsd,
    leverage,
    entryPrice,
    positionSizeUsd,
    quantity,
    liquidationPrice,
    takerFeeUsd,
    fundingImpactUsd,
    slippageUsd,
    maxLossUsd: collateralUsd,
    updatedAt: new Date().toISOString()
  };
}

export function validatePerpOrder(orderInput, market, account, config = DEFAULT_OGRE_TEK_CONFIG) {
  const order = normalizePerpOrder(orderInput);
  const errors = [];
  const warnings = [];
  const now = Date.now();
  const marketUpdatedAt = Date.parse(market?.updatedAt || "");
  const accountUpdatedAt = Date.parse(account?.updatedAt || "");

  if (!config.enabled) errors.push("Ogre Tek is not enabled yet.");
  if (config.emergencyDisabled) errors.push("Ogre Tek is globally disabled.");
  if (!market) errors.push("Select a supported perps market.");
  if (!account?.connected) errors.push("Connect a wallet before reviewing a live perps trade.");
  if (!Number.isFinite(order.collateralUsd) || order.collateralUsd <= 0) errors.push("Collateral must be a positive number.");
  if (!Number.isFinite(order.leverage) || order.leverage < 1) errors.push("Leverage must be at least 1x.");
  if (order.leverage > config.maxLeverage) errors.push(`Leverage is capped at ${config.maxLeverage}x.`);
  if (order.collateralUsd * order.leverage > config.maxPositionSize) errors.push(`Estimated position exceeds the configured max size of $${config.maxPositionSize}.`);
  if (order.slippagePct < 0 || !Number.isFinite(order.slippagePct)) errors.push("Slippage must be a valid positive percentage.");
  if (order.slippagePct > 2) warnings.push("High slippage can make entry worse than expected.");
  if (order.leverage >= Math.max(3, config.maxLeverage * 0.7)) warnings.push("High leverage increases liquidation risk.");
  if (Number(market?.fundingRatePct || 0) > 0.05) warnings.push("Funding is elevated for this market.");
  if (marketUpdatedAt && now - marketUpdatedAt > config.staleMarketMs) errors.push("Market data is stale. Refresh before reviewing.");
  if (accountUpdatedAt && now - accountUpdatedAt > config.staleAccountMs) errors.push("Wallet/account data is stale. Refresh before reviewing.");
  if (account?.availableCollateralUsd !== undefined && order.collateralUsd > account.availableCollateralUsd) errors.push("Collateral exceeds available account balance.");

  const quote = market ? calculatePerpQuote(market, order, config) : null;
  if (!quote || !Number.isFinite(quote.liquidationPrice) || quote.liquidationPrice <= 0) errors.push("Liquidation estimate is unavailable.");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    quote,
    order
  };
}

export function canSubmitPerpOrder({ validation, riskAccepted = false, demoMode = true } = {}) {
  if (demoMode) return false;
  return Boolean(validation?.ok && riskAccepted);
}
