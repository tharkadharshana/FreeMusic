import '../../extension/matcher.js';
import bundled from '../../extension/rules.json';
import type { Rules } from '../sentinel';

// The same rules.json the extension ships and the OTA URL serves.
export const rules = bundled as Rules;
export const index = Sentinel.buildIndex(rules);

export type Song = { title: string; artists: string[]; key: string };
export const songs: Song[] = rules.songs.map(([title, ids]) => ({
  title,
  artists: ids.map((i) => rules.artists[i]),
  key: ' ' + Sentinel.normalize(title) + ' ',
}));

/** Catalogue entries whose title contains the query, or that appear inside it. */
export function searchSongs(query: string, limit = 100): Song[] {
  const q = Sentinel.normalize(query);
  if (!q) return [];
  const padded = ' ' + q + ' ';
  return songs.filter((s) => s.key.includes(q) || padded.includes(s.key)).slice(0, limit);
}
