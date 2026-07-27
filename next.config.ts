import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow next/image to load images from Supabase Storage
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Optimize WebP and AVIF formats automatically
    formats: ['image/avif', 'image/webp'],
  },

  // Package import optimization for tree-shaking icons & animation libraries
  experimental: {
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@base-ui/react',
      'sonner',
      '@tanstack/react-query',
    ],
  },

  // Security headers — see SECURITY.md Section 4
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent this app from being iframed (ADR-004: cards always open in new tab)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Prevent MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Referrer info — keep it minimal for an internal tool
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features unused by this app (Phase 4 hardening)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // HSTS: tell browsers to only use HTTPS for the next year (Vercel enforces HTTPS in prod)
          // max-age=31536000 = 1 year; includeSubDomains covers all sub-paths
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          // Prevent DNS prefetch (minor info-leakage mitigation)
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          // Content Security Policy — covers all known asset origins
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // unsafe-* required by Next.js dev mode
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' blob: data: https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'", // belt-and-suspenders with X-Frame-Options
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig


