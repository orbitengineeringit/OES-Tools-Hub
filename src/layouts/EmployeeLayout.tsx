import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NavPill } from '@/components/employee/NavPill'

interface EmployeeLayoutProps {
  children: React.ReactNode
}

export function EmployeeLayout({ children }: EmployeeLayoutProps) {
  const { user, profile, loading } = useAuth()

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

  const initials = (profile?.full_name ?? 'User')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 relative overflow-x-hidden">
      {/* Aurora blobs */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div
          style={{
            position: 'absolute', top: '-20%', left: '-15%',
            width: '700px', height: '700px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,180,210,0.12) 0%, transparent 68%)',
          }}
        />
        <div
          style={{
            position: 'absolute', bottom: '-20%', right: '-15%',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(11,61,110,0.15) 0%, transparent 68%)',
          }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b border-slate-800/80 bg-slate-950/80"
        style={{
          boxShadow: '0 1px 0 rgba(29,180,210,0.08), 0 4px 24px -4px rgba(0,0,0,0.4)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'rgba(29,180,210,0.3)', filter: 'blur(6px)', transform: 'scale(1.3)' }}
              />
              <img
                src="/logo.png"
                alt="Orbit logo"
                className="w-8 h-8 object-contain relative z-10"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-cyan-400">
                OES
              </span>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider uppercase">
                Tools Hub
              </span>
            </div>
          </Link>

          {/* NavPill */}
          <NavPill />

          {/* User & SignOut */}
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-medium text-slate-300 hidden md:inline truncate max-w-[140px]">
              {profile?.full_name ?? 'Account'}
            </span>

            <div
              className="relative rounded-full p-[2px]"
              style={{
                background: 'linear-gradient(135deg, #1DB4D2 0%, #0B3D6E 100%)',
                boxShadow: '0 0 12px rgba(29,180,210,0.3)',
              }}
            >
              <Avatar className="h-8 w-8 block">
                <AvatarImage src={profile?.photo_url ?? undefined} alt={profile?.full_name ?? 'User'} />
                <AvatarFallback className="text-xs font-bold text-white bg-slate-900">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
