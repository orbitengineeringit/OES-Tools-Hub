import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { EmployeeTable } from '@/components/admin/EmployeeTable'

export default async function AdminEmployeesPage() {
  await requireRole('admin').catch(() => redirect('/'))

  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['admin', 'employees'],
    queryFn: async () => {
      const { data, error } = await adminClient
        .from('profiles')
        .select('id, full_name, photo_url, department, designation, role, is_active, created_at')
        .order('full_name', { ascending: true })

      if (error) throw new Error(error.message)
      return data ?? []
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Employees</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          All employee accounts registered in the system.
        </p>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <EmployeeTable />
      </HydrationBoundary>
    </div>
  )
}
