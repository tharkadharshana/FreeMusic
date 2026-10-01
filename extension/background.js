// Service worker (Chrome) / background script (Firefox).
// Ships with a bundled rules.json, then pulls updates from GitHub every 6 hours
// so new songs reach users without a store release.
const RULES_URL = 'https://raw.githubusercontent.com/tharkadharshana/FreeMusic/main/extension/rules.json';

const isRules = (r) =>
  r && typeof r.version === 'string' && Array.isArray(r.artists) && Array.isArray(r.songs) &&
  r.songs.every((s) => Array.isArray(s) && typeof s[0] === 'string' && Array.isArray(s[1]));

async function load(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const rules = await res.json();
  if (!isRules(rules)) throw new Error('rules.json has an unexpected shape');
  return rules;
}

async function sync() {
  const { rules } = await chrome.storage.local.get('rules');
  try {
    const remote = await load(RULES_URL, { cache: 'no-cache' });
    const updated = remote.version !== rules?.version;
    await chrome.storage.local.set({ lastSync: Date.now(), syncError: null, ...(updated && { rules: remote }) });
    return { ok: true, updated };
  } catch (err) {
    await chrome.storage.local.set({ syncError: String(err.message || err) });
    return { ok: false, error: String(err.message || err) };
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const { rules, enabled } = await chrome.storage.local.get(['rules', 'enabled']);
  const bundled = await load(chrome.runtime.getURL('rules.json'));
  if (!rules || bundled.version > rules.version) await chrome.storage.local.set({ rules: bundled });
  if (enabled === undefined) await chrome.storage.local.set({ enabled: true });
  sync();
});

// Alarms can be cleared on browser restart (always in Firefox): re-create on every worker start.
chrome.alarms.get('sync').then((a) => a || chrome.alarms.create('sync', { periodInMinutes: 360 }));
chrome.alarms.onAlarm.addListener((alarm) => alarm.name === 'sync' && sync());
chrome.runtime.onStartup.addListener(sync);

chrome.runtime.onMessage.addListener((msg, sender, reply) => {
  if (msg.type === 'match' && sender.tab) {
    chrome.action.setBadgeText({ text: msg.on ? '!' : '', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#DC2626', tabId: sender.tab.id });
  } else if (msg.type === 'sync') {
    sync().then(reply);
    return true;
  }
});
