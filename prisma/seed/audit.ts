// A little history for the audit log page.
import type { PrismaClient } from '@prisma/client'
import { at, type Rng } from './random'
import type { World } from './world'

export async function seedAudit(prisma: PrismaClient, rng: Rng, world: World) {
  const tickets = await prisma.ticket.findMany({ select: { id: true, priority: true, assigneeId: true }, orderBy: { id: 'desc' }, take: 15 })
  const entries = []
  for (const t of tickets) {
    const actor = rng.pick([world.users.keeper.id, world.users.keeper2.id, world.users.frontdesk.id, world.users.admin.id])
    entries.push({
      actorId: actor,
      entity: 'ticket',
      entityId: String(t.id),
      action: 'UPDATE',
      before: { priority: rng.pick(['LOW', 'MEDIUM']) },
      after: { priority: t.priority },
      createdAt: at(-rng.int(1, 25), rng.int(8, 18)),
    })
  }
  entries.push({
    actorId: world.users.admin.id,
    entity: 'user',
    entityId: String(world.users.scribe.id),
    action: 'UPDATE',
    before: { roles: ['STAFF'] },
    after: { roles: ['SCRIBE'] },
    createdAt: at(-30, 10),
  })
  entries.push({
    actorId: world.users.admin.id,
    entity: 'flag',
    entityId: 'ENABLE_BILLING_V2',
    action: 'UPDATE',
    before: { enabled: false },
    after: { enabled: true },
    createdAt: at(-21, 9, 2),
  })
  entries.push({
    actorId: world.users.admin.id,
    entity: 'flag',
    entityId: 'ENABLE_BILLING_V2',
    action: 'UPDATE',
    before: { enabled: true },
    after: { enabled: false },
    createdAt: at(-21, 9, 14),
  })
  await prisma.auditLog.createMany({ data: entries })
  return entries.length
}
