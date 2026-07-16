import { AuditLogTable } from '@/components/admin/AuditLogTable'

export default function AuditLogPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          A record of all admin actions. Newest first.
        </p>
      </div>
      <AuditLogTable />
    </div>
  )
}
