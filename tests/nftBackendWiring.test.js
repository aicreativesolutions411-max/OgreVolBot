import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/index.js", import.meta.url), "utf8");
const appSource = await readFile(new URL("../web/public/app.js", import.meta.url), "utf8");

test("NFT collection, mint, campaign, and claim routes stay wired", () => {
  for (const route of [
    "/api/web/nft/collection/create",
    "/api/web/nft/collection/link",
    "/api/web/nft/item/mint",
    "/api/web/nft/loyalty",
    "/api/web/nft/reward-campaign",
    "/api/web/nft/reward-campaign/claim"
  ]) {
    assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
  }
});

test("NFT rewards never draw from SlimeWire platform fees", () => {
  assert.match(source, /fundingBasis:\s*"creator_deposit"/);
  assert.match(source, /platformFeesUsed:\s*false/);
  assert.match(source, /creatorFeeAutoFundPct:\s*parseBoolean\(body\.creatorFeeAutoFund\)\s*\?\s*20\s*:\s*0/);
  assert.match(source, /const target = \(total \* 20n\) \/ 100n/);
});

test("NFT creator-fee rewards are deducted after legacy creator-funded commitments", () => {
  assert.match(source, /alreadyCommittedLamports/);
  assert.match(source, /const alreadyCommitted = BigInt\(holderRewards\?\.paidLamports \|\| 0\)/);
  assert.match(source, /total - BigInt\(alreadyCommittedLamports \|\| 0\) - 20_000n/);
});

test("NFT manager exposes the account's SlimeCash wallet without changing collection authority", () => {
  assert.match(source, /const slimeCashWallet = ownsLaunch/);
  assert.match(source, /sameWallet: Boolean\(creatorWallet && slimeCashWallet/);
  assert.match(source, /creatorWallet: creatorWallet \?/);
  assert.match(source, /slimeCashWallet: slimeCashWallet \?/);
  assert.match(appSource, /data-nft-slimecash-fund/);
  assert.match(appSource, /fromWalletIndex: funding\.slimeCashWallet\.index/);
  assert.match(appSource, /allocations: \[\{ destination: funding\.creatorWallet\.publicKey, amountSol \}\]/);
});

test("NFT launch keeps marketplace royalties, edition numbers, and explicit supply policy", () => {
  assert.match(source, /supplyMode: spec\.supplyMode/);
  assert.match(source, /royaltyBps: spec\.royaltyBps/);
  assert.match(source, /editionNumber/);
  assert.match(source, /collection supply cap reached/);
  assert.match(appSource, /data-launch-coin-nft-supply-mode/);
  assert.match(appSource, /data-launch-coin-nft-supply-cap/);
  assert.match(appSource, /data-launch-coin-nft-royalty/);
  assert.match(appSource, /marketplace-ready metadata/);
});
