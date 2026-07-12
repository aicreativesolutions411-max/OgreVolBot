import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../web/public/fun.css", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../web/public/fun-manifest.webmanifest", import.meta.url), "utf8"));
const funWorker = fs.readFileSync(new URL("../web/public/fun-sw.js", import.meta.url), "utf8");

test("/fun is a standalone no-store mobile surface with Cloudflare pretty-URL support", () => {
  assert.match(server, /requestUrl\.pathname === "\/fun"[\s\S]{0,300}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  assert.doesNotMatch(redirects, /^\/fun(?:\/\*)?\s+\/fun\.html/m);
  assert.match(html, /<script src="\/config\.js"><\/script>/);
  assert.match(html, /<script defer src="\/fun\.js\?v=14"><\/script>/);
});

test("/fun is installable as a separate PWA with a dedicated-origin escape", () => {
  assert.equal(manifest.id, "/slimewire-fun-app");
  assert.equal(manifest.start_url, "/fun/?src=slimewire-fun-pwa");
  assert.equal(manifest.scope, "/fun/");
  assert.match(html, /fun-manifest\.webmanifest\?v=1/);
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /ogrevolbot\.onrender\.com\/fun\/\?install=1/);
  assert.match(js, /Install Fun/);
  assert.match(js, /register\("\/fun-sw\.js", \{ scope: "\/fun\/" \}\)/);
  assert.match(funWorker, /slimewire-fun-v1/);
  assert.doesNotMatch(funWorker, /pathname\.startsWith\("\/api\/"\)[\s\S]{0,80}cache\.put/);
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
  assert.match(js, /if \(state\.token\) Promise\.all\(\[loadMe\(\), loadWallets\(\), loadPositions\(\), loadPresets\(\), loadCreatedCoinsSilently\(\)\]\)/);
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
  assert.match(js, /function coinBadge/);
  assert.match(js, /data-coin-symbol/);
  assert.match(html, /assets\/slimewire\/png\/slimewire-mark\.png/);
  assert.doesNotMatch(js, /pfp\/characters/);
  assert.match(js, /hydrateSelectedFromFeed\(\)/);
  assert.match(js, /request\(`\/api\/web\/token-search\?q=\$\{encodeURIComponent\(key\)\}`\)/);
  assert.match(server, /token-pairs\/v1\/robinhood/);
  assert.match(server, /const meta = await getDexTokenMetadata\(mint/);
  assert.match(server, /enrichRhFeedArtwork/);
  assert.match(server, /RH_NOXA_PUBLIC_API/);
  assert.match(server, /rhNoxaArtworkMap/);
  assert.match(server, /const artworkPromise = enrichRhFeedArtwork\(rows\)/);
  assert.match(server, /await artworkPromise/);
  assert.match(server, /token-pairs\/v1\/robinhood/);
  assert.match(js, /\/api\/web\/token-image\?mint=/);
  assert.match(js, /resolvedCoinImages: new Map/);
  assert.match(js, /state\.resolvedCoinImages\.set/);
  assert.match(js, /background-image:url\('\$\{coinBadge\(coin\)\}'\)/);
  assert.match(css, /\.coin-avatar,\.coin-identity img\{background-position:center/);
  assert.match(js, /gateway\\\.pinata/);
  assert.doesNotMatch(js, /retries < 3/);
  assert.match(server, /fetchLogoBuffer\(avatar\.avatarUrl, 96, 2_600\)/);
  assert.match(server, /tokenImageFetchInFlight\.size < 12/);
  assert.match(server, /TOKEN_IMAGE_RESPONSE_CACHE_MAX = 160/);
  assert.match(server, /TOKEN_AVATAR_FAIL_TTL_MS = 60 \* 1000/);
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
  assert.match(js, /async function executeFunQuickBuy/);
  assert.match(js, /data-custom-quick-amount/);
  assert.match(js, /slippageBps: preset\?\.slippageBps \|\| "400"/);
  assert.match(js, /data-manage-presets/);
  assert.match(js, /\/api\/web\/presets/);
  assert.match(js, /action === "volume"[\s\S]{0,80}openVolumeSheet/);
  assert.match(js, /\/api\/web\/volume-bot\/start/);
  assert.match(js, /\/api\/web\/volume-bot\/stop/);
  assert.match(js, /\/api\/web\/wallets\/sweep-background/);
  assert.match(js, /\/api\/web\/rh\/volume\/start/);
  assert.match(js, /\/api\/web\/rh\/fund-with-sol/);
});

test("balanced pro chart keeps core stats visible and adds working chart/transaction controls", () => {
  for (const marker of ['data-chart-interval="1"', 'data-chart-interval="5"', 'data-chart-interval="15"', 'data-chart-interval="60"', 'data-chart-mode="chart"', 'data-chart-mode="transactions"']) assert.match(html, new RegExp(marker));
  assert.match(css, /\.chart-card\{height:418px/);
  assert.match(css, /grid-template-columns:repeat\(4,1fr\)/);
  for (const label of ["Market cap", "Liquidity", "Holders", "Volume"]) assert.match(js, new RegExp(`>${label}<`));
  assert.match(js, /trades=\$\{trades\}/);
  assert.match(js, /interval=\$\{state\.chartInterval\}/);
  assert.match(js, /frame\.dataset\.src === src/);
});

test("/fun live feeds reject stale responses and refresh only the visible view", () => {
  assert.match(js, /feedRequestVersion/);
  assert.match(js, /version !== state\.feedRequestVersion/);
  assert.match(js, /document\.hidden \|\| state\.view !== "home"/);
  assert.match(js, /document\.addEventListener\("visibilitychange"/);
  assert.match(js, /sortAndDedupeFeed/);
  assert.match(js, /hydrateMissingCoinArt/);
  assert.match(js, /const sol = await solPromise;[\s\S]{0,220}renderCoinList\(\);[\s\S]{0,120}const rh = await rhPromise/);
  assert.match(server, /chunks\.map\(\(chunk\) => fetchJson/);
  assert.match(server, /\.slice\(0, 50\)/);
  assert.match(server, /Never block the feed on dozens of explorer creation-time reads/);
  assert.match(js, /Number\(row\.marketCap\) >= 17_000 && Number\(row\.marketCap\) <= 40_000/);
  assert.match(js, /rh: "soon"/);
  assert.match(server, /cat === "soon"/);
  assert.doesNotMatch(server, /await Promise\.all\(slice\.map\(async \(r\) => \{ r\.createdAt = await rhTokenCreationTime/);
});

test("/fun has editable presets, tracked calls, and informational profile follows", () => {
  assert.match(server, /savedPresetId/);
  assert.match(server, /defaultIds\.has\(rawId\)[\s\S]{0,100}hiddenWebPresetIds/);
  assert.match(html, /data-detail="calls"/);
  assert.match(js, /\/api\/web\/calls/);
  assert.match(js, /\/api\/web\/profile\/public/);
  assert.match(js, /\/api\/web\/profile\/follow/);
  assert.match(server, /notifyProfileTradeFollowers\(insertedEvents\)/);
  assert.match(server, /Trade alert only — nothing was copied/);
});

test("/quick preloads social coins and keeps wallet setup inside the fast trade flow", () => {
  assert.match(server, /requestUrl\.pathname === "\/quick"[\s\S]{0,240}serveStaticHtmlPage\(response, "fun\.html", "no-store, max-age=0"\)/);
  assert.match(redirects, /^\/quick\s+\/fun\.html\s+200$/m);
  assert.match(redirects, /^\/quick\/\*\s+\/fun\.html\s+200$/m);
  for (const marker of ["data-view=\"quick\"", "data-quick-paste-form", "data-quick-route-content", "data-quick-clipboard"]) assert.match(html, new RegExp(marker));
  assert.match(js, /IS_QUICK_ROUTE/);
  assert.match(js, /new URLSearchParams\(location\.search\)/);
  assert.match(js, /\/quick\?ca=\$\{encodeURIComponent\(key\)\}/);
  assert.match(js, /data-quick-select-amount/);
  assert.match(js, /data-quick-review/);
  assert.match(js, /data-quick-bundle/);
  assert.match(js, /data-quick-wallet-select/);
  assert.match(js, /data-quick-panel/);
  assert.match(js, /quick-inline-chart/);
  assert.match(js, /quick-bottom-dock/);
  assert.match(js, /Bundle Buy/);
  assert.match(css, /High-fidelity quick-buy states/);
  assert.doesNotMatch(js, /class="quick-secondary"><a href="\/fun#coin/);
  assert.match(js, /Connect \/ restore/);
  assert.match(js, /Your coin stays selected/);
});

test("wallet manager can create, restore, export, select, and safely remove wallets", () => {
  for (const path of ["/api/web/wallets/create", "/api/web/wallets/restore", "/api/web/wallets/import", "/api/web/wallets/export", "/api/web/wallets/remove", "/api/web/wallets/rename"]) assert.match(js, new RegExp(path.replaceAll("/", "\\/")));
  for (const marker of ["data-manage-wallets", "data-wallet-backup-file", "data-select-wallet", "data-remove-wallet", "data-rename-wallet"]) assert.match(html + js, new RegExp(marker));
});

test("selected degen hero art is optimized and referenced from the v3 banner", () => {
  assert.match(css, /fun-hero-v3\.webp/);
  assert.ok(fs.statSync(new URL("../web/public/assets/slimewire/fun-hero-v3.webp", import.meta.url)).size < 100_000);
});
