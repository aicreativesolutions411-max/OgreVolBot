import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { applyProductNavigation, productNavigation } from '../scripts/lib/product-navigation.js';
import { applyLaunchSiteDesign } from '../scripts/lib/launch-site-design.js';

const read = name => readFileSync(new URL('../web/public/' + name, import.meta.url), 'utf8');

test('every core product has one accessible Wallet / Terminal / Launch switcher', () => {
  for (const name of ['index.html', 'gg.html', 'fun.html', 'cash/index.html', 'launch.html', 'launch-community.html']) {
    const output = applyProductNavigation(applyLaunchSiteDesign(read(name), name), name);
    assert.match(output, /data-sw-product-nav/, name);
    assert.match(output, /href="\/wallet"[^>]*>Wallet<\/a>/, name);
    assert.match(output, /href="\/terminal\?desktop=1"[^>]*>Terminal<\/a>/, name);
    assert.match(output, /href="\/launch"[^>]*>Launch<\/a>/, name);
    assert.equal(applyProductNavigation(output, name), output, name + ' is idempotent');
    for (const tag of read(name).match(/<(?:input|select|textarea|button)\b[^>]*>/g) || []) assert.ok(output.includes(tag), name + ': existing controls preserved');
    for (const script of read(name).match(/<script\b[^>]*>[\s\S]*?<\/script>/g) || []) assert.ok(output.includes(script), name + ': existing scripts preserved');
  }
});

test('navigation is static and uses the explicit terminal URL even on mobile', () => {
  const nav = productNavigation('wallet');
  assert.match(nav, /href="\/wallet" aria-current="page"/);
  assert.match(nav, /href="\/terminal\?desktop=1"/);
  assert.ok(read('index.html').includes('q.get("desktop") === "1"'), 'explicit terminal opts out of automatic mobile redirect');
  assert.doesNotMatch(nav, /onclick|fetch\(|target=|<script/);
  assert.doesNotMatch(productNavigation('launch'), /X Money|claim/i, 'no unconfigured payment promise');
});

test('current product is accurate across shared Wallet/Go HTML and terminal launcher views', () => {
  const context = vm.createContext({});
  vm.runInContext(read('product-navigation.js'), context);
  const current = context.SlimeProductNavigation.currentProduct;
  assert.equal(current('/wallet'), 'Wallet');
  assert.equal(current('/wallet.html'), 'Wallet');
  assert.equal(current('/cash/'), 'Wallet');
  assert.equal(current('/fun'), '');
  assert.equal(current('/terminal'), 'Terminal');
  assert.equal(current('/terminal', '#launch'), 'Launch');
  assert.equal(current('/launch/community'), 'Launch');
  assert.equal(current('/prelaunch'), 'Launch');
  assert.equal(current('/launch-not-a-page'), '');
});

test('chart, widget, game and archived pages do not gain a competing app shell', () => {
  for (const name of ['chart-lab.html', 'widget.html', 'old.html', 'swamp.html', 'coin-site.html']) {
    assert.equal(applyProductNavigation(read(name), name), read(name));
  }
});

test('product switcher respects embeds and keeps the Wallet design isolated', () => {
  const css = read('product-navigation.css');
  assert.match(css, /\.fun-launch-embed/);
  assert.match(css, /\.fun-tool-embed/);
  assert.match(css, /focus-visible/);
  assert.match(css, /min-height:44px/);
  assert.doesNotMatch(css, /\.wallet-actions|\.wallet-hero|\.wallet-bottom-nav/);
});
