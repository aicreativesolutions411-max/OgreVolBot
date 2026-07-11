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
  assert.match(server, /function launchOsSiteForClient/);
  assert.match(server, /function launchOsFallbackArtData/);
  assert.match(server, /async function generateLaunchOsFreeMedia/);
  assert.match(server, /async function launchOsTrustedTokenImageBuffer/);
  assert.match(server, /dexscreener\.com[\s\S]*arweave\.net[\s\S]*ipfs\.io/);
  assert.match(server, /generateLaunchOsFreeMedia\(project, tokenArt\)/);
  assert.match(server, /function launchOsCreativeCopy/);
  assert.match(server, /freeArtGenerated/);
  assert.match(server, /legacyHero[\s\S]*slimewire\\\/launch\\\/hero/);
  assert.match(server, /kind === "pfp"[\s\S]*generateLaunchOsFreeMedia\(project, src\)/);
  assert.match(server, /slimewire-site-engine-v2/);
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
  for (const section of ["market", "lore", "gallery", "howToBuy", "roadmap", "socials", "memeMaker"]) {
    assert.match(maker, new RegExp(`id="sec-${section}"`), `${section} must exist before the first save`);
  }
  assert.match(maker, /REAL GENERATION ENGINE/);
  assert.match(maker, /fal\.ai generates custom hero/);
  assert.match(maker, /FREE CUSTOM BRAND ENGINE/);
  assert.match(maker, /coin-specific art and copy for free/);
});

test("published coin sites include live market, chart, lore, gallery, buy flow, roadmap, socials and meme studio", () => {
  for (const text of ["LIVE MARKET", "The ticker", "The lore", "The gallery", "How to buy", "Roadmap", "Meme factory", "Join the signal"]) assert.match(site, new RegExp(text, "i"));
  assert.match(site, /dexscreener\.com/);
  assert.match(site, /\/api\/coin-site\//);
  assert.match(site, /mobileBuy/);
  assert.match(site, /canvas id="meme"/);
  assert.match(site, /location\.search/);
  assert.match(site, /siteHeroDrift/);
  assert.match(site, /SLIMEWIRE • BUILDING THE WORLD/);
  assert.match(site, /LIVE • VERIFIED CA • COMMUNITY/);
});

test("site generation resolves both Solana and Robinhood Chain contracts", () => {
  const start = server.indexOf("async function resolveSocialKitToken");
  const body = server.slice(start, start + 2600);
  assert.match(body, /\^0x\[0-9a-fA-F\]\{40\}\$/);
  assert.match(body, /gatherRhScan\(target\)/);
  assert.match(body, /chain: "robinhood"/);
  assert.match(body, /isLikelySolMint\(target\)/);
  assert.match(body, /getDexTokenMetadata\(target/);
  assert.match(body, /chain: "solana"/);
});

test("site maker is discoverable from both web shells", () => {
  for (const file of ["index.html", "gg.html"]) {
    const html = fs.readFileSync(new URL(`../web/public/${file}`, import.meta.url), "utf8");
    assert.match(html, /AI Coin Site Maker/);
    assert.match(html, /url:"\/site-maker"/);
  }
});
