/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from 'fs';
import path from 'path';
import { CivicComplaint } from '../types';

export interface AuthoritativeComplaintRecord {
  citizenName: string;
  citizenEmail: string;
  complaintNumber: string;
  complaintTitle: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  location: string;
  department: string;
  assignedOfficer: string;
  resolutionDetails: string;
  evidence: string[];
  createdAt: string;
  updatedAt: string;
  statusHistory: any[];
  [key: string]: any;
}

interface FirebaseConfig {
  projectId: string;
  firestoreDatabaseId: string;
  apiKey: string;
}

let cachedConfig: FirebaseConfig | null = null;

function getConfig(): FirebaseConfig {
  if (!cachedConfig) {
    try {
      const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
      const raw = fs.readFileSync(configPath, 'utf8');
      cachedConfig = JSON.parse(raw);
    } catch (err) {
      console.warn('[FirestoreServer] Could not read firebase-applet-config.json:', err);
      cachedConfig = {
        projectId: 'eminent-aloe-4t8c4',
        firestoreDatabaseId: 'ai-studio-icmrsintelligent-20ad02e6-e593-4465-82c3-77c4d36f637d',
        apiKey: '',
      };
    }
  }
  return cachedConfig!;
}

// Convert native JS values to Firestore REST API typed values
function toFirestoreValue(val: any): any {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'string') return { stringValue: val };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
  }
  if (typeof val === 'boolean') return { booleanValue: val };
  if (Array.isArray(val)) {
    return { arrayValue: { values: val.map(toFirestoreValue) } };
  }
  if (typeof val === 'object') {
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        fields[k] = toFirestoreValue(v);
      }
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

// Convert Firestore REST API typed values back to JS
function fromFirestoreValue(val: any): any {
  if (!val) return null;
  if (val.nullValue !== undefined) return null;
  if (val.stringValue !== undefined) return val.stringValue;
  if (val.integerValue !== undefined) return parseInt(val.integerValue, 10);
  if (val.doubleValue !== undefined) return val.doubleValue;
  if (val.booleanValue !== undefined) return val.booleanValue;
  if (val.arrayValue !== undefined) {
    return (val.arrayValue.values || []).map(fromFirestoreValue);
  }
  if (val.mapValue !== undefined) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(val.mapValue.fields || {})) {
      obj[k] = fromFirestoreValue(v);
    }
    return obj;
  }
  return null;
}

/**
 * Save a complaint permanently to Firestore
 */
export async function saveComplaintToFirestore(complaint: CivicComplaint): Promise<boolean> {
  try {
    const cfg = getConfig();
    const docId = complaint.id || complaint.complaintNumber;
    const safeDocId = encodeURIComponent(docId);
    const now = new Date().toISOString();

    // Prepare evidence list
    const evidenceList: string[] = [];
    if (complaint.imageUrl) evidenceList.push(complaint.imageUrl);
    if (Array.isArray(complaint.attachments)) {
      complaint.attachments.forEach(a => {
        if (a.url && !evidenceList.includes(a.url)) evidenceList.push(a.url);
        else if (a.name && !evidenceList.includes(a.name)) evidenceList.push(a.name);
      });
    }

    const payload: AuthoritativeComplaintRecord = {
      ...complaint,
      id: docId,
      complaintNumber: complaint.complaintNumber || docId,
      complaintTitle: complaint.title,
      title: complaint.title,
      citizenName: complaint.citizenName || 'Marcus Vance',
      citizenEmail: complaint.citizenEmail || complaint.userEmail || 'citizen@icmrs.gov',
      description: complaint.description || '',
      category: complaint.category || 'Roads & Bridges',
      status: complaint.status || 'In Progress',
      priority: complaint.priority || 'High',
      location: complaint.location || 'Central Delhi',
      department: complaint.department || 'District 04 Municipal Response Bureau',
      assignedOfficer: complaint.assignedOfficer || 'Elena Vance',
      resolutionDetails: complaint.resolutionDetails || '',
      evidence: evidenceList,
      createdAt: complaint.createdAt || now,
      updatedAt: now,
      statusHistory: complaint.statusHistory || [
        {
          status: complaint.status || 'In Progress',
          timestamp: now,
          updatedBy: complaint.citizenName || 'Marcus Vance',
          role: 'citizen',
          notes: 'Civic complaint permanently recorded in municipal database.'
        }
      ]
    };

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(payload)) {
      fields[k] = toFirestoreValue(v);
    }

    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents/complaints/${safeDocId}?key=${cfg.apiKey}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[FirestoreServer] Failed to write complaint ${docId}:`, errText);
      return false;
    }

    console.log(`[FirestoreServer] Successfully persisted complaint ${docId} to Firestore.`);
    return true;
  } catch (err) {
    console.error('[FirestoreServer] Exception saving complaint to Firestore:', err);
    return false;
  }
}

/**
 * Update an existing complaint in Firestore
 */
export async function updateComplaintInFirestore(docId: string, updates: Partial<CivicComplaint>): Promise<boolean> {
  try {
    const cfg = getConfig();
    const safeDocId = encodeURIComponent(docId);
    const now = new Date().toISOString();

    const fieldsToUpdate: Record<string, any> = {
      ...updates,
      updatedAt: now
    };

    if (updates.title) {
      fieldsToUpdate.complaintTitle = updates.title;
    }

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(fieldsToUpdate)) {
      fields[k] = toFirestoreValue(v);
    }

    // Use updateMask to only update specified fields
    const queryParams = Object.keys(fields)
      .map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`)
      .join('&');

    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents/complaints/${safeDocId}?key=${cfg.apiKey}&${queryParams}`;

    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn(`[FirestoreServer] Failed to patch complaint ${docId}:`, errText);
      return false;
    }

    console.log(`[FirestoreServer] Successfully patched complaint ${docId} in Firestore.`);
    return true;
  } catch (err) {
    console.error('[FirestoreServer] Exception updating complaint in Firestore:', err);
    return false;
  }
}

/**
 * Fetch all complaints directly from Firestore
 */
export async function fetchComplaintsFromFirestore(): Promise<CivicComplaint[]> {
  try {
    const cfg = getConfig();
    const url = `https://firestore.googleapis.com/v1/projects/${cfg.projectId}/databases/${cfg.firestoreDatabaseId}/documents:runQuery?key=${cfg.apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'complaints' }]
        }
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('[FirestoreServer] Error querying complaints collection:', err);
      return [];
    }

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const complaints: CivicComplaint[] = [];
    for (const item of data) {
      if (item.document && item.document.fields) {
        const obj: Record<string, any> = {};
        for (const [k, v] of Object.entries(item.document.fields)) {
          obj[k] = fromFirestoreValue(v);
        }
        const docName = item.document.name.split('/').pop() || '';
        const docId = decodeURIComponent(docName);
        complaints.push({
          ...(obj as any),
          id: obj.id || docId,
          complaintNumber: obj.complaintNumber || obj.id || docId,
          title: obj.complaintTitle || obj.title,
          officerNotes: Array.isArray(obj.officerNotes) ? obj.officerNotes : [],
          statusHistory: Array.isArray(obj.statusHistory) ? obj.statusHistory : [],
          attachments: Array.isArray(obj.attachments) ? obj.attachments : [],
        });
      }
    }

    return complaints;
  } catch (err) {
    console.error('[FirestoreServer] Exception fetching complaints:', err);
    return [];
  }
}
