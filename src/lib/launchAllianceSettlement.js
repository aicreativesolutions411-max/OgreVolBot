import { feeSetupSubmissionDisposition } from './launchUtilityRecovery.js';
import { retainEarningsHistory } from './launchEarningsHistory.js';

// Call under a durable per-launch lock. No browser state or wallet-wide fee
// estimate can authorize this operation. Keep signed bytes private in storage.
export async function settleLaunchAlliance({load,save,prepare,connection,readReceipt,now=()=>new Date().toISOString()}) {
  let state=await load()||{};
  const persist=async value=>{const next=retainEarningsHistory(value,'collection',now());await save(next);return next;};
  const account=async receipt=>{
    if(!readReceipt)return receipt;
    try{return {...receipt,...await readReceipt(receipt.signature),accountingLastCheckedAt:now()};}catch{return {...receipt,accountingStatus:'pending',accountingLastCheckedAt:now()};}
  };
  // One bounded read per cycle retries missing receipt accounting without ever
  // resubmitting its payment. Older receipt-only history stays visibly partial.
  if(readReceipt){const next=(state.receipts||[]).filter(r=>r.accountingStatus!=='verified').sort((a,b)=>String(a.accountingLastCheckedAt||'').localeCompare(String(b.accountingLastCheckedAt||'')))[0];const i=next?(state.receipts||[]).indexOf(next):-1;if(i>=0){const receipts=[...state.receipts];receipts[i]=await account(receipts[i]);state=await persist({...state,receipts});}}
  const complete=async()=>{
    const receipt=await account({signature:state.pending.signature,confirmedAt:now()});
    const receipts=[...(state.receipts||[])];
    if(!receipts.some(row=>row.signature===receipt.signature))receipts.push(receipt);
    const next={...state,status:'CONFIRMED',lastSignature:receipt.signature,lastConfirmedAt:receipt.confirmedAt,receipts,pending:null,lastError:''};
    state=await persist(next);return state;
  };
  if(state.pending?.signature){
    const disposition=await feeSetupSubmissionDisposition({setupSignature:state.pending.signature,setupLastValidBlockHeight:state.pending.lastValidBlockHeight},connection);
    if(['confirmed','finalized'].includes(disposition.reason))return complete();
    if(!disposition.rebuild)return {...state,status:'PENDING'};
    state={...state,pending:null,status:'RETRYABLE',lastError:disposition.reason};
    state=await persist(state);
  }
  const signed=await prepare();
  if(!signed){state={...state,status:'ACCUMULATING',lastCheckedAt:now(),lastError:''};state=await persist(state);return state;}
  if(!signed.signature||!signed.rawBase64||!Number.isSafeInteger(signed.lastValidBlockHeight))throw new Error('Invalid signed Alliance distribution. Nothing broadcast.');
  state={...state,status:'PENDING',pending:{...signed,submittedAt:now()},lastCheckedAt:now(),lastError:''};
  state=await persist(state); // Must finish before broadcast; a failed save spends nothing.
  try{
    const actual=await connection.sendRawTransaction(Buffer.from(signed.rawBase64,'base64'),{skipPreflight:false,maxRetries:3});
    if(actual!==signed.signature)throw new Error('RPC signature differs from the saved Alliance distribution.');
    const result=await connection.confirmTransaction({signature:signed.signature,blockhash:signed.blockhash,lastValidBlockHeight:signed.lastValidBlockHeight},'confirmed');
    if(!result?.value||result.value.err)throw new Error('Alliance distribution needs on-chain reconciliation.');
    return await complete();
  }catch(error){
    state={...state,status:'PENDING',lastError:String(error?.message||error).slice(0,220)};
    state=await persist(state);
    return state;
  }
}

export function publicAllianceSettlement(state={}){
  return {status:state.status||'NOT_DISTRIBUTED',signature:state.pending?.signature||state.lastSignature||'',lastConfirmedAt:state.lastConfirmedAt||'',lastCheckedAt:state.lastCheckedAt||'',error:state.lastError||'',receipts:(state.receipts||[]).slice(-20).map(row=>({signature:row.signature,confirmedAt:row.confirmedAt,accountingStatus:row.accountingStatus||'unavailable',totalLamports:row.totalLamports??null})),receiptCount:(state.receipts||[]).length};
}
