// Advanced YouTube Ad Blocker for Flow State App
// This module implements techniques similar to dedicated ad blockers
import storageService from './storage.js';

// Ad blocking state
let adBlockerEnabled = true;
let adSkipAttempts = 0;
const MAX_SKIP_ATTEMPTS = 5; // Increased attempts
let adDetectionInterval = null;
let currentVideoId = null;
let adBlockingStrategies = [];
let lastAdSkipTime = 0;
let consecutiveAdDetections = 0;

// Additional advanced tracking
const AD_DETECTION_PATTERNS = [
  'Advertisement',
  'Sponsored',
  'Ad will end in',
  'Skip Ad',
  'Skip in',
  'You can skip this ad in'
];

/**
 * Initialize ad blocker for a YouTube iframe element
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
export function initAdBlocker(ytPlayerElement) {
  if (!ytPlayerElement || !adBlockerEnabled) return;
  
  console.log('[AdBlocker] Initializing comprehensive ad blocker for YouTube player');
  
  // Set better parameters for minimal ads
  enhanceEmbedParameters(ytPlayerElement);
  
  // Initialize ad blocking strategies
  initializeAdBlockingStrategies();
  
  // Observe iframe load to inject ad-blocking script
  ytPlayerElement.addEventListener('load', () => {
    injectAdvancedAdSkipper(ytPlayerElement);
    startAdDetection(ytPlayerElement);
    startDOMObservation(ytPlayerElement);
  });
  
  // Handle messages from the iframe
  window.addEventListener('message', handleYouTubeMessages);
  
  // Monitor for video changes
  startVideoChangeMonitor(ytPlayerElement);
}

/**
 * Perform aggressive ad skipping using multiple methods
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function performAggressiveAdSkip(ytPlayerElement) {
  // Use the comprehensive ad skipping function instead
  performComprehensiveAdSkip(ytPlayerElement);
  
  // Also apply maximal URL parameters if not already applied
  if (!ytPlayerElement.src.includes('html5=1')) {
    injectMaximalAdBlockingParams(ytPlayerElement);
  }
  
  // Monitor for ad indicators
  monitorAdIndicators(ytPlayerElement);
}

/**
 * Enhanced YouTube embed parameters to minimize ads
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function enhanceEmbedParameters(ytPlayerElement) {
  // Use the maximal ad-blocking parameters instead
  injectMaximalAdBlockingParams(ytPlayerElement);
}

/**
 * Inject advanced ad skipping script into the YouTube iframe
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function injectAdvancedAdSkipper(ytPlayerElement) {
  try {
    // For YouTube iframes (which are always cross-origin), use postMessage API exclusively
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'addEventListener',
      args: ['onStateChange', 'flowStateAdCheck']
    }), '*');
    
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'addEventListener',
      args: ['onAdStateChange', 'flowStateAdStateChange']
    }), '*');
    
    console.log('[AdBlocker] Registered advanced ad detection via postMessage');
    
    // Initial ad check after a short delay
    setTimeout(() => {
      performAggressiveAdSkip(ytPlayerElement);
    }, 1000);
  } catch (error) {
    console.error('[AdBlocker] Error setting up advanced ad detection:', error);
  }
}

/**
 * Start continuous ad detection monitoring
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function startAdDetection(ytPlayerElement) {
  // Clear any existing interval
  if (adDetectionInterval) {
    clearInterval(adDetectionInterval);
  }
  
  // Check for ads every 2 seconds
  adDetectionInterval = setInterval(() => {
    if (adBlockerEnabled) {
      performAggressiveAdSkip(ytPlayerElement);
    }
  }, 2000);
}

/**
 * Monitor for video changes to reset ad blocking state
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function startVideoChangeMonitor(ytPlayerElement) {
  setInterval(() => {
    try {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'getVideoData'
      }), '*');
    } catch (error) {
      // Silently fail for cross-origin restrictions
    }
  }, 5000);
}

/**
 * Handle messages from the YouTube iframe
 * @param {MessageEvent} event - The message event
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
    
    // Handle different types of messages
    if (data.type === 'adStateChange' && data.isAd) {
      console.log('[AdBlocker] Ad detected via message, performing aggressive skip');
      performAggressiveAdSkip(document.querySelector('iframe[src*="youtube.com"]'));
    }
    
    if (data.event === 'video-data-changed' && data.info) {
      const newVideoId = data.info.video_id;
      if (newVideoId && newVideoId !== currentVideoId) {
        currentVideoId = newVideoId;
        adSkipAttempts = 0; // Reset attempts for new video
        console.log('[AdBlocker] Video changed, reset ad blocking state');
      }
    }
  } catch (error) {
    console.error('[AdBlocker] Error handling YouTube message:', error);
  }
}

/**
 * Clean up ad blocker resources
 */
