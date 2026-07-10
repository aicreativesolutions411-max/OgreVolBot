function finiteNumber(...values) {
  for (const value of values) {
    if (value == null || value === "" || typeof value === "boolean") continue;
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return null;
}

function objectAt(value, key) {
  const child = value && typeof value === "object" ? value[key] : null;
  return child && typeof child === "object" && !Array.isArray(child) ? child : {};
}

// Normalizes the current PnL v2 response and the older flat response. Missing data remains null so
// callers never turn a provider failure into a convincing-looking $0 PnL.
export function normalizeSolWalletPnlSummary(raw) {
  if (!raw || typeof raw !== "object") {
    return {
      available: false, realizedUsd: null, unrealizedUsd: null, totalPnlUsd: null,
      winRate: null, wins: null, losses: null, tradeCount: null, tokensTraded: null,
      buys: null, sells: null, investedUsd: null, proceedsUsd: null,
      openCostUsd: null, openValueUsd: null,
    };
  }
  const summary = objectAt(raw, "summary");
  const pnl = Object.keys(objectAt(summary, "pnl")).length
    ? objectAt(summary, "pnl")
    : (Object.keys(objectAt(raw, "pnl")).length ? objectAt(raw, "pnl") : summary);
  const analysis = objectAt(raw, "analysis");
  const analysisTokens = objectAt(analysis, "tokens");
  const stats = objectAt(raw, "stats");
  const counts = Object.keys(objectAt(summary, "counts")).length ? objectAt(summary, "counts") : objectAt(raw, "counts");
  const open = objectAt(summary, "openPositions");

  const realizedUsd = finiteNumber(pnl.realized, pnl.realizedUsd, pnl.realized_usd, raw.realized, raw.realizedUsd, raw.realized_usd);
  const unrealizedUsd = finiteNumber(pnl.unrealized, pnl.unrealizedUsd, pnl.unrealized_usd, raw.unrealized, raw.unrealizedUsd, raw.unrealized_usd);
  let totalPnlUsd = finiteNumber(pnl.total, pnl.totalUsd, pnl.total_usd, pnl.pnl, raw.total, raw.totalUsd, raw.pnl);
  if (totalPnlUsd == null && (realizedUsd != null || unrealizedUsd != null)) {
    totalPnlUsd = (realizedUsd || 0) + (unrealizedUsd || 0);
  }
  let winRate = finiteNumber(analysis.winRate, analysis.winPercentage, raw.winRate, raw.winPercentage, stats.winRate, stats.winPercentage);
  if (winRate != null && winRate > 0 && winRate <= 1) winRate *= 100;

  return {
    available: realizedUsd != null || unrealizedUsd != null || totalPnlUsd != null,
    realizedUsd,
    unrealizedUsd,
    totalPnlUsd,
    winRate,
    wins: finiteNumber(analysisTokens.winning, analysis.wins, raw.totalWins, raw.wins, stats.wins, stats.profitable),
    losses: finiteNumber(analysisTokens.losing, analysis.losses, raw.totalLosses, raw.losses, stats.losses, stats.losing),
    tradeCount: finiteNumber(counts.trades, counts.totalTrades, raw.totalTrades, raw.trades, raw.tradeCount),
    tokensTraded: finiteNumber(counts.tokensTraded, counts.tokens, raw.tokensTraded, stats.total),
    buys: finiteNumber(counts.buys, raw.buys, stats.buys),
    sells: finiteNumber(counts.sells, raw.sells, stats.sells),
    investedUsd: finiteNumber(summary.invested, raw.invested, stats.invested),
    proceedsUsd: finiteNumber(summary.proceeds, raw.proceeds, stats.proceeds),
    openCostUsd: finiteNumber(open.cost, open.costUsd, summary.openCostUsd),
    openValueUsd: finiteNumber(open.value, open.valueUsd, summary.openValueUsd),
  };
}

export function normalizeSolWalletPositions(raw) {
  const rows = Array.isArray(raw) ? raw
    : (Array.isArray(raw?.positions) ? raw.positions
      : (Array.isArray(raw?.data) ? raw.data : (Array.isArray(raw?.items) ? raw.items : [])));
  return rows.map((row) => {
    const meta = objectAt(row, "meta");
    const pnl = objectAt(row, "pnl");
    const current = Object.keys(objectAt(row, "current")).length ? objectAt(row, "current") : objectAt(row, "position");
    const addr = String(row?.token || row?.mint || meta.mint || meta.address || "");
    const valueUsd = finiteNumber(current.value, current.valueUsd, row?.valueUsd);
    const costUsd = finiteNumber(current.costBasis, current.costBasisUsd, row?.costBasisUsd);
    const realizedUsd = finiteNumber(pnl.realized, pnl.realizedUsd, row?.realizedUsd);
    const unrealizedUsd = finiteNumber(pnl.unrealized, pnl.unrealizedUsd, row?.unrealizedUsd);
    const totalPnlUsd = finiteNumber(pnl.total, pnl.totalUsd, row?.pnlUsd);
    return {
      addr,
      sym: String(meta.symbol || row?.symbol || "").replace(/^\$+/, "").slice(0, 14),
      name: String(meta.name || row?.name || "").slice(0, 30),
      qty: finiteNumber(current.balance, current.quantity, row?.balance, row?.qty),
      valueUsd,
      costUsd,
      realizedUsd,
      unrealizedUsd,
      pnlUsd: unrealizedUsd != null ? unrealizedUsd : totalPnlUsd,
      totalPnlUsd,
      roiPct: finiteNumber(row?.roi, pnl.roi, row?.roiPct),
      priceUsd: finiteNumber(current.price, meta.price, row?.priceUsd),
    };
  }).filter((row) => row.addr || row.sym);
}

export { finiteNumber as finiteWalletNumber };
