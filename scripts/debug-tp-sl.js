import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluateTpSlTrade,
  formatTpSlDebugRow,
  normalizeTradeStatus,
  TRADE_STATUS
} from "../src/lib/tradeExecutionService.js";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.resolve(process.env.DATA_DIR || path.join(rootDir, "data"));
const stopLossBufferPct = numberOrZero(process.env.STOP_LOSS_TRIGGER_BUFFER_PCT || "1.5");

async function readJsonIfExists(fileName, fallback) {
  try {
    const raw = await fs.readFile(path.join(dataDir, fileName), "utf8");
    return JSON.parse(raw);
  } catch (error) {
    if (error?.code === "ENOENT") return fallback;
    throw error;
  }
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(String(value).replace(/[%,$\s]/g, ""));
  return Number.isFinite(number) ? number : null;
}

function numberOrZero(value) {
  const number = numberOrNull(value);
  return Number.isFinite(number) ? number : 0;
}

function stopLossTriggerPct(stopLossPct) {
  const stop = numberOrNull(stopLossPct);
  if (!Number.isFinite(stop) || stop <= 0) return null;
  return Math.max(0.1, stop - Math.max(0, stopLossBufferPct));
}

function activeStatus(value) {
  return normalizeTradeStatus(value) === TRADE_STATUS.OPEN;
}

function planWalletTradeId(plan, wallet) {
  return [
    plan?.id || "plan",
    wallet?.publicKey || "wallet",
    wallet?.buySignature || wallet?.walletIndex || "active"
  ].join(":");
}

function planTakeProfitPct(plan, wallet) {
  if (plan?.takeProfitMode === "wallets" && numberOrNull(wallet?.takeProfitPct)) return numberOrNull(wallet.takeProfitPct);
  return numberOrNull(plan?.takeProfitPct);
}

function planStopLossPct(plan, wallet) {
  if (plan?.stopLossMode === "wallets" && numberOrNull(wallet?.stopLossPct)) return numberOrNull(wallet.stopLossPct);
  return numberOrNull(plan?.stopLossPct);
}

function planWalletCurrentMove(wallet) {
  return numberOrNull(wallet?.lastMovePct ?? wallet?.lastGrossMovePct ?? wallet?.lastNetMovePct);
}

function evaluatePercentPlanTrade({ id, userId, source, symbol, status, currentMovePct, stopLossPct, takeProfitPct }) {
  const stopTrigger = stopLossTriggerPct(stopLossPct);
  return evaluateTpSlTrade({
    id,
    userId,
    source,
    symbol,
    side: "LONG",
    entryPrice: 0,
    currentPrice: currentMovePct,
    stopLoss: Number.isFinite(stopTrigger) ? -stopTrigger : null,
    takeProfit: numberOrNull(takeProfitPct),
    status,
    monitoringEnabled: true
  });
}

function tradePlanRows(planStore) {
  const rows = [];
  for (const plan of planStore.plans || []) {
    if (!activeStatus(plan.status)) continue;
    for (const wallet of plan.wallets || []) {
      if (!activeStatus(wallet.status || wallet.exitStatus)) continue;
      const takeProfitPct = planTakeProfitPct(plan, wallet);
      const stopLossPct = planStopLossPct(plan, wallet);
      if (!Number.isFinite(takeProfitPct) && !Number.isFinite(stopLossPct)) continue;
      rows.push(evaluatePercentPlanTrade({
        id: planWalletTradeId(plan, wallet),
        userId: plan.userId,
        source: plan.source || "trade_plan",
        symbol: plan.tokenMint,
        status: wallet.exitStatus || wallet.status || plan.status,
        currentMovePct: planWalletCurrentMove(wallet),
        stopLossPct,
        takeProfitPct
      }));
    }
  }
  return rows;
}

function guardRows(guardStore) {
  const rows = [];
  for (const guard of guardStore.guards || []) {
    if (!activeStatus(guard.status || guard.exitStatus)) continue;
    const takeProfitPct = numberOrNull(guard.takeProfitPct);
    const stopLossPct = numberOrNull(guard.stopLossPct);
    if (!Number.isFinite(takeProfitPct) && !Number.isFinite(stopLossPct)) continue;
    rows.push(evaluatePercentPlanTrade({
      id: guard.key || guard.id,
      userId: guard.userId,
      source: guard.planSource || guard.source || "web_exit_guard",
      symbol: guard.tokenMint,
      status: guard.exitStatus || guard.status,
      currentMovePct: numberOrNull(guard.lastMovePct ?? guard.lastGrossMovePct ?? guard.lastNetMovePct),
      stopLossPct,
      takeProfitPct
    }));
  }
  return rows;
}

const [planStore, guardStore] = await Promise.all([
  readJsonIfExists("trade-plans.json", { plans: [] }),
  readJsonIfExists("web-exit-guards.json", { guards: [] })
]);

const rows = [
  ...tradePlanRows(planStore),
  ...guardRows(guardStore)
];

console.log("OPEN TRADES WITH TP/SL");
console.log(`dataDir=${dataDir}`);
console.log("note=entry/current/stopLoss/takeProfit are percent-move thresholds for Solana spot plans; entry=0 means breakeven.");

if (!rows.length) {
  console.log("No open TP/SL trades found.");
} else {
  for (const row of rows) {
    console.log(formatTpSlDebugRow(row));
  }
}
