import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { DashboardClient } from '@/components/employee/DashboardClient'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) return null

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['tools', 'mine'],
    queryFn: async () => {
      const { data: rows } = await adminClient
        .from('tool_access')
        .select(`
          tool_id,
          tools!inner (
            id,
            title,
            description,
            url,
            image_url,
            category,
            is_active
          )
        `)
        .eq('user_id', session.user.id)
        .eq('tools.is_active', true)
        .order('title', { foreignTable: 'tools', ascending: true })

      return (rows ?? [])
        .flatMap((row) => (Array.isArray(row.tools) ? row.tools : row.tools ? [row.tools] : []))
    },
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardClient />
    </HydrationBoundary>
  )
}
