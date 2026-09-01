import React, { useState, useEffect } from 'react';
import DeckGL from '@deck.gl/react';
import { ScatterplotLayer } from '@deck.gl/layers';
export default function App() {
  const [features, setFeatures] = useState([]);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchHazards() {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/potholes');
        const data = await response.json();
        setFeatures(data.features || []);
        setCount(data.features?.length || 0);
      } catch (err) {
        console.error("Failed to fetch hazard data:", err);
      }
    }

    // Initial fetch and polling every 5 seconds
    fetchHazards();
    const interval = setInterval(fetchHazards, 5000);
    return () => clearInterval(interval);
  }, []);

  const hazardLayer = new ScatterplotLayer({
    id: 'hazard-layer',
    data: features,
    getPosition: d => d.geometry.coordinates,
    getFillColor: d => d.properties.severity === 'High' ? [220, 38, 38] : [217, 119, 6], // Red for High, Amber for Medium/Low
    radiusUnits: 'meters',
    getRadius: 2.5,
    radiusMinPixels: 5,
    pickable: true,
    autoHighlight: true,
    onClick: ({ object }) => alert(`Hazard Detected!\nSeverity: ${object.properties.severity}\nDepth: ${object.properties.depth_cm}cm`)
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-stone-900">
      
      {/* Civic Authority UI Panel */}
      <div className="absolute top-6 left-6 z-10 bg-stone-100 border-l-4 border-amber-700 p-5 rounded shadow-lg font-sans w-80">
        <h2 className="text-xl font-bold text-stone-800 uppercase tracking-wide mb-1">
          City Works Dept
        </h2>
        <h3 className="text-sm font-semibold text-amber-700 mb-4">
          Live Hazard Feed
        </h3>
        
        <div className="flex justify-between items-center bg-white p-3 rounded border border-stone-200">
          <span className="text-stone-600 font-medium">Active Alerts</span>
          <span className="text-2xl font-bold text-red-600">{count}</span>
        </div>
      </div>

      {/* Deck.gl Map */}
      <DeckGL
        initialViewState={{ longitude: 73.8567, latitude: 18.5204, zoom: 13, pitch: 30 }}
        controller={true}
        layers={[hazardLayer]}
        getMapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
      />
    </div>
  );
}