// Simple ad-blocker for embedded YouTube players used in the Flow app
// Instead of trying to manipulate the YouTube iframe, we load videos from
// an ad-free front-end (Piped). When disabled we restore the original
// YouTube embed URL.

import storageService from './storage.js';

const AD_FREE_DOMAIN = 'https://piped.video';
let adBlockerEnabled = true;

/**
 * Convert a standard YouTube embed URL to a Piped embed URL.
 * @param {string} src - Original YouTube iframe source.
 * @returns {string} Piped embed URL.
 */
function convertToAdFreeUrl(src) {
  try {
    const url = new URL(src);
    let videoId = '';
    if (url.pathname.includes('/embed/')) {
      videoId = url.pathname.split('/embed/')[1];
    } else {
      videoId = url.searchParams.get('v');
    }
    if (!videoId) return src;
    return `${AD_FREE_DOMAIN}/embed/${videoId}${url.search}`;
  } catch {
    return src;
  }
}

/**
 * Replace the iframe src with an ad free version while storing the original.
 * @param {HTMLIFrameElement} iframe
 */
function applyAdFreeEmbed(iframe) {
  if (!iframe || iframe.dataset.originalSrc) return;
  iframe.dataset.originalSrc = iframe.src;
  iframe.src = convertToAdFreeUrl(iframe.src);
  iframe.dataset.adblockerManaged = 'true';
}

/**
 * Restore the original YouTube embed URL if previously replaced.
 * @param {HTMLIFrameElement} iframe
 */
function restoreOriginalEmbed(iframe) {
  if (iframe?.dataset.originalSrc) {
    iframe.src = iframe.dataset.originalSrc;
    delete iframe.dataset.originalSrc;
  }
}

/**
 * Initialize ad blocking for a YouTube iframe element.
 * @param {HTMLIFrameElement} ytPlayerElement
 */
export function initAdBlocker(ytPlayerElement) {
  if (!ytPlayerElement) return;
  if (adBlockerEnabled) {
    applyAdFreeEmbed(ytPlayerElement);
  } else {
    restoreOriginalEmbed(ytPlayerElement);
  }
}

/**
 * Enable or disable the ad blocker at runtime.
 * @param {boolean} enabled
 */
export function setAdBlockerEnabled(enabled) {
  adBlockerEnabled = enabled;
  storageService.setItem('adBlockerEnabled', enabled);
  document
    .querySelectorAll('iframe[data-adblocker-managed="true"]')
    .forEach((iframe) => {
      if (enabled) {
        applyAdFreeEmbed(iframe);
      } else {
        restoreOriginalEmbed(iframe);
      }
    });
  console.log(`[AdBlocker] ${enabled ? 'Enabled' : 'Disabled'}`);
}

/**
 * Read the saved state from storage.
 * @returns {Promise<boolean>}
 */
export async function isAdBlockerEnabled() {
  try {
    const savedState = await storageService.getItem('adBlockerEnabled');
    return savedState === null ? true : savedState === 'true';
  } catch {
    return true;
  }
}

// Initialize state on module load
(async function () {
  adBlockerEnabled = await isAdBlockerEnabled();
})();
