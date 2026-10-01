import React from 'react';
import { AlertOctagon, VolumeX, Volume2, X, ExternalLink, ShieldAlert, Check, Copy } from 'lucide-react';
import { DetectionResult } from '../types';

interface CopyrightAlertOverlayProps {
  detection: DetectionResult | null;
  onDismiss: () => void;
  onMuteToggle: () => void;
  isMuted: boolean;
  customWarningText: string;
  onAddExemption?: (title: string) => void;
}

export const CopyrightAlertOverlay: React.FC<CopyrightAlertOverlayProps> = ({
  detection,
  onDismiss,
  onMuteToggle,
  isMuted,
  customWarningText,
  onAddExemption,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!detection || !detection.isMatch) {
    return null;
  }

  const primaryMatch = detection.matchedItems[0];
  const matchedNames = detection.matchedItems.map((m) => `${m.item.type.toUpperCase()}: ${m.item.name}`).join(' · ');

  const handleCopyReport = () => {
    const text = `[AUDIO COPYRIGHT SENTINEL ADVISORY]
Status: ${customWarningText}
Detected Track: "${detection.trackTitle}" by ${detection.trackArtist}
Matched Watchlist Rules: ${matchedNames}
Match Confidence: ${primaryMatch ? primaryMatch.confidence : 100}%
Timestamp: ${detection.timestamp}
Advisory: Commercial streaming or re-distribution without license from rights holder may trigger statutory damages or Content ID claim.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-6 right-6 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-slate-950 border-2 border-red-500 rounded-xl shadow-2xl shadow-red-950/80 overflow-hidden ring-4 ring-red-500/20">
        {/* Red Warning Banner Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 px-4 py-3 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded bg-black/20 flex items-center justify-center">
              <AlertOctagon className="w-5 h-5 text-yellow-300 animate-pulse" />
            </span>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider bg-black/30 px-2 py-0.5 rounded text-yellow-200">
                CRITICAL WARNING
              </span>
              <h4 className="text-sm font-bold tracking-tight text-white leading-tight mt-0.5">
                Copyright Law May Apply — Use With Caution
              </h4>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-white/80 hover:text-white p-1 rounded hover:bg-black/20 transition-colors"
            title="Dismiss warning"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Body */}
        <div className="p-4 space-y-3.5 bg-slate-900/95">
          {/* Custom Caution Message */}
          <div className="bg-red-950/50 border border-red-800/60 rounded-lg p-3 text-red-200 text-xs font-semibold leading-relaxed flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p>{customWarningText}</p>
              <p className="text-red-300/80 font-normal mt-1 text-[11px]">
                Detected audio matches your restricted copyright watchlist. Continued broadcasting or public performance may be subject to automated Content ID claims or statutory copyright enforcement.
              </p>
            </div>
          </div>

          {/* Track and Match Details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Detected Media</span>
              <span className="font-semibold text-slate-100 truncate block mt-0.5" title={detection.trackTitle}>
                {detection.trackTitle}
              </span>
              <span className="text-slate-400 text-[11px] truncate block" title={detection.trackArtist}>
                by {detection.trackArtist}
              </span>
            </div>

            <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[11px] block">Watchlist Match</span>
              <span className="font-semibold text-rose-400 truncate block mt-0.5" title={matchedNames}>
                {matchedNames}
              </span>
              <span className="text-slate-400 text-[11px] font-mono tabular-nums block">
                {primaryMatch?.confidence || 98}% match confidence ({primaryMatch?.matchType || 'token'})
              </span>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={onMuteToggle}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isMuted
                    ? 'bg-amber-600 hover:bg-amber-500 text-white'
                    : 'bg-red-600 hover:bg-red-500 text-white shadow-xs'
                }`}
              >
                {isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{isMuted ? 'Unmute Audio' : 'Emergency Mute'}</span>
              </button>

              <button
                onClick={handleCopyReport}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
                title="Copy advisory log to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onAddExemption && (
                <button
                  onClick={() => onAddExemption(detection.trackTitle)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors underline"
                >
                  Whitelist Track
                </button>
              )}
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
