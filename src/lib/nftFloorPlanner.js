// Read-only discovery and deterministic budgeting. This module deliberately has
// no key, signing or broadcast dependency. Listings are NOT ownership proofs.
import { PublicKey } from '@solana/web3.js';
const raw = (value) => { if (!/^\d+$/.test(String(value ?? ''))) throw new Error('Invalid lamport amount.'); return BigInt(value); };
export function solToExactLamports(value) {
  const text = String(value);
  if (!/^\d+(?:\.\d{1,9})?$/.test(text)) throw new Error('Invalid SOL amount.');
  const [whole, fraction = ''] = text.split('.');
  return BigInt(whole) * 1000000000n + BigInt(fraction.padEnd(9, '0'));
}
export function planNftFloorPurchase({ listings = [], collectionAddress, balanceLamports, reserveLamports, maxPriceLamports, dailyBudgetLamports, spentTodayLamports, estimatedCostLamports, now = Date.now(), excludedSellers = [], reservedMints = [] }) {
  const balance = raw(balanceLamports), reserve = raw(reserveLamports), maxPrice = raw(maxPriceLamports), remainingDay = raw(dailyBudgetLamports) - raw(spentTodayLamports), costs = raw(estimatedCostLamports);
  const budget = balance - reserve < remainingDay ? balance - reserve : remainingDay;
  const candidates = listings.filter((row) => {
    if (!row.collectionVerified || row.collectionAddress !== collectionAddress || !collectionAddress) return false;
    if (!Number.isFinite(row.observedAt) || now - row.observedAt < 0 || now - row.observedAt > 15000) return false;
    if (excludedSellers.includes(row.seller) || reservedMints.includes(row.mint)) return false;
    try { new PublicKey(row.mint); new PublicKey(row.seller); const price = raw(row.priceLamports); return price > 0n && price <= maxPrice && price + costs <= budget; } catch { return false; }
  }).sort((a, b) => raw(a.priceLamports) < raw(b.priceLamports) ? -1 : raw(a.priceLamports) > raw(b.priceLamports) ? 1 : a.mint.localeCompare(b.mint));
  return { candidate: candidates[0] || null, budgetLamports: String(budget > 0n ? budget : 0n), reason: candidates.length ? 'verified_candidate' : 'no_verified_affordable_listing' };
}
export function createNftMarketReader({ fetchFn = fetch, now = Date.now, apiKey = '' } = {}) {
  const cache = new Map(), inFlight = new Map();
  return { async listings(symbol) {
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(String(symbol || ''))) throw new Error('Invalid collection symbol.');
    const hit = cache.get(symbol);
    if (hit && now() - hit.at < 15000) return hit.rows;
    if (inFlight.has(symbol)) return inFlight.get(symbol);
    const request = (async () => {
      const response = await fetchFn(`https://api-mainnet.magiceden.dev/v2/collections/${encodeURIComponent(symbol)}/listings?offset=0&limit=20&sort=listPrice&sort_direction=asc`, {
        headers: { accept: 'application/json', ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) }, signal: AbortSignal.timeout(6000)
      });
      if (!response.ok) throw new Error(`NFT listings are temporarily unavailable (${response.status}). No fees or funds moved.`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Marketplace returned an invalid listings response.');
      const at = now();
      const rows = data.slice(0, 20).flatMap((row) => {
        try { const mint = new PublicKey(row.tokenMint).toBase58(); const priceLamports = solToExactLamports(row.price); if (priceLamports <= 0n) return []; return [{ mint, seller: new PublicKey(row.seller).toBase58(), priceSol: String(row.price), priceLamports: String(priceLamports), collectionSymbol: symbol, collectionVerified: false, observedAt: at, url: `https://magiceden.io/item-details/${mint}` }]; } catch { return []; }
      });
      if (cache.size >= 100) cache.delete(cache.keys().next().value);
      cache.set(symbol, { rows, at }); return rows;
    })().finally(() => inFlight.delete(symbol));
    inFlight.set(symbol, request); return request;
  } };
}
