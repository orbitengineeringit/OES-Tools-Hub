import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, User } from 'lucide-react'

export function NavPill() {
  const location = useLocation()

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  return (
    <nav
      className="flex items-center gap-1 p-1 rounded-2xl"
      style={{
        background: 'rgba(29,180,210,0.06)',
        border: '1px solid rgba(29,180,210,0.15)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {links.map((link, i) => {
        const isActive = location.pathname === link.href || (link.href !== '/dashboard' && location.pathname.startsWith(link.href))
        const Icon = link.icon

        return (
          <div key={link.href} className="flex items-center">
            {i > 0 && (
              <div
                className="w-px h-5 shrink-0 mr-1"
                style={{ background: 'rgba(29,180,210,0.2)' }}
              />
            )}

            <Link to={link.href}>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl cursor-pointer transition-all duration-200"
                style={{
                  background: isActive
                    ? 'rgba(29,180,210,0.15)'
                    : 'transparent',
                  boxShadow: isActive
                    ? 'inset 0 1px 0 rgba(255,255,255,0.5), 0 0 8px rgba(29,180,210,0.1)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'rgba(29,180,210,0.10)'
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon
                  className="h-4 w-4 transition-colors duration-200"
                  style={{
                    color: isActive ? '#1DB4D2' : '#0B3D6E',
                    opacity: isActive ? 1 : 0.6,
                  }}
                />
                <span
                  className="hidden sm:inline text-sm transition-colors duration-200"
                  style={{
                    color: isActive ? '#1DB4D2' : '#0B3D6E',
                    opacity: isActive ? 1 : 0.65,
                    fontWeight: isActive ? 700 : 600,
                  }}
                >
                  {link.label}
                </span>
              </div>
            </Link>
          </div>
        )
      })}
    </nav>
  )
}
