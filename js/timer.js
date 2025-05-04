// Timer functionality for the Flow State app
import { TIMER_PRESETS } from './constants.js';
import { formatTime } from './utils.js';
import { playSound, getStartSound, getEndSound, getPauseSound } from './sound.js';
import { recordSession } from './history.js';

// Timer state
let currentPreset = 'default';
let workDuration = TIMER_PRESETS.default.work;
let breakDuration = TIMER_PRESETS.default.break;
let rem = workDuration;
let onBreak = false;
let iv;
let startTime = null;
let isRunning = false;

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

  // Add event listeners
  startBtn.addEventListener('click', () => { 
    start(); 
    updateDisplay(); 
  });
  pauseBtn.addEventListener('click', pause);
  endBtn.addEventListener('click', endSession);
  resetBtn.addEventListener('click', reset);

  // Load previous state
  loadTimerState();
}

// Update timer preset based on settings
export function updateTimerPreset(presetKey) {
  if (!TIMER_PRESETS[presetKey]) {
    console.error('Invalid timer preset:', presetKey);
    return;
  }
  
  currentPreset = presetKey;
  workDuration = TIMER_PRESETS[presetKey].work;
  breakDuration = TIMER_PRESETS[presetKey].break;
  
  // Reset the timer if not currently running
  if (!isRunning) {
    rem = onBreak ? breakDuration : workDuration;
    updateDisplay();
  }
  
  // Update timer title based on preset
  updateTimerTitle(presetKey);
  
  // Save the updated state
  saveTimerState();
}

// Update timer title based on preset
function updateTimerTitle(presetKey) {
  const timerLabel = document.getElementById('timerLabel');
  const titleElement = document.querySelector('#timerCard h2');
  
  if (!titleElement || !timerLabel) return;
  
  // Set the appropriate title based on preset
  switch(presetKey) {
    case 'pomodoro':
      titleElement.innerHTML = '<i class="fas fa-stopwatch"></i> 25/5<span class="tooltip" title="Pomodoro technique with shorter cycles"><i class="fas fa-info-circle"></i></span>';
      break;
    case 'deepWork':
      titleElement.innerHTML = '<i class="fas fa-stopwatch"></i> 90/20<span class="tooltip" title="Extended focus time for complex tasks requiring deep concentration"><i class="fas fa-info-circle"></i></span>';
      break;
    default: // default is 52/17
      titleElement.innerHTML = '<i class="fas fa-stopwatch"></i> 52/17 Rule<span class="tooltip" title="Engage in 52 minutes of uninterrupted focus followed by a 17-minute restorative break"><i class="fas fa-info-circle"></i></span>';
      break;
  }
  
  // Update the timer label
  if (!onBreak) {
    timerLabel.textContent = "Focus Time";
  }
}

// Load timer state from localStorage
function loadTimerState() {
  const savedState = localStorage.getItem('timerState');
  if (savedState) {
    const state = JSON.parse(savedState);
    rem = state.rem;
    onBreak = state.onBreak;
    currentPreset = state.currentPreset || 'default';
    
    // Reload preset durations
    workDuration = TIMER_PRESETS[currentPreset].work;
    breakDuration = TIMER_PRESETS[currentPreset].break;
    
    // Validate startTime - if it's more than the work duration old, reset it
    const now = Date.now();
    if (state.startTime && (now - state.startTime > workDuration * 1000)) {
      startTime = null; // Reset if more than work duration old
      isRunning = false; // Also don't auto-resume
    } else {
      startTime = state.startTime;
      isRunning = state.isRunning;
    }
    
    updateDisplay();
    updateBreakUI();
    
    if (isRunning) {
      start(false); // Resume timer without resetting startTime
    } else {
      updateControls();
    }
  }
}

// Save timer state to localStorage
export function saveTimerState() {
  const state = {
    rem,
    onBreak,
    startTime,
    isRunning,
    currentPreset
  };
  localStorage.setItem('timerState', JSON.stringify(state));
}

// Update timer controls visibility and state
function updateControls(running) { 
  isRunning = running;
  
  if (onBreak) {
    startBtn.disabled = running;
    startBtn.textContent = running ? "Break Running" : "Start Break";
    pauseBtn.disabled = true;
    pauseBtn.style.display = 'none';
    resetBtn.disabled = true;
    resetBtn.style.display = 'none';
    endBtn.disabled = !running;
    endBtn.textContent = "Skip Break";
  } else {
    startBtn.disabled = running; 
    startBtn.textContent = "Lock In";
    pauseBtn.disabled = !running;
    pauseBtn.style.display = '';
    endBtn.disabled = !running;
    endBtn.textContent = "End";
    resetBtn.disabled = !running;
    resetBtn.style.display = '';
  }
  
  saveTimerState();
}

// Update UI elements for break/work modes
function updateBreakUI() {
  if (onBreak) {
    timerEl.style.color = 'var(--muted)';
    document.getElementById('timerLabel').textContent = "Break Time";
  } else {
    timerEl.style.color = 'var(--accent)';
    document.getElementById('timerLabel').textContent = "Focus Time";
  }
}

// Update timer display and progress bar
function updateDisplay() {
  timerEl.textContent = formatTime(rem);
  
  if (onBreak) {
    // For break, show progress of break time used
    progressEl.style.width = (100 * (breakDuration - rem) / breakDuration) + '%';
  } else {
    // For work, show progress of work time used
    progressEl.style.width = (100 * (workDuration - rem) / workDuration) + '%';
  }
  
  saveTimerState();
}

// Start a break
function startBreak() {
  onBreak = true;
  rem = breakDuration;
  updateBreakUI();
  updateDisplay();
  updateControls(false);
}

// End a break
function endBreak() {
  onBreak = false;
  rem = workDuration;
  startTime = null;
  clearInterval(iv);
  updateBreakUI();
  updateDisplay();
  updateControls(false);
}

// Start timer
function start(resetStartTime = true) {
  updateControls(true);
  if (resetStartTime && !onBreak) startTime = Date.now();
  iv = setInterval(() => {
    rem--;
    updateDisplay();
    if (rem <= 0) {
      clearInterval(iv);
      
      if (onBreak) {
        // Break ended
        playSound(getEndSound());
        endBreak();
      } else {
        // Work session ended
        recordSession(startTime, getTodos());
        playSound(getEndSound());
        startBreak();
      }
    }
  }, 1000);
  playSound(getStartSound());
}

// Get current todos (for history recording)
function getTodos() {
  const todoList = document.getElementById('todoList');
  return Array.from(todoList.children).map(li => ({
    text: li.querySelector('.todo-text').textContent,
    completed: li.querySelector('input').checked
  }));
}

// Pause timer
function pause() {
  const reason = prompt('Why pause? Provide reason:');
  if (!reason || !reason.trim()) {
    alert('Pause cancelled');
    return;
  }
  clearInterval(iv);
  updateControls(false);
  playSound(getPauseSound());
}

// End current session
function endSession() {
  if (onBreak) {
    // Skip break
    if (!confirm('Skip the rest of your break?')) return;
    clearInterval(iv);
    endBreak();
  } else {
    // End work session
    if (!confirm('End session early?')) return;
    clearInterval(iv);
    recordSession(startTime, getTodos());
    playSound(getEndSound());
    startBreak();
  }
}

// Reset timer
function reset() {
  if (!confirm('Reset session?')) return;
  clearInterval(iv);
  rem = workDuration;
  startTime = null;
  updateControls(false);
  updateDisplay();
  playSound(getPauseSound());
}