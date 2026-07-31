import test from "node:test";
import assert from "node:assert/strict";

import {
  ALCHEMY_SOLANA_METHOD_CU,
  alchemyErrorCostsCu,
  createAlchemyRpcTelemetry,
  inferSolanaRpcMethod,
  isAlchemyRpcProvider
} from "../src/lib/alchemyRpcTelemetry.js";

test("infers the billed Solana method from stable rpcRead labels", () => {
  assert.equal(inferSolanaRpcMethod("smart-call sigs"), "getSignaturesForAddress");
  assert.equal(inferSolanaRpcMethod("position pnl token history"), "getSignaturesForAddress");
  assert.equal(inferSolanaRpcMethod("smart-call tx"), "getTransaction");
  assert.equal(inferSolanaRpcMethod("get latest blockhash"), "getLatestBlockhash");
  assert.equal(inferSolanaRpcMethod("get block height"), "getBlockHeight");
  assert.equal(inferSolanaRpcMethod("minimum balance for rent exemption"), "getMinimumBalanceForRentExemption");
  assert.equal(inferSolanaRpcMethod("get fee for message"), "getFeeForMessage");
  assert.equal(inferSolanaRpcMethod("simulate transaction"), "simulateTransaction");
  assert.equal(inferSolanaRpcMethod("confirm versioned transaction"), "getSignatureStatuses");
  assert.equal(inferSolanaRpcMethod("send raw transaction"), "sendTransaction");
  assert.equal(inferSolanaRpcMethod("get mint safety info"), "getAccountInfo");
  assert.equal(inferSolanaRpcMethod("get wallet SOL balance"), "getBalance");
  assert.equal(inferSolanaRpcMethod("get SPL token accounts"), "getTokenAccountsByOwner");
  assert.equal(inferSolanaRpcMethod("onchain dist: token accounts"), "getMultipleAccounts");
  assert.equal(inferSolanaRpcMethod("onchain dist: largest"), "getTokenLargestAccounts");
  assert.equal(inferSolanaRpcMethod("scan token supply"), "getTokenSupply");
  assert.equal(inferSolanaRpcMethod("onchain dist: holder count"), "getProgramAccounts");
  assert.equal(inferSolanaRpcMethod("anything", "getBalance"), "getBalance");
});

test("records only Alchemy attempts and keeps documented zero-CU errors free", () => {
  const telemetry = createAlchemyRpcTelemetry({ maxLabels: 16, topLabels: 4 });
  assert.equal(isAlchemyRpcProvider("alchemy", ""), true);
  assert.equal(isAlchemyRpcProvider("custom", "solana-mainnet.g.alchemy.com"), true);
  assert.equal(isAlchemyRpcProvider("helius", "mainnet.helius-rpc.com"), false);

  telemetry.record({ label: "smart-call sigs", providerName: "alchemy" });
  telemetry.record({ label: "smart-call sigs", providerName: "alchemy", retry: true, error: new Error("429") });
  telemetry.record({ label: "get wallet SOL balance", providerName: "alchemy" });
  telemetry.record({ label: "smart-call tx", providerName: "helius" });

  const result = telemetry.snapshot();
  assert.equal(result.requests, 3);
  assert.equal(result.successful, 2);
  assert.equal(result.errors, 1);
  assert.equal(result.retries, 1);
  assert.equal(result.estimatedCu, ALCHEMY_SOLANA_METHOD_CU.getSignaturesForAddress + ALCHEMY_SOLANA_METHOD_CU.getBalance);
  assert.equal(result.topConsumers[0].label, "smart-call sigs");
  assert.equal(result.topConsumers[0].requests, 2);
  assert.equal(result.byMethod.find((row) => row.method === "getSignaturesForAddress")?.estimatedCu, 40);
  assert.equal(alchemyErrorCostsCu(Object.assign(new Error("forbidden"), { status: 403 })), false);
  assert.equal(alchemyErrorCostsCu(Object.assign(new Error("method not found"), { code: -32601 })), false);
  assert.equal(alchemyErrorCostsCu(new Error("IP Address not on whitelist")), false);
  assert.equal(alchemyErrorCostsCu(new Error("ordinary provider failure")), true);
});

test("redacts address-like and numeric identifiers from public feature labels", () => {
  const telemetry = createAlchemyRpcTelemetry();
  telemetry.record({
    label: "wallet 9xQeWvG816bUx9EPfA18mEQKk6a7pqjE9we1jvVx6K2 call 123456789",
    method: "getBalance",
    providerName: "alchemy"
  });
  const label = telemetry.snapshot().topConsumers[0].label;
  assert.equal(label, "wallet <id> call <number>");
});

test("bounds label cardinality and aggregates overflow without losing totals", () => {
  const telemetry = createAlchemyRpcTelemetry({ maxLabels: 8, topLabels: 12 });
  for (let index = 0; index < 20; index += 1) {
    telemetry.record({
      label: `dynamic-${index}`,
      method: "getBalance",
      providerHost: "solana-mainnet.g.alchemy.com"
    });
  }
  const result = telemetry.snapshot();
  assert.equal(result.requests, 20);
  assert.equal(result.estimatedCu, 200);
  assert.equal(result.trackedLabelCount, 8);
  assert.ok(result.topConsumers.some((row) => row.label === "other" && row.requests === 13));
});
