import crypto from "node:crypto";

export const X_DM_PAD_SESSION_KIND = "x-dm-pad-session-v1";
export const X_DM_PAD_IDLE_MS = 30 * 24 * 60 * 60_000;
export const X_DM_PAD_ABSOLUTE_MS = 90 * 24 * 60 * 60_000;
const X_DM_PAD_MAX_SESSIONS = 5_000;
const X_DM_PAD_MAX_SESSIONS_PER_SENDER = 8;

export function hashXDmPadSession(token) {
  return crypto.createHash("sha256").update(String(token || "")).digest("hex");
}

function sessionStore(state) {
  if (!state.menuSessions || typeof state.menuSessions !== "object" || Array.isArray(state.menuSessions)) {
    state.menuSessions = {};
  }
  return state.menuSessions;
}

export function pruneXDmPadSessions(state, options = {}) {
  const now = Number(options.now) || Date.now();
  const store = sessionStore(state);
  for (const [hash, record] of Object.entries(store)) {
    const invalid = record?.kind !== X_DM_PAD_SESSION_KIND
      || !record.senderId
      || !record.userId
      || !record.mint
      || !Number.isFinite(Number(record.expiresAt))
      || !Number.isFinite(Number(record.absoluteExpiresAt));
    if (invalid || Number(record.expiresAt) <= now || Number(record.absoluteExpiresAt) <= now) delete store[hash];
  }
  const rows = Object.entries(store).sort((a, b) => Number(b[1]?.lastUsedAt || 0) - Number(a[1]?.lastUsedAt || 0));
  const senderCounts = new Map();
  for (const [hash, record] of rows) {
    const senderId = String(record?.senderId || "");
    const count = (senderCounts.get(senderId) || 0) + 1;
    senderCounts.set(senderId, count);
    if (count > X_DM_PAD_MAX_SESSIONS_PER_SENDER) delete store[hash];
  }
  for (const [hash] of rows.slice(X_DM_PAD_MAX_SESSIONS)) delete store[hash];
  return store;
}

export function createXDmPadSession(state, payload, options = {}) {
  const now = Number(options.now) || Date.now();
  const rawToken = String(options.token || crypto.randomBytes(32).toString("base64url"));
  if (!rawToken || !payload?.senderId || !payload?.userId || !payload?.mint) {
    throw new Error("Missing X Trade Pad session scope");
  }
  const store = pruneXDmPadSessions(state, { now });
  const absoluteExpiresAt = now + X_DM_PAD_ABSOLUTE_MS;
  const record = {
    kind: X_DM_PAD_SESSION_KIND,
    senderId: String(payload.senderId),
    userId: String(payload.userId),
    mint: String(payload.mint).trim(),
    slot: String(payload.slot || ""),
    createdAt: now,
    lastUsedAt: now,
    expiresAt: Math.min(absoluteExpiresAt, now + X_DM_PAD_IDLE_MS),
    absoluteExpiresAt
  };
  store[hashXDmPadSession(rawToken)] = record;
  pruneXDmPadSessions(state, { now });
  return { token: rawToken, record: { ...record } };
}

export function resolveXDmPadSession(state, rawToken, options = {}) {
  const now = Number(options.now) || Date.now();
  const token = String(rawToken || "").trim();
  if (!token) return null;
  const store = pruneXDmPadSessions(state, { now });
  const hash = hashXDmPadSession(token);
  const record = store[hash];
  if (!record) return null;
  const previousLastUsedAt = Number(record.lastUsedAt || 0);
  const previousExpiresAt = Number(record.expiresAt || 0);
  record.lastUsedAt = now;
  record.expiresAt = Math.min(Number(record.absoluteExpiresAt), now + X_DM_PAD_IDLE_MS);
  return {
    hash,
    record,
    dirty: now - previousLastUsedAt >= 5 * 60_000 || record.expiresAt - previousExpiresAt >= 5 * 60_000
  };
}

export function revokeXDmPadSession(state, rawToken) {
  const store = sessionStore(state);
  const hash = hashXDmPadSession(rawToken);
  const existed = Boolean(store[hash]);
  delete store[hash];
  return existed;
}

export function revokeXDmPadSessionsForSender(state, senderId) {
  const store = sessionStore(state);
  const target = String(senderId || "");
  let removed = 0;
  for (const [hash, record] of Object.entries(store)) {
    if (String(record?.senderId || "") === target) {
      delete store[hash];
      removed += 1;
    }
  }
  return removed;
}
