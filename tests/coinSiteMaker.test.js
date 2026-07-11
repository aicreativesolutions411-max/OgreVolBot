import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const ai = fs.readFileSync(new URL("../src/lib/aiPfp.js", import.meta.url), "utf8");
const maker = fs.readFileSync(new URL("../web/public/site-maker.html", import.meta.url), "utf8");
const site = fs.readFileSync(new URL("../web/public/coin-site.html", import.meta.url), "utf8");

test("coin site maker creates editable, published sites from the standalone CA flow", () => {
  assert.match(server, /serveStaticHtmlPage\(response, "site-maker\.html"/);
  assert.match(server, /serveStaticHtmlPage\(response, "coin-site\.html"/);
  assert.match(server, /pathname\.startsWith\("\/api\/coin-site\/"\)/);
  assert.match(server, /pathname\.startsWith\("\/api\/launch-os\/media\/"\)/);
  assert.match(server, /pathname\.startsWith\("\/api\/launch-os\/ai\/"\)/);
  assert.match(server, /function launchOsDefaultSite/);
  assert.match(server, /function saveLaunchOsMedia/);
  assert.match(server, /editorial.*terminal|terminal.*editorial/);
});

test("maker offers three curated systems, direct preview, uploads, AI art, and optional sections", () => {
  for (const text of ["Cinematic", "Degen Terminal", "Clean Editorial", "Generate Complete Website", "Generate AI hero", "Add gallery artwork", "Save \\+ Publish"]) assert.match(maker, new RegExp(text));
  assert.match(maker, /<iframe id="frame"/);
  assert.match(maker, /X-Launch-Edit-Key/);
  assert.match(maker, /\/api\/launch-os\/media\//);
  assert.match(maker, /\/api\/launch-os\/ai\//);
  assert.match(ai, /export async function aiSiteArt/);
  assert.match(ai, /ultra-wide website hero artwork/);
});

test("published coin sites include live market, chart, lore, gallery, buy flow, roadmap, socials and meme studio", () => {
  for (const text of ["LIVE MARKET", "The ticker", "The lore", "The gallery", "How to buy", "Roadmap", "Meme factory", "Join the signal"]) assert.match(site, new RegExp(text, "i"));
  assert.match(site, /dexscreener\.com/);
  assert.match(site, /\/api\/coin-site\//);
  assert.match(site, /mobileBuy/);
  assert.match(site, /canvas id="meme"/);
  assert.match(site, /location\.search/);
});

test("site maker is discoverable from both web shells", () => {
  for (const file of ["index.html", "gg.html"]) {
    const html = fs.readFileSync(new URL(`../web/public/${file}`, import.meta.url), "utf8");
    assert.match(html, /AI Coin Site Maker/);
    assert.match(html, /url:"\/site-maker"/);
  }
});
