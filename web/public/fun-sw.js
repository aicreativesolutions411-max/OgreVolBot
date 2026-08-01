/* SlimeWire Go + SlimeWallet: isolated installable shells and push worker. */
const IS_WALLET_WORKER = new URL(self.registration.scope).pathname.startsWith("/wallet/");
const FUN_CACHE = IS_WALLET_WORKER ? "slimewallet-v31" : "slimewire-fun-v88";
const FUN_CACHE_PREFIX = IS_WALLET_WORKER ? "slimewallet-" : "slimewire-fun-";
const FUN_SHELL = [
  IS_WALLET_WORKER ? "/wallet/" : "/fun/",
  "/fun.html",
  "/fun.css?v=67",
  "/fun.js?v=91",
  IS_WALLET_WORKER ? "/wallet-manifest.webmanifest?v=2" : "/fun-manifest.webmanifest?v=2",
  "/config.js",
  IS_WALLET_WORKER ? "/assets/slimewire/slimewallet-icon-192.png" : "/assets/slimewire/fun-app-icon-192.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(FUN_CACHE).then((cache) => cache.addAll(FUN_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith(FUN_CACHE_PREFIX) && key !== FUN_CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  const isFunPage = request.mode === "navigate" && (IS_WALLET_WORKER
    ? (url.pathname === "/wallet" || url.pathname === "/wallet.html" || url.pathname.startsWith("/wallet/"))
    : (url.pathname === "/fun" || url.pathname === "/fun/" || url.pathname === "/fun.html"));
  const isStatic = request.mode !== "navigate" && /\.(?:css|js|png|webp|svg|ico|json|webmanifest|woff2?)$/i.test(url.pathname);
  if (!isFunPage && !isStatic) return;
  // Cache the public shell under a canonical URL so one-time login tickets and
  // other private navigation parameters never become persistent cache keys.
  const cacheKey = isFunPage ? (IS_WALLET_WORKER ? "/wallet/" : "/fun/") : request;
  const network = fetch(request).then((response) => {
    if (response.ok) caches.open(FUN_CACHE).then((cache) => cache.put(cacheKey, response.clone())).catch(() => {});
    return response;
  });
  if (isStatic) {
    event.respondWith(caches.match(cacheKey).then((cached) => {
      if (cached) {
        event.waitUntil(network.catch(() => null));
        return cached;
      }
      return network.catch(() => Response.error());
    }));
    return;
  }
  event.respondWith(network.catch(() => caches.match(cacheKey)));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(payload.title || (IS_WALLET_WORKER ? "SlimeWallet" : "SlimeWire Go"), {
    body: payload.body || "",
    tag: payload.tag || "slimewire-fun",
    icon: IS_WALLET_WORKER ? "/assets/slimewire/slimewallet-icon-192.png" : "/assets/slimewire/fun-app-icon-192.png",
    badge: IS_WALLET_WORKER ? "/assets/slimewire/slimewallet-icon-192.png" : "/assets/slimewire/png/slimewire-mark.png",
    data: { url: payload.url || (IS_WALLET_WORKER ? "/wallet/" : "/fun/") },
    renotify: true
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || (IS_WALLET_WORKER ? "/wallet/" : "/fun/")));
});
