import { createBrowserClient } from '@supabase/ssr'

// Anon client — safe to use in client components.
// Respects RLS. Never holds or exposes the service role key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
