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
  for (const command of ["menu", "help", "buy", "raid", "next"]) {
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

test("new-group copy matches behavior and names both supported chains", () => {
  const menu = functionBody(serverSource, "groupBotMenuText");
  const modules = functionBody(serverSource, "groupBotModuleView");
  assert.match(menu, /Scan starts on/);
  assert.match(menu, /Solana \+ Robinhood CA/);
  assert.doesNotMatch(menu, /Everything's off/);
  assert.match(modules, /Starts on for new groups/);
  assert.match(modules, /Robinhood <code>0x…<\/code>/);
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
