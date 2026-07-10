import crypto from "node:crypto";

export const X_DM_MENU_KIND = "x-dm-menu-v1";
export const X_DM_MENU_DEFAULT_TTL_MS = 15 * 60_000;
export const X_DM_MENU_MAX_TTL_MS = 24 * 60 * 60_000;

function encode(value) {
  return Buffer.from(value).toString("base64url");
}

function decode(value) {
  return Buffer.from(String(value || ""), "base64url").toString("utf8");
}

function signature(secret, body) {
  return crypto.createHmac("sha256", String(secret || "")).update(body).digest("base64url");
}

export function signXDmMenuToken(secret, payload, options = {}) {
  const now = Number(options.now) || Date.now();
  const ttlMs = Math.max(60_000, Math.min(X_DM_MENU_MAX_TTL_MS, Number(options.ttlMs) || X_DM_MENU_DEFAULT_TTL_MS));
  const record = {
    kind: X_DM_MENU_KIND,
    senderId: String(payload?.senderId || ""),
    userId: String(payload?.userId || ""),
    mint: String(payload?.mint || "").trim(),
    slot: String(payload?.slot || ""),
    linkVersion: String(payload?.linkVersion || ""),
    nonce: String(options.nonce || crypto.randomBytes(16).toString("hex")),
    iat: now,
    exp: now + ttlMs
  };
  if (!record.senderId || !record.userId || !record.mint || !record.linkVersion) throw new Error("Missing X DM menu token scope");
  const body = encode(JSON.stringify(record));
  return `${body}.${signature(secret, body)}`;
}

export function verifyXDmMenuToken(secret, token, options = {}) {
  const parts = String(token || "").split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, mac] = parts;
  const expected = signature(secret, body);
  const actualBuffer = Buffer.from(mac);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length) return null;
  try {
    if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) return null;
  } catch {
    return null;
  }
  try {
    const record = JSON.parse(decode(body));
    const now = Number(options.now) || Date.now();
    if (record?.kind !== X_DM_MENU_KIND) return null;
    if (!record.senderId || !record.userId || !record.mint || !record.nonce || !record.linkVersion) return null;
    if (!Number.isFinite(Number(record.exp)) || now > Number(record.exp)) return null;
    if (Number(record.iat) > now + 60_000) return null;
    return record;
  } catch {
    return null;
  }
}
