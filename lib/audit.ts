import { adminClient } from '@/lib/supabase/admin'

interface AuditLogEntry {
  actor_id: string
  action: string          // e.g. 'tool.created', 'tool.updated', 'tool.deleted', 'access.granted'
  target?: string         // human-readable description of what was acted on
  meta?: Record<string, unknown>
}

// Writes a single audit log entry via the admin client.
// Call this in every admin Route Handler after a successful DB mutation, before returning.
// Errors here are logged but intentionally do not fail the parent request —
// audit logging is best-effort so a logging hiccup doesn't break the real operation.
export async function writeAuditLog(entry: AuditLogEntry): Promise<void> {
  const { error } = await adminClient.from('audit_logs').insert({
    actor_id: entry.actor_id,
    action: entry.action,
    target: entry.target ?? null,
    meta: entry.meta ?? null,
  })

  if (error) {
    console.error('[writeAuditLog] failed to write audit entry', { entry, error })
  }
}
