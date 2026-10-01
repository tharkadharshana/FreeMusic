import * as XLSX from 'xlsx';
import { RiskLevel, WatchlistItem, WatchlistType } from '../types';

export interface ParsedExcelResult {
  sheetNames: string[];
  rawRows: Record<string, unknown>[];
  headers: string[];
  detectedMapping: {
    nameCol?: string;
    artistCol?: string;
    songCol?: string;
    typeCol?: string;
    riskCol?: string;
    categoryCol?: string;
    notesCol?: string;
  };
}

/**
 * Reads an Excel file (.xlsx, .xls, .csv) and extracts sheets and tabular records
 */
export async function parseExcelFile(file: File): Promise<ParsedExcelResult> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: '',
  });

  // Extract headers
  const headers: string[] = [];
  if (rawRows.length > 0) {
    Object.keys(rawRows[0]).forEach((key) => {
      headers.push(key);
    });
  }

  // Detect column mapping based on keywords
  const lowerHeaders = headers.map((h) => ({ original: h, lower: h.toLowerCase().trim() }));

  const findCol = (keywords: string[]) => {
    return lowerHeaders.find((h) => keywords.some((kw) => h.lower.includes(kw)))?.original;
  };

  const songCol = findCol(['song', 'track', 'title', 'recording']);
  const artistCol = findCol(['artist', 'performer', 'singer', 'band', 'creator']);
  const nameCol = findCol(['name', 'item', 'keyword', 'restricted']);
  const typeCol = findCol(['type', 'kind', 'class']);
  const riskCol = findCol(['risk', 'severity', 'priority', 'level']);
  const categoryCol = findCol(['genre', 'category', 'tag']);
  const notesCol = findCol(['note', 'comment', 'label', 'owner', 'copyright', 'holder', 'publisher']);

  return {
    sheetNames: workbook.SheetNames,
    rawRows,
    headers,
    detectedMapping: {
      nameCol: nameCol || songCol || artistCol,
      artistCol,
      songCol,
      typeCol,
      riskCol,
      categoryCol,
      notesCol,
    },
  };
}

/**
 * Converts parsed Excel rows into Watchlist items based on selected column mappings
 */
export function convertRowsToWatchlist(
  rows: Record<string, unknown>[],
  mapping: {
    artistCol?: string;
    songCol?: string;
    nameCol?: string;
    typeCol?: string;
    riskCol?: string;
    categoryCol?: string;
    notesCol?: string;
  },
  options: {
    importBothArtistAndSong?: boolean;
    defaultRisk?: RiskLevel;
  }
): WatchlistItem[] {
  const items: WatchlistItem[] = [];
  const seen = new Set<string>();

  const normalizeRisk = (val: unknown): RiskLevel => {
    const s = String(val || '').toLowerCase().trim();
    if (s.includes('high') || s.includes('strict') || s.includes('critical') || s.includes('red')) return 'high';
    if (s.includes('med') || s.includes('moderate') || s.includes('warn') || s.includes('amber')) return 'medium';
    if (s.includes('low') || s.includes('info')) return 'low';
    return options.defaultRisk || 'high';
  };

  const normalizeType = (val: unknown, fallback: WatchlistType): WatchlistType => {
    const s = String(val || '').toLowerCase().trim();
    if (s.includes('artist') || s.includes('singer') || s.includes('band')) return 'artist';
    if (s.includes('song') || s.includes('track') || s.includes('title')) return 'song';
    if (s.includes('label') || s.includes('publisher') || s.includes('corp')) return 'label';
    return fallback;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const risk = mapping.riskCol ? normalizeRisk(row[mapping.riskCol]) : options.defaultRisk || 'high';
    const category = mapping.categoryCol ? String(row[mapping.categoryCol] || '').trim() : '';
    const notes = mapping.notesCol ? String(row[mapping.notesCol] || '').trim() : '';

    // If both artist and song columns are defined
    const songVal = mapping.songCol ? String(row[mapping.songCol] || '').trim() : '';
    const artistVal = mapping.artistCol ? String(row[mapping.artistCol] || '').trim() : '';

    if (songVal && !seen.has(`song:${songVal.toLowerCase()}`)) {
      seen.add(`song:${songVal.toLowerCase()}`);
      items.push({
        id: `import_song_${Date.now()}_${i}`,
        name: songVal,
        type: 'song',
        riskLevel: risk,
        category: category || (artistVal ? `By ${artistVal}` : 'Commercial Track'),
        notes: notes || (artistVal ? `Artist: ${artistVal}` : 'Imported from Excel'),
        enabled: true,
        addedAt: new Date().toISOString(),
      });
    }

    if (artistVal && options.importBothArtistAndSong !== false && !seen.has(`artist:${artistVal.toLowerCase()}`)) {
      seen.add(`artist:${artistVal.toLowerCase()}`);
      items.push({
        id: `import_art_${Date.now()}_${i}`,
        name: artistVal,
        type: 'artist',
        riskLevel: risk,
        category: category || 'Restricted Artist',
        notes: notes || (songVal ? `Track in repo: ${songVal}` : 'Imported from Excel'),
        enabled: true,
        addedAt: new Date().toISOString(),
      });
    }

    // Fallback if generic single name column is used
    if (!songVal && !artistVal && mapping.nameCol) {
      const genericVal = String(row[mapping.nameCol] || '').trim();
      if (genericVal && !seen.has(`generic:${genericVal.toLowerCase()}`)) {
        seen.add(`generic:${genericVal.toLowerCase()}`);
        const detectedType = mapping.typeCol ? normalizeType(row[mapping.typeCol], 'artist') : 'artist';
        items.push({
          id: `import_gen_${Date.now()}_${i}`,
          name: genericVal,
          type: detectedType,
          riskLevel: risk,
          category: category || 'Excel Import',
          notes: notes || 'Imported from Excel repository',
          enabled: true,
          addedAt: new Date().toISOString(),
        });
      }
    }
  }

  return items;
}

