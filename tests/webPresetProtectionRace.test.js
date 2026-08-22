import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const ggSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const funHtml = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const funWorker = fs.readFileSync(new URL("../web/public/fun-sw.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const marker = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`, "g");
  const match = marker.exec(source);
  assert.ok(match, `${name} was not found`);
  const start = match.index + match[0].length;
  let depth = 1;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i);
  }
  assert.fail(`${name} did not have a closing brace`);
}

function assertInlineScriptsParse(source, label) {
  const scriptPattern = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let index = 0;
  while ((match = scriptPattern.exec(source))) {
    if (/application\/ld\+json/i.test(match[1]) || /\bsrc=/i.test(match[1]) || !match[2].trim()) continue;
    new vm.Script(match[2], { filename: `${label}:script-${++index}` });
  }
}

test("desktop mirrors keep preset loading ahead of every trade submit", () => {
  assert.equal(indexSource, ggSource, "desktop terminal mirrors must remain byte-identical");
  assertInlineScriptsParse(indexSource, "index.html");
  assertInlineScriptsParse(ggSource, "gg.html");

  const load = functionBody(indexSource, "ensurePresetsLoaded");
  assert.match(load, /presetsLoadedToken===token/);
  assert.match(load, /presetsLoadPromise&&presetsLoadPromise\.token===token/);
  assert.match(load, /return presetsLoadPromise/);
  assert.match(load, /token!==state\.token/);
  assert.match(load, /presetsLoadedToken=token;return true/);

  const buy = functionBody(indexSource, "execBuy");
  const accountAt = buy.indexOf("await ensureTradeReady()");
  const presetsAt = buy.indexOf("await ensurePresetsLoaded()");
  const submitAt = buy.indexOf('postTrade("/api/web/trade/buy"');
  assert.ok(accountAt >= 0 && presetsAt > accountAt && submitAt > presetsAt,
    "a buy must wait for the signed-in account's presets before it can submit");
  assert.match(buy, /if\(!\(await ensurePresetsLoaded\(\)\)\).*Buy not submitted.*return/);
  assert.match(buy, /state\.activeTradePreset&&!activeTradePresetObj\(\).*return/);
});

test("desktop buys fail closed unless Manual or HOLD was selected", () => {
  const buy = functionBody(indexSource, "execBuy");
  assert.ok(buy.indexOf("await ensurePresetsLoaded()") < buy.indexOf("activeTradePresetObj()"));
  assert.match(buy, /presetId=String\(state\.activeTradePreset\|\|""\)\.trim\(\)/);
  assert.match(buy, /body\.presetId=presetId;body\.protectionRequired=true;body\.autoExit=true/);
  assert.match(buy, /else if\(!presetId\)body\.disableAutoExit=true/);
  assert.doesNotMatch(buy, /else body\.disableAutoExit=true/);

  const quickBuy = functionBody(indexSource, "execQuickBuy");
  assert.match(quickBuy, /if\(!\(await ensureTradeReady\(\)\)\)return/);
  assert.match(quickBuy, /presetId=String\(q\.presetId\|\|""\)\.trim\(\)/);
  assert.match(quickBuy, /if\(presetId&&!p\).*Buy not submitted/);
  assert.match(quickBuy, /body\.protectionRequired=true;if\(presetId\)body\.presetId=presetId;body\.autoExit=true/);
  assert.match(quickBuy, /else body\.disableAutoExit=true/);
});

