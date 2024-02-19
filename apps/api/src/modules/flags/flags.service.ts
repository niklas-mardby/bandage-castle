import { prisma } from '../../db/prisma'
import { NotFoundError } from '../../errors/httpErrors'

// Flags are read on almost every billing request, so keep them in memory for a bit.
const TTL_MS = 30_000
let cache: { at: number; flags: Record<string, boolean> } | null = null

export async function allFlags(): Promise<Record<string, boolean>> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.flags
  const rows = await prisma.featureFlag.findMany()
  const flags = Object.fromEntries(rows.map((r) => [r.key, r.enabled]))
  cache = { at: Date.now(), flags }
  return flags
}

export async function isEnabled(key: string): Promise<boolean> {
  return (await allFlags())[key] === true
}

export async function listFlagsDetailed() {
  return prisma.featureFlag.findMany({ orderBy: { key: 'asc' } })
}

export async function setFlag(key: string, enabled: boolean) {
  const flag = await prisma.featureFlag.findUnique({ where: { key } })
  if (!flag) throw new NotFoundError('Flag')
  cache = null
  return prisma.featureFlag.update({ where: { key }, data: { enabled } })
}
