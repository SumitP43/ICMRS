import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, LocateFixed } from 'lucide-react';

interface CivicLocationPickerProps {
  coordinates: { lat: number; lng: number };
  onChangeCoordinates: (coords: { lat: number; lng: number }) => void;
  locationName: string;
  onUseLiveLocation?: () => void;
  isLocating?: boolean;
}

// Leaflet click handler and marker component
function LeafletLocationMarker({
  coordinates,
  onChangeCoordinates
}: {
  coordinates: { lat: number; lng: number };
  onChangeCoordinates: (coords: { lat: number; lng: number }) => void;
}) {
  const map = useMap();

  useMapEvents({
    click(e) {
      onChangeCoordinates({ lat: e.latlng.lat, lng: e.latlng.lng });
      map.flyTo([e.latlng.lat, e.latlng.lng], map.getZoom(), { duration: 0.8 });
    }
  });

  const markerIcon = L.divIcon({
    className: 'custom-picker-pin',
    html: `
      <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer;">
        <span style="position:absolute; inset:-4px; border-radius:50%; background-color:#ef4444; opacity:0.35; animation: ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <div style="width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background-color:#ef4444; border:2.5px solid #ffffff; box-shadow:0 4px 8px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center;">
          <span style="transform:rotate(45deg); color:#ffffff; font-weight:900; font-size:12px;">!</span>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 30]
  });

  return <Marker position={[coordinates.lat, coordinates.lng]} icon={markerIcon} />;
}

// Helper to keep map centered when external coordinates change (e.g. from live GPS)
function LeafletMapCenterSync({ coordinates }: { coordinates: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    if (map && coordinates.lat && coordinates.lng) {
      map.flyTo([coordinates.lat, coordinates.lng], map.getZoom(), { duration: 0.8 });
    }
  }, [map, coordinates.lat, coordinates.lng]);

  return null;
}

export const CivicLocationPicker: React.FC<CivicLocationPickerProps> = ({
  coordinates,
  onChangeCoordinates,
  locationName: _locationName,
  onUseLiveLocation,
  isLocating = false
}) => {
  return (
    <div className="mt-4 rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      {/* Header bar with coordinates and Live Location button */}
      <div className="bg-gray-50 px-3.5 py-2.5 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-gray-600">
        <div className="flex items-center gap-2 text-indigo-600">
          <Navigation className="w-3.5 h-3.5" />
          <span>Click map to pin hazard location (OpenStreetMap)</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="font-mono text-gray-600 bg-gray-200/70 px-2 py-0.5 rounded text-[10px]">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </span>

          {onUseLiveLocation && (
            <button
              type="button"
              onClick={onUseLiveLocation}
              disabled={isLocating}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors font-bold text-[10px] cursor-pointer"
              title="Detect live GPS position"
            >
              <LocateFixed className={`w-3 h-3 ${isLocating ? 'animate-spin text-blue-600' : ''}`} />
              <span>{isLocating ? 'Acquiring GPS...' : 'My Live Location'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Leaflet OpenStreetMap Mini Map */}
      <div className="relative w-full h-[220px] bg-slate-100">
        <MapContainer
          center={[coordinates.lat, coordinates.lng]}
          zoom={15}
          scrollWheelZoom={false}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
          <LeafletMapCenterSync coordinates={coordinates} />
          <LeafletLocationMarker coordinates={coordinates} onChangeCoordinates={onChangeCoordinates} />
        </MapContainer>

        {/* Quick instructions floating pill */}
        <div className="absolute bottom-2 left-2 z-[400] bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-xs border border-gray-200 text-[10px] text-gray-600 flex items-center gap-1.5 pointer-events-none">
          <MapPin className="w-3 h-3 text-red-500" />
          <span>Tap anywhere on the map to adjust hazard pin</span>
        </div>
      </div>
    </div>
  );
};
