import { z } from 'zod'
import { prisma } from '../../db/prisma'
import { BadRequestError, NotFoundError } from '../../errors/httpErrors'
import * as audit from '../audit/audit.service'

const time = z.string().regex(/^\d{2}:\d{2}$/)
const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const

/** Every known setting and the shape of its value. Unknown keys are rejected. */
export const SETTING_SCHEMAS = {
  opening_hours: z.object({
    open: time,
    close: time,
    closedDays: z.array(z.enum(DAYS)),
    visitingFrom: time,
    visitingUntil: time,
  }),
  prices: z.object({
    defaultDailyRateGold: z.number().min(0),
    lateFeePerDayGold: z.number().min(0),
    treatmentSuppliesPerNightGold: z.number().min(0),
  }),
  castle: z.object({
    name: z.string().min(1).max(100),
    motto: z.string().max(200),
    emergencyRaven: z.string().max(100),
  }),
} as const

export type SettingKey = keyof typeof SETTING_SCHEMAS
export type Settings = { [K in SettingKey]: z.infer<(typeof SETTING_SCHEMAS)[K]> }

function isKey(key: string): key is SettingKey {
  return key in SETTING_SCHEMAS
}

export async function getAll(): Promise<Partial<Settings>> {
  const rows = await prisma.setting.findMany()
  return Object.fromEntries(rows.filter((r) => isKey(r.key)).map((r) => [r.key, r.value])) as Partial<Settings>
}

export async function get<K extends SettingKey>(key: K): Promise<Settings[K]> {
  const row = await prisma.setting.findUnique({ where: { key } })
  if (!row) throw new NotFoundError(`Setting ${key}`)
  return SETTING_SCHEMAS[key].parse(row.value) as Settings[K]
}

export async function set(key: string, value: unknown, actorId: number) {
  if (!isKey(key)) throw new BadRequestError(`Unknown setting: ${key}`)
  const parsed = SETTING_SCHEMAS[key].safeParse(value)
  if (!parsed.success) throw new BadRequestError('Invalid value', parsed.error.flatten())
  const before = await prisma.setting.findUnique({ where: { key } })
  const row = await prisma.setting.upsert({
    where: { key },
    update: { value: parsed.data, updatedBy: actorId },
    create: { key, value: parsed.data, updatedBy: actorId },
  })
  await audit.record({ actorId, entity: 'setting', entityId: key, action: 'UPDATE', ...audit.diff(before?.value as Record<string, unknown>, parsed.data) })
  return row
}
