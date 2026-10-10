// Minimal app-shell service worker: versioned cache, offline fallback.
// Same-origin only — API traffic is never cached.
const VERSION = 'newera-app-v1';
const SHELL = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          const copy = r.clone();
          caches.open(VERSION).then((c) => c.put('/index.html', copy));
          return r;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(
      (hit) => hit || fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(VERSION).then((c) => c.put(e.request, copy));
        return r;
      }),
    ),
  );
});
