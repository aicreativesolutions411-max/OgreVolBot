export function rotatingUniqueWindow(items = [], cursor = 0, maxPerTick = 12) {
  const unique = [...new Set((Array.isArray(items) ? items : []).filter(Boolean))];
  if (!unique.length) return { items: [], nextCursor: 0 };
  const count = Math.min(unique.length, Math.max(1, Number.parseInt(maxPerTick, 10) || 12));
  const start = Math.max(0, Number.parseInt(cursor, 10) || 0) % unique.length;
  return {
    items: Array.from({ length: count }, (_, index) => unique[(start + index) % unique.length]),
    nextCursor: (start + count) % unique.length
  };
}

export function automationOrderIsActivelyMonitored(chain = "solana", status = "") {
  const normalized = String(status || "").trim().toLowerCase();
  return chain === "robinhood"
    ? ["active", "submitting", "retrying"].includes(normalized)
    : ["armed", "filling", "retrying"].includes(normalized);
}

export function staleAutomationClaim(startedAt, nowMs = Date.now(), staleMs = 90_000) {
  const timestamp = Date.parse(String(startedAt || ""));
  const now = Number(nowMs);
  const threshold = Math.max(1, Number(staleMs) || 90_000);
  return Number.isFinite(timestamp) && Number.isFinite(now) && now - timestamp >= threshold;
}

const UNRESOLVED_EXIT_STATUSES = new Set([
  "submitting",
  "outcome_unknown",
  "needs_attention"
]);

export function automationExitNeedsAttention(...statuses) {
  return statuses.flat(Infinity).some((status) => UNRESOLVED_EXIT_STATUSES.has(
    String(status || "").trim().toLowerCase()
  ));
}

export function automationExitReplacementBlocked(row = {}) {
  return automationExitNeedsAttention(row.status, row.exitStatus, row.triggerStatus)
    || Boolean(row.preSellCheckpointAt && !row.sellSignature);
}
