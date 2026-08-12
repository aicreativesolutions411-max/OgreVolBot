import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");

function functionBody(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} must exist`);
  const paramsEnd = source.indexOf(")", start);
  let brace = source.indexOf("{", paramsEnd);
  let depth = 0;
  for (let i = brace; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    if (source[i] === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`${name} body is incomplete`);
}

test("market history is compacted per mint instead of appending every feed refresh", () => {
  const persist = functionBody("persistPostgresLivePairRows");
  assert.match(source, /create table if not exists pair_market_history/);
  assert.match(persist, /insert into pair_market_history/);
  assert.match(persist, /on conflict \(mint\) do update/);
  assert.match(persist, /interval '5 minutes'/);
  assert.doesNotMatch(persist, /insert into pair_snapshots/);
  assert.doesNotMatch(source, /create index if not exists pair_snapshots_pair_captured_idx/);
});

test("storage maintenance only prunes provider-backed discovery caches", () => {
  const maintenance = functionBody("runPostgresHistoryMaintenance");
  for (const table of ["pair_market_history", "pairs", "token_metadata"]) {
    assert.match(maintenance, new RegExp(`"${table}"`));
  }
  for (const protectedTable of [
    "processed_transactions",
    "dev_wallet_events",
    "dev_wallet_stats",
    "ogv_accounts",
    "ogv_saves"
  ]) {
    assert.doesNotMatch(maintenance, new RegExp(`"${protectedTable}"`));
  }
  assert.match(maintenance, /dev_wallet_candidates/);
  assert.match(maintenance, /dev_wallet_events/);
});
