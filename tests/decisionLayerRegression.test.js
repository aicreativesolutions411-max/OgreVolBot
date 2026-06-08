import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const appSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../web/public/slimewire-final-overrides.css", import.meta.url), "utf8");
const indexSource = fs.readFileSync(new URL("../web/public/index.html", import.meta.url), "utf8");
const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const configSource = fs.readFileSync(new URL("../config.js", import.meta.url), "utf8");
const envSource = fs.readFileSync(new URL("../.env.example", import.meta.url), "utf8");
const renderSource = fs.readFileSync(new URL("../render.yaml", import.meta.url), "utf8");
const ogreAgentKnowledgeSource = fs.readFileSync(new URL("../src/lib/ogreAgentKnowledge.js", import.meta.url), "utf8");

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
    "devInfoEnabled",
    "postgresHydrationEnabled",
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
    "VITE_DEV_INFO_ENABLED",
    "VITE_POSTGRES_HYDRATION_ENABLED",
    "VITE_CHAT_AI_ENABLED",
    "VITE_CHAT_AI_PROVIDER_ENABLED",
    "VITE_SITE_SMOOTHNESS_FIXES_ENABLED",
    "VITE_DISABLE_UNFINISHED_BUTTONS",
    "VITE_DEBUG_PERFORMANCE_COUNTERS"
  ];
  const backendFlags = [
    "DEV_INFO_SOURCE_HYDRATION_ENABLED",
    "DEV_INFO_SOURCE_SIGNATURE_LIMIT",
    "DEV_INFO_SOURCE_TRANSACTION_LIMIT"
  ];

  for (const flag of browserFlags) assert.match(configSource, new RegExp(`"${flag}"\\s*:`));
  for (const flag of envFlags) {
    assert.match(envSource, new RegExp(`${flag}=`));
    assert.match(renderSource, new RegExp(`key:\\s*${flag}`));
  }
  for (const flag of backendFlags) {
    assert.match(envSource, new RegExp(`${flag}=`));
    assert.match(renderSource, new RegExp(`key:\\s*${flag}`));
  }
});

