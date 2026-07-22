import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const html = fs.readFileSync(new URL("../web/public/community.html", import.meta.url), "utf8");
const js = fs.readFileSync(new URL("../web/public/community.js", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../web/public/community.css", import.meta.url), "utf8");
const engagementCss = fs.readFileSync(new URL("../web/public/community-engagement.css", import.meta.url), "utf8");
const redirects = fs.readFileSync(new URL("../web/public/_redirects", import.meta.url), "utf8");

test("coin community has a pretty public route and responsive shell", () => {
  assert.match(server, /requestUrl\.pathname\.startsWith\("\/c\/"\)[\s\S]{0,160}serveStaticHtmlPage\(response, "community\.html", "no-store, max-age=0"\)/);
  assert.match(redirects, /^\/c\s+\/community\.html\s+200$/m);
  assert.match(redirects, /^\/c\/\*\s+\/community\.html\s+200$/m);
  assert.match(html, /data-community-shell/);
  assert.match(html, /data-panel="feed"/);
  assert.match(html, /data-panel="chart"/);
  assert.match(html, /data-panel="about"/);
  assert.match(html, /Back to Terminal/);
  assert.ok(html.indexOf('/config.js') < html.indexOf('/community.js'), "runtime API config must load before the community client");
  assert.match(html, /data-directory/);
  assert.match(css, /@media\(max-width:600px\)/);
  assert.match(engagementCss, /\.community-directory/);
  assert.match(engagementCss, /@media\(max-width:600px\)/);
});

test("community live market data stays browser-side and exact-token scoped", () => {
  assert.match(js, /api\.dexscreener\.com\/latest\/dex\/tokens/);
  assert.match(js, /baseToken\?\.address \|\| ""\)\.toLowerCase\(\) === address\.toLowerCase\(\)/);
  assert.match(js, /sort\(\(a, b\) => Number\(b\?\.liquidity\?\.usd/);
  assert.match(js, /\/api\/web\/token-read\?mint=/);
  assert.match(js, /\/api\/web\/rh\/token\?address=/);
  assert.match(js, /setTimeout\(async \(\) =>[\s\S]{0,220}refreshMarket\(\)/);
});

test("community writes are authenticated, durable, attributable, and bounded", () => {
  const authGate = server.indexOf("const auth = await authenticateWebRequest(request)");
  const publicRead = server.indexOf('pathname === "/api/web/community"');
  const publicList = server.indexOf('pathname === "/api/web/communities"');
  const privateSave = server.indexOf('pathname === "/api/web/community/save"');
  assert.ok(publicRead > 0 && publicRead < authGate, "community reads must remain public");
  assert.ok(publicList > publicRead && publicList < authGate, "community discovery must remain public");
  assert.ok(privateSave > authGate, "community creation must use the existing signed-in profile");
  assert.match(server, /COIN_COMMUNITY_FILE = path\.join\(CONFIG\.dataDir, "coin-communities\.json"\)/);
  assert.match(server, /withFileLock\(COIN_COMMUNITY_FILE/);
  assert.match(server, /Only this community's creator can edit its page/);
  assert.match(server, /community\.posts = posts\.slice\(-500\)/);
  assert.match(server, /reactedBy = new Set/);
  assert.match(server, /coin_community_post_reaction/);
  assert.match(server, /coinCommunityProfile\(authStore\.profiles/);
  assert.doesNotMatch(server, /function coinCommunityProfile[\s\S]{0,500}privateKey/);
});

test("community setup supports optimized banners, X identity, memberships and posts", () => {
  assert.match(server, /COIN_COMMUNITY_BANNER_MAX_BYTES/);
  assert.match(server, /resize\(1800, 560/);
  assert.match(server, /\/api\/web\/community\/join/);
  assert.match(server, /\/api\/web\/community\/post/);
  assert.match(server, /\/api\/web\/community\/react/);
  assert.match(server, /\/api\/web\/communities/);
  assert.match(server, /coinCommunityXPostUrl/);
  assert.match(js, /\/api\/web\/profile\/x/);
  assert.match(html, /This is a profile link, not X verification/);
  assert.match(js, /\/api\/web\/community\/save/);
  assert.match(js, /\/api\/web\/community\/join/);
  assert.match(js, /\/api\/web\/community\/post/);
  assert.match(js, /\/api\/web\/community\/react/);
  assert.match(js, /https:\/\/x\.com\/intent\/post/);
  assert.match(js, /window\.OGRE_PORTAL_CONFIG\?\.apiBase/);
  assert.match(js, /fetch\(`\$\{API_BASE\}\$\{path\}`/);
  assert.match(html, /data-auth-form[\s\S]{0,700}type="submit"/);
  assert.match(js, /\[data-auth-form\][\s\S]{0,120}preventDefault\(\)/);
  assert.match(js, /navigator\.share/);
});

test("coin views expose the community route on desktop and mobile", () => {
  const desktop = fs.readFileSync(new URL("../web/public/gg.html", import.meta.url), "utf8");
  const fun = fs.readFileSync(new URL("../web/public/fun.js", import.meta.url), "utf8");
  assert.match(desktop, /href="\/community\?ca='\+encodeURIComponent/);
  assert.match(fun, /class="coin-community-link" href="\/community\?ca=/);
  assert.ok(js.includes("`${location.origin}/community?ca=${encodeURIComponent(state.address)}`"));
});
