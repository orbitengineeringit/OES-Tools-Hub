import { NextResponse } from 'next/server'

// PATCH /api/admin/employees/[id] — Phase 2
export async function PATCH() {
  return NextResponse.json({ success: false, error: { code: 'NOT_IMPLEMENTED', message: 'Phase 2' } }, { status: 501 })
}
