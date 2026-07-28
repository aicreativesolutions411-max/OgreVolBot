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

test("the launcher visible inside Fun is Pump-only and hides NFT creation", () => {
  assert.equal(indexSource, ggSource, "classic launcher mirrors must remain identical");
  assert.match(funSource, /launchMode=pump/);
  assert.match(ggSource, /launchPumpOnly:/);
  assert.doesNotMatch(ggSource, /tb\("nft","NFT Collection"\)/);
  assert.match(ggSource, /nftCollection:\{enabled:false\}/);
  assert.match(ggSource, /slimewirePumpLaunchDraftV1/);
  assert.match(ggSource, /persistLaunchDraftNow/);
  assert.match(serverSource, /normalizeLinkedNftCollection\(body\.nftCollection/);
});

test("wallet Pump launches resume one persisted attempt and never unlock on a client timeout", () => {
  assert.equal(indexSource, ggSource, "classic launcher mirrors must remain identical");
  assert.match(ggSource, /\.launch-tabs\{display:grid;grid-template-columns:repeat\(3,1fr\)/);
  assert.doesNotMatch(ggSource, /\.launch-tabs\{display:grid;grid-template-columns:repeat\(4,1fr\)/);
  assert.match(ggSource, /activeAttemptId:state\.launchActiveAttemptId\|\|""/);
  assert.match(ggSource, /activeAttemptStartedAt:state\.launchActiveAttemptStartedAt\|\|0/);

  const submitStart = ggSource.indexOf('$("#lcGo").onclick=async()=>{');
  const submitEnd = ggSource.indexOf("\n  function subbarToolKol", submitStart);
  assert.ok(submitStart > 0 && submitEnd > submitStart);
  const submit = ggSource.slice(submitStart, submitEnd);
  const savedBeforePost = submit.indexOf("state.launchActiveAttemptId=body.launchAttemptId");
  const launchPost = submit.indexOf('jpost("/api/web/launch/coin",body)');
  assert.ok(savedBeforePost >= 0 && launchPost > savedBeforePost, "the recovery id must be durable before POST");
  assert.match(submit, /if\(state\.launchActiveAttemptId\)\{pollLaunchProgress\(state\.launchActiveAttemptId,\$\("#lcGo"\)\);return;\}/);
  assert.match(submit, /else if\(status===0\)[\s\S]{0,220}pollLaunchProgress\(body\.launchAttemptId,b\)/);
  assert.match(ggSource, /id="lcClearDraft"'\+\(state\.launchActiveAttemptId\?' disabled':''\)/);
  assert.match(ggSource, /if\(state\.launchActiveAttemptId\)\{toast\("This launch is still resolving\./);
  assert.match(ggSource, /if\(state\.launchActiveAttemptId\)pollLaunchProgress\(state\.launchActiveAttemptId,\$\("#lcGo"\)\)/);

  const pollStart = ggSource.indexOf("async function pollLaunchProgress(");
  const pollEnd = ggSource.indexOf("\n  // SlimeWire (Meteora)", pollStart);
  assert.ok(pollStart > 0 && pollEnd > pollStart);
  const poll = ggSource.slice(pollStart, pollEnd);
  assert.match(poll, /pr\.status==="COMPLETE"[\s\S]{0,2400}clearLaunchInviteLastLink\(\);clearSavedLaunchDraft\(\)/);
  assert.match(poll, /pr\.status==="FAILED"[\s\S]{0,260}launchActiveAttemptId=""/);
  assert.match(poll, /status===404&&unknown404s>=3&&Date\.now\(\)-state\.launchActiveAttemptStartedAt>=30000/);
  const timeoutStart = poll.indexOf("else if(tries>240)");
  const timeoutEnd = poll.indexOf("setTimeout(tick,tries>240?10000:2500)", timeoutStart);
  assert.ok(timeoutStart > 0 && timeoutEnd > timeoutStart);
  assert.doesNotMatch(poll.slice(timeoutStart, timeoutEnd), /disabled=false|launchActiveAttemptId=""|return;/);
});

test("the latest participant seat link is bound to an active invite and cleared after launch", () => {
  assert.match(ggSource, /LAUNCH_INVITE_LINK_KEY="slimewireLaunchInviteLinkV1"/);
  assert.match(ggSource, /saveLaunchInviteLastLink\(d\.invite\)/);
  assert.match(ggSource, /\["WAITING","READY"\]\.includes\(String\(invite\.status\|\|""\)\)/);
  assert.match(ggSource, /clearLaunchInviteLastLink\(\);clearSavedLaunchDraft\(\)/);
  assert.doesNotMatch(ggSource, /localStorage\.setItem\("slimewireLaunchInviteUrl"/);
  const walletRows = ggSource.slice(ggSource.indexOf("function lcBundleWalletRowsHtml"), ggSource.indexOf("function lcSyncLaunchStrategies"));
  const participantRows = ggSource.slice(ggSource.indexOf("function lcParticipantInviteHtml"), ggSource.indexOf("function lcWireParticipantInvites"));
  assert.match(walletRows, /toFixed\(3\)\+' SOL<\/span>/);
  assert.match(participantRows, /toFixed\(3\)\)\+' SOL · '/);
  assert.doesNotMatch(walletRows + participantRows, /[◎◉]/);
});

test("dormant NFT manager wiring remains available for existing launches", () => {
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
