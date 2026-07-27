import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://placeholder-project.supabase.co'

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'placeholder-anon-key'

if (!import.meta.env.VITE_SUPABASE_URL && !import.meta.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn(
    '⚠️ Supabase URL is missing from environment variables. Please configure VITE_SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) in Vercel settings.'
  )
}

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function getSupabaseClient() {
  return supabase
}
