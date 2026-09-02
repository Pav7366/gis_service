import { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import type { MapViewState } from '@deck.gl/core';
import { GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8001';

export default function MapDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ features: [] });
  const [isLightMode, setIsLightMode] = useState(true);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [viewState, setViewState] = useState<MapViewState>({ longitude: 73.845014, latitude: 18.525501, zoom: 14, pitch: 50, bearing: 0 });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight - 50) setPanelHeight(newHeight);
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

  const jumpTo = (lon: number, lat: number) => {
    setViewState({ ...viewState, longitude: lon, latitude: lat, zoom: 19, pitch: 60, transitionDuration: 1500 });
  };

  const handleMapClick = (id: number) => {
    setDashboardOpen(true);
    setPanelHeight(prev => prev < 300 ? 300 : prev);
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

  const safeFeatures = data.features || [];

  const filteredFeatures = safeFeatures.filter((f: any) => {
    if (f.properties?.is_false_positive) return false;
    const type = f.properties?.hazard_type;
    if (filters.potholes && type === 'pothole') return true;
    if (filters.cracks && type === 'crack') return true;
    if (filters.garbage_dumps && type === 'garbage_dump') return true;
    return false;
  });

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
      data: { type: 'FeatureCollection', features: filteredFeatures },
      pickable: true, stroked: true, filled: true,
      onClick: (info) => {
        if (info.object && info.object.properties) {
          handleMapClick(info.object.properties.id);
        }
      },
      getPointRadius: (d: any) => {
        if (d.properties.hazard_type === 'garbage_dump') return 6; 
        if (d.properties.hazard_type === 'pothole') return 4;      
        return 3; 
      },
      pointRadiusMinPixels: 3,
      getFillColor: (d: any) => {
        if (d.properties.hazard_type === 'pothole') return [220, 38, 38]; 
        if (d.properties.hazard_type === 'crack') return [249, 115, 22]; 
        if (d.properties.hazard_type === 'garbage_dump') return [147, 51, 234]; 
        return [200, 200, 200];
      },
      getLineColor: isLightMode ? [255, 255, 255, 200] : [0, 0, 0, 200]
    })
  ].filter(Boolean);

  // --- REFINED TRUE GLASSMORPHISM ---
  const glassSidebar = isLightMode 
    ? 'bg-white/20 backdrop-blur-xl border-r border-white/40 text-slate-800 shadow-xl' 
    : 'bg-black/30 backdrop-blur-xl border-r border-white/10 text-white shadow-xl';
    
  const glassPanel = isLightMode
    ? 'bg-white/50 backdrop-blur-xl text-slate-900 border-t border-white/50 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]'
    : 'bg-black/60 backdrop-blur-xl text-white border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]';

  const sidebarBorder = isLightMode ? 'border-white/40' : 'border-white/10';
  const sidebarHover = isLightMode ? 'hover:bg-white/30' : 'hover:bg-white/10';

  return (
    <div className="w-screen h-screen overflow-hidden flex relative bg-slate-900">
      
      <div className="absolute top-4 right-4 z-10 flex gap-4 items-center">
        <button onClick={() => setHeatmapActive(!heatmapActive)} className={`uiverse ${heatmapActive ? 'active-heatmap' : ''}`}>
          <div className="wrapper"><span>🔥 Heatmap</span></div>
        </button>

        <button onClick={() => setIsLightMode(!isLightMode)} className={`relative w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none shadow-inner cursor-pointer ${isLightMode ? 'bg-sky-300' : 'bg-slate-700'}`}>
          <div className="absolute flex justify-between w-full px-2 left-0 pointer-events-none">
            <Moon size={14} className="text-slate-200" />
            <Sun size={14} className="text-amber-500" />
          </div>
          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center z-10 ${isLightMode ? 'translate-x-8' : 'translate-x-0'}`}>
            {isLightMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-slate-700" />}
          </div>
        </button>

        <button onClick={() => navigate('/')} className="px-4 h-10 rounded-full bg-rose-600/90 text-white shadow-md font-bold cursor-pointer hover:bg-rose-700 backdrop-blur-sm transition">
          Sign Out
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <div className={`absolute top-0 left-0 h-full z-10 transition-all duration-300 flex flex-col ${glassSidebar} ${sidebarOpen ? 'w-64' : 'w-[50px]'}`}>
        <div className={`p-4 cursor-pointer text-center text-xl font-bold border-b ${sidebarBorder} ${sidebarHover} transition-colors`} onClick={() => { setSidebarOpen(!sidebarOpen); setFiltersOpen(false); }}>
          ☰
        </div>
        
        <div className={`flex flex-col ${!sidebarOpen && 'hidden'}`}>
          <div className={`p-4 cursor-pointer font-bold border-b ${sidebarBorder} ${sidebarHover} transition-colors`} onClick={() => setDashboardOpen(true)}>
            Dashboard Overview
          </div>
          
          <div className={`p-4 cursor-pointer font-bold border-b ${sidebarBorder} ${sidebarHover} transition-colors`} onClick={() => setFiltersOpen(!filtersOpen)}>
            Map Filters
          </div>
          {filtersOpen && (
            <div className={`p-4 border-b text-sm flex flex-col gap-3 shadow-inner transition-colors duration-200 ${isLightMode ? 'bg-white/20 border-white/40' : 'bg-black/20 border-white/10'}`}>
              {Object.keys(filters).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer font-medium">
                  <input 
                    type="checkbox" 
                    checked={filters[key as keyof typeof filters]} 
                    onChange={() => setFilters({...filters, [key]: !filters[key as keyof typeof filters]})}
                    className="rounded border-gray-400 bg-transparent text-blue-500 focus:ring-blue-500 cursor-pointer" 
                  />
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}
          
          <div className={`p-4 cursor-pointer font-bold border-b ${sidebarBorder} ${sidebarHover} transition-colors`} onClick={() => window.open('/database.html', '_blank')}>
            Database
          </div>
        </div>
      </div>

      {/* --- BOTTOM DASHBOARD --- */}
      <div style={{ height: dashboardOpen ? `${panelHeight}px` : '0px' }} className={`absolute bottom-0 left-0 w-full z-20 flex flex-col transition-[height] duration-300 ${glassPanel}`}>
        <div onMouseDown={() => setIsDragging(true)} className={`h-2.5 cursor-ns-resize w-full hover:bg-white/20 transition-colors ${isLightMode ? 'bg-black/10' : 'bg-white/10'}`} />
        
        <div className={`p-2.5 px-5 flex justify-between font-bold border-b bg-black/5 ${isLightMode ? 'border-white/50' : 'border-white/10'}`}>
          <span>Validation Dashboard</span>
          <button onClick={() => setDashboardOpen(false)} className="text-red-500 hover:text-red-600 font-bold cursor-pointer text-lg transition-colors">✖</button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 relative">
          {safeFeatures.length === 0 ? (
            <p className="font-medium">No records found.</p>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  {['Sr.No', 'Type', 'Area', 'Date/Time', 'Coordinates', 'Severity', 'Validation', 'Action'].map((heading, idx) => (
                    <th key={idx} className={`sticky top-0 p-2.5 border-b z-10 font-semibold bg-black/5 ${isLightMode ? 'border-white/50 bg-slate-100/90 backdrop-blur' : 'border-white/10 bg-slate-800/90 backdrop-blur'}`}>{heading}</th>
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

                  const trBorder = isLightMode ? 'border-white/40' : 'border-white/10';

                  return (
                    <tr 
                      key={p.id} 
                      id={`row-${p.id}`}
                      className={`hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${highlightedId === p.id ? 'animate-twinkle' : ''}`}
                    >
                      <td className={`p-2.5 border-b ${trBorder}`}>{i + 1}</td>
                      <td className={`p-2.5 border-b font-semibold ${trBorder}`}>
                        <span style={{color: p.hazard_type === 'pothole' ? '#dc2626' : p.hazard_type === 'crack' ? '#ea580c' : '#9333ea'}}>
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

      <div className="flex-1 relative z-0 [&_canvas]:cursor-pointer">
        <DeckGL viewState={viewState} onViewStateChange={({ viewState }) => setViewState(viewState as MapViewState)} controller={true} layers={layers}>
          <Map mapStyle={isLightMode ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'} />
        </DeckGL>
      </div>

    </div>
  );
}