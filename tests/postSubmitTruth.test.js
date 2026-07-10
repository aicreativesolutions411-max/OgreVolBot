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

for (const name of ["webTradeSellCore", "webBundleBuyCore", "webBundleSellCore"]) {
  test(`${name} preserves submitted transactions when history storage fails`, () => {
    const body = functionBody(server, name);
    assert.match(body, /let recordError = ""/);
    assert.match(body, /catch \(error\)/);
    assert.match(body, /recordError/);
  });
}

for (const name of ["webRhTradeCore", "webRhBundleCore"]) {
  test(`${name} preserves landed Robinhood transactions when audit storage fails`, () => {
    const body = functionBody(server, name);
    assert.match(body, /let recordError = ""/);
    assert.match(body, /Audit: \$\{friendlyError\(error\)\}/);
    assert.match(body, /recordError/);
  });
}
