import test from "node:test";
import assert from "node:assert/strict";

test("Robinhood wallet PnL falls back to Blockscout v2 when legacy token history fails", async () => {
  const originalFetch = globalThis.fetch;
  const wallet = "0x1111111111111111111111111111111111111111";
  const token = "0x2222222222222222222222222222222222222222";
  const hash = `0x${"a".repeat(64)}`;
  let legacyTokenAttempts = 0;

  globalThis.fetch = async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith("/api/v2/stats")) {
      return Response.json({ coin_price: "2000" });
    }
    if (url.hostname === "api.dexscreener.com") {
      return Response.json({ pairs: [{
        chainId: "robinhood",
        baseToken: { address: token },
        quoteToken: { address: "0x3333333333333333333333333333333333333333" },
        priceUsd: "0.001",
        priceNative: "0.0000005",
        liquidity: { usd: 5000 },
      }] });
    }
    if (url.pathname.endsWith("/api")) {
      const action = url.searchParams.get("action");
      if (action === "balance") return Response.json({ status: "1", result: "1000000000000000000" });
      if (action === "tokenlist") return Response.json({ status: "1", result: [{ contractAddress: token, tokenSymbol: "TEST", tokenDecimal: "18", balance: "100000000000000000000" }] });
      if (action === "tokentx") {
        legacyTokenAttempts += 1;
        return new Response("temporary failure", { status: 500 });
      }
      if (action === "txlist") return Response.json({ status: "1", result: [{ hash, from: wallet, to: "0x4444444444444444444444444444444444444444", value: "100000000000000000" }] });
      if (action === "txlistinternal") return Response.json({ status: "0", result: [] });
    }
    if (url.pathname.endsWith(`/addresses/${wallet}/token-transfers`)) {
      return Response.json({ items: [{
        transaction_hash: hash,
        from: { hash: "0x4444444444444444444444444444444444444444" },
        to: { hash: wallet },
        token: { address: token, symbol: "TEST" },
        total: { value: "100000000000000000000", decimals: "18" },
      }], next_page_params: null });
    }
    throw new Error(`Unexpected fetch in test: ${url}`);
  };

  try {
    const { rhWalletScan } = await import(`../src/lib/walletScan.js?fallback-test=${Date.now()}`);
    const scan = await rhWalletScan(wallet, { ttlMs: 0 });
    assert.equal(legacyTokenAttempts, 3, "legacy history is retried before switching sources");
    assert.equal(scan.hasPnl, true);
    assert.equal(scan.tradeCount, 1);
    assert.equal(scan.holdings.length, 1);
    assert.equal(scan.holdings[0].sym, "TEST");
    assert.ok(scan.holdings[0].costUsd > 199 && scan.holdings[0].costUsd < 201);
    assert.ok(scan.unrealizedUsd < -199 && scan.unrealizedUsd > -201);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
