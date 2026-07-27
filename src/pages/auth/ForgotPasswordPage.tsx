import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, Mail } from 'lucide-react'

import { supabase } from '@/lib/supabase'

const ForgotSchema = z.object({
  email: z.string().email('Enter a valid email address'),
})
type ForgotValues = z.infer<typeof ForgotSchema>

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotValues>({ resolver: zodResolver(ForgotSchema) })

  async function onSubmit(values: ForgotValues) {
    setIsLoading(true)
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsLoading(false)

    if (error) {
      toast.error('Failed to send reset email. Please try again.')
      return
    }

    setSent(true)
  }

  if (sent) {
    return (
      <div className="w-full space-y-8 text-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Orbit logo" className="w-12 h-12 object-contain" />
          <h2 className="text-lg font-bold tracking-tight" style={{ color: '#1A73E8' }}>ORBIT</h2>
        </div>
        <div className="flex flex-col items-center gap-4 py-6">
          <div className="h-16 w-16 rounded-full flex items-center justify-center bg-[#1A73E8]/10">
            <Mail className="h-8 w-8 text-[#1A73E8]" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900">Reset link sent</h1>
            <p className="text-sm text-slate-500 max-w-xs mx-auto">
              If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
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

      <div className="space-y-1">
        <h1 className="text-xl font-bold text-slate-900">Forgot password?</h1>
        <p className="text-sm text-slate-500">Enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <div className="space-y-1">
          <label htmlFor="forgot-email" className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</label>
          <div className="relative">
            <input
              id="forgot-email" type="email" autoComplete="email" placeholder="you@company.com"
              aria-invalid={!!errors.email} {...register('email')}
              className="w-full h-10 bg-transparent border-b-2 border-gray-300 text-sm text-slate-900 placeholder:text-gray-400 outline-none focus:border-[#1A73E8] transition-colors pr-10"
            />
            <Mail className="absolute right-2 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
          </div>
          {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
        </div>

        <div className="pt-2">
          <button
            type="submit" disabled={isLoading}
            className="w-full max-w-[260px] h-12 rounded-full font-bold text-sm uppercase tracking-[0.15em] text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            style={{ background: '#1A73E8' }}
          >
            {isLoading ? (<><Loader2 className="h-4 w-4 animate-spin" />Sending…</>) : 'SEND RESET LINK'}
          </button>
        </div>

        <p className="text-sm text-slate-500">
          <Link to="/login" className="hover:text-slate-900 transition-colors">← Back to sign in</Link>
        </p>
      </form>
    </div>
  )
}
