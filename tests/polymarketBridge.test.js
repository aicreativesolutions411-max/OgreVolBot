import assert from "node:assert/strict";
import test from "node:test";
import {
  POLYMARKET_SOL_BRIDGE,
  createPolymarketBridgeService,
  pUsdToRawExact,
  solToLamportsExact
} from "../src/lib/polymarketBridge.js";

const polyWallet = "0x1111111111111111111111111111111111111111";
const solWallet = "So11111111111111111111111111111111111111112";
const svmBridge = "CrvTBvzryYxBHbWu2TiQpcqD5M7Le7iBKzVmEj3f36Jb";
const evmBridge = "0x23566f8b2E82aDfCf01846E54899d110e97AC053";

function response(value, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => value };
}

function service(calls) {
  return createPolymarketBridgeService({
    env: { POLYMARKET_BUILDER_CODE: `0x${"ab".repeat(32)}` },
    fetchImpl: async (url, options = {}) => {
      calls.push({ url, options, body: options.body ? JSON.parse(options.body) : null });
      if (url.endsWith("/supported-assets")) return response({ supportedAssets: [{ chainId: POLYMARKET_SOL_BRIDGE.solanaChainId, token: { symbol: "SOL", address: POLYMARKET_SOL_BRIDGE.solNativeAddress }, minCheckoutUsd: 2 }] });
      if (url.endsWith("/deposit")) return response({ address: { evm: evmBridge, svm: svmBridge } }, 201);
      if (url.endsWith("/withdraw")) return response({ address: { evm: evmBridge, svm: svmBridge } }, 201);
      if (url.endsWith("/quote")) return response({ quoteId: "quote", estInputUsd: 10, estOutputUsd: 9.8, estToTokenBaseUnit: "9800000", estCheckoutTimeMs: 25_000, estFeeBreakdown: { minReceived: 9.7, totalImpactUsd: 0.2, totalImpact: 2, maxSlippage: 0.5 } });
      if (url.includes("/status/")) return response({ transactions: [{ fromChainId: POLYMARKET_SOL_BRIDGE.solanaChainId, fromAmountBaseUnit: "100000000", status: "COMPLETED", txHash: "hash", createdTimeMs: 10 }] });
      return response({ error: "unknown" }, 404);
    }
  });
}

test("SOL and pUSD amounts convert to exact integer base units", () => {
  assert.equal(solToLamportsExact("0.1"), 100_000_000n);
  assert.equal(solToLamportsExact("1.000000001"), 1_000_000_001n);
  assert.equal(pUsdToRawExact("12.34"), 12_340_000n);
  assert.throws(() => solToLamportsExact("0.0000000001"), /9 decimal/);
});

test("SOL funding uses an SVM bridge address and quotes pUSD on Polygon", async () => {
  const calls = [];
  const bridge = service(calls);
  const preview = await bridge.quoteSolDeposit({ amountSol: "0.1", polymarketWallet: polyWallet });
  assert.equal(preview.amountLamports, "100000000");
  assert.equal(preview.addresses.svm, svmBridge);
  const quote = calls.find((row) => row.url.endsWith("/quote"));
  assert.deepEqual(quote.body, {
    fromAmountBaseUnit: "100000000",
    fromChainId: POLYMARKET_SOL_BRIDGE.solanaChainId,
    fromTokenAddress: POLYMARKET_SOL_BRIDGE.solNativeAddress,
    recipientAddress: polyWallet,
    toChainId: POLYMARKET_SOL_BRIDGE.polygonChainId,
    toTokenAddress: POLYMARKET_SOL_BRIDGE.pUsdAddress
  });
  assert.equal(calls.find((row) => row.url.endsWith("/deposit")).options.headers["X-Builder-Code"], `0x${"ab".repeat(32)}`);
});

test("cash-out creates a SOL-configured withdrawal and quotes pUSD to native SOL", async () => {
  const calls = [];
  const bridge = service(calls);
  const preview = await bridge.quoteSolWithdrawal({ amountPUsd: "10", solRecipient: solWallet });
  assert.equal(preview.amountRaw, "10000000");
  const addresses = await bridge.withdrawalAddresses({ polymarketWallet: polyWallet, solRecipient: solWallet });
  assert.equal(addresses.evm, evmBridge);
  const withdrawal = calls.find((row) => row.url.endsWith("/withdraw"));
  assert.deepEqual(withdrawal.body, {
    address: polyWallet,
    toChainId: POLYMARKET_SOL_BRIDGE.solanaChainId,
    toTokenAddress: POLYMARKET_SOL_BRIDGE.solNativeAddress,
    recipientAddr: solWallet
  });
});

test("bridge status is reduced to safe public transaction fields", async () => {
  const calls = [];
  const bridge = service(calls);
  const rows = await bridge.status(svmBridge);
  assert.deepEqual(rows[0], {
    fromChainId: POLYMARKET_SOL_BRIDGE.solanaChainId,
    fromTokenAddress: "",
    fromAmountBaseUnit: "100000000",
    toChainId: "",
    toTokenAddress: "",
    status: "COMPLETED",
    txHash: "hash",
    createdTimeMs: 10
  });
});

test("provider failures return one stable no-funds-moved error", async () => {
  const bridge = createPolymarketBridgeService({ fetchImpl: async () => response({ error: "provider detail" }, 500) });
  await assert.rejects(() => bridge.depositAddresses(polyWallet), /temporarily unavailable\. No funds were moved/);
});
