import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('citizen'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const complaints = pgTable('complaints', {
  id: serial('id').primaryKey(),
  complaintNumber: text('complaint_number').notNull().unique(),
  citizenName: text('citizen_name').notNull(),
  citizenEmail: text('citizen_email').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category').notNull(),
  status: text('status').notNull().default('Submitted'),
  priority: text('priority').notNull().default('Medium'),
  location: text('location').notNull(),
  lat: text('lat'),
  lng: text('lng'),
  dateTime: text('date_time').notNull(),
  department: text('department').notNull(),
  assignedOfficer: text('assigned_officer'),
  assignedCrew: text('assigned_crew'),
  pipelineStep: integer('pipeline_step').default(1),
  pipelineStepName: text('pipeline_step_name'),
  pipelinePercent: integer('pipeline_percent').default(20),
  slaRemaining: text('sla_remaining'),
  slaStatus: text('sla_status').default('on_track'),
  resolutionDetails: text('resolution_details'),
  imageUrl: text('image_url'),
  beforeImageUrl: text('before_image_url'),
  afterImageUrl: text('after_image_url'),
  attachments: text('attachments'), // JSON-serialized ComplaintAttachment[]
  statusHistory: text('status_history'), // JSON-serialized ComplaintStatusHistoryEntry[]
  officerNotes: text('officer_notes'), // JSON-serialized OfficerNote[]
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  complaints: many(complaints),
}));

export const complaintsRelations = relations(complaints, ({ one }) => ({
  citizen: one(users, {
    fields: [complaints.citizenEmail],
    references: [users.email],
  }),
}));
