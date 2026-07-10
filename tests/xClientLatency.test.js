import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/lib/xClient.js", import.meta.url), "utf8");

test("X cookie DM REST calls do not wait for GraphQL query-id scraping", () => {
  const signedApiStart = source.indexOf("async function signedApiJson");
  const signedApiEnd = source.indexOf("function collectCookieDmEvents", signedApiStart);
  const signedApiSource = source.slice(signedApiStart, signedApiEnd);

  assert.match(signedApiSource, /await getSignerSession\(\)/);
  assert.doesNotMatch(signedApiSource, /await getSession\(\)/);
  assert.match(source, /Promise\.all\(\[getSignerSession\(\), getQueryIdMap\(\)\]\)/);
  assert.match(source, /let signerRefreshPromise = null/);
  assert.match(source, /let queryIdRefreshPromise = null/);
});

test("X signer and query-id refresh work is coalesced and time bounded", () => {
  assert.match(source, /withDeadline\(Promise\.resolve\(\)\.then\(\(\) => fetchXDocument\(\)\)/);
  assert.match(source, /signal: AbortSignal\.timeout\(homeTimeoutMs\)/);
  assert.match(source, /signal: AbortSignal\.timeout\(bundleTimeoutMs\)/);
  assert.match(source, /Promise\.allSettled\(selected\.map/);
  assert.match(source, /boundedMs\(process\.env\.X_DM_TIMEOUT_MS, 6_000, 2_000, 12_000\)/);
});

test("X cookie DM send uses direct recipient addressing before compatibility fallbacks", () => {
  const sendStart = source.indexOf("export async function xCookieDmSendText");
  const sendEnd = source.indexOf("// The account's REAL @mentions feed", sendStart);
  const sendSource = source.slice(sendStart, sendEnd);
  const directIndex = sendSource.indexOf("{ ...base, recipient_ids: recipient }");
  const ownLookupIndex = sendSource.indexOf("await xCookieDmOwnUserId()");

  assert.ok(directIndex >= 0, "direct recipient variant should exist");
  assert.ok(ownLookupIndex > directIndex, "Viewer/own-id lookup must only happen after the direct send fails");
});

test("X cookie own-user lookup honors the configured id without network access", async () => {
  const oldId = process.env.X_DM_OWN_USER_ID;
  const oldFetch = globalThis.fetch;
  process.env.X_DM_OWN_USER_ID = "123456789012345678";
  globalThis.fetch = async () => { throw new Error("network should not run"); };
  try {
    const client = await import(`../src/lib/xClient.js?own-id-test=${Date.now()}`);
    assert.equal(await client.xCookieDmOwnUserId(), "123456789012345678");
  } finally {
    if (oldId === undefined) delete process.env.X_DM_OWN_USER_ID;
    else process.env.X_DM_OWN_USER_ID = oldId;
    globalThis.fetch = oldFetch;
  }
});
