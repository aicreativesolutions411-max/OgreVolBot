import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const funSource = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
const funHtml = fs.readFileSync(new URL("../web/public/fun.html", import.meta.url), "utf8");
const ggSource = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("Fun mobile automation tools stay embedded in the Fun shell", () => {
  assert.match(funHtml, /data-view="tool"/);
  assert.match(funHtml, /data-tool-frame/);
  assert.match(funSource, /const FUN_TOOL_ROUTES = \{/);
  assert.match(funSource, /copy: \{ route: "copy"/);
  assert.match(funSource, /sniper: \{ route: "sniper"/);
  assert.match(funSource, /walletLaunch: \{ route: "walletLaunch"/);
  assert.match(funSource, /embed=fun-tool/);
  assert.doesNotMatch(funSource, /const routes = \{ copy: "copy", sniper: "sniper" \}/);
  assert.match(ggSource, /body\.fun-tool-embed \.view\.on/);
  assert.match(ggSource, /embed==="fun-tool"/);
});

test("the launcher visible inside Fun exposes linked NFT collection settings", () => {
  assert.equal(indexSource, ggSource, "classic launcher mirrors must remain identical");
  for (const id of ["lcNftEnabled", "lcNftName", "lcNftDescription", "lcNftSupplyMode", "lcNftSupplyCap", "lcNftRoyalty"]) {
    assert.match(ggSource, new RegExp(`id="${id}"`));
  }
  assert.match(ggSource, /tb\("nft","NFT Collection"\)/);
  assert.match(ggSource, /nftCollection:\{enabled:/);
  assert.match(serverSource, /normalizeLinkedNftCollection\(body\.nftCollection/);
});

test("Fun NFT tab manages coins that were already launched", () => {
  for (const marker of ["lcNftExistingMint", "lcNftManagerLoad", "lcNftCreateLater", "lcNftLinkExisting", "lcNftItemMint"]) {
    assert.match(ggSource, new RegExp(marker));
  }
  assert.match(ggSource, /\/api\/web\/nft\/loyalty\?tokenMint=/);
  assert.match(ggSource, /\/api\/web\/nft\/collection\/create/);
  assert.match(ggSource, /\/api\/web\/nft\/collection\/link/);
  assert.match(ggSource, /\/api\/web\/nft\/item\/mint/);
  assert.match(ggSource, /same SlimeWire profile that launched this coin/);
});

test("Telegram admin stats include paged per-profile trade and referral usage", () => {
  assert.match(serverSource, /const profileRows = Object\.entries\(auth\.profiles/);
  assert.match(serverSource, /volumeSol: referralSolString\(totals\.volume\)/);
  assert.match(serverSource, /row\.trades} trades/);
  assert.match(serverSource, /row\.tradedWallets} wallets/);
  assert.match(serverSource, /row\.referrals} referrals/);
  assert.match(serverSource, /\/adminstats \$\{page === totalPages \? 1 : page \+ 1}/);
});
