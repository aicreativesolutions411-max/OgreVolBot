import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const page = fs.readFileSync(new URL("../web/public/x-dm-menu.html", import.meta.url), "utf8");
const legacyPageUrl = new URL("../web/public/x-menu.html", import.meta.url);
const legacyPage = fs.existsSync(legacyPageUrl) ? fs.readFileSync(legacyPageUrl, "utf8") : "";
const headers = fs.readFileSync(new URL("../web/public/_headers", import.meta.url), "utf8");
const server = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const terminalPage = fs.readFileSync(new URL("../web/public/x-terminal.html", import.meta.url), "utf8");

function functionBody(source, name) {
  const candidates = [`async function ${name}`, `function ${name}`];
  const start = candidates.map((needle) => source.indexOf(needle)).find((index) => index !== -1) ?? -1;
  assert.notEqual(start, -1, `${name} should exist`);
  const signatureEnd = source.indexOf(") {", start);
  const brace = signatureEnd === -1 ? source.indexOf("{", start) : signatureEnd + 2;
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = brace; i < source.length; i += 1) {
    const char = source[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote) {
      if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(start, i + 1);
  }
  throw new Error(`Could not isolate ${name}`);
}

function headerBlock(route) {
  const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return headers.match(new RegExp(`^${escaped}\\r?\\n((?:[ \\t]+[^\\r\\n]+\\r?\\n?)*)`, "m"))?.[0] || "";
}

