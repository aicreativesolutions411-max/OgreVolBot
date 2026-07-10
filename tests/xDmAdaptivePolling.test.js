import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const xClient = fs.readFileSync(new URL("../src/lib/xClient.js", import.meta.url), "utf8");

function functionBody(source, name) {
  const start = source.indexOf(`function ${name}`);
  assert.notEqual(start, -1, `${name} should exist`);
  const signatureEnd = source.indexOf(") {", start);
  const brace = signatureEnd === -1 ? source.indexOf("{", start) : signatureEnd + 2;
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not isolate ${name}`);
}

test("X DM polling self-schedules without overlapping fixed intervals", () => {
  const start = functionBody(server, "startGroupBuyBot");
  assert.doesNotMatch(server, /setInterval\(\s*\(\)\s*=>\s*\{?\s*void\s+xDmPollTick\(\)/);
  assert.match(start, /const scheduleXDmPoll = \(delayMs\) =>/);
  assert.match(start, /setTimeout\(async \(\) =>/);
  assert.match(start, /const result = await xDmPollTick\(\)/);
  assert.match(start, /scheduleXDmPoll\(active \? xDmActivePollMs : xDmIdlePollMs\)/);
  assert.ok(
    start.indexOf("await xDmPollTick()") < start.indexOf("scheduleXDmPoll(active ?"),
    "the next poll must be scheduled only after the current poll completes"
  );
});

test("X DM cookie polling accelerates after activity while official polling respects its limit", () => {
  const start = functionBody(server, "startGroupBuyBot");
  assert.match(start, /xDmAuthMode\(\) === "official-oauth2"/);
  assert.match(start, /Math\.max\(xDmOfficial \? 65_000 : 4_000/);
  assert.match(start, /X_DM_POLL_MS \|\| \(xDmOfficial \? 65_000 : 5_000\)/);
  assert.match(start, /Math\.max\(1_500, Number\(process\.env\.X_DM_ACTIVE_POLL_MS \|\| 2_000\)\)/);
  assert.match(start, /Number\(result\?\.handled \|\| 0\) > 0/);
  assert.match(start, /Date\.now\(\) - xDmLastActivityAt < 90_000/);
  assert.match(start, /scheduleXDmPoll\(xDmOfficial \? 8_000 : 2_000\)/);
});

test("X DM pasted CAs acknowledge slow scans and cannot stall the inbox poller", () => {
  const handle = functionBody(server, "xDmHandleEvent");
  const poll = functionBody(server, "xDmPollTick");
  assert.match(handle, /CA received/);
  assert.match(handle, /scanFastTimeout\(replyWork, 11_500, null\)/);
  assert.match(handle, /Market details are still warming; the live chart is ready/);
  assert.match(poll, /\[xdm\] poll ok checked=/);
  assert.match(xClient, /inbox_initial_state\.json[\s\S]*\$\{DM_QUERY\}&_\=\$\{Date\.now\(\)\}/);
});
