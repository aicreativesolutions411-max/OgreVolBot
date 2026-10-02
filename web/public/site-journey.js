(function(root){
  'use strict';
  function safeReturn(value){
    if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return '';
    try{const u=new URL(value,'https://app.slimewire.org');
      if(u.origin!=='https://app.slimewire.org'||!['/launch/community','/launch/earnings','/launch/build'].includes(u.pathname))return '';
      if([...u.searchParams.keys()].some(k=>!['mint','coin','agreement','project'].includes(k)))return '';
      if(u.hash&&!['#connect','#partners','#inbox','#goals'].includes(u.hash))return '';
      return u.pathname+u.search+u.hash;
    }catch{return '';}
  }
  function readiness({name='',symbol='',splitError=''}={}){
    return [
      {label:'Coin name & ticker',state:name.trim()&&symbol.trim()?'ready':'fix',detail:name.trim()&&symbol.trim()?'Added to this draft':'Add a name and ticker'},
      {label:'Fee allocation',state:splitError?'fix':'ready',detail:splitError||'100% allocated · review every destination'},
      {label:'Artwork & creator wallet',state:'review',detail:'Choose and verify in the next step'},
      {label:'Funding, fees & bundle participants',state:'review',detail:'Live checks in the final review; invite approvals are separate'},
      {label:'Authority & transaction simulation',state:'review',detail:'Checked server-side before you confirm; not approved by this draft'}
    ];
  }
  root.SlimeJourney={safeReturn,readiness};
  if(!root.document)return;
  const ret=safeReturn(new URLSearchParams(root.location.search).get('returnTo'));
  if(ret){const notice=document.createElement('aside');notice.className='sw-return-notice';const copy=document.createElement('span');copy.textContent='Finish signing in, then return to your saved launch setup.';const link=document.createElement('a');link.href=ret;link.textContent='Back to launch setup →';notice.append(copy,link);(document.querySelector('.fun-main')||document.body).prepend(notice);}
  document.addEventListener('click',event=>{if(!event.target.closest('.sw-more'))document.querySelectorAll('.sw-more[open]').forEach(d=>d.open=false);});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')document.querySelectorAll('.sw-more[open]').forEach(d=>{d.open=false;d.querySelector('summary')?.focus();});});
})(typeof window==='undefined'?globalThis:window);
