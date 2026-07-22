import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../web/public/balls.html", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");
const hero = new URL("../web/public/assets/balls/balls-arena-hero.webp", import.meta.url);

test("BALLS has a dedicated no-store route without a pretty-URL redirect loop", () => {
  assert.match(server, /\["\/balls", "\/balls\/"\][\s\S]{0,180}serveStaticHtmlPage\(response, "balls\.html", "no-store, max-age=0"\)/);
  assert.doesNotMatch(redirects, /^\/balls(?:\/\*)?\s+/m);
  assert.match(page, /<title>BALLS/);
});

test("BALLS launch configuration is safe before the final contract exists", () => {
  assert.match(page, /contractAddress:""/);
  assert.match(page, /chain:"auto"/);
  assert.match(page, /https:\/\/x\.com\/balls_rh/);
  assert.match(page, /https:\/\/t\.me\/balls_rh/);
  assert.match(page, /Launch incoming/);
  assert.match(page, /disabled/);
});

test("BALLS supports either final chain and keeps holder addresses off visible rows", () => {
  assert.match(page, /#\$\{isRh\?"rhtrade":"trade"\}/);
  assert.match(page, /\/api\/map\?ca=/);
  assert.match(page, /alias\(n\.wallet\)/);
  assert.doesNotMatch(page, /shortMint\(n\.wallet\)/);
  assert.match(page, /Robinhood sells settle to ETH/);
  assert.match(page, /Convert ETH → SOL/);
});

test("BALLS ships project-local arena art", () => {
  assert.ok(fs.statSync(hero).size > 100_000);
  assert.match(page, /\/assets\/balls\/balls-arena-hero\.webp/);
  assert.match(page, /<svg class="mark"/);
  assert.doesNotMatch(page, /⚽|🏀|soccer/i);
});

test("BALLS inline scripts parse", () => {
  const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.equal(scripts.length, 2);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, { filename: `balls-inline-${index}.js` })));
});
