/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building2, 
  Cpu, 
  ShieldCheck, 
  Lock, 
  ExternalLink, 
  HelpCircle,
  FileText,
  Shield
} from 'lucide-react';
import { ICMRSLogo } from '../ICMRSBranding';
import { StatCard } from './StatCard';
import { FeatureItem } from './FeatureItem';
import { CityMapGraphic } from './CityMapGraphic';

export const BrandPanel: React.FC = () => {
  return (
    <aside 
      aria-label="ICMRS Civic Overview and System Metrics" 
      className="flex flex-col justify-between space-y-6 lg:space-y-7 py-2"
    >
      {/* Top Identity Block */}
      <div className="space-y-4">
        {/* MCD & Gov NCT Badge */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5 text-[#315EBD] shrink-0" aria-hidden="true" />
            <span>Govt. of NCT of Delhi</span>
          </div>
          <span className="text-slate-300 hidden sm:inline" aria-hidden="true">•</span>
          <span className="text-xs font-semibold text-slate-600">
            Municipal Corporation of Delhi (MCD)
          </span>
        </div>

        {/* Brand Header */}
        <div className="flex items-start gap-4">
          <ICMRSLogo 
            variant="emblem" 
            size="lg" 
            className="shadow-sm ring-1 ring-slate-200 mt-1 shrink-0" 
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
                ICMRS
              </h1>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-[#315EBD] text-[10px] font-bold uppercase tracking-wider">
                Enterprise v2.4
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide mt-0.5">
              Intelligent Civic Management &amp; Response System
            </p>
          </div>
        </div>

        {/* 2-line Professional Description */}
        <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed max-w-xl">
          Unified civic intelligence platform connecting residents, municipal dispatchers, and engineering teams for real-time grievance tracking and SLA-enforced public repairs.
        </p>
      </div>

      {/* 3 Compact Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard
          label="SLA Compliance"
          value={99.4}
          decimals={1}
          suffix="%"
          trendText="+0.4% this month"
          sparklineData={[96, 97, 98, 97.5, 98.8, 99.1, 99.2, 99.4]}
        />
        <StatCard
          label="Avg Triage Time"
          value={4.2}
          decimals={1}
          prefix="< "
          suffix="h"
          trendText="SLA met across wards"
          sparklineData={[7.2, 6.5, 5.8, 5.2, 4.8, 4.5, 4.3, 4.2]}
        />
        <StatCard
          label="Citizens Served"
          value={120000}
          prefix=""
          suffix="+"
          trendText="Across 11 Delhi zones"
          sparklineData={[40, 55, 70, 85, 98, 105, 114, 120]}
        />
      </div>

      {/* City Map Line-Art Graphic */}
      <CityMapGraphic />

      {/* 2 Feature Highlights */}
      <div className="space-y-2.5">
        <FeatureItem
          icon={Cpu}
          title="AI-Powered Geo-Triage & Deduplication"
          description="Automated hazard classification, geospatial clustering, and instantaneous ward-level routing to relevant civic departments."
        />
        <FeatureItem
          icon={ShieldCheck}
          title="Secure Civic Operations & Auditability"
          description="Role-based access control (RBAC), end-to-end cryptographic hashing of municipal logs, and citizen identity privacy safeguards."
        />
      </div>

      {/* Footer Row */}
      <footer className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-y-2">
        <div className="flex items-center gap-3">
          <a 
            href="#terms" 
            className="hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#315EBD] rounded"
          >
            Terms of Service
          </a>
          <span>•</span>
          <a 
            href="#privacy" 
            className="hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#315EBD] rounded"
          >
            Privacy Policy
          </a>
          <span>•</span>
          <a 
            href="#help" 
            className="hover:text-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#315EBD] rounded inline-flex items-center gap-1"
          >
            <span>Helpdesk 1916</span>
          </a>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
          <Lock className="w-3 h-3 text-emerald-600" aria-hidden="true" />
          <span>Government-grade security</span>
        </div>
      </footer>
    </aside>
  );
};
