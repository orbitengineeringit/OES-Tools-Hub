import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail, Lock, CheckCircle2 } from 'lucide-react'

import { supabase } from '@/lib/supabase'
import { GoogleIcon } from '@/components/icons/GoogleIcon'
import { isEmailAllowed } from '@/lib/email-whitelist'

const SignupSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
type SignupValues = z.infer<typeof SignupSchema>

export function SignupPage() {
  const [searchParams] = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(SignupSchema) })

  useEffect(() => {
    if (searchParams.get('error') === 'oauth') {
      toast.error('Google sign-up failed. Please try again.')
    }
  }, [searchParams])

  async function onSubmit(values: SignupValues) {
    if (!isEmailAllowed(values.email)) {
      toast.error('This email address is not authorized for OES Tools Hub.')
      return
    }
    setIsLoading(true)
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    setIsLoading(false)

    if (error) {
      if (error.message.toLowerCase().includes('already registered')) {
        toast.error('An account with this email already exists. Try signing in instead.')
      } else {
        toast.error('Sign-up failed. Please try again.')
      }
      return
    }

    setEmailSent(true)
  }

  async function handleGoogleSignUp() {
    setIsGoogleLoading(true)
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
  }

  if (emailSent) {
    return (
      <div className="w-full space-y-8 text-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Orbit logo" className="w-12 h-12 object-contain" />
          <h2 className="text-lg font-bold tracking-tight" style={{ color: '#1A73E8' }}>ORBIT</h2>
        </div>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-16 w-16 rounded-full flex items-center justify-center bg-[#1A73E8]/10">
            <CheckCircle2 className="h-8 w-8 text-[#1A73E8]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">Check your email</h1>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              We sent a verification link to your email address. Click it to activate your account.
            </p>
          </div>
        </div>
        <Link to="/login" className="text-sm font-semibold text-[#1A73E8] hover:underline">
          ← Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Orbit logo" className="w-12 h-12 object-contain" />
          <div>
            <h2 className="text-lg font-bold tracking-tight" style={{ color: '#1A73E8' }}>ORBIT</h2>
            <p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-slate-500 -mt-0.5">AI Tools Hub</p>
          </div>
        </div>
        <p className="text-sm text-slate-500 font-medium italic">One Platform. All Solutions.</p>
      </div>

      <div className="space-y-5">
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isGoogleLoading || isLoading}
          className="w-full h-12 rounded-full border border-gray-300 bg-white text-sm font-semibold text-gray-700 flex items-center justify-center gap-3 transition-all hover:bg-gray-50 hover:shadow-md hover:border-gray-400 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <GoogleIcon className="h-5 w-5" />
          )}
          Sign up with Google
        </button>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <div className="space-y-1">
          <label htmlFor="signup-email" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Work email</label>
          <div className="relative">
            <input
              id="signup-email" type="email" autoComplete="email" placeholder="you@company.com"
              aria-invalid={!!errors.email} {...register('email')}
              className="w-full h-10 bg-transparent border-b-2 border-gray-300 text-sm text-slate-900 placeholder:text-gray-400 outline-none focus:border-[#1A73E8] transition-colors pr-10"
            />
            <Mail className="absolute right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="signup-password" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Password</label>
          <div className="relative">
            <input
              id="signup-password" type="password" autoComplete="new-password" placeholder="Minimum 8 characters"
              aria-invalid={!!errors.password} {...register('password')}
              className="w-full h-10 bg-transparent border-b-2 border-gray-300 text-sm text-slate-900 placeholder:text-gray-400 outline-none focus:border-[#1A73E8] transition-colors pr-10"
            />
            <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          </div>
          {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
        </div>

        <div className="space-y-1">
          <label htmlFor="signup-confirm" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Confirm password</label>
          <div className="relative">
            <input
              id="signup-confirm" type="password" autoComplete="new-password" placeholder="••••••"
              aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')}
              className="w-full h-10 bg-transparent border-b-2 border-gray-300 text-sm text-slate-900 placeholder:text-gray-400 outline-none focus:border-[#1A73E8] transition-colors pr-10"
            />
            <Lock className="absolute right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit" disabled={isLoading || isGoogleLoading}
            className="w-full max-w-[260px] h-12 rounded-full font-bold text-sm uppercase tracking-[0.15em] text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ background: '#1A73E8' }}
          >
            {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Creating…</>) : 'SIGN UP'}
          </button>
        </div>

        <p className="text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#1A73E8] hover:underline">Sign In</Link>
        </p>
      </form>
    </div>
  )
}