test("X Trade Pad loads its configured API origin under a restrictive CSP", () => {
  assert.match(page, /name=["']robots["'] content=["']noindex,nofollow,noarchive,nosnippet["']/);
  assert.match(page, /name=["']referrer["'] content=["']no-referrer["']/);
  assert.match(page, /connect-src[^;]*'self'/i);
  assert.match(page, /connect-src[^;]*https:\/\/ogrevolbot\.onrender\.com/i);
  assert.match(page, /<script[^>]+src=["']\/config\.js["']/i);
  assert.match(page, /OGRE_PORTAL_CONFIG/);
  assert.match(page, /https:\/\/ogrevolbot\.onrender\.com/);
  assert.match(page, /fetch\((?:API_URL|API_BASE\s*\+|apiUrl\()/);
  assert.doesNotMatch(page, /fetch\(["']\/api\/x-dm\/menu["']/);
});

test("X Trade Pad removes its signed handoff before network exchange and restores its scoped session", () => {
  const boot = functionBody(page, "boot");
  const saveSession = functionBody(page, "saveSession");
  const stripBootstrapToken = functionBody(page, "stripBootstrapToken");
  assert.match(boot, /\.searchParams\.get\(["']t["']\)/);
  assert.match(page, /localStorage\.getItem\(/);
  assert.match(saveSession, /localStorage\.setItem\(/);
  assert.match(page, /localStorage\.removeItem\(/);
  assert.match(page, /\bsession\b/);

  const handoffAt = boot.search(/handoffToken\s*=\s*bootstrapToken/);
  const exchangeAt = boot.search(/await\s+post\(\{[^}]*token\s*:\s*handoffToken[^}]*action\s*:\s*["']view["']/s);
  const persistAt = boot.search(/saveSession\(/);
  const cleanAt = boot.search(/stripBootstrapToken\(/);
  assert.ok(handoffAt >= 0, "boot should retain the handoff only in memory");
  assert.ok(cleanAt > handoffAt, "the signed query should be removed after it is copied into memory");
  assert.ok(exchangeAt > cleanAt, "the signed query should be removed before any exchange request");
  assert.ok(exchangeAt >= 0, "boot should exchange the one-time signed handoff");
  assert.ok(persistAt > exchangeAt, "the scoped session is stored only after a successful exchange");
  assert.match(boot, /saveSession\([^)]*\.session[^)]*\)/);
  assert.doesNotMatch(boot, /saveSession\(bootstrapToken\)/);
  assert.match(boot, /if \(handoffToken\)[\s\S]*Previous Trade Pad restored/);
  assert.match(stripBootstrapToken, /history\.replaceState\(/);
  assert.doesNotMatch(page.slice(0, page.indexOf("<body")), /history\.replaceState/);
});

test("X Trade Pad stages advanced actions but never calls a browser-side money endpoint", () => {
  for (const action of [
    "save_preset",
    "create_wallet",
    "end_session",
    "prepare_buy",
    "prepare_sell",
    "prepare_bundle_buy",
    "prepare_bundle_sell",
    "prepare_copy_wallet",
    "prepare_copy_launch",
    "prepare_automation"
  ]) assert.match(page, new RegExp(action));
  assert.match(page, /action\s*:\s*["']status["']/);
  assert.match(page, /YES/i);
  assert.match(page, /NO/i);
  assert.doesNotMatch(page, /\/api\/web\/(?:trade|quick-buy|bundle|rh-trade|wallet-launch|copy)/i);
  assert.doesNotMatch(page, /name=["'](?:private|seed|secret)/i);
  assert.doesNotMatch(page, /\.innerHTML\s*=|insertAdjacentHTML|document\.write\s*\(|\beval\s*\(/);
});

test("X Trade Pad keeps a confirmed action locked while polling its server state", () => {
  const pollStatus = functionBody(page, "pollStatus");
  assert.match(pollStatus, /post\(\{\s*action:\s*["']status["']\s*\}\)/);
  assert.match(pollStatus, /data\.pending\s*\|\|\s*data\.executing/);
  assert.match(pollStatus, /scheduleStatusPoll\(2000\)/);
  assert.match(pollStatus, /scheduleStatusPoll\(3500\)/);
  assert.match(pollStatus, /No active X confirmation remains/);
  assert.doesNotMatch(pollStatus, /has the final receipt/);
  assert.match(pollStatus, /try\s*\{\s*await refreshMenu\(true\)/s);
  assert.match(page, /15\s*\*\s*60\s*\*\s*1000/);
});

test("X Trade Pad defaults bundles to one explicit wallet and shows aggregate spend", () => {
  const ensureSelections = functionBody(page, "ensureSelections");
  const selectedWalletIndexes = functionBody(page, "selectedWalletIndexes");
  assert.match(ensureSelections, /selectedBundleWallets\s*=\s*\[String\(selectedWalletIndex\)\]/);
  assert.doesNotMatch(ensureSelections, /wallets\.slice\(0,\s*6\)/);
  assert.doesNotMatch(selectedWalletIndexes, /indexes\s*=\s*\[String\(selectedWalletIndex\)\]/);
  assert.match(page, /id="bundleSummary"/);
  assert.match(page, /Buy total/);
  assert.match(page, /amount\s*\*\s*indexes\.length/);
  assert.match(page, /wallets? #/i);
});

test("wallet creation retries the same request when recovery delivery is uncertain", () => {
  const createWallets = functionBody(page, "createWallets");
  assert.match(createWallets, /requestId:\s*attempt\.requestId/);
  assert.match(createWallets, /walletCreateOutcomeUncertain\(error\)/);
  assert.match(createWallets, /walletCreateAttempt\s*=\s*uncertain\s*\?\s*attempt\s*:\s*null/);
  assert.match(createWallets, /Wallet creation status unknown/);
  assert.match(createWallets, /same request ID will ask for the original files/);
  assert.match(page, /function downloadDocument[\s\S]*recoveryDownloadState\[kind\]\s*=\s*true/);
  assert.match(page, /beforeunload/);
  assert.match(page, /recoveryFilesPending\(\)/);
});

test("X Trade Pad reports failed server logout honestly", () => {
  const endSession = functionBody(page, "endSession");
  assert.match(endSession, /await post\(\{\s*action:\s*"end_session"/);
  assert.match(endSession, /Sign out could not be confirmed/);
  assert.match(endSession, /server session may still be active/i);
  assert.ok(endSession.indexOf("clearSession()") > endSession.indexOf("catch (error)"));
});

test("X Trade Pad tabs expose the complete keyboard tab pattern", () => {
  const switchTab = functionBody(page, "switchTab");
  const handleTabKeydown = functionBody(page, "handleTabKeydown");
  assert.match(page, /class="tabs" role="tablist"/);
  assert.match(page, /role="tab" tabindex="-1"/);
  assert.match(switchTab, /tab\.tabIndex\s*=\s*active\s*\?\s*0\s*:\s*-1/);
  assert.match(handleTabKeydown, /ArrowLeft/);
  assert.match(handleTabKeydown, /ArrowRight/);
  assert.match(handleTabKeydown, /Home/);
  assert.match(handleTabKeydown, /End/);
});

test("legacy X menu preserves its handoff and both private pages opt out of caching", () => {
  assert.ok(legacyPage, "web/public/x-menu.html should provide a backwards-compatible redirect");
  assert.match(legacyPage, /x-dm-menu/);
  assert.match(legacyPage, /(?:location\.(?:replace|href)|URLSearchParams|location\.search)/);
  assert.match(legacyPage, /location\.search/);
  assert.match(legacyPage, /location\.hash/);
  assert.match(headerBlock("/x-dm-menu"), /Cache-Control:\s*no-store/i);
  assert.match(headerBlock("/x-menu"), /Cache-Control:\s*no-store/i);
  for (const route of ["/x-dm-menu", "/x-dm-menu.html", "/x-menu", "/x-menu.html"]) {
    const block = headerBlock(route);
    assert.match(block, /Content-Security-Policy:\s*frame-ancestors 'none'/i);
    assert.match(block, /X-Frame-Options:\s*DENY/i);
    assert.match(block, /X-Content-Type-Options:\s*nosniff/i);
  }
});

test("X Trade Pad API exchanges scoped access and can only stage confirmed money actions", () => {
  const access = functionBody(server, "xDmPadAccess");
  const api = functionBody(server, "xDmMenuApi");
  assert.match(access, /readXDmMenuToken\(body\.token\)/);
  assert.match(access, /createXDmPadSession\(/);
  assert.match(access, /resolveXDmPadSession\(/);
  assert.match(server, /revokeXDmPadSessionsForSender\(state, senderId\)/);
  assert.match(api, /xDmPadAccess\(body, state(?:, action)?\)/);
  assert.match(api, /action === "status"/);
  assert.match(api, /xDmPadPendingSummary\(state, payload\.senderId\)/);
  assert.match(api, /xDmPadExecutingSummary\(state, payload\.senderId\)/);
  assert.match(api, /freshState\.pending\[payload\.senderId\]/);
  assert.match(api, /freshState\.executing\[payload\.senderId\]/);
  assert.match(api, /xDmStartPending\(freshState, payload\.senderId, rec\)/);
  assert.match(api, /xDmTradeConfirmText\(rec, payload\.slot\)/);
  assert.doesNotMatch(api, /tgExecuteQuickBuy|tgExecuteQuickSell|sellTokenFromWallet|webTradeBuy|webTradeSell|webRhTrade|webBundleBuy|webBundleSell/);
  assert.match(server, /request\.method === "POST" && pathname === "\/api\/x-dm\/menu"/);
  assert.doesNotMatch(server, /request\.method === "GET" && pathname === "\/api\/x-dm\/menu"/);
});

test("X Terminal can create a web-account link and open the X DM composer", () => {
  assert.match(server, /pathname === "\/api\/web\/x\/link-code"/);
  assert.match(server, /command: `link \$\{code\}`/);
  assert.match(server, /https:\/\/x\.com\/messages\/compose\?recipient_id=/);
  assert.match(functionBody(server, "handleXLinkCommand"), /text: "Open X DM"/);
  assert.match(terminalPage, /id="createXLink"/);
  assert.match(terminalPage, /id="openXDM"/);
  assert.match(terminalPage, /\/api\/web\/x\/link-code/);
  assert.match(terminalPage, /localStorage\.getItem\("ogreWebToken"\)/);
  assert.match(terminalPage, /"Authorization":"Bearer "\+webToken/);
});
