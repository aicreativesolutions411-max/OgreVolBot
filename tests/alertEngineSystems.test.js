import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverSource = fs.readFileSync(path.join(rootDir, "src", "index.js"), "utf8");
const appSource = fs.readFileSync(path.join(rootDir, "web", "public", "app.js"), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `function ${name} not found`);
  const end = source.indexOf("\nfunction ", start + 10);
  return source.slice(start, end === -1 ? undefined : end);
}

test("new data stores are whitelisted so first-run reads self-create instead of throwing", () => {
  for (const file of ["telegram-groups.json", "shield-receipts.json", "push-subscriptions.json", "alpha-calls.json", "call-board.json", "telegram-links.json", "watch-alerts.json"]) {
    assert.match(serverSource, new RegExp(`case "${file}":`), `${file} missing from defaultJsonForPath`);
  }
});

test("every new store mutation goes through the per-file lock", () => {
  assert.match(serverSource, /function withFileLock\(/);
  for (const fn of ["webPostBoardCall", "checkBoardCallOutcomes", "checkAlphaCallOutcomes", "checkShieldReceiptOutcomes", "checkWatchlistMoveAlerts"]) {
    assert.match(functionBody(serverSource, fn.replace(/^async /, "")), /withFileLock\(/, `${fn} not locked`);
  }
});

test("telegram replies never interpolate unescaped user text into HTML mode", () => {
  const winPoster = functionBody(serverSource, "postUserWinToGroups");
  assert.match(winPoster, /escapeTelegramHtml\(handle\)/);
  const look = functionBody(serverSource, "handleTelegramLookCommand");
  assert.match(look, /escapeTelegramHtml\(mint\)/);
});

test("alpha drops are env-tunable, mix moonshot rows, and never post AVOID", () => {
  assert.match(serverSource, /TG_ALPHA_DROP_INTERVAL_MINUTES/);
  assert.match(serverSource, /TG_ALPHA_DROP_PICKS/);
  const drop = functionBody(serverSource, "runAlphaDropTick");
  assert.match(drop, /moonshot/);
  assert.match(drop, /verdict === "AVOID"\) continue/);
  assert.match(drop, /Engine record/);
});

test("ogre ai buys are shield-gated on AVOID only", () => {
  const gate = serverSource.slice(serverSource.indexOf("Final SlimeShield gate before any SOL moves"));
  assert.match(gate.slice(0, 900), /verdict === "AVOID"/);
  assert.doesNotMatch(gate.slice(0, 900), /verdict === "RISK"/);
});

test("token-read is two-stage: market data never waits on a cold shield compute", () => {
  assert.match(serverSource, /shieldPending/);
  assert.match(serverSource, /Promise\.race\(\[shieldPromise/);
});

test("client: chart resolution store keeps market fields and the merge maps them", () => {
  const remember = functionBody(appSource, "rememberSmartChartDexResolution");
  for (const field of ["marketCap", "liquidityUsd", "volumeH24", "priceUsd"]) {
    assert.match(remember, new RegExp(field), `resolution store drops ${field}`);
  }
  const merge = functionBody(appSource, "mergeSmartChartDexResolution");
  assert.match(merge, /volumeH24: row\.volumeH24 \|\| resolved\.volumeH24/);
});

test("client: desktop dropdown nav exists without touching the flat rail DOM", () => {
  assert.match(appSource, /function buildDesktopNavDropBar/);
  assert.match(appSource, /data-nav-drop/);
  // the original rail buttons remain the active-state source for mobile
  assert.match(appSource, /!button\.closest\("\.tabs"\) && !button\.closest\("\[data-nav-drop\]"\)/);
});

test("client: deep links can open the buy panel and the fast dex lookup is wired", () => {
  assert.match(appSource, /params\.get\("buy"\) === "1"/);
  assert.match(appSource, /function fastDirectDexLookup/);
  assert.match(functionBody(appSource, "prefetchTokenChart"), /fastDirectDexLookup\(mint\)/);
});
