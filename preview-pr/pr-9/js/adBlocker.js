// Enhanced YouTube ad blocker for Flow State App
// Applies ad-resistant parameters and injects an ad skipping script.
// When disabled the original iframe source is restored.

import storageService from './storage.js';

let adBlockerEnabled = true;
let adSkipAttempts = 0;
const MAX_SKIP_ATTEMPTS = 5;
let listenerRegistered = false;

/**
 * Add parameters to reduce ads and enable the YouTube JS API.
 * @param {string} src
 * @returns {string}
 */
function enhanceEmbedUrl(src) {
  try {
    const url = new URL(src);
    if (url.hostname.includes('youtube.com')) {
      url.hostname = url.hostname.replace('youtube.com', 'youtube-nocookie.com');
    }
    if (url.searchParams.get('ad_block') === 'true') return src;
    url.searchParams.set('rel', '0');
    url.searchParams.set('controls', '1');
    url.searchParams.set('iv_load_policy', '3');
    url.searchParams.set('modestbranding', '1');
    url.searchParams.set('enablejsapi', '1');
    url.searchParams.set('origin', window.location.origin);
    url.searchParams.set('playsinline', '1');
    url.searchParams.set('fs', '1');
    url.searchParams.set('ad_block', 'true');
    return url.toString();
  } catch {
    return src;
  }
}

/**
 * Inject the ad skipping helper once the iframe loads.
 * @param {HTMLIFrameElement} iframe
 */
function injectAdSkipper(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (iframeDoc) {
      const scriptTag = iframeDoc.createElement('script');
      scriptTag.textContent = getAdSkipperCode();
      iframeDoc.head.appendChild(scriptTag);
      return;
    }

    iframe.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'addEventListener', args: ['onStateChange', 'flowStateAdCheck'] }),
      '*'
    );
  } catch (error) {
    console.error('[AdBlocker] Error injecting ad skipper:', error);
  }
}

/**
 * Handle messages from the YouTube iframe and skip detected ads.
 * @param {MessageEvent} event
 */
function handleYouTubeMessages(event) {
  try {
    if (!event.origin.includes('youtube.com')) return;
    let data;
    if (typeof event.data === 'string') {
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }
    } else {
      data = event.data;
    }
    if (data.type === 'adStateChange' && data.isAd) {
      const ytFrame = document.querySelector('iframe[data-adblocker-managed="true"]');
      if (ytFrame) skipAd(ytFrame);
    }
  } catch (error) {
    console.error('[AdBlocker] Message handling error:', error);
  }
}

/**
 * Attempt to skip the current ad using several techniques.
 * @param {HTMLIFrameElement} ytPlayerElement
 */
function skipAd(ytPlayerElement) {
  if (adSkipAttempts >= MAX_SKIP_ATTEMPTS) return;
  adSkipAttempts++;
  try {
    ytPlayerElement.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'seekTo', args: [0, true] }),
      '*'
    );
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [99999, true] }),
        '*'
      );
    }, 500);
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'mute' }),
        '*'
      );
      setTimeout(() => {
        adSkipAttempts = 0;
      }, 5000);
    }, 1000);
  } catch (error) {
    console.error('[AdBlocker] Error skipping ad:', error);
  }
}

/**
 * Script injected into the iframe to detect ad playback.
 * @returns {string}
 */
function getAdSkipperCode() {
  return `
    (function() {
      const adObserver = new MutationObserver(() => {
        if (document.querySelector('.ad-showing') ||
            document.querySelector('.ytp-ad-player-overlay') ||
            document.querySelector('.ytp-ad-text')) {
          window.parent.postMessage(JSON.stringify({ type: 'adStateChange', isAd: true }), '*');
          const skipButton = document.querySelector('.ytp-ad-skip-button') ||
                              document.querySelector('.ytp-ad-skip-button-modern');
          if (skipButton) skipButton.click();
          const muteButton = document.querySelector('.ytp-mute-button');
          if (muteButton && !muteButton.classList.contains('ytp-muted')) muteButton.click();
        }
      });
      adObserver.observe(document.documentElement, { childList: true, subtree: true });
      window.flowStateAdCheck = function(state) {
        if (state === 1) {
          setTimeout(function() {
            const adShowing = document.querySelector('.ad-showing') ||
                                document.querySelector('.ytp-ad-player-overlay');
            if (adShowing) {
              window.parent.postMessage(JSON.stringify({ type: 'adStateChange', isAd: true }), '*');
            }
          }, 500);
        }
      };
    })();
  `;
}

function extractVideoId(src) {
  try {
    const url = new URL(src);
    const embedIdx = url.pathname.indexOf('/embed/');
    if (embedIdx !== -1) {
      return url.pathname.substring(embedIdx + 7).split(/[?&]/)[0];
    }
    return url.searchParams.get('v');
  } catch {
    return null;
  }
}

async function applyAdBlocker(iframe) {
  if (!iframe || iframe.dataset.originalSrc) return;
  iframe.dataset.originalSrc = iframe.src;
  iframe.dataset.adblockerManaged = 'true';
  iframe.src = enhanceEmbedUrl(iframe.src);
  iframe.addEventListener('load', () => injectAdSkipper(iframe), { once: true });
  if (!listenerRegistered) {
    window.addEventListener('message', handleYouTubeMessages);
    listenerRegistered = true;
  }
}

/** Restore the original iframe source if replaced. */
function restoreOriginalEmbed(iframe) {
  if (iframe?.dataset.originalSrc) {
    iframe.src = iframe.dataset.originalSrc;
    delete iframe.dataset.originalSrc;
    iframe.removeAttribute('data-adblocker-managed');
  }
}

export async function initAdBlocker(ytPlayerElement) {
  if (!ytPlayerElement) return;
  if (adBlockerEnabled) {
    await applyAdBlocker(ytPlayerElement);
  } else {
    restoreOriginalEmbed(ytPlayerElement);
  }
}

export function setAdBlockerEnabled(enabled) {
  adBlockerEnabled = enabled;
  storageService.setItem('adBlockerEnabled', enabled);
  document.querySelectorAll('iframe[data-adblocker-managed="true"]').forEach((iframe) => {
    if (enabled) {
      applyAdBlocker(iframe);
    } else {
      restoreOriginalEmbed(iframe);
    }
  });
  console.log(`[AdBlocker] ${enabled ? 'Enabled' : 'Disabled'}`);
}

export async function isAdBlockerEnabled() {
  try {
    const savedState = await storageService.getItem('adBlockerEnabled');
    return savedState === null ? true : savedState === 'true';
  } catch {
    return true;
  }
}

(async function () {
  adBlockerEnabled = await isAdBlockerEnabled();
})();
