# Audio Copyright Sentinel — Technical Architecture & Maintenance Guide

## 1. System Overview

**Audio Copyright Sentinel** is a cross-browser extension (compatible with Google Chrome, Microsoft Edge, Brave, and Mozilla Firefox) designed to auto-detect playing audio and video streams across web pages (such as YouTube, Spotify Web, SoundCloud, Twitch, Vimeo, and custom web players). 

When playing media matches a monitored artist, song title, or record label from a restricted watchlist, the extension injects a high-visibility Red Caution HUD banner:
> **"⚠️ COPYRIGHT WARNING: Copyright law may apply! Used with caution."**

---

## 2. The 2-Tier Production Maintenance Architecture

Extension stores (Google Chrome Web Store and Mozilla Add-ons AMO) enforce a strict human-review window (usually 24 hours to 7 business days) for every code release or manifest version bump. 

Because copyright laws, licensing disputes, and catalogue restrictions change rapidly, hardcoding songs inside the extension would cause unacceptable delays. The system implements a **2-Tier Architecture**:

\`\`\`
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: Over-The-Air (OTA) Instant Song Updates                        │
│                                                                        │
│  [ Creator edits Excel / pushes rules.json to GitHub ]                 │
│                     │                                                  │
│                     ▼                                                  │
│  GitHub Repository (https://raw.githubusercontent.com/.../rules.json)  │
│                     │                                                  │
│                     ▼ (Polled every 6 hours via chrome.alarms)         │
│  Installed Extensions on Users' Browsers (Auto-Synced & Cached)        │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: Automated Store Releases via GitHub Actions (CI/CD)            │
│                                                                        │
│  [ Creator bumps version and pushes Git tag: git tag v1.1.0 ]          │
│                     │                                                  │
│                     ▼                                                  │
│  GitHub Actions Workflow (.github/workflows/deploy.yml)                │
│       ├── Validates & packages extension zip                           │
│       ├── Chrome Web Store API automated upload & publish              │
│       └── Mozilla Firefox Add-ons (AMO) automated signing & publish    │
└────────────────────────────────────────────────────────────────────────┘
\`\`\`

---

## 3. Chrome Web Store & Store Policy Compliance

1. **Manifest V3 Only**: Uses declarative Service Worker background scripts (\`background.js\`).
2. **Zero Remote Code Execution**: Chrome Web Store policy strictly bans downloading remote JavaScript code (e.g. \`eval()\`, remote \`.js\` files). The extension **never executes remote code**. It only downloads pure JSON data (\`rules.json\`) containing song titles and artist names. This pattern is 100% compliant and is the exact pattern used by uBlock Origin, AdBlock Plus, and privacy rule managers.
3. **Local Storage Ceiling Solution**:
   - Chrome's \`chrome.storage.sync\` has a hard ceiling of 8,192 bytes (\`kQuotaBytesPerItem\`).
   - The extension uses \`chrome.storage.local\` alongside the \`"unlimitedStorage"\` permission, supporting catalogs of over 100,000+ restricted songs without quota warnings.

---

## 4. Component Lifecycle & Detection Engine

### A. Media Interception Hook (\`content.js\`)
- Hooks \`HTMLMediaElement.prototype.play\` and \`playing\` events.
- Attaches to all existing \`<audio>\` and \`<video>\` DOM elements.
- Registers a \`MutationObserver\` on \`document.documentElement\` to detect dynamically injected media elements in Single Page Applications (SPAs).
- Registers listeners for YouTube SPA routing: \`yt-navigate-finish\`, \`yt-page-data-updated\`, and title DOM mutations.
- Periodic 1.2-second background heartbeat while media is active to capture late-loading metadata.

### B. Metadata Extraction Engine
Extracts titles and artists through prioritized fallbacks:
1. \`navigator.mediaSession.metadata\` (\`title\`, \`artist\`, \`album\`).
2. YouTube-specific DOM nodes:
   - \`h1.style-scope.ytd-watch-metadata yt-formatted-string\`
   - \`#title h1 yt-formatted-string\`
   - \`#upload-info ytd-channel-name a\`
   - \`meta[name="title"]\`, \`meta[property="og:title"]\`
3. Fallback to clean \`document.title\`.

### C. Matching Engine
- Unicode-aware letter normalizer (\`[\\p{L}\\p{N}\\s]\`) preserving non-Latin scripts (Sinhala, Arabic, Japanese, Spanish, etc.).
- Multi-tier matching:
  - Exact Substring containment.
  - Reverse containment.
  - Multi-token set intersection (70%+ word match).

### D. Shadow DOM Alert HUD
- Injected into \`document.fullscreenElement || document.body\`.
- Encapsulated inside a Shadow Root (\`attachShadow({ mode: 'open' })\`) with \`z-index: 2147483647 !important\` to isolate styles and prevent page CSS conflicts.
- Includes instant one-click audio mute/unmute control and dismiss option.
