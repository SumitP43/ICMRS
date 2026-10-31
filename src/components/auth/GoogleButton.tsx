/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GoogleButtonProps {
  id?: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  text?: string;
}

export const GoogleButton: React.FC<GoogleButtonProps> = ({
  id = 'google-signin-btn',
  onClick,
  disabled = false,
  isLoading = false,
  text = 'Continue with Google'
}) => {
  return (
    <button
      id={id}
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className="w-full h-11 px-4 rounded-xl bg-white border border-slate-300 text-slate-800 text-xs sm:text-sm font-semibold shadow-2xs hover:bg-slate-50 hover:border-slate-400 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315EBD] focus-visible:ring-offset-1 transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none"
    >
      {isLoading ? (
        <>
          <span 
            className="w-4 h-4 border-2 border-slate-400 border-t-[#315EBD] rounded-full animate-spin shrink-0" 
            aria-hidden="true" 
          />
          <span>Authenticating with Google...</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
};
