const CACHE_NAME = 'samyak-cache-v9';
const ASSETS = [
  './',
  './index.html',
  './app.js',
  './styles.css',
  './luka.png',
  './raaz_profile.png',
  'https://fonts.googleapis.com/css2?family=Martel:wght@400;700;900&family=Mukta:wght@400;500;600;700;800&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&family=Noto+Serif+Devanagari:wght@400;600;700;900&family=Poppins:wght@300;400;500;600;700&family=Rozha+One&family=Yatra+One&family=Outfit:wght@300;400;500;600;700;800;900&display=swap'
];

// Install Event - cache assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching vital assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event - optimized dual caching strategy (Cache First for Fonts & Images, Network First for HTML/JS/CSS)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') {
    return;
  }

  const url = new URL(e.request.url);

  // Strategy 1: Cache First for static heavy assets (Google Fonts, external font files, and local images)
  const isFont = url.host.includes('fonts.googleapis.com') || url.host.includes('fonts.gstatic.com') || url.pathname.includes('/fonts/');
  const isImage = url.pathname.endsWith('.png') || url.pathname.endsWith('.jpg') || url.pathname.endsWith('.jpeg') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.webp') || url.pathname.endsWith('.ico');

  if ((isFont || isImage) && !url.pathname.includes('chrome-extension')) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse; // Load instantly (0ms) from cache!
        }
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 404 });
        });
      })
    );
  } else {
    // Strategy 2: Network First for core files (HTML, JS, CSS) to guarantee instant bug fixes and updates
    if (!e.request.url.startsWith(self.location.origin)) {
      return;
    }
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, resClone);
            });
          }
          return res;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
  }
});
