import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../web/public/social-kit.html", import.meta.url), "utf8");
const env = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");

test("social kit is a $10 one-time SOL unlock paid to the configured fee wallet", () => {
  assert.match(server, /const SOCIAL_KIT_PRICE_USD = 10/);
  assert.match(server, /getSolUsdPrice/);
  assert.match(server, /socialkit:\$\{id\}/);
  assert.match(server, /drainSolFromWallet\(decryptWallet\(wallet\), new PublicKey\(CONFIG\.feeWallet\)\)/);
  assert.match(server, /if \(draft\.status === "unlocked" && draft\.depositAddress && !draft\.sweptAt\)/);
});

test("one-time admin passes are created, consumed atomically and manageable only in Telegram DM", () => {
  assert.match(server, /async function createSocialKitCodes/);
  assert.match(server, /if \(!row \|\| row\.usedAt \|\| row\.revokedAt\)/);
  assert.match(server, /row\.usedAt = new Date\(\)\.toISOString\(\); row\.usedBy/);
  assert.match(server, /isPrivateChat\(message\.chat\) && \(socialCodeCommand/);
  assert.match(server, /socialrevoke\|kitrevoke/);
});

test("web flow resolves a coin, creates the kit and polls payment status", () => {
  assert.match(server, /pathname === "\/api\/web\/social-kit\/resolve"/);
  assert.match(server, /pathname === "\/api\/web\/social-kit\/create"/);
  assert.match(server, /pathname === "\/api\/web\/social-kit\/status"/);
  assert.match(page, /Coin address or link/);
  assert.match(page, /recovery inbox/);
  assert.match(page, /setInterval\(\(\)=>status\(d\.id,true\),15000\)/);
});

test("no-proof kit stays explicitly community-run and never collects X credentials", () => {
  assert.match(server, /Community-run, unofficial/);
  assert.match(server, /Unofficial and not affiliated with the token team/);
  assert.match(page, /No ownership proof needed/);
  assert.match(page, /never asks for an X password/);
  assert.doesNotMatch(page, /type="password"/);
  assert.match(page, /X signup and CAPTCHA must be completed by a person/);
});

test("email alias provisioning preserves existing forwarding rows and is server-only", () => {
  assert.match(server, /namecheap\.domains\.dns\.getEmailForwarding/);
  assert.match(server, /namecheap\.domains\.dns\.setEmailForwarding/);
  assert.match(server, /rows\.filter/);
  assert.match(env, /NAMECHEAP_API_KEY=/);
  assert.doesNotMatch(page, /NAMECHEAP_API_KEY/);
});
