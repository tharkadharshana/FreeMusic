import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, ExternalLink, ShieldCheck, Terminal } from 'lucide-react';
import { ExtensionFile, WatchlistItem } from '../types';
import { downloadExtensionZip, getExtensionFiles } from '../utils/extensionGenerator';

interface ExtensionSourceTabProps {
  watchlist: WatchlistItem[];
  customWarningText: string;
}

export const ExtensionSourceTab: React.FC<ExtensionSourceTabProps> = ({
  watchlist,
  customWarningText,
}) => {
  const files: ExtensionFile[] = getExtensionFiles(watchlist, customWarningText);
  const [activeFile, setActiveFile] = useState<ExtensionFile>(files[1]); // content.js
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadExtensionZip(watchlist, customWarningText);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-rose-950 border border-rose-700/50 text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Production Chrome Extension Package (Manifest V3)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-2 max-w-2xl leading-relaxed">
            This browser extension automatically intercepts HTML5 audio/video, YouTube, Spotify Web, SoundCloud, and Twitch streams. When any detected track or artist matches your watchlist, it renders the high-visibility red caution HUD directly on the page.
          </p>
          <div className="mt-3 flex items-center gap-4 text-xs font-mono text-slate-400">
            <span>Manifest V3 Compliant</span>
            <span>·</span>
            <span>{files.length} Generated Files</span>
            <span>·</span>
            <span>Pre-seeded with {watchlist.length} Watchlist Entries</span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col gap-2">
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-950 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloading ? 'Bundling ZIP...' : 'Download Extension (.ZIP)'}</span>
          </button>
          <span className="text-[11px] text-slate-500 text-center font-mono">
            Unpack & load in 30 seconds
          </span>
        </div>
      </div>

      {/* 4 Step Setup Guide */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-rose-400 font-bold font-mono text-sm block mb-1">01. Extract ZIP</span>
          <p className="text-slate-400 leading-normal">
            Download and unpack the <code className="text-slate-200">.zip</code> archive into a folder on your computer.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-rose-400 font-bold font-mono text-sm block mb-1">02. Open Extensions</span>
          <p className="text-slate-400 leading-normal">
            In Chrome, Edge, or Brave, visit <code className="text-rose-300 font-mono">chrome://extensions</code> in your address bar.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-rose-400 font-bold font-mono text-sm block mb-1">03. Developer Mode</span>
          <p className="text-slate-400 leading-normal">
            Toggle the <strong>Developer mode</strong> switch in the upper-right corner of the extensions page.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
          <span className="text-rose-400 font-bold font-mono text-sm block mb-1">04. Load Unpacked</span>
          <p className="text-slate-400 leading-normal">
            Click <strong>&quot;Load unpacked&quot;</strong> and select the unzipped directory containing <code className="text-slate-300">manifest.json</code>.
          </p>
        </div>
      </div>

      {/* Code Inspector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {/* File selector header */}
        <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3 overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            {files.map((file) => (
              <button
                key={file.name}
                onClick={() => setActiveFile(file)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                  activeFile.name === file.name
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/60 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy File'}</span>
            </button>
          </div>
        </div>

        {/* File description line */}
        <div className="px-5 py-2 bg-slate-950/50 border-b border-slate-800/80 text-xs text-slate-400 flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span>{activeFile.description}</span>
        </div>

        {/* Preformatted code block */}
        <pre className="p-5 font-mono text-xs text-slate-300 overflow-auto max-h-[500px] whitespace-pre bg-slate-950 selection:bg-rose-600/40">
          <code>{activeFile.content}</code>
        </pre>
      </div>
    </div>
  );
};
