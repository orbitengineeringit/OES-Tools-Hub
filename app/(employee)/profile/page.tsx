import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { ProfileForm } from '@/components/forms/ProfileForm'
import { PhotoUploader } from '@/components/forms/PhotoUploader'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const { profile } = session
  const initials = (profile.full_name ?? 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <p className="text-muted-foreground mt-1">Manage how you appear to the team.</p>
      </div>

      {/* Avatar section */}
      <div className="bg-white rounded-xl border border-border p-6 space-y-4">
        <h2 className="text-base font-semibold">Profile photo</h2>
        <div className="flex items-center gap-5">
          <Avatar className="h-20 w-20 text-lg">
            <AvatarImage src={profile.photo_url ?? undefined} alt={profile.full_name ?? 'User'} />
            <AvatarFallback className="font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="space-y-1">
            <PhotoUploader />
            <p className="text-xs text-muted-foreground">JPEG, PNG or WebP · max 5 MB</p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Profile fields */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-base font-semibold mb-5">Personal details</h2>
        <ProfileForm
          defaultValues={{
            full_name: profile.full_name ?? '',
            department: profile.department ?? '',
            designation: profile.designation ?? '',
            bio: profile.bio ?? '',
          }}
        />
      </div>
    </div>
  )
}
