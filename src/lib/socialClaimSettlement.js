import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { PublicKey } from '@solana/web3.js';
import { HOLDER_MIN_PAYOUT } from './holderAlliance.js';
import { feeSetupSubmissionDisposition } from './launchUtilityRecovery.js';
import { retainEarningsHistory } from './launchEarningsHistory.js';
export function socialDestination(value){
  let key;try{key=new PublicKey(String(value||'').trim());}catch{throw new Error('Paste a valid Solana receiving wallet.');}
  if(!PublicKey.isOnCurve(key.toBytes())||key.equals(PublicKey.default)||key.toBase58()==='1nc1nerator11111111111111111111111111111111111')throw new Error('Use a normal Solana wallet, not a token, program or burn address.');
  return key.toBase58();
}
export function createSocialClaimTickets({secret,now=Date.now}){
  const sign=b=>createHmac('sha256',String(secret)).update('slime-social-claim:'+b).digest('base64url');
  return {
    review(attempt,xUserId,wallet){
      wallet=socialDestination(wallet);
      if([attempt.tokenMint,attempt.pumpFeeSharing?.vaultAddress].includes(wallet))throw new Error('Choose your receiving wallet, not the coin or rewards vault.');
      if(!(attempt.launchUtility?.socialRecipients||[]).some(r=>r.xUserId===xUserId))throw new Error('This X account has no allocation on that coin.');
      if(attempt.status!=='COMPLETE'||attempt.pumpFeeSharing?.status!=='ACTIVE')throw new Error('This fee program is not active.');
      const lamports=String(attempt.holderAllianceLedger?.socialCredits?.[xUserId]||'0');
      if(BigInt(lamports)<HOLDER_MIN_PAYOUT)throw new Error('At least 0.001 SOL in allocated fees is required. Smaller balances stay reserved.');
      if(attempt.holderAllianceLedger?.socialPending)throw new Error('A claim is already being reconciled for this coin. Check its receipt first.');
      const intent={id:randomUUID(),attemptId:attempt.id,mint:attempt.tokenMint,xUserId,wallet,lamports,expiresAt:now()+300000};
      const b=Buffer.from(JSON.stringify(intent)).toString('base64url');return {...intent,ticket:b+'.'+sign(b)};
    },
    verify(ticket,xUserId){
      if(typeof ticket!=='string'||ticket.length>2000)throw new Error('Review this claim again.');
      const [b,s,...extra]=ticket.split('.'),a=Buffer.from(sign(b||'')),z=Buffer.from(s||'');
      if(extra.length||a.length!==z.length||!timingSafeEqual(a,z))throw new Error('Claim details changed. Review again.');
      let intent;try{intent=JSON.parse(Buffer.from(b,'base64url').toString('utf8'));}catch{throw new Error('Invalid claim review.');}
      if(intent.xUserId!==xUserId||intent.expiresAt<=now())throw new Error('Claim review expired or belongs to another X account.');
      return intent;
    }
  };
}

