export function formatPresetSolAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return "";
  return String(Number(amount.toFixed(6))).replace(/\.0+$/, "");
}

export function tradeActionLabelFromPreset(preset, fallback = "Trade") {
  const amount = formatPresetSolAmount(preset?.amountSol);
  return amount ? `${amount} SOL` : fallback;
}

export function smartChartSuggestion(row = {}) {
  const score = Number(row.bestPickScore || row.score || 0);
  const warnings = Array.isArray(row.riskFlags) ? row.riskFlags.filter(Boolean) : [];
  const momentum = String(row.momentum || row.scalpSetup || row.category || "").toLowerCase();

  if (warnings.length) {
    return `Risk flags: ${warnings.slice(0, 3).join(", ")}. Size carefully and confirm exits before entry.`;
  }
  if (score >= 85) return "Strong setup by current score. Watch volume continuation and keep TP/SL active.";
  if (score >= 70) return "Playable setup. Wait for volume confirmation or use a smaller preset.";
  if (momentum.includes("cool")) return "Cooling setup. Watch for a reclaim before entering.";
  if (score > 0) return "Lower-confidence setup. Use chart, liquidity, and sell pressure checks first.";
  return "Chart mode is ready. Paste a CA or select a token row to load live stats and links.";
}
