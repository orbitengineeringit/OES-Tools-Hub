import { useEffect, useRef, useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Upload, ImagePlus } from 'lucide-react'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase'
import { ToolCreateSchema, TOOL_CATEGORIES, type ToolCreate, type Tool } from '@/lib/validation/tool'
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

  useEffect(() => {
    setPreviewUrl(currentImageUrl ?? null)
  }, [currentImageUrl])

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller.')
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setIsUploading(true)

    const ext = file.name.split('.').pop()
    const filePath = `tool-${toolId}-${Date.now()}.${ext}`

    try {
      const { error: uploadErr } = await supabase.storage
        .from('tool-images')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) {
        toast.error('Upload failed: ' + uploadErr.message)
        setPreviewUrl(currentImageUrl ?? null)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('tool-images')
        .getPublicUrl(filePath)

      const { error: updateErr } = await supabase
        .from('tools')
        .update({ image_url: publicUrl })
        .eq('id', toolId)

      if (updateErr) {
        toast.error('Failed to update tool image.')
        return
      }

      toast.success('Image updated.')
      onUploaded(publicUrl)
    } finally {
      setIsUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <Label className="text-slate-700 font-semibold text-sm">Tool image</Label>
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Tool image preview"
              className="object-cover h-full w-full"
            />
          ) : (
            <ImagePlus className="h-6 w-6 text-slate-400" />
          )}
        </div>

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
            className="gap-2 border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
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
          <p className="text-xs text-slate-500">JPEG, PNG or WebP · max 5 MB</p>
        </div>
      </div>
    </div>
  )
}

interface ToolFormProps {
  tool?: Tool
  isSubmitting: boolean
  onSubmit: (values: ToolCreate) => Promise<unknown>
  onCancel: () => void
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
      {isEditMode && tool && (
        <ToolImageField
          toolId={tool.id}
          currentImageUrl={tool.image_url}
          onUploaded={onImageUploaded ?? (() => {})}
        />
      )}

      <div className="space-y-1.5">
        <Label htmlFor="tf-title" className="text-slate-700 font-semibold text-sm">Title *</Label>
        <Input
          id="tf-title"
          placeholder="e.g. ChatGPT Enterprise"
          aria-invalid={!!errors.title}
          {...register('title')}
          className="bg-white border-slate-300 text-slate-900"
        />
        {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-url" className="text-slate-700 font-semibold text-sm">URL *</Label>
        <Input
          id="tf-url"
          type="url"
          placeholder="https://..."
          aria-invalid={!!errors.url}
          {...register('url')}
          className="bg-white border-slate-300 text-slate-900"
        />
        {errors.url && <p className="text-xs text-red-500">{errors.url.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-description" className="text-slate-700 font-semibold text-sm">Description</Label>
        <Textarea
          id="tf-description"
          rows={3}
          placeholder="What does this tool do?"
          className="resize-none bg-white border-slate-300 text-slate-900"
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tf-category" className="text-slate-700 font-semibold text-sm">Category</Label>
        <Controller
          name="category"
          control={control}
          render={({ field }) => (
            <Select
              value={field.value ?? ''}
              onValueChange={(val) => field.onChange(val || undefined)}
            >
              <SelectTrigger id="tf-category" className="w-full bg-white border-slate-300 text-slate-900">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
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

      {!isEditMode && (
        <p className="text-xs text-slate-600 bg-slate-50 rounded-md px-3 py-2 border border-slate-200">
          💡 After creating the tool, click the{' '}
          <ImagePlus className="inline h-3.5 w-3.5 mb-0.5" /> icon in the table row to add an image.
        </p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting} className="border-slate-300 text-slate-700">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="text-white font-semibold cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #1DB4D2 0%, #158FAA 100%)' }}
        >
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
