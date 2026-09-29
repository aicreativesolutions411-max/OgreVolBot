import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { buildLaunchPassport } from '../src/lib/launchPassport.js';
const context = vm.createContext({});
vm.runInContext(readFileSync(new URL('../web/public/launch-passport.js', import.meta.url), 'utf8'), context);
const render = context.SlimeLaunchPassport.render;

test('passport UI escapes user labels and has no financial action', () => {
  const p = buildLaunchPassport({ mint: 'So11111111111111111111111111111111111111112', mode: 'creator', destinations: [{ label: '<img src=x onerror=alert(1)>', shareBps: 10000 }] });
  const html = render(p);
  assert.ok(html.includes('&lt;img'));
  assert.doesNotMatch(html, /<img|<form|<button|javascript:/);
  assert.match(html, /download="slimewire-launch-passport.json"/);
  const json = decodeURIComponent(html.match(/href="data:application\/json;charset=utf-8,([^"]+)"/)[1]);
  assert.deepEqual(JSON.parse(json), p.manifest);
  assert.match(html, /not a creator signature/);
});

test('passport UI ignores malformed records and non-hex fingerprints', () => {
  assert.equal(render(null), '');
  assert.equal(render({ manifest: {}, digest: 'z'.repeat(64) }), '');
});
