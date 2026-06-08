import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
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

function parseAttributes(markup) {
  return Object.fromEntries([...markup.matchAll(/([\w:-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]));
}

test("sponsor and social external links are final, safe, and accessible", () => {
  assert.doesNotMatch(htmlSource, /share\.google/);
  assert.match(htmlSource, /https:\/\/dexscreener\.com\/solana\/67fpweu4iar36zn9ttmfzoztpbruv2gepnrmjqbq32mc/);
  assert.match(htmlSource, /aria-label="Open ASML on Dex"/);
  assert.match(htmlSource, /https:\/\/dexscreener\.com\/solana\/5czf8ao1z4yrxzext2sk1b577cbd5j9naieybamuswy4/);
  assert.match(htmlSource, /https:\/\/usd2sol\.finance/);
  assert.match(htmlSource, /aria-label="Open USD2 website"/);

  const externalAnchors = [...htmlSource.matchAll(/<a\b[^>]*href="https?:\/\/[^"]+"[^>]*>/g)];
  assert.ok(externalAnchors.length > 0, "expected external links in the page");
  for (const match of externalAnchors) {
    const attrs = parseAttributes(match[0]);
    assert.equal(attrs.target, "_blank", `external link should open safely: ${match[0]}`);
    assert.match(attrs.rel || "", /\bnoopener\b/, `external link needs noopener: ${match[0]}`);
    assert.match(attrs.rel || "", /\bnoreferrer\b/, `external link needs noreferrer: ${match[0]}`);
    assert.ok((attrs["aria-label"] || "").startsWith("Open "), `external link needs destination label: ${match[0]}`);
    assert.doesNotMatch(attrs.href || "", /share\.google|^\s*$|#$|javascript:/i);
  }
});

test("terms and privacy remain clickable policy controls", () => {
  assert.match(htmlSource, /href="#slimeness" data-policy="terms" aria-label="Open Slimeness Terms"/);
  assert.match(htmlSource, /href="#slime-policy" data-policy="privacy" aria-label="Open Slime Policy Privacy"/);
  assert.match(appSource, /target\.matches\("\[data-policy\]"\)/);
  assert.match(functionBody("policyText"), /Slimeness/);
  assert.match(functionBody("policyText"), /Slime Policy/);
});

test("account modal is inert while closed and restores focus after close", () => {
  assert.match(htmlSource, /data-login-modal role="presentation" aria-hidden="true" hidden/);
  assert.match(htmlSource, /data-close-login aria-label="Close login/);
  assert.match(functionBody("openLoginModal"), /rememberLoginModalReturnFocus\(\)/);
  assert.match(functionBody("closeLoginModal"), /state\.loginModalOpen = false/);
  assert.match(functionBody("closeLoginModal"), /restoreLoginModalReturnFocus\(\)/);
  assert.match(functionBody("trapLoginModalFocus"), /event\.key !== "Tab"/);
  assert.match(appSource, /loginModal\.toggleAttribute\("inert", !loginModalVisible\)/);
  assert.match(appSource, /if \(trapLoginModalFocus\(event\)\) return/);
  assert.match(overridesSource, /\.login-modal\[aria-hidden="true"\],[\s\S]*\.login-modal\[aria-hidden="true"\] \*/);
});

test("login and email-code flows validate instead of silently failing", () => {
  assert.match(functionBody("loginCredentialsFromForm"), /Enter your username\./);
  assert.match(functionBody("loginCredentialsFromForm"), /Enter your password\./);
  assert.match(functionBody("validateEmailLoginValue"), /Enter the email saved on your web account\./);
  assert.match(functionBody("validateEmailLoginValue"), /Enter a valid email address\./);
  assert.match(functionBody("emailCodeLogin"), /validateEmailLoginValue\(emailLoginValueFromForm\(\)\)/);
  assert.match(functionBody("emailCodeLogin"), /Enter the login code from your email\./);
  assert.match(functionBody("createWebAccount"), /Quick web account created\./);
});

test("wallet, refresh, and TP-SL disconnected states surface clear status", () => {
  assert.match(functionBody("connectBrowserWallet"), /walletInstallGuidance/);
  assert.match(functionBody("refreshWalletState"), /Wallet not connected/);
  assert.match(functionBody("refreshWalletState"), /state\.walletRefreshStatus = "idle"/);
  assert.match(functionBody("refreshWalletState"), /finishPositionRefreshAction\("error"/);
  assert.match(functionBody("updateAutomationPermission"), /!hasTpSlAutomationWalletContext\(\)/);
  assert.match(functionBody("updateAutomationPermission"), /Connect or create a wallet before enabling TP\/SL\./);
});

test("terminal nav exposes the requested tool set without blank links", () => {
  for (const tab of [
    "profile",
    "smartChart",
    "trade",
    "live",
    "liveTrades",
    "slimeScope",
    "watchlist",
    "kol",
    "ogreAi",
    "launchCoin",
    "bundle",
    "volume",
    "launch",
    "sniper",
    "ogreTek",
    "wallets",
    "positions",
    "pnl"
  ]) {
    assert.match(htmlSource, new RegExp(`data-tab="${tab}"`), `missing terminal tab ${tab}`);
  }
  assert.match(htmlSource, /Browse Terminal/);
  assert.doesNotMatch(htmlSource, /<button[^>]+data-tab=""|href=""/);
});

test("mobile overflow and sponsor ticker hardening stays in place", () => {
  assert.match(htmlSource, /<meta name="viewport" content="width=device-width, initial-scale=1">/);
  assert.match(overridesSource, /FUNCTIONAL_QA_SWEEP_20260608_V1/);
  assert.match(overridesSource, /overflow-x: clip !important/);
  assert.match(overridesSource, /main\.shell\[data-app\] \.swamp-market-ticker,[\s\S]*main\.shell\[data-app\] \.swamp-ticker-mask/);
  assert.match(overridesSource, /main\.shell\[data-app\] \.swamp-ticker-item summary,[\s\S]*touch-action: manipulation !important/);
  assert.match(overridesSource, /max-width: min\(86vw, 280px\) !important/);
  assert.ok((htmlSource.match(/class="swamp-ticker-strip"/g) || []).length >= 2, "duplicated sponsor/KOL ticker strips should remain");
});
