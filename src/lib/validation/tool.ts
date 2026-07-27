import { z } from 'zod'

const TOOL_CATEGORIES = [
  'Communication',
  'Productivity',
  'Analytics',
  'Engineering',
  'Design',
  'HR',
  'Finance',
  'Other',
] as const

export const ToolCreateSchema = z.object({
  title:       z.string().min(1, 'Title is required').max(100),
  description: z.string().max(500).optional().nullable(),
  url:         z.string().url('Must be a valid URL'),
  category:    z.enum(TOOL_CATEGORIES).optional(),
  is_active:   z.boolean(),
})

export const ToolUpdateSchema = ToolCreateSchema.partial()

export type ToolCreate = z.infer<typeof ToolCreateSchema>
export type ToolUpdate = z.infer<typeof ToolUpdateSchema>

export const ToolSchema = ToolCreateSchema.extend({
  id:         z.string().uuid(),
  image_url:  z.string().url().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  created_at: z.string(),
})

export type Tool = z.infer<typeof ToolSchema>

export { TOOL_CATEGORIES }
