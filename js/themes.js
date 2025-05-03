// Theme management for the Flow State app

// Theme elements
let themeDropdown, themeDropdownBtn, themeOptions;

// Initialize theme functionality
export function initThemes() {
  themeDropdown = document.querySelector('.theme-dropdown');
  themeDropdownBtn = document.getElementById('themeDropdownBtn');
  themeOptions = document.querySelectorAll('.theme-option');

  // Toggle dropdown visibility
  themeDropdownBtn.addEventListener('click', () => {
    themeDropdown.classList.toggle('active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!themeDropdown.contains(e.target)) {
      themeDropdown.classList.remove('active');
    }
  });

  // Theme option click handler
  themeOptions.forEach(option => {
    option.addEventListener('click', () => {
      const selectedTheme = option.dataset.theme;
      localStorage.setItem('selectedTheme', selectedTheme);
      
      // Update active state
      themeOptions.forEach(opt => opt.classList.remove('active'));
      option.classList.add('active');
      
      loadTheme();
      
      // Close dropdown
      themeDropdown.classList.remove('active');
    });
  });

  // Setup distraction toggle
  document.getElementById('distractionToggle').addEventListener('click', () => {
    document.body.classList.toggle('distraction');
  });

  // Load theme on init
  loadTheme();
}

// Load saved theme from localStorage
export function loadTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'dark';
  
  // Remove any existing theme classes
  document.body.classList.remove('dark', 'nature', 'ocean', 'sunset', 'midnight', 'mint');
  
  // If the theme is not default, add the class
  if (savedTheme !== 'default') {
    document.body.classList.add(savedTheme);
  }
  
  // Update the active state in dropdown
  themeOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.theme === savedTheme);
  });
  
  // Update dropdown button icon based on theme
  updateThemeIcon(savedTheme);
}

// Set theme icon based on current theme
function updateThemeIcon(theme) {
  const iconEl = themeDropdownBtn.querySelector('.current-theme-icon');
  
  // Theme-specific icons
  switch(theme) {
    case 'default':
      iconEl.textContent = '☀️';
      break;
    case 'dark':
      iconEl.textContent = '🌙';
      break;
    case 'nature':
      iconEl.textContent = '🌿';
      break;
    case 'ocean':
      iconEl.textContent = '🌊';
      break;
    case 'sunset':
      iconEl.textContent = '🌅';
      break;
    case 'midnight':
      iconEl.textContent = '✨';
      break;
    case 'mint':
      iconEl.textContent = '🧊';
      break;
    default:
      iconEl.textContent = '🎨';
  }
}