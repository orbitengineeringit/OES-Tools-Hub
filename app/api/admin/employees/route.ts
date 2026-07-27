import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/admin/employees — list all employee profiles (admin only)
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 },
    )
  }
  if (session.profile.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Admin access required.' } },
      { status: 403 },
    )
  }

  const { data: employees, error } = await adminClient
    .from('profiles')
    .select('id, full_name, photo_url, department, designation, role, is_active, created_at')
    .order('full_name', { ascending: true })

  if (error) {
    console.error('[GET /api/admin/employees]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch employees.' } },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { success: true, data: employees ?? [] },
    { headers: { 'Cache-Control': 'private, max-age=30, stale-while-revalidate=60' } }
  )
}
