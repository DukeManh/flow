// Service Worker for Flow PWA
const CACHE_NAME = 'flow-cache-v1.3.2'; // Updated for todo upload improvements
const SW_VERSION = '2025-09-30'; // Version identifier updated for todo upload features
const DEV_HOSTNAMES = ['localhost', 'dev.local', '127.0.0.1']; // Development hostnames to bypass caching

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
  './css/planner.css',
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
  './js/todoUpload.js',
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
  './js/planner.js',
  './js/adBlocker.js',
  './js/pwa.js',
  './js/theme-loader.js',
  './assets/sounds/button.wav',
  './assets/sounds/alarm-bell.wav',
  './assets/sounds/chime.wav',
  './assets/images/favicon.ico',
  './assets/images/icon-square-192.png',
  './assets/images/icon-square-512.png',
  './assets/images/icon-192.png',
  './assets/images/icon-512.png',
  './assets/images/og-image.png'
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

// Helper function to normalize URLs for better cache matching
function normalizeUrl(url) {
  const urlObj = new URL(url);
  // Remove query parameters and fragments for cache matching
  return urlObj.origin + urlObj.pathname;
}

// Enhanced cache matching function
async function matchFromCache(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Try exact match first
  let response = await cache.match(request);
  if (response) return response;
  
  // Try normalized URL match
  const normalizedUrl = normalizeUrl(request.url);
  response = await cache.match(normalizedUrl);
  if (response) return response;
  
  // Try with different URL formats for the same resource
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // If requesting from root, try with explicit index.html
  if (pathname === '/' || pathname === '') {
    response = await cache.match('./index.html');
    if (response) return response;
  }
  
  // If requesting index.html, try with root
  if (pathname.endsWith('/index.html')) {
    const rootPath = pathname.replace('/index.html', '/');
    response = await cache.match(rootPath);
    if (response) return response;
  }
  
  return null;
}

// Install event - cache app shell resources
self.addEventListener('install', event => {
  console.log(`[SW] Installing new service worker version ${SW_VERSION}`);
  
  // Skip caching in development environments
  if (isDevEnvironment()) {
    console.log('[SW] Development environment detected - skipping cache installation');
    self.skipWaiting();
    return;
  }
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Opened cache and caching resources');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Failed to cache resources:', error);
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
  
  // Skip external requests (different origins) - let them go to network
  if (url.origin !== self.location.origin) {
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
          return matchFromCache(event.request);
        })
    );
    return;
  }
  
  // Special handling for theme.css
  if (url.pathname.endsWith('/css/theme.css')) {
    event.respondWith(handleThemeRequest(event.request));
    return;
  }
  
  // Default handling for other requests - Cache First strategy
  event.respondWith(
    matchFromCache(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          console.log(`[SW] Cache hit for: ${url.pathname}`);
          return response;
        }
        
        console.log(`[SW] Cache miss for: ${url.pathname}, fetching from network`);
        
        // No cache match - fetch from network
        return fetch(event.request).then(
          response => {
            // Return the response as-is for non-GET requests or if status is not 200
            if (!response || response.status !== 200 || event.request.method !== 'GET') {
              return response;
            }

            // Clone the response since it can only be consumed once
            const responseToCache = response.clone();

            // Cache the fetched response for future use
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
                console.log(`[SW] Cached new resource: ${url.pathname}`);
              })
              .catch(error => {
                console.error('Cache put error:', error);
              });

            return response;
          }
        ).catch(error => {
          console.error(`[SW] Network fetch failed for ${url.pathname}:`, error);
          
          // Enhanced offline fallbacks
          if (event.request.headers.get('Accept')) {
            const accept = event.request.headers.get('Accept');
            
            // For HTML requests, return the cached index page
            if (accept.includes('text/html')) {
              console.log('[SW] Serving offline HTML fallback');
              return matchFromCache(new Request('./index.html')) || 
                     caches.match('./index.html');
            }
            
            // For CSS requests, try to find any cached CSS file
            if (accept.includes('text/css')) {
              console.log('[SW] CSS request failed, trying cached alternatives');
              return matchFromCache(event.request);
            }
            
            // For JS requests, try the enhanced cache matching
            if (accept.includes('application/javascript') || accept.includes('text/javascript')) {
              console.log('[SW] JS request failed, trying cached alternatives');
              return matchFromCache(event.request);
            }
          }
          
          // If no specific fallback, try one more time with enhanced matching
          return matchFromCache(event.request).then(cachedResponse => {
            if (cachedResponse) {
              console.log(`[SW] Found cached fallback for: ${url.pathname}`);
              return cachedResponse;
            }
            
            // No fallback available, throw the original error
            throw error;
          });
        });
      })
      .catch(error => {
        console.error(`[SW] Final fallback failed for ${url.pathname}:`, error);
        // Return a basic offline page response for HTML requests
        if (event.request.headers.get('Accept') && 
            event.request.headers.get('Accept').includes('text/html')) {
          return new Response(
            `<!DOCTYPE html>
            <html>
            <head>
              <title>Offline - Flow App</title>
              <style>
                body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                .offline-message { max-width: 400px; margin: 0 auto; }
              </style>
            </head>
            <body>
              <div class="offline-message">
                <h1>You're Offline</h1>
                <p>This page isn't available offline. Please check your connection and try again.</p>
                <button onclick="window.history.back()">Go Back</button>
              </div>
            </body>
            </html>`,
            { 
              headers: { 
                'Content-Type': 'text/html',
                'Cache-Control': 'no-cache'
              } 
            }
          );
        }
        
        // For non-HTML requests, throw the error
        throw error;
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