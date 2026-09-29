import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const read=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');

test('homepage prominently links the bot without losing existing products',()=>{
  const html=read('web/public/home.html');
  assert.match(html,/class="product-card telegram-card"/);
  assert.ok((html.match(/href="\/bot"/g)||[]).length>=2);
  for(const path of ['/wallet','/terminal?desktop=1','/launch'])assert.ok(html.includes('href="'+path+'"'));
});
test('bot guide contains real Telegram handoffs and progressive feature details',()=>{
  const html=read('web/public/bot.html');
  for(const url of ['https://t.me/SlimeWiredBot?start=menu','https://t.me/SlimeWiredBot?startgroup=setup','https://t.me/SlimeWiredBot?start=groupsettings'])assert.ok(html.includes('href="'+url+'"'),url);
  for(const id of ['features','get-started','commands','questions'])assert.ok(html.includes('id="'+id+'"'));
  for(const feature of ['Scan &amp; research','Trade in private','Buy Bot alerts','Raid tools','Rose moderation','Invite tracking','Wallets &amp; bundles','Launches &amp; rewards'])assert.ok(html.includes(feature),feature);
  assert.ok((html.match(/<details/g)||[]).length>=10);
  assert.match(html,/Illustrative preview/);
  assert.match(html,/15 minutes/);
  assert.match(html,/Robinhood.*Trade Pad/);
  assert.doesNotMatch(html,/organic-looking|ghost wallets|pad.*holder count|guaranteed profit|trade any token|no seed phrase to write down/i);
  assert.doesNotMatch(html,/<iframe|src="\/app.js|src="\/config.js/);
});
test('bot landing interactions cannot sign, preload accounts, or automatically trade',()=>{
  const js=read('web/public/bot.js');
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendTransaction|localStorage|\/api\/|setInterval/);
  assert.match(js,/clipboard\.writeText/);
  assert.match(js,/catch/);
  const css=read('web/public/bot.css');
  assert.match(css,/focus-visible/);assert.match(css,/@media/);assert.match(css,/prefers-reduced-motion/);
});
test('bot aliases work on the static host and existing origin route',()=>{
  const redirects=read('web/public/_redirects');
  for(const path of ['telegram-bot','solana-telegram-bot'])assert.match(redirects,new RegExp('^/'+path+'\\s+/bot\\s+200','m'));
  const server=read('src/index.js');
  assert.match(server,/\["\/solana-telegram-bot", "\/bot", "\/telegram-bot"\]/);
  assert.doesNotMatch(redirects,/^\/bot\s+\/bot(?:\.html)?\s+200/m);
});

test('Slime Games has a home entry and exact play, Steam and resolved DEX destinations',()=>{
  const home=read('web/public/home.html'),html=read('web/public/games.html');
  assert.match(home,/href="\/games">Slime Games/);
  for(const url of ['https://Left4sol.com','https://store.steampowered.com/app/5115660/Left4sol/','https://dexscreener.com/solana/4vw4olfgbttkwkn14bnvj44hpatjptzhbcjnmzjxxyee'])assert.ok(html.includes('href="'+url+'"'),url);
  assert.match(html,/Play Now/);assert.match(html,/View on Steam/);assert.match(html,/DEX Screener/);assert.match(html,/Coming soon on Steam/);
  assert.doesNotMatch(html,/<iframe|<canvas|src=".*(?:unity|loader)\.js|share\.google/);
  for(const image of ['left4sol-capsule.jpg','left4sol-gameplay.jpg'])assert.ok(html.includes(image));
  assert.match(read('src/index.js'),/\["\/games", "\/slime-games"\]/);
});

for(const clipboardWorks of [true,false])test('command copy '+(clipboardWorks?'copies exact text':'provides a manual fallback'),async()=>{
  const status={textContent:''},buttons=[],copied=[];
  const code={textContent:' /look CA ',parentElement:{appendChild:b=>buttons.push(b)}};
  const document={getElementById:id=>{assert.equal(id,'copy-status');return status;},querySelectorAll:()=>[code],createElement:()=>({setAttribute(k,v){this[k]=v;},addEventListener(k,fn){this[k]=fn;}})};
  vm.runInNewContext(read('web/public/bot.js'),{document,navigator:clipboardWorks?{clipboard:{writeText:async text=>copied.push(text)}}:{}});
  assert.equal(buttons.length,1);assert.equal(buttons[0]['aria-label'],'Copy /look CA');
  assert.deepEqual(copied,[],'page load must not touch the clipboard');
  await buttons[0].click();
  assert.match(status.textContent,clipboardWorks?/Copied \/look CA — replace CA/:/Copy unavailable.*\/look CA/);
  assert.deepEqual(copied,clipboardWorks?['/look CA']:[]);
});
