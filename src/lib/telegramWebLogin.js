import crypto from "node:crypto";

export const TELEGRAM_WEB_LOGIN_MAX_AGE_SECONDS = 10 * 60;

const ROUTE_PARAM_PREFIX = "sw_";

function searchParams(input) {
  if (input instanceof URLSearchParams) return input;
  if (input instanceof URL) return input.searchParams;
  return new URLSearchParams(input || {});
}

function safeEqualHex(left, right) {
  if (!/^[a-f0-9]{64}$/i.test(String(left || "")) || !/^[a-f0-9]{64}$/i.test(String(right || ""))) return false;
  const actual = Buffer.from(String(left), "hex");
  const expected = Buffer.from(String(right), "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

// Telegram's LoginUrl appends signed user fields to the button's existing URL. SlimeWire's own
// destination fields are deliberately `sw_*`, so they can never be confused with Telegram data or
// included in Telegram's data-check-string.
export function verifyTelegramWebLogin(input, botToken, options = {}) {
  const params = searchParams(input);
  const suppliedHash = String(params.get("hash") || "").trim();
  if (!suppliedHash) return { ok: false, reason: "authorization_declined" };
  if (!String(botToken || "")) return { ok: false, reason: "bot_token_missing" };

  const signed = [];
  const seen = new Set();
  for (const [key, value] of params.entries()) {
    if (key === "hash" || key.startsWith(ROUTE_PARAM_PREFIX)) continue;
    // Duplicated signed keys create ambiguous verification semantics; reject instead of guessing.
    if (seen.has(key)) return { ok: false, reason: "duplicate_field" };
    seen.add(key);
    signed.push([key, value]);
  }
  signed.sort(([left], [right]) => left.localeCompare(right));

  const values = Object.fromEntries(signed);
  if (!/^\d+$/.test(String(values.id || "")) || !/^\d+$/.test(String(values.auth_date || ""))) {
    return { ok: false, reason: "missing_identity" };
  }

  const secret = crypto.createHash("sha256").update(String(botToken)).digest();
  const dataCheckString = signed.map(([key, value]) => `${key}=${value}`).join("\n");
  const expectedHash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");
  if (!safeEqualHex(suppliedHash, expectedHash)) return { ok: false, reason: "invalid_signature" };

  const nowSeconds = Math.floor((Number(options.now) || Date.now()) / 1000);
  const authSeconds = Number(values.auth_date);
  const maxAgeSeconds = Math.max(30, Number(options.maxAgeSeconds) || TELEGRAM_WEB_LOGIN_MAX_AGE_SECONDS);
  if (authSeconds > nowSeconds + 60) return { ok: false, reason: "future_authorization" };
  if (nowSeconds - authSeconds > maxAgeSeconds) return { ok: false, reason: "expired_authorization" };

  return {
    ok: true,
    authDate: authSeconds,
    user: {
      id: String(values.id),
      first_name: String(values.first_name || "").slice(0, 128),
      last_name: String(values.last_name || "").slice(0, 128),
      username: String(values.username || "").replace(/^@+/, "").slice(0, 64),
      photo_url: String(values.photo_url || "").slice(0, 2_048)
    }
  };
}

export function telegramWebLoginDestination(input) {
  const params = searchParams(input);
  const mint = String(params.get("sw_ca") || "").trim();
  const validMint = /^0x[a-f0-9]{40}$/i.test(mint) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint);
  const destination = new URL("https://www.slimewire.org/fun/");
  destination.searchParams.set("source", "telegram");
  if (validMint) destination.searchParams.set("ca", mint);
  if (params.get("sw_buy") === "1") destination.searchParams.set("buy", "1");
  if (params.get("sw_quick") === "1") destination.searchParams.set("quick", "1");
  return `${destination.pathname}${destination.search}`;
}

export function buildTelegramWebLoginUrl(baseUrl, tokenMint = "", options = {}) {
  const url = new URL("/api/web/telegram-login", `${String(baseUrl || "https://www.slimewire.org").replace(/\/+$/, "")}/`);
  const mint = String(tokenMint || "").trim();
  if (/^0x[a-f0-9]{40}$/i.test(mint) || /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) url.searchParams.set("sw_ca", mint);
  if (options.buy) url.searchParams.set("sw_buy", "1");
  if (options.quick) url.searchParams.set("sw_quick", "1");
  return url.toString();
}
