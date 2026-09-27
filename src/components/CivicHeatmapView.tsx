import React, { useState } from 'react';
import { CivicComplaint } from '../types';
import { 
  Radio, 
  MapPin, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Compass,
  Flame
} from 'lucide-react';
import { CivicLeafletMap } from './CivicLeafletMap';

interface CivicHeatmapViewProps {
  complaints: CivicComplaint[];
  onSelectComplaint: (complaint: CivicComplaint) => void;
  onNavigateToTrack: (complaint: CivicComplaint) => void;
}

export const CivicHeatmapView: React.FC<CivicHeatmapViewProps> = ({
  complaints,
  onSelectComplaint,
  onNavigateToTrack
}) => {
  const [selectedIncident, setSelectedIncident] = useState<CivicComplaint | null>(
    complaints[0] || null
  );

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-8">
      {/* Title & Geospatial Status Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bento-badge-indigo">
              <Radio className="w-3 h-3 text-indigo-600 animate-pulse" />
              Live Geospatial Radar
            </span>
            <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">
              • Delhi NCT Civic Grid (MCD & NDMC) • OpenStreetMap & leaflet.heat
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[32px] font-black text-[#111827] tracking-tight">
            Civic Infrastructure Heatmap & Patrol Telemetry
          </h1>
        </div>

        {/* Geospatial Radar Engine Badge */}
        <div className="flex items-center gap-2 bg-white rounded-2xl px-4 py-2 border border-gray-200 shadow-xs text-[12px] font-bold self-start sm:self-auto">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Compass className="w-4 h-4 text-indigo-600" />
          <span className="text-gray-700">OpenStreetMap Live Radar</span>
          <span className="text-[10px] px-2 py-0.5 rounded-md font-mono bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
            Active
          </span>
        </div>
      </div>

      {/* Main Map Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Map Canvas (8-col) */}
        <div className="lg:col-span-8">
          <CivicLeafletMap
            complaints={complaints}
            selectedIncident={selectedIncident}
            onSelectIncident={(incident) => {
              setSelectedIncident(incident);
              onSelectComplaint(incident);
            }}
            onOpenDetails={(incident) => {
              onSelectComplaint(incident);
              onNavigateToTrack(incident);
            }}
          />
        </div>

        {/* Selected Incident Drawer (4-col) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedIncident ? (
            <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <span className="font-mono text-[13px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  {selectedIncident.id}
                </span>
                <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                  selectedIncident.status === 'Resolved' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                }`}>
                  {selectedIncident.status}
                </span>
              </div>

              {selectedIncident.imageUrl && (
                <div className="h-40 rounded-2xl overflow-hidden border border-gray-200">
                  <img src={selectedIncident.imageUrl} alt={selectedIncident.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold text-[#111827]">
                  {selectedIncident.title}
                </h3>
                <p className="text-[12px] text-gray-400 mt-1 flex items-center gap-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{selectedIncident.location}</span>
                </p>
                <p className="text-[13px] text-gray-600 mt-2 line-clamp-3 font-normal leading-relaxed">
                  {selectedIncident.description}
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-[12px] border border-gray-100">
                <div className="flex justify-between">
                  <span className="text-gray-500">Assigned Crew:</span>
                  <span className="font-bold text-[#111827]">{selectedIncident.assignedCrew}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">SLA Remaining:</span>
                  <span className="font-bold text-indigo-600 font-mono">{selectedIncident.slaRemaining}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pipeline Status:</span>
                  <span className="font-bold text-[#111827]">{selectedIncident.pipelineStepName}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectComplaint(selectedIncident);
                  onNavigateToTrack(selectedIncident);
                }}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <span>Open Full Incident Telemetry</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-8 border border-gray-200 text-center text-gray-400">
              <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-[13px] font-medium">Select a pin on the radar map to inspect incident forensic telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
