// Settings management for Flow State app
import { TIMER_PRESETS } from './constants.js';
import { updateTimerPreset, saveTimerState } from './timer.js';

// DOM elements
let settingsModal;
let saveSettingsBtn;
let closeModalBtn;

// Current settings state
let currentSettings = {
  timerPreset: 'default',
  soundNotifications: true
};

export function initSettings() {
  // Get DOM elements
  settingsModal = document.getElementById('settingsModal');
  saveSettingsBtn = document.getElementById('saveSettingsBtn');
  closeModalBtn = settingsModal.querySelector('.close-modal');
  
  // Get settings button
  const settingsBtn = document.getElementById('settingsBtn');
  
  // Load saved settings
  loadSettings();
  
  // Add event listeners
  settingsBtn.addEventListener('click', openSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  closeModalBtn.addEventListener('click', closeSettings);
  
  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
      closeSettings();
    }
  });
  
  // Close modal with escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && settingsModal.style.display === 'flex') {
      closeSettings();
    }
  });
  
  console.log('Settings module initialized'); // Add logging to verify initialization
}

// Open settings modal
function openSettings() {
  // Update UI to reflect current settings
  const presetRadios = document.querySelectorAll('input[name="timer-preset"]');
  presetRadios.forEach(radio => {
    radio.checked = radio.value === currentSettings.timerPreset;
  });
  
  const soundToggle = document.getElementById('soundToggle');
  soundToggle.checked = currentSettings.soundNotifications;
  
  // Show modal with proper flexbox centering
  settingsModal.style.display = 'flex';
  settingsModal.classList.add('active');
  
  // Prevent background scrolling when modal is open
  document.body.style.overflow = 'hidden';
}

// Close settings modal
function closeSettings() {
  settingsModal.style.display = 'none';
  settingsModal.classList.remove('active');
  
  // Restore background scrolling
  document.body.style.overflow = '';
}

// Save settings
function saveSettings() {
  // Get selected timer preset
  const selectedPreset = document.querySelector('input[name="timer-preset"]:checked').value;
  
  // Get selected sound notification setting
  const soundEnabled = document.getElementById('soundToggle').checked;
  
  // Update settings state
  currentSettings.timerPreset = selectedPreset;
  currentSettings.soundNotifications = soundEnabled;
  
  // Apply settings
  updateTimerPreset(selectedPreset);
  
  // Save settings to localStorage
  localStorage.setItem('settings', JSON.stringify(currentSettings));
  
  // Close modal
  closeSettings();
}

// Load settings from localStorage
function loadSettings() {
  const savedSettings = localStorage.getItem('settings');
  
  if (savedSettings) {
    currentSettings = JSON.parse(savedSettings);
    
    // Apply saved timer preset
    if (currentSettings.timerPreset && TIMER_PRESETS[currentSettings.timerPreset]) {
      updateTimerPreset(currentSettings.timerPreset);
    }
  }
  
  // Update the sound toggle in the timer card to match settings
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.checked = currentSettings.soundNotifications;
  }
}