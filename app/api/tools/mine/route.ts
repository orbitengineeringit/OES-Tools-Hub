import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'

// GET /api/tools/mine — returns only the tools assigned to the current user (employee+)
//
// DESIGN NOTE: We use the admin (service-role) client with an explicit inner join on
// tool_access rather than the anon/session client + RLS. This is intentional:
//
//   tool_access has RLS enabled but NO client-readable SELECT policy — all access
//   management goes through the admin client in Route Handlers. When the anon client
//   tries to query `tools` and the "read assigned tools" RLS policy runs the subquery
//   `EXISTS (SELECT 1 FROM tool_access ...)`, PostgreSQL enforces RLS on that subquery
//   too — so tool_access returns 0 rows, the EXISTS is always false, and the employee
//   sees an empty dashboard. See KNOWN_ISSUES.md and DECISIONS.md ADR-006.
//
//   We already trust the user's identity from getSession() (which uses getUser() —
//   server-validated JWT, not a locally cached session). The admin client then performs
//   the join safely on the server, never exposing the service role key to the client.
export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 },
    )
  }

  // Inner-join tools → tool_access on the current user's ID, pushing filter & sort to Postgres.
  // The admin client bypasses RLS, so tool_access is fully readable in this context.
  const { data: rows, error } = await adminClient
    .from('tool_access')
    .select(`
      tool_id,
      tools!inner (
        id,
        title,
        description,
        url,
        image_url,
        category,
        is_active
      )
    `)
    .eq('user_id', session.user.id)
    .eq('tools.is_active', true)
    .order('title', { foreignTable: 'tools', ascending: true })

  if (error) {
    console.error('[GET /api/tools/mine]', error)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch tools.' } },
      { status: 500 },
    )
  }

  // Supabase infers `row.tools` as an object/array when using nested select syntax.
  const tools = (rows ?? [])
    .flatMap((row) => (Array.isArray(row.tools) ? row.tools : row.tools ? [row.tools] : []))

  return NextResponse.json({ success: true, data: tools })
}
