import { ClobClient, AssetType, Chain, OrderType, Side, SignatureTypeV2 } from "@polymarket/clob-client-v2";
import { RelayClient } from "@polymarket/builder-relayer-client";
import { BuilderConfig } from "@polymarket/builder-signing-sdk";
import { createWalletClient, encodeFunctionData, http, maxUint256, zeroHash } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { polygon } from "viem/chains";
import { POLYMARKET_SOL_BRIDGE, pUsdToRawExact } from "./polymarketBridge.js";

export const POLYMARKET_CONTRACTS = Object.freeze({
  pUsd: "0xC011a7E12a19f7B1f670d46F03B03f3342E82DFB",
  conditionalTokens: "0x4D97DCd97eC945f40cF65F87097ACe5EA0476045",
  collateralAdapter: "0xAdA100Db00Ca00073811820692005400218FcE1f",
  negRiskCollateralAdapter: "0xadA2005600Dec949baf300f4C6120000bDB6eAab",
  exchange: "0xE111180000d2663C0091e4f400237545B87B996B",
  negRiskExchange: "0xe2222d279d744050d28e00520010520000310F59"
});

const BLOCKED_COUNTRIES = new Set([
  "AU", "BE", "BY", "BI", "CF", "CD", "CU", "DE", "ET", "FR", "GB", "IR", "IQ", "IT", "KP", "LB", "LY", "MM", "NI", "NL", "RU", "SG", "SO", "SS", "SD", "SY", "TW", "UM", "US", "VE", "YE", "ZW"
]);

const TOKEN_ID_RE = /^\d{1,90}$/;
const ORDER_ID_RE = /^0x[0-9a-f]{64}$/i;
const PRIVATE_KEY_RE = /^0x[0-9a-f]{64}$/i;
const BYTES32_RE = /^0x[0-9a-f]{64}$/i;
const EVM_ADDRESS_RE = /^0x[0-9a-f]{40}$/i;

export function polymarketCountryCode(value) {
  const code = String(value || "").trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "";
}

export function polymarketRegionAllowed(countryCode) {
  const code = polymarketCountryCode(countryCode);
  return code ? !BLOCKED_COUNTRIES.has(code) : null;
}

export function normalizePolymarketTradeIntent(input = {}) {
  const tokenId = String(input.tokenId || input.assetId || "").trim();
  if (!TOKEN_ID_RE.test(tokenId)) throw new Error("Choose a valid Polymarket outcome.");
  const side = String(input.side || "buy").trim().toUpperCase();
  if (!Object.values(Side).includes(side)) throw new Error("Order side must be buy or sell.");
  const orderKind = String(input.orderKind || input.type || "market").trim().toLowerCase();
  if (!new Set(["market", "limit"]).has(orderKind)) throw new Error("Order type must be market or limit.");
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 1 || amount > 100_000) {
    throw new Error(side === Side.BUY ? "Enter an amount from 1 to 100,000 pUSD." : "Enter 1 to 100,000 shares.");
  }
  let price = null;
  if (orderKind === "limit") {
    price = Number(input.price);
    if (!Number.isFinite(price) || price < 0.001 || price > 0.999) throw new Error("Limit price must be between 0.1¢ and 99.9¢.");
  }
  return {
    tokenId,
    conditionId: String(input.conditionId || "").trim().slice(0, 100),
    eventId: String(input.eventId || "").trim().slice(0, 100),
    eventSlug: String(input.eventSlug || "").trim().slice(0, 160),
    title: String(input.title || "Prediction market").trim().slice(0, 180),
    outcome: String(input.outcome || "Outcome").trim().slice(0, 80),
    side,
    orderKind,
    amount: Math.round(amount * 1e6) / 1e6,
    price: price == null ? null : Math.round(price * 10_000) / 10_000
  };
}

export function polymarketTradingConfig(env = process.env) {
  const builderCode = String(env.POLYMARKET_BUILDER_CODE || "").trim();
  const builderCreds = {
    key: String(env.POLYMARKET_BUILDER_KEY || "").trim(),
    secret: String(env.POLYMARKET_BUILDER_SECRET || "").trim(),
    passphrase: String(env.POLYMARKET_BUILDER_PASSPHRASE || "").trim()
  };
  const relayerConfigured = Object.values(builderCreds).every(Boolean);
  const builderConfigured = BYTES32_RE.test(builderCode);
  return {
    host: String(env.POLYMARKET_CLOB_HOST || "https://clob.polymarket.com").trim().replace(/\/+$/, ""),
    relayerUrl: String(env.POLYMARKET_RELAYER_URL || "https://relayer-v2.polymarket.com").trim().replace(/\/+$/, ""),
    polygonRpcUrl: String(env.POLYMARKET_POLYGON_RPC_URL || env.POLYGON_RPC_URL || "https://polygon-rpc.com").trim(),
    builderCode,
    builderCreds,
    // CLOB V2 builder attribution is optional. Orders remain valid without a
    // builder code; they simply are not attributed to a Builder Profile.
    builderConfigured,
    orderConfigured: true,
    relayerConfigured
  };
}

function privateKeyAccount(privateKey) {
  const normalized = String(privateKey || "").trim();
  if (!PRIVATE_KEY_RE.test(normalized)) throw new Error("SlimeWire wallet signer is unavailable.");
  return privateKeyToAccount(normalized);
}

function pUsdNumber(value) {
  const raw = String(value || "0");
  if (!/^\d+$/.test(raw)) return 0;
  return Number(BigInt(raw)) / 1e6;
}

function publicOrder(order = {}) {
  return {
    id: String(order.id || order.orderID || ""),
    status: String(order.status || ""),
    market: String(order.market || ""),
    tokenId: String(order.asset_id || order.assetId || ""),
    side: String(order.side || ""),
    outcome: String(order.outcome || ""),
    originalSize: Number(order.original_size || 0),
    matchedSize: Number(order.size_matched || 0),
    price: Number(order.price || 0),
    orderType: String(order.order_type || ""),
    createdAt: Number(order.created_at || 0)
  };
}

function validApiCreds(creds) {
  return Boolean(creds && String(creds.key || "").trim() && String(creds.secret || "").trim() && String(creds.passphrase || "").trim());
}

export async function createOrDerivePolymarketApiKey(client) {
  // Existing wallets should derive nonce-0 credentials first. The current v2 SDK helper calls
  // create first and does not catch the "already used" response, so every service restart can
  // strand an account that worked before. A final derive also covers concurrent first setup.
  for (const method of ["deriveApiKey", "createApiKey", "deriveApiKey"]) {
    try {
      const creds = await client[method]();
      if (validApiCreds(creds)) return creds;
    } catch {}
  }
  throw new Error("Polymarket trading account credentials are temporarily unavailable.");
}

