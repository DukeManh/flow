// Sound management for the Flow State app

// Initialize sound elements
let soundToggle, testSoundBtn, startSound, endSound, pauseSound;

// Initialize the sound module
export function initSounds() {
  soundToggle = document.getElementById('soundToggle');
  testSoundBtn = document.getElementById('testSoundBtn');
  startSound = document.getElementById('startSound');
  endSound = document.getElementById('endSound');
  pauseSound = document.getElementById('pauseSound');

  // Load sound preferences
  soundToggle.checked = localStorage.getItem('soundEnabled') !== 'false';

  // Save sound preference
  soundToggle.addEventListener('change', () => {
    localStorage.setItem('soundEnabled', soundToggle.checked);
  });

  // Test sound button
  testSoundBtn.addEventListener('click', () => {
    playSound(startSound);
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