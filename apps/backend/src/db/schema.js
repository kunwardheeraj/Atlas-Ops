import { pgTable, uuid, varchar, text, timestamp, pgEnum, } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// ─── Enums ────────────────────────────────────────────────────────────────────
export const jobStatusEnum = pgEnum('job_status', [
    'unassigned',
    'in_progress',
    'offline_syncing',
    'needs_ai_review',
    'completed',
]);
export const jobPriorityEnum = pgEnum('job_priority', [
    'high',
    'medium',
    'low',
]);
// ─── Technicians ──────────────────────────────────────────────────────────────
export const technicians = pgTable('technicians', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    initials: varchar('initials', { length: 4 }).notNull(),
    tenantId: uuid('tenant_id').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
// ─── Jobs ─────────────────────────────────────────────────────────────────────
export const jobs = pgTable('jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    jobNumber: varchar('job_number', { length: 20 }).notNull().unique(),
    title: varchar('title', { length: 255 }).notNull(),
    location: text('location').notNull(),
    status: jobStatusEnum('status').default('unassigned').notNull(),
    priority: jobPriorityEnum('priority').default('medium').notNull(),
    assignedTechnicianId: uuid('assigned_technician_id').references(() => technicians.id),
    tenantId: uuid('tenant_id').notNull(),
    lastSyncedAt: timestamp('last_synced_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
// ─── AI Reports ───────────────────────────────────────────────────────────────
export const aiReports = pgTable('ai_reports', {
    id: uuid('id').primaryKey().defaultRandom(),
    jobId: uuid('job_id').notNull().references(() => jobs.id),
    jobNumber: varchar('job_number', { length: 20 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    location: text('location').notNull(),
    priority: varchar('priority', { length: 20 }).notNull(),
    summary: text('summary').notNull(),
    flaggedIssues: text('flagged_issues').notNull().default('[]'), // JSON array stored as text
    recommendedActions: text('recommended_actions').notNull().default('[]'), // JSON array stored as text
    generatedAt: timestamp('generated_at').defaultNow().notNull(),
});
// ─── Relations ────────────────────────────────────────────────────────────────
export const jobsRelations = relations(jobs, ({ one, many }) => ({
    technician: one(technicians, {
        fields: [jobs.assignedTechnicianId],
        references: [technicians.id],
    }),
    reports: many(aiReports),
}));
export const techniciansRelations = relations(technicians, ({ many }) => ({
    jobs: many(jobs),
}));
export const aiReportsRelations = relations(aiReports, ({ one }) => ({
    job: one(jobs, {
        fields: [aiReports.jobId],
        references: [jobs.id],
    }),
}));
