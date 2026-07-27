import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Upload, User } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'
import { ProfileUpdateSchema, type ProfileUpdate } from '@/lib/validation/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_BYTES = 5 * 1024 * 1024

export function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(ProfileUpdateSchema),
    values: {
      full_name: profile?.full_name ?? '',
      department: profile?.department ?? '',
      designation: profile?.designation ?? '',
      bio: profile?.bio ?? '',
    },
  })

  async function onSubmit(values: ProfileUpdate) {
    if (!user) return
    setIsLoading(true)
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: values.full_name,
        department: values.department || null,
        designation: values.designation || null,
        bio: values.bio || null,
      })
      .eq('id', user.id)

    setIsLoading(false)

    if (error) {
      toast.error('Failed to save profile: ' + error.message)
      return
    }

    toast.success('Profile saved.')
    await refreshProfile()
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Only JPEG, PNG, and WebP images are allowed.')
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error('File must be 5 MB or smaller.')
      return
    }

    setIsUploading(true)
    const ext = file.name.split('.').pop()
    const filePath = `${user.id}/avatar-${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('profile-photos')
      .upload(filePath, file, { upsert: true })

    if (uploadErr) {
      setIsUploading(false)
      toast.error('Upload failed: ' + uploadErr.message)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(filePath)

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ photo_url: publicUrl })
      .eq('id', user.id)

    setIsUploading(false)

    if (updateErr) {
      toast.error('Failed to save avatar URL.')
      return
    }

    toast.success('Photo updated.')
    await refreshProfile()
  }

  const initials = (profile?.full_name ?? 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100">Profile</h1>
        <p className="text-sm text-slate-400">Manage your account information and preferences.</p>
      </div>

      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle>Profile Photo</CardTitle>
          <CardDescription>Upload a photo for your profile avatar.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-6">
          <Avatar className="h-20 w-20 border-2 border-cyan-500/40">
            <AvatarImage src={profile?.photo_url ?? undefined} alt={profile?.full_name ?? 'User'} />
            <AvatarFallback className="text-xl font-bold bg-slate-800 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 cursor-pointer border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Change photo
                </>
              )}
            </Button>
            <p className="text-xs text-slate-500 mt-2">JPEG, PNG, or WebP up to 5MB.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/80 border-slate-800">
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
          <CardDescription>Update your personal and organization information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name">Full name *</Label>
              <Input
                id="full_name"
                type="text"
                placeholder="Jane Smith"
                aria-invalid={!!errors.full_name}
                {...register('full_name')}
                className="bg-slate-950/60 border-slate-800 text-slate-100"
              />
              {errors.full_name && (
                <p className="text-xs text-red-500">{errors.full_name.message}</p>
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
                  className="bg-slate-950/60 border-slate-800 text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="designation">Designation</Label>
                <Input
                  id="designation"
                  type="text"
                  placeholder="Senior Engineer"
                  {...register('designation')}
                  className="bg-slate-950/60 border-slate-800 text-slate-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                rows={3}
                placeholder="A short bio about yourself"
                className="w-full rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-cyan-500 resize-none"
                {...register('bio')}
              />
              {errors.bio && (
                <p className="text-xs text-red-500">{errors.bio.message}</p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                disabled={isLoading || !isDirty}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold cursor-pointer"
              >
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
        </CardContent>
      </Card>
    </div>
  )
}
