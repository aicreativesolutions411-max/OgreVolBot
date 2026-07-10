import assert from "node:assert/strict";
import test from "node:test";
import { classifyRhAddress } from "../src/lib/rhAddressKind.js";

const ADDRESS = "0x1111111111111111111111111111111111111111";
const response = (status, json) => ({ ok: status >= 200 && status < 300, status, json: async () => json });
const hex32 = (n = "1") => `0x${n.padStart(64, "0")}`;

test("Robinhood Blockscout ERC-20 metadata routes an address to the coin card", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("blockscout")) return response(200, { type: "ERC-20", symbol: "SLIME" });
    return new Promise(() => {});
  };
  assert.deepEqual(await classifyRhAddress(ADDRESS, { fetchImpl, rpcUrl: "https://rpc.test", timeoutMs: 100 }), {
    isToken: true, source: "blockscout-token",
  });
});

test("Robinhood EOA routes to the wallet card even when Blockscout token lookup misses", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("blockscout")) return response(404, {});
    return response(200, [
      { id: 1, result: "0x" }, { id: 2, result: "0x" }, { id: 3, result: "0x" }, { id: 4, result: "0x" },
    ]);
  };
  assert.equal((await classifyRhAddress(ADDRESS, { fetchImpl, rpcUrl: "https://rpc.test" })).isToken, false);
});

test("Robinhood smart-contract wallet is not mistaken for an ERC-20 coin", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("blockscout")) return response(404, {});
    return response(200, [
      { id: 1, result: "0x6001600055" }, { id: 2, error: { code: 3 } },
      { id: 3, error: { code: 3 } }, { id: 4, error: { code: 3 } },
    ]);
  };
  const kind = await classifyRhAddress(ADDRESS, { fetchImpl, rpcUrl: "https://rpc.test" });
  assert.deepEqual(kind, { isToken: false, source: "rpc-smart-wallet" });
});

test("fresh ERC-20 is recognized from RPC before Blockscout indexes it", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("blockscout")) return response(404, {});
    return response(200, [
      { id: 1, result: "0x6001600055" }, { id: 2, result: hex32("10") },
      { id: 3, result: hex32("12") }, { id: 4, result: hex32("20") },
    ]);
  };
  assert.deepEqual(await classifyRhAddress(ADDRESS, { fetchImpl, rpcUrl: "https://rpc.test" }), {
    isToken: true, source: "rpc-erc20",
  });
});

test("slower Blockscout ERC-20 evidence beats a fast smart-wallet RPC guess", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("blockscout")) {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return response(200, { type: "ERC-20", symbol: "SLIME" });
    }
    return response(200, [
      { id: 1, result: "0x6001600055" }, { id: 2, error: { code: 3 } },
      { id: 3, error: { code: 3 } }, { id: 4, error: { code: 3 } },
    ]);
  };
  assert.deepEqual(await classifyRhAddress(ADDRESS, { fetchImpl, rpcUrl: "https://rpc.test", fallbackRpcUrl: "", timeoutMs: 100 }), {
    isToken: true, source: "blockscout-token",
  });
});

test("unavailable providers return unknown instead of guessing coin", async () => {
  const fetchImpl = async () => { throw new Error("offline"); };
  assert.deepEqual(await classifyRhAddress(ADDRESS, { fetchImpl, rpcUrl: "https://rpc.test" }), {
    isToken: null, source: "unavailable",
  });
});
