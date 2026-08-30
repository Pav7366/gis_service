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
  const [filtersOpen, setFiltersOpen] = useState(true); // Default open to see the options
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
    // 1. BASELINE DARK BLUE LAYER: Covers the whole city when Heatmap is ON
    filters.heatmap && new GeoJsonLayer({
      id: 'heatmap-baseline',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            // A massive box covering all of Pune and surrounding areas
            coordinates: [[[73.0, 18.0], [74.5, 18.0], [74.5, 19.5], [73.0, 19.5], [73.0, 18.0]]]
          },
          properties: {}
        }]
      },
      getFillColor: [0, 0, 139, 90], // Translucent Dark Blue so you can still see the roads underneath
      stroked: false,
    }),

    // 2. THE CONTINUOUS HEATMAP LAYER
    filters.heatmap && new HeatmapLayer({
      id: 'heatmap-layer',
      data: data.features.filter((f: any) => f.geometry.type === 'Point').map((f: any) => f.geometry.coordinates),
      getPosition: (d: any) => d,
      radiusPixels: 130, // Increased massively to blend the scattered points into a continuous zone
      intensity: 1.5,
      threshold: 0.05,
      colorRange: [
        [0, 0, 139],   // Dark Blue
        [0, 0, 255],   // Blue
        [255, 255, 0], // Yellow
        [255, 165, 0], // Orange
        [255, 0, 0]    // Red
      ]
    }),

    // 3. THE SHARP POINTS & LINES LAYER
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: { type: 'FeatureCollection', features: filteredFeatures },
      pickable: true, stroked: true, filled: true,
      getPointRadius: 2, pointRadiusMinPixels: 4, lineWidthScale: 1, lineWidthMinPixels: 2,
      getFillColor: (d: any) => d.geometry.type === 'Point' ? [211, 47, 47] : [25, 118, 210, 150],
      getLineColor: (d: any) => d.geometry.type === 'LineString' ? [245, 124, 0] : (isLightMode ? [0,0,0,200] : [255,255,255,200])
    })
  ].filter(Boolean);

  const panelData = data.features.filter((f: any) => {
    const s = f.properties.status;
    if (activePanel === 'dashboard') return s === 'Under Review' || s === 'Waitlist';
    if (activePanel === 'logs') return s === 'Approved' || s === 'Rejected';
    return false;
  });

  const themeClasses = isLightMode ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#1e1e1e] text-white border-neutral-700';

  return (
    <div className="w-screen h-screen overflow-hidden flex relative">
      
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button onClick={() => setIsLightMode(!isLightMode)} className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center text-xl transition hover:scale-105 cursor-pointer ${isLightMode ? 'bg-white text-black' : 'bg-[#2d2d2d] text-white'}`}>
          {isLightMode ? '🌙' : '☀️'}
        </button>
        <button onClick={() => navigate('/')} className="px-4 h-11 rounded bg-rose-600 text-white shadow-lg font-bold cursor-pointer hover:bg-rose-700">
          Sign Out
        </button>
      </div>

      <div className={`absolute top-0 left-0 h-full z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)] transition-all duration-300 flex flex-col ${themeClasses} ${sidebarOpen ? 'w-64' : 'w-[50px]'}`}>
        <div className={`p-4 cursor-pointer text-center text-xl ${isLightMode ? 'bg-slate-100' : 'bg-[#2d2d2d]'}`} onClick={() => { setSidebarOpen(!sidebarOpen); setFiltersOpen(false); }}>
          ☰
        </div>
        
        <div className={`flex flex-col ${!sidebarOpen && 'hidden'}`}>
          <div className={`p-4 cursor-pointer font-bold border-b ${themeClasses} hover:opacity-70`} onClick={() => openPanel('dashboard')}>
            Dashboard
          </div>
          
          <div className={`p-4 cursor-pointer font-bold border-b ${themeClasses} hover:opacity-70`} onClick={() => setFiltersOpen(!filtersOpen)}>
            Filters
          </div>
          {filtersOpen && (
            <div className={`p-4 border-b text-sm flex flex-col gap-3 ${isLightMode ? 'bg-slate-50' : 'bg-[#252525]'}`}>
              {Object.keys(filters).map(key => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={filters[key as keyof typeof filters]} onChange={() => setFilters({...filters, [key]: !filters[key as keyof typeof filters]})} />
                  <span className="capitalize">{key === 'lines' ? 'Broken Dividers' : key === 'polygons' ? 'Large Damages' : key}</span>
                </label>
              ))}
            </div>
          )}
          
          <div className={`p-4 cursor-pointer font-bold border-b ${themeClasses} hover:opacity-70`} onClick={() => window.open('/database.html', '_blank')}>
            Database
          </div>
          <div className={`p-4 cursor-pointer font-bold border-b ${themeClasses} hover:opacity-70`} onClick={() => openPanel('logs')}>
            Logs
          </div>
        </div>
      </div>

      <div style={{ height: activePanel ? `${panelHeight}px` : '0px' }} className={`absolute bottom-0 left-0 w-full z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.5)] flex flex-col transition-[height] duration-300 ${themeClasses}`}>
        <div onMouseDown={() => setIsDragging(true)} className={`h-2.5 cursor-ns-resize w-full ${isLightMode ? 'bg-slate-300' : 'bg-[#444]'}`} />
        
        <div className={`p-2.5 px-5 flex justify-between font-bold ${isLightMode ? 'bg-slate-100' : 'bg-[#2d2d2d]'}`}>
          <span>{activePanel === 'dashboard' ? 'Dashboard Overview (Active)' : 'System Logs (Resolved)'}</span>
          <button onClick={() => setActivePanel('')} className="text-red-500 hover:text-red-400 font-bold cursor-pointer">✖</button>
        </div>
        
        <div className="flex-1 overflow-auto p-4">
          {panelData.length === 0 ? (
            <p>No records found for this view.</p>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Sr.No</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Type</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Area</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Date/Time</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Status</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Confidence</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Severity</th>
                  <th className={`p-2.5 border-b ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Location</th>
                </tr>
              </thead>
              <tbody className={activePanel === 'logs' ? 'font-mono text-[13px]' : ''}>
                {panelData.map((f: any, i: number) => {
                  const p = f.properties;
                  const coords = f.geometry.type === 'Point' ? f.geometry.coordinates : f.geometry.coordinates[0][0];
                  return (
                    <tr key={i}>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{i + 1}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.hazard_type.replace('_', ' ').toUpperCase()}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.area}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.reported_at}</td>
                      <td className={`p-2.5 border-b font-bold ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`} style={{ color: getStatusColor(p.status) }}>{p.status}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{(p.confidence * 100).toFixed(1)}%</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.severity}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>
                        <button onClick={() => jumpTo(coords[0], coords[1])} className="bg-blue-600 text-white px-2 py-1 rounded text-xs cursor-pointer hover:bg-blue-700">
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