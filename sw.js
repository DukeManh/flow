// Service Worker for Flow PWA
const CACHE_NAME = 'flow-cache-v1.1';
const urlsToCache = [
  './',
  './index.html',
  './focus.html',
  './manifest.json',
  './css/base.css',
  './css/layout.css',
  './css/header.css',
  './css/timer.css',
  './css/goals.css',
  './css/todos.css',
  './css/music.css',
  './css/history.css',
  './css/responsive.css',
  './css/animations.css',
  './css/projects.css',
  './css/focus.css',
  './js/app.js',
  './js/global.js',
  './js/timer.js',
  './js/timerCore.js',
  './js/goals.js',
  './js/todos.js',
  './js/music.js',
  './js/history.js',
  './js/projects.js',
  './js/settings.js',
  './js/storage.js',
  './js/themes.js',
  './js/utils.js',
  './js/animations.js',
  './js/sound.js',
  './js/constants.js',
  './js/focus.js',
  './js/simulate.js',
  './assets/sounds/button.wav',
  './assets/sounds/alarm-bell.wav',
  './assets/images/favicon.ico',
  './assets/images/icon-square-192.png',
  './assets/images/icon-square-512.png'
];

// Install event - cache app shell resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Return the response as-is for non-GET requests or if status is not 200
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});