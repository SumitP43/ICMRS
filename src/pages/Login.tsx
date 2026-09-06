/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CivicRole } from '../types';

interface LoginProps {
  onLoginSuccess?: (role: CivicRole) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { login, register, signInWithGoogle, loading: authLoading } = useAuth();

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Registration form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regWard, setRegWard] = useState('District 04 — Oak Ridge Sector');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Feedback & loaders
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setGoogleLoading(true);
    try {
      const user = await signInWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess(user.role);
      }
    } catch (err: unknown) {
      console.error('Google sign-in failure:', err);
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      setErrorMessage(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email address and password.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password }, rememberMe);

      if (result.success && result.user) {
        if (onLoginSuccess) {
          onLoginSuccess(result.user.role);
        }
      } else {
        setErrorMessage(result.error || 'Invalid email or password. Please check your credentials.');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setErrorMessage('Network or server error encountered. Please check connectivity.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName.trim() || regName.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter both passwords.');
      return;
    }

    if (!agreeTerms) {
      setErrorMessage('Please confirm agreement to District Civic Transparency terms.');
      return;
    }

    setSubmitting(true);

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
        setSuccessMessage('Account created successfully! Redirecting to Citizen Hub...');
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess('citizen');
          }
        }, 500);
      } else {
        setErrorMessage(result.error || 'Could not register account. Please try again.');
      }
    } catch (err) {
      console.error('Registration submit error:', err);
      setErrorMessage('Network error during registration. Please verify connection.');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to pre-populate demo credentials for quick testing
  const handleSelectRolePreset = (role: CivicRole) => {
    setErrorMessage(null);
    setSuccessMessage(null);
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

  const isLoading = submitting || authLoading;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#191c1e] flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 font-['Inter',sans-serif]">
      <div className="w-full max-w-md">
        {/* ICMRS Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-13 h-13 bg-indigo-600 rounded-2xl text-white font-bold text-2xl shadow-lg shadow-indigo-100 mb-3 ring-4 ring-indigo-50">
            C
          </div>
          <h1 className="font-['Plus_Jakarta_Sans'] text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            ICMRS
          </h1>
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mt-1">
            Intelligent Civic Response & Municipal Services
          </p>

          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border border-gray-200 text-gray-700 text-[11px] font-medium">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Metro District 04 — Municipal Gateway</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl shadow-gray-200/50 p-6 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="flex bg-gray-100 p-1 rounded-2xl mb-6">
            <button
              type="button"
              id="tab-signin-btn"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              id="tab-register-btn"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Account</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div 
              id="auth-error-alert" 
              className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">Verification Alert</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div 
              id="auth-success-alert" 
              className="mb-5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-in fade-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-emerald-900">Account Ready</p>
                <p className="mt-0.5 text-emerald-700">{successMessage}</p>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 1: SIGN IN VIEW                                  */}
          {/* ==================================================== */}
          {authMode === 'login' ? (
            <div>
              <div className="mb-5">
                <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                  Welcome Back
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Sign in to access your complaints, active dispatches, and civic hub.
                </p>
              </div>

              {/* Google Sign-in */}
              <div className="mb-5">
                <button
                  type="button"
                  id="google-signin-btn"
                  disabled={isLoading || googleLoading}
                  onClick={handleGoogleSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-50 text-gray-800 text-[13px] font-bold border border-gray-300 shadow-2xs hover:shadow transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {googleLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Connecting with Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-center text-gray-400 mt-1.5">
                  Instant verification for registered municipal accounts
                </p>
              </div>

              <div className="relative flex py-1 items-center mb-5">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink mx-3 text-gray-400 text-[10px] font-semibold uppercase tracking-wider">
                  Or test role preset
                </span>
                <div className="flex-grow border-t border-gray-200"></div>
              </div>

              {/* Quick Role Fill Presets */}
              <div className="mb-5 bg-gray-50 rounded-2xl p-2.5 border border-gray-200/70">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    Quick Role Fill:
                  </span>
                  <span className="text-[10px] text-indigo-600 font-medium">Click to test</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    id="preset-citizen-btn"
                    onClick={() => handleSelectRolePreset('citizen')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      email === 'citizen@icmrs.gov'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-3 h-3 text-indigo-600" />
                    <span>Citizen</span>
                  </button>
                  <button
                    type="button"
                    id="preset-officer-btn"
                    onClick={() => handleSelectRolePreset('officer')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      email === 'officer@icmrs.gov'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Briefcase className="w-3 h-3 text-indigo-600" />
                    <span>Officer</span>
                  </button>
                  <button
                    type="button"
                    id="preset-admin-btn"
                    onClick={() => handleSelectRolePreset('admin')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1 cursor-pointer ${
                      email === 'admin@icmrs.gov'
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    <span>Admin</span>
                  </button>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label 
                    htmlFor="login-email-input" 
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="login-email-input"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="citizen@icmrs.gov or your email"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label 
                      htmlFor="login-password-input" 
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <span className="text-[11px] text-gray-400">
                      Min. 6 characters
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <button
                      type="button"
                      id="toggle-password-visibility-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
                    <input
                      type="checkbox"
                      id="remember-me-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    />
                    <span>Remember on this device</span>
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Secure Session
                  </span>
                </div>

                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Signing In...</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Sign In to ICMRS</span>
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Registration */}
              <div className="mt-5 text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  New citizen in District 04?{' '}
                  <button
                    type="button"
                    id="switch-to-register-btn"
                    onClick={() => {
                      setAuthMode('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
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
            <div>
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-1 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Citizen Enrollment</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 font-['Plus_Jakarta_Sans']">
                  Create Citizen Account
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get your official District 04 Citizen Token to report civic issues and track resolutions.
                </p>
              </div>

              {/* Citizen Token Preview Badge */}
              <div className="mb-4 p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    CT
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                      Auto-Issued Citizen Token
                    </span>
                    <span className="text-[12px] font-mono font-bold text-gray-800">
                      #CT-{(Math.abs((regEmail.length * 4821) + 12450) % 90000) + 10000}-X
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Instant Verified
                </span>
              </div>

              {/* Registration Form */}
              <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label 
                    htmlFor="reg-name-input" 
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Aarav Sharma"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {/* Email Address */}
                <div>
                  <label 
                    htmlFor="reg-email-input" 
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="citizen@example.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                  </div>
                </div>

                {/* Residential Sector */}
                <div>
                  <label 
                    htmlFor="reg-ward-select" 
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Residential Ward / Sector
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <select
                      id="reg-ward-select"
                      value={regWard}
                      onChange={(e) => setRegWard(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    >
                      <option value="District 04 — Oak Ridge Sector">District 04 — Oak Ridge Sector</option>
                      <option value="District 04 — Maple Highlands">District 04 — Maple Highlands</option>
                      <option value="District 04 — Riverside Precinct">District 04 — Riverside Precinct</option>
                      <option value="District 04 — Downtown Central">District 04 — Downtown Central</option>
                      <option value="District 04 — Industrial Beltway">District 04 — Industrial Beltway</option>
                    </select>
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label 
                      htmlFor="reg-password-input" 
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wider"
                    >
                      Password
                    </label>
                    <span className="text-[11px] text-gray-400">Min. 6 characters</span>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-password-input"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-11 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
                    />
                    <button
                      type="button"
                      id="toggle-reg-password-btn"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label 
                    htmlFor="reg-confirm-password-input" 
                    className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="reg-confirm-password-input"
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={(e) => setRegConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none transition-all ${
                        regConfirmPassword && regConfirmPassword !== regPassword
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100'
                          : 'border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                  </div>
                  {regConfirmPassword && regConfirmPassword !== regPassword && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">
                      Passwords do not match
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer text-xs text-gray-600 select-none">
                    <input
                      type="checkbox"
                      id="reg-terms-checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mt-0.5"
                    />
                    <span className="text-[11px] leading-relaxed">
                      I agree to the District 04 Civic Transparency & Verification protocol.
                    </span>
                  </label>
                </div>

                {/* Register Submit Button */}
                <button
                  id="register-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Citizen Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Citizen Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Switch to Login */}
              <div className="mt-5 text-center pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Already registered?{' '}
                  <button
                    type="button"
                    id="switch-to-login-btn"
                    onClick={() => {
                      setAuthMode('login');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className="font-bold text-indigo-600 hover:text-indigo-800 underline ml-1 cursor-pointer"
                  >
                    Sign in to your account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* Security Notice Footer */}
          <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Municipal Identity Protocol v2.4</span>
            </span>
            <span>TLS Protected</span>
          </div>
        </div>

        {/* Bottom Helper info */}
        <div className="text-center mt-6 text-xs text-gray-400">
          <p>ICMRS Civic Intelligence System</p>
          <p className="text-[11px] mt-0.5">District 04 Municipal Services & Citizen Protection</p>
        </div>
      </div>
    </div>
  );
};
