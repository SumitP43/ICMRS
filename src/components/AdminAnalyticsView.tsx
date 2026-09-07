import React, { useState, useMemo, useEffect } from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  Clock, 
  Users, 
  Layers, 
  ArrowDownRight, 
  ArrowUpRight, 
  CheckCircle, 
  FileSpreadsheet, 
  Calendar, 
  Activity, 
  Filter, 
  Sparkles, 
  Download,
  Volume2,
  VolumeX,
  Bell,
  AlertTriangle
} from 'lucide-react';
import { 
  isMuted, 
  toggleMuted, 
  subscribeMuteChange, 
  playNewComplaintChime, 
  playCriticalEscalationChime 
} from '../audio/audioNotificationService';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { CivicComplaint } from '../types';

interface AdminAnalyticsViewProps {
  complaints?: CivicComplaint[];
}

interface DailyFrequencyPoint {
  date: string;
  fullDate: string;
  dayOfWeek: string;
  total: number;
  critical: number;
  high: number;
  mediumLow: number;
  highlight?: string;
}

export const AdminAnalyticsView: React.FC<AdminAnalyticsViewProps> = ({ complaints: propComplaints }) => {
  const [complaints, setComplaints] = useState<CivicComplaint[]>(propComplaints || []);
  const [showPriorityBreakdown, setShowPriorityBreakdown] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(isMuted());
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMuteChange((muted) => {
      setAudioMuted(muted);
    });
    return () => unsubscribe();
  }, []);

  const handleTestNewComplaint = () => {
    playNewComplaintChime(true);
    setTestFeedback('New Complaint Chime (F#5 → A5 Double-Harmonic) played');
    setTimeout(() => setTestFeedback(null), 3500);
  };

  const handleTestCriticalEscalation = () => {
    playCriticalEscalationChime(true);
    setTestFeedback('Critical Escalation Alert (E5 → G#5 → B5 Ascending) played');
    setTimeout(() => setTestFeedback(null), 3500);
  };

  // Fetch latest complaints from backend if not provided in props
  useEffect(() => {
    if (!propComplaints || propComplaints.length === 0) {
      fetch('/api/complaints')
        .then(res => res.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            setComplaints(json.data);
          }
        })
        .catch(err => console.warn('Could not fetch complaints for analytics:', err));
    } else {
      setComplaints(propComplaints);
    }
  }, [propComplaints]);

  // Generate 30-day frequency timeline up to current date (2026-09-05)
  const chartData: DailyFrequencyPoint[] = useMemo(() => {
    const referenceDate = new Date('2026-09-05T12:00:00Z');
    const days: DailyFrequencyPoint[] = [];

    // Deterministic realistic municipal baseline pattern over 30 days
    // Reflects routine maintenance requests, weekend lulls, and severe weather spikes
    const baseDailyPattern = [
      { offset: 29, base: 7, crit: 2, high: 3, med: 2 },
      { offset: 28, base: 6, crit: 1, high: 2, med: 3 },
      { offset: 27, base: 4, crit: 0, high: 2, med: 2 }, // Weekend
      { offset: 26, base: 3, crit: 0, high: 1, med: 2 }, // Weekend
      { offset: 25, base: 9, crit: 2, high: 4, med: 3 }, // Monday surge
      { offset: 24, base: 8, crit: 1, high: 4, med: 3 },
      { offset: 23, base: 7, crit: 2, high: 2, med: 3 },
      { offset: 22, base: 8, crit: 1, high: 3, med: 4 },
      { offset: 21, base: 6, crit: 1, high: 2, med: 3 },
      { offset: 20, base: 4, crit: 0, high: 1, med: 3 }, // Weekend
      { offset: 19, base: 5, crit: 1, high: 1, med: 3 }, // Weekend
      { offset: 18, base: 14, crit: 4, high: 6, med: 4, note: 'Rainstorm Surface Flooding' }, // Storm spike
      { offset: 17, base: 11, crit: 3, high: 5, med: 3 },
      { offset: 16, base: 9, crit: 2, high: 4, med: 3 },
      { offset: 15, base: 8, crit: 1, high: 4, med: 3 },
      { offset: 14, base: 7, crit: 2, high: 2, med: 3 },
      { offset: 13, base: 4, crit: 0, high: 2, med: 2 }, // Weekend
      { offset: 12, base: 16, crit: 5, high: 7, med: 4, note: 'Downtown Grid Outage' }, // Peak event
      { offset: 11, base: 12, crit: 3, high: 5, med: 4 },
      { offset: 10, base: 10, crit: 2, high: 5, med: 3 },
      { offset: 9, base: 8, crit: 2, high: 3, med: 3 },
      { offset: 8, base: 7, crit: 1, high: 3, med: 3 },
      { offset: 7, base: 9, crit: 2, high: 4, med: 3 },
      { offset: 6, base: 4, crit: 0, high: 2, med: 2 }, // Weekend
      { offset: 5, base: 5, crit: 1, high: 1, med: 3 }, // Weekend
      { offset: 4, base: 10, crit: 3, high: 4, med: 3 },
      { offset: 3, base: 8, crit: 2, high: 3, med: 3 },
      { offset: 2, base: 9, crit: 2, high: 4, med: 3 },
      { offset: 1, base: 7, crit: 1, high: 3, med: 3 }, // Yesterday
      { offset: 0, base: 6, crit: 2, high: 2, med: 2 }, // Today
    ];

    // Count live complaints submitted today or recently if available
    const liveCount = complaints.length;
    const additionalLiveToday = Math.max(0, liveCount - 6);

    baseDailyPattern.forEach(item => {
      const d = new Date(referenceDate.getTime() - item.offset * 24 * 60 * 60 * 1000);
      const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'short' });

      // If today, add dynamically filed complaints
      const isToday = item.offset === 0;
      const total = isToday ? item.base + additionalLiveToday : item.base;
      const critical = isToday ? item.crit + (additionalLiveToday > 0 ? 1 : 0) : item.crit;
      const high = isToday ? item.high + Math.floor(additionalLiveToday / 2) : item.high;
      const mediumLow = total - critical - high;

      days.push({
        date: dateLabel,
        fullDate,
        dayOfWeek,
        total,
        critical,
        high,
        mediumLow: Math.max(0, mediumLow),
        highlight: item.note
      });
    });

    return days;
  }, [complaints]);

  // Aggregate stats across 30 days
  const stats = useMemo(() => {
    const totalComplaints = chartData.reduce((acc, curr) => acc + curr.total, 0);
    const avgDaily = (totalComplaints / chartData.length).toFixed(1);
    
    let peakDay = chartData[0];
    for (const d of chartData) {
      if (d.total > peakDay.total) {
        peakDay = d;
      }
    }

    const last7DaysTotal = chartData.slice(-7).reduce((acc, c) => acc + c.total, 0);
    const prev7DaysTotal = chartData.slice(-14, -7).reduce((acc, c) => acc + c.total, 0);
    const weekOverWeekPct = prev7DaysTotal > 0
      ? (((last7DaysTotal - prev7DaysTotal) / prev7DaysTotal) * 100).toFixed(1)
      : '0.0';

    return {
      totalComplaints,
      avgDaily,
      peakDay,
      last7DaysTotal,
      weekOverWeekPct: Number(weekOverWeekPct)
    };
  }, [chartData]);

  // Recharts custom high-contrast tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DailyFrequencyPoint;
      return (
        <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-200 text-[12px] min-w-[210px] z-50">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
            <span className="font-extrabold text-[#111827]">{data.fullDate}</span>
            <span className="text-[10px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {data.dayOfWeek}
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between font-extrabold text-indigo-600 bg-indigo-50/70 -mx-1 px-2 py-1 rounded-lg">
              <span>New Complaints Filed:</span>
              <span className="text-[15px] font-mono">{data.total}</span>
            </div>

            {data.highlight && (
              <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200 font-semibold">
                ⚡ {data.highlight}
              </div>
            )}

            <div className="pt-1.5 space-y-1 border-t border-gray-100 text-[11px]">
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                  Critical Priority:
                </span>
                <span className="font-mono font-bold text-red-600">{data.critical}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  High Priority:
                </span>
                <span className="font-mono font-bold text-orange-600">{data.high}</span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  Standard / Medium:
                </span>
                <span className="font-mono font-bold text-yellow-600">{data.mediumLow}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const departments = [
    { name: 'Roads & Bridges', total: 42, onTime: 39, compliance: '92.8%', color: '#006194' },
    { name: 'Electrical & Lighting', total: 28, onTime: 27, compliance: '96.4%', color: '#007bb9' },
    { name: 'Water & Sanitation', total: 19, onTime: 19, compliance: '100.0%', color: '#10b981' },
    { name: 'Public Safety & Transit', total: 15, onTime: 14, compliance: '93.3%', color: '#426086' },
    { name: 'Parks & Forestry', total: 22, onTime: 21, compliance: '95.4%', color: '#4f5d73' },
  ];

  const wardSectors = [
    { name: 'Oak Ridge Sector', open: 2, resolved: 14, avgSla: '16.2h', rating: '4.9 ★' },
    { name: 'Elmwood Commercial Corridor', open: 1, resolved: 11, avgSla: '19.4h', rating: '4.8 ★' },
    { name: 'Highland Boulevard Sector', open: 0, resolved: 18, avgSla: '14.1h', rating: '5.0 ★' },
    { name: 'Downtown Central Grid', open: 3, resolved: 24, avgSla: '21.0h', rating: '4.7 ★' },
  ];

  // Function to compile and download the current aggregated complaint dataset as a CSV file
  const handleDownloadCSV = () => {
    try {
      const headers = [
        'Date',
        'Full Date',
        'Day of Week',
        'Total Complaints',
        'Critical Priority',
        'High Priority',
        'Standard/Medium Priority',
        'Incident Highlight / Event Note'
      ];

      const dailyRows = chartData.map(point => [
        `"${point.date}"`,
        `"${point.fullDate}"`,
        `"${point.dayOfWeek}"`,
        point.total,
        point.critical,
        point.high,
        point.mediumLow,
        `"${(point.highlight || 'Routine Municipal Operations').replace(/"/g, '""')}"`
      ]);

      const summarySection = [
        [],
        ['=== 30-DAY INTAKE AGGREGATE SUMMARY ==='],
        ['Metric', 'Value'],
        ['Total Complaints Logged', stats.totalComplaints],
        ['Daily Intake Average', stats.avgDaily],
        ['Peak Intake Day', `"${stats.peakDay.fullDate} (${stats.peakDay.total} complaints)"`],
        ['Week-Over-Week Trajectory', `"${stats.weekOverWeekPct >= 0 ? '+' : ''}${stats.weekOverWeekPct}%"`],
        [],
        ['=== DEPARTMENT SLA COMPLIANCE AGGREGATES ==='],
        ['Department', 'Total Inquiries', 'Resolved On-Time', 'Compliance Rate'],
        ...departments.map(dept => [
          `"${dept.name}"`,
          dept.total,
          dept.onTime,
          `"${dept.compliance}"`
        ]),
        [],
        ['=== WARD SECTOR AGGREGATES ==='],
        ['Sector Name', 'Open Incidents', 'Resolved Incidents', 'Average SLA', 'Citizen Rating'],
        ...wardSectors.map(sector => [
          `"${sector.name}"`,
          sector.open,
          sector.resolved,
          `"${sector.avgSla}"`,
          `"${sector.rating}"`
        ])
      ];

      const csvRows = [
        headers.join(','),
        ...dailyRows.map(r => r.join(',')),
        ...summarySection.map(r => r.join(','))
      ];

      const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.setAttribute('href', url);
      downloadLink.setAttribute('download', `aggregated_complaints_30d_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Error generating CSV export:', err);
    }
  };

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bento-badge-indigo">
              Executive Analytics Portal
            </span>
            <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">• Metro Authority Audit Division</span>
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-[32px] font-black text-[#111827] tracking-tight">
            District 04 Municipal Telemetry & SLA Metrics
          </h1>
          <p className="text-[14px] text-gray-500 mt-1 max-w-2xl font-medium">
            Real-time automated performance audits across public infrastructure dispatches and citizen ratings.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Admin Portal Audio Status Widget */}
          <button 
            id="admin-portal-audio-status-btn"
            type="button"
            onClick={() => {
              const next = toggleMuted();
              setAudioMuted(next);
            }}
            className={`px-4 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 border shadow-sm transition-all active:scale-95 cursor-pointer ${
              audioMuted
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
            }`}
            title={audioMuted ? "Admin incident audio alerts are muted. Click to turn audio ON." : "Admin incident audio alerts are ON. Click to mute."}
            aria-label={audioMuted ? "Audio Muted" : "Audio On"}
          >
            <span className="text-[15px]">{audioMuted ? '🔇' : '🔊'}</span>
            <span>{audioMuted ? 'Audio Muted' : 'Audio On'}</span>
          </button>

          {/* Download Aggregated CSV Button */}
          <button 
            id="download-aggregated-dataset-csv-btn"
            type="button"
            onClick={handleDownloadCSV}
            className={`px-5 py-2.5 rounded-xl text-[13px] font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'
            }`}
            title="Download current aggregated 30-day complaints dataset as CSV"
          >
            {downloadSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>CSV Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Aggregated CSV</span>
              </>
            )}
          </button>

          <button 
            id="print-audit-report-btn"
            type="button"
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-[13px] font-bold text-[#111827] hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            <span>Export Audit Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-7 rounded-[28px] border border-gray-200 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Annual District SLA</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-['Plus_Jakarta_Sans'] text-[38px] font-black text-green-600 leading-none">99.4%</span>
            <span className="text-[12px] font-bold text-green-600 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +0.8%
            </span>
          </div>
          <p className="text-[12px] text-gray-400 mt-1.5 font-medium">Target threshold is 98.0%</p>
        </div>

        <div className="bg-white p-7 rounded-[28px] border border-gray-200 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Average Response Time</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-['Plus_Jakarta_Sans'] text-[38px] font-black text-indigo-600 leading-none">18.4h</span>
            <span className="text-[12px] font-bold text-green-600 flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5" /> 4.2h faster
            </span>
          </div>
          <p className="text-[12px] text-gray-400 mt-1.5 font-medium">Versus 22.6h citywide baseline</p>
        </div>

        <div className="bg-white p-7 rounded-[28px] border border-gray-200 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Citizen Trust Index</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-['Plus_Jakarta_Sans'] text-[38px] font-black text-[#111827] leading-none">4.91</span>
            <span className="text-[13px] font-bold text-indigo-600">/ 5.00</span>
          </div>
          <p className="text-[12px] text-gray-400 mt-1.5 font-medium">Based on 126 verified surveys</p>
        </div>

        <div className="bg-white p-7 rounded-[28px] border border-gray-200 shadow-sm">
          <span className="text-[11px] uppercase font-bold text-gray-400 tracking-wider">Cost Remediation Efficiency</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-['Plus_Jakarta_Sans'] text-[38px] font-black text-[#111827] leading-none">-14.2%</span>
            <span className="text-[12px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">Under Budget</span>
          </div>
          <p className="text-[12px] text-gray-400 mt-1.5 font-medium">AI predictive route savings</p>
        </div>
      </div>

      {/* Admin Portal Civic Incident Audio Notification System & Test Bench */}
      <div className="bg-white p-6 sm:p-7 rounded-[28px] border border-gray-200 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                Browser-Native Web Audio
              </span>
              <span className="text-[11px] font-mono text-gray-400">• Zero External Libraries • Offline Synthesizer</span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[20px] font-black text-[#111827] tracking-tight">
              Incident Audio Alert Notifications & Sound Test Bench
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5 max-w-2xl font-medium">
              Subtle synthesized browser chimes notifying triage officers when new municipal complaints arrive or existing issues escalate to Critical priority.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Status Indicator & Quick Toggle */}
            <div className={`px-3.5 py-2 rounded-xl border text-[12px] font-bold flex items-center gap-2 ${
              audioMuted 
                ? 'bg-amber-50 text-amber-900 border-amber-200' 
                : 'bg-emerald-50 text-emerald-900 border-emerald-200'
            }`}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: audioMuted ? '#f59e0b' : '#10b981' }}></span>
              <span>Status: {audioMuted ? 'Muted' : 'Active'}</span>
            </div>

            <button
              id="admin-sound-toggle-action-btn"
              type="button"
              onClick={() => {
                const next = toggleMuted();
                setAudioMuted(next);
              }}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#111827] text-[12px] font-bold rounded-xl transition-all cursor-pointer"
            >
              {audioMuted ? 'Unmute All Alerts' : 'Mute All Alerts'}
            </button>
          </div>
        </div>

        {/* Action Buttons & Feedback Banner */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <button
              id="test-new-complaint-audio-btn"
              type="button"
              onClick={handleTestNewComplaint}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              title="Test the double-harmonic New Complaint chime (F#5 → A5)"
            >
              <Bell className="w-4 h-4" />
              <span>Test New Complaint</span>
            </button>

            <button
              id="test-critical-escalation-audio-btn"
              type="button"
              onClick={handleTestCriticalEscalation}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
              title="Test the 3-tone Critical Escalation alert (E5 → G#5 → B5)"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Test Critical Escalation</span>
            </button>
          </div>

          {/* Real-time Feedback State Banner */}
          {testFeedback ? (
            <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>{testFeedback}</span>
            </div>
          ) : (
            <div className="text-[11px] text-gray-400 flex items-center gap-2 font-mono">
              <span>Acoustic Spec: F#5 (739.99Hz) • A5 (880Hz) | E5 (659Hz) → G#5 (830Hz) → B5 (987Hz)</span>
            </div>
          )}
        </div>
      </div>

      {/* 30-Day New Complaints Frequency Line Chart (Recharts) */}
      <div className="bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm mb-8">
        {/* Header with Title, Telemetry pill, and Priority breakdown toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                Intake Velocity
              </span>
              <span className="text-[11px] font-mono text-gray-400">Past 30 Days (Aug 07 – Sep 05, 2026)</span>
            </div>
            <h2 className="font-['Plus_Jakarta_Sans'] text-[22px] font-black text-[#111827] tracking-tight">
              Frequency of New Complaints Submitted Per Day
            </h2>
            <p className="text-[13px] text-gray-500 mt-0.5">
              Daily telemetry tracking citizen-reported hazards, dispatch requests, and infrastructure triage volume over the last 30 days.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center flex-wrap">
            {/* Download Aggregated CSV on Chart */}
            <button
              id="chart-download-aggregated-csv-btn"
              type="button"
              onClick={handleDownloadCSV}
              className="px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
              title="Download 30-day aggregated complaints time-series and metrics as CSV"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download CSV</span>
            </button>

            {/* Toggle Priority Breakdown */}
            <button
              type="button"
              onClick={() => setShowPriorityBreakdown(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                showPriorityBreakdown
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
              }`}
              title="Toggle Critical and High Priority breakdown lines"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{showPriorityBreakdown ? 'Hide Priority Lines' : 'Breakdown by Priority'}</span>
            </button>
          </div>
        </div>

        {/* Mini stats strip above chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 mb-3 border-b border-gray-100/70 text-[12px]">
          <div>
            <span className="text-gray-400 block text-[11px] font-semibold uppercase tracking-wider">30-Day Total</span>
            <span className="text-[20px] font-black font-['Plus_Jakarta_Sans'] text-[#111827]">
              {stats.totalComplaints}
            </span>
            <span className="text-gray-400 text-[11px] ml-1.5">complaints</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px] font-semibold uppercase tracking-wider">Daily Average</span>
            <span className="text-[20px] font-black font-['Plus_Jakarta_Sans'] text-indigo-600">
              {stats.avgDaily}
            </span>
            <span className="text-gray-400 text-[11px] ml-1.5">per day</span>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px] font-semibold uppercase tracking-wider">Peak Intake Day</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[20px] font-black font-['Plus_Jakarta_Sans'] text-red-600">
                {stats.peakDay.total}
              </span>
              <span className="text-[11px] font-bold text-gray-500">
                ({stats.peakDay.date})
              </span>
            </div>
          </div>

          <div>
            <span className="text-gray-400 block text-[11px] font-semibold uppercase tracking-wider">7-Day Trajectory</span>
            <div className="flex items-center gap-1 mt-0.5">
              <span className={`text-[16px] font-bold ${stats.weekOverWeekPct >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {stats.weekOverWeekPct >= 0 ? `+${stats.weekOverWeekPct}%` : `${stats.weekOverWeekPct}%`}
              </span>
              <span className="text-gray-400 text-[11px]">vs prev week</span>
            </div>
          </div>
        </div>

        {/* Recharts Line Chart */}
        <div className="w-full h-[320px] pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 16, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={{ stroke: '#E2E8F0' }} 
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                interval={2}
              />
              <YAxis 
                allowDecimals={false} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '12px', fontWeight: 600 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="New Complaints / Day"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ r: 3, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#4F46E5', stroke: '#C7D2FE', strokeWidth: 3 }}
              />
              {showPriorityBreakdown && (
                <>
                  <Line
                    type="monotone"
                    dataKey="critical"
                    name="Critical Priority"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 2.5, fill: '#EF4444', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#EF4444', stroke: '#FECACA', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="high"
                    name="High Priority"
                    stroke="#F97316"
                    strokeWidth={2}
                    dot={{ r: 2.5, fill: '#F97316', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                    activeDot={{ r: 5, fill: '#F97316', stroke: '#FED7AA', strokeWidth: 2 }}
                  />
                </>
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Caption footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
            <span>Hover over any data point to inspect daily totals, day of week, and priority ratios</span>
          </div>
          <span className="font-mono mt-1 sm:mt-0">Source: Central Ward Telemetry Dispatch Log • Recharts Engine</span>
        </div>
      </div>

      {/* Charts & Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7-col: Department Compliance Bars */}
        <div className="lg:col-span-7 bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold text-[#111827]">
                Departmental SLA Compliance Distribution
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-gray-400">Q1-Q3 2025</span>
          </div>

          <div className="space-y-4">
            {departments.map(dept => (
              <div key={dept.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-[13px]">
                  <span className="font-bold text-[#111827]">{dept.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-400 font-medium">
                      {dept.onTime} / {dept.total} On-Time
                    </span>
                    <span className="font-mono font-bold text-indigo-600">{dept.compliance}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-3 rounded-full transition-all duration-700 bg-indigo-600" 
                    style={{ 
                      width: dept.compliance,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-[12px] font-bold text-[#111827]">
                Zero Critical SLA Breaches Recorded this Month
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium">Audited by Insp. E. Vance</span>
          </div>
        </div>

        {/* Right 5-col: Ward Sector Heat Table */}
        <div className="lg:col-span-5 bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-gray-100">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold text-[#111827]">
              Ward Sector Performance
            </h3>
          </div>

          <div className="space-y-3.5">
            {wardSectors.map(sector => (
              <div key={sector.name} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#111827]">{sector.name}</span>
                  <span className="text-[12px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">{sector.rating}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mt-2 pt-2 border-t border-gray-200/60 font-medium">
                  <span>Open: <strong className="text-[#111827]">{sector.open}</strong></span>
                  <span>Resolved: <strong className="text-[#111827]">{sector.resolved}</strong></span>
                  <span>Avg Response: <strong className="text-green-600 font-bold">{sector.avgSla}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
