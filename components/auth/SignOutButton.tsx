'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
    } catch {
      // Best-effort signout fetch; navigate to /login regardless
    } finally {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={signingOut}
      className="text-muted-foreground hover:text-foreground"
    >
      {signingOut ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
