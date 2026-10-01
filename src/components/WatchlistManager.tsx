import React, { useState } from 'react';
import { Plus, Trash2, Search, Download, Upload, Shield, Music, User, Disc, Check, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { RiskLevel, WatchlistItem, WatchlistType } from '../types';
import { downloadSampleExcelTemplate } from '../utils/excelParser';

interface WatchlistManagerProps {
  watchlist: WatchlistItem[];
  onAdd: (item: Omit<WatchlistItem, 'id' | 'addedAt'>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onImport: (items: WatchlistItem[]) => void;
  onOpenExcelModal: () => void;
}

export const WatchlistManager: React.FC<WatchlistManagerProps> = ({
  watchlist,
  onAdd,
  onRemove,
  onToggle,
  onImport,
  onOpenExcelModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'artist' | 'song' | 'label'>('all');
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<WatchlistType>('artist');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('high');
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');

  const filteredItems = watchlist.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd({
      name: name.trim(),
      type,
      riskLevel,
      category: category.trim() || (type === 'artist' ? 'Artist' : type === 'song' ? 'Track' : 'Label'),
      notes: notes.trim(),
      enabled: true,
    });

    setName('');
    setCategory('');
    setNotes('');
    setIsAdding(false);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(watchlist, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'audio_copyright_watchlist.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          onImport(parsed);
        }
      } catch (err) {
        alert('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const addQuickPreset = (presetName: string, presetType: WatchlistType, risk: RiskLevel) => {
    onAdd({
      name: presetName,
      type: presetType,
      riskLevel: risk,
      category: presetType === 'artist' ? 'Popular Artist' : 'Commercial Record',
      notes: 'Added from quick watchlist suggestions',
      enabled: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Quick Add Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-xl">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Shield className="w-4 h-4 text-rose-500" />
            <span>Monitored Copyright Watchlist</span>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60 font-normal">
              {watchlist.length} rules saved in persistent storage
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Any audio playing across browser tabs matching these songs or artists will trigger the red caution warning. Your repository is saved permanently in your browser and automatically bundled when you download the extension.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Excel Import Button */}
          <button
            onClick={onOpenExcelModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            title="Import Excel (.xlsx / .xls / .csv) Song Repository"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Excel Repo</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
            title="Export Watchlist to JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <label
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 cursor-pointer transition-colors"
            title="Import Watchlist JSON"
          >
            <Upload className="w-4 h-4" />
            <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
          </label>
        </div>
      </div>

      {/* Add Form Drawer */}
      {isAdding && (
        <form
          onSubmit={handleFormSubmit}
          className="bg-slate-900 border border-slate-700 p-5 rounded-xl space-y-4 animate-in fade-in duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-sm font-semibold text-white">Add New Watchlist Restriction</span>
            <span className="text-xs text-slate-400">Specify name, type, and alert severity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Name (Artist or Song Title) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Billie Eilish, Bad Bunny, Bohemian Rhapsody..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Watchlist Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as WatchlistType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="artist">Artist Name</option>
                <option value="song">Song Title</option>
                <option value="label">Record Label / Publisher</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Risk Severity</label>
              <select
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="high">High (Auto Content ID Strike / Immediate Mute)</option>
                <option value="medium">Medium (Potential Monetization Claim)</option>
                <option value="low">Low (Advisory Only)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category / Genre</label>
              <input
                type="text"
                placeholder="e.g. Commercial Pop, Warner Catalogue, Film Score..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Compliance Notes</label>
              <input
                type="text"
                placeholder="e.g. Known for automatic strikes on live streams..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold"
            >
              Save to Watchlist
            </button>
          </div>
        </form>
      )}

      {/* Quick Add Suggestions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs text-slate-400">
        <span className="shrink-0 text-[11px] uppercase font-semibold text-slate-500">Quick Add:</span>
        <button
          onClick={() => addQuickPreset('Beyoncé', 'artist', 'high')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 text-xs shrink-0 transition-colors"
        >
          + Beyoncé
        </button>
        <button
          onClick={() => addQuickPreset('Queen', 'artist', 'high')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 text-xs shrink-0 transition-colors"
        >
          + Queen
        </button>
        <button
          onClick={() => addQuickPreset('Bad Bunny', 'artist', 'high')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 text-xs shrink-0 transition-colors"
        >
          + Bad Bunny
        </button>
        <button
          onClick={() => addQuickPreset('Universal Music Group', 'label', 'high')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 text-xs shrink-0 transition-colors"
        >
          + Universal Music Group
        </button>
        <button
          onClick={() => addQuickPreset('As It Was', 'song', 'high')}
          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 text-xs shrink-0 transition-colors"
        >
          + As It Was (Song)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search watchlist by artist, song, category, or notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        {/* Segmented Filter Control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({watchlist.length})
          </button>
          <button
            onClick={() => setFilterType('artist')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'artist'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Artists ({watchlist.filter((i) => i.type === 'artist').length})
          </button>
          <button
            onClick={() => setFilterType('song')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'song'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Songs ({watchlist.filter((i) => i.type === 'song').length})
          </button>
          <button
            onClick={() => setFilterType('label')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
              filterType === 'label'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Labels ({watchlist.filter((i) => i.type === 'label').length})
          </button>
        </div>
      </div>

      {/* Table / List View */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-12 text-center">Active</th>
                <th className="py-3 px-4">Monitored Name</th>
                <th className="py-3 px-4 w-28">Type</th>
                <th className="py-3 px-4 w-32">Risk Level</th>
                <th className="py-3 px-4">Compliance Notes</th>
                <th className="py-3 px-4 w-20 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                    <p className="text-xs">No matching watchlist items found.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterType('all');
                      }}
                      className="text-xs text-rose-400 hover:underline mt-1 inline-block"
                    >
                      Clear search filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      !item.enabled ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => onToggle(item.id)}
                        className="rounded accent-rose-500 w-4 h-4 cursor-pointer"
                        title={item.enabled ? 'Enabled' : 'Disabled'}
                      />
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-100">
                      <div className="flex items-center gap-2">
                        {item.type === 'artist' ? (
                          <User className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        ) : item.type === 'song' ? (
                          <Music className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        ) : (
                          <Disc className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        )}
                        <span>{item.name}</span>
                        {item.category && (
                          <span className="text-slate-500 text-[11px] font-normal">
                            · {item.category}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-4 capitalize text-slate-300">
                      {item.type}
                    </td>

                    <td className="py-3 px-4">
                      {item.riskLevel === 'high' ? (
                        <span className="text-[11px] font-mono font-bold text-red-400">
                          HIGH RISK
                        </span>
                      ) : item.riskLevel === 'medium' ? (
                        <span className="text-[11px] font-mono text-amber-400">
                          MEDIUM RISK
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-400">
                          LOW ADVISORY
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-xs truncate max-w-xs" title={item.notes}>
                      {item.notes || '—'}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onRemove(item.id)}
                        className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                        title="Delete from Watchlist"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
