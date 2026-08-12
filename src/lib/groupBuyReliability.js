import crypto from "node:crypto";

export const GROUP_BUY_CHAT_MIN_INTERVAL_MS = 1_000;
export const GROUP_BUY_CHAT_WINDOW_MS = 60_000;
export const GROUP_BUY_CHAT_WINDOW_LIMIT = 20;
export const GROUP_BUY_RETRY_MAX_MS = 5 * 60_000;
export const GROUP_BUY_RH_POOL_GRACE_MS = 10 * 60_000;

function objectRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function finiteInteger(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

export function normalizeGroupBuyDeliveryStore(value) {
  const source = objectRecord(value);
  const rh = objectRecord(source.rh);
  return {
    version: 1,
    outbox: objectRecord(source.outbox),
    delivered: objectRecord(source.delivered),
    terminal: objectRecord(source.terminal),
    aliases: objectRecord(source.aliases),
    chatRedirects: objectRecord(source.chatRedirects),
    pacing: objectRecord(source.pacing),
    sol: objectRecord(source.sol),
    rh: { tokens: objectRecord(rh.tokens) },
  };
}

export function groupBuyOutboxId({ chatId, eventKey = "", unique = "" } = {}) {
  const stableEvent = String(eventKey || unique || crypto.randomUUID()).trim();
  return crypto.createHash("sha256")
    .update(`${String(chatId)}:${stableEvent}`)
    .digest("hex");
}

export function createGroupBuyEventClaimRegistry({
  successTtlMs = 30_000,
  nowFn = () => Date.now(),
} = {}) {
  const entries = new Map();
  const ttlMs = Math.max(1_000, finiteInteger(successTtlMs, 30_000));
  const keyFor = (chatId, eventKey) => {
    const chat = String(chatId ?? "").trim();
    const event = String(eventKey || "").trim();
    return chat && event ? `${chat}:${event}` : "";
  };
  const begin = (chatId, eventKey) => {
    const key = keyFor(chatId, eventKey);
    if (!key) return { key: "", owner: true, promise: null, settle: () => {} };
    const now = Number(nowFn()) || Date.now();
    for (const [claimKey, entry] of entries) {
      if (entry.settled && Number(entry.expiresAt) <= now) entries.delete(claimKey);
    }
    const existing = entries.get(key);
    if (existing) return { key, owner: false, promise: existing.promise, settle: () => {} };
    let resolveClaim;
    const promise = new Promise((resolve) => { resolveClaim = resolve; });
    const entry = { promise, settled: false, expiresAt: 0 };
    const settle = (sent) => {
      if (entry.settled) return;
      entry.settled = true;
      entry.expiresAt = (Number(nowFn()) || Date.now()) + (sent?.result ? ttlMs : 0);
      resolveClaim(sent);
      if (!sent?.result && entries.get(key) === entry) entries.delete(key);
    };
    entries.set(key, entry);
    return { key, owner: true, promise, settle };
  };
  return {
    begin,
    size: () => entries.size,
  };
}

export function groupBuyCanonicalDeliveryId(storeValue, id) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  let canonicalId = String(id || "");
  const visited = new Set();
  while (store.aliases[canonicalId] && !visited.has(canonicalId)) {
    visited.add(canonicalId);
    canonicalId = String(store.aliases[canonicalId]);
  }
  return canonicalId;
}

