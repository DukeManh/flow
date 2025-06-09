// Advanced YouTube Ad Blocker for Flow State App
// This module implements techniques similar to dedicated ad blockers
import storageService from './storage.js';

// Ad blocking state
let adBlockerEnabled = true;
let adSkipAttempts = 0;
const MAX_SKIP_ATTEMPTS = 5;

/**
 * Initialize ad blocker for a YouTube iframe element
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
export function initAdBlocker(ytPlayerElement) {
  if (!ytPlayerElement || !adBlockerEnabled) return;
  
  console.log('[AdBlocker] Initializing for YouTube player');
  
  // Set better parameters for minimal ads
  enhanceEmbedParameters(ytPlayerElement);
  
  // Observe iframe load to inject ad-blocking script
  ytPlayerElement.addEventListener('load', () => {
    injectAdSkipper(ytPlayerElement);
  });
  
  // Handle messages from the iframe
  window.addEventListener('message', handleYouTubeMessages);
}

/**
 * Enhance YouTube embed parameters to minimize ads
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function enhanceEmbedParameters(ytPlayerElement) {
  // Get current source
  const currentSrc = ytPlayerElement.src;
  
  // If already has our parameters, don't modify
  if (currentSrc.includes('ad_blocking=true')) return;
  
  // Create URL object for easy parameter manipulation
  try {
    const urlObj = new URL(currentSrc);
    
    // Add our custom parameters
    urlObj.searchParams.set('rel', '0'); // No related videos
    urlObj.searchParams.set('controls', '1'); // Show controls
    urlObj.searchParams.set('iv_load_policy', '3'); // No annotations
    urlObj.searchParams.set('modestbranding', '1'); // Minimal branding
    urlObj.searchParams.set('enablejsapi', '1'); // Enable API
    urlObj.searchParams.set('origin', window.location.origin); // Security
    urlObj.searchParams.set('ad_blocking', 'true'); // Our flag to prevent re-processing
    
    // Update the player source
    ytPlayerElement.src = urlObj.toString();
    
    console.log('[AdBlocker] Enhanced YouTube embed parameters');
  } catch (error) {
    console.error('[AdBlocker] Error updating YouTube parameters:', error);
  }
}

/**
 * Inject ad skipping script into the YouTube iframe
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function injectAdSkipper(ytPlayerElement) {
  try {
    // First check if we can access the iframe content (same-origin policy)
    const iframeDoc = ytPlayerElement.contentDocument || ytPlayerElement.contentWindow?.document;
    
    // If we can access the document, inject directly (only works for same-origin)
    if (iframeDoc) {
      const scriptTag = iframeDoc.createElement('script');
      scriptTag.textContent = getAdSkipperCode();
      iframeDoc.head.appendChild(scriptTag);
      console.log('[AdBlocker] Directly injected ad skipper script');
      return;
    }
    
    // If we can't access directly, use postMessage API
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'addEventListener',
      args: ['onStateChange', 'flowStateAdCheck']
    }), '*');
    
    console.log('[AdBlocker] Registered ad detection via postMessage');
  } catch (error) {
    console.error('[AdBlocker] Error injecting ad skipper:', error);
  }
}

/**
 * Handle messages from the YouTube iframe
 * @param {MessageEvent} event - The message event
 */
function handleYouTubeMessages(event) {
  try {
    // Validate message origin (should be from YouTube)
    if (!event.origin.includes('youtube.com')) return;
    
    // Parse the data
    let data;
    if (typeof event.data === 'string') {
      try {
        data = JSON.parse(event.data);
      } catch {
        // Not a JSON message we care about
        return;
      }
    } else {
      data = event.data;
    }
    
    // Check for ad information
    if (data.type === 'adStateChange' && data.isAd) {
      console.log('[AdBlocker] Ad detected, attempting to skip');
      skipAd(document.querySelector('iframe[src*="youtube.com"]'));
    }
  } catch (error) {
    console.error('[AdBlocker] Error handling YouTube message:', error);
  }
}

