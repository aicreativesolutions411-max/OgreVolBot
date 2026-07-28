import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  dueGroupBuyOutboxItem,
  enqueueGroupBuyOutbox,
  enqueueRhGroupBuyBatch,
  groupBuyDrainRescheduleDelayMs,
  groupBuyOutboxId,
  groupBuyPacingDelayMs,
  isPermanentTelegramPayloadError,
  markGroupBuyDelivered,
  markGroupBuyFailed,
  normalizeGroupBuyDeliveryStore,
  refreshRhGroupBuyPools,
  rhGroupBuyPoolCursor,
  rhGroupBuyPools,
  shouldRetryGroupBuyMedia,
} from "../src/lib/groupBuyReliability.js";

const CHAT = "-100123";
const TOKEN = "0x1111111111111111111111111111111111111111";
const POOL_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const POOL_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const POOL_C = "0xcccccccccccccccccccccccccccccccccccccccc";

function alertItem(eventKey, createdAt = 1_000) {
  return {
    id: groupBuyOutboxId({ chatId: CHAT, eventKey }),
    chatId: CHAT,
    eventKey,
    caption: eventKey,
    markup: null,
    media: null,
    options: {},
    createdAt,
  };
}

test("restart preserves the RH cursor and replays a durable alert exactly once", () => {
  let state = normalizeGroupBuyDeliveryStore(null);
  state = refreshRhGroupBuyPools(state, TOKEN, [POOL_A], { now: 1_000, baselineBlock: 100 }).store;
  const item = alertItem(`rh:${TOKEN}:${POOL_A}:0xtx:7`, 1_100);
  state = enqueueRhGroupBuyBatch(state, { token: TOKEN, pool: POOL_A, toBlock: 108, items: [item], now: 1_100 }).store;

  const restarted = normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(state)));
  assert.equal(rhGroupBuyPoolCursor(restarted, TOKEN, POOL_A), 108);
  assert.equal(dueGroupBuyOutboxItem(restarted, CHAT, 1_100)?.id, item.id);

  const delivered = markGroupBuyDelivered(restarted, item.id, { now: 1_200, messageId: 77 }).store;
  const replay = enqueueGroupBuyOutbox(delivered, item, 1_300);
  assert.equal(replay.inserted, false);
  assert.equal(replay.completed, true);
  assert.equal(Object.keys(replay.store.outbox).length, 0);
  assert.equal(replay.store.delivered[item.id].messageId, "77");
});

test("the shared delivery store preserves Solana cursor snapshots across outbox writes", () => {
  const snapshot = {
    http: {
      initialized: true,
      seen: ["slot:123"],
      aliases: ["tx:abc"],
      resume: { cursor: "older-page", fresh: [{ slotIndexId: "slot:124" }] },
    },
    handoff: { seen: ["slot:122"], aliases: ["tx:def"] },
  };
  let state = normalizeGroupBuyDeliveryStore({
    sol: { tokens: { MintA: snapshot } },
  });
  state = enqueueGroupBuyOutbox(state, alertItem("sol:MintA:slot:124"), 2_000).store;
  const restarted = normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restarted.sol.tokens.MintA, snapshot);
});

test("transient Retry-After and network failures remain durable and strict FIFO", () => {
  const first = alertItem("first", 1_000);
  const second = alertItem("second", 1_001);
  let state = enqueueGroupBuyOutbox(null, first, 1_000).store;
  state = enqueueGroupBuyOutbox(state, second, 1_001).store;
  state = markGroupBuyFailed(state, first.id, {
    message: "Too Many Requests",
    providerData: { parameters: { retry_after: 30 } },
  }, { now: 2_000 }).store;

  assert.equal(state.outbox[first.id].nextAttemptAt, 32_000);
  assert.equal(dueGroupBuyOutboxItem(state, CHAT, 2_001), null, "a newer due item cannot leapfrog the oldest retry");
  assert.equal(dueGroupBuyOutboxItem(state, CHAT, 32_000)?.id, first.id);

  state = markGroupBuyFailed(state, first.id, new Error("read ECONNRESET socket hang up"), { now: 32_000 }).store;
  assert.ok(state.outbox[first.id].nextAttemptAt > 32_000);
  assert.equal(Object.keys(state.outbox).length, 2);
});

test("permanent payload failures terminate without blocking the chat", () => {
  const item = alertItem("bad-payload");
  let state = enqueueGroupBuyOutbox(null, item, 1_000).store;
  const error = new Error("Bad Request: can't parse entities");
  assert.equal(isPermanentTelegramPayloadError(error), true);
  const failed = markGroupBuyFailed(state, item.id, error, { now: 2_000 });
  state = failed.store;
  assert.equal(failed.terminal, true);
  assert.equal(state.outbox[item.id], undefined);
  assert.ok(state.terminal[item.id]);
});

test("pacing enforces both one per second and twenty per rolling minute", () => {
  let state = normalizeGroupBuyDeliveryStore(null);
  for (let i = 0; i < 19; i += 1) {
    const at = 1_000 + i * 1_000;
    const item = alertItem(`pace-${i}`, at);
    state = enqueueGroupBuyOutbox(state, item, at).store;
    state = markGroupBuyDelivered(state, item.id, { now: at, messageId: i + 1 }).store;
  }
  assert.equal(groupBuyPacingDelayMs(state, CHAT, 19_500), 500, "the one-second floor applies first");
  const twentieth = alertItem("pace-19", 20_000);
  state = enqueueGroupBuyOutbox(state, twentieth, 20_000).store;
  state = markGroupBuyDelivered(state, twentieth.id, { now: 20_000, messageId: 20 }).store;
  assert.equal(groupBuyPacingDelayMs(state, CHAT, 21_000), 40_000, "the 20/minute rolling window retains overflow");
  assert.equal(groupBuyPacingDelayMs(state, CHAT, 61_000), 0);
});

