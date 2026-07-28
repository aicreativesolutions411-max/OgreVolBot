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

export function enqueueGroupBuyOutbox(storeValue, item = {}, now = Date.now()) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const chatId = String(item.chatId ?? item.chat_id ?? "").trim();
  if (!chatId) throw new Error("A Telegram chat is required for a Buy Bot delivery.");
  const id = String(item.id || groupBuyOutboxId({ chatId, eventKey: item.eventKey })).trim();
  if (store.delivered[id] || store.terminal[id]) return { store, id, inserted: false, completed: true };
  if (store.outbox[id]) return { store, id, inserted: false, completed: false };
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
  return { store, id, inserted: true, completed: false };
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
  return /(?:429|too many requests|rate.?limit|timeout|timed out|temporar|fetch failed|network|socket|ECONNRESET|ETIMEDOUT|EAI_AGAIN|ECONNREFUSED|ENETUNREACH|EHOSTUNREACH|502|503|504)/i.test(message);
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
    .sort((a, b) => finiteInteger(a.createdAt) - finiteInteger(b.createdAt) || String(a.id).localeCompare(String(b.id)));
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

export function markGroupBuyDelivered(storeValue, id, { now = Date.now(), messageId = null } = {}) {
  const store = normalizeGroupBuyDeliveryStore(storeValue);
  const item = store.outbox[id];
  if (!item) return { store, item: null };
  delete store.outbox[id];
  store.delivered[id] = {
    at: finiteInteger(now),
    messageId: messageId == null ? null : String(messageId),
    eventKey: String(item.eventKey || ""),
    chatId: String(item.chatId),
  };
  const sentAt = pacingRows(store, item.chatId, now);
  sentAt.push(finiteInteger(now));
  store.pacing[String(item.chatId)] = { sentAt: sentAt.slice(-GROUP_BUY_CHAT_WINDOW_LIMIT) };
  store.delivered = pruneReceiptMap(store.delivered, now);
  store.terminal = pruneReceiptMap(store.terminal, now, 5_000);
  return { store, item };
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
    return { store, item, terminal: true };
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
