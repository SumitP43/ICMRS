/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicComplaint } from '../types';
import { INITIAL_COMPLAINTS } from '../data/mockData';
import { supabase } from '../lib/supabase';

const LOCAL_STORAGE_KEY = 'icmrs_civic_complaints';

// In-memory cache & event listeners for immediate reactivity
let cachedComplaints: CivicComplaint[] = [];
const subscribers = new Set<(complaints: CivicComplaint[]) => void>();

export function sanitizeComplaint(raw: any): CivicComplaint {
  if (!raw) return raw;
  const priority = raw.priority || 'Medium';
  const defaultSlaRemaining = priority === 'Critical' ? '4h 00m SLA urgent' : '24h 00m SLA nominal';
  return {
    ...raw,
    id: raw.id || raw.complaintNumber || `#ICMRS-${Date.now()}`,
    complaintNumber: raw.complaintNumber || raw.id || `#ICMRS-${Date.now()}`,
    title: raw.title || 'Civic Incident',
    category: raw.category || 'Roads & Bridges',
    status: raw.status || 'In Progress',
    priority: priority,
    location: raw.location || 'Delhi NCT',
    slaRemaining: raw.slaRemaining || defaultSlaRemaining,
    slaStatus: raw.slaStatus || (priority === 'Critical' ? 'urgent' : 'nominal'),
    totalSlaHours: raw.totalSlaHours || (priority === 'Critical' ? 24 : 48),
    pipelineStep: raw.pipelineStep || 1,
    pipelineStepName: raw.pipelineStepName || 'Step 1 of 5: Telemetry Received & Dispatched',
    pipelinePercent: raw.pipelinePercent || 20,
    coordinates: raw.coordinates || { lat: 28.6139, lng: 77.2090 },
    citizenToken: raw.citizenToken || 'Verified Resident',
    timeLogged: raw.timeLogged || 'Just now',
    assignedCrew: raw.assignedCrew || 'Municipal Quick Response Team',
    officerNotes: Array.isArray(raw.officerNotes) ? raw.officerNotes : [],
    statusHistory: Array.isArray(raw.statusHistory) ? raw.statusHistory : [],
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
  };
}

/**
 * Maps Supabase PostgreSQL snake_case columns to CivicComplaint domain object
 */
export function mapRowToComplaint(row: any): CivicComplaint {
  if (!row) return row;
  const lat = typeof row.latitude === 'number' ? row.latitude : (row.coordinates?.lat ?? 28.6139);
  const lng = typeof row.longitude === 'number' ? row.longitude : (row.coordinates?.lng ?? 77.2090);

  return sanitizeComplaint({
    id: row.id,
    complaintNumber: row.complaint_number || row.id,
    userId: row.user_id,
    citizenName: row.citizen_name,
    citizenEmail: row.citizen_email,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    priority: row.priority,
    location: row.location,
    latitude: lat,
    longitude: lng,
    coordinates: row.coordinates || { lat, lng },
    dateTime: row.date_time,
    department: row.department,
    assignedOfficer: row.assigned_officer,
    assignedCrew: row.assigned_crew,
    pipelineStep: row.pipeline_step,
    pipelineStepName: row.pipeline_step_name,
    pipelinePercent: row.pipeline_percent,
    slaRemaining: row.sla_remaining,
    slaStatus: row.sla_status,
    totalSlaHours: row.total_sla_hours,
    resolutionDetails: row.resolution_details,
    imageUrl: row.image_url,
    beforeImageUrl: row.before_image_url,
    afterImageUrl: row.after_image_url,
    attachments: row.attachments || [],
    statusHistory: row.status_history || [],
    officerNotes: row.officer_notes || [],
    rating: row.rating,
    citizenToken: row.citizen_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
}

function notifySubscribers() {
  const data = cachedComplaints.map(sanitizeComplaint);
  subscribers.forEach((callback) => {
    try {
      callback(data);
    } catch (err) {
      console.error('[ComplaintService] Callback error:', err);
    }
  });
}

function loadLocalData(): CivicComplaint[] {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(sanitizeComplaint);
      }
    }
  } catch (e) {
    console.warn('[ComplaintService] Local storage load notice:', e);
  }
  return INITIAL_COMPLAINTS.map(sanitizeComplaint);
}

cachedComplaints = loadLocalData();

