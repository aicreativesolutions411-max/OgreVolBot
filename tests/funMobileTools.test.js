import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const funHtml = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const ggSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const ownerAnalyticsHtml = fs.readFileSync(new URL("../web/public/owner-analytics.html", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("Fun mobile automation tools stay embedded in the Fun shell", () => {
  assert.match(funHtml, /data-view="tool"/);
  assert.match(funHtml, /data-tool-frame/);
  assert.match(funSource, /const FUN_TOOL_ROUTES = \{/);
  assert.match(funSource, /copy: \{ route: "copy"/);
  assert.match(funSource, /sniper: \{ route: "sniper"/);
  assert.match(funSource, /walletLaunch: \{ route: "walletLaunch"/);
  assert.match(funSource, /embed=fun-tool/);
  assert.doesNotMatch(funSource, /const routes = \{ copy: "copy", sniper: "sniper" \}/);
  assert.match(ggSource, /body\.fun-tool-embed \.view\.on/);
  assert.match(ggSource, /embed==="fun-tool"/);
});

test("the launcher visible inside Fun exposes linked NFT collection settings", () => {
  assert.equal(indexSource, ggSource, "classic launcher mirrors must remain identical");
  for (const id of ["lcNftEnabled", "lcNftName", "lcNftDescription", "lcNftSupplyMode", "lcNftSupplyCap", "lcNftRoyalty"]) {
    assert.match(ggSource, new RegExp(`id="${id}"`));
  }
  assert.match(ggSource, /tb\("nft","NFT Collection"\)/);
  assert.match(ggSource, /nftCollection:\{enabled:/);
  assert.match(serverSource, /normalizeLinkedNftCollection\(body\.nftCollection/);
});

test("Fun NFT tab manages coins that were already launched", () => {
  for (const marker of ["lcNftExistingMint", "lcNftManagerLoad", "lcNftCreateLater", "lcNftLinkExisting", "lcNftItemMint"]) {
    assert.match(ggSource, new RegExp(marker));
  }
  assert.match(ggSource, /\/api\/web\/nft\/loyalty\?tokenMint=/);
  assert.match(ggSource, /\/api\/web\/nft\/collection\/create/);
  assert.match(ggSource, /\/api\/web\/nft\/collection\/link/);
  assert.match(ggSource, /\/api\/web\/nft\/item\/mint/);
  assert.match(ggSource, /same SlimeWire profile that launched this coin/);
});

test("Telegram owner stats show named direct users, trade usage, referrals, and a private dashboard", () => {
  assert.match(serverSource, /async function platformOwnerAnalyticsSnapshot\(/);
  assert.match(serverSource, /ownerAnalyticsDisplayName\(profile, telegramUser\)/);
  assert.match(serverSource, /row\.trades} trades/);
  assert.match(serverSource, /row\.totalWallets} wallets/);
  assert.match(serverSource, /row\.referrals} referrals/);
  assert.match(serverSource, /Open private dashboard/);
  assert.match(serverSource, /\/adminstats today/);
});

test("owner analytics is one-time gated, excludes passive group members, and exposes no recovery data", () => {
  assert.match(serverSource, /OWNER_ANALYTICS_TICKET_TTL_MS = 5 \* 60 \* 1000/);
  assert.match(serverSource, /OWNER_ANALYTICS_SESSION_TTL_MS = 30 \* 60 \* 1000/);
  assert.match(serverSource, /ownerAnalyticsTickets\.delete\(key\)/);
  assert.match(serverSource, /HttpOnly; Secure; SameSite=Strict/);
  assert.match(serverSource, /X-Robots-Tag/);
  assert.match(serverSource, /Content-Security-Policy/);
  assert.match(serverSource, /requestUrl\.pathname === "\/owner-analytics"/);
  assert.match(serverSource, /pathname === "\/api\/web\/owner-analytics"/);
  assert.match(serverSource, /if \(isPrivateChat\(message\.chat\)\) await recordTelegramGrowthUser\(userId, message\.from\)/);
  const snapshotStart = serverSource.indexOf("async function platformOwnerAnalyticsSnapshot(");
  const snapshotEnd = serverSource.indexOf("async function platformGrowthSnapshot(", snapshotStart);
  const snapshot = serverSource.slice(snapshotStart, snapshotEnd);
  assert.doesNotMatch(snapshot, /readGroupMentions|rememberGroupMentionMember/);
  assert.match(snapshot, /directTelegramUsers/);
  assert.match(serverSource, /name: "Needs profile"/);
  assert.doesNotMatch(ownerAnalyticsHtml, /privateKey|localStorage/i);
  assert.match(ownerAnalyticsHtml, /Direct bot users/);
  assert.match(ownerAnalyticsHtml, /Referral leaders/);
  assert.match(ownerAnalyticsHtml, /credentials:"same-origin"/);
});
