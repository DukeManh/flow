// Shared timer core functionality for Flow State app
import { TIMER_PRESETS } from './constants.js';
import { formatTime, updateDocumentTitle } from './utils.js';
import { playSound, getStartSound, getEndSound, getPauseSound } from './sound.js';
import storageService from './storage.js';

// Base timer state
export const createTimerState = () => ({
  currentPreset: 'default',
  workDuration: TIMER_PRESETS.default.work,
  breakDuration: TIMER_PRESETS.default.break,
  remainingTime: TIMER_PRESETS.default.work,
  onBreak: false,
  interval: null,
  startTime: null,
  isRunning: false
});

// Timer core functionality
export class TimerCore {
  constructor(options = {}) {
    // Storage key - allow customization for different timer instances
    this.storageKey = options.storageKey || 'timerState';
    
    // References to DOM elements that will be set by the caller
    this.elements = {
      timer: null,
      progress: null,
      startBtn: null,
      pauseBtn: null, 
      endBtn: null,
      resetBtn: null,
      timerLabel: null
    };
    
    // Set up callbacks that will be implemented by the caller
    this.callbacks = {
      onSessionEnd: options.onSessionEnd || (() => {}),
      onBreakStart: options.onBreakStart || (() => {}),
      onBreakEnd: options.onBreakEnd || (() => {}),
      getTodos: options.getTodos || (() => []),
      updateUI: options.updateUI || (() => {})
    };
    
    // Initialize timer state
    this.state = createTimerState();
  }
  
  // Initialize timer elements
  initElements(elements) {
    this.elements = { ...this.elements, ...elements };
    
    // Set up event listeners if elements are provided
    if (this.elements.startBtn) {
      this.elements.startBtn.addEventListener('click', () => {
        this.start();
        this.updateDisplay();
      });
    }
    
    if (this.elements.pauseBtn) {
      this.elements.pauseBtn.addEventListener('click', () => this.pause());
    }
    
    if (this.elements.endBtn) {
      this.elements.endBtn.addEventListener('click', () => this.endSession());
    }
    
    if (this.elements.resetBtn) {
      this.elements.resetBtn.addEventListener('click', () => this.reset());
    }
    
    // Load previous state
    this.loadState();
  }
  
