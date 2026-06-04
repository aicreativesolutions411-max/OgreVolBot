import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("web Pump launch preserves safe backend errors with launchAttemptId", async () => {
  const appJs = await fs.readFile(path.join(rootDir, "web", "public", "app.js"), "utf8");

  assert.match(appJs, /function publicErrorMessage\(message = "", options = \{\}\)/);
  assert.match(appJs, /options\.preserveSafeError/);
  assert.match(appJs, /path === "\/api\/web\/launch\/coin"/);
  assert.match(appJs, /error\.launchAttemptId = data\.launchAttemptId \|\| data\.launch\?\.launchAttemptId/);
  assert.match(appJs, /launchAttemptId/);
  assert.match(appJs, /preserveSafeError: true/);
});
