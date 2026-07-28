import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  enqueueGroupBuyOutbox,
  groupBuyOutboxId,
} from "../src/lib/groupBuyReliability.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const serverSource = fs.readFileSync(path.join(here, "..", "src", "index.js"), "utf8");

function sourceBetween(startMarker, endMarker) {
  const start = serverSource.indexOf(startMarker);
  const end = serverSource.indexOf(endMarker);
  assert.notEqual(start, -1, `${startMarker} missing`);
  assert.notEqual(end, -1, `${endMarker} missing`);
  return serverSource.slice(start + startMarker.length, end);
}

function functionBody(name) {
  const marker = `function ${name}(`;
  const start = serverSource.indexOf(marker);
  assert.notEqual(start, -1, `${name} missing`);
  const open = serverSource.indexOf("{", start);
  let depth = 0;
  let quote = "";
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = open; index < serverSource.length; index += 1) {
    const char = serverSource[index];
    const next = serverSource[index + 1];
    if (lineComment) { if (char === "\n") lineComment = false; continue; }
    if (blockComment) { if (char === "*" && next === "/") { blockComment = false; index += 1; } continue; }
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === "/" && next === "/") { lineComment = true; index += 1; continue; }
    if (char === "/" && next === "*") { blockComment = true; index += 1; continue; }
    if (char === '"' || char === "'" || char === "`") { quote = char; continue; }
    if (char === "{") depth += 1;
    if (char === "}" && --depth === 0) return serverSource.slice(open + 1, index);
  }
  throw new Error(`Could not parse ${name}`);
}

const helperSource = sourceBetween(
  "// GROUP_BUY_RELIABILITY_HELPERS_START",
  "// GROUP_BUY_RELIABILITY_HELPERS_END"
);
const helpers = Function(`"use strict";${helperSource};return {
  createGroupBuyHostRateGate,
  groupBuyRateLimitDelayMs,
  groupBuyBackoffDelayMs,
  groupBuyFeedRetryDelayMs,
  retryGroupBuyFeedOperation,
  createGroupBuyHttpState,
  beginGroupBuyHttpProgress,
  applyGroupBuyHttpPage,
  commitGroupBuyHttpProgress,
  serializeGroupBuyHttpState,
  hydrateGroupBuyHttpState,
  serializeGroupBuyHandoffState,
  hydrateGroupBuyHandoffState,
  groupBuyTradeHandoffCandidate
};`)();

const identity = (trade) => trade?.id ? `id:${trade.id}` : "";
const alias = (trade) => trade?.tx ? `tx:${trade.tx}` : "";

test("one host-wide FIFO gate spaces starts and applies provider-wide 429 cooldown", async () => {
  let now = 0;
  const sleeps = [];
  const starts = [];
  const gate = helpers.createGroupBuyHostRateGate({
    minIntervalMs: 250,
    nowFn: () => now,
    sleepFn: async (milliseconds) => { sleeps.push(milliseconds); now += milliseconds; },
  });

  await gate.schedule(async () => { starts.push(now); });
  const retryDelay = helpers.groupBuyRateLimitDelayMs({
    get(name) {
      if (name.toLowerCase() === "retry-after") return "2";
      if (name.toLowerCase() === "x-ratelimit-reset") return "5";
      return null;
    },
  }, now);
  assert.equal(retryDelay, 5_000);
  gate.cooldown(retryDelay);
  await gate.schedule(async () => { starts.push(now); });

  assert.deepEqual(starts, [0, 5_000]);
  assert.ok(sleeps.some((milliseconds) => milliseconds >= 5_000));
  assert.ok(helpers.groupBuyBackoffDelayMs(3, 8_000, 0) >= 8_000);
  assert.match(serverSource, /remainingHeader \? Number\(remainingHeader\) : Number\.NaN/);
  assert.match(serverSource, /remaining <= 1/);
});

