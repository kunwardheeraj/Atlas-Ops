/**
 * Seed script for AI Reports — inserts realistic mock reports into ai_reports table.
 * Run: npx tsx src/seed-reports.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import { db, pool } from './db/index.js';
import { jobs, aiReports } from './db/schema.js';
async function seedReports() {
    console.log('🤖 Seeding AI Reports...\n');
    // Fetch existing jobs to link reports to
    const existingJobs = await db.select().from(jobs);
    if (existingJobs.length === 0) {
        console.error('❌ No jobs found. Run `npm run seed` first.');
        process.exit(1);
    }
    // Clear existing reports
    await db.delete(aiReports);
    const mockReports = [
        {
            job: existingJobs.find(j => j.jobNumber === 'JOB-4806') ?? existingJobs[0],
            report: {
                summary: 'Technician Marcus Webb completed the cooling tower water quality inspection at Metro Business Park. Water clarity was within acceptable limits (pH 7.4), however bacterial count from three tower cells exceeded safe thresholds. Biocide dosing equipment was found to be partially blocked. Full system flush recommended before next operational cycle.',
                flaggedIssues: [
                    'Bacterial count (Legionella) exceeded 100 CFU/mL in Cell 3 — immediate biocide treatment required',
                    'Blowdown valve on north tower showing signs of scale buildup — risk of blockage within 2 weeks',
                    'Water temperature in drift eliminator zone elevated by 4°C above operating spec',
                ],
                recommendedActions: [
                    'Schedule emergency biocide shock treatment within 24 hours',
                    'Replace blowdown valve assembly on north tower during next planned maintenance window',
                    'Calibrate temperature sensors and inspect drift eliminators for fouling',
                    'Increase inspection frequency to bi-weekly until bacterial count returns to safe levels',
                ],
            },
        },
        {
            job: existingJobs.find(j => j.jobNumber === 'JOB-4821') ?? existingJobs[0],
            report: {
                summary: 'Routine HVAC pressure test conducted on rooftop units at One Liberty Plaza. All primary air handlers passed static pressure checks within ±5% of specification. Two secondary units showed anomalous pressure drops indicating potential duct seal failure. No refrigerant leaks detected. Filter replacement is overdue across three zones.',
                flaggedIssues: [
                    'AHU-04 static pressure drop of 18% — possible duct seal failure in Zone C ductwork',
                    'AHU-07 pressure variance exceeds ±8% of baseline — requires further investigation',
                    'Filters in Zones A, C, and F are visibly clogged — MERV-13 replacement required immediately',
                ],
                recommendedActions: [
                    'Perform detailed duct integrity test on Zone C within 48 hours',
                    'Replace all overdue MERV-13 filters across Zones A, C, and F',
                    'Re-test AHU-07 after filter replacement to isolate root cause of pressure variance',
                    'Schedule follow-up inspection in 30 days to confirm resolution',
                ],
            },
        },
        {
            job: existingJobs.find(j => j.jobNumber === 'JOB-4820') ?? existingJobs[0],
            report: {
                summary: 'Emergency response to reported pipe burst at Westfield Mall Bay 12. Technician Marcus Webb isolated the affected zone within 12 minutes of arrival. A 40mm copper supply pipe failed at a brazed joint, likely due to thermal fatigue. Water damage to approximately 15 square meters of adjacent retail space was contained using emergency barriers.',
                flaggedIssues: [
                    'Failed brazed joint on 40mm copper supply pipe — thermal fatigue confirmed by visual inspection',
                    'Secondary isolation valve in corridor 12B is non-operational — must be replaced before re-pressurising',
                    'Evidence of previous patch repair on adjacent pipe section — full section replacement advised',
                ],
                recommendedActions: [
                    'Replace full 2-metre section of affected copper supply pipe with new brazed joints',
                    'Replace non-operational isolation valve on corridor 12B',
                    'Commission a thermal imaging survey of adjacent pipe network to identify further fatigue points',
                    'Liaise with property management for water damage remediation in affected retail space',
                ],
            },
        },
    ];
    for (const { job, report } of mockReports) {
        await db.insert(aiReports).values({
            jobId: job.id,
            jobNumber: job.jobNumber,
            title: job.title,
            location: job.location,
            priority: job.priority,
            summary: report.summary,
            flaggedIssues: JSON.stringify(report.flaggedIssues),
            recommendedActions: JSON.stringify(report.recommendedActions),
        });
        console.log(`   ✓ Report seeded for ${job.jobNumber}: ${job.title}`);
    }
    console.log(`\n✅ Done — ${mockReports.length} AI reports seeded.`);
}
seedReports()
    .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
})
    .finally(() => pool.end());
