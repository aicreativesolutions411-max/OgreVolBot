import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

import { transform } from "esbuild";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "web", "public");
const distDir = path.join(rootDir, "web", "dist");

async function copyDir(source, target) {
  await fs.mkdir(target, { recursive: true });
  const entries = await fs.readdir(source, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);

    if (entry.isDirectory()) {
      await copyDir(sourcePath, targetPath);
    } else if (entry.isFile()) {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function envBool(name, fallback = false) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  return ["1", "true", "yes", "on", "enabled"].includes(String(value).trim().toLowerCase());
}

function envNumber(name, fallback) {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envList(name, fallback) {
  const items = String(process.env[name] || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : fallback;
}

// These are identification guards, not performance floors: legitimate future
// modularization must be allowed to make the source blocks much smaller.
const ACTIVE_TERMINAL_STYLE_MIN_BYTES = 10_000;
const ACTIVE_TERMINAL_SCRIPT_MIN_BYTES = 100_000;

function contentHash(source) {
  return createHash("sha256").update(source).digest("hex").slice(0, 12);
}

function contentIntegrity(source) {
  return `sha384-${createHash("sha384").update(source).digest("base64")}`;
}

async function extractActiveTerminalBundles(html) {
  // index.html is the live desktop terminal. Keep the tiny redirect/body-class
  // scripts inline because they must run before first paint, but move the large
  // shell stylesheet and app IIFE into independently cacheable assets. Plain
  // (non-defer/non-async) script loading at the original body position preserves
  // the exact execution order ahead of terminal-pro.js and fun-indicators.js.
  const stylePattern = /<style>\s*(:root\{[\s\S]*?)<\/style>/;
  const scriptPattern = /<script>\s*("use strict";[\s\S]*?\}\)\(\);)\s*<\/script>(?=\s*<script src="\/terminal-pro\.js)/;
  const styleMatch = html.match(stylePattern);
  const scriptMatch = html.match(scriptPattern);
  const styleSource = styleMatch?.[1] || "";
  const scriptSource = scriptMatch?.[1] || "";
  const styleBytes = Buffer.byteLength(styleSource);
  const scriptBytes = Buffer.byteLength(scriptSource);

  if (styleBytes < ACTIVE_TERMINAL_STYLE_MIN_BYTES) {
    throw new Error(`Active terminal stylesheet was not found or is unexpectedly small (${styleBytes} bytes)`);
  }
  if (scriptBytes < ACTIVE_TERMINAL_SCRIPT_MIN_BYTES) {
    throw new Error(`Active terminal script was not found or is unexpectedly small (${scriptBytes} bytes)`);
  }

  const [styleBuild, scriptBuild] = await Promise.all([
    transform(styleSource, {
      loader: "css",
      minify: true,
      target: "es2020",
      charset: "utf8",
      legalComments: "none"
    }),
    transform(scriptSource, {
      loader: "js",
      minify: true,
      target: "es2020",
      charset: "utf8",
      legalComments: "none"
    })
  ]);
  const styleOutput = Buffer.from(styleBuild.code || "", "utf8");
  const scriptOutput = Buffer.from(`${scriptBuild.code || ""}\n;window.__terminalAssetReady&&window.__terminalAssetReady();`, "utf8");
  if (styleOutput.length < 1_000 || scriptOutput.length < 10_000) {
    throw new Error("Active terminal minification produced an unexpectedly small bundle");
  }

  const assetDir = path.join(distDir, "assets");
  await fs.mkdir(assetDir, { recursive: true });
  const styleFile = `terminal-shell.${contentHash(styleOutput)}.css`;
  const scriptFile = `terminal-app.${contentHash(scriptOutput)}.js`;
  await Promise.all([
    fs.writeFile(path.join(assetDir, styleFile), styleOutput),
    fs.writeFile(path.join(assetDir, scriptFile), scriptOutput)
  ]);

  const styleIntegrity = contentIntegrity(styleOutput);
  const scriptIntegrity = contentIntegrity(scriptOutput);
  const retryBootstrap = `<script data-terminal-asset-retry>
(function(){
  var timer=0,failed=false,key="slimewire-terminal-asset-retries";
  window.__terminalAssetRetry=function(kind){
    if(timer)return;failed=true;
    var attempts=1;try{attempts=(Number(sessionStorage.getItem(key))||0)+1;sessionStorage.setItem(key,String(attempts));}catch(e){}
    document.documentElement.setAttribute("data-terminal-updating",kind||"asset");
    if(attempts<=30)timer=setTimeout(function(){location.reload();},Math.min(4000,500+(attempts*250)));
    else document.title="SlimeWire update ready — refresh";
  };
  window.__terminalAssetReady=function(){
    if(failed)return;try{sessionStorage.removeItem(key);}catch(e){}
    document.documentElement.removeAttribute("data-terminal-updating");
  };
})();
</script>`;
  const styleTag = `${retryBootstrap}\n<link rel="stylesheet" href="/assets/${styleFile}" integrity="${styleIntegrity}" crossorigin="anonymous" data-terminal-shell onerror="window.__terminalAssetRetry('shell')">\n<link rel="preload" href="/assets/${scriptFile}" as="script" integrity="${scriptIntegrity}" crossorigin="anonymous" fetchpriority="high" data-terminal-preload>`;
  const scriptTag = `<script src="/assets/${scriptFile}" integrity="${scriptIntegrity}" crossorigin="anonymous" data-terminal-entry onload="window.__terminalAssetReady()" onerror="window.__terminalAssetRetry('app')"></script>`;
  const builtHtml = html
    .replace(styleMatch[0], styleTag)
    .replace(scriptMatch[0], scriptTag);

  if (builtHtml === html || /<style>\s*:root\{/.test(builtHtml) || /<script>\s*"use strict";\s*\(function\(\)\{/.test(builtHtml)) {
    throw new Error("Active terminal source extraction did not replace both inline blocks");
  }

  console.log(
    `Bundled active terminal CSS ${(styleBytes / 1024).toFixed(0)}KB -> ${(styleOutput.length / 1024).toFixed(0)}KB; `
    + `JS ${(scriptBytes / 1024).toFixed(0)}KB -> ${(scriptOutput.length / 1024).toFixed(0)}KB`
  );
  return builtHtml;
}

try {
  await fs.rm(distDir, { recursive: true, force: true });
} catch (error) {
  if (error?.code !== "EBUSY" && error?.code !== "EPERM") throw error;
  console.warn(`Could not fully clear ${path.relative(rootDir, distDir)} (${error.code}); copying over existing files.`);
}
await copyDir(publicDir, distDir);

const buildId = String(process.env.WEB_BUILD_ID || new Date().toISOString().replace(/[-:.TZ]/g, "")).slice(0, 14);
const brandedApiBase = "https://app.slimewire.org";
const configuredApiBase = normalizeBaseUrl(process.env.OGRE_API_BASE || process.env.WEB_API_BASE || brandedApiBase);
const apiBase = /(?:^|\/\/)[^/]*\.onrender\.com(?:\/|$)/i.test(configuredApiBase)
  ? brandedApiBase
  : configuredApiBase;
const telegramBotUsername = String(process.env.TELEGRAM_BOT_USERNAME || "SlimeWiredBot").trim().replace(/^@/, "");
const portalUrl = normalizeBaseUrl(process.env.WEB_PORTAL_URL || "https://www.slimewire.org");
const pfpCdnBase = normalizeBaseUrl(process.env.PFP_CDN_BASE || "");
const ogreTek = {
  enabled: envBool("OGRE_TEK_ENABLED", envBool("NEXT_PUBLIC_ENABLE_OGRE_TEK", false)),
  demoMode: envBool("OGRE_TEK_DEMO_MODE", true),
  provider: String(process.env.OGRE_TEK_PROVIDER || "mock").trim().toLowerCase() || "mock",
  maxLeverage: Math.max(1, envNumber("OGRE_TEK_MAX_LEVERAGE", 5)),
  maxPositionSize: Math.max(0, envNumber("OGRE_TEK_MAX_POSITION_SIZE", 10_000)),
  dailyLossLimit: Math.max(0, envNumber("OGRE_TEK_DAILY_LOSS_LIMIT", 500)),
  allowedMarkets: envList("OGRE_TEK_ALLOWED_MARKETS", ["SOL-PERP", "BTC-PERP", "ETH-PERP"]),
  emergencyDisabled: envBool("OGRE_TEK_EMERGENCY_DISABLED", false),
  staleMarketMs: Math.max(5_000, envNumber("OGRE_TEK_STALE_MARKET_MS", 60_000)),
  staleAccountMs: Math.max(5_000, envNumber("OGRE_TEK_STALE_ACCOUNT_MS", 60_000))
};
const pumpLive = {
  enabled: envBool("PUMP_LIVE_ENABLED", false),
  provider: String(process.env.PUMP_LIVE_PROVIDER || "").trim().toLowerCase(),
  ingestUrl: normalizeBaseUrl(process.env.PUMP_LIVE_INGEST_URL || ""),
  playbackBaseUrl: normalizeBaseUrl(process.env.PUMP_LIVE_PLAYBACK_BASE_URL || ""),
  docsUrl: normalizeBaseUrl(process.env.PUMP_LIVE_DOCS_URL || ""),
  chatEnabled: envBool("PUMP_LIVE_CHAT_ENABLED", true),
};
const featureFlags = {
  slimeShieldEnabled: envBool("VITE_SLIMESHIELD_ENABLED", true),
  kolDumpDetectorEnabled: envBool("VITE_KOL_DUMP_DETECTOR_ENABLED", true),
  replayBeforeBuyEnabled: envBool("VITE_REPLAY_BEFORE_BUY_ENABLED", true),
  protectedBuyEnabled: envBool("VITE_PROTECTED_BUY_ENABLED", true),
  tokenAvatarFixEnabled: envBool("VITE_TOKEN_AVATAR_FIX_ENABLED", true),
  devInfoEnabled: envBool("VITE_DEV_INFO_ENABLED", true),
  postgresHydrationEnabled: envBool("VITE_POSTGRES_HYDRATION_ENABLED", true),
  chatAiEnabled: envBool("VITE_CHAT_AI_ENABLED", true),
  chatAiProviderEnabled: envBool("VITE_CHAT_AI_PROVIDER_ENABLED", true),
  siteSmoothnessFixesEnabled: envBool("VITE_SITE_SMOOTHNESS_FIXES_ENABLED", true),
  disableUnfinishedButtons: envBool("VITE_DISABLE_UNFINISHED_BUTTONS", true),
  debugPerformanceCounters: envBool("VITE_DEBUG_PERFORMANCE_COUNTERS", false)
};
const configSource = `window.OGRE_PORTAL_CONFIG = ${JSON.stringify({ apiBase, telegramBotUsername, portalUrl, pfpCdnBase, featureFlags, ogreTek, pumpLive }, null, 2)};\n`;
await fs.writeFile(path.join(distDir, "config.js"), configSource, "utf8");

// Render swaps instances while a deploy becomes live. A query-only version such
// as cash.js?v=15 can briefly be requested from the previous instance, which
// serves its old cash.js under the new URL and poisons the browser cache with a
// mismatched HTML/JS pair. Ship the Cash entry under its content hash instead:
// the previous instance can only return 404, and the small loader retries until
// the new instance owns the request. SRI also prevents an incorrect response
// from ever executing.
const cashScriptPath = path.join(distDir, "cash", "cash.js");
const cashScriptSource = await fs.readFile(cashScriptPath);
const cashScriptHash = createHash("sha256").update(cashScriptSource).digest("hex").slice(0, 12);
const fundingScriptSource = await fs.readFile(path.join(distDir, "slimewire-funding.js"));
const fundingScriptHash = createHash("sha256").update(fundingScriptSource).digest("hex").slice(0, 12);
const cashScriptIntegrity = `sha384-${createHash("sha384").update(cashScriptSource).digest("base64")}`;
const cashScriptFile = `cash.${cashScriptHash}.js`;
const cashScriptUrl = `/cash/${cashScriptFile}`;
await fs.writeFile(path.join(distDir, "cash", cashScriptFile), cashScriptSource);

const cashLoader = `<script>
(function(){
  var attempts=0;
  var source=${JSON.stringify(cashScriptUrl)};
  var integrity=${JSON.stringify(cashScriptIntegrity)};
  function loadCash(){
    var script=document.createElement("script");
    script.src=source+(attempts?"?retry="+Date.now():"");
    script.integrity=integrity;
    script.crossOrigin="anonymous";
    script.dataset.cashEntry="";
    script.onerror=function(){
      script.remove();
      attempts+=1;
      var tag=document.querySelector(".splash-tag");
      if(tag) tag.textContent=attempts<15?"updating SlimeCash...":"tap refresh to finish updating";
      if(attempts<15) setTimeout(loadCash,Math.min(3000,500+(attempts*250)));
    };
    document.body.appendChild(script);
  }
  loadCash();
})();
</script>`;
const cashIndexPath = path.join(distDir, "cash", "index.html");
const cashIndexHtml = await fs.readFile(cashIndexPath, "utf8");
await fs.writeFile(
  cashIndexPath,
  cashIndexHtml.replace(/<script src="\/cash\/cash\.js(?:\?v=[^"]*)?"><\/script>/, cashLoader),
  "utf8"
);

const cashWorkerPath = path.join(distDir, "cash", "sw.js");
const cashWorkerSource = await fs.readFile(cashWorkerPath, "utf8");
await fs.writeFile(
  cashWorkerPath,
  cashWorkerSource
    .replace(/const CACHE = "slimecash-[^"]+";/, `const CACHE = "slimecash-${cashScriptHash}-funding-${fundingScriptHash}";`)
    .replace(/"\/cash\/cash\.js(?:\?v=[^"]*)?"/, JSON.stringify(cashScriptUrl)),
  "utf8"
);
console.log(`Fingerprint Cash entry ${cashScriptFile}`);

for (const activeTerminalPage of ["index.html", "gg.html"]) {
  const pagePath = path.join(distDir, activeTerminalPage);
  const pageHtml = await fs.readFile(pagePath, "utf8");
  const versionedPageHtml = pageHtml
    .replace(/styles\.css(?:\?v=[^"]*)?/g, `styles.css?v=${buildId}`)
    .replace(/slimewire-final-overrides\.css(?:\?v=[^"]*)?/g, `slimewire-final-overrides.css?v=${buildId}`)
    .replace(/ogre-stages\.css(?:\?v=[^"]*)?/g, `ogre-stages.css?v=${buildId}`)
    .replace(/app\.js(?:\?v=[^"]*)?/g, `app.js?v=${buildId}`);
  await fs.writeFile(pagePath, await extractActiveTerminalBundles(versionedPageHtml), "utf8");
}

try {
  const assetDir = path.join(distDir, "assets");
  await fs.mkdir(assetDir, { recursive: true });
  await fs.copyFile(
    path.join(rootDir, "pnl-card-slime-preview.png"),
    path.join(assetDir, "pnl-card-slime-preview.png")
  );
} catch (error) {
  console.warn(`Web preview image was not copied: ${error.message}`);
}

// Minify the shipped app.js: Brotli covers the wire, but phones still parse the
// full source - minification roughly halves parse/eval time on mobile. The public/
// source stays readable; only dist/ gets the compact build.
try {
  const appSource = await fs.readFile(path.join(distDir, "app.js"), "utf8");
  const minified = await transform(appSource, { minify: true, target: "es2020", charset: "utf8" });
  if (minified.code && minified.code.length > 10_000) {
    await fs.writeFile(path.join(distDir, "app.js"), minified.code, "utf8");
    console.log(`Minified app.js ${(appSource.length / 1024).toFixed(0)}KB -> ${(minified.code.length / 1024).toFixed(0)}KB`);
  }
} catch (error) {
  console.warn(`app.js minify skipped: ${error.message}`);
}

console.log(`Built OgreTrade web portal at ${path.relative(rootDir, distDir)}`);
