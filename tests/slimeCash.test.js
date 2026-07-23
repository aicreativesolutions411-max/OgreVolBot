import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

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
  assert.match(cash, /downloads\?\.evmRecoveryKeys\?\.text/);
  assert.match(server, /function buildEvmPrivateKeyDocument/);
  assert.match(server, /EVM private key:/);
  assert.match(server, /evmRecoveryKeys/);
  assert.doesNotMatch(cash, /copyText\(state\.token\)/);
});

test("SlimeCash lets unnamed accounts export either all wallets or one exact wallet", () => {
  assert.match(html, /No username is required for backup/);
  assert.match(html, /id="backupCashWalletsBtn"[^>]*>Back up all wallets</);
  assert.match(cash, /data-cash-wallet-backup="\$\{wallet\.index\}"/);
  assert.match(cash, /async function backupCashWallet\(index, publicKey, button\)/);
  assert.match(cash, /post\("\/api\/web\/wallets\/export", \{ walletIndex: Number\(index\), publicKey: String\(publicKey \|\| ""\) \}\)/);
  assert.match(cash, /button\.dataset\.cashWalletBackup[\s\S]{0,180}button\.dataset\.walletKey/);
  assert.match(cash, /SlimeWire and Solflare\/Phantom backups downloaded for this wallet/);
  assert.match(cash, /data-cash-wallet-evm-backup="\$\{wallet\.index\}"/);
  assert.match(cash, /async function backupCashEvmWallet\(index, publicKey, button\)/);
  assert.match(cash, /Robinhood\/EVM recovery key downloaded for this wallet/);
});

test("SlimeCash includes live Robinhood ETH in wallet rows and its USD total", () => {
  assert.match(server, /pathname === "\/api\/web\/rh\/balances"/);
  assert.match(server, /async function webRhBalanceRows/);
  assert.match(server, /return \{ ok: true, wallets: rows, ethUsd \}/);
  assert.match(cash, /async function refreshCashRhBalances/);
  assert.match(cash, /rhEthValue[\s\S]{0,180}return state\.usdc \+ sol \* state\.solUsd \+ rhEthValue/);
  assert.match(cash, /ETH \(Robinhood\)/);
  assert.match(cash, /data-copy-wallet-address="\$\{escapeHtml\(wallet\.rhAddress\)\}"/);
});

