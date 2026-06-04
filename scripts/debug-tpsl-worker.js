import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  evaluatePercentMoveCandidates,
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

function activeStatus(value) {
  return normalizeTradeStatus(value) === TRADE_STATUS.OPEN;
}

function stopLossTriggerPct(stopLossPct) {
  const stop = numberOrNull(stopLossPct);
  if (!Number.isFinite(stop) || stop <= 0) return null;
  return Math.max(0.1, stop - Math.max(0, stopLossBufferPct));
}

function planTakeProfitPct(plan, wallet) {
  if (plan?.takeProfitMode === "wallets" && numberOrNull(wallet?.takeProfitPct)) return numberOrNull(wallet.takeProfitPct);
  return numberOrNull(plan?.takeProfitPct);
}

function planStopLossPct(plan, wallet) {
  if (plan?.stopLossMode === "wallets" && numberOrNull(wallet?.stopLossPct)) return numberOrNull(wallet.stopLossPct);
  return numberOrNull(plan?.stopLossPct);
}

function activePlanRows(planStore = {}) {
  const rows = [];
  for (const plan of planStore.plans || []) {
    for (const wallet of plan.wallets || []) {
      const status = wallet.exitStatus || wallet.status || plan.status;
      if (!activeStatus(status)) continue;
      const takeProfitPct = planTakeProfitPct(plan, wallet);
      const stopLossPct = planStopLossPct(plan, wallet);
      if (!Number.isFinite(takeProfitPct) && !Number.isFinite(stopLossPct)) continue;
      const evaluation = evaluatePercentMoveCandidates({
        tradeId: [plan.id || "plan", wallet.publicKey || "wallet", wallet.buySignature || wallet.walletIndex || "active"].join(":"),
        userId: plan.userId,
        source: plan.source || "trade_plan",
        symbol: plan.tokenMint,
        side: "LONG",
        status,
        moves: [
          { source: wallet.lastEstimateSource || "quote", movePct: numberOrNull(wallet.lastTriggerMovePct ?? wallet.lastMovePct) },
          { source: wallet.lastMarketPriceSource || "market", movePct: numberOrNull(wallet.lastMarketMovePct) }
        ],
        takeProfitPct,
        stopLossPct,
        stopLossBufferPct,
        monitoringEnabled: true
      });
      rows.push(evaluation);
    }
  }
  return rows;
}

function activeGuardRows(guardStore = {}) {
  const rows = [];
  for (const guard of guardStore.guards || []) {
    const status = guard.exitStatus || guard.status;
    if (!activeStatus(status)) continue;
    const takeProfitPct = numberOrNull(guard.takeProfitPct);
    const stopLossPct = numberOrNull(guard.stopLossPct);
    if (!Number.isFinite(takeProfitPct) && !Number.isFinite(stopLossPct)) continue;
    rows.push(evaluatePercentMoveCandidates({
      tradeId: guard.key || guard.id,
      userId: guard.userId,
      source: guard.planSource || guard.source || "web_exit_guard",
      symbol: guard.tokenMint,
      side: "LONG",
      status,
      moves: [
        { source: guard.lastEstimateSource || "quote", movePct: numberOrNull(guard.lastTriggerMovePct ?? guard.lastMovePct) },
        { source: guard.lastMarketPriceSource || "market", movePct: numberOrNull(guard.lastMarketMovePct) }
      ],
      takeProfitPct,
      stopLossPct,
      stopLossBufferPct,
      monitoringEnabled: true
    }));
  }
  return rows;
}

function permissionState(permission = {}) {
  const enabled = Boolean(permission.enabled);
  const revoked = Boolean(permission.revokedAt);
  const expiresAt = Date.parse(permission.expiresAt || "");
  const expired = enabled && Number.isFinite(expiresAt) && expiresAt <= Date.now();
  if (enabled && !revoked && !expired) return "approved";
  if (revoked) return "revoked";
  if (expired) return "expired";
  return "not_approved";
}

function approvalCounts(authStore = {}) {
  const profiles = Object.values(authStore.profiles || {});
  const counts = { approved: 0, invalidOrRevoked: 0, notApproved: 0 };
  for (const profile of profiles) {
    const status = permissionState(profile.automationPermission || {});
    if (status === "approved") counts.approved += 1;
    else if (status === "revoked" || status === "expired") counts.invalidOrRevoked += 1;
    else counts.notApproved += 1;
  }
  return counts;
}

function heartbeatRunning(lastHeartbeatAt) {
  const at = Date.parse(lastHeartbeatAt || "");
  return Number.isFinite(at) && Date.now() - at < 90_000;
}

const [workerState, planStore, guardStore, authStore] = await Promise.all([
  readJsonIfExists("tpsl-worker-state.json", {}),
  readJsonIfExists("trade-plans.json", { plans: [] }),
  readJsonIfExists("web-exit-guards.json", { guards: [] }),
  readJsonIfExists("web-auth.json", { profiles: {} })
]);

const openRows = [
  ...activePlanRows(planStore),
  ...activeGuardRows(guardStore)
];
const approvals = approvalCounts(authStore);

console.log("TP/SL WORKER DEBUG");
console.log(`dataDir=${dataDir}`);
console.log(`workerRunning=${heartbeatRunning(workerState.lastHeartbeatAt)}`);
console.log(`lastHeartbeat=${workerState.lastHeartbeatAt || ""}`);
console.log(`lastHeartbeatReason=${workerState.lastHeartbeatReason || ""}`);
console.log(`openTpSlTradesCount=${openRows.length}`);
console.log(`approvedWalletsCount=${approvals.approved}`);
console.log(`invalidOrRevokedApprovalsCount=${approvals.invalidOrRevoked}`);
console.log(`notApprovedProfilesCount=${approvals.notApproved}`);
console.log(`startupReconcileRanAt=${workerState.startupReconcileRanAt || ""}`);
console.log(`lastReconcile=${JSON.stringify(workerState.lastReconcile || null)}`);
console.log("CURRENT OPEN TP/SL TRADE EVALUATIONS");
for (const row of openRows.slice(-20)) {
  const stop = stopLossTriggerPct(row.stopLoss);
  console.log([
    `tradeId=${row.tradeId || ""}`,
    `source=${row.source || ""}`,
    `userId=${row.userId || ""}`,
    `symbol=${row.symbol || ""}`,
    `status=${row.status || ""}`,
    `current=${row.currentPrice ?? "n/a"}`,
    `stopLoss=${Number.isFinite(stop) ? -stop : row.stopLoss ?? "n/a"}`,
    `takeProfit=${row.takeProfit ?? "n/a"}`,
    `trigger=${row.trigger || "NONE"}`,
    `wouldClose=${Boolean(row.wouldClose)}`,
    `reason=${row.reason || ""}`
  ].join(" "));
}
console.log("LAST 20 EVALUATED TRADES");
for (const row of workerState.lastEvaluatedTrades || []) {
  console.log(JSON.stringify(row));
}
console.log("LAST 20 CLOSE ATTEMPTS");
for (const row of workerState.lastCloseAttempts || []) {
  console.log(JSON.stringify(row));
}
