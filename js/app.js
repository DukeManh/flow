// Main application file for the Flow State app
import { initSounds } from './sound.js';
import { initThemes } from './themes.js';
import { initTimer, saveTimerState } from './timer.js';
import { initGoals } from './goals.js';
import { initTodos } from './todos.js';
import { initHistory } from './history.js';
import { initMusic } from './music.js';

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

// Initialize all app modules
function init() {
  // Initialize all modules
  initSounds();
  initThemes();
  initDateTime();
  initGoals();
  initTodos();
  const currentVideoID = initMusic();
  initHistory(currentVideoID);
  initTimer();
}

// Handle page unload to ensure we save the current state
window.addEventListener('beforeunload', saveTimerState);

// Initialize the app when DOM is fully loaded
window.addEventListener('load', init);