/**
 * Real-time subscription to complaints via Supabase Realtime Channel & local cache
 */
export function subscribeComplaints(
  onData: (complaints: CivicComplaint[]) => void,
  onError?: (err: unknown) => void
): () => void {
  subscribers.add(onData);

  // Immediately feed cached records for instant UI render
  onData([...cachedComplaints]);

  // Initial fetch from Supabase Database
  const fetchFresh = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        cachedComplaints = data.map(mapRowToComplaint);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
        } catch {
          // Ignored
        }
        notifySubscribers();
        return;
      }

      // If Supabase table is empty or permission denied (anon), query public heatmap feed or backend
      const res = await fetch('/api/complaints');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          cachedComplaints = json.data.map(sanitizeComplaint);
          notifySubscribers();
        }
      }
    } catch (err) {
      if (onError) onError(err);
    }
  };

  fetchFresh();

  // Attach Supabase Realtime listener on 'complaints' table
  const realtimeChannel = supabase
    .channel('public:complaints')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'complaints' },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          const newComplaint = mapRowToComplaint(payload.new);
          cachedComplaints = [newComplaint, ...cachedComplaints.filter(c => c.id !== newComplaint.id)];
          notifySubscribers();
        } else if (payload.eventType === 'UPDATE') {
          const updatedComplaint = mapRowToComplaint(payload.new);
          cachedComplaints = cachedComplaints.map(c => c.id === updatedComplaint.id ? updatedComplaint : c);
          notifySubscribers();
        } else if (payload.eventType === 'DELETE') {
          cachedComplaints = cachedComplaints.filter(c => c.id !== payload.old.id);
          notifySubscribers();
        }
      }
    )
    .subscribe();

  // Periodic poll as background fallback
  const pollInterval = setInterval(fetchFresh, 15000);

  const handleFocus = () => {
    fetchFresh();
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', handleFocus);
  }

  return () => {
    subscribers.delete(onData);
    clearInterval(pollInterval);
    supabase.removeChannel(realtimeChannel);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', handleFocus);
    }
  };
}

/**
 * Fetch all complaints from Supabase database with fallback to backend API
 */
export async function getComplaints(): Promise<CivicComplaint[]> {
  try {
    const { data, error } = await supabase
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      cachedComplaints = data.map(mapRowToComplaint);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
      } catch {
        // Ignored
      }
      notifySubscribers();
      return cachedComplaints;
    }

    // Fallback to Express backend
    const res = await fetch('/api/complaints');
    if (res.ok) {
      const resp = await res.json();
      if (resp.success && Array.isArray(resp.data) && resp.data.length > 0) {
        cachedComplaints = resp.data.map(sanitizeComplaint);
        return cachedComplaints;
      }
    }
  } catch (err) {
    console.warn('[ComplaintService] Query notice:', err);
  }

  return [...cachedComplaints];
}

/**
 * Fetch public redacted heatmap telemetry from the secure civic_heatmap_feed view.
 * Zero PII exposed (no citizen names, no emails, no officer notes, no attachments).
 */
export async function getPublicHeatmapFeed(): Promise<Partial<CivicComplaint>[]> {
  try {
    const { data, error } = await supabase
      .from('civic_heatmap_feed')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        complaintNumber: row.complaint_number,
        category: row.category,
        status: row.status,
        priority: row.priority,
        coordinates: {
          lat: Number(row.latitude) || 28.6139,
          lng: Number(row.longitude) || 77.2090,
        },
        latitude: Number(row.latitude) || 28.6139,
        longitude: Number(row.longitude) || 77.2090,
        department: row.department,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    }
  } catch (err) {
    console.warn('[ComplaintService] Heatmap feed query notice:', err);
  }
  return [];
}


/**
 * Save a new complaint permanently to Supabase Database
 */
