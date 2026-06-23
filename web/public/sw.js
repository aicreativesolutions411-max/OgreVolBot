// SlimeWire service worker: web push alerts + an installable PWA app shell. The fetch handler
// is NETWORK-FIRST and only ever caches the static SHELL (html/css/js/icons) — it NEVER caches
// /api/ responses or non-GET requests, so trading data is never served stale. Offline just
// shows the cached shell, which then loads live data when the connection returns.

const SHELL_CACHE = "slimewire-shell-v12-live-mc-socials";
// Standalone pages are their OWN documents (Pro, raid board, prelaunch, hub, launch, guide, share
// pages). The SW must NEVER treat their navigations as the app shell — doing so served the cached
// main-app (the "/pro shows the old intro then the main page" bug). Only the SPA's own routes are
// shell navigations; everything else passes straight through to the network.
const APP_NAV_ROUTES = new Set(["/", "/terminal", "/portal", "/connect", "/login", "/account/login"]);

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("slimewire-shell-") && k !== SHELL_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;                          // never touch writes
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // 3rd-party (RPC, dex, etc.) -> network
  // OgreVerse is served as its OWN static client under /Ogreverse/ — never the SPA shell. Always
  // pass these straight to the network (real game files) so it can't fall through to the terminal.
  if (/^\/ogreverse(\/|$)/i.test(url.pathname)) return;
  if (url.pathname.startsWith("/api/")) return;              // live data -> network only, NEVER cached
  // Only the SPA's own routes are shell navigations. Standalone pages (/pro, /raids, /prelaunch,
  // /hub, /launch, /manual, share pages, …) pass through so they always load their real document,
  // never the cached app shell.
  const isAppNav = req.mode === "navigate" && APP_NAV_ROUTES.has(url.pathname);
  const isStaticAsset = req.mode !== "navigate" && /\.(css|js|mjs|png|jpg|jpeg|svg|webp|ico|json|webmanifest|woff2?)$/i.test(url.pathname);
  if (!isAppNav && !isStaticAsset) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);                          // network-first: always fresh when online
      if (res && res.ok) {
        const copy = res.clone();
        caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    } catch {
      const cached = await caches.match(req);                // offline: serve the cached shell
      return cached || (req.mode === "navigate" ? caches.match("/") : Response.error());
    }
  })());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { body: event.data ? event.data.text() : "" };
  }
  const title = payload.title || "SlimeWire";
  event.waitUntil(self.registration.showNotification(title, {
    body: payload.body || "",
    tag: payload.tag || "slimewire",
    icon: "/assets/slimewire/svg/slimewire-mark.svg",
    badge: "/assets/slimewire/svg/slimewire-mark.svg",
    data: { url: payload.url || "/terminal" },
    renotify: true
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/terminal";
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client && !client.url.includes(targetUrl)) {
          await client.navigate(targetUrl).catch(() => {});
        }
        return;
      }
    }
    await self.clients.openWindow(targetUrl);
  })());
});
