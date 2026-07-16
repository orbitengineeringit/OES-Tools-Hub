import { z } from 'zod'

export const AccessGrantSchema = z.object({
  tool_id: z.string().uuid('tool_id must be a valid UUID'),
  user_id: z.string().uuid('user_id must be a valid UUID'),
})

export type AccessGrant = z.infer<typeof AccessGrantSchema>

// Full access row shape (as returned from DB)
export const AccessSchema = AccessGrantSchema.extend({
  id:         z.string().uuid(),
  granted_by: z.string().uuid().nullable().optional(),
  granted_at: z.string().datetime(),
})

export type Access = z.infer<typeof AccessSchema>
