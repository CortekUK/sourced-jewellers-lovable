// Kill-switch service worker. The previous SW cached stale HTML pointing to
// hashed JS bundles that change on every deploy, causing blank screens.
// This SW unregisters itself, clears all caches, and reloads any controlled
// pages so users immediately get the latest assets.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach((client) => client.navigate(client.url));
  })());
});
