/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_ALLOWED_EMAILS?: string
  readonly VITE_ALLOWED_DOMAINS?: string
  readonly NEXT_PUBLIC_SUPABASE_URL?: string
  readonly NEXT_PUBLIC_SUPABASE_ANON_KEY?: string
  readonly NEXT_PUBLIC_ALLOWED_EMAILS?: string
  readonly NEXT_PUBLIC_ALLOWED_DOMAINS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
