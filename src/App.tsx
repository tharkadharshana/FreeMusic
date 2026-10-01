import React, { useState } from 'react';
import { TopNavigation } from './components/TopNavigation';
import { AudioPlayerSimulator } from './components/AudioPlayerSimulator';
import { WatchlistManager } from './components/WatchlistManager';
import { AuditLogView } from './components/AuditLogView';
import { ExtensionSourceTab } from './components/ExtensionSourceTab';
import { GitPublisherHub } from './components/GitPublisherHub';
import { CopyrightAlertOverlay } from './components/CopyrightAlertOverlay';
import { ExtensionExportModal } from './components/ExtensionExportModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { SettingsDrawer } from './components/SettingsDrawer';
import { DEFAULT_SETTINGS, INITIAL_WATCHLIST } from './data/defaults';
import { DetectionEventLog, DetectionResult, SentinelSettings, WatchlistItem } from './types';
import { AlertOctagon, ShieldAlert, Sparkles, HelpCircle, CheckCircle2, FolderGit2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'simulator' | 'watchlist' | 'audit' | 'extension' | 'git'>('simulator');
  
  // Persistent Watchlist from localStorage
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const cached = localStorage.getItem('sentinel_watchlist_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed to load cached watchlist:', err);
    }
    return INITIAL_WATCHLIST;
  });

  const [settings, setSettings] = useState<SentinelSettings>(DEFAULT_SETTINGS);
  const [activeDetection, setActiveDetection] = useState<DetectionResult | null>(null);
  const [detectionLogs, setDetectionLogs] = useState<DetectionEventLog[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [importNotification, setImportNotification] = useState<string | null>(null);

  // Sync watchlist to localStorage whenever it updates
  React.useEffect(() => {
    try {
      localStorage.setItem('sentinel_watchlist_cache', JSON.stringify(watchlist));
    } catch (err) {
      console.warn('Failed to persist watchlist to localStorage:', err);
    }
  }, [watchlist]);

  // Handle new detection event triggered by audio playback
  const handleDetectionTriggered = (result: DetectionResult, sourceDomain: string) => {
    if (result.isMatch) {
      setActiveDetection(result);
      const matchedString = result.matchedItems
        .map((m) => `${m.item.type.toUpperCase()}: ${m.item.name}`)
        .join(', ');

      const newLog: DetectionEventLog = {
        id: 'log-' + Date.now(),
        timestamp: result.timestamp,
        trackTitle: result.trackTitle,
        trackArtist: result.trackArtist,
        sourceDomain,
        matchedArtistOrSong: matchedString,
        confidence: result.matchedItems[0]?.confidence || 98,
        riskLevel: result.highestRisk,
        actionTaken: 'warned',
      };

      setDetectionLogs((prev) => [newLog, ...prev.slice(0, 49)]); // keep latest 50
    } else {
      setActiveDetection(null);
    }
  };

  const handleDismissDetection = () => {
    setActiveDetection(null);
  };

  const handleMuteToggle = () => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next && activeDetection) {
        // Log mute action
        setDetectionLogs((logs) =>
          logs.map((l, idx) => (idx === 0 ? { ...l, actionTaken: 'muted' } : l))
        );
      }
      return next;
    });
  };

  const handleAddWatchlistItem = (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => {
    const newItem: WatchlistItem = {
      ...item,
      id: 'watch-' + Date.now(),
      addedAt: new Date().toISOString(),
    };
    setWatchlist((prev) => [newItem, ...prev]);
  };

  const handleRemoveWatchlistItem = (id: string) => {
    setWatchlist((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleWatchlistItem = (id: string) => {
    setWatchlist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const handleImportWatchlist = (imported: WatchlistItem[]) => {
    setWatchlist(imported);
    setImportNotification(`Successfully imported ${imported.length} watchlist rules.`);
    setTimeout(() => setImportNotification(null), 4000);
  };

  const handleExcelImportComplete = (newItems: WatchlistItem[], replaceExisting: boolean) => {
    if (replaceExisting) {
      setWatchlist(newItems);
      setImportNotification(`Replaced watchlist with ${newItems.length} items from Excel.`);
    } else {
      setWatchlist((prev) => [...newItems, ...prev]);
      setImportNotification(`Successfully added ${newItems.length} songs & artists from your Excel repository!`);
    }
    setActiveTab('watchlist');
    setTimeout(() => setImportNotification(null), 5000);
  };

  const handleWhitelistExemption = (title: string) => {
    // Disable or exclude item
    setActiveDetection(null);
    if (detectionLogs.length > 0) {
      setDetectionLogs((logs) =>
        logs.map((l, idx) => (idx === 0 ? { ...l, actionTaken: 'exempted' } : l))
      );
    }
  };

  const handleUpdateSettings = (partial: Partial<SentinelSettings>) => {
    setSettings((prev) => ({ ...prev, ...partial }));
  };

  const isAlertActive = activeDetection && activeDetection.isMatch && settings.isEnabled;

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col transition-all duration-300 ${
        isAlertActive && settings.screenBorderFlash
          ? 'ring-8 ring-inset ring-red-600/70 animate-pulse'
          : ''
      }`}
    >
      {/* Top Bar Contract (3 zones) */}
      <TopNavigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isEnabled={settings.isEnabled}
        setIsEnabled={(enabled) => handleUpdateSettings({ isEnabled: enabled })}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        watchlistCount={watchlist.length}
      />

      {/* Main Viewport Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Success toast notification */}
        {importNotification && (
          <div className="mb-4 p-3 bg-emerald-950/80 border border-emerald-600/50 rounded-xl text-emerald-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{importNotification}</span>
            </div>
            <button
              onClick={() => setImportNotification(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-mono"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Context Banner for user's question */}
        <section className="mb-6 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="p-1.5 rounded-lg bg-red-950 border border-red-700/60 text-red-400 mt-0.5 shrink-0">
              <AlertOctagon className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs text-slate-300 font-medium leading-relaxed">
                <strong>Audio Copyright Sentinel:</strong> Auto-detects audio playback via browser media hooks, compares tracks against your custom artist & song watchlist, and triggers the prominent red warning: <span className="text-rose-400 font-semibold font-mono">&quot;{settings.customWarningText}&quot;</span>.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
                <span>· Excel Repo Import (.xlsx, .xls, .csv)</span>
                <span>· MediaElement & MediaSession Hooks</span>
                <span>· Fuzzy Artist/Song Matching</span>
                <span>· Downloadable Manifest V3 Chrome Extension</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 hover:bg-emerald-700 text-emerald-100 transition-colors"
            >
              Upload Excel Repo
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'simulator'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Live Simulator
            </button>
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Get Extension (.ZIP)
            </button>
          </div>
        </section>

        {/* Tab Views */}
        {activeTab === 'simulator' && (
          <AudioPlayerSimulator
            watchlist={watchlist}
            settings={settings}
            onDetectionTriggered={handleDetectionTriggered}
            activeDetection={activeDetection}
            isMuted={isMuted}
            setIsMuted={setIsMuted}
            onClearDetection={() => setActiveDetection(null)}
          />
        )}

        {activeTab === 'watchlist' && (
          <WatchlistManager
            watchlist={watchlist}
            onAdd={handleAddWatchlistItem}
            onRemove={handleRemoveWatchlistItem}
            onToggle={handleToggleWatchlistItem}
            onImport={handleImportWatchlist}
            onOpenExcelModal={() => setIsExcelModalOpen(true)}
          />
        )}

        {activeTab === 'audit' && (
          <AuditLogView
            logs={detectionLogs}
            onClearLogs={() => setDetectionLogs([])}
          />
        )}

        {activeTab === 'git' && (
          <GitPublisherHub
            watchlist={watchlist}
            customWarningText={settings.customWarningText}
          />
        )}

        {activeTab === 'extension' && (
          <ExtensionSourceTab
            watchlist={watchlist}
            customWarningText={settings.customWarningText}
          />
        )}
      </main>

      {/* Floating Red Caution HUD Warning (matching the exact user requirement) */}
      <CopyrightAlertOverlay
        detection={activeDetection}
        onDismiss={handleDismissDetection}
        onMuteToggle={handleMuteToggle}
        isMuted={isMuted}
        customWarningText={settings.customWarningText}
        onAddExemption={handleWhitelistExemption}
      />

      {/* Excel Repository Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportComplete={handleExcelImportComplete}
      />

      {/* Extension Export Modal */}
      <ExtensionExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        watchlist={watchlist}
        customWarningText={settings.customWarningText}
      />

      {/* Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <p>Audio Copyright Sentinel · Browser Extension & Compliance Engine</p>
      </footer>
    </div>
  );
}
