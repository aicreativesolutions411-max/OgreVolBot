import fs from "node:fs/promises";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(rootDir, "web", "public");
const distDir = path.join(rootDir, "web", "dist");

const ACTIVE_TERMINAL_BUDGETS = Object.freeze({
  htmlBytes: 32 * 1024,
  entryJsBytes: 420 * 1024,
  shellCssBytes: 56 * 1024,
  initialJsBytes: 700 * 1024
});

async function readText(filePath, fallback = "") {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function bytes(value = "") {
  return Buffer.byteLength(String(value), "utf8");
}

function count(source, pattern) {
  return [...String(source || "").matchAll(pattern)].length;
}

function localAssetUrls(html, pattern) {
  return [...String(html || "").matchAll(pattern)].map((match) => match[1]);
}

function localPathForUrl(baseDir, url) {
  const pathname = String(url || "").split(/[?#]/, 1)[0].replace(/^\/+/, "");
  return path.join(baseDir, ...pathname.split("/"));
}

async function assetMetrics(baseDir, urls) {
  const items = [];
  for (const url of urls) {
    const source = await readText(localPathForUrl(baseDir, url));
    if (!source) continue;
    const raw = Buffer.from(source, "utf8");
    items.push({
      url,
      bytes: raw.length,
      brotliBytes: zlib.brotliCompressSync(raw, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 6 }
      }).length
    });
  }
  return items;
}

function budget(actual, maximum) {
  return { actual, maximum, pass: Number.isFinite(actual) && actual <= maximum };
}

const sourceHtml = await readText(path.join(publicDir, "index.html"));
if (!sourceHtml) throw new Error("web/public/index.html is missing");
const sourceShellCss = sourceHtml.match(/<style>\s*(:root\{[\s\S]*?)<\/style>/)?.[1] || "";
const sourceEntryJs = sourceHtml.match(/<script>\s*("use strict";[\s\S]*?\}\)\(\);)\s*<\/script>(?=\s*<script src="\/terminal-pro\.js)/)?.[1] || "";
if (!sourceShellCss || !sourceEntryJs) throw new Error("Could not identify the active Terminal source blocks in web/public/index.html");

const builtHtml = await readText(path.join(distDir, "index.html"));
const built = Boolean(builtHtml && /data-terminal-entry/.test(builtHtml));
const builtJsUrls = built ? localAssetUrls(builtHtml, /<script[^>]+src="([^"]+\.js(?:\?[^"#]*)?)"[^>]*>/g) : [];
const builtCssUrls = built ? localAssetUrls(builtHtml, /<link[^>]+(?:rel="stylesheet"[^>]+href|href)="([^"]+\.css(?:\?[^"#]*)?)"[^>]*>/g) : [];
const [builtJs, builtCss] = built
  ? await Promise.all([assetMetrics(distDir, builtJsUrls), assetMetrics(distDir, builtCssUrls)])
  : [[], []];
const entry = builtJs.find((item) => /\/terminal-app\.[a-f0-9]{12}\.js$/.test(item.url));
const shell = builtCss.find((item) => /\/terminal-shell\.[a-f0-9]{12}\.css$/.test(item.url));
const initialJsBytes = builtJs.reduce((sum, item) => sum + item.bytes, 0);
const checks = built ? {
  html: budget(bytes(builtHtml), ACTIVE_TERMINAL_BUDGETS.htmlBytes),
  entryJs: budget(entry?.bytes ?? Number.POSITIVE_INFINITY, ACTIVE_TERMINAL_BUDGETS.entryJsBytes),
  shellCss: budget(shell?.bytes ?? Number.POSITIVE_INFINITY, ACTIVE_TERMINAL_BUDGETS.shellCssBytes),
  initialJs: budget(initialJsBytes, ACTIVE_TERMINAL_BUDGETS.initialJsBytes)
} : null;

const report = {
  activeEntry: "web/public/index.html",
  source: {
    htmlBytes: bytes(sourceHtml),
    inlineShellCssBytes: bytes(sourceShellCss),
    inlineEntryJsBytes: bytes(sourceEntryJs),
    templateElementLiterals: count(sourceHtml, /<[a-z][^!?/][^>]*>/gi),
    buttonLiterals: count(sourceHtml, /<button\b/gi),
    inputLiterals: count(sourceHtml, /<input\b/gi),
    fetchCallSites: count(sourceEntryJs, /\bfetch\s*\(/g),
    intervalCallSites: count(sourceEntryJs, /\bsetInterval\s*\(/g),
    timeoutCallSites: count(sourceEntryJs, /\bsetTimeout\s*\(/g)
  },
  delivery: {
    built,
    htmlBytes: built ? bytes(builtHtml) : null,
    largeInlineBlocksRemoved: built
      ? !/<style>\s*:root\{/.test(builtHtml) && !/<script>\s*"use strict";/.test(builtHtml)
      : null,
    hashedEntry: entry?.url || null,
    hashedShell: shell?.url || null,
    subresourceIntegrity: built
      ? /integrity="sha384-[^"]+"[^>]*data-terminal-entry/.test(builtHtml)
        && /integrity="sha384-[^"]+"[^>]*data-terminal-shell/.test(builtHtml)
      : null,
    executionOrderPreserved: built
      ? builtHtml.indexOf("data-terminal-entry") < builtHtml.indexOf("/terminal-pro.js")
        && !/<script[^>]+data-terminal-entry[^>]+(?:async|defer)/.test(builtHtml)
      : null,
    entryPreloadedFromHead: built
      ? /<link[^>]+rel="preload"[^>]+terminal-app\.[a-f0-9]{12}\.js[^>]+data-terminal-preload/.test(builtHtml)
        && builtHtml.indexOf("data-terminal-preload") < builtHtml.indexOf("</head>")
      : null,
    javascript: builtJs,
    stylesheets: builtCss,
    initialJsBytes,
    initialJsBrotliBytes: builtJs.reduce((sum, item) => sum + item.brotliBytes, 0)
  },
  runtimeGuards: {
    earlyPhoneRedirectStaysInline: sourceHtml.indexOf("swPreferDesktop") < sourceHtml.indexOf("<style>"),
    serviceWorkerRegistered: /navigator\.serviceWorker\.register\("\/sw\.js"\)/.test(sourceEntryJs),
    walletPollingPausesWhenHidden: /state\.token\s*&&\s*!document\.hidden\)refreshWallets/.test(sourceEntryJs),
    routePollsAreOwnedByTimeouts: /state\.pollT=setTimeout/.test(sourceEntryJs) && /clearTimeout\(state\.pollT\)/.test(sourceEntryJs),
    chartLibraryStillEager: /<script defer src="\/vendor\/lightweight-charts/.test(sourceHtml),
    indicatorsStillEager: /<script src="\/fun-indicators\.js/.test(sourceHtml)
  },
  budgets: checks,
  budgetsPass: checks ? Object.values(checks).every((item) => item.pass) : null
};

console.log("TERMINAL PROFILE");
console.log(JSON.stringify(report, null, 2));

if (process.argv.includes("--check")) {
  if (!built) {
    console.error("Build the web portal before enforcing active Terminal budgets: npm run build:web");
    process.exitCode = 1;
  } else if (!report.budgetsPass) {
    console.error("Active Terminal delivery exceeds its performance budget");
    process.exitCode = 1;
  }
}
