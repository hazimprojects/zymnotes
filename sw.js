/* ZymNotes — Service Worker
   Strategy:
   - Core assets (CSS, JS, fonts): cache-first
   - Google Fonts (cross-origin): cache-first with opaque response
   - HTML pages: network-first, fallback to cache (with /notes ↔ /notes/index.html aliases)
   - Same-origin non-document GET: cache-first
*/

const CACHE = 'zym-v140';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/about.html',
  '/feedback.html',
  '/thank-you.html',
  '/404.html',
  '/notes/index.html',
  '/quiz/bab-1-1.html',
  '/assets/css/style.css?v=96',
  '/assets/js/main.js?v=110',
  '/assets/js/zh-mode.js?v=41',
  '/assets/js/subtopic-lab.js',
  '/data/zh-glossary.json',
  '/data/zh-comprehension.json',
  '/data/zh-units/index.json',
  '/icons/icon.svg?v=3',
  '/icons/icon-maskable.svg?v=3',
  '/icons/apple-touch-icon.png?v=1',
  '/icons/icon-192.png?v=1',
  '/icons/icon-512.png?v=1',
  '/manifest.json?v=11',
  '/notes/bab-1-1.html',
  '/notes/bab-1-2.html',
  '/notes/bab-1-3.html',
  '/notes/bab-1-4.html',
  '/notes/bab-1.html',
  '/notes/bab-2-1.html',
  '/notes/bab-2-2.html',
  '/notes/bab-2-3.html',
  '/notes/bab-2-4.html',
  '/notes/bab-2-5.html',
  '/notes/bab-2-6.html',
  '/notes/bab-2-7.html',
  '/notes/bab-2-8.html',
  '/notes/bab-2.html',
  '/notes/bab-3-1.html',
  '/notes/bab-3-2.html',
  '/notes/bab-3-3.html',
  '/notes/bab-3-4.html',
  '/notes/bab-3-5.html',
  '/notes/bab-3-6.html',
  '/notes/bab-3-7.html',
  '/notes/bab-3-8.html',
  '/notes/bab-3-9.html',
  '/notes/bab-3.html',
  '/notes/bab-4-1.html',
  '/notes/bab-4-2.html',
  '/notes/bab-4-3.html',
  '/notes/bab-4-4.html',
  '/notes/bab-4-5.html',
  '/notes/bab-4-6.html',
  '/notes/bab-4-7.html',
  '/notes/bab-4.html',
  '/notes/bab-5-1.html',
  '/notes/bab-5-2.html',
  '/notes/bab-5-3.html',
  '/notes/bab-5-4.html',
  '/notes/bab-5.html',
  '/notes/bab-6-1.html',
  '/notes/bab-6-2.html',
  '/notes/bab-6-3.html',
  '/notes/bab-6-4.html',
  '/notes/bab-6.html',
  '/notes/bab-7-1.html',
  '/notes/bab-7-2.html',
  '/notes/bab-7-3.html',
  '/notes/bab-7-4.html',
  '/notes/bab-7-5.html',
  '/notes/bab-7.html'
];

function normalizeHtmlCacheKeys(fullUrl) {
  var pathname = new URL(fullUrl).pathname;
  var keys = [];
  if (pathname === '/' || pathname === '') {
    keys.push('/', '/index.html');
  } else if (pathname === '/notes' || pathname === '/notes/') {
    keys.push('/notes/', '/notes/index.html');
  } else {
    keys.push(pathname);
  }
  return keys.filter(function (v, i, a) { return a.indexOf(v) === i; });
}

function matchFirstInCache(cache, keys) {
  return keys.reduce(function (acc, key) {
    return acc.then(function (found) {
      if (found) return found;
      return cache.match(key, { ignoreSearch: true });
    });
  }, Promise.resolve(null));
}

// ── Install: precache core assets + all note HTML ─────────────────────────
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

  var isHTML = e.request.mode === 'navigate' ||
               (e.request.headers.get('accept') &&
                e.request.headers.get('accept').indexOf('text/html') !== -1);
  var isAsset = /\.(css|js|svg|png|jpg|jpeg|gif|webp|woff2?|ico|json|mp3|webm|opus)(\?.*)?$/i.test(url);

  if (isAsset) {
    // Cache-first for static assets
    e.respondWith(
      caches.match(e.request, { ignoreSearch: true }).then(function (cached) {
        return cached || fetch(e.request).then(function (res) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }

  if (isHTML) {
    // Network-first for HTML — always try fresh, fallback to cache (+ URL aliases)
    e.respondWith(
      fetch(e.request).then(function (res) {
        var clone = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        return res;
      }).catch(function () {
        return caches.open(CACHE).then(function (cache) {
          var keys = normalizeHtmlCacheKeys(e.request.url);
          return matchFirstInCache(cache, keys).then(function (cached) {
            if (cached) return cached;
            return cache.match('/offline.html', { ignoreSearch: true }).then(function (offlinePage) {
              return offlinePage || cache.match('/index.html', { ignoreSearch: true });
            });
          });
        });
      })
    );
    return;
  }

  // Same-origin GET (e.g. /assets/... without recognised extension): cache-first
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (cached) {
      return cached || fetch(e.request).then(function (res) {
        if (res && res.ok) {
          var clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, clone); });
        }
        return res;
      });
    })
  );
});
