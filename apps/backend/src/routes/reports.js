import { Router } from 'express';
import { db } from '../db/index.js';
import { aiReports } from '../db/schema.js';
import { desc } from 'drizzle-orm';
const router = Router();
// ─── GET /api/reports ──────────────────────────────────────────────────────────
// Returns all AI-generated reports, newest first.
// Optional query param: ?search=<text> to filter by title, location, or job number.
router.get('/', async (req, res) => {
    try {
        const allReports = await db
            .select()
            .from(aiReports)
            .orderBy(desc(aiReports.generatedAt));
        // Parse the JSON text columns back to arrays before sending
        const parsed = allReports.map((r) => ({
            ...r,
            flaggedIssues: JSON.parse(r.flaggedIssues),
            recommendedActions: JSON.parse(r.recommendedActions),
        }));
        res.json({
            success: true,
            count: parsed.length,
            data: parsed,
        });
    }
    catch (error) {
        console.error('[GET /api/reports] Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reports',
        });
    }
});
export default router;
