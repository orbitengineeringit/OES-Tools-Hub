'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'
import { Loader2, Upload, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

import { ToolCreateSchema, TOOL_CATEGORIES, type ToolCreate } from '@/lib/validation/tool'
import { type Tool } from '@/lib/validation/tool'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// ────────────────────────────────────────────────────────────
// Image upload sub-component — edit mode only
// Calls POST /api/admin/tools/[id]/image, updates local preview,
// then calls onUploaded() so the parent can invalidate the list query.
// ────────────────────────────────────────────────────────────

interface ToolImageFieldProps {
  toolId: string
  currentImageUrl?: string | null
  onUploaded: (newUrl: string) => void
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

function ToolImageField({ toolId, currentImageUrl, onUploaded }: ToolImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl ?? null)

  // Keep preview in sync if the parent passes a new tool (e.g. switching edit targets)
  useEffect(() => {
    setPreviewUrl(currentImageUrl ?? null)
  }, [currentImageUrl])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side pre-check (real validation is server-side)
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller.')
      return
    }

    // Optimistic local preview before upload
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    setIsUploading(true)
    const fd = new FormData()
    fd.append('file', file)

    try {
      const res = await fetch(`/api/admin/tools/${toolId}/image`, { method: 'POST', body: fd })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error?.message ?? 'Upload failed.')
        setPreviewUrl(currentImageUrl ?? null) // revert preview on error
        return
      }
      toast.success('Image updated.')
      onUploaded(json.data.image_url as string)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label>Tool image</Label>
      <div className="flex items-center gap-4">
        {/* Preview box */}
        <div className="h-16 w-16 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt="Tool image preview"
              width={64}
              height={64}
              className="object-cover h-full w-full"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>

        {/* Upload button + hint */}
        <div className="space-y-1">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            aria-label="Upload tool image"
            onChange={handleFile}
            disabled={isUploading}
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
                {previewUrl ? 'Replace image' : 'Upload image'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
// ToolForm
// ────────────────────────────────────────────────────────────

interface ToolFormProps {
  /** When provided, the form operates in edit mode pre-populated with this tool's data. */
  tool?: Tool
  isSubmitting: boolean
  onSubmit: (values: ToolCreate) => Promise<unknown>
  onCancel: () => void
  /** Called after a successful image upload in edit mode — use to invalidate the tools list query. */
  onImageUploaded?: (newUrl: string) => void
}

export function ToolForm({ tool, isSubmitting, onSubmit, onCancel, onImageUploaded }: ToolFormProps) {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ToolCreate>({
    resolver: zodResolver(ToolCreateSchema),
    defaultValues: tool
      ? {
          title: tool.title,
          description: tool.description ?? '',
          url: tool.url,
          category: tool.category as (typeof TOOL_CATEGORIES)[number] | undefined,
          is_active: tool.is_active,
        }
      : { is_active: true },
  })

  // Reset the form whenever a different tool is passed in (switching between edit dialogs)
  useEffect(() => {
    if (tool) {
      reset({
        title: tool.title,
        description: tool.description ?? '',
        url: tool.url,
        category: tool.category as (typeof TOOL_CATEGORIES)[number] | undefined,
        is_active: tool.is_active,
      })
    } else {
      reset({ is_active: true })
    }
  }, [tool, reset])

  const isEditMode = !!tool

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {/* Image upload — edit mode only (tool must exist to have an id for the upload route) */}
      {isEditMode && tool && (
        <ToolImageField
          toolId={tool.id}
          currentImageUrl={tool.image_url}
          onUploaded={onImageUploaded ?? (() => {})}
        />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tf-title">Title *</Label>
        <Input
          id="tf-title"
          placeholder="e.g. ChatGPT Enterprise"
          aria-invalid={!!errors.title}
          {...register('title')}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-url">URL *</Label>
        <Input
          id="tf-url"
          type="url"
          placeholder="https://..."
          aria-invalid={!!errors.url}
          {...register('url')}
        />
        {errors.url && <p className="text-xs text-destructive">{errors.url.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-description">Description</Label>
        <Textarea
          id="tf-description"
          rows={3}
          placeholder="What does this tool do? (max 500 characters)"
          className="resize-none"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-category">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={(val) => field.onChange(val || undefined)}
            >
              <SelectTrigger id="tf-category" className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TOOL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Create mode: let the user know image upload comes after saving */}
      {!isEditMode && (
        <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
          💡 After creating the tool, click the{' '}
          <ImagePlus className="inline h-3.5 w-3.5 mb-0.5" /> icon in the table row to add an image.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : tool ? (
            'Save changes'
          ) : (
            'Add tool'
          )}
        </Button>
      </div>
    </form>
  )
}
