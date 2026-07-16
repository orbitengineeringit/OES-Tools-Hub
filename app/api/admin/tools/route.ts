import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { ToolCreateSchema } from '@/lib/validation/tool'
import { writeAuditLog } from '@/lib/audit'

// GET /api/admin/tools — list all tools (admin only)
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

  const { data: tools, error } = await adminClient
    .from('tools')
    .select('id, title, description, url, image_url, category, is_active, created_by, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[GET /api/admin/tools]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch tools.' } },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data: tools })
}

// POST /api/admin/tools — create a new tool (admin only)
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

  const parsed = ToolCreateSchema.safeParse(body)
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

  const { data: tool, error } = await adminClient
    .from('tools')
    .insert({ ...parsed.data, created_by: session.user.id })
    .select('id, title, description, url, image_url, category, is_active, created_by, created_at')
    .single()

  if (error || !tool) {
    console.error('[POST /api/admin/tools]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to create tool.' } },
      { status: 500 },
    )
  }

  writeAuditLog({
    actor_id: session.user.id,
    action: 'tool.created',
    target: tool.title,
    meta: { tool_id: tool.id },
  }).catch((err) => console.error('[audit log error]', err))

  return NextResponse.json({ success: true, data: tool }, { status: 201 })
}
