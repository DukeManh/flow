// Sound management for the Flow State app
import storageService from './storage.js';

// Initialize sound elements
let soundToggle, startSound, endSound, pauseSound;

// Storage keys
const STORAGE_KEYS = {
  SOUND_ENABLED: 'soundEnabled'
};

// Storage utility functions
async function getSoundEnabledFromStorage() {
  try {
    const soundEnabled = await storageService.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return soundEnabled !== 'false';
  } catch (error) {
    console.error('Error getting sound enabled setting from storage:', error);
    return true; // Default to enabled
  }
}

async function saveSoundEnabledToStorage(isEnabled) {
  try {
    await storageService.setItem(STORAGE_KEYS.SOUND_ENABLED, isEnabled);
    return true;
  } catch (error) {
    console.error('Error saving sound enabled setting to storage:', error);
    return false;
  }
}

// Initialize the sound module
export async function initSounds() {
  soundToggle = document.getElementById('soundToggle');
  startSound = document.getElementById('startSound');
  endSound = document.getElementById('endSound');
  pauseSound = document.getElementById('pauseSound');

  // Load sound preferences
  soundToggle.checked = await getSoundEnabledFromStorage();

  // Save sound preference
  soundToggle.addEventListener('change', async () => {
    await saveSoundEnabledToStorage(soundToggle.checked);
  });
}

// Sound notification function
export function playSound(audioElement) {
  if (soundToggle && soundToggle.checked) {
    audioElement.currentTime = 0;
    audioElement.play();
  }
}

// Getter functions for sound elements
export function getStartSound() {
  return startSound;
}

export function getEndSound() {
  return endSound;
}

export function getPauseSound() {
  return pauseSound;
}