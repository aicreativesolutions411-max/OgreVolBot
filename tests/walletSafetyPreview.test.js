import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const wallet = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../web/public/fun.css", import.meta.url), "utf8");

test("wallet previews simulate the exact intent before any broadcast", () => {
  assert.match(server, /pathname === "\/api\/web\/transaction\/preview"/);
  assert.match(server, /webTransactionPreview\(auth\.userId, body\)/);
  assert.match(server, /async function simulateManagedSolanaPreview/);
  assert.match(server, /simulateTransaction\(tx, \{ commitment: "processed", sigVerify: true \}\)/);
  assert.match(server, /async function pumpPortalPreviewTransaction/);
  assert.match(server, /requestPumpPortalLocalTransaction/);
  assert.match(server, /provider\.estimateGas/);
  assert.match(server, /Nothing was broadcast/);
  assert.match(wallet, /post\("\/api\/web\/transaction\/preview"/);
  assert.match(wallet, /data-preview-confirmed="true"/);
  assert.match(wallet, /SIMULATION PASSED/);
  assert.match(wallet, /Estimated receive/);
  assert.match(wallet, /Minimum received/);
  assert.match(wallet, /Balance after/);
});

test("wallet safety rejects a failed Jupiter simulation instead of bypassing it", () => {
  assert.match(server, /blocked to protect you\|simulation failed\|price impact/i);
  assert.match(server, /throw jupiterError/);
  assert.match(server, /Simulation failed before any funds moved/);
});

test("wallet app lock is local, supports device unlock, and keeps recovery separate", () => {
  assert.match(wallet, /slimewalletAppLockV1/);
  assert.match(wallet, /PBKDF2/);
  assert.match(wallet, /iterations: 180_000/);
  assert.match(wallet, /window\.PublicKeyCredential/);
  assert.match(wallet, /navigator\.credentials\.create/);
  assert.match(wallet, /navigator\.credentials\.get/);
  assert.match(wallet, /does not replace your account password or wallet backup/);
  assert.match(wallet, /function walletSessionStartedAt/);
  assert.match(html, /data-wallet-lock-overlay/);
  assert.match(css, /\.wallet-lock-overlay/);
});

test("wallet token controls hide locally and report without moving funds", () => {
  assert.match(server, /pathname === "\/api\/web\/token\/report"/);
  assert.match(server, /web_token_reported/);
  assert.match(wallet, /slimewalletHiddenTokensV1/);
  assert.match(wallet, /Hide or report/);
  assert.match(wallet, /Hiding removes this token from wallet totals and asset lists on this device/);
  assert.match(wallet, /A report never moves funds/);
  assert.match(wallet, /hiddenTokenSet\(\)/);
});

test("every wallet sheet has an obvious close control", () => {
  assert.match(wallet, /class="sheet-close-button"/);
  assert.match(wallet, /data-close-sheet/);
  assert.match(css, /\.sheet-close-button/);
});
