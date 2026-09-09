import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure L is on window before importing leaflet.heat
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import 'leaflet.heat';

import { CivicComplaint } from '../types';
import { 
  Flame, 
  MapPin, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Navigation,
  Activity,
  Check,
  Info,
  Radio,
  Crosshair,
  Compass
} from 'lucide-react';

interface CivicLeafletMapProps {
  selectedIncident?: CivicComplaint | null;
  onSelectIncident?: (complaint: CivicComplaint) => void;
  onOpenDetails?: (complaint: CivicComplaint) => void;
  onRefreshData?: () => void;
  complaints?: CivicComplaint[];
}

// Haversine distance calculator between two GPS points (returns distance in meters)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const φ1 = lat1 * (Math.PI / 180);
  const φ2 = lat2 * (Math.PI / 180);
  const Δφ = (lat2 - lat1) * (Math.PI / 180);
  const Δλ = (lon2 - lon1) * (Math.PI / 180);

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Controller to smoothly pan the Leaflet camera when an incident is selected
function CameraSyncController({ selectedIncident }: { selectedIncident: CivicComplaint | null | undefined }) {
  const map = useMap();
  const prevIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map || !selectedIncident) return;
    const lat = selectedIncident.latitude ?? selectedIncident.coordinates?.lat;
    const lng = selectedIncident.longitude ?? selectedIncident.coordinates?.lng;

    if (lat && lng && prevIdRef.current !== selectedIncident.id) {
      prevIdRef.current = selectedIncident.id;
      map.flyTo([lat, lng], 15, { duration: 1.2 });
    }
  }, [map, selectedIncident]);

  return null;
}

// Controller to smoothly pan the Leaflet camera when the user requests centering on their live location
function UserLocationCameraController({
  userLocation,
  panTrigger
}: {
  userLocation: { lat: number; lng: number } | null;
  panTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && userLocation && panTrigger > 0) {
      map.flyTo([userLocation.lat, userLocation.lng], 16, { duration: 1.2 });
    }
  }, [map, panTrigger, userLocation]);

  return null;
}

// Controller to smoothly reset the Leaflet camera to the full Delhi panoramic overview
function ResetDelhiCameraController({
  resetTrigger,
  defaultCenter,
  defaultZoom
}: {
  resetTrigger: number;
  defaultCenter: [number, number];
  defaultZoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (map && resetTrigger > 0) {
      map.flyTo(defaultCenter, defaultZoom, { duration: 1.1 });
    }
  }, [map, resetTrigger, defaultCenter, defaultZoom]);

  return null;
}

// Subcomponent that manages the leaflet.heat density overlay
function HeatmapOverlay({ 
  complaints, 
  visible,
  radius = 28,
  blur = 18
}: { 
  complaints: CivicComplaint[]; 
  visible: boolean;
  radius?: number;
  blur?: number;
}) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);

  useEffect(() => {
    if (!map) return;

    // Clean up existing layer if any
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!visible || complaints.length === 0) return;

    // Build [lat, lng, intensity] array from complaint points
    const points: [number, number, number][] = complaints.map(c => {
      const lat = c.latitude ?? c.coordinates?.lat ?? 28.6139;
      const lng = c.longitude ?? c.coordinates?.lng ?? 77.2090;
      
      let intensity = 0.5;
      if (c.status === 'Resolved') intensity = 0.25;
      else if (c.priority === 'Critical') intensity = 1.0;
      else if (c.priority === 'High') intensity = 0.8;
      else if (c.priority === 'Medium') intensity = 0.5;
      else intensity = 0.3;

      return [lat, lng, intensity];
    });

    try {
      if (typeof (L as any).heatLayer === 'function') {
        const heat = (L as any).heatLayer(points, {
          radius: radius,
          blur: blur,
          maxZoom: 16,
          minOpacity: 0.35,
          gradient: {
            0.2: '#3b82f6', // blue
            0.4: '#10b981', // green
            0.6: '#eab308', // yellow
            0.8: '#f97316', // orange
            1.0: '#ef4444'  // red
          }
        });
        heat.addTo(map);
        heatLayerRef.current = heat;
      }
    } catch (e) {
      console.warn('Leaflet.heat initialization notice:', e);
    }

    return () => {
      if (heatLayerRef.current && map) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [map, visible, complaints, radius, blur]);

  return null;
}

