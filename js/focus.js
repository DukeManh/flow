// Focus mode JavaScript file
import { WORK, BREAK } from './constants.js';
import { formatTime } from './utils.js';
import { loadTheme } from './themes.js';
import { playSound, getStartSound, getEndSound, getPauseSound, initSounds } from './sound.js';

// Timer state
let rem = WORK;
let onBreak = false;
let iv;
let startTime = null;
let isRunning = false;

// DOM elements
let timerEl, progressEl, circularProgressEl;
let startBtn, pauseBtn, endBtn, resetBtn, exitBtn;
let ytPlayer, togglePlayerBtn, mutePlayerBtn, ytPlayerContainer;
let volumeSlider, volumePercentLabel;
let isMuted = false;

// Detect if device is mobile
function isMobileDevice() {
  return (window.innerWidth <= 768) || 
         (navigator.maxTouchPoints > 0 && /Mobi|Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Initialize the focus mode
document.addEventListener('DOMContentLoaded', () => {
  initElements();
  initSounds(); // Initialize sound system
  loadState();
  setupEventListeners();
  loadTheme();
  
  // Continue music from main page if available
  continueMusicPlayback();
  
  // Setup YouTube mini player controls
  setupYouTubeControls();
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
}

// Load timer state from localStorage
function loadState() {
  const savedState = localStorage.getItem('timerState');
  if (savedState) {
    const state = JSON.parse(savedState);
    rem = state.rem;
    onBreak = state.onBreak;
    
    // Validate startTime
    const now = Date.now();
    if (state.startTime && (now - state.startTime > WORK * 60 * 1000)) {
      startTime = null;
      isRunning = false;
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

// Setup YouTube player controls
function setupYouTubeControls() {
  // Toggle player size (normal/collapsed)
  togglePlayerBtn.addEventListener('click', () => {
    ytPlayerContainer.classList.toggle('collapsed');
    // Replace emoji with FontAwesome icons
    togglePlayerBtn.innerHTML = ytPlayerContainer.classList.contains('collapsed') 
      ? '<i class="fas fa-compress-alt"></i>' 
      : '<i class="fas fa-expand-arrows-alt"></i>';
    localStorage.setItem('ytPlayerCollapsed', ytPlayerContainer.classList.contains('collapsed'));
  });
  
  // Mute/unmute player
  mutePlayerBtn.addEventListener('click', () => {
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
      localStorage.setItem('ytPlayerMuted', isMuted);
    } catch (e) {
      console.log('YouTube postMessage error:', e);
    }
  });
  
  // Volume control for YouTube player
  if (volumeSlider && volumePercentLabel) {
    // Set initial volume from localStorage or default to 50
    const savedVolume = parseInt(localStorage.getItem('ytPlayerVolume')) || 50;
    volumeSlider.value = savedVolume;
    volumePercentLabel.textContent = `${savedVolume}%`;
    
    // Update volume when slider changes
    volumeSlider.addEventListener('input', () => {
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
          localStorage.setItem('ytPlayerMuted', 'false');
        }
        
        // Save volume setting
        localStorage.setItem('ytPlayerVolume', volume);
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
    isCollapsed = localStorage.getItem('ytPlayerCollapsed') === 'true';
  }
  
  if (isCollapsed) {
    ytPlayerContainer.classList.add('collapsed');
    togglePlayerBtn.innerHTML = '<i class="fas fa-compress-alt"></i>';
  } else {
    ytPlayerContainer.classList.remove('collapsed');
    togglePlayerBtn.innerHTML = '<i class="fas fa-expand-arrows-alt"></i>';
  }
  
  // Save the initial state
  localStorage.setItem('ytPlayerCollapsed', isCollapsed);
  
  isMuted = localStorage.getItem('ytPlayerMuted') === 'true';
  if (isMuted) {
    mutePlayerBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
  }
}

// Continue music playback from the main page
function continueMusicPlayback() {
  const videoID = localStorage.getItem('lastVideoID');
  if (videoID) {
    // Enable JS API for postMessage control but don't autoplay
    ytPlayer.src = `https://www.youtube.com/embed/${videoID}?autoplay=0&loop=1&playlist=${videoID}&mute=0&enablejsapi=1&origin=${window.location.origin}`;
    
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
    setTimeout(() => {
      try {
        // Set volume from localStorage
        const savedVolume = parseInt(localStorage.getItem('ytPlayerVolume')) || 50;
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
}

// Setup event listeners
function setupEventListeners() {
  startBtn.addEventListener('click', () => { 
    start(); 
    updateDisplay(); 
  });
  
  pauseBtn.addEventListener('click', pause);
  endBtn.addEventListener('click', endSession);
  resetBtn.addEventListener('click', reset);
  
  // Exit focus mode
  exitBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  
  // Handle before unload to save state
  window.addEventListener('beforeunload', saveState);
}

// Save timer state to localStorage
function saveState() {
  const state = {
    rem,
    onBreak,
    startTime,
    isRunning
  };
  localStorage.setItem('timerState', JSON.stringify(state));
}

// Update timer controls
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
  
  saveState();
}

// Update UI for break/focus modes
function updateBreakUI() {
  if (onBreak) {
    timerEl.style.color = 'var(--muted)';
    document.getElementById('timerLabel').textContent = "Break Time";
  } else {
    timerEl.style.color = 'var(--accent)';
    document.getElementById('timerLabel').textContent = "Focus Time";
  }
}

// Update timer display
function updateDisplay() {
  timerEl.textContent = formatTime(rem);
  
  let progressPercent;
  if (onBreak) {
    progressPercent = 100 * (BREAK - rem) / BREAK;
  } else {
    progressPercent = 100 * (WORK - rem) / WORK;
  }
  
  // Update circular progress indicator by setting the CSS variable
  circularProgressEl.style.setProperty('--progress-percent', progressPercent);
  
  // Toggle the over-50 class when progress exceeds 50%
  if (progressPercent >= 50) {
    circularProgressEl.classList.add('over-50');
  } else {
    circularProgressEl.classList.remove('over-50');
  }
  
  saveState();
}

// Record session in localStorage
function recordSession() {
  if (!onBreak) {
    const st = startTime || Date.now(), en = Date.now();
    const MAX_DURATION_MINUTES = 180;
    let dur = Math.round((en - st) / 60000);
    
    if (dur > MAX_DURATION_MINUTES || dur < 0) {
      dur = Math.min(MAX_DURATION_MINUTES, WORK / 60);
    }
    
    const hist = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
    const entry = {
      start: st,
      end: en,
      duration: dur,
      goal: localStorage.getItem('flowGoal') || '',
      music: localStorage.getItem('lastVideoID') || '',
      todos: JSON.parse(localStorage.getItem('flowTodos') || '[]')
    };
    hist.push(entry);
    localStorage.setItem('sessionHistory', JSON.stringify(hist));
  }
}

// Start break
function startBreak() {
  onBreak = true;
  rem = BREAK;
  updateBreakUI();
  updateDisplay();
  updateControls(false);
}

// End break
function endBreak() {
  onBreak = false;
  rem = WORK;
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
        playSound(getEndSound());
        endBreak();
      } else {
        recordSession();
        playSound(getEndSound());
        startBreak();
      }
    }
  }, 1000);
  playSound(getStartSound());
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

// End session
function endSession() {
  if (onBreak) {
    if (!confirm('Skip the rest of your break?')) return;
    clearInterval(iv);
    endBreak();
  } else {
    if (!confirm('End session early?')) return;
    clearInterval(iv);
    recordSession();
    playSound(getEndSound());
    startBreak();
  }
}

// Reset timer
function reset() {
  if (!confirm('Reset session?')) return;
  clearInterval(iv);
  rem = WORK;
  startTime = null;
  updateControls(false);
  updateDisplay();
  playSound(getPauseSound());
}