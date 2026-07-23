/* SlimeCash service worker — fresh-first app shell, network-only for APIs. */
const CACHE = "slimecash-v27";
const SHELL = [
  "/cash/",
  "/cash/index.html",
  "/cash/cash.css?v=25",
  "/slimewire-funding.js?v=8",
  "/cash/cash.js?v=25",
  "/cash/manifest.webmanifest?v=11",
  "/assets/slimewire/fun-app-icon-192.png",
  "/cash/img/splash.webp",
  "/cash/img/card.webp",
  "/cash/img/ogre.webp",
  "/cash/img/coin.webp",
  "/cash/icons/icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("slimecash-") && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET") return;
  // Money/data endpoints must never come from cache.
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith("/cash") && url.pathname !== "/slimewire-funding.js") return;
  event.respondWith(
    caches.match(event.request, { ignoreSearch: url.pathname === "/cash/" || url.pathname === "/cash/index.html" }).then((cached) => {
      const fetched = fetch(event.request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      // Prefer the current deploy so installed PWAs do not stay pinned to an
      // older Cash script. The cache remains the offline fallback.
      return fetched;
    })
  );
});
