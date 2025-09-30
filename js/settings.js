// Settings management for Flow State app
import { TIMER_PRESETS } from './constants.js';
import { updateTimerPreset, saveTimerState, updateCustomPreset } from './timer.js';
import storageService from './storage.js';
import { setAdBlockerEnabled } from './adBlocker.js';

// DOM elements
let settingsModal;
let closeModalBtn;

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'settings'
};

// Current settings state
let currentSettings = {
  timerPreset: 'default',
  soundNotifications: true,
  adBlockerEnabled: true,
  customWorkTime: 25, // Default custom work time in minutes
  customBreakTime: 5  // Default custom break time in minutes
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
  closeModalBtn = settingsModal.querySelector('.close-modal');
  
  // Get settings button
  const settingsBtn = document.getElementById('settingsBtn');
  
  // Load saved settings
  loadSettings();
  
  // Add event listeners
  settingsBtn.addEventListener('click', openSettings);
  closeModalBtn.addEventListener('click', closeSettings);
  
  // Add event listeners for auto-save functionality
  const presetRadios = document.querySelectorAll('input[name="timer-preset"]');
  presetRadios.forEach(radio => {
    radio.addEventListener('change', handlePresetChange);
  });
  
  // Add auto-save listeners for other settings
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('change', autoSaveSettings);
  }
  
  const adBlockToggle = document.getElementById('adBlockToggle');
  if (adBlockToggle) {
    adBlockToggle.addEventListener('change', autoSaveSettings);
  }
  
  // Add auto-save listeners for custom timer inputs
  const customWorkTime = document.getElementById('customWorkTime');
  const customBreakTime = document.getElementById('customBreakTime');
  if (customWorkTime) {
    customWorkTime.addEventListener('input', debounce(handleCustomTimerChange, 500));
  }
  if (customBreakTime) {
    customBreakTime.addEventListener('input', debounce(handleCustomTimerChange, 500));
  }
  
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
  
  console.log('Settings module initialized');
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
  
  const adBlockToggle = document.getElementById('adBlockToggle');
  if (adBlockToggle) {
    adBlockToggle.checked = currentSettings.adBlockerEnabled;
  }
  
  // Handle custom timer inputs visibility and values
  const customInputs = document.getElementById('customTimerInputs');
  const customWorkTime = document.getElementById('customWorkTime');
  const customBreakTime = document.getElementById('customBreakTime');
  
  if (currentSettings.timerPreset === 'custom') {
    customInputs.style.display = 'block';
    customWorkTime.value = currentSettings.customWorkTime;
    customBreakTime.value = currentSettings.customBreakTime;
  } else {
    customInputs.style.display = 'none';
  }
  
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

// Handle preset radio button changes to show/hide custom inputs and auto-save
function handlePresetChange(event) {
  const customInputs = document.getElementById('customTimerInputs');
  if (event.target.value === 'custom') {
    customInputs.style.display = 'block';
    // Load current custom values into the inputs
    document.getElementById('customWorkTime').value = currentSettings.customWorkTime;
    document.getElementById('customBreakTime').value = currentSettings.customBreakTime;
  } else {
    customInputs.style.display = 'none';
  }
  
  // Auto-save the preset change
  autoSaveSettings();
}

// Auto-save settings when any setting changes
async function autoSaveSettings() {
  // Get current values from UI
  const selectedPreset = document.querySelector('input[name="timer-preset"]:checked')?.value || 'default';
  const soundEnabled = document.getElementById('soundToggle')?.checked || true;
  const adBlockToggle = document.getElementById('adBlockToggle');
  const adBlockerEnabled = adBlockToggle ? adBlockToggle.checked : true;
  
  // Update settings state
  currentSettings.timerPreset = selectedPreset;
  currentSettings.soundNotifications = soundEnabled;
  currentSettings.adBlockerEnabled = adBlockerEnabled;
  
  // Apply settings (but don't interrupt active sessions)
  applySettingsWithoutInterruption(selectedPreset);
  setAdBlockerEnabled(adBlockerEnabled);
  
  // Save to storage
  await saveSettingsToStorage(currentSettings);
}

// Handle custom timer input changes with validation
async function handleCustomTimerChange() {
  const customWorkTime = parseInt(document.getElementById('customWorkTime').value);
  const customBreakTime = parseInt(document.getElementById('customBreakTime').value);
  
  // Basic validation - only check if values are valid numbers within bounds
  if (isNaN(customWorkTime) || customWorkTime < 5 || customWorkTime > 180) {
    return; // Don't save invalid values
  }
  
  if (isNaN(customBreakTime) || customBreakTime < 1 || customBreakTime > 60) {
    return; // Don't save invalid values
  }
  
  // Update custom values in settings
  currentSettings.customWorkTime = customWorkTime;
  currentSettings.customBreakTime = customBreakTime;
  
  // Update the custom preset with new values
  updateCustomPreset(customWorkTime, customBreakTime);
  
  // If custom preset is currently selected, apply the changes (but don't interrupt active sessions)
  if (currentSettings.timerPreset === 'custom') {
    applySettingsWithoutInterruption('custom');
  }
  
  // Save to storage
  await saveSettingsToStorage(currentSettings);
}

// Apply settings without interrupting active timer sessions
function applySettingsWithoutInterruption(presetKey) {
  // Import timer functions to check if timer is running
  import('./timer.js').then(({ updateTimerPresetWithoutInterruption }) => {
    updateTimerPresetWithoutInterruption(presetKey);
  }).catch(console.error);
}

// Debounce utility function to limit rapid input changes
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Load settings from storage
async function loadSettings() {
  const savedSettings = await getSettingsFromStorage();
  
  if (savedSettings) {
    currentSettings = { ...currentSettings, ...savedSettings };
    
    // If custom preset is saved, update the TIMER_PRESETS with saved custom values
    if (currentSettings.timerPreset === 'custom' && currentSettings.customWorkTime && currentSettings.customBreakTime) {
      updateCustomPreset(currentSettings.customWorkTime, currentSettings.customBreakTime);
    }
    
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
  
  // Update the ad blocker toggle in the settings modal to match settings
  const adBlockerToggle = document.getElementById('adBlockToggle');
  if (adBlockerToggle) {
    adBlockerToggle.checked = currentSettings.adBlockerEnabled;
  }
}