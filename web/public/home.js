(function(){
  'use strict';
  // Carry referral attribution into the selected product, without preloading
  // an account, polling balances or moving authentication data between pages.
  const ref=new URLSearchParams(location.search).get('ref');
  if(ref&&/^[a-zA-Z0-9_-]{1,100}$/.test(ref)){
    document.querySelectorAll('a[href^="/"]').forEach(link=>{
      const url=new URL(link.getAttribute('href'),location.origin);
      if(url.pathname==='/')return;
      url.searchParams.set('ref',ref);
      link.href=url.pathname+url.search+url.hash;
    });
  }
})();
