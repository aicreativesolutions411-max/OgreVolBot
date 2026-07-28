import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  createGroupBuyEventClaimRegistry,
  disableGroupBuyChatConfig,
  enqueueGroupBuyOutbox,
  groupBuyOutboxId,
  isPermanentTelegramChatError,
  isTransientTelegramError,
  markGroupBuyDelivered,
  migrateGroupBuyChatConfig,
  migrateGroupBuyDeliveryChat,
  normalizeGroupBuyDeliveryStore,
  pendingGroupBuyChats,
  telegramMigrateToChatId,
  terminateGroupBuyChatOutbox,
} from "../src/lib/groupBuyReliability.js";

const OLD_CHAT = "-5577068734";
const NEW_CHAT = "-1005577068734";
const OTHER_CHAT = "-100999";

function alert(chatId, eventKey, createdAt) {
  return {
    id: groupBuyOutboxId({ chatId, eventKey }),
    chatId,
    eventKey,
    caption: eventKey,
    createdAt,
  };
}

test("one destination event claim serializes pre-acceptance migration sends", async () => {
  let now = 1000;
  const claims = createGroupBuyEventClaimRegistry({
    successTtlMs: 30_000,
    nowFn: () => now,
  });
  const first = claims.begin(NEW_CHAT, "sol:MintA:slot:1:1");
  const redirected = claims.begin(NEW_CHAT, "sol:MintA:slot:1:1");
  assert.equal(first.owner, true);
  assert.equal(redirected.owner, false);
  assert.equal(claims.size(), 1);

  const acceptedMessage = { result: { message_id: 77, chat: { id: NEW_CHAT } }, error: null };
  first.settle(acceptedMessage);
  assert.equal(await redirected.promise, acceptedMessage);

  // The accepted claim bridges the small gap before its durable receipt is written.
  const immediateReplay = claims.begin(NEW_CHAT, "sol:MintA:slot:1:1");
  assert.equal(immediateReplay.owner, false);
  assert.equal(await immediateReplay.promise, acceptedMessage);
  now += 30_001;
  assert.equal(claims.begin(NEW_CHAT, "sol:MintA:slot:1:1").owner, true);

  // A failed request is released immediately so the durable row can retry.
  const failed = claims.begin(NEW_CHAT, "sol:MintA:slot:2:1");
  failed.settle({ result: null, error: new Error("temporary") });
  assert.equal(claims.begin(NEW_CHAT, "sol:MintA:slot:2:1").owner, true);
});

test("Telegram migration IDs are accepted only from structured response parameters", () => {
  assert.equal(telegramMigrateToChatId({
    providerData: { parameters: { migrate_to_chat_id: -1005577068734 } },
  }), NEW_CHAT);
  assert.equal(telegramMigrateToChatId({ parameters: { migrate_to_chat_id: NEW_CHAT } }), NEW_CHAT);
  assert.equal(telegramMigrateToChatId(new Error("group chat was upgraded to a supergroup chat")), "");
  assert.equal(telegramMigrateToChatId({ parameters: { migrate_to_chat_id: "not-a-chat" } }), "");
  const textOnly = new Error("Bad Request: group chat was upgraded to a supergroup chat");
  textOnly.status = 400;
  assert.equal(isPermanentTelegramChatError(textOnly), false);
  assert.equal(isTransientTelegramError(textOnly), true);
});

