/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CivicRole } from '../types';

interface LoginProps {
  onLoginSuccess?: (role: CivicRole) => void;
}

export type SimulatorState = 'default' | 'loading' | 'error' | 'success' | 'forgot';

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

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const { 
    login, 
    register, 
    signInWithGoogle, 
    loading: authLoading, 
    error: authError,
    clearError,
    currentUser,
    isAuthenticated 
  } = useAuth();

  // Mode: 'signin' | 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Simulator State: 'default' | 'loading' | 'error' | 'success' | 'forgot'
  const [formState, setFormState] = useState<SimulatorState>('default');

  // Form Fields (Preloaded with authentic prototype defaults)
  const [identity, setIdentity] = useState('r.sharma.delhi@gmail.com');
  const [password, setPassword] = useState('DelhiCitizen#2025');
  const [fullName, setFullName] = useState('Rajesh Sharma');
  const [ward, setWard] = useState(DELHI_WARDS[0]);
  const [keepSession, setKeepSession] = useState(true);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // OTP Fields (6 digits)
  const [otp, setOtp] = useState(['4', '9', '1', '8', '0', '2']);

  // Dynamic Alert Box
  const [customAlert, setCustomAlert] = useState<{
    type: 'loading' | 'error' | 'success' | 'info';
    message: string;
  } | null>(null);

  // Sync authenticated session redirect
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormState('success');
      setCustomAlert({
        type: 'success',
        message: 'Identity Authenticated. Redirecting to MCD Central Ward Dashboard...',
      });
      const timer = setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess(currentUser.role);
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, currentUser, onLoginSuccess]);

  // Sync global auth error
  useEffect(() => {
    if (authError) {
      setFormState('error');
      setCustomAlert({
        type: 'error',
        message: authError,
      });
    }
  }, [authError]);

  const switchAuthTab = (tab: 'signin' | 'signup') => {
    setActiveTab(tab);
    setFormState('default');
    setCustomAlert(null);
    clearError();
  };

  const setSimulatorState = (state: SimulatorState) => {
    setFormState(state);
    clearError();

    if (state === 'default') {
      setCustomAlert(null);
    } else if (state === 'loading') {
      setCustomAlert({
        type: 'loading',
        message: 'Connecting to MCD Secure Gateway & verifying Aadhaar token...',
      });
    } else if (state === 'error') {
      setCustomAlert({
        type: 'error',
        message: 'Authentication Failed: Invalid ID or credentials. Check Ward ID or reset passcode.',
      });
    } else if (state === 'success') {
      setCustomAlert({
        type: 'success',
        message: 'Identity Authenticated. Redirecting to MCD Central Ward Dashboard...',
      });
    } else if (state === 'forgot') {
      setCustomAlert({
        type: 'info',
        message: 'SMS verification code dispatched to registered mobile (linked to Aadhaar).',
      });
    }
  };

  const quickFill = (role: 'citizen' | 'officer' | 'admin') => {
    switchAuthTab('signin');
    if (role === 'citizen') {
      setIdentity('r.sharma.delhi@gmail.com');
      setPassword('DelhiCitizen#2025');
    } else if (role === 'officer') {
      setIdentity('insp.ward42@mcd.gov.in');
      setPassword('FieldDispatch#99');
    } else if (role === 'admin') {
      setIdentity('hq.director@mcd.nic.in');
      setPassword('MCDCentralHQ!Sec4');
    }
    setSimulatorState('default');
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const simulateSSO = async () => {
    setSimulatorState('loading');
    try {
      await signInWithGoogle();
    } catch {
      setTimeout(() => {
        setSimulatorState('success');
      }, 1200);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formState === 'forgot') {
      setSimulatorState('loading');
      setCustomAlert({
        type: 'loading',
        message: 'Verifying 6-digit municipal OTP token...',
      });
      setTimeout(() => {
        setSimulatorState('success');
        setCustomAlert({
          type: 'success',
          message: 'Passcode verified! Temporary credential token issued.',
        });
        setTimeout(() => {
          setSimulatorState('default');
        }, 1200);
      }, 1000);
      return;
    }

    if (activeTab === 'signup') {
      setSimulatorState('loading');
      setCustomAlert({
        type: 'loading',
        message: 'Registering citizen profile with Delhi NCT municipal gateway...',
      });

      try {
        const result = await register(
          {
            name: fullName.trim() || 'Rajesh Sharma',
            email: identity.trim().toLowerCase(),
            password,
            wardOrSector: ward,
          },
          keepSession
        );

        if (result.success && result.user) {
          setSimulatorState('success');
          setCustomAlert({
            type: 'success',
            message: 'Citizen account registered. Redirecting to your dashboard...',
          });
          setTimeout(() => {
            if (onLoginSuccess) onLoginSuccess('citizen');
          }, 600);
        } else {
          setSimulatorState('error');
          setCustomAlert({
            type: 'error',
            message: result.error || 'Registration failed. Please check your credentials.',
          });
        }
      } catch {
        setSimulatorState('error');
        setCustomAlert({
          type: 'error',
          message: 'Registration server error. Please try again.',
        });
      }
      return;
    }

    // Sign In Action
    setSimulatorState('loading');
    setCustomAlert({
      type: 'loading',
      message: 'Connecting to MCD Secure Gateway & verifying credentials...',
    });

    try {
      const result = await login({ email: identity.trim().toLowerCase(), password }, keepSession);

      if (result.success && result.user) {
        setSimulatorState('success');
        setCustomAlert({
          type: 'success',
          message: `Authenticated as ${result.user.name} (${result.user.role.toUpperCase()}). Redirecting...`,
        });
        setTimeout(() => {
          if (onLoginSuccess) onLoginSuccess(result.user!.role);
        }, 600);
      } else {
        setSimulatorState('error');
        setCustomAlert({
          type: 'error',
          message: result.error || 'Authentication Failed: Invalid ID or credentials. Check Ward ID or reset passcode.',
        });
      }
    } catch {
      setSimulatorState('error');
      setCustomAlert({
        type: 'error',
        message: 'Authentication Failed: Invalid ID or credentials. Check Ward ID or reset passcode.',
      });
    }
  };

  const isSubmitting = formState === 'loading' || authLoading;

  return (
    <div className="bg-[#f8f9ff] text-[#0b1c30] min-h-screen flex flex-col justify-between selection:bg-[#dae2ff] selection:text-[#001947] font-['Inter',sans-serif]">
      {/* Header */}
      <header className="w-full bg-white/80 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#e5eeff]">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0a45a4] flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[18px]">account_balance</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm text-[#0b1c30] tracking-tight font-semibold">MUNICIPAL PORTAL</span>
              <span className="text-[11px] text-[#434652] uppercase tracking-wider font-semibold">Authorized Access Gateway</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#eff4ff] text-[#00554d] text-[11px] font-semibold border border-[#d3e4fe]">
              <span className="w-2 h-2 rounded-full bg-[#006f66] animate-pulse"></span>
              <span>FEDRAMP MODERATE ENCLAVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex flex-col justify-center items-center px-4 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col w-full">
          {/* Dev Quick Switcher & Prototype Toolbar */}
          <aside aria-label="Development toolbar" className="w-full max-w-7xl mx-auto mb-4 px-2 sm:px-4">
            <div className="bg-[#eff4ff] rounded-xl p-2 sm:p-2.5 shadow-xs flex flex-wrap items-center justify-between gap-2 border border-[#dce9ff] text-[#0b1c30]">
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] uppercase tracking-wider text-[#434652] flex items-center gap-1 mr-1 font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-[#0a45a4]">terminal</span> State Simulator:
                </span>
                <button
                  type="button"
                  className={`state-btn px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    formState === 'default' ? 'bg-[#f8f9ff] text-[#0a45a4] shadow-xs' : 'hover:bg-[#d3e4fe] text-[#434652]'
                  }`}
                  onClick={() => setSimulatorState('default')}
                >
                  Default
                </button>
                <button
                  type="button"
                  className={`state-btn px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    formState === 'loading' ? 'bg-[#f8f9ff] text-[#0a45a4] shadow-xs' : 'hover:bg-[#d3e4fe] text-[#434652]'
                  }`}
                  onClick={() => setSimulatorState('loading')}
                >
                  Loading
                </button>
                <button
                  type="button"
                  className={`state-btn px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    formState === 'error' ? 'bg-[#f8f9ff] text-[#ba1a1a] shadow-xs' : 'hover:bg-[#d3e4fe] text-[#434652]'
                  }`}
                  onClick={() => setSimulatorState('error')}
                >
                  Invalid Creds
                </button>
                <button
                  type="button"
                  className={`state-btn px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    formState === 'success' ? 'bg-[#f8f9ff] text-[#00554d] shadow-xs' : 'hover:bg-[#d3e4fe] text-[#434652]'
                  }`}
                  onClick={() => setSimulatorState('success')}
                >
                  Success
                </button>
                <button
                  type="button"
                  className={`state-btn px-2.5 py-1 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    formState === 'forgot' ? 'bg-[#f8f9ff] text-[#0a45a4] shadow-xs' : 'hover:bg-[#d3e4fe] text-[#434652]'
                  }`}
                  onClick={() => setSimulatorState('forgot')}
                >
                  Forgot Pass
                </button>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-[#434652] mr-1 font-medium">Quick-Fill:</span>
                <button
                  type="button"
                  id="preset-citizen-btn"
                  className="px-2 py-1 rounded bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[12px] font-mono shadow-xs transition-colors border border-[#dce9ff] cursor-pointer"
                  onClick={() => quickFill('citizen')}
                >
                  Citizen: R. Sharma
                </button>
                <button
                  type="button"
                  id="preset-officer-btn"
                  className="px-2 py-1 rounded bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[12px] font-mono shadow-xs transition-colors border border-[#dce9ff] cursor-pointer"
                  onClick={() => quickFill('officer')}
                >
                  Officer: Ward 42
                </button>
                <button
                  type="button"
                  id="preset-admin-btn"
                  className="px-2 py-1 rounded bg-[#f8f9ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[12px] font-mono shadow-xs transition-colors border border-[#dce9ff] cursor-pointer"
                  onClick={() => quickFill('admin')}
                >
                  Admin: Central HQ
                </button>
              </div>
            </div>
          </aside>

          {/* 1440px Desktop Composition Container (55:45 Split Grid) */}
          <div className="w-full max-w-7xl mx-auto px-2 sm:px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              
              {/* ======================================================== */}
              {/* LEFT SECTION (55% Width on Desktop: 7 of 12 cols)       */}
              {/* ======================================================== */}
              <section className="lg:col-span-7 flex flex-col gap-5 lg:pr-4">
                {/* Authority Pill Badge */}
                <div className="flex items-center gap-1 self-start flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eff4ff] text-[#00554d] text-[11px] font-semibold shadow-xs border border-[#d3e4fe]">
                    <span className="w-2 h-2 rounded-full bg-[#006f66] animate-ping"></span>
                    <span className="font-semibold tracking-wide uppercase">Govt of NCT Delhi • Municipal Corporation</span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#d7e2ff] text-[#041b3c] text-[12px] font-mono font-semibold">
                    MCD-PORTAL
                  </span>
                </div>

                {/* Identity and Primary Header Block */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-12 h-12 rounded-xl bg-[#0a45a4] flex items-center justify-center text-white shadow-md">
                      <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        assured_workload
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[28px] text-[#0a45a4] tracking-tight font-bold leading-tight">ICMRS</span>
                        <span className="text-[12px] font-mono px-2 py-0.5 rounded bg-[#dae2ff] text-[#001947] font-semibold">
                          CIVIC CORE
                        </span>
                      </div>
                      <p className="text-[12px] text-[#434652] font-medium">Intelligent Civic Management &amp; Response System</p>
                    </div>
                  </div>
                  <h1 className="text-[32px] sm:text-[36px] font-semibold text-[#0b1c30] tracking-tight leading-[40px] sm:leading-[44px] mt-1">
                    Precision Municipal Governance for 30 Million Citizens.
                  </h1>
                  <p className="text-[15px] sm:text-[16px] text-[#4c5e83] leading-[22px] sm:leading-[24px] max-w-2xl">
                    A unified digital nervous system connecting Delhi residents, zonal engineers, and automated field response teams for transparent, zero-latency civic resolution.
                  </p>
                </div>

                {/* SLA Metric Badges: 3 Compact Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e5eeff] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#4c5e83] uppercase tracking-wider font-semibold">SLA Compliance</span>
                      <span className="material-symbols-outlined text-[#00554d] text-[18px]">verified</span>
                    </div>
                    <div className="text-[28px] text-[#0b1c30] font-semibold tabular-nums leading-tight">99.4%</div>
                    <p className="text-[12px] text-[#434652] mt-1">Auto-escalated tickets</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e5eeff] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#4c5e83] uppercase tracking-wider font-semibold">Avg Triage Time</span>
                      <span className="material-symbols-outlined text-[#0a45a4] text-[18px]">speed</span>
                    </div>
                    <div className="text-[28px] text-[#0b1c30] font-semibold tabular-nums leading-tight">14 min</div>
                    <p className="text-[12px] text-[#434652] mt-1">Real-time ward dispatch</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow-xs border border-[#e5eeff] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-[#4c5e83] uppercase tracking-wider font-semibold">Citizens Served</span>
                      <span className="material-symbols-outlined text-[#4c5e83] text-[18px]">groups</span>
                    </div>
                    <div className="text-[28px] text-[#0b1c30] font-semibold tabular-nums leading-tight">3.2M+</div>
                    <p className="text-[12px] text-[#434652] mt-1">Across all 250 wards</p>
                  </div>
                </div>

                {/* Visual Feature Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-[#eff4ff] p-4 rounded-xl flex items-start gap-3 border border-[#dce9ff]">
                    <div className="p-2 rounded-lg bg-[#d3e4fe] text-[#0a45a4] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">explore</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[#0b1c30]">AI Geo-Triage</span>
                        <span className="text-[12px] font-mono px-1.5 py-0.5 rounded bg-[#89f5e7] text-[#00201d] font-bold">Active</span>
                      </div>
                      <p className="text-[12px] text-[#4c5e83] leading-relaxed">Spatial deduplication automatically clusters duplicate ward complaints within a 15-meter radius.</p>
                    </div>
                  </div>
                  <div className="bg-[#eff4ff] p-4 rounded-xl flex items-start gap-3 border border-[#dce9ff]">
                    <div className="p-2 rounded-lg bg-[#d3e4fe] text-[#00554d] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">shield</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[14px] font-semibold text-[#0b1c30]">Certified Security</span>
                        <span className="text-[12px] font-mono px-1.5 py-0.5 rounded bg-[#d7e2ff] text-[#041b3c] font-bold">CERT-In</span>
                      </div>
                      <p className="text-[12px] text-[#4c5e83] leading-relaxed">256-bit cryptographic gateway with NIC integration, audit logging, and Aadhaar OTP verification.</p>
                    </div>
                  </div>
                </div>

                {/* Municipal Architecture SVG Graphic Vignette */}
                <div className="bg-white rounded-xl p-4 shadow-xs relative overflow-hidden border border-[#e5eeff]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] uppercase tracking-wider text-[#4c5e83] font-semibold">Live Civic Grid • Delhi NCT Wards</span>
                    <div className="flex items-center gap-2 text-[12px] font-mono text-[#00554d]">
                      <span className="w-2 h-2 rounded-full bg-[#006f66] animate-pulse"></span> Telemetry Sync: 100%
                    </div>
                  </div>
                  <div className="w-full h-24 relative flex items-end">
                    <svg className="w-full h-full text-[#bfd2fd]" fill="none" preserveAspectRatio="none" viewBox="0 0 600 100" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 100 L0 80 L30 80 L30 65 L45 65 L45 80 L80 80 L80 40 L95 40 L95 25 L105 10 L115 25 L115 40 L130 40 L130 80 L180 80 L180 55 L210 55 L210 80 L250 80 L250 35 L265 35 L280 20 L295 35 L310 35 L310 80 L370 80 L370 60 L400 60 L400 80 L440 80 L440 45 L455 30 L470 45 L470 80 L520 80 L520 65 L550 65 L550 80 L600 80 L600 100 Z" fill="currentColor" fillOpacity="0.4"></path>
                      <path d="M20 100 L20 85 L70 85 L70 50 L120 50 L120 85 L220 85 L220 70 L270 70 L270 85 L350 85 L350 50 L380 50 L380 85 L480 85 L480 60 L510 60 L510 85 L590 85 L590 100 Z" fill="currentColor" fillOpacity="0.7"></path>
                      <line stroke="#315EBD" strokeWidth="2" x1="0" x2="600" y1="99" y2="99"></line>
                      <circle cx="105" cy="10" fill="#0A45A4" r="3"></circle>
                      <circle cx="280" cy="20" fill="#00554D" r="3"></circle>
                      <circle cx="455" cy="30" fill="#0A45A4" r="3"></circle>
                    </svg>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 bg-[#eff4ff] px-3 py-1.5 rounded-lg text-[#4c5e83]">
                    <span className="text-[12px] font-mono">Node: Central-NDMC-01</span>
                    <span className="text-[12px] font-mono">Active Field Teams: 1,842</span>
                    <span className="text-[12px] font-mono text-[#0a45a4] font-semibold">Status: Optimal</span>
                  </div>
                </div>

                {/* Civic Helpline Strip */}
                <div className="bg-[#0a45a4]/5 rounded-xl p-2 flex items-center justify-between gap-2 border border-[#0a45a4]/10">
                  <div className="flex items-center gap-1 text-[#0b1c30]">
                    <span className="material-symbols-outlined text-[#0a45a4] text-[20px]">phone_in_talk</span>
                    <span className="text-[11px] font-semibold">Emergency Civic Grievance? Dial 155304 for Rapid MCD Dispatch</span>
                  </div>
                  <span className="text-[12px] font-mono text-[#0a45a4] font-bold px-2 py-0.5 rounded bg-white shadow-2xs">Toll-Free 24x7</span>
                </div>
              </section>

              {/* ======================================================== */}
              {/* RIGHT SECTION (45% Width on Desktop: 5 of 12 cols)       */}
              {/* ======================================================== */}
              <section className="lg:col-span-5 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-[480px] bg-white rounded-xl shadow-xl p-6 sm:p-8 flex flex-col gap-4 border border-[#e5eeff] transition-all" id="authCard">
                  
                  {/* Segmented Tab Navigation */}
                  <div className="bg-[#eff4ff] p-1 rounded-xl flex items-center gap-1 border border-[#dce9ff]">
                    <button
                      type="button"
                      id="tabSignIn"
                      onClick={() => switchAuthTab('signin')}
                      className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-semibold transition-all text-center cursor-pointer ${
                        activeTab === 'signin'
                          ? 'bg-white text-[#0a45a4] shadow-xs'
                          : 'text-[#4c5e83] hover:text-[#0b1c30]'
                      }`}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      id="tabSignUp"
                      onClick={() => switchAuthTab('signup')}
                      className={`flex-1 py-2 px-3 rounded-lg text-[12px] font-medium transition-all text-center cursor-pointer ${
                        activeTab === 'signup'
                          ? 'bg-white text-[#0a45a4] shadow-xs font-semibold'
                          : 'text-[#4c5e83] hover:text-[#0b1c30]'
                      }`}
                    >
                      Register Citizen
                    </button>
                  </div>

                  {/* Card Header Text */}
                  <div className="flex flex-col gap-1" id="cardHeader">
                    <h2 className="text-[20px] text-[#0b1c30] font-semibold tracking-tight" id="headerTitle">
                      {formState === 'forgot'
                        ? 'Reset Passcode'
                        : activeTab === 'signup'
                        ? 'Register Citizen Account'
                        : 'Sign in to ICMRS'}
                    </h2>
                    <p className="text-[14px] text-[#4c5e83]" id="headerSubtitle">
                      {formState === 'forgot'
                        ? 'Enter your OTP code sent by Delhi Govt NIC Gateway.'
                        : activeTab === 'signup'
                        ? 'Join the unified civic response network across Delhi wards.'
                        : 'Access your civic dashboard & track registered complaints.'}
                    </p>
                  </div>

                  {/* Dynamic Status / Alert Banner */}
                  {customAlert && (
                    <div
                      id="alertBox"
                      role="alert"
                      className={`p-2.5 rounded-lg text-[12px] flex items-start gap-2 animate-in fade-in ${
                        customAlert.type === 'loading'
                          ? 'bg-[#dae2ff] text-[#001947] border border-[#b1c5ff]'
                          : customAlert.type === 'error'
                          ? 'bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30'
                          : customAlert.type === 'success'
                          ? 'bg-[#eff4ff] text-[#00554d] border border-[#89f5e7]'
                          : 'bg-[#d7e2ff] text-[#041b3c] border border-[#b4c7f1]'
                      }`}
                    >
                      <span className={`material-symbols-outlined text-[18px] shrink-0 ${customAlert.type === 'loading' ? 'animate-spin' : ''}`}>
                        {customAlert.type === 'loading' ? 'sync' : customAlert.type === 'error' ? 'error' : customAlert.type === 'success' ? 'check_circle' : 'info'}
                      </span>
                      <div className="flex-1 font-medium">{customAlert.message}</div>
                    </div>
                  )}

                  {/* SSO / National Identity Action Button */}
                  {formState !== 'forgot' && (
                    <div className="flex flex-col gap-1" id="ssoContainer">
                      <button
                        type="button"
                        id="google-signin-btn"
                        onClick={simulateSSO}
                        disabled={isSubmitting}
                        className="w-full h-12 px-4 rounded-xl bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] text-[12px] sm:text-[14px] font-medium flex items-center justify-between transition-colors shadow-xs border border-[#dce9ff] cursor-pointer disabled:opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z" fill="#4285F4"></path>
                            <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.27 21.36 7.35 24 12 24z" fill="#34A853"></path>
                            <path d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z" fill="#FBBC05"></path>
                            <path d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.27 2.64 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z" fill="#EA4335"></path>
                          </svg>
                          <span>Continue with Delhi SSO / Google</span>
                        </div>
                        <span className="material-symbols-outlined text-[18px] text-[#4c5e83]">arrow_forward</span>
                      </button>

                      {/* Divider */}
                      <div className="flex items-center gap-2 my-1">
                        <span className="h-px bg-[#e5eeff] flex-1"></span>
                        <span className="text-[11px] uppercase tracking-wider text-[#737784] font-semibold">or access with credentials</span>
                        <span className="h-px bg-[#e5eeff] flex-1"></span>
                      </div>
                    </div>
                  )}

                  {/* Main Input Form */}
                  <form className="flex flex-col gap-2.5" id="authForm" onSubmit={handleFormSubmit} noValidate>
                    {/* Identity Field */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-semibold text-[#0b1c30]" htmlFor="identityInput">
                          Official ID / Resident Email
                        </label>
                        <span className="text-[12px] font-mono text-[#4c5e83]">e.g. ward.officer@mcd.gov.in</span>
                      </div>
                      <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-[#4c5e83] text-[18px]">badge</span>
                        <input
                          className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#737784] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0a45a4] shadow-xs border border-[#dce9ff] transition-all"
                          id="identityInput"
                          placeholder="name@mcd.gov.in or Mobile Number"
                          required
                          type="text"
                          value={identity}
                          onChange={(e) => setIdentity(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Additional Registration Field (Shown on signup) */}
                    {activeTab === 'signup' && formState !== 'forgot' && (
                      <>
                        <div className="flex flex-col gap-1.5" id="fullNameGroup">
                          <label className="text-[11px] font-semibold text-[#0b1c30]" htmlFor="fullNameInput">
                            Full Name (As per Aadhaar/Voter ID)
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-[#4c5e83] text-[18px]">person</span>
                            <input
                              className="w-full h-11 pl-10 pr-3 rounded-xl bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#737784] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0a45a4] shadow-xs border border-[#dce9ff] transition-all"
                              id="fullNameInput"
                              placeholder="e.g. Rajesh Sharma"
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold text-[#0b1c30]" htmlFor="reg-ward-select">
                            Residential Ward / Sector
                          </label>
                          <div className="relative flex items-center">
                            <span className="material-symbols-outlined absolute left-3 text-[#4c5e83] text-[18px]">location_on</span>
                            <select
                              id="reg-ward-select"
                              value={ward}
                              onChange={(e) => setWard(e.target.value)}
                              className="w-full pl-10 pr-4 h-11 bg-[#eff4ff] border border-[#dce9ff] rounded-xl text-xs sm:text-sm text-[#0b1c30] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0a45a4] transition-all cursor-pointer shadow-xs"
                            >
                              {DELHI_WARDS.map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Passcode Field */}
                    {formState !== 'forgot' && (
                      <div className="flex flex-col gap-1.5" id="passwordGroup">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-[#0b1c30]" htmlFor="passwordInput">
                            Secure Access Passcode
                          </label>
                          <button
                            className="text-[11px] font-semibold text-[#0a45a4] hover:underline cursor-pointer"
                            onClick={() => setSimulatorState('forgot')}
                            type="button"
                          >
                            Forgot passcode?
                          </button>
                        </div>
                        <div className="relative flex items-center">
                          <span className="material-symbols-outlined absolute left-3 text-[#4c5e83] text-[18px]">lock</span>
                          <input
                            className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#eff4ff] text-[#0b1c30] placeholder:text-[#737784] text-[14px] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0a45a4] shadow-xs border border-[#dce9ff] transition-all"
                            id="passwordInput"
                            placeholder="Enter 8+ char encrypted passcode"
                            required
                            type={isPasswordVisible ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                          />
                          <button
                            aria-label="Toggle password visibility"
                            className="absolute right-3 text-[#4c5e83] hover:text-[#0b1c30] flex items-center cursor-pointer"
                            onClick={togglePasswordVisibility}
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[18px]" id="eyeIcon">
                              {isPasswordVisible ? 'visibility_off' : 'visibility'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* OTP Field (For Forgot Password flow) */}
                    {formState === 'forgot' && (
                      <div className="flex flex-col gap-1.5" id="otpGroup">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-[#0b1c30]">6-Digit Municipal OTP</label>
                          <button
                            type="button"
                            onClick={() => setSimulatorState('default')}
                            className="text-[11px] text-[#0a45a4] hover:underline cursor-pointer"
                          >
                            Back to sign in
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          {otp.map((d, idx) => (
                            <input
                              key={idx}
                              className="otp-cell w-11 h-12 text-center text-[16px] font-semibold rounded-lg bg-[#eff4ff] text-[#0b1c30] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0a45a4] shadow-xs border border-[#dce9ff]"
                              maxLength={1}
                              type="text"
                              value={d}
                              onChange={(e) => {
                                const next = [...otp];
                                next[idx] = e.target.value;
                                setOtp(next);
                              }}
                            />
                          ))}
                        </div>
                        <span className="text-[12px] font-mono text-[#4c5e83] text-right mt-1">Resend SMS code in 42s</span>
                      </div>
                    )}

                    {/* Session & Security Row */}
                    {formState !== 'forgot' && (
                      <div className="flex items-center justify-between mt-1" id="sessionRow">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            checked={keepSession}
                            onChange={(e) => setKeepSession(e.target.checked)}
                            className="w-4 h-4 rounded text-[#0a45a4] accent-[#0a45a4] cursor-pointer"
                            type="checkbox"
                          />
                          <span className="text-[14px] text-[#0b1c30]">Keep verified session (24h)</span>
                        </label>
                        <div className="flex items-center gap-1 text-[#00554d] text-[12px] font-mono font-medium">
                          <span className="material-symbols-outlined text-[14px]">lock</span>
                          <span>256-bit TLS</span>
                        </div>
                      </div>
                    )}

                    {/* Primary Submission Button */}
                    <button
                      className="w-full h-11 rounded-xl bg-[#0a45a4] hover:bg-[#315ebd] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-[0.99] mt-2 cursor-pointer disabled:opacity-60"
                      id="submitBtn"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      <span id="btnText">
                        {formState === 'loading'
                          ? 'Verifying Credentials...'
                          : formState === 'forgot'
                          ? 'Verify & Issue Temporary Token'
                          : activeTab === 'signup'
                          ? 'Register Citizen Profile'
                          : 'Sign In to ICMRS'}
                      </span>
                      <span className="material-symbols-outlined text-[18px]" id="btnIcon">
                        {formState === 'loading'
                          ? 'hourglass_top'
                          : formState === 'forgot'
                          ? 'key'
                          : formState === 'success'
                          ? 'done_all'
                          : 'arrow_forward'}
                      </span>
                    </button>
                  </form>

                  {/* Secondary Toggle Footer */}
                  <div className="pt-1 text-center">
                    <p className="text-[12px] text-[#4c5e83]" id="alternatePrompt">
                      {activeTab === 'signup' ? (
                        <>
                          Already registered?{' '}
                          <button
                            className="text-[#0a45a4] font-semibold hover:underline ml-1 cursor-pointer"
                            onClick={() => switchAuthTab('signin')}
                            type="button"
                          >
                            Sign in with ID
                          </button>
                        </>
                      ) : (
                        <>
                          New resident in Delhi NCT?{' '}
                          <button
                            className="text-[#0a45a4] font-semibold hover:underline ml-1 cursor-pointer"
                            onClick={() => switchAuthTab('signup')}
                            type="button"
                          >
                            Create citizen account
                          </button>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Official Security Compliance Watermark */}
                  <div className="bg-[#eff4ff]/60 rounded-lg p-2.5 flex flex-col gap-1 text-center text-[12px] font-mono text-[#434652] border border-[#dce9ff]/60">
                    <div className="flex items-center justify-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00554d]"></span>
                      <span>NIC &amp; CERT-In Compliant • TLS 1.3 Strict</span>
                    </div>
                    <span className="text-[#737784] text-[11px]">Session Node: DL-MCD-2025/NODE-09 • Engine v4.1.8-Gov</span>
                  </div>
                </div>
              </section>

            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full bg-white/60 py-4 border-t border-[#e5eeff]">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[12px] text-[#434652]">
          <span>© 2025 Department of Information &amp; Regulatory Affairs. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <a className="hover:text-[#0a45a4] transition-colors" href="#">Security Policy</a>
            <a className="hover:text-[#0a45a4] transition-colors" href="#">CAC / PIV Help</a>
            <a className="hover:text-[#0a45a4] transition-colors" href="#">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
