export const SOCIAL_FEE_CONSENT_VERSION='2026-09-29-x-claims-v1';
// Deliberate code-level release hold: configuration alone cannot enable custody.
// Remove only after independent review and recorded funded end-to-end validation.
export const SOCIAL_CLAIMS_RELEASE_READY=false;
export function socialClaimCapabilities(env=process.env){
  let callback=false;
  try{const u=new URL(env.SLIME_X_CALLBACK_URL);callback=u.protocol==='https:'&&u.hostname==='app.slimewire.org'&&u.pathname==='/api/web/social-claims/callback'&&!u.search&&!u.hash&&!u.username&&!u.password&&!u.port;}catch{}
  const identityProvider=String(env.SLIME_SOCIAL_IDENTITY_PROVIDER||'x').trim().toLowerCase();
  const credentials=identityProvider==='x'?!!(env.SLIME_X_CLIENT_ID&&env.SLIME_X_CLIENT_SECRET):identityProvider==='privy'?/^[A-Za-z0-9_-]{8,100}$/.test(env.SLIME_PRIVY_APP_ID||''):false;
  const identityConfigured=!!(credentials&&String(env.SLIME_X_SESSION_SECRET||'').length>=32&&callback);
  const arbitraryRecipientLookup=identityConfigured&&!!env.SLIME_X_APP_BEARER_TOKEN;
  const recipientLookup=arbitraryRecipientLookup?'official-x':identityConfigured&&identityProvider==='privy'?'verified-only':'unavailable';
  const lookupConfigured=recipientLookup!=='unavailable';
  return {identityProvider,identityConfigured,lookupConfigured,recipientLookup,arbitraryRecipientLookup,available:SOCIAL_CLAIMS_RELEASE_READY&&lookupConfigured,
    recipientHelp:recipientLookup==='verified-only'?'Without an X lookup API, only accounts freshly verified on SlimeWire can be selected. Ask the recipient to sign in on the claim page before reviewing the launch. Unknown handles cannot receive allocations.':'Recipient profiles must resolve to a verified permanent X account ID before a launch.',
    consentVersion:SOCIAL_FEE_CONSENT_VERSION,asset:'SOL',minimumLamports:'1000000',
    reason:!identityConfigured?(identityProvider==='privy'?'Hosted X sign-in is awaiting SlimeWire’s Privy setup. No fees can be routed here yet.':'X sign-in is awaiting SlimeWire’s identity setup. No fees can be routed here yet.'):!lookupConfigured?'X profile verification is awaiting setup. New X fee allocations are disabled.':'X claims are awaiting security review and funded validation. New allocations and payments remain disabled.'};
}
export function normalizeSocialRecipients(input){
  if(input===undefined)return [];
  if(!Array.isArray(input)||input.length>5)throw new Error('Use at most five X recipients.');
  const ids=new Set(),handles=new Set();
  return input.map(row=>{
    const handle=String(row?.handle||'').trim().replace(/^@/,''),xUserId=String(row?.xUserId||'');
    const shareBps=Number(row?.shareBps);
    if(!/^[A-Za-z0-9_]{1,15}$/.test(handle))throw new Error('Enter a valid X handle, not a URL.');
    if(xUserId&&!/^[1-9][0-9]{0,24}$/.test(xUserId))throw new Error('Invalid X account identity. Verify the profile again.');
    if(!Number.isSafeInteger(shareBps)||shareBps<100||shareBps>9900||shareBps%100)throw new Error('Each X recipient needs a whole percentage from 1% to 99%.');
    if(handles.has(handle.toLowerCase())||xUserId&&ids.has(xUserId))throw new Error('Duplicate X recipient. Combine its percentage into one row.');
    handles.add(handle.toLowerCase());if(xUserId)ids.add(xUserId);
    return {handle,xUserId,shareBps,name:String(row?.name||'').slice(0,80),profileProof:String(row?.profileProof||'').slice(0,1800)};
  });
}