export function enqueueGroupBuyOutbox(storeValue, item = {}, now = Date.now()) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const chatId = String(item.chatId ?? item.chat_id ?? "").trim();
  if (!chatId) throw new Error("A Telegram chat is required for a Buy Bot delivery.");
  const id = String(item.id || groupBuyOutboxId({ chatId, eventKey: item.eventKey })).trim();
  let canonicalId = groupBuyCanonicalDeliveryId(store, id);
  const delivered = Boolean(store.delivered[canonicalId]);
  const terminal = Boolean(store.terminal[canonicalId]);
  if (delivered || terminal) {
    return {
      store, id, canonicalId, aliased: canonicalId !== id,
      inserted: false, completed: true, delivered, terminal,
    };
  }
  if (store.outbox[canonicalId]) {
    return {
      store, id, canonicalId, aliased: canonicalId !== id,
      inserted: false, completed: false, delivered: false, terminal: false,
    };
  }
  // A stale alias whose canonical receipt has aged out must not suppress an unrelated future retry.
  if (canonicalId !== id) {
    delete store.aliases[id];
    canonicalId = id;
  }
  store.outbox[id] = {
    ...item,
    id,
    chatId,
    eventKey: String(item.eventKey || ""),
    attempts: finiteInteger(item.attempts),
    createdAt: finiteInteger(item.createdAt, finiteInteger(now)),
    nextAttemptAt: finiteInteger(item.nextAttemptAt),
    lastError: String(item.lastError || "").slice(0, 500),
  };
  return {
    store, id, canonicalId: id, aliased: false,
    inserted: true, completed: false, delivered: false, terminal: false,
  };
}

export function telegramRetryAfterMs(error) {
  const structured = Number(
    error?.retryAfter
    ?? error?.providerData?.parameters?.retry_after
    ?? error?.parameters?.retry_after
  );
  if (Number.isFinite(structured) && structured > 0) return Math.ceil(structured * 1_000);
  const message = String(error?.message || error || "");
  const match = message.match(/retry after\s+(\d+)/i);
  return match ? Math.max(1_000, Number(match[1]) * 1_000) : 0;
}

export function telegramMigrateToChatId(value) {
  const candidate = value?.providerData?.parameters?.migrate_to_chat_id
    ?? value?.parameters?.migrate_to_chat_id
    ?? value?.migrate_to_chat_id;
  const chatId = String(candidate ?? "").trim();
  return /^-?[1-9]\d*$/.test(chatId) ? chatId : "";
}

export function isPermanentTelegramChatError(error) {
  const message = String(error?.providerData?.description || error?.message || error || "");
  return /(?:bot was blocked by the user|bot is not a member|bot was kicked|chat not found|user is deactivated|group chat was deactivated|have no rights to send|not enough rights to send|forbidden:\s*bot|PEER_ID_INVALID)/i.test(message);
}

export function isPermanentTelegramPayloadError(error) {
  const message = String(error?.providerData?.description || error?.message || error || "");
  if (/(?:can't parse entities|entity.*(?:invalid|offset)|BUTTON_(?:URL|DATA)_INVALID|reply markup is too long|message text is empty|message is too long|caption is too long|wrong file identifier|wrong type of the web page content|failed to get HTTP URL content|there is no photo in the request|media_empty|message thread not found)/i.test(message)) return true;
  const status = Number(error?.providerData?.error_code ?? error?.status);
  return status === 400 && !isTransientTelegramError(error);
}

export function isTransientTelegramError(error) {
  if (telegramRetryAfterMs(error) > 0) return true;
  const message = String(error?.providerData?.description || error?.message || error || "");
  return /(?:429|too many requests|rate.?limit|timeout|timed out|temporar|fetch failed|network|socket|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|502|503|504|group chat was upgraded to a supergroup chat)/i.test(message);
}

export function groupBuyRetryDelayMs(error, attempts = 1) {
  const retryAfter = telegramRetryAfterMs(error);
  const exponent = Math.max(0, Math.min(12, finiteInteger(attempts, 1) - 1));
  const exponential = Math.min(GROUP_BUY_RETRY_MAX_MS, 1_500 * (2 ** exponent));
  return Math.max(retryAfter, exponential);
}

export function shouldRetryGroupBuyMedia(media, error) {
  return Boolean(media?.sticky && isTransientTelegramError(error) && !isPermanentTelegramChatError(error));
}

function pacingRows(store, chatId, now) {
  const pace = objectRecord(store.pacing[String(chatId)]);
  return (Array.isArray(pace.sentAt) ? pace.sentAt : [])
    .map(Number)
    .filter((at) => Number.isFinite(at) && at > now - GROUP_BUY_CHAT_WINDOW_MS)
    .sort((a, b) => a - b);
}

export function groupBuyPacingDelayMs(storeValue, chatId, now = Date.now()) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const sentAt = pacingRows(store, chatId, now);
  let readyAt = now;
  if (sentAt.length) readyAt = Math.max(readyAt, sentAt[sentAt.length - 1] + GROUP_BUY_CHAT_MIN_INTERVAL_MS);
  if (sentAt.length >= GROUP_BUY_CHAT_WINDOW_LIMIT) {
    readyAt = Math.max(readyAt, sentAt[sentAt.length - GROUP_BUY_CHAT_WINDOW_LIMIT] + GROUP_BUY_CHAT_WINDOW_MS);
  }
  return Math.max(0, Math.ceil(readyAt - now));
}

export function groupBuyDrainRescheduleDelayMs({
  pending = false,
  hasTimer = false,
  running = false,
  exceptionalExit = false,
  stateUnknown = false,
  retryMs = 1_500,
} = {}) {
  if (hasTimer || running) return null;
  if (stateUnknown) return Math.max(25, finiteInteger(retryMs, 1_500));
  if (!pending) return null;
  return exceptionalExit ? Math.max(25, finiteInteger(retryMs, 1_500)) : 0;
}

export function dueGroupBuyOutboxItem(storeValue, chatId, now = Date.now()) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const oldest = Object.values(store.outbox)
    .filter((item) => String(item?.chatId) === String(chatId))
    .sort((a, b) => finiteInteger(a.createdAt) - finiteInteger(b.createdAt) || String(a.id).localeCompare(String(b.id)))[0] || null;
  return oldest && finiteInteger(oldest.nextAttemptAt) <= now ? oldest : null;
}

