import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../web/public/fun.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");

test("/fun is a standalone no-store mobile surface with Cloudflare pretty-URL support", () => {
  assert.match(server, /requestUrl\.pathname === "\/fun"[\s\S]{0,300}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  assert.doesNotMatch(redirects, /^\/fun(?:\/\*)?\s+\/fun\.html/m);
  assert.match(html, /<script src="\/config\.js"><\/script>/);
  assert.match(html, /<script defer src="\/fun\.js\?v=1"><\/script>/);
});

test("/fun keeps the reference layout clean while carrying SlimeWire features", () => {
  for (const marker of ["data-view=\"home\"", "data-view=\"leaders\"", "data-view=\"wallet\"", "data-view=\"coin\"", "bottom-nav", "trade-dock", "data-open-tools", "data-open-trade=\"buy\"", "data-open-trade=\"sell\""]) assert.match(html, new RegExp(marker));
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\(min-width:760px\)/);
  assert.match(js, /TP \/ SL/);
  assert.match(js, /trailingStopPct/);
  assert.match(js, /breakEvenAfterTp1/);
  assert.match(js, /payCurrency/);
  assert.match(js, /Robinhood Chain/);
  assert.match(js, /coin\.volumeLabel \|\| "checking"/);
  assert.doesNotMatch(html, /community chat/i);
});

test("/fun reuses authenticated money APIs with idempotency and lazy user actions", () => {
  assert.match(js, /const TOKEN_KEY = "ogreWebToken"/);
  assert.match(js, /headers\.Authorization = `Bearer \$\{state\.token\}`/);
  assert.match(js, /tradeAttemptId: attemptId\("fun-rh"\)/);
  assert.match(js, /tradeAttemptId: attemptId\("fun-sol"\)/);
  assert.match(js, /data-submit-trade/);
  assert.match(js, /async function submitTrade/);
  assert.match(js, /\/api\/web\/positions\/arm-exits/);
  assert.match(js, /\/api\/web\/rh\/guards/);
  assert.match(js, /if \(state\.token\) Promise\.all\(\[loadWallets\(\), loadPositions\(\), loadCreatedCoinsSilently\(\)\]\)/);
  assert.doesNotMatch(js, /const accountReady = await ensureAccount\(\)/);
});

test("unified search and Robinhood detail support the two-chain mobile experience", () => {
  assert.ok(server.indexOf('pathname === "/api/web/token-search"') < server.indexOf("const auth = await authenticateWebRequest(request)"));
  assert.match(server, /pathname === "\/api\/web\/rh\/token"/);
  assert.match(server, /gatherRhScan\(address\)/);
  assert.match(server, /\["solana", "robinhood"\]\.includes/);
  assert.match(server, /chain: "robinhood"/);
  assert.match(js, /\/api\/web\/token-search\?q=/);
  assert.match(js, /\/api\/web\/rh\/token\?address=/);
  assert.match(js, /\/api\/web\/token-read\?mint=/);
});

test("mobile avatars use lightweight established SlimeWire assets", () => {
  assert.match(js, /\/pfp\/mapfaces\//);
  assert.match(js, /token-mascots\/token-mascot-/);
  assert.match(html, /assets\/slimewire\/png\/slimewire-mark\.png/);
  assert.doesNotMatch(js, /pfp\/characters/);
});
