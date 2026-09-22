// Local visual QA only. No .env, keys, wallets, signing, or money operations.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchUtilityCapabilities, reviewLaunchUtility, USEPAID_VERIFIED_TREASURY, LAUNCH_UTILITY_CONSENT_VERSION } from '../src/lib/launchUtility.js';
const previewEnv = process.argv.includes('--usepaid-preview') ? { USEPAID_ROUTING_ENABLED: 'true', USEPAID_TREASURY_SOLANA: USEPAID_VERIFIED_TREASURY, USEPAID_TERMS_REVIEWED_VERSION: LAUNCH_UTILITY_CONSENT_VERSION } : {};
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/dist');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  res.setHeader('Cache-Control', 'no-store');
  const json = (status, value) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
  try {
    if (url.pathname === '/config.js') { res.setHeader('Content-Type', 'text/javascript'); res.end('window.SLIMEWIRE_CONFIG={};'); return; }
    if (url.pathname === '/api/web/launch/utility/capabilities') return json(200, { ok: true, localPreviewOnly: true, ...launchUtilityCapabilities(previewEnv) });
    if (url.pathname === '/api/web/launch/utility/review' && req.method === 'POST') {
      let body = ''; for await (const chunk of req) { body += chunk; if (body.length > 16000) throw new Error('Too large'); }
      const data = JSON.parse(body); return json(200, { ok: true, localPreviewOnly: true, ...reviewLaunchUtility(data.launchUtility, data, previewEnv) });
    }
    if (url.pathname.startsWith('/api/')) return json(403, { ok: false, error: 'Local UI preview: trading and accounts are disabled.' });
    let relative = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    if (relative === 'terminal') relative = 'index.html';
    if (relative === 'wallet' || relative === 'fun') relative = 'fun.html';
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) return json(400, { error: 'Invalid path' });
    const data = await fs.readFile(file); res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(data);
  } catch { json(404, { error: 'Preview resource unavailable' }); }
}).listen(4178, '127.0.0.1', () => console.log('Launch UI preview: http://127.0.0.1:4178/#launch (no money operations)'));
