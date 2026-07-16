import { createClient } from '@supabase/supabase-js'

// Admin (service-role) Supabase client.
// SERVER-ONLY — import this file ONLY from Route Handlers or Server Actions.
// The service role key bypasses RLS; never let it reach the browser.
// Enforced by: SUPABASE_SERVICE_ROLE_KEY is not prefixed NEXT_PUBLIC_,
// so Next.js will never bundle it into client-side code.
export const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
