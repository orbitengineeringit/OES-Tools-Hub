'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024 // 5MB

export function PhotoUploader() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side pre-check (UX only — real validation is server-side)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('File must be 5 MB or smaller.')
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch('/api/profile/photo', {
      method: 'POST',
      body: formData,
    })
    const json = await res.json()
    setIsUploading(false)

    // Reset the file input so the same file can be re-selected after an error
    if (inputRef.current) inputRef.current.value = ''

    if (!json.success) {
      toast.error(json.error?.message ?? 'Upload failed. Please try again.')
      return
    }

    toast.success('Photo updated.')
    router.refresh() // reload server component to show new avatar
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        aria-label="Upload profile photo"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isUploading}
        onClick={() => inputRef.current?.click()}
        className="gap-2"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Uploading…
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5" />
            Change photo
          </>
        )}
      </Button>
    </>
  )
}
