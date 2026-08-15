import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(match, `${name} is missing`);
  const paramsStart = source.indexOf("(", match.index);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")" && --paramsDepth === 0) { paramsEnd = index; break; }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return source.slice(bodyStart + 1, index);
  }
  return "";
}

test("cold Telegram scans publish market facts before slow safety providers finish", () => {
  const gather = functionBody(serverSource, "gatherSlimeScan");
  const look = functionBody(serverSource, "handleTelegramLookCommand");

  assert.match(serverSource, /const slimeScanPreviewCache = new Map\(\)/);
  assert.match(serverSource, /function publishSlimeScanPreview\(/);
  assert.match(serverSource, /function waitForSlimeScanPreview\(/);
  assert.match(gather, /publishSlimeScanPreview\(mint,/);
  assert.match(look, /waitForSlimeScanPreview\(mint/);
  assert.match(look, /const scanPromise = gatherSlimeScan\(mint\)/);
  assert.match(look, /const previewPromise/);
  assert.match(look, /const firstResponseBudgetMs = Math\.min\(900, Math\.max\(300,/);
  assert.match(gather, /pairsPromise\.then\(\(previewPairs\)/);
  assert.match(look, /Loading live market data now; safety follows on this same card/);
  const preview = functionBody(serverSource, "buildSlimeScanMarketPreview");
  assert.match(preview, /cachedScan \? \{ \.\.\.cachedScan, rug: null, shield: null, dexPaid: null, dexPromotion: null \}/);
  assert.match(preview, /scanJupiterSecurity\(jupiterReport, mint\)/);
  assert.match(preview, /rug: jupiterSecurity\.rug/);
  assert.match(preview, /shield: jupiterSecurity\.shield/);

  const publishAt = gather.indexOf("publishSlimeScanPreview(mint,");
  const finalSecurityAt = gather.indexOf("const [rugRead, onchain]");
  assert.ok(publishAt >= 0 && finalSecurityAt > publishAt, "market preview must publish before final RugCheck/on-chain security completion");
});

test("ordinary cold scan acknowledgement never waits on rendering or a Telegram photo upload", () => {
  const look = functionBody(serverSource, "handleTelegramLookCommand");
  const deliver = functionBody(serverSource, "deliverTelegramSolScan");

  assert.match(look, /telegram\("sendMessage"/);
  assert.match(look, /const quickMediaAllowed = Boolean\(String\(options\.contextHtml/);
  assert.match(look, /if \(quickMediaAllowed\)[\s\S]*renderSolScanCardPng\(quickScan/);
  assert.match(look, /Normal \/look and pasted-CA scans[\s\S]*send text first/);
  assert.match(deliver, /const shouldRenderPng = \(!messageId && !preferText\) \|\| isPhoto/);
  assert.match(deliver, /shouldRenderPng\s*\?\s*await scanFastTimeout\(renderSolScanCardPng/);
  assert.match(functionBody(serverSource, "slimeScanKeyboardForResult"), /slimeScanSafetyProofReady/);
});

test("ordinary scans promote the fast text shell into a branded card", () => {
  const look = functionBody(serverSource, "handleTelegramLookCommand");
  const deliver = functionBody(serverSource, "deliverTelegramSolScan");
  const rh = functionBody(serverSource, "sendRhScanCard");

  assert.match(look, /preferText:\s*true/);
  assert.match(look, /photoOnly:\s*true/);
  assert.match(look, /telegram\("deleteMessage"/);
  assert.match(deliver, /photoOnly \? null : sayHtml/);
  assert.match(rh, /const quickMediaAllowed = options\.brandedMedia === true/);
  assert.match(rh, /quickMediaAllowed\s*\?\s*await scanFastTimeout\(renderRhScanCardPng/);
  assert.match(rh, /const promoteToPhoto = async/);
  assert.match(rh, /telegram\("deleteMessage"/);
  assert.doesNotMatch(rh, /const fullMediaAllowed = options\.brandedMedia === true/);
});

test("progressive scan updates do not stampede the shared RPC queue", () => {
  const supply = functionBody(serverSource, "fetchTokenSupplyUi");
  const settle = functionBody(serverSource, "settleTelegramSolScanCard");
  const classify = functionBody(serverSource, "isSolMintAddress");

  assert.match(serverSource, /const scanTokenSupplyCache = new Map\(\)/);
  assert.match(serverSource, /const scanTokenSupplyInFlight = new Map\(\)/);
  assert.match(supply, /scanTokenSupplyInFlight\.get\(key\)/);
  assert.match(supply, /retries:\s*0,\s*priority:\s*true/);
  assert.match(settle, /slimeScanRetryMissingFields\(accumulated, mint\)/);
  assert.match(serverSource, /const SLIME_SCAN_RETRY_FIELDS = new Set\(\["identity", "price", "market cap", "liquidity", "24h volume", "security", "coin image"\]\)/);
  assert.match(classify, /retries:\s*0,\s*priority:\s*true/);
});

test("fresh exact-mint fallback fills identity, PFP, market facts, and audit before retries", () => {
  const fetchJupiter = functionBody(serverSource, "fetchJupiterScanTokenReport");
  const normalize = functionBody(serverSource, "scanJupiterTokenMetadata");
  const security = functionBody(serverSource, "scanJupiterSecurity");
  const gather = functionBody(serverSource, "gatherSlimeScan");
  const settle = functionBody(serverSource, "settleTelegramSolScanCard");

  assert.match(fetchJupiter, /lite-api\.jup\.ag/);
  assert.match(fetchJupiter, /jupiterScanExactRow/);
  assert.match(normalize, /imageUrl: firstString\(row\.icon/);
  assert.match(normalize, /marketCap: firstMeaningfulNumber\(row\.mcap/);
  assert.match(normalize, /volume: \{ m5: m5\.volume, h1: h1\.volume, h6: h6\.volume, h24: h24\.volume \}/);
  assert.match(security, /mintAuthorityDisabled/);
  assert.match(security, /topHoldersPercentage/);
  assert.match(gather, /jupiterReportPromise/);
  assert.match(gather, /meta = mergeTokenMarketMetadata\(meta, scanJupiterTokenMetadata\(jupiterReport\)\)/);
  assert.match(settle, /scanImageUrlFromScan\(accumulated\)/);
  assert.match(settle, /photoOnly: true/);
  assert.match(settle, /telegram\("deleteMessage"/);
});

test("Jupiter scan normalization preserves real 24h flow and exact artwork", () => {
  const firstString = (...values) => values.find((value) => String(value || "").trim()) || "";
  const firstMeaningfulNumber = (...values) => values.map(Number).find((value) => Number.isFinite(value) && value > 0) || null;
  const firstNumber = (...values) => values.map(Number).find((value) => Number.isFinite(value)) ?? null;
  const normalizeSocialLink = (value) => String(value || "");
  const windowFn = new Function("firstNumber", `return function jupiterScanWindow(row = {}, key = "stats24h") {${functionBody(serverSource, "jupiterScanWindow")}}`)(firstNumber);
  const metaFn = new Function("firstString", "firstMeaningfulNumber", "normalizeSocialLink", "jupiterScanWindow", `return function scanJupiterTokenMetadata(row = null) {${functionBody(serverSource, "scanJupiterTokenMetadata")}}`)(firstString, firstMeaningfulNumber, normalizeSocialLink, windowFn);
  const row = {
    id: "57aJfPxk73pdZP9wcywGengaZKWEWYf76LPYWN3sNueA",
    name: "The Baseball Squirrel",
    symbol: "BNUT",
    icon: "https://cdn.example/bnut.jpg",
    mcap: 1_590,
    usdPrice: 0.00000163,
    liquidity: 1_623,
    holderCount: 112,
    totalSupply: 972_516_685,
    firstPool: { createdAt: "2026-07-28T02:23:29Z" },
    stats1h: { priceChange: -31.4, buyVolume: 66_169, sellVolume: 65_468, numBuys: 1_877, numSells: 2_354 },
    stats24h: { priceChange: -31.4, buyVolume: 66_169, sellVolume: 65_468, numBuys: 1_877, numSells: 2_354 }
  };
  const meta = metaFn(row);
  assert.equal(meta.symbol, "BNUT");
  assert.equal(meta.imageUrl, "https://cdn.example/bnut.jpg");
  assert.equal(meta.marketCap, 1_590);
  assert.equal(meta.volume.h24, 131_637);
  assert.equal(meta.txns.h1.buys, 1_877);
  assert.equal(meta.holderCount, 112);
  assert.ok(meta.pairCreatedAt > 0);
});

test("DexScreener pair resolution is hedged and single-flight", () => {
  const resolver = functionBody(serverSource, "resolveDexPairToMint");
  assert.match(serverSource, /const dexPairMintInFlight = new Map\(\)/);
  assert.match(resolver, /dexPairMintInFlight\.get\(a\)/);
  assert.match(resolver, /setTimeout\(\(\) => \{ void startSearch\(\); \}, 400\)/);
});

test("plain group CA classification has a strict latency ceiling", () => {
  const router = functionBody(serverSource, "handleMessage");
  assert.match(router, /void gatherSlimeScan\(bareCa\[1\]\)/);
  assert.match(router, /scanFastTimeout\(isSolMintAddress\(bareCa\[1\]\),\s*650,\s*true\)/);
  assert.match(router, /sendWalletScanCard\(chatId, bareCa\[1\], userId\)/);
  assert.ok(
    router.indexOf("gatherSlimeScan(bareCa[1])") < router.indexOf("await scanFastTimeout(isSolMintAddress(bareCa[1])"),
    "market lookup must warm before account classification"
  );
});
