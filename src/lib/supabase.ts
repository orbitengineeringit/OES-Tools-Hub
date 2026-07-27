import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof process !== 'undefined' && (process.env as Record<string, string | undefined>)?.NEXT_PUBLIC_SUPABASE_URL) ||
  ''

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && (process.env as Record<string, string | undefined>)?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  ''

export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

export function getSupabaseClient() {
  return supabase
}