test("Pump buy pages retry through the shared cooldown and preserve the page until success", async () => {
  let calls = 0;
  const cooldowns = [];
  const retries = [];
  const result = await helpers.retryGroupBuyFeedOperation(async ({ attempt }) => {
    calls += 1;
    if (attempt <= 2) {
      const error = new Error("Pump trade feed returned HTTP 429");
      error.status = 429;
      error.retryAfterMs = attempt === 1 ? 12_000 : 6_000;
      throw error;
    }
    return { trades: [{ id: "buy-after-throttle" }] };
  }, {
    maxAttempts: 4,
    cooldownFn: (delayMs) => cooldowns.push(delayMs),
    onRetry: (entry) => retries.push(entry),
  });

  assert.equal(calls, 3);
  assert.deepEqual(result.trades.map((trade) => trade.id), ["buy-after-throttle"]);
  assert.equal(cooldowns.length, 2);
  assert.ok(cooldowns[0] >= 12_000);
  assert.ok(cooldowns[1] >= 6_000);
  assert.equal(retries.length, 2);
});

test("Pump buy page retry policy is bounded and rejects permanent responses immediately", async () => {
  assert.equal(helpers.groupBuyFeedRetryDelayMs({ status: 400, message: "bad request" }, 1, 0), 0);
  assert.equal(helpers.groupBuyFeedRetryDelayMs({ status: 429, message: "throttled" }, 1, 0), 5_000);
  assert.ok(helpers.groupBuyFeedRetryDelayMs({ status: 503, message: "unavailable" }, 2, 0) >= 3_000);
  assert.ok(helpers.groupBuyFeedRetryDelayMs({ status: 522, message: "Cloudflare timeout" }, 1, 0) > 0);

  let permanentCalls = 0;
  await assert.rejects(helpers.retryGroupBuyFeedOperation(async () => {
    permanentCalls += 1;
    const error = new Error("Pump trade feed returned HTTP 404");
    error.status = 404;
    throw error;
  }, { maxAttempts: 4 }), /HTTP 404/);
  assert.equal(permanentCalls, 1);

  let throttledCalls = 0;
  await assert.rejects(helpers.retryGroupBuyFeedOperation(async () => {
    throttledCalls += 1;
    const error = new Error("Pump trade feed returned HTTP 429");
    error.status = 429;
    throw error;
  }, { maxAttempts: 3 }), /HTTP 429/);
  assert.equal(throttledCalls, 3);
});

test("the shared Pump host gate lets live buy pages jump ahead of queued background reads", async () => {
  let now = 0;
  const starts = [];
  const gate = helpers.createGroupBuyHostRateGate({
    minIntervalMs: 250,
    nowFn: () => now,
    sleepFn: async (milliseconds) => { now += milliseconds; },
  });
  const first = gate.schedule(async () => { starts.push("background-1"); });
  const second = gate.schedule(async () => { starts.push("background-2"); });
  const live = gate.schedule(async () => { starts.push("live-buy"); }, { priority: 100 });
  await Promise.all([first, second, live]);
  assert.deepEqual(starts, ["background-1", "live-buy", "background-2"]);
});

test("priority preference is bounded so charts and fee jobs cannot starve", async () => {
  let now = 0;
  const starts = [];
  const gate = helpers.createGroupBuyHostRateGate({
    minIntervalMs: 1,
    maxPriorityBurst: 8,
    nowFn: () => now,
    sleepFn: async (milliseconds) => { now += milliseconds; },
  });
  const jobs = [
    gate.schedule(async () => { starts.push("live-0"); }, { priority: 100 }),
    ...Array.from({ length: 11 }, (_, index) => (
      gate.schedule(async () => { starts.push(`live-${index + 1}`); }, { priority: 100 })
    )),
    gate.schedule(async () => { starts.push("background"); }),
  ];
  await Promise.all(jobs);
  assert.ok(starts.indexOf("background") <= 8, `background started too late: ${starts.join(",")}`);
});