// User live location pulsing pin
function getUserLiveLocationIcon() {
  return L.divIcon({
    className: 'custom-live-location-pin',
    html: `
      <div style="position:relative; width:36px; height:36px; display:flex; align-items:center; justify-content:center; pointer-events:auto;">
        <span style="position:absolute; width:100%; height:100%; border-radius:50%; background-color:#3B82F6; opacity:0.4; animation: ping 1.8s cubic-bezier(0,0,0.2,1) infinite;"></span>
        <span style="position:absolute; width:22px; height:22px; border-radius:50%; background-color:#2563EB; border:3px solid #ffffff; box-shadow:0 0 14px rgba(37,99,235,0.75);"></span>
        <span style="position:relative; width:7px; height:7px; border-radius:50%; background-color:#ffffff;"></span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}

// Generate Leaflet divIcon colored strictly by the prompt mandate:
// Red for Critical, Orange for High, Yellow for Medium, Green for Resolved
function getPriorityMarkerIcon(complaint: CivicComplaint, isSelected: boolean) {
  let color = '#EAB308'; // Default Yellow for Medium
  let label = '●';
  let title = 'Medium Priority';

  if (complaint.status === 'Resolved') {
    color = '#22C55E'; // Green for Resolved
    label = '✓';
    title = 'Resolved';
  } else if (complaint.priority === 'Critical') {
    color = '#EF4444'; // Red for Critical
    label = '!';
    title = 'Critical Priority';
  } else if (complaint.priority === 'High') {
    color = '#F97316'; // Orange for High
    label = '▲';
    title = 'High Priority';
  } else if (complaint.priority === 'Medium') {
    color = '#EAB308'; // Yellow for Medium
    label = '●';
    title = 'Medium Priority';
  } else {
    color = '#3B82F6';
    label = '●';
    title = 'Low Priority';
  }

  const scale = isSelected ? 1.25 : 1.0;
  const pulseEffect = complaint.priority === 'Critical' && complaint.status !== 'Resolved'
    ? `<span style="position:absolute; inset:-4px; border-radius:50%; background-color:${color}; opacity:0.4; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`
    : '';

  return L.divIcon({
    className: 'custom-leaflet-marker-wrapper',
    html: `
      <div style="position:relative; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; transform:scale(${scale}); transition:transform 0.2s ease;" title="${title}">
        ${pulseEffect}
        <div style="width:28px; height:28px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); background-color:${color}; border:2.5px solid #ffffff; box-shadow:0 4px 8px rgba(0,0,0,0.28); display:flex; align-items:center; justify-content:center;">
          <span style="transform:rotate(45deg); color:#ffffff; font-weight:900; font-size:12px; line-height:1; font-family:'Plus Jakarta Sans',sans-serif;">${label}</span>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 30],
    popupAnchor: [0, -32],
  });
}

export const CivicLeafletMap: React.FC<CivicLeafletMapProps> = ({
  selectedIncident,
  onSelectIncident,
  onOpenDetails,
  onRefreshData,
  complaints: propComplaints
}) => {
  const [complaints, setComplaints] = useState<CivicComplaint[]>(propComplaints || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showMarkers, setShowMarkers] = useState<boolean>(true);
  const [filterLayer, setFilterLayer] = useState<'all' | 'roads' | 'electrical' | 'water'>('all');
  const [activeComplaintId, setActiveComplaintId] = useState<string | null>(selectedIncident?.id || null);

  // Live Location State
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
  } | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [panToUserTrigger, setPanToUserTrigger] = useState<number>(0);
  const [resetDelhiTrigger, setResetDelhiTrigger] = useState<number>(0);
  const watchIdRef = useRef<number | null>(null);

  // Default coordinates centered on New Delhi (Connaught Place / NCT of Delhi)
  const defaultCenter: [number, number] = [28.6139, 77.2090];
  const defaultZoom = 11;

  // Fetch complaint data from backend API endpoint (/api/complaints)
  const fetchComplaintsFromAPI = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch('/api/complaints');
      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        // Ensure every complaint has explicit latitude and longitude numbers
        const normalized: CivicComplaint[] = json.data.map((item: any) => ({
          ...item,
          latitude: Number(item.latitude ?? item.coordinates?.lat ?? 28.6139),
          longitude: Number(item.longitude ?? item.coordinates?.lng ?? 77.2090),
          coordinates: {
            lat: Number(item.latitude ?? item.coordinates?.lat ?? 28.6139),
            lng: Number(item.longitude ?? item.coordinates?.lng ?? 77.2090)
          }
        }));
        setComplaints(normalized);
      } else {
        throw new Error('Invalid response structure from backend');
      }
    } catch (err: any) {
      console.warn('Backend API fetch warning (using fallback data if present):', err.message);
      setApiError(err.message);
      // Fallback to propComplaints if available
      if (propComplaints && propComplaints.length > 0) {
        setComplaints(propComplaints);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sync with propComplaints or initial load
  useEffect(() => {
    fetchComplaintsFromAPI();
  }, []);

  useEffect(() => {
    if (propComplaints && propComplaints.length > 0) {
      setComplaints(propComplaints);
    }
  }, [propComplaints]);

  useEffect(() => {
    if (selectedIncident) {
      setActiveComplaintId(selectedIncident.id);
    }
  }, [selectedIncident]);

  // Clean up geolocation watch on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Filter complaints based on active filter layer
  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      if (filterLayer === 'all') return true;
      const cat = (c.category || '').toLowerCase();
      if (filterLayer === 'roads') return cat.includes('road') || cat.includes('bridge') || cat.includes('transit');
      if (filterLayer === 'electrical') return cat.includes('electric') || cat.includes('lighting') || cat.includes('power');
      if (filterLayer === 'water') return cat.includes('water') || cat.includes('sanitation') || cat.includes('drain');
      return true;
    });
  }, [complaints, filterLayer]);

  // Calculate nearest incident to user live location
  const nearestIncident = useMemo(() => {
    if (!userLocation || filteredComplaints.length === 0) return null;
    let minDistance = Infinity;
    let closest: CivicComplaint | null = null;

    for (const c of filteredComplaints) {
      const lat = c.latitude ?? c.coordinates?.lat;
      const lng = c.longitude ?? c.coordinates?.lng;
      if (typeof lat === 'number' && typeof lng === 'number') {
        const dist = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
        if (dist < minDistance) {
          minDistance = dist;
          closest = c;
        }
      }
    }

    return closest ? { complaint: closest, distance: minDistance } : null;
  }, [userLocation, filteredComplaints]);

  // Summary counts
  const counts = useMemo(() => {
    const critical = complaints.filter(c => c.priority === 'Critical' && c.status !== 'Resolved').length;
    const high = complaints.filter(c => c.priority === 'High' && c.status !== 'Resolved').length;
    const medium = complaints.filter(c => c.priority === 'Medium' && c.status !== 'Resolved').length;
    const resolved = complaints.filter(c => c.status === 'Resolved').length;
    return { critical, high, medium, resolved, total: complaints.length };
  }, [complaints]);

  // Real-time Geolocation Controls
  const startLiveTracking = (forcePan = true) => {
    if (!('geolocation' in navigator)) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    // Clear existing watch if any
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Get initial position first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 25,
          timestamp: pos.timestamp
        };
        setUserLocation(loc);
        setIsLocating(false);
        setIsTracking(true);
        if (forcePan) {
          setPanToUserTrigger(prev => prev + 1);
        }

        // Start continuous live watchPosition
        try {
          const id = navigator.geolocation.watchPosition(
            (watchPos) => {
              setUserLocation({
                lat: watchPos.coords.latitude,
                lng: watchPos.coords.longitude,
                accuracy: watchPos.coords.accuracy || 20,
                timestamp: watchPos.timestamp
              });
            },
            (err) => {
              console.warn('Live location watch notice:', err.message);
            },
            {
              enableHighAccuracy: true,
              maximumAge: 4000,
              timeout: 12000
            }
          );
          watchIdRef.current = id;
        } catch (e) {
          console.warn('watchPosition error:', e);
        }
      },
      (err) => {
        setIsLocating(false);
        console.warn('Geolocation error:', err.message);
        let msg = 'Unable to retrieve live location.';
        if (err.code === 1) msg = 'Location access was not granted by browser settings.';
        else if (err.code === 2) msg = 'GPS hardware position unavailable.';
        else if (err.code === 3) msg = 'Live location request timed out.';
        setLocationError(msg);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const stopLiveTracking = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const toggleLiveTracking = () => {
    if (isTracking) {
      stopLiveTracking();
    } else {
      startLiveTracking(true);
    }
  };

  // Fallback simulator for sandboxed/desktop environments
  const simulateLiveLocation = () => {
    const simulated = {
      lat: 28.6139,
      lng: 77.2090,
      accuracy: 25,
      timestamp: Date.now()
    };
    setUserLocation(simulated);
    setIsTracking(true);
    setIsLocating(false);
    setLocationError(null);
    setPanToUserTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* Top Telemetry & Control Header */}
      <div className="bg-white rounded-[28px] p-4 sm:p-5 border border-gray-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Tile info & Status */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[16px] text-[#111827]">
                Delhi NCT Civic Geospatial Radar
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS Ready
              </span>
            </div>
            <p className="text-[12px] text-gray-500 font-medium flex items-center gap-1 mt-0.5">
              <span>Real-time municipal grievance tracking & field telemetry</span>
              {loading && <span className="text-gray-400 animate-pulse ml-1">(Updating...)</span>}
            </p>
          </div>
        </div>

        {/* Right: Controls & Live Location Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Location Button */}
          <button
            type="button"
            onClick={toggleLiveTracking}
            disabled={isLocating}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 border transition-all active:scale-95 shadow-sm ${
              isTracking
                ? 'bg-blue-600 text-white border-transparent shadow-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Toggle real-time Live Location tracking"
          >
            <Radio className={`w-3.5 h-3.5 ${isTracking ? 'text-white animate-pulse' : 'text-blue-600'}`} />
            <span>{isLocating ? 'Acquiring GPS...' : isTracking ? 'Live Location: ON' : 'Live Location'}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              isTracking ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {isTracking ? 'ACTIVE' : 'OFF'}
            </span>
          </button>

          {/* Center on Me Button (if userLocation known) */}
          {userLocation && (
            <button
              type="button"
              onClick={() => setPanToUserTrigger(prev => prev + 1)}
              className="px-3 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 text-[12px] font-bold"
              title="Pan map to your live position"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 fill-current" />
              <span>Center on Me</span>
            </button>
          )}

          {/* Reset to Full Delhi View */}
          <button
            type="button"
            onClick={() => setResetDelhiTrigger(prev => prev + 1)}
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-all shadow-sm active:scale-95 flex items-center gap-1.5 text-[12px] font-bold cursor-pointer"
            title="Reset map view to whole Delhi (Puri Delhi Map)"
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>Puri Delhi View</span>
          </button>

          {/* Optional Heatmap Toggle */}
          <button
            type="button"
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold flex items-center gap-2 border transition-all active:scale-95 shadow-sm ${
              showHeatmap
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-transparent'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
            title="Toggle leaflet.heat complaint density layer"
          >
            <Flame className={`w-3.5 h-3.5 ${showHeatmap ? 'text-yellow-200 animate-bounce' : 'text-gray-400'}`} />
            <span>Heatmap</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono ${
              showHeatmap ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {showHeatmap ? 'ON' : 'OFF'}
            </span>
          </button>

          {/* Marker Toggle */}
          <button
            type="button"
            onClick={() => setShowMarkers(!showMarkers)}
            className={`px-3 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 border transition-all active:scale-95 ${
              showMarkers 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Markers</span>
          </button>

          {/* Refresh Backend API */}
          <button
            type="button"
            onClick={() => {
              fetchComplaintsFromAPI();
              if (onRefreshData) onRefreshData();
            }}
            disabled={loading}
            className="p-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-indigo-600 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            title="Refresh Live Complaints"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Geolocation Feedback / Error Banner if any */}
      {locationError && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2.5 rounded-2xl text-[12px] flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{locationError}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={simulateLiveLocation}
              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
            >
              Simulate Delhi Civic GPS
            </button>
            <button
              type="button"
              onClick={() => setLocationError(null)}
              className="text-amber-700 hover:text-amber-900 text-[11px] font-bold cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Priority Legend & Quick Filters */}
      <div className="bg-white rounded-2xl p-3 sm:px-4 border border-gray-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-[12px]">
        {/* Priority Color Legend as specified */}
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-gray-500 font-bold text-[11px] uppercase tracking-wider">Priority Legend:</span>
          
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-200 inline-block" />
            <span className="font-bold text-[#111827]">Critical</span>
            <span className="text-gray-400 font-mono text-[11px]">({counts.critical})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-500 ring-2 ring-orange-200 inline-block" />
            <span className="font-bold text-[#111827]">High</span>
            <span className="text-gray-400 font-mono text-[11px]">({counts.high})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 ring-2 ring-yellow-200 inline-block" />
            <span className="font-bold text-[#111827]">Medium</span>
            <span className="text-gray-400 font-mono text-[11px]">({counts.medium})</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 ring-2 ring-green-200 inline-block" />
            <span className="font-bold text-[#111827]">Resolved</span>
            <span className="text-gray-400 font-mono text-[11px]">({counts.resolved})</span>
          </div>
        </div>

        {/* Sector Layer Filter */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-[11px] font-bold">
          {(['all', 'roads', 'electrical', 'water'] as const).map(layer => (
            <button
              key={layer}
              type="button"
              onClick={() => setFilterLayer(layer)}
              className={`px-2.5 py-1 rounded-lg capitalize transition-all ${
                filterLayer === layer
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {layer}
            </button>
          ))}
        </div>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[540px] rounded-[32px] overflow-hidden border border-gray-200 shadow-inner bg-slate-100 z-0">
        <MapContainer
          center={defaultCenter}
          zoom={11}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', zIndex: 0 }}
        >
          {/* OpenStreetMap Tile Layer - No API key needed */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Camera Sync Controller for Incident Selection */}
          <CameraSyncController selectedIncident={selectedIncident} />

          {/* Camera Sync Controller for User Live Location */}
          <UserLocationCameraController
            userLocation={userLocation}
            panTrigger={panToUserTrigger}
          />

          {/* Camera Reset Controller for Whole Delhi Overview */}
          <ResetDelhiCameraController
            resetTrigger={resetDelhiTrigger}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
          />

          {/* Optional leaflet.heat Heatmap Layer */}
          <HeatmapOverlay complaints={filteredComplaints} visible={showHeatmap} />

          {/* User Live Location Marker and Accuracy Circle */}
          {userLocation && (
            <>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={Math.max(userLocation.accuracy, 20)}
                pathOptions={{
                  color: '#3B82F6',
                  fillColor: '#60A5FA',
                  fillOpacity: 0.16,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
              <Marker
                position={[userLocation.lat, userLocation.lng]}
                icon={getUserLiveLocationIcon()}
                zIndexOffset={1000}
              >
                <Popup className="civic-custom-popup" offset={[0, -18]}>
                  <div className="p-1 min-w-[220px] text-[#111827]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-[12px] text-blue-600 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping inline-block" />
                        Your Live Location
                      </span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded font-mono font-bold">
                        ±{Math.round(userLocation.accuracy)}m
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-500 mb-2 font-mono">
                      GPS: {userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}
                    </p>

                    {nearestIncident && (
                      <div className="bg-blue-50/80 p-2 rounded-xl border border-blue-100 text-[11px] mb-2.5">
                        <div className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                          Nearest Active Incident:
                        </div>
                        <div className="font-bold text-[#111827] truncate mt-0.5">
                          {nearestIncident.complaint.title}
                        </div>
                        <div className="text-blue-700 font-bold mt-0.5 flex items-center justify-between">
                          <span>Proximity:</span>
                          <span className="font-mono">{formatDistance(nearestIncident.distance)}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setPanToUserTrigger(prev => prev + 1)}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3 h-3 fill-current" />
                      <span>Center on My Live Position</span>
                    </button>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Priority Colored Markers */}
          {showMarkers && filteredComplaints.map(complaint => {
            const lat = complaint.latitude ?? complaint.coordinates?.lat ?? 28.6139;
            const lng = complaint.longitude ?? complaint.coordinates?.lng ?? 77.2090;
            const isSelected = activeComplaintId === complaint.id;
            const icon = getPriorityMarkerIcon(complaint, isSelected);

            // Compute distance from user if user live location is known
            const distanceFromUser = userLocation 
              ? calculateDistance(userLocation.lat, userLocation.lng, lat, lng)
              : null;

            return (
              <Marker
                key={complaint.id}
                position={[lat, lng]}
                icon={icon}
                eventHandlers={{
                  click: () => {
                    setActiveComplaintId(complaint.id);
                    if (onSelectIncident) {
                      onSelectIncident(complaint);
                    }
                  }
                }}
              >
                <Popup className="civic-custom-popup" offset={[0, -26]}>
                  <div className="p-1 min-w-[240px] text-[#111827]">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {complaint.id}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        complaint.status === 'Resolved'
                          ? 'bg-green-100 text-green-700'
                          : complaint.priority === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : complaint.priority === 'High'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status === 'Resolved' ? 'Resolved' : `${complaint.priority} Priority`}
                      </span>
                    </div>

                    <h4 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[13px] leading-tight mb-1 text-[#111827]">
                      {complaint.title}
                    </h4>

                    <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                      <span className="truncate">{complaint.location}</span>
                    </p>

                    <div className="text-[11px] bg-gray-50 p-2 rounded-xl border border-gray-200 mb-2.5 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Crew:</span>
                        <span className="font-semibold text-[#111827]">{complaint.assignedCrew}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">SLA:</span>
                        <span className="font-mono font-bold text-indigo-600">{complaint.slaRemaining}</span>
                      </div>
                      {distanceFromUser !== null && (
                        <div className="flex justify-between text-blue-700 font-bold bg-blue-50/60 -mx-1 px-1 py-0.5 rounded">
                          <span>From your location:</span>
                          <span className="font-mono">{formatDistance(distanceFromUser)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-gray-400 font-mono text-[10px]">
                        <span>GPS:</span>
                        <span>{lat.toFixed(4)}, {lng.toFixed(4)}</span>
                      </div>
                    </div>

                    {onOpenDetails && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectIncident) onSelectIncident(complaint);
                          onOpenDetails(complaint);
                        }}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                      >
                        <Activity className="w-3 h-3" />
                        <span>Inspect Telemetry & SLA</span>
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Quick Map Navigation FAB buttons (Top-Right) */}
        <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
          {/* Reset to Full Delhi View */}
          <button
            type="button"
            onClick={() => setResetDelhiTrigger(prev => prev + 1)}
            className="w-11 h-11 rounded-2xl shadow-lg border border-gray-200 bg-white/95 backdrop-blur-md text-gray-700 hover:bg-gray-50 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            title="Puri Delhi Map View (Full Delhi Overview)"
          >
            <Compass className="w-5 h-5 text-indigo-600" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (!userLocation) {
                startLiveTracking(true);
              } else {
                setPanToUserTrigger(prev => prev + 1);
              }
            }}
            className={`w-11 h-11 rounded-2xl shadow-lg border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${
              userLocation
                ? 'bg-blue-600 border-blue-700 text-white shadow-blue-500/30 ring-2 ring-blue-300'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
            title={userLocation ? 'Center on My Live Location' : 'Locate My Position'}
          >
            <Navigation className={`w-5 h-5 ${isLocating ? 'animate-spin' : isTracking ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Live Active Patrol / Live Location Overlay (Top-Left) */}
        <div className="absolute top-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-gray-200 flex items-center gap-2.5 max-w-[calc(100%-80px)]">
          <span className={`w-2.5 h-2.5 rounded-full ${userLocation ? 'bg-blue-600' : 'bg-indigo-600'} animate-ping shrink-0`} />
          <div className="text-left overflow-hidden">
            <span className="text-[11px] font-extrabold text-[#111827] block leading-tight truncate">
              {userLocation 
                ? `Live GPS Locked (±${Math.round(userLocation.accuracy)}m)` 
                : 'Rapid Response Fleet Active'}
            </span>
            <span className="text-[10px] text-gray-500 font-medium block truncate">
              {userLocation && nearestIncident 
                ? `Nearest: ${nearestIncident.complaint.title.substring(0, 26)} (${formatDistance(nearestIncident.distance)})`
                : `${filteredComplaints.length} hazards geocoded • Delhi NCT Civic Telemetry`}
            </span>
          </div>
        </div>

        {/* Live sync status badge (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 z-[400] bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-md border border-gray-200 flex items-center gap-2 text-[11px] font-medium text-gray-600">
          <span className={`w-2 h-2 rounded-full ${apiError ? 'bg-amber-500' : 'bg-emerald-500'}`} />
          <span>Live Sync: <strong className="text-gray-900 font-semibold">{complaints.length} active reports</strong></span>
        </div>
      </div>
    </div>
  );
};