  // Load timer state from storage
  async loadState() {
    try {
      const savedState = await storageService.getJSON(this.storageKey);
      if (!savedState) return;
      
      // Load all saved state values
      this.state.remainingTime = savedState.remainingTime;
      this.state.onBreak = savedState.onBreak;
      this.state.currentPreset = savedState.currentPreset || 'default';
      this.state.startTime = savedState.startTime;
      this.state.isRunning = savedState.isRunning;
      
      // Ensure we're using the correct durations from the preset
      this.state.workDuration = TIMER_PRESETS[this.state.currentPreset].work;
      this.state.breakDuration = TIMER_PRESETS[this.state.currentPreset].break;
      
      // If the timer was running, validate the start time
      if (this.state.isRunning && this.state.startTime) {
        const now = Date.now();
        const maxDuration = this.state.onBreak ? 
          this.state.breakDuration * 1000 : 
          this.state.workDuration * 1000;
        
        if (now - this.state.startTime > maxDuration) {
          // If too much time has passed, don't auto-resume
          this.state.startTime = null;
          this.state.isRunning = false;
        }
      }
      
      // Update the display and UI first before potentially starting the timer
      this.updateDisplay();
      this.updateBreakUI();
      
      // Update controls with the proper running state
      this.updateControls(this.state.isRunning);
      
      // If the timer should be running, start it without resetting the time
      if (this.state.isRunning) {
        // Clear any existing interval just to be safe
        if (this.state.interval) clearInterval(this.state.interval);
        this.start(false); // Resume timer without resetting startTime
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  }
  
  // Save timer state to storage
  async saveState() {
    try {
      const stateToSave = {
        remainingTime: this.state.remainingTime,
        onBreak: this.state.onBreak,
        startTime: this.state.startTime,
        isRunning: this.state.isRunning,
        currentPreset: this.state.currentPreset
      };
      
      await storageService.setJSON(this.storageKey, stateToSave);
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }
  
  // Update timer preset
  updatePreset(presetKey) {
    if (!TIMER_PRESETS[presetKey]) {
      console.error('Invalid timer preset:', presetKey);
      return;
    }
    
    this.state.currentPreset = presetKey;
    this.state.workDuration = TIMER_PRESETS[presetKey].work;
    this.state.breakDuration = TIMER_PRESETS[presetKey].break;
    
    // Reset the timer if not currently running
    if (!this.state.isRunning) {
      this.state.remainingTime = this.state.onBreak ? 
        this.state.breakDuration : 
        this.state.workDuration;
      this.updateDisplay();
    }
    
    // Save the updated state
    this.saveState();
    
    // Call the updateUI callback if provided
    if (this.callbacks.updateUI) {
      this.callbacks.updateUI(this.state);
    }
  }
  
  // Update timer controls
  updateControls(running) {
    if (!this.elements.startBtn) return;
    
    this.state.isRunning = running;
    
    if (this.state.onBreak) {
      if (this.elements.startBtn) {
        this.elements.startBtn.disabled = running;
        this.elements.startBtn.textContent = running ? "Break Running" : "Start Break";
      }
      
      if (this.elements.pauseBtn) {
        this.elements.pauseBtn.disabled = true;
        this.elements.pauseBtn.style.display = 'none';
      }
      
      if (this.elements.resetBtn) {
        this.elements.resetBtn.disabled = true;
        this.elements.resetBtn.style.display = 'none';
      }
      
      if (this.elements.endBtn) {
        // this.elements.endBtn.disabled = !running;
        this.elements.endBtn.textContent = "Skip Break";
      }
    } else {
      if (this.elements.startBtn) {
        this.elements.startBtn.disabled = running;
        this.elements.startBtn.textContent = "Lock In";
      }
      
      if (this.elements.pauseBtn) {
        this.elements.pauseBtn.disabled = !running;
        this.elements.pauseBtn.style.display = '';
      }
      
      if (this.elements.endBtn) {
        this.elements.endBtn.disabled = !running;
        this.elements.endBtn.textContent = "End";
      }
      
      if (this.elements.resetBtn) {
        this.elements.resetBtn.disabled = !running;
        this.elements.resetBtn.style.display = '';
      }
    }
    
    this.saveState();
  }
  
  // Update UI for break/work modes
  updateBreakUI() {
    if (!this.elements.timer || !this.elements.timerLabel) return;
    
    if (this.state.onBreak) {
      this.elements.timer.style.color = 'var(--muted)';
      this.elements.timerLabel.textContent = "Break Time";
    } else {
      this.elements.timer.style.color = 'var(--accent)';
      this.elements.timerLabel.textContent = "Focus Time";
    }
  }
  
  // Update timer display
  updateDisplay() {
    if (!this.elements.timer || !this.elements.progress) return;
    
    // Check if remainingTime is a valid number before formatting
    if (this.state.remainingTime !== undefined && !isNaN(this.state.remainingTime)) {
      this.elements.timer.textContent = formatTime(this.state.remainingTime);
    } else {
      // Fallback to default duration if we have an invalid time
      const defaultTime = this.state.onBreak ? this.state.breakDuration : this.state.workDuration;
      this.elements.timer.textContent = formatTime(defaultTime);
      this.state.remainingTime = defaultTime;
    }
    
    // Calculate width percentage for progress bar with validation
    let widthPercentage = 0;
    if (this.state.onBreak) {
      // For break, show progress of break time used
      if (this.state.breakDuration > 0) {
        widthPercentage = 100 * (this.state.breakDuration - this.state.remainingTime) / this.state.breakDuration;
      }
    } else {
      // For work, show progress of work time used
      if (this.state.workDuration > 0) {
        widthPercentage = 100 * (this.state.workDuration - this.state.remainingTime) / this.state.workDuration;
      }
    }
    
    // Ensure percentage is a valid number between 0-100
    widthPercentage = isNaN(widthPercentage) ? 0 : Math.max(0, Math.min(100, widthPercentage));
    this.elements.progress.style.width = widthPercentage + '%';
    
    // Update document title
    updateDocumentTitle({
      isRunning: this.state.isRunning,
      remainingTime: this.state.remainingTime,
      workDuration: this.state.workDuration,
      breakDuration: this.state.breakDuration,
      onBreak: this.state.onBreak,
      currentPreset: this.state.currentPreset,
    });
    
    this.saveState();
    
    // Call the updateUI callback if provided
    if (this.callbacks.updateUI) {
      this.callbacks.updateUI(this.state);
    }
  }
  
  // Start break
  startBreak() {
    this.state.onBreak = true;
    this.state.remainingTime = this.state.breakDuration;
    this.updateBreakUI();
    this.updateDisplay();
    this.updateControls(false);
    
    // Call the onBreakStart callback if provided
    if (this.callbacks.onBreakStart) {
      this.callbacks.onBreakStart();
    }
  }
  
  // End break
  endBreak() {
    this.state.onBreak = false;
    this.state.remainingTime = this.state.workDuration;
    this.state.startTime = null;
    clearInterval(this.state.interval);
    this.updateBreakUI();
    this.updateDisplay();
    this.updateControls(false);
    
    // Call the onBreakEnd callback if provided
    if (this.callbacks.onBreakEnd) {
      this.callbacks.onBreakEnd();
    }
  }
  
  // Start timer
  start(resetStartTime = true) {
    this.updateControls(true);
    
    // Only reset startTime if explicitly told to do so (and not in break mode)
    if (resetStartTime && !this.state.onBreak) {
      this.state.startTime = Date.now();
    }
    
    // Clear any existing interval
    if (this.state.interval) clearInterval(this.state.interval);
    
    this.state.interval = setInterval(() => {
      this.state.remainingTime--;
      this.updateDisplay();
      
      if (this.state.remainingTime <= 0) {
        clearInterval(this.state.interval);
        
        if (this.state.onBreak) {
          // Break ended
          playSound(getEndSound());
          this.endBreak();
        } else {
          // Work session ended
          if (this.callbacks.onSessionEnd) {
            this.callbacks.onSessionEnd(this.state.startTime, this.callbacks.getTodos());
          }
          playSound(getEndSound());
          this.startBreak();
        }
      }
    }, 1000);
    
    // Play sound only if we're not resuming from a paused state
    if (resetStartTime || !this.state.startTime) {
      playSound(getStartSound());
    }
    
    // Make sure isRunning state is properly set and saved
    this.state.isRunning = true;
    this.saveState();
  }
  
  // Pause timer
  pause() {
    const reason = prompt('Why pause? Provide reason:');
    if (!reason || !reason.trim()) {
      alert('Pause cancelled');
      return;
    }
    
    clearInterval(this.state.interval);
    
    // Explicitly set isRunning to false
    this.state.isRunning = false;
    this.updateControls(false);
    
    // Save the paused state
    this.saveState();
    
    playSound(getPauseSound());
  }
  
  // End session
  endSession() {
    if (this.state.onBreak) {
      // Skip break
      if (!confirm('Skip the rest of your break?')) return;
      clearInterval(this.state.interval);
      this.endBreak();
    } else {
      // End work session
      if (!confirm('End session early?')) return;
      clearInterval(this.state.interval);
      
      // Call the onSessionEnd callback
      if (this.callbacks.onSessionEnd) {
        this.callbacks.onSessionEnd(this.state.startTime, this.callbacks.getTodos());
      }
      
      playSound(getEndSound());
      this.startBreak();
    }
  }
  
  // Reset timer
  reset() {
    if (!confirm('Reset session?')) return;
    clearInterval(this.state.interval);
    this.state.remainingTime = this.state.workDuration;
    this.state.startTime = null;
    this.updateControls(false);
    this.updateDisplay();
    playSound(getPauseSound());
  }
}