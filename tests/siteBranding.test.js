import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { applySiteBranding, BRAND_MARK, SHARE_IMAGE } from '../scripts/lib/site-branding.js';
const read = name => readFileSync(new URL('../web/public/' + name, import.meta.url), 'utf8');
test('production build applies crawler-visible branding after site navigation', () => {
  const build = readFileSync(new URL('../scripts/build-web.js', import.meta.url), 'utf8');
  assert.match(build, /applySiteBranding\(applyProductNavigation/);
});
test('home preview is present in initial HTML, with one canonical and one card', () => {
  const html = applySiteBranding(read('home.html'), 'home.html');
  assert.match(html, /og:title" content="SlimeWire — One home\. Every move\./);
  assert.ok(html.includes(SHARE_IMAGE));
  for (const tag of ['og:image', 'og:title', 'twitter:card', 'twitter:image']) assert.equal(html.split(`="${tag}"`).length - 1, 1, tag);
  assert.equal(html.split('rel="canonical"').length - 1, 1);
  assert.ok(html.includes(BRAND_MARK));
  assert.doesNotMatch(html, /auto\/login-hero/);
  assert.equal(applySiteBranding(html, 'home.html'), html);
});
test('terminal and bot metadata never advertise the old login artwork', () => {
  for (const name of ['index.html', 'gg.html', 'bot.html', 'launch.html', 'help.html', 'fun.html']) {
    const html = applySiteBranding(read(name), name);
    const tags = html.match(/<meta\b[^>]*>/g).join('\n');
    assert.ok(tags.includes(SHARE_IMAGE), name);
    assert.doesNotMatch(tags, /auto\/login-hero|Solana Memecoin Terminal/i, name);
  }
});
test('game artwork and coin-specific social metadata are not replaced', () => {
  const game = applySiteBranding(read('games.html'), 'games.html');
  assert.match(game, /og:image" content="https:\/\/slimewire.org\/assets\/slimewire\/games\/left4sol-capsule.jpg/);
  const token = '<html><head><meta property="og:image" content="https://example.com/coin.png"></head><body></body></html>';
  assert.equal(applySiteBranding(token, 't.html'), token);
});

test('legacy guide previews use the new card without replacing content images', () => {
  const source = read('add-slimewire-bot-to-telegram-group.html');
  const html = applySiteBranding(source, 'add-slimewire-bot-to-telegram-group.html');
  const tags = html.match(/<meta\b[^>]*>/g).join('\n');
  assert.ok(tags.includes(SHARE_IMAGE));
  assert.doesNotMatch(tags, /login-hero/);
  assert.match(tags, /og:image:width" content="1734"/);
  assert.match(tags, /og:image:height" content="907"/);
});

test('social image ships as a real PNG under 5MB with matching dimensions', () => {
  const file = new URL('../web/public' + new URL(SHARE_IMAGE).pathname, import.meta.url);
  const png = readFileSync(file);
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), 1734);
  assert.equal(png.readUInt32BE(20), 907);
  assert.ok(statSync(file).size < 5_000_000);
  const logo = readFileSync(new URL('../web/public' + BRAND_MARK, import.meta.url));
  assert.equal(logo.readUInt16BE(0), 0xffd8);
});
