import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const STONK = '6GmAFSYs4gk3FDao5FzzySQpPZaWsa4rUJHacpMpUNgx';
const STOCK = 'XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W';
const SPL = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');

test('crypto pairing policy pins exact mints, programs and decimals, not names or categories', async () => {
  const { STONKS_CRYPTO_ASSETS, requireCryptoQuote } = await import('../src/lib/slimeStonksAssets.js');
  assert.ok(STONKS_CRYPTO_ASSETS.length >= 6);
  assert.equal(requireCryptoQuote({ mint: STONK, decimals: 9, tokenProgram: SPL }).symbol, 'STONK');
  for (const row of [
    { mint: STOCK, symbol: 'STONK', category: 'custom', decimals: 8, tokenProgram: SPL },
    { mint: STONK, decimals: 6, tokenProgram: SPL },
    { mint: STONK, decimals: 9, tokenProgram: 'unknown' },
    { mint: STONK.toLowerCase(), decimals: 9, tokenProgram: SPL },
  ]) assert.throws(() => requireCryptoQuote(row));
  for (const asset of STONKS_CRYPTO_ASSETS) assert.equal(requireCryptoQuote(asset).mint, asset.mint);
});

test('reward policy keeps the chosen asset for both communities and separates creator fees', async () => {
  const { cryptoRewardPolicy } = await import('../src/lib/slimeStonksAssets.js');
  const quote = { mint: STONK, decimals: 9, tokenProgram: SPL };
  const policy = cryptoRewardPolicy({ quote, mode: 'community', transferFeeBps: 100, communityShareBps: 3300 });
  assert.equal(policy.rewardAsset.mint, STONK);
  assert.equal(policy.rewardAsset.symbol, 'STONK');
  assert.equal(policy.funding, 'transfer-fee');
  assert.equal(policy.creatorFeePosition, false);
  assert.equal(policy.ownHolderShareBps, 6700);
  assert.equal(policy.quoteHolderShareBps, 3300);
  assert.equal(policy.convertsToSol, false);
  assert.equal(policy.minimumUsd, null, 'do not inherit the unrelated Pump/SOL $20 policy');
  assert.equal(policy.cadenceHours, null, 'do not invent twice-daily upstream payouts');
  const own = cryptoRewardPolicy({ quote, mode: 'reward', transferFeeBps: 300 });
  assert.equal(own.ownHolderShareBps, 10000);
  assert.equal(own.quoteHolderShareBps, 0);
  assert.equal(cryptoRewardPolicy({ quote, mode: 'standard', transferFeeBps: 0 }).rewardAsset, null);
  assert.throws(() => cryptoRewardPolicy({ quote, mode: 'community', transferFeeBps: 100, communityShareBps: 0 }));
  assert.throws(() => cryptoRewardPolicy({ quote, mode: 'standard', transferFeeBps: 100 }));
});

test('public crypto catalog and pricing mark only explicitly supported identities', async () => {
  const { normalizeStonksData } = await import('../src/lib/slimeStonks.js');
  const pairs = normalizeStonksData('pairs', { pairs: [
    { mint: STONK, symbol: 'Wrong ticker', name: 'wrong', decimals: 9, tokenProgram: SPL, launchable: true, launchLabReady: true, communityMode: true },
    { mint: STOCK, symbol: 'STONK', category: 'custom', decimals: 8, tokenProgram: SPL, launchable: true, launchLabReady: true },
  ] }).pairs;
  assert.equal(pairs[0].cryptoAllowed, true);
  assert.equal(pairs[0].symbol, 'STONK');
  assert.equal(pairs[1].cryptoAllowed, false);
  const mismatched = normalizeStonksData('pairs', { pairs: [{ ...pairs[0], decimals: 6, tokenProgram: SPL }] }).pairs[0];
  assert.equal(mismatched.cryptoAllowed, false);
});

test('planner displays the exact reward asset, split and fee model without promising live payouts', async () => {
  const context = vm.createContext({ URL, URLSearchParams, Intl });
  vm.runInContext(read('web/public/slimestonks.js'), context);
  const ui = context.SlimeStonks;
  const pair = { mint: STONK, symbol: 'STONK', cryptoAllowed: true, launchable: true, launchLabReady: true, communityMode: true };
  const pricing = { quote: { mint: STONK, symbol: 'STONK', cryptoAllowed: true }, transferFeeBps: [100, 300], community: { available: true, shareBps: 3300 } };
  assert.equal(ui.launchReadiness(pair, pricing, 'community').ready, true);
  assert.equal(ui.launchReadiness({ ...pair, cryptoAllowed: false }, pricing, 'community').ready, false);
  const html = ui.rewardPlanHtml(pair, pricing, 'community', 100);
  assert.match(html, /STONK/);
  assert.match(html, /67%/);
  assert.match(html, /33%/);
  assert.match(html, /No separate creator-fee position/);
  assert.match(html, /not converted to SOL/);
  assert.doesNotMatch(html, /every 12|\$20|guaranteed income/i);
  assert.equal(ui.launchReadiness(pair, { ...pricing, quote: { mint: STOCK } }, 'community').ready, false);
  assert.equal(ui.launchReadiness(pair, { ...pricing, transferFeeBps: [100] }, 'community', 300).ready, false);
});

test('crypto UI exposes genuine non-SOL pairings and never redirects into the SOL-only launcher', () => {
  const html = read('web/public/slimestonks.html'), js = read('web/public/slimestonks.js');
  assert.match(html, /Pair in crypto/);
  assert.match(html, /STONK/);
  assert.match(html, /reward asset/i);
  assert.doesNotMatch(html, /<option value="xstock"/);
  assert.doesNotMatch(js, /lc_template|holder_alliance|\/launch\?template=/);
  assert.match(html, /not enabled/i);
  assert.match(html, /United States/);
});
