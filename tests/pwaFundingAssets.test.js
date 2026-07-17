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
const distFunWorker = read("web/dist/fun-sw.js");

const fundingAsset = "/slimewire-funding.js?v=8";

test("Cash and Fun source shells install the same funding release", () => {
  for (const source of [publicCashHtml, publicCashWorker, publicFunHtml, publicFunWorker]) {
    assert.match(source, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  }
  assert.match(publicCashHtml, /slimecash-build" content="22"/);
  assert.match(publicCashHtml, /cash\.css\?v=22/);
  assert.match(publicCashHtml, /cash\.js\?v=22/);
  assert.match(publicCashWorker, /cash\.css\?v=22/);
  assert.match(publicCashWorker, /cash\.js\?v=22/);
  assert.match(publicFunHtml, /fun\.css\?v=32/);
  assert.match(publicFunHtml, /fun\.js\?v=49/);
  assert.match(publicFunHtml, /fun-indicators\.js\?v=7/);
  assert.match(publicFunWorker, /fun\.css\?v=32/);
  assert.match(publicFunWorker, /fun\.js\?v=49/);
  assert.match(publicFunWorker, /fun-indicators\.js\?v=7/);
});

test("built PWA shells contain the same funding release as web/public", () => {
  assert.equal(distFunding, publicFunding, "build:web must copy the current shared funding helper");
  for (const source of [distCashHtml, distCashWorker, distFunHtml, distFunWorker]) {
    assert.match(source, new RegExp(fundingAsset.replace(/[.?]/g, "\\$&")));
  }
  for (const source of [distFunding, distCashHtml, distCashWorker, distFunHtml, distFunWorker]) {
    assert.doesNotMatch(source, /startMobileConnect|startMobileSign|consumeMobileCallback|mobileSession|authorizeAndSignMobile|slimewire-mwa/i);
  }
});

test("installed Cash and Fun apps force worker updates and isolate their caches", () => {
  assert.match(publicCashJs, /serviceWorker\.register\("\/cash\/sw\.js", \{ updateViaCache: "none" \}\)/);
  assert.match(publicFunJs, /serviceWorker\.register\("\/fun-sw\.js", \{ scope: "\/fun\/", updateViaCache: "none" \}\)/);
  assert.match(publicCashWorker, /const CACHE = "slimecash-v24"/);
  assert.match(publicFunWorker, /const FUN_CACHE = "slimewire-fun-v43"/);
  assert.match(publicCashWorker, /key\.startsWith\("slimecash-"\) && key !== CACHE/);
  assert.match(publicFunWorker, /key\.startsWith\("slimewire-fun-"\) && key !== FUN_CACHE/);
  assert.doesNotMatch(publicCashWorker, /keys\.filter\(\(key\) => key !== CACHE\)/);
  for (const worker of [publicCashWorker, publicFunWorker]) {
    assert.match(worker, /self\.skipWaiting\(\)/);
    assert.match(worker, /self\.clients\.claim\(\)/);
    assert.match(worker, /fetch\(/);
    assert.match(worker, /caches\.match\(/);
  }
});

test("query-versioned funding assets revalidate instead of becoming immutable", () => {
  const versionedRule = serverSource.match(/const versionedBundle = [\s\S]*?;\r?\n/)?.[0] || "";
  assert.ok(versionedRule, "static asset cache policy must define versionedBundle");
  assert.doesNotMatch(versionedRule, /slimewire-funding|cash\\\.js|fun\\\.js/);
  assert.match(serverSource, /const revalidatingAsset = \/\\\.\(\?:js\|css\)\$\/i\.test\(target\)/);
  assert.match(serverSource, /fileName === "slimewire-funding\.js"/);
});