/**
 * Skip a detected ad
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function skipAd(ytPlayerElement) {
  if (adSkipAttempts >= MAX_SKIP_ATTEMPTS) {
    console.log('[AdBlocker] Maximum skip attempts reached, giving up');
    return;
  }
  
  adSkipAttempts++;
  
  try {
    // Try various methods to skip the ad
    
    // Method 1: Use the YouTube API to skip
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'seekTo',
      args: [0, true] // Seek to start, then we'll seek to end of ad
    }), '*');
    
    // Method 2: After a small delay, try to skip to end of ad
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'seekTo',
        args: [99999, true] // Seek far forward to try to skip ad
      }), '*');
    }, 500);
    
    // Method 3: After another delay, try to mute and then resume normal
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'mute'
      }), '*');
      
      // Reset the skip attempts counter after a while
      setTimeout(() => {
        adSkipAttempts = 0;
      }, 5000);
    }, 1000);
    
    console.log('[AdBlocker] Attempted to skip ad with multiple methods');
  } catch (error) {
    console.error('[AdBlocker] Error skipping ad:', error);
  }
}

/**
 * Get the ad skipper code to inject into the YouTube iframe
 * @returns {string} - JavaScript code as a string
 */
function getAdSkipperCode() {
  return `
    // YouTube ad detection and skipping code
    (function() {
      const adObserver = new MutationObserver(function(mutations) {
        // Look for ad container elements
        if (document.querySelector('.ad-showing') || 
            document.querySelector('.ytp-ad-player-overlay') ||
            document.querySelector('.ytp-ad-text')) {
          
          // Notify the parent window
          window.parent.postMessage(JSON.stringify({
            type: 'adStateChange',
            isAd: true
          }), '*');
          
          // Try to click the skip button if it exists
          const skipButton = document.querySelector('.ytp-ad-skip-button') || 
                              document.querySelector('.ytp-ad-skip-button-modern');
          if (skipButton) {
            skipButton.click();
            console.log('[YT-AdBlock] Clicked skip button');
          }
          
          // Try to mute the ad
          const muteButton = document.querySelector('.ytp-mute-button');
          if (muteButton && !muteButton.classList.contains('ytp-muted')) {
            muteButton.click();
            console.log('[YT-AdBlock] Muted ad');
          }
        }
      });
      
      // Start observing the entire document for changes
      adObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      // Define the callback function that YouTube API will call
      window.flowStateAdCheck = function(state) {
        // -1: unstarted, 0: ended, 1: playing, 2: paused, 3: buffering, 5: video cued
        if (state === 1) {
          // Check if this is an ad when playing starts
          setTimeout(function() {
            const adShowing = document.querySelector('.ad-showing') ||
                              document.querySelector('.ytp-ad-player-overlay');
            if (adShowing) {
              window.parent.postMessage(JSON.stringify({
                type: 'adStateChange',
                isAd: true
              }), '*');
            }
          }, 500);
        }
      };
      
      console.log('[YT-AdBlock] Ad detection initialized');
    })();
  `;
}

/**
 * Enable or disable the ad blocker
 * @param {boolean} enabled - Whether to enable ad blocking
 */
export function setAdBlockerEnabled(enabled) {
  adBlockerEnabled = enabled;
  storageService.setItem('adBlockerEnabled', enabled);
  console.log(`[AdBlocker] ${enabled ? 'Enabled' : 'Disabled'}`);
}

/**
 * Get the current ad blocker enabled state
 * @returns {Promise<boolean>} - Whether ad blocking is enabled
 */
export async function isAdBlockerEnabled() {
  try {
    const savedState = await storageService.getItem('adBlockerEnabled');
    return savedState === null ? true : savedState === 'true';
  } catch (error) {
    console.error('[AdBlocker] Error getting state:', error);
    return true; // Default to enabled
  }
}

// Initialize when the module loads
(async function() {
  adBlockerEnabled = await isAdBlockerEnabled();
})();