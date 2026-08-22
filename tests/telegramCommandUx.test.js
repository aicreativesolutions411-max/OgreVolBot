import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(match, `${name} is missing`);
  const paramsStart = source.indexOf("(", match.index);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")" && --paramsDepth === 0) { paramsEnd = index; break; }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}" && --depth === 0) return source.slice(bodyStart + 1, index);
  }
  return "";
}

function evaluateLiteralTextFunction(name) {
  const body = functionBody(serverSource, name);
  return Function(`return () => {${body}}`)()();
}

test("Telegram registers the first-use commands in DM and groups", () => {
  const commands = functionBody(serverSource, "registerTelegramBotCommands");
  for (const command of ["menu", "help", "buy", "buybot", "raidbot", "raid", "next", "verifyoff"]) {
    assert.match(commands, new RegExp(`command: "${command}"`));
  }
  assert.match(commands, /groupCommands\.filter\(\(item\) => item\.command !== "s"\)/);
  assert.equal((commands.match(/command: "menu"/g) || []).length, 1, "menu must not be duplicated in the private command list");
});

test("DM and group help stay concise and use a hard Telegram-safe chunker", () => {
  const groupHelp = evaluateLiteralTextFunction("groupBotHelpText");
  const dmHelp = evaluateLiteralTextFunction("dmBotHelpText");
  assert.ok(groupHelp.length < 3900, `group help is ${groupHelp.length} chars`);
  assert.ok(dmHelp.length < 3900, `DM help is ${dmHelp.length} chars`);
  assert.match(serverSource, /function telegramHelpChunks\(text, limit = 3900\)/);
  const chunks = Function("escapeTelegramHtml", `return (text, limit = 3900) => {${functionBody(serverSource, "telegramHelpChunks")}}`)(
    (value) => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
  )(`<b>${"&".repeat(5000)}</b>`);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => chunk.length <= 3900));
  assert.match(functionBody(serverSource, "sendTelegramHelp"), /for \(const chunk of telegramHelpChunks\(text\)\)/);
  const router = functionBody(serverSource, "handleMessage");
  assert.match(router, /isPrivateChat\(message\.chat\)[\s\S]*help\|commands[\s\S]*sendTelegramHelp\(chatId, dmBotHelpText\(\)\)/);
  assert.match(functionBody(serverSource, "handleGroupBotCommand"), /sendTelegramHelp\(chat\.id, groupBotHelpText\(\)\)/);
});

