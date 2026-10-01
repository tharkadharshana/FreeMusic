import { CloudDownload, ExternalLink, Rocket, Tag } from 'lucide-react';
import { Card, Code, secondaryButton } from '../ui';

const REPO = 'https://github.com/tharkadharshana/FreeMusic';

const SECRETS = [
  ['CHROME_EXTENSION_ID', 'Item ID from the Chrome Web Store Developer Dashboard (32 characters)'],
  ['CHROME_PUBLISHER_ID', 'Publisher ID, Developer Dashboard → Account'],
  ['CHROME_CLIENT_ID', 'Google Cloud Console → APIs & Services → Credentials → OAuth client ID'],
  ['CHROME_CLIENT_SECRET', 'Same OAuth client'],
  ['CHROME_REFRESH_TOKEN', 'OAuth 2.0 Playground with scope https://www.googleapis.com/auth/chromewebstore'],
  ['FIREFOX_JWT_ISSUER', 'addons.mozilla.org → Developer Hub → Manage API keys'],
  ['FIREFOX_JWT_SECRET', 'Same page as the issuer'],
];

const SETUP = [
  <>Make the <a className="text-primary underline" href={REPO}>FreeMusic repo</a> public, so the update URL works for everyone.</>,
  <>Register a Chrome Web Store developer account (one-time US$5) and a free Firefox Add-ons account.</>,
  <>Zip the <code className="font-mono text-sm">extension/</code> folder and upload it by hand once to each store to create the listings.</>,
  <>Add the secrets below under GitHub → Settings → Secrets and variables → Actions.</>,
];

export function Install() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Install & release</h1>
        <p className="mt-2 max-w-2xl text-muted">
          Song list changes ship over the air. Code changes ship through the stores on a version tag.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CloudDownload className="mb-3 h-6 w-6 text-primary" aria-hidden />
          <h2 className="font-semibold">Catalogue updates: automatic</h2>
          <p className="mt-1 text-sm text-muted">
            Push a new <code className="font-mono">extension/rules.json</code>. Every installed extension downloads it within 6
            hours. No store review.
          </p>
        </Card>
        <Card>
          <Rocket className="mb-3 h-6 w-6 text-primary" aria-hidden />
          <h2 className="font-semibold">Code updates: one tag</h2>
          <p className="mt-1 text-sm text-muted">
            Bump the version and push a <code className="font-mono">v*</code> tag. GitHub Actions tests, packages and uploads to
            Chrome and Firefox. Stores still review each release (1–7 days).
          </p>
        </Card>
      </div>

      <Card title="Try it locally">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Download the repo and unzip it.</li>
          <li>Open <code className="font-mono text-sm">chrome://extensions</code> (or Edge / Brave) and turn on <b>Developer mode</b>.</li>
          <li>Click <b>Load unpacked</b> and pick the <code className="font-mono text-sm">extension</code> folder.</li>
          <li>Play a catalogue song on YouTube. The caution card appears bottom-right within 2 seconds.</li>
        </ol>
        <p className="mt-3 text-sm text-muted">
          Firefox: open <code className="font-mono">about:debugging</code> → This Firefox → Load Temporary Add-on → pick{' '}
          <code className="font-mono">extension/manifest.json</code>, then allow access to all websites in the add-on's permissions.
        </p>
        <a href={`${REPO}/archive/refs/heads/main.zip`} className={`${secondaryButton} mt-4`}>
          <ExternalLink className="h-4 w-4" aria-hidden /> Download repo (.zip)
        </a>
      </Card>

      <Card title="Release a new version">
        <p className="mb-3 text-sm text-muted">
          Set <code className="font-mono">"version"</code> in <code className="font-mono">extension/manifest.json</code> first. The
          workflow refuses a tag that doesn't match it.
        </p>
        <Code>{'git commit -am "release: v1.2.1"\ngit tag v1.2.1\ngit push origin main v1.2.1'}</Code>
      </Card>

      <Card title="One-time setup">
        <ol className="space-y-3">
          {SETUP.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">{i + 1}</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>

      <Card title="GitHub secrets">
        <div className="-mx-5 overflow-x-auto sm:mx-0">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr><th className="px-5 py-2 font-medium sm:pl-0">Secret</th><th className="px-5 py-2 font-medium">Where to get it</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {SECRETS.map(([name, where]) => (
                <tr key={name}>
                  <td className="px-5 py-3 font-mono whitespace-nowrap sm:pl-0"><Tag className="mr-1.5 inline h-3.5 w-3.5 text-muted" aria-hidden />{name}</td>
                  <td className="px-5 py-3 text-muted">{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
