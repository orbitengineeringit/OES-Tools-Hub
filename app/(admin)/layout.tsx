import Link from 'next/link'
import Image from 'next/image'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Wrench, Users, ShieldCheck, ScrollText } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // requireRole redirects to /login (no session) or / (wrong role) — never returns for non-admins
  const session = await requireRole('admin').catch(() => redirect('/'))
  const { profile } = session

  const initials = (profile.full_name ?? 'A')
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
          <div className="flex items-center gap-5">
            <Link href="/admin/tools" className="flex items-center gap-2 font-semibold text-foreground">
              <Image
                src="/logo.png"
                alt="Orbit logo"
                width={28}
                height={28}
                className="object-contain"
                priority
              />
              <span className="hidden sm:inline text-sm">OES Tools Hub</span>
            </Link>
            <Separator orientation="vertical" className="h-5" />
            <nav className="flex items-center gap-0.5">
              <Link href="/admin/tools" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-muted-foreground hover:text-foreground' })}>
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Tools</span>
              </Link>
              <Link href="/admin/employees" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-muted-foreground hover:text-foreground' })}>
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Employees</span>
              </Link>
              <Link href="/admin/access" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-muted-foreground hover:text-foreground' })}>
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Access</span>
              </Link>
              <Link href="/admin/audit-log" className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'gap-1.5 text-muted-foreground hover:text-foreground' })}>
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Audit Log</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
              Admin
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile.photo_url ?? undefined} alt={profile.full_name ?? 'Admin'} />
              <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
            </Avatar>
            <SignOutButton />
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
