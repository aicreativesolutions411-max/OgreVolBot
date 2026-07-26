const DEFAULT_LAUNCH_HISTORY_LIMIT = 100;
const DEFAULT_OBLIGATION_HISTORY_LIMIT = 500;

export const DEFAULT_PUMP_FEE_SHARING_SETUP_RESERVE_LAMPORTS = 1_000_000n;
export const DEFAULT_PUMP_FEE_SHARING_SETUP_MAX_TARGET_LAMPORTS = 20_000_000n;

const UNRESOLVED_CREATOR_REWARD_STATUSES = new Set([
  "SUBMITTING",
  "RECONCILING",
  "PARTIAL_OR_FAILED",
  "MANUAL_ATTRIBUTION_REQUIRED"
]);

function positiveAtomic(value) {
  try {
    return BigInt(String(value ?? "0").replace(/[^\d]/g, "") || "0") > 0n;
  } catch {
    return false;
  }
}

function nonnegativeAtomic(value, label) {
  let amount;
  try {
    if (typeof value === "number" && (!Number.isSafeInteger(value) || value < 0)) {
      throw new TypeError();
    }
    if (typeof value === "string" && !/^\d+$/.test(value.trim())) {
      throw new TypeError();
    }
    amount = BigInt(value);
  } catch {
    throw new TypeError(`${label} must be a non-negative integer number of lamports`);
  }
  if (amount < 0n) {
    throw new TypeError(`${label} must be a non-negative integer number of lamports`);
  }
  return amount;
}

/**
 * Return the balance a setup payer must have before an official Pump
 * fee-sharing config transaction is submitted. The hard cap prevents a bad
 * rent response (or a corrupted caller value) from draining a sibling wallet.
 */
export function pumpFeeSharingSetupFundingTarget(rentLamports, options = {}) {
  const rent = nonnegativeAtomic(rentLamports, "rentLamports");
  const reserve = nonnegativeAtomic(
    options.feeReserveLamports ?? DEFAULT_PUMP_FEE_SHARING_SETUP_RESERVE_LAMPORTS,
    "feeReserveLamports"
  );
  const maximum = nonnegativeAtomic(
    options.maxTargetLamports ?? DEFAULT_PUMP_FEE_SHARING_SETUP_MAX_TARGET_LAMPORTS,
    "maxTargetLamports"
  );
  const target = rent + reserve;
  if (target > maximum) {
    const error = new RangeError("Pump fee-sharing setup funding target exceeds the safety cap");
    error.code = "PUMP_FEE_SHARING_SETUP_FUNDING_LIMIT";
    error.targetLamports = target.toString();
    error.maxTargetLamports = maximum.toString();
    throw error;
  }
  return target;
}

function positiveReconciledAtomic(value) {
  if (value == null || value === "") return false;
  try {
    return nonnegativeAtomic(value, "observedClaimLamports") > 0n;
  } catch {
    return false;
  }
}

/**
 * Classify an already-signed claim without guessing whether an ambiguous RPC
 * broadcast succeeded. A signature remains pending through its last valid
 * block height and expires only after that height has passed.
 */
