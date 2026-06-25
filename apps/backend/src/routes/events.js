import { Router } from 'express';
import { EventEmitter } from 'events';
export const jobEventEmitter = new EventEmitter();
const router = Router();
// ─── GET /api/events ──────────────────────────────────────────────────────────
// Server-Sent Events (SSE) endpoint for real-time dashboard updates.
router.get('/', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
    });
    // Send an initial heartbeat/connection success
    res.write('data: {"message": "connected"}\n\n');
    // Define the event handler
    const handleJobUpdate = (jobData) => {
        // Standard SSE format: `data: <json>\n\n`
        res.write(`data: ${JSON.stringify(jobData)}\n\n`);
    };
    // Listen to the global event emitter
    jobEventEmitter.on('job_updated', handleJobUpdate);
    // Cleanup when client disconnects
    req.on('close', () => {
        jobEventEmitter.off('job_updated', handleJobUpdate);
    });
});
export default router;
