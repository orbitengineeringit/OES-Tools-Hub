import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Upload, UserCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ProfileUpdateSchema, type ProfileUpdate } from '@/lib/validation/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      department: profile?.department ?? '',
      designation: profile?.designation ?? '',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name ?? '',
        department: profile.department ?? '',
        designation: profile.designation ?? '',
      })
    }
  }, [profile, reset])

  async function onSubmit(values: ProfileUpdate) {
    if (!user) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          department: values.department || null,
          designation: values.designation || null,
        })
        .eq('id', user.id)

      if (error) throw new Error(error.message)
      toast.success('Profile updated successfully.')
      await refreshProfile()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile.'
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images are allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller.')
      return
    }

    setIsUploadingPhoto(true)
    const ext = file.name.split('.').pop()
    const filePath = `profile-${user.id}-${Date.now()}.${ext}`

    try {
      const { error: uploadErr } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) throw new Error(uploadErr.message)

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id)

      if (updateErr) throw new Error(updateErr.message)

      toast.success('Profile photo updated.')
      await refreshProfile()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload photo.'
      toast.error(message)
    } finally {
      setIsUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const initials = (profile?.full_name ?? 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{
            background: 'linear-gradient(135deg, #0B3D6E 0%, #1DB4D2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          My Profile
        </h1>
        <p className="text-slate-500 text-sm font-medium">
          Manage your account information and preferences.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Photo section */}
        <div className="flex items-center gap-5 pb-6 border-b border-slate-100">
          <div
            className="relative rounded-full p-[2px] shrink-0"
            style={{
              background: 'linear-gradient(135deg, #1DB4D2 0%, #0B3D6E 100%)',
              boxShadow: '0 0 16px rgba(29,180,210,0.25)',
            }}
          >
            <div className="h-20 w-20 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
              {profile?.photo_url ? (
                <img
                  src={profile.photo_url}
                  alt={profile.full_name ?? 'User'}
                  className="object-cover h-full w-full"
                />
              ) : (
                <span className="text-2xl font-bold text-[#0B3D6E]">
                  {initials}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-slate-900 text-lg">{profile?.full_name ?? 'User Profile'}</h3>
            <p className="text-xs text-slate-500">{user?.email}</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploadingPhoto}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              {isUploadingPhoto ? (
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
          </div>
        </div>

        {/* Form section */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name" className="text-slate-700 font-semibold text-sm">Full Name *</Label>
            <Input
              id="pf-name"
              placeholder="Your full name"
              {...register('full_name')}
              className="bg-white border-slate-200 text-slate-900 focus:border-[#1DB4D2]"
            />
            {errors.full_name && (
              <p className="text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="pf-dept" className="text-slate-700 font-semibold text-sm">Department</Label>
              <Input
                id="pf-dept"
                placeholder="e.g. Engineering"
                {...register('department')}
                className="bg-white border-slate-200 text-slate-900 focus:border-[#1DB4D2]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pf-desig" className="text-slate-700 font-semibold text-sm">Designation</Label>
              <Input
                id="pf-desig"
                placeholder="e.g. Software Engineer"
                {...register('designation')}
                className="bg-white border-slate-200 text-slate-900 focus:border-[#1DB4D2]"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="gap-2 font-semibold text-white cursor-pointer px-6"
              style={{
                background: 'linear-gradient(135deg, #1DB4D2 0%, #158FAA 100%)',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
