import { AccessPanel } from '@/components/admin/AccessPanel'

export default function AdminAccessPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Access Control</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Grant or revoke tool access per employee. Changes take effect immediately.
        </p>
      </div>
      <AccessPanel />
    </div>
  )
}
