import React, { useState } from 'react';
import { Download, Copy, Check, FileCode, CheckCircle2, ChevronRight, X, Sparkles } from 'lucide-react';
import { ExtensionFile, WatchlistItem } from '../types';
import { downloadExtensionZip, getExtensionFiles } from '../utils/extensionGenerator';

interface ExtensionExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  customWarningText: string;
}

export const ExtensionExportModal: React.FC<ExtensionExportModalProps> = ({
  isOpen,
  onClose,
  watchlist,
  customWarningText,
}) => {
  const files: ExtensionFile[] = getExtensionFiles(watchlist, customWarningText);
  const [selectedFile, setSelectedFile] = useState<ExtensionFile>(files[1]); // default content.js
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await downloadExtensionZip(watchlist, customWarningText);
    } catch (err) {
      console.error('Failed to generate ZIP archive', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-950 border border-rose-600/40 rounded-lg text-rose-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Chrome Extension Source & Exporter (Manifest V3)</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                  Ready to Load
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Complete, production-tested extension package pre-configured with your current {watchlist.length} watchlist rules.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Building Archive...' : 'Download Extension (.ZIP)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Instructions banner */}
        <div className="bg-slate-950/60 px-6 py-2.5 border-b border-slate-800 text-xs text-slate-300 flex items-center justify-between overflow-x-auto gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-rose-400">Quick Install:</span>
            <span>1. Unzip downloaded folder</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span>2. Open <code className="text-rose-300 bg-slate-900 px-1 py-0.5 rounded font-mono">chrome://extensions</code></span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span>3. Enable Developer Mode</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span>4. Click &quot;Load unpacked&quot;</span>
          </div>
          <span className="text-slate-400 text-[11px] shrink-0 font-mono">Supports Chrome, Edge, Brave</span>
        </div>

        {/* Content body: File sidebar + Code preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* File Explorer Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950 p-3 space-y-1 overflow-y-auto">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 px-2 py-1 block">
              Extension Files
            </span>
            {files.map((file) => {
              const isSelected = selectedFile.name === file.name;
              return (
                <button
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-rose-950/70 text-rose-300 border border-rose-700/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] uppercase font-sans text-slate-400">
                    {file.language}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {/* File info bar */}
            <div className="px-4 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/50 text-xs">
              <div>
                <span className="font-mono text-slate-200 font-semibold">{selectedFile.path}</span>
                <span className="text-slate-400 text-[11px] ml-3 hidden sm:inline">
                  {selectedFile.description}
                </span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors text-xs font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Code Content */}
            <pre className="flex-1 p-4 font-mono text-xs text-slate-300 overflow-auto whitespace-pre selection:bg-rose-600/40">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
