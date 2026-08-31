import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer } from '@deck.gl/layers';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';
import { Map } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';

export default function MapDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ features: [] });
  const [isLightMode, setIsLightMode] = useState(true);
  const [heatmapActive, setHeatmapActive] = useState(false);
  const [viewState, setViewState] = useState({ longitude: 73.845014, latitude: 18.525501, zoom: 14, pitch: 50, bearing: 0 });
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [panelHeight, setPanelHeight] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  
  // NEW: State to track which row is currently twinkling
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  const [filters, setFilters] = useState({ potholes: true, cracks: true, garbage_dumps: true });

  const fetchData = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/hazards/');
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
      await fetch(`http://127.0.0.1:8000/api/hazards/${id}/toggle_false_positive`, { method: 'PUT' });
    } catch (err) { fetchData(); }
  };

  const jumpTo = (lon: number, lat: number) => {
    setViewState({ ...viewState, longitude: lon, latitude: lat, zoom: 19, pitch: 60, transitionDuration: 1500 as any });
  };

  // NEW: Handle clicking on a map damage point
  const handleMapClick = (id: number) => {
    // 1. Open dashboard if closed, and ensure it is tall enough to see
    setDashboardOpen(true);
    setPanelHeight(prev => prev < 300 ? 300 : prev);
    
    // 2. Set the ID so the CSS class applies
    setHighlightedId(id);
    
    // 3. Wait for the dashboard to slide up, then scroll to the row
    setTimeout(() => {
      const row = document.getElementById(`row-${id}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 350); // 350ms delay accounts for the CSS transition duration of the dashboard

    // 4. Remove the highlight after the animation completes so it can be re-triggered later
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
    heatmapActive && new GeoJsonLayer({
      id: 'heatmap-baseline',
      data: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: { type: 'Polygon', coordinates: [[[73.0, 18.0], [74.5, 18.0], [74.5, 19.5], [73.0, 19.5], [73.0, 18.0]]] }, properties: {} }] },
      getFillColor: [0, 0, 139, 90], stroked: false,
    }),
    heatmapActive && new HeatmapLayer({
      id: 'heatmap-layer',
      data: safeFeatures
        .filter((f: any) => !f.properties?.is_false_positive && f.geometry?.type === 'Point')
        .map((f: any) => f.geometry.coordinates),
      getPosition: (d: any) => d,
      radiusPixels: 130, intensity: 1.5, threshold: 0.05,
      colorRange: [[0, 0, 139], [0, 0, 255], [255, 255, 0], [255, 165, 0], [255, 0, 0]]
    }),
    new GeoJsonLayer({
      id: 'geojson-layer',
      data: { type: 'FeatureCollection', features: filteredFeatures },
      pickable: true, stroked: true, filled: true,
      // NEW: Added the onClick listener!
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

  const solidThemeClasses = isLightMode ? 'bg-white text-slate-800 border-slate-300' : 'bg-[#1e1e1e] text-white border-neutral-700';
  const glassSidebar = isLightMode 
    ? 'bg-white/50 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/60 text-slate-900 shadow-[4px_0_24px_rgba(0,0,0,0.05)]' 
    : 'bg-[#1c1c1e]/60 backdrop-blur-2xl backdrop-saturate-150 border-r border-white/10 text-white shadow-[4px_0_24px_rgba(0,0,0,0.3)]';
  const glassMenuItem = isLightMode ? 'border-black/5 hover:bg-black/5' : 'border-white/10 hover:bg-white/10';

  return (
    <div className="w-screen h-screen overflow-hidden flex relative">
      
      <div className="absolute top-4 right-4 z-10 flex gap-4 items-center">
        <button 
          onClick={() => setHeatmapActive(!heatmapActive)} 
          className={`uiverse ${heatmapActive ? 'active-heatmap' : ''}`}
        >
          <div className="wrapper">
            <span>🔥 Heatmap</span>
          </div>
        </button>

        <button
          onClick={() => setIsLightMode(!isLightMode)}
          className={`relative w-16 h-8 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-none shadow-inner cursor-pointer ${isLightMode ? 'bg-sky-300' : 'bg-slate-700'}`}
        >
          <div className="absolute flex justify-between w-full px-2 left-0 pointer-events-none">
            <Moon size={14} className="text-slate-200" />
            <Sun size={14} className="text-amber-500" />
          </div>
          <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center z-10 ${isLightMode ? 'translate-x-8' : 'translate-x-0'}`}>
            {isLightMode ? <Sun size={14} className="text-amber-500" /> : <Moon size={14} className="text-slate-700" />}
          </div>
        </button>

        <button 
          onClick={() => navigate('/')} 
          className="px-4 h-10 rounded-full bg-rose-600 text-white shadow-md font-bold cursor-pointer hover:bg-rose-700 transition"
        >
          Sign Out
        </button>
      </div>

      <div className={`absolute top-0 left-0 h-full z-10 transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${glassSidebar} ${sidebarOpen ? 'w-64' : 'w-[50px]'}`}>
        
        <div className={`p-4 cursor-pointer text-center text-xl font-bold transition-colors duration-200 border-b ${glassMenuItem}`} onClick={() => setSidebarOpen(!sidebarOpen)}>
          ☰
        </div>
        
        <div className={`flex flex-col ${!sidebarOpen && 'hidden'}`}>
          <div className={`p-4 cursor-pointer font-bold border-b transition-colors duration-200 ${glassMenuItem}`} onClick={() => setDashboardOpen(true)}>
            Dashboard Overview
          </div>
          
          <div className={`p-4 cursor-pointer font-bold border-b transition-colors duration-200 ${glassMenuItem}`} onClick={() => setFiltersOpen(!filtersOpen)}>
            Map Filters
          </div>
          
          {filtersOpen && (
            <div className={`p-4 border-b text-sm flex flex-col gap-3 shadow-inner transition-colors duration-200 ${isLightMode ? 'bg-black/5 border-black/5' : 'bg-black/20 border-white/10'}`}>
              {Object.keys(filters).map(key => (
                <label key={key} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 accent-blue-600 transition-transform group-hover:scale-110 cursor-pointer" checked={filters[key as keyof typeof filters]} onChange={() => setFilters({...filters, [key]: !filters[key as keyof typeof filters]})} />
                  <span className="capitalize font-medium opacity-90 group-hover:opacity-100 transition-opacity">{key.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}
          
          <div className={`p-4 cursor-pointer font-bold border-b transition-colors duration-200 ${glassMenuItem}`} onClick={() => window.open('/database.html', '_blank')}>
            Open Database
          </div>
        </div>
      </div>

      <div style={{ height: dashboardOpen ? `${panelHeight}px` : '0px' }} className={`absolute bottom-0 left-0 w-full z-20 shadow-[0_-2px_10px_rgba(0,0,0,0.5)] flex flex-col transition-[height] duration-300 ${solidThemeClasses}`}>
        <div onMouseDown={() => setIsDragging(true)} className={`h-2.5 cursor-ns-resize w-full ${isLightMode ? 'bg-slate-300' : 'bg-[#444]'}`} />
        
        <div className={`p-2.5 px-5 flex justify-between font-bold ${isLightMode ? 'bg-slate-100' : 'bg-[#2d2d2d]'}`}>
          <span>Validation Dashboard</span>
          <button onClick={() => setDashboardOpen(false)} className="text-red-500 hover:text-red-400 font-bold cursor-pointer text-lg">✖</button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 relative">
          {safeFeatures.length === 0 ? (
            <p>No records found.</p>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Sr.No</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Type</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Area</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Date/Time</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Coordinates</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Severity</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Validation</th>
                  <th className={`sticky top-0 p-2.5 border-b z-10 ${isLightMode ? 'bg-slate-100 border-slate-300' : 'bg-[#2d2d2d] border-[#333]'}`}>Action</th>
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

                  // NEW: ID attached to the row for smooth scrolling, and dynamic class for animation
                  return (
                    <tr 
                      key={p.id} 
                      id={`row-${p.id}`}
                      className={`transition-colors ${highlightedId === p.id ? 'animate-twinkle' : ''}`}
                    >
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{i + 1}</td>
                      <td className={`p-2.5 border-b font-semibold ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>
                        <span style={{color: p.hazard_type === 'pothole' ? '#dc2626' : p.hazard_type === 'crack' ? '#ea580c' : '#9333ea'}}>
                           {p.hazard_type?.replace('_', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.area}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.reported_at}</td>
                      <td className={`p-2.5 border-b font-mono text-xs ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>
                        {lat.toFixed(5)}, {lon.toFixed(5)}
                      </td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>{p.severity}</td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>
                        <button 
                          onClick={() => toggleFalsePositive(p.id)} 
                          className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${p.is_false_positive ? 'bg-red-500 text-white shadow-md' : 'bg-gray-400 text-white hover:bg-gray-500'}`}
                        >
                          {p.is_false_positive ? 'False Positive' : 'Valid'}
                        </button>
                      </td>
                      <td className={`p-2.5 border-b ${isLightMode ? 'border-slate-200' : 'border-[#333]'}`}>
                        <button onClick={() => jumpTo(lon, lat)} className="bg-blue-600 text-white px-3 py-1 rounded text-xs cursor-pointer hover:bg-blue-700 shadow-sm">
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

      {/* Adding cursor pointer class to DeckGL canvas */}
      <div className="flex-1 relative z-0 [&_canvas]:cursor-pointer">
        <DeckGL viewState={viewState} onViewStateChange={({ viewState }) => setViewState(viewState)} controller={true} layers={layers}>
          <Map mapStyle={isLightMode ? 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json' : 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'} />
        </DeckGL>
      </div>

    </div>
  );
}