import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../web/public/x-dm-menu.html", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

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

test("X DM Trade Pad strips its signed URL and only stages server-side confirmation", () => {
  assert.match(page, /name="robots" content="noindex,nofollow,noarchive,nosnippet"/);
  assert.match(page, /name="referrer" content="no-referrer"/);
  assert.ok(page.indexOf("history.replaceState") < page.indexOf('fetch("/api/x-dm/menu"'));
  assert.match(page, /action === "prepare_buy"/);
  assert.match(page, /body\.action = "prepare_sell"/);
  assert.match(page, /No trade runs on this page/);
  assert.match(page, /reply YES to execute or NO to cancel/);
  assert.doesNotMatch(page, /\/api\/web\/trade|\/api\/web\/quick-buy|name=["'](?:private|seed|secret)/i);
});

test("X DM Trade Pad API cannot execute money and requires the DM confirmation path", () => {
  const api = functionBody(server, "xDmMenuApi");
  assert.match(api, /readXDmMenuToken\(body\.token\)/);
  assert.match(api, /String\(freshLink\.userId\) !== payload\.userId/);
  assert.match(api, /freshState\.pending\[payload\.senderId\]/);
  assert.match(api, /before staging another order\.", 409/);
  assert.ok(
    api.indexOf("freshState.pending[payload.senderId]") < api.indexOf("xDmStartPending(freshState, payload.senderId, rec)"),
    "an active X confirmation must be rejected before a Trade Pad request can replace it"
  );
  assert.match(api, /xDmStartPending\(freshState, payload\.senderId, rec\)/);
  assert.match(api, /Another Trade Pad request is already being staged/);
  assert.match(api, /xDmTradeConfirmText\(rec, payload\.slot\)/);
  assert.doesNotMatch(api, /tgExecuteQuickBuy|tgExecuteQuickSell|sellTokenFromWallet|webTradeBuy/);
  assert.match(server, /request\.method === "POST" && pathname === "\/api\/x-dm\/menu"/);
  assert.doesNotMatch(server, /request\.method === "GET" && pathname === "\/api\/x-dm\/menu"/);
});
