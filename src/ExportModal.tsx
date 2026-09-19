import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, X, FileJson, FileSpreadsheet, FileText } from 'lucide-react';

type ExportModalProps = {
  data: any[];
  isLightMode?: boolean;
};

// Proper RFC 4180 CSV field escaping (quotes doubled, not backslash-escaped)
function csvEscape(value: any) {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

export default function ExportModal({ data, isLightMode = true }: ExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<'geojson' | 'csv' | 'json'>('geojson');
  const [isDownloading, setIsDownloading] = useState(false);

  const formatOptions = [
    { value: 'geojson', label: 'GeoJSON', icon: FileJson, desc: 'For GIS tools, QGIS, ArcGIS' },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, desc: 'For Excel, Google Sheets' },
    { value: 'json', label: 'JSON', icon: FileText, desc: 'Raw structured data' },
  ] as const;

  const handleDownload = () => {
    setIsDownloading(true);

    setTimeout(() => {
      let content = '';
      let mimeType = '';
      const filename = `smartcity_export.${format}`;

      if (format === 'geojson') {
        content = JSON.stringify({ type: 'FeatureCollection', features: data }, null, 2);
        mimeType = 'application/geo+json';
      } else if (format === 'json') {
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const rows = data.map((f: any) => f.properties || {});
        const headers = Array.from(new Set(rows.flatMap((r: any) => Object.keys(r))));
        const csvLines = [
          headers.join(','),
          ...rows.map((r: any) => headers.map(h => csvEscape(r[h])).join(',')),
        ];
        content = csvLines.join('\n');
        mimeType = 'text/csv';
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setIsDownloading(false);
      setIsOpen(false);
    }, 500);
  };

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={() => !isDownloading && setIsOpen(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scaleIn ${
          isLightMode ? 'bg-white' : 'bg-[#0b1120] border border-white/10'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-5 border-b ${isLightMode ? 'border-stone-100' : 'border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isLightMode ? 'bg-amber-50 text-amber-600' : 'bg-amber-500/10 text-amber-400'}`}>
              <Download size={18} />
            </div>
            <div>
              <h2 className={`font-heading font-bold text-lg leading-tight ${isLightMode ? 'text-stone-900' : 'text-slate-100'}`}>
                Export Map Data
              </h2>
              <p className={`text-xs ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`}>
                {data.length.toLocaleString()} records available
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors ${
              isLightMode ? 'text-stone-400 hover:bg-stone-100 hover:text-stone-700' : 'text-slate-500 hover:bg-white/10 hover:text-slate-200'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className={`text-xs font-semibold mb-3 block ${isLightMode ? 'text-stone-500' : 'text-slate-400'}`}>
            Choose file format
          </label>
          <div className="flex flex-col gap-2">
            {formatOptions.map(opt => {
              const Icon = opt.icon;
              const active = format === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                    active
                      ? (isLightMode ? 'border-amber-400 bg-amber-50' : 'border-amber-500/50 bg-amber-500/10')
                      : (isLightMode ? 'border-stone-200 hover:border-stone-300' : 'border-white/10 hover:border-white/20')
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    active
                      ? (isLightMode ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white')
                      : (isLightMode ? 'bg-stone-100 text-stone-500' : 'bg-white/10 text-slate-400')
                  }`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className={`text-sm font-semibold ${isLightMode ? 'text-stone-800' : 'text-slate-100'}`}>{opt.label}</div>
                    <div className={`text-xs ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`}>{opt.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-2 px-6 py-4 border-t ${isLightMode ? 'border-stone-100 bg-stone-50' : 'border-white/10 bg-white/[0.02]'}`}>
          <button
            onClick={() => setIsOpen(false)}
            disabled={isDownloading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap ${
              isLightMode ? 'text-stone-600 hover:bg-stone-200' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isDownloading || data.length === 0}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {isDownloading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin shrink-0" />
                Preparing...
              </>
            ) : (
              <>
                <Download size={14} className="shrink-0" />
                Download Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer font-semibold transition-all ${
          isLightMode
            ? 'text-stone-600 hover:bg-stone-200/70 hover:text-stone-900'
            : 'text-slate-400 hover:bg-white/10 hover:text-slate-100'
        }`}
      >
        <Download size={20} className={isLightMode ? 'text-stone-500' : 'text-slate-500'} />
        <span>Export Data</span>
      </button>

      {isOpen && createPortal(modal, document.body)}
    </>
  );
}