test("websocket delivery cannot initialize or advance the HTTP baseline", () => {
  const http = helpers.createGroupBuyHttpState();
  const websocketDelivered = new Set(["id:live-ws"]); // deliberately separate state
  assert.equal(websocketDelivered.has("id:live-ws"), true);

  const progress = helpers.beginGroupBuyHttpProgress(http);
  assert.equal(progress.firstPoll, true);
  helpers.applyGroupBuyHttpPage(progress, {
    trades: [{ id: "live-ws", tx: "live" }, { id: "historical", tx: "old" }],
    pagination: { hasMore: true, nextCursor: "older-page" },
  }, identity, alias);

  // The first HTTP page is a baseline even though websocket delivery already exists. It must not
  // chase older-page looking for a websocket identity that Pump has not indexed yet.
  assert.equal(progress.complete, true);
  assert.equal(progress.cursor, "");
  assert.equal(helpers.commitGroupBuyHttpProgress(http, progress, identity, alias, 100), true);
  assert.equal(http.initialized, true);
  assert.equal(http.seen.has("id:live-ws"), true);

  const wsBody = functionBody("onGroupBuyTrade");
  assert.doesNotMatch(wsBody, /groupBuyHttpState|beginGroupBuyHttpProgress|commitGroupBuyHttpProgress/);
});

