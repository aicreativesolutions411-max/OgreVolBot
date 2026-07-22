import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const page = fs.readFileSync(new URL("../web/public/balls.html", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");
const tokenArt = new URL("../web/public/assets/balls/balls-token.png", import.meta.url);
const pinballArt = new URL("../web/public/assets/balls/balls-pinball-hero.png", import.meta.url);
const collectibleArt = ["gold-jackpot", "slime", "diamond", "pixel", "steel", "frost", "laser", "shades"]
  .map((name) => ({ name, url: new URL(`../web/public/assets/balls/icon-${name}.webp`, import.meta.url) }));

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
  assert.match(page, /class="navButton terminal" href="https:\/\/www\.slimewire\.org\/"/);
  assert.match(page, /aria-label="Open SlimeWire Terminal">TERMINAL<\/a>/);
  assert.doesNotMatch(page, /navButton terminal[^>]*>[\s\S]{0,40}(?:⌂|âŒ‚|home)/i);
  assert.match(page, /class="navButton chart disabled" data-chart/);
  assert.match(page, /\$\$\('\[data-chart\]'\)/);
  assert.match(page, /\/api\/map\?ca=/);
  assert.match(page, /alias\(n\.wallet\)/);
  assert.doesNotMatch(page, /shortMint\(n\.wallet\)/);
  assert.match(page, /returns SOL to the same wallet automatically/);
  assert.doesNotMatch(page, /Use Convert ETH|Robinhood sells settle to ETH/);
});

test("BALLS matches the supplied black-and-slime-green project identity", () => {
  assert.ok(fs.statSync(tokenArt).size > 100_000);
  assert.ok(fs.statSync(pinballArt).size > 500_000);
  for (const asset of collectibleArt) {
    assert.ok(fs.statSync(asset.url).size > 10_000, `${asset.name} collectible should be a real image asset`);
    assert.match(page, new RegExp(`/assets/balls/icon-${asset.name}\\.webp`));
  }
  assert.match(page, /\/assets\/balls\/balls-token\.png/);
  assert.match(page, /\/assets\/balls\/balls-pinball-hero\.png/);
  assert.match(page, /<img class="mark"/);
  assert.match(page, /The most important metric in crypto/);
  assert.match(page, /BALLS HIGH SCORES/);
  assert.match(page, /BALLS COLLECTION/);
  assert.match(page, /--lime:#86ff2d/);
  assert.match(page, /\.navButton\.terminal\{background:linear-gradient\(180deg,#b8ff50,#68e51b\)/);
  assert.doesNotMatch(page, /balls-arena-hero/);
  assert.doesNotMatch(page, /🐸|🚀|🌕|💀|🗑|frog|soccer/i);
});

test("BALLS inline scripts parse", () => {
  const scripts = [...page.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  assert.equal(scripts.length, 2);
  scripts.forEach((source, index) => assert.doesNotThrow(() => new vm.Script(source, { filename: `balls-inline-${index}.js` })));
});
