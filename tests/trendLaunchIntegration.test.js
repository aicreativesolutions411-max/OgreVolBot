import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const server = readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const worker = readFileSync(new URL("../src/worker.js", import.meta.url), "utf8");
const page = readFileSync(new URL("../web/public/trend-launch.html", import.meta.url), "utf8");
const fun = readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const cash = readFileSync(new URL("../web/public/cash/index.html", import.meta.url), "utf8");

test("Trend Launch is reachable from web, Fun, and Telegram", () => {
  assert.match(server, /\["\/trend-launch", "\/trend-launch\/", "\/trend-launch\.html"\]/);
  assert.match(server, /command: "trendlaunch"/);
  assert.match(server, /handleTrendLaunchCommand\(message, userId\)/);
  assert.match(server, /text: "🔥 Trend Launch", callback_data: "trend_launch"/);
  assert.match(server, /case "trend_launch":\s+await showTrendLaunchTelegram\(chatId, userId, messageId\)/);
  assert.match(server, /"trend_launch",\s+"orders_hub"/);
  assert.match(server, /Telegram command failed for \$\{userId\}/);
  assert.match(fun, /"Trend Launch", "Auto-pick live X trends"/);
  assert.match(cash, /href="\/trend-launch">Trend Launch/);
  assert.match(page, /Start auto/);
  assert.match(page, /Launch one/);
  assert.match(page, /id="stop"/);
});

test("Trend Launch automatically selects source media and freezes the creator wallet", () => {
  assert.match(server, /chooseTrendLaunchCandidate\(candidates, campaignHistory\)/);
  assert.match(server, /trendLaunchGenerateConcept\(candidate, usedSymbols\)/);
  assert.match(server, /trendLaunchImageData\(candidate, concept\.symbol\)/);
  assert.match(server, /freshServerTradeWalletForOwner\(campaign\.userId, campaign\.walletPublicKey, "Trend Launch"\)/);
  assert.match(server, /devWalletIndex: String\(campaign\.walletPublicKey\)/);
  assert.match(server, /selectedDevWalletId: String\(campaign\.walletPublicKey\)/);
  assert.match(server, /creatorFeeClaimMode: "manual"/);
  assert.match(server, /trendLaunchSlotStillAuthorized\(campaign\)/);
});

test("Trend Launch stays off the fast trade lane and uses the broad background worker", () => {
  assert.match(worker, /runTrendLaunches: false,/);
  assert.match(worker, /runTrendLaunches: CONFIG\.taskSet === "trade",/);
  assert.match(server, /result\.trendLaunches = \{ queued: true \};\s+queueTrendLaunchWorker\(\);/);
});

test("Trend Launch page uses the existing fast wallet source and explicit authorization", () => {
  assert.match(page, /\/api\/web\/balances\?fast=true/);
  assert.match(page, /Media authorization/);
  assert.match(page, /I confirm I have permission to reuse media selected by this campaign/);
  assert.doesNotMatch(page, /Choose (?:a )?trend/i);
});
