import { feeSetupSubmissionDisposition } from './launchUtilityRecovery.js';

// Call under a durable per-launch lock. No browser state or wallet-wide fee
// estimate can authorize this operation. Keep signed bytes private in storage.
export async function settleLaunchAlliance({load,save,prepare,connection,now=()=>new Date().toISOString()}) {
  let state=await load()||{};
  const complete=async()=>{
    const receipt={signature:state.pending.signature,confirmedAt:now()};
    const receipts=[...(state.receipts||[])];
    if(!receipts.some(row=>row.signature===receipt.signature))receipts.push(receipt);
    const next={...state,status:'CONFIRMED',lastSignature:receipt.signature,lastConfirmedAt:receipt.confirmedAt,receipts,pending:null,lastError:''};
    await save(next);state=next;return state;
  };
  if(state.pending?.signature){
    const disposition=await feeSetupSubmissionDisposition({setupSignature:state.pending.signature,setupLastValidBlockHeight:state.pending.lastValidBlockHeight},connection);
    if(['confirmed','finalized'].includes(disposition.reason))return complete();
    if(!disposition.rebuild)return {...state,status:'PENDING'};
    state={...state,pending:null,status:'RETRYABLE',lastError:disposition.reason};
    await save(state);
  }
  const signed=await prepare();
  if(!signed){state={...state,status:'ACCUMULATING',lastCheckedAt:now(),lastError:''};await save(state);return state;}
  if(!signed.signature||!signed.rawBase64||!Number.isSafeInteger(signed.lastValidBlockHeight))throw new Error('Invalid signed Alliance distribution. Nothing broadcast.');
  state={...state,status:'PENDING',pending:{...signed,submittedAt:now()},lastCheckedAt:now(),lastError:''};
  await save(state); // Must finish before broadcast; a failed save spends nothing.
  try{
    const actual=await connection.sendRawTransaction(Buffer.from(signed.rawBase64,'base64'),{skipPreflight:false,maxRetries:3});
    if(actual!==signed.signature)throw new Error('RPC signature differs from the saved Alliance distribution.');
    const result=await connection.confirmTransaction({signature:signed.signature,blockhash:signed.blockhash,lastValidBlockHeight:signed.lastValidBlockHeight},'confirmed');
    if(!result?.value||result.value.err)throw new Error('Alliance distribution needs on-chain reconciliation.');
    return await complete();
  }catch(error){
    state={...state,status:'PENDING',lastError:String(error?.message||error).slice(0,220)};
    await save(state);
    return state;
  }
}

export function publicAllianceSettlement(state={}){
  return {status:state.status||'NOT_DISTRIBUTED',signature:state.pending?.signature||state.lastSignature||'',lastConfirmedAt:state.lastConfirmedAt||'',lastCheckedAt:state.lastCheckedAt||'',error:state.lastError||'',receipts:(state.receipts||[]).slice(-20).map(row=>({signature:row.signature,confirmedAt:row.confirmedAt})),receiptCount:(state.receipts||[]).length};
}
