import React, { useState, useEffect } from 'react';
import { CivicRole, NavigationTab, CivicComplaint } from '../types';
import { 
  Search, 
  Bell, 
  ShieldCheck, 
  MapPin, 
  Activity, 
  Check, 
  X,
  ChevronDown,
  LogOut,
  User,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { isMuted, toggleMuted, subscribeMuteChange } from '../audio/audioNotificationService';
import { ICMRSLogo } from './ICMRSBranding';

interface NavbarProps {
  currentRole: CivicRole;
  setCurrentRole: (role: CivicRole) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  complaints: CivicComplaint[];
  onSelectComplaint: (complaint: CivicComplaint) => void;
  unreadAlertCount: number;
  onOpenQuickReport: () => void;
  onOpenCivicChat?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  complaints,
  onSelectComplaint,
  unreadAlertCount,
  onOpenQuickReport,
  onOpenCivicChat,
  onLogout
}) => {
  const { currentUser, signInWithGoogle, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [audioMuted, setAudioMuted] = useState<boolean>(isMuted());

  useEffect(() => {
    const unsubscribe = subscribeMuteChange((muted) => {
      setAudioMuted(muted);
    });
    return () => unsubscribe();
  }, []);

  const filteredSearchResults = searchQuery.trim() === '' 
    ? [] 
    : complaints.filter(c => {
        const q = searchQuery.toLowerCase();
        return (
          (c.id || '').toLowerCase().includes(q) ||
          (c.title || '').toLowerCase().includes(q) ||
          (c.location || '').toLowerCase().includes(q) ||
          (c.category || '').toLowerCase().includes(q) ||
          (c.citizenToken || '').toLowerCase().includes(q)
        );
      });

  const allNavItems: { id: NavigationTab; label: string; roles: CivicRole[] }[] = [
    { id: 'citizen-hub', label: 'Citizen Hub', roles: ['citizen'] },
    { id: 'file-complaint', label: 'File Complaint', roles: ['citizen'] },
    { id: 'track-status', label: 'Track Status', roles: ['citizen', 'officer', 'admin'] },
    { id: 'officer-console', label: 'Officer Console', roles: ['officer', 'admin'] },
    { id: 'admin-analytics', label: 'Admin Analytics', roles: ['admin'] },
    { id: 'civic-heatmap', label: 'Civic Heatmap', roles: ['citizen', 'officer', 'admin'] },
    { id: 'resolution-and-feedback', label: 'Resolution & Feedback', roles: ['citizen'] },
  ];

  // Only display tabs permitted for current user's authenticated role
  const effectiveRole = currentUser?.role || currentRole;
  const navItems = allNavItems.filter(item => item.roles.includes(effectiveRole));

  const userProfile = {
    name: currentUser?.name || (effectiveRole === 'officer' ? 'Elena Vance' : effectiveRole === 'admin' ? 'Dir. A. Vance-Miller' : 'Marcus Vance'),
    role: effectiveRole === 'officer' ? 'Ward Officer 04' : effectiveRole === 'admin' ? 'District Commissioner' : 'Registered Citizen',
    email: currentUser?.email || `${effectiveRole}@icmrs.gov`,
    badge: currentUser?.badgeNumber || (effectiveRole === 'officer' ? 'OFFICER-042' : effectiveRole === 'admin' ? 'ADM-DIR-001' : 'Resident'),
    avatar: currentUser?.avatar || (effectiveRole === 'officer' 
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
      : effectiveRole === 'admin'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')
  };

  return (
    <header className="sticky top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {/* Top Bar */}
      <div className="h-16 w-full px-4 sm:px-6 max-w-[100rem] mx-auto flex items-center justify-between gap-4">
        {/* Logo & Civic Pulse Badges */}
        <div className="flex items-center gap-4 min-w-max">
          <button 
            onClick={() => setActiveTab('citizen-hub')}
            className="flex items-center gap-3 text-left hover:opacity-95 transition-opacity group cursor-pointer"
            title="ICMRS — Intelligent Civic Management & Response System"
          >
            <ICMRSLogo 
              variant="emblem" 
              size="md" 
              className="ring-2 ring-indigo-500/25 shadow-sm group-hover:scale-105 transition-transform" 
            />
            <div className="flex flex-col">
              <span className="font-['Plus_Jakarta_Sans'] font-black text-[18px] text-[#111827] leading-none tracking-tight">
                ICMRS
              </span>
              <span className="font-['Inter'] text-[10px] font-bold text-gray-500 leading-none uppercase tracking-widest mt-1">
                Intelligent Civic Response
              </span>
            </div>
          </button>

          {/* District Geofence Badge */}
          <div className="hidden xl:flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-200 text-[#111827]">
            <span className="material-symbols-outlined text-indigo-600 text-[18px]">location_city</span>
            <span className="font-['Inter'] text-[12px] font-semibold">Metro District 04 - Central</span>
          </div>

          {/* Live Response Active Pulsing Pill */}
          <div className="hidden lg:flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
            <span className="font-['Inter'] text-[10px] font-bold text-indigo-700 uppercase tracking-widest">
              Live Civic Response Active
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input 
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all"
              placeholder="Search Complaint ID, location, or issue..." 
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Autocomplete popup dropdown */}
          {showSearchDropdown && filteredSearchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Matching Incident Records ({filteredSearchResults.length})
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 mt-1">
                {filteredSearchResults.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectComplaint(item);
                      setActiveTab('track-status');
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-left p-2.5 hover:bg-indigo-50/60 rounded-xl transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[12px] font-bold text-indigo-600">{item.id}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">{item.category}</span>
                      </div>
                      <p className="text-[13px] text-[#111827] font-semibold truncate max-w-[280px]">{item.title}</p>
                      <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-indigo-600" /> {item.location}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-indigo-600">Track →</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Role Identity & Profile Controls */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-max">
          {/* Fast Quick Report trigger on top bar */}
          {(effectiveRole === 'citizen' || effectiveRole === 'admin') && (
            <button
              id="topbar-quick-report-btn"
              onClick={onOpenQuickReport}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-[12px] font-bold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Report</span>
            </button>
          )}

          {/* Admin & Officer Audio Notification Status Widget */}
          {(effectiveRole === 'admin' || effectiveRole === 'officer') && (
            <button
              id="topbar-audio-status-widget-btn"
              type="button"
              onClick={() => {
                const next = toggleMuted();
                setAudioMuted(next);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                audioMuted
                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
              }`}
              title={audioMuted ? "Admin audio alerts are muted. Click to enable." : "Admin audio alerts are active. Click to mute."}
              aria-label={audioMuted ? "Audio Muted" : "Audio On"}
            >
              <span className="text-[13px]">{audioMuted ? '🔇' : '🔊'}</span>
              <span className="font-mono tracking-tight">{audioMuted ? 'Audio Muted' : 'Audio On'}</span>
            </button>
          )}

          {/* Role Clearance Pill */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200">
            {effectiveRole === 'admin' ? (
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
            ) : effectiveRole === 'officer' ? (
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            ) : (
              <User className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span className="text-[11px] font-black uppercase tracking-wider text-gray-800 font-mono">
              {effectiveRole}
            </span>
          </div>

          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-500 hover:text-[#111827] transition-colors rounded-xl hover:bg-gray-100 cursor-pointer"
              title="Civic Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              {unreadAlertCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-2 ring-white"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-3.5 z-50 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <ICMRSLogo variant="mark" size="xs" />
                    <span className="text-[12px] font-bold text-[#111827]">Delhi Dispatch Alerts</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">Live Feed</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors border border-gray-100">
                    <p className="font-semibold text-[#111827]">South Delhi Water Supply Maintenance</p>
                    <p className="text-[11px] text-gray-500">DJB scheduled valve upgrade on Sonia Vihar line.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors border border-gray-100">
                    <p className="font-semibold text-[#111827]">NDMC Patch Unit Deployed</p>
                    <p className="text-[11px] text-gray-500">Remediation started on CP Outer Circle & Barakhamba Rd.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="w-full mt-2 text-center text-[11px] text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  Close Notifications
                </button>
              </div>
            )}
          </div>

          {/* User Profile & Account Menu */}
          <div className="relative pl-1 border-l border-gray-200">
            {currentUser ? (
              <>
                <button
                  id="user-profile-menu-trigger-btn"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-xl hover:bg-gray-100 transition-all cursor-pointer text-left"
                  title="Account Options & Sign Out"
                >
                  <img 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-100" 
                    src={userProfile.avatar}
                  />
                  <div className="hidden lg:flex flex-col text-right">
                    <span className="text-[12px] text-[#111827] font-semibold leading-tight">{userProfile.name}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{userProfile.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 hidden sm:inline" />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in">
                    <div className="p-3 bg-gray-50 rounded-xl mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider font-mono">
                          {effectiveRole}
                        </span>
                        {effectiveRole === 'citizen' ? (
                          <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            Verified Resident
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 font-mono">ID: {userProfile.badge}</span>
                        )}
                      </div>
                      <p className="text-[13px] font-bold text-gray-900">{userProfile.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{userProfile.email}</p>
                      <div className="mt-2 pt-2 border-t border-gray-200/80 flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span>Firebase Auth Verified</span>
                        </span>
                        <span className="font-mono text-gray-400 text-[9px]">Firestore Sync</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        id="profile-signout-btn"
                        onClick={async () => {
                          setShowProfileMenu(false);
                          if (onLogout) onLogout();
                          await logout();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out of ICMRS</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <button
                id="navbar-signin-google-btn"
                disabled={googleLoading}
                onClick={async () => {
                  setGoogleLoading(true);
                  try {
                    await signInWithGoogle();
                  } catch (err) {
                    console.error('Navbar Google sign-in failed:', err);
                  } finally {
                    setGoogleLoading(false);
                  }
                }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-bold shadow-2xs transition-all cursor-pointer"
              >
                {googleLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
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
                )}
                <span>Sign in with Google</span>
              </button>
            )}
          </div>

          {/* Quick Sign Out Action Button (only if authenticated) */}
          {currentUser && (
            <button
              id="quick-signout-btn"
              onClick={async () => {
                if (onLogout) onLogout();
                await logout();
              }}
              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Bar */}
      <div className="w-full bg-white border-t border-gray-100">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none">
          <nav className="flex items-center gap-6 h-12">
            {navItems.map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`h-full flex items-center px-1 transition-all whitespace-nowrap text-[13px] font-bold ${
                    isActive 
                      ? 'text-indigo-600 border-b-2 border-indigo-600' 
                      : 'text-gray-500 hover:text-[#111827] border-b-2 border-transparent font-medium'
                  }`}
                >
                  {item.label}
                  {item.id === 'officer-console' && currentRole === 'officer' && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold">
                      2
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
