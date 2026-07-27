import React from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Wrench, Users, ShieldCheck, ScrollText } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const initials = (profile?.full_name ?? 'Admin')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const navItems = [
    { href: '/admin/tools', label: 'Tools', icon: Wrench },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/access', label: 'Access', icon: ShieldCheck },
    { href: '/admin/audit-log', label: 'Audit Log', icon: ScrollText },
  ]

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100">
      {/* Top nav */}
      <header className="bg-slate-950/90 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Link to="/admin/tools" className="flex items-center gap-2 font-semibold text-slate-100">
              <img
                src="/logo.png"
                alt="Orbit logo"
                className="w-7 h-7 object-contain"
              />
              <span className="hidden sm:inline text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400">
                OES Tools Hub
              </span>
            </Link>
            <Separator orientation="vertical" className="h-5 bg-slate-800" />
            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs bg-cyan-500/20 text-cyan-400 font-semibold px-2.5 py-0.5 rounded-full border border-cyan-500/30">
              Admin
            </span>
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.photo_url ?? undefined} alt={profile?.full_name ?? 'Admin'} />
              <AvatarFallback className="text-xs font-bold text-white bg-slate-800">{initials}</AvatarFallback>
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
