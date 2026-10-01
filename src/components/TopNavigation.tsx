import React from 'react';
import { ShieldAlert, ShieldCheck, Download, Sliders, FileCode, FileSpreadsheet, FolderGit2 } from 'lucide-react';

interface TopNavigationProps {
  activeTab: 'simulator' | 'watchlist' | 'audit' | 'extension' | 'git';
  setActiveTab: (tab: 'simulator' | 'watchlist' | 'audit' | 'extension' | 'git') => void;
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  onOpenExportModal: () => void;
  onOpenSettings: () => void;
  onOpenExcelModal: () => void;
  watchlistCount: number;
}

export const TopNavigation: React.FC<TopNavigationProps> = ({
  activeTab,
  setActiveTab,
  isEnabled,
  setIsEnabled,
  onOpenExportModal,
  onOpenSettings,
  onOpenExcelModal,
  watchlistCount,
}) => {
  return (
    <header className="w-full bg-slate-950 border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-white block leading-none">
              Audio Copyright Sentinel
            </span>
            <span className="text-xs text-slate-400 font-mono mt-0.5 block">
              Auto-Detection & Real-Time Alert Engine
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'watchlist'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Watchlist ({watchlistCount})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Audit Log
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'git'
                ? 'bg-rose-950/80 text-rose-300 border border-rose-700/50 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-rose-400" />
            <span>Git & CI/CD Hub</span>
          </button>
          <button
            onClick={() => setActiveTab('extension')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'extension'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-slate-400" />
            <span>Source Code</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2.5">
          {/* Import Excel Button */}
          <button
            onClick={onOpenExcelModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 border border-emerald-600/40 text-emerald-300 rounded-lg text-xs font-medium transition-colors whitespace-nowrap"
            title="Import Excel or CSV Restricted Songs Repository"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Import Excel</span>
          </button>

          {/* Active Sentinel Toggle */}
          <button
            onClick={() => setIsEnabled(!isEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isEnabled
                ? 'bg-emerald-950/60 border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title="Toggle Real-Time Audio Interception"
          >
            {isEnabled ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-slate-500" />
            )}
            <span className="hidden sm:inline">Sentinel:</span>
            <span className="font-semibold">{isEnabled ? 'ACTIVE' : 'PAUSED'}</span>
          </button>

          {/* Quick Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Configure Alert Sensitivity & Custom Warning Text"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Export / Download Extension (.ZIP) */}
          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs hover:shadow-rose-900/50 transition-all whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Extension</span>
          </button>
        </div>
      </div>
    </header>
  );
};
