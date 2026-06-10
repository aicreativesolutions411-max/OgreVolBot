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
  const nextMarker = overridesSource.indexOf("/* 2026-06-07 trader polish", start + marker.length);
  return overridesSource.slice(start, nextMarker === -1 ? undefined : nextMarker);
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
    "data-top-wallet-connect",
    "data-top-wallet-status",
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
  assert.match(appSource, /target\.matches\("\[data-top-wallet-connect\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-open-login\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-web-signup-connect\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-web-signup\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-logout\]"\)/);
  assert.match(appSource, /target\.matches\("\[data-tab\]"\)/);
});

test("terminal disconnected status is not duplicated visually in the sync card", () => {
  assert.match(appSource, /setText\("\[data-sync-health\]", hasWalletContext \? syncHealthLabel\(\) : "Sync idle"\)/);
  assert.match(htmlSource, /<button type="button" class="top-wallet-status top-wallet-disconnected" data-top-wallet-status data-wallet-state="disconnected">Wallet: Connect<\/button>/);
});

test("terminal route cannot show the intro splash underneath the header", () => {
  assert.match(htmlSource, /<main class="shell" data-app data-route="intro">/);
  assert.match(appSource, /function syncShellRouteVisibility\(\)/);
  assert.match(appSource, /syncShellRouteVisibility\(\);\s*if \(!options\.force && shouldDeferTerminalRender\(\)\)/);
  assert.match(appSource, /setRouteSectionHidden\(loginView, !\["intro", "login"\]\.includes\(state\.route\)\)/);
  assert.match(overridesSource, /\[data-app\]:not\(\[data-route="terminal"\]\) \[data-terminal-global-search\]/);
  assert.match(overridesSource, /\[data-app\]:not\(\[data-route="terminal"\]\) \[data-top-sync-strip\]/);
  assert.match(overridesSource, /\[data-app\]\[data-route="terminal"\] \[data-login\]/);
  assert.match(overridesSource, /\[data-app\]\[data-route="terminal"\] \[data-connect\]/);
  assert.match(overridesSource, /\[data-route-view-hidden="true"\]/);
});

test("intro video gate has a real connect-route fallback", () => {
  assert.match(htmlSource, /data-intro-gate/);
  // Button-free portal intro: no sound/skip/enter controls; auto-advances when it ends, and
  // a safety timer (armFallback) still lands on /connect if the video stalls or errors.
  assert.doesNotMatch(htmlSource, /data-intro-sound/);
  assert.doesNotMatch(htmlSource, /data-intro-start/);
  assert.doesNotMatch(htmlSource, /data-intro-skip/);
  assert.match(htmlSource, /swamp-portal-intro\.mp4/);
  assert.match(htmlSource, /sessionStorage\?\.getItem\("slimewireIntroCompleteV1"\) === "true"/);
  assert.match(htmlSource, /window\.history\.replaceState\(\{\}, "", "\/connect"\)/);
  assert.match(htmlSource, /const route = currentPath\.startsWith\("\/login"\)/);
  assert.match(htmlSource, /currentPath\.startsWith\("\/connect"\)\s*\?\s*"connect"/);
  assert.match(htmlSource, /setRouteHidden\("\[data-connect\]", route !== "connect"\)/);
  assert.match(htmlSource, /toggleAttribute\("hidden", route !== "terminal"\)/);
  assert.match(appSource, /function initializeIntroVideoGate\(\)/);
  assert.match(appSource, /const armFallback = \(ms\)/);
  assert.match(appSource, /if \(introActive\(\)\) finishIntro\(\)/);
  assert.match(appSource, /entryVideo\?\.addEventListener\("ended", finishIntro\)/);
  assert.match(appSource, /navigateTo\("\/connect"\)/);
});

test("mobile topbar rescue does not force hidden auth groups visible", () => {
  assert.match(overridesSource, /\.top-auth-group\[hidden\]/);
  assert.match(overridesSource, /\[data-guest-actions\]\[hidden\]/);
  assert.match(overridesSource, /\[data-session-actions\]\[hidden\]/);
  assert.match(overridesSource, /\.terminal-global-search\[hidden\]/);
  assert.match(overridesSource, /\.top-sync-strip\[hidden\]/);
});
