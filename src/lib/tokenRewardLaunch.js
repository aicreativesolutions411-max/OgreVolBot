import crypto from 'node:crypto';
import { PublicKey, Keypair, Transaction, TransactionInstruction, VersionedTransaction, ComputeBudgetProgram, SystemProgram } from '@solana/web3.js';
import bs58 from 'bs58';
import { deriveDbcPoolAddress } from '@meteora-ag/dynamic-bonding-curve-sdk';
import { rewardError, rewardAddress } from './tokenRewardAssets.js';
import { normalizeTokenRewardPolicy, tokenRewardPolicyHash, rewardWallet } from './tokenRewardPolicy.js';
import { buildTokenRewardLaunch, tokenRewardCurve } from './tokenRewardMeteora.js';

const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const pack = tx => tx.instructions.map(ix => ({ programId: ix.programId.toBase58(), keys: ix.keys.map(k => ({ ...k, pubkey: k.pubkey.toBase58() })), data: ix.data.toString('base64') }));
const unpack = list => list.map(ix => new TransactionInstruction({ programId: new PublicKey(ix.programId), keys: ix.keys.map(k => ({ ...k, pubkey: new PublicKey(k.pubkey) })), data: Buffer.from(ix.data, 'base64') }));
const all = db => db.tokenRewardLaunches ||= {};
const owned = (db, id, wallet) => { const r = all(db)[id]; if (!r || r.wallet !== wallet) throw rewardError(404, 'Launch not found for this wallet.'); return r; };
const publicRow = r => ({ id: r.id, wallet: r.wallet, name: r.name, symbol: r.symbol, mint: r.mint, pool: r.pool, vault: r.vault, config: r.config, policy: r.policy, policyHash: r.policyHash,
  status: r.status, phase: r.phase, error: r.error || '', createdAt: r.createdAt, transaction: r.status === 'REVIEW' ? r.pending.transaction : undefined,
  review: r.pending?.review || null, expiresAt: r.pending?.expiresAt || null, signature: r.pending?.signature || null,
  receipts: r.receipts, metadataUri: r.metadataUri, vaultBudgetLamports: r.vaultBudgetLamports, curve: r.curve });

export function validateRewardLaunchInput(i) {
  const fields = ['requestId', 'creator', 'quoteMint', 'name', 'symbol', 'creatorShareBps', 'holderShareBps', 'partnerShareBps', 'partnerMint', 'description', 'imageData', 'imageRights', 'vaultBudgetLamports', 'consentVersion'];
  if (!i || Array.isArray(i) || Object.keys(i).some(k => !fields.includes(k)) || !/^[\w-]{16,80}$/.test(i.requestId || '')) throw rewardError(400, 'Invalid launch request.');
  rewardWallet(i.creator); rewardAddress(i.quoteMint);
  if (typeof i.name !== 'string' || !i.name.trim() || Buffer.byteLength(i.name) > 32 || /[\x00-\x1f]/.test(i.name) || !/^[A-Za-z0-9]{1,10}$/.test(i.symbol || '')) throw rewardError(422, 'Use a name up to 32 UTF-8 bytes and an alphanumeric ticker up to 10 characters.');
  if (i.imageRights !== true || typeof i.description !== 'string' || i.description.length > 1000 || typeof i.imageData !== 'string' || i.imageData.length > 4200000 || !/^data:image\/(png|jpeg|webp);base64,/.test(i.imageData)) throw rewardError(422, 'Add a PNG, JPEG or WebP under 3 MB and confirm your rights to use it.');
  if (!Number.isSafeInteger(i.vaultBudgetLamports) || i.vaultBudgetLamports < 20000000 || i.vaultBudgetLamports > 500000000) throw rewardError(422, 'Choose a dedicated network budget from 0.02 to 0.5 SOL.');
  if (i.consentVersion !== 'slimewire-token-rewards-2026-10-03-v1') throw rewardError(422, 'Review and accept the current fee-vault and payout terms.');
}

