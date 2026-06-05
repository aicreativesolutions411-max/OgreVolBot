import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const htmlSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const overridesSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");

function finalMobileHeaderCss() {
  const marker = "/* 2026-06-05 terminal mobile header cleanup.";
  const start = overridesSource.indexOf(marker);
  assert.notEqual(start, -1, "terminal mobile header cleanup CSS marker is present");
  return overridesSource.slice(start);
}

test("terminal mobile topbar keeps every original action hook", () => {
  for (const hook of [
    "data-terminal-global-search",
    "data-global-token-search",
    "data-global-token-open",
    "data-web-signup-connect",
    "data-web-signup",
    "data-open-login",
    "data-tab=\"profile\"",
    "data-logout",
    "data-top-refresh-wallet",
    "data-tpsl-status-button",
    "data-top-sync-strip"
  ]) {
    assert.match(htmlSource, new RegExp(hook.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("terminal mobile topbar CSS stacks search actions and status instead of squeezing labels", () => {
  const css = finalMobileHeaderCss();
  assert.match(css, /@media \(max-width: 820px\)/);
  assert.match(css, /\[data-app\]\[data-route="terminal"\] \.topbar\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) !important/);
  assert.match(css, /\.terminal-global-search\s*\{[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto !important/);
  assert.match(css, /\.top-auth-group\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(css, /\.top-sync-strip\s*\{[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\) !important/);
  assert.match(css, /\.top-sync-strip > span\s*\{[\s\S]*grid-column: 1 \/ -1 !important/);
  assert.match(css, /\.top-sync-strip > span\s*\{[\s\S]*width: 100% !important/);
});

test("terminal mobile topbar labels remain readable without ellipsis clipping", () => {
  const css = finalMobileHeaderCss();
  assert.match(css, /white-space: normal !important/);
  assert.match(css, /overflow-wrap: break-word !important/);
  assert.match(css, /text-overflow: clip !important/);
  assert.doesNotMatch(css, /text-overflow:\s*ellipsis/);
  assert.doesNotMatch(css, /overflow:\s*hidden !important/);
});

test("terminal topbar handlers are still wired to the existing actions", () => {
  assert.match(appSource, /target\.matches\("\[data-global-token-open\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-top-refresh-wallet\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-open-login\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-web-signup-connect\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-web-signup\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-logout\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-tab\]"\)/);
});

test("terminal disconnected status is not duplicated visually in the sync card", () => {
  assert.match(appSource, /setText\("\[data-sync-health\]", hasWalletContext \? syncHealthLabel\(\) : "Sync idle"\)/);
  assert.match(htmlSource, /<span class="top-wallet-disconnected">Status: Wallet not connected<\/span>/);
});
