// Self-destructing service worker: clears all caches and unregisters itself.
// This replaces the old serwist service worker that was causing stale cache issues.
self.addEventListener("install", function() {
  self.skipWaiting();
});

self.addEventListener("activate", function() {
  caches.keys().then(function(names) {
    return Promise.all(names.map(function(name) { return caches.delete(name); }));
  }).then(function() {
    return self.registration.unregister();
  }).then(function() {
    return self.clients.matchAll({ type: "window" });
  }).then(function(clients) {
    clients.forEach(function(client) { client.navigate(client.url); });
  });
});
