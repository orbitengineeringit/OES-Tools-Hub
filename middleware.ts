import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// ────────────────────────────────────────────────────────────
// In-process rate limiter (sliding window)
//
// Stores hit counts in a module-level Map. This works correctly in
// single-process environments (dev, single Vercel function). For
// multi-instance production, replace with an Upstash Redis counter
// (see DECISIONS.md ADR-005 and .env.example UPSTASH_* vars).
//
// Limits:
//   - Auth routes (/login, /signup, /forgot-password, /api/auth/*)
//     → 20 requests per 60 s per IP
// ────────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000  // 1 minute
const RATE_LIMIT_MAX = 20            // max requests per window per IP

interface HitRecord {
  count: number
  windowStart: number
}

// Module-level Map — shared across requests on the same process
const hitMap = new Map<string, HitRecord>()

// Paths that trigger rate limiting (prefix match)
const RATE_LIMITED_PREFIXES = ['/login', '/signup', '/forgot-password', '/api/auth/']

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const record = hitMap.get(ip)

  if (!record || now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
    // New window
    hitMap.set(ip, { count: 1, windowStart: now })
    return false
  }

  record.count++
  if (record.count > RATE_LIMIT_MAX) {
    return true
  }
  return false
}

function shouldRateLimit(pathname: string): boolean {
  return RATE_LIMITED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

// ────────────────────────────────────────────────────────────
// Middleware
// ────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rate limit check — before session refresh to fail fast
  if (shouldRateLimit(pathname)) {
    // Best-effort IP extraction: prefer x-forwarded-for (set by Vercel/proxies),
    // fall back to the connection IP. Never trust client-supplied header blindly
    // in prod — Vercel sets this reliably from the real IP.
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'

    if (isRateLimited(ip)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: { code: 'RATE_LIMITED', message: 'Too many requests. Please wait a moment.' },
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        },
      )
    }
  }

  // Periodic cleanup — prevent unbounded Map growth
  if (hitMap.size > 10000) {
    const now = Date.now()
    for (const [key, record] of hitMap) {
      if (now - record.windowStart >= RATE_LIMIT_WINDOW_MS) {
        hitMap.delete(key)
      }
    }
  }

  // ── Supabase SSR session refresh ──────────────────────────
  // Check if any Supabase auth cookie exists before calling getUser().
  // If no auth cookie is present, skip the remote network call to fail fast & save ~150-300ms RTT.
  const hasAuthCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') || c.name.includes('auth-token'),
  )

  let supabaseResponse = NextResponse.next({ request })

  if (!hasAuthCookie) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Refresh the session when auth cookies exist.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|ico|css|js|map)$).*)',
  ],
}
