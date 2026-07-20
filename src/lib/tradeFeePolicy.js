function readBasisPoints(value, label) {
  const bps = Number(value);
  if (!Number.isInteger(bps) || bps < 0 || bps > 10_000) {
    throw new Error(`${label} must be an integer from 0 to 10000.`);
  }
  return bps;
}

function readAmount(value, label) {
  const raw = typeof value === "bigint" ? value.toString() : String(value ?? "").trim();
  if (!/^\d+$/.test(raw)) throw new Error(`${label} must be an unsigned integer amount.`);
  return BigInt(raw);
}

/** Calculate a fixed fee in any integer denomination (lamports, wei, or token base units). */
export function calculateTradeFeeAmount(grossAmount, totalFeeBps) {
  const gross = readAmount(grossAmount, "grossAmount");
  const totalBps = readBasisPoints(totalFeeBps, "totalFeeBps");
  return (gross * BigInt(totalBps)) / 10_000n;
}

/**
 * Split an already-calculated fixed fee without changing its total.
 * The allocation can be a referrer or a token partner; all rounding remainder
 * stays with the platform so the two legs always add back to the exact fee.
 */
export function splitTradeFeeAllocation(totalFeeAmount, {
  totalFeeBps,
  allocationBps = 0,
  allocationEnabled = false
} = {}) {
  const total = readAmount(totalFeeAmount, "totalFeeAmount");
  const totalBps = readBasisPoints(totalFeeBps, "totalFeeBps");
  const shareBps = readBasisPoints(allocationBps, "allocationBps");
  if (shareBps > totalBps) throw new Error("allocationBps cannot exceed totalFeeBps.");
  const allocatedAmount = allocationEnabled && totalBps > 0
    ? (total * BigInt(shareBps)) / BigInt(totalBps)
    : 0n;
  return {
    totalAmount: total,
    ownerAmount: total - allocatedAmount,
    allocatedAmount
  };
}
