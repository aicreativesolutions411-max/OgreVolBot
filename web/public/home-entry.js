(function(root){
  'use strict';
  function legacyDestination({pathname='',search='',hash=''}={}){
    if(!['/','/home','/home.html','/index.html'].includes(pathname))return '';
    const params=new URLSearchParams(search);
    const oldHash=hash&&!['#products','#claim'].includes(hash);
    // Keep all legacy intent intact (invites, launch drafts and signed login
    // handoffs). Only marketing/referral-only entries belong on the new home.
    const oldQuery=[...params.keys()].some(key=>key!=='ref'&&!/^utm_[a-z_]+$/i.test(key));
    return oldHash||oldQuery?'/terminal'+search+hash:'';
  }
  root.SlimeHomeEntry={legacyDestination};
  if(root.location&&!root.__slimeExternalChartRedirect){
    const target=legacyDestination(root.location);
    if(target)root.location.replace(target);
  }
})(typeof window!=='undefined'?window:globalThis);
