import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/old.html", import.meta.url), "utf8");
const overridesSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");

function functionBody(name) {
  const start = appSource.indexOf(`function ${name}`);
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

test("entry wallet cards start provider connect flow while main connect opens chooser", () => {
  assert.match(htmlSource, /data-connect-wallet="phantom"/);
  assert.match(htmlSource, /data-connect-wallet="solflare"/);
  assert.match(appSource, /target\.matches\("\[data-connect-wallet\]"\)[\s\S]*await connectBrowserWallet\(providerId, \{ returnPath: "\/terminal" \}\)/);
  assert.match(appSource, /target\.matches\("\[data-connect-wallet\]"\)[\s\S]*openWalletConnectChooser\(\{ returnPath: "\/terminal" \}\)/);
  assert.match(htmlSource, /data-web-signup-connect>Connect Wallet/);
});

test("connect page has route bootstrap without a global capture click blocker", () => {
  assert.match(htmlSource, /data-intro-gate/);
  // The video preload is injected only when the intro will play this session; the <video>
  // ships without src (preload="none") so skipped intros never download the clip.
  assert.doesNotMatch(htmlSource, /rel="preload" as="video"/);
  assert.match(htmlSource, /link\.as = "video"/);
  assert.match(htmlSource, /if \(skipsIntro \|\| introDone\) return/);
  assert.match(htmlSource, /data-intro-src="\.\/assets\/slimewire\/intro\/swamp-portal-intro\.mp4[^"]*"/);
  assert.match(htmlSource, /data-intro-src="\.\/assets\/slimewire\/intro\/swamp-portal-intro\.mp4[^"]*"[\s\S]*preload="none"/);
  assert.match(appSource, /entryVideo\.src = entryVideo\.dataset\.introSrc/);
  // No mute/skip/enter buttons: the video autoplays and auto-advances when it ends.
  assert.doesNotMatch(htmlSource, /data-intro-sound/);
  assert.doesNotMatch(htmlSource, /data-intro-start/);
  assert.doesNotMatch(htmlSource, /data-intro-skip/);
  assert.doesNotMatch(htmlSource, /swamp-transition\.mp4/);
  assert.match(appSource, /function initializeIntroVideoGate\(\)/);
  assert.match(appSource, /const tryPlay = \(muted\)/);
  assert.match(appSource, /finishIntro\(\)/);
  assert.match(appSource, /playPortalWhoosh\(\)/);
  assert.match(htmlSource, /sessionStorage\?\.getItem\("slimewireIntroCompleteV1"\) === "true"/);
  assert.match(htmlSource, /window\.history\.replaceState\(\{\}, "", "\/connect"\)/);
  assert.match(htmlSource, /const route = currentPath\.startsWith\("\/login"\)/);
  assert.match(htmlSource, /setRouteHidden\("\[data-connect\]", route !== "connect"\)/);
  assert.doesNotMatch(htmlSource, /window\.__SLIMEWIRE_EARLY_CONNECT_ACTION/);
  assert.doesNotMatch(htmlSource, /window\.__SLIMEWIRE_APP_READY/);
  assert.doesNotMatch(htmlSource, /document\.addEventListener\("click"[\s\S]*\{ capture: true \}/);
  assert.doesNotMatch(appSource, /async function consumeEarlyConnectAction\(\)/);
  assert.doesNotMatch(appSource, /void consumeEarlyConnectAction\(\)\.catch/);
});

test("Lock In opens login panels instead of toggling them closed", () => {
  assert.match(htmlSource, /data-open-login/);
  assert.match(htmlSource, /data-connect-login-toggle/);
  assert.match(appSource, /function openLoginPanel/);
  assert.match(appSource, /target\.matches\("\[data-connect-login-toggle\]"\)[\s\S]*openLoginPanel\(\{ connectPanel: true, source: "connect-lock-in" \}\)/);
  assert.match(appSource, /target\.matches\("\[data-open-login\]"\)[\s\S]*openLoginPanel\(\{ connectPanel: state\.route === "connect", source: "top-lock-in" \}\)/);
  assert.match(functionBody("openLoginPanel"), /openLoginModal\(options\)/);
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
  // New portal intro: full-bleed cover fit + the portal flash element (sound/enter buttons removed).
  assert.match(overridesSource, /\.swamp-intro-media\s*\{[\s\S]*object-fit: cover !important/);
  assert.match(overridesSource, /\.swamp-intro-portal/);
  assert.doesNotMatch(overridesSource, /\.swamp-intro-sound/);
  assert.match(overridesSource, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
});

test("closed interaction layers cannot block clicks or keep scroll locked", () => {
  assert.match(appSource, /function syncInteractionLocks\(\)/);
  assert.match(appSource, /document\.body\.style\.overflow = ""/);
  assert.match(appSource, /document\.documentElement\.style\.overflow = ""/);
  assert.match(appSource, /function closeTransientInteractionLayers/);
  assert.match(overridesSource, /\.wallet-connect-modal\[hidden\][\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\.login-modal\[hidden\][\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\[data-quick-buy-modal-root\]\[hidden\][\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /body:not\(\.login-modal-open\):not\(\.quick-buy-modal-open\)\s*\{[\s\S]*overflow-y: auto !important/);
});
