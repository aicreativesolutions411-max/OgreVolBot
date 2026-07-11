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
  assert.match(server, /launchOsGenerateStructuredCopy\(project\)/);
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
  assert.match(server, /publicMedia[\s\S]*CONFIG\.xDmRedirectOrigin/);
  assert.match(server, /gallery:[\s\S]*\.map\(publicMedia\)/);
  assert.match(server, /kind === "pfp"[\s\S]*generateLaunchOsFreeMedia\(project, src\)/);
  assert.match(server, /slimewire-site-engine-v2/);
  assert.match(server, /function saveLaunchOsMedia/);
  assert.match(server, /editorial.*terminal|terminal.*editorial/);
});

test("maker offers three curated systems, direct preview, uploads, AI art, and optional sections", () => {
  for (const text of ["Cinematic", "Degen Terminal", "Clean Editorial", "Generate Complete Website", "Generate Complete Art Set", "Add gallery artwork", "Permanent site link", "Save changes"]) assert.match(maker, new RegExp(text));
  assert.match(maker, /<iframe id="frame"/);
  assert.match(maker, /X-Launch-Edit-Key/);
  assert.match(maker, /\/api\/launch-os\/media\//);
  assert.match(maker, /\/api\/launch-os\/ai\//);
  assert.match(ai, /export async function aiSiteArt/);
  assert.match(ai, /export function aiSiteArtConfigured/);
  assert.match(ai, /flux-2-klein-9b/);
  assert.match(ai, /CLOUDFLARE_SITE_IMAGE_MODEL/);
  assert.match(ai, /gemini-2\.5-flash-image/);
  assert.match(ai, /input_image_0/);
  assert.match(ai, /input_image_1/);
  assert.match(ai, /immutable mascot identity/);
  assert.match(ai, /immutable logo identity/);
  assert.match(ai, /fit: "contain"/);
  assert.doesNotMatch(ai, /No text, no logos/);
  assert.match(ai, /aspectRatio: format === "mobile" \? "9:16"/);
  assert.match(ai, /ultra-wide website hero artwork/);
  for (const section of ["market", "lore", "gallery", "howToBuy", "roadmap", "socials", "memeMaker"]) {
    assert.match(maker, new RegExp(`id="sec-${section}"`), `${section} must exist before the first save`);
  }
  assert.match(maker, /REAL GENERATION ENGINE/);
  assert.match(maker, /Cloudflare reference generation keeps the uploaded character or logo recognizable/);
  assert.match(maker, /FREE CUSTOM BRAND ENGINE/);
  assert.match(maker, /Generate Complete Art Set/);
  assert.match(maker, /Reference type/);
  assert.match(maker, /same recognizable PFP character or logo/);
  assert.match(maker, /referenceType: \$\("#referenceType"\)\.value/);
  assert.match(maker, /format === "set"/);
  assert.match(maker, /Cloudflare is generating/);
  assert.match(maker, /slotUpload/);
  assert.match(maker, /slimewire-site-image-edit/);
  assert.match(maker, /UNPUBLISHED PREVIEW/);
  assert.match(maker, /Published live at/);
  assert.match(server, /body\.format === "set"/);
  assert.match(server, /Scene one:[\s\S]*Scene five:/);
  assert.match(server, /occupies at least 40%[\s\S]*filling about 70%[\s\S]*fills about 45%/);
  assert.match(server, /galleryIndex/);
  assert.match(server, /launchOsTrustedTokenImageBuffer\(referenceUrl\)/);
});

test("published coin sites include live market, chart, lore, gallery, buy flow, roadmap, socials and meme studio", () => {
  for (const text of ["LIVE MARKET", "The ticker", "The lore", "The gallery", "How to buy", "Roadmap", "Meme factory", "Join the signal"]) assert.match(site, new RegExp(text, "i"));
  assert.match(site, /dexscreener\.com/);
  assert.match(site, /\/api\/coin-site\//);
  assert.match(site, /mobileBuy/);
  assert.match(site, /canvas id="meme"/);
  assert.match(site, /location\.search/);
  assert.match(site, /siteHeroDrift/);
  assert.match(site, /body\.cinematic \.hero[\s\S]*place-items:\s*center start/);
  assert.match(site, /SLIMEWIRE .* BUILDING THE WORLD/);
  assert.match(site, /media\?\.mobileHero/);
  assert.match(site, /LIVE .* VERIFIED CA .* COMMUNITY/);
  assert.match(site, /CLICK ANY OUTLINED IMAGE TO REPLACE IT/);
  assert.match(site, /slimewire-site-image-edit/);
  assert.match(site, /data-edit-kind/);
});

test("structured copy generation is prompt-aware, bounded, and safely falls back", () => {
  assert.match(server, /async function launchOsGenerateStructuredCopy/);
  assert.match(server, /gemini-flash-lite-latest/);
  assert.match(server, /responseMimeType: "application\/json"/);
  assert.match(server, /copyPromptHash/);
  assert.match(server, /heroPromptDesktop/);
  assert.match(server, /heroPromptMobile/);
  assert.match(server, /saved\.site\.textProvider = generated \? textProvider : "local"/);
});

test("coin sites charge $10 in SOL, support one-time admin codes, and retain a private owner editor", () => {
  assert.match(server, /const COIN_SITE_PRICE_USD = 10/);
  assert.match(server, /walletRecord\(`coinsite:\$\{id\}`/);
  assert.match(server, /COIN_SITE_DEPOSIT_OWNER/);
  assert.match(server, /coin-site-payment:\$\{project\.id\}/);
  assert.match(server, /drainSolFromWallet[\s\S]*CONFIG\.feeWallet/);
  assert.match(server, /\/\(\?:sitecode\|webcode\)/);
  assert.match(server, /\/\(\?:sitecodes\|webcodes\)/);
  assert.match(server, /\/\(\?:siterevoke\|webrevoke\)/);
  assert.match(server, /pathname\.startsWith\("\/api\/launch-os\/payment\/"\)/);
  assert.match(maker, /Admin free code \(optional\)/);
  assert.match(maker, /Public price: \$10 in SOL/);
  assert.match(maker, /Check now/);
  assert.match(maker, /\/api\/launch-os\/payment\//);
  assert.match(maker, /Copy edit link/);
  assert.match(maker, /id="telegramUsername"/);
  assert.match(maker, /keeps your edit link safe/);
  assert.match(maker, /telegramUsername: tgUsername/);
  assert.match(maker, /crypto\?\.randomUUID/);
  assert.match(maker, /requestId/);
  assert.match(maker, /\[502, 503, 504\]\.includes/);
  assert.match(maker, /Nothing was charged/);
  assert.match(maker, /d\.message \|\| d\.error/);
  assert.match(server, /createRequestId: options\.createRequestId/);
  assert.match(server, /launchOsEditorMatches\(existing, recoveredKey\)/);
  assert.match(maker, /Open bot \+ save edit link/);
  assert.match(maker, /Payment is tracked automatically every 15 seconds/);
  assert.match(maker, /setInterval[\s\S]*15000/);
  assert.match(maker, /solana:\$\{pay\.depositAddress/);
  assert.match(site, /UNPUBLISHED UNTIL \$10 UNLOCK/);
  assert.match(server, /published: payment\.status === "unlocked"/);
  assert.match(server, /function launchOsPublicSlug/);
  assert.match(server, /\/ca\/\$\{encodeURIComponent\(publicSlug\)\}/);
  assert.match(server, /project\.publicSlug/);
  assert.match(server, /siteedit_\(\[A-Za-z0-9_-\]\{16,48\}\)/);
  assert.match(server, /function coinSiteTelegramDeliveryForEditor/);
  assert.match(server, /async function prepareCoinSiteTelegramDelivery/);
  assert.match(server, /editKeySecret: encryptSecret/);
  assert.match(server, /telegram\("getChat"/);
  assert.match(server, /sendCoinSiteEditLinkDm/);
  assert.match(site, /location\.pathname\.split\("\/ca\/"\)/);
  assert.match(site, /`\/ca\/\$\{encodeURIComponent\(__coinProject\)\}`/);
  assert.doesNotMatch(server, /payment: project\.payment/);
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
    assert.match(html, /location\.pathname\.match\(\/\^\\\/ca\\\//);
    assert.match(html, /location\.replace\(`\/coin-site\?project=/);
    assert.match(html, /aria-label="Search coins or paste contract address"/);
    assert.match(html, /placeholder="Search coin \/ paste CA"/);
    assert.match(html, /\.searchbox\{display:flex;width:132px/);
    assert.doesNotMatch(html, /id="pasteCa"/);
  }
});
