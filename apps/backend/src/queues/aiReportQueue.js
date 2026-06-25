/**
 * Atlas AI Report Queue
 *
 * Provides a typed factory for dispatching AI report generation
 * jobs to BullMQ. Import this in server.ts and routes to enqueue jobs.
 */
import { Queue } from 'bullmq';
// BullMQ default options — retry 3x with exponential backoff (Dead-Letter pattern)
export const AI_REPORT_JOB_OPTIONS = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000, // 5s → 10s → 20s
    },
    removeOnComplete: { count: 100 },
    removeOnFail: false, // Keep failed jobs for DLQ inspection
};
let _queue = null;
export function getAiReportQueue() {
    if (!_queue) {
        _queue = new Queue('ai-reports', {
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
