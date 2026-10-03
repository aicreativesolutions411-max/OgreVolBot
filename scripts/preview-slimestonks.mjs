// Isolated, read-only preview: never boots the trading bot, cron or wallet store.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSlimeStonksReader } from '../src/lib/slimeStonks.js';
import { stonksExecutionReadiness } from '../src/lib/slimeStonksApi.js';
import { createTokenRewardsApi } from '../src/lib/tokenRewardsApi.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../web/dist');
const reader = createSlimeStonksReader();
const rewardApi = createTokenRewardsApi({
  readBody: async (req, max) => { let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > max) throw Error('Too large'); } return body; },
  sendJson: (_req, res, status, value) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(value)); }
});
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  const send = (status, payload) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(payload)); };
  if (url.pathname.startsWith('/api/web/token-rewards/')) { await rewardApi.route(req, res, url); return; }
  if (req.method !== 'GET') { send(405, { ok: false, error: 'Read-only preview.' }); return; }
  if (url.pathname === '/api/web/stonks/execution/readiness') { send(200, { ok: true, data: stonksExecutionReadiness({}) }); return; }
  if (url.pathname.startsWith('/api/web/stonks/')) {
    try { send(200, await reader.read(url.pathname.slice('/api/web/stonks/'.length), url.searchParams)); } catch (e) { send(e.status || 502, { ok: false, error: e.message }); } return;
  }
  if (url.pathname === '/config.js') { res.writeHead(200, { 'Content-Type': 'application/javascript' }); res.end('window.OGRE_PORTAL_CONFIG={apiBase:""};'); return; }
  try {
    const route = ({ '/': 'home.html', '/slimestonks': 'slimestonks.html', '/slimestonks/': 'slimestonks.html' })[url.pathname] || decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = path.resolve(root, route); if (!file.startsWith(root + path.sep)) throw Error('Not found');
    const data = await fs.readFile(file); res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(data);
  } catch { send(404, { ok: false, error: 'Not found' }); }
});
server.listen(4186, '127.0.0.1', () => console.log('SlimeStonks read-only preview: http://127.0.0.1:4186/slimestonks'));
