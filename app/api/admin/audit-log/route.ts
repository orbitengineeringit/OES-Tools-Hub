import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

// GET /api/admin/audit-log?page=1&limit=20 — paginated audit log (admin only)
export async function GET(request: NextRequest) {
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

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10)))
  const offset = (page - 1) * limit

  const { data: items, error, count } = await adminClient
    .from('audit_logs')
    .select(
      `id, action, target, meta, created_at,
       actor:profiles!actor_id(id, full_name)`,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[GET /api/admin/audit-log]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch audit log.' } },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      items: items ?? [],
      total: count ?? 0,
      page,
      limit,
    },
  })
}
