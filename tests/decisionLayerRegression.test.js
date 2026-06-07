import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const configSource = fs.readFileSync(new URL("../config.js", import.meta.url), "utf8");
const envSource = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const renderSource = fs.readFileSync(new URL("../render.yaml", import.meta.url), "utf8");

function functionBody(name, source = appSource) {
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
    const char = source[index];
    if (char === "(") paramsDepth += 1;
    if (char === ")") {
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
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart + 1, index);
    }
  }
  return "";
}

function sourceSlice(marker, source = appSource, length = 3000) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${marker} is missing`);
  return source.slice(start, start + length);
}

function assertNoHotExternalCalls(source, label) {
  assert.doesNotMatch(source, /\bfetch\s*\(|fetchJsonWithTimeout|createRpcConnection|HELIUS|getParsedTransaction|getSignaturesForAddress|getTokenLargestAccounts/i, `${label} should stay cache/local only`);
}

test("site-wide decision-layer feature flags are present in config, env, and Render", () => {
  const browserFlags = [
    "slimeShieldEnabled",
    "kolDumpDetectorEnabled",
    "replayBeforeBuyEnabled",
    "protectedBuyEnabled",
    "tokenAvatarFixEnabled",
    "chatAiEnabled",
    "chatAiProviderEnabled",
    "siteSmoothnessFixesEnabled",
    "disableUnfinishedButtons",
    "debugPerformanceCounters"
  ];
  const envFlags = [
    "VITE_SLIMESHIELD_ENABLED",
    "VITE_KOL_DUMP_DETECTOR_ENABLED",
    "VITE_REPLAY_BEFORE_BUY_ENABLED",
    "VITE_PROTECTED_BUY_ENABLED",
    "VITE_TOKEN_AVATAR_FIX_ENABLED",
    "VITE_CHAT_AI_ENABLED",
    "VITE_CHAT_AI_PROVIDER_ENABLED",
    "VITE_SITE_SMOOTHNESS_FIXES_ENABLED",
    "VITE_DISABLE_UNFINISHED_BUTTONS",
    "VITE_DEBUG_PERFORMANCE_COUNTERS"
  ];

  for (const flag of browserFlags) assert.match(configSource, new RegExp(`"${flag}"\\s*:`));
  for (const flag of envFlags) {
    assert.match(envSource, new RegExp(`${flag}=`));
    assert.match(renderSource, new RegExp(`key:\\s*${flag}`));
  }
});

test("Live Pair avatars use stable cached src, lazy image loading, and broken-url memory", () => {
  assert.match(appSource, /const avatarSrcByMint = livePairAvatarSrcMemory/);
  assert.match(appSource, /const failedAvatarSrc = new Set\(\)/);
  assert.match(appSource, /const pendingAvatarFetches = new Map\(\)/);
  assert.match(functionBody("stableAvatarSrc"), /failedAvatarSrc\.has/);
  assert.match(functionBody("rememberFailedAvatar"), /failedAvatarSrc\.add/);
  const rowAvatarSlice = sourceSlice("const tokenAvatarFixOn");
  assert.match(rowAvatarSlice, /loading="\$\{loading\}"/);
  assert.match(rowAvatarSlice, /fetchpriority="\$\{fetchPriority\}"/);
  assert.match(rowAvatarSlice, /width="42" height="42"/);
  assert.match(rowAvatarSlice, /onerror="window\.__slimeAvatarLoadFailed/);
  assert.match(serverSource, /const TOKEN_AVATAR_LOOKUP_CONCURRENCY = 5/);
  assert.match(serverSource, /TOKEN_AVATAR_SUCCESS_TTL_MS = 30 \* 24 \* 60 \* 60 \* 1000/);
  assert.match(functionBody("sendWebTokenAvatar", serverSource), /stale-while-revalidate=604800/);
  assertNoHotExternalCalls(functionBody("tokenAvatarForMint", serverSource), "token avatar lookup request");
});

test("SlimeShield, KOL Dump Detector, and Replay endpoints stay cache-first/local", () => {
  assert.match(serverSource, /pathname === "\/api\/web\/slimeshield"[\s\S]*stale-while-revalidate=60/);
  assert.match(serverSource, /pathname === "\/api\/web\/replay-before-buy"[\s\S]*stale-while-revalidate=1800/);
  assert.match(serverSource, /\/api\/web\/kols\/dump-stats[\s\S]*stale-while-revalidate=1800/);

  assertNoHotExternalCalls(functionBody("webSlimeShield", serverSource), "SlimeShield endpoint");
  assertNoHotExternalCalls(functionBody("webReplayBeforeBuy", serverSource), "Replay Before You Buy endpoint");
  assertNoHotExternalCalls(functionBody("webKolDumpStats", serverSource), "KOL Dump Detector endpoint");
  assert.match(functionBody("webSlimeShield", serverSource), /localMarketRowForMint/);
  assert.match(functionBody("webReplayBeforeBuy", serverSource), /rowsFromCachedMarketFeeds/);
  assert.match(functionBody("webKolDumpStats", serverSource), /cachedKolProfiles/);
});

test("Protected Buy is a previewed preset flow, not an auto-submit bypass", () => {
  const presetSlice = sourceSlice("const PROTECTED_BUY_PRESETS");
  const modalBody = functionBody("protectedBuyModalHtml");
  const confirmBody = functionBody("confirmProtectedBuyModal");

  assert.match(presetSlice, /id: "conservative"/);
  assert.match(presetSlice, /id: "scalp"/);
  assert.match(presetSlice, /id: "degen"/);
  assert.match(modalBody, /Adds a simple TP\/SL plan before wallet confirmation/);
  assert.match(modalBody, /You still review and sign in your wallet/);
  assert.match(modalBody, /avoidNeedsAccept/);
  assert.match(confirmBody, /isConnectedTradeWallet/);
  assert.match(confirmBody, /executeQuickBuyAmount/);
  assert.match(confirmBody, /quickPresetTrade/);
  assert.match(confirmBody, /Managed TP\/SL was not server-armed for this connected wallet/);
});

test("KOL Dump Detector and Replay stay inside the existing decision layer UI", () => {
  assert.match(functionBody("kolHtml"), /kolDumpDetectorPanelHtml/);
  assert.match(functionBody("kolDumpDetectorPanelHtml"), /KOL Dump Detector/);
  assert.match(functionBody("kolDumpDetectorPanelHtml"), /Tracks whether watched KOL wallets tend to sell into followers/);
  assert.match(functionBody("renderSlimeShieldDetailsDrawer"), /replayBeforeBuyCardHtml/);
  assert.match(functionBody("replayBeforeBuyCardHtml"), /Replay Before You Buy/);
  assert.match(functionBody("replayBeforeBuyCardHtml"), /Not enough local history yet/);
});

test("Ogre Agent chat is contextual, retryable, copyable, and debug-instrumented", () => {
  assert.match(functionBody("ogreAgentContext"), /slimeShield/);
  assert.match(functionBody("ogreAgentContext"), /kolDumpDetector/);
  assert.match(functionBody("ogreAgentContext"), /replayBeforeBuy/);
  assert.match(functionBody("ogreAgentContext"), /pnlSummary/);
  assert.match(functionBody("ogreAgentHtml"), /data-ogre-agent-send \$\{state\.ogreAgentLoading \? "disabled" : ""\}/);
  assert.match(functionBody("ogreAgentHtml"), /AI can make mistakes\. Always review wallet prompts before signing/);
  assert.match(functionBody("ogreAgentMessageHtml"), /data-copy/);
  assert.match(functionBody("ogreAgentMessageHtml"), /data-ogre-agent-retry/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestStarted"\)/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestTimedOut"\)/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestSucceeded"\)/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestFailed"\)/);
  assert.match(cssSource, /\.ogre-agent-message-tools/);
  assert.match(cssSource, /\.ogre-agent-disclaimer/);
});

test("dev-only performance counters include requested smoothness diagnostics", () => {
  assert.match(functionBody("debugCounter"), /debugPerformanceCounters/);
  assert.match(functionBody("api"), /debugCounter\("duplicateApiRequestsPrevented"\)/);
  assert.match(functionBody("recordPerfEvent"), /debugCounter\("slowApiRequestWarning"\)/);
  assert.match(appSource, /debugCounter\("buttonDoubleClickPrevented"\)/);
  assert.match(appSource, /debugCounter\("avatarCacheHit"\)/);
  assert.match(appSource, /debugCounter\("avatarCacheMiss"\)/);
  assert.match(appSource, /debugCounter\(data\.cacheHit \? "kolStatsCacheHit"/);
  assert.match(appSource, /debugCounter\(result\.cacheHit \? "slimeshieldCacheHit"/);
  assert.match(appSource, /debugCounter\(replay\.cacheHit \? "replayCacheHit"/);
});
