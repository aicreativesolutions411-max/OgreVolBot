import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { ethDomainLike, resolveEthDomainToAddress } from "../src/lib/ensResolver.js";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const mapPage = fs.readFileSync(new URL("../web/public/map.html", import.meta.url), "utf8");
const airdropPage = fs.readFileSync(new URL("../web/public/airdrop.html", import.meta.url), "utf8");

test("ENS wallet domains are recognized without confusing ordinary text", () => {
  assert.equal(ethDomainLike("slimewire.eth"), true);
  assert.equal(ethDomainLike("sub.wallet.eth"), true);
  assert.equal(ethDomainLike("wallet.sol"), false);
  assert.equal(ethDomainLike("not a wallet.eth"), false);
});

test("ENS wallet domains resolve to a checksummed EVM address", async () => {
  const address = await resolveEthDomainToAddress("slimewire-test.eth", {
    provider: { resolveName: async () => "0x000000000000000000000000000000000000dEaD" },
    timeoutMs: 1_000
  });
  assert.equal(address, "0x000000000000000000000000000000000000dEaD");
});

test("unresolved ENS names fail closed", async () => {
  const address = await resolveEthDomainToAddress("missing-slimewire-test.eth", {
    provider: { resolveName: async () => null },
    timeoutMs: 1_000
  });
  assert.equal(address, null);
});

test("web and Telegram fund maps route .eth names through the shared resolver", () => {
  assert.match(server, /import \{ ethDomainLike, resolveEthDomainToAddress \}/);
  assert.match(server, /const domainTarget = walletDomainLike\(rawTarget\)/);
  assert.match(server, /resolveWalletDomainToAddress\(rawTarget\)/);
  assert.match(server, /\(\?:sol\|eth\)/);
  assert.match(server, /callback_data: `mapw:\$\{address\}:funds`/);
  assert.match(mapPage, /\.sol\/\.eth domain/);
  assert.match(mapPage, /\(\?:sol\|eth\)/);
  assert.match(airdropPage, /\.sol\/\.eth/);
});