export function nextGroupBuyOutboxAt(storeValue, chatId) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const rows = Object.values(store.outbox)
    .filter((item) => String(item?.chatId) === String(chatId))
    .sort((a, b) => finiteInteger(a.createdAt) - finiteInteger(b.createdAt)
      || String(a.id).localeCompare(String(b.id)));
  if (!rows.length) return null;
  return finiteInteger(rows[0].nextAttemptAt);
}

export function pendingGroupBuyChats(storeValue) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  return [...new Set(Object.values(store.outbox).map((item) => String(item?.chatId || "")).filter(Boolean))];
}

function pruneReceiptMap(receipts, now, maxRows = 20_000) {
  const rows = Object.entries(objectRecord(receipts))
    .filter(([, row]) => now - finiteInteger(row?.at) <= 7 * 86_400_000)
    .sort((a, b) => finiteInteger(b[1]?.at) - finiteInteger(a[1]?.at))
    .slice(0, maxRows);
  return Object.fromEntries(rows);
}

function pruneAliasMap(store) {
  for (const [aliasId, targetIdValue] of Object.entries(objectRecord(store.aliases))) {
    const targetId = String(targetIdValue || "");
    if (!targetId || (!store.outbox[targetId] && !store.delivered[targetId] && !store.terminal[targetId])) {
      delete store.aliases[aliasId];
    }
  }
  return store;
}

function groupBotStoreCopy(value) {
  const source = objectRecord(value);
  return { ...source, groups: { ...objectRecord(source.groups) } };
}

// A dead Telegram destination must stop receiving Buy Bot fanout, but the group's token, custom art,
// raid/moderation settings and history remain intact so an admin can re-add the bot and turn buys back on.
export function disableGroupBuyChatConfig(storeValue, chatId, {
  now = Date.now(), reason = "telegram_unreachable",
} = {}) {
  const store = groupBotStoreCopy(storeValue);
  const key = String(chatId ?? "").trim();
  const current = objectRecord(store.groups[key]);
  if (!key || !Object.keys(current).length) return { store, changed: false, entry: null };
  const entry = {
    ...current,
    features: { ...objectRecord(current.features), buybot: false },
    buyDeliveryDisabledAt: finiteInteger(now),
    buyDeliveryDisabledReason: String(reason || "telegram_unreachable").slice(0, 80),
  };
  store.groups[key] = entry;
  return { store, changed: Boolean(current.features?.buybot), entry };
}

