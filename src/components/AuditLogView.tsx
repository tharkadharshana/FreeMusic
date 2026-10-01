import React, { useState } from 'react';
import { Download, Trash2, ShieldAlert, CheckCircle2, VolumeX, Eye } from 'lucide-react';
import { DetectionEventLog } from '../types';

interface AuditLogViewProps {
  logs: DetectionEventLog[];
  onClearLogs: () => void;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs, onClearLogs }) => {
  const [filter, setFilter] = useState<'all' | 'high' | 'muted'>('all');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'high') return log.riskLevel === 'high';
    if (filter === 'muted') return log.actionTaken === 'muted';
    return true;
  });

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['Timestamp', 'Track Title', 'Artist', 'Source URL', 'Matched Watchlist Rule', 'Confidence', 'Risk Level', 'Action Taken'];
    const rows = logs.map((l) => [
      l.timestamp,
      `"${l.trackTitle.replace(/"/g, '""')}"`,
      `"${l.trackArtist.replace(/"/g, '""')}"`,
      `"${l.sourceDomain.replace(/"/g, '""')}"`,
      `"${l.matchedArtistOrSong.replace(/"/g, '""')}"`,
      `${l.confidence}%`,
      l.riskLevel,
      l.actionTaken,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `copyright_sentinel_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Detection & Enforcement Audit Trail</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time record of intercepted playback sessions, matched catalog rules, and user cautionary actions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-950/40 hover:text-red-300 text-slate-400 border border-slate-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Events ({logs.length})
        </button>
        <button
          onClick={() => setFilter('high')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filter === 'high' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          High Risk Only ({logs.filter((l) => l.riskLevel === 'high').length})
        </button>
        <button
          onClick={() => setFilter('muted')}
          className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
            filter === 'muted' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Muted / Intercepted ({logs.filter((l) => l.actionTaken === 'muted').length})
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-28">Timestamp</th>
                <th className="py-3 px-4">Detected Media</th>
                <th className="py-3 px-4">Source Tab</th>
                <th className="py-3 px-4">Matched Watchlist Rule</th>
                <th className="py-3 px-4 w-24 text-right">Confidence</th>
                <th className="py-3 px-4 w-28">Risk</th>
                <th className="py-3 px-4 w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-sans">
                    No detection audit events recorded yet. Play an audio track in the simulator to generate live events.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 tabular-nums">
                      {log.timestamp}
                    </td>

                    <td className="py-3 px-4 font-sans font-medium text-slate-200">
                      <div>
                        <span>{log.trackTitle}</span>
                        <span className="text-slate-400 text-xs block font-normal">
                          by {log.trackArtist}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-400 truncate max-w-[140px]" title={log.sourceDomain}>
                      {log.sourceDomain}
                    </td>

                    <td className="py-3 px-4 font-sans text-rose-300 font-medium">
                      {log.matchedArtistOrSong}
                    </td>

                    <td className="py-3 px-4 text-right tabular-nums text-slate-300">
                      {log.confidence}%
                    </td>

                    <td className="py-3 px-4 font-sans">
                      {log.riskLevel === 'high' ? (
                        <span className="text-red-400 font-bold text-[11px]">
                          CRITICAL RISK
                        </span>
                      ) : (
                        <span className="text-amber-400 text-[11px]">
                          MODERATE
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-sans">
                      {log.actionTaken === 'muted' ? (
                        <span className="text-amber-300 flex items-center gap-1 text-[11px]">
                          <VolumeX className="w-3 h-3" /> Muted
                        </span>
                      ) : log.actionTaken === 'exempted' ? (
                        <span className="text-cyan-300 flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3 h-3" /> Whitelisted
                        </span>
                      ) : (
                        <span className="text-red-300 flex items-center gap-1 text-[11px]">
                          <Eye className="w-3 h-3" /> Warned
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
