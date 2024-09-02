import { z } from 'zod'

export const TICKET_STATUSES = ['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE'] as const
export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const
export const TICKET_CATEGORIES = ['MAINTENANCE', 'ESCAPE', 'CLEANING', 'SUPPLIES', 'OTHER'] as const

export const listQuerySchema = z.object({
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  assigneeId: z.coerce.number().int().positive().optional(),
  mine: z.coerce.boolean().optional(),
  cursor: z.coerce.number().int().positive().optional(),
  take: z.coerce.number().int().min(1).max(100).default(20),
})

export const createTicketSchema = z.object({
  title: z.string().trim().min(3).max(191),
  description: z.string().max(10000).optional(),
  priority: z.enum(TICKET_PRIORITIES).default('MEDIUM'),
  category: z.enum(TICKET_CATEGORIES).default('OTHER'),
  assigneeId: z.number().int().positive().nullable().optional(),
  lairId: z.number().int().positive().nullable().optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
})

export const updateTicketSchema = createTicketSchema.partial()

export const statusSchema = z.object({ status: z.enum(TICKET_STATUSES) })

export const commentSchema = z.object({ body: z.string().trim().min(1).max(5000) })

export type ListQuery = z.infer<typeof listQuerySchema>
export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