// Telegram's structured migrate_to_chat_id is authoritative. Preserve an archived copy under the old
// invalid ID, move every configured module to the new supergroup, and avoid overwriting a genuinely
// configured destination with a just-created default entry.
export function migrateGroupBuyChatConfig(storeValue, fromChatId, toChatId, { now = Date.now() } = {}) {
  const store = groupBotStoreCopy(storeValue);
  const fromKey = String(fromChatId ?? "").trim();
  const toKey = String(toChatId ?? "").trim();
  if (!fromKey || !toKey || fromKey === toKey) return { store, changed: false, fromEntry: null, toEntry: null };
  const fromEntry = objectRecord(store.groups[fromKey]);
  if (!Object.keys(fromEntry).length) return { store, changed: false, fromEntry: null, toEntry: objectRecord(store.groups[toKey]) };
  const existing = objectRecord(store.groups[toKey]);
  const fromFeatures = objectRecord(fromEntry.features);
  const existingFeatures = objectRecord(existing.features);
  const existingIsConfigured = Boolean(existing.token)
    || Object.keys(existing).some((key) => !["addedAt", "features", "title", "token"].includes(key));
  const features = existingIsConfigured
    ? { ...fromFeatures, ...existingFeatures }
    : { ...existingFeatures, ...fromFeatures };
  const target = {
    ...fromEntry,
    ...existing,
    title: String(existing.title || fromEntry.title || "").slice(0, 80),
    token: existing.token || fromEntry.token || null,
    features,
    migratedFromChatId: fromKey,
    migratedAt: finiteInteger(now),
  };
  delete target.buyDeliveryDisabledAt;
  delete target.buyDeliveryDisabledReason;
  delete target.migratedToChatId;
  const archivedFeatureKeys = new Set([...Object.keys(fromFeatures), "buybot"]);
  const archivedFeatures = Object.fromEntries([...archivedFeatureKeys].map((key) => [key, false]));
  store.groups[fromKey] = {
    ...fromEntry,
    features: archivedFeatures,
    migratedToChatId: toKey,
    migratedAt: finiteInteger(now),
  };
  store.groups[toKey] = target;
  return { store, changed: true, fromEntry: store.groups[fromKey], toEntry: target };
}

