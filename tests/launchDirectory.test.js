import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLaunchDirectory, createLaunchDirectoryReader } from '../src/lib/launchDirectory.js';

const mint = '5FQN4usbgWyDd5oyVNF8gan3yXAHS4gxzRGKgYyvpump';
const complete = { status: 'COMPLETE', tokenMint: mint, tokenName: 'Bounce', symbol: 'BOUNCE', completedAt: '2026-09-27T12:00:00Z', imageUri: 'https://example.com/coin.png' };
test('public launch directory exposes only completed, unique, valid Solana coins', () => {
  const rows = buildLaunchDirectory([complete, { ...complete, status: 'FAILED' }, { ...complete, tokenMint: 'not a mint' }, { ...complete, symbol: 'LATEST' }]);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].symbol, 'LATEST');
  assert.equal(rows[0].mint, mint);
});
test('directory whitelists public metadata without wallet, account or fee balances', () => {
  const [row] = buildLaunchDirectory([{ ...complete, userId: 123, encryptedMintSecret: 'secret', devWalletPublicKey: 'private context', recoveryIntents: {}, fees: 200, launchUtility: { mode: 'usepaid', xHandle: 'private' }, metadataJson: { description: 'A public coin', twitter: 'https://x.com/example' } }]);
  assert.deepEqual(Object.keys(row).sort(), ['createdAt', 'description', 'imageUrl', 'mint', 'name', 'origin', 'rewardMode', 'symbol']);
  assert.equal(row.rewardMode, 'external');
  assert.equal(row.description, 'A public coin');
  assert.ok(!JSON.stringify(row).includes('private'));
});
test('existing connected coins are never described as newly launched here', () => {
  assert.equal(buildLaunchDirectory([{ ...complete, origin: 'connected' }])[0].origin, 'connected');
  assert.equal(buildLaunchDirectory([complete])[0].origin, 'launched');
});
test('directory preserves reward labels and rejects unsafe images', () => {
  assert.equal(buildLaunchDirectory([{ ...complete, pumpCashback: true }])[0].rewardMode, 'cashback');
  assert.equal(buildLaunchDirectory([{ ...complete, holderRewards: { enabled: true } }])[0].rewardMode, 'holders');
  assert.equal(buildLaunchDirectory([{ ...complete, imageUri: 'javascript:alert(1)' }])[0].imageUrl, '');
  assert.equal(buildLaunchDirectory([{ ...complete, imageUri: 'https://user:password@example.com/p.png' }])[0].imageUrl, '');
  assert.equal(buildLaunchDirectory([{ ...complete, completedAt: 'bad date' }])[0].createdAt, '');
});
test('directory keeps IPFS artwork and legacy image fields for exact launched coins', () => {
  const cid = 'bafkreihei5dvwvm3fjdhgr3fiwspeznxcz3r4jm6s6jjfssqhkoqgjgoyu';
  assert.equal(buildLaunchDirectory([{ ...complete, imageUri: 'ipfs://' + cid }])[0].imageUrl, 'https://pump.mypinata.cloud/ipfs/' + cid);
  assert.equal(buildLaunchDirectory([{ ...complete, imageUri: '', imageUrl: 'https://example.com/legacy.png' }])[0].imageUrl, 'https://example.com/legacy.png');
  assert.equal(buildLaunchDirectory([{ ...complete, imageUri: 'javascript:bad', metadataJson: { image: 'https://example.com/metadata.png' } }])[0].imageUrl, 'https://example.com/metadata.png');
});
test('directory cache coalesces reads, expires and does not hide storage errors', async () => {
  let calls = 0, now = 1000;
  const read = createLaunchDirectoryReader(async () => { calls++; return { attempts: [complete] }; }, { now: () => now, ttlMs: 100 });
  const rows = await Promise.all([read(), read(), read()]);
  assert.equal(calls, 1); assert.equal(rows[0].length, 1);
  await read(); assert.equal(calls, 1);
  now += 101; await read(); assert.equal(calls, 2);
  await assert.rejects(createLaunchDirectoryReader(async () => { throw new Error('offline'); })(), /offline/);
});
