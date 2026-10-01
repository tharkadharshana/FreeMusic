export type WatchlistType = 'artist' | 'song' | 'label';
export type RiskLevel = 'high' | 'medium' | 'low';

export interface WatchlistItem {
  id: string;
  name: string;
  type: WatchlistType;
  riskLevel: RiskLevel;
  notes?: string;
  category?: string;
  enabled: boolean;
  addedAt: string;
}

export type SynthProfile = 'pop' | 'rock' | 'ambient' | 'synthwave' | 'acoustic';

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  source: 'preset_copyrighted' | 'preset_safe' | 'synthetic' | 'custom_upload' | 'mic_input';
  category: 'Commercial Pop/Rock' | 'Royalty-Free CC0' | 'Streaming Simulator' | 'Custom';
  description: string;
  isCopyrighted: boolean;
  frequencyProfile?: SynthProfile;
}

export interface DetectionResult {
  isMatch: boolean;
  matchedItems: {
    item: WatchlistItem;
    matchedField: 'artist' | 'title';
    confidence: number;
    matchType: 'exact' | 'token' | 'fuzzy' | 'regex';
  }[];
  highestRisk: RiskLevel;
  trackTitle: string;
  trackArtist: string;
  timestamp: string;
}

export interface DetectionEventLog {
  id: string;
  timestamp: string;
  trackTitle: string;
  trackArtist: string;
  sourceDomain: string;
  matchedArtistOrSong: string;
  confidence: number;
  riskLevel: RiskLevel;
  actionTaken: 'warned' | 'muted' | 'exempted' | 'dismissed';
}

export interface SentinelSettings {
  isEnabled: boolean;
  soundAlert: boolean;
  autoPauseOnMatch: boolean;
  screenBorderFlash: boolean;
  fuzzyThreshold: number; // 0.6 to 1.0
  customWarningText: string;
  monitorTabs: boolean;
  monitorMicrophone: boolean;
}

export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
}
