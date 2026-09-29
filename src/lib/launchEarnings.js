import { PublicKey } from '@solana/web3.js';
import { splitRecipients, HOLDER_CADENCE_MS } from './holderAlliance.js';
const amount=v=>/^\d+$/.test(String(v??''))?BigInt(v):0n;
const clean=(v,n=64)=>String(v||'').slice(0,n);
// Saved finalized records only. This endpoint never polls wallets or claims fees.
export function buildLaunchEarnings(attempts=[],wallets=[]) {
  if(!wallets.length||wallets.length>25)throw new Error('Select between 1 and 25 wallets.');
  const keys=new Set(wallets.map(v=>{const k=new PublicKey(v);if(k.equals(PublicKey.default)||!PublicKey.isOnCurve(k.toBytes()))throw Error('Use a normal Solana wallet.');return k.toBase58();}));
  const coins=[],seen=new Set();let paid=0n,reserved=0n,incomplete=false;
  for(const a of [...attempts].reverse()){
    if(a.status!=='COMPLETE'||!a.tokenMint||seen.has(a.tokenMint))continue;seen.add(a.tokenMint);
    const p=a.launchUtility||{},l=a.holderAllianceLedger||{},roles=new Set(),receipts=[];
    const isCreator=keys.has(a.devWalletPublicKey),tracked=['alliance','holder_alliance'].includes(p.mode);
    if(isCreator)roles.add('Developer');
    if(splitRecipients(p).some(r=>keys.has(r.wallet))||keys.has(p.partnerWallet))roles.add('Receiving wallet');
    for(const side of ['own','partner'])if((l.lastEligibility?.[side]||[]).some(w=>keys.has(w)))roles.add(side==='own'?'Own-community holder':'Partner-community holder');
    let direct=0n,holderPaid=0n,owed=0n;
    for(const r of a.allianceDistribution?.receipts||[]){
      if(r.accountingStatus!=='verified')continue;
      const n=(r.payments||[]).filter(v=>keys.has(v.wallet)).reduce((s,v)=>s+amount(v.lamports),0n);
      if(n){direct+=n;receipts.push({signature:clean(r.signature,100),lamports:String(n),confirmedAt:clean(r.confirmedAt,40),kind:'Creator / recipient payment'});}
    }
    for(const r of l.receipts||[]){const n=(r.payments||[]).filter(v=>keys.has(v.wallet)).reduce((s,v)=>s+amount(v.lamports),0n);if(n){if(!l.paidByWallet)holderPaid+=n;receipts.push({signature:clean(r.signature,100),lamports:String(n),confirmedAt:clean(r.confirmedAt,40),kind:'Rewards payment'});}}
    for(const w of keys){owed+=amount(l.credits?.[w]);if(l.paidByWallet)holderPaid+=amount(l.paidByWallet[w]);}
    if(holderPaid||owed)roles.add('Rewards recipient');
    if(!roles.size&&!direct&&!holderPaid&&!owed)continue;
    const known=tracked||holderPaid>0n||owed>0n,n=direct+holderPaid;
    paid+=n;reserved+=owed;
    const partial=!tracked||(a.allianceDistribution?.receipts||[]).some(r=>r.accountingStatus!=='verified')||Number(l.receiptCount||0)>(l.receipts||[]).filter(r=>r.payments?.length).length;
    incomplete||=partial;
    coins.push({mint:clean(a.tokenMint),name:clean(a.tokenName||a.name||a.metadataJson?.name),symbol:clean(a.symbol||a.ticker||a.metadataJson?.symbol,16),imageUrl:clean(a.imageUri||a.imageUrl||a.metadataJson?.image,2048),roles:[...roles],paidLamports:known?String(n):null,reservedLamports:p.mode==='holder_alliance'?String(owed):null,claimableLamports:null,partial,
      automatic:p.mode==='holder_alliance'&&a.allianceDistribution?.automaticPaused!==true,paused:a.allianceDistribution?.automaticPaused===true,delayed:!!(a.holderLastError||l.lastError),status:clean(a.pumpFeeSharing?.status||'ACCRUING',40),nextSnapshotAt:l.lastSnapshotAt?new Date(l.lastSnapshotAt+HOLDER_CADENCE_MS).toISOString():'',
      receipts:receipts.sort((x,y)=>(Date.parse(y.confirmedAt)||0)-(Date.parse(x.confirmedAt)||0)).slice(0,20)});
  }
  return {asset:'SOL',wallets:[...keys],paidLamports:String(paid),reservedLamports:String(reserved),claimableLamports:null,incomplete,coins,note:'Verified recorded payments only, not guaranteed lifetime earnings. Historical receipts may be incomplete. Reserved rewards are already allocated but not paid or manually claimable. Creator claimable balances are wallet-wide; check them in Wallet. No estimate of uncollected fees is included.'};
}
