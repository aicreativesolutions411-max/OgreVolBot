// SlimeWire service worker: web push alerts only (no offline caching - trading data
// must never be served stale from a cache).

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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