export function classifySignedPumpClaimReconciliation(input = {}) {
  const signatureStatus = input.signatureStatus && typeof input.signatureStatus === "object"
    ? input.signatureStatus
    : null;

  if (positiveReconciledAtomic(input.observedClaimLamports)) {
    return { state: "CONFIRMED", terminal: true, reason: "claim_balance_observed" };
  }

  if (signatureStatus?.err != null) {
    return { state: "FAILED", terminal: true, reason: "signature_failed" };
  }

  const confirmation = String(signatureStatus?.confirmationStatus || "").toLowerCase();
  const signatureConfirmed = signatureStatus != null
    && signatureStatus.err == null
    && (
      confirmation === "confirmed"
      || confirmation === "finalized"
      || signatureStatus.confirmations === null
    );
  if (signatureConfirmed) {
    return { state: "CONFIRMED", terminal: true, reason: "signature_confirmed" };
  }

  const hasExpiry = input.lastValidBlockHeight != null && input.lastValidBlockHeight !== "";
  const hasCurrentHeight = input.currentBlockHeight != null && input.currentBlockHeight !== "";
  // A signature already observed as processed may still advance to confirmed;
  // blockhash expiry is only proof for a transaction the chain never saw.
  if (signatureStatus == null && hasExpiry && hasCurrentHeight) {
    const expiry = nonnegativeAtomic(input.lastValidBlockHeight, "lastValidBlockHeight");
    const current = nonnegativeAtomic(input.currentBlockHeight, "currentBlockHeight");
    if (current > expiry) {
      return { state: "EXPIRED", terminal: true, reason: "blockhash_expired_unconfirmed" };
    }
  }

  return {
    state: "PENDING",
    terminal: false,
    reason: signatureStatus ? "signature_processing" : "signature_not_observed"
  };
}

export function isOfficialPumpHolderFeeSharingAttempt(attempt = {}, minimumVersion = 2) {
  const intent = attempt.pumpFeeSharingIntent || {};
  const state = attempt.pumpFeeSharing || {};
  return Boolean(
    (intent.official === true && Number(intent.version || 0) >= minimumVersion)
    || (state.official === true && Number(state.version || 0) >= minimumVersion)
    || Number(state.version || 0) >= minimumVersion
    || String(attempt.holderRewardsFeeSharingStatus || "").trim()
    || String(attempt.holderRewardsFeeSharingConfig || "").trim()
  );
}

export function pumpLaunchAttemptRequiresDurableRetention(attempt = {}) {
  // An immutable Pump split can continue directing fees to this vault forever,
  // so the worker mapping must outlive the ordinary launch-history window.
  if (isOfficialPumpHolderFeeSharingAttempt(attempt)) return true;
  const rail = String(attempt.rail || "pump").toLowerCase();
  const policy = attempt.holderRewards || attempt.launchHolderRewards || attempt.rhHolderRewards || {};
  const enabled = policy.enabled === true
    || ["1", "true", "yes", "on"].includes(String(policy.enabled ?? attempt.holderRewardsEnabled ?? "").toLowerCase());
  // A legacy Pump launch with no pending balance today can accrue wallet-wide
  // creator fees tomorrow. Retain its policy/mint mapping so those obligations
  // remain visible and explicitly migratable instead of aging out silently.
  if (rail === "pump" && enabled) return true;
  // Legacy holder accounting is not safe to migrate implicitly. Keep any
  // already-earmarked amount until an explicit, auditable migration pays it.
  return positiveAtomic(attempt.holderRewardsPendingLamports);
}

export function creatorRewardObligationRequiresDurableRetention(obligation = {}) {
  return UNRESOLVED_CREATOR_REWARD_STATUSES.has(String(obligation.status || "").toUpperCase());
}

export function retainDurableTail(rows, limit, requiresRetention) {
  const source = Array.isArray(rows) ? rows : [];
  const normalizedLimit = Math.max(0, Math.floor(Number(limit) || 0));
  const tailStart = Math.max(0, source.length - normalizedLimit);
  return source.filter((row, index) => index >= tailStart || requiresRetention(row));
}

export function compactPumpRewardStore(store = {}, options = {}) {
  const launchHistoryLimit = options.launchHistoryLimit ?? DEFAULT_LAUNCH_HISTORY_LIMIT;
  const obligationHistoryLimit = options.obligationHistoryLimit ?? DEFAULT_OBLIGATION_HISTORY_LIMIT;
  return {
    ...store,
    attempts: retainDurableTail(
      store.attempts,
      launchHistoryLimit,
      pumpLaunchAttemptRequiresDurableRetention
    ),
    creatorRewardObligations: retainDurableTail(
      store.creatorRewardObligations,
      obligationHistoryLimit,
      creatorRewardObligationRequiresDurableRetention
    )
  };
}
