/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserCheck, UserPlus } from 'lucide-react';

interface AuthTabsProps {
  activeTab: 'login' | 'register';
  onTabChange: (tab: 'login' | 'register') => void;
  disabled?: boolean;
}

export const AuthTabs: React.FC<AuthTabsProps> = ({
  activeTab,
  onTabChange,
  disabled = false,
}) => {
  return (
    <div
      role="tablist"
      aria-label="Authentication modes"
      className="relative flex bg-slate-100 p-1 rounded-xl border border-slate-200/80 mb-6 select-none"
    >
      {/* Sliding Background Pill */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-xs border border-slate-200/60 transition-all duration-200 ease-out pointer-events-none ${
          activeTab === 'login' ? 'left-1' : 'left-[calc(50%+2px)]'
        }`}
        aria-hidden="true"
      />

      {/* Tab 1: Sign In */}
      <button
        type="button"
        id="tab-signin-btn"
        role="tab"
        aria-selected={activeTab === 'login'}
        aria-controls="signin-panel"
        disabled={disabled}
        onClick={() => onTabChange('login')}
        className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EBD] ${
          activeTab === 'login'
            ? 'text-[#315EBD]'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Sign In</span>
      </button>

      {/* Tab 2: Create Account */}
      <button
        type="button"
        id="tab-register-btn"
        role="tab"
        aria-selected={activeTab === 'register'}
        aria-controls="register-panel"
        disabled={disabled}
        onClick={() => onTabChange('register')}
        className={`relative z-10 flex-1 py-2 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EBD] ${
          activeTab === 'register'
            ? 'text-[#315EBD]'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Create Account</span>
      </button>
    </div>
  );
};
