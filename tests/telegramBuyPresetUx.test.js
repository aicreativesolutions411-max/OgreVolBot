import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `missing function ${name}`);
  const signature = source.slice(start, start + 1_000);
  const bodyStart = signature.match(/\)\s*\{/);
  assert.ok(bodyStart, `missing body for ${name}`);
  const brace = start + bodyStart.index + bodyStart[0].lastIndexOf("{");
  let depth = 0;
  for (let index = brace; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
    if (depth === 0) return source.slice(brace + 1, index);
  }
  throw new Error(`unterminated function ${name}`);
}

test("Telegram preset storage includes explicit manual, protected, and ladder exits", () => {
  const prefs = functionBody(serverSource, "userBuyPrefs");
  assert.match(prefs, /exitMode/);
  assert.match(prefs, /ladderPreset/);
  assert.match(serverSource, /TG_QUICK_EXIT_LADDERS/);
  assert.match(serverSource, /pct: 200, sellPercent: 100/);
  assert.match(serverSource, /pct: 300, sellPercent: 100/);
  assert.match(serverSource, /pct: 900, sellPercent: 100/);
  const setter = functionBody(serverSource, "setBuyPref");
  assert.match(setter, /withFileLock\(buyPrefsPath\(\)/);
  assert.ok(setter.indexOf("await writeJsonFile") < setter.indexOf("buyPrefsCache = s"));
  assert.match(setter, /kind === "exitMode"/);
  assert.match(setter, /kind === "ladderPreset"/);
  assert.match(setter, /u\.exitMode === "protected"/);
});

test("Telegram preset editor exposes amount, TP, SL off, ladder choices, and manual exit", () => {
  const view = functionBody(serverSource, "presetEditorView");
  assert.match(view, /Manual/);
  assert.match(view, /TP\/SL/);
  assert.match(view, /Ladder/);
  assert.match(view, /pe:m:manual/);
  assert.match(view, /pe:m:protected/);
  assert.match(view, /pe:m:ladder/);
  assert.match(view, /pe:l:safe/);
  assert.match(view, /pe:l:balanced/);
  assert.match(view, /pe:l:runner/);
  assert.match(view, /pe:tpx/);
  assert.match(view, /pe:slx/);
  assert.match(view, /Existing armed exits keep running until you cancel them/);
  assert.match(view, /grants\/renews 30-day managed-wallet automation/);

  const callback = functionBody(serverSource, "handlePresetEditorCallback");
  assert.match(callback, /String\(userId\) !== String\(owner\)/);
  assert.match(callback, /"pe_tp"/);
  assert.match(callback, /"pe_sl"/);
  assert.match(callback, /setBuyPref\(userId, "exitMode"/);
  assert.match(callback, /setBuyPref\(userId, "ladderPreset"/);
});

test("DM /presets no longer hides exits behind an amount-only menu", () => {
  const menu = functionBody(serverSource, "buyPresetsMenu");
  assert.match(menu, /Saved Quick Buy/);
  assert.match(menu, /Exit:/);
  assert.match(menu, /Edit .*tgQuickExitButtonLabel/);
  assert.match(menu, /Manual exit/);
  assert.match(functionBody(serverSource, "dmSettingsMenu"), /Saved Quick Buy/);
  assert.match(serverSource, /isPrivateChat\(message\.chat\) \? buyPresetsMenu\(prefs\) : presetEditorView\(prefs, userId\)/);
  assert.match(serverSource, /\{ command: "presets", description: "Your Quick Buy amount \+ TP\/SL exits" \}/);
});

test("all current Solana preset amount buttons apply the saved exit and report arming", () => {
  const receiptKeyboard = functionBody(serverSource, "quickBuyReceiptKeyboard");
  assert.match(receiptKeyboard, /qbp:\$\{a\}:\$\{mint\}/);
  assert.match(receiptKeyboard, /qbp:\$\{custom\}:\$\{mint\}/);
  assert.match(receiptKeyboard, /Saved exit:/);
  assert.match(receiptKeyboard, /\$\{a\} SOL/);
  assert.doesNotMatch(receiptKeyboard, /◎/);

  const buyPanel = functionBody(serverSource, "telegramQuickBuyPanelKeyboard");
  assert.match(buyPanel, /qbp:\$\{amount\}:\$\{target\}/);
  assert.match(buyPanel, /tgQuickExitButtonLabel\(prefs\)/);
  assert.match(buyPanel, /\$\{amount\} SOL/);
  assert.doesNotMatch(buyPanel, /◎/);

  const presetBuy = functionBody(serverSource, "tgExecuteQuickBuyPreset");
  assert.match(presetBuy, /tgQuickExitConfig\(prefs\)/);
  assert.ok(presetBuy.indexOf("grantTelegramQuickExitPermission") < presetBuy.indexOf("tgExecuteQuickBuy(userId"));
  assert.match(presetBuy, /No buy was sent/);
  assert.match(presetBuy, /takeProfitLadder: exit\.takeProfitLadder/);
  assert.match(presetBuy, /breakEvenAfterTp1: exit\.mode === "ladder" && exit\.stopLossPct > 0/);
  assert.match(presetBuy, /selectTgSolFundingWallet/);
  assert.match(presetBuy, /webTradeBuy\(userId, \{/);
  assert.match(presetBuy, /walletPublicKey: selected\.wallet\.publicKey/);
  assert.match(presetBuy, /protectionRequired: true/);
  assert.match(presetBuy, /tradeAttemptId: attemptId/);

  const callback = functionBody(serverSource, "handleQuickBuyPresetCallback");
  assert.match(callback, /\(\?:\(\[\\d\.\]\+\):\)\?/);
  assert.match(callback, /quickBuySendReceipt[\s\S]*armError/);
  assert.match(functionBody(serverSource, "applyTgQuickBuyInput"), /tgExecuteQuickBuyPreset/);

  const pvpFeed = functionBody(serverSource, "pvpBroadcastTradeEvents");
  assert.match(pvpFeed, /callback_data: `qbp:0\.05:\$\{ev\.tokenMint\}`/);
  assert.match(pvpFeed, /callback_data: `rqbp:0\.05:\$\{ev\.tokenMint\}`/);
  assert.doesNotMatch(pvpFeed, /callback_data: `(?:qb|rqb):/);
});

test("Robinhood preset buys apply saved exits with independent durable ladder slots", () => {
  const buyPanel = functionBody(serverSource, "telegramQuickBuyPanelKeyboard");
  assert.match(buyPanel, /rqbp:\$\{amount\}:\$\{target\}/);
  const handler = functionBody(serverSource, "handleRhQuickTradeCallback");
  assert.match(handler, /tgArmRhQuickExit/);
  assert.ok(handler.indexOf("grantTelegramQuickExitPermission") < handler.indexOf("webRhTrade(userId"));
  assert.match(handler, /Protected buy not sent/);
  assert.match(handler, /Exit armed:/);
  assert.match(handler, /Exit: <b>Manual/);

  const arm = functionBody(serverSource, "tgArmRhQuickExit");
  assert.match(arm, /runIdempotentMoneyOp/);
  assert.match(arm, /tg-ladder-stop/);
  assert.match(arm, /sellPercent = index === exit\.takeProfitLadder\.length - 1/);
  assert.match(arm, /closesPosition: index === exit\.takeProfitLadder\.length - 1/);

  const rhGuard = functionBody(serverSource, "webRhArmGuard");
  assert.match(rhGuard, /exitSlot/);
  assert.match(rhGuard, /exitGroup/);
  assert.match(rhGuard, /String\(g\.exitSlot \|\| "single"\) === exitSlot/);
  assert.match(serverSource, /position closed by \$\{guard\.trigger \|\| "exit"\}/);
});

test("protected Telegram taps durably renew permission before any trade submission", () => {
  const grant = functionBody(serverSource, "grantTelegramQuickExitPermission");
  assert.match(grant, /updateWebAutomationPermission\(userId, \{ action: "enable", ttlHours: 24 \* 30 \}\)/);
  assert.match(grant, /webAutomationPermissionActive\(profile\)/);
  assert.match(grant, /Could not save managed-wallet automation permission\. No buy was sent/);
  assert.match(grant, /normalizeWebAutomationPermission/);
});

test("preset receipts distinguish armed, manual, and arm-failure outcomes", () => {
  const receipt = functionBody(serverSource, "quickBuySendReceipt");
  assert.match(receipt, /Buy landed, but the saved exit did not arm/);
  assert.match(receipt, /Exit armed server-side/);
  assert.match(receipt, /no automatic selling/);
});
