import React, { useState, useEffect } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap
} from '@vis.gl/react-google-maps';
import { CivicComplaint } from '../types';
import { 
  Radio, 
  MapPin, 
  Layers, 
  ExternalLink, 
  ShieldAlert, 
  Clock, 
  CheckCircle2, 
  Compass,
  Sparkles
} from 'lucide-react';

interface GoogleCivicMapProps {
  complaints: CivicComplaint[];
  selectedIncident: CivicComplaint | null;
  onSelectIncident: (complaint: CivicComplaint) => void;
  activeLayer: 'all' | 'roads' | 'electrical' | 'water';
  onOpenDetails?: (complaint: CivicComplaint) => void;
}

// Controller component to smoothly pan and zoom the camera when an incident is selected
function MapCameraSync({ selectedIncident }: { selectedIncident: CivicComplaint | null }) {
  const map = useMap();

  useEffect(() => {
    if (map && selectedIncident && selectedIncident.coordinates) {
      map.panTo(selectedIncident.coordinates);
      map.setZoom(15);
    }
  }, [map, selectedIncident]);

  return null;
}

export const GoogleCivicMap: React.FC<GoogleCivicMapProps> = ({
  complaints,
  selectedIncident,
  onSelectIncident,
  activeLayer,
  onOpenDetails
}) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(selectedIncident?.id || null);
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid' | 'terrain'>('roadmap');

  // Center on Ward 04 (Seattle Municipal Core)
  const defaultCenter = { lat: 47.6105, lng: -122.3335 };

  useEffect(() => {
    if (selectedIncident) {
      setActiveMarkerId(selectedIncident.id);
    }
  }, [selectedIncident]);

  // Filter complaints according to active layer
  const filteredComplaints = complaints.filter(c => {
    if (activeLayer === 'all') return true;
    const cat = c.category.toLowerCase();
    if (activeLayer === 'roads') return cat.includes('road') || cat.includes('bridge');
    if (activeLayer === 'electrical') return cat.includes('electric') || cat.includes('power') || cat.includes('light');
    if (activeLayer === 'water') return cat.includes('water') || cat.includes('sanitation') || cat.includes('drain');
    return true;
  });

  const getPinColors = (c: CivicComplaint) => {
    if (c.status === 'Resolved') {
      return { background: '#16A34A', glyphColor: '#FFFFFF', borderColor: '#15803D' };
    }
    if (c.priority === 'Critical') {
      return { background: '#DC2626', glyphColor: '#FFFFFF', borderColor: '#991B1B' };
    }
    if (c.priority === 'High') {
      return { background: '#EA580C', glyphColor: '#FFFFFF', borderColor: '#C2410C' };
    }
    return { background: '#4F46E5', glyphColor: '#FFFFFF', borderColor: '#3730A3' };
  };

  const activeComplaint = complaints.find(c => c.id === activeMarkerId);

  // If no API key is provided, display a high-fidelity Bento guidance module with one-click Maps Demo Key instructions
  if (!apiKey) {
    return (
      <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-gray-200 bg-slate-900 text-white flex flex-col items-center justify-center p-6 sm:p-10 shadow-inner">
        {/* Background Radar Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none bg-cover bg-center"
          style={{
            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB14C-zw1w9LxawlQAAjr1_AJrgVeb2kiRdX-eJvG0SY0z4AGvMS05pmNGtvxa-snSHEfDoxXqPs9eXC8E08ljaU8_bsSe22owDc1gLjyfsP1fdf1uXcXVrwyZJ7FiNlJx4P9GRn0F8NLDRpQa1ZDVmICl40wz3MfMDT5KO-_1Hqlbj5H7Vim8Xw3kZ9prI2j9mIGLXoJ7DKX9iExY_hnntbRC4-PpRmpeBxkjp3LqkgEvMEq-YaHfwKg')"
          }}
        />

        {/* Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Bento Content Card */}
        <div className="relative z-10 max-w-lg w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[28px] p-7 sm:p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600/90 text-white flex items-center justify-center mx-auto mb-5 shadow-lg ring-4 ring-indigo-500/30">
            <span className="material-symbols-outlined text-[30px]">map</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-bold text-indigo-200 mb-3 tracking-wide uppercase">
            <Radio className="w-3 h-3 text-indigo-400 animate-pulse" />
            Google Maps Platform Integration
          </div>

          <h3 className="font-['Plus_Jakarta_Sans'] text-[22px] sm:text-[24px] font-extrabold text-white leading-tight mb-2">
            Connect Google Maps API Key
          </h3>
          <p className="text-[13px] sm:text-[14px] text-gray-300 leading-relaxed mb-6 font-normal">
            The app is fully configured for <strong className="text-white">Google Maps JavaScript API</strong> with <strong className="text-white">AdvancedMarker</strong> and cloud styling. To activate live maps, provide your API key or use the free <strong className="text-indigo-300">Maps Demo Key</strong> for zero-cost prototyping without a billing account.
          </p>

          <div className="space-y-3">
            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-[13px] sm:text-[14px] font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <span>Get Free Maps Demo Key</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <div className="p-3.5 bg-black/40 rounded-xl border border-white/10 text-left font-mono text-[11px] text-gray-300">
              <div className="text-gray-400 mb-1 font-sans text-[11px] font-semibold">Environment Variable Required:</div>
              <code className="text-indigo-300 font-bold block select-all">
                VITE_GOOGLE_MAPS_API_KEY=&quot;YOUR_KEY&quot;
              </code>
            </div>
          </div>

          {/* Fallback interactive switch */}
          <div className="mt-6 pt-4 border-t border-white/10 text-[12px] text-gray-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              Ward 04 Telemetry Ready
            </span>
            <span className="font-mono text-[11px] text-indigo-300">@vis.gl/react-google-maps</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[560px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={14}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapTypeId={mapType}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
          zoomControl={true}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={true}
        >
          {/* Synchronize camera movement when incident is chosen */}
          <MapCameraSync selectedIncident={selectedIncident} />

          {/* Render Modern Advanced Markers with Pin */}
          {filteredComplaints.map(complaint => {
            const isSelected = activeMarkerId === complaint.id;
            const colors = getPinColors(complaint);

            return (
              <AdvancedMarker
                key={complaint.id}
                position={complaint.coordinates}
                title={`${complaint.id}: ${complaint.title}`}
                onClick={() => {
                  setActiveMarkerId(complaint.id);
                  onSelectIncident(complaint);
                }}
                zIndex={isSelected ? 100 : 10}
              >
                <Pin
                  background={colors.background}
                  glyphColor={colors.glyphColor}
                  borderColor={isSelected ? '#FFFFFF' : colors.borderColor}
                  scale={isSelected ? 1.25 : 1.0}
                />
              </AdvancedMarker>
            );
          })}

          {/* InfoWindow for Active Marker */}
          {activeComplaint && (
            <InfoWindow
              position={activeComplaint.coordinates}
              onCloseClick={() => setActiveMarkerId(null)}
              pixelOffset={[0, -38]}
            >
              <div className="p-2 max-w-[260px] text-[#111827]">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {activeComplaint.id}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    activeComplaint.status === 'Resolved' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeComplaint.status}
                  </span>
                </div>

                <h4 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[13px] leading-tight mb-1 text-[#111827]">
                  {activeComplaint.title}
                </h4>

                <p className="text-[11px] text-gray-500 flex items-center gap-1 mb-2">
                  <MapPin className="w-3 h-3 text-indigo-600 shrink-0" />
                  <span className="truncate">{activeComplaint.location}</span>
                </p>

                <div className="text-[11px] bg-gray-50 p-2 rounded-lg border border-gray-200 mb-2 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Crew:</span>
                    <span className="font-semibold text-[#111827]">{activeComplaint.assignedCrew}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">SLA:</span>
                    <span className="font-mono font-bold text-indigo-600">{activeComplaint.slaRemaining}</span>
                  </div>
                </div>

                {onOpenDetails && (
                  <button
                    onClick={() => onOpenDetails(activeComplaint)}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span>View Telemetry</span>
                  </button>
                )}
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Map Controls & MapType Selector */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
        <div className="flex bg-white/95 backdrop-blur-md rounded-2xl p-1 border border-gray-200 shadow-md text-[11px] font-bold">
          {(['roadmap', 'satellite', 'terrain'] as const).map(type => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              className={`px-3 py-1.5 rounded-xl capitalize transition-all ${
                mapType === type
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-[#111827] hover:bg-gray-100'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* In-Transit Unit Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-gray-200 flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
        <div>
          <span className="text-[12px] font-extrabold text-[#111827] block leading-tight">
            Rapid Patch Unit 09
          </span>
          <span className="text-[11px] text-gray-500 font-medium">Patrolling Ward 04 • GPS Signal Locked</span>
        </div>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-4 right-4 z-10 bg-white/95 backdrop-blur-md px-4 py-2 rounded-2xl shadow-md border border-gray-200 flex items-center gap-3.5 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
          <span className="font-bold text-[#111827]">Critical Risk</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span className="font-bold text-[#111827]">Active Crew</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
          <span className="font-bold text-[#111827]">Resolved</span>
        </div>
      </div>
    </div>
  );
};