test("desktop Swap and Robinhood buys preserve the selected preset until submission", () => {
  assert.equal(indexSource, ggSource, "desktop terminal mirrors must remain byte-identical");

  const swap = functionBody(indexSource, "execSwap");
  assert.ok(swap.indexOf("await ensurePresetsLoaded()") < swap.indexOf('jpost("/api/web/trade/buy"'),
    "Swap must resolve presets before a Solana buy can submit");
  assert.ok(swap.indexOf("await ensurePresetsLoaded()") < swap.indexOf('jpost("/api/web/rh/trade"'),
    "Swap must resolve presets before a Robinhood buy can submit");
  assert.match(swap, /if\(presetId&&!preset\).*Swap not submitted.*return/);
  assert.match(swap, /presetId,protectionRequired:true,autoExit:true/);
  assert.match(swap, /body\.presetId=presetId;body\.protectionRequired=true;body\.autoExit=true/);
  assert.match(swap, /else body\.disableAutoExit=true/);

  const robinhood = functionBody(indexSource, "rhTrade");
  assert.ok(robinhood.indexOf("await ensurePresetsLoaded()") < robinhood.indexOf('jpost("/api/web/rh/trade"'),
    "all normal and quick Robinhood buys must resolve the active preset first");
  assert.match(robinhood, /activePresetId&&!activePreset.*Buy not submitted.*return/);
  assert.match(robinhood, /presetId:activePresetId,protectionRequired:true,autoExit:true/);
  assert.match(robinhood, /else\{tradeOpts\.disableAutoExit=true/,
    "only the explicit no-preset path may send disableAutoExit");
});

test("Wallet, Go, and Fun dedupe preset loading without erasing a saved choice on failure", () => {
  const load = functionBody(funSource, "ensurePresetsLoaded");
  assert.match(load, /state\.presetsLoadedScope === scope/);
  assert.match(load, /state\.presetsLoadPromise\?\.scope === scope/);
  assert.match(load, /return state\.presetsLoadPromise/);
  assert.match(load, /scope !== presetsAccountScope\(\)/);
  assert.match(load, /!result\.ok \|\| !result\.data\?\.ok \|\| !result\.data\.presets\) return false/);

  const legacyLoad = functionBody(funSource, "loadPresets");
  assert.match(legacyLoad, /ensurePresetsLoaded\(true\)/);
  assert.doesNotMatch(legacyLoad, /activePresetId\s*=/,
    "a failed or partial fetch must not silently turn a saved protected preset into Manual");
});

