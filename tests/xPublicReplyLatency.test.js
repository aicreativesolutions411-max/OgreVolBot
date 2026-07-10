import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const clientSource = fs.readFileSync(new URL("../src/lib/xClient.js", import.meta.url), "utf8");
const logoSource = fs.readFileSync(new URL("../src/lib/slimeMapRender.mjs", import.meta.url), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.ok(start >= 0, `${name} should exist`);
  const next = source.indexOf("\n}", start);
  assert.ok(next > start, `${name} should have a body`);
  return source.slice(start, next + 2);
}

test("public X mention sources start concurrently without increasing the source set", () => {
  const body = functionBody(clientSource, "xSearchMentions");
  const notificationStart = body.indexOf("const notificationPromise");
  const envSearchStart = body.indexOf("const envSearchPromise");
  const handleWait = body.indexOf("await xResolvedHandle()");

  assert.ok(notificationStart >= 0 && notificationStart < handleWait, "notifications should start before Viewer/handle lookup finishes");
  assert.ok(envSearchStart >= 0 && envSearchStart < handleWait, "the already-required env-handle search should start before Viewer finishes");
  assert.match(body, /const searchHandles = includeSearch \? \[\.\.\.new Set\(\[resolved, envH\]/);
  assert.match(body, /await Promise\.all\(\[/);
  assert.match(clientSource, /async function searchMentionsForHandle/);
});

test("public X media uploads use bounded concurrency two and preserve upload results", () => {
  const post = functionBody(clientSource, "xPost");
  assert.match(clientSource, /async function runXWithConcurrency/);
  assert.match(post, /runXWithConcurrency\(bufs, 2, \(buffer\) => uploadMedia\(buffer\)\)/);
  assert.doesNotMatch(post, /for \(const b of bufs\).*await uploadMedia/);
});

test("shared logo fetcher deduplicates candidates and has one total deadline", () => {
  const body = functionBody(logoSource, "fetchLogoBuffer");
  assert.match(body, /new Set\(ipfsGatewayCandidates/);
  assert.match(body, /const deadline = Date\.now\(\) \+ totalMs/);
  assert.match(body, /const remainingMs = deadline - Date\.now\(\)/);
  assert.doesNotMatch(body, /Math\.max\(2500/);
});

test("shared logo fetcher returns near its requested total deadline", async () => {
  const previousFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (_url, options = {}) => new Promise((resolve, reject) => {
    calls += 1;
    const abort = () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    };
    if (options.signal?.aborted) abort();
    else options.signal?.addEventListener("abort", abort, { once: true });
  });

  try {
    const { fetchLogoBuffer } = await import(`../src/lib/slimeMapRender.mjs?deadline-test=${Date.now()}`);
    const startedAt = Date.now();
    const result = await fetchLogoBuffer("ipfs://QmSlimeWireDeadlineTest", 32, 320);
    const elapsedMs = Date.now() - startedAt;

    assert.equal(result, null);
    assert.ok(calls >= 1 && calls <= 4, `expected 1-4 deduped gateway attempts, got ${calls}`);
    assert.ok(elapsedMs < 850, `logo fetch exceeded its total deadline budget: ${elapsedMs}ms`);
  } finally {
    globalThis.fetch = previousFetch;
  }
});
