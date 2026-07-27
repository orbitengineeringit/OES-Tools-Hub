import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

// POST /api/auth/ensure-profile
// Called immediately after a successful login.
// Creates a profile row for new users if one doesn't already exist.
// Idempotent — safe to call on every login.
//
// IMPORTANT: This route MUST NOT use getSession() for auth.
// getSession() returns null when no profile row exists yet, which is
// exactly the state this route is designed to fix. A brand-new user would
// always get 401 on their first login. Instead, authenticate by calling
// supabase.auth.getUser() directly — that only requires a valid JWT,
// not an existing profile row.
export async function POST() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 },
    )
  }

  const userId = user.id
  const email = user.email ?? ''

  // Auto-create the profile row (role defaults to 'employee' per DATABASE.md)
  // Handles duplicate key error (23505) gracefully if the profile already exists.
  const { error } = await adminClient.from('profiles').insert({
    id: userId,
    full_name: email.split('@')[0], // sensible default until the user fills in their name
    role: 'employee',
    is_active: true,
  })

  if (error) {
    // If the profile already exists or a concurrent request created it, that's fine — ignore the conflict
    if (error.code === '23505') {
      return NextResponse.json({ success: true, data: { created: false } })
    }
    console.error('[POST /api/auth/ensure-profile]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to initialize profile.' } },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data: { created: true } })
}
