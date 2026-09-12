import React, { useState, useEffect } from 'react';
import { CivicComplaint, OfficerNote } from '../types';
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
  Bell
} from 'lucide-react';
import { 
  isMuted, 
  toggleMuted, 
  subscribeMuteChange, 
  playNewComplaintChime, 
  playCriticalEscalationChime 
} from '../audio/audioNotificationService';
import { ICMRSLogo } from './ICMRSBranding';

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
    const updated: CivicComplaint = {
      ...complaint,
      pipelineStep: nextStep,
      pipelineStepName: stepNames[nextStep],
      pipelinePercent: nextStep * 20,
      status: isResolved ? 'Resolved' : 'In Progress',
      slaStatus: isResolved ? 'resolved' : complaint.slaStatus,
      slaRemaining: isResolved ? 'Certified Closed' : complaint.slaRemaining,
      resolvedTime: isResolved ? 'Just now' : complaint.resolvedTime,
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
        <div className="flex flex-wrap items-center gap-3">
          {/* Audio Chime Notification Widget */}
          <div className="bg-white px-4 py-2.5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="officer-toggle-chime-btn"
                onClick={handleToggleSound}
                title={soundEnabled ? "Mute audio alerts" : "Enable audio alerts"}
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
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
                <span className="text-[10px] text-gray-400 block">
                  New & Escalated Incidents
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-gray-200"></div>

            {/* Test buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                id="test-new-complaint-chime-btn"
                onClick={() => handleTestChime('new')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  chimePlaying === 'new'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
                title="Preview subtle two-tone chime for newly filed complaints"
              >
                <Bell className="w-3 h-3 text-indigo-500" />
                <span>Test New</span>
              </button>

              <button
                type="button"
                id="test-escalation-chime-btn"
                onClick={() => handleTestChime('escalation')}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                  chimePlaying === 'escalation'
                    ? 'bg-rose-600 text-white border-rose-600'
                    : 'bg-gray-50 text-rose-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Preview alert chime for priority escalation"
              >
                <AlertCircle className="w-3 h-3 text-rose-500" />
                <span>Test Escalated</span>
              </button>
            </div>
          </div>

          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm text-right">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">Open In Queue</span>
            <span className="font-['Plus_Jakarta_Sans'] font-black text-[22px] text-indigo-600">
              {complaints.filter(c => c.status !== 'Resolved').length} Active
            </span>
          </div>
          <div className="bg-white px-5 py-3 rounded-2xl border border-gray-200 shadow-sm text-right">
            <span className="text-[11px] uppercase font-bold text-gray-400 block">SLA Compliance</span>
            <span className="font-['Plus_Jakarta_Sans'] font-black text-[22px] text-green-600">
              99.4%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Incident Queue Table + Broadcast Box */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Main 8-col: Dispatch Table */}
        <div className="xl:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm overflow-hidden">
            {/* Table Filter Controls */}
            <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-white">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-600" />
                <span className="text-[14px] font-extrabold text-[#111827]">Incident Triage Matrix</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Status Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1 text-[11px] font-bold gap-1">
                  {['All', 'Active', 'Resolved'].map(st => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        filterStatus === st 
                          ? 'bg-white text-indigo-600 shadow-sm font-extrabold' 
                          : 'text-gray-500 hover:text-[#111827]'
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
                  className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[12px] text-[#111827] font-semibold focus:outline-none focus:border-indigo-600"
                >
                  <option value="All">All Categories</option>
                  <option value="Roads & Bridges">Roads & Bridges</option>
                  <option value="Electrical & Lighting">Electrical & Lighting</option>
                  <option value="Water & Sanitation">Water & Sanitation</option>
                  <option value="Public Safety & Transit">Public Safety & Transit</option>
                  <option value="Parks & Forestry">Parks & Forestry</option>
                </select>
              </div>
            </div>

            {/* Incident Rows */}
            <div className="divide-y divide-gray-100">
              {filtered.map(item => (
                <div key={item.id} className="p-5 sm:p-6 hover:bg-gray-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-mono text-[13px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                        {item.id}
                      </span>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                        item.priority === 'Critical' 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {item.priority} Priority
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">{item.category}</span>
                    </div>

                    <h4 className="font-['Plus_Jakarta_Sans'] text-[16px] font-bold text-[#111827] truncate">
                      {item.title}
                    </h4>

                    <p className="text-[12px] text-gray-500 mt-0.5">
                      📍 {item.location} • Crew: <span className="font-semibold text-[#111827]">{item.assignedCrew}</span>
                    </p>

                    <div className="flex items-center gap-3 mt-2.5">
                      <div className="w-40 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${item.pipelinePercent}%` }}
                        ></div>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600">
                        {item.pipelineStepName}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
                    <button
                      onClick={() => onOpenNotes(item)}
                      className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-[12px] font-bold text-[#111827] transition-all"
                      title="View or Add Notes"
                    >
                      Notes ({item.officerNotes.length})
                    </button>

                    {item.status !== 'Resolved' ? (
                      <button
                        onClick={() => handleAdvanceStep(item)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[12px] font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
                      >
                        <span>Advance Stage</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="px-3.5 py-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold rounded-xl flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                        <span>Signed Off</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 4-col: Real-time Dispatch broadcast & Crew Status */}
        <div className="xl:col-span-4 space-y-6">
          {/* Dispatch Advisory Broadcast Tool */}
          <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
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
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Broadcast Alert</span>
                </button>
              </form>
            )}
          </div>

          {/* Active Crews in Sector */}
          <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
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
                  <span className="text-[11px] text-gray-500">Location: Elmwood & Maple</span>
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
