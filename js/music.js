// Music player management for the Flow State app
import { setCurrentVideo } from './history.js';

// Music elements
let ytPlayer, customVidInput;
let vBtn, bBtn, lBtn, loadBtn;
let currentVideoID;

// Initialize music player
export function initMusic() {
  // Get DOM elements
  ytPlayer = document.getElementById('ytPlayer');
  customVidInput = document.getElementById('customVidInput');
  vBtn = document.getElementById('vBtn');
  bBtn = document.getElementById('bBtn');
  lBtn = document.getElementById('lBtn');
  loadBtn = document.getElementById('loadBtn');
  
  // Load last used video from localStorage
  currentVideoID = localStorage.getItem('lastVideoID') || 'wL8DVHuWI7Y';
  
  // Set up event listeners
  vBtn.addEventListener('click', () => changeVideo('wL8DVHuWI7Y'));
  bBtn.addEventListener('click', () => changeVideo('1_G60OdEzXs'));
  lBtn.addEventListener('click', () => changeVideo('sF80I-TQiW0'));
  loadBtn.addEventListener('click', () => changeVideo(customVidInput.value.trim()));
  
  // Initialize YouTube player with the remembered video
  ytPlayer.src = `https://www.youtube.com/embed/${currentVideoID}?autoplay=0&loop=1&playlist=${currentVideoID}`;
  
  return currentVideoID;
}

// Change the current video
function changeVideo(id) { 
  if (!id) return; 
  currentVideoID = id; 
  ytPlayer.src = `https://www.youtube.com/embed/${id}?autoplay=1&loop=1&playlist=${id}`;
  localStorage.setItem('lastVideoID', id);
  setCurrentVideo(id);
}

// Get current video ID
export function getCurrentVideoID() {
  return currentVideoID;
}