const CACHE_NAME = 'kikes-mundial-admin-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './seed_data.js',
  './manifest.json',
  './app_icon.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = event.request.url;
  // Bypass any google sheets download or Excel files from being loaded from service worker cache, as they must be fresh
  if (url.includes('google') || url.includes('drive') || url.includes('.xlsm') || url.includes('.xlsx')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // If it's a flag or logo asset, cache it on first retrieval
      if (response) {
        return response;
      }
      return fetch(event.request).then((fetchResponse) => {
        if (url.includes('/Assets/')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          });
        }
        return fetchResponse;
      });
    })
  );
});
