import JSZip from 'jszip';
import { ExtensionFile, WatchlistItem } from '../types';

export function getExtensionFiles(currentWatchlist: WatchlistItem[], customAlertText: string): ExtensionFile[] {
  const defaultWatchlistJson = JSON.stringify(currentWatchlist, null, 2);

  const manifestJson = {
    manifest_version: 3,
    name: "Audio Copyright Sentinel",
    version: "1.1.0",
    description: "Auto-detects playing audio and alerts with a red warning banner if songs or artists match your copyright watchlist.",
    permissions: ["storage", "unlimitedStorage", "activeTab", "alarms"],
    host_permissions: ["<all_urls>"],
    background: {
      service_worker: "background.js",
      type: "module"
    },
    action: {
      default_popup: "popup.html",
      default_title: "Audio Copyright Sentinel"
    },
    browser_specific_settings: {
      gecko: {
        id: "audio-sentinel@copyright-sentinel.local",
        strict_min_version: "109.0"
      }
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        css: ["styles.css"],
        run_at: "document_idle",
        all_frames: false
      }
    ]
  };

  const contentJs = `/**
 * Audio Copyright Sentinel - Content Script
 * Robust multi-source media detection for YouTube, Spotify, and HTML5 video/audio.
 */

(() => {
  let watchlist = [];
  let isEnabled = true;
  let customWarningText = ${JSON.stringify(customAlertText || '⚠️ COPYRIGHT WARNING: Copyright law may apply! Used with caution.')};
  let activeWarningBanner = null;
  let lastEvaluatedKey = '';

  const storage = chrome.storage.local || chrome.storage.sync;

  // Load configuration from Chrome storage
  function loadConfig() {
    if (storage) {
      storage.get(['sentinel_watchlist', 'sentinel_enabled', 'sentinel_warning_text'], (data) => {
        if (chrome.runtime.lastError) {
          console.warn('[Sentinel] Storage read error:', chrome.runtime.lastError.message);
          return;
        }
        if (data.sentinel_watchlist && Array.isArray(data.sentinel_watchlist)) {
          watchlist = data.sentinel_watchlist;
          console.log('[Sentinel] Loaded watchlist items:', watchlist.length);
        }
        if (typeof data.sentinel_enabled !== 'undefined') isEnabled = data.sentinel_enabled;
        if (data.sentinel_warning_text) customWarningText = data.sentinel_warning_text;

        // Immediately check currently playing media once watchlist arrives
        evaluateAllMedia();
      });
    }
  }

  loadConfig();
  if (chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener(loadConfig);
  }

  // Unicode-aware string normalizer: preserves Sinhala, Latin, Arabic, Asian characters
  function normalize(str) {
    if (!str) return '';
    return str
      .toLowerCase()
      .replace(/\\(.*?\\)|\\[.*?\\]/g, ' ')
      .replace(/\\b(official|audio|video|remix|hd|4k|lyrics|mv|visualizer|song|songs|new|version|original|full|clip)\\b/gi, ' ')
      .replace(/[^\\p{L}\\p{N}\\s]/gu, ' ')
      .replace(/\\s+/g, ' ')
      .trim();
  }

  // Multi-tier matcher (exact substring, full containment, and token overlap)
  function matchesWatchlist(title, artist, combined) {
    if (!watchlist || watchlist.length === 0) return null;

    const normTitle = normalize(title);
    const normArtist = normalize(artist);
    const normCombined = normalize(combined || (title + ' ' + artist + ' ' + document.title));

    for (const item of watchlist) {
      if (!item.enabled) continue;
      const rawTarget = item.name || '';
      const target = normalize(rawTarget);
      if (!target || target.length < 2) continue;

      // 1. Direct substring matching across all candidate text sources
      if (normCombined.includes(target) || normTitle.includes(target) || normArtist.includes(target)) {
        return { item, matchedOn: (item.type ? item.type.toUpperCase() : 'RULE') + ': ' + item.name };
      }

      // 2. Reverse containment (e.g. watchlist item has extra detail that includes current title)
      if (normTitle.length > 5 && target.includes(normTitle)) {
        return { item, matchedOn: (item.type ? item.type.toUpperCase() : 'RULE') + ': ' + item.name };
      }

      // 3. Token set intersection (handles words in different orders or minor wording variations)
      const targetTokens = target.split(' ').filter((t) => t.length >= 2);
      if (targetTokens.length >= 2) {
        const combinedTokens = new Set(normCombined.split(' '));
        let matchedCount = 0;
        for (const tok of targetTokens) {
          if (combinedTokens.has(tok)) {
            matchedCount++;
          }
        }
        // If 70% or more of significant words match
        if (matchedCount / targetTokens.length >= 0.7) {
          return { item, matchedOn: (item.type ? item.type.toUpperCase() : 'MATCH') + ': ' + item.name };
        }
      } else if (targetTokens.length === 1 && targetTokens[0].length >= 3) {
        const combinedTokens = new Set(normCombined.split(' '));
        if (combinedTokens.has(targetTokens[0])) {
          return { item, matchedOn: (item.type ? item.type.toUpperCase() : 'KEYWORD') + ': ' + item.name };
        }
      }
    }
    return null;
  }

  // Extract metadata across YouTube, Spotify, SoundCloud, MediaSession & document.title
  function extractPageMetadata() {
    let title = '';
    let artist = '';
    const candidates = [];

    // 1. MediaSession API
    if (navigator.mediaSession && navigator.mediaSession.metadata) {
      if (navigator.mediaSession.metadata.title) {
        title = navigator.mediaSession.metadata.title;
        candidates.push(title);
      }
      if (navigator.mediaSession.metadata.artist) {
        artist = navigator.mediaSession.metadata.artist;
        candidates.push(artist);
      }
    }

    // 2. YouTube Specific DOM elements
    if (window.location.hostname.includes('youtube.com')) {
      const ytSelectors = [
        'h1.style-scope.ytd-watch-metadata yt-formatted-string',
        'ytd-watch-metadata #title h1 yt-formatted-string',
        '#title h1 yt-formatted-string',
        '#title h1',
        'h1.ytd-video-primary-info-renderer',
        'meta[name="title"]',
        'meta[property="og:title"]'
      ];

      for (const sel of ytSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const val = el.innerText || el.getAttribute('content') || '';
          if (val.trim()) {
            if (!title) title = val.trim();
            candidates.push(val.trim());
            break;
          }
        }
      }

      // YouTube Channel / Creator
      const channelSelectors = [
        '#upload-info ytd-channel-name a',
        '#channel-name a',
        '#owner-name a',
        'ytd-channel-name yt-formatted-string a',
        'link[itemprop="name"]'
      ];

      for (const sel of channelSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          const val = el.innerText || el.getAttribute('content') || '';
          if (val.trim()) {
            if (!artist) artist = val.trim();
            candidates.push(val.trim());
            break;
          }
        }
      }
    }

    // 3. Fallback to document.title (YouTube always puts the video title in document.title)
    if (document.title) {
      const cleanDocTitle = document.title.replace(/\\s*-\\s*YouTube$/i, '').trim();
      if (!title) title = cleanDocTitle;
      candidates.push(cleanDocTitle);
    }

    const combined = candidates.join(' ');
    return { title: title || document.title, artist, combined };
  }

  // Inject or update the Red Caution HUD Warning
  function showWarningHUD(matchInfo, mediaElement) {
    if (activeWarningBanner) {
      activeWarningBanner.remove();
    }

    const host = document.createElement('div');
    host.id = 'audio-copyright-sentinel-hud';
    const shadow = host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = \`
      :host {
        all: initial;
        position: fixed !important;
        bottom: 24px !important;
        right: 24px !important;
        z-index: 2147483647 !important;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
        pointer-events: auto !important;
      }
      .banner {
        background: #090d16;
        border: 2px solid #ef4444;
        border-radius: 12px;
        padding: 16px 20px;
        color: #f8fafc;
        box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.7);
        max-width: 440px;
        animation: slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideIn {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
      }
      .badge {
        background: #ef4444;
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.05em;
        padding: 2px 8px;
        border-radius: 4px;
        text-transform: uppercase;
      }
      .title {
        font-size: 14px;
        font-weight: 700;
        color: #fca5a5;
        line-height: 1.3;
      }
      .message {
        font-size: 13px;
        color: #e2e8f0;
        margin-bottom: 12px;
        line-height: 1.4;
      }
      .match-tag {
        font-size: 12px;
        color: #cbd5e1;
        background: #1e293b;
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 12px;
        border-left: 3px solid #ef4444;
      }
      .actions {
        display: flex;
        gap: 8px;
        align-items: center;
      }
      button {
        cursor: pointer;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        transition: all 0.15s ease;
      }
      .btn-mute {
        background: #dc2626;
        color: #ffffff;
        border: none;
      }
      .btn-mute:hover { background: #b91c1c; }
      .btn-dismiss {
        background: #334155;
        color: #cbd5e1;
        border: 1px solid #475569;
      }
      .btn-dismiss:hover { background: #475569; color: #ffffff; }
    \`;

    const banner = document.createElement('div');
    banner.className = 'banner';
    banner.innerHTML = \`
      <div class="header">
        <span class="badge">Caution</span>
        <span class="title">Copyright Law May Apply</span>
      </div>
      <div class="message">\${customWarningText}</div>
      <div class="match-tag">
        <strong>Matched Watchlist:</strong> \${matchInfo.matchedOn}
      </div>
      <div class="actions">
        <button class="btn-mute" id="mute-btn">\${mediaElement && mediaElement.muted ? 'Unmute Audio' : 'Mute Audio'}</button>
        <button class="btn-dismiss" id="dismiss-btn">Dismiss Warning</button>
      </div>
    \`;

    shadow.appendChild(style);
    shadow.appendChild(banner);

    // Attach to fullscreen container if active, otherwise body
    const targetParent = document.fullscreenElement || document.body;
    targetParent.appendChild(host);
    activeWarningBanner = host;

    // Send notification to extension service worker
    if (chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'COPYRIGHT_MATCH_TRIGGERED',
        matchInfo,
        url: window.location.href
      });
    }

    // Handlers
    const muteBtn = shadow.getElementById('mute-btn');
    if (muteBtn && mediaElement) {
      muteBtn.addEventListener('click', () => {
        mediaElement.muted = !mediaElement.muted;
        muteBtn.textContent = mediaElement.muted ? 'Unmute Audio' : 'Mute Audio';
      });
    }

    const dismissBtn = shadow.getElementById('dismiss-btn');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        host.remove();
        activeWarningBanner = null;
      });
    }
  }

  // Main evaluation trigger on playback
  function evaluatePlayingMedia(mediaElement) {
    if (!isEnabled || !watchlist || watchlist.length === 0) return;
    const { title, artist, combined } = extractPageMetadata();
    if (!title && !combined) return;

    const evaluationKey = combined;
    if (evaluationKey === lastEvaluatedKey && activeWarningBanner) {
      return;
    }

    const match = matchesWatchlist(title, artist, combined);
    if (match) {
      lastEvaluatedKey = evaluationKey;
      console.log('[Sentinel] Warning triggered for:', match.matchedOn);
      showWarningHUD(match, mediaElement);
    }
  }

  function evaluateAllMedia() {
    const media = document.querySelectorAll('audio, video');
    for (const el of media) {
      if (!el.paused || el.currentTime > 0) {
        evaluatePlayingMedia(el);
      }
    }
  }

  // Hook all existing and newly attached audio/video elements
  function attachMediaListeners(element) {
    if (element.__sentinel_attached) return;
    element.__sentinel_attached = true;

    element.addEventListener('play', () => evaluatePlayingMedia(element));
    element.addEventListener('playing', () => evaluatePlayingMedia(element));
    element.addEventListener('timeupdate', () => {
      if (!element.paused && !activeWarningBanner) {
        evaluatePlayingMedia(element);
      }
    });
  }

  // Scan current DOM
  document.querySelectorAll('audio, video').forEach(attachMediaListeners);

  // Observe dynamically inserted media tags
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName === 'AUDIO' || node.tagName === 'VIDEO') {
            attachMediaListeners(node);
          } else {
            node.querySelectorAll('audio, video').forEach(attachMediaListeners);
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // YouTube SPA navigation listeners
  window.addEventListener('yt-navigate-finish', () => {
    lastEvaluatedKey = '';
    setTimeout(evaluateAllMedia, 500);
    setTimeout(evaluateAllMedia, 1500);
  });

  window.addEventListener('yt-page-data-updated', () => {
    lastEvaluatedKey = '';
    setTimeout(evaluateAllMedia, 500);
    setTimeout(evaluateAllMedia, 1500);
  });

  // Watch document.title mutations (fires when YouTube updates video title)
  const titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(() => {
      lastEvaluatedKey = '';
      setTimeout(evaluateAllMedia, 400);
    }).observe(titleEl, { childList: true });
  }

  // Polling fallback while playing
  setInterval(() => {
    const video = document.querySelector('video');
    if (video && !video.paused && !activeWarningBanner) {
      evaluatePlayingMedia(video);
    }
  }, 1200);
})();
`;

  const backgroundJs = `/**
 * Audio Copyright Sentinel - Background Service Worker
 * Handles badge notifications, persistent local storage, and remote OTA rules synchronization.
 */

const storage = chrome.storage.local || chrome.storage.sync;

// Periodic Remote Sync Alarm (every 6 hours)
chrome.alarms.create('SENTINEL_REMOTE_SYNC_ALARM', { periodInMinutes: 360 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'SENTINEL_REMOTE_SYNC_ALARM') {
    syncRemoteWatchlist();
  }
});

async function syncRemoteWatchlist() {
  storage.get(['sentinel_remote_url', 'sentinel_watchlist'], async (data) => {
    const url = data.sentinel_remote_url;
    if (!url) return;

    try {
      console.log('[Sentinel] Checking remote repository at:', url);
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        console.warn('[Sentinel] Remote fetch failed with status:', res.status);
        return;
      }

      const remoteRules = await res.json();
      if (Array.isArray(remoteRules) && remoteRules.length > 0) {
        storage.set({
          sentinel_watchlist: remoteRules,
          sentinel_last_sync: new Date().toISOString()
        }, () => {
          console.log('[Sentinel] Successfully updated watchlist via remote sync! Items:', remoteRules.length);
        });
      }
    } catch (err) {
      console.warn('[Sentinel] Remote sync network error:', err.message);
    }
  });
}

chrome.runtime.onInstalled.addListener(() => {
  // Use chrome.storage.local to support thousands of songs without hitting the 8KB sync quota
  storage.get(['sentinel_watchlist', 'sentinel_remote_url'], (result) => {
    if (chrome.runtime.lastError) {
      console.warn('Storage read warning:', chrome.runtime.lastError.message);
    }
    if (!result || !result.sentinel_watchlist || result.sentinel_watchlist.length === 0) {
      storage.set({
        sentinel_watchlist: ${defaultWatchlistJson},
        sentinel_enabled: true,
        sentinel_warning_text: ${JSON.stringify(customAlertText)}
      });
    }
    // Attempt initial remote sync if URL is configured
    if (result && result.sentinel_remote_url) {
      syncRemoteWatchlist();
    }
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'COPYRIGHT_MATCH_TRIGGERED' && sender.tab) {
    // Set badge to WARN in red
    chrome.action.setBadgeText({ text: '!', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#EF4444', tabId: sender.tab.id });
  } else if (message.type === 'TRIGGER_REMOTE_SYNC') {
    syncRemoteWatchlist().then(() => sendResponse({ ok: true }));
    return true; // asynchronous
  }
});
`;

  const popupHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 380px;
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090d16;
      color: #f8fafc;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 14px;
      font-weight: 700;
      color: #f87171;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .status-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #94a3b8;
    }
    .watchlist-box {
      background: #111827;
      border: 1px solid #1f2937;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
    }
    .box-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .watchlist-title {
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
      color: #94a3b8;
      letter-spacing: 0.05em;
    }
    .count-badge {
      font-size: 11px;
      color: #38bdf8;
      font-weight: 600;
    }
    .search-input {
      width: 100%;
      box-sizing: border-box;
      background: #090d16;
      border: 1px solid #374151;
      color: white;
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 8px;
    }
    .watchlist-list {
      max-height: 190px;
      overflow-y: auto;
      font-size: 12px;
      border: 1px solid #1f2937;
      border-radius: 6px;
      background: #090d16;
      padding: 4px 8px;
    }
    .item-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 0;
      border-bottom: 1px solid #1f2937;
    }
    .item-name { font-weight: 600; color: #f1f5f9; }
    .item-type { color: #94a3b8; font-size: 11px; margin-left: 4px; }
    .input-row {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    input, select {
      background: #090d16;
      border: 1px solid #374151;
      color: white;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 12px;
    }
    input { flex: 1; }
    .btn-add {
      width: 100%;
      background: #ef4444;
      color: white;
      border: none;
      border-radius: 6px;
      padding: 7px;
      font-weight: 600;
      font-size: 12px;
      cursor: pointer;
      margin-top: 8px;
    }
    .btn-add:hover { background: #dc2626; }
    .action-row {
      display: flex;
      gap: 6px;
      margin-top: 8px;
    }
    .btn-secondary {
      flex: 1;
      background: #1f2937;
      color: #e5e7eb;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 6px;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      text-align: center;
    }
    .btn-secondary:hover { background: #374151; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🛡️ Audio Copyright Sentinel</div>
    <div class="status-toggle">
      <label>
        <input type="checkbox" id="toggle-enabled" checked> Active
      </label>
    </div>
  </div>

  <div class="watchlist-box">
    <div class="box-header">
      <span class="watchlist-title">Protected Repository</span>
      <span class="count-badge" id="count-badge">0 items</span>
    </div>

    <input type="text" id="search-filter" class="search-input" placeholder="🔍 Quick search songs & artists...">

    <div class="watchlist-list" id="watchlist-container">
      <!-- Populated via popup.js -->
    </div>

    <div class="input-row">
      <input type="text" id="new-item-name" placeholder="Add song or artist...">
      <select id="new-item-type">
        <option value="song">Song</option>
        <option value="artist">Artist</option>
        <option value="label">Label</option>
      </select>
    </div>
    <button class="btn-add" id="btn-add-item">+ Add to Watchlist</button>

    <div class="action-row">
      <label class="btn-secondary" style="cursor: pointer;">
        📥 Import CSV/JSON
        <input type="file" id="file-import" accept=".csv, .json, .txt" style="display: none;">
      </label>
      <button class="btn-secondary" id="btn-export">📤 Backup JSON</button>
      <button class="btn-secondary" id="btn-clear" style="color: #f87171;">Clear All</button>
    </div>
  </div>

  <script src="popup.js"></script>
</body>
</html>
`;

  const popupJs = `/**
 * Popup Script for Audio Copyright Sentinel
 */

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('watchlist-container');
  const countBadge = document.getElementById('count-badge');
  const searchFilter = document.getElementById('search-filter');
  const toggleEnabled = document.getElementById('toggle-enabled');
  const inputName = document.getElementById('new-item-name');
  const selectType = document.getElementById('new-item-type');
  const btnAdd = document.getElementById('btn-add-item');
  const fileImport = document.getElementById('file-import');
  const btnExport = document.getElementById('btn-export');
  const btnClear = document.getElementById('btn-clear');

  const storage = chrome.storage.local || chrome.storage.sync;
  let fullList = [];

  function renderList(query = '') {
    container.innerHTML = '';
    const q = query.toLowerCase().trim();
    const filtered = q
      ? fullList.filter(item => (item.name || '').toLowerCase().includes(q))
      : fullList;

    countBadge.textContent = fullList.length + ' item' + (fullList.length === 1 ? '' : 's');

    if (filtered.length === 0) {
      container.innerHTML = '<div style="color: #64748b; padding: 10px 0; text-align: center;">No items found.</div>';
      return;
    }

    filtered.forEach((item, index) => {
      const actualIndex = fullList.findIndex(x => x.id === item.id || x.name === item.name);
      const row = document.createElement('div');
      row.className = 'item-row';
      row.innerHTML = \`
        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 280px;">
          <span class="item-name">\${item.name}</span>
          <span class="item-type">(\${item.type || 'rule'})</span>
        </div>
        <button data-id="\${item.id}" style="background:transparent;border:none;color:#ef4444;cursor:pointer;font-size:13px;padding:2px 6px;">✕</button>
      \`;
      row.querySelector('button').addEventListener('click', () => {
        fullList.splice(actualIndex, 1);
        storage.set({ sentinel_watchlist: fullList }, () => renderList(searchFilter.value));
      });
      container.appendChild(row);
    });
  }

  // Load current state from storage
  storage.get(['sentinel_watchlist', 'sentinel_enabled'], (data) => {
    fullList = Array.isArray(data.sentinel_watchlist) ? data.sentinel_watchlist : [];
    renderList();

    toggleEnabled.checked = typeof data.sentinel_enabled !== 'undefined' ? data.sentinel_enabled : true;
    toggleEnabled.addEventListener('change', () => {
      storage.set({ sentinel_enabled: toggleEnabled.checked });
    });
  });

  searchFilter.addEventListener('input', (e) => {
    renderList(e.target.value);
  });

  btnAdd.addEventListener('click', () => {
    const name = inputName.value.trim();
    if (!name) return;
    fullList.unshift({
      id: 'rule_' + Date.now(),
      name,
      type: selectType.value,
      enabled: true,
      riskLevel: 'high',
      addedAt: new Date().toISOString()
    });
    storage.set({ sentinel_watchlist: fullList }, () => {
      inputName.value = '';
      renderList(searchFilter.value);
    });
  });

  // Direct CSV / JSON file import right inside the extension popup
  fileImport.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text !== 'string') return;

      try {
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            fullList = parsed;
          }
        } else {
          // Parse CSV lines
          const lines = text.split(/\\r?\\n/).filter(line => line.trim());
          const newEntries = [];
          lines.forEach((line, idx) => {
            if (idx === 0 && (line.toLowerCase().includes('song') || line.toLowerCase().includes('title') || line.toLowerCase().includes('artist'))) {
              return; // skip header line
            }
            const parts = line.split(',').map(p => p.trim().replace(/^"|"$/g, ''));
            const track = parts[0];
            const artist = parts[1];
            if (track) {
              newEntries.push({
                id: 'csv_' + Date.now() + '_' + idx,
                name: track,
                type: 'song',
                enabled: true,
                riskLevel: 'high',
                addedAt: new Date().toISOString()
              });
            }
            if (artist && artist !== track) {
              newEntries.push({
                id: 'csv_art_' + Date.now() + '_' + idx,
                name: artist,
                type: 'artist',
                enabled: true,
                riskLevel: 'high',
                addedAt: new Date().toISOString()
              });
            }
          });
          fullList = [...newEntries, ...fullList];
        }

        storage.set({ sentinel_watchlist: fullList }, () => {
          renderList();
          alert('Loaded ' + fullList.length + ' songs and artists into extension!');
        });
      } catch (err) {
        alert('Could not parse file. Please use a valid CSV or JSON file.');
      }
    };
    reader.readAsText(file);
  });

  // Export JSON backup
  btnExport.addEventListener('click', () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullList, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'sentinel_watchlist_backup.json';
    a.click();
  });

  // Clear all button
  btnClear.addEventListener('click', () => {
    if (confirm('Clear all ' + fullList.length + ' monitored items?')) {
      fullList = [];
      storage.set({ sentinel_watchlist: [] }, () => renderList());
    }
  });
});
`;

  const stylesCss = `/* Audio Copyright Sentinel Isolated Styles */
#audio-copyright-sentinel-hud {
  font-family: system-ui, -apple-system, sans-serif !important;
}
`;

  const readmeMd = `# Audio Copyright Sentinel - Chrome Extension

Auto-detects playing audio across all browser tabs (YouTube, Spotify Web, SoundCloud, Twitch, video players, etc.) and immediately renders a red warning HUD when the song or artist matches your copyright watchlist.

## 🚀 30-Second Quick Installation

1. **Extract this ZIP file** to a permanent folder on your computer.
2. Open Google Chrome (or Edge / Brave) and navigate to:
   \`chrome://extensions\` (or \`brave://extensions\` or \`edge://extensions\`)
3. **Turn ON "Developer Mode"** using the toggle in the top-right corner.
4. Click the **"Load unpacked"** button in the top-left toolbar.
5. Select the extracted folder containing \`manifest.json\`.
6. **Done!** Whenever audio from your watchlist plays on any website, the red copyright caution banner will appear with instant mute and dismiss options.

## Features
- **Auto-Detection**: Hooks \`HTMLMediaElement\` (\`<audio>\` and \`<video>\`), MediaSession API, and DOM metadata.
- **Red Alert HUD**: Displays "⚠️ COPYRIGHT WARNING: Copyright law may apply! Used with caution."
- **Customizable Watchlist**: Easily add or remove artists, song titles, or labels directly via the extension popup.
- **One-Click Mute**: Instant audio kill-switch directly inside the warning banner.
`;

  const githubWorkflowYml = `name: Automated Multi-Store Extension Deployment

on:
  push:
    tags:
      - 'v*' # Trigger automatic store upload whenever you push a version tag (e.g. git tag v1.2.0 && git push origin v1.2.0)

jobs:
  publish:
    name: Build & Publish to Chrome Web Store and Firefox Add-ons
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Package Extension Archive
        run: |
          mkdir -p build
          zip -r build/audio-copyright-sentinel.zip manifest.json content.js background.js popup.html popup.js styles.css rules.json README.md

      # 1. Chrome Web Store Upload & Publish
      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        continue-on-error: true
        with:
          file-path: build/audio-copyright-sentinel.zip
          extension-id: \${{ secrets.CHROME_EXTENSION_ID }}
          client-id: \${{ secrets.CHROME_CLIENT_ID }}
          client-secret: \${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: \${{ secrets.CHROME_REFRESH_TOKEN }}

      # 2. Mozilla Firefox Add-on (AMO) Signing & Publish
      - name: Upload & Sign on Firefox Add-ons (AMO)
        uses: wdzeng/firefox-addon-action@v1
        continue-on-error: true
        with:
          addon-id: \${{ secrets.FIREFOX_ADDON_ID }}
          jwt-issuer: \${{ secrets.FIREFOX_JWT_ISSUER }}
          jwt-secret: \${{ secrets.FIREFOX_JWT_SECRET }}
          xpi-path: build/audio-copyright-sentinel.zip
`;

  const maintenanceGuideMd = `# Professional Extension Maintenance & Automated Publishing Guide

This guide describes how to professionally maintain **Audio Copyright Sentinel**, automatically distribute new songs worldwide, and automate store publishing.

---

## ⚡ Architecture: The 2-Tier Strategy

Publishing a new extension version to the Chrome Web Store or Firefox Add-ons requires **Google / Mozilla human review (takes 24 hours to 7 days)**. 
To bypass store delays when adding new restricted songs, this extension uses a **2-Tier Architecture**:

### Tier 1: Over-The-Air (OTA) Instant Song Updates (Zero Store Delay)
1. Store your master song repository in your GitHub repo as \`rules.json\`.
2. Push new songs or edit your spreadsheet in Git at any time.
3. In the extension \`background.js\`, \`chrome.alarms\` checks your raw GitHub URL every 6 hours:
   \`https://raw.githubusercontent.com/<YOUR_USER>/<YOUR_REPO>/main/rules.json\`
4. **All user extensions automatically download and activate new songs worldwide within hours, with ZERO Chrome Web Store approval needed!**

---

### Tier 2: Code & Feature Updates via Automated CI/CD (GitHub Actions)
When you improve UI, add new browser hooks, or change manifest permissions:
1. Bump the version in \`manifest.json\` (e.g. \`"1.1.0"\` -> \`"1.2.0"\`).
2. Commit and tag:
   \`\`\`bash
   git add .
   git commit -m "Release v1.2.0"
   git tag v1.2.0
   git push origin main --tags
   \`\`\`
3. The included **GitHub Action (\`.github/workflows/deploy.yml\`)** triggers automatically:
   - Packages the extension ZIP.
   - Uploads to the **Chrome Web Store API**.
   - Submits to **Mozilla Firefox Add-ons (AMO)**.

---

## 🔑 GitHub Secrets Configuration

Add these secret keys to your GitHub Repository (\`Settings\` -> \`Secrets and variables\` -> \`Actions\`):

### Chrome Web Store API Keys:
- \`CHROME_EXTENSION_ID\`: Your extension's Item ID from the Chrome Web Store Developer Dashboard.
- \`CHROME_CLIENT_ID\`: Google Cloud OAuth2 Client ID.
- \`CHROME_CLIENT_SECRET\`: Google Cloud OAuth2 Client Secret.
- \`CHROME_REFRESH_TOKEN\`: Google Cloud OAuth2 Refresh Token.

### Mozilla Firefox Add-ons (AMO) API Keys:
- \`FIREFOX_ADDON_ID\`: Your extension UUID/slug on AMO.
- \`FIREFOX_JWT_ISSUER\`: API Key from \`addons.mozilla.org/developers/addon/api/key/\`.
- \`FIREFOX_JWT_SECRET\`: API Secret from \`addons.mozilla.org/developers/addon/api/key/\`.
`;

  return [
    {
      name: 'manifest.json',
      path: 'manifest.json',
      language: 'json',
      content: JSON.stringify(manifestJson, null, 2),
      description: 'Chrome Manifest V3 & Firefox-ready manifest with alarms and storage.'
    },
    {
      name: 'rules.json',
      path: 'rules.json',
      language: 'json',
      content: defaultWatchlistJson,
      description: 'Master JSON repository of all restricted songs, artists, and rules for GitHub hosting.'
    },
    {
      name: 'content.js',
      path: 'content.js',
      language: 'javascript',
      content: contentJs,
      description: 'Active content script that detects playing audio, extracts song/artist, and injects the red warning HUD.'
    },
    {
      name: 'background.js',
      path: 'background.js',
      language: 'javascript',
      content: backgroundJs,
      description: 'Manifest V3 Service Worker managing alarms, remote OTA sync, and storage.'
    },
    {
      name: 'popup.html',
      path: 'popup.html',
      language: 'html',
      content: popupHtml,
      description: 'Browser action popup interface with direct CSV/JSON importer and search.'
    },
    {
      name: 'popup.js',
      path: 'popup.js',
      language: 'javascript',
      content: popupJs,
      description: 'Client logic for adding, searching, and managing watchlist items in the extension.'
    },
    {
      name: 'styles.css',
      path: 'styles.css',
      language: 'css',
      content: stylesCss,
      description: 'Base stylesheet and animations for the injected red caution banner.'
    },
    {
      name: 'deploy.yml',
      path: '.github/workflows/deploy.yml',
      language: 'yaml',
      content: githubWorkflowYml,
      description: 'GitHub Actions automated CI/CD pipeline to push updates to Chrome Web Store and Firefox AMO.'
    },
    {
      name: 'MAINTENANCE_GUIDE.md',
      path: 'MAINTENANCE_GUIDE.md',
      language: 'markdown',
      content: maintenanceGuideMd,
      description: 'Complete architecture guide for remote song sync and automated store publishing.'
    },
    {
      name: 'README.md',
      path: 'README.md',
      language: 'markdown',
      content: readmeMd,
      description: 'Quick start and developer loading instructions.'
    }
  ];
}

/**
 * Packs all files into a real .ZIP archive and triggers browser download
 */
export async function downloadExtensionZip(watchlist: WatchlistItem[], customWarningText: string): Promise<void> {
  const files = getExtensionFiles(watchlist, customWarningText);
  const zip = new JSZip();

  files.forEach((file) => {
    zip.file(file.path, file.content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Audio_Copyright_Sentinel_Extension.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
