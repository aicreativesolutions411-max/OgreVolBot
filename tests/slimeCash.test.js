import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const cash = fs.readFileSync(new URL("../web/public/cash/cash.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/cash/index.html", import.meta.url), "utf8");
const worker = fs.readFileSync(new URL("../web/public/cash/sw.js", import.meta.url), "utf8");

test("SlimeCash calls the Render API instead of the static-site HTML fallback", () => {
  assert.match(cash, /const API_BASE/);
  assert.match(cash, /https:\/\/ogrevolbot\.onrender\.com/);
  assert.match(cash, /fetch\(`\$\{API_BASE\}\$\{path\}`/);
  assert.match(cash, /application\\\/json/);
});

test("SlimeCash recovery is durable and remains compatible with first-release account keys", () => {
  assert.match(server, /function cashRecoveryKeyFromText/);
  assert.match(server, /sc_\$\{crypto\.randomBytes\(32\)/);
  assert.match(server, /cashRecoveryKeys/);
  assert.match(server, /async function recoverCashAccount/);
  assert.match(server, /legacySession/);
  assert.ok(server.indexOf('pathname === "/api/web/cash/recover"') < server.indexOf("const auth = await authenticateWebRequest(request)"));
  assert.match(html, /I have a recovery key/);
  assert.match(html, /Choose account backup/);
});

test("SlimeCash automatically downloads account and wallet recovery material", () => {
  assert.match(cash, /downloadWalletFiles\(created\.data\.downloads\)/);
  assert.match(cash, /post\("\/api\/web\/cash\/account-backup"/);
  assert.match(cash, /post\("\/api\/web\/wallets\/export"/);
  assert.match(html, /Back up account \+ wallets/);
  assert.doesNotMatch(cash, /copyText\(state\.token\)/);
});

test("SlimeCash service worker prefers the current deploy and retains offline fallback", () => {
  assert.match(worker, /slimecash-v3/);
  assert.match(html, /cash\.js\?v=3/);
  assert.match(html, /cash\.css\?v=3/);
  assert.match(worker, /const fetched = fetch/);
  assert.match(worker, /return fetched/);
  assert.match(worker, /catch\(\(\) => cached\)/);
});
