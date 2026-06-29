const CACHE = "flat7-shell-v1";
const SHELL = ["/", "/plants", "/ac", "/bills", "/more", "/offline"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE).then((cache) => cache.put(event.request, copy)); return response; }).catch(() => caches.match(event.request).then((response) => response || caches.match("/offline"))));
  }
});
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(self.registration.showNotification(data.title || "FLAT7 HomeCare", { body: data.body || "Something at home needs attention.", icon: "/icons/icon-192.png", badge: "/icons/icon-192.png", tag: data.tag, data: { url: data.url || "/" } }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => { const target = new URL(event.notification.data.url, self.location.origin).href; for (const client of list) if ("focus" in client) { client.navigate(target); return client.focus(); } return clients.openWindow(target); }));
});
