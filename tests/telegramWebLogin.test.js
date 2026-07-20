import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import {
  buildTelegramWebLoginUrl,
  telegramWebLoginDestination,
  verifyTelegramWebLogin
} from "../src/lib/telegramWebLogin.js";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const funClient = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");

function signedTelegramParams(botToken, values, route = {}) {
  const params = new URLSearchParams(route);
  const data = Object.entries(values).sort(([left], [right]) => left.localeCompare(right));
  const check = data.map(([key, value]) => `${key}=${value}`).join("\n");
  const secret = crypto.createHash("sha256").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secret).update(check).digest("hex");
  for (const [key, value] of data) params.set(key, String(value));
  params.set("hash", hash);
  return params;
}

test("Telegram card login verifies the clicking user while keeping the coin route separate", () => {
  const botToken = "123456:test-token";
  const now = Date.parse("2026-07-20T12:00:00.000Z");
  const params = signedTelegramParams(botToken, {
    auth_date: Math.floor(now / 1000),
    first_name: "Slime",
    id: "99887766",
    username: "slimetrader"
  }, {
    sw_ca: "0x4ad72e468e38ec204c605f2e058d61e4d79e2ceb",
    sw_buy: "1"
  });
  assert.deepEqual(verifyTelegramWebLogin(params, botToken, { now }), {
    ok: true,
    authDate: Math.floor(now / 1000),
    user: {
      id: "99887766",
      first_name: "Slime",
      last_name: "",
      username: "slimetrader",
      photo_url: ""
    }
  });
  assert.equal(
    telegramWebLoginDestination(params),
    "/fun/?source=telegram&ca=0x4ad72e468e38ec204c605f2e058d61e4d79e2ceb&buy=1"
  );
});

test("Telegram card login rejects forged, stale, and ambiguous identities", () => {
  const botToken = "123456:test-token";
  const now = Date.parse("2026-07-20T12:00:00.000Z");
  const values = { auth_date: Math.floor(now / 1000), first_name: "Slime", id: "99887766" };
  const forged = signedTelegramParams(botToken, values);
  forged.set("id", "11223344");
  assert.equal(verifyTelegramWebLogin(forged, botToken, { now }).reason, "invalid_signature");

  const stale = signedTelegramParams(botToken, { ...values, auth_date: Math.floor(now / 1000) - 601 });
  assert.equal(verifyTelegramWebLogin(stale, botToken, { now, maxAgeSeconds: 600 }).reason, "expired_authorization");

  const duplicate = signedTelegramParams(botToken, values);
  duplicate.append("id", "99887766");
  assert.equal(verifyTelegramWebLogin(duplicate, botToken, { now }).reason, "duplicate_field");
  assert.equal(verifyTelegramWebLogin(new URLSearchParams(), botToken, { now }).reason, "authorization_declined");
});

test("Telegram login URLs stay on the configured SlimeWire domain and only allow coin routes", () => {
  const mint = "6FNso537P3BecQunQiU34HidxhRRRbSZ1NcMWbNqpump";
  assert.equal(
    buildTelegramWebLoginUrl("https://app.slimewire.org/", mint, { buy: true, quick: true }),
    `https://app.slimewire.org/api/web/telegram-login?sw_ca=${mint}&sw_buy=1&sw_quick=1`
  );
  const malicious = new URLSearchParams({ sw_ca: "https://evil.example", sw_buy: "1", sw_quick: "1", sw_next: "https://evil.example" });
  assert.equal(telegramWebLoginDestination(malicious), "/fun/?source=telegram&buy=1&quick=1");
});

test("the public app exchanges the short-lived ticket and removes it from browser history", () => {
  assert.match(funClient, /function consumeTelegramLoginTicket\(/);
  assert.match(funClient, /post\("\/api\/web\/telegram-login\/exchange", \{ ticket \}/);
  assert.match(funClient, /setToken\(result\.data\.token\)/);
  assert.match(funClient, /searchParams\.delete\("tg_login"\)/);
  assert.match(funClient, /await consumeTelegramLoginTicket\(\)/);
});

test("Telegram scan and buy cards use LoginUrl and the callback is public before the web auth gate", () => {
  assert.match(server, /pathname === "\/api\/web\/telegram-login"[\s\S]{0,180}handleTelegramWebLogin/);
  assert.match(server, /pathname === "\/api\/web\/telegram-login\/exchange"[\s\S]{0,240}exchangeTelegramWebLoginTicket/);
  assert.ok(server.indexOf('pathname === "/api/web/telegram-login"') < server.indexOf("const auth = await authenticateWebRequest(request)"));
  const helperStart = server.indexOf("function telegramWebLoginButton");
  const helper = server.slice(helperStart, helperStart + 420);
  assert.match(helper, /login_url: \{ url \}/);
  const cardStart = server.indexOf("function compactTradeCardKeyboard");
  const card = server.slice(cardStart, cardStart + 1_200);
  assert.match(card, /telegramWebLoginButton/);
  assert.match(card, /telegramSiteLogin/);
  assert.match(card, /telegramQuickLogin/);
});
