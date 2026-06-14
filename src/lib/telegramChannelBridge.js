// Telegram channel bridge: posts public-facing SlimeWire engine events (launches,
// TP/SL fires, KOL copies) to a Telegram channel without ever spamming it.
//
// Anti-spam contract:
//   - hard cap of maxPerHour messages (rolling window); excess events are DROPPED, not queued
//   - minimum minIntervalMs between any two posts
//   - per (kind, key) dedupe window so the same token/event never posts twice in a row
//   - announce() never throws and never blocks the caller (fire-and-forget)
//
// Privacy contract: callers must never pass user ids, wallet addresses, or balances.
// Messages are framed as anonymous engine activity.

const DEFAULT_DEDUPE_WINDOW_MS = 30 * 60 * 1000;

export function createTelegramChannelBridge(options = {}) {
  const enabled = Boolean(options.enabled && options.botToken && options.chatId);
  const botToken = String(options.botToken || "");
  const chatId = String(options.chatId || "");
  const maxPerHour = clampInt(options.maxPerHour, 1, 30, 6);
  const minIntervalMs = clampInt(options.minIntervalSeconds, 10, 3600, 120) * 1000;
  const dedupeWindowMs = clampInt(options.dedupeWindowMinutes, 1, 1440, 30) * 60 * 1000;
  const log = typeof options.log === "function" ? options.log : () => {};

  const sentAt = [];
  const dedupe = new Map();
  let lastSentAt = 0;

  function allow(kind, key) {
    const now = Date.now();
    while (sentAt.length && now - sentAt[0] > 3600_000) sentAt.shift();
    if (sentAt.length >= maxPerHour) return false;
    if (now - lastSentAt < minIntervalMs) return false;
    const dedupeKey = `${kind}:${key}`;
    const seenAt = dedupe.get(dedupeKey) || 0;
    if (now - seenAt < dedupeWindowMs) return false;
    return true;
  }

  function markSent(kind, key) {
    const now = Date.now();
    sentAt.push(now);
    lastSentAt = now;
    dedupe.set(`${kind}:${key}`, now);
    if (dedupe.size > 500) {
      const cutoff = now - dedupeWindowMs;
      for (const [k, at] of dedupe) {
        if (at < cutoff) dedupe.delete(k);
      }
    }
  }

  async function send(text) {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: false
      }),
      signal: AbortSignal.timeout(15_000)
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`telegram sendMessage ${response.status}: ${body.slice(0, 200)}`);
    }
  }

  async function sendPhotoReq(buffer, filename, caption, replyMarkup) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("photo", new Blob([buffer], { type: "image/png" }), filename || "card.png");
    if (caption) { form.append("caption", caption); form.append("parse_mode", "HTML"); }
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(25_000)
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`telegram sendPhoto ${response.status}: ${body.slice(0, 200)}`);
    }
  }

  /**
   * Fire-and-forget channel post. kind groups rate/dedupe buckets; key identifies the
   * event (usually the token mint). Never throws; drops silently when limits apply.
   */
  function announce(kind, key, text) {
    if (!enabled || !text) return;
    const safeKind = String(kind || "event");
    const safeKey = String(key || text).slice(0, 120);
    if (!allow(safeKind, safeKey)) {
      log(`tg-channel drop (${safeKind}): rate/dedupe limit`);
      return;
    }
    markSent(safeKind, safeKey);
    send(text).catch((error) => {
      log(`tg-channel send failed (${safeKind}): ${error.message}`);
    });
  }

  async function sendAnimationReq(buffer, filename, caption, replyMarkup) {
    const form = new FormData();
    form.append("chat_id", chatId);
    form.append("animation", new Blob([buffer], { type: "image/gif" }), filename || "trailer.gif");
    if (caption) { form.append("caption", caption); form.append("parse_mode", "HTML"); }
    if (replyMarkup) form.append("reply_markup", JSON.stringify(replyMarkup));
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendAnimation`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(30_000)
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`telegram sendAnimation ${response.status}: ${body.slice(0, 200)}`);
    }
  }

  // Post an animation WITHOUT rate/dedupe checks. Use only for media paired with an
  // already-rate-limited post (e.g. the launch trailer that follows the launch card),
  // so the 120s min-interval doesn't drop the second piece. Fire-and-forget.
  function sendAnimationRaw(buffer, filename, caption, replyMarkup) {
    if (!enabled || !buffer) return false;
    sendAnimationReq(buffer, filename, caption, replyMarkup).catch((error) => {
      log(`tg-channel animation failed: ${error.message}`);
    });
    return true;
  }

  /**
   * Fire-and-forget channel PHOTO post (e.g. the launch fire-card). Same rate/dedupe
   * contract as announce(). Returns true if accepted (sent async), false if dropped.
   */
  function announcePhoto(kind, key, buffer, filename, caption, replyMarkup) {
    if (!enabled || !buffer) return false;
    const safeKind = String(kind || "event");
    const safeKey = String(key || filename || "").slice(0, 120);
    if (!allow(safeKind, safeKey)) {
      log(`tg-channel drop photo (${safeKind}): rate/dedupe limit`);
      return false;
    }
    markSent(safeKind, safeKey);
    sendPhotoReq(buffer, filename, caption, replyMarkup).catch((error) => {
      log(`tg-channel photo failed (${safeKind}): ${error.message}`);
    });
    return true;
  }

  return { enabled, announce, announcePhoto, sendAnimationRaw };
}

export function escapeTelegramHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function clampInt(value, min, max, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}