// Same durable per-mint lock as holder settlement. Reconcile pending payments
// even while disabled; only an explicit reviewed claim may create a transaction.
export async function settleSocialClaim({load,save,prepare,connection,intent=null,enabled=false,now=()=>new Date().toISOString()}){
  let s=await load()||{};
  const persist=async next=>{await save(next);s=next;return s;};
  const complete=async()=>{
    const p=s.socialPending,owed=BigInt(s.socialCredits?.[p.xUserId]||0),amount=BigInt(p.lamports);
    if(amount>owed||amount<=0n)throw new Error('Claim exceeds its saved X liability. Reconciliation required.');
    const source='x:'+p.xUserId,receipt={kind:'x_claim',claimId:p.id,xUserId:p.xUserId,signature:p.signature,confirmedAt:now(),lamports:p.lamports,recipients:1,bySource:{[source]:p.lamports},payments:[{wallet:p.wallet,lamports:p.lamports}]};
    const history=retainEarningsHistory(s,'holder',now());
    return persist({...history,socialPending:null,socialLastError:'',socialCredits:{...s.socialCredits,[p.xUserId]:String(owed-amount)},
      paidBySource:{...s.paidBySource,[source]:String(BigInt(s.paidBySource?.[source]||0)+amount)},
      paidByWallet:{...s.paidByWallet,[p.wallet]:String(BigInt(s.paidByWallet?.[p.wallet]||0)+amount)},
      paidLamports:String(BigInt(s.paidLamports||0)+amount),receiptCount:(s.receiptCount||0)+1,
      receipts:[...(s.receipts||[]),receipt].slice(-100)});
  };
  if(s.socialPending){
    const p=s.socialPending;
    const recon={getBlockHeight:(...args)=>connection.getBlockHeight(...args),getSignatureStatus:async(...args)=>{const r=await connection.getSignatureStatus(...args);return r?.value?.err&&r.value.confirmationStatus!=='finalized'?{...r,value:{...r.value,err:null}}:r;}};
    const d=await feeSetupSubmissionDisposition({setupSignature:p.signature,setupLastValidBlockHeight:p.lastValidBlockHeight},recon);
    if(d.reason==='finalized')return complete();
    if(!d.rebuild)return s;
    await persist({...s,socialPending:null,socialLastError:'The previous transaction did not finalize successfully. Your fees remain reserved. Review a new claim.',socialFailedAttempts:[...(s.socialFailedAttempts||[]),{id:p.id,signature:p.signature,reason:d.reason,at:now()}].slice(-100)});
    // Never silently replace a signed transaction, including during retries.
    return s;
  }
  if(!intent)return s;
  if(!enabled)throw new Error('New X claims are disabled pending validation. Fees remain reserved.');
  if(s.pending||s.retryRows)throw new Error('A rewards payout is being reconciled. Please try shortly.');
  // A ticket can only claim the exact reviewed balance. A completed old ticket
  // cannot drain newly accrued funds after its receipt rotates out of the tail.
  if(s.socialClaimIds?.[intent.id])return s;
  if(BigInt(intent.lamports)<HOLDER_MIN_PAYOUT||String(s.socialCredits?.[intent.xUserId]||'0')!==intent.lamports)throw new Error('Your allocated balance changed. Review the claim again.');
  const signed=await prepare([{wallet:socialDestination(intent.wallet),lamports:intent.lamports}]);
  if(!signed?.signature||!signed.rawBase64||!Number.isSafeInteger(signed.lastValidBlockHeight))throw new Error('Invalid signed claim. Nothing was sent.');
  const timestamp=now(),cutoff=Date.parse(timestamp)-86400000;
  const ids=Object.fromEntries(Object.entries(s.socialClaimIds||{}).filter(([,at])=>Date.parse(at)>cutoff));
  await persist({...s,socialClaimIds:{...ids,[intent.id]:timestamp},socialPending:{...intent,...signed,submittedAt:timestamp},socialLastError:''});
  try{
    const sig=await connection.sendRawTransaction(Buffer.from(signed.rawBase64,'base64'),{skipPreflight:false,maxRetries:3});
    if(sig!==signed.signature)throw new Error('Claim signature mismatch. Waiting for reconciliation.');
    const r=await connection.confirmTransaction({signature:signed.signature,blockhash:signed.blockhash,lastValidBlockHeight:signed.lastValidBlockHeight},'finalized');
    if(!r?.value||r.value.err)throw new Error('Claim confirmation is pending. Do not send another claim.');
  }catch{await persist({...s,socialLastError:'Transaction submitted; confirmation is pending. Your balance remains reserved until reconciliation.'});return s;}
  return complete();
}

export function socialClaimDashboard(attempts,xUserId){
  const coins=[];let reserved=0n,paid=0n,pending=0n;
  for(const a of attempts){
    const recipient=a.launchUtility?.socialRecipients?.find(r=>r.xUserId===xUserId);
    if(!recipient||a.status!=='COMPLETE')continue;
    const l=a.holderAllianceLedger||{},owed=String(l.socialCredits?.[xUserId]||'0'),received=String(l.paidBySource?.['x:'+xUserId]||'0'),p=l.socialPending?.xUserId===xUserId?l.socialPending:null;
    reserved+=BigInt(owed);paid+=BigInt(received);if(p)pending+=BigInt(p.lamports);
    coins.push({id:a.id,mint:a.tokenMint,name:String(a.tokenName||a.name||a.metadataJson?.name||'').slice(0,64),symbol:String(a.symbol||a.ticker||a.metadataJson?.symbol||'').slice(0,16),handle:recipient.handle,shareBps:recipient.shareBps,
      reservedLamports:owed,paidLamports:received,active:a.pumpFeeSharing?.status==='ACTIVE',paused:a.allianceDistribution?.automaticPaused===true,
      pending:p?{signature:p.signature,wallet:p.wallet,lamports:p.lamports}:null,
      receipts:(l.receipts||[]).filter(r=>r.kind==='x_claim'&&r.xUserId===xUserId).slice(-10).map(r=>({signature:r.signature,lamports:r.lamports,confirmedAt:r.confirmedAt,wallet:r.payments?.[0]?.wallet})),
      error:l.socialLastError||''});
  }
  return {reservedLamports:String(reserved),paidLamports:String(paid),pendingLamports:String(pending),coins};
}
