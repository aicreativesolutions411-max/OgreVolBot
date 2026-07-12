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
  assert.match(html, /<script defer src="\/fun\.js\?v=4"><\/script>/);
});

test("/fun keeps the reference layout clean while carrying SlimeWire features", () => {
  for (const marker of ["data-view=\"home\"", "data-view=\"leaders\"", "data-view=\"wallet\"", "data-view=\"coin\"", "bottom-nav", "trade-dock", "data-open-tools", "data-open-trade=\"buy\"", "data-open-trade=\"sell\""]) assert.match(html, new RegExp(marker));
  assert.match(css, /env\(safe-area-inset-bottom\)/);
  assert.match(css, /@media\(min-width:760px\)/);
  assert.match(js, /TP \/ SL/);
  assert.match(js, /trailingStopPct/);
  assert.match(js, /breakEvenAfterTp1/);
  assert.match(js, /takeProfitLadder/);
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
  assert.match(js, /\/api\/web\/rh\/bridge-to-sol/);
  assert.match(js, /if \(state\.token\) Promise\.all\(\[loadWallets\(\), loadPositions\(\), loadPresets\(\), loadCreatedCoinsSilently\(\)\]\)/);
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
  assert.match(server, /rhListTokens\(1\)[\s\S]{0,120}rhRecentActiveTokens\(1\)/);
});

test("coin art stays metadata-first while wallet identities use slime PFPs", () => {
  assert.match(js, /\/pfp\/mapfaces\//);
  assert.match(js, /coin\?\.metadata\?\.image/);
  assert.match(js, /row\.imageUri \|\| row\.logoUrl \|\| row\.meta\?\.imageUrl \|\| row\.metadata\?\.image/);
  assert.match(js, /token-mascots\/token-mascot-/);
  assert.match(html, /assets\/slimewire\/png\/slimewire-mark\.png/);
  assert.doesNotMatch(js, /pfp\/characters/);
  assert.match(js, /hydrateSelectedFromFeed\(\)/);
  assert.match(js, /request\(`\/api\/web\/token-search\?q=\$\{encodeURIComponent\(key\)\}`\)/);
  assert.match(server, /token-pairs\/v1\/robinhood/);
  assert.match(server, /const meta = await getDexTokenMetadata\(mint/);
  assert.match(server, /enrichRhFeedArtwork/);
  assert.match(server, /void enrichRhFeedArtwork\(rows\)\.catch/);
  assert.match(server, /token-pairs\/v1\/robinhood/);
  assert.match(js, /\/api\/web\/token-image\?mint=/);
  assert.match(js, /data-image-retries/);
  assert.match(js, /retries < 3/);
  assert.match(js, /const detailPromise = request\(path\)/);
  assert.ok(js.indexOf("const searchResult = await request") < js.indexOf("const detailResult = await detailPromise"));
});

test("coin setup exposes fast buys, ladder exits, one-wallet RH trades, and the full volume engine", () => {
  assert.match(html, /data-quick-trade/);
  assert.match(html, /data-detail="setup">Trade setup/);
  assert.match(js, /data-trade-strategy="ladder"/);
  assert.match(js, /data-ladder-preset="smart"/);
  assert.match(js, /payCurrency = "SOL"/);
  assert.match(js, /Convert received ETH back to SOL automatically/);
  assert.match(js, /amounts = \["0\.1", "0\.5", "1"\]/);
  assert.match(js, /data-manage-presets/);
  assert.match(js, /\/api\/web\/presets/);
  assert.match(js, /action === "volume"[\s\S]{0,80}openVolumeSheet/);
  assert.match(js, /\/api\/web\/volume-bot\/start/);
  assert.match(js, /\/api\/web\/volume-bot\/stop/);
  assert.match(js, /\/api\/web\/wallets\/sweep-background/);
  assert.match(js, /\/api\/web\/rh\/volume\/start/);
  assert.match(js, /\/api\/web\/rh\/fund-with-sol/);
});

test("wallet manager can create, restore, export, select, and safely remove wallets", () => {
  for (const path of ["/api/web/wallets/create", "/api/web/wallets/restore", "/api/web/wallets/import", "/api/web/wallets/export", "/api/web/wallets/remove", "/api/web/wallets/rename"]) assert.match(js, new RegExp(path.replaceAll("/", "\\/")));
  for (const marker of ["data-manage-wallets", "data-wallet-backup-file", "data-select-wallet", "data-remove-wallet", "data-rename-wallet"]) assert.match(html + js, new RegExp(marker));
});

test("generated hero art is optimized and referenced from the v2 banner", () => {
  assert.match(css, /fun-hero-v2\.webp/);
  assert.ok(fs.statSync(new URL("../web/public/assets/slimewire/fun-hero-v2.webp", import.meta.url)).size < 100_000);
});
