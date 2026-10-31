/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Mail, 
  User, 
  MapPin, 
  KeyRound, 
  RefreshCw, 
  Check, 
  Lock, 
  Phone,
  ShieldCheck,
  Building2,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CivicRole } from '../types';
import { ICMRSLogo } from '../components/ICMRSBranding';
import { Button } from '../components/ui/Button';

// Modular Auth Subcomponents
import { BrandPanel } from '../components/auth/BrandPanel';
import { AuthTabs } from '../components/auth/AuthTabs';
import { GoogleButton } from '../components/auth/GoogleButton';
import { PasswordField } from '../components/auth/PasswordField';
import { FormAlert, FormAlertProps } from '../components/auth/FormAlert';
import { DevRolePresets } from '../components/auth/DevRolePresets';

interface LoginProps {
  onLoginSuccess?: (role: CivicRole) => void;
}

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

const DELHI_WARDS = [
  'Central Delhi — Connaught Place & Karol Bagh',
  'South Delhi — Hauz Khas, Saket & Greater Kailash',
  'New Delhi — India Gate, Chanakyapuri & Lodhi Road',
  'South West Delhi — Dwarka, Vasant Kunj & Najafgarh',
  'West Delhi — Janakpuri, Rajouri Garden & Punjabi Bagh',
  'North West Delhi — Rohini, Pitampura & Shalimar Bagh',
  'North Delhi — Civil Lines, Model Town & Kashmere Gate',
  'East Delhi — Mayur Vihar, Laxmi Nagar & Preet Vihar',
  'North East Delhi — Shahdara, Seelampur & Dilshad Garden',
  'South East Delhi — Kalkaji, Nehru Place & Okhla',
  'Shahdara — Vivek Vihar & Anand Vihar'
];

