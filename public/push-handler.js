self.addEventListener("push", (event) => {
  const fallback = {
    title: "SIGMAFAM - Alerta",
    body: "Se activó una alerta de emergencia.",
    url: "/app/alerts",
    tag: "sigmafam-alert",
  };

  const payload = event.data?.json?.() || fallback;
  const title = payload.title || fallback.title;
  const options = {
    body: payload.body || fallback.body,
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: payload.tag || fallback.tag,
    renotify: true,
    requireInteraction: true,
    data: {
      url: payload.url || fallback.url,
      ...(payload.data || {}),
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/app/alerts", self.location.origin).href;
  event.waitUntil((async () => {
    const windows = await clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find((client) => client.url.startsWith(self.location.origin));
    if (existing) {
      await existing.focus();
      return existing.navigate(targetUrl);
    }
    return clients.openWindow(targetUrl);
  })());
});
