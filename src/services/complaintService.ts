/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicComplaint } from '../types';
import { INITIAL_COMPLAINTS } from '../data/mockData';

const LOCAL_STORAGE_KEY = 'icmrs_civic_complaints';

// In-memory cache & event listeners for real-time reactivity across components
let cachedComplaints: CivicComplaint[] = [];
const subscribers = new Set<(complaints: CivicComplaint[]) => void>();

function notifySubscribers() {
  const data = [...cachedComplaints];
  subscribers.forEach((callback) => {
    try {
      callback(data);
    } catch (err) {
      console.error('[ComplaintService] Callback error:', err);
    }
  });
}

function loadInitialData(): CivicComplaint[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[ComplaintService] Error reading localStorage:', e);
  }
  return [...INITIAL_COMPLAINTS];
}

cachedComplaints = loadInitialData();

/**
 * Real-time subscription to complaints (Local & Server Sync without Firebase).
 */
export function subscribeComplaints(
  onData: (complaints: CivicComplaint[]) => void,
  onError?: (err: unknown) => void
): () => void {
  subscribers.add(onData);

  // Immediately supply current cached complaints
  onData([...cachedComplaints]);

  // Sync fresh complaints from Express server in the background
  fetch('/api/complaints')
    .then((res) => (res.ok ? res.json() : null))
    .then((json) => {
      if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
        const hasCustomLocal = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!hasCustomLocal) {
          cachedComplaints = json.data;
          notifySubscribers();
        }
      }
    })
    .catch((err) => {
      if (onError) onError(err);
    });

  return () => {
    subscribers.delete(onData);
  };
}

/**
 * Fetch all complaints directly
 */
export async function getComplaints(): Promise<CivicComplaint[]> {
  return [...cachedComplaints];
}

/**
 * Save a new complaint document
 */
export async function saveComplaint(
  complaint: CivicComplaint,
  user?: { uid: string; email?: string | null }
): Promise<CivicComplaint> {
  const now = new Date().toISOString();
  const newRecord: CivicComplaint = {
    ...complaint,
    userId: user?.uid || complaint.userId,
    userEmail: user?.email || complaint.userEmail,
    createdAt: complaint.createdAt || now,
    updatedAt: now,
  };

  cachedComplaints = [newRecord, ...cachedComplaints.filter((c) => c.id !== newRecord.id)];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
  } catch (err) {
    console.warn('[ComplaintService] Could not save to localStorage:', err);
  }

  notifySubscribers();

  // Sync to Express backend API
  try {
    await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord),
    });
  } catch (err) {
    console.warn('[ComplaintService] API sync notice:', err);
  }

  return newRecord;
}

/**
 * Update an existing complaint
 */
export async function updateComplaint(
  complaintId: string,
  updates: Partial<CivicComplaint>
): Promise<CivicComplaint | null> {
  const now = new Date().toISOString();
  const index = cachedComplaints.findIndex((c) => c.id === complaintId);

  if (index === -1) {
    console.warn('[ComplaintService] Complaint not found to update:', complaintId);
    return null;
  }

  const updatedRecord: CivicComplaint = {
    ...cachedComplaints[index],
    ...updates,
    updatedAt: now,
  };

  cachedComplaints = [
    ...cachedComplaints.slice(0, index),
    updatedRecord,
    ...cachedComplaints.slice(index + 1),
  ];

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
  } catch (err) {
    console.warn('[ComplaintService] Could not update localStorage:', err);
  }

  notifySubscribers();

  // Sync to Express backend API
  try {
    await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[ComplaintService] API update notice:', err);
  }

  return updatedRecord;
}

/**
 * Sync user profile
 */
export async function syncUserProfileToFirestore(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<{ role: string }> {
  const role = user.email === 'dp7899899@gmail.com' ? 'admin' : 'citizen';
  return { role };
}

// Aliases for seamless drop-in compatibility
export const saveComplaintToFirestore = saveComplaint;
export const updateComplaintInFirestore = updateComplaint;