export async function saveComplaint(
  complaint: CivicComplaint,
  user?: { uid: string; email?: string | null; name?: string | null }
): Promise<CivicComplaint> {
  const now = new Date().toISOString();
  const citizenName = complaint.citizenName || user?.name || (user?.email ? user.email.split('@')[0] : 'Marcus Vance');
  const citizenEmail = complaint.citizenEmail || user?.email || complaint.userEmail || 'citizen@icmrs.gov';
  const complaintNumber = complaint.complaintNumber || complaint.id;

  const newRecord: CivicComplaint = {
    ...complaint,
    id: complaintNumber,
    complaintNumber: complaintNumber,
    citizenName,
    citizenEmail,
    dateTime: complaint.dateTime || now,
    department: complaint.department || 'District 04 Municipal Response Bureau',
    assignedOfficer: complaint.assignedOfficer || 'Elena Vance',
    resolutionDetails: complaint.resolutionDetails || '',
    attachments: complaint.attachments || (complaint.imageUrl ? [{
      id: `att-${Date.now()}`,
      name: 'Photographic Evidence',
      url: complaint.imageUrl,
      type: 'image/jpeg',
      uploadedAt: now
    }] : []),
    statusHistory: complaint.statusHistory || [{
      status: complaint.status || 'In Progress',
      timestamp: now,
      updatedBy: citizenName,
      role: 'citizen',
      notes: 'Complaint registered and logged into database'
    }],
    userId: user?.uid || complaint.userId || citizenEmail,
    userEmail: citizenEmail,
    createdAt: complaint.createdAt || now,
    updatedAt: now,
  };

  // 1. Verify active Supabase session before attempting database insert
  const session = (await supabase.auth.getSession()).data.session;
  if (!session?.user) {
    console.error('[ComplaintService] STOP: NO ACTIVE SUPABASE SESSION. complaints_insert_policy requires an authenticated Supabase user.');
    throw new Error('NO ACTIVE SUPABASE SESSION: You must be logged into an authenticated Supabase account to submit a complaint.');
  }

  const row = {
    id: newRecord.id,
    complaint_number: newRecord.complaintNumber || newRecord.id,
    user_id: session.user.id,
    citizen_name: citizenName,
    citizen_email: citizenEmail,
    title: newRecord.title,
    description: newRecord.description,
    category: newRecord.category,
    status: newRecord.status || 'In Progress',
    priority: newRecord.priority || 'Medium',
    location: newRecord.location,
    latitude: Number(newRecord.coordinates?.lat) || 28.6139,
    longitude: Number(newRecord.coordinates?.lng) || 77.2090,
    coordinates: newRecord.coordinates || { lat: 28.6139, lng: 77.2090 },
    date_time: newRecord.dateTime || now,
    department: newRecord.department,
    assigned_officer: newRecord.assignedOfficer || 'Elena Vance',
    assigned_crew: newRecord.assignedCrew || 'Rapid Patch Unit',
    pipeline_step: newRecord.pipelineStep || 1,
    pipeline_step_name: newRecord.pipelineStepName || 'Step 1 of 5: Telemetry Received & Dispatched',
    pipeline_percent: newRecord.pipelinePercent || 20,
    sla_remaining: newRecord.slaRemaining || '24h 00m SLA remaining',
    sla_status: newRecord.slaStatus || 'nominal',
    total_sla_hours: newRecord.totalSlaHours || 24,
    resolution_details: newRecord.resolutionDetails || '',
    image_url: newRecord.imageUrl || null,
    before_image_url: newRecord.beforeImageUrl || null,
    after_image_url: newRecord.afterImageUrl || null,
    attachments: newRecord.attachments || [],
    status_history: newRecord.statusHistory || [],
    officer_notes: newRecord.officerNotes || [],
    citizen_token: newRecord.citizenToken || 'Verified Resident',
  };

  const { error: sbError } = await supabase.from('complaints').insert(row);
  if (sbError) {
    console.error('[ComplaintService] Supabase insert failed:', {
      code: sbError.code,
      message: sbError.message,
      details: sbError.details,
      hint: sbError.hint,
      hasSession: true,
      sessionUid: session.user.id,
      rowUserId: row.user_id,
    });
    throw new Error(`Database Error (${sbError.code || 'RLS'}): ${sbError.message}`);
  }

  console.log('[ComplaintService] Complaint successfully stored in Supabase database:', newRecord.id);

  // 2. Only after Supabase insert succeeds, update client cache
  cachedComplaints = [newRecord, ...cachedComplaints.filter((c) => c.id !== newRecord.id)];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
  } catch (err) {
    console.warn('[ComplaintService] LocalStorage save notice:', err);
  }
  notifySubscribers();

  return newRecord;
}

/**
 * Update an existing complaint in Supabase database
 */
