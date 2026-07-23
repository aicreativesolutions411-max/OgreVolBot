/* SlimeWire Go: focused mobile PWA shell and push worker. */
const FUN_CACHE = "slimewire-fun-v53";
const FUN_SHELL = [
  "/fun/",
  "/fun.html",
  "/fun.css?v=39",
  "/slimewire-funding.js?v=8",
  "/vendor/lightweight-charts.standalone.production.js",
  "/fun.js?v=63",
  "/fun-indicators.js?v=7",
  "/fun-manifest.webmanifest?v=2",
  "/config.js",
  "/assets/slimewire/fun-app-icon-192.png",
  "/assets/slimewire/fun-app-icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(FUN_CACHE).then((cache) => cache.addAll(FUN_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith("slimewire-fun-") && key !== FUN_CACHE).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  const isFunPage = request.mode === "navigate" && (url.pathname === "/fun" || url.pathname === "/fun/" || url.pathname === "/fun.html");
  const isStatic = request.mode !== "navigate" && /\.(?:css|js|png|webp|svg|ico|json|webmanifest|woff2?)$/i.test(url.pathname);
  if (!isFunPage && !isStatic) return;
  event.respondWith(fetch(request).then((response) => {
    if (response.ok) caches.open(FUN_CACHE).then((cache) => cache.put(request, response.clone())).catch(() => {});
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || (isFunPage ? caches.match("/fun/") : Response.error()))));
});

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; }
  catch { payload = { body: event.data ? event.data.text() : "" }; }
  event.waitUntil(self.registration.showNotification(payload.title || "SlimeWire Go", {
    body: payload.body || "",
    tag: payload.tag || "slimewire-fun",
    icon: "/assets/slimewire/fun-app-icon-192.png",
    badge: "/assets/slimewire/png/slimewire-mark.png",
    data: { url: payload.url || "/fun/" },
    renotify: true
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/fun/"));
});
