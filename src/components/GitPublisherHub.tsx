import React, { useState } from 'react';
import { 
  GitBranch, 
  UploadCloud, 
  Terminal, 
  Key, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  Download, 
  ShieldCheck, 
  Layers, 
  RefreshCw, 
  Zap,
  Globe,
  FileCode,
  FolderGit2
} from 'lucide-react';
import { WatchlistItem } from '../types';
import { downloadExtensionZip } from '../utils/extensionGenerator';

interface GitPublisherHubProps {
  watchlist: WatchlistItem[];
  customWarningText: string;
}

export const GitPublisherHub: React.FC<GitPublisherHubProps> = ({
  watchlist,
  customWarningText,
}) => {
  const [githubUser, setGithubUser] = useState('tharkadharshana');
  const [repoName, setRepoName] = useState('audio-copyright-sentinel');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const rawRulesUrl = `https://raw.githubusercontent.com/${githubUser}/${repoName}/main/rules.json`;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const workflowCode = `name: Automated Multi-Store Extension Deployment

on:
  push:
    tags:
      - 'v*' # Triggers whenever you push a version tag like v1.1.0

jobs:
  publish:
    name: Build & Publish to Chrome Web Store and Firefox Add-ons
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Package Extension Archive
        run: |
          mkdir -p build
          zip -r build/audio-copyright-sentinel.zip manifest.json content.js background.js popup.html popup.js styles.css rules.json README.md

      # 1. Automated Chrome Web Store Upload & Publish
      - name: Upload to Chrome Web Store
        uses: mnao305/chrome-extension-upload@v5.0.0
        continue-on-error: true
        with:
          file-path: build/audio-copyright-sentinel.zip
          extension-id: \${{ secrets.CHROME_EXTENSION_ID }}
          client-id: \${{ secrets.CHROME_CLIENT_ID }}
          client-secret: \${{ secrets.CHROME_CLIENT_SECRET }}
          refresh-token: \${{ secrets.CHROME_REFRESH_TOKEN }}

      # 2. Automated Mozilla Firefox Add-on (AMO) Signing & Publish
      - name: Upload & Sign on Firefox Add-ons (AMO)
        uses: wdzeng/firefox-addon-action@v1
        continue-on-error: true
        with:
          addon-id: \${{ secrets.FIREFOX_ADDON_ID }}
          jwt-issuer: \${{ secrets.FIREFOX_JWT_ISSUER }}
          jwt-secret: \${{ secrets.FIREFOX_JWT_SECRET }}
          xpi-path: build/audio-copyright-sentinel.zip`;

  const gitSetupScript = `# 1. Extract the downloaded extension ZIP into your local folder
# 2. Initialize and push to your GitHub repository:
git init
git branch -M main
git remote add origin https://github.com/${githubUser}/${repoName}.git
git add .
git commit -m "feat: Initial commit for Audio Copyright Sentinel v1.1.0"
git push -u origin main

# To deploy code updates across Chrome and Firefox stores automatically:
git tag v1.1.0
git push origin v1.1.0`;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-700/50 text-rose-300 text-xs font-semibold">
              <FolderGit2 className="w-3.5 h-3.5" />
              <span>Production Architecture & Git CI/CD Hub</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Publishing & Continuous Maintenance Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Maintain thousands of restricted songs, update users instantly with zero store review delays, and push code releases to the <strong>Chrome Web Store</strong> and <strong>Firefox Add-ons</strong> using automated GitHub Actions.
            </p>
          </div>

          <button
            onClick={() => downloadExtensionZip(watchlist, customWarningText)}
            className="flex items-center gap-2.5 px-5 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/40 transition-all self-start lg:self-auto shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Download Complete Git Repo ZIP</span>
          </button>
        </div>
      </div>

      {/* The 2-Tier Architecture Breakdown */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Layers className="w-4 h-4 text-rose-400" />
          <span>The Industry-Standard 2-Tier Architecture</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tier 1 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-950 border border-emerald-700/60 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                1
              </span>
              <h4 className="text-sm font-bold text-white">Tier 1: Over-The-Air (OTA) Song Updates</h4>
              <span className="ml-auto text-[10px] font-mono bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800/80">
                Instant · Zero Store Delay
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When you add or edit songs, you <strong>do not</strong> need to submit a new extension version or wait 3–7 days for Google/Mozilla review.
            </p>

            <ul className="text-xs text-slate-400 space-y-2 pt-1 border-t border-slate-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>You commit your updated <code>rules.json</code> to your GitHub repository.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Extensions check your GitHub raw URL every 6 hours via <code>chrome.alarms</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>All active users receive your new restricted songs automatically worldwide!</span>
              </li>
            </ul>
          </div>

          {/* Tier 2 Card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none" />
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center text-xs font-bold font-mono">
                2
              </span>
              <h4 className="text-sm font-bold text-white">Tier 2: Automated Store CI/CD Releases</h4>
              <span className="ml-auto text-[10px] font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/80">
                Automated via GitHub Actions
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When you update extension code, UI styling, or manifest permissions, automated CI/CD packages and uploads to store APIs.
            </p>

            <ul className="text-xs text-slate-400 space-y-2 pt-1 border-t border-slate-800">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Bump version in <code>manifest.json</code> and push git tag: <code>git tag v1.1.0</code>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>GitHub Actions zips the repository and connects to the Chrome Web Store API.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>Signs and uploads to Mozilla Firefox Add-ons (AMO) automatically.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Repository Setup & Remote URL Config */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-cyan-400" />
              <span>Configure Your GitHub Repository Coordinates</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your GitHub username and repository name to preview your live Over-The-Air song update endpoint.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              GitHub Username / Organization
            </label>
            <input
              type="text"
              value={githubUser}
              onChange={(e) => setGithubUser(e.target.value.trim())}
              placeholder="e.g. tharkadharshana"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Repository Name
            </label>
            <input
              type="text"
              value={repoName}
              onChange={(e) => setRepoName(e.target.value.trim())}
              placeholder="e.g. audio-copyright-sentinel"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        {/* Live Raw Rules Endpoint Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>Your Live Over-The-Air Rules URL</span>
            </span>
            <button
              onClick={() => copyToClipboard(rawRulesUrl, 'url')}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
            >
              <Copy className="w-3 h-3" />
              <span>{copiedId === 'url' ? 'Copied URL!' : 'Copy Endpoint'}</span>
            </button>
          </div>
          <code className="block p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 break-all select-all">
            {rawRulesUrl}
          </code>
          <p className="text-[11px] text-slate-400">
            Whenever this file updates on your <code>main</code> branch, extensions automatically fetch and ingest new copyright rules in the background.
          </p>
        </div>
      </div>

      {/* What You Need To Do From Your End (Clear Checklist) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-rose-500" />
          <span>What You Need To Do From Your End (Step-by-Step)</span>
        </h3>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex gap-4">
            <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-700/60 text-rose-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Create Developer Accounts
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                • <strong>Google Chrome:</strong> Register at the <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noreferrer" className="text-rose-400 hover:underline inline-flex items-center gap-1">Chrome Web Store Developer Dashboard <ExternalLink className="w-3 h-3" /></a> ($5 one-time registration fee).<br />
                • <strong>Mozilla Firefox:</strong> Register for free at the <a href="https://addons.mozilla.org/developers/" target="_blank" rel="noreferrer" className="text-rose-400 hover:underline inline-flex items-center gap-1">Firefox Add-on Developer Hub <ExternalLink className="w-3 h-3" /></a>.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex gap-4">
            <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-700/60 text-rose-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Push Repository Code To Your GitHub
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Click <strong>"Download Complete Git Repo ZIP"</strong> above, extract the files into your local project folder, open your terminal in that folder, and run:
              </p>
              <div className="relative">
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto">
                  {gitSetupScript}
                </pre>
                <button
                  onClick={() => copyToClipboard(gitSetupScript, 'git')}
                  className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 text-xs font-medium flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === 'git' ? 'Copied!' : 'Copy Commands'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex gap-4">
            <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-700/60 text-rose-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div className="space-y-2 flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                <span>Add GitHub Actions Secrets for Automated Publishing</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                In your GitHub repository, open <strong>Settings</strong> → <strong>Secrets and variables</strong> → <strong>Actions</strong> → <strong>New repository secret</strong>, and add:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-rose-400 font-semibold">Chrome Web Store API:</div>
                  <div className="text-slate-300"><code>CHROME_EXTENSION_ID</code></div>
                  <div className="text-slate-300"><code>CHROME_CLIENT_ID</code></div>
                  <div className="text-slate-300"><code>CHROME_CLIENT_SECRET</code></div>
                  <div className="text-slate-300"><code>CHROME_REFRESH_TOKEN</code></div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <div className="text-amber-400 font-semibold">Mozilla Firefox AMO API:</div>
                  <div className="text-slate-300"><code>FIREFOX_ADDON_ID</code></div>
                  <div className="text-slate-300"><code>FIREFOX_JWT_ISSUER</code></div>
                  <div className="text-slate-300"><code>FIREFOX_JWT_SECRET</code></div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex gap-4">
            <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-700/60 text-rose-400 font-mono text-xs font-bold flex items-center justify-center shrink-0">
              4
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wide">
                Publishing Workflow (Day-to-Day Maintenance)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <strong className="text-emerald-400 block mb-1">To Add New Songs / Edit Rules:</strong>
                  <span className="text-slate-300 block mb-2">Simply edit or overwrite <code>rules.json</code> and push to main.</span>
                  <code className="text-[11px] font-mono text-slate-400 block bg-slate-950 p-1.5 rounded">
                    git commit -am "Add new restricted songs"<br />
                    git push origin main
                  </code>
                  <span className="text-[11px] text-emerald-400 block mt-1.5">✓ No store approval needed; auto-syncs to users!</span>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                  <strong className="text-indigo-400 block mb-1">To Publish Code Updates to Stores:</strong>
                  <span className="text-slate-300 block mb-2">Bump version in <code>manifest.json</code> and push a tag:</span>
                  <code className="text-[11px] font-mono text-slate-400 block bg-slate-950 p-1.5 rounded">
                    git tag v1.2.0<br />
                    git push origin v1.2.0
                  </code>
                  <span className="text-[11px] text-indigo-400 block mt-1.5">✓ GitHub Actions automatically uploads to Chrome & Firefox!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated CI/CD Workflow Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-rose-400" />
            <h3 className="text-sm font-bold text-white">
              GitHub Actions Workflow Script (<code>.github/workflows/deploy.yml</code>)
            </h3>
          </div>
          <button
            onClick={() => copyToClipboard(workflowCode, 'workflow')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedId === 'workflow' ? 'Copied YAML!' : 'Copy Workflow'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-96">
          {workflowCode}
        </pre>
      </div>
    </div>
  );
};