test("an enqueue racing a drain exit always leaves a wake-up behind", () => {
  assert.equal(groupBuyDrainRescheduleDelayMs({
    pending: true,
    hasTimer: false,
    running: false,
  }), 0, "a pending item with a consumed timer is rescheduled immediately as the drain exits");
  assert.equal(groupBuyDrainRescheduleDelayMs({
    pending: true,
    hasTimer: true,
    running: false,
  }), null, "an existing wake-up is retained without duplicating it");
  assert.equal(groupBuyDrainRescheduleDelayMs({
    pending: true,
    hasTimer: false,
    running: true,
  }), null, "the active drain owns delivery until it exits");
  assert.equal(groupBuyDrainRescheduleDelayMs({
    pending: true,
    hasTimer: false,
    running: false,
    exceptionalExit: true,
    retryMs: 1_500,
  }), 1_500, "a failed receipt write backs off instead of immediately resending");
  assert.equal(groupBuyDrainRescheduleDelayMs({
    pending: false,
    hasTimer: false,
    running: false,
    stateUnknown: true,
    retryMs: 1_500,
  }), 1_500, "a failed final store read cannot consume the only wake-up");
});

test("automatic art falls back to text while custom media retries transiently", () => {
  const network = new Error("getaddrinfo EAI_AGAIN api.telegram.org");
  assert.equal(shouldRetryGroupBuyMedia({ type: "photo", value: "https://img", sticky: false }, network), false);
  assert.equal(shouldRetryGroupBuyMedia({ type: "photo", value: "file-id", sticky: true }, network), true);
  assert.equal(shouldRetryGroupBuyMedia({ type: "photo", value: "bad", sticky: true }, new Error("Bad Request: wrong file identifier")), false);
});

test("multiple RH pools keep independent cursors and migration grace across restart", () => {
  let state = refreshRhGroupBuyPools(null, TOKEN, [POOL_A, POOL_B], { now: 1_000, baselineBlock: 100 }).store;
  state = enqueueRhGroupBuyBatch(state, { token: TOKEN, pool: POOL_A, toBlock: 110, now: 2_000 }).store;
  state = enqueueRhGroupBuyBatch(state, { token: TOKEN, pool: POOL_B, toBlock: 120, now: 2_000 }).store;
  state = normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(state)));
  assert.equal(rhGroupBuyPoolCursor(state, TOKEN, POOL_A), 110);
  assert.equal(rhGroupBuyPoolCursor(state, TOKEN, POOL_B), 120);

  state = refreshRhGroupBuyPools(state, TOKEN, [POOL_A, POOL_C], { now: 3_000, baselineBlock: 130, graceMs: 10_000 }).store;
  assert.deepEqual(rhGroupBuyPools(state, TOKEN, 3_001).map((row) => row.pool), [POOL_A, POOL_B, POOL_C]);
  assert.equal(rhGroupBuyPoolCursor(state, TOKEN, POOL_C), 130, "a newly discovered pool starts at its bounded discovery baseline");
  assert.deepEqual(rhGroupBuyPools(state, TOKEN, 13_001).map((row) => row.pool), [POOL_A, POOL_C]);
});

test("index integration durably queues before RH cursor advancement and globally orders pool logs", () => {
  const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const postRh = source.slice(source.indexOf("async function postGroupBuyRh"), source.indexOf("async function drainRhGroupBuyDeliveryQueue"));
  const pollRh = source.slice(source.indexOf("async function pollRhGroupBuyAddress"), source.indexOf("async function rhGroupBuyTick"));
  assert.match(postRh, /await Promise\.all\(durableWrites\)/);
  assert.match(pollRh, /Promise\.all\(pools\.map/);
  assert.match(pollRh, /Number\(a\.buy\.block\) - Number\(b\.buy\.block\)/);
  assert.ok(pollRh.indexOf("await queueRhGroupBuyDelivery") < pollRh.indexOf("enqueueRhGroupBuyBatch"));
  assert.match(source, /telegramApiHostGate\.schedule/);
  assert.match(source, /telegramApiHostGate\.cooldown/);
  assert.match(source, /telegramApiFetchJson\(`https:\/\/api\.telegram\.org\/bot/);
  assert.doesNotMatch(source, /(?<!telegramApi)fetchJson\(`https:\/\/api\.telegram\.org\/bot/);
  assert.match(source, /drainGroupBuyAlertQueue\(key\)\.catch/);
  assert.match(source, /groupBuyAcceptedDeliveryReceipts\.set\(item\.id/);
  assert.ok(source.indexOf("groupBuyAcceptedDeliveryReceipts.set(item.id") < source.indexOf("markGroupBuyDelivered(latest, item.id"));
  assert.match(source, /groupBuyDrainRescheduleDelayMs\(\{/);
  assert.match(source, /restoreGroupBuyReliabilityState/);
  assert.match(source, /await persistGroupBuySolState\(mint\)/);
  assert.match(source, /const RH_GROUP_BUY_INITIAL_LOOKBACK_BLOCKS = 4_000/);
  assert.match(source, /currentBlock - RH_GROUP_BUY_INITIAL_LOOKBACK_BLOCKS/);
});
