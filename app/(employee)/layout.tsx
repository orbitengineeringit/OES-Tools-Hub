import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { LayoutGrid, User } from 'lucide-react'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
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
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top nav */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
              <Image
                src="/logo.png"
                alt="Orbit logo"
                width={28}
                height={28}
                className="object-contain"
              />
              <span className="hidden sm:inline text-sm">Orbit AI Tools Hub</span>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <nav className="flex items-center gap-1">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Button>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline truncate max-w-[160px]">
              {profile.full_name ?? 'Your Account'}
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.photo_url ?? undefined} alt={profile.full_name ?? 'User'} />
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            <form action="/api/auth/signout" method="POST">
              <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-foreground">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
