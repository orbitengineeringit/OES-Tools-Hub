import { z } from 'zod'

export const ProfileUpdateSchema = z.object({
  full_name:   z.string().min(1, 'Name is required').max(100),
  department:  z.string().max(100).optional(),
  designation: z.string().max(100).optional(),
  bio:         z.string().max(500).optional(),
})

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>

// Full profile shape (as returned from DB) — derived so it can never drift
export const ProfileSchema = ProfileUpdateSchema.extend({
  id:         z.string().uuid(),
  photo_url:  z.string().url().nullable().optional(),
  role:       z.enum(['admin', 'employee']),
  is_active:  z.boolean(),
  created_at: z.string().datetime(),
})

export type Profile = z.infer<typeof ProfileSchema>
