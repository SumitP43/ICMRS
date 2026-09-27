/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert, ArrowRight, LogOut, Lock } from 'lucide-react';
import { CivicRole } from '../types';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles?: CivicRole[];
  children: React.ReactNode;
  onRedirectToDashboard?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  onRedirectToDashboard,
}) => {
  const { currentUser, isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[13px] font-bold text-gray-600 tracking-wide">
          Verifying credentials & session...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-200 shadow-xl text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-gray-900 font-['Plus_Jakarta_Sans']">
            Authentication Required
          </h2>
          <p className="text-sm text-gray-600 mt-2 mb-6 leading-relaxed">
            This module requires an authenticated ICMRS session. Please log in with your municipal or citizen credentials to proceed.
          </p>
          <button
            type="button"
            onClick={logout}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <span>Go to Login Screen</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Role authorization check
  const isAuthorized = !allowedRoles || allowedRoles.includes(currentUser.role);

  if (!isAuthorized) {
    const formattedCurrentRole = currentUser.role.toUpperCase();
    const formattedAllowedRoles = allowedRoles.map(r => r.toUpperCase()).join(' or ');

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div 
          id="access-denied-container"
          className="max-w-lg w-full bg-white rounded-3xl p-8 border border-rose-200 shadow-xl text-center relative overflow-hidden"
        >
          {/* Top colored accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500" />

          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <ShieldAlert className="w-7 h-7" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-100 text-rose-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            Access Restricted: Security Boundary Violation
          </div>

          <h2 className="text-xl font-black text-gray-900 font-['Plus_Jakarta_Sans'] mt-1">
            Access Denied
          </h2>

          <p className="text-[13px] text-gray-600 mt-2 leading-relaxed">
            Your current authenticated account (<strong className="text-gray-900 font-bold">{currentUser.name}</strong>, Role: <span className="font-mono text-rose-600 font-bold">{formattedCurrentRole}</span>) does not have authorization to view this protected view.
          </p>

          <div className="my-6 p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-left text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-gray-600">
              <span>Required Role:</span>
              <span className="font-bold text-gray-900">{formattedAllowedRoles}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Your Role:</span>
              <span className="font-bold text-rose-600">{formattedCurrentRole}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Account ID:</span>
              <span className="font-bold text-gray-700">{currentUser.badgeNumber || currentUser.id}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              id="return-to-authorized-dashboard-btn"
              type="button"
              onClick={onRedirectToDashboard}
              className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <span>Return to {currentUser.role === 'citizen' ? 'Citizen' : currentUser.role === 'officer' ? 'Officer' : 'Admin'} Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              id="switch-account-logout-btn"
              type="button"
              onClick={logout}
              className="w-full sm:w-auto py-3 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              title="Log out and sign in with a different role"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
