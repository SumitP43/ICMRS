import React, { useState, useMemo } from 'react';
import { CivicComplaint, CivicAlert, EmergencyHotline, FAQItem } from '../types';
import { Star, ChevronDown, ChevronUp, AlertCircle, Phone, MapPin, Sparkles, Flame, Radio, X, CheckCircle, Zap, ArrowRight, BarChart3, ShieldCheck } from 'lucide-react';
import { CivicLeafletMap } from './CivicLeafletMap';
import { useAuth } from '../context/AuthContext';

export type MetricFilterType = 'all' | 'active' | 'resolved' | 'sla';

interface CitizenHubViewProps {
  complaints: CivicComplaint[];
  alerts: CivicAlert[];
  hotlines: EmergencyHotline[];
  faqs: FAQItem[];
  onOpenQuickReport: () => void;
  onSelectComplaint: (complaint: CivicComplaint) => void;
  onOpenOfficerNotes: (complaint: CivicComplaint) => void;
  onOpenUploadPhoto: (complaint: CivicComplaint) => void;
  onOpenCivicChat: (initialQuery?: string) => void;
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

  // Metric filter state for the 4 interactive telemetry buttons
  const [activeMetricFilter, setActiveMetricFilter] = useState<MetricFilterType>('all');
  const [isSlaModalOpen, setIsSlaModalOpen] = useState<boolean>(false);

  const displayName = currentUser?.name || 'Marcus Vance';

  // Live dynamic telemetry calculated directly from real complaints data
  const totalCount = complaints.length;
  const activeComplaints = useMemo(() => complaints.filter(c => c.status !== 'Resolved'), [complaints]);
  const resolvedComplaints = useMemo(() => complaints.filter(c => c.status === 'Resolved'), [complaints]);
  const urgentSlaComplaints = useMemo(
    () => complaints.filter(c => c.slaStatus === 'urgent' || c.priority === 'Critical'),
    [complaints]
  );

  const resolutionRate = useMemo(() => {
    if (totalCount === 0) return '100.0';
    return ((resolvedComplaints.length / totalCount) * 100).toFixed(1);
  }, [totalCount, resolvedComplaints.length]);

  const calculatedAvgSla = useMemo(() => {
    if (complaints.length === 0) return '18.4';
    const sum = complaints.reduce((acc, c) => acc + (c.totalSlaHours || 18.4), 0);
    return (sum / complaints.length).toFixed(1);
  }, [complaints]);

  // Complaints dataset displayed in the primary queue based on the active button filter
  const displayedComplaints = useMemo(() => {
    switch (activeMetricFilter) {
      case 'active':
        return activeComplaints;
      case 'resolved':
        return resolvedComplaints;
      case 'sla':
        return urgentSlaComplaints.length > 0
          ? urgentSlaComplaints
          : [...complaints].sort((a, b) => (b.totalSlaHours || 0) - (a.totalSlaHours || 0));
      case 'all':
      default:
        return complaints;
    }
  }, [activeMetricFilter, complaints, activeComplaints, resolvedComplaints, urgentSlaComplaints]);

