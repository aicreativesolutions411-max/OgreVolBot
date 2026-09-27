// Pump standard creator claims are wallet-wide. An automatic coin must never
// sweep another coin's explicitly manual fees from the same creator wallet.
export function hasManualCreatorFees(attempts,userId,wallet){
  return (attempts||[]).some(a=>String(a.userId)===String(userId)&&a.devWalletPublicKey===wallet
    &&String(a.rail||'pump').toLowerCase()==='pump'&&a.creatorFeeClaimMode==='manual'
    &&!a.launchUtility?.mode?.match(/^(alliance|holder_alliance|usepaid)$/)&&!a.holderRewards?.enabled&&!a.pumpCashback
    &&['complete','confirmed','submitted','launched'].includes(String(a.status||'').toLowerCase()));
}
