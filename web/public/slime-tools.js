(function(root){
  'use strict';
  const items=[
    {title:'Launch Rehearsal',group:'Launch',hint:'Preview a fee plan without spending SOL',href:'/launch/rehearsal',words:'preview simulate dry run percentages test launch plan'},
    {title:'Create a coin',group:'Launch',hint:'Pump launch · artwork, bundles and fee destinations',href:'/launch?mode=creator',words:'token mint deploy bundle invite'},
    {title:'Slime Build',group:'Launch',hint:'Milestones, delivery evidence and creator-reported progress',href:'/launch/build',words:'project game roadmap build work funding development'},
    {title:'Earnings & receipts',group:'Launch',hint:'Recorded payouts, reserves and per-coin totals',href:'/launch/earnings',words:'fees revenue proof transaction history rewards claim'},
    {title:'Rewards inbox',group:'Launch',hint:'Your recorded community credits and receipts',href:'/launch/community#inbox',words:'holder reward payout earned sol'},
    {title:'Connect an existing coin',group:'Launch',hint:'Review creator-fee routing without a new launch',href:'/launch/community#connect',words:'ca old migrate fee split'},
    {title:'Community partnerships',group:'Launch',hint:'Creator agreements and their exact terms',href:'/launch/community#partners',words:'partner alliance another community'},
    {title:'Project funding targets',group:'Launch',hint:'Public expense targets · not escrow',href:'/launch/community#goals',words:'fund money project budget treasury'},
    {title:'Slime Flows',group:'Launch',hint:'Drafts and simulations · activation requires validation',href:'/launch/flows',words:'automation schedule fees cadence'},
    {title:'Wallet',group:'Wallet',hint:'Holdings, transfers, balances and wallet tools',href:'/wallet',words:'send receive fund deposit withdraw holdings backup sweep bundle sell all wallets presets'},
    {title:'Manage, fund & sweep wallets',group:'Wallet',hint:'Open wallet manager · review every transfer separately',href:'/wallet?tool=wallets',words:'backup restore export sweep consolidate send sell all wallets fund balance'},
    {title:'Multi-wallet trading',group:'Wallet',hint:'Open bundle controls · choose a coin and review first',href:'/wallet?tool=bundle',words:'bundle buy sell all batch wallets'},
    {title:'Trading presets',group:'Wallet',hint:'Review saved amounts, take-profit ladders and stop loss',href:'/wallet?tool=presets',words:'preset auto exits take profit stop loss ladder amounts'},
    {title:'Wallet activity',group:'Wallet',hint:'Check transaction outcomes before retrying',href:'/wallet?tab=activity',words:'pending failed receipt buy sell stuck history transaction'},
    {title:'Wallet backup & recovery',group:'Wallet',hint:'Understand recovery before funding a wallet',href:'/help#recovery',words:'backup secret key export restore recovery safety'},
    {title:'Terminal',group:'Terminal',hint:'Charts, research, orders and trade review',href:'/terminal?desktop=1',words:'trade buy sell limit orders take profit stop loss preset chart indicators candlestick'},
    {title:'Telegram toolkit',group:'Telegram',hint:'Scan, private trading, buy posts and group tools',href:'/bot',words:'scan buybot raidbot rose moderation captcha commands bot'},
    {title:'Slime Games',group:'Discover',hint:'Left4Sol · trailer, Steam and play links',href:'/games',words:'zombie gaming left4sol steam'},
    {title:'Contact SlimeWire',group:'Help',hint:'Support, project ideas and collaborations',href:'/contact',words:'support help bug contact human team'},
    {title:'Fees & wallet safety',group:'Help',hint:'Costs, managed-wallet custody and trading risks',href:'/help#fees',words:'security fees custody price risk help'}
  ];
  function search(query='',group='All'){const terms=String(query).toLowerCase().trim().split(/\s+/).filter(Boolean);return items.filter(i=>(group==='All'||i.group===group)&&terms.every(t=>(i.title+' '+i.hint+' '+i.words).toLowerCase().includes(t)));}
  root.SlimeTools={items,search};if(!root.document)return;
  if(document.body.classList.contains('fun-launch-embed')||document.body.classList.contains('fun-tool-embed'))return;
  const host=document.querySelector('[data-sw-product-nav]')||document.querySelector('.product-nav');if(!host)return;
  const button=document.createElement('button');button.type='button';button.className='sw-find-tool';button.setAttribute('aria-label','Find a SlimeWire tool');button.innerHTML='<span aria-hidden="true">⌕</span><span>Tools</span><kbd>Ctrl K</kbd>';host.appendChild(button);
  const dialog=document.createElement('dialog');dialog.className='sw-tool-dialog';dialog.setAttribute('aria-labelledby','sw-tools-title');dialog.innerHTML='<header><div><small>ONE HOME. EVERY TOOL.</small><h2 id="sw-tools-title">What would you like to do?</h2></div><button type="button" aria-label="Close tool finder">×</button></header><label for="sw-tools-search">Search tools, not coin prices</label><input id="sw-tools-search" type="search" autocomplete="off" placeholder="Try fees, backup, bundle, stop loss…"><div class="sw-tool-filters" role="group" aria-label="Filter tools"></div><p class="sw-tool-count" role="status" aria-live="polite"></p><div class="sw-tool-results"></div><footer>Opening a tool never places a trade, launches a coin, or moves funds.</footer>';document.body.appendChild(dialog);
  const input=dialog.querySelector('input'),results=dialog.querySelector('.sw-tool-results'),count=dialog.querySelector('.sw-tool-count');let group='All',focus=null;
  function render(){const rows=search(input.value,group);results.replaceChildren();count.textContent=rows.length+' tools';for(const item of rows){const a=document.createElement('a'),copy=document.createElement('span'),title=document.createElement('b'),hint=document.createElement('small'),tag=document.createElement('em');a.href=item.href;title.textContent=item.title;hint.textContent=item.hint;tag.textContent=item.group+' ↗';copy.append(title,hint);a.append(copy,tag);results.appendChild(a);}if(!rows.length){const p=document.createElement('p');p.textContent='No match. Try fewer words, or open Help from the menu.';results.appendChild(p);}dialog.querySelectorAll('[data-tool-group]').forEach(b=>b.setAttribute('aria-pressed',String(group===b.dataset.toolGroup)));}
  for(const name of ['All','Launch','Wallet','Terminal','Telegram']){const b=document.createElement('button');b.type='button';b.textContent=name;b.dataset.toolGroup=name;b.onclick=()=>{group=name;render();};dialog.querySelector('.sw-tool-filters').appendChild(b);}
  function open(){if(document.querySelector('dialog[open]'))return;focus=document.activeElement;group='All';input.value='';render();dialog.showModal();input.focus();}
  button.onclick=open;dialog.querySelector('header>button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>focus?.focus?.());input.oninput=render;
  input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();results.querySelector('a')?.focus();}else if(e.key==='Enter'){e.preventDefault();results.querySelector('a')?.click();}});
  results.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp'].includes(e.key))return;const rows=[...results.querySelectorAll('a')],i=rows.indexOf(document.activeElement);if(i<0)return;e.preventDefault();if(e.key==='ArrowUp'&&i===0)input.focus();else rows[Math.max(0,Math.min(rows.length-1,i+(e.key==='ArrowDown'?1:-1)))]?.focus();});
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!e.altKey){if(document.querySelector('dialog[open]'))return;e.preventDefault();open();}});
})(typeof window==='undefined'?globalThis:window);
