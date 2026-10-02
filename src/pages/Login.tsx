/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  ShieldCheck, 
  Building2, 
  AlertCircle, 
  UserCheck, 
  Briefcase, 
  User,
  UserPlus,
  MapPin,
  CheckCircle2,
  Sparkles,
  KeyRound,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CivicRole } from '../types';
import { ICMRSLogo } from '../components/ICMRSBranding';
import { Button } from '../components/ui/Button';

interface LoginProps {
  onLoginSuccess?: (role: CivicRole) => void;
}

/**
 * Authentication State Model
 */
export type AuthPageState = 
  | 'idle'
  | 'submitting'
  | 'authenticated'
  | 'email_verification_required'
  | 'invalid_credentials'
  | 'oauth_processing'
  | 'oauth_success'
  | 'error';

interface AuthAlertState {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  isVerificationRequired?: boolean;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { 
    login, 
    register, 
    signInWithGoogle, 
    resetPassword, 
    resendVerificationEmail,
    loading: authLoading, 
    error: authError,
    clearError,
    currentUser,
    isAuthenticated 
  } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Unified authentication state
  const [authState, setAuthState] = useState<AuthPageState>('idle');
  const [authAlert, setAuthAlert] = useState<AuthAlertState | null>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regWard, setRegWard] = useState('Central Delhi — Connaught Place & Karol Bagh');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Verification resend state
  const [resendingEmail, setResendingEmail] = useState(false);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  // Detect OAuth redirect processing on initial load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      if (hash.includes('access_token') || search.includes('code=')) {
        setAuthState('oauth_processing');
      }
    }
  }, []);

  // Synchronize authenticated state if user session established
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setAuthState('authenticated');
      setAuthAlert(null);
      if (onLoginSuccess) {
        onLoginSuccess(currentUser.role);
      }
    }
  }, [isAuthenticated, currentUser, onLoginSuccess]);

  // Synchronize global auth errors (e.g. from OAuth redirect)
  useEffect(() => {
    if (authError) {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Unable to complete sign-in',
        message: authError,
      });
    }
  }, [authError]);

  const clearAlerts = () => {
    setAuthAlert(null);
    setResendFeedback(null);
    clearError();
    if (authState !== 'submitting') {
      setAuthState('idle');
    }
  };

  const handleTabSwitch = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    clearAlerts();
    setShowForgotPassword(false);
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setResetMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setResetSubmitting(true);
    setResetMessage(null);
    try {
      const result = await resetPassword(cleanEmail);
      setResetMessage({
        type: result.success ? 'success' : 'error',
        text: result.message,
      });
    } catch {
      setResetMessage({ type: 'error', text: 'Failed to send password reset email. Please try again.' });
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    clearAlerts();
    setAuthState('submitting');
    try {
      await signInWithGoogle();
      // Browser navigates to Google OAuth consent
    } catch {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Something went wrong',
        message: "We couldn't complete your sign-in with Google. Please try again or use your email and password.",
      });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setAuthState('invalid_credentials');
      setAuthAlert({
        type: 'error',
        title: 'Unable to sign in',
        message: 'Please enter both your email address and password.',
      });
      return;
    }

    setAuthState('submitting');

    try {
      const result = await login({ email: cleanEmail, password }, rememberMe);

      if (result.success && result.user) {
        setAuthState('authenticated');
        if (onLoginSuccess) {
          onLoginSuccess(result.user.role);
        }
      } else if (result.needsEmailVerification) {
        setAuthState('email_verification_required');
        setAuthAlert({
          type: 'warning',
          title: 'Email verification required',
          message: 'Please verify your email address before signing in. Check your inbox for the verification link.',
          isVerificationRequired: true,
        });
      } else if (result.error === 'Invalid credentials') {
        setAuthState('invalid_credentials');
        setAuthAlert({
          type: 'error',
          title: 'Unable to sign in',
          message: 'The email or password you entered is incorrect. Please check your details and try again.',
        });
      } else {
        setAuthState('error');
        setAuthAlert({
          type: 'error',
          title: 'Something went wrong',
          message: "We couldn't complete your sign-in. Please try again.",
        });
      }
    } catch {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Something went wrong',
        message: "We couldn't complete your sign-in. Please try again.",
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAlerts();

    if (!regName.trim() || regName.trim().length < 2) {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Incomplete information',
        message: 'Please enter your full name (minimum 2 characters).',
      });
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Invalid email address',
        message: 'Please provide a valid email address.',
      });
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Password too short',
        message: 'Password must be at least 6 characters long.',
      });
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Passwords do not match',
        message: 'Please ensure both passwords match.',
      });
      return;
    }

    if (!agreeTerms) {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Agreement required',
        message: 'Please confirm agreement to the Civic Portal Terms of Use & Privacy Policy.',
      });
      return;
    }

    setAuthState('submitting');

    try {
      const result = await register(
        {
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          wardOrSector: regWard,
        },
        rememberMe
      );

      if (result.success && result.user) {
        setAuthState('authenticated');
        setAuthAlert({
          type: 'success',
          title: 'Account ready',
          message: 'Account created successfully! Redirecting to your dashboard...',
        });
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess('citizen');
          }
        }, 500);
      } else if (result.needsEmailVerification) {
        setEmail(regEmail.trim());
        setAuthState('email_verification_required');
        setAuthAlert({
          type: 'warning',
          title: 'Email verification required',
          message: 'Please verify your email address before signing in. Check your inbox for the verification link.',
          isVerificationRequired: true,
        });
      } else {
        setAuthState('error');
        setAuthAlert({
          type: 'error',
          title: 'Unable to create account',
          message: result.error || 'Could not complete registration. Please try again.',
        });
      }
    } catch {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Something went wrong',
        message: 'We were unable to complete your registration. Please try again.',
      });
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = (email || regEmail).trim();
    if (!targetEmail) {
      setResendFeedback('Please enter your email address to receive a verification link.');
      return;
    }

    setResendingEmail(true);
    setResendFeedback(null);

    try {
      const result = await resendVerificationEmail(targetEmail);
      setResendFeedback(result.message);
    } catch {
      setResendFeedback('Failed to resend verification email. Please check your connection and try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Helper for development testing presets (gated strictly behind DEV)
  const handleSelectRolePreset = (role: CivicRole) => {
    clearAlerts();
    if (role === 'citizen') {
      setEmail('citizen@icmrs.gov');
      setPassword('Citizen123!');
    } else if (role === 'officer') {
      setEmail('officer@icmrs.gov');
      setPassword('Officer123!');
    } else if (role === 'admin') {
      setEmail('admin@icmrs.gov');
      setPassword('Admin123!');
    }
  };

  const isFormBusy = authState === 'submitting' || authLoading;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#191c1e] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif]">
      <div className="w-full max-w-md">
        {/* ICMRS Branding */}
        <header className="text-center mb-6 flex flex-col items-center">
          <ICMRSLogo 
            variant="emblem" 
            size="xl" 
            className="shadow-xl ring-4 ring-indigo-100/90 mb-3 hover:scale-105 transition-transform" 
          />
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            ICMRS
          </h1>
          <p className="text-xs font-semibold text-gray-500 tracking-wide mt-1">
            Intelligent Civic Management &amp; Response System
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" aria-hidden="true" />
            <span>Delhi Municipal Corporation &amp; Grievance Gateway</span>
          </div>
        </header>

        {/* Card Container */}
        <main className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div 
            role="tablist" 
            aria-label="Authentication modes" 
            className="flex bg-gray-100 p-1 rounded-2xl mb-6"
          >
            <button
              type="button"
              id="tab-signin-btn"
              role="tab"
              aria-selected={authMode === 'login'}
              aria-controls="signin-panel"
              onClick={() => handleTabSwitch('login')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                authMode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="tab-register-btn"
              role="tab"
              aria-selected={authMode === 'register'}
              aria-controls="register-panel"
              onClick={() => handleTabSwitch('register')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                authMode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Create Account</span>
            </button>
          </div>

          {/* OAuth Processing Interstitial */}
          {authState === 'oauth_processing' && (
            <div 
              role="status" 
              className="mb-5 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-3 animate-in fade-in"
            >
              <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-indigo-950">Completing sign-in...</p>
                <p className="mt-0.5 text-indigo-700">Verifying your session with ICMRS security gateway.</p>
              </div>
            </div>
          )}

          {/* Unified Alert Component (No developer/debug messages) */}
          {authAlert && authState !== 'oauth_processing' && (
            <div
              id={authAlert.type === 'error' ? 'auth-error-alert' : 'auth-success-alert'}
              role="alert"
              aria-live="polite"
              className={`mb-5 p-3.5 rounded-2xl border text-xs flex items-start gap-2.5 animate-in fade-in ${
                authAlert.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : authAlert.type === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {authAlert.type === 'error' && (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              {authAlert.type === 'warning' && (
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              )}
              {authAlert.type === 'success' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
              )}

              <div className="flex-1">
                <p className={`font-semibold ${
                  authAlert.type === 'error' 
                    ? 'text-rose-900' 
                    : authAlert.type === 'warning' 
                    ? 'text-amber-950' 
                    : 'text-emerald-900'
                }`}>
                  {authAlert.title}
                </p>
                <p className={`mt-0.5 leading-relaxed ${
                  authAlert.type === 'error' 
                    ? 'text-rose-700' 
                    : authAlert.type === 'warning' 
                    ? 'text-amber-800' 
                    : 'text-emerald-700'
                }`}>
                  {authAlert.message}
                </p>

                {/* Email Verification Action Buttons */}
                {authAlert.isVerificationRequired && (
                  <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={resendingEmail}
                      loadingText="Resending..."
                      onClick={handleResendVerification}
                      leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    >
                      Resend verification email
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        clearAlerts();
                        setAuthMode('login');
                      }}
                      leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
                    >
                      Back to login
                    </Button>
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
          )}

          {/* ==================================================== */}
          {/* TAB 1: SIGN IN VIEW                                  */}
          {/* ==================================================== */}
          {authMode === 'login' ? (
            <div id="signin-panel" role="tabpanel" aria-labelledby="tab-signin-btn">
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                  Welcome Back
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sign in to access your complaints, active dispatches, and civic hub.
                </p>
              </div>

              {/* Method 1: Google Authentication */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500">
                    Sign in with Google
                  </span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    One-Tap Access
                  </span>
                </div>

                <Button
                  id="google-signin-btn"
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={isFormBusy}
                  isLoading={authState === 'submitting' && authLoading}
                  loadingText="Authenticating with Google..."
                  onClick={handleGoogleSignIn}
                  leftIcon={
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
                  }
                >
                  Continue with Google
                </Button>
              </div>

              {/* Method 2: Email and Password Divider (Sentence Case, Fixed 26-char all-caps) */}
              <div className="relative flex py-1 items-center mb-4">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-500 text-xs font-medium">
                  Or continue with email &amp; password
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Forgot Password Accordion */}
              {showForgotPassword && (
                <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-4 mb-4 animate-in fade-in">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Reset Password</span>
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowForgotPassword(false);
                        setResetMessage(null);
                      }}
                      className="!h-7 !px-2 text-xs"
                    >
                      Close
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2.5">
                    Enter your email address to receive password reset instructions.
                  </p>

                  {resetMessage && (
                    <div 
                      role="status" 
                      className={`p-2.5 rounded-xl text-xs mb-2.5 flex items-center gap-2 ${
                        resetMessage.type === 'success'
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      <span>{resetMessage.text}</span>
                    </div>
                  )}

                  <form onSubmit={handleForgotPasswordSubmit} className="space-y-2">
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="Enter registered email address"
                      aria-label="Email address for password reset"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      fullWidth
                      isLoading={resetSubmitting}
                      loadingText="Sending reset link..."
                    >
                      Send Password Reset Link
                    </Button>
                  </form>
                </div>
              )}

              {/* Quick Role Fill Presets: strictly gated behind DEV mode */}
              {import.meta.env.DEV && (
                <div className="mb-5 bg-amber-50/70 rounded-2xl p-3 border border-amber-200/80">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-900">
                      Dev Shortcut: Quick Role Fill
                    </span>
                    <span className="text-xs text-amber-700 font-medium bg-amber-100/80 px-2 py-0.5 rounded-md">
                      Development Only
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      id="preset-citizen-btn"
                      onClick={() => handleSelectRolePreset('citizen')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        email === 'citizen@icmrs.gov'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Citizen</span>
                    </button>
                    <button
                      type="button"
                      id="preset-officer-btn"
                      onClick={() => handleSelectRolePreset('officer')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        email === 'officer@icmrs.gov'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Briefcase className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Officer</span>
                    </button>
                    <button
                      type="button"
                      id="preset-admin-btn"
                      onClick={() => handleSelectRolePreset('admin')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 ${
                        email === 'admin@icmrs.gov'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" aria-hidden="true" />
                      <span>Admin</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                <div>
                  <label 
                    htmlFor="login-email-input" 
                    className="block text-xs font-semibold text-gray-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="login-email-input"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="login-password-input" 
                      className="block text-xs font-semibold text-gray-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      id="forgot-password-link-btn"
                      onClick={() => {
                        setResetEmail(email.trim());
                        setShowForgotPassword(true);
                        setResetMessage(null);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-btn"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-indigo-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Secure Session Affordance (Fixed: Clear Status Indicator) */}
                <div className="flex items-center justify-between pt-1">
                  <label 
                    htmlFor="remember-me-checkbox"
                    className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 select-none hover:text-gray-900 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id="remember-me-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span>Remember on this device</span>
                  </label>

                  {/* Informational Status Badge: Unambiguous non-button indicator */}
                  <div 
                    className="inline-flex items-center gap-1.5 text-xs text-gray-500 select-none"
                    title="Session is authenticated and encrypted via TLS"
                    aria-label="Security status: Secure session"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
                    <span className="font-medium text-gray-600">Secure session</span>
                  </div>
                </div>

                {/* Standardized Primary Submit Button */}
                <Button
                  id="login-submit-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isFormBusy}
                  isLoading={isFormBusy}
                  loadingText="Signing In..."
                  leftIcon={<UserCheck className="w-4 h-4" />}
                >
                  Sign In to ICMRS
                </Button>
              </form>

              {/* Switch to Registration */}
              <div className="mt-5 text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  New resident in Delhi NCT?{' '}
                  <button
                    type="button"
                    id="switch-to-register-btn"
                    onClick={() => handleTabSwitch('register')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 rounded"
                  >
                    Create a citizen account
                  </button>
                </p>
              </div>
            </div>
          ) : (
            /* ==================================================== */
            /* TAB 2: CITIZEN REGISTRATION VIEW                     */
            /* ==================================================== */
            <div id="register-panel" role="tabpanel" aria-labelledby="tab-register-btn">
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-1 text-indigo-600 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Citizen Enrollment</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                  Create Citizen Account
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Register your account to report civic issues, track real-time repairs, and receive updates.
                </p>
              </div>

              {/* Fast 1-Click Registration with Google */}
              <div className="mb-4">
                <Button
                  id="google-register-btn"
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={isFormBusy}
                  isLoading={authState === 'submitting' && authLoading}
                  loadingText="Connecting with Google..."
                  onClick={handleGoogleSignIn}
                  leftIcon={
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
                  }
                >
                  Sign up instantly with Google
                </Button>
              </div>

              <div className="relative flex py-1 items-center mb-3.5">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-500 text-xs font-medium">
                  Or register with email
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                {/* Full Name */}
                <div>
                  <label 
                    htmlFor="reg-name-input" 
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => {
                        setRegName(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label 
                    htmlFor="reg-email-input" 
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => {
                        setRegEmail(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      placeholder="citizen@example.com"
                      className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {/* Residential Sector */}
                <div>
                  <label 
                    htmlFor="reg-ward-select" 
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Residential Ward / Sector
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <MapPin className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <select
                      id="reg-ward-select"
                      value={regWard}
                      onChange={(e) => setRegWard(e.target.value)}
                      className="w-full pl-10 pr-4 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#111827] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    >
                      <option value="Central Delhi — Connaught Place & Karol Bagh">Central Delhi — Connaught Place &amp; Karol Bagh</option>
                      <option value="South Delhi — Hauz Khas, Saket & GK">South Delhi — Hauz Khas, Saket &amp; GK</option>
                      <option value="New Delhi — India Gate & Chanakyapuri">New Delhi — India Gate &amp; Chanakyapuri</option>
                      <option value="West Delhi — Janakpuri & Rajouri Garden">West Delhi — Janakpuri &amp; Rajouri Garden</option>
                      <option value="North West Delhi — Rohini & Pitampura">North West Delhi — Rohini &amp; Pitampura</option>
                      <option value="East Delhi — Mayur Vihar & Laxmi Nagar">East Delhi — Mayur Vihar &amp; Laxmi Nagar</option>
                      <option value="South West Delhi — Dwarka & Vasant Kunj">South West Delhi — Dwarka &amp; Vasant Kunj</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label 
                      htmlFor="reg-password-input" 
                      className="block text-xs font-semibold text-gray-700"
                    >
                      Password
                    </label>
                    <span className="text-xs text-gray-500">Min. 6 characters</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="reg-password-input"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => {
                        setRegPassword(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 h-11 bg-gray-50 border border-gray-200 rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <button
                      type="button"
                      id="toggle-reg-password-btn"
                      aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer focus-visible:outline-none focus-visible:text-indigo-600"
                    >
                      {showRegPassword ? (
                        <EyeOff className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        <Eye className="w-4 h-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label 
                    htmlFor="reg-confirm-password-input" 
                    className="block text-xs font-semibold text-gray-700 mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <input
                      id="reg-confirm-password-input"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => {
                        setRegConfirmPassword(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-4 h-11 bg-gray-50 border rounded-xl text-sm text-[#111827] placeholder:text-gray-400 focus:outline-none transition-all ${
                        regConfirmPassword && regConfirmPassword !== regPassword
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                          : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                  </div>
                  {regConfirmPassword && regConfirmPassword !== regPassword && (
                    <p className="text-xs text-rose-600 mt-1 font-medium">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="pt-1">
                  <label 
                    htmlFor="reg-terms-checkbox"
                    className="flex items-start gap-2 cursor-pointer text-xs text-gray-700 select-none hover:text-gray-900 transition-colors"
                  >
                    <input
                      type="checkbox"
                      id="reg-terms-checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
                    />
                    <span className="leading-relaxed">
                      I agree to the Civic Portal Terms of Use &amp; Privacy Policy.
                    </span>
                  </label>
                </div>

                {/* Register Submit Button */}
                <Button
                  id="register-submit-btn"
                  type="submit"
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={isFormBusy}
                  isLoading={isFormBusy}
                  loadingText="Creating Citizen Account..."
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Create Citizen Account
                </Button>
              </form>

              {/* Switch to Login */}
              <div className="mt-5 text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    id="switch-to-login-btn"
                    onClick={() => handleTabSwitch('login')}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-600 rounded"
                  >
                    Sign in to your account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Security Notice Footer (Fixed: 12px text) */}
          <footer className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />
              <span>Municipal Identity Protocol v2.4</span>
            </span>
            <span className="font-medium text-gray-500">TLS Protected</span>
          </footer>
        </main>

        {/* Bottom Helper info (Fixed: 12px text) */}
        <footer className="text-center mt-6 text-xs text-gray-500">
          <p className="font-medium text-gray-600">ICMRS Civic Intelligence System</p>
          <p className="mt-0.5 text-gray-500">Delhi NCT Municipal Services &amp; Citizen Grievance Redressal</p>
        </footer>
      </div>
    </div>
  );
};
