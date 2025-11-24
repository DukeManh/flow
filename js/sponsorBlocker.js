// SponsorBlocker integration for YouTube embeds
// Fetch sponsor segment data using the SponsorBlock public API and
// automatically seek past those sections while the video plays.

const activePlayers = new Map();
const API_URL = 'https://sponsor.ajay.app/api/skipSegments';
const DEFAULT_CATEGORIES = [
  'sponsor',
  'selfpromo',
  'interaction',
  'intro',
  'outro',
  'preview',
  'music_offtopic'
];

/**
 * Initialize SponsorBlocker for a YouTube iframe element.
 * Uses the YouTube Iframe API via postMessage so we don't need to inject
 * code into the cross‑origin iframe.
 *
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element.
 * @param {string} videoID - The YouTube video ID.
 */
export async function initSponsorBlocker(ytPlayerElement, videoID) {
  if (!ytPlayerElement || !videoID) return;

  // Clean up any existing blocker on this element
  removeSponsorBlocker(ytPlayerElement);

  const segments = await fetchSponsorSegments(videoID);
  if (!segments.length) return;

  // Unique id for requests so we can match responses from the iframe
  const requestId = `sb_${Date.now()}`;

  const onMessage = (event) => {
    if (!event.origin.includes('youtube.com')) return;
    if (typeof event.data !== 'string') return;

    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    if (data.event === 'infoDelivery' && data.id === requestId) {
      const time = data.info && Number(data.info.currentTime);
      if (Number.isFinite(time)) {
        checkSegments(time);
      }
    }
  };

  function pollCurrentTime() {
    ytPlayerElement.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: 'getCurrentTime', id: requestId }),
      '*'
    );
  }

  function checkSegments(currentTime) {
    for (const seg of segments) {
      if (currentTime >= seg.start && currentTime < seg.end) {
        ytPlayerElement.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func: 'seekTo',
            args: [seg.end, true],
          }),
          '*'
        );
        break;
      }
    }
  }

  const sendListening = () => {
    ytPlayerElement.contentWindow.postMessage(
      JSON.stringify({ event: 'listening', id: requestId }),
      '*'
    );
  };

  const loadListener = () => sendListening();
  ytPlayerElement.addEventListener('load', loadListener);

  // Attempt to send the initial listening command immediately
  sendListening();

  const intervalId = setInterval(pollCurrentTime, 1000);
  window.addEventListener('message', onMessage);
  activePlayers.set(ytPlayerElement, { intervalId, onMessage, loadListener });
}

/**
 * Clean up SponsorBlocker listeners for a specific iframe.
 * @param {HTMLIFrameElement} ytPlayerElement - The YouTube iframe element.
 */
export function removeSponsorBlocker(ytPlayerElement) {
  const entry = activePlayers.get(ytPlayerElement);
  if (!entry) return;
  clearInterval(entry.intervalId);
  window.removeEventListener('message', entry.onMessage);
  if (entry.loadListener) {
    ytPlayerElement.removeEventListener('load', entry.loadListener);
  }
  activePlayers.delete(ytPlayerElement);
}

async function fetchSponsorSegments(videoID) {
  try {
    const categories = encodeURIComponent(JSON.stringify(DEFAULT_CATEGORIES));
    const actionTypes = encodeURIComponent(JSON.stringify(['skip']));
    const url = `${API_URL}?videoID=${encodeURIComponent(videoID)}&categories=${categories}&actionTypes=${actionTypes}`;

    const resp = await fetch(url);
    const data = await resp.json();
    return (data || []).map((s) => ({
      start: Number(s.segment[0]),
      end: Number(s.segment[1]),
      category: s.category
    }));
  } catch (err) {
    console.error('[SponsorBlocker] API error', err);
    return [];
  }
}

