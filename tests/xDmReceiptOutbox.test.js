import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(source);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} should exist`);
  const paramsStart = source.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let i = paramsStart; i < source.length; i += 1) {
    if (source[i] === "(") paramsDepth += 1;
    if (source[i] === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) { paramsEnd = i; break; }
    }
  }
  const brace = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not isolate ${name}`);
}

test("X trade receipts queue separately from money-event retries", () => {
  const sendReceipt = functionBody(server, "xDmSendReceipt");
  const confirm = functionBody(server, "xDmHandleTradeConfirm");
  assert.match(sendReceipt, /xDmQueueReceipt\(state, senderId, chunks, index, receiptId/);
  assert.match(sendReceipt, /ok: true, queued: true/);
  assert.match(confirm, /xDmSendReceipt\(/);
  assert.doesNotMatch(confirm, /\bxDmSend\(/);
});

test("X receipt outbox is persisted, bounded, expiring, and backed off", () => {
  const readState = functionBody(server, "readXDmState");
  const prune = functionBody(server, "xDmPruneState");
  const queue = functionBody(server, "xDmQueueReceipt");
  const flush = functionBody(server, "xDmFlushReceiptOutbox");
  assert.match(readState, /s\.outbox = \{\}/);
  assert.match(prune, /Object\.entries\(s\.outbox \|\| \{\}\)/);
  assert.match(queue, /X_DM_RECEIPT_OUTBOX_LIMIT/);
  assert.match(flush, /maxAttempts = 3/);
  assert.match(flush, /Math\.min\(5 \* 60_000, 2_000 \* \(2 \*\*/);
  assert.match(flush, /delete state\.outbox\[id\]/);
});

test("X polling retries receipts even when inbox reads fail", () => {
  const poll = functionBody(server, "xDmPollTick");
  const flushCalls = poll.match(/xDmFlushReceiptOutbox\(state\)/g) || [];
  assert.ok(flushCalls.length >= 2, "poll should flush after normal reads and after a failed read");
  assert.ok(poll.indexOf("xDmFetchEvents") < poll.lastIndexOf("xDmFlushReceiptOutbox"));
});

test("confirmed X actions retain a long enough in-flight lease", () => {
  const handle = functionBody(server, "xDmHandleEvent");
  assert.match(handle, /expiresAt: Date\.now\(\) \+ 30 \* 60_000/);
});
