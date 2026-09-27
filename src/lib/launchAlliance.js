import { PublicKey } from '@solana/web3.js';

export const ALLIANCE_CONSENT_VERSION = '2026-09-27-alliance-v1';
function invalid(message) { const error=new Error(message); error.statusCode=400; error.code='LAUNCH_ALLIANCE_INVALID'; throw error; }
export function normalizeLaunchAlliance(input={}) {
  let partner;
  try { partner=new PublicKey(String(input.partnerWallet||'').trim()); }
  catch { invalid('Enter a valid Solana community wallet.'); }
  if(partner.equals(PublicKey.default)||!PublicKey.isOnCurve(partner.toBytes()))invalid('The community wallet must be an ordinary Solana wallet, not a program or burn address.');
  const share=Number(input.partnerShareBps);
  if(!Number.isSafeInteger(share)||share<=0||share>=10000)invalid('Community fee share must be greater than 0% and less than 100%, in whole basis points.');
  return {version:1,mode:'alliance',partnerWallet:partner.toBase58(),partnerName:String(input.partnerName||'Community wallet').trim().slice(0,64),partnerShareBps:share,autoDistribute:input.autoDistribute===true,consentVersion:String(input.consentVersion||'')};
}
export function allianceShareholders(input,creator) {
  const policy=normalizeLaunchAlliance(input),address=creator instanceof PublicKey?creator:new PublicKey(creator);
  const partner=new PublicKey(policy.partnerWallet);
  if(address.equals(partner))invalid('Choose a community wallet different from the creator wallet.');
  return [{address,shareBps:10000-policy.partnerShareBps},{address:partner,shareBps:policy.partnerShareBps}];
}
export function allianceConfigMatches(config,input,creator) {
  if(!config?.finalized||config.shareholders?.length!==2)return false;
  const expected=allianceShareholders(input,creator);
  return expected.every(row=>config.shareholders.some(actual=>actual.address?.equals?.(row.address)&&actual.shareBps===row.shareBps));
}
