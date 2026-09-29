import { PublicKey } from '@solana/web3.js';
import { splitRecipients, HOLDER_CADENCE_MS, holderLiabilities } from './holderAlliance.js';
import { earningsEvents, lamports as amount } from './launchEarningsHistory.js';

const clean=(v,n=64)=>String(v||'').slice(0,n);
const sum=rows=>rows.reduce((s,v)=>s+amount(v),0n);
const maximum=(a,b)=>a>b?a:b;
const firstDate=dates=>dates.filter(v=>Number.isFinite(Date.parse(v||''))).sort((a,b)=>Date.parse(a)-Date.parse(b))[0]||'';
export const EARNINGS_PERIODS=Object.freeze({all:null,'24h':86400000,'7d':7*86400000,'30d':30*86400000});

// Saved accounting only. No RPC polling, claims, transfers, or wallet balance estimates.
// Public aggregates include all completed launches, not the 90-row discovery feed.
export function buildLaunchEarnings(attempts=[],wallets=[],{scope='mine',period='all',now=Date.now()}={}) {
  if(!Object.hasOwn(EARNINGS_PERIODS,period))throw Error('Choose a supported earnings period.');
  if(!['mine','all'].includes(scope))throw Error('Choose an earnings view.');
  if(scope==='mine'&&(!wallets.length||wallets.length>25))throw Error('Select between 1 and 25 wallets.');
  const keys=new Set(scope==='all'?[]:wallets.map(v=>{const k=new PublicKey(v);if(k.equals(PublicKey.default)||!PublicKey.isOnCurve(k.toBytes()))throw Error('Use a normal Solana wallet.');return k.toBase58();}));
  const cutoff=period==='all'?null:now-EARNINGS_PERIODS[period];
  const inPeriod=e=>cutoff===null||(Number.isFinite(Date.parse(e.confirmedAt))&&Date.parse(e.confirmedAt)>=cutoff&&Date.parse(e.confirmedAt)<=now);
  const coins=[],seen=new Set();let paid=0n,reserved=0n,collected=0n,developer=0n,community=0n,recipient=0n,unattributed=0n,incomplete=false;
  for(const a of [...attempts].reverse()) {
    if(a.status!=='COMPLETE'||!a.tokenMint||seen.has(a.tokenMint))continue;
    seen.add(a.tokenMint);
    const p=a.launchUtility||{},l=a.holderAllianceLedger||{},distribution=a.allianceDistribution||{},roles=new Set();
    const holder=p.mode==='holder_alliance',tracked=holder||p.mode==='alliance';
    if(keys.has(a.devWalletPublicKey))roles.add('Developer');
    if(splitRecipients(p).some(r=>keys.has(r.wallet))||keys.has(p.partnerWallet))roles.add('Receiving wallet');
    for(const side of ['own','partner'])if((l.lastEligibility?.[side]||[]).some(w=>keys.has(w)))roles.add(side==='own'?'Own-community holder':'Partner-community holder');
    const collections=tracked?earningsEvents(distribution,'collection'):[],rewards=holder?earningsEvents(l,'holder'):[];
    const directRows=e=>e.payments.filter(r=>r.wallet===a.devWalletPublicKey||(p.mode==='alliance'&&r.wallet===p.partnerWallet));
    const allDirect=sum(collections.flatMap(e=>directRows(e).map(r=>r.lamports)));
    const allHolder=holder?maximum(amount(l.paidLamports),sum(rewards.map(e=>e.totalLamports))):0n;
    const totalPaid=tracked?allDirect+allHolder:null;
    const eventWallets=events=>sum(events.flatMap(e=>e.payments.filter(r=>keys.has(r.wallet)).map(r=>r.lamports)));
    const walletHolder=holder?(l.paidByWallet?sum([...keys].map(w=>l.paidByWallet[w])):eventWallets(rewards)):0n;
    const walletOwed=holder?sum([...keys].map(w=>l.credits?.[w])):0n;
    if(walletHolder||walletOwed)roles.add('Rewards recipient');
    const walletDirect=sum(collections.flatMap(e=>directRows(e).filter(r=>keys.has(r.wallet)).map(r=>r.lamports)));
    if(scope==='mine'&&!roles.size&&!walletDirect&&!walletHolder&&!walletOwed)continue;

    const selectedCollections=collections.filter(inPeriod),selectedRewards=rewards.filter(inPeriod);
    const globalDirect=sum(selectedCollections.flatMap(e=>directRows(e).map(r=>r.lamports)));
    const globalHolder=cutoff===null?allHolder:sum(selectedRewards.map(e=>e.totalLamports));
    const coinPaid=scope==='all'?globalDirect+globalHolder:sum(selectedCollections.flatMap(e=>directRows(e).filter(r=>keys.has(r.wallet)).map(r=>r.lamports)))+(cutoff===null?walletHolder:eventWallets(selectedRewards));
    const coinReserved=holder?(scope==='all'?holderLiabilities(l):walletOwed):0n;
    const collectionTotal=sum(selectedCollections.map(e=>e.totalLamports));
    const devPaid=sum(selectedCollections.flatMap(e=>directRows(e).filter(r=>r.wallet===a.devWalletPublicKey&&(scope==='all'||keys.has(r.wallet))).map(r=>r.lamports)));
    const sourceEvents=cutoff===null?rewards:selectedRewards,sourceKeys=[...new Set(sourceEvents.flatMap(e=>Object.keys(e.bySource)))];
    const sourcePaid=(cutoff===null&&(l.paidBySource||l.earningsHistory?.paidBySource))||Object.fromEntries(sourceKeys.map(k=>[k,String(sum(sourceEvents.map(e=>e.bySource[k])))]));
    const communityPaid=scope==='all'?amount(sourcePaid.own)+amount(sourcePaid.partner):0n;
    const holderRecipientPaid=scope==='all'?(cutoff===null?sum(Object.entries(sourcePaid).filter(([k])=>!['own','partner','unattributed'].includes(k)).map(([,v])=>v)):sum(selectedRewards.flatMap(e=>Object.entries(e.bySource).filter(([k])=>!['own','partner','unattributed'].includes(k)).map(([,v])=>v)))):0n;
    const directRecipientPaid=scope==='all'?globalDirect-devPaid:coinPaid-devPaid-(cutoff===null?walletHolder:eventWallets(selectedRewards));
    const recipientPaid=directRecipientPaid+holderRecipientPaid;
    const unknownPaid=scope==='all'?maximum(0n,coinPaid-devPaid-communityPaid-recipientPaid):0n;
    const rewardHistoryTotal=sum(rewards.map(e=>e.totalLamports));
    const historyGap=holder&&(l.earningsHistory?.incomplete===true||Number(l.receiptCount||0)>rewards.length||allHolder>rewardHistoryTotal||rewards.some(e=>!e.payments.length));
    const accountingPending=(distribution.receipts||[]).some(r=>r.accountingStatus!=='verified');
    const datesMissing=[...collections,...rewards].some(e=>!e.confirmedAt);
    const partial=!tracked||accountingPending||historyGap||(cutoff!==null&&datesMissing);
    const receipts=[];
    for(const e of selectedCollections) {
      const n=sum(directRows(e).filter(r=>scope==='all'||keys.has(r.wallet)).map(r=>r.lamports));
      if(n)receipts.push({signature:clean(e.signature,100),lamports:String(n),confirmedAt:e.confirmedAt,kind:'Developer / wallet payment'});
    }
    for(const e of selectedRewards) {
      const n=scope==='all'?amount(e.totalLamports):sum(e.payments.filter(r=>keys.has(r.wallet)).map(r=>r.lamports));
      if(n)receipts.push({signature:clean(e.signature,100),lamports:String(n),confirmedAt:e.confirmedAt,kind:'Community / wallet reward'});
    }
    const createdAt=clean(a.completedAt||a.createdAt,40);
    paid+=coinPaid;reserved+=coinReserved;collected+=collectionTotal;developer+=devPaid;community+=communityPaid;recipient+=recipientPaid;unattributed+=unknownPaid;incomplete||=partial;
    coins.push({mint:clean(a.tokenMint),name:clean(a.tokenName||a.name||a.metadataJson?.name),symbol:clean(a.symbol||a.ticker||a.metadataJson?.symbol,16),imageUrl:clean(a.imageUri||a.imageUrl||a.metadataJson?.image,2048),createdAt,roles:[...roles],
      paidLamports:tracked?String(coinPaid):null,totalPaidLamports:totalPaid===null?null:String(totalPaid),collectedLamports:tracked?String(collectionTotal):null,reservedLamports:holder?String(coinReserved):null,claimableLamports:null,partial,
      trackedSince:firstDate([...collections,...rewards].map(e=>e.confirmedAt).concat(partial?[]:[createdAt])),
      automatic:holder&&distribution.automaticPaused!==true,paused:distribution.automaticPaused===true,delayed:!!(a.holderLastError||l.lastError),status:clean(a.pumpFeeSharing?.status||'ACCRUING',40),
      nextSnapshotAt:l.lastSnapshotAt?new Date(Number(l.lastSnapshotAt)+HOLDER_CADENCE_MS).toISOString():'',
      receiptCount:receipts.length,receipts:receipts.sort((x,y)=>(Date.parse(y.confirmedAt)||0)-(Date.parse(x.confirmedAt)||0)).slice(0,100)});
  }
  return {asset:'SOL',scope,period,asOf:new Date(now).toISOString(),wallets:[...keys],paidLamports:String(paid),reservedLamports:String(reserved),collectedLamports:String(collected),
    developerPaidLamports:String(developer),communityPaidLamports:String(community),recipientPaidLamports:String(recipient),unattributedPaidLamports:String(unattributed),
    claimableLamports:null,incomplete,trackedSince:firstDate(coins.map(c=>c.trackedSince)),coins,unknownCoins:coins.filter(c=>c.paidLamports===null).length,
    note:'Verified recorded payments only. Collected fees include vault funding; paid totals count only final recipients. Pending rewards are current unpaid allocations, not claimable balances. Standard creator claims are wallet-wide; check Wallet. Missing older history and uncollected fees are not estimated.'};
}
