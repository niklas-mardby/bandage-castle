import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'
import { BadRequestError, NotFoundError } from '../../errors/httpErrors'
import { nextSessionDate, progressOf } from './progress'
import type { CreatePlanInput, SessionInput, UpdatePlanInput } from './therapy.schema'

const monsterSelect = { select: { id: true, name: true, species: { select: { name: true } } } } as const

export async function listPlans(filter: { status?: string; therapistId?: number; monsterId?: number }) {
  const where: Prisma.TherapyPlanWhereInput = {}
  if (filter.status) where.status = filter.status
  if (filter.therapistId) where.therapistId = filter.therapistId
  if (filter.monsterId) where.monsterId = filter.monsterId

  const plans = await prisma.therapyPlan.findMany({
    where,
    include: {
      monster: monsterSelect,
      sessions: { select: { sessionDate: true, moodBefore: true, moodAfter: true }, orderBy: { sessionDate: 'asc' } },
    },
    orderBy: [{ status: 'asc' }, { startedAt: 'desc' }],
  })
  return plans.map(({ sessions, ...plan }) => {
    const last = sessions[sessions.length - 1]
    return {
      ...plan,
      progress: progressOf(sessions),
      lastSessionDate: last?.sessionDate ?? null,
      nextSessionDate: plan.status === 'ACTIVE' ? nextSessionDate(last) : null,
    }
  })
}

export async function getPlan(id: number) {
  const plan = await prisma.therapyPlan.findUnique({
    where: { id },
    include: { monster: monsterSelect, sessions: { orderBy: { sessionDate: 'desc' } } },
  })
  if (!plan) throw new NotFoundError('Therapy plan')
  const therapist = await prisma.user.findUnique({ where: { id: plan.therapistId }, select: { id: true, displayName: true } })
  return { ...plan, therapist, progress: progressOf(plan.sessions) }
}

export async function createPlan(input: CreatePlanInput, therapistId: number) {
  const monster = await prisma.monster.findUnique({ where: { id: input.monsterId } })
  if (!monster) throw new NotFoundError('Monster')
  const active = await prisma.therapyPlan.findFirst({ where: { monsterId: input.monsterId, issue: input.issue, status: 'ACTIVE' } })
  if (active) throw new BadRequestError(`${monster.name} already has an active plan for this`)
  return prisma.therapyPlan.create({
    data: { ...input, startedAt: new Date(input.startedAt), therapistId },
  })
}

export async function updatePlan(id: number, input: UpdatePlanInput) {
  const plan = await prisma.therapyPlan.findUnique({ where: { id } })
  if (!plan) throw new NotFoundError('Therapy plan')
  return prisma.therapyPlan.update({
    where: { id },
    data: {
      ...input,
      endedAt: input.status === 'COMPLETED' ? new Date() : input.status ? null : undefined,
    },
  })
}

export async function addSession(planId: number, input: SessionInput) {
  const plan = await prisma.therapyPlan.findUnique({ where: { id: planId } })
  if (!plan) throw new NotFoundError('Therapy plan')
  if (plan.status === 'COMPLETED') throw new BadRequestError('This plan is completed. Reopen it first.')
  return prisma.therapySession.create({ data: { ...input, sessionDate: new Date(input.sessionDate), planId } })
}
