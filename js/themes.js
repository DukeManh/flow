// Theme management for the Flow State app
import storageService from './storage.js';

// Theme elements
let themeDropdown, themeDropdownBtn, themeOptions;

// Storage keys
const STORAGE_KEYS = {
  SELECTED_THEME: 'selectedTheme'
};

// Function to check if service worker is available
function isServiceWorkerAvailable() {
  return 'serviceWorker' in navigator && navigator.serviceWorker.controller;
}

// Function to update theme in service worker
async function updateServiceWorkerTheme(theme) {
  if (!isServiceWorkerAvailable()) {
    console.log('Service worker not available for theme update');
    // Wait for service worker to be ready
    try {
      await waitForServiceWorker();
    } catch (error) {
      console.error('Service worker never became ready:', error);
      return false;
    }
  }
  
  try {
    // Create a message channel for response
    const messageChannel = new MessageChannel();
    
    // Create a promise that resolves when we get a response
    const responsePromise = new Promise((resolve) => {
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
    });
    
    // Send the message to the service worker
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_THEME',
      theme: theme
    }, [messageChannel.port2]);
    
    // Wait for the response
    const response = await responsePromise;
    console.log('Theme update response from SW:', response);
    return response.success;
  } catch (error) {
    console.error('Error updating service worker theme:', error);
    return false;
  }
}

// Function to wait for service worker to be ready
function waitForServiceWorker(timeout = 5000) {
  return new Promise((resolve, reject) => {
    // If service worker is already controlling the page, resolve immediately
    if (navigator.serviceWorker.controller) {
      return resolve();
    }
    
    // Set a timeout to reject the promise
    const timeoutId = setTimeout(() => {
      reject(new Error('Service worker registration timed out'));
    }, timeout);
    
    // Listen for controllerchange event
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      clearTimeout(timeoutId);
      resolve();
    });
    
    // Also check if we have a pending installation
    navigator.serviceWorker.ready.then(() => {
      if (navigator.serviceWorker.controller) {
        clearTimeout(timeoutId);
        resolve();
      }
    });
  });
}

// Storage utility functions
async function getSelectedThemeFromStorage() {
  try {
    return await storageService.getItem(STORAGE_KEYS.SELECTED_THEME) || 'midnight';
  } catch (error) {
    console.error('Error getting selected theme from storage:', error);
    return 'midnight'; // Default theme
  }
}

async function saveSelectedThemeToStorage(theme) {
  try {
    await storageService.setItem(STORAGE_KEYS.SELECTED_THEME, theme);
    return true;
  } catch (error) {
    console.error('Error saving selected theme to storage:', error);
    return false;
  }
}

// Function to directly load theme CSS without service worker
async function loadThemeCssDirectly(theme) {
  try {
    // Get the theme path from the themes.json file
    const themesConfigResponse = await fetch('./themes.json');
    const themesConfig = await themesConfigResponse.json();
    
    // Get the path for the requested theme
    const themePath = themesConfig.themes[theme] || themesConfig.themes[themesConfig.defaultTheme];
    
    // Check if we already have this theme CSS loaded
    const existingThemeLink = document.getElementById('dynamic-theme-css');
    
    if (existingThemeLink) {
      // Update the existing link element
      existingThemeLink.href = themePath;
    } else {
      // Create a new link element for the theme CSS
      const themeLink = document.createElement('link');
      themeLink.id = 'dynamic-theme-css';
      themeLink.rel = 'stylesheet';
      themeLink.href = themePath;
      
      // Remove the default theme.css which might be importing the wrong theme
      const defaultThemeLink = document.querySelector('link[href*="theme.css"]');
      if (defaultThemeLink) {
        defaultThemeLink.remove();
      }
      
      // Add the new theme link to the head
      document.head.appendChild(themeLink);
    }
    
    console.log('Theme CSS loaded directly:', themePath);
    return true;
  } catch (error) {
    console.error('Error loading theme CSS directly:', error);
    return false;
  }
}

// Initialize theme functionality
export function initThemes() {
  themeDropdown = document.querySelector('.theme-dropdown');
  themeDropdownBtn = document.getElementById('themeDropdownBtn');
  themeOptions = document.querySelectorAll('.theme-option');

  // Only add theme dropdown functionality if elements exist (main page only)
  if (themeDropdown && themeDropdownBtn) {
    // Toggle dropdown visibility
    themeDropdownBtn.addEventListener('click', () => {
      themeDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (themeDropdown && !themeDropdown.contains(e.target)) {
        themeDropdown.classList.remove('active');
      }
    });
  }

  // Theme option click handlers - only on main page
  if (themeOptions && themeOptions.length > 0) {
    themeOptions.forEach(option => {
      option.addEventListener('click', async () => {
        const selectedTheme = option.dataset.theme;
        await saveSelectedThemeToStorage(selectedTheme);
        
        // Update active state
        themeOptions.forEach(opt => opt.classList.remove('active'));
        option.classList.add('active');
        
        // Load theme with force reload to ensure theme changes are applied
        loadTheme(true);
        
        // Close dropdown
        if (themeDropdown) {
          themeDropdown.classList.remove('active');
        }
      });
    });
  }

  // Setup distraction toggle - only add if element exists (main page only)
  const distractionToggle = document.getElementById('distractionToggle');
  if (distractionToggle) {
    distractionToggle.addEventListener('click', () => {
      window.location.href = 'focus.html';
    });
  }

  // Load theme on init (works on both pages)
  loadTheme();
}

