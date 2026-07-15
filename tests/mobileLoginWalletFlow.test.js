import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/old.html", import.meta.url), "utf8");
const overridesSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");

function functionBody(name) {
  const syncStart = appSource.indexOf(`function ${name}`);
  const asyncStart = appSource.indexOf(`async function ${name}`);
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  if (start < 0) return "";
  const paramsStart = appSource.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "(") paramsDepth += 1;
    if (char === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = appSource.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < appSource.length; index += 1) {
    const char = appSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return appSource.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("mobile Lock In panel exposes existing password and email-code login actions", () => {
  assert.match(htmlSource, /data-open-login/);
  assert.match(htmlSource, /data-login-modal/);
  assert.match(htmlSource, /data-login-tab="login"/);
  assert.match(htmlSource, /data-login-tab="create"/);
  assert.match(htmlSource, /data-login-username/);
  assert.match(htmlSource, /data-login-password/);
  assert.match(htmlSource, /data-web-password-login/);
  assert.match(htmlSource, /data-web-signup/);
  assert.match(htmlSource, /data-login-email/);
  assert.match(htmlSource, /data-login-code/);
  assert.match(htmlSource, /data-send-email-code/);
  assert.match(htmlSource, /data-web-code-login/);
  assert.match(htmlSource, /data-close-login/);
  assert.match(appSource, /target\.matches\("\[data-send-email-code\]"\)[\s\S]*sendEmailLoginCode\(\)/);
  assert.match(appSource, /target\.matches\("\[data-web-code-login\]"\)[\s\S]*emailCodeLogin\(\)/);
  assert.match(functionBody("sendEmailLoginCode"), /\/api\/web\/email-code/);
  assert.match(functionBody("emailCodeLogin"), /\/api\/web\/login/);
  assert.match(appSource, /document\.addEventListener\("pointerup"[\s\S]*data-open-login/);
  assert.match(functionBody("openLoginModal"), /state\.walletConnectMenuOpen = false/);
  assert.match(functionBody("openLoginModal"), /LOCK_IN_CLICKED|recordLockInClicked/);
  assert.match(functionBody("loginFallbackRoute"), /\/login\?returnTo=/);
  assert.match(functionBody("firstFormValue"), /visibleElement\(selector\)/);
});

test("mobile Lock In modal is fixed above the terminal header and remains tappable", () => {
  assert.match(overridesSource, /\.login-modal\s*\{[\s\S]*position: fixed !important/);
  assert.match(overridesSource, /\.login-modal\s*\{[\s\S]*z-index: 7600 !important/);
  assert.match(overridesSource, /\.login-modal-card\s*\{[\s\S]*max-height: calc\(100dvh - 28px\) !important/);
  assert.match(overridesSource, /\.login-modal-card\s*\{[\s\S]*overflow: auto !important/);
  assert.match(overridesSource, /\.login-modal-card::before\s*\{[\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\.login-modal-section input\s*\{[\s\S]*font-size: 16px !important/);
});

test("Lock In modal can open after a wallet-created web profile exists", () => {
  assert.match(appSource, /const loginModalVisible = Boolean\(hasLoginModal && state\.loginModalOpen\)/);
  assert.doesNotMatch(appSource, /const loginModalVisible = Boolean\(hasLoginModal && !state\.user && state\.loginModalOpen\)/);
});

test("Lock In click instrumentation and debug command are present without sensitive fields", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/lock-in-clicked"/);
  assert.match(serverSource, /function recordLockInClickedEvent/);
  assert.match(serverSource, /lock-in-events\.json/);
  assert.match(appSource, /console\.info\("LOCK_IN_CLICKED"/);
  assert.match(appSource, /\/api\/web\/lock-in-clicked/);
  assert.doesNotMatch(functionBody("recordLockInClicked"), /password|token|secret|code/i);
  assert.match(packageSource, /"debug:lock-in-mobile"/);
});

test("mobile wallet options use per-wallet deeplink connect before fallback guidance", () => {
  assert.match(htmlSource, /vendor\/tweetnacl-fast\.min\.js/);
  assert.match(appSource, /phantom:\/\/v1\/connect/);
  assert.match(appSource, /intent:\/\/\$\{target\}#Intent;scheme=phantom;package=app\.phantom/);
  assert.doesNotMatch(functionBody("mobileWalletConnectBaseUrl"), /https:\/\/phantom\.app/);
  assert.match(appSource, /https:\/\/solflare\.com\/ul\/v1\/connect/);
  assert.match(appSource, /dapp_encryption_public_key/);
  assert.match(appSource, /redirect_link/);
  assert.match(appSource, /sw_wallet_state/);
  assert.match(appSource, /sw_wallet_pending/);
  const connectBody = functionBody("connectBrowserWallet");
  assert.match(connectBody, /await startMobileWalletConnect\(providerId, options\)/);
  assert.match(connectBody, /openMobileWalletBrowse\(providerId\)/);
  assert.ok(connectBody.indexOf("await startMobileWalletConnect(providerId, options)") < connectBody.indexOf("openMobileWalletBrowse(providerId)"));
  assert.doesNotMatch(appSource, /Open SlimeWire inside the Phantom in-app browser/);
});

test("mobile wallet callback can be finalized by the backend after returning from wallet app", () => {
  assert.match(functionBody("createServerMobileWalletPending"), /\/api\/web\/mobile-wallet\/start/);
  assert.match(functionBody("startMobileWalletConnect"), /createServerMobileWalletPending\(providerId, returnPath\)/);
  assert.match(functionBody("mobileWalletCallbackUrl"), /sw_wallet_pending/);
  assert.match(functionBody("mobileWalletCallbackBody"), /pendingConnectId/);
  assert.match(functionBody("completeServerMobileWalletCallback"), /\/api\/web\/mobile-wallet\/callback/);
  assert.match(functionBody("handleMobileWalletReturn"), /completeServerMobileWalletCallback\(providerId, params\)/);
  assert.match(functionBody("decryptMobileWalletPayload"), /pending\.stateId !== stateId/);
  assert.match(functionBody("decryptMobileWalletPayload"), /pending\.providerId !== providerId/);
  assert.match(functionBody("decryptMobileWalletPayload"), /nacl\.box\.before/);
  assert.match(functionBody("decryptMobileWalletPayload"), /nacl\.box\.open\.after/);
  assert.match(functionBody("completeMobileWalletConnection"), /\/api\/web\/profile\/connected-wallet/);
  assert.match(functionBody("completeMobileWalletConnection"), /publicKey: connection\.publicKey/);
  assert.match(functionBody("handleMobileWalletReturn"), /errorCode/);
  assert.match(functionBody("handleMobileWalletReturn"), /mobile_connect_callback_failed/);
  assert.match(appSource, /await handleMobileWalletReturn\(\);[\s\S]*render\(\);/);
});

test("backend stores pending mobile wallet connects and completes into web profile session", () => {
  assert.match(serverSource, /import nacl from "tweetnacl"/);
  assert.match(serverSource, /pathname === "\/api\/web\/mobile-wallet\/start"/);
  assert.match(serverSource, /pathname === "\/api\/web\/mobile-wallet\/callback"/);
  assert.match(serverSource, /MOBILE_WALLET_CONNECT_START/);
  assert.match(serverSource, /MOBILE_WALLET_CALLBACK_RECEIVED/);
  assert.match(serverSource, /MOBILE_WALLET_CALLBACK_VERIFIED/);
  assert.match(serverSource, /MOBILE_WALLET_FINALIZED/);
  assert.match(serverSource, /store\.mobileWalletConnects/);
  assert.match(serverSource, /status: "PENDING"/);
  assert.match(serverSource, /status: "COMPLETE"/);
  assert.match(serverSource, /updateWebConnectedWallet\(userId/);
  assert.match(serverSource, /issueWebSessionForExistingUser/);
  assert.doesNotMatch(serverSource, /console\.(?:log|info|warn|error)\([^)]*dappEncryptionSecretKey/);
});

test("wallet modal remains readable and clickable on mobile", () => {
  assert.match(overridesSource, /@media \(max-width: 640px\)\s*\{[\s\S]*\.wallet-connect-modal\s*\{[\s\S]*align-items: center !important/);
  assert.match(overridesSource, /\.wallet-connect-dialog\s*\{[\s\S]*max-height: calc\(100dvh - 24px\) !important/);
  assert.match(overridesSource, /\.wallet-connect-dialog\s*\{[\s\S]*overflow: auto !important/);
  assert.match(overridesSource, /\.modal-wallet-provider-buttons \.wallet-provider-choice img\s*\{[\s\S]*width: 28px !important/);
  assert.match(overridesSource, /\.modal-wallet-provider-buttons \.wallet-provider-choice small\s*\{[\s\S]*overflow-wrap: anywhere !important/);
});
