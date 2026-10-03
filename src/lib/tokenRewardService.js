import { createDurableStonksStore } from './slimeStonksExecution.js';
import { createRewardLedger, recordRewardCollection, allocateTokenRewards, tokenRewardRows, finalizeTokenRewardPayment, publicTokenRewardLedger, rewardRaw } from './tokenRewardLedger.js';
import { TOKEN_REWARD_CADENCE_MS } from './tokenRewardPolicy.js';
import { readHolderSnapshot } from './holderAllianceSnapshot.js';

export const createTokenRewardStore = file => createDurableStonksStore(file);

// No request-lifetime timers and no public registration/broadcast route. A
// reviewed native launch must be adopted before a funded operator can activate
// this runner. Disabled by default; a preview visit never starts it.
export function createTokenRewardService({ store, driverFor, snapshot = readHolderSnapshot, now = Date.now, enableBroadcast = false, audit = () => {} }) {
  const programs = db => db.tokenRewardPrograms ||= {};
  const busy = new Set();
  async function register(input) {
    if (!input.adoptionReceipt || input.validationApproved !== true) throw new Error('Native launch adoption and fee-delivery validation are required.');
    const ledger = createRewardLedger(input), program = { mint: input.mint, pool: input.pool, config: input.config, vault: input.vault, adoptionReceipt: input.adoptionReceipt,
      ledger, minimumPayoutRaw: input.minimumPayoutRaw, minimumCollectionRaw: input.minimumCollectionRaw, maxNetworkCostLamports: input.maxNetworkCostLamports, paused: true, nextCheckAt: now(), lastError: '', status: 'PAUSED' };
    if (rewardRaw(program.minimumPayoutRaw) < 1n || rewardRaw(program.minimumCollectionRaw) < 1n || !Number.isSafeInteger(program.maxNetworkCostLamports) || program.maxNetworkCostLamports < 1 || program.maxNetworkCostLamports > 50000000) throw new Error('A bounded, explicit payout and network-cost policy is required.');
    if (program.vault === ledger.policy.creator) throw new Error('Use a dedicated fee vault, not the developer wallet.');
    await (await driverFor(program)).verify(program);
    await store.mutate(db => { const all = programs(db); if (all[program.mint]) throw new Error('This launch is already registered; its fee policy is immutable.'); if (Object.values(all).some(p => p.vault === program.vault || p.pool === program.pool)) throw new Error('A pool and fee vault must belong to only one reward program.'); all[program.mint] = program; });
    return publicTokenRewardLedger(ledger);
  }
  async function pause(mint, paused = true) { await store.mutate(db => { const p = programs(db)[mint]; if (!p) throw new Error('Reward program not found.'); p.paused = paused; p.status = paused ? 'PAUSED' : 'READY'; p.nextCheckAt = now(); }); }
  async function tick(mint) {
    if (!enableBroadcast) return { status: 'DISABLED', reason: 'Payout activation and funded validation have not been approved.' };
    if (busy.has(mint)) return { status: 'BUSY' }; busy.add(mint);
    try {
      // All writes/allocations are serialized across processes by the durable
      // file lock. Signing can happen inside this lock; broadcasts cannot.
      const work = await store.mutate(async db => {
        const program = programs(db)[mint]; if (!program) throw new Error('Reward program not found.');
        if (program.nextCheckAt > now()) return { status: program.status };
        const driver = await driverFor(program);
        if (program.ledger.pending) {
          const pending = program.ledger.pending, receipt = await driver.receipt(program, pending);
          if (receipt.status === 'finalized') {
            if (pending.kind === 'collection') { program.ledger = recordRewardCollection(program.ledger, receipt); program.ledger.pending = null; }
            else program.ledger = finalizeTokenRewardPayment(program.ledger, receipt);
            program.status = 'RECONCILED'; program.lastError = ''; program.nextCheckAt = now();
            return { status: program.status };
          }
          if (receipt.status === 'failed' && receipt.finalized) {
            if (pending.kind === 'collection') program.collectionCycleAt = 0;
            program.ledger.pending = null; program.status = 'RETRYABLE'; program.lastError = 'Finalized transaction failed; credits remain reserved.'; program.nextCheckAt = now() + 60000; return { status: program.status };
          }
          // No replacement on blockhash expiry, timeout, or missing RPC history.
          // Re-broadcasting these identical bytes can never pay twice.
          program.status = 'AWAITING_RECEIPT'; program.nextCheckAt = now() + 60000;
          // Pausing cannot reverse a submitted transaction, but it must prevent
          // new broadcasts. Keep reconciling the saved receipt while paused.
          if (program.paused) return { status: program.status };
          return { program: structuredClone(program), pending: structuredClone(pending), status: program.status };
        }
        if (program.paused) { program.status = 'PAUSED'; program.nextCheckAt = now() + TOKEN_REWARD_CADENCE_MS; return { status: program.status }; }
        let rows = tokenRewardRows(program.ledger, program.minimumPayoutRaw);
        if (rows.length) {
          const pending = await driver.preparePayout(program, rows); reserve(program, pending, 'payout', rows); return { program: structuredClone(program), pending, status: 'PREPARED' };
        }
        const cycleDue = !program.ledger.lastCycleAt || now() - program.ledger.lastCycleAt >= TOKEN_REWARD_CADENCE_MS;
        if (!cycleDue) { program.nextCheckAt = program.ledger.lastCycleAt + TOKEN_REWARD_CADENCE_MS; return { status: 'ACCUMULATING' }; }
        if (!program.collectionCycleAt || now() - program.collectionCycleAt >= TOKEN_REWARD_CADENCE_MS) {
          const pending = await driver.prepareCollection(program); program.collectionCycleAt = now();
          if (pending) { reserve(program, pending, 'collection', []); return { program: structuredClone(program), pending, status: 'PREPARED' }; }
        }
        const p = program.ledger.policy, excluded = [program.vault, program.pool, mint], snapshots = {};
        if (rewardRaw(program.ledger.unallocatedRaw) === 0n && Object.values(program.ledger.carry).every(v => rewardRaw(v) === 0n)) { program.nextCheckAt = now() + TOKEN_REWARD_CADENCE_MS; return { status: 'ACCUMULATING' }; }
        await Promise.all([['own', p.holderShareBps, mint], ['partner', p.partnerShareBps, p.partnerMint]].map(async ([source, share, token]) => {
          if (!share) return; const value = await snapshot(token, { excluded });
          // Only our complete all-account reader can supply this marker. Never
          // upgrade a provider's top-holder page to a full holder snapshot.
          snapshots[source] = { ...value, complete: true };
        }));
        program.ledger = allocateTokenRewards(program.ledger, { now: now(), snapshots, vaultBalanceRaw: await driver.balance(program) });
        program.status = 'ALLOCATED'; program.nextCheckAt = now(); return { status: program.status };
      });
      if (work.pending) {
        // The lock has been released ONLY after fsync+rename saved exact bytes.
        try { const signature = await (await driverFor(work.program)).broadcast(work.pending); if (signature !== work.pending.signature) throw new Error('Unexpected transaction signature.'); }
        catch { /* Persisted intent remains unresolved and must be reconciled. */ }
        audit({ type: 'token_reward_intent', mint, asset: work.pending.mint, signature: work.pending.signature, kind: work.pending.kind, status: 'AWAITING_RECEIPT' });
      }
      return { status: work.status };
    } catch (e) {
      await store.mutate(db => { const p = programs(db)[mint]; if (p) { p.lastError = String(e.message || e).slice(0, 240); p.nextCheckAt = now() + 300000; p.status = p.ledger.pending ? 'AWAITING_RECEIPT' : 'NEEDS_ATTENTION'; } }).catch(() => {});
      throw e;
    } finally { busy.delete(mint); }
  }
  function reserve(program, pending, kind, rows) {
    if (!pending || pending.kind !== kind || pending.mint !== program.ledger.policy.payoutMint || !pending.signature || !pending.rawBase64 || !Number.isSafeInteger(pending.lastValidBlockHeight) || !pending.blockhash || JSON.stringify(pending.rows || []) !== JSON.stringify(rows)) throw new Error('Invalid signed reward intent. Nothing broadcast.');
    program.ledger.pending = { ...pending, createdAt: now() }; program.nextCheckAt = now() + 15000; program.status = 'AWAITING_RECEIPT';
  }
  async function tickDue() { const due = await store.mutate(db => Object.values(programs(db)).filter(p => p.nextCheckAt <= now() && (!p.paused || p.ledger.pending)).slice(0, 10).map(p => p.mint)); for (const mint of due) await tick(mint).catch(() => {}); return due.length; }
  async function read(mint) { return store.mutate(db => { const p = programs(db)[mint]; return p ? { ...publicTokenRewardLedger(p.ledger), status: p.status, paused: p.paused, error: p.lastError } : null; }); }
  function start() { if (!enableBroadcast) throw new Error('Reward runner activation is disabled.'); let running = false; const timer = setInterval(async () => { if (running) return; running = true; try { await tickDue(); } finally { running = false; } }, 15000); timer.unref?.(); return () => clearInterval(timer); }
  return { register, pause, tick, tickDue, read, start };
}