function cleanup() {
  if (adDetectionInterval) {
    clearInterval(adDetectionInterval);
    adDetectionInterval = null;
  }
  window.removeEventListener('message', handleYouTubeMessages);
}

/**
 * Enable or disable the ad blocker
 * @param {boolean} enabled - Whether to enable ad blocking
 */
export function setAdBlockerEnabled(enabled) {
  adBlockerEnabled = enabled;
  storageService.setItem('adBlockerEnabled', enabled);
  
  if (!enabled && adDetectionInterval) {
    clearInterval(adDetectionInterval);
    adDetectionInterval = null;
  }
  
  console.log(`[AdBlocker] ${enabled ? 'Enabled' : 'Disabled'} advanced ad blocking`);
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
    return true;
  }
}

/**
 * Initialize comprehensive ad blocking strategies
 */
function initializeAdBlockingStrategies() {
  adBlockingStrategies = [
    'mute_immediately',
    'skip_ad_api',
    'seek_beyond_ads',
    'playback_rate_manipulation',
    'stop_restart_cycle',
    'dom_manipulation',
    'video_quality_downgrade',
    'buffer_manipulation'
  ];
  
  console.log('[AdBlocker] Initialized', adBlockingStrategies.length, 'ad blocking strategies');
}

/**
 * Start DOM observation for ad-related elements
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function startDOMObservation(ytPlayerElement) {
  // Since we can't access iframe content directly, we'll monitor the iframe itself
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        // Video changed, reset ad blocking state
        adSkipAttempts = 0;
        consecutiveAdDetections = 0;
        console.log('[AdBlocker] Video source changed, resetting ad block state');
      }
    });
  });
  
  observer.observe(ytPlayerElement, {
    attributes: true,
    attributeFilter: ['src']
  });
}

/**
 * Enhanced aggressive ad skipping with all SkipCut techniques
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function performComprehensiveAdSkip(ytPlayerElement) {
  if (!ytPlayerElement || adSkipAttempts >= MAX_SKIP_ATTEMPTS) {
    return;
  }
  
  const now = Date.now();
  if (now - lastAdSkipTime < 1000) return; // Debounce rapid calls
  lastAdSkipTime = now;
  
  adSkipAttempts++;
  consecutiveAdDetections++;
  
  try {
    console.log(`[AdBlocker] Performing comprehensive ad skip (attempt ${adSkipAttempts})`);
    
    // Strategy 1: Immediate mute
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'mute'
    }), '*');
    
    // Strategy 2: Multiple skip attempts with different timings
    const skipCommands = ['skipAd', 'nextVideo', 'pauseVideo'];
    skipCommands.forEach((cmd, index) => {
      setTimeout(() => {
        ytPlayerElement.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: cmd
        }), '*');
      }, index * 100);
    });
    
    // Strategy 3: Aggressive seeking beyond typical ad duration
    setTimeout(() => {
      const seekTargets = [5, 10, 15, 30, 60]; // Multiple seek targets
      seekTargets.forEach((seconds, index) => {
        setTimeout(() => {
          ytPlayerElement.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [seconds, true]
          }), '*');
        }, index * 50);
      });
    }, 150);
    
    // Strategy 4: Playback rate manipulation
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'setPlaybackRate',
        args: [16] // Maximum speed
      }), '*');
      
      // Restore normal rate after brief period
      setTimeout(() => {
        ytPlayerElement.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setPlaybackRate',
          args: [1]
        }), '*');
      }, 1000);
    }, 300);
    
    // Strategy 5: Volume manipulation
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'setVolume',
        args: [0]
      }), '*');
      
      // Restore volume after ad should be over
      setTimeout(() => {
        ytPlayerElement.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [50]
        }), '*');
      }, 2000);
    }, 400);
    
    // Strategy 6: Advanced state manipulation
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'stopVideo'
      }), '*');
      
      setTimeout(() => {
        ytPlayerElement.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'playVideo'
        }), '*');
      }, 200);
    }, 500);
    
    // Strategy 7: Quality downgrade to potentially reduce ad quality
    setTimeout(() => {
      ytPlayerElement.contentWindow.postMessage(JSON.stringify({
        event: 'command',
        func: 'setPlaybackQuality',
        args: ['small']
      }), '*');
      
      // Restore quality
      setTimeout(() => {
        ytPlayerElement.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setPlaybackQuality',
          args: ['default']
        }), '*');
      }, 3000);
    }, 600);
    
    // Strategy 8: If multiple consecutive detections, reload iframe
    if (consecutiveAdDetections >= 3) {
      setTimeout(() => {
        console.log('[AdBlocker] Multiple ad detections, attempting iframe reload');
        const currentSrc = ytPlayerElement.src;
        ytPlayerElement.src = '';
        setTimeout(() => {
          ytPlayerElement.src = currentSrc;
          consecutiveAdDetections = 0;
        }, 100);
      }, 2000);
    }
    
    // Reset attempts gradually
    setTimeout(() => {
      adSkipAttempts = Math.max(0, adSkipAttempts - 1);
    }, 15000);
    
    console.log('[AdBlocker] Applied comprehensive ad blocking strategies');
  } catch (error) {
    console.error('[AdBlocker] Error in comprehensive ad skipping:', error);
    adSkipAttempts = 0;
  }
}

/**
 * Monitor for specific ad indicators in YouTube API responses
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function monitorAdIndicators(ytPlayerElement) {
  try {
    // Check for ad-related player states
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'listening',
      id: 'ad-monitor',
      channel: 'widget'
    }), '*');
    
    // Request detailed player info
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'getPlayerState'
    }), '*');
    
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'getCurrentTime'
    }), '*');
    
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'getDuration'
    }), '*');
    
    // Check for ad-specific data
    ytPlayerElement.contentWindow.postMessage(JSON.stringify({
      event: 'command',
      func: 'getVideoData'
    }), '*');
    
  } catch (error) {
    console.error('[AdBlocker] Error monitoring ad indicators:', error);
  }
}

/**
 * Enhanced URL parameter injection for maximum ad blocking
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element
 */
