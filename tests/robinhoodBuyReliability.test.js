import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ethers } from "ethers";
import { RH_UNIV3, rhBuySpendPlanFromWei } from "../src/lib/robinhoodChain.js";

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), "utf8");
const chain = read("../src/lib/robinhoodChain.js");
const server = read("../src/index.js");

test("minimum SOL-funded Robinhood buy keeps a usable swap amount at observed fees", () => {
  const bridged = ethers.parseEther("0.000193");
  const plan = rhBuySpendPlanFromWei({
    availableWei: bridged,
    quotedWei: bridged,
    maxFeePerGasWei: 159_492_000n
  });

  assert.ok(Number(plan.spendEth) >= 0.00001, plan);
  assert.ok(Number(plan.gasReserveEth) < 0.00035, plan);
  assert.ok(BigInt(plan.spendWei) + BigInt(plan.gasReserveWei) <= bridged);
});

test("fee plan never spends a negative amount when gas is unusually high", () => {
  const plan = rhBuySpendPlanFromWei({
    availableWei: ethers.parseEther("0.00005"),
    quotedWei: ethers.parseEther("0.00005"),
    maxFeePerGasWei: 2_000_000_000n
  });

  assert.equal(plan.spendWei, "0");
  assert.ok(BigInt(plan.gasReserveWei) > 0n);
});

test("explicit user reserve remains honored", () => {
  const requested = ethers.parseEther("0.0002");
  const plan = rhBuySpendPlanFromWei({
    availableWei: ethers.parseEther("0.001"),
    quotedWei: ethers.parseEther("0.001"),
    maxFeePerGasWei: 1n,
    userReserveWei: requested
  });

  assert.equal(plan.gasReserveWei, requested.toString());
  assert.ok(BigInt(plan.spendWei) <= ethers.parseEther("0.0008"));
});

test("Relay uses the current quote API with availability-only legacy fallback", () => {
  assert.match(chain, /const endpoints = \["\/quote\/v2", "\/quote"\]/);
  assert.match(chain, /\[404, 405, 501\]\.includes\(response\.status\)/);
  assert.doesNotMatch(chain, /fetch\(`\$\{RELAY_API\}\/quote`/);
});

test("Robinhood trades use live fee reserve, three quote routes, and failure audit", () => {
  assert.match(server, /await rhBuySpendPlan\(\{/);
  assert.doesNotMatch(server, /reserveEth = Math\.max\(0\.00035/);
  assert.match(server, /quote = await uniswapQuoteRhSwap/);
  assert.match(server, /quote = await sushiQuoteRhSwap/);
  assert.match(server, /web_rh_trade_failed/);
  assert.match(server, /No executable Robinhood trade route right now/);
});

test("direct Uniswap fallback is pinned to one internally consistent deployment", () => {
  assert.equal(RH_UNIV3.factory, "0x1f7d7550B1b028f7571E69A784071F0205FD2EfA");
  assert.equal(RH_UNIV3.swapRouter, "0xCaf681a66D020601342297493863E78C959E5cb2");
  assert.equal(RH_UNIV3.quoterV2, "0x33e885eD0Ec9bF04EcfB19341582aADCb4c8A9E7");
  assert.match(chain, /export async function uniswapQuoteRhSwap/);
  assert.match(chain, /"uniswap-approve"/);
  assert.match(chain, /"uniswap-swap"/);
  assert.match(chain, /unwrapWETH9/);
});

test("automatic Robinhood launch waits on the bridge quote, not an unreachable fixed balance", () => {
  assert.match(server, /quotedEth \* 0\.72/);
  assert.doesNotMatch(server, /Math\.max\(requiredEthFloor, quotedEth \* 0\.72\)/);
  assert.match(server, /rhLaunchTokenOnSushi/);
});
