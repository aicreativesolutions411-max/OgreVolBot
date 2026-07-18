export function computeRecoveredSolPositionCost(input = {}) {
  const transactions = Array.isArray(input.transactions) ? input.transactions : [];
  const currentQuantity = Number(input.currentQuantity || 0);
  let quantity = 0;
  let unknownQuantity = 0;
  let costLamports = 0;
  let buysRecovered = 0;

  for (const row of transactions) {
    const tokenDelta = Number(row?.tokenDelta);
    if (!Number.isFinite(tokenDelta) || Math.abs(tokenDelta) <= 1e-12) continue;
    const solDelta = Number(row?.solDeltaLamports || 0);
    const fee = Math.max(0, Number(row?.feeLamports || 0));
    if (tokenDelta > 0) {
      quantity += tokenDelta;
      const spent = solDelta < 0 ? -solDelta : 0;
      if (spent > fee + 5_000) {
        costLamports += spent;
        buysRecovered += 1;
      } else {
        unknownQuantity += tokenDelta;
      }
      continue;
    }

    const outgoing = Math.min(quantity, Math.abs(tokenDelta));
    if (quantity <= 0 || outgoing <= 0) continue;
    const keepRatio = Math.max(0, (quantity - outgoing) / quantity);
    costLamports *= keepRatio;
    unknownQuantity *= keepRatio;
    quantity -= outgoing;
  }

  const tolerance = Math.max(1e-8, currentQuantity * 0.005);
  const completeHistory = currentQuantity > 0 && Math.abs(quantity - currentQuantity) <= tolerance;
  const unknownShare = quantity > 0 ? unknownQuantity / quantity : 1;
  if (!completeHistory || buysRecovered <= 0 || costLamports <= 0 || unknownShare > 0.01) return null;
  return {
    costBasisLamports: BigInt(Math.max(1, Math.round(costLamports))),
    buysRecovered,
    source: "solana-rpc-history"
  };
}
