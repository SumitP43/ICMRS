/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User, Briefcase, ShieldCheck, Sparkles } from 'lucide-react';
import { CivicRole } from '../../types';

interface DevRolePresetsProps {
  currentEmail: string;
  onSelectRole: (role: CivicRole) => void;
}

export const DevRolePresets: React.FC<DevRolePresetsProps> = ({
  currentEmail,
  onSelectRole,
}) => {
  if (!import.meta.env.DEV) return null;

  return (
    <div className="mb-5 bg-slate-50 rounded-xl p-2.5 border border-slate-200">
      <div className="flex items-center justify-between mb-1.5 px-0.5">
        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#315EBD]" aria-hidden="true" />
          Dev Quick Fill
        </span>
        <span className="text-[10px] text-slate-500 font-medium">
          Local Testing
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <button
          type="button"
          id="preset-citizen-btn"
          onClick={() => onSelectRole('citizen')}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EBD] ${
            currentEmail === 'citizen@icmrs.gov'
              ? 'bg-blue-50 border-blue-300 text-[#315EBD] font-bold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <User className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Citizen</span>
        </button>

        <button
          type="button"
          id="preset-officer-btn"
          onClick={() => onSelectRole('officer')}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EBD] ${
            currentEmail === 'officer@icmrs.gov'
              ? 'bg-blue-50 border-blue-300 text-[#315EBD] font-bold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Officer</span>
        </button>

        <button
          type="button"
          id="preset-admin-btn"
          onClick={() => onSelectRole('admin')}
          className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EBD] ${
            currentEmail === 'admin@icmrs.gov'
              ? 'bg-blue-50 border-blue-300 text-[#315EBD] font-bold'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Admin</span>
        </button>
      </div>
    </div>
  );
};