test("a basic-group migration preserves configuration at the new ID and archives the invalid old ID", () => {
  const customMedia = { type: "photo", value: "telegram-file-id" };
  const source = {
    groups: {
      [OLD_CHAT]: {
        title: "Original group",
        token: "MintA",
        features: { buybot: true, raid: true, rose: true, scan: true },
        customMedia,
        minBuySol: 0.25,
      },
      // A membership update may have created this default before the API reports migration.
      [NEW_CHAT]: {
        title: "New supergroup title",
        token: null,
        features: { buybot: false, raid: false, rose: false, scan: true },
        addedAt: "2026-07-28T00:00:00.000Z",
      },
    },
  };
  const migrated = migrateGroupBuyChatConfig(source, OLD_CHAT, NEW_CHAT, { now: 1234 });

  assert.equal(migrated.changed, true);
  assert.equal(migrated.store.groups[NEW_CHAT].title, "New supergroup title");
  assert.equal(migrated.store.groups[NEW_CHAT].token, "MintA");
  assert.equal(migrated.store.groups[NEW_CHAT].features.buybot, true);
  assert.equal(migrated.store.groups[NEW_CHAT].features.raid, true);
  assert.equal(migrated.store.groups[NEW_CHAT].customMedia, customMedia);
  assert.equal(migrated.store.groups[NEW_CHAT].minBuySol, 0.25);
  assert.equal(migrated.store.groups[NEW_CHAT].migratedFromChatId, OLD_CHAT);
  assert.equal(migrated.store.groups[OLD_CHAT].migratedToChatId, NEW_CHAT);
  assert.deepEqual(migrated.store.groups[OLD_CHAT].features, {
    buybot: false, raid: false, rose: false, scan: false,
  });
});

test("migration moves only the old chat outbox and retains durable IDs, FIFO timing, and pacing", () => {
  const first = alert(OLD_CHAT, "buy:1", 1000);
  const second = alert(OLD_CHAT, "buy:2", 1001);
  const unrelated = alert(OTHER_CHAT, "buy:3", 1002);
  let store = enqueueGroupBuyOutbox(null, first, 1000).store;
  store = enqueueGroupBuyOutbox(store, second, 1001).store;
  store = enqueueGroupBuyOutbox(store, unrelated, 1002).store;
  store.pacing[OLD_CHAT] = { sentAt: [100, 200] };
  store.pacing[NEW_CHAT] = { sentAt: [300] };

  const result = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT);
  assert.deepEqual(new Set(result.movedIds), new Set([first.id, second.id]));
  assert.equal(result.store.outbox[first.id].chatId, NEW_CHAT);
  assert.equal(result.store.outbox[second.id].chatId, NEW_CHAT);
  assert.equal(result.store.outbox[first.id].createdAt, 1000);
  assert.equal(result.store.outbox[unrelated.id].chatId, OTHER_CHAT);
  assert.deepEqual(result.store.pacing[NEW_CHAT].sentAt, [100, 200, 300]);
  assert.equal(result.store.pacing[OLD_CHAT], undefined);
  assert.deepEqual(new Set(pendingGroupBuyChats(result.store)), new Set([NEW_CHAT, OTHER_CHAT]));
});

test("migration keeps the source event ID and terminalizes an already-queued destination duplicate", () => {
  const eventKey = "sol:MintA:slot:100:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  const destination = alert(NEW_CHAT, eventKey, 1001);
  let store = enqueueGroupBuyOutbox(null, source, 1000).store;
  store = enqueueGroupBuyOutbox(store, destination, 1001).store;

  const result = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, { now: 2000 });
  assert.deepEqual(result.movedIds, [source.id]);
  assert.deepEqual(result.dedupedIds, [destination.id]);
  assert.equal(result.store.outbox[source.id].chatId, NEW_CHAT);
  assert.equal(result.store.outbox[destination.id], undefined);
  assert.equal(result.store.terminal[destination.id].eventKey, eventKey);
  assert.deepEqual(pendingGroupBuyChats(result.store), [NEW_CHAT]);
});

