import test from "node:test";
import assert from "node:assert/strict";

import {
  signXDmMenuToken,
  verifyXDmMenuToken,
  X_DM_MENU_MAX_TTL_MS
} from "../src/lib/xDmMenuToken.js";

const SECRET = "test-secret-that-is-long-enough-for-hmac";
const PAYLOAD = { senderId: "123", userId: "456", mint: "So11111111111111111111111111111111111111112", slot: "1", linkVersion: "2026-07-09T00:00:00.000Z" };

test("X DM menu tokens preserve their exact user, sender, coin, and expiry scope", () => {
  const token = signXDmMenuToken(SECRET, PAYLOAD, { now: 1_000, ttlMs: 60_000, nonce: "abc123" });
  assert.deepEqual(verifyXDmMenuToken(SECRET, token, { now: 30_000 }), {
    kind: "x-dm-menu-v1",
    ...PAYLOAD,
    nonce: "abc123",
    iat: 1_000,
    exp: 61_000
  });
});

test("X DM menu tokens reject expiry, tampering, and a different signing secret", () => {
  const token = signXDmMenuToken(SECRET, PAYLOAD, { now: 1_000, ttlMs: 60_000, nonce: "abc123" });
  assert.equal(verifyXDmMenuToken(SECRET, token, { now: 61_001 }), null);
  assert.equal(verifyXDmMenuToken(`${SECRET}-wrong`, token, { now: 30_000 }), null);
  const [body, mac] = token.split(".");
  const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  decoded.userId = "attacker";
  const tamperedBody = Buffer.from(JSON.stringify(decoded)).toString("base64url");
  assert.equal(verifyXDmMenuToken(SECRET, `${tamperedBody}.${mac}`, { now: 30_000 }), null);
});

test("X DM menu token TTL is bounded and missing scope is rejected", () => {
  const token = signXDmMenuToken(SECRET, PAYLOAD, { now: 1_000, ttlMs: 99_999_999, nonce: "bounded" });
  assert.equal(X_DM_MENU_MAX_TTL_MS, 24 * 60 * 60_000);
  assert.notEqual(verifyXDmMenuToken(SECRET, token, { now: 1_000 + X_DM_MENU_MAX_TTL_MS }), null);
  assert.equal(verifyXDmMenuToken(SECRET, token, { now: 1_001 + X_DM_MENU_MAX_TTL_MS }), null);
  assert.throws(() => signXDmMenuToken(SECRET, { senderId: "123", userId: "", mint: PAYLOAD.mint }), /Missing X DM menu token scope/);
});
