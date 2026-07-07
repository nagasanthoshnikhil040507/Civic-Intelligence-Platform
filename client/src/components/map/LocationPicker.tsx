import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import { MapPin, Crosshair, Loader2 } from 'lucide-react';

// Fix for default marker icon in React Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  value?: [number, number]; // [longitude, latitude]
  onChange: (location: [number, number]) => void;
  readOnly?: boolean;
}

function LocationMarker({ position, setPosition, readOnly }: any) {
  const map = useMap();
  
  useMapEvents({
    click(e) {
      if (readOnly) return;
      setPosition([e.latlng.lng, e.latlng.lat]);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo([position[1], position[0]], map.getZoom());
    }
  }, [position, map]);

  return position ? (
    <Marker 
      position={[position[1], position[0]]} 
      draggable={!readOnly}
      eventHandlers={{
        dragend: (e) => {
          if (readOnly) return;
          const marker = e.target;
          const pos = marker.getLatLng();
          setPosition([pos.lng, pos.lat]);
        },
      }}
    />
  ) : null;
}

export default function LocationPicker({ value, onChange, readOnly = false }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number] | null>(value || null);
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Default to a central location (e.g., center of a generic city or world) if no value
  const centerPosition: [number, number] = value ? [value[1], value[0]] : [40.7128, -74.0060]; // lat, lng for MapContainer

  const handleSetPosition = (newPos: [number, number]) => {
    setPosition(newPos);
    onChange(newPos);
  };

  const locateUser = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    
    setIsLocating(true);
    setGeoError('');
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        handleSetPosition([pos.coords.longitude, pos.coords.latitude]);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        switch(err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Location permission denied.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Location information unavailable.');
            break;
          case err.TIMEOUT:
            setGeoError('Location request timed out.');
            break;
          default:
            setGeoError('An unknown error occurred.');
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Click on the map or drag the marker to set location.</p>
          <button
            type="button"
            onClick={locateUser}
            disabled={isLocating}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 disabled:opacity-50 transition-colors"
          >
            {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crosshair className="w-4 h-4" />}
            Current Location
          </button>
        </div>
      )}
      
      {geoError && (
        <div className="p-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
          {geoError}
        </div>
      )}

      <div className="relative h-[400px] w-full rounded-xl overflow-hidden border border-slate-300 shadow-sm z-0">
        <MapContainer 
          center={centerPosition} 
          zoom={13} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={handleSetPosition} readOnly={readOnly} />
        </MapContainer>
      </div>

      {position && (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
          <MapPin className="w-4 h-4 text-indigo-500" />
          <span className="font-medium">Selected Coordinates:</span>
          <span className="font-mono bg-white px-2 py-0.5 border border-slate-200 rounded">
            {position[1].toFixed(6)}, {position[0].toFixed(6)}
          </span>
          <span className="text-xs text-slate-400 ml-auto">(Lat, Lng)</span>
        </div>
      )}
    </div>
  );
}
