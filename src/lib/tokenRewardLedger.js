import { rewardAddress } from './tokenRewardAssets.js';
import { rewardWallet, tokenRewardPolicyHash, assertTokenRewardPolicy, TOKEN_REWARD_CADENCE_MS } from './tokenRewardPolicy.js';

export function rewardRaw(value) {
  if (typeof value !== 'string' || !/^(0|[1-9]\d{0,39})$/.test(value)) throw new Error('Invalid raw token amount.');
  return BigInt(value);
}
const sum = values => values.reduce((a, b) => a + rewardRaw(b), 0n);
export function createRewardLedger({ mint, policy }) {
  assertTokenRewardPolicy(policy);
  rewardAddress(mint); if (policy.partnerShareBps && policy.partnerMint === mint) throw new Error('The partner community must be a different coin.');
  return { version: 1, mint, policy, policyHash: tokenRewardPolicyHash(policy), collectedRaw: '0', unallocatedRaw: '0', paidRaw: '0', credits: {}, carry: { own: '0', partner: '0' }, collections: {}, receipts: [], paidBySource: {}, allocatedBySource: {}, lastCycleAt: 0, pending: null };
}
function checked(state) {
  assertTokenRewardPolicy(state.policy);
  if (state.version !== 1 || state.policyHash !== tokenRewardPolicyHash(state.policy)) throw new Error('Reward policy changed; reconcile before continuing.');
  const liabilities = rewardLiabilities(state);
  if (rewardRaw(state.collectedRaw) !== rewardRaw(state.paidRaw) + liabilities) throw new Error('Reward accounting does not reconcile. Payouts paused.');
}
export function rewardLiabilities(state) { return rewardRaw(state.unallocatedRaw) + sum(Object.values(state.carry)) + sum(Object.values(state.credits).flatMap(v => Object.values(v))); }
export function recordRewardCollection(state, receipt) {
  checked(state);
  if (!receipt.finalized || !receipt.signature || !Number.isSafeInteger(receipt.slot)) throw new Error('A finalized collection receipt is required.');
  if (receipt.mint !== state.policy.payoutMint) throw new Error('Collection mint does not match payout mint.');
  const amount = rewardRaw(receipt.amountRaw), old = state.collections[receipt.signature];
  if (amount <= 0n) throw new Error('Collection must contain positive realized tokens.');
  if (old) { if (old.amountRaw !== receipt.amountRaw || old.mint !== receipt.mint) throw new Error('Collection signature reused with a different amount.'); return state; }
  if (Object.keys(state.collections).length >= 10000) throw new Error('Receipt archive needs maintenance; do not discard deduplication history.');
  return { ...state, collections: { ...state.collections, [receipt.signature]: { ...receipt } }, collectedRaw: String(rewardRaw(state.collectedRaw) + amount), unallocatedRaw: String(rewardRaw(state.unallocatedRaw) + amount) };
}
export function allocateTokenRewards(state, { snapshots = {}, vaultBalanceRaw, now = Date.now() }) {
  checked(state);
  if (state.pending) throw new Error('Reconcile the pending transaction before a new cycle.');
  if (state.lastCycleAt && now - state.lastCycleAt < TOKEN_REWARD_CADENCE_MS) throw new Error('Reward cycles are at least 12 hours apart.');
  if (rewardRaw(vaultBalanceRaw) < rewardLiabilities(state)) throw new Error('Vault balance does not cover saved reward liabilities.');
  const next = structuredClone(state), p = state.policy, available = rewardRaw(state.unallocatedRaw);
  const buckets = [['dev', p.creatorShareBps], ['own', p.holderShareBps], ['partner', p.partnerShareBps]].filter(([, bps]) => bps > 0);
  const add = (wallet, source, value) => {
    if (!value) return; rewardWallet(wallet); next.credits[wallet] ||= {};
    next.credits[wallet][source] = String(rewardRaw(next.credits[wallet][source] || '0') + value);
  };
  let remaining = available; const records = {};
  for (let i = 0; i < buckets.length; i++) {
    const [source, bps] = buckets[i], fresh = i === buckets.length - 1 ? remaining : available * BigInt(bps) / 10000n; remaining -= fresh;
    next.allocatedBySource[source] = String(rewardRaw(next.allocatedBySource[source] || '0') + fresh);
    if (source === 'dev') { add(p.creator, 'dev', fresh); continue; }
    const snapshot = snapshots[source], expected = source === 'own' ? state.mint : p.partnerMint;
    if (!snapshot || snapshot.complete !== true || snapshot.mint !== expected || !Number.isSafeInteger(snapshot.slot) || !Number.isFinite(snapshot.capturedAt) || Math.abs(now - snapshot.capturedAt) > 60000 || !Array.isArray(snapshot.holders) || snapshot.holders.length > 2000) throw new Error('A complete fresh holder snapshot for the correct community is required.');
    const seen = new Set(); let total = 0n;
    for (const row of snapshot.holders) { rewardWallet(row.wallet); if (seen.has(row.wallet) || rewardRaw(row.amount) <= 0n) throw new Error('Invalid or duplicate holder in snapshot.'); seen.add(row.wallet); total += rewardRaw(row.amount); }
    const pool = fresh + rewardRaw(next.carry[source] || '0'); let dust = pool;
    for (const row of snapshot.holders) { const award = pool * rewardRaw(row.amount) / total; add(row.wallet, source, award); dust -= award; }
    next.carry[source] = String(dust); records[source] = { mint: expected, slot: snapshot.slot, count: snapshot.holders.length, capturedAt: snapshot.capturedAt };
  }
  next.unallocatedRaw = '0'; next.lastCycleAt = now; next.lastSnapshot = records; checked(next); return next;
}
export function tokenRewardRows(state, minimumRaw = '1', maxRows = 4) {
  checked(state); const threshold = rewardRaw(minimumRaw); if (threshold < 1n || maxRows < 1 || maxRows > 4) throw new Error('Invalid payout batch bounds.');
  return Object.entries(state.credits).sort(([a], [b]) => a.localeCompare(b, 'en')).map(([wallet, sources]) => ({ wallet, amountRaw: String(sum(Object.values(sources))), sources: structuredClone(sources) })).filter(row => rewardRaw(row.amountRaw) >= threshold).slice(0, maxRows);
}
export function finalizeTokenRewardPayment(state, receipt) {
  checked(state); const p = state.pending;
  if (state.receipts.some(r => r.signature === receipt.signature)) return state;
  if (!receipt.finalized || !p || p.kind !== 'payout' || p.signature !== receipt.signature || receipt.mint !== state.policy.payoutMint || !Number.isSafeInteger(receipt.slot)) throw new Error('Payout needs a matching finalized transaction receipt.');
  const next = structuredClone(state); let paid = 0n;
  for (const row of p.rows) {
    if (sum(Object.values(row.sources)) !== rewardRaw(row.amountRaw)) throw new Error('Payout source amounts do not reconcile.');
    for (const [source, amount] of Object.entries(row.sources)) {
      const owed = rewardRaw(next.credits[row.wallet]?.[source] || '0'), value = rewardRaw(amount);
      if (owed < value) throw new Error('Payout exceeds the saved liability.');
      next.credits[row.wallet][source] = String(owed - value); next.paidBySource[source] = String(rewardRaw(next.paidBySource[source] || '0') + value);
    }
    if (sum(Object.values(next.credits[row.wallet])) === 0n) delete next.credits[row.wallet];
    paid += rewardRaw(row.amountRaw);
  }
  if (next.receipts.length >= 10000) throw new Error('Payout archive needs maintenance.');
  next.paidRaw = String(rewardRaw(next.paidRaw) + paid); next.pending = null;
  next.receipts.push({ signature: receipt.signature, slot: receipt.slot, mint: receipt.mint, amountRaw: String(paid), rows: p.rows, paidAt: receipt.paidAt || Date.now() }); checked(next); return next;
}
export function publicTokenRewardLedger(s) {
  checked(s);
  return { mint: s.mint, asset: s.policy.asset, policy: s.policy, collectedRaw: s.collectedRaw, paidRaw: s.paidRaw, pendingRaw: String(rewardLiabilities(s)), unallocatedRaw: s.unallocatedRaw, paidBySource: s.paidBySource, lastSnapshot: s.lastSnapshot || null, nextCycleAt: s.lastCycleAt ? s.lastCycleAt + TOKEN_REWARD_CADENCE_MS : null, pendingSignature: s.pending?.signature || null,
    receipts: s.receipts.slice(-20).map(({ signature, amountRaw, paidAt, slot }) => ({ signature, amountRaw, paidAt, slot, url: 'https://solscan.io/tx/' + signature })) };
}
