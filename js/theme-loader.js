/**
 * Initial theme loader for Flow app
 * This script loads the user's preferred theme immediately before the page renders
 * to avoid Flash of inaccurate color theme (FART)
 */
(function() {
  try {
    // Check if service worker is available
    const hasServiceWorker = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
    
    // Use the same storage key as the main app
    const THEME_STORAGE_KEY = 'selectedTheme';
    
    // Get saved theme or use midnight as default
    // We use direct localStorage access for speed since this needs to run synchronously
    let savedTheme;
    try {
      savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      // If no theme is saved or service worker is not available, default to midnight
      if (!savedTheme || !hasServiceWorker) {
        savedTheme = 'midnight';
      }
    } catch (storageError) {
      console.warn('Could not access theme from storage:', storageError);
      savedTheme = 'midnight';
    }
    
    // Create link element for theme CSS
    const themeLink = document.createElement('link');
    themeLink.id = 'dynamic-theme-css';
    themeLink.rel = 'stylesheet';
    themeLink.href = `./css/themes/theme-${savedTheme === 'default' ? 'light' : savedTheme}.css`;
    
    // Add it to head immediately
    document.head.appendChild(themeLink);
    
    // Log theme loading information
    if (!hasServiceWorker) {
      console.info('Service worker not available, using midnight theme as default');
    }
    
    // Also add the theme class to body for backward compatibility
    document.addEventListener('DOMContentLoaded', function() {
      if (savedTheme !== 'default') {
        document.body.classList.add(savedTheme);
      }
    });
  } catch (e) {
    console.error('Error in initial theme loading:', e);
    
    // Fallback to midnight theme if there's an error
    try {
      const fallbackLink = document.createElement('link');
      fallbackLink.id = 'dynamic-theme-css';
      fallbackLink.rel = 'stylesheet';
      fallbackLink.href = './css/themes/theme-midnight.css';
      document.head.appendChild(fallbackLink);
      
      document.addEventListener('DOMContentLoaded', function() {
        document.body.classList.add('midnight');
      });
    } catch (fallbackError) {
      console.error('Fallback theme loading failed:', fallbackError);
    }
  }
})();