  const handleMetricClick = (filter: MetricFilterType) => {
    setActiveMetricFilter(filter);
    if (filter === 'sla') {
      setIsSlaModalOpen(true);
    } else {
      // Smooth scroll down to the targeted section
      const targetId = filter === 'resolved' ? 'citizen-resolved-feed' : 'citizen-complaints-feed';
      const targetElement = document.getElementById(targetId) || document.getElementById('citizen-complaints-feed');
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

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
              Civic-OS Connected
            </span>
            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Verified Resident
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[28px] sm:text-[34px] font-black text-[#111827] tracking-tight leading-normal">
            Welcome back, <span className="text-indigo-600">{displayName}</span>
          </h1>
          <p className="text-[14px] text-gray-500 mt-1 font-medium">
            Delhi NCT Civic Pulse is <span className="font-bold text-indigo-600">Active & Monitored</span>. Live public response network across MCD & NDMC zones.
          </p>
        </div>

        {/* Quick Operational Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-center">
          <button 
            type="button"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[#111827] text-[12px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-600">verified_user</span>
            <span>Verified Citizen</span>
          </button>
          <button 
            type="button"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-[#111827] text-[12px] font-bold hover:bg-gray-50 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px] text-indigo-600">share_location</span>
            <span>Oak Ridge Sector</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Grid - Interactive Working Metric Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {/* Metric Button 1 - Total Filed */}
        <button
          id="metric-btn-total-filed"
          type="button"
          onClick={() => handleMetricClick('all')}
          className={`text-left w-full rounded-[28px] sm:rounded-[32px] p-7 border shadow-sm flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            activeMetricFilter === 'all'
              ? 'bg-white border-indigo-500 ring-2 ring-indigo-500 shadow-indigo-100'
              : 'bg-white border-gray-200 hover:border-indigo-300'
          }`}
          aria-label={`Total filed: ${totalCount} civic cases. Click to view all cases.`}
          title="Click to view all filed complaints in the district queue"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Total Filed</span>
              {activeMetricFilter === 'all' && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-extrabold tracking-wider uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[20px]">assignment</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-[44px] text-[#111827] font-extrabold leading-none">
                {totalCount}
              </span>
              <span className="text-[11px] text-indigo-600 font-bold uppercase tracking-wider">Civic Cases</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-gray-500 text-[12px]">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-indigo-600 text-[15px]">history</span>
                <span>Logged since Jan 2025</span>
              </div>
              <span className="text-[11px] font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Filter &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Metric Button 2 - Dark Performance Card with Frequency Bars (Active Investigations) */}
        <button
          id="metric-btn-active-investigations"
          type="button"
          onClick={() => handleMetricClick('active')}
          className={`text-left w-full bg-[#111827] rounded-[28px] sm:rounded-[32px] p-7 text-white shadow-xl flex flex-col justify-between border relative overflow-hidden transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
            activeMetricFilter === 'active'
              ? 'border-indigo-400 ring-2 ring-indigo-400 shadow-indigo-900/50'
              : 'border-gray-800 hover:border-gray-700'
          }`}
          aria-label={`Active investigations: ${activeComplaints.length} crews remediating. Click to filter active cases.`}
          title="Click to filter active cases under field remediation"
        >
          <div className="flex items-center justify-between z-10 w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-bold">Active Investigations</span>
              {activeMetricFilter === 'active' && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[9px] font-extrabold tracking-wider uppercase border border-indigo-400/40">
                  Active
                </span>
              )}
            </div>
            <span className="bg-green-400/20 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              Live On-Site
            </span>
          </div>
          <div className="mt-4 z-10 flex items-end justify-between w-full">
            <div>
              <div className="font-['Plus_Jakarta_Sans'] text-[44px] text-white font-light leading-none">
                {String(activeComplaints.length).padStart(2, '0')}
              </div>
              <div className="text-[11px] text-gray-400 mt-1 font-medium">
                {activeComplaints.length === 1 ? '1 crew remediating' : `${activeComplaints.length} crews remediating`}
              </div>
            </div>
            {/* Visualizer bars from Bento theme */}
            <div className="flex items-end gap-1.5 h-12 w-28">
              <div className="w-full h-1/3 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-2/3 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-1/2 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-full bg-indigo-500 rounded-sm shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse"></div>
              <div className="w-full h-3/4 bg-gray-800 rounded-sm"></div>
              <div className="w-full h-1/2 bg-gray-800 rounded-sm"></div>
            </div>
          </div>
          <div className="absolute inset-0 opacity-10 pointer-events-none bento-dot-grid"></div>
        </button>

        {/* Metric Button 3 - Resolved Cases */}
        <button
          id="metric-btn-resolved-cases"
          type="button"
          onClick={() => handleMetricClick('resolved')}
          className={`text-left w-full rounded-[28px] sm:rounded-[32px] p-7 border shadow-sm flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
            activeMetricFilter === 'resolved'
              ? 'bg-white border-green-500 ring-2 ring-green-500 shadow-green-100'
              : 'bg-white border-gray-200 hover:border-green-200'
          }`}
          aria-label={`Resolved cases: ${resolvedComplaints.length} certified. Click to filter resolved cases.`}
          title="Click to view certified resolved incidents with before/after proof"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Resolved Cases</span>
              {activeMetricFilter === 'resolved' && (
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-extrabold tracking-wider uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="w-10 h-10 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center font-bold transition-transform group-hover:scale-105">
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-[44px] text-[#111827] font-extrabold leading-none">
                {String(resolvedComplaints.length).padStart(2, '0')}
              </span>
              <span className="text-[11px] text-green-600 font-bold uppercase tracking-wider">Certified</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-gray-500">
                <span className="text-green-600 font-bold">{resolutionRate}%</span>
                <span>Quarterly resolution rate</span>
              </div>
              <span className="text-[11px] font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Filter &rarr;
              </span>
            </div>
          </div>
        </button>

        {/* Metric Button 4 - Speed Index / SLA Response */}
        <button
          id="metric-btn-avg-sla-response"
          type="button"
          onClick={() => handleMetricClick('sla')}
          className={`text-left w-full rounded-[28px] sm:rounded-[32px] p-7 border shadow-sm flex flex-col justify-between transition-all duration-200 cursor-pointer group hover:-translate-y-1 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
            activeMetricFilter === 'sla'
              ? 'bg-white border-amber-500 ring-2 ring-amber-500 shadow-amber-100'
              : 'bg-white border-gray-200 hover:border-amber-200'
          }`}
          aria-label={`Average SLA response: ${calculatedAvgSla} hours. Click to inspect district SLA metrics.`}
          title="Click to inspect average SLA response and urgent SLA cases"
        >
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Avg SLA Response</span>
              {activeMetricFilter === 'sla' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-extrabold tracking-wider uppercase">
                  Active
                </span>
              )}
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-lg transition-transform group-hover:scale-105">
              ⚡
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <span className="font-['Plus_Jakarta_Sans'] text-[44px] text-[#111827] font-extrabold leading-none">
                {calculatedAvgSla}
              </span>
              <span className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Hours</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-[12px]">
              <div className="flex items-center gap-1.5 text-green-600 font-bold">
                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px]">4.2h faster</span>
                <span className="text-gray-500 font-normal">than district SLA cap</span>
              </div>
              <span className="text-[11px] font-bold text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                Telemetry &rarr;
              </span>
            </div>
          </div>
        </button>
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
          
          {/* Section 1: Complaints Feed & Milestone Telemetry */}
          <div id="citizen-complaints-feed" className="scroll-mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-[20px]">
                    {activeMetricFilter === 'resolved' ? 'task_alt' : activeMetricFilter === 'sla' ? 'timer' : 'troubleshoot'}
                  </span>
                </div>
                <div>
                  <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] text-[#111827] font-extrabold">
                    {activeMetricFilter === 'all' && 'All Registered Complaints'}
                    {activeMetricFilter === 'active' && 'Active Complaints Under Remediation'}
                    {activeMetricFilter === 'resolved' && 'Resolved Civic Incidents'}
                    {activeMetricFilter === 'sla' && 'Urgent SLA Response Queue'}
                  </h3>
                  <p className="text-[12px] text-gray-500 font-medium">
                    {activeMetricFilter === 'all' && 'Full historical ledger of municipal reports filed across your ward'}
                    {activeMetricFilter === 'active' && 'Real-time telemetry and dispatch milestones for open civic tickets'}
                    {activeMetricFilter === 'resolved' && 'Verified closed tickets with inspector certification records'}
                    {activeMetricFilter === 'sla' && 'Incidents with critical deadlines or escalated SLA targets'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="bento-badge-indigo">
                  {displayedComplaints.length} {displayedComplaints.length === 1 ? 'Incident' : 'Incidents'}
                </span>
                {activeMetricFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveMetricFilter('all')}
                    className="text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 cursor-pointer"
                    title="Reset to all complaints"
                  >
                    <span>Reset Filter</span>
                    <span className="material-symbols-outlined text-[13px]">restart_alt</span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Pill Banner */}
            {activeMetricFilter !== 'all' && (
              <div className="mb-4 px-4 py-2.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                  <span className="font-bold text-indigo-950">
                    Filtered by: <span className="font-extrabold capitalize">{activeMetricFilter === 'sla' ? 'Urgent SLA Response' : activeMetricFilter}</span>
                  </span>
                  <span className="text-gray-500 text-[11px]">({displayedComplaints.length} tickets matching)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveMetricFilter('all')}
                  className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
                >
                  Show all {totalCount} cases &rarr;
                </button>
              </div>
            )}

            {/* Cards Stack */}
            <div className="flex flex-col gap-5">
              {displayedComplaints.length === 0 ? (
                <div className="bg-white rounded-[28px] sm:rounded-[32px] p-10 text-center border border-gray-200 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-[28px]">search_off</span>
                  </div>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold text-[#111827] mb-1">
                    No matching incidents found
                  </h4>
                  <p className="text-[13px] text-gray-500 mb-4 max-w-md font-medium">
                    There are currently no tickets matching the "{activeMetricFilter}" criteria.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMetricFilter('all')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    View All {totalCount} Complaints
                  </button>
                </div>
              ) : (
                displayedComplaints.map(ticket => (
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
              )))}
            </div>
          </div>

          {/* Section 2: Recently Resolved Complaints with Before & After Proof */}
          <div id="citizen-resolved-feed">
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
                View All {resolvedComplaints.length} History →
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
                  Delhi NCT Civic Map & Telemetry
                </h3>
                <p className="text-[12px] text-gray-500 font-medium">
                  Live civic response grid across Delhi Municipal zones (MCD & NDMC) • OpenStreetMap & leaflet.heat
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

      {/* SLA Telemetry & Response Intelligence Modal */}
      {isSlaModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sla-modal-title"
        >
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xl">
                  ⚡
                </div>
                <div>
                  <h3 id="sla-modal-title" className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold leading-tight">
                    District SLA Telemetry & Response
                  </h3>
                  <p className="text-[12px] text-amber-100 font-medium">
                    Metro District 04 Civic Operational Benchmarks
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSlaModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Top 4 KPI metric cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Turnaround</div>
                  <div className="text-[22px] font-black text-amber-950 mt-0.5">{calculatedAvgSla}h</div>
                  <div className="text-[10px] text-amber-700 font-medium">Cap: 24.0h</div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Delta</div>
                  <div className="text-[22px] font-black text-emerald-950 mt-0.5">-4.2h</div>
                  <div className="text-[10px] text-emerald-700 font-medium">Faster than cap</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-indigo-800">Resolution</div>
                  <div className="text-[22px] font-black text-indigo-950 mt-0.5">{resolutionRate}%</div>
                  <div className="text-[10px] text-indigo-700 font-medium">Certified done</div>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-rose-800">Urgent SLA</div>
                  <div className="text-[22px] font-black text-rose-950 mt-0.5">{urgentSlaComplaints.length}</div>
                  <div className="text-[10px] text-rose-700 font-medium">Escalated tickets</div>
                </div>
              </div>

              {/* Department Response Velocities */}
              <div>
                <h4 className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider mb-3">
                  Department Turnaround Velocities
                </h4>
                <div className="space-y-2.5">
                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💧</span>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">Water, Sewer & Hydrology</div>
                        <div className="text-[11px] text-gray-500">Pipeline pressure & burst mains</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-extrabold text-indigo-600">8.2 hrs avg</span>
                      <div className="text-[10px] font-semibold text-emerald-600">98.2% on-time</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🛣️</span>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">Roadways & Pothole Remediation</div>
                        <div className="text-[11px] text-gray-500">Asphalt patching & road debris</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-extrabold text-indigo-600">16.4 hrs avg</span>
                      <div className="text-[10px] font-semibold text-emerald-600">94.5% on-time</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">💡</span>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">Public Lighting & Electrical Grid</div>
                        <div className="text-[11px] text-gray-500">Lamppost outages & traffic signals</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-extrabold text-indigo-600">18.0 hrs avg</span>
                      <div className="text-[10px] font-semibold text-emerald-600">96.0% on-time</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">🌳</span>
                      <div>
                        <div className="text-[13px] font-bold text-gray-900">Parks, Trees & Environmental</div>
                        <div className="text-[11px] text-gray-500">Storm limb hazards & public greens</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[13px] font-extrabold text-indigo-600">21.5 hrs avg</span>
                      <div className="text-[10px] font-semibold text-emerald-600">92.8% on-time</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-[12px] text-indigo-950 leading-relaxed">
                  Citizens who report incidents via the mobile photo sensor trigger automated geofenced routing directly to the closest active municipal crew truck, reducing SLA response times by an average of 4.2 hours.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsSlaModalOpen(false);
                  const targetElement = document.getElementById('citizen-complaints-feed');
                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <span>Filter Urgent SLA Tickets ({urgentSlaComplaints.length})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsSlaModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-gray-100 border border-gray-200 rounded-xl text-[13px] font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Close Telemetry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
