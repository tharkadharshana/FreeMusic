import { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Check } from './views/Check';
import { UpdateCatalogue } from './views/UpdateCatalogue';
import { Install } from './views/Install';

const VIEWS = [
  { id: 'check', label: 'Check song', View: Check },
  { id: 'catalogue', label: 'Catalogue', View: UpdateCatalogue },
  { id: 'install', label: 'Install & release', View: Install },
] as const;

const fromHash = () => VIEWS.find((v) => '#' + v.id === location.hash) ?? VIEWS[0];

export default function App() {
  const [view, setView] = useState(fromHash);
  useEffect(() => {
    const onHash = () => setView(fromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 border-b border-line bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 pt-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:pt-0">
          <a href="#check" className="flex items-center gap-2.5 sm:py-4">
            <ShieldCheck className="h-6 w-6 text-primary" aria-hidden />
            <span className="font-semibold">Audio Copyright Sentinel</span>
          </a>
          <nav aria-label="Sections" className="-mx-4 flex overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {VIEWS.map((v) => (
              <a
                key={v.id}
                href={'#' + v.id}
                aria-current={v.id === view.id ? 'page' : undefined}
                className={`flex min-h-12 shrink-0 items-center border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors sm:min-h-16 ${
                  v.id === view.id ? 'border-primary text-fg' : 'border-transparent text-muted hover:text-fg'
                }`}
              >
                {v.label}
              </a>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <view.View />
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        <p className="px-4">
          Built on the ACPOSL public catalogue. It is a discovery list, not a legal ownership register. Always verify
          with ACPOSL.
        </p>
      </footer>
    </div>
  );
}
