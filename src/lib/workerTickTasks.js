export function workerTickTaskFlags(body = {}, config = {}) {
  const requestedRole = String(config.taskSet || body.taskSet || "trade").trim().toLowerCase();
  const taskSet = ["data", "wallets", "cache", "feeds"].includes(requestedRole) ? "data" : "trade";
  const tradePlansEnabled = config.workerTickRunTradePlans !== false;
  const tradeRole = taskSet === "trade";

  return {
    portfolioExits: tradePlansEnabled
      && tradeRole
      && body.runPortfolioExits !== false
      && body.portfolioExits !== false,
    webExitGuards: tradePlansEnabled
      && tradeRole
      && body.runTradePlans !== false
      && body.runWebExitGuards !== false
      && body.webExitGuards !== false,
    tradePlans: tradePlansEnabled
      && tradeRole
      && body.runTradePlans !== false
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