export function createPolymarketTradingService({ env = process.env } = {}) {
  const config = polymarketTradingConfig(env);
  const contexts = new Map();

  function walletClientFor(privateKey) {
    const account = privateKeyAccount(privateKey);
    const walletClient = createWalletClient({ account, chain: polygon, transport: http(config.polygonRpcUrl) });
    return { account, walletClient };
  }

  function builderConfig() {
    if (!config.relayerConfigured) return undefined;
    return new BuilderConfig({ localBuilderCreds: config.builderCreds });
  }

  async function relayerFor(privateKey) {
    const { account, walletClient } = walletClientFor(privateKey);
    const relayer = new RelayClient(config.relayerUrl, Chain.POLYGON, walletClient, builderConfig());
    const depositAddress = await relayer.deriveDepositWalletAddress();
    return { account, walletClient, relayer, depositAddress };
  }

  async function contextFor(privateKey) {
    const { account, walletClient, relayer, depositAddress } = await relayerFor(privateKey);
    const cacheKey = account.address.toLowerCase();
    const hit = contexts.get(cacheKey);
    if (hit && Date.now() - hit.at < 20 * 60_000) return hit.value;
    const l1Client = new ClobClient({
      host: config.host,
      chain: Chain.POLYGON,
      signer: walletClient,
      signatureType: SignatureTypeV2.POLY_1271,
      funderAddress: depositAddress,
      useServerTime: true,
      builderConfig: config.builderConfigured ? { builderCode: config.builderCode } : undefined,
      throwOnError: true,
      retryOnError: true
    });
    const creds = await createOrDerivePolymarketApiKey(l1Client);
    const client = new ClobClient({
      host: config.host,
      chain: Chain.POLYGON,
      signer: walletClient,
      creds,
      signatureType: SignatureTypeV2.POLY_1271,
      funderAddress: depositAddress,
      useServerTime: true,
      builderConfig: config.builderConfigured ? { builderCode: config.builderCode } : undefined,
      throwOnError: true,
      retryOnError: true
    });
    const value = { account, walletClient, relayer, depositAddress, client };
    contexts.set(cacheKey, { at: Date.now(), value });
    while (contexts.size > 256) contexts.delete(contexts.keys().next().value);
    return value;
  }

  async function accountStatus(privateKey) {
    const { account, relayer, depositAddress, client } = await contextFor(privateKey);
    const [deployed, balance, closedOnly] = await Promise.all([
      relayer.getDeployed(depositAddress, "WALLET").catch(() => false),
      client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => ({ balance: "0", allowances: {} })),
      client.getClosedOnlyMode().catch(() => ({ closed_only: false }))
    ]);
    return {
      ownerAddress: account.address,
      depositAddress,
      deployed: Boolean(deployed),
      pUsdBalance: pUsdNumber(balance.balance),
      serviceFeeBps: POLYMARKET_SOL_BRIDGE.serviceFeeBps,
      closedOnly: Boolean(closedOnly?.closed_only),
      builderConfigured: config.builderConfigured,
      orderConfigured: config.orderConfigured,
      relayerConfigured: config.relayerConfigured,
      setupAvailable: config.relayerConfigured,
      liveReady: Boolean(deployed && !closedOnly?.closed_only)
    };
  }

  async function setupAccount(privateKey) {
    if (!config.relayerConfigured) {
      throw Object.assign(new Error("Prediction trading setup is temporarily unavailable. No funds were moved."), {
        statusCode: 503,
        code: "POLYMARKET_RELAYER_NOT_CONFIGURED"
      });
    }
    const { relayer, depositAddress, client } = await contextFor(privateKey);
    let deployed = await relayer.getDeployed(depositAddress, "WALLET").catch(() => false);
    if (!deployed) {
      const response = await relayer.deployDepositWallet();
      const result = await response.wait();
      if (!result) throw new Error("Polymarket deposit wallet deployment did not confirm.");
      deployed = true;
    }
    const calls = [POLYMARKET_CONTRACTS.exchange, POLYMARKET_CONTRACTS.negRiskExchange].flatMap((operator) => [
      {
        target: POLYMARKET_CONTRACTS.pUsd,
        value: "0",
        data: encodeFunctionData({
          abi: [{ type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }],
          functionName: "approve",
          args: [operator, maxUint256]
        })
      },
      {
        target: POLYMARKET_CONTRACTS.conditionalTokens,
        value: "0",
        data: encodeFunctionData({
          abi: [{ type: "function", name: "setApprovalForAll", stateMutability: "nonpayable", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [] }],
          functionName: "setApprovalForAll",
          args: [operator, true]
        })
      }
    ]);
    const deadline = String(Math.floor(Date.now() / 1000) + 240);
    const response = await relayer.executeDepositWalletBatch(calls, depositAddress, deadline);
    const result = await response.wait();
    if (!result) throw new Error("Polymarket trading approvals did not confirm.");
    await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => {});
    return accountStatus(privateKey);
  }

  async function placeOrder(privateKey, rawIntent) {
    const intent = normalizePolymarketTradeIntent(rawIntent);
    const { client } = await contextFor(privateKey);
    const closedOnly = await client.getClosedOnlyMode().catch(() => ({ closed_only: false }));
    if (closedOnly?.closed_only && intent.side === Side.BUY) throw new Error("This Polymarket account is currently close-only.");
    let response;
    if (intent.orderKind === "market") {
      const collateral = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => ({ balance: "0" }));
      response = await client.createAndPostMarketOrder({
        tokenID: intent.tokenId,
        amount: intent.amount,
        side: intent.side,
        orderType: OrderType.FAK,
        userUSDCBalance: pUsdNumber(collateral.balance),
        ...(config.builderConfigured ? { builderCode: config.builderCode } : {})
      }, {}, OrderType.FAK);
    } else {
      const shares = intent.side === Side.BUY ? intent.amount / intent.price : intent.amount;
      response = await client.createAndPostOrder({
        tokenID: intent.tokenId,
        price: intent.price,
        size: Math.floor(shares * 1e6) / 1e6,
        side: intent.side,
        ...(config.builderConfigured ? { builderCode: config.builderCode } : {})
      }, {}, OrderType.GTC);
    }
    if (!response?.success) throw new Error(String(response?.errorMsg || "Polymarket rejected the order."));
    return {
      intent,
      order: {
        id: String(response.orderID || ""),
        status: String(response.status || "submitted"),
        takingAmount: Number(response.takingAmount || 0),
        makingAmount: Number(response.makingAmount || 0),
        transactionHashes: Array.isArray(response.transactionsHashes) ? response.transactionsHashes.slice(0, 10) : [],
        tradeIds: Array.isArray(response.tradeIDs) ? response.tradeIDs.slice(0, 20) : []
      }
    };
  }

  async function openOrders(privateKey) {
    const { client } = await contextFor(privateKey);
    const orders = await client.getOpenOrders({}, false);
    return (Array.isArray(orders) ? orders : []).map(publicOrder);
  }

  async function cancelOrder(privateKey, orderId) {
    const id = String(orderId || "").trim();
    if (!ORDER_ID_RE.test(id)) throw new Error("Valid Polymarket order ID required.");
    const { client } = await contextFor(privateKey);
    await client.cancelOrder({ orderID: id });
    return { orderId: id, canceled: true };
  }

  async function transferPUsdToBridge(privateKey, rawBridgeAddress, rawAmountPUsd) {
    const bridgeAddress = String(rawBridgeAddress || "").trim();
    if (!EVM_ADDRESS_RE.test(bridgeAddress)) throw new Error("SOL cash-out address is unavailable.");
    const amountRaw = pUsdToRawExact(rawAmountPUsd);
    const { relayer, depositAddress, client } = await contextFor(privateKey);
    const balance = await client.getBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => ({ balance: "0" }));
    const availableRaw = /^\d+$/.test(String(balance.balance || "")) ? BigInt(balance.balance) : 0n;
    if (amountRaw > availableRaw) throw new Error("Poly balance changed before cash-out. Refresh and retry.");
    const call = {
      target: POLYMARKET_CONTRACTS.pUsd,
      value: "0",
      data: encodeFunctionData({
        abi: [{ type: "function", name: "transfer", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "amount", type: "uint256" }], outputs: [{ name: "", type: "bool" }] }],
        functionName: "transfer",
        args: [bridgeAddress, amountRaw]
      })
    };
    const deadline = String(Math.floor(Date.now() / 1000) + 240);
    const response = await relayer.executeDepositWalletBatch([call], depositAddress, deadline);
    let result;
    try { result = await response.wait(); }
    catch (error) { error.relayTransactionId = String(response?.transactionID || ""); throw error; }
    if (!result) {
      const error = new Error("SOL cash-out transfer did not confirm.");
      error.relayTransactionId = String(response?.transactionID || "");
      throw error;
    }
    await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => {});
    return {
      bridgeAddress,
      amountPUsd: Number(amountRaw) / 1e6,
      relayTransactionId: String(response?.transactionID || result?.transactionHash || result?.hash || result?.id || "").slice(0, 120)
    };
  }

  async function redeemPosition(privateKey, rawPosition = {}) {
    const conditionId = String(rawPosition.conditionId || "").trim();
    if (!BYTES32_RE.test(conditionId)) throw new Error("Valid Polymarket condition ID required for payout.");
    const { relayer, depositAddress, client } = await contextFor(privateKey);
    const adapter = rawPosition.negativeRisk
      ? POLYMARKET_CONTRACTS.negRiskCollateralAdapter
      : POLYMARKET_CONTRACTS.collateralAdapter;
    const call = {
      target: adapter,
      value: "0",
      data: encodeFunctionData({
        abi: [{ type: "function", name: "redeemPositions", stateMutability: "nonpayable", inputs: [{ name: "collateralToken", type: "address" }, { name: "parentCollectionId", type: "bytes32" }, { name: "conditionId", type: "bytes32" }, { name: "indexSets", type: "uint256[]" }], outputs: [] }],
        functionName: "redeemPositions",
        args: [POLYMARKET_CONTRACTS.pUsd, zeroHash, conditionId, [1n, 2n]]
      })
    };
    const deadline = String(Math.floor(Date.now() / 1000) + 240);
    const response = await relayer.executeDepositWalletBatch([call], depositAddress, deadline);
    let result;
    try { result = await response.wait(); }
    catch (error) { error.relayTransactionId = String(response?.transactionID || ""); throw error; }
    if (!result) {
      const error = new Error("Resolved prediction payout is still confirming.");
      error.relayTransactionId = String(response?.transactionID || "");
      throw error;
    }
    await client.updateBalanceAllowance({ asset_type: AssetType.COLLATERAL }).catch(() => {});
    return {
      conditionId,
      negativeRisk: Boolean(rawPosition.negativeRisk),
      relayTransactionId: String(response?.transactionID || "").slice(0, 120),
      transactionHash: String(result?.transactionHash || "").slice(0, 120)
    };
  }

  async function relayerTransaction(privateKey, rawId) {
    const id = String(rawId || "").trim().slice(0, 120);
    if (!id) throw new Error("Relayer transaction ID required.");
    const { relayer } = await contextFor(privateKey);
    const rows = await relayer.getTransaction(id);
    const row = (Array.isArray(rows) ? rows : [rows]).filter(Boolean)[0] || {};
    return {
      id,
      state: String(row.state || "").toUpperCase(),
      transactionHash: String(row.transactionHash || "").slice(0, 120)
    };
  }

  return {
    config: {
      builderConfigured: config.builderConfigured,
      orderConfigured: config.orderConfigured,
      relayerConfigured: config.relayerConfigured,
      contracts: POLYMARKET_CONTRACTS
    },
    accountStatus,
    setupAccount,
    placeOrder,
    openOrders,
    cancelOrder,
    transferPUsdToBridge,
    redeemPosition,
    relayerTransaction
  };
}
