import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyLaunchSiteDesign, designSurface } from '../scripts/lib/launch-site-design.js';

const read = name => readFileSync(new URL('../web/public/' + name, import.meta.url), 'utf8');

test('launch design covers only launch pages, not the wallet app or main site', () => {
  for (const name of ['launch-on-slimewire-guide.html', 'launch-os-guide.html', 'memecoin-launch-tools.html']) assert.equal(designSurface(name), 'public');
  for (const name of ['prelaunch.html', 'launch-os.html', 'launch-hq.html', 'partner-rewards.html', 'trend-launch.html']) assert.equal(designSurface(name), 'tool');
  assert.equal(designSurface('fun.html'), null);
  assert.equal(designSurface('cash/index.html'), null);
  assert.equal(designSurface('gg.html'), 'terminal');
  for (const name of ['features.html', 'pricing.html', 'community.html', 'blog/crypto-telegram-bot-stack/index.html', 'chart-lab.html', 'widget.html', 'old.html', 'swamp.html', 'Ogreverse/index.html', 'coin-site.html']) assert.equal(designSurface(name), null);
});

test('shared navigation is static, accessible and offers Wallet, launches and preserved terminal', () => {
  const html = applyLaunchSiteDesign(read('launch-on-slimewire-guide.html'), 'launch-on-slimewire-guide.html');
  assert.match(html, /data-sw-surface="public"/);
  assert.match(html, /launch-site\.css\?v=/);
  assert.match(html, /aria-label="SlimeWire navigation"/);
  for (const href of ['/wallet', '/launch', '/terminal', '/launch#mine']) assert.ok(html.includes('href="' + href + '"'));
  assert.equal((html.match(/data-sw-navigation/g) || []).length, 1);
  assert.equal(applyLaunchSiteDesign(html, 'launch-on-slimewire-guide.html'), html, 'decoration is idempotent');
});

test('app restyling preserves every existing script, ID, form control and hidden consent state', () => {
  for (const name of ['index.html', 'gg.html', 'launch-os.html', 'prelaunch.html', 'trend-launch.html', 'partner-rewards.html']) {
    const original = read(name), themed = applyLaunchSiteDesign(original, name);
    for (const script of original.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) || []) assert.ok(themed.includes(script), `${name}: script preserved`);
    for (const tag of original.match(/<(?:input|select|textarea|button)\b[^>]*>/gi) || []) assert.ok(themed.includes(tag), `${name}: control preserved`);
    for (const id of original.matchAll(/\bid="([^"]+)"/g)) assert.ok(themed.includes(id[0]), `${name}: ${id[1]} preserved`);
    assert.ok(themed.includes('href="/wallet"'), `${name}: top Wallet link`);
    assert.ok(themed.includes('href="/launch"'), `${name}: top Launch link`);
    assert.match(themed, /launch-site\.css/);
  }
  assert.equal(applyLaunchSiteDesign(read('index.html'), 'index.html'), applyLaunchSiteDesign(read('gg.html'), 'gg.html'));
});

test('wallet, main informational, chart and game pages are byte-for-byte unchanged', () => {
  for (const name of ['fun.html', 'cash/index.html', 'features.html', 'community.html', 'chart-lab.html', 'old.html', 'swamp.html', 'coin-site.html']) assert.equal(applyLaunchSiteDesign(read(name), name), read(name));
});

test('launch theme keeps warnings, mobile access and reduced motion without fetching user data', () => {
  const css = read('launch-site.css');
  assert.match(css, /liquid-obsidian-v1\.webp/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /focus-visible/);
  assert.match(css, /\.fun-launch-embed/);
  assert.match(css, /:has\(#v-launch\.on\)/, 'terminal theme only activates on its launch view');
  assert.ok(!css.includes('.wallet-only'), 'no wallet app restyling');
  assert.ok(!css.includes('content: "Buy"'));
  assert.ok(!css.includes('canvas{display:none'));
});
