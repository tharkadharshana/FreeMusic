// Types for extension/matcher.js (plain JS shared with the extension).
export type Rules = { version: string; artists: string[]; songs: [string, number[]][] };
export type Match = { kind: 'song' | 'artist'; title: string | null; artists: string[] };
type Index = { readonly __index: unique symbol };

declare global {
  var Sentinel: {
    normalize(s: string): string;
    buildIndex(rules: Rules, custom?: { title: string; artist?: string }[]): Index;
    findMatch(text: string, index: Index): Match | null;
  };
}
