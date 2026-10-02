(function(root){
  'use strict';
  const clean=(v,n)=>String(v||'').trim().slice(0,n);
  function amount(v){const raw=String(v);if(!/^\d{1,7}(?:\.\d{1,9})?$/.test(raw))throw Error('Enter an example SOL amount with at most nine decimals.');const [a,b='']=raw.split('.'),n=BigInt(a)*1000000000n+BigInt(b.padEnd(9,'0'));if(n>1000000000000000n)throw Error('Use an example of at most 1,000,000 SOL.');return n;}
  function format(n){n=BigInt(n);return String(n/1000000000n)+(n%1000000000n?'.'+String(n%1000000000n).padStart(9,'0').replace(/0+$/,''):'');}
  function preview(input){
    const shares=['creator','own','partner','wallet'].map(k=>Number(input[k]));
    if(shares.some(n=>!Number.isInteger(n)||n<0||n>100)||shares[0]<1)throw Error('Use whole percentages and keep at least 1% for the developer.');
    if(shares.reduce((a,b)=>a+b,0)!==100)throw Error('Allocate exactly 100% of creator fees.');
    const total=amount(input.fees),labels=['Developer','My eligible holders','Other eligible community','Receiving SOL wallet'];
    const rows=shares.map((share,i)=>({label:labels[i],share,lamports:String(total*BigInt(share)/100n)})).filter(r=>r.share>0);
    return {totalLamports:String(total),rows,roundingLamports:String(total-rows.reduce((n,r)=>n+BigInt(r.lamports),0n))};
  }
  function draft(input){
    preview(input);
    const creator=Number(input.creator),own=Number(input.own),partner=Number(input.partner),wallet=Number(input.wallet);
    const mode=creator===100?'creator':partner===0&&wallet===0?'holder_self':'holder_alliance';
    return {version:1,name:clean(input.name,32),symbol:clean(input.symbol,10).replace(/[^a-z\d]/gi,''),description:'',mode,
      launchUtility:mode==='creator'?{mode}:{mode,creatorShareBps:creator*100,ownHolderShareBps:own*100,partnerHolderShareBps:partner*100,partnerMint:partner?clean(input.partnerMint,44):'',partnerName:'',recipientShareBps:wallet*100,recipients:wallet?[{wallet:clean(input.recipientWallet,44),shareBps:wallet*100,label:'Project / recipient wallet'}]:[]}};
  }
  root.SlimeRehearsal={preview,draft,format};if(!root.document?.getElementById('rehearsal-form'))return;
  const $=id=>document.getElementById('rehearsal-'+id),fields=['creator','own','partner','wallet'];
  function values(){return {...Object.fromEntries(fields.map(k=>[k,$(k).value])),fees:$('fees').value,name:$('name').value,symbol:$('symbol').value,partnerMint:$('partner-mint').value,recipientWallet:$('recipient').value};}
  function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
  function render(){
    $('title').textContent=$('name').value.trim()||'Your next idea';$('ticker').textContent='$'+($('symbol').value.trim()||'TICKER')+' · SOLANA / PUMP';
    $('partner-field').hidden=Number($('partner').value)<=0;$('recipient-field').hidden=Number($('wallet').value)<=0;
    try{const p=preview(values());$('total').textContent=format(p.totalLamports)+' SOL';$('routes').replaceChildren();
      for(const row of p.rows){const box=document.createElement('div');box.className='rehearsal-route';const head=document.createElement('div'),name=document.createElement('span'),value=document.createElement('strong'),note=document.createElement('small'),bar=document.createElement('i');name.textContent=row.label;value.textContent=row.share+'%';note.textContent=format(row.lamports)+' SOL in this example';bar.style.width=row.share+'%';head.append(name,value);box.append(head,note,bar);$('routes').appendChild(box);}
      $('rounding').textContent=p.roundingLamports!=='0'?format(p.roundingLamports)+' SOL is unallocated rounding in this simple example. Actual payouts also apply reserves, funding and eligibility checks.':'Percentages describe the creator-fee split, not the full trading fee.';status('100% allocated. Continue to setup to check destinations and availability.');
    }catch(e){$('total').textContent='Fix allocation';$('routes').replaceChildren();$('rounding').textContent='';status(e.message,true);}
  }
  function validatedDraft(){const t=draft(values()),error=root.SlimeLaunchUtility.draftError(t.launchUtility);if(error)throw Error(error);if(!t.name||! /^[a-z\d]{2,10}$/i.test(t.symbol))throw Error('Add a coin name and a 2–10 character alphanumeric ticker.');return t;}
  $('template').onchange=()=>{const plans={creator:[100,0,0,0],own:[20,80,0,0],shared:[20,40,40,0],build:[20,60,0,20]};fields.forEach((k,i)=>$(k).value=plans[$('template').value][i]);render();};
  $('form').addEventListener('input',render);
  $('form').onsubmit=e=>{e.preventDefault();try{const t=validatedDraft();location.assign('/launch?template='+encodeURIComponent(JSON.stringify(t)));}catch(e){status(e.message,true);}};
  $('save').onclick=()=>{try{const t=validatedDraft();localStorage.setItem('slimeLaunchTemplateV1',JSON.stringify(t));status('Saved on this device. Use Load saved draft in Create a coin. No spending wallet, approval, or example amount saved.');}catch(e){status(e.message,true);}};
  render();
})(typeof window==='undefined'?globalThis:window);
