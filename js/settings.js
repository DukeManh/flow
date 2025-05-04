// Settings management for Flow State app
import { TIMER_PRESETS } from './constants.js';
import { updateTimerPreset, saveTimerState } from './timer.js';
import storageService from './storage.js';

// DOM elements
let settingsModal;
let saveSettingsBtn;
let closeModalBtn;

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'settings'
};

// Current settings state
let currentSettings = {
  timerPreset: 'default',
  soundNotifications: true
};

// Storage utility functions
async function getSettingsFromStorage() {
  try {
    return await storageService.getJSON(STORAGE_KEYS.SETTINGS);
  } catch (error) {
    console.error('Error getting settings from storage:', error);
    return null;
  }
}

async function saveSettingsToStorage(settings) {
  try {
    await storageService.setJSON(STORAGE_KEYS.SETTINGS, settings);
    return true;
  } catch (error) {
    console.error('Error saving settings to storage:', error);
    return false;
  }
}

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
  
  // Show modal with explicit display and flexbox properties
  settingsModal.style.display = 'flex';
  settingsModal.style.justifyContent = 'center';
  settingsModal.style.alignItems = 'center';
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
async function saveSettings() {
  // Get selected timer preset
  const selectedPreset = document.querySelector('input[name="timer-preset"]:checked').value;
  
  // Get selected sound notification setting
  const soundEnabled = document.getElementById('soundToggle').checked;
  
  // Update settings state
  currentSettings.timerPreset = selectedPreset;
  currentSettings.soundNotifications = soundEnabled;
  
  // Apply settings
  updateTimerPreset(selectedPreset);
  
  // Save settings to storage
  const success = await saveSettingsToStorage(currentSettings);
  
  if (success) {
    // Close modal
    closeSettings();
  } else {
    alert('Failed to save settings. Please try again.');
  }
}

// Load settings from storage
async function loadSettings() {
  const savedSettings = await getSettingsFromStorage();
  
  if (savedSettings) {
    currentSettings = savedSettings;
    
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