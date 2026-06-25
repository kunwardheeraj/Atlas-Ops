/**
 * Atlas Sync Engine — Deterministic Test Suite
 *
 * Standalone test using Node's built-in `assert` module.
 * No test framework needed. Run with: npx tsx src/tests/sync.test.ts
 *
 * Tests the three conflict resolution strategies:
 *   1. LWW — Client wins status (client timestamp is newer)
 *   2. Notes — Server-wins + client notes appended with [CONFLICT] flag
 *   3. Checklist — Union-Merge (Add-Wins), no items lost
 */

import assert from 'node:assert/strict';
import { resolveJobConflict, type JobState } from '../services/syncService.js';

// ─── ANSI color helpers ───────────────────────────────────────────────────────
const green  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red    = (s: string) => `\x1b[31m${s}\x1b[0m`;
const cyan   = (s: string) => `\x1b[36m${s}\x1b[0m`;
const bold   = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ─── Test runner ──────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ${green('✓')} ${name}`);
    passed++;
  } catch (err) {
    const message = err instanceof assert.AssertionError
      ? `\n      Expected: ${JSON.stringify(err.expected)}\n      Received: ${JSON.stringify(err.actual)}`
      : `\n      ${(err as Error).message}`;
    console.log(`  ${red('✗')} ${name}${red(message)}`);
    failed++;
  }
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const SERVER_TIMESTAMP = new Date('2025-01-15T10:00:00.000Z');
const CLIENT_TIMESTAMP = new Date('2025-01-15T10:45:00.000Z'); // Client is 45 mins newer

const serverJob: JobState = {
  id: 'job-uuid-001',
  title: 'Rooftop HVAC Pressure Test',
  status: 'in_progress',         // Server has older status
  priority: 'high',
  location: 'One Liberty Plaza, FL 23',
  notes: 'Initial inspection complete. Pressure nominal at startup.',
  checklist: [
    'Visual inspection',
    'Pressure gauge reading',
    'Valve check',
  ],
  updatedAt: SERVER_TIMESTAMP,
};

const clientJob: JobState = {
  id: 'job-uuid-001',
  title: 'Rooftop HVAC Pressure Test',  // Same — no conflict
  status: 'needs_ai_review',            // Client updated status while offline (newer)
  priority: 'high',                     // Same — no conflict
  location: 'One Liberty Plaza, FL 23', // Same — no conflict
  notes: 'Detected unusual vibration on compressor unit B. Needs specialist.',
  checklist: [
    'Visual inspection',   // Already on server
    'Pressure gauge reading', // Already on server
    'Compressor vibration check',  // NEW — added by client offline
    'Coolant level verification',  // NEW — added by client offline
  ],
  updatedAt: CLIENT_TIMESTAMP,
};

// ─── Run Tests ────────────────────────────────────────────────────────────────

console.log();
console.log(bold(cyan('  Atlas Conflict-Aware Sync Engine — Test Suite')));
console.log(dim('  ─────────────────────────────────────────────'));
console.log();

const { resolved, conflicts, strategy } = resolveJobConflict(serverJob, clientJob);

console.log(bold('  [Block 1] Last-Write-Wins (LWW) — Structured Fields'));

test('Status: client wins because client timestamp is newer (45 mins)', () => {
  assert.equal(resolved.status, 'needs_ai_review');
});

test('Title: no conflict — identical value preserved', () => {
  assert.equal(resolved.title, 'Rooftop HVAC Pressure Test');
});

test('Priority: no conflict — identical value preserved', () => {
  assert.equal(resolved.priority, 'high');
});

test('Location: no conflict — identical value preserved', () => {
  assert.equal(resolved.location, 'One Liberty Plaza, FL 23');
});

console.log();
console.log(bold('  [Block 2] Free-text Notes — Server-Wins + Conflict Append'));

test('Notes: server notes are fully preserved in resolved output', () => {
  assert.ok(
    resolved.notes?.includes('Initial inspection complete.'),
    `Server notes not found in resolved notes: "${resolved.notes}"`
  );
});

test('Notes: client notes are appended with [CONFLICT] flag', () => {
  assert.ok(
    resolved.notes?.includes('[CONFLICT: Client added:'),
    `[CONFLICT] flag not found in resolved notes: "${resolved.notes}"`
  );
});

test('Notes: client notes content is not lost', () => {
  assert.ok(
    resolved.notes?.includes('unusual vibration on compressor unit B'),
    `Client note content was silently dropped: "${resolved.notes}"`
  );
});

console.log();
console.log(bold('  [Block 3] Checklist — Union-Merge / Add-Wins'));

test('Checklist: all 3 original server items are preserved', () => {
  assert.ok(resolved.checklist.includes('Visual inspection'));
  assert.ok(resolved.checklist.includes('Pressure gauge reading'));
  assert.ok(resolved.checklist.includes('Valve check'));
});

test('Checklist: new client item "Compressor vibration check" was merged in', () => {
  assert.ok(resolved.checklist.includes('Compressor vibration check'));
});

test('Checklist: new client item "Coolant level verification" was merged in', () => {
  assert.ok(resolved.checklist.includes('Coolant level verification'));
});

test('Checklist: no duplicate items (union deduplication)', () => {
  const lower = resolved.checklist.map((i) => i.trim().toLowerCase());
  const uniqueCount = new Set(lower).size;
  assert.equal(resolved.checklist.length, uniqueCount,
    `Duplicates found: ${resolved.checklist.join(', ')}`
  );
});

test('Checklist: final list has exactly 5 unique items (3 server + 2 new client)', () => {
  assert.equal(resolved.checklist.length, 5);
});

console.log();
console.log(bold('  [Block 4] Meta — Conflict Report'));

test('Strategy is reported as "merged" (has both server and client wins)', () => {
  assert.equal(strategy, 'merged');
});

test('Conflict log contains at least one entry', () => {
  assert.ok(conflicts.length >= 1);
});

test('Conflict log includes the status LWW entry', () => {
  const statusConflict = conflicts.find((c) => c.field === 'status');
  assert.ok(statusConflict, 'No conflict entry found for field: status');
  assert.equal(statusConflict?.winner, 'client');
});

test('Conflict log includes the notes server-wins entry', () => {
  const notesConflict = conflicts.find((c) => c.field === 'notes');
  assert.ok(notesConflict, 'No conflict entry found for field: notes');
  assert.equal(notesConflict?.winner, 'server');
});

test('Conflict log includes the checklist union-merge entry', () => {
  const checklistConflict = conflicts.find((c) => c.field === 'checklist');
  assert.ok(checklistConflict, 'No conflict entry found for field: checklist');
  assert.equal(checklistConflict?.winner, 'merged');
});

test('Resolved job ID is unchanged', () => {
  assert.equal(resolved.id, 'job-uuid-001');
});

// ─── Summary ──────────────────────────────────────────────────────────────────

console.log();
console.log(dim('  ─────────────────────────────────────────────'));

if (failed === 0) {
  console.log(bold(green(`  ✅  All ${passed} tests passed — Sync Engine is deterministic and correct.`)));
} else {
  console.log(bold(red(`  ❌  ${failed} test(s) failed, ${passed} passed.`)));
  process.exit(1);
}

console.log();

// ─── Resolved State Preview ───────────────────────────────────────────────────
console.log(bold(dim('  Resolved Job State Preview:')));
console.log(dim('  ' + JSON.stringify({ ...resolved, updatedAt: resolved.updatedAt.toISOString() }, null, 2).split('\n').join('\n  ')));
console.log();
