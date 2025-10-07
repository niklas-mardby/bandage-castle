import type { Prisma } from '@prisma/client'
import { prisma } from '../../db/prisma'

export type AuditEntry = {
  actorId: number | null | undefined
  entity: string
  entityId: string | number
  action: string
  before?: unknown
  after?: unknown
}

/** Only keep the fields that actually changed, so the log stays readable. */
export function diff(before: Record<string, unknown> | null | undefined, after: Record<string, unknown> | null | undefined) {
  if (!before || !after) return { before: before ?? null, after: after ?? null }
  const b: Record<string, unknown> = {}
  const a: Record<string, unknown> = {}
  for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (key === 'updatedAt') continue
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      b[key] = before[key]
      a[key] = after[key]
    }
  }
  return { before: b, after: a }
}

function toJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined || value === null) return undefined
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue
}

/**
 * Write an audit entry. Never throws: a failing audit write must not break
 * the actual change (we log and move on).
 */
export async function record(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        entity: entry.entity,
        entityId: String(entry.entityId),
        action: entry.action,
        before: toJson(entry.before),
        after: toJson(entry.after),
      },
    })
  } catch (e) {
    console.error('audit write failed', e)
  }
}

export async function list(filter: { entity?: string; entityId?: string; actorId?: number; take?: number; before?: number }) {
  const where: Prisma.AuditLogWhereInput = {}
  if (filter.entity) where.entity = filter.entity
  if (filter.entityId) where.entityId = filter.entityId
  if (filter.actorId) where.actorId = filter.actorId
  if (filter.before) where.id = { lt: filter.before }
  const rows = await prisma.auditLog.findMany({ where, orderBy: { id: 'desc' }, take: filter.take ?? 50 })
  const actors = await prisma.user.findMany({
    where: { id: { in: rows.map((r) => r.actorId).filter((id): id is number => id !== null) } },
    select: { id: true, displayName: true, email: true },
  })
  const byId = new Map(actors.map((a) => [a.id, a]))
  return rows.map((r) => ({ ...r, actor: r.actorId ? (byId.get(r.actorId) ?? null) : null }))
}
