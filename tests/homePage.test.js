import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('selected homepage is real accessible HTML with every product destination', () => {
  const html=read('web/public/home.html');
  assert.match(html, /One home\. <span>Every move\.<\/span>/);
  assert.doesNotMatch(html, /switchboard|slimewire\.com|Sign in with X/i);
  for(const link of ['/wallet','/terminal?desktop=1','/launch','/launch?mode=creator','/launch?mode=holder_self']) assert.ok(html.includes('href="'+link+'"'),link);
  assert.match(html, /<dialog[^>]+id="claim-dialog"/);
  assert.match(html, /Creator fees/);
  assert.match(html, /Holder rewards/);
  assert.doesNotMatch(html, /<iframe|app\.js|fun\.js|config\.js/);
});

test('homepage preserves old coin, launch, login and invite deep links', () => {
  const context=vm.createContext({URLSearchParams});
  vm.runInContext(read('web/public/home-entry.js'),context);
  const target=context.SlimeHomeEntry.legacyDestination;
  assert.equal(target({pathname:'/',search:'',hash:''}),'');
  assert.equal(target({pathname:'/',search:'?utm_source=tg&ref=abc',hash:''}),'');
  assert.equal(target({pathname:'/',search:'?from=fun',hash:'#launch'}),'/terminal?from=fun#launch');
  assert.equal(target({pathname:'/',search:'?bundleInvite=abc',hash:''}),'/terminal?bundleInvite=abc');
  assert.equal(target({pathname:'/',search:'?desktop=1',hash:'#portfolio'}),'/terminal?desktop=1#portfolio');
  assert.equal(target({pathname:'/',search:'?loginTicket=abc',hash:''}),'/terminal?loginTicket=abc');
  assert.equal(target({pathname:'/',search:'',hash:'#products'}),'');
  assert.equal(target({pathname:'/terminal',search:'',hash:'#launch'}),'');
  assert.ok(read('web/public/home.html').indexOf('chart-links.js') < read('web/public/home.html').indexOf('home-entry.js'), 'old chart links keep their exact DexScreener handling');
});

test('home has no account preload or money side effect and uses accessible controls', () => {
  const js=read('web/public/home.js');
  assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|sendTransaction|\/api\//);
  const css=read('web/public/home.css');
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/@media/);
  assert.match(read('web/public/home.html'),/Skip to products/);
});

test('Cloudflare and origin keep a separate terminal entry instead of replacing its source', () => {
  const redirects=read('web/public/_redirects');
  assert.match(redirects,/^\/\s+\/home\s+200/m);
  assert.doesNotMatch(redirects,/^\/terminal\s+\S+/m, 'Pages serves terminal.html natively; rewriting the extension-less path loops');
  assert.match(redirects,/^\/terminal\/\*\s+\/terminal\s+200/m);
  const build=read('scripts/build-web.js');
  assert.match(build,/copyFile\(path\.join\(distDir, "index\.html"\), path\.join\(distDir, "terminal\.html"\)\)/);
  const server=read('src/index.js');
  assert.match(server,/requestUrl\.pathname === "\/" \? "home\.html"/);
  const homeRoute=server.indexOf('["/", "/home", "/home.html"].includes(requestUrl.pathname)');
  const terminalRoute=server.indexOf('await serveStaticHtmlPage(response, "gg.html"');
  assert.ok(homeRoute>0 && homeRoute<terminalRoute, 'actual HTTP root routing must select home before the legacy terminal handler');
  assert.match(server.slice(homeRoute,homeRoute+260), /serveStaticHtmlPage\(response, "home.html", "no-store, max-age=0"\)/);
});

test('homepage and terminal cannot swap shells when offline', () => {
  const worker=read('web/public/sw.js');
  assert.match(worker,/slimewire-shell-v91-product-home/);
  assert.match(worker,/url\.pathname === "\/" \? "\/" : "\/terminal\?desktop=1"/);
  assert.match(worker,/status: 503/);
});

test('homepage preserves exact legacy query intent without creating an open redirect', () => {
  const context=vm.createContext({URLSearchParams});
  vm.runInContext(read('web/public/home-entry.js'),context);
  const target=context.SlimeHomeEntry.legacyDestination;
  assert.equal(target({pathname:'/',search:'?redirect=https%3A%2F%2Fevil.example&ref=abc',hash:'#launch'}),'/terminal?redirect=https%3A%2F%2Fevil.example&ref=abc#launch');
  assert.equal(target({pathname:'/',search:'?utm_source=tg',hash:'#trade/coin'}),'/terminal?utm_source=tg#trade/coin');
  assert.equal(target({pathname:'/',search:'?ref=abc',hash:'#claim'}),'');
});

test('launch product entry selects only a supported draft mode, without starting a launch', () => {
  const context=vm.createContext({URLSearchParams,window:{}});
  vm.runInContext(read('web/public/launch-pad.js'),context);
  const entry=context.window.SlimeLaunchPad.entryMode;
  assert.equal(entry('?mode=holder_self'),'holder_self');
  assert.equal(entry('?mode=creator'),'creator');
  assert.equal(entry('?mode=usepaid'),'');
  assert.equal(entry('?mode=bad'),'');
  assert.equal(entry(''),'');
  assert.match(read('web/public/launch-pad.js'),/if\(initialMode\)\{draft\.mode=initialMode;createDialog\(\);\}/);
});
