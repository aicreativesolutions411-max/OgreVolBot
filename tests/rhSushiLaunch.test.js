import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  RH_SUSHI,
  rhFindSushiLaunchSalt,
  rhSushiInitialTick,
  rhSushiLaunchConfigured,
} from "../src/lib/robinhoodChain.js";

test("Robinhood Sushi addresses are distinct from the legacy Uniswap venue", () => {
  assert.equal(RH_SUSHI.launchFactory, "0xd611FEca4504dAa1Ab09fa36AD20F0C4153C24FA");
  assert.equal(RH_SUSHI.v3Factory, "0xe51960f1b45f1c9fb6d166e6a884f866fc70433b");
  assert.equal(RH_SUSHI.v3PositionManager, "0x51d0e5188afe12d502e29d982d20c190e7816107");
  assert.equal(RH_SUSHI.v2Factory, "0xe52abd50ad151ecdf56427effd715e703696a6b1");
  assert.equal(RH_SUSHI.v2Router, "0x9a55d3d0c0f09859c7869510f53ed0a30b340766");
  assert.match(RH_SUSHI.quoteApi, /\/4663$/);
});

test("starting market cap becomes a bounded 1%-pool tick", () => {
  const low = rhSushiInitialTick({ marketCapUsd: 5_000, supplyTokens: 1_000_000_000, ethUsd: 2_000 });
  const high = rhSushiInitialTick({ marketCapUsd: 50_000, supplyTokens: 1_000_000_000, ethUsd: 2_000 });
  assert.ok(Object.is(low % RH_SUSHI.tickSpacing, 0) || Object.is(low % RH_SUSHI.tickSpacing, -0));
  assert.ok(Object.is(high % RH_SUSHI.tickSpacing, 0) || Object.is(high % RH_SUSHI.tickSpacing, -0));
  assert.ok(high > low);
  assert.throws(() => rhSushiInitialTick({ marketCapUsd: 0, supplyTokens: 1, ethUsd: 1 }), /positive/);
});

test("CREATE2 salt guarantees the launch token sorts below WETH", () => {
  const result = rhFindSushiLaunchSalt({
    factoryAddress: "0x1111111111111111111111111111111111111111",
    name: "Slime Test",
    symbol: "SLT",
    supplyTokens: 1_000_000_000,
    contractUri: "https://slimewire.org/meta/test",
  });
  assert.match(result.salt, /^0x[0-9a-f]{64}$/i);
  assert.match(result.tokenAddress, /^0x[0-9a-f]{40}$/i);
  assert.ok(BigInt(result.tokenAddress) < BigInt(RH_SUSHI.weth));
  assert.ok(result.attempts >= 1 && result.attempts <= 2_048);
  assert.equal(rhSushiLaunchConfigured("0x1111111111111111111111111111111111111111"), true);
  assert.equal(rhSushiLaunchConfigured(""), false);
});

test("launch contract permanently locks liquidity and has no withdrawal path", () => {
  const source = fs.readFileSync(new URL("../contracts/SlimeSushiLaunchRH.sol", import.meta.url), "utf8");
  const artifact = JSON.parse(fs.readFileSync(new URL("../src/lib/rh-sushi-launch.json", import.meta.url), "utf8"));
  const lockerAbi = artifact.contracts.SlimeSushiPositionLockerRH.abi;
  const lockerFunctions = lockerAbi.filter((row) => row.type === "function").map((row) => row.name);
  assert.match(source, /recipient:\s*address\(locker\)/);
  assert.match(source, /amount1Desired:\s*0/);
  assert.match(source, /dust burn failed/);
  assert.deepEqual(lockerFunctions.sort(), ["collectFees", "creatorOf", "launchFactory", "onERC721Received", "positionManager", "register"].sort());
  assert.doesNotMatch(lockerFunctions.join(" "), /withdraw|decreaseLiquidity|transferFrom/i);
});

test("web launch defaults to the live automatic Sushi factory", () => {
  const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
  const web = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
  assert.match(server, /RH_SUSHI_LAUNCH_FACTORY_ADDRESS/);
  assert.match(server, /RH_SUSHI_LAUNCH_FACTORY_ADDRESS \|\| RH_SUSHI\.launchFactory/);
  assert.match(server, /rhLaunchTokenOnSushi/);
  assert.match(server, /sushiQuoteRhSwap/);
  assert.match(server, /automaticMarket[\s\S]*rhDeployToken/);
  assert.match(web, /Automatic Sushi launch/);
  assert.match(web, /liquidity permanently locked/);
  assert.match(web, /d\.automaticMarket\?'Sushi V3 market live/);
});
