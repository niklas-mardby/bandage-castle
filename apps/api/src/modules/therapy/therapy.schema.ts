import { z } from 'zod'

export const THERAPY_ISSUES = [
  'ADVENTURER_TRAUMA',
  'FEAR_OF_TORCHES',
  'HOARDING_ANXIETY',
  'BRIDGE_TRAUMA',
  'FEAR_OF_SWORDS',
  'SEPARATION_ANXIETY',
  'OTHER',
] as const

export const PLAN_STATUSES = ['ACTIVE', 'PAUSED', 'COMPLETED'] as const

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
const mood = z.number().int().min(1).max(10)

export const createPlanSchema = z.object({
  monsterId: z.number().int().positive(),
  issue: z.enum(THERAPY_ISSUES),
  goals: z.string().trim().min(10).max(5000),
  startedAt: dateOnly,
})

export const updatePlanSchema = z.object({
  goals: z.string().trim().min(10).max(5000).optional(),
  status: z.enum(PLAN_STATUSES).optional(),
})

export const sessionSchema = z.object({
  sessionDate: dateOnly,
  durationMin: z.number().int().min(10).max(240).default(50),
  moodBefore: mood,
  moodAfter: mood,
  notes: z.string().trim().min(3).max(10000),
  homework: z.string().trim().max(255).optional(),
})

export type CreatePlanInput = z.infer<typeof createPlanSchema>
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>
export type SessionInput = z.infer<typeof sessionSchema>
