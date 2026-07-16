import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

const helperStart = serverSource.indexOf("function normalizeRobinhoodTokenAddress");
const helperEnd = serverSource.indexOf("\nasync function resolveGeckoPoolForRobinhoodToken", helperStart);
assert.notEqual(helperStart, -1, "Robinhood address normalizer missing");
assert.notEqual(helperEnd, -1, "Robinhood pool resolver missing");
const helpers = Function(`${serverSource.slice(helperStart, helperEnd)}\nreturn { normalizeRobinhoodTokenAddress, bestGeckoPoolForToken };`)();

const TOKEN = "0x26C41B10527DE2Dc870fa5C9D5f4A8dBAA966cDf";
const OTHER = "0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31";

function pool(address, reserve, base, quote) {
  return {
    id: `robinhood_${address}`,
    attributes: { address, reserve_in_usd: String(reserve) },
    relationships: {
      base_token: { data: { id: `robinhood_${base}` } },
      quote_token: { data: { id: `robinhood_${quote}` } }
    }
  };
}

test("Robinhood OHLCV accepts only an exact nonzero 0x token address", () => {
  assert.equal(helpers.normalizeRobinhoodTokenAddress(TOKEN), TOKEN.toLowerCase());
  assert.equal(helpers.normalizeRobinhoodTokenAddress(` ${TOKEN}`), "");
  assert.equal(helpers.normalizeRobinhoodTokenAddress(TOKEN.slice(0, -1)), "");
  assert.equal(helpers.normalizeRobinhoodTokenAddress(TOKEN.replace(/^0x/, "0X")), "");
  assert.equal(helpers.normalizeRobinhoodTokenAddress(`0x${"0".repeat(40)}`), "");
});

test("Robinhood pool selection uses the deepest exact-token pool and preserves quote side", () => {
  const target = TOKEN.toLowerCase();
  const other = OTHER.toLowerCase();
  const unrelated = "0x1111111111111111111111111111111111111111";
  const selected = helpers.bestGeckoPoolForToken([
    pool("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", 100, target, other),
    pool("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", 500, other, target),
    pool("0xcccccccccccccccccccccccccccccccccccccccc", 50_000, other, unrelated)
  ], TOKEN, "robinhood");
  assert.deepEqual(selected, {
    address: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    tokenSide: "quote",
    reserveUsd: 500
  });
});

test("public OHLCV route and cache are chain-aware without changing Solana fallbacks", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/ohlcv"[\s\S]*normalizeRobinhoodTokenAddress\(rawOhlcvMint\)/);
  assert.match(serverSource, /webOhlcvPayload\(ohlcvMint, tfKey, \{ network: ohlcvNetwork \}\)/);
  assert.match(serverSource, /api\.geckoterminal\.com\/api\/v2\/networks\/robinhood\/tokens\/\$\{encodeURIComponent\(token\)\}\/pools\?page=1/);
  assert.match(serverSource, /networks\/\$\{network\}\/pools\/\$\{encodeURIComponent\(pool\)\}\/ohlcv\/\$\{tf\.path\}[\s\S]*token=\$\{tokenSide\}/);
  assert.match(serverSource, /const cacheKey = `\$\{network\}:\$\{normalizedMint\}:\$\{tfKey\}`/);
  assert.match(serverSource, /if \(network === "solana"\) pumpPortalStream\.watchMint\(mint\)/);
  assert.match(serverSource, /!candles\.length && network === "solana"[\s\S]*synthCandlesFromPumpTrades/);
  assert.match(serverSource, /return \{ \.\.\.cached\.payload, stale: true \}/);
});
