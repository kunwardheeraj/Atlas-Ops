import { Router, Request, Response } from 'express';
import NodeCache from 'node-cache';
import { db } from '../db/index.js';
import { jobs } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { resolveJobConflict, type JobState } from '../services/syncService.js';
import { getAiReportQueue } from '../queues/aiReportQueue.js';
import { jobEventEmitter } from './events.js';

const router = Router();

// ─── Idempotency Cache ────────────────────────────────────────────────────────
// Keys are stored for 24 hours (86400 seconds). On network retries,
// the same Idempotency-Key returns the cached response without touching the DB.

const idempotencyCache = new NodeCache({
  stdTTL: 86400,     // 24-hour TTL
  checkperiod: 3600, // cleanup every hour
  useClones: false,
});

// ─── NYC Coordinate Overlay ───────────────────────────────────────────────────
// Adds realistic lat/lng to each job without a DB migration.
// Coordinates map real NYC landmarks that match the seed location strings.
const JOB_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'JOB-4821': { lat: 40.7098, lng: -74.0117 }, // One Liberty Plaza
  'JOB-4820': { lat: 40.7505, lng: -73.9934 }, // Westfield Manhattan Mall
  'JOB-4817': { lat: 40.7145, lng: -74.0050 }, // Civic Center area
  'JOB-4812': { lat: 40.7580, lng: -73.9855 }, // Midtown Skyline Tower
  'JOB-4806': { lat: 40.7282, lng: -73.7949 }, // Metro Business Park, Queens
};

// ─── GET /api/jobs ────────────────────────────────────────────────────────────
// Returns all jobs with their assigned technician details (via Drizzle relation).

router.get('/', async (req: Request, res: Response) => {
  try {
    const allJobs = await db.query.jobs.findMany({
      with: {
        technician: {
          columns: {
            id: true,
            name: true,
            initials: true,
            email: true,
          },
        },
      },
      orderBy: (jobs, { desc }) => [desc(jobs.updatedAt)],
    });

    // Overlay coordinates from the lookup map
    const jobsWithCoords = allJobs.map((job) => ({
      ...job,
      coordinates: JOB_COORDINATES[job.jobNumber] ?? null,
    }));

    res.json({
      success: true,
      count: jobsWithCoords.length,
      data: jobsWithCoords,
    });
  } catch (error) {
    console.error('[GET /api/jobs] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch jobs',
    });
  }
});

// ─── POST /api/jobs/sync ──────────────────────────────────────────────────────
// The offline-sync endpoint. Requires an `Idempotency-Key` header.
// - If the key has been seen before: returns cached response (safe retry).
// - If the key is new: processes the upsert and caches the response.

router.post('/sync', async (req: Request, res: Response) => {
  // 1. Validate Idempotency-Key header
  const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

  if (!idempotencyKey) {
    res.status(400).json({
      success: false,
      error: 'Missing required header: Idempotency-Key',
      hint: 'Generate a UUID per sync attempt and include it as Idempotency-Key header.',
    });
    return;
  }

  // 2. Check idempotency cache (safe replay)
  const cached = idempotencyCache.get<object>(idempotencyKey);
  if (cached) {
    console.log(`[sync] Replay detected for key: ${idempotencyKey}`);
    res.status(200).json({
      ...cached,
      replay: true,
      message: 'Idempotent replay — no database write occurred.',
    });
    return;
  }

  // 3. Process the sync payload
  try {
    const payload = req.body as {
      jobId: string;
      status: string;
      notes?: string;
      technicianId?: string;
    };

    if (!payload.jobId) {
      res.status(422).json({
        success: false,
        error: 'Missing required field: jobId',
      });
      return;
    }

    // Fetch the current server state of the job
    const [serverRecord] = await db
      .select()
      .from(jobs)
      .where(eq(jobs.id, payload.jobId))
      .limit(1);

    if (!serverRecord) {
      res.status(404).json({
        success: false,
        error: `No job found with id: ${payload.jobId}`,
      });
      return;
    }

    // Build typed JobState objects for the conflict resolver
    const serverJobState: JobState = {
      id: serverRecord.id,
      title: serverRecord.title,
      status: serverRecord.status,
      priority: serverRecord.priority,
      location: serverRecord.location,
      notes: payload.notes ?? null,          // Use client notes for comparison
      checklist: payload.checklist ?? [],
      updatedAt: serverRecord.updatedAt,
    };

    const clientJobState: JobState = {
      id: payload.jobId,
      title: payload.title ?? serverRecord.title,
      status: payload.status ?? serverRecord.status,
      priority: payload.priority ?? serverRecord.priority,
      location: payload.location ?? serverRecord.location,
      notes: payload.notes ?? null,
      checklist: payload.checklist ?? [],
      updatedAt: new Date(payload.clientUpdatedAt ?? Date.now()),
    };

    // Run the conflict resolution engine
    const { resolved, conflicts, strategy } = resolveJobConflict(serverJobState, clientJobState);

    if (conflicts.length > 0) {
      console.log(`[sync] Conflict detected for job ${payload.jobId} — strategy: ${strategy}`);
      conflicts.forEach((c) => console.log(`       [${c.field}] ${c.resolution}`));
    }

    // Persist the resolved (merged) state to the database
    const [updated] = await db
      .update(jobs)
      .set({
        title: resolved.title,
        status: resolved.status as typeof jobs.$inferInsert.status,
        priority: resolved.priority as typeof jobs.$inferInsert.priority,
        location: resolved.location,
        updatedAt: resolved.updatedAt,
        lastSyncedAt: new Date(),
        ...(payload.technicianId && { assignedTechnicianId: payload.technicianId }),
      })
      .where(eq(jobs.id, payload.jobId))
      .returning();

    // Trigger AI report generation
    const aiQueue = getAiReportQueue();
    await aiQueue.add('generate-report', {
      jobId: updated.id,
      jobNumber: serverRecord.jobNumber,
      title: updated.title,
      location: updated.location,
      status: updated.status,
      priority: updated.priority,
      notes: payload.notes ?? null,
      checklist: payload.checklist ?? [],
      technicianName: payload.technicianId ?? 'Unknown',
      tenantId: serverRecord.tenantId,
      // Mock tenant usage to occasionally exceed the 500k limit for testing the downgrade logic
      tenantTokensUsed: Math.floor(Math.random() * 600000),
    });

    // Fire SSE event so connected dashboards update instantly
    jobEventEmitter.emit('job_updated', {
      id: updated.id,
      ...updated,
      column: updated.status, // Frontend maps status to column
    });

    // 4. Build & cache the response — so retries get the same result
    const responseBody = {
      success: true,
      replay: false,
      message: `Sync processed. Strategy: ${strategy}. ${conflicts.length} field conflict(s) resolved.`,
      data: updated,
      conflicts,
      processedAt: new Date().toISOString(),
    };

    idempotencyCache.set(idempotencyKey, responseBody);
    console.log(`[sync] Processed key: ${idempotencyKey} → job ${payload.jobId}`);

    res.status(200).json(responseBody);
  } catch (error) {
    console.error('[POST /api/jobs/sync] Error:', error);
    // NOTE: We do NOT cache error responses — allow the client to retry legitimately.
    res.status(500).json({
      success: false,
      error: 'Sync failed. Safe to retry with the same Idempotency-Key.',
    });
  }
});

export default router;
