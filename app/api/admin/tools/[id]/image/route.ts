import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/audit'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

type RouteContext = { params: Promise<{ id: string }> }

// POST /api/admin/tools/[id]/image — upload/replace a tool's card image (admin only)
export async function POST(request: NextRequest, { params }: RouteContext) {
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

  // Confirm tool exists
  const { data: tool } = await adminClient.from('tools').select('id, title').eq('id', id).single()
  if (!tool) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Tool not found.' } },
      { status: 404 },
    )
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid multipart form data.' } },
      { status: 400 },
    )
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'A file field named "file" is required.' } },
      { status: 400 },
    )
  }

  // Server-side MIME validation
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Only JPEG, PNG, and WebP images are allowed.' },
      },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File must be 5 MB or smaller.' } },
      { status: 400 },
    )
  }

  const ext = file.type.split('/')[1]
  const storagePath = `${id}/cover.${ext}`
  const arrayBuffer = await file.arrayBuffer()

  const { error: uploadError } = await adminClient.storage
    .from('tool-images')
    .upload(storagePath, arrayBuffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    console.error('[POST /api/admin/tools/[id]/image] storage error', uploadError)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload image.' } },
      { status: 500 },
    )
  }

  const { data: publicUrlData } = adminClient.storage
    .from('tool-images')
    .getPublicUrl(storagePath)

  const imageUrl = publicUrlData.publicUrl

  const { error: updateError } = await adminClient
    .from('tools')
    .update({ image_url: imageUrl })
    .eq('id', id)

  if (updateError) {
    console.error('[POST /api/admin/tools/[id]/image] profile update error', updateError)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Image uploaded but tool update failed.' } },
      { status: 500 },
    )
  }

  await writeAuditLog({
    actor_id: session.user.id,
    action: 'tool.updated',
    target: tool.title,
    meta: { tool_id: id, field: 'image_url' },
  })

  return NextResponse.json({ success: true, data: { image_url: imageUrl } })
}
