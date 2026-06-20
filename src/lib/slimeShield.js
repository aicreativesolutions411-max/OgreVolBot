import { devInfoSlimeShieldFactor } from "./devInfo.js";

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const raw = String(value).trim().replace(/[$,%_\s,]/g, "");
  if (!raw) return null;
  const match = raw.match(/^([-+]?\d*\.?\d+)([kmb])?$/i);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  const suffix = String(match[2] || "").toLowerCase();
  if (suffix === "k") return number * 1_000;
  if (suffix === "m") return number * 1_000_000;
  if (suffix === "b") return number * 1_000_000_000;
  return number;
}

function firstNumber(...values) {
  for (const value of values) {
    const number = parseNumber(value);
    if (Number.isFinite(number) && number > 0) return number;
  }
  for (const value of values) {
    const number = parseNumber(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function normalizeAgeMinutes(row = {}) {
  const minutes = firstNumber(row.pairAgeMinutes, row.ageMinutes, row.tokenAgeMinutes);
  if (Number.isFinite(minutes)) return minutes;
  const seconds = firstNumber(row.pairAgeSeconds, row.ageSeconds);
  return Number.isFinite(seconds) ? seconds / 60 : null;
}

function factor(key, label, severity, message, weight) {
  return { key, label, severity, message, weight };
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function slimeShieldVerdictFromScore(score, factors = []) {
  const hardAvoid = factors.some((item) => item.key === "hard_flag");
  const nonLiquidityRiskCount = factors.filter((item) => item.severity === "risk" && item.key !== "liquidity_extreme").length;
  if (hardAvoid || (score < 35 && nonLiquidityRiskCount >= 2)) return "AVOID";
  if (score < 60) return "RISK";
  if (score < 75) return "CAUTION";
  return "BUY";
}

// Hard-danger detector for fresh-ape autopilot. Brand-new pump.fun pairs are
// EXPECTED to be thin on liquidity/volume/age - those must not block a buy.
// This returns true only for genuine, non-recoverable danger: mayhem, an
// active mint/freeze authority (a real pump curve has neither), honeypot /
// can't-sell, blacklist, transfer hooks, or a confirmed rug. Liquidity, age,
// volume, flow, and score factors are deliberately ignored.
const SLIMESHIELD_HARD_DANGER_RE = /honeypot|mint authority|mintable|freeze authority|freezable|freezeable|blacklist|cannot sell|can'?t sell|sell disabled|sell blocked|trading disabled|no sell|non-?transferable|transfer hook|balances mutable|\brug\b|scam|mayhem|liquidity (?:pulled|removed|drained)|lp (?:pulled|removed|drained)|pool drained/i;

export function slimeShieldHasHardDanger(shield) {
  if (!shield || typeof shield !== "object") return false;
  const factors = Array.isArray(shield.factors) ? shield.factors : [];
  for (const item of factors) {
    if (item?.key === "hard_flag") return true;
    if (item?.severity !== "risk") continue;
    const text = `${item?.label || ""} ${item?.message || ""}`;
    if (SLIMESHIELD_HARD_DANGER_RE.test(text)) return true;
  }
  return SLIMESHIELD_HARD_DANGER_RE.test(String(shield.summary || ""));
}

export function computeSlimeShield(row = {}, options = {}) {
  const mint = String(row.tokenMint || row.mint || row.tokenAddress || options.mint || "").trim();
  let score = 70;
  const factors = [];
  const knownSignals = [];
  const unknownSignals = [];

  const liquidityUsd = firstNumber(row.liquidityUsd, row.currentLiquidityUsd, row.liquidity?.usd);
  if (!Number.isFinite(liquidityUsd)) {
    score -= 6;
    unknownSignals.push("liquidity");
    factors.push(factor("liquidity_unknown", "Liquidity", "neutral", "Liquidity is not cached yet.", -6));
  } else if (liquidityUsd < 750) {
    score -= 36;
    knownSignals.push("liquidity");
    factors.push(factor("liquidity_extreme", "Liquidity", "risk", "Liquidity is extremely thin for fast entries.", -36));
  } else if (liquidityUsd < 3_000) {
    score -= 20;
    knownSignals.push("liquidity");
    factors.push(factor("liquidity_thin", "Liquidity", "risk", "Liquidity is thin, so entries and exits can slip.", -20));
  } else if (liquidityUsd >= 20_000) {
    score += 8;
    knownSignals.push("liquidity");
    factors.push(factor("liquidity_clean", "Liquidity", "positive", "Liquidity is healthier than most fresh launches.", 8));
  } else {
    knownSignals.push("liquidity");
    factors.push(factor("liquidity_ok", "Liquidity", "neutral", "Liquidity is workable but still early-market risk.", 0));
  }

  const ageMinutes = normalizeAgeMinutes(row);
  if (!Number.isFinite(ageMinutes)) {
    score -= 4;
    unknownSignals.push("age");
    factors.push(factor("age_unknown", "Age", "neutral", "Pair age is not fully verified yet.", -4));
  } else if (ageMinutes < 3) {
    score -= 10;
    knownSignals.push("age");
    factors.push(factor("very_fresh", "Age", "caution", "Very fresh launch; fake volume and exit risk are harder to read.", -10));
  } else if (ageMinutes > 60) {
    score += 4;
    knownSignals.push("age");
    factors.push(factor("aged_in", "Age", "positive", "Token has more than an hour of observable trading.", 4));
  } else {
    knownSignals.push("age");
  }

  const volume = firstNumber(row.volumeM15, row.volumeH1, row.volume5m, row.volumeUsd);
  if (!Number.isFinite(volume)) {
    unknownSignals.push("volume");
  } else if (volume <= 0) {
    score -= 5;
    knownSignals.push("volume");
    factors.push(factor("volume_missing", "Volume", "caution", "Trading volume is not visible yet.", -5));
  } else if (volume >= 10_000) {
    score += 6;
    knownSignals.push("volume");
    factors.push(factor("volume_active", "Volume", "positive", "Volume is active enough to review flow.", 6));
  } else {
    knownSignals.push("volume");
  }

  const buys = firstNumber(row.buys5m, row.buysH1, row.buys);
  const sells = firstNumber(row.sells5m, row.sellsH1, row.sells);
  if (Number.isFinite(buys) && Number.isFinite(sells)) {
    knownSignals.push("flow");
    if (sells >= buys * 1.8 && sells >= 5) {
      score -= 18;
      factors.push(factor("sell_pressure", "Flow", "risk", "Recent sell pressure is stronger than buys.", -18));
    } else if (buys >= sells * 1.4 && buys >= 8) {
      score += 5;
      factors.push(factor("buy_pressure", "Flow", "positive", "Buy flow is currently stronger than sell flow.", 5));
    }
  } else {
    unknownSignals.push("flow");
  }

  const bestScore = firstNumber(row.bestPickScore, row.score);
  if (Number.isFinite(bestScore)) {
    knownSignals.push("score");
    if (bestScore >= 78) {
      score += 7;
      factors.push(factor("best_pick", "Best Pick", "positive", "Existing SlimeWire score is strong.", 7));
    } else if (bestScore < 45) {
      score -= 10;
      factors.push(factor("weak_score", "Best Pick", "caution", "Existing SlimeWire score is weak.", -10));
    }
  }

  const riskText = [
    ...(Array.isArray(row.riskFlags) ? row.riskFlags : []),
    ...(Array.isArray(row.scoreWarnings) ? row.scoreWarnings : []),
    ...(Array.isArray(row.bestPickWarnings) ? row.bestPickWarnings : [])
  ].map((item) => String(item || "").toLowerCase());
  if (riskText.some((text) => /mayhem|fake|scam|honeypot|blacklist/.test(text))) {
    score -= 40;
    factors.push(factor("hard_flag", "Hard Flag", "risk", "A severe token warning is present.", -40));
  }
  if (riskText.some((text) => /bundle|bundled|cluster|concentr/.test(text))) {
    score -= 18;
    factors.push(factor("bundle_risk", "Bundle Risk", "risk", "Bundled supply or wallet clustering is flagged.", -18));
  }
  if (riskText.some((text) => /dev|fresh wallet|fresh-wallet|insider/.test(text))) {
    score -= 14;
    factors.push(factor("fresh_wallets", "Fresh Wallets", "caution", "Fresh/dev wallet activity is part of the risk read.", -14));
  }
  if (riskText.some((text) => /mint|freeze|token-2022/.test(text))) {
    score -= 24;
    factors.push(factor("authority_risk", "Authority Risk", "risk", "Mint/freeze/token-program risk is visible.", -24));
  }

  const kolDumpRisk = firstNumber(row.kolDumpRiskPercent, row.dumpRiskPercent);
  if (Number.isFinite(kolDumpRisk)) {
    knownSignals.push("kol");
    if (kolDumpRisk >= 50) {
      score -= 24;
      factors.push(factor("kol_dump_risk", "KOL Flow", "risk", "Tracked KOL flow has high dump risk.", -24));
    } else if (kolDumpRisk >= 30) {
      score -= 12;
      factors.push(factor("kol_mixed", "KOL Flow", "caution", "Tracked KOL flow is mixed.", -12));
    } else {
      score += 4;
      factors.push(factor("kol_trusted", "KOL Flow", "positive", "Tracked KOL flow is not showing high dump risk.", 4));
    }
  }

  const devInfoSummary = row.devInfoSummary || row.devInfo || null;
  if (devInfoSummary && typeof devInfoSummary === "object") {
    const devFactor = devInfoSlimeShieldFactor(devInfoSummary);
    if (devFactor) {
      score += Number(devFactor.weight || 0);
      factors.push(devFactor);
      if (["hold", "mixed", "risk", "dump"].includes(String(devInfoSummary.status || "").toLowerCase())) {
        knownSignals.push("devInfo");
      } else {
        unknownSignals.push("devInfo");
      }
    }
  }

  // Triple-engine read: GoPlus token-security flags and Rugcheck risks stack
  // into the same verdict alongside SlimeWire's own market signals. A null
  // result means the engine has not answered (unknown), an empty list means
  // it answered clean - those are very different for confidence.
  const goplusFlags = Array.isArray(row.goplusFlags)
    ? row.goplusFlags
    : Array.isArray(row.goplus?.flags) ? row.goplus.flags : null;
  if (goplusFlags) {
    knownSignals.push("goplus");
    const flagsText = goplusFlags.map((item) => String(item || "").toLowerCase());
    const severeFlags = flagsText.filter((text) => /mint authority|freeze authority|balances mutable|non-transferable/.test(text));
    if (severeFlags.length) {
      score -= 22;
      factors.push(factor("goplus_risk", "GoPlus", "risk", `GoPlus security: ${goplusFlags.slice(0, 3).join(", ")}.`, -22));
    } else if (flagsText.length) {
      score -= 8;
      factors.push(factor("goplus_caution", "GoPlus", "caution", `GoPlus flags: ${goplusFlags.slice(0, 3).join(", ")}.`, -8));
    } else {
      score += 4;
      factors.push(factor("goplus_clean", "GoPlus", "positive", "GoPlus security scan found no token-control flags.", 4));
    }
  }
  // No goplus read = supplemental engine missing, not an unknown core signal.

  const rugcheckRisks = Array.isArray(row.rugcheckRisks)
    ? row.rugcheckRisks
    : Array.isArray(row.rugcheck?.risks) ? row.rugcheck.risks : null;
  if (rugcheckRisks) {
    knownSignals.push("rugcheck");
    const riskNames = rugcheckRisks.map((item) => String(item?.name || item || "")).filter(Boolean);
    const severeCount = rugcheckRisks.filter((item) => /danger|critical|high/i.test(String(item?.level || ""))).length;
    if (severeCount > 0) {
      score -= 20;
      factors.push(factor("rugcheck_risk", "Rugcheck", "risk", `Rugcheck: ${riskNames.slice(0, 3).join(", ")}.`, -20));
    } else if (riskNames.length) {
      score -= 6;
      factors.push(factor("rugcheck_caution", "Rugcheck", "caution", `Rugcheck notes: ${riskNames.slice(0, 3).join(", ")}.`, -6));
    } else {
      score += 4;
      factors.push(factor("rugcheck_clean", "Rugcheck", "positive", "Rugcheck found no major risks.", 4));
    }
  }

  // SOLANA TRACKER (paid /tokens/{mint}) — the real on-chain risk read the free engines miss:
  // top-holder concentration, LP burn, and a deployer rug verdict. A loaded report is a KNOWN
  // signal (lifts confidence out of "low"), filling the void Dev Info/SlimeShield used to show blank.
  if (row.solanaTrackerLoaded) {
    knownSignals.push("solanatracker");
    if (row.stRugged === true) {
      score -= 40;
      factors.push(factor("st_rugged", "Solana Tracker", "risk", "Solana Tracker flags this token as rugged.", -40));
    }
    const topHold = firstNumber(row.topHolderPercent);
    if (Number.isFinite(topHold) && topHold > 0) {
      if (topHold >= 80) {
        score -= 18;
        factors.push(factor("st_concentration", "Holders", "risk", `Top holders control ${Math.round(topHold)}% of supply.`, -18));
      } else if (topHold >= 60) {
        score -= 9;
        factors.push(factor("st_concentration_mid", "Holders", "caution", `Top holders control ${Math.round(topHold)}% of supply.`, -9));
      } else if (topHold <= 35) {
        score += 4;
        factors.push(factor("st_distributed", "Holders", "positive", `Supply is fairly distributed (top holders ${Math.round(topHold)}%).`, 4));
      }
    }
    // LP burn is only meaningful for a graduated/real-pool coin — a bonding-curve coin has no LP yet.
    const lpBurn = firstNumber(row.lpBurnedPercent);
    if (Number.isFinite(lpBurn) && !row.stOnCurve) {
      if (lpBurn >= 90) {
        score += 5;
        factors.push(factor("st_lp_burned", "LP", "positive", "Liquidity is burned / locked.", 5));
      } else if (lpBurn < 20) {
        score -= 12;
        factors.push(factor("st_lp_open", "LP", "risk", "Liquidity is not burned — rug-pull risk.", -12));
      }
    }
    const stScore = firstNumber(row.stRugScore);
    if (Number.isFinite(stScore) && stScore >= 7) {
      const notes = Array.isArray(row.stRiskNotes) ? row.stRiskNotes.slice(0, 3).join(", ") : "";
      score -= 12;
      factors.push(factor("st_risk_score", "Solana Tracker", "risk", `High risk score${notes ? `: ${notes}` : ""}.`, -12));
    }
  }

  const finalScore = clampScore(score);
  const verdict = slimeShieldVerdictFromScore(finalScore, factors);
  const confidence = knownSignals.length >= 5 && unknownSignals.length <= 1
    ? "high"
    : knownSignals.length >= 3
      ? "medium"
      : "low";
  const summary = summaryForVerdict(verdict, factors);
  const suggestedAction = verdict === "BUY"
    ? "normal_buy"
    : verdict === "CAUTION"
      ? "small_buy"
      : verdict === "RISK"
        ? "watch_only"
        : "avoid";

  return {
    mint,
    verdict,
    score: finalScore,
    confidence,
    summary,
    factors: factors.slice(0, 10),
    suggestedAction,
    protectedBuyPreset: verdict === "BUY" ? "scalp" : verdict === "AVOID" ? "conservative" : "conservative",
    updatedAt: new Date().toISOString()
  };
}

function summaryForVerdict(verdict, factors = []) {
  if (verdict === "BUY") return "Clean setup. Normal size still depends on your risk.";
  if (verdict === "CAUTION") return "Trade small or use protection.";
  if (verdict === "RISK") return "High-risk setup. Protected Buy recommended if you enter.";
  const top = factors.find((item) => item.severity === "risk");
  return top?.message ? `Avoid recommended. ${top.message}` : "Avoid recommended. Multiple danger signals.";
}
