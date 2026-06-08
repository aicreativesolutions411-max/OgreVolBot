import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");

function functionBody(source, name) {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(source);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(source);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} is missing`);
  const paramsStart = source.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < source.length; index += 1) {
    if (source[index] === "(") paramsDepth += 1;
    if (source[index] === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

test("custom referral codes are editable, generated, and uniqueness-checked server-side", () => {
  assert.match(functionBody(appSource, "referralSection"), /data-referral-code/);
  assert.match(functionBody(appSource, "referralSection"), /data-generate-referral-code/);
  assert.match(functionBody(appSource, "referralSection"), /\/r\/\$\{encodeURIComponent\(code\)\}/);
  assert.match(functionBody(appSource, "storedReferralCode"), /\^\\\/r\\\/\(\[\^\/\]\+\)/);
  assert.match(functionBody(appSource, "saveReferralSettings"), /generateReferralCode: Boolean\(options\.generate\)/);
  assert.match(appSource, /saveReferralSettings\(\{ generate: true \}\)/);
  assert.match(functionBody(serverSource, "normalizeReferralCode"), /\[\^a-z0-9_-\]/);
  assert.match(serverSource, /requestUrl\.pathname\.startsWith\("\/r\/"\)/);
  assert.match(functionBody(serverSource, "webReferralLink"), /url\.pathname = `\/r\/\$\{encodeURIComponent\(normalizeReferralCode\(code\)\)\}`/);
  assert.match(functionBody(serverSource, "updateWebReferralProfile"), /assertReferralCodeAvailable/);
  assert.match(functionBody(serverSource, "assertReferralCodeAvailable"), /statusCode = 409/);
  assert.match(cssSource, /REFERRAL_CODE_CUSTOMIZER_20260608_V1/);
});
