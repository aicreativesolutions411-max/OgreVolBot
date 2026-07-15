import assert from "node:assert/strict";
import test from "node:test";
import { fetchEthereumFundFlows, normalizeEthereumFundFlows } from "../src/lib/ethereumFundMap.js";

const ME = "0x0000000000000000000000000000000000000001";
const OTHER = "0x0000000000000000000000000000000000000002";
const TOKEN = "0x0000000000000000000000000000000000000003";

test("Ethereum Blockscout activity normalizes native, internal, and ERC-20 flows", () => {
  const rows = normalizeEthereumFundFlows({
    transactions: { items: [{ hash: "0xaaa", from: { hash: OTHER }, to: { hash: ME }, value: "1500000000000000000", timestamp: "2026-07-15T12:00:00Z" }] },
    internalTransactions: { items: [{ transaction_hash: "0xbbb", index: 2, from: { hash: ME }, to: { hash: OTHER }, value: "250000000000000000" }] },
    tokenTransfers: { items: [{ transaction_hash: "0xccc", log_index: 4, from: { hash: OTHER }, to: { hash: ME }, token: { address_hash: TOKEN, symbol: "SLIME" }, total: { value: "1234500", decimals: "6" } }] }
  });
  assert.equal(rows.length, 3);
  assert.equal(rows[0].native, 1.5);
  assert.equal(rows[1].native, 0.25);
  assert.equal(rows[2].tokenAmount, 1.2345);
  assert.equal(rows[2].mint, TOKEN);
  assert.equal(rows[2].symbol, "SLIME");
});

test("zero-value contract calls and duplicate token logs do not pollute a fund map", () => {
  const transfer = { transaction_hash: "0xccc", log_index: 1, from: { hash: ME }, to: { hash: OTHER }, token: { address_hash: TOKEN }, total: { value: "1", decimals: 0 } };
  const rows = normalizeEthereumFundFlows({
    transactions: { items: [{ hash: "0xzero", from: { hash: ME }, to: { hash: OTHER }, value: "0" }] },
    tokenTransfers: { items: [transfer, transfer] }
  });
  assert.equal(rows.length, 1);
});

test("Ethereum activity fetches all three bounded Blockscout feeds", async () => {
  const paths = [];
  const rows = await fetchEthereumFundFlows(ME, {
    fetchJson: async (url) => {
      paths.push(new URL(url).pathname);
      if (url.endsWith("/transactions")) return { items: [{ hash: "0x1", from: { hash: OTHER }, to: { hash: ME }, value: "1000000000000000000" }] };
      return { items: [] };
    }
  });
  assert.deepEqual(paths.sort(), [
    `/api/v2/addresses/${ME}/internal-transactions`,
    `/api/v2/addresses/${ME}/token-transfers`,
    `/api/v2/addresses/${ME}/transactions`
  ].sort());
  assert.equal(rows.length, 1);
});
