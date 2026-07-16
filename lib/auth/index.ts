import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// Returns the authenticated user's session + profile, or null if not logged in.
// Wrapped in React.cache() to deduplicate auth & DB lookups across layout + page within a single request.
export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id, role, is_active, full_name, photo_url, department, designation, bio')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return null

  return { user, profile }
})

// Asserts the current user is authenticated and has the required role.
// For Server Components: redirects to /login (no session) or / (wrong role).
// For Route Handlers: use the returned session and check manually — do not call this.
export async function requireRole(role: 'admin' | 'employee') {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.profile.role !== role) redirect('/')
  return session
}
