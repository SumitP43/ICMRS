import React, { useState } from 'react';
import { CivicComplaint, CivicAlert, EmergencyHotline, FAQItem } from '../types';
import { Star, ChevronDown, ChevronUp, AlertCircle, Phone, MapPin, Sparkles, Flame, Radio } from 'lucide-react';
import { CivicLeafletMap } from './CivicLeafletMap';
import { useAuth } from '../context/AuthContext';

interface CitizenHubViewProps {
  complaints: CivicComplaint[];
  alerts: CivicAlert[];
  hotlines: EmergencyHotline[];
  faqs: FAQItem[];
  onOpenQuickReport: () => void;
  onSelectComplaint: (complaint: CivicComplaint) => void;
  onOpenOfficerNotes: (complaint: CivicComplaint) => void;
  onOpenUploadPhoto: (complaint: CivicComplaint) => void;
  onOpenCivicChat: () => void;
  onNavigateToTab: (tab: any) => void;
  onEscalatePriority: (complaintId: string) => void;
  onRateIncident: (complaintId: string, rating: number) => void;
}

export const CitizenHubView: React.FC<CitizenHubViewProps> = ({
  complaints,
  alerts,
  hotlines,
  faqs,
  onOpenQuickReport,
  onSelectComplaint,
  onOpenOfficerNotes,
  onOpenUploadPhoto,
  onOpenCivicChat,
  onNavigateToTab,
  onEscalatePriority,
  onRateIncident
}) => {
  const { currentUser } = useAuth();
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);
  const [emergencyAlertDialed, setEmergencyAlertDialed] = useState<string | null>(null);

  const displayName = currentUser?.name || 'Marcus Vance';
  const citizenToken = currentUser?.badgeNumber || 'CT-88942-X';

  const activeComplaints = complaints.filter(c => c.status !== 'Resolved');
  const resolvedComplaints = complaints.filter(c => c.status === 'Resolved');

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const handleDialHotline = (hotline: EmergencyHotline) => {
    setEmergencyAlertDialed(hotline.number);
    setTimeout(() => {
      setEmergencyAlertDialed(null);
    }, 3000);
  };

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Top Welcome Matrix & Pulse Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bento-badge-indigo">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
              Civic-OS v4.2 Connected
            </span>
            <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">• Citizen Token #{citizenToken}</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-black text-[#111827] tracking-tight leading-normal">
            Welcome back, <span className="text-indigo-600">{displayName}</span>
          </h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium">
            Metro District 04 Civic Pulse is <span className="font-bold text-indigo-600">Active & Monitored</span>. 2 ongoing field dispatches near your registered zone.
          </p>
        </div>

        {/* Quick Operational Action Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-center">
          <button 
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[#111827] text-[12px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-600">verified_user</span>
            <span>Verified Voter ID Active</span>
          </button>
          <button 
            type="button"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-[#111827] text-[12px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-600">share_location</span>
            <span>Oak Ridge Sector</span>
          </button>
        </div>
      </div>

      {/* Live Bento Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Bento Stat 1 - Total Filed */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Filed</span>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-[44px] text-[#111827] font-extrabold leading-none">14</span>
              <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">Civic Cases</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-gray-500 text-[12px]">
              <span className="material-symbols-outlined text-indigo-600 text-[15px]">history</span>
              <span>Logged since Jan 2025</span>
            </div>
          </div>
        </div>

        {/* Bento Stat 2 - Dark Performance Card with Frequency Bars */}
        <div className="bg-[#111827] rounded-[28px] sm:rounded-[32px] p-7 text-white shadow-xl flex flex-col justify-between border border-gray-800 relative overflow-hidden">
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Active Investigations</span>
            <span className="bg-green-400/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/30">
              Live On-Site
            </span>
          </div>
          <div className="mt-4 z-10 flex items-end justify-between">
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-[44px] text-white font-light leading-none">02</div>
              <div className="text-[11px] text-gray-400 mt-1 font-medium">Crews remediating</div>
            </div>
            {/* Visualizer bars from Bento theme */}
            <div className="flex items-end gap-1.5 h-12 w-28">
              <div className="w-full h-1/3 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-2/3 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-1/2 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-full bg-indigo-500 rounded-sm shadow-[0_0_12px_rgba(99,102,241,0.6)]"></div>
              <div className="w-full h-3/4 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-1/2 bg-gray-800 rounded-sm"></div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 pointer-events-none bento-dot-grid"></div>
        </div>

        {/* Bento Stat 3 - Resolved Cases */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Resolved Cases</span>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-bold">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-[44px] text-[#111827] font-extrabold leading-none">12</span>
              <span className="text-[11px] text-green-600 font-bold uppercase tracking-wider">Certified</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-gray-500 text-[12px]">
              <span className="text-green-600 font-bold">85.7%</span>
              <span>Quarterly resolution rate</span>
            </div>
          </div>
        </div>

        {/* Bento Stat 4 - Speed Index / SLA Response */}
        <div className="bg-white rounded-[28px] sm:rounded-[32px] p-7 border border-gray-200 shadow-sm flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Avg SLA Response</span>
            <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-lg">
              ⚡
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-[44px] text-[#111827] font-extrabold leading-none">18.4</span>
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Hours</span>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-green-600 text-[12px] font-bold">
              <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px]">4.2h faster</span>
              <span className="text-gray-500 font-normal">than district SLA cap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Bento Hero Strip */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-[#1e1b4b] to-[#111827] rounded-[32px] p-8 sm:p-10 text-white shadow-xl overflow-hidden mb-10 border border-indigo-950">
        {/* Dot pattern background from Bento theme */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bento-dot-grid"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-indigo-300 text-[10px] font-bold mb-3 tracking-widest uppercase border border-white/15">
              <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
              AI-ENHANCED CIVIC DISPATCH ENGINE
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-extrabold text-white tracking-tight leading-tight">
              Notice a Municipal Issue in Your Ward?
            </h2>
            <p className="text-[14px] text-gray-300 mt-2.5 leading-relaxed font-normal">
              Report hazards, potholes, water leaks, or lighting issues in under 60 seconds. Our neural engine captures high-resolution GPS telemetry, generates severity scores, and routes directly to the assigned field crew.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
            <button 
              onClick={onOpenQuickReport}
              id="quickReportBtn"
              className="flex items-center justify-center gap-2.5 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-bold rounded-xl shadow-lg active:scale-95 transition-all group"
            >
              <div className="w-5 h-5 rounded-full border-2 border-indigo-400 flex items-center justify-center text-xs font-bold leading-none">
                +
              </div>
              <span>File Complaint Now</span>
              <span className="ml-2 px-2 py-0.5 bg-indigo-800/80 rounded-md text-indigo-200 text-[11px] font-mono">
                ⌘ + N
              </span>
            </button>
            <a 
              href="#quickTrack"
              className="flex items-center justify-center gap-2 px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white text-[14px] font-bold rounded-xl transition-colors border border-white/10"
            >
              <span className="material-symbols-outlined text-[18px]">travel_explore</span>
              <span>View Radar Map</span>
            </a>
          </div>
        </div>
      </div>

      {/* Core Grid Area: Active Queue + Real-Time Sidebar */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main Content Column: Active Complaints + Recently Resolved Cards */}
        <div className="xl:col-span-8 flex flex-col gap-10">
          
          {/* Section 1: Active Complaints Under Investigation */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] text-[#111827] font-extrabold">
                    Active Complaints
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium">
                    Real-time telemetry and dispatch milestones for your open civic tickets
                  </p>
                </div>
              </div>
              <span className="bento-badge-indigo">
                {activeComplaints.length} Open Investigations
              </span>
            </div>

            {/* Cards Stack */}
            <div className="flex flex-col gap-5">
              {activeComplaints.map(ticket => (
                <div 
                  key={ticket.id}
                  className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm hover:shadow-md transition-all border border-gray-200 flex flex-col"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-3 py-1 bg-gray-100 font-mono text-[12px] text-indigo-600 font-bold rounded-xl">
                        {ticket.id}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[11px] font-bold border border-indigo-100 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                        {ticket.status}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-[11px] font-semibold">
                        {ticket.category}
                      </span>
                    </div>

                    {/* SLA Countdown Pill */}
                    <div className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold self-start sm:self-auto ${
                      ticket.slaStatus === 'urgent' 
                        ? 'bg-red-50 text-red-700 border border-red-200' 
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                    }`}>
                      {ticket.slaStatus === 'urgent' ? (
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                      ) : null}
                      <span className="material-symbols-outlined text-[14px]">
                        {ticket.slaStatus === 'urgent' ? 'timer' : 'access_time'}
                      </span>
                      <span>{ticket.slaRemaining}</span>
                    </div>
                  </div>

                  {/* Ticket Content & Image Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-4">
                    {ticket.imageUrl && (
                      <div className="md:col-span-3">
                        <div className="h-32 w-full rounded-2xl overflow-hidden relative shadow-inner bg-gray-100 border border-gray-100">
                          <img 
                            className="w-full h-full object-cover" 
                            alt={ticket.imageAlt || ticket.title}
                            src={ticket.imageUrl}
                          />
                          <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-lg bg-white/95 text-[10px] font-bold text-[#111827] shadow-sm">
                            {ticket.nodeCode || 'GPS Tagged'}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className={`${ticket.imageUrl ? 'md:col-span-9' : 'md:col-span-12'} flex flex-col justify-between`}>
                      <div>
                        <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#111827] font-extrabold mb-1.5">
                          {ticket.title}
                        </h4>
                        <p className="text-[13px] text-gray-600 line-clamp-2 leading-relaxed font-normal">
                          {ticket.description}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-4 text-gray-500 text-[12px] font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">pin_drop</span>
                          {ticket.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">engineering</span>
                          {ticket.assignedCrew}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-indigo-600">schedule</span>
                          {ticket.timeLogged}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Live Progress Stepper - Bento Sub-card */}
                  <div className="pt-3 mt-1 bg-gray-50 p-5 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] text-[#111827] font-bold">Investigation Pipeline</span>
                        <span className="text-[11px] text-indigo-600 font-bold">• {ticket.pipelineStepName}</span>
                      </div>
                      <span className="font-mono text-[13px] text-[#111827] font-bold">{ticket.pipelinePercent}% Complete</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden mb-4">
                      <div 
                        className="h-full rounded-full transition-all duration-500 bg-indigo-600"
                        style={{ width: `${ticket.pipelinePercent}%` }}
                      ></div>
                    </div>
                    {/* 5 Milestone Steps */}
                    <div className="grid grid-cols-5 text-center text-[11px] gap-1">
                      <div className={`${ticket.pipelineStep >= 1 ? 'text-indigo-600 font-bold' : 'text-gray-400'} flex flex-col items-center`}>
                        <span className="material-symbols-outlined text-[15px]">
                          {ticket.pipelineStep > 1 ? 'check_circle' : 'pending'}
                        </span>
                        <span className="mt-0.5">Received</span>
                      </div>
                      <div className={`${ticket.pipelineStep >= 2 ? 'text-indigo-600 font-bold' : 'text-gray-400'} flex flex-col items-center`}>
                        <span className="material-symbols-outlined text-[15px]">
                          {ticket.pipelineStep > 2 ? 'check_circle' : ticket.pipelineStep === 2 ? 'pending' : 'radio_button_unchecked'}
                        </span>
                        <span className="mt-0.5">Verified</span>
                      </div>
                      <div className={`${ticket.pipelineStep >= 3 ? 'text-indigo-600 font-black' : 'text-gray-400'} flex flex-col items-center`}>
                        <span className={`material-symbols-outlined text-[15px] ${ticket.pipelineStep === 3 ? 'animate-bounce text-indigo-600' : ''}`}>
                          {ticket.pipelineStep > 3 ? 'check_circle' : ticket.pipelineStep === 3 ? 'pending' : 'radio_button_unchecked'}
                        </span>
                        <span className="mt-0.5">Dispatched</span>
                      </div>
                      <div className={`${ticket.pipelineStep >= 4 ? 'text-indigo-600 font-bold' : 'text-gray-400'} flex flex-col items-center`}>
                        <span className="material-symbols-outlined text-[15px]">
                          {ticket.pipelineStep >= 4 ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className="mt-0.5">Site Remediation</span>
                      </div>
                      <div className={`${ticket.pipelineStep >= 5 ? 'text-indigo-600 font-bold' : 'text-gray-400'} flex flex-col items-center`}>
                        <span className="material-symbols-outlined text-[15px]">
                          {ticket.pipelineStep >= 5 ? 'check_circle' : 'radio_button_unchecked'}
                        </span>
                        <span className="mt-0.5">Sign-off</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Bar inside Card */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mt-5 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => onOpenUploadPhoto(ticket)}
                        className="px-3.5 py-2 rounded-xl bg-gray-100 text-[#111827] text-[11px] font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px] text-indigo-600">add_photo_alternate</span>
                        <span>Upload New Photo</span>
                      </button>
                      <button 
                        onClick={() => onOpenOfficerNotes(ticket)}
                        className="px-3.5 py-2 rounded-xl bg-gray-100 text-[#111827] text-[11px] font-bold hover:bg-gray-200 transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[15px] text-indigo-600">chat</span>
                        <span>Officer Notes ({ticket.officerNotes.length})</span>
                      </button>
                      {ticket.priority !== 'Critical' && (
                        <button 
                          onClick={() => onEscalatePriority(ticket.id)}
                          className="px-3.5 py-2 rounded-xl bg-red-50 text-red-700 text-[11px] font-bold hover:bg-red-100 transition-colors flex items-center gap-1 border border-red-100"
                        >
                          <span className="material-symbols-outlined text-[14px]">priority_high</span>
                          <span>Escalate Priority</span>
                        </button>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        onSelectComplaint(ticket);
                        onNavigateToTab('track-status');
                      }}
                      className="text-indigo-600 text-[13px] font-bold hover:text-indigo-700 flex items-center gap-1 group ml-auto"
                    >
                      <span>Detailed Live Feed</span>
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Recently Resolved Complaints with Before & After Proof */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] text-[#111827] font-extrabold">
                    Recently Resolved Incidents
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium">
                    Verified before & after forensic documentation with certified officer sign-off
                  </p>
                </div>
              </div>
              <button 
                onClick={() => onNavigateToTab('resolution-and-feedback')}
                className="text-[12px] text-indigo-600 font-bold hover:underline"
              >
                View All 12 History →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {resolvedComplaints.map(resolved => (
                <div 
                  key={resolved.id}
                  className="bg-white rounded-[28px] p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-gray-100 rounded-xl font-mono text-[12px] text-[#111827] font-bold">
                        {resolved.id}
                      </span>
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[11px] font-bold rounded-full flex items-center gap-1 border border-indigo-100">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {resolved.resolvedTime}
                      </span>
                    </div>
                    <h4 className="font-['Plus_Jakarta_Sans'] text-[17px] text-[#111827] font-extrabold mb-1">
                      {resolved.title}
                    </h4>
                    <p className="text-[12px] text-gray-500 mb-4 line-clamp-2">
                      {resolved.description}
                    </p>

                    {/* Dual Before/After Thumbnails */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="relative rounded-2xl overflow-hidden h-28 bg-gray-100 shadow-inner border border-gray-100">
                        <img 
                          className="w-full h-full object-cover" 
                          alt={resolved.beforeImageAlt || 'Before repair photograph'} 
                          src={resolved.beforeImageUrl} 
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[9px] font-black tracking-widest uppercase">
                          BEFORE
                        </span>
                      </div>
                      <div className="relative rounded-2xl overflow-hidden h-28 bg-gray-100 shadow-inner border border-gray-100">
                        <img 
                          className="w-full h-full object-cover" 
                          alt={resolved.afterImageAlt || 'After repair photograph'} 
                          src={resolved.afterImageUrl} 
                        />
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-indigo-600/90 text-white text-[9px] font-black tracking-widest uppercase">
                          AFTER
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sign-off Metadata Footer */}
                  <div className="bg-gray-50 p-3 rounded-2xl flex items-center justify-between border border-gray-100">
                    <div className="flex items-center gap-2.5">
                      {resolved.inspector?.avatar ? (
                        <img 
                          alt={resolved.inspector.name} 
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100" 
                          src={resolved.inspector.avatar}
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px]">
                          {resolved.inspector?.initials || 'OFF'}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-[#111827] leading-tight">
                          {resolved.inspector?.name}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {resolved.inspector?.title}
                        </span>
                      </div>
                    </div>

                    {/* Interactive 5-Star Citizen Rating */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((starIdx) => {
                        const currentRating = resolved.rating || 5;
                        const isFilled = starIdx <= Math.floor(currentRating);
                        return (
                          <button
                            key={starIdx}
                            onClick={() => onRateIncident(resolved.id, starIdx)}
                            className="hover:scale-125 transition-transform"
                            title={`Rate ${starIdx} stars`}
                          >
                            <span 
                              className="material-symbols-outlined text-[16px]"
                              style={{ fontVariationSettings: `'FILL' ${isFilled ? 1 : 0}` }}
                            >
                              star
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: District Geospatial Active Radar Preview */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-8 shadow-sm border border-gray-200" id="quickTrack">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] text-[#111827] font-extrabold">
                  District 04 Ward Map
                </h3>
                <p className="text-[12px] text-gray-500 font-medium">
                  Live civic response geofence around your registered address (Radius: 2.5 km) • OpenStreetMap & leaflet.heat
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-bold bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  Leaflet Engine Active
                </span>
                <button
                  onClick={() => onNavigateToTab('civic-heatmap')}
                  className="text-[11px] text-indigo-600 font-bold hover:underline ml-2"
                >
                  Full Radar View →
                </button>
              </div>
            </div>

            {/* Embedded Live Leaflet OpenStreetMap */}
            <CivicLeafletMap
              complaints={complaints}
              onSelectIncident={(c) => {
                onSelectComplaint(c);
              }}
              onOpenDetails={(c) => {
                onSelectComplaint(c);
                onNavigateToTab('track-status');
              }}
            />
          </div>
        </div>

        {/* Right Column: Sidebar Feeds, Hotlines & Citizen FAQs */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Widget 1: Real-Time Municipal Alerts Feed */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[18px]">campaign</span>
                </div>
                <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#111827] font-extrabold">
                  Civic Alerts Feed
                </h4>
              </div>
              <span className="bento-badge-indigo">
                Live
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {alerts.map(alert => (
                <div key={alert.id} className="p-3.5 bg-gray-50 rounded-2xl flex items-start gap-3 border border-gray-100 hover:border-indigo-100 transition-colors">
                  <span className={`p-2 rounded-xl shrink-0 ${
                    alert.badgeStyle === 'water' 
                      ? 'bg-blue-50 text-blue-600' 
                      : alert.badgeStyle === 'cleaning'
                      ? 'bg-indigo-50 text-indigo-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]">{alert.icon}</span>
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[12px] font-bold text-[#111827] truncate">{alert.title}</span>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">{alert.time}</span>
                    </div>
                    <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">
                      {alert.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 2: Fast Emergency Municipal Hotlines */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 bg-red-50 text-red-600 rounded-xl flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[18px]">phone_in_talk</span>
              </div>
              <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#111827] font-extrabold">
                Emergency Hotlines
              </h4>
            </div>
            <p className="text-[12px] text-gray-500 mb-4 font-normal">
              Direct priority dispatch for immediate hazards posing risk to human life or infrastructure collapse.
            </p>

            {emergencyAlertDialed && (
              <div className="mb-3 p-3 rounded-xl bg-indigo-50 text-indigo-700 text-[12px] font-bold flex items-center gap-2 border border-indigo-100">
                <span className="material-symbols-outlined text-[18px] animate-spin">phone_forwarded</span>
                <span>Connecting directly to Metro Dispatch {emergencyAlertDialed}...</span>
              </div>
            )}

            <div className="space-y-2.5">
              {hotlines.map(item => (
                <div 
                  key={item.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    item.isUrgent 
                      ? 'bg-red-50/50 border-red-200' 
                      : 'bg-gray-50 border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`material-symbols-outlined text-[18px] ${
                      item.isUrgent ? 'text-red-600' : 'text-indigo-600'
                    }`}>
                      {item.icon}
                    </span>
                    <div>
                      <span className="text-[13px] font-bold text-[#111827] block leading-tight">
                        {item.title}
                      </span>
                      <p className="text-[11px] text-gray-400 mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDialHotline(item)}
                    className={`px-3.5 py-1.5 text-[12px] rounded-xl font-bold transition-all ${
                      item.isUrgent 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-white border border-gray-200 text-[#111827] hover:bg-gray-100 shadow-sm'
                    }`}
                  >
                    {item.number}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Widget 3: Quick FAQs & Civic Help */}
          <div className="bg-white rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[18px]">help_center</span>
              </div>
              <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] text-[#111827] font-extrabold">
                Citizen FAQs
              </h4>
            </div>

            <div className="space-y-2.5 text-left" id="faqAccordion">
              {faqs.map(faq => {
                const isOpen = openFaqId === faq.id;
                return (
                  <div key={faq.id} className="bg-gray-50 rounded-2xl p-3.5 transition-colors border border-gray-100">
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full flex items-center justify-between text-left text-[12px] font-bold text-[#111827]"
                    >
                      <span>{faq.question}</span>
                      <span className={`material-symbols-outlined text-gray-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-[12px] text-gray-600 leading-relaxed pt-2 border-t border-gray-200/60 font-normal">
                        {faq.answer}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3.5 flex items-center justify-between border-t border-gray-100">
              <span className="text-[12px] text-gray-500 font-medium">Need direct human assistance?</span>
              <button 
                onClick={onOpenCivicChat}
                className="text-[13px] text-indigo-600 font-bold hover:text-indigo-700 flex items-center gap-1"
              >
                <span>Civic Chat →</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
