import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'
import type { CreateTicketInput, ListQuery, UpdateTicketInput } from './tickets.schema'

const userSelect = { select: { id: true, displayName: true, email: true } } as const

const listInclude = {
  assignee: userSelect,
  reporter: userSelect,
  _count: { select: { comments: true } },
} as const

export async function listTickets(query: ListQuery, userId: number) {
  const where: Prisma.TicketWhereInput = {}
  if (query.status) where.status = query.status
  if (query.priority) where.priority = query.priority
  if (query.assigneeId) where.assigneeId = query.assigneeId
  if (query.mine) where.assigneeId = userId

  const items = await prisma.ticket.findMany({
    where,
    include: listInclude,
    orderBy: { id: 'desc' },
    take: query.take + 1, // one extra so we know if there is another page
    ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
  })

  const hasMore = items.length > query.take
  return {
    items: items.slice(0, query.take),
    nextCursor: hasMore ? items[query.take].id : null,
  }
}

export async function getTicket(id: number) {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      ...listInclude,
      comments: { include: { author: userSelect }, orderBy: { createdAt: 'asc' } },
    },
  })
  if (!ticket) throw new NotFoundError('Ticket')
  return ticket
}

export async function createTicket(input: CreateTicketInput, reporterId: number) {
  return prisma.ticket.create({
    data: {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      reporterId,
    },
  })
}

export async function updateTicket(id: number, input: UpdateTicketInput) {
  await getTicket(id)
  return prisma.ticket.update({
    where: { id },
    data: {
      ...input,
      dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
    },
  })
}

export async function setStatus(id: number, status: string) {
  const ticket = await prisma.ticket.findUnique({ where: { id } })
  if (!ticket) throw new NotFoundError('Ticket')
  return prisma.ticket.update({
    where: { id },
    data: { status, closedAt: status === 'DONE' ? new Date() : null },
  })
}

export async function addComment(ticketId: number, authorId: number, body: string) {
  await getTicket(ticketId)
  return prisma.ticketComment.create({ data: { ticketId, authorId, body }, include: { author: userSelect } })
}

/** Staff that tickets can be assigned to. */
export async function assignees() {
  return prisma.user.findMany({
    where: { roles: { some: { role: { in: ['KEEPER', 'FRONT_DESK', 'VET', 'ADMIN', 'STAFF'] } } } },
    select: { id: true, displayName: true, email: true },
    orderBy: { displayName: 'asc' },
  })
}
