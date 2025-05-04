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