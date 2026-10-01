import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Check, AlertCircle, X, Download, ArrowRight, Table, Sparkles } from 'lucide-react';
import { RiskLevel, WatchlistItem } from '../types';
import { parseExcelFile, convertRowsToWatchlist, downloadSampleExcelTemplate, ParsedExcelResult } from '../utils/excelParser';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (newItems: WatchlistItem[], replaceExisting: boolean) => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParsedExcelResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Column mapping state
  const [songCol, setSongCol] = useState<string>('');
  const [artistCol, setArtistCol] = useState<string>('');
  const [notesCol, setNotesCol] = useState<string>('');
  const [categoryCol, setCategoryCol] = useState<string>('');
  const [riskCol, setRiskCol] = useState<string>('');
  const [defaultRisk, setDefaultRisk] = useState<RiskLevel>('high');
  const [importBoth, setImportBoth] = useState<boolean>(true);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);
    setParsing(true);

    try {
      const result = await parseExcelFile(selectedFile);
      if (result.rawRows.length === 0) {
        setError('No data rows found in the selected Excel spreadsheet.');
        setParseResult(null);
        setParsing(false);
        return;
      }

      setParseResult(result);
      setSongCol(result.detectedMapping.songCol || result.detectedMapping.nameCol || '');
      setArtistCol(result.detectedMapping.artistCol || '');
      setNotesCol(result.detectedMapping.notesCol || '');
      setCategoryCol(result.detectedMapping.categoryCol || '');
      setRiskCol(result.detectedMapping.riskCol || '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to parse Excel file.');
      setParseResult(null);
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;

    const items = convertRowsToWatchlist(
      parseResult.rawRows,
      {
        songCol: songCol || undefined,
        artistCol: artistCol || undefined,
        notesCol: notesCol || undefined,
        categoryCol: categoryCol || undefined,
        riskCol: riskCol || undefined,
      },
      {
        importBothArtistAndSong: importBoth,
        defaultRisk,
      }
    );

    if (items.length === 0) {
      setError('No valid songs or artists could be created from the selected mapping.');
      return;
    }

    onImportComplete(items, replaceExisting);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setError(null);
    setSongCol('');
    setArtistCol('');
    setNotesCol('');
    setCategoryCol('');
    setRiskCol('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-600/40 rounded-lg text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Import Restricted Songs & Artists Repository</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/60">
                  Excel / CSV (.xlsx, .xls, .csv)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload your Excel music catalog or spreadsheet. The system will auto-map columns and ingest all rules into your Sentinel watchlist.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* If no file uploaded yet */}
          {!parseResult ? (
            <div className="space-y-6">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-rose-500/80 bg-slate-950/60 hover:bg-slate-950 rounded-2xl p-10 text-center cursor-pointer transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange(f);
                  }}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-rose-400 group-hover:border-rose-500/50 transition-colors">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-white">
                  Click to browse or drag and drop your Excel spreadsheet
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Supports Microsoft Excel (<code className="text-slate-300 font-mono">.xlsx</code>, <code className="text-slate-300 font-mono">.xls</code>) and comma-separated (<code className="text-slate-300 font-mono">.csv</code>)
                </p>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium">
                  <span>Any column names accepted (e.g. Song Title, Artist, Label, Notes)</span>
                </div>
              </div>

              {/* Template Download & Format Guide */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                    <span>Need a formatted Excel template?</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 max-w-md">
                    Download our ready-to-use sample spreadsheet pre-filled with columns: <span className="text-slate-200">Song Title, Artist, Type, Risk Level, Category, Label/Notes</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSampleExcelTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors shrink-0"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download Sample .XLSX Template</span>
                </button>
              </div>

              {parsing && (
                <div className="text-center py-4 text-xs font-mono text-rose-400 animate-pulse">
                  Parsing spreadsheet rows and detecting schema...
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          ) : (
            /* Schema Mapping & Preview */
            <div className="space-y-6">
              {/* File Info Bar */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">{file?.name}</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400 font-mono tabular-nums">{parseResult.rawRows.length} rows detected</span>
                  <span className="text-slate-500">·</span>
                  <span className="text-slate-400">{parseResult.headers.length} columns</span>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs text-rose-400 hover:text-rose-300 underline"
                >
                  Choose Different File
                </button>
              </div>

              {/* Column Mapping Selector Grid */}
              <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Confirm Column Mapping
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Verify how your Excel headers map to Sentinel watchlist fields
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Song Title Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Song / Track Title Column
                    </label>
                    <select
                      value={songCol}
                      onChange={(e) => setSongCol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">-- None / No Song Column --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Artist Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Artist / Creator Column
                    </label>
                    <select
                      value={artistCol}
                      onChange={(e) => setArtistCol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">-- None / No Artist Column --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Risk Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Risk / Severity Column
                    </label>
                    <select
                      value={riskCol}
                      onChange={(e) => setRiskCol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">-- Use Default ({defaultRisk.toUpperCase()}) --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Category / Genre Column
                    </label>
                    <select
                      value={categoryCol}
                      onChange={(e) => setCategoryCol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">-- Optional / None --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Notes Column */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Label / Copyright Notes Column
                    </label>
                    <select
                      value={notesCol}
                      onChange={(e) => setNotesCol(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="">-- Optional / None --</option>
                      {parseResult.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Default Risk Setting */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Default Alert Severity
                    </label>
                    <select
                      value={defaultRisk}
                      onChange={(e) => setDefaultRisk(e.target.value as RiskLevel)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value="high">High Risk (Full Red Warning & Mute)</option>
                      <option value="medium">Medium Risk (Warning Advisory)</option>
                      <option value="low">Low Risk (Informational Notice)</option>
                    </select>
                  </div>
                </div>

                {/* Import Options */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-6 text-xs text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importBoth}
                      onChange={(e) => setImportBoth(e.target.checked)}
                      className="w-4 h-4 accent-rose-500 rounded"
                    />
                    <span>Import both Artist and Song as distinct watchlist rules</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-amber-300">
                    <input
                      type="checkbox"
                      checked={replaceExisting}
                      onChange={(e) => setReplaceExisting(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>Replace entire existing watchlist (uncheck to merge)</span>
                  </label>
                </div>
              </div>

              {/* Live Preview of first 5 rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Table className="w-3.5 h-3.5 text-rose-400" />
                    <span>Spreadsheet Preview (First {Math.min(5, parseResult.rawRows.length)} Rows)</span>
                  </h4>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Showing raw Excel data from sheet: {parseResult.sheetNames[0]}
                  </span>
                </div>

                <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-slate-400 border-b border-slate-800 font-mono">
                        {parseResult.headers.map((h) => (
                          <th key={h} className="py-2 px-3 whitespace-nowrap">
                            {h}
                            {h === songCol && <span className="text-rose-400 ml-1">(Song)</span>}
                            {h === artistCol && <span className="text-cyan-400 ml-1">(Artist)</span>}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parseResult.rawRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/50">
                          {parseResult.headers.map((h) => (
                            <td key={h} className="py-2 px-3 text-slate-300 whitespace-nowrap max-w-[200px] truncate">
                              {String(row[h] || '—')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <button
            type="button"
            onClick={downloadSampleExcelTemplate}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Download Sample Excel Template</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium"
            >
              Cancel
            </button>

            {parseResult && (
              <button
                type="button"
                onClick={handleConfirmImport}
                className="flex items-center gap-2 px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Import {parseResult.rawRows.length} Rows Into Watchlist</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
