import assert from "node:assert/strict";
import test from "node:test";
import {
  classifySignedPumpClaimReconciliation,
  compactPumpRewardStore,
  isOfficialPumpHolderFeeSharingAttempt,
  pumpFeeSharingSetupFundingTarget
} from "../src/lib/pumpRewardDurability.js";

test("fee-sharing setup funding target includes rent plus a bounded fee reserve", () => {
  assert.equal(
    pumpFeeSharingSetupFundingTarget(2_500_000n, {
      feeReserveLamports: 750_000n,
      maxTargetLamports: 5_000_000n
    }),
    3_250_000n
  );
});

test("fee-sharing setup funding refuses a target above the drain safety cap", () => {
  assert.throws(
    () => pumpFeeSharingSetupFundingTarget(4_500_000n, {
      feeReserveLamports: 750_000n,
      maxTargetLamports: 5_000_000n
    }),
    (error) => error?.code === "PUMP_FEE_SHARING_SETUP_FUNDING_LIMIT"
      && error?.targetLamports === "5250000"
      && error?.maxTargetLamports === "5000000"
  );
});

test("fee-sharing setup funding rejects fractional or negative lamport inputs", () => {
  assert.throws(
    () => pumpFeeSharingSetupFundingTarget(1.5),
    /non-negative integer number of lamports/
  );
  assert.throws(
    () => pumpFeeSharingSetupFundingTarget(1n, { feeReserveLamports: -1n }),
    /non-negative integer number of lamports/
  );
});

test("signed claim reconciliation accepts confirmed signatures and observed balance deltas", () => {
  assert.deepEqual(classifySignedPumpClaimReconciliation({
    signatureStatus: { err: null, confirmationStatus: "finalized", confirmations: null },
    currentBlockHeight: 200,
    lastValidBlockHeight: 150
  }), {
    state: "CONFIRMED",
    terminal: true,
    reason: "signature_confirmed"
  });
  assert.deepEqual(classifySignedPumpClaimReconciliation({
    signatureStatus: null,
    observedClaimLamports: "42",
    currentBlockHeight: 200,
    lastValidBlockHeight: 150
  }), {
    state: "CONFIRMED",
    terminal: true,
    reason: "claim_balance_observed"
  });
});

test("signed claim reconciliation waits through validity and expires only after it", () => {
  assert.equal(classifySignedPumpClaimReconciliation({
    signatureStatus: null,
    currentBlockHeight: 150,
    lastValidBlockHeight: 150
  }).state, "PENDING");
  assert.deepEqual(classifySignedPumpClaimReconciliation({
    signatureStatus: null,
    currentBlockHeight: 151,
    lastValidBlockHeight: 150
  }), {
    state: "EXPIRED",
    terminal: true,
    reason: "blockhash_expired_unconfirmed"
  });
  assert.deepEqual(classifySignedPumpClaimReconciliation({
    signatureStatus: { err: null, confirmationStatus: "processed", confirmations: 0 },
    currentBlockHeight: 151,
    lastValidBlockHeight: 150
  }), {
    state: "PENDING",
    terminal: false,
    reason: "signature_processing"
  });
});

test("signed claim reconciliation treats an on-chain error as terminal failure", () => {
  assert.deepEqual(classifySignedPumpClaimReconciliation({
    signatureStatus: { err: { InstructionError: [0, "Custom"] }, confirmationStatus: "confirmed" },
    currentBlockHeight: 100,
    lastValidBlockHeight: 150
  }), {
    state: "FAILED",
    terminal: true,
    reason: "signature_failed"
  });
});

test("official holder-fee attempts survive beyond the ordinary launch history tail", () => {
  const attempts = [
    {
      id: "official-old",
      pumpFeeSharing: { official: true, version: 2, status: "ACTIVE" }
    },
    ...Array.from({ length: 105 }, (_, index) => ({ id: `terminal-${index}`, status: "COMPLETE" }))
  ];
  const compacted = compactPumpRewardStore({ attempts, creatorRewardObligations: [] });

  assert.equal(compacted.attempts.length, 101);
  assert.equal(compacted.attempts[0].id, "official-old");
  assert.equal(compacted.attempts[1].id, "terminal-5");
});

test("legacy pending holder balances are retained but are not marked official", () => {
  const legacy = {
    id: "legacy-pending",
    holderRewards: { enabled: true, shareBps: 5_000 },
    holderRewardsPendingLamports: "2500000"
  };
  const attempts = [
    legacy,
    ...Array.from({ length: 101 }, (_, index) => ({ id: `ordinary-${index}` }))
  ];
  const compacted = compactPumpRewardStore({ attempts, creatorRewardObligations: [] });

  assert.equal(isOfficialPumpHolderFeeSharingAttempt(legacy), false);
  assert.ok(compacted.attempts.some((row) => row.id === legacy.id));
});

test("legacy Pump holder policies remain durable before any pending balance accrues", () => {
  const legacy = Array.from({ length: 125 }, (_, index) => ({
    id: `legacy-zero-pending-${index}`,
    rail: "pump",
    holderRewards: { enabled: true, shareBps: 5_000 },
    holderRewardsPendingLamports: "0"
  }));
  const attempts = [
    ...legacy,
    ...Array.from({ length: 100 }, (_, index) => ({ id: `ordinary-${index}` }))
  ];
  const compacted = compactPumpRewardStore({ attempts, creatorRewardObligations: [] });

  assert.ok(legacy.every((row) => !isOfficialPumpHolderFeeSharingAttempt(row)));
  assert.equal(compacted.attempts.length, 225);
  assert.deepEqual(compacted.attempts.slice(0, 125).map((row) => row.id), legacy.map((row) => row.id));
});

test("explicit pre-launch official intent is recognized without migrating legacy rows", () => {
  assert.equal(isOfficialPumpHolderFeeSharingAttempt({
    pumpFeeSharingIntent: { official: true, version: 2 }
  }), true);
  assert.equal(isOfficialPumpHolderFeeSharingAttempt({
    holderRewards: { enabled: true },
    holderRewardsPendingLamports: "1"
  }), false);
});

test("unresolved creator-reward obligations survive beyond the receipt history tail", () => {
  const creatorRewardObligations = [
    { id: "reconciling-old", status: "RECONCILING" },
    { id: "manual-old", status: "MANUAL_ATTRIBUTION_REQUIRED" },
    ...Array.from({ length: 505 }, (_, index) => ({ id: `terminal-${index}`, status: "NO_CONFIRMED_CLAIM" }))
  ];
  const compacted = compactPumpRewardStore({ attempts: [], creatorRewardObligations });

  assert.equal(compacted.creatorRewardObligations.length, 502);
  assert.deepEqual(
    compacted.creatorRewardObligations.slice(0, 2).map((row) => row.id),
    ["reconciling-old", "manual-old"]
  );
  assert.equal(compacted.creatorRewardObligations[2].id, "terminal-5");
});
