// Durable, append-only accounting saved with the same finalized payout state.
// Never authorizes a transfer, reads an RPC, or stores signing material.
export const lamports = value => /^\d+$/.test(String(value ?? '')) ? BigInt(value) : 0n;
const date = value => Number.isFinite(Date.parse(value || '')) ? new Date(value).toISOString() : '';

function event(row, kind) {
  if (!row?.signature || (kind === 'collection' && row.accountingStatus !== 'verified')) return null;
  const payments = (row.payments || []).filter(p => p.wallet && lamports(p.lamports) > 0n)
    .map(p => ({wallet:String(p.wallet),lamports:String(lamports(p.lamports))}));
  return {signature:String(row.signature),confirmedAt:date(row.confirmedAt),
    totalLamports:String(row.totalLamports != null ? lamports(row.totalLamports) : row.lamports != null ? lamports(row.lamports) : payments.reduce((n,p)=>n+lamports(p.lamports),0n)),
    payments,bySource:Object.fromEntries(Object.entries(row.bySource || {}).map(([k,v])=>[k,String(lamports(v))]))};
}

export function earningsEvents(state = {}, kind) {
  const events = new Map();
  for (const row of state.earningsHistory?.events || []) {
    const e = event({...row,accountingStatus:'verified'},kind);
    if (e) events.set(e.signature,e);
  }
  for (const row of state.receipts || []) {
    const e = event(row,kind);
    if (e && !events.has(e.signature)) events.set(e.signature,e);
  }
  return [...events.values()];
}

export function retainEarningsHistory(state = {}, kind, now = new Date().toISOString()) {
  const events = earningsEvents(state,kind), paidByWallet = {}, paidBySource = {};
  let total = 0n;
  for (const e of events) {
    total += lamports(e.totalLamports);
    for (const p of e.payments) paidByWallet[p.wallet] = String(lamports(paidByWallet[p.wallet])+lamports(p.lamports));
    for (const [source,n] of Object.entries(e.bySource)) paidBySource[source] = String(lamports(paidBySource[source])+lamports(n));
  }
  const missing = kind === 'holder' && (Number(state.receiptCount || 0) > events.length || lamports(state.paidLamports) > total);
  return {...state,earningsHistory:{version:1,startedAt:state.earningsHistory?.startedAt || now,
    incomplete:state.earningsHistory?.incomplete === true || missing,
    totalLamports:String(total),paidByWallet,paidBySource,events}};
}
