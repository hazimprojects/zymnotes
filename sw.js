/* ZymNotes — Service Worker
   Strategy:
   - Core assets (CSS, JS, fonts): cache-first
   - Google Fonts (cross-origin): cache-first with opaque response
   - HTML pages: network-first, fallback to cache
   - Everything else: network-first
*/

const CACHE = 'zym-v72';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/notes/index.html',
  '/assets/css/style.css?v=83',
  '/assets/js/main.js?v=75',
  '/assets/js/zh-mode.js?v=25',
  '/data/zh-glossary.json',
  '/icons/icon.svg?v=2',
  '/icons/icon-maskable.svg?v=2',
  '/manifest.json?v=5'
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

  // Skip non-GET requests
  if (e.request.method !== 'GET') return;

  // Cache Google Fonts (CSS and font files) — cache-first
  var isGoogleFonts = url.startsWith('https://fonts.googleapis.com/') ||
                      url.startsWith('https://fonts.gstatic.com/');
  if (isGoogleFonts) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        return cached || fetch(e.request).then(function (res) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }

  // Skip other cross-origin requests
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
