/**
 * Atlas Conflict-Aware Sync Engine
 *
 * Implements a deterministic, field-level conflict resolution strategy
 * for merging a server job state with a client job state that diverged
 * while the technician's device was offline.
 *
 * Merge Semantics by field type:
 * ─────────────────────────────────────────────────────────────────────
 * 1. Structured Fields (status, title, priority, location):
 *    → Last-Write-Wins (LWW) based on `updatedAt` timestamp.
 *      The version with the more recent timestamp wins for each field.
 *
 * 2. Free-text Notes:
 *    → Server-Wins. If the client has divergent notes, they are safely
 *      preserved by appending with a [CONFLICT] flag rather than dropped.
 *
 * 3. Checklists (string arrays):
 *    → Union-Merge / Add-Wins. Items from both sides are combined.
 *      Duplicate items (case-insensitive) are de-duplicated.
 *      No item is ever deleted by a merge — deletions require explicit intent.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobState {
  id: string;
  title: string;
  status: string;
  priority: string;
  location: string;
  notes: string | null;
  checklist: string[];
  updatedAt: Date;
}

export interface ConflictResolutionResult {
  resolved: JobState;
  conflicts: ConflictDetail[];
  strategy: 'no_conflict' | 'client_wins' | 'server_wins' | 'merged';
}

export interface ConflictDetail {
  field: string;
  serverValue: unknown;
  clientValue: unknown;
  resolution: string;
  winner: 'server' | 'client' | 'merged';
}

// ─── LWW: Structured Field Resolver ──────────────────────────────────────────

function resolveStructuredField<T>(
  field: string,
  serverValue: T,
  clientValue: T,
  serverUpdatedAt: Date,
  clientUpdatedAt: Date,
  conflicts: ConflictDetail[]
): T {
  // If values are identical, no conflict — return either
  if (JSON.stringify(serverValue) === JSON.stringify(clientValue)) {
    return serverValue;
  }

  const clientIsNewer = clientUpdatedAt > serverUpdatedAt;
  const winner = clientIsNewer ? 'client' : 'server';
  const winningValue = clientIsNewer ? clientValue : serverValue;

  conflicts.push({
    field,
    serverValue,
    clientValue,
    resolution: `LWW: ${winner} wins (server: ${serverUpdatedAt.toISOString()}, client: ${clientUpdatedAt.toISOString()})`,
    winner,
  });

  return winningValue;
}

// ─── Notes: Server-Wins + Conflict Append ────────────────────────────────────

function resolveNotes(
  serverNotes: string | null,
  clientNotes: string | null,
  conflicts: ConflictDetail[]
): string | null {
  // No divergence — no conflict
  if (serverNotes === clientNotes) return serverNotes;

  // Client had no notes — server wins by default
  if (!clientNotes) return serverNotes;

  // Server had no notes — client data is preserved directly
  if (!serverNotes) {
    conflicts.push({
      field: 'notes',
      serverValue: serverNotes,
      clientValue: clientNotes,
      resolution: 'Server was empty — client notes accepted',
      winner: 'client',
    });
    return clientNotes;
  }

  // Both have divergent notes — Server-Wins, but client notes appended with flag
  const mergedNotes = `${serverNotes}\n\n[CONFLICT: Client added: ${clientNotes}]`;

  conflicts.push({
    field: 'notes',
    serverValue: serverNotes,
    clientValue: clientNotes,
    resolution: 'Server-Wins: client notes appended with [CONFLICT] flag',
    winner: 'server',
  });

  return mergedNotes;
}

// ─── Checklist: Union-Merge / Add-Wins ───────────────────────────────────────

function resolveChecklist(
  serverItems: string[],
  clientItems: string[],
  conflicts: ConflictDetail[]
): string[] {
  const serverSet = new Set(serverItems.map((i) => i.trim().toLowerCase()));
  const addedByClient: string[] = [];

  // Find items the client added that the server doesn't have
  const unionItems = [...serverItems];
  for (const item of clientItems) {
    if (!serverSet.has(item.trim().toLowerCase())) {
      unionItems.push(item);
      addedByClient.push(item);
    }
  }

  if (addedByClient.length > 0) {
    conflicts.push({
      field: 'checklist',
      serverValue: serverItems,
      clientValue: clientItems,
      resolution: `Union-Merge: ${addedByClient.length} client item(s) added — [${addedByClient.join(', ')}]`,
      winner: 'merged',
    });
  }

  return unionItems;
}

// ─── Main Resolver ────────────────────────────────────────────────────────────

export function resolveJobConflict(
  serverJob: JobState,
  clientJob: JobState
): ConflictResolutionResult {
  const conflicts: ConflictDetail[] = [];

  // If timestamps are identical, there is no real conflict
  if (serverJob.updatedAt.getTime() === clientJob.updatedAt.getTime()) {
    return {
      resolved: { ...serverJob },
      conflicts: [],
      strategy: 'no_conflict',
    };
  }

  // ── 1. LWW: Structured fields ──────────────────────────────────────────────
  const resolvedStatus = resolveStructuredField(
    'status',
    serverJob.status,
    clientJob.status,
    serverJob.updatedAt,
    clientJob.updatedAt,
    conflicts
  );

  const resolvedTitle = resolveStructuredField(
    'title',
    serverJob.title,
    clientJob.title,
    serverJob.updatedAt,
    clientJob.updatedAt,
    conflicts
  );

  const resolvedPriority = resolveStructuredField(
    'priority',
    serverJob.priority,
    clientJob.priority,
    serverJob.updatedAt,
    clientJob.updatedAt,
    conflicts
  );

  const resolvedLocation = resolveStructuredField(
    'location',
    serverJob.location,
    clientJob.location,
    serverJob.updatedAt,
    clientJob.updatedAt,
    conflicts
  );

  // ── 2. Notes: Server-Wins + safe append ────────────────────────────────────
  const resolvedNotes = resolveNotes(
    serverJob.notes,
    clientJob.notes,
    conflicts
  );

  // ── 3. Checklist: Union-Merge (Add-Wins) ───────────────────────────────────
  const resolvedChecklist = resolveChecklist(
    serverJob.checklist,
    clientJob.checklist,
    conflicts
  );

  // ── Determine overall strategy ─────────────────────────────────────────────
  let strategy: ConflictResolutionResult['strategy'] = 'no_conflict';
  if (conflicts.length > 0) {
    const hasClientWins = conflicts.some((c) => c.winner === 'client');
    const hasServerWins = conflicts.some((c) => c.winner === 'server');
    const hasMerged = conflicts.some((c) => c.winner === 'merged');

    if (hasMerged || (hasClientWins && hasServerWins)) {
      strategy = 'merged';
    } else if (hasClientWins) {
      strategy = 'client_wins';
    } else {
      strategy = 'server_wins';
    }
  }

  return {
    resolved: {
      id: serverJob.id,
      title: resolvedTitle,
      status: resolvedStatus,
      priority: resolvedPriority,
      location: resolvedLocation,
      notes: resolvedNotes,
      checklist: resolvedChecklist,
      // The resolved state's timestamp is "now" — it supersedes both versions
      updatedAt: new Date(),
    },
    conflicts,
    strategy,
  };
}