// Two explicit wallet approvals: config first, then pool + the displayed vault
// budget. Keys/templates survive restarts, but no key or signed secret is sent
// to clients. A pool creation and vault funding are atomic in the second tx.
export function createTokenRewardLaunchService({ store, connection, resolver, metadata, encrypt, decrypt, rewards, build = buildTokenRewardLaunch, now = Date.now, audit = () => {} }) {
  const log = (r, reason) => audit({ type: 'token_reward_launch', launchId: r.id, userId: 'wallet:' + r.wallet, symbol: r.symbol, status: r.status, phase: r.phase, signature: r.pending?.signature || '', reason });
  function signer(secret, expected) {
    const bytes = decrypt(secret); try { const kp = Keypair.fromSecretKey(new Uint8Array(bytes)); if (kp.publicKey.toBase58() !== expected) throw Error(); return kp; }
    catch { throw rewardError(503, 'Launch key recovery needs operator attention.'); } finally { bytes.fill(0); }
  }
  async function review(r) {
    const phase = r.phase, extra = signer(r.keys[phase], phase === 'config' ? r.config : r.mint);
    try {
      const block = await connection.getLatestBlockhash('confirmed');
      const tx = new Transaction({ feePayer: new PublicKey(r.wallet), ...block }).add(
        ComputeBudgetProgram.setComputeUnitLimit({ units: 600000 }), ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 10000 }), ...unpack(r.templates[phase]));
      if (phase === 'pool') tx.add(SystemProgram.transfer({ fromPubkey: new PublicKey(r.wallet), toPubkey: new PublicKey(r.vault), lamports: r.vaultBudgetLamports }));
      tx.partialSign(extra);
      const raw = tx.serialize({ requireAllSignatures: false }); if (raw.length > 1232) throw rewardError(422, 'Launch transaction exceeds the network size limit.');
      const balance = await connection.getBalance(new PublicKey(r.wallet), 'confirmed');
      const [sim, fee] = await Promise.all([
        connection.simulateTransaction(VersionedTransaction.deserialize(raw), { sigVerify: false, commitment: 'confirmed', accounts: { encoding: 'base64', addresses: [r.wallet] } }),
        connection.getFeeForMessage(tx.compileMessage(), 'confirmed')]);
      if (sim.value.err) throw rewardError(422, 'Launch simulation failed. Check SOL for rent and the network budget. Nothing was submitted.');
      const after = sim.value.accounts?.[0]?.lamports;
      if (!Number.isSafeInteger(after) || !Number.isSafeInteger(fee.value)) throw rewardError(502, 'Launch costs could not be verified.');
      const upper = Math.max(fee.value, balance - after) + fee.value;
      const cap = 150000000 + (phase === 'pool' ? r.vaultBudgetLamports : 0);
      if (upper > cap || balance < upper + 1000000) throw rewardError(422, 'Launch cost exceeds the safety limit or available SOL.');
      r.pending = { transaction: raw.toString('base64'), messageHash: hash(tx.serializeMessage()), lastValidBlockHeight: block.lastValidBlockHeight, expiresAt: now() + 90000,
        review: { phase, maxSolCostLamports: upper, networkFeeLamports: fee.value, vaultFundingLamports: phase === 'pool' ? r.vaultBudgetLamports : 0, simulationSlot: sim.context.slot,
          policyHash: r.policyHash, network: 'mainnet-beta', devBuy: false, poolCostSeparate: phase === 'config', note: phase === 'config' ? 'Step 1 of 2: create the immutable fee configuration. Account rent may not be recoverable if you stop before step 2.' : 'Step 2 of 2: create the coin and fund its dedicated reward network budget. No developer buy.' } };
      r.status = 'REVIEW'; r.error = '';
    } finally { extra.secretKey.fill(0); }
  }
  async function prepare(input) {
    validateRewardLaunchInput(input);
    const id = hash(input.creator + ':' + input.requestId).slice(0, 40), requestHash = hash(JSON.stringify(input));
    const result = await store.mutate(async db => {
      const old = all(db)[id]; if (old) { if (old.requestHash !== requestHash) throw rewardError(409, 'This launch ID belongs to a different request.'); return publicRow(old); }
      if (Object.values(all(db)).some(r => r.wallet === input.creator && !['ACTIVE', 'CANCELLED'].includes(r.status))) throw rewardError(409, 'Resume your existing launch before creating another.');
      if (Object.keys(all(db)).length >= 2000) throw rewardError(503, 'Launch storage needs maintenance.');
      let asset = await resolver.resolve(input.quoteMint, { fresh: true });
      const policy = normalizeTokenRewardPolicy(input, asset);
      if (policy.partnerShareBps) await resolver.resolve(policy.partnerMint);
      const metadataUri = await metadata(input); asset = await resolver.resolve(input.quoteMint, { fresh: true });
      if (asset.decimals !== policy.asset.decimals || asset.tokenProgram !== policy.asset.tokenProgram) throw rewardError(422, 'Quote asset changed during metadata upload.');
      const config = Keypair.generate(), base = Keypair.generate(), vault = Keypair.generate();
      try {
        const r = { id, requestHash, wallet: input.creator, name: input.name.trim(), symbol: input.symbol, mint: base.publicKey.toBase58(), config: config.publicKey.toBase58(), vault: vault.publicKey.toBase58(),
          policy, policyHash: tokenRewardPolicyHash(policy), asset, metadataUri, vaultBudgetLamports: input.vaultBudgetLamports,
          curve: { quotePriceUsd: asset.priceUsd, initialMarketCapUsd: 5000, migrationMarketCapUsd: 69000, migrationQuoteRaw: tokenRewardCurve(asset).migrationQuoteThreshold.toString(), quoteDecimals: asset.decimals, totalSupplyTokens: '1000000000', tradingFeeBps: 100, lpLockedPercent: 100 },
          pool: deriveDbcPoolAddress(new PublicKey(asset.mint), base.publicKey, config.publicKey).toBase58(), phase: 'config', status: 'CREATED', createdAt: now(), receipts: [],
          keys: { config: encrypt(config.secretKey), pool: encrypt(base.secretKey), vault: encrypt(vault.secretKey) } };
        const txs = await build({ connection, asset, policy, config: r.config, baseMint: r.mint, vault: r.vault, name: r.name, symbol: r.symbol, uri: metadataUri });
        r.templates = { config: pack(txs.createConfigTx), pool: pack(txs.createPoolWithFirstBuyTx) };
        await review(r); all(db)[id] = r; return publicRow(r);
      } finally { config.secretKey.fill(0); base.secretKey.fill(0); vault.secretKey.fill(0); }
    });
    log(result, 'review_prepared'); return result;
  }
  async function resume(id, wallet) {
    await status(id, wallet);
    return store.mutate(async db => { const r = owned(db, id, wallet); if (['ACTIVE', 'CANCELLED', 'SUBMITTED', 'ADOPTING'].includes(r.status)) return publicRow(r);
      if (r.pending?.signature && r.status !== 'FAILED') throw rewardError(409, 'Reconcile the signed transaction before continuing.');
      if (r.status === 'REVIEW' && r.pending.expiresAt > now()) return publicRow(r);
      await review(r); return publicRow(r); });
  }
  async function broadcast(r) {
    const p = r.pending;
    // Persist the exact signature/bytes before attempting this. An unknown
    // outcome NEVER gets a newly built replacement transaction.
    try {
      if (await connection.getBlockHeight('confirmed') > p.lastValidBlockHeight) return;
      const raw = Buffer.from(p.signedTransaction, 'base64');
      const sim = await connection.simulateTransaction(VersionedTransaction.deserialize(raw), { sigVerify: true, commitment: 'confirmed' });
      if (!sim.value.err) await connection.sendRawTransaction(raw, { skipPreflight: false, maxRetries: 2, preflightCommitment: 'confirmed' });
    } catch { /* Reconcile saved signature; never infer success/failure from transport errors. */ }
  }
  async function submit(id, wallet, encoded) {
    if (typeof encoded !== 'string' || encoded.length > 1800) throw rewardError(400, 'Invalid signed transaction.');
    let tx; try { tx = Transaction.from(Buffer.from(encoded, 'base64')); } catch { throw rewardError(400, 'Invalid signed transaction.'); }
    const result = await store.mutate(db => {
      const r = owned(db, id, wallet), p = r.pending;
      if (!p || hash(tx.serializeMessage()) !== p.messageHash || !tx.feePayer?.equals(new PublicKey(wallet)) || !tx.verifySignatures()) throw rewardError(400, 'The signed transaction differs from the reviewed launch.');
      const signature = bs58.encode(tx.signature);
      if (p.signature) { if (p.signature !== signature) throw rewardError(409, 'A different signature is already recorded.'); return { saved: structuredClone(r), send: false }; }
      if (r.status !== 'REVIEW' || p.expiresAt <= now()) throw rewardError(409, 'This unsigned review expired. Resume to review it again.');
      p.signature = signature; p.signedTransaction = encoded; p.lastBroadcastAt = now(); r.status = 'SUBMITTED';
      return { saved: structuredClone(r), send: true };
    });
    if (result.send) { log(result.saved, 'signed_bytes_saved_before_broadcast'); await broadcast(result.saved); }
    return status(id, wallet);
  }
  async function status(id, wallet) {
    const row = await store.mutate(db => structuredClone(owned(db, id, wallet)));
    if (row.status === 'SUBMITTED') {
      let status, receipt;
      try {
        status = (await connection.getSignatureStatuses([row.pending.signature], { searchTransactionHistory: true })).value[0];
        if (status?.confirmationStatus !== 'finalized') return publicRow(row);
        if (!status.err) receipt = await connection.getTransaction(row.pending.signature, { commitment: 'finalized', maxSupportedTransactionVersion: 0 });
      } catch { return publicRow(row); }
      if (!status.err && (!receipt?.meta || receipt.meta.err || !receipt.transaction.signatures.includes(row.pending.signature))) return publicRow(row);
      await store.mutate(db => {
        const r = owned(db, id, wallet); if (r.status !== 'SUBMITTED' || r.pending.signature !== row.pending.signature) return;
        if (status.err) { r.status = 'FAILED'; r.error = 'Finalized transaction failed. Resume to review the same launch again.'; return; }
        r.receipts.push({ phase: r.phase, signature: r.pending.signature, slot: receipt.slot });
        if (r.phase === 'config') { r.phase = 'pool'; r.status = 'NEXT_STEP'; r.pending = null; }
        else { r.status = 'ADOPTING'; r.pending = null; }
      });
    }
    const current = await store.mutate(db => structuredClone(owned(db, id, wallet)));
    if (current.status === 'ADOPTING') {
      try {
        await rewards.register({ mint: current.mint, pool: current.pool, config: current.config, vault: current.vault, policy: current.policy,
          adoptionReceipt: current.receipts.find(r => r.phase === 'pool').signature, validationApproved: true,
          minimumPayoutRaw: '1', minimumCollectionRaw: '1', maxNetworkCostLamports: 20000000 });
        await rewards.pause(current.mint, false);
        await store.mutate(db => { const r = owned(db, id, wallet); r.status = 'ACTIVE'; r.error = ''; delete r.keys.config; delete r.keys.pool; });
      } catch {
        await store.mutate(db => { const r = owned(db, id, wallet); r.error = 'Coin created. Reward adoption is pending verification; do not launch a replacement.'; });
      }
    }
    return store.mutate(db => publicRow(owned(db, id, wallet)));
  }
  async function retry(id, wallet) {
    const current = await status(id, wallet); if (current.status !== 'SUBMITTED') return current;
    const r = await store.mutate(db => { const r = owned(db, id, wallet); if (r.status !== 'SUBMITTED' || now() - r.pending.lastBroadcastAt < 15000) return null; r.pending.lastBroadcastAt = now(); return structuredClone(r); });
    if (r) await broadcast(r); return status(id, wallet);
  }
  async function cancel(id, wallet) { return store.mutate(db => { const r = owned(db, id, wallet); if (r.phase !== 'config' || r.pending?.signature || r.receipts.length) throw rewardError(409, 'This launch has an on-chain step. Resume it instead of creating a duplicate.'); r.status = 'CANCELLED'; r.pending = null; return publicRow(r); }); }
  async function history(wallet) { return store.mutate(db => Object.values(all(db)).filter(r => r.wallet === wallet).sort((a, b) => b.createdAt - a.createdAt).slice(0, 30).map(publicRow)); }
  async function reconcileDue() { const rows = await store.mutate(db => Object.values(all(db)).filter(r => ['SUBMITTED', 'ADOPTING'].includes(r.status)).slice(0, 10).map(r => [r.id, r.wallet])); for (const [id, wallet] of rows) await status(id, wallet).catch(() => {}); }
  return { prepare, resume, submit, status, retry, history, cancel, reconcileDue };
}