// Keep durable IDs stable while moving queued payloads. Waiters and accepted-send receipts are keyed by
// those IDs, so re-hashing here could orphan a caller or resend a Telegram-accepted message.
export function migrateGroupBuyDeliveryChat(storeValue, fromChatId, toChatId, {
  now = Date.now(),
  moveOutbox = true,
  acceptedReceipts = {},
} = {}) {
  let store = normalizeGroupBuyDeliveryStore(storeValue);
  const fromKey = String(fromChatId ?? "").trim();
  const toKey = String(toChatId ?? "").trim();
  if (!fromKey || !toKey || fromKey === toKey) {
    return { store, movedIds: [], dedupedIds: [], completedIds: [], acceptedIds: [] };
  }
  const movedIds = [];
  const dedupedIds = [];
  const completedIds = [];
  const acceptedIds = [];
  const accepted = objectRecord(acceptedReceipts);
  store.chatRedirects[fromKey] = toKey;
  for (const [chatId, destination] of Object.entries(store.chatRedirects)) {
    if (String(destination) === fromKey) store.chatRedirects[chatId] = toKey;
  }
  while (Object.keys(store.chatRedirects).length > 1_000) {
    delete store.chatRedirects[Object.keys(store.chatRedirects)[0]];
  }
  const destinationEvents = new Map(
    Object.entries(store.outbox)
      .filter(([, item]) => String(item?.chatId) === toKey && String(item?.eventKey || ""))
      .map(([id, item]) => [String(item.eventKey), id]),
  );
  const destinationReceipts = new Map();
  // A delivered receipt is stronger than an older terminal marker for the same event.
  for (const [kind, receipts] of [["terminal", store.terminal], ["delivered", store.delivered]]) {
    for (const [id, receiptValue] of Object.entries(receipts)) {
      const receipt = objectRecord(receiptValue);
      const eventKey = String(receipt.eventKey || "");
      if (String(receipt.chatId) !== toKey || !eventKey) continue;
      destinationReceipts.set(eventKey, { id, kind });
    }
  }
  for (const [id, itemValue] of Object.entries(store.outbox)) {
    const item = objectRecord(itemValue);
    if (String(item.chatId) !== fromKey) continue;
    const eventKey = String(item.eventKey || "");
    const completedDestination = eventKey ? destinationReceipts.get(eventKey) : null;
    const completedCanonicalId = completedDestination
      ? groupBuyCanonicalDeliveryId(store, completedDestination.id)
      : "";
    const destinationDelivered = Boolean(store.delivered[completedCanonicalId]);
    const destinationTerminal = Boolean(store.terminal[completedCanonicalId]);
    if (
      completedCanonicalId
      && completedCanonicalId !== id
      && (destinationDelivered || destinationTerminal)
    ) {
      // The event already reached (or permanently completed at) the new supergroup. The old pending
      // row must never send a second copy after migration. Alias its durable ID to the completed
      // destination receipt so replay remains suppressed across process restarts.
      delete store.outbox[id];
      store.aliases[id] = completedCanonicalId;
      const destinationId = groupBuyOutboxId({ chatId: toKey, eventKey });
      if (destinationId !== completedCanonicalId) store.aliases[destinationId] = completedCanonicalId;
      completedIds.push({ id, canonicalId: completedCanonicalId, delivered: destinationDelivered });
      continue;
    }
    const duplicateId = eventKey ? destinationEvents.get(eventKey) : "";
    if (duplicateId && duplicateId !== id && store.outbox[duplicateId]) {
      const acceptedReceipt = objectRecord(accepted[duplicateId]);
      if (Object.keys(acceptedReceipt).length) {
        // Telegram accepted the destination row before its receipt could acquire the delivery-file
        // lock. Commit that real send atomically and cancel the old source copy instead of converting
        // the accepted destination into a terminal duplicate.
        const marked = markGroupBuyDelivered(store, duplicateId, {
          now: finiteInteger(acceptedReceipt.at, finiteInteger(now)),
          messageId: acceptedReceipt.messageId,
          chatId: String(acceptedReceipt.chatId || toKey),
        });
        store = marked.store;
        delete store.outbox[id];
        store.aliases[id] = duplicateId;
        const destinationId = groupBuyOutboxId({ chatId: toKey, eventKey });
        if (destinationId !== duplicateId) store.aliases[destinationId] = duplicateId;
        completedIds.push({ id, canonicalId: duplicateId, delivered: true });
        acceptedIds.push(duplicateId);
        destinationEvents.set(eventKey, duplicateId);
        continue;
      }
      // The source item is the older/canonical queue entry and may be the in-flight message that just
      // triggered Telegram's migration response. Keep its stable ID and terminalize the destination
      // duplicate so restart replay can never post the same buy twice.
      delete store.outbox[duplicateId];
      store.terminal[duplicateId] = {
        at: finiteInteger(now),
        chatId: toKey,
        eventKey,
        error: `Deduplicated during Telegram migration to ${toKey}`,
      };
      dedupedIds.push(duplicateId);
    }
    if (moveOutbox) {
      store.outbox[id] = { ...item, id: String(item.id || id), chatId: toKey };
      movedIds.push(id);
    }
    if (eventKey) {
      const destinationId = groupBuyOutboxId({ chatId: toKey, eventKey });
      if (destinationId !== id) store.aliases[destinationId] = id;
    }
    if (eventKey) destinationEvents.set(eventKey, id);
  }
  for (const receipts of [store.delivered, store.terminal]) {
    for (const [id, receiptValue] of Object.entries(receipts)) {
      const receipt = objectRecord(receiptValue);
      const eventKey = String(receipt.eventKey || "");
      if (String(receipt.chatId) !== fromKey || !eventKey) continue;
      const destinationId = groupBuyOutboxId({ chatId: toKey, eventKey });
      if (destinationId !== id) store.aliases[destinationId] = id;
    }
  }
  if (moveOutbox) {
    const sentAt = [
      ...(Array.isArray(store.pacing[fromKey]?.sentAt) ? store.pacing[fromKey].sentAt : []),
      ...(Array.isArray(store.pacing[toKey]?.sentAt) ? store.pacing[toKey].sentAt : []),
    ].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (sentAt.length) store.pacing[toKey] = { sentAt: sentAt.slice(-GROUP_BUY_CHAT_WINDOW_LIMIT) };
    delete store.pacing[fromKey];
  }
  store.terminal = pruneReceiptMap(store.terminal, now, 5_000);
  return { store: pruneAliasMap(store), movedIds, dedupedIds, completedIds, acceptedIds };
}

