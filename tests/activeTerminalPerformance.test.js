import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const terminalHtml = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const buildSource = fs.readFileSync(new URL("../scripts/build-web.js", import.meta.url), "utf8");
const profileSource = fs.readFileSync(new URL("../scripts/profile-terminal.js", import.meta.url), "utf8");
const debugSource = fs.readFileSync(new URL("../scripts/debug-frontend-perf.js", import.meta.url), "utf8");
const packageSource = fs.readFileSync(new URL("../package.json", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function activeBlocks(html) {
  return {
    css: html.match(/<style>\s*(:root\{[\s\S]*?)<\/style>/)?.[1] || "",
    js: html.match(/<script>\s*("use strict";[\s\S]*?\}\)\(\);)\s*<\/script>(?=\s*<script src="\/terminal-pro\.js)/)?.[1] || ""
  };
}

test("the active Terminal is index.html and its large delivery blocks are build inputs", () => {
  const blocks = activeBlocks(terminalHtml);
  assert.ok(Buffer.byteLength(blocks.css) > 10_000, "active shell CSS block was not identified");
  assert.ok(Buffer.byteLength(blocks.js) > 100_000, "active Terminal JS block was not identified");
  assert.ok(terminalHtml.indexOf("swPreferDesktop") < terminalHtml.indexOf("<style>"), "phone redirect must stay before first paint");
  assert.ok(terminalHtml.indexOf('src="/config.js"') < terminalHtml.indexOf('"use strict"'), "runtime config must load before the app");
  assert.ok(terminalHtml.indexOf('"use strict"') < terminalHtml.indexOf('src="/terminal-pro.js'), "Terminal app must execute before enhancements");
});

test("the web build emits minified, immutable active Terminal assets without changing execution order", () => {
  assert.match(buildSource, /async function extractActiveTerminalBundles\(html\)/);
  assert.match(buildSource, /\["index\.html", "gg\.html"\]/);
  assert.match(buildSource, /loader: "css"[\s\S]*minify: true/);
  assert.match(buildSource, /loader: "js"[\s\S]*minify: true/);
  assert.match(buildSource, /terminal-shell\.\$\{contentHash\(styleOutput\)\}\.css/);
  assert.match(buildSource, /terminal-app\.\$\{contentHash\(scriptOutput\)\}\.js/);
  assert.match(buildSource, /const scriptIntegrity = contentIntegrity\(scriptOutput\)/);
  assert.match(buildSource, /integrity="\$\{scriptIntegrity\}"/);
  assert.match(buildSource, /rel="preload"[^>]+as="script"[^>]+fetchpriority="high"[^>]+data-terminal-preload/);
  assert.match(buildSource, /data-terminal-entry onload="window\.__terminalAssetReady\(\)" onerror="window\.__terminalAssetRetry\('app'\)"/);
  assert.match(buildSource, /data-terminal-shell onerror="window\.__terminalAssetRetry\('shell'\)"/);
  assert.match(buildSource, /slimewire-terminal-asset-retries/);
  assert.match(buildSource, /attempts<=30/);
  assert.match(buildSource, /window\.__terminalAssetReady/);
  assert.doesNotMatch(buildSource.match(/const scriptTag =[^\n]+/)?.[0] || "", /\b(?:async|defer)\b/);
  assert.match(buildSource, /\.replace\(scriptMatch\[0\], scriptTag\)/);
  assert.match(serverSource, /const fingerprintedBundle = \/\\\.\[a-f0-9\]\{12\}\\\.\(\?:js\|css\)\$\//);
  assert.match(serverSource, /public, max-age=31536000, immutable/);
});

test("Terminal performance tools profile the live index entry and enforce delivery budgets", () => {
  assert.match(profileSource, /web", "public"/);
  assert.match(profileSource, /"index\.html"/);
  assert.match(profileSource, /ACTIVE_TERMINAL_BUDGETS/);
  assert.match(profileSource, /process\.argv\.includes\("--check"\)/);
  assert.doesNotMatch(profileSource, /web\/public\/app\.js|old\.html/);
  assert.match(debugSource, /readText\("web\/public\/index\.html"\)/);
  assert.match(debugSource, /sourceAudited: "web\/public\/index\.html/);
  assert.doesNotMatch(debugSource, /readText\("web\/public\/app\.js"\)|old\.html/);
  assert.match(packageSource, /"check:terminal-budget": "npm run build:web && node scripts\/profile-terminal\.js --check"/);
});
