import { createHash } from 'node:crypto';
import { normalizeHolderAlliance, splitRecipients, HOLDER_CADENCE_MS } from './holderAlliance.js';

// Native SlimeWire programs. This module never signs, sends, imports user code,
// fetches URLs or touches private keys. Money actions use the existing durable
// per-coin settlement adapter; drafts and reviews cannot execute that adapter.
export const FLOW_VERSION = '2026-09-29-v1';
const SOL = 1000000000n;
const REVIEW_MS = 10 * 60000;
const HOURS = [12, 24, 48, 168];
const ACTIONS = Object.freeze([
  { id: 'allocate_rewards', title: 'Allocate approved rewards', permission: 'rewards.allocate', description: 'Snapshot eligible holders and apply the coin’s existing approved split.' },
  { id: 'settle_rewards', title: 'Settle saved rewards', permission: 'rewards.pay', description: 'Pay saved credits through the durable settlement engine. Finalized receipts are retained.' }
]);
const clean = (v, n) => String(v ?? '').trim().slice(0, n);
const canonical = value => value && typeof value === 'object'
  ? Array.isArray(value) ? value.map(canonical) : Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value;
const hash = value => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const iso = n => new Date(n).toISOString();
function fields(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !names.includes(k))) throw Error('Unsupported program fields. Refresh the builder and review the supported actions.');
}
export function flowSol(value) {
  const text = String(value ?? '');
  if (!/^\d{1,7}(?:\.\d{1,9})?$/.test(text)) throw Error('Use a positive SOL amount with at most nine decimal places.');
  const [whole, fraction = ''] = text.split('.');
  const n = BigInt(whole) * SOL + BigInt(fraction.padEnd(9, '0'));
  if (n < 1000000n || n > 1000000n * SOL) throw Error('Program amounts must be between 0.001 and 1,000,000 SOL.');
  return n.toString();
}
export function normalizeFlow(input) {
  fields(input, ['name', 'trigger', 'conditions', 'actions']);
  fields(input.trigger, ['type', 'hours']); fields(input.conditions, ['minimumSol', 'maximumSol']);
  const name = clean(input.name, 64);
  if (!name || /[\x00-\x1f]/.test(name)) throw Error('Give the program a readable name.');
  if (input.trigger.type !== 'schedule' || !HOURS.includes(input.trigger.hours)) throw Error('Choose a supported schedule: 12, 24, 48 or 168 hours.');
  const minimumLamports = flowSol(input.conditions.minimumSol), maximumLamports = flowSol(input.conditions.maximumSol);
  if (BigInt(minimumLamports) > BigInt(maximumLamports)) throw Error('The minimum must not exceed the per-cycle allocation limit.');
  if (JSON.stringify(input.actions) !== JSON.stringify(ACTIONS.map(a => a.id))) throw Error('Unsupported action sequence. Use approved allocation followed by durable settlement. Arbitrary code and external actions are not enabled.');
  return { version: FLOW_VERSION, name, trigger: { type: 'schedule', hours: input.trigger.hours }, minimumLamports, maximumLamports, actions: ACTIONS.map(a => a.id) };
}
export function flowDefinition(program) {
  const decimal = s => { const n = BigInt(s); return `${n / SOL}.${String(n % SOL).padStart(9, '0')}`; };
  return { name: program.name, trigger: program.trigger, conditions: { minimumSol: decimal(program.minimumLamports), maximumSol: decimal(program.maximumLamports) }, actions: program.actions };
}
export function flowPolicyHash(attempt) {
  const p = normalizeHolderAlliance(attempt.launchUtility);
  return hash({ mint: attempt.tokenMint, creator: attempt.devWalletPublicKey, config: attempt.pumpFeeSharing?.configAddress || '', vault: attempt.pumpFeeSharing?.vaultAddress || '', policy: p });
}
export function flowCapabilities(enabled = false) {
  return { version: FLOW_VERSION, provider: 'SlimeWire', asset: 'SOL', actions: ACTIONS, schedules: HOURS,
    activation: { available: enabled === true, reason: enabled ? '' : 'Program activation is held for funded validation. Drafts, reviews and simulations work; they never move funds.' },
    modules: [
      { id: 'programs', title: 'Native programs', state: enabled ? 'beta' : 'preview', detail: 'Saved drafts, exact-term approval, schedules, minimum funding, per-cycle allocation caps and receipts.' },
      { id: 'social', title: 'Social claims', state: 'unavailable', detail: 'Identity verification, recipient recovery and a claim custody adapter are not implemented. No X Money connection.' },
      { id: 'assets', title: 'Asset rewards & pairs', state: 'unavailable', detail: 'Alternative quote launches, asset conversions and baskets require verified execution adapters and liquidity checks.' },
      { id: 'extensions', title: 'Apps & extensions', state: 'unavailable', detail: 'Third-party code execution, paid apps and public developer credentials are not enabled.' }
    ], note: 'No Bags dependency. Programs do not change permanent on-chain fee splits. Limits cover newly allocated managed rewards, not direct developer fees, saved unpaid credits or network costs.' };
}
function supported(attempt) {
  if (!attempt || attempt.status !== 'COMPLETE' || attempt.launchUtility?.mode !== 'holder_alliance' || attempt.pumpFeeSharing?.status !== 'ACTIVE' || !attempt.pumpFeeSharing?.vaultAddress) throw Error('Choose an active SlimeWire managed-rewards program. Regular launches remain unchanged.');
  normalizeHolderAlliance(attempt.launchUtility);
}
export function evaluateFlow(attempt, { now = Date.now(), availableLamports, enabled = true } = {}) {
  const flow = attempt.slimeFlow;
  if (!flow?.approved) return { allowed: true, reason: 'legacy', cadenceMs: HOLDER_CADENCE_MS, allocationLimitLamports: null };
  const blocked = reason => ({ allowed: false, reason, cadenceMs: HOLDER_CADENCE_MS });
  if (!enabled) return blocked('activation_unavailable');
  if (flow.state !== 'ACTIVE') return blocked('paused');
  try {
    supported(attempt);
    if (!Number.isSafeInteger(Number(attempt.holderAllianceLedger?.lastSnapshotAt || 0)) || Number(attempt.holderAllianceLedger?.lastSnapshotAt || 0) < 0) return blocked('invalid_program');
    const definition = normalizeFlow(flowDefinition(flow.approved.program));
    if (flow.approved.policyHash !== flowPolicyHash(attempt) || hash({ program: definition, policyHash: flow.approved.policyHash, revision: flow.approved.revision }) !== flow.approved.hash) return blocked('terms_changed');
    const cadenceMs = definition.trigger.hours * 3600000;
    const nextAt = Number(attempt.holderAllianceLedger?.lastSnapshotAt || 0) + cadenceMs;
    if (now < nextAt) return { allowed: false, reason: 'schedule', cadenceMs, nextAt };
    if (availableLamports !== undefined && BigInt(availableLamports) < BigInt(definition.minimumLamports)) return { allowed: false, reason: 'minimum', cadenceMs, minimumLamports: definition.minimumLamports };
    return { allowed: true, reason: 'ready', cadenceMs, allocationLimitLamports: definition.maximumLamports, minimumLamports: definition.minimumLamports, revision: flow.approved.revision, runId: hash({ mint: attempt.tokenMint, approval: flow.approved.hash, previousSnapshot: attempt.holderAllianceLedger?.lastSnapshotAt || 0 }) };
  } catch { return blocked('invalid_program'); }
}
export function previewFlow(attempt, definition, availableSol) {
  supported(attempt);
  const program = normalizeFlow(definition), available = BigInt(flowSol(availableSol));
  const allocated = available < BigInt(program.minimumLamports) ? 0n : available > BigInt(program.maximumLamports) ? BigInt(program.maximumLamports) : available;
  const p = normalizeHolderAlliance(attempt.launchUtility), total = BigInt(10000 - p.creatorShareBps);
  const shares = [
    ...(p.ownHolderShareBps ? [{ label: 'Own community', bps: p.ownHolderShareBps }] : []),
    ...(p.partnerHolderShareBps ? [{ label: 'Partner community', bps: p.partnerHolderShareBps }] : []),
    ...splitRecipients(p).map(r => ({ label: r.label || 'Receiving wallet', wallet: r.wallet, bps: r.shareBps }))
  ];
  return { simulated: true, program, availableLamports: String(available), allocatedLamports: String(allocated), retainedLamports: String(available - allocated),
    destinations: shares.map(r => ({ ...r, lamports: String(allocated * BigInt(r.bps) / total) })),
    note: 'Hypothetical unreserved rewards-vault SOL, after its reserve. Not a live balance, quote, or payment. Developer fees are paid separately by the permanent split. Holder eligibility, dust rounding, network costs and old unpaid credits are not simulated.' };
}
export function publicFlow(attempt, enabled = false, now = Date.now()) {
  const f = attempt.slimeFlow || {};
  let supportedProgram = true; try { supported(attempt); } catch { supportedProgram = false; }
  const history = (attempt.holderAllianceLedger?.flowRuns || []).slice(-50).reverse();
  return { attemptId: attempt.id, mint: attempt.tokenMint, symbol: clean(attempt.symbol, 20), name: clean(attempt.tokenName, 80), supported: supportedProgram,
    policy: supportedProgram ? normalizeHolderAlliance(attempt.launchUtility) : null, creator: attempt.devWalletPublicKey,
    flow: { state: f.state || 'NONE', revision: f.revision || 0, draft: f.draft || null, approved: f.approved || null, history: (f.history || []).slice(-50).reverse() },
    execution: f.approved ? evaluateFlow(attempt, { now, enabled }) : null, runs: history,
    receipts: (attempt.holderAllianceLedger?.receipts || []).slice(-25).reverse().map(r => ({ signature: r.signature, lamports: r.lamports, recipients: r.recipients, confirmedAt: r.confirmedAt })),
    paused: attempt.allianceDistribution?.automaticPaused === true, status: attempt.holderLastError ? 'DELAYED' : attempt.holderAllianceLedger?.status || 'ACCUMULATING' };
}
export function flowScheduleSummary(attempt, { enabled = process.env.SLIME_FLOWS_VALIDATED_VERSION === FLOW_VERSION } = {}) {
  const approved = attempt.slimeFlow?.approved;
  if (!approved) return { cadenceHours: 12, paused: false, program: false };
  const decision = evaluateFlow(attempt, { enabled });
  let hours = 12;
  try { hours = normalizeFlow(flowDefinition(approved.program)).trigger.hours; } catch { /* paused invalid program */ }
  return { cadenceHours: hours, paused: !['ready', 'schedule', 'minimum'].includes(decision.reason), program: true };
}
export function createSlimeFlows({ attempts, load, save, wallets, lock, enabled = false, now = Date.now }) {
  const owner = async (userId, id) => {
    const a = await load(String(id || ''));
    if (!a || String(a.userId) !== String(userId)) throw Error('This launch is not owned by this account.');
    return a;
  };
  const mutate = async (userId, input, fn) => {
    const initial = await owner(userId, input.attemptId);
    return lock(initial.tokenMint, async () => {
      const a = await owner(userId, input.attemptId); supported(a);
      if (!(await wallets(userId)).some(w => w.publicKey === a.devWalletPublicKey)) throw Error('Restore the original creator wallet before managing this program.');
      return fn(a);
    });
  };
  const record = async (a, flow, type) => {
    const row = { type, at: iso(now()), revision: flow.revision || 0 };
    await save({ id: a.id, slimeFlow: { ...flow, history: [...(flow.history || []), row].slice(-100), updatedAt: iso(now()) }, holderNextCheckAt: 0 });
    return publicFlow(await load(a.id), enabled, now());
  };
  const revision = (a, input) => { if (!Number.isSafeInteger(input.revision) || input.revision !== (a.slimeFlow?.revision || 0)) throw Error('Program changed in another session. Refresh and review again.'); };
  return {
    async dashboard(userId) { return { capabilities: flowCapabilities(enabled), programs: (await attempts()).filter(a => String(a.userId) === String(userId) && a.status === 'COMPLETE').slice(-200).map(a => publicFlow(a, enabled, now())) }; },
    async saveDraft(userId, input) { return mutate(userId, input, async a => { revision(a, input); const draft = normalizeFlow(input.definition), f = a.slimeFlow || {};
      return record(a, { ...f, revision: (f.revision || 0) + 1, draft, review: null, state: f.approved ? f.state : 'DRAFT' }, 'draft_saved'); }); },
    async preview(userId, input) { const a = await owner(userId, input.attemptId); return previewFlow(a, input.definition, input.availableSol); },
    async review(userId, input) { return mutate(userId, input, async a => { revision(a, input); const f = a.slimeFlow || {}; if (!f.draft) throw Error('Save a program draft first.');
      const program = normalizeFlow(flowDefinition(f.draft)), policyHash = flowPolicyHash(a), terms = { program, policyHash, revision: f.revision };
      const review = { ...terms, hash: hash(terms), expiresAt: iso(now() + REVIEW_MS), permissions: ACTIONS.map(a => a.permission) };
      await save({ id: a.id, slimeFlow: { ...f, review } }); return { ...publicFlow(a, enabled, now()), review, note: flowCapabilities(enabled).note }; }); },
    async activate(userId, input) { return mutate(userId, input, async a => {
      if (input.acknowledge !== true) throw Error('Acknowledge the exact program, its limits and permissions.');
      if (!enabled) throw Error(flowCapabilities(false).activation.reason);
      revision(a, input); const f = a.slimeFlow || {}, r = f.review;
      if (f.state === 'ACTIVE' && f.approved?.hash === input.reviewHash && f.approved?.revision === input.revision) return publicFlow(a, enabled, now());
      if (!r || r.hash !== input.reviewHash || !Number.isFinite(Date.parse(r.expiresAt)) || Date.parse(r.expiresAt) <= now() || r.policyHash !== flowPolicyHash(a) || r.hash !== hash({ program: f.draft, policyHash: r.policyHash, revision: f.revision })) throw Error('Review expired or approved terms changed. Review the program again.');
      return record(a, { ...f, state: 'ACTIVE', approved: { program: r.program, policyHash: r.policyHash, hash: r.hash, revision: r.revision, at: iso(now()) }, review: null }, 'activated');
    }); },
    async pause(userId, input) { return mutate(userId, input, async a => { revision(a, input); const f = a.slimeFlow || {}; if (!f.approved) throw Error('There is no active program to pause.');
      if (f.state === 'PAUSED') return publicFlow(a, enabled, now()); return record(a, { ...f, state: 'PAUSED', review: null }, 'paused'); }); }
  };
}