export async function updateComplaint(
  complaintId: string,
  updates: Partial<CivicComplaint>
): Promise<CivicComplaint | null> {
  const now = new Date().toISOString();
  const index = cachedComplaints.findIndex((c) => c.id === complaintId);

  const existing = index !== -1 ? cachedComplaints[index] : null;
  const updatedRecord: CivicComplaint = {
    ...(existing || ({} as CivicComplaint)),
    ...updates,
    id: complaintId,
    updatedAt: now,
  };

  if (index !== -1) {
    cachedComplaints = [
      ...cachedComplaints.slice(0, index),
      updatedRecord,
      ...cachedComplaints.slice(index + 1),
    ];
  } else {
    cachedComplaints = [updatedRecord, ...cachedComplaints];
  }

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
  } catch (err) {
    console.warn('[ComplaintService] LocalStorage update notice:', err);
  }
  notifySubscribers();

  // 1. Update in Supabase
  try {
    const patchRow: Record<string, any> = { updated_at: now };
    if (updates.status !== undefined) patchRow.status = updates.status;
    if (updates.priority !== undefined) patchRow.priority = updates.priority;
    if (updates.assignedOfficer !== undefined) patchRow.assigned_officer = updates.assignedOfficer;
    if (updates.assignedCrew !== undefined) patchRow.assigned_crew = updates.assignedCrew;
    if (updates.resolutionDetails !== undefined) patchRow.resolution_details = updates.resolutionDetails;
    if (updates.pipelineStep !== undefined) patchRow.pipeline_step = updates.pipelineStep;
    if (updates.pipelineStepName !== undefined) patchRow.pipeline_step_name = updates.pipelineStepName;
    if (updates.pipelinePercent !== undefined) patchRow.pipeline_percent = updates.pipelinePercent;
    if (updates.slaRemaining !== undefined) patchRow.sla_remaining = updates.slaRemaining;
    if (updates.slaStatus !== undefined) patchRow.sla_status = updates.slaStatus;
    if (updates.rating !== undefined) patchRow.rating = updates.rating;
    if (updates.imageUrl !== undefined) patchRow.image_url = updates.imageUrl;
    if (updates.afterImageUrl !== undefined) patchRow.after_image_url = updates.afterImageUrl;
    if (updates.attachments !== undefined) patchRow.attachments = updates.attachments;
    if (updates.statusHistory !== undefined) patchRow.status_history = updates.statusHistory;
    if (updates.officerNotes !== undefined) patchRow.officer_notes = updates.officerNotes;

    const { error: updateErr } = await supabase
      .from('complaints')
      .update(patchRow)
      .eq('id', complaintId);

    if (updateErr) {
      console.warn('[ComplaintService] Supabase patch notice:', updateErr.message);
    }
  } catch (err) {
    console.warn('[ComplaintService] Supabase update exception:', err);
  }

  // 2. Also patch backend API
  try {
    fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }).catch(() => {});
  } catch {
    // Ignored
  }

  return updatedRecord;
}

/**
 * Upload evidence photo to Supabase Storage bucket 'civic-evidence'
 */
export async function uploadEvidencePhoto(
  file: File | Blob,
  fileName: string = 'evidence.jpg',
  userId?: string
): Promise<string | null> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const uid = userId || session?.user?.id || 'anonymous';
    const filePath = `${uid}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('civic-evidence')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('[ComplaintService] Supabase storage upload notice:', uploadError.message);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('civic-evidence')
      .getPublicUrl(filePath);

    return urlData.publicUrl || null;
  } catch (err) {
    console.error('[ComplaintService] Exception uploading photo:', err);
    return null;
  }
}

/**
 * Sync user profile to Supabase profiles table
 */
export async function syncUserProfile(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<{ role: string }> {
  const email = (user.email || '').toLowerCase().trim();
  const isAdmin = email === 'dp7899899@gmail.com' || email === 'admin@icmrs.gov';
  const role = isAdmin ? 'admin' : (email.includes('officer') ? 'officer' : 'citizen');

  try {
    await supabase.from('profiles').upsert({
      id: user.uid,
      email: user.email || '',
      name: user.displayName || 'Citizen',
      role,
      avatar: user.photoURL || '',
      updated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[ComplaintService] Profile upsert notice:', err);
  }

  return { role };
}
