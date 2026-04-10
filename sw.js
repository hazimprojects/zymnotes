/* Hazim EduHub — Service Worker
   Strategy:
   - Core assets (CSS, JS, fonts): cache-first
   - HTML pages: network-first, fallback to cache
   - Everything else: network-first
*/

const CACHE = 'hzedu-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/notes/index.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/icons/icon.svg',
  '/manifest.json'
];

// ── Install: precache core assets ─────────────────────────────────────────
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

// ── Activate: clear old caches ────────────────────────────────────────────
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────
self.addEventListener('fetch', function (e) {
  var url = e.request.url;

  // Skip non-GET and cross-origin requests
  if (e.request.method !== 'GET') return;
  if (!url.startsWith(self.location.origin)) return;

  var isHTML = e.request.headers.get('accept') &&
               e.request.headers.get('accept').includes('text/html');
  var isAsset = /\.(css|js|svg|png|jpg|woff2?)(\?.*)?$/.test(url);

  if (isAsset) {
    // Cache-first for static assets
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        return cached || fetch(e.request).then(function (res) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
  } else if (isHTML) {
    // Network-first for HTML — always try fresh, fallback to cache
    e.respondWith(
      fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (cached) {
          return cached || caches.match('/index.html');
        });
      })
    );
  }
  // All other requests: browser default (no interception)
});
