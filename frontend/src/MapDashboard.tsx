import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';

export default function MapDashboard() {
  const navigate = useNavigate();
  
  // State Management
  const [data, setData] = useState({ features: [] });
  const [isLightMode, setIsLightMode] = useState(true);
  const [viewState, setViewState] = useState({ longitude: 73.8567, latitude: 18.5204, zoom: 14, pitch: 50, bearing: 0 });
  
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true); 
  const [activePanel, setActivePanel] = useState<'dashboard' | 'logs' | ''>('');
  const [panelHeight, setPanelHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Filters State
  const [filters, setFilters] = useState({ potholes: true, lines: true, polygons: true, heatmap: true });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/hazards/');
        setData(await res.json());
      } catch (err) { console.error("Waiting for backend..."); }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Panel Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight - 50) {
        setPanelHeight(newHeight);
      }
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

  const openPanel = (type: 'dashboard' | 'logs') => {
    setSidebarOpen(false);
    setFiltersOpen(false);
    setActivePanel(type);
    setPanelHeight(window.innerHeight * 0.4); 
  };

  const jumpTo = (lon: number, lat: number) => {
    setViewState({ ...viewState, longitude: lon, latitude: lat, zoom: 19, pitch: 60, transitionDuration: 1500 as any });
  };

  const getStatusColor = (status: string) => {
    if (status === 'Approved') return '#4caf50';
    if (status === 'Rejected') return '#f44336';
    if (status === 'Waitlist') return '#d4a017';
    return isLightMode ? '#333' : '#fff'; 
  };

  // Filter Features for Map
  const filteredFeatures = data.features.filter((f: any) => {
    if (filters.potholes && f.geometry.type === 'Point') return true;
    if (filters.lines && f.geometry.type === 'LineString') return true;
    if (filters.polygons && f.geometry.type === 'Polygon') return true;
    return false;
  });

  const layers = [
    filters.heatmap && new HeatmapLayer({
      id: 'heatmap-layer',
      data: data.features.filter((f: any) => f.geometry.type === 'Point').map((f: any) => f.geometry.coordinates),
      getPosition: (d: any) => d,
      radiusPixels: 130, 
      intensity: 1.5,
      threshold: 0.05,
      colorRange: [
        [0, 0, 139], 
        [0, 0, 255], 
        [255, 255, 0], 
        [255, 165, 0], 
        [255, 0, 0] 
      ]
    }),

    new GeoJsonLayer({
      id: 'geojson-layer',
      data: { type: 'FeatureCollection', features: filteredFeatures },
      pickable: true, stroked: true, filled: true,
      getPointRadius: 2, pointRadiusMinPixels: 4, lineWidthScale: 1, lineWidthMinPixels: 2,
      
      getFillColor: (d: any) => {
        if (d.geometry.type === 'Point') return [210, 180, 140]; 
        if (d.geometry.type === 'Polygon') return [189, 154, 122, 150]; 
        return [210, 180, 140, 150];
      },
      
      getLineColor: (d: any) => {
        if (d.geometry.type === 'LineString') return [139, 115, 85]; 
        if (d.geometry.type === 'Polygon') return [139, 69, 19]; 
        return isLightMode ? [0, 0, 0, 200] : [255, 255, 255, 200];
      }
    })
  ].filter(Boolean);

  const panelData = data.features.filter((f: any) => {
    const s = f.properties.status;
    if (activePanel === 'dashboard') return s === 'Under Review' || s === 'Waitlist';
    if (activePanel === 'logs') return s === 'Approved' || s === 'Rejected';
    return false;
  });

  // --- NEW GLASSMORPHISM CLASSES ---
  // Sidebar uses right borders, bottom panel uses top borders. 
  // Opacity shifts based on light/dark mode so the map is always visible underneath!
  const glassSidebar = isLightMode 
    ? 'bg-white/40 backdrop-blur-xl text-slate-900 border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.1)]' 
    : 'bg-black/40 backdrop-blur-xl text-white border-r border-white/10 shadow-[4px_0_24px_rgba(0,0,0,0.5)]';
    
  const glassPanel = isLightMode
    ? 'bg-white/50 backdrop-blur-xl text-slate-900 border-t border-white/50 shadow-[0_-4px_24px_rgba(0,0,0,0.1)]'
    : 'bg-black/60 backdrop-blur-xl text-white border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]';

  const borderClass = isLightMode ? 'border-white/50' : 'border-white/10';
  const hoverClass = isLightMode ? 'hover:bg-white/40' : 'hover:bg-white/10';

  return (
    <div className="w-screen h-screen overflow-hidden flex relative bg-slate-900">
      
      {/* Top Right Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={() => setIsLightMode(!isLightMode)} className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-xl transition hover:scale-105 cursor-pointer backdrop-blur-md ${isLightMode ? 'bg-white/70 text-black border border-white/50' : 'bg-black/50 text-white border border-white/20'}`}>
          {isLightMode ? '🌙' : '☀️'}
        </button>
        <button onClick={() => navigate('/')} className="px-4 h-11 rounded bg-rose-600/90 backdrop-blur-sm text-white shadow-lg font-bold cursor-pointer hover:bg-rose-700 transition">
          Sign Out
        </button>
      </div>

      {/* GLASS SIDEBAR */}
      <div className={`absolute top-0 left-0 h-full z-10 transition-all duration-300 flex flex-col ${glassSidebar} ${sidebarOpen ? 'w-64' : 'w-[50px]'}`}>
        <div className={`p-4 cursor-pointer text-center text-xl border-b ${borderClass} ${hoverClass} transition-colors`} onClick={() => { setSidebarOpen(!sidebarOpen); setFiltersOpen(false); }}>
          ☰
        </div>
        
        <div className={`flex flex-col ${!sidebarOpen && 'hidden'}`}>
          <div className={`p-4 cursor-pointer font-bold border-b ${borderClass} ${hoverClass} transition-colors`} onClick={() => openPanel('dashboard')}>
            Dashboard
          </div>
          
          <div className={`p-4 cursor-pointer font-bold border-b ${borderClass} ${hoverClass} transition-colors`} onClick={() => setFiltersOpen(!filtersOpen)}>
            Filters
          </div>
          {filtersOpen && (
            <div className={`p-4 border-b text-sm flex flex-col gap-3 bg-black/5 dark:bg-white/5 ${borderClass}`}>
              {Object.keys(filters).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer font-medium">
                  <input 
                    type="checkbox" 
                    checked={filters[key as keyof typeof filters]} 
                    onChange={() => setFilters({...filters, [key]: !filters[key as keyof typeof filters]})}
                    className="rounded border-gray-400 bg-transparent text-blue-500 focus:ring-blue-500" 
                  />
                  <span className="capitalize">{key === 'lines' ? 'Broken Dividers' : key === 'polygons' ? 'Large Damages' : key}</span>
                </label>
              ))}
            </div>
          )}
          
          <div className={`p-4 cursor-pointer font-bold border-b ${borderClass} ${hoverClass} transition-colors`} onClick={() => window.open('/database.html', '_blank')}>
            Database
          </div>
          <div className={`p-4 cursor-pointer font-bold border-b ${borderClass} ${hoverClass} transition-colors`} onClick={() => openPanel('logs')}>
            Logs
          </div>
        </div>
      </div>

      {/* GLASS BOTTOM PANEL */}
      <div style={{ height: activePanel ? `${panelHeight}px` : '0px' }} className={`absolute bottom-0 left-0 w-full z-20 flex flex-col transition-[height] duration-300 ${glassPanel}`}>
        <div onMouseDown={() => setIsDragging(true)} className={`h-2.5 cursor-ns-resize w-full hover:bg-white/20 transition-colors ${isLightMode ? 'bg-black/10' : 'bg-white/10'}`} />
        
        <div className={`p-2.5 px-5 flex justify-between font-bold border-b ${borderClass} bg-black/5`}>
          <span>{activePanel === 'dashboard' ? 'Dashboard Overview (Active)' : 'System Logs (Resolved)'}</span>
          <button onClick={() => setActivePanel('')} className="text-red-500 hover:text-red-600 font-bold cursor-pointer transition-colors">✖</button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {panelData.length === 0 ? (
            <p className="font-medium">No records found for this view.</p>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  {['Sr.No', 'Type', 'Area', 'Date/Time', 'Status', 'Confidence', 'Severity', 'Location'].map((heading, idx) => (
                    <th key={idx} className={`p-2.5 border-b font-semibold bg-black/5 ${borderClass}`}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={activePanel === 'logs' ? 'font-mono text-[13px]' : ''}>
                {panelData.map((f: any, i: number) => {
                  const p = f.properties;
                  const coords = f.geometry.type === 'Point' ? f.geometry.coordinates : f.geometry.coordinates[0][0];
                  return (
                    <tr key={i} className={`hover:bg-white/10 transition-colors`}>
                      <td className={`p-2.5 border-b ${borderClass}`}>{i + 1}</td>
                      <td className={`p-2.5 border-b ${borderClass}`}>{p.hazard_type.replace('_', ' ').toUpperCase()}</td>
                      <td className={`p-2.5 border-b ${borderClass}`}>{p.area}</td>
                      <td className={`p-2.5 border-b ${borderClass}`}>{p.reported_at}</td>
                      <td className={`p-2.5 border-b font-bold ${borderClass}`} style={{ color: getStatusColor(p.status) }}>{p.status}</td>
                      <td className={`p-2.5 border-b ${borderClass}`}>{(p.confidence * 100).toFixed(1)}%</td>
                      <td className={`p-2.5 border-b ${borderClass}`}>{p.severity}</td>
                      <td className={`p-2.5 border-b ${borderClass}`}>
                        <button onClick={() => jumpTo(coords[0], coords[1])} className="bg-blue-600/90 text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-700 backdrop-blur-sm transition">
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

      {/* MAP LAYER */}
      <div className="flex-1 relative z-0">
        <DeckGL 
          viewState={viewState} 
          onViewStateChange={({ viewState }) => setViewState(viewState)}
          controller={true} 
          layers={layers}
        >
          <Map mapStyle={isLightMode ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'} />
        </DeckGL>
      </div>

    </div>
  );
}