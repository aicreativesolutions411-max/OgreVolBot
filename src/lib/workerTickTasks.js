export function workerTickTaskFlags(body = {}, config = {}) {
  const taskSet = String(config.taskSet || body.taskSet || "all").trim().toLowerCase() === "wallets" ? "wallets" : "all";
  const tradePlansEnabled = config.workerTickRunTradePlans !== false;
  const runTradePlansRequested = body.runTradePlans !== false && taskSet === "all";
  const enabled = tradePlansEnabled && runTradePlansRequested;

  return {
    portfolioExits: enabled
      && body.runPortfolioExits !== false
      && body.portfolioExits !== false,
    webExitGuards: enabled
      && body.runWebExitGuards !== false
      && body.webExitGuards !== false,
    tradePlans: enabled
      && body.runTimedTradePlans !== false
      && body.tradePlans !== false
  };
}

export function duePeriodicTask(nowMs, lastRanAtMs, intervalMs) {
  const now = Number(nowMs);
  const last = Number(lastRanAtMs || 0);
  const interval = Number(intervalMs);
  if (!Number.isFinite(now)) return false;
  if (!Number.isFinite(interval) || interval <= 0) return true;
  if (!Number.isFinite(last) || last <= 0) return true;
  return now - last >= interval;
}
