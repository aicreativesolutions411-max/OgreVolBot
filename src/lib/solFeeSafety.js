import { PublicKey } from "@solana/web3.js";

const MAX_SAFE_LAMPORTS = BigInt(Number.MAX_SAFE_INTEGER);

function readLamports(value, label) {
  const raw = typeof value === "bigint" ? value.toString() : String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) throw new Error(`${label} must be an unsigned lamport amount.`);
  const amount = BigInt(raw);
  if (amount > MAX_SAFE_LAMPORTS) throw new Error(`${label} exceeds the safe Solana transfer range.`);
  return amount;
}

function readWallet(value, label, required = false) {
  const wallet = String(value || "").trim();
  if (!wallet) {
    if (required) throw new Error(`${label} is required.`);
    return "";
  }
  try {
    return new PublicKey(wallet).toBase58();
  } catch {
    throw new Error(`${label} is not a valid Solana wallet.`);
  }
}

function shortText(value, max = 160) {
  return String(value || "").trim().slice(0, max);
}

/**
 * Validate and canonicalize an allocation that will survive submit/restart.
 * No live profile, referral, or partner lookup belongs in this function.
 */
export function validateFrozenSolFeeAllocation({ feeLamports, allocation, expectedOwnerWallet = "" } = {}) {
  if (!allocation || typeof allocation !== "object" || Number(allocation.version) !== 1) {
    throw new Error("The frozen fee allocation is missing or has an unsupported version.");
  }

  const total = readLamports(feeLamports, "feeLamports");
  const persistedTotal = readLamports(allocation.totalLamports, "allocation.totalLamports");
  if (persistedTotal !== total) throw new Error("The frozen fee allocation total does not match the trade fee.");

  const ownerLamports = readLamports(allocation.owner?.lamports, "allocation.owner.lamports");
  const ownerWallet = readWallet(allocation.owner?.wallet, "allocation.owner.wallet", ownerLamports > 0n);
  if (expectedOwnerWallet) {
    const expected = readWallet(expectedOwnerWallet, "expectedOwnerWallet", true);
    if (ownerWallet !== expected) throw new Error("The frozen platform fee wallet does not match the build-time fee wallet.");
  }

  const cashCowLamports = readLamports(allocation.cashCow?.lamports ?? 0, "allocation.cashCow.lamports");
  const cashCowWallet = readWallet(allocation.cashCow?.wallet, "allocation.cashCow.wallet", cashCowLamports > 0n);

  const referralLamports = readLamports(allocation.referral?.lamports ?? 0, "allocation.referral.lamports");
  const rawSplits = Array.isArray(allocation.referral?.splits) ? allocation.referral.splits : [];
  if (rawSplits.length > 4) throw new Error("The frozen referral allocation has too many payout wallets.");
  const referralSplits = rawSplits.map((part, index) => ({
    wallet: readWallet(part?.wallet, `allocation.referral.splits[${index}].wallet`, true),
    lamports: readLamports(part?.lamports, `allocation.referral.splits[${index}].lamports`)
  })).filter((part) => part.lamports > 0n);
  const splitTotal = referralSplits.reduce((sum, part) => sum + part.lamports, 0n);
  if (splitTotal !== referralLamports) throw new Error("The frozen referral splits do not equal the referral fee leg.");
  if (referralLamports > 0n && !referralSplits.length) throw new Error("The frozen referral fee has no payout wallet.");

  if (ownerLamports + cashCowLamports + referralLamports !== total) {
    throw new Error("The frozen fee legs do not add up to the trade fee.");
  }

  return {
    version: 1,
    totalLamports: total.toString(),
    owner: {
      wallet: ownerWallet,
      lamports: ownerLamports.toString()
    },
    cashCow: {
      wallet: cashCowWallet,
      lamports: cashCowLamports.toString(),
      partnerProgramId: shortText(allocation.cashCow?.partnerProgramId)
    },
    referral: {
      lamports: referralLamports.toString(),
      referrerUserId: shortText(allocation.referral?.referrerUserId),
      splits: referralSplits.map((part) => ({
        wallet: part.wallet,
        lamports: part.lamports.toString()
      }))
    }
  };
}

/** Build the exact immutable allocation from one build-time target lookup. */
export function buildFrozenSolFeeAllocation({ feeLamports, ownerWallet, targets = {} } = {}) {
  const allocation = {
    version: 1,
    totalLamports: String(feeLamports),
    owner: {
      wallet: ownerWallet,
      lamports: String(targets.ownerLamports ?? feeLamports)
    },
    cashCow: {
      wallet: String(targets.cashCowWallet || ""),
      lamports: String(targets.cashCowLamports ?? 0),
      partnerProgramId: String(targets.partnerProgramId || "")
    },
    referral: {
      lamports: String(targets.referralLamports ?? 0),
      referrerUserId: String(targets.referrerUserId || ""),
      splits: (Array.isArray(targets.referralSplits) ? targets.referralSplits : []).map((part) => ({
        wallet: String(part?.wallet || ""),
        lamports: String(part?.lamports ?? 0)
      }))
    }
  };
  return validateFrozenSolFeeAllocation({ feeLamports, allocation, expectedOwnerWallet: ownerWallet });
}

/** Convert only a validated persisted allocation into collectSolFee's BigInt targets. */
export function feeTargetsFromFrozenAllocation({ feeLamports, allocation } = {}) {
  const frozen = validateFrozenSolFeeAllocation({ feeLamports, allocation });
  const referralSplits = frozen.referral.splits.map((part) => ({
    wallet: part.wallet,
    lamports: BigInt(part.lamports)
  }));
  return {
    frozen,
    ownerWallet: frozen.owner.wallet,
    ownerLamports: BigInt(frozen.owner.lamports),
    cashCowWallet: frozen.cashCow.wallet,
    cashCowLamports: BigInt(frozen.cashCow.lamports),
    partnerProgramId: frozen.cashCow.partnerProgramId,
    referralLamports: BigInt(frozen.referral.lamports),
    referralWallet: referralSplits[0]?.wallet || "",
    referralSplits,
    referrerUserId: frozen.referral.referrerUserId
  };
}

/** Confirmation exceptions are never proof that a broadcast transaction failed. */
export function classifyFeeConfirmation({ confirmation, error } = {}) {
  if (confirmation?.value?.err != null) {
    return { status: "failed_on_chain", error: confirmation.value.err };
  }
  if (error) return { status: "outcome_unknown", error };
  return { status: "confirmed", error: null };
}
