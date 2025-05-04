// Music player management for the Flow State app
import { setCurrentVideo } from './history.js';
import { 
  REBOOT_VIDEO_ID,
  BEATS_VIDEO_ID, 
  LOFI_VIDEO_ID,
  WHITE_NOISE_VIDEO_ID,
  TICKING_VIDEO_ID,
  musicLabels
} from './constants.js';
import storageService from './storage.js';

// Music elements
let ytPlayer, customVidInput;
let vBtn, bBtn, lBtn, wBtn, tBtn, loadBtn;
let currentVideoID;

// Storage keys
const STORAGE_KEYS = {
  LAST_VIDEO_ID: 'lastVideoID'
};

// Storage utility functions
async function getLastVideoIDFromStorage() {
  try {
    return await storageService.getItem(STORAGE_KEYS.LAST_VIDEO_ID);
  } catch (error) {
    console.error('Error getting last video ID from storage:', error);
    return null;
  }
}

async function saveLastVideoIDToStorage(videoID) {
  try {
    await storageService.setItem(STORAGE_KEYS.LAST_VIDEO_ID, videoID);
    return true;
  } catch (error) {
    console.error('Error saving video ID to storage:', error);
    return false;
  }
}

// Initialize music player
export async function initMusic() {
  // Get DOM elements
  ytPlayer = document.getElementById('ytPlayer');
  customVidInput = document.getElementById('customVidInput');
  vBtn = document.getElementById('vBtn');
  bBtn = document.getElementById('bBtn');
  lBtn = document.getElementById('lBtn');
  wBtn = document.getElementById('wBtn');
  tBtn = document.getElementById('tBtn');
  loadBtn = document.getElementById('loadBtn');
  
  // Load last used video from storage
  const savedVideoID = await getLastVideoIDFromStorage();
  currentVideoID = savedVideoID || WHITE_NOISE_VIDEO_ID;
  
  // Set up event listeners
  vBtn.addEventListener('click', () => changeVideo(REBOOT_VIDEO_ID));
  bBtn.addEventListener('click', () => changeVideo(BEATS_VIDEO_ID));
  lBtn.addEventListener('click', () => changeVideo(LOFI_VIDEO_ID));
  wBtn.addEventListener('click', () => changeVideo(WHITE_NOISE_VIDEO_ID));
  tBtn.addEventListener('click', () => changeVideo(TICKING_VIDEO_ID));
  loadBtn.addEventListener('click', () => changeVideo(customVidInput.value.trim()));
  
  // Initialize YouTube player with the remembered video
  ytPlayer.src = `https://www.youtube.com/embed/${currentVideoID}?autoplay=0&loop=1&playlist=${currentVideoID}`;
  
  // Update button labels
  updateButtonLabels();
  
  return currentVideoID;
}

// Change the current video
async function changeVideo(id) { 
  if (!id) return; 
  currentVideoID = id; 
  ytPlayer.src = `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}`;
  
  await saveLastVideoIDToStorage(id);
  setCurrentVideo(id);
}

// Get current video ID
export function getCurrentVideoID() {
  return currentVideoID;
}

// Update button labels from constants
function updateButtonLabels() {
  const buttonMap = {
    [BEATS_VIDEO_ID]: bBtn,
    [LOFI_VIDEO_ID]: lBtn,
    [WHITE_NOISE_VIDEO_ID]: wBtn,
    [TICKING_VIDEO_ID]: tBtn,
    [REBOOT_VIDEO_ID]: vBtn
  };

  for (const [videoID, button] of Object.entries(buttonMap)) {
    button.textContent = musicLabels[videoID];
  }
}