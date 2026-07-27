'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { GoogleIcon } from '@/components/icons/GoogleIcon'

const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginValues = z.infer<typeof LoginSchema>

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(LoginSchema) })

  // Hydrate saved email from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('orbit_remember_email')
    if (saved) {
      setValue('email', saved)
      setRememberMe(true)
    }
  }, [setValue])

  // Show error toast if redirected back from failed OAuth/unauthorized domain
  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'oauth') {
      toast.error('Google sign-in failed. Please try again.')
    } else if (error === 'unauthorized') {
      toast.error('This email is not authorized to access OES Tools Hub.')
    }
  }, [searchParams])

  async function onSubmit(values: LoginValues) {
    setIsLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    })

    // Persist or clear email based on remember-me preference
    if (rememberMe) {
      localStorage.setItem('orbit_remember_email', values.email)
    } else {
      localStorage.removeItem('orbit_remember_email')
    }
    setIsLoading(false)

    if (error) {
      toast.error(
        error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : 'Sign-in failed. Please try again.',
      )
      return
    }

    // Ensure profile row exists after login (auto-create if missing)
    await fetch('/api/auth/ensure-profile', { method: 'POST' })

    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogleSignIn() {
    setIsGoogleLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setIsGoogleLoading(false)
      toast.error('Could not connect to Google. Please try again.')
    }
    // If successful, the browser will redirect to Google — no need to setIsGoogleLoading(false)
  }

  return (
    <div className="w-full space-y-8">
      {/* ── Brand header — large Orbit logo + tagline ─────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Orbit logo" width={52} height={52} className="object-contain" />
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight" style={{ color: '#1A73E8' }}>
              ORBIT
            </h2>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground -mt-0.5">
              AI Tools Hub
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground font-medium italic">
          One Platform. All Solutions.
        </p>
      </div>

      {/* ── Google Sign In ─────────────────────────────────────────────── */}
      <div className="space-y-5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isLoading}
          className="w-full h-12 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700 flex items-center justify-center gap-3 transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Sign in with Google
        </button>

        {/* ── OR divider ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
      </div>

      {/* ── Form ──────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Email — underline-style input matching reference */}
        <div className="space-y-1">
          <label htmlFor="login-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Email
          </label>
          <div className="relative">
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              aria-invalid={!!errors.email}
              {...register('email')}
              className="w-full h-10 bg-transparent border-b-2 border-gray-300 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[#1A73E8] transition-colors pr-10"
            />
            <Mail className="absolute right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/30" />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password — underline-style input */}
        <div className="space-y-1">
          <label htmlFor="login-password" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Password
          </label>
          <div className="relative">
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••"
              aria-invalid={!!errors.password}
              {...register('password')}
              className="w-full h-10 bg-transparent border-b-2 border-gray-300 text-sm text-foreground placeholder:text-muted-foreground/40 outline-none focus:border-[#1A73E8] transition-colors pr-10"
            />
            <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground/30" />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me + Forgot Password row — matching reference layout */}
        <div className="flex items-center justify-between">
          <label htmlFor="remember-me" className="flex items-center gap-2 cursor-pointer select-none">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#1A73E8] cursor-pointer"
            />
            <span className="text-sm font-medium text-[#1A73E8]">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-[#1A73E8] hover:underline"
          >
            Forgot Password ?
          </Link>
        </div>

        {/* Submit — pill-shaped, bold uppercase, matching reference blue */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full max-w-[260px] h-12 rounded-full font-bold text-sm uppercase tracking-[0.15em] text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#1A73E8' }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in…
              </>
            ) : (
              'SIGN IN'
            )}
          </button>
        </div>

        {/* Sign up link */}
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-semibold text-[#1A73E8] hover:underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
