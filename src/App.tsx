/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Bell, AlertCircle, Volume2, X } from 'lucide-react';
import { 
  CivicRole, 
  NavTab, 
  CivicComplaint, 
  OfficerNote 
} from './types';
import { 
  INITIAL_COMPLAINTS, 
  INITIAL_ALERTS, 
  EMERGENCY_HOTLINES, 
  FAQ_ITEMS 
} from './data/mockData';
import { AuthProvider, useAuth } from './context/AuthContext';
import { 
  subscribeComplaints, 
  saveComplaint, 
  updateComplaint 
} from './services/complaintService';
import { 
  playNewComplaintChime, 
  playEscalationChime 
} from './utils/soundEffects';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Login';
import { Navbar } from './components/Navbar';
import { CitizenHubView } from './components/CitizenHubView';
import { FileComplaintView } from './components/FileComplaintView';
import { TrackStatusView } from './components/TrackStatusView';
import { OfficerConsoleView } from './components/OfficerConsoleView';
import { AdminAnalyticsView } from './components/AdminAnalyticsView';
import { CivicHeatmapView } from './components/CivicHeatmapView';
import { ResolutionFeedbackView } from './components/ResolutionFeedbackView';
import { QuickReportModal } from './components/QuickReportModal';
import { OfficerNotesModal } from './components/OfficerNotesModal';
import { UploadPhotoModal } from './components/UploadPhotoModal';
import { CivicChatModal } from './components/CivicChatModal';

function getRoleDefaultTab(role: CivicRole): NavTab {
  switch (role) {
    case 'admin':
      return 'admin-analytics';
    case 'officer':
      return 'officer-console';
    case 'citizen':
    default:
      return 'citizen-hub';
  }
}

function tabToRouteHash(tab: NavTab): string {
  switch (tab) {
    case 'admin-analytics':
      return '#admin';
    case 'officer-console':
      return '#officer';
    case 'citizen-hub':
      return '#citizen';
    case 'file-complaint':
      return '#file-complaint';
    case 'track-status':
      return '#track-status';
    case 'civic-heatmap':
      return '#heatmap';
    case 'resolution-and-feedback':
      return '#feedback';
    default:
      return `#${tab}`;
  }
}

