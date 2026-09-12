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

function loadLocalData(): CivicComplaint[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[ComplaintService] Local storage load notice:', e);
  }
  return [...INITIAL_COMPLAINTS];
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
          firestoreList.push({
            ...data,
            id: docSnap.id || data.id,
          });
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
 * Fetch all complaints
 */
export async function getComplaints(): Promise<CivicComplaint[]> {
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
 * Save a new complaint document to Firestore
 */
export async function saveComplaint(
  complaint: CivicComplaint,
  user?: { uid: string; email?: string | null }
): Promise<CivicComplaint> {
  const now = new Date().toISOString();
  const newRecord: CivicComplaint = {
    ...complaint,
    userId: user?.uid || complaint.userId || 'citizen-anon',
    userEmail: user?.email || complaint.userEmail || '',
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

  // Persist to Firestore
  try {
    const docRef = doc(db, 'complaints', newRecord.id);
    await setDoc(docRef, newRecord);
  } catch (error) {
    console.error('[ComplaintService] Error persisting complaint to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, `complaints/${newRecord.id}`);
  }

  return newRecord;
}

/**
 * Update an existing complaint in Firestore
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
    console.warn('[ComplaintService] LocalStorage update notice:', err);
  }
  notifySubscribers();

  // Persist update to Firestore
  try {
    const docRef = doc(db, 'complaints', complaintId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: now,
    });
  } catch (error) {
    console.error('[ComplaintService] Error updating complaint in Firestore:', error);
    handleFirestoreError(error, OperationType.UPDATE, `complaints/${complaintId}`);
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
