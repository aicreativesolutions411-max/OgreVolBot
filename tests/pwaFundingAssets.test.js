import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function read(relative) {
  return fs.readFileSync(new URL(`../${relative}`, import.meta.url), "utf8");
}

const publicFunding = read("web/public/slimewire-funding.js");
const publicCashHtml = read("web/public/cash/index.html");
const publicCashJs = read("web/public/cash/cash.js");
const publicCashWorker = read("web/public/cash/sw.js");
const publicFunHtml = read("web/public/fun.html");
const publicFunJs = read("web/public/fun.js");
const publicFunWorker = read("web/public/fun-sw.js");
const serverSource = read("src/index.js");

const distFunding = read("web/dist/slimewire-funding.js");
const distCashHtml = read("web/dist/cash/index.html");
const distCashWorker = read("web/dist/cash/sw.js");
const distFunHtml = read("web/dist/fun.html");
const distFunJs = read("web/dist/fun.js");
const distFunWorker = read("web/dist/fun-sw.js");

const fundingAsset = "/slimewire-funding.js?v=8";

test("Cash and Fun source shells install the same funding release", () => {
  for (const source of [publicCashHtml, publicCashWorker, publicFunJs]) {
    assert.match(source, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  }
  assert.doesNotMatch(publicFunHtml, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  assert.doesNotMatch(publicFunWorker, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  assert.match(publicCashHtml, /slimecash-build" content="39"/);
  assert.match(publicCashHtml, /cash\.css\?v=39/);
  assert.match(publicCashHtml, /cash\.js\?v=39/);
  assert.match(publicCashWorker, /cash\.css\?v=39/);
  assert.match(publicCashWorker, /cash\.js\?v=39/);
  assert.match(publicFunHtml, /fun\.css\?v=68/);
  assert.match(publicFunHtml, /fun\.js\?v=92/);
  assert.doesNotMatch(publicFunHtml, /fun-indicators\.js\?v=7/);
  assert.match(publicFunJs, /loadFunScript\("\/fun-indicators\.js\?v=7"\)/);
  assert.match(publicFunWorker, /fun\.css\?v=68/);
  assert.match(publicFunWorker, /fun\.js\?v=92/);
  assert.doesNotMatch(publicFunWorker, /fun-indicators\.js\?v=7/);
});

test("built PWA shells contain the same funding release as web/public", () => {
  assert.equal(distFunding, publicFunding, "build:web must copy the current shared funding helper");
  for (const source of [distCashHtml, distCashWorker, distFunJs]) {
    assert.match(source, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  }
  assert.doesNotMatch(distFunHtml, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  assert.doesNotMatch(distFunWorker, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  for (const source of [distFunding, distCashHtml, distCashWorker, distFunHtml, distFunJs, distFunWorker]) {
    assert.doesNotMatch(source, /startMobileConnect|startMobileSign|consumeMobileCallback|mobileSession|authorizeAndSignMobile|slimewire-mwa/i);
  }
});

test("installed Cash and Fun apps force worker updates and isolate their caches", () => {
  assert.match(publicCashJs, /serviceWorker\.register\("\/cash\/sw\.js", \{ updateViaCache: "none" \}\)/);
  assert.match(publicFunJs, /serviceWorker\.register\("\/fun-sw\.js", \{ scope: IS_WALLET_ROUTE \? "\/wallet\/" : "\/fun\/", updateViaCache: "none" \}\)/);
  assert.match(publicCashWorker, /const CACHE = "slimecash-v41"/);
  assert.match(publicFunWorker, /"slimewire-fun-v89"/);
  assert.match(publicCashWorker, /key\.startsWith\("slimecash-"\) && key !== CACHE/);
  assert.match(publicFunWorker, /key\.startsWith\(FUN_CACHE_PREFIX\) && key !== FUN_CACHE/);
  assert.doesNotMatch(publicCashWorker, /keys\.filter\(\(key\) => key !== CACHE\)/);
  for (const worker of [publicCashWorker, publicFunWorker]) {
    assert.match(worker, /self\.skipWaiting\(\)/);
    assert.match(worker, /self\.clients\.claim\(\)/);
    assert.match(worker, /fetch\(/);
    assert.match(worker, /caches\.match\(/);
  }
});

test("installed apps keep authentication parameters out of Cache Storage keys", () => {
  assert.match(publicCashWorker, /const cacheKey = event\.request\.mode === "navigate" \? "\/cash\/" : event\.request/);
  assert.match(publicCashWorker, /cache\.put\(cacheKey, copy\)/);
  assert.match(publicFunWorker, /const cacheKey = isFunPage \? \(IS_WALLET_WORKER \? "\/wallet\/" : "\/fun\/"\) : request/);
  assert.match(publicFunWorker, /cache\.put\(cacheKey, response\.clone\(\)\)/);
  for (const worker of [publicCashWorker, publicFunWorker]) {
    assert.match(worker, /url\.pathname\.startsWith\("\/api\/"\)/);
  }
});

test("query-versioned funding assets revalidate instead of becoming immutable", () => {
  const versionedRule = serverSource.match(/const versionedBundle = [\s\S]*?;\r?\n/)?.[0] || "";
  assert.ok(versionedRule, "static asset cache policy must define versionedBundle");
  assert.doesNotMatch(versionedRule, /slimewire-funding|cash\\\.js|fun\\\.js/);
  assert.match(serverSource, /const revalidatingAsset = \/\\\.\(\?:js\|css\)\$\/i\.test\(target\)/);
  assert.match(serverSource, /fileName === "slimewire-funding\.js"/);
});
