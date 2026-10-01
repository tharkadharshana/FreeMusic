import { useState } from 'react';
import { AlertTriangle, CircleCheck, Search } from 'lucide-react';
import { index, rules, searchSongs } from '../lib/rules';
import { Card, inputClass } from '../ui';

const WARNING = '⚠️ COPYRIGHT WARNING: Copyright law may apply! Used with caution.';
const EXAMPLES = [
  { title: 'Aye Numba Na Kiya (Official Music Video)', channel: '' },
  { title: 'Amma', channel: 'Sangeeth Wijesuriya' },
  { title: 'Amma - weekend cooking vlog', channel: '' },
];

export function Check() {
  const [title, setTitle] = useState('');
  const [channel, setChannel] = useState('');
  const text = [title, channel].filter(Boolean).join(' | ');
  const match = text.trim() ? Sentinel.findMatch(text, index) : null;
  const hits = searchSongs(title);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Check a song before you use it</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Runs the same matcher as the browser extension against {rules.songs.length.toLocaleString()} songs and{' '}
          {rules.artists.length.toLocaleString()} artist names from the ACPOSL public catalogue.
        </p>
      </div>

      <Card>
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <div>
            <label htmlFor="title" className="mb-1.5 block text-sm font-medium">Video or song title</label>
            <input id="title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Paste a YouTube title" autoComplete="off" />
          </div>
          <div>
            <label htmlFor="channel" className="mb-1.5 block text-sm font-medium">
              Channel or artist <span className="font-normal text-muted">(optional)</span>
            </label>
            <input id="channel" className={inputClass} value={channel} onChange={(e) => setChannel(e.target.value)}
              placeholder="e.g. channel name" autoComplete="off" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex.title + ex.channel} type="button"
              onClick={() => { setTitle(ex.title); setChannel(ex.channel); }}
              className="min-h-9 cursor-pointer rounded-full border border-line px-3 transition-colors hover:bg-primary-soft">
              {ex.title}{ex.channel && ` · ${ex.channel}`}
            </button>
          ))}
        </div>
      </Card>

      <div aria-live="polite">
        {!text.trim() ? null : match ? (
          <div role="status" className="rounded-xl border border-line border-l-4 border-l-danger bg-card p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-danger-soft text-danger">
                <AlertTriangle className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-wide text-danger uppercase">Copyright caution</p>
                <p className="mt-0.5 text-lg font-bold wrap-break-word">{match.title ?? match.artists[0]}</p>
                <p className="text-sm text-muted">
                  {match.kind === 'song' ? `Credited: ${match.artists.join(', ')}` : 'ACPOSL member artist'}
                </p>
                <p className="mt-3 font-semibold">{WARNING}</p>
                <p className="mt-1 text-sm text-muted">
                  The extension would show this warning. A catalogue match is not proof of ownership — verify with ACPOSL.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div role="status" className="flex items-start gap-4 rounded-xl border border-line border-l-4 border-l-ok bg-card p-5 sm:p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
              <CircleCheck className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">No catalogue match — the extension stays quiet</p>
              <p className="mt-1 text-sm text-muted">
                One- and two-word titles need a credited artist on the page to match, which avoids false alarms on common
                words. The catalogue is incomplete, so no match does not mean the song is free to use.
              </p>
            </div>
          </div>
        )}
      </div>

      {title.trim() && (
        <Card title="Catalogue entries">
          {hits.length ? (
            <>
              <p className="mb-3 text-sm text-muted">
                {hits.length === 100 ? 'First 100' : hits.length} {hits.length === 1 ? 'song' : 'songs'} with these words
                in the title
              </p>
              <ul className="divide-y divide-line">
                {hits.map((s) => (
                  <li key={s.key} className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-baseline sm:gap-4">
                    <span className="font-mono text-sm font-medium sm:w-2/5">{s.title}</span>
                    <span className="text-sm text-muted">{s.artists.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Search className="h-4 w-4" aria-hidden />
              No titles contain these words. Try fewer words or another spelling (e.g. “Na” vs “Ne”).
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
