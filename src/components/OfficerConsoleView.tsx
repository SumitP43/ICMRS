import React, { useState, useEffect } from 'react';
import { CivicComplaint, OfficerNote, ComplaintStatusHistoryEntry } from '../types';
import { 
  ShieldCheck, 
  Users, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  Send, 
  AlertCircle,
  Filter,
  PlusCircle,
  Radio,
  FileCheck,
  Volume2,
  VolumeX,
  Bell,
  MapPin,
  Camera,
  MessageSquare
} from 'lucide-react';
import { 
  isMuted, 
  toggleMuted, 
  subscribeMuteChange, 
  playNewComplaintChime, 
  playCriticalEscalationChime 
} from '../audio/audioNotificationService';
import { ICMRSLogo } from './ICMRSBranding';
import { PriorityBadge } from './PriorityBadge';

interface OfficerConsoleViewProps {
  complaints: CivicComplaint[];
  onUpdateComplaint: (updated: CivicComplaint) => void;
  onOpenNotes: (complaint: CivicComplaint) => void;
  onOpenUploadPhoto: (complaint: CivicComplaint) => void;
}

export const OfficerConsoleView: React.FC<OfficerConsoleViewProps> = ({
  complaints,
  onUpdateComplaint,
  onOpenNotes,
  onOpenUploadPhoto
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('Active');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastSent, setBroadcastSent] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(!isMuted());
  const [chimePlaying, setChimePlaying] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMuteChange((muted) => {
      setSoundEnabled(!muted);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleSound = () => {
    const nextMuted = toggleMuted();
    setSoundEnabled(!nextMuted);
    if (!nextMuted) {
      playNewComplaintChime(true);
    }
  };

  const handleTestChime = (type: 'new' | 'escalation') => {
    setChimePlaying(type);
    if (type === 'new') {
      playNewComplaintChime(true);
    } else {
      playCriticalEscalationChime(true);
    }
    setTimeout(() => setChimePlaying(null), 800);
  };

  const filtered = complaints.filter(c => {
    if (filterCategory !== 'All' && c.category !== filterCategory) return false;
    if (filterStatus === 'Active' && c.status === 'Resolved') return false;
    if (filterStatus === 'Resolved' && c.status !== 'Resolved') return false;
    return true;
  });

  const handleAdvanceStep = (complaint: CivicComplaint) => {
    const nextStep = Math.min(complaint.pipelineStep + 1, 5);
    const stepNames: Record<number, string> = {
      1: 'Step 1 of 5: Telemetry Received & Dispatched',
      2: 'Step 2 of 5: Work Order Issued',
      3: 'Step 3 of 5: Asphalt / Field Crew Deployed',
      4: 'Step 4 of 5: Site Remediation Active',
      5: 'Step 5 of 5: Certified Sign-off'
    };

    const isResolved = nextStep === 5;
    const now = new Date().toISOString();

    const historyEntry: ComplaintStatusHistoryEntry = {
      status: isResolved ? 'Resolved' : 'In Progress',
      timestamp: now,
      updatedBy: 'Elena Vance (Ward Officer 04)',
      role: 'officer',
      notes: isResolved 
        ? 'Remediation completed and certified in compliance with Municipal Safety Standard §42'
        : `Pipeline advanced: ${stepNames[nextStep]}`
    };

    const updated: CivicComplaint = {
      ...complaint,
      pipelineStep: nextStep,
      pipelineStepName: stepNames[nextStep],
      pipelinePercent: nextStep * 20,
      status: isResolved ? 'Resolved' : 'In Progress',
      slaStatus: isResolved ? 'resolved' : complaint.slaStatus,
      slaRemaining: isResolved ? 'Certified Closed' : complaint.slaRemaining,
      resolvedTime: isResolved ? 'Just now' : complaint.resolvedTime,
      resolutionDetails: isResolved 
        ? (complaint.resolutionDetails || 'Full remediation completed. Certified in compliance with Municipal Safety Standard §42.') 
        : complaint.resolutionDetails,
      statusHistory: [...(complaint.statusHistory || []), historyEntry],
      updatedAt: now,
      inspector: isResolved ? {
        name: 'Elena Vance',
        title: 'Ward Officer 04',
        avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
      } : complaint.inspector,
      afterImageUrl: isResolved && !complaint.afterImageUrl ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2l8HaUVF9slNV9YxOmbqq1WjycFPXVErGy_cOc0QCGQTRJQsKGTtoIjrQ3EbbZ_293VRfFB0jDzrilVBQFy2m8gLtbeuD-imZ-bfwsLmZjdMPV6jb41KKUghwKP2j1Qow8xFhNXJ5JWJnw4pbdWF2Xn9JX4080XkmGAxy7u85Xf-udf8rFj2tvGwU7OqPN7YyM0Y6R9YYhnXFmrqsXdeSBkS-wrpMWM-PUyU8gSxE5zs9b5LofG3rIw' : complaint.afterImageUrl,
      officerNotes: [
        ...complaint.officerNotes,
        {
          id: `note-${Date.now()}`,
          author: 'Elena Vance',
          role: 'Ward Officer 04',
          time: 'Just now',
          text: `Advanced stage to ${stepNames[nextStep]}. Field units coordinated.`
        }
      ]
    };

    onUpdateComplaint(updated);
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;
    setBroadcastSent(true);
    setTimeout(() => {
      setBroadcastSent(false);
      setBroadcastMessage('');
    }, 2500);
  };

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-8">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        <div className="flex items-start sm:items-center gap-4">
          <ICMRSLogo 
            variant="emblem" 
            size="lg" 
            className="ring-2 ring-indigo-500/20 shadow-md shrink-0 hidden sm:inline-flex" 
          />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bento-badge-indigo">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Officer Terminal • Level-3 Authorization
              </span>
              <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">• Node #DELHI-CMD-01</span>
            </div>
            <h1 className="font-['Plus_Jakarta_Sans'] text-[32px] font-black text-[#111827] tracking-tight">
              Delhi Municipal Officer Console (MCD &amp; NDMC)
            </h1>
            <p className="text-[14px] text-gray-500 mt-1 max-w-2xl font-medium">
              Active command desk for triage officer <span className="font-semibold text-[#111827]">Elena Vance</span>. Coordinate rapid patch crews, verify forensic proofs, and manage SLAs across Delhi zones.
            </p>
          </div>
        </div>

        {/* Quick Officer Stat Indicators & Sound Notification Center */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          {/* Audio Chime Notification Widget */}
          <div className="w-full sm:w-auto bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="officer-toggle-chime-btn"
                onClick={handleToggleSound}
                title={soundEnabled ? "Mute audio alerts" : "Enable audio alerts"}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  soundEnabled
                    ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </button>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${soundEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`}></span>
                  <span className="text-[11px] uppercase font-bold text-gray-700 block">
                    {soundEnabled ? 'Chime Active' : 'Chime Muted'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 block truncate max-w-[120px] sm:max-w-none">
                  New &amp; Escalated Alerts
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200"></div>

            {/* Test buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                id="test-new-complaint-chime-btn"
                onClick={() => handleTestChime('new')}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  chimePlaying === 'new'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title="Preview subtle two-tone chime for newly filed complaints"
              >
                <Bell className="w-3 h-3 text-indigo-500" />
                <span>Test</span>
              </button>

              <button
                type="button"
                id="test-escalation-chime-btn"
                onClick={() => handleTestChime('escalation')}
                className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  chimePlaying === 'escalation'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-gray-50 text-rose-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Preview alert chime for priority escalation"
              >
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span>Alert</span>
              </button>
            </div>
          </div>

          <div className="flex-1 sm:flex-initial min-w-[120px] bg-white px-4 sm:px-5 py-3 rounded-2xl border border-gray-200 shadow-sm text-left sm:text-right">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-400 block">Open In Queue</span>
            <span className="font-['Plus_Jakarta_Sans'] font-black text-[20px] sm:text-[22px] text-indigo-600">
              {complaints.filter(c => c.status !== 'Resolved').length} Active
            </span>
          </div>
          <div className="flex-1 sm:flex-initial min-w-[120px] bg-white px-4 sm:px-5 py-3 rounded-2xl border border-gray-200 shadow-sm text-left sm:text-right">
            <span className="text-[10px] sm:text-[11px] uppercase font-bold text-gray-400 block">SLA Compliance</span>
            <span className="font-['Plus_Jakarta_Sans'] font-black text-[20px] sm:text-[22px] text-green-600">
              99.4%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Incident Queue Table + Broadcast Box */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
        {/* Main 8-col: Incident Cards Stack */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Filter Controls - Stacked & Mobile Responsive */}
            <div className="p-4 sm:p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-indigo-600" />
                  <span className="text-[14px] sm:text-[15px] font-extrabold text-[#111827]">Incident Triage Matrix</span>
                </div>
                <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {filtered.length} {filtered.length === 1 ? 'case' : 'cases'}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
                {/* Status Toggle - Full Width On Mobile for Easy Tapping */}
                <div className="grid grid-cols-3 sm:flex bg-gray-100/90 rounded-xl p-1 text-[11px] sm:text-[12px] font-bold gap-1">
                  {['All', 'Active', 'Resolved'].map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setFilterStatus(st)}
                      className={`py-2 px-3 sm:py-1.5 rounded-lg text-center transition-all min-h-[38px] sm:min-h-0 cursor-pointer ${
                        filterStatus === st 
                          ? 'bg-white text-indigo-700 shadow-xs font-black' 
                          : 'text-gray-600 hover:text-[#111827]'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Category Dropdown */}
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2.5 sm:py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] sm:text-[13px] text-[#111827] font-semibold focus:outline-none focus:border-indigo-600 min-h-[44px] sm:min-h-0 cursor-pointer"
                >
                  <option value="All">All Categories ({complaints.length})</option>
                  <option value="Roads & Bridges">Roads &amp; Bridges</option>
                  <option value="Electrical & Lighting">Electrical &amp; Lighting</option>
                  <option value="Water & Sanitation">Water &amp; Sanitation</option>
                  <option value="Public Safety & Transit">Public Safety &amp; Transit</option>
                  <option value="Parks & Forestry">Parks &amp; Forestry</option>
                </select>
              </div>
            </div>

            {/* Vertically Stacked Incident Cards */}
            <div className="p-3.5 sm:p-6 space-y-4 bg-slate-50/40">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-dashed border-gray-200 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="font-['Plus_Jakarta_Sans'] text-[16px] sm:text-[18px] font-bold text-gray-900 mb-1">
                    No Incidents In Selected Filter
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-4">
                    All priority dispatches matching this criteria have been resolved or addressed by municipal crews.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setFilterStatus('All'); setFilterCategory('All'); }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Reset Filter View
                  </button>
                </div>
              ) : (
                filtered.map(item => (
                  <div 
                    key={item.id} 
                    className={`bg-white rounded-2xl sm:rounded-3xl border transition-all duration-200 p-4 sm:p-5 flex flex-col gap-3.5 ${
                      item.priority === 'Critical' && item.status !== 'Resolved'
                        ? 'border-red-200/90 shadow-xs hover:border-red-300 ring-1 ring-red-100/60'
                        : item.status === 'Resolved'
                        ? 'border-emerald-200/80 bg-emerald-50/20 shadow-xs'
                        : 'border-gray-200 shadow-xs hover:border-indigo-200 hover:shadow-sm'
                    }`}
                  >
                    {/* Top Row: Case ID, Priority, Category, and SLA Timer */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-mono text-[12px] sm:text-[13px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2.5 py-0.5 rounded-lg tracking-wide">
                          {item.id}
                        </span>
                        <PriorityBadge priority={item.priority} size="sm" />
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-50 border border-gray-200/80 px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                      </div>

                      {/* SLA Timer Indicator */}
                      <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-gray-600 bg-gray-100/90 px-2.5 py-0.5 rounded-lg shrink-0">
                        <Clock className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{item.slaRemaining || 'SLA Active'}</span>
                      </div>
                    </div>

                    {/* Incident Title & Clear Location Information */}
                    <div>
                      <h4 className="font-['Plus_Jakarta_Sans'] text-[15px] sm:text-[17px] font-black text-[#111827] leading-snug break-words">
                        {item.title}
                      </h4>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-[12px] sm:text-[13px] text-gray-600 font-medium">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          <span className="truncate">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Users className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">
                            Crew: <strong className="text-[#111827] font-bold">{item.assignedCrew}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0 text-gray-500">
                          <span className="truncate">
                            Citizen: <strong className="text-gray-900 font-bold">{item.citizenName || 'Marcus Vance'}</strong> ({item.citizenEmail || item.userEmail || 'citizen@icmrs.gov'})
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pipeline Stage Progress - Full Width on Mobile */}
                    <div className="bg-gray-50/90 rounded-xl p-3 border border-gray-100 space-y-1.5">
                      <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-0.5 text-[11px] sm:text-[12px]">
                        <span className="font-bold text-indigo-950 truncate pr-2">
                          {item.pipelineStepName}
                        </span>
                        <span className="font-mono font-black text-indigo-600 shrink-0">
                          {item.pipelinePercent}% Completed
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            item.status === 'Resolved'
                              ? 'bg-emerald-500'
                              : 'bg-gradient-to-r from-indigo-600 to-blue-600'
                          }`}
                          style={{ width: `${item.pipelinePercent}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons - Stacked or Paired Vertically on Mobile with >=44px Touch Targets */}
                    <div className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      {/* Left: Notes and Forensic Proof Upload Buttons */}
                      <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => onOpenNotes(item)}
                          className="min-h-[44px] px-3.5 py-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-[12px] font-bold text-[#111827] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="View or Add Field Notes"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                          <span>Notes ({(item.officerNotes || []).length})</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenUploadPhoto(item)}
                          className="min-h-[44px] px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 text-indigo-700 border border-indigo-200/80 rounded-xl text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Upload Forensic Proof or Resolution Photo"
                        >
                          <Camera className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{item.afterImageUrl ? 'Proof (1)' : 'Upload Proof'}</span>
                        </button>
                      </div>

                      {/* Right: Advance Stage Action or Certified Resolved Chip */}
                      <div className="w-full sm:w-auto">
                        {item.status !== 'Resolved' ? (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStep(item)}
                            className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-[13px] font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <span>Advance Stage</span>
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-full sm:w-auto min-h-[44px] px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[12px] font-bold rounded-xl flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Signed Off &amp; Resolved</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 4-col: Real-time Dispatch broadcast & Crew Status */}
        <div className="xl:col-span-4 space-y-6">
          {/* Dispatch Advisory Broadcast Tool */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-5 sm:p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] sm:text-[17px] font-extrabold text-[#111827]">
                Delhi Municipal Public Advisory Broadcast
              </h3>
            </div>

            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
              Push emergency notices directly to citizen applet feeds and road transit displays.
            </p>

            {broadcastSent ? (
              <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-[12px] rounded-2xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Advisory pushed to District 04 Civic Feed!</span>
              </div>
            ) : (
              <form onSubmit={handleBroadcast} className="space-y-3.5">
                <textarea
                  rows={3}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="e.g. Traffic lane restriction on Oak Ave due to emergency asphalt remediation..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] focus:bg-white focus:outline-none focus:border-red-500 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="w-full min-h-[44px] py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast Alert</span>
                </button>
              </form>
            )}
          </div>

          {/* Active Crews in Sector */}
          <div className="bg-white rounded-2xl sm:rounded-[32px] p-5 sm:p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[16px] sm:text-[17px] font-extrabold text-[#111827]">
                  Active Field Units
                </h3>
              </div>
              <span className="text-[11px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">3 On-Duty</span>
            </div>

            <div className="space-y-3 text-[12px]">
              <div className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="font-bold text-[#111827] block">Crew 09 (Rapid Patch Unit)</span>
                  <span className="text-[11px] text-gray-500">Location: Oak Ave Crossway</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold">
                  On Site
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="font-bold text-[#111827] block">Tech Team Grid Beta</span>
                  <span className="text-[11px] text-gray-500">Location: Elmwood &amp; Maple</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-[10px] font-bold">
                  Dispatched
                </span>
              </div>

              <div className="p-3.5 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
                <div>
                  <span className="font-bold text-[#111827] block">Urban Forestry Rapid Team</span>
                  <span className="text-[11px] text-gray-500">Location: Pine St Corridor</span>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-bold">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
