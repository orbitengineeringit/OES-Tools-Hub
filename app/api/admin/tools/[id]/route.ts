import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { ToolUpdateSchema } from '@/lib/validation/tool'
import { writeAuditLog } from '@/lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

// PATCH /api/admin/tools/[id] — update a tool (admin only)
export async function PATCH(request: NextRequest, { params }: RouteContext) {
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

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON body.' } },
      { status: 400 },
    )
  }

  const parsed = ToolUpdateSchema.safeParse(body)
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
    .update(parsed.data)
    .eq('id', id)
    .select('id, title, description, url, image_url, category, is_active, created_by, created_at')
    .single()

  if (error || !tool) {
    if (error?.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tool not found.' } },
        { status: 404 },
      )
    }
    console.error('[PATCH /api/admin/tools/[id]]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update tool.' } },
      { status: 500 },
    )
  }

  writeAuditLog({
    actor_id: session.user.id,
    action: 'tool.updated',
    target: tool.title,
    meta: { tool_id: tool.id, changes: parsed.data },
  }).catch((err) => console.error('[audit log error]', err))

  return NextResponse.json({ success: true, data: tool })
}

// DELETE /api/admin/tools/[id] — delete a tool (admin only)
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
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

  const { id } = await params

  // Atomic single-query delete returning the deleted tool title for audit logging
  const { data: deleted, error } = await adminClient
    .from('tools')
    .delete()
    .eq('id', id)
    .select('id, title')
    .single()

  if (error || !deleted) {
    if (error?.code === 'PGRST116') {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Tool not found.' } },
        { status: 404 },
      )
    }
    console.error('[DELETE /api/admin/tools/[id]]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete tool.' } },
      { status: 500 },
    )
  }

  writeAuditLog({
    actor_id: session.user.id,
    action: 'tool.deleted',
    target: deleted.title,
    meta: { tool_id: deleted.id },
  }).catch((err) => console.error('[audit log error]', err))

  return NextResponse.json({ success: true, data: null })
}
