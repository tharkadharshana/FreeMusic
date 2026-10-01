/**
 * Shared matcher. Loaded as a content script before content.js, imported by
 * the web app and by scripts/test-matcher.mjs. Exposes globalThis.Sentinel.
 *
 * Rule: a catalogue title on the page matches when
 *   - one of its credited artists is also on the page, or
 *   - the title has 3+ words (rare enough to stand alone), or
 *   - the user added it themselves.
 * Otherwise a 2+ word ACPOSL artist name on the page matches alone.
 *
 * ponytail: exact word-sequence matching only, no transliteration fuzzing
 * ("Na Kiya" vs "Ne Kiya"). Add alias rows to the catalogue if misses show up.
 */
(() => {
  const normalize = (s) =>
    String(s || '')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}]+/gu, ' ')
      .trim();

  // Padding with spaces turns includes() into a whole-word match.
  const key = (s) => ' ' + normalize(s) + ' ';
  const entry = (name) => ({ name, key: key(name), words: normalize(name).split(' ').length });

  function buildIndex(rules, custom = []) {
    const artists = rules.artists.map(entry);
    const songs = rules.songs.map(([title, ids]) => ({ ...entry(title), artists: ids.map((i) => artists[i]) }));
    for (const c of custom) {
      const artist = c.artist ? entry(c.artist) : null;
      if (artist) artists.push(artist);
      songs.push({ ...entry(c.title), artists: artist ? [artist] : [], custom: true });
    }
    return { songs, artists: artists.filter((a) => a.words >= 2) };
  }

  function findMatch(text, index) {
    const page = key(text);
    if (page.length < 3) return null;
    for (const s of index.songs) {
      if (s.key.length < 3 || !page.includes(s.key)) continue;
      const credited = s.artists.filter((a) => page.includes(a.key));
      if (credited.length || s.words >= 3 || s.custom) {
        return { kind: 'song', title: s.name, artists: (credited.length ? credited : s.artists).map((a) => a.name) };
      }
    }
    const artist = index.artists.find((a) => page.includes(a.key));
    return artist ? { kind: 'artist', title: null, artists: [artist.name] } : null;
  }

  globalThis.Sentinel = { normalize, buildIndex, findMatch };
})();
