import { createHash } from 'node:crypto';
const text = (value, max = 120) => String(value ?? '').slice(0, max);
const address = value => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(value || '')) ? String(value) : '';
const signature = value => /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(String(value || '')) ? String(value) : '';
const date = value => Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : '';

// Input is the already-public reward report, never raw attempts or wallet keys.
// The digest identifies this saved configuration; it is NOT a creator signature,
// an audit, proof of immutability, or a new live chain verification.
export function buildLaunchPassport(report) {
  if (!report || !address(report.mint)) return null;
  const holder = report.mode === 'holder_alliance';
  const destinations = (report.destinations || []).slice(0, 13).map(row => ({
    id: text(row.id, 64), label: text(row.label, 64),
    shareBps: Number.isInteger(row.shareBps) && row.shareBps > 0 && row.shareBps <= 10000 ? row.shareBps : null,
    wallet: address(row.address), communityMint: address(row.tokenMint),
  }));
  const manifest = {
    schema: 'slimewire.launch-passport.v1', chain: 'solana', mint: report.mint,
    mode: text(report.mode, 40), payoutAsset: 'SOL', quoteMint: address(report.quoteMint), destinations,
    executionModel: holder ? 'managed_per_coin_rewards_vault' : report.mode === 'alliance' ? 'pump_fee_sharing' : 'existing_creator_or_legacy_program',
    holderRules: holder ? { thresholdUsd: 20, comparison: 'strictly_greater_than', cadenceHours: 12, weight: 'proportional_holdings', snapshot: 'complete_finalized', minimumPayoutLamports: '1000000' } : null,
  };
  const canonicalJson = JSON.stringify(manifest);
  const events = new Map();
  for (const row of report.collectionReceipts || []) {
    const sig = signature(row.signature), at = date(row.confirmedAt);
    if (sig && at && row.accountingStatus === 'verified') events.set('collection:' + sig, { kind: 'collection', signature: sig, at });
  }
  for (const row of report.receipts || []) {
    const sig = signature(row.signature), at = date(row.confirmedAt);
    if (sig && at) events.set('distribution:' + sig, { kind: 'distribution', signature: sig, at });
  }
  return {
    manifest, canonicalJson, digest: createHash('sha256').update(canonicalJson).digest('hex'),
    digestType: 'sha256', attestation: 'saved_configuration_not_creator_signed',
    evidenceSource: 'saved_finalized_receipts_not_live_chain_recheck',
    events: [...events.values()].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40),
    coverage: 'retained_records_only',
    controls: { automation: holder ? report.automatic ? 'enabled' : 'paused' : 'not_applicable', delayed: report.delayed === true },
    limitations: ['This is a saved configuration record, not a security rating or creator-signed attestation.',
      'A configuration digest does not prove terms are immutable. Historical changes are not reconstructed.',
      ...(holder ? ['Community payouts use a SlimeWire-managed vault. Incomplete snapshots or funding can delay distributions.'] : []),
      'Vesting, liquidity locks and product claims are not verified by this passport.'],
  };
}
