import { z } from 'zod'
import { CONTACT_PREFS } from '@bandage/shared'

export const customerSchema = z.object({
  title: z.string().trim().max(64).nullable().optional(),
  firstName: z.string().trim().max(100).nullable().optional(),
  lastName: z.string().trim().min(1, 'Every villain needs a surname').max(100),
  email: z.string().trim().toLowerCase().email().nullable().optional(),
  contactPref: z.enum(CONTACT_PREFS).default('raven'),
  lairAddress: z.string().max(2000).nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
})

export const contactPrefSchema = z.object({ contactPref: z.enum(CONTACT_PREFS) })

export const listQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  hasLogin: z.enum(['yes', 'no']).optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>