/**
 * Generates and downloads a pre-formatted Excel template file (.xlsx)
 */
export function downloadSampleExcelTemplate(): void {
  const sampleData = [
    {
      'Song Title': 'Cruel Summer',
      'Artist / Performer': 'Taylor Swift',
      'Type': 'Song',
      'Risk Level': 'High',
      'Category': 'Commercial Pop',
      'Copyright Holder / Label': 'Republic Records / UMG',
      'Compliance Notes': 'Automated Content ID claims on YouTube/Twitch',
    },
    {
      'Song Title': "God's Plan",
      'Artist / Performer': 'Drake',
      'Type': 'Song',
      'Risk Level': 'High',
      'Category': 'Hip-Hop',
      'Copyright Holder / Label': 'OVO Sound / Republic Records',
      'Compliance Notes': 'Worldwide publishing restrictions',
    },
    {
      'Song Title': 'Enter Sandman',
      'Artist / Performer': 'Metallica',
      'Type': 'Artist',
      'Risk Level': 'High',
      'Category': 'Heavy Metal',
      'Copyright Holder / Label': 'Blackened Recordings',
      'Compliance Notes': 'Historical DMCA enforcement',
    },
    {
      'Song Title': 'Shape of You',
      'Artist / Performer': 'Ed Sheeran',
      'Type': 'Song',
      'Risk Level': 'Medium',
      'Category': 'Pop',
      'Copyright Holder / Label': 'Atlantic Records UK',
      'Compliance Notes': 'Monetization redirect risk',
    },
    {
      'Song Title': 'Bohemian Rhapsody',
      'Artist / Performer': 'Queen',
      'Type': 'Song',
      'Risk Level': 'High',
      'Category': 'Classic Rock',
      'Copyright Holder / Label': 'Universal Music Group',
      'Compliance Notes': 'Direct broadcast copyright violation',
    },
    {
      'Song Title': 'Any Restricted Track Title',
      'Artist / Performer': 'Restricted Artist Name',
      'Type': 'Artist',
      'Risk Level': 'High',
      'Category': 'Custom Repo',
      'Copyright Holder / Label': 'Major Record Label',
      'Compliance Notes': 'Add any songs or artists from your list here',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Auto-fit column widths
  const colWidths = [
    { wch: 22 }, // Song Title
    { wch: 22 }, // Artist
    { wch: 10 }, // Type
    { wch: 12 }, // Risk Level
    { wch: 18 }, // Category
    { wch: 30 }, // Label
    { wch: 42 }, // Notes
  ];
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Restricted_Music_Repo');

  XLSX.writeFile(wb, 'Restricted_Songs_Template.xlsx');
}
