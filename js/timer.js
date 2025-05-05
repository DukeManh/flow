// Timer functionality for the Flow State app
import { TIMER_PRESETS } from './constants.js';
import { formatTime } from './utils.js';
import { recordSession } from './history.js';
import { TimerCore } from './timerCore.js';
import { triggerFlowAnimation } from './animations.js';

// Timer core instance
let timerCore;

// Timer elements
let timerEl, progressEl;
let startBtn, pauseBtn, endBtn, resetBtn;

export function initTimer() {
  // Get DOM elements
  timerEl = document.getElementById('timer');
  progressEl = document.getElementById('progress');
  startBtn = document.getElementById('startBtn');
  pauseBtn = document.getElementById('pauseBtn');
  endBtn = document.getElementById('endBtn');
  resetBtn = document.getElementById('resetBtn');

  // Show initial value while timer is initializing
  if (timerEl) {
    timerEl.textContent = formatTime(TIMER_PRESETS.default.work);
  }

  // Initialize timer core
  timerCore = new TimerCore({
    // Set up callbacks
    onSessionEnd: recordSession,
    getTodos: getTodos,
    // Add a custom UI update callback to handle the timer title updates
    updateUI: (state) => {
      // Update the timer title when state changes
      updateTimerTitle(state.currentPreset);
    },
    // Add onSessionStart callback to trigger the Flow animation
    onSessionStart: () => {
      // Trigger the flow animation when a new session starts
      triggerFlowAnimation(4000); // Animation will last for 4 seconds
    }
  });
  
  // Provide DOM elements to timer core
  timerCore.initElements({
    timer: timerEl,
    progress: progressEl,
    startBtn: startBtn,
    pauseBtn: pauseBtn,
    endBtn: endBtn,
    resetBtn: resetBtn,
    timerLabel: document.getElementById('timerLabel')
  });
}

// Update timer preset based on settings
export function updateTimerPreset(presetKey) {
  if (!TIMER_PRESETS[presetKey]) {
    console.error('Invalid timer preset:', presetKey);
    return;
  }
  
  // Update core timer preset
  timerCore.updatePreset(presetKey);
  
  // Update timer title based on preset
  updateTimerTitle(presetKey);
}

// Update timer title based on preset
function updateTimerTitle(presetKey) {
  const timerLabel = document.getElementById('timerLabel');
  const titleElement = document.querySelector('#timerCard h2');
  
  if (!titleElement || !timerLabel) return;
  
  // Set the appropriate title based on preset
  switch(presetKey) {
    case 'pomodoro':
      titleElement.innerHTML = '<i class="fas fa-stopwatch"></i> 25/5 Pomodoro<span class="tooltip" title="Pomodoro technique with short cycles"><i class="fas fa-info-circle"></i></span>';
      break;
    case 'deepWork':
      titleElement.innerHTML = '<i class="fas fa-stopwatch"></i> 90/20 Deep Work<span class="tooltip" title="Extended focus time for complex tasks requiring deep concentration"><i class="fas fa-info-circle"></i></span>';
      break;
    default: // default is 52/17
      titleElement.innerHTML = '<i class="fas fa-stopwatch"></i> 52/17 Rule<span class="tooltip" title="52 minutes of concentrated work time followed by a 17-minute break"><i class="fas fa-info-circle"></i></span>';
      break;
  }
}

// Save timer state to storage - expose this function for external use
export async function saveTimerState() {
  // Simply delegate to timerCore
  if (timerCore) {
    await timerCore.saveState();
  }
}

// Get current todos (for history recording)
function getTodos() {
  const todoList = document.getElementById('todoList');
  if (!todoList) return [];
  
  return Array.from(todoList.children).map(li => ({
    text: li.querySelector('.todo-text')?.textContent || '',
    completed: li.querySelector('input')?.checked || false
  }));
}