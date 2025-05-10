// Main application file for the Flow State app
import { initSounds } from './sound.js';
import { initThemes } from './themes.js';
import { initTimer, saveTimerState } from './timer.js';
import { initGoals, loadGoal, migrateGoalToProject } from './goals.js';
import { initTodos, loadTodos, migrateTodosToProject } from './todos.js';
import { initHistory } from './history.js';
import { initMusic } from './music.js';
import { initAnimations, cleanupAnimations } from './animations.js';
import { initProjects, cleanupDuplicateProjects } from './projects.js';
import { initSettings } from './settings.js';
import storageService from './storage.js';

// Initialize scrolling header effect
function initScrollingHeader() {
  const header = document.querySelector('.header');
  const scrollThreshold = 10;
  
  // Add scroll event listener
  window.addEventListener('scroll', () => {
    if (window.scrollY > scrollThreshold) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Initialize date/time display
function initDateTime() {
  const datetimeEl = document.getElementById('datetime');
  
  function updateDateTime() { 
    const now = new Date(); 
    const opts = { weekday: 'short', month: 'short', day: 'numeric' }; 
    const dateStr = now.toLocaleDateString('en-US', opts); 
    const h = now.getHours() % 12 || 12; 
    const m = String(now.getMinutes()).padStart(2, '0'); 
    datetimeEl.textContent = `${dateStr}   ${h}:${m}`; 
  }
  
  setInterval(updateDateTime, 1000);
  updateDateTime();
}

// Initialize mobile navigation and section visibility
function initMobileNavigation() {
  const isMobile = window.innerWidth <= 600;
  const mobileNav = document.querySelector('.mobile-nav');
  const navItems = document.querySelectorAll('.mobile-nav-item');
  const allCards = document.querySelectorAll('.card');
  
  // Only show mobile nav on small screens
  if (mobileNav) {
    mobileNav.style.display = isMobile ? 'flex' : 'none';
  }
  
  if (!isMobile || !mobileNav) return;
  
  // Map sections to their corresponding cards
  const sectionMap = {
    'timer': ['#timerCard', '#goalCard'],
    'tasks': ['#todoCard'],
    'music': ['#musicCard'],
    'stats': ['#insightsCard', '#historyCard']
  };
  
  function smoothScrollTo(targetY, duration = 500) {
    const startY = window.pageYOffset;
    const difference = targetY - startY;
    let startTime = null;
    
    // Don't animate for very small distances
    if (Math.abs(difference) < 50) {
      window.scrollTo(0, targetY);
      return;
    }
    
    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Easing function for smoother animation
      const easeInOutQuad = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const run = easeInOutQuad(progress);
      
      window.scrollTo(0, startY + difference * run);
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }
    
    // Flag for scroll spy handling
    isScrolling = true;
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => {
      isScrolling = false;
    }, duration + 50);
    
    requestAnimationFrame(animation);
  }
  
  // Function to scroll to the first card of the selected section
  function scrollToSection(sectionName) {
    // Get the cards for this section
    const cardsToShow = sectionMap[sectionName] || [];
    if (cardsToShow.length === 0) return;
    
    // Get the first card of the section
    const firstCard = document.querySelector(cardsToShow[0]);
    if (!firstCard) return;
    
    // Calculate scroll position (accounting for header height with extra margin)
    const headerHeight = document.querySelector('.header').offsetHeight;
    const cardTop = firstCard.getBoundingClientRect().top + window.pageYOffset;
    const scrollTarget = cardTop - headerHeight - 16; // 16px additional padding
    
    // Smooth scroll to the section with the custom function
    smoothScrollTo(scrollTarget);
    
    // Check if the card is currently in an entrance animation
    const hasEntranceAnimation = firstCard.classList.contains('animate-fade-in-down') || 
                                firstCard.classList.contains('animate-fade-in-up') ||
                                firstCard.classList.contains('animate-scale-in');
    
    // Only add highlight animation if not already in an entrance animation
    if (!hasEntranceAnimation) {
      firstCard.classList.add('highlight-card');
      setTimeout(() => {
        firstCard.classList.remove('highlight-card');
      }, 800);
    }
    
    // Update active state in navigation
    navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.section === sectionName);
    });
    
    // Save the current section to localStorage
    localStorage.setItem('flowCurrentSection', sectionName);
  }
  
  // Add click event listeners to navigation items
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const section = item.dataset.section;
      scrollToSection(section);
    });
  });
  
  // Set all cards to be visible initially
  allCards.forEach(card => {
    card.style.display = 'block';
  });
  
  // Style for card highlight animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes card-highlight {
      0% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
      50% { transform: scale(1.02); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12); }
      100% { transform: scale(1); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); }
    }
    .highlight-card {
      animation: card-highlight 0.8s ease-out;
    }
  `;
  document.head.appendChild(style);
  
  // Track last scroll position for navbar auto-hide
  let lastScrollY = window.pageYOffset;
  let scrollingDown = false;
  let scrollTimer = null;
  
  // Handle navbar visibility on scroll
  window.addEventListener('scroll', () => {
    const currentScrollY = window.pageYOffset;
    
    // Determine scroll direction
    scrollingDown = currentScrollY > lastScrollY;
    lastScrollY = currentScrollY;
    
    // Don't hide navbar when at top of page
    if (currentScrollY < 50) {
      mobileNav.classList.remove('hidden');
      return;
    }
    
    // Show navbar when scrolling up, hide when scrolling down
    if (scrollingDown) {
      mobileNav.classList.add('hidden');
    } else {
      mobileNav.classList.remove('hidden');
    }
    
    // Don't run scroll spy if programmatic scrolling
    if (isScrolling) return;
    
    // Clear existing timer
    clearTimeout(scrollTimer);
    
    // Set a timer to run the scroll spy after scrolling stops
    scrollTimer = setTimeout(() => {
      // Get current scroll position
      const scrollPosition = window.scrollY + window.innerHeight / 3; // One third down the screen
      
      // Find the section that's currently most visible
      let currentSection = null;
      let minDistance = Infinity;
      
      // Check each section
      for (const [section, cardSelectors] of Object.entries(sectionMap)) {
        for (const selector of cardSelectors) {
          const element = document.querySelector(selector);
          if (!element) continue;
          
          const rect = element.getBoundingClientRect();
          const top = rect.top + window.pageYOffset;
          const distance = Math.abs(scrollPosition - top);
          
          if (distance < minDistance) {
            minDistance = distance;
            currentSection = section;
          }
        }
      }
      
      // Update active state if we found a section
      if (currentSection) {
        navItems.forEach(item => {
          item.classList.toggle('active', item.dataset.section === currentSection);
        });
        
        // Save current section
        localStorage.setItem('flowCurrentSection', currentSection);
      }
    }, 100);
  }, { passive: true });
  
  // Restore last selected section or default to timer with a longer delay to avoid animation conflicts
  const savedSection = localStorage.getItem('flowCurrentSection') || 'timer';
  setTimeout(() => {
    scrollToSection(savedSection);
  }, 1200); // Increased delay to allow entrance animations to complete first
  
  // Add swipe gestures for section navigation
  let touchStartX = 0;
  let touchEndX = 0;
  
  document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
  }, false);
  
  document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, false);
  
  function handleSwipe() {
    const SWIPE_THRESHOLD = 100;
    if (touchEndX < touchStartX - SWIPE_THRESHOLD) {
      // Swiped left - go to next section
      navigateToNextSection(1);
    }
    
    if (touchEndX > touchStartX + SWIPE_THRESHOLD) {
      // Swiped right - go to previous section
      navigateToNextSection(-1);
    }
  }
  
  function navigateToNextSection(direction) {
    const sections = ['timer', 'tasks', 'music', 'stats'];
    const currentSection = localStorage.getItem('flowCurrentSection') || 'timer';
    const currentIndex = sections.indexOf(currentSection);
    
    if (currentIndex === -1) return;
    
    let nextIndex = currentIndex + direction;
    
    // Loop back to start or end
    if (nextIndex < 0) nextIndex = sections.length - 1;
    if (nextIndex >= sections.length) nextIndex = 0;
    
    const nextSection = sections[nextIndex];
    scrollToSection(nextSection);
  }
  
  // Flag to prevent scroll spy during programmatic scrolling
  let isScrolling = false;
}

// Initialize app installation prompt
function initAppInstallation() {
  let deferredPrompt;
  const addHomeBtn = document.createElement('button');
  addHomeBtn.id = 'addToHomeBtn';
  addHomeBtn.innerHTML = '<i class="fas fa-download"></i> Add Flow to Home Screen';
  addHomeBtn.style.display = 'none';
  
  // Add the button to the page
  document.body.appendChild(addHomeBtn);
  
  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later
    deferredPrompt = e;
    // Update UI to notify the user they can add to home screen
    addHomeBtn.style.display = 'block';
    addHomeBtn.style.position = 'fixed';
    addHomeBtn.style.bottom = 'calc(70px + env(safe-area-inset-bottom, 0px))';
    addHomeBtn.style.right = '20px';
    addHomeBtn.style.padding = '10px 15px';
    addHomeBtn.style.backgroundColor = 'var(--primary)';
    addHomeBtn.style.color = 'white';
    addHomeBtn.style.border = 'none';
    addHomeBtn.style.borderRadius = '30px';
    addHomeBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.2)';
    addHomeBtn.style.zIndex = '900';
  });
  
  // Add click event to the 'Add to Home Screen' button
  addHomeBtn.addEventListener('click', (e) => {
    // Hide our user interface
    addHomeBtn.style.display = 'none';
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      deferredPrompt = null;
    });
  });
  
  // Handle installed app events
  window.addEventListener('appinstalled', (evt) => {
    console.log('Flow app was installed');
    addHomeBtn.style.display = 'none';
  });
}

// Create a splash screen effect like native apps
function handleAppStartup() {
  // Check if this is a standalone PWA
  const isInStandaloneMode = () => 
    (window.matchMedia('(display-mode: standalone)').matches) || 
    (window.navigator.standalone) || 
    document.referrer.includes('android-app://');
  
  if (isInStandaloneMode()) {
    // Create and show splash effect when launched as an app
    const splash = document.createElement('div');
    splash.className = 'splash-screen';
    splash.innerHTML = `
      <div class="splash-logo">
        <div class="splash-icon">
          <img src="./assets/images/icon-192.png" alt="Flow">
        </div>
        <div class="splash-app-name">Flow</div>
      </div>
    `;
    
    document.body.appendChild(splash);
    
    // Add styles for the splash screen
    const style = document.createElement('style');
    style.textContent = `
      .splash-screen {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--body-bg, #ffffff);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        animation: fadeOut 0.5s ease-in-out 0.7s forwards;
      }
      .splash-logo {
        display: flex;
        flex-direction: column;
        align-items: center;
        animation: scaleUp 0.7s ease-in-out;
      }
      .splash-icon {
        width: 80px;
        height: 80px;
        margin-bottom: 20px;
      }
      .splash-icon img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      .splash-app-name {
        font-family: 'Courier New', Courier, monospace;
        font-size: 2em;
        font-weight: 800;
        font-style: italic;
        letter-spacing: 0.05em;
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; visibility: hidden; }
      }
      @keyframes scaleUp {
        from { transform: scale(0.8); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
    `;
    
    document.head.appendChild(style);
    
    // Remove splash screen after animation completes
    setTimeout(() => {
      splash.remove();
      style.remove();
    }, 1500);
  }
}

// Handle device orientation changes
function handleOrientationChange() {
  // Update UI based on orientation
  const isLandscape = window.innerWidth > window.innerHeight;
  
  // Adjust layout for landscape mode on mobile
  if (window.innerWidth <= 900 && isLandscape) {
    document.body.classList.add('landscape');
    
    // Adjust cards to be side by side in landscape
    const container = document.querySelector('.container');
    if (container) {
      container.style.display = 'flex';
      container.style.flexWrap = 'wrap';
      container.style.justifyContent = 'space-between';
      
      // Adjust individual cards
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        card.style.width = 'calc(50% - 10px)';
      });
    }
  } else {
    // Reset to default for portrait or larger screens
    document.body.classList.remove('landscape');
    
    const container = document.querySelector('.container');
    if (container) {
      container.style.display = '';
      
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        card.style.width = '';
      });
    }
  }
}

// Function to reload project-specific data
async function reloadProjectData() {
  // Reload goals and todos
  await loadGoal();
  await loadTodos();
}

// Register global function for project switching
window.reloadProjectData = reloadProjectData;

// Initialize all app modules
async function init() {
  // Initialize animations first for immediate visual feedback
  initAnimations();
  
  // Initialize all other modules
  initSounds();
  initThemes();
  initDateTime();
  
  // Initialize projects system before goals and todos
  initProjects();
  
  // Clean up any duplicate default projects
  await cleanupDuplicateProjects();
  
  // Migrate legacy data to project system
  migrateGoalToProject();
  migrateTodosToProject();
  
  // Initialize goals and todos after projects
  initGoals();
  initTodos();
  
  const currentVideoID = initMusic();
  initHistory(currentVideoID);
  initTimer();
  initSettings();
  
  // Initialize mobile navigation
  initMobileNavigation();
  
  // Initialize app installation prompt
  initAppInstallation();
  
  // Set up handling for 'splash screen' effect
  handleAppStartup();
  
  // Listen for orientation changes to adjust the UI
  window.addEventListener('orientationchange', handleOrientationChange);
  
  // Initialize scrolling header effect
  initScrollingHeader();
  
  // Clean up animations after they've completed
  cleanupAnimations();
}

// Check if timer is running for the beforeunload warning
async function isTimerRunning() {
  try {
    const timerState = await storageService.getJSON('timerState');
    if (!timerState) return false;
    
    return timerState.isRunning;
  } catch (error) {
    console.error('Error checking timer state:', error);
    return false;
  }
}

// Handle page unload to ensure we save the current state
window.addEventListener('beforeunload', async function(event) {
  // Always save the timer state
  saveTimerState();
  
  // Show confirmation dialog only if timer is running
  if (await isTimerRunning()) {
    // Standard way to show a confirmation dialog when closing a tab
    const message = "You have an active timer running. Are you sure you want to leave?";
    event.returnValue = message; // For most browsers
    return message; // For some older browsers
  }
});

// Initialize the app when DOM is fully loaded
window.addEventListener('load', init);