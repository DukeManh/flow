// Theme management for the Flow State app

// Theme elements
let themeDropdown, themeDropdownBtn, themeOptions;

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
      option.addEventListener('click', () => {
        const selectedTheme = option.dataset.theme;
        localStorage.setItem('selectedTheme', selectedTheme);
        
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

// Load saved theme from localStorage
export function loadTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'midnight';
  
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
  // This is a simple check - in production you might want a more robust solution
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