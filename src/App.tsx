/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Bell, AlertCircle, Volume2, X, Copy, Check, Printer } from 'lucide-react';
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
  playCriticalEscalationChime 
} from './audio/audioNotificationService';
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
import { PrintableComplaintSummary } from './components/PrintableComplaintSummary';
import { ICMRSLogo } from './components/ICMRSBranding';

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
  const { currentUser, userRole, isAuthenticated, loading, logout, isOfficer, isAdmin } = useAuth();

  const [currentTab, setCurrentTab] = useState<NavTab>('citizen-hub');
  const [searchQuery, setSearchQuery] = useState('');
  const [complaints, setComplaints] = useState<CivicComplaint[]>(INITIAL_COMPLAINTS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);
  const [selectedComplaint, setSelectedComplaint] = useState<CivicComplaint>(INITIAL_COMPLAINTS[0]);

  // Admin Portal & Officer Audio & Visual Incident Notification Toast state
  interface AdminIncidentToast {
    id: string;
    type: 'new' | 'escalation';
    complaintId: string;
    complaintTitle: string;
    priority?: string;
    timestamp: number;
  }
  const [incidentToast, setIncidentToast] = useState<AdminIncidentToast | null>(null);
  const [isToastIdCopied, setIsToastIdCopied] = useState(false);
  const [complaintToPrint, setComplaintToPrint] = useState<CivicComplaint | null>(null);
  const initialSnapshotLoadedRef = useRef(false);
  const knownComplaintIdsRef = useRef<Set<string>>(new Set(INITIAL_COMPLAINTS.map(c => c.id)));
  const knownComplaintPrioritiesRef = useRef<Map<string, string>>(new Map(INITIAL_COMPLAINTS.map(c => [c.id, c.priority])));

  // Auto-dismiss incident toast after 5 seconds
  useEffect(() => {
    if (!incidentToast) {
      setIsToastIdCopied(false);
      return;
    }
    const timer = setTimeout(() => {
      setIncidentToast(null);
      setIsToastIdCopied(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [incidentToast]);

  const handleCopyToastComplaintId = async (id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(id);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      setIsToastIdCopied(true);
      setTimeout(() => setIsToastIdCopied(false), 2000);
    } catch {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = id;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setIsToastIdCopied(true);
        setTimeout(() => setIsToastIdCopied(false), 2000);
      } catch (err) {
        console.warn('Failed to copy ID:', err);
      }
    }
  };

  const handlePrintComplaintSummary = (complaintId: string) => {
    const target = complaints.find(c => c.id === complaintId) || {
      id: complaintId,
      title: incidentToast?.complaintTitle || 'Civic Incident Complaint',
      description: 'Complaint details retrieved from incident notification.',
      category: 'Civic Infrastructure',
      location: 'Municipal Jurisdiction',
      status: 'Pending Triage',
      priority: (incidentToast?.priority as any) || (incidentToast?.type === 'escalation' ? 'Critical' : 'High'),
      pipelineStep: 1,
      pipelineStepName: 'Initial Dispatch',
      pipelinePercent: 20,
      assignedCrew: 'Standby Emergency Works',
      timeLogged: 'Just now',
      slaRemaining: incidentToast?.type === 'escalation' ? '4h 00m remaining' : '24h 00m remaining',
      slaStatus: incidentToast?.type === 'escalation' ? 'urgent' : 'warning',
      gpsTagged: true,
      coordinates: { lat: 28.6139, lng: 77.2090 },
      citizenToken: `TOK-${Date.now().toString(36).toUpperCase()}`,
      officerNotes: []
    } as CivicComplaint;

    setComplaintToPrint(target);

    // Give React a tick to mount the printable container, then invoke native window.print()
    setTimeout(() => {
      try {
        window.print();
      } catch (err) {
        console.warn('window.print() invocation error:', err);
      }
    }, 150);
  };

  // Modal states
  const [isQuickReportOpen, setIsQuickReportOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [isUploadPhotoModalOpen, setIsUploadPhotoModalOpen] = useState(false);
  const [isCivicChatOpen, setIsCivicChatOpen] = useState(false);
  const [civicChatInitialQuery, setCivicChatInitialQuery] = useState('');
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

  // Audio & Toast notification clearance check
  const shouldNotify = Boolean(
    isAdmin ||
    isOfficer ||
    userRole === 'admin' ||
    userRole === 'officer' ||
    currentTab === 'admin-analytics' ||
    currentTab === 'officer-console'
  );

  // Real-time local & server subscription for complaints
  useEffect(() => {
    setIsSyncing(true);
    const unsubscribe = subscribeComplaints(
      (freshComplaints) => {
        if (freshComplaints && freshComplaints.length > 0) {
          // If this is after initial snapshot load, inspect for new or escalated incidents
          if (initialSnapshotLoadedRef.current) {
            // 1. Detect newly filed complaints
            const newlyArrived = freshComplaints.filter(c => !knownComplaintIdsRef.current.has(c.id));
            if (newlyArrived.length > 0 && shouldNotify) {
              playNewComplaintChime();
              const latest = newlyArrived[0];
              setIncidentToast({
                id: `toast-${Date.now()}`,
                type: 'new',
                complaintId: latest.id,
                complaintTitle: latest.title,
                priority: latest.priority,
                timestamp: Date.now()
              });
            }

            // 2. Detect priority escalations on existing complaints:
            // Must ONLY trigger when an existing complaint transitions to CRITICAL.
            // LOW -> CRITICAL, MEDIUM -> CRITICAL, HIGH -> CRITICAL.
            // (CRITICAL -> CRITICAL: DO NOT play again. LOW -> MEDIUM: do not play.)
            const newlyEscalated = freshComplaints.find(c => {
              const oldPriority = knownComplaintPrioritiesRef.current.get(c.id);
              return oldPriority && oldPriority !== 'Critical' && c.priority === 'Critical';
            });
            if (newlyEscalated && shouldNotify) {
              playCriticalEscalationChime();
              setIncidentToast({
                id: `toast-${Date.now()}`,
                type: 'escalation',
                complaintId: newlyEscalated.id,
                complaintTitle: newlyEscalated.title,
                priority: 'CRITICAL',
                timestamp: Date.now()
              });
            }
          }

          // Update tracking refs
          freshComplaints.forEach(c => {
            knownComplaintIdsRef.current.add(c.id);
            knownComplaintPrioritiesRef.current.set(c.id, c.priority);
          });
          initialSnapshotLoadedRef.current = true;

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
  }, [shouldNotify]);

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
      (c.id || '').toLowerCase().includes(q) ||
      (c.title || '').toLowerCase().includes(q) ||
      (c.location || '').toLowerCase().includes(q) ||
      (c.category || '').toLowerCase().includes(q) ||
      (c.description || '').toLowerCase().includes(q)
    );
  });

  // Handlers with persistent local and server sync
  const handleAddNewComplaint = async (newComplaint: CivicComplaint) => {
    // Optimistic UI update
    setComplaints(prev => [newComplaint, ...prev]);
    setSelectedComplaint(newComplaint);

    // Play subtle chime on new complaint creation
    if (shouldNotify) {
      playNewComplaintChime();
      setIncidentToast({
        id: `toast-${Date.now()}`,
        type: 'new',
        complaintId: newComplaint.id,
        complaintTitle: newComplaint.title,
        priority: newComplaint.priority,
        timestamp: Date.now()
      });
    }
    knownComplaintIdsRef.current.add(newComplaint.id);
    knownComplaintPrioritiesRef.current.set(newComplaint.id, newComplaint.priority);

    try {
      const saved = await saveComplaint(newComplaint, {
        uid: currentUser?.id || newComplaint.userId || 'citizen-anon',
        email: currentUser?.email || newComplaint.citizenEmail || null,
        name: currentUser?.name || newComplaint.citizenName || null
      });
      if (saved) {
        setComplaints(prev => [saved, ...prev.filter(c => c.id !== saved.id && c.id !== newComplaint.id)]);
        setSelectedComplaint(saved);
      }
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
    const target = complaints.find(c => c.id === complaintId);
    const prevPriority = knownComplaintPrioritiesRef.current.get(complaintId);

    // Escalation chime triggers ONLY when transitioning from non-critical to Critical
    if (prevPriority !== 'Critical') {
      if (shouldNotify) {
        playCriticalEscalationChime();
        setIncidentToast({
          id: `toast-${Date.now()}`,
          type: 'escalation',
          complaintId: complaintId,
          complaintTitle: target?.title || 'Civic Infrastructure Incident',
          priority: 'CRITICAL',
          timestamp: Date.now()
        });
      }
    }
    knownComplaintPrioritiesRef.current.set(complaintId, 'Critical');

    const escalationNote: OfficerNote = {
      id: `n-${Date.now()}`,
      author: currentUser?.name || 'System Dispatch',
      role: currentUser?.role || 'Civic-OS AI',
      time: 'Just now',
      text: 'Priority escalated to Critical via Citizen Portal. Priority dispatch alerted.'
    };

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
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="absolute -inset-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-lg opacity-25 animate-pulse"></div>
          <ICMRSLogo variant="emblem" size="xl" className="relative shadow-2xl ring-4 ring-white" />
          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <h2 className="font-['Plus_Jakarta_Sans'] font-black text-xl text-gray-900 tracking-tight">
          ICMRS
        </h2>
        <p className="text-[12px] font-bold text-indigo-600 uppercase tracking-widest mt-1">
          Intelligent Civic Management &amp; Response System
        </p>
        <p className="mt-3 text-xs text-gray-500 font-mono flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
          <span>Security &amp; Telemetry Engine Initializing...</span>
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
    <>
      <div className="min-h-screen bg-[#f8fafc] text-[#191c1e] flex flex-col font-['Inter',sans-serif] no-print">
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
        onOpenCivicChat={() => {
          setCivicChatInitialQuery('');
          setIsCivicChatOpen(true);
        }}
      />

      {/* Main Screen Body based on Selected Nav Tab */}
      <main className="flex-1 pt-4 sm:pt-6">
        {/* Live Dispatch Telemetry Indicator for Officer Console */}
        {currentTab === 'officer-console' && (
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
                  Real-time municipal dispatch stream active
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
              onOpenCivicChat={(query?: string) => {
                setCivicChatInitialQuery(query || '');
                setIsCivicChatOpen(true);
              }}
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
            <ICMRSLogo variant="emblem" size="md" className="ring-2 ring-indigo-500/20 shadow-sm" />
            <div>
              <span className="font-['Plus_Jakarta_Sans'] font-extrabold text-[#111827] text-[14px] block">
                ICMRS — Intelligent Civic Management &amp; Response System
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
        onClose={() => {
          setIsCivicChatOpen(false);
          setCivicChatInitialQuery('');
        }}
        complaints={complaints}
        onSelectComplaint={(c) => {
          setSelectedComplaint(c);
          handleTabChange('track-status');
        }}
        onNavigateToFile={() => handleTabChange('file-complaint')}
        user={currentUser}
        initialProblemQuery={civicChatInitialQuery}
      />

      {/* Admin Portal Incident Notification Floating Toast */}
      {incidentToast && shouldNotify && (
        <aside 
          id="admin-incident-floating-toast"
          role="status"
          aria-live="polite"
          aria-label={incidentToast.type === 'escalation' ? 'Critical Escalation Alert' : 'New Complaint Alert'}
          className={`fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-3rem)] sm:w-96 bg-white rounded-2xl border shadow-2xl p-4.5 transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            incidentToast.type === 'escalation'
              ? 'border-red-300 shadow-red-500/10'
              : 'border-indigo-200 shadow-indigo-500/10'
          }`}
        >
          {/* Header row with Icon, Label, and Dismiss Button */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ICMRSLogo variant="mark" size="xs" />
              <span className={`text-[13px] font-black tracking-tight ${
                incidentToast.type === 'escalation' ? 'text-red-700' : 'text-indigo-700'
              }`}>
                {incidentToast.type === 'escalation' ? 'Critical Escalation' : 'New Complaint'}
              </span>
            </div>

            <button
              type="button"
              id="dismiss-admin-incident-toast-btn"
              onClick={() => setIncidentToast(null)}
              className="text-gray-400 hover:text-gray-700 cursor-pointer p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Dismiss alert"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Incident Details Card Content */}
          <div className="pt-2.5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[12px] font-extrabold text-[#111827] tracking-wide">
                {incidentToast.complaintId}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="print-toast-complaint-btn"
                  onClick={() => handlePrintComplaintSummary(incidentToast.complaintId)}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border bg-gray-50 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200"
                  title="Print Complaint Summary"
                  aria-label="Print Complaint Summary"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  id="copy-toast-complaint-id-btn"
                  onClick={() => handleCopyToastComplaintId(incidentToast.complaintId)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer border ${
                    isToastIdCopied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-gray-50 text-gray-700 hover:text-indigo-600 hover:bg-indigo-50 border-gray-200'
                  }`}
                  title="Copy Complaint ID"
                  aria-label="Copy Complaint ID"
                >
                  {isToastIdCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy ID</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <p className="text-[13px] text-gray-800 font-semibold leading-snug line-clamp-2">
              {incidentToast.complaintTitle}
            </p>

            {incidentToast.type === 'escalation' && (
              <div className="pt-0.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200 text-[11px] font-black uppercase font-mono tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  Priority: CRITICAL
                </span>
              </div>
            )}
          </div>

          {/* Inspect Complaint Action Button */}
          <div className="mt-3.5 pt-2.5 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              id="inspect-toast-complaint-btn"
              onClick={() => {
                const target = complaints.find(c => c.id === incidentToast.complaintId);
                if (target) {
                  setSelectedComplaint(target);
                  handleTabChange('track-status');
                }
                setIncidentToast(null);
              }}
              className={`px-4 py-2 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer text-white ${
                incidentToast.type === 'escalation'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <span>Inspect Complaint →</span>
            </button>

            <span className="text-[10px] text-gray-400 font-mono">
              Auto-dismiss 5s
            </span>
          </div>
        </aside>
      )}
      </div>

      {/* Printer-friendly simplified summary view */}
      <PrintableComplaintSummary complaint={complaintToPrint} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ICMRSApplication />
    </AuthProvider>
  );
}
