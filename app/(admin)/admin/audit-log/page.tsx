import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { AuditLogTable } from '@/components/admin/AuditLogTable'

export default async function AuditLogPage() {
  await requireRole('admin').catch(() => redirect('/'))

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['admin', 'audit-log', 1],
    queryFn: async () => {
      const page = 1
      const limit = 20
      const offset = (page - 1) * limit

      const { data, error, count } = await adminClient
        .from('audit_logs')
        .select(
          `id, action, target, meta, created_at,
           actor:profiles!actor_id(id, full_name)`,
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) throw new Error(error.message)
      return {
        items: data ?? [],
        total: count ?? 0,
        page,
        limit,
      }
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit Log</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          A record of all admin actions. Newest first.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AuditLogTable />
      </HydrationBoundary>
    </div>
  )
}
