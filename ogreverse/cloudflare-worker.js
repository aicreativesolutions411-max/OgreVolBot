/**
 * OgreVerse edge proxy — serve the game at slimewire.org/Ogreverse WITHOUT exposing Render.
 *
 * This Cloudflare Worker reverse-proxies /Ogreverse/* to the bot origin SERVER-SIDE, so the
 * browser only ever sees slimewire.org — the onrender.com origin is never revealed, and there is
 * no redirect. Everything else falls through to the normal site untouched. SSE (the live MMO
 * stream) works because the Worker streams the response body through.
 *
 * ── DEPLOY (one-time, ~2 minutes) ───────────────────────────────────────────────────────────
 * 1. Cloudflare dashboard → your account → Workers & Pages → Create → Create Worker.
 * 2. Name it e.g. "ogreverse-proxy", click Deploy, then "Edit code".
 * 3. Replace the default code with THIS file's contents. Save and Deploy.
 * 4. Back on the Worker → Settings → Triggers (or "Routes") → Add route:
 *        Route:  slimewire.org/Ogreverse*
 *        Zone:   slimewire.org
 *    (Add a second route  www.slimewire.org/Ogreverse*  if you use www.)
 * 5. Done. slimewire.org/Ogreverse now serves the game with Render hidden.
 *
 * After this is live, tell me and I'll remove the temporary client redirect so nothing ever
 * points at the onrender URL again.
 */

const ORIGIN = "https://ogrevolbot.onrender.com"; // bot origin (hidden from the browser)

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Only handle the game path; everything else is none of our business.
    if (!/^\/Ogreverse(\/|$)/i.test(url.pathname)) {
      return fetch(request);
    }

    // Build the upstream request to the bot, preserving path + query.
    const upstream = ORIGIN + url.pathname + url.search;
    const init = {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request.body,
      redirect: "manual",
    };

    const res = await fetch(upstream, init);

    // Stream the response straight back (works for HTML, assets, and the SSE event stream).
    const headers = new Headers(res.headers);
    headers.delete("content-security-policy"); // the game sets its own; let it through cleanly
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
  },
};
