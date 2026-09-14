/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CivicComplaint } from '../types';
import { INITIAL_COMPLAINTS } from '../data/mockData';
import { 
  db, 
  doc, 
  collection, 
  setDoc, 
  updateDoc, 
  getDocs, 
  onSnapshot, 
  handleFirestoreError, 
  OperationType 
} from '../lib/firebase';

const LOCAL_STORAGE_KEY = 'icmrs_civic_complaints';

// In-memory cache & event listeners for immediate reactivity
let cachedComplaints: CivicComplaint[] = [];
let hasSeededInitial = false;
const subscribers = new Set<(complaints: CivicComplaint[]) => void>();

export function sanitizeComplaint(raw: any): CivicComplaint {
  if (!raw) return raw;
  return {
    ...raw,
    id: raw.id || raw.complaintNumber || `#ICMRS-${Date.now()}`,
    title: raw.title || 'Civic Incident',
    category: raw.category || 'Roads & Bridges',
    status: raw.status || 'In Progress',
    priority: raw.priority || 'Medium',
    location: raw.location || 'Delhi NCT',
    officerNotes: Array.isArray(raw.officerNotes) ? raw.officerNotes : [],
    statusHistory: Array.isArray(raw.statusHistory) ? raw.statusHistory : [],
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
  };
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
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
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
 * Seed initial complaints into Firestore if collection is empty
 */
async function seedInitialComplaintsIfEmpty() {
  if (hasSeededInitial) return;
  hasSeededInitial = true;

  try {
    const complaintsCol = collection(db, 'complaints');
    const existingSnap = await getDocs(complaintsCol);
    
    if (existingSnap.empty) {
      console.log('[ComplaintService] Initializing Firestore complaints collection...');
      for (const item of INITIAL_COMPLAINTS) {
        const itemRef = doc(db, 'complaints', item.id);
        await setDoc(itemRef, {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
      console.log('[ComplaintService] Successfully seeded initial complaints to Firestore.');
    }
  } catch (err) {
    console.warn('[ComplaintService] Auto-seed notice (permissions or network):', err);
  }
}

/**
 * Real-time subscription to complaints via Firestore onSnapshot
 */
export function subscribeComplaints(
  onData: (complaints: CivicComplaint[]) => void,
  onError?: (err: unknown) => void
): () => void {
  subscribers.add(onData);

  // Immediately feed cached records for instant UI render
  onData([...cachedComplaints]);

  // Attempt initial seed check in background
  seedInitialComplaintsIfEmpty();

  const complaintsCol = collection(db, 'complaints');

  // Attach real-time Firestore listener
  const unsubscribe = onSnapshot(
    complaintsCol,
    (snapshot) => {
      if (!snapshot.empty) {
        const firestoreList: CivicComplaint[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as CivicComplaint;
          firestoreList.push(sanitizeComplaint({
            ...data,
            id: docSnap.id || data.id,
          }));
        });

        // Sort complaints: newest or highest priority first
        cachedComplaints = firestoreList;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
        } catch {
          // Ignored
        }
        notifySubscribers();
      } else {
        // Empty snapshot: keep cached complaints and attempt seed
        seedInitialComplaintsIfEmpty();
      }
    },
    (error) => {
      console.warn('[ComplaintService] Firestore subscription notice:', error);
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.GET, 'complaints');
      } catch (handled) {
        console.info('[ComplaintService] Structured Firestore error reported:', handled);
      }
    }
  );

  return () => {
    subscribers.delete(onData);
    unsubscribe();
  };
}

/**
 * Fetch all complaints from backend database and Firestore
 */
export async function getComplaints(): Promise<CivicComplaint[]> {
  // 1. Fetch from persistent server backend database
  try {
    const res = await fetch('/api/complaints');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        cachedComplaints = data.data;
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
        } catch {
          // Ignored
        }
        notifySubscribers();
        return cachedComplaints;
      }
    }
  } catch (err) {
    console.warn('[ComplaintService] Backend fetch notice:', err);
  }

  // 2. Fallback to Firestore
  try {
    const complaintsCol = collection(db, 'complaints');
    const snapshot = await getDocs(complaintsCol);
    if (!snapshot.empty) {
      const list: CivicComplaint[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as CivicComplaint);
      });
      cachedComplaints = list;
      return list;
    }
  } catch (err) {
    console.warn('[ComplaintService] getComplaints fallback to cache:', err);
  }
  return [...cachedComplaints];
}

/**
 * Save a new complaint document permanently to database and Firestore
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
      notes: `Complaint registered and logged into database`
    }],
    userId: user?.uid || complaint.userId || citizenEmail,
    userEmail: citizenEmail,
    createdAt: complaint.createdAt || now,
    updatedAt: now,
  };

  // Optimistic UI update
  cachedComplaints = [newRecord, ...cachedComplaints.filter((c) => c.id !== newRecord.id)];
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cachedComplaints));
  } catch (err) {
    console.warn('[ComplaintService] LocalStorage save notice:', err);
  }
  notifySubscribers();

  // 1. Save permanently to backend database API
  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newRecord),
    });

    if (res.ok) {
      const respData = await res.json();
      if (respData.success && respData.data) {
        console.log('[ComplaintService] Complaint permanently saved to backend database:', respData.data.id);
        const serverRecord = respData.data as CivicComplaint;
        cachedComplaints = [serverRecord, ...cachedComplaints.filter((c) => c.id !== serverRecord.id && c.id !== newRecord.id)];
        notifySubscribers();
      }
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('[ComplaintService] Backend rejected complaint:', errData);
    }
  } catch (err) {
    console.warn('[ComplaintService] Backend post notice:', err);
  }

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, 'complaints', newRecord.id);
    await setDoc(docRef, newRecord);
  } catch (error) {
    console.warn('[ComplaintService] Firestore persistence notice:', error);
  }

  return newRecord;
}

/**
 * Update an existing complaint in backend database and Firestore
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

  // 1. Update backend database
  try {
    await fetch(`/api/complaints/${encodeURIComponent(complaintId)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
  } catch (err) {
    console.warn('[ComplaintService] Backend patch notice:', err);
  }

  // 2. Persist update to Firestore
  try {
    const docRef = doc(db, 'complaints', complaintId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: now,
    });
  } catch (error) {
    console.warn('[ComplaintService] Firestore update notice:', error);
  }

  return updatedRecord;
}

/**
 * Sync user profile to Firestore
 */
export async function syncUserProfileToFirestore(user: {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}): Promise<{ role: string }> {
  const email = (user.email || '').toLowerCase().trim();
  const isAdmin = email === 'dp7899899@gmail.com';
  const role = isAdmin ? 'admin' : 'citizen';

  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        id: user.uid,
        email: user.email || '',
        name: user.displayName || (isAdmin ? 'Admin' : 'Resident'),
        role,
        avatar: user.photoURL || '',
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('[ComplaintService] User profile sync notice:', error);
  }

  return { role };
}

// Aliases for drop-in compatibility
export const saveComplaintToFirestore = saveComplaint;
export const updateComplaintInFirestore = updateComplaint;