test("zero or identity-less websocket events do not poison recovery by HTTP", () => {
  const prior = { seen: new Set(), aliases: new Set(), firstHttpSlotByAlias: new Map() };
  const deps = {
    normalizeFn: (trade) => ({ solAmount: Number(trade.amountSol) || 0 }),
    identityFn: identity,
    aliasFn: alias,
  };

  assert.equal(helpers.groupBuyTradeHandoffCandidate({ id: "same", tx: "same", amountSol: 0 }, prior, deps), null);
  assert.equal(prior.seen.size, 0);
  assert.equal(prior.aliases.size, 0);
  const recovered = helpers.groupBuyTradeHandoffCandidate({ id: "same", tx: "same", amountSol: 0.42 }, prior, deps);
  assert.equal(recovered.identity, "id:same");
  assert.equal(recovered.event.solAmount, 0.42);
  assert.equal(helpers.groupBuyTradeHandoffCandidate({ tx: "", amountSol: 1 }, prior, deps), null);

  prior.seen.add(recovered.identity);
  prior.aliases.add(recovered.alias);
  const restored = helpers.hydrateGroupBuyHandoffState(
    JSON.parse(JSON.stringify(helpers.serializeGroupBuyHandoffState(prior, 100))),
    100
  );
  assert.equal(restored.seen.has("id:same"), true);
  assert.equal(restored.aliases.has("tx:same"), true);
  assert.match(functionBody("normalizeGroupBuyTrade"), /eventKey: firstString/);
  assert.match(functionBody("handoffGroupBuyTrade"), /eventKey: candidate\.durableKey/);
  assert.match(functionBody("drainGroupBuyTradeDeliveryQueue"), /postGroupBuy\(mint, item\.event\)/);
  assert.match(serverSource, /async function postGroupBuy\(mint, \{ eventKey = ""/);
  const postGroupBuySource = sourceBetween("async function postGroupBuy", "async function warmRhGroupBuyEthUsd");
  assert.match(postGroupBuySource, /firstString\(\s*eventKey,\s*eventAlias,/s);
  assert.doesNotMatch(postGroupBuySource, /await resolveGroupTokenImage/);
  assert.match(postGroupBuySource, /void resolveGroupTokenImage\(mint\)/);
  assert.match(serverSource, /queueGroupBuyAlert\([^;]+\{ eventKey: alertEventKey, targetGeneration \},\s*\);/s);
  assert.match(functionBody("pollGroupBuyTradesForMint"), /await handoffGroupBuyTrade\(mint, trade\)/);
  assert.match(functionBody("pollGroupBuyTradesForMint"), /if \(!commit\(\)\) throw/);
  assert.match(functionBody("pollGroupBuyTradesForMint"), /await persistGroupBuySolState\(mint\)/);
  assert.match(serverSource, /await restoreGroupBuyReliabilityState\(\)/);
  assert.doesNotMatch(serverSource, /(?<!pumpSwapApi)fetch(?:Json)?\(`https:\/\/swap-api\.pump\.fun/);
  const fetchPage = functionBody("fetchGroupBuyTradePage");
  assert.match(fetchPage, /retryGroupBuyFeedOperation/);
  assert.match(fetchPage, /priority: attempt > 1 \? 110 : 100/);
  assert.match(fetchPage, /maxAttempts: GROUP_BUY_TRADE_FETCH_ATTEMPTS/);
  assert.match(fetchPage, /pumpSwapApiHostGate\.cooldown/);
});

test("one websocket alias merges with one HTTP slot without collapsing identical instructions", () => {
  const testAlias = (trade) => trade?.tx ? `tx:${trade.tx}:buy:trader:0.420000000000:12.0000000000` : "";
  const testIdentity = (trade) => trade?.slotIndexId ? `slot:${trade.slotIndexId}` : testAlias(trade);
  const normalizeFn = (trade) => ({ solAmount: Number(trade.amountSol) || 0 });
  const empty = { seen: new Set(), aliases: new Set(), firstHttpSlotByAlias: new Map() };
  const wsTrade = { tx: "shared", amountSol: 0.42 };
  const ws = helpers.groupBuyTradeHandoffCandidate(wsTrade, empty, {
    normalizeFn, identityFn: testIdentity, aliasFn: testAlias,
  });
  assert.equal(ws.durableKey, testAlias(wsTrade));

  const chatId = "-100123";
  const wsEventKey = `sol:MintA:${ws.durableKey}`;
  const wsItem = {
    id: groupBuyOutboxId({ chatId, eventKey: wsEventKey }),
    chatId,
    eventKey: wsEventKey,
  };
  let store = enqueueGroupBuyOutbox(null, wsItem, 1_000).store;

  // Simulate a crash before the websocket handoff state itself was checkpointed. The first HTTP slot
  // still chooses the alias key and resolves to the already-durable outbox row.
  const http1Trade = { ...wsTrade, slotIndexId: "100:1" };
  const httpAfterRestart = helpers.groupBuyTradeHandoffCandidate(http1Trade, empty, {
    normalizeFn, identityFn: testIdentity, aliasFn: testAlias,
  });
  assert.equal(httpAfterRestart.durableKey, ws.durableKey);
  const replay = enqueueGroupBuyOutbox(store, {
    id: groupBuyOutboxId({ chatId, eventKey: `sol:MintA:${httpAfterRestart.durableKey}` }),
    chatId,
    eventKey: `sol:MintA:${httpAfterRestart.durableKey}`,
  }, 1_100);
  store = replay.store;
  assert.equal(replay.inserted, false);
  assert.equal(Object.keys(store.outbox).length, 1);

  const afterFirstHttp = {
    seen: new Set([httpAfterRestart.identity]),
    aliases: new Set([httpAfterRestart.alias]),
    firstHttpSlotByAlias: new Map([[httpAfterRestart.alias, httpAfterRestart.identity]]),
  };
  const http2 = helpers.groupBuyTradeHandoffCandidate({
    ...wsTrade,
    slotIndexId: "100:2",
  }, afterFirstHttp, {
    normalizeFn, identityFn: testIdentity, aliasFn: testAlias,
  });
  assert.equal(http2.durableKey, "slot:100:2");
  assert.notEqual(http2.durableKey, httpAfterRestart.durableKey);
});

test("HTTP pagination never treats a matching alias as a slot boundary", () => {
  const http = helpers.createGroupBuyHttpState();
  http.initialized = true;
  http.seen = new Set(["id:boundary"]);
  http.aliases = new Set(["tx:shared"]);
  const progress = helpers.beginGroupBuyHttpProgress(http);
  helpers.applyGroupBuyHttpPage(progress, {
    trades: [
      { id: "distinct-slot", tx: "shared" },
      { id: "boundary", tx: "boundary" },
    ],
    pagination: { hasMore: true, nextCursor: "older" },
  }, identity, alias);
  assert.deepEqual(progress.fresh.map((trade) => trade.id), ["distinct-slot"]);
  assert.equal(progress.reachedSeen, true);
});

test("first HTTP walk keeps live activation buys and stops at one older boundary row", () => {
  const activatedAt = Date.parse("2026-07-28T12:00:00.000Z");
  const http = helpers.createGroupBuyHttpState(activatedAt);
  const progress = helpers.beginGroupBuyHttpProgress(http, 30_000);
  helpers.applyGroupBuyHttpPage(progress, {
    trades: [
      { id: "live", tx: "live", timestamp: "2026-07-28T11:59:50.000Z" },
      { id: "old-boundary", tx: "old", timestamp: "2026-07-28T11:59:20.000Z" },
      { id: "older-must-not-walk", tx: "older", timestamp: "2026-07-28T11:59:10.000Z" },
    ],
    pagination: { hasMore: true, nextCursor: "older-page" },
  }, identity, alias, (trade) => Date.parse(trade.timestamp));
  assert.equal(progress.complete, true);
  assert.equal(progress.activationCutoffAt, activatedAt - 30_000);
  assert.deepEqual(progress.fresh.map((trade) => trade.id), ["live", "old-boundary"]);
  const deliverable = progress.fresh.filter((trade) => Date.parse(trade.timestamp) >= progress.activationCutoffAt);
  assert.deepEqual(deliverable.map((trade) => trade.id), ["live"]);
  assert.equal(helpers.commitGroupBuyHttpProgress(http, progress, identity, alias, 100), true);
  assert.equal(http.seen.has("id:old-boundary"), true);
});

test("pagination resumes after page errors or budgets and never finalizes a cursor gap", () => {
  const http = helpers.createGroupBuyHttpState();
  http.initialized = true;
  http.seen = new Set(["id:boundary"]);
  http.aliases = new Set(["tx:boundary"]);

  const progress = helpers.beginGroupBuyHttpProgress(http);
  helpers.applyGroupBuyHttpPage(progress, {
    trades: [{ id: "newest", tx: "a" }, { id: "middle", tx: "b" }],
    pagination: { hasMore: true, nextCursor: "page-2" },
  }, identity, alias);
  assert.equal(progress.complete, false);
  assert.equal(progress.cursor, "page-2");
  assert.equal(helpers.commitGroupBuyHttpProgress(http, progress, identity, alias, 100), false);

  // Round-trip the compact state exactly as a process-persistence layer can. A failed page request
  // changes nothing, so the next call resumes at page-2 with the accumulated newest rows intact.
  const persisted = JSON.parse(JSON.stringify(helpers.serializeGroupBuyHttpState(http, 100)));
  const resumedState = helpers.hydrateGroupBuyHttpState(persisted, 100);
  const resumed = helpers.beginGroupBuyHttpProgress(resumedState);
  assert.equal(resumed.cursor, "page-2");
  assert.deepEqual(resumed.fresh.map((trade) => trade.id), ["newest", "middle"]);

  helpers.applyGroupBuyHttpPage(resumed, {
    trades: [{ id: "older", tx: "c" }, { id: "boundary", tx: "boundary" }],
    pagination: { hasMore: true, nextCursor: "must-not-follow" },
  }, identity, alias);
  assert.equal(resumed.complete, true);
  assert.equal(resumed.reachedSeen, true);
  assert.deepEqual(resumed.fresh.map((trade) => trade.id), ["newest", "middle", "older"]);
  assert.equal(helpers.commitGroupBuyHttpProgress(resumedState, resumed, identity, alias, 100), true);
  assert.equal(resumedState.resume, null);
  assert.deepEqual([...resumedState.seen].slice(0, 3), ["id:newest", "id:middle", "id:older"]);
});

test("healthz exposes buy-feed freshness, retry, and durable delivery backlog signals", () => {
  assert.match(serverSource, /buyBot:\s*groupBuyHealthSnapshot\(\)/);
  const health = functionBody("groupBuyHealthSnapshot");
  for (const field of [
    "cursorGaps",
    "retries",
    "lastSuccessAgoMs",
    "httpGateQueued",
    "httpGateCooldownRemainingMs",
    "deliveryPendingAlerts",
    "deliveryOldestPendingAgeMs",
    "deliveryBuysDelivered",
    "deliveryLastErrorAgoMs",
  ]) {
    assert.match(health, new RegExp(`\\b${field}\\b`), `${field} must remain observable`);
  }
});
