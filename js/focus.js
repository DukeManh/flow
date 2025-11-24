// Focus mode JavaScript file
import { TIMER_PRESETS } from './constants.js';
import { formatTime } from './utils.js';
import { loadTheme } from './themes.js';
import { initAnimations, cleanupAnimations } from './animations.js';
import storageService from './storage.js';
import { TimerCore } from './timerCore.js';
import { initSounds } from './sound.js';
import { initAdBlocker } from './adBlocker.js'; // Import our ad blocker
import { initNetworkAdBlocker } from './networkAdBlocker.js';
import { initSponsorBlocker } from './sponsorBlocker.js';

// DOM elements
let timerEl, circularProgressEl;
let startBtn, pauseBtn, endBtn, resetBtn, exitBtn;
let ytPlayer, togglePlayerBtn, mutePlayerBtn, ytPlayerContainer;
let volumeSlider, volumePercentLabel;
let isMuted = false;

// Timer core instance
let timerCore;

// Detect if device is mobile
function isMobileDevice() {
  return (window.innerWidth <= 768) || 
         (navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Initialize the focus mode
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  
  // Add animations first for immediate visual feedback
  initAnimations();
  
  initSounds(); // Initialize sound system
  
  // Initialize timer core with custom UI update function for circular progress
  initTimerCore();
  
  setupEventListeners();
  loadTheme();
  
  // Continue music from main page if available
  continueMusicPlayback();
  
  // Setup YouTube mini player controls
  setupYouTubeControls();
  
  // Clean up animations after they've completed
  cleanupAnimations();
});

// Initialize DOM elements
function initElements() {
  timerEl = document.getElementById('timer');
  circularProgressEl = document.getElementById('circularProgress');
  startBtn = document.getElementById('startBtn');
  pauseBtn = document.getElementById('pauseBtn');
  endBtn = document.getElementById('endBtn');
  resetBtn = document.getElementById('resetBtn');
  exitBtn = document.getElementById('exitFocusMode');
  ytPlayer = document.getElementById('ytPlayer');
  togglePlayerBtn = document.getElementById('togglePlayerBtn');
  mutePlayerBtn = document.getElementById('mutePlayerBtn');
  ytPlayerContainer = document.querySelector('.youtube-mini-player');
  volumeSlider = document.getElementById('volumeSlider');
  volumePercentLabel = document.getElementById('volumePercent');
  
  // Show initial value while timer is initializing
  if (timerEl) {
    timerEl.textContent = formatTime(TIMER_PRESETS.default.work);
  }
}

// Initialize timer core with focus mode specific UI updates
function initTimerCore() {
  timerCore = new TimerCore({
    // Custom callbacks for focus mode
    updateUI: updateCircularProgress,
    onSessionEnd: recordSession,
    getTodos: () => [] // No todos in focus mode
  });
  
  // Set up elements for the timer core
  timerCore.initElements({
    timer: timerEl,
    progress: circularProgressEl, // This will be used differently in focus mode
    startBtn: startBtn,
    pauseBtn: pauseBtn,
    endBtn: endBtn,
    resetBtn: resetBtn,
    timerLabel: document.getElementById('timerLabel')
  });
}

// Custom UI update function for focus mode's circular progress
function updateCircularProgress(state) {
  // Calculate progress percentage based on current preset's durations
  let progressPercent;
  if (state.onBreak) {
    // For break time, show progress of break time used
    progressPercent = 100 * (state.breakDuration - state.remainingTime) / state.breakDuration;
  } else {
    // For work time, show progress of work time used
    progressPercent = 100 * (state.workDuration - state.remainingTime) / state.workDuration;
  }
  
  // Only set the CSS variable for the conic gradient, don't modify width
  circularProgressEl.style.removeProperty('width'); // Remove any width that might have been set
  circularProgressEl.style.setProperty('--progress-percent', progressPercent);
  
  // Toggle the over-50 class when progress exceeds 50%
  if (progressPercent >= 50) {
    circularProgressEl.classList.add('over-50');
  } else {
    circularProgressEl.classList.remove('over-50');
  }
}

