import { DetectionResult, RiskLevel, WatchlistItem } from '../types';

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = [];
  for (let i = 0; i <= bn; ++i) matrix[i] = [i];
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let i = 1; i <= bn; ++i) {
    for (let j = 1; j <= an; ++j) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Normalizes text: strips punctuation, extra whitespace, tags like [Official Music Video], (Audio), feat., ft.
 */
export function normalizeMediaText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\b(feat|ft|featuring|remix|official|video|audio|lyrics|hd|4k)\b/gi, '')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks similarity between target (from media metadata) and watchlist query
 */
export function calculateSimilarity(candidate: string, query: string): number {
  const normCand = normalizeMediaText(candidate);
  const normQuery = normalizeMediaText(query);

  if (!normCand || !normQuery) return 0;
  if (normCand === normQuery) return 1.0;
  if (normCand.includes(normQuery) || normQuery.includes(normCand)) return 0.95;

  // Token word match
  const candTokens = new Set(normCand.split(' ').filter(Boolean));
  const queryTokens = normQuery.split(' ').filter(Boolean);
  let matchedTokens = 0;
  for (const q of queryTokens) {
    if (candTokens.has(q)) {
      matchedTokens++;
    }
  }
  if (queryTokens.length > 0 && matchedTokens === queryTokens.length) {
    return 0.9;
  }

  // Fuzzy edit distance on shorter segment or full string
  const maxLen = Math.max(normCand.length, normQuery.length);
  if (maxLen === 0) return 0;
  const distance = levenshteinDistance(normCand, normQuery);
  const ratio = 1 - distance / maxLen;
  return Math.max(0, ratio);
}

/**
 * Matches an active track (title + artist) against the watchlist
 */
export function checkAudioAgainstWatchlist(
  title: string,
  artist: string,
  watchlist: WatchlistItem[],
  fuzzyThreshold = 0.75
): DetectionResult {
  const timestamp = new Date().toLocaleTimeString();
  const matchedItems: DetectionResult['matchedItems'] = [];

  const enabledItems = watchlist.filter((item) => item.enabled);

  for (const item of enabledItems) {
    // Check artist field if item is artist or label
    if (item.type === 'artist' || item.type === 'label') {
      const artistSim = calculateSimilarity(artist, item.name);
      const titleSim = calculateSimilarity(title, item.name); // sometimes artist is in the title string
      const bestSim = Math.max(artistSim, titleSim);

      if (bestSim >= fuzzyThreshold) {
        matchedItems.push({
          item,
          matchedField: artistSim >= titleSim ? 'artist' : 'title',
          confidence: Math.round(bestSim * 100),
          matchType: bestSim >= 0.98 ? 'exact' : bestSim >= 0.9 ? 'token' : 'fuzzy',
        });
      }
    } else if (item.type === 'song') {
      // Check song title field
      const titleSim = calculateSimilarity(title, item.name);
      if (titleSim >= fuzzyThreshold) {
        matchedItems.push({
          item,
          matchedField: 'title',
          confidence: Math.round(titleSim * 100),
          matchType: titleSim >= 0.98 ? 'exact' : titleSim >= 0.9 ? 'token' : 'fuzzy',
        });
      }
    }
  }

  // Determine highest risk
  let highestRisk: RiskLevel = 'low';
  if (matchedItems.some((m) => m.item.riskLevel === 'high')) {
    highestRisk = 'high';
  } else if (matchedItems.some((m) => m.item.riskLevel === 'medium')) {
    highestRisk = 'medium';
  }

  return {
    isMatch: matchedItems.length > 0,
    matchedItems,
    highestRisk,
    trackTitle: title,
    trackArtist: artist,
    timestamp,
  };
}
