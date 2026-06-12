import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  buildOgreAiCandidatePool,
  diversifyOgreAiCandidates,
  ogreAiTierForCandidate,
  isOgreAiBlockedRisk,
  ogreAiTargetFitScore
} from "../src/lib/ogreAi.js";

const serverSource = fs.readFileSync(new URL("../src/index.js", import.meta.url), "utf8");
const webAppSource = fs.readFileSync(new URL("../web/public/app.js", import.meta.url), "utf8");

function serverFunctionBody(name) {
  const syncMatch = new RegExp(`function\\s+${name}\\s*\\(`).exec(serverSource);
  const asyncMatch = new RegExp(`async\\s+function\\s+${name}\\s*\\(`).exec(serverSource);
  const syncStart = syncMatch?.index ?? -1;
  const asyncStart = asyncMatch?.index ?? -1;
  const start = syncStart >= 0 && (asyncStart < 0 || syncStart < asyncStart) ? syncStart : asyncStart;
  assert.notEqual(start, -1, `${name} is missing`);
  const paramsStart = serverSource.indexOf("(", start);
  let paramsDepth = 0;
  let paramsEnd = -1;
  for (let index = paramsStart; index < serverSource.length; index += 1) {
    const char = serverSource[index];
    if (char === "(") paramsDepth += 1;
    if (char === ")") {
      paramsDepth -= 1;
      if (paramsDepth === 0) {
        paramsEnd = index;
        break;
      }
    }
  }
  const bodyStart = serverSource.indexOf("{", paramsEnd);
  let depth = 0;
  for (let index = bodyStart; index < serverSource.length; index += 1) {
    const char = serverSource[index];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) return serverSource.slice(bodyStart + 1, index);
    }
  }
  return "";
}

const defaults = {
  minScore: 54,
  maxMarketCap: 750_000,
  minLiquidityUsd: 350
};

const freshApeDefaults = {
  minScore: 12,
  minMarketCap: 1_500,
  preferredMaxMarketCap: 5_000,
  maxMarketCap: 8_000,
  maxAgeMinutes: 45,
  minStartingVolumeUsd: 60,
  minLiquidityUsd: 20,
  preferFreshLaunches: true,
  desiredPickCount: 1,
  takeProfitPct: 25,
  targetTakeProfitPct: 25
};

