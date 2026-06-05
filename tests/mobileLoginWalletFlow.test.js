import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const overridesSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");

function functionBody(name) {
  const syncStart = appSource.indexOf(`function ${name}`);
  const asyncStart = appSource.indexOf(`async function ${name}`);
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  if (start < 0) return "";
  const paramsEnd = appSource.indexOf(")", start);
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
  assert.match(htmlSource, /data-login-username/);
  assert.match(htmlSource, /data-login-password/);
  assert.match(htmlSource, /data-web-password-login/);
  assert.match(htmlSource, /data-login-email/);
  assert.match(htmlSource, /data-login-code/);
  assert.match(htmlSource, /data-send-email-code/);
  assert.match(htmlSource, /data-web-code-login/);
  assert.match(htmlSource, /data-close-login/);
  assert.match(appSource, /target\.matches\("\[data-send-email-code\]"\)[\s\S]*sendEmailLoginCode\(\)/);
  assert.match(appSource, /target\.matches\("\[data-web-code-login\]"\)[\s\S]*emailCodeLogin\(\)/);
  assert.match(functionBody("sendEmailLoginCode"), /\/api\/web\/email-code/);
  assert.match(functionBody("emailCodeLogin"), /\/api\/web\/login/);
});

test("mobile Lock In modal is fixed above the terminal header and remains tappable", () => {
  assert.match(overridesSource, /@media \(max-width: 640px\)\s*\{[\s\S]*\.top-login-panel\s*\{[\s\S]*position: fixed !important/);
  assert.match(overridesSource, /\.top-login-panel\s*\{[\s\S]*max-height: calc\(100dvh - 24px\) !important/);
  assert.match(overridesSource, /\.top-login-panel\s*\{[\s\S]*overflow: auto !important/);
  assert.match(overridesSource, /\.top-login-panel\s*\{[\s\S]*z-index: 6500 !important/);
  assert.match(overridesSource, /\.top-login-panel input,[\s\S]*\.connect-login-panel input\s*\{[\s\S]*font-size: 16px !important/);
});

test("mobile wallet options use per-wallet deeplink connect before fallback guidance", () => {
  assert.match(htmlSource, /vendor\/tweetnacl-fast\.min\.js/);
  assert.match(appSource, /https:\/\/phantom\.app\/ul\/v1\/connect/);
  assert.match(appSource, /https:\/\/solflare\.com\/ul\/v1\/connect/);
  assert.match(appSource, /dapp_encryption_public_key/);
  assert.match(appSource, /redirect_link/);
  assert.match(appSource, /sw_wallet_state/);
  const connectBody = functionBody("connectBrowserWallet");
  assert.match(connectBody, /startMobileWalletConnect\(providerId, options\)/);
  assert.match(connectBody, /openMobileWalletBrowse\(providerId\)/);
  assert.ok(connectBody.indexOf("startMobileWalletConnect(providerId, options)") < connectBody.indexOf("openMobileWalletBrowse(providerId)"));
  assert.doesNotMatch(appSource, /Open SlimeWire inside the Phantom in-app browser/);
});

test("mobile wallet callback verifies pending state and decrypts locally before saving public wallet", () => {
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

test("wallet modal remains readable and clickable on mobile", () => {
  assert.match(overridesSource, /@media \(max-width: 640px\)\s*\{[\s\S]*\.wallet-connect-modal\s*\{[\s\S]*align-items: center !important/);
  assert.match(overridesSource, /\.wallet-connect-dialog\s*\{[\s\S]*max-height: calc\(100dvh - 24px\) !important/);
  assert.match(overridesSource, /\.wallet-connect-dialog\s*\{[\s\S]*overflow: auto !important/);
  assert.match(overridesSource, /\.modal-wallet-provider-buttons \.wallet-provider-choice img\s*\{[\s\S]*width: 28px !important/);
  assert.match(overridesSource, /\.modal-wallet-provider-buttons \.wallet-provider-choice small\s*\{[\s\S]*overflow-wrap: anywhere !important/);
});