test("Live Pair avatars use stable cached src, lazy image loading, and broken-url memory", () => {
  assert.match(appSource, /const avatarSrcByMint = livePairAvatarSrcMemory/);
  assert.match(appSource, /const failedAvatarSrc = new Set\(\)/);
  assert.match(appSource, /const pendingAvatarFetches = new Map\(\)/);
  assert.match(functionBody("stableAvatarSrc"), /avatarFailedRecently/);
  assert.match(functionBody("rememberFailedAvatar"), /failedAvatarSrc\.add/);
  const rowAvatarSlice = sourceSlice("const tokenAvatarFixOn");
  assert.match(rowAvatarSlice, /loading="\$\{loading\}"/);
  assert.match(rowAvatarSlice, /fetchpriority="\$\{fetchPriority\}"/);
  assert.match(rowAvatarSlice, /width="42" height="42"/);
  assert.match(rowAvatarSlice, /onerror="window\.__slimeAvatarLoadFailed/);
  assert.match(serverSource, /const TOKEN_AVATAR_LOOKUP_CONCURRENCY = 5/);
  assert.match(serverSource, /const tokenAvatarLookupQueue = new Map\(\)/);
  assert.match(functionBody("scheduleTokenAvatarLookup", serverSource), /tokenAvatarLookupQueue\.set/);
  assert.match(functionBody("pumpTokenAvatarLookupQueue", serverSource), /TOKEN_AVATAR_LOOKUP_CONCURRENCY - tokenAvatarLookupInFlight\.size/);
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
  assert.match(functionBody("webSlimeShield", serverSource), /readPostgresMarketRowForMint/);
  assert.match(functionBody("webReplayBeforeBuy", serverSource), /rowsFromCachedMarketFeeds/);
  assert.match(functionBody("webKolDumpStats", serverSource), /storedKolProfiles/);
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
  assert.doesNotMatch(functionBody("kolHtml"), /kolDumpDetectorPanelHtml/);
  assert.match(functionBody("kolSummaryHtml"), /kolDumpDetailsButtonHtml\(kol\)/);
  assert.match(functionBody("curatedKolActionsHtml"), /kolDumpDetailsButtonHtml\(kol\)/);
  assert.match(functionBody("kolDumpDetailsButtonHtml"), /data-kol-dump-details/);
  assert.match(functionBody("renderKolDumpDetailsDrawer"), /KOL Dump Detector/);
  assert.match(functionBody("renderSlimeShieldDetailsDrawer"), /replayBeforeBuyCardHtml/);
  assert.match(functionBody("replayBeforeBuyCardHtml"), /Replay Before You Buy/);
  assert.match(functionBody("replayBeforeBuyCardHtml"), /Not enough local history yet/);
  assert.doesNotMatch(functionBody("replayBeforeBuyCardHtml"), /data-replay-open/);
});

test("KOL Hot Buys stays a fast token-call feed", () => {
  assert.match(functionBody("scheduleKolAutoRefresh"), /hotBuysMode[\s\S]*10_000/);
  assert.match(functionBody("kolModeDescription"), /Top coins KOL wallets are calling now/);
  assert.match(functionBody("kolHtml"), /const showProfileCards = hasKols && mode !== "hot"/);
  assert.match(functionBody("kolHtml"), /state\.kolScan \? kolRowsHtml\(\)/);
  assert.match(serverSource, /fetchMadeOnSolHotKolTokens/);
  assert.match(serverSource, /callsTracked: kolCount/);
});

test("Ogre Agent chat is contextual, retryable, copyable, and debug-instrumented", () => {
  assert.match(functionBody("ogreAgentContext"), /slimeShield/);
  assert.match(functionBody("ogreAgentContext"), /devInfoSummary/);
  assert.match(functionBody("ogreAgentContext"), /kolDumpDetector/);
  assert.match(functionBody("ogreAgentContext"), /replayBeforeBuy/);
  assert.match(functionBody("ogreAgentContext"), /pnlSummary/);
  assert.match(functionBody("ogreAgentContext"), /profile/);
  assert.match(functionBody("ogreAgentSiteHelpReply", serverSource), /refferal/);
  assert.match(functionBody("ogreAgentSiteHelpReply", serverSource), /Open Profile/);
  assert.match(functionBody("ogreAgentSiteHelpReply", serverSource), /ogreAgentKnowledgeReply/);
  assert.match(functionBody("ogreAgentModelSystemPrompt", serverSource), /ogreAgentKnowledgeSummary/);
  assert.match(ogreAgentKnowledgeSource, /ref code/);
  assert.match(ogreAgentKnowledgeSource, /pfp/);
  assert.match(ogreAgentKnowledgeSource, /stop loss/);
  assert.match(ogreAgentKnowledgeSource, /clip farm/);
  assert.match(ogreAgentKnowledgeSource, /fresh low-MC/);
  assert.match(ogreAgentKnowledgeSource, /start_clip_recording/);
  assert.match(functionBody("webOgreAgentReply", serverSource), /siteHelpReply[\s\S]*ogreAgentKolTrendReply/);
  assert.match(functionBody("ogreAgentHtml"), /data-ogre-agent-send \$\{state\.ogreAgentLoading \? "disabled" : ""\}/);
  assert.match(functionBody("ogreAgentHtml"), /AI can make mistakes\. Always review wallet prompts before signing/);
  assert.match(functionBody("ogreAgentMessageHtml"), /data-copy/);
  assert.match(functionBody("ogreAgentMessageHtml"), /data-ogre-agent-retry/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestStarted"\)/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestTimedOut"\)/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestSucceeded"\)/);
  assert.match(functionBody("sendOgreAgentMessage"), /debugCounter\("chatRequestFailed"\)/);
  assert.match(functionBody("ogreAgentStartListening"), /ogreAgentPrimeMicrophonePermission/);
  assert.match(functionBody("ogreAgentStartListening"), /permissionSessionId !== ogreAgentSpeechSessionId/);
  assert.match(cssSource, /\.ogre-agent-message-tools/);
  assert.match(cssSource, /\.ogre-agent-disclaimer/);
});

test("Dev Info row pill, drawer, and endpoints are cache-first", () => {
  assert.match(functionBody("devInfoPillHtml"), /data-dev-info/);
  assert.match(functionBody("devInfoPillHtml"), /status === "unknown" \? ""/);
  assert.match(functionBody("renderDevInfoDrawer"), /Dev Dump History/);
  assert.match(functionBody("renderDevInfoDrawer"), /Current dev position is not verified yet/);
  assert.match(functionBody("renderDevInfoDrawer"), /Token \/ Source Context/);
  assert.match(functionBody("renderDevInfoDrawer"), /marketContext/);
  assert.match(functionBody("renderDevInfoDrawer"), /Source Evidence/);
  assert.match(functionBody("renderDevInfoDrawer"), /sourceEvidence/);
  assert.match(functionBody("renderDevInfoDrawer"), /Solscan Token/);
  assert.match(functionBody("renderDevInfoDrawer"), /KOLscan Wallet/);
  assert.match(functionBody("scheduleVisibleDevInfoPrefetch"), /setTimeout/);
  assert.match(functionBody("ogreAgentContext"), /likelyDevWalletShort/);
  assert.match(functionBody("postgresPool", serverSource), /pgModule\?\.Pool \|\| pgModule\?\.default\?\.Pool/);
  assert.match(functionBody("postgresPool", serverSource), /postgresCircuitOpenUntil = 0/);
  assert.match(serverSource, /dev-info\\\/summary/);
  assert.match(serverSource, /dev_info_cache/);
  assert.match(serverSource, /dev_wallet_candidates/);
  assert.match(serverSource, /token_metadata/);
  assert.match(serverSource, /pair_snapshots/);
  assert.match(functionBody("computeDevInfoFromLocalData", serverSource), /readPostgresMarketRowForMint/);
  assert.match(functionBody("computeDevInfoFromLocalData", serverSource), /inferPostgresDevWalletCandidateFromTransactions/);
  assert.match(functionBody("computeDevInfoFromLocalData", serverSource), /devInfoReferenceLinks/);
  assert.match(functionBody("devInfoCandidateFromRow", serverSource), /metadata_authority/);
  assert.match(functionBody("webDevInfoDetails", serverSource), /hydrateMarketRowFromPublicSources/);
  assert.match(functionBody("webDevInfoDetails", serverSource), /marketContext/);
  assert.match(functionBody("webDevInfoDetails", serverSource), /sourceEvidence/);
  assert.match(functionBody("webDevInfoDetails", serverSource), /boundedDevInfoSourceHydration/);
  assert.match(functionBody("webDevInfoDetails", serverSource), /sourceHydration/);
  assert.match(functionBody("openDevInfoDetails"), /loadDevInfoDetails\(mint, \{ force: true \}\)/);
  assert.match(functionBody("loadDevInfoDetails"), /force=true/);
  assertNoHotExternalCalls(functionBody("webDevInfoSummary", serverSource), "Dev Info summary endpoint");
  assertNoHotExternalCalls(functionBody("webDevInfoDetails", serverSource), "Dev Info details endpoint");
  assert.match(functionBody("webSlimeShield", serverSource), /webDevInfoSummary/);
  assert.match(functionBody("computeSlimeShield", fs.readFileSync(new URL("../src/lib/slimeShield.js", import.meta.url), "utf8")), /devInfoSlimeShieldFactor/);
});

test("Details buttons force-refresh source-backed data only on click", () => {
  assert.match(functionBody("openSlimeShieldDetails"), /loadSlimeShield\(mint, \{ force: true \}\)/);
  assert.match(functionBody("loadSlimeShield"), /params\.set\("force", "true"\)/);
  assert.match(functionBody("webSlimeShield", serverSource), /force \? "forced-refresh" : "local"/);
  assert.match(functionBody("webSlimeShield", serverSource), /hydrateMarketRowFromPublicSources/);
  assert.match(functionBody("webSlimeShield", serverSource), /marketContext: devInfoMarketContextFromRow/);
  assert.match(functionBody("renderSlimeShieldDetailsDrawer"), /result\.marketContext/);
  assert.match(functionBody("renderSlimeShieldDetailsDrawer"), /sourceEvidence/);
  assert.match(serverSource, /force \? "no-store" : "public, max-age=15/);
  assert.match(functionBody("openKolDumpDetails"), /ensureKolDumpStats\(\{ force: true \}\)/);
  assert.match(functionBody("ensureKolDumpStats"), /\/api\/web\/kols\/dump-stats\?\$\{params\.toString\(\)\}/);
  assert.match(functionBody("ensureKolDumpStats"), /params\.set\("force", "true"\)/);
  assert.match(functionBody("renderKolDumpDetailsDrawer"), /data-kol-dump-refresh/);
  assert.match(functionBody("renderKolDumpDetailsDrawer"), /kolDumpFallbackRowForId/);
  assert.match(functionBody("uniqueKolDumpRows"), /\{ \.\.\.existing, \.\.\.row, kolId: id \}/);
  assert.match(serverSource, /webKolDumpStats\(kolId, \{\s*force,\s*userId: "guest"/);
  assert.match(functionBody("webKolDumpStats", serverSource), /webKolScan\(options\.userId \|\| "guest", mode, wallet\)/);
  assert.match(functionBody("webKolDumpStats", serverSource), /force \? "forced-kol-refresh" : "local-cache"/);
});

test("Dev Info source hydration is capped, stored, and click scoped", () => {
  assert.match(serverSource, /DEV_INFO_SOURCE_SIGNATURE_LIMIT/);
  assert.match(serverSource, /DEV_INFO_SOURCE_TRANSACTION_LIMIT/);
  assert.match(functionBody("hydrateDevInfoFromSourceData", serverSource), /getSignaturesForAddress/);
  assert.match(functionBody("hydrateDevInfoFromSourceData", serverSource), /getParsedTransaction/);
  assert.match(functionBody("hydrateDevInfoFromSourceData", serverSource), /persistPostgresDevWalletEvents/);
  assert.match(functionBody("hydrateDevInfoFromSourceData", serverSource), /persistPostgresProcessedTransactionEvents/);
  assert.match(functionBody("hydrateDevInfoFromSourceData", serverSource), /CONFIG\.devInfoSourceTransactionLimit/);
  assert.match(functionBody("boundedDevInfoSourceHydration", serverSource), /Promise\.race/);
  assert.match(functionBody("boundedDevInfoSourceHydration", serverSource), /Source refresh is still running/);
  assert.match(functionBody("devCurrentTokenSnapshotEvent", serverSource), /getTokenBalanceForMintCached/);
  assert.match(functionBody("devCurrentTokenSnapshotEvent", serverSource), /getTokenSupply/);
  assert.match(functionBody("hydrateMarketRowFromPublicSources", serverSource), /getPumpFunTokenMetadata/);
  assert.match(functionBody("hydrateMarketRowFromPublicSources", serverSource), /fetchHeliusDasTokenMetadata/);
  assert.match(functionBody("metadataFromHeliusDasAsset", serverSource), /mintAuthority/);
  assert.match(functionBody("persistPostgresLivePairRows", serverSource), /metadataAuthority/);
  assert.match(functionBody("renderDevInfoDrawer"), /Source refresh:/);
  assert.match(functionBody("renderSlimeShieldDetailsDrawer"), /Source refresh:/);
  assert.match(functionBody("loadDevInfoDetails"), /timeoutMs: options\.force \? 7000 : 3000/);
});

test("KOL and Dev Info buttons use info labels instead of dump/action-looking text", () => {
  assert.match(appSource, /function kolDumpDetailsButtonHtml\(kol = \{\}, label = "KOL Info"\)/);
  assert.match(appSource, /function kolDumpSignalButtonHtml\(row = \{\}, label = "KOL Info"\)/);
  assert.doesNotMatch(functionBody("kolDumpSignalButtonHtml"), /label = "Dump"/);
  assert.match(appSource, /dump: "Dev"/);
  assert.match(fs.readFileSync(new URL("../src/lib/devInfo.js", import.meta.url), "utf8"), /dump: "Dev"/);
});

test("Slime Scope refreshes its own bucket and Details buttons stay compact green", () => {
  assert.match(functionBody("activeLivePairBucketForTab"), /tabKey === "slimeScope"/);
  assert.match(functionBody("scheduleLivePairsAutoRefresh"), /refreshTerminalFeed\("slimeScope"/);
  assert.match(functionBody("terminalDetailsDrawerOpen"), /devInfoDetails/);
  assert.match(functionBody("scheduleLivePairsRender"), /terminalDetailsDrawerOpen\(\)/);
  assert.match(functionBody("scheduleLivePairsAutoRefresh"), /terminalDetailsDrawerOpen\(\)/);
  assert.match(functionBody("prefetchVisibleDevInfoSummaries"), /terminalDetailsDrawerOpen\(\)/);
  assert.match(functionBody("slimeScopeHtml"), /scopeLoading/);
  assert.match(cssSource, /button\[data-slimeshield-details\]\.slimeshield-pill/);
  assert.match(cssSource, /button\[data-kol-dump-details\]/);
  assert.match(cssSource, /background: linear-gradient\(135deg, rgba\(43, 180, 53/);
  assert.match(cssSource, /swamp-sponsor-links[\s\S]*z-index: 90/);
});

test("mobile Live Terminal, Live Pairs, and Slime Scope refresh without resetting scroll position", () => {
  assert.match(appSource, /MOBILE_STABLE_FEED_TABS = new Set\(\["terminal", "live", "slimeScope"\]\)/);
  assert.match(functionBody("captureStableFeedScrollSnapshot"), /panel\.dataset\.renderedTab/);
  assert.match(functionBody("captureStableFeedScrollSnapshot"), /anchorKey/);
  assert.match(functionBody("restoreStableFeedScrollSnapshot"), /window\.scrollTo\(0, Math\.max\(0, \(window\.scrollY \|\| 0\) \+ delta\)\)/);
  assert.match(functionBody("restoreStableFeedScrollSnapshot"), /window\.setTimeout\(restore, 240\)/);
  assert.match(functionBody("renderTabs"), /captureStableFeedScrollSnapshot\(panel\)/);
  assert.match(functionBody("renderTabs"), /panel\.dataset\.renderedTab = state\.activeTab \|\| ""/);
  assert.match(functionBody("renderTabs"), /restoreStableFeedScrollSnapshot\(stableFeedScrollSnapshot, panel\)/);
  assert.match(cssSource, /MOBILE_LIVE_PAIRS_STABLE_REFRESH_V1/);
  assert.match(cssSource, /data-active-tab="live"[\s\S]*opacity: 1 !important/);
});

test("landing sponsor and KOL entries use the compact top ticker", () => {
  assert.match(indexSource, /data-market-ticker/);
  assert.match(indexSource, /Swamp Sponsors/);
  assert.match(indexSource, /Open USD2 ticker links/);
  assert.match(indexSource, /Open MoonPieJoe ticker links/);
  assert.match(indexSource, /assets\/slimewire\/support\/usd2-sponsor-logo\.jpg/);
  assert.match(indexSource, /https:\/\/share\.google\/y94z9bxjK4RVVohnm/);
  assert.match(indexSource, /https:\/\/x\.com\/USD2onSolana/);
  assert.match(indexSource, /https:\/\/share\.google\/F9EuKDnbjbVml9zK5/);
  assert.match(indexSource, /https:\/\/t\.me\/USD2Solana/);
  assert.match(cssSource, /LANDING_MARKET_TICKER_V1/);
  assert.match(cssSource, /LANDING_MARKET_TICKER_COMPACT_FIX_V1/);
  assert.match(cssSource, /LANDING_GLOBAL_SPONSOR_TICKER_AND_FRAME_FIX_V1/);
  assert.match(cssSource, /swampMarketTickerScroll/);
  assert.match(cssSource, /swamp-ticker-item\[open\] \.swamp-ticker-links[\s\S]*position: fixed/);
  assert.match(cssSource, /main\.shell\[data-app\] \.swamp-market-ticker\[data-market-ticker\][\s\S]*position: fixed/);
  assert.match(cssSource, /swamp-market-ticker\[data-market-ticker\][\s\S]*height: 24px !important/);
  assert.match(cssSource, /swamp-market-ticker\[data-market-ticker\][\s\S]*max-width: 18px !important/);
  assert.match(appSource, /function initializeMarketTickerInteractions\(\)/);
  assert.match(appSource, /closeMarketTickerMenus/);
  assert.doesNotMatch(indexSource, /swamp-ticker-strip" aria-hidden="true" inert/);
  assert.match(indexSource, /swamp-ticker-strip">\s*<span class="swamp-ticker-section">Sponsors<\/span>[\s\S]*Open USD2 ticker links[\s\S]*Open God's Plan ticker links/);
  assert.match(cssSource, /login-view\.swamp-splash::before[\s\S]*aspect-ratio: 4 \/ 3 !important/);
  assert.match(cssSource, /body:has\(main\.shell\[data-app\]\[data-route="intro"\]\) \[data-ogre-agent-root\][\s\S]*display: none !important/);
  assert.match(indexSource, /Stablecoin Partner/);
  assert.match(indexSource, /usd2-sponsor-logo\.jpg"[^>]*width="18" height="18"/);
  assert.doesNotMatch(indexSource, /swamp-sponsor-frame/);
  assert.doesNotMatch(indexSource, /swamp-kol-frame/);
});

test("mobile terminal nav is a slim icon rail and quick buy can open the wallet chooser", () => {
  assert.match(cssSource, /MOBILE_SLIM_HOTKEY_RAIL_FINAL_20260607_V1/);
  assert.match(cssSource, /MOBILE_RIGHT_RAIL_AND_THIN_FEED_BAR_20260607_V1/);
  assert.match(cssSource, /grid-template-columns: minmax\(0, 1fr\) 50px !important/);
  assert.match(cssSource, /\[data-dashboard\] > \.tabs[\s\S]*grid-column: 2 !important/);
  assert.match(cssSource, /\.tabs button::after,[\s\S]*content: attr\(data-label\) !important/);
  assert.match(cssSource, /\.command-controls \.live-pair-buckets,[\s\S]*overflow-x: auto !important/);
  assert.match(appSource, /function openWalletConnectModal\(options = \{\}\)/);
  assert.match(appSource, /return openWalletConnectChooser\(options\)/);
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