test("migration aliases survive restart and suppress replay under the new chat-derived ID", () => {
  const eventKey = "sol:MintA:slot:200:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  let store = enqueueGroupBuyOutbox(null, source, 1000).store;
  const migrated = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, { now: 1100 });
  const destination = alert(NEW_CHAT, eventKey, 1200);

  const pendingReplay = enqueueGroupBuyOutbox(migrated.store, destination, 1200);
  assert.equal(pendingReplay.inserted, false);
  assert.equal(pendingReplay.completed, false);
  assert.equal(pendingReplay.aliased, true);
  assert.equal(pendingReplay.canonicalId, source.id);

  store = markGroupBuyDelivered(pendingReplay.store, source.id, { now: 1300, messageId: 99 }).store;
  store = normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(store)));
  const deliveredReplay = enqueueGroupBuyOutbox(store, destination, 1400);
  assert.equal(deliveredReplay.inserted, false);
  assert.equal(deliveredReplay.completed, true);
  assert.equal(deliveredReplay.delivered, true);
  assert.equal(Object.keys(deliveredReplay.store.outbox).length, 0);
});

test("service migration persists redirects and aliases without moving an in-flight old queue", () => {
  const eventKey = "sol:MintA:slot:250:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  const destination = alert(NEW_CHAT, eventKey, 1100);
  let store = enqueueGroupBuyOutbox(null, source, 1000).store;

  const migrated = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, {
    now: 1050,
    moveOutbox: false,
  });
  assert.deepEqual(migrated.movedIds, []);
  assert.equal(migrated.store.outbox[source.id].chatId, OLD_CHAT);
  assert.equal(migrated.store.chatRedirects[OLD_CHAT], NEW_CHAT);

  store = normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(migrated.store)));
  const replay = enqueueGroupBuyOutbox(store, destination, 1200);
  assert.equal(replay.inserted, false);
  assert.equal(replay.aliased, true);
  assert.equal(replay.canonicalId, source.id);
  assert.equal(Object.keys(replay.store.outbox).length, 1);
});

test("service migration aliases already-delivered old receipts even with an empty outbox", () => {
  const eventKey = "sol:MintA:slot:275:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  const destination = alert(NEW_CHAT, eventKey, 1200);
  let store = enqueueGroupBuyOutbox(null, source, 1000).store;
  store = markGroupBuyDelivered(store, source.id, { now: 1100, messageId: 7 }).store;

  const migrated = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, {
    now: 1150,
    moveOutbox: false,
  });
  assert.deepEqual(migrated.movedIds, []);
  assert.equal(migrated.store.chatRedirects[OLD_CHAT], NEW_CHAT);

  store = normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(migrated.store)));
  const replay = enqueueGroupBuyOutbox(store, destination, 1300);
  assert.equal(replay.inserted, false);
  assert.equal(replay.completed, true);
  assert.equal(replay.delivered, true);
  assert.equal(replay.canonicalId, source.id);
});

test("a delivered destination receipt cancels the old pending copy during migration", () => {
  const eventKey = "sol:MintA:slot:300:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  const destination = alert(NEW_CHAT, eventKey, 1001);
  let store = enqueueGroupBuyOutbox(null, destination, 1001).store;
  store = markGroupBuyDelivered(store, destination.id, { now: 1100, messageId: 8 }).store;
  store = enqueueGroupBuyOutbox(store, source, 1150).store;

  const migrated = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, { now: 1200 });
  assert.equal(migrated.store.outbox[source.id], undefined);
  assert.deepEqual(migrated.completedIds, [{
    id: source.id,
    canonicalId: destination.id,
    delivered: true,
  }]);
  assert.equal(migrated.store.aliases[source.id], destination.id);

  const replay = enqueueGroupBuyOutbox(
    normalizeGroupBuyDeliveryStore(JSON.parse(JSON.stringify(migrated.store))),
    source,
    1300,
  );
  assert.equal(replay.inserted, false);
  assert.equal(replay.completed, true);
  assert.equal(replay.delivered, true);
});

