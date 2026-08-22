import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function extractFunction(source, startText, endText, returnName) {
  const start = source.indexOf(startText), end = source.indexOf(endText, start);
  assert.ok(start >= 0 && end > start, `${returnName} should remain extractable`);
  return Function(`"use strict";${source.slice(start, end)};return ${returnName};`)();
}

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
  assert.match(source, /Solscan ↗/);
  assert.match(source, /signatureLabel/);
});

test("terminal activity prefers UI token amounts and expands plan wallets independently", async () => {
  const source = await read("web/public/terminal-pro.js");
  const activityTokenAmount = extractFunction(source, "function activityTokenAmount", "function activityTime", "activityTokenAmount");
  const normalizeOrderRows = extractFunction(source, "function normalizeOrderRows", "function normalizeRhActivity", "normalizeOrderRows");

  assert.equal(activityTokenAmount({ tokenUiAmount: "12.345", tokenAmount: "12345000" }), "12.345");
  assert.equal(activityTokenAmount({ tokenAmount: "77.5" }), "77.5", "older API rows retain their raw-field fallback");

  const rows = normalizeOrderRows([], [{
    id: "plan-2", tokenMint: "Mint222222222222222222222222222222222222222", status: "running", createdAt: "2026-08-21T09:00:00.000Z",
    wallets: [
      { label: "One", publicKey: "One111111111111111111111111111111111111111", status: "arming", submissionSignature: "submission-one", submissionSignedAt: "2026-08-21T09:01:00.000Z" },
      { label: "Two", publicKey: "Two222222222222222222222222222222222222222", exitStatus: "outcome_unknown", buySignature: "buy-two", updatedAt: "2026-08-21T09:02:00.000Z" }
    ]
  }], []);

  assert.equal(rows.length, 2);
  const one = rows.find((row) => row.walletLabel === "One"), two = rows.find((row) => row.walletLabel === "Two");
  assert.equal(one.status, "arming");
  assert.equal(one.isActive, true);
  assert.equal(one.signature, "submission-one");
  assert.equal(one.signatureLabel, "Submission");
  assert.equal(one.timestamp, "2026-08-21T09:01:00.000Z");
  assert.equal(two.statusLabel, "Needs attention");
  assert.equal(two.needsAttention, true);
  assert.equal(two.isActive, false);
  assert.equal(two.signature, "buy-two");
  assert.equal(two.timestamp, "2026-08-21T09:02:00.000Z");
});

test("market orders and Robinhood auto exits freeze reviewed inputs", async () => {
  const [pro, terminal] = await Promise.all([
    read("web/public/terminal-pro.js"),
    read("web/public/index.html")
  ]);

  assert.match(pro, /const frozenWallet = await freezeManagedWallet\(wallet\)/);
  assert.match(pro, /walletIndex: String\(frozenWallet\.index\), walletPublicKey: frozenWallet\.publicKey/);
  assert.match(terminal, /autoExit:true,takeProfitPct:String\(tp\),stopLossPct:"",sellPercent:"100",symbol/);
  assert.match(terminal, /if\(presetId\)Object\.assign\(body,\{presetId,protectionRequired:true,autoExit:true,takeProfitPct:tp\|\|"",stopLossPct:sl\|\|"",sellPercent:"100",symbol:swapTok\.symbol\|\|""\}\)/);
  assert.match(terminal, /else if\(\(Number\(tp\)>0\)\|\|\(Number\(sl\)>0\)\)Object\.assign\(body,\{protectionRequired:true,autoExit:true/);
  assert.match(terminal, /const autoExitArmed=Boolean\(d\.autoExitArmed\),autoExitError=String\(d\.autoExitError\|\|""\)/);
  assert.doesNotMatch(terminal, /if\(swapDir==="buy"[^\n]+jpost\("\/api\/web\/rh\/guards"/);
  assert.match(terminal, /walletIndexes:\[Number\(selected\.index\)\],walletPublicKeys:\[String\(selected\.publicKey\)\]/);
  assert.match(terminal, /const selected=walletSnapshot\(state\.activeWallet\|\|1\)/);
});
