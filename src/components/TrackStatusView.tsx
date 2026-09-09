/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CivicComplaint } from '../types';
import { calculateSlaMetrics } from '../utils/slaHelper';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Shield, 
  Truck, 
  AlertTriangle, 
  MessageSquare, 
  Camera, 
  Printer,
  ChevronRight,
  Timer,
  Activity,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface TrackStatusViewProps {
  complaints: CivicComplaint[];
  selectedComplaint: CivicComplaint;
  onSelectComplaint: (complaint: CivicComplaint) => void;
  onOpenOfficerNotes: (complaint: CivicComplaint) => void;
  onOpenUploadPhoto: (complaint: CivicComplaint) => void;
  onEscalatePriority: (complaintId: string) => void;
}

export const TrackStatusView: React.FC<TrackStatusViewProps> = ({
  complaints,
  selectedComplaint,
  onSelectComplaint,
  onOpenOfficerNotes,
  onOpenUploadPhoto,
  onEscalatePriority
}) => {
  const [appealRequested, setAppealRequested] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [matrixFilter, setMatrixFilter] = useState<'all' | 'active' | 'resolved'>('all');

  const steps = [
    { num: 1, name: 'Received', desc: 'Ingested by Telemetry AI' },
    { num: 2, name: 'Verified', desc: 'Ward Officer Validated' },
    { num: 3, name: 'Dispatched', desc: 'Crew Mobilized on Ground' },
    { num: 4, name: 'Site Remediation', desc: 'Active Physical Repair' },
    { num: 5, name: 'Sign-off', desc: 'Certified Forensic Sign-off' },
  ];

  const selectedMetrics = calculateSlaMetrics(selectedComplaint);

  // Filter complaints for the telemetry matrix
  const filteredComplaints = complaints.filter(c => {
    if (matrixFilter === 'active') return c.status !== 'Resolved';
    if (matrixFilter === 'resolved') return c.status === 'Resolved';
    return true;
  });

  // Calculate high-level SLA stats across complaints
  const activeComplaints = complaints.filter(c => c.status !== 'Resolved');
  const urgentCount = activeComplaints.filter(c => c.slaStatus === 'urgent' || c.priority === 'Critical').length;
  const compliantPercent = complaints.length > 0 
    ? Math.round(((complaints.length - urgentCount) / complaints.length) * 100) 
    : 100;

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-8 font-['Inter',sans-serif]">
      {/* Top Banner with SLA Summary Stats */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600">
              <Timer className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 font-mono">
              Metro District 04 Telemetry Engine
            </span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl font-black text-gray-900 tracking-tight">
            Incident Response & SLA Tracker
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Dynamic countdown timers, time-remaining progress gauges, and guaranteed municipal SLA benchmarks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Monitored Cases</span>
            <span className="font-mono text-sm font-extrabold text-gray-900">{complaints.length} Total</span>
          </div>
          <div className="bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">Active In SLA Window</span>
            <span className="font-mono text-sm font-extrabold text-indigo-600">{activeComplaints.length} Active</span>
          </div>
          <div className="bg-gray-50 px-3.5 py-2 rounded-2xl border border-gray-200 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">SLA Compliance Rate</span>
            <span className="font-mono text-sm font-extrabold text-emerald-600">{compliantPercent}% Standard</span>
          </div>
        </div>
      </div>

      {/* Top Selector Ribbon for quick switching among cases */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-gray-400 block">
            Select Incident To Inspect (Visual SLA Progress per Case):
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            Showing {complaints.length} municipal tickets
          </span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none">
          {complaints.map(c => {
            const isCurrent = c.id === selectedComplaint.id;
            const cMetrics = calculateSlaMetrics(c);

            return (
              <button
                key={c.id}
                id={`incident-tab-${c.id}`}
                onClick={() => onSelectComplaint(c)}
                className={`p-4 rounded-2xl text-left border shrink-0 transition-all w-64 cursor-pointer ${
                  isCurrent 
                    ? 'border-indigo-600 bg-white shadow-md ring-2 ring-indigo-600/20' 
                    : 'border-gray-200 bg-gray-50/80 hover:bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-mono text-[12px] font-bold text-indigo-600 truncate">{c.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    c.status === 'Resolved' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : c.priority === 'Critical'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    {c.status}
                  </span>
                </div>

                <p className="text-[13px] font-bold text-[#111827] truncate mt-1">
                  {c.title}
                </p>

                {/* Individual Mini Progress Bar for each complaint */}
                <div className="mt-3 pt-2.5 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-gray-500 font-mono flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-indigo-500" />
                      {cMetrics.isResolved ? 'SLA Fulfilled' : cMetrics.remainingFormatted}
                    </span>
                    <span className={`font-mono font-bold ${
                      cMetrics.isResolved 
                        ? 'text-emerald-700' 
                        : cMetrics.percentLeft <= 25 
                        ? 'text-rose-700' 
                        : 'text-indigo-700'
                    }`}>
                      {cMetrics.isResolved ? '100% Met' : `${cMetrics.percentLeft}% Left`}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div 
                    id={`ribbon-progress-${c.id}`}
                    className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"
                    role="progressbar"
                    aria-valuenow={cMetrics.percentLeft}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${c.id} SLA time left: ${cMetrics.percentLeft}%`}
                  >
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${cMetrics.barColor}`}
                      style={{ width: `${cMetrics.percentLeft}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Track Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 8-col: Stepper, SLA Duration Progress Bar, Details, Photo, Timeline */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] p-7 sm:p-9 border border-gray-200 shadow-sm">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="font-mono text-[13px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    {selectedComplaint.id}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-[#111827] text-[11px] font-bold rounded-full">
                    {selectedComplaint.category}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    selectedComplaint.priority === 'Critical'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : selectedComplaint.priority === 'High'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-gray-100 text-gray-700 border-gray-200'
                  }`}>
                    {selectedComplaint.priority} Priority
                  </span>
                  <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Report
                  </span>
                </div>
                <h2 className="font-['Plus_Jakarta_Sans'] text-[24px] sm:text-[28px] font-extrabold text-[#111827] tracking-tight">
                  {selectedComplaint.title}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1.5 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{selectedComplaint.location}</span>
                  <span className="text-gray-400">• {selectedComplaint.timeLogged}</span>
                </p>
              </div>

              {/* SLA badge */}
              <div className={`px-4 py-2.5 rounded-2xl text-right self-start sm:self-center border transition-all ${
                selectedMetrics.isResolved
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : selectedMetrics.percentLeft <= 25
                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                  : selectedMetrics.percentLeft <= 50
                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
              }`}>
                <span className="text-[10px] uppercase font-extrabold tracking-wider block text-gray-500">
                  SLA Target Window
                </span>
                <span className="font-mono font-bold text-[14px] flex items-center justify-end gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  {selectedMetrics.isResolved ? 'Resolved on Schedule' : selectedComplaint.slaRemaining}
                </span>
                <span className="text-[10px] font-mono text-gray-500 block mt-0.5">
                  {selectedMetrics.totalFormatted} Guaranteed Cap
                </span>
              </div>
            </div>

            {/* Comprehensive Visual SLA Progress Bar Component */}
            <div 
              id={`sla-card-${selectedComplaint.id}`}
              className="py-6 border-b border-gray-100"
            >
              <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-200/80">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="p-1.5 bg-white rounded-lg border border-gray-200 shadow-2xs text-indigo-600">
                      <Timer className="w-4 h-4" />
                    </span>
                    <div>
                      <h3 className="text-[14px] font-extrabold text-[#111827] uppercase tracking-wider font-['Plus_Jakarta_Sans']">
                        SLA Time-Remaining Progress Bar
                      </h3>
                      <p className="text-[11px] text-gray-500">
                        Remaining response time relative to {selectedMetrics.totalHours}h guaranteed total SLA duration
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${selectedMetrics.badgeStyle}`}>
                      {selectedMetrics.statusLabel}
                    </span>
                    <span className="font-mono font-extrabold text-sm text-gray-900 bg-white px-2.5 py-1 rounded-xl border border-gray-200 shadow-2xs">
                      {selectedMetrics.isResolved ? '100% Met' : `${selectedMetrics.percentLeft}% Left`}
                    </span>
                  </div>
                </div>

                {/* Primary Visual Progress Bar */}
                <div className="space-y-2">
                  <div 
                    id={`sla-progress-bar-${selectedComplaint.id}`}
                    className="w-full bg-gray-200 rounded-full h-4 overflow-hidden p-0.5 border border-gray-300 shadow-inner"
                    role="progressbar"
                    aria-valuenow={selectedMetrics.percentLeft}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`SLA time remaining: ${selectedMetrics.percentLeft}%`}
                  >
                    <div 
                      className={`h-full rounded-full transition-all duration-700 relative ${selectedMetrics.barColor}`}
                      style={{ width: `${selectedMetrics.percentLeft}%` }}
                    >
                      {selectedMetrics.percentLeft > 18 && (
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-[10px] font-mono font-bold text-white drop-shadow-xs">
                          {selectedMetrics.percentLeft}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scale Markers */}
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium font-mono px-1">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      <span>0h (SLA Breach)</span>
                    </span>
                    <span className="hidden sm:inline text-gray-400">
                      50% Midpoint ({selectedMetrics.totalHours * 0.5}h)
                    </span>
                    <span className="flex items-center gap-1 text-gray-700 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      <span>{selectedMetrics.totalFormatted} Total Duration</span>
                    </span>
                  </div>
                </div>

                {/* Detailed SLA KPIs Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-200/80">
                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Time Left
                    </span>
                    <p className="text-[15px] font-extrabold font-mono text-[#111827] mt-0.5 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-600" />
                      {selectedMetrics.isResolved ? 'Resolved' : selectedMetrics.remainingFormatted}
                    </p>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      {selectedMetrics.isResolved ? 'Signed-off by Inspector' : `${selectedMetrics.percentLeft}% of SLA window`}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Elapsed Time
                    </span>
                    <p className="text-[15px] font-extrabold font-mono text-[#111827] mt-0.5 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-gray-400" />
                      {selectedMetrics.elapsedFormatted}
                    </p>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      {selectedMetrics.percentElapsed}% response time used
                    </span>
                  </div>

                  <div className="bg-white rounded-xl p-3.5 border border-gray-200 shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">
                      Guaranteed SLA Target
                    </span>
                    <p className="text-[15px] font-extrabold font-mono text-[#111827] mt-0.5 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      {selectedMetrics.totalFormatted}
                    </p>
                    <span className="text-[11px] text-gray-500 mt-0.5 block">
                      Civic Code Standard: <span className="font-semibold text-gray-700">{selectedComplaint.priority}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Graphic */}
            <div className="py-7 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[13px] font-extrabold text-[#111827] uppercase tracking-wider">
                  Investigation Pipeline
                </span>
                <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-full">
                  {selectedComplaint.pipelineStepName} ({selectedComplaint.pipelinePercent}%)
                </span>
              </div>

              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-6">
                <div 
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-700"
                  style={{ width: `${selectedComplaint.pipelinePercent}%` }}
                ></div>
              </div>

              {/* 5 Steps Matrix */}
              <div className="grid grid-cols-5 gap-2">
                {steps.map(step => {
                  const isDone = selectedComplaint.pipelineStep > step.num;
                  const isCurrent = selectedComplaint.pipelineStep === step.num;
                  return (
                    <div key={step.num} className="text-center flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[13px] mb-2 shadow-sm transition-all ${
                        isDone 
                          ? 'bg-indigo-600 text-white' 
                          : isCurrent 
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {isDone ? '✓' : step.num}
                      </div>
                      <span className={`text-[12px] font-bold leading-tight ${
                        isCurrent || isDone ? 'text-[#111827]' : 'text-gray-400'
                      }`}>
                        {step.name}
                      </span>
                      <span className="text-[10px] text-gray-400 hidden sm:block mt-0.5">
                        {step.desc}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Forensic Image & Description */}
            <div className="py-7 space-y-4">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
                Forensic Documentation & Scene Evidence
              </h3>

              {selectedComplaint.imageUrl ? (
                <div className="rounded-2xl overflow-hidden border border-gray-200 relative h-64 bg-gray-100 shadow-inner">
                  <img
                    src={selectedComplaint.imageUrl}
                    alt={selectedComplaint.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/75 text-white text-[11px] px-3.5 py-1.5 rounded-xl backdrop-blur flex items-center gap-2 font-mono">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                    <span>GPS Telemetry: Lat {selectedComplaint.coordinates.lat}, Lng {selectedComplaint.coordinates.lng}</span>
                  </div>
                </div>
              ) : selectedComplaint.beforeImageUrl ? (
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100 border border-gray-200">
                    <img src={selectedComplaint.beforeImageUrl} alt="Before" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">BEFORE</span>
                  </div>
                  <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100 border border-gray-200">
                    <img src={selectedComplaint.afterImageUrl} alt="After" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2.5 left-2.5 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">AFTER</span>
                  </div>
                </div>
              ) : null}

              <p className="text-[14px] text-gray-600 leading-relaxed font-normal">
                {selectedComplaint.description}
              </p>
            </div>

            {/* Action Bar */}
            <div className="pt-5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  id="attach-followup-photo-btn"
                  onClick={() => onOpenUploadPhoto(selectedComplaint)}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#111827] text-[12px] font-bold flex items-center gap-2 border border-gray-200 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-indigo-600" />
                  <span>Attach Follow-up Photo</span>
                </button>
                <button
                  id="view-officer-notes-btn"
                  onClick={() => onOpenOfficerNotes(selectedComplaint)}
                  className="px-4 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#111827] text-[12px] font-bold flex items-center gap-2 border border-gray-200 transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>View Officer Notes ({selectedComplaint.officerNotes.length})</span>
                </button>
              </div>

              {selectedComplaint.status !== 'Resolved' && (
                <button
                  id="escalate-priority-btn"
                  onClick={() => {
                    onEscalatePriority(selectedComplaint.id);
                    setEscalated(true);
                  }}
                  className={`px-4 py-2.5 rounded-xl text-[12px] font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    escalated 
                      ? 'bg-red-50 text-red-600 border border-red-200' 
                      : 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-95'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>{escalated ? 'Priority Level Escalated' : 'Request Urgent Escalation'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right 4-col: Crew telemetry, Contest Resolution, Print Report */}
        <div className="lg:col-span-4 space-y-6">
          {/* Assigned Crew Card */}
          <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Truck className="w-4 h-4" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
                Field Response Unit
              </h3>
            </div>

            <div className="p-4 bg-gray-50 rounded-2xl space-y-2.5 text-[12px] border border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500">Designated Unit:</span>
                <span className="font-bold text-[#111827]">{selectedComplaint.assignedCrew}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle Telemetry:</span>
                <span className="font-mono font-bold text-indigo-600">TRUCK #09-OAK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Estimated Time on Site:</span>
                <span className="font-bold text-green-600">14 Minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Supervising Auditor:</span>
                <span className="font-bold text-[#111827]">Insp. Elena Vance</span>
              </div>
            </div>

            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
              District 04 field units carry thermal asphalt thermometers, emergency hydraulic cutters, and real-time municipal telemetry tablets.
            </p>
          </div>

          {/* Appeal / Contest Card */}
          <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
                Citizen Audit Rights
              </h3>
            </div>
            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
              Citizens are protected under District 04 Civic Code §14. If a repair is unsatisfactory, an appeal triggers a mandatory supervisor forensic re-inspection within 24 hours.
            </p>
            {appealRequested ? (
              <div className="p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-800 text-[12px] rounded-xl font-bold">
                ✓ Appeal lodged. Supervisor audit ticket scheduled for morning inspection.
              </div>
            ) : (
              <button
                id="contest-resolution-btn"
                onClick={() => setAppealRequested(true)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
              >
                Contest Resolution / Request Re-audit
              </button>
            )}
          </div>

          {/* Official summary print button */}
          <button
            id="print-summary-btn"
            onClick={() => window.print()}
            className="w-full py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 text-[#111827] text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-gray-500" />
            <span>Print Official Incident Summary</span>
          </button>
        </div>
      </div>

      {/* Comprehensive SLA Progress Telemetry Matrix across All Incidents */}
      <div 
        id="sla-matrix-card"
        className="mt-8 bg-white rounded-[32px] p-7 sm:p-9 border border-gray-200 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Activity className="w-4 h-4" />
              </span>
              <h3 className="font-['Plus_Jakarta_Sans'] text-lg font-black text-gray-900 tracking-tight">
                All Incidents SLA Telemetry & Progress Matrix
              </h3>
            </div>
            <p className="text-xs text-gray-500">
              Comparative overview of time-remaining progress bars relative to guaranteed SLA duration across all open and resolved cases.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-2xl">
            <button
              id="filter-all-btn"
              onClick={() => setMatrixFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'all'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              All ({complaints.length})
            </button>
            <button
              id="filter-active-btn"
              onClick={() => setMatrixFilter('active')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'active'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Active ({activeComplaints.length})
            </button>
            <button
              id="filter-resolved-btn"
              onClick={() => setMatrixFilter('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                matrixFilter === 'resolved'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Resolved ({complaints.length - activeComplaints.length})
            </button>
          </div>
        </div>

        {/* Complaints SLA Matrix List */}
        <div className="divide-y divide-gray-100 mt-2">
          {filteredComplaints.map(c => {
            const metrics = calculateSlaMetrics(c);
            const isCurrent = c.id === selectedComplaint.id;

            return (
              <div 
                key={c.id}
                id={`matrix-row-${c.id}`}
                className={`py-4.5 px-3 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isCurrent ? 'bg-indigo-50/40' : 'hover:bg-gray-50/60'
                }`}
              >
                {/* Left: Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs font-bold text-indigo-600">{c.id}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs font-semibold text-gray-700">{c.category}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.priority === 'Critical'
                        ? 'bg-rose-100 text-rose-800'
                        : c.priority === 'High'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {c.priority}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'Resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <h4 className="text-[13px] font-bold text-gray-900 truncate">
                    {c.title}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                    <MapPin className="w-3 h-3 text-indigo-500" />
                    <span>{c.location}</span>
                  </p>
                </div>

                {/* Center / Right: Visual Progress Bar & Metrics */}
                <div className="w-full md:w-80 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 font-mono font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3 text-indigo-600" />
                      {metrics.isResolved ? 'Resolved' : metrics.remainingFormatted}
                      <span className="text-gray-400 font-normal"> / {metrics.totalHours}h</span>
                    </span>
                    <span className={`font-mono font-bold text-xs ${
                      metrics.isResolved 
                        ? 'text-emerald-600' 
                        : metrics.percentLeft <= 25 
                        ? 'text-rose-600' 
                        : 'text-indigo-600'
                    }`}>
                      {metrics.isResolved ? '100% Met' : `${metrics.percentLeft}% Left`}
                    </span>
                  </div>

                  {/* The visual progress bar */}
                  <div 
                    id={`matrix-progress-bar-${c.id}`}
                    className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner"
                    role="progressbar"
                    aria-valuenow={metrics.percentLeft}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${c.id} time left: ${metrics.percentLeft}%`}
                  >
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${metrics.barColor}`}
                      style={{ width: `${metrics.percentLeft}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span>{metrics.elapsedFormatted} elapsed</span>
                    <span className={`font-semibold ${
                      metrics.isResolved 
                        ? 'text-emerald-700' 
                        : metrics.percentLeft <= 25 
                        ? 'text-rose-700' 
                        : 'text-gray-600'
                    }`}>
                      {metrics.statusLabel}
                    </span>
                  </div>
                </div>

                {/* Inspect Button */}
                <div className="shrink-0 flex items-center">
                  <button
                    id={`inspect-btn-${c.id}`}
                    onClick={() => {
                      onSelectComplaint(c);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    <span>{isCurrent ? 'Inspecting' : 'Inspect'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
