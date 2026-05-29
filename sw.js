/* OnRegardeQuoi.com: a lightweight and open-source web app for discovering movies and TV shows */
/* Made with ❤ by micka from Paris */
/* v2.0 */


/* =========================================
   IMPORTANT : CHANGE THE CACHE_NAME VALUE WITH EVERY UPDATE (e.g., orq-cache-v2.1)
OTHERWISE, USERS' PHONES WILL KEEP THE OLD VERSION OF THE APP!
========================================= */
const CACHE_NAME = 'orq-cache-v2';
const IMAGE_CACHE_NAME = 'orq-images-cache'; // Cache dedicated to posters
const MAX_IMAGES = 100; // Image storage limit on the phone

// Core files to be cached for offline use
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/ressources/favicon.svg'
];

// 1. INSTALL: Pre-caches all essential static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. ACTIVATE: Cleans up old caches from previous versions
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key !== IMAGE_CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// 3. FETCH: Network-first for API, Cache-first for UI assets
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Do NOT cache API calls to ensure fresh movie data
  if (url.includes('api.themoviedb.org') || url.includes('/api/')) {
      return; 
  }

  // Strategy: Serve from cache if available, otherwise fetch from network
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(fetchRes => {
        // Cache dynamically the images, but limit them to MAX_IMAGES to save storage
        if (url.includes('tmdb.org/t/p/')) {
            return caches.open(IMAGE_CACHE_NAME).then(cache => {
                cache.put(event.request, fetchRes.clone());
                // Clean up old cached images to free space
                cache.keys().then(keys => {
                    if (keys.length > MAX_IMAGES) {
                        cache.delete(keys[0]); // Remove the oldest image
                    }
                });
                return fetchRes;
            });
        }
        return fetchRes;
      });
    }).catch(() => {
        // Fallback if both network and cache fail
        return caches.match('/index.html');
    })
  );
});