export function terminateGroupBuyChatOutbox(storeValue, chatId, error, { now = Date.now() } = {}) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const key = String(chatId ?? "").trim();
  const message = String(error?.providerData?.description || error?.message || error || "Telegram destination is unavailable").slice(0, 500);
  const terminalIds = [];
  for (const [id, itemValue] of Object.entries(store.outbox)) {
    const item = objectRecord(itemValue);
    if (String(item.chatId) !== key) continue;
    delete store.outbox[id];
    store.terminal[id] = {
      at: finiteInteger(now),
      chatId: key,
      eventKey: String(item.eventKey || ""),
      error: message,
    };
    terminalIds.push(id);
  }
  store.terminal = pruneReceiptMap(store.terminal, now, 5_000);
  return { store: pruneAliasMap(store), terminalIds };
}

export function markGroupBuyDelivered(storeValue, id, {
  now = Date.now(),
  messageId = null,
  chatId = null,
} = {}) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const requestedId = String(id || "");
  const canonicalId = groupBuyCanonicalDeliveryId(store, requestedId);
  const item = store.outbox[canonicalId];
  if (!item) return { store, item: null, id: canonicalId, requestedId };
  const deliveredChatId = String(chatId ?? item.chatId);
  delete store.outbox[canonicalId];
  delete store.terminal[requestedId];
  store.delivered[canonicalId] = {
    at: finiteInteger(now),
    messageId: messageId == null ? null : String(messageId),
    eventKey: String(item.eventKey || ""),
    chatId: deliveredChatId,
  };
  const sentAt = pacingRows(store, deliveredChatId, now);
  sentAt.push(finiteInteger(now));
  store.pacing[deliveredChatId] = { sentAt: sentAt.slice(-GROUP_BUY_CHAT_WINDOW_LIMIT) };
  store.delivered = pruneReceiptMap(store.delivered, now);
  store.terminal = pruneReceiptMap(store.terminal, now, 5_000);
  return {
    store: pruneAliasMap(store),
    item: { ...item, chatId: deliveredChatId },
    id: canonicalId,
    requestedId,
  };
}

export function markGroupBuyFailed(storeValue, id, error, { now = Date.now() } = {}) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const item = store.outbox[id];
  if (!item) return { store, item: null, terminal: false };
  const message = String(error?.providerData?.description || error?.message || error || "Telegram delivery failed").slice(0, 500);
  if (isPermanentTelegramChatError(error) || isPermanentTelegramPayloadError(error)) {
    delete store.outbox[id];
    store.terminal[id] = { at: finiteInteger(now), chatId: String(item.chatId), eventKey: String(item.eventKey || ""), error: message };
    store.terminal = pruneReceiptMap(store.terminal, now, 5_000);
    return { store: pruneAliasMap(store), item, terminal: true };
  }
  item.attempts = finiteInteger(item.attempts) + 1;
  item.lastError = message;
  item.nextAttemptAt = finiteInteger(now) + groupBuyRetryDelayMs(error, item.attempts);
  store.outbox[id] = item;
  return { store, item, terminal: false };
}