test("Wallet, Go, and Fun buy previews fail closed and freeze their requested protection", () => {
  const prepare = functionBody(funSource, "prepareBuyProtection");
  assert.ok(prepare.indexOf("await ensurePresetsLoaded()") < prepare.indexOf("activePreset()"));
  assert.match(prepare, /presetId && !preset[\s\S]*Buy not submitted[\s\S]*return false/);
  assert.match(prepare, /body\.protectionRequired = true/);
  assert.match(prepare, /if \(presetId\) body\.presetId = presetId/);
  assert.match(prepare, /else \{[\s\S]*body\.disableAutoExit = true/);
  assert.match(prepare, /Boolean\(presetId \|\| buyBodyHasProtection\(body\)\)/,
    "saved presets and custom TP/SL must both require protection");

  const review = functionBody(funSource, "reviewTradePayload");
  assert.ok(review.indexOf("await prepareBuyProtection(pending)") < review.indexOf('post("/api/web/transaction/preview"'),
    "protection must be loaded and frozen before the buy preview can be submitted");
});

test("Wallet and Go publish the protected-buy release through a fresh app cache", () => {
  assert.match(funHtml, /fun\.js\?v=95/);
  assert.match(funWorker, /slimewallet-v36/);
  assert.match(funWorker, /slimewire-fun-v93/);
  assert.match(funWorker, /fun\.js\?v=95/);
});

test("terminal app resolves selected presets once per account and never erases a stale protected choice", () => {
  const load = functionBody(appSource, "ensureAppPresetsLoaded");
  assert.match(load, /presetsLoadedScope === scope/);
  assert.match(load, /presetsLoadPromise\?\.scope === scope/);
  assert.match(load, /return presetsLoadPromise/);
  assert.match(load, /scope !== appPresetsScope\(\)/);
  assert.match(load, /if \(!data\?\.presets\) return false/);

  const resolve = functionBody(appSource, "resolveSelectedTradePresetForBuy");
  assert.match(resolve, /if \(!presetId\) return \{ presetId: "", preset: null \}/);
  assert.match(resolve, /await ensureAppPresetsLoaded\(\)/);
  assert.match(resolve, /selected trade protection.*Buy not submitted/);
  assert.match(resolve, /selected trade preset is unavailable.*Buy not submitted/);

  const preserve = functionBody(appSource, "ensureSelectedPresetsStillExist");
  assert.doesNotMatch(preserve, /selectedTradePresetId && !presetById/,
    "a failed or stale load must remain fail-closed instead of silently selecting Manual");
});

test("every managed terminal buy sends frozen protection and connected wallets reject protected buys", () => {
  const apply = functionBody(appSource, "applyManagedBuyProtection");
  assert.match(apply, /presetId: selected\.presetId/);
  assert.match(apply, /protectionRequired: true/);
  assert.match(apply, /payload\.disableAutoExit = true/);
  assert.match(apply, /if \(custom\?\.enabled\)/);

  for (const name of ["executeWebBuy", "executeQuickBuyAmount", "executeChartConnectedBuy"]) {
    const body = functionBody(appSource, name);
    assert.ok(body.indexOf("await resolveSelectedTradePresetForBuy()") < body.indexOf('api("/api/web/trade/buy"'),
      `${name} must resolve a selected preset before spending`);
    assert.match(body, /applyManagedBuyProtection\(/, `${name} must use the shared fail-closed payload builder`);
  }

  const browser = functionBody(appSource, "executeConnectedBrowserTrade");
  assert.ok(browser.indexOf("await resolveSelectedTradePresetForBuy()") < browser.indexOf('api("/api/web/browser-trade/order"'),
    "connected-wallet buys must reject selected protection before building an order");
  assert.match(browser, /Protected presets require a managed SlimeWire wallet/);

  const protectedModal = functionBody(appSource, "confirmProtectedBuyModal");
  assert.match(protectedModal, /isConnectedTradeWallet\(form\.walletIndex\)[\s\S]*Protected Buy requires a managed SlimeWire wallet/);

  const quickPreset = functionBody(appSource, "quickPresetTrade");
  assert.match(quickPreset, /await resolveSelectedTradePresetForBuy\(\)/);
  assert.match(quickPreset, /protectionRequired: true/);
  assert.match(quickPreset, /if \(savedPresetId\) payload\.presetId = savedPresetId/,
    "saved presets carry their server ID while built-in protected-buy recipes remain custom protection");
});

test("terminal protection payload builder behaves fail-closed for preset, custom, and Manual buys", () => {
  const body = functionBody(appSource, "applyManagedBuyProtection");
  const applyProtection = vm.runInNewContext(`(function (payload, selected, custom = null) {${body}})`);

  const saved = { slippageBps: "500", disableAutoExit: true };
  assert.equal(applyProtection(saved, {
    presetId: "preset-123",
    preset: { takeProfitPct: "25", stopLossPct: "8", sellDelay: "off", sellPercent: "100", slippageBps: "420" }
  }), true);
  assert.equal(saved.presetId, "preset-123");
  assert.equal(saved.protectionRequired, true);
  assert.equal(saved.autoExit, true);
  assert.equal(saved.stopLossPct, "8");
  assert.equal(saved.disableAutoExit, undefined);

  const custom = {};
  assert.equal(applyProtection(custom, { presetId: "", preset: null }, {
    enabled: true,
    takeProfitPct: "40",
    stopLossPct: "10",
    sellDelay: "off",
    sellPercent: "100"
  }), true);
  assert.equal(custom.presetId, undefined);
  assert.equal(custom.protectionRequired, true);
  assert.equal(custom.stopLossPct, "10");

  const manual = { presetId: "stale", protectionRequired: true, autoExit: true };
  assert.equal(applyProtection(manual, { presetId: "", preset: null }), false);
  assert.equal(manual.disableAutoExit, true);
  assert.equal(manual.presetId, undefined);
  assert.equal(manual.protectionRequired, undefined);
  assert.equal(manual.autoExit, undefined);
});

test("desktop existing-protection conflicts route to the reviewed Go add flow", () => {
  for (const html of [indexSource, ggSource]) {
    assert.match(html, /function existingProtectionAddRequired\(result\)/);
    assert.match(html, /Number\(result&&result\.status\)===409/);
    assert.match(html, /Review add in SlimeWire Go/);
    assert.match(html, /\/fun\/\?ca=/);
    assert.match(html, /No funds moved in the rejected desktop request/);
    assert.match(html, /if\(existingProtectionAddRequired\(result\)\)\{showExistingProtectionAddReview\(mint\);return;\}/);
    assert.match(html, /if\(existingProtectionAddRequired\(res\)\)\{done\(\);showExistingProtectionAddReview\(swapTok\.mint\);return;\}/);
  }
});
