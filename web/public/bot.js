(function(){
  'use strict';
  // Optional convenience only. Content and Telegram links work without JS.
  const status=document.getElementById('copy-status');
  document.querySelectorAll('[data-copy-command]').forEach(code=>{
    const command=code.textContent.trim(),button=document.createElement('button');
    button.type='button';button.className='copy-command';button.textContent='Copy';button.setAttribute('aria-label','Copy '+command);
    button.addEventListener('click',async()=>{
      try{await navigator.clipboard.writeText(command);status.textContent='Copied '+command+(command.includes('CA')?' — replace CA with the full coin address.':'. Paste it in Telegram when ready.');}
      catch{status.textContent='Copy unavailable. Select and copy this command: '+command;}
    });
    code.parentElement.appendChild(button);
  });
})();
