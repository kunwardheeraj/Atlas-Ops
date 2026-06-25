import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jobsRouter from './routes/jobs.js';
import eventsRouter from './routes/events.js';
import reportsRouter from './routes/reports.js';
import { startReportWorker } from './workers/reportWorker.js';
dotenv.config();
const app = express();
const port = process.env.PORT || 3001;
// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'Atlas Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/jobs', jobsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/reports', reportsRouter);
// ─── Workers ──────────────────────────────────────────────────────────────────
startReportWorker();
// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(port, () => {
    console.log(`🚀 Atlas Backend running on http://localhost:${port}`);
});
