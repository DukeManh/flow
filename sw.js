// Service Worker for Flow PWA
const CACHE_NAME = 'flow-cache-v2.0.4'; // Incremented version to force update
const SW_VERSION = '2025-05-13'; // Version identifier with date
const DEV_HOSTNAMES = ['localhost', 'dev.local']; // Development hostnames to bypass caching

// Check if we're on a development environment
function isDevEnvironment() {
  return DEV_HOSTNAMES.includes(self.location.hostname);
}

const urlsToCache = [
  './',
  './index.html',
  './focus.html',
  './manifest.json',
  './themes.json',
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
  './css/theme.css',
  './css/themes/theme-light.css',
  './css/themes/theme-dark.css',
  './css/themes/theme-nature.css',
  './css/themes/theme-midnight.css',
  './css/themes/theme-slate.css',
  './css/themes/theme-carbon.css',
  './css/themes/theme-mocha.css',
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

// Variable to store themes configuration
let themesConfig = null;
let currentTheme = 'midnight'; // Default theme

// Function to load themes configuration
async function loadThemesConfig() {
  if (themesConfig !== null) return themesConfig;
  
  try {
    // Try to get from cache first in case we're offline
    const cacheResponse = await caches.match('./themes.json');
    if (cacheResponse) {
      themesConfig = await cacheResponse.json();
      return themesConfig;
    }
    
    // If not in cache, try fetching from network
    const response = await fetch('./themes.json');
    themesConfig = await response.json();
    return themesConfig;
  } catch (error) {
    console.error('Error loading themes config:', error);
    // Provide a default configuration when offline
    return {
      themes: {
        'midnight': './css/themes/theme-midnight.css',
        'slate': './css/themes/theme-slate.css',
        'light': './css/themes/theme-light.css'
      },
      defaultTheme: 'midnight'
    };
  }
}

// Helper function to get theme CSS path
async function getThemeCssPath(theme) {
  const config = await loadThemesConfig();
  return config.themes[theme] || config.themes[config.defaultTheme];
}

// Install event - cache app shell resources
self.addEventListener('install', event => {
  console.log(`[SW] Installing new service worker version ${SW_VERSION}`);
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
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
  console.log(`[SW] Activating new service worker version ${SW_VERSION}`);
  const cacheWhitelist = [CACHE_NAME];
  
  // Take control of all clients immediately
  event.waitUntil(
    Promise.all([
      // Claim clients so the page is controlled immediately
      self.clients.claim(),
      
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log(`[SW] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
    ])
  );
  
  // Notify all clients that the SW has been updated
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SW_UPDATED',
        version: SW_VERSION
      });
    });
  });
});

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'SET_THEME') {
    console.log('Service Worker: Setting theme to', event.data.theme);
    currentTheme = event.data.theme;
    
    try {
      // Clear the theme CSS from cache to ensure we serve the new one
      const cache = await caches.open(CACHE_NAME);
      const requests = await cache.keys();
      
      // Find all theme-related requests
      const themeRequests = requests.filter(request => 
        request.url.endsWith('/css/theme.css') || 
        request.url.includes('/css/themes/theme-')
      );
      
      // Delete them all to ensure clean slate
      await Promise.all(themeRequests.map(request => cache.delete(request)));
      
      // Pre-cache the new theme file to speed up subsequent loads
      const themePath = await getThemeCssPath(currentTheme);
      await cache.add(new Request(themePath));
      
      console.log('Service Worker: Theme cache updated for', currentTheme);
      
      // Respond to confirm theme change
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ 
          success: true, 
          theme: currentTheme,
          message: 'Theme updated and cache cleared'
        });
      }
    } catch (error) {
      console.error('Service Worker: Error updating theme cache:', error);
      
      // Respond with error
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ 
          success: false, 
          theme: currentTheme,
          error: error.message
        });
      }
    }
  }
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip extension protocol URLs which can't be cached
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'about:') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // In development environments (localhost, dev.local), always go to network first
  // This ensures you're always seeing the latest changes during development
  if (isDevEnvironment()) {
    console.log(`[SW] Development environment detected - bypassing cache for: ${url.pathname}`);
    event.respondWith(
      fetch(event.request)
        .then(response => {
          return response;
        })
        .catch(error => {
          console.error('Network fetch failed in dev mode:', error);
          // If network fetch fails, try cache as fallback
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Special handling for theme.css
  if (url.pathname.endsWith('/css/theme.css')) {
    event.respondWith(handleThemeRequest(event.request));
    return;
  }
  
  // Default handling for other requests
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // No cache match - fetch from network
        return fetch(event.request).then(
          response => {
            // Return the response as-is for non-GET requests or if status is not 200
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();

            // Cache the fetched response
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              })
              .catch(error => {
                console.error('Cache put error:', error);
              });

            return response;
          }
        ).catch(error => {
          console.error('Fetch failed:', error);
          // For HTML requests, try to return the index page as fallback
          if (event.request.headers.get('Accept') && 
              event.request.headers.get('Accept').includes('text/html')) {
            return caches.match('./index.html');
          }
          throw error;
        });
      })
  );
});

// Function to handle theme.css requests
async function handleThemeRequest(request) {
  try {
    // Get the theme CSS file path based on current theme
    const themePath = await getThemeCssPath(currentTheme);
    
    // Try to get from cache first
    const cacheResponse = await caches.match(themePath);
    if (cacheResponse) {
      return cacheResponse;
    }
    
    // If not in cache, try fetching from network
    const themeResponse = await fetch(new Request(themePath));
    
    // Create a new response with the theme CSS content
    return new Response(await themeResponse.text(), {
      headers: {
        'Content-Type': 'text/css',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Error handling theme request:', error);
    
    // Try to get the default theme from cache
    try {
      const defaultThemeCache = await caches.match('./css/themes/theme-midnight.css');
      if (defaultThemeCache) {
        return defaultThemeCache;
      }
    } catch (e) {
      console.error('Failed to get default theme from cache:', e);
    }
    
    // Last resort fallback - return a minimal theme definition 
    return new Response(
      `:root {
        --bg: #1c2431;
        --surface: #2d3748;
        --text: #e9ecef;
        --text-secondary: #b8c2cc;
        --accent: #3f80ea;
        --error: #e73d4a;
        --success: #28a745;
      }`, 
      { headers: { 'Content-Type': 'text/css' } }
    );
  }
}