function getPasswordStrength(pass: string): { score: number; label: string; color: string } {
  if (!pass) return { score: 0, label: '', color: 'bg-slate-200' };
  let score = 0;
  if (pass.length >= 6) score += 1;
  if (pass.length >= 10) score += 1;
  if (/[0-9]/.test(pass)) score += 1;
  if (/[^A-Za-z0-9]/.test(pass)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score: 2, label: 'Fair', color: 'bg-amber-500' };
  if (score === 3) return { score: 3, label: 'Good', color: 'bg-blue-600' };
  return { score: 4, label: 'Strong', color: 'bg-emerald-600' };
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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

  // Sign In Form State (Never prefilled on load)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Sign In Touched Fields
  const [loginTouched, setLoginTouched] = useState<{ email?: boolean; password?: boolean }>({});

  // Forgot Password Accordion State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Registration Form State (Never prefilled on load)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regWard, setRegWard] = useState(DELHI_WARDS[0]);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Registration Touched Fields
  const [regTouched, setRegTouched] = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirmPassword?: boolean;
    terms?: boolean;
  }>({});

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

  const clearAlerts = useCallback(() => {
    setAuthAlert(null);
    setResendFeedback(null);
    clearError();
    if (authState !== 'submitting') {
      setAuthState('idle');
    }
  }, [clearError, authState]);

  const handleTabSwitch = (mode: 'login' | 'register') => {
    setAuthMode(mode);
    clearAlerts();
    setShowForgotPassword(false);
    setLoginTouched({});
    setRegTouched({});
  };

  // Inline Validation Calculations
  const loginErrors = useMemo(() => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    }
    return errors;
  }, [email, password]);

  const regErrors = useMemo(() => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      terms?: string;
    } = {};

    if (!regName.trim() || regName.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters.';
    }
    if (!regEmail.trim()) {
      errors.email = 'Email address is required.';
    } else if (!isValidEmail(regEmail)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!regPassword) {
      errors.password = 'Password is required.';
    } else if (regPassword.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (regPassword !== regConfirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    if (!agreeTerms) {
      errors.terms = 'Agreement to Terms of Use is required.';
    }

    return errors;
  }, [regName, regEmail, regPassword, regConfirmPassword, agreeTerms]);

  const regPasswordStrength = useMemo(() => getPasswordStrength(regPassword), [regPassword]);

  // Submit Handlers
  const handleGoogleSignIn = async () => {
    clearAlerts();
    setAuthState('submitting');
    try {
      await signInWithGoogle();
    } catch {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Google Sign-In Unavailable',
        message: "We couldn't complete sign-in with Google. Please use your email credentials or dev quick-fill.",
      });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginTouched({ email: true, password: true });

    if (loginErrors.email || loginErrors.password) {
      setAuthState('invalid_credentials');
      return;
    }

    clearAlerts();
    setAuthState('submitting');

    try {
      const result = await login({ email: email.trim(), password }, rememberMe);

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
      } else {
        setAuthState('invalid_credentials');
        setAuthAlert({
          type: 'error',
          title: 'Unable to sign in',
          message: result.error || 'The email or password entered is incorrect. Please verify and try again.',
        });
      }
    } catch {
      setAuthState('error');
      setAuthAlert({
        type: 'error',
        title: 'Unable to sign in',
        message: "We couldn't complete your sign-in. Please try again or use a dev role preset.",
      });
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegTouched({
      name: true,
      email: true,
      password: true,
      confirmPassword: true,
      terms: true,
    });

    if (Object.keys(regErrors).length > 0) {
      setAuthState('error');
      return;
    }

    clearAlerts();
    setAuthState('submitting');

    try {
      const result = await register(
        {
          name: regName.trim(),
          email: regEmail.trim(),
          password: regPassword,
          wardOrSector: regWard,
          phone: regPhone.trim() || undefined,
        },
        rememberMe
      );

      if (result.success && result.user) {
        setAuthState('authenticated');
        setAuthAlert({
          type: 'success',
          title: 'Account created successfully',
          message: 'Welcome to ICMRS! Initializing your civic dashboard...',
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
        title: 'Unable to create account',
        message: 'Registration request could not be processed. Please try again.',
      });
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = resetEmail.trim();
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
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
      setResendFeedback('Failed to resend verification email. Please check your network and try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  // Helper for development testing presets
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
    <div className="min-h-screen bg-[#F4F7FB] text-[#172B4D] font-['Inter',sans-serif] flex flex-col justify-between selection:bg-[#315EBD] selection:text-white">
      {/* Mobile-Only Slim Top Header */}
      <header className="lg:hidden bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ICMRSLogo variant="emblem" size="sm" />
          <div>
            <span className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-base text-[#172B4D] tracking-tight leading-none block">
              ICMRS
            </span>
            <span className="text-[10px] text-[#64748B] font-medium leading-tight">
              Intelligent Civic Management &amp; Response
            </span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-semibold text-slate-700">
          <Building2 className="w-3 h-3 text-[#315EBD]" aria-hidden="true" />
          <span>Delhi NCT</span>
        </div>
      </header>

      {/* Main Two-Column Viewport Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 max-w-[1440px] mx-auto w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ======================================================== */}
          {/* LEFT: BRAND PANEL (~55% on desktop, below on mobile)      */}
          {/* ======================================================== */}
          <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-7">
            <BrandPanel />
          </div>

          {/* ======================================================== */}
          {/* RIGHT: AUTHENTICATION CARD (~45% on desktop, top mobile)  */}
          {/* ======================================================== */}
          <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-5 w-full max-w-[480px] mx-auto">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow duration-200 p-6 sm:p-8">
              
              {/* Segmented Auth Mode Tabs */}
              <AuthTabs
                activeTab={authMode}
                onTabChange={handleTabSwitch}
                disabled={isFormBusy}
              />

              {/* Interstitial OAuth Processing */}
              {authState === 'oauth_processing' && (
                <div 
                  role="status" 
                  className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[#315EBD] text-xs flex items-center gap-2.5"
                >
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-[#315EBD]" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-slate-900">Verifying session...</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">Connecting to the ICMRS municipal security gateway.</p>
                  </div>
                </div>
              )}

              {/* Accessible Form Alert */}
              <FormAlert
                alert={authAlert}
                resendingEmail={resendingEmail}
                resendFeedback={resendFeedback}
                onResendVerification={handleResendVerification}
                onBackToLogin={() => handleTabSwitch('login')}
              />

              {/* Dev Quick-Fill Tool (DEV Only, Unobtrusive) */}
              <DevRolePresets
                currentEmail={email}
                onSelectRole={handleSelectRolePreset}
              />

              {/* ==================================================== */}
              {/* TAB 1: SIGN IN FORM                                  */}
              {/* ==================================================== */}
              {authMode === 'login' ? (
                <div id="signin-panel" role="tabpanel" aria-labelledby="tab-signin-btn">
                  <div className="mb-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#172B4D] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                      Welcome back
                    </h2>
                    <p className="text-xs text-[#64748B] mt-1">
                      Sign in to track reported grievances, view active dispatches, or manage municipal operations.
                    </p>
                  </div>

                  {/* Google OAuth Button */}
                  <div className="mb-4">
                    <GoogleButton
                      id="google-signin-btn"
                      onClick={handleGoogleSignIn}
                      disabled={isFormBusy}
                      isLoading={authState === 'submitting' && authLoading}
                      text="Continue with Google"
                    />
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center mb-4">
                    <div className="flex-grow border-t border-[#E2E8F0]" />
                    <span className="flex-shrink mx-3 text-[#64748B] text-xs font-medium">
                      or continue with credentials
                    </span>
                    <div className="flex-grow border-t border-[#E2E8F0]" />
                  </div>

                  {/* Forgot Password Accordion */}
                  {showForgotPassword && (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-bold text-[#172B4D] flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-[#315EBD]" aria-hidden="true" />
                          <span>Reset Password</span>
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowForgotPassword(false);
                            setResetMessage(null);
                          }}
                          className="!h-6 !px-2 text-xs"
                        >
                          Close
                        </Button>
                      </div>
                      <p className="text-xs text-[#64748B] mb-2.5">
                        Enter your registered email address to receive password reset instructions.
                      </p>

                      {resetMessage && (
                        <div 
                          role="status" 
                          className={`p-2.5 rounded-lg text-xs mb-2.5 ${
                            resetMessage.type === 'success'
                              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                              : 'bg-red-50 text-red-900 border border-red-200'
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
                          placeholder="name@example.com"
                          aria-label="Email address for password reset"
                          className="w-full px-3 py-2 bg-white border border-[#E2E8F0] rounded-lg text-xs text-[#172B4D] focus:outline-none focus:border-[#315EBD] focus:ring-2 focus:ring-[#315EBD]/20"
                        />
                        <Button
                          type="submit"
                          variant="primary"
                          size="sm"
                          fullWidth
                          isLoading={resetSubmitting}
                          loadingText="Sending reset link..."
                          className="!bg-[#315EBD] hover:!bg-[#254B9A]"
                        >
                          Send Password Reset Link
                        </Button>
                      </form>
                    </div>
                  )}

                  {/* Login Form */}
                  <form onSubmit={handleLoginSubmit} className="space-y-4" noValidate>
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="login-email-input" 
                        className="block text-xs font-semibold text-[#172B4D]"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <input
                          id="login-email-input"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (authAlert) clearAlerts();
                          }}
                          onBlur={() => setLoginTouched((prev) => ({ ...prev, email: true }))}
                          placeholder="name@example.com"
                          aria-invalid={loginTouched.email && !!loginErrors.email ? 'true' : 'false'}
                          aria-describedby={loginTouched.email && loginErrors.email ? 'login-email-error' : undefined}
                          className={`w-full pl-10 pr-4 h-11 bg-[#F8FAFC] rounded-xl text-sm text-[#172B4D] placeholder:text-slate-400 border transition-all focus:outline-none focus:bg-white ${
                            loginTouched.email && loginErrors.email
                              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                              : 'border-[#E2E8F0] focus:border-[#315EBD] focus:ring-2 focus:ring-[#315EBD]/20'
                          }`}
                        />
                      </div>
                      {loginTouched.email && loginErrors.email && (
                        <p id="login-email-error" className="text-xs text-red-600 font-medium mt-1 animate-in fade-in">
                          {loginErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Password Input with Caps Lock Warning */}
                    <PasswordField
                      id="login-password-input"
                      label="Password"
                      value={password}
                      autoComplete="current-password"
                      required
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (authAlert) clearAlerts();
                      }}
                      onBlur={() => setLoginTouched((prev) => ({ ...prev, password: true }))}
                      touched={loginTouched.password}
                      error={loginErrors.password}
                      rightLabelAction={
                        <button
                          type="button"
                          id="forgot-password-link-btn"
                          onClick={() => {
                            setResetEmail(email.trim());
                            setShowForgotPassword(true);
                            setResetMessage(null);
                          }}
                          className="text-xs font-semibold text-[#315EBD] hover:text-[#254B9A] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                        >
                          Forgot password?
                        </button>
                      }
                    />

                    {/* Remember Me and Security Indicator */}
                    <div className="flex items-center justify-between pt-0.5">
                      <label 
                        htmlFor="remember-me-checkbox"
                        className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 select-none hover:text-slate-900 transition-colors"
                      >
                        <input
                          type="checkbox"
                          id="remember-me-checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="w-4 h-4 text-[#315EBD] rounded border-[#E2E8F0] focus:ring-[#315EBD] cursor-pointer"
                        />
                        <span>Remember me</span>
                      </label>

                      <div 
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 select-none"
                        title="Session is protected by TLS encryption"
                      >
                        <Lock className="w-3 h-3 text-emerald-600" aria-hidden="true" />
                        <span>Encrypted session</span>
                      </div>
                    </div>

                    {/* Primary Submit Button */}
                    <Button
                      id="login-submit-btn"
                      type="submit"
                      variant="primary"
                      size="md"
                      fullWidth
                      disabled={isFormBusy}
                      isLoading={isFormBusy}
                      loadingText="Signing In..."
                      className="!h-11 !bg-[#315EBD] hover:!bg-[#254B9A] shadow-xs"
                    >
                      Sign In to ICMRS
                    </Button>
                  </form>

                  {/* Switch to Register */}
                  <div className="mt-5 text-center pt-4 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#64748B]">
                      New to ICMRS?{' '}
                      <button
                        type="button"
                        id="switch-to-register-btn"
                        onClick={() => handleTabSwitch('register')}
                        className="font-bold text-[#315EBD] hover:text-[#254B9A] underline ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#315EBD] rounded"
                      >
                        Create Citizen Account
                      </button>
                    </p>
                  </div>
                </div>
              ) : (
                /* ==================================================== */
                /* TAB 2: CITIZEN REGISTRATION FORM                     */
                /* ==================================================== */
                <div id="register-panel" role="tabpanel" aria-labelledby="tab-register-btn">
                  <div className="mb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#172B4D] font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
                      Create Citizen Account
                    </h2>
                    <p className="text-xs text-[#64748B] mt-1">
                      Register to file civic complaints, monitor street repairs in real-time, and get SMS dispatch updates.
                    </p>
                  </div>

                  {/* Google OAuth Quick Register */}
                  <div className="mb-4">
                    <GoogleButton
                      id="google-register-btn"
                      onClick={handleGoogleSignIn}
                      disabled={isFormBusy}
                      isLoading={authState === 'submitting' && authLoading}
                      text="Sign up with Google"
                    />
                  </div>

                  {/* Divider */}
                  <div className="relative flex py-1 items-center mb-3.5">
                    <div className="flex-grow border-t border-[#E2E8F0]" />
                    <span className="flex-shrink mx-3 text-[#64748B] text-xs font-medium">
                      or register with email details
                    </span>
                    <div className="flex-grow border-t border-[#E2E8F0]" />
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5" noValidate>
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label 
                        htmlFor="reg-name-input" 
                        className="block text-xs font-semibold text-[#172B4D]"
                      >
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <User className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <input
                          id="reg-name-input"
                          name="name"
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => {
                            setRegName(e.target.value);
                            if (authAlert) clearAlerts();
                          }}
                          onBlur={() => setRegTouched((prev) => ({ ...prev, name: true }))}
                          placeholder="e.g. Aarav Sharma"
                          aria-invalid={regTouched.name && !!regErrors.name ? 'true' : 'false'}
                          aria-describedby={regTouched.name && regErrors.name ? 'reg-name-error' : undefined}
                          className={`w-full pl-10 pr-4 h-11 bg-[#F8FAFC] rounded-xl text-sm text-[#172B4D] placeholder:text-slate-400 border transition-all focus:outline-none focus:bg-white ${
                            regTouched.name && regErrors.name
                              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                              : 'border-[#E2E8F0] focus:border-[#315EBD] focus:ring-2 focus:ring-[#315EBD]/20'
                          }`}
                        />
                      </div>
                      {regTouched.name && regErrors.name && (
                        <p id="reg-name-error" className="text-xs text-red-600 font-medium animate-in fade-in">
                          {regErrors.name}
                        </p>
                      )}
                    </div>

                    {/* Email Address */}
                    <div className="space-y-1">
                      <label 
                        htmlFor="reg-email-input" 
                        className="block text-xs font-semibold text-[#172B4D]"
                      >
                        Email Address
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <input
                          id="reg-email-input"
                          name="email"
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => {
                            setRegEmail(e.target.value);
                            if (authAlert) clearAlerts();
                          }}
                          onBlur={() => setRegTouched((prev) => ({ ...prev, email: true }))}
                          placeholder="citizen@example.com"
                          aria-invalid={regTouched.email && !!regErrors.email ? 'true' : 'false'}
                          aria-describedby={regTouched.email && regErrors.email ? 'reg-email-error' : undefined}
                          className={`w-full pl-10 pr-4 h-11 bg-[#F8FAFC] rounded-xl text-sm text-[#172B4D] placeholder:text-slate-400 border transition-all focus:outline-none focus:bg-white ${
                            regTouched.email && regErrors.email
                              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100'
                              : 'border-[#E2E8F0] focus:border-[#315EBD] focus:ring-2 focus:ring-[#315EBD]/20'
                          }`}
                        />
                      </div>
                      {regTouched.email && regErrors.email && (
                        <p id="reg-email-error" className="text-xs text-red-600 font-medium animate-in fade-in">
                          {regErrors.email}
                        </p>
                      )}
                    </div>

                    {/* Ward Dropdown */}
                    <div className="space-y-1">
                      <label 
                        htmlFor="reg-ward-select" 
                        className="block text-xs font-semibold text-[#172B4D]"
                      >
                        Residential Ward / Sector
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                          <MapPin className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <select
                          id="reg-ward-select"
                          value={regWard}
                          onChange={(e) => setRegWard(e.target.value)}
                          className="w-full pl-10 pr-8 h-11 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#172B4D] focus:outline-none focus:border-[#315EBD] focus:bg-white focus:ring-2 focus:ring-[#315EBD]/20 transition-all cursor-pointer"
                        >
                          {DELHI_WARDS.map((ward) => (
                            <option key={ward} value={ward}>
                              {ward}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Password Field + Strength Indicator */}
                    <div className="space-y-1.5">
                      <PasswordField
                        id="reg-password-input"
                        label="Password"
                        value={regPassword}
                        autoComplete="new-password"
                        required
                        onChange={(e) => {
                          setRegPassword(e.target.value);
                          if (authAlert) clearAlerts();
                        }}
                        onBlur={() => setRegTouched((prev) => ({ ...prev, password: true }))}
                        touched={regTouched.password}
                        error={regErrors.password}
                        rightLabelAction={
                          regPassword && (
                            <span className="text-[11px] font-semibold text-[#64748B]">
                              Strength: <strong className="text-slate-800">{regPasswordStrength.label}</strong>
                            </span>
                          )
                        }
                      />

                      {/* Password Strength Meter Bar */}
                      {regPassword && (
                        <div className="space-y-1 pt-0.5">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4].map((step) => (
                              <div
                                key={step}
                                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                  step <= regPasswordStrength.score ? regPasswordStrength.color : 'bg-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Min. 6 chars, with numbers &amp; symbols recommended.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className="space-y-1">
                      <PasswordField
                        id="reg-confirm-password-input"
                        label="Confirm Password"
                        value={regConfirmPassword}
                        autoComplete="new-password"
                        required
                        onChange={(e) => {
                          setRegConfirmPassword(e.target.value);
                          if (authAlert) clearAlerts();
                        }}
                        onBlur={() => setRegTouched((prev) => ({ ...prev, confirmPassword: true }))}
                        touched={regTouched.confirmPassword}
                        error={regErrors.confirmPassword}
                        rightLabelAction={
                          regConfirmPassword && regConfirmPassword === regPassword ? (
                            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Match
                            </span>
                          ) : null
                        }
                      />
                    </div>

                    {/* Terms of Service Checkbox */}
                    <div className="pt-1">
                      <label 
                        htmlFor="reg-terms-checkbox"
                        className="flex items-start gap-2 cursor-pointer text-xs text-slate-700 select-none hover:text-slate-900 transition-colors"
                      >
                        <input
                          type="checkbox"
                          id="reg-terms-checkbox"
                          checked={agreeTerms}
                          onChange={(e) => setAgreeTerms(e.target.checked)}
                          onBlur={() => setRegTouched((prev) => ({ ...prev, terms: true }))}
                          className="w-4 h-4 text-[#315EBD] rounded border-[#E2E8F0] focus:ring-[#315EBD] mt-0.5 cursor-pointer"
                        />
                        <span className="leading-relaxed">
                          I agree to the Civic Portal Terms of Use &amp; Delhi Municipal Privacy Policy.
                        </span>
                      </label>
                      {regTouched.terms && regErrors.terms && (
                        <p className="text-xs text-red-600 font-medium mt-1 animate-in fade-in">
                          {regErrors.terms}
                        </p>
                      )}
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
                      loadingText="Creating Account..."
                      className="!h-11 !bg-[#315EBD] hover:!bg-[#254B9A] shadow-xs"
                    >
                      Create Citizen Account
                    </Button>
                  </form>

                  {/* Switch to Sign In */}
                  <div className="mt-5 text-center pt-4 border-t border-[#E2E8F0]">
                    <p className="text-xs text-[#64748B]">
                      Already registered?{' '}
                      <button
                        type="button"
                        id="switch-to-login-btn"
                        onClick={() => handleTabSwitch('login')}
                        className="font-bold text-[#315EBD] hover:text-[#254B9A] underline ml-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#315EBD] rounded"
                      >
                        Sign In to your account
                      </button>
                    </p>
                  </div>
                </div>
              )}

              {/* Trust Line Under Card */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  <span>256-bit TLS Encrypted</span>
                </span>
                <span>Audited • Privacy-First</span>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Subtle Global Bottom Footer */}
      <footer className="py-3 px-4 text-center text-xs text-[#64748B] border-t border-[#E2E8F0] bg-white">
        <p className="font-medium text-slate-700">
          Government of NCT of Delhi • Municipal Corporation of Delhi (MCD)
        </p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          Official Grievance Redressal Gateway • Public Service Helpline: 1916 / 1800-11-2233
        </p>
      </footer>
    </div>
  );
};