// Load saved theme from storage
export async function loadTheme(forceReload = false) {
  try {
    const savedTheme = await getSelectedThemeFromStorage();
    
    // Remove any existing theme classes
    document.body.classList.remove('dark', 'nature', 'midnight', 'slate', 'carbon', 'mocha', 'retro');
    
    // If the theme is not default, add the class
    if (savedTheme !== 'default') {
      document.body.classList.add(savedTheme);
    }
    
    // Update the active state in dropdown (only on main page)
    if (themeOptions) {
      themeOptions.forEach(option => {
        option.classList.toggle('active', option.dataset.theme === savedTheme);
      });
    }
    
    // Update dropdown button icon based on theme (only on main page)
    updateThemeIcon(savedTheme);
    
    // Update theme-color meta tag to match current theme
    updateThemeColorMetaTag(savedTheme);
    
    // First, check if service worker is available
    if (isServiceWorkerAvailable()) {
      // Try to update the theme using the service worker approach
      const success = await updateServiceWorkerTheme(savedTheme);
      
      // If forceReload is true and service worker theme was updated successfully,
      // reload the page to apply the theme change
      if (forceReload && success) {
        console.log('Reloading page to apply theme change...');
        window.location.reload();
        return;
      }
      
      // If service worker update failed, fall back to direct CSS loading
      if (!success) {
        console.log('Service worker theme update failed, using fallback...');
        await loadThemeCssDirectly(savedTheme);
      }
    } else {
      // No service worker available, use fallback directly
      console.log('No service worker available, using CSS fallback for theme...');
      await loadThemeCssDirectly(savedTheme);
      
      // If force reload was requested, we'll need to reload the page
      // since we've changed the CSS directly
      if (forceReload) {
        console.log('Reloading page to apply theme change...');
        window.location.reload();
      }
    }
  } catch (error) {
    console.error('Error loading theme:', error);
    // Default to midnight theme if there's an error
    document.body.classList.add('midnight');
    updateThemeColorMetaTag('midnight');
    
    // Try direct fallback as last resort
    try {
      await loadThemeCssDirectly('midnight');
    } catch (fallbackError) {
      console.error('Fallback theme loading also failed:', fallbackError);
    }
  }
}

// Function to update theme-color meta tag based on current theme
function updateThemeColorMetaTag(theme) {
  // Get the theme-color meta tag
  let metaThemeColor = document.querySelector('meta[name="theme-color"]');
  
  // If it doesn't exist, create it
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  
  // Set the content based on the current theme
  let themeColor;
  
  switch (theme) {
    case 'default':
      themeColor = '#ffffff'; // Light theme
      break;
    case 'dark':
      themeColor = '#1e1e1e';
      break;
    case 'nature':
      themeColor = '#f5f7ed';
      break;
    case 'midnight':
      themeColor = '#0f1729';
      break;
    case 'slate':
      themeColor = '#1c2431';
      break;
    case 'carbon':
      themeColor = '#121212';
      break;
    case 'mocha':
      themeColor = '#272220';
      break;
    case 'retro':
      themeColor = '#14031e';
      break;
    default:
      themeColor = '#ffffff';
  }
  
  metaThemeColor.content = themeColor;
}

// Set theme icon based on current theme
function updateThemeIcon(theme) {
  if (!themeDropdownBtn) return;
  
  const iconEl = themeDropdownBtn.querySelector('.current-theme-icon');
  if (!iconEl) return;
  
  // Theme-specific icons with Font Awesome
  iconEl.innerHTML = ''; // Clear any existing content
  
  let icon = document.createElement('i');
  icon.className = 'fas '; // Base Font Awesome class
  
  // Add theme-specific icon class
  switch (theme) {
    case 'default':
      icon.className += 'fa-sun';
      break;
    case 'dark':
      icon.className += 'fa-moon';
      break;
    case 'nature':
      icon.className += 'fa-leaf';
      break;
    case 'midnight':
      icon.className += 'fa-star';
      break;
    case 'slate':
      icon.className += 'fa-shield-alt';
      break;
    case 'carbon':
      icon.className += 'fa-square';
      break;
    case 'mocha':
      icon.className += 'fa-coffee';
      break;
    case 'retro':
      icon.className += 'fa-bolt';
      break;
    default:
      icon.className += 'fa-palette';
  }
  
  iconEl.appendChild(icon);
}

// Helper function to handle fallbacks for unavailable Font Awesome icons
function isFontAwesomeIconAvailable(iconClass) {
  const tempIcon = document.createElement('i');
  tempIcon.className = iconClass;
  document.body.appendChild(tempIcon);
  
  const computedStyle = window.getComputedStyle(tempIcon);
  const isAvailable = computedStyle.content !== '' && 
                     computedStyle.content !== 'none' && 
                     computedStyle.fontFamily.includes('Font Awesome');
  
  document.body.removeChild(tempIcon);
  return isAvailable;
}