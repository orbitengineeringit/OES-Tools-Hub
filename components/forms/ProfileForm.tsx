'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { ProfileUpdateSchema, type ProfileUpdate } from '@/lib/validation/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  defaultValues: ProfileUpdate
}

export function ProfileForm({ defaultValues }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues,
  })

  async function onSubmit(values: ProfileUpdate) {
    setIsLoading(true)
    const res = await fetch('/api/profile/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    const json = await res.json()
    setIsLoading(false)

    if (!json.success) {
      toast.error(json.error?.message ?? 'Failed to save profile.')
      return
    }

    toast.success('Profile saved.')
    router.refresh() // re-run the server component to reflect changes in layout
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Full name *</Label>
        <Input
          id="full_name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          aria-invalid={!!errors.full_name}
          {...register('full_name')}
        />
        {errors.full_name && (
          <p className="text-xs text-destructive">{errors.full_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            type="text"
            placeholder="Engineering"
            {...register('department')}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="designation">Designation</Label>
          <Input
            id="designation"
            type="text"
            placeholder="Senior Engineer"
            {...register('designation')}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <textarea
          id="bio"
          rows={3}
          placeholder="A short bio about yourself (max 500 characters)"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
          aria-invalid={!!errors.bio}
          {...register('bio')}
        />
        {errors.bio && (
          <p className="text-xs text-destructive">{errors.bio.message}</p>
        )}
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isLoading || !isDirty}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            'Save changes'
          )}
        </Button>
      </div>
    </form>
  )
}
