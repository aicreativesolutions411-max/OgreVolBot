import { normalizeHolderAlliance, holderLiabilities, HOLDER_VAULT_RESERVE } from './holderAlliance.js';

// Read-only prerequisites, not an approval, transaction simulation or audit.
// Adapters return public account data only; this module never handles keys.
export async function checkFlowReadiness(attempt, {enabled=false,readRuntime,readChain,readSnapshots,now=Date.now}) {
  if(attempt?.status!=='COMPLETE'||attempt.launchUtility?.mode!=='holder_alliance'||attempt.pumpFeeSharing?.status!=='ACTIVE'||!attempt.pumpFeeSharing.vaultAddress)throw Error('Choose an active managed rewards coin first.');
  const policy=normalizeHolderAlliance(attempt.launchUtility),checks=[];
  const add=(id,label,state,detail)=>checks.push({id,label,state,detail});
  const started=now();
  add('release','Production validation',enabled?'pass':'blocked',enabled?'Operator release gate enabled; this check is not a security audit.':'Funded validation and security review are still required. This check cannot enable the release gate.');
  let runtime={};
  try{runtime=await readRuntime(attempt);}catch{/* fail closed without exposing provider errors */}
  for(const [id,key,label,good,bad] of [
    ['runner','runner','Reward runner','Server reward runner is started.','Server reward runner is unavailable.'],
    ['lock','lock','Distributed safety lock','Shared safety lock acquired and released.','Shared safety lock is unavailable or busy.'],
    ['creator_key','creatorKey','Creator wallet record','Original creator wallet has a stored encrypted signing record; decryptability is not tested.','Restore the original creator wallet signing record.'],
    ['vault_key','vaultKey','Rewards vault record','Dedicated vault has a stored encrypted signing record; decryptability is not tested.','Restore the dedicated rewards vault signing record.']
  ])add(id,label,runtime?.[key]===true?'pass':'blocked',runtime?.[key]===true?good:bad);
  const pending=!!(attempt.holderAllianceLedger?.pending||attempt.allianceDistribution?.pending||attempt.holderAllianceLedger?.retryRows);
  add('pending','Saved transactions',pending?'blocked':'pass',pending?'A saved transaction or retry batch needs reconciliation. Do not create a replacement.':'No saved transaction or retry batch is pending.');
  add('pause','Coin-level payouts',attempt.allianceDistribution?.automaticPaused===true?'blocked':'pass',attempt.allianceDistribution?.automaticPaused===true?'Coin distribution is paused. Review its settings before resuming.':'Coin distribution is not paused. Program activation remains separate.');
  let balances=null;
  try{
    const chain=await readChain(attempt,policy);
    const amount=value=>{if(!/^\d+$/.test(String(value)))throw Error('Invalid balance');return BigInt(value);};
    if(!Number.isSafeInteger(chain.slot)||chain.slot<=0)throw Error('Invalid finalized context');
    const vault=amount(chain.vaultLamports),creator=amount(chain.creatorLamports),liabilities=holderLiabilities(attempt.holderAllianceLedger||{});
    if(liabilities<0n)throw Error('Invalid liabilities');
    const unreserved=vault-liabilities-HOLDER_VAULT_RESERVE;
    balances={slot:chain.slot,vaultLamports:String(vault),creatorLamports:String(creator),savedLiabilitiesLamports:String(liabilities),reserveLamports:String(HOLDER_VAULT_RESERVE),unreservedLamports:String(unreserved>0n?unreserved:0n)};
    add('chain','Finalized chain data','pass','Read finalized account state; no transaction was constructed.');
    add('configuration','Permanent fee split',chain.configMatches===true?'pass':'blocked',chain.configMatches===true?'On-chain fee configuration matches the saved creator, vault and percentages.':'The on-chain fee configuration does not match the saved program.');
    add('accounts','SOL account ownership',chain.accountsValid===true?'pass':'blocked',chain.accountsValid===true?'Creator and vault are compatible native SOL accounts.':'Creator or vault account ownership is incompatible.');
    add('vault','Saved rewards coverage',unreserved>=0n?'pass':'blocked',unreserved>=0n?'Vault covers saved liabilities and its reserve.':'Vault is below saved liabilities plus its reserve. No new allocation is safe.');
    add('network_fees','Payout network fees',creator>=3100000n?'pass':'blocked',creator>=3100000n?'Creator has the 0.003 SOL reserve plus the 0.0001 SOL per-batch fee ceiling. Actual fees are checked again before sending.':'Creator needs at least 0.0031 SOL for the reserve and one bounded payout batch.');
    const minimum=amount(attempt.slimeFlow?.draft?.minimumLamports||attempt.slimeFlow?.approved?.program?.minimumLamports||'1000000');
    add('funding','New allocation funding',unreserved>=minimum?'pass':'waiting',unreserved>=minimum?'Unreserved vault SOL meets the selected minimum.':'Fees are accumulating below the selected minimum. This does not authorize funding or collection.');
  }catch{add('chain','Finalized chain data','unknown','Chain data could not be verified. Check the read provider and saved ledger; no balance is assumed to be zero.');}
  if(policy.ownHolderShareBps||policy.partnerHolderShareBps){
    try{
      const snapshots=await readSnapshots(attempt,policy),names=[...(policy.ownHolderShareBps?['own']:[]),...(policy.partnerHolderShareBps?['partner']:[])];
      for(const name of names){const s=snapshots?.[name];if(!s||!Array.isArray(s.holders)||!Number.isSafeInteger(s.slot)||s.slot<=0||!Number.isFinite(s.capturedAt)||now()-s.capturedAt>60000||s.capturedAt>now()+1000)throw Error('Incomplete snapshot');}
      add('holders','Complete holder snapshots','pass',names.map(name=>`${name==='own'?'Own':'Partner'} community: ${snapshots[name].holders.length} eligible wallets at slot ${snapshots[name].slot}`).join(' · ')+'. This check does not save or allocate the snapshot.');
    }catch{add('holders','Complete holder snapshots','unknown','A complete, fresh holder list and usable USD price could not be verified. Rewards must remain reserved; partial holder lists are not used.');}
  }else add('holders','Holder snapshots','pass','No community-holder allocation is configured; no holder request was made.');
  return {readOnly:true,ready:checks.every(c=>c.state==='pass'),fundedValidationPerformed:false,checkedAt:new Date(started).toISOString(),checks,balances,note:'Point-in-time prerequisites only. No collection, signing, submission, approval or release setting was changed. Conditions are rechecked during execution.'};
}
