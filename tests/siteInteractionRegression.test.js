import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const overridesSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");

function functionBody(name) {
  const marker = `function ${name}`;
  const start = appSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} missing`);
  const next = appSource.indexOf("\nfunction ", start + marker.length);
  return appSource.slice(start, next === -1 ? undefined : next);
}

test("site does not install a broad inline capture click blocker", () => {
  assert.doesNotMatch(htmlSource, /document\.addEventListener\("click"[\s\S]*event\.preventDefault\(\)[\s\S]*\{ capture: true \}/);
  assert.doesNotMatch(`${htmlSource}\n${appSource}`, /__SLIMEWIRE_EARLY_CONNECT_ACTION/);
  assert.match(appSource, /document\.addEventListener\("click", async \(event\) =>/);
});

test("browser app bundle has one return-path helper declaration", () => {
  assert.equal([...appSource.matchAll(/function currentReturnPath\(\)/g)].length, 1);
});

test("deep terminal and chart routes load root assets", () => {
  assert.match(htmlSource, /<base href="\/">/);
  assert.doesNotMatch(htmlSource, /<script src="\.\/config\.js"/);
});

test("decorative and closed overlay layers cannot capture clicks", () => {
  assert.match(overridesSource, /\.wallet-connect-modal\[hidden\][\s\S]*display: none !important;[\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\.login-modal\[hidden\][\s\S]*display: none !important;[\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\[data-quick-buy-modal-root\]\[hidden\][\s\S]*display: none !important;[\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\.login-view\.swamp-splash::before[\s\S]*pointer-events: none !important/);
  assert.match(overridesSource, /\.swamp-connect-shell::before[\s\S]*pointer-events: none !important/);
});

test("body scroll is restored after modal close and route changes", () => {
  const syncLocks = functionBody("syncInteractionLocks");
  assert.match(syncLocks, /document\.body\.classList\.toggle\("login-modal-open", loginOpen\)/);
  assert.match(syncLocks, /document\.body\.classList\.toggle\("quick-buy-modal-open", quickBuyOpen\)/);
  assert.match(syncLocks, /document\.body\.style\.overflow = ""/);
  assert.match(syncLocks, /document\.documentElement\.style\.overflow = ""/);
  assert.match(functionBody("navigateTo"), /closeTransientInteractionLayers\(\{ keepLogin: state\.route === "login" \}\)/);
  assert.match(overridesSource, /body:not\(\.login-modal-open\):not\(\.quick-buy-modal-open\)\s*\{[\s\S]*overflow-y: auto !important/);
});

test("intro, connect, terminal, and chart surfaces remain scrollable", () => {
  assert.match(overridesSource, /\[data-app\]\[data-route="intro"\][\s\S]*overflow-y: visible !important/);
  assert.match(overridesSource, /\[data-app\]\[data-route="connect"\][\s\S]*overflow-y: visible !important/);
  assert.match(overridesSource, /\[data-app\]\[data-route="connect"\] \.connect-view[\s\S]*overflow-y: visible !important/);
  assert.match(overridesSource, /\[data-app\]\[data-route="terminal"\] \.dashboard[\s\S]*overflow-y: visible !important/);
  assert.match(overridesSource, /\.chart-trade-page[\s\S]*touch-action: manipulation !important/);
});

test("Trade and Quick Buy behavior stays separated", () => {
  const clickHandlerSlice = appSource.slice(appSource.indexOf('document.addEventListener("click"'));
  assert.match(clickHandlerSlice, /target\.matches\("\[data-token-chart\]"\)[\s\S]*openTokenChart/);
  assert.match(clickHandlerSlice, /target\.matches\("\[data-token-trade\]"\)[\s\S]*event\.stopPropagation\(\)[\s\S]*openTokenChart/);
  assert.match(clickHandlerSlice, /target\.matches\("\[data-quick-buy-token\]"\)[\s\S]*event\.stopPropagation\(\)[\s\S]*openQuickBuy/);
  assert.doesNotMatch(functionBody("openTokenChart"), /quickPresetTrade|executeWebBuy|\/api\/web\/trade\/buy/);
});

test("interaction debug commands are available", () => {
  assert.match(packageSource, /debug:click-blockers/);
  assert.match(packageSource, /debug:scroll-health/);
  assert.match(packageSource, /debug:interaction-map/);
});