function injectMaximalAdBlockingParams(ytPlayerElement) {
  try {
    const currentSrc = ytPlayerElement.src;
    const urlObj = new URL(currentSrc);
    
    // Comprehensive ad-blocking parameters from SkipCut
    const adBlockParams = {
      'rel': '0',                    // No related videos
      'controls': '1',               // Show controls
      'iv_load_policy': '3',         // No annotations
      'modestbranding': '1',         // Minimal YouTube branding
      'enablejsapi': '1',            // Enable JavaScript API
      'autoplay': '1',               // Autoplay to skip past ads
      'fs': '1',                     // Allow fullscreen
      'playsinline': '1',            // Play inline on mobile
      'disablekb': '0',              // Enable keyboard
      'cc_load_policy': '0',         // No captions by default
      'widget_referrer': window.location.origin,
      'html5': '1',                  // Force HTML5 player
      'ad_blocking': 'true',         // Custom flag
      'origin': window.location.origin,
      'host': window.location.hostname,
      'hl': 'en',                    // Language
      'start': '0'                   // Start from beginning
    };
    
    Object.entries(adBlockParams).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    
    if (ytPlayerElement.src !== urlObj.toString()) {
      ytPlayerElement.src = urlObj.toString();
      console.log('[AdBlocker] Applied maximal ad-blocking URL parameters');
    }
  } catch (error) {
    console.error('[AdBlocker] Error injecting maximal ad-blocking params:', error);
  }
}

// Initialize when the module loads
(async function() {
  adBlockerEnabled = await isAdBlockerEnabled();
})();

// Clean up on page unload
window.addEventListener('beforeunload', cleanup);