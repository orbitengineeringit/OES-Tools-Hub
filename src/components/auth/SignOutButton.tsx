import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export function SignOutButton() {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      console.error('Signout error:', err)
    } finally {
      navigate('/login')
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={signingOut}
      className="text-sm font-medium text-slate-400 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
    >
      {signingOut ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