function hashToTab(hash: string): NavTab | null {
  const clean = hash.replace(/^#\/?/, '').toLowerCase();
  if (clean === 'admin' || clean === 'admin-analytics') return 'admin-analytics';
  if (clean === 'officer' || clean === 'officer-console') return 'officer-console';
  if (clean === 'citizen' || clean === 'citizen-hub') return 'citizen-hub';
  if (clean === 'file-complaint') return 'file-complaint';
  if (clean === 'track-status') return 'track-status';
  if (clean === 'heatmap' || clean === 'civic-heatmap') return 'civic-heatmap';
  if (clean === 'feedback' || clean === 'resolution-and-feedback') return 'resolution-and-feedback';
  return null;
}

function ICMRSApplication() {
  const { currentUser, userRole, isAuthenticated, loading, logout } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('citizen-hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState<CivicComplaint[]>(INITIAL_COMPLAINTS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [selectedComplaint, setSelectedComplaint] = useState<CivicComplaint>(INITIAL_COMPLAINTS[0]);

  // Modal states
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [isCivicChatOpen, setIsCivicChatOpen] = useState(false);
  const [modalTargetComplaint, setModalTargetComplaint] = useState<CivicComplaint | null>(null);

  // Sync tab with URL Hash & Hash Change listener for URL-based manual route testing
  useEffect(() => {
    const handleHashChange = () => {
      const targetTab = hashToTab(window.location.hash);
      if (targetTab) {
        setCurrentTab(targetTab);
      }
    };

    if (window.location.hash) {
      handleHashChange();
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when tab changes
  const handleTabChange = useCallback((tab: NavTab) => {
    setCurrentTab(tab);
    const newHash = tabToRouteHash(tab);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    }
  }, []);

  // When user signs in, set active tab to their role's authorized default dashboard
  const handleLoginSuccess = useCallback((role: CivicRole) => {
    const defaultTab = getRoleDefaultTab(role);
    handleTabChange(defaultTab);
  }, [handleTabChange]);

  // If user role is initialized on mount, ensure current tab matches role default if still on citizen-hub
  useEffect(() => {
    if (userRole && !window.location.hash) {
      handleTabChange(getRoleDefaultTab(userRole));
    }
  }, [userRole, handleTabChange]);

  // Global Keyboard Shortcut: ⌘+N or Ctrl+N to open report modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsQuickReportOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Live synchronization state
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(new Date());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Real-time local & server subscription for complaints
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeComplaints(
      (freshComplaints) => {
        if (freshComplaints && freshComplaints.length > 0) {
          setComplaints(freshComplaints);
          setLastSyncedAt(new Date());

          // Keep selected complaint updated with live snapshot
          setSelectedComplaint(prev => {
            const live = freshComplaints.find(c => c.id === prev.id);
            return live || freshComplaints[0];
          });
        }
        setIsSyncing(false);
      },
      (error) => {
        console.warn('[Complaints] Realtime subscription notice:', error);
        setIsSyncing(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // On-demand sync trigger
  const handleSyncNow = useCallback(() => {
    setIsSyncing(true);
    fetch('/api/complaints')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json && json.success && Array.isArray(json.data)) {
          setComplaints(json.data);
          setLastSyncedAt(new Date());
        }
      })
      .catch(err => console.warn('[Complaints] Sync error:', err))
      .finally(() => setIsSyncing(false));
  }, []);

  // Filter complaints based on navbar search query
  const searchedComplaints = complaints.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.id.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    );
  });

  // Handlers with persistent local and server sync
  const handleAddNewComplaint = async (newComplaint: CivicComplaint) => {
    // Optimistic UI update
    setComplaints(prev => [newComplaint, ...prev]);
    setSelectedComplaint(newComplaint);

    try {
      await saveComplaint(newComplaint, {
        uid: currentUser?.id || 'citizen-anon',
        email: currentUser?.email || null
      });
    } catch (err) {
      console.error('Failed to persist complaint:', err);
    }
  };

  const handleUpdateComplaint = async (updated: CivicComplaint) => {
    // Optimistic UI update
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedComplaint.id === updated.id) {
      setSelectedComplaint(updated);
    }

    try {
      await updateComplaint(updated.id, updated);
    } catch (err) {
      console.error('Failed to sync complaint update:', err);
    }
  };

  const handleAddOfficerNote = async (complaintId: string, note: OfficerNote) => {
    const target = complaints.find(c => c.id === complaintId);
    const updatedNotes = target ? [...target.officerNotes, note] : [note];

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            officerNotes: updatedNotes
          };
        }
        return c;
      })
    );
    if (selectedComplaint.id === complaintId) {
      setSelectedComplaint(prev => ({
        ...prev,
        officerNotes: updatedNotes
      }));
    }

    try {
      await updateComplaint(complaintId, { officerNotes: updatedNotes });
    } catch (err) {
      console.error('Failed to persist officer note:', err);
    }
  };

  const handleUploadPhotoSuccess = async (complaintId: string, photoUrl: string) => {
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            imageUrl: photoUrl
          };
        }
        return c;
      })
    );
    if (selectedComplaint.id === complaintId) {
      setSelectedComplaint(prev => ({
        ...prev,
        imageUrl: photoUrl
      }));
    }

    try {
      await updateComplaint(complaintId, { imageUrl: photoUrl });
    } catch (err) {
      console.error('Failed to persist photo URL:', err);
    }
  };

  const handleEscalatePriority = async (complaintId: string) => {
    const escalationNote: OfficerNote = {
      id: `n-${Date.now()}`,
      author: currentUser?.name || 'System Dispatch',
      role: currentUser?.role || 'Civic-OS AI',
      time: 'Just now',
      text: 'Priority escalated to Critical via Citizen Portal. Priority dispatch alerted.'
    };

    const target = complaints.find(c => c.id === complaintId);
    const updatedNotes = target ? [...target.officerNotes, escalationNote] : [escalationNote];
    const updates: Partial<CivicComplaint> = {
      priority: 'Critical',
      slaStatus: 'urgent',
      totalSlaHours: 4,
      slaRemaining: '4h 00m SLA remaining (Escalated)',
      officerNotes: updatedNotes
    };

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            ...updates
          };
        }
        return c;
      })
    );
    if (selectedComplaint.id === complaintId) {
      setSelectedComplaint(prev => ({
        ...prev,
        ...updates
      }));
    }

    try {
      await updateComplaint(complaintId, updates);
    } catch (err) {
      console.error('Failed to persist escalation:', err);
    }
  };

  const handleRateIncident = async (complaintId: string, rating: number) => {
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId) {
          return {
            ...c,
            rating: rating
          };
        }
        return c;
      })
    );
    if (selectedComplaint.id === complaintId) {
      setSelectedComplaint(prev => ({
        ...prev,
        rating: rating
      }));
    }

    try {
      await updateComplaint(complaintId, { rating });
    } catch (err) {
      console.error('Failed to persist rating:', err);
    }
  };

  const handleOpenOfficerNotes = (complaint: CivicComplaint) => {
    setModalTargetComplaint(complaint);
    setIsNotesModalOpen(true);
  };

  const handleOpenUploadPhoto = (complaint: CivicComplaint) => {
    setModalTargetComplaint(complaint);
    setIsUploadPhotoModalOpen(true);
  };

  // 1. Loading Splash while verifying initial session
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 font-['Plus_Jakarta_Sans'] font-extrabold text-sm text-gray-800 tracking-wide">
          ICMRS Security Engine Initializing...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated User Gate -> Present Login Screen
  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const effectiveRole = userRole || 'citizen';

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#191c1e] flex flex-col font-['Inter',sans-serif]">
      {/* Primary Top Navigation Bar */}
      <Navbar
        currentRole={effectiveRole}
        setCurrentRole={(role) => {
          // Manual role switch triggers default tab
          handleTabChange(getRoleDefaultTab(role));
        }}
        activeTab={currentTab}
        setActiveTab={handleTabChange}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        complaints={complaints}
        onSelectComplaint={(c) => {
          setSelectedComplaint(c);
          handleTabChange('track-status');
        }}
        unreadAlertCount={alerts.length}
        onOpenQuickReport={() => setIsQuickReportOpen(true)}
      />

      {/* Main Screen Body based on Selected Nav Tab */}
      <main className="flex-1 pt-4 sm:pt-6">
        {/* Polling Telemetry Indicator for Officer & Admin Views */}
        {(currentTab === 'officer-console' || currentTab === 'admin-analytics') && (
          <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 pt-1 pb-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-[12px] shadow-2xs">
              <div className="flex items-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="font-bold text-gray-800">
                  Live Dispatch Sync
                </span>
                <span className="text-gray-300 hidden sm:inline">•</span>
                <span className="text-gray-500 hidden sm:inline">
                  Polling backend every <strong className="text-indigo-600 font-bold">60s</strong> to keep Officer and Admin views synchronized
                </span>
              </div>

              <div className="flex items-center gap-3 text-gray-500 font-mono text-[11px]">
                {lastSyncedAt && (
                  <span>
                    Last synced: <span className="font-bold text-gray-700">{lastSyncedAt.toLocaleTimeString()}</span>
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-sans font-bold text-[11px] transition-all cursor-pointer active:scale-95 disabled:opacity-60"
                  title="Real-time synchronized with municipal dispatch"
                >
                  <RefreshCw className={`w-3 h-3 text-indigo-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Real-time Synced'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 1. CITIZEN HUB: Protected for 'citizen' role */}
        {currentTab === 'citizen-hub' && (
          <ProtectedRoute 
            allowedRoles={['citizen']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <CitizenHubView
              complaints={searchedComplaints}
              alerts={alerts}
              hotlines={EMERGENCY_HOTLINES}
              faqs={FAQ_ITEMS}
              onOpenQuickReport={() => setIsQuickReportOpen(true)}
              onSelectComplaint={(c) => {
                setSelectedComplaint(c);
                handleTabChange('track-status');
              }}
              onOpenOfficerNotes={handleOpenOfficerNotes}
              onOpenUploadPhoto={handleOpenUploadPhoto}
              onOpenCivicChat={() => setIsCivicChatOpen(true)}
              onNavigateToTab={handleTabChange}
              onEscalatePriority={handleEscalatePriority}
              onRateIncident={handleRateIncident}
            />
          </ProtectedRoute>
        )}

        {/* 2. FILE COMPLAINT: Accessible by 'citizen' */}
        {currentTab === 'file-complaint' && (
          <ProtectedRoute 
            allowedRoles={['citizen']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <FileComplaintView
              onSubmitComplaint={handleAddNewComplaint}
              onNavigateToTrack={(complaint) => {
                setSelectedComplaint(complaint);
                handleTabChange('track-status');
              }}
            />
          </ProtectedRoute>
        )}

        {/* 3. TRACK STATUS: Accessible by all roles */}
        {currentTab === 'track-status' && (
          <ProtectedRoute 
            allowedRoles={['citizen', 'officer', 'admin']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <TrackStatusView
              complaints={complaints}
              selectedComplaint={selectedComplaint}
              onSelectComplaint={setSelectedComplaint}
              onOpenOfficerNotes={handleOpenOfficerNotes}
              onOpenUploadPhoto={handleOpenUploadPhoto}
              onEscalatePriority={handleEscalatePriority}
            />
          </ProtectedRoute>
        )}

        {/* 4. OFFICER CONSOLE: Protected for 'officer' and 'admin' roles */}
        {currentTab === 'officer-console' && (
          <ProtectedRoute 
            allowedRoles={['officer', 'admin']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <OfficerConsoleView
              complaints={complaints}
              onUpdateComplaint={handleUpdateComplaint}
              onOpenNotes={handleOpenOfficerNotes}
              onOpenUploadPhoto={handleOpenUploadPhoto}
            />
          </ProtectedRoute>
        )}

        {/* 5. ADMIN ANALYTICS: Strictly Protected for 'admin' role */}
        {currentTab === 'admin-analytics' && (
          <ProtectedRoute 
            allowedRoles={['admin']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <AdminAnalyticsView complaints={complaints} />
          </ProtectedRoute>
        )}

        {/* 6. CIVIC HEATMAP: Accessible by all roles */}
        {currentTab === 'civic-heatmap' && (
          <ProtectedRoute 
            allowedRoles={['citizen', 'officer', 'admin']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <CivicHeatmapView
              complaints={complaints}
              onSelectComplaint={(c) => {
                setSelectedComplaint(c);
              }}
              onNavigateToTrack={(c) => {
                setSelectedComplaint(c);
                handleTabChange('track-status');
              }}
            />
          </ProtectedRoute>
        )}

        {/* 7. RESOLUTION & FEEDBACK: Accessible by 'citizen' */}
        {currentTab === 'resolution-and-feedback' && (
          <ProtectedRoute 
            allowedRoles={['citizen']}
            onRedirectToDashboard={() => handleTabChange(getRoleDefaultTab(effectiveRole))}
          >
            <ResolutionFeedbackView
              complaints={complaints}
              onRateIncident={handleRateIncident}
            />
          </ProtectedRoute>
        )}
      </main>

      {/* Municipal Civic Response System Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200 py-8 px-4 sm:px-8">
        <div className="w-full max-w-[100rem] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-[12px] text-gray-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-[14px] shadow-sm">
              <span className="material-symbols-outlined text-[20px]">account_balance</span>
            </div>
            <div>
              <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[#111827] text-[14px] block">
                ICMRS — Intelligent Civic Response System
              </span>
              <span className="text-gray-400 font-medium">Metro District 04 Department of Public Works & Telemetry</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-bold text-gray-600">
            {effectiveRole === 'citizen' && (
              <>
                <button 
                  onClick={() => handleTabChange('citizen-hub')} 
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Citizen Portal
                </button>
                <button 
                  onClick={() => handleTabChange('file-complaint')} 
                  className="hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  File Hazard
                </button>
              </>
            )}
            {effectiveRole === 'officer' && (
              <button 
                onClick={() => handleTabChange('officer-console')} 
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Officer Console
              </button>
            )}
            {effectiveRole === 'admin' && (
              <button 
                onClick={() => handleTabChange('admin-analytics')} 
                className="hover:text-indigo-600 transition-colors cursor-pointer"
              >
                Admin Analytics
              </button>
            )}
            <button 
              onClick={() => handleTabChange('track-status')} 
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              SLA Tracker
            </button>
            <button 
              onClick={() => handleTabChange('civic-heatmap')} 
              className="hover:text-indigo-600 transition-colors cursor-pointer"
            >
              Geospatial Radar
            </button>
            <button 
              onClick={() => setIsCivicChatOpen(true)} 
              className="hover:text-indigo-600 transition-colors text-indigo-600 font-extrabold cursor-pointer"
            >
              Virtual Assistant
            </button>
          </div>

          <div className="text-right text-gray-400 font-medium">
            <p className="font-mono text-[11px]">Civic-OS v4.2 • Protected under Municipal Code §14</p>
            <p className="text-[11px] mt-0.5">Emergency Hotline: 311-990 • 24/7 Rapid Dispatch</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <QuickReportModal
        isOpen={isQuickReportOpen}
        onClose={() => setIsQuickReportOpen(false)}
        onSubmitReport={handleAddNewComplaint}
      />

      <OfficerNotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setModalTargetComplaint(null);
        }}
        complaint={modalTargetComplaint}
        onAddNote={handleAddOfficerNote}
      />

      <UploadPhotoModal
        isOpen={isUploadPhotoModalOpen}
        onClose={() => {
          setIsUploadPhotoModalOpen(false);
          setModalTargetComplaint(null);
        }}
        complaint={modalTargetComplaint}
        onUploadSuccess={handleUploadPhotoSuccess}
      />

      <CivicChatModal
        isOpen={isCivicChatOpen}
        onClose={() => setIsCivicChatOpen(false)}
        complaints={complaints}
        onSelectComplaint={(c) => {
          setSelectedComplaint(c);
          handleTabChange('track-status');
        }}
        onNavigateToFile={() => handleTabChange('file-complaint')}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ICMRSApplication />
    </AuthProvider>
  );
}
