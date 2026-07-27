import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { AccessPanel } from '@/components/admin/AccessPanel'

export default async function AdminAccessPage() {
  await requireRole('admin').catch(() => redirect('/'))

  const queryClient = new QueryClient()

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: ['admin', 'employees'],
      queryFn: async () => {
        const { data, error } = await adminClient
          .from('profiles')
          .select('id, full_name, photo_url, department, designation, role, is_active, created_at')
          .order('full_name', { ascending: true })

        if (error) throw new Error(error.message)
        return data ?? []
      },
    }),
    queryClient.prefetchQuery({
      queryKey: ['admin', 'tools'],
      queryFn: async () => {
        const { data, error } = await adminClient
          .from('tools')
          .select('id, title, description, url, image_url, category, is_active, created_by, created_at')
          .order('created_at', { ascending: false })

        if (error) throw new Error(error.message)
        return data ?? []
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Access Control</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Grant or revoke tool access per employee. Changes take effect immediately.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <AccessPanel />
      </HydrationBoundary>
    </div>
  )
}
