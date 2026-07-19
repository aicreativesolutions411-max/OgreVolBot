import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { createPolymarketClient, normalizePolymarketEvent, polymarketWalletAddress, summarizePolymarketPortfolio } from "../src/lib/polymarket.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");

test("Polymarket wallet links accept only exact Polygon addresses", () => {
  assert.equal(polymarketWalletAddress("0x1111111111111111111111111111111111111111"), "0x1111111111111111111111111111111111111111");
  assert.equal(polymarketWalletAddress("0x1234"), "");
  assert.equal(polymarketWalletAddress("not-a-wallet"), "");
});

test("Polymarket events normalize stringified outcomes without inventing odds", () => {
  const event = normalizePolymarketEvent({
    id: 7, title: "Will it happen?", slug: "will-it-happen", volume24hr: "1200",
    markets: [{ id: 8, question: "Will it happen?", outcomes: '["Yes","No"]', outcomePrices: '["0.62","0.38"]', clobTokenIds: '["yes-token","no-token"]' }]
  });
  assert.equal(event.markets[0].outcomes[0].outcome, "Yes");
  assert.equal(event.markets[0].outcomes[0].price, .62);
  assert.equal(event.url, "https://polymarket.com/event/will-it-happen");
});

test("Polymarket portfolio totals keep open and realized PnL separate", () => {
  const result = summarizePolymarketPortfolio(
    [{ conditionId: "a", asset: "1", currentValue: 25, cashPnl: -3 }],
    [{ conditionId: "b", asset: "2", timestamp: 10, realizedPnl: 8 }]
  );
  assert.deepEqual(result.totals, { openValue: 25, openPnl: -3, realizedPnl: 8, openCount: 1, closedCount: 1 });
  assert.equal(result.closed[0].closed, true);
});

test("Polymarket client uses public Gamma and Data API routes", async () => {
  const urls = [];
  const fakeFetch = async (url) => {
    urls.push(url);
    return { ok: true, json: async () => url.includes("/events?") ? [{ title: "Market", slug: "market", markets: [{ outcomes: '["Yes","No"]', outcomePrices: '["0.5","0.5"]' }] }] : [] };
  };
  const client = createPolymarketClient({ fetchImpl: fakeFetch, cacheTtlMs: 0 });
  await client.events({ limit: 3 });
  await client.portfolio("0x1111111111111111111111111111111111111111");
  assert.ok(urls.some((url) => url.startsWith("https://gamma-api.polymarket.com/events?")));
  assert.ok(urls.some((url) => url.startsWith("https://data-api.polymarket.com/positions?")));
  assert.ok(urls.some((url) => url.startsWith("https://data-api.polymarket.com/closed-positions?")));
});

test("Polymarket client resolves a canonical event before an order ticket is built", async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => ({ id: 7, title: "Market", markets: [{ outcomes: '["Yes","No"]', outcomePrices: '["0.5","0.5"]', clobTokenIds: '["123","456"]' }] }) });
  const client = createPolymarketClient({ fetchImpl: fakeFetch, cacheTtlMs: 0 });
  const event = await client.event("7");
  assert.equal(event.id, "7");
  assert.equal(event.markets[0].outcomes[0].tokenId, "123");
  await assert.rejects(() => client.event("not-an-id"), /valid Polymarket event/);
});

test("Polymarket client dedupes identical in-flight public reads", async () => {
  let calls = 0;
  const fakeFetch = async () => {
    calls += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { ok: true, json: async () => [] };
  };
  const client = createPolymarketClient({ fetchImpl: fakeFetch, cacheTtlMs: 0 });
  await Promise.all([client.events({ limit: 4 }), client.events({ limit: 4 })]);
  assert.equal(calls, 1);
});

test("Polymarket discovery views use official active-event sorting", async () => {
  const urls = [];
  const fakeFetch = async (url) => {
    urls.push(new URL(url));
    return { ok: true, json: async () => url.includes("/tags/slug/") ? { id: "21" } : [] };
  };
  const client = createPolymarketClient({ fetchImpl: fakeFetch, cacheTtlMs: 0 });
  await client.events({ view: "new" });
  await client.events({ view: "ending" });
  await client.events({ view: "liquid" });
  await client.events({ view: "crypto" });
  assert.equal(urls[0].searchParams.get("order"), "startDate");
  assert.equal(urls[0].searchParams.get("ascending"), "false");
  assert.equal(urls[1].searchParams.get("order"), "endDate");
  assert.equal(urls[1].searchParams.get("ascending"), "true");
  assert.equal(urls[2].searchParams.get("order"), "liquidity");
  assert.equal(urls[3].pathname, "/tags/slug/crypto");
  assert.equal(urls[4].pathname, "/events");
  assert.equal(urls[4].searchParams.get("tag_id"), "21");
  assert.equal(urls[4].searchParams.get("related_tags"), "true");
});

