import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const maker = fs.readFileSync(new URL("../web/public/site-maker.html", import.meta.url), "utf8");
const coin = fs.readFileSync(new URL("../web/public/coin-site.html", import.meta.url), "utf8");
const dashboard = fs.readFileSync(new URL("../web/public/partner-rewards.html", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");

test("partner rewards use the existing 0.15% allocation inside the 0.50% fee", () => {
  assert.match(server, /const bundleFeeBps = 50/);
  assert.match(server, /const referralFeeBps = 15/);
  assert.match(server, /connectedTradeFeeBps = jupiterReferralAccount \? bundleFeeBps : 0/);
  assert.match(server, /partnerProgramByToken\(options\.tokenMint/);
  assert.match(server, /total \* BigInt\(CONFIG\.referralFeeBps\)[\s\S]{0,120}BigInt\(CONFIG\.bundleFeeBps\)/);
  assert.match(server, /PARTNER_DEV_SHARE_BPS = 5_000/);
  assert.match(server, /PARTNER_HOLDER_SHARE_BPS = 5_000/);
});

test("coin-aware fee plumbing covers Telegram, managed-wallet, bundle, and RH trades", () => {
  assert.match(server, /session\.userId, tokenMint: session\.data\.tokenMint/);
  assert.match(server, /options\.userId, tokenMint, chain: "solana"/);
  assert.match(server, /b\.userId, tokenMint: mint, chain: "solana"/);
  assert.match(server, /recordPartnerRhFee/);
  assert.match(server, /partner\.vaultRhWallet/);
});

test("holder policy is daily, snapshot-gated, sqrt-weighted, capped, and bounded to 100", () => {
  assert.match(server, /PARTNER_SNAPSHOT_MS = 6 \* 60 \* 60 \* 1000/);
  assert.match(server, /PARTNER_SETTLEMENT_MS = 24 \* 60 \* 60 \* 1000/);
  assert.match(server, /minHoldHours: 24/);
  assert.match(server, /minSnapshots: 2/);
  assert.match(server, /weighting: "sqrt_balance"/);
  assert.match(server, /maxWalletPoolPct: 5/);
  assert.match(server, /maxRecipients: 100/);
});

test("Site Maker, coin sites, Telegram, and public receipts expose the partner program", () => {
  assert.match(maker, /Community Rewards payout wallet/);
  assert.match(maker, /partnerPayoutWallet/);
  assert.match(maker, /Community Rewards automatically enabled/);
  assert.match(maker, /p\.partner\.enabled = Boolean\(p\.partner\.payoutWallet\)/);
  assert.match(coin, /COMMUNITY REWARDS/);
  assert.match(coin, /\/rewards\/\$\{encodeURIComponent\(p\.partner\.code\)\}/);
  assert.match(dashboard, /PUBLIC HOLDER PROOF/);
  assert.match(dashboard, /MY HOLDER REWARDS/);
  assert.doesNotMatch(dashboard, /Developer paid/);
  assert.match(maker, /PRIVATE DEVELOPER VIEW/);
  assert.match(server, /partnerHolderPublic\(program, store, wallet\)/);
  assert.match(server, /partnerProgramAdminForProject\(project\)/);
  assert.match(server, /\/api\/partner-rewards\//);
  assert.match(server, /partner_\$\{program\.code\}/);
  assert.match(redirects, /\/rewards\/\*\s+\/partner-rewards\.html\s+200/);
  assert.match(redirects, /\/ca\/\*\s+\/coin-site\.html\s+200/);
});
