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
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-[#1DB4D2] border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-[#fafafa] relative overflow-x-hidden text-slate-900">
      {/* Aurora blobs — atmospheric depth (Light theme) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        {/* Cyan bloom — top left */}
        <div
          style={{
            position: 'absolute', top: '-20%', left: '-15%',
            width: '700px', height: '700px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,180,210,0.09) 0%, transparent 68%)',
          }}
        />
        {/* Navy bloom — bottom right */}
        <div
          style={{
            position: 'absolute', bottom: '-20%', right: '-15%',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(11,61,110,0.06) 0%, transparent 68%)',
          }}
        />
        {/* Accent cyan — mid right */}
        <div
          style={{
            position: 'absolute', top: '40%', right: '15%',
            width: '350px', height: '350px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(29,180,210,0.05) 0%, transparent 68%)',
          }}
        />
      </div>

      {/* Header — frosted white glass */}
      <header
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderBottom: '1px solid rgba(29,180,210,0.15)',
          boxShadow: '0 1px 0 rgba(29,180,210,0.08), 0 4px 24px -4px rgba(29,180,210,0.06)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'rgba(29,180,210,0.2)', filter: 'blur(6px)', transform: 'scale(1.3)' }}
              />
              <img
                src="/logo.png"
                alt="Orbit logo"
                className="w-8 h-8 object-contain relative z-10"
              />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span
                className="text-sm font-bold tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #0B3D6E 0%, #1DB4D2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                OES
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase">
                Tools Hub
              </span>
            </div>
          </Link>

          {/* Floating pill nav */}
          <NavPill />

          {/* User & Avatar */}
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="text-sm font-medium hidden md:inline truncate max-w-[140px]"
              style={{ color: '#0B3D6E', opacity: 0.7 }}
            >
              {profile?.full_name ?? 'Your Account'}
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
                <AvatarFallback
                  className="text-xs font-bold text-white"
                  style={{ background: '#0B3D6E' }}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div
              className="rounded-full p-[1px]"
              style={{
                background: 'linear-gradient(135deg, rgba(29,180,210,0.3) 0%, rgba(11,61,110,0.15) 100%)',
              }}
            >
              <SignOutButton />
            </div>
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
