// SlimeWire pump-list proxy — Cloudflare Worker.
// ---------------------------------------------------------------------------------------------
// WHY: pump.fun's list API (frontend-api-v3 — surging / about-to-graduate / graduated / trending /
// king-of-the-hill) is IP-blocked from our Render server AND CORS-blocked from browsers. This Worker
// runs on Cloudflare's edge: it fetches pump from there and re-serves the JSON to us. If pump does NOT
// block Cloudflare's edge IPs, this gives us pump's exact lists (the whole point of "fill like theirs").
//
// SECURITY: it is NOT an open proxy — only the pump.fun API hosts below are allowed, GET only. Set
// PUMP_PROXY_SECRET (Worker → Settings → Variables) to require ?k=<secret> so randoms can't burn your
// free-tier quota; leave it unset for the first quick reachability test.
// ---------------------------------------------------------------------------------------------
const ALLOWED_HOSTS = new Set([
  "frontend-api-v3.pump.fun",
  "advanced-api-v2.pump.fun",
  "swap-api.pump.fun",
]);

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
    if (request.method !== "GET") return withCors(new Response("GET only", { status: 405 }));

    // Optional shared secret so the Worker isn't a free proxy for the world.
    if (env && env.PUMP_PROXY_SECRET && url.searchParams.get("k") !== env.PUMP_PROXY_SECRET) {
      return withCors(new Response("forbidden", { status: 403 }));
    }

    const target = url.searchParams.get("u");
    if (!target) {
      return withCors(json({ ok: false, error: "missing ?u=<pump api url>" }, 400));
    }
    let t;
    try { t = new URL(target); } catch { return withCors(json({ ok: false, error: "bad url" }, 400)); }
    if (t.protocol !== "https:" || !ALLOWED_HOSTS.has(t.hostname)) {
      return withCors(json({ ok: false, error: "host not allowed", host: t.hostname }, 403));
    }

    let upstream;
    try {
      upstream = await fetch(t.toString(), {
        headers: { accept: "application/json", "user-agent": BROWSER_UA },
        cf: { cacheTtl: 5, cacheEverything: true },
      });
    } catch (e) {
      return withCors(json({ ok: false, error: "upstream fetch failed", detail: String(e) }, 502));
    }

    const body = await upstream.text();
    const res = new Response(body, {
      status: upstream.status,
      headers: { "content-type": upstream.headers.get("content-type") || "application/json" },
    });
    res.headers.set("x-pump-proxy-status", String(upstream.status));
    return withCors(res);
  },
};

function withCors(res) {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "*");
  res.headers.set("Cache-Control", "public, max-age=5");
  return res;
}
function json(obj, status) {
  return new Response(JSON.stringify(obj), { status: status || 200, headers: { "content-type": "application/json" } });
}
