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
  assert.match(look, /const firstResponseBudgetMs = Math\.min\(750, Math\.max\(250,/);
  assert.match(look, /Loading live market data now; safety follows on this same card/);
  const preview = functionBody(serverSource, "buildSlimeScanMarketPreview");
  assert.match(preview, /cachedScan \? \{ \.\.\.cachedScan, rug: null, shield: null, dexPaid: null \}/);
  assert.match(preview, /rug: null/);
  assert.match(preview, /shield: null/);

  const publishAt = gather.indexOf("publishSlimeScanPreview(mint,");
  const finalSecurityAt = gather.indexOf("const [rugFilled, onchain]");
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

test("plain group CA classification has a strict latency ceiling", () => {
  const router = functionBody(serverSource, "handleMessage");
  assert.match(router, /scanFastTimeout\(isSolMintAddress\(bareCa\[1\]\),\s*1_000,\s*true\)/);
  assert.match(router, /handleTelegramLookCommand\(chatId, message, bareCa\[1\]\)/);
});
