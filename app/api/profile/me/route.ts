import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { ProfileUpdateSchema } from '@/lib/validation/profile'

// GET /api/profile/me — returns the authenticated user's own profile
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 },
    )
  }

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('id, full_name, photo_url, department, designation, bio, role, is_active, created_at')
    .eq('id', session.user.id)
    .single()

  if (error || !profile) {
    console.error('[GET /api/profile/me]', error)
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found.' } },
      { status: 404 },
    )
  }

  return NextResponse.json({ success: true, data: profile })
}

// PATCH /api/profile/me — update own profile fields (name, department, designation, bio)
export async function PATCH(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body.' } },
      { status: 400 },
    )
  }

  const parsed = ProfileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: parsed.error.issues.map((i) => i.message).join(', '),
        },
      },
      { status: 400 },
    )
  }

  const { error } = await adminClient
    .from('profiles')
    .update(parsed.data)
    .eq('id', session.user.id)

  if (error) {
    console.error('[PATCH /api/profile/me]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update profile.' } },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data: null })
}
