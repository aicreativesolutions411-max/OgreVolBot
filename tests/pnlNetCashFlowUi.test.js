import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");

function sourceBetween(source, startText, endText) {
  const start = source.indexOf(startText), end = source.indexOf(endText, start);
  assert.ok(start >= 0 && end > start, `${startText} should remain extractable`);
  return source.slice(start, end);
}

test("app portfolio totals prefer API net cash flow and retain the legacy fallback", async () => {
  const app = await read("web/public/app.js");
  const helperSource = sourceBetween(app, "function portfolioRealizedPnlLabel", "function secondsSince");
  const labelFor = (totals) => Function("state", `"use strict";${helperSource};return portfolioRealizedPnlLabel();`)({ pnl: { totals } });

  assert.equal(labelFor({ netCashFlowSol: "-1.250", realizedSol: "+99.000" }), "-1.250");
  assert.equal(labelFor({ netCashFlowSol: 0, realizedSol: "+99.000" }), 0, "zero net cash flow must not fall through");
  assert.equal(labelFor({ realizedSol: "+0.750" }), "+0.750", "older payloads retain realizedSol compatibility");
  assert.equal(labelFor({}), "+0 SOL");
});

test("app PnL rows, summaries, descriptions, and shares are labeled as net cash flow", async () => {
  const app = await read("web/public/app.js");
  const pnl = sourceBetween(app, "function pnlHtml", "function allVisibleSignalRows");
  const tek = sourceBetween(app, "function tekWalletBarHtml", "function tekHubHtml");
  const shareSource = sourceBetween(app, "function pnlShareText", "function positionShareText");
  const pnlShareText = Function("shortAddress", `"use strict";${shareSource};return pnlShareText;`)((value) => String(value || "").slice(0, 6));

  assert.match(pnl, /state\.pnl\.totals\.netCashFlowSol \?\? state\.pnl\.totals\.realizedSol/);
  assert.match(pnl, /row\.netCashFlowSol \?\? row\.realizedSol/);
  assert.match(pnl, />Net cash flow</);
  assert.match(pnl, /Trade cash flow \/ Results/);
  assert.doesNotMatch(pnl, />Realized</);
  assert.match(tek, /Net cash flow/);
  assert.match(tek, /totals\?\.netCashFlowSol \?\? state\.pnl\?\.totals\?\.realizedSol/);
  assert.equal(
    pnlShareText({ tokenMint: "Mint123", netCashFlowSol: "-0.125", realizedSol: "+5", buys: 2, sells: 1 }),
    "Net cash flow on Mint12: -0.125 SOL, 2 buy(s), 1 sell(s)."
  );
});

test("root terminal twins use net cash flow for totals, token rows, receipts, and cards", async () => {
  const [index, gg] = await Promise.all([read("web/public/index.html"), read("web/public/gg.html")]);
  assert.equal(index, gg, "index.html and gg.html must remain byte-identical");

  const receipts = sourceBetween(index, "function verifiedReceiptsHtml", "async function recordSwampReceipt");
  const cards = sourceBetween(index, "async function renderPnlCards", "async function openPnlCard");
  const cardDialog = sourceBetween(index, "async function openPnlCard", "// ---------- wallet");
  assert.match(receipts, /t\.netCashFlowSol\?\?t\.realizedSol/);
  assert.match(receipts, /SOL net cash flow/);
  assert.doesNotMatch(receipts, /SOL realized|realized across/);
  assert.match(cards, /t\.netCashFlowSol\?\?t\.realizedSol/);
  assert.match(cards, /tk\.netCashFlowSol\?\?tk\.realizedSol/);
  assert.match(cards, /<h3>Net cash flow<\/h3>/);
  assert.match(cards, /<span>net cash flow<\/span>/);
  assert.match(cards, /SOL received minus SOL spent/);
  assert.doesNotMatch(cards, /Realized PnL|<span>realized<\/span>|with realized PnL/);
  assert.match(cardDialog, /Building your net cash flow card/);
  assert.match(cardDialog, /Net cash flow card/);
});
