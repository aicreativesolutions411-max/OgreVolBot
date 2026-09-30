import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { applySiteBranding } from '../scripts/lib/site-branding.js';
import { productNavigation } from '../scripts/lib/product-navigation.js';
import { launchSiteNavigation } from '../scripts/lib/launch-site-design.js';
const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');

test('contact is an accessible, direct Telegram handoff with no signup or wallet access', () => {
  const html = read('web/public/contact.html');
  assert.match(html, /<h1[^>]*>Let’s build/);
  assert.match(html, /href="https:\/\/t\.me\/degenme420"[^>]*rel="noopener noreferrer"/);
  assert.match(html, /@degenme420/);
  for (const text of ['Project', 'Game', 'Feedback', 'private keys', 'login codes']) assert.ok(html.includes(text), text);
  assert.match(html, /href="#contact-main"/);
  for (const href of ['/wallet', '/terminal?desktop=1', '/launch', '/bot', '/help']) assert.ok(html.includes('href="' + href + '"'));
  assert.doesNotMatch(html, /<form\b|<iframe\b|config\.js|app\.js|fun\.js|sendTransaction|connectWallet|fetch\(/);
});

test('contact can be found from home, product menus and help without moving existing products', () => {
  const home = read('web/public/home.html');
  assert.match(home, /class="home-contact"/);
  assert.match(home, /href="\/contact"/);
  assert.match(productNavigation('wallet'), /href="\/contact"/);
  assert.match(launchSiteNavigation, /href="\/contact"/);
  for (const name of ['help.html', 'bot.html', 'games.html']) assert.match(read('web/public/' + name), /href="\/contact"/, name);
  assert.match(read('src/index.js'), /\["\/contact", "\/contact\/", "\/contact.html"\]\.includes\(requestUrl.pathname\)/);
  assert.match(read('web/public/sitemap.xml'), /https:\/\/slimewire.org\/contact/);
});

test('contact has matching branded metadata and lightweight original artwork', () => {
  const source = read('web/public/contact.html');
  const html = applySiteBranding(source, 'contact.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/slimewire.org\/contact">/);
  assert.match(html, /og:title" content="SlimeWire — Contact &amp; collaborations"/);
  assert.match(html, /slimewire-share-20260929/);
  assert.doesNotMatch(html, /login-hero/);
  assert.match(source, /contact-forge-v1.webp/);
  assert.match(read('web/public/home.html'), /contact-forge-v1.webp[^>]+loading="lazy"/);
  const css = read('web/public/contact.css');
  assert.match(css, /@media/);
  assert.match(css, /prefers-reduced-motion/);
  assert.ok(statSync(new URL('../web/public/assets/slimewire/home/contact-forge-v1.webp', import.meta.url)).size < 160_000);
});
