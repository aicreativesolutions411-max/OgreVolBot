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

test("Fun mobile wallet exposes the durable Season flow", () => {
  assert.match(funHtml, /data-season-open>Season/);
  assert.match(funSource, /async function openFunSeason\(\)/);
  assert.match(funSource, /data-season-start/);
  assert.match(funSource, /\/api\/web\/season\/start/);
  assert.match(funSource, /\/api\/web\/season\/status/);
  assert.match(funSource, /tradeAttemptId: attemptId\("fun-season"\)/);
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

test("owner analytics is time-bounded and preview-safe, excludes passive group members, and exposes no recovery data", () => {
  assert.match(serverSource, /OWNER_ANALYTICS_TICKET_TTL_MS = 30 \* 60 \* 1000/);
  assert.match(serverSource, /OWNER_ANALYTICS_SESSION_TTL_MS = 30 \* 60 \* 1000/);
  assert.match(serverSource, /validateOwnerAnalyticsTicket\(ticket\)/);
  assert.match(serverSource, /function issueOwnerAnalyticsTicket[\s\S]{0,900}signVerifyToken/);
  assert.match(serverSource, /function validateOwnerAnalyticsTicket[\s\S]{0,1200}readVerifyToken/);
  assert.match(serverSource, /function validateOwnerAnalyticsTicket[\s\S]{0,1200}signed\.kind !== "owner-analytics"/);
  const validatorStart = serverSource.indexOf("function validateOwnerAnalyticsTicket(");
  const validatorEnd = serverSource.indexOf("function createOwnerAnalyticsSession(", validatorStart);
  assert.ok(validatorStart > 0 && validatorEnd > validatorStart);
  assert.doesNotMatch(serverSource.slice(validatorStart, validatorEnd), /ownerAnalyticsTickets\.delete/);
  assert.match(serverSource, /HttpOnly; Secure; SameSite=Lax/);
  assert.match(serverSource, /X-Robots-Tag/);
  assert.match(serverSource, /Content-Security-Policy/);
  assert.match(serverSource, /requestUrl\.pathname === "\/owner-analytics"/);
  assert.match(serverSource, /pathname === "\/api\/web\/owner-analytics"/);
  assert.match(serverSource, /if \(isPrivateChat\(message\.chat\)\) await recordTelegramGrowthUser\(userId, message\.from\)/);
  const snapshotStart = serverSource.indexOf("async function platformOwnerAnalyticsSnapshot(");
  const snapshotEnd = serverSource.indexOf("async function platformGrowthSnapshot(", snapshotStart);
  const snapshot = serverSource.slice(snapshotStart, snapshotEnd);
  const identityPopulationStart = snapshot.indexOf("const rows = new Map()");
  const identityPopulationEnd = snapshot.indexOf("const resultRows = []", identityPopulationStart);
  assert.ok(identityPopulationStart > 0 && identityPopulationEnd > identityPopulationStart);
  assert.doesNotMatch(snapshot.slice(identityPopulationStart, identityPopulationEnd), /groupMentions|rememberGroupMentionMember/);
  assert.match(snapshot, /directTelegramUsers/);
  assert.match(snapshot, /for \(const telegramUserId of directByTelegramId\.keys\(\)\) ensureRow\(telegramUserId\)/);
  assert.doesNotMatch(serverSource, /name: "Needs profile"/);
  assert.match(serverSource, /const namedResultRows = resultRows\.filter\(\(row\) => row\.hasRealName\)/);
  assert.match(serverSource, /users: namedResultRows\.slice/);
  assert.match(serverSource, /OWNER_ANALYTICS_ORIGIN = "https:\/\/app\.slimewire\.org"/);
  assert.match(serverSource, /const dashboardUrl = ownerAnalyticsDashboardUrl\(ticket\)/);
  assert.match(serverSource, /requestHost && requestHost !== new URL\(OWNER_ANALYTICS_ORIGIN\)\.hostname/);
  assert.match(ownerAnalyticsHtml, /state\.users=\(data\.users\|\|\[\]\)\.filter\(r=>r&&r\.hasRealName&&r\.name\)/);
  assert.match(ownerAnalyticsHtml, /Reopen this private dashboard from the latest \/adminstats message/);
  assert.doesNotMatch(ownerAnalyticsHtml, /privateKey|localStorage/i);
  assert.match(ownerAnalyticsHtml, /Direct bot users/);
  assert.match(ownerAnalyticsHtml, /Referral leaders/);
  assert.match(ownerAnalyticsHtml, /credentials:"same-origin"/);
});
