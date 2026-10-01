import { useState, type DragEvent } from 'react';
import { Download, FileSpreadsheet, Loader2, TriangleAlert } from 'lucide-react';
import { catalogueToRules } from '../lib/catalogue.js';
import { rules as current } from '../lib/rules';
import type { Rules } from '../sentinel';
import { Card, Code, Stat, primaryButton } from '../ui';

type Result = {
  name: string;
  rules: Rules;
  stats: { rows: number; songs: number; artists: number; oneWordTitles: number };
  added: string[];
  removed: string[];
};

const titles = (r: Rules) => new Map(r.songs.map(([t]) => [Sentinel.normalize(t), t]));

export function UpdateCatalogue() {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  async function read(file?: File) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await file.arrayBuffer(), { type: 'array', codepage: 65001 });
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]], { defval: '' });
      const { rules, stats } = catalogueToRules(rows);
      if (!stats.songs) throw new Error('No songs found in the first sheet.');
      const before = titles(current);
      const after = titles(rules);
      setResult({
        name: file.name,
        rules,
        stats,
        added: [...after].filter(([k]) => !before.has(k)).map(([, t]) => t),
        removed: [...before].filter(([k]) => !after.has(k)).map(([, t]) => t),
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([JSON.stringify(result!.rules) + '\n'], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'rules.json' });
    a.click();
    URL.revokeObjectURL(url);
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    read(e.dataTransfer.files[0]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Update the catalogue</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Upload a new catalogue export, review what changes, then publish <code className="font-mono text-sm">rules.json</code>.
          Installed extensions pick it up within 6 hours. No store review needed.
        </p>
      </div>

      <Card title="1. Upload">
        <label
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors focus-within:border-primary hover:border-primary ${
            dragging ? 'border-primary bg-primary-soft' : 'border-line'
          }`}
        >
          {busy ? <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden /> : <FileSpreadsheet className="h-8 w-8 text-primary" aria-hidden />}
          <span className="font-medium">{busy ? 'Reading file…' : 'Drop a CSV or Excel file, or click to choose'}</span>
          <span className="max-w-md text-sm text-muted">
            Needs a <b>Song Title</b> column. Artist columns (<b>Matched Public Name</b>, <b>Member Name</b>, <b>Artist</b>) are used
            as credited names.
          </span>
          <input type="file" accept=".csv,.xlsx,.xls" className="sr-only" onChange={(e) => read(e.target.files?.[0])} />
        </label>
        {error && (
          <p role="alert" className="mt-4 flex items-start gap-2 rounded-lg bg-danger-soft p-3 text-sm text-danger">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {error}
          </p>
        )}
      </Card>

      {result && (
        <>
          <Card title="2. Review">
            <p className="mb-4 text-sm text-muted">From <span className="font-medium text-fg">{result.name}</span></p>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="rows read" value={result.stats.rows} />
              <Stat label="unique songs" value={result.stats.songs} />
              <Stat label="artist names" value={result.stats.artists} />
              <Stat label="one-word titles (need artist)" value={result.stats.oneWordTitles} tone="text-warn" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Diff label="added" tone="text-ok" items={result.added} />
              <Diff label="removed" tone="text-danger" items={result.removed} />
            </div>
          </Card>

          <Card title="3. Publish">
            <ol className="space-y-4">
              <li>
                <p className="mb-2">Download the new file:</p>
                <button type="button" onClick={download} className={primaryButton}>
                  <Download className="h-4 w-4" aria-hidden /> Download rules.json
                </button>
              </li>
              <li>
                <p className="mb-2">Replace <code className="font-mono text-sm">extension/rules.json</code> in the repo and push:</p>
                <Code>{'git add extension/rules.json\ngit commit -m "chore: update ACPOSL catalogue"\ngit push origin main'}</Code>
              </li>
              <li className="text-sm text-muted">
                Extensions check GitHub every 6 hours. Users can also press <b>Check for updates</b> in the popup.
              </li>
            </ol>
          </Card>
        </>
      )}

      <Card title="Prefer the command line?">
        <Code>{'npm run rules -- docs/ACPOSL/acposl-public-song-catalogue.csv'}</Code>
      </Card>
    </div>
  );
}

function Diff({ label, tone, items }: { label: string; tone: string; items: string[] }) {
  return (
    <details className="rounded-lg border border-line p-4 [&[open]_summary]:mb-2">
      <summary className="cursor-pointer">
        <span className={`font-semibold tabular-nums ${tone}`}>{items.length.toLocaleString()}</span>{' '}
        {items.length === 1 ? 'song' : 'songs'} {label}
      </summary>
      {items.length > 0 && (
        <ul className="max-h-60 space-y-1 overflow-y-auto font-mono text-sm">
          {items.slice(0, 200).map((t) => <li key={t}>{t}</li>)}
          {items.length > 200 && <li className="text-muted">…and {items.length - 200} more</li>}
        </ul>
      )}
    </details>
  );
}
