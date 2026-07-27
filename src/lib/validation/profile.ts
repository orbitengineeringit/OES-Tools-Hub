import { z } from 'zod'

export const ProfileUpdateSchema = z.object({
  full_name:   z.string().min(1, 'Name is required').max(100),
  department:  z.string().max(100).optional().nullable(),
  designation: z.string().max(100).optional().nullable(),
  bio:         z.string().max(500).optional().nullable(),
})

export type ProfileUpdate = z.infer<typeof ProfileUpdateSchema>

export const ProfileSchema = ProfileUpdateSchema.extend({
  id:         z.string().uuid(),
  photo_url:  z.string().url().nullable().optional(),
  role:       z.enum(['admin', 'employee']),
  is_active:  z.boolean(),
  created_at: z.string(),
})

export type Profile = z.infer<typeof ProfileSchema>