test("SlimeCash service worker prefers the current deploy and retains offline fallback", () => {
  const build = html.match(/slimecash-build" content="(\d+)"/)?.[1];
  assert.equal(build, "27", "SlimeCash should publish the current app build");
  assert.match(sw, /const CACHE = "slimecash-v29"/);
  assert.match(html, new RegExp(`cash\\.js\\?v=${build}`));
  assert.match(html, new RegExp(`cash\\.css\\?v=${build}`));
  assert.match(sw, /const fetched = fetch/);
  assert.match(sw, /return fetched/);
  assert.match(sw, /catch\(\(\) => cached\)/);
});

test("SlimeCash Send has an obvious close control that returns to Cash", () => {
  assert.match(html, /id="sendCloseBtn"[^>]+aria-label="Close Send and return to Cash"/);
  assert.match(cash, /function closeSendView\(\)[\s\S]{0,350}searchParams\.delete\("tab"\)[\s\S]{0,250}switchTab\("home"\)/);
  assert.match(cash, /\$\("sendCloseBtn"\)\.addEventListener\("click", closeSendView\)/);
});

test("SlimeCash deploys its runtime as an integrity-checked content-addressed asset", () => {
  assert.match(buildWeb, /createHash/);
  assert.match(buildWeb, /cash\.\$\{cashScriptHash\}\.js/);
  assert.match(buildWeb, /cashScriptIntegrity/);
  assert.match(buildWeb, /attempts<15/);
  assert.match(server, /fingerprintedBundle/);
});

test("SlimeCash event wiring only targets elements present in its HTML shell", () => {
  const ids = new Set([...html.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]));
  const referencedIds = [...new Set([...cash.matchAll(/\$\(["']([A-Za-z][A-Za-z0-9_-]*)["']\)/g)].map((match) => match[1]))];
  assert.deepEqual(referencedIds.filter((id) => !ids.has(id)), []);
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

test("SlimeCash can send a fee-aware maximum SOL balance", () => {
  assert.match(html, /id="sendAllBtn"[^>]*>All<\/button>/);
  assert.match(cash, /function selectSendAll/);
  assert.match(cash, /state\.sendAll \? \{ sendAll: true \}/);
  assert.match(server, /async function cashSendAllSolPlan/);
  assert.match(server, /estimateLegacyTransactionFee\(feeProbe\)/);
  assert.match(server, /sendAll \? 0 : CONFIG\.buyReserveLamports/);
  assert.match(server, /prepareCashSendBody\(userId, body\)/);
});

test("SlimeCash can receive, send, convert, value, and recover Robinhood ETH", () => {
  assert.match(html, /data-send-asset="ETH"/);
  assert.match(html, /data-receive-asset="ETH"/);
  assert.match(html, /id="rhwallet"/);
  assert.match(cash, /state\.sendAsset === "ETH"[\s\S]{0,260}amountEth/);
  assert.match(cash, /post\("\/api\/web\/rh\/fund-with-sol"/);
  assert.match(cash, /post\("\/api\/web\/rh\/bridge-to-sol"/);
  assert.match(cash, /data-rh-wallet-tools/);
  assert.match(server, /pathname === "\/api\/web\/rh\/send-eth"/);
  assert.match(server, /runIdempotentMoneyOp\([\s\S]{0,100}"web-rh-send-eth"/);
  assert.match(server, /RH_ETH_SEND_RESERVE_WEI/);
  assert.match(server, /if \(asset === "ETH"\) return webRhSendEthCore/);
  assert.match(server, /amountEth: result\.amountEth/);
  assert.match(server, /explorerUrl: result\.explorerUrl/);
});

test("SlimeCash presents one clean USD, SOL and Robinhood ETH wallet with Coinbase as its only fiat vendor", () => {
  assert.match(html, /data-deposit-asset="USDC"/);
  assert.match(html, /data-deposit-asset="SOL"/);
  assert.match(html, /data-fund-wallet="phantom"/);
  assert.match(html, /data-fund-wallet="solflare"/);
  assert.doesNotMatch(html, /data-fund-wallet="other"/);
  assert.match(html, /id="walletFundingAmount"[\s\S]{0,900}data-fund-wallet="phantom"/);
  assert.doesNotMatch(html, /id="walletfunding"/);
  assert.match(html, /id="copyDepositBtn"/);
  assert.match(html, /Coinbase/);
  assert.match(cash, /Continue with Coinbase/);
  assert.doesNotMatch(cash, /Pay with card or Apple Pay/);
  assert.match(cash, /post\("\/api\/web\/cash\/onramp-session"/);
  assert.doesNotMatch(html, /PYUSD|PayPal|Venmo/i);
  assert.match(cash, /ETH \(Robinhood\)/);
  assert.doesNotMatch(cash, /PYUSD_MINT|HANDOFF_PROVIDERS/);
});

test("Coinbase Onramp sessions are authenticated and CORS-limited to SlimeWire origins", () => {
  assert.match(server, /CASH_ONRAMP_ALLOWED_ORIGINS = "https:\/\/slimewire\.org,https:\/\/www\.slimewire\.org,https:\/\/app\.slimewire\.org"/);
  assert.match(server, /requestUrl\.pathname === "\/api\/web\/cash\/onramp-session"\s*\? CASH_ONRAMP_ALLOWED_ORIGINS/);
  assert.match(server, /sendWebJson\(request, response, 200, \{ ok: true, \.\.\.result, address: wallet\.publicKey \}, CASH_ONRAMP_ALLOWED_ORIGINS\)/);
  assert.match(server, /clientIp: webClientKey\(request\)/);
  assert.match(server, /if \(allowOrigin\) headers\["Access-Control-Allow-Origin"\] = allowOrigin/);
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

test("Cash uses the shared exact Solana Pay helper without the legacy mobile handshake", () => {
  assert.match(html, /\/slimewire-funding\.js\?v=8/);
  assert.match(funding, /window\.SlimeWireFunding/);
  assert.match(funding, /backpack|okxwallet|braveSolana/);
  assert.match(funding, /solana-web3\.iife\.min\.js/);
  assert.match(funding, /function createSolanaPayReference/);
  assert.match(funding, /function solanaPayTransferUrl/);
  assert.match(funding, /createSolanaPayReference/);
  assert.match(funding, /solanaPayTransferUrl/);
  for (const removed of [
    /startMobileConnect/,
    /startMobileSign/,
    /consumeMobileCallback/,
    /mobileSession/,
    /authorizeAndSignMobile/,
    /supportsMwa/,
    /slimewire-mwa/i,
    /slimewireMobileFundingSession/,
    /sw_fund_stage/,
    /\/ul\/v1\/connect/
  ]) assert.doesNotMatch(funding, removed);

  const mobileLaunch = cash.slice(
    cash.indexOf("async function startCashMobileExactFunding"),
    cash.indexOf("async function copyFundingAddress")
  );
  const pendingCheck = cash.slice(
    cash.indexOf("async function checkPendingCashFunding"),
    cash.indexOf("function fundingProvider")
  );
  assert.match(mobileLaunch, /WalletFunding\.createSolanaPayReference\(\)/);
  assert.match(mobileLaunch, /WalletFunding\.solanaPayTransferUrl\(\{/);
  assert.match(mobileLaunch, /location\.assign\(payUri\)/);
  assert.doesNotMatch(mobileLaunch, /setTimeout/);
  assert.match(pendingCheck, /post\("\/api\/web\/wallet-funding\/status"/);
  assert.match(cash, /&& !pendingSol\.reference/);
  assert.match(cash, /if \(!pendingSol\?\.reference\) pendingFundArrived\("SOL"\)/);
  assert.doesNotMatch(cash, /startMobileConnect|startMobileSign|consumeMobileCallback|mobileSession|authorizeAndSignMobile|supportsMwa|resumeCashMobileFunding/);
});

test("SlimeCash uses a separate PWA identity and a synchronized shell", () => {
  assert.equal(manifest.id, "/slimecash-app");
  assert.equal(manifest.start_url, "/cash/?src=slimecash-pwa");
  assert.equal(manifest.scope, "/cash/");
  assert.match(html, /slimecash-build" content="27"/);
  assert.match(sw, /slimecash-v29/);
  assert.match(sw, /\/slimewire-funding\.js\?v=8/);
  assert.match(cash, /serviceWorker\.register\("\/cash\/sw\.js", \{ updateViaCache: "none" \}\)/);
  assert.match(sw, /key\.startsWith\("slimecash-"\) && key !== CACHE/);
  assert.doesNotMatch(sw, /keys\.filter\(\(key\) => key !== CACHE\)/);
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

function fundingHarness() {
  const values = new Map();
  let currentUrl = new URL("https://www.slimewire.org/cash/?sheet=addcash");
  let assignedUrl = "";
  const location = {
    assign(value) { assignedUrl = String(value); currentUrl = new URL(value, currentUrl); }
  };
  for (const field of ["href", "origin", "search", "pathname", "hash"]) {
    Object.defineProperty(location, field, {
      get: () => currentUrl[field],
      set: (value) => {
        if (field === "href") currentUrl = new URL(value, currentUrl);
        else currentUrl[field] = value;
      }
    });
  }
  const localStorage = {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
  };
  const history = {
    replaceState(_state, _title, value) { currentUrl = new URL(value, currentUrl); }
  };
  const document = {
    querySelector: () => null,
    createElement: () => ({ dataset: {}, addEventListener() {} }),
    head: { appendChild() {} }
  };
  const window = { location, localStorage, history };
  const context = vm.createContext({
    window,
    location,
    localStorage,
    history,
    document,
    navigator: { userAgent: "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36", maxTouchPoints: 5 },
    crypto: globalThis.crypto,
    URL,
    URLSearchParams,
    TextEncoder,
    TextDecoder,
    Uint8Array,
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
    btoa: (value) => Buffer.from(value, "binary").toString("base64"),
    console
  });
  vm.runInContext(funding, context, { filename: "slimewire-funding.js" });
  return {
    api: window.SlimeWireFunding,
    values,
    get assignedUrl() { return assignedUrl; },
    navigate(value) { currentUrl = new URL(value, currentUrl); assignedUrl = ""; }
  };
}

test("shared Solana Pay helper creates a unique exact-transfer URI", () => {
  const harness = fundingHarness();
  const firstReference = harness.api.createSolanaPayReference();
  const secondReference = harness.api.createSolanaPayReference();
  assert.match(firstReference, /^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  assert.match(secondReference, /^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
  assert.notEqual(firstReference, secondReference);

  const recipient = "7YttLkYvyNoCQMPdVduDpfpJ3KqVjhQKXvB6fYGhD55A";
  const uri = harness.api.solanaPayTransferUrl({
    recipient,
    amountSol: "0.25",
    reference: firstReference,
    label: "SlimeCash",
    message: "Fund your SlimeCash wallet"
  });
  const parsed = new URL(uri);
  assert.equal(parsed.protocol, "solana:");
  assert.equal(parsed.pathname, recipient);
  assert.equal(parsed.searchParams.get("amount"), "0.25");
  assert.equal(parsed.searchParams.get("reference"), firstReference);
  assert.equal(parsed.searchParams.get("label"), "SlimeCash");
  assert.equal(parsed.searchParams.get("message"), "Fund your SlimeCash wallet");
  assert.throws(
    () => harness.api.solanaPayTransferUrl({ recipient, amountSol: "0.25", reference: "not-a-public-key" }),
    /Reference must be a valid Solana public key/
  );
  assert.throws(
    () => harness.api.solanaPayTransferUrl({ recipient, amountSol: "0.1234567891", reference: firstReference }),
    /no more than 9 decimal places/
  );
});

test("mobile app funding verifies its unique reference instead of trusting a balance bump", () => {
  assert.match(cash, /\/api\/web\/wallet-funding\/status/);
  assert.match(cash, /reference/);
  assert.match(cash, /amountSol/);
  assert.match(cash, /&& !pendingSol\.reference/);
  assert.doesNotMatch(cash, /startMobileConnect|startMobileSign|consumeMobileCallback|resumeCashMobileFunding/);
  assert.match(server, /request\.method === "POST" && pathname === "\/api\/web\/wallet-funding\/status"/);
  assert.match(server, /async function verifySolanaPayWalletFunding/);
  assert.match(server, /walletFundingReferenceSignatures\(new PublicKey\(reference\)\)/);
  assert.match(server, /cashRequestPaidByTransaction\(requestRow, tx\)/);
  assert.match(server, /walletFundingReceipts\[reference\]/);
});
