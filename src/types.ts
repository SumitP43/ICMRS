export type CivicRole = 'citizen' | 'officer' | 'admin';
export type UserRole = CivicRole;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: CivicRole;
  badgeNumber?: string;
  department?: string;
  avatar?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: AuthUser;
  error?: string;
  message?: string;
}

export type NavigationTab = 
  | 'citizen-hub'
  | 'file-complaint'
  | 'track-status'
  | 'officer-console'
  | 'admin-analytics'
  | 'civic-heatmap'
  | 'resolution-and-feedback';
export type NavTab = NavigationTab;

export interface OfficerNote {
  id: string;
  author: string;
  role: string;
  time: string;
  text: string;
}

export interface CivicComplaint {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  nodeCode?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  latitude?: number;
  longitude?: number;
  status: 'In Progress' | 'Assigned & Scheduled' | 'Dispatched' | 'Pending Triage' | 'Resolved' | 'Under Review';
  pipelineStep: number; // 1 to 5
  pipelineStepName: string;
  pipelinePercent: number;
  assignedCrew: string;
  timeLogged: string;
  slaRemaining: string;
  totalSlaHours?: number;
  slaStatus: 'urgent' | 'nominal' | 'warning' | 'resolved';
  imageUrl?: string;
  imageAlt?: string;
  beforeImageUrl?: string;
  afterImageUrl?: string;
  beforeImageAlt?: string;
  afterImageAlt?: string;
  gpsTagged: boolean;
  officerNotes: OfficerNote[];
  inspector?: {
    name: string;
    title: string;
    avatar?: string;
    initials?: string;
  };
  resolvedTime?: string;
  rating?: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  citizenToken: string;
}

export interface CivicAlert {
  id: string;
  title: string;
  time: string;
  description: string;
  icon: string;
  badgeStyle: 'water' | 'cleaning' | 'forestry' | 'general';
}

export interface EmergencyHotline {
  id: string;
  title: string;
  subtitle: string;
  number: string;
  icon: string;
  isUrgent: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
