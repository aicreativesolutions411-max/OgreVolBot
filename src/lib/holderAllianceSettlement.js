import { feeSetupSubmissionDisposition } from './launchUtilityRecovery.js';
import { HOLDER_MIN_PAYOUT } from './holderAlliance.js';

// Caller owns a durable per-mint lock. A saved allocation is a liability, never
// reweighted on retry. Finalization is required before balance-based allocation.
export async function settleHolderBatch({load,save,prepare,connection,paused=false,now=()=>new Date().toISOString()}){
  let state=await load()||{};
  const complete=async()=>{
    const credits={...(state.credits||{})};let paid=0n;
    for(const row of state.pending.rows){const value=BigInt(row.lamports),owed=BigInt(credits[row.wallet]||0);if(value>owed)throw new Error('Holder payout exceeds saved liability.');if(value===owed)delete credits[row.wallet];else credits[row.wallet]=String(owed-value);paid+=value;}
    const receipt={signature:state.pending.signature,confirmedAt:now(),lamports:String(paid),recipients:state.pending.rows.length};
    state={...state,credits,pending:null,retryRows:null,paidLamports:String(BigInt(state.paidLamports||0)+paid),receiptCount:(state.receiptCount||0)+1,receipts:[...(state.receipts||[]),receipt].slice(-100),status:'PAID',lastError:''};
    await save(state);return state;
  };
  if(state.pending){
    const reconciliationConnection={
      getBlockHeight: (...args)=>connection.getBlockHeight(...args),
      getSignatureStatus: async (...args)=>{
        const response=await connection.getSignatureStatus(...args);
        // An error on a non-finalized fork does not yet authorize a replacement.
        return response?.value?.err && response.value.confirmationStatus!=='finalized'
          ? {...response,value:{...response.value,err:null}} : response;
      }
    };
    const d=await feeSetupSubmissionDisposition({setupSignature:state.pending.signature,setupLastValidBlockHeight:state.pending.lastValidBlockHeight},reconciliationConnection);
    if(d.reason==='finalized')return complete();
    if(!d.rebuild)return state;
    state={...state,retryRows:state.pending.rows,pending:null,status:'RETRYABLE'};await save(state);
  }
  if(paused)return state;
  const rows=state.retryRows||Object.entries(state.credits||{}).filter(([,amount])=>BigInt(amount)>=HOLDER_MIN_PAYOUT).sort(([a],[b])=>a.localeCompare(b,'en')).slice(0,8).map(([wallet,lamports])=>({wallet,lamports}));
  if(!rows.length)return state;
  const signed=await prepare(rows);
  if(!signed?.signature||!signed.rawBase64||!Number.isSafeInteger(signed.lastValidBlockHeight))throw new Error('Invalid signed holder payout. Nothing sent.');
  state={...state,status:'PENDING',pending:{...signed,rows,submittedAt:now()},lastError:''};
  await save(state);
  try{
    const actual=await connection.sendRawTransaction(Buffer.from(signed.rawBase64,'base64'),{skipPreflight:false,maxRetries:3});
    if(actual!==signed.signature)throw new Error('Payout signature mismatch; reconciliation required.');
    const result=await connection.confirmTransaction({signature:signed.signature,blockhash:signed.blockhash,lastValidBlockHeight:signed.lastValidBlockHeight},'finalized');
    if(!result?.value||result.value.err)throw new Error('Payout awaiting reconciliation.');
  }catch(error){state={...state,lastError:String(error.message||error).slice(0,220)};await save(state);return state;}
  // Persistence errors propagate; do not replace an already-finalized intent.
  return complete();
}
