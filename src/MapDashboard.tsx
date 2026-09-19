import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import type { MapViewState } from '@deck.gl/core';
import { FlyToInterpolator } from '@deck.gl/core';
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Database, Sun, Moon, Search,
  Filter, Settings, HelpCircle, Calendar, ChevronDown, MapPinned
} from "lucide-react";

import ExportModal from './ExportModal';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8001';

const categoryColors: Record<string, string> = {
  potholes: '#dc2626',
  cracks: '#ea580c',
  garbage_dumps: '#9333ea',
};

// --- CUSTOM TEARDROP PIN ICONS ---
function createPinIcon(fillColor: string, iconSvg: string) {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
  <path d="M20 0C8.96 0 0 8.95 0 20c0 14.5 20 32 20 32s20-17.5 20-32C40 8.95 31.04 0 20 0z" fill="${fillColor}" stroke="white" stroke-width="2"/>
  <circle cx="20" cy="19" r="11" fill="white"/>
  <g transform="translate(20,19)">${iconSvg}</g>
</svg>`.trim();
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

const potholeIconInner = `<path d="M-5,-3 L-2,-6 L3,-5 L6,-1 L4,4 L-1,6 L-6,2 Z" fill="#dc2626"/>`;
const crackIconInner = `<path d="M-6,-6 L-2,-1 L-4,1 L0,5 L2,2 L6,6" stroke="#ea580c" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
const garbageIconInner = `<path d="M-5,-5 L5,-5 M-4,-5 L-4,-7 L4,-7 L4,-5 M-3,-5 L-3,6 L3,6 L3,-5" stroke="#9333ea" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

const POTHOLE_PIN = createPinIcon('#dc2626', potholeIconInner);
const CRACK_PIN = createPinIcon('#ea580c', crackIconInner);
const GARBAGE_PIN = createPinIcon('#9333ea', garbageIconInner);

const pinForType: Record<string, string> = {
  pothole: POTHOLE_PIN,
  crack: CRACK_PIN,
  garbage_dump: GARBAGE_PIN,
};

export default function MapDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ features: [] });
  const [isLightMode, setIsLightMode] = useState(true);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [viewState, setViewState] = useState<MapViewState>({ longitude: 73.845014, latitude: 18.525501, zoom: 14, pitch: 50, bearing: 0 });

const [activePanel, setActivePanel] = useState<'filters' | 'database' | 'settings' | null>('filters');  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(600);
  const [isDragging, setIsDragging] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [severity, setSeverity] = useState('High, Medium, Low');
  const [status, setStatus] = useState('Reported, In-Progress, Fixed');
  const [viewMode, setViewMode] = useState<'pins' | 'clusters' | 'heatmap'>('pins');

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedId, setHighlightedId] = useState<number | null>(null);
  const [filters, setFilters] = useState({ potholes: true, cracks: true, garbage_dumps: true });

  const fetchData = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/hazards/`);
      const json = await res.json();
      if (json && json.features) setData(json);
    } catch (err) {
      console.error("Backend is offline.");
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Horizontal drag-to-resize for the left-side dashboard panel
  useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 320 && newWidth < window.innerWidth - 100) setPanelWidth(newWidth);
  };
  const handleMouseUp = () => setIsDragging(false);
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
}, [isDragging]);

  const toggleFalsePositive = async (id: number) => {
    setData((prevData: any) => {
      const updatedFeatures = prevData.features.map((f: any) => {
        if (f.properties.id === id) {
          return { ...f, properties: { ...f.properties, is_false_positive: !f.properties.is_false_positive } };
        }
        return f;
      });
      return { ...prevData, features: updatedFeatures };
    });
    try {
      await fetch(`${API_BASE}/api/hazards/${id}/toggle_false_positive`, { method: 'PUT' });
    } catch (err) { fetchData(); }
  };

  // Smooth cinematic fly-to, matching Mapbox/Google-Maps-style flight
  const flyTo = (longitude: number, latitude: number, zoom = 15, pitch = viewState.pitch) => {
    setViewState(v => ({
      ...v,
      longitude,
      latitude,
      zoom,
      pitch,
      transitionDuration: 1800,
      transitionInterpolator: new FlyToInterpolator({ speed: 1.6 }),
    }));
  };

  const jumpTo = (lon: number, lat: number) => {
    setDashboardOpen(true);
    flyTo(lon, lat, 19, 60);
  };

  const handleMapClick = (id: number) => {
    setDashboardOpen(true);
    setPanelWidth(prev => prev < 400 ? 500 : prev);
    setHighlightedId(id);
    setTimeout(() => {
      const row = document.getElementById(`row-${id}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350);
    setTimeout(() => {
      setHighlightedId(null);
    }, 2800);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      const results = await res.json();
      if (results[0]) {
        flyTo(parseFloat(results[0].lon), parseFloat(results[0].lat), 15, 0);
      }
    } catch (err) {
      console.error('Geocoding failed', err);
    }
  };

  const zoomIn = () => setViewState(v => ({ ...v, zoom: Math.min((v.zoom ?? 14) + 1, 20), transitionDuration: 300, transitionInterpolator: new FlyToInterpolator() }));
  const zoomOut = () => setViewState(v => ({ ...v, zoom: Math.max((v.zoom ?? 14) - 1, 1), transitionDuration: 300, transitionInterpolator: new FlyToInterpolator() }));

  const safeFeatures = data.features || [];

  const filteredFeatures = safeFeatures.filter((f: any) => {
    if (f.properties?.is_false_positive) return false;
    const type = f.properties?.hazard_type;
    if (filters.potholes && type === 'pothole') return true;
    if (filters.cracks && type === 'crack') return true;
    if (filters.garbage_dumps && type === 'garbage_dump') return true;
    return false;
  });

  const pointFeatures = filteredFeatures.filter((f: any) => f.geometry?.type === 'Point');
  const otherFeatures = filteredFeatures.filter((f: any) => f.geometry?.type !== 'Point');

  const counts = {
    potholes: safeFeatures.filter((f: any) => f.properties?.hazard_type === 'pothole' && !f.properties?.is_false_positive).length,
    cracks: safeFeatures.filter((f: any) => f.properties?.hazard_type === 'crack' && !f.properties?.is_false_positive).length,
    garbage_dumps: safeFeatures.filter((f: any) => f.properties?.hazard_type === 'garbage_dump' && !f.properties?.is_false_positive).length,
  };

  const layers = [
    heatmapActive && filteredFeatures.length > 0 && new GeoJsonLayer({
      id: 'heatmap-baseline',
      data: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[73.0, 18.0], [74.5, 18.0], [74.5, 19.5], [73.0, 19.5], [73.0, 18.0]]] }, properties: {} }] },
      getFillColor: [0, 0, 139, 90], stroked: false,
    }),
    heatmapActive && new HeatmapLayer({
      id: 'heatmap-layer',
      data: filteredFeatures,
      getPosition: (f: any) => {
        const c = f.geometry?.coordinates;
        if (!c) return [0, 0];
        if (f.geometry.type === 'Point') return c;
        if (f.geometry.type === 'LineString') return c[0];
        if (f.geometry.type === 'Polygon') return c[0][0];
        return [0, 0];
      },
      radiusPixels: 130, intensity: 1.5, threshold: 0.05,
      colorRange: [[0, 0, 139], [0, 0, 255], [255, 255, 0], [255, 165, 0], [255, 0, 0]]
    }),
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: { type: 'FeatureCollection', features: otherFeatures },
      pickable: true, stroked: true, filled: true,
      onClick: (info) => {
        if (info.object && info.object.properties) {
          handleMapClick(info.object.properties.id);
        }
      },
      getFillColor: (d: any) => {
        if (d.properties.hazard_type === 'pothole') return [220, 38, 38];
        if (d.properties.hazard_type === 'crack') return [249, 115, 22];
        if (d.properties.hazard_type === 'garbage_dump') return [147, 51, 234];
        return [200, 200, 200];
      },
      getLineColor: isLightMode ? [255, 255, 255, 200] : [0, 0, 0, 200]
    }),
    !heatmapActive && new IconLayer({
      id: 'hazard-pins',
      data: pointFeatures,
      pickable: true,
      getPosition: (d: any) => d.geometry.coordinates,
      getIcon: (d: any) => ({
        url: pinForType[d.properties.hazard_type] || POTHOLE_PIN,
        width: 40,
        height: 52,
        anchorY: 52,
      }),
      getSize: 40,
      sizeUnits: 'pixels',
      onClick: (info) => {
        if (info.object && info.object.properties) {
          handleMapClick(info.object.properties.id);
        }
      },
    }),
  ].filter(Boolean);

  return (
    <div className="w-screen h-screen overflow-hidden flex relative bg-slate-900">

      {/* --- TOP RIGHT CONTROLS --- */}
      <div className="absolute top-4 right-4 z-10 flex gap-4 items-center">
        <button onClick={() => setIsLightMode(!isLightMode)} className={`relative w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none shadow-inner cursor-pointer ${isLightMode ? 'bg-sky-300' : 'bg-slate-700'}`}>
          <div className="absolute flex justify-between w-full px-2 left-0 pointer-events-none">
            <Moon size={14} className="text-slate-200" />
            <Sun size={14} className="text-amber-500" />
          </div>
          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center z-10 ${isLightMode ? 'translate-x-8' : 'translate-x-0'}`}>
            {isLightMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-slate-700" />}
          </div>
        </button>

        <button onClick={() => navigate('/')} className="font-heading px-4 h-10 rounded-full bg-rose-600/90 text-white shadow-md font-bold cursor-pointer hover:bg-rose-700 backdrop-blur-sm transition">
          Sign Out
        </button>
      </div>

      {/* --- LOGO + SEARCH (LEFT SIDE, TOP ROW) --- */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3">

        

        {/* Search pill */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-md transition-all border focus-within:ring-2 hover:scale-105 ${
          isLightMode
            ? 'bg-white text-stone-700 border-stone-200 focus-within:ring-amber-400'
            : 'bg-[#101a2e] text-slate-200 border-white/10 focus-within:ring-amber-500'
        }`}>
          <Search size={16} className={`shrink-0 cursor-pointer ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`} onClick={() => handleSearch(searchQuery)} />
          <input
            type="text"
            placeholder="Search location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(searchQuery); }}
            className={`bg-transparent border-none outline-none text-sm font-semibold w-40 sm:w-56 ${
              isLightMode ? 'text-stone-800 placeholder-stone-400' : 'text-slate-100 placeholder-slate-500'
            }`}
          />
        </div>
      </div>

      {/* --- SIDEBAR: ICON RAIL + EXPANDABLE PANEL --- */}
      <div className="absolute top-[76px] left-4 h-[calc(100vh-92px)] z-10 flex gap-3">

        {/* Icon Rail */}
        <div className={`w-14 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border flex flex-col items-center py-4 gap-2 transition-colors ${
          isLightMode ? 'bg-stone-50/90 border-stone-200/60' : 'bg-[#0b1120]/95 border-white/10'
        }`}>
          <button
  onClick={() => setDashboardOpen(true)}
  className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
    dashboardOpen
      ? (isLightMode ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400 glow-amber')
      : (isLightMode ? 'text-stone-500 hover:bg-stone-200/70' : 'text-slate-400 hover:bg-white/10')
  }`}
>
  <LayoutDashboard size={20} />
</button>
          <button
            onClick={() => setActivePanel(activePanel === 'filters' ? null : 'filters')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePanel === 'filters'
                ? (isLightMode ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400 glow-amber')
                : (isLightMode ? 'text-stone-500 hover:bg-stone-200/70' : 'text-slate-400 hover:bg-white/10')
            }`}
          >
            <Filter size={20} />
          </button>
          <button
            onClick={() => window.open('/database.html', '_blank')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
              isLightMode ? 'text-stone-500 hover:bg-stone-200/70' : 'text-slate-400 hover:bg-white/10'
            }`}
          >
            <Database size={20} />
          </button>

          <div className="flex-1" />

          <button
            onClick={() => setActivePanel(activePanel === 'settings' ? null : 'settings')}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
              activePanel === 'settings'
                ? (isLightMode ? 'bg-amber-100 text-amber-600' : 'bg-amber-500/20 text-amber-400 glow-amber')
                : (isLightMode ? 'text-stone-500 hover:bg-stone-200/70' : 'text-slate-400 hover:bg-white/10')
            }`}
          >
            <Settings size={20} />
          </button>
          <button className={`w-10 h-10 flex items-center justify-center rounded-xl transition-colors cursor-pointer ${
            isLightMode ? 'text-stone-500 hover:bg-stone-200/70' : 'text-slate-400 hover:bg-white/10'
          }`}>
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Expandable Panel */}
        {activePanel && (
          <div className={`w-72 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border overflow-y-auto transition-colors ${
            isLightMode ? 'bg-stone-50/90 border-stone-200/60 custom-scrollbar' : 'bg-[#0b1120]/95 border-white/10 custom-scrollbar-dark'
          }`}>

           

            {activePanel === 'filters' && (
              <div className="p-4 flex flex-col gap-5">

                <div>
                  <h3 className={`font-heading font-bold mb-3 text-sm ${isLightMode ? 'text-stone-800' : 'text-slate-100'}`}>Map Filters</h3>
                  <div className="flex flex-col gap-2.5">
                    {(Object.keys(filters) as Array<keyof typeof filters>).map(key => (
                      <label key={key} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={filters[key]}
                            onChange={() => setFilters({ ...filters, [key]: !filters[key] })}
                            className="hidden"
                          />
                          <div
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: filters[key] ? categoryColors[key] : (isLightMode ? '#d6d3d1' : '#475569') }}
                          />
                          <span className={`text-sm font-medium capitalize ${
                            filters[key]
                              ? (isLightMode ? 'text-stone-800' : 'text-slate-100')
                              : (isLightMode ? 'text-stone-400' : 'text-slate-500')
                          }`}>
                            {key.replace('_', ' ')}
                          </span>
                        </div>
                        <span className={`text-xs font-mono ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`}>
                          {counts[key].toLocaleString()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={`h-px ${isLightMode ? 'bg-stone-200' : 'bg-white/10'}`} />

                <div>
                  <h3 className={`font-heading font-bold mb-3 text-sm ${isLightMode ? 'text-stone-800' : 'text-slate-100'}`}>Advanced Filters</h3>

                  <div className="mb-3">
  <label className={`text-xs font-semibold mb-1.5 block ${isLightMode ? 'text-stone-500' : 'text-slate-400'}`}>Date Range</label>
  <div className="flex items-center gap-2">
    <input
      type="date"
      value={startDate}
      onChange={(e) => setStartDate(e.target.value)}
      className={`w-full px-2.5 py-2 text-xs rounded-lg border cursor-pointer ${
        isLightMode ? 'border-stone-200 bg-white text-stone-700' : 'border-white/10 bg-[#101a2e] text-slate-200'
      }`}
    />
    <span className={isLightMode ? 'text-stone-400' : 'text-slate-500'}>–</span>
    <input
      type="date"
      value={endDate}
      onChange={(e) => setEndDate(e.target.value)}
      min={startDate || undefined}
      className={`w-full px-2.5 py-2 text-xs rounded-lg border cursor-pointer ${
        isLightMode ? 'border-stone-200 bg-white text-stone-700' : 'border-white/10 bg-[#101a2e] text-slate-200'
      }`}
    />
  </div>
</div>

                  <div className="mb-3">
                    <label className={`text-xs font-semibold mb-1.5 block ${isLightMode ? 'text-stone-500' : 'text-slate-400'}`}>Severity</label>
                    <div className="relative">
                      <select
                        value={severity}
                        onChange={(e) => setSeverity(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border appearance-none cursor-pointer ${
                          isLightMode ? 'border-stone-200 bg-white text-stone-700' : 'border-white/10 bg-[#101a2e] text-slate-200'
                        }`}
                      >
                        <option>High, Medium, Low</option>
                        <option>High</option>
                        <option>Medium</option>
                        <option>Low</option>
                      </select>
                      <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`} />
                    </div>
                  </div>

                  <div>
                    <label className={`text-xs font-semibold mb-1.5 block ${isLightMode ? 'text-stone-500' : 'text-slate-400'}`}>Status</label>
                    <div className="relative">
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className={`w-full px-3 py-2 text-sm rounded-lg border appearance-none cursor-pointer ${
                          isLightMode ? 'border-stone-200 bg-white text-stone-700' : 'border-white/10 bg-[#101a2e] text-slate-200'
                        }`}
                      >
                        <option>Reported, In-Progress, Fixed</option>
                        <option>Reported</option>
                        <option>In-Progress</option>
                        <option>Fixed</option>
                      </select>
                      <ChevronDown size={16} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`} />
                    </div>
                  </div>
                </div>

                <div className={`h-px ${isLightMode ? 'bg-stone-200' : 'bg-white/10'}`} />

                <div>
                  <h3 className={`font-heading font-bold mb-3 text-sm ${isLightMode ? 'text-stone-800' : 'text-slate-100'}`}>Map View Mode</h3>
                  <div className={`flex rounded-lg border overflow-hidden ${isLightMode ? 'border-stone-200' : 'border-white/10'}`}>
                    {(['pins', 'clusters', 'heatmap'] as const).map(mode => (
                      <button
                        key={mode}
                        onClick={() => {
                          setViewMode(mode);
                          setHeatmapActive(mode === 'heatmap');
                        }}
                        className={`flex-1 py-2 text-xs font-semibold capitalize transition-all cursor-pointer ${
                          viewMode === mode
                            ? (isLightMode ? 'bg-amber-500 text-white' : 'bg-amber-500 text-white glow-amber')
                            : (isLightMode ? 'bg-white text-stone-600 hover:bg-stone-100' : 'bg-[#101a2e] text-slate-300 hover:bg-[#16223a]')
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {viewMode === 'heatmap' && (
                    <div className="mt-3">
                      <div className="h-2 rounded-full" style={{ background: 'linear-gradient(to right, #0000ff, #00ffff, #ffff00, #ffa500, #ff0000)' }} />
                      <div className={`flex justify-between text-xs mt-1 ${isLightMode ? 'text-stone-400' : 'text-slate-500'}`}>
                        <span>low</span>
                        <span>high</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                <ExportModal data={safeFeatures} isLightMode={isLightMode} />                </div>
              </div>
            )}

            {activePanel === 'settings' && (
              <div className="p-4">
                <h3 className={`font-heading font-bold mb-3 text-sm ${isLightMode ? 'text-stone-800' : 'text-slate-100'}`}>Settings</h3>
                <p className={`text-sm ${isLightMode ? 'text-stone-500' : 'text-slate-400'}`}>Add app settings here.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- ZOOM CONTROLS --- */}
      <div
  style={{ right: dashboardOpen ? `${panelWidth + 16}px` : '16px' }}
  className={`absolute bottom-6 z-10 flex flex-col rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)] border transition-[right] duration-300 ease-out ${
    isLightMode ? 'bg-white border-stone-200/60' : 'bg-[#0b1120] border-white/10'
  }`}
>
        <button onClick={zoomIn} className={`w-9 h-9 flex items-center justify-center text-lg font-bold cursor-pointer border-b ${
          isLightMode ? 'text-stone-700 hover:bg-stone-100 border-stone-200/60' : 'text-slate-200 hover:bg-white/10 border-white/10'
        }`}>
          +
        </button>
        <button onClick={zoomOut} className={`w-9 h-9 flex items-center justify-center text-lg font-bold cursor-pointer ${
          isLightMode ? 'text-stone-700 hover:bg-stone-100' : 'text-slate-200 hover:bg-white/10'
        }`}>
          −
        </button>
      </div>

      {/* --- VALIDATION DASHBOARD: SLIDES IN FROM RIGHT --- */}
<div
  style={{ width: dashboardOpen ? `${panelWidth}px` : '0px' }}
  className={`absolute top-0 right-0 h-full z-40 flex transition-[width] duration-300 ease-out overflow-hidden ${
    isLightMode
      ? 'bg-white/80 backdrop-blur-xl text-slate-900 border-l border-white/50 shadow-[-8px_0_24px_rgba(0,0,0,0.15)]'
      : 'bg-[#0b1120]/90 backdrop-blur-xl text-white border-l border-white/10 shadow-[-8px_0_24px_rgba(0,0,0,0.5)]'
  }`}
>
  {/* Resize handle — now on the LEFT edge since panel opens from the right */}
  <div
    onMouseDown={() => setIsDragging(true)}
    className={`w-2.5 cursor-ew-resize h-full hover:bg-amber-400/30 transition-colors shrink-0 ${isLightMode ? 'bg-black/5' : 'bg-white/5'}`}
  />

  <div className="flex flex-col flex-1 min-w-[320px]">
    <div className={`p-3 px-5 flex justify-between items-center font-heading font-bold border-b ${isLightMode ? 'border-black/10' : 'border-white/10'}`}>
      <span>Validation Dashboard</span>
      <button onClick={() => setDashboardOpen(false)} className="text-red-500 hover:text-red-600 font-bold cursor-pointer text-lg transition-colors">✖</button>
    </div>

    <div className={`flex-1 overflow-auto p-4 relative ${isLightMode ? 'custom-scrollbar' : 'custom-scrollbar-dark'}`}>
      {safeFeatures.length === 0 ? (
        <p className="font-medium">No records found.</p>
      ) : (
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr>
              {['Sr.No', 'Type', 'Area', 'Date/Time', 'Coordinates', 'Severity', 'Validation', 'Action'].map((heading, idx) => (
                <th key={idx} className={`font-heading sticky top-0 p-2.5 border-b z-10 font-semibold ${isLightMode ? 'border-black/10 bg-slate-100/90 backdrop-blur' : 'border-white/10 bg-slate-800/90 backdrop-blur'}`}>{heading}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeFeatures.map((f: any, i: number) => {
              const p = f.properties;
              let lon = 0, lat = 0;
              if (f.geometry && f.geometry.coordinates) {
                const c = f.geometry.coordinates;
                if (f.geometry.type === 'Point') { lon = c[0]; lat = c[1]; }
                else if (f.geometry.type === 'LineString') { lon = c[0][0]; lat = c[0][1]; }
                else if (f.geometry.type === 'Polygon') { lon = c[0][0][0]; lat = c[0][0][1]; }
              }

              const trBorder = isLightMode ? 'border-black/10' : 'border-white/10';

              return (
                <tr
                  key={p.id}
                  id={`row-${p.id}`}
                  className={`hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${highlightedId === p.id ? 'animate-twinkle' : ''}`}
                >
                  <td className={`p-2.5 border-b ${trBorder}`}>{i + 1}</td>
                  <td className={`p-2.5 border-b font-semibold ${trBorder}`}>
                    <span style={{ color: p.hazard_type === 'pothole' ? '#dc2626' : p.hazard_type === 'crack' ? '#ea580c' : '#9333ea' }}>
                      {p.hazard_type?.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className={`p-2.5 border-b ${trBorder}`}>{p.area}</td>
                  <td className={`p-2.5 border-b ${trBorder}`}>{p.reported_at}</td>
                  <td className={`p-2.5 border-b font-mono text-xs ${trBorder}`}>{lat.toFixed(5)}, {lon.toFixed(5)}</td>
                  <td className={`p-2.5 border-b ${trBorder}`}>{p.severity}</td>
                  <td className={`p-2.5 border-b ${trBorder}`}>
                    <button
                      onClick={() => toggleFalsePositive(p.id)}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${p.is_false_positive ? 'bg-red-500 text-white shadow-md' : 'bg-gray-400 text-white hover:bg-gray-500'}`}
                    >
                      {p.is_false_positive ? 'False Positive' : 'Valid'}
                    </button>
                  </td>
                  <td className={`p-2.5 border-b ${trBorder}`}>
                    <button onClick={() => jumpTo(lon, lat)} className="bg-blue-600/90 text-white px-3 py-1 rounded text-xs cursor-pointer hover:bg-blue-700 backdrop-blur-sm transition shadow-sm">
                      Jump 📍
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  </div>
</div>

      <div className="flex-1 relative z-0 [&_canvas]:cursor-pointer">
        <DeckGL viewState={viewState} onViewStateChange={({ viewState }) => setViewState(viewState as MapViewState)} controller={true} layers={layers}>
          <Map mapStyle={isLightMode ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'} />
        </DeckGL>
      </div>

    </div>
  );
}