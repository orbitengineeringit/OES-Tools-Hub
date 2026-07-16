// Shared TypeScript types — derived from Zod schemas so they never drift.
// Import from 'lib/validation/*' for the schema itself; import from here for the type.
export type { Profile, ProfileUpdate } from '@/lib/validation/profile'
export type { Tool, ToolCreate, ToolUpdate } from '@/lib/validation/tool'
export type { Access, AccessGrant } from '@/lib/validation/access'

// Standard API response envelope — matches API_RULES.md Section 1
export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = {
  success: false
  error: { code: string; message: string }
}
export type ApiResponse<T> = ApiSuccess<T> | ApiError

// Pagination wrapper — used by list endpoints that support paging (API_RULES.md Section 5)
export type PaginatedData<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}
