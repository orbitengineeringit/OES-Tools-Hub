import React from 'react'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Wrench, Users, ShieldCheck, FileText } from 'lucide-react'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#1DB4D2] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const navLinks = [
    { href: '/admin/tools', label: 'Tools', icon: Wrench },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/access', label: 'Access', icon: ShieldCheck },
    { href: '/admin/audit-log', label: 'Audit Log', icon: FileText },
  ]

  const initials = (profile?.full_name ?? 'Admin')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-[#fafafa] text-slate-900">
      {/* Admin header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <Link to="/admin/tools" className="flex items-center gap-2.5 shrink-0">
              <img src="/logo.png" alt="Orbit logo" className="w-7 h-7 object-contain" />
              <span className="font-bold text-slate-900 tracking-tight text-base">
                Admin Console
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.href
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-[#0B3D6E] font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-[#1DB4D2]' : 'text-slate-500'}`} />
                    {link.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-slate-600 hover:text-[#1DB4D2] bg-slate-100 px-3 py-1.5 rounded-md transition-colors"
            >
              ← Employee App
            </Link>
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.photo_url ?? undefined} alt={profile?.full_name ?? 'Admin'} />
              <AvatarFallback className="text-xs font-bold text-white bg-[#0B3D6E]">
                {initials}
              </AvatarFallback>
            </Avatar>
            <SignOutButton />
          </div>
        </div>

        {/* Mobile subnav */}
        <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 border-t border-slate-100 gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.href
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium shrink-0 ${
                  isActive ? 'bg-slate-100 text-[#0B3D6E] font-bold' : 'text-slate-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            )
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
