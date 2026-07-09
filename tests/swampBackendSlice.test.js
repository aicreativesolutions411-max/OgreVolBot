import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serverSource = fs.readFileSync(path.join(rootDir, "src", "index.js"), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}(`) >= 0
    ? source.indexOf(`function ${name}(`)
    : source.indexOf(`async function ${name}(`);
  assert.notEqual(start, -1, `function ${name} not found`);
  const paramsOpen = source.indexOf("(", start);
  assert.notEqual(paramsOpen, -1, `function ${name} has no params`);
  let parenDepth = 0;
  let paramsClose = -1;
  for (let i = paramsOpen; i < source.length; i += 1) {
    if (source[i] === "(") parenDepth += 1;
    else if (source[i] === ")") {
      parenDepth -= 1;
      if (parenDepth === 0) {
        paramsClose = i;
        break;
      }
    }
  }
  assert.notEqual(paramsClose, -1, `function ${name} params did not close`);
  const open = source.indexOf("{", paramsClose);
  assert.notEqual(open, -1, `function ${name} has no body`);
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  assert.fail(`function ${name} body did not close`);
}

test("swamp receipt store and endpoints are backend-only additive routes", () => {
  assert.match(serverSource, /case "swamp-receipts\.json":/);
  for (const route of [
    "/api/web/swamp/receipts",
    "/api/web/swamp-receipts",
    "/api/web/swamp/receipts/public",
    "/api/web/swamp-receipts/public",
    "/api/web/actions",
    "/api/web/blinks",
    "/api/actions/",
    "/api/web/swamp/launch-state",
    "/api/web/launch/state-summary",
    "/api/web/launch/boss-raid-summary",
    "/api/web/launch/egg-summary",
    "/api/web/swamp/passport",
    "/api/web/swamp-passport",
    "/api/web/launch/my-state-summary"
  ]) {
    assert.ok(serverSource.includes(route), `${route} route string missing`);
  }
});

test("swamp receipts are opt-in proof metadata with locked writes and audit", () => {
  const creator = functionBody(serverSource, "webCreateSwampReceipt");
  assert.match(creator, /withFileLock\(swampReceiptsPath\(\)/);
  assert.match(creator, /audit\("web_swamp_receipt_create"/);
  assert.match(creator, /publicSwampReceipt\(receipt, \{ own: true \}\)/);

  const builder = functionBody(serverSource, "buildSwampReceipt");
  assert.match(builder, /webSlimeShield\(tokenMint\)/);
  assert.match(builder, /pnlRows\(userId, tokenMint/);
  assert.match(builder, /readPumpLaunchAttempts\(\)/);
  assert.match(builder, /parseBoolean\(firstString\(body\.public, body\.sharePublic, body\.publicReceipt/);
});

test("blink/action metadata is metadata-only and never builds trading authority", () => {
  const metadata = functionBody(serverSource, "swampActionMetadata");
  assert.match(metadata, /noTransaction: true/);
  assert.match(metadata, /xShareUrl/);
  assert.match(metadata, /telegramShareUrl/);
  assert.doesNotMatch(metadata, /VersionedTransaction|TransactionMessage|sendRawTransaction|signTransaction|Safe Session Trading Authority|sessionWallet|automationPermission/);
});

test("launch summaries and passport badges derive from existing stores without leaking wallets", () => {
  const launchState = functionBody(serverSource, "webSwampLaunchStateSummary");
  assert.match(launchState, /webLaunchBossRaidSummary\(\)/);
  assert.match(launchState, /webLaunchEggSummary\(options\)/);

  const publicAttempt = functionBody(serverSource, "publicLaunchAttemptSummary");
  assert.doesNotMatch(publicAttempt, /launchAttemptId|txSignature|createSignature|signature/);

  const launchEgg = functionBody(serverSource, "webLaunchEggSummary");
  assert.match(launchEgg, /const attempts = userId \?/);

  const passport = functionBody(serverSource, "webSwampPassportSummary");
  for (const read of ["webProfileForUser", "readWalletStore", "readTradeHistory", "readPumpLaunchAttempts", "readSwampReceipts"]) {
    assert.match(passport, new RegExp(`${read}\\(`), `${read} not used for passport summary`);
  }
  assert.match(passport, /wallets: wallets\.length/);
  assert.doesNotMatch(passport, /privateKey|secretKey|seedPhrase|mnemonic/);
});