test("an accepted destination send wins atomically over the old pending migration copy", () => {
  const eventKey = "sol:MintA:slot:325:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  const destination = alert(NEW_CHAT, eventKey, 1001);
  let store = enqueueGroupBuyOutbox(null, source, 1000).store;
  store = enqueueGroupBuyOutbox(store, destination, 1001).store;

  const migrated = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, {
    now: 1200,
    acceptedReceipts: {
      [destination.id]: { at: 1190, messageId: 88, chatId: NEW_CHAT },
    },
  });
  assert.deepEqual(migrated.acceptedIds, [destination.id]);
  assert.deepEqual(migrated.completedIds, [{
    id: source.id,
    canonicalId: destination.id,
    delivered: true,
  }]);
  assert.equal(migrated.store.outbox[source.id], undefined);
  assert.equal(migrated.store.outbox[destination.id], undefined);
  assert.equal(migrated.store.delivered[destination.id].messageId, "88");
  assert.equal(migrated.store.aliases[source.id], destination.id);
});

test("a destination acceptance arriving after migration checkpoints the aliased source", () => {
  const eventKey = "sol:MintA:slot:350:1";
  const source = alert(OLD_CHAT, eventKey, 1000);
  const destination = alert(NEW_CHAT, eventKey, 1001);
  let store = enqueueGroupBuyOutbox(null, source, 1000).store;
  store = enqueueGroupBuyOutbox(store, destination, 1001).store;

  const migrated = migrateGroupBuyDeliveryChat(store, OLD_CHAT, NEW_CHAT, { now: 1200 });
  assert.equal(migrated.store.aliases[destination.id], source.id);
  assert.ok(migrated.store.outbox[source.id]);
  assert.ok(migrated.store.terminal[destination.id]);

  const accepted = markGroupBuyDelivered(migrated.store, destination.id, {
    now: 1250,
    messageId: 89,
    chatId: NEW_CHAT,
  });
  assert.equal(accepted.id, source.id);
  assert.equal(accepted.store.outbox[source.id], undefined);
  assert.equal(accepted.store.terminal[destination.id], undefined);
  assert.equal(accepted.store.delivered[source.id].messageId, "89");
  assert.equal(accepted.store.delivered[source.id].chatId, NEW_CHAT);
});

test("chat-not-found or kicked cleanup disables only Buy Bot and never deletes group settings", () => {
  const source = {
    groups: {
      [NEW_CHAT]: {
        title: "Keep me",
        token: "MintA",
        features: { buybot: true, raid: true, rose: true, scan: true, kolfeed: true },
        raidQueue: [{ id: "raid-1" }],
        customText: "Still here",
      },
    },
  };
  const result = disableGroupBuyChatConfig(source, NEW_CHAT, {
    now: 5000,
    reason: "bot_kicked",
  });
  const entry = result.store.groups[NEW_CHAT];
  assert.equal(result.changed, true);
  assert.ok(entry, "the group entry is preserved");
  assert.equal(entry.features.buybot, false);
  assert.equal(entry.features.raid, true);
  assert.equal(entry.features.rose, true);
  assert.equal(entry.features.scan, true);
  assert.equal(entry.features.kolfeed, true);
  assert.equal(entry.token, "MintA");
  assert.deepEqual(entry.raidQueue, [{ id: "raid-1" }]);
  assert.equal(entry.customText, "Still here");
  assert.equal(entry.buyDeliveryDisabledReason, "bot_kicked");
  assert.equal(entry.buyDeliveryDisabledAt, 5000);
});

test("one permanent destination failure drains every queued item for only that chat", () => {
  const first = alert(NEW_CHAT, "buy:1", 1000);
  const second = alert(NEW_CHAT, "buy:2", 1001);
  const unrelated = alert(OTHER_CHAT, "buy:3", 1002);
  let store = enqueueGroupBuyOutbox(null, first, 1000).store;
  store = enqueueGroupBuyOutbox(store, second, 1001).store;
  store = enqueueGroupBuyOutbox(store, unrelated, 1002).store;
  const failure = new Error("Forbidden: bot was kicked from the supergroup chat");
  const result = terminateGroupBuyChatOutbox(store, NEW_CHAT, failure, { now: 2000 });

  assert.deepEqual(new Set(result.terminalIds), new Set([first.id, second.id]));
  assert.equal(result.store.outbox[first.id], undefined);
  assert.equal(result.store.outbox[second.id], undefined);
  assert.ok(result.store.terminal[first.id]);
  assert.ok(result.store.terminal[second.id]);
  assert.ok(result.store.outbox[unrelated.id]);
});