test("Polymarket hot view uses Gamma's accepted 24-hour volume field", async () => {
  let requested;
  const client = createPolymarketClient({
    cacheTtlMs: 0,
    fetchImpl: async (url) => {
      requested = new URL(url);
      return { ok: true, json: async () => [] };
    }
  });
  await client.events({ view: "trending" });
  assert.equal(requested.searchParams.get("order"), "volume24hr");
  assert.equal(requested.searchParams.get("ascending"), "false");
});

test("Polymarket text searches keep using public search", async () => {
  let requested;
  const client = createPolymarketClient({
    cacheTtlMs: 0,
    fetchImpl: async (url) => {
      requested = new URL(url);
      return { ok: true, json: async () => ({ events: [] }) };
    }
  });
  await client.events({ query: "bitcoin" });
  assert.equal(requested.pathname, "/public-search");
  assert.equal(requested.searchParams.get("q"), "bitcoin");
});

test("Poly Hub and Telegram integration keep trading internal, idempotent, opt-in, and region-aware", () => {
  const page = read("../web/public/polymarket.html");
  const terminal = read("../web/public/index.html");
  const server = read("../src/index.js");
  assert.match(page, /polymarket\.com\/api\/geoblock/);
  assert.match(page, /\/api\/web\/poly\/markets/);
  assert.match(page, /\/api\/web\/poly\/portfolio/);
  assert.match(page, /\/api\/web\/poly\/trading\/ticket/);
  assert.match(page, /\/api\/web\/poly\/trading\/execute/);
  assert.match(page, /\/api\/web\/poly\/trading\/cancel/);
  assert.match(page, /Confirm &amp; submit once|Confirm & submit once/);
  assert.match(page, /\/polytrack 0xYourWallet/);
  assert.match(page, /\/polyshare on/);
  assert.match(page, /\/polyorders/);
  assert.match(page, /class="back-terminal" href="\/"[^>]*>← Back to Terminal<\/a>/);
  assert.match(page, /\.nav \.telegram-link\{display:none\}/);
  assert.doesNotMatch(page, /\.nav a:first-child\{display:none\}/);
  for (const tab of ["markets", "portfolio", "orders", "account", "telegram"]) assert.match(page, new RegExp(`data-hub-tab="${tab}"`));
  for (const view of ["trending", "new", "ending", "liquid", "crypto", "politics", "sports"]) assert.match(page, new RegExp(`data-market-view="${view}"`));
  assert.doesNotMatch(page, /href="https:\/\/polymarket\.com/);
  assert.doesNotMatch(page, /seed phrase[^<]{0,80}(enter|paste|send)/i);
  assert.match(terminal, /href="\/polymarket">Poly<\/a>/);
  assert.match(terminal, /class="botnav"[\s\S]{0,700}href="\/polymarket"[\s\S]{0,100}Poly/);
  assert.match(server, /pathname === "\/api\/web\/poly\/markets"/);
  assert.match(server, /pathname === "\/api\/web\/poly\/portfolio"/);
  assert.match(server, /pathname === "\/api\/web\/poly\/trading\/ticket"/);
  assert.match(server, /pathname === "\/api\/web\/poly\/trading\/execute"/);
  assert.match(server, /ticket\.status = "submitting"/);
  assert.match(server, /ticket\.status !== "pending"/);
  assert.match(server, /assertPolymarketOrderRegion/);
  assert.match(server, /handlePolyTradeCallback/);
  assert.match(server, /poly:view:\(hot\|new\|ending\|liquid\|crypto\|politics\|sports\)/);
  assert.match(server, /POLY_MARKET_VIEW_LABELS/);
  assert.match(server, /parseCommandWithArgument\(text, \["polytrack"\]\)/);
  assert.match(server, /parseCommandWithArgument\(text, \["polyshare"\]\)/);
  assert.match(server, /accountStatus\.depositAddress\.toLowerCase\(\)/);
  assert.match(server, /managed: true/);
  assert.match(server, /startPolyCloseMonitor\(\)/);
  assert.match(server, /updatePolyTracker/);
});

test("/meme is a Solana-only daily top ten ranked by 24h volume then market cap", () => {
  const server = read("../src/index.js");
  assert.match(server, /parseCommandWithArgument\(text, \["meme", "memes"\]\)/);
  assert.match(server, /webLivePairs\(`tg:\$\{chatId\}:daily-meme`, "dexTrending"/);
  assert.match(server, /solanaPublicKeyLike\(mint\)/);
  assert.match(server, /firstMeaningfulNumber\(b\.volumeH24, b\.volume24h\)/);
  assert.match(server, /firstMeaningfulNumber\(b\.marketCap, b\.marketCapUsd, b\.fdv\)/);
  assert.match(server, /\.slice\(0, 10\)/);
  assert.match(server, /Solana Meme Coins/);
  assert.match(server, /Vol <b>/);
  assert.match(server, /MC <b>/);
  assert.match(server, /callback_data: "meme:refresh"/);
});
