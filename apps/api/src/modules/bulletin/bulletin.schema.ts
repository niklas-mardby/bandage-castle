import { z } from 'zod'

export const pageSchema = z.object({
  title: z.string().trim().min(3).max(191),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers and dashes')
    .max(191)
    .optional(),
  bodyMd: z.string().max(100_000),
  kind: z.enum(['PAGE', 'POST']).default('POST'),
  pinned: z.boolean().optional(),
})

export type PageInput = z.infer<typeof pageSchema>