test("Ogre A.I. falls back to balanced picks when strict is empty", () => {
  const rows = [
    {
      tokenMint: "BalancedMint",
      bestPickScore: 43,
      marketCap: 80_000,
      liquidityUsd: 200,
      volume5m: 800,
      pairAgeMinutes: 12
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, defaults, "quick");
  assert.equal(pool.selectedTier, "balanced");
  assert.equal(pool.tierCounts.strict, 0);
  assert.equal(pool.tierCounts.balanced, 1);
  assert.equal(pool.candidates[0].tokenMint, "BalancedMint");
});

test("Ogre A.I. can use best available momentum when strict and balanced are empty", () => {
  const rows = [
    {
      tokenMint: "AvailableMint",
      bestPickScore: 31,
      marketCap: 120_000,
      liquidityUsd: 90,
      volumeM15: 1400,
      pairAgeMinutes: 20
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, defaults, "quick");
  assert.equal(pool.selectedTier, "available");
  assert.equal(pool.tierCounts.available, 1);
  assert.equal(pool.candidates[0].tokenMint, "AvailableMint");
});

test("Ogre A.I. falls back to scout rows when live stats are incomplete", () => {
  const rows = [
    {
      tokenMint: "ScoutMint",
      bestPickScore: 18,
      marketCap: 95_000,
      liquidityUsd: 0,
      volume5m: 0,
      pairAgeMinutes: 15,
      bestPickInputs: ["fresh listing"]
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, defaults, "quick");
  assert.equal(pool.selectedTier, "scout");
  assert.equal(pool.tierCounts.scout, 1);
  assert.equal(pool.candidates[0].tokenMint, "ScoutMint");
});

test("Ogre A.I. still blocks high risk and mayhem rows", () => {
  assert.equal(isOgreAiBlockedRisk({ riskFlags: ["hard dump"] }), true);
  assert.equal(isOgreAiBlockedRisk({ category: "Pump Mayhem" }), true);
  assert.equal(isOgreAiBlockedRisk({ riskFlags: ["clean"], bestPickWarnings: [] }), false);

  assert.equal(ogreAiTierForCandidate({
    tokenMint: "RugMint",
    bestPickScore: 99,
    marketCap: 50_000,
    liquidityUsd: 10_000,
    volume5m: 25_000,
    riskFlags: ["honeypot"]
  }, defaults, "quick"), null);
});

test("Ogre A.I. blocks liquidity-pulled and drained pool rows", () => {
  const row = {
    tokenMint: "PulledLiquidityMint",
    bestPickScore: 95,
    marketCap: 42_000,
    liquidityUsd: 9_000,
    volume5m: 22_000,
    pairAgeMinutes: 6,
    riskFlags: ["liquidity pulled", "pool drained"]
  };

  assert.equal(isOgreAiBlockedRisk(row), true);
  assert.equal(ogreAiTierForCandidate(row, defaults, "quick"), null);
});

test("Ogre A.I. does not starve pending safety rows before buy precheck", () => {
  const pendingRow = {
    tokenMint: "PendingSafetyMint",
    bestPickScore: 58,
    marketCap: 85_000,
    liquidityUsd: 1_200,
    volume5m: 4_000,
    pairAgeMinutes: 8,
    safetyStatus: "pending",
    safetyNote: "Safety pending; buy precheck required",
    riskFlags: ["unknownRisk"]
  };

  assert.equal(isOgreAiBlockedRisk(pendingRow), false);
  assert.equal(ogreAiTierForCandidate(pendingRow, defaults, "quick"), "strict");
});

test("Ogre A.I. prefers strict candidates over fallback tiers", () => {
  const pool = buildOgreAiCandidatePool([
    {
      tokenMint: "FallbackMint",
      bestPickScore: 35,
      marketCap: 100_000,
      liquidityUsd: 100,
      volume5m: 900,
      pairAgeMinutes: 30
    },
    {
      tokenMint: "StrictMint",
      bestPickScore: 66,
      marketCap: 90_000,
      liquidityUsd: 2_000,
      volume5m: 600,
      pairAgeMinutes: 10
    }
  ], defaults, "quick");

  assert.equal(pool.selectedTier, "strict");
  assert.equal(pool.candidates.length, 1);
  assert.equal(pool.candidates[0].tokenMint, "StrictMint");
});

test("Ogre A.I. ranks 100% target picks by fast upside fit", () => {
  const rows = [
    {
      tokenMint: "SaferButSleepyMint",
      bestPickScore: 78,
      marketCap: 650_000,
      liquidityUsd: 8_000,
      volume5m: 500,
      m5: 2,
      buys5m: 3,
      sells5m: 3,
      pairAgeMinutes: 45
    },
    {
      tokenMint: "HundredTargetMint",
      bestPickScore: 48,
      marketCap: 85_000,
      liquidityUsd: 900,
      volume5m: 8_500,
      m5: 22,
      h1: 38,
      buys5m: 17,
      sells5m: 4,
      pairAgeMinutes: 9
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 100, targetTakeProfitPct: 100, desiredPickCount: 1 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "HundredTargetMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. 100% target favors very fresh low market-cap momentum", () => {
  const rows = [
    {
      tokenMint: "OlderStableMint",
      bestPickScore: 82,
      marketCap: 780_000,
      liquidityUsd: 12_000,
      volume5m: 900,
      m5: 4,
      h1: 7,
      buys5m: 5,
      sells5m: 4,
      pairAgeMinutes: 180
    },
    {
      tokenMint: "FreshLowMcMint",
      bestPickScore: 46,
      marketCap: 64_000,
      liquidityUsd: 850,
      volume5m: 6_500,
      m5: 24,
      h1: 31,
      buys5m: 18,
      sells5m: 5,
      pairAgeMinutes: 4
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 100, targetTakeProfitPct: 100, desiredPickCount: 1, maxMarketCap: 350_000, minLiquidityUsd: 120 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "FreshLowMcMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. 100% target keeps older candidates out of the early-pair lane", () => {
  const rows = [
    {
      tokenMint: "OlderLowMcMint",
      bestPickScore: 72,
      marketCap: 90_000,
      liquidityUsd: 1_500,
      volume5m: 2_000,
      m5: 8,
      buys5m: 8,
      sells5m: 4,
      pairAgeMinutes: 210
    },
    {
      tokenMint: "EarlyLowMcMint",
      bestPickScore: 42,
      marketCap: 70_000,
      liquidityUsd: 700,
      volume5m: 3_500,
      m5: 17,
      buys5m: 12,
      sells5m: 3,
      pairAgeMinutes: 12
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 100, targetTakeProfitPct: 100, desiredPickCount: 1, maxMarketCap: 220_000, minLiquidityUsd: 90 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "EarlyLowMcMint");
  assert.equal(ogreAiTierForCandidate(rows[0], targetDefaults, "quick"), null);
});

test("Ogre A.I. ranks 25% target picks toward cleaner quick exits", () => {
  const rows = [
    {
      tokenMint: "RawMoonshotMint",
      bestPickScore: 44,
      marketCap: 55_000,
      liquidityUsd: 220,
      volume5m: 5_500,
      m5: 20,
      buys5m: 12,
      sells5m: 5,
      pairAgeMinutes: 7
    },
    {
      tokenMint: "CleanTwentyFiveMint",
      bestPickScore: 68,
      marketCap: 180_000,
      liquidityUsd: 3_500,
      volume5m: 1_800,
      m5: 7,
      buys5m: 10,
      sells5m: 4,
      pairAgeMinutes: 22
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 25, targetTakeProfitPct: 25, desiredPickCount: 1 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "CleanTwentyFiveMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. 25% target favors older stable breakout over raw fresh moonshot", () => {
  const rows = [
    {
      tokenMint: "RawFreshMoonshotMint",
      bestPickScore: 58,
      marketCap: 28_000,
      liquidityUsd: 260,
      volume5m: 7_500,
      m5: 36,
      buys5m: 16,
      sells5m: 6,
      pairAgeMinutes: 2
    },
    {
      tokenMint: "OlderStableBreakoutMint",
      bestPickScore: 69,
      marketCap: 240_000,
      liquidityUsd: 7_500,
      volume5m: 1_800,
      volumeH1: 9_000,
      m5: 5,
      h1: 12,
      buys5m: 9,
      sells5m: 4,
      pairAgeMinutes: 180
    }
  ];

  const targetDefaults = { ...defaults, takeProfitPct: 25, targetTakeProfitPct: 25, desiredPickCount: 1, minLiquidityUsd: 800, maxMarketCap: 1_400_000 };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "OlderStableBreakoutMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. fills requested stacks from fallback tiers after strict picks", () => {
  const pool = buildOgreAiCandidatePool([
    {
      tokenMint: "BalancedFillMint",
      bestPickScore: 42,
      marketCap: 95_000,
      liquidityUsd: 180,
      volume5m: 1_100,
      m5: 5,
      pairAgeMinutes: 16
    },
    {
      tokenMint: "StrictFillMint",
      bestPickScore: 66,
      marketCap: 90_000,
      liquidityUsd: 2_000,
      volume5m: 600,
      m5: 6,
      pairAgeMinutes: 10
    }
  ], { ...defaults, desiredPickCount: 2 }, "quick");

  assert.equal(pool.selectedTier, "strict");
  assert.equal(pool.candidates.length, 2);
  assert.equal(pool.candidates[0].tokenMint, "StrictFillMint");
  assert.equal(pool.candidates[1].tokenMint, "BalancedFillMint");
});

test("Ogre A.I. demotes recently picked mints when alternatives exist", () => {
  const targetDefaults = {
    ...defaults,
    takeProfitPct: 100,
    targetTakeProfitPct: 100,
    desiredPickCount: 2,
    preferFreshLaunches: true,
    maxMarketCap: 260_000,
    minLiquidityUsd: 90
  };
  const pool = buildOgreAiCandidatePool([
    {
      tokenMint: "RepeatMint",
      bestPickScore: 62,
      marketCap: 58_000,
      liquidityUsd: 900,
      volume5m: 8_000,
      m5: 28,
      buys5m: 18,
      sells5m: 5,
      pairAgeMinutes: 7
    },
    {
      tokenMint: "FreshAltMint",
      bestPickScore: 58,
      marketCap: 72_000,
      liquidityUsd: 820,
      volume5m: 7_200,
      m5: 25,
      buys5m: 16,
      sells5m: 4,
      pairAgeMinutes: 10
    }
  ], targetDefaults, "quick");

  const diversified = diversifyOgreAiCandidates(pool.candidates, targetDefaults, "quick", {
    recentMints: ["RepeatMint"],
    desiredPickCount: 1
  });

  assert.equal(diversified[0].tokenMint, "FreshAltMint");
  assert.equal(diversified.at(-1).tokenMint, "RepeatMint");
});

test("Ogre A.I. prioritizes fresh low-market-cap volume over stale sleepy repeats", () => {
  const rows = [
    {
      tokenMint: "StaleSleepyMint",
      bestPickScore: 88,
      marketCap: 410_000,
      liquidityUsd: 7_000,
      volume5m: 180,
      volumeH1: 950,
      m5: 1.2,
      h1: 2.5,
      buys5m: 2,
      sells5m: 2,
      pairAgeMinutes: 165
    },
    {
      tokenMint: "FreshClimbingMint",
      bestPickScore: 52,
      marketCap: 48_000,
      liquidityUsd: 980,
      volume5m: 5_800,
      volumeM15: 12_400,
      m5: 19,
      h1: 29,
      buys5m: 18,
      sells5m: 4,
      pairAgeMinutes: 8
    }
  ];

  const targetDefaults = {
    ...defaults,
    takeProfitPct: 100,
    targetTakeProfitPct: 100,
    desiredPickCount: 1,
    preferFreshLaunches: true,
    maxMarketCap: 260_000,
    minLiquidityUsd: 90
  };
  const pool = buildOgreAiCandidatePool(rows, targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "FreshClimbingMint");
  assert.ok(ogreAiTargetFitScore(rows[1], targetDefaults, "quick") > ogreAiTargetFitScore(rows[0], targetDefaults, "quick"));
});

test("Ogre A.I. rejects stale pump rows without live volume for high-upside targets", () => {
  const targetDefaults = {
    ...defaults,
    takeProfitPct: 100,
    targetTakeProfitPct: 100,
    maxMarketCap: 260_000,
    minLiquidityUsd: 90
  };
  const stalePump = {
    tokenMint: "StalePumpMintpump",
    bestPickScore: 76,
    isPump: true,
    marketCap: 92_000,
    liquidityUsd: 1_400,
    volume5m: 120,
    volumeH1: 500,
    m5: 1,
    buys5m: 1,
    sells5m: 1,
    pairAgeMinutes: 240
  };

  assert.equal(ogreAiTierForCandidate(stalePump, targetDefaults, "quick"), null);
});

test("Ogre A.I. lets super fresh low-market-cap pump pairs through with modest early signals", () => {
  const targetDefaults = {
    ...defaults,
    takeProfitPct: 100,
    targetTakeProfitPct: 100,
    desiredPickCount: 1,
    preferFreshLaunches: true,
    maxMarketCap: 220_000,
    minLiquidityUsd: 90
  };
  const superFresh = {
    tokenMint: "SuperFreshPotentialMintpump",
    bestPickScore: 28,
    isPump: true,
    marketCap: 18_000,
    liquidityUsd: 24,
    volume5m: 420,
    m5: 5.5,
    buys5m: 2,
    sells5m: 0,
    pairAgeMinutes: 3,
    reasons: ["fresh launch", "early buys"]
  };

  const tier = ogreAiTierForCandidate(superFresh, targetDefaults, "quick");
  assert.ok(["available", "balanced", "strict"].includes(tier), `expected usable tier, got ${tier}`);
  const pool = buildOgreAiCandidatePool([superFresh], targetDefaults, "quick");
  assert.equal(pool.candidates[0].tokenMint, "SuperFreshPotentialMintpump");
});

test("Ogre A.I. web panel exposes sortable scan categories and the scan button", () => {
  assert.doesNotMatch(webAppSource, /data-ogre-ai-mode/);
  assert.doesNotMatch(webAppSource, /data-ogre-ai-min-score/);
  assert.match(webAppSource, /const category = ogreAiCategoryValue\(\)/);
  assert.match(webAppSource, /OGRE_AI_CATEGORIES/);
  assert.match(webAppSource, /data-ogre-cat=/);
  assert.match(webAppSource, /Scan &amp; Ape/);
});

test("Ogre A.I. web panel exposes a guarded autopilot toggle", () => {
  assert.match(webAppSource, /data-autopilot-enabled/);
  assert.match(webAppSource, /data-autopilot-maxspend/);
  assert.match(webAppSource, /function saveOgreAutopilot/);
  assert.match(webAppSource, /spend REAL SOL automatically/);
});

test("Ogre A.I. does not blanket-block Token-2022 trusted-pool candidates", () => {
  assert.equal(isOgreAiBlockedRisk({
    tokenMint: "TrustedPumpToken2022Mintpump",
    dexId: "pumpswap",
    riskFlags: ["token2022"],
    safetyNote: "Token-2022 trusted pool; buy precheck verifies route before swap.",
    marketCap: 6_500,
    liquidityUsd: 50
  }), false);
  assert.equal(isOgreAiBlockedRisk({
    tokenMint: "UnsafeMint",
    dexId: "pumpswap",
    riskFlags: ["token2022"],
    safetyNote: "freeze authority active",
    marketCap: 6_500,
    liquidityUsd: 50
  }), true);
});

test("Ogre A.I. and buy safety use trusted-pool Token-2022 routing instead of a blanket block", () => {
  assert.match(serverSource, /TRUSTED_TOKEN_2022_POOL_RE/);
  // The non-route safety (incl. trusted-pool Token-2022 routing) lives in the shared base
  // helper that assertTokenBuySafety calls, so it stays enforced on the pump-pool buy path too.
  assert.match(serverFunctionBody("assertTokenBuyBaseSafety"), /market\?\.trustedToken2022Pool/);
  assert.match(serverFunctionBody("assertTokenBuySafety"), /assertTokenBuyBaseSafety/);
  assert.doesNotMatch(serverFunctionBody("assertTokenBuyBaseSafety"), /Token-2022 mints are blocked for fast buys/);
  assert.match(serverFunctionBody("filterOgreAiRowsForHardSafety"), /hasTrustedToken2022Pool\(row\)/);
  assert.match(serverFunctionBody("webOgreAiPickSummary"), /poolLabel/);
});

test("Ogre A.I. remembers form presets and defers scan clicks for mobile responsiveness", () => {
  assert.match(webAppSource, /OGRE_AI_FORM_STORAGE_KEY/);
  assert.match(webAppSource, /function readStoredOgreAiFormPreset/);
  assert.match(webAppSource, /function rememberOgreAiFormPreset/);
  assert.match(serverFunctionBody("webOgreAiPickSummary"), /poolLabel/);
  assert.match(webAppSource, /target\.matches\("\[data-ogre-ai-start\]"\)[\s\S]*runDeferredUiTask\(\(\) => startOgreAiRun\(\)\)/);
});

test("Ogre A.I. fresh ape rejects dead fresh pumps with no starting volume", () => {
  const deadFresh = {
    tokenMint: "DeadFreshMintpump",
    bestPickScore: 34,
    isPump: true,
    marketCap: 6_200,
    liquidityUsd: 24,
    volume5m: 0,
    volumeM15: 0,
    volumeM30: 0,
    volumeH1: 0,
    buys5m: 0,
    sells5m: 0,
    trades5m: 0,
    pairAgeMinutes: 2
  };

  assert.equal(ogreAiTierForCandidate(deadFresh, freshApeDefaults, "fresh_ape"), null);
  const pool = buildOgreAiCandidatePool([deadFresh], freshApeDefaults, "fresh_ape");
  assert.equal(pool.selectedTier, "none");
  assert.equal(pool.tierCounts.blocked, 1);
});

test("Ogre A.I. Strong mode buys proven survivors, not unproven or dumping pairs", () => {
  const strongDefaults = {
    minScore: 34,
    minMarketCap: 6_000,
    preferredMaxMarketCap: 60_000,
    maxMarketCap: 120_000,
    minAgeMinutes: 1.5,
    maxAgeMinutes: 12,
    minLiquidityUsd: 1_500,
    desiredPickCount: 1
  };

  // Proven survivor: 4 min old, net buyers, real trades, healthy liquidity,
  // rising-not-blown-off, socials -> a Strong entry.
  const survivor = {
    tokenMint: "StrongSurvivorMintpump",
    isPump: true,
    marketCap: 28_000,
    liquidityUsd: 1_400,
    volume5m: 2_200,
    buys5m: 14,
    sells5m: 5,
    trades5m: 19,
    m5: 18,
    pairAgeSeconds: 240,
    twitterUrl: "https://x.com/strongtoken"
  };
  assert.ok(["strict", "balanced", "available"].includes(ogreAiTierForCandidate(survivor, strongDefaults, "strong")));

  // Too young (40s) - not yet a proven survivor.
  assert.equal(ogreAiTierForCandidate({ ...survivor, tokenMint: "TooYoungMintpump", pairAgeSeconds: 40 }, strongDefaults, "strong"), null);

  // Being dumped (sells dominate) - rejected even if old enough.
  assert.equal(ogreAiTierForCandidate({ ...survivor, tokenMint: "DumpingMintpump", buys5m: 3, sells5m: 16 }, strongDefaults, "strong"), null);

  // Already blown off (+400%) - too late, would be exit liquidity.
  assert.equal(ogreAiTierForCandidate({ ...survivor, tokenMint: "BlownOffMintpump", m5: 420 }, strongDefaults, "strong"), null);
});

test("Ogre A.I. fresh ape needs multi-buyer confirmation and rewards socials", () => {
  // A single dev buy with no follow-on buyers is the bundle-rug signature -
  // it must NOT qualify as a fresh-ape entry.
  const oneDevBuy = {
    tokenMint: "OneBuyMintpump",
    isPump: true,
    marketCap: 4_200,
    liquidityUsd: 30,
    volume5m: 40,
    buys5m: 1,
    sells5m: 0,
    trades5m: 1,
    pairAgeSeconds: 12
  };
  assert.equal(ogreAiTierForCandidate(oneDevBuy, freshApeDefaults, "fresh_ape"), null);

  // Several independent buys with net-positive flow = a real entry. Kept in
  // the fallback cap band with modest flow so the fit score stays below the
  // clamp ceiling and the social boost is observable.
  const confirmed = {
    tokenMint: "ConfirmedBuyersMintpump",
    isPump: true,
    marketCap: 6_500,
    liquidityUsd: 30,
    volume5m: 65,
    buys5m: 3,
    sells5m: 0,
    trades5m: 3,
    pairAgeSeconds: 25
  };
  assert.ok(["strict", "balanced", "available"].includes(ogreAiTierForCandidate(confirmed, freshApeDefaults, "fresh_ape")));

  // A verified-looking X link raises the fresh-ape fit score (ranking boost).
  const noSocial = ogreAiTargetFitScore(confirmed, freshApeDefaults, "fresh_ape");
  const withX = ogreAiTargetFitScore({ ...confirmed, twitterUrl: "https://x.com/realtoken" }, freshApeDefaults, "fresh_ape");
  assert.ok(withX > noSocial, `socials should raise fit (${withX} vs ${noSocial})`);
});

test("Ogre A.I. fresh ape allows pairs near the 1.5k market-cap floor when flow starts", () => {
  const tinyFresh = {
    tokenMint: "TinyFreshMintpump",
    bestPickScore: 11,
    isPump: true,
    marketCap: 1_650,
    liquidityUsd: 22,
    volume5m: 82,
    buys5m: 2,
    sells5m: 0,
    trades5m: 2,
    pairAgeMinutes: 3,
    reasons: ["fresh launch", "early buys"]
  };

  const tier = ogreAiTierForCandidate(tinyFresh, freshApeDefaults, "fresh_ape");
  assert.ok(["strict", "balanced", "available"].includes(tier), `expected fresh ape tier, got ${tier}`);
});

test("Ogre A.I. fresh ape prefers under-5k starting-volume pairs before fallback caps", () => {
  const rows = [
    {
      tokenMint: "FallbackSubEightMintpump",
      bestPickScore: 82,
      isPump: true,
      marketCap: 7_200,
      liquidityUsd: 240,
      volume5m: 2_000,
      buys5m: 8,
      sells5m: 1,
      trades5m: 9,
      pairAgeMinutes: 3
    },
    {
      tokenMint: "PrimaryUnderFiveMintpump",
      bestPickScore: 12,
      isPump: true,
      marketCap: 4_200,
      liquidityUsd: 32,
      volume5m: 105,
      buys5m: 2,
      sells5m: 0,
      trades5m: 2,
      pairAgeMinutes: 4
    }
  ];

  const pool = buildOgreAiCandidatePool(rows, freshApeDefaults, "fresh_ape");
  assert.equal(pool.selectedTier, "strict");
  assert.equal(pool.candidates[0].tokenMint, "PrimaryUnderFiveMintpump");
  assert.equal(ogreAiTierForCandidate({
    tokenMint: "TooLateNineKMintpump",
    bestPickScore: 99,
    isPump: true,
    marketCap: 9_200,
    liquidityUsd: 260,
    volume5m: 3_000,
    buys5m: 12,
    sells5m: 1,
    trades5m: 13,
    pairAgeMinutes: 2
  }, freshApeDefaults, "fresh_ape"), null);
});

test("Ogre A.I. server collapses old mode names into fresh ape defaults", () => {
  assert.match(serverFunctionBody("normalizeOgreAiMode"), /return "fresh_ape"/);
  // Fresh APE band: under-30s pairs with MC >= $3k (sourced from the
  // PumpPortal websocket, so sub-minute ages are exact).
  assert.match(serverFunctionBody("ogreAiModeDefaults"), /preferredMaxMarketCap:\s*8_000/);
  assert.match(serverFunctionBody("ogreAiModeDefaults"), /maxMarketCap:\s*15_000/);
  assert.match(serverFunctionBody("ogreAiModeDefaults"), /minMarketCap:\s*3_000/);
  assert.match(serverFunctionBody("ogreAiModeDefaults"), /maxAgeMinutes:\s*2\b/);
  assert.match(serverFunctionBody("ogreAiModeDefaults"), /minStartingVolumeUsd:\s*60/);
  assert.match(serverFunctionBody("ogreAiScannerModesForTarget"), /\["pumpsnipe", "moonshot", "fast"\]/);
});

test("Token-2022 buy guard falls back to the cached feed row for brand-new tokens", () => {
  // A sub-30s token is not on DexScreener yet, so the buy-time market lookup
  // must merge our own feed row (which carries the launchpad pool/source the
  // candidate selection already trusted) - otherwise legit fresh launchpad
  // Token-2022 launches get rejected purely for being too new to be indexed.
  const body = serverFunctionBody("tokenMarketSafetyInfo");
  assert.match(body, /localMarketRowForMint\(tokenMint\)/);
  assert.match(body, /\.\.\.feedRow/);
  // The honeypot / mint-freeze guard text must still be present and unchanged.
  assert.match(serverFunctionBody("assertTokenBuyBaseSafety"), /Token-2022 requires a trusted/);
  assert.match(serverFunctionBody("assertTokenBuyBaseSafety"), /freeze authority is still active/);
});

test("Ogre A.I. uses a fast cached-market fallback before failing empty", () => {
  assert.match(serverSource, /OGRE_AI_SOURCE_SOFT_TIMEOUT_MS = 1_500/);
  assert.match(serverSource, /OGRE_AI_SAFETY_SCAN_BUDGET_MS = 1_700/);
  assert.match(serverFunctionBody("selectOgreAiPicks"), /cachedOgreAiMarketRows\(defaults, mode\)/);
  assert.match(serverFunctionBody("selectOgreAiPicks"), /Safety lookup timed out; buy precheck still runs before any swap\./);
  assert.match(serverFunctionBody("cachedOgreAiMarketRows"), /rowsFromCachedMarketFeeds\(\)/);
});
