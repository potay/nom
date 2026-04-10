// Push notification service worker (separate from any caching SW)
self.addEventListener("push", function (event) {
  var data = { title: "Nom", body: "Check your fridge!" };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      tag: data.tag || "nom-notification",
      data: data.url || "/dashboard",
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || "/dashboard")
  );
});
