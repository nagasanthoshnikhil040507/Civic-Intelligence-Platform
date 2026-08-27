import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { Loader2, MapPin } from 'lucide-react';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface HeatmapProps {
  complaints: any[];
  isLoading?: boolean;
}

// Component to dynamically adjust map bounds based on complaints
function MapBounds({ complaints }: { complaints: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    if (complaints && complaints.length > 0) {
      const validComplaints = complaints.filter(c => c.location?.coordinates && c.location.coordinates.length === 2);
      
      if (validComplaints.length > 0) {
        const bounds = L.latLngBounds(
          validComplaints.map(c => [c.location.coordinates[1], c.location.coordinates[0]])
        );
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [complaints, map]);
  
  return null;
}

export default function Heatmap({ complaints, isLoading = false }: HeatmapProps) {
  // Default to a central location (e.g., center of a generic city)
  const defaultCenter: [number, number] = [40.7128, -74.0060];

  const getPriorityColor = (priority: string | number) => {
    const p = String(priority).toLowerCase();
    if (p === 'high' || (typeof priority === 'number' && priority >= 75)) return '#ef4444'; // Red
    if (p === 'medium' || (typeof priority === 'number' && priority >= 40)) return '#f97316'; // Orange
    return '#eab308'; // Yellow
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'resolved': return 'bg-emerald-100 text-emerald-700';
      case 'in_progress': return 'bg-indigo-100 text-indigo-700';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading map data...</p>
      </div>
    );
  }

  const validComplaints = complaints?.filter(c => c.location?.coordinates && c.location.coordinates.length === 2) || [];

  return (
    <div className="relative h-full min-h-[400px] w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={12} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {validComplaints.length > 0 && <MapBounds complaints={validComplaints} />}

        {validComplaints.map((complaint) => (
          <CircleMarker
            key={complaint._id}
            center={[complaint.location.coordinates[1], complaint.location.coordinates[0]]}
            radius={12}
            pathOptions={{
              fillColor: getPriorityColor(complaint.priority),
              fillOpacity: 0.6,
              color: 'white',
              weight: 1,
              opacity: 0.8
            }}
          >
            <Popup className="custom-popup">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(complaint.status)}`}>
                    {complaint.status?.replace('_', ' ')}
                  </span>
                  {complaint.priority && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                      {complaint.priority}
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 leading-tight mb-1">{complaint.title}</h4>
                <p className="text-xs text-slate-500 capitalize mb-3">{complaint.category?.replace('_', ' ')}</p>
                
                {complaint.aiAnalysis?.summary && (
                  <p className="text-xs text-slate-700 italic border-l-2 border-indigo-200 pl-2 mb-2 line-clamp-2">
                    "{complaint.aiAnalysis.summary}"
                  </p>
                )}
                
                <a 
                  href={`/admin/complaints/${complaint._id}`} 
                  className="block w-full text-center text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 rounded transition-colors"
                >
                  View Details
                </a>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm z-[1000] text-xs font-medium">
        <h4 className="font-bold text-slate-900 dark:text-white mb-2 pb-1 border-b border-slate-200 dark:border-slate-700">Priority Level</h4>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 opacity-60 border border-red-600"></span>
            <span className="text-slate-600 dark:text-slate-300">High</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 opacity-60 border border-orange-600"></span>
            <span className="text-slate-600 dark:text-slate-300">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-yellow-500 opacity-60 border border-yellow-600"></span>
            <span className="text-slate-600 dark:text-slate-300">Low</span>
          </div>
        </div>
      </div>
    </div>
  );
}
