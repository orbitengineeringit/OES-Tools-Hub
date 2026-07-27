import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { isEmailAllowed } from '@/lib/email-whitelist'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    async function handleAuthCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error || !session) {
          navigate('/login?error=oauth', { replace: true })
          return
        }

        const email = session.user.email || ''
        if (!isEmailAllowed(email)) {
          await supabase.auth.signOut()
          navigate('/login?error=unauthorized', { replace: true })
          return
        }

        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('Callback error:', err)
        navigate('/login?error=oauth', { replace: true })
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-100">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin h-8 w-8 border-4 border-cyan-500 border-t-transparent rounded-full" />
        <p className="text-sm font-medium text-slate-400">Authenticating with Google…</p>
      </div>
    </div>
  )
}
