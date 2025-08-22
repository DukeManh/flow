// Network-level ad blocker for YouTube embeds
// Blocks known advertising domains by intercepting fetch and XHR requests.

const BLOCKED_HOSTS = [
  'doubleclick.net',
  'googleadservices.com',
  'googlesyndication.com',
  'youtube.com/api/stats/ads'
];

function shouldBlock(url) {
  try {
    const parsed = new URL(url, window.location.href);
    return BLOCKED_HOSTS.some(host => parsed.hostname.includes(host));
  } catch {
    return false;
  }
}

export function initNetworkAdBlocker() {
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (shouldBlock(url)) {
      console.warn('[NetworkAdBlocker] Blocked request to', url);
      return Promise.resolve(new Response('', { status: 204 }));
    }
    return originalFetch.call(this, url, options);
  };

  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (shouldBlock(url)) {
      console.warn('[NetworkAdBlocker] Blocked XHR to', url);
      this.abort();
      return;
    }
    return origOpen.apply(this, arguments);
  };
}
