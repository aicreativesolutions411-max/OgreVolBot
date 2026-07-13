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

test("uses GeckoTerminal when DexScreener has not indexed the exact pool", async () => {
  const fetchImpl = async (url) => {
    if (url.includes("dexscreener")) return response({ pairs: null });
    return response({ data: {
      id: `robinhood_${POOL}`,
      attributes: { address: POOL },
      relationships: {
        base_token: { data: { id: `robinhood_${PHOOD}` } },
        quote_token: { data: { id: `robinhood_${WETH}` } },
      },
    } });
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), PHOOD);
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
  const fetchImpl = async (url) => {
    if (url.includes("dexscreener")) {
      return response({ pairs: [{
        chainId: "robinhood",
        pairAddress: unrelatedPool,
        baseToken: { address: PHOOD },
        quoteToken: { address: VIRTUAL },
      }] });
    }
    return response({}, false);
  };
  assert.equal(await resolveRhPoolToken(POOL, { fetchImpl }), POOL);
});

test("passes an ordinary RH token through unchanged", async () => {
  const fetchImpl = async () => response({}, false);
  assert.equal(await resolveRhPoolToken(PHOOD, { fetchImpl }), PHOOD);
});

test("rejects malformed non-address input without provider calls", async () => {
  let calls = 0;
  const result = await resolveRhPoolToken("$PHOOD", { fetchImpl: async () => { calls += 1; return response({}); } });
  assert.equal(result, "");
  assert.equal(calls, 0);
});
