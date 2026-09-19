import React from 'react';
import { Plus, Minus, Navigation, Map as MapIcon } from 'lucide-react'; 

const MapControls: React.FC = () => {
  return (
    <div className="absolute bottom-8 right-4 z-[1000] flex flex-col gap-3 items-end">
      
      {/* Zoom In / Zoom Out Group */}
      <div className="flex flex-col bg-white rounded-xl shadow-md overflow-hidden">
        <button 
          className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-b border-gray-200 transition-colors"
          title="Zoom In"
        >
          <Plus className="w-5 h-5" />
        </button>
        <button 
          className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-5 h-5" />
        </button>
      </div>

      {/* Reset to Pune Extent */}
      <button 
        className="flex items-center gap-2 bg-white rounded-full shadow-md px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
        title="Recenter to Pune"
      >
        <MapIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Recenter to Pune</span>
      </button>

      {/* Locate Me (Geolocate) */}
      <button 
        className="p-3 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600 hover:bg-gray-50 transition-colors"
        title="Find My Location"
      >
        <Navigation className="w-5 h-5" />
      </button>

    </div>
  );
};

export default MapControls;
