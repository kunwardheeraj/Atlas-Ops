/**
 * Atlas AI Report Queue
 *
 * Provides a typed factory for dispatching AI report generation
 * jobs to BullMQ. Import this in server.ts and routes to enqueue jobs.
 */

import { Queue } from 'bullmq';

export interface AiReportJobPayload {
  jobId: string;
  jobNumber: string;
  title: string;
  location: string;
  status: string;
  priority: string;
  notes: string | null;
  checklist: string[];
  technicianName: string | null;
  tenantId: string;
  /** Tokens consumed by this tenant this month (for budget enforcement) */
  tenantTokensUsed: number;
}

// BullMQ default options — retry 3x with exponential backoff (Dead-Letter pattern)
export const AI_REPORT_JOB_OPTIONS = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 5000, // 5s → 10s → 20s
  },
  removeOnComplete: { count: 100 },
  removeOnFail: false, // Keep failed jobs for DLQ inspection
};

let _queue: Queue<AiReportJobPayload> | null = null;

export function getAiReportQueue(): Queue<AiReportJobPayload> {
  if (!_queue) {
    _queue = new Queue<AiReportJobPayload>('ai-reports', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
      },
      defaultJobOptions: AI_REPORT_JOB_OPTIONS,
    });
    console.log('✅ BullMQ Queue "ai-reports" initialized');
  }
  return _queue;
}
