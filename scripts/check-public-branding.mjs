// Read-only release smoke: public HTML and two static assets, no wallets/RPC.
// node scripts/check-public-branding.mjs [https://slimewire.org]
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { BRAND_MARK, SHARE_IMAGE } from './lib/site-branding.js';
const base = new URL(process.argv[2] || 'https://slimewire.org');
if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) throw new Error('Use a public HTTP(S) origin without credentials.');
let failures = 0;
const request = url => fetch(url, { headers: { 'user-agent': 'Twitterbot/1.0' }, signal: AbortSignal.timeout(20000) });
for (const route of ['/', '/launch', '/bot', '/help', '/terminal', '/wallet']) {
  try {
    const response = await request(new URL(route, base)), html = await response.text();
    const images = [...html.matchAll(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/g)].map(m => m[1]);
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error('HTML unavailable: ' + response.status);
    if (images.length !== 1 || images[0] !== SHARE_IMAGE) throw new Error('Missing, duplicate or stale social preview');
    if (!html.includes('name="twitter:card" content="summary_large_image"')) throw new Error('Missing large X card');
    if (!html.includes(BRAND_MARK)) throw new Error('New brand mark absent');
    console.log('PASS', route, html.match(/<title>([^<]+)<\/title>/)?.[1] || '');
  } catch (error) { failures++; console.error('FAIL', route, error.message); }
}
for (const asset of [BRAND_MARK, new URL(SHARE_IMAGE).pathname]) {
  try {
    const response = await request(new URL(asset, base)), remote = Buffer.from(await response.arrayBuffer());
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) throw new Error('Image unavailable: ' + response.status);
    const local = await readFile(new URL('../web/public' + asset, import.meta.url));
    const digest = bytes => createHash('sha256').update(bytes).digest('hex');
    if (digest(remote) !== digest(local)) throw new Error('Public image differs from release asset');
    console.log('PASS', asset, remote.length + ' bytes');
  } catch (error) { failures++; console.error('FAIL', asset, error.message); }
}
process.exitCode = failures ? 1 : 0;
