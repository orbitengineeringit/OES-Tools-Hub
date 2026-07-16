import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/audit'

type RouteContext = { params: Promise<{ id: string }> }

// DELETE /api/admin/access/[id] — revoke a tool grant (admin only)
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

  // Read the grant before deletion to build the audit log target string
  const { data: existing } = await adminClient
    .from('tool_access')
    .select(`
      id,
      tool:tools!tool_id(title),
      employee:profiles!user_id(full_name)
    `)
    .eq('id', id)
    .single()

  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Access grant not found.' } },
      { status: 404 },
    )
  }

  const { error } = await adminClient.from('tool_access').delete().eq('id', id)

  if (error) {
    console.error('[DELETE /api/admin/access/[id]]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to revoke access.' } },
      { status: 500 },
    )
  }

  // Build human-readable target from joined data
  const toolTitle = Array.isArray(existing.tool)
    ? (existing.tool[0]?.title ?? 'Unknown Tool')
    : ((existing.tool as { title: string } | null)?.title ?? 'Unknown Tool')
  const empName = Array.isArray(existing.employee)
    ? (existing.employee[0]?.full_name ?? id)
    : ((existing.employee as { full_name: string | null } | null)?.full_name ?? id)

  await writeAuditLog({
    actor_id: session.user.id,
    action: 'access.revoked',
    target: `${empName} → ${toolTitle}`,
    meta: { grant_id: id },
  })

  return NextResponse.json({ success: true, data: null })
}
