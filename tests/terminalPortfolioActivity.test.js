import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

test("terminal entry points keep the same Portfolio activity behavior", async () => {
  const [index, gg] = await Promise.all([
    read("web/public/index.html"),
    read("web/public/gg.html")
  ]);

  assert.equal(index, gg, "index.html and gg.html must remain identical");
  assert.match(index, /\["activity","Activity"\]/);
  assert.match(index, /\["orders","Orders & exits"\]/);
  assert.match(index, /SlimeWirePro\?\.renderPortfolioActivity/);
  assert.match(index, /state\.portfolioTab="activity";closeModal\(\);go\("portfolio"\)/);
  assert.match(index, /function walletSnapshot\(index\)/);
});

test("global activity uses personal receipts and deduplicated order sources", async () => {
  const source = await read("web/public/terminal-pro.js");

  assert.match(source, /request\("\/api\/web\/pnl"\)/);
  assert.match(source, /request\("\/api\/web\/rh\/activity"\)/);
  assert.match(source, /request\("\/api\/web\/market-orders\?token="\)/);
  assert.match(source, /request\("\/api\/web\/trade\/plans"\)/);
  assert.match(source, /request\("\/api\/web\/rh\/guards"\)/);
  assert.match(source, /Array\.isArray\(pnl\.trades\)/);
  assert.match(source, /normalizeRhActivity\(rhActivityResult\.data\.activity \|\| \[\]\)/);
  assert.match(source, /amountEth/);
  assert.match(source, /quotedEth/);
  assert.match(source, /sentEth/);
  assert.match(source, /outSol/);
  assert.match(source, /kindLabel: "My activity"/);
  assert.match(source, /Market trades/);
  assert.match(source, /String\(guard\?\.kind \|\| "exit"\)\.toLowerCase\(\) === "exit"/);
  assert.match(source, /\["outcome_unknown", "needs_attention"\]\.includes\(status\)/);
  assert.match(source, /statusLabel: needsAttention \? "Needs attention"/);
  assert.match(source, /Open orders & exits/);
  assert.match(source, /Order history/);
  assert.match(source, /proActivityLegs/);
  assert.match(source, /walletPublicKey/);
  assert.match(source, /Explorer ↗/);
  assert.match(source, /data-pro-cancel-global/);
  assert.match(source, /request\("\/api\/web\/market-orders\/cancel"/);
});

test("market orders and Robinhood auto exits freeze reviewed inputs", async () => {
  const [pro, terminal] = await Promise.all([
    read("web/public/terminal-pro.js"),
    read("web/public/index.html")
  ]);

  assert.match(pro, /const frozenWallet = await freezeManagedWallet\(wallet\)/);
  assert.match(pro, /walletIndex: String\(frozenWallet\.index\), walletPublicKey: frozenWallet\.publicKey/);
  assert.match(terminal, /autoExit:true,takeProfitPct:String\(tp\),stopLossPct:"",sellPercent:"100",symbol/);
  assert.match(terminal, /Object\.assign\(body,\{autoExit:true,takeProfitPct:tp\|\|"",stopLossPct:sl\|\|"",sellPercent:"100",symbol:swapTok\.symbol\|\|""\}\)/);
  assert.match(terminal, /const autoExitArmed=Boolean\(d\.autoExitArmed\),autoExitError=String\(d\.autoExitError\|\|""\)/);
  assert.doesNotMatch(terminal, /if\(swapDir==="buy"[^\n]+jpost\("\/api\/web\/rh\/guards"/);
  assert.match(terminal, /walletIndexes:\[Number\(selected\.index\)\],walletPublicKeys:\[String\(selected\.publicKey\)\]/);
  assert.match(terminal, /const selected=walletSnapshot\(state\.activeWallet\|\|1\)/);
});
