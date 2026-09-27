// Read-only local design QA. No dotenv, account credentials, RPC or transactions.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/public');
const base = 'https://app.slimewire.org';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
let publicCoins;
http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET') return json(403, { error: 'Read-only preview.' });
    if (url.pathname === '/config.js') { res.setHeader('Content-Type', 'text/javascript'); res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};'); return; }
    if (url.pathname === '/api/web/launch/directory') {
      if (!publicCoins) {
        const r = await fetch(base + '/api/web/launch/directory', { signal: AbortSignal.timeout(12000) });
        if (!r.ok) throw new Error('Public launch source unavailable');
        const data = await r.json();
        publicCoins = data.launches || [];
      }
      return json(200, { ok: true, launches: publicCoins });
    }
    if (url.pathname.startsWith('/api/')) return json(403, { error: 'Account and financial operations disabled in local preview.' });
    // Show the handoff URL; never start the real app or create a wallet.
    if (url.pathname === '/' && url.searchParams.has('lc_n')) return json(200, { previewOnly: true, handoff: url.search, message: 'Draft handed to launcher. No coin created.' });
    const relative = url.pathname === '/' || url.pathname === '/launch' ? 'launch.html' : decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = path.resolve(root, relative);
    if (!file.startsWith(root + path.sep)) return json(400, { error: 'Invalid path' });
    const body = await fs.readFile(file); res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream'); res.end(body);
  } catch { json(503, { ok: false, error: 'Preview resource unavailable.' }); }
}).listen(4182, '127.0.0.1', () => console.log('Read-only launch preview: http://127.0.0.1:4182/launch'));
