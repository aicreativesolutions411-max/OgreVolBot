(function(){
  'use strict';
  const dialog=document.getElementById('claim-dialog');
  document.querySelectorAll('[data-claim-open]').forEach(link=>{
    link.addEventListener('click',event=>{
      if(!dialog||typeof dialog.showModal!=='function')return;
      event.preventDefault();
      dialog.showModal();
    });
  });
  if(dialog)dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  });
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
