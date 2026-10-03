// Cloudflare Worker helper. Call ONLY in the existing trusted proxy before its
// fetch to Render. Do not deploy a second catch-all proxy or forward browser MACs.
// Requires SLIMESTONKS_GEO_HMAC_SECRET as a Worker secret, matching Render.
// This helper is intentionally not activated by the web build.
export async function attestStonksRequest(request, env) {
  const url = new URL(request.url), headers = new Headers(request.headers);
  for (const name of ['x-sw-geo-country', 'x-sw-geo-time', 'x-sw-geo-signature']) headers.delete(name);
  if (!url.pathname.startsWith('/api/web/stonks/execution/')) return new Request(request, { headers });
  const secret = env.SLIMESTONKS_GEO_HMAC_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) return new Request(request, { headers });
  const country = String(request.cf?.country || 'XX'), timestamp = String(Date.now());
  if (!/^[A-Z]{2}$/.test(country)) return new Request(request, { headers });
  const body = request.method === 'GET' || request.method === 'HEAD' ? '' : await request.clone().text();
  if (body.length > 4300000) throw new Error('SlimeStonks request exceeds limit');
  const text = [timestamp, country, request.method, url.pathname + url.search, body].join('\n');
  const encoder = new TextEncoder(), key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(text)));
  headers.set('x-sw-geo-country', country); headers.set('x-sw-geo-time', timestamp);
  headers.set('x-sw-geo-signature', Array.from(bytes, n => n.toString(16).padStart(2, '0')).join(''));
  return new Request(request, { headers });
}
