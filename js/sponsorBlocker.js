// SponsorBlock integration for YouTube iframes
// This module fetches SponsorBlock segments for the current video
// and skips them during playback.

import storageService from './storage.js';

let sponsorBlockEnabled = true;
let apiLoading = false;
let apiReady = false;
const pendingIframes = new Set();
const players = new WeakMap();

const SEGMENT_CATEGORIES = [
  'sponsor',
  'selfpromo',
  'interaction',
  'intro',
  'outro',
  'preview',
  'music_offtopic',
  'filler'
];

function loadYouTubeAPI() {
  if (apiReady || apiLoading || window.YT) {
    waitForAPI();
    return;
  }
  apiLoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  waitForAPI();
}

function waitForAPI() {
  if (window.YT && window.YT.Player) {
    apiReady = true;
    pendingIframes.forEach(ifr => setupPlayer(ifr));
    pendingIframes.clear();
    return;
  }
  setTimeout(waitForAPI, 100);
}

export function initSponsorBlocker(iframe) {
  if (!sponsorBlockEnabled || !iframe) return;
  loadYouTubeAPI();
  if (apiReady && window.YT && window.YT.Player) {
    setupPlayer(iframe);
  } else {
    pendingIframes.add(iframe);
  }
}

function setupPlayer(iframe) {
  if (players.has(iframe)) return;

  const player = iframe._adBlockerPlayer || new YT.Player(iframe);
  const data = { player, segments: [], checkInterval: null, currentId: null };
  players.set(iframe, data);

  player.addEventListener('onStateChange', () => onStateChange(iframe));

  if (player.getPlayerState && player.getPlayerState() === YT.PlayerState.PLAYING) {
    onStateChange(iframe);
  }
}

function onStateChange(iframe) {
  const data = players.get(iframe);
  if (!data) return;
  const state = data.player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) {
    const vid = data.player.getVideoData().video_id;
    if (vid && vid !== data.currentId) {
      data.currentId = vid;
      fetchSegments(vid).then(segments => { data.segments = segments; });
    }
    startChecking(iframe);
  } else {
    stopChecking(iframe);
  }
}

function startChecking(iframe) {
  const data = players.get(iframe);
  if (!data || data.checkInterval) return;
  data.checkInterval = setInterval(() => {
    const time = data.player.getCurrentTime();
    for (const seg of data.segments) {
      const [start, end] = seg.segment;
      if (time >= start && time < end) {
        data.player.seekTo(end, true);
        break;
      }
    }
  }, 500);
}

function stopChecking(iframe) {
  const data = players.get(iframe);
  if (data && data.checkInterval) {
    clearInterval(data.checkInterval);
    data.checkInterval = null;
  }
}

async function fetchSegments(videoId) {
  try {
    const cats = encodeURIComponent(JSON.stringify(SEGMENT_CATEGORIES));
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}&categories=${cats}&actionTypes=[\"skip\",\"mute\"]`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const segments = await res.json();
    return Array.isArray(segments) ? segments : [];
  } catch {
    return [];
  }
}

export function setSponsorBlockEnabled(enabled) {
  sponsorBlockEnabled = enabled;
  storageService.setItem('sponsorBlockEnabled', enabled);
}

export async function isSponsorBlockEnabled() {
  const saved = await storageService.getItem('sponsorBlockEnabled');
  return saved === null ? true : saved === 'true';
}

(async () => {
  sponsorBlockEnabled = await isSponsorBlockEnabled();
})();
