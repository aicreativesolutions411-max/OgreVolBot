import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const overridesSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");

function functionBody(name) {
  const start = appSource.indexOf(`function ${name}`);
  if (start < 0) return "";
  const bodyStart = appSource.indexOf("{", start);
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

test("entry Connect Wallet opens wallet chooser before account creation", () => {
  assert.match(htmlSource, /data-web-signup-connect/);
  const body = functionBody("createAccountAndConnectWallet");
  assert.match(body, /openWalletConnectChooser\(\{ returnPath: "\/terminal" \}\)/);
  assert.doesNotMatch(body, /\/api\/web\/signup/);
  assert.doesNotMatch(body, /window\.history\.pushState/);
});

test("wallet options use provider connect flow and safe unavailable guidance", () => {
  assert.match(appSource, /function walletInstallGuidance/);
  assert.match(appSource, /function walletBrowseDeepLink/);
  assert.match(appSource, /https:\/\/phantom\.app\/ul\/browse/);
  assert.match(appSource, /https:\/\/solflare\.com\/ul\/v1\/browse/);
  assert.match(appSource, /function logWalletConnectFailure/);
  assert.match(appSource, /async function connectBrowserWallet/);
  assert.match(appSource, /walletProviderById\(providerId\)/);
  assert.match(appSource, /openMobileWalletBrowse\(providerId\)/);
  assert.match(appSource, /provider\.connect\?\.\(\{ onlyIfTrusted: false \}\)/);
  assert.match(appSource, /ensureWebAccount\(status, "Creating secure web profile for connected wallet\.\.\."\)/);
  assert.match(appSource, /logWalletConnectFailure\(providerId, error/);
  assert.match(appSource, /data-connect-wallet-provider="\$\{wallet\.id\}"/);
  assert.match(appSource, /data-connect-create-wallet/);
});

test("entry wallet cards open the chooser instead of dead-ending on one missing provider", () => {
  assert.match(htmlSource, /data-connect-wallet="phantom"/);
  assert.match(htmlSource, /data-connect-wallet="solflare"/);
  assert.match(appSource, /target\.matches\("\[data-connect-wallet\]"\)[\s\S]*openWalletConnectChooser\(\{ returnPath: "\/terminal" \}\)/);
  assert.doesNotMatch(appSource, /if \(providerId === "solana"\) openWalletConnectChooser\(\{ returnPath: "\/terminal" \}\);\s*else await connectBrowserWallet/);
});

test("Lock In opens login panels instead of toggling them closed", () => {
  assert.match(htmlSource, /data-open-login/);
  assert.match(htmlSource, /data-connect-login-toggle/);
  assert.match(appSource, /function openLoginPanel/);
  assert.match(appSource, /target\.matches\("\[data-connect-login-toggle\]"\)[\s\S]*openLoginPanel\(\{ connectPanel: true \}\)/);
  assert.match(appSource, /target\.matches\("\[data-open-login\]"\)[\s\S]*openLoginPanel\(\{ connectPanel: state\.route === "connect" \}\)/);
});

test("wallet and login overlays stay above decorative frames and remain clickable", () => {
  assert.match(overridesSource, /\.wallet-connect-modal\s*\{[\s\S]*z-index: 5000 !important/);
  assert.match(overridesSource, /\.wallet-connect-modal\s*\{[\s\S]*pointer-events: auto !important/);
  assert.match(overridesSource, /\.top-login-panel\s*\{[\s\S]*z-index: 1200 !important/);
  assert.match(overridesSource, /\.connect-login-panel\s*\{[\s\S]*pointer-events: auto !important/);
  assert.match(overridesSource, /\.modal-wallet-provider-buttons\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(overridesSource, /\.modal-wallet-provider-buttons \.wallet-provider-choice img\s*\{[\s\S]*width: 28px !important/);
  assert.match(overridesSource, /touch-action: manipulation !important/);
});

test("entry/connect mobile performance avoids the heaviest frame filters", () => {
  assert.match(overridesSource, /@media \(max-width: 760px\), \(prefers-reduced-motion: reduce\)/);
  assert.match(overridesSource, /background-attachment: scroll !important/);
  assert.match(overridesSource, /filter: none !important/);
  assert.match(overridesSource, /backdrop-filter: none !important/);
});
