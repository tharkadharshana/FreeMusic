import React from 'react';
import { X, Volume2, ShieldAlert, Sliders, Info, Zap } from 'lucide-react';
import { SentinelSettings } from '../types';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SentinelSettings;
  onUpdateSettings: (newSettings: Partial<SentinelSettings>) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between overflow-y-auto shadow-2xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-white tracking-tight">Sentinel Configuration</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Warning Message Configuration */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">
              Custom Caution Banner Alert Text
            </label>
            <textarea
              rows={3}
              value={settings.customWarningText}
              onChange={(e) => onUpdateSettings({ customWarningText: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 font-sans"
              placeholder="Enter warning text displayed when copyrighted song or artist is detected..."
            />
            <p className="text-[11px] text-slate-400">
              This exact notice appears on the high-visibility red caution HUD banner both in this app and inside the exported browser extension.
            </p>
          </div>

          {/* Alert Options */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Enforcement Actions & Alerts
            </span>

            {/* Sound Alert Toggle */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-950/70 transition-colors">
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-rose-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Audible Caution Chime</span>
                  <span className="text-[11px] text-slate-400 block">
                    Play dual-tone cautionary sound when a match is caught
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.soundAlert}
                onChange={(e) => onUpdateSettings({ soundAlert: e.target.checked })}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            {/* Auto Pause */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-950/70 transition-colors">
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Auto-Pause on Match</span>
                  <span className="text-[11px] text-slate-400 block">
                    Immediately freeze audio playback upon copyright identification
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.autoPauseOnMatch}
                onChange={(e) => onUpdateSettings({ autoPauseOnMatch: e.target.checked })}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>

            {/* Screen Perimeter Glow */}
            <label className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer hover:bg-slate-950/70 transition-colors">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-red-400" />
                <div>
                  <span className="text-xs font-semibold text-white block">Screen Border Red Flash</span>
                  <span className="text-[11px] text-slate-400 block">
                    Pulse browser viewport perimeter with red caution border
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.screenBorderFlash}
                onChange={(e) => onUpdateSettings({ screenBorderFlash: e.target.checked })}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Matching Sensitivity */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300">
                Fuzzy Match Threshold: {Math.round(settings.fuzzyThreshold * 100)}%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {settings.fuzzyThreshold >= 0.85
                  ? 'Strict'
                  : settings.fuzzyThreshold >= 0.7
                  ? 'Balanced'
                  : 'Permissive (Catches Typos)'}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="0.95"
              step="0.05"
              value={settings.fuzzyThreshold}
              onChange={(e) => onUpdateSettings({ fuzzyThreshold: parseFloat(e.target.value) })}
              className="w-full accent-rose-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Higher values require closer spelling matches; lower values catch typos, featuring artists, and alternate track names.
            </p>
          </div>

          {/* Technical Explainer */}
          <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-slate-400 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-semibold">
              <Info className="w-4 h-4" />
              <span>How Auto-Detection Operates</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              1. <strong>HTMLMediaElement Hook</strong>: The content script monitors audio and video playback state changes across all page tags.
            </p>
            <p className="text-[11px] leading-relaxed">
              2. <strong>MediaSession Extraction</strong>: Queries <code className="text-slate-300">navigator.mediaSession.metadata</code> to obtain verified track title and artist credentials.
            </p>
            <p className="text-[11px] leading-relaxed">
              3. <strong>Watchlist Comparison</strong>: Executes normalized Levenshtein distance against your configured watchlist items.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
