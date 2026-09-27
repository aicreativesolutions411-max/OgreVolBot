(function(root){
  'use strict';
  function externalChart(mint,chain){
    mint=String(mint||'').trim();
    if(/^0x[\da-f]{40}$/i.test(mint))return (!chain||chain==='robinhood')?'https://dexscreener.com/robinhood/'+mint:'';
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)&&(!chain||chain==='solana')?'https://dexscreener.com/solana/'+mint:'';
  }
  function legacyTarget({pathname='',search='',hash=''}={}){
    const q=new URLSearchParams(search);
    // Never intercept wallet, terminal, launch, invite, login or buy actions.
    // Extra parameters may carry intent: unknown parameters fail closed.
    if([...q.keys()].some(k=>!['ca','token','source','chain'].includes(k)))return '';
    if(['/', '/index.html','/gg','/gg.html'].includes(pathname)){
      const m=hash.match(/^#(trade|rhtrade)\/([^/?#]+)$/);
      if(m)return externalChart(m[2],m[1]==='rhtrade'?'robinhood':'solana');
    }
    if(['/fun','/fun/','/fun.html'].includes(pathname)&&q.get('source')==='telegram'&&!hash)return externalChart(q.get('ca')||q.get('token'),q.get('chain'));
    return '';
  }
  root.SlimeChartLinks={externalChart,legacyTarget};
  if(root.location&&root.top===root.self){const next=legacyTarget(root.location);if(next){root.__slimeExternalChartRedirect=next;root.location.replace(next);}}
})(window);