test("distinct raid and queue commands are not swallowed by chat-wide cooldowns", () => {
  const raid = functionBody(serverSource, "handleTelegramRaidCommand");
  const next = functionBody(serverSource, "handleTelegramNextRaidCommand");
  for (const body of [raid, next]) {
    assert.match(body, /raid-command:\$\{message\.message_id\}/);
    assert.doesNotMatch(body, /tgCommandOnCooldown\(chatId, "raid(?:-next)?"/);
  }
  assert.match(raid, /Raids run inside Telegram groups/);
  assert.match(raid, /Only group admins can start raids/);
  assert.match(raid, /isGroupBotAdmin\(chatId, userId, message\)/);
  assert.match(next, /Only group admins can add raids to the queue/);
  assert.match(functionBody(serverSource, "handleMessage"), /handleTelegramRaidCommand\(chatId, message, raidCommand\.argument, userId\)/);
});

test("bare /cancel stops an active group raid without opening the DM trading menu", () => {
  const groupHandler = functionBody(serverSource, "handleGroupBotCommand");
  const router = functionBody(serverSource, "handleMessage");
  assert.match(groupHandler, /const raidCancelCommand/);
  assert.match(groupHandler, /const explicitRaid = Boolean\(raidCancelCommand\[1\]\)/);
  assert.match(groupHandler, /raidQueueStatus\(chatId\)/);
  assert.match(groupHandler, /!explicitRaid && !hasDraft && !status\?\.active/);
  assert.match(groupHandler, /cancelActiveRaidForChat\(chatId\)/);
  const cancelAt = router.indexOf("const hadSession = Boolean(sessions.get(chatId))");
  const groupGateAt = router.indexOf("Nothing active to cancel in this group", cancelAt);
  const dmMenuAt = router.indexOf("await showMenu(chatId, userId)", cancelAt);
  assert.ok(cancelAt >= 0 && groupGateAt > cancelAt, "group /cancel guard is missing");
  assert.ok(dmMenuAt > groupGateAt, "group /cancel must return before the private trading menu");
});

test("new-group copy explains fast staged Solana and Robinhood scanning", () => {
  const menu = functionBody(serverSource, "groupBotMenuText");
  const modules = functionBody(serverSource, "groupBotModuleView");
  assert.match(menu, /Scan starts on/);
  assert.match(menu, /Solana \/ Robinhood CA \+ \$ticker/);
  assert.doesNotMatch(menu, /Everything's off/);
  assert.match(modules, /Starts on for new groups/);
  assert.match(modules, /weak\/no Solana matches get a bounded Robinhood check/);
  assert.match(modules, /Robinhood-only ticker lookup/);
});

test("DM Quick Buy posts controls before requesting slow market metadata", () => {
  const panel = functionBody(serverSource, "sendDmBuyPanel");
  const sendAt = panel.indexOf('telegram("sendMessage"');
  const metadataAt = panel.indexOf("alphaRadarFetchMc(mint)");
  assert.ok(sendAt >= 0, "initial buy panel send is missing");
  assert.ok(metadataAt > sendAt, "market metadata must start after the actionable panel is sent");
  assert.match(panel, /telegram\("editMessageText"/);
  assert.match(panel, /void alphaRadarFetchMc/);
  assert.doesNotMatch(panel, /await alphaRadarFetchMc/);
  assert.match(functionBody(serverSource, "dmBuyPanelText"), /Loading live market details/);
});

test("Buy Bot and Raid Bot shortcuts open their settings submenus directly", () => {
  const handler = functionBody(serverSource, "handleGroupBotCommand");
  assert.match(handler, /buybot\|raidbot\|raid/);
  assert.match(handler, /requestedCmd === "raidbot" \? "raid"/);
  assert.match(handler, /groupBotModuleView\(module, await getGroupBotEntry\(chatId\)\)/);
  assert.match(handler, /requestedCmd === "raid" && !arg/);
});

test("managed exits value and sell only the tokens acquired by that plan", () => {
  const scopedSellAmount = Function(
    "currentRawAmount",
    "percent",
    "baseRawAmount",
    functionBody(serverSource, "sellAmountForPercent")
  );
  assert.equal(scopedSellAmount(5_000n, 100, 1_000n), 1_000n);
  assert.equal(scopedSellAmount(500n, 100, 1_000n), 500n);
  assert.equal(scopedSellAmount(5_000n, 50, 1_000n), 500n);
  assert.match(functionBody(serverSource, "sellTradePlanWalletWithRetriesUnlocked"), /exactTokenUiAmount/);
  const evaluator = functionBody(serverSource, "evaluatePlanWalletPriceExit");
  assert.doesNotMatch(evaluator, /moves\.push\([\s\S]*marketMovePct/);
  assert.match(evaluator, /awaiting a second executable quote/);
});

test("Telegram quick trades acknowledge immediately and scan wallets concurrently", () => {
  const buy = functionBody(serverSource, "handleQuickBuyCallback");
  assert.ok(buy.indexOf("await ack(`⚡ Buying") < buy.indexOf("await tgExecuteQuickBuy("));
  const sell = functionBody(serverSource, "handleQuickSellCallback");
  assert.match(sell, /idempotencyKey: `tg-quick-sell-callback:\$\{query\.id\}`/);
  assert.match(sell, /if \(r\.outcomeUnknown\)/);
  assert.match(sell, /It will not be sent again/);
  assert.ok(sell.indexOf("await ack(`🔴 Selling") < sell.indexOf("await tgExecuteQuickSell("));
  assert.match(functionBody(serverSource, "tgExecuteQuickSell"), /runWithConcurrency\(wallets/);
  assert.match(functionBody(serverSource, "tgExecuteQuickSell"), /runWithConcurrency\(holders/);
});

test("Telegram balance, buy, sell, and receipts avoid serial provider waits", () => {
  const balances = functionBody(serverSource, "showWalletBalances");
  assert.match(balances, /primeSolBalancesBatch\(wallets\.map/);
  assert.match(balances, /priority: true/);

  const funding = functionBody(serverSource, "selectTgSolFundingWallet");
  assert.match(funding, /primeSolBalancesBatch\(candidates\.map/);
  assert.doesNotMatch(funding, /const first = await readBalance/);

  const buy = functionBody(serverSource, "tgExecuteQuickBuy");
  assert.match(buy, /Promise\.all\(\[readState\(\)\.catch/);
  const sell = functionBody(serverSource, "tgExecuteQuickSell");
  assert.match(sell, /getTokenBalanceForMintCached/);
  assert.doesNotMatch(sell, /walletTokenUiBalanceRead/);
  assert.match(functionBody(serverSource, "quickBuySendReceipt"), /Promise\.all/);
  assert.match(functionBody(serverSource, "tgQuickSellReceipt"), /Promise\.all/);
});

test("Telegram positions resolve token names and holdings without blocking on live quotes", () => {
  const view = functionBody(serverSource, "showPositionsOverview");
  assert.match(view, /buildPositionsOverview\(userId, \{ fast: true, priority: true \}\)/);
  assert.match(view, /tokenMetadataMapForMints/);
  assert.match(view, /identity\.symbol/);
  assert.match(view, /holdings:/);
  assert.match(functionBody(serverSource, "buildPositionsOverview"), /getTimedCache\(positionValueCache/);
});
