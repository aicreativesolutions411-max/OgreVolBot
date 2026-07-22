import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const homeSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const homeMirrorSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");

function functionBody(source, name) {
  const match = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`).exec(source);
  assert.ok(match, `${name} missing`);
  const paramsStart = source.indexOf("(", match.index);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    else if (source[index] === ")" && --paramsDepth === 0) { paramsEnd = index; break; }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    else if (source[index] === "}" && --depth === 0) return source.slice(bodyStart + 1, index);
  }
  return "";
}

function compileAsyncFunction(name, params, deps = {}) {
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const depNames = Object.keys(deps);
  const factory = new AsyncFunction(...depNames, `return async function(${params.join(",")}) {${functionBody(serverSource, name)}};`);
  return factory(...depNames.map((key) => deps[key]));
}

test("volume token funding is explicit, bounded, and defaults to SOL", () => {
  const body = functionBody(serverSource, "volumeBotFundingRequest");
  const parse = new Function("body", "volumeBotError", `return (function(body) {${body}})(body);`);
  const error = (message) => new Error(message);

  assert.deepEqual(parse({}, error), { fundingAsset: "sol", tokenSeedPercent: 0 });
  assert.deepEqual(parse({ fundingAsset: "token", tokenSeedPercent: "25" }, error), {
    fundingAsset: "token",
    tokenSeedPercent: 25
  });
  assert.throws(() => parse({ fundingAsset: "banana" }, error), /SOL or held token/i);
  assert.throws(() => parse({ fundingAsset: "token", tokenSeedPercent: "0" }, error), /1% to 50%/i);
  assert.throws(() => parse({ fundingAsset: "token", tokenSeedPercent: "51" }, error), /1% to 50%/i);
});

test("held-token capital cannot cross the source wallet's protected SOL floor", () => {
  const body = functionBody(serverSource, "volumeBotSpendableSourceLamports");
  const spendable = new Function("plan", "balanceLamports", `return (function(plan, balanceLamports) {${body}})(plan, balanceLamports);`);

  assert.equal(spendable({ config: { fundingAsset: "sol" } }, 1_250_000_000), 1_250_000_000n);
  assert.equal(spendable({ config: { fundingAsset: "token" }, tokenFunding: { sourceSolFloorLamports: "1000000000" } }, 1_250_000_000), 250_000_000n);
  assert.equal(spendable({ config: { fundingAsset: "token" }, tokenFunding: { sourceSolFloorLamports: "1000000000" } }, 990_000_000), 0n);
});

test("held-token seed sell is durable and never runs from the browser", () => {
  const start = functionBody(serverSource, "webStartVolumeBotCore");
  const process = functionBody(serverSource, "processVolumeBotPlan");
  const seed = functionBody(serverSource, "processVolumeBotTokenSeed");
  const rolling = functionBody(serverSource, "runRollingVolumeBotStep");

  assert.match(start, /volumeBotFundingRequest\(body\)/);
  assert.match(start, /completeVolumeTokenAccountRead/);
  assert.match(start, /sourceSolFloorLamports/);
  assert.match(process, /processVolumeBotTokenSeed/);
  assert.match(seed, /runVolumeBotExternalAction/);
  assert.match(seed, /kind:\s*"token-seed-sell"/);
  assert.match(seed, /sellVolumeTokenSeed/);
  const exactSell = functionBody(serverSource, "sellVolumeTokenSeed");
  assert.match(exactSell, /withExitSellLock/);
  assert.match(exactSell, /sellTokenAmountFromWallet/);
  assert.match(exactSell, /exactTokenUiAmount/);
  assert.match(exactSell, /skipTradeFee:\s*true/);
  assert.match(rolling, /volumeBotSpendableSourceLamports/);
  assert.doesNotMatch(appSource, /sellTokenFromWallet/);
  assert.doesNotMatch(funSource, /sellTokenFromWallet/);
});

test("held-token seed sells the reserved slice once through the durable action boundary", async () => {
  let action = null;
  let exactSell = null;
  let finalized = 0;
  const seed = await compileAsyncFunction("processVolumeBotTokenSeed", ["plan", "sourceRecord", "{ slippageBps, persist } = {}"], {
    runVolumeBotExternalAction: async (_plan, _persist, pending, task) => { action = pending; return task(); },
    sellVolumeTokenSeed: async (_wallet, _mint, rawAmount, decimals, slippage, userId) => {
      exactSell = { rawAmount, decimals, slippage, userId };
      return { signature: "seed-sig", outputLamports: "123000000" };
    },
    finalizeVolumeBotTokenSeed: async () => { finalized += 1; },
    friendlyError: (error) => String(error?.message || error),
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => { throw new Error("confirmed seed must not enter recovery"); },
    volumeBotLogPush: () => {}
  });
  const plan = {
    id: "plan",
    userId: "user",
    tokenMint: "TOKEN",
    botStage: "running",
    startStage: "token-seed-ready",
    config: { fundingAsset: "token", tokenSeedPercent: 25 },
    tokenFunding: { tokenRawBefore: "1000", tokenSeedRaw: "250", tokenDecimals: 6 },
    stats: {}
  };

  assert.equal(await seed(plan, { publicKey: "SOURCE" }, { slippageBps: 600, persist: async () => true }), true);
  assert.equal(action.kind, "token-seed-sell");
  assert.equal(action.publicKey, "SOURCE");
  assert.equal(action.tokenRawBefore, "1000");
  assert.equal(action.sellRawAmount, "250");
  assert.equal(action.expectedRawAfter, "750");
  assert.equal(action.sellPercent, 25);
  assert.deepEqual(exactSell, { rawAmount: 250n, decimals: 6, slippage: 600, userId: "user" });
  assert.equal(finalized, 1);
});

test("a confirmed seed checkpoint is finalized after restart without another sell", async () => {
  let actionCalls = 0;
  let finalized = 0;
  const seed = await compileAsyncFunction("processVolumeBotTokenSeed", ["plan", "sourceRecord", "{ slippageBps, persist } = {}"], {
    runVolumeBotExternalAction: async () => { actionCalls += 1; },
    sellVolumeTokenSeed: async () => { actionCalls += 1; },
    finalizeVolumeBotTokenSeed: async () => { finalized += 1; },
    friendlyError: (error) => String(error?.message || error),
    volumeBotTradeOutcomeAmbiguous: () => false,
    volumeBotEnterRecovery: () => {},
    volumeBotLogPush: () => {}
  });
  const plan = {
    botStage: "running",
    startStage: "token-seed-ready",
    config: { fundingAsset: "token", tokenSeedPercent: 25 },
    tokenFunding: { tokenRawBefore: "1000", tokenSeedRaw: "250", tokenDecimals: 6 },
    lastExternalAction: { kind: "token-seed-sell", status: "confirmed" },
    stats: {}
  };

  assert.equal(await seed(plan, { publicKey: "SOURCE" }, { slippageBps: 600, persist: async () => true }), true);
  assert.equal(actionCalls, 0);
  assert.equal(finalized, 1);
});

test("site and Telegram expose the same held-token funding choice and warning", () => {
  assert.match(appSource, /fundingAsset/);
  assert.match(appSource, /tokenSeedPercent/);
  assert.match(appSource, /Held token/);
  assert.match(appSource, /returns as SOL/i);
  assert.match(funSource, /data-volume-funding/);
  assert.match(funSource, /tokenSeedPercent/);
  assert.match(homeSource, /id="vlFunding"/);
  assert.match(homeSource, /tokenSeedPercent:tokenSeedPercent/);
  assert.match(homeSource, /sourceWalletPublicKey/);
  assert.match(homeSource, /recovered value returns as SOL/i);
  assert.equal(homeSource, homeMirrorSource);
  assert.match(serverSource, /vbfund:token:25/);
  assert.match(serverSource, /vbfund:sol/);
  assert.match(serverSource, /returns as SOL/i);
});
