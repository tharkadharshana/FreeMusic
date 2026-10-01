const { normalize } = globalThis.Sentinel;
const $ = (id) => document.getElementById(id);
const store = chrome.storage.local;

let catalogue = [];
let custom = [];

function item(title, sub, onRemove) {
  const li = document.createElement('li');
  const text = li.appendChild(document.createElement('div'));
  text.appendChild(document.createElement('strong')).textContent = title;
  if (sub) text.appendChild(document.createElement('small')).textContent = sub;
  if (onRemove) {
    const btn = li.appendChild(document.createElement('button'));
    btn.type = 'button';
    btn.textContent = 'Remove';
    btn.setAttribute('aria-label', 'Remove ' + title);
    btn.onclick = onRemove;
  }
  return li;
}

function empty(list, text) {
  const li = document.createElement('li');
  li.className = 'empty';
  li.textContent = text;
  list.replaceChildren(li);
}

function renderSearch() {
  const q = normalize($('q').value);
  const list = $('results');
  if (!q) return list.replaceChildren();
  const hits = catalogue.filter((s) => s.key.includes(q)).slice(0, 50);
  if (!hits.length) return empty(list, 'Not in the catalogue. Try fewer words or a different spelling.');
  list.replaceChildren(...hits.map((s) => item(s.title, s.artists.join(', '))));
}

function renderCustom() {
  if (!custom.length) return empty($('custom'), 'Songs you add here are always flagged, even with one-word titles.');
  $('custom').replaceChildren(...custom.map((c, i) => item(c.title, c.artist, () => {
    custom.splice(i, 1);
    store.set({ custom });
  })));
}

function renderSync({ rules, lastSync, syncError }) {
  const updated = rules ? new Date(rules.version).toLocaleDateString() : '–';
  const checked = lastSync ? new Date(lastSync).toLocaleString() : 'never';
  $('sync-meta').className = 'meta' + (syncError ? ' error' : '');
  $('sync-meta').textContent = syncError
    ? 'Update check failed: ' + syncError
    : `Updated ${updated} · checked ${checked}`;
}

async function refresh() {
  const data = await store.get(['rules', 'custom', 'enabled', 'lastSync', 'syncError']);
  const rules = data.rules || { artists: [], songs: [] };
  custom = data.custom || [];
  $('enabled').checked = data.enabled !== false;
  $('songs').textContent = rules.songs.length.toLocaleString();
  $('artists').textContent = rules.artists.length.toLocaleString();
  catalogue = rules.songs.map(([title, ids]) => {
    const artists = ids.map((i) => rules.artists[i]);
    return { title, artists, key: normalize(title + ' ' + artists.join(' ')) };
  });
  renderSync(data);
  renderSearch();
  renderCustom();
}

const ALL_SITES = { origins: ['<all_urls>'] };
async function renderSites() {
  const all = await chrome.permissions.contains(ALL_SITES);
  $('sites-meta').textContent = all
    ? 'Warnings run on every site. Reload tabs that were already open.'
    : 'Warnings run on YouTube, YouTube Music, Spotify, SoundCloud, Facebook, Instagram and TikTok.';
  $('all-sites').textContent = all ? 'Only major music sites' : 'Enable on all sites';
}
$('all-sites').onclick = async () => {
  // Must run inside the click handler: browsers only show the permission prompt on a user gesture.
  if (await chrome.permissions.contains(ALL_SITES)) await chrome.permissions.remove(ALL_SITES);
  else await chrome.permissions.request(ALL_SITES);
  renderSites();
};
renderSites();

$('enabled').onchange = (e) => store.set({ enabled: e.target.checked });
$('q').oninput = renderSearch;
$('sync').onclick = async () => {
  const btn = $('sync');
  btn.disabled = true;
  btn.textContent = 'Checking…';
  const res = await chrome.runtime.sendMessage({ type: 'sync' });
  btn.disabled = false;
  btn.textContent = res?.ok ? (res.updated ? 'Updated' : 'Up to date') : 'Check for updates';
};
$('add').onsubmit = (e) => {
  e.preventDefault();
  const title = $('title').value.trim();
  if (!title) return;
  custom.unshift({ title, artist: $('artist').value.trim() || undefined });
  store.set({ custom });
  e.target.reset();
  $('title').focus();
};

chrome.storage.onChanged.addListener(refresh);
refresh();