test("index redirects the in-flight alert before moving the remaining queue", () => {
  const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const request = source.slice(
    source.indexOf("async function telegramGroupBuyRequest"),
    source.indexOf("async function sendGroupAlertMedia"),
  );
  const drain = source.slice(
    source.indexOf("async function drainGroupBuyAlertQueue"),
    source.indexOf("function queueGroupBuyAlert"),
  );
  const update = source.slice(
    source.indexOf("async function handleUpdate"),
    source.indexOf("// Bot added/removed from a chat"),
  );
  const membership = source.slice(
    source.indexOf("async function handleBotChatMembershipUpdate"),
    source.indexOf("async function handleChatMemberUpdate"),
  );
  const queue = source.slice(
    source.indexOf("function queueGroupBuyAlert"),
    source.indexOf("// Per-group buy/raid media override"),
  );
  const migrate = source.slice(
    source.indexOf("async function migrateGroupBuyTelegramChat"),
    source.indexOf("async function moveGroupBuyTelegramOutbox"),
  );
  assert.match(request, /telegramMigrateToChatId\(error\)/);
  assert.match(request, /groupBuyTelegramRedirectFor\(body\?\.chat_id\)/);
  const redirectedSend = request.indexOf("response = await send({ ...body, chat_id: toChatId })");
  assert.notEqual(redirectedSend, -1);
  assert.ok(
    request.indexOf(
      "await migrateGroupBuyTelegramChat(fromChatId, toChatId, { moveOutbox: true })",
      redirectedSend,
    ) > redirectedSend,
  );
  assert.match(drain, /terminateGroupBuyTelegramChat\(disabledChatId/);
  assert.match(drain, /disableGroupBuyBotForUnreachableChat\(disabledChatId/);
  assert.match(drain, /sendClaimedGroupBuyEvent\(chatId, item\.eventKey/);
  assert.match(source, /for \(const duplicateId of delivery\.dedupedIds \|\| \[\]\)/);
  assert.match(source, /migrate_from_chat_id/);
  assert.match(source, /disableGroupBuyBotForUnreachableChat\(chat\.id/);
  assert.match(source, /terminateGroupBuyTelegramChat\(chat\.id/);
  assert.match(update, /moveOutbox: false/);
  assert.match(update, /scheduleGroupBuyAlertDrain\(migrationFrom, 0\)/);
  assert.doesNotMatch(update, /scheduleGroupBuyAlertDrain\(migrationTo, 0\)/);
  assert.ok(
    membership.indexOf("invalidateGroupBuyTelegramTarget(chat.id)")
      < membership.indexOf("await "),
    "membership removal invalidates stale producers before its first await",
  );
  assert.match(queue, /groupBuyTelegramTargetGeneration\(key\)\s*!==\s*targetGeneration/);
  assert.match(source, /rememberGroupBuyTelegramChatRedirect\(fromChatId, toChatId\)/);
  assert.match(source, /moveGroupBuyTelegramOutbox\(fromKey, toKey, \{ moveOutbox \}\)/);
  assert.doesNotMatch(migrate, /invalidateGroupBuyTelegramTarget/);
  assert.match(request, /acceptedEquivalentGroupBuyReceipt\(deliveryId, toChatId\)/);
  assert.match(request, /beginGroupBuyTelegramEventClaim\(toChatId, deliveryEventKey\)/);
  assert.ok(
    request.indexOf("beginGroupBuyTelegramEventClaim(toChatId, deliveryEventKey)")
      < request.indexOf("response = await send({ ...body, chat_id: toChatId })"),
  );
  assert.match(drain, /deliveryId: item\.id/);
  assert.match(drain, /deliveryEventKey: item\.eventKey/);
});