function rhTokenState(store, token) {
  const key = String(token || "").toLowerCase();
  const current = objectRecord(store.rh.tokens[key]);
  const state = {
    startedBlock: finiteInteger(current.startedBlock),
    lastPoolRefreshAt: finiteInteger(current.lastPoolRefreshAt),
    pools: objectRecord(current.pools),
  };
  store.rh.tokens[key] = state;
  return state;
}

export function refreshRhGroupBuyPools(storeValue, token, pools = [], {
  now = Date.now(), baselineBlock = 0, graceMs = GROUP_BUY_RH_POOL_GRACE_MS,
} = {}) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const state = rhTokenState(store, token);
  if (!(state.startedBlock > 0) && Number(baselineBlock) > 0) state.startedBlock = finiteInteger(baselineBlock);
  const discovered = new Set();
  for (const row of pools) {
    const address = String(row?.pool || row?.pairAddress || row || "").toLowerCase();
    if (!/^0x[0-9a-f]{40}$/.test(address)) continue;
    discovered.add(address);
    const prior = objectRecord(state.pools[address]);
    state.pools[address] = {
      ...prior,
      pool: address,
      cursorBlock: finiteInteger(prior.cursorBlock) > 0
        ? finiteInteger(prior.cursorBlock)
        : (finiteInteger(baselineBlock) || state.startedBlock),
      lastDiscoveredAt: finiteInteger(now),
      retireAt: 0,
    };
  }
  for (const [address, priorValue] of Object.entries(state.pools)) {
    if (discovered.has(address)) continue;
    const prior = objectRecord(priorValue);
    state.pools[address] = {
      ...prior,
      pool: address,
      retireAt: finiteInteger(prior.retireAt) > 0
        ? finiteInteger(prior.retireAt)
        : finiteInteger(now) + finiteInteger(graceMs),
    };
  }
  state.lastPoolRefreshAt = finiteInteger(now);
  return { store, pools: rhGroupBuyPools(store, token, now) };
}

export function rhGroupBuyPools(storeValue, token, now = Date.now()) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const state = objectRecord(store.rh.tokens[String(token || "").toLowerCase()]);
  return Object.values(objectRecord(state.pools))
    .filter((row) => !(finiteInteger(row?.retireAt) > 0 && finiteInteger(row.retireAt) <= now))
    .sort((a, b) => String(a.pool).localeCompare(String(b.pool)));
}

export function rhGroupBuyPoolCursor(storeValue, token, pool, fallback = 0) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const state = objectRecord(store.rh.tokens[String(token || "").toLowerCase()]);
  const row = objectRecord(objectRecord(state.pools)[String(pool || "").toLowerCase()]);
  return finiteInteger(row.cursorBlock, finiteInteger(state.startedBlock, finiteInteger(fallback)));
}

export function enqueueRhGroupBuyBatch(storeValue, {
  token, pool, toBlock, items = [], now = Date.now(),
} = {}) {
  let store = normalizeGroupBuyDeliveryStore(storeValue);
  const state = rhTokenState(store, token);
  const poolKey = String(pool || "").toLowerCase();
  if (!/^0x[0-9a-f]{40}$/.test(poolKey)) throw new Error("A valid Robinhood pool is required.");
  const prior = objectRecord(state.pools[poolKey]);
  const insertedIds = [];
  for (const item of items) {
    const result = enqueueGroupBuyOutbox(store, item, now);
    store = result.store;
    if (result.inserted) insertedIds.push(result.id);
  }
  const freshState = rhTokenState(store, token);
  freshState.pools[poolKey] = {
    ...prior,
    pool: poolKey,
    cursorBlock: Math.max(finiteInteger(prior.cursorBlock), finiteInteger(toBlock)),
    lastPolledAt: finiteInteger(now),
  };
  return { store, insertedIds };
}
