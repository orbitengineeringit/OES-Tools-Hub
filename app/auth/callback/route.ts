import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { isEmailAllowed } from '@/lib/auth/email-whitelist'

// GET /auth/callback
// Supabase redirects here after a successful Google OAuth consent flow.
// Exchanges the authorization code for a session, ensures a profile row
// exists for the user, then redirects to the dashboard (or a custom `next` URL).
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('[GET /auth/callback] Code exchange failed:', exchangeError.message)
    return NextResponse.redirect(`${origin}/login?error=oauth`)
  }

  // ------------------------------------------------------------------
  // Ensure a profile row exists (mirrors /api/auth/ensure-profile logic)
  // ------------------------------------------------------------------
  const { data: { user }, error: userError } = await supabase.auth.getUser()

  if (!userError && user) {
    const email = user.email || ''
    if (!isEmailAllowed(email)) {
      console.warn(`[GET /auth/callback] Unauthorized access attempt blocked for email: ${email}`)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${origin}/login?error=unauthorized`)
    }

    const { data: existing } = await adminClient
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!existing) {
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        ''

      const { error: insertError } = await adminClient.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        role: 'employee',
        is_active: true,
      })

      if (insertError && insertError.code !== '23505') {
        // Log but don't block the redirect — the user is authenticated.
        // The ensure-profile endpoint can fix the profile on the next page load.
        console.error('[GET /auth/callback] Profile creation failed:', insertError.message)
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`)
}
