/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertCircle, CheckCircle2, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';

export interface FormAlertProps {
  alert: {
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    isVerificationRequired?: boolean;
  } | null;
  resendingEmail?: boolean;
  resendFeedback?: string | null;
  onResendVerification?: () => void;
  onBackToLogin?: () => void;
}

export const FormAlert: React.FC<FormAlertProps> = ({
  alert,
  resendingEmail = false,
  resendFeedback,
  onResendVerification,
  onBackToLogin,
}) => {
  if (!alert) return null;

  const isError = alert.type === 'error';
  const isWarning = alert.type === 'warning';
  const isSuccess = alert.type === 'success';

  return (
    <div
      id={isError ? 'auth-error-alert' : 'auth-success-alert'}
      role="alert"
      aria-live="polite"
      className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
        isError
          ? 'bg-red-50 border-red-200 text-red-900'
          : isWarning
          ? 'bg-amber-50 border-amber-200 text-amber-900'
          : 'bg-emerald-50 border-emerald-200 text-emerald-900'
      }`}
    >
      {isError && (
        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      {isWarning && (
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
      )}
      {isSuccess && (
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
      )}

      <div className="flex-1">
        <p className="font-semibold leading-snug">
          {alert.title}
        </p>
        <p className="mt-0.5 leading-relaxed opacity-90">
          {alert.message}
        </p>

        {/* Email Verification Action Buttons */}
        {alert.isVerificationRequired && onResendVerification && (
          <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              isLoading={resendingEmail}
              loadingText="Resending..."
              onClick={onResendVerification}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Resend verification email
            </Button>
            {onBackToLogin && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToLogin}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back to login
              </Button>
            )}
          </div>
        )}

        {/* Resend confirmation feedback */}
        {resendFeedback && (
          <p className="mt-2 text-xs font-medium text-amber-900 bg-amber-100/70 p-2 rounded-lg border border-amber-200">
            {resendFeedback}
          </p>
        )}
      </div>
    </div>
  );
};
