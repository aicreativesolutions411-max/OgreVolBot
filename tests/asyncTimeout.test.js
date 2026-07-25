import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { withTimeout } from "../src/lib/asyncTimeout.js";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

test("withTimeout returns a source value that fulfills before the deadline", async () => {
  const result = await withTimeout(Promise.resolve({ ok: true }), 100, { timedOut: true });

  assert.deepEqual(result, { ok: true });
});

test("withTimeout preserves source rejection so callers can choose an error fallback", async () => {
  const sourceError = new Error("balance provider failed");
  const timeoutFallback = { timedOut: true };
  const errorFallback = { ok: false, wallets: [] };

  await assert.rejects(withTimeout(Promise.reject(sourceError), 100, timeoutFallback), sourceError);
  const recovered = await withTimeout(Promise.reject(sourceError), 100, timeoutFallback)
    .catch(() => errorFallback);

  assert.strictEqual(recovered, errorFallback);
});

test("withTimeout returns the supplied fallback when the deadline wins", async () => {
  const fallback = { ok: false, wallets: [], ethUsd: 0, timedOut: true };
  const result = await withTimeout(new Promise(() => {}), 10, fallback);

  assert.strictEqual(result, fallback);
});

test("portfolio snapshot and recovered PnL reads use the shared timeout helper", () => {
  assert.match(serverSource, /import \{ withTimeout as withAsyncTimeout \} from "\.\/lib\/asyncTimeout\.js";/);
  assert.match(serverSource, /withAsyncTimeout\(webRhBalanceRows\(userId\), 1_800,/);
  assert.match(serverSource, /async \(tokenAccount\) => withAsyncTimeout\(/);
  assert.match(serverSource, /const tx = await withAsyncTimeout\(/);
});
