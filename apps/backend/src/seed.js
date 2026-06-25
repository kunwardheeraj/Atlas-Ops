/**
 * Atlas Database Seed Script
 * Inserts 2 mock technicians and 5 realistic mock jobs.
 *
 * Usage: npx tsx src/seed.ts
 */
import dotenv from 'dotenv';
dotenv.config();
import { db, pool } from './db/index.js';
import { technicians, jobs, aiReports } from './db/schema.js';
// ─── Seed Data ────────────────────────────────────────────────────────────────
const TENANT_ID = '00000000-0000-0000-0000-000000000001'; // Static demo tenant
const MOCK_TECHNICIANS = [
    {
        name: 'Marcus Webb',
        email: 'marcus.webb@atlas-ops.com',
        initials: 'MW',
        tenantId: TENANT_ID,
    },
    {
        name: 'Priya Nair',
        email: 'priya.nair@atlas-ops.com',
        initials: 'PN',
        tenantId: TENANT_ID,
    },
];
async function seed() {
    console.log('🌱 Starting Atlas database seed...\n');
    // 1. Clear existing seed data (in FK order — child tables first)
    console.log('🗑  Clearing existing data...');
    await db.delete(aiReports);
    await db.delete(jobs);
    await db.delete(technicians);
    // 2. Insert technicians
    console.log('👷 Inserting technicians...');
    const insertedTechs = await db
        .insert(technicians)
        .values(MOCK_TECHNICIANS)
        .returning();
    const [marcus, priya] = insertedTechs;
    console.log(`   ✓ ${marcus.name} (${marcus.id})`);
    console.log(`   ✓ ${priya.name} (${priya.id})`);
    // 3. Insert jobs
    console.log('\n📋 Inserting jobs...');
    const MOCK_JOBS = [
        {
            jobNumber: 'JOB-4821',
            title: 'Rooftop HVAC Pressure Test',
            location: 'One Liberty Plaza, FL 23',
            status: 'unassigned',
            priority: 'high',
            assignedTechnicianId: null,
            tenantId: TENANT_ID,
        },
        {
            jobNumber: 'JOB-4820',
            title: 'Emergency Pipe Burst Response',
            location: 'Westfield Mall, Bay 12',
            status: 'in_progress',
            priority: 'high',
            assignedTechnicianId: marcus.id,
            tenantId: TENANT_ID,
        },
        {
            jobNumber: 'JOB-4817',
            title: 'Annual Fire Suppression Test',
            location: 'Civic Center, Level 2',
            status: 'in_progress',
            priority: 'medium',
            assignedTechnicianId: priya.id,
            tenantId: TENANT_ID,
        },
        {
            jobNumber: 'JOB-4812',
            title: 'Chiller Unit Bearing Replacement',
            location: 'Skyline Tower, Basement',
            status: 'offline_syncing',
            priority: 'high',
            assignedTechnicianId: marcus.id,
            tenantId: TENANT_ID,
            lastSyncedAt: new Date(Date.now() - 51 * 60 * 1000), // 51 mins ago
        },
        {
            jobNumber: 'JOB-4806',
            title: 'Cooling Tower Water Quality Report',
            location: 'Metro Business Park',
            status: 'needs_ai_review',
            priority: 'high',
            assignedTechnicianId: marcus.id,
            tenantId: TENANT_ID,
        },
    ];
    const insertedJobs = await db
        .insert(jobs)
        .values(MOCK_JOBS)
        .returning();
    for (const job of insertedJobs) {
        console.log(`   ✓ [${job.status.toUpperCase().padEnd(18)}] ${job.jobNumber}: ${job.title}`);
    }
    console.log(`\n✅ Seed complete — ${insertedTechs.length} technicians, ${insertedJobs.length} jobs inserted.`);
    console.log('   Run: curl http://localhost:3001/api/jobs to verify.\n');
}
seed()
    .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
})
    .finally(() => pool.end());
