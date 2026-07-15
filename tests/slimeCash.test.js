import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const cash = fs.readFileSync(new URL("../web/public/cash/cash.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/cash/index.html", import.meta.url), "utf8");
const manifest = JSON.parse(fs.readFileSync(new URL("../web/public/cash/manifest.webmanifest", import.meta.url), "utf8"));
const sw = fs.readFileSync(new URL("../web/public/cash/sw.js", import.meta.url), "utf8");
const buildWeb = fs.readFileSync(new URL("../scripts/build-web.js", import.meta.url), "utf8");
const funding = fs.readFileSync(new URL("../web/public/slimewire-funding.js", import.meta.url), "utf8");

test("SlimeCash calls the branded API origin instead of exposing the hosting provider", () => {
  assert.match(cash, /const API_BASE/);
  assert.match(cash, /https:\/\/app\.slimewire\.org/);
  assert.doesNotMatch(cash, /onrender\.com/i);
  assert.match(cash, /fetch\(`\$\{API_BASE\}\$\{path\}`/);
  assert.match(cash, /application\\\/json/);
});

test("the generated portal config rewrites a Render environment URL to the branded API", () => {
  assert.match(buildWeb, /const brandedApiBase = "https:\/\/app\.slimewire\.org"/);
  assert.match(buildWeb, /\.onrender\\\.com/);
  assert.doesNotMatch(buildWeb, /RENDER_EXTERNAL_URL/);
});

test("standalone app manifests are served with the PWA manifest content type", () => {
  assert.match(server, /"\.webmanifest": "application\/manifest\+json; charset=utf-8"/);
  assert.match(server, /STATIC_COMPRESSIBLE_RE = \/\\\.\(\?:js\|css\|html\|svg\|json\|webmanifest\|map\)\$\/i/);
});

test("SlimeCash recovery is durable and remains compatible with first-release account keys", () => {
  assert.match(server, /function cashRecoveryKeyFromText/);
  assert.match(server, /sc_\$\{crypto\.randomBytes\(32\)/);
  assert.match(server, /cashRecoveryKeys/);
  assert.match(server, /async function recoverCashAccount/);
  assert.match(server, /legacySession/);
  assert.ok(server.indexOf('pathname === "/api/web/cash/recover"') < server.indexOf("const auth = await authenticateWebRequest(request)"));
  assert.match(html, /Restore account backup/);
  assert.match(html, /Choose account backup/);
});

test("SlimeCash automatically downloads account and wallet recovery material", () => {
  assert.match(cash, /downloadWalletFiles\(created\.data\.downloads\)/);
  assert.match(cash, /post\("\/api\/web\/cash\/account-backup"/);
  assert.match(cash, /recovery backup downloaded/);
  assert.match(cash, /post\("\/api\/web\/wallets\/export"/);
  assert.match(html, /Back up account \+ wallets/);
  assert.doesNotMatch(cash, /copyText\(state\.token\)/);
});

test("SlimeCash service worker prefers the current deploy and retains offline fallback", () => {
  const build = html.match(/slimecash-build" content="(\d+)"/)?.[1];
  assert.ok(build, "SlimeCash should publish a numeric build marker");
  assert.match(sw, /slimecash-v\d+/);
  assert.match(html, new RegExp(`cash\\.js\\?v=${build}`));
  assert.match(html, new RegExp(`cash\\.css\\?v=${build}`));
  assert.match(sw, /const fetched = fetch/);
  assert.match(sw, /return fetched/);
  assert.match(sw, /catch\(\(\) => cached\)/);
});

test("SlimeCash exposes its own install flow even when the native prompt is unavailable", () => {
  assert.match(html, /Install SlimeCash app/);
  assert.match(html, /SlimeCash installs as its own app/);
  assert.match(cash, /async function installCashApp/);
  assert.match(cash, /beforeinstallprompt/);
  assert.match(cash, /Add to Home Screen/);
  assert.match(cash, /Install app or Add to Home screen/);
});

test("SlimeCash exposes explicit cash assets and routes sends through the idempotent asset dispatcher", () => {
  assert.match(server, /pathname === "\/api\/web\/cash\/assets"/);
  assert.match(server, /const result = await webCashSend\(auth\.userId, body\)/);
  assert.match(server, /runIdempotentMoneyOp\("cash-send"/);
  assert.match(server, /async function webCashSendCore/);
  assert.match(server, /async function webCashSendStableCore/);
  assert.match(server, /createTransferCheckedInstruction/);
});

test("USDC funding and sending stay explicit in the SlimeCash client", () => {
  assert.match(cash, /get\(`\/api\/web\/cash\/assets\$\{walletIndex\}`\)/);
  assert.match(cash, /asset: state\.sendAsset/);
  assert.match(html, /data-send-asset="USDC"/);
  assert.match(html, />USD</);
});

test("SlimeCash presents one clean USD and SOL wallet with Coinbase as its only fiat vendor", () => {
  assert.match(html, /data-deposit-asset="USDC"/);
  assert.match(html, /data-deposit-asset="SOL"/);
  assert.match(html, /data-fund-wallet="phantom"/);
  assert.match(html, /data-fund-wallet="solflare"/);
  assert.match(html, /data-fund-wallet="other"/);
  assert.match(html, /id="copyDepositBtn"/);
  assert.match(html, /Coinbase/);
  assert.match(cash, /Continue with Coinbase/);
  assert.doesNotMatch(cash, /Pay with card or Apple Pay/);
  assert.match(cash, /post\("\/api\/web\/cash\/onramp-session"/);
  assert.doesNotMatch(html, /PYUSD|PayPal|Venmo|Robinhood/i);
  assert.doesNotMatch(cash, /PYUSD_MINT|HANDOFF_PROVIDERS/);
});

test("Cash and Fun share one account login, recovery, wallet import, and navigation", () => {
  assert.match(html, /Create account/);
  assert.match(html, /Log in/);
  assert.match(html, /Restore account backup/);
  assert.match(html, /Import wallet backup/);
  assert.match(html, /href="\/fun\?from=cash"/);
  assert.match(cash, /post\("\/api\/web\/password-login"/);
  assert.match(cash, /post\("\/api\/web\/profile\/credentials"/);
  assert.match(cash, /post\("\/api\/web\/wallets\/restore"/);
  assert.match(cash, /post\("\/api\/web\/wallet-funding\/create"/);
  assert.match(cash, /post\("\/api\/web\/wallet-funding\/execute"/);
});

test("wallet approval helpers are shared by Cash and Fun", () => {
  assert.match(html, /\/slimewire-funding\.js\?v=/);
  assert.match(funding, /window\.SlimeWireFunding/);
  assert.match(funding, /backpack|okxwallet|braveSolana/);
  assert.match(funding, /solana-web3\.iife\.min\.js/);
});

test("SlimeCash uses a separate PWA identity and a synchronized shell", () => {
  assert.equal(manifest.id, "/slimecash-app");
  assert.equal(manifest.start_url, "/cash/?src=slimecash-pwa");
  assert.equal(manifest.scope, "/cash/");
  assert.match(html, /slimecash-build" content="\d+"/);
  assert.match(sw, /slimecash-v\d+/);
  assert.match(cash, /dedicatedHost = "app\.slimewire\.org"/);
  assert.match(cash, /intent:\/\/\$\{dedicatedHost\}\/cash/);
});

test("SlimeCash receipts, requests, contacts, and security controls are server-backed", () => {
  assert.match(server, /function defaultSlimeCashStore/);
  assert.match(server, /slimecash\.json/);
  assert.match(server, /async function mutateSlimeCashStore/);
  assert.match(server, /pathname === "\/api\/web\/cash\/history"/);
  assert.match(server, /pathname === "\/api\/web\/cash\/contacts"/);
  assert.match(server, /pathname === "\/api\/web\/cash\/requests"/);
  assert.match(server, /pathname === "\/api\/web\/cash\/notifications"/);
  assert.match(server, /pathname === "\/api\/web\/cash\/security"/);
  assert.match(server, /async function verifyCashRequestPayment/);
  assert.match(server, /cashRequestPaidByTransaction/);
  assert.match(server, /crypto\.timingSafeEqual/);
  assert.match(server, /15 \* 60_000/);
  assert.match(cash, /pendingSendAttemptId/);
  assert.match(cash, /confirmSpendPin/);
  assert.match(cash, /pendingRequestId/);
  assert.match(html, /Trust, fees &amp; provider status/);
});
