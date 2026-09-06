import React, { useState } from 'react';
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
  onLogout
}) => {
  const { currentUser, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const filteredSearchResults = searchQuery.trim() === '' 
    ? [] 
    : complaints.filter(c => 
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.citizenToken.toLowerCase().includes(searchQuery.toLowerCase())
      );

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
    badge: currentUser?.badgeNumber || (effectiveRole === 'officer' ? 'OFFICER-042' : effectiveRole === 'admin' ? 'ADM-DIR-001' : 'CT-88942-X'),
    avatar: currentUser?.avatar || (effectiveRole === 'officer' 
      ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
      : effectiveRole === 'admin'
      ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80')
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/80 shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]">
      {/* Top Bar */}
      <div className="h-16 w-full px-4 sm:px-6 max-w-[100rem] mx-auto flex items-center justify-between gap-4">
        {/* Logo & Civic Pulse Badges */}
        <div className="flex items-center gap-4 min-w-max">
          <button 
            onClick={() => setActiveTab('citizen-hub')}
            className="flex items-center gap-3 text-left hover:opacity-95 transition-opacity group"
          >
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm group-hover:bg-indigo-700 transition-colors">
              C
            </div>
            <div className="flex flex-col">
              <span className="font-['Plus_Jakarta_Sans'] font-black text-[18px] text-[#111827] leading-none tracking-tight">
                ICMRS <span className="text-indigo-600 font-bold text-sm">BENTO</span>
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
              placeholder="Search Complaint ID, Geo-tag, or Citizen Token..." 
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
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-max">
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
                  <span className="text-[12px] font-bold text-[#111827]">Metro Dispatch Alerts</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">Live Feed</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors border border-gray-100">
                    <p className="font-semibold text-[#111827]">Ward 4 Water Maintenance</p>
                    <p className="text-[11px] text-gray-500">Scheduled valve upgrade at 9th Ave.</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gray-50 hover:bg-indigo-50/50 transition-colors border border-gray-100">
                    <p className="font-semibold text-[#111827]">Asphalt Crew 09 Deployed</p>
                    <p className="text-[11px] text-gray-500">Remediation started on Oak Ave & 14th St.</p>
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
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 uppercase tracking-wider font-mono">
                      {effectiveRole}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">ID: {userProfile.badge}</span>
                  </div>
                  <p className="text-[13px] font-bold text-gray-900">{userProfile.name}</p>
                  <p className="text-[11px] text-gray-500 truncate">{userProfile.email}</p>
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
          </div>

          {/* Quick Sign Out Action Button */}
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
