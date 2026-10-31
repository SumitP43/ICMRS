/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export const CityMapGraphic: React.FC = () => {
  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/60 border border-slate-200/80 p-4 overflow-hidden">
      {/* City Street Grid Line Art */}
      <svg
        className="w-full h-36 sm:h-40 text-slate-300 stroke-current opacity-70"
        viewBox="0 0 480 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <pattern id="city-faint-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.6" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#city-faint-grid)" />

        {/* Major Arterial Roads */}
        <path d="M 20 80 Q 140 60 240 85 T 460 70" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <path d="M 80 10 Q 160 90 220 150" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 320 10 Q 280 80 380 150" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M 120 140 L 360 30" stroke="#E2E8F0" strokeWidth="1.25" strokeLinecap="round" />
        
        {/* Secondary Municipal Sectors */}
        <circle cx="160" cy="72" r="32" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="340" cy="90" r="28" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />

        {/* Pulsing Pin 1 (Central Delhi Hub - Primary Blue) */}
        <g transform="translate(160, 72)">
          <circle cx="0" cy="0" r="10" fill="#315EBD" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="0" cy="0" r="4.5" fill="#315EBD" />
          <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
        </g>

        {/* Pulsing Pin 2 (South Delhi Triage - Teal Accent) */}
        <g transform="translate(340, 90)">
          <circle cx="0" cy="0" r="9" fill="#0D9488" fillOpacity="0.15" className="animate-ping" style={{ animationDuration: '2.5s' }} />
          <circle cx="0" cy="0" r="4" fill="#0D9488" />
          <circle cx="0" cy="0" r="1.75" fill="#FFFFFF" />
        </g>

        {/* Pulsing Pin 3 (West Delhi Dispatch - Blue) */}
        <g transform="translate(240, 85)">
          <circle cx="0" cy="0" r="7" fill="#315EBD" fillOpacity="0.12" className="animate-ping" style={{ animationDuration: '3.5s' }} />
          <circle cx="0" cy="0" r="3.5" fill="#315EBD" />
          <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Floating Status Chip */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-slate-200/80 shadow-2xs backdrop-blur-xs text-[11px] font-semibold text-slate-700">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
        </span>
        <span>Live: systems operational</span>
      </div>

      {/* District telemetry indicator */}
      <div className="absolute bottom-3 left-3 text-[10px] font-medium text-slate-500 uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md border border-slate-200/50">
        Delhi NCT Geospatial Grid • 11 Districts
      </div>
    </div>
  );
};
