// Simplified YouTube Ad Blocker inspired by SkipCut script
// This module loads the YouTube IFrame API and attempts to skip video ads
// using injected code inside the player iframe.
// The API is used only when the ad blocker is enabled.

import storageService from './storage.js';

let adBlockerEnabled = true;
let apiReady = false;
let apiLoading = false;
const pendingIframes = new Set();

// Load the YouTube IFrame API once
function loadYouTubeAPI() {
  if (apiReady || apiLoading) return;
  apiLoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}

// Called by the IFrame API once it's ready
window.onYouTubeIframeAPIReady = () => {
  apiReady = true;
  pendingIframes.forEach(ifr => setupPlayer(ifr));
  pendingIframes.clear();
};

/**
 * Initialize ad blocker for a YouTube iframe element
 * @param {HTMLIFrameElement} iframe
 */
export function initAdBlocker(iframe) {
  if (!adBlockerEnabled || !iframe) return;
  loadYouTubeAPI();
  if (apiReady) {
    setupPlayer(iframe);
  } else {
    pendingIframes.add(iframe);
  }
}

function setupPlayer(iframe) {
  if (iframe._adBlockerPlayer) return; // already initialized
  const player = new YT.Player(iframe, {
    events: {
      onStateChange: (e) => {
        if (e.data === YT.PlayerState.PLAYING) {
          injectSkipper(player);
        }
      }
    }
  });
  iframe._adBlockerPlayer = player;
}

// Inject ad skipping code into the player iframe
function injectSkipper(player) {
  const iframe = player.getIframe();
  if (!iframe) return;
  try {
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    if (!doc.getElementById('flow-ad-skipper')) {
      const script = doc.createElement('script');
      script.id = 'flow-ad-skipper';
      script.textContent = getSkipperScript();
      doc.head.appendChild(script);
    }
  } catch (e) {
    // Fallback: use postMessage to execute code if cross-origin
    try {
      const code = getSkipperScript();
      iframe.contentWindow.postMessage({
        event: 'flowInject',
        code
      }, '*');
    } catch {
      // Ignore
    }
  }
}

// Script that runs inside the YouTube iframe
function getSkipperScript() {
  return `(() => {
    if (window.__flowAdBlocker) return;
    window.__flowAdBlocker = true;
    const observer = new MutationObserver(() => {
      const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern');
      if (skipBtn) skipBtn.click();
      if (document.querySelector('.ad-showing')) {
        const video = document.querySelector('video');
        if (video) video.currentTime = video.duration;
      }
    });
    observer.observe(document, {childList: true, subtree: true});
  })();`;
}

export function setAdBlockerEnabled(enabled) {
  adBlockerEnabled = enabled;
  storageService.setItem('adBlockerEnabled', enabled);
}

export async function isAdBlockerEnabled() {
  const saved = await storageService.getItem('adBlockerEnabled');
  return saved === null ? true : saved === 'true';
}

(async () => {
  adBlockerEnabled = await isAdBlockerEnabled();
})();
