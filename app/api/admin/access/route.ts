import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { AccessGrantSchema } from '@/lib/validation/access'
import { writeAuditLog } from '@/lib/audit'

// GET /api/admin/access?user_id=UUID — list all grants for a given employee (admin only)
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

  const userId = new URL(request.url).searchParams.get('user_id')
  if (!userId) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'user_id query param is required.' } },
      { status: 400 },
    )
  }

  const { data: grants, error } = await adminClient
    .from('tool_access')
    .select('id, tool_id, user_id, granted_by, granted_at')
    .eq('user_id', userId)

  if (error) {
    console.error('[GET /api/admin/access]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch access grants.' } },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { success: true, data: grants ?? [] },
    { headers: { 'Cache-Control': 'private, max-age=15, stale-while-revalidate=30' } }
  )
}


export async function POST(request: NextRequest) {
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

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body.' } },
      { status: 400 },
    )
  }

  const parsed = AccessGrantSchema.safeParse(body)
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

  const { tool_id, user_id } = parsed.data

  // Resolve tool and employee names for the audit log target string
  const [{ data: tool }, { data: employee }] = await Promise.all([
    adminClient.from('tools').select('title').eq('id', tool_id).single(),
    adminClient.from('profiles').select('full_name').eq('id', user_id).single(),
  ])

  if (!tool) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Tool not found.' } },
      { status: 404 },
    )
  }
  if (!employee) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Employee not found.' } },
      { status: 404 },
    )
  }

  const { data: grant, error } = await adminClient
    .from('tool_access')
    .insert({ tool_id, user_id, granted_by: session.user.id })
    .select('id, tool_id, user_id, granted_by, granted_at')
    .single()

  if (error) {
    // Postgres unique violation code = 23505 — already granted
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, error: { code: 'CONFLICT', message: 'This tool is already granted to this employee.' } },
        { status: 409 },
      )
    }
    console.error('[POST /api/admin/access]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to grant access.' } },
      { status: 500 },
    )
  }

  writeAuditLog({
    actor_id: session.user.id,
    action: 'access.granted',
    target: `${employee.full_name ?? user_id} → ${tool.title}`,
    meta: { grant_id: grant.id, tool_id, user_id },
  }).catch((err) => console.error('[audit log error]', err))

  return NextResponse.json({ success: true, data: grant }, { status: 201 })
}
