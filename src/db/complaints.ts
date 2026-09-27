import { db } from './index.ts';
import { complaints } from './schema.ts';
import { eq, desc } from 'drizzle-orm';
import type { CivicComplaint } from '../types.ts';

export async function getAllComplaintsFromDb() {
  try {
    const results = await db.select().from(complaints).orderBy(desc(complaints.createdAt));
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.warn("Cloud SQL not connected or query failed — returning empty list:", (error as any)?.message);
    return [];
  }
}

export async function insertComplaintToDb(data: Partial<CivicComplaint>) {
  try {
    const complaintNumber = data.complaintNumber || data.id || `#ICMRS-${new Date().getFullYear()}-${Date.now()}`;
    const record = {
      complaintNumber,
      citizenName: data.citizenName || 'Citizen User',
      citizenEmail: data.citizenEmail || data.userEmail || 'citizen@icmrs.gov',
      title: data.title || 'Untitled Report',
      description: data.description || '',
      category: data.category || 'General Civic Infrastructure',
      status: data.status || 'Submitted',
      priority: data.priority || 'Medium',
      location: data.location || 'Municipal Area',
      lat: data.coordinates?.lat ? String(data.coordinates.lat) : null,
      lng: data.coordinates?.lng ? String(data.coordinates.lng) : null,
      dateTime: data.dateTime || new Date().toISOString(),
      department: data.department || 'District 04 Municipal Response Bureau',
      assignedOfficer: data.assignedOfficer || 'Elena Vance',
      assignedCrew: data.assignedCrew || 'Unit 4B',
      pipelineStep: data.pipelineStep || 1,
      pipelineStepName: data.pipelineStepName || 'Step 1 of 5: Telemetry Received & Dispatched',
      pipelinePercent: data.pipelinePercent || 20,
      slaRemaining: data.slaRemaining || '24h 00m',
      slaStatus: data.slaStatus || 'on_track',
      resolutionDetails: data.resolutionDetails || null,
      imageUrl: data.imageUrl || null,
      beforeImageUrl: data.beforeImageUrl || null,
      afterImageUrl: data.afterImageUrl || null,
      attachments: data.attachments ? JSON.stringify(data.attachments) : null,
      statusHistory: data.statusHistory ? JSON.stringify(data.statusHistory) : null,
      officerNotes: data.officerNotes ? JSON.stringify(data.officerNotes) : null,
    };

    const result = await db.insert(complaints).values(record).returning();
    return result[0];
  } catch (error) {
    console.error("Failed to insert complaint into Cloud SQL:", error);
    throw new Error("Database insert failed. Please try again later.", { cause: error });
  }
}

export async function updateComplaintInDb(complaintNumber: string, updates: Partial<CivicComplaint>) {
  try {
    const patchData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (updates.status !== undefined) patchData.status = updates.status;
    if (updates.priority !== undefined) patchData.priority = updates.priority;
    if (updates.pipelineStep !== undefined) patchData.pipelineStep = updates.pipelineStep;
    if (updates.pipelineStepName !== undefined) patchData.pipelineStepName = updates.pipelineStepName;
    if (updates.pipelinePercent !== undefined) patchData.pipelinePercent = updates.pipelinePercent;
    if (updates.slaRemaining !== undefined) patchData.slaRemaining = updates.slaRemaining;
    if (updates.slaStatus !== undefined) patchData.slaStatus = updates.slaStatus;
    if (updates.resolutionDetails !== undefined) patchData.resolutionDetails = updates.resolutionDetails;
    if (updates.assignedOfficer !== undefined) patchData.assignedOfficer = updates.assignedOfficer;
    if (updates.assignedCrew !== undefined) patchData.assignedCrew = updates.assignedCrew;
    if (updates.afterImageUrl !== undefined) patchData.afterImageUrl = updates.afterImageUrl;
    if (updates.statusHistory !== undefined) patchData.statusHistory = JSON.stringify(updates.statusHistory);
    if (updates.officerNotes !== undefined) patchData.officerNotes = JSON.stringify(updates.officerNotes);
    if (updates.attachments !== undefined) patchData.attachments = JSON.stringify(updates.attachments);

    const result = await db
      .update(complaints)
      .set(patchData)
      .where(eq(complaints.complaintNumber, complaintNumber))
      .returning();

    return result[0] || null;
  } catch (error) {
    console.error(`Failed to update complaint ${complaintNumber} in Cloud SQL:`, error);
    throw new Error("Database update failed. Please try again later.", { cause: error });
  }
}
