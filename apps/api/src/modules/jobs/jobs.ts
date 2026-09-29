// Daily background jobs: reminders nobody had time to send by hand.
// Each job runs at most once per day (job_runs has a unique (name, runDate)).
import { prisma } from '../../db/prisma'
import { NotificationService } from '../notifications/notification.service'
import { lowStock } from '../supplies/supplies.service'

export type JobResult = string

export type Job = {
  name: string
  description: string
  /** hour of the day (castle time) after which the job may run */
  afterHour: number
  run: () => Promise<JobResult>
}

function today(): Date {
  const d = new Date()
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

function inDays(n: number): Date {
  return new Date(today().getTime() + n * 24 * 60 * 60 * 1000)
}

export const JOBS: Job[] = [
  {
    name: 'pickup-reminders',
    description: 'Remind owners whose monster should be picked up tomorrow',
    afterHour: 9,
    async run() {
      const stays = await prisma.stay.findMany({
        where: { status: 'CHECKED_IN', expectedPickup: inDays(1) },
        include: { monster: { select: { name: true } } },
      })
      for (const s of stays) {
        await NotificationService.notifyCustomer(s.customerId, `${s.monster.name} is ready tomorrow`, `Please collect ${s.monster.name} tomorrow. Late pickups are charged per day.`)
      }
      return `${stays.length} owner(s) reminded`
    },
  },
  {
    name: 'overdue-invoices',
    description: 'Tell the front desk which invoices are overdue',
    afterHour: 10,
    async run() {
      const overdue = await prisma.invoice.count({ where: { status: 'UNPAID', dueDate: { lt: today() } } })
      if (overdue > 0) {
        await NotificationService.notifyRole(['FRONT_DESK'], `${overdue} overdue invoice(s)`, 'Time to send some polite ravens.', '/invoices')
      }
      return `${overdue} overdue`
    },
  },
  {
    name: 'low-stock',
    description: 'Tell the keepers what is running low',
    afterHour: 7,
    async run() {
      const low = await lowStock()
      if (low.length > 0) {
        await NotificationService.notifyRole(['KEEPER'], `${low.length} supplies running low`, low.map((s) => s.name).join(', '), '/supplies/reorder')
      }
      return `${low.length} low`
    },
  },
  {
    name: 'unhoused-residents',
    description: 'Warn keepers about monsters in residence without a lair',
    afterHour: 8,
    async run() {
      const count = await prisma.monster.count({ where: { status: 'IN_RESIDENCE', lairAssignments: { none: { releasedAt: null } } } })
      if (count > 0) await NotificationService.notifyRole(['KEEPER'], `${count} monster(s) need a lair`, 'Check the lairs page.', '/lairs')
      return `${count} without a lair`
    },
  },
]

/** Runs a job unless it already ran today. Returns null if skipped. */
export async function runJob(job: Job, force = false): Promise<string | null> {
  const runDate = today()
  const existing = await prisma.jobRun.findUnique({ where: { name_runDate: { name: job.name, runDate } } })
  if (existing && !force) return null
  const run = existing
    ? await prisma.jobRun.update({ where: { id: existing.id }, data: { status: 'RUNNING', startedAt: new Date(), finishedAt: null } })
    : await prisma.jobRun.create({ data: { name: job.name, runDate } })
  try {
    const summary = await job.run()
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: 'OK', finishedAt: new Date(), summary } })
    return summary
  } catch (e) {
    await prisma.jobRun.update({ where: { id: run.id }, data: { status: 'FAILED', finishedAt: new Date(), summary: String(e).slice(0, 255) } })
    console.error(`job ${job.name} failed`, e)
    return null
  }
}

let timer: NodeJS.Timeout | null = null

/** Checks every 10 minutes whether a job is due. Disabled with JOBS=off (tests, scripts). */
export function startJobs() {
  if (timer || process.env.JOBS === 'off') return
  const tick = async () => {
    const hour = new Date().getHours()
    for (const job of JOBS) {
      if (hour >= job.afterHour) await runJob(job).catch((e) => console.error(e))
    }
  }
  timer = setInterval(tick, 10 * 60 * 1000)
  setTimeout(tick, 15_000)
}

export async function recentRuns() {
  return prisma.jobRun.findMany({ orderBy: { startedAt: 'desc' }, take: 50 })
}
