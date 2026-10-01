import '../../extension/matcher.js';

const { normalize } = globalThis.Sentinel;

/**
 * Turns catalogue rows (objects keyed by header, from CSV or XLSX) into the
 * compact rules.json shape: { version, artists: [name], songs: [[title, [artistIdx]]] }.
 * Duplicate titles are merged; every artist-like column counts as an alias.
 * @param {Record<string, unknown>[]} rows
 * @returns {{ rules: import('../sentinel').Rules, stats: { rows: number, songs: number, artists: number, oneWordTitles: number } }}
 */
export function catalogueToRules(rows) {
  const headers = Object.keys(rows[0] || {});
  const titleCol = ['song title', 'title', 'track', 'song']
    .map((k) => headers.find((h) => h.toLowerCase().includes(k)))
    .find(Boolean);
  if (!titleCol) throw new Error('No song title column found. Expected a header like "Song Title".');
  const artistCols = headers.filter((h) => /public name|member name|artist|performer|singer/i.test(h));

  const artists = [];
  const artistIds = new Map();
  const idOf = (name) => {
    const k = normalize(name);
    if (!artistIds.has(k)) artistIds.set(k, artists.push(name) - 1);
    return artistIds.get(k);
  };

  const songs = new Map();
  for (const row of rows) {
    const title = String(row[titleCol] ?? '').trim();
    const k = normalize(title);
    if (!k) continue;
    if (!songs.has(k)) songs.set(k, [title, new Set()]);
    for (const col of artistCols) {
      const name = String(row[col] ?? '').trim();
      if (normalize(name)) songs.get(k)[1].add(idOf(name));
    }
  }

  const list = [...songs.values()].map(([title, ids]) => [title, [...ids]]);
  return {
    rules: { version: new Date().toISOString(), artists, songs: list },
    stats: {
      rows: rows.length,
      songs: list.length,
      artists: artists.length,
      oneWordTitles: list.filter(([t]) => !normalize(t).includes(' ')).length,
    },
  };
}
