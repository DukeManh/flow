// Theme management for the Flow State app
import storageService from './storage.js';

// Theme elements
let themeDropdown, themeDropdownBtn, themeOptions;

// Storage keys
const STORAGE_KEYS = {
  SELECTED_THEME: 'selectedTheme'
};

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
        
        loadTheme();
        
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
export async function loadTheme() {
  try {
    const savedTheme = await getSelectedThemeFromStorage();
    
    // Remove any existing theme classes
    document.body.classList.remove('dark', 'nature', 'midnight', 'slate', 'carbon', 'mocha');
    
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
  } catch (error) {
    console.error('Error loading theme:', error);
    // Default to midnight theme if there's an error
    document.body.classList.add('midnight');
    updateThemeColorMetaTag('midnight');
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