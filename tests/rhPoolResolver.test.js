import test from "node:test";
import assert from "node:assert/strict";
import {
  chooseRhPoolToken,
  clearRhPoolResolverCache,
  rhResolvedPoolHints,
  resolveRhPoolToken,
} from "../src/lib/rhPoolResolver.js";

const POOL = "0x27eaa4899098f0566ee995391db0da49ca60be27";
const PHOOD = "0x26C41B10527DE2Dc870fa5C9D5f4A8dBAA966cDf";
const VIRTUAL = "0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31";
const WETH = "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73";

function response(json, ok = true) {
  return { ok, async json() { return json; } };
}

test.beforeEach(() => clearRhPoolResolverCache());

test("resolves the exact PHOOD liquidity-pair address to PHOOD", async () => {
  const fetchImpl = async (url) => {
    if (url.includes("dexscreener")) {
      return response({ pairs: [{
        chainId: "robinhood",
        pairAddress: POOL,
        baseToken: { address: PHOOD, symbol: "PHOOD" },
        quoteToken: { address: VIRTUAL, symbol: "VIRTUAL" },
      }] });
    }
    return response({}, false);
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), PHOOD);
  const hints = rhResolvedPoolHints(PHOOD);
  assert.equal(hints[0]?.poolAddress, POOL.toLowerCase());
  assert.equal(hints[0]?.pair?.baseToken?.symbol, "PHOOD");
});

test("handles a reversed pool by excluding the known quote asset", () => {
  assert.equal(chooseRhPoolToken(WETH, PHOOD), PHOOD);
  assert.equal(chooseRhPoolToken(PHOOD, VIRTUAL), PHOOD);
});

test("uses the safe RPC fallback without making a server-side GeckoTerminal request", async () => {
  const calls = [];
  const word = (address) => `0x${"0".repeat(24)}${address.slice(2).toLowerCase()}`;
  const fetchImpl = async (url, options = {}) => {
    calls.push(String(url));
    if (String(url).includes("dexscreener")) return response({ pairs: null });
    if (options.method === "POST") {
      return response([
        { jsonrpc: "2.0", id: 1, result: word(PHOOD) },
        { jsonrpc: "2.0", id: 2, result: word(WETH) },
      ]);
    }
    return response({}, false);
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), PHOOD.toLowerCase());
  assert.equal(calls.some((url) => url.includes("api.geckoterminal.com")), false);
});

test("uses DexScreener's independent search index only for an exact pool address", async () => {
  const fetchImpl = async (url) => {
    if (url.includes("search")) {
      return response({ pairs: [{
        chainId: "robinhood",
        pairAddress: POOL,
        baseToken: { address: PHOOD },
        quoteToken: { address: VIRTUAL },
      }] });
    }
    return response({}, false);
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), PHOOD);
});

test("decodes token0/token1 on-chain when both market indexes are unavailable", async () => {
  const word = (address) => `0x${"0".repeat(24)}${address.slice(2).toLowerCase()}`;
  const fetchImpl = async (url, options = {}) => {
    if (options.method === "POST") {
      return response([
        { jsonrpc: "2.0", id: 1, result: word(VIRTUAL) },
        { jsonrpc: "2.0", id: 2, result: word(PHOOD) },
      ]);
    }
    return response({}, false);
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), PHOOD.toLowerCase());
  assert.equal(rhResolvedPoolHints(PHOOD)[0]?.poolAddress, POOL.toLowerCase());
});

test("never substitutes a token from an unrelated pair result", async () => {
  const unrelatedPool = "0x1111111111111111111111111111111111111111";
  const fetchImpl = async (url, options = {}) => {
    if (String(url).includes("dexscreener")) {
      return response({ pairs: [{
        chainId: "robinhood",
        pairAddress: unrelatedPool,
        baseToken: { address: PHOOD },
        quoteToken: { address: VIRTUAL },
      }] });
    }
    if (options.method === "POST") {
      const word = (address) => `0x${"0".repeat(24)}${address.slice(2).toLowerCase()}`;
      // Two ordinary assets are intentionally ambiguous on-chain. The resolver
      // must not guess a token from numerical token0/token1 ordering.
      return response([
        { jsonrpc: "2.0", id: 1, result: word(PHOOD) },
        { jsonrpc: "2.0", id: 2, result: word(unrelatedPool) },
      ]);
    }
    return response({}, false);
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), POOL);
});

test("passes an ordinary RH token through unchanged", async () => {
  const fetchImpl = async () => response({}, false);
  assert.equal(await resolveRhPoolToken(PHOOD, { fetchImpl }), PHOOD);
});

test("interactive resolution returns quickly, shares one probe, then caches the exact pool token", async () => {
  let calls = 0;
  const fetchImpl = async (url, options = {}) => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 180));
    if (options.method === "POST") return response([]);
    return response({ pairs: [{
      chainId: "robinhood",
      pairAddress: POOL,
      baseToken: { address: PHOOD },
      quoteToken: { address: VIRTUAL },
    }] });
  };
  const startedAt = Date.now();
  const [first, second] = await Promise.all([
    resolveRhPoolToken(POOL, { fetchImpl, interactive: true, interactiveTimeoutMs: 10, timeoutMs: 200 }),
    resolveRhPoolToken(POOL, { fetchImpl, interactive: true, interactiveTimeoutMs: 10, timeoutMs: 200 }),
  ]);
  assert.equal(first, POOL);
  assert.equal(second, POOL);
  assert.ok(Date.now() - startedAt < 160, "interactive Telegram path should not wait for every pool probe");
  await new Promise((resolve) => setTimeout(resolve, 220));
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), PHOOD);
  assert.equal(calls, 3, "concurrent callers must share the pair/search/RPC probe set");
});

test("rejects malformed non-address input without provider calls", async () => {
  let calls = 0;
  const result = await resolveRhPoolToken("$PHOOD", { fetchImpl: async () => { calls += 1; return response({}); } });
  assert.equal(result, "");
  assert.equal(calls, 0);
});