// Setup YouTube player controls
function setupYouTubeControls() {
  // Toggle player size (normal/collapsed)
  togglePlayerBtn.addEventListener('click', () => {
    ytPlayerContainer.classList.toggle('collapsed');
    // Replace emoji with FontAwesome icons
    togglePlayerBtn.innerHTML = ytPlayerContainer.classList.contains('collapsed') 
      ? '<i class="fas fa-compress-alt"></i>' 
      : '<i class="fas fa-expand-arrows-alt"></i>';
    storageService.setItem('ytPlayerCollapsed', ytPlayerContainer.classList.contains('collapsed'));
  });
  
  // Mute/unmute player
  mutePlayerBtn.addEventListener('click', async () => {
    isMuted = !isMuted;
    // Use postMessage to control YouTube iframe
    try {
      ytPlayer.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: isMuted ? 'mute' : 'unMute'
      }), '*');
      // Replace emoji with FontAwesome icons
      mutePlayerBtn.innerHTML = isMuted 
        ? '<i class="fas fa-volume-mute"></i>' 
        : '<i class="fas fa-volume-up"></i>';
      await storageService.setItem('ytPlayerMuted', isMuted);
    } catch (e) {
      console.log('YouTube postMessage error:', e);
    }
  });
  
  // Volume control for YouTube player
  if (volumeSlider && volumePercentLabel) {
    // Set initial volume from storage or default to 50
    storageService.getItem('ytPlayerVolume').then(savedVolume => {
      const volume = parseInt(savedVolume) || 50;
      volumeSlider.value = volume;
      volumePercentLabel.textContent = `${volume}%`;
    });
    
    // Update volume when slider changes
    volumeSlider.addEventListener('input', async () => {
      const volume = volumeSlider.value;
      volumePercentLabel.textContent = `${volume}%`;
      
      try {
        // Send volume command to YouTube iframe (0-100 value)
        ytPlayer.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [parseInt(volume)]
        }), '*');
        
        // If we're changing volume and currently muted, unmute
        if (isMuted && volume > 0) {
          isMuted = false;
          mutePlayerBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
          ytPlayer.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'unMute'
          }), '*');
          await storageService.setItem('ytPlayerMuted', 'false');
        }
        
        // Save volume setting
        await storageService.setItem('ytPlayerVolume', volume);
      } catch (e) {
        console.log('YouTube volume control error:', e);
      }
    });
  }
  
  // Load saved state or use defaults based on device type
  let isCollapsed;
  
  // If we're on mobile, default to collapsed regardless of previous state
  if (isMobileDevice()) {
    isCollapsed = true;
  } else {
    // On desktop, use the saved state or default to expanded
    storageService.getItem('ytPlayerCollapsed').then(collapsed => {
      isCollapsed = collapsed === 'true';
    });
  }
  
  if (isCollapsed) {
    ytPlayerContainer.classList.add('collapsed');
    togglePlayerBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
  } else {
    ytPlayerContainer.classList.remove('collapsed');
    togglePlayerBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
  }
  
  // Save the initial state
  storageService.setItem('ytPlayerCollapsed', isCollapsed);
  
  storageService.getItem('ytPlayerMuted').then(muted => {
    isMuted = muted === 'true';
    if (isMuted) {
      mutePlayerBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
    }
  });
}

// Continue music playback from the main page
async function continueMusicPlayback() {
  try {
    const videoID = await storageService.getItem('lastVideoID');
    if (videoID) {
      // Enable JS API with ad-blocking parameters
      ytPlayer.src = `https://www.youtube.com/embed/${videoID}?autoplay=0&loop=1&playlist=${videoID}&mute=0&enablejsapi=1&origin=${window.location.origin}&rel=0&controls=1&iv_load_policy=3&modestbranding=1`;
      
      // Initialize ad blocker for the focus mode YouTube player
      initAdBlocker(ytPlayer);
      // Block network ad requests
      initNetworkAdBlocker();
      // Initialize SponsorBlocker to skip sponsors
      initSponsorBlocker(ytPlayer, videoID);
      
      // Add a play button to the YouTube container
      const playButtonContainer = document.createElement('div');
      playButtonContainer.className = 'youtube-play-container';
      playButtonContainer.innerHTML = '<button id="playYTBtn" class="youtube-play-button"><i class="fas fa-play"></i></button>';
      ytPlayerContainer.appendChild(playButtonContainer);

      // Add click event to play button
      document.getElementById('playYTBtn').addEventListener('click', () => {
        // Start playing video
        try {
          ytPlayer.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'playVideo'
          }), '*');
          // Hide play button once playback starts
          playButtonContainer.style.display = 'none';
        } catch (e) {
          console.log('YouTube playback error:', e);
        }
      });
      
      // Apply volume and muted state after player loads
      setTimeout(async () => {
        try {
          // Set volume from storage
          const savedVolume = parseInt(await storageService.getItem('ytPlayerVolume')) || 50;
          ytPlayer.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [savedVolume]
          }), '*');
          
          // Apply muted state if needed
          if (isMuted) {
            ytPlayer.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'mute'
            }), '*');
          }
        } catch (e) {
          console.log('YouTube settings error:', e);
        }
      }, 1500);
    } else {
      // Hide player if no video
      ytPlayerContainer.style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading video ID:', error);
    ytPlayerContainer.style.display = 'none';
  }
}

// Setup event listeners
function setupEventListeners() {
  // We don't need timer button listeners as they're set up by TimerCore
  
  // Exit focus mode
  exitBtn.addEventListener('click', () => {
    // Exit to main page
    window.location.href = 'index.html';
  });
  
  // Handle before unload to show warning if timer is running
  window.addEventListener('beforeunload', function(event) {
    // Show confirmation dialog only if timer is running
    if (timerCore.state.isRunning) {
      const message = "You have an active timer running. Are you sure you want to leave?";
      event.returnValue = message; // For most browsers
      return message; // For some older browsers
    }
  });
}

// Record session in storage
async function recordSession(startTime, todos) {
  // Only record if not on break
  if (!timerCore.state.onBreak) {
    const st = startTime || Date.now(), en = Date.now();
    const MAX_DURATION_MINUTES = 180;
    let dur = Math.round((en - st) / 60000);
    
    if (dur > MAX_DURATION_MINUTES || dur < 0) {
      dur = Math.min(MAX_DURATION_MINUTES, timerCore.state.workDuration / 60); // Use current preset's work duration
    }
    
    try {
      const hist = await storageService.getJSON('sessionHistory', []);
      const flowGoal = await storageService.getItem('flowGoal') || '';
      const lastVideoID = await storageService.getItem('lastVideoID') || '';
      const flowTodos = await storageService.getJSON('flowTodos', []);
      
      const entry = {
        start: st,
        end: en,
        duration: dur,
        goal: flowGoal,
        music: lastVideoID,
        todos: flowTodos,
        currentPreset: timerCore.state.currentPreset // Record which preset was used for the session
      };
      
      hist.push(entry);
      await storageService.setJSON('sessionHistory', hist);
    } catch (error) {
      console.error('Error recording session:', error);
    }
  }
}