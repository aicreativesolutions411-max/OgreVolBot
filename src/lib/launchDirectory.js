// Public launch discovery. Never return the attempt object: it contains private
// wallet/recovery state. This view needs no RPC, indexer or paid metadata calls.
import {splitRecipients} from './holderAlliance.js';
import {buildLaunchEarnings} from './launchEarnings.js';
const text = (value, max) => String(value || '').trim().slice(0, max);
function feeSplit(attempt){
  const p=attempt.launchUtility||{};if(!['alliance','holder_alliance'].includes(p.mode))return {};
  const rows=p.mode==='alliance'?[['Developer wallet',10000-p.partnerShareBps],[p.partnerName||'Treasury wallet',p.partnerShareBps]]:[['Developer wallet',p.creatorShareBps],['This coin’s holders',p.ownHolderShareBps],[p.partnerName||'Other community holders',p.partnerHolderShareBps],...splitRecipients(p).map(r=>[r.label||'Receiving wallet',r.shareBps])];
  rows.push(...(p.socialRecipients||[]).map(r=>['@'+r.handle+' · claim SOL',r.shareBps]));
  return {feeSplit:rows.filter(r=>Number.isInteger(r[1])&&r[1]>0&&r[1]<=10000).slice(0,18).map(([label,shareBps])=>({label:text(label,64),shareBps}))};
}
function imageUrl(value) {
  try {
    const url = new URL(text(value, 2048).replace(/^ipfs:\/\/(?:ipfs\/)?/i, 'https://pump.mypinata.cloud/ipfs/'));
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}
export function buildLaunchDirectory(attempts = []) {
  const totals=new Map(buildLaunchEarnings(Array.isArray(attempts)?attempts:[],[],{scope:'all'}).coins.map(c=>[c.mint,c]));
  const seen = new Set(), rows = [];
  for (const attempt of [...(Array.isArray(attempts) ? attempts : [])].reverse()) {
    const mint = text(attempt?.tokenMint, 64);
    if (String(attempt?.status || '').toUpperCase() !== 'COMPLETE' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint) || seen.has(mint)) continue;
    seen.add(mint);
    const metadata = attempt.metadataJson || {};
    const date = Date.parse(attempt.completedAt || attempt.createdAt || '');
    rows.push({
      mint, name: text(attempt.tokenName || attempt.name || metadata.name, 64),
      symbol: text(attempt.symbol || attempt.ticker || metadata.symbol, 16),
      description: text(metadata.description, 180),
      imageUrl: [attempt.imageUri, attempt.imageUrl, metadata.image, metadata.imageUrl].map(imageUrl).find(Boolean) || '',
      createdAt: Number.isFinite(date) ? new Date(date).toISOString() : '',
      origin: attempt.origin === 'connected' ? 'connected' : 'launched',
      recordedPaidLamports:totals.get(mint)?.totalPaidLamports??null,
      earningsPartial:totals.get(mint)?.partial??true,
      ...feeSplit(attempt),
      rewardMode: attempt.launchUtility?.mode === 'holder_alliance' ? 'holder_alliance' : attempt.launchUtility?.mode === 'alliance' ? 'alliance' : attempt.launchUtility?.mode === 'usepaid' ? 'external' : attempt.pumpCashback ? 'cashback' : attempt.holderRewards?.enabled ? 'holders' : 'creator'
    });
  }
  return rows.sort((a, b) => (Date.parse(b.createdAt) || 0) - (Date.parse(a.createdAt) || 0)).slice(0, 90);
}
export function createLaunchDirectoryReader(readAttempts, { now = Date.now, ttlMs = 60_000 } = {}) {
  let value, expires = 0, pending;
  return async function readDirectory() {
    if (value && now() < expires) return value;
    if (!pending) pending = Promise.resolve().then(readAttempts).then(store => {
      value = buildLaunchDirectory(store?.attempts); expires = now() + ttlMs; return value;
    }).finally(() => { pending = null; });
    return pending;
  };
}
