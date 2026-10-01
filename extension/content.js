// Watches whatever is playing on the page and shows a caution card when it
// matches the catalogue. One 2s poll covers YouTube SPA navigation, autoplay,
// MediaSession players (Spotify, SoundCloud) and plain <audio>/<video>.
(() => {
  if (globalThis.__sentinelRunning) return; // never run twice in one page
  globalThis.__sentinelRunning = true;
  const { buildIndex, findMatch } = globalThis.Sentinel;
  const WARNING = '⚠️ COPYRIGHT WARNING: Copyright law may apply! Used with caution.';

  let index = null;
  let enabled = true;
  let lastText = '';
  let hud = null;

  async function load() {
    const { rules, custom = [], enabled: on = true } = await chrome.storage.local.get(['rules', 'custom', 'enabled']);
    enabled = on;
    index = rules ? buildIndex(rules, custom) : null;
    lastText = '';
    if (!enabled) hide();
  }
  load();
  chrome.storage.onChanged.addListener((c, area) => area === 'local' && (c.rules || c.custom || c.enabled) && load());

  const send = (msg) => {
    try { chrome.runtime.sendMessage(msg).catch(() => {}); } catch { /* extension reloaded */ }
  };

  // Song labels the platforms print from their own audio recognition, so a
  // re-upload with a misleading title is still caught. YouTube's description
  // (with its "Music" card) is page-wide; sound links (Shorts, TikTok, Reels)
  // repeat once per feed item, so only the ones on screen count.
  // ponytail: on-screen filter can pick up a half-visible neighbour post; scope
  // to the playing <video>'s container if that causes false cautions.
  const host = location.hostname;
  const YT = host.endsWith('youtube.com');
  const DESCRIPTION = 'ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-structured-description"], #description-inline-expander';
  const SOUND_LINKS = YT ? 'a[href^="/source/"]'
    : host.endsWith('tiktok.com') ? 'a[href*="/music/"]'
    : /(^|\.)(instagram|facebook)\.com$/.test(host) ? 'a[href*="/audio/"]'
    : null;

  const onScreen = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < innerHeight;
  };
  // Text nodes joined with spaces: textContent glues "Song" + "Artist" into one word.
  function labelText(el) {
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const parts = [];
    while (walk.nextNode()) parts.push(walk.currentNode.nodeValue);
    try { parts.push(decodeURIComponent(el.pathname || '').replace(/[-_/]/g, ' ')); } catch { /* bad % escape */ } // TikTok puts the song in the URL
    return parts.join(' ');
  }

  function pageText() {
    const meta = navigator.mediaSession?.metadata;
    const channel = document.querySelector('ytd-watch-metadata #channel-name a, ytd-video-owner-renderer #channel-name a');
    const labels = [
      // The watch page stays in the DOM, hidden, after leaving it, so only read it on /watch.
      ...(YT && location.pathname === '/watch' ? document.querySelectorAll(DESCRIPTION) : []),
      ...(SOUND_LINKS ? [...document.querySelectorAll(SOUND_LINKS)].filter(onScreen) : []),
    ].map(labelText);
    return [meta?.title, meta?.artist, document.title, channel?.textContent, ...labels].filter(Boolean).join(' | ');
  }

  setInterval(() => {
    if (!enabled || !index) return;
    const media = [...document.querySelectorAll('audio, video')].filter((m) => !m.paused && !m.ended);
    if (!media.length && navigator.mediaSession?.playbackState !== 'playing') return;
    const text = pageText();
    if (text === lastText) return;
    lastText = text;
    const match = findMatch(text, index);
    match ? show(match, media) : hide();
  }, 2000);

  function hide() {
    if (!hud) return;
    hud.remove();
    hud = null;
    send({ type: 'match', on: false });
  }

  function show(match, media) {
    hide();
    hud = document.createElement('div');
    const root = hud.attachShadow({ mode: 'closed' });
    const doc = new DOMParser().parseFromString(TEMPLATE, 'text/html'); // static markup; dynamic text via textContent below
    root.append(...doc.head.childNodes, ...doc.body.childNodes);
    root.querySelector('.name').textContent = match.title || match.artists[0];
    root.querySelector('.credit').textContent = match.kind === 'song'
      ? (match.artists.length ? 'Credited: ' + match.artists.join(', ') : 'Added by you')
      : 'ACPOSL member artist';
    root.querySelector('.msg').textContent = WARNING;

    const mute = root.querySelector('.mute');
    const label = () => (mute.textContent = media.length && media.every((m) => m.muted) ? 'Unmute' : 'Mute');
    label();
    mute.hidden = !media.length;
    mute.onclick = () => {
      const muted = !media.every((m) => m.muted);
      media.forEach((m) => (m.muted = muted));
      label();
    };
    root.querySelector('.dismiss').onclick = hide;

    (document.fullscreenElement || document.documentElement).append(hud);
    send({ type: 'match', on: true });
  }

  document.addEventListener('fullscreenchange', () => hud && (document.fullscreenElement || document.documentElement).append(hud));

  const TEMPLATE = `
<style>
  :host { all: initial; position: fixed; right: 16px; bottom: 16px; z-index: 2147483647;
    --bg: #ffffff; --fg: #0f172a; --muted: #475569; --line: #e2e8f0; --danger: #dc2626; --danger-soft: #fef2f2;
    --btn: #f1f5f9; --btn-hover: #e2e8f0; --ring: #1e3a8a; }
  @media (prefers-color-scheme: dark) {
    :host { --bg: #0f172a; --fg: #f8fafc; --muted: #cbd5e1; --line: #334155; --danger: #f87171; --danger-soft: #450a0a;
      --btn: #1e293b; --btn-hover: #334155; --ring: #93c5fd; }
  }
  .box { box-sizing: border-box; width: min(380px, calc(100vw - 32px)); padding: 16px; border-radius: 12px;
    background: var(--bg); color: var(--fg); border: 1px solid var(--line); border-left: 4px solid var(--danger);
    box-shadow: 0 12px 32px rgba(15, 23, 42, .28); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    animation: in .2s ease-out; }
  @keyframes in { from { opacity: 0; transform: translateY(8px); } }
  @media (prefers-reduced-motion: reduce) { .box { animation: none; } }
  .top { display: flex; gap: 12px; align-items: flex-start; }
  .icon { flex: none; display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%;
    background: var(--danger-soft); color: var(--danger); }
  .eyebrow { margin: 0; font-size: 12px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: var(--danger); }
  .name { margin: 2px 0 0; font-size: 16px; font-weight: 700; overflow-wrap: anywhere; }
  .credit { margin: 2px 0 0; color: var(--muted); font-size: 13px; }
  .msg { margin: 12px 0 0; font-weight: 600; }
  .note { margin: 6px 0 0; color: var(--muted); font-size: 12px; }
  .actions { display: flex; gap: 8px; margin-top: 14px; }
  button { flex: 1; min-height: 40px; border-radius: 8px; border: 1px solid var(--line); font: inherit;
    font-size: 13px; font-weight: 600; cursor: pointer; background: var(--btn); color: var(--fg); transition: background .15s; }
  button:hover { background: var(--btn-hover); }
  button:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
  .mute { background: #dc2626; border-color: #dc2626; color: #fff; }
  .mute:hover { background: #b91c1c; }
  [hidden] { display: none; }
</style>
<div class="box" role="alert">
  <div class="top">
    <span class="icon" aria-hidden="true">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>
      </svg>
    </span>
    <div>
      <p class="eyebrow">Copyright caution</p>
      <p class="name"></p>
      <p class="credit"></p>
    </div>
  </div>
  <p class="msg"></p>
  <p class="note">Matched the ACPOSL public catalogue. This is not proof of ownership — verify with ACPOSL.</p>
  <div class="actions">
    <button class="mute" type="button"></button>
    <button class="dismiss" type="button">Dismiss</button>
  </div>
</div>`;
})();
