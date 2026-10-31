/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';

interface PasswordFieldProps {
  id: string;
  name?: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  touched?: boolean;
  rightLabelAction?: React.ReactNode;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  placeholder = '••••••••••••',
  autoComplete = 'current-password',
  required = false,
  disabled = false,
  error,
  touched,
  rightLabelAction,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);

  const handleKeyEvents = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isCaps = e.getModifierState && e.getModifierState('CapsLock');
    setCapsLockActive(!!isCaps);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setCapsLockActive(false);
    if (onBlur) onBlur(e);
  };

  const showError = !!(touched && error);
  const errorId = `${id}-error`;
  const capsLockId = `${id}-capslock`;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label 
          htmlFor={id} 
          className="block text-xs font-semibold text-[#172B4D]"
        >
          {label}
        </label>
        {rightLabelAction}
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <Lock className="w-4 h-4" aria-hidden="true" />
        </div>

        <input
          id={id}
          name={name || id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          required={required}
          disabled={disabled}
          value={value}
          onChange={onChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyEvents}
          onKeyUp={handleKeyEvents}
          placeholder={placeholder}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={
            showError 
              ? errorId 
              : capsLockActive 
              ? capsLockId 
              : undefined
          }
          className={`w-full pl-10 pr-11 h-11 bg-[#F8FAFC] rounded-xl text-sm text-[#172B4D] placeholder:text-slate-400 border transition-all focus:outline-none focus:bg-white ${
            showError
              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
              : 'border-[#E2E8F0] focus:border-[#315EBD] focus:ring-2 focus:ring-[#315EBD]/20'
          }`}
        />

        <button
          type="button"
          id={`toggle-${id}-visibility`}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(!showPassword)}
          tabIndex={-1}
          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-[#315EBD]"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {/* Caps Lock Alert */}
      {capsLockActive && (
        <div 
          id={capsLockId} 
          role="status" 
          className="flex items-center gap-1.5 text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 animate-in fade-in"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" aria-hidden="true" />
          <span>Caps Lock is on</span>
        </div>
      )}

      {/* Inline Field Error */}
      {showError && (
        <p id={errorId} className="text-xs text-red-600 font-medium mt-1 animate-in fade-in">
          {error}
        </p>
      )}
    </div>
  );
};
