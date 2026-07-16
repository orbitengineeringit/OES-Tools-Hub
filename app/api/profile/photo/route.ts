import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { adminClient } from '@/lib/supabase/admin'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

// POST /api/profile/photo — upload or replace the current user's profile photo
export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated.' } },
      { status: 401 },
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

  // Server-side MIME validation — HTML accept attribute is trivially bypassed
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
      { success: false, error: { code: 'VALIDATION_ERROR', message: 'File must be 5MB or smaller.' } },
      { status: 400 },
    )
  }

  const userId = session.user.id
  const ext = file.type.split('/')[1]
  // Store at {user_id}/avatar.{ext} — overwrites previous photo for this user
  const storagePath = `${userId}/avatar.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const { error: uploadError } = await adminClient.storage
    .from('profile-photos')
    .upload(storagePath, arrayBuffer, {
      contentType: file.type,
      upsert: true, // overwrite if it already exists
    })

  if (uploadError) {
    console.error('[POST /api/profile/photo] storage upload error', uploadError)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload photo.' } },
      { status: 500 },
    )
  }

  // Build the public URL and persist it to the profile row
  const { data: publicUrlData } = adminClient.storage
    .from('profile-photos')
    .getPublicUrl(storagePath)

  const photoUrl = publicUrlData.publicUrl

  const { error: updateError } = await adminClient
    .from('profiles')
    .update({ photo_url: photoUrl })
    .eq('id', userId)

  if (updateError) {
    console.error('[POST /api/profile/photo] profile update error', updateError)
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Photo uploaded but profile update failed.' } },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, data: { photo_url: photoUrl } })